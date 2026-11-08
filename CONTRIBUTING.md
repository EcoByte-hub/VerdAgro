# Como contribuir

## Fluxo

1. Pegue uma issue do board (a etiqueta `pessoa:` indica a sugestão de responsável).
2. Crie uma branch a partir da `main`: `feat/123-cadastro-projeto`, `fix/140-mapa-mobile`.
3. Commits pequenos e frequentes, em português, no padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/):
   `feat(produtor): ...`, `fix(mapa): ...`, `docs: ...`, `test(db): ...`, `chore: ...`
4. Rode `npm run check` antes de abrir o PR.
5. Abra o PR com `Fecha #123`, prints se mudou interface, e peça revisão do Dan.

## Regras do produto (não negociáveis)

- **Estimativa ≠ crédito.** Estimativa usa o selo/estilo tracejado (`Tag kind="estimativa"`). Crédito só existe a partir do estágio `emissao_creditos`, e o banco bloqueia o contrário.
- **A IA não calcula carbono** nem declara certificação. O schema do diagnóstico não tem esses campos; não os adicione.
- **Dado fictício sempre identificado** com `<DemoTag />`.
- **Localização exata é privada.** Empresas só veem cidade/UF e coordenadas arredondadas (`marketplace_projects`), nunca o polígono.

## Padrões de código

### Next.js 16 (App Router + Cache Components)

- Esta versão tem mudanças importantes. Antes de usar uma API nova, consulte `node_modules/next/dist/docs/`.
- `middleware.ts` agora se chama **`proxy.ts`**.
- Páginas que leem sessão, `params` ou `searchParams` seguem o padrão **shell síncrono + conteúdo em `<Suspense>`**:

```tsx
export default function Pagina({ params }: PageProps<"/rota/[id]">) {
  return (
    <Suspense fallback={<Carregando />}>
      <Conteudo params={params} />
    </Suspense>
  );
}

async function Conteudo({ params }: { params: PageProps<"/rota/[id]">["params"] }) {
  const { id } = await params;
  const sessao = await exigirPapel("produtor");
  // ...
}
```

- Server Components por padrão. `"use client"` só para interatividade (mapa, formulários com estado).
- Mutações via **Server Actions** com validação **Zod**. Arquivos `"use server"` exportam apenas funções async.
- Páginas não falam com o Supabase direto: use `src/lib/dados` (que já trata o modo demonstração).

### Banco (Supabase)

- Toda mudança de schema é uma **nova migration** em `supabase/migrations` (`npx supabase migration new nome`). Nunca edite migration já mergeada.
- Tabela nova precisa de: `enable row level security`, políticas, **`GRANT` explícito** para `authenticated` e **`REVOKE` de `anon`** (o Supabase pode conceder ALL por padrão).
- Depois de mudar o schema: `npm run db:reset && npm run db:verificar && npm run db:tipos`.
- Acrescente casos em `scripts/verificar-rls.mjs` para cada regra nova.

### Estilo

- Tokens do styleguide Terra Viva em `src/app/globals.css` (`bg-mata-900`, `text-broto`, `border-cerrado`...). Não use cores avulsas.
- Componentes base em `src/components/ui`.
- Textos da interface em português do Brasil, frases curtas.
- Teste no mobile (390 px).

### Testes

- Lógica pura (cálculos, clientes de API, schema) tem teste em Vitest ao lado do arquivo: `arquivo.test.ts`.
- Chamadas externas nos testes são sempre mockadas.
