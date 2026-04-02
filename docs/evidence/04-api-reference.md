# 04 — Full API Reference

Extracted from `https://developers.buffer.com/reference.html` on 2026-04-02.

This document catalogs every query, mutation, type, enum, input type, scalar, union, and interface in the Buffer GraphQL API.

---

## Scalars

| Scalar           | Description                               |
| ---------------- | ----------------------------------------- |
| `AccountId`      | MongoDB ObjectId of a Buffer Account      |
| `ChannelId`      | MongoDB ObjectId of a Buffer Channel      |
| `DateTime`       | Date and time following ISO 8601 standard |
| `DraftId`        | MongoDB ObjectId of a Buffer Draft        |
| `IdeaId`         | MongoDB ObjectId of a Buffer Idea         |
| `NoteId`         | MongoDB ObjectId of a Buffer Note         |
| `OrganizationId` | MongoDB ObjectId of a Buffer Organization |
| `PostId`         | MongoDB ObjectId of a Buffer Post         |
| `TagId`          | MongoDB ObjectId of a Buffer Tag          |

---

## Queries

### `account`

Retrieves the authenticated user's account information.

- **Arguments:** none
- **Returns:** `Account!`

### `channel`

Fetches a single channel using the provided ID.

- **Arguments:** `input: ChannelInput!`
- **Returns:** `Channel!`

### `channels`

Fetch all channels for the organization taking into account the current user's permissions.

- **Arguments:** `input: ChannelsInput!`
- **Returns:** `[Channel!]!`

### `dailyPostingLimits`

Returns daily posting limit status for the given channels on the specified date.

- **Arguments:** `input: DailyPostingLimitsInput!`
- **Returns:** `[DailyPostingLimitStatus!]!`

### `post`

Fetches a post by PostID for the given organization.

- **Arguments:** `input: PostInput!`
- **Returns:** `Post!`

### `posts`

Fetches posts for the given organization with forward pagination support using Relay convention.

- **Arguments:**
    - `input: PostsInput!`
    - `first: Int` (optional — page size)
    - `after: String` (optional — cursor)
- **Returns:** `PostsResults!`

**Note:** `first` and `after` are top-level arguments, NOT inside the `input` object.

---

## Mutations

### `createPost`

Create post for channel.

- **Arguments:** `input: CreatePostInput!`
- **Returns:** `PostActionPayload!`

### `deletePost`

Delete a post by id.

- **Arguments:** `input: DeletePostInput!`
- **Returns:** `DeletePostPayload!`

### `createIdea`

Create a new idea with the given content and metadata.

- **Arguments:** `input: CreateIdeaInput!`
- **Returns:** `CreateIdeaPayload!`

---

## Union Types

### `PostActionPayload`

```
PostActionSuccess | VoidMutationError
```

### `DeletePostPayload`

```
DeletePostSuccess | NotFoundError
```

### `CreateIdeaPayload`

```
IdeaResponse | InvalidInputError | LimitReachedError | UnauthorizedError | UnexpectedError
```

### `PostMetadata`

```
BlueskyPostMetadata | FacebookPostMetadata | GoogleBusinessPostMetadata
| InstagramPostMetadata | LinkedInPostMetadata | MastodonPostMetadata
| PinterestPostMetadata | StartPagePostMetadata | ThreadsPostMetadata
| TiktokPostMetadata | TwitterPostMetadata | YoutubePostMetadata
```

### `ChannelMetadata`

```
BlueskyMetadata | FacebookMetadata | GoogleBusinessMetadata
| InstagramMetadata | LinkedInMetadata | MastodonMetadata
| PinterestMetadata | TiktokMetadata | TwitterMetadata | YoutubeMetadata
```

---

## Object Types

### Account

| Field           | Type               | Description                                                      |
| --------------- | ------------------ | ---------------------------------------------------------------- |
| `id`            | `ID!`              | Unique identifier                                                |
| `email`         | `String!`          | Primary email                                                    |
| `backupEmail`   | `String`           | Backup email                                                     |
| `avatar`        | `String!`          | Avatar URL                                                       |
| `createdAt`     | `DateTime`         | Creation date                                                    |
| `organizations` | `[Organization!]!` | User's organizations (accepts `filter: OrganizationFilterInput`) |
| `timezone`      | `String`           | Account timezone                                                 |
| `name`          | `String`           | Account name                                                     |
| `preferences`   | `Preferences`      | Account preferences                                              |
| `connectedApps` | `[ConnectedApp!]`  | Connected apps                                                   |

### ConnectedApp

| Field         | Type        | Description      |
| ------------- | ----------- | ---------------- |
| `clientId`    | `ID!`       | Connected app ID |
| `userId`      | `ID!`       | User ID          |
| `name`        | `String!`   | App name         |
| `description` | `String!`   | App description  |
| `website`     | `String!`   | App website URL  |
| `createdAt`   | `DateTime!` | Creation date    |

### Preferences

| Field                   | Type              | Description               |
| ----------------------- | ----------------- | ------------------------- |
| `timeFormat`            | `String`          | Time format preference    |
| `startOfWeek`           | `String`          | Start of week preference  |
| `defaultScheduleOption` | `ScheduleOption!` | Default scheduling option |

### Organization

| Field          | Type                  | Description              |
| -------------- | --------------------- | ------------------------ |
| `id`           | `OrganizationId!`     | Organization ID          |
| `channelCount` | `Int!`                | Total connected channels |
| `limits`       | `OrganizationLimits!` | Resource limits          |
| `members`      | `MemberConnection!`   | Members connection       |
| `name`         | `String!`             | Organization name        |
| `ownerEmail`   | `String!`             | Owner email              |

### OrganizationLimits

| Field                        | Type   | Description               |
| ---------------------------- | ------ | ------------------------- |
| `channels`                   | `Int!` | Channel limit             |
| `members`                    | `Int!` | Member limit              |
| `scheduledPosts`             | `Int!` | Scheduled posts limit     |
| `scheduledThreadsPerChannel` | `Int!` | Threads per channel limit |
| `scheduledStoriesPerChannel` | `Int!` | Stories per channel limit |
| `generateContent`            | `Int!` | Content generation limit  |
| `tags`                       | `Int!` | Tags limit                |
| `ideas`                      | `Int!` | Ideas limit               |
| `ideaGroups`                 | `Int!` | Idea groups limit         |
| `savedReplies`               | `Int!` | Saved replies limit       |

### MemberConnection

| Field        | Type   | Description                   |
| ------------ | ------ | ----------------------------- |
| `totalCount` | `Int!` | Total members including owner |

### Channel

| Field                          | Type                     | Description                    |
| ------------------------------ | ------------------------ | ------------------------------ |
| `id`                           | `ChannelId!`             | Channel ID                     |
| `allowedActions`               | `[ChannelAction!]!`      | Allowed user actions           |
| `scopes`                       | `[String]!`              | Requested scopes               |
| `avatar`                       | `String!`                | Avatar URL                     |
| `createdAt`                    | `DateTime!`              | Creation date                  |
| `descriptor`                   | `String!`                | Formatted service/type name    |
| `displayName`                  | `String`                 | Display name                   |
| `isDisconnected`               | `Boolean!`               | Disconnected status            |
| `isLocked`                     | `Boolean!`               | Locked for posting             |
| `isNew`                        | `Boolean!`               | Recently created               |
| `postingSchedule`              | `[ScheduleV2!]!`         | Posting slots per weekday      |
| `isQueuePaused`                | `Boolean!`               | Queue pause status             |
| `showTrendingTopicSuggestions` | `Boolean!`               | Trend suggestions flag         |
| `metadata`                     | `ChannelMetadata`        | Service-specific metadata      |
| `name`                         | `String!`                | Channel handle/username        |
| `organizationId`               | `OrganizationId!`        | Parent organization ID         |
| `products`                     | `[Product!]`             | Supported products             |
| `service`                      | `Service!`               | Social network type            |
| `serviceId`                    | `String!`                | External service channel ID    |
| `timezone`                     | `String!`                | Channel timezone               |
| `type`                         | `ChannelType!`           | Channel type                   |
| `updatedAt`                    | `DateTime!`              | Last update date               |
| `hasActiveMemberDevice`        | `Boolean!`               | Active push devices            |
| `postingGoal`                  | `PostingGoal`            | Channel posting goal           |
| `externalLink`                 | `String`                 | Social network URL             |
| `linkShortening`               | `ChannelLinkShortening!` | Link shortening settings       |
| `weeklyPostingLimit`           | `WeeklyPostingLimit`     | Weekly post limit (deprecated) |

### ChannelLinkShortening

| Field       | Type                   | Description                     |
| ----------- | ---------------------- | ------------------------------- |
| `config`    | `LinkShorteningConfig` | Shortener configuration or null |
| `isEnabled` | `Boolean!`             | Link shortening enabled         |

### ScheduleV2

| Field    | Type         | Description    |
| -------- | ------------ | -------------- |
| `day`    | `DayOfWeek!` | Day of week    |
| `times`  | `[String!]!` | Posting times  |
| `paused` | `Boolean!`   | Whether paused |

### WeeklyPostingLimit

| Field       | Type   | Description     |
| ----------- | ------ | --------------- |
| `sent`      | `Int!` | Posts sent      |
| `scheduled` | `Int!` | Posts scheduled |
| `limit`     | `Int!` | Limit value     |

### PostingGoal

| Field            | Type                 | Description          |
| ---------------- | -------------------- | -------------------- |
| `goal`           | `Int!`               | Target post count    |
| `sentCount`      | `Int!`               | Posts sent/published |
| `scheduledCount` | `Int!`               | Posts scheduled      |
| `status`         | `PostingGoalStatus!` | Goal status          |
| `periodStart`    | `DateTime!`          | Period start         |
| `periodEnd`      | `DateTime!`          | Period end           |

### Post

| Field                | Type                  | Description                                |
| -------------------- | --------------------- | ------------------------------------------ |
| `id`                 | `PostId!`             | Post ObjectId                              |
| `ideaId`             | `IdeaId`              | Set when Post generated from Idea          |
| `status`             | `PostStatus!`         | Post status                                |
| `via`                | `PostVia!`            | Created from Buffer or API                 |
| `schedulingType`     | `SchedulingType`      | Null if created natively on social network |
| `author`             | `Author`              | Post creator                               |
| `isCustomScheduled`  | `Boolean!`            | Manual publish time                        |
| `createdAt`          | `DateTime!`           | Creation date                              |
| `updatedAt`          | `DateTime!`           | Update date                                |
| `dueAt`              | `DateTime`            | Scheduled publication date                 |
| `sentAt`             | `DateTime`            | Actual publication date                    |
| `text`               | `String!`             | Text content                               |
| `externalLink`       | `String`              | URL at destination service                 |
| `metadata`           | `PostMetadata`        | Network-specific metadata                  |
| `channelId`          | `ChannelId!`          | Channel ID                                 |
| `channelService`     | `Service!`            | Channel service type                       |
| `channel`            | `Channel!`            | Associated channel                         |
| `tags`               | `[Tag!]!`             | Tags (sorted by name asc)                  |
| `notes`              | `[Note!]!`            | Associated notes                           |
| `notificationStatus` | `NotificationStatus`  | Notification status                        |
| `error`              | `PostPublishingError` | Publishing error                           |
| `assets`             | `[Asset!]!`           | Media assets                               |
| `allowedActions`     | `[PostAction!]!`      | Allowed user actions                       |
| `sharedNow`          | `Boolean!`            | Published via share now                    |
| `shareMode`          | `ShareMode!`          | Share mode used                            |

### PostsResults

| Field      | Type                  | Description          |
| ---------- | --------------------- | -------------------- |
| `edges`    | `[PostsEdge!]`        | Posts matching query |
| `pageInfo` | `PaginationPageInfo!` | Pagination info      |

### PostsEdge

| Field    | Type      | Description   |
| -------- | --------- | ------------- |
| `node`   | `Post!`   | Post in list  |
| `cursor` | `String!` | Opaque cursor |

### PaginationPageInfo

| Field             | Type       | Description       |
| ----------------- | ---------- | ----------------- |
| `startCursor`     | `String`   | First cursor      |
| `endCursor`       | `String`   | Last cursor       |
| `hasPreviousPage` | `Boolean!` | Has previous page |
| `hasNextPage`     | `Boolean!` | Has next page     |

### DailyPostingLimitStatus

| Field       | Type         | Description                    |
| ----------- | ------------ | ------------------------------ |
| `channelId` | `ChannelId!` | Channel ID                     |
| `sent`      | `Int!`       | Posts sent that day            |
| `scheduled` | `Int!`       | Posts scheduled that day       |
| `limit`     | `Int`        | Daily limit (null = unlimited) |
| `isAtLimit` | `Boolean!`   | Whether limit reached          |

### PostPublishingError

| Field        | Type      | Description            |
| ------------ | --------- | ---------------------- |
| `message`    | `String!` | Error message          |
| `supportUrl` | `String`  | Help center link       |
| `rawError`   | `String`  | Raw error from service |

### Author

| Field       | Type         | Description     |
| ----------- | ------------ | --------------- |
| `id`        | `AccountId!` | Author ID       |
| `email`     | `String!`    | Email           |
| `avatar`    | `String!`    | Avatar URL      |
| `isDeleted` | `Boolean!`   | Deleted status  |
| `name`      | `String`     | Name (nullable) |

### Tag

| Field      | Type       | Description                |
| ---------- | ---------- | -------------------------- |
| `id`       | `TagId!`   | Tag ObjectId               |
| `color`    | `String!`  | Hex color (e.g. '#F523F1') |
| `name`     | `String!`  | Tag name                   |
| `isLocked` | `Boolean!` | Locked (downgrades)        |

### PublishingTag

| Field   | Type      | Description |
| ------- | --------- | ----------- |
| `id`    | `ID!`     | Tag ID      |
| `color` | `String!` | Hex color   |
| `name`  | `String!` | Tag name    |

### Note

| Field            | Type             | Description       |
| ---------------- | ---------------- | ----------------- |
| `id`             | `NoteId!`        | Note ID           |
| `text`           | `String!`        | Note content      |
| `type`           | `NoteType!`      | Note type         |
| `author`         | `Author!`        | Note author       |
| `createdAt`      | `DateTime!`      | Creation date     |
| `updatedAt`      | `DateTime`       | Last edit date    |
| `allowedActions` | `[NoteAction!]!` | Permitted actions |

### Annotation

| Field     | Type              | Description              |
| --------- | ----------------- | ------------------------ |
| `type`    | `AnnotationType!` | Annotation type          |
| `indices` | `[Int!]!`         | Text indices             |
| `content` | `String!`         | Annotation content       |
| `text`    | `String!`         | Text representation      |
| `url`     | `String!`         | URL annotation points to |

### UserTag

| Field    | Type      | Description  |
| -------- | --------- | ------------ |
| `handle` | `String!` | User handle  |
| `x`      | `Float!`  | X coordinate |
| `y`      | `Float!`  | Y coordinate |

### ThreadedPost

| Field            | Type             | Description     |
| ---------------- | ---------------- | --------------- |
| `text`           | `String!`        | Text content    |
| `assets`         | `[Asset!]!`      | Media assets    |
| `linkAttachment` | `LinkAttachment` | Link attachment |

### ScrapedLink

| Field        | Type         | Description          |
| ------------ | ------------ | -------------------- |
| `url`        | `String!`    | Link URL             |
| `text`       | `String!`    | Description          |
| `thumbnails` | `[String!]!` | Available thumbnails |

### MutationError

| Field     | Type      | Description   |
| --------- | --------- | ------------- |
| `message` | `String!` | Error message |

### VoidMutationError

| Field     | Type      | Description                     |
| --------- | --------- | ------------------------------- |
| `message` | `String!` | Error message (future-proofing) |

### RetweetMetadata

| Field        | Type                   | Description    |
| ------------ | ---------------------- | -------------- |
| `id`         | `String!`              | Retweet ID     |
| `url`        | `String!`              | Retweet URL    |
| `text`       | `String!`              | Retweet text   |
| `createdAt`  | `DateTime!`            | Creation date  |
| `user`       | `RetweetUserMetadata!` | Retweeted user |
| `thumbnails` | `[String!]!`           | Thumbnails     |

### InstagramGeolocation

| Field  | Type     | Description   |
| ------ | -------- | ------------- |
| `id`   | `String` | Location ID   |
| `text` | `String` | Location text |

### InstagramStickerFields

| Field      | Type     | Description      |
| ---------- | -------- | ---------------- |
| `text`     | `String` | Text sticker     |
| `music`    | `String` | Music sticker    |
| `products` | `String` | Products sticker |
| `topics`   | `String` | Topics sticker   |
| `other`    | `String` | Other sticker    |

### LocationData

| Field             | Type     | Description       |
| ----------------- | -------- | ----------------- |
| `location`        | `String` | Business location |
| `mapsLink`        | `String` | Map link          |
| `googleAccountId` | `String` | Google Account ID |

---

## Asset Types (Interface Pattern)

### Asset (Interface)

| Field       | Type         | Description        |
| ----------- | ------------ | ------------------ |
| `id`        | `ID`         | Asset database ID  |
| `type`      | `AssetType!` | Asset category     |
| `mimeType`  | `String!`    | MIME type          |
| `source`    | `String!`    | URL to file source |
| `thumbnail` | `String!`    | URL to thumbnail   |

### ImageAsset (implements Asset)

Inherits all Asset fields, plus:

| Field   | Type             | Description             |
| ------- | ---------------- | ----------------------- |
| `image` | `ImageMetadata!` | Image-specific metadata |

**ImageMetadata:**

| Field               | Type         | Description            |
| ------------------- | ------------ | ---------------------- |
| `altText`           | `String!`    | Alt text               |
| `width`             | `Int!`       | Width in pixels        |
| `height`            | `Int!`       | Height in pixels       |
| `isAnimated`        | `Boolean!`   | Animated image flag    |
| `animatedThumbnail` | `String`     | Animated thumbnail URL |
| `userTags`          | `[UserTag!]` | User tags in image     |

### VideoAsset (implements Asset)

Inherits all Asset fields, plus:

| Field   | Type             | Description             |
| ------- | ---------------- | ----------------------- |
| `video` | `VideoMetadata!` | Video-specific metadata |

**VideoMetadata:**

| Field                   | Type       | Description          |
| ----------------------- | ---------- | -------------------- |
| `durationMs`            | `Int!`     | Duration in ms       |
| `containerFormat`       | `String`   | Container format     |
| `videoCodec`            | `String`   | Video codec          |
| `frameRate`             | `Int`      | Framerate            |
| `videoBitRate`          | `Int`      | Bitrate in kbps      |
| `audioCodec`            | `String`   | Audio codec          |
| `rotationDegree`        | `Int`      | Rotation degree      |
| `isTranscodingRequired` | `Boolean!` | Needs transcoding    |
| `isVideoProcessing`     | `Boolean!` | Currently processing |
| `width`                 | `Int!`     | Width in pixels      |
| `height`                | `Int!`     | Height in pixels     |
| `fileSize`              | `Int`      | File size in bytes   |

### DocumentAsset (implements Asset)

Inherits all Asset fields, plus:

| Field      | Type                | Description                |
| ---------- | ------------------- | -------------------------- |
| `document` | `DocumentMetadata!` | Document-specific metadata |

**DocumentMetadata:**

| Field        | Type         | Description         |
| ------------ | ------------ | ------------------- |
| `filesize`   | `Int`        | File size in bytes  |
| `numPages`   | `Int!`       | Number of pages     |
| `thumbnails` | `[String!]!` | Page thumbnail URLs |

### LinkAttachment

| Field         | Type         | Description          |
| ------------- | ------------ | -------------------- |
| `url`         | `String!`    | Source URL           |
| `expandedUrl` | `String`     | Full URL             |
| `text`        | `String!`    | Description          |
| `thumbnails`  | `[String!]!` | Available thumbnails |
| `thumbnail`   | `String`     | Selected thumbnail   |
| `title`       | `String!`    | Link title           |

---

## Idea Types

### Idea

| Field            | Type           | Description                    |
| ---------------- | -------------- | ------------------------------ |
| `id`             | `ID!`          | Unique identifier              |
| `organizationId` | `ID!`          | Organization owner ID          |
| `content`        | `IdeaContent!` | Content and metadata           |
| `groupId`        | `ID`           | Group ID                       |
| `position`       | `Float`        | Order in group                 |
| `createdAt`      | `Int!`         | Unix timestamp (NOT DateTime!) |
| `updatedAt`      | `Int!`         | Unix timestamp (NOT DateTime!) |

### IdeaContent

| Field        | Type                | Description         |
| ------------ | ------------------- | ------------------- |
| `title`      | `String`            | Title               |
| `text`       | `String`            | Body text           |
| `media`      | `[IdeaMedia!]`      | Attached media      |
| `tags`       | `[PublishingTag!]!` | Tags                |
| `aiAssisted` | `Boolean!`          | AI-assisted flag    |
| `services`   | `[Service!]!`       | Target platforms    |
| `date`       | `DateTime`          | Target publish date |

### IdeaMedia

| Field          | Type              | Description        |
| -------------- | ----------------- | ------------------ |
| `id`           | `ID!`             | Media ID           |
| `url`          | `String!`         | Direct URL         |
| `alt`          | `String`          | Alt text           |
| `thumbnailUrl` | `String`          | Preview URL        |
| `type`         | `MediaType!`      | Media type         |
| `size`         | `Int`             | File size in bytes |
| `source`       | `IdeaMediaSource` | Source platform    |

### IdeaMediaSource

| Field       | Type      | Description                     |
| ----------- | --------- | ------------------------------- |
| `name`      | `String!` | Platform name (e.g. 'Unsplash') |
| `id`        | `String`  | Platform ID                     |
| `author`    | `String`  | Creator name                    |
| `authorUrl` | `String`  | Creator profile URL             |

### IdeaResponse

| Field          | Type       | Description                   |
| -------------- | ---------- | ----------------------------- |
| `idea`         | `Idea`     | Affected idea                 |
| `refreshIdeas` | `Boolean!` | Whether client should refresh |

---

## Channel Metadata Types

### BlueskyMetadata

| Field       | Type      |
| ----------- | --------- |
| `serverUrl` | `String!` |

### FacebookMetadata

| Field          | Type           |
| -------------- | -------------- |
| `locationData` | `LocationData` |

### GoogleBusinessMetadata

| Field          | Type           |
| -------------- | -------------- |
| `locationData` | `LocationData` |

### InstagramMetadata

| Field                | Type       |
| -------------------- | ---------- |
| `defaultToReminders` | `Boolean!` |

### LinkedInMetadata

| Field                                      | Type       |
| ------------------------------------------ | ---------- |
| `shouldShowLinkedinAnalyticsRefreshBanner` | `Boolean!` |

### MastodonMetadata

| Field       | Type      |
| ----------- | --------- |
| `serverUrl` | `String!` |

### PinterestMetadata

| Field    | Type                 |
| -------- | -------------------- |
| `boards` | `[PinterestBoard!]!` |

**PinterestBoard:**

| Field         | Type      |
| ------------- | --------- |
| `id`          | `String!` |
| `serviceId`   | `String!` |
| `name`        | `String!` |
| `url`         | `String!` |
| `description` | `String`  |
| `avatar`      | `String`  |

### TiktokMetadata

| Field                | Type       |
| -------------------- | ---------- |
| `defaultToReminders` | `Boolean!` |

### TwitterMetadata

| Field              | Type     |
| ------------------ | -------- |
| `subscriptionType` | `String` |

### YoutubeMetadata

| Field                | Type       |
| -------------------- | ---------- |
| `defaultToReminders` | `Boolean!` |

---

## Post Metadata Types

### BlueskyPostMetadata

| Field            | Type               |
| ---------------- | ------------------ |
| `type`           | `PostType!`        |
| `annotations`    | `[Annotation!]!`   |
| `thread`         | `[ThreadedPost!]!` |
| `threadCount`    | `Int!`             |
| `linkAttachment` | `LinkAttachment`   |

### FacebookPostMetadata

| Field            | Type             |
| ---------------- | ---------------- |
| `type`           | `PostType!`      |
| `annotations`    | `[Annotation!]!` |
| `linkAttachment` | `LinkAttachment` |
| `title`          | `String`         |
| `firstComment`   | `String`         |

### GoogleBusinessPostMetadata

| Field         | Type                        |
| ------------- | --------------------------- |
| `type`        | `PostType!`                 |
| `title`       | `String`                    |
| `annotations` | `[Annotation!]!`            |
| `details`     | `GoogleBusinessPostDetails` |

### GoogleBusinessEventMetaData

| Field            | Type                            |
| ---------------- | ------------------------------- |
| `title`          | `String!`                       |
| `startDate`      | `DateTime!`                     |
| `endDate`        | `DateTime!`                     |
| `startTime`      | `String`                        |
| `endTime`        | `String`                        |
| `isFullDayEvent` | `Boolean!`                      |
| `button`         | `GoogleBusinessPostActionType!` |
| `link`           | `String`                        |

### GoogleBusinessOfferMetaData

| Field       | Type        |
| ----------- | ----------- |
| `title`     | `String!`   |
| `startDate` | `DateTime!` |
| `endDate`   | `DateTime!` |
| `code`      | `String`    |
| `link`      | `String`    |
| `terms`     | `String`    |

### InstagramPostMetadata

| Field               | Type                     |
| ------------------- | ------------------------ |
| `firstComment`      | `String`                 |
| `link`              | `String`                 |
| `type`              | `PostType!`              |
| `annotations`       | `[Annotation!]!`         |
| `geolocation`       | `InstagramGeolocation`   |
| `shouldShareToFeed` | `Boolean!`               |
| `stickerFields`     | `InstagramStickerFields` |

### LinkedInPostMetadata

| Field            | Type             |
| ---------------- | ---------------- |
| `type`           | `PostType!`      |
| `annotations`    | `[Annotation!]!` |
| `firstComment`   | `String`         |
| `linkAttachment` | `LinkAttachment` |

### MastodonPostMetadata

| Field         | Type               |
| ------------- | ------------------ |
| `type`        | `PostType!`        |
| `annotations` | `[Annotation!]!`   |
| `thread`      | `[ThreadedPost!]!` |
| `threadCount` | `Int!`             |
| `spoilerText` | `String`           |

### PinterestPostMetadata

| Field         | Type             |
| ------------- | ---------------- |
| `type`        | `PostType!`      |
| `title`       | `String`         |
| `url`         | `String`         |
| `board`       | `PinterestBoard` |
| `annotations` | `[Annotation!]!` |

### ThreadsPostMetadata

| Field            | Type               |
| ---------------- | ------------------ |
| `type`           | `PostType!`        |
| `annotations`    | `[Annotation!]!`   |
| `thread`         | `[ThreadedPost!]!` |
| `threadCount`    | `Int!`             |
| `linkAttachment` | `LinkAttachment`   |
| `topic`          | `String`           |
| `locationId`     | `String`           |
| `locationName`   | `String`           |

### TwitterPostMetadata

| Field         | Type               |
| ------------- | ------------------ |
| `type`        | `PostType!`        |
| `retweet`     | `RetweetMetadata`  |
| `annotations` | `[Annotation!]!`   |
| `thread`      | `[ThreadedPost!]!` |
| `threadCount` | `Int!`             |

### YoutubePostMetadata

| Field               | Type              |
| ------------------- | ----------------- |
| `type`              | `PostType!`       |
| `annotations`       | `[Annotation!]!`  |
| `title`             | `String`          |
| `privacy`           | `YoutubePrivacy`  |
| `category`          | `YoutubeCategory` |
| `license`           | `YoutubeLicense`  |
| `notifySubscribers` | `Boolean!`        |
| `embeddable`        | `Boolean!`        |
| `madeForKids`       | `Boolean!`        |

---

## Enums

### Service

```
twitter | facebook | instagram | linkedin | pinterest
| youtube | mastodon | bluesky | threads | tiktok | googleBusiness
```

### ChannelType

```
Profile | Page | Business | Group | Account
```

### DayOfWeek

```
mon | tue | wed | thu | fri | sat | sun
```

### PostStatus

```
draft | buffer | sent | failed
```

### ShareMode

```
addToQueue | shareNext | shareNow | customScheduled
```

### SchedulingType

```
notification_publishing | automatic_publishing
```

### PostVia

```
buffer | api
```

### NotificationStatus

```
notified | markedAsPublished
```

### SortDirection

```
ASC | DESC
```

### AssetType

```
IMAGE | VIDEO | DOCUMENT | LINK | GIF
```

### MediaType

```
image | video | gif | link | document | unsupported
```

### AnnotationType

```
HASHTAG | MENTION | URL
```

### PostType

```
post | story | reel
```

### PostTypeFacebook

```
post | story | reel
```

### PostTypeGoogleBusiness

```
post | offer | event | whatsNew
```

### YoutubePrivacy

```
public | private | unlisted
```

### YoutubeLicense

```
youtube | creativeCommon
```

### Product

```
buffer
```

**Note:** Several enums have values not fully enumerated in the reference page:

- `ScheduleOption` — values not listed
- `OrganizationAction` — values not listed
- `ChannelAction` — `publishStartPage` shown as example
- `PostAction` — values not listed
- `NoteAction` — values not listed
- `NoteType` — values not listed
- `PostingGoalStatus` — values not listed
- `PostSortableKey` — values not listed
- `GoogleBusinessPostActionType` — values not listed

These will need to be discovered via real API introspection or inferred from usage.

---

## Input Types

### Query Inputs

#### ChannelInput

| Field | Type         | Required |
| ----- | ------------ | -------- |
| `id`  | `ChannelId!` | yes      |

#### ChannelsInput

| Field            | Type                   | Required |
| ---------------- | ---------------------- | -------- |
| `organizationId` | `OrganizationId!`      | yes      |
| `filter`         | `ChannelsFiltersInput` | no       |

#### ChannelsFiltersInput

| Field      | Type      | Required |
| ---------- | --------- | -------- |
| `isLocked` | `Boolean` | no       |
| `product`  | `Product` | no       |

#### PostInput

| Field | Type      | Required |
| ----- | --------- | -------- |
| `id`  | `PostId!` | yes      |

#### PostsInput

| Field            | Type                | Required |
| ---------------- | ------------------- | -------- |
| `organizationId` | `OrganizationId!`   | yes      |
| `filter`         | `PostsFiltersInput` | no       |
| `sort`           | `[PostSortInput!]`  | no       |

#### PostsFiltersInput

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

#### PostSortInput

| Field       | Type               | Required |
| ----------- | ------------------ | -------- |
| `field`     | `PostSortableKey!` | yes      |
| `direction` | `SortDirection!`   | yes      |

#### TagComparator

| Field     | Type        | Required |
| --------- | ----------- | -------- |
| `in`      | `[TagId!]!` | yes      |
| `isEmpty` | `Boolean!`  | yes      |

#### DateTimeComparator

| Field   | Type       | Required |
| ------- | ---------- | -------- |
| `start` | `DateTime` | no       |
| `end`   | `DateTime` | no       |

#### DailyPostingLimitsInput

| Field        | Type            | Required |
| ------------ | --------------- | -------- |
| `channelIds` | `[ChannelId!]!` | yes      |
| `date`       | `DateTime`      | no       |

### Mutation Inputs

#### CreatePostInput

| Field            | Type                | Required |
| ---------------- | ------------------- | -------- |
| `ideaId`         | `IdeaId`            | no       |
| `draftId`        | `DraftId`           | no       |
| `schedulingType` | `SchedulingType!`   | yes      |
| `dueAt`          | `DateTime`          | no       |
| `text`           | `String`            | no       |
| `metadata`       | `PostInputMetaData` | no       |
| `channelId`      | `ChannelId!`        | yes      |
| `tagIds`         | `[TagId!]`          | no       |
| `assets`         | `AssetsInput`       | no       |
| `mode`           | `ShareMode!`        | yes      |
| `source`         | `String`            | no       |
| `aiAssisted`     | `Boolean`           | no       |
| `saveToDraft`    | `Boolean`           | no       |

#### DeletePostInput

| Field | Type      | Required |
| ----- | --------- | -------- |
| `id`  | `PostId!` | yes      |

#### CreateIdeaInput

| Field            | Type                | Required |
| ---------------- | ------------------- | -------- |
| `organizationId` | `ID!`               | yes      |
| `content`        | `IdeaContentInput!` | yes      |
| `cta`            | `String`            | no       |
| `group`          | `IdeaGroupInput`    | no       |
| `templateId`     | `String`            | no       |

#### IdeaContentInput

| Field        | Type                | Required |
| ------------ | ------------------- | -------- |
| `title`      | `String`            | no       |
| `text`       | `String`            | no       |
| `media`      | `[IdeaMediaInput!]` | no       |
| `tags`       | `[TagInput!]`       | no       |
| `aiAssisted` | `Boolean`           | no       |
| `services`   | `[Service!]`        | no       |
| `date`       | `DateTime`          | no       |

#### IdeaMediaInput

| Field          | Type                   | Required |
| -------------- | ---------------------- | -------- |
| `url`          | `String!`              | yes      |
| `alt`          | `String`               | no       |
| `thumbnailUrl` | `String`               | no       |
| `type`         | `MediaType!`           | yes      |
| `size`         | `Int`                  | no       |
| `source`       | `IdeaMediaSourceInput` | no       |

#### IdeaGroupInput

| Field          | Type | Required |
| -------------- | ---- | -------- |
| `groupId`      | `ID` | no       |
| `placeAfterId` | `ID` | no       |

#### TagInput

| Field   | Type      | Required |
| ------- | --------- | -------- |
| `id`    | `ID!`     | yes      |
| `name`  | `String!` | yes      |
| `color` | `String!` | yes      |

### Asset Inputs

#### AssetsInput

| Field       | Type                    | Required |
| ----------- | ----------------------- | -------- |
| `images`    | `[ImageAssetInput!]`    | no       |
| `videos`    | `[VideoAssetInput!]`    | no       |
| `documents` | `[DocumentAssetInput!]` | no       |
| `link`      | `LinkAssetInput`        | no       |

#### ImageAssetInput

| Field          | Type                 | Required |
| -------------- | -------------------- | -------- |
| `url`          | `String!`            | yes      |
| `thumbnailUrl` | `String`             | no       |
| `metadata`     | `ImageMetadataInput` | no       |

#### VideoAssetInput

| Field          | Type                 | Required |
| -------------- | -------------------- | -------- |
| `url`          | `String!`            | yes      |
| `thumbnailUrl` | `String`             | no       |
| `metadata`     | `VideoMetadataInput` | no       |

#### DocumentAssetInput

| Field          | Type      | Required |
| -------------- | --------- | -------- |
| `url`          | `String!` | yes      |
| `title`        | `String!` | yes      |
| `thumbnailUrl` | `String!` | yes      |

#### LinkAssetInput

| Field          | Type      | Required |
| -------------- | --------- | -------- |
| `url`          | `String!` | yes      |
| `title`        | `String`  | no       |
| `description`  | `String`  | no       |
| `thumbnailUrl` | `String`  | no       |

#### ImageMetadataInput

| Field               | Type                   | Required |
| ------------------- | ---------------------- | -------- |
| `altText`           | `String!`              | yes      |
| `animatedThumbnail` | `String`               | no       |
| `userTags`          | `[UserTagInput!]`      | no       |
| `dimensions`        | `ImageDimensionsInput` | no       |

#### VideoMetadataInput

| Field             | Type     | Required |
| ----------------- | -------- | -------- |
| `thumbnailOffset` | `Int`    | no       |
| `title`           | `String` | no       |

### Post Metadata Inputs (per-platform)

#### PostInputMetaData (container)

| Field       | Type                              | Required |
| ----------- | --------------------------------- | -------- |
| `instagram` | `InstagramPostMetadataInput`      | no       |
| `facebook`  | `FacebookPostMetadataInput`       | no       |
| `linkedin`  | `LinkedInPostMetadataInput`       | no       |
| `twitter`   | `TwitterPostMetadataInput`        | no       |
| `pinterest` | `PinterestPostMetadataInput`      | no       |
| `google`    | `GoogleBusinessPostMetadataInput` | no       |
| `youtube`   | `YoutubePostMetadataInput`        | no       |
| `mastodon`  | `MastodonPostMetadataInput`       | no       |
| `startPage` | `StartPagePostMetadataInput`      | no       |
| `threads`   | `ThreadsPostMetadataInput`        | no       |
| `bluesky`   | `BlueskyPostMetadataInput`        | no       |
| `tiktok`    | `TikTokPostMetadataInput`         | no       |

#### InstagramPostMetadataInput

| Field               | Type                          | Required |
| ------------------- | ----------------------------- | -------- |
| `type`              | `PostType!`                   | yes      |
| `firstComment`      | `String`                      | no       |
| `link`              | `String`                      | no       |
| `geolocation`       | `InstagramGeolocationInput`   | no       |
| `shouldShareToFeed` | `Boolean!`                    | yes      |
| `stickerFields`     | `InstagramStickerFieldsInput` | no       |

#### FacebookPostMetadataInput

| Field            | Type                         | Required |
| ---------------- | ---------------------------- | -------- |
| `type`           | `PostTypeFacebook!`          | yes      |
| `annotations`    | `[AnnotationInputFacebook!]` | no       |
| `linkAttachment` | `LinkAttachmentInput`        | no       |
| `firstComment`   | `String`                     | no       |

#### LinkedInPostMetadataInput

| Field            | Type                         | Required |
| ---------------- | ---------------------------- | -------- |
| `annotations`    | `[AnnotationInputLinkedIn!]` | no       |
| `firstComment`   | `String`                     | no       |
| `linkAttachment` | `LinkAttachmentInput`        | no       |

#### TwitterPostMetadataInput

| Field     | Type                   | Required |
| --------- | ---------------------- | -------- |
| `retweet` | `RetweetMetadataInput` | no       |
| `thread`  | `[ThreadedPostInput!]` | no       |

#### PinterestPostMetadataInput

| Field            | Type      | Required |
| ---------------- | --------- | -------- |
| `title`          | `String`  | no       |
| `url`            | `String`  | no       |
| `boardServiceId` | `String!` | yes      |

#### GoogleBusinessPostMetadataInput

| Field             | Type                                  | Required |
| ----------------- | ------------------------------------- | -------- |
| `type`            | `PostTypeGoogleBusiness!`             | yes      |
| `title`           | `String`                              | no       |
| `detailsOffer`    | `GoogleBusinessOfferMetaDataInput`    | no       |
| `detailsEvent`    | `GoogleBusinessEventMetaDataInput`    | no       |
| `detailsWhatsNew` | `GoogleBusinessWhatsNewMetaDataInput` | no       |

#### YoutubePostMetadataInput

| Field               | Type             | Required |
| ------------------- | ---------------- | -------- |
| `title`             | `String!`        | yes      |
| `privacy`           | `YoutubePrivacy` | no       |
| `categoryId`        | `String!`        | yes      |
| `license`           | `YoutubeLicense` | no       |
| `notifySubscribers` | `Boolean`        | no       |
| `embeddable`        | `Boolean`        | no       |
| `madeForKids`       | `Boolean`        | no       |

#### MastodonPostMetadataInput

| Field         | Type                   | Required |
| ------------- | ---------------------- | -------- |
| `thread`      | `[ThreadedPostInput!]` | no       |
| `spoilerText` | `String`               | no       |

#### ThreadsPostMetadataInput

| Field            | Type                   | Required |
| ---------------- | ---------------------- | -------- |
| `type`           | `PostType`             | no       |
| `thread`         | `[ThreadedPostInput!]` | no       |
| `linkAttachment` | `LinkAttachmentInput`  | no       |
| `topic`          | `String`               | no       |
| `locationId`     | `String`               | no       |
| `locationName`   | `String`               | no       |

#### BlueskyPostMetadataInput

| Field            | Type                   | Required |
| ---------------- | ---------------------- | -------- |
| `thread`         | `[ThreadedPostInput!]` | no       |
| `linkAttachment` | `LinkAttachmentInput`  | no       |

#### TikTokPostMetadataInput

| Field   | Type     | Required |
| ------- | -------- | -------- |
| `title` | `String` | no       |

#### StartPagePostMetadataInput

| Field  | Type     | Required |
| ------ | -------- | -------- |
| `link` | `String` | no       |

---

## Key Observations

1. **Only 3 mutations documented:** `createPost`, `deletePost`, `createIdea`. No updatePost, updateIdea, or deleteIdea.
2. **Idea timestamps use `Int!` (Unix)** while everything else uses `DateTime` (ISO 8601).
3. **Pagination is forward-only Relay** — `first`/`after` at top level, not inside input. Only `posts` query uses pagination.
4. **PostMetadata union includes `StartPagePostMetadata` and `TiktokPostMetadata`** which were not in earlier evidence docs.
5. **ChannelMetadata union does NOT include `ThreadsMetadata`** — Threads channels apparently have no special metadata.
6. **Several enum values are not fully enumerated** in the reference docs — `PostAction`, `NoteAction`, `NoteType`, `PostSortableKey`, `PostingGoalStatus`, `ScheduleOption`, `OrganizationAction`, `ChannelAction`, `GoogleBusinessPostActionType` all have incomplete value lists.
7. **CreateIdeaPayload** has richer error unions than post mutations: `InvalidInputError`, `LimitReachedError`, `UnauthorizedError`, `UnexpectedError`.
8. **DeletePostPayload** uses `NotFoundError` rather than `MutationError`.
9. **All ID scalars are MongoDB ObjectIds** — consistent with earlier evidence.
10. **VideoMetadata.durationMs** is documented as "duration in seconds" but field name says milliseconds — needs real API verification.
11. **PostInputMetaData** key for Google is `google`, not `googleBusiness` — different from the Service enum value.
12. **ThreadedPostInput** and **LinkAttachmentInput** types were referenced but not fully defined in extraction — likely mirror their output counterparts.
