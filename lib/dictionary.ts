/**
 * Dictionary service for Chinese character lookup.
 *
 * - Pinyin: via `pinyin-pro` (client-side, accurate tone marks)
 * - Definitions: via CC-CEDICT pre-processed JSON dictionaries
 *
 * The "common" dictionary (~5 000 chars, ~340 KB) is loaded eagerly.
 * The "full" dictionary (~11 000 chars, ~700 KB) is fetched on demand
 * only when a character isn't found in the common set.
 */

import { pinyin } from "pinyin-pro";

export interface CharacterInfo {
  pinyin: string;
  definition: string;
}

type DictData = Record<string, { p: string; d: string }>;

// ── Common dictionary (loaded eagerly on first call) ────────────────
let commonDict: DictData | null = null;
let commonPromise: Promise<DictData> | null = null;

async function loadCommonDict(): Promise<DictData> {
  if (commonDict) return commonDict;
  if (commonPromise) return commonPromise;

  commonPromise = fetch("/dict/dict-common.json")
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load common dict: ${res.status}`);
      return res.json() as Promise<DictData>;
    })
    .then((data) => {
      commonDict = data;
      return data;
    });

  return commonPromise;
}

// ── Full dictionary (loaded on demand, cached) ──────────────────────
let fullDict: DictData | null = null;
let fullPromise: Promise<DictData> | null = null;

async function loadFullDict(): Promise<DictData> {
  if (fullDict) return fullDict;
  if (fullPromise) return fullPromise;

  fullPromise = fetch("/dict/dict-full.json")
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load full dict: ${res.status}`);
      return res.json() as Promise<DictData>;
    })
    .then((data) => {
      fullDict = data;
      return data;
    });

  return fullPromise;
}

// ── Public API ──────────────────────────────────────────────────────

/**
 * Get pinyin for a single Chinese character using pinyin-pro.
 * Returns tone-marked pinyin (e.g. "wǒ").
 */
export function getPinyin(char: string): string {
  return pinyin(char, { toneType: "symbol", type: "string" });
}

/**
 * Look up a character's definition from the dictionary.
 * Tries common dict first, falls back to full dict.
 * Returns null if not found.
 */
export async function getDefinition(char: string): Promise<string | null> {
  const common = await loadCommonDict();
  if (common[char]) return common[char].d;

  const full = await loadFullDict();
  if (full[char]) return full[char].d;

  return null;
}

/**
 * Get full character info (pinyin + definition).
 * Pinyin is always available (via pinyin-pro), definition may be empty.
 */
export async function getCharacterInfo(char: string): Promise<CharacterInfo> {
  const py = getPinyin(char);
  const def = await getDefinition(char);
  return {
    pinyin: py,
    definition: def ?? "",
  };
}

/**
 * Batch lookup: get info for multiple characters at once.
 * More efficient than calling getCharacterInfo one by one because
 * the dictionary is loaded only once.
 */
export async function getCharacterInfoBatch(
  chars: string[],
): Promise<Record<string, CharacterInfo>> {
  // Ensure common dict is loaded
  await loadCommonDict();

  const result: Record<string, CharacterInfo> = {};
  const needFull: string[] = [];

  for (const char of chars) {
    const py = getPinyin(char);
    if (commonDict && commonDict[char]) {
      result[char] = { pinyin: py, definition: commonDict[char].d };
    } else {
      result[char] = { pinyin: py, definition: "" };
      needFull.push(char);
    }
  }

  // Only load full dict if we have characters not found in common
  if (needFull.length > 0) {
    const full = await loadFullDict();
    for (const char of needFull) {
      if (full[char]) {
        result[char].definition = full[char].d;
      }
    }
  }

  return result;
}
