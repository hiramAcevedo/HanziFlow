"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pencil,
  FolderOpen,
  ChevronRight,
  Plus,
  Radio,
  Archive,
  FileText,
  MoreHorizontal,
  Trash2,
  PencilLine,
  FolderInput,
} from "lucide-react";
import { api } from "@/lib/api";
import { onRefresh } from "@/lib/events";
import { connectCapture } from "@/lib/ws";
import { PromptDialog } from "@/components/shared/prompt-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PickerDialog } from "@/components/shared/picker-dialog";
import type { Folder, Session } from "@/lib/types";

type ModalState =
  | { type: "none" }
  | { type: "createFolder" }
  | { type: "createSession"; folderId?: number }
  | { type: "renameFolder"; folder: Folder }
  | { type: "renameSession"; session: Session }
  | { type: "deleteFolder"; folder: Folder }
  | { type: "deleteSession"; session: Session }
  | { type: "moveSession"; session: Session };

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [limboCount, setLimboCount] = useState(0);
  const [modal, setModal] = useState<ModalState>({ type: "none" });

  const loadData = useCallback(async () => {
    try {
      const [f, s, limbo] = await Promise.all([
        api.listFolders(),
        api.listSessions(),
        api.listEntries({ limbo: true }),
      ]);
      setFolders(f);
      setSessions(s);
      setLimboCount(limbo.length);
    } catch {
      // Server not available — limbo mode
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh sidebar when other pages emit changes
  useEffect(() => {
    const unsubRefresh = onRefresh(loadData);
    return unsubRefresh;
  }, [loadData]);

  // Listen to WS for real-time entry changes (debounced to avoid hammering)
  const wsTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const debouncedLoad = useCallback(() => {
    clearTimeout(wsTimerRef.current);
    wsTimerRef.current = setTimeout(loadData, 500);
  }, [loadData]);

  useEffect(() => {
    const disconnect = connectCapture({
      onEntry: debouncedLoad,
      onUpdate: debouncedLoad,
      onDelete: debouncedLoad,
    });
    return () => {
      disconnect();
      clearTimeout(wsTimerRef.current);
    };
  }, [debouncedLoad]);

  const sessionsForFolder = (folderId: number) =>
    sessions.filter((s) => s.folder_id === folderId);

  const orphanSessions = sessions.filter((s) => s.folder_id === null);

  // --- Actions ---
  const handleCreateFolder = async (name: string) => {
    try {
      await api.createFolder({ name });
      loadData();
    } catch { /* silent */ }
  };

  const handleCreateSession = async (name: string, folderId?: number) => {
    try {
      await api.createSession({ name, folder_id: folderId });
      loadData();
    } catch { /* silent */ }
  };

  const handleRenameFolder = async (name: string, folderId: number) => {
    try {
      await api.updateFolder(folderId, { name } as Partial<Folder>);
      loadData();
    } catch { /* silent */ }
  };

  const handleRenameSession = async (name: string, sessionId: number) => {
    try {
      await api.updateSession(sessionId, { name } as Partial<Session>);
      loadData();
    } catch { /* silent */ }
  };

  const handleDeleteFolder = async (folderId: number) => {
    try {
      await api.deleteFolder(folderId);
      loadData();
    } catch { /* silent */ }
  };

  const handleDeleteSession = async (sessionId: number) => {
    try {
      await api.deleteSession(sessionId);
      loadData();
      if (pathname === `/session/${sessionId}`) {
        router.push("/writer");
      }
    } catch { /* silent */ }
  };

  const handleMoveSession = async (sessionId: number, folderId: number | string) => {
    try {
      const folderIdNum = folderId === "none" ? null : Number(folderId);
      await api.updateSession(sessionId, { folder_id: folderIdNum } as Partial<Session>);
      loadData();
    } catch { /* silent */ }
  };

  const closeModal = () => setModal({ type: "none" });
  const isModalOpen = modal.type !== "none";

  // Build folder picker items for "move session"
  const folderPickerItems = [
    { id: "none" as string | number, label: "Sin carpeta", description: "Quitar de carpeta" },
    ...folders.map((f) => ({ id: f.id, label: f.name })),
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/writer" className="flex items-center gap-3 px-2 py-1">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Pencil className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground">HanziFlow</h1>
            <p className="text-[10px] text-muted-foreground">Escritura china</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* Writer link */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/writer"}>
                <Link href="/writer">
                  <Pencil className="w-4 h-4" />
                  <span>Practicar trazos</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Folders */}
        <SidebarGroup>
          <SidebarGroupLabel>Carpetas</SidebarGroupLabel>
          <SidebarGroupAction onClick={() => setModal({ type: "createFolder" })} title="Nueva carpeta">
            <Plus className="w-4 h-4" />
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {folders.map((folder) => (
                <Collapsible key={folder.id} defaultOpen>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton>
                        <div
                          className="w-3 h-3 rounded-sm flex-shrink-0"
                          style={{ backgroundColor: folder.color }}
                        />
                        <span>{folder.name}</span>
                        <ChevronRight className="ml-auto w-4 h-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>

                    {/* Folder dropdown menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="absolute right-1 top-1.5 p-1 rounded-md opacity-0 group-hover/menu-item:opacity-100 hover:bg-accent transition-opacity">
                          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="right" align="start">
                        <DropdownMenuItem onClick={() => setModal({ type: "renameFolder", folder })}>
                          <PencilLine className="w-4 h-4" />
                          Renombrar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setModal({ type: "deleteFolder", folder })}
                        >
                          <Trash2 className="w-4 h-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {sessionsForFolder(folder.id).map((session) => (
                          <SidebarMenuSubItem key={session.id} className="group/sub-item relative">
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === `/session/${session.id}`}
                            >
                              <Link href={`/session/${session.id}`}>
                                <FileText className="w-3 h-3" />
                                <span>{session.name}</span>
                              </Link>
                            </SidebarMenuSubButton>

                            {/* Session dropdown menu */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="absolute right-0 top-0.5 p-1 rounded-md opacity-0 group-hover/sub-item:opacity-100 hover:bg-accent transition-opacity">
                                  <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent side="right" align="start">
                                <DropdownMenuItem onClick={() => setModal({ type: "renameSession", session })}>
                                  <PencilLine className="w-4 h-4" />
                                  Renombrar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setModal({ type: "moveSession", session })}>
                                  <FolderInput className="w-4 h-4" />
                                  Mover a carpeta...
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() => setModal({ type: "deleteSession", session })}
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </SidebarMenuSubItem>
                        ))}
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            className="text-muted-foreground cursor-pointer"
                            onClick={() => setModal({ type: "createSession", folderId: folder.id })}
                          >
                            <Plus className="w-3 h-3" />
                            <span>Nueva sesion</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Orphan sessions (no folder) */}
        {orphanSessions.length > 0 && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Sin carpeta</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {orphanSessions.map((session) => (
                    <SidebarMenuItem key={session.id} className="group/orphan relative">
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === `/session/${session.id}`}
                      >
                        <Link href={`/session/${session.id}`}>
                          <FileText className="w-4 h-4" />
                          <span>{session.name}</span>
                        </Link>
                      </SidebarMenuButton>

                      {/* Orphan session dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="absolute right-1 top-1.5 p-1 rounded-md opacity-0 group-hover/orphan:opacity-100 hover:bg-accent transition-opacity">
                            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" align="start">
                          <DropdownMenuItem onClick={() => setModal({ type: "renameSession", session })}>
                            <PencilLine className="w-4 h-4" />
                            Renombrar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setModal({ type: "moveSession", session })}>
                            <FolderInput className="w-4 h-4" />
                            Mover a carpeta...
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setModal({ type: "deleteSession", session })}
                          >
                            <Trash2 className="w-4 h-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        <SidebarSeparator />

        {/* Limbo + Live */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/limbo"}>
                  <Link href="/limbo">
                    <Archive className="w-4 h-4" />
                    <span>Limbo</span>
                    {limboCount > 0 && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {limboCount}
                      </span>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/current-session"}
                >
                  <Link href="/current-session">
                    <Radio className="w-4 h-4 text-red-500" />
                    <span>Captura en vivo</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="px-2 py-1 text-[10px] text-muted-foreground">
          HanziFlow v0.2.0
        </div>
      </SidebarFooter>

      {/* --- Modals --- */}

      {/* Create folder */}
      <PromptDialog
        open={modal.type === "createFolder"}
        onOpenChange={(open) => !open && closeModal()}
        title="Nueva carpeta"
        placeholder="Nombre de la carpeta"
        onSubmit={handleCreateFolder}
      />

      {/* Create session */}
      <PromptDialog
        open={modal.type === "createSession"}
        onOpenChange={(open) => !open && closeModal()}
        title="Nueva sesion"
        placeholder="Nombre de la sesion"
        onSubmit={(name) =>
          handleCreateSession(name, modal.type === "createSession" ? modal.folderId : undefined)
        }
      />

      {/* Rename folder */}
      <PromptDialog
        open={modal.type === "renameFolder"}
        onOpenChange={(open) => !open && closeModal()}
        title="Renombrar carpeta"
        placeholder="Nuevo nombre"
        defaultValue={modal.type === "renameFolder" ? modal.folder.name : ""}
        onSubmit={(name) => {
          if (modal.type === "renameFolder") handleRenameFolder(name, modal.folder.id);
        }}
      />

      {/* Rename session */}
      <PromptDialog
        open={modal.type === "renameSession"}
        onOpenChange={(open) => !open && closeModal()}
        title="Renombrar sesion"
        placeholder="Nuevo nombre"
        defaultValue={modal.type === "renameSession" ? modal.session.name : ""}
        onSubmit={(name) => {
          if (modal.type === "renameSession") handleRenameSession(name, modal.session.id);
        }}
      />

      {/* Delete folder */}
      <ConfirmDialog
        open={modal.type === "deleteFolder"}
        onOpenChange={(open) => !open && closeModal()}
        title="Eliminar carpeta"
        description={
          modal.type === "deleteFolder"
            ? `Se eliminara la carpeta "${modal.folder.name}" y todas sus sesiones. Esta accion no se puede deshacer.`
            : ""
        }
        onConfirm={() => {
          if (modal.type === "deleteFolder") handleDeleteFolder(modal.folder.id);
        }}
      />

      {/* Delete session */}
      <ConfirmDialog
        open={modal.type === "deleteSession"}
        onOpenChange={(open) => !open && closeModal()}
        title="Eliminar sesion"
        description={
          modal.type === "deleteSession"
            ? `Se eliminara la sesion "${modal.session.name}" y todas sus entradas. Esta accion no se puede deshacer.`
            : ""
        }
        onConfirm={() => {
          if (modal.type === "deleteSession") handleDeleteSession(modal.session.id);
        }}
      />

      {/* Move session to folder */}
      <PickerDialog
        open={modal.type === "moveSession"}
        onOpenChange={(open) => !open && closeModal()}
        title="Mover a carpeta"
        items={folderPickerItems}
        onSelect={(folderId) => {
          if (modal.type === "moveSession") handleMoveSession(modal.session.id, folderId);
        }}
        allowCreate
        createLabel="Nueva carpeta"
        onCreate={async (name) => {
          if (modal.type !== "moveSession") return;
          try {
            const folder = await api.createFolder({ name });
            await api.updateSession(modal.session.id, { folder_id: folder.id } as Partial<Session>);
            loadData();
          } catch { /* silent */ }
        }}
      />
    </Sidebar>
  );
}
