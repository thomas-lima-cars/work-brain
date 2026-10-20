/* Roda o nó "Montar HTML" fora do n8n, com o dado de coleta_local.py, e
   confere os pacotes por pessoa contra as séries mensais por canal.

     node monta_local.js            -> saida-local.html + provas no console

   Prova cruzada (as duas fontes são consultas diferentes sobre o mesmo banco):
   em cada canal e cada mês, os únicos que acessaram / ofertaram / compraram e o
   volume, contados no pacote por pessoa (o que o filtro de período usa), têm de
   bater com evol_login / evol_oferta / evol_compra. Se baterem, o filtro mostra
   o mesmo número que o gráfico mensal quando um mês só está marcado. */
const fs = require('fs');
const path = require('path');
const { roda } = require('./_roda_no.js');

const AQUI = __dirname;
const dados = JSON.parse(fs.readFileSync(path.join(AQUI, 'dados-local.json'), 'utf8'));
const ler = (n) => fs.readFileSync(path.join(AQUI, n), 'utf8');

/* Os dois nos de template, cortados como o gen_wf.py corta */
const tpl = ler('template.html'), corte = tpl.indexOf('<script>\nvar D = ');
const saida = roda('montar-html.js', {
  'Montar Queries': dados.consultas, 'MCP Run': dados.mcp,
  'Template Topo': [{ json: { t: tpl.slice(0, corte) } }], 'Template Script': [{ json: { t: tpl.slice(corte) } }]
}, { '__CONST_JSON__': JSON.stringify(JSON.parse(ler('constantes.json'))) });
const { html } = saida[0].json;
fs.writeFileSync(path.join(AQUI, 'saida-local.html'), html, 'utf8');
console.log('saida-local.html  ' + (Buffer.byteLength(html) / 1024).toFixed(0) + ' KB');

const D = JSON.parse(html.split('var D = ')[1].split(';\nvar MON=')[0]);
const cm = {};
D.U.forEach((u) => { cm[u[0]] = u[1]; });
let falhas = 0, provas = 0;
const confere = (ok, msg) => { provas++; if (!ok) { falhas++; console.log('✗ ' + msg); } };

D.ordem.forEach((wl) => {
  const bit = D.BIT[wl], c = D.canais[wl];
  D.meses.forEach((m, i) => {
    const ac = new Set(), of = new Set(), cp = new Set();
    let vol = 0, qtd = 0;
    D.ATV.forEach((r) => { if (r[1] === i && cm[r[0]] & bit && r[2] > 0) ac.add(r[0]); });
    D.LANCES.forEach((r) => { if (r[1] === i && cm[r[0]] & bit && r[3] > 0) of.add(r[0]); });
    D.RX.totais.forEach((r) => { if (r[1] === i && cm[r[0]] & bit) { cp.add(r[0]); vol += r[4]; qtd += r[3]; } });
    const ev = (t) => ((c.evolucao[m] || {})[t] || { qtd: 0 }).qtd;
    const v = c.volume[m] || { valor: 0, qtd: 0 };
    confere(ac.size === ev('login'), wl + ' ' + m + ' acessaram ' + ac.size + ' x evol_login ' + ev('login'));
    confere(of.size === ev('oferta'), wl + ' ' + m + ' ofertaram ' + of.size + ' x evol_oferta ' + ev('oferta'));
    confere(cp.size === ev('compra'), wl + ' ' + m + ' compraram ' + cp.size + ' x evol_compra ' + ev('compra'));
    confere(qtd === v.qtd, wl + ' ' + m + ' compras ' + qtd + ' x evol_compra.qtd ' + v.qtd);
    confere(Math.abs(vol - v.valor) <= 1 + qtd, wl + ' ' + m + ' volume ' + vol + ' x evol_compra ' + v.valor);
  });
  /* base acumulada: as quatro fatias fecham a base do mes; no ultimo mes = base de hoje,
     a menos de quem se cadastrou depois do fim do dia (nao deve haver) */
  D.meses.forEach((m) => { const b = c.baseAcum[m]; confere(!!b, wl + ' ' + m + ' sem base acumulada'); });
  const ult = c.baseAcum[D.meses[11]] || {};
  const tot = (ult.compraram || 0) + (ult.ofertaram || 0) + (ult.acessaram || 0) + (ult.nunca || 0);
  confere(tot === c.kpi.base, wl + ' base acumulada do mes corrente ' + tot + ' x kpi.base ' + c.kpi.base);
  const ufc = Object.values(c.ufCompra).reduce((s, x) => s + x.compras, 0);
  confere(ufc === c.kpi.negociacoes, wl + ' compras por UF ' + ufc + ' x kpi.negociacoes ' + c.kpi.negociacoes);
});
/* Comitente: a soma por comitente fecha o total (cada compra e cada lance tem um
   comitente so), e todo comitente com compra tem nome */
const tot = (rows, j) => rows.reduce((t, r) => t + r[j], 0);
const porCom = {};
D.RX.totais.forEach((r) => { porCom[r[2]] = (porCom[r[2]] || 0) + r[3]; });
confere(Object.values(porCom).reduce((a, b) => a + b, 0) === tot(D.RX.totais, 3), 'compras por comitente nao fecham o total');
Object.keys(porCom).forEach((k) => confere(!!D.COM[k], 'comitente ' + k + ' sem nome'));
/* Top 100: a uniao dos canais sem pessoa repetida e o maior numero de compras bate */
D.ordem.forEach((wl) => {
  const t = D.canais[wl].top;
  confere(t.length <= 100 && new Set(t.map((x) => x.id)).size === t.length, wl + ' top com repetido ou mais de 100');
  for (let k = 1; k < t.length; k++) confere(t[k - 1].compras >= t[k].compras, wl + ' top fora de ordem');
});
console.log(provas - falhas + '/' + provas + ' provas ok');
process.exitCode = falhas ? 1 : 0;
