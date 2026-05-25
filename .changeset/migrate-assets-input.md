---
"@damusix/buffer-mcp": major
---

## Breaking Changes

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
    { video: { url: "https://example.com/video.mp4" } }
]
```

## Fixed

* `fix(types):` Resolve three TypeScript errors from `@logosdx/fetch` v8 type changes
