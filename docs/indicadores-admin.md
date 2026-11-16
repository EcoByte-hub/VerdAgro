# Indicadores administrativos

A issue #14 é atendida em `/admin`. A página exige o papel `admin`, e a função SQL
`indicadores_admin()` recusa os demais papéis mesmo em chamadas diretas à API.
Ela usa as permissões da sessão e mantém as políticas RLS das tabelas.

## Definições

| Indicador | Critério |
| --- | --- |
| Produtores | Perfis com papel `produtor`, inclusive sem propriedade. |
| Propriedades | Todas as propriedades cadastradas. |
| Hectares cadastrados | Soma de `properties.area_ha`, calculada pelo PostGIS. Cada propriedade entra uma vez, mesmo com vários projetos. Não é uma estimativa de carbono. |
| Projetos | Todos os projetos, publicados ou privados. |
| Empresas | Perfis com papel `empresa`, inclusive sem interesse enviado. |
| Interesses | Todas as manifestações, independentemente do status. |
| Projetos em validação | Estágio **atual** igual a `validacao`. Eventos antigos não entram. |
| Créditos emitidos | Soma de `issued_credits` somente em `emissao_creditos` e `comercializacao`, em tCO₂e. Campos nulos somam zero. |

O volume estimado fica separado, com o selo tracejado e a indicação **Não disponível**:
o modelo atual não armazena estimativas de carbono. Diagnósticos e volumes propostos
em interesses não entram nos créditos emitidos.

Os totais são consultados a cada acesso ou clique em **Atualizar indicadores**,
sem cache compartilhado entre sessões. Uma falha exibe indisponibilidade, sem
substituir os valores por zeros ou dados demonstrativos.

No modo demonstração, o painel agrega o catálogo em memória e identifica essa origem.
Com Supabase, os totais incluem os registros demonstrativos existentes no banco,
com selo e aviso quando há propriedades marcadas como `is_demo`.

## Banco e validação

Aplique a migration `20261115160000_indicadores_admin.sql` no ambiente de destino
antes de disponibilizar o painel. A validação desta entrega usou apenas o banco local.

Foram executados `npm run check` (35 testes), `npm run build`, `npm run db:reset`,
`npm run db:verificar` e `npm run db:tipos`. Os casos de RLS da issue estão em
`scripts/verificar-indicadores-admin.mjs`, chamados por `db:verificar`.
Eles cobrem a consulta pelo admin, a recusa dos outros papéis, projetos privados,
hectares sem duplicação, validação atual, créditos fracionários e atualização após
inserções e remoções. Também foi conferido que um banco sem registros de negócio
retorna zeros, em uma transação revertida ao final.

Validação visual com Chromium/Playwright em `http://127.0.0.1:3000/admin`:
login real com usuários do seed, atualização de estágio e créditos no banco,
falha da RPC, recuperação e tentativas de acesso de produtor, empresa e anônimo.
Viewports: 390, 640, 1024, 1280 e 1440 px. Sem rolagem horizontal ou erros JavaScript.
O modo demonstração também foi navegado em `http://127.0.0.1:3001/admin`, em
390 e 1440 px. Screenshots temporários dos dois modos e dos estados de erro foram
inspecionados em `/tmp/verdagro-admin-*.png`, fora do repositório.

## Integração com a main — 16/11/2026

A branch foi atualizada com a main oficial (`fa9fa80`). O conflito em
`scripts/verificar-rls.mjs` foi resolvido preservando os testes de interesses e a
chamada dos testes administrativos. Os testes de agregados passaram a comparar
os totais com os registros atuais, com paginação, sem exigir as quantidades do seed.

Validação da integração: `npm run check` (48 testes), `npm run build` e
`npm run db:verificar` (45 verificações). O script de RLS também passou com
1.001 projetos temporários adicionais e créditos fracionários. As fixtures foram
removidas ao final e as quantidades originais do banco foram preservadas.
As migrations pendentes foram aplicadas apenas no Supabase local, sem reset.

O Chromium navegou em `http://127.0.0.1:3100/admin` nos viewports de 390, 640,
1024, 1280 e 1440 px. Foram conferidos login de admin, atualização dos indicadores,
falha da RPC, recuperação e bloqueio de produtor, empresa e anônimo. Sem overflow
horizontal ou erros JavaScript. As capturas `/tmp/verdagro-14-integracao-*.png`
foram inspecionadas fora do repositório.
