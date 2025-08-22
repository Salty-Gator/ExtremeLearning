import { NextResponse } from "next/server";

function getOpenAIKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Missing OPENAI_API_KEY");
  return key;
}

export async function GET(request: Request) {
  try {
    const apiKey = getOpenAIKey();
    const vectorStoreId = process.env.OPENAI_VECTOR_STORE_ID;
    if (!vectorStoreId) {
      return NextResponse.json({ files: [], warning: "OPENAI_VECTOR_STORE_ID not set" });
    }

    const url = new URL(request.url);
    const vfId = url.searchParams.get("vf");
    if (vfId) {
      // Fetch a single vector store file (expanded with file)
      const qsOne = new URLSearchParams();
      qsOne.append("include[]", "file");
      const oneRes = await fetch(`https://api.openai.com/v1/vector_stores/${vectorStoreId}/files/${vfId}?${qsOne.toString()}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "OpenAI-Beta": "assistants=v2",
        },
      });
      if (!oneRes.ok) {
        const text = await oneRes.text();
        return NextResponse.json({ error: `Fetch vector file failed: ${text}` }, { status: oneRes.status });
      }
      const vf = await oneRes.json();
      let fileMeta: any | null = null;
      const looksLikeFileId = typeof vf?.id === "string" && /^file[_-]/.test(vf.id);
      const srcId = vf?.file_id || vf?.file?.id || (looksLikeFileId ? vf?.id : undefined);
      if (srcId) {
        try {
          const fm = await fetch(`https://api.openai.com/v1/files/${srcId}`, {
            headers: { Authorization: `Bearer ${apiKey}` },
          });
          if (fm.ok) fileMeta = await fm.json();
        } catch {}
      }
      return NextResponse.json({
        vector_file: {
          id: vf?.id,
          file_id: srcId,
          filename: fileMeta?.filename || vf?.file?.filename,
          status: vf?.status,
          created_at: fileMeta?.created_at || vf?.created_at,
        },
      });
    }

    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 25), 1), 200);
    const after = url.searchParams.get("after");

    const qs = new URLSearchParams();
    qs.set("limit", String(limit));
    if (after) qs.set("after", after);

    // Ask API to include expanded file objects when available
    qs.append("include[]", "file");
    const res = await fetch(`https://api.openai.com/v1/vector_stores/${vectorStoreId}/files?${qs.toString()}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "OpenAI-Beta": "assistants=v2",
      },
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `List files failed: ${text}` }, { status: res.status });
    }
    const data: any = await res.json();
    const rawFiles: any[] = Array.isArray(data?.data) ? data.data : [];

    // Enrich with filename by fetching file metadata for each file_id
    const files = await Promise.all(
      rawFiles.map(async (vf) => {
        // Prefer file id from expanded file, else vector store record
        const looksLikeFileId = typeof vf?.id === "string" && /^file[_-]/.test(vf.id);
        const fileId = vf?.file?.id || vf?.file_id || (looksLikeFileId ? vf?.id : undefined);
        let filename: string | undefined = vf?.file?.filename || vf?.filename;
        let created_at: number | undefined = vf?.file?.created_at || vf?.created_at;
        if (fileId) {
          try {
            const fileRes = await fetch(`https://api.openai.com/v1/files/${fileId}`, {
              headers: { Authorization: `Bearer ${apiKey}` },
            });
            if (fileRes.ok) {
              const meta: any = await fileRes.json();
              filename = meta?.filename || filename;
              created_at = meta?.created_at || created_at;
            }
          } catch {}
        }
        return {
          id: vf?.id,
          file_id: fileId,
          filename,
          status: vf?.status,
          created_at,
        };
      })
    );

    return NextResponse.json({ files, has_more: !!data?.has_more, last_id: rawFiles.length ? rawFiles[rawFiles.length - 1]?.id : null });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const apiKey = getOpenAIKey();
    const vectorStoreId = process.env.OPENAI_VECTOR_STORE_ID;
    if (!vectorStoreId) {
      return NextResponse.json({ error: "OPENAI_VECTOR_STORE_ID not set" }, { status: 400 });
    }

    const { vector_file_id, file_id, delete_file } = await request.json().catch(() => ({}));
    if (!vector_file_id) {
      return NextResponse.json({ error: "Missing vector_file_id" }, { status: 400 });
    }

    // Remove file from vector store
    const removeRes = await fetch(`https://api.openai.com/v1/vector_stores/${vectorStoreId}/files/${vector_file_id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "OpenAI-Beta": "assistants=v2",
      },
    });
    if (!removeRes.ok) {
      const text = await removeRes.text();
      return NextResponse.json({ error: `Vector store delete failed: ${text}` }, { status: removeRes.status });
    }

    let fileDeleted: boolean | null = null;
    if (delete_file && file_id) {
      const fileDelRes = await fetch(`https://api.openai.com/v1/files/${file_id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      fileDeleted = fileDelRes.ok;
    }

    return NextResponse.json({ ok: true, file_deleted: fileDeleted });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}


