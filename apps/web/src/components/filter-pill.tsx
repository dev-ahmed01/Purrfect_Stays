'use client';

import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../lib/cn';

export function FilterPill({
  active = false,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      className={cn('filter-pill', active && 'filter-pill-active', className)}
      type="button"
      {...props}
    />
  );
}
