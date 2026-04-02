# Tool Design — Buffer MCP Server

Defines the two MCP tools (`use_buffer_api` and `buffer_api_help`), every action definition,
GraphQL query/mutation templates, Zod input schemas, and error handling flow.

All designs are derived from:

- `docs/scenarios/read-scenarios.md` — 11 read scenarios → 6 query actions
- `docs/scenarios/write-scenarios.md` — 10 write scenarios → 3 mutation actions
- `docs/scenarios/error-scenarios.md` — 11 error scenarios → error handling priority
- `docs/scenarios/help-scenarios.md` — 9 help scenarios → help tool behavior
- `docs/evidence/06-response-catalog.md` — real API response shapes
- `src/types.ts` — TypeScript interfaces for all entities

---

## Tool 1: `use_buffer_api`

### MCP Registration

```typescript
server.tool(
    'use_buffer_api',
    'Execute a Buffer API action (query or mutation)',
    useBufferApiSchema,
    handler,
);
```

### Input Schema (Zod)

```typescript
const useBufferApiSchema = z.object({
    action: z.string().describe('Action to execute (e.g. "listPosts", "createPost")'),
    payload: z
        .record(z.unknown())
        .optional()
        .describe(
            'Action payload — fields depend on the action. Use buffer_api_help to see available fields.',
        ),
});
```

### Handler Flow

Following the error handling priority from `docs/scenarios/error-scenarios.md`:

```
1. Look up action in registry → Scenario 7 (unknown action)
2. Validate payload with Zod schema → Scenario 6 (validation error)
3. Check BUFFER_ACCESS_TOKEN env var → Scenario 1 (missing token)
4. Build GraphQL query string from action template + validated payload
5. Send POST to Buffer API via FetchEngine with attempt()
6. Check attempt() error → Scenario 9 (network timeout)
7. Check HTTP status in response:
   - 400 → Scenario 3/4 (GraphQL validation error)
   - 429 → Scenario 2 (rate limit — FetchEngine should retry first)
8. Check errors array in response body → Scenarios 1b, 10, 11
9. Check for typed mutation errors in data → Scenario 5
10. Return successful data as JSON string
```

### GraphQL Query Construction

Unlike ghost-mcp which uses REST (method + path + query params/body), Buffer uses
a single GraphQL POST endpoint. Each action has a `graphqlQuery` template string.

**Variable injection strategy:** Inline string interpolation into the GraphQL query.
Enum values are injected bare (without quotes), strings are quoted, arrays use JSON-like syntax.

```typescript
function buildGraphQLQuery(action: ActionDefinition, payload: Record<string, unknown>): string {
    // Each action's graphqlQuery is a function that takes validated payload
    // and returns the complete GraphQL query string
    return action.graphqlQuery; // Template already built during registration
}
```

**Key pattern:** Each action's `graphqlQuery` field is actually a **builder function**
(typed as `(payload) => string`) that constructs the full query from validated input.
This differs from ghost-mcp where the path template uses `{id}` placeholders.

### Response Processing

```typescript
// All responses go through the same pipeline:
// 1. Check for errors array (system errors)
if (response.errors?.length) {
    const err = response.errors[0];
    const code = err.extensions?.code;
    return JSON.stringify({
        error: `${err.message}${code ? ` (${code})` : ''}`,
    });
}

// 2. Check for typed mutation errors (message field without expected success field)
// Mutation responses: check if data.{mutationName}.message exists (MutationError)
// vs data.{mutationName}.post exists (PostActionSuccess)

// 3. Return data
return JSON.stringify(response.data);
```

---

## Tool 2: `buffer_api_help`

### MCP Registration

```typescript
server.tool(
    'buffer_api_help',
    'Get help on available Buffer API actions',
    bufferApiHelpSchema,
    handler,
);
```

### Input Schema (Zod)

```typescript
const bufferApiHelpSchema = z.object({
    action: z
        .string()
        .optional()
        .describe(
            'Specific action name to get detailed help for. Omit to see all available actions.',
        ),
    category: z.enum(['query', 'mutation']).optional().describe('Filter actions by category'),
});
```

### Handler Flow

From `docs/scenarios/help-scenarios.md`:

1. If `action` is provided → look up action, return detailed help (or error)
2. If only `category` is provided → list actions filtered by category
3. If neither → list all actions grouped by category

**Action takes precedence over category** (Scenario 8).

### Output Format

**Listing mode** (no action specified):

```markdown
# Buffer API Actions

## Queries

- **listOrganizations** — List all organizations under the authenticated Buffer account
- **listChannels** — List all channels for an organization
  ...

## Mutations

- **createPost** — Create a new post (draft, queued, scheduled, or immediate)
  ...
```

**Detail mode** (action specified): Uses `getActionHelp()` from registry.

**Error mode** (unknown action): Plain text single line.

---

## Action Definitions

### File: `src/actions/queries.ts`

Contains 6 query action definitions. All registered via `registerActions()`.

---

#### Action: `listOrganizations`

**Category:** query
**Description:** List all organizations under the authenticated Buffer account

**Zod Input Schema:**

```typescript
z.object({});
```

No input required — token is account-scoped.

**GraphQL Query Template:**

```graphql
query {
    account {
        organizations {
            id
            name
            ownerEmail
            channelCount
            limits {
                channels
                members
                scheduledPosts
                tags
                ideas
                ideaGroups
                savedReplies
                scheduledThreadsPerChannel
                scheduledStoriesPerChannel
                generateContent
            }
        }
    }
}
```

**Response Path:** `data.account.organizations`
**Note:** Static query — no variables needed.

**Example:**

```json
{}
```

---

#### Action: `listChannels`

**Category:** query
**Description:** List all channels for an organization

**Zod Input Schema:**

```typescript
z.object({
    organizationId: z.string().describe('The organization ID'),
    filter: z
        .object({
            isLocked: z.boolean().optional().describe('Filter by lock status'),
            product: z.string().optional().describe('Filter by product'),
        })
        .optional()
        .describe('Optional filter criteria'),
});
```

**GraphQL Query Builder:**

```typescript
(payload) => {
    const filterStr = payload.filter
        ? `, filter: { ${Object.entries(payload.filter)
              .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
              .join(', ')} }`
        : '';
    return `query {
        channels(input: {
            organizationId: "${payload.organizationId}"${filterStr}
        }) {
            id name displayName service type avatar timezone
            isDisconnected isLocked isQueuePaused
            organizationId serviceId createdAt updatedAt
            allowedActions scopes
            postingSchedule { day times paused }
        }
    }`;
};
```

**Response Path:** `data.channels`

**Example:**

```json
{
    "organizationId": "68425e79e5105cb6432cc10f"
}
```

---

#### Action: `getChannel`

**Category:** query
**Description:** Get detailed info about a specific channel by ID

**Zod Input Schema:**

```typescript
z.object({
    channelId: z.string().describe('The channel ID'),
});
```

**GraphQL Query Builder:**

```typescript
(payload) => `query {
    channel(input: { id: "${payload.channelId}" }) {
        id name displayName service type avatar timezone
        isDisconnected isLocked isQueuePaused
        organizationId serviceId createdAt updatedAt
        allowedActions scopes
        postingSchedule { day times paused }
    }
}`;
```

**Response Path:** `data.channel`

**Example:**

```json
{
    "channelId": "68426341d6d25b49a128217b"
}
```

---

#### Action: `listPosts`

**Category:** query
**Description:** List posts for an organization with optional filters and pagination

**Zod Input Schema:**

```typescript
z.object({
    organizationId: z.string().describe('The organization ID to list posts for'),
    first: z.number().optional().describe('Number of posts to return (default: 20)'),
    after: z.string().optional().describe('Pagination cursor from a previous response'),
    filter: z
        .object({
            status: z
                .array(z.enum(['draft', 'buffer', 'sent', 'failed']))
                .optional()
                .describe('Filter by post status'),
            channelIds: z.array(z.string()).optional().describe('Filter by channel IDs'),
            tagIds: z.array(z.string()).optional().describe('Filter by tag IDs'),
            dueAt: z
                .object({
                    start: z.string().optional().describe('Start date (ISO 8601)'),
                    end: z.string().optional().describe('End date (ISO 8601)'),
                })
                .optional()
                .describe('Filter by due date range'),
            createdAt: z
                .object({
                    start: z.string().optional().describe('Start date (ISO 8601)'),
                    end: z.string().optional().describe('End date (ISO 8601)'),
                })
                .optional()
                .describe('Filter by creation date range'),
        })
        .optional()
        .describe('Filter criteria'),
});
```

**GraphQL Query Builder:**

```typescript
(payload) => {
    const first = payload.first ?? 20;
    const afterStr = payload.after ? `, after: "${payload.after}"` : '';

    // Build filter string if present
    let filterStr = '';
    if (payload.filter) {
        const parts: string[] = [];
        if (payload.filter.status) {
            parts.push(`status: [${payload.filter.status.join(', ')}]`);
        }
        if (payload.filter.channelIds) {
            parts.push(`channelIds: ${JSON.stringify(payload.filter.channelIds)}`);
        }
        if (payload.filter.tagIds) {
            parts.push(`tagIds: ${JSON.stringify(payload.filter.tagIds)}`);
        }
        if (payload.filter.dueAt) {
            const dateParts: string[] = [];
            if (payload.filter.dueAt.start)
                dateParts.push(`start: "${payload.filter.dueAt.start}"`);
            if (payload.filter.dueAt.end) dateParts.push(`end: "${payload.filter.dueAt.end}"`);
            parts.push(`dueAt: { ${dateParts.join(', ')} }`);
        }
        if (payload.filter.createdAt) {
            const dateParts: string[] = [];
            if (payload.filter.createdAt.start)
                dateParts.push(`start: "${payload.filter.createdAt.start}"`);
            if (payload.filter.createdAt.end)
                dateParts.push(`end: "${payload.filter.createdAt.end}"`);
            parts.push(`createdAt: { ${dateParts.join(', ')} }`);
        }
        if (parts.length) {
            filterStr = `, filter: { ${parts.join(', ')} }`;
        }
    }

    return `query {
        posts(
            first: ${first}${afterStr},
            input: {
                organizationId: "${payload.organizationId}"${filterStr}
            }
        ) {
            edges {
                node {
                    id text status via schedulingType isCustomScheduled
                    createdAt updatedAt dueAt sentAt
                    channelId channelService ideaId externalLink
                    sharedNow shareMode
                    tags { id name color }
                    notes { id text createdAt }
                    assets {
                        id type mimeType source thumbnail
                        ... on ImageAsset { image { altText width height isAnimated } }
                        ... on VideoAsset { video { durationMs } }
                    }
                    author { id email name }
                    error
                    allowedActions
                }
                cursor
            }
            pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
        }
    }`;
};
```

**Response Path:** `data.posts`

**IMPORTANT:** `first` and `after` are top-level GraphQL args, NOT inside `input`.
Filter fields go inside `input`. This is confirmed by real API testing.

**Known issue:** `sort` and `filter` caused HTTP 400 in real testing when used inline.
The implementation should test filter support carefully. If filters fail, fall back to
unfiltered queries and note the limitation.

**Example:**

```json
{
    "organizationId": "68425e79e5105cb6432cc10f",
    "first": 10
}
```

---

#### Action: `getPost`

**Category:** query
**Description:** Get detailed info about a specific post by ID

**Zod Input Schema:**

```typescript
z.object({
    postId: z.string().describe('The post ID'),
});
```

**GraphQL Query Builder:**

```typescript
(payload) => `query {
    post(input: { id: "${payload.postId}" }) {
        id text status via schedulingType isCustomScheduled
        createdAt updatedAt dueAt sentAt
        channelId channelService ideaId externalLink
        sharedNow shareMode
        tags { id name color }
        notes { id text createdAt }
        assets {
            id type mimeType source thumbnail
            ... on ImageAsset { image { altText width height isAnimated } }
            ... on VideoAsset { video { durationMs } }
        }
        author { id email name }
        error
        allowedActions
    }
}`;
```

**Response Path:** `data.post`

**Example:**

```json
{
    "postId": "69028ba74f51d522ca05aeed"
}
```

---

#### Action: `getDailyPostingLimits`

**Category:** query
**Description:** Check daily posting limits for specific channels

**Zod Input Schema:**

```typescript
z.object({
    channelIds: z.array(z.string()).min(1).describe('Array of channel IDs to check limits for'),
    date: z.string().optional().describe('ISO 8601 date to check (defaults to today)'),
});
```

**GraphQL Query Builder:**

```typescript
(payload) => {
    const dateStr = payload.date ? `, date: "${payload.date}"` : '';
    return `query {
        dailyPostingLimits(input: {
            channelIds: ${JSON.stringify(payload.channelIds)}${dateStr}
        }) {
            channel { id name service }
            limit
            used
        }
    }`;
};
```

**Response Path:** `data.dailyPostingLimits`
**Note:** Not tested against real API — response shape from docs only.

**Example:**

```json
{
    "channelIds": ["68426341d6d25b49a128217b"]
}
```

---

### File: `src/actions/mutations.ts`

Contains 3 mutation action definitions. All registered via `registerActions()`.

---

#### Action: `createPost`

**Category:** mutation
**Description:** Create a new post (draft, queued, scheduled, or immediate)

**Zod Input Schema:**

```typescript
z.object({
    channelId: z.string().describe('The channel ID to post to'),
    text: z.string().optional().describe('The post text content'),
    schedulingType: z
        .enum(['automatic', 'notification'])
        .describe('Scheduling type: "automatic" or "notification"'),
    mode: z.enum(['addToQueue', 'shareNext', 'shareNow', 'customScheduled']).describe('Share mode'),
    saveToDraft: z
        .boolean()
        .optional()
        .describe('Set to true to save as draft instead of publishing'),
    dueAt: z
        .string()
        .optional()
        .describe('ISO 8601 date for customScheduled mode (required when mode is customScheduled)'),
    assets: z
        .object({
            images: z
                .array(
                    z.object({
                        url: z.string().describe('Image URL'),
                    }),
                )
                .optional()
                .describe('Image attachments'),
        })
        .optional()
        .describe('Media attachments'),
    tagIds: z.array(z.string()).optional().describe('Array of tag IDs to apply'),
});
```

**GraphQL Mutation Builder:**

```typescript
(payload) => {
    const parts: string[] = [];
    if (payload.text !== undefined) parts.push(`text: ${JSON.stringify(payload.text)}`);
    parts.push(`channelId: "${payload.channelId}"`);
    parts.push(`schedulingType: ${payload.schedulingType}`); // bare enum
    parts.push(`mode: ${payload.mode}`); // bare enum
    if (payload.saveToDraft) parts.push(`saveToDraft: true`);
    if (payload.dueAt) parts.push(`dueAt: "${payload.dueAt}"`);
    if (payload.tagIds?.length) parts.push(`tagIds: ${JSON.stringify(payload.tagIds)}`);
    if (payload.assets?.images?.length) {
        const imgs = payload.assets.images
            .map((i) => `{ url: ${JSON.stringify(i.url)} }`)
            .join(', ');
        parts.push(`assets: { images: [${imgs}] }`);
    }

    return `mutation {
        createPost(input: {
            ${parts.join(',\n            ')}
        }) {
            ... on PostActionSuccess {
                post {
                    id text status via shareMode channelId channelService
                    dueAt sentAt createdAt
                    tags { id name color }
                    notes { id text createdAt }
                    assets {
                        id type mimeType source thumbnail
                        ... on ImageAsset { image { altText width height isAnimated } }
                    }
                    allowedActions
                }
            }
            ... on MutationError {
                message
            }
        }
    }`;
};
```

**Response Path:** `data.createPost`
**Success discriminant:** Presence of `post` field (PostActionSuccess)
**Error discriminant:** Presence of `message` field (MutationError)

**IMPORTANT:** `schedulingType` and `mode` are bare enums — no quotes in GraphQL.

**Example:**

```json
{
    "channelId": "690288cc669affb4c9915dda",
    "text": "Hello from the Buffer MCP!",
    "schedulingType": "automatic",
    "mode": "addToQueue"
}
```

---

#### Action: `deletePost`

**Category:** mutation
**Description:** Delete a post by ID

**Zod Input Schema:**

```typescript
z.object({
    postId: z.string().describe('The ID of the post to delete'),
});
```

**GraphQL Mutation Builder:**

```typescript
(payload) => `mutation {
    deletePost(input: { id: "${payload.postId}" }) {
        ... on DeletePostSuccess {
            __typename
        }
        ... on MutationError {
            message
        }
    }
}`;
```

**Response Path:** `data.deletePost`
**Success discriminant:** `__typename === "DeletePostSuccess"`
**Error discriminant:** Presence of `message` field

**Example:**

```json
{
    "postId": "69cde75f64c20531e4a8edfa"
}
```

---

#### Action: `createIdea`

**Category:** mutation
**Description:** Create a new idea in an organization's idea board

**Zod Input Schema:**

```typescript
z.object({
    organizationId: z.string().describe('The organization ID'),
    content: z
        .object({
            title: z.string().optional().describe('Idea title'),
            text: z.string().optional().describe('Idea body text'),
            media: z
                .array(
                    z.object({
                        url: z.string().describe('Media URL'),
                        type: z.enum(['image', 'video']).describe('Media type'),
                        alt: z.string().optional().describe('Alt text'),
                    }),
                )
                .optional()
                .describe('Media attachments'),
        })
        .describe('Idea content'),
    tagIds: z.array(z.string()).optional().describe('Tag IDs to apply'),
});
```

**GraphQL Mutation Builder:**

```typescript
(payload) => {
    const contentParts: string[] = [];
    if (payload.content.title) contentParts.push(`title: ${JSON.stringify(payload.content.title)}`);
    if (payload.content.text) contentParts.push(`text: ${JSON.stringify(payload.content.text)}`);
    if (payload.content.media?.length) {
        const mediaItems = payload.content.media
            .map((m) => {
                const parts = [`url: ${JSON.stringify(m.url)}`, `type: ${m.type}`];
                if (m.alt) parts.push(`alt: ${JSON.stringify(m.alt)}`);
                return `{ ${parts.join(', ')} }`;
            })
            .join(', ');
        contentParts.push(`media: [${mediaItems}]`);
    }

    const tagStr = payload.tagIds?.length ? `, tagIds: ${JSON.stringify(payload.tagIds)}` : '';

    return `mutation {
        createIdea(input: {
            organizationId: "${payload.organizationId}",
            content: { ${contentParts.join(', ')} }${tagStr}
        }) {
            ... on IdeaResponse {
                idea {
                    id
                    content { title text }
                }
            }
            ... on InvalidInputError { message }
            ... on LimitReachedError { message }
            ... on UnauthorizedError { message }
            ... on UnexpectedError { message }
        }
    }`;
};
```

**Response Path:** `data.createIdea`
**Success discriminant:** Presence of `idea` field (IdeaResponse)
**Error discriminant:** Presence of `message` field (any error type)

**Example:**

```json
{
    "organizationId": "68425e79e5105cb6432cc10f",
    "content": {
        "title": "Pool Maintenance Tips",
        "text": "Share weekly pool maintenance tips."
    }
}
```

---

## Implementation Architecture

### Key Differences from ghost-mcp

| Aspect            | ghost-mcp                         | buffer-mcp                        |
| ----------------- | --------------------------------- | --------------------------------- |
| API type          | REST                              | GraphQL                           |
| Action routing    | HTTP method + path template       | GraphQL query string builder      |
| Auth              | Admin JWT + Content API key       | Bearer token                      |
| Action identity   | `api` + `action` name             | `action` name only                |
| Payload injection | Path params + query params + body | Inline GraphQL interpolation      |
| Response shape    | Varies by endpoint                | Always `{ data, errors }` wrapper |
| Pagination        | Ghost-specific                    | Relay cursor-based                |

### Action Definition Interface

From `src/actions/registry.ts` (already implemented in iteration 12):

```typescript
interface ActionDefinition {
    name: string;
    category: 'query' | 'mutation';
    graphqlQuery: string; // Will store template; actual builder is the graphqlQuery field
    inputSchema: z.ZodType;
    description: string;
    example?: Record<string, unknown>;
}
```

**Design decision:** The `graphqlQuery` field in `ActionDefinition` stores a static
template string. The actual query with variables injected is built by a separate
`buildQuery(action, payload)` function in `use-buffer-api.ts`. This keeps the
registry clean and the query construction logic centralized.

**Alternative considered:** Making `graphqlQuery` a function `(payload) => string`.
Rejected because it complicates testing and the registry interface. Better to have
a central builder that handles all interpolation logic.

**Final approach:** Each action stores a static `graphqlQuery` template with
placeholder patterns. A `buildQuery()` function in the tool handler resolves
variables from the validated payload. For queries with complex variable injection
(like `listPosts` with optional filters), the builder function handles the logic.

Actually, reconsidering: since each action has very different query shapes and
variable injection patterns, it's cleaner to store the builder function directly.
The `graphqlQuery` field will be typed as `string | ((payload: Record<string, unknown>) => string)`.
Static queries (like `listOrganizations`) use a string, dynamic queries use a function.

### GraphQL Query Builder Pattern

```typescript
// In use-buffer-api.ts
function resolveQuery(action: ActionDefinition, payload: Record<string, unknown>): string {
    if (typeof action.graphqlQuery === 'function') {
        return action.graphqlQuery(payload);
    }
    return action.graphqlQuery; // Static query (e.g., listOrganizations)
}
```

### Error Detection Pattern

```typescript
// After successful attempt() — response has data
function processResponse(response: GraphQLResponse<unknown>, action: ActionDefinition): string {
    // 1. System errors (errors array)
    if (response.errors?.length) {
        const err = response.errors[0];
        const code = err.extensions?.code;
        return JSON.stringify({
            error: `${err.message}${code ? ` (${code})` : ''}`,
        });
    }

    // 2. No data at all
    if (!response.data) {
        return JSON.stringify({ error: 'No data returned' });
    }

    // 3. For mutations: check for typed errors
    if (action.category === 'mutation') {
        const mutationData = (response.data as Record<string, unknown>)[
            action.name.replace('list', '').replace('get', '')
        ] as Record<string, unknown>;
        // MutationError has 'message' field, success types have other fields
        if (
            mutationData &&
            'message' in mutationData &&
            !('post' in mutationData) &&
            !('idea' in mutationData) &&
            !('__typename' in mutationData)
        ) {
            return JSON.stringify({ error: (mutationData as { message: string }).message });
        }
    }

    // 4. Success — return data
    return JSON.stringify(response.data);
}
```

### File Structure

```
src/
  actions/
    registry.ts        — (existing) ActionDefinition interface, register/lookup/help
    queries.ts         — 6 query action definitions
    mutations.ts       — 3 mutation action definitions
  tools/
    use-buffer-api.ts  — Main tool: dispatch, build query, send, process response
    buffer-api-help.ts — Help tool: list/detail/error
  buffer-client.ts     — (existing) FetchEngine instance
  types.ts             — (existing) TypeScript interfaces
  index.ts             — MCP server setup, tool registration
```

---

## Action Summary Table

| Action                  | Category | Required Input                        | GraphQL Root         | Response Path                | Pagination   |
| ----------------------- | -------- | ------------------------------------- | -------------------- | ---------------------------- | ------------ |
| `listOrganizations`     | query    | (none)                                | `account`            | `data.account.organizations` | No           |
| `listChannels`          | query    | `organizationId`                      | `channels`           | `data.channels`              | No           |
| `getChannel`            | query    | `channelId`                           | `channel`            | `data.channel`               | No           |
| `listPosts`             | query    | `organizationId`                      | `posts`              | `data.posts`                 | Relay cursor |
| `getPost`               | query    | `postId`                              | `post`               | `data.post`                  | No           |
| `getDailyPostingLimits` | query    | `channelIds`                          | `dailyPostingLimits` | `data.dailyPostingLimits`    | No           |
| `createPost`            | mutation | `channelId`, `schedulingType`, `mode` | `createPost`         | `data.createPost`            | N/A          |
| `deletePost`            | mutation | `postId`                              | `deletePost`         | `data.deletePost`            | N/A          |
| `createIdea`            | mutation | `organizationId`, `content`           | `createIdea`         | `data.createIdea`            | N/A          |

---

## Schema Corrections Applied

All GraphQL templates incorporate corrections from real API testing (iteration 18):

1. `SchedulingType` uses `automatic`/`notification` (not `automatic_publishing`/`notification_publishing`)
2. `PostActionPayload` is `PostActionSuccess | MutationError` (not `VoidMutationError`)
3. `DeletePostPayload` is `DeletePostSuccess | MutationError` (not `NotFoundError`)
4. `first`/`after` are top-level args on `posts` query (not inside `input`)
5. Enum values are bare identifiers in GraphQL (not quoted strings)
