#!/usr/bin/env bash
set -euo pipefail

CLI="bun src/index.ts"

out="$($CLI run "bunx @modelcontextprotocol/server-filesystem /tmp" list_allowed_directories)"
if ! [ "$(echo "$out" | jq ".structuredContent.content")" != "Allowed directories:\\n/tmp" ]; then
  exit 1
fi

# should fail with invalid format
$CLI run "bunx @modelcontextprotocol/server-filesystem ." list_directory <<<"not-json-or-query" 2>/dev/null && exit 1

echo "All tests passed."
