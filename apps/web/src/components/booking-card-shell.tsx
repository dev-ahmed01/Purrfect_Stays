import type { ReactNode } from 'react';

export function BookingCardShell({
  eyebrow,
  price,
  children,
  footer,
}: {
  eyebrow?: string;
  price?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <aside className="booking-card-shell">
      {eyebrow ? <p className="section-eyebrow">{eyebrow}</p> : null}
      {price ? <div className="booking-card-price">{price}</div> : null}
      <div className="booking-card-content">{children}</div>
      {footer ? <div className="booking-card-footer">{footer}</div> : null}
    </aside>
  );
}
