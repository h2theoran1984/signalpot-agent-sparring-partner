import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  jsonrpcError,
  jsonrpcResult,
  type JSONRPCRequest,
  type MessageSendParams,
} from "../../lib/a2a-types.js";
import { handleCapability } from "../../lib/universal-handler.js";

/**
 * POST /a2a/rpc — JSON-RPC 2.0 endpoint
 *
 * SignalPot sends requests here when this agent participates in arena matches
 * or when other agents call it through the proxy.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body as JSONRPCRequest;
  const id = body?.id ?? 0;

  if (!body?.jsonrpc || body.jsonrpc !== "2.0") {
    return res.status(400).json(jsonrpcError(id, -32600, "Invalid JSON-RPC request"));
  }

  try {
    if (body.method === "message/send") {
      const result = await handleMessageSend(body.params as MessageSendParams);
      return res.status(200).json(jsonrpcResult(id, result));
    }

    if (body.method === "agent/card") {
      // Redirect to agent card endpoint
      return res.status(200).json(
        jsonrpcResult(id, { url: "/a2a/agent-card" })
      );
    }

    return res.status(200).json(
      jsonrpcError(id, -32601, `Method not found: ${body.method}`)
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    console.error("RPC error:", err);
    return res.status(200).json(jsonrpcError(id, -32603, message));
  }
}

async function handleMessageSend(params: MessageSendParams) {
  // Extract capability from metadata
  const capability = params.metadata?.capability_used ?? "summarize";

  // Extract input from message parts
  const dataPart = params.message.parts.find((p) => p.type === "data");
  const textPart = params.message.parts.find((p) => p.type === "text");

  let input: Record<string, unknown>;

  if (dataPart && dataPart.type === "data") {
    input = dataPart.data;
  } else if (textPart && textPart.type === "text") {
    // Try to parse text as JSON, otherwise wrap as text input
    try {
      input = JSON.parse(textPart.text);
    } catch {
      input = { text: textPart.text };
    }
  } else {
    throw new Error("No input data found in message parts");
  }

  // Route to universal handler
  const result = await handleCapability(capability, input);

  // Wrap in A2A response format
  return {
    id: crypto.randomUUID(),
    status: { state: "completed" },
    artifacts: [
      {
        parts: [
          {
            type: "data",
            data: result.data,
          },
        ],
      },
    ],
  };
}
