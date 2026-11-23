import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Sessao } from "@/lib/auth/sessao";

const { exigirPapel, enviarMensagemNegociacao, responderNegociacao, revalidatePath } = vi.hoisted(() => ({
  exigirPapel: vi.fn(),
  enviarMensagemNegociacao: vi.fn(),
  responderNegociacao: vi.fn(),
  revalidatePath: vi.fn(),
}));
vi.mock("@/lib/auth/sessao", () => ({ exigirPapel }));
vi.mock("@/lib/dados/negociacoes", () => ({ enviarMensagemNegociacao, responderNegociacao }));
vi.mock("next/cache", () => ({ revalidatePath }));

import { enviarMensagem, responderInteresse } from "./actions";

const sessao: Sessao = {
  modo: "supabase",
  papel: "produtor",
  id: "11111111-1111-4111-8111-111111111111",
  nome: "Produtor",
  organizacao: null,
};
const interesseId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const projetoId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
function formulario(campos: Record<string, string>) {
  const dados = new FormData();
  for (const [nome, valor] of Object.entries(campos)) dados.set(nome, valor);
  return dados;
}

beforeEach(() => {
  vi.resetAllMocks();
  exigirPapel.mockResolvedValue(sessao);
  enviarMensagemNegociacao.mockResolvedValue({ projetoId });
  responderNegociacao.mockResolvedValue({ projetoId });
});

describe("ações da negociação", () => {
  it("valida UUID e texto antes de acessar o banco", async () => {
    await expect(
      enviarMensagem(undefined, formulario({ interesseId: "invalido", corpo: "Oi" })),
    ).resolves.toEqual({ erro: "Negociação inválida." });
    await expect(enviarMensagem(undefined, formulario({ interesseId, corpo: "   " }))).resolves.toEqual({
      erro: "Escreva uma mensagem.",
    });
    expect(enviarMensagemNegociacao).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it.each(["produtor", "empresa"] as const)(
    "envia mensagem do perfil %s com texto normalizado e atualiza os painéis",
    async (papel) => {
      const usuario = { ...sessao, papel };
      exigirPapel.mockResolvedValue(usuario);
      await expect(
        enviarMensagem(undefined, formulario({ interesseId, corpo: "  Vamos conversar?  " })),
      ).resolves.toEqual({ ok: "Mensagem enviada." });
      expect(exigirPapel).toHaveBeenCalledWith("produtor", "empresa");
      expect(enviarMensagemNegociacao).toHaveBeenCalledWith(usuario, interesseId, "Vamos conversar?");
      expect(revalidatePath.mock.calls.map(([caminho]) => caminho)).toEqual([
        `/negociacoes/${interesseId}`,
        "/produtor",
        `/produtor/projetos/${projetoId}`,
        "/empresa",
        `/marketplace/${projetoId}`,
      ]);
    },
  );

  it("não informa sucesso se a negociação não pertence ao usuário", async () => {
    enviarMensagemNegociacao.mockResolvedValue(null);
    await expect(enviarMensagem(undefined, formulario({ interesseId, corpo: "Mensagem" }))).resolves.toEqual({
      erro: "Negociação indisponível. Atualize a página.",
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("exige produtor para responder e bloqueia estados fora do contrato", async () => {
    await expect(
      responderInteresse(undefined, formulario({ interesseId, status: "encerrada" })),
    ).resolves.toEqual({ erro: "Escolha uma resposta válida." });
    expect(exigirPapel).toHaveBeenCalledWith("produtor");
    expect(responderNegociacao).not.toHaveBeenCalled();
  });

  it.each(["em_negociacao", "aceita", "recusada"])(
    "registra resposta %s com identidade da sessão",
    async (status) => {
      await expect(responderInteresse(undefined, formulario({ interesseId, status }))).resolves.toEqual({
        ok: "Resposta registrada.",
      });
      expect(responderNegociacao).toHaveBeenCalledWith(sessao, interesseId, status);
      expect(revalidatePath).toHaveBeenCalledWith(`/negociacoes/${interesseId}`);
    },
  );

  it("preserva decisão concorrente e retorna erro recuperável", async () => {
    responderNegociacao.mockResolvedValue(null);
    await expect(
      responderInteresse(undefined, formulario({ interesseId, status: "aceita" })),
    ).resolves.toEqual({ erro: "Este interesse não está mais em aberto. Atualize a página." });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("mantém demonstração sem efeitos persistidos", async () => {
    exigirPapel.mockResolvedValue({ ...sessao, modo: "demo" });
    expect((await enviarMensagem(undefined, formulario({ interesseId, corpo: "Mensagem" })))?.erro).toContain(
      "demonstração",
    );
    expect(
      (await responderInteresse(undefined, formulario({ interesseId, status: "aceita" })))?.erro,
    ).toContain("demonstração");
    expect(enviarMensagemNegociacao).not.toHaveBeenCalled();
    expect(responderNegociacao).not.toHaveBeenCalled();
  });

  it("não expõe mensagens internas do banco ao cliente", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    enviarMensagemNegociacao.mockRejectedValue(new Error("detalhe interno confidencial"));
    responderNegociacao.mockRejectedValue(new Error("detalhe interno confidencial"));
    expect((await enviarMensagem(undefined, formulario({ interesseId, corpo: "Mensagem" })))?.erro).toBe(
      "Não foi possível enviar a mensagem agora. Tente novamente.",
    );
    expect((await responderInteresse(undefined, formulario({ interesseId, status: "aceita" })))?.erro).toBe(
      "Não foi possível registrar a resposta agora. Tente novamente.",
    );
    log.mockRestore();
  });
});
