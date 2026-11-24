# Testes E2E da demonstração

Use Node 22 (`.nvmrc`). A suíte usa Playwright com Chromium em desktop (1440 × 900) e celular (390 × 844).

```bash
npm ci
npx playwright install chromium
npm run e2e
```

No Linux sem as bibliotecas do navegador, use `npx playwright install --with-deps chromium`.
Se já houver um Chromium gerenciado pelo Playwright instalado fora do projeto, é possível apontar `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` para seu executável.

O comando compila e inicia uma versão de produção em `http://127.0.0.1:3100`, executa os testes e encerra o servidor. Não reutiliza servidores existentes. O build substitui `.next`; antes de iniciar o app com integrações reais, execute `npm run build` novamente com o ambiente desejado.

## Isolamento

- O servidor força o modo demonstração com as variáveis de Supabase, Copernicus e Anthropic vazias, inclusive quando existe `.env` local.
- O preload `scripts/e2e-rede.mjs` é carregado apenas pelo servidor E2E. Ele simula indisponibilidade da NASA POWER para exercitar o fallback climático local e bloqueia as demais chamadas externas por `fetch`.
- O navegador também bloqueia requisições externas. Imagens de fundo do mapa e geocodificação não são verificadas; o polígono, a área calculada e os controles continuam reais.
- Cada teste começa com um contexto de navegador novo. O acesso usa os botões de demonstração, e a troca de perfil passa pelo logout.
- Não há conexão com banco, criação de contas, upload real nem consumo de cota de IA ou satélite. Não é necessário cadastrar segredos no GitHub.

## Cobertura do roteiro

| Passo | O que a suíte verifica |
| --- | --- |
| 1. Cadastro | Login do produtor, polígono demonstrativo, área calculada, UF e prática com ano; aviso de cadastro não persistido. |
| 2. Diagnóstico | Geração pela Server Action, resultado de fallback, origem dos dados, práticas, documentos e aviso preliminar. |
| 3. Projeto | Projeto publicado de exemplo, evidências identificadas, formulário de edição e validação de arquivo com aviso de que não foi enviado. |
| 4. Marketplace | Navegação do projeto publicado para a vitrine, localização aproximada, linha do tempo e ausência de créditos emitidos. |
| 5. Empresa | Login da empresa e filtros combinados de município, UF e prática. |
| 6. Interesse | Erro de volume inválido, volume com vírgula e confirmação explícita de interesse simulado. |
| 7. Painel | Retorno ao produtor, interesse previamente existente no catálogo, selo Novo, contador acessível e logout. |

O modo demonstração é somente leitura: o passo 3 usa um projeto já existente, e o interesse do passo 7 é o exemplo do catálogo, não uma gravação do passo 6. A criação de projeto e a persistência entre os perfis dependem do Supabase e não são afirmadas por esta suíte.

Há ainda cenários independentes para acesso anônimo, isolamento de perfis, encerramento da sessão, projeto inexistente e filtros sem resultados. Erros JavaScript e respostas 5xx locais também falham os testes. Os seletores priorizam papéis e nomes acessíveis; IDs fixos identificam somente os dados demonstrativos.

## CI e diagnóstico de falhas

A CI executa o job E2E em PRs e pushes na `main` ou em branches `codex/**`, além do job de lint, tipos, testes unitários e build. O job instala o Chromium e suas dependências e executa `npm run e2e`, sem `continue-on-error`. Falhas retornam código diferente de zero; `.only` é proibido na CI.

O artefato `playwright-report` contém o relatório HTML e, em falhas, captura de tela e trace. Retenção: sete dias. Arquivos locais em `playwright-report/` e `test-results/` são ignorados pelo Git e pelo ESLint.

```bash
npx playwright show-report
npx playwright show-trace test-results/<cenario>/trace.zip
```

Referências: [Playwright na CI](https://playwright.dev/docs/ci) e [servidor dos testes](https://playwright.dev/docs/test-webserver). O setup também segue o guia de Playwright incluído em `node_modules/next/dist/docs/01-app/02-guides/testing/playwright.md`.

## Validação da entrega

Em 23/11/2026, a execução local com Node 22 passou nos seis cenários E2E e nos 48 testes unitários, além de lint e tipos. O comando E2E também compilou o build de produção. As execuções que tiveram asserções falhando retornaram código 1 e produziram captura, contexto e trace.

A revisão direta no Chromium conferiu `/produtor`, `/produtor/propriedades/nova`, `/produtor/propriedades/<id demonstrativo>` e `/marketplace/<id demonstrativo>` em 390 e 1440 px. Capturas temporárias do painel, polígono, diagnóstico e erro de volume foram inspecionadas; não houve rolagem horizontal nem erros JavaScript. Os exemplos de propriedade/interesse permaneceram identificados como demonstração.
