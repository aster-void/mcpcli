import { EXIT_CONNECT, EXIT_TOOL, EXIT_USAGE } from "../constants.js";
import { readStdin } from "../io.js";
import { listTools } from "../mcp.js";
import { parsePayload } from "../parsers.js";
import { createRunner } from "../runner.js";

export async function handleRun(
  target: string,
  toolName: string | undefined,
  args: string[],
) {
  const runner = await createRunner(target);
  const { client, shutdown } = runner;

  if (toolName === undefined) {
    try {
      await listTools(client);
    } catch (error) {
      console.error(
        `Failed to list tools: ${error instanceof Error ? error.message : String(error)}`,
      );
      return shutdown(EXIT_CONNECT);
    }
    return shutdown(0);
  }

  try {
    const tools = await client.listTools();
    const names = new Set((tools.tools || []).map((t) => t.name));
    if (!names.has(toolName)) {
      console.error(`Tool not found: ${toolName}`);
      return shutdown(EXIT_CONNECT);
    }
  } catch (error) {
    console.error(
      `Failed to list tools: ${error instanceof Error ? error.message : String(error)}`,
    );
    return shutdown(EXIT_CONNECT);
  }

  let input: string;
  if (args.length > 0) {
    input = args.join(" ");
  } else {
    try {
      input = await readStdin();
    } catch (error) {
      console.error(
        `Failed to read stdin: ${error instanceof Error ? error.message : String(error)}`,
      );
      return shutdown(EXIT_USAGE);
    }
  }

  const payloadResult = parsePayload(input, true);
  if (!payloadResult.ok) {
    console.error(payloadResult.error.message);
    return shutdown(EXIT_USAGE);
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
    return shutdown(EXIT_TOOL);
  }

  return shutdown(0);
}
