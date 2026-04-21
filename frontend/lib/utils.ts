import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPhoneNumber(num: string): string {
  const cleaned = num.replace(/\D/g, '');
  if (cleaned.length <= 4) return cleaned;
  if (cleaned.length <= 8) return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
}

export function maskNumber(num: string): string {
  if (num.length <= 6) return num;
  return num.slice(0, 4) + '····' + num.slice(-3);
}

export function formatNum(num: string): string {
  if (num.length <= 4) return num;
  return num.replace(/(\d{4})(?=\d)/g, '$1 ');
}

export function toSlug(input: string): string {
  return input.trim().replace(/[^a-zA-Z0-9]/g, '');
}

export function formatDateID(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function encodeSlug(text: string): string {
  return text.trim();
}

export function decodeSlug(slug: string): string {
  if (/^\d+$/.test(slug)) return slug;

  let base64 = slug.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  try {
    const decoded = Buffer.from(base64, 'base64').toString('utf-8');
    if (!/^\d+$/.test(decoded)) return '';
    return decoded;
  } catch {
    return '';
  }
}

export function formatRupiah(amount: number | string): string {
  const n = Number(amount) || 0;
  if (n >= 1_000_000_000) {
    const val = n / 1_000_000_000;
    return `Rp${val % 1 === 0 ? val : val.toFixed(1)} M+`.replace('.', ',');
  }
  if (n >= 1_000_000) {
    const val = n / 1_000_000;
    return `Rp${val % 1 === 0 ? val : val.toFixed(1)} Jt+`.replace('.', ',');
  }
  if (n >= 1_000) {
    return `Rp${(n / 1_000).toFixed(0)} Rb+`;
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);
}