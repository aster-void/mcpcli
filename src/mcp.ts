import process from "node:process";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { type Tool } from "@modelcontextprotocol/sdk/spec.types.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { EXIT_CONNECT, EXIT_USAGE } from "./constants.js";
import { toTSStyleOneLine, parseJsonSchema } from "./lib/json-schema.js";
import { createTransport, type TransportType } from "./transport.js";
import pkg from "../package.json" with { type: "json" };

export type ToolInfo = Pick<Tool, "name" | "description" | "inputSchema">;

export interface ConnectResult {
  client: Client;
  transport: Transport;
  transportType: TransportType;
}

export async function connectClient(
  target: string | string[],
): Promise<ConnectResult> {
  let config;
  try {
    config = createTransport(target);
  } catch (error) {
    console.error(
      `Invalid target: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(EXIT_USAGE);
  }

  const { transport, type: transportType } = config;
  const client = new Client({
    name: pkg.name || "climcp",
    version: pkg.version || "0.0.0",
  });

  // Only stdio transport has stderr
  if (transport instanceof StdioClientTransport && transport.stderr) {
    transport.stderr.on("data", (chunk) => {
      process.stderr.write(`[server] ${chunk}`);
    });
  }

  try {
    await client.connect(transport);
  } catch (error) {
    console.error(
      `Failed to connect to server: ${error instanceof Error ? error.message : String(error)}`,
    );
    await transport.close();
    process.exit(EXIT_CONNECT);
  }

  return { client, transport, transportType };
}

export async function listTools(client: Client): Promise<ToolInfo[]> {
  const response = await client.listTools();
  const tools = response.tools || [];
  tools.forEach((tool) => {
    const schema = parseJsonSchema(tool.inputSchema);
    const format = toTSStyleOneLine(schema);
    console.log(`[${tool.name}]: ${format}`);
    if (tool.description) {
      console.log(`  ${tool.description}`);
    }
  });
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  }));
}

export function printCallResult(result: unknown) {
  if (result === undefined) {
    console.log("< result: null");
    return;
  }
  const formatted = JSON.stringify(result, null, 2);
  console.log(`< result: ${formatted}`);
}
