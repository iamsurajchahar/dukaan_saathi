import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatNumber(num: number) {
  return new Intl.NumberFormat('en-IN').format(num);
}

// API errors normally carry a string in data.error, but proxy/platform errors
// (Vercel, Render) can return objects — never pass those to toast/JSX
export function getApiErrorMessage(err: any, fallback: string): string {
  const apiError = err?.response?.data?.error;
  if (typeof apiError === 'string' && apiError.trim()) return apiError;
  if (typeof apiError?.message === 'string') return apiError.message;
  return fallback;
}
