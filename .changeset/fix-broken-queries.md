---
"@damusix/buffer-mcp": patch
---

Fix 5 bugs breaking listPosts, getPost, getDailyPostingLimits, and createIdea

- Wrong API endpoint path (`/graphql` → `/`)
- FetchEngine response wrapper not unwrapped before processing
- Bare `error` field in post queries now selects subfields (`message`, `supportUrl`, `rawError`)
- `getDailyPostingLimits` query corrected: `channel { ... }` → `channelId`, removed nonexistent `used` field
- `createIdea` fragment corrected: `... on IdeaResponse` → `... on Idea`
