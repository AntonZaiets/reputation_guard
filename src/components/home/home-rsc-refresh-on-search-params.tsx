"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Next.js may keep Server Component output stale when only the query string changes.
 * After the URL updates on the client, refresh RSC so the page matches the address bar.
 */
export function HomeRscRefreshOnSearchParamsChange() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const signature = searchParams.toString();
  const ready = useRef(false);

  useEffect(() => {
    if (!ready.current) {
      ready.current = true;
      return;
    }
    router.refresh();
  }, [router, signature]);

  return null;
}
