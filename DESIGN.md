---
name: Population
description: A playful atlas for a social geography guessing game.
colors:
  pop-coral: "#CC6B49"
  pop-cobalt: "#1F6E7B"
  pop-sunshine: "#E0A63C"
  pop-grape: "#8B5E3C"
  pop-mint: "#4F9E6A"
  pop-bubblegum: "#D98E77"
  pop-ink: "#211812"
  pop-paper: "#F4E8D2"
  pop-sky: "#A7D4D0"
  white: "#FFFFFF"
typography:
  display:
    fontFamily: "Gabarito, system-ui, sans-serif"
    fontSize: "clamp(48px, 10vw, 88px)"
    fontWeight: 900
    lineHeight: 0.95
    letterSpacing: "-0.03em"
  launcher-display:
    fontFamily: "Gabarito, system-ui, sans-serif"
    fontSize: "clamp(64px, 21vw, 96px)"
    fontWeight: 900
    lineHeight: 0.86
    letterSpacing: "-0.035em"
  body:
    fontFamily: "Gabarito, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: "1.375"
  label:
    fontFamily: "Gabarito, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    letterSpacing: "-0.025em"
  compact-label:
    fontFamily: "Gabarito, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 700
  compact-body:
    fontFamily: "Gabarito, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 700
  supporting-body:
    fontFamily: "Gabarito, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 700
  body-large:
    fontFamily: "Gabarito, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 700
  waiting-copy:
    fontFamily: "Gabarito, system-ui, sans-serif"
    fontSize: "19px"
    fontWeight: 800
  category-label:
    fontFamily: "Gabarito, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 900
  control-large:
    fontFamily: "Gabarito, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 800
  title:
    fontFamily: "Gabarito, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 900
  section-title:
    fontFamily: "Gabarito, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 900
  numeric-value:
    fontFamily: "Gabarito, system-ui, sans-serif"
    fontSize: "34px"
    fontWeight: 900
  room-code:
    fontFamily: "Gabarito, system-ui, sans-serif"
    fontSize: "40px"
    fontWeight: 900
  statistic:
    fontFamily: "Gabarito, system-ui, sans-serif"
    fontSize: "44px"
    fontWeight: 900
  question-count:
    fontFamily: "Gabarito, system-ui, sans-serif"
    fontSize: "52px"
    fontWeight: 900
  answer-value:
    fontFamily: "Gabarito, system-ui, sans-serif"
    fontSize: "60px"
    fontWeight: 900
  page-display:
    fontFamily: "Gabarito, system-ui, sans-serif"
    fontSize: "clamp(48px, 8vw, 72px)"
    fontWeight: 900
  joining-display:
    fontFamily: "Gabarito, system-ui, sans-serif"
    fontSize: "clamp(56px, 12vw, 84px)"
    fontWeight: 900
  lobby-display:
    fontFamily: "Gabarito, system-ui, sans-serif"
    fontSize: "clamp(52px, 10vw, 84px)"
    fontWeight: 900
  results-display:
    fontFamily: "Gabarito, system-ui, sans-serif"
    fontSize: "clamp(64px, 14vw, 130px)"
    fontWeight: 900
  question:
    fontFamily: "Gabarito, system-ui, sans-serif"
    fontSize: "clamp(24px, 4.5vw, 44px)"
    fontWeight: 900
rounded:
  control: "12px"
  card: "16px"
  pill: "999px"
spacing:
  small: "8px"
  medium: "16px"
  gutter: "20px"
  panel: "24px"
  wide-panel: "28px"
components:
  button-primary:
    backgroundColor: "{colors.pop-ink}"
    textColor: "{colors.white}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "14px 28px"
  button-secondary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.pop-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "14px 28px"
  button-action:
    backgroundColor: "{colors.pop-coral}"
    textColor: "{colors.white}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "14px 28px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.pop-ink}"
    rounded: "{rounded.control}"
    padding: "14px 28px"
  button-ghost-light:
    backgroundColor: "transparent"
    textColor: "{colors.white}"
    rounded: "{rounded.control}"
    padding: "14px 28px"
  panel:
    backgroundColor: "{colors.white}"
    textColor: "{colors.pop-ink}"
    rounded: "{rounded.card}"
    padding: "24px"
  wordmark:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  input:
    backgroundColor: "{colors.white}"
    textColor: "{colors.pop-ink}"
    typography: "{typography.control-large}"
    rounded: "{rounded.control}"
    padding: "16px 24px"
  semantic-label:
    backgroundColor: "{colors.pop-ink}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
  choice-option:
    backgroundColor: "{colors.white}"
    textColor: "{colors.pop-ink}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
---

# Design System: Population

## Overview

**Creative North Star: "The Playful Atlas"**

Population’s visual world is a playful atlas: warm terrain colours, ocean teal, geographic linework and confident Gabarito typography. The geography gives the game its own identity while its approachable controls keep a group of friends moving into play.

The approved atlas refinement now extends across the website and launcher, setup and lobby, answering and reveal, results and highscores, daily play, offline practice, and support/legal surfaces. It preserves the Population name, maker credit, content and gameplay scoring. Shared controls, panels, typography, contrast and motion carry the same identity across these different tasks; their page compositions remain purpose-specific.

Coverage describes implemented source and reviewed surfaces, not universal runtime verification. Authenticated profile and admin were reviewed in source only. The local Clerk provider has atlas appearance settings; externally hosted sign-in remains outside the app’s styling control.

**Key Characteristics:**

- Geographic imagery and static meridians establish the atlas identity.
- Level controls and shared panels use soft, blurred depth.
- Earthy route colours and bold type keep the party-game energy.

**The Geographic Signature Rule.** Use the globe wordmark and static meridian linework as the shared identity cues.

## Colors

Primary: terracotta (`pop-coral`) grounds the home routes and action variant. Secondary: deep ocean teal (`pop-cobalt`) grounds play; ochre (`pop-sunshine`) marks reveals, daily play and selection. Supporting accents are highland brown, moss green, clay rose and pale glacial aqua. Neutrals are espresso ink, parchment and white.

The route colour remains part of navigation: mint for new-game, clay rose for lobby, ink for joining, teal for play, ochre for reveal/profile, brown for game-over/generation and parchment for highscores. Correct choice answers use moss; a wrong selected answer uses terracotta with ink text. Small text on terracotta, moss and other light earth colours uses ink; light labels belong on deep teal, brown and ink. Large display text can retain white on the terracotta home. Secondary labels and placeholders use stronger readable ink opacity, typically 75%, rather than faint decoration. Support/legal pages use parchment atlas shells with light or earthy inset panels. Existing semantic CSS variables and dark-mode tokens remain separately available; these earthy Pop primitives are defined in `theme.ts` and mirrored in Tailwind.

## Typography

Gabarito is loaded through the existing `--font-gabarito` font variable. Heavy display text anchors entry, setup, joining and results; short bold body copy and labels carry the game. The frontmatter now records reusable app roles beyond the initial website and launcher. A role is a usage guide, not a requirement to use every step on every page.

Compact labels and supporting copy serve settings, modal guidance and navigation. Body and larger body roles serve instructions. The label/control/title roles serve buttons, name entry, categories and section headings. Numeric roles distinguish room codes, question counts, statistics and answers without forcing them into paragraph sizing. Medium shared buttons rise to (24px) at the medium breakpoint; large buttons use (26px), then (28px). Choice labels rise from (16px) to (18px) at the small breakpoint.

Fluid headings remain surface-specific: the website and launcher have their own roles; new-game, joining, lobby, results and question prompts have the observed scales above. About uses `clamp(48px, 9vw, 80px)`, how-to-play `clamp(48px, 9vw, 76px)`, and profile/highscores `clamp(48px, 9vw, 72px)`. Support/legal titles use (30px), rising to (48px) at the medium breakpoint. Do not turn every fluid endpoint, dynamically fitted reveal value or decorative badge size into a universal type step. Fit long answers to available width while preserving hierarchy and meaning.

## Layout

Keep a generous outer gutter and compact, readable action groups. The website uses a container capped at (1152px), with an asymmetric intro grid from (1024px): copy and actions occupy the wider side, the atlas globe the other. On smaller screens it stacks with the globe after the actions; the globe is capped at (240px) below that breakpoint and (440px) above it. Secondary information becomes a two-column grid from (768px).

The native launcher remains a narrow, stacked action surface: a large party tile, join tile and daily ticket sit within thumb reach. Its content caps at (448px), rising to (512px) at the medium breakpoint. Respect the existing top status-bar and bottom safe-area insets. The shell stays fixed and its inner content scrolls.

Setup and lobby organise configuration and participants; answer and reveal surfaces prioritise the current question and response; results prioritise scores; support/legal pages use a readable document column on parchment. These reuse controls and surfaces without inheriting the website intro composition. The setup action dock reserves bottom safe-area padding; floating game docks sit above the bottom inset. Fullscreen map/rank overlays retain safe top and bottom space and scroll locking. The map picker fills the space between its compact header and confirmation dock, matching the viewport aspect without stretching geography. Its existing cartographic colours are ocean `#BFE3E8` and land `#E7D9BC`. Map controls have 44px targets; taps place pins, drags pan, and pinch/wheel/buttons zoom. Space-drag remains available on desktop. Map expansion responds to real device orientation; it is functional, not decorative rotation.

## Elevation & Depth

**The Soft Depth Rule.** Use the implemented blurred Pop shadows for controls and panels; avoid restoring hard offset block shadows to the refined primitives.

The low Pop shadow supports small elements; the button shadow gives controls light lift; card and hero shadows give larger surfaces softer depth. The globe has a broader ambient shadow. Exact shadow values live in the sidecar. The atlas shell suppresses the old display text shadows. The daily ticket retains its notched mask and a shadow following its silhouette.

Hover and press use small vertical shifts. The shell retains its route-entry wipe, replaced by a fade for reduced motion and skipped in native mode. Atlas-shell CSS shortens animations and transitions under reduced motion. The shared meridian decoration is static. The waiting loader uses actual country-outline morphs and stops its animation loop for reduced motion. Primary calls to action have no constant idle bob. Decorative tile, wordmark and badge rotations were removed across the app; celebratory confetti retains its purpose-specific rotation. Older unused utility definitions are not part of the documented motion vocabulary.

## Shapes

**The Level Surface Rule.** Controls, wordmarks, tiles and panels stay level; motion communicates hover, press, entry or celebration rather than idle drift.

Shared controls and wordmarks use the control radius; common panels, modal surfaces, format cards and launcher tiles use the card radius. Strong ink outlines remain appropriate for answer controls and stimuli. Circles serve globe geometry, avatars, player badges, map marks and compact icon controls. Pills remain for semantic labels, score badges and switches. Shape follows its role; the atlas refinement does not flatten every circle or semantic capsule into a rectangle. Source-specific corner outliers are not additional system tokens.

## Components

- **Buttons:** primary ink, secondary white, action terracotta, and transparent ink/light ghost variants. Ghost borders are (4px) ink or (3px) white. Sizes use (10px 20px), (14px 28px) or (16px 36px) padding. Hover lifts (2px); press lowers (1px). Disabled buttons lose shadow and use the existing translucent fill. Focus uses a (2px) outline offset (4px).
- **Wordmark and navigation:** straight Population wordmark with a globe icon. Header aligns identity left and authentication right. The sign-in outline and circular profile avatar retain their existing treatments. Route-aware home navigation remains intact.
- **Inputs and settings:** shared name/text entry is white with ink text and a readable ink placeholder, control corners, (16px 24px) padding and a (4px) ink focus ring. Error styling adds a terracotta ring. Switches preserve semantic pill tracks and circular knobs. Category answer-mode selectors are separate native buttons beside category buttons; interactive controls must not be nested.
- **Panels:** light surfaces with the shared card radius and soft depth; launcher priority and action destinations are unchanged. The daily ticket keeps its ochre fill, perforation, state and streak.
- **Choice options:** two-column grid, ink border (2px), minimum height (64px), and the control radius. White at rest, ochre when selected, moss when correct and terracotta with ink text for a wrong pick. Existing reveal and disabled semantics remain.
- **Question stimuli:** flags preserve their (12px) corners, ink border and soft shadow; neighbouring flag images use smaller corners. Country outlines remain vector geography.
- **Status, scores and icons:** use semantic labels and score pills where they help scanning. Shared UI uses Lucide line icons for medals, targets and checks rather than decorative emoji. Reveals prioritise the answer and player result without a redundant decorative eyebrow. Leaderboard tabs retain their sorting behaviour; visual consistency must preserve the selected scoring view.
- **Atlas decoration:** static meridians are hidden from assistive technology and ignore pointer input. The decorative website globe uses `/geo/atlas-globe.svg`, generated from the game's existing world-atlas geography, with a meridian overlay and ochre location mark. No raster assets were generated for this refinement.
- **Authentication:** local Clerk appearance uses the earthy palette, Gabarito and control radius. This records provider configuration, not a guarantee that an externally hosted sign-in page inherits it.

## Do's and Don'ts

### Do:

- Do use the existing earthy palette and Gabarito family.
- Do keep controls, wordmarks, tiles and panels level, with purposeful press or entry feedback.
- Do place the website globe after the actions when the intro stacks on mobile.
- Do preserve readable focus treatments, native safe areas and the maker credit.
- Do use ink for small labels on coral or mint and light text on teal, brown or ink.
- Do retain circles for geographic and player marks and pills for semantic labels, scores and switches.

### Don't:

- Don't restore floating category chips, decorative tilts, constant CTA bobbing or offset block shadows.
- Don't substitute invented continent silhouettes for the existing world-atlas vector geography.
- Don't treat confetti or real device-orientation handling as decorative rotation defects.
- Don't change gameplay scoring, content or launcher priorities as part of a visual refinement.
- Don't canonize isolated source outliers or claim externally hosted authentication and source-only reviews were visually verified.
