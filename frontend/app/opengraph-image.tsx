import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        width: "1200px",
        height: "630px",
        background: "#fafafa",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "60px 72px",
        fontFamily: "sans-serif",
      }}
    >
      {/* Top: logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            background: "#0f172a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ color: "#fff", fontSize: "16px", fontWeight: 900 }}>K</div>
        </div>
        <span
          style={{
            fontSize: "18px",
            fontWeight: 700,
            color: "#0f172a",
            letterSpacing: "-0.5px",
          }}
        >
          KawalTransaksi
        </span>
      </div>

      {/* Middle: tagline utama */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#94a3b8",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          Platform Anti-Penipuan Komunitas Indonesia
        </div>
        <div
          style={{
            fontSize: "64px",
            fontWeight: 900,
            color: "#0f172a",
            letterSpacing: "-2px",
            lineHeight: 1.1,
            maxWidth: "800px",
          }}
        >
          Cek & Laporkan Nomor Penipu
        </div>
        <div
          style={{
            fontSize: "20px",
            color: "#64748b",
            fontWeight: 500,
            maxWidth: "680px",
            lineHeight: 1.5,
          }}
        >
          Periksa nomor HP, rekening bank, dan e-wallet terindikasi penipuan secara gratis. Dibangun dan diverifikasi oleh komunitas.
        </div>
      </div>

      {/* Bottom: fitur pills + domain */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: "10px" }}>
          {["Cek Nomor HP", "Cek Rekening", "Cek E-Wallet", "Laporkan Penipu"].map((label) => (
            <div
              key={label}
              style={{
                background: "#fff",
                border: "1.5px solid #e2e8f0",
                borderRadius: "999px",
                padding: "8px 18px",
                fontSize: "13px",
                fontWeight: 600,
                color: "#475569",
              }}
            >
              {label}
            </div>
          ))}
        </div>
        <div style={{ fontSize: "15px", color: "#94a3b8", fontWeight: 600 }}>
          kawaltransaksi.id
        </div>
      </div>

      {/* Accent bar bawah */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "6px",
          background: "#0f172a",
        }}
      />
    </div>,
    { ...size },
  );
}