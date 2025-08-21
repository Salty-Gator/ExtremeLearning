import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const userPrompt: string = body?.prompt || "";
    const assistantReply: string = body?.reply || "";

    const apiKey = process.env.OPENAI_API_KEY || process.env.REACT_APP_OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || process.env.REACT_APP_OPENAI_MODEL || "gpt-5";
    if (!apiKey) {
      return NextResponse.json({ title: userPrompt.slice(0, 48) || "Untitled" });
    }

    const system =
      "You generate short, descriptive chat titles (max 8 words). Avoid punctuation except dashes.";
    const user = `User prompt: ${userPrompt}\nAssistant reply: ${assistantReply}\n\nReturn only the title.`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.2,
        max_tokens: 20,
      }),
    });
    const data = await res.json();
    const title = data?.choices?.[0]?.message?.content?.trim() || userPrompt.slice(0, 48) || "Untitled";
    return NextResponse.json({ title });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


