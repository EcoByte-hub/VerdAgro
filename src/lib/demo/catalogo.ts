import type { Interesse, ProjetoDetalhe, Propriedade } from "@/lib/dados/tipos";
import { FAZENDA_BOA_VISTA } from "./fazenda-boa-vista";
import { USUARIOS_DEMO } from "./usuarios";

/**
 * Catálogo DEMONSTRATIVO usado no modo demonstração (sem Supabase).
 * Baseado no supabase/seed.sql (mesmos IDs). Inclui um interesse já enviado
 * para a Fazenda Boa Vista, mostrando o passo 7 da demo (produtor recebe o interesse).
 */

const diasAtras = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

export const PROPRIEDADES_DEMO: (Propriedade & { donoId: string })[] = [
  {
    id: FAZENDA_BOA_VISTA.id,
    donoId: USUARIOS_DEMO.produtor.id,
    nome: FAZENDA_BOA_VISTA.nome,
    municipio: FAZENDA_BOA_VISTA.municipio,
    uf: FAZENDA_BOA_VISTA.uf,
    areaHa: 199.39,
    producao: FAZENDA_BOA_VISTA.producao,
    culturas: [...FAZENDA_BOA_VISTA.culturas],
    historico: FAZENDA_BOA_VISTA.historico,
    isDemo: true,
    poligono: FAZENDA_BOA_VISTA.poligono,
    praticas: FAZENDA_BOA_VISTA.praticas.map((p) => ({ pratica: p.pratica, desde: p.desde })),
  },
];

export const PROJETOS_DEMO: (ProjetoDetalhe & { donoId: string })[] = [
  {
    id: "bbbbbbbb-0000-4000-8000-000000000001",
    donoId: USUARIOS_DEMO.produtor.id,
    titulo: "Culturas de cobertura na entressafra",
    descricao:
      "Introdução de mix de cobertura (braquiária + crotalária) após a colheita do milho safrinha, mantendo o plantio direto.",
    pratica: "culturas_cobertura",
    areaHa: 140,
    metodologia: "Verra VM0042 (manejo agrícola aprimorado)",
    estagio: "desenvolvimento",
    creditosEmitidos: null,
    municipio: "Rio Verde",
    uf: "GO",
    culturas: ["soja", "milho safrinha"],
    isDemo: true,
    publicado: true,
    infoComercial: "Aberto a parceria de longo prazo com pré-compra condicionada à verificação.",
    objetivo: "Aumentar o carbono orgânico do solo e reduzir erosão.",
    inicio: "2026-03-01",
    linhaDoTempo: [
      { estagio: "cadastro", nota: "Projeto cadastrado", data: diasAtras(60) },
      { estagio: "analise_inicial", nota: "Diagnóstico inicial concluído", data: diasAtras(45) },
      { estagio: "desenvolvimento", nota: null, data: diasAtras(10) },
    ],
  },
  {
    id: "bbbbbbbb-0000-4000-8000-000000000002",
    donoId: "22222222-2222-4222-8222-222222222222",
    titulo: "Recuperação de pastagem degradada",
    descricao: "Reforma de pastagem com correção de solo e manejo rotacionado.",
    pratica: "recuperacao_pastagens",
    areaHa: 180,
    metodologia: "Verra VM0042",
    estagio: "validacao",
    creditosEmitidos: null,
    municipio: "Jataí",
    uf: "GO",
    culturas: ["pastagem"],
    isDemo: true,
    publicado: true,
    infoComercial: "Busca empresa parceira para custear a validação.",
    objetivo: "Recuperar a produtividade da pastagem e o estoque de carbono do solo.",
    inicio: "2025-10-01",
    linhaDoTempo: [
      { estagio: "cadastro", nota: null, data: diasAtras(200) },
      { estagio: "analise_inicial", nota: null, data: diasAtras(180) },
      { estagio: "desenvolvimento", nota: null, data: diasAtras(120) },
      { estagio: "validacao", nota: null, data: diasAtras(30) },
    ],
  },
  {
    id: "bbbbbbbb-0000-4000-8000-000000000003",
    donoId: "22222222-2222-4222-8222-222222222222",
    titulo: "Expansão de culturas de cobertura",
    descricao: "Ampliação da braquiária consorciada para 100% dos talhões.",
    pratica: "culturas_cobertura",
    areaHa: 420,
    metodologia: "Verra VM0042",
    estagio: "monitoramento",
    creditosEmitidos: null,
    municipio: "Sorriso",
    uf: "MT",
    culturas: ["soja", "milho", "braquiária"],
    isDemo: true,
    publicado: true,
    infoComercial: null,
    objetivo: "Ampliar cobertura permanente do solo.",
    inicio: "2024-09-01",
    linhaDoTempo: [
      { estagio: "cadastro", nota: null, data: diasAtras(400) },
      { estagio: "analise_inicial", nota: null, data: diasAtras(380) },
      { estagio: "desenvolvimento", nota: null, data: diasAtras(300) },
      { estagio: "validacao", nota: "Validação por organismo independente", data: diasAtras(150) },
      { estagio: "monitoramento", nota: null, data: diasAtras(40) },
    ],
  },
];

export const INTERESSES_DEMO: (Interesse & { empresaId: string; donoProjetoId: string })[] = [
  {
    id: "cccccccc-0000-4000-8000-000000000002",
    projetoId: "bbbbbbbb-0000-4000-8000-000000000001",
    projetoTitulo: "Culturas de cobertura na entressafra",
    status: "enviada",
    mensagem:
      "Olá! Temos interesse em apoiar a implantação das culturas de cobertura e conversar sobre prioridade na compra de créditos futuros.",
    volumeProposto: null,
    contraparte: USUARIOS_DEMO.empresa.organizacao,
    criadoEm: diasAtras(1),
    empresaId: USUARIOS_DEMO.empresa.id,
    donoProjetoId: USUARIOS_DEMO.produtor.id,
  },
];
