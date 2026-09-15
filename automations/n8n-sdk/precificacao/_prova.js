/* Prova local da sonda de precificacao. Nao toca no banco: executa o no e
   olha a SQL que ele produz. `node --check` valida o JavaScript; a SQL viaja
   dentro de uma string e nenhum validador local olha pra ela. Aqui olho.
   Uso: node _prova.js [sonda-02-queries.js] */
const fs = require('fs');
const alvo = process.argv[2] || 'sonda-02-queries.js';
const src = fs.readFileSync(alvo, 'utf8');
let itens;
try { itens = new Function(src)(); }
catch (e) { console.error('X o no nao executa: ' + e.message); process.exit(1); }

const falhas = [];
const ok = (c, m) => { if (!c) falhas.push(m); };
const q = itens.map(i => i.json);
const nomes = q.map(x => x.queryName);
const acha = (n) => q.find(x => x.queryName === n);

ok(new Set(nomes).size === nomes.length, 'nome de query repetido');

q.forEach(x => {
  ok(/ LIMIT 50 OFFSET 0$/.test(x.sql), x.queryName + ': sem LIMIT/OFFSET no fim');
  ok(x.database === 'cars2you_production', x.queryName + ': database errado');
  ok(x.sql.indexOf('OVER') < 0, x.queryName + ': funcao de janela (o MCP rejeita)');
  ok(x.sql.indexOf('SELECT *') < 0, x.queryName + ': SELECT *');
  let d = 0; for (const c of x.sql) { if (c === '(') d++; if (c === ')') d--; if (d < 0) break; }
  ok(d === 0, x.queryName + ': parenteses desbalanceados (' + d + ')');
  ['plate', 'chassi', 'renavam', 'full_name'].forEach(p =>
    ok(x.sql.indexOf(p) < 0, x.queryName + ': PII ' + p));
});

/* ── o que a correcao do Thomas exige ────────────────────────────────────
   venda = ULTIMA linha valida do veiculo com status 2/3/7. Toda query que
   mede venda tem de carregar esse recorte; q_delta e a excecao proposital,
   porque ela existe justamente pra medir a diferenca. */
q.filter(x => x.queryName !== 'q_delta').forEach(x => {
  ok(x.sql.indexOf('MAX(an2.id)') >= 0, x.queryName + ': sem o recorte da ultima negociacao');
  ok(x.sql.indexOf('an2.deleted_at IS NULL') >= 0,
     x.queryName + ': deleted_at fora da subquery do MAX (o veiculo sumiria em silencio)');
});
/* q_delta so existe na sonda 2; quando existe, tem de usar a definicao ANTIGA */
if (acha('q_delta')) {
  ok(acha('q_delta').sql.indexOf('MAX(an2.id)') < 0,
     'q_delta deveria usar a definicao ANTIGA, sem o recorte da ultima');
}

/* ── a janela tem de ter os DOIS lados ───────────────────────────────────
   A sonda 1 so tinha o inferior, e finish_date_offer tem linha em 2030. */
q.filter(x => x.sql.indexOf('finish_date_offer >=') >= 0).forEach(x => {
  ok(x.sql.indexOf('finish_date_offer <=') >= 0,
     x.queryName + ': janela com um lado so — 2030 entra');
});

/* ── a razao e sempre venda / FIPE do anuncio ─────────────────────────── */
q.filter(x => x.sql.indexOf('fipe_price)') >= 0 && x.sql.indexOf('/ a.fipe_price') >= 0)
 .forEach(x => ok(x.sql.indexOf('(o.price / a.fipe_price)') >= 0,
                  x.queryName + ': razao com numerador errado'));

/* ── a definicao de venda e a mesma em toda query que filtra status ───── */
q.filter(x => x.sql.indexOf('an.status IN') >= 0).forEach(x => {
  ok(x.sql.indexOf('an.status IN (2, 3, 7)') >= 0, x.queryName + ': status de venda diferente');
});

console.log(alvo + ' — ' + q.length + ' chamadas');
console.log('  ' + nomes.join(', '));
console.log('  janela: ' + q[0].meta.data_ini + ' -> ' + q[0].meta.hoje);
console.log('  venda:  ' + q[0].meta.venda);
console.log('  ultima: ' + (q[0].meta.ultima || '-'));
console.log('  no:     ' + (src.length / 1024).toFixed(1) + ' KB');
console.log('\n' + (falhas.length ? 'FALHAS:\n - ' + falhas.join('\n - ') : 'todas as provas passaram'));
process.exit(falhas.length ? 1 : 0);
