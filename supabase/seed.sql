-- =============================================================================
-- VerdAgro · Dados DEMONSTRATIVOS (fictícios) para desenvolvimento e demo
-- Todas as propriedades têm is_demo = true e aparecem com o selo
-- "Dados demonstrativos" na interface.
--
-- Usuários (senha de todos: verdagro-demo):
--   produtor@demo.verdagro.app  · produtor rural (Fazenda Boa Vista)
--   coop@demo.verdagro.app      · produtor rural (cooperativa, projetos extras)
--   empresa@demo.verdagro.app   · empresa compradora
--   admin@demo.verdagro.app     · administrador
-- =============================================================================

-- Usuários ---------------------------------------------------------------------
do $$
declare
  u record;
begin
  for u in
    select * from (values
      ('11111111-1111-4111-8111-111111111111'::uuid, 'produtor@demo.verdagro.app', 'produtor', 'João Ferreira', 'Fazenda Boa Vista'),
      ('22222222-2222-4222-8222-222222222222'::uuid, 'coop@demo.verdagro.app', 'produtor', 'Ana Ribeiro', 'Cooperativa Cerrado Vivo'),
      ('33333333-3333-4333-8333-333333333333'::uuid, 'empresa@demo.verdagro.app', 'empresa', 'Marina Costa', 'Grupo Alimentos Horizonte'),
      ('44444444-4444-4444-8444-444444444444'::uuid, 'admin@demo.verdagro.app', 'produtor', 'Equipe EcoByte', 'VerdAgro')
    ) as t(id, email, role, full_name, organization_name)
  loop
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
      extensions.crypt('verdagro-demo', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('role', u.role, 'full_name', u.full_name, 'organization_name', u.organization_name),
      now(), now(), '', '', '', ''
    ) on conflict (id) do nothing;

    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (
      gen_random_uuid(), u.id, u.id::text,
      jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
      'email', now(), now(), now()
    ) on conflict do nothing;
  end loop;
end $$;

-- O trigger handle_new_user nunca cria admin: promovemos aqui
update public.profiles set role = 'admin' where id = '44444444-4444-4444-8444-444444444444';
update public.profiles set city = 'Rio Verde', state = 'GO' where id = '11111111-1111-4111-8111-111111111111';
update public.profiles set city = 'Jataí', state = 'GO' where id = '22222222-2222-4222-8222-222222222222';
update public.profiles set city = 'São Paulo', state = 'SP' where id = '33333333-3333-4333-8333-333333333333';

-- Propriedades -------------------------------------------------------------------
insert into public.properties (id, owner_id, name, city, state, boundary, production_type, crops, land_use_history, is_demo)
values
  (
    'aaaaaaaa-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    'Fazenda Boa Vista', 'Rio Verde', 'GO',
    extensions.st_geogfromtext('SRID=4326;POLYGON((-50.998726 -17.959067, -50.993109 -17.961547, -50.985887 -17.960402, -50.98368 -17.955059, -50.985486 -17.949143, -50.992106 -17.947616, -50.998124 -17.950097, -50.999528 -17.955059, -50.998726 -17.959067))'),
    'Grãos', array['soja', 'milho safrinha'],
    'Pastagem degradada até 2017. Conversão para lavoura de grãos em 2018 com plantio direto desde o início.',
    true
  ),
  (
    'aaaaaaaa-0000-4000-8000-000000000002',
    '22222222-2222-4222-8222-222222222222',
    'Sítio Três Córregos', 'Jataí', 'GO',
    extensions.st_geogfromtext('SRID=4326;POLYGON((-51.735 -17.905, -51.722 -17.905, -51.722 -17.894, -51.735 -17.894, -51.735 -17.905))'),
    'Pecuária', array['pastagem'],
    'Pastagem extensiva com sinais de degradação. Interesse em recuperação e integração lavoura-pecuária.',
    true
  ),
  (
    'aaaaaaaa-0000-4000-8000-000000000003',
    '22222222-2222-4222-8222-222222222222',
    'Fazenda Santa Luzia', 'Sorriso', 'MT',
    extensions.st_geogfromtext('SRID=4326;POLYGON((-55.735 -12.565, -55.715 -12.565, -55.715 -12.548, -55.735 -12.548, -55.735 -12.565))'),
    'Grãos', array['soja', 'milho', 'braquiária'],
    'Lavoura consolidada. Culturas de cobertura adotadas parcialmente desde 2021.',
    true
  );

insert into public.property_practices (property_id, practice, since_year, notes) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'plantio_direto', 2018, 'Em toda a área de lavoura'),
  ('aaaaaaaa-0000-4000-8000-000000000001', 'rotacao_culturas', 2019, 'Soja no verão, milho safrinha'),
  ('aaaaaaaa-0000-4000-8000-000000000003', 'culturas_cobertura', 2021, 'Braquiária em parte dos talhões');

-- Projetos -------------------------------------------------------------------------
insert into public.projects (id, property_id, owner_id, title, description, practice, area_ha, objective, start_date, methodology, current_stage, is_published, commercial_info)
values
  (
    'bbbbbbbb-0000-4000-8000-000000000001',
    'aaaaaaaa-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    'Culturas de cobertura na entressafra',
    'Introdução de mix de cobertura (braquiária + crotalária) após a colheita do milho safrinha, mantendo o plantio direto.',
    'culturas_cobertura', 140, 'Aumentar o carbono orgânico do solo e reduzir erosão.',
    '2026-03-01', 'Verra VM0042 (manejo agrícola aprimorado)', 'desenvolvimento', true,
    'Aberto a parceria de longo prazo com pré-compra condicionada à verificação.'
  ),
  (
    'bbbbbbbb-0000-4000-8000-000000000002',
    'aaaaaaaa-0000-4000-8000-000000000002',
    '22222222-2222-4222-8222-222222222222',
    'Recuperação de pastagem degradada',
    'Reforma de pastagem com correção de solo e manejo rotacionado.',
    'recuperacao_pastagens', 180, 'Recuperar a produtividade da pastagem e o estoque de carbono do solo.',
    '2025-10-01', 'Verra VM0042', 'validacao', true,
    'Busca empresa parceira para custear a validação.'
  ),
  (
    'bbbbbbbb-0000-4000-8000-000000000003',
    'aaaaaaaa-0000-4000-8000-000000000003',
    '22222222-2222-4222-8222-222222222222',
    'Expansão de culturas de cobertura',
    'Ampliação da braquiária consorciada para 100% dos talhões.',
    'culturas_cobertura', 420, 'Ampliar cobertura permanente do solo.',
    '2024-09-01', 'Verra VM0042', 'monitoramento', true, null
  );

-- Histórico de estágios coerente para os projetos já avançados
-- (o trigger registrou só o estágio atual; completamos a linha do tempo)
insert into public.project_stage_events (project_id, stage, note, created_at) values
  ('bbbbbbbb-0000-4000-8000-000000000001', 'cadastro', 'Projeto cadastrado', now() - interval '60 days'),
  ('bbbbbbbb-0000-4000-8000-000000000001', 'analise_inicial', 'Diagnóstico inicial concluído', now() - interval '45 days'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'cadastro', null, now() - interval '200 days'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'analise_inicial', null, now() - interval '180 days'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'desenvolvimento', null, now() - interval '120 days'),
  ('bbbbbbbb-0000-4000-8000-000000000003', 'cadastro', null, now() - interval '400 days'),
  ('bbbbbbbb-0000-4000-8000-000000000003', 'analise_inicial', null, now() - interval '380 days'),
  ('bbbbbbbb-0000-4000-8000-000000000003', 'desenvolvimento', null, now() - interval '300 days'),
  ('bbbbbbbb-0000-4000-8000-000000000003', 'validacao', 'Validação por organismo independente', now() - interval '150 days');

-- Interesse de empresa ---------------------------------------------------------------
insert into public.interests (id, project_id, company_id, status, message, proposed_volume)
values (
  'cccccccc-0000-4000-8000-000000000001',
  'bbbbbbbb-0000-4000-8000-000000000002',
  '33333333-3333-4333-8333-333333333333',
  'em_negociacao',
  'Temos interesse em apoiar a validação em troca de prioridade na compra dos créditos que vierem a ser emitidos.',
  null
);

insert into public.interest_messages (interest_id, author_id, body, created_at) values
  ('cccccccc-0000-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333',
   'Olá, Ana! Podemos conversar sobre o cronograma da validação?', now() - interval '3 days'),
  ('cccccccc-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222',
   'Claro! A previsão é concluir a validação no próximo trimestre.', now() - interval '2 days');
