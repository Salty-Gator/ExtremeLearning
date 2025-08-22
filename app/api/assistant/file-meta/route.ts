import { NextResponse } from "next/server";

function getOpenAIKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Missing OPENAI_API_KEY");
  return key;
}

export async function GET(request: Request) {
  try {
    const apiKey = getOpenAIKey();
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const res = await fetch(`https://api.openai.com/v1/files/${id}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text || "OpenAI error" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json({ id: data?.id, filename: data?.filename, created_at: data?.created_at, bytes: data?.bytes });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}


