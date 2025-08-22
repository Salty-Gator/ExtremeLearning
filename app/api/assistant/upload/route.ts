import { NextResponse } from "next/server";

function getOpenAIKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Missing OpenAI API key");
  return key;
}

export async function POST(request: Request) {
  try {
    const apiKey = getOpenAIKey();
    const betaHeaders: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      "OpenAI-Beta": "assistants=v2",
    };

    const body = await request.json().catch(() => ({}));
    const rawContent: string = String(body?.content || "");
    const format: "html" | "md" = body?.format === "html" ? "html" : "md";
    const filenameInput: string | undefined = body?.filename ? String(body.filename) : undefined;
    const vectorStoreId: string | undefined = body?.vectorStoreId || process.env.OPENAI_VECTOR_STORE_ID || undefined;

    if (!rawContent) {
      return NextResponse.json({ error: "Missing content" }, { status: 400 });
    }

    const ext = format === "html" ? ".html" : ".md";
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const defaultName = `note-${timestamp}${ext}`;
    const filename = (filenameInput || defaultName).endsWith(ext)
      ? (filenameInput || defaultName)
      : `${filenameInput || defaultName}${ext}`;

    // 1) Upload file to OpenAI Files API (purpose: assistants)
    const form = new FormData();
    const blob = new Blob([rawContent], { type: format === "html" ? "text/html" : "text/markdown" });
    form.append("file", blob, filename);
    form.append("purpose", "assistants");

    const uploadRes = await fetch("https://api.openai.com/v1/files", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
    if (!uploadRes.ok) {
      const text = await uploadRes.text();
      return NextResponse.json({ error: `OpenAI file upload failed: ${text}` }, { status: uploadRes.status });
    }
    const uploadData: any = await uploadRes.json();
    const fileId: string | undefined = uploadData?.id;
    if (!fileId) {
      return NextResponse.json({ error: "OpenAI file upload returned no id" }, { status: 502 });
    }

    let vectorStoreFileId: string | undefined;
    if (vectorStoreId) {
      // 2) Attach the file to a Vector Store
      const attachRes = await fetch(`https://api.openai.com/v1/vector_stores/${vectorStoreId}/files`, {
        method: "POST",
        headers: { ...betaHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ file_id: fileId }),
      });
      if (!attachRes.ok) {
        const text = await attachRes.text();
        return NextResponse.json(
          { error: `Attach to vector store failed: ${text}`, file_id: fileId },
          { status: attachRes.status },
        );
      }
      const attachData: any = await attachRes.json();
      vectorStoreFileId = attachData?.id || attachData?.file_id || undefined;
    }

    return NextResponse.json({ ok: true, file_id: fileId, vector_store_id: vectorStoreId || null, vector_store_file_id: vectorStoreFileId || null, filename, format });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}


