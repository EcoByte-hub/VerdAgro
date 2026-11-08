# 0005: IA com saída estruturada e guarda-corpos

**Status:** Aceita

## Contexto
O documento exige que a IA **não invente estimativas de captura de carbono** nem declare projetos como certificados.

## Decisão
- Uma única chamada ao Claude (`@anthropic-ai/sdk`) com **saída estruturada validada por Zod**.
- A IA recebe indicadores já calculados pelo nosso código e só interpreta e recomenda.
- O schema não possui campos de toneladas de CO₂ ou créditos.
- O aviso de caráter preliminar é texto fixo da interface, não gerado pela IA.
- Tratamento de `stop_reason: "refusal"` com fallback do lado do servidor.

## Consequências
- Respostas previsíveis e fáceis de exibir.
- Custo por diagnóstico; o resultado é salvo no banco e reaproveitado.
