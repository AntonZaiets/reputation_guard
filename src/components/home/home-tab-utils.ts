export const HOME_TAB_DASHBOARD = "dashboard";
export const HOME_TAB_INBOX = "inbox";

export type HomeTabValue = typeof HOME_TAB_DASHBOARD | typeof HOME_TAB_INBOX;

export function firstSearchParamValue(raw: unknown): string | undefined {
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) {
    const first = raw[0];
    return typeof first === "string" ? first : undefined;
  }
  return undefined;
}

export function resolveHomeTab(raw: unknown): HomeTabValue {
  return firstSearchParamValue(raw) === HOME_TAB_INBOX ? HOME_TAB_INBOX : HOME_TAB_DASHBOARD;
}
