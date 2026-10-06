function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

const configuredBrowserBase = process.env.NEXT_PUBLIC_API_URL
  ? stripTrailingSlash(process.env.NEXT_PUBLIC_API_URL)
  : null;

export const BROWSER_API_BASE_URL =
  configuredBrowserBase ?? 'http://localhost:4000/api/v1';

export const SERVER_API_BASE_URL = process.env.API_INTERNAL_URL
  ? stripTrailingSlash(process.env.API_INTERNAL_URL)
  : configuredBrowserBase?.startsWith('http://') ||
      configuredBrowserBase?.startsWith('https://')
    ? configuredBrowserBase
    : 'http://localhost:4000/api/v1';
