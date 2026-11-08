# Arquitetura

## Visão geral

```
Navegador ──► Vercel (Next.js 16)
               ├─ proxy.ts ............ renova sessão Supabase e protege rotas
               ├─ Server Components ... páginas (lêem dados via lib/dados)
               ├─ Server Actions ...... login, cadastro, propriedade, diagnóstico, interesse
               └─ lib/diagnostico/gerar.ts
                    ├─ lib/satelite/copernicus.ts ──► Copernicus Statistical API (NDVI Sentinel-2)
                    ├─ lib/clima/nasa-power.ts ─────► NASA POWER (clima)
                    ├─ indicadores.ts (cálculo determinístico)
                    └─ ia.ts ───────────────────────► Claude API (saída estruturada)
               │
               ▼  @supabase/ssr (cookies)
            Supabase: Postgres + PostGIS · Auth · Storage · RLS
```

Cada integração externa tem **reserva demonstrativa**: se a variável de ambiente não existir ou a API falhar, o fluxo continua com dados identificados como demonstrativos ([ADR 0006](adr/0006-modo-demonstracao.md)).

## Fluxo do Diagnóstico Inteligente

1. O produtor clica em **Gerar diagnóstico** na página da propriedade.
2. A server action `executarDiagnostico` confere o papel e carrega a propriedade (RLS).
3. `gerarDiagnostico` busca, em paralelo, a série mensal de NDVI do polígono e o clima do centróide.
4. `calcularIndicadores` transforma os dados em números simples (NDVI médio, pico, seca, meses de solo exposto, chuva...).
5. A IA recebe **apenas** dados informados + indicadores e devolve JSON validado pelo schema Zod.
6. O resultado é salvo em `diagnostics` com a origem de cada parte (`sources`).

## Modelo de dados

```
auth.users 1─1 profiles (role: produtor | empresa | admin)
profiles   1─N properties (boundary geography Polygon, area_ha e centroid por trigger)
properties 1─N property_practices
properties 1─N diagnostics (ndvi, climate, result, sources, model)
properties 1─N projects (current_stage, is_published, issued_credits*)
projects   1─N project_stage_events (linha do tempo, gravada por trigger)
projects   1─N project_documents (arquivos no bucket "evidencias")
projects   1─N interests (empresa) 1─N interest_messages
```

\* `issued_credits` só pode ser preenchido nos estágios `emissao_creditos` ou `comercializacao` (constraint no banco).

### Views

| View | Para quê | Segurança |
|---|---|---|
| `marketplace_projects` | Projetos publicados com cidade/UF e coordenadas arredondadas | Roda como dona da view; filtra `is_published`; nunca expõe o polígono |
| `propriedades_app` | Polígono em GeoJSON e centróide lat/lng para o mapa | `security_invoker`: respeita o RLS de `properties` |

### Permissões (resumo do RLS)

| Quem | Pode |
|---|---|
| Produtor | Tudo nas próprias propriedades, diagnósticos, projetos e documentos; ver interesses nos próprios projetos |
| Empresa | Ver projetos publicados (sem polígono) e suas evidências; criar, ler e retirar os próprios interesses |
| Participantes de uma negociação | Ler o perfil da outra ponta e trocar mensagens |
| Admin | Ler tudo |
| Anônimo | Nada |

Ninguém altera o próprio `role` pela API. As regras são verificadas por `npm run db:verificar`.

## Limitações conhecidas

- **Chuva da NASA POWER** vem de modelos de satélite e tende a subestimar a precipitação em relação às estações em solo. Serve como leitura regional, não como medição da fazenda.
- **NDVI** é um índice de vigor da vegetação. Não mede carbono no solo e não substitui coleta de campo.
- **Plano gratuito do Supabase** pausa o projeto após 7 dias sem uso.
