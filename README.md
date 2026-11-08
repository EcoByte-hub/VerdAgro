# 🌱 VerdAgro

> Plataforma de inteligência ambiental e comercialização de créditos de carbono no agronegócio.

**Categoria:** Economia Verde · **Segmento:** AgTech + ClimateTech · **Modelo:** B2B2C
**Contexto:** projeto do squad **EcoByte** para o **HackBrasil** · Landing page: [verdagro-lp.vercel.app](https://verdagro-lp.vercel.app)

O VerdAgro conecta **produtores rurais** a **empresas interessadas em créditos de carbono**. O produtor desenha a propriedade no mapa e recebe um **Diagnóstico Inteligente** (satélite + clima + IA). A empresa encontra projetos com origem rastreável e manifesta interesse.

> ⚖️ A plataforma **não emite certificações** e **nunca confunde estimativa com crédito**: estimativa aparece tracejada, crédito certificado aparece sólido.

---

## 🚀 Rodando em 1 minuto (modo demonstração)

```bash
npm install
npm run dev
```

Abra http://localhost:3000 → **Entrar** → escolha *Produtor rural* ou *Empresa compradora*.

Sem nenhuma variável de ambiente o app roda em **modo demonstração**: dados fictícios identificados na tela, clima real da NASA POWER e NDVI/IA de reserva. Veja [ADR 0006](docs/adr/0006-modo-demonstracao.md).

## 🗄️ Rodando com banco (Supabase local)

Requer [Docker](https://www.docker.com/) rodando.

```bash
npm run db:start        # sobe o Supabase local, aplica migrations e seed
npx supabase status     # mostra a URL e a PUBLISHABLE_KEY
cp .env.example .env.local   # preencha NEXT_PUBLIC_SUPABASE_URL e ..._PUBLISHABLE_KEY
npm run dev
```

Usuários do seed (senha `verdagro-demo`):

| E-mail | Papel |
|---|---|
| `produtor@demo.verdagro.app` | Produtor (Fazenda Boa Vista, 200 ha) |
| `coop@demo.verdagro.app` | Produtor (cooperativa com projetos extras) |
| `empresa@demo.verdagro.app` | Empresa compradora |
| `admin@demo.verdagro.app` | Administrador |

Outros comandos do banco:

```bash
npm run db:reset        # recria o banco do zero (migrations + seed)
npm run db:verificar    # confere 21 regras de segurança (RLS) com os usuários do seed
npm run db:tipos        # regenera os tipos TypeScript a partir do schema
```

## 🔌 Integrações (opcionais)

| Integração | Variáveis | Sem ela |
|---|---|---|
| Supabase (banco, login, arquivos) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Modo demonstração |
| Copernicus / Sentinel-2 (NDVI) | `CDSE_CLIENT_ID`, `CDSE_CLIENT_SECRET` | Série de NDVI demonstrativa |
| Claude API (diagnóstico) | `ANTHROPIC_API_KEY` (opcional `ANTHROPIC_MODEL`) | Diagnóstico demonstrativo |
| NASA POWER (clima) | nenhuma | Fixture real de Rio Verde/GO se a API cair |

## 🧰 Stack

Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Tailwind CSS v4 · Supabase (Postgres + PostGIS, Auth, Storage, RLS) · MapLibre GL + Terra Draw · Copernicus Statistical API · NASA POWER · Claude API · Zod · Vitest · Vercel.

Por que cada escolha: [docs/estudo-tecnico.md](docs/estudo-tecnico.md) e [docs/adr](docs/adr).

## 📁 Estrutura

```
src/
├── app/
│   ├── (auth)/            # entrar, cadastro e server actions de login
│   ├── (app)/             # área logada: produtor, empresa, marketplace, admin
│   └── inicio/            # redireciona para a área de cada papel
├── components/            # ui/, app/, mapa/, diagnostico/, projeto/, propriedade/
├── lib/
│   ├── auth/              # sessão, papéis e rotas protegidas
│   ├── clima/             # NASA POWER
│   ├── satelite/          # Copernicus (NDVI)
│   ├── diagnostico/       # schema, indicadores, prompt, IA e orquestrador
│   ├── dados/             # acesso a dados (Supabase ou demo)
│   ├── demo/              # dados demonstrativos
│   ├── geo/               # polígono, área e centróide
│   └── supabase/          # clientes e tipos do banco
└── proxy.ts               # renova sessão e protege rotas
supabase/
├── migrations/            # schema, RLS, views
└── seed.sql               # dados demonstrativos
docs/                      # estudo técnico, ADRs, arquitetura, roteiro da demo
```

## ✅ Qualidade

```bash
npm run check    # lint + tipos + testes
npm run build
```

A CI (GitHub Actions) roda lint, tipos, testes e build em todo PR.

## 📚 Documentação

- [Visão do produto](docs/produto.md): problema, solução, módulos e escopo do MVP
- [Estudo técnico](docs/estudo-tecnico.md): avaliação das tecnologias
- [Arquitetura e modelo de dados](docs/arquitetura.md)
- [Roteiro da demonstração](docs/roteiro-demo.md)
- [Como contribuir](CONTRIBUTING.md)
- Styleguide **Terra Viva**: [repositório da landing page](https://github.com/EcoByte-hub/VerdAgroLP/blob/main/STYLEGUIDE.md)

---

Desenvolvido pelo squad **EcoByte** 💚
