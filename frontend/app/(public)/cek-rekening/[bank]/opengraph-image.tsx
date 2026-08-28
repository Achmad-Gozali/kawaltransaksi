import { ImageResponse } from "next/og";
import {
  OG_SIZE,
  OG_CONTENT_TYPE,
  OgCard,
  loadLogo,
  loadInterFonts,
} from "@/core/og";

export const alt = "Cek Rekening Bank Penipu - KawalTransaksi";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

// Nama tampil per bank -- selaras dengan `bankData` di ./page.tsx.
const BANK_NAMES: Record<string, string> = {
  bca: "BCA",
  bri: "BRI",
  bni: "BNI",
  mandiri: "Mandiri",
  cimb: "CIMB Niaga",
  bsi: "BSI",
};

export default async function Image({
  params,
}: {
  params: Promise<{ bank: string }>;
}) {
  const { bank } = await params;
  const name = BANK_NAMES[bank.toLowerCase()] ?? "Bank";
  const [logo, fonts] = await Promise.all([loadLogo(), loadInterFonts()]);

  return new ImageResponse(
    (
      <OgCard
        logo={logo}
        eyebrow="Verifikasi nomor rekening"
        title={`Cek Rekening ${name} Penipu`}
        tagline={`Cek nomor rekening ${name} di database laporan penipuan komunitas sebelum kamu transfer.`}
      />
    ),
    { ...size, fonts },
  );
}
