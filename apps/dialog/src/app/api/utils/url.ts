export function getSearchParamsFromUrl(url: string) {
  const [, ...rest] = url.split('?');

  if (rest === undefined) {
    return new URLSearchParams();
  }

  return new URLSearchParams(rest.join('?'));
}
