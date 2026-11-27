import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Sessao } from "@/lib/auth/sessao";

const { exigirPapel, avancarEstagioProjeto, revalidatePath } = vi.hoisted(() => ({
  exigirPapel: vi.fn(),
  avancarEstagioProjeto: vi.fn(),
  revalidatePath: vi.fn(),
}));
vi.mock("@/lib/auth/sessao", () => ({ exigirPapel }));
vi.mock("@/lib/dados", () => ({ avancarEstagioProjeto }));
vi.mock("next/cache", () => ({ revalidatePath }));

import { avancarEstagio } from "./actions";

const sessao: Sessao = {
  modo: "supabase",
  papel: "produtor",
  id: "11111111-1111-4111-8111-111111111111",
  nome: "Produtor",
  organizacao: null,
};
const projetoId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
function formulario(campos: Record<string, string>) {
  const dados = new FormData();
  for (const [nome, valor] of Object.entries(campos)) dados.set(nome, valor);
  return dados;
}

beforeEach(() => {
  vi.resetAllMocks();
  exigirPapel.mockResolvedValue(sessao);
  avancarEstagioProjeto.mockResolvedValue("validacao");
});

describe("avanço de estágio com registro na linha do tempo", () => {
  it("valida id e nota antes de chamar a RPC", async () => {
    await expect(avancarEstagio(undefined, formulario({ projetoId: "invalido", nota: "" }))).resolves.toEqual({
      erro: "Projeto inválido.",
      valores: { projetoId: "invalido", nota: "" },
    });
    await expect(
      avancarEstagio(undefined, formulario({ projetoId, nota: "x".repeat(501) })),
    ).resolves.toEqual({ erro: "Nota: use no máximo 500 caracteres", valores: expect.any(Object) });
    expect(avancarEstagioProjeto).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("bloqueia o avanço no modo demonstração", async () => {
    exigirPapel.mockResolvedValue({ ...sessao, modo: "demo" });
    await expect(avancarEstagio(undefined, formulario({ projetoId, nota: "" }))).resolves.toEqual({
      erro: "No modo demonstração o estágio não muda. Configure o Supabase para avançar na linha do tempo.",
      valores: { projetoId, nota: "" },
    });
    expect(avancarEstagioProjeto).not.toHaveBeenCalled();
  });

  it("avança, registra a nota e atualiza os painéis", async () => {
    await expect(
      avancarEstagio(undefined, formulario({ projetoId, nota: "  Validação contratada com organismo X  " })),
    ).resolves.toEqual({ ok: "Estágio avançou para Validação." });
    expect(avancarEstagioProjeto).toHaveBeenCalledWith(sessao, projetoId, "Validação contratada com organismo X");
    expect(revalidatePath).toHaveBeenCalledWith(`/produtor/projetos/${projetoId}`);
    expect(revalidatePath).toHaveBeenCalledWith("/produtor/projetos");
  });

  it("devolve a mensagem da RPC quando a regra do banco recusa", async () => {
    avancarEstagioProjeto.mockRejectedValue(
      new Error("Descreva na nota quem verificou e com qual evidência para avançar para validacao"),
    );
    await expect(avancarEstagio(undefined, formulario({ projetoId, nota: "" }))).resolves.toEqual({
      erro: "Descreva na nota quem verificou e com qual evidência para avançar para validacao",
      valores: { projetoId, nota: "" },
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
