export type PublicSearchParams = Record<
  string,
  string | string[] | undefined
>;

export function firstParam(
  params: PublicSearchParams,
  key: string,
): string | undefined {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export function allParams(
  params: PublicSearchParams,
  key: string,
): string[] {
  const value = params[key];
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.flatMap((item) => item.split(','));
  }

  return value.split(',');
}

export function catalogueQueryString(
  params: PublicSearchParams,
): string {
  const allowed = [
    'destination',
    'checkIn',
    'checkOut',
    'guests',
    'pets',
    'species',
    'size',
    'breed',
    'propertyType',
    'minPrice',
    'maxPrice',
    'minRating',
    'amenities',
    'sort',
    'page',
    'pageSize',
  ];

  const query = new URLSearchParams();

  for (const key of allowed) {
    const value = params[key];
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item) query.append(key, item);
      }
    } else if (value) {
      query.set(key, value);
    }
  }

  if (!query.has('pageSize')) query.set('pageSize', '12');
  return query.toString();
}

export function preserveStayContext(
  params: PublicSearchParams,
): string {
  const query = new URLSearchParams();

  for (const key of ['checkIn', 'checkOut', 'guests']) {
    const value = firstParam(params, key);
    if (value) query.set(key, value);
  }

  return query.toString();
}
