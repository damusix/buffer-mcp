# Read Scenarios

End-to-end usage scenarios for every READ operation in the Buffer MCP server.
Each scenario defines the exact `use_buffer_api` input, the GraphQL query constructed,
and the expected response shape based on real evidence from `docs/evidence/real-response/`.

---

## Scenario 1: List Organizations

**Goal:** User wants to see all organizations under their Buffer account.

**MCP Input:**

```json
{
    "action": "listOrganizations",
    "payload": {}
}
```

**GraphQL Query Constructed:**

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

**Expected Response (from real evidence):**

```json
{
    "organizations": [
        {
            "id": "68425e79e5105cb6432cc10f",
            "name": "My Organization",
            "ownerEmail": "danilo+rbp@alonso.network",
            "channelCount": 3,
            "limits": {
                "channels": 3,
                "members": 0,
                "scheduledPosts": 10,
                "tags": 3,
                "ideas": 100,
                "ideaGroups": 3,
                "savedReplies": 1,
                "scheduledThreadsPerChannel": 1,
                "scheduledStoriesPerChannel": 2000,
                "generateContent": 5000
            }
        }
    ]
}
```

**Edge Cases:**

- Account with zero organizations returns `{ "organizations": [] }`
- Token is account-scoped — always returns ALL organizations for the account
- No pagination — organizations are always a flat array

---

## Scenario 2: List Channels for Organization

**Goal:** User wants to see all connected social media channels for a specific organization.

**MCP Input:**

```json
{
    "action": "listChannels",
    "payload": {
        "organizationId": "68425e79e5105cb6432cc10f"
    }
}
```

**GraphQL Query Constructed:**

```graphql
query {
    channels(input: { organizationId: "68425e79e5105cb6432cc10f" }) {
        id
        name
        displayName
        service
        type
        avatar
        timezone
        isDisconnected
        isLocked
        isQueuePaused
        organizationId
        serviceId
        createdAt
        updatedAt
        allowedActions
        scopes
        postingSchedule {
            day
            times
            paused
        }
    }
}
```

**Expected Response (from real evidence):**

```json
{
    "channels": [
        {
            "id": "68426341d6d25b49a128217b",
            "name": "robertsbluepools",
            "displayName": "robertsbluepools",
            "service": "instagram",
            "type": "business",
            "timezone": "America/Chicago",
            "isDisconnected": false,
            "isLocked": false,
            "isQueuePaused": false
        },
        {
            "id": "6842635dd6d25b49a1297181",
            "name": "Robert's Blue Pools",
            "displayName": "Robert's Blue Pools",
            "service": "facebook",
            "type": "page",
            "timezone": "America/Chicago",
            "isDisconnected": false,
            "isLocked": false,
            "isQueuePaused": false
        },
        {
            "id": "690288cc669affb4c9915dda",
            "name": "roberts-blue-pools",
            "displayName": "Robert's Blue Pools",
            "service": "linkedin",
            "type": "page",
            "timezone": "America/Chicago",
            "isDisconnected": false,
            "isLocked": false,
            "isQueuePaused": false
        }
    ]
}
```

**Edge Cases:**

- Organization with no channels returns `{ "channels": [] }`
- Returns direct array, NOT Relay connection — no pagination needed
- Invalid `organizationId` returns error (not empty array)
- Optional `filter` parameter supports `isLocked` (Boolean) and `product` (Product enum)

---

## Scenario 3: List Channels with Filter

**Goal:** User wants to see only unlocked channels.

**MCP Input:**

```json
{
    "action": "listChannels",
    "payload": {
        "organizationId": "68425e79e5105cb6432cc10f",
        "filter": {
            "isLocked": false
        }
    }
}
```

**GraphQL Query Constructed:**

```graphql
query {
    channels(input: { organizationId: "68425e79e5105cb6432cc10f", filter: { isLocked: false } }) {
        id
        name
        displayName
        service
        type
        timezone
        isDisconnected
        isLocked
        isQueuePaused
        organizationId
        postingSchedule {
            day
            times
            paused
        }
    }
}
```

**Expected Response:** Same shape as Scenario 2, filtered to only unlocked channels.

---

## Scenario 4: Get Single Channel

**Goal:** User wants detailed info about a specific channel by ID.

**MCP Input:**

```json
{
    "action": "getChannel",
    "payload": {
        "channelId": "68426341d6d25b49a128217b"
    }
}
```

**GraphQL Query Constructed:**

```graphql
query {
    channel(input: { id: "68426341d6d25b49a128217b" }) {
        id
        name
        displayName
        service
        type
        avatar
        timezone
        isDisconnected
        isLocked
        isQueuePaused
        organizationId
        serviceId
        createdAt
        updatedAt
        allowedActions
        scopes
        postingSchedule {
            day
            times
            paused
        }
    }
}
```

**Expected Response (from real evidence):**

```json
{
    "channel": {
        "id": "68426341d6d25b49a128217b",
        "name": "robertsbluepools",
        "displayName": "robertsbluepools",
        "service": "instagram",
        "type": "business",
        "avatar": "https://buffer-channel-avatars-bucket.s3.amazonaws.com/...",
        "timezone": "America/Chicago",
        "isDisconnected": false,
        "isLocked": false,
        "isQueuePaused": false,
        "organizationId": "68425e79e5105cb6432cc10f",
        "serviceId": "17841475398641280",
        "createdAt": "2025-06-06T03:40:49.321Z",
        "updatedAt": "2026-04-02T01:44:20.778Z",
        "allowedActions": [],
        "scopes": [
            "instagram_business_basic",
            "instagram_business_content_publish",
            "instagram_business_manage_insights",
            "instagram_business_manage_comments"
        ],
        "postingSchedule": [
            { "day": "mon", "times": ["07:10", "16:18"], "paused": false },
            { "day": "tue", "times": ["07:30", "16:18"], "paused": false }
        ]
    }
}
```

**Edge Cases:**

- Invalid channel ID returns GraphQL error (not null)
- Channel from another account returns unauthorized error

---

## Scenario 5: List Posts (Default Pagination)

**Goal:** User wants to list recent posts for an organization.

**MCP Input:**

```json
{
    "action": "listPosts",
    "payload": {
        "organizationId": "68425e79e5105cb6432cc10f"
    }
}
```

**GraphQL Query Constructed:**

```graphql
query {
    posts(first: 20, input: { organizationId: "68425e79e5105cb6432cc10f" }) {
        edges {
            node {
                id
                text
                status
                via
                schedulingType
                isCustomScheduled
                createdAt
                updatedAt
                dueAt
                sentAt
                channelId
                channelService
                ideaId
                externalLink
                sharedNow
                shareMode
                tags {
                    id
                    name
                    color
                }
                notes {
                    id
                    text
                    createdAt
                }
                assets {
                    id
                    type
                    mimeType
                    source
                    thumbnail
                    ... on ImageAsset {
                        image {
                            altText
                            width
                            height
                            isAnimated
                        }
                    }
                }
                author {
                    id
                    email
                    name
                }
                error
                allowedActions
            }
            cursor
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

**Expected Response (from real evidence):**

```json
{
    "posts": {
        "edges": [
            {
                "node": {
                    "id": "69028ba74f51d522ca05aeed",
                    "text": "...",
                    "status": "sent",
                    "via": "buffer",
                    "schedulingType": null,
                    "isCustomScheduled": false,
                    "createdAt": "2025-10-29T21:48:23.270Z",
                    "dueAt": "2025-10-30T21:58:00.000Z",
                    "sentAt": "2025-10-30T21:58:14.462Z",
                    "channelId": "68426341d6d25b49a128217b",
                    "channelService": "instagram",
                    "ideaId": null,
                    "externalLink": "https://www.instagram.com/p/DQcwVPuCLol/",
                    "shareMode": "addToQueue",
                    "tags": [],
                    "notes": [],
                    "assets": [
                        {
                            "id": null,
                            "type": "image",
                            "mimeType": "image/jpeg",
                            "source": "https://buffer-media-uploads.s3.amazonaws.com/...",
                            "thumbnail": "https://buffer-media-uploads.s3.amazonaws.com/...",
                            "image": {
                                "altText": "",
                                "width": 811,
                                "height": 811,
                                "isAnimated": false
                            }
                        }
                    ],
                    "author": {
                        "id": "68425e79e5105cb6432cc10d",
                        "email": "danilo+rbp@alonso.network",
                        "name": "danilo+rbp"
                    },
                    "error": null,
                    "allowedActions": [
                        "viewPost",
                        "sharePostLink",
                        "copyPostLink",
                        "updatePostTags",
                        "addPostNote",
                        "duplicatePost",
                        "updateShopGridLink"
                    ]
                },
                "cursor": "YnlJMk9UQXlPR0poTnpSbU5URmtOVEl5WTJFd05XRmxaV1Fp"
            }
        ],
        "pageInfo": {
            "hasNextPage": true,
            "hasPreviousPage": false,
            "startCursor": "YnlJMk9UQXlPR0poTnpSbU5URmtOVEl5WTJFd05XRmxaV1Fp",
            "endCursor": "YnlJMk9UQXlPR0poTmpFNU56Z3pObUZrT1dRd09USTBaR1Fp"
        }
    }
}
```

**Edge Cases:**

- No posts returns `{ "posts": { "edges": [], "pageInfo": { "hasNextPage": false, "hasPreviousPage": false } } }`
- Default `first` is 20 if not specified by the user
- Default sort is reverse-chronological (most recent first) — no explicit sort needed
- `sort` and `filter` args inside `input` caused HTTP 400 in real testing when used with certain field names — use with caution

---

## Scenario 6: List Posts with Pagination

**Goal:** User wants the next page of posts using a cursor from a previous response.

**MCP Input:**

```json
{
    "action": "listPosts",
    "payload": {
        "organizationId": "68425e79e5105cb6432cc10f",
        "after": "YnlJMk9UQXlPR0poTmpFNU56Z3pObUZrT1dRd09USTBaR1Fp",
        "first": 3
    }
}
```

**GraphQL Query Constructed:**

```graphql
query {
    posts(
        first: 3,
        after: "YnlJMk9UQXlPR0poTmpFNU56Z3pObUZrT1dRd09USTBaR1Fp",
        input: {
            organizationId: "68425e79e5105cb6432cc10f"
        }
    ) {
        edges {
            node { ... }
            cursor
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

**Expected Response:** Same structure as Scenario 5 but with the next page of results. `hasPreviousPage` will be `false` (observed in real evidence — may be a bug or forward-only pagination).

**Edge Cases:**

- Invalid cursor returns error
- Cursor from exhausted set returns empty edges with `hasNextPage: false`
- `first` and `after` are top-level GraphQL args, NOT inside the `input` object

---

## Scenario 7: List Posts with Status Filter

**Goal:** User wants to see only sent posts for a specific channel.

**MCP Input:**

```json
{
    "action": "listPosts",
    "payload": {
        "organizationId": "68425e79e5105cb6432cc10f",
        "filter": {
            "status": ["sent"],
            "channelIds": ["68426341d6d25b49a128217b"]
        }
    }
}
```

**GraphQL Query Constructed:**

```graphql
query {
    posts(
        first: 20,
        input: {
            organizationId: "68425e79e5105cb6432cc10f",
            filter: {
                status: [sent],
                channelIds: ["68426341d6d25b49a128217b"]
            }
        }
    ) {
        edges {
            node { ... }
            cursor
        }
        pageInfo {
            hasNextPage
            endCursor
        }
    }
}
```

**Expected Response:** Same structure as Scenario 5 but filtered to only sent posts on the Instagram channel.

**Known Issue:** In real testing (iteration 15), using `filter` and `sort` inline caused HTTP 400. The minimal query without filter/sort works. Filters may require specific field name syntax or GraphQL variables approach. Implementation should test this carefully.

**Edge Cases:**

- Valid PostStatus values: `draft`, `buffer`, `sent`, `failed` (confirmed from real data and docs)
- Multiple statuses can be passed as array: `["draft", "sent"]`
- Multiple channel IDs can filter across channels

---

## Scenario 8: List Posts with Date Filter

**Goal:** User wants posts due after a specific date.

**MCP Input:**

```json
{
    "action": "listPosts",
    "payload": {
        "organizationId": "68425e79e5105cb6432cc10f",
        "filter": {
            "dueAt": {
                "start": "2025-10-30T00:00:00.000Z"
            }
        }
    }
}
```

**GraphQL Query Constructed:**

```graphql
query {
    posts(
        first: 20,
        input: {
            organizationId: "68425e79e5105cb6432cc10f",
            filter: {
                dueAt: {
                    start: "2025-10-30T00:00:00.000Z"
                }
            }
        }
    ) {
        edges {
            node { ... }
            cursor
        }
        pageInfo {
            hasNextPage
            endCursor
        }
    }
}
```

**Edge Cases:**

- `DateTimeComparator` has `start` and `end` fields (both optional)
- ISO 8601 format required
- Can also filter by `createdAt` using same comparator shape

---

## Scenario 9: Get Single Post

**Goal:** User wants detailed info about a specific post by ID.

**MCP Input:**

```json
{
    "action": "getPost",
    "payload": {
        "postId": "69028ba74f51d522ca05aeed"
    }
}
```

**GraphQL Query Constructed:**

```graphql
query {
    post(input: { id: "69028ba74f51d522ca05aeed" }) {
        id
        text
        status
        via
        schedulingType
        isCustomScheduled
        createdAt
        updatedAt
        dueAt
        sentAt
        channelId
        channelService
        ideaId
        externalLink
        sharedNow
        shareMode
        tags {
            id
            name
            color
        }
        notes {
            id
            text
            createdAt
        }
        assets {
            id
            type
            mimeType
            source
            thumbnail
            ... on ImageAsset {
                image {
                    altText
                    width
                    height
                    isAnimated
                }
            }
        }
        author {
            id
            email
            name
        }
        error
        allowedActions
    }
}
```

**Expected Response (from real evidence):**

```json
{
    "post": {
        "id": "69028ba74f51d522ca05aeed",
        "text": "...",
        "status": "sent",
        "via": "buffer",
        "schedulingType": null,
        "isCustomScheduled": false,
        "createdAt": "2025-10-29T21:48:23.270Z",
        "updatedAt": "2026-04-02T01:44:21.448Z",
        "dueAt": "2025-10-30T21:58:00.000Z",
        "sentAt": "2025-10-30T21:58:14.462Z",
        "channelId": "68426341d6d25b49a128217b",
        "channelService": "instagram",
        "ideaId": null,
        "externalLink": "https://www.instagram.com/p/DQcwVPuCLol/",
        "sharedNow": false,
        "shareMode": "addToQueue",
        "tags": [],
        "notes": [],
        "assets": [...],
        "author": { "id": "...", "email": "...", "name": "..." },
        "error": null,
        "allowedActions": ["viewPost", "sharePostLink", ...]
    }
}
```

**Edge Cases:**

- Invalid post ID returns GraphQL error
- Post from another account returns unauthorized error
- `post` query exists in API reference but was not tested in Phase 4 — response shape inferred from `posts` query results

---

## Scenario 10: Get Daily Posting Limits

**Goal:** User wants to check posting limits for specific channels on a given date.

**MCP Input:**

```json
{
    "action": "getDailyPostingLimits",
    "payload": {
        "channelIds": ["68426341d6d25b49a128217b", "6842635dd6d25b49a1297181"]
    }
}
```

**GraphQL Query Constructed:**

```graphql
query {
    dailyPostingLimits(
        input: { channelIds: ["68426341d6d25b49a128217b", "6842635dd6d25b49a1297181"] }
    ) {
        channel {
            id
            name
            service
        }
        limit
        used
    }
}
```

**Expected Response (inferred from schema — not tested against real API):**

```json
{
    "dailyPostingLimits": [
        {
            "channel": {
                "id": "68426341d6d25b49a128217b",
                "name": "robertsbluepools",
                "service": "instagram"
            },
            "limit": 25,
            "used": 0
        },
        {
            "channel": {
                "id": "6842635dd6d25b49a1297181",
                "name": "Robert's Blue Pools",
                "service": "facebook"
            },
            "limit": 25,
            "used": 0
        }
    ]
}
```

**Edge Cases:**

- Optional `date` parameter (DateTime) — defaults to today if omitted
- Returns `[DailyPostingLimitStatus!]!` — direct array, no pagination
- At least one `channelId` is required
- This query was NOT tested in Phase 4 — response shape based on API reference only

---

## Scenario 11: List Posts with Tag Filter

**Goal:** User wants posts that have specific tags applied.

**MCP Input:**

```json
{
    "action": "listPosts",
    "payload": {
        "organizationId": "68425e79e5105cb6432cc10f",
        "filter": {
            "tagIds": ["TAG_ID_1"]
        }
    }
}
```

**GraphQL Query Constructed:**

```graphql
query {
    posts(
        first: 20,
        input: {
            organizationId: "68425e79e5105cb6432cc10f",
            filter: {
                tagIds: ["TAG_ID_1"]
            }
        }
    ) {
        edges {
            node { ... }
            cursor
        }
        pageInfo {
            hasNextPage
            endCursor
        }
    }
}
```

**Edge Cases:**

- No standalone Tags query exists — tags only appear as fields on Post objects
- Tags have `id` (TagId), `name` (String), `color` (String)
- `TagComparator` has `in` (array of TagIds) and `isEmpty` (Boolean) for advanced filtering
- Organization limits show max 3 tags for the current plan

---

## Summary of Read Actions

| Action                  | GraphQL Query                         | Input Required   | Returns               | Pagination         |
| ----------------------- | ------------------------------------- | ---------------- | --------------------- | ------------------ |
| `listOrganizations`     | `account { organizations { ... } }`   | none             | Array of Organization | No                 |
| `listChannels`          | `channels(input: { ... })`            | `organizationId` | Array of Channel      | No                 |
| `getChannel`            | `channel(input: { id: ... })`         | `channelId`      | Single Channel        | No                 |
| `listPosts`             | `posts(first, after, input: { ... })` | `organizationId` | Relay Connection      | Yes (cursor-based) |
| `getPost`               | `post(input: { id: ... })`            | `postId`         | Single Post           | No                 |
| `getDailyPostingLimits` | `dailyPostingLimits(input: { ... })`  | `channelIds`     | Array of Limit        | No                 |

**Key patterns:**

- Only `posts` uses Relay pagination — everything else is direct return
- `first` and `after` are top-level args for `posts`, NOT inside `input`
- `organizationId` is required for `listChannels` and `listPosts`
- No standalone queries exist for Tags or Ideas — tags appear on posts, ideas only via `createIdea` mutation
- No Campaign entity exists — Tags serve the categorization role
