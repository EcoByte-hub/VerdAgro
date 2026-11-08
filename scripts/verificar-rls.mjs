/**
 * Verifica as regras de RLS contra o Supabase LOCAL com os usuários do seed.
 * Uso: npx supabase start && npm run db:verificar
 * (lê a URL e a chave publicável de `supabase status`)
 */
import { execSync } from 'node:child_process';

const status = JSON.parse(execSync('npx -y supabase@3 status -o json', { encoding: 'utf8' }));
const API = status.API_URL, KEY = status.PUBLISHABLE_KEY;
let falhas = 0;
const expect = (label, ok) => { console.log(`${ok ? '✓' : '✗'} ${label}`); if (!ok) falhas++; };
async function login(email) {
  const r = await fetch(`${API}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: KEY, 'content-type': 'application/json' }, body: JSON.stringify({ email, password: 'verdagro-demo' }) });
  const j = await r.json(); if (!j.access_token) throw new Error(email + ' ' + JSON.stringify(j)); return j.access_token;
}
const q = async (tok, path, opts = {}) => {
  const r = await fetch(`${API}/rest/v1/${path}`, { ...opts, headers: { apikey: KEY, authorization: `Bearer ${tok}`, 'content-type': 'application/json', prefer: 'return=representation', ...(opts.headers || {}) } });
  const t = await r.text(); let j; try { j = JSON.parse(t) } catch { j = t }
  return { status: r.status, data: j };
};
const count = r => Array.isArray(r.data) ? r.data.length : `${r.status} ${JSON.stringify(r.data).slice(0, 120)}`;
const prod = await login('produtor@demo.verdagro.app');
const coop = await login('coop@demo.verdagro.app');
const emp = await login('empresa@demo.verdagro.app');
const adm = await login('admin@demo.verdagro.app');
const len = r => (Array.isArray(r.data) ? r.data.length : -1);

expect('produtor vê só a própria propriedade', len(await q(prod, 'properties?select=id')) === 1);
expect('empresa não lê propriedades (nem polígonos)', len(await q(emp, 'properties?select=id')) === 0);
expect('empresa vê os 3 projetos publicados no marketplace', len(await q(emp, 'marketplace_projects?select=id')) === 3);
expect('anônimo não lê o marketplace', len(await q(KEY, 'marketplace_projects?select=id')) <= 0);
expect('empresa vê só as próprias negociações', len(await q(emp, 'interests?select=id')) === 1);
expect('produtor não vê negociação de projeto alheio', len(await q(prod, 'interests?select=id')) === 0);
expect('dono do projeto vê a negociação', len(await q(coop, 'interests?select=id')) === 1);
expect('contraparte enxerga o perfil da empresa', (await q(coop, 'profiles?select=role')).data.some(p => p.role === 'empresa'));
expect('participantes leem mensagens', len(await q(coop, 'interest_messages?select=id')) === 2);
expect('produtor edita o próprio nome', (await q(prod, 'profiles?id=eq.11111111-1111-4111-8111-111111111111', { method: 'PATCH', body: JSON.stringify({ full_name: 'João Ferreira' }) })).status === 200);
expect('ninguém troca o próprio papel (role)', (await q(prod, 'profiles?id=eq.11111111-1111-4111-8111-111111111111', { method: 'PATCH', body: JSON.stringify({ role: 'admin' }) })).status >= 400);
expect('empresa não cadastra propriedade', (await q(emp, 'properties', { method: 'POST', body: JSON.stringify({ owner_id: '33333333-3333-4333-8333-333333333333', name: 'x', city: 'x', state: 'SP', boundary: 'SRID=4326;POLYGON((0 0,0 1,1 1,0 0))' }) })).status >= 400);
expect('crédito emitido só após o estágio de emissão', (await q(prod, 'projects?id=eq.bbbbbbbb-0000-4000-8000-000000000001', { method: 'PATCH', body: JSON.stringify({ issued_credits: 100 }) })).status >= 400);
expect('produtor não manifesta interesse', (await q(prod, 'interests', { method: 'POST', body: JSON.stringify({ project_id: 'bbbbbbbb-0000-4000-8000-000000000003', company_id: '11111111-1111-4111-8111-111111111111', message: 'oi' }) })).status >= 400);

const ni = await q(emp, 'interests', { method: 'POST', body: JSON.stringify({ project_id: 'bbbbbbbb-0000-4000-8000-000000000001', company_id: '33333333-3333-4333-8333-333333333333', message: 'Interesse de teste' }) });
expect('empresa manifesta interesse em projeto publicado', ni.status === 201);
expect('produtor recebe o interesse no projeto dele', len(await q(prod, 'interests?select=id')) === 1);
if (ni.data?.[0]?.id) await q(emp, `interests?id=eq.${ni.data[0].id}`, { method: 'DELETE' });

const events = (await q(prod, 'project_stage_events?project_id=eq.bbbbbbbb-0000-4000-8000-000000000001&select=stage&order=created_at')).data;
expect('linha do tempo registrada', events.map(e => e.stage).join(',') === 'cadastro,analise_inicial,desenvolvimento');
expect('admin vê todas as propriedades', len(await q(adm, 'properties?select=id')) === 3);

const np = await q(prod, 'properties', { method: 'POST', body: JSON.stringify({ owner_id: '11111111-1111-4111-8111-111111111111', name: 'Teste', city: 'Rio Verde', state: 'GO', boundary: 'SRID=4326;POLYGON((-50.97 -17.86,-50.96 -17.86,-50.96 -17.85,-50.97 -17.85,-50.97 -17.86))' }) });
expect('produtor cadastra propriedade e a área é calculada no banco', np.status === 201 && Number(np.data?.[0]?.area_ha) > 100);
if (np.data?.[0]?.id) await q(prod, `properties?id=eq.${np.data[0].id}`, { method: 'DELETE' });

console.log(falhas ? `\n${falhas} verificação(ões) falharam` : '\nTodas as verificações passaram');
process.exit(falhas ? 1 : 0);
