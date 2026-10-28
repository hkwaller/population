// Match the Globe2 mark and stroke weight used by PopLogo in the header.
import { writeFile } from 'node:fs/promises'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Globe2 } from 'lucide-react'
import sharp from 'sharp'

const globe = renderToStaticMarkup(
  createElement(Globe2, { size: 24, strokeWidth: 1.75, color: '#211812' }),
)
const svg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 32 32">` +
    `<rect width="32" height="32" rx="7" fill="#fff"/>` +
    `<g transform="translate(2 2) scale(1.1666667)">${globe}</g></svg>`,
)
const png = (size) => sharp(svg).resize(size, size).png().toBuffer()

await writeFile('app/icon.png', await png(512))
await writeFile('public/favicon.png', await png(512))

// ICO directories can embed PNGs, preserving transparency at every tab size.
const sizes = [16, 32, 48, 64]
const images = await Promise.all(sizes.map(png))
const directory = Buffer.alloc(6 + 16 * sizes.length)
directory.writeUInt16LE(1, 2)
directory.writeUInt16LE(sizes.length, 4)
let offset = directory.length
for (const [index, size] of sizes.entries()) {
  const entry = 6 + 16 * index
  directory[entry] = size
  directory[entry + 1] = size
  directory.writeUInt16LE(1, entry + 4)
  directory.writeUInt16LE(32, entry + 6)
  directory.writeUInt32LE(images[index].length, entry + 8)
  directory.writeUInt32LE(offset, entry + 12)
  offset += images[index].length
}
await writeFile('app/favicon.ico', Buffer.concat([directory, ...images]))
