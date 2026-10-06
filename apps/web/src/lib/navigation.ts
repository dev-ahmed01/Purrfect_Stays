export function safeInternalReturnTo(
  value: string | string[] | undefined,
): string | undefined {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate) return undefined;
  if (!candidate.startsWith('/') || candidate.startsWith('//')) return undefined;

  try {
    const parsed = new URL(candidate, 'https://purrfect.local');
    if (parsed.origin !== 'https://purrfect.local') return undefined;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return undefined;
  }
}
