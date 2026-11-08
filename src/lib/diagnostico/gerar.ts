import "server-only";

import { buscarClima, resumirClima, type ResumoClimatico } from "@/lib/clima/nasa-power";
import { DIAGNOSTICO_DEMO } from "@/lib/demo/diagnostico-demo";
import climaDemo from "@/lib/demo/dados/nasa-power-rio-verde-2024.json";
import { NDVI_DEMO } from "@/lib/demo/ndvi-demo";
import { env, integrations } from "@/lib/env";
import { centroide, type PoligonoGeoJSON } from "@/lib/geo/poligono";
import { buscarNdvi, type SerieNdvi } from "@/lib/satelite/copernicus";
import { gerarDiagnosticoComIA } from "./ia";
import { calcularIndicadores, type Indicadores } from "./indicadores";
import { montarMensagem, type DadosPropriedade } from "./prompt";
import type { Diagnostico } from "./schema";

export type OrigemDados = {
  ndvi: "sentinel-2" | "demo";
  clima: "nasa-power" | "demo";
  ia: "claude" | "demo";
};

export type ResultadoDiagnostico = {
  diagnostico: Diagnostico;
  indicadores: Indicadores;
  ndvi: SerieNdvi;
  clima: ResumoClimatico;
  origem: OrigemDados;
  modelo: string | null;
  /** Integrações que falharam e caíram no modo demonstração (para log/aviso). */
  falhas: string[];
};

/**
 * Orquestra o Diagnóstico Inteligente da Propriedade:
 * satélite (NDVI) + clima → indicadores determinísticos → interpretação pela IA.
 * Cada etapa tem reserva demonstrativa, então a demo nunca quebra.
 */
export async function gerarDiagnostico(
  propriedade: DadosPropriedade & { poligono: PoligonoGeoJSON },
): Promise<ResultadoDiagnostico> {
  const falhas: string[] = [];
  const { latitude, longitude } = centroide(propriedade.poligono);

  const [ndvi, clima] = await Promise.all([
    integrations.satelite
      ? buscarNdvi(propriedade.poligono, {
          clientId: env.cdseClientId!,
          clientSecret: env.cdseClientSecret!,
        }).catch((e: Error) => {
          falhas.push(`satélite: ${e.message}`);
          return NDVI_DEMO;
        })
      : Promise.resolve(NDVI_DEMO),
    buscarClima(latitude, longitude).catch((e: Error) => {
      falhas.push(`clima: ${e.message}`);
      return { ...resumirClima(climaDemo, { ano: 2024, latitude, longitude }), fonte: "demo" as const };
    }),
  ]);

  const indicadores = calcularIndicadores(ndvi, clima);
  let diagnostico = DIAGNOSTICO_DEMO;
  let modelo: string | null = null;
  let origemIa: OrigemDados["ia"] = "demo";

  if (integrations.ia) {
    try {
      const r = await gerarDiagnosticoComIA(montarMensagem(propriedade, indicadores, ndvi.fonte), {
        apiKey: env.anthropicApiKey!,
        model: env.anthropicModel,
      });
      diagnostico = r.diagnostico;
      modelo = r.modelo;
      origemIa = "claude";
    } catch (e) {
      falhas.push(`IA: ${(e as Error).message}`);
    }
  }

  return {
    diagnostico,
    indicadores,
    ndvi,
    clima,
    origem: { ndvi: ndvi.fonte, clima: clima.fonte, ia: origemIa },
    modelo,
    falhas,
  };
}
