import { SignIn } from '@clerk/nextjs'

export const metadata = { title: 'Continue with email', robots: { index: false, follow: false } }

export default function SignInPage() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-6 py-12">
      <SignIn withSignUp routing="path" path="/sign-in" signUpUrl="/sign-in" fallbackRedirectUrl="/profile" />
    </main>
  )
}
