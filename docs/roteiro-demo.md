# Roteiro da demonstração

Jornada completa do MVP, em 7 passos (documento de concepção, seção 10). Use os usuários do seed (senha `verdagro-demo`) ou o modo demonstração.

| # | Passo | Quem | Onde clicar | O que mostrar |
|---|---|---|---|---|
| 1 | Cadastro | Produtor | *Nova propriedade* → desenhar no mapa (ou "Usar polígono da fazenda demonstrativa") | Área calculada em tempo real, práticas com ano de início |
| 2 | Diagnóstico | Produtor | Propriedade → **Gerar diagnóstico** | Satélite + clima + IA; práticas, oportunidades, documentos; aviso de caráter preliminar |
| 3 | Projeto | Produtor | Cadastro de projeto + evidências | Prática, área, metodologia de referência, anexos |
| 4 | Marketplace | — | *Marketplace* | Projeto aparece com estágio (tracejado = estimativa) |
| 5 | Empresa | Empresa | *Marketplace* → filtros → projeto | Localização aproximada, linha do tempo, "nenhum crédito emitido" |
| 6 | Negociação | Empresa | **Manifestar interesse** | Mensagem e volume de referência |
| 7 | Resultado | Produtor | *Painel* | "Interesses recebidos" com a mensagem da empresa |

## Falas-chave para a banca

- "A IA **não calcula carbono**: ela interpreta indicadores que a plataforma calcula e mostra o que precisa ser comprovado."
- "Tracejado é estimativa; sólido é crédito emitido. O banco de dados impede crédito antes da emissão."
- "A empresa nunca vê o mapa exato da fazenda, só a região."
- "Se uma API cair na hora, a plataforma continua com dados demonstrativos identificados."

## Checklist da véspera

- [ ] Projeto Supabase de produção **ativo** (o plano gratuito pausa após 7 dias sem uso)
- [ ] `npm run db:verificar` passando no ambiente local
- [ ] Variáveis na Vercel: Supabase, Copernicus, Anthropic
- [ ] Diagnóstico da Fazenda Boa Vista gerado uma vez com satélite e IA reais (fica salvo)
- [ ] Cota do Copernicus com saldo no mês
- [ ] Testar o roteiro completo no notebook **e** no celular
- [ ] Plano B: rodar `npm run dev` local em modo demonstração
