import { NextResponse } from "next/server";
import { createAssistantResponse, createChatCompletion, refineAssistantOutputWithChatCompletion } from "@/lib/server/openai";
import { rewriteMessagesWithRules } from "@/lib/server/rules";

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const streamRequested = url.searchParams.get("stream") === "1";
    const body = await request.json().catch(() => ({}));
    const messages = Array.isArray(body?.messages) ? body.messages : [];

    const assistantId = process.env.OPENAI_ASSISTANT_ID;

    // Stream only for Chat Completions (assistants streaming is more complex)
    if (streamRequested && !assistantId) {
      const apiKey = process.env.OPENAI_API_KEY;
      const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
      if (!apiKey) {
        return NextResponse.json({ error: "Missing OpenAI API key" }, { status: 500 });
      }

      const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model, messages, stream: true }),
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
    const userId = (request.headers.get("x-user-id") || "").trim() || undefined;

    if (assistantId) {
      const { messages: steeredMessages } = rewriteMessagesWithRules(messages);
      const payload = await createAssistantResponse(steeredMessages, assistantId);
      const cleanedAssistant = payload.content.replace(/\u3010\d+:\d+†source\u3011/g, "");

      // Second pass refinement: feed user's latest request and assistant output to Chat Completions
      const latestUserContent = [...steeredMessages]
        .reverse()
        .find((m) => m.role === "user")?.content || "";
      const refined = await refineAssistantOutputWithChatCompletion(
        latestUserContent,
        cleanedAssistant,
      );
      const cleanedRefined = refined.content.replace(/\u3010\d+:\d+†source\u3011/g, "");
      // Return refined content plus usage/model from the refinement Chat Completion so client can log usage
      return NextResponse.json({ content: cleanedRefined, annotations: payload.annotations, usage: refined.usage, model: refined.model });
    } else {
      const result = await createChatCompletion(messages);
      const cleaned = result.content.replace(/\u3010\d+:\d+†source\u3011/g, "");
      // Return usage and model so the client can log aggregates to Firestore
      return NextResponse.json({ content: cleaned, usage: result.usage, model: result.model });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    /* eslint-disable no-console */
    console.error("/api/chat error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


