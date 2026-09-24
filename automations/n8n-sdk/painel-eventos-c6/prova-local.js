/* Provas do Painel de Eventos C6 — sem n8n e sem banco.

     node prova-local.js

   Roda os nós de verdade (não cópias) contra a coleta em dados-local.json
   (gerada por `python coleta_local.py`) e confere o que dá para conferir
   sem olhar tela. Falha com código 1 se qualquer prova cair. */

const fs = require('fs');
const path = require('path');
const { roda } = require('./_roda_no');
const injetor = require('./_aplica-modelo');

let ok = 0;
let falhas = 0;
const prova = (nome, cond, detalhe) => {
  if (cond) { ok++; return; }
  falhas++;
  console.error('✗ ' + nome + (detalhe !== undefined ? '  → ' + JSON.stringify(detalhe) : ''));
};
const ler = (a) => fs.readFileSync(path.join(__dirname, a), 'utf8');

/* ── 1. os arquivos que viajam pro n8n ─────────────────────────────── */
for (const a of ['montar-consultas.js', 'montar-painel.js', 'virar-arquivo.js']) {
  prova(a + ' sem barra invertida', ler(a).indexOf(String.fromCharCode(92)) < 0);
}
const painelFonte = ler('montar-painel.js');
prova('bloco TEMA igual ao que o injetor produz hoje', painelFonte.indexOf(injetor.blocoTema) >= 0);
prova('bloco LOGOS igual ao que o injetor produz hoje', painelFonte.indexOf(injetor.blocoLogos) >= 0);

/* ── 2. as consultas ────────────────────────────────────────────────── */
const itens = roda('montar-consultas.js');
prova('cinco consultas', itens.length === 5, itens.length);
itens.forEach((it) => {
  const q = it.json;
  prova(q.queryName + ': uma linha só (COUNT + JSON_ARRAYAGG)',
    q.sql.indexOf('SELECT COUNT(*) AS total, JSON_ARRAYAGG(JSON_ARRAY(') === 0);
  prova(q.queryName + ': sem função de janela', q.sql.toUpperCase().indexOf('OVER(') < 0 &&
    q.sql.toUpperCase().indexOf('OVER (') < 0);
  prova(q.queryName + ': sem NOW/CURDATE (o banco é UTC)', q.sql.indexOf('NOW(') < 0 && q.sql.indexOf('CURDATE') < 0);
  prova(q.queryName + ': recorte no whitelabel 43', q.sql.indexOf('ew.whitelabel_id = 43') > 0);
  prova(q.queryName + ': piso literal', q.sql.indexOf("'" + q.meta.piso + "'") > 0, q.meta.piso);
  prova(q.queryName + ': sem documento de pessoa',
    ['document', 'email', 'phone', 'renavam'].every((p) => q.sql.toLowerCase().indexOf(p) < 0));
  /* o CNPJ entra SÓ na consulta de lojas, como chave do cruzamento com a
     planilha de representantes — e a prova do HTML confere que não sai */
  prova(q.queryName + ': CNPJ só na consulta de lojas',
    (q.sql.toLowerCase().indexOf('cnpj') >= 0) === (q.queryName === 'lojas'));
  prova(q.queryName + ': key account saiu', q.sql.indexOf('key_account') < 0);
});

/* ── 3. o painel contra a coleta real ──────────────────────────────── */
const arq = path.join(__dirname, 'dados-local.json');
if (!fs.existsSync(arq)) {
  console.error('dados-local.json não existe — rode `python coleta_local.py` (precisa de VPN)');
  process.exit(1);
}
const d = JSON.parse(fs.readFileSync(arq, 'utf8'));
const arqPlan = path.join(__dirname, 'dados-planilha-local.json');
if (!fs.existsSync(arqPlan)) {
  console.error('dados-planilha-local.json não existe — rode `python _planilha_local.py`');
  process.exit(1);
}
const planilha = JSON.parse(fs.readFileSync(arqPlan, 'utf8'));
const nos = { 'Montar Consultas': d.consultas, 'MCP Consultas': d.mcp, 'Ler Representantes': planilha };
const coletaTemCnpj = d.consultas[3].json.cols.indexOf('cnpj') >= 0;
if (!coletaTemCnpj) {
  console.log('⚠ dados-local.json é de antes do CNPJ entrar na consulta de lojas: o cruzamento com');
  console.log('  CNPJ REAL não é provado aqui — só o sintético (seção 7). Rode coleta_local.py com VPN.');
}
const out = roda('montar-painel.js', nos)[0].json;
const R = out.resumo;
const cru = {};
d.consultas.forEach((c, i) => {
  const row = d.mcp[i].json.structuredContent.rows[0];
  cru[c.json.queryName] = JSON.parse(row[1] || '[]').map((a) => {
    const o = {}; c.json.cols.forEach((k, j) => { o[k] = a[j]; }); return o;
  });
});

prova('um veículo por negociação da coleta', R.veiculos === cru.veiculos.length, [R.veiculos, cru.veiculos.length]);
prova('todo lance entra na conta', R.kpi.lances === cru.ofertas.length, [R.kpi.lances, cru.ofertas.length]);
prova('com + sem oferta = publicados', R.kpi.com_oferta + R.kpi.sem_oferta === R.kpi.publicados);
const somaEv = (f) => R.por_evento.reduce((t, e) => t + e.kpi[f], 0);
['publicados', 'vendidos', 'lances', 'com_oferta', 'vmv_atingido'].forEach((f) =>
  prova('soma dos eventos = total: ' + f, somaEv(f) === R.kpi[f], [somaEv(f), R.kpi[f]]));
const vendCru = cru.veiculos.filter((v) => [2, 3, 7].indexOf(Number(v.status)) >= 0).length;
prova('vendidos = status 2, 3 e 7 na coleta', R.kpi.vendidos === vendCru, [R.kpi.vendidos, vendCru]);
const lojasCru = new Set(cru.ofertas.map((o) => o.loja).filter((x) => x !== null)).size;
prova('lojas ofertantes = lojas distintas nas ofertas', R.kpi.ofertantes === lojasCru, [R.kpi.ofertantes, lojasCru]);

/* medição independente de 2026-09-24 (consulta m1, feita antes do nó
   existir): eventos encerrados não mudam mais, então o número tem que
   bater para sempre. */
const MEDIDO = { 23957: [48, 506, 50], 23852: [57, 262, 44], 23969: [25, 130, 32], 23938: [20, 200, 31] };
Object.keys(MEDIDO).forEach((id) => {
  const e = R.por_evento.find((x) => x.id === Number(id));
  if (!e) return;
  const m = MEDIDO[id];
  prova('evento ' + id + ' bate com a medição independente',
    e.kpi.publicados === m[0] && e.kpi.lances === m[1] && e.kpi.ofertantes === m[2],
    [e.kpi.publicados, e.kpi.lances, e.kpi.ofertantes, 'medido', m]);
});

/* pontuação recalculada do zero, a partir das ofertas cruas */
const negEv = {};
cru.veiculos.forEach((v) => { negEv[v.neg] = v.evento; });
const ofPorId = {};
cru.ofertas.forEach((o) => { ofPorId[o.id] = o; });
const pares = {};
cru.ofertas.forEach((o) => { pares[negEv[o.neg] + '|' + o.loja + '|' + o.neg] = 1; });
const pontos = {};
Object.keys(pares).forEach((k) => { const loja = k.split('|')[1]; pontos[loja] = (pontos[loja] || 0) + 1; });
cru.veiculos.forEach((v) => {
  if ([2, 3, 7].indexOf(Number(v.status)) < 0 || v.vencedora === null) return;
  const o = ofPorId[v.vencedora];
  if (o) pontos[o.loja] = (pontos[o.loja] || 0) + 10;
});
R.top_lojas.forEach((t) => prova('pontos da loja ' + t.loja + ' recalculados do cru',
  pontos[String(t.loja)] === t.pontos, [t.pontos, pontos[String(t.loja)]]));
const maior = Math.max.apply(null, Object.values(pontos));
prova('a primeira do ranking tem a maior pontuação', R.top_lojas[0].pontos === maior, [R.top_lojas[0].pontos, maior]);

/* ── 4. o HTML ──────────────────────────────────────────────────────── */
const h = out.html;
const semScript = h.split('<script>')[0];
prova('HTML sem requisição de rede', semScript.indexOf('src="http') < 0 && h.indexOf('<link') < 0 &&
  h.indexOf('@import') < 0 && h.indexOf('url(http') < 0);
prova('logo em data URI', h.indexOf('data:image/svg+xml;base64,') > 0);
prova('tema C6 depois do tema base', h.indexOf('#DCDCDC') > h.indexOf('#D8E1E9') && h.indexOf('#D8E1E9') > 0);
prova('nenhum azul da Cars2You sobrando nos tokens do C6',
  h.slice(h.indexOf('#DCDCDC')).indexOf('#487DEA') < 0 && h.slice(h.indexOf('#DCDCDC')).indexOf('#1523A0') < 0);
prova('sem CNPJ, e-mail ou telefone no dado', ['"cnpj"', '"email"', 'whatsapp', 'comercial_number'].every((p) => h.indexOf(p) < 0));
prova('nenhum "</script" dentro do dado', h.split('</script>').length === 2);
prova('glossário é o último bloco antes do rodapé', h.indexOf('id="gloss"') > h.indexOf('id="tab-novas"') &&
  h.indexOf('class="rodape"') > h.indexOf('id="gloss"'));
prova('glossário nasce fechado', h.indexOf('<details class="cartao gloss" id="gloss">') > 0);
prova('tamanho razoável', R.bytes_html > 60000 && R.bytes_html < 3000000, R.bytes_html);

/* ── 4b. a versão enxuta que vai para o n8n faz o mesmo HTML ─────────── */
const { enxuga } = require('./_enxuga');
const enxuto = enxuga(painelFonte);
prova('n8n/montar-painel.js está em dia com a fonte',
  fs.existsSync(path.join(__dirname, 'n8n', 'montar-painel.js')) && ler('n8n/montar-painel.js') === enxuto);
const outEnx = roda('n8n/montar-painel.js', nos)[0].json;
/* o HTML inteiro NÃO é igual, e é o certo: o toString() das funções leva os
   comentários junto, e o enxuto não tem. O que tem que ser igual é o que
   sai do cálculo, a marcação fora do script e o dado embutido. */
const semBytes = (r) => JSON.stringify(Object.assign({}, r, { bytes_html: 0 }));
prova('nó enxuto calcula o mesmo resumo', semBytes(outEnx.resumo) === semBytes(R));
prova('nó enxuto: mesma marcação fora do script', outEnx.html.split('<script>')[0] === h.split('<script>')[0]);
const dadoDe = (s) => s.slice(s.lastIndexOf('APP({'));
prova('nó enxuto: mesmo dado embutido', dadoDe(outEnx.html) === dadoDe(h) && dadoDe(h).length > 1000);
prova('nó enxuto sem comentário de bloco fora de string', enxuga(enxuto) === enxuto);

/* ── 5. o Virar Arquivo ─────────────────────────────────────────────── */
const va = roda('virar-arquivo.js', {}, [{ json: out }])[0];
const volta = Buffer.from(va.binary.data.data, 'base64').toString('utf8');
prova('arquivo começa com BOM', volta.charCodeAt(0) === 0xFEFF);
prova('arquivo = HTML byte a byte', volta.slice(1) === h);
prova('caminho no SharePoint', va.json.caminho === 'Painel%20de%20Eventos%20C6/painel-eventos-c6.html', va.json.caminho);
let barrou = false;
try { roda('virar-arquivo.js', {}, [{ json: { html: '<html></html>' } }]); } catch (e) { barrou = true; }
prova('Virar Arquivo recusa HTML raquítico', barrou);

/* ── 6. o pacote incompleto derruba o run ───────────────────────────── */
const sabotado = JSON.parse(JSON.stringify(d.mcp));
const linhaOf = sabotado[2].json.structuredContent.rows[0];
const arr = JSON.parse(linhaOf[1]);
arr.pop();
linhaOf[1] = JSON.stringify(arr);
let caiu = '';
try { roda('montar-painel.js', Object.assign({}, nos, { 'MCP Consultas': sabotado })); } catch (e) { caiu = e.message; }
prova('pacote com uma linha a menos derruba o run', caiu.indexOf('Pacote incompleto em ofertas') === 0, caiu);

/* ── 7. o representante comercial ───────────────────────────────────────
   Cada caso da regra, com CNPJs TIRADOS da planilha real e plantados em
   lojas da coleta: a contagem aqui é independente da do nó. */
const soDig = (v) => String(v || '').split('').filter((c) => c >= '0' && c <= '9').join('');
const votosP = {};
planilha.forEach((it) => {
  const c = soDig(it.json.NR_CNPJ).padStart(14, '0');
  votosP[c] = votosP[c] || {};
  const r = String(it.json.USUARIO_GP || '').trim();
  if (r) votosP[c][r] = (votosP[c][r] || 0) + 1;
});
const casoDe = (c) => {
  const v = votosP[c];
  if (!v) return 'fora';
  const reps = Object.keys(v).sort((a, b) => v[b] - v[a]);
  if (!reps.length) return 'vazio';
  if (reps.length === 1) return 'unico';
  return v[reps[0]] === v[reps[1]] ? 'empate' : 'maioria';
};
const achaCnpj = (caso) => Object.keys(votosP).find((c) => casoDe(c) === caso);
const CASOS = {
  unico: achaCnpj('unico'), maioria: achaCnpj('maioria'), empate: achaCnpj('empate'),
  vazio: achaCnpj('vazio'), fora: '00000000000191', sem_cnpj: null
};
prova('a planilha real tem os quatro casos', ['unico', 'maioria', 'empate', 'vazio'].every((k) => CASOS[k]), CASOS);

/* a coleta com a coluna de CNPJ plantada: 6 lojas com os casos, o resto fora */
const sint = JSON.parse(JSON.stringify(d));
const cLojas = sint.consultas[3].json;
const rowL = sint.mcp[3].json.structuredContent.rows[0];
const linhasL = JSON.parse(rowL[1]);
const velhas = cLojas.cols;
cLojas.cols = ['id', 'nome', 'wl', 'situacao', 'cadastro', 'apagada', 'cnpj'];
const ordem = Object.keys(CASOS);
const plantado = {};
const novasL = linhasL.map((a, i) => {
  const o = {}; velhas.forEach((k, j) => { o[k] = a[j]; });
  const caso = i < ordem.length ? ordem[i] : 'fora';
  plantado[o.id] = caso;
  const cnpj = caso === 'fora' ? '00000000000191' : CASOS[caso];
  return cLojas.cols.map((k) => (k === 'cnpj' ? cnpj : o[k]));
});
rowL[1] = JSON.stringify(novasL);
const outS = roda('montar-painel.js', Object.assign({}, nos, { 'Montar Consultas': sint.consultas, 'MCP Consultas': sint.mcp }))[0].json;
const dadosDe = (html) => {
  const s = html.slice(html.lastIndexOf('APP({') + 4);
  return JSON.parse(s.slice(0, s.lastIndexOf(',{"claro"')));
};
const D = dadosDe(outS.html);
const repDe = {};
D.lojas.forEach((l) => { repDe[l.id] = l.representante; });
const esperado = (caso, c) => {
  if (caso === 'unico' || caso === 'maioria') {
    const v = votosP[c];
    return Object.keys(v).sort((a, b) => v[b] - v[a])[0];
  }
  return 'Sem Representante';
};
Object.keys(plantado).slice(0, ordem.length).forEach((id) => {
  const caso = plantado[id];
  prova('representante no caso ' + caso, repDe[id] === esperado(caso, CASOS[caso]), [repDe[id], esperado(caso, CASOS[caso])]);
});
const RR = outS.resumo.representantes;
prova('resumo conta cada caminho do cruzamento',
  RR.unico === 1 && RR.maioria === 1 && RR.empate === 1 && RR.vazio_planilha === 1 && RR.sem_cnpj === 1 &&
  RR.fora_planilha === linhasL.length - 5, RR);
prova('linhas da planilha contadas', RR.linhas_planilha === planilha.length, RR.linhas_planilha);
prova('empate, maioria e loja sem CNPJ viram aviso', ['mais de um representante', 'empate entre', 'sem CNPJ no banco']
  .every((t) => outS.resumo.avisos.some((a) => a.indexOf(t) >= 0)), outS.resumo.avisos);
prova('CNPJ não vaza para o HTML', ['unico', 'maioria', 'empate', 'vazio'].every((k) => outS.html.indexOf(CASOS[k]) < 0) &&
  D.lojas.every((l) => l.cnpj === undefined));
/* a calcula() que está DENTRO do HTML publicado, e não uma cópia */
const scr = outS.html.slice(outS.html.indexOf('<script>') + 8);
const calculaDaPagina = new Function(scr.slice(0, scr.indexOf('function APP(')) + 'return calcula;')();
const reps = calculaDaPagina(D, 'todos').representantes;
prova('ranking de representantes termina em Sem Representante',
  reps.length > 1 && reps[reps.length - 1].representante === 'Sem Representante' &&
  reps.slice(0, -1).every((g) => g.representante !== 'Sem Representante'), reps.map((g) => g.representante));
prova('pontos dos representantes somam os das lojas',
  reps.reduce((t, g) => t + g.pontos, 0) === calculaDaPagina(D, 'todos').lojas.reduce((t, l) => t + l.pontos, 0));
prova('KPI conta as lojas ofertantes sem representante', typeof outS.resumo.kpi.sem_representante === 'number');

/* a planilha que não serve derruba o run, nas três formas */
const caiCom = (plan) => {
  try { roda('montar-painel.js', Object.assign({}, nos, { 'Ler Representantes': plan })); return ''; } catch (e) { return e.message; }
};
prova('planilha que não veio derruba o run', caiCom([{ json: { error: { message: '404' } } }]).indexOf('nao veio') > 0);
prova('planilha sem USUARIO_GP derruba o run',
  caiCom(planilha.map((it) => ({ json: { NR_CNPJ: it.json.NR_CNPJ } }))).indexOf('sem as colunas') > 0);
prova('planilha truncada derruba o run', caiCom(planilha.slice(0, 50)).indexOf('abaixo do piso') > 0);

console.log((falhas ? '✗' : '✓') + ' %d provas, %d falha(s)', ok + falhas, falhas);
if (falhas) process.exit(1);
