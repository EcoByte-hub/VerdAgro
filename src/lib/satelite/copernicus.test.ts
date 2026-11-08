import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FAZENDA_BOA_VISTA } from "@/lib/demo/fazenda-boa-vista";
import { buscarNdvi, interpretarResposta, limparCacheDeToken, montarRequisicao } from "./copernicus";

const intervalo = (
  mes: string,
  stats: Record<string, unknown> | null,
  extra: Record<string, unknown> = {},
) => ({
  interval: { from: `${mes}-01T00:00:00Z`, to: `${mes}-28T00:00:00Z` },
  outputs: stats ? { ndvi: { bands: { B0: { stats } } } } : undefined,
  ...extra,
});

const respostaExemplo = {
  data: [
    intervalo("2025-01", {
      min: 0.41234,
      max: 0.9,
      mean: 0.80567,
      sampleCount: 1000,
      noDataCount: 400,
      percentiles: { "10.0": 0.7, "90.0": 0.88 },
    }),
    intervalo("2025-02", { sampleCount: 1000, noDataCount: 1000, mean: "NaN" }),
    intervalo("2025-03", null, { error: { type: "EXECUTION_ERROR" } }),
  ],
  status: "OK",
};

describe("montarRequisicao", () => {
  it("usa Sentinel-2 L2A, agregação mensal e o polígono em CRS84", () => {
    const body = montarRequisicao(FAZENDA_BOA_VISTA.poligono, "2025-01-01", "2026-01-01");
    expect(body.input.data[0].type).toBe("sentinel-2-l2a");
    expect(body.aggregation.aggregationInterval.of).toBe("P1M");
    expect(body.input.bounds.geometry).toBe(FAZENDA_BOA_VISTA.poligono);
    expect(body.aggregation.evalscript).toContain("B08 - s.B04");
  });
});

describe("interpretarResposta", () => {
  it("converte estatísticas mensais e arredonda", () => {
    const serie = interpretarResposta(respostaExemplo, "2025-01-01", "2025-04-01");
    expect(serie.fonte).toBe("sentinel-2");
    expect(serie.meses[0]).toEqual({
      mes: "2025-01",
      media: 0.806,
      minimo: 0.412,
      maximo: 0.9,
      p10: 0.7,
      p90: 0.88,
      cobertura: 0.6,
    });
  });

  it("marca como sem dado o mês totalmente nublado", () => {
    const serie = interpretarResposta(respostaExemplo, "2025-01-01", "2025-04-01");
    expect(serie.meses[1].media).toBeNull();
    expect(serie.meses[1].cobertura).toBe(0);
  });

  it("marca como sem dado o mês com erro de processamento", () => {
    const serie = interpretarResposta(respostaExemplo, "2025-01-01", "2025-04-01");
    expect(serie.meses[2].media).toBeNull();
  });
});

describe("buscarNdvi", () => {
  beforeEach(() => limparCacheDeToken());
  afterEach(() => vi.unstubAllGlobals());

  it("autentica, consulta os últimos 12 meses e reaproveita o token", async () => {
    const fetchMock = vi.fn<(url: string | URL, init?: RequestInit) => Promise<Response>>(async (url) => {
      if (String(url).includes("openid-connect/token")) {
        return new Response(JSON.stringify({ access_token: "tok", expires_in: 600 }));
      }
      return new Response(JSON.stringify(respostaExemplo));
    });
    vi.stubGlobal("fetch", fetchMock);

    const cred = { clientId: "id", clientSecret: "segredo" };
    const hoje = new Date("2026-11-15T12:00:00Z");
    const serie = await buscarNdvi(FAZENDA_BOA_VISTA.poligono, cred, hoje);
    await buscarNdvi(FAZENDA_BOA_VISTA.poligono, cred, hoje);

    expect(serie.inicio).toBe("2025-11-01");
    expect(serie.fim).toBe("2026-11-01");
    const tokenCalls = fetchMock.mock.calls.filter(([u]) => String(u).includes("token"));
    expect(tokenCalls).toHaveLength(1);
    const statsCall = fetchMock.mock.calls.find(([u]) => String(u).includes("statistics"))!;
    expect((statsCall[1] as RequestInit).headers).toMatchObject({ authorization: "Bearer tok" });
  });

  it("explica quando a cota de processamento acaba", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string | URL) =>
        String(url).includes("token")
          ? new Response(JSON.stringify({ access_token: "tok", expires_in: 600 }))
          : new Response("", { status: 429 }),
      ),
    );
    await expect(
      buscarNdvi(FAZENDA_BOA_VISTA.poligono, { clientId: "a", clientSecret: "b" }),
    ).rejects.toThrow("limite de processamento");
  });
});
