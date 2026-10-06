import Link from 'next/link';

export function BrandLogo() {
  return (
    <Link className="brand-logo" href="/" aria-label="Purrfect Stays home">
      <span aria-hidden="true">🐾</span>
      <span>Purrfect</span>
    </Link>
  );
}
