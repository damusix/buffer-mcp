# @damusix/buffer-mcp

## 1.0.0

### Major Changes

- [`9e48db0`](https://github.com/damusix/buffer-mcp/commit/9e48db03c88dd751184f4ccf5549951f7ea65053) Thanks [@damusix](https://github.com/damusix)! - ## Breaking Changes

  ### `createPost` assets input changed from object to ordered array

  Buffer's GraphQL API replaced `AssetsInput` (object with `images`, `videos`, `documents`, `link` fields) with `[AssetInput!]` (ordered array where each item is exactly one of `image`, `video`, `document`, or `link`).

  **Before:**

  ```ts
  assets: {
      images: [{ url: "https://example.com/photo.jpg" }],
      videos: [{ url: "https://example.com/video.mp4" }]
  }
  ```

  **After:**

  ```ts
  assets: [
    { image: { url: "https://example.com/photo.jpg" } },
    { video: { url: "https://example.com/video.mp4" } },
  ];
  ```

  ## Fixed

  - `fix(types):` Resolve three TypeScript errors from `@logosdx/fetch` v8 type changes

## 0.2.1

### Patch Changes

- [`3912228`](https://github.com/damusix/buffer-mcp/commit/39122280d5dd9a9d52d2e0c19c9190e7102c9f69) - Fix 5 bugs breaking listPosts, getPost, getDailyPostingLimits, and createIdea

  - Wrong API endpoint path (`/graphql` → `/`)
  - FetchEngine response wrapper not unwrapped before processing
  - Bare `error` field in post queries now selects subfields (`message`, `supportUrl`, `rawError`)
  - `getDailyPostingLimits` query corrected: `channel { ... }` → `channelId`, removed nonexistent `used` field
  - `createIdea` fragment corrected: `... on IdeaResponse` → `... on Idea`

## 0.2.0

### Minor Changes

- [`8563532`](https://github.com/damusix/buffer-mcp/commit/8563532fb78bedd4bbb32549f88e564115738634) - Complete API coverage: platform-specific metadata for all 12 services (Instagram, Facebook, Pinterest, YouTube, etc.), full asset types (videos, documents, links), expanded query response fields, and new createPost/createIdea input fields.

## 0.1.0

### Minor Changes

- [`18a2a6b`](https://github.com/damusix/buffer-mcp/commit/18a2a6b98267d3eea213dcc4e952aff04c99ec98) - Initial release — MCP server for the Buffer social media API. Manage posts, channels, and ideas via LLMs with 9 GraphQL actions, Zod validation, and comprehensive help.
