# 0006: Modo demonstração

**Status:** Aceita

## Contexto
A apresentação não pode depender de três serviços externos funcionando ao mesmo tempo. Novos integrantes também precisam rodar o projeto sem configurar nada.

## Decisão
Quando uma integração não está configurada (variáveis de ambiente ausentes), o sistema usa **dados de reserva demonstrativos**, sempre identificados na interface como "Dados demonstrativos".

## Consequências
- `npm run dev` funciona sem nenhuma chave.
- Cada integração tem um teste que garante o caminho real e o de reserva.
- A interface sempre mostra a origem do dado (satélite, demo ou IA).
