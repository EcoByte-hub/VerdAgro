import { describe, expect, it } from "vitest";
import { podeResponderNegociacao, schemaMensagemNegociacao, schemaRespostaNegociacao } from "./negociacoes";

const interesseId = "11111111-1111-4111-8111-111111111111";

describe("mensagem da negociação", () => {
  it("remove espaços nas pontas e preserva as quebras de linha da conversa", () => {
    expect(schemaMensagemNegociacao.parse({ interesseId, corpo: "  Olá!\nPodemos conversar?  " })).toEqual({
      interesseId,
      corpo: "Olá!\nPodemos conversar?",
    });
  });

  it.each(["", " \n\t ", "a".repeat(4001)])("rejeita mensagem vazia ou acima do limite", (corpo) => {
    expect(schemaMensagemNegociacao.safeParse({ interesseId, corpo }).success).toBe(false);
  });

  it("aceita os limites de um e 4.000 caracteres", () => {
    for (const corpo of ["a", "a".repeat(4000)]) {
      expect(schemaMensagemNegociacao.safeParse({ interesseId, corpo }).success).toBe(true);
    }
  });

  it("rejeita identificador inválido e corpo ausente", () => {
    expect(schemaMensagemNegociacao.safeParse({ interesseId: "outro", corpo: "Olá" }).success).toBe(false);
    expect(schemaMensagemNegociacao.safeParse({ interesseId }).success).toBe(false);
  });
});

describe("resposta do produtor", () => {
  it("aceita somente negociar, aceitar ou recusar, com um identificador válido", () => {
    for (const status of ["em_negociacao", "aceita", "recusada"]) {
      expect(schemaRespostaNegociacao.safeParse({ interesseId, status }).success).toBe(true);
    }
    for (const status of ["enviada", "encerrada", "", "aprovada"]) {
      expect(schemaRespostaNegociacao.safeParse({ interesseId, status }).success).toBe(false);
    }
    expect(schemaRespostaNegociacao.safeParse({ interesseId: "outro", status: "aceita" }).success).toBe(
      false,
    );
  });

  it("permite as três respostas a um interesse novo", () => {
    for (const resposta of ["em_negociacao", "aceita", "recusada"] as const) {
      expect(podeResponderNegociacao("enviada", resposta)).toBe(true);
    }
  });

  it("permite aceitar ou recusar durante a negociação, sem reiniciá-la", () => {
    expect(podeResponderNegociacao("em_negociacao", "aceita")).toBe(true);
    expect(podeResponderNegociacao("em_negociacao", "recusada")).toBe(true);
    expect(podeResponderNegociacao("em_negociacao", "em_negociacao")).toBe(false);
  });

  it("preserva respostas já concluídas", () => {
    for (const atual of ["aceita", "recusada", "encerrada"] as const) {
      for (const resposta of ["em_negociacao", "aceita", "recusada"] as const) {
        expect(podeResponderNegociacao(atual, resposta)).toBe(false);
      }
    }
  });
});
