import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { WORKSPACE_SELECTOR_ADD_NEW_VALUE } from "./workspace-selector.constants";
import type { WorkspaceListItem } from "./workspace-selector.types";
import {
  parseWorkspacesPayload,
  workspacesLoadErrorMessage,
} from "./workspace-selector.utils";

export function useWorkspaceSelector(resolvedWorkspaceId: string | null) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const pushWithWorkspace = useCallback(
    (workspaceId: string) => {
      const next = new URLSearchParams(searchParams.toString());
      next.set("workspaceId", workspaceId);
      router.push(`${pathname}?${next.toString()}`);
    },
    [router, pathname, searchParams],
  );

  const workspaceIdFromUrl = searchParams.get("workspaceId");

  const [workspaces, setWorkspaces] = useState<WorkspaceListItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const effectiveWorkspaceId = useMemo(() => {
    const validIds = new Set(workspaces.map((w) => w.id));
    if (workspaces.length === 0) {
      return workspaceIdFromUrl ?? resolvedWorkspaceId ?? "";
    }
    if (workspaceIdFromUrl && validIds.has(workspaceIdFromUrl)) {
      return workspaceIdFromUrl;
    }
    if (resolvedWorkspaceId && validIds.has(resolvedWorkspaceId)) {
      return resolvedWorkspaceId;
    }
    return workspaces[0]?.id ?? "";
  }, [workspaces, workspaceIdFromUrl, resolvedWorkspaceId]);

  const refreshWorkspaces = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch("/api/workspaces");
      const data = (await res.json()) as unknown;
      if (!res.ok) {
        setLoadError(workspacesLoadErrorMessage(data, "Could not load companies"));
        setWorkspaces([]);
        return;
      }
      setWorkspaces(parseWorkspacesPayload(data));
    } catch {
      setLoadError("Network error");
      setWorkspaces([]);
    }
  }, []);

  useEffect(() => {
    void refreshWorkspaces();
  }, [refreshWorkspaces]);

  const handleSelectChange = useCallback(
    (value: string) => {
      if (value === WORKSPACE_SELECTOR_ADD_NEW_VALUE) {
        setCreateError(null);
        setNewCompanyName("");
        setAddOpen(true);
        return;
      }
      pushWithWorkspace(value);
    },
    [pushWithWorkspace],
  );

  const handleCloseAdd = useCallback(() => {
    if (creating) return;
    setAddOpen(false);
    setNewCompanyName("");
    setCreateError(null);
  }, [creating]);

  const handleCreateCompany = useCallback(async () => {
    const name = newCompanyName.trim();
    if (!name) {
      setCreateError("Enter a company name");
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok) {
        setCreateError(data.error ?? "Could not create company");
        return;
      }
      if (typeof data.id !== "string") {
        setCreateError("Invalid response from server");
        return;
      }
      await refreshWorkspaces();
      setAddOpen(false);
      setNewCompanyName("");
      pushWithWorkspace(data.id);
    } catch {
      setCreateError("Network error");
    } finally {
      setCreating(false);
    }
  }, [newCompanyName, refreshWorkspaces, pushWithWorkspace]);

  const selectedLabel =
    workspaces.find((w) => w.id === effectiveWorkspaceId)?.name ?? "";

  return {
    workspaces,
    loadError,
    effectiveWorkspaceId,
    selectedLabel,
    addOpen,
    newCompanyName,
    setNewCompanyName,
    creating,
    createError,
    handleSelectChange,
    handleCloseAdd,
    handleCreateCompany,
    addNewValue: WORKSPACE_SELECTOR_ADD_NEW_VALUE,
  };
}
