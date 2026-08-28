import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Helper bersama untuk semua route `opengraph-image.tsx`.
 *
 * Warna diambil PERSIS dari Navbar.tsx & Footer.tsx (Tailwind default, tanpa
 * config custom -- project ini Tailwind v4 tanpa tailwind.config):
 *   - Footer  : FOOTER_BG = #1a2332  (surface gelap brand)
 *   - Navbar  : wordmark "Kawal" = text-slate-900 (#0f172a),
 *               "Transaksi"      = text-emerald-700 (#047857)
 *   - body    : bg-zinc-50 (#fafafa)
 *   - Footer aksen: text-emerald-400 (#34d399), border-slate-700 (#334155),
 *               text-slate-400 (#94a3b8), text-slate-300 (#cbd5e1)
 */
export const OG = {
  bg: "#fafafa", // body bg-zinc-50
  ink: "#0f172a", // slate-900 -- "Kawal"
  emerald700: "#047857", // Navbar accent -- "Transaksi"
  emerald500: "#10b981", // globals.css blockquote accent
  emerald400: "#34d399", // Footer accent
  footerBg: "#1a2332", // Footer FOOTER_BG
  slate500: "#64748b",
  slate400: "#94a3b8",
  slate200: "#e2e8f0",
} as const;

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

let logoPromise: Promise<string> | null = null;
export function loadLogo(): Promise<string> {
  logoPromise ??= readFile(join(process.cwd(), "public", "logo.png")).then(
    (buf) => `data:image/png;base64,${buf.toString("base64")}`,
  );
  return logoPromise;
}

// Inter (font yang di-load next/font di app/layout.tsx). Satori tidak bisa baca
// cache woff2 milik next/font, jadi kita ambil varian .woff latin dari CDN
// @fontsource. Kalau fetch gagal (mis. jaringan CI diblokir), kembalikan
// undefined -> ImageResponse pakai font bawaannya, build tetap jalan.
let fontsPromise: Promise<OgFont[] | undefined> | null = null;

interface OgFont {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 600 | 700;
  style: "normal";
}

const FONT_BASE = "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.1.0/files";

async function fetchFont(weight: 400 | 600 | 700): Promise<OgFont> {
  const res = await fetch(`${FONT_BASE}/inter-latin-${weight}-normal.woff`);
  if (!res.ok) throw new Error(`font ${weight}: ${res.status}`);
  return { name: "Inter", data: await res.arrayBuffer(), weight, style: "normal" };
}

export function loadInterFonts(): Promise<OgFont[] | undefined> {
  fontsPromise ??= Promise.all([fetchFont(400), fetchFont(600), fetchFont(700)]).catch(
    (err) => {
      console.warn("[og] gagal memuat font Inter, pakai font bawaan:", err);
      return undefined;
    },
  );
  return fontsPromise;
}

/**
 * Kartu OG 1200x630 dipakai semua route. `title` = judul besar (dinamis atau
 * generik), `tagline` = baris kecil di bawahnya.
 */
export function OgCard({
  logo,
  title,
  tagline,
  eyebrow,
}: {
  logo: string;
  /** Judul besar sebagai teks polos; kata "Penipu" otomatis diwarnai emerald. */
  title: string;
  tagline: string;
  eyebrow?: string;
}) {
  const words = title.split(" ");
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: OG.bg,
        fontFamily: "Inter",
        position: "relative",
      }}
    >
      {/* Konten utama */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
        }}
      >
        {/* Wordmark ala Navbar */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} width={72} height={72} alt="" style={{ borderRadius: 16 }} />
          <div
            style={{
              display: "flex",
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: "-0.04em",
              textTransform: "uppercase",
            }}
          >
            <span style={{ color: OG.ink }}>Kawal</span>
            <span style={{ color: OG.emerald700 }}>Transaksi</span>
          </div>
        </div>

        {/* Judul */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {eyebrow ? (
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                background: "#ecfdf5",
                color: OG.emerald700,
                fontSize: 22,
                fontWeight: 600,
                padding: "8px 18px",
                borderRadius: 999,
                border: `1px solid ${OG.slate200}`,
              }}
            >
              {eyebrow}
            </div>
          ) : null}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              fontSize: 68,
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              maxWidth: 1000,
            }}
          >
            {words.map((w, i) => (
              <span
                key={i}
                style={{
                  color: w.replace(/[^A-Za-z]/g, "").toLowerCase() === "penipu"
                    ? OG.emerald700
                    : OG.ink,
                  marginRight: 16,
                }}
              >
                {w}
              </span>
            ))}
          </div>
          <div style={{ display: "flex", fontSize: 30, color: OG.slate500, maxWidth: 900 }}>
            {tagline}
          </div>
        </div>

        {/* URL */}
        <div style={{ display: "flex", fontSize: 24, fontWeight: 600, color: OG.slate400 }}>
          kawaltransaksi.com
        </div>
      </div>

      {/* Strip aksen bawah: garis emerald tipis + bar footer -- persis skema Footer */}
      <div style={{ display: "flex", height: 8, background: OG.emerald500 }} />
      <div style={{ display: "flex", height: 28, background: OG.footerBg }} />
    </div>
  );
}
