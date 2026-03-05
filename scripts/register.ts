/**
 * Register The Sparring Partner on the SignalPot marketplace.
 *
 * Usage:
 *   SIGNALPOT_API_KEY=sp_live_... npm run register
 *
 * Optional:
 *   AGENT_BASE_URL=https://your-deployment.vercel.app
 */
import { SignalPotClient } from "signalpot";
import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config = JSON.parse(
  readFileSync(resolve(__dirname, "../signalpot.config.json"), "utf-8")
);

const apiKey = process.env.SIGNALPOT_API_KEY;
if (!apiKey) {
  console.error("❌  SIGNALPOT_API_KEY environment variable is required.");
  console.error("    Generate one at: https://www.signalpot.dev/dashboard");
  process.exit(1);
}

const agentBaseUrl =
  process.env.AGENT_BASE_URL ??
  "https://signalpot-agent-sparring-partner.vercel.app";

const client = new SignalPotClient({
  apiKey,
  baseUrl: "https://www.signalpot.dev",
});

async function main() {
  console.log(`\n🥊  Registering "${config.name}" (${config.slug})...`);
  console.log(`📡  Base URL: ${agentBaseUrl}\n`);

  const agentData = {
    name: config.name,
    slug: config.slug,
    description: config.description,
    goal: config.goal,
    decision_logic: config.decision_logic,
    agent_type: config.agent_type,
    auth_type: config.auth_type,
    rate_type: config.rate_type,
    rate_amount: config.rate_amount,
    tags: config.tags,
    capability_schema: config.capability_schema.capabilities,
    endpoint_url: `${agentBaseUrl}/a2a/rpc`,
    mcp_endpoint: `${agentBaseUrl}/mcp/tools`,
  };

  try {
    // Try update first, create if 404
    let updated = false;
    try {
      const existing = await client.agents.get(config.slug);
      if (existing) {
        await client.agents.update(config.slug, agentData);
        updated = true;
      }
    } catch {
      // Agent doesn't exist yet
    }

    if (!updated) {
      await client.agents.create(agentData);
    }

    console.log(
      `✅  ${updated ? "Updated" : "Created"} agent: https://www.signalpot.dev/agents/${config.slug}`
    );
    console.log(`\n🥊  The Sparring Partner is ready to fight!\n`);
  } catch (err) {
    console.error("❌  Registration failed:", err);
    process.exit(1);
  }
}

main();
