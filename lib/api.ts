import type { Folder, Session, SessionWithEntries, Entry, ChatMessage } from "./types";

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
};
