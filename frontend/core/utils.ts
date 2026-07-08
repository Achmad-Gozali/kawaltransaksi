export function encodeSlug(str: string): string {
  return encodeURIComponent(str.trim());
}

export function maskNumber(num: string): string {
  if (!num) return '';
  if (num.length <= 4) return '*'.repeat(num.length);
  return '*'.repeat(num.length - 4) + num.slice(-4);
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