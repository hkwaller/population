import { ImageResponse } from 'next/og'
import { SITE_DESCRIPTION } from '@/lib/site'

export const alt = 'Population - how well do you know the world?'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Branded social card. Satori renders flexbox only (no CSS grid).
export default function Image() {
  const tagline = `${SITE_DESCRIPTION.split('.')[0]}.`
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#CC6B49',
          padding: 80,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 150,
            fontWeight: 900,
            color: 'white',
            letterSpacing: '-0.03em',
            lineHeight: 1,
            transform: 'rotate(-2deg)',
          }}
        >
          Population
        </div>
        <div
          style={{
            marginTop: 40,
            fontSize: 42,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.92)',
            maxWidth: 900,
          }}
        >
          {tagline}
        </div>
      </div>
    ),
    { ...size },
  )
}
