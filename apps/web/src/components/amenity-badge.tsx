import { Check } from 'lucide-react';

export function AmenityBadge({
  children,
  verified = false,
}: {
  children: React.ReactNode;
  verified?: boolean;
}) {
  return (
    <span className="pet-tag">
      {verified ? <Check size={12} aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
