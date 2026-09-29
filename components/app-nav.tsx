'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { cn } from '@/lib/utils'

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/tests/new', label: 'New test' },
  { href: '/verify', label: 'Verify' },
]

export function AppNav() {
  const pathname = usePathname()
  return (
    <nav aria-label="Main" className="flex items-center gap-1">
      {links.map((link) => {
        const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href)
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm transition-colors',
              active ? 'bg-surface-2 text-foreground' : 'text-muted hover:text-foreground',
            )}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function SignOutButton() {
  const router = useRouter()
  return (
    <button
      type="button"
      onClick={async () => {
        await authClient.signOut()
        router.push('/sign-in')
        router.refresh()
      }}
      className="flex size-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
    >
      <LogOut className="size-4" aria-hidden="true" />
      <span className="sr-only">Sign out</span>
    </button>
  )
}
