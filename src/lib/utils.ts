import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Junta classes condicionais e resolve conflitos do Tailwind. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const nf = (digits: number) =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** Formata números no padrão brasileiro (1.234,5). */
export function formatNumber(value: number, digits = 0) {
  return nf(digits).format(value);
}

/** Formata hectares: "200,0 ha". */
export function formatHectares(value: number) {
  return `${formatNumber(value, 1)} ha`;
}
