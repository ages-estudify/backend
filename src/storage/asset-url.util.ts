export function toAbsoluteAssetUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return pathOrUrl;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const base = (process.env.ASSET_BASE_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${base}${path}`;
}

export function isLegacyLocalIconPath(value: string): boolean {
  return value.startsWith('/');
}
