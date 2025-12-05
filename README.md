# climcp

Speak to MCP servers directly. `climcp` is an interface between human and MCP servers.

```
[You] <-> [MCP]
```

## Why

- Explore: `connect` for exploration. see what a MCP server can do.
- CI: one-shot `run` for automation
- Debugging (roadmap): `with` for debugging MCP in your terminal. [not implemented yet]

## Install

```sh
bun add -g climcp
# or
npm install -g climcp
```

Requires Node.js 22+ and bun (for development).

## Commands

- `climcp connect <command...>` — start the MCP server process, handshake, drop into an interactive prompt.
- `climcp run "<command>" [tool] [args...]` — start the server, call one tool once, exit. Omit tool to list available tools.

### Connect

Example:

```sh
$ climcp connect bunx @modelcontextprotocol/server-filesystem .
[prints usage]
> list_directory { path: "." }
result: {
  "content": [
    {
      "type": "text",
      "text": "[FILE] lefthook.yml\n[DIR] nix\n[FILE] CLAUDE.md\n[DIR] src\n[FILE] flake.nix\n[DIR] node_modules\n[DIR] .direnv\n[FILE] LICENSE\n[FILE] bun.lock\n[FILE] AGENTS.md\n[FILE] DEVELOPMENT.md\n[FILE] flake.lock\n[FILE] .gitignore\n[FILE] package.json\n[DIR] scripts\n[DIR] .git\n[FILE] tsconfig.json\n[FILE] README.md\n[FILE] .envrc\n[DIR] dist\n[DIR] .github"
    }
  ],
  "structuredContent": {
    "content": "[FILE] lefthook.yml\n[DIR] nix\n[FILE] CLAUDE.md\n[DIR] src\n[FILE] flake.nix\n[DIR] node_modules\n[DIR] .direnv\n[FILE] LICENSE\n[FILE] bun.lock\n[FILE] AGENTS.md\n[FILE] DEVELOPMENT.md\n[FILE] flake.lock\n[FILE] .gitignore\n[FILE] package.json\n[DIR] scripts\n[DIR] .git\n[FILE] tsconfig.json\n[FILE] README.md\n[FILE] .envrc\n[DIR] dist\n[DIR] .github"
  }
}
> /q
```

### Run

One-shot execution. Supports two input formats:

```sh
# Query style (key=value)
climcp run "bunx @modelcontextprotocol/server-filesystem ." list_directory path=.

# JSON style
climcp run "bunx @modelcontextprotocol/server-filesystem ." list_directory '{ "path": "." }'

# List available tools (omit tool name)
climcp run "bunx @modelcontextprotocol/server-filesystem ."

# stdin also works (JSON or query style)
echo '{ path: "." }' | climcp run "bunx @modelcontextprotocol/server-filesystem ." list_directory
echo "path=." | climcp run "bunx @modelcontextprotocol/server-filesystem ." list_directory
```

Format is auto-detected: `{` prefix means JSON, otherwise query style.

Success prints JSON to stdout; any failure writes to stderr and exits non-zero.

## Reference

for development, see <./DEVELOPMENT.md>
