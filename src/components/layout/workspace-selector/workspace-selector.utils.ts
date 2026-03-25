import type { WorkspaceListItem } from "./workspace-selector.types";

export function parseWorkspacesPayload(data: unknown): WorkspaceListItem[] {
  if (!Array.isArray(data)) return [];
  const list: WorkspaceListItem[] = [];
  for (const row of data) {
    if (
      typeof row === "object" &&
      row !== null &&
      "id" in row &&
      "name" in row &&
      typeof (row as { id: unknown }).id === "string" &&
      typeof (row as { name: unknown }).name === "string"
    ) {
      list.push({ id: (row as { id: string }).id, name: (row as { name: string }).name });
    }
  }
  return list;
}

export function workspacesLoadErrorMessage(data: unknown, fallback: string): string {
  if (typeof data === "object" && data !== null && "error" in data) {
    return String((data as { error: unknown }).error);
  }
  return fallback;
}
