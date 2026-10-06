import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthForm } from '../../auth/auth-form';
import { AuthCard } from '../../components/auth-card';
import { safeInternalReturnTo } from '../../lib/navigation';

export const metadata: Metadata = {
  title: 'Create account',
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string | string[] }>;
}) {
  const params = await searchParams;
  const returnTo = safeInternalReturnTo(params.returnTo);
  const loginHref = returnTo
    ? `/login?returnTo=${encodeURIComponent(returnTo)}`
    : '/login';

  return (
    <AuthCard
      title="Travel better together."
      description="Create your pet-parent account and keep every stay organised."
      footer={
        <p>
          Already have an account? <Link href={loginHref}>Sign in</Link>
        </p>
      }
    >
      <AuthForm mode="signup" returnTo={returnTo} />
    </AuthCard>
  );
}
