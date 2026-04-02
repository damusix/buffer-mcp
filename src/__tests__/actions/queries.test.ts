import { describe, it, expect, beforeAll } from 'vitest';

import { queryActions } from '../../actions/queries.js';
import { registerActions, getAction } from '../../actions/registry.js';

beforeAll(() => {
    registerActions(queryActions);
});

describe('Query Actions', () => {
    describe('listOrganizations', () => {
        it('is registered with correct metadata', () => {
            const action = getAction('listOrganizations');
            expect(action).toBeDefined();
            expect(action!.category).toBe('query');
            expect(action!.description).toContain('organizations');
        });

        it('has a static graphqlQuery string', () => {
            const action = getAction('listOrganizations')!;
            expect(typeof action.graphqlQuery).toBe('string');
            const query = action.graphqlQuery as string;
            expect(query).toContain('account');
            expect(query).toContain('organizations');
            expect(query).toContain('id');
            expect(query).toContain('name');
            expect(query).toContain('ownerEmail');
            expect(query).toContain('channelCount');
            expect(query).toContain('limits');
        });

        it('accepts empty payload', () => {
            const action = getAction('listOrganizations')!;
            const result = action.inputSchema.safeParse({});
            expect(result.success).toBe(true);
        });

        it('ignores extra fields in payload', () => {
            const action = getAction('listOrganizations')!;
            const result = action.inputSchema.safeParse({ foo: 'bar' });
            expect(result.success).toBe(true);
        });
    });

    describe('listChannels', () => {
        it('is registered with correct metadata', () => {
            const action = getAction('listChannels');
            expect(action).toBeDefined();
            expect(action!.category).toBe('query');
        });

        it('has a builder function for graphqlQuery', () => {
            const action = getAction('listChannels')!;
            expect(typeof action.graphqlQuery).toBe('function');
        });

        it('requires organizationId', () => {
            const action = getAction('listChannels')!;
            const result = action.inputSchema.safeParse({});
            expect(result.success).toBe(false);
        });

        it('accepts valid payload with organizationId only', () => {
            const action = getAction('listChannels')!;
            const result = action.inputSchema.safeParse({
                organizationId: '68425e79e5105cb6432cc10f',
            });
            expect(result.success).toBe(true);
        });

        it('accepts optional filter', () => {
            const action = getAction('listChannels')!;
            const result = action.inputSchema.safeParse({
                organizationId: '68425e79e5105cb6432cc10f',
                filter: { isLocked: false },
            });
            expect(result.success).toBe(true);
        });

        it('builds query without filter', () => {
            const action = getAction('listChannels')!;
            const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
            const query = builder({ organizationId: 'org123' });
            expect(query).toContain('channels(input:');
            expect(query).toContain('organizationId: "org123"');
            expect(query).not.toContain('filter:');
            expect(query).toContain('id name displayName service');
        });

        it('builds query with isLocked filter', () => {
            const action = getAction('listChannels')!;
            const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
            const query = builder({
                organizationId: 'org123',
                filter: { isLocked: false },
            });
            expect(query).toContain('filter: { isLocked: false }');
        });

        it('builds query with product filter', () => {
            const action = getAction('listChannels')!;
            const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
            const query = builder({
                organizationId: 'org123',
                filter: { product: 'publish' },
            });
            expect(query).toContain('product: "publish"');
        });
    });

    describe('getChannel', () => {
        it('is registered with correct metadata', () => {
            const action = getAction('getChannel');
            expect(action).toBeDefined();
            expect(action!.category).toBe('query');
        });

        it('requires channelId', () => {
            const action = getAction('getChannel')!;
            const result = action.inputSchema.safeParse({});
            expect(result.success).toBe(false);
        });

        it('accepts valid channelId', () => {
            const action = getAction('getChannel')!;
            const result = action.inputSchema.safeParse({ channelId: 'ch123' });
            expect(result.success).toBe(true);
        });

        it('builds query with channel ID', () => {
            const action = getAction('getChannel')!;
            const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
            const query = builder({ channelId: '68426341d6d25b49a128217b' });
            expect(query).toContain('channel(input: { id: "68426341d6d25b49a128217b" })');
            expect(query).toContain('id name displayName service');
            expect(query).toContain('postingSchedule');
        });
    });

    describe('listPosts', () => {
        it('is registered with correct metadata', () => {
            const action = getAction('listPosts');
            expect(action).toBeDefined();
            expect(action!.category).toBe('query');
        });

        it('requires organizationId', () => {
            const action = getAction('listPosts')!;
            const result = action.inputSchema.safeParse({});
            expect(result.success).toBe(false);
        });

        it('accepts minimal payload', () => {
            const action = getAction('listPosts')!;
            const result = action.inputSchema.safeParse({
                organizationId: 'org123',
            });
            expect(result.success).toBe(true);
        });

        it('accepts full payload with pagination and filters', () => {
            const action = getAction('listPosts')!;
            const result = action.inputSchema.safeParse({
                organizationId: 'org123',
                first: 10,
                after: 'cursor123',
                filter: {
                    status: ['sent', 'draft'],
                    channelIds: ['ch1', 'ch2'],
                    tagIds: ['tag1'],
                    dueAt: { start: '2025-01-01T00:00:00Z' },
                    createdAt: { start: '2025-01-01T00:00:00Z', end: '2025-12-31T23:59:59Z' },
                },
            });
            expect(result.success).toBe(true);
        });

        it('rejects invalid status values', () => {
            const action = getAction('listPosts')!;
            const result = action.inputSchema.safeParse({
                organizationId: 'org123',
                filter: { status: ['invalid'] },
            });
            expect(result.success).toBe(false);
        });

        it('builds query with default first=20 and no filter', () => {
            const action = getAction('listPosts')!;
            const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
            const query = builder({ organizationId: 'org123' });
            expect(query).toContain('first: 20');
            expect(query).not.toContain('after:');
            expect(query).toContain('organizationId: "org123"');
            expect(query).toContain('edges');
            expect(query).toContain('node');
            expect(query).toContain('pageInfo');
            expect(query).toContain('hasNextPage');
        });

        it('places first and after as top-level args, not inside input', () => {
            const action = getAction('listPosts')!;
            const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
            const query = builder({
                organizationId: 'org123',
                first: 5,
                after: 'cursorABC',
            });
            // first and after should appear before input
            const postsCallMatch = query.match(/posts\(([\s\S]*?)\)\s*\{/);
            expect(postsCallMatch).not.toBeNull();
            const argsBlock = postsCallMatch![1];
            expect(argsBlock).toContain('first: 5');
            expect(argsBlock).toContain('after: "cursorABC"');
            expect(argsBlock).toContain('input:');
        });

        it('builds query with status filter as bare enums', () => {
            const action = getAction('listPosts')!;
            const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
            const query = builder({
                organizationId: 'org123',
                filter: { status: ['sent', 'draft'] },
            });
            expect(query).toContain('status: [sent, draft]');
        });

        it('builds query with channelIds filter as JSON array', () => {
            const action = getAction('listPosts')!;
            const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
            const query = builder({
                organizationId: 'org123',
                filter: { channelIds: ['ch1', 'ch2'] },
            });
            expect(query).toContain('channelIds: ["ch1","ch2"]');
        });

        it('builds query with date range filter', () => {
            const action = getAction('listPosts')!;
            const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
            const query = builder({
                organizationId: 'org123',
                filter: {
                    dueAt: { start: '2025-10-30T00:00:00.000Z' },
                },
            });
            expect(query).toContain('dueAt: { start: "2025-10-30T00:00:00.000Z" }');
        });

        it('builds query with createdAt range filter with start and end', () => {
            const action = getAction('listPosts')!;
            const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
            const query = builder({
                organizationId: 'org123',
                filter: {
                    createdAt: { start: '2025-01-01T00:00:00Z', end: '2025-12-31T23:59:59Z' },
                },
            });
            expect(query).toContain(
                'createdAt: { start: "2025-01-01T00:00:00Z", end: "2025-12-31T23:59:59Z" }',
            );
        });

        it('includes post fields in query', () => {
            const action = getAction('listPosts')!;
            const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
            const query = builder({ organizationId: 'org123' });
            expect(query).toContain('id text status via');
            expect(query).toContain('tags { id name color }');
            expect(query).toContain('notes { id text createdAt }');
            expect(query).toContain('assets');
            expect(query).toContain('author { id email name }');
            expect(query).toContain('allowedActions');
        });
    });

    describe('getPost', () => {
        it('is registered with correct metadata', () => {
            const action = getAction('getPost');
            expect(action).toBeDefined();
            expect(action!.category).toBe('query');
        });

        it('requires postId', () => {
            const action = getAction('getPost')!;
            const result = action.inputSchema.safeParse({});
            expect(result.success).toBe(false);
        });

        it('accepts valid postId', () => {
            const action = getAction('getPost')!;
            const result = action.inputSchema.safeParse({ postId: 'post123' });
            expect(result.success).toBe(true);
        });

        it('builds query with post ID', () => {
            const action = getAction('getPost')!;
            const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
            const query = builder({ postId: '69028ba74f51d522ca05aeed' });
            expect(query).toContain('post(input: { id: "69028ba74f51d522ca05aeed" })');
            expect(query).toContain('id text status via');
            expect(query).toContain('tags { id name color }');
        });
    });

    describe('getDailyPostingLimits', () => {
        it('is registered with correct metadata', () => {
            const action = getAction('getDailyPostingLimits');
            expect(action).toBeDefined();
            expect(action!.category).toBe('query');
        });

        it('requires channelIds with at least one element', () => {
            const action = getAction('getDailyPostingLimits')!;

            const empty = action.inputSchema.safeParse({});
            expect(empty.success).toBe(false);

            const emptyArray = action.inputSchema.safeParse({ channelIds: [] });
            expect(emptyArray.success).toBe(false);
        });

        it('accepts valid channelIds', () => {
            const action = getAction('getDailyPostingLimits')!;
            const result = action.inputSchema.safeParse({ channelIds: ['ch1'] });
            expect(result.success).toBe(true);
        });

        it('accepts optional date', () => {
            const action = getAction('getDailyPostingLimits')!;
            const result = action.inputSchema.safeParse({
                channelIds: ['ch1'],
                date: '2025-10-30',
            });
            expect(result.success).toBe(true);
        });

        it('builds query without date', () => {
            const action = getAction('getDailyPostingLimits')!;
            const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
            const query = builder({ channelIds: ['ch1', 'ch2'] });
            expect(query).toContain('dailyPostingLimits(input:');
            expect(query).toContain('channelIds: ["ch1","ch2"]');
            expect(query).not.toContain('date:');
            expect(query).toContain('channel { id name service }');
            expect(query).toContain('limit');
            expect(query).toContain('used');
        });

        it('builds query with date', () => {
            const action = getAction('getDailyPostingLimits')!;
            const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
            const query = builder({
                channelIds: ['ch1'],
                date: '2025-10-30',
            });
            expect(query).toContain('date: "2025-10-30"');
        });
    });

    describe('all query actions', () => {
        it('registers exactly 6 query actions', () => {
            expect(queryActions.length).toBe(6);
        });

        it('all have category "query"', () => {
            for (const action of queryActions) {
                expect(action.category).toBe('query');
            }
        });

        it('all have descriptions', () => {
            for (const action of queryActions) {
                expect(action.description).toBeTruthy();
            }
        });

        it('all have example payloads', () => {
            for (const action of queryActions) {
                expect(action.examples).toBeDefined();
                expect(action.examples!.length).toBeGreaterThan(0);
            }
        });
    });
});
