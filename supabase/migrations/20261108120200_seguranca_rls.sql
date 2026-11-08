-- =============================================================================
-- VerdAgro · Permissões (GRANTs) e Row Level Security
-- Regra geral: o produtor só vê o que é dele; a empresa vê projetos publicados
-- e as próprias negociações; o admin vê tudo.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Funções auxiliares (security definer evita recursão nas políticas)
-- -----------------------------------------------------------------------------
create or replace function public.current_role_is(target public.user_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = target
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.current_role_is('admin');
$$;

create or replace function public.owns_property(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.properties p where p.id = target and p.owner_id = auth.uid()
  );
$$;

create or replace function public.owns_project(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.projects p where p.id = target and p.owner_id = auth.uid()
  );
$$;

create or replace function public.project_is_published(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.projects p where p.id = target and p.is_published
  );
$$;

create or replace function public.participates_in_interest(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.interests i
    join public.projects pr on pr.id = i.project_id
    where i.id = target and (i.company_id = auth.uid() or pr.owner_id = auth.uid())
  );
$$;

-- -----------------------------------------------------------------------------
-- GRANTs explícitos (exigidos pelo PostgREST em projetos Supabase recentes)
-- -----------------------------------------------------------------------------
-- Zera os privilégios padrão do Supabase (que podem conceder ALL nas tabelas)
-- e concede apenas o necessário. anon não acessa nenhuma tabela.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant usage on schema public to anon, authenticated;

grant select on public.profiles to authenticated;
-- UPDATE só nas colunas editáveis: o papel (role) nunca pode ser alterado pela API
grant update (full_name, organization_name, city, state) on public.profiles to authenticated;
grant select, insert, update, delete on
  public.properties,
  public.property_practices,
  public.diagnostics,
  public.projects,
  public.project_documents,
  public.interests
to authenticated;
grant select, insert on public.project_stage_events, public.interest_messages to authenticated;

grant execute on function
  public.current_role_is(public.user_role),
  public.is_admin(),
  public.owns_property(uuid),
  public.owns_project(uuid),
  public.project_is_published(uuid),
  public.participates_in_interest(uuid)
to authenticated;

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.property_practices enable row level security;
alter table public.diagnostics enable row level security;
alter table public.projects enable row level security;
alter table public.project_stage_events enable row level security;
alter table public.project_documents enable row level security;
alter table public.interests enable row level security;
alter table public.interest_messages enable row level security;

-- Perfis --------------------------------------------------------------------
create policy "perfil: ler o próprio" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());

-- Participantes de uma negociação enxergam o perfil da outra ponta
create policy "perfil: ler contraparte de negociação" on public.profiles
  for select to authenticated using (
    exists (
      select 1
      from public.interests i
      join public.projects pr on pr.id = i.project_id
      where (i.company_id = auth.uid() and pr.owner_id = profiles.id)
         or (pr.owner_id = auth.uid() and i.company_id = profiles.id)
    )
  );

create policy "perfil: atualizar o próprio" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());


-- Propriedades -----------------------------------------------------------------
create policy "propriedade: dono gerencia" on public.properties
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid() and public.current_role_is('produtor'));

create policy "propriedade: admin lê" on public.properties
  for select to authenticated using (public.is_admin());

create policy "práticas: dono da propriedade gerencia" on public.property_practices
  for all to authenticated
  using (public.owns_property(property_id))
  with check (public.owns_property(property_id));

create policy "diagnóstico: dono da propriedade gerencia" on public.diagnostics
  for all to authenticated
  using (public.owns_property(property_id) or public.is_admin())
  with check (public.owns_property(property_id));

-- Projetos ------------------------------------------------------------------------
create policy "projeto: dono gerencia" on public.projects
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid() and public.owns_property(property_id));

create policy "projeto: publicados são visíveis" on public.projects
  for select to authenticated using (is_published or public.is_admin());

create policy "linha do tempo: visível com o projeto" on public.project_stage_events
  for select to authenticated using (
    public.owns_project(project_id) or public.project_is_published(project_id) or public.is_admin()
  );

create policy "linha do tempo: dono registra" on public.project_stage_events
  for insert to authenticated with check (public.owns_project(project_id));

create policy "documentos: dono gerencia" on public.project_documents
  for all to authenticated
  using (public.owns_project(project_id))
  with check (public.owns_project(project_id));

create policy "documentos: visíveis em projeto publicado" on public.project_documents
  for select to authenticated using (public.project_is_published(project_id) or public.is_admin());

-- Interesses / negociação --------------------------------------------------------
create policy "interesse: empresa cria em projeto publicado" on public.interests
  for insert to authenticated with check (
    company_id = auth.uid()
    and public.current_role_is('empresa')
    and public.project_is_published(project_id)
  );

create policy "interesse: participantes leem" on public.interests
  for select to authenticated using (
    company_id = auth.uid() or public.owns_project(project_id) or public.is_admin()
  );

create policy "interesse: empresa retira o próprio" on public.interests
  for delete to authenticated using (company_id = auth.uid());

create policy "interesse: participantes atualizam" on public.interests
  for update to authenticated
  using (company_id = auth.uid() or public.owns_project(project_id))
  with check (company_id = auth.uid() or public.owns_project(project_id));

create policy "mensagens: participantes leem" on public.interest_messages
  for select to authenticated using (public.participates_in_interest(interest_id) or public.is_admin());

create policy "mensagens: participantes escrevem" on public.interest_messages
  for insert to authenticated with check (
    author_id = auth.uid() and public.participates_in_interest(interest_id)
  );

-- -----------------------------------------------------------------------------
-- Marketplace: visão pública dos projetos publicados
-- Expõe só a LOCALIZAÇÃO APROXIMADA (centróide arredondado), nunca o polígono.
-- A view roda com as permissões do dono (padrão do Postgres) para ler a
-- propriedade SEM liberar o polígono via RLS; o filtro is_published é a barreira.
-- -----------------------------------------------------------------------------
create or replace view public.marketplace_projects
with (security_invoker = false)
as
select
  pr.id,
  pr.title,
  pr.description,
  pr.practice,
  pr.area_ha,
  pr.methodology,
  pr.current_stage,
  pr.issued_credits,
  pr.commercial_info,
  pr.created_at,
  p.city,
  p.state,
  p.crops,
  p.is_demo,
  round(extensions.st_y(p.centroid::extensions.geometry)::numeric, 2) as approx_lat,
  round(extensions.st_x(p.centroid::extensions.geometry)::numeric, 2) as approx_lng
from public.projects pr
join public.properties p on p.id = pr.property_id
where pr.is_published;

revoke all on public.marketplace_projects from anon, authenticated;
grant select on public.marketplace_projects to authenticated;

-- -----------------------------------------------------------------------------
-- Storage: bucket privado de evidências ("<project_id>/<arquivo>")
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'evidencias',
  'evidencias',
  false,
  10485760, -- 10 MB
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "evidências: dono do projeto envia" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'evidencias'
    and public.owns_project(((storage.foldername(name))[1])::uuid)
  );

create policy "evidências: dono do projeto remove" on storage.objects
  for delete to authenticated using (
    bucket_id = 'evidencias'
    and public.owns_project(((storage.foldername(name))[1])::uuid)
  );

create policy "evidências: leitura por dono ou projeto publicado" on storage.objects
  for select to authenticated using (
    bucket_id = 'evidencias'
    and (
      public.owns_project(((storage.foldername(name))[1])::uuid)
      or public.project_is_published(((storage.foldername(name))[1])::uuid)
    )
  );
