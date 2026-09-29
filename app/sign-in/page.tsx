import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { AuthForm } from '@/components/auth-form'

export const metadata = { title: 'Sign in — FieldTrace' }

export default async function SignInPage() {
  const session = await getSession()
  if (session?.user) redirect('/')
  return <AuthForm mode="sign-in" />
}
