// Land silhouettes are generated from the game's existing world-atlas dataset.
export function AtlasGlobe() {
  return (
    <div className="atlas-globe mx-auto w-full max-w-[440px]" aria-hidden="true">
      <div className="atlas-globe-sphere">
        {/* A decorative local vector asset needs no image optimizer. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/geo/atlas-globe.svg" alt="" width={480} height={480} />
        <svg viewBox="0 0 480 480" className="absolute inset-0 h-full w-full" fill="none">
          <g stroke="#F4E8D2" strokeWidth="1" opacity=".35">
            <circle cx="240" cy="240" r="215" />
            <ellipse cx="240" cy="240" rx="105" ry="215" />
            <ellipse cx="240" cy="240" rx="180" ry="215" />
            <ellipse cx="240" cy="240" rx="215" ry="75" />
            <path d="M25 240h430M240 25v430" />
          </g>
          <circle cx="263" cy="130" r="8" fill="#E0A63C" stroke="#211812" strokeWidth="2" />
          <circle cx="263" cy="130" r="17" stroke="#E0A63C" strokeWidth="2" />
        </svg>
      </div>
    </div>
  )
}
