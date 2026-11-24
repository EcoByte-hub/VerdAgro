import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Sessao } from "@/lib/auth/sessao";
import { resumirClima } from "@/lib/clima/nasa-power";
import climaDemo from "@/lib/demo/dados/nasa-power-rio-verde-2024.json";
import { DIAGNOSTICO_DEMO } from "@/lib/demo/diagnostico-demo";
import { FAZENDA_BOA_VISTA } from "@/lib/demo/fazenda-boa-vista";
import { NDVI_DEMO } from "@/lib/demo/ndvi-demo";
import { USUARIOS_DEMO } from "@/lib/demo/usuarios";
import { calcularIndicadores } from "@/lib/diagnostico/indicadores";

vi.mock("server-only", () => ({}));
const { createClient, consulta } = vi.hoisted(() => ({
  createClient: vi.fn(),
  consulta: {
    from: vi.fn(),
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    maybeSingle: vi.fn(),
    insert: vi.fn(),
    single: vi.fn(),
  },
}));
vi.mock("@/lib/supabase/server", () => ({ createClient }));

import { obterUltimoDiagnostico } from "./diagnosticos";
import { salvarDiagnostico } from "./index";

const produtor: Sessao = { modo: "supabase", papel: "produtor", ...USUARIOS_DEMO.produtor };
const propriedadeId = FAZENDA_BOA_VISTA.id;
const clima = resumirClima(climaDemo, { ano: 2024, latitude: -17.9545, longitude: -50.9915 });
const registro = {
  id: "diagnostico-salvo",
  created_at: "2026-11-20T10:05:00+00:00",
  ndvi: { ...NDVI_DEMO, fonte: "sentinel-2" },
  climate: clima,
  result: { ...DIAGNOSTICO_DEMO, resumo: "Resumo persistido, sem gerar novamente." },
  sources: { ndvi: "sentinel-2", clima: "nasa-power", ia: "claude" },
  model: "modelo-persistido",
};

beforeEach(() => {
  vi.clearAllMocks();
  for (const metodo of ["from", "select", "eq", "order", "limit", "insert"] as const) {
    consulta[metodo].mockReturnValue(consulta);
  }
  consulta.maybeSingle.mockResolvedValue({ data: registro, error: null });
  consulta.single.mockResolvedValue({ data: { created_at: registro.created_at }, error: null });
  createClient.mockResolvedValue(consulta);
  vi.stubGlobal(
    "fetch",
    vi.fn(() => {
      throw new Error("Leitura não deve chamar integrações");
    }),
  );
});
afterEach(() => vi.unstubAllGlobals());

describe("último diagnóstico salvo", () => {
  it("mapeia o registro e recalcula indicadores apenas com os dados persistidos", async () => {
    const salvo = await obterUltimoDiagnostico(produtor, propriedadeId);
    expect(salvo).toEqual({
      criadoEm: registro.created_at,
      resultado: {
        diagnostico: registro.result,
        indicadores: calcularIndicadores({ ...NDVI_DEMO, fonte: "sentinel-2" }, clima),
        ndvi: registro.ndvi,
        clima: registro.climate,
        origem: registro.sources,
        modelo: registro.model,
        falhas: [],
      },
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("busca somente o registro mais recente da propriedade do produtor", async () => {
    await obterUltimoDiagnostico(produtor, propriedadeId);
    expect(consulta.from).toHaveBeenCalledWith("diagnostics");
    expect(consulta.eq.mock.calls).toEqual([
      ["property_id", propriedadeId],
      ["properties.owner_id", produtor.id],
    ]);
    expect(consulta.select).toHaveBeenCalledWith(expect.stringContaining("properties!inner(owner_id)"));
    expect(consulta.order.mock.calls).toEqual([
      ["created_at", { ascending: false }],
      ["id", { ascending: false }],
    ]);
    expect(consulta.limit).toHaveBeenCalledWith(1);
  });

  it("retorna null se ainda não existe diagnóstico ou o RLS não libera a propriedade", async () => {
    consulta.maybeSingle.mockResolvedValue({ data: null, error: null });
    expect(await obterUltimoDiagnostico(produtor, propriedadeId)).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(["empresa", "admin"] as const)("bloqueia perfil %s antes de consultar o banco", async (papel) => {
    expect(await obterUltimoDiagnostico({ ...produtor, papel }, propriedadeId)).toBeNull();
    expect(createClient).not.toHaveBeenCalled();
  });

  it("preserva a ausência de NDVI e clima sem fabricar dados de reserva", async () => {
    consulta.maybeSingle.mockResolvedValue({ data: { ...registro, ndvi: null, climate: null }, error: null });
    const salvo = await obterUltimoDiagnostico(produtor, propriedadeId);
    expect(salvo?.resultado.ndvi).toBeNull();
    expect(salvo?.resultado.clima).toBeNull();
    expect(salvo?.resultado.indicadores.ndviMedio).toBeNull();
    expect(salvo?.resultado.indicadores.precipitacaoAnualMm).toBeNull();
    expect(salvo?.resultado.diagnostico).toEqual(registro.result);
  });

  it.each([
    { result: { resumo: "Registro incompleto" } },
    { ndvi: { meses: "inválido" } },
    { sources: { ia: "origem-desconhecida" } },
    { created_at: "data inválida" },
  ])("rejeita registro inválido em vez de mostrar um resultado incorreto", async (alteracao) => {
    consulta.maybeSingle.mockResolvedValue({ data: { ...registro, ...alteracao }, error: null });
    await expect(obterUltimoDiagnostico(produtor, propriedadeId)).rejects.toThrow();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("propaga falha do banco para a página poder informar o erro", async () => {
    consulta.maybeSingle.mockResolvedValue({ data: null, error: new Error("Banco indisponível") });
    await expect(obterUltimoDiagnostico(produtor, propriedadeId)).rejects.toThrow("Banco indisponível");
  });

  it("fornece exemplo demonstrativo sem requisições nem data fictícia de gravação", async () => {
    const salvo = await obterUltimoDiagnostico({ ...produtor, modo: "demo" }, propriedadeId);
    expect(salvo?.criadoEm).toBeNull();
    expect(salvo?.resultado.diagnostico).toEqual(DIAGNOSTICO_DEMO);
    expect(salvo?.resultado.origem).toEqual({ ndvi: "demo", clima: "demo", ia: "demo" });
    expect(createClient).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("não fornece exemplo de uma propriedade demonstrativa alheia", async () => {
    expect(
      await obterUltimoDiagnostico({ ...produtor, modo: "demo", id: "outro-produtor" }, propriedadeId),
    ).toBeNull();
    expect(createClient).not.toHaveBeenCalled();
  });
});

describe("data de gravação", () => {
  it("devolve o horário gravado pelo banco ao salvar um novo diagnóstico", async () => {
    const criadoEm = await salvarDiagnostico(produtor, propriedadeId, {
      ndvi: registro.ndvi,
      clima,
      resultado: registro.result,
      origem: registro.sources,
      modelo: registro.model,
    });
    expect(criadoEm).toBe(registro.created_at);
    expect(consulta.select).toHaveBeenCalledWith("created_at");
    expect(consulta.insert).toHaveBeenCalledWith({
      property_id: propriedadeId,
      ndvi: registro.ndvi,
      climate: clima,
      result: registro.result,
      sources: registro.sources,
      model: registro.model,
    });
  });

  it("não afirma gravação quando o banco falha", async () => {
    consulta.single.mockResolvedValue({ data: null, error: new Error("Falha ao salvar") });
    await expect(
      salvarDiagnostico(produtor, propriedadeId, {
        ndvi: null,
        clima: null,
        resultado: registro.result,
        origem: registro.sources,
        modelo: null,
      }),
    ).rejects.toThrow("Falha ao salvar");
  });

  it("não grava nem inventa uma data no modo demonstração", async () => {
    expect(
      await salvarDiagnostico({ ...produtor, modo: "demo" }, propriedadeId, {
        ndvi: null,
        clima: null,
        resultado: registro.result,
        origem: registro.sources,
        modelo: null,
      }),
    ).toBeNull();
    expect(createClient).not.toHaveBeenCalled();
  });
});
