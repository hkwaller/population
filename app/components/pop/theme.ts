// Earthy / topographic design tokens & helpers.
// Token names are kept from the original "Sticker Pop" system so every usage
// re-tints automatically; the palette is now an atlas of terracotta, ocean,
// ochre, moss and parchment.
export const POP = {
  coral: '#CC6B49', // terracotta - primary accent / home
  cobalt: '#1F6E7B', // deep ocean teal - game
  sunshine: '#E0A63C', // ochre / gold - reveal, badges
  grape: '#8B5E3C', // highland brown - game over / generate
  mint: '#4F9E6A', // moss green - correct / locked / positive
  bubblegum: '#D98E77', // clay rose
  ink: '#211812', // warm espresso near-black
  paper: '#F4E8D2', // parchment
  sky: '#A7D4D0', // glacial pale aqua
} as const

// Each route owns one background color - this is the navigation signature.
export const ROUTE_BG: Record<string, string> = {
  home: POP.coral,
  newGame: POP.mint,
  lobby: POP.bubblegum,
  join: POP.ink,
  game: POP.cobalt,
  reveal: POP.sunshine,
  gameOver: POP.grape,
  highscores: POP.paper,
  profile: POP.sunshine,
  generate: POP.grape,
}

// Keep the original fills stable for legacy color IDs and existing decorations.
export const STICKER_FILLS = ['#E7C77A', '#8FC7C4', '#A8C79B', '#E0A98C', '#CBA24A']

// Playful player colors, independent of the earthy route palette.
// Keep these bright enough for ink icons and player names to stay readable.
export const stickerColors = [
  { id: 'sand', hex: '#FFD43B' },
  { id: 'lagoon', hex: '#20C4D9' },
  { id: 'sage', hex: '#52D76A' },
  { id: 'clay', hex: '#FF963D' },
  { id: 'ochre', hex: '#D99A45' },
  { id: 'rose', hex: '#FF69AD' },
  { id: 'lavender', hex: '#A27BFF' },
  { id: 'sky', hex: '#579BFF' },
  { id: 'mint', hex: '#36E4AE' },
  { id: 'peach', hex: '#FF6257' },
  { id: 'lemon', hex: '#F4F45B' },
  { id: 'lilac', hex: '#DD73EC' },
  { id: 'seafoam', hex: '#69EDF1' },
  { id: 'olive', hex: '#B4ED36' },
  { id: 'stone', hex: '#B2BAC9' },
]

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

// Resolve player colors, retaining the original fallback for legacy IDs.
export function stickerFill(colorId?: string): string {
  if (!colorId) return STICKER_FILLS[0]
  const direct = stickerColors.find((c) => c.id === colorId)
  if (direct) return direct.hex
  return STICKER_FILLS[hashStr(colorId) % STICKER_FILLS.length]
}

// Spring preset used for all entry animations.
export const POP_SPRING = { type: 'spring' as const, stiffness: 260, damping: 18 }
