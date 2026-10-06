import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('ui-card', className)} {...props} />;
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="ui-card-header">
      <div>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {action ? <div className="ui-card-header-action">{action}</div> : null}
    </div>
  );
}

export function CardBody({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('ui-card-body', className)} {...props} />;
}
