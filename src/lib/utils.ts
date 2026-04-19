import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}
export function formatCurrency(value: string | number | undefined) {
  if (value === undefined || value === null || value === '') return '0,00';
  
  const num = typeof value === 'string' 
    ? parseFloat(value.replace(/\./g, '').replace(',', '.')) 
    : value;
    
  if (isNaN(num)) return '0,00';
  
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}
export function normalizeTurkish(str: string) {
  if (!str) return '';
  return str.replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
