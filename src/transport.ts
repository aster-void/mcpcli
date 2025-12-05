import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";

export type TransportType = "stdio" | "http" | "sse";

export interface TransportConfig {
  type: TransportType;
  transport: Transport;
}

/**
 * Detects transport type from target string.
 * - http:// or https:// → Streamable HTTP
 * - sse:// or sse+http:// or sse+https:// → SSE (deprecated)
 * - otherwise → stdio (command)
 */
export function detectTransportType(target: string): TransportType {
  const lower = target.toLowerCase();
  if (
    lower.startsWith("sse://") ||
    lower.startsWith("sse+http://") ||
    lower.startsWith("sse+https://")
  ) {
    return "sse";
  }
  if (lower.startsWith("http://") || lower.startsWith("https://")) {
    return "http";
  }
  return "stdio";
}

/**
 * Converts sse:// URL to proper http(s):// URL
 */
function sseUrlToHttp(sseUrl: string): string {
  if (sseUrl.startsWith("sse+https://")) {
    return sseUrl.replace("sse+https://", "https://");
  }
  if (sseUrl.startsWith("sse+http://")) {
    return sseUrl.replace("sse+http://", "http://");
  }
  if (sseUrl.startsWith("sse://")) {
    return sseUrl.replace("sse://", "http://");
  }
  return sseUrl;
}

/**
 * Creates a transport based on the target string.
 * For stdio, target should be command args joined by space or array.
 */
export function createTransport(target: string | string[]): TransportConfig {
  const targetStr = Array.isArray(target) ? target.join(" ") : target;
  const type = detectTransportType(targetStr);

  switch (type) {
    case "http": {
      const url = new URL(targetStr);
      const transport = new StreamableHTTPClientTransport(url);
      return { type, transport };
    }
    case "sse": {
      const httpUrl = sseUrlToHttp(targetStr);
      const url = new URL(httpUrl);
      const transport = new SSEClientTransport(url);
      return { type, transport };
    }
    case "stdio": {
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
      return { type, transport };
    }
  }
}
