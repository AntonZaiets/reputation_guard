const TRUSTPILOT_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export type TrustpilotScrapedReview = {
  externalId: string;
  text: string;
  authorId: string | null;
  createdAt: Date | null;
};

function normalizeDomain(keyword: string): string {
  let d = keyword.trim().toLowerCase();
  d = d.replace(/^https?:\/\//, "");
  const slash = d.indexOf("/");
  if (slash >= 0) d = d.slice(0, slash);
  return d;
}

/**
 * Fetches Trustpilot company reviews from the public HTML page (no Puppeteer).
 * `domain` is the Trustpilot slug, e.g. `uklon.com.ua` or `www.amazon.com`.
 */
export async function fetchTrustpilotReviewsFromHtml(
  domainKeyword: string,
  max = 20,
): Promise<TrustpilotScrapedReview[]> {
  const domain = normalizeDomain(domainKeyword);
  if (!domain) return [];

  const url = `https://www.trustpilot.com/review/${encodeURIComponent(domain)}`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent": TRUSTPILOT_UA,
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });

  if (!res.ok) {
    throw new Error(`Trustpilot HTTP ${res.status}`);
  }

  const html = await res.text();
  const m = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
  );
  if (!m?.[1]) {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(m[1]) as unknown;
  } catch {
    return [];
  }

  if (typeof parsed !== "object" || parsed === null) return [];

  const pageProps = (parsed as { props?: { pageProps?: unknown } }).props?.pageProps as
    | { statusCode?: number; reviews?: unknown }
    | undefined;

  if (!pageProps || pageProps.statusCode === 404) {
    return [];
  }

  const reviews = pageProps.reviews;
  if (!Array.isArray(reviews)) return [];

  const out: TrustpilotScrapedReview[] = [];

  for (const raw of reviews) {
    if (out.length >= max) break;
    if (typeof raw !== "object" || raw === null) continue;
    const r = raw as {
      id?: unknown;
      text?: unknown;
      consumer?: { id?: unknown };
      dates?: { publishedDate?: unknown };
    };
    if (typeof r.id !== "string" || typeof r.text !== "string") continue;
    const text = r.text.replace(/^\u200b+/, "").trim();
    if (!text) continue;

    let createdAt: Date | null = null;
    if (typeof r.dates?.publishedDate === "string") {
      const d = new Date(r.dates.publishedDate);
      if (!Number.isNaN(d.getTime())) createdAt = d;
    }

    const authorId =
      typeof r.consumer?.id === "string" && r.consumer.id.trim()
        ? r.consumer.id.trim()
        : null;

    out.push({
      externalId: r.id,
      text,
      authorId,
      createdAt,
    });
  }

  return out;
}
