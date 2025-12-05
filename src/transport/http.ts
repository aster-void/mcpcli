import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { TransportConfig } from "./types.js";

export function createHttpTransport(url: string): TransportConfig {
  const transport = new StreamableHTTPClientTransport(new URL(url));
  return { type: "http", transport };
}
