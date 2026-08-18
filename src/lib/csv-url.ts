export function withCacheBust(url: string, cacheBust: number = Date.now()): string {
  const [base, hash] = url.split("#", 2);
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}cachebust=${cacheBust}${hash ? `#${hash}` : ""}`;
}
