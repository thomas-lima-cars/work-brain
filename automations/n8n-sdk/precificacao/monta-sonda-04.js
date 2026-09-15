/* Injeta `amostra.config.json` em `sonda-04-template.js` e prova o resultado.
 *
 * Uso: node monta-sonda-04.js
 * Saída: sonda-04-queries.gerado.js  (é este arquivo que sobe pro n8n)
 *
 * Existe pra a amostra ter UMA fonte de verdade. Antes de haver isto, trocar o
 * recorte era editar a lista de códigos dentro de uma string dentro do nó —
 * que é exatamente onde erro de vírgula não é pego por validador nenhum.
 */
const fs = require('fs');
const path = require('path');
const HERE = __dirname;

const cfg = JSON.parse(fs.readFileSync(path.join(HERE, 'amostra.config.json'), 'utf8'));
const tpl = fs.readFileSync(path.join(HERE, 'sonda-04-template.js'), 'utf8');

const MARCA = '/*__CONFIG__*/null';
if (tpl.split(MARCA).length !== 2) {
  console.error('X marcador __CONFIG__ ausente ou repetido no template');
  process.exit(1);
}
const src = tpl.replace(MARCA, JSON.stringify(cfg, null, 2));

/* ── provas locais: executa o nó e olha a SQL ─────────────────────────── */
let itens;
try { itens = new Function(src)(); }
catch (e) { console.error('X o no nao executa: ' + e.message); process.exit(1); }

const falhas = [];
const ok = (c, m) => { if (!c) falhas.push(m); };
const q = itens.map((i) => i.json);
const meta = q[0].meta;
const pags = q.filter((x) => x.queryName === 'q_vendas');

ok(q[0].queryName === 'q_gabarito', 'o gabarito tem de ser a primeira chamada');
ok(pags.length === meta.paginas, 'numero de paginas nao bate com o meta');
ok(pags.length * cfg.page >= cfg.vendas_esperadas,
   'paginas insuficientes para ' + cfg.vendas_esperadas + ' vendas');

/* os OFFSET tem de ser 0, 50, 100... sem buraco e sem repeticao */
const offs = pags.map((x) => Number(/OFFSET (\d+)$/.exec(x.sql)[1]));
offs.forEach((o, i) => ok(o === i * cfg.page, 'OFFSET fora de sequencia na pagina ' + i));
ok(new Set(offs).size === offs.length, 'OFFSET repetido entre paginas');

/* o gabarito e as paginas tem de medir A MESMA coisa: mesmo FROM, mesmo WHERE */
const corpo = (s) => s.slice(s.indexOf(' FROM '), s.indexOf(' ORDER BY ') >= 0
  ? s.indexOf(' ORDER BY ') : s.lastIndexOf(' LIMIT '));
ok(corpo(q[0].sql) === corpo(pags[0].sql),
   'gabarito e paginas divergem no FROM/WHERE: o gabarito nao serviria de prova');

/* a lista de codigos chegou inteira na SQL */
if (cfg.codigos_fipe && cfg.codigos_fipe.length) {
  cfg.codigos_fipe.forEach((c) =>
    ok(pags[0].sql.indexOf("'" + c + "'") >= 0, 'codigo ausente na SQL: ' + c));
  const naSql = (pags[0].sql.match(/'\d{6}-\d'/g) || []).length;
  ok(naSql === cfg.codigos_fipe.length,
     'a SQL tem ' + naSql + ' codigos, o config tem ' + cfg.codigos_fipe.length);
}

/* PII e limites do MCP — o template joga excecao, mas conferir aqui tambem
   porque o template pode ser editado e a excecao removida sem querer */
['plate', 'chassi', 'renavam', 'cnpj', 'full_name'].forEach((p) =>
  q.forEach((x) => ok(x.sql.indexOf(p) < 0, 'PII ' + p + ' em ' + x.queryName)));
q.forEach((x) => {
  ok(x.sql.indexOf('OVER') < 0, 'funcao de janela em ' + x.queryName);
  let d = 0; for (const ch of x.sql) { if (ch === '(') d++; if (ch === ')') d--; if (d < 0) break; }
  ok(d === 0, 'parenteses desbalanceados em ' + x.queryName);
});

/* as colunas do pedido tem de estar la */
['o.price AS venda', 'a.fipe_price AS valor_fipe_anuncio', 'ver.code_fipe AS codigo_fipe']
  .forEach((c) => ok(pags[0].sql.indexOf(c) >= 0, 'coluna obrigatoria ausente: ' + c));
/* e o desagio NAO pode vir do banco: ele e derivado, calculado na analise */
ok(pags[0].sql.indexOf('desagio') < 0, 'desagio nao deve vir do SQL — e derivada');

if (falhas.length) {
  console.error('\nFALHAS:\n - ' + falhas.join('\n - '));
  process.exit(1);
}

const saida = path.join(HERE, 'sonda-04-queries.gerado.js');
fs.writeFileSync(saida, src, 'utf8');

console.log('\n═══ SONDA 4 MONTADA ═══\n');
console.log('  amostra:    ' + cfg.nome);
console.log('  codigos:    ' + (cfg.codigos_fipe.length || 'por n>=' + cfg.n_minimo));
console.log('  janela:     ' + meta.data_ini + ' -> ' + meta.hoje + ' (' + cfg.janela_meses + ' meses)');
console.log('  corte:      razao entre ' + cfg.corte_razao[0] + ' e ' + cfg.corte_razao[1]);
console.log('  colunas:    ' + meta.colunas);
console.log('  esperado:   ' + cfg.vendas_esperadas + ' vendas');
console.log('  chamadas:   ' + q.length + ' (1 gabarito + ' + pags.length + ' paginas de ' + cfg.page + ')');
console.log('  no gerado:  ' + path.basename(saida) + ' — ' + (src.length / 1024).toFixed(1) + ' KB');
console.log('\n  todas as provas passaram\n');
