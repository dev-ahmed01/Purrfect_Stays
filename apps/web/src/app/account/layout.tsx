import type { ReactNode } from 'react';
import { RoleGate } from '../../auth/role-gate';
import { AppShell, accountNavItems } from '../../components/app-shell';

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGate allow={['USER']}>
      <AppShell navItems={accountNavItems} workspaceLabel="My Purrfect">
        {children}
      </AppShell>
    </RoleGate>
  );
}
