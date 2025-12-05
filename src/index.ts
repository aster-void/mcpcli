import { Command } from "commander";
import { EXIT_USAGE } from "./constants.js";
import { handleConnect } from "./cmd/connect.js";
import { handleRun } from "./cmd/run.js";

const program = new Command();
program
  .name("climcp")
  .description("Simple MCP connector CLI")
  .configureOutput({
    outputError: (str, write) => write(str),
  });

program
  .command("connect")
  .argument("<command...>", "Command to start the MCP server")
  .action(async (commandArgs) => {
    await handleConnect(commandArgs);
  });

program
  .command("run")
  .argument(
    "<command>",
    "Command to start the MCP server (quote if contains spaces)",
  )
  .argument("[tool]", "Tool name to run (omit to list tools)")
  .argument("[args...]", "Tool arguments (key=value or JSON)")
  .action(async (command, tool, args) => {
    await handleRun(command, tool, args);
  });

program.parseAsync(process.argv).catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(EXIT_USAGE);
});
