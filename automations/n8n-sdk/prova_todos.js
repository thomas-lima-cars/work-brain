// PROVA: a unica diferenca entre cada query original e a nova e o fragmento BASE
// (mais o filtro de inventario no evol_media_oferta). Desfazendo essas duas
// substituicoes, o SQL tem que voltar IDENTICO ao de producao.
const fs = require('fs');
const A = fs.readFileSync('C:/Users/thoma/Documents/work-brain/automations/n8n-sdk/nodes-originais/Montar_Queries.js', 'utf8');
const B = fs.readFileSync('montar_queries_todos.js', 'utf8');

const BASE_VELHA = "SELECT u.id as user_id FROM users u INNER JOIN user_whitelabels uw ON uw.user_id = u.id AND uw.whitelabel_id = 43 WHERE u.deleted_at IS NULL AND u.internal_user = 0 AND u.email NOT REGEXP '(@cars2you|@datapage|@icarros|@itau|@teste|@dnr[.]com[.]br|@maisquecliente|@dealersclub|@c6bank[.]com)'";
const BASE_NOVA = "SELECT u.id as user_id FROM users u WHERE u.deleted_at IS NULL AND u.internal_user = 0 AND u.email NOT REGEXP '(@cars2you|@datapage|@icarros|@itau|@teste|@dnr[.]com[.]br|@maisquecliente|@dealersclub|@c6bank[.]com)' AND EXISTS(SELECT 1 FROM user_whitelabels uw0 WHERE uw0.user_id = u.id)";

const agrupa = (arr) => { const m = new Map(); for (const it of arr) { const q = it.json; if (!m.has(q.queryName)) m.set(q.queryName, []); m.get(q.queryName).push(q.sql); } return m; };
const ma = agrupa(new Function(A)()), mb = agrupa(new Function(B)());

const stripPag = (s) => s.replace(/ LIMIT \d+ OFFSET \d+$/, '');

console.log('nome'.padEnd(24), 'usos_BASE'.padStart(10), '  veredito');
console.log('-'.repeat(70));
let falhas = [];
for (const [nome, sa] of ma) {
  let novo = stripPag(mb.get(nome)[0]);
  const orig = stripPag(sa[0]);
  const usos = novo.split(BASE_NOVA).length - 1;

  // desfaz E1
  let volta = novo.split(BASE_NOVA).join(BASE_VELHA);
  // desfaz E2 (so no evol_media_oferta)
  if (nome === 'evol_media_oferta') {
    volta = volta.replace('INNER JOIN shops s ON s.id = a.shop_id ',
      'INNER JOIN shops s ON s.id = a.shop_id AND s.whitelabel_id = 43 ');
  }
  const ok = volta === orig;
  if (!ok) falhas.push(nome);
  console.log(nome.padEnd(24), String(usos).padStart(10), '  ' + (ok ? 'volta identico ao original' : '*** NAO VOLTA ***'));
}
console.log('-'.repeat(70));
if (falhas.length) {
  console.log('FALHAS:', falhas);
  for (const nome of falhas) {
    const orig = stripPag(ma.get(nome)[0]);
    let volta = stripPag(mb.get(nome)[0]).split(BASE_NOVA).join(BASE_VELHA);
    let i = 0; while (i < orig.length && i < volta.length && orig[i] === volta[i]) i++;
    console.log('  ', nome, 'diverge no char', i);
    console.log('    orig:', JSON.stringify(orig.slice(i - 40, i + 80)));
    console.log('    novo:', JSON.stringify(volta.slice(i - 40, i + 80)));
  }
} else {
  console.log('PROVADO: nenhuma query foi reescrita. So o fragmento BASE mudou');
  console.log('(mais o filtro de inventario no evol_media_oferta).');
}
