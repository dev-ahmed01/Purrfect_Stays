import type { ReactNode } from 'react';
import { RoleGate } from '../../auth/role-gate';
import { adminNavItems, AppShell } from '../../components/app-shell';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGate allow={['ADMIN']}>
      <AppShell navItems={adminNavItems} workspaceLabel="Platform Admin">
        {children}
      </AppShell>
    </RoleGate>
  );
}
