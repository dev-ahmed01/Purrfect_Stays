import Link from 'next/link';
import { BrandLogo } from './brand-logo';

export function SiteHeader() {
  return (
    <header className="site-header">
      <nav className="nav-shell" aria-label="Primary navigation">
        <BrandLogo />
        <div className="nav-links">
          <Link href="/">Home</Link>
          <Link href="/stays">Stays</Link>
          <Link href="/#services">Services</Link>
          <Link href="/login">Login</Link>
          <Link className="button button-primary button-small" href="/signup">
            Sign Up Free
          </Link>
        </div>
      </nav>
    </header>
  );
}
