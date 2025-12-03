export type JsonSchema = {
	type?: string | string[];
	properties?: Record<string, JsonSchema>;
	required?: string[];
	items?: JsonSchema;
	enum?: unknown[];
	description?: string;
	anyOf?: JsonSchema[];
	oneOf?: JsonSchema[];
	allOf?: JsonSchema[];
	[key: string]: unknown;
};

export function toTSStyle(schema: JsonSchema, indent = 0): string {
	const ind = "  ".repeat(indent);
	const innerInd = "  ".repeat(indent + 1);

	if (schema.enum) {
		return schema.enum.map((v) => JSON.stringify(v)).join(" | ");
	}

	if (schema.anyOf) {
		return schema.anyOf.map((s) => toTSStyle(s, indent)).join(" | ");
	}

	if (schema.oneOf) {
		return schema.oneOf.map((s) => toTSStyle(s, indent)).join(" | ");
	}

	if (schema.allOf) {
		return schema.allOf.map((s) => toTSStyle(s, indent)).join(" & ");
	}

	const types = Array.isArray(schema.type) ? schema.type : [schema.type];

	if (types.includes("array") && schema.items) {
		return `${toTSStyle(schema.items, indent)}[]`;
	}

	if (types.includes("object") && schema.properties) {
		const requiredSet = new Set(schema.required || []);
		const lines: string[] = ["{"];

		for (const [key, propSchema] of Object.entries(schema.properties)) {
			const optional = requiredSet.has(key) ? "" : "?";
			const propType = toTSStyle(propSchema, indent + 1);
			const desc = propSchema.description ? ` // ${propSchema.description}` : "";
			lines.push(`${innerInd}${key}${optional}: ${propType};${desc}`);
		}

		lines.push(`${ind}}`);
		return lines.join("\n");
	}

	if (types.includes("string")) return "string";
	if (types.includes("number")) return "number";
	if (types.includes("integer")) return "number";
	if (types.includes("boolean")) return "boolean";
	if (types.includes("null")) return "null";

	return "unknown";
}
