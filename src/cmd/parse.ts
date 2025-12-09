import JSON5 from "json5";
import { parse as shellParse } from "shell-quote";
import { err, ok, type Result } from "../lib/result.ts";
import { getErrorMessage } from "../lib/errors.ts";
import * as v from "valibot";

export type ToolInvocation = {
  toolName: string;
  payloadText: string;
};

export function parseInvocation(input: string): Result<ToolInvocation> {
  const firstSpace = input.indexOf(" ");
  const hasPayload = firstSpace !== -1;
  const toolName = hasPayload
    ? input.slice(0, firstSpace).trim()
    : input.trim();
  const payloadText = hasPayload ? input.slice(firstSpace + 1).trim() : "";
  if (!toolName) {
    return err(new Error("Error: tool name is required"));
  }
  return ok({ toolName, payloadText });
}

export function parseJson5Payload(
  text: string,
  allowEmpty = false,
): Result<Record<string, unknown>> {
  const trimmed = text.trim();
  if (!trimmed && allowEmpty) {
    return ok({});
  }
  if (!trimmed) {
    return err(new Error("Error: JSON payload is required"));
  }
  try {
    const parsedValue: unknown = JSON5.parse(trimmed);
    const validation = v.safeParse(
      v.record(v.string(), v.unknown()),
      parsedValue,
    );
    if (!validation.success) {
      const firstIssue = validation.issues.at(0);
      const detail = firstIssue?.message ?? "JSON payload must be an object";
      return err(new Error(`Error: ${detail}`));
    }
    return ok(validation.output);
  } catch (error) {
    return err(new Error(`Failed to parse JSON5: ${getErrorMessage(error)}`));
  }
}

export function parseQueryStyle(text: string): Result<Record<string, unknown>> {
  const trimmed = text.trim();
  if (!trimmed) {
    return ok({});
  }

  const parts = shellParse(trimmed);
  return parseQueryStyleParts(parts);
}

// Parse pre-split CLI args (already processed by shell, no need to re-parse quotes).
export function parseQueryStyleArgs(
  args: string[],
): Result<Record<string, unknown>> {
  if (args.length === 0) {
    return ok({});
  }
  return parseQueryStyleParts(args);
}

function parseQueryStyleParts(
  parts: ReturnType<typeof shellParse>,
): Result<Record<string, unknown>> {
  const result: Record<string, unknown> = {};

  for (const part of parts) {
    if (typeof part !== "string") {
      return err(new Error(`Unsupported shell operator in arguments`));
    }
    const eqIndex = part.indexOf("=");
    if (eqIndex === -1) {
      return err(
        new Error(`Invalid argument format: "${part}" (expected key=value)`),
      );
    }
    const rawKey = part.slice(0, eqIndex);
    const value = part.slice(eqIndex + 1);
    if (!rawKey) {
      return err(new Error(`Empty key in argument: "${part}"`));
    }

    // [key.with.dots] syntax treats the key as literal (no nesting)
    const bracketMatch = /^\[(.+)\]$/.exec(rawKey);
    if (bracketMatch && bracketMatch[1]) {
      result[bracketMatch[1]] = parseValue(value);
    } else {
      setNestedValue(result, rawKey, parseValue(value));
    }
  }
  return ok(result);
}

// Set a value in a nested object using dot notation.
// "foo.bar" sets result.foo.bar = value
// Keys are treated as literal (no expansion) if they don't contain dots.
function setNestedValue(
  obj: Record<string, unknown>,
  key: string,
  value: unknown,
): void {
  const keys = key.split(".");
  if (keys.length === 1) {
    obj[key] = value;
    return;
  }

  let current: Record<string, unknown> = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i] ?? "";
    if (
      !(k in current) ||
      typeof current[k] !== "object" ||
      current[k] === null
    ) {
      current[k] = {};
    }
    current = current[k] as Record<string, unknown>;
  }
  const lastKey = keys[keys.length - 1] ?? "";
  current[lastKey] = value;
}

function parseValue(value: string): unknown {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null") return null;
  const num = Number(value);
  if (!Number.isNaN(num) && value !== "") return num;
  return value;
}

export function parsePayload(
  input: string,
  allowEmpty = false,
): Result<Record<string, unknown>> {
  const trimmed = input.trim();
  if (!trimmed && allowEmpty) {
    return ok({});
  }
  if (!trimmed) {
    return err(new Error("Error: payload is required"));
  }
  if (trimmed.startsWith("{")) {
    return parseJson5Payload(trimmed, allowEmpty);
  }
  return parseQueryStyle(trimmed);
}
