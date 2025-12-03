import process from "node:process";
import { EXIT_CONNECT, EXIT_TOOL, EXIT_USAGE } from "../constants.js";
import { readStdin } from "../io.js";
import { connectClient } from "../mcp.js";
import { parseJson5Payload } from "../parsers.js";

export async function handleRun(toolName: string, commandArgs: string[]) {
	const { client, transport } = await connectClient(commandArgs);
	const shutdown = async (code: number) => {
		await client.close();
		await transport.close();
		process.exit(code);
	};

	try {
		const tools = await client.listTools();
		const names = new Set((tools.tools || []).map((t) => t.name));
		if (!names.has(toolName)) {
			console.error(`Tool not found: ${toolName}`);
			await shutdown(EXIT_CONNECT);
			return;
		}
	} catch (error) {
		console.error(
			`Failed to list tools: ${error instanceof Error ? error.message : String(error)}`,
		);
		await shutdown(EXIT_CONNECT);
		return;
	}

	let payloadText = "";
	try {
		payloadText = await readStdin();
	} catch (error) {
		console.error(
			`Failed to read stdin: ${error instanceof Error ? error.message : String(error)}`,
		);
		await shutdown(EXIT_USAGE);
		return;
	}

	const payloadResult = parseJson5Payload(payloadText, true);
	if (!payloadResult.ok) {
		console.error(payloadResult.error.message);
		await shutdown(EXIT_USAGE);
		return;
	}

	try {
		const result = await client.callTool({
			name: toolName,
			arguments: payloadResult.value,
		});
		console.log(JSON.stringify(result, null, 2));
	} catch (error) {
		console.error(
			`Tool execution failed: ${error instanceof Error ? error.message : String(error)}`,
		);
		await shutdown(EXIT_TOOL);
		return;
	}

	await shutdown(0);
}
