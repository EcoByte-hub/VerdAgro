/** Esqueleto de carregamento das páginas da área logada. */
export function Carregando() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Carregando">
      <div className="h-4 w-32 animate-pulse rounded-full bg-areia" />
      <div className="h-10 w-80 max-w-full animate-pulse rounded-xl bg-areia" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="h-44 animate-pulse rounded-[var(--radius-card)] bg-areia/70" />
        ))}
      </div>
    </div>
  );
}
