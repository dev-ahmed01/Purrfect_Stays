import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

type StatusTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'coral';

export function StatusBadge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: StatusTone;
}) {
  return (
    <span className={cn('status-badge', `status-${tone}`)}>
      {children}
    </span>
  );
}
