import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthForm } from '../../auth/auth-form';
import { AuthCard } from '../../components/auth-card';

export const metadata: Metadata = {
  title: 'Sign in',
};

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome back."
      description="Sign in to manage your trips, pets and saved stays."
      footer={
        <p>
          New to Purrfect? <Link href="/signup">Create an account</Link>
        </p>
      }
    >
      <AuthForm mode="login" />
    </AuthCard>
  );
}
