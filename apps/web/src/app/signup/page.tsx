import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthForm } from '../../auth/auth-form';
import { AuthCard } from '../../components/auth-card';

export const metadata: Metadata = {
  title: 'Create account',
};

export default function SignupPage() {
  return (
    <AuthCard
      title="Travel better together."
      description="Create your pet-parent account and keep every stay organised."
      footer={
        <p>
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      }
    >
      <AuthForm mode="signup" />
    </AuthCard>
  );
}
