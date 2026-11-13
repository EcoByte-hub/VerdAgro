import type { PoligonoGeoJSON } from "@/lib/geo/poligono";
import type { Database } from "@/lib/supabase/database.types";

export type Estagio = Database["public"]["Enums"]["project_stage"];
export type Pratica = Database["public"]["Enums"]["practice_type"];
export type StatusInteresse = Database["public"]["Enums"]["interest_status"];

export const ESTAGIOS: { id: Estagio; rotulo: string; tipo: "estimativa" | "verificacao" | "certificado" }[] =
  [
    { id: "cadastro", rotulo: "Cadastro", tipo: "estimativa" },
    { id: "analise_inicial", rotulo: "Análise inicial", tipo: "estimativa" },
    { id: "desenvolvimento", rotulo: "Desenvolvimento", tipo: "estimativa" },
    { id: "validacao", rotulo: "Validação", tipo: "verificacao" },
    { id: "monitoramento", rotulo: "Monitoramento", tipo: "verificacao" },
    { id: "verificacao_independente", rotulo: "Verificação independente", tipo: "verificacao" },
    { id: "emissao_creditos", rotulo: "Emissão de créditos", tipo: "certificado" },
    { id: "comercializacao", rotulo: "Comercialização", tipo: "certificado" },
  ];

export const infoEstagio = (id: Estagio) => ESTAGIOS.find((e) => e.id === id)!;

export const ROTULO_STATUS: Record<StatusInteresse, string> = {
  enviada: "Enviada",
  em_negociacao: "Em negociação",
  aceita: "Aceita",
  recusada: "Recusada",
  encerrada: "Encerrada",
};

export type Propriedade = {
  id: string;
  nome: string;
  municipio: string;
  uf: string;
  areaHa: number;
  producao: string | null;
  culturas: string[];
  historico: string | null;
  isDemo: boolean;
  poligono: PoligonoGeoJSON;
  praticas: { pratica: Pratica; desde: number | null }[];
};

export type ProjetoResumo = {
  id: string;
  titulo: string;
  descricao: string | null;
  pratica: Pratica;
  areaHa: number;
  metodologia: string | null;
  estagio: Estagio;
  creditosEmitidos: number | null;
  municipio: string;
  uf: string;
  culturas: string[];
  isDemo: boolean;
  publicado: boolean;
  infoComercial: string | null;
};

export type EventoLinhaDoTempo = { estagio: Estagio; nota: string | null; data: string };

export type ProjetoDetalhe = ProjetoResumo & {
  objetivo: string | null;
  inicio: string | null;
  linhaDoTempo: EventoLinhaDoTempo[];
};

export const ROTULO_DOCUMENTO: Record<string, string> = {
  evidencia: "Evidência",
  car: "CAR",
  nota_fiscal: "Nota fiscal",
  laudo: "Laudo",
  outro: "Outro",
};

export type DocumentoProjeto = {
  id: string;
  nome: string;
  tipo: string;
  criadoEm: string;
  /** link assinado e temporário (bucket privado); null se não foi possível gerar */
  url: string | null;
};

/** Visão do dono: inclui o que nunca vai para o marketplace (rascunho, documentos, propriedade). */
export type ProjetoDoProdutor = ProjetoDetalhe & {
  fim: string | null;
  propriedade: { id: string; nome: string; areaHa: number };
  documentos: DocumentoProjeto[];
};

/** Campos que o produtor pode editar. Estágio e créditos não entram: dependem de verificação externa. */
export type EdicaoProjeto = {
  titulo: string;
  descricao: string | null;
  objetivo: string | null;
  pratica: Pratica;
  areaHa: number;
  metodologia: string | null;
  inicio: string | null;
  fim: string | null;
  infoComercial: string | null;
};

export type Interesse = {
  id: string;
  projetoId: string;
  projetoTitulo: string;
  status: StatusInteresse;
  mensagem: string;
  volumeProposto: number | null;
  /** nome da outra ponta (empresa para o produtor, produtor para a empresa) */
  contraparte: string | null;
  criadoEm: string;
};

export type FiltrosMarketplace = {
  uf?: string;
  pratica?: Pratica;
  busca?: string;
};
