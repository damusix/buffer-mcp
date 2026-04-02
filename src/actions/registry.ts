import { z } from 'zod';

export type ActionCategory = 'query' | 'mutation';

export interface ActionExample {
    label: string;
    payload: Record<string, unknown>;
}

export interface ActionDefinition {
    name: string;
    category: ActionCategory;
    graphqlQuery: string | ((payload: Record<string, unknown>) => string);
    inputSchema: z.ZodType;
    description: string;
    examples?: ActionExample[];
}

const registry = new Map<string, ActionDefinition>();

export function registerAction(action: ActionDefinition): void {
    registry.set(action.name, action);
}

export function registerActions(actions: ActionDefinition[]): void {
    for (const action of actions) {
        registerAction(action);
    }
}

export function getAction(name: string): ActionDefinition | undefined {
    return registry.get(name);
}

export function listActions(category?: ActionCategory): ActionDefinition[] {
    const actions = Array.from(registry.values());
    if (category) {
        return actions.filter((a) => a.category === category);
    }
    return actions;
}

export function getActionHelp(name: string): string | undefined {
    const action = getAction(name);
    if (!action) {
        return undefined;
    }

    const schema = action.inputSchema;
    const lines: string[] = [
        `## ${action.name}`,
        '',
        action.description,
        '',
        `- **Category:** ${action.category}`,
        '',
    ];

    if (schema instanceof z.ZodObject) {
        lines.push('### Parameters', '');
        const shape = schema.shape as Record<string, z.ZodType>;
        for (const [key, field] of Object.entries(shape)) {
            const isOptional = field.isOptional();
            const desc = field.description || '';
            lines.push(`- **${key}**${isOptional ? ' (optional)' : ' (required)'}: ${desc}`);
        }
        lines.push('');
    }

    if (action.examples?.length) {
        lines.push('### Examples', '');
        for (const ex of action.examples) {
            lines.push(
                `**${ex.label}**`,
                '',
                '```json',
                JSON.stringify(ex.payload, null, 2),
                '```',
                '',
            );
        }
    }

    return lines.join('\n');
}
