#!/usr/bin/env bun
import { spawn, SpawnOptionsWithoutStdio } from "node:child_process";

const CLI = ["node", "dist/index.js"];
const BASE_OPTS: SpawnOptionsWithoutStdio = { env: process.env, stdio: ["pipe", "pipe", "pipe"] };

type RunResult = { stdout: string; stderr: string };

function runAndCapture(args: string[], inputs: string[], timeoutMs = 40_000): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(CLI[0], [...CLI.slice(1), ...args], BASE_OPTS);
    const stdout: string[] = [];
    const stderr: string[] = [];

    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`timed out after ${timeoutMs}ms for ${args.join(" ")}`));
    }, timeoutMs);

    inputs.forEach((input, idx) => {
      setTimeout(() => {
        if (!child.killed) {
          child.stdin.write(input);
        }
      }, 500 * (idx + 1));
    });

    child.stdout.on("data", (buf) => stdout.push(buf.toString()));
    child.stderr.on("data", (buf) => stderr.push(buf.toString()));

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(`command ${args.join(" ")} exited ${code}, stderr: ${stderr.join("")}`));
        return;
      }
      resolve({ stdout: stdout.join(""), stderr: stderr.join("") });
    });
  });
}

async function testConnectListsTools() {
  const result = await runAndCapture(
    ["connect", "bunx", "@modelcontextprotocol/server-filesystem", "."],
    ["/q\n"],
  );
  if (!result.stdout.includes("- read_file") && !result.stdout.includes("Allowed directories")) {
    throw new Error("connect did not list tools before exiting");
  }
}

async function testInteractiveInvalidCommand() {
  const result = await runAndCapture(
    ["connect", "bunx", "@modelcontextprotocol/server-filesystem", "."],
    ["help\n", "/q\n"],
  );
  const combined = `${result.stdout}${result.stderr}`;
  if (!combined.includes("Tool not found: help")) {
    throw new Error("interactive invalid command did not show tool not found message");
  }
}

async function main() {
  await testConnectListsTools();
  await testInteractiveInvalidCommand();
  console.log("Interactive tests passed.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
