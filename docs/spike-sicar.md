# Spike: integração do VerdAgro com o SICAR/CAR

**Issue:** [#23 — Pendências no CAR](https://github.com/EcoByte-hub/VerdAgro/issues/23)  
**Status:** pesquisa concluída; integração não implementada  
**Data da pesquisa:** 15/11/2026

## Objetivo

Avaliar se dados públicos do Sistema Nacional de Cadastro Ambiental Rural (SICAR) podem complementar o diagnóstico do VerdAgro, relacionar o polígono desenhado pelo produtor ao imóvel declarado no CAR e alertar sobre situações que exijam atenção documental.

## Conclusão executiva

**Viável como sinalização preliminar e fluxo assistido pelo produtor; não viável, com as fontes públicas identificadas, como validação automática completa e autoritativa de pendências por imóvel.**

Os dados abertos e serviços geoespaciais podem subsidiar cruzamentos espaciais. Para uma confirmação robusta de identidade e situação atual, a fonte mais promissora é a API do SICAR via Conecta gov.br, mas seu acesso é direcionado a órgãos públicos e depende de adesão, credenciais e configuração de acesso. O demonstrativo detalhado, histórico de notificações e documentos pendentes são acessados pelo proprietário, possuidor ou representante legal na Central do Proprietário/Possuidor. Portanto, a primeira entrega recomendada é permitir ao produtor informar o código CAR e anexar demonstrativo atualizado, apresentando o resultado como informado pelo documento e nunca como decisão do VerdAgro.

## Fontes, cobertura, formato e acesso

| Fonte | O que oferece | Formato / acesso | Limite para o VerdAgro |
|---|---|---|---|
| [Dados abertos do CAR (catálogo oficial)](https://www.gov.br/governodigital/pt-br/infraestrutura-nacional-de-dados/territoriais/bases-e-sistemas/sicar) | Imóveis por município e UF, sobreposições e temas ambientais | Dados e metadados; download no catálogo oficial | É necessário conferir atualização, granularidade, campos e licença de cada recurso antes de ingestão. Um retrato agregado/territorial não substitui o demonstrativo individual atualizado. |
| [GeoServer do SICAR](https://geoserver.car.gov.br/geoserver/web/) | Camadas públicas geoespaciais do CAR | Serviços geoespaciais; referências oficiais indicam JSON e Shapefile | Investigar capacidades/camadas e limites de consulta. Disponibilidade pública não garante SLA, estabilidade de endpoint ou cobertura homogênea por UF. |
| [APIs SICAR no Conecta gov.br](https://www.gov.br/conecta/catalogo/apis/api-sicar-demonstrativo) | Dados do imóvel e demonstrativo, incluindo situação, geometria e informações ambientais | REST/JSON; endpoints de produção e homologação | Acesso documentado para órgãos públicos federal, estadual e municipal, mediante adesão, chaves e possível liberação de IP no gateway. Não presumir acesso para uma plataforma privada. |
| [Consulta Pública do CAR](https://consulta.car.gov.br/) | Consulta e downloads públicos do SICAR | Portal web | Útil para validação manual e descoberta; não tratar como API automatizável sem contrato/documentação estável. |
| [Central do Proprietário/Possuidor](https://car.gov.br/#/central/acesso) | Demonstrativo, ficha do imóvel, notificações, documentos pendentes e geometria/arquivo do cadastro | Acesso autenticado pelo titular/representante; documentos e arquivo `.car` | Não automatizar login, coleta de credenciais ou raspagem. O titular pode fornecer o demonstrativo/arquivo ao VerdAgro voluntariamente. |
| [Meu Imóvel Rural](https://meuimovelrural.gov.br/) | Consulta de CAR, download de recibo, demonstrativo e geometria | Conta gov.br do titular; documentos/arquivos para download | Alternativa assistida para o produtor obter documentos; não é uma API pública para consulta de terceiros. |

### Licença e proteção dos dados

A página de catálogo do SICAR aponta APIs e dados abertos, mas isso **não basta para inferir uma licença uniforme de reutilização para todos os arquivos, camadas e atributos**. O catálogo do Painel da Regularização Ambiental Rural declara licença Creative Commons Atribuição; essa licença não deve ser generalizada a outros recursos SICAR. Antes de armazenar ou redistribuir geometrias/atributos, registrar a licença e os termos específicos do dataset/serviço utilizado.

Dados de identificação pessoal e atributos restritos não devem ser coletados do endpoint público nem expostos no marketplace. O MVP deve pedir apenas o código CAR e documentos estritamente necessários, com consentimento, acesso limitado ao produtor e política de retenção definida. Não pedir senha gov.br.

## Cruzamento espacial proposto

1. Usar o polígono `properties.boundary` já armazenado no PostGIS e a geometria pública do SICAR quando a camada e o endpoint permitirem consulta por área/localidade.
2. Normalizar as geometrias para SRID conhecido e válido; rejeitar geometria inválida ou vazia e trabalhar em projeção apropriada para área/medidas.
3. Consultar candidatos por bounding box/localidade e calcular interseção no PostGIS (`ST_Intersects`/`ST_Intersection`). Não baixar a base nacional inteira para cada diagnóstico.
4. Apresentar métricas explicáveis: percentual do polígono desenhado coberto pelo CAR, percentual do CAR coberto pelo desenho, diferença de área e quantidade de candidatos/sobreposições. Evitar um único limiar de “correspondência” até validar dados reais em diferentes UFs.
5. Se houver um código CAR declarado pelo titular, usá-lo para restringir/confirmar o candidato, nunca para revelar dados pessoais. Se não houver candidato, houver múltiplos ou o serviço estiver indisponível, informar “não foi possível confirmar” em vez de “não possui CAR”.
6. Guardar origem, data/hora da consulta, versão/camada, licença, métricas e status de falha; permitir atualização e não apresentar dado antigo como situação atual.

**Limite essencial:** um polígono de CAR é uma declaração cadastral. Sobreposição, divergência de área ou coincidência geométrica não prova propriedade, posse, limite fundiário, regularidade ambiental ou elegibilidade para projeto de carbono. O próprio CAR não substitui licença ou autorização ambiental.

## Alertas possíveis no diagnóstico

- **Documento ausente:** solicitar ao produtor recibo do CAR e, quando disponível, demonstrativo recente. O recibo confirma inscrição, mas não aprovação da análise nem regularidade ambiental.
- **Situação declarada no demonstrativo:** mostrar ativo, pendente ou cancelado, com condição/data que constarem do documento/API autorizada. “Ativo” não significa análise concluída sem pendências.
- **Análise com pendências / notificação / documentos pendentes:** só sinalizar quando constar do demonstrativo ou documento enviado pelo titular. Orientar consulta à Central e ao órgão estadual competente; não inferir pendência específica pelo polígono.
- **Divergência espacial:** informar que o desenho do VerdAgro diverge/sobrepõe parcialmente a geometria declarada, apresentar percentuais e pedir confirmação do produtor. Não declarar fraude ou irregularidade.
- **Camada desatualizada, indisponível ou sem resultado:** classificar como “sem confirmação na fonte consultada”, não como CAR inexistente ou regular.

Texto fixo recomendado: “Esta verificação é informativa e baseada em dados declarados/consultados em [data]. Não é análise oficial do CAR, certificação ambiental, licença, prova de propriedade ou parecer sobre elegibilidade para créditos de carbono.”

## Viabilidade por escopo

| Escopo | Viabilidade | Condições |
|---|---|---|
| Linkar o produtor à consulta pública e pedir recibo/demonstrativo | Alta | Fluxo simples, consentimento e upload privado com validação de tipo/tamanho. |
| Extrair status/data de demonstrativo enviado | Média | Definir formato de documento, extração revisável e confirmação explícita pelo produtor; nunca confiar cegamente em OCR. |
| Cruzar desenho com camada pública por município/UF | Média | Prova técnica do GeoServer/dataset, cobertura local, CRS, atualização, limite de uso e qualidade geométrica. |
| Consultar status e geometria por código CAR em integração de produção | Baixa sem parceria; alta após autorização | Adesão ao Conecta gov.br por ente público elegível, credenciais, autorização de finalidade e suporte operacional. |
| Consultar notificações e documentos privados do titular sem ação dele | Não recomendada | Exige acesso autenticado do titular/representante; não coletar credenciais nem automatizar a Central. |

## Próximos passos

1. **Produto:** decidir se o MVP será assistido por documentos (recomendado) ou se há parceiro público para integração via Conecta.
2. **Pesquisa de dados:** selecionar uma UF de teste; inspecionar catálogo, metadados, licença, data, CRS, atributos e cobertura das camadas do GeoServer/dados abertos.
3. **Spike técnico espacial:** com geometrias de teste públicas e não sensíveis, consultar um município, validar `ST_Intersects`/`ST_Intersection`, geometrias inválidas, sobreposições múltiplas e custo/tempo de resposta.
4. **Acesso à API:** contatar a Diretoria de Cadastro Ambiental Rural (`dicar@gestao.gov.br`) e verificar elegibilidade, requisitos de acesso e finalidade para eventual parceria com órgão público.
5. **Privacidade e segurança:** definir base legal/consentimento, retenção, controle de acesso, trilha de auditoria e tratamento de documentos; não armazenar CPF/CNPJ se desnecessário.
6. **Produto e linguagem:** revisar com especialista ambiental as regras e textos de alerta antes de expor qualquer interpretação de pendência.
7. **Implementação futura:** criar adaptador de fonte SICAR separado do gerador de diagnóstico atual, com timeout, cache com data de consulta, origem explícita e fallback “não confirmado”.

## Referências oficiais

- [Catálogo SICAR — Governo Digital](https://www.gov.br/governodigital/pt-br/infraestrutura-nacional-de-dados/territoriais/bases-e-sistemas/sicar) — dados abertos e catálogo de APIs.
- [API SICAR — Imóvel (Conecta gov.br)](https://www.gov.br/conecta/catalogo/apis/sicar-imovel) — endpoints, campos e requisitos de acesso.
- [API SICAR — Demonstrativo (Conecta gov.br)](https://www.gov.br/conecta/catalogo/apis/api-sicar-demonstrativo) — situação, dados ambientais e polígono do imóvel.
- [Acompanhamento do CAR — gov.br](https://www.gov.br/car/pt-br/assuntos/etapas-do-car-e-regularizacao-ambiental/acompanhamento) — competências de análise e situações do cadastro.
- [Módulos do SICAR — gov.br](https://www.gov.br/car/pt-br/assuntos/o-que-e-o-sicar/modulos-do-sicar) — demonstrativo, notificações, restrições e limitações do recibo.
- [Perguntas frequentes: retificação e análise — gov.br](https://www.gov.br/car/pt-br/canais_atendimento/perguntas-frequentes/retificacao-de-car-e-acompanhamento-da-inscricao-e-da-analise) — Central, notificações, arquivos e bases de referência.
- [Inscrição no CAR — gov.br](https://www.gov.br/car/pt-br/assuntos/etapas-do-car-e-regularizacao-ambiental/inscricao-no-car) — recibo, protocolo e ressalvas legais.
- [Meu Imóvel Rural — MGI](https://www.gov.br/gestao/pt-br/assuntos/meu-imovel-rural/como-funciona-1/visualizar-dados-e-baixar-documentos-de-imoveis-rurais/) — documentos e geometria disponíveis ao titular.
- [Painel da Regularização Ambiental Rural — dados.florestal.gov.br](https://dados.florestal.gov.br/pt_BR/dataset/painel-da-regularizacao-ambiental-rural) — licença CC BY deste conjunto específico.
