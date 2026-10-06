export function statusTone(
  status: string,
): 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'coral' {
  switch (status) {
    case 'PUBLISHED':
    case 'VERIFIED':
    case 'COMPLETED':
    case 'CHECKED_IN':
      return 'success';
    case 'PENDING':
    case 'PENDING_REVIEW':
    case 'CONFIRMED':
      return 'info';
    case 'DRAFT':
    case 'UNVERIFIED':
      return 'warning';
    case 'REJECTED':
    case 'SUSPENDED':
    case 'CANCELLED':
    case 'HIDDEN':
      return 'danger';
    default:
      return 'neutral';
  }
}

export function humanizeStatus(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function zodFieldErrors(
  issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>,
) {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? 'form');
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}
