# 0001: Next.js (App Router) como frontend e servidor

**Status:** Aceita

## Contexto
Precisamos de uma interface rica (mapa, dashboards, marketplace) e de um servidor para guardar chaves de IA e satélite. O time domina React e TypeScript, e o prazo é de hackathon.

## Decisão
Usar **Next.js com App Router, React e TypeScript** em um único projeto, com *route handlers* e *server actions* no lugar de uma API separada. Deploy na **Vercel**.

## Consequências
- Um deploy só, com preview automático por PR.
- Segredos ficam apenas no servidor (`server-only`).
- O time precisa seguir a separação entre Server e Client Components (ver `CONTRIBUTING.md`).
