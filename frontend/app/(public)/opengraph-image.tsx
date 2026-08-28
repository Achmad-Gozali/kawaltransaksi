import { ImageResponse } from "next/og";
import {
  OG_SIZE,
  OG_CONTENT_TYPE,
  OgCard,
  loadLogo,
  loadInterFonts,
} from "@/core/og";

export const alt = "KawalTransaksi - Cek Rekening & Nomor Penipu Sebelum Transfer";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

// Kartu OG default untuk seluruh halaman umum di grup (public):
// homepage, cek-nomor, cek-rekening, cek-qris, faq, kontak, dll.
export default async function Image() {
  const [logo, fonts] = await Promise.all([loadLogo(), loadInterFonts()]);

  return new ImageResponse(
    (
      <OgCard
        logo={logo}
        eyebrow="Platform anti-penipuan komunitas"
        title="KawalTransaksi"
        tagline="Cek Rekening & Nomor Penipu Sebelum Transfer"
      />
    ),
    { ...size, fonts },
  );
}
