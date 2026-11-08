import { z } from "zod";

/**
 * Cliente da NASA POWER (comunidade AG, agroclimatologia).
 * Gratuito e sem chave: https://power.larc.nasa.gov/docs/services/api/
 */

const BASE_URL = "https://power.larc.nasa.gov/api/temporal/monthly/point";
const PARAMETERS = ["T2M", "T2M_MAX", "T2M_MIN", "PRECTOTCORR"] as const;
const FILL_VALUE = -999;

const responseSchema = z.object({
  properties: z.object({
    parameter: z.record(z.string(), z.record(z.string(), z.number())),
  }),
});

export type ClimaMensal = {
  /** "AAAA-MM" */
  mes: string;
  temperaturaMedia: number | null;
  temperaturaMax: number | null;
  temperaturaMin: number | null;
  /** Precipitação total do mês, em mm */
  precipitacao: number | null;
};

export type ResumoClimatico = {
  fonte: "nasa-power" | "demo";
  ano: number;
  latitude: number;
  longitude: number;
  temperaturaMediaAnual: number | null;
  precipitacaoAnual: number | null;
  mesesSecos: number;
  meses: ClimaMensal[];
};

const daysInMonth = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate();
const clean = (v: number | undefined) => (v === undefined || v === FILL_VALUE ? null : v);
const round1 = (v: number) => Math.round(v * 10) / 10;

/** Transforma a resposta mensal da NASA POWER em um resumo do ano. */
export function resumirClima(
  raw: unknown,
  { ano, latitude, longitude }: { ano: number; latitude: number; longitude: number },
): ResumoClimatico {
  const { parameter } = responseSchema.parse(raw).properties;

  const meses: ClimaMensal[] = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const key = `${ano}${String(month).padStart(2, "0")}`;
    const mmPorDia = clean(parameter.PRECTOTCORR?.[key]);
    return {
      mes: `${ano}-${String(month).padStart(2, "0")}`,
      temperaturaMedia: clean(parameter.T2M?.[key]),
      temperaturaMax: clean(parameter.T2M_MAX?.[key]),
      temperaturaMin: clean(parameter.T2M_MIN?.[key]),
      precipitacao: mmPorDia === null ? null : round1(mmPorDia * daysInMonth(ano, month)),
    };
  });

  const temps = meses.map((m) => m.temperaturaMedia).filter((v): v is number => v !== null);
  const chuvas = meses.map((m) => m.precipitacao).filter((v): v is number => v !== null);

  return {
    fonte: "nasa-power",
    ano,
    latitude,
    longitude,
    temperaturaMediaAnual: temps.length ? round1(temps.reduce((a, b) => a + b, 0) / temps.length) : null,
    precipitacaoAnual: chuvas.length === 12 ? Math.round(chuvas.reduce((a, b) => a + b, 0)) : null,
    // Mês seco: menos de 50 mm (critério simples, só para leitura do diagnóstico)
    mesesSecos: chuvas.filter((v) => v < 50).length,
    meses,
  };
}

/** Busca o clima do último ano completo para um ponto (centróide da propriedade). */
export async function buscarClima(
  latitude: number,
  longitude: number,
  ano = new Date().getUTCFullYear() - 1,
): Promise<ResumoClimatico> {
  const url = new URL(BASE_URL);
  url.searchParams.set("parameters", PARAMETERS.join(","));
  url.searchParams.set("community", "AG");
  url.searchParams.set("latitude", latitude.toFixed(4));
  url.searchParams.set("longitude", longitude.toFixed(4));
  url.searchParams.set("start", String(ano));
  url.searchParams.set("end", String(ano));
  url.searchParams.set("format", "JSON");

  const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`NASA POWER respondeu ${res.status}`);
  return resumirClima(await res.json(), { ano, latitude, longitude });
}
