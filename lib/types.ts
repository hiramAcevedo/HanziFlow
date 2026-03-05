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

// --- HSK Vocabulary ---

export interface HskVocab {
  simplified: string;
  traditional: string;
  pinyin: string;
  pinyin_numeric: string;
  radical: string;
  pos: string;
  entry_type: string;
  frequency_rank: number | null;
  meanings_en: string;
  classifiers: string;
  hsk_version: string | null;
  level: number | null;
  study_count: number;
  last_studied_at: string | null;
  notes: string;
  has_notes: boolean;
}

export interface HskLevelSummary {
  version: string;
  level: number;
  total: number;
  studied: number;
}

export interface CharacterDecomposition {
  simplified: string;
  traditional: string;
  pinyin: string;
  meanings_en: string;
}

export interface HskVocabDetail {
  simplified: string;
  traditional: string;
  pinyin: string;
  pinyin_numeric: string;
  radical: string;
  pos: string;
  entry_type: string;
  frequency_rank: number | null;
  meanings_en: string;
  classifiers: string;
  variants: string;
  levels: Array<{ hsk_version: string; level: number; order_in_level: number | null; category: string | null }>;
  characters: CharacterDecomposition[];
  study_count: number;
  last_studied_at: string | null;
  notes: string;
}

// --- Vaults ---

export interface Vault {
  id: number;
  name: string;
  description: string;
  color: string;
  created_at: string;
  updated_at: string;
  entry_count: number;
}

export interface VaultEntry {
  simplified: string;
  traditional: string;
  pinyin: string;
  meanings_en: string;
  position: number;
  added_at: string;
}
