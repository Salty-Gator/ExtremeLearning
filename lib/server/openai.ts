export type OpenAIChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ChatCompletionOptions = {
  model?: string;
  temperature?: number;
};

export type ChatCompletionUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
};

export type ChatCompletionResult = {
  content: string;
  usage?: ChatCompletionUsage;
  model?: string;
};

function getOpenAIKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error(
      "Missing OpenAI API key. Set OPENAI_API_KEY in your server environment.",
    );
  }
  return key;
}

function getAssistantId(): string | undefined {
  return process.env.OPENAI_ASSISTANT_ID;
}

function getOpenAITemperature(): number | undefined {
  const raw = process.env.OPENAI_TEMPERATURE;
  if (raw === undefined) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

export async function createChatCompletion(
  messages: OpenAIChatMessage[],
  { model, temperature }: ChatCompletionOptions = {},
): Promise<ChatCompletionResult> {
  const apiKey = getOpenAIKey();
  const effectiveModel =
    model || process.env.OPENAI_MODEL || "gpt-4o-mini";
  const envTemperature = getOpenAITemperature();
  const effectiveTemperature =
    typeof temperature === "number" ? temperature : envTemperature;

  const requestBody: any = { model: effectiveModel, messages };
  if (
    typeof effectiveTemperature === "number" &&
    !Number.isNaN(effectiveTemperature) &&
    effectiveTemperature !== 1
  ) {
    requestBody.temperature = effectiveTemperature;
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${errorText}`);
  }

  const data = await response.json();
  const content: string = data?.choices?.[0]?.message?.content ?? "";
  const usage: ChatCompletionUsage | undefined = data?.usage;
  const usedModel: string | undefined = data?.model;
  return { content, usage, model: usedModel };
}

export type AssistantAnnotation = {
  type: string;
  url?: string;
  title?: string;
  file_id?: string;
  start_index?: number;
  end_index?: number;
};

export type AssistantResponsePayload = {
  content: string;
  annotations: AssistantAnnotation[];
};

export async function createAssistantResponse(
  messages: OpenAIChatMessage[],
  assistantId?: string,
  options?: { pollIntervalMs?: number; timeoutMs?: number },
): Promise<AssistantResponsePayload> {
  const apiKey = getOpenAIKey();
  const resolvedAssistantId = assistantId || getAssistantId();
  if (!resolvedAssistantId) {
    throw new Error(
      "Missing Assistant ID. Set REACT_APP_OPENAI_ASSISTANT_ID or OPENAI_ASSISTANT_ID.",
    );
  }

  const betaHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    "OpenAI-Beta": "assistants=v2",
  } as const;

  // 1) Create an empty thread (Assistants v2 flow)
  const createThreadRes = await fetch("https://api.openai.com/v1/threads", {
    method: "POST",
    headers: betaHeaders,
    body: JSON.stringify({}),
  });
  if (!createThreadRes.ok) {
    throw new Error(`Assistants API error (create thread): ${await createThreadRes.text()}`);
  }
  const thread = await createThreadRes.json();
  const threadId: string | undefined = thread?.id;
  if (!threadId) throw new Error("Assistants API: no thread id returned");

  // Split out system messages (assistants v2 does not accept role: system)
  const systemInstructions = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");
  const threadMessages = messages.filter((m) => m.role === "user" || m.role === "assistant");

  // 2) Add messages to the thread (only user/assistant)
  for (const m of threadMessages) {
    const addMsgRes = await fetch(
      `https://api.openai.com/v1/threads/${threadId}/messages`,
      {
        method: "POST",
        headers: betaHeaders,
        body: JSON.stringify({
          role: m.role,
          content: [{ type: "text", text: m.content }],
        }),
      },
    );
    if (!addMsgRes.ok) {
      throw new Error(`Assistants API error (add message): ${await addMsgRes.text()}`);
    }
  }

  // 3) Create a run for that thread
  const createRunRes = await fetch(
    `https://api.openai.com/v1/threads/${threadId}/runs`,
    {
      method: "POST",
      headers: betaHeaders,
      body: JSON.stringify({
        assistant_id: resolvedAssistantId,
        ...(systemInstructions ? { instructions: systemInstructions } : {}),
        // Attach vector store(s) if configured so file_search can ground answers
        ...(process.env.OPENAI_VECTOR_STORE_ID
          ? {
              tool_resources: {
                file_search: {
                  vector_store_ids: [process.env.OPENAI_VECTOR_STORE_ID],
                },
              },
            }
          : {}),
      }),
    },
  );
  if (!createRunRes.ok) {
    throw new Error(`Assistants API error (create run): ${await createRunRes.text()}`);
  }
  const run = await createRunRes.json();
  const runId: string | undefined = run?.id;
  if (!runId) throw new Error("Assistants API: no run id returned");

  // 4) Poll until run completes
  const pollIntervalMs = options?.pollIntervalMs ?? 800;
  const timeoutMs = options?.timeoutMs ?? 30_000;
  const start = Date.now();
  while (true) {
    const getRunRes = await fetch(
      `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`,
      {
        headers: betaHeaders,
      },
    );
    if (!getRunRes.ok) {
      throw new Error(`Assistants API error (get run): ${await getRunRes.text()}`);
    }
    const runStatus = await getRunRes.json();
    const status = runStatus?.status as string | undefined;
    if (status === "completed") break;
    if (status === "failed" || status === "expired" || status === "cancelled") {
      throw new Error(`Assistants API run ended with status: ${status}`);
    }
    if (Date.now() - start > timeoutMs) {
      throw new Error("Assistants API run timed out");
    }
    await new Promise((r) => setTimeout(r, pollIntervalMs));
  }

  // 5) Retrieve messages and return the latest assistant message text
  const listMessagesRes = await fetch(
    `https://api.openai.com/v1/threads/${threadId}/messages?limit=50`,
    { headers: betaHeaders },
  );
  if (!listMessagesRes.ok) {
    throw new Error(`Assistants API error (list messages): ${await listMessagesRes.text()}`);
  }
  const listData = await listMessagesRes.json();
  const items: any[] = listData?.data ?? [];
  const assistantMessage = items.find((m) => m?.role === "assistant");
  if (!assistantMessage) return { content: "", annotations: [] };
  // Aggregate text content parts and collect annotations (url/file citations)
  const contents: string[] = [];
  const allAnnotations: AssistantAnnotation[] = [];
  for (const c of assistantMessage?.content ?? []) {
    if (c?.type === "text") {
      const textValue = c?.text?.value ?? "";
      contents.push(textValue);
      const anns: any[] = Array.isArray(c?.text?.annotations) ? c.text.annotations : [];
      for (const a of anns) {
        if (!a) continue;
        // Normalize shapes across possible variants
        const normalized: AssistantAnnotation = {
          type: a.type || "unknown",
          start_index: a.start_index,
          end_index: a.end_index,
        };
        if (a.type === "url_citation") {
          normalized.url = a.url || a?.url_citation?.url;
          normalized.title = a.title || a?.url_citation?.title;
        } else if (a.type === "file_citation") {
          normalized.file_id = a?.file_citation?.file_id || a.file_id;
          normalized.title = a.title || a?.file_citation?.title;
        }
        allAnnotations.push(normalized);
      }
    }
  }
  return { content: contents.join("\n\n"), annotations: allAnnotations };
}


/**
 * Performs a second-pass review using Chat Completions by providing the user's request
 * alongside the initial Assistants API output. The system instruction biases the model
 * toward network infrastructure engineering/architecture review and detailed configs.
 */
export async function refineAssistantOutputWithChatCompletion(
  userRequest: string,
  assistantOutput: string,
): Promise<ChatCompletionResult> {
  const systemInstruction =
    "In the best of your ability as Network Infrastructure Engineer and Network Infrastructure Architecture, please review the user's request plus this already provided assistant response information and formulate your facts. If your facts include detailed configuration steps please make sure to provide those details along with an explanation of that configuration.";

  const reviewPrompt = `User request:\n${userRequest}\n\nAssistant response to review:\n${assistantOutput}`;

  const messages: OpenAIChatMessage[] = [
    { role: "system", content: systemInstruction },
    { role: "user", content: reviewPrompt },
  ];

  // Use global/default temperature controls; do not force a non-1 value
  return createChatCompletion(messages);
}

