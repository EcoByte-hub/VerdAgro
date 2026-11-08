# 0002: Supabase como backend

**Status:** Aceita

## Contexto
Precisamos de autenticação com dois perfis, banco relacional com geometria (polígonos das fazendas), upload de evidências e permissões diferentes para produtor e empresa.

## Decisão
Usar **Supabase**: Postgres com **PostGIS**, Auth, Storage e **Row Level Security**. O schema vive em `supabase/migrations` e é versionado no git.

## Consequências
- Permissões ficam no banco (RLS), e não espalhadas pelo código.
- Plano gratuito: projeto pausa após 7 dias sem uso. Exige checklist antes da apresentação.
- Projetos novos exigem `GRANT` explícito para o PostgREST; as migrations já fazem isso.
