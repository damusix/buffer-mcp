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
                        thumbnailUrl: z.string().optional().describe('Thumbnail URL'),
                        metadata: z
                            .object({
                                altText: z.string().describe('Alt text for the image'),
                                animatedThumbnail: z
                                    .string()
                                    .optional()
                                    .describe('Animated thumbnail URL'),
                            })
                            .optional()
                            .describe('Image metadata'),
                    }),
                )
                .optional()
                .describe('Image attachments'),
            videos: z
                .array(
                    z.object({
                        url: z.string().describe('Video URL'),
                        thumbnailUrl: z.string().optional().describe('Thumbnail URL'),
                        metadata: z
                            .object({
                                thumbnailOffset: z
                                    .number()
                                    .optional()
                                    .describe('Thumbnail offset in milliseconds'),
                                title: z.string().optional().describe('Video title'),
                            })
                            .optional()
                            .describe('Video metadata'),
                    }),
                )
                .optional()
                .describe('Video attachments'),
            documents: z
                .array(
                    z.object({
                        url: z.string().describe('Document URL'),
                        title: z.string().describe('Document title'),
                        thumbnailUrl: z.string().describe('Document thumbnail URL'),
                    }),
                )
                .optional()
                .describe('Document attachments'),
            link: z
                .object({
                    url: z.string().describe('Link URL'),
                    title: z.string().optional().describe('Link title'),
                    description: z.string().optional().describe('Link description'),
                    thumbnailUrl: z.string().optional().describe('Link thumbnail URL'),
                })
                .optional()
                .describe('Link asset'),
        })
        .optional()
        .describe('Media attachments'),
    tagIds: z.array(z.string()).optional().describe('Array of tag IDs to apply'),
    metadata: z
        .object({
            instagram: z
                .object({
                    type: z.enum(['post', 'story', 'reel']).describe('Instagram post type'),
                    firstComment: z.string().optional().describe('First comment text'),
                    link: z.string().optional().describe('Link sticker URL'),
                    shouldShareToFeed: z.boolean().describe('Share reels/stories to feed'),
                })
                .optional()
                .describe('Instagram-specific metadata'),
            facebook: z
                .object({
                    type: z.enum(['post', 'story', 'reel']).describe('Facebook post type'),
                    firstComment: z.string().optional().describe('First comment text'),
                })
                .optional()
                .describe('Facebook-specific metadata'),
            linkedin: z
                .object({
                    firstComment: z.string().optional().describe('First comment text'),
                })
                .optional()
                .describe('LinkedIn-specific metadata'),
            twitter: z.object({}).optional().describe('Twitter/X-specific metadata'),
            pinterest: z
                .object({
                    title: z.string().optional().describe('Pin title'),
                    url: z.string().optional().describe('Pin destination URL'),
                    boardServiceId: z.string().describe('Pinterest board ID (required)'),
                })
                .optional()
                .describe('Pinterest-specific metadata'),
            google: z
                .object({
                    type: z
                        .enum(['post', 'offer', 'event', 'whatsNew'])
                        .describe('Google Business post type'),
                    title: z.string().optional().describe('Post title'),
                })
                .optional()
                .describe('Google Business-specific metadata'),
            youtube: z
                .object({
                    title: z.string().describe('Video title (required)'),
                    categoryId: z.string().describe('YouTube category ID (required)'),
                    privacy: z
                        .enum(['public', 'private', 'unlisted'])
                        .optional()
                        .describe('Privacy setting'),
                    license: z
                        .enum(['youtube', 'creativeCommon'])
                        .optional()
                        .describe('License type'),
                    notifySubscribers: z.boolean().optional().describe('Notify subscribers'),
                    embeddable: z.boolean().optional().describe('Allow embedding'),
                    madeForKids: z.boolean().optional().describe('Made for kids'),
                })
                .optional()
                .describe('YouTube-specific metadata'),
            mastodon: z
                .object({
                    spoilerText: z.string().optional().describe('Content warning text'),
                })
                .optional()
                .describe('Mastodon-specific metadata'),
            threads: z
                .object({
                    type: z
                        .enum(['post', 'story', 'reel'])
                        .optional()
                        .describe('Threads post type'),
                    topic: z.string().optional().describe('Topic'),
                    locationId: z.string().optional().describe('Location ID'),
                    locationName: z.string().optional().describe('Location name'),
                })
                .optional()
                .describe('Threads-specific metadata'),
            bluesky: z.object({}).optional().describe('Bluesky-specific metadata'),
            tiktok: z
                .object({
                    title: z.string().optional().describe('TikTok video title'),
                })
                .optional()
                .describe('TikTok-specific metadata'),
            startPage: z
                .object({
                    link: z.string().optional().describe('Start Page link'),
                })
                .optional()
                .describe('Start Page-specific metadata'),
        })
        .optional()
        .describe(
            'Platform-specific metadata (required for Instagram, Facebook, Pinterest, YouTube, Google Business)',
        ),
    ideaId: z.string().optional().describe('ID of an existing idea to create the post from'),
    draftId: z.string().optional().describe('ID of an existing draft to create the post from'),
    source: z.string().optional().describe('Source identifier for tracking post origin'),
    aiAssisted: z.boolean().optional().describe('Whether AI assisted in creating the post'),
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
                        thumbnailUrl: z.string().optional().describe('Thumbnail URL'),
                        size: z.number().optional().describe('File size in bytes'),
                    }),
                )
                .optional()
                .describe('Media attachments'),
            tags: z
                .array(
                    z.object({
                        id: z.string().describe('Tag ID'),
                        name: z.string().describe('Tag name'),
                        color: z.string().describe('Tag hex color'),
                    }),
                )
                .optional()
                .describe('Tags to apply'),
            aiAssisted: z.boolean().optional().describe('Whether AI assisted in creating the idea'),
            services: z
                .array(z.string())
                .optional()
                .describe('Target platform services (e.g. instagram, facebook)'),
            date: z.string().optional().describe('Target publish date (ISO 8601)'),
        })
        .describe('Idea content'),
    tagIds: z.array(z.string()).optional().describe('Tag IDs to apply'),
    cta: z.string().optional().describe('Call-to-action text'),
    group: z
        .object({
            groupId: z.string().describe('Group ID to place the idea in'),
            placeAfterId: z.string().optional().describe('Place after this idea ID'),
        })
        .optional()
        .describe('Idea group placement'),
    templateId: z.string().optional().describe('Template ID to create from'),
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
    if (p.ideaId) parts.push(`ideaId: "${p.ideaId}"`);
    if (p.draftId) parts.push(`draftId: "${p.draftId}"`);
    if (p.source) parts.push(`source: ${JSON.stringify(p.source)}`);
    if (p.aiAssisted !== undefined) parts.push(`aiAssisted: ${p.aiAssisted}`);
    if (p.assets) {
        const assetParts: string[] = [];

        if (p.assets.images?.length) {
            const imgs = p.assets.images
                .map((i) => {
                    const iParts: string[] = [`url: ${JSON.stringify(i.url)}`];
                    if (i.thumbnailUrl)
                        iParts.push(`thumbnailUrl: ${JSON.stringify(i.thumbnailUrl)}`);
                    if (i.metadata) {
                        const mParts: string[] = [`altText: ${JSON.stringify(i.metadata.altText)}`];
                        if (i.metadata.animatedThumbnail)
                            mParts.push(
                                `animatedThumbnail: ${JSON.stringify(i.metadata.animatedThumbnail)}`,
                            );
                        iParts.push(`metadata: { ${mParts.join(', ')} }`);
                    }
                    return `{ ${iParts.join(', ')} }`;
                })
                .join(', ');
            assetParts.push(`images: [${imgs}]`);
        }

        if (p.assets.videos?.length) {
            const vids = p.assets.videos
                .map((v) => {
                    const vParts: string[] = [`url: ${JSON.stringify(v.url)}`];
                    if (v.thumbnailUrl)
                        vParts.push(`thumbnailUrl: ${JSON.stringify(v.thumbnailUrl)}`);
                    if (v.metadata) {
                        const mParts: string[] = [];
                        if (v.metadata.thumbnailOffset !== undefined)
                            mParts.push(`thumbnailOffset: ${v.metadata.thumbnailOffset}`);
                        if (v.metadata.title)
                            mParts.push(`title: ${JSON.stringify(v.metadata.title)}`);
                        if (mParts.length) vParts.push(`metadata: { ${mParts.join(', ')} }`);
                    }
                    return `{ ${vParts.join(', ')} }`;
                })
                .join(', ');
            assetParts.push(`videos: [${vids}]`);
        }

        if (p.assets.documents?.length) {
            const docs = p.assets.documents
                .map(
                    (d) =>
                        `{ url: ${JSON.stringify(d.url)}, title: ${JSON.stringify(d.title)}, thumbnailUrl: ${JSON.stringify(d.thumbnailUrl)} }`,
                )
                .join(', ');
            assetParts.push(`documents: [${docs}]`);
        }

        if (p.assets.link) {
            const lParts: string[] = [`url: ${JSON.stringify(p.assets.link.url)}`];
            if (p.assets.link.title) lParts.push(`title: ${JSON.stringify(p.assets.link.title)}`);
            if (p.assets.link.description)
                lParts.push(`description: ${JSON.stringify(p.assets.link.description)}`);
            if (p.assets.link.thumbnailUrl)
                lParts.push(`thumbnailUrl: ${JSON.stringify(p.assets.link.thumbnailUrl)}`);
            assetParts.push(`link: { ${lParts.join(', ')} }`);
        }

        if (assetParts.length) parts.push(`assets: { ${assetParts.join(', ')} }`);
    }

    if (p.metadata) {
        const metaParts: string[] = [];

        if (p.metadata.instagram) {
            const ig = p.metadata.instagram;
            const igParts = [`type: ${ig.type}`, `shouldShareToFeed: ${ig.shouldShareToFeed}`];
            if (ig.firstComment) igParts.push(`firstComment: ${JSON.stringify(ig.firstComment)}`);
            if (ig.link) igParts.push(`link: ${JSON.stringify(ig.link)}`);
            metaParts.push(`instagram: { ${igParts.join(', ')} }`);
        }
        if (p.metadata.facebook) {
            const fb = p.metadata.facebook;
            const fbParts = [`type: ${fb.type}`];
            if (fb.firstComment) fbParts.push(`firstComment: ${JSON.stringify(fb.firstComment)}`);
            metaParts.push(`facebook: { ${fbParts.join(', ')} }`);
        }
        if (p.metadata.linkedin) {
            const li = p.metadata.linkedin;
            const liParts: string[] = [];
            if (li.firstComment) liParts.push(`firstComment: ${JSON.stringify(li.firstComment)}`);
            if (liParts.length) metaParts.push(`linkedin: { ${liParts.join(', ')} }`);
        }
        if (p.metadata.pinterest) {
            const pin = p.metadata.pinterest;
            const pinParts = [`boardServiceId: ${JSON.stringify(pin.boardServiceId)}`];
            if (pin.title) pinParts.push(`title: ${JSON.stringify(pin.title)}`);
            if (pin.url) pinParts.push(`url: ${JSON.stringify(pin.url)}`);
            metaParts.push(`pinterest: { ${pinParts.join(', ')} }`);
        }
        if (p.metadata.google) {
            const g = p.metadata.google;
            const gParts = [`type: ${g.type}`];
            if (g.title) gParts.push(`title: ${JSON.stringify(g.title)}`);
            metaParts.push(`google: { ${gParts.join(', ')} }`);
        }
        if (p.metadata.youtube) {
            const yt = p.metadata.youtube;
            const ytParts = [
                `title: ${JSON.stringify(yt.title)}`,
                `categoryId: ${JSON.stringify(yt.categoryId)}`,
            ];
            if (yt.privacy) ytParts.push(`privacy: ${yt.privacy}`);
            if (yt.license) ytParts.push(`license: ${yt.license}`);
            if (yt.notifySubscribers !== undefined)
                ytParts.push(`notifySubscribers: ${yt.notifySubscribers}`);
            if (yt.embeddable !== undefined) ytParts.push(`embeddable: ${yt.embeddable}`);
            if (yt.madeForKids !== undefined) ytParts.push(`madeForKids: ${yt.madeForKids}`);
            metaParts.push(`youtube: { ${ytParts.join(', ')} }`);
        }
        if (p.metadata.mastodon) {
            const m = p.metadata.mastodon;
            const mParts: string[] = [];
            if (m.spoilerText) mParts.push(`spoilerText: ${JSON.stringify(m.spoilerText)}`);
            if (mParts.length) metaParts.push(`mastodon: { ${mParts.join(', ')} }`);
        }
        if (p.metadata.threads) {
            const th = p.metadata.threads;
            const thParts: string[] = [];
            if (th.type) thParts.push(`type: ${th.type}`);
            if (th.topic) thParts.push(`topic: ${JSON.stringify(th.topic)}`);
            if (th.locationId) thParts.push(`locationId: ${JSON.stringify(th.locationId)}`);
            if (th.locationName) thParts.push(`locationName: ${JSON.stringify(th.locationName)}`);
            if (thParts.length) metaParts.push(`threads: { ${thParts.join(', ')} }`);
        }
        if (p.metadata.tiktok) {
            const tt = p.metadata.tiktok;
            const ttParts: string[] = [];
            if (tt.title) ttParts.push(`title: ${JSON.stringify(tt.title)}`);
            if (ttParts.length) metaParts.push(`tiktok: { ${ttParts.join(', ')} }`);
        }
        if (p.metadata.startPage) {
            const sp = p.metadata.startPage;
            const spParts: string[] = [];
            if (sp.link) spParts.push(`link: ${JSON.stringify(sp.link)}`);
            if (spParts.length) metaParts.push(`startPage: { ${spParts.join(', ')} }`);
        }

        if (metaParts.length) {
            parts.push(`metadata: { ${metaParts.join(', ')} }`);
        }
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
                    ... on VideoAsset { video { durationMs width height } }
                    ... on DocumentAsset { document { filesize numPages } }
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
                if (m.thumbnailUrl) mParts.push(`thumbnailUrl: ${JSON.stringify(m.thumbnailUrl)}`);
                if (m.size !== undefined) mParts.push(`size: ${m.size}`);
                return `{ ${mParts.join(', ')} }`;
            })
            .join(', ');
        contentParts.push(`media: [${mediaItems}]`);
    }
    if (p.content.tags?.length) {
        const tagItems = p.content.tags
            .map(
                (t) =>
                    `{ id: ${JSON.stringify(t.id)}, name: ${JSON.stringify(t.name)}, color: ${JSON.stringify(t.color)} }`,
            )
            .join(', ');
        contentParts.push(`tags: [${tagItems}]`);
    }
    if (p.content.aiAssisted !== undefined)
        contentParts.push(`aiAssisted: ${p.content.aiAssisted}`);
    if (p.content.services?.length) {
        contentParts.push(`services: [${p.content.services.join(', ')}]`);
    }
    if (p.content.date) contentParts.push(`date: ${JSON.stringify(p.content.date)}`);

    const extraParts: string[] = [];
    if (p.tagIds?.length) extraParts.push(`tagIds: ${JSON.stringify(p.tagIds)}`);
    if (p.cta) extraParts.push(`cta: ${JSON.stringify(p.cta)}`);
    if (p.group) {
        const gParts = [`groupId: ${JSON.stringify(p.group.groupId)}`];
        if (p.group.placeAfterId)
            gParts.push(`placeAfterId: ${JSON.stringify(p.group.placeAfterId)}`);
        extraParts.push(`group: { ${gParts.join(', ')} }`);
    }
    if (p.templateId) extraParts.push(`templateId: ${JSON.stringify(p.templateId)}`);

    const extraStr = extraParts.length ? `, ${extraParts.join(', ')}` : '';

    return `mutation {
    createIdea(input: {
        organizationId: "${p.organizationId}",
        content: { ${contentParts.join(', ')} }${extraStr}
    }) {
        ... on IdeaResponse {
            idea {
                id
                content { title text tags { id name color } services date }
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
            {
                label: 'Instagram reel',
                payload: {
                    channelId: '690288cc669affb4c9915dda',
                    text: 'Watch this!',
                    schedulingType: 'automatic',
                    mode: 'addToQueue',
                    assets: { videos: [{ url: 'https://example.com/reel.mp4' }] },
                    metadata: { instagram: { type: 'reel', shouldShareToFeed: true } },
                },
            },
            {
                label: 'Facebook post with image',
                payload: {
                    channelId: '690288cc669affb4c9915dda',
                    text: 'Check this out!',
                    schedulingType: 'automatic',
                    mode: 'addToQueue',
                    assets: {
                        images: [
                            {
                                url: 'https://example.com/photo.jpg',
                                metadata: { altText: 'A great photo' },
                            },
                        ],
                    },
                    metadata: { facebook: { type: 'post' } },
                },
            },
            {
                label: 'Pinterest pin',
                payload: {
                    channelId: '690288cc669affb4c9915dda',
                    schedulingType: 'automatic',
                    mode: 'addToQueue',
                    assets: { images: [{ url: 'https://example.com/pin.jpg' }] },
                    metadata: { pinterest: { boardServiceId: 'board123', title: 'Summer vibes' } },
                },
            },
            {
                label: 'YouTube video upload',
                payload: {
                    channelId: '690288cc669affb4c9915dda',
                    schedulingType: 'automatic',
                    mode: 'addToQueue',
                    assets: { videos: [{ url: 'https://example.com/video.mp4' }] },
                    metadata: {
                        youtube: { title: 'My Video', categoryId: '22', privacy: 'public' },
                    },
                },
            },
            {
                label: 'Post created from an existing idea',
                payload: {
                    channelId: '690288cc669affb4c9915dda',
                    text: 'From the idea board.',
                    schedulingType: 'automatic',
                    mode: 'addToQueue',
                    ideaId: '68425e79e5105cb6432cc999',
                },
            },
            {
                label: 'Post with document attachment',
                payload: {
                    channelId: '690288cc669affb4c9915dda',
                    text: 'Download our guide!',
                    schedulingType: 'automatic',
                    mode: 'addToQueue',
                    assets: {
                        documents: [
                            {
                                url: 'https://example.com/guide.pdf',
                                title: 'Pool Maintenance Guide',
                                thumbnailUrl: 'https://example.com/guide-cover.jpg',
                            },
                        ],
                    },
                },
            },
            {
                label: 'Post with link attachment',
                payload: {
                    channelId: '690288cc669affb4c9915dda',
                    text: 'Great read!',
                    schedulingType: 'automatic',
                    mode: 'addToQueue',
                    assets: {
                        link: {
                            url: 'https://example.com/article',
                            title: 'Pool Maintenance Tips',
                            description: 'Everything you need to know.',
                        },
                    },
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
            {
                label: 'Idea with tags and target services',
                payload: {
                    organizationId: '68425e79e5105cb6432cc10f',
                    content: {
                        title: 'Cross-platform campaign',
                        text: 'Launch on Instagram and Facebook.',
                        tags: [{ id: 'tag1', name: 'Campaign', color: '#FF5733' }],
                        services: ['instagram', 'facebook'],
                        date: '2026-05-01T09:00:00Z',
                    },
                },
            },
            {
                label: 'Idea placed in a group',
                payload: {
                    organizationId: '68425e79e5105cb6432cc10f',
                    content: { title: 'Grouped idea' },
                    group: { groupId: 'grp1' },
                },
            },
        ],
    },
];
