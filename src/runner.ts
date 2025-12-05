import process from "node:process";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import type { ChildProcess } from "node:child_process";
import { createTransport, type TransportType } from "./transport/index.js";
import { EXIT_CONNECT, EXIT_USAGE } from "./constants.js";
import pkg from "../package.json" with { type: "json" };

export interface McpRunner {
  client: Client;
  transportType: TransportType;
  shutdown(code?: number): Promise<never>;
}

function killStdioProcess(transport: StdioClientTransport): void {
  const proc = (transport as unknown as { _process?: ChildProcess })._process;
  if (proc && !proc.killed) {
    proc.kill("SIGTERM");
  }
}

export async function createRunner(target: string | string[]): Promise<McpRunner> {
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
    await closeTransport(transport);
    process.exit(EXIT_CONNECT);
  }

  const shutdown = async (code = 0): Promise<never> => {
    await client.close();
    await closeTransport(transport);
    process.exit(code);
  };

  return { client, transportType, shutdown };
}

async function closeTransport(transport: Transport): Promise<void> {
  if (transport instanceof StdioClientTransport) {
    killStdioProcess(transport);
  }
  await transport.close();
}
