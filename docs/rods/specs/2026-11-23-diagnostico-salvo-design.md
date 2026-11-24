# Diagnóstico salvo na propriedade — issue #4

Escopo confirmado pelo responsável: mostrar o último diagnóstico salvo, com data e origem, sem nova chamada externa ao abrir a propriedade.

- Consultar somente o registro mais recente da propriedade do produtor, respeitando o RLS e a camada `src/lib/dados`.
- Reconstruir os indicadores a partir do NDVI e clima persistidos; não consultar satélite, clima ou IA na leitura.
- Exibir o resultado e a data de gravação. Com resultado disponível, o botão passa a ser **Gerar novamente**.
- Gerar outro diagnóstico continua sendo uma ação explícita; uma falha nessa ação preserva o resultado anterior.
- Manter o modo demonstração com dados identificados, sem apresentar uma gravação fictícia como persistência real.
- Cobrir mapeamento, ausência de registro, permissões, dados inválidos e demonstração em testes unitários. Validar navegação, recarga e responsividade no Chromium.

Sem alteração de schema, pagamentos ou chamadas externas automáticas. A entrega terá commit e branch próprios, seguida de comentário e fechamento da issue após a validação.

## Validação executada

- `npm run check`: lint, tipos e 64 testes aprovados, incluindo 16 novos casos de leitura e gravação.
- `npm run build` e `npm run db:verificar`: aprovados.
- Chromium em `http://127.0.0.1:3000/produtor/propriedades/<id>`: 390, 768 e 1440 px. Conferidos registro mais recente, data/origem, navegação, recarga, ausência de registro, falha de rede, registro inválido e bloqueio de acesso por outro produtor.
- Instrumentação de `fetch` no servidor confirmou que abrir/reabrir a propriedade não chamou NASA POWER, Copernicus ou Anthropic. A geração explícita foi testada com a chamada NASA bloqueada e o fallback identificado, sem consumir APIs reais.
- Modo demonstração: resultado identificado, sem data fictícia de gravação e sem chamadas às integrações ao abrir/recarregar.
- Capturas temporárias inspecionadas: `issue4-salvo-390.png`, `issue4-salvo-768.png`, `issue4-salvo-1440.png`, estados de erro e `issue4-demo-390.png`. Sem rolagem horizontal; os selos de origem quebram linha no celular. Dados temporários removidos ao final.
