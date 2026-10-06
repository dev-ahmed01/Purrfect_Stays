import { API_BASE_URL } from './api-config';
import { ApiError, type ApiFailure, type ApiSuccess } from './api-types';

export async function publicApiGet<T>(
  path: string,
  options: { revalidate?: number | false } = {},
): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
    ...(options.revalidate === false
      ? { cache: 'no-store' as const }
      : {
          next: {
            revalidate: options.revalidate ?? 60,
          },
        }),
  });

  const raw = await response.text();
  const parsed = raw ? (JSON.parse(raw) as ApiSuccess<T> | ApiFailure) : null;

  if (!response.ok) {
    const failure: ApiFailure =
      parsed && 'error' in parsed
        ? parsed
        : {
            error: {
              code: 'HTTP_ERROR',
              message: `Request failed with status ${response.status}.`,
            },
          };

    throw new ApiError(response.status, failure);
  }

  if (!parsed || !('data' in parsed)) {
    throw new ApiError(502, {
      error: {
        code: 'INVALID_API_RESPONSE',
        message: 'Purrfect Stays received an unexpected API response.',
      },
    });
  }

  return parsed.data;
}
