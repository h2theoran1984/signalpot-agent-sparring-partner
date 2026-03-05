import type { VercelRequest, VercelResponse } from "@vercel/node";
import config from "../../signalpot.config.json";

/**
 * GET /mcp/tools — MCP tools discovery endpoint
 *
 * Returns the agent's capabilities in MCP tool format so that
 * MCP-compatible clients can discover and call this agent.
 */
export default function handler(_req: VercelRequest, res: VercelResponse) {
  const capabilities = (config.capability_schema as { capabilities: Array<{
    id: string;
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
  }> }).capabilities;

  const tools = capabilities.map((cap) => ({
    name: cap.id,
    description: cap.description,
    inputSchema: cap.inputSchema,
  }));

  res.status(200).json({ tools });
}
