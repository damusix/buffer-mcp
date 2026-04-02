import { describe, it, expect } from 'vitest';
import { registerActions } from '../../actions/registry.js';
import { queryActions } from '../../actions/queries.js';
import { mutationActions } from '../../actions/mutations.js';
import { handleBufferApiHelp } from '../../tools/buffer-api-help.js';

// Register all actions before tests
registerActions(queryActions);
registerActions(mutationActions);

describe('buffer-api-help handler', () => {
    // --- Scenario 1: List all available actions ---

    it('returns all actions grouped by category when no args provided', () => {
        const result = handleBufferApiHelp({});
        expect(result).toContain('# Buffer API Actions');
        expect(result).toContain('## Queries');
        expect(result).toContain('## Mutations');
    });

    it('lists all 6 query actions', () => {
        const result = handleBufferApiHelp({});
        expect(result).toContain('listOrganizations');
        expect(result).toContain('listChannels');
        expect(result).toContain('getChannel');
        expect(result).toContain('listPosts');
        expect(result).toContain('getPost');
        expect(result).toContain('getDailyPostingLimits');
    });

    it('lists all 3 mutation actions', () => {
        const result = handleBufferApiHelp({});
        expect(result).toContain('createPost');
        expect(result).toContain('deletePost');
        expect(result).toContain('createIdea');
    });

    it('shows descriptions for actions in listing', () => {
        const result = handleBufferApiHelp({});
        expect(result).toContain('List all organizations');
        expect(result).toContain('Delete a post by ID');
    });

    it('includes discovery hint at bottom', () => {
        const result = handleBufferApiHelp({});
        expect(result).toContain('buffer_api_help');
        expect(result).toContain('action');
    });

    // --- Scenario 2: List only query actions ---

    it('filters by query category', () => {
        const result = handleBufferApiHelp({ category: 'query' });
        expect(result).toContain('Queries');
        expect(result).toContain('listOrganizations');
        expect(result).toContain('listPosts');
        expect(result).not.toContain('## Mutations');
        expect(result).not.toContain('createPost');
        expect(result).not.toContain('deletePost');
    });

    // --- Scenario 3: List only mutation actions ---

    it('filters by mutation category', () => {
        const result = handleBufferApiHelp({ category: 'mutation' });
        expect(result).toContain('Mutations');
        expect(result).toContain('createPost');
        expect(result).toContain('deletePost');
        expect(result).toContain('createIdea');
        expect(result).not.toContain('## Queries');
        expect(result).not.toContain('listOrganizations');
    });

    // --- Scenario 4: Detailed help for a query action ---

    it('returns detailed help for listPosts', () => {
        const result = handleBufferApiHelp({ action: 'listPosts' });
        expect(result).toContain('## listPosts');
        expect(result).toContain('Category');
        expect(result).toContain('query');
        expect(result).toContain('Parameters');
        expect(result).toContain('organizationId');
        expect(result).toContain('required');
        expect(result).toContain('first');
        expect(result).toContain('optional');
        expect(result).toContain('after');
    });

    it('shows example payload for listPosts', () => {
        const result = handleBufferApiHelp({ action: 'listPosts' });
        expect(result).toContain('Examples');
        expect(result).toContain('organizationId');
    });

    // --- Scenario 5: Detailed help for a mutation action ---

    it('returns detailed help for createPost', () => {
        const result = handleBufferApiHelp({ action: 'createPost' });
        expect(result).toContain('## createPost');
        expect(result).toContain('Category');
        expect(result).toContain('mutation');
        expect(result).toContain('Parameters');
        expect(result).toContain('channelId');
        expect(result).toContain('required');
        expect(result).toContain('schedulingType');
        expect(result).toContain('mode');
        expect(result).toContain('saveToDraft');
        expect(result).toContain('optional');
    });

    it('shows example payload for createPost', () => {
        const result = handleBufferApiHelp({ action: 'createPost' });
        expect(result).toContain('Examples');
    });

    // --- Scenario 6: Detailed help for a simple action ---

    it('returns detailed help for deletePost', () => {
        const result = handleBufferApiHelp({ action: 'deletePost' });
        expect(result).toContain('## deletePost');
        expect(result).toContain('mutation');
        expect(result).toContain('postId');
        expect(result).toContain('required');
    });

    // --- Scenario 7: Unknown action ---

    it('returns error message for unknown action', () => {
        const result = handleBufferApiHelp({ action: 'updatePost' });
        expect(result).toContain('Unknown action');
        expect(result).toContain('updatePost');
        expect(result).toContain('buffer_api_help');
    });

    it('returns error for another unknown action', () => {
        const result = handleBufferApiHelp({ action: 'nonexistent' });
        expect(result).toContain('Unknown action');
        expect(result).toContain('nonexistent');
    });

    // --- Scenario 8: Both action and category provided ---

    it('action takes precedence over category', () => {
        const result = handleBufferApiHelp({ action: 'listChannels', category: 'mutation' });
        expect(result).toContain('## listChannels');
        expect(result).toContain('query');
        expect(result).toContain('organizationId');
    });

    // --- Scenario 9: Action with parameters and example ---

    it('shows getDailyPostingLimits help with parameters and example', () => {
        const result = handleBufferApiHelp({ action: 'getDailyPostingLimits' });
        expect(result).toContain('## getDailyPostingLimits');
        expect(result).toContain('channelIds');
        expect(result).toContain('required');
        expect(result).toContain('date');
        expect(result).toContain('optional');
        expect(result).toContain('Examples');
    });

    // --- Additional coverage ---

    it('includes Zod descriptions in parameter help', () => {
        const result = handleBufferApiHelp({ action: 'listPosts' });
        expect(result).toContain('Pagination cursor');
    });

    it('shows getChannel help with channelId parameter', () => {
        const result = handleBufferApiHelp({ action: 'getChannel' });
        expect(result).toContain('## getChannel');
        expect(result).toContain('channelId');
        expect(result).toContain('query');
    });

    it('shows listOrganizations help with no required parameters', () => {
        const result = handleBufferApiHelp({ action: 'listOrganizations' });
        expect(result).toContain('## listOrganizations');
        expect(result).toContain('query');
    });

    it('shows createIdea help with nested content parameter', () => {
        const result = handleBufferApiHelp({ action: 'createIdea' });
        expect(result).toContain('## createIdea');
        expect(result).toContain('mutation');
        expect(result).toContain('organizationId');
        expect(result).toContain('required');
        expect(result).toContain('content');
    });
});
