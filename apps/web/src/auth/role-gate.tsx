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
      <main className="shell-loading" id="main-content" aria-live="polite">
        <div className="skeleton skeleton-line skeleton-line-wide" />
        <div className="skeleton skeleton-card" />
      </main>
    );
  }

  if (status === 'anonymous' || !user) {
    return (
      <main className="route-state" id="main-content">
        <EmptyState
          title="Sign in to continue"
          description="This area is connected to your Purrfect Stays account."
          action={<Link className="button button-primary" href="/login">Sign in</Link>}
        />
      </main>
    );
  }

  if (!allow.includes(user.role)) {
    return (
      <main className="route-state" id="main-content">
        <EmptyState
          title="This area is not available for your account"
          description="Your signed-in role does not have access to this workspace."
          action={<Link className="button button-outline" href="/">Back home</Link>}
        />
      </main>
    );
  }

  return children;
}
