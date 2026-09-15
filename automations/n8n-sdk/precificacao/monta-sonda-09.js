/* Injeta `amostra-modelo.config.json` em `sonda-09-template.js` e prova o resultado.
 * Uso: node monta-sonda-09.js
 * Saída: sonda-09-queries.gerado.js
 *
 * Mesma ideia do monta-sonda-04: a amostra tem UMA fonte de verdade.
 */
const fs = require('fs');
const path = require('path');
const HERE = __dirname;

const cfg = JSON.parse(fs.readFileSync(path.join(HERE, 'amostra-modelo.config.json'), 'utf8'));
const tpl = fs.readFileSync(path.join(HERE, 'sonda-09-template.js'), 'utf8');

const MARCA = '/*__CONFIG__*/null';
if (tpl.split(MARCA).length !== 2) {
  console.error('X marcador __CONFIG__ ausente ou repetido'); process.exit(1);
}
/* O config que viaja pro no: sem as chaves _ (comentario pra humano) e com
   cada modelo numa linha so. Expandido sao 130 linhas de ruido, e o no tem de
   ser legivel na tela do n8n. Nao muda a SQL.
   Montado a mao em vez de por regex: a versao com regex ja quebrou aqui uma
   vez, porque o \n do patch virou quebra de linha literal dentro do padrao. */
const limpo = {};
Object.keys(cfg).forEach((k) => { if (k.charAt(0) !== '_') limpo[k] = cfg[k]; });
const modelos = limpo.modelos;
delete limpo.modelos;
const enxuto =
  '{\n' +
  Object.keys(limpo).map((k) => '  ' + JSON.stringify(k) + ': ' + JSON.stringify(limpo[k])).join(',\n') +
  ',\n  "modelos": [\n' +
  modelos.map((m) => '    { "marca": ' + JSON.stringify(m.marca) +
    ', "modelo": ' + JSON.stringify(m.modelo) +
    ', "vendas": ' + m.vendas + ', "ids": ' + m.ids + ' }').join(',\n') +
  '\n  ]\n}';
const src = tpl.replace(MARCA, enxuto);

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
  .indexOf('GROUP BY grupo, faixa') >= 0, d + ': sem recorte por modelo'));

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

/* os 20 modelos chegaram inteiros na SQL, e nenhuma categoria excluida ficou */
const amostraSql = q.find((x) => x.queryName === 'q_km').sql;
cfg.modelos.forEach((m) => {
  const chave = m.marca + '|' + m.modelo;
  ok(amostraSql.indexOf("'" + chave + "'") >= 0, 'modelo ausente na SQL: ' + chave);
});
const naSql = (amostraSql.match(/'[A-Z][A-Z \-+!]*\|[A-Z0-9][A-Z0-9 \-+!]*'/g) || []).length;
ok(naSql === cfg.modelos.length,
   'a SQL tem ' + naSql + ' modelos, o config tem ' + cfg.modelos.length);
cfg.excluir_categorias.forEach((c) =>
  ok(amostraSql.indexOf("'" + c + "'") >= 0, 'categoria excluida ausente na SQL: ' + c));
/* o filtro de categoria tem de estar no WHERE (por linha), nao num MAX */
ok(amostraSql.indexOf('NOT IN (') >= 0, 'filtro de categoria ausente');

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

const saida = path.join(HERE, 'sonda-09-queries.gerado.js');
fs.writeFileSync(saida, src, 'utf8');

console.log('\n═══ SONDA 9 MONTADA ═══\n');
console.log('  amostra:   ' + cfg.nome + ' — ' + cfg.modelos.length + ' modelos');
console.log('  janela:    ' + q[0].meta.data_ini + ' -> ' + q[0].meta.hoje);
console.log('  dimensoes: km, idade, uf, laudo (por modelo)');
console.log('  chamadas:  ' + q.length);
DIMS.forEach((d) => console.log('     ' + d.padEnd(10) +
  q.filter((x) => x.queryName === d).length + ' paginas'));
console.log('  no:        ' + path.basename(saida) + ' — ' + (src.length / 1024).toFixed(1) + ' KB');
console.log('\n  todas as provas passaram\n');
