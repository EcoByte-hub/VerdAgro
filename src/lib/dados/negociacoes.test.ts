import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Sessao } from "@/lib/auth/sessao";
import { INTERESSES_DEMO } from "@/lib/demo/catalogo";
import { USUARIOS_DEMO } from "@/lib/demo/usuarios";

vi.mock("server-only", () => ({}));
const { createClient, from } = vi.hoisted(() => ({ createClient: vi.fn(), from: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient }));

import { enviarMensagemNegociacao, obterNegociacao, responderNegociacao } from "./negociacoes";

const produtor: Sessao = {
  modo: "supabase",
  papel: "produtor",
  ...USUARIOS_DEMO.produtor,
};
const empresa: Sessao = { modo: "supabase", papel: "empresa", ...USUARIOS_DEMO.empresa };
const interesse = {
  id: "interesse",
  project_id: "projeto",
  company_id: empresa.id,
  status: "enviada",
  message: "Proposta inicial",
  proposed_volume: 12.5,
  created_at: "2026-11-01T10:00:00Z",
  projects: { title: "Projeto de teste", owner_id: produtor.id },
};

function consulta(data: unknown, error: unknown = null) {
  const resultado = Promise.resolve({ data, error });
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    update: vi.fn(),
    insert: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    then: resultado.then.bind(resultado),
  };
  for (const nome of ["select", "eq", "order", "update", "insert"] as const) {
    query[nome].mockReturnValue(query);
  }
  from.mockReturnValueOnce(query);
  return query;
}

beforeEach(() => {
  vi.clearAllMocks();
  from.mockReset();
  createClient.mockResolvedValue({ from });
});

describe("acesso à negociação", () => {
  it("mapeia proposta, contraparte e mensagens em ordem estável", async () => {
    consulta(interesse);
    const historico = consulta([
      { id: "msg", author_id: empresa.id, body: "Vamos conversar?", created_at: interesse.created_at },
    ]);
    consulta({ organization_name: "Empresa de teste", full_name: "Marina" });

    await expect(obterNegociacao(produtor, interesse.id)).resolves.toMatchObject({
      id: interesse.id,
      empresaId: empresa.id,
      donoProjetoId: produtor.id,
      projetoTitulo: "Projeto de teste",
      contraparte: "Empresa de teste",
      volumeProposto: 12.5,
      mensagens: [
        { id: "msg", autorId: empresa.id, corpo: "Vamos conversar?", criadoEm: interesse.created_at },
      ],
    });
    expect(historico.order.mock.calls).toEqual([
      ["created_at", { ascending: true }],
      ["id", { ascending: true }],
    ]);
  });

  it("mantém histórico da empresa após despublicar o projeto", async () => {
    consulta({ ...interesse, projects: null });
    consulta([]);
    await expect(obterNegociacao(empresa, interesse.id)).resolves.toMatchObject({
      projetoTitulo: "Projeto",
      donoProjetoId: "",
      contraparte: null,
      mensagens: [],
    });
    expect(from).toHaveBeenCalledTimes(2);
  });

  it("não consulta mensagens de quem não participa", async () => {
    consulta(interesse);
    await expect(obterNegociacao({ ...empresa, id: "outra-empresa" }, interesse.id)).resolves.toBeNull();
    expect(from).toHaveBeenCalledTimes(1);
  });

  it("não admite admin como participante", async () => {
    await expect(obterNegociacao({ ...produtor, papel: "admin" }, interesse.id)).resolves.toBeNull();
    expect(createClient).not.toHaveBeenCalled();
  });

  it("propaga falha no histórico em vez de apresentar uma conversa vazia", async () => {
    consulta(interesse);
    consulta(null, new Error("Falha nas mensagens"));
    consulta({ full_name: "Marina", organization_name: null });
    await expect(obterNegociacao(produtor, interesse.id)).rejects.toThrow("Falha nas mensagens");
  });
});

describe("respostas do produtor", () => {
  it("nega resposta da empresa antes de escrever", async () => {
    await expect(responderNegociacao(empresa, interesse.id, "aceita")).resolves.toBeNull();
    expect(createClient).not.toHaveBeenCalled();
  });

  it("nega resposta de outro produtor", async () => {
    consulta(interesse);
    await expect(
      responderNegociacao({ ...produtor, id: "outro-produtor" }, interesse.id, "aceita"),
    ).resolves.toBeNull();
    expect(from).toHaveBeenCalledTimes(1);
  });

  it("condiciona resposta ao estado lido para evitar sobrescrever uma decisão concorrente", async () => {
    consulta(interesse);
    const escrita = consulta({ project_id: interesse.project_id });
    await expect(responderNegociacao(produtor, interesse.id, "aceita")).resolves.toEqual({
      projetoId: interesse.project_id,
    });
    expect(escrita.eq).toHaveBeenCalledWith("status", "enviada");
    expect(escrita.update).toHaveBeenCalledWith({ status: "aceita" });
  });

  it("não reabre uma negociação recusada", async () => {
    consulta({ ...interesse, status: "recusada" });
    await expect(responderNegociacao(produtor, interesse.id, "em_negociacao")).resolves.toBeNull();
    expect(from).toHaveBeenCalledTimes(1);
  });

  it("informa ausência de atualização quando outra resposta já foi gravada", async () => {
    consulta(interesse);
    consulta(null);
    await expect(responderNegociacao(produtor, interesse.id, "recusada")).resolves.toBeNull();
  });
});

describe("envio de mensagens", () => {
  it.each([produtor, empresa])("usa a identidade da sessão do perfil $papel", async (sessao) => {
    consulta({ ...interesse, status: "aceita" });
    const escrita = consulta(null);
    await expect(enviarMensagemNegociacao(sessao, interesse.id, "Obrigado!")).resolves.toEqual({
      projetoId: interesse.project_id,
    });
    expect(escrita.insert).toHaveBeenCalledWith({
      interest_id: interesse.id,
      author_id: sessao.id,
      body: "Obrigado!",
    });
  });

  it("não envia mensagem de um terceiro", async () => {
    consulta(interesse);
    await expect(
      enviarMensagemNegociacao({ ...produtor, id: "outro-produtor" }, interesse.id, "Mensagem"),
    ).resolves.toBeNull();
    expect(from).toHaveBeenCalledTimes(1);
  });
});

describe("negociação em demonstração", () => {
  it("usa o mesmo interesse para os dois lados sem consultar o banco", async () => {
    const id = INTERESSES_DEMO[0].id;
    const doProdutor = await obterNegociacao({ ...produtor, modo: "demo" }, id);
    const daEmpresa = await obterNegociacao({ ...empresa, modo: "demo" }, id);
    expect(doProdutor?.id).toBe(daEmpresa?.id);
    expect(doProdutor?.contraparte).toBe(empresa.organizacao);
    expect(daEmpresa?.contraparte).toBe(produtor.organizacao);
    expect(doProdutor?.mensagens).toEqual([]);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("explica que mutações demonstrativas não são persistidas", async () => {
    await expect(responderNegociacao({ ...produtor, modo: "demo" }, "interesse", "aceita")).rejects.toThrow(
      "No modo demonstração",
    );
    await expect(
      enviarMensagemNegociacao({ ...empresa, modo: "demo" }, "interesse", "Mensagem"),
    ).rejects.toThrow("No modo demonstração");
    expect(createClient).not.toHaveBeenCalled();
  });
});
