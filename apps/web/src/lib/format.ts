export function formatInrPaise(amountPaise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: amountPaise % 100 === 0 ? 0 : 2,
  }).format(amountPaise / 100);
}

export function formatDateOnly(value: string | Date): string {
  const date =
    typeof value === 'string'
      ? /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? new Date(value + 'T00:00:00.000Z')
        : new Date(value)
      : value;

  if (Number.isNaN(date.getTime())) return 'Invalid date';

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
