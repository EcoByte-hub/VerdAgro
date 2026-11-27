-- Avanço de estágio com registro na linha do tempo (issue #10).
--
-- Regra de negócio documentada em docs/rods/specs/2026-11-28-avancar-estagio-design.md:
-- - só o dono do projeto avança (dono = owner_id; admin usa o seed);
-- - a ordem dos 8 estágios é fixa: a função sempre calcula o PRÓXIMO, sem pular nem voltar;
-- - a partir de "validação" (estágios de verificação e certificação) a nota é obrigatória,
--   para registrar quem verificou e com qual evidência;
-- - a nota fica no evento da linha do tempo criado pelo trigger log_project_stage.

create or replace function public.avancar_estagio(p_projeto uuid, p_nota text default null)
returns public.project_stage
language plpgsql
security definer
set search_path = ''
as $$
declare
  atual public.project_stage;
  proximo public.project_stage;
  ordem constant public.project_stage[] := array[
    'cadastro',
    'analise_inicial',
    'desenvolvimento',
    'validacao',
    'monitoramento',
    'verificacao_independente',
    'emissao_creditos',
    'comercializacao'
  ];
begin
  select current_stage into atual
    from public.projects
   where id = p_projeto and owner_id = auth.uid();
  if atual is null then
    raise exception 'Projeto não encontrado para este usuário';
  end if;

  if atual = ordem[array_length(ordem, 1)] then
    raise exception 'O projeto já está no último estágio';
  end if;
  proximo := ordem[array_position(ordem, atual) + 1];

  if nullif(btrim(coalesce(p_nota, '')), '') is null
     and proximo in ('validacao', 'monitoramento', 'verificacao_independente', 'emissao_creditos', 'comercializacao') then
    raise exception 'Descreva na nota quem verificou e com qual evidência para avançar para %', proximo;
  end if;

  -- O trigger projects_stage_log registra o evento do novo estágio (sem nota);
  -- em seguida anexamos a nota a esse evento, na mesma transação da função.
  update public.projects
     set current_stage = proximo
   where id = p_projeto and owner_id = auth.uid();

  update public.project_stage_events
     set note = nullif(btrim(p_nota), '')
   where project_id = p_projeto
     and stage = proximo
     and created_at = (
       select max(created_at) from public.project_stage_events where project_id = p_projeto
     );

  return proximo;
end;
$$;

revoke all on function public.avancar_estagio(uuid, text) from public, anon;
grant execute on function public.avancar_estagio(uuid, text) to authenticated;
