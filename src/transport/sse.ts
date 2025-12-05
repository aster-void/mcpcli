import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import type { TransportConfig } from "./types.js";

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

export function createSseTransport(url: string): TransportConfig {
  const httpUrl = sseUrlToHttp(url);
  const transport = new SSEClientTransport(new URL(httpUrl));
  return { type: "sse", transport };
}
