# Projetos coletivos para pequenos produtores e cooperativas — issue #22

Proposta de modelo de dados para diferencial de concepção: agrupar produtores para dividir
custos técnicos, respeitando a metodologia. Entrega desta issue: proposta revisada pelo time —
nada aqui é migration aplicada. Princípios: acompanhar o modelo atual (1 projeto = 1 propriedade),
não quebrar o marketplace nem a rastreabilidade, e deixar o rateio explícito no banco.

## Decisões de desenho

1. **Coletivo é um agrupamento de propriedades em torno de um projeto**, não um novo tipo de
   projeto. O projeto coletivo continua sendo um registro em `projects` (mesma rastreabilidade,
   mesmo marketplace, mesmas regras de crédito), com duas diferenças: ele pode cobrir várias
   propriedades e tem um coordenador.
2. **Rateio no nível da área**: cada propriedade participa com uma fração de área
   (`project_properties.area_ha`), e a soma é exatamente a área do projeto (constraint) —
   o mesmo "projeto ≤ propriedade" de hoje, agora em N partes.
3. **Documentos continuam por projeto**; evidências por propriedade entram como
   `project_properties.evidencia` (link/texto), sem duplicar o bucket.

## Modelo proposto

```sql
-- Cooperativas, associações e grupos informais
create table public.producer_groups (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo text not null check (tipo in ('cooperativa', 'associacao', 'informal')),
  coordinator_id uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Participação: um produtor pode pertencer a vários grupos; papel único por grupo
create table public.producer_group_members (
  group_id uuid not null references public.producer_groups (id) on delete cascade,
  producer_id uuid not null references public.profiles (id) on delete cascade,
  papel text not null default 'membro' check (papel in ('coordenador', 'membro')),
  joined_at timestamptz not null default now(),
  primary key (group_id, producer_id),
  constraint groups_single_coordinator unique (group_id, papel) where (papel = 'coordenador')
);
-- (ajuste: unique parcial não pode ir direto em constraint inline; usar índice único parcial)

-- Participação da propriedade no projeto (substitui projects.property_id 1:1)
create table public.project_properties (
  project_id uuid not null references public.projects (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  area_ha numeric(12, 2) not null check (area_ha > 0),
  evidencia text,            -- onde a área entra no projeto coletivo (CAR, termo de adesão…)
  primary key (project_id, property_id)
);
-- Rateio fecha exatamente na área do projeto
alter table public.project_properties
  add constraint rateio_fecha_no_projeto check (
    (select sum(area_ha) from project_properties pp where pp.project_id = project_id) <=
    (select area_ha from projects where id = project_id)
  );
-- (constraint com subquery não existe no PG: implementar via trigger BEFORE INSERT/UPDATE,
--  mesmo padrão de projects_credits_only_when_issued)

alter table public.projects
  add column group_id uuid references public.producer_groups (id) on delete set null,
  add column coordinator_id uuid references public.profiles (id) on delete set null;
-- property_id vira opcional: preenchido no projeto individual, null no coletivo
alter table public.projects
  alter column property_id drop not null,
  add constraint individual_ou_coletivo check (
    (property_id is not null)::int + (group_id is not null)::int = 1
  );
```

## Papéis e RLS (rascunho)

- **Coordenador** (dono do grupo ou `producer_group_members.papel = 'coordenador'`): cria o
  projeto coletivo, define o rateio das propriedades participantes (só de propriedades onde ele
  tem autorização — ver questão aberta 2), publica no marketplace e avança estágios.
- **Produtor participante**: vê o projeto coletivo na sua linha do tempo por meio da sua
  propriedade (`project_properties`), não pode alterar o projeto nem o rateio.
- RLS sugerido: `owns_group(uuid)` e `participates_in_project(uuid)` como funções de guarda no
  mesmo padrão de `owns_property`/`owns_project`; política de select em `project_properties`:
  dono do projeto OU dono da propriedade participante OU publicado no marketplace.
- O avanço de estágio da issue #10 passa a aceitar também o coordenador de projetos coletivos
  (`avancar_estagio` recebe a verificação de dono via função, não direto).

## Rateio de documentos e área no marketplace

- Marketplace continua mostrando o projeto coletivo como UM card (área total, municípios-uf
  das participantes em "região", metodologia única).
- A soma de hectares nos indicadores admin não pode duplicar: contar `project_properties`
  quando o projeto é coletivo.

## Questões abertas para o time

1. Projeto coletivo precisa de uma única metodologia? (sugestão: sim, no MVP — metodologias
   agrupam por similaridade de prática, não por propriedade.)
2. O produtor participante autoriza o coordenador **no app** (termo gravado em
   `project_properties.evidencia`) ou a autorização fica fora do escopo do MVP?
3. Negociação por interesse: empresa negocia com o coordenador (sugestão: sim; interesse guarda
   `company_id` e o projeto, e as respostas saem da conta do coordenador).
4. Créditos emitidos precisam de rateio por propriedade? (sugestão: não no MVP — emissão é por
   registro oficial e fica no projeto; divisão financeira é fora da plataforma.)

Sem alteração de schema aplicada, pagamentos ou chamadas externas. Próximo passo: revisão do
time; após aprovado, migração em dois passos (tabelas novas sem quebrar 1:1; depois depreciação
de `projects.property_id` para projetos individuais coexistirem com a coluna `group_id`).
