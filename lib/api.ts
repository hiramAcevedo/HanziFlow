import type {
  Folder, Session, SessionWithEntries, Entry, ChatMessage,
  HskVocab, HskLevelSummary, HskVocabDetail, Vault, VaultEntry,
} from "./types";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

// --- Folders ---

export const api = {
  // Folders
  listFolders: () => request<Folder[]>("/api/folders"),

  createFolder: (data: { name: string; description?: string; color?: string }) =>
    request<Folder>("/api/folders", { method: "POST", body: JSON.stringify(data) }),

  updateFolder: (id: number, data: Partial<Folder>) =>
    request<Folder>(`/api/folders/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  deleteFolder: (id: number) =>
    request<{ ok: boolean }>(`/api/folders/${id}`, { method: "DELETE" }),

  // Sessions
  listSessions: (params?: { folder_id?: number; source?: string }) => {
    const qs = new URLSearchParams();
    if (params?.folder_id != null) qs.set("folder_id", String(params.folder_id));
    if (params?.source) qs.set("source", params.source);
    const q = qs.toString();
    return request<Session[]>(`/api/sessions${q ? `?${q}` : ""}`);
  },

  createSession: (data: { name: string; folder_id?: number; source?: string }) =>
    request<Session>("/api/sessions", { method: "POST", body: JSON.stringify(data) }),

  getSession: (id: number) =>
    request<SessionWithEntries>(`/api/sessions/${id}`),

  updateSession: (id: number, data: Partial<Session>) =>
    request<Session>(`/api/sessions/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  deleteSession: (id: number) =>
    request<{ ok: boolean }>(`/api/sessions/${id}`, { method: "DELETE" }),

  // Entries
  listEntries: (params?: { session_id?: number; limbo?: boolean; since?: string }) => {
    const qs = new URLSearchParams();
    if (params?.session_id != null) qs.set("session_id", String(params.session_id));
    if (params?.limbo) qs.set("limbo", "true");
    if (params?.since) qs.set("since", params.since);
    const q = qs.toString();
    return request<Entry[]>(`/api/entries${q ? `?${q}` : ""}`);
  },

  createEntry: (data: { hanzi: string; pinyin?: string; translation?: string; session_id?: number; source?: string }) =>
    request<Entry>("/api/entries", { method: "POST", body: JSON.stringify(data) }),

  createEntriesBatch: (entries: Array<{ hanzi: string; pinyin?: string; translation?: string; session_id?: number; source?: string }>) =>
    request<Entry[]>("/api/entries/batch", { method: "POST", body: JSON.stringify({ entries }) }),

  assignEntries: (entry_ids: number[], session_id: number) =>
    request<{ ok: boolean; count: number }>("/api/entries/assign", {
      method: "PUT",
      body: JSON.stringify({ entry_ids, session_id }),
    }),

  updateEntry: (id: number, data: Partial<Entry>) =>
    request<Entry>(`/api/entries/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  deleteEntry: (id: number) =>
    request<{ ok: boolean }>(`/api/entries/${id}`, { method: "DELETE" }),

  // Chat / LLM
  translate: (text: string) =>
    request<{ translation: string }>("/api/translate", {
      method: "POST",
      body: JSON.stringify({ text }),
    }),

  explainContext: (phrases: string[]) =>
    request<{ explanation: string }>("/api/context", {
      method: "POST",
      body: JSON.stringify({ phrases }),
    }),

  chat: (messages: { role: string; content: string }[], session_id?: number) =>
    request<{ response: string }>("/api/chat", {
      method: "POST",
      body: JSON.stringify({ messages, session_id }),
    }),

  chatHistory: (session_id: number) =>
    request<ChatMessage[]>(`/api/chat/history/${session_id}`),

  // Health
  health: () => request<{ status: string; ollama: boolean }>("/api/health"),

  // HSK Vocabulary
  hskLevels: () => request<HskLevelSummary[]>("/api/hsk/levels"),

  hskVocabulary: (params: { version?: string; level?: number; offset?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params.version) qs.set("version", params.version);
    if (params.level != null) qs.set("level", String(params.level));
    if (params.offset != null) qs.set("offset", String(params.offset));
    if (params.limit != null) qs.set("limit", String(params.limit));
    const q = qs.toString();
    return request<HskVocab[]>(`/api/hsk/vocabulary${q ? `?${q}` : ""}`);
  },

  hskVocabDetail: (simplified: string) =>
    request<HskVocabDetail>(`/api/hsk/vocabulary/${encodeURIComponent(simplified)}`),

  hskMarkSeen: (simplified: string) =>
    request<{ ok: boolean }>(`/api/hsk/vocabulary/${encodeURIComponent(simplified)}/seen`, { method: "POST" }),

  hskUpdateNotes: (simplified: string, notes: string) =>
    request<{ ok: boolean }>(`/api/hsk/vocabulary/${encodeURIComponent(simplified)}/notes`, {
      method: "PUT",
      body: JSON.stringify({ notes }),
    }),

  hskResetProgress: () =>
    request<{ ok: boolean }>("/api/hsk/progress", { method: "DELETE" }),

  hskSearch: (q: string, limit?: number) => {
    const qs = new URLSearchParams({ q });
    if (limit != null) qs.set("limit", String(limit));
    return request<HskVocab[]>(`/api/hsk/search?${qs}`);
  },

  // Vaults
  listVaults: () => request<Vault[]>("/api/vaults"),

  createVault: (data: { name: string; description?: string; color?: string }) =>
    request<Vault>("/api/vaults", { method: "POST", body: JSON.stringify(data) }),

  updateVault: (id: number, data: { name?: string; description?: string; color?: string }) =>
    request<Vault>(`/api/vaults/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  deleteVault: (id: number) =>
    request<{ ok: boolean }>(`/api/vaults/${id}`, { method: "DELETE" }),

  vaultEntries: (vaultId: number) =>
    request<VaultEntry[]>(`/api/vaults/${vaultId}/entries`),

  addToVault: (vaultId: number, simplified: string) =>
    request<VaultEntry>(`/api/vaults/${vaultId}/entries`, {
      method: "POST",
      body: JSON.stringify({ simplified }),
    }),

  removeFromVault: (vaultId: number, simplified: string) =>
    request<{ ok: boolean }>(`/api/vaults/${vaultId}/entries/${encodeURIComponent(simplified)}`, {
      method: "DELETE",
    }),
};
