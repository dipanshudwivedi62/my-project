import Link from 'next/link'
import { requireSession } from '@/lib/auth'
import { AppNav, SignOutButton } from '@/components/app-nav'
import { Logo } from '@/components/logo'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession()
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-6">
            <Link href="/" aria-label="FieldTrace dashboard">
              <Logo />
            </Link>
            <div className="hidden sm:block">
              <AppNav />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right md:block">
              <p className="text-sm leading-tight text-foreground">{session.user.name}</p>
              <p className="text-xs leading-tight text-muted">{session.user.email}</p>
            </div>
            <SignOutButton />
          </div>
        </div>
        <div className="border-t border-border px-2 py-1.5 sm:hidden">
          <AppNav />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8">{children}</main>
    </div>
  )
}
