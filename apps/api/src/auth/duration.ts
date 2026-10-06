const UNIT_TO_MS = {
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
} as const;

export function durationToMilliseconds(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value);

  if (!match) {
    throw new Error(`Unsupported duration: ${value}`);
  }

  const amount = Number(match[1]);
  const unit = match[2] as keyof typeof UNIT_TO_MS;
  return amount * UNIT_TO_MS[unit];
}
