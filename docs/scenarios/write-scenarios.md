# Write Scenarios

End-to-end usage scenarios for every WRITE operation in the Buffer MCP server.
Each scenario defines the exact `use_buffer_api` input, the GraphQL mutation constructed,
and the expected response shape based on real evidence from `docs/evidence/real-response/mutations.json`.

**Real API corrections applied:**

- `SchedulingType` enum uses `automatic` / `notification`, NOT `automatic_publishing` / `notification_publishing`
- `PostActionPayload` union is `PostActionSuccess | MutationError`, NOT `PostActionSuccess | VoidMutationError`
- `DeletePostPayload` does NOT include `NotFoundError` — only `DeletePostSuccess` (and possibly `MutationError`)

---

## Scenario 1: Create Text Post (Add to Queue)

**Goal:** User wants to create a text-only post and add it to the channel's publishing queue.

**MCP Input:**

```json
{
    "action": "createPost",
    "payload": {
        "channelId": "690288cc669affb4c9915dda",
        "text": "Hello there, this is a new post!",
        "schedulingType": "automatic",
        "mode": "addToQueue"
    }
}
```

**GraphQL Mutation Constructed:**

```graphql
mutation {
    createPost(
        input: {
            text: "Hello there, this is a new post!"
            channelId: "690288cc669affb4c9915dda"
            schedulingType: automatic
            mode: addToQueue
        }
    ) {
        ... on PostActionSuccess {
            post {
                id
                text
                status
                via
                shareMode
                channelId
                channelService
                dueAt
                createdAt
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
                allowedActions
            }
        }
        ... on MutationError {
            message
        }
    }
}
```

**Expected Response (from real evidence):**

```json
{
    "createPost": {
        "post": {
            "id": "69cde772a6fd7aa9192de922",
            "text": "Hello there, this is a new post!",
            "status": "draft",
            "via": "buffer",
            "shareMode": "addToQueue",
            "channelId": "690288cc669affb4c9915dda",
            "channelService": "linkedin",
            "dueAt": null,
            "createdAt": "2026-04-02T03:50:10.896Z",
            "tags": [],
            "notes": [],
            "allowedActions": [
                "addPostToQueue",
                "publishPostNow",
                "updatePost",
                "publishPostNext",
                "updatePostSchedule",
                "updatePostTags",
                "addPostNote",
                "duplicatePost",
                "deletePost",
                "updateShopGridLink"
            ]
        }
    }
}
```

**Edge Cases:**

- Post status starts as `"draft"` even when mode is `addToQueue` — transitions to `"buffer"` (queued) asynchronously
- `dueAt` is `null` for queue-scheduled posts — Buffer assigns the time from the posting schedule
- `schedulingType` and `mode` are enum values — must be passed WITHOUT quotes in GraphQL (e.g., `automatic` not `"automatic"`)
- LinkedIn accepts text-only posts; Instagram requires at least one image or video

---

## Scenario 2: Create Image Post

**Goal:** User wants to create a post with an image attachment.

**MCP Input:**

```json
{
    "action": "createPost",
    "payload": {
        "channelId": "68426341d6d25b49a128217b",
        "text": "Check out this amazing pool!",
        "schedulingType": "automatic",
        "mode": "addToQueue",
        "assets": {
            "images": [{ "url": "https://example.com/pool-photo.jpg" }]
        }
    }
}
```

**GraphQL Mutation Constructed:**

```graphql
mutation {
    createPost(
        input: {
            text: "Check out this amazing pool!"
            channelId: "68426341d6d25b49a128217b"
            schedulingType: automatic
            mode: addToQueue
            assets: { images: [{ url: "https://example.com/pool-photo.jpg" }] }
        }
    ) {
        ... on PostActionSuccess {
            post {
                id
                text
                status
                channelService
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
                allowedActions
            }
        }
        ... on MutationError {
            message
        }
    }
}
```

**Expected Response:**

```json
{
    "createPost": {
        "post": {
            "id": "NEW_POST_ID",
            "text": "Check out this amazing pool!",
            "status": "draft",
            "channelService": "instagram",
            "assets": [
                {
                    "id": null,
                    "type": "image",
                    "mimeType": "image/jpeg",
                    "source": "https://buffer-media-uploads.s3.amazonaws.com/...",
                    "thumbnail": "https://buffer-media-uploads.s3.amazonaws.com/...",
                    "image": {
                        "altText": "",
                        "width": 800,
                        "height": 600,
                        "isAnimated": false
                    }
                }
            ],
            "allowedActions": ["addPostToQueue", "publishPostNow", "deletePost", "..."]
        }
    }
}
```

**Edge Cases:**

- Instagram requires at least one image or video — text-only posts to Instagram return `MutationError`
- Images are passed by URL — Buffer fetches and processes them server-side
- Multiple images supported: `images: [{ url: "..." }, { url: "..." }]`
- `asset.id` may be `null` — observed in real data

---

## Scenario 3: Create Scheduled Post

**Goal:** User wants to create a post scheduled for a specific future date/time.

**MCP Input:**

```json
{
    "action": "createPost",
    "payload": {
        "channelId": "690288cc669affb4c9915dda",
        "text": "Scheduled post for next week",
        "schedulingType": "automatic",
        "mode": "customScheduled",
        "dueAt": "2026-04-10T14:00:00.000Z"
    }
}
```

**GraphQL Mutation Constructed:**

```graphql
mutation {
    createPost(
        input: {
            text: "Scheduled post for next week"
            channelId: "690288cc669affb4c9915dda"
            schedulingType: automatic
            mode: customScheduled
            dueAt: "2026-04-10T14:00:00.000Z"
        }
    ) {
        ... on PostActionSuccess {
            post {
                id
                text
                status
                dueAt
                shareMode
                channelService
                allowedActions
            }
        }
        ... on MutationError {
            message
        }
    }
}
```

**Expected Response:**

```json
{
    "createPost": {
        "post": {
            "id": "NEW_POST_ID",
            "text": "Scheduled post for next week",
            "status": "draft",
            "dueAt": "2026-04-10T14:00:00.000Z",
            "shareMode": "customScheduled",
            "channelService": "linkedin",
            "allowedActions": [
                "publishPostNow",
                "updatePost",
                "updatePostSchedule",
                "deletePost",
                "..."
            ]
        }
    }
}
```

**Edge Cases:**

- `dueAt` is REQUIRED when `mode` is `customScheduled` — omitting it returns `MutationError`
- `dueAt` must be ISO 8601 DateTime format
- `dueAt` must be in the future — past dates may return validation error
- Other modes (`addToQueue`, `shareNext`, `shareNow`) do NOT use `dueAt`

---

## Scenario 4: Create Post with Share Now

**Goal:** User wants to publish a post immediately.

**MCP Input:**

```json
{
    "action": "createPost",
    "payload": {
        "channelId": "690288cc669affb4c9915dda",
        "text": "Publishing right now!",
        "schedulingType": "automatic",
        "mode": "shareNow"
    }
}
```

**GraphQL Mutation Constructed:**

```graphql
mutation {
    createPost(
        input: {
            text: "Publishing right now!"
            channelId: "690288cc669affb4c9915dda"
            schedulingType: automatic
            mode: shareNow
        }
    ) {
        ... on PostActionSuccess {
            post {
                id
                text
                status
                sentAt
                shareMode
                channelService
                externalLink
                allowedActions
            }
        }
        ... on MutationError {
            message
        }
    }
}
```

**Expected Response:**

```json
{
    "createPost": {
        "post": {
            "id": "NEW_POST_ID",
            "text": "Publishing right now!",
            "status": "draft",
            "sentAt": null,
            "shareMode": "shareNow",
            "channelService": "linkedin",
            "externalLink": null,
            "allowedActions": ["..."]
        }
    }
}
```

**Edge Cases:**

- Post may initially return `status: "draft"` and transition to `"sent"` asynchronously
- `sentAt` and `externalLink` may be `null` until the post is actually published
- `shareNext` mode pushes the post to the front of the queue instead of immediate publish

---

## Scenario 5: Create Draft Post

**Goal:** User wants to save a post as a draft without scheduling it.

**MCP Input:**

```json
{
    "action": "createPost",
    "payload": {
        "channelId": "690288cc669affb4c9915dda",
        "text": "Work in progress, saving as draft",
        "schedulingType": "automatic",
        "mode": "addToQueue",
        "saveToDraft": true
    }
}
```

**GraphQL Mutation Constructed:**

```graphql
mutation {
    createPost(
        input: {
            text: "Work in progress, saving as draft"
            channelId: "690288cc669affb4c9915dda"
            schedulingType: automatic
            mode: addToQueue
            saveToDraft: true
        }
    ) {
        ... on PostActionSuccess {
            post {
                id
                text
                status
                dueAt
                shareMode
                allowedActions
            }
        }
        ... on MutationError {
            message
        }
    }
}
```

**Expected Response (from real evidence — this is what was tested):**

```json
{
    "createPost": {
        "post": {
            "id": "69cde772a6fd7aa9192de922",
            "text": "Work in progress, saving as draft",
            "status": "draft",
            "dueAt": null,
            "shareMode": "addToQueue",
            "allowedActions": [
                "addPostToQueue",
                "publishPostNow",
                "updatePost",
                "publishPostNext",
                "updatePostSchedule",
                "updatePostTags",
                "addPostNote",
                "duplicatePost",
                "deletePost",
                "updateShopGridLink"
            ]
        }
    }
}
```

**Edge Cases:**

- `saveToDraft: true` keeps the post in draft status — it won't be queued or published
- Draft posts have full `allowedActions` including `addPostToQueue`, `publishPostNow`, `deletePost`
- This is the safest mutation for testing — no actual social media publish occurs

---

## Scenario 6: Create Post with Tags

**Goal:** User wants to create a post with tags for categorization.

**MCP Input:**

```json
{
    "action": "createPost",
    "payload": {
        "channelId": "690288cc669affb4c9915dda",
        "text": "Tagged post for tracking",
        "schedulingType": "automatic",
        "mode": "addToQueue",
        "tagIds": ["TAG_ID_1", "TAG_ID_2"]
    }
}
```

**GraphQL Mutation Constructed:**

```graphql
mutation {
    createPost(
        input: {
            text: "Tagged post for tracking"
            channelId: "690288cc669affb4c9915dda"
            schedulingType: automatic
            mode: addToQueue
            tagIds: ["TAG_ID_1", "TAG_ID_2"]
        }
    ) {
        ... on PostActionSuccess {
            post {
                id
                text
                status
                tags {
                    id
                    name
                    color
                }
                allowedActions
            }
        }
        ... on MutationError {
            message
        }
    }
}
```

**Edge Cases:**

- `tagIds` is optional — posts without tags have `tags: []`
- Organization has a tag limit (3 for current plan) — exceeding may return error
- Tags must exist beforehand — there is no `createTag` mutation in the API

---

## Scenario 7: Delete Post

**Goal:** User wants to delete an existing post.

**MCP Input:**

```json
{
    "action": "deletePost",
    "payload": {
        "postId": "69cde772a6fd7aa9192de922"
    }
}
```

**GraphQL Mutation Constructed:**

```graphql
mutation {
    deletePost(input: { id: "69cde772a6fd7aa9192de922" }) {
        ... on DeletePostSuccess {
            __typename
        }
        ... on MutationError {
            message
        }
    }
}
```

**Expected Response (success):**

```json
{
    "deletePost": {
        "__typename": "DeletePostSuccess"
    }
}
```

**Expected Response (error — post not found or unauthorized):**

```json
{
    "deletePost": {
        "message": "Post not found or you do not have permission to delete it."
    }
}
```

**Edge Cases:**

- `DeletePostPayload` does NOT include `NotFoundError` — confirmed via real API validation error
- The union is `DeletePostSuccess | MutationError` (using `MutationError` as safe fallback)
- Deleting an already-deleted post likely returns `MutationError`
- Deleting a sent post removes it from Buffer but NOT from the social platform
- `deletePost` was rate-limited (429) during Phase 4 testing — not fully verified against real API

---

## Scenario 8: Create Idea

**Goal:** User wants to save a content idea for later use.

**MCP Input:**

```json
{
    "action": "createIdea",
    "payload": {
        "organizationId": "68425e79e5105cb6432cc10f",
        "content": {
            "title": "Pool Maintenance Tips",
            "text": "Share weekly pool maintenance tips to build engagement."
        }
    }
}
```

**GraphQL Mutation Constructed:**

```graphql
mutation {
    createIdea(
        input: {
            organizationId: "68425e79e5105cb6432cc10f"
            content: {
                title: "Pool Maintenance Tips"
                text: "Share weekly pool maintenance tips to build engagement."
            }
        }
    ) {
        ... on IdeaResponse {
            idea {
                id
                content {
                    title
                    text
                }
            }
        }
        ... on InvalidInputError {
            message
        }
        ... on LimitReachedError {
            message
        }
        ... on UnauthorizedError {
            message
        }
        ... on UnexpectedError {
            message
        }
    }
}
```

**Expected Response (success):**

```json
{
    "createIdea": {
        "idea": {
            "id": "NEW_IDEA_ID",
            "content": {
                "title": "Pool Maintenance Tips",
                "text": "Share weekly pool maintenance tips to build engagement."
            }
        }
    }
}
```

**Edge Cases:**

- Organization has an idea limit (100 for current plan) — exceeding returns `LimitReachedError`
- `CreateIdeaPayload` is a rich union with 5 types: `IdeaResponse`, `InvalidInputError`, `LimitReachedError`, `UnauthorizedError`, `UnexpectedError`
- There is NO `updateIdea` or `deleteIdea` mutation — ideas can only be created
- There is NO standalone query for ideas — they can only be created, not listed
- `content.title` and `content.text` are both optional per schema — but at least one should be provided
- Optional fields: `cta` (String), `group` (IdeaGroupInput), `templateId` (String)

---

## Scenario 9: Create Idea with Media

**Goal:** User wants to save an idea that includes media attachments.

**MCP Input:**

```json
{
    "action": "createIdea",
    "payload": {
        "organizationId": "68425e79e5105cb6432cc10f",
        "content": {
            "title": "Summer Promo",
            "text": "Share a summer pool party promotion",
            "media": [
                {
                    "url": "https://example.com/summer-pool.jpg",
                    "type": "image",
                    "alt": "Beautiful pool with summer decorations"
                }
            ]
        }
    }
}
```

**GraphQL Mutation Constructed:**

```graphql
mutation {
    createIdea(
        input: {
            organizationId: "68425e79e5105cb6432cc10f"
            content: {
                title: "Summer Promo"
                text: "Share a summer pool party promotion"
                media: [
                    {
                        url: "https://example.com/summer-pool.jpg"
                        type: image
                        alt: "Beautiful pool with summer decorations"
                    }
                ]
            }
        }
    ) {
        ... on IdeaResponse {
            idea {
                id
                content {
                    title
                    text
                }
            }
        }
        ... on InvalidInputError {
            message
        }
        ... on LimitReachedError {
            message
        }
    }
}
```

**Edge Cases:**

- `IdeaMediaInput` requires `url` (String!) and `type` (MediaType!) — `alt`, `thumbnailUrl`, `size`, `source` are optional
- `MediaType` values not fully documented — likely includes `image`, `video`
- Not tested against real API — response shape based on schema documentation

---

## Scenario 10: Create Post — Validation Error

**Goal:** Demonstrates what happens when a post fails validation (e.g., text-only to Instagram).

**MCP Input:**

```json
{
    "action": "createPost",
    "payload": {
        "channelId": "68426341d6d25b49a128217b",
        "text": "This will fail on Instagram",
        "schedulingType": "automatic",
        "mode": "addToQueue"
    }
}
```

**Expected Response (from real evidence):**

```json
{
    "createPost": {
        "message": "Invalid post: Instagram posts require at least one image or video., Instagram posts require a type (post, story, or reel)."
    }
}
```

**Notes:**

- This returns HTTP 200 with the `MutationError` branch — NOT a GraphQL error
- The `message` field contains comma-separated validation issues
- The response matches `... on MutationError { message }` — NOT `... on PostActionSuccess`
- Platform-specific validation rules vary by channel service

---

## Summary of Write Actions

| Action       | GraphQL Mutation                 | Required Input                        | Returns                                                                                          | Notes                                      |
| ------------ | -------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| `createPost` | `createPost(input: { ... })`     | `channelId`, `schedulingType`, `mode` | `PostActionSuccess \| MutationError`                                                             | `text` or `assets` needed for content      |
| `deletePost` | `deletePost(input: { id: ... })` | `postId`                              | `DeletePostSuccess \| MutationError`                                                             | Cannot undo; does not delete from platform |
| `createIdea` | `createIdea(input: { ... })`     | `organizationId`, `content`           | `IdeaResponse \| InvalidInputError \| LimitReachedError \| UnauthorizedError \| UnexpectedError` | No update/delete/list for ideas            |

**Key patterns:**

- All mutations return union types — inline fragments (`... on TypeName`) are required
- `schedulingType` valid values: `automatic`, `notification` (NOT `automatic_publishing`/`notification_publishing`)
- `mode` (ShareMode) valid values: `addToQueue`, `shareNext`, `shareNow`, `customScheduled`
- `dueAt` is required only when `mode` is `customScheduled`
- `saveToDraft: true` keeps the post as a draft without scheduling
- Enum values are passed WITHOUT quotes in GraphQL (e.g., `automatic` not `"automatic"`)
- Only 3 mutations exist: `createPost`, `deletePost`, `createIdea` — no update mutations
- No `updatePost`, `updateIdea`, or `deleteIdea` mutations are documented in the API
