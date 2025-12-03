import process from "node:process";
import readline from "node:readline";
import { EXIT_CONNECT } from "../constants.js";
import { askLine } from "../io.js";
import { connectClient, listTools, printCallResult } from "../mcp.js";
import { parseInvocation, parseJson5Payload } from "../parsers.js";

export async function handleConnect(commandArgs: string[]) {
	const { client, transport } = await connectClient(commandArgs);

	const toolNames = new Set<string>();
	try {
		const tools = await listTools(client);
		tools.forEach((tool) => toolNames.add(tool.name));
	} catch (error) {
		console.error(
			`Failed to list tools: ${error instanceof Error ? error.message : String(error)}`,
		);
		await client.close();
		await transport.close();
		process.exit(EXIT_CONNECT);
	}

	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	let closing = false;
	const cleanup = async (code = 0) => {
		if (closing) return;
		closing = true;
		rl.close();
		await client.close();
		await transport.close();
		process.exit(code);
	};

	rl.on("SIGINT", () => cleanup(0));
	rl.on("close", () => cleanup(0));

	while (true) {
		const line = await askLine(rl);
		if (line === null) {
			await cleanup(0);
			return;
		}

		const trimmed = line.trim();
		if (!trimmed) {
			continue;
		}

		switch (trimmed) {
			case "/q":
			case "/quit": {
				await cleanup(0);
				return;
			}
			case "/t":
			case "/tools": {
				try {
					await listTools(client);
				} catch (error) {
					console.error(
						`Failed to list tools: ${error instanceof Error ? error.message : String(error)}`,
					);
				}
				continue;
			}
			default:
				break;
		}

		const parsedInvocation = parseInvocation(trimmed);
		if (!parsedInvocation.ok) {
			console.error(parsedInvocation.error.message);
			continue;
		}

		if (!toolNames.has(parsedInvocation.value.toolName)) {
			console.error(`Tool not found: ${parsedInvocation.value.toolName}`);
			continue;
		}

		const payloadResult = parseJson5Payload(
			parsedInvocation.value.payloadText,
			true,
		);
		if (!payloadResult.ok) {
			console.error(payloadResult.error.message);
			continue;
		}

		try {
			const result = await client.callTool({
				name: parsedInvocation.value.toolName,
				arguments: payloadResult.value,
			});
			printCallResult(result);
		} catch (error) {
			console.error(
				`Tool call failed: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}
}
