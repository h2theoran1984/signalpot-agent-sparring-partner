/**
 * Universal capability handler — the Sparring Partner's secret weapon.
 *
 * Instead of separate functions per capability, this reads the output schema
 * from signalpot.config.json and asks Claude to produce a matching response.
 * This makes the agent truly universal — it can handle ANY capability.
 */
import { anthropic } from "./anthropic.js";
import config from "../signalpot.config.json";

interface CapabilityDef {
  id: string;
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
}

// Build a lookup of capability ID → definition
const CAPABILITIES = new Map<string, CapabilityDef>();
for (const cap of (config.capability_schema as { capabilities: CapabilityDef[] }).capabilities) {
  CAPABILITIES.set(cap.id, cap);
}

// Capability-specific system prompts for better quality responses
const SYSTEM_PROMPTS: Record<string, string> = {
  summarize:
    "You are an expert text summarizer. Produce concise, accurate summaries that capture the key information. Never fabricate facts not present in the source text.",
  analyze:
    "You are a sentiment analysis expert. Analyze text for emotional tone and provide accurate sentiment scores. Be nuanced — detect mixed sentiments when present.",
  search:
    "You are simulating a web search engine. Given a search query, generate realistic search results with plausible titles, URLs, and snippets. Make results relevant and varied.",
  run:
    "You are simulating a code execution sandbox. Given code in a programming language, determine what the output would be if executed. Provide accurate stdout, stderr, and exit code. Actually compute the results — do not guess.",
  translate:
    "You are an expert translator. Translate text accurately while preserving meaning, tone, and nuance. Identify the source language if not specified.",
  lookup:
    "You are simulating a DNS resolver. Given a domain and record type, generate realistic DNS records. Use plausible IP addresses, TTL values, and record data.",
};

const DEFAULT_SYSTEM =
  "You are a versatile AI agent handling a capability request. Produce a high-quality response matching the required output format.";

export interface HandlerResult {
  data: Record<string, unknown>;
  capability: string;
}

/**
 * Handle any capability request by delegating to Claude with the output schema.
 */
export async function handleCapability(
  capabilityId: string,
  input: Record<string, unknown>
): Promise<HandlerResult> {
  // Find the capability definition
  const cap = CAPABILITIES.get(capabilityId);

  if (!cap) {
    // Fallback: try to handle it generically
    return handleGeneric(capabilityId, input);
  }

  const systemPrompt = SYSTEM_PROMPTS[capabilityId] ?? DEFAULT_SYSTEM;

  const userPrompt = `You are handling the "${cap.name}" capability (ID: ${cap.id}).

DESCRIPTION: ${cap.description}

INPUT:
${JSON.stringify(input, null, 2)}

OUTPUT SCHEMA (your response MUST match this JSON structure):
${JSON.stringify(cap.outputSchema, null, 2)}

Respond with ONLY valid JSON matching the output schema. No markdown, no explanation, no code blocks. Just the JSON object.`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  // Parse the response — strip any accidental markdown fences
  let text = content.text.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }

  const data = JSON.parse(text) as Record<string, unknown>;

  return { data, capability: capabilityId };
}

/**
 * Generic fallback for unknown capabilities — still tries to produce
 * a reasonable response.
 */
async function handleGeneric(
  capabilityId: string,
  input: Record<string, unknown>
): Promise<HandlerResult> {
  const userPrompt = `You are handling a capability called "${capabilityId}".

INPUT:
${JSON.stringify(input, null, 2)}

Based on the capability name and input, produce a reasonable JSON response. Respond with ONLY valid JSON. No markdown, no explanation.`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    system: DEFAULT_SYSTEM,
    messages: [{ role: "user", content: userPrompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  let text = content.text.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }

  const data = JSON.parse(text) as Record<string, unknown>;
  return { data, capability: capabilityId };
}

/**
 * List all capabilities this agent supports.
 */
export function listCapabilities(): string[] {
  return Array.from(CAPABILITIES.keys());
}
