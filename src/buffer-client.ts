import { FetchEngine } from '@logosdx/fetch';
import type { FetchError } from '@logosdx/fetch';

const BUFFER_ACCESS_TOKEN = process.env.BUFFER_ACCESS_TOKEN || '';
const BUFFER_RATE_LIMIT = Number(process.env.BUFFER_RATE_LIMIT) || 100;

const resilience = {
    attemptTimeout: 15000,
    totalTimeout: 45000,

    retry: {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        useExponentialBackoff: true,
        retryableStatusCodes: [408, 429, 500, 502, 503, 504],
        shouldRetry: (error: FetchError, _attempt: number) => {
            if (error.status === 429) {
                const retryAfter = error.headers?.['retry-after'];
                return retryAfter ? parseInt(retryAfter as string) * 1000 : 5000;
            }
            if (error.status >= 400 && error.status < 500) {
                return false;
            }
            return true;
        },
    },

    cachePolicy: {
        enabled: true,
        methods: ['POST'] as const,
        ttl: 3_600_000,
        staleIn: 10_000,
    },

    dedupePolicy: true as const,

    rateLimitPolicy: {
        maxCalls: BUFFER_RATE_LIMIT,
        windowMs: 15 * 60_000,
        waitForToken: true,
    },
};

export const bufferApi = new FetchEngine({
    baseUrl: 'https://api.buffer.com',
    defaultType: 'json',
    headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${BUFFER_ACCESS_TOKEN}`,
    },
    ...resilience,
});

bufferApi.hooks.add('beforeRequest', (_url, opts) => {
    const token = process.env.BUFFER_ACCESS_TOKEN || '';
    opts.headers.Authorization = `Bearer ${token}`;
});
