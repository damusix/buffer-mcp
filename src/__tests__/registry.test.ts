import { describe, it, expect, beforeAll } from 'vitest';
import { z } from 'zod';
import {
    registerAction,
    registerActions,
    getAction,
    listActions,
    getActionHelp,
} from '../actions/registry.js';
import type { ActionDefinition } from '../actions/registry.js';

const testQueryAction: ActionDefinition = {
    name: 'channels.list',
    category: 'query',
    graphqlQuery: `query GetChannels($input: ChannelsInput!) {
    channels(input: $input) {
        id
        name
        service
    }
}`,
    inputSchema: z.object({
        organizationId: z.string().describe('Organization ID to list channels for'),
    }),
    description: 'List all channels for an organization',
    examples: [{ label: 'List channels', payload: { organizationId: '60c5a1234567890abcdef012' } }],
};

const testMutationAction: ActionDefinition = {
    name: 'posts.create',
    category: 'mutation',
    graphqlQuery: `mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
        ... on PostActionSuccess {
            post { id text }
        }
        ... on MutationError {
            message
        }
    }
}`,
    inputSchema: z.object({
        channelIds: z.array(z.string()).describe('Channel IDs to post to'),
        text: z.string().describe('Post text content'),
        mode: z.string().optional().describe('Scheduling mode'),
    }),
    description: 'Create a new post',
    examples: [
        { label: 'Create a post', payload: { channelIds: ['abc123'], text: 'Hello world' } },
    ],
};

const testNoExampleAction: ActionDefinition = {
    name: 'account.get',
    category: 'query',
    graphqlQuery: `query { account { id email } }`,
    inputSchema: z.object({}),
    description: 'Get current account info',
};

beforeAll(() => {
    registerActions([testQueryAction, testMutationAction, testNoExampleAction]);
});

describe('Action Registry', () => {
    describe('registerAction', () => {
        it('registers a single action', () => {
            const action: ActionDefinition = {
                name: 'tags.list',
                category: 'query',
                graphqlQuery: `query { tags { id name } }`,
                inputSchema: z.object({}),
                description: 'List tags',
            };
            registerAction(action);
            expect(getAction('tags.list')).toBeDefined();
        });
    });

    describe('listActions', () => {
        it('returns all registered actions', () => {
            const all = listActions();
            expect(all.length).toBeGreaterThan(0);
        });

        it('filters by query category', () => {
            const queries = listActions('query');
            expect(queries.length).toBeGreaterThan(0);
            expect(queries.every((a) => a.category === 'query')).toBe(true);
        });

        it('filters by mutation category', () => {
            const mutations = listActions('mutation');
            expect(mutations.length).toBeGreaterThan(0);
            expect(mutations.every((a) => a.category === 'mutation')).toBe(true);
        });

        it('returns both query and mutation actions when unfiltered', () => {
            const all = listActions();
            const categories = new Set(all.map((a) => a.category));
            expect(categories.has('query')).toBe(true);
            expect(categories.has('mutation')).toBe(true);
        });
    });

    describe('getAction', () => {
        it('returns correct action by name', () => {
            const action = getAction('channels.list');
            expect(action).toBeDefined();
            expect(action!.name).toBe('channels.list');
            expect(action!.category).toBe('query');
            expect(action!.graphqlQuery).toContain('GetChannels');
        });

        it('returns undefined for nonexistent action', () => {
            const action = getAction('nonexistent.action');
            expect(action).toBeUndefined();
        });

        it('returns mutation action by name', () => {
            const action = getAction('posts.create');
            expect(action).toBeDefined();
            expect(action!.category).toBe('mutation');
            expect(action!.graphqlQuery).toContain('CreatePost');
        });
    });

    describe('getActionHelp', () => {
        it('returns help text for channels.list', () => {
            const help = getActionHelp('channels.list');
            expect(help).toBeDefined();
            expect(help).toContain('channels.list');
            expect(help).toContain('organizationId');
            expect(help).toContain('required');
            expect(help).toContain('query');
        });

        it('returns undefined for unknown action', () => {
            const help = getActionHelp('nonexistent.action');
            expect(help).toBeUndefined();
        });

        it('includes example payload when available', () => {
            const help = getActionHelp('channels.list');
            expect(help).toBeDefined();
            expect(help).toContain('Examples');
            expect(help).toContain('organizationId');
        });

        it('omits example payload when not provided', () => {
            const help = getActionHelp('account.get');
            expect(help).toBeDefined();
            expect(help).not.toContain('Examples');
        });

        it('lists all fields with required/optional markers', () => {
            const help = getActionHelp('posts.create');
            expect(help).toBeDefined();
            expect(help).toContain('channelIds');
            expect(help).toContain('text');
            expect(help).toContain('required');
            expect(help).toContain('mode');
            expect(help).toContain('optional');
        });

        it('includes category in help output', () => {
            const help = getActionHelp('posts.create');
            expect(help).toBeDefined();
            expect(help).toContain('**Category:** mutation');
        });
    });
});
