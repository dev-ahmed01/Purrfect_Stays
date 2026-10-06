'use client';

import { CircleAlert } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '../components/ui/button';
import { EmptyState } from '../components/ui/empty-state';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset(): void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="route-state" id="main-content">
      <EmptyState
        icon={<CircleAlert />}
        title="Something didn’t load correctly"
        description="Your information is safe. Try loading this part of Purrfect Stays again."
        action={<Button onClick={reset}>Try again</Button>}
      />
    </main>
  );
}
