# Complete Buffer API Coverage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close every gap between the Buffer GraphQL API schema and our MCP implementation — platform metadata, full asset types, missing query fields, missing input fields.

**Architecture:** Three areas of change: (1) `mutations.ts` gets expanded Zod schemas and GraphQL builders for metadata/assets/new fields on createPost and createIdea, (2) `queries.ts` gets expanded response field selections and missing filter inputs, (3) all corresponding tests updated. No new files needed — this is purely expanding existing schemas, builders, and tests.

**Tech Stack:** Zod, GraphQL query string builders, Vitest

**Important patterns in this codebase:**

- Enum values in GraphQL are passed as bare identifiers (not quoted): `type: post` not `type: "post"`
- String values are JSON-stringified: `text: "hello"`
- The builder functions cast `payload as z.infer<typeof schema>` then conditionally push parts
- Tests follow the pattern: schema validation tests + builder output tests + metadata tests
- Run tests with `pnpm test`, check with `pnpm run check`, build with `pnpm run build`

---

### Task 1: Expand createPost assets schema and builder

**Files:**

- Modify: `src/actions/mutations.ts:5-34` (createPostSchema) and `src/actions/mutations.ts:61-99` (buildCreatePostMutation)

- [ ] **Step 1: Write failing tests for new asset types**

Add these tests to `src/__tests__/actions/mutations.test.ts` inside the `createPost` describe block, after the existing `builds mutation with image assets` test:

```typescript
it('accepts image assets with thumbnailUrl and metadata', () => {
    const action = getAction('createPost')!;
    const result = action.inputSchema.safeParse({
        channelId: 'ch1',
        schedulingType: 'automatic',
        mode: 'addToQueue',
        assets: {
            images: [
                {
                    url: 'https://example.com/photo.jpg',
                    thumbnailUrl: 'https://example.com/photo-thumb.jpg',
                    metadata: { altText: 'A photo' },
                },
            ],
        },
    });
    expect(result.success).toBe(true);
});

it('builds mutation with image thumbnailUrl and metadata', () => {
    const action = getAction('createPost')!;
    const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
    const query = builder({
        channelId: 'ch1',
        schedulingType: 'automatic',
        mode: 'addToQueue',
        assets: {
            images: [
                {
                    url: 'https://example.com/photo.jpg',
                    thumbnailUrl: 'https://example.com/photo-thumb.jpg',
                    metadata: { altText: 'Pool party' },
                },
            ],
        },
    });
    expect(query).toContain('url: "https://example.com/photo.jpg"');
    expect(query).toContain('thumbnailUrl: "https://example.com/photo-thumb.jpg"');
    expect(query).toContain('altText: "Pool party"');
});

it('accepts video assets', () => {
    const action = getAction('createPost')!;
    const result = action.inputSchema.safeParse({
        channelId: 'ch1',
        schedulingType: 'automatic',
        mode: 'addToQueue',
        assets: {
            videos: [{ url: 'https://example.com/video.mp4' }],
        },
    });
    expect(result.success).toBe(true);
});

it('builds mutation with video assets', () => {
    const action = getAction('createPost')!;
    const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
    const query = builder({
        channelId: 'ch1',
        schedulingType: 'automatic',
        mode: 'addToQueue',
        assets: {
            videos: [
                {
                    url: 'https://example.com/video.mp4',
                    thumbnailUrl: 'https://example.com/video-thumb.jpg',
                    metadata: { title: 'My Video' },
                },
            ],
        },
    });
    expect(query).toContain('videos: [');
    expect(query).toContain('url: "https://example.com/video.mp4"');
    expect(query).toContain('thumbnailUrl: "https://example.com/video-thumb.jpg"');
    expect(query).toContain('title: "My Video"');
});

it('accepts document assets', () => {
    const action = getAction('createPost')!;
    const result = action.inputSchema.safeParse({
        channelId: 'ch1',
        schedulingType: 'automatic',
        mode: 'addToQueue',
        assets: {
            documents: [
                {
                    url: 'https://example.com/doc.pdf',
                    title: 'My PDF',
                    thumbnailUrl: 'https://example.com/doc-thumb.jpg',
                },
            ],
        },
    });
    expect(result.success).toBe(true);
});

it('builds mutation with document assets', () => {
    const action = getAction('createPost')!;
    const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
    const query = builder({
        channelId: 'ch1',
        schedulingType: 'automatic',
        mode: 'addToQueue',
        assets: {
            documents: [
                {
                    url: 'https://example.com/doc.pdf',
                    title: 'My PDF',
                    thumbnailUrl: 'https://example.com/doc-thumb.jpg',
                },
            ],
        },
    });
    expect(query).toContain('documents: [');
    expect(query).toContain('url: "https://example.com/doc.pdf"');
    expect(query).toContain('title: "My PDF"');
    expect(query).toContain('thumbnailUrl: "https://example.com/doc-thumb.jpg"');
});

it('accepts link asset', () => {
    const action = getAction('createPost')!;
    const result = action.inputSchema.safeParse({
        channelId: 'ch1',
        schedulingType: 'automatic',
        mode: 'addToQueue',
        assets: {
            link: { url: 'https://example.com/article' },
        },
    });
    expect(result.success).toBe(true);
});

it('builds mutation with link asset', () => {
    const action = getAction('createPost')!;
    const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
    const query = builder({
        channelId: 'ch1',
        schedulingType: 'automatic',
        mode: 'addToQueue',
        assets: {
            link: {
                url: 'https://example.com/article',
                title: 'Great Article',
                description: 'Read this',
                thumbnailUrl: 'https://example.com/article-thumb.jpg',
            },
        },
    });
    expect(query).toContain('link: {');
    expect(query).toContain('url: "https://example.com/article"');
    expect(query).toContain('title: "Great Article"');
    expect(query).toContain('description: "Read this"');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test`
Expected: Multiple failures — schema rejects videos/documents/link, builder doesn't output them.

- [ ] **Step 3: Expand the assets Zod schema in mutations.ts**

Replace the `assets` field in `createPostSchema` (lines 20-32) with:

```typescript
assets: z
    .object({
        images: z
            .array(
                z.object({
                    url: z.string().describe('Image URL'),
                    thumbnailUrl: z.string().optional().describe('Thumbnail URL'),
                    metadata: z
                        .object({
                            altText: z.string().describe('Alt text for the image'),
                            animatedThumbnail: z
                                .string()
                                .optional()
                                .describe('Animated thumbnail URL'),
                        })
                        .optional()
                        .describe('Image metadata'),
                }),
            )
            .optional()
            .describe('Image attachments'),
        videos: z
            .array(
                z.object({
                    url: z.string().describe('Video URL'),
                    thumbnailUrl: z.string().optional().describe('Thumbnail URL'),
                    metadata: z
                        .object({
                            thumbnailOffset: z
                                .number()
                                .optional()
                                .describe('Thumbnail offset in ms'),
                            title: z.string().optional().describe('Video title'),
                        })
                        .optional()
                        .describe('Video metadata'),
                }),
            )
            .optional()
            .describe('Video attachments'),
        documents: z
            .array(
                z.object({
                    url: z.string().describe('Document URL'),
                    title: z.string().describe('Document title'),
                    thumbnailUrl: z.string().describe('Thumbnail URL'),
                }),
            )
            .optional()
            .describe('Document attachments'),
        link: z
            .object({
                url: z.string().describe('Link URL'),
                title: z.string().optional().describe('Link title'),
                description: z.string().optional().describe('Link description'),
                thumbnailUrl: z.string().optional().describe('Thumbnail URL'),
            })
            .optional()
            .describe('Link attachment'),
    })
    .optional()
    .describe('Media attachments (images, videos, documents, or link)'),
```

- [ ] **Step 4: Update the builder to serialize all asset types**

Replace the assets block in `buildCreatePostMutation` (the `if (p.assets?.images?.length)` block) with:

```typescript
const assetParts: string[] = [];
if (p.assets?.images?.length) {
    const imgs = p.assets.images
        .map((i) => {
            const iParts = [`url: ${JSON.stringify(i.url)}`];
            if (i.thumbnailUrl) iParts.push(`thumbnailUrl: ${JSON.stringify(i.thumbnailUrl)}`);
            if (i.metadata) {
                const mParts = [`altText: ${JSON.stringify(i.metadata.altText)}`];
                if (i.metadata.animatedThumbnail)
                    mParts.push(
                        `animatedThumbnail: ${JSON.stringify(i.metadata.animatedThumbnail)}`,
                    );
                iParts.push(`metadata: { ${mParts.join(', ')} }`);
            }
            return `{ ${iParts.join(', ')} }`;
        })
        .join(', ');
    assetParts.push(`images: [${imgs}]`);
}
if (p.assets?.videos?.length) {
    const vids = p.assets.videos
        .map((v) => {
            const vParts = [`url: ${JSON.stringify(v.url)}`];
            if (v.thumbnailUrl) vParts.push(`thumbnailUrl: ${JSON.stringify(v.thumbnailUrl)}`);
            if (v.metadata) {
                const mParts: string[] = [];
                if (v.metadata.thumbnailOffset !== undefined)
                    mParts.push(`thumbnailOffset: ${v.metadata.thumbnailOffset}`);
                if (v.metadata.title) mParts.push(`title: ${JSON.stringify(v.metadata.title)}`);
                if (mParts.length) vParts.push(`metadata: { ${mParts.join(', ')} }`);
            }
            return `{ ${vParts.join(', ')} }`;
        })
        .join(', ');
    assetParts.push(`videos: [${vids}]`);
}
if (p.assets?.documents?.length) {
    const docs = p.assets.documents
        .map(
            (d) =>
                `{ url: ${JSON.stringify(d.url)}, title: ${JSON.stringify(d.title)}, thumbnailUrl: ${JSON.stringify(d.thumbnailUrl)} }`,
        )
        .join(', ');
    assetParts.push(`documents: [${docs}]`);
}
if (p.assets?.link) {
    const lParts = [`url: ${JSON.stringify(p.assets.link.url)}`];
    if (p.assets.link.title) lParts.push(`title: ${JSON.stringify(p.assets.link.title)}`);
    if (p.assets.link.description)
        lParts.push(`description: ${JSON.stringify(p.assets.link.description)}`);
    if (p.assets.link.thumbnailUrl)
        lParts.push(`thumbnailUrl: ${JSON.stringify(p.assets.link.thumbnailUrl)}`);
    assetParts.push(`link: { ${lParts.join(', ')} }`);
}
if (assetParts.length) {
    parts.push(`assets: { ${assetParts.join(', ')} }`);
}
```

Also update the response fragment to include VideoAsset and DocumentAsset:

```
assets {
    id type mimeType source thumbnail
    ... on ImageAsset { image { altText width height isAnimated } }
    ... on VideoAsset { video { durationMs width height } }
    ... on DocumentAsset { document { filesize numPages } }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test`
Expected: All tests pass including new asset type tests.

- [ ] **Step 6: Commit**

```
git add src/actions/mutations.ts src/__tests__/actions/mutations.test.ts
git commit -m "expand createPost assets to support images, videos, documents, and links"
```

---

### Task 2: Add platform metadata to createPost

**Files:**

- Modify: `src/actions/mutations.ts` (createPostSchema and buildCreatePostMutation)
- Modify: `src/__tests__/actions/mutations.test.ts`

- [ ] **Step 1: Write failing tests for metadata**

Add these tests to `src/__tests__/actions/mutations.test.ts` inside the `createPost` describe block:

```typescript
it('accepts Instagram metadata with type', () => {
    const action = getAction('createPost')!;
    const result = action.inputSchema.safeParse({
        channelId: 'ch1',
        schedulingType: 'automatic',
        mode: 'addToQueue',
        metadata: {
            instagram: { type: 'post', shouldShareToFeed: true },
        },
    });
    expect(result.success).toBe(true);
});

it('accepts Instagram reel with firstComment', () => {
    const action = getAction('createPost')!;
    const result = action.inputSchema.safeParse({
        channelId: 'ch1',
        schedulingType: 'automatic',
        mode: 'addToQueue',
        metadata: {
            instagram: {
                type: 'reel',
                shouldShareToFeed: true,
                firstComment: 'First!',
            },
        },
    });
    expect(result.success).toBe(true);
});

it('rejects invalid Instagram type', () => {
    const action = getAction('createPost')!;
    const result = action.inputSchema.safeParse({
        channelId: 'ch1',
        schedulingType: 'automatic',
        mode: 'addToQueue',
        metadata: {
            instagram: { type: 'invalid', shouldShareToFeed: true },
        },
    });
    expect(result.success).toBe(false);
});

it('accepts Facebook metadata with type', () => {
    const action = getAction('createPost')!;
    const result = action.inputSchema.safeParse({
        channelId: 'ch1',
        schedulingType: 'automatic',
        mode: 'addToQueue',
        metadata: {
            facebook: { type: 'post' },
        },
    });
    expect(result.success).toBe(true);
});

it('accepts LinkedIn metadata with firstComment', () => {
    const action = getAction('createPost')!;
    const result = action.inputSchema.safeParse({
        channelId: 'ch1',
        schedulingType: 'automatic',
        mode: 'addToQueue',
        metadata: {
            linkedin: { firstComment: 'Follow us!' },
        },
    });
    expect(result.success).toBe(true);
});

it('accepts Pinterest metadata with boardServiceId', () => {
    const action = getAction('createPost')!;
    const result = action.inputSchema.safeParse({
        channelId: 'ch1',
        schedulingType: 'automatic',
        mode: 'addToQueue',
        metadata: {
            pinterest: { boardServiceId: 'board123' },
        },
    });
    expect(result.success).toBe(true);
});

it('accepts YouTube metadata with required fields', () => {
    const action = getAction('createPost')!;
    const result = action.inputSchema.safeParse({
        channelId: 'ch1',
        schedulingType: 'automatic',
        mode: 'addToQueue',
        metadata: {
            youtube: { title: 'My Video', categoryId: '22' },
        },
    });
    expect(result.success).toBe(true);
});

it('accepts Google Business metadata with type', () => {
    const action = getAction('createPost')!;
    const result = action.inputSchema.safeParse({
        channelId: 'ch1',
        schedulingType: 'automatic',
        mode: 'addToQueue',
        metadata: {
            google: { type: 'offer' },
        },
    });
    expect(result.success).toBe(true);
});

it('builds mutation with Instagram metadata', () => {
    const action = getAction('createPost')!;
    const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
    const query = builder({
        channelId: 'ch1',
        schedulingType: 'automatic',
        mode: 'addToQueue',
        metadata: {
            instagram: { type: 'reel', shouldShareToFeed: true, firstComment: 'Nice!' },
        },
    });
    expect(query).toContain('metadata: {');
    expect(query).toContain('instagram: {');
    expect(query).toContain('type: reel');
    expect(query).not.toContain('type: "reel"');
    expect(query).toContain('shouldShareToFeed: true');
    expect(query).toContain('firstComment: "Nice!"');
});

it('builds mutation with Facebook metadata', () => {
    const action = getAction('createPost')!;
    const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
    const query = builder({
        channelId: 'ch1',
        schedulingType: 'automatic',
        mode: 'addToQueue',
        metadata: {
            facebook: { type: 'reel', firstComment: 'Check it out' },
        },
    });
    expect(query).toContain('facebook: {');
    expect(query).toContain('type: reel');
    expect(query).toContain('firstComment: "Check it out"');
});

it('builds mutation with Pinterest metadata', () => {
    const action = getAction('createPost')!;
    const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
    const query = builder({
        channelId: 'ch1',
        schedulingType: 'automatic',
        mode: 'addToQueue',
        metadata: {
            pinterest: {
                boardServiceId: 'board123',
                title: 'Pin Title',
                url: 'https://example.com',
            },
        },
    });
    expect(query).toContain('pinterest: {');
    expect(query).toContain('boardServiceId: "board123"');
    expect(query).toContain('title: "Pin Title"');
    expect(query).toContain('url: "https://example.com"');
});

it('builds mutation with YouTube metadata', () => {
    const action = getAction('createPost')!;
    const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
    const query = builder({
        channelId: 'ch1',
        schedulingType: 'automatic',
        mode: 'addToQueue',
        metadata: {
            youtube: {
                title: 'My Video',
                categoryId: '22',
                privacy: 'public',
                madeForKids: false,
            },
        },
    });
    expect(query).toContain('youtube: {');
    expect(query).toContain('title: "My Video"');
    expect(query).toContain('categoryId: "22"');
    expect(query).toContain('privacy: public');
    expect(query).not.toContain('privacy: "public"');
    expect(query).toContain('madeForKids: false');
});

it('builds mutation with Google Business metadata', () => {
    const action = getAction('createPost')!;
    const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
    const query = builder({
        channelId: 'ch1',
        schedulingType: 'automatic',
        mode: 'addToQueue',
        metadata: {
            google: { type: 'event', title: 'Grand Opening' },
        },
    });
    expect(query).toContain('google: {');
    expect(query).toContain('type: event');
    expect(query).toContain('title: "Grand Opening"');
});

it('builds mutation with Mastodon metadata', () => {
    const action = getAction('createPost')!;
    const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
    const query = builder({
        channelId: 'ch1',
        schedulingType: 'automatic',
        mode: 'addToQueue',
        metadata: {
            mastodon: { spoilerText: 'Content warning' },
        },
    });
    expect(query).toContain('mastodon: {');
    expect(query).toContain('spoilerText: "Content warning"');
});

it('builds mutation with TikTok metadata', () => {
    const action = getAction('createPost')!;
    const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
    const query = builder({
        channelId: 'ch1',
        schedulingType: 'automatic',
        mode: 'addToQueue',
        metadata: { tiktok: { title: 'My TikTok' } },
    });
    expect(query).toContain('tiktok: {');
    expect(query).toContain('title: "My TikTok"');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test`
Expected: Failures — schema doesn't have metadata field.

- [ ] **Step 3: Add metadata Zod schema to createPostSchema**

Add this field to `createPostSchema` after `tagIds`:

```typescript
metadata: z
    .object({
        instagram: z
            .object({
                type: z.enum(['post', 'story', 'reel']).describe('Instagram post type'),
                firstComment: z.string().optional().describe('First comment text'),
                link: z.string().optional().describe('Link sticker URL'),
                shouldShareToFeed: z.boolean().describe('Share reels/stories to feed'),
            })
            .optional()
            .describe('Instagram-specific metadata'),
        facebook: z
            .object({
                type: z.enum(['post', 'story', 'reel']).describe('Facebook post type'),
                firstComment: z.string().optional().describe('First comment text'),
            })
            .optional()
            .describe('Facebook-specific metadata'),
        linkedin: z
            .object({
                firstComment: z.string().optional().describe('First comment text'),
            })
            .optional()
            .describe('LinkedIn-specific metadata'),
        twitter: z
            .object({})
            .optional()
            .describe('Twitter/X-specific metadata'),
        pinterest: z
            .object({
                title: z.string().optional().describe('Pin title'),
                url: z.string().optional().describe('Pin destination URL'),
                boardServiceId: z.string().describe('Pinterest board ID (required)'),
            })
            .optional()
            .describe('Pinterest-specific metadata'),
        google: z
            .object({
                type: z.enum(['post', 'offer', 'event', 'whatsNew']).describe('Google Business post type'),
                title: z.string().optional().describe('Post title'),
            })
            .optional()
            .describe('Google Business-specific metadata'),
        youtube: z
            .object({
                title: z.string().describe('Video title (required)'),
                categoryId: z.string().describe('YouTube category ID (required)'),
                privacy: z.enum(['public', 'private', 'unlisted']).optional().describe('Privacy setting'),
                license: z.enum(['youtube', 'creativeCommon']).optional().describe('License type'),
                notifySubscribers: z.boolean().optional().describe('Notify subscribers'),
                embeddable: z.boolean().optional().describe('Allow embedding'),
                madeForKids: z.boolean().optional().describe('Made for kids'),
            })
            .optional()
            .describe('YouTube-specific metadata'),
        mastodon: z
            .object({
                spoilerText: z.string().optional().describe('Content warning text'),
            })
            .optional()
            .describe('Mastodon-specific metadata'),
        threads: z
            .object({
                type: z.enum(['post', 'story', 'reel']).optional().describe('Threads post type'),
                topic: z.string().optional().describe('Topic'),
                locationId: z.string().optional().describe('Location ID'),
                locationName: z.string().optional().describe('Location name'),
            })
            .optional()
            .describe('Threads-specific metadata'),
        bluesky: z
            .object({})
            .optional()
            .describe('Bluesky-specific metadata'),
        tiktok: z
            .object({
                title: z.string().optional().describe('TikTok video title'),
            })
            .optional()
            .describe('TikTok-specific metadata'),
        startPage: z
            .object({
                link: z.string().optional().describe('Start Page link'),
            })
            .optional()
            .describe('Start Page-specific metadata'),
    })
    .optional()
    .describe('Platform-specific metadata (required for Instagram, Facebook, Pinterest, YouTube, Google Business)'),
```

- [ ] **Step 4: Add metadata serialization to buildCreatePostMutation**

Add this block before the closing `return` in `buildCreatePostMutation`, after the assets block:

```typescript
if (p.metadata) {
    const metaParts: string[] = [];

    if (p.metadata.instagram) {
        const ig = p.metadata.instagram;
        const igParts = [`type: ${ig.type}`, `shouldShareToFeed: ${ig.shouldShareToFeed}`];
        if (ig.firstComment) igParts.push(`firstComment: ${JSON.stringify(ig.firstComment)}`);
        if (ig.link) igParts.push(`link: ${JSON.stringify(ig.link)}`);
        metaParts.push(`instagram: { ${igParts.join(', ')} }`);
    }
    if (p.metadata.facebook) {
        const fb = p.metadata.facebook;
        const fbParts = [`type: ${fb.type}`];
        if (fb.firstComment) fbParts.push(`firstComment: ${JSON.stringify(fb.firstComment)}`);
        metaParts.push(`facebook: { ${fbParts.join(', ')} }`);
    }
    if (p.metadata.linkedin) {
        const li = p.metadata.linkedin;
        const liParts: string[] = [];
        if (li.firstComment) liParts.push(`firstComment: ${JSON.stringify(li.firstComment)}`);
        if (liParts.length) metaParts.push(`linkedin: { ${liParts.join(', ')} }`);
    }
    if (p.metadata.pinterest) {
        const pin = p.metadata.pinterest;
        const pinParts = [`boardServiceId: ${JSON.stringify(pin.boardServiceId)}`];
        if (pin.title) pinParts.push(`title: ${JSON.stringify(pin.title)}`);
        if (pin.url) pinParts.push(`url: ${JSON.stringify(pin.url)}`);
        metaParts.push(`pinterest: { ${pinParts.join(', ')} }`);
    }
    if (p.metadata.google) {
        const g = p.metadata.google;
        const gParts = [`type: ${g.type}`];
        if (g.title) gParts.push(`title: ${JSON.stringify(g.title)}`);
        metaParts.push(`google: { ${gParts.join(', ')} }`);
    }
    if (p.metadata.youtube) {
        const yt = p.metadata.youtube;
        const ytParts = [
            `title: ${JSON.stringify(yt.title)}`,
            `categoryId: ${JSON.stringify(yt.categoryId)}`,
        ];
        if (yt.privacy) ytParts.push(`privacy: ${yt.privacy}`);
        if (yt.license) ytParts.push(`license: ${yt.license}`);
        if (yt.notifySubscribers !== undefined)
            ytParts.push(`notifySubscribers: ${yt.notifySubscribers}`);
        if (yt.embeddable !== undefined) ytParts.push(`embeddable: ${yt.embeddable}`);
        if (yt.madeForKids !== undefined) ytParts.push(`madeForKids: ${yt.madeForKids}`);
        metaParts.push(`youtube: { ${ytParts.join(', ')} }`);
    }
    if (p.metadata.mastodon) {
        const m = p.metadata.mastodon;
        const mParts: string[] = [];
        if (m.spoilerText) mParts.push(`spoilerText: ${JSON.stringify(m.spoilerText)}`);
        if (mParts.length) metaParts.push(`mastodon: { ${mParts.join(', ')} }`);
    }
    if (p.metadata.threads) {
        const th = p.metadata.threads;
        const thParts: string[] = [];
        if (th.type) thParts.push(`type: ${th.type}`);
        if (th.topic) thParts.push(`topic: ${JSON.stringify(th.topic)}`);
        if (th.locationId) thParts.push(`locationId: ${JSON.stringify(th.locationId)}`);
        if (th.locationName) thParts.push(`locationName: ${JSON.stringify(th.locationName)}`);
        if (thParts.length) metaParts.push(`threads: { ${thParts.join(', ')} }`);
    }
    if (p.metadata.tiktok) {
        const tt = p.metadata.tiktok;
        const ttParts: string[] = [];
        if (tt.title) ttParts.push(`title: ${JSON.stringify(tt.title)}`);
        if (ttParts.length) metaParts.push(`tiktok: { ${ttParts.join(', ')} }`);
    }
    if (p.metadata.startPage) {
        const sp = p.metadata.startPage;
        const spParts: string[] = [];
        if (sp.link) spParts.push(`link: ${JSON.stringify(sp.link)}`);
        if (spParts.length) metaParts.push(`startPage: { ${spParts.join(', ')} }`);
    }

    if (metaParts.length) {
        parts.push(`metadata: { ${metaParts.join(', ')} }`);
    }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test`
Expected: All tests pass.

- [ ] **Step 6: Commit**

```
git add src/actions/mutations.ts src/__tests__/actions/mutations.test.ts
git commit -m "add platform-specific metadata to createPost for all 12 services"
```

---

### Task 3: Add missing createPost input fields (ideaId, draftId, source, aiAssisted)

**Files:**

- Modify: `src/actions/mutations.ts` (createPostSchema and buildCreatePostMutation)
- Modify: `src/__tests__/actions/mutations.test.ts`

- [ ] **Step 1: Write failing tests**

Add to `src/__tests__/actions/mutations.test.ts` inside `createPost` describe:

```typescript
it('accepts ideaId field', () => {
    const action = getAction('createPost')!;
    const result = action.inputSchema.safeParse({
        channelId: 'ch1',
        schedulingType: 'automatic',
        mode: 'addToQueue',
        ideaId: 'idea123',
    });
    expect(result.success).toBe(true);
});

it('builds mutation with ideaId', () => {
    const action = getAction('createPost')!;
    const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
    const query = builder({
        channelId: 'ch1',
        schedulingType: 'automatic',
        mode: 'addToQueue',
        ideaId: 'idea123',
    });
    expect(query).toContain('ideaId: "idea123"');
});

it('accepts draftId field', () => {
    const action = getAction('createPost')!;
    const result = action.inputSchema.safeParse({
        channelId: 'ch1',
        schedulingType: 'automatic',
        mode: 'addToQueue',
        draftId: 'draft456',
    });
    expect(result.success).toBe(true);
});

it('builds mutation with draftId', () => {
    const action = getAction('createPost')!;
    const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
    const query = builder({
        channelId: 'ch1',
        schedulingType: 'automatic',
        mode: 'addToQueue',
        draftId: 'draft456',
    });
    expect(query).toContain('draftId: "draft456"');
});

it('accepts source and aiAssisted fields', () => {
    const action = getAction('createPost')!;
    const result = action.inputSchema.safeParse({
        channelId: 'ch1',
        schedulingType: 'automatic',
        mode: 'addToQueue',
        source: 'mcp',
        aiAssisted: true,
    });
    expect(result.success).toBe(true);
});

it('builds mutation with source and aiAssisted', () => {
    const action = getAction('createPost')!;
    const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
    const query = builder({
        channelId: 'ch1',
        schedulingType: 'automatic',
        mode: 'addToQueue',
        source: 'mcp',
        aiAssisted: true,
    });
    expect(query).toContain('source: "mcp"');
    expect(query).toContain('aiAssisted: true');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test`
Expected: Failures on ideaId, draftId, source, aiAssisted.

- [ ] **Step 3: Add fields to createPostSchema**

Add these fields to `createPostSchema` after `tagIds`:

```typescript
ideaId: z.string().optional().describe('ID of an existing idea to create the post from'),
draftId: z.string().optional().describe('ID of an existing draft to create the post from'),
source: z.string().optional().describe('Source identifier for tracking post origin'),
aiAssisted: z.boolean().optional().describe('Whether AI assisted in creating the post'),
```

- [ ] **Step 4: Add serialization to buildCreatePostMutation**

Add these lines in `buildCreatePostMutation` after the `tagIds` block and before the assets block:

```typescript
if (p.ideaId) parts.push(`ideaId: "${p.ideaId}"`);
if (p.draftId) parts.push(`draftId: "${p.draftId}"`);
if (p.source) parts.push(`source: ${JSON.stringify(p.source)}`);
if (p.aiAssisted !== undefined) parts.push(`aiAssisted: ${p.aiAssisted}`);
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test`
Expected: All pass.

- [ ] **Step 6: Commit**

```
git add src/actions/mutations.ts src/__tests__/actions/mutations.test.ts
git commit -m "add ideaId, draftId, source, aiAssisted fields to createPost"
```

---

### Task 4: Expand createIdea with missing fields

**Files:**

- Modify: `src/actions/mutations.ts` (createIdeaSchema and buildCreateIdeaMutation)
- Modify: `src/__tests__/actions/mutations.test.ts`

- [ ] **Step 1: Write failing tests**

Add to `src/__tests__/actions/mutations.test.ts` inside `createIdea` describe:

```typescript
it('accepts cta, group, and templateId', () => {
    const action = getAction('createIdea')!;
    const result = action.inputSchema.safeParse({
        organizationId: 'org123',
        content: { title: 'Test' },
        cta: 'Learn more',
        group: { groupId: 'grp1', placeAfterId: 'idea999' },
        templateId: 'tmpl1',
    });
    expect(result.success).toBe(true);
});

it('accepts content with tags, aiAssisted, services, and date', () => {
    const action = getAction('createIdea')!;
    const result = action.inputSchema.safeParse({
        organizationId: 'org123',
        content: {
            title: 'Test',
            tags: [{ id: 'tag1', name: 'Summer', color: '#FF0000' }],
            aiAssisted: true,
            services: ['instagram', 'facebook'],
            date: '2026-05-01T09:00:00Z',
        },
    });
    expect(result.success).toBe(true);
});

it('accepts media with thumbnailUrl and size', () => {
    const action = getAction('createIdea')!;
    const result = action.inputSchema.safeParse({
        organizationId: 'org123',
        content: {
            media: [
                {
                    url: 'https://example.com/img.jpg',
                    type: 'image',
                    thumbnailUrl: 'https://example.com/thumb.jpg',
                    size: 102400,
                },
            ],
        },
    });
    expect(result.success).toBe(true);
});

it('builds mutation with cta and group', () => {
    const action = getAction('createIdea')!;
    const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
    const query = builder({
        organizationId: 'org123',
        content: { title: 'Test' },
        cta: 'Learn more',
        group: { groupId: 'grp1' },
    });
    expect(query).toContain('cta: "Learn more"');
    expect(query).toContain('group: { groupId: "grp1" }');
});

it('builds mutation with content tags and services', () => {
    const action = getAction('createIdea')!;
    const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
    const query = builder({
        organizationId: 'org123',
        content: {
            title: 'Tagged',
            tags: [{ id: 'tag1', name: 'Summer', color: '#FF0000' }],
            services: ['instagram', 'facebook'],
            date: '2026-05-01T09:00:00Z',
        },
    });
    expect(query).toContain('tags: [');
    expect(query).toContain('id: "tag1"');
    expect(query).toContain('name: "Summer"');
    expect(query).toContain('services: [instagram, facebook]');
    expect(query).toContain('date: "2026-05-01T09:00:00Z"');
});

it('builds mutation with media thumbnailUrl', () => {
    const action = getAction('createIdea')!;
    const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
    const query = builder({
        organizationId: 'org123',
        content: {
            media: [
                {
                    url: 'https://example.com/img.jpg',
                    type: 'image',
                    thumbnailUrl: 'https://example.com/thumb.jpg',
                    size: 102400,
                },
            ],
        },
    });
    expect(query).toContain('thumbnailUrl: "https://example.com/thumb.jpg"');
    expect(query).toContain('size: 102400');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test`

- [ ] **Step 3: Expand createIdeaSchema**

Replace the entire `createIdeaSchema` with:

```typescript
const createIdeaSchema = z.object({
    organizationId: z.string().describe('The organization ID'),
    content: z
        .object({
            title: z.string().optional().describe('Idea title'),
            text: z.string().optional().describe('Idea body text'),
            media: z
                .array(
                    z.object({
                        url: z.string().describe('Media URL'),
                        type: z.enum(['image', 'video']).describe('Media type'),
                        alt: z.string().optional().describe('Alt text'),
                        thumbnailUrl: z.string().optional().describe('Thumbnail URL'),
                        size: z.number().optional().describe('File size in bytes'),
                    }),
                )
                .optional()
                .describe('Media attachments'),
            tags: z
                .array(
                    z.object({
                        id: z.string().describe('Tag ID'),
                        name: z.string().describe('Tag name'),
                        color: z.string().describe('Tag hex color'),
                    }),
                )
                .optional()
                .describe('Tags to apply'),
            aiAssisted: z.boolean().optional().describe('Whether AI assisted in creating the idea'),
            services: z
                .array(z.string())
                .optional()
                .describe('Target platform services (e.g. instagram, facebook)'),
            date: z.string().optional().describe('Target publish date (ISO 8601)'),
        })
        .describe('Idea content'),
    tagIds: z.array(z.string()).optional().describe('Tag IDs to apply'),
    cta: z.string().optional().describe('Call-to-action text'),
    group: z
        .object({
            groupId: z.string().describe('Group ID to place the idea in'),
            placeAfterId: z.string().optional().describe('Place after this idea ID'),
        })
        .optional()
        .describe('Idea group placement'),
    templateId: z.string().optional().describe('Template ID to create from'),
});
```

- [ ] **Step 4: Update buildCreateIdeaMutation**

Replace `buildCreateIdeaMutation` with:

```typescript
function buildCreateIdeaMutation(payload: Record<string, unknown>): string {
    const p = payload as z.infer<typeof createIdeaSchema>;
    const contentParts: string[] = [];

    if (p.content.title) contentParts.push(`title: ${JSON.stringify(p.content.title)}`);
    if (p.content.text) contentParts.push(`text: ${JSON.stringify(p.content.text)}`);
    if (p.content.media?.length) {
        const mediaItems = p.content.media
            .map((m) => {
                const mParts = [`url: ${JSON.stringify(m.url)}`, `type: ${m.type}`];
                if (m.alt) mParts.push(`alt: ${JSON.stringify(m.alt)}`);
                if (m.thumbnailUrl) mParts.push(`thumbnailUrl: ${JSON.stringify(m.thumbnailUrl)}`);
                if (m.size !== undefined) mParts.push(`size: ${m.size}`);
                return `{ ${mParts.join(', ')} }`;
            })
            .join(', ');
        contentParts.push(`media: [${mediaItems}]`);
    }
    if (p.content.tags?.length) {
        const tagItems = p.content.tags
            .map(
                (t) =>
                    `{ id: ${JSON.stringify(t.id)}, name: ${JSON.stringify(t.name)}, color: ${JSON.stringify(t.color)} }`,
            )
            .join(', ');
        contentParts.push(`tags: [${tagItems}]`);
    }
    if (p.content.aiAssisted !== undefined)
        contentParts.push(`aiAssisted: ${p.content.aiAssisted}`);
    if (p.content.services?.length) {
        contentParts.push(`services: [${p.content.services.join(', ')}]`);
    }
    if (p.content.date) contentParts.push(`date: ${JSON.stringify(p.content.date)}`);

    const extraParts: string[] = [];
    if (p.tagIds?.length) extraParts.push(`tagIds: ${JSON.stringify(p.tagIds)}`);
    if (p.cta) extraParts.push(`cta: ${JSON.stringify(p.cta)}`);
    if (p.group) {
        const gParts = [`groupId: ${JSON.stringify(p.group.groupId)}`];
        if (p.group.placeAfterId)
            gParts.push(`placeAfterId: ${JSON.stringify(p.group.placeAfterId)}`);
        extraParts.push(`group: { ${gParts.join(', ')} }`);
    }
    if (p.templateId) extraParts.push(`templateId: ${JSON.stringify(p.templateId)}`);

    const extraStr = extraParts.length ? `, ${extraParts.join(', ')}` : '';

    return `mutation {
    createIdea(input: {
        organizationId: "${p.organizationId}",
        content: { ${contentParts.join(', ')} }${extraStr}
    }) {
        ... on IdeaResponse {
            idea {
                id
                content { title text tags { id name color } services date }
            }
        }
        ... on InvalidInputError { message }
        ... on LimitReachedError { message }
        ... on UnauthorizedError { message }
        ... on UnexpectedError { message }
    }
}`;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test`
Expected: All pass.

- [ ] **Step 6: Commit**

```
git add src/actions/mutations.ts src/__tests__/actions/mutations.test.ts
git commit -m "expand createIdea with cta, group, templateId, content tags/services/date, media metadata"
```

---

### Task 5: Expand query response fields (channels, daily limits)

**Files:**

- Modify: `src/actions/queries.ts` (CHANNEL_FIELDS constant and getDailyPostingLimits query)
- Modify: `src/__tests__/actions/queries.test.ts`

- [ ] **Step 1: Write failing tests for new channel fields**

Add to `src/__tests__/actions/queries.test.ts` inside `listChannels` describe:

```typescript
it('includes extended channel fields in query', () => {
    const action = getAction('listChannels')!;
    const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
    const query = builder({ organizationId: 'org123' });
    expect(query).toContain('descriptor');
    expect(query).toContain('isNew');
    expect(query).toContain('externalLink');
    expect(query).toContain('postingGoal');
});
```

Add inside `getDailyPostingLimits` describe:

```typescript
it('includes isAtLimit, sent, and scheduled in response', () => {
    const action = getAction('getDailyPostingLimits')!;
    const builder = action.graphqlQuery as (p: Record<string, unknown>) => string;
    const query = builder({ channelIds: ['ch1'] });
    expect(query).toContain('isAtLimit');
    expect(query).toContain('sent');
    expect(query).toContain('scheduled');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test`

- [ ] **Step 3: Expand CHANNEL_FIELDS**

Replace the `CHANNEL_FIELDS` constant in `queries.ts` with:

```typescript
const CHANNEL_FIELDS = `
            id name displayName descriptor service type avatar timezone
            isDisconnected isLocked isNew isQueuePaused
            showTrendingTopicSuggestions hasActiveMemberDevice
            organizationId serviceId createdAt updatedAt
            allowedActions scopes
            externalLink
            products
            postingSchedule { day times paused }
            postingGoal { goal sentCount scheduledCount status periodStart periodEnd }
            linkShortening { isEnabled }`;
```

- [ ] **Step 4: Expand getDailyPostingLimits response fields**

Replace the response fields in `buildGetDailyPostingLimitsQuery`:

```typescript
    }) {
        channel { id name service }
        limit
        used
        isAtLimit
        sent
        scheduled
    }
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test`
Expected: All pass.

- [ ] **Step 6: Commit**

```
git add src/actions/queries.ts src/__tests__/actions/queries.test.ts
git commit -m "expand channel response fields and daily posting limits response"
```

---

### Task 6: Update all examples to cover new fields

**Files:**

- Modify: `src/actions/mutations.ts` (examples arrays)
- Modify: `src/actions/queries.ts` (examples arrays)

- [ ] **Step 1: Update createPost examples**

Replace the `examples` array for `createPost` in `mutations.ts` to add platform-specific examples after the existing ones:

Add these examples to the existing array:

```typescript
{
    label: 'Instagram reel',
    payload: {
        channelId: '690288cc669affb4c9915dda',
        text: 'Watch this!',
        schedulingType: 'automatic',
        mode: 'addToQueue',
        assets: { videos: [{ url: 'https://example.com/reel.mp4' }] },
        metadata: { instagram: { type: 'reel', shouldShareToFeed: true } },
    },
},
{
    label: 'Facebook post with image',
    payload: {
        channelId: '690288cc669affb4c9915dda',
        text: 'Check this out!',
        schedulingType: 'automatic',
        mode: 'addToQueue',
        assets: { images: [{ url: 'https://example.com/photo.jpg', metadata: { altText: 'A great photo' } }] },
        metadata: { facebook: { type: 'post' } },
    },
},
{
    label: 'Pinterest pin',
    payload: {
        channelId: '690288cc669affb4c9915dda',
        schedulingType: 'automatic',
        mode: 'addToQueue',
        assets: { images: [{ url: 'https://example.com/pin.jpg' }] },
        metadata: { pinterest: { boardServiceId: 'board123', title: 'Summer vibes' } },
    },
},
{
    label: 'YouTube video upload',
    payload: {
        channelId: '690288cc669affb4c9915dda',
        schedulingType: 'automatic',
        mode: 'addToQueue',
        assets: { videos: [{ url: 'https://example.com/video.mp4' }] },
        metadata: { youtube: { title: 'My Video', categoryId: '22', privacy: 'public' } },
    },
},
{
    label: 'Post created from an existing idea',
    payload: {
        channelId: '690288cc669affb4c9915dda',
        text: 'From the idea board.',
        schedulingType: 'automatic',
        mode: 'addToQueue',
        ideaId: '68425e79e5105cb6432cc999',
    },
},
{
    label: 'Post with document attachment',
    payload: {
        channelId: '690288cc669affb4c9915dda',
        text: 'Download our guide!',
        schedulingType: 'automatic',
        mode: 'addToQueue',
        assets: {
            documents: [
                {
                    url: 'https://example.com/guide.pdf',
                    title: 'Pool Maintenance Guide',
                    thumbnailUrl: 'https://example.com/guide-cover.jpg',
                },
            ],
        },
    },
},
{
    label: 'Post with link attachment',
    payload: {
        channelId: '690288cc669affb4c9915dda',
        text: 'Great read!',
        schedulingType: 'automatic',
        mode: 'addToQueue',
        assets: {
            link: {
                url: 'https://example.com/article',
                title: 'Pool Maintenance Tips',
                description: 'Everything you need to know.',
            },
        },
    },
},
```

- [ ] **Step 2: Update createIdea examples**

Add these examples to the existing `createIdea` examples array:

```typescript
{
    label: 'Idea with tags and target services',
    payload: {
        organizationId: '68425e79e5105cb6432cc10f',
        content: {
            title: 'Cross-platform campaign',
            text: 'Launch on Instagram and Facebook.',
            tags: [{ id: 'tag1', name: 'Campaign', color: '#FF5733' }],
            services: ['instagram', 'facebook'],
            date: '2026-05-01T09:00:00Z',
        },
    },
},
{
    label: 'Idea placed in a group',
    payload: {
        organizationId: '68425e79e5105cb6432cc10f',
        content: { title: 'Grouped idea' },
        group: { groupId: 'grp1' },
    },
},
```

- [ ] **Step 3: Run tests**

Run: `pnpm test`
Expected: All pass.

- [ ] **Step 4: Run full check and build**

Run: `pnpm run fmt && pnpm run check && pnpm run build`
Expected: All pass, clean build.

- [ ] **Step 5: Commit**

```
git add src/actions/mutations.ts src/actions/queries.ts
git commit -m "add comprehensive examples covering metadata, assets, and new fields"
```

---

### Task 7: Final verification

- [ ] **Step 1: Run full test suite**

Run: `pnpm test`
Expected: All tests pass.

- [ ] **Step 2: Run check (format + lint + typecheck)**

Run: `pnpm run check`
Expected: 0 errors.

- [ ] **Step 3: Run build**

Run: `pnpm run build`
Expected: Clean build, bundle created.

- [ ] **Step 4: Verify help output includes new fields**

Mentally trace through `getActionHelp('createPost')` — the Zod schema walker will pick up `metadata`, `assets`, `ideaId`, `draftId`, `source`, `aiAssisted` as parameters because they're top-level keys in the ZodObject. The examples will show platform-specific payloads. No code changes needed here — the existing help generator handles this automatically.

- [ ] **Step 5: Commit all remaining changes**

If any files were modified by formatting:

```
git add -A
git commit -m "complete Buffer API coverage: metadata, assets, query fields, idea fields"
```
