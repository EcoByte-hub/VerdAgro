import type { ResumoClimatico } from "@/lib/clima/nasa-power";
import type { SerieNdvi } from "@/lib/satelite/copernicus";

/**
 * Indicadores DETERMINÍSTICOS calculados pela plataforma a partir do satélite e do clima.
 * A IA recebe estes números prontos e só interpreta (ela não calcula nada).
 */
export type Indicadores = {
  ndviMedio: number | null;
  ndviPico: number | null;
  /** média dos meses mais secos (jun–set no cerrado) */
  ndviSeca: number | null;
  /** meses com NDVI médio ≥ 0,5 (vegetação ativa) */
  mesesVegetacaoAtiva: number;
  /** meses com NDVI médio < 0,3 (sinal de solo exposto ou palhada) */
  mesesSoloExposto: number;
  mesesComDado: number;
  precipitacaoAnualMm: number | null;
  temperaturaMediaC: number | null;
  mesesSecos: number | null;
};

const MESES_SECOS = ["-06", "-07", "-08", "-09"];
const media = (vs: number[]) =>
  vs.length ? Math.round((vs.reduce((a, b) => a + b, 0) / vs.length) * 100) / 100 : null;

export function calcularIndicadores(ndvi: SerieNdvi | null, clima: ResumoClimatico | null): Indicadores {
  const valores = (ndvi?.meses ?? []).filter((m) => m.media !== null) as { mes: string; media: number }[];
  const medias = valores.map((m) => m.media);
  const seca = valores.filter((m) => MESES_SECOS.some((s) => m.mes.endsWith(s))).map((m) => m.media);

  return {
    ndviMedio: media(medias),
    ndviPico: medias.length ? Math.max(...medias) : null,
    ndviSeca: media(seca),
    mesesVegetacaoAtiva: medias.filter((v) => v >= 0.5).length,
    mesesSoloExposto: medias.filter((v) => v < 0.3).length,
    mesesComDado: medias.length,
    precipitacaoAnualMm: clima?.precipitacaoAnual ?? null,
    temperaturaMediaC: clima?.temperaturaMediaAnual ?? null,
    mesesSecos: clima?.mesesSecos ?? null,
  };
}
