import "server-only";

import { z } from "zod";
import type { Sessao } from "@/lib/auth/sessao";
import { resumirClima, type ResumoClimatico } from "@/lib/clima/nasa-power";
import { PROPRIEDADES_DEMO } from "@/lib/demo/catalogo";
import climaDemo from "@/lib/demo/dados/nasa-power-rio-verde-2024.json";
import { DIAGNOSTICO_DEMO } from "@/lib/demo/diagnostico-demo";
import { NDVI_DEMO } from "@/lib/demo/ndvi-demo";
import type { ResultadoDiagnostico } from "@/lib/diagnostico/gerar";
import { calcularIndicadores } from "@/lib/diagnostico/indicadores";
import { diagnosticoSchema } from "@/lib/diagnostico/schema";
import { centroide } from "@/lib/geo/poligono";
import type { SerieNdvi } from "@/lib/satelite/copernicus";
import { createClient } from "@/lib/supabase/server";

export type DiagnosticoSalvo = {
  /** null no modo demonstração, que não grava no banco. */
  criadoEm: string | null;
  resultado: Omit<ResultadoDiagnostico, "ndvi" | "clima"> & {
    ndvi: SerieNdvi | null;
    clima: ResumoClimatico | null;
  };
};

const numeroOpcional = z.number().nullable();
const ndviSchema = z.object({
  fonte: z.enum(["sentinel-2", "demo"]),
  inicio: z.string(),
  fim: z.string(),
  meses: z.array(
    z.object({
      mes: z.string(),
      media: numeroOpcional,
      minimo: numeroOpcional,
      maximo: numeroOpcional,
      p10: numeroOpcional,
      p90: numeroOpcional,
      cobertura: z.number(),
    }),
  ),
});
const climaSchema = z.object({
  fonte: z.enum(["nasa-power", "demo"]),
  ano: z.number(),
  latitude: z.number(),
  longitude: z.number(),
  temperaturaMediaAnual: numeroOpcional,
  precipitacaoAnual: numeroOpcional,
  mesesSecos: z.number(),
  meses: z.array(
    z.object({
      mes: z.string(),
      temperaturaMedia: numeroOpcional,
      temperaturaMax: numeroOpcional,
      temperaturaMin: numeroOpcional,
      precipitacao: numeroOpcional,
    }),
  ),
});
const registroSchema = z.object({
  created_at: z.iso.datetime({ offset: true }),
  ndvi: ndviSchema.nullable(),
  climate: climaSchema.nullable(),
  result: diagnosticoSchema,
  sources: z.object({
    ndvi: z.enum(["sentinel-2", "demo"]),
    clima: z.enum(["nasa-power", "demo"]),
    ia: z.enum(["claude", "demo"]),
  }),
  model: z.string().nullable(),
});

/** Lê o snapshot salvo. Não chama as integrações que geram o diagnóstico. */
export async function obterUltimoDiagnostico(
  sessao: Sessao,
  propriedadeId: string,
): Promise<DiagnosticoSalvo | null> {
  if (sessao.papel !== "produtor") return null;
  if (sessao.modo === "demo") {
    const propriedade = PROPRIEDADES_DEMO.find((p) => p.id === propriedadeId && p.donoId === sessao.id);
    if (!propriedade) return null;
    const clima = {
      ...resumirClima(climaDemo, { ano: 2024, ...centroide(propriedade.poligono) }),
      fonte: "demo" as const,
    };
    return {
      criadoEm: null,
      resultado: {
        diagnostico: DIAGNOSTICO_DEMO,
        indicadores: calcularIndicadores(NDVI_DEMO, clima),
        ndvi: NDVI_DEMO,
        clima,
        origem: { ndvi: "demo", clima: "demo", ia: "demo" },
        modelo: null,
        falhas: [],
      },
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("diagnostics")
    .select("id, created_at, ndvi, climate, result, sources, model, properties!inner(owner_id)")
    .eq("property_id", propriedadeId)
    .eq("properties.owner_id", sessao.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const r = registroSchema.parse(data);
  return {
    criadoEm: r.created_at,
    resultado: {
      diagnostico: r.result,
      indicadores: calcularIndicadores(r.ndvi, r.climate),
      ndvi: r.ndvi,
      clima: r.climate,
      origem: r.sources,
      modelo: r.model,
      // As falhas de integração não são persistidas; a origem é a registrada no snapshot.
      falhas: [],
    },
  };
}
