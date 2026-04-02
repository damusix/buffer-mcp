import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock env vars before importing buffer-client
const TEST_TOKEN = 'test-buffer-token-abc123';

vi.stubEnv('BUFFER_ACCESS_TOKEN', TEST_TOKEN);

// Track hook registrations outside the mock so clearAllMocks doesn't lose them
const hookRegistry: Array<[string, Function]> = [];

// Mock @logosdx/fetch
vi.mock('@logosdx/fetch', () => {
    class MockFetchEngine {
        config: Record<string, unknown>;
        hooks = {
            add: vi.fn((event: string, fn: Function) => {
                hookRegistry.push([event, fn]);
            }),
        };
        constructor(config: Record<string, unknown>) {
            this.config = config;
        }
    }
    return {
        FetchEngine: MockFetchEngine,
        config: { set: vi.fn() },
    };
});

describe('buffer-client', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('creates bufferApi with correct baseUrl', async () => {
        const { bufferApi } = await import('../buffer-client.js');
        expect(bufferApi.config).toMatchObject({
            baseUrl: 'https://api.buffer.com',
        });
    });

    it('sets Content-Type header to application/json', async () => {
        const { bufferApi } = await import('../buffer-client.js');
        expect(bufferApi.config).toMatchObject({
            headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        });
    });

    it('sets Authorization header with Bearer token from env', async () => {
        const { bufferApi } = await import('../buffer-client.js');
        expect(bufferApi.config).toMatchObject({
            headers: expect.objectContaining({
                Authorization: `Bearer ${TEST_TOKEN}`,
            }),
        });
    });

    it('sets defaultType to json', async () => {
        const { bufferApi } = await import('../buffer-client.js');
        expect(bufferApi.config).toMatchObject({
            defaultType: 'json',
        });
    });

    it('configures retry with 3 max attempts', async () => {
        const { bufferApi } = await import('../buffer-client.js');
        expect(bufferApi.config).toMatchObject({
            retry: expect.objectContaining({
                maxAttempts: 3,
                useExponentialBackoff: true,
            }),
        });
    });

    it('includes retryable status codes for transient errors', async () => {
        const { bufferApi } = await import('../buffer-client.js');
        const retry = bufferApi.config.retry as { retryableStatusCodes: number[] };
        expect(retry.retryableStatusCodes).toContain(429);
        expect(retry.retryableStatusCodes).toContain(500);
        expect(retry.retryableStatusCodes).toContain(502);
        expect(retry.retryableStatusCodes).toContain(503);
        expect(retry.retryableStatusCodes).toContain(504);
    });

    it('configures rate limit policy matching Buffer API limits', async () => {
        const { bufferApi } = await import('../buffer-client.js');
        expect(bufferApi.config).toMatchObject({
            rateLimitPolicy: expect.objectContaining({
                maxCalls: 100,
                windowMs: 15 * 60_000,
            }),
        });
    });

    it('configures cache policy for POST methods', async () => {
        const { bufferApi } = await import('../buffer-client.js');
        expect(bufferApi.config).toMatchObject({
            cachePolicy: expect.objectContaining({
                enabled: true,
                methods: ['POST'],
            }),
        });
    });

    it('configures attempt and total timeouts', async () => {
        const { bufferApi } = await import('../buffer-client.js');
        expect(bufferApi.config).toMatchObject({
            attemptTimeout: 15000,
            totalTimeout: 45000,
        });
    });

    it('registers a beforeRequest hook for token injection', async () => {
        await import('../buffer-client.js');
        const beforeRequestHook = hookRegistry.find(([event]) => event === 'beforeRequest');
        expect(beforeRequestHook).toBeDefined();
    });

    describe('beforeRequest hook', () => {
        it('injects current BUFFER_ACCESS_TOKEN into request headers', async () => {
            await import('../buffer-client.js');

            const beforeRequestHook = hookRegistry.find(([event]) => event === 'beforeRequest');
            expect(beforeRequestHook).toBeDefined();

            const hookFn = beforeRequestHook![1] as (
                _url: string,
                opts: { headers: Record<string, string> },
            ) => void;
            const mockOpts = { headers: { Authorization: '' } };

            vi.stubEnv('BUFFER_ACCESS_TOKEN', 'updated-token');
            hookFn('https://api.buffer.com/graphql', mockOpts);

            expect(mockOpts.headers.Authorization).toBe('Bearer updated-token');
        });
    });
});
