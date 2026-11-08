import type { SerieNdvi } from "@/lib/satelite/copernicus";

/**
 * Série de NDVI DEMONSTRATIVA da Fazenda Boa Vista (soja + milho safrinha no cerrado).
 * Perfil típico: pico da soja (jan–fev), milho safrinha (abr–mai), solo exposto na
 * seca (jul–set) e nova semeadura a partir de outubro. Usada quando o Copernicus
 * não está configurado ou indisponível.
 */
export const NDVI_DEMO: SerieNdvi = {
  fonte: "demo",
  inicio: "2025-01-01",
  fim: "2026-01-01",
  meses: [
    { mes: "2025-01", media: 0.81, minimo: 0.42, maximo: 0.91, p10: 0.7, p90: 0.88, cobertura: 0.62 },
    { mes: "2025-02", media: 0.78, minimo: 0.4, maximo: 0.9, p10: 0.66, p90: 0.87, cobertura: 0.55 },
    { mes: "2025-03", media: 0.52, minimo: 0.18, maximo: 0.84, p10: 0.31, p90: 0.74, cobertura: 0.71 },
    { mes: "2025-04", media: 0.66, minimo: 0.25, maximo: 0.86, p10: 0.48, p90: 0.8, cobertura: 0.83 },
    { mes: "2025-05", media: 0.69, minimo: 0.28, maximo: 0.85, p10: 0.52, p90: 0.81, cobertura: 0.97 },
    { mes: "2025-06", media: 0.48, minimo: 0.17, maximo: 0.79, p10: 0.29, p90: 0.68, cobertura: 1 },
    { mes: "2025-07", media: 0.31, minimo: 0.12, maximo: 0.71, p10: 0.19, p90: 0.47, cobertura: 1 },
    { mes: "2025-08", media: 0.27, minimo: 0.11, maximo: 0.66, p10: 0.17, p90: 0.41, cobertura: 1 },
    { mes: "2025-09", media: 0.26, minimo: 0.1, maximo: 0.63, p10: 0.16, p90: 0.39, cobertura: 0.98 },
    { mes: "2025-10", media: 0.33, minimo: 0.12, maximo: 0.7, p10: 0.2, p90: 0.5, cobertura: 0.74 },
    { mes: "2025-11", media: 0.55, minimo: 0.2, maximo: 0.84, p10: 0.36, p90: 0.74, cobertura: 0.48 },
    { mes: "2025-12", media: 0.76, minimo: 0.38, maximo: 0.9, p10: 0.63, p90: 0.87, cobertura: 0.41 },
  ],
};
