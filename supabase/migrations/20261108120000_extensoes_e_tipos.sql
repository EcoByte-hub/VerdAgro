-- =============================================================================
-- VerdAgro · Extensões e tipos enumerados
-- =============================================================================

create extension if not exists postgis with schema extensions;

-- Perfis de acesso da plataforma
create type public.user_role as enum ('produtor', 'empresa', 'admin');

-- Os 8 estágios de rastreabilidade de um projeto (documento de concepção, módulo 6)
create type public.project_stage as enum (
  'cadastro',
  'analise_inicial',
  'desenvolvimento',
  'validacao',
  'monitoramento',
  'verificacao_independente',
  'emissao_creditos',
  'comercializacao'
);

-- Práticas sustentáveis reconhecidas pela plataforma
create type public.practice_type as enum (
  'plantio_direto',
  'rotacao_culturas',
  'recuperacao_pastagens',
  'culturas_cobertura',
  'integracao_lavoura_pecuaria',
  'manejo_solo',
  'outra'
);

-- Situação de uma manifestação de interesse / negociação
create type public.interest_status as enum (
  'enviada',
  'em_negociacao',
  'aceita',
  'recusada',
  'encerrada'
);

comment on type public.project_stage is
  'Estágios até validacao/monitoramento são ESTIMATIVA. Créditos só existem a partir de emissao_creditos.';
