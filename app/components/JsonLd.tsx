// Renders one or more JSON-LD structured-data blocks. Server component;
// safe to render in server layouts/pages for search + rich results.
type JsonLdData = Record<string, unknown>

export function JsonLd({ data }: { data: JsonLdData | JsonLdData[] }) {
  const blocks = Array.isArray(data) ? data : [data]
  return (
    <>
      {blocks.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          // JSON.stringify output is safe here (no user-controlled HTML);
          // escape `<` defensively to avoid closing the script tag early.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(block).replace(/</g, '\\u003c'),
          }}
        />
      ))}
    </>
  )
}
