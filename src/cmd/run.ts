import process from "node:process";
import { EXIT_CONNECT, EXIT_TOOL, EXIT_USAGE } from "../constants.js";
import { readStdin } from "../io.js";
import { connectClient, listTools } from "../mcp.js";
import { parsePayload } from "../parsers.js";

export async function handleRun(
  target: string,
  toolName: string | undefined,
  args: string[],
) {
  const { client, transport } = await connectClient(target);
  const shutdown = async (code: number) => {
    await client.close();
    await transport.close();
    process.exit(code);
  };

  if (toolName === undefined) {
    try {
      await listTools(client);
    } catch (error) {
      console.error(
        `Failed to list tools: ${error instanceof Error ? error.message : String(error)}`,
      );
      await shutdown(EXIT_CONNECT);
      return;
    }
    await shutdown(0);
    return;
  }

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
      await shutdown(EXIT_USAGE);
      return;
    }
  }

  const payloadResult = parsePayload(input, true);
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
