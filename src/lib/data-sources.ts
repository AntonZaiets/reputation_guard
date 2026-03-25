export const DATA_SOURCE_IDS = ["play_store", "app_store", "trustpilot"] as const;

export type DataSourceId = (typeof DATA_SOURCE_IDS)[number];

export function isDataSourceId(value: string): value is DataSourceId {
  return (DATA_SOURCE_IDS as readonly string[]).includes(value);
}
