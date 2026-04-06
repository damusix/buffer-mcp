import { describe, it, expect, beforeAll } from 'vitest';

import { mutationActions } from '../../actions/mutations.js';
import { registerActions, getAction } from '../../actions/registry.js';

beforeAll(() => {
    registerActions(mutationActions);
});

describe('Mutation Actions', () => {
    describe('createPost', () => {
        it('is registered with correct metadata', () => {
            const action = getAction('createPost');
            expect(action).toBeDefined();
            expect(action!.category).toBe('mutation');
            expect(action!.description).toContain('post');
        });

        it('has a builder function for graphqlQuery', () => {
            const action = getAction('createPost')!;
            expect(typeof action.graphqlQuery).toBe('function');
        });

        it('requires channelId, schedulingType, and mode', () => {
            const action = getAction('createPost')!;

            const empty = action.inputSchema.safeParse({});
            expect(empty.success).toBe(false);

            const missingMode = action.inputSchema.safeParse({
                channelId: 'ch1',
                schedulingType: 'automatic',
            });
            expect(missingMode.success).toBe(false);

            const missingSchedulingType = action.inputSchema.safeParse({
                channelId: 'ch1',
                mode: 'addToQueue',
            });
            expect(missingSchedulingType.success).toBe(false);

            const missingChannelId = action.inputSchema.safeParse({
                schedulingType: 'automatic',
                mode: 'addToQueue',
            });
            expect(missingChannelId.success).toBe(false);
        });

        it('accepts minimal valid payload', () => {
            const action = getAction('createPost')!;
            const result = action.inputSchema.safeParse({
                channelId: '690288cc669affb4c9915dda',
                schedulingType: 'automatic',
                mode: 'addToQueue',
            });
            expect(result.success).toBe(true);
        });

        it('accepts full payload with all optional fields', () => {
            const action = getAction('createPost')!;
            const result = action.inputSchema.safeParse({
                channelId: '690288cc669affb4c9915dda',
                text: 'Hello!',
                schedulingType: 'notification',
                mode: 'customScheduled',
                saveToDraft: true,
                dueAt: '2026-04-10T14:00:00.000Z',
                assets: { images: [{ url: 'https://example.com/img.jpg' }] },
                tagIds: ['tag1', 'tag2'],
            });
            expect(result.success).toBe(true);
        });

        it('rejects invalid schedulingType values', () => {
            const action = getAction('createPost')!;
            const result = action.inputSchema.safeParse({
                channelId: 'ch1',
                schedulingType: 'automatic_publishing',
                mode: 'addToQueue',
            });
            expect(result.success).toBe(false);
        });

        it('rejects invalid mode values', () => {
            const action = getAction('createPost')!;
            const result = action.inputSchema.safeParse({
                channelId: 'ch1',
                schedulingType: 'automatic',
                mode: 'invalidMode',
            });
            expect(result.success).toBe(false);
        });

        it('builds mutation with minimal payload', () => {
            const action = getAction('createPost')!;
            const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
            const query = builder({
                channelId: '690288cc669affb4c9915dda',
                schedulingType: 'automatic',
                mode: 'addToQueue',
            });
            expect(query).toContain('mutation');
            expect(query).toContain('createPost(input:');
            expect(query).toContain('channelId: "690288cc669affb4c9915dda"');
            expect(query).toContain('schedulingType: automatic');
            expect(query).toContain('mode: addToQueue');
            // Input section should not contain optional input fields
            const inputMatch = query.match(/createPost\(input:\s*\{([\s\S]*?)\}\)\s*\{/);
            expect(inputMatch).not.toBeNull();
            const inputBlock = inputMatch![1];
            expect(inputBlock).not.toContain('text:');
            expect(inputBlock).not.toContain('saveToDraft');
            expect(inputBlock).not.toContain('tagIds');
            expect(inputBlock).not.toContain('assets');
        });

        it('builds mutation with text', () => {
            const action = getAction('createPost')!;
            const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
            const query = builder({
                channelId: 'ch1',
                text: 'Hello from Buffer MCP!',
                schedulingType: 'automatic',
                mode: 'addToQueue',
            });
            expect(query).toContain('text: "Hello from Buffer MCP!"');
        });

        it('builds mutation with saveToDraft flag', () => {
            const action = getAction('createPost')!;
            const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
            const query = builder({
                channelId: 'ch1',
                schedulingType: 'automatic',
                mode: 'addToQueue',
                saveToDraft: true,
            });
            expect(query).toContain('saveToDraft: true');
        });

        it('does not include saveToDraft when false', () => {
            const action = getAction('createPost')!;
            const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
            const query = builder({
                channelId: 'ch1',
                schedulingType: 'automatic',
                mode: 'addToQueue',
                saveToDraft: false,
            });
            expect(query).not.toContain('saveToDraft');
        });

        it('builds mutation with dueAt for customScheduled mode', () => {
            const action = getAction('createPost')!;
            const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
            const query = builder({
                channelId: 'ch1',
                schedulingType: 'automatic',
                mode: 'customScheduled',
                dueAt: '2026-04-10T14:00:00.000Z',
            });
            expect(query).toContain('mode: customScheduled');
            expect(query).toContain('dueAt: "2026-04-10T14:00:00.000Z"');
        });

        it('builds mutation with tagIds', () => {
            const action = getAction('createPost')!;
            const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
            const query = builder({
                channelId: 'ch1',
                schedulingType: 'automatic',
                mode: 'addToQueue',
                tagIds: ['tag1', 'tag2'],
            });
            expect(query).toContain('tagIds: ["tag1","tag2"]');
        });

        it('builds mutation with image assets', () => {
            const action = getAction('createPost')!;
            const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
            const query = builder({
                channelId: 'ch1',
                schedulingType: 'automatic',
                mode: 'addToQueue',
                assets: {
                    images: [
                        { url: 'https://example.com/pool.jpg' },
                        { url: 'https://example.com/pool2.jpg' },
                    ],
                },
            });
            expect(query).toContain('assets: { images: [');
            expect(query).toContain('url: "https://example.com/pool.jpg"');
            expect(query).toContain('url: "https://example.com/pool2.jpg"');
        });

        it('accepts image assets with thumbnailUrl and metadata', () => {
            const action = getAction('createPost')!;
            const result = action.inputSchema.safeParse({
                channelId: 'ch1',
                schedulingType: 'automatic',
                mode: 'addToQueue',
                assets: {
                    images: [
                        {
                            url: 'https://example.com/img.jpg',
                            thumbnailUrl: 'https://example.com/thumb.jpg',
                            metadata: {
                                altText: 'A nice image',
                                animatedThumbnail: 'https://example.com/anim.gif',
                            },
                        },
                    ],
                },
            });
            expect(result.success).toBe(true);
        });

        it('builds mutation with image thumbnailUrl and metadata', () => {
            const action = getAction('createPost')!;
            const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
            const query = builder({
                channelId: 'ch1',
                schedulingType: 'automatic',
                mode: 'addToQueue',
                assets: {
                    images: [
                        {
                            url: 'https://example.com/img.jpg',
                            thumbnailUrl: 'https://example.com/thumb.jpg',
                            metadata: {
                                altText: 'A nice image',
                                animatedThumbnail: 'https://example.com/anim.gif',
                            },
                        },
                    ],
                },
            });
            expect(query).toContain('assets: { images: [');
            expect(query).toContain('url: "https://example.com/img.jpg"');
            expect(query).toContain('thumbnailUrl: "https://example.com/thumb.jpg"');
            expect(query).toContain('altText: "A nice image"');
            expect(query).toContain('animatedThumbnail: "https://example.com/anim.gif"');
        });

        it('accepts video assets', () => {
            const action = getAction('createPost')!;
            const result = action.inputSchema.safeParse({
                channelId: 'ch1',
                schedulingType: 'automatic',
                mode: 'addToQueue',
                assets: {
                    videos: [
                        {
                            url: 'https://example.com/video.mp4',
                            thumbnailUrl: 'https://example.com/video-thumb.jpg',
                            metadata: { thumbnailOffset: 5000, title: 'My Video' },
                        },
                    ],
                },
            });
            expect(result.success).toBe(true);
        });

        it('builds mutation with video assets', () => {
            const action = getAction('createPost')!;
            const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
            const query = builder({
                channelId: 'ch1',
                schedulingType: 'automatic',
                mode: 'addToQueue',
                assets: {
                    videos: [
                        {
                            url: 'https://example.com/video.mp4',
                            thumbnailUrl: 'https://example.com/video-thumb.jpg',
                            metadata: { thumbnailOffset: 5000, title: 'My Video' },
                        },
                    ],
                },
            });
            expect(query).toContain('assets: { videos: [');
            expect(query).toContain('url: "https://example.com/video.mp4"');
            expect(query).toContain('thumbnailUrl: "https://example.com/video-thumb.jpg"');
            expect(query).toContain('thumbnailOffset: 5000');
            expect(query).toContain('title: "My Video"');
        });

        it('accepts document assets', () => {
            const action = getAction('createPost')!;
            const result = action.inputSchema.safeParse({
                channelId: 'ch1',
                schedulingType: 'automatic',
                mode: 'addToQueue',
                assets: {
                    documents: [
                        {
                            url: 'https://example.com/doc.pdf',
                            title: 'My Document',
                            thumbnailUrl: 'https://example.com/doc-thumb.jpg',
                        },
                    ],
                },
            });
            expect(result.success).toBe(true);
        });

        it('builds mutation with document assets', () => {
            const action = getAction('createPost')!;
            const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
            const query = builder({
                channelId: 'ch1',
                schedulingType: 'automatic',
                mode: 'addToQueue',
                assets: {
                    documents: [
                        {
                            url: 'https://example.com/doc.pdf',
                            title: 'My Document',
                            thumbnailUrl: 'https://example.com/doc-thumb.jpg',
                        },
                    ],
                },
            });
            expect(query).toContain('assets: { documents: [');
            expect(query).toContain('url: "https://example.com/doc.pdf"');
            expect(query).toContain('title: "My Document"');
            expect(query).toContain('thumbnailUrl: "https://example.com/doc-thumb.jpg"');
        });

        it('accepts link asset', () => {
            const action = getAction('createPost')!;
            const result = action.inputSchema.safeParse({
                channelId: 'ch1',
                schedulingType: 'automatic',
                mode: 'addToQueue',
                assets: {
                    link: {
                        url: 'https://example.com/article',
                        title: 'Great Article',
                        description: 'A must-read article.',
                        thumbnailUrl: 'https://example.com/article-thumb.jpg',
                    },
                },
            });
            expect(result.success).toBe(true);
        });

        it('builds mutation with link asset', () => {
            const action = getAction('createPost')!;
            const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
            const query = builder({
                channelId: 'ch1',
                schedulingType: 'automatic',
                mode: 'addToQueue',
                assets: {
                    link: {
                        url: 'https://example.com/article',
                        title: 'Great Article',
                        description: 'A must-read article.',
                        thumbnailUrl: 'https://example.com/article-thumb.jpg',
                    },
                },
            });
            expect(query).toContain('assets: { link: {');
            expect(query).toContain('url: "https://example.com/article"');
            expect(query).toContain('title: "Great Article"');
            expect(query).toContain('description: "A must-read article."');
            expect(query).toContain('thumbnailUrl: "https://example.com/article-thumb.jpg"');
        });

        it('includes PostActionSuccess and MutationError response fragments', () => {
            const action = getAction('createPost')!;
            const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
            const query = builder({
                channelId: 'ch1',
                schedulingType: 'automatic',
                mode: 'addToQueue',
            });
            expect(query).toContain('... on PostActionSuccess');
            expect(query).toContain('... on MutationError');
            expect(query).toContain('post {');
            expect(query).toContain('id text status via shareMode channelId channelService');
            expect(query).toContain('tags { id name color }');
            expect(query).toContain('notes { id text createdAt }');
            expect(query).toContain('assets');
            expect(query).toContain('allowedActions');
            expect(query).toContain('message');
        });

        it('passes enum values as bare identifiers (not quoted)', () => {
            const action = getAction('createPost')!;
            const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
            const query = builder({
                channelId: 'ch1',
                schedulingType: 'notification',
                mode: 'shareNow',
            });
            // Enums should NOT be quoted in GraphQL
            expect(query).toContain('schedulingType: notification');
            expect(query).not.toContain('schedulingType: "notification"');
            expect(query).toContain('mode: shareNow');
            expect(query).not.toContain('mode: "shareNow"');
        });

        it('accepts Instagram metadata with type', () => {
            const action = getAction('createPost')!;
            const result = action.inputSchema.safeParse({
                channelId: 'ch1',
                schedulingType: 'automatic',
                mode: 'addToQueue',
                metadata: { instagram: { type: 'post', shouldShareToFeed: true } },
            });
            expect(result.success).toBe(true);
        });

        it('accepts Instagram reel with firstComment', () => {
            const action = getAction('createPost')!;
            const result = action.inputSchema.safeParse({
                channelId: 'ch1',
                schedulingType: 'automatic',
                mode: 'addToQueue',
                metadata: {
                    instagram: { type: 'reel', shouldShareToFeed: true, firstComment: 'Nice!' },
                },
            });
            expect(result.success).toBe(true);
        });

        it('rejects invalid Instagram type', () => {
            const action = getAction('createPost')!;
            const result = action.inputSchema.safeParse({
                channelId: 'ch1',
                schedulingType: 'automatic',
                mode: 'addToQueue',
                metadata: { instagram: { type: 'invalid', shouldShareToFeed: false } },
            });
            expect(result.success).toBe(false);
        });

        it('accepts Facebook metadata with type', () => {
            const action = getAction('createPost')!;
            const result = action.inputSchema.safeParse({
                channelId: 'ch1',
                schedulingType: 'automatic',
                mode: 'addToQueue',
                metadata: { facebook: { type: 'post' } },
            });
            expect(result.success).toBe(true);
        });

        it('accepts LinkedIn metadata with firstComment', () => {
            const action = getAction('createPost')!;
            const result = action.inputSchema.safeParse({
                channelId: 'ch1',
                schedulingType: 'automatic',
                mode: 'addToQueue',
                metadata: { linkedin: { firstComment: 'Great post!' } },
            });
            expect(result.success).toBe(true);
        });

        it('accepts Pinterest metadata with boardServiceId', () => {
            const action = getAction('createPost')!;
            const result = action.inputSchema.safeParse({
                channelId: 'ch1',
                schedulingType: 'automatic',
                mode: 'addToQueue',
                metadata: { pinterest: { boardServiceId: 'board123' } },
            });
            expect(result.success).toBe(true);
        });

        it('accepts YouTube metadata with required fields', () => {
            const action = getAction('createPost')!;
            const result = action.inputSchema.safeParse({
                channelId: 'ch1',
                schedulingType: 'automatic',
                mode: 'addToQueue',
                metadata: { youtube: { title: 'My Video', categoryId: '22' } },
            });
            expect(result.success).toBe(true);
        });

        it('accepts Google Business metadata with type', () => {
            const action = getAction('createPost')!;
            const result = action.inputSchema.safeParse({
                channelId: 'ch1',
                schedulingType: 'automatic',
                mode: 'addToQueue',
                metadata: { google: { type: 'offer' } },
            });
            expect(result.success).toBe(true);
        });

        it('builds mutation with Instagram metadata', () => {
            const action = getAction('createPost')!;
            const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
            const query = builder({
                channelId: 'ch1',
                schedulingType: 'automatic',
                mode: 'addToQueue',
                metadata: {
                    instagram: { type: 'reel', shouldShareToFeed: true, firstComment: 'Nice!' },
                },
            });
            expect(query).toContain('metadata: {');
            expect(query).toContain('instagram: {');
            expect(query).toContain('type: reel');
            expect(query).not.toContain('type: "reel"');
            expect(query).toContain('shouldShareToFeed: true');
            expect(query).toContain('firstComment: "Nice!"');
        });

        it('builds mutation with Facebook metadata', () => {
            const action = getAction('createPost')!;
            const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
            const query = builder({
                channelId: 'ch1',
                schedulingType: 'automatic',
                mode: 'addToQueue',
                metadata: { facebook: { type: 'reel', firstComment: 'Check it out' } },
            });
            expect(query).toContain('facebook: {');
            expect(query).toContain('type: reel');
            expect(query).not.toContain('type: "reel"');
            expect(query).toContain('firstComment: "Check it out"');
        });

        it('builds mutation with Pinterest metadata', () => {
            const action = getAction('createPost')!;
            const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
            const query = builder({
                channelId: 'ch1',
                schedulingType: 'automatic',
                mode: 'addToQueue',
                metadata: {
                    pinterest: {
                        boardServiceId: 'board123',
                        title: 'Pin Title',
                        url: 'https://example.com',
                    },
                },
            });
            expect(query).toContain('pinterest: {');
            expect(query).toContain('boardServiceId: "board123"');
            expect(query).toContain('title: "Pin Title"');
            expect(query).toContain('url: "https://example.com"');
        });

        it('builds mutation with YouTube metadata', () => {
            const action = getAction('createPost')!;
            const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
            const query = builder({
                channelId: 'ch1',
                schedulingType: 'automatic',
                mode: 'addToQueue',
                metadata: {
                    youtube: {
                        title: 'My Video',
                        categoryId: '22',
                        privacy: 'public',
                        madeForKids: false,
                    },
                },
            });
            expect(query).toContain('youtube: {');
            expect(query).toContain('title: "My Video"');
            expect(query).toContain('categoryId: "22"');
            expect(query).toContain('privacy: public');
            expect(query).not.toContain('privacy: "public"');
            expect(query).toContain('madeForKids: false');
        });

        it('builds mutation with Google Business metadata', () => {
            const action = getAction('createPost')!;
            const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
            const query = builder({
                channelId: 'ch1',
                schedulingType: 'automatic',
                mode: 'addToQueue',
                metadata: { google: { type: 'event', title: 'Grand Opening' } },
            });
            expect(query).toContain('google: {');
            expect(query).toContain('type: event');
            expect(query).not.toContain('type: "event"');
            expect(query).toContain('title: "Grand Opening"');
        });

        it('builds mutation with Mastodon metadata', () => {
            const action = getAction('createPost')!;
            const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
            const query = builder({
                channelId: 'ch1',
                schedulingType: 'automatic',
                mode: 'addToQueue',
                metadata: { mastodon: { spoilerText: 'Content warning' } },
            });
            expect(query).toContain('mastodon: {');
            expect(query).toContain('spoilerText: "Content warning"');
        });

        it('builds mutation with TikTok metadata', () => {
            const action = getAction('createPost')!;
            const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
            const query = builder({
                channelId: 'ch1',
                schedulingType: 'automatic',
                mode: 'addToQueue',
                metadata: { tiktok: { title: 'My TikTok' } },
            });
            expect(query).toContain('tiktok: {');
            expect(query).toContain('title: "My TikTok"');
        });

        it('accepts ideaId field', () => {
            const action = getAction('createPost')!;
            const result = action.inputSchema.safeParse({
                channelId: 'ch1',
                schedulingType: 'automatic',
                mode: 'addToQueue',
                ideaId: 'idea123',
            });
            expect(result.success).toBe(true);
        });

        it('builds mutation with ideaId', () => {
            const action = getAction('createPost')!;
            const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
            const query = builder({
                channelId: 'ch1',
                schedulingType: 'automatic',
                mode: 'addToQueue',
                ideaId: 'idea123',
            });
            expect(query).toContain('ideaId: "idea123"');
        });

        it('accepts draftId field', () => {
            const action = getAction('createPost')!;
            const result = action.inputSchema.safeParse({
                channelId: 'ch1',
                schedulingType: 'automatic',
                mode: 'addToQueue',
                draftId: 'draft456',
            });
            expect(result.success).toBe(true);
        });

        it('builds mutation with draftId', () => {
            const action = getAction('createPost')!;
            const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
            const query = builder({
                channelId: 'ch1',
                schedulingType: 'automatic',
                mode: 'addToQueue',
                draftId: 'draft456',
            });
            expect(query).toContain('draftId: "draft456"');
        });

        it('accepts source and aiAssisted fields', () => {
            const action = getAction('createPost')!;
            const result = action.inputSchema.safeParse({
                channelId: 'ch1',
                schedulingType: 'automatic',
                mode: 'addToQueue',
                source: 'mcp',
                aiAssisted: true,
            });
            expect(result.success).toBe(true);
        });

        it('builds mutation with source and aiAssisted', () => {
            const action = getAction('createPost')!;
            const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
            const query = builder({
                channelId: 'ch1',
                schedulingType: 'automatic',
                mode: 'addToQueue',
                source: 'mcp',
                aiAssisted: true,
            });
            expect(query).toContain('source: "mcp"');
            expect(query).toContain('aiAssisted: true');
        });
    });

    describe('deletePost', () => {
        it('is registered with correct metadata', () => {
            const action = getAction('deletePost');
            expect(action).toBeDefined();
            expect(action!.category).toBe('mutation');
            expect(action!.description).toContain('elete');
        });

        it('requires postId', () => {
            const action = getAction('deletePost')!;
            const result = action.inputSchema.safeParse({});
            expect(result.success).toBe(false);
        });

        it('accepts valid postId', () => {
            const action = getAction('deletePost')!;
            const result = action.inputSchema.safeParse({
                postId: '69cde772a6fd7aa9192de922',
            });
            expect(result.success).toBe(true);
        });

        it('builds mutation with post ID in input', () => {
            const action = getAction('deletePost')!;
            const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
            const query = builder({ postId: '69cde772a6fd7aa9192de922' });
            expect(query).toContain('mutation');
            expect(query).toContain('deletePost(input: { id: "69cde772a6fd7aa9192de922" })');
        });

        it('includes DeletePostSuccess and MutationError response fragments', () => {
            const action = getAction('deletePost')!;
            const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
            const query = builder({ postId: 'post123' });
            expect(query).toContain('... on DeletePostSuccess');
            expect(query).toContain('__typename');
            expect(query).toContain('... on MutationError');
            expect(query).toContain('message');
        });

        it('does NOT include NotFoundError fragment', () => {
            const action = getAction('deletePost')!;
            const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
            const query = builder({ postId: 'post123' });
            expect(query).not.toContain('NotFoundError');
        });
    });

    describe('createIdea', () => {
        it('is registered with correct metadata', () => {
            const action = getAction('createIdea');
            expect(action).toBeDefined();
            expect(action!.category).toBe('mutation');
            expect(action!.description).toContain('idea');
        });

        it('requires organizationId and content', () => {
            const action = getAction('createIdea')!;

            const empty = action.inputSchema.safeParse({});
            expect(empty.success).toBe(false);

            const missingContent = action.inputSchema.safeParse({
                organizationId: 'org123',
            });
            expect(missingContent.success).toBe(false);

            const missingOrgId = action.inputSchema.safeParse({
                content: { title: 'Test' },
            });
            expect(missingOrgId.success).toBe(false);
        });

        it('accepts minimal valid payload', () => {
            const action = getAction('createIdea')!;
            const result = action.inputSchema.safeParse({
                organizationId: '68425e79e5105cb6432cc10f',
                content: {},
            });
            expect(result.success).toBe(true);
        });

        it('accepts full payload with all optional fields', () => {
            const action = getAction('createIdea')!;
            const result = action.inputSchema.safeParse({
                organizationId: '68425e79e5105cb6432cc10f',
                content: {
                    title: 'Pool Tips',
                    text: 'Weekly maintenance tips.',
                    media: [{ url: 'https://example.com/pool.jpg', type: 'image', alt: 'A pool' }],
                },
                tagIds: ['tag1'],
            });
            expect(result.success).toBe(true);
        });

        it('rejects invalid media type', () => {
            const action = getAction('createIdea')!;
            const result = action.inputSchema.safeParse({
                organizationId: 'org123',
                content: {
                    media: [{ url: 'https://example.com/file.pdf', type: 'pdf' }],
                },
            });
            expect(result.success).toBe(false);
        });

        it('builds mutation with title and text', () => {
            const action = getAction('createIdea')!;
            const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
            const query = builder({
                organizationId: '68425e79e5105cb6432cc10f',
                content: {
                    title: 'Pool Maintenance Tips',
                    text: 'Share weekly tips.',
                },
            });
            expect(query).toContain('mutation');
            expect(query).toContain('createIdea(input:');
            expect(query).toContain('organizationId: "68425e79e5105cb6432cc10f"');
            expect(query).toContain('title: "Pool Maintenance Tips"');
            expect(query).toContain('text: "Share weekly tips."');
        });

        it('builds mutation with media attachments', () => {
            const action = getAction('createIdea')!;
            const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
            const query = builder({
                organizationId: 'org123',
                content: {
                    title: 'Summer Promo',
                    media: [
                        {
                            url: 'https://example.com/summer.jpg',
                            type: 'image',
                            alt: 'Summer pool',
                        },
                    ],
                },
            });
            expect(query).toContain('media: [');
            expect(query).toContain('url: "https://example.com/summer.jpg"');
            expect(query).toContain('type: image');
            expect(query).toContain('alt: "Summer pool"');
        });

        it('passes media type as bare enum identifier', () => {
            const action = getAction('createIdea')!;
            const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
            const query = builder({
                organizationId: 'org123',
                content: {
                    media: [{ url: 'https://example.com/vid.mp4', type: 'video' }],
                },
            });
            expect(query).toContain('type: video');
            expect(query).not.toContain('type: "video"');
        });

        it('builds mutation with tagIds', () => {
            const action = getAction('createIdea')!;
            const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
            const query = builder({
                organizationId: 'org123',
                content: { title: 'Tagged idea' },
                tagIds: ['tag1', 'tag2'],
            });
            expect(query).toContain('tagIds: ["tag1","tag2"]');
        });

        it('omits tagIds when not provided', () => {
            const action = getAction('createIdea')!;
            const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
            const query = builder({
                organizationId: 'org123',
                content: { title: 'No tags' },
            });
            expect(query).not.toContain('tagIds');
        });

        it('includes all 5 error union fragments', () => {
            const action = getAction('createIdea')!;
            const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
            const query = builder({
                organizationId: 'org123',
                content: { title: 'Test' },
            });
            expect(query).toContain('... on Idea');
            expect(query).toContain('... on InvalidInputError');
            expect(query).toContain('... on LimitReachedError');
            expect(query).toContain('... on UnauthorizedError');
            expect(query).toContain('... on UnexpectedError');
        });

        it('includes idea content fields in Idea fragment', () => {
            const action = getAction('createIdea')!;
            const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
            const query = builder({
                organizationId: 'org123',
                content: { title: 'Test' },
            });
            expect(query).toContain('... on Idea');
            expect(query).toContain('id');
            expect(query).toContain('content { title text tags { id name color } services date }');
        });

        it('accepts cta, group, and templateId', () => {
            const action = getAction('createIdea')!;
            const result = action.inputSchema.safeParse({
                organizationId: 'org123',
                content: { title: 'Test' },
                cta: 'Learn more',
                group: { groupId: 'grp1', placeAfterId: 'idea99' },
                templateId: 'tmpl1',
            });
            expect(result.success).toBe(true);
        });

        it('accepts content with tags, aiAssisted, services, and date', () => {
            const action = getAction('createIdea')!;
            const result = action.inputSchema.safeParse({
                organizationId: 'org123',
                content: {
                    title: 'Summer campaign',
                    tags: [{ id: 'tag1', name: 'Summer', color: '#ff0000' }],
                    aiAssisted: true,
                    services: ['instagram', 'facebook'],
                    date: '2026-05-01T09:00:00Z',
                },
            });
            expect(result.success).toBe(true);
        });

        it('accepts media with thumbnailUrl and size', () => {
            const action = getAction('createIdea')!;
            const result = action.inputSchema.safeParse({
                organizationId: 'org123',
                content: {
                    media: [
                        {
                            url: 'https://example.com/img.jpg',
                            type: 'image',
                            thumbnailUrl: 'https://example.com/thumb.jpg',
                            size: 102400,
                        },
                    ],
                },
            });
            expect(result.success).toBe(true);
        });

        it('builds mutation with cta and group', () => {
            const action = getAction('createIdea')!;
            const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
            const query = builder({
                organizationId: 'org123',
                content: { title: 'Test' },
                cta: 'Learn more',
                group: { groupId: 'grp1' },
            });
            expect(query).toContain('cta: "Learn more"');
            expect(query).toContain('group: { groupId: "grp1" }');
        });

        it('builds mutation with content tags and services', () => {
            const action = getAction('createIdea')!;
            const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
            const query = builder({
                organizationId: 'org123',
                content: {
                    tags: [{ id: 'tag1', name: 'Summer', color: '#ff0000' }],
                    services: ['instagram', 'facebook'],
                    date: '2026-05-01T09:00:00Z',
                },
            });
            expect(query).toContain('tags: [');
            expect(query).toContain('id: "tag1"');
            expect(query).toContain('name: "Summer"');
            expect(query).toContain('services: [instagram, facebook]');
            expect(query).toContain('date: "2026-05-01T09:00:00Z"');
        });

        it('builds mutation with media thumbnailUrl', () => {
            const action = getAction('createIdea')!;
            const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
            const query = builder({
                organizationId: 'org123',
                content: {
                    media: [
                        {
                            url: 'https://example.com/img.jpg',
                            type: 'image',
                            thumbnailUrl: 'https://example.com/thumb.jpg',
                            size: 102400,
                        },
                    ],
                },
            });
            expect(query).toContain('thumbnailUrl: "https://example.com/thumb.jpg"');
            expect(query).toContain('size: 102400');
        });
    });

    describe('all mutation actions', () => {
        it('registers exactly 3 mutation actions', () => {
            expect(mutationActions.length).toBe(3);
        });

        it('all have category "mutation"', () => {
            for (const action of mutationActions) {
                expect(action.category).toBe('mutation');
            }
        });

        it('all have descriptions', () => {
            for (const action of mutationActions) {
                expect(action.description).toBeTruthy();
            }
        });

        it('all have example payloads', () => {
            for (const action of mutationActions) {
                expect(action.examples).toBeDefined();
                expect(action.examples!.length).toBeGreaterThan(0);
            }
        });

        it('all have builder functions (not static strings)', () => {
            for (const action of mutationActions) {
                expect(typeof action.graphqlQuery).toBe('function');
            }
        });
    });
});
