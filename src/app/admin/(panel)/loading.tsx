// Suspense boundary for every admin page: their data is per-request (session,
// live orders), so navigation shows this while the server renders.
export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Loading">
      <div className="h-12 w-64 rounded-lg bg-cream/5" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <div key={i} className="h-28 rounded-2xl bg-cream/[0.04]" />)}
      </div>
      <div className="h-72 rounded-2xl bg-cream/[0.04]" />
    </div>
  );
}
