# @plugin-sdk/videos

Remotion project that renders the Plugin SDK promo video — a ~50-second
overview of the framework you can drop on the landing page, GitHub
README, or social posts.

## Why it lives here

Marketing videos are easier to keep in sync with the brand when they
share a repo with the site that hosts them. Token changes (colors,
fonts, copy) propagate naturally — the video reads from `src/tokens.ts`
which mirrors the same WP blue (`#2271b1`) the rest of the site uses.

## Quick start

```bash
cd apps/videos
pnpm install
pnpm start            # open Remotion Studio (live preview at localhost:3000)
pnpm render           # render landscape MP4 → out/promo.mp4
pnpm render:vertical  # render 9:16 MP4 → out/promo-vertical.mp4
```

Renders land in `apps/videos/out/`, which is gitignored — commit the
TSX, not the binaries.

## Structure

```
src/
  index.ts            entry — registers <Root>
  Root.tsx            composition registry (landscape + vertical)
  PromoVideo.tsx      sequence series (the timeline)
  tokens.ts           design tokens — WP blue, surface colors, fonts
  components/
    Scene.tsx         fade-in/out wrapper for a single beat
    BigText.tsx       animated headline + Label eyebrow
    Terminal.tsx      typewriter terminal mockup
    Logo.tsx          Plugin SDK wordmark (inline SVG)
  sequences/
    Intro.tsx         value prop — "native + secure + AI"
    Install.tsx       the one-line install
    Components.tsx    grid of WP admin component examples
    AgentRecipe.tsx   AGENTS.md flow
    Outro.tsx         CTA — star + URL + tagline pills
```

## Adapting

Edit `src/tokens.ts` to swap palette / fonts. Each sequence is
self-contained — open it in Remotion Studio and iterate live.
