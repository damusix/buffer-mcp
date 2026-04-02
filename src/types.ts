// Buffer API TypeScript interfaces
// Derived from real API responses (docs/evidence/real-response/*.json)
// and consolidated schema (docs/evidence/05-consolidated-schema.md).
// Real evidence takes priority over documentation where they conflict.

// --- Custom Scalars ---
// All ID types are MongoDB ObjectId strings
type AccountId = string;
type ChannelId = string;
type OrganizationId = string;
type PostId = string;
type TagId = string;
type NoteId = string;
type IdeaId = string;
type DraftId = string;
// ISO 8601 datetime string
type DateTime = string;

// --- Enums ---

export type Service =
    | 'twitter'
    | 'facebook'
    | 'instagram'
    | 'linkedin'
    | 'pinterest'
    | 'youtube'
    | 'tiktok'
    | 'mastodon'
    | 'bluesky'
    | 'threads'
    | 'googleBusiness';

export type ChannelType = 'Profile' | 'Page' | 'Business' | 'Group' | 'Account';

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type PostStatus = 'draft' | 'buffer' | 'sent' | 'failed';

export type ShareMode = 'addToQueue' | 'shareNext' | 'shareNow' | 'customScheduled';

// Real API uses 'automatic'/'notification' — NOT 'automatic_publishing'/'notification_publishing'
// Confirmed in iteration 18 real API testing (docs/evidence/real-response/mutations.json)
export type SchedulingType = 'automatic' | 'notification';

export type PostVia = 'buffer' | 'api';

export type SortDirection = 'ASC' | 'DESC';

export type AssetType = 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'LINK' | 'GIF';

export type MediaType = 'image' | 'video' | 'gif' | 'link' | 'document' | 'unsupported';

export type AnnotationType = 'HASHTAG' | 'MENTION' | 'URL';

export type PostType = 'post' | 'story' | 'reel';

// --- Core Entities ---

export interface Account {
    id: AccountId;
    email: string;
    organizations: Organization[];
}

export interface Organization {
    id: OrganizationId;
    name: string;
    ownerEmail: string;
    channelCount: number;
    limits: OrganizationLimits;
}

export interface OrganizationLimits {
    channels: number;
    members: number;
    scheduledPosts: number;
    scheduledThreadsPerChannel: number;
    scheduledStoriesPerChannel: number;
    generateContent: number;
    tags: number;
    ideas: number;
    ideaGroups: number;
    savedReplies: number;
}

export interface Channel {
    id: ChannelId;
    name: string;
    displayName: string | null;
    service: Service;
    type: string; // ChannelType values observed lowercase in real data: 'business', 'page'
    avatar: string;
    timezone: string;
    organizationId: OrganizationId;
    serviceId: string;
    isDisconnected: boolean;
    isLocked: boolean;
    isQueuePaused: boolean;
    createdAt: DateTime;
    updatedAt: DateTime;
    allowedActions: string[];
    scopes: string[];
    postingSchedule: ScheduleV2[];
}

export interface ScheduleV2 {
    day: DayOfWeek;
    times: string[];
    paused: boolean;
}

export interface Post {
    id: PostId;
    text: string;
    status: PostStatus;
    via: PostVia;
    schedulingType: SchedulingType | null;
    isCustomScheduled: boolean;
    createdAt: DateTime;
    updatedAt: DateTime;
    dueAt: DateTime | null;
    sentAt: DateTime | null;
    channelId: ChannelId;
    channelService: Service;
    ideaId: IdeaId | null;
    externalLink: string | null;
    sharedNow: boolean;
    shareMode: ShareMode;
    tags: Tag[];
    notes: Note[];
    assets: Asset[];
    author: Author | null;
    error: PostPublishingError | null;
    allowedActions: string[];
}

export interface Author {
    id: AccountId;
    email: string;
    name: string | null;
}

export interface Tag {
    id: TagId;
    name: string;
    color: string;
}

export interface Note {
    id: NoteId;
    text: string;
    createdAt: DateTime;
}

export interface PostPublishingError {
    message: string;
    supportUrl?: string;
    rawError?: string;
}

// --- Assets ---

export interface Asset {
    id: string | null;
    type: string; // AssetType but lowercase observed in real data: 'image'
    mimeType: string;
    source: string;
    thumbnail: string;
    image?: ImageMetadata;
    video?: VideoMetadata;
}

export interface ImageMetadata {
    altText: string;
    width: number;
    height: number;
    isAnimated: boolean;
}

export interface VideoMetadata {
    durationMs: number;
    width: number;
    height: number;
}

// --- Pagination (Relay) ---

export interface PageInfo {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
}

export interface PostEdge {
    node: Post;
    cursor: string;
}

export interface PostsConnection {
    edges: PostEdge[];
    pageInfo: PageInfo;
}

// --- Idea ---

export interface Idea {
    id: string;
    organizationId: string;
    content: IdeaContent;
    groupId: string | null;
    position: number | null;
    createdAt: number; // Unix timestamp (NOT DateTime)
    updatedAt: number; // Unix timestamp (NOT DateTime)
}

export interface IdeaContent {
    title: string | null;
    text: string | null;
    media: IdeaMedia[] | null;
    tags: PublishingTag[];
    aiAssisted: boolean;
    services: Service[];
    date: DateTime | null;
}

export interface IdeaMedia {
    id: string;
    url: string;
    alt: string | null;
    thumbnailUrl: string | null;
    type: MediaType;
    size: number | null;
}

export interface PublishingTag {
    id: string;
    name: string;
    color: string;
}

// --- Daily Posting Limits ---

export interface DailyPostingLimitStatus {
    channelId: ChannelId;
    sent: number;
    scheduled: number;
    limit: number | null;
    isAtLimit: boolean;
}

// --- Mutation Responses ---

// Real API confirmed: PostActionPayload = PostActionSuccess | MutationError
// NOT VoidMutationError (iteration 18)
export interface PostActionSuccess {
    post: Post;
}

export interface MutationError {
    message: string;
}

// DeletePostPayload = DeletePostSuccess (no NotFoundError — confirmed iteration 18)
export interface DeletePostSuccess {
    __typename: 'DeletePostSuccess';
}

// CreateIdeaPayload = IdeaResponse | InvalidInputError | LimitReachedError | UnauthorizedError | UnexpectedError
export interface IdeaResponse {
    idea: Idea | null;
    refreshIdeas: boolean;
}

// --- GraphQL Response Wrappers ---

export interface GraphQLResponse<T> {
    data?: T;
    errors?: GraphQLError[];
}

export interface GraphQLError {
    message: string;
    locations?: Array<{ line: number; column: number }>;
    extensions?: {
        code?: string;
        window?: string;
        [key: string]: unknown;
    };
}

// --- Query Response Shapes ---

export interface AccountQueryResponse {
    account: Account;
}

export interface ChannelQueryResponse {
    channel: Channel;
}

export interface ChannelsQueryResponse {
    channels: Channel[];
}

export interface PostQueryResponse {
    post: Post;
}

export interface PostsQueryResponse {
    posts: PostsConnection;
}

export interface DailyPostingLimitsQueryResponse {
    dailyPostingLimits: DailyPostingLimitStatus[];
}

// --- Mutation Response Shapes ---

export interface CreatePostResponse {
    createPost: PostActionSuccess | MutationError;
}

export interface DeletePostResponse {
    deletePost: DeletePostSuccess | MutationError;
}

export interface CreateIdeaResponse {
    createIdea: IdeaResponse | MutationError;
}
