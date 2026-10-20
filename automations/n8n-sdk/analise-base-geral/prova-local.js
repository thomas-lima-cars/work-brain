/* Prova local, sem tocar no banco nem no n8n.
   1) Roda montar-queries.js e confere as 148 consultas (18 x 6 canais + 40 partes de pacote).
   2) Gera respostas MCP falsas a partir do D da "Versao A" (o que o banco
      devolveria se os numeros fossem os de 04/09) e roda montar-html.js.
   3) Compara o D remontado com o original, canal a canal.
   Uso: node prova-local.js <D.json> */
const fs = require('fs');
const path = require('path');
const D0 = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

const qsRes = new Function(fs.readFileSync(path.join(__dirname, 'montar-queries.js'), 'utf8'))();
const Q = qsRes.map(function (x) { return x.json; });
let falhas = 0;
const ok = function (c, msg) { if (!c) { falhas++; console.log('✗ ' + msg); } };

ok(Q.length === 148, 'esperava 148 consultas, vieram ' + Q.length);
ok(Q.filter(function (q) { return q.wl; }).length === 108, 'esperava 18 x 6 consultas por canal');
Q.forEach(function (q) {
  ok(!/\bLIMIT\s+\d+\s+OFFSET/.test(q.sql), q.queryName + ' com OFFSET');
  ok((q.sql.match(/\(/g) || []).length === (q.sql.match(/\)/g) || []).length, q.queryName + '/' + q.wl + ' parenteses desbalanceados');
  ok(!/undefined|NaN/.test(q.sql), q.queryName + '/' + q.wl + ' com undefined/NaN');
});
ok(Q.filter(function (q) { return q.wl === 48; }).every(function (q) { return !q.sql.includes('c6bank'); }), 'canal 48 nao pode excluir @c6bank.com');
/* anuncios e sobre as LOJAS do canal, nao sobre a base de clientes: sem filtro de e-mail */
ok(Q.filter(function (q) { return q.wl !== 48 && q.queryName !== 'anuncios'; }).every(function (q) { return q.sql.includes('c6bank'); }), 'demais canais excluem @c6bank.com');

/* --- respostas falsas, na forma do MCP: columns + rows --- */
const MES = D0.meses;
function resposta(q) {
  const c = D0.canais[String(q.wl)];
  const R = function (cols, rows) { return { structuredContent: { columns: cols, rows: rows } }; };
  switch (q.queryName) {
    case 'kpi': return R(['total_base', 'com_login', 'ofertantes', 'total_ofertas', 'compradores', 'negociacoes', 'volume', 'ultima_compra'],
      [[String(c.kpi.base), c.kpi.comLogin, c.kpi.ofertantes, c.kpi.ofertas, c.kpi.compradores, c.kpi.negociacoes, String(c.kpi.volume), c.kpi.ultima]]);
    case 'situacao': return R(['situation', 'qtd'], Object.keys(c.situacao).map(function (s) { return [Number(s), c.situacao[s]]; }));
    case 'recencia': { const rows = []; ['login', 'oferta', 'compra'].forEach(function (t) { Object.keys(c.recencia[t]).forEach(function (f) { rows.push([t, f, c.recencia[t][f]]); }); }); return R(['tipo', 'faixa', 'qtd'], rows); }
    case 'evol_login': return R(['mes', 'unicos'], MES.filter(function (m) { return c.evolucao[m] && c.evolucao[m].login; }).map(function (m) { return [m, c.evolucao[m].login.qtd]; }));
    case 'evol_oferta': return R(['mes', 'unicos'], MES.filter(function (m) { return c.evolucao[m] && c.evolucao[m].oferta; }).map(function (m) { return [m, c.evolucao[m].oferta.qtd]; }));
    case 'evol_compra': return R(['mes', 'unicos', 'qtd', 'volume'], MES.filter(function (m) { return c.volume[m]; }).map(function (m) { return [m, c.evolucao[m] && c.evolucao[m].compra ? c.evolucao[m].compra.qtd : 0, c.volume[m].qtd, String(c.volume[m].valor)]; }));
    case 'evol_cadastro': return R(['mes', 'qtd'], MES.filter(function (m) { return c.evolucao[m] && c.evolucao[m].cadastro; }).map(function (m) { return [m, c.evolucao[m].cadastro.qtd]; }));
    case 'nov_login': case 'nov_oferta': case 'nov_compra': {
      const t = q.queryName.slice(4);
      return R(['mes', 'novos'], MES.filter(function (m) { return c.evolucao[m] && c.evolucao[m][t]; }).map(function (m) { return [m, c.evolucao[m][t].novos]; }));
    }
    /* top virou pacote (top 100, 16/10): uma linha com total + linhas */
    case 'top': return R(['total', 'linhas'], [[c.top.length, JSON.stringify(c.top.map(function (t, i) { return [i + 1, t.nome, t.loja, t.compras, t.valor, t.ultima]; }))]]);
    case 'uf': return R(['uf', 'qtd'], Object.keys(c.uf).map(function (u) { return [u, c.uf[u]]; }));
    case 'coorte_acum': return R(['mes', 'cadastrados', 'acessaram', 'ofertaram', 'compraram', 'sem_interacao'],
      Object.keys(c.coorteAcum).map(function (m) { const r = c.coorteAcum[m]; return [m, r.cadastrados, r.acessaram, r.ofertaram, r.compraram, r.sem_interacao]; }));
    case 'coorte_janela': {
      const cols = ['mes', 'cadastrados', 'ac30', 'ac60', 'ac90', 'ac180', 'of30', 'of60', 'of90', 'of180', 'cp30', 'cp60', 'cp90', 'cp180', 'mad30', 'mad60', 'mad90', 'mad180'];
      return R(cols, Object.keys(c.coorteJanela).map(function (m) { const r = c.coorteJanela[m]; return cols.map(function (k) { return k === 'mes' ? m : (r[k] == null ? 0 : r[k]); }); }));
    }
  }
  /* Consultas da versao 2 (16/10): a Versao A nao tem esse dado. Resposta vazia
     prova que a montagem do que existia nao depende delas; o dado real delas e
     provado por monta_local.js. */
  if (q.parte != null) return R(['total', 'linhas'], [[0, '[]']]);
  if (['cad_dia', 'anuncios', 'base_acum', 'uf_compra'].indexOf(q.queryName) >= 0) return R(['x'], []);
  throw new Error('consulta sem resposta falsa: ' + q.queryName);
}
const R = Q.map(resposta);

const $ = function (nome) {
  if (nome === 'Montar Queries') return { all: function () { return Q.map(function (q) { return { json: q }; }); } };
  if (nome === 'MCP Run') return { all: function () { return R.map(function (r) { return { json: r }; }); } };
  if (nome === 'Template Topo' || nome === 'Template Script') {
    const t = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8'), k = t.indexOf('<script>\nvar D = ');
    const parte = nome === 'Template Topo' ? t.slice(0, k) : t.slice(k);
    return { first: function () { return { json: { t: parte } }; } };
  }
  throw new Error(nome);
};
const modelo = fs.readFileSync(path.join(__dirname, 'montar-html.js'), 'utf8')
  .replace('__CONST_JSON__', fs.readFileSync(path.join(__dirname, 'constantes.json'), 'utf8'));
const saida = new Function('$', modelo)($)[0].json;

/* --- extrai o D do HTML gerado e compara --- */
const html = saida.html;
const i = html.indexOf('var D = ') + 8;
const j = html.indexOf(';\nvar MON=D.MON', i) >= 0 ? html.indexOf(';\nvar MON=D.MON', i) : html.indexOf('; var MON=D.MON', i);
ok(j > 0, 'nao achei o fim do D no HTML');
const D1 = JSON.parse(html.slice(i, j));
ok(JSON.stringify(D1.ordem) === JSON.stringify(D0.ordem), 'ordem dos canais: ' + D1.ordem + ' x ' + D0.ordem);
/* a janela anda com o relogio: em 04/09 ia de 2025-10 a 2026-09; hoje vai de outra data.
   Confiro o formato (12 meses seguidos, rotulo 'Mmm/aa'), nao o valor. */
ok(D1.meses.length === 12 && D1.MON.length === 12 && /^[A-Z][a-z]{2}\/\d\d$/.test(D1.MON[0]), 'janela de 12 meses: ' + D1.meses[0] + '..' + D1.meses[11] + ' ' + D1.MON[0]);
console.log('janela de hoje: ' + D1.meses[0] + ' .. ' + D1.meses[11] + ' (' + D1.MON[0] + ' .. ' + D1.MON[11] + ')');

const sub = function (a, b) { return Object.keys(b).every(function (k) { return JSON.stringify(a[k]) === JSON.stringify(b[k]); }); };
Object.keys(D0.canais).forEach(function (wl) {
  const a = D1.canais[wl], b = D0.canais[wl];
  ['kpi', 'situacao', 'recencia', 'evolucao', 'volume', 'uf'].forEach(function (k) {
    ok(JSON.stringify(a[k]) === JSON.stringify(b[k]), 'canal ' + wl + ' · ' + k + ' difere');
  });
  /* o top agora leva o id (para tirar a pessoa repetida entre canais): compara sem ele */
  const semId = function (l) { return JSON.stringify(l.map(function (t) { return [t.nome, t.loja, t.compras, t.valor, t.ultima]; })); };
  ok(semId(a.top) === semId(b.top), 'canal ' + wl + ' · top difere');
  /* a Versao A guardou coorte no formato antigo (sem 'cadastrados' na janela);
     o novo traz os campos completos — so exijo que o que existia la bata */
  ['coorteAcum', 'coorteJanela'].forEach(function (k) {
    Object.keys(b[k]).forEach(function (m) {
      const novo = a[k][m] || {};
      Object.keys(b[k][m]).forEach(function (f) { if (f !== 'mat') ok(novo[f] === b[k][m][f], 'canal ' + wl + ' · ' + k + '[' + m + '].' + f + ' ' + novo[f] + ' x ' + b[k][m][f]); });
    });
  });
});
ok(html.includes('6 canais &middot; 21.772 clientes'), 'pill de resumo');
ok(!/\{\{[A-Z_]+\}\}|\/\*__DADOS__\*\//.test(html), 'sobrou marcador no HTML');
ok(html.includes('<option value="7">Marketplace Cars2You &middot; 14.747</option>'), 'seletor');

fs.writeFileSync(path.join(__dirname, 'saida-prova.html'), html);
console.log(falhas ? '\n' + falhas + ' falha(s)' : '✓ ' + Q.length + ' consultas e a remontagem do D batem com a Versão A (' + html.length + ' bytes)');
process.exit(falhas ? 1 : 0);
