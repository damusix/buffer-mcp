# Buffer MCP Server

An MCP (Model Context Protocol) server for the [Buffer](https://buffer.com) social media API. Manage posts, channels, organizations, and ideas through any MCP-compatible LLM client.

## Install

```bash
pnpm add @damusix/buffer-mcp
```

Or run directly with npx:

```bash
npx @damusix/buffer-mcp
```

## Configuration

| Variable              | Required | Description                                                                                            |
| --------------------- | -------- | ------------------------------------------------------------------------------------------------------ |
| `BUFFER_ACCESS_TOKEN` | Yes      | Your Buffer API access token. Get one from [Buffer Developer Settings](https://developers.buffer.com). |

The server will exit immediately if `BUFFER_ACCESS_TOKEN` is not set.

## Usage with Claude Desktop

Add to your Claude Desktop config (`claude_desktop_config.json`):

```json
{
    "mcpServers": {
        "buffer": {
            "command": "npx",
            "args": ["@damusix/buffer-mcp"],
            "env": {
                "BUFFER_ACCESS_TOKEN": "your-token-here"
            }
        }
    }
}
```

## Usage with Claude Code

```bash
claude mcp add buffer -e BUFFER_ACCESS_TOKEN=your-token-here -- npx @damusix/buffer-mcp
```

## Usage with Other Clients

For Cursor, Windsurf, or any other MCP-compatible client, add `@damusix/buffer-mcp` as a stdio MCP server with `BUFFER_ACCESS_TOKEN` set in the environment. Consult your client's documentation for the exact configuration format.

## Tools

### use_buffer_api

Execute a Buffer API action. Takes an `action` name and an optional `payload` object.

**Available actions:**

| Action                  | Category | Description                                     |
| ----------------------- | -------- | ----------------------------------------------- |
| `listOrganizations`     | query    | List all organizations on the account           |
| `listChannels`          | query    | List channels for an organization               |
| `getChannel`            | query    | Get a single channel by ID                      |
| `listPosts`             | query    | List posts with pagination and filters          |
| `getPost`               | query    | Get a single post by ID                         |
| `getDailyPostingLimits` | query    | Get daily posting limits for channels           |
| `createPost`            | mutation | Create a new post (draft, queued, or scheduled) |
| `deletePost`            | mutation | Delete a post by ID                             |
| `createIdea`            | mutation | Create a new idea in an organization            |

**Examples:**

List organizations:

```json
{
    "action": "listOrganizations"
}
```

List posts with pagination:

```json
{
    "action": "listPosts",
    "payload": {
        "organizationId": "abc123",
        "first": 10,
        "after": "cursor-string"
    }
}
```

Create a draft post:

```json
{
    "action": "createPost",
    "payload": {
        "channelId": "abc123",
        "text": "Hello world!",
        "schedulingType": "automatic",
        "mode": "addToQueue",
        "saveToDraft": true
    }
}
```

### buffer_api_help

Get help on available actions. Takes an optional `action` name or `category` filter.

List all actions:

```json
{}
```

List only query actions:

```json
{
    "category": "query"
}
```

Get detailed help for a specific action:

```json
{
    "action": "createPost"
}
```

## Development

```bash
pnpm install
pnpm test
pnpm run build
```

## License

MIT
