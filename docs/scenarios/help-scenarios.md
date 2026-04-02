# Help Scenarios

End-to-end usage scenarios for the `buffer_api_help` tool.
This tool provides discovery and documentation for all available `use_buffer_api` actions.
It takes optional `action` (string) and `category` (string) parameters.

---

## Scenario 1: List All Available Actions

**Goal:** User wants to see every available action in the Buffer MCP server.

**MCP Input:**

```json
{
    "action": undefined,
    "category": undefined
}
```

(Both parameters omitted.)

**Expected Response (markdown):**

```markdown
# Buffer API Actions

## Queries

### Organizations & Channels

- **listOrganizations** — List all organizations under the authenticated Buffer account
- **listChannels** — List all channels for an organization
- **getChannel** — Get detailed info about a specific channel by ID

### Posts

- **listPosts** — List posts for an organization with optional filters and pagination
- **getPost** — Get detailed info about a specific post by ID

### Limits

- **getDailyPostingLimits** — Check daily posting limits for specific channels

## Mutations

### Posts

- **createPost** — Create a new post (draft, queued, scheduled, or immediate)
- **deletePost** — Delete a post by ID

### Ideas

- **createIdea** — Create a new idea in an organization's idea board
```

**Notes:**

- Actions are grouped by category (`query` vs `mutation`), then by resource
- Each action shows name and one-line description
- No detailed parameter info at this level — user must request specific action for that

---

## Scenario 2: List Only Query Actions

**Goal:** User wants to see only read-only query actions.

**MCP Input:**

```json
{
    "category": "query"
}
```

**Expected Response (markdown):**

```markdown
# Buffer API Actions — Queries

- **listOrganizations** — List all organizations under the authenticated Buffer account
- **listChannels** — List all channels for an organization
- **getChannel** — Get detailed info about a specific channel by ID
- **listPosts** — List posts for an organization with optional filters and pagination
- **getPost** — Get detailed info about a specific post by ID
- **getDailyPostingLimits** — Check daily posting limits for specific channels
```

**Notes:**

- Filtered to only `category: "query"` actions
- Same format but without mutation section

---

## Scenario 3: List Only Mutation Actions

**Goal:** User wants to see only write/mutation actions.

**MCP Input:**

```json
{
    "category": "mutation"
}
```

**Expected Response (markdown):**

```markdown
# Buffer API Actions — Mutations

- **createPost** — Create a new post (draft, queued, scheduled, or immediate)
- **deletePost** — Delete a post by ID
- **createIdea** — Create a new idea in an organization's idea board
```

---

## Scenario 4: Get Help for a Specific Query Action

**Goal:** User wants detailed documentation for `listPosts` including parameters, types, and example.

**MCP Input:**

```json
{
    "action": "listPosts"
}
```

**Expected Response (markdown):**

````markdown
## listPosts

List posts for an organization with optional filters and pagination.

- **Category:** query

### Parameters

- **organizationId** (required): The organization ID to list posts for
- **first** (optional): Number of posts to return (default: 20)
- **after** (optional): Pagination cursor from a previous response's pageInfo.endCursor
- **filter** (optional): Filter criteria (status, channelIds, tagIds, dueAt, createdAt)

### Example Payload

```json
{
    "organizationId": "68425e79e5105cb6432cc10f",
    "first": 10,
    "after": "YnlJMk9UQXlPR0po..."
}
```
````

````

**Notes:**

- Parameters show required/optional based on Zod schema `.optional()` check
- Description comes from ActionDefinition.description
- Example payload comes from ActionDefinition.example
- Category shows whether this is a query or mutation

---

## Scenario 5: Get Help for a Mutation Action


**Goal:** User wants detailed documentation for `createPost`.

**MCP Input:**

```json
{
    "action": "createPost"
}
````

**Expected Response (markdown):**

````markdown
## createPost

Create a new post (draft, queued, scheduled, or immediate).

- **Category:** mutation

### Parameters

- **channelId** (required): The channel ID to post to
- **text** (required): The post text content
- **schedulingType** (required): Either "automatic" or "notification"
- **mode** (required): Share mode — "addToQueue", "shareNext", "shareNow", or "customScheduled"
- **saveToDraft** (optional): Set to true to save as draft instead of publishing
- **dueAt** (optional): ISO 8601 date for customScheduled mode
- **assets** (optional): Media attachments (images, videos)
- **tags** (optional): Array of tag IDs to apply

### Example Payload

```json
{
    "channelId": "690288cc669affb4c9915dda",
    "text": "Hello from the Buffer MCP!",
    "schedulingType": "automatic",
    "mode": "addToQueue"
}
```
````

````

---

## Scenario 6: Get Help for a Simple Action


**Goal:** User wants documentation for `deletePost` — a simple action with minimal parameters.

**MCP Input:**

```json
{
    "action": "deletePost"
}
````

**Expected Response (markdown):**

````markdown
## deletePost

Delete a post by ID.

- **Category:** mutation

### Parameters

- **postId** (required): The ID of the post to delete

### Example Payload

```json
{
    "postId": "69cde75f64c20531e4a8edfa"
}
```
````

````

---

## Scenario 7: Get Help for Unknown Action


**Goal:** User asks for help on an action that doesn't exist.

**MCP Input:**

```json
{
    "action": "updatePost"
}
````

**Expected Response (plain text):**

```
Unknown action "updatePost". Use buffer_api_help without arguments to see all available actions.
```

**Notes:**

- No `updatePost` mutation exists in the Buffer API
- Response is a single-line error message, not markdown
- Suggests using the tool without arguments to discover available actions

---

## Scenario 8: Get Help with Both Action and Category

**Goal:** User provides both `action` and `category` — action takes precedence.

**MCP Input:**

```json
{
    "action": "listChannels",
    "category": "mutation"
}
```

**Expected Response:** Same as requesting `listChannels` help directly (Scenario 4 pattern). The `category` filter is ignored when a specific action name is provided.

---

## Scenario 9: Get Help for Action Without Example

**Goal:** User requests help for an action that has no example payload defined.

**MCP Input:**

```json
{
    "action": "getDailyPostingLimits"
}
```

**Expected Response (markdown):**

```markdown
## getDailyPostingLimits

Check daily posting limits for specific channels.

- **Category:** query

### Parameters

- **channelIds** (required): Array of channel IDs to check limits for
- **date** (optional): ISO 8601 date to check (defaults to today)
```

**Notes:**

- No "Example Payload" section when `ActionDefinition.example` is undefined
- Parameters section still shows all fields from the Zod schema

---

## Summary of Help Tool Behavior

| Input                  | Behavior                                  |
| ---------------------- | ----------------------------------------- |
| No args                | List all actions grouped by category      |
| `category: "query"`    | List only query actions                   |
| `category: "mutation"` | List only mutation actions                |
| `action: "listPosts"`  | Detailed help for specific action         |
| `action: "unknown"`    | Error message suggesting discovery        |
| `action` + `category`  | Action takes precedence, category ignored |

**Output format:**

- Listing mode: Markdown with actions grouped by category, showing name + description
- Detail mode: Markdown with description, category, parameters (required/optional from Zod), and optional example payload
- Error mode: Plain text single-line message

**All 9 actions covered:**

| Action                  | Category | Description                                            |
| ----------------------- | -------- | ------------------------------------------------------ |
| `listOrganizations`     | query    | List all organizations under the authenticated account |
| `listChannels`          | query    | List all channels for an organization                  |
| `getChannel`            | query    | Get detailed info about a specific channel             |
| `listPosts`             | query    | List posts with optional filters and pagination        |
| `getPost`               | query    | Get detailed info about a specific post                |
| `getDailyPostingLimits` | query    | Check daily posting limits for channels                |
| `createPost`            | mutation | Create a new post                                      |
| `deletePost`            | mutation | Delete a post by ID                                    |
| `createIdea`            | mutation | Create a new idea                                      |
