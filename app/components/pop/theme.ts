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

// The 5 earthy player-sticker fills.
export const STICKER_FILLS = ['#E7C77A', '#8FC7C4', '#A8C79B', '#E0A98C', '#CBA24A']

// Player color options (id + hex) shown in the join/profile pickers.
export const stickerColors = [
  { id: 'sand', hex: '#E7C77A' },
  { id: 'lagoon', hex: '#8FC7C4' },
  { id: 'sage', hex: '#A8C79B' },
  { id: 'clay', hex: '#E0A98C' },
  { id: 'ochre', hex: '#CBA24A' },
]

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

// Map any player color id (new pastel ids OR legacy ids like "red"/"blue") to a pastel fill.
export function stickerFill(colorId?: string): string {
  if (!colorId) return STICKER_FILLS[0]
  const direct = stickerColors.find((c) => c.id === colorId)
  if (direct) return direct.hex
  return STICKER_FILLS[hashStr(colorId) % STICKER_FILLS.length]
}

// Spring preset used for all entry animations.
export const POP_SPRING = { type: 'spring' as const, stiffness: 260, damping: 18 }
