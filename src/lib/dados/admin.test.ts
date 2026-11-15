import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Sessao } from "@/lib/auth/sessao";

vi.mock("server-only", () => ({}));
const { createClient, rpc, single } = vi.hoisted(() => ({
  createClient: vi.fn(),
  rpc: vi.fn(),
  single: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient }));

import { obterIndicadoresAdmin } from "./admin";

const admin: Sessao = {
  modo: "supabase",
  id: "admin",
  nome: "Admin",
  organizacao: null,
  papel: "admin",
};
const linha = {
  producers: 2,
  properties: 3,
  hectares: 720.25,
  projects: 4,
  companies: 1,
  interests: 5,
  projects_in_validation: 1,
  issued_credits: 12.75,
  demo_properties: 0,
};

beforeEach(() => {
  vi.clearAllMocks();
  createClient.mockResolvedValue({ rpc });
  rpc.mockReturnValue({ single });
  single.mockResolvedValue({ data: linha, error: null });
});

describe("indicadores administrativos", () => {
  it.each(["demo", "supabase"] as const)(
    "bloqueia produtor e empresa no modo %s antes da consulta",
    async (modo) => {
      for (const papel of ["produtor", "empresa"] as const) {
        await expect(obterIndicadoresAdmin({ ...admin, modo, papel })).rejects.toThrow("Acesso restrito");
      }
      expect(createClient).not.toHaveBeenCalled();
    },
  );

  it("consulta a RPC com a sessão e mapeia todos os agregados", async () => {
    await expect(obterIndicadoresAdmin(admin)).resolves.toEqual({
      produtores: 2,
      propriedades: 3,
      hectares: 720.25,
      projetos: 4,
      empresas: 1,
      interesses: 5,
      projetosEmValidacao: 1,
      creditosEmitidos: 12.75,
      propriedadesDemo: 0,
    });
    expect(rpc).toHaveBeenCalledWith("indicadores_admin");
  });

  it("consulta novamente para refletir mudanças no banco", async () => {
    await obterIndicadoresAdmin(admin);
    single.mockResolvedValueOnce({ data: { ...linha, projects: 5 }, error: null });
    expect((await obterIndicadoresAdmin(admin)).projetos).toBe(5);
    expect(rpc).toHaveBeenCalledTimes(2);
  });

  it("aceita totais zerados sem confundir ausência de dados com erro", async () => {
    single.mockResolvedValue({
      data: Object.fromEntries(Object.keys(linha).map((k) => [k, 0])),
      error: null,
    });
    expect(Object.values(await obterIndicadoresAdmin(admin))).toEqual(Array(9).fill(0));
  });

  it("propaga erro do banco sem substituir por dados demonstrativos", async () => {
    single.mockResolvedValue({ data: null, error: new Error("Sem permissão") });
    await expect(obterIndicadoresAdmin(admin)).rejects.toThrow("Sem permissão");
  });

  it("trata resposta ausente como indisponibilidade", async () => {
    single.mockResolvedValue({ data: null, error: null });
    await expect(obterIndicadoresAdmin(admin)).rejects.toThrow("Indicadores indisponíveis");
  });

  it("agrega o catálogo demo sem consultar o banco ou estimar créditos", async () => {
    await expect(obterIndicadoresAdmin({ ...admin, modo: "demo" })).resolves.toEqual({
      produtores: 2,
      propriedades: 1,
      hectares: 199.4,
      projetos: 3,
      empresas: 1,
      interesses: 1,
      projetosEmValidacao: 1,
      creditosEmitidos: 0,
      propriedadesDemo: 1,
    });
    expect(createClient).not.toHaveBeenCalled();
  });
});
