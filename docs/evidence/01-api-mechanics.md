# Buffer API Mechanics

## Authentication

**Method:** Bearer token in `Authorization` header.

```
Authorization: Bearer YOUR_TOKEN
```

**Endpoint:** `https://api.buffer.com` (all requests require auth).

**Obtaining a token:**

1. Log into Buffer account
2. Navigate to Settings → API
3. Create a new API key
4. Copy the generated key

**Scope:** Account-based, not organization-scoped. A single key grants access to ALL organizations and channels in the account. Use organization IDs in queries to target specific orgs.

**Expiration:** No documented expiration or refresh token mechanism.

**OAuth:** Listed as "coming soon" — not currently available.

**Error on missing/invalid token:** `401 Unauthorized` (but note: GraphQL always returns HTTP 200 — see Error Handling below; the 401 may be at the transport level before GraphQL processing).

**Security best practices:**

- Never commit keys to version control
- Never expose in client-side code
- Store in environment variables (e.g., `BUFFER_API_KEY`)
- Regenerate if compromised via Settings → API

## Rate Limits

**Dual-layer system:**

| Layer                                  | Limit          | Window     |
| -------------------------------------- | -------------- | ---------- |
| Third-party client + account           | 100 requests   | 15 minutes |
| Unknown/unauthenticated                | 50 requests    | 15 minutes |
| Account overall (all clients combined) | 2,000 requests | 15 minutes |

**Response headers:**

```
RateLimit-Limit: 1000
RateLimit-Remaining: 850
RateLimit-Reset: 2024-01-01T12:00:00.000Z
```

**429 response shape:**

```json
{
    "errors": [
        {
            "message": "Too many requests from this client. Please try again later.",
            "extensions": {
                "code": "RATE_LIMIT_EXCEEDED",
                "limitType": "CLIENT_ACCOUNT",
                "retryAfter": 900
            }
        }
    ]
}
```

`retryAfter` is in **seconds**.

### Query Complexity Limits

| Constraint         | Limit                 |
| ------------------ | --------------------- |
| Maximum query cost | 175,000 points        |
| Scalar field cost  | 1 point               |
| Object field cost  | 2 points              |
| Nesting multiplier | 1.5x per depth level  |
| Maximum depth      | 25 levels             |
| Maximum aliases    | 30 per query          |
| Maximum directives | 50 per query          |
| Maximum tokens     | 15,000 (parser-level) |

Complexity violation error: `"Query exceeds maximum allowed complexity. Please simplify your query."`

### FetchEngine Resilience Implications

- **Retry on 429:** Yes — use `retryAfter` from `extensions` (seconds).
- **Rate limit reset:** `RateLimit-Reset` header is an ISO timestamp.
- **Backoff:** Exponential backoff recommended for `RATE_LIMIT_EXCEEDED`.
- **Window:** 15 minutes — configure retry ceiling accordingly.
- **Complexity errors:** Not retryable — must simplify query.

## Error Handling

**Critical principle:** GraphQL always returns HTTP 200. Check the response body.

### Two Error Categories

**1. Typed Mutation Errors (user-fixable, in `data`):**

Mutations return union types. Error case returns a `MutationError` with `message`:

```json
{
    "data": {
        "createPost": {
            "message": "Text is required"
        }
    }
}
```

Specialized error types:

- `MutationError` — general mutation failure
- `InvalidInputError` — validation failures
- `LimitReachedError` — resource/quota constraints
- `VoidMutationError` — placeholder for forward compatibility

**Best practice:** Always include `... on MutationError { message }` in mutation fragments.

**2. Non-Recoverable Errors (system-level, in `errors` array):**

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

### Error Codes

| Code                  | Meaning                  | Retryable?              |
| --------------------- | ------------------------ | ----------------------- |
| `UNAUTHORIZED`        | Missing/invalid API key  | No — fix auth           |
| `FORBIDDEN`           | Insufficient permissions | No — check access       |
| `NOT_FOUND`           | Resource doesn't exist   | No — validate ID        |
| `UNEXPECTED`          | Server error             | Yes — retry with delay  |
| `RATE_LIMIT_EXCEEDED` | Too many requests        | Yes — wait `retryAfter` |

### FetchEngine Resilience Implications

- Check `errors` array on EVERY response, even HTTP 200.
- Retry only `UNEXPECTED` and `RATE_LIMIT_EXCEEDED`.
- Mutation errors in `data` are never retryable — they're validation issues.
- Log full request (query, variables) and full response for debugging.

## Pagination

**Pattern:** Cursor-based, Relay-style connections. Forward pagination only.

### Field Names

```graphql
{
    posts(first: 20, after: "cursor_string") {
        edges {
            node {
                id
                text
            }
        }
        pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
        }
    }
}
```

### Parameters

| Parameter | Purpose                                |
| --------- | -------------------------------------- |
| `first`   | Number of items to return (batch size) |
| `after`   | Cursor string — position to start from |

**Recommended page size:** 20–50 items. No documented maximum.

**`hasPreviousPage`:** Always `false` — forward pagination only.

**Cursors are opaque:** Do not parse them. Store and pass back as-is.

### Filtering

Paginated queries support filtering via `input.filter` with AND logic for multi-criteria filtering (e.g., status + channelIds).

### FetchEngine Resilience Implications

- Pagination is forward-only — no random access.
- Must store `endCursor` to fetch next page.
- Page size affects query complexity cost — larger pages = higher cost.
