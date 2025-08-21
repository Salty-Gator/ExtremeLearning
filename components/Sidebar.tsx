"use client";

import { useMemo } from "react";
import { Button } from "@heroui/button";
import { ScrollShadow } from "@heroui/react";
import { getFirebaseAuth } from "@/lib/firebase/client";

export type SidebarChatSummary = {
  id: string;
  title: string;
  createdAt: number;
};

type SidebarProps = {
  minimized: boolean;
  onToggleMinimize: () => void;
  chats: SidebarChatSummary[];
  onSelectChat: (id: string) => void;
  onSaveCurrent: () => void;
  onDeleteChat: (id: string) => void;
  onNewChat: () => void;
};

export default function Sidebar({ minimized, onToggleMinimize, chats, onSelectChat, onSaveCurrent, onDeleteChat, onNewChat }: SidebarProps) {
  const widthClass = minimized ? "w-[56px]" : "w-[280px]";
  const auth = useMemo(() => getFirebaseAuth(), []);

  return (
    <aside className={`${widthClass} fixed left-0 top-0 bg-content1 h-[100dvh] flex flex-col`}
      aria-label="Sidebar with saved chats and logout"
    >
      <div className="px-2 py-2 flex items-center justify-between gap-2">
        <Button isIconOnly size="sm" variant="flat" aria-label={minimized ? "Expand sidebar" : "Collapse sidebar"} onPress={onToggleMinimize}>
          {minimized ? (
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 5l5 5-5 5" />
            </svg>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l-5 5 5 5" />
            </svg>
          )}
        </Button>
        {!minimized && (
          <div className="text-sm font-semibold">Saved Chats</div>
        )}
        <div className="flex items-center gap-1">
          {!minimized && (
            <Button size="sm" variant="flat" onPress={onSaveCurrent}>
              Save
            </Button>
          )}
          <Button isIconOnly size="sm" color="secondary" variant="solid" aria-label="New chat" onPress={onNewChat}>
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 4v12M4 10h12" />
            </svg>
          </Button>
        </div>
      </div>

      <ScrollShadow hideScrollBar className="flex-1">
        <div className="p-2 flex flex-col gap-1">
          {chats.length === 0 && !minimized && (
            <div className="text-default-500 text-sm px-2 py-1">No saved chats yet.</div>
          )}
          {chats.map((c) => (
            <div key={c.id} className="group rounded-medium border border-default-200 bg-content2/60 px-2 py-1 flex items-center justify-between gap-2">
              {!minimized ? (
                <button className="text-left text-sm flex-1 truncate" onClick={() => onSelectChat(c.id)} title={c.title}>
                  {c.title}
                </button>
              ) : (
                <button className="text-left text-sm flex-1" onClick={() => onSelectChat(c.id)} title={c.title}>
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 6h10M5 10h10M5 14h6" />
                  </svg>
                </button>
              )}
              {!minimized && (
                <Button isIconOnly size="sm" variant="light" aria-label="Delete chat" onPress={() => onDeleteChat(c.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l8 8M14 6l-8 8" />
                  </svg>
                </Button>
              )}
            </div>
          ))}
        </div>
      </ScrollShadow>

      <div className="px-2 py-2 flex items-center justify-between gap-2" />
    </aside>
  );
}


