"use client";

import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessageBubble } from "./chat-message";
import { ChatInput } from "./chat-input";
import { api } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";

interface ChatPanelProps {
  onClose: () => void;
  sessionId?: number;
}

export function ChatPanel({ onClose, sessionId }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load history if session
  useEffect(() => {
    if (!sessionId) return;
    api.chatHistory(sessionId).then((history) => {
      if (history.length > 0) setMessages(history);
    }).catch(() => {});
  }, [sessionId]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text: string) => {
    const userMsg: ChatMessage = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);

    try {
      const { response } = await api.chat(
        updated.map((m) => ({ role: m.role, content: m.content })),
        sessionId,
      );
      setMessages([...updated, { role: "assistant", content: response }]);
    } catch {
      setMessages([
        ...updated,
        { role: "assistant", content: "Error: no se pudo conectar con el servidor." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Chat con tutor</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="text-center text-sm text-muted-foreground mt-8">
            <p>Pregunta sobre vocabulario,</p>
            <p>gramatica o pronunciacion.</p>
            <p className="mt-2 text-xs">Ejemplo: &quot;Que significa 你好?&quot;</p>
          </div>
        )}
        <div className="space-y-3">
          {messages.map((msg, i) => (
            <ChatMessageBubble key={i} message={msg} />
          ))}
          {loading && (
            <div className="flex gap-1 px-3 py-2">
              <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0.1s]" />
              <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0.2s]" />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={loading} />
    </div>
  );
}
