import { test, expect } from "bun:test";
import { $ } from "bun";

const SERVER = "bunx @modelcontextprotocol/server-filesystem .";

test("run without tool lists tools", async () => {
  const result = await $`bun src/index.ts run ${SERVER}`.quiet().nothrow();
  expect(result.exitCode).toBe(0);
  expect(result.stdout.toString()).toContain("[list_directory]");
  expect(result.stdout.toString()).toContain("[read_file]");
});

test("run with query-style args", async () => {
  const result = await $`bun src/index.ts run ${SERVER} list_directory path=.`
    .quiet()
    .nothrow();
  expect(result.exitCode).toBe(0);
  expect(result.stdout.toString()).toContain("content");
  expect(result.stdout.toString()).toContain("[FILE]");
});

test("run with JSON args", async () => {
  const json = '{ "path": "." }';
  const result = await $`bun src/index.ts run ${SERVER} list_directory ${json}`
    .quiet()
    .nothrow();
  expect(result.exitCode).toBe(0);
  expect(result.stdout.toString()).toContain("content");
  expect(result.stdout.toString()).toContain("[FILE]");
});

test("run with stdin query-style", async () => {
  const result =
    await $`echo "path=." | bun src/index.ts run ${SERVER} list_directory`
      .quiet()
      .nothrow();
  expect(result.exitCode).toBe(0);
  expect(result.stdout.toString()).toContain("content");
});

test("run with stdin JSON", async () => {
  const result =
    await $`echo '{ "path": "." }' | bun src/index.ts run ${SERVER} list_directory`
      .quiet()
      .nothrow();
  expect(result.exitCode).toBe(0);
  expect(result.stdout.toString()).toContain("content");
});

test("run with unknown tool fails", async () => {
  const result = await $`bun src/index.ts run ${SERVER} unknown_tool`
    .quiet()
    .nothrow();
  expect(result.exitCode).not.toBe(0);
  expect(result.stderr.toString()).toContain("Tool not found: unknown_tool");
});

test("run with invalid query format fails", async () => {
  const result =
    await $`bun src/index.ts run ${SERVER} list_directory invalid-no-equals`
      .quiet()
      .nothrow();
  expect(result.exitCode).not.toBe(0);
  expect(result.stderr.toString()).toContain("expected key=value");
});
