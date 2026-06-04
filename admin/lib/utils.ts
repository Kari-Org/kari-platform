import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind class names (later classes win conflicts). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** ₦ formatter with thousands separators. */
export function naira(n: number | null | undefined): string {
  if (n == null) return '—';
  return '₦' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
