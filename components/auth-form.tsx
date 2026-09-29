'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { Button, Input, Label } from '@/components/ui'
import { Logo } from '@/components/logo'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const isSignUp = mode === 'sign-up'

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email'))
    const password = String(form.get('password'))
    const { error } = isSignUp
      ? await authClient.signUp.email({ email, password, name: String(form.get('name')) })
      : await authClient.signIn.email({ email, password })
    setPending(false)
    if (error) {
      setError(
        isSignUp
          ? 'Could not create the account. Check your details and try again.'
          : 'Invalid email or password.',
      )
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <Logo />
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight text-balance">
              {isSignUp ? 'Create an operator account' : 'Sign in to FieldTrace'}
            </h1>
            <p className="text-sm text-muted text-pretty">
              Every test you record is signed and attributed to this account.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6">
          {isSignUp && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" name="name" required autoComplete="name" placeholder="Officer A. Sharma" />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          <Button type="submit" disabled={pending} className="mt-2">
            {pending ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted">
          {isSignUp ? 'Already have an account? ' : 'New operator? '}
          <Link href={isSignUp ? '/sign-in' : '/sign-up'} className="font-medium text-primary hover:underline">
            {isSignUp ? 'Sign in' : 'Create an account'}
          </Link>
        </p>
      </div>
    </main>
  )
}
