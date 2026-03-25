export type WorkspaceListItem = {
  id: string;
  name: string;
};

export type WorkspaceSelectorProps = {
  /** Workspace id the server used when the URL has no `workspaceId` query. */
  resolvedWorkspaceId: string | null;
  /** Outlined select on dark glass (analytics header). */
  darkSurface?: boolean;
};
