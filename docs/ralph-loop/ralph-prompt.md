# Buffer MCP Server — Build from Evidence

## Goal

Build an MCP server for the Buffer social media API (https://developers.buffer.com).
Buffer uses a GraphQL API with Bearer token auth. This MCP server will follow the
exact same architecture as the ghost-mcp project — JSON RPC-like structure with
`use_buffer_api` and `buffer_api_help` tools, logosdx error handling, and resilient
FetchEngine configuration.

The build follows a strict evidence-first pipeline: research → real evidence → scenarios → types → design → tests → implementation.

**IMPORTANT: Complete only ONE checkbox per iteration, then stop. Write your status report and commit.**

## Reference Material

- **Buffer API docs base URL:** `https://developers.buffer.com`
- **Evidence folder:** `docs/evidence/` — research documents and raw API responses live here. ALWAYS search here for prior research before doing new work.
- **Real API responses:** `docs/evidence/real-response/` — raw JSON from real API calls goes here.
- **Scenarios folder:** `docs/scenarios/` — end-result-driven usage scenarios live here. These drive ALL downstream development.
- **Integration playground:** `tmp/` — real API test scripts live here. ALWAYS search here for existing scripts before writing new ones.
- **ghost-mcp reference:** `../ghost-mcp/` — the architecture template to replicate. Read it when you need patterns.

## Error Handling — MANDATORY

Use logosdx `attempt()` for ALL async operations. Never use try/catch blocks.

```typescript
import { attempt } from '@logosdx/utils';

const [res, err] = await attempt(() => api.post('/graphql', { query }));
if (err) {
    return JSON.stringify({ error: err.message });
}
// use res.data
```

Check errors explicitly and verbosely at every call site, like Go. No wrapping
multiple operations in a single try/catch. Each `attempt()` call gets its own
error check immediately after.

## Tasks

### Phase 1 — API Research & Documentation

Research the Buffer GraphQL API. Produce 5 focused evidence documents — no filler.
Base URL is `https://developers.buffer.com`.

- [ ] 1.1: **API Mechanics** — fetch these 4 pages and write a single consolidated `docs/evidence/01-api-mechanics.md`: `https://developers.buffer.com/guides/authentication.html`, `https://developers.buffer.com/guides/api-limits.html`, `https://developers.buffer.com/guides/error-handling.html`, `https://developers.buffer.com/guides/pagination.html`. Document: auth mechanism (Bearer token format, header, how to get a token), rate limits (requests per window, window duration, headers, burst limits, 429 response shape, any gotchas or edge cases around throttling), error response format (error codes, categories, GraphQL errors vs HTTP errors), pagination pattern (cursor vs offset, page size limits, field names like edges/nodes/pageInfo/hasNextPage/cursor). Flag anything that affects FetchEngine resilience config — retry-after headers, backoff expectations, rate limit reset timing.
- [ ] 1.2: **Domain Model** — fetch these 3 pages and write a single consolidated `docs/evidence/02-domain-model.md`: `https://developers.buffer.com/guides/data-model.html`, `https://developers.buffer.com/guides/posts-and-scheduling.html`, `https://developers.buffer.com/guides/ideas.html`. Document: ALL entities (Organization, Channel, Post, Campaign, Tag, Profile, User, etc), their relationships, field types, enums, post lifecycle (draft → scheduled → published), scheduling fields, time zones, channel-specific post formats, media attachments, Ideas data model and relationship to posts. This is CRITICAL for building TypeScript types later.
- [ ] 1.3: **Query & Mutation Examples** — fetch all 12 example pages and write to `docs/evidence/03-query-examples.md`. For each example, extract: the full GraphQL query/mutation string, variables object, and expected response shape. URLs: `https://developers.buffer.com/examples/get-organizations.html`, `https://developers.buffer.com/examples/get-channels.html`, `https://developers.buffer.com/examples/get-channel.html`, `https://developers.buffer.com/examples/get-filtered-channels.html`, `https://developers.buffer.com/examples/get-posts-for-channels.html`, `https://developers.buffer.com/examples/get-paginated-posts.html`, `https://developers.buffer.com/examples/get-scheduled-posts.html`, `https://developers.buffer.com/examples/get-posts-with-assets.html`, `https://developers.buffer.com/examples/create-text-post.html`, `https://developers.buffer.com/examples/create-image-post.html`, `https://developers.buffer.com/examples/create-scheduled-post.html`, `https://developers.buffer.com/examples/create-idea.html`.
- [ ] 1.4: **Full API Reference** — fetch `https://developers.buffer.com/reference.html` and write to `docs/evidence/04-api-reference.md`. Include: EVERY query, mutation, type, enum, and input type. Field names, types, descriptions, required vs optional. This is the most important document — be exhaustive.
- [ ] 1.5: **Consolidated Schema** — read ALL evidence files 01-04 and write `docs/evidence/05-consolidated-schema.md`. For every entity: all fields with types, all queries with arguments and return types, all mutations with input types and return types, all enums with values. Flag any discrepancies between docs and examples. This is the master reference for everything that follows.

### Phase 2 — Project Setup

- [ ] 2.1: Initialize pnpm project. Run `pnpm init`. Set up `package.json` with: name `@damusix/buffer-mcp`, type `module`, bin entry `./bin/buffer-mcp.js`. Add dependencies: `@logosdx/fetch`, `@logosdx/utils`, `@modelcontextprotocol/sdk`, `zod`. Add dev dependencies: `typescript`, `vitest`, `tsx`, `vite-plus`. Match the ghost-mcp structure exactly. Add scripts: `build` → `vp pack`, `test` → `vp test`, `check` → `vp check`, `lint` → `vp lint`, `fmt` → `vp fmt`, `dev` → `vp dev`.
- [ ] 2.2: Create `tsconfig.json` matching ghost-mcp: strict mode, ES2022 target, NodeNext module/moduleResolution, outDir dist, declaration true, declarationMap true, isolatedModules true. Create `vite.config.ts` with vite-plus defineConfig: pack entry `src/index.ts`, dts true, format esm, sourcemap true. Fmt config: singleQuote true, semi true, printWidth 100, tabWidth 4.
- [ ] 2.3: Create directory structure: `src/`, `src/actions/`, `src/tools/`, `src/__tests__/`, `src/__tests__/actions/`, `src/__tests__/tools/`, `bin/`. Create `bin/buffer-mcp.js` shebang wrapper (see `../ghost-mcp/bin/ghost-mcp.js`). Create stub `src/index.ts` that just imports and starts the MCP server with StdioServerTransport. Verify the project compiles with `pnpm run build`.
- [ ] 2.4: Create `.gitignore` with: `node_modules/`, `dist/`, `tmp/`, `.env`. Create `src/buffer-client.ts` with a FetchEngine instance configured for Buffer's GraphQL endpoint with Bearer token auth, resilience config (retry, timeout, rate limiting matching ghost-mcp patterns). Read `../ghost-mcp/src/ghost-client.ts` for the exact pattern. Env vars: `BUFFER_ACCESS_TOKEN` (required). The FetchEngine should have `beforeRequest` hook to inject `Authorization: Bearer <token>` header.

### Phase 3 — Vitest Setup & Mocks

- [ ] 3.1: Create vitest mock infrastructure. Create `src/__tests__/buffer-client.test.ts` that mocks `@logosdx/fetch` and `@logosdx/utils` (same pattern as `../ghost-mcp/src/__tests__/ghost-client.test.ts`). Test that FetchEngine is instantiated with correct base URL, auth headers, and resilience config. Use `vi.mock()` and `vi.stubEnv()`.
- [ ] 3.2: Create `src/__tests__/registry.test.ts` testing action registration, lookup by name, and help text generation. Read `../ghost-mcp/src/__tests__/registry.test.ts` for the exact pattern. Verify `getAction()`, `listActions()`, and `getActionHelp()` work correctly.

### Phase 4 — Real Evidence Gathering (tmp/)

Read ALL files in `docs/evidence/` before starting this phase. Use evidence to craft precise queries.

**Use the access token from the `BUFFER_ACCESS_TOKEN` environment variable — max 100 requests/day. Be surgical.**

- [ ] 4.1: Create `tmp/test-connection.ts` — a minimal script using `@logosdx/fetch` and `@logosdx/utils` with the test key. Make a basic introspection or simple query (e.g., list organizations or get current user — whatever the docs say is simplest). Use `attempt()` pattern. Run it with `pnpm tsx tmp/test-connection.ts`. Save the FULL raw response to `docs/evidence/real-response/connection.json`. Document what you learned.
- [ ] 4.2: Create `tmp/test-channels.ts` — query for channels/profiles based on what the docs say is available. Run it, save FULL response to `docs/evidence/real-response/channels.json`. Document pagination shape if present.
- [ ] 4.3: Create `tmp/test-posts.ts` — query for posts/updates. Test listing with pagination. Run it, save FULL responses to `docs/evidence/real-response/posts.json`. Be surgical — one well-crafted query, not many.
- [ ] 4.4: Create `tmp/test-campaigns.ts` — query for campaigns/tags/ideas if available per docs. Run it, save responses to `docs/evidence/real-response/campaigns.json`.
- [ ] 4.5: Create `tmp/test-mutations.ts` — test ONE safe write mutation (e.g., create a draft post, then immediately delete it). Use `attempt()` for each step with explicit error checks. Save responses to `docs/evidence/real-response/mutations.json`. If no safe mutation exists, document that.

### Phase 5 — Scenario-Driven Development

Read ALL files in `docs/evidence/` (including `docs/evidence/real-response/*.json`) and ALL files in `tmp/` before starting this phase. Scenarios are the end-result-driven specifications that drive ALL downstream work — types, design, tests, and implementation flow from these.

- [ ] 5.1: Create `docs/scenarios/read-scenarios.md` — write concrete end-to-end usage scenarios for every READ operation. Each scenario must include: (a) description of what the user wants to accomplish, (b) the exact `use_buffer_api` input payload the MCP client sends, (c) the exact GraphQL query that gets constructed, (d) the exact JSON response shape returned (based on REAL evidence from `docs/evidence/real-response/*.json`), (e) edge cases (empty results, pagination, invalid IDs). Cover: list orgs, list channels, list posts with pagination, get single post, list campaigns, list tags, list profiles — whatever evidence shows is available.
- [ ] 5.2: Create `docs/scenarios/write-scenarios.md` — write concrete end-to-end usage scenarios for every WRITE operation. Same structure as 5.1. Cover: create draft post, schedule post, update post, delete post, and any other mutations discovered in evidence. Include the full mutation lifecycle (create → verify → update → delete).
- [ ] 5.3: Create `docs/scenarios/error-scenarios.md` — write concrete end-to-end scenarios for every error case. Cover: invalid/expired token (401), resource not found, validation errors (missing required fields, wrong types), rate limit exceeded (429), malformed GraphQL, unknown action name, network timeout. For each: the input that triggers it, the exact error response shape (from real evidence or docs).
- [ ] 5.4: Create `docs/scenarios/help-scenarios.md` — write concrete scenarios for the `buffer_api_help` tool. Cover: list all available actions, list actions by category, get detailed help for a specific action (showing schema, description, example payload, expected response). Define the exact markdown output format.

### Phase 6 — Document Response Shapes & Types

Read ALL files in `docs/scenarios/` and `docs/evidence/real-response/*.json` before starting this phase.

- [ ] 6.1: Create `src/types.ts` — define TypeScript interfaces for every Buffer entity observed in REAL evidence (not speculation). Cross-reference `docs/evidence/05-consolidated-schema.md` with `docs/evidence/real-response/*.json` files. Include pagination types. Every interface must be backed by real response data. The scenarios in `docs/scenarios/` define what fields are actually needed.
- [ ] 6.2: Create `docs/evidence/06-response-catalog.md` — for every query and mutation tested in Phase 4, document: the exact GraphQL query string sent, the exact JSON response received (trimmed but representative), field types observed, nullable fields, pagination tokens. Cross-reference with scenarios to ensure complete coverage.

### Phase 7 — Plan the JSON RPC Structure

Read `docs/scenarios/*.md`, `docs/evidence/06-response-catalog.md`, `docs/evidence/05-consolidated-schema.md`, and `src/types.ts` before starting. Also read `../ghost-mcp/src/actions/registry.ts` and `../ghost-mcp/src/tools/use-ghost-api.ts` for the pattern.

- [ ] 7.1: Create `docs/evidence/07-tool-design.md` — plan the two MCP tools. The scenarios in `docs/scenarios/` are your specification — every scenario must map to an action. (a) `use_buffer_api` — define EVERY action name, its GraphQL query/mutation string, input Zod schema, and expected return type. (b) `buffer_api_help` — define organization, help text generation, output format. Base ALL of this on scenarios and real evidence.
- [ ] 7.2: Create `src/actions/registry.ts` — implement the action registry (register, lookup, list, help generation) matching ghost-mcp patterns. Read `../ghost-mcp/src/actions/registry.ts`. Each ActionDefinition has: name, graphqlQuery (string), inputSchema (Zod), description, example. Unlike ghost-mcp which uses HTTP methods+paths, Buffer actions map to GraphQL query strings with variables.

### Phase 8 — Implement Action Definitions

Read `docs/scenarios/*.md` and `docs/evidence/07-tool-design.md` before this phase. The scenarios define what each action must do. The tool design defines the shape.

- [ ] 8.1: Implement action definitions for read-only queries: `src/actions/queries.ts`. Based on `docs/evidence/07-tool-design.md` and validated against `docs/scenarios/read-scenarios.md`. Each action has a graphqlQuery template and Zod inputSchema derived from real evidence.
- [ ] 8.2: Implement action definitions for mutations: `src/actions/mutations.ts`. Based on `docs/evidence/07-tool-design.md` and validated against `docs/scenarios/write-scenarios.md`. Each with graphqlQuery template and Zod inputSchema derived from real evidence.

### Phase 9 — Test-Driven Development

Read `src/actions/queries.ts`, `src/actions/mutations.ts`, `src/actions/registry.ts`, and ALL files in `docs/scenarios/` before this phase. Write tests that validate the scenarios.

- [ ] 9.1: Write unit tests for query actions: `src/__tests__/actions/queries.test.ts`. Test Zod schema validation (required fields, optional fields, invalid input). Test that each action's graphqlQuery template is well-formed. Mock the FetchEngine. Validate against `docs/scenarios/read-scenarios.md`.
- [ ] 9.2: Write unit tests for mutation actions: `src/__tests__/actions/mutations.test.ts`. Same pattern — schema validation, query template verification. Validate against `docs/scenarios/write-scenarios.md`.
- [ ] 9.3: Write tests for `use_buffer_api` tool: `src/__tests__/tools/use-buffer-api.test.ts`. Read `../ghost-mcp/src/__tests__/tools/use-ghost-api.test.ts` for the pattern. Test action dispatch, GraphQL query construction, variable injection, error handling. Validate against `docs/scenarios/error-scenarios.md`. Mock `attempt()` and FetchEngine.
- [ ] 9.4: Write tests for `buffer_api_help` tool: `src/__tests__/tools/buffer-api-help.test.ts`. Read `../ghost-mcp/src/__tests__/tools/ghost-api-help.test.ts` for the pattern. Validate against `docs/scenarios/help-scenarios.md`.
- [ ] 9.5: Run `pnpm test` — all tests must pass before proceeding. Fix any failures.

### Phase 10 — Implementation

Read all test files in `src/__tests__/` before this phase. Your implementation must make the tests pass.

- [ ] 10.1: Implement `src/tools/use-buffer-api.ts` — the main tool handler. Read `../ghost-mcp/src/tools/use-ghost-api.ts` for the pattern. Takes `{ action, payload }`, looks up action in registry, validates payload with Zod, constructs GraphQL query with variables from payload, sends via FetchEngine using `attempt()`, returns JSON response. Handle ALL error cases explicitly with individual `attempt()` checks.
- [ ] 10.2: Implement `src/tools/buffer-api-help.ts` — the help tool handler. Read `../ghost-mcp/src/tools/ghost-api-help.ts` for the pattern. Takes optional `{ action, category }`, returns markdown listing of available actions or detailed help for a specific action including Zod schema description, example payload, and expected response shape.
- [ ] 10.3: Wire up `src/index.ts` — register both tools with McpServer using Zod schemas. Read `../ghost-mcp/src/index.ts` for the exact pattern. Set up StdioServerTransport. Env var validation: fail fast if `BUFFER_ACCESS_TOKEN` is missing.
- [ ] 10.4: Run `pnpm test` — all tests pass. Run `pnpm run build` — clean compile. Run `pnpm run check` — no type errors.

### Phase 11 — Integration Verification & README

- [ ] 11.1: Create `tmp/test-mcp-server.ts` — a script that spawns the MCP server as a child process and sends JSON-RPC tool calls to verify end-to-end behavior with the real Buffer API. Test `buffer_api_help` (no API call needed) and one real `use_buffer_api` query. Use `attempt()` for everything.
- [ ] 11.2: Write `README.md` for human installation. Structure: project description, install (`pnpm add @damusix/buffer-mcp` or `npx`), configuration table (`BUFFER_ACCESS_TOKEN` required), Claude Desktop config JSON example, Claude Code CLI install command (`claude mcp add buffer -e BUFFER_ACCESS_TOKEN=... -- npx @damusix/buffer-mcp`), general MCP instructions for other clients (Cursor, Windsurf, etc — just say "add as stdio MCP server"), tools section with usage examples for both `use_buffer_api` and `buffer_api_help`, license MIT.
- [ ] 11.3: Final verification — `pnpm test` passes, `pnpm run build` succeeds, `pnpm run check` clean, README is accurate and human-friendly.

## Constraints

- TypeScript strict mode — no `any` types except where interfacing with external JSON
- Use `@logosdx/fetch` FetchEngine for ALL HTTP — never raw fetch
- Use `@logosdx/utils` `attempt()` for ALL async — never try/catch
- Check errors explicitly after every `attempt()` call — verbose, like Go
- Follow ghost-mcp architecture exactly (registry pattern, tool structure, help generation)
- Max 100 Buffer API requests/day — be surgical in `tmp/` scripts, reuse evidence from `docs/evidence/`
- All research evidence goes in `docs/evidence/`, real API responses in `docs/evidence/real-response/`
- All scenarios go in `docs/scenarios/` — these are the specifications that drive downstream work
- All integration scripts go in `tmp/`
- ALWAYS search `docs/evidence/` for prior research before making API calls or doing web fetches
- ALWAYS search `docs/scenarios/` for scenario definitions before writing tests or implementations
- ALWAYS search `tmp/` for prior integration scripts before writing new ones
- Do NOT install dependencies that aren't listed in task 2.1
- Do NOT modify files outside the project without explicit instruction
- Use `pnpm` exclusively — never npm or yarn
- Commit messages: no AI bylines, no "Co-Authored-By" lines
- When fetching Buffer API docs, follow ALL links on each page to get complete coverage
- Real evidence from `docs/evidence/real-response/*.json` takes priority over documentation claims

## Done When

All tasks above are checked, `pnpm test` passes, `pnpm run build` succeeds, and `README.md` is complete.
