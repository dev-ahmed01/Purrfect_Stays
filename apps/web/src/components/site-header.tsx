'use client';

import { Menu, UserRound, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '../auth/auth-provider';
import { BrandLogo } from './brand-logo';

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { status, user } = useAuth();

  const workspaceHref =
    user?.role === 'PARTNER'
      ? '/partner'
      : user?.role === 'ADMIN'
        ? '/admin'
        : '/account';

  return (
    <header className="site-header">
      <nav className="nav-shell" aria-label="Primary navigation">
        <BrandLogo />
        <div className="nav-links nav-links-desktop">
          <Link href="/">Home</Link>
          <Link href="/stays">Stays</Link>
          <Link href="/#services">Services</Link>
          {status === 'authenticated' && user ? (
            <Link className="button button-primary button-sm" href={workspaceHref}>
              <UserRound size={16} aria-hidden="true" />
              {user.role === 'PARTNER' ? 'Partner Hub' : user.role === 'ADMIN' ? 'Admin' : 'My Trips'}
            </Link>
          ) : (
            <>
              <Link href="/login">Login</Link>
              <Link className="button button-primary button-sm" href="/signup">
                Sign Up Free
              </Link>
            </>
          )}
        </div>

        <button
          aria-expanded={open}
          aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
          className="nav-menu-button"
          onClick={() => setOpen((current) => !current)}
          type="button"
        >
          {open ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}
        </button>
      </nav>

      {open ? (
        <div className="mobile-nav">
          <Link href="/" onClick={() => setOpen(false)}>Home</Link>
          <Link href="/stays" onClick={() => setOpen(false)}>Stays</Link>
          <Link href="/#services" onClick={() => setOpen(false)}>Services</Link>
          {status === 'authenticated' && user ? (
            <Link
              className="button button-primary button-full"
              href={workspaceHref}
              onClick={() => setOpen(false)}
            >
              Open workspace
            </Link>
          ) : (
            <div className="mobile-nav-actions">
              <Link
                className="button button-outline button-full"
                href="/login"
                onClick={() => setOpen(false)}
              >
                Login
              </Link>
              <Link
                className="button button-primary button-full"
                href="/signup"
                onClick={() => setOpen(false)}
              >
                Sign Up Free
              </Link>
            </div>
          )}
        </div>
      ) : null}
    </header>
  );
}
