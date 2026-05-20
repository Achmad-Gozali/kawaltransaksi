import { ImageResponse } from "next/og";
import { createClient } from "@/core/supabase/server";
import { decodeSlug } from "@/core/utils";

export const runtime = "edge";
export const revalidate = 60;

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function OgImage({ params }: Props) {
  const { slug } = await params;
  const realNumber = decodeSlug(slug);

  const supabase = await createClient();
  const { data } = await supabase
    .from("reports")
    .select("status, loss_amount, platform, bank_name, target_type")
    .eq("target_number", realNumber)
    .neq("status", "withdrawn")
    .order("created_at", { ascending: false });

  const reports = data ?? [];
  const verifiedCount = reports.filter((r) => r.status === "verified").length;
  const pendingCount = reports.filter((r) => r.status === "pending").length;
  const totalLoss = reports.reduce(
    (sum, r) => sum + (Number(r.loss_amount) || 0),
    0,
  );

  let status: "danger" | "warning" | "safe" = "safe";
  if (verifiedCount > 0) status = "danger";
  else if (pendingCount > 0) status = "warning";

  const statusConfig = {
    danger: {
      bg: "#fef2f2",
      accent: "#ef4444",
      badge: "#fee2e2",
      badgeText: "#991b1b",
      badgeLabel: "⚠ TERINDIKASI PENIPUAN",
      desc: `${verifiedCount} laporan terverifikasi`,
    },
    warning: {
      bg: "#fffbeb",
      accent: "#f59e0b",
      badge: "#fef3c7",
      badgeText: "#92400e",
      badgeLabel: "⚡ DALAM INVESTIGASI",
      desc: `${pendingCount} laporan masuk`,
    },
    safe: {
      bg: "#f0fdf4",
      accent: "#22c55e",
      badge: "#dcfce7",
      badgeText: "#166534",
      badgeLabel: "✓ TIDAK ADA LAPORAN",
      desc: "Nomor ini bersih di database kami",
    },
  };

  const cfg = statusConfig[status];

  // Format nomor dengan spasi tiap 4 digit
  const formattedNumber = realNumber.replace(/(\d{4})(?=\d)/g, "$1 ");

  // Format kerugian
  const formatLoss = (n: number) => {
    if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)} M`;
    if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)} Jt`;
    if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)} Rb`;
    return `Rp ${n}`;
  };

  return new ImageResponse(
    <div
      style={{
        width: "1200px",
        height: "630px",
        background: cfg.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "60px 72px",
        fontFamily: "sans-serif",
      }}
    >
      {/* Top: logo + badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
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
            <div style={{ color: "#fff", fontSize: "16px", fontWeight: 900 }}>
              K
            </div>
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

        {/* Status badge */}
        <div
          style={{
            background: cfg.badge,
            color: cfg.badgeText,
            fontSize: "13px",
            fontWeight: 800,
            padding: "8px 20px",
            borderRadius: "999px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {cfg.badgeLabel}
        </div>
      </div>

      {/* Middle: nomor besar */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#94a3b8",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          Nomor Terperiksa
        </div>
        <div
          style={{
            fontSize: "72px",
            fontWeight: 900,
            color: "#0f172a",
            letterSpacing: "-2px",
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formattedNumber}
        </div>
        <div style={{ fontSize: "18px", color: "#64748b", fontWeight: 500 }}>
          {cfg.desc}
        </div>
      </div>

      {/* Bottom: stats */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Stats pills */}
        <div style={{ display: "flex", gap: "12px" }}>
          {reports.length > 0 && (
            <div
              style={{
                background: "#fff",
                border: "1.5px solid #e2e8f0",
                borderRadius: "12px",
                padding: "12px 20px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <span
                style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a" }}
              >
                {reports.length}
              </span>
              <span
                style={{
                  fontSize: "11px",
                  color: "#94a3b8",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                Laporan
              </span>
            </div>
          )}
          {totalLoss > 0 && (
            <div
              style={{
                background: "#fff",
                border: "1.5px solid #e2e8f0",
                borderRadius: "12px",
                padding: "12px 20px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <span
                style={{ fontSize: "24px", fontWeight: 800, color: "#ef4444" }}
              >
                {formatLoss(totalLoss)}
              </span>
              <span
                style={{
                  fontSize: "11px",
                  color: "#94a3b8",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                Total Kerugian
              </span>
            </div>
          )}
        </div>

        {/* Domain */}
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
          background: cfg.accent,
        }}
      />
    </div>,
    { ...size },
  );
}
