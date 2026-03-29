// ============================================
// 📁 LOKASI: lib/utils.ts
// 📝 REPLACE file lama — tambah helper functions
// ============================================

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
 * Sanitize input to create a safe URL slug
 */
export function toSlug(input: string): string {
  return input.trim().replace(/[^a-zA-Z0-9]/g, '');
}

/**
 * Format date to Indonesian locale
 */
export function formatDateID(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}