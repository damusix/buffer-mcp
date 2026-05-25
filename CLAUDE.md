# CLAUDE.md


## What this is


MCP server for the Buffer social media API. Exposes posts, channels, organizations, and ideas management to MCP-compatible LLM clients. Published as `@damusix/buffer-mcp` on npm. TypeScript, built with `vite-plus`.


## Scope boundary


Buffer API only — no other social media platforms. Requires `BUFFER_ACCESS_TOKEN` env var. Targets Node 22+. Server-side MCP transport only (stdio); no browser runtime.


## Tribal knowledge


No surprising patterns detected. Add gotchas as they surface.


## Project rules


- Commit style: Conventional Commits (`fix:`, `feat:`, `chore:`).
- CI gate: `vp fmt` → `vp check` → `vp test` → `vp pack` (all must pass).
- Versioning: Changesets (`pnpm exec changeset publish`). Merge to `main` triggers release PR or publish.
- Build tool: `vite-plus` (`vp` CLI) — not raw vite.


## Processes


- **CI** (`ci.yml`): runs on push/PR to `main` — fmt, check, test, pack.
- **Release** (`release.yml`): push to `main` triggers changesets/action — opens a "Version Packages" PR or publishes to npm via OIDC trusted publishing (no token needed).
- No rollback or on-call process documented.


## External references


- [Buffer Developer Settings](https://developers.buffer.com) — API token provisioning.
- npm: `@damusix/buffer-mcp`
- GitHub: `damusix/buffer-mcp`


## Project signals (auto-loaded)


@.claude/project/deterministic-signals.md
@.claude/project/signals.md
