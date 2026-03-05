import type { VercelRequest, VercelResponse } from "@vercel/node";
import { listCapabilities } from "../lib/universal-handler.js";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    status: "ok",
    agent: "sparring-partner",
    version: "0.1.0",
    capabilities: listCapabilities(),
    description: "The Arena's universal house fighter",
  });
}
