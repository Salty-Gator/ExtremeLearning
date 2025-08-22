"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardFooter, ScrollShadow, Avatar, Tooltip } from "@heroui/react";
import Sidebar, { type SidebarChatSummary } from "@/components/Sidebar";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase/client";
import { doc, setDoc, collection, serverTimestamp, getDoc, deleteDoc, increment } from "firebase/firestore";
import { getRandomDadJoke } from "../../lib/jokes";
import { Link } from "@heroui/link";
import { Input } from "@heroui/input";
import { Kbd } from "@heroui/kbd";
import { Listbox, ListboxItem } from "@heroui/listbox";
import clsx from "clsx";
import AuthGate from "@/lib/authz/AuthGate";
import { useAuthz } from "@/lib/authz/context";

// Safe UUID v4 generator with fallbacks for environments lacking crypto.randomUUID
function generateId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof (crypto as any).randomUUID === "function") {
      return (crypto as any).randomUUID();
    }
  } catch {}
  const getRandomValues = (typeof crypto !== "undefined" && (crypto as any).getRandomValues)
    ? (crypto as any).getRandomValues.bind(crypto)
    : null;
  const randomNibble = () => {
    if (getRandomValues) {
      const arr = new Uint8Array(1);
      getRandomValues(arr);
      return arr[0] & 0x0f;
    }
    return Math.floor(Math.random() * 16);
  };
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = randomNibble();
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  fullPrompt?: string;
  openaiSource?: "assistants" | "chat_completions";
};

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sidebarMin, setSidebarMin] = useState(false);
  const [savedChats, setSavedChats] = useState<SidebarChatSummary[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [waitingTexts, setWaitingTexts] = useState<string[]>([]);
  const [waitingIndex, setWaitingIndex] = useState<number>(0);
  const listRef = useRef<HTMLDivElement | null>(null);
  const waitingTextsRef = useRef<string[]>([]);
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();
  const { isAdmin } = useAuthz();

  // Admin editor state
  const [editorMode, setEditorMode] = useState<"rich" | "md">("rich");
  const richRef = useRef<HTMLDivElement | null>(null);
  const [markdownText, setMarkdownText] = useState<string>("");
  const [noteFilename, setNoteFilename] = useState<string>("");
  const [saveMessage, setSaveMessage] = useState<string>("");

  const renderMessageContent = (content: string, annotations?: Array<any>) => {
    // Extract footnotes of the form: [1]: https://example.com
    const footnoteRegex = /^\[(\d+)\]:\s+(\S+)/gm;
    const footnotes = new Map<string, string>();
    let match: RegExpExecArray | null;
    while ((match = footnoteRegex.exec(content)) !== null) {
      footnotes.set(match[1], match[2]);
    }
    const contentWithoutFootnotes = content.replace(footnoteRegex, "").replace(/\u3010\d+:\d+†source\u3011/g, "").trim();

    // Helper to render inline text with clickable citations and URLs
    const renderInlineText = (text: string) => {
      const renderInlineEmphasis = (segment: string) => {
        const pieces: React.ReactNode[] = [];
        const regex = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)/g;
        let last = 0;
        let idx = 0;
        let m: RegExpExecArray | null;
        while ((m = regex.exec(segment)) !== null) {
          if (m.index > last) {
            pieces.push(<span key={`t-${idx++}`}>{segment.slice(last, m.index)}</span>);
          }
          if (m[1]) {
            pieces.push(
              <code key={`code-${idx++}`} className="px-1 py-0.5 rounded-small bg-default-200 text-xs">
                {m[1].slice(1, -1)}
              </code>,
            );
          } else if (m[2]) {
            pieces.push(
              <strong key={`b-${idx++}`} className="font-semibold text-foreground">
                {m[2].slice(2, -2)}
              </strong>,
            );
          } else if (m[3]) {
            pieces.push(
              <em key={`i-${idx++}`} className="italic">
                {m[3].slice(1, -1)}
              </em>,
            );
          }
          last = regex.lastIndex;
        }
        if (last < segment.length) {
          pieces.push(<span key={`t-${idx++}`}>{segment.slice(last)}</span>);
        }
        return pieces;
      };

      const nodes: React.ReactNode[] = [];
      const pattern = /(https?:\/\/[^\s)]+)|\[(\d+)\]/g;
      let m: RegExpExecArray | null;
      let lastIndex = 0;
      while ((m = pattern.exec(text)) !== null) {
        if (m.index > lastIndex) {
          nodes.push(
            <span key={`t-${lastIndex}`}>{renderInlineEmphasis(text.slice(lastIndex, m.index))}</span>,
          );
        }
        if (m[1]) {
          const url = m[1];
          nodes.push(
            <Link key={`u-${m.index}`} isExternal href={url} className="text-primary underline-offset-2">
              {url}
            </Link>,
          );
        } else if (m[2]) {
          const id = m[2];
          const href = footnotes.get(id);
          nodes.push(
            href ? (
              <Link
                key={`c-${m.index}`}
                isExternal
                href={href}
                title={href}
                className="align-baseline inline-flex items-center mx-1 px-1.5 py-0.5 rounded-medium bg-default-200 text-foreground text-[0.65rem] leading-none hover:text-primary"
              >
                [{id}:†source]
              </Link>
            ) : (
              <sup key={`c-${m.index}`} className="mx-0.5 text-[0.7rem] text-default-500">[{id}]</sup>
            ),
          );
        }
        lastIndex = pattern.lastIndex;
      }
      if (lastIndex < text.length) {
        nodes.push(<span key={`t-end`}>{renderInlineEmphasis(text.slice(lastIndex))}</span>);
      }
      return nodes;
    };
    // Basic renderer: supports fenced code blocks ```...``` and markdown-like headings/lists/quotes
    const parts: Array<{ type: "code" | "text"; value: string }> = [];
    const fence = /```([\s\S]*?)```/g;
    let lastIndex = 0;
    let fenceMatch: RegExpExecArray | null;
    while ((fenceMatch = fence.exec(contentWithoutFootnotes)) !== null) {
      if (fenceMatch.index > lastIndex) {
        parts.push({ type: "text", value: contentWithoutFootnotes.slice(lastIndex, fenceMatch.index) });
      }
      parts.push({ type: "code", value: fenceMatch[1].trimEnd() });
      lastIndex = fence.lastIndex;
    }
    if (lastIndex < contentWithoutFootnotes.length) {
      parts.push({ type: "text", value: contentWithoutFootnotes.slice(lastIndex) });
    }

    const renderFormattedText = (text: string) => {
      const lines = text.split(/\r?\n/);
      const nodes: React.ReactNode[] = [];
      let i = 0;
      let key = 0;

      const pushHeading = (level: number, value: string) => {
        const classes =
          level === 1
            ? "text-2xl font-bold text-primary"
            : level === 2
            ? "text-xl font-semibold text-primary"
            : level === 3
            ? "text-lg font-semibold text-primary"
            : "font-semibold text-primary";
        nodes.push(
          <div key={`h-${key++}`} className={classes}>
            {renderInlineText(value)}
          </div>,
        );
      };

      const collectList = (ordered: boolean) => {
        const items: React.ReactNode[] = [];
        while (i < lines.length) {
          const line = lines[i];
          const ul = line.match(/^(?:\*|-)\s+(.+)/);
          const ol = line.match(/^\d+\.\s+(.+)/);
          if ((ordered && ol) || (!ordered && ul)) {
            const content = (ordered ? ol![1] : ul![1]).trimEnd();
            items.push(<li key={`li-${items.length}`}>{renderInlineText(content)}</li>);
            i += 1;
          } else if (line.trim() === "") {
            i += 1; // skip blank lines inside lists
          } else {
            break;
          }
        }
        nodes.push(
          ordered ? (
            <ol key={`ol-${key++}`} className="list-decimal pl-5 space-y-1">
              {items}
            </ol>
          ) : (
            <ul key={`ul-${key++}`} className="list-disc pl-5 space-y-1">
              {items}
            </ul>
          ),
        );
      };

      while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trimEnd();

        // horizontal rule
        if (/^(?:\*{3,}|-{3,}|_{3,})$/.test(trimmed)) {
          nodes.push(<hr key={`hr-${key++}`} className="border-default-200 my-2" />);
          i += 1;
          continue;
        }

        // heading (allow optional leading spaces)
        const heading = trimmed.match(/^\s*(#{1,6})\s+(.+)$/);
        if (heading) {
          pushHeading(heading[1].length, heading[2]);
          i += 1;
          continue;
        }

        // blockquote
        const bq = trimmed.match(/^>\s+(.+)$/);
        if (bq) {
          nodes.push(
            <div key={`bq-${key++}`} className="border-l-2 border-default-300 pl-3 text-default-600 italic">
              {renderInlineText(bq[1])}
            </div>,
          );
          i += 1;
          continue;
        }

        // lists
        if (/^(?:\*|-)\s+/.test(trimmed)) {
          collectList(false);
          continue;
        }
        if (/^\d+\.\s+/.test(trimmed)) {
          collectList(true);
          continue;
        }

        // paragraph: gather until blank line or special block
        if (trimmed !== "") {
          const para: string[] = [trimmed];
          i += 1;
          while (i < lines.length) {
            const peek = lines[i].trimEnd();
            if (
              peek === "" ||
              /^(#{1,6})\s+/.test(peek) ||
              /^(?:\*|-)\s+/.test(peek) ||
              /^\d+\.\s+/.test(peek) ||
              /^>\s+/.test(peek) ||
              /^(?:\*{3,}|-{3,}|_{3,})$/.test(peek)
            ) {
              break;
            }
            para.push(peek);
            i += 1;
          }
          nodes.push(
            <p key={`p-${key++}`} className="whitespace-pre-wrap leading-relaxed text-[0.95rem]">
              {renderInlineText(para.join(" \n"))}
            </p>,
          );
          continue;
        }

        // blank line
        i += 1;
      }

      return <>{nodes}</>;
    };

    return (
      <div className="space-y-3">
        {parts.map((p, i) =>
          p.type === "code" ? (
            <pre
              key={i}
              className="bg-content2/80 text-foreground border border-default-200 rounded-medium p-3 overflow-x-auto text-xs font-mono"
            >
              <code>{p.value}</code>
            </pre>
          ) : (
            <div key={i}>{renderFormattedText(p.value)}</div>
          ),
        )}
        {(footnotes.size > 0 || (annotations && annotations.length > 0)) && (
          <div className="pt-2 border-t border-default-200 mt-2">
            <div className="text-[0.7rem] uppercase tracking-wide text-default-500 mb-2">Sources</div>
            <div className="flex flex-wrap gap-2">
              {Array.from(footnotes.entries())
                .sort((a, b) => Number(a[0]) - Number(b[0]))
                .map(([id, href]) => (
                  <Link
                    key={id}
                    isExternal
                    href={href}
                    title={href}
                    className="inline-flex items-center text-xs px-2 py-1 rounded-medium bg-default-100 text-foreground hover:text-primary"
                  >
                    [{id}:†source]
                  </Link>
                ))}
              {(annotations || [])
                .filter((a) => a.type === "url_citation" && a.url)
                .map((a, idx) => (
                  <Link
                    key={`ann-${idx}`}
                    isExternal
                    href={a.url}
                    title={a.url}
                    className="inline-flex items-center text-xs px-2 py-1 rounded-medium bg-default-100 text-foreground hover:text-primary"
                  >
                    [{idx + 1}:†source]
                  </Link>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Keep a live ref to waiting texts for safe interval modulo
  useEffect(() => {
    waitingTextsRef.current = waitingTexts;
  }, [waitingTexts]);

  // When waiting for a response, show rotating helper text and a dad joke
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isLoading) {
      setWaitingIndex(0);
      const joke = getRandomDadJoke();
      setWaitingTexts([
        "We are working on a tailored response to your prompt.",
        "While you wait enjoy a dad joke on us.",
        joke,
      ]);

      interval = setInterval(() => {
        setWaitingIndex((prev) => {
          const len = Math.max(1, waitingTextsRef.current.length || 1);
          return (prev + 1) % len;
        });
      }, 11000);
    }
    return () => {
      if (interval) clearInterval(interval);
      setWaitingIndex(0);
    };
  }, [isLoading]);

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const copyMessageAsHtml = async (messageId: string, fallbackText: string) => {
    try {
      const element = document.getElementById(`msg-${messageId}`);
      const html = element?.innerHTML ?? "";
      const plain = element?.textContent ?? fallbackText;
      // Prefer rich HTML when available
      if (typeof (window as any).ClipboardItem !== "undefined" && html) {
        const item = new (window as any).ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([plain], { type: "text/plain" }),
        });
        await navigator.clipboard.write([item]);
      } else {
        await navigator.clipboard.writeText(plain);
      }
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy message as HTML:", err);
      await copyToClipboard(fallbackText, messageId);
    }
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: "user",
      content: trimmed,
      createdAt: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    // Ensure a new chat record exists if one hasn't been started yet
    if (!currentChatId) {
      const newId = generateId();
      const createdAt = Date.now();
      setCurrentChatId(newId);
      const provisionalTitle = trimmed.slice(0, 64) || "Untitled chat";
      const next = [{ id: newId, title: provisionalTitle, createdAt }, ...savedChats.filter((c) => c.id !== newId)].slice(0, 50);
      persistSavedChats(next);
      try {
        const user = auth.currentUser;
        if (user) {
          const ref = doc(collection(db, "userProfiles", user.uid, "chats"), newId);
          await setDoc(
            ref,
            {
              title: provisionalTitle,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              messages: [
                {
                  id: userMsg.id,
                  role: userMsg.role,
                  content: userMsg.content,
                  createdAt: userMsg.createdAt,
                },
              ],
            },
            { merge: true },
          );
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("Failed to create initial chat record:", e);
      }
    }
    setIsLoading(true);

    try {
      const user = auth.currentUser;
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(user?.uid ? { "x-user-id": user.uid } : {}) },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: trimmed },
          ],
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Request failed");
      }
      const data = await res.json();
      // If server returned fullPrompt and source, retroactively store them on the last user message
      if (data?.fullPrompt || data?.openaiSource) {
        setMessages((prev) => {
          const next = [...prev];
          // Find the last user message we just sent
          for (let i = next.length - 1; i >= 0; i -= 1) {
            if (next[i].role === "user") {
              next[i] = {
                ...next[i],
                fullPrompt: data.fullPrompt || next[i].fullPrompt,
                openaiSource: (data.openaiSource as any) || next[i].openaiSource,
              } as any;
              break;
            }
          }
          return next;
        });
      }
      const assistantMsg: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: data.content || "(No content)",
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Log OpenAI token usage to Firestore (cumulative and daily) if available
      try {
        const usage = data?.usage || {};
        const prompt = Number(usage?.prompt_tokens || 0);
        const completion = Number(usage?.completion_tokens || 0);
        const total = Number(usage?.total_tokens || prompt + completion);
        const model = String(data?.model || "");
        const u = auth.currentUser;
        if (u && (prompt || completion || total)) {
          // Cumulative totals
          const cumRef = doc(collection(db, "usage"), u.uid);
          await setDoc(
            cumRef,
            {
              promptTokens: increment(prompt),
              completionTokens: increment(completion),
              totalTokens: increment(total),
              lastModel: model || undefined,
              updatedAt: serverTimestamp(),
            },
            { merge: true },
          );

          // Daily aggregates
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const dateKey = today.toISOString().slice(0, 10);
          const dailyRef = doc(collection(db, "usageDaily", dateKey, "users"), u.uid);
          await setDoc(
            dailyRef,
            {
              promptTokens: increment(prompt),
              completionTokens: increment(completion),
              totalTokens: increment(total),
              model: model || undefined,
              updatedAt: serverTimestamp(),
            },
            { merge: true },
          );
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("Failed to log usage to Firestore:", e);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: generateId(), role: "assistant", content: "Sorry, I couldn't process that request.", createdAt: Date.now() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Saved chats helpers
  const loadSavedChats = () => {
    try {
      const raw = localStorage.getItem("savedChats");
      const parsed: SidebarChatSummary[] = raw ? JSON.parse(raw) : [];
      setSavedChats(Array.isArray(parsed) ? parsed : []);
    } catch {
      setSavedChats([]);
    }
  };
  const persistSavedChats = (chats: SidebarChatSummary[]) => {
    setSavedChats(chats);
    localStorage.setItem("savedChats", JSON.stringify(chats));
  };
  useEffect(() => {
    loadSavedChats();
  }, []);

  const handleSaveCurrent = () => {
    const title = messages.find((m) => m.role === "user")?.content?.slice(0, 60) || "Untitled chat";
    const id = currentChatId ?? crypto.randomUUID();
    const createdAt = Date.now();
    const entry: SidebarChatSummary = { id, title, createdAt };
    setCurrentChatId(id);
    persistSavedChats([entry, ...savedChats.filter((c) => c.id !== id)].slice(0, 50));
  };
  const handleSelectChat = async (id: string) => {
    try {
      setCurrentChatId(id);
      const user = auth.currentUser;
      if (user) {
        const ref = doc(collection(db, "userProfiles", user.uid, "chats"), id);
        const snap = await getDoc(ref);
        const data = snap.exists() ? (snap.data() as any) : null;
        const restored: ChatMessage[] = Array.isArray(data?.messages) ? data.messages : [];
        if (restored.length > 0) {
          setMessages(restored);
          return;
        }
      }
      // Fallback (no Firebase or empty): keep messages as-is
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("Failed to load chat:", e);
    }
  };
  const handleDeleteChat = async (id: string) => {
    // Update local list
    persistSavedChats(savedChats.filter((c) => c.id !== id));
    if (currentChatId === id) {
      setCurrentChatId(null);
      setMessages([]);
    }
    // Remove from Firebase
    try {
      const user = auth.currentUser;
      if (user) {
        const ref = doc(collection(db, "userProfiles", user.uid, "chats"), id);
        await deleteDoc(ref);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("Failed to delete chat from Firebase:", e);
    }
  };

  // Auto-save after each completed AI response
  useEffect(() => {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.role !== "assistant") return;
    const firstUser = messages.find((m) => m.role === "user");
    const existing = currentChatId ? savedChats.find((c) => c.id === currentChatId) : undefined;
    const existingTitle = existing?.title;
    const doSave = async () => {
      let title = existingTitle;
      const normalized = (title || "").trim().toLowerCase();
      if (!normalized || normalized === "untitled chat" || normalized.startsWith("untitled")) {
        // Generate a title from OpenAI
        try {
          const res = await fetch("/api/title", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: firstUser?.content || "", reply: last.content || "" }),
          });
          const data = await res.json();
          title = (data?.title || "Untitled chat").slice(0, 64);
        } catch {
          title = (firstUser?.content || "Untitled chat").slice(0, 64);
        }
      }

      const chatId = currentChatId || generateId();
      const existingEntry = savedChats.find((c) => c.id === chatId);
      const entry: SidebarChatSummary = {
        id: chatId,
        title: title!,
        createdAt: existingEntry?.createdAt || Date.now(),
      };
      const next = [entry, ...savedChats.filter((c) => c.id !== chatId)].slice(0, 50);
      persistSavedChats(next);
      if (!currentChatId) setCurrentChatId(chatId);

      // Save to Firebase if authenticated
      try {
        const user = auth.currentUser;
        if (user) {
          const ref = doc(collection(db, "userProfiles", user.uid, "chats"), chatId);
          await setDoc(
            ref,
            {
              title: entry.title,
              updatedAt: serverTimestamp(),
              createdAt: entry.createdAt,
              messages,
            },
            { merge: true },
          );
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("Failed to save chat to Firebase:", e);
      }
    };
    void doSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const handleNewChat = async () => {
    const newId = generateId();
    const createdAt = Date.now();
    setCurrentChatId(newId);
    setMessages([]);

    // Optimistically add to local saved list
    const provisionalTitle = "Untitled chat";
    const next = [{ id: newId, title: provisionalTitle, createdAt }, ...savedChats.filter((c) => c.id !== newId)].slice(0, 50);
    persistSavedChats(next);

    // Create empty chat record in Firebase to avoid overwriting previous session
    try {
      const user = auth.currentUser;
      if (user) {
        const ref = doc(collection(db, "userProfiles", user.uid, "chats"), newId);
        await setDoc(
          ref,
          {
            title: provisionalTitle,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            messages: [],
          },
          { merge: true },
        );
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("Failed to create new chat in Firebase:", e);
    }
  };

  return (
    <AuthGate minRole="viewer" fallback={<div className="p-4 text-default-600">You do not have access to this module.</div>} redirectTo="/">
    <div className="mx-auto w-full max-w-full sm:max-w-[1344px] lg:max-w-[1536px] px-3 sm:px-4 md:px-0 h-[100dvh] overflow-hidden flex flex-row pt-3 sm:pt-4 md:pt-6">
      <Sidebar
        minimized={sidebarMin}
        onToggleMinimize={() => setSidebarMin((v) => !v)}
        chats={savedChats}
        onSelectChat={handleSelectChat}
        onSaveCurrent={handleSaveCurrent}
        onDeleteChat={handleDeleteChat}
        onNewChat={handleNewChat}
      />
      <div className="flex-1 flex flex-col min-w-0 ml-[280px] sm:ml-[280px] relative">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h1 className="text-2xl font-semibold">Chat</h1>      
      </div>
      <Card isFooterBlurred className="relative flex-1 min-h-0 max-h-full overflow-hidden flex flex-col bg-transparent shadow-none border-1 border-default-300 self-start w-3/4">
        <CardBody className="p-0 h-full bg-transparent">
          <ScrollShadow hideScrollBar className="h-full p-3 sm:p-4 space-y-3 sm:space-y-4 pb-24" ref={listRef as any}>
            {messages.length === 0 ? (
              <div className="text-default-500 text-sm bg-transparent">
                Start a conversation below. Press <Kbd keys={["command"]}>Enter</Kbd> or <Kbd keys={["ctrl"]}>Enter</Kbd> to send.
              </div>
            ) : (
              <Listbox
                aria-label="Chat messages"
                className="gap-2 bg-transparent"
                selectionMode="none"
                itemClasses={{
                  base:
                    "transition-none data-[hover=true]:bg-transparent data-[pressed=true]:bg-transparent data-[focus=true]:bg-transparent",
                }}
              >
                 {messages.map((m) => (
                  <ListboxItem key={m.id} textValue={m.content} className="py-2 sm:py-3">
                    <div className={clsx("flex items-start gap-2", m.role === "user" ? "flex-row-reverse" : "")}>
                      <div className="shrink-0 flex flex-col items-center gap-1">
                        <Avatar
                          className="shrink-0"
                          name={m.role === "user" ? "You" : "AI"}
                          size="sm"
                          color={m.role === "user" ? "secondary" : "primary"}
                        />
                        {m.role === "user" && (
                          <Tooltip content={copiedId === m.id ? "Copied!" : "Copy"} placement="right" size="sm" color="foreground">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              className="mt-1"
                              onPress={() => copyMessageAsHtml(m.id, m.content)}
                            >
                              {copiedId === m.id ? (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.75h-6A2.25 2.25 0 008.25 6v9A2.25 2.25 0 0010.5 17.25h6A2.25 2.25 0 0018.75 15V6A2.25 2.25 0 0016.5 3.75z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 7.5H5.25A2.25 2.25 0 003 9.75v8.25A2.25 2.25 0 005.25 20.25H13.5A2.25 2.25 0 0015.75 18V17.25" />
                                </svg>
                              )}
                            </Button>
                          </Tooltip>
                        )}
                        {m.role === "assistant" && (
                          <Tooltip content={copiedId === m.id ? "Copied!" : "Copy"} placement="left" size="sm" color="foreground">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              className="mt-1"
                              onPress={() => copyMessageAsHtml(m.id, m.content)}
                            >
                              {copiedId === m.id ? (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.75h-6A2.25 2.25 0 008.25 6v9A2.25 2.25 0 0010.5 17.25h6A2.25 2.25 0 0018.75 15V6A2.25 2.25 0 0016.5 3.75z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 7.5H5.25A2.25 2.25 0 003 9.75v8.25A2.25 2.25 0 005.25 20.25H13.5A2.25 2.25 0 0015.75 18V17.25" />
                                </svg>
                              )}
                            </Button>
                          </Tooltip>
                        )}
                      </div>
                      <div className={clsx("relative group", m.role === "user" ? "items-end" : "items-start flex-1") }>
                        <div
                          className={clsx(
                            "rounded-large px-3 py-2 border",
                            m.role === "user"
                              ? "inline-block max-w-[90%] sm:max-w-[85%] bg-secondary/90 text-secondary-foreground border-secondary/40"
                              : "w-full bg-content1 text-foreground border-default-200",
                          )}
                        >
                          <div id={`msg-${m.id}`}>
                            {renderMessageContent(m.content, (m as any).annotations)}
                          </div>
                          <div className="mt-2 text-[10px] text-default-500">
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </ListboxItem>
                ))}
              </Listbox>
            )}
          </ScrollShadow>
        </CardBody>
        {isLoading && (
          <div className="absolute left-3 right-3 bottom-20 pointer-events-none">
            <div
              className="inline-block w-full rounded-medium border border-default-200 bg-content1/80 backdrop-blur-sm px-3 py-2 text-sm text-default-700 shadow-sm text-center"
              style={{ animation: "fadeInOutSlow 11s ease-in-out infinite" }}
            >
              {waitingTexts[waitingIndex] || "Working on it..."}
            </div>
          </div>
        )}
        <CardFooter
          className="absolute bottom-1 z-10 ml-1 w-[calc(100%_-_8px)] justify-between gap-2 overflow-hidden rounded-large border-1 border-white/20 px-3 sm:px-4 py-2 sm:py-3"
        >
          <Input
            value={input}
            onValueChange={setInput}
            onKeyDown={onKeyDown}
            placeholder="Type your message..."
            classNames={{ inputWrapper: "bg-default-100", input: "text-sm" }}
          />
          <Button color="secondary" radius="sm" isLoading={isLoading} onPress={sendMessage}>
            Send
          </Button>
        </CardFooter>
        {/* Scoped styles for slow fade animation */}
        <style>{`
          @keyframes fadeInOutSlow {
            0% { opacity: 0; }
            10% { opacity: 0.35; }
            20% { opacity: 1; }
            80% { opacity: 1; }
            90% { opacity: 0.35; }
            100% { opacity: 0; }
          }
        `}</style>
      </Card>
      {isAdmin && (
        <div className="hidden lg:flex flex-col w-[480px] max-w-[640px] border-1 border-default-300 rounded-medium p-3 bg-content1/50 fixed right-3 top-24 z-30">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold">Admin Notes</div>
            <div className="flex items-center gap-2">
              <button
                className={clsx(
                  "px-2 py-1 text-xs rounded-small border",
                  editorMode === "rich" ? "bg-default-200" : "bg-transparent",
                )}
                onClick={() => setEditorMode("rich")}
              >
                Rich
              </button>
              <button
                className={clsx(
                  "px-2 py-1 text-xs rounded-small border",
                  editorMode === "md" ? "bg-default-200" : "bg-transparent",
                )}
                onClick={() => setEditorMode("md")}
              >
                Markdown
              </button>
            </div>
          </div>

          <label className="text-xs text-default-500 mb-1">Filename (optional)</label>
          <input
            className="mb-2 px-2 py-1 text-sm rounded-small border border-default-300 bg-transparent"
            value={noteFilename}
            onChange={(e) => setNoteFilename(e.target.value)}
            placeholder="note-title"
          />

          {editorMode === "rich" ? (
            <div
              ref={richRef}
              contentEditable
              suppressContentEditableWarning
              className="flex-1 min-h-[300px] overflow-auto rounded-small border border-default-300 p-2 text-sm bg-background"
              style={{ outline: "none" }}
            />
          ) : (
            <textarea
              className="flex-1 min-h-[300px] overflow-auto rounded-small border border-default-300 p-2 text-sm bg-background"
              value={markdownText}
              onChange={(e) => setMarkdownText(e.target.value)}
              placeholder="# Notes\nWrite markdown here..."
            />
          )}

          <div className="flex items-center gap-2 mt-3">
            <button
              className="px-3 py-1.5 text-sm rounded-small border border-default-300 bg-default-100"
              onClick={async () => {
                try {
                  setSaveMessage("");
                  const content = (richRef.current?.innerHTML || "").trim();
                  if (!content) {
                    setSaveMessage("Nothing to save (HTML)");
                    return;
                  }
                  const res = await fetch("/api/assistant/upload", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ content, format: "html", filename: noteFilename || undefined }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data?.error || "Upload failed");
                  setSaveMessage(`Saved HTML: ${data.filename}`);
                } catch (e: any) {
                  setSaveMessage(e?.message || "Save failed");
                }
              }}
            >
              Save HTML
            </button>
            <button
              className="px-3 py-1.5 text-sm rounded-small border border-default-300 bg-default-100"
              onClick={async () => {
                try {
                  setSaveMessage("");
                  const content = markdownText.trim();
                  if (!content) {
                    setSaveMessage("Nothing to save (Markdown)");
                    return;
                  }
                  const res = await fetch("/api/assistant/upload", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ content, format: "md", filename: noteFilename || undefined }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data?.error || "Upload failed");
                  setSaveMessage(`Saved Markdown: ${data.filename}`);
                } catch (e: any) {
                  setSaveMessage(e?.message || "Save failed");
                }
              }}
            >
              Save Markdown
            </button>
          </div>
          {saveMessage && (
            <div className="mt-2 text-xs text-default-600">{saveMessage}</div>
          )}
        </div>
      )}
      </div>
    </div>
    </AuthGate>
  );
}


