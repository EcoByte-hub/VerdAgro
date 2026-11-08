import { z } from "zod";
import type { PoligonoGeoJSON } from "@/lib/geo/poligono";

/**
 * NDVI por polígono via Copernicus Data Space Ecosystem (Sentinel Hub Statistical API).
 * Docs: https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Statistical.html
 *
 * Consome processing units da cota gratuita: chame UMA vez por diagnóstico e salve o resultado.
 */

const TOKEN_URL = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token";
const STATS_URL = "https://sh.dataspace.copernicus.eu/api/v1/statistics";

/** ~10 m em graus (resolução nativa do Sentinel-2 nas bandas B04/B08). */
const RESOLUCAO_GRAUS = 0.0001;

/**
 * NDVI = (NIR - Red) / (NIR + Red). Pixels de nuvem, sombra, neve e sem dado são
 * descartados pela Scene Classification (SCL) do Sentinel-2 L2A.
 */
export const EVALSCRIPT_NDVI = `//VERSION=3
function setup() {
  return {
    input: [{ bands: ["B04", "B08", "SCL", "dataMask"] }],
    output: [
      { id: "ndvi", bands: 1, sampleType: "FLOAT32" },
      { id: "dataMask", bands: 1 }
    ]
  };
}
const INVALIDOS = [0, 1, 3, 8, 9, 10, 11];
function evaluatePixel(s) {
  const soma = s.B08 + s.B04;
  const ndvi = soma === 0 ? 0 : (s.B08 - s.B04) / soma;
  const valido = s.dataMask === 1 && INVALIDOS.indexOf(s.SCL) === -1;
  return { ndvi: [ndvi], dataMask: [valido ? 1 : 0] };
}`;

export type NdviMensal = {
  /** "AAAA-MM" */
  mes: string;
  media: number | null;
  minimo: number | null;
  maximo: number | null;
  p10: number | null;
  p90: number | null;
  /** fração de pixels válidos (sem nuvem) no mês, 0–1 */
  cobertura: number;
};

export type SerieNdvi = {
  fonte: "sentinel-2" | "demo";
  inicio: string;
  fim: string;
  meses: NdviMensal[];
};

// ---------------------------------------------------------------------------
// Autenticação (OAuth client credentials) com cache em memória
// ---------------------------------------------------------------------------
let tokenCache: { token: string; expiraEm: number } | null = null;

export async function obterToken(clientId: string, clientSecret: string): Promise<string> {
  if (tokenCache && tokenCache.expiraEm > Date.now() + 30_000) return tokenCache.token;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Copernicus: falha na autenticação (${res.status})`);

  const json = z.object({ access_token: z.string(), expires_in: z.number() }).parse(await res.json());
  tokenCache = { token: json.access_token, expiraEm: Date.now() + json.expires_in * 1000 };
  return json.access_token;
}

/** Só para testes. */
export function limparCacheDeToken() {
  tokenCache = null;
}

// ---------------------------------------------------------------------------
// Statistical API
// ---------------------------------------------------------------------------
// A API devolve "NaN" (texto) quando não há pixel válido no intervalo
const numero = z
  .union([z.number(), z.string()])
  .nullish()
  .transform((v) => (typeof v === "number" && Number.isFinite(v) ? v : null));

const statsSchema = z.object({
  stats: z
    .object({
      min: numero,
      max: numero,
      mean: numero,
      sampleCount: numero,
      noDataCount: numero,
      percentiles: z.record(z.string(), numero).nullish(),
    })
    .partial(),
});

const respostaSchema = z.object({
  data: z.array(
    z.object({
      interval: z.object({ from: z.string(), to: z.string() }),
      outputs: z
        .object({ ndvi: z.object({ bands: z.object({ B0: statsSchema }) }) })
        .partial()
        .optional(),
      error: z.unknown().optional(),
    }),
  ),
});

const arred = (v: number | null | undefined) =>
  typeof v === "number" && Number.isFinite(v) ? Math.round(v * 1000) / 1000 : null;

/** Converte a resposta da Statistical API em série mensal. Exportada para testes. */
export function interpretarResposta(raw: unknown, inicio: string, fim: string): SerieNdvi {
  const { data } = respostaSchema.parse(raw);

  const meses = data.map<NdviMensal>((item) => {
    const s = item.outputs?.ndvi?.bands.B0.stats;
    const total = s?.sampleCount ?? 0;
    const semDado = s?.noDataCount ?? total;
    const cobertura = total > 0 ? Math.round(((total - semDado) / total) * 100) / 100 : 0;
    const temDado = !item.error && cobertura > 0;
    return {
      mes: item.interval.from.slice(0, 7),
      media: temDado ? arred(s?.mean) : null,
      minimo: temDado ? arred(s?.min) : null,
      maximo: temDado ? arred(s?.max) : null,
      p10: temDado ? arred(s?.percentiles?.["10.0"]) : null,
      p90: temDado ? arred(s?.percentiles?.["90.0"]) : null,
      cobertura,
    };
  });

  return { fonte: "sentinel-2", inicio, fim, meses };
}

/** Monta o corpo da requisição. Exportada para testes. */
export function montarRequisicao(poligono: PoligonoGeoJSON, inicio: string, fim: string) {
  return {
    input: {
      bounds: {
        geometry: poligono,
        properties: { crs: "http://www.opengis.net/def/crs/OGC/1.3/CRS84" },
      },
      data: [
        {
          type: "sentinel-2-l2a",
          dataFilter: { mosaickingOrder: "leastCC", maxCloudCoverage: 60 },
        },
      ],
    },
    aggregation: {
      timeRange: { from: `${inicio}T00:00:00Z`, to: `${fim}T00:00:00Z` },
      aggregationInterval: { of: "P1M" },
      evalscript: EVALSCRIPT_NDVI,
      resx: RESOLUCAO_GRAUS,
      resy: RESOLUCAO_GRAUS,
    },
    calculations: {
      ndvi: { statistics: { default: { percentiles: { k: [10, 90] } } } },
    },
  };
}

/** Série mensal de NDVI dos últimos 12 meses completos para o polígono. */
export async function buscarNdvi(
  poligono: PoligonoGeoJSON,
  credenciais: { clientId: string; clientSecret: string },
  hoje = new Date(),
): Promise<SerieNdvi> {
  const fimData = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), 1));
  const inicioData = new Date(Date.UTC(fimData.getUTCFullYear() - 1, fimData.getUTCMonth(), 1));
  const inicio = inicioData.toISOString().slice(0, 10);
  const fim = fimData.toISOString().slice(0, 10);

  const token = await obterToken(credenciais.clientId, credenciais.clientSecret);
  const res = await fetch(STATS_URL, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(montarRequisicao(poligono, inicio, fim)),
    signal: AbortSignal.timeout(60_000),
  });
  if (res.status === 429) throw new Error("Copernicus: limite de processamento atingido (429)");
  if (!res.ok) throw new Error(`Copernicus: Statistical API respondeu ${res.status}`);

  return interpretarResposta(await res.json(), inicio, fim);
}
