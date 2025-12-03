import JSON5 from "json5";
import { err, ok, type Result } from "./utils.js";
import * as v from "valibot";

export type ToolInvocation = {
	toolName: string;
	payloadText: string;
};

export function parseInvocation(input: string): Result<ToolInvocation> {
	const firstSpace = input.indexOf(" ");
	const hasPayload = firstSpace !== -1;
	const toolName = hasPayload ? input.slice(0, firstSpace).trim() : input.trim();
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
		const validation = v.safeParse(v.record(v.string(), v.unknown()), parsedValue);
		if (!validation.success) {
			const firstIssue = validation.issues.at(0);
			const detail = firstIssue?.message ?? "JSON payload must be an object";
			return err(new Error(`Error: ${detail}`));
		}
		return ok(validation.output);
	} catch (error) {
		return err(
			new Error(
				`Failed to parse JSON5: ${error instanceof Error ? error.message : String(error)}`,
			),
		);
	}
}
