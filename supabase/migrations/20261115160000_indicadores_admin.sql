-- Indicadores globais: somente administradores podem consultar os agregados.
-- SECURITY INVOKER mantém as políticas RLS das tabelas de origem.
create function public.indicadores_admin()
returns table (
  producers bigint,
  properties bigint,
  hectares numeric,
  projects bigint,
  companies bigint,
  interests bigint,
  projects_in_validation bigint,
  issued_credits numeric,
  demo_properties bigint
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Acesso restrito à administração.' using errcode = '42501';
  end if;

  return query
  select
    (select count(*) from public.profiles p where p.role = 'produtor'),
    (select count(*) from public.properties),
    (select coalesce(sum(p.area_ha), 0) from public.properties p),
    (select count(*) from public.projects),
    (select count(*) from public.profiles p where p.role = 'empresa'),
    (select count(*) from public.interests),
    (select count(*) from public.projects p where p.current_stage = 'validacao'),
    (select coalesce(sum(p.issued_credits), 0) from public.projects p
      where p.current_stage in ('emissao_creditos', 'comercializacao')),
    (select count(*) from public.properties p where p.is_demo);
end;
$$;

revoke all on function public.indicadores_admin() from public, anon, authenticated;
grant execute on function public.indicadores_admin() to authenticated;

comment on function public.indicadores_admin() is
  'Totais atuais para admin. Hectares somam propriedades uma única vez; validação considera apenas o estágio atual; créditos somam somente volumes emitidos, nunca estimativas.';
