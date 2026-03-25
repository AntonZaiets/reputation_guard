const DEFAULT_CONNECT_TIMEOUT_SEC = "5";

/**
 * PostgreSQL often waits a long time on TCP when the host is down. Libpq honors
 * `connect_timeout` (seconds); append it if missing so Server Components fail fast.
 */
export function withDatabaseConnectTimeout(url: string | undefined): string | undefined {
  if (!url?.trim()) return url;
  const trimmed = url.trim();
  if (/[?&]connect_timeout=\d+/.test(trimmed)) return trimmed;
  const sep = trimmed.includes("?") ? "&" : "?";
  return `${trimmed}${sep}connect_timeout=${DEFAULT_CONNECT_TIMEOUT_SEC}`;
}
