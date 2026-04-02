import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock buffer-client
vi.mock('../../buffer-client.js', () => ({
    bufferApi: {
        post: vi.fn(),
    },
}));

// Mock @logosdx/utils — attempt wraps async fn and returns [result, null] or [null, error]
vi.mock('@logosdx/utils', () => ({
    attempt: vi.fn(async (fn: () => Promise<unknown>) => {
        try {
            const result = await fn();
            return [result, null];
        } catch (error) {
            return [null, error];
        }
    }),
}));

// Mock action registrations — import real actions so registry is populated
vi.mock('../../actions/queries.js', async (importOriginal) => {
    return await importOriginal();
});

vi.mock('../../actions/mutations.js', async (importOriginal) => {
    return await importOriginal();
});

import { handleUseBufferApi } from '../../tools/use-buffer-api.js';
import { bufferApi } from '../../buffer-client.js';
import { registerActions } from '../../actions/registry.js';
import { queryActions } from '../../actions/queries.js';
import { mutationActions } from '../../actions/mutations.js';

// Register all actions before tests
registerActions(queryActions);
registerActions(mutationActions);

describe('use-buffer-api handler', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv('BUFFER_ACCESS_TOKEN', 'test-token-123');
    });

    // --- Scenario 7: Unknown action ---

    it('returns error for unknown action', async () => {
        const result = await handleUseBufferApi({ action: 'updatePost', payload: {} });
        const parsed = JSON.parse(result);
        expect(parsed.error).toContain('Unknown action');
        expect(parsed.error).toContain('updatePost');
    });

    it('suggests help tool for unknown action', async () => {
        const result = await handleUseBufferApi({ action: 'nonexistent', payload: {} });
        const parsed = JSON.parse(result);
        expect(parsed.error).toContain('buffer_api_help');
    });

    // --- Scenario 6: Zod validation errors ---

    it('validates payload against Zod schema — rejects missing required fields', async () => {
        const result = await handleUseBufferApi({
            action: 'createPost',
            payload: { text: 'Hello world' },
        });
        const parsed = JSON.parse(result);
        expect(parsed.error).toBeDefined();
        expect(parsed.details).toBeDefined();
        expect(parsed.details.length).toBeGreaterThan(0);
    });

    it('validates payload — rejects invalid enum value', async () => {
        const result = await handleUseBufferApi({
            action: 'createPost',
            payload: {
                channelId: 'ch123',
                schedulingType: 'automatic_publishing',
                mode: 'addToQueue',
            },
        });
        const parsed = JSON.parse(result);
        expect(parsed.error).toBeDefined();
    });

    it('accepts valid payload and proceeds to API call', async () => {
        vi.mocked(bufferApi.post).mockResolvedValue({
            data: { account: { organizations: [] } },
        } as any);

        await handleUseBufferApi({ action: 'listOrganizations', payload: {} });
        expect(bufferApi.post).toHaveBeenCalled();
    });

    // --- Scenario 1: Missing token ---

    it('returns error when BUFFER_ACCESS_TOKEN is not set', async () => {
        vi.stubEnv('BUFFER_ACCESS_TOKEN', '');

        const result = await handleUseBufferApi({ action: 'listOrganizations', payload: {} });
        const parsed = JSON.parse(result);
        expect(parsed.error).toContain('BUFFER_ACCESS_TOKEN');
    });

    // --- Query construction ---

    it('sends static GraphQL query for listOrganizations', async () => {
        vi.mocked(bufferApi.post).mockResolvedValue({
            data: { account: { organizations: [] } },
        } as any);

        await handleUseBufferApi({ action: 'listOrganizations', payload: {} });

        expect(bufferApi.post).toHaveBeenCalledWith(
            '/graphql',
            expect.objectContaining({
                query: expect.stringContaining('account'),
            }),
        );
    });

    it('sends dynamic GraphQL query for listPosts with pagination args', async () => {
        vi.mocked(bufferApi.post).mockResolvedValue({
            data: { posts: { edges: [], pageInfo: {} } },
        } as any);

        await handleUseBufferApi({
            action: 'listPosts',
            payload: {
                organizationId: 'org123',
                first: 5,
                after: 'cursor-abc',
            },
        });

        const call = vi.mocked(bufferApi.post).mock.calls[0];
        const query = (call[1] as any).query;
        expect(query).toContain('first: 5');
        expect(query).toContain('after: "cursor-abc"');
        expect(query).toContain('organizationId: "org123"');
    });

    it('sends dynamic GraphQL query for createPost mutation', async () => {
        vi.mocked(bufferApi.post).mockResolvedValue({
            data: {
                createPost: {
                    post: { id: 'post123', status: 'draft' },
                },
            },
        } as any);

        await handleUseBufferApi({
            action: 'createPost',
            payload: {
                channelId: 'ch123',
                text: 'Hello world',
                schedulingType: 'automatic',
                mode: 'addToQueue',
                saveToDraft: true,
            },
        });

        const call = vi.mocked(bufferApi.post).mock.calls[0];
        const query = (call[1] as any).query;
        expect(query).toContain('mutation');
        expect(query).toContain('createPost');
        expect(query).toContain('channelId: "ch123"');
        expect(query).toContain('schedulingType: automatic');
        expect(query).toContain('mode: addToQueue');
        expect(query).toContain('saveToDraft: true');
        expect(query).toContain('PostActionSuccess');
        expect(query).toContain('MutationError');
    });

    it('sends query for getChannel with channel ID', async () => {
        vi.mocked(bufferApi.post).mockResolvedValue({
            data: { channel: { id: 'ch123' } },
        } as any);

        await handleUseBufferApi({
            action: 'getChannel',
            payload: { channelId: 'ch123' },
        });

        const call = vi.mocked(bufferApi.post).mock.calls[0];
        const query = (call[1] as any).query;
        expect(query).toContain('channel(input: { id: "ch123" })');
    });

    it('sends query for deletePost mutation', async () => {
        vi.mocked(bufferApi.post).mockResolvedValue({
            data: { deletePost: { __typename: 'DeletePostSuccess' } },
        } as any);

        await handleUseBufferApi({
            action: 'deletePost',
            payload: { postId: 'post-abc' },
        });

        const call = vi.mocked(bufferApi.post).mock.calls[0];
        const query = (call[1] as any).query;
        expect(query).toContain('mutation');
        expect(query).toContain('deletePost');
        expect(query).toContain('id: "post-abc"');
        expect(query).toContain('DeletePostSuccess');
    });

    // --- Error handling: API errors ---

    it('handles network/timeout errors from attempt()', async () => {
        vi.mocked(bufferApi.post).mockRejectedValue(
            new Error('The operation was aborted due to timeout'),
        );

        const result = await handleUseBufferApi({ action: 'listOrganizations', payload: {} });
        const parsed = JSON.parse(result);
        expect(parsed.error).toContain('The operation was aborted due to timeout');
    });

    it('handles GraphQL errors array in response', async () => {
        vi.mocked(bufferApi.post).mockResolvedValue({
            data: null,
            errors: [
                {
                    message: 'Not authorized',
                    extensions: { code: 'UNAUTHORIZED' },
                },
            ],
        } as any);

        const result = await handleUseBufferApi({ action: 'listOrganizations', payload: {} });
        const parsed = JSON.parse(result);
        expect(parsed.error).toContain('Not authorized');
        expect(parsed.error).toContain('UNAUTHORIZED');
    });

    it('handles GraphQL errors without extensions code', async () => {
        vi.mocked(bufferApi.post).mockResolvedValue({
            data: null,
            errors: [{ message: 'Internal server error' }],
        } as any);

        const result = await handleUseBufferApi({ action: 'listOrganizations', payload: {} });
        const parsed = JSON.parse(result);
        expect(parsed.error).toContain('Internal server error');
    });

    it('handles rate limit error shape', async () => {
        vi.mocked(bufferApi.post).mockResolvedValue({
            errors: [
                {
                    message: 'Too many requests from this client. Please try again later.',
                    extensions: { code: 'RATE_LIMIT_EXCEEDED', window: '15m' },
                },
            ],
        } as any);

        const result = await handleUseBufferApi({ action: 'listOrganizations', payload: {} });
        const parsed = JSON.parse(result);
        expect(parsed.error).toContain('RATE_LIMIT_EXCEEDED');
    });

    // --- Scenario 5: Typed mutation errors ---

    it('detects typed mutation error (MutationError) in createPost response', async () => {
        vi.mocked(bufferApi.post).mockResolvedValue({
            data: {
                createPost: {
                    message: 'Invalid post: Instagram posts require at least one image or video.',
                },
            },
        } as any);

        const result = await handleUseBufferApi({
            action: 'createPost',
            payload: {
                channelId: 'ch123',
                schedulingType: 'automatic',
                mode: 'addToQueue',
            },
        });
        const parsed = JSON.parse(result);
        expect(parsed.error).toContain('Instagram posts require at least one image or video');
    });

    // --- Successful responses ---

    it('returns data for successful query', async () => {
        const mockResponse = {
            data: {
                account: {
                    organizations: [
                        { id: 'org1', name: 'Test Org', ownerEmail: 'test@example.com' },
                    ],
                },
            },
        };
        vi.mocked(bufferApi.post).mockResolvedValue(mockResponse as any);

        const result = await handleUseBufferApi({ action: 'listOrganizations', payload: {} });
        const parsed = JSON.parse(result);
        expect(parsed.data.account.organizations).toHaveLength(1);
        expect(parsed.data.account.organizations[0].name).toBe('Test Org');
    });

    it('returns data for successful mutation', async () => {
        const mockResponse = {
            data: {
                deletePost: { __typename: 'DeletePostSuccess' },
            },
        };
        vi.mocked(bufferApi.post).mockResolvedValue(mockResponse as any);

        const result = await handleUseBufferApi({
            action: 'deletePost',
            payload: { postId: 'post-123' },
        });
        const parsed = JSON.parse(result);
        expect(parsed.data.deletePost.__typename).toBe('DeletePostSuccess');
    });

    it('returns null data transparently for not-found resources', async () => {
        const mockResponse = {
            data: { post: null },
        };
        vi.mocked(bufferApi.post).mockResolvedValue(mockResponse as any);

        const result = await handleUseBufferApi({
            action: 'getPost',
            payload: { postId: '000000000000000000000000' },
        });
        const parsed = JSON.parse(result);
        expect(parsed.data.post).toBeNull();
    });

    // --- Default payload handling ---

    it('defaults payload to empty object when not provided', async () => {
        vi.mocked(bufferApi.post).mockResolvedValue({
            data: { account: { organizations: [] } },
        } as any);

        const result = await handleUseBufferApi({ action: 'listOrganizations' });
        const parsed = JSON.parse(result);
        expect(parsed.data).toBeDefined();
    });

    // --- Posts query default first ---

    it('uses default first=20 for listPosts when not specified', async () => {
        vi.mocked(bufferApi.post).mockResolvedValue({
            data: { posts: { edges: [], pageInfo: {} } },
        } as any);

        await handleUseBufferApi({
            action: 'listPosts',
            payload: { organizationId: 'org123' },
        });

        const call = vi.mocked(bufferApi.post).mock.calls[0];
        const query = (call[1] as any).query;
        expect(query).toContain('first: 20');
    });

    // --- createIdea mutation ---

    it('sends correct query for createIdea mutation', async () => {
        vi.mocked(bufferApi.post).mockResolvedValue({
            data: {
                createIdea: {
                    idea: { id: 'idea1', content: { title: 'Test', text: 'Idea text' } },
                },
            },
        } as any);

        await handleUseBufferApi({
            action: 'createIdea',
            payload: {
                organizationId: 'org123',
                content: { title: 'Test', text: 'Idea text' },
            },
        });

        const call = vi.mocked(bufferApi.post).mock.calls[0];
        const query = (call[1] as any).query;
        expect(query).toContain('mutation');
        expect(query).toContain('createIdea');
        expect(query).toContain('organizationId: "org123"');
        expect(query).toContain('IdeaResponse');
        expect(query).toContain('InvalidInputError');
        expect(query).toContain('LimitReachedError');
    });

    it('detects typed error in createIdea response (LimitReachedError)', async () => {
        vi.mocked(bufferApi.post).mockResolvedValue({
            data: {
                createIdea: {
                    message: 'You have reached the maximum number of ideas.',
                },
            },
        } as any);

        const result = await handleUseBufferApi({
            action: 'createIdea',
            payload: {
                organizationId: 'org123',
                content: { title: 'Test' },
            },
        });
        const parsed = JSON.parse(result);
        expect(parsed.error).toContain('maximum number of ideas');
    });
});
