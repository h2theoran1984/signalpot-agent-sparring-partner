import type { VercelRequest, VercelResponse } from "@vercel/node";
import config from "../../signalpot.config.json";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const baseUrl =
    process.env.AGENT_BASE_URL ??
    `https://${process.env.VERCEL_URL ?? "signalpot-agent-sparring-partner.vercel.app"}`;

  res.status(200).json({
    name: config.name,
    description: config.description,
    url: `${baseUrl}/a2a/rpc`,
    version: "0.1.0",
    capabilities: (config.capability_schema as { capabilities: { id: string; name: string; description: string }[] }).capabilities.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
    })),
    authentication: { schemes: [] },
    defaultInputModes: ["application/json"],
    defaultOutputModes: ["application/json"],
  });
}
