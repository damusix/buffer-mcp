import { z } from 'zod';

import type { ActionDefinition } from './registry.js';

const listOrganizationsSchema = z.object({});

const listChannelsSchema = z.object({
    organizationId: z.string().describe('The organization ID'),
    filter: z
        .object({
            isLocked: z.boolean().optional().describe('Filter by lock status'),
            product: z.string().optional().describe('Filter by product'),
        })
        .optional()
        .describe('Optional filter criteria'),
});

const getChannelSchema = z.object({
    channelId: z.string().describe('The channel ID'),
});

const listPostsSchema = z.object({
    organizationId: z.string().describe('The organization ID to list posts for'),
    first: z.number().optional().describe('Number of posts to return (default: 20)'),
    after: z.string().optional().describe('Pagination cursor from a previous response'),
    filter: z
        .object({
            status: z
                .array(z.enum(['draft', 'buffer', 'sent', 'failed']))
                .optional()
                .describe('Filter by post status'),
            channelIds: z.array(z.string()).optional().describe('Filter by channel IDs'),
            tagIds: z.array(z.string()).optional().describe('Filter by tag IDs'),
            dueAt: z
                .object({
                    start: z.string().optional().describe('Start date (ISO 8601)'),
                    end: z.string().optional().describe('End date (ISO 8601)'),
                })
                .optional()
                .describe('Filter by due date range'),
            createdAt: z
                .object({
                    start: z.string().optional().describe('Start date (ISO 8601)'),
                    end: z.string().optional().describe('End date (ISO 8601)'),
                })
                .optional()
                .describe('Filter by creation date range'),
        })
        .optional()
        .describe('Filter criteria'),
});

const getPostSchema = z.object({
    postId: z.string().describe('The post ID'),
});

const getDailyPostingLimitsSchema = z.object({
    channelIds: z.array(z.string()).min(1).describe('Array of channel IDs to check limits for'),
    date: z.string().optional().describe('ISO 8601 datetime to check, e.g. "2026-04-15T00:00:00.000Z" (defaults to today)'),
});

const POST_FIELDS = `
                    id text status via schedulingType isCustomScheduled
                    createdAt updatedAt dueAt sentAt
                    channelId channelService ideaId externalLink
                    sharedNow shareMode
                    tags { id name color }
                    notes { id text createdAt }
                    assets {
                        id type mimeType source thumbnail
                        ... on ImageAsset { image { altText width height isAnimated } }
                        ... on VideoAsset { video { durationMs } }
                    }
                    author { id email name }
                    error { message supportUrl rawError }
                    allowedActions`;

const CHANNEL_FIELDS = `
            id name displayName descriptor service type avatar timezone
            isDisconnected isLocked isNew isQueuePaused
            showTrendingTopicSuggestions hasActiveMemberDevice
            organizationId serviceId createdAt updatedAt
            allowedActions scopes
            externalLink
            products
            postingSchedule { day times paused }
            postingGoal { goal sentCount scheduledCount status periodStart periodEnd }
            linkShortening { isEnabled }`;

function buildListChannelsQuery(payload: Record<string, unknown>): string {
    const p = payload as z.infer<typeof listChannelsSchema>;
    let filterStr = '';
    if (p.filter) {
        const parts: string[] = [];
        if (p.filter.isLocked !== undefined) parts.push(`isLocked: ${p.filter.isLocked}`);
        if (p.filter.product !== undefined)
            parts.push(`product: ${JSON.stringify(p.filter.product)}`);
        if (parts.length) {
            filterStr = `, filter: { ${parts.join(', ')} }`;
        }
    }
    return `query {
        channels(input: {
            organizationId: "${p.organizationId}"${filterStr}
        }) {${CHANNEL_FIELDS}
        }
    }`;
}

function buildListPostsQuery(payload: Record<string, unknown>): string {
    const p = payload as z.infer<typeof listPostsSchema>;
    const first = p.first ?? 20;
    const afterStr = p.after ? `, after: "${p.after}"` : '';

    let filterStr = '';
    if (p.filter) {
        const parts: string[] = [];
        if (p.filter.status) {
            parts.push(`status: [${p.filter.status.join(', ')}]`);
        }
        if (p.filter.channelIds) {
            parts.push(`channelIds: ${JSON.stringify(p.filter.channelIds)}`);
        }
        if (p.filter.tagIds) {
            parts.push(`tagIds: ${JSON.stringify(p.filter.tagIds)}`);
        }
        if (p.filter.dueAt) {
            const dateParts: string[] = [];
            if (p.filter.dueAt.start) dateParts.push(`start: "${p.filter.dueAt.start}"`);
            if (p.filter.dueAt.end) dateParts.push(`end: "${p.filter.dueAt.end}"`);
            parts.push(`dueAt: { ${dateParts.join(', ')} }`);
        }
        if (p.filter.createdAt) {
            const dateParts: string[] = [];
            if (p.filter.createdAt.start) dateParts.push(`start: "${p.filter.createdAt.start}"`);
            if (p.filter.createdAt.end) dateParts.push(`end: "${p.filter.createdAt.end}"`);
            parts.push(`createdAt: { ${dateParts.join(', ')} }`);
        }
        if (parts.length) {
            filterStr = `, filter: { ${parts.join(', ')} }`;
        }
    }

    return `query {
        posts(
            first: ${first}${afterStr},
            input: {
                organizationId: "${p.organizationId}"${filterStr}
            }
        ) {
            edges {
                node {${POST_FIELDS}
                }
                cursor
            }
            pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
        }
    }`;
}

function buildGetDailyPostingLimitsQuery(payload: Record<string, unknown>): string {
    const p = payload as z.infer<typeof getDailyPostingLimitsSchema>;
    const dateStr = p.date ? `, date: "${p.date}"` : '';
    return `query {
        dailyPostingLimits(input: {
            channelIds: ${JSON.stringify(p.channelIds)}${dateStr}
        }) {
            channelId
            limit
            isAtLimit
            sent
            scheduled
        }
    }`;
}

export const queryActions: ActionDefinition[] = [
    {
        name: 'listOrganizations',
        category: 'query',
        graphqlQuery: `query {
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
}`,
        inputSchema: listOrganizationsSchema,
        description: 'List all organizations under the authenticated Buffer account',
        examples: [{ label: 'List all organizations', payload: {} }],
    },
    {
        name: 'listChannels',
        category: 'query',
        graphqlQuery: buildListChannelsQuery,
        inputSchema: listChannelsSchema,
        description: 'List all channels for an organization',
        examples: [
            {
                label: 'List all channels',
                payload: { organizationId: '68425e79e5105cb6432cc10f' },
            },
            {
                label: 'List only locked channels',
                payload: {
                    organizationId: '68425e79e5105cb6432cc10f',
                    filter: { isLocked: true },
                },
            },
            {
                label: 'Filter channels by product',
                payload: {
                    organizationId: '68425e79e5105cb6432cc10f',
                    filter: { product: 'publish' },
                },
            },
            {
                label: 'Combined filters',
                payload: {
                    organizationId: '68425e79e5105cb6432cc10f',
                    filter: { isLocked: false, product: 'publish' },
                },
            },
        ],
    },
    {
        name: 'getChannel',
        category: 'query',
        graphqlQuery: (payload) => {
            const p = payload as z.infer<typeof getChannelSchema>;
            return `query {
    channel(input: { id: "${p.channelId}" }) {${CHANNEL_FIELDS}
    }
}`;
        },
        inputSchema: getChannelSchema,
        description: 'Get detailed info about a specific channel by ID',
        examples: [
            { label: 'Get a channel by ID', payload: { channelId: '68426341d6d25b49a128217b' } },
        ],
    },
    {
        name: 'listPosts',
        category: 'query',
        graphqlQuery: buildListPostsQuery,
        inputSchema: listPostsSchema,
        description: 'List posts for an organization with optional filters and pagination',
        examples: [
            {
                label: 'Basic: first 10 posts',
                payload: {
                    organizationId: '68425e79e5105cb6432cc10f',
                    first: 10,
                },
            },
            {
                label: 'Paginated: next page',
                payload: {
                    organizationId: '68425e79e5105cb6432cc10f',
                    first: 20,
                    after: 'Y3Vyc29yOjE5',
                },
            },
            {
                label: 'Filter by status',
                payload: {
                    organizationId: '68425e79e5105cb6432cc10f',
                    filter: { status: ['draft', 'buffer'] },
                },
            },
            {
                label: 'Filter by channels and tags',
                payload: {
                    organizationId: '68425e79e5105cb6432cc10f',
                    filter: {
                        channelIds: ['68426341d6d25b49a128217b'],
                        tagIds: ['6842a1f3e5105cb6432cc222'],
                    },
                },
            },
            {
                label: 'Filter by date ranges',
                payload: {
                    organizationId: '68425e79e5105cb6432cc10f',
                    filter: {
                        dueAt: { start: '2026-04-01T00:00:00Z', end: '2026-04-30T23:59:59Z' },
                        createdAt: { start: '2026-03-01T00:00:00Z' },
                    },
                },
            },
            {
                label: 'All filters combined',
                payload: {
                    organizationId: '68425e79e5105cb6432cc10f',
                    first: 5,
                    filter: {
                        status: ['sent'],
                        channelIds: ['68426341d6d25b49a128217b'],
                        tagIds: ['6842a1f3e5105cb6432cc222'],
                        dueAt: { start: '2026-04-01T00:00:00Z', end: '2026-04-30T23:59:59Z' },
                        createdAt: { start: '2026-03-01T00:00:00Z', end: '2026-03-31T23:59:59Z' },
                    },
                },
            },
        ],
    },
    {
        name: 'getPost',
        category: 'query',
        graphqlQuery: (payload) => {
            const p = payload as z.infer<typeof getPostSchema>;
            return `query {
    post(input: { id: "${p.postId}" }) {${POST_FIELDS}
    }
}`;
        },
        inputSchema: getPostSchema,
        description: 'Get detailed info about a specific post by ID',
        examples: [{ label: 'Get a post by ID', payload: { postId: '69028ba74f51d522ca05aeed' } }],
    },
    {
        name: 'getDailyPostingLimits',
        category: 'query',
        graphqlQuery: buildGetDailyPostingLimitsQuery,
        inputSchema: getDailyPostingLimitsSchema,
        description: 'Check daily posting limits for specific channels',
        examples: [
            {
                label: 'Check limits for one channel (today)',
                payload: { channelIds: ['68426341d6d25b49a128217b'] },
            },
            {
                label: 'Check limits for multiple channels on a specific date',
                payload: {
                    channelIds: ['68426341d6d25b49a128217b', '690288cc669affb4c9915dda'],
                    date: '2026-04-15T00:00:00.000Z',
                },
            },
        ],
    },
];
