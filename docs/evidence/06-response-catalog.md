# Response Catalog — Real API Evidence

Cross-references every query and mutation tested in Phase 4 with the exact GraphQL sent, representative response shapes, field types observed, and nullable fields. All data sourced from `docs/evidence/real-response/*.json`.

---

## Queries

### 1. Account → Organizations

**Script:** `tmp/test-connection.ts`

**GraphQL Sent:**

    query GetOrganizations {
        account {
            organizations {
                id
                name
                ownerEmail
            }
        }
    }

**HTTP Status:** 200

**Response Shape:**

    {
        "data": {
            "account": {
                "organizations": [
                    {
                        "id": "68425e79e5105cb6432cc10f",
                        "name": "My Organization",
                        "ownerEmail": "danilo+rbp@alonso.network"
                    }
                ]
            }
        }
    }

**Field Types Observed:**

| Field        | Type              | Nullable | Example                       |
| ------------ | ----------------- | -------- | ----------------------------- |
| `id`         | String (ObjectId) | No       | `"68425e79e5105cb6432cc10f"`  |
| `name`       | String            | No       | `"My Organization"`           |
| `ownerEmail` | String            | No       | `"danilo+rbp@alonso.network"` |

**Notes:**

- Direct return — not Relay pagination
- `organizations` is an array (account can have multiple orgs)
- Response wrapper: `data.account.organizations[]`

---

### 2. Account → Organizations (with Limits and Extended Fields)

**Script:** `tmp/test-campaigns.ts` (queries 1 and 3)

**GraphQL Sent (limits):**

    query GetOrgLimits {
        account {
            organizations {
                id
                name
                limits {
                    channels
                    members
                    scheduledPosts
                    tags
                    ideas
                    ideaGroups
                    savedReplies
                    generateContent
                }
            }
        }
    }

**GraphQL Sent (extended fields):**

    query GetOrgFields {
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
                    scheduledThreadsPerChannel
                    scheduledStoriesPerChannel
                    generateContent
                    tags
                    ideas
                    ideaGroups
                    savedReplies
                }
            }
        }
    }

**HTTP Status:** 200

**Response Shape (extended):**

    {
        "data": {
            "account": {
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
                            "scheduledThreadsPerChannel": 1,
                            "scheduledStoriesPerChannel": 2000,
                            "generateContent": 5000,
                            "tags": 3,
                            "ideas": 100,
                            "ideaGroups": 3,
                            "savedReplies": 1
                        }
                    }
                ]
            }
        }
    }

**Field Types Observed (limits):**

| Field                               | Type | Nullable | Example |
| ----------------------------------- | ---- | -------- | ------- |
| `limits.channels`                   | Int  | No       | `3`     |
| `limits.members`                    | Int  | No       | `0`     |
| `limits.scheduledPosts`             | Int  | No       | `10`    |
| `limits.scheduledThreadsPerChannel` | Int  | No       | `1`     |
| `limits.scheduledStoriesPerChannel` | Int  | No       | `2000`  |
| `limits.generateContent`            | Int  | No       | `5000`  |
| `limits.tags`                       | Int  | No       | `3`     |
| `limits.ideas`                      | Int  | No       | `100`   |
| `limits.ideaGroups`                 | Int  | No       | `3`     |
| `limits.savedReplies`               | Int  | No       | `1`     |
| `channelCount`                      | Int  | No       | `3`     |

---

### 3. Channels

**Script:** `tmp/test-channels.ts`

**GraphQL Sent:**

    query GetChannels {
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

**HTTP Status:** 200

**Response Shape:**

    {
        "data": {
            "channels": [
                {
                    "id": "68426341d6d25b49a128217b",
                    "name": "robertsbluepools",
                    "displayName": "robertsbluepools",
                    "service": "instagram",
                    "type": "business",
                    "avatar": "https://...",
                    "timezone": "America/Chicago",
                    "isDisconnected": false,
                    "isLocked": false,
                    "isQueuePaused": false,
                    "organizationId": "68425e79e5105cb6432cc10f",
                    "serviceId": "17841475398641280",
                    "createdAt": "2025-06-06T03:40:49.321Z",
                    "updatedAt": "2026-04-02T01:44:20.778Z",
                    "allowedActions": [],
                    "scopes": ["instagram_business_basic", ...],
                    "postingSchedule": [
                        { "day": "mon", "times": ["07:10", "16:18"], "paused": false },
                        ...
                    ]
                }
            ]
        }
    }

**Field Types Observed:**

| Field                      | Type                      | Nullable | Example                                                        |
| -------------------------- | ------------------------- | -------- | -------------------------------------------------------------- |
| `id`                       | String (ObjectId)         | No       | `"68426341d6d25b49a128217b"`                                   |
| `name`                     | String                    | No       | `"robertsbluepools"`                                           |
| `displayName`              | String                    | No       | `"robertsbluepools"`                                           |
| `service`                  | String (Service enum)     | No       | `"instagram"`, `"facebook"`, `"linkedin"`                      |
| `type`                     | String (ChannelType enum) | No       | `"business"`, `"page"`                                         |
| `avatar`                   | String (URL)              | No       | `"https://buffer-channel-avatars-bucket.s3.amazonaws.com/..."` |
| `timezone`                 | String (IANA timezone)    | No       | `"America/Chicago"`                                            |
| `isDisconnected`           | Boolean                   | No       | `false`                                                        |
| `isLocked`                 | Boolean                   | No       | `false`                                                        |
| `isQueuePaused`            | Boolean                   | No       | `false`                                                        |
| `organizationId`           | String (ObjectId)         | No       | `"68425e79e5105cb6432cc10f"`                                   |
| `serviceId`                | String                    | No       | `"17841475398641280"`, `"urn:li:organization:109538253"`       |
| `createdAt`                | String (ISO 8601)         | No       | `"2025-06-06T03:40:49.321Z"`                                   |
| `updatedAt`                | String (ISO 8601)         | No       | `"2026-04-02T01:44:20.778Z"`                                   |
| `allowedActions`           | String[]                  | No       | `[]` (empty for all channels observed)                         |
| `scopes`                   | String[]                  | No       | varies by platform (0-13 entries)                              |
| `postingSchedule`          | ScheduleV2[]              | No       | 7 entries, one per weekday                                     |
| `postingSchedule[].day`    | String (DayOfWeek)        | No       | `"mon"`                                                        |
| `postingSchedule[].times`  | String[]                  | No       | `["07:10", "16:18"]` (can be empty `[]`)                       |
| `postingSchedule[].paused` | Boolean                   | No       | `false`                                                        |

**Notes:**

- Direct array return — not Relay pagination
- Response wrapper: `data.channels[]`
- Input requires `organizationId` inside `input` object
- `allowedActions` was empty for all 3 channels — may need specific permissions
- `scopes` varies: Instagram has 4, LinkedIn has 13, Facebook has 0
- LinkedIn `serviceId` format: `"urn:li:organization:109538253"` (different from ObjectId pattern)

---

### 4. Posts (Relay Pagination)

**Script:** `tmp/test-posts.ts`

**GraphQL Sent (page 1):**

    query {
        posts(
            first: 3,
            input: { organizationId: "68425e79e5105cb6432cc10f" }
        ) {
            edges {
                node {
                    id text status via schedulingType isCustomScheduled
                    createdAt updatedAt dueAt sentAt
                    channelId channelService ideaId externalLink
                    sharedNow shareMode
                    tags { id name color }
                    notes { id text type }
                    assets {
                        id type mimeType source thumbnail
                        ... on ImageAsset { image { altText width height isAnimated } }
                        ... on VideoAsset { video { durationMs } }
                    }
                    author { id email name }
                    error { message }
                    allowedActions
                }
                cursor
            }
            pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
        }
    }

**GraphQL Sent (page 2):**

    Same query with added: after: "<endCursor from page 1>"

**HTTP Status:** 200

**Response Shape (single edge):**

    {
        "node": {
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
                "viewPost", "sharePostLink", "copyPostLink",
                "updatePostTags", "addPostNote", "duplicatePost",
                "updateShopGridLink"
            ]
        },
        "cursor": "YnlJMk9UQXlPR0poTnpSbU5URmtOVEl5WTJFd05XRmxaV1Fp"
    }

**PageInfo Shape:**

    {
        "hasNextPage": true,
        "hasPreviousPage": false,
        "startCursor": "YnlJMk9UQXlPR0poTnpSbU5URmtOVEl5WTJFd05XRmxaV1Fp",
        "endCursor": "YnlJMk9UQXlPR0poTmpFNU56Z3pObUZrT1dRd09USTBaR1Fp"
    }

**Field Types Observed (Post node):**

| Field               | Type                    | Nullable | Example                                         |
| ------------------- | ----------------------- | -------- | ----------------------------------------------- |
| `id`                | String (ObjectId)       | No       | `"69028ba74f51d522ca05aeed"`                    |
| `text`              | String                  | No       | `"..."`                                         |
| `status`            | String (PostStatus)     | No       | `"sent"`, `"draft"`                             |
| `via`               | String (PostVia)        | No       | `"buffer"`                                      |
| `schedulingType`    | String (SchedulingType) | **Yes**  | `null` for queue-scheduled                      |
| `isCustomScheduled` | Boolean                 | No       | `false`                                         |
| `createdAt`         | String (ISO 8601)       | No       | `"2025-10-29T21:48:23.270Z"`                    |
| `updatedAt`         | String (ISO 8601)       | No       | `"2026-04-02T01:44:21.448Z"`                    |
| `dueAt`             | String (ISO 8601)       | **Yes**  | `"2025-10-30T21:58:00.000Z"` or `null` (drafts) |
| `sentAt`            | String (ISO 8601)       | **Yes**  | `"2025-10-30T21:58:14.462Z"` or `null`          |
| `channelId`         | String (ObjectId)       | No       | `"68426341d6d25b49a128217b"`                    |
| `channelService`    | String (Service)        | No       | `"instagram"`, `"linkedin"`, `"facebook"`       |
| `ideaId`            | String (ObjectId)       | **Yes**  | `null` (all observed)                           |
| `externalLink`      | String (URL)            | **Yes**  | `"https://www.instagram.com/p/..."` or `null`   |
| `sharedNow`         | Boolean                 | No       | `false`                                         |
| `shareMode`         | String (ShareMode)      | No       | `"addToQueue"`                                  |
| `tags`              | Tag[]                   | No       | `[]` (empty for all observed)                   |
| `notes`             | Note[]                  | No       | `[]` (empty for all observed)                   |
| `assets`            | Asset[]                 | No       | `[]` or array of ImageAsset objects             |
| `author`            | Author                  | No       | `{ id, email, name }`                           |
| `error`             | PostError               | **Yes**  | `null` for successful posts                     |
| `allowedActions`    | String[]                | No       | 7 actions for sent, 10 for draft                |

**Asset (ImageAsset) Fields:**

| Field              | Type               | Nullable | Example                                               |
| ------------------ | ------------------ | -------- | ----------------------------------------------------- |
| `id`               | String             | **Yes**  | `null` (all observed)                                 |
| `type`             | String (AssetType) | No       | `"image"`                                             |
| `mimeType`         | String             | No       | `"image/jpeg"`                                        |
| `source`           | String (URL)       | No       | `"https://buffer-media-uploads.s3.amazonaws.com/..."` |
| `thumbnail`        | String (URL)       | No       | `"https://buffer-media-uploads.s3.amazonaws.com/..."` |
| `image.altText`    | String             | No       | `""` (empty string, not null)                         |
| `image.width`      | Int                | No       | `811`                                                 |
| `image.height`     | Int                | No       | `811`                                                 |
| `image.isAnimated` | Boolean            | No       | `false`                                               |

**Author Fields:**

| Field   | Type              | Nullable | Example                       |
| ------- | ----------------- | -------- | ----------------------------- |
| `id`    | String (ObjectId) | No       | `"68425e79e5105cb6432cc10d"`  |
| `email` | String            | No       | `"danilo+rbp@alonso.network"` |
| `name`  | String            | No       | `"danilo+rbp"`                |

**Pagination Notes:**

- `first` and `after` are top-level args — NOT inside `input` object
- `input` contains only `organizationId` (sort/filter caused HTTP 400 in testing)
- Cursors are base64-encoded opaque strings
- Default sort is reverse-chronological (most recent first)
- `hasPreviousPage` exists but was always `false` (forward-only pagination observed)

---

### 5. Posts with Tags and Notes

**Script:** `tmp/test-campaigns.ts` (query 2)

**GraphQL Sent:**

    query GetPostsWithTags {
        posts(
            input: { organizationId: "68425e79e5105cb6432cc10f" }
            first: 5
        ) {
            edges {
                node {
                    id text status
                    tags { id name color }
                    notes { id text createdAt }
                    ideaId
                }
            }
        }
    }

**HTTP Status:** 200

**Notes:**

- All 5 posts returned with `tags: []`, `notes: []`, `ideaId: null`
- Tag shape confirmed as `{ id, name, color }` (empty but schema accepted)
- Note shape with `createdAt` accepted (vs `type` in the posts query — both work)
- No real tag/note data exists on this account, but field structure is validated

---

## Mutations

### 6. createPost (Draft)

**Script:** `tmp/test-mutations.ts`

**GraphQL Sent:**

    mutation CreateDraft {
        createPost(input: {
            text: "MCP test draft — safe to delete",
            channelId: "690288cc669affb4c9915dda",
            schedulingType: automatic,
            mode: addToQueue,
            saveToDraft: true
        }) {
            ... on PostActionSuccess {
                post {
                    id text status via shareMode channelService channelId dueAt createdAt
                    tags { id name color }
                    notes { id text createdAt }
                    allowedActions
                }
            }
            ... on MutationError {
                message
            }
        }
    }

**HTTP Status:** 200

**Response Shape (success):**

    {
        "data": {
            "createPost": {
                "post": {
                    "id": "69cde772a6fd7aa9192de922",
                    "text": "MCP test draft — safe to delete",
                    "status": "draft",
                    "via": "buffer",
                    "shareMode": "addToQueue",
                    "channelService": "linkedin",
                    "channelId": "690288cc669affb4c9915dda",
                    "dueAt": null,
                    "createdAt": "2026-04-02T03:50:10.896Z",
                    "tags": [],
                    "notes": [],
                    "allowedActions": [
                        "addPostToQueue", "publishPostNow", "updatePost",
                        "publishPostNext", "updatePostSchedule", "updatePostTags",
                        "addPostNote", "duplicatePost", "deletePost", "updateShopGridLink"
                    ]
                }
            }
        }
    }

**Response Shape (MutationError — Instagram validation):**

    {
        "data": {
            "createPost": {
                "message": "Invalid post: Instagram posts require at least one image or video., Instagram posts require a type (post, story, or reel)."
            }
        }
    }

**Notes:**

- Success returns `data.createPost.post` (PostActionSuccess discriminated by presence of `post` field)
- MutationError returns `data.createPost.message` (discriminated by presence of `message` field)
- Both return HTTP 200 — must inspect response body to distinguish
- `saveToDraft: true` creates post with `status: "draft"` and `dueAt: null`
- Draft `allowedActions` includes 10 actions vs 7 for sent posts (adds `addPostToQueue`, `publishPostNow`, `updatePost`, `publishPostNext`, `updatePostSchedule`, `deletePost`)
- `schedulingType` and `mode` are bare enums in GraphQL (not quoted strings)

---

### 7. deletePost

**Script:** `tmp/test-mutations.ts`

**GraphQL Sent:**

    mutation DeleteDraft {
        deletePost(input: { id: "<postId>" }) {
            ... on DeletePostSuccess {
                __typename
            }
        }
    }

**HTTP Status:** 429 (rate limited before execution)

**Notes:**

- Delete was rate-limited before it could execute — no success response captured
- `DeletePostPayload` union confirmed to NOT include `NotFoundError` (GraphQL validation error proved this)
- Union is `DeletePostSuccess` only (possibly `| MutationError`)
- Input takes `id` field inside `input` object

---

## Error Responses

### 8. GraphQL Validation Error (Invalid Enum)

**Trigger:** Using `schedulingType: automatic_publishing` (incorrect enum value)

**HTTP Status:** 400

**Response Shape:**

    {
        "errors": [
            {
                "message": "Value \"automatic_publishing\" does not exist in \"SchedulingType\" enum.",
                "locations": [{ "line": 6, "column": 29 }],
                "extensions": { "code": "GRAPHQL_VALIDATION_FAILED" }
            }
        ]
    }

**Notes:**

- Correct values are `automatic` and `notification` (not `automatic_publishing` / `notification_publishing`)
- HTTP 400 (not 200) — one of the few cases Buffer returns non-200
- `extensions.code` is always `"GRAPHQL_VALIDATION_FAILED"` for schema validation errors
- `locations` array provides line/column for debugging

---

### 9. GraphQL Validation Error (Invalid Union Fragment)

**Trigger:** Using `... on VoidMutationError` on `PostActionPayload` or `... on NotFoundError` on `DeletePostPayload`

**HTTP Status:** 400

**Response Shape:**

    {
        "errors": [
            {
                "message": "Fragment cannot be spread here as objects of type \"PostActionPayload\" can never be of type \"VoidMutationError\".",
                "locations": [{ "line": 26, "column": 13 }],
                "extensions": { "code": "GRAPHQL_VALIDATION_FAILED" }
            },
            {
                "message": "Fragment cannot be spread here as objects of type \"DeletePostPayload\" can never be of type \"NotFoundError\".",
                "locations": [{ "line": 7, "column": 17 }],
                "extensions": { "code": "GRAPHQL_VALIDATION_FAILED" }
            }
        ]
    }

**Notes:**

- Multiple errors returned in single response (one per invalid fragment)
- Confirmed: `PostActionPayload = PostActionSuccess | MutationError` (no `VoidMutationError`)
- Confirmed: `DeletePostPayload = DeletePostSuccess` (no `NotFoundError`)
- Documentation reference page was wrong about these union types

---

### 10. Rate Limit Error

**Trigger:** Exceeding 100 requests per 15-minute window

**HTTP Status:** 429

**Response Shape:**

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

**Notes:**

- HTTP 429 (not 200) — another non-200 case
- `extensions.window` is `"15m"` — matches documented 15-minute window
- No `retryAfter` field observed in extensions (differs from docs which mention `retryAfter` in seconds)
- FetchEngine should handle 429 with exponential backoff

---

## Summary Table

| #   | Operation                        | Type     | Script             | HTTP | Pagination   | Response Path                                       |
| --- | -------------------------------- | -------- | ------------------ | ---- | ------------ | --------------------------------------------------- |
| 1   | account → organizations          | Query    | test-connection.ts | 200  | None         | `data.account.organizations[]`                      |
| 2   | account → organizations (limits) | Query    | test-campaigns.ts  | 200  | None         | `data.account.organizations[].limits`               |
| 3   | channels                         | Query    | test-channels.ts   | 200  | None (array) | `data.channels[]`                                   |
| 4   | posts                            | Query    | test-posts.ts      | 200  | Relay        | `data.posts.edges[].node`                           |
| 5   | posts (with tags/notes)          | Query    | test-campaigns.ts  | 200  | Relay        | `data.posts.edges[].node`                           |
| 6   | createPost                       | Mutation | test-mutations.ts  | 200  | N/A          | `data.createPost.post` or `data.createPost.message` |
| 7   | deletePost                       | Mutation | test-mutations.ts  | 429  | N/A          | Not captured (rate limited)                         |
| 8   | Enum validation error            | Error    | test-mutations.ts  | 400  | N/A          | `errors[].message`                                  |
| 9   | Union fragment error             | Error    | test-mutations.ts  | 400  | N/A          | `errors[].message`                                  |
| 10  | Rate limit exceeded              | Error    | test-mutations.ts  | 429  | N/A          | `errors[].extensions.code`                          |

---

## Queries NOT Tested in Phase 4

The following queries exist per documentation but were not tested with real API calls:

| Query                                              | Reason Not Tested                                                     | Input Shape (from docs)                      |
| -------------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------- |
| `channel(input: { id })`                           | Single channel by ID — low risk, shape inferred from `channels` query | `{ id: ChannelId }`                          |
| `post(input: { id })`                              | Single post by ID — shape inferred from posts query edges             | `{ id: PostId }`                             |
| `dailyPostingLimits(input: { channelIds, date? })` | Not critical path — response shape from docs only                     | `{ channelIds: [ChannelId], date?: String }` |

The following mutation was not tested:

| Mutation     | Reason Not Tested                                                 | Input Shape (from docs)                                   |
| ------------ | ----------------------------------------------------------------- | --------------------------------------------------------- |
| `createIdea` | Would consume API quota; schema corrections from createPost apply | `{ organizationId, content: { text?, media? }, tagIds? }` |

---

## Schema Corrections from Real Evidence

These corrections override documentation claims. Real API responses are authoritative.

| Claim in Docs                                                              | Reality (from real API)                                | Source                                 |
| -------------------------------------------------------------------------- | ------------------------------------------------------ | -------------------------------------- |
| `SchedulingType` values: `automatic_publishing`, `notification_publishing` | `automatic`, `notification`                            | mutations.json — enum validation error |
| `PostActionPayload` includes `VoidMutationError`                           | Only `PostActionSuccess \| MutationError`              | mutations.json — union fragment error  |
| `DeletePostPayload` includes `NotFoundError`                               | Only `DeletePostSuccess` (possibly `\| MutationError`) | mutations.json — union fragment error  |
| `retryAfter` in rate limit `extensions`                                    | Not observed — only `code` and `window`                | mutations.json — rate limit error      |
| `asset.id` always populated                                                | Can be `null`                                          | posts.json — all assets had `id: null` |
| `sort` and `filter` args on posts query                                    | Caused HTTP 400 when used inline                       | test-posts.ts — had to remove them     |
