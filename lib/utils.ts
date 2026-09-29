import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatUtc(date: Date | string) {
  return (
    new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'UTC',
    }).format(new Date(date)) + ' UTC'
  )
}

export function shortHash(hash: string, size = 12) {
  return hash.length <= size * 2 ? hash : `${hash.slice(0, size)}…${hash.slice(-size)}`
}
