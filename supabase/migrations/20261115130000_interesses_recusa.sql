-- =============================================================================
-- Só o dono do projeto (ou um admin) muda o status de um interesse.
--
-- O app deixa o produtor recusar um interesse. Sem esta regra, a empresa poderia,
-- direto pela API, se "auto-aceitar" ou trocar uma recusa por "enviada". Depois de
-- recusada, a empresa pode mandar uma proposta nova: o app apaga a recusada e cria
-- outra (a política de exclusão da empresa continua a mesma).
--
-- Sem usuário na requisição (SQL direto, seed, service role) a regra não se aplica.
-- =============================================================================
create or replace function public.interests_status_so_pelo_dono()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status
     and auth.uid() is not null
     and not (public.owns_project(old.project_id) or public.is_admin()) then
    raise exception 'Só o produtor dono do projeto muda o status do interesse'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger interests_status_so_pelo_dono before update of status on public.interests
  for each row execute function public.interests_status_so_pelo_dono();
