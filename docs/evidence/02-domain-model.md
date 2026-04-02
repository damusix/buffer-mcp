# Buffer Domain Model

## Entity Hierarchy

```
Account
└── Organizations
    ├── Channels
    │   └── Posts
    │       ├── Assets (images, videos, documents)
    │       ├── Tags
    │       └── Notes
    └── Ideas
        └── IdeaContent (title, text, media, tags)
```

## Entities

### Account

Top-level entity representing a Buffer login. A single API token is scoped to one account.

| Field         | Type             | Nullable | Notes                  |
| ------------- | ---------------- | -------- | ---------------------- |
| id            | ID!              | no       |                        |
| email         | String!          | no       |                        |
| backupEmail   | String           | yes      |                        |
| avatar        | String!          | no       |                        |
| createdAt     | DateTime         | yes      | ISO 8601               |
| organizations | [Organization!]! | no       | All orgs under account |
| timezone      | String           | yes      |                        |
| name          | String           | yes      |                        |
| preferences   | Preferences      | yes      |                        |
| connectedApps | [ConnectedApp!]  | yes      |                        |

### Organization

A workspace within Buffer. Contains channels and ideas.

| Field        | Type                | Nullable | Notes            |
| ------------ | ------------------- | -------- | ---------------- |
| id           | OrganizationId!     | no       | MongoDB ObjectId |
| name         | String!             | no       |                  |
| ownerEmail   | String!             | no       |                  |
| channelCount | Int!                | no       |                  |
| limits       | OrganizationLimits! | no       |                  |
| members      | MemberConnection!   | no       | Paginated        |

### Channel

A connected social media profile/page.

| Field                        | Type                   | Nullable | Notes                                   |
| ---------------------------- | ---------------------- | -------- | --------------------------------------- |
| id                           | ChannelId!             | no       | MongoDB ObjectId                        |
| name                         | String!                | no       |                                         |
| displayName                  | String                 | yes      |                                         |
| descriptor                   | String!                | no       |                                         |
| service                      | Service!               | no       | Platform enum                           |
| type                         | ChannelType!           | no       | Profile, Page, Business, Group, Account |
| avatar                       | String!                | no       |                                         |
| organizationId               | OrganizationId!        | no       |                                         |
| timezone                     | String!                | no       |                                         |
| isDisconnected               | Boolean!               | no       |                                         |
| isLocked                     | Boolean!               | no       |                                         |
| isNew                        | Boolean!               | no       |                                         |
| isQueuePaused                | Boolean!               | no       |                                         |
| postingSchedule              | [ScheduleV2!]!         | no       | Queue time slots                        |
| showTrendingTopicSuggestions | Boolean!               | no       |                                         |
| metadata                     | ChannelMetadata        | yes      | Platform-specific union                 |
| products                     | [Product!]             | yes      |                                         |
| serviceId                    | String!                | no       |                                         |
| createdAt                    | DateTime!              | no       |                                         |
| updatedAt                    | DateTime!              | no       |                                         |
| allowedActions               | [ChannelAction!]!      | no       |                                         |
| scopes                       | [String]!              | no       |                                         |
| hasActiveMemberDevice        | Boolean!               | no       |                                         |
| postingGoal                  | PostingGoal            | yes      |                                         |
| externalLink                 | String                 | yes      |                                         |
| linkShortening               | ChannelLinkShortening! | no       |                                         |
| weeklyPostingLimit           | WeeklyPostingLimit     | yes      |                                         |

**ChannelMetadata** is a union type with platform-specific variants:
FacebookMetadata, TwitterMetadata, InstagramMetadata, LinkedInMetadata, YouTubeMetadata, TikTokMetadata, PinterestMetadata, MastodonMetadata, BlueskyMetadata, GoogleBusinessMetadata.

### Post

Content published or scheduled through Buffer.

| Field              | Type                | Nullable | Notes                                            |
| ------------------ | ------------------- | -------- | ------------------------------------------------ |
| id                 | PostId!             | no       | MongoDB ObjectId                                 |
| text               | String!             | no       |                                                  |
| status             | PostStatus!         | no       | draft, buffer, sent, failed, approval            |
| via                | PostVia!            | no       | buffer, api                                      |
| schedulingType     | SchedulingType      | yes      | notification, automatic                          |
| isCustomScheduled  | Boolean!            | no       |                                                  |
| createdAt          | DateTime!           | no       |                                                  |
| updatedAt          | DateTime!           | no       |                                                  |
| dueAt              | DateTime            | yes      | Scheduled publication time (UTC ISO 8601)        |
| sentAt             | DateTime            | yes      | Actual send time                                 |
| channelId          | ChannelId!          | no       |                                                  |
| channelService     | Service!            | no       |                                                  |
| channel            | Channel!            | no       | Resolved channel object                          |
| ideaId             | IdeaId              | yes      | Link to source idea                              |
| author             | Author              | yes      |                                                  |
| externalLink       | String              | yes      |                                                  |
| metadata           | PostMetadata        | yes      | Platform-specific union                          |
| tags               | [Tag!]!             | no       |                                                  |
| notes              | [Note!]!            | no       |                                                  |
| notificationStatus | NotificationStatus  | yes      |                                                  |
| error              | PostPublishingError | yes      | Present when status=failed                       |
| assets             | [Asset!]!           | no       | Images, videos, documents                        |
| allowedActions     | [PostAction!]!      | no       |                                                  |
| sharedNow          | Boolean!            | no       |                                                  |
| shareMode          | ShareMode!          | no       | addToQueue, shareNext, shareNow, customScheduled |

**PostMetadata** is a union type with platform-specific variants:
FacebookPostMetadata, TwitterPostMetadata, InstagramPostMetadata, LinkedInPostMetadata, PinterestPostMetadata, YouTubePostMetadata, MastodonPostMetadata, ThreadsPostMetadata, BlueskyPostMetadata, TikTokPostMetadata, GoogleBusinessPostMetadata, StartPagePostMetadata.

### Idea

Organization-level content draft, not tied to a specific channel.

| Field          | Type         | Nullable | Notes                         |
| -------------- | ------------ | -------- | ----------------------------- |
| id             | ID!          | no       |                               |
| organizationId | ID!          | no       |                               |
| content        | IdeaContent! | no       |                               |
| groupId        | ID           | yes      | Idea group/folder             |
| position       | Float        | yes      | Ordering within group         |
| createdAt      | Int!         | no       | Unix timestamp (not ISO 8601) |
| updatedAt      | Int!         | no       | Unix timestamp (not ISO 8601) |

### IdeaContent

Nested content object within an Idea.

| Field      | Type              | Nullable | Notes            |
| ---------- | ----------------- | -------- | ---------------- |
| title      | String            | yes      | Optional heading |
| text       | String            | yes      | Body content     |
| media      | [IdeaMedia!]      | yes      | Attached media   |
| tags       | [PublishingTag!]! | no       |                  |
| aiAssisted | Boolean!          | no       |                  |
| services   | [Service!]!       | no       | Target platforms |
| date       | DateTime          | yes      |                  |

### Asset (Interface)

Implemented by: ImageAsset, VideoAsset, DocumentAsset.

Common fields not fully documented in guides — see reference for specifics.

### Tag

Post categorization. Referenced by `TagId` (MongoDB ObjectId). Posts have `tags: [Tag!]!`.

Fields: `id` (TagId), `name`, `color` (based on reference patterns — full field list in reference page).

### Note

Annotations on posts. Referenced by `NoteId` (MongoDB ObjectId). Posts have `notes: [Note!]!`.

## Post Lifecycle

### States (PostStatus enum)

| Value      | Meaning                                             |
| ---------- | --------------------------------------------------- |
| `draft`    | Saved but not queued                                |
| `buffer`   | In the queue, waiting for `dueAt` time              |
| `sent`     | Successfully published to social platform           |
| `failed`   | Could not be published (e.g., channel disconnected) |
| `approval` | Awaiting team approval                              |

### Scheduling Modes (ShareMode enum)

| Value             | Behavior                           |
| ----------------- | ---------------------------------- |
| `addToQueue`      | Place in next available queue slot |
| `shareNext`       | Place at front of queue            |
| `shareNow`        | Publish immediately                |
| `customScheduled` | Publish at specific `dueAt` time   |

### SchedulingType enum

| Value          | Notes                          |
| -------------- | ------------------------------ |
| `notification` | Mobile notification reminder   |
| `automatic`    | Auto-publish at scheduled time |

### Creating a Post

Required fields in `CreatePostInput`:

| Field          | Type              | Required | Notes                              |
| -------------- | ----------------- | -------- | ---------------------------------- |
| channelId      | ChannelId!        | yes      | Target channel                     |
| schedulingType | SchedulingType!   | yes      | notification or automatic          |
| mode           | ShareMode!        | yes      | How to schedule                    |
| text           | String            | no       | Post content                       |
| dueAt          | DateTime          | no       | Required when mode=customScheduled |
| ideaId         | IdeaId            | no       | Link to source idea                |
| draftId        | DraftId           | no       | Link to draft                      |
| metadata       | PostInputMetaData | no       | Platform-specific options          |
| tagIds         | [TagId!]          | no       |                                    |
| assets         | AssetsInput       | no       | Media attachments                  |
| source         | String            | no       |                                    |
| aiAssisted     | Boolean           | no       |                                    |
| saveToDraft    | Boolean           | no       |                                    |

**AssetsInput** structure:

| Field     | Type                  | Notes |
| --------- | --------------------- | ----- |
| images    | [ImageAssetInput!]    |       |
| videos    | [VideoAssetInput!]    |       |
| documents | [DocumentAssetInput!] |       |
| link      | LinkAssetInput        |       |

### Deleting a Post

`DeletePostInput` requires `postId`. Returns `DeletePostPayload` (union of success and error types).

## Supported Platforms (Service enum)

| Value            | Platform                 |
| ---------------- | ------------------------ |
| `twitter`        | X (Twitter)              |
| `facebook`       | Facebook                 |
| `instagram`      | Instagram                |
| `linkedin`       | LinkedIn                 |
| `pinterest`      | Pinterest                |
| `youtube`        | YouTube                  |
| `tiktok`         | TikTok                   |
| `mastodon`       | Mastodon                 |
| `bluesky`        | Bluesky                  |
| `threads`        | Threads                  |
| `googleBusiness` | Google Business Profiles |

## Channel Types (ChannelType enum)

Profile, Page, Business, Group, Account.

## Queries

| Query                | Input                                    | Returns                       | Notes                         |
| -------------------- | ---------------------------------------- | ----------------------------- | ----------------------------- |
| `account`            | none                                     | `Account!`                    | Current authenticated account |
| `channel`            | `ChannelInput!`                          | `Channel!`                    | Single channel by ID          |
| `channels`           | `ChannelsInput!`                         | `[Channel!]!`                 | All org channels              |
| `post`               | `PostInput!`                             | `Post!`                       | Single post by ID             |
| `posts`              | `PostsInput!, first: Int, after: String` | `PostsResults!`               | Paginated, filterable         |
| `dailyPostingLimits` | `DailyPostingLimitsInput!`               | `[DailyPostingLimitStatus!]!` | Per-channel limits            |

## Mutations

| Mutation     | Input              | Returns              | Notes                              |
| ------------ | ------------------ | -------------------- | ---------------------------------- |
| `createPost` | `CreatePostInput!` | `PostActionPayload!` | Union: PostActionSuccess \| errors |
| `deletePost` | `DeletePostInput!` | `DeletePostPayload!` | Union: success \| errors           |
| `createIdea` | `CreateIdeaInput!` | `CreateIdeaPayload!` | Union: Idea \| errors              |

## Post Filtering (PostsFiltersInput)

| Field      | Type               | Notes                |
| ---------- | ------------------ | -------------------- |
| channelIds | [ChannelId!]       | Filter by channels   |
| startDate  | DateTime           |                      |
| endDate    | DateTime           |                      |
| status     | [PostStatus!]      | Filter by status(es) |
| tags       | TagComparator      |                      |
| tagIds     | [TagId!]           |                      |
| dueAt      | DateTimeComparator |                      |
| createdAt  | DateTimeComparator |                      |

## Pagination

Relay-style cursor-based pagination on `posts` query.

- Request: `first` (page size), `after` (cursor)
- Response: `PostsResults` with `edges: [PostsEdge!]`, `pageInfo: PaginationPageInfo!`
- `PaginationPageInfo`: `startCursor`, `endCursor`, `hasPreviousPage: Boolean!`, `hasNextPage: Boolean!`
- Forward-only, opaque cursors

## DailyPostingLimitStatus

| Field     | Type       | Notes                 |
| --------- | ---------- | --------------------- |
| channelId | ChannelId! |                       |
| sent      | Int!       | Posts sent today      |
| scheduled | Int!       | Posts scheduled today |
| limit     | Int        | null = no limit       |
| isAtLimit | Boolean!   |                       |

## Scalar Types

All ID types are MongoDB ObjectIds: `PostId`, `ChannelId`, `IdeaId`, `OrganizationId`, `AccountId`, `TagId`, `NoteId`, `DraftId`. `DateTime` is ISO 8601.

## Error Types

All implement `MutationError` interface with `message: String!`:

- `NotFoundError` — resource not found
- `InvalidInputError` — invalid input
- `UnauthorizedError` — insufficient permissions
- `UnexpectedError` — system error
- `LimitReachedError` — resource limit exceeded
- `RestProxyError` — REST API proxied error
- `VoidMutationError` — generic/forward-compat error
- `PostPublishingError` — post publication failure (on Post.error field)

## API Standards (Key Conventions)

- Schema is append-only — fields/types are never removed, only deprecated with `@deprecated`
- Mutations use dedicated input types (not inline scalars)
- Mutations return typed union payloads: `{MutationName}Payload = SuccessType | ErrorType1 | ErrorType2`
- All mutation payloads include `VoidMutationError` for forward compatibility
- Boolean fields are always non-null
- Always use named arguments, not positional
- Non-recoverable errors in GraphQL `errors` array with codes: `NOT_FOUND`, `FORBIDDEN`, `UNAUTHORIZED`, `UNEXPECTED`
- Recoverable errors as typed union members in mutation payloads

## Notable Observations

- **Idea timestamps are Unix integers**, not ISO 8601 DateTime like everything else
- **No updatePost mutation** documented — only create and delete
- **No updateIdea or deleteIdea mutations** documented
- **No campaign entity** — Tags serve the grouping/categorization role
- **MediaType enum** includes: image, video, gif, link, document, unsupported
- **PostVia enum** distinguishes posts created via Buffer UI (`buffer`) vs API (`api`)
- **Channel has rich metadata** — posting schedule, queue pause state, link shortening, weekly limits
- **Posts can link back to Ideas** via `ideaId` field
