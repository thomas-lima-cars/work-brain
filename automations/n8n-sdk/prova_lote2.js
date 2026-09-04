// PROVA DO LOTE 2 — roda os dois builders (1f e 2) fora do n8n e responde:
//   1. as queries globais do 1f sobreviveram BYTE A BYTE?
//   2. quantas chamadas ao MCP o lote 2 passa a fazer?
//   3. cada query _wl tem mesmo a dimensao wl no SELECT e no GROUP BY?
//   4. o SQL das _wl e derivado do global, ou foi reescrito?
//
// Nada aqui toca o banco. E o teste que evita descobrir erro de sintaxe depois
// de 13 minutos de execucao no n8n.
const fs = require('fs');
const path = require('path');
const HERE = __dirname;

const roda = (f) => new Function(fs.readFileSync(path.join(HERE, f), 'utf8'))();
const agrupa = (arr) => {
  const m = new Map();
  for (const it of arr) {
    const q = it.json;
    if (!m.has(q.queryName)) m.set(q.queryName, []);
    m.get(q.queryName).push(q.sql);
  }
  return m;
};
const stripPag = (s) => s.replace(/ LIMIT \d+ OFFSET \d+$/, '');

const A = agrupa(roda('montar-queries-LOTE1f-wl-por-ano.js'));
const B = agrupa(roda('montar-queries-LOTE2-full-wl.js'));

let falhas = [];
const ok = (c, msg) => { if (!c) falhas.push(msg); return c; };

// ── 1. as globais sobreviveram verbatim ────────────────────────────────────
console.log('\n═══ 1. AS GLOBAIS DO LOTE 1f SEGUEM INTACTAS? ═══\n');
let iguais = 0;
for (const [nome, sqlsA] of A) {
  const sqlsB = B.get(nome);
  if (!ok(sqlsB, `global ${nome} SUMIU no lote 2`)) continue;
  const mesmoTexto = JSON.stringify(sqlsA) === JSON.stringify(sqlsB);
  if (!ok(mesmoTexto, `global ${nome} MUDOU de texto`)) {
    console.log(`  ✗ ${nome.padEnd(24)} texto diferente`);
    continue;
  }
  iguais++;
}
console.log(`  ${iguais}/${A.size} queries globais byte-a-byte identicas`);

// ── 2. custo: chamadas ao MCP ──────────────────────────────────────────────
console.log('\n═══ 2. CUSTO — CHAMADAS AO MCP ═══\n');
const chamadas = (m) => [...m.values()].reduce((s, v) => s + v.length, 0);
const cA = chamadas(A), cB = chamadas(B);
const rx = (m) => [...m].filter(([n]) => n.startsWith('rx_') && n !== 'rx_buyer_wl')
  .reduce((s, [, v]) => s + v.length, 0);
console.log(`  lote 1f (no ar):  ${String(cA).padStart(5)} chamadas   — 13min32s medidos na 48492`);
console.log(`  lote 2:           ${String(cB).padStart(5)} chamadas   (+${cB - cA}, ${((cB / cA - 1) * 100).toFixed(0)}%)`);
console.log(`  dessas, Raio-X:   ${String(rx(B)).padStart(5)} chamadas   — INTOCADO (mapa rx_buyer_wl no lugar do GROUP BY)`);
console.log(`\n  Estimativa linear: ~${(13.5 * cB / cA).toFixed(0)} min. NAO e promessa — as _wl`);
console.log('  tem custo por query diferente das rx_. Medir na primeira execucao.');

// ── 3. cada _wl tem mesmo a dimensao whitelabel? ───────────────────────────
console.log('\n═══ 3. AS _wl CARREGAM MESMO A DIMENSAO WHITELABEL? ═══\n');
const NOVAS = [...B.keys()].filter((n) => !A.has(n));
console.log('  query'.padEnd(28) + 'pag'.padStart(5) + '  wl no SELECT  wl no GROUP BY  chars');
console.log('  ' + '-'.repeat(72));
for (const nome of NOVAS) {
  const sql = stripPag(B.get(nome)[0]);
  const noSelect = /\bwl\b/.test(sql.slice(0, sql.indexOf(' FROM ')));
  // rx_buyer_wl e um mapa: nao agrega, entao nao tem (nem precisa de) GROUP BY
  const precisaGroup = nome !== 'rx_buyer_wl';
  const noGroup = /GROUP BY[^)]*\bwl\b/.test(sql) || /PARTITION BY [a-z]+\.wl/.test(sql);
  ok(noSelect, `${nome}: sem wl no SELECT`);
  if (precisaGroup) ok(noGroup, `${nome}: sem wl no GROUP BY/PARTITION BY`);
  console.log('  ' + nome.padEnd(26) +
    String(B.get(nome).length).padStart(5) +
    (noSelect ? '       sim' : '       NAO').padEnd(15) +
    (precisaGroup ? (noGroup ? '  sim' : '  NAO') : '  n/a').padEnd(16) +
    String(sql.length).padStart(6));
}

// ── 4. derivacao: o SQL da _wl veio do global? ─────────────────────────────
console.log('\n═══ 4. AS _wl SAO DERIVADAS DA GLOBAL, OU FORAM REESCRITAS? ═══\n');
console.log('  Criterio: o miolo que NAO e whitelabel (tabelas, janela de data,');
console.log('  status, filtro de deleted_at) tem de bater com o da global.\n');
const PARES = [
  ['recencia_wl', 'recencia'], ['evol_login_wl', 'evol_login'],
  ['evol_oferta_wl', 'evol_oferta'], ['evol_compra_wl', 'evol_compra'],
  ['evol_cadastro_dia_wl', 'evol_cadastro_dia'], ['nr_login_wl', 'nr_login'],
  ['nr_oferta_wl', 'nr_oferta'], ['nr_compra_wl', 'nr_compra'],
  ['uf_cadastro_wl', 'uf_cadastro'], ['uf_compra_wl', 'uf_compra'],
  ['top_compradores_hist_wl', 'top_compradores_hist'],
  ['top_compradores_ano_wl', 'top_compradores_ano'],
  ['top_acesso_ano_wl', 'top_acesso_ano'], ['top_ofertas_ano_wl', 'top_ofertas_ano'],
];
// assinaturas que precisam sobreviver a transformacao
const ASSIN = [
  [/an\.status IN \(2,3,7\)/g, 'status 2/3/7'],
  [/o\.deleted_at IS NULL/g, 'offers deleted_at'],
  [/DATE_FORMAT\([a-z]+\.[a-z_]+,'%Y-%m'\)/g, 'DATE_FORMAT ym'],
  [/\d{4}-\d{2}-01/g, 'janela de data'],
  [/NOT REGEXP/g, 'regexp de e-mail interno'],
];
console.log('  par'.padEnd(48) + 'assinaturas preservadas');
console.log('  ' + '-'.repeat(72));
for (const [nw, ng] of PARES) {
  const sw = stripPag(B.get(nw)[0]);
  const sg = stripPag(B.get(ng)[0]);
  const marcas = [];
  for (const [re, nome] of ASSIN) {
    const cg = (sg.match(re) || []).length;
    const cw = (sw.match(re) || []).length;
    if (cg > 0) marcas.push(cw > 0 ? nome : `FALTA:${nome}`);
  }
  const falhou = marcas.some((m) => m.startsWith('FALTA'));
  ok(!falhou, `${nw}: perdeu assinatura da global (${marcas.filter(m => m.startsWith('FALTA')).join(', ')})`);
  console.log('  ' + `${nw} <- ${ng}`.padEnd(46) + (falhou ? '✗ ' : '✓ ') + marcas.join(', '));
}

// ── 5. armadilhas conhecidas ───────────────────────────────────────────────
console.log('\n═══ 5. ARMADILHAS CONHECIDAS ═══\n');
// a) o total NUNCA pode sair da soma dos WLs
for (const [nw] of PARES) {
  ok(!/EXISTS\(SELECT 1 FROM user_whitelabels/.test(stripPag(B.get(nw)[0])) ||
     /INNER JOIN user_whitelabels/.test(stripPag(B.get(nw)[0])),
     `${nw}: usa EXISTS em vez de INNER JOIN — nao produz linha por WL`);
}
console.log('  ✓ toda _wl usa INNER JOIN em user_whitelabels (linha por WL, nao por usuario)');

// b) nr_*: a subquery de primeiro_mes NAO pode ter wl nem janela de data
for (const n of ['nr_login_wl', 'nr_oferta_wl', 'nr_compra_wl']) {
  const sql = stripPag(B.get(n)[0]);
  const f = sql.slice(sql.lastIndexOf('INNER JOIN (SELECT'));
  ok(!/bw\.wl/.test(f), `${n}: a subquery primeiro_mes ganhou wl — 'novo' passaria a ser novo-no-whitelabel`);
  ok(!/>= '\d{4}-\d{2}-01'/.test(f), `${n}: a subquery primeiro_mes ganhou janela de data — mediria o comeco da janela`);
}
console.log("  ✓ nr_*: primeiro_mes segue sem wl e sem janela ('novo' = novo na historia toda)");

// c) top_*_wl precisa de ROW_NUMBER, nao LIMIT
for (const n of PARES.filter(([a]) => a.startsWith('top_')).map(([a]) => a)) {
  const sql = stripPag(B.get(n)[0]);
  ok(/ROW_NUMBER\(\) OVER \(PARTITION BY bw\.wl/.test(sql), `${n}: sem ROW_NUMBER particionado`);
  ok(!/ LIMIT 10$/.test(sql), `${n}: ainda usa LIMIT 10 — daria top-10 do conjunto, nao de cada WL`);
}
console.log('  ✓ top_*_wl: ROW_NUMBER() OVER (PARTITION BY wl), sem LIMIT 10 global');

// d) evol_media_oferta segue global e sem whitelabel
const ema = stripPag(B.get('evol_media_oferta')[0]);
ok(!/whitelabel/i.test(ema), 'evol_media_oferta ganhou whitelabel — e metrica de oferta, nao de cliente');
ok(!B.has('evol_media_oferta_wl'), 'existe evol_media_oferta_wl — nao deveria');
console.log('  ✓ evol_media_oferta segue global (metrica do lado da oferta; chave e shop_id)');

// e) evol_cadastro nao ganhou _wl (sai da coorte_wl de graca)
ok(!B.has('evol_cadastro_wl'), 'evol_cadastro_wl existe — e redundante com coorte_wl.ym');
console.log('  ✓ evol_cadastro sem versao _wl (o ym da coorte_wl ja e o mes de cadastro)');

// ── veredito ───────────────────────────────────────────────────────────────
console.log('\n' + '═'.repeat(74));
if (falhas.length === 0) {
  console.log('VEREDITO: passou. ' + A.size + ' globais intactas, ' + NOVAS.length +
    ' queries _wl novas, ' + cB + ' chamadas ao MCP.');
  console.log('Falta a prova que so o banco pode dar: tempo de query e volume real.');
} else {
  console.log('VEREDITO: ' + falhas.length + ' FALHA(S)\n');
  falhas.forEach((f) => console.log('  ✗ ' + f));
  process.exitCode = 1;
}
console.log('═'.repeat(74) + '\n');
