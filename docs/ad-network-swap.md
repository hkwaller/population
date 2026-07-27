# Ad network swap: Adsterra → AdSense (banners) + AdinPlay (rewarded video)

Instructions for Claude Code. Goal: replace the Adsterra banner and popunder with a
network-neutral banner (AdSense/AdinPlay) and a rewarded video shown on player devices at
end of game. Keep all existing gating, upsell, and cooldown behavior. **Ads must stay OFF
behind a feature flag until we're eligible and launched** (see step 5).

## Context (already in the repo — do not rebuild)

- `hooks/useAdFree.ts` — Clerk entitlement gate (`adFreeUntil`). Keep as-is.
- `hooks/useInGameAdsSuppressed.ts` — combines local ad-free + host's `hostAdFree`. Keep as-is.
- `app/components/AdsterraBanner.tsx` — self-gating 468x60 banner + "Remove ads" upsell.
  Mounted on `/`, `/highscores`, `/game/[slug]/end`, and `app/components/QuestionResultModal.tsx`.
- `app/components/AdsterraPopunder.tsx` — popunder, mounted on the end screen as
  `{me && <AdsterraPopunder />}` (player devices only), 24h localStorage cooldown.
- Surface distinction: `me` from `useGame()` is truthy on a player's phone
  (`/game/[slug]/[id]`) and falsy on the big screen/host (`/game/[slug]`). The end screen
  `/game/[slug]/end` is shared by both and already keys off `me`.

## Step 1 — Network-neutral banner

Create `app/components/AdBanner.tsx` that preserves the exact shell of `AdsterraBanner.tsx`
(the `useAdFree` gate, the hidden-while-loading behavior, the container ref with
`minHeight`, and the "Remove ads" `<Link href="/go-ad-free">`). Only the script/markup
injected into the container changes, selected by an env var:

- `NEXT_PUBLIC_AD_NETWORK=adsense` → render a Google AdSense display unit
  (`<ins class="adsbygoogle" ...>` with `data-ad-client` and `data-ad-slot`, then push to
  `window.adsbygoogle`). Load the AdSense loader script once, globally, in the root layout
  (`app/layout.tsx`) guarded by the presence of the client id — not per-banner.
- `NEXT_PUBLIC_AD_NETWORK=adinplay` → inject AdinPlay's banner tag for the configured unit.
- `NEXT_PUBLIC_AD_NETWORK` unset/`none` → render nothing (returns null after the gate).

Keep the component's public API identical (no props) so existing mount sites are unchanged.
Then replace all `AdsterraBanner` imports/usages with `AdBanner` in:
`app/page.tsx`, `app/highscores/page.tsx`, `app/game/[slug]/end/page.tsx`,
`app/components/QuestionResultModal.tsx`. Delete `AdsterraBanner.tsx`.

## Step 2 — Rewarded end-of-game video (replaces the popunder)

Create `app/components/EndGameVideo.tsx`:

- Copy the gating + cooldown pattern from `AdsterraPopunder.tsx`: `useInGameAdsSuppressed()`,
  a `fired` ref, and a localStorage cooldown (reuse a new key, e.g. `pop:endvideo:lastFiredAt`;
  keep the 24h window configurable via a constant).
- On mount (once, if not suppressed and outside cooldown), request an AdinPlay **rewarded**
  video for the configured video unit. Frame it as opt-in: render a small
  `PopButton` ("See full stats" / "Watch to unlock rematch") that triggers the ad, rather
  than auto-playing. On ad completion, resolve the reward (e.g. reveal the breakdown that's
  already on the end screen). If AdinPlay is unavailable or errors, fail silently and just
  show the content.
- Gate everything behind `NEXT_PUBLIC_AD_NETWORK === 'adinplay'` (and the feature flag in
  step 5). If the network is anything else, render nothing / show content directly.

In `app/game/[slug]/end/page.tsx`, replace `{me && <AdsterraPopunder />}` with
`{me && <EndGameVideo />}` — keep the `me &&` guard so it stays **player-devices only**.
(If we later want the video on the shared screen instead, that's a `!me &&` mount of the
same component — leave a code comment noting this.) Delete `AdsterraPopunder.tsx`.

## Step 3 — Environment variables

Add to `.env.example` (and document in `README.md`):

```
# Ad network switch: adsense | adinplay | none
NEXT_PUBLIC_AD_NETWORK=none
# Master kill switch — ads only render when this is true
NEXT_PUBLIC_ADS_ENABLED=false

# AdSense
NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX
NEXT_PUBLIC_ADSENSE_BANNER_SLOT=XXXXXXXXXX

# AdinPlay
NEXT_PUBLIC_ADINPLAY_BANNER_UNIT=xxxxx
NEXT_PUBLIC_ADINPLAY_VIDEO_UNIT=xxxxx
```

Remove the now-unused `NEXT_PUBLIC_ADSTERRA_BANNER_KEY` and `NEXT_PUBLIC_ADSTERRA_POPUNDER_SRC`.

## Step 4 — Keep the entitlement/upsell layer intact

Do **not** touch `useAdFree`, `useInGameAdsSuppressed`, the Stripe flow, or `/go-ad-free`.
The new components must respect the same gates so paid ad-free users and ad-free hosts still
see no ads. Preserve the "Remove ads" upsell link in the banner.

## Step 5 — Feature flag (ads off until eligible)

Add a single `NEXT_PUBLIC_ADS_ENABLED` check to both `AdBanner` and `EndGameVideo` (and to
the global loader script in `app/layout.tsx`). When false, render nothing regardless of
`NEXT_PUBLIC_AD_NETWORK`. This lets us merge and deploy the code now but keep ads dark until
we have real traffic and network approval. Default it to `false`.

## Step 6 — Verify

- `npm run typecheck` and `npm run lint` clean.
- With `NEXT_PUBLIC_ADS_ENABLED=false`: no ad markup anywhere (grep the rendered DOM).
- With `=true` + `NEXT_PUBLIC_AD_NETWORK=adsense`: banner container renders on home,
  highscores, end screen, and the between-rounds `QuestionResultModal`.
- End screen: video component appears only when `me` is set (phone), never on the host view.
- Ad-free user (or ad-free host) still sees zero ads with the flag on.
- Do this on a branch; produce a diff for review before merging.

## Portability note (Vite games)

`AdBanner` and `EndGameVideo` are just script/DOM injection and port to the Vite games
directly. The only coupling is `useAdFree` (Clerk). In a Vite game without Clerk, stub
`useAdFree` to return `{ adFree: false, loading: false }` and keep everything else identical.
