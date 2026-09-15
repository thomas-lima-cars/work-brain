/* Injeta `amostra.config.json` em `sonda-05-template.js` e prova o resultado.
 * Uso: node monta-sonda-05.js
 * Saída: sonda-05-queries.gerado.js
 *
 * Mesma ideia do monta-sonda-04: a amostra tem UMA fonte de verdade.
 */
const fs = require('fs');
const path = require('path');
const HERE = __dirname;

const cfg = JSON.parse(fs.readFileSync(path.join(HERE, 'amostra.config.json'), 'utf8'));
const tpl = fs.readFileSync(path.join(HERE, 'sonda-05-template.js'), 'utf8');

const MARCA = '/*__CONFIG__*/null';
if (tpl.split(MARCA).length !== 2) {
  console.error('X marcador __CONFIG__ ausente ou repetido'); process.exit(1);
}
const src = tpl.replace(MARCA, JSON.stringify(cfg, null, 2));

let itens;
try { itens = new Function(src)(); }
catch (e) { console.error('X o no nao executa: ' + e.message); process.exit(1); }

const falhas = [];
const ok = (c, m) => { if (!c) falhas.push(m); };
const q = itens.map((i) => i.json);
const nomes = Array.from(new Set(q.map((x) => x.queryName)));
const DIMS = ['q_km', 'q_idade', 'q_uf', 'q_laudo'];

ok(q[0].queryName === 'q_gabarito', 'o gabarito tem de ser a primeira chamada');
DIMS.forEach((d) => ok(nomes.indexOf(d) >= 0, 'dimensao ausente: ' + d));

/* paginacao: OFFSET em sequencia, por dimensao */
DIMS.forEach((d) => {
  const pgs = q.filter((x) => x.queryName === d);
  ok(pgs.length >= 2, d + ': menos de 2 paginas — sem margem se a dimensao crescer');
  pgs.forEach((x, i) => {
    const o = Number(/OFFSET (\d+)$/.exec(x.sql)[1]);
    ok(o === i * cfg.page, d + ': OFFSET fora de sequencia na pagina ' + i);
  });
});

/* as quatro dimensoes tem de medir a MESMA coisa: so a faixa muda.
   Se o FROM ou o WHERE divergirem, os quatro graficos nao sao comparaveis. */
const corpo = (s) => s.slice(s.indexOf(' WHERE '), s.indexOf(' GROUP BY '));
const ref = corpo(q.find((x) => x.queryName === 'q_km').sql);
['q_idade', 'q_uf'].forEach((d) =>
  ok(corpo(q.find((x) => x.queryName === d).sql) === ref,
     d + ': WHERE diverge de q_km — dimensoes nao comparaveis'));
/* q_laudo tem um LEFT JOIN a mais, entao compara so o WHERE */
const soWhere = (s) => s.slice(s.indexOf(' WHERE '), s.indexOf(' GROUP BY '));
ok(soWhere(q.find((x) => x.queryName === 'q_laudo').sql) === ref,
   'q_laudo: WHERE diverge de q_km');

/* o recorte do pedido: agrupar por codigo_fipe */
DIMS.forEach((d) => ok(q.find((x) => x.queryName === d).sql
  .indexOf('GROUP BY ver.code_fipe, faixa') >= 0, d + ': sem recorte por codigo FIPE'));

/* as medidas tem de ser identicas nas quatro */
const med = 'ROUND(AVG((o.price / a.fipe_price)), 6) AS razao_media';
DIMS.forEach((d) => ok(q.find((x) => x.queryName === d).sql.indexOf(med) >= 0,
  d + ': medida de razao diferente'));

/* o laudo entra pre-agregado, nunca por join direto na tabela */
const lau = q.find((x) => x.queryName === 'q_laudo').sql;
ok(lau.indexOf('GROUP BY vpr0.vehicle_id') >= 0,
   'q_laudo: laudo sem pre-agregacao — join direto multiplicaria a venda');
ok(lau.indexOf('LEFT JOIN vehicle_precautionary_reports') < 0,
   'q_laudo: join direto na tabela de laudo');

/* PII e limites do MCP */
['plate', 'chassi', 'renavam', 'last_owner_document'].forEach((p) =>
  q.forEach((x) => ok(x.sql.indexOf(p) < 0, 'PII ' + p + ' em ' + x.queryName)));
q.forEach((x) => {
  ok(x.sql.indexOf('OVER') < 0, 'funcao de janela em ' + x.queryName);
  let d = 0; for (const c of x.sql) { if (c === '(') d++; if (c === ')') d--; if (d < 0) break; }
  ok(d === 0, 'parenteses desbalanceados em ' + x.queryName);
});

/* as faixas tem prefixo de letra: sem ele o ORDER BY alfabetico embaralha */
[['q_km', "'a ate 20k'"], ['q_idade', "'a 0 a 1 ano'"]].forEach(([d, marca]) =>
  ok(q.find((x) => x.queryName === d).sql.indexOf(marca) >= 0,
     d + ': faixa sem prefixo de ordenacao'));

if (falhas.length) {
  console.error('\nFALHAS:\n - ' + falhas.join('\n - ')); process.exit(1);
}

const saida = path.join(HERE, 'sonda-05-queries.gerado.js');
fs.writeFileSync(saida, src, 'utf8');

console.log('\n═══ SONDA 5 MONTADA ═══\n');
console.log('  amostra:   ' + cfg.nome + ' — ' + cfg.codigos_fipe.length + ' codigos');
console.log('  janela:    ' + q[0].meta.data_ini + ' -> ' + q[0].meta.hoje);
console.log('  dimensoes: km, idade, uf, laudo (por codigo FIPE)');
console.log('  chamadas:  ' + q.length);
DIMS.forEach((d) => console.log('     ' + d.padEnd(10) +
  q.filter((x) => x.queryName === d).length + ' paginas'));
console.log('  no:        ' + path.basename(saida) + ' — ' + (src.length / 1024).toFixed(1) + ' KB');
console.log('\n  todas as provas passaram\n');
