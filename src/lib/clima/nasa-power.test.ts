import { afterEach, describe, expect, it, vi } from "vitest";
import fixture from "@/lib/demo/dados/nasa-power-rio-verde-2024.json";
import { buscarClima, resumirClima } from "./nasa-power";

const ponto = { ano: 2024, latitude: -17.846, longitude: -50.958 };

describe("resumirClima", () => {
  it("resume 12 meses com precipitação total em mm", () => {
    const r = resumirClima(fixture, ponto);
    expect(r.meses).toHaveLength(12);
    expect(r.meses[0].mes).toBe("2024-01");
    // jan/2024: 3,26 mm/dia × 31 dias
    expect(r.meses[0].precipitacao).toBeCloseTo(101.1, 1);
    expect(r.precipitacaoAnual).toBeGreaterThan(800);
    expect(r.temperaturaMediaAnual).toBeGreaterThan(20);
  });

  it("conta os meses secos do cerrado (estação seca de maio a setembro)", () => {
    expect(resumirClima(fixture, ponto).mesesSecos).toBeGreaterThanOrEqual(4);
  });

  it("trata o valor de preenchimento -999 como ausente", () => {
    const raw = { properties: { parameter: { T2M: { "202401": -999 }, PRECTOTCORR: {} } } };
    const r = resumirClima(raw, ponto);
    expect(r.meses[0].temperaturaMedia).toBeNull();
    expect(r.precipitacaoAnual).toBeNull();
  });

  it("rejeita respostas fora do formato esperado", () => {
    expect(() => resumirClima({ erro: true }, ponto)).toThrow();
  });
});

describe("buscarClima", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("monta a URL da comunidade AG e devolve o resumo", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(fixture)));
    vi.stubGlobal("fetch", fetchMock);

    const r = await buscarClima(-17.846, -50.958, 2024);
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.searchParams.get("community")).toBe("AG");
    expect(url.searchParams.get("parameters")).toContain("PRECTOTCORR");
    expect(r.fonte).toBe("nasa-power");
  });

  it("lança erro quando a API falha", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 503 })));
    await expect(buscarClima(-17.8, -50.9, 2024)).rejects.toThrow("503");
  });
});
