'use client';

import {
  CalendarDays,
  ChevronRight,
  Home,
  LogOut,
  PawPrint,
  ShieldCheck,
  Star,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useAuth } from '../auth/auth-provider';
import { BrandLogo } from './brand-logo';
import { cn } from '../lib/cn';

export type AppShellNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export function AppShell({
  children,
  navItems,
  workspaceLabel,
}: {
  children: ReactNode;
  navItems: AppShellNavItem[];
  workspaceLabel: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.push('/');
    router.refresh();
  }

  return (
    <div className="app-frame">
      <aside className="app-sidebar">
        <div className="app-sidebar-brand">
          <BrandLogo />
          <span className="workspace-label">{workspaceLabel}</span>
        </div>

        <nav className="app-nav" aria-label={`${workspaceLabel} navigation`}>
          {navItems.map((item) => {
            const isWorkspaceRoot = ['/account', '/partner', '/admin'].includes(item.href);
            const active =
              pathname === item.href ||
              (!isWorkspaceRoot && pathname.startsWith(`${item.href}/`));
            const Icon = item.icon;

            return (
              <Link
                className={cn('app-nav-link', active && 'app-nav-link-active')}
                href={item.href}
                key={item.href}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
                {active ? <ChevronRight className="app-nav-chevron" size={16} aria-hidden="true" /> : null}
              </Link>
            );
          })}
        </nav>

        <div className="app-sidebar-bottom">
          <Link className="app-nav-link" href="/">
            <Home size={18} aria-hidden="true" />
            <span>Back to Purrfect</span>
          </Link>
          <button className="app-nav-link app-nav-button" onClick={handleLogout} type="button">
            <LogOut size={18} aria-hidden="true" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <div className="app-topbar-context">
            <PawPrint size={17} aria-hidden="true" />
            <span>{workspaceLabel}</span>
          </div>
          <div className="app-user">
            <div className="app-user-avatar" aria-hidden="true">
              {user?.fullName.charAt(0).toUpperCase() ?? 'P'}
            </div>
            <div>
              <strong>{user?.fullName ?? 'Purrfect user'}</strong>
              <span>{user?.role ?? 'Account'}</span>
            </div>
          </div>
        </header>
        <main className="app-content" id="main-content">{children}</main>
      </div>
    </div>
  );
}

export const accountNavItems: AppShellNavItem[] = [
  { href: '/account', label: 'Overview', icon: Home },
  { href: '/account/trips', label: 'Trips', icon: CalendarDays },
  { href: '/account/pets', label: 'My Pets', icon: PawPrint },
];

export const partnerNavItems: AppShellNavItem[] = [
  { href: '/partner', label: 'Overview', icon: Home },
  { href: '/partner/bookings', label: 'Bookings', icon: CalendarDays },
  { href: '/partner/properties', label: 'Properties', icon: PawPrint },
];

export const adminNavItems: AppShellNavItem[] = [
  { href: '/admin', label: 'Overview', icon: Home },
  { href: '/admin/listings', label: 'Listings', icon: ShieldCheck },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
];
