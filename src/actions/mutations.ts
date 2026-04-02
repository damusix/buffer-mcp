import { z } from 'zod';

import type { ActionDefinition } from './registry.js';

const createPostSchema = z.object({
    channelId: z.string().describe('The channel ID to post to'),
    text: z.string().optional().describe('The post text content'),
    schedulingType: z
        .enum(['automatic', 'notification'])
        .describe('Scheduling type: "automatic" or "notification"'),
    mode: z.enum(['addToQueue', 'shareNext', 'shareNow', 'customScheduled']).describe('Share mode'),
    saveToDraft: z
        .boolean()
        .optional()
        .describe('Set to true to save as draft instead of publishing'),
    dueAt: z
        .string()
        .optional()
        .describe('ISO 8601 date for customScheduled mode (required when mode is customScheduled)'),
    assets: z
        .object({
            images: z
                .array(
                    z.object({
                        url: z.string().describe('Image URL'),
                    }),
                )
                .optional()
                .describe('Image attachments'),
        })
        .optional()
        .describe('Media attachments'),
    tagIds: z.array(z.string()).optional().describe('Array of tag IDs to apply'),
});

const deletePostSchema = z.object({
    postId: z.string().describe('The ID of the post to delete'),
});

const createIdeaSchema = z.object({
    organizationId: z.string().describe('The organization ID'),
    content: z
        .object({
            title: z.string().optional().describe('Idea title'),
            text: z.string().optional().describe('Idea body text'),
            media: z
                .array(
                    z.object({
                        url: z.string().describe('Media URL'),
                        type: z.enum(['image', 'video']).describe('Media type'),
                        alt: z.string().optional().describe('Alt text'),
                    }),
                )
                .optional()
                .describe('Media attachments'),
        })
        .describe('Idea content'),
    tagIds: z.array(z.string()).optional().describe('Tag IDs to apply'),
});

function buildCreatePostMutation(payload: Record<string, unknown>): string {
    const p = payload as z.infer<typeof createPostSchema>;
    const parts: string[] = [];

    if (p.text !== undefined) parts.push(`text: ${JSON.stringify(p.text)}`);
    parts.push(`channelId: "${p.channelId}"`);
    parts.push(`schedulingType: ${p.schedulingType}`);
    parts.push(`mode: ${p.mode}`);
    if (p.saveToDraft) parts.push(`saveToDraft: true`);
    if (p.dueAt) parts.push(`dueAt: "${p.dueAt}"`);
    if (p.tagIds?.length) parts.push(`tagIds: ${JSON.stringify(p.tagIds)}`);
    if (p.assets?.images?.length) {
        const imgs = p.assets.images.map((i) => `{ url: ${JSON.stringify(i.url)} }`).join(', ');
        parts.push(`assets: { images: [${imgs}] }`);
    }

    return `mutation {
    createPost(input: {
        ${parts.join(',\n        ')}
    }) {
        ... on PostActionSuccess {
            post {
                id text status via shareMode channelId channelService
                dueAt sentAt createdAt
                tags { id name color }
                notes { id text createdAt }
                assets {
                    id type mimeType source thumbnail
                    ... on ImageAsset { image { altText width height isAnimated } }
                }
                allowedActions
            }
        }
        ... on MutationError {
            message
        }
    }
}`;
}

function buildCreateIdeaMutation(payload: Record<string, unknown>): string {
    const p = payload as z.infer<typeof createIdeaSchema>;
    const contentParts: string[] = [];

    if (p.content.title) contentParts.push(`title: ${JSON.stringify(p.content.title)}`);
    if (p.content.text) contentParts.push(`text: ${JSON.stringify(p.content.text)}`);
    if (p.content.media?.length) {
        const mediaItems = p.content.media
            .map((m) => {
                const mParts = [`url: ${JSON.stringify(m.url)}`, `type: ${m.type}`];
                if (m.alt) mParts.push(`alt: ${JSON.stringify(m.alt)}`);
                return `{ ${mParts.join(', ')} }`;
            })
            .join(', ');
        contentParts.push(`media: [${mediaItems}]`);
    }

    const tagStr = p.tagIds?.length ? `, tagIds: ${JSON.stringify(p.tagIds)}` : '';

    return `mutation {
    createIdea(input: {
        organizationId: "${p.organizationId}",
        content: { ${contentParts.join(', ')} }${tagStr}
    }) {
        ... on IdeaResponse {
            idea {
                id
                content { title text }
            }
        }
        ... on InvalidInputError { message }
        ... on LimitReachedError { message }
        ... on UnauthorizedError { message }
        ... on UnexpectedError { message }
    }
}`;
}

export const mutationActions: ActionDefinition[] = [
    {
        name: 'createPost',
        category: 'mutation',
        graphqlQuery: buildCreatePostMutation,
        inputSchema: createPostSchema,
        description: 'Create a new post (draft, queued, scheduled, or immediate)',
        examples: [
            {
                label: 'Add to queue',
                payload: {
                    channelId: '690288cc669affb4c9915dda',
                    text: 'Hello from the Buffer MCP!',
                    schedulingType: 'automatic',
                    mode: 'addToQueue',
                },
            },
            {
                label: 'Share immediately',
                payload: {
                    channelId: '690288cc669affb4c9915dda',
                    text: 'Breaking news — going live now!',
                    schedulingType: 'automatic',
                    mode: 'shareNow',
                },
            },
            {
                label: 'Share next in queue',
                payload: {
                    channelId: '690288cc669affb4c9915dda',
                    text: 'Jumping the line!',
                    schedulingType: 'automatic',
                    mode: 'shareNext',
                },
            },
            {
                label: 'Custom scheduled post',
                payload: {
                    channelId: '690288cc669affb4c9915dda',
                    text: 'Scheduled for a specific time.',
                    schedulingType: 'automatic',
                    mode: 'customScheduled',
                    dueAt: '2026-04-15T14:00:00Z',
                },
            },
            {
                label: 'Save as draft',
                payload: {
                    channelId: '690288cc669affb4c9915dda',
                    text: 'Still working on this one...',
                    schedulingType: 'automatic',
                    mode: 'addToQueue',
                    saveToDraft: true,
                },
            },
            {
                label: 'Post with image attachments',
                payload: {
                    channelId: '690288cc669affb4c9915dda',
                    text: 'Check out these photos!',
                    schedulingType: 'automatic',
                    mode: 'addToQueue',
                    assets: {
                        images: [
                            { url: 'https://example.com/photo1.jpg' },
                            { url: 'https://example.com/photo2.jpg' },
                        ],
                    },
                },
            },
            {
                label: 'Post with tags',
                payload: {
                    channelId: '690288cc669affb4c9915dda',
                    text: 'Tagged and organized.',
                    schedulingType: 'automatic',
                    mode: 'addToQueue',
                    tagIds: ['6842a1f3e5105cb6432cc222', '6842a1f3e5105cb6432cc333'],
                },
            },
            {
                label: 'Notification-based scheduling with images and tags',
                payload: {
                    channelId: '690288cc669affb4c9915dda',
                    text: 'Full-featured post.',
                    schedulingType: 'notification',
                    mode: 'customScheduled',
                    dueAt: '2026-05-01T09:00:00Z',
                    assets: {
                        images: [{ url: 'https://example.com/banner.png' }],
                    },
                    tagIds: ['6842a1f3e5105cb6432cc222'],
                },
            },
        ],
    },
    {
        name: 'deletePost',
        category: 'mutation',
        graphqlQuery: (payload) => {
            const p = payload as z.infer<typeof deletePostSchema>;
            return `mutation {
    deletePost(input: { id: "${p.postId}" }) {
        ... on DeletePostSuccess {
            __typename
        }
        ... on MutationError {
            message
        }
    }
}`;
        },
        inputSchema: deletePostSchema,
        description: 'Delete a post by ID',
        examples: [{ label: 'Delete a post', payload: { postId: '69cde75f64c20531e4a8edfa' } }],
    },
    {
        name: 'createIdea',
        category: 'mutation',
        graphqlQuery: buildCreateIdeaMutation,
        inputSchema: createIdeaSchema,
        description: "Create a new idea in an organization's idea board",
        examples: [
            {
                label: 'Text-only idea',
                payload: {
                    organizationId: '68425e79e5105cb6432cc10f',
                    content: {
                        title: 'Pool Maintenance Tips',
                        text: 'Share weekly pool maintenance tips.',
                    },
                },
            },
            {
                label: 'Idea with title only',
                payload: {
                    organizationId: '68425e79e5105cb6432cc10f',
                    content: { title: 'Blog post brainstorm' },
                },
            },
            {
                label: 'Idea with an image',
                payload: {
                    organizationId: '68425e79e5105cb6432cc10f',
                    content: {
                        title: 'Summer campaign visual',
                        text: 'Use this hero image for the summer campaign.',
                        media: [
                            {
                                url: 'https://example.com/summer-hero.jpg',
                                type: 'image',
                                alt: 'Summer pool party banner',
                            },
                        ],
                    },
                },
            },
            {
                label: 'Idea with a video',
                payload: {
                    organizationId: '68425e79e5105cb6432cc10f',
                    content: {
                        title: 'Product demo',
                        media: [{ url: 'https://example.com/demo.mp4', type: 'video' }],
                    },
                },
            },
            {
                label: 'Idea with mixed media and tags',
                payload: {
                    organizationId: '68425e79e5105cb6432cc10f',
                    content: {
                        title: 'Campaign assets',
                        text: 'Hero image and promo video for Q2.',
                        media: [
                            {
                                url: 'https://example.com/hero.jpg',
                                type: 'image',
                                alt: 'Q2 campaign hero',
                            },
                            { url: 'https://example.com/promo.mp4', type: 'video' },
                        ],
                    },
                    tagIds: ['6842a1f3e5105cb6432cc222'],
                },
            },
        ],
    },
];
