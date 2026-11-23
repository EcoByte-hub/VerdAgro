# Roteiro da demonstração

Jornada completa do MVP, em 7 passos (documento de concepção, seção 10). Use os usuários do seed (senha `verdagro-demo`) ou o modo demonstração.

| # | Passo | Quem | Onde clicar | O que mostrar |
|---|---|---|---|---|
| 1 | Cadastro | Produtor | *Nova propriedade* → desenhar no mapa (ou "Usar polígono da fazenda demonstrativa") | Área calculada em tempo real, práticas com ano de início |
| 2 | Diagnóstico | Produtor | Propriedade → **Gerar diagnóstico** | Satélite + clima + IA; práticas, oportunidades, documentos; aviso de caráter preliminar |
| 3 | Projeto | Produtor | Cadastro de projeto + evidências | Prática, área, metodologia de referência, anexos |
| 4 | Marketplace | — | *Marketplace* | Projeto aparece com estágio (tracejado = estimativa) |
| 5 | Empresa | Empresa | *Marketplace* → filtros → projeto | Localização aproximada, linha do tempo, "nenhum crédito emitido" |
| 6 | Negociação | Empresa | **Manifestar interesse** (no modo demonstração, "Culturas de cobertura" já aparece com o interesse enviado: use outro projeto) | Mensagem e volume de referência; a empresa pode retirar o interesse e, se o produtor recusar, mandar uma nova proposta |
| 7 | Resultado | Produtor e empresa | *Painel* → **Abrir negociação** | Produtor inicia negociação, aceita ou recusa. Os dois participantes enviam mensagens e consultam o mesmo histórico. Use duas sessões do navegador para mostrar os dois lados |

Com o Supabase local, entre com `produtor@demo.verdagro.app` e `empresa@demo.verdagro.app` em sessões separadas. O aviso de interesse novo no painel do produtor chega em tempo real. Na conversa, use **Atualizar conversa** para buscar novas mensagens da outra ponta. A proposta inicial fica identificada no histórico; o volume é uma referência, sem compra ou pagamento no MVP.

No modo demonstração, a negociação existente pode ser consultada, mas respostas e mensagens não são gravadas. Para mostrar a troca completa, use o Supabase com os usuários do seed.

## Falas-chave para a banca

- "A IA **não calcula carbono**: ela interpreta indicadores que a plataforma calcula e mostra o que precisa ser comprovado."
- "Tracejado é estimativa; sólido é crédito emitido. O banco de dados impede crédito antes da emissão."
- "A empresa nunca vê o mapa exato da fazenda, só a região."
- "Se uma API cair na hora, a plataforma continua com dados demonstrativos identificados."

## Checklist da véspera

- [ ] Projeto Supabase de produção **ativo** (o plano gratuito pausa após 7 dias sem uso)
- [ ] Migrations aplicadas na produção (`npx supabase db push`), inclusive a do Realtime de interesses
- [ ] `npm run db:verificar` passando no ambiente local
- [ ] Variáveis na Vercel: Supabase, Copernicus, Anthropic
- [ ] Diagnóstico da Fazenda Boa Vista gerado uma vez com satélite e IA reais (fica salvo)
- [ ] Cota do Copernicus com saldo no mês
- [ ] Testar o roteiro completo no notebook **e** no celular
- [ ] Plano B: rodar `npm run dev` local em modo demonstração
