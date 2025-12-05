import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { TransportConfig } from "./types.js";

export function createStdioTransport(target: string | string[]): TransportConfig {
  const args = Array.isArray(target) ? target : target.split(/\s+/);
  const [command, ...commandArgs] = args;
  if (!command) {
    throw new Error("Command is required for stdio transport");
  }
  const transport = new StdioClientTransport({
    command,
    args: commandArgs,
    stderr: "pipe",
  });
  return { type: "stdio", transport };
}
