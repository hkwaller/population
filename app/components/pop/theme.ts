// Sticker Pop design tokens & helpers.
// See Downloads/design_handoff_sticker_pop/README.md for the full spec.

export const POP = {
  coral: '#FF5747',
  cobalt: '#2B5BFF',
  sunshine: '#FFC933',
  grape: '#8C4DFF',
  mint: '#3DDCA5',
  bubblegum: '#FF9BD2',
  ink: '#171214',
  paper: '#FFF4E4',
  sky: '#7FD8FF',
} as const

// Each route owns one background color — this is the navigation signature.
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

// The 5 pastel player-sticker fills.
export const STICKER_FILLS = ['#FFC933', '#7FD8FF', '#8AF0BE', '#FF9BD2', '#FFD66E']

// Player color options (id + hex) shown in the join/profile pickers.
export const stickerColors = [
  { id: 'sunshine', hex: '#FFC933' },
  { id: 'sky', hex: '#7FD8FF' },
  { id: 'mint', hex: '#8AF0BE' },
  { id: 'bubblegum', hex: '#FF9BD2' },
  { id: 'butter', hex: '#FFD66E' },
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
