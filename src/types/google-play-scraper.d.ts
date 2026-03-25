declare module "google-play-scraper" {
  type GplayReview = {
    id?: string;
    userName?: string;
    text?: string | null;
    date?: Date | string | number | null;
  };

  type SearchHit = { appId?: string };

  type SearchFn = (opts: {
    term: string;
    num?: number;
    lang?: string;
    country?: string;
  }) => Promise<SearchHit[]>;

  type ReviewsFn = (opts: {
    appId: string;
    sort?: number;
    num?: number;
    lang?: string;
    country?: string;
  }) => Promise<{ data: GplayReview[]; nextPaginationToken?: string | null }>;

  const sort: { NEWEST: number; RATING: number; HELPFULNESS: number };

  const _default: { search: SearchFn; reviews: ReviewsFn; sort: typeof sort };
  export default _default;
}
