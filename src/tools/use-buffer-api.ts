import { z } from 'zod';
import { attempt } from '@logosdx/utils';
import { bufferApi } from '../buffer-client.js';
import { getAction } from '../actions/registry.js';
import type { ActionDefinition } from '../actions/registry.js';

export const useBufferApiSchema = z.object({
    action: z.string().describe('Action to execute (e.g. "listPosts", "createPost")'),
    payload: z
        .record(z.unknown())
        .optional()
        .describe(
            'Action payload — fields depend on the action. Use buffer_api_help to see available fields.',
        ),
});

export type UseBufferApiInput = z.infer<typeof useBufferApiSchema>;

function resolveQuery(action: ActionDefinition, payload: Record<string, unknown>): string {
    if (typeof action.graphqlQuery === 'function') {
        return action.graphqlQuery(payload);
    }
    return action.graphqlQuery;
}

function isMutationError(actionName: string, data: Record<string, unknown>): string | null {
    // For mutations, check if the response has a `message` field (MutationError)
    // instead of the expected success field (e.g., `post`, `idea`, `__typename`)
    const mutationResult = data[actionName] as Record<string, unknown> | null | undefined;
    if (
        mutationResult &&
        typeof mutationResult === 'object' &&
        'message' in mutationResult &&
        !('post' in mutationResult) &&
        !('idea' in mutationResult) &&
        !('id' in mutationResult) &&
        !('__typename' in mutationResult)
    ) {
        return mutationResult.message as string;
    }
    return null;
}

export async function handleUseBufferApi(input: UseBufferApiInput): Promise<string> {
    const { action, payload = {} } = input;

    // Step 1: Look up action in registry
    const actionDef = getAction(action);
    if (!actionDef) {
        return JSON.stringify({
            error: `Unknown action: ${action}. Use buffer_api_help to list available actions.`,
        });
    }

    // Step 2: Validate payload with Zod schema
    const validation = actionDef.inputSchema.safeParse(payload);
    if (!validation.success) {
        return JSON.stringify({
            error: 'Invalid payload',
            details: validation.error.issues.map((i) => ({
                path: i.path.join('.'),
                message: i.message,
            })),
        });
    }

    // Step 3: Check BUFFER_ACCESS_TOKEN is set
    const token = process.env.BUFFER_ACCESS_TOKEN;
    if (!token) {
        return JSON.stringify({
            error: 'BUFFER_ACCESS_TOKEN environment variable is not set',
        });
    }

    // Step 4: Build GraphQL query
    const validPayload = validation.data as Record<string, unknown>;
    const query = resolveQuery(actionDef, validPayload);

    // Step 5: Send request via FetchEngine with attempt()
    const [response, err] = await attempt(() => bufferApi.post('/', { query }));

    // Step 6: Check attempt() error — network/timeout failures
    if (err) {
        return JSON.stringify({ error: err.message });
    }

    // FetchEngine returns { data, headers, status, ... } — unwrap to get the GraphQL body
    const raw = response as Record<string, unknown>;
    const isFetchEngineResponse = 'status' in raw && 'headers' in raw;
    const body = (isFetchEngineResponse ? raw.data : raw) as Record<string, unknown>;

    // Step 7-8: Check errors array in response body
    const errors = body.errors as
        | Array<{ message: string; extensions?: { code?: string } }>
        | undefined;
    if (errors?.length) {
        const firstErr = errors[0];
        const code = firstErr.extensions?.code;
        return JSON.stringify({
            error: `${firstErr.message}${code ? ` (${code})` : ''}`,
        });
    }

    // Step 9: Check for typed mutation errors in data
    if (actionDef.category === 'mutation' && body.data) {
        const mutationErr = isMutationError(actionDef.name, body.data as Record<string, unknown>);
        if (mutationErr) {
            return JSON.stringify({ error: mutationErr });
        }
    }

    // Step 10: Return successful data
    return JSON.stringify(body);
}
