import type { FastifyInstance } from "fastify";
import { hash, verify } from "@node-rs/argon2";
import jwt from "jsonwebtoken";
import { google } from "googleapis";
import { createId } from "@paralleldrive/cuid2";
import { randomInt } from "crypto";
import { db } from "../../core/db.js";
import { users, sessions, passwordResetTokens, otpTokens } from "../../core/schema.js";
import { eq } from "drizzle-orm";
import { sendOtpEmail, sendPasswordResetEmail } from "../../core/mailer.js";
import { verifyTurnstile } from "../../core/turnstile.js";

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
      return reply.status(400).send({ error: "Semua field wajib diisi." });

    const turnstileValid = await verifyTurnstile(turnstileToken, req.ip);
    if (!turnstileValid)
      return reply.status(400).send({ error: "Verifikasi keamanan gagal. Silakan coba lagi." });

    const sanitizedEmail = email.trim().toLowerCase();

    if (!isEmailDomainAllowed(sanitizedEmail))
      return reply.status(400).send({ error: "Gunakan email dari Gmail, Yahoo, Outlook, iCloud, atau ProtonMail." });

    if (!isPasswordStrong(password))
      return reply.status(400).send({ error: "Kata sandi harus minimal 8 karakter, mengandung huruf besar, angka, dan simbol." });

    const [existing] = await db.select().from(users).where(eq(users.email, sanitizedEmail)).limit(1);
    if (existing) return reply.status(409).send({ error: "Email sudah terdaftar." });

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

  app.post("/verify-otp", async (req, reply) => {
    const { userId, otp } = req.body as { userId: string; otp: string };
    if (!userId || !otp) return reply.status(400).send({ error: "UserId dan OTP wajib diisi." });

    const [otpRecord] = await db.select().from(otpTokens)
      .where(eq(otpTokens.userId, userId)).limit(1);

    if (!otpRecord) return reply.status(400).send({ error: "OTP tidak ditemukan. Minta kirim ulang." });
    if (otpRecord.expiresAt < new Date()) {
      await db.delete(otpTokens).where(eq(otpTokens.userId, userId));
      return reply.status(400).send({ error: "OTP sudah kedaluwarsa. Minta kirim ulang." });
    }
    if (otpRecord.attempts >= 3) {
      await db.delete(otpTokens).where(eq(otpTokens.userId, userId));
      return reply.status(400).send({ error: "Terlalu banyak percobaan. Minta OTP baru." });
    }

    const valid = await verify(otpRecord.otpHash, otp.replace(/\s/g, ""));
    if (!valid) {
      await db.update(otpTokens)
        .set({ attempts: otpRecord.attempts + 1 })
        .where(eq(otpTokens.userId, userId));
      const remaining = 3 - (otpRecord.attempts + 1);
      return reply.status(400).send({ error: `OTP salah. Sisa percobaan: ${remaining}.` });
    }

    await db.update(users).set({ isVerified: true, updatedAt: new Date() }).where(eq(users.id, userId));
    await db.delete(otpTokens).where(eq(otpTokens.userId, userId));

    return { message: "Email berhasil diverifikasi." };
  });

  app.post("/resend-otp", {
    config: { rateLimit: { max: 3, timeWindow: "1 hour" } },
  }, async (req, reply) => {
    const { userId } = req.body as { userId: string };
    if (!userId) return reply.status(400).send({ error: "UserId wajib diisi." });

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return reply.status(404).send({ error: "User tidak ditemukan." });
    if (user.isVerified) return reply.status(400).send({ error: "Email sudah terverifikasi." });

    const [existing] = await db.select().from(otpTokens).where(eq(otpTokens.userId, userId)).limit(1);
    if (existing) {
      const diffSeconds = (Date.now() - new Date(existing.createdAt).getTime()) / 1000;
      if (diffSeconds < 60) {
        const waitSeconds = Math.ceil(60 - diffSeconds);
        return reply.status(429).send({ error: `Tunggu ${waitSeconds} detik sebelum kirim ulang.` });
      }
    }

    await sendOtp(user.id, user.email, user.name);
    return { message: "OTP baru telah dikirim ke email kamu." };
  });

  app.post("/login", {
    config: { rateLimit: { max: 5, timeWindow: "15 minutes" } },
  }, async (req, reply) => {
    const { email, password, turnstileToken } = req.body as {
      email: string; password: string; turnstileToken: string;
    };

    if (!email?.trim() || !password)
      return reply.status(400).send({ error: "Email dan password wajib diisi." });

    const turnstileValid = await verifyTurnstile(turnstileToken, req.ip);
    if (!turnstileValid)
      return reply.status(400).send({ error: "Verifikasi keamanan gagal. Silakan coba lagi." });

    const [user] = await db.select().from(users).where(eq(users.email, email.trim().toLowerCase())).limit(1);
    if (!user || !user.passwordHash)
      return reply.status(401).send({ error: "Email atau password salah." });

    const valid = await verify(user.passwordHash, password);
    if (!valid) return reply.status(401).send({ error: "Email atau password salah." });

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
    if (!token) return reply.status(401).send({ error: "No refresh token." });

    try {
      const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { userId: string };

      const [session] = await db.select().from(sessions)
        .where(eq(sessions.refreshToken, token)).limit(1);
      if (!session || session.expiresAt < new Date())
        return reply.status(401).send({ error: "Session expired or invalid." });

      const [user] = await db.select().from(users)
        .where(eq(users.id, payload.userId)).limit(1);
      if (!user) return reply.status(401).send({ error: "User not found." });

      const accessToken = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_ACCESS_SECRET!,
        { expiresIn: "15m" }
      );

      return { accessToken };
    } catch {
      return reply.status(401).send({ error: "Invalid refresh token." });
    }
  });

  app.post("/logout", async (req, reply) => {
    const token = req.cookies?.refresh_token;
    if (token) await deleteSession(token);
    clearRefreshCookie(reply);
    return { message: "Logged out." };
  });

  app.get("/me", async (req, reply) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return reply.status(401).send({ error: "Unauthorized." });

    try {
      const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as { userId: string };
      const [user]  = await db.select({
        id:         users.id,
        name:       users.name,
        email:      users.email,
        role:       users.role,
        isVerified: users.isVerified,
      }).from(users).where(eq(users.id, payload.userId)).limit(1);

      if (!user) return reply.status(404).send({ error: "User not found." });
      return user;
    } catch {
      return reply.status(401).send({ error: "Invalid token." });
    }
  });

  app.patch("/me", async (req, reply) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return reply.status(401).send({ error: "Unauthorized." });

    try {
      const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as { userId: string };
      const { name } = req.body as { name?: string };

      if (!name?.trim()) return reply.status(400).send({ error: "Nama tidak boleh kosong." });

      const [updated] = await db.update(users)
        .set({ name: name.trim(), updatedAt: new Date() })
        .where(eq(users.id, payload.userId))
        .returning({ id: users.id, name: users.name, email: users.email, role: users.role, isVerified: users.isVerified });

      return updated;
    } catch {
      return reply.status(401).send({ error: "Invalid token." });
    }
  });

  app.patch("/change-password", async (req, reply) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return reply.status(401).send({ error: "Unauthorized." });

    try {
      const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as { userId: string };
      const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };

      if (!currentPassword || !newPassword)
        return reply.status(400).send({ error: "Semua field wajib diisi." });
      if (!isPasswordStrong(newPassword))
        return reply.status(400).send({ error: "Kata sandi baru harus minimal 8 karakter, mengandung huruf besar, angka, dan simbol." });

      const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
      if (!user) return reply.status(404).send({ error: "User tidak ditemukan." });
      if (!user.passwordHash)
        return reply.status(400).send({ error: "Akun ini menggunakan Google login. Tidak bisa ganti password." });

      const valid = await verify(user.passwordHash, currentPassword);
      if (!valid) return reply.status(400).send({ error: "Password saat ini salah." });

      const passwordHash = await hash(newPassword);
      await db.update(users)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(users.id, payload.userId));

      return { message: "Password berhasil diubah." };
    } catch {
      return reply.status(401).send({ error: "Invalid token." });
    }
  });

  app.post("/forgot-password", {
    config: { rateLimit: { max: 3, timeWindow: "1 hour" } },
  }, async (req, reply) => {
    const { email } = req.body as { email: string };
    if (!email?.trim()) return reply.status(400).send({ error: "Email wajib diisi." });

    const [user] = await db.select().from(users)
      .where(eq(users.email, email.trim().toLowerCase())).limit(1);

    if (!user) return { message: "Jika email terdaftar, link reset akan dikirim." };

    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));

    const token     = createId();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await db.insert(passwordResetTokens).values({ id: createId(), userId: user.id, token, expiresAt });

    const resetLink = `${process.env.FRONTEND_URL}/reset-kata-sandi/${token}`;
    await sendPasswordResetEmail(user.email, user.name, resetLink);

    return { message: "Jika email terdaftar, link reset akan dikirim." };
  });

  app.post("/reset-password", {
    config: { rateLimit: { max: 3, timeWindow: "15 minutes" } },
  }, async (req, reply) => {
    const { token, password } = req.body as { token: string; password: string };
    if (!token || !password) return reply.status(400).send({ error: "Token dan password wajib diisi." });
    if (!isPasswordStrong(password))
      return reply.status(400).send({ error: "Kata sandi harus minimal 8 karakter, mengandung huruf besar, angka, dan simbol." });

    const [resetToken] = await db.select().from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token)).limit(1);

    if (!resetToken) return reply.status(400).send({ error: "Token tidak valid." });
    if (resetToken.expiresAt < new Date()) {
      await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));
      return reply.status(400).send({ error: "Token sudah kedaluwarsa. Minta reset ulang." });
    }

    const passwordHash = await hash(password);
    await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, resetToken.userId));
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));
    await db.delete(sessions).where(eq(sessions.userId, resetToken.userId));

    return { message: "Kata sandi berhasil diubah. Silakan login kembali." };
  });

  app.get("/google", async (_req, reply) => {
    const oauth2 = getOAuthClient();
    const url = oauth2.generateAuthUrl({
      access_type: "offline",
      scope: ["profile", "email"],
      prompt: "select_account",
    });
    return reply.redirect(url);
  });

  app.get("/google/callback", async (req, reply) => {
    const { code, error } = req.query as { code?: string; error?: string };
    const frontendUrl = process.env.FRONTEND_URL!;

    if (error || !code)
      return reply.redirect(`${frontendUrl}/login?error=google_cancelled`);

    try {
      const oauth2 = getOAuthClient();
      const { tokens } = await oauth2.getToken(code);
      oauth2.setCredentials(tokens);

      const oauth2Api = google.oauth2({ version: "v2", auth: oauth2 });
      const { data } = await oauth2Api.userinfo.get();

      if (!data.email || !data.name)
        return reply.redirect(`${frontendUrl}/login?error=google_no_email`);

      const email = data.email.toLowerCase();
      let [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

      if (!user) {
        [user] = await db.insert(users).values({ name: data.name, email, isVerified: true }).returning();
      }

      const { accessToken, refreshToken } = signTokens(user.id, user.role);
      await saveSession(user.id, refreshToken);
      setRefreshCookie(reply, refreshToken);

      return reply.redirect(`${frontendUrl}/auth/callback?token=${accessToken}`);
    } catch (err) {
      app.log.error(err);
      return reply.redirect(`${frontendUrl}/login?error=google_failed`);
    }
  });
}