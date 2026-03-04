export interface Folder {
  id: number;
  name: string;
  description: string;
  color: string;
  created_at: string;
  updated_at: string;
  session_count: number;
}

export interface Session {
  id: number;
  folder_id: number | null;
  name: string;
  source: string;
  source_meta: string;
  created_at: string;
  updated_at: string;
  entry_count: number;
}

export interface SessionWithEntries extends Session {
  entries: Entry[];
}

export interface Entry {
  id: number;
  session_id: number | null;
  hanzi: string;
  pinyin: string;
  translation: string;
  source: string;
  position: number;
  start_time: number | null;
  end_time: number | null;
  created_at: string;
}

export interface ChatMessage {
  id?: number;
  chat_id?: number;
  role: "user" | "assistant" | "system";
  content: string;
  created_at?: string;
}
