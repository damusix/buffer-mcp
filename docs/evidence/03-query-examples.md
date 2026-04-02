# Buffer Query & Mutation Examples

All examples use the single GraphQL endpoint `https://api.buffer.com` with `POST` method
and `Authorization: Bearer YOUR_API_KEY` header. All values in examples are hardcoded
inline (no GraphQL `$variable` syntax used in docs).

## Queries

### 1. Get Organizations

Fetch all organizations belonging to the authenticated account.

```graphql
query GetOrganizations {
    account {
        organizations {
            id
            name
            ownerEmail
        }
    }
}
```

**Variables:** None
**Response shape:** `{ data: { account: { organizations: [{ id, name, ownerEmail }] } } }`

### 2. Get Channels

Fetch all channels for a given organization.

```graphql
query GetChannels {
    channels(input: { organizationId: "some_organization_id" }) {
        id
        name
        displayName
        service
        avatar
        isQueuePaused
    }
}
```

**Input fields:**

| Field          | Type   | Required | Notes            |
| -------------- | ------ | -------- | ---------------- |
| organizationId | String | yes      | MongoDB ObjectId |

**Response shape:** `{ data: { channels: [{ id, name, displayName, service, avatar, isQueuePaused }] } }`

**Note:** `channels` returns an array directly, NOT a Relay connection (no edges/nodes). Only `posts` uses Relay pagination.

### 3. Get Channel

Fetch a single channel by ID.

```graphql
query GetChannel {
    channel(input: { id: "some_channel_id" }) {
        id
        name
        displayName
        service
        avatar
        isQueuePaused
    }
}
```

**Input fields:**

| Field | Type   | Required | Notes      |
| ----- | ------ | -------- | ---------- |
| id    | String | yes      | Channel ID |

**Response shape:** `{ data: { channel: { id, name, displayName, service, avatar, isQueuePaused } } }`

### 4. Get Filtered Channels

Fetch channels with filter criteria.

```graphql
query GetChannels {
    channels(input: { organizationId: "some_organization_id", filter: { isLocked: false } }) {
        id
        name
        displayName
        service
        avatar
        isQueuePaused
    }
}
```

**Input fields:**

| Field           | Type    | Required | Notes                 |
| --------------- | ------- | -------- | --------------------- |
| organizationId  | String  | yes      |                       |
| filter.isLocked | Boolean | no       | Filter by lock status |

**Response shape:** Same as Get Channels.

### 5. Get Posts For Channels

Fetch posts for specific channels with status filtering and sorting.

```graphql
query GetPostsForChannels {
    posts(
        input: {
            organizationId: "some_organization_id"
            sort: [{ field: dueAt, direction: desc }, { field: createdAt, direction: desc }]
            filter: { status: sent, channelIds: ["some_channel_id"] }
        }
    ) {
        edges {
            node {
                id
                text
                createdAt
                channelId
            }
        }
    }
}
```

**Input fields:**

| Field             | Type        | Required | Notes                                                  |
| ----------------- | ----------- | -------- | ------------------------------------------------------ |
| organizationId    | String      | yes      |                                                        |
| filter.status     | PostStatus  | no       | `sent`, `scheduled`, etc. Can be single value or array |
| filter.channelIds | [String]    | no       | Array of channel IDs                                   |
| sort              | [SortInput] | no       | Array of `{ field, direction }`                        |
| sort[].field      | String      | -        | `dueAt`, `createdAt`                                   |
| sort[].direction  | String      | -        | `asc`, `desc`                                          |

**Response shape:** `{ data: { posts: { edges: [{ node: { id, text, createdAt, channelId } }] } } }`

**Note:** `posts` uses Relay-style connection with `edges.node` pattern.

**Note:** Status can appear as a single enum value (`status: sent`) or as an array (`status: [sent]`) — both forms appear across examples.

### 6. Get Paginated Posts

Fetch posts with cursor-based pagination.

```graphql
query GetPosts {
    posts(
        after: "id_to_start_after"
        first: 20
        input: {
            organizationId: "some_organization_id"
            filter: { status: [sent], channelIds: ["some_channel_id"] }
        }
    ) {
        pageInfo {
            startCursor
            endCursor
            hasNextPage
        }
        edges {
            node {
                id
                text
                createdAt
                channelId
            }
        }
    }
}
```

**Top-level pagination args:**

| Field | Type   | Required | Notes                                   |
| ----- | ------ | -------- | --------------------------------------- |
| after | String | no       | Cursor from previous pageInfo.endCursor |
| first | Int    | no       | Page size (20 in example)               |

**Input fields:** Same as Get Posts For Channels.

**PageInfo shape:**

| Field       | Type    | Notes                                               |
| ----------- | ------- | --------------------------------------------------- |
| startCursor | String  | Cursor of first item in page                        |
| endCursor   | String  | Cursor of last item — pass as `after` for next page |
| hasNextPage | Boolean | Whether more pages exist                            |

**Key pattern:** `after` and `first` are top-level query arguments, NOT inside the `input` object.

### 7. Get Scheduled Posts

Fetch posts scheduled for future publishing.

```graphql
query GetScheduledPosts {
    posts(
        input: {
            organizationId: "some_organization_id"
            sort: [{ field: dueAt, direction: asc }, { field: createdAt, direction: desc }]
            filter: { status: [scheduled] }
        }
    ) {
        edges {
            node {
                id
                text
                createdAt
            }
        }
    }
}
```

**Notes:**

- Sorted by `dueAt asc` (soonest first) makes sense for a queue view
- No `channelIds` filter = posts from ALL channels
- Status `[scheduled]` means queued posts not yet published

### 8. Get Posts With Assets

Fetch posts including their media assets with type-specific fields via inline fragments.

```graphql
query GetPostsWithAssets {
    posts(
        input: {
            organizationId: "some_organization_id"
            filter: { status: [sent], channelIds: ["some_channel_id"] }
        }
    ) {
        edges {
            node {
                id
                text
                createdAt
                channelId
                assets {
                    thumbnail
                    mimeType
                    source
                    ... on ImageAsset {
                        image {
                            altText
                            width
                            height
                        }
                    }
                }
            }
        }
    }
}
```

**Asset base fields (shared across all asset types):**

| Field     | Type   | Notes               |
| --------- | ------ | ------------------- |
| thumbnail | String | URL to thumbnail    |
| mimeType  | String | MIME type           |
| source    | String | Original source URL |

**ImageAsset-specific fields (via inline fragment):**

| Field         | Type   | Notes                      |
| ------------- | ------ | -------------------------- |
| image.altText | String | Alt text for accessibility |
| image.width   | Int    | Image width                |
| image.height  | Int    | Image height               |

**Key pattern:** Assets is a union/interface type. Use inline fragments (`... on ImageAsset`) for type-specific fields. Other asset types (video, document) likely exist per domain model but are not shown in examples.

## Mutations

### 9. Create Text Post

Create a basic text-only post.

```graphql
mutation CreatePost {
    createPost(
        input: {
            text: "Hello there, this is another one!"
            channelId: "some_channel_id"
            schedulingType: automatic
            mode: addToQueue
        }
    ) {
        ... on PostActionSuccess {
            post {
                id
                text
                assets {
                    id
                    mimeType
                }
            }
        }
        ... on MutationError {
            message
        }
    }
}
```

**Input fields:**

| Field          | Type           | Required | Notes                                                    |
| -------------- | -------------- | -------- | -------------------------------------------------------- |
| text           | String         | yes      | Post content                                             |
| channelId      | String         | yes      | Target channel                                           |
| schedulingType | SchedulingType | yes      | `automatic` or `notification`                            |
| mode           | PostMode       | yes      | `addToQueue`, `shareNext`, `shareNow`, `customScheduled` |

**Response union:** `PostActionSuccess | MutationError`

- `PostActionSuccess.post` — the created post with `{ id, text, assets }`
- `MutationError.message` — error description string

### 10. Create Image Post

Create a post with image attachment.

```graphql
mutation CreatePost {
    createPost(
        input: {
            text: "Hello there, this is another one!"
            channelId: "some_channel_id"
            schedulingType: automatic
            mode: addToQueue
            assets: { images: [{ url: "https://example.com/photo.jpg" }] }
        }
    ) {
        ... on PostActionSuccess {
            post {
                id
                text
                assets {
                    id
                    mimeType
                }
            }
        }
        ... on MutationError {
            message
        }
    }
}
```

**Additional input fields:**

| Field               | Type         | Required | Notes                      |
| ------------------- | ------------ | -------- | -------------------------- |
| assets.images       | [ImageInput] | no       | Array of image objects     |
| assets.images[].url | String       | yes      | URL of the image to attach |

**Key pattern:** Images are specified by URL, not uploaded directly. Buffer fetches and processes the image from the URL.

### 11. Create Scheduled Post

Create a post scheduled for a specific future time.

```graphql
mutation CreatePost {
    createPost(
        input: {
            text: "Hello there, this is another one!"
            channelId: "some_channel_id"
            schedulingType: automatic
            mode: customScheduled
            dueAt: "2026-03-26T10:28:47.545Z"
        }
    ) {
        ... on PostActionSuccess {
            post {
                id
                text
                assets {
                    id
                    mimeType
                }
            }
        }
        ... on MutationError {
            message
        }
    }
}
```

**Additional input fields:**

| Field | Type     | Required                        | Notes                     |
| ----- | -------- | ------------------------------- | ------------------------- |
| mode  | PostMode | yes                             | Must be `customScheduled` |
| dueAt | String   | yes (when mode=customScheduled) | ISO 8601 timestamp        |

**Key pattern:** When `mode` is `customScheduled`, `dueAt` is required. Other modes (`addToQueue`, `shareNow`, `shareNext`) don't use `dueAt`.

### 12. Create Idea

Create an idea for an organization.

```graphql
mutation CreateIdea {
    createIdea(
        input: {
            organizationId: "some_organization_id"
            content: {
                title: "New Idea from GraphQL API"
                text: "This is the text of the new idea created via the GraphQL API."
            }
        }
    ) {
        ... on Idea {
            id
            content {
                title
                text
            }
        }
    }
}
```

**Input fields:**

| Field          | Type   | Required | Notes               |
| -------------- | ------ | -------- | ------------------- |
| organizationId | String | yes      | Target organization |
| content.title  | String | yes      | Idea title          |
| content.text   | String | yes      | Idea body text      |

**Response:** Returns `Idea` directly via inline fragment (not a union with MutationError like createPost).

**Note:** Unlike `createPost`, `createIdea` does not show a `MutationError` branch in the docs. May still be possible — needs real API verification.

## Cross-Cutting Observations

### Query Patterns

1. **Two query shapes:** Direct return (`channels`, `channel`, `account`) vs Relay connection (`posts`)
2. **Input object pattern:** All queries use `input: { ... }` argument (not bare args)
3. **Pagination args are top-level:** `after` and `first` sit alongside `input`, not inside it
4. **Filter and sort are inside input:** `input: { filter: { ... }, sort: [ ... ] }`

### Mutation Patterns

1. **Union return types:** `createPost` returns `PostActionSuccess | MutationError`
2. **Inline fragments required:** Must use `... on TypeName` to select fields from union members
3. **No updatePost or deletePost:** Only `createPost` and `createIdea` mutations shown in examples
4. **Images by URL:** Assets are passed as URLs, not uploaded directly

### Missing from Examples (but exist per API reference)

- `deletePost` mutation (documented in domain model)
- `updatePost` mutation (NOT documented anywhere — may not exist)
- `updateIdea` / `deleteIdea` mutations (NOT documented)
- Querying Ideas (no query example shown)
- Video or document assets
- Tags/labeling
- Channel posting schedule configuration
- Post notes/comments

### Discrepancies to Verify

1. **Status field format:** Some examples use single value (`status: sent`), others use array (`status: [sent]`). Need to verify which is correct or if both work.
2. **createIdea response:** No `MutationError` branch shown — may be incomplete docs.
3. **No response examples:** None of the 12 pages include actual JSON response bodies. Response shapes must be inferred from the selection set or verified with real API calls.
