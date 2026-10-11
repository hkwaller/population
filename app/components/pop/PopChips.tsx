// Static cartographic linework replaces Ish's drifting category stickers.
// Keep the shared API so existing screens inherit the refresh.
export function PopChips({ opacity = 1 }: { opacity?: number }) {
  return (
    <div
      className="atlas-meridians pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
      style={{ opacity: opacity * 0.22 }}
    >
      <svg
        viewBox="0 0 1200 1000"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      >
        <g transform="translate(1060 470)">
          <circle r="650" />
          <ellipse rx="230" ry="650" />
          <ellipse rx="460" ry="650" />
          <ellipse rx="650" ry="210" />
          <ellipse rx="650" ry="430" />
          <path d="M-650 0h1300M0-650V650" />
        </g>
      </svg>
    </div>
  )
}
