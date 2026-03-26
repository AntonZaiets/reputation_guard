const DEFAULT_CONNECT_TIMEOUT_SEC = "5";

export function withDatabaseConnectTimeout(url: string | undefined): string | undefined {
  if (!url?.trim()) return url;
  const trimmed = url.trim();
  if (/[?&]connect_timeout=\d+/.test(trimmed)) return trimmed;
  const sep = trimmed.includes("?") ? "&" : "?";
  return `${trimmed}${sep}connect_timeout=${DEFAULT_CONNECT_TIMEOUT_SEC}`;
}
