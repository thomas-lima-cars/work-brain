/* Injeta `amostra-modelo.config.json` em `sonda-10-template.js` e prova o resultado.
 *
 * Uso: node monta-sonda-10.js
 * Saída: sonda-04-queries.gerado.js  (é este arquivo que sobe pro n8n)
 *
 * Existe pra a amostra ter UMA fonte de verdade. Antes de haver isto, trocar o
 * recorte era editar a lista de códigos dentro de uma string dentro do nó —
 * que é exatamente onde erro de vírgula não é pego por validador nenhum.
 */
const fs = require('fs');
const path = require('path');
const HERE = __dirname;

const cfg = JSON.parse(fs.readFileSync(path.join(HERE, 'amostra-modelo.config.json'), 'utf8'));
const tpl = fs.readFileSync(path.join(HERE, 'sonda-10-template.js'), 'utf8');

const MARCA = '/*__CONFIG__*/null';
if (tpl.split(MARCA).length !== 2) {
  console.error('X marcador __CONFIG__ ausente ou repetido no template');
  process.exit(1);
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

/* os 20 modelos e as categorias excluidas chegaram inteiros na SQL */
cfg.modelos.forEach((m) => {
  const chave = m.marca + '|' + m.modelo;
  ok(pags[0].sql.indexOf("'" + chave + "'") >= 0, 'modelo ausente na SQL: ' + chave);
});
cfg.excluir_categorias.forEach((c) =>
  ok(pags[0].sql.indexOf("'" + c + "'") >= 0, 'categoria excluida ausente: ' + c));
ok(pags[0].sql.indexOf('NOT IN (') >= 0, 'filtro de motos/pesados ausente');
/* o controle da regressao tem de vir como coluna */
ok(pags[0].sql.indexOf('AS grupo') >= 0, 'coluna `grupo` ausente: a regressao nao teria controle');
/* e o filtro de categoria e por LINHA, nunca por MAX agregado */
ok(pags[0].sql.indexOf('MAX(cat.name)') < 0, 'categoria por MAX agregado de novo nao');

/* ALIAS REPETIDO NO FROM — a prova que faltava.
   Ao adaptar a sonda 4 pra modelo eu anexei models/brands/categories ao FROM
   sem ver que ja estavam la. Alias duplicado e erro de SQL, e teria queimado
   as 96 chamadas antes de qualquer um perceber. Nenhuma prova pegava isso. */
const aliases = (pags[0].sql.match(/JOIN\s+(\w+)\s+(\w+)\s+ON/g) || [])
  .map((j) => j.trim().split(/\s+/)[2]);
const repetidos = aliases.filter((a, i) => aliases.indexOf(a) !== i);
ok(repetidos.length === 0,
   'alias repetido no FROM: ' + Array.from(new Set(repetidos)).join(', '));
/* NAO conferir "mesma tabela duas vezes": `advertisements` entra legitimamente
   duas vezes — como a2 dentro da subquery do MAX e como a no FROM principal.
   O que importa e o ALIAS, que e o que a SQL usa pra resolver a coluna. */

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

/* MESMA AMOSTRA = MESMO WHERE.
   As sondas 9 (dimensoes) e 10 (linha a linha) alimentam duas paginas que
   dizem medir a mesma coisa. Se o WHERE divergir, os totais divergem e ninguem
   percebe: cada sonda tem o proprio gabarito, e os dois batem, cada um com o
   seu numero errado. Foi o que aconteceu — a 10 exigia code_fipe e colheu
   4.127 contra 4.582 da 9. */
const g9 = path.join(HERE, 'sonda-09-queries.gerado.js');
if (fs.existsSync(g9)) {
  const itens9 = new Function(fs.readFileSync(g9, 'utf8'))().map((i) => i.json);
  const where = (sql) => {
    const i = sql.indexOf(' WHERE ');
    const fim = ['. GROUP BY ', ' GROUP BY ', ' ORDER BY '].map((t) => sql.indexOf(t, i))
      .filter((x) => x > 0).sort((a, b) => a - b)[0] || sql.lastIndexOf(' LIMIT ');
    return sql.slice(i, fim);
  };
  const w9 = where(itens9.find((x) => x.queryName === 'q_km').sql);
  const w10 = where(pags[0].sql);
  ok(w9 === w10,
     'o WHERE da sonda 10 diverge da 9 — as duas paginas mediriam amostras diferentes.\n' +
     '       sonda 9:  ' + w9 + '\n' +
     '       sonda 10: ' + w10);
}

if (falhas.length) {
  console.error('\nFALHAS:\n - ' + falhas.join('\n - '));
  process.exit(1);
}

const saida = path.join(HERE, 'sonda-10-queries.gerado.js');
fs.writeFileSync(saida, src, 'utf8');

console.log('\n═══ SONDA 10 MONTADA ═══\n');
console.log('  amostra:    ' + cfg.nome);
console.log('  modelos:    ' + cfg.modelos.length + ' (marca+nome)');
console.log('  excluidas:  ' + cfg.excluir_categorias.join(', '));
console.log('  janela:     ' + meta.data_ini + ' -> ' + meta.hoje + ' (' + cfg.janela_meses + ' meses)');
console.log('  corte:      razao entre ' + cfg.corte_razao[0] + ' e ' + cfg.corte_razao[1]);
console.log('  colunas:    ' + meta.colunas);
console.log('  esperado:   ' + cfg.vendas_esperadas + ' vendas');
console.log('  chamadas:   ' + q.length + ' (1 gabarito + ' + pags.length + ' paginas de ' + cfg.page + ')');
console.log('  no gerado:  ' + path.basename(saida) + ' — ' + (src.length / 1024).toFixed(1) + ' KB');
console.log('\n  todas as provas passaram\n');
