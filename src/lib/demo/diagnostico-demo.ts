import type { Diagnostico } from "@/lib/diagnostico/schema";

/**
 * Diagnóstico DEMONSTRATIVO da Fazenda Boa Vista. Usado quando a IA não está
 * configurada ou falha, para que a demo nunca quebre. Exibido com o selo
 * "Dados demonstrativos".
 */
export const DIAGNOSTICO_DEMO: Diagnostico = {
  resumo:
    "A Fazenda Boa Vista já adota plantio direto e rotação soja-milho, duas práticas valorizadas em projetos de manejo agrícola. O satélite indica solo pouco coberto na estação seca, o que abre espaço para culturas de cobertura na entressafra. Antes de pensar em um projeto, é preciso comprovar o histórico de manejo e definir a linha de base.",
  leituraIndicadores: [
    {
      indicador: "NDVI médio anual",
      leitura: "Vegetação ativa durante a safra, compatível com lavoura de grãos bem conduzida.",
    },
    {
      indicador: "NDVI na estação seca",
      leitura:
        "Valores baixos de junho a setembro sugerem solo pouco coberto após a colheita do milho safrinha.",
    },
    {
      indicador: "Meses secos",
      leitura:
        "Cerca de cinco meses com pouca chuva, típico do cerrado. Plantas de cobertura precisam ser adaptadas à seca.",
    },
  ],
  praticasIdentificadas: [
    {
      pratica: "plantio_direto",
      evidencia: "Informado pelo produtor (desde 2018). Palhada compatível com o padrão de NDVI.",
      confianca: "media",
    },
    {
      pratica: "rotacao_culturas",
      evidencia: "Informado pelo produtor e confirmado pelos dois picos de NDVI no ano (soja e milho).",
      confianca: "alta",
    },
  ],
  oportunidades: [
    {
      titulo: "Culturas de cobertura na entressafra",
      pratica: "culturas_cobertura",
      descricao:
        "Semear braquiária ou mix de cobertura junto ou após o milho safrinha mantém o solo protegido na seca e tende a aumentar a matéria orgânica.",
      prioridade: "alta",
    },
    {
      titulo: "Registro detalhado do manejo do solo",
      pratica: "manejo_solo",
      descricao:
        "Organizar análises de solo e registros de adubação por talhão fortalece qualquer projeto futuro e ajuda a definir a linha de base.",
      prioridade: "media",
    },
  ],
  pontosAComprovar: [
    "Uso do plantio direto de forma contínua desde 2018",
    "Situação da área antes da conversão (pastagem degradada até 2017)",
    "Que a nova prática não seria adotada sem o projeto (adicionalidade)",
  ],
  documentosNecessarios: [
    {
      documento: "Recibo do CAR",
      motivo: "Propriedades com pendências ambientais não conseguem estruturar projetos.",
    },
    {
      documento: "Análises de solo dos últimos anos",
      motivo: "Base para a linha de base de carbono do solo.",
    },
    {
      documento: "Notas de insumos e registros de plantio (3 safras)",
      motivo: "Comprovam o histórico de manejo.",
    },
    {
      documento: "Imagens ou laudos da área antes de 2018",
      motivo: "Ajudam a demonstrar a mudança de uso do solo.",
    },
  ],
  proximasEtapas: [
    "Anexar o recibo do CAR e as análises de solo na plataforma",
    "Cadastrar o projeto de culturas de cobertura com a área envolvida",
    "Conversar com um técnico sobre a metodologia de referência (Verra VM0042)",
    "Publicar o projeto no marketplace para encontrar empresas parceiras",
  ],
  alertas: ["Os indicadores de satélite são uma leitura inicial e precisam ser confirmados em campo."],
};
