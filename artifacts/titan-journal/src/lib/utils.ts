import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** API list endpoints should return arrays; guard against bad proxy/HTML responses. */
export function asArray<T>(value: T[] | unknown): T[] {
  return Array.isArray(value) ? value : []
}
