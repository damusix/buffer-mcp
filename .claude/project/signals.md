# Project signals

## Framework & runtime

- **Purpose:** MCP (Model Context Protocol) server for the Buffer social media API — manage posts, channels, organizations, and ideas via any MCP-compatible LLM client
- **Language:** TypeScript (strict), ESM-only (`"type": "module"`)
- **Runtime:** Node.js 22+ (CI on 22, release on 24)
- **Package manager:** pnpm 10.33.0
- **Build tool:** `vite-plus` (`vp` CLI) — bundles to ESM, emits `.d.mts` types, sourcemaps on
- **MCP SDK:** `@modelcontextprotocol/sdk` ^1.12.1 — `McpServer` + `StdioServerTransport`
- **HTTP client:** `@logosdx/fetch` (`FetchEngine`) — resilience built-in: retries, backoff, rate limit, cache, dedup
- **Validation:** `zod` ^3.24.4 — all action input schemas, MCP tool schemas
- **Utilities:** `@logosdx/utils` (`attempt()` for error-safe async)
- **Release:** changesets (`@changesets/cli`) — PR-based versioning + npm OIDC publish

## Build / test / lint

| Purpose | Command | Notes |
|---------|---------|-------|
| Build | `pnpm run build` (`vp pack`) | Outputs `dist/index.mjs` + `dist/index.d.mts` |
| Test | `pnpm test` (`vp test`) | vitest, run from repo root |
| Type-check | `pnpm run check` (`vp check`) | tsc strict |
| Lint | `pnpm run lint` (`vp lint`) | |
| Format | `pnpm run fmt` (`vp fmt`) | Prettier via vite-plus; ignores `.claude/**` |
| Dev | `pnpm run dev` (`vp dev`) | Watch mode |

CI gate (`.github/workflows/ci.yml`): fmt → check → test → pack — all must pass on push/PR to `main`.

## Language breakdown

| Language | LOC | Files | % |
|----------|-----|-------|---|
| Markdown | 10262 | 18 | 52% |
| TypeScript | 4218 | 15 | 21% |
| YAML | 3675 | 4 | 8% |
| JSON | 1546 | 9 | 7% |
| JavaScript | 2 | 1 | <1% |

## DevOps & CI

- **CI:** GitHub Actions (`ci.yml`) — triggers on push/PR to `main`; runs fmt, check, test, pack
- **Release:** GitHub Actions (`release.yml`) — triggers on push to `main`; uses `changesets/action` to open version PR or publish to npm via OIDC trusted publishing
- **Entrypoint binary:** `bin/buffer-mcp.js` — 2-line shim that launches `dist/index.mjs`

## Domains

| Domain | Repo paths | One-liner |
|--------|------------|-----------|
| server-entry | `src/index.ts`, `bin/buffer-mcp.js` | MCP server bootstrap, tool registration, stdio transport |
| actions | `src/actions/` | Action registry + all GraphQL queries and mutations |
| tools | `src/tools/` | MCP tool handlers (`use_buffer_api`, `buffer_api_help`) |
| client | `src/buffer-client.ts` | FetchEngine singleton with auth, retry, rate-limit, cache |
| types | `src/types.ts` | All Buffer API TypeScript interfaces and enums (331 LOC) |
| tests | `src/__tests__/` | vitest test suites mirroring `actions/` and `tools/` |
| evidence | `docs/evidence/` | Real API response fixtures, schema docs, tool design notes |
| ci-release | `.github/workflows/` | CI and release pipelines |

## Architecture

```
bin/buffer-mcp.js
    └── src/index.ts               # McpServer init, registers 2 tools
            ├── src/actions/registry.ts    # Map<name, ActionDefinition>; registerActions(), getAction(), listActions()
            ├── src/actions/queries.ts     # Read actions (listOrganizations, listChannels, listPosts, getPost, …)
            ├── src/actions/mutations.ts   # Write actions (createPost, deletePost, createIdea)
            ├── src/tools/use-buffer-api.ts  # Dispatches action → Zod validate → GraphQL POST → error normalize
            ├── src/tools/buffer-api-help.ts # Introspects registry, returns markdown help strings
            └── src/buffer-client.ts       # FetchEngine singleton; all API traffic goes through here
```

- Buffer's API is GraphQL over HTTP POST to `https://api.buffer.com/`
- `ActionDefinition` shape: `{ name, category, graphqlQuery (string | fn), inputSchema (Zod), description, examples? }`
- `graphqlQuery` can be a static string or a function of the payload (for dynamic field selection)
- All errors normalised to `{ error: string }` JSON — never throws to MCP layer
- Token injected via `beforeRequest` hook to pick up runtime env changes (not just init-time)

## Conventions worth knowing

- **No `as` casts** — TypeScript strict; type assertions only at untyped API boundaries (one deliberate cast in `use-buffer-api.ts` with a comment explaining why)
- **`attempt()` pattern** — all async API calls wrapped in `@logosdx/utils` `attempt()` returning `[result, err]` tuples; no try/catch in handlers
- **GraphQL via REST POST** — no GraphQL client library; raw query strings sent as `{ query }` body to `/`
- **Types derived from real evidence** — `src/types.ts` comments cite `docs/evidence/real-response/` over official docs where they conflict
- **Test layout:** `src/__tests__/actions/` mirrors `src/actions/`, `src/__tests__/tools/` mirrors `src/tools/`
- **ESM throughout** — imports use `.js` extension (Node ESM resolution); no CommonJS
- **Prettier config** in `vite.config.ts` (not `.prettierrc`): single quotes, semi, 100 col, 4-space tabs, trailing commas
- **Changeset-driven releases** — version bumps live in `.changeset/`; never hand-edit `CHANGELOG.md`
- `BUFFER_RATE_LIMIT` env var (default 100) controls rate-limit window in `buffer-client.ts`

## Cross-cutting

- Deterministic substrate: `.claude/project/deterministic-signals.md`
- Domain partitioning basis: vertical slices by functional concern — each domain groups the implementation, tests, and docs for one cohesive responsibility
- `docs/evidence/` is the authoritative reference for Buffer API behavior — real response fixtures take priority over official documentation
