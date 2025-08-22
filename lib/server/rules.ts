import fs from "fs";
import path from "path";
import type { OpenAIChatMessage } from "./openai";

type Rules = Record<string, any>;

let cachedRules: Rules | null = null;
let cachedMtimeMs: number | null = null;

function getRulesPath(): string {
  // Next.js server cwd is project root (extreme-networks-app)
  return path.join(process.cwd(), "extreme_rules.json");
}

export function getRules(): Rules {
  try {
    const rulesPath = getRulesPath();
    const stat = fs.existsSync(rulesPath) ? fs.statSync(rulesPath) : null;
    const mtimeMs = stat ? stat.mtimeMs : null;
    if (!cachedRules || (mtimeMs && mtimeMs !== cachedMtimeMs)) {
      const raw = fs.readFileSync(rulesPath, "utf8");
      cachedRules = JSON.parse(raw);
      cachedMtimeMs = mtimeMs;
    }
  } catch {
    // Safe fallback
    cachedRules = cachedRules || {};
  }
  return cachedRules as Rules;
}

function escapeRegex(lit: string): string {
  return lit.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function normalizeAndExpandQuery(q: string, rules?: Rules): { normalized: string; expanded: string[] } {
  const r = rules ?? getRules();
  let out = String(q || "");

  const norm = (obj: Record<string, string> | undefined) => {
    if (!obj) return;
    for (const [alias, canonical] of Object.entries(obj)) {
      const re = new RegExp(`\\b${escapeRegex(alias)}\\b`, "gi");
      out = out.replace(re, canonical);
    }
  };

  // 1) product and licensing normalization
  norm(r?.normalization?.products);
  norm(r?.normalization?.licensing);

  // 2) synonym expansion if absent
  const additions: string[] = [];
  const present = (t: string) => new RegExp(`\\b${escapeRegex(t)}\\b`, "i").test(out);
  const expandList: Array<{ entity: string }> = Array.isArray(r?.query_expansion?.expand_if_absent)
    ? r.query_expansion.expand_if_absent
    : [];
  for (const item of expandList) {
    const ent = r?.entities?.[item.entity];
    if (!ent) continue;
    const terms: string[] = [ent.canonical, ...(Array.isArray(ent.synonyms) ? ent.synonyms : [])];
    if (!terms.some(present)) additions.push(...terms);
  }

  // 3) negatives guard
  const negatives: string[] = Array.isArray(r?.negatives) ? r.negatives : [];
  const negRe = negatives.length ? new RegExp(negatives.join("|"), "i") : null;
  const expanded = [out, ...additions].filter((t) => (negRe ? !negRe.test(t) : true));
  const maxAdded = Number(r?.query_expansion?.max_added_terms || 8);
  const limited = expanded.slice(0, 1 + maxAdded);

  return { normalized: out, expanded: limited };
}

export function buildRulesRider(rules?: Rules): string {
  const r = rules ?? getRules();
  const canonicals = Object.values(r?.entities || {})
    .map((e: any) => e?.canonical)
    .filter(Boolean)
    .slice(0, 40)
    .join(", ");
  const aliases = Object.entries(r?.normalization?.products || {})
    .map(([a, c]) => `${a}→${c}`)
    .slice(0, 40)
    .join("; ");
  const preferred = [
    "Fabric Connect",
    "ExtremeCloud IQ Site Engine",
    "Switch Engine (EXOS)",
    "Fabric Engine (VOSS)",
  ].join(", ");

  return [
    "You are answering Extreme Networks questions grounded in attached File Search results.",
    "Follow these rules:",
    `- Use canonical names from this list: ${canonicals}.`,
    `- Treat these as aliases: ${aliases}.`,
    `- Prefer docs matching products or terms: ${preferred}.`,
    "- Cite title + page for any hard facts; if firmware differs, state version-specific results.",
  ].join("\n");
}

export function rewriteMessagesWithRules(
  inputMessages: OpenAIChatMessage[],
): { messages: OpenAIChatMessage[]; normalized?: string; expanded?: string[] } {
  const rules = getRules();
  const rider = buildRulesRider(rules);

  // Clone messages
  const messages: OpenAIChatMessage[] = inputMessages.map((m) => ({ ...m }));

  // Find the last user turn
  const lastUserIdx = [...messages].map((m, i) => ({ role: m.role, i })).reverse().find((x) => x.role === "user")?.i;
  if (lastUserIdx === undefined) {
    // Still inject rider as system for future turns
    return { messages: [{ role: "system", content: rider }, ...messages] };
  }

  const original = messages[lastUserIdx].content || "";
  const { normalized, expanded } = normalizeAndExpandQuery(original, rules);
  const augmented = [
    `User question: ${original}`,
    `Normalized: ${normalized}`,
    expanded && expanded.length > 1 ? `Expanded hints: ${expanded.join(" | ")}` : undefined,
    "If helpful, use the expansions as search hints.",
  ]
    .filter(Boolean)
    .join("\n");

  const out = messages.slice();
  out[lastUserIdx] = { role: "user", content: augmented };
  out.unshift({ role: "system", content: rider });

  return { messages: out, normalized, expanded };
}


