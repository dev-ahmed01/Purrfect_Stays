import type { ReactNode } from 'react';
import { RoleGate } from '../../auth/role-gate';
import { AppShell, partnerNavItems } from '../../components/app-shell';

export default function PartnerLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGate allow={['PARTNER']}>
      <AppShell navItems={partnerNavItems} workspaceLabel="Partner Hub">
        {children}
      </AppShell>
    </RoleGate>
  );
}
