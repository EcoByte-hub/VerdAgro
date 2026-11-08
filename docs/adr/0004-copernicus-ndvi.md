# 0004: NDVI via Copernicus Statistical API

**Status:** Aceita

## Contexto
O diagnóstico precisa de indicadores reais de vegetação, sem processar imagens de satélite nem criar uma stack Python.

## Decisão
Usar a **Statistical API do Copernicus Data Space Ecosystem** (Sentinel-2 L2A), que devolve estatísticas de NDVI agregadas por polígono e por mês. Autenticação OAuth *client credentials*, feita no servidor.

## Consequências
- Cota gratuita mensal limitada: salvar o resultado no banco e nunca recalcular a cada visualização.
- A fazenda demonstrativa tem série pré-calculada como reserva.
- Google Earth Engine fica para uma etapa futura.
