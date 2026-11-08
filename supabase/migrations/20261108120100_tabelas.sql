-- =============================================================================
-- VerdAgro · Tabelas principais
-- =============================================================================

-- Utilitário: mantém updated_at atualizado
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Perfis (1:1 com auth.users)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null,
  full_name text not null,
  organization_name text,          -- nome da fazenda/cooperativa ou razão social
  city text,
  state char(2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Cria o perfil automaticamente no cadastro (role vem do metadata do signUp)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role, full_name, organization_name)
  values (
    new.id,
    -- admin nunca pode ser escolhido no cadastro
    case
      when new.raw_user_meta_data ->> 'role' = 'empresa' then 'empresa'::public.user_role
      else 'produtor'::public.user_role
    end,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data ->> 'organization_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Propriedades rurais (com geometria PostGIS)
-- -----------------------------------------------------------------------------
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  city text not null,
  state char(2) not null,
  boundary extensions.geography (Polygon, 4326) not null,
  area_ha numeric(12, 2) not null default 0,     -- calculada por trigger
  centroid extensions.geography (Point, 4326),   -- calculado por trigger
  production_type text,                          -- ex.: grãos, pecuária, misto
  crops text[] not null default '{}',
  land_use_history text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index properties_owner_idx on public.properties (owner_id);
create index properties_boundary_idx on public.properties using gist (boundary);

create or replace function public.properties_compute_geo()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.area_ha = round((extensions.st_area(new.boundary) / 10000)::numeric, 2);
  new.centroid = extensions.st_centroid(new.boundary::extensions.geometry)::extensions.geography;
  return new;
end;
$$;

create trigger properties_geo before insert or update of boundary on public.properties
  for each row execute function public.properties_compute_geo();

create trigger properties_updated_at before update on public.properties
  for each row execute function public.set_updated_at();

-- Práticas de manejo informadas pelo produtor
create table public.property_practices (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  practice public.practice_type not null,
  since_year smallint check (since_year between 1950 and 2100),
  notes text,
  created_at timestamptz not null default now(),
  unique (property_id, practice)
);

-- -----------------------------------------------------------------------------
-- Diagnósticos (resultado salvo: NDVI, clima e IA nunca são recalculados à toa)
-- -----------------------------------------------------------------------------
create table public.diagnostics (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  ndvi jsonb,                -- série mensal { month, mean, min, max, ... }
  climate jsonb,             -- resumo NASA POWER
  result jsonb not null,     -- saída estruturada do diagnóstico (schema Zod)
  sources jsonb not null,    -- origem de cada parte: satelite | demo | ia
  model text,                -- modelo de IA usado, se houver
  created_at timestamptz not null default now()
);

create index diagnostics_property_idx on public.diagnostics (property_id, created_at desc);

-- -----------------------------------------------------------------------------
-- Projetos de carbono
-- -----------------------------------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  practice public.practice_type not null,
  area_ha numeric(12, 2) not null check (area_ha > 0),
  objective text,
  start_date date,
  end_date date,
  methodology text,                               -- ex.: Verra VM0042
  current_stage public.project_stage not null default 'cadastro',
  is_published boolean not null default false,    -- visível no marketplace
  issued_credits numeric(14, 2),                  -- tCO2e EMITIDOS por registro oficial
  commercial_info text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_dates_chk check (end_date is null or start_date is null or end_date >= start_date),
  -- Regra de ouro: créditos só existem depois da emissão por verificação independente
  constraint projects_credits_only_when_issued check (
    issued_credits is null or current_stage in ('emissao_creditos', 'comercializacao')
  )
);

create index projects_owner_idx on public.projects (owner_id);
create index projects_published_idx on public.projects (is_published) where is_published;

create trigger projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

-- Linha do tempo (rastreabilidade)
create table public.project_stage_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  stage public.project_stage not null,
  note text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index stage_events_project_idx on public.project_stage_events (project_id, created_at);

-- Registra o estágio inicial e cada mudança de estágio automaticamente
create or replace function public.log_project_stage()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.current_stage is distinct from old.current_stage then
    insert into public.project_stage_events (project_id, stage, created_by)
    values (new.id, new.current_stage, auth.uid());
  end if;
  return new;
end;
$$;

create trigger projects_stage_log after insert or update of current_stage on public.projects
  for each row execute function public.log_project_stage();

-- Documentos e evidências (arquivos no Storage, bucket "evidencias")
create table public.project_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  storage_path text not null unique,   -- "<project_id>/<arquivo>"
  file_name text not null,
  kind text not null default 'evidencia',  -- evidencia | car | nota_fiscal | laudo | outro
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index documents_project_idx on public.project_documents (project_id);

-- -----------------------------------------------------------------------------
-- Manifestações de interesse e negociação
-- -----------------------------------------------------------------------------
create table public.interests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  company_id uuid not null references public.profiles (id) on delete cascade,
  status public.interest_status not null default 'enviada',
  message text not null,
  proposed_volume numeric(14, 2) check (proposed_volume is null or proposed_volume > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, company_id)
);

create index interests_company_idx on public.interests (company_id);

create trigger interests_updated_at before update on public.interests
  for each row execute function public.set_updated_at();

create table public.interest_messages (
  id uuid primary key default gen_random_uuid(),
  interest_id uuid not null references public.interests (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index interest_messages_interest_idx on public.interest_messages (interest_id, created_at);
