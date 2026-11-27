import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Sessao } from "@/lib/auth/sessao";

const { exigirPapel, criarProjeto, obterPropriedade, revalidatePath, redirect } = vi.hoisted(() => ({
  exigirPapel: vi.fn(),
  criarProjeto: vi.fn(),
  obterPropriedade: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn(),
}));
vi.mock("@/lib/auth/sessao", () => ({ exigirPapel }));
vi.mock("@/lib/dados", () => ({ criarProjeto, obterPropriedade }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("next/navigation", () => ({ redirect }));

import { criarProjetoAction } from "./actions";

const sessao: Sessao = {
  modo: "supabase",
  papel: "produtor",
  id: "11111111-1111-4111-8111-111111111111",
  nome: "Produtor",
  organizacao: null,
};
const propriedade = {
  id: "22222222-2222-4222-8222-222222222222",
  nome: "Fazenda Boa Vista",
  municipio: "Rio Verde",
  uf: "GO",
  areaHa: 140,
};
function formulario(campos: Record<string, string>) {
  const dados = new FormData();
  for (const [nome, valor] of Object.entries(campos)) dados.set(nome, valor);
  return dados;
}
const base = {
  propriedade: propriedade.id,
  titulo: "Recuperação de pastagem degradada",
  pratica: "recuperacao_pastagens",
  area: "80",
  descricao: "",
  objetivo: "",
  metodologia: "",
  inicio: "",
  fim: "",
  infoComercial: "",
  publicar: "",
};

beforeEach(() => {
  vi.resetAllMocks();
  exigirPapel.mockResolvedValue(sessao);
  obterPropriedade.mockResolvedValue(propriedade);
  criarProjeto.mockResolvedValue("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
});

describe("cadastro de projeto (passo 3 da demo)", () => {
  it("valida o formulário antes de acessar o banco", async () => {
    await expect(
      criarProjetoAction(undefined, formulario({ ...base, titulo: "ab" })),
    ).resolves.toEqual({ erro: "Informe um título com pelo menos 3 caracteres", valores: expect.any(Object) });
    await expect(criarProjetoAction(undefined, formulario({ ...base, area: "" }))).resolves.toEqual({
      erro: "Informe a área do projeto",
      valores: expect.any(Object),
    });
    await expect(
      criarProjetoAction(undefined, formulario({ ...base, propriedade: "invalido" })),
    ).resolves.toEqual({ erro: expect.any(String), valores: expect.any(Object) });
    await expect(
      criarProjetoAction(undefined, formulario({ ...base, inicio: "2026-05-01", fim: "2026-04-01" })),
    ).resolves.toEqual({ erro: "O término precisa ser depois do início", valores: expect.any(Object) });
    expect(obterPropriedade).not.toHaveBeenCalled();
    expect(criarProjeto).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("recusa propriedade que não é do produtor", async () => {
    obterPropriedade.mockResolvedValue(null);
    await expect(criarProjetoAction(undefined, formulario(base))).resolves.toEqual({
      erro: "Propriedade não encontrada.",
      valores: expect.any(Object),
    });
    expect(criarProjeto).not.toHaveBeenCalled();
  });

  it("impede área maior que a da propriedade", async () => {
    await expect(criarProjetoAction(undefined, formulario({ ...base, area: "140,01" }))).resolves.toEqual({
      erro: "A área do projeto não pode passar da área da propriedade (140,0 ha).",
      valores: expect.any(Object),
    });
    expect(criarProjeto).not.toHaveBeenCalled();
  });

  it("bloqueia gravação no modo demonstração", async () => {
    exigirPapel.mockResolvedValue({ ...sessao, modo: "demo" });
    await expect(criarProjetoAction(undefined, formulario(base))).resolves.toEqual({
      erro: "No modo demonstração o cadastro não é salvo. Configure o Supabase para criar projetos.",
      valores: expect.any(Object),
    });
    expect(criarProjeto).not.toHaveBeenCalled();
  });

  it("cria o projeto com a área normalizada e redireciona para a página dele", async () => {
    await criarProjetoAction(undefined, formulario({ ...base, area: "80,5", publicar: "on" }));
    expect(criarProjeto).toHaveBeenCalledWith(sessao, {
      propriedadeId: propriedade.id,
      titulo: "Recuperação de pastagem degradada",
      descricao: null,
      pratica: "recuperacao_pastagens",
      areaHa: 80.5,
      objetivo: null,
      inicio: null,
      fim: null,
      metodologia: null,
      infoComercial: null,
      publicado: true,
    });
    expect(revalidatePath.mock.calls.map(([caminho]) => caminho)).toEqual([
      "/produtor",
      "/produtor/projetos",
      "/marketplace",
    ]);
    expect(redirect).toHaveBeenCalledWith("/produtor/projetos/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
  });
});
