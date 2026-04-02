# Error Scenarios

End-to-end usage scenarios for every error case in the Buffer MCP server.
Each scenario defines the input that triggers it and the exact error response shape
based on real evidence from `docs/evidence/real-response/mutations.json` and
`docs/evidence/01-api-mechanics.md`.

**Key principles:**

- GraphQL typically returns HTTP 200 — errors are in the response body
- Rate limit errors return HTTP 429 (exception to the 200 rule)
- GraphQL validation errors return HTTP 400
- Typed mutation errors appear in `data`, not `errors`
- System errors appear in `errors` array with `extensions.code`

---

## Scenario 1: Invalid or Missing Token (401)

**Goal:** User has not set `BUFFER_ACCESS_TOKEN` or the token is expired/invalid.

**MCP Input:**

```json
{
    "action": "listOrganizations",
    "payload": {}
}
```

**Expected Behavior:** The MCP server should fail fast before making any API call
if `BUFFER_ACCESS_TOKEN` is not set. If the token is set but invalid, the API returns
an unauthorized error.

**Response (missing env var):**

```json
{
    "error": "BUFFER_ACCESS_TOKEN environment variable is not set"
}
```

**Response (invalid token — from API):**

HTTP 200 with errors array:

```json
{
    "data": null,
    "errors": [
        {
            "message": "Not authorized",
            "extensions": {
                "code": "UNAUTHORIZED"
            }
        }
    ]
}
```

**MCP Tool Response:**

```json
{
    "error": "Not authorized (UNAUTHORIZED)"
}
```

**Notes:**

- `UNAUTHORIZED` is not retryable — user must fix token
- Error code from `extensions.code` is included for clarity

---

## Scenario 2: Rate Limit Exceeded (429)

**Goal:** User has exceeded the 100 requests per 15-minute window.

**MCP Input:** Any valid action — the error is transport-level.

```json
{
    "action": "listPosts",
    "payload": {
        "organizationId": "68425e79e5105cb6432cc10f"
    }
}
```

**API Response (real evidence from mutations.json):**

HTTP 429:

```json
{
    "errors": [
        {
            "message": "Too many requests from this client. Please try again later.",
            "extensions": {
                "code": "RATE_LIMIT_EXCEEDED",
                "window": "15m"
            }
        }
    ]
}
```

**MCP Tool Response:**

```json
{
    "error": "Rate limit exceeded. Please try again later. (window: 15m)"
}
```

**Notes:**

- HTTP 429 is an exception — GraphQL usually returns 200
- FetchEngine handles retry with exponential backoff automatically
- `retryAfter` may appear in extensions (in seconds) or as `RateLimit-Reset` header
- Real evidence shows `window: "15m"` in extensions, not `retryAfter`
- If all retries exhausted, the error surfaces to the MCP client

---

## Scenario 3: GraphQL Validation Error — Invalid Enum Value (400)

**Goal:** User passes an invalid enum value (e.g., wrong scheduling type).

**MCP Input:**

```json
{
    "action": "createPost",
    "payload": {
        "channelId": "690288cc669affb4c9915dda",
        "text": "Test post",
        "schedulingType": "automatic_publishing",
        "mode": "addToQueue"
    }
}
```

**Expected Behavior:** Zod validation should catch known invalid values before
the query is sent. If an unknown value slips through, the API returns HTTP 400.

**API Response (real evidence from mutations.json):**

HTTP 400:

```json
{
    "errors": [
        {
            "message": "Value \"automatic_publishing\" does not exist in \"SchedulingType\" enum.",
            "locations": [{ "line": 6, "column": 29 }],
            "extensions": {
                "code": "GRAPHQL_VALIDATION_FAILED"
            }
        }
    ]
}
```

**MCP Tool Response:**

```json
{
    "error": "GraphQL validation failed: Value \"automatic_publishing\" does not exist in \"SchedulingType\" enum."
}
```

**Notes:**

- HTTP 400 errors are not retryable
- Zod schemas should prevent most of these by validating enum values upfront
- `GRAPHQL_VALIDATION_FAILED` is the code for all structural query errors

---

## Scenario 4: GraphQL Validation Error — Invalid Union Fragment (400)

**Goal:** A query uses a fragment on a type that doesn't exist in the union.

**API Response (real evidence from mutations.json):**

HTTP 400:

```json
{
    "errors": [
        {
            "message": "Fragment cannot be spread here as objects of type \"PostActionPayload\" can never be of type \"VoidMutationError\".",
            "locations": [{ "line": 26, "column": 13 }],
            "extensions": {
                "code": "GRAPHQL_VALIDATION_FAILED"
            }
        }
    ]
}
```

**MCP Tool Response:**

```json
{
    "error": "GraphQL validation failed: Fragment cannot be spread here as objects of type \"PostActionPayload\" can never be of type \"VoidMutationError\"."
}
```

**Notes:**

- This is a developer-level error in the query template, not a user input error
- Real evidence confirmed `VoidMutationError` is NOT in `PostActionPayload` union
- Real evidence confirmed `NotFoundError` is NOT in `DeletePostPayload` union
- These corrections are baked into the action query templates to prevent this error

---

## Scenario 5: Mutation Validation Error — Platform Requirements (200)

**Goal:** User creates a post that violates platform-specific requirements
(e.g., Instagram requires media).

**MCP Input:**

```json
{
    "action": "createPost",
    "payload": {
        "channelId": "68426341d6d25b49a128217b",
        "text": "Text-only post on Instagram",
        "schedulingType": "automatic",
        "mode": "addToQueue"
    }
}
```

**API Response (real evidence from mutations.json):**

HTTP 200 (this is a typed mutation error, in `data`):

```json
{
    "data": {
        "createPost": {
            "message": "Invalid post: Instagram posts require at least one image or video., Instagram posts require a type (post, story, or reel)."
        }
    }
}
```

**MCP Tool Response:**

```json
{
    "error": "Invalid post: Instagram posts require at least one image or video., Instagram posts require a type (post, story, or reel)."
}
```

**Notes:**

- Typed mutation errors appear in `data`, NOT in `errors` array
- HTTP status is 200 — must check response body
- The response matches `... on MutationError { message }` fragment
- These errors are NOT retryable — user must fix the input
- Platform-specific rules: Instagram requires media + type; LinkedIn accepts text-only

---

## Scenario 6: Zod Input Validation Error (No API Call)

**Goal:** User provides invalid input that fails Zod schema validation before
any API call is made.

**MCP Input (missing required field):**

```json
{
    "action": "createPost",
    "payload": {
        "text": "Hello world"
    }
}
```

**Expected Behavior:** Zod validation fails because `channelId` is required.
No API call is made.

**MCP Tool Response:**

```json
{
    "error": "Validation error: channelId is required"
}
```

**MCP Input (wrong type):**

```json
{
    "action": "listPosts",
    "payload": {
        "organizationId": "68425e79e5105cb6432cc10f",
        "first": "not-a-number"
    }
}
```

**MCP Tool Response:**

```json
{
    "error": "Validation error: first must be a number"
}
```

**Notes:**

- Zod validation happens before GraphQL query construction
- Error messages come from Zod schema descriptions
- No API quota consumed on validation errors

---

## Scenario 7: Unknown Action Name

**Goal:** User calls `use_buffer_api` with an action name that doesn't exist.

**MCP Input:**

```json
{
    "action": "updatePost",
    "payload": {
        "postId": "abc123",
        "text": "Updated text"
    }
}
```

**Expected Behavior:** The action registry lookup fails. No API call is made.

**MCP Tool Response:**

```json
{
    "error": "Unknown action: updatePost. Use buffer_api_help to list available actions."
}
```

**Notes:**

- `updatePost` does not exist in the Buffer API — only `createPost` and `deletePost`
- The error message directs users to the help tool
- No API quota consumed

---

## Scenario 8: Resource Not Found (200)

**Goal:** User queries a specific resource with an ID that doesn't exist.

**MCP Input:**

```json
{
    "action": "getPost",
    "payload": {
        "postId": "000000000000000000000000"
    }
}
```

**API Response:**

HTTP 200 with null data:

```json
{
    "data": {
        "post": null
    }
}
```

**MCP Tool Response:**

```json
{
    "data": {
        "post": null
    }
}
```

**Notes:**

- GraphQL returns null for non-existent resources rather than an error
- HTTP status is 200 — this is normal GraphQL behavior
- The MCP tool passes through the null response transparently
- Alternatively, the API may return an errors array with `NOT_FOUND` code

**Alternate API Response (if error-style):**

```json
{
    "data": null,
    "errors": [
        {
            "message": "Resource not found",
            "extensions": {
                "code": "NOT_FOUND"
            }
        }
    ]
}
```

---

## Scenario 9: Network Timeout

**Goal:** The Buffer API is unreachable or times out.

**MCP Input:** Any valid action.

**Expected Behavior:** FetchEngine retries up to 3 times with exponential backoff.
After exhausting retries (45s total timeout), the error surfaces.

**MCP Tool Response:**

```json
{
    "error": "Request failed: The operation was aborted due to timeout"
}
```

**Notes:**

- FetchEngine config: 15s per attempt, 45s total, 3 retries
- Retryable status codes: 408, 429, 500, 502, 503, 504
- Exponential backoff between retries
- The `attempt()` wrapper catches the final error after all retries exhausted

---

## Scenario 10: Forbidden — Insufficient Permissions (200)

**Goal:** User tries to access a resource they don't have permission for.

**MCP Input:**

```json
{
    "action": "listChannels",
    "payload": {
        "organizationId": "someone-elses-org-id"
    }
}
```

**API Response:**

HTTP 200:

```json
{
    "data": null,
    "errors": [
        {
            "message": "You do not have access to this resource",
            "extensions": {
                "code": "FORBIDDEN"
            }
        }
    ]
}
```

**MCP Tool Response:**

```json
{
    "error": "You do not have access to this resource (FORBIDDEN)"
}
```

**Notes:**

- `FORBIDDEN` is not retryable — user needs different permissions
- Token is account-scoped, so this applies when targeting orgs the account can't access

---

## Scenario 11: Query Complexity Exceeded (200)

**Goal:** User constructs a query that exceeds the 175,000 point complexity limit.

**API Response:**

HTTP 200:

```json
{
    "data": null,
    "errors": [
        {
            "message": "Query exceeds maximum allowed complexity. Please simplify your query.",
            "extensions": {
                "code": "QUERY_TOO_COMPLEX"
            }
        }
    ]
}
```

**MCP Tool Response:**

```json
{
    "error": "Query exceeds maximum allowed complexity. Please simplify your query."
}
```

**Notes:**

- Not retryable — query must be simplified
- Complexity: scalar fields = 1pt, object fields = 2pt, 1.5x per nesting level
- Maximum depth: 25 levels, max aliases: 30, max directives: 50
- Our pre-built query templates should stay well within limits

---

## Summary Table

| #   | Error Type          | HTTP Status | Error Location       | Retryable  | Caught By              |
| --- | ------------------- | ----------- | -------------------- | ---------- | ---------------------- |
| 1   | Missing token       | N/A         | Pre-flight           | No         | Env var check          |
| 1   | Invalid token       | 200         | `errors[]`           | No         | Response check         |
| 2   | Rate limit          | 429         | `errors[]`           | Yes        | FetchEngine + response |
| 3   | Invalid enum        | 400         | `errors[]`           | No         | Zod + response         |
| 4   | Invalid fragment    | 400         | `errors[]`           | No         | Query templates        |
| 5   | Platform validation | 200         | `data`               | No         | Response check         |
| 6   | Zod validation      | N/A         | Pre-flight           | No         | Zod schema             |
| 7   | Unknown action      | N/A         | Pre-flight           | No         | Registry lookup        |
| 8   | Not found           | 200         | `data` or `errors[]` | No         | Response check         |
| 9   | Network timeout     | N/A         | Transport            | Yes (auto) | FetchEngine            |
| 10  | Forbidden           | 200         | `errors[]`           | No         | Response check         |
| 11  | Complexity exceeded | 200         | `errors[]`           | No         | Response check         |

### Error Handling Priority in `use_buffer_api`

1. Check action exists in registry (Scenario 7)
2. Validate payload with Zod schema (Scenario 6)
3. Check `BUFFER_ACCESS_TOKEN` is set (Scenario 1a)
4. Send request via FetchEngine with `attempt()` (Scenarios 2, 9)
5. Check `attempt()` error — network/timeout failures (Scenario 9)
6. Check HTTP status — 400 (Scenarios 3, 4), 429 (Scenario 2)
7. Check `errors` array in response body (Scenarios 1b, 10, 11)
8. Check for typed mutation errors in `data` (Scenario 5)
9. Return successful data
