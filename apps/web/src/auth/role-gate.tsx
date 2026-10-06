'use client';

import type { UserRole } from '@purrfect/contracts';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useAuth } from './auth-provider';
import { EmptyState } from '../components/ui/empty-state';

export function RoleGate({
  allow,
  children,
}: {
  allow: UserRole[];
  children: ReactNode;
}) {
  const { status, user } = useAuth();

  if (status === 'loading') {
    return (
      <div className="shell-loading" aria-live="polite">
        <div className="skeleton skeleton-line skeleton-line-wide" />
        <div className="skeleton skeleton-card" />
      </div>
    );
  }

  if (status === 'anonymous' || !user) {
    return (
      <EmptyState
        title="Sign in to continue"
        description="This area is connected to your Purrfect Stays account."
        action={<Link className="button button-primary" href="/login">Sign in</Link>}
      />
    );
  }

  if (!allow.includes(user.role)) {
    return (
      <EmptyState
        title="This area is not available for your account"
        description="Your signed-in role does not have access to this workspace."
        action={<Link className="button button-outline" href="/">Back home</Link>}
      />
    );
  }

  return children;
}
