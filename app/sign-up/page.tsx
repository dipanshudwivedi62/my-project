import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { AuthForm } from '@/components/auth-form'

export const metadata = { title: 'Create account — FieldTrace' }

export default async function SignUpPage() {
  const session = await getSession()
  if (session?.user) redirect('/')
  return <AuthForm mode="sign-up" />
}
