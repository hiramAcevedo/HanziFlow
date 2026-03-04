"use client";

import { useState } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./sidebar";
import { ChatPanel } from "@/components/chat/chat-panel";
import { ToastProvider } from "@/components/shared/toast";
import { MessageSquare, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [chatOpen, setChatOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <ToastProvider>
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="bg-background border-b border-border sticky top-0 z-10">
          <div className="flex items-center gap-2 px-4 py-2">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1" />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleTheme}
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant={chatOpen ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setChatOpen(!chatOpen)}
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              Chat
            </Button>
          </div>
        </header>
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-auto">
            {children}
          </div>
          {chatOpen && (
            <div className="w-[350px] border-l border-border flex-shrink-0">
              <ChatPanel onClose={() => setChatOpen(false)} />
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
    </ToastProvider>
  );
}
