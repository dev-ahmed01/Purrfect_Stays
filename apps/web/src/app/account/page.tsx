import { Heart, PawPrint, PlaneTakeoff } from 'lucide-react';
import { Card, CardBody } from '../../components/ui/card';
import { PageHeader } from '../../components/ui/page-header';
import { StatusBadge } from '../../components/ui/status-badge';

export default function AccountOverviewPage() {
  return (
    <>
      <PageHeader
        eyebrow="My Purrfect"
        title="Travel with less guesswork."
        description="Your trips, pets and saved stays will live here."
      />
      <div className="summary-grid">
        <Card><CardBody className="summary-card"><PlaneTakeoff /><span>Trips</span><strong>Ready for Phase 12</strong></CardBody></Card>
        <Card><CardBody className="summary-card"><PawPrint /><span>Pets</span><strong>Connected to your profile</strong></CardBody></Card>
        <Card><CardBody className="summary-card"><Heart /><span>Saved stays</span><strong>Synced favourites</strong></CardBody></Card>
      </div>
      <Card>
        <CardBody>
          <div className="workspace-placeholder">
            <StatusBadge tone="success">Shell ready</StatusBadge>
            <h2>Your account workspace is connected.</h2>
            <p>Trip, pet and favourites data screens are built in Phase 12 on this shared shell.</p>
          </div>
        </CardBody>
      </Card>
    </>
  );
}
