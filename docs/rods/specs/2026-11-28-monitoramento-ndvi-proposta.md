# Monitoramento contínuo do NDVI com alertas — issue #24

Proposta técnica para etapa futura: rotina mensal de NDVI para propriedades com projeto ativo,
histórico em série de vários anos e alerta de queda brusca de vegetação. Entrega desta issue:
proposta considerando a cota do Copernicus — números de consumo dependem da medição da issue #2
(Spike Copernicus), marcada abaixo como entrada pendente.

## Rotina (cron mensal)

- **Gatilho**: GitHub Action agendada (`schedule: cron`) no dia 5 de cada mês, chamando uma rota
  de serviço protegida (`CRONS_TOKEN`, mesmo padrão já usado no time para rotinas). GitHub Actions
  evita depender de `pg_cron` + extensão de rede no Supabase e o histórico de execuções fica
  auditável no repositório.
- **Alvo**: propriedades com projeto publicado ou em estágio ≥ `desenvolvimento` (o documento
  pede "projeto ativo"); 1 consulta Statistical API por propriedade por mês.
- **Escrita**: nova tabela `ndvi_series` (property_id, captured_month date, serie jsonb igual ao
  payload de `buscarNdvi`, fonte 'sentinel-2', created_at) — append-only, 1 linha/mês/propriedade.
  O painel lê a série completa pela camada `src/lib/dados`; o diagnóstico pontual continua como
  está (sem refetch na abertura da página, princípio do ROD do diagnóstico salvo).

## Cota do Copernicus (estimativa e medição pendente)

- Consumo por consulta: **medir na issue #2** (processing units por `buscarNdvi` no polígono
  típico). A cota gratuita do CDSE é mensal e por grupo de recursos; a proposta reserva as
  consultas do monitoramento à parte das consultas sob demanda do diagnóstico.
- Ordem de grandeza para dimensionar: 12 consultas/ano/propriedade. Com P ≈ PUs por consulta:
  - 100 propriedades ativas → 1.200 consultas/ano → 100/mês → 100 × P PUs/mês.
- **Regra de corte**: se a projeção do mês passar de 70% da cota, a rotina pula as propriedades
  sem projeto publicado (derruba primeiro o monitoramento "preventivo") e registra o pulo na
  tabela de execuções — a demo nunca depende do monitoramento para funcionar.
- MaxCloudCoverage/resolução: herdar os valores validados na issue #2; revisar no ROD do spike.

## Alerta de queda brusca (determinístico, sem IA)

- Comparação por estação seca/chuvosa: alerta quando a média dos últimos 3 meses cair mais que
  **25%** em relação à média do mesmo trimestre do ano anterior (meses-alvo no NDVI Sentinel-2
  variam por região; usar o mesmo alinhamento sazonal do `calcularIndicadores`).
- Segundo gatilho: valor do mês abaixo do **percentil 5** da série histórica da própria
  propriedade (mínimo 24 meses de série para o percentil fazer sentido).
- Alerta gravado em `ndvi_alerts` (property_id, month, tipo, delta, visto_em) e exibido no painel
  da propriedade como card amarelo/vermelho com o gráfico da série (mesma linguagem do
  GraficoNdvi). E-mail fica fora do MVP; o alerta é da plataforma.
- Nada de estimar causa (desmatamento x seca): o alerta aponta a queda e sugere o documento/
  evidência que comprove o manejo — guarda-corpo do projeto (IA não afirma certificação).

## Gráfico de vários anos

- Painel da propriedade ganha aba "Série histórica": `ndvi_series` completa (linha mensal) com
  marcações dos alertas; o card do diagnóstico continua com a série do último diagnóstico.
- Componente: reusar o GraficoNdvi com escala temporal maior (mesmo tracejado x sólido para
  separar dado do mês corrente x histórico).

## Custos e riscos

- Risco 1: cota mensal estourar em mês de muitos cadastros novos → regra de corte acima + cadastro
  de novas propriedades no monitoramento entra em fila (próximo mês).
- Risco 2: série mensal com lacunas de nuvem → guardar a série como veio (`maxCloudCoverage`
  configurado) e o alerta usa a média de 3 meses, tolerante a lacuna.
- Risco 3: rotina falha silenciosa → tabela de execuções (`ndvi_runs`) + step do GitHub Action
  falha visível; sem alerta por e-mail no MVP.

## Pendências

1. **PUs por consulta** — medido na issue #2; atualizar este documento com o número e reescrever
   a tabela de dimensionamento.
2. Definição do polígono de referência quando a propriedade tem projeto coletivo (#22) — 1
   consulta por propriedade participante ou 1 por projeto?
3. Aprovação do time para o gatilho GitHub Action x Supabase cron (o time já usa Actions para CI;
   a rota protegida segue o padrão de token de rotinas).

Sem alteração de schema aplicada, pagamentos ou chamadas externas automáticas além do cron
proposto. A implementação terá commit e branch próprios por etapa (tabela + rotina; painel;
alertas), cada uma com ROD próprio se o escopo mudar.
