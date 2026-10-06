import { MapPinOff } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '../components/ui/empty-state';

export default function NotFoundPage() {
  return (
    <main className="route-state" id="main-content">
      <EmptyState
        icon={<MapPinOff />}
        title="This page wandered off"
        description="The stay or page you’re looking for isn’t available here."
        action={<Link className="button button-primary" href="/">Back home</Link>}
      />
    </main>
  );
}
