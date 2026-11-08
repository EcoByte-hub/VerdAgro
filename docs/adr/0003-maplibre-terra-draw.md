# 0003: MapLibre GL + Terra Draw

**Status:** Aceita

## Contexto
O produtor precisa desenhar os limites da propriedade e ver camadas de vegetação. Precisamos de algo gratuito, sem token e mantido ativamente.

## Decisão
**MapLibre GL JS** para o mapa e **Terra Draw** (com `terra-draw-maplibre-gl-adapter`) para o desenho. Área calculada com `@turf/area`.

## Consequências
- Sem custo nem token.
- O mapa é um Client Component carregado dinamicamente (`ssr: false`).
- A licença do mapa base de satélite precisa ser conferida, com atribuição visível.
