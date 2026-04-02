# 05 — Consolidated Schema

Master reference for the Buffer GraphQL API. Cross-references evidence docs 01-04.
All fields, types, queries, mutations, enums, and inputs in one place.

---

## Endpoint & Auth

- **URL:** `https://api.buffer.com` (POST, GraphQL)
- **Auth:** `Authorization: Bearer <token>` header
- **Token scope:** Account-level (covers all orgs/channels)
- **Rate limits:** 100 req/15min per client+account, 2000 req/15min account-wide
- **Query complexity:** max 175,000 points, max depth 25, max aliases 30

---

## Custom Scalars

| Scalar           | Format           | Notes |
| ---------------- | ---------------- | ----- |
| `AccountId`      | MongoDB ObjectId |       |
| `ChannelId`      | MongoDB ObjectId |       |
| `DateTime`       | ISO 8601         |       |
| `DraftId`        | MongoDB ObjectId |       |
| `IdeaId`         | MongoDB ObjectId |       |
| `NoteId`         | MongoDB ObjectId |       |
| `OrganizationId` | MongoDB ObjectId |       |
| `PostId`         | MongoDB ObjectId |       |
| `TagId`          | MongoDB ObjectId |       |

---

## Queries

### `account`

- **Args:** none
- **Returns:** `Account!`
- **Shape:** direct return (no pagination)

```graphql
query {
    account {
        id
        email
        organizations {
            id
            name
            ownerEmail
        }
    }
}
```

### `channel`

- **Args:** `input: ChannelInput!`
- **Returns:** `Channel!`
- **Shape:** direct return

```graphql
query {
    channel(input: { id: "CHANNEL_ID" }) {
        id
        name
        service
    }
}
```

**ChannelInput:**

| Field | Type         | Required |
| ----- | ------------ | -------- |
| `id`  | `ChannelId!` | yes      |

### `channels`

- **Args:** `input: ChannelsInput!`
- **Returns:** `[Channel!]!`
- **Shape:** direct array (NOT Relay connection)

```graphql
query {
    channels(input: { organizationId: "ORG_ID", filter: { isLocked: false } }) {
        id
        name
        service
    }
}
```

**ChannelsInput:**

| Field            | Type                   | Required |
| ---------------- | ---------------------- | -------- |
| `organizationId` | `OrganizationId!`      | yes      |
| `filter`         | `ChannelsFiltersInput` | no       |

**ChannelsFiltersInput:**

| Field      | Type      | Required |
| ---------- | --------- | -------- |
| `isLocked` | `Boolean` | no       |
| `product`  | `Product` | no       |

### `post`

- **Args:** `input: PostInput!`
- **Returns:** `Post!`
- **Shape:** direct return
- **Note:** Not shown in example docs but exists in reference

```graphql
query {
    post(input: { id: "POST_ID" }) {
        id
        text
        status
    }
}
```

**PostInput:**

| Field | Type      | Required |
| ----- | --------- | -------- |
| `id`  | `PostId!` | yes      |

### `posts`

- **Args:** `input: PostsInput!`, `first: Int`, `after: String`
- **Returns:** `PostsResults!`
- **Shape:** Relay connection (edges/nodes/pageInfo)
- **IMPORTANT:** `first` and `after` are top-level args, NOT inside `input`

```graphql
query {
    posts(
        first: 20
        after: "CURSOR"
        input: {
            organizationId: "ORG_ID"
            filter: { status: [sent], channelIds: ["CHANNEL_ID"] }
            sort: [{ field: dueAt, direction: DESC }]
        }
    ) {
        edges {
            node {
                id
                text
                status
                dueAt
            }
            cursor
        }
        pageInfo {
            hasNextPage
            endCursor
        }
    }
}
```

**PostsInput:**

| Field            | Type                | Required |
| ---------------- | ------------------- | -------- |
| `organizationId` | `OrganizationId!`   | yes      |
| `filter`         | `PostsFiltersInput` | no       |
| `sort`           | `[PostSortInput!]`  | no       |

**PostsFiltersInput:**

| Field        | Type                 | Required |
| ------------ | -------------------- | -------- |
| `channelIds` | `[ChannelId!]`       | no       |
| `startDate`  | `DateTime`           | no       |
| `endDate`    | `DateTime`           | no       |
| `status`     | `[PostStatus!]`      | no       |
| `tags`       | `TagComparator`      | no       |
| `tagIds`     | `[TagId!]`           | no       |
| `dueAt`      | `DateTimeComparator` | no       |
| `createdAt`  | `DateTimeComparator` | no       |

**PostSortInput:**

| Field       | Type               | Required |
| ----------- | ------------------ | -------- |
| `field`     | `PostSortableKey!` | yes      |
| `direction` | `SortDirection!`   | yes      |

**TagComparator:**

| Field     | Type        | Required |
| --------- | ----------- | -------- |
| `in`      | `[TagId!]!` | yes      |
| `isEmpty` | `Boolean!`  | yes      |

**DateTimeComparator:**

| Field   | Type       | Required |
| ------- | ---------- | -------- |
| `start` | `DateTime` | no       |
| `end`   | `DateTime` | no       |

### `dailyPostingLimits`

- **Args:** `input: DailyPostingLimitsInput!`
- **Returns:** `[DailyPostingLimitStatus!]!`
- **Shape:** direct array
- **Note:** Not shown in example docs but exists in reference

**DailyPostingLimitsInput:**

| Field        | Type            | Required |
| ------------ | --------------- | -------- |
| `channelIds` | `[ChannelId!]!` | yes      |
| `date`       | `DateTime`      | no       |

---

## Mutations

### `createPost`

- **Args:** `input: CreatePostInput!`
- **Returns:** `PostActionPayload!` = `PostActionSuccess | VoidMutationError`

```graphql
mutation {
    createPost(
        input: {
            text: "Hello world"
            channelId: "CHANNEL_ID"
            schedulingType: automatic_publishing
            mode: addToQueue
        }
    ) {
        ... on PostActionSuccess {
            post {
                id
                text
                status
            }
        }
        ... on VoidMutationError {
            message
        }
    }
}
```

**CreatePostInput:**

| Field            | Type                | Required | Notes                              |
| ---------------- | ------------------- | -------- | ---------------------------------- |
| `channelId`      | `ChannelId!`        | yes      |                                    |
| `schedulingType` | `SchedulingType!`   | yes      |                                    |
| `mode`           | `ShareMode!`        | yes      |                                    |
| `text`           | `String`            | no       |                                    |
| `dueAt`          | `DateTime`          | no       | Required when mode=customScheduled |
| `ideaId`         | `IdeaId`            | no       |                                    |
| `draftId`        | `DraftId`           | no       |                                    |
| `metadata`       | `PostInputMetaData` | no       | Platform-specific options          |
| `tagIds`         | `[TagId!]`          | no       |                                    |
| `assets`         | `AssetsInput`       | no       |                                    |
| `source`         | `String`            | no       |                                    |
| `aiAssisted`     | `Boolean`           | no       |                                    |
| `saveToDraft`    | `Boolean`           | no       |                                    |

### `deletePost`

- **Args:** `input: DeletePostInput!`
- **Returns:** `DeletePostPayload!` = `DeletePostSuccess | NotFoundError`

```graphql
mutation {
    deletePost(input: { id: "POST_ID" }) {
        ... on DeletePostSuccess {
            __typename
        }
        ... on NotFoundError {
            message
        }
    }
}
```

**DeletePostInput:**

| Field | Type      | Required |
| ----- | --------- | -------- |
| `id`  | `PostId!` | yes      |

### `createIdea`

- **Args:** `input: CreateIdeaInput!`
- **Returns:** `CreateIdeaPayload!` = `IdeaResponse | InvalidInputError | LimitReachedError | UnauthorizedError | UnexpectedError`

```graphql
mutation {
    createIdea(
        input: { organizationId: "ORG_ID", content: { title: "My Idea", text: "Idea body text" } }
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

**CreateIdeaInput:**

| Field            | Type                | Required |
| ---------------- | ------------------- | -------- |
| `organizationId` | `ID!`               | yes      |
| `content`        | `IdeaContentInput!` | yes      |
| `cta`            | `String`            | no       |
| `group`          | `IdeaGroupInput`    | no       |
| `templateId`     | `String`            | no       |

**IdeaContentInput:**

| Field        | Type                | Required |
| ------------ | ------------------- | -------- |
| `title`      | `String`            | no       |
| `text`       | `String`            | no       |
| `media`      | `[IdeaMediaInput!]` | no       |
| `tags`       | `[TagInput!]`       | no       |
| `aiAssisted` | `Boolean`           | no       |
| `services`   | `[Service!]`        | no       |
| `date`       | `DateTime`          | no       |

**IdeaMediaInput:**

| Field          | Type                   | Required |
| -------------- | ---------------------- | -------- |
| `url`          | `String!`              | yes      |
| `alt`          | `String`               | no       |
| `thumbnailUrl` | `String`               | no       |
| `type`         | `MediaType!`           | yes      |
| `size`         | `Int`                  | no       |
| `source`       | `IdeaMediaSourceInput` | no       |

**IdeaGroupInput:**

| Field          | Type | Required |
| -------------- | ---- | -------- |
| `groupId`      | `ID` | no       |
| `placeAfterId` | `ID` | no       |

**TagInput:**

| Field   | Type      | Required |
| ------- | --------- | -------- |
| `id`    | `ID!`     | yes      |
| `name`  | `String!` | yes      |
| `color` | `String!` | yes      |

---

## Object Types

### Account

| Field           | Type               | Nullable | Notes                                     |
| --------------- | ------------------ | -------- | ----------------------------------------- |
| `id`            | `ID!`              | no       |                                           |
| `email`         | `String!`          | no       |                                           |
| `backupEmail`   | `String`           | yes      |                                           |
| `avatar`        | `String!`          | no       | URL                                       |
| `createdAt`     | `DateTime`         | yes      |                                           |
| `organizations` | `[Organization!]!` | no       | Accepts `filter: OrganizationFilterInput` |
| `timezone`      | `String`           | yes      |                                           |
| `name`          | `String`           | yes      |                                           |
| `preferences`   | `Preferences`      | yes      |                                           |
| `connectedApps` | `[ConnectedApp!]`  | yes      |                                           |

### Preferences

| Field                   | Type              | Nullable |
| ----------------------- | ----------------- | -------- |
| `timeFormat`            | `String`          | yes      |
| `startOfWeek`           | `String`          | yes      |
| `defaultScheduleOption` | `ScheduleOption!` | no       |

### ConnectedApp

| Field         | Type        | Nullable |
| ------------- | ----------- | -------- |
| `clientId`    | `ID!`       | no       |
| `userId`      | `ID!`       | no       |
| `name`        | `String!`   | no       |
| `description` | `String!`   | no       |
| `website`     | `String!`   | no       |
| `createdAt`   | `DateTime!` | no       |

### Organization

| Field          | Type                  | Nullable |
| -------------- | --------------------- | -------- |
| `id`           | `OrganizationId!`     | no       |
| `name`         | `String!`             | no       |
| `ownerEmail`   | `String!`             | no       |
| `channelCount` | `Int!`                | no       |
| `limits`       | `OrganizationLimits!` | no       |
| `members`      | `MemberConnection!`   | no       |

### OrganizationLimits

| Field                        | Type   | Nullable |
| ---------------------------- | ------ | -------- |
| `channels`                   | `Int!` | no       |
| `members`                    | `Int!` | no       |
| `scheduledPosts`             | `Int!` | no       |
| `scheduledThreadsPerChannel` | `Int!` | no       |
| `scheduledStoriesPerChannel` | `Int!` | no       |
| `generateContent`            | `Int!` | no       |
| `tags`                       | `Int!` | no       |
| `ideas`                      | `Int!` | no       |
| `ideaGroups`                 | `Int!` | no       |
| `savedReplies`               | `Int!` | no       |

### MemberConnection

| Field        | Type   | Nullable |
| ------------ | ------ | -------- |
| `totalCount` | `Int!` | no       |

### Channel

| Field                          | Type                     | Nullable | Notes                  |
| ------------------------------ | ------------------------ | -------- | ---------------------- |
| `id`                           | `ChannelId!`             | no       |                        |
| `name`                         | `String!`                | no       | Handle/username        |
| `displayName`                  | `String`                 | yes      |                        |
| `descriptor`                   | `String!`                | no       | Formatted service/type |
| `service`                      | `Service!`               | no       | Platform enum          |
| `type`                         | `ChannelType!`           | no       |                        |
| `avatar`                       | `String!`                | no       | URL                    |
| `organizationId`               | `OrganizationId!`        | no       |                        |
| `timezone`                     | `String!`                | no       |                        |
| `isDisconnected`               | `Boolean!`               | no       |                        |
| `isLocked`                     | `Boolean!`               | no       |                        |
| `isNew`                        | `Boolean!`               | no       |                        |
| `isQueuePaused`                | `Boolean!`               | no       |                        |
| `postingSchedule`              | `[ScheduleV2!]!`         | no       |                        |
| `showTrendingTopicSuggestions` | `Boolean!`               | no       |                        |
| `metadata`                     | `ChannelMetadata`        | yes      | Union type             |
| `products`                     | `[Product!]`             | yes      |                        |
| `serviceId`                    | `String!`                | no       | External platform ID   |
| `createdAt`                    | `DateTime!`              | no       |                        |
| `updatedAt`                    | `DateTime!`              | no       |                        |
| `allowedActions`               | `[ChannelAction!]!`      | no       |                        |
| `scopes`                       | `[String]!`              | no       |                        |
| `hasActiveMemberDevice`        | `Boolean!`               | no       |                        |
| `postingGoal`                  | `PostingGoal`            | yes      |                        |
| `externalLink`                 | `String`                 | yes      |                        |
| `linkShortening`               | `ChannelLinkShortening!` | no       |                        |
| `weeklyPostingLimit`           | `WeeklyPostingLimit`     | yes      | Deprecated             |

### ChannelLinkShortening

| Field       | Type                   | Nullable |
| ----------- | ---------------------- | -------- |
| `config`    | `LinkShorteningConfig` | yes      |
| `isEnabled` | `Boolean!`             | no       |

### ScheduleV2

| Field    | Type         | Nullable |
| -------- | ------------ | -------- |
| `day`    | `DayOfWeek!` | no       |
| `times`  | `[String!]!` | no       |
| `paused` | `Boolean!`   | no       |

### WeeklyPostingLimit

| Field       | Type   | Nullable |
| ----------- | ------ | -------- |
| `sent`      | `Int!` | no       |
| `scheduled` | `Int!` | no       |
| `limit`     | `Int!` | no       |

### PostingGoal

| Field            | Type                 | Nullable |
| ---------------- | -------------------- | -------- |
| `goal`           | `Int!`               | no       |
| `sentCount`      | `Int!`               | no       |
| `scheduledCount` | `Int!`               | no       |
| `status`         | `PostingGoalStatus!` | no       |
| `periodStart`    | `DateTime!`          | no       |
| `periodEnd`      | `DateTime!`          | no       |

### Post

| Field                | Type                  | Nullable | Notes                      |
| -------------------- | --------------------- | -------- | -------------------------- |
| `id`                 | `PostId!`             | no       |                            |
| `text`               | `String!`             | no       |                            |
| `status`             | `PostStatus!`         | no       |                            |
| `via`                | `PostVia!`            | no       | `buffer` or `api`          |
| `schedulingType`     | `SchedulingType`      | yes      | Null if created natively   |
| `isCustomScheduled`  | `Boolean!`            | no       |                            |
| `createdAt`          | `DateTime!`           | no       |                            |
| `updatedAt`          | `DateTime!`           | no       |                            |
| `dueAt`              | `DateTime`            | yes      | Scheduled time             |
| `sentAt`             | `DateTime`            | yes      | Actual send time           |
| `channelId`          | `ChannelId!`          | no       |                            |
| `channelService`     | `Service!`            | no       |                            |
| `channel`            | `Channel!`            | no       | Resolved object            |
| `ideaId`             | `IdeaId`              | yes      |                            |
| `author`             | `Author`              | yes      |                            |
| `externalLink`       | `String`              | yes      |                            |
| `metadata`           | `PostMetadata`        | yes      | Union type                 |
| `tags`               | `[Tag!]!`             | no       | Sorted by name asc         |
| `notes`              | `[Note!]!`            | no       |                            |
| `notificationStatus` | `NotificationStatus`  | yes      |                            |
| `error`              | `PostPublishingError` | yes      | Present when status=failed |
| `assets`             | `[Asset!]!`           | no       |                            |
| `allowedActions`     | `[PostAction!]!`      | no       |                            |
| `sharedNow`          | `Boolean!`            | no       |                            |
| `shareMode`          | `ShareMode!`          | no       |                            |

### PostsResults

| Field      | Type                  | Nullable |
| ---------- | --------------------- | -------- |
| `edges`    | `[PostsEdge!]`        | yes      |
| `pageInfo` | `PaginationPageInfo!` | no       |

### PostsEdge

| Field    | Type      | Nullable |
| -------- | --------- | -------- |
| `node`   | `Post!`   | no       |
| `cursor` | `String!` | no       |

### PaginationPageInfo

| Field             | Type       | Nullable |
| ----------------- | ---------- | -------- |
| `startCursor`     | `String`   | yes      |
| `endCursor`       | `String`   | yes      |
| `hasPreviousPage` | `Boolean!` | no       |
| `hasNextPage`     | `Boolean!` | no       |

### DailyPostingLimitStatus

| Field       | Type         | Nullable |
| ----------- | ------------ | -------- |
| `channelId` | `ChannelId!` | no       |
| `sent`      | `Int!`       | no       |
| `scheduled` | `Int!`       | no       |
| `limit`     | `Int`        | yes      |
| `isAtLimit` | `Boolean!`   | no       |

### Author

| Field       | Type         | Nullable |
| ----------- | ------------ | -------- |
| `id`        | `AccountId!` | no       |
| `email`     | `String!`    | no       |
| `avatar`    | `String!`    | no       |
| `isDeleted` | `Boolean!`   | no       |
| `name`      | `String`     | yes      |

### Tag

| Field      | Type       | Nullable |
| ---------- | ---------- | -------- |
| `id`       | `TagId!`   | no       |
| `color`    | `String!`  | no       |
| `name`     | `String!`  | no       |
| `isLocked` | `Boolean!` | no       |

### PublishingTag

| Field   | Type      | Nullable |
| ------- | --------- | -------- |
| `id`    | `ID!`     | no       |
| `color` | `String!` | no       |
| `name`  | `String!` | no       |

### Note

| Field            | Type             | Nullable |
| ---------------- | ---------------- | -------- |
| `id`             | `NoteId!`        | no       |
| `text`           | `String!`        | no       |
| `type`           | `NoteType!`      | no       |
| `author`         | `Author!`        | no       |
| `createdAt`      | `DateTime!`      | no       |
| `updatedAt`      | `DateTime`       | yes      |
| `allowedActions` | `[NoteAction!]!` | no       |

### PostPublishingError

| Field        | Type      | Nullable |
| ------------ | --------- | -------- |
| `message`    | `String!` | no       |
| `supportUrl` | `String`  | yes      |
| `rawError`   | `String`  | yes      |

### Annotation

| Field     | Type              | Nullable |
| --------- | ----------------- | -------- |
| `type`    | `AnnotationType!` | no       |
| `indices` | `[Int!]!`         | no       |
| `content` | `String!`         | no       |
| `text`    | `String!`         | no       |
| `url`     | `String!`         | no       |

### UserTag

| Field    | Type      | Nullable |
| -------- | --------- | -------- |
| `handle` | `String!` | no       |
| `x`      | `Float!`  | no       |
| `y`      | `Float!`  | no       |

### ThreadedPost

| Field            | Type             | Nullable |
| ---------------- | ---------------- | -------- |
| `text`           | `String!`        | no       |
| `assets`         | `[Asset!]!`      | no       |
| `linkAttachment` | `LinkAttachment` | yes      |

### ScrapedLink

| Field        | Type         | Nullable |
| ------------ | ------------ | -------- |
| `url`        | `String!`    | no       |
| `text`       | `String!`    | no       |
| `thumbnails` | `[String!]!` | no       |

### Idea

| Field            | Type           | Nullable | Notes                              |
| ---------------- | -------------- | -------- | ---------------------------------- |
| `id`             | `ID!`          | no       |                                    |
| `organizationId` | `ID!`          | no       |                                    |
| `content`        | `IdeaContent!` | no       |                                    |
| `groupId`        | `ID`           | yes      |                                    |
| `position`       | `Float`        | yes      |                                    |
| `createdAt`      | `Int!`         | no       | **Unix timestamp** (not DateTime!) |
| `updatedAt`      | `Int!`         | no       | **Unix timestamp** (not DateTime!) |

### IdeaContent

| Field        | Type                | Nullable |
| ------------ | ------------------- | -------- |
| `title`      | `String`            | yes      |
| `text`       | `String`            | yes      |
| `media`      | `[IdeaMedia!]`      | yes      |
| `tags`       | `[PublishingTag!]!` | no       |
| `aiAssisted` | `Boolean!`          | no       |
| `services`   | `[Service!]!`       | no       |
| `date`       | `DateTime`          | yes      |

### IdeaMedia

| Field          | Type              | Nullable |
| -------------- | ----------------- | -------- |
| `id`           | `ID!`             | no       |
| `url`          | `String!`         | no       |
| `alt`          | `String`          | yes      |
| `thumbnailUrl` | `String`          | yes      |
| `type`         | `MediaType!`      | no       |
| `size`         | `Int`             | yes      |
| `source`       | `IdeaMediaSource` | yes      |

### IdeaMediaSource

| Field       | Type      | Nullable |
| ----------- | --------- | -------- |
| `name`      | `String!` | no       |
| `id`        | `String`  | yes      |
| `author`    | `String`  | yes      |
| `authorUrl` | `String`  | yes      |

### IdeaResponse

| Field          | Type       | Nullable |
| -------------- | ---------- | -------- |
| `idea`         | `Idea`     | yes      |
| `refreshIdeas` | `Boolean!` | no       |

### PostActionSuccess

| Field  | Type    | Nullable |
| ------ | ------- | -------- |
| `post` | `Post!` | no       |

### DeletePostSuccess

Not documented with fields. Likely just `__typename`.

---

## Asset Types

### Asset (Interface)

| Field       | Type         | Nullable |
| ----------- | ------------ | -------- |
| `id`        | `ID`         | yes      |
| `type`      | `AssetType!` | no       |
| `mimeType`  | `String!`    | no       |
| `source`    | `String!`    | no       |
| `thumbnail` | `String!`    | no       |

### ImageAsset (implements Asset)

All Asset fields plus:

| Field   | Type             | Nullable |
| ------- | ---------------- | -------- |
| `image` | `ImageMetadata!` | no       |

### ImageMetadata

| Field               | Type         | Nullable |
| ------------------- | ------------ | -------- |
| `altText`           | `String!`    | no       |
| `width`             | `Int!`       | no       |
| `height`            | `Int!`       | no       |
| `isAnimated`        | `Boolean!`   | no       |
| `animatedThumbnail` | `String`     | yes      |
| `userTags`          | `[UserTag!]` | yes      |

### VideoAsset (implements Asset)

All Asset fields plus:

| Field   | Type             | Nullable |
| ------- | ---------------- | -------- |
| `video` | `VideoMetadata!` | no       |

### VideoMetadata

| Field                   | Type       | Nullable | Notes                                                   |
| ----------------------- | ---------- | -------- | ------------------------------------------------------- |
| `durationMs`            | `Int!`     | no       | **DISCREPANCY:** field name says ms, docs say "seconds" |
| `containerFormat`       | `String`   | yes      |                                                         |
| `videoCodec`            | `String`   | yes      |                                                         |
| `frameRate`             | `Int`      | yes      |                                                         |
| `videoBitRate`          | `Int`      | yes      | kbps                                                    |
| `audioCodec`            | `String`   | yes      |                                                         |
| `rotationDegree`        | `Int`      | yes      |                                                         |
| `isTranscodingRequired` | `Boolean!` | no       |                                                         |
| `isVideoProcessing`     | `Boolean!` | no       |                                                         |
| `width`                 | `Int!`     | no       |                                                         |
| `height`                | `Int!`     | no       |                                                         |
| `fileSize`              | `Int`      | yes      | bytes                                                   |

### DocumentAsset (implements Asset)

All Asset fields plus:

| Field      | Type                | Nullable |
| ---------- | ------------------- | -------- |
| `document` | `DocumentMetadata!` | no       |

### DocumentMetadata

| Field        | Type         | Nullable |
| ------------ | ------------ | -------- |
| `filesize`   | `Int`        | yes      |
| `numPages`   | `Int!`       | no       |
| `thumbnails` | `[String!]!` | no       |

### LinkAttachment

| Field         | Type         | Nullable |
| ------------- | ------------ | -------- |
| `url`         | `String!`    | no       |
| `expandedUrl` | `String`     | yes      |
| `text`        | `String!`    | no       |
| `thumbnails`  | `[String!]!` | no       |
| `thumbnail`   | `String`     | yes      |
| `title`       | `String!`    | no       |

---

## Asset Inputs

### AssetsInput

| Field       | Type                    | Required |
| ----------- | ----------------------- | -------- |
| `images`    | `[ImageAssetInput!]`    | no       |
| `videos`    | `[VideoAssetInput!]`    | no       |
| `documents` | `[DocumentAssetInput!]` | no       |
| `link`      | `LinkAssetInput`        | no       |

### ImageAssetInput

| Field          | Type                 | Required |
| -------------- | -------------------- | -------- |
| `url`          | `String!`            | yes      |
| `thumbnailUrl` | `String`             | no       |
| `metadata`     | `ImageMetadataInput` | no       |

### ImageMetadataInput

| Field               | Type                   | Required |
| ------------------- | ---------------------- | -------- |
| `altText`           | `String!`              | yes      |
| `animatedThumbnail` | `String`               | no       |
| `userTags`          | `[UserTagInput!]`      | no       |
| `dimensions`        | `ImageDimensionsInput` | no       |

### VideoAssetInput

| Field          | Type                 | Required |
| -------------- | -------------------- | -------- |
| `url`          | `String!`            | yes      |
| `thumbnailUrl` | `String`             | no       |
| `metadata`     | `VideoMetadataInput` | no       |

### VideoMetadataInput

| Field             | Type     | Required |
| ----------------- | -------- | -------- |
| `thumbnailOffset` | `Int`    | no       |
| `title`           | `String` | no       |

### DocumentAssetInput

| Field          | Type      | Required |
| -------------- | --------- | -------- |
| `url`          | `String!` | yes      |
| `title`        | `String!` | yes      |
| `thumbnailUrl` | `String!` | yes      |

### LinkAssetInput

| Field          | Type      | Required |
| -------------- | --------- | -------- |
| `url`          | `String!` | yes      |
| `title`        | `String`  | no       |
| `description`  | `String`  | no       |
| `thumbnailUrl` | `String`  | no       |

---

## Post Metadata Inputs (per-platform container)

### PostInputMetaData

| Field       | Type                              | Required | Notes                                 |
| ----------- | --------------------------------- | -------- | ------------------------------------- |
| `instagram` | `InstagramPostMetadataInput`      | no       |                                       |
| `facebook`  | `FacebookPostMetadataInput`       | no       |                                       |
| `linkedin`  | `LinkedInPostMetadataInput`       | no       |                                       |
| `twitter`   | `TwitterPostMetadataInput`        | no       |                                       |
| `pinterest` | `PinterestPostMetadataInput`      | no       |                                       |
| `google`    | `GoogleBusinessPostMetadataInput` | no       | Key is `google`, NOT `googleBusiness` |
| `youtube`   | `YoutubePostMetadataInput`        | no       |                                       |
| `mastodon`  | `MastodonPostMetadataInput`       | no       |                                       |
| `startPage` | `StartPagePostMetadataInput`      | no       |                                       |
| `threads`   | `ThreadsPostMetadataInput`        | no       |                                       |
| `bluesky`   | `BlueskyPostMetadataInput`        | no       |                                       |
| `tiktok`    | `TikTokPostMetadataInput`         | no       |                                       |

### InstagramPostMetadataInput

| Field               | Type                          | Required |
| ------------------- | ----------------------------- | -------- |
| `type`              | `PostType!`                   | yes      |
| `firstComment`      | `String`                      | no       |
| `link`              | `String`                      | no       |
| `geolocation`       | `InstagramGeolocationInput`   | no       |
| `shouldShareToFeed` | `Boolean!`                    | yes      |
| `stickerFields`     | `InstagramStickerFieldsInput` | no       |

### FacebookPostMetadataInput

| Field            | Type                         | Required |
| ---------------- | ---------------------------- | -------- |
| `type`           | `PostTypeFacebook!`          | yes      |
| `annotations`    | `[AnnotationInputFacebook!]` | no       |
| `linkAttachment` | `LinkAttachmentInput`        | no       |
| `firstComment`   | `String`                     | no       |

### LinkedInPostMetadataInput

| Field            | Type                         | Required |
| ---------------- | ---------------------------- | -------- |
| `annotations`    | `[AnnotationInputLinkedIn!]` | no       |
| `firstComment`   | `String`                     | no       |
| `linkAttachment` | `LinkAttachmentInput`        | no       |

### TwitterPostMetadataInput

| Field     | Type                   | Required |
| --------- | ---------------------- | -------- |
| `retweet` | `RetweetMetadataInput` | no       |
| `thread`  | `[ThreadedPostInput!]` | no       |

### PinterestPostMetadataInput

| Field            | Type      | Required |
| ---------------- | --------- | -------- |
| `title`          | `String`  | no       |
| `url`            | `String`  | no       |
| `boardServiceId` | `String!` | yes      |

### GoogleBusinessPostMetadataInput

| Field             | Type                                  | Required |
| ----------------- | ------------------------------------- | -------- |
| `type`            | `PostTypeGoogleBusiness!`             | yes      |
| `title`           | `String`                              | no       |
| `detailsOffer`    | `GoogleBusinessOfferMetaDataInput`    | no       |
| `detailsEvent`    | `GoogleBusinessEventMetaDataInput`    | no       |
| `detailsWhatsNew` | `GoogleBusinessWhatsNewMetaDataInput` | no       |

### YoutubePostMetadataInput

| Field               | Type             | Required |
| ------------------- | ---------------- | -------- |
| `title`             | `String!`        | yes      |
| `privacy`           | `YoutubePrivacy` | no       |
| `categoryId`        | `String!`        | yes      |
| `license`           | `YoutubeLicense` | no       |
| `notifySubscribers` | `Boolean`        | no       |
| `embeddable`        | `Boolean`        | no       |
| `madeForKids`       | `Boolean`        | no       |

### MastodonPostMetadataInput

| Field         | Type                   | Required |
| ------------- | ---------------------- | -------- |
| `thread`      | `[ThreadedPostInput!]` | no       |
| `spoilerText` | `String`               | no       |

### ThreadsPostMetadataInput

| Field            | Type                   | Required |
| ---------------- | ---------------------- | -------- |
| `type`           | `PostType`             | no       |
| `thread`         | `[ThreadedPostInput!]` | no       |
| `linkAttachment` | `LinkAttachmentInput`  | no       |
| `topic`          | `String`               | no       |
| `locationId`     | `String`               | no       |
| `locationName`   | `String`               | no       |

### BlueskyPostMetadataInput

| Field            | Type                   | Required |
| ---------------- | ---------------------- | -------- |
| `thread`         | `[ThreadedPostInput!]` | no       |
| `linkAttachment` | `LinkAttachmentInput`  | no       |

### TikTokPostMetadataInput

| Field   | Type     | Required |
| ------- | -------- | -------- |
| `title` | `String` | no       |

### StartPagePostMetadataInput

| Field  | Type     | Required |
| ------ | -------- | -------- |
| `link` | `String` | no       |

---

## Channel Metadata Types (union members)

| Type                     | Fields                                               |
| ------------------------ | ---------------------------------------------------- |
| `BlueskyMetadata`        | `serverUrl: String!`                                 |
| `FacebookMetadata`       | `locationData: LocationData`                         |
| `GoogleBusinessMetadata` | `locationData: LocationData`                         |
| `InstagramMetadata`      | `defaultToReminders: Boolean!`                       |
| `LinkedInMetadata`       | `shouldShowLinkedinAnalyticsRefreshBanner: Boolean!` |
| `MastodonMetadata`       | `serverUrl: String!`                                 |
| `PinterestMetadata`      | `boards: [PinterestBoard!]!`                         |
| `TiktokMetadata`         | `defaultToReminders: Boolean!`                       |
| `TwitterMetadata`        | `subscriptionType: String`                           |
| `YoutubeMetadata`        | `defaultToReminders: Boolean!`                       |

**Note:** No `ThreadsMetadata` exists — Threads has no channel-specific metadata.

### PinterestBoard

| Field         | Type      | Nullable |
| ------------- | --------- | -------- |
| `id`          | `String!` | no       |
| `serviceId`   | `String!` | no       |
| `name`        | `String!` | no       |
| `url`         | `String!` | no       |
| `description` | `String`  | yes      |
| `avatar`      | `String`  | yes      |

### LocationData

| Field             | Type     | Nullable |
| ----------------- | -------- | -------- |
| `location`        | `String` | yes      |
| `mapsLink`        | `String` | yes      |
| `googleAccountId` | `String` | yes      |

---

## Post Metadata Types (union members)

| Type                         | Key Fields                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------ |
| `BlueskyPostMetadata`        | type, annotations, thread, threadCount, linkAttachment                                           |
| `FacebookPostMetadata`       | type, annotations, linkAttachment, title, firstComment                                           |
| `GoogleBusinessPostMetadata` | type, title, annotations, details                                                                |
| `InstagramPostMetadata`      | firstComment, link, type, annotations, geolocation, shouldShareToFeed, stickerFields             |
| `LinkedInPostMetadata`       | type, annotations, firstComment, linkAttachment                                                  |
| `MastodonPostMetadata`       | type, annotations, thread, threadCount, spoilerText                                              |
| `PinterestPostMetadata`      | type, title, url, board, annotations                                                             |
| `StartPagePostMetadata`      | (fields not documented)                                                                          |
| `ThreadsPostMetadata`        | type, annotations, thread, threadCount, linkAttachment, topic, locationId, locationName          |
| `TiktokPostMetadata`         | (fields not documented beyond reference)                                                         |
| `TwitterPostMetadata`        | type, retweet, annotations, thread, threadCount                                                  |
| `YoutubePostMetadata`        | type, annotations, title, privacy, category, license, notifySubscribers, embeddable, madeForKids |

---

## Error Types

All implement `MutationError` interface with `message: String!`:

| Type                  | Used In                                      |
| --------------------- | -------------------------------------------- |
| `MutationError`       | General — base interface                     |
| `VoidMutationError`   | `PostActionPayload` (forward compat)         |
| `NotFoundError`       | `DeletePostPayload`                          |
| `InvalidInputError`   | `CreateIdeaPayload`                          |
| `LimitReachedError`   | `CreateIdeaPayload`                          |
| `UnauthorizedError`   | `CreateIdeaPayload`                          |
| `UnexpectedError`     | `CreateIdeaPayload`                          |
| `RestProxyError`      | Referenced in error docs                     |
| `PostPublishingError` | On `Post.error` field (not a mutation error) |

---

## Enums (Complete)

### Fully documented values

| Enum                     | Values                                                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `Service`                | `twitter`, `facebook`, `instagram`, `linkedin`, `pinterest`, `youtube`, `tiktok`, `mastodon`, `bluesky`, `threads`, `googleBusiness` |
| `ChannelType`            | `Profile`, `Page`, `Business`, `Group`, `Account`                                                                                    |
| `DayOfWeek`              | `mon`, `tue`, `wed`, `thu`, `fri`, `sat`, `sun`                                                                                      |
| `PostStatus`             | `draft`, `buffer`, `sent`, `failed`                                                                                                  |
| `ShareMode`              | `addToQueue`, `shareNext`, `shareNow`, `customScheduled`                                                                             |
| `SchedulingType`         | `notification_publishing`, `automatic_publishing`                                                                                    |
| `PostVia`                | `buffer`, `api`                                                                                                                      |
| `NotificationStatus`     | `notified`, `markedAsPublished`                                                                                                      |
| `SortDirection`          | `ASC`, `DESC`                                                                                                                        |
| `AssetType`              | `IMAGE`, `VIDEO`, `DOCUMENT`, `LINK`, `GIF`                                                                                          |
| `MediaType`              | `image`, `video`, `gif`, `link`, `document`, `unsupported`                                                                           |
| `AnnotationType`         | `HASHTAG`, `MENTION`, `URL`                                                                                                          |
| `PostType`               | `post`, `story`, `reel`                                                                                                              |
| `PostTypeFacebook`       | `post`, `story`, `reel`                                                                                                              |
| `PostTypeGoogleBusiness` | `post`, `offer`, `event`, `whatsNew`                                                                                                 |
| `YoutubePrivacy`         | `public`, `private`, `unlisted`                                                                                                      |
| `YoutubeLicense`         | `youtube`, `creativeCommon`                                                                                                          |
| `Product`                | `buffer`                                                                                                                             |

### Incompletely documented (values unknown)

| Enum                           | Context                              | Known Values                         |
| ------------------------------ | ------------------------------------ | ------------------------------------ |
| `ScheduleOption`               | `Preferences.defaultScheduleOption`  | none listed                          |
| `OrganizationAction`           | Not referenced in queries            | none listed                          |
| `ChannelAction`                | `Channel.allowedActions`             | `publishStartPage`                   |
| `PostAction`                   | `Post.allowedActions`                | none listed                          |
| `NoteAction`                   | `Note.allowedActions`                | none listed                          |
| `NoteType`                     | `Note.type`                          | none listed                          |
| `PostingGoalStatus`            | `PostingGoal.status`                 | none listed                          |
| `PostSortableKey`              | `PostSortInput.field`                | `dueAt`, `createdAt` (from examples) |
| `GoogleBusinessPostActionType` | `GoogleBusinessEventMetaData.button` | none listed                          |
| `YoutubeCategory`              | `YoutubePostMetadata.category`       | none listed                          |

---

## Discrepancies Between Evidence Sources

1. **SchedulingType values:** Examples use `automatic` and `notification` (doc 03), but reference uses `automatic_publishing` and `notification_publishing` (doc 04). **Reference likely correct** — examples may show shorthand. Needs real API verification.

2. **PostStatus `approval` value:** Domain model (doc 02) lists 5 values including `approval`. Reference (doc 04) lists only 4: `draft`, `buffer`, `sent`, `failed`. The `approval` status may be valid but unlisted in the enum, or may only apply to team workflow features.

3. **Status filter format:** Examples show both `status: sent` (single) and `status: [sent]` (array). The `PostsFiltersInput` type defines `status: [PostStatus!]` (array). **Array is the correct type** — single values may be GraphQL coercion.

4. **VideoMetadata.durationMs:** Field name says milliseconds, docs description says "seconds". Needs real API verification.

5. **PostInputMetaData.google key:** The key is `google`, but the `Service` enum value is `googleBusiness`. This is an intentional naming difference in the API.

6. **createIdea response in examples vs reference:** Examples (doc 03) show `... on Idea` directly. Reference (doc 04) shows `CreateIdeaPayload = IdeaResponse | errors`. The correct shape is `... on IdeaResponse { idea { ... } }`, not `... on Idea { ... }` directly. **Reference likely correct.**

7. **PostActionPayload union:** Reference shows `PostActionSuccess | VoidMutationError`. Examples show `PostActionSuccess | MutationError`. These are different types — `VoidMutationError` has the same shape but is a forward-compat type. Both have `message: String!`. **Use both in inline fragments to be safe.**

8. **No updatePost mutation:** Confirmed across all 4 evidence docs. Only create and delete exist for posts.

9. **No query for Ideas:** No `ideas` or `idea` query documented. Ideas can only be created (via mutation) and referenced (via `Post.ideaId`). **This severely limits idea-related read operations.**

10. **ThreadedPostInput and LinkAttachmentInput:** Referenced in multiple metadata inputs but never fully defined. Likely mirror their output counterparts (`ThreadedPost` and `LinkAttachment`).

---

## Entity Relationship Summary

```
Account (1)
└── organizations (many) → Organization
    ├── channels (many, via channels query) → Channel
    │   ├── posts (many, via posts query) → Post
    │   │   ├── assets (many) → Asset (ImageAsset | VideoAsset | DocumentAsset)
    │   │   ├── tags (many) → Tag
    │   │   ├── notes (many) → Note
    │   │   ├── metadata (one) → PostMetadata (platform-specific union)
    │   │   └── author (one) → Author
    │   ├── metadata (one) → ChannelMetadata (platform-specific union)
    │   └── postingSchedule (many) → ScheduleV2
    └── ideas (many, via createIdea only) → Idea
        └── content (one) → IdeaContent
            ├── media (many) → IdeaMedia
            └── tags (many) → PublishingTag
```

---

## API Operations Summary

| Operation            | Type     | Input                           | Output                        | Pagination  |
| -------------------- | -------- | ------------------------------- | ----------------------------- | ----------- |
| `account`            | query    | none                            | `Account!`                    | no          |
| `channel`            | query    | `ChannelInput!`                 | `Channel!`                    | no          |
| `channels`           | query    | `ChannelsInput!`                | `[Channel!]!`                 | no (array)  |
| `post`               | query    | `PostInput!`                    | `Post!`                       | no          |
| `posts`              | query    | `PostsInput!` + `first`/`after` | `PostsResults!`               | yes (Relay) |
| `dailyPostingLimits` | query    | `DailyPostingLimitsInput!`      | `[DailyPostingLimitStatus!]!` | no (array)  |
| `createPost`         | mutation | `CreatePostInput!`              | `PostActionPayload!`          | no          |
| `deletePost`         | mutation | `DeletePostInput!`              | `DeletePostPayload!`          | no          |
| `createIdea`         | mutation | `CreateIdeaInput!`              | `CreateIdeaPayload!`          | no          |
