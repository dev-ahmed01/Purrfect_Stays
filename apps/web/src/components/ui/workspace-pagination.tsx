import type { PaginationMeta } from '../../lib/catalogue-types';
import { Button } from './button';

export function WorkspacePagination({
  meta,
  onPage,
}: {
  meta: PaginationMeta;
  onPage(page: number): void;
}) {
  if (meta.totalPages <= 1) return null;

  return (
    <nav className="workspace-pagination" aria-label="Workspace pages">
      <Button
        disabled={!meta.hasPreviousPage}
        size="sm"
        variant="outline"
        onClick={() => onPage(meta.page - 1)}
      >
        ← Previous
      </Button>
      <span>Page {meta.page} of {meta.totalPages}</span>
      <Button
        disabled={!meta.hasNextPage}
        size="sm"
        variant="outline"
        onClick={() => onPage(meta.page + 1)}
      >
        Next →
      </Button>
    </nav>
  );
}
