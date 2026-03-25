declare module "app-store-scraper" {
  type AppStoreSearchHit = {
    id: number | string;
    appId: string;
    title?: string;
  };

  type SearchFn = (opts: {
    term: string;
    num?: number;
    page?: number;
    country?: string;
    lang?: string;
  }) => Promise<AppStoreSearchHit[]>;

  type ReviewsFn = (opts: {
    id?: string | number;
    appId?: string;
    sort?: string;
    page?: number;
    country?: string;
  }) => Promise<
    Array<{
      id: string;
      userName: string;
      text: string;
      updated: string;
    }>
  >;

  const sort: { RECENT: string; HELPFUL: string };

  const _default: { search: SearchFn; reviews: ReviewsFn; sort: typeof sort };
  export default _default;
}
