# Avanço de estágio com registro na linha do tempo — issue #10

Escopo confirmado pelo responsável: o produtor avança o estágio do próprio projeto pela plataforma,
em ordem, com nota registrada na linha do tempo. Hoje os estágios só mudam pelo seed.

## Regra de quem pode avançar (decisão)

- **Quem**: apenas o dono do projeto (`projects.owner_id = auth.uid()`). A verificação independente
  continua sendo narrada pelo produtor com a nota (ex.: "Validação contratada com organismo X"),
  que é o fluxo da demo — o selo de "verificação" vem do tipo do estágio, não de quem clica.
  Admin não avança pela interface; o seed continua definindo estágios iniciais de projetos demo.
- **Ordem**: a RPC calcula sempre o PRÓXIMO estágio da sequência fixa dos 8 — não existe caminho
  para pular nem voltar. O último estágio (`comercializacao`) não tem botão.
- **Nota**: opcional até "desenvolvimento" (estimativas); obrigatória a partir de "validação"
  (estágios de verificação e certificação), com no máximo 500 caracteres. A nota fica no evento
  da linha do tempo, que já exibe data e nota.
- **Créditos**: a constraint do banco (`projects_credits_only_when_issued`) continua sendo a garantia
  de que `issued_credits` só existe a partir de `emissao_creditos`.

## Implementação

- Nova migration `20261128120000_avancar_estagio.sql` com a RPC
  `public.avancar_estagio(p_projeto uuid, p_nota text)`, `security definer` com `search_path` vazio:
  valida o dono, calcula o próximo, exige a nota quando o destino é verificação/certificação,
  atualiza `current_stage` (o trigger `log_project_stage` cria o evento) e anexa a nota ao evento
  criado — tudo numa transação.
- A camada `src/lib/dados` ganha `avancarEstagioProjeto`, que chama a RPC; a mensagem de erro da
  RPC é legível e vai direto para o formulário.
- Action `avancarEstagio` (Server Action + Zod) e componente `AvancarEstagio` no card de
  Rastreabilidade da página do projeto (visão do dono), com nota obrigatória marcada na interface.
- Regra testada no `db:verificar`: avanço em ordem sem nota, exigência de nota na validação, nota
  gravada no evento, e recusa para outro produtor e para a empresa.

Sem alteração de schema existente, pagamentos ou chamadas externas. A entrega terá commit e branch
próprios, seguida de comentário e fechamento da issue após a validação.
