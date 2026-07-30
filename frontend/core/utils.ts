export function encodeSlug(str: string): string {
  return encodeURIComponent(str.trim());
}

/**
 * Sensor nomor (HP/rekening) mengikuti standar umum (bank, kartu kredit):
 * tampilkan 4 digit awal + 4 digit akhir, sensor bagian tengah.
 * Contoh: "0895370985943" -> "0895*****5943"
 *
 * Untuk nomor pendek (<= 8 digit), fallback ke sensor separuh tengah
 * secara proporsional supaya tidak sampai menampilkan seluruh nomor.
 */
export function maskNumber(num: string): string {
  if (!num) return '';
  const len = num.length;

  if (len <= 8) {
    // Nomor pendek: sisakan sedikit di depan & belakang, sensor tengah.
    const visible = Math.max(1, Math.floor(len / 4));
    if (len <= visible * 2) return '*'.repeat(len);
    return num.slice(0, visible) + '*'.repeat(len - visible * 2) + num.slice(-visible);
  }

  return num.slice(0, 4) + '*'.repeat(len - 8) + num.slice(-4);
}

export function formatDateID(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatRupiah(amount: number): string {
  if (amount === 0) return 'Rp0';
  if (amount >= 1_000_000_000) return `Rp${(amount / 1_000_000_000).toFixed(1)} M+`;
  if (amount >= 1_000_000) return `Rp${(amount / 1_000_000).toFixed(1)} Jt+`;
  if (amount >= 1_000) return `Rp${(amount / 1_000).toFixed(0)} Rb+`;
  return `Rp${amount.toLocaleString('id-ID')}`;
}

export function formatNum(num: string): string {
  return num.replace(/(\d{4})(?=\d)/g, "$1 ");
}

export function decodeSlug(slug: string): string {
  return decodeURIComponent(slug);
}

export function maskName(name: string | null): string {
  if (!name) return 'Anonymous';
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + '*'.repeat(Math.max(word.length - 1, 1)))
    .join(' ');
}