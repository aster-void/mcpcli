import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";

export type TransportType = "stdio" | "http" | "sse";

export interface TransportConfig {
  type: TransportType;
  transport: Transport;
}
