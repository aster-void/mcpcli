import { createStdioTransport } from "./stdio.js";
import { createHttpTransport } from "./http.js";
import { createSseTransport } from "./sse.js";
import type { TransportConfig, TransportType } from "./types.js";

export type { TransportConfig, TransportType };

function detectTransportType(target: string): TransportType {
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

export function createTransport(target: string | string[]): TransportConfig {
  const targetStr = Array.isArray(target) ? target.join(" ") : target;
  const type = detectTransportType(targetStr);

  switch (type) {
    case "http":
      return createHttpTransport(targetStr);
    case "sse":
      return createSseTransport(targetStr);
    case "stdio":
      return createStdioTransport(target);
  }
}
