import type { Interesse, StatusInteresse } from "@/lib/dados/tipos";

/**
 * Para o produtor, "novo" é o interesse que a empresa enviou e ainda não teve
 * resposta (status "enviada"). Deixa de ser novo quando a negociação avança.
 */
export const ehNovo = (i: Pick<Interesse, "status">) => i.status === "enviada";

/** Em aberto: o produtor ainda pode recusar e a empresa, retirar. */
export const STATUS_ABERTOS = ["enviada", "em_negociacao"] as const satisfies readonly StatusInteresse[];

export const estaAberto = (i: Pick<Interesse, "status">) =>
  (STATUS_ABERTOS as readonly StatusInteresse[]).includes(i.status);

/** Novos no topo, depois os em andamento e, por último, os recusados/encerrados. */
const prioridade = (i: Pick<Interesse, "status">) =>
  ehNovo(i) ? 0 : i.status === "recusada" || i.status === "encerrada" ? 2 : 1;

/** Ordena pelo que pede atenção; dentro de cada grupo mantém a ordem recebida (mais recentes antes). */
export const ordenarPorAtencao = <T extends Pick<Interesse, "status">>(lista: T[]) =>
  [...lista].sort((a, b) => prioridade(a) - prioridade(b));

/** Quantos interesses novos cada projeto tem. Projetos sem novos ficam de fora. */
export function contarNovosPorProjeto(lista: Pick<Interesse, "projetoId" | "status">[]) {
  const porProjeto: Record<string, number> = {};
  for (const i of lista) if (ehNovo(i)) porProjeto[i.projetoId] = (porProjeto[i.projetoId] ?? 0) + 1;
  return porProjeto;
}

export const somarNovos = (porProjeto: Record<string, number>) =>
  Object.values(porProjeto).reduce((total, n) => total + n, 0);

export const rotuloNovos = (n: number) => `${n} ${n === 1 ? "interesse novo" : "interesses novos"}`;
