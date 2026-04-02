import { z } from 'zod';
import { listActions, getActionHelp } from '../actions/registry.js';
import type { ActionCategory } from '../actions/registry.js';

export const bufferApiHelpSchema = z.object({
    action: z
        .string()
        .optional()
        .describe(
            'Specific action name to get detailed help for (e.g. "listPosts"). Omit to see all available actions.',
        ),
    category: z.enum(['query', 'mutation']).optional().describe('Filter actions by category'),
});

export type BufferApiHelpInput = z.infer<typeof bufferApiHelpSchema>;

export function handleBufferApiHelp(input: BufferApiHelpInput): string {
    const { action, category } = input;

    if (action) {
        const help = getActionHelp(action);
        if (!help) {
            return `Unknown action "${action}". Use buffer_api_help without arguments to see all available actions.`;
        }
        return help;
    }

    const actions = listActions(category as ActionCategory | undefined);
    const lines: string[] = [];

    if (category) {
        const label = category === 'query' ? 'Queries' : 'Mutations';
        lines.push(`# Buffer API Actions — ${label}`, '');
        for (const a of actions) {
            lines.push(`- **${a.name}** — ${a.description}`);
        }
        lines.push('');
    } else {
        lines.push('# Buffer API Actions', '');

        const queries = actions.filter((a) => a.category === 'query');
        const mutations = actions.filter((a) => a.category === 'mutation');

        if (queries.length) {
            lines.push('## Queries', '');
            for (const a of queries) {
                lines.push(`- **${a.name}** — ${a.description}`);
            }
            lines.push('');
        }

        if (mutations.length) {
            lines.push('## Mutations', '');
            for (const a of mutations) {
                lines.push(`- **${a.name}** — ${a.description}`);
            }
            lines.push('');
        }
    }

    lines.push(
        '---',
        '',
        'Use `buffer_api_help` with `action` parameter for detailed schema info on any action.',
    );
    return lines.join('\n');
}
