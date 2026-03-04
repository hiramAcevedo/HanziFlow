import type { Entry } from "./types";

export interface CaptureCallbacks {
  onEntry?: (entry: Entry) => void;
  onUpdate?: (entry: Entry) => void;
  onDelete?: (entryId: number) => void;
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000";

export function connectCapture(callbacks: CaptureCallbacks): () => void {
  let ws: WebSocket | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;

  function connect() {
    if (stopped) return;
    ws = new WebSocket(`${WS_URL}/ws/capture`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case "new_entry":
            if (data.entry) callbacks.onEntry?.(data.entry as Entry);
            break;
          case "update_entry":
            if (data.entry) callbacks.onUpdate?.(data.entry as Entry);
            break;
          case "delete_entry":
            if (data.entry_id) callbacks.onDelete?.(data.entry_id as number);
            break;
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      if (!stopped) {
        retryTimer = setTimeout(connect, 3000);
      }
    };

    ws.onerror = () => {
      ws?.close();
    };
  }

  connect();

  return () => {
    stopped = true;
    if (retryTimer) clearTimeout(retryTimer);
    ws?.close();
  };
}
