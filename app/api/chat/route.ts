import { NextResponse } from "next/server";
import { createAssistantResponse, createChatCompletion, refineAssistantOutputWithChatCompletion } from "@/lib/server/openai";

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const streamRequested = url.searchParams.get("stream") === "1";
    const body = await request.json().catch(() => ({}));
    const messages = Array.isArray(body?.messages) ? body.messages : [];

    const assistantId = process.env.REACT_APP_OPENAI_ASSISTANT_ID || process.env.OPENAI_ASSISTANT_ID;

    // Stream only for Chat Completions (assistants streaming is more complex)
    if (streamRequested && !assistantId) {
      const apiKey = process.env.REACT_APP_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
      const model = process.env.REACT_APP_OPENAI_MODEL || process.env.OPENAI_MODEL || "gpt-5";
      if (!apiKey) {
        return NextResponse.json({ error: "Missing OpenAI API key" }, { status: 500 });
      }

      const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model, messages, temperature: 0.7, stream: true }),
      });

      if (!upstream.ok || !upstream.body) {
        const text = await upstream.text();
        return NextResponse.json({ error: `OpenAI stream init failed: ${text}` }, { status: upstream.status });
      }

      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          const reader = upstream.body!.getReader();
          const read = async () => {
            try {
              const { value, done } = await reader.read();
              if (done) {
                controller.close();
                return;
              }
              const chunk = decoder.decode(value, { stream: true });
              // Parse OpenAI SSE lines and extract delta content
              for (const line of chunk.split(/\n/)) {
                const trimmed = line.trim();
                if (!trimmed.startsWith("data:")) continue;
                const data = trimmed.slice(5).trim();
                if (data === "[DONE]") continue;
                try {
                  const json = JSON.parse(data);
                  const token = json?.choices?.[0]?.delta?.content ?? "";
                  if (token) controller.enqueue(encoder.encode(token));
                } catch {}
              }
              read();
            } catch (e) {
              controller.error(e);
            }
          };
          read();
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
        },
      });
    }

    // Non-streaming path (Assistants or standard chat)
    if (assistantId) {
      const payload = await createAssistantResponse(messages, assistantId);
      const cleanedAssistant = payload.content.replace(/\u3010\d+:\d+†source\u3011/g, "");

      // Second pass refinement: feed user's latest request and assistant output to Chat Completions
      const latestUserContent = [...messages]
        .reverse()
        .find((m) => m.role === "user")?.content || "";
      const refined = await refineAssistantOutputWithChatCompletion(
        latestUserContent,
        cleanedAssistant,
      );
      const cleanedRefined = refined.replace(/\u3010\d+:\d+†source\u3011/g, "");
      return NextResponse.json({ content: cleanedRefined, annotations: payload.annotations });
    } else {
      const content = await createChatCompletion(messages);
      const cleaned = content.replace(/\u3010\d+:\d+†source\u3011/g, "");
      return NextResponse.json({ content: cleaned });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    /* eslint-disable no-console */
    console.error("/api/chat error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


