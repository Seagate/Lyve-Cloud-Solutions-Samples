export const generateQueryUrl: (baseUrl: string, queries: object) => string = (
  baseUrl,
  queries,
) => {
  const queriesList: string[] = [];
  Object.entries(queries).forEach(([key, value]) => {
    if (value || typeof value === 'number') {
      queriesList.push(`${key}=${value.toString()}`);
    }
  });
  if (queriesList.length > 0) {
    return `${baseUrl}?${queriesList.join('&')}`;
  }
  return baseUrl;
};

