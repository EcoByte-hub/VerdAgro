import type { SerieNdvi } from "@/lib/satelite/copernicus";

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** Barras mensais de NDVI (0–1). Mês sem dado (nuvem) aparece tracejado. */
export function GraficoNdvi({ serie }: { serie: SerieNdvi }) {
  return (
    <figure>
      <div
        className="flex h-36 items-end gap-1.5"
        role="img"
        aria-label="NDVI médio mensal dos últimos 12 meses"
      >
        {serie.meses.map((m) => {
          const mes = MESES[Number(m.mes.slice(5, 7)) - 1];
          return (
            <div key={m.mes} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              {m.media === null ? (
                <div
                  className="h-6 w-full rounded-md border border-dashed border-palha/30"
                  title={`${mes}: sem dado (nuvens)`}
                />
              ) : (
                <div
                  className="w-full rounded-md bg-gradient-to-t from-musgo to-broto"
                  style={{ height: `${Math.max(6, m.media * 100)}%`, opacity: 0.45 + m.media * 0.55 }}
                  title={`${mes}: NDVI ${m.media.toFixed(2).replace(".", ",")}`}
                />
              )}
              <span className="font-mono text-[9px] text-palha/50 uppercase">{mes}</span>
            </div>
          );
        })}
      </div>
      <figcaption className="mt-3 text-[11px] text-palha/50">
        NDVI médio mensal · {serie.fonte === "sentinel-2" ? "Sentinel-2 (Copernicus)" : "série demonstrativa"}
      </figcaption>
    </figure>
  );
}
