import { ShieldCheck, Star, Store } from 'lucide-react';
import { Card, CardBody } from '../../components/ui/card';
import { PageHeader } from '../../components/ui/page-header';
import { StatusBadge } from '../../components/ui/status-badge';

export default function AdminOverviewPage() {
  return (
    <>
      <PageHeader
        eyebrow="Platform Admin"
        title="Review trust-sensitive changes."
        description="Listing verification and review moderation use the same calm operations shell."
      />
      <div className="summary-grid">
        <Card><CardBody className="summary-card"><Store /><span>Listings</span><strong>Review queue</strong></CardBody></Card>
        <Card><CardBody className="summary-card"><Star /><span>Reviews</span><strong>Moderation</strong></CardBody></Card>
        <Card><CardBody className="summary-card"><ShieldCheck /><span>Trust</span><strong>Audit-first</strong></CardBody></Card>
      </div>
      <Card>
        <CardBody>
          <div className="workspace-placeholder">
            <StatusBadge tone="success">Shell ready</StatusBadge>
            <h2>Admin navigation and permissions are connected.</h2>
            <p>Operational admin data views will reuse this shell without changing the brand language.</p>
          </div>
        </CardBody>
      </Card>
    </>
  );
}
