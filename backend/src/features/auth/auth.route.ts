import type { FastifyInstance } from "fastify";
import { hash, verify } from "@node-rs/argon2";
import jwt from "jsonwebtoken";
import { google } from "googleapis";
import { createId } from "@paralleldrive/cuid2";
import { randomInt, randomBytes, createHash } from "crypto";
import { db } from "../../core/db.js";
import { users, sessions, passwordResetTokens, otpTokens } from "../../core/schema.js";
import { eq } from "drizzle-orm";
import { sendOtpEmail, sendPasswordResetEmail } from "../../core/mailer.js";
import { verifyTurnstile } from "../../core/turnstile.js";
import { requireAuth } from "../../core/auth.middleware.js";

const ALLOWED_EMAIL_DOMAINS = [
  "gmail.com", "yahoo.com", "yahoo.co.id", "outlook.com", "hotmail.com",
  "icloud.com", "live.com", "protonmail.com", "mail.com", "googlemail.com",
];

function isEmailDomainAllowed(email: string): boolean {
  const parts = email.toLowerCase().trim().split("@");
  if (parts.length !== 2 || !parts[1]) return false;
  return ALLOWED_EMAIL_DOMAINS.includes(parts[1]);
}

function isPasswordStrong(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  );
}

async function isPasswordBreached(password: string): Promise<boolean> {
  try {
    const sha1 = createHash("sha1").update(password).digest("hex").toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return false;

    const text = await res.text();
    const lines = text.split("\n");

    for (const line of lines) {
      const [hashSuffix] = line.split(":");
      if (hashSuffix?.trim() === suffix) return true;
    }

    return false;
  } catch {
    return false;
  }
}

function signTokens(userId: string, role: string) {
  const accessToken  = jwt.sign({ userId, role }, process.env.JWT_ACCESS_SECRET!,  { expiresIn: "15m" });
  const refreshToken = jwt.sign({ userId },       process.env.JWT_REFRESH_SECRET!, { expiresIn: "7d"  });
  return { accessToken, refreshToken };
}

function setRefreshCookie(reply: any, token: string) {
  reply.setCookie("refresh_token", token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    path:     "/",
    domain:   process.env.NODE_ENV === "production" ? ".kawaltransaksi.com" : undefined,
    maxAge:   60 * 60 * 24 * 7,
  });
}

function clearRefreshCookie(reply: any) {
  reply.clearCookie("refresh_token", {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    path:     "/",
    domain:   process.env.NODE_ENV === "production" ? ".kawaltransaksi.com" : undefined,
  });
}

async function saveSession(userId: string, refreshToken: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({ userId, refreshToken, expiresAt });
}

async function deleteSession(refreshToken: string) {
  await db.delete(sessions).where(eq(sessions.refreshToken, refreshToken));
}

async function sendOtp(userId: string, email: string, name: string) {
  const otp       = randomInt(100000, 999999).toString();
  const otpHash   = await hash(otp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await db.delete(otpTokens).where(eq(otpTokens.userId, userId));
  await db.insert(otpTokens).values({ userId, otpHash, expiresAt });
  await sendOtpEmail(email, name, otp);
}

function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!,
  );
}

export async function authRoutes(app: FastifyInstance) {
  app.post("/register", {
    config: { rateLimit: { max: 3, timeWindow: "1 hour" } },
  }, async (req, reply) => {
    const { name, email, password, turnstileToken } = req.body as {
      name: string; email: string; password: string; turnstileToken: string;
    };

    if (!name?.trim() || !email?.trim() || !password)
      return reply.status(400).send({ error: "Lengkapi dulu semua kolom yang tersedia." });

    const turnstileValid = await verifyTurnstile(turnstileToken, req.ip);
    if (!turnstileValid)
      return reply.status(400).send({ error: "Verifikasi keamanan gagal. Coba lagi." });

    const sanitizedEmail = email.trim().toLowerCase();

    if (!isEmailDomainAllowed(sanitizedEmail))
      return reply.status(400).send({ error: "Gunakan alamat email dari Gmail, Yahoo, Outlook, iCloud, atau ProtonMail." });

    if (!isPasswordStrong(password))
      return reply.status(400).send({ error: "Kata sandi minimal 8 karakter dan harus memuat huruf besar, angka, dan simbol." });

    const breached = await isPasswordBreached(password);
    if (breached)
      return reply.status(400).send({ error: "Kata sandi ini pernah bocor di internet. Pakai kata sandi lain yang belum pernah Anda gunakan di layanan mana pun." });

    const [existing] = await db.select().from(users).where(eq(users.email, sanitizedEmail)).limit(1);
    if (existing) return reply.status(409).send({ error: "Alamat email ini sudah terdaftar." });

    const passwordHash = await hash(password);
    const [user] = await db.insert(users).values({
      name:       name.trim(),
      email:      sanitizedEmail,
      passwordHash,
      isVerified: false,
    }).returning();

    await sendOtp(user.id, user.email, user.name);

    const { accessToken, refreshToken } = signTokens(user.id, user.role);
    await saveSession(user.id, refreshToken);
    setRefreshCookie(reply, refreshToken);

    return {
      accessToken,
      requiresVerification: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, isVerified: false },
    };
  });

  // Endpoint ini tidak butuh login dan userId-nya dikirim client, jadi siapa
  // pun yang tahu/menebak userId orang lain bisa memanggilnya berulang kali.
  // Counter `attempts` memang sudah mengunci per-OTP setelah 3 kali salah,
  // tapi tanpa rate limit sendiri penyerang tetap bisa membakar jatah
  // percobaan korban berkali-kali (korban jadi harus minta kode baru terus).
  app.post("/verify-otp", {
    config: { rateLimit: { max: 10, timeWindow: "15 minutes" } },
  }, async (req, reply) => {
    const { userId, otp } = req.body as { userId: string; otp: string };
    if (!userId || !otp) return reply.status(400).send({ error: "Kode verifikasi wajib diisi." });

    const [otpRecord] = await db.select().from(otpTokens)
      .where(eq(otpTokens.userId, userId)).limit(1);

    if (!otpRecord) return reply.status(400).send({ error: "Kode verifikasi tidak ditemukan. Minta kode baru terlebih dahulu." });
    if (otpRecord.expiresAt < new Date()) {
      await db.delete(otpTokens).where(eq(otpTokens.userId, userId));
      return reply.status(400).send({ error: "Kode verifikasi sudah kedaluwarsa. Minta kode baru terlebih dahulu." });
    }
    if (otpRecord.attempts >= 3) {
      await db.delete(otpTokens).where(eq(otpTokens.userId, userId));
      return reply.status(400).send({ error: "Percobaan sudah mencapai batas. Minta kode verifikasi baru." });
    }

    const valid = await verify(otpRecord.otpHash, otp.replace(/\s/g, ""));
    if (!valid) {
      await db.update(otpTokens)
        .set({ attempts: otpRecord.attempts + 1 })
        .where(eq(otpTokens.userId, userId));
      const remaining = 3 - (otpRecord.attempts + 1);
      return reply.status(400).send({ error: `Kode verifikasi salah. Sisa percobaan: ${remaining}.` });
    }

    await db.update(users).set({ isVerified: true, updatedAt: new Date() }).where(eq(users.id, userId));
    await db.delete(otpTokens).where(eq(otpTokens.userId, userId));

    return { message: "Email berhasil diverifikasi." };
  });

  app.post("/resend-otp", {
    config: { rateLimit: { max: 3, timeWindow: "1 hour" } },
  }, async (req, reply) => {
    const { userId } = req.body as { userId: string };
    if (!userId) return reply.status(400).send({ error: "Permintaan tidak valid." });

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return reply.status(404).send({ error: "Akun tidak ditemukan." });
    if (user.isVerified) return reply.status(400).send({ error: "Alamat email ini sudah terverifikasi." });

    const [existing] = await db.select().from(otpTokens).where(eq(otpTokens.userId, userId)).limit(1);
    if (existing) {
      const diffSeconds = (Date.now() - new Date(existing.createdAt).getTime()) / 1000;
      if (diffSeconds < 60) {
        const waitSeconds = Math.ceil(60 - diffSeconds);
        return reply.status(429).send({ error: `Mohon tunggu ${waitSeconds} detik sebelum meminta kode baru.` });
      }
    }

    await sendOtp(user.id, user.email, user.name);
    return { message: "Kode verifikasi baru telah dikirim ke email Anda." };
  });

  app.post("/login", {
    config: { rateLimit: { max: 5, timeWindow: "15 minutes" } },
  }, async (req, reply) => {
    const { email, password, turnstileToken } = req.body as {
      email: string; password: string; turnstileToken: string;
    };

    if (!email?.trim() || !password)
      return reply.status(400).send({ error: "Email dan kata sandi wajib diisi." });

    const turnstileValid = await verifyTurnstile(turnstileToken, req.ip);
    if (!turnstileValid)
      return reply.status(400).send({ error: "Verifikasi keamanan gagal. Coba lagi." });

    const [user] = await db.select().from(users).where(eq(users.email, email.trim().toLowerCase())).limit(1);
    if (!user || !user.passwordHash)
      return reply.status(401).send({ error: "Email atau kata sandi yang Anda masukkan salah." });

    const valid = await verify(user.passwordHash, password);
    if (!valid) return reply.status(401).send({ error: "Email atau kata sandi yang Anda masukkan salah." });

    const { accessToken, refreshToken } = signTokens(user.id, user.role);
    await saveSession(user.id, refreshToken);
    setRefreshCookie(reply, refreshToken);

    return {
      accessToken,
      requiresVerification: !user.isVerified,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified },
    };
  });

  app.post("/refresh", async (req, reply) => {
    const token = req.cookies?.refresh_token;
    if (!token) return reply.status(401).send({ error: "Sesi Anda tidak ditemukan. Silakan masuk kembali." });

    try {
      const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { userId: string };

      const [session] = await db.select().from(sessions)
        .where(eq(sessions.refreshToken, token)).limit(1);
      if (!session || session.expiresAt < new Date())
        return reply.status(401).send({ error: "Sesi Anda sudah berakhir. Silakan masuk kembali." });

      const [user] = await db.select().from(users)
        .where(eq(users.id, payload.userId)).limit(1);
      if (!user) return reply.status(401).send({ error: "Akun tidak ditemukan." });

      const accessToken = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_ACCESS_SECRET!,
        { expiresIn: "15m" }
      );

      return { accessToken };
    } catch {
      return reply.status(401).send({ error: "Sesi Anda tidak valid lagi. Silakan masuk kembali." });
    }
  });

  app.post("/logout", async (req, reply) => {
    const token = req.cookies?.refresh_token;
    if (token) await deleteSession(token);
    clearRefreshCookie(reply);
    return { message: "Anda telah keluar." };
  });

  app.get("/me", { preHandler: requireAuth }, async (req, reply) => {
    const [user] = await db.select({
      id:         users.id,
      name:       users.name,
      email:      users.email,
      role:       users.role,
      isVerified: users.isVerified,
    }).from(users).where(eq(users.id, req.user!.userId)).limit(1);

    if (!user) return reply.status(404).send({ error: "Akun tidak ditemukan." });
    return user;
  });

  app.patch("/me", { preHandler: requireAuth }, async (req, reply) => {
    const { name } = req.body as { name?: string };

    if (!name?.trim()) return reply.status(400).send({ error: "Nama tidak boleh kosong." });

    const [updated] = await db.update(users)
      .set({ name: name.trim(), updatedAt: new Date() })
      .where(eq(users.id, req.user!.userId))
      .returning({ id: users.id, name: users.name, email: users.email, role: users.role, isVerified: users.isVerified });

    return updated;
  });

  app.patch("/change-password", { preHandler: requireAuth }, async (req, reply) => {
    const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };

    if (!currentPassword || !newPassword)
      return reply.status(400).send({ error: "Lengkapi dulu semua kolom yang tersedia." });
    if (!isPasswordStrong(newPassword))
      return reply.status(400).send({ error: "Kata sandi baru minimal 8 karakter dan harus memuat huruf besar, angka, dan simbol." });

    const [user] = await db.select().from(users).where(eq(users.id, req.user!.userId)).limit(1);
    if (!user) return reply.status(404).send({ error: "Akun tidak ditemukan." });
    if (!user.passwordHash)
      return reply.status(400).send({ error: "Akun ini masuk lewat Google, jadi kata sandinya tidak bisa diubah di sini." });

    const valid = await verify(user.passwordHash, currentPassword);
    if (!valid) return reply.status(400).send({ error: "Kata sandi saat ini yang Anda masukkan salah." });

    const passwordHash = await hash(newPassword);
    await db.update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, req.user!.userId));

    return { message: "Kata sandi berhasil diperbarui." };
  });

  app.post("/forgot-password", {
    config: { rateLimit: { max: 3, timeWindow: "1 hour" } },
  }, async (req, reply) => {
    const { email } = req.body as { email: string };
    if (!email?.trim()) return reply.status(400).send({ error: "Alamat email wajib diisi." });

    const [user] = await db.select().from(users)
      .where(eq(users.email, email.trim().toLowerCase())).limit(1);

    if (!user) return { message: "Kalau email itu terdaftar, kami akan mengirimkan tautan untuk mengatur ulang kata sandi." };

    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));

    const token     = createId();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await db.insert(passwordResetTokens).values({ id: createId(), userId: user.id, token, expiresAt });

    const resetLink = `${process.env.FRONTEND_URL}/reset-kata-sandi/${token}`;
    await sendPasswordResetEmail(user.email, user.name, resetLink);

    return { message: "Kalau email itu terdaftar, kami akan mengirimkan tautan untuk mengatur ulang kata sandi." };
  });

  app.post("/reset-password", {
    config: { rateLimit: { max: 3, timeWindow: "15 minutes" } },
  }, async (req, reply) => {
    const { token, password } = req.body as { token: string; password: string };
    if (!token || !password) return reply.status(400).send({ error: "Tautan dan kata sandi baru wajib diisi." });
    if (!isPasswordStrong(password))
      return reply.status(400).send({ error: "Kata sandi minimal 8 karakter dan harus memuat huruf besar, angka, dan simbol." });

    const [resetToken] = await db.select().from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token)).limit(1);

    if (!resetToken) return reply.status(400).send({ error: "Tautan tidak valid." });
    if (resetToken.expiresAt < new Date()) {
      await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));
      return reply.status(400).send({ error: "Tautan ini sudah kedaluwarsa. Ajukan permintaan baru." });
    }

    const passwordHash = await hash(password);
    await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, resetToken.userId));
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));
    await db.delete(sessions).where(eq(sessions.userId, resetToken.userId));

    return { message: "Kata sandi berhasil diperbarui. Silakan masuk kembali dengan kata sandi baru." };
  });

  app.get("/google", async (_req, reply) => {
    const oauth2 = getOAuthClient();
    const state  = randomBytes(32).toString("hex");

    // State disimpan di cookie sendiri (bukan refresh_token) supaya scope-nya
    // sempit -- cuma dipakai untuk cegah OAuth login CSRF, dicek & dihapus lagi
    // begitu callback selesai diproses.
    reply.setCookie("google_oauth_state", state, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      path:     "/api/auth/google",
      maxAge:   10 * 60,
    });

    const url = oauth2.generateAuthUrl({
      access_type: "offline",
      scope: ["profile", "email"],
      prompt: "select_account",
      state,
    });
    return reply.redirect(url);
  });

  app.get("/google/callback", async (req, reply) => {
    const { code, state, error } = req.query as { code?: string; state?: string; error?: string };
    const frontendUrl   = process.env.FRONTEND_URL!;
    const expectedState = req.cookies?.google_oauth_state;

    reply.clearCookie("google_oauth_state", { path: "/api/auth/google" });

    if (error || !code)
      return reply.redirect(`${frontendUrl}/login?error=google_cancelled`);

    if (!state || !expectedState || state !== expectedState)
      return reply.redirect(`${frontendUrl}/login?error=google_failed`);

    try {
      // Tukar authorization code -> token & ambil profil user lewat SDK
      // googleapis (sudah jadi dependency untuk generateAuthUrl di /google)
      // alih-alih shell out ke `curl` lewat child_process -- lebih ringan
      // (tidak spawn proses baru per request) dan tidak butuh binary curl
      // di image Docker.
      const oauth2Client = getOAuthClient();
      const { tokens } = await oauth2Client.getToken(code);

      if (!tokens.access_token) {
        // Jangan log objek `tokens` -- bisa memuat access/refresh token Google
        // milik user di log server. Cukup catat bahwa pertukaran kode gagal.
        app.log.error("Google token exchange failed: no access_token in response");
        return reply.redirect(`${frontendUrl}/login?error=google_failed`);
      }

      oauth2Client.setCredentials(tokens);
      const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
      const { data: userData } = await oauth2.userinfo.get();

      if (!userData.email || !userData.name)
        return reply.redirect(`${frontendUrl}/login?error=google_no_email`);

      const email = userData.email.toLowerCase();
      let [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

      if (!user) {
        [user] = await db.insert(users).values({ name: userData.name, email, isVerified: true }).returning();
      }

      // Access token TIDAK dikirim lewat query string (bisa tersimpan di
      // history browser, header Referer, dan log proxy). Cukup set refresh
      // cookie httpOnly di sini; halaman /auth/callback akan menukarnya jadi
      // access token via /api/auth/refresh, sama seperti alur sesi biasa.
      const { refreshToken } = signTokens(user.id, user.role);
      await saveSession(user.id, refreshToken);
      setRefreshCookie(reply, refreshToken);

      return reply.redirect(`${frontendUrl}/auth/callback`);
    } catch (err) {
      app.log.error(err);
      return reply.redirect(`${frontendUrl}/login?error=google_failed`);
    }
  });
}