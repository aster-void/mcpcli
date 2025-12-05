import { test, expect } from "bun:test";
import { spawn, SpawnOptionsWithoutStdio } from "node:child_process";

const CLI = ["bun", "src/index.ts"];
const BASE_OPTS: SpawnOptionsWithoutStdio = {
  env: process.env,
  stdio: ["pipe", "pipe", "pipe"],
};

type RunResult = { stdout: string; stderr: string };

function runAndCapture(
  args: string[],
  inputs: string[],
  timeoutMs = 40_000,
): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(CLI[0], [...CLI.slice(1), ...args], BASE_OPTS);
    const stdout: string[] = [];
    const stderr: string[] = [];

    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`timed out after ${timeoutMs}ms for ${args.join(" ")}`));
    }, timeoutMs);

    inputs.forEach((input, idx) => {
      setTimeout(
        () => {
          if (!child.killed) {
            child.stdin.write(input);
          }
        },
        500 * (idx + 1),
      );
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
        reject(
          new Error(
            `command ${args.join(" ")} exited ${code}, stderr: ${stderr.join("")}`,
          ),
        );
        return;
      }
      resolve({ stdout: stdout.join(""), stderr: stderr.join("") });
    });
  });
}

test("connect lists tools", async () => {
  const result = await runAndCapture(
    ["connect", "bunx", "@modelcontextprotocol/server-filesystem", "."],
    ["/q\n"],
  );
  expect(
    result.stdout.includes("- read_file") ||
      result.stdout.includes("Allowed directories"),
  ).toBe(true);
});

test("interactive invalid command shows error", async () => {
  const result = await runAndCapture(
    ["connect", "bunx", "@modelcontextprotocol/server-filesystem", "."],
    ["help\n", "/q\n"],
  );
  const combined = `${result.stdout}${result.stderr}`;
  expect(combined.includes("Tool not found: help")).toBe(true);
});
