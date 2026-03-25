import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
} from "@prisma/client/runtime/library";

/** Errors where we degrade analytics to empty data + a message instead of a 500. */
const DEGRADE_KNOWN_REQUEST_CODES = new Set([
  "P1000", // Authentication failed
  "P1001", // Can't reach database server
  "P1003", // Database does not exist
  "P1011", // Error opening a TLS connection (common with Neon / SSL)
  "P1013", // Invalid database string
  "P1017", // Server has closed the connection
  "P2021", // Table does not exist (migrations not applied)
  "P2024", // Timed out fetching from connection pool
]);

function messageLooksLikeConnectivity(msg: string): boolean {
  const m = msg.toLowerCase();
  return (
    m.includes("can't reach database") ||
    m.includes("cannot reach database") ||
    m.includes("prismaclientinitializationerror") ||
    m.includes("server has closed the connection") ||
    m.includes("econnrefused") ||
    m.includes("econnreset") ||
    m.includes("etimedout") ||
    m.includes("enotfound") ||
    m.includes("getaddrinfo") ||
    m.includes("connect econnrefused") ||
    m.includes("connection refused") ||
    m.includes("tls connection") ||
    (m.includes("ssl") && m.includes("error")) ||
    m.includes("password authentication failed") ||
    (m.includes("database") && m.includes("does not exist"))
  );
}

/**
 * True when Prisma cannot use the database (down host, bad URL, TLS, missing tables, etc.).
 */
export function isPrismaConnectionError(err: unknown): boolean {
  if (err instanceof PrismaClientInitializationError) {
    return true;
  }
  if (err instanceof PrismaClientKnownRequestError) {
    if (DEGRADE_KNOWN_REQUEST_CODES.has(err.code)) {
      return true;
    }
  }

  if (err instanceof Error && messageLooksLikeConnectivity(err.message)) {
    return true;
  }

  const asString = err != null ? String(err) : "";
  if (messageLooksLikeConnectivity(asString)) {
    return true;
  }

  if (err && typeof err === "object" && "code" in err) {
    const code = String((err as { code: unknown }).code);
    if (DEGRADE_KNOWN_REQUEST_CODES.has(code)) {
      return true;
    }
  }

  return false;
}

/** Generated Prisma Client is older than `schema.prisma` (or dev server holds a stale singleton). */
export function isPrismaClientSchemaMismatch(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  return (
    msg.includes("Unknown field") &&
    (msg.includes("select statement") ||
      msg.includes("include statement") ||
      msg.includes("orderBy statement"))
  );
}
