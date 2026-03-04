/**
 * Lightweight app-wide event bus using CustomEvent.
 * Used to coordinate sidebar refresh across pages.
 */
export function emitRefresh() {
  window.dispatchEvent(new CustomEvent("hanziflow:refresh"));
}

export function onRefresh(callback: () => void): () => void {
  window.addEventListener("hanziflow:refresh", callback);
  return () => window.removeEventListener("hanziflow:refresh", callback);
}
