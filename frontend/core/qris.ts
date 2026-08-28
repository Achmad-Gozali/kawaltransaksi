import jsQR from "jsqr";

/**
 * Decode + parse EMV-QRIS di CLIENT, murni untuk preview/konfirmasi UX
 * ("user tinggal konfirmasi" sebelum submit). INI BUKAN validasi yang
 * dipercaya -- server (backend/src/core/qris.ts) mem-parse ulang payload
 * mentah dari nol dan itulah yang benar-benar menentukan apa yang
 * tersimpan. Duplikasi logic CRC/TLV ini sengaja (pola yang sama seperti
 * NomorSearchForm.validateHP() vs robot.ts isValidPhone() -- client-side
 * check untuk UX cepat, server-side check untuk kebenaran).
 */

const CRC_POLY = 0x1021;
const CRC_INIT = 0xffff;

function calculateCrc16(data: string): string {
  let crc = CRC_INIT;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ CRC_POLY) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function parseTlv(data: string): Map<string, string> | null {
  const tags = new Map<string, string>();
  let i = 0;
  while (i < data.length) {
    if (i + 4 > data.length) return null;
    const id = data.slice(i, i + 2);
    const lenStr = data.slice(i + 2, i + 4);
    if (!/^\d{2}$/.test(lenStr)) return null;
    const len = Number.parseInt(lenStr, 10);
    const start = i + 4;
    const end = start + len;
    if (end > data.length) return null;
    tags.set(id, data.slice(start, end));
    i = end;
  }
  return tags;
}

const NMID_PATTERN = /^[A-Za-z0-9]{15}$/;

export interface QrisPreview {
  valid: boolean;
  nmid?: string;
  merchantName?: string;
  merchantCity?: string;
  payload?: string; // payload mentah -- inilah yang dikirim ke server, BUKAN field hasil parse di atas
  error?: string;
}

function parseQrisPayloadPreview(rawPayload: string): QrisPreview {
  if (rawPayload.length < 8) return { valid: false, error: "Kode QRIS tidak terbaca dengan benar. Coba foto ulang." };

  const crcTagAndLen = rawPayload.slice(-8, -4);
  if (crcTagAndLen !== "6304") return { valid: false, error: "Kode QR ini bukan format QRIS yang dikenali." };
  const expectedCrc = rawPayload.slice(-4).toUpperCase();
  const dataForCrc = rawPayload.slice(0, -4);
  if (calculateCrc16(dataForCrc) !== expectedCrc) {
    return { valid: false, error: "Kode QRIS tidak valid. Fotonya mungkin buram atau kurang cahaya. Coba foto ulang." };
  }

  const tags = parseTlv(rawPayload);
  if (!tags) return { valid: false, error: "Struktur kode QRIS tidak bisa dibaca. Coba foto ulang." };
  if (tags.get("00") !== "01") return { valid: false, error: "Kode QR ini sepertinya bukan QRIS." };
  if (tags.get("58") !== "ID") return { valid: false, error: "Kode QRIS ini bukan QRIS domestik Indonesia." };
  if (tags.get("53") !== "360") return { valid: false, error: "Mata uang pada QRIS ini bukan Rupiah." };

  const merchantName = tags.get("59")?.trim();
  const merchantCity = tags.get("60")?.trim();
  if (!merchantName || !merchantCity) {
    return { valid: false, error: "Data merchant pada kode QRIS ini tidak lengkap." };
  }

  const merchantAccountInfo = tags.get("51");
  const subTags = merchantAccountInfo ? parseTlv(merchantAccountInfo) : null;
  const nmid = subTags?.get("02");
  if (!nmid || !NMID_PATTERN.test(nmid)) {
    return { valid: false, error: "Nomor identitas merchant (NMID) tidak ditemukan atau formatnya tidak sesuai." };
  }

  return {
    valid: true,
    nmid: nmid.toUpperCase(),
    merchantName,
    merchantCity,
    payload: rawPayload,
  };
}

/** Load File jadi ImageData lewat canvas -- pipeline sama seperti stripExif() di core/storage/upload.ts. */
function loadImageData(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) { URL.revokeObjectURL(objectUrl); reject(new Error("Tidak dapat memproses gambar.")); return; }
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(objectUrl);
        resolve(imageData);
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Gagal memuat gambar.")); };
    img.src = objectUrl;
  });
}

/**
 * Decode kode QR dari foto lalu parse sebagai payload EMV-QRIS.
 * Dipakai oleh TargetEntryCard saat user upload/scan foto QRIS di Step 1.
 */
export async function decodeQrisFromFile(file: File): Promise<QrisPreview> {
  let imageData: ImageData;
  try {
    imageData = await loadImageData(file);
  } catch {
    return { valid: false, error: "Gagal memuat foto. Coba unggah ulang." };
  }

  const code = jsQR(imageData.data, imageData.width, imageData.height);
  if (!code) {
    return { valid: false, error: "Tidak ditemukan kode QR pada foto ini. Pastikan QRIS terlihat jelas dan tidak buram." };
  }

  return parseQrisPayloadPreview(code.data);
}
