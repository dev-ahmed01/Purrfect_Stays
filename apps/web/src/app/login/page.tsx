import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthForm } from '../../auth/auth-form';
import { AuthCard } from '../../components/auth-card';
import { safeInternalReturnTo } from '../../lib/navigation';

export const metadata: Metadata = {
  title: 'Sign in',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string | string[] }>;
}) {
  const params = await searchParams;
  const returnTo = safeInternalReturnTo(params.returnTo);
  const signupHref = returnTo
    ? `/signup?returnTo=${encodeURIComponent(returnTo)}`
    : '/signup';

  return (
    <AuthCard
      title="Welcome back."
      description="Sign in to manage your trips, pets and saved stays."
      footer={
        <p>
          New to Purrfect? <Link href={signupHref}>Create an account</Link>
        </p>
      }
    >
      <AuthForm mode="login" returnTo={returnTo} />
    </AuthCard>
  );
}
