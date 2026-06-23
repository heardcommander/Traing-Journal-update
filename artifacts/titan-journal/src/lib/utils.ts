import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** API list endpoints should return arrays; guard against bad proxy/HTML responses. */
export function asArray<T>(value: T[] | unknown): T[] {
  return Array.isArray(value) ? value : []
}

export function apiErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (error && typeof error === "object" && "data" in error) {
    const data = (error as { data?: unknown }).data;
    if (data && typeof data === "object" && "error" in data) {
      const message = (data as { error?: unknown }).error;
      if (typeof message === "string" && message.trim()) return message;
    }
  }
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}
