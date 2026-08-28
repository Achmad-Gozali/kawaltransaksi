import { ImageResponse } from "next/og";
import {
  OG_SIZE,
  OG_CONTENT_TYPE,
  OgCard,
  loadLogo,
  loadInterFonts,
} from "@/core/og";

export const alt = "Cek E-Wallet Penipu - KawalTransaksi";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

// Nama tampil per e-wallet -- selaras dengan `ewalletData` di ./page.tsx.
const WALLET_NAMES: Record<string, string> = {
  gopay: "GoPay",
  dana: "Dana",
  ovo: "OVO",
  shopeepay: "ShopeePay",
  linkaja: "LinkAja",
};

export default async function Image({
  params,
}: {
  params: Promise<{ wallet: string }>;
}) {
  const { wallet } = await params;
  const name = WALLET_NAMES[wallet.toLowerCase()] ?? "E-Wallet";
  const [logo, fonts] = await Promise.all([loadLogo(), loadInterFonts()]);

  return new ImageResponse(
    (
      <OgCard
        logo={logo}
        eyebrow="Verifikasi nomor e-wallet"
        title={`Cek ${name} Penipu`}
        tagline={`Cek nomor akun ${name} di database laporan penipuan komunitas sebelum kamu transfer.`}
      />
    ),
    { ...size, fonts },
  );
}
