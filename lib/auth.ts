import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'

const isDev = process.env.NODE_ENV !== 'production'

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  trustedOrigins: [
    'http://localhost:3000',
    ...(process.env.NEXT_PUBLIC_V0_PREVIEW_ORIGINS?.split(',') ?? []),
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
      : []),
    '*.vusercontent.net',
  ],
  advanced: isDev ? { defaultCookieAttributes: { sameSite: 'none', secure: true } } : undefined,
  plugins: [nextCookies()],
})

export async function getSession() {
  return auth.api.getSession({ headers: await headers() })
}

export async function requireSession() {
  const session = await getSession()
  if (!session) redirect('/sign-in')
  return session
}
