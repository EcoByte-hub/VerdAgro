# Estudo técnico: stack do VerdAgro

> Objetivo: escolher tecnologias **viáveis para um hackathon** (time pequeno, poucas semanas, custo zero) que entreguem a jornada completa da demo e, principalmente, o **Diagnóstico Inteligente da Propriedade**.

## 1. Critérios de decisão

| Critério | Peso | Por quê |
|---|---|---|
| **Tempo até a primeira demo** | Alto | Prazo de hackathon. Preferimos serviços prontos a infraestrutura própria. |
| **Custo zero no plano gratuito** | Alto | Sem orçamento. Tudo precisa caber em *free tiers*. |
| **Familiaridade do time** | Alto | O time domina React/TypeScript. Uma linguagem só reduz troca de contexto. |
| **Risco técnico baixo ou testável cedo** | Alto | O que impressiona a banca (mapa + satélite + IA) também é o que tem mais incerteza. |
| **Um único deploy** | Médio | Menos peças para quebrar no dia da apresentação. |
| **Caminho de evolução** | Médio | A arquitetura não pode travar o produto depois do hackathon. |

## 2. Requisitos que a stack precisa atender

Extraídos do documento de concepção e do roteiro da demo:

1. **Dois perfis** (produtor rural e empresa compradora) com autenticação e permissões diferentes.
2. **Cadastro de propriedade com polígono no mapa**, área em hectares calculada.
3. **Dados de vegetação reais** (NDVI) para o polígono, a partir de satélite.
4. **Dados climáticos** da localização.
5. **Diagnóstico por IA** com saída estruturada, **sem inventar estimativas de carbono** e sem declarar projetos como certificados.
6. **Projetos com documentos/evidências** (upload de arquivos).
7. **Marketplace** com filtros (localização, cultura, tipo de projeto).
8. **Manifestação de interesse e negociação** entre os dois lados.
9. **Linha do tempo** de 8 estágios por projeto, separando estimativa de crédito certificado.
10. **Painel administrativo** simples.

## 3. Avaliação por camada

### 3.1 Frontend e servidor de aplicação

| Opção | Prós | Contras | Veredito |
|---|---|---|---|
| **Next.js (App Router) + React + TypeScript** | Front e back no mesmo projeto; *route handlers* e *server actions* guardam segredos (chaves de IA e satélite); deploy nativo na Vercel; o time já usa React | Curva do App Router (Server vs Client Components) | ✅ **Escolhido** |
| Vite + React (SPA) | Simples e rápido; já usado na landing page | Precisaria de um backend separado para esconder as chaves de IA e satélite | ❌ Duas peças para manter |
| Remix / React Router v7 | Bom modelo de dados | Menos material e exemplos com Supabase SSR | ❌ |

**Estilo:** Tailwind CSS v4 com os tokens do styleguide **Terra Viva** (o mesmo da landing page), para a plataforma ter a mesma identidade. Componentes próprios e enxutos (Button, Card, Tag, Input), sem uma biblioteca de UI pesada.

### 3.2 Backend, banco e autenticação

| Opção | Prós | Contras | Veredito |
|---|---|---|---|
| **Supabase** (Postgres + PostGIS + Auth + Storage + RLS) | SQL de verdade; **PostGIS** para geometria das propriedades; Auth e Storage prontos; RLS separa produtor/empresa no próprio banco; plano gratuito | Projeto gratuito **pausa após 7 dias sem uso**; 500 MB de banco | ✅ **Escolhido** |
| Firebase | Muito rápido para começar | NoSQL, sem consultas geoespaciais decentes nem relações; regras de segurança menos expressivas para o nosso modelo | ❌ |
| API própria (Node/Nest + Postgres) | Controle total | Construir auth, upload e permissões do zero consome o hackathon | ❌ |

**Cuidados com o Supabase:**
- **Pausa por inatividade:** manter uso semanal (CI de *smoke test* ou acesso manual) e verificar o projeto na véspera da apresentação.
- **Permissões explícitas:** projetos novos exigem `GRANT` explícito para o PostgREST acessar tabelas. As migrations já incluem os `GRANT`s, além das políticas de RLS.
- Limites do plano gratuito: 500 MB de banco e 2 projetos ativos por conta. Suficiente para a demo.

### 3.3 Mapas e desenho do polígono

| Opção | Prós | Contras | Veredito |
|---|---|---|---|
| **MapLibre GL JS + Terra Draw** | Open source, sem token nem cobrança; WebGL fluido; Terra Draw tem adaptador oficial para MapLibre e é mantido ativamente | Integração com React é manual (um componente cliente) | ✅ **Escolhido** |
| Mapbox GL | Excelente qualidade | Exige token e cartão; `mapbox-gl-draw` sem manutenção ativa | ❌ |
| Leaflet + Leaflet.draw | Simples, muito conhecido | Visual mais datado; desenho e camadas raster menos fluidos | Plano B |

**Mapa base:** imagens de satélite com atribuição (por exemplo, Sentinel-2 cloudless da EOX ou Esri World Imagery). A licença de cada provedor deve ser conferida antes da demo pública (issue dedicada).

**Área em hectares:** calculada no cliente com `@turf/area` (precisão suficiente para cadastro) e conferida no banco com `ST_Area(geography)`.

### 3.4 Dados de vegetação (satélite)

| Opção | Prós | Contras | Veredito |
|---|---|---|---|
| **Copernicus Data Space Ecosystem: Statistical API (Sentinel-2 L2A)** | Gratuito (cota mensal de *processing units*); devolve **série temporal de NDVI já agregada por polígono**, sem baixar imagens; resolução de 10 m | Exige conta e cliente OAuth; cota limitada | ✅ **Escolhido** |
| Google Earth Engine | Muito poderoso | Cadastro com aprovação, uso não comercial, curva alta, outra linguagem (JS/Python do GEE) | ❌ Etapa futura |
| Baixar cenas Sentinel-2 e processar (Python/rasterio) | Controle total | Pesado, lento, outra stack e outro deploy | ❌ |

**Estratégia para a cota:** o NDVI é calculado **uma vez por diagnóstico** e salvo no banco. A propriedade demonstrativa tem uma série **pré-calculada** como plano B, caso a API esteja fora do ar ou sem cota na hora da apresentação.

### 3.5 Dados climáticos

**NASA POWER** (comunidade *AG*, agroclimatologia): gratuito e **sem chave de API**. Testado durante este estudo: uma chamada mensal de `T2M` (temperatura) e `PRECTOTCORR` (precipitação) para Rio Verde/GO respondeu corretamente. ✅ **Escolhido**.

### 3.6 Inteligência artificial (diagnóstico)

| Opção | Prós | Contras | Veredito |
|---|---|---|---|
| **API de LLM com saída estruturada (Claude, via `@anthropic-ai/sdk`)** | Resposta validada contra um schema Zod; boa qualidade em português; chamada única (sem agente) | Custo por chamada; depende de chave | ✅ **Escolhido** |
| Modelo estatístico próprio (scikit-learn) | Explicável | Sem dados rotulados de carbono no Brasil para treinar; outra stack | ❌ |
| Regras fixas (*if/else*) | Previsível | Não interpreta o histórico descrito pelo produtor; pouco impacto na banca | Plano B |

**Guarda-corpos (exigência do documento):**
1. A IA **não calcula carbono**. Ela recebe indicadores já calculados pelo nosso código (área, NDVI, clima) e só **interpreta e recomenda**.
2. O schema de saída **não tem campo** para toneladas de CO₂ ou créditos. Se não existe no schema, não aparece na tela.
3. Toda recomendação sai marcada como **preliminar**. O texto de aviso é fixo, escrito no código, e não gerado pela IA.
4. O prompt proíbe afirmar certificação e manda listar o que **precisa ser comprovado**.
5. Se a chave não estiver configurada, o sistema usa um **diagnóstico demonstrativo** fixo. A demo nunca quebra por falta de IA.

### 3.7 Infraestrutura e qualidade

| Item | Escolha |
|---|---|
| Deploy | **Vercel**, conectada ao GitHub (preview por PR) |
| Validação | **Zod** (formulários, APIs externas e saída da IA) |
| Testes | **Vitest** para a lógica pura (cálculos geográficos, clientes de API, schema do diagnóstico) |
| Lint/format | ESLint (padrão do Next.js) + Prettier |
| CI | GitHub Actions: lint, typecheck, testes e build em cada PR |

## 4. Stack final

```
┌────────────────────────── Vercel ──────────────────────────┐
│ Next.js (App Router) · React · TypeScript · Tailwind v4    │
│  ├─ UI: MapLibre GL + Terra Draw, componentes Terra Viva   │
│  └─ Servidor: route handlers / server actions              │
│       ├─ Copernicus Statistical API → NDVI do polígono     │
│       ├─ NASA POWER → clima                                │
│       └─ Claude API (saída estruturada) → diagnóstico      │
└───────────────┬────────────────────────────────────────────┘
                │ supabase-js (@supabase/ssr)
┌───────────────▼────────────────────────────────────────────┐
│ Supabase: Postgres + PostGIS · Auth · Storage · RLS        │
└────────────────────────────────────────────────────────────┘
```

## 5. O que fica **fora** do MVP (decisões conscientes)

- Pagamentos e liquidação financeira.
- Integração com registros e certificadoras (Verra etc.).
- Cálculo técnico de emissões e remoções (exige metodologia e verificação).
- Google Earth Engine, processamento próprio de imagens e Python.
- Blockchain/tokenização.
- App mobile nativo (a web será responsiva).

## 6. Riscos e mitigação

| Risco | Prob. | Impacto | Mitigação |
|---|---|---|---|
| Cota do Copernicus esgotar ou API instável na apresentação | Média | Alto | NDVI salvo no banco; série pré-calculada da fazenda demo |
| Supabase pausado por inatividade | Média | Alto | Uso semanal + checklist da véspera |
| IA lenta ou fora do ar na apresentação | Baixa | Alto | Diagnóstico demo de reserva; resultado salvo e reaproveitado |
| Licença do mapa base de satélite | Baixa | Médio | Issue para conferir; atribuição visível no mapa |
| Curva do App Router para quem tem menos experiência | Média | Médio | Padrões documentados no `CONTRIBUTING.md`; revisão de PR pelo líder |
| Escopo crescer além do roteiro da demo | Alta | Alto | Milestones seguem os 7 passos da demo; o resto vai para o backlog |

## 7. Provas de viabilidade (spikes)

| Spike | Pergunta | Status |
|---|---|---|
| NASA POWER | Conseguimos clima sem chave para um ponto? | ✅ Validado: chamada real usada no diagnóstico |
| Supabase + PostGIS + RLS | Schema, área por trigger e permissões funcionam? | ✅ Validado no Supabase local (21 verificações automáticas) |
| Terra Draw + MapLibre no React | Desenho do polígono funciona? | ✅ Validado no desktop; falta testar no celular |
| Fluxo ponta a ponta | Login → diagnóstico → propriedade → interesse → painel | ✅ Validado contra o Supabase local |
| Copernicus Statistical API | Série mensal de NDVI para um polígono de 200 ha dentro da cota? | ⏳ Cliente implementado e testado com mocks; falta validar com credenciais reais |
| Claude com saída estruturada | O diagnóstico respeita o schema e os guarda-corpos? | ⏳ Módulo implementado e testado; falta validar com chave real e avaliar respostas |

## 8. Referências

- Copernicus Data Space Ecosystem: Sentinel Hub (cotas e APIs): https://dataspace.copernicus.eu/
- Sentinel Hub Statistical API: https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Statistical.html
- NASA POWER API: https://power.larc.nasa.gov/docs/services/api/
- Supabase, preços e limites: https://supabase.com/pricing
- MapLibre GL JS: https://maplibre.org/
- Terra Draw: https://terradraw.io/
- Claude API, saída estruturada: https://platform.claude.com/docs/
- Documento de concepção do VerdAgro (equipe EcoByte)
