import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format phone number for display: 0812-3456-7890
 */
export function formatPhoneNumber(num: string): string {
  const cleaned = num.replace(/\D/g, '');
  if (cleaned.length <= 4) return cleaned;
  if (cleaned.length <= 8) return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
}

/**
 * Mask number for privacy
 */
export function maskNumber(num: string): string {
  if (num.length <= 6) return num;
  return num.slice(0, 4) + '····' + num.slice(-3);
}

/**
 * Format nomor dengan spasi setiap 4 digit untuk readability
 */
export function formatNum(num: string): string {
  if (num.length <= 4) return num;
  return num.replace(/(\d{4})(?=\d)/g, '$1 ');
}

/**
 * Sanitize input to create a safe URL slug
 */
export function toSlug(input: string): string {
  return input.trim().replace(/[^a-zA-Z0-9]/g, '');
}

/**
 * Format date to Indonesian locale — deterministik, SSR-safe
 */
export function formatDateID(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Encode string ke Base64 URL-safe (masking url)
 */
export function encodeSlug(text: string): string {
  return Buffer.from(text).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Decode Base64 URL-safe ke string asli
 * Kalo slug isinya cuma angka (nomor polos), langsung return tanpa decode
 */
export function decodeSlug(slug: string): string {
  // Fallback: kalo isinya cuma digit, ini nomor polos — return langsung
  if (/^\d+$/.test(slug)) return slug;

  let base64 = slug.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  try {
    return Buffer.from(base64, 'base64').toString('utf-8');
  } catch (e) {
    return slug; // fallback kalo gagal decode
  }
}