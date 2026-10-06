import type { ReactNode } from 'react';
import { CircleAlert, CircleCheck, Info } from 'lucide-react';
import { cn } from '../../lib/cn';

export function Alert({
  tone = 'info',
  title,
  children,
}: {
  tone?: 'info' | 'success' | 'danger';
  title: string;
  children?: ReactNode;
}) {
  const Icon = tone === 'success' ? CircleCheck : tone === 'danger' ? CircleAlert : Info;

  return (
    <div className={cn('alert', `alert-${tone}`)} role={tone === 'danger' ? 'alert' : 'status'}>
      <Icon size={19} aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        {children ? <div className="alert-copy">{children}</div> : null}
      </div>
    </div>
  );
}
