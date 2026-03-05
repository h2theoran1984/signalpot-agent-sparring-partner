// A2A Protocol types for agent-to-agent communication

export interface JSONRPCRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: unknown;
}

export interface JSONRPCResponse {
  jsonrpc: "2.0";
  id: string | number;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

export interface A2AMessage {
  role: "user" | "agent";
  parts: A2APart[];
}

export type A2APart =
  | { type: "text"; text: string }
  | { type: "data"; data: Record<string, unknown>; mimeType?: string };

export interface MessageSendParams {
  message: A2AMessage;
  metadata?: {
    capability_used?: string;
    [key: string]: unknown;
  };
}

export function jsonrpcError(
  id: string | number,
  code: number,
  message: string,
  data?: unknown
): JSONRPCResponse {
  return { jsonrpc: "2.0", id, error: { code, message, data } };
}

export function jsonrpcResult(
  id: string | number,
  result: unknown
): JSONRPCResponse {
  return { jsonrpc: "2.0", id, result };
}
