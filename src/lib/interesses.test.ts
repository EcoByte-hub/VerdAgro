import { describe, expect, it } from "vitest";
import type { StatusInteresse } from "@/lib/dados/tipos";
import {
  contarNovosPorProjeto,
  ehNovo,
  estaAberto,
  ordenarPorAtencao,
  rotuloNovos,
  somarNovos,
  STATUS_ABERTOS,
} from "./interesses";

const interesse = (id: string, projetoId: string, status: StatusInteresse) => ({ id, projetoId, status });

describe("ehNovo", () => {
  it("só o interesse sem resposta (enviada) é novo", () => {
    expect(ehNovo({ status: "enviada" })).toBe(true);
    for (const status of ["em_negociacao", "aceita", "recusada", "encerrada"] as const) {
      expect(ehNovo({ status })).toBe(false);
    }
  });
});

describe("estaAberto", () => {
  it("só enviada e em negociação podem ser recusadas ou retiradas", () => {
    expect(STATUS_ABERTOS).toEqual(["enviada", "em_negociacao"]);
    expect(estaAberto({ status: "enviada" })).toBe(true);
    expect(estaAberto({ status: "em_negociacao" })).toBe(true);
    for (const status of ["aceita", "recusada", "encerrada"] as const) {
      expect(estaAberto({ status })).toBe(false);
    }
  });
});

describe("ordenarPorAtencao", () => {
  it("novos no topo, encerrados no fim, sem embaralhar a ordem de chegada", () => {
    const lista = [
      interesse("a", "p1", "recusada"),
      interesse("b", "p1", "em_negociacao"),
      interesse("c", "p1", "enviada"),
      interesse("d", "p2", "encerrada"),
      interesse("e", "p2", "aceita"),
      interesse("f", "p2", "enviada"),
    ];
    expect(ordenarPorAtencao(lista).map((i) => i.id)).toEqual(["c", "f", "b", "e", "a", "d"]);
    expect(lista.map((i) => i.id)).toEqual(["a", "b", "c", "d", "e", "f"]);
  });
});

describe("contarNovosPorProjeto / somarNovos", () => {
  it("conta só os novos, por projeto", () => {
    const porProjeto = contarNovosPorProjeto([
      interesse("a", "p1", "enviada"),
      interesse("b", "p1", "enviada"),
      interesse("c", "p2", "em_negociacao"),
      interesse("d", "p3", "enviada"),
    ]);
    expect(porProjeto).toEqual({ p1: 2, p3: 1 });
    expect(somarNovos(porProjeto)).toBe(3);
    expect(somarNovos({})).toBe(0);
  });
});

describe("rotuloNovos", () => {
  it("concorda singular e plural", () => {
    expect(rotuloNovos(1)).toBe("1 interesse novo");
    expect(rotuloNovos(3)).toBe("3 interesses novos");
  });
});
