-- =============================================================================
-- VerdAgro · Views para o app
-- O PostgREST devolve geography em formato binário; esta view entrega o
-- polígono em GeoJSON e o centróide em lat/lng. security_invoker = true:
-- as políticas de RLS de properties continuam valendo.
-- =============================================================================

create or replace view public.propriedades_app
with (security_invoker = true)
as
select
  p.id,
  p.owner_id,
  p.name,
  p.city,
  p.state,
  p.area_ha,
  p.production_type,
  p.crops,
  p.land_use_history,
  p.is_demo,
  p.created_at,
  extensions.st_asgeojson(p.boundary)::jsonb as poligono,
  extensions.st_y(p.centroid::extensions.geometry) as latitude,
  extensions.st_x(p.centroid::extensions.geometry) as longitude
from public.properties p;

revoke all on public.propriedades_app from anon, authenticated;
grant select on public.propriedades_app to authenticated;
