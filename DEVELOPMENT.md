## Commands

```sh
pnpm install
pnpm test        # runs build, CLI smoke tests, interactive test via bun
pnpm run build   # emits dist/
```

## Release flow

- Bump `package.json` version (current: `0.0.1`).
- Push a tag `v*` (e.g., `v0.0.1`). GitHub Actions runs build/test then `pnpm publish --access public`.
- Repo secret `NPM_TOKEN` must be set for publish.
