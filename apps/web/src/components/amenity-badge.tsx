import type { ReactNode } from 'react';
import { Check } from 'lucide-react';

export function AmenityBadge({
  children,
  verified = false,
}: {
  children: ReactNode;
  verified?: boolean;
}) {
  return (
    <span className="pet-tag">
      {verified ? <Check size={12} aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
