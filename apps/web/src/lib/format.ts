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
      ? new Date(`${value}T00:00:00.000Z`)
      : value;

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
