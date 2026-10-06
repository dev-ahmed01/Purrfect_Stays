import { Building2, CalendarCheck2, ClipboardCheck } from 'lucide-react';
import { Card, CardBody } from '../../components/ui/card';
import { PageHeader } from '../../components/ui/page-header';
import { StatusBadge } from '../../components/ui/status-badge';

export default function PartnerOverviewPage() {
  return (
    <>
      <PageHeader
        eyebrow="Partner Hub"
        title="Run your pet-friendly stays calmly."
        description="Listings, inventory and guest operations share one workspace."
      />
      <div className="summary-grid">
        <Card><CardBody className="summary-card"><Building2 /><span>Properties</span><strong>Ownership scoped</strong></CardBody></Card>
        <Card><CardBody className="summary-card"><CalendarCheck2 /><span>Bookings</span><strong>Operational lifecycle</strong></CardBody></Card>
        <Card><CardBody className="summary-card"><ClipboardCheck /><span>Verification</span><strong>Audited workflow</strong></CardBody></Card>
      </div>
      <Card>
        <CardBody>
          <div className="workspace-placeholder">
            <StatusBadge tone="success">Shell ready</StatusBadge>
            <h2>The partner workspace foundation is live.</h2>
            <p>Use this workspace to manage listings, inventory and guest stays.</p>
          </div>
        </CardBody>
      </Card>
    </>
  );
}
