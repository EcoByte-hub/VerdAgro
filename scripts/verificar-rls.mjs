/**
 * Verifica as regras de RLS contra o Supabase LOCAL com os usuários do seed.
 * Uso: npx supabase start && npm run db:verificar
 * (lê a URL e a chave publicável de `supabase status`)
 *
 * Funciona com qualquer dado que já exista no banco (não precisa de db:reset): as
 * verificações conferem regras, não contagens, e os testes de escrita usam uma
 * propriedade, um projeto e um interesse temporários, apagados no fim (em cascata).
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
const prod = await login('produtor@demo.verdagro.app');
const coop = await login('coop@demo.verdagro.app');
const emp = await login('empresa@demo.verdagro.app');
const adm = await login('admin@demo.verdagro.app');
const PROD = '11111111-1111-4111-8111-111111111111', EMP = '33333333-3333-4333-8333-333333333333';
const len = r => (Array.isArray(r.data) ? r.data.length : -1);
const linhas = r => (Array.isArray(r.data) ? r.data : []);
const ids = async (tok, path) => new Set(linhas(await q(tok, path)).map(l => l.id));
const contem = (a, b) => [...b].every(x => a.has(x));
const post = (body) => ({ method: 'POST', body: JSON.stringify(body) });
const patch = (body) => ({ method: 'PATCH', body: JSON.stringify(body) });

// Propriedade temporária do produtor: base dos testes de projeto e interesse
const np = await q(prod, 'properties', post({ owner_id: PROD, name: 'Teste RLS', city: 'Rio Verde', state: 'GO', boundary: 'SRID=4326;POLYGON((-50.97 -17.86,-50.96 -17.86,-50.96 -17.85,-50.97 -17.85,-50.97 -17.86))' }));
const propId = np.data?.[0]?.id;
try {
  // ---------- propriedades e perfis
  expect('produtor cadastra propriedade e a área é calculada no banco', np.status === 201 && Number(np.data?.[0]?.area_ha) > 100);
  const minhas = linhas(await q(prod, 'properties?select=id,owner_id'));
  expect('produtor vê só as próprias propriedades', minhas.length > 0 && minhas.every(p => p.owner_id === PROD));
  expect('empresa não lê propriedades (nem polígonos)', len(await q(emp, 'properties?select=id')) === 0);
  expect('empresa não lê polígonos pela view do app', len(await q(emp, 'propriedades_app?select=id')) === 0);
  expect('produtor recebe o polígono em GeoJSON', (await q(prod, `propriedades_app?id=eq.${propId}&select=poligono`)).data?.[0]?.poligono?.type === 'Polygon');
  const deTodos = await ids(adm, 'properties?select=id');
  expect('admin vê todas as propriedades', contem(deTodos, await ids(prod, 'properties?select=id')) && contem(deTodos, await ids(coop, 'properties?select=id')));
  expect('empresa não cadastra propriedade', (await q(emp, 'properties', post({ owner_id: EMP, name: 'x', city: 'x', state: 'SP', boundary: 'SRID=4326;POLYGON((0 0,0 1,1 1,0 0))' }))).status >= 400);
  const nome = (await q(prod, `profiles?id=eq.${PROD}&select=full_name`)).data?.[0]?.full_name;
  expect('produtor edita o próprio nome', (await q(prod, `profiles?id=eq.${PROD}`, patch({ full_name: nome }))).status === 200);
  expect('ninguém troca o próprio papel (role)', (await q(prod, `profiles?id=eq.${PROD}`, patch({ role: 'admin' }))).status >= 400);

  // ---------- projetos e marketplace (projeto temporário, já publicado)
  const pj = await q(prod, 'projects', post({ property_id: propId, owner_id: PROD, title: 'Projeto de teste RLS', practice: 'plantio_direto', area_ha: 10, is_published: true }));
  const projId = pj.data?.[0]?.id;
  expect('produtor publica projeto na própria propriedade', pj.status === 201);
  const etapas = linhas(await q(prod, `project_stage_events?project_id=eq.${projId}&select=stage`));
  expect('linha do tempo registrada', etapas.map(e => e.stage).join(',') === 'cadastro');
  expect('crédito emitido só após o estágio de emissão', (await q(prod, `projects?id=eq.${projId}`, patch({ issued_credits: 100 }))).status >= 400);
  const vitrine = await ids(emp, 'marketplace_projects?select=id');
  const publicados = await ids(adm, 'projects?is_published=eq.true&select=id');
  expect('empresa vê no marketplace exatamente os projetos publicados', vitrine.has(projId) && vitrine.size === publicados.size && contem(vitrine, publicados));
  expect('anônimo não lê o marketplace', len(await q(KEY, 'marketplace_projects?select=id')) <= 0);

  // ---------- interesses e negociação (interesse temporário da empresa no projeto de teste)
  expect('produtor não manifesta interesse', (await q(prod, 'interests', post({ project_id: projId, company_id: PROD, message: 'oi' }))).status >= 400);
  const ni = await q(emp, 'interests', post({ project_id: projId, company_id: EMP, message: 'Interesse de teste' }));
  const intId = ni.data?.[0]?.id;
  const iNi = `interests?id=eq.${intId}`;
  expect('empresa manifesta interesse em projeto publicado', ni.status === 201);
  expect('dono do projeto vê o interesse', len(await q(prod, iNi)) === 1);
  expect('outro produtor não vê interesse de projeto alheio', len(await q(coop, iNi)) === 0);
  const daEmpresa = linhas(await q(emp, 'interests?select=id,company_id'));
  expect('empresa vê só as próprias negociações', daEmpresa.some(i => i.id === intId) && daEmpresa.every(i => i.company_id === EMP));
  expect('produtor vê só negociações dos próprios projetos', linhas(await q(prod, 'interests?select=projects(owner_id)')).every(i => i.projects?.owner_id === PROD));
  expect('contraparte enxerga o perfil da empresa', len(await q(prod, `profiles?id=eq.${EMP}&select=role`)) === 1);
  await q(emp, 'interest_messages', post({ interest_id: intId, author_id: EMP, body: 'Mensagem de teste' }));
  expect('participantes leem mensagens', len(await q(prod, `interest_messages?interest_id=eq.${intId}`)) === 1);
  expect('quem não participa não lê mensagens', len(await q(coop, `interest_messages?interest_id=eq.${intId}`)) === 0);
  expect('empresa não muda o status do interesse', (await q(emp, iNi, patch({ status: 'aceita' }))).status >= 400);
  expect('outro produtor não recusa interesse de projeto alheio', len(await q(coop, iNi, patch({ status: 'recusada' }))) === 0);
  expect('produtor recusa interesse no projeto dele', (await q(prod, iNi, patch({ status: 'recusada' }))).data?.[0]?.status === 'recusada');
  expect('empresa não desfaz a recusa mudando o status', (await q(emp, iNi, patch({ status: 'enviada' }))).status >= 400);
  expect('empresa apaga o interesse recusado (para mandar outro)', len(await q(emp, iNi, { method: 'DELETE' })) === 1);
} finally {
  // Apagar a propriedade leva junto o projeto, os interesses, as mensagens e a linha do tempo
  if (propId) await q(prod, `properties?id=eq.${propId}`, { method: 'DELETE' });
}

console.log(falhas ? `\n${falhas} verificação(ões) falharam` : '\nTodas as verificações passaram');
process.exit(falhas ? 1 : 0);
