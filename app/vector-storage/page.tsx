"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AuthGate from "@/lib/authz/AuthGate";
import { useAuthz } from "@/lib/authz/context";
import { Card, CardBody, ScrollShadow } from "@heroui/react";
import { Button } from "@heroui/button";
import { getFirebaseDb } from "@/lib/firebase/client";
import { collection, getDocs, doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";

type VectorFile = {
  id: string;
  filename?: string;
  status?: string;
  created_at?: number;
  file_id?: string;
};

export default function VectorStoragePage() {
  const { isAdmin } = useAuthz();
  const db = useMemo(() => getFirebaseDb(), []);
  const [files, setFiles] = useState<VectorFile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Editor state (reuse from chat page style)
  const [editorMode, setEditorMode] = useState<"rich" | "md">("rich");
  const richRef = useRef<HTMLDivElement | null>(null);
  const [markdownText, setMarkdownText] = useState<string>("");
  const [noteFilename, setNoteFilename] = useState<string>("");
  const [saveMessage, setSaveMessage] = useState<string>("");

  const [limit, setLimit] = useState<number>(25);
  const [after, setAfter] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);

  const loadCachedFiles = async () => {
    try {
      const snap = await getDocs(collection(db, "vectorStoreFiles"));
      const cached: VectorFile[] = snap.docs.map((d) => {
        const v = d.data() as any;
        return {
          id: v?.vectorFileId || d.id,
          file_id: v?.fileId || undefined,
          filename: v?.filename || undefined,
          status: v?.status || undefined,
          created_at: typeof v?.createdAt === "number" ? v.createdAt : undefined,
        };
      });
      if (cached.length) setFiles((cur) => (cur.length ? cur : cached));
    } catch {}
  };

  const cacheFilesToFirebase = async (list: VectorFile[]) => {
    try {
      await Promise.all(
        list.map((f) =>
          setDoc(
            doc(db, "vectorStoreFiles", f.id),
            {
              vectorFileId: f.id,
              fileId: f.file_id || null,
              filename: f.filename || null,
              status: f.status || null,
              createdAt: f.created_at || null,
              updatedAt: serverTimestamp(),
            },
            { merge: true },
          ),
        ),
      );
    } catch {}
  };

  const fetchFiles = async (opts?: { reset?: boolean; after?: string | null; limit?: number }) => {
    try {
      setError(null);
      setLoading(true);
      const effLimit = Math.max(1, Math.min(200, opts?.limit ?? limit));
      const effAfter = opts?.reset ? null : (opts?.after ?? after);
      const qs = new URLSearchParams();
      qs.set("limit", String(effLimit));
      if (effAfter) qs.set("after", effAfter);
      const res = await fetch(`/api/assistant/vector-files?${qs.toString()}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load files");
      const next: VectorFile[] = Array.isArray(data?.files) ? data.files : [];
      setFiles(next);
      cacheFilesToFirebase(next);

      // Opportunistically resolve any missing file_id/filename using vector file detail
      const unresolved = next.filter((f) => !f.file_id);
      if (unresolved.length) {
        try {
          const resolved = await Promise.allSettled(
            unresolved.slice(0, 10).map(async (f) => {
              const vfRes = await fetch(`/api/assistant/vector-files?vf=${encodeURIComponent(f.id)}`);
              const vfData = await vfRes.json();
              if (vfRes.ok && vfData?.vector_file?.file_id) {
                const merged: VectorFile = {
                  ...f,
                  file_id: vfData.vector_file.file_id,
                  filename: vfData.vector_file.filename || f.filename,
                  created_at: vfData.vector_file.created_at || f.created_at,
                };
                return merged;
              }
              return f;
            }),
          );
          const overlay = new Map<string, VectorFile>();
          for (const r of resolved) {
            if (r.status === "fulfilled") overlay.set(r.value.id, r.value);
          }
          if (overlay.size) {
            const merged = next.map((f) => overlay.get(f.id) || f);
            setFiles(merged);
            cacheFilesToFirebase(Array.from(overlay.values()));
          }
        } catch {}
      }
      setHasMore(Boolean(data?.has_more));
      setAfter(data?.last_id || null);
    } catch (e: any) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCachedFiles();
    fetchFiles();
  }, []);

  const rows = useMemo(() => {
    return files
      .slice()
      .sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
  }, [files]);

  return (
    <AuthGate minRole="admin" redirectTo="/">
      <div className={`mx-auto w-full max-w-full sm:max-w-[1536px] lg:max-w-[1800px] xl:max-w-[2000px] 2xl:max-w-[2200px] px-3 sm:px-4 md:px-0 h-[100dvh] overflow-hidden flex flex-col pt-3 sm:pt-4 md:pt-6 relative ${isAdmin ? "lg:pr-[760px]" : ""}`}>
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h1 className="text-2xl font-semibold">Vector Storage</h1>
          <div className="flex items-center gap-2">
            <select
              className="border border-default-300 rounded-small px-2 py-1 text-sm bg-transparent"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <Button size="sm" variant="flat" onPress={() => fetchFiles({ reset: true })} isLoading={loading}>Refresh</Button>
          </div>
        </div>

        <Card className="relative flex-1 min-h-0 max-h-full overflow-hidden flex flex-col bg-transparent shadow-none border-1 border-default-300 self-start w-full">
          <CardBody className="p-0 h-full bg-transparent">
            {error && (
              <div className="p-3 text-sm text-danger">{error}</div>
            )}
            <ScrollShadow hideScrollBar className="h-full p-3 sm:p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-default-200">
                    <th className="py-2 pr-3">Filename</th>
                    <th className="py-2 pr-3">Source File ID</th>
                    <th className="py-2 pr-3">Created</th>
                    <th className="py-2 pr-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((f) => (
                    <tr key={f.id} className="border-b border-default-100">
                      <td className="py-2 pr-3">{f.filename || "(unknown)"}</td>
                      <td className="py-2 pr-3 font-mono text-xs">{f.file_id || "-"}</td>
                      <td className="py-2 pr-3">{f.created_at ? new Date(f.created_at * 1000).toLocaleString() : "-"}</td>
                      <td className="py-2 pr-3">
                        <Button size="sm" color="danger" variant="light" onPress={async () => {
                          const alsoDelete = window.confirm("Delete underlying file too? Click OK to delete both; Cancel for vector-only.");
                          try {
                            const res = await fetch('/api/assistant/vector-files', {
                              method: 'DELETE',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ vector_file_id: f.id, file_id: f.file_id || undefined, delete_file: alsoDelete })
                            });
                            const data = await res.json();
                            if (!res.ok) throw new Error(data?.error || 'Delete failed');
                            await fetchFiles({ reset: true, limit });
                            try { await deleteDoc(doc(db, "vectorStoreFiles", f.id)); } catch {}
                          } catch (e: any) {
                            alert(e?.message || 'Delete failed');
                          }
                        }}>Delete</Button>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && !loading && (
                    <tr>
                      <td colSpan={4} className="py-6 text-default-500">No files found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="flex items-center justify-between mt-3">
                <div className="text-xs text-default-500">Limit: {limit}</div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="flat" isDisabled={!after} onPress={() => fetchFiles({ reset: true, limit })}>First</Button>
                  <Button size="sm" variant="flat" isDisabled={!hasMore} onPress={() => fetchFiles({ limit, after })}>Next</Button>
                </div>
              </div>
            </ScrollShadow>
          </CardBody>
        </Card>

        {isAdmin && (
          <div className="hidden lg:flex flex-col w-[720px] max-w-[860px] border-1 border-default-300 rounded-medium p-3 bg-content1/50 fixed right-3 top-24 z-10">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold">Add Information to Vector Storage</div>
              <div className="flex items-center gap-2">
                <button
                  className={`px-2 py-1 text-xs rounded-small border ${editorMode === "rich" ? "bg-default-200" : "bg-transparent"}`}
                  onClick={() => setEditorMode("rich")}
                >
                  Rich
                </button>
                <button
                  className={`px-2 py-1 text-xs rounded-small border ${editorMode === "md" ? "bg-default-200" : "bg-transparent"}`}
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
    </AuthGate>
  );
}


