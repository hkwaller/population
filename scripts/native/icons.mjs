/**
 * Source images for the native app icon and splash (NATIVE.md). Draws the same
 * mark as app/icon.png: a white, slightly tilted rounded tile with a terracotta
 * "P". Writes native/assets/*.png; then `npm run native:icons` turns them into
 * every iOS and Android size.
 */
import { mkdirSync } from 'node:fs'
import sharp from 'sharp'

const CORAL = '#CC6B49'
const WHITE = '#FFFFFF'

// `scale` is the tile's width as a share of the canvas.
const tile = (size, { bg = true, scale = 0.62 } = {}) => {
  const w = size * scale
  const x = (size - w) / 2
  const r = w * 0.28
  const shadow = w * 0.06
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
    (bg ? `<rect width="100%" height="100%" fill="${CORAL}"/>` : '') +
    `<g transform="rotate(-6 ${size / 2} ${size / 2})">` +
    `<rect x="${x}" y="${x + shadow}" width="${w}" height="${w}" rx="${r}" fill="#000" fill-opacity="0.15"/>` +
    `<rect x="${x}" y="${x}" width="${w}" height="${w}" rx="${r}" fill="${WHITE}"/>` +
    `<text x="${size / 2}" y="${size / 2 + w * 0.22}" text-anchor="middle" font-family="Gabarito, Arial Black, Helvetica, sans-serif" font-weight="900" font-size="${w * 0.62}" fill="${CORAL}">P</text>` +
    `</g></svg>`
  )
}

const plain = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="100%" height="100%" fill="${CORAL}"/></svg>`

const out = (svg, file) => sharp(Buffer.from(svg)).png().toFile(`native/assets/${file}`)

mkdirSync('native/assets', { recursive: true })
await Promise.all([
  out(tile(1024), 'icon-only.png'),
  // Android adaptive icons crop to a circle, so the foreground tile is smaller.
  out(tile(1024, { bg: false, scale: 0.44 }), 'icon-foreground.png'),
  out(plain(1024), 'icon-background.png'),
  out(tile(2732, { scale: 0.11 }), 'splash.png'),
  out(tile(2732, { scale: 0.11 }), 'splash-dark.png'),
])
console.log('native/assets written')
