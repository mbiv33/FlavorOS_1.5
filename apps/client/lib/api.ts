/** Browser-visible API base URL (no trailing slash). */

export function apiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "";
  return raw.replace(/\/$/, "");
}

export function defaultTenantSlug(): string {
  return process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG ?? "demo";
}
