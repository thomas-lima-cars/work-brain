/* Montar HTML — junta as respostas do MCP no objeto D e injeta no template.
   Contrato de entrada (o mesmo dos outros relatorios):
     $('Montar Queries').all()[i].json = { queryName, wl, ... }
     $('MCP Run').all()[i].json.structuredContent = { columns: [], rows: [[]] }
   O template e o HTML da "Versao A" com o dado trocado por marcador. Quem
   desenha e o navegador: o D aqui so carrega numero. */
/* O template mora em dois nos proprios (Template Topo e Template Script): o
   jsCode viaja inteiro pela API do MCP, e no de 87 KB ja nao passou. */
const TEMPLATE = $('Template Topo').first().json.t + $('Template Script').first().json.t;
const CONST = __CONST_JSON__;

const qs = $('Montar Queries').all().map(function (i) { return i.json; });
const outs = $('MCP Run').all().map(function (i) { return i.json; });
if (qs.length !== outs.length) throw new Error('Consultas (' + qs.length + ') e respostas (' + outs.length + ') nao batem');

const num = function (v) { return v == null ? 0 : (typeof v === 'number' ? v : Number(v) || 0); };

/* zip: colunas x linhas -> objetos. Resposta sem structuredContent = a consulta
   falhou; melhor parar aqui do que publicar um relatorio com furo. */
function dados(wl, nome) {
  const r = [];
  qs.forEach(function (q, i) {
    if (q.wl !== wl || q.queryName !== nome) return;
    const sc = outs[i].structuredContent;
    if (!sc || !sc.columns || !sc.rows) {
      throw new Error('Consulta ' + nome + ' (canal ' + wl + ') sem resposta: ' + JSON.stringify(outs[i]).slice(0, 300));
    }
    sc.rows.forEach(function (row) {
      const o = {}; sc.columns.forEach(function (c, k) { o[c] = row[k]; }); r.push(o);
    });
  });
  return r;
}

/* 12 meses, do mais antigo ao corrente */
/* Relogio de Brasilia (o n8n roda em UTC) */
const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
const pad = function (n) { return String(n).padStart(2, '0'); };
const NOMES_MES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const meses = [], MON = [];
for (let k = 11; k >= 0; k--) {
  const d = new Date(now.getFullYear(), now.getMonth() - k, 1);
  meses.push(d.getFullYear() + '-' + pad(d.getMonth() + 1));
  MON.push(NOMES_MES[d.getMonth()] + '/' + String(d.getFullYear()).slice(2));
}

/* Pacote global (Raio-X, filtro de periodo): junta as partes e confere cada uma
   contra o total que o proprio banco contou. Parte faltando ou curta = aborta. */
function pacote(nome) {
  const partes = [];
  let esperadas = null;
  qs.forEach(function (q, i) {
    if (q.queryName !== nome) return;
    esperadas = q.partes;
    const sc = outs[i].structuredContent;
    if (!sc || !sc.rows || !sc.rows.length) throw new Error('Pacote ' + nome + ' parte ' + (q.parte + 1) + ' sem resposta: ' + JSON.stringify(outs[i]).slice(0, 300));
    const ci = sc.columns.indexOf('linhas'), ct = sc.columns.indexOf('total');
    const raw = sc.rows[0][ci < 0 ? 1 : ci];
    const itens = raw == null ? [] : (typeof raw === 'string' ? JSON.parse(raw) : raw);
    const total = Number(sc.rows[0][ct < 0 ? 0 : ct]) || 0;
    if (itens.length !== total) throw new Error('TRAVA DE CONTAGEM em ' + nome + ' parte ' + (q.parte + 1) + ': banco contou ' + total + ', chegaram ' + itens.length + '. Abortado.');
    partes[q.parte] = itens;
  });
  if (esperadas == null) throw new Error('Pacote ' + nome + ' nao foi pedido');
  for (let k = 0; k < esperadas; k++) if (!partes[k]) throw new Error('Pacote ' + nome + ': parte ' + (k + 1) + ' de ' + esperadas + ' nao chegou. Abortado.');
  return [].concat.apply([], partes);
}
const cnpjFmt = function (c) { c = String(c == null ? '' : c).replace(/\D/g, ''); return c.length === 14 ? c.slice(0, 2) + '.' + c.slice(2, 5) + '.' + c.slice(5, 8) + '/' + c.slice(8, 12) + '-' + c.slice(12) : ''; };
/* Tudo vira numero, menos a coluna de texto (rotulo da dimensao) indicada */
const nums = function (rows, texto) { return rows.map(function (r) { return r.map(function (v, j) { return j === texto ? String(v == null ? '' : v) : num(v); }); }); };
/* Consulta de canal empacotada (uma linha com total + linhas): mesma trava dos pacotes */
function linhas(wl, nome) {
  const r = dados(wl, nome)[0];
  if (!r) throw new Error('Consulta ' + nome + ' (canal ' + wl + ') sem linha');
  const itens = r.linhas == null ? [] : (typeof r.linhas === 'string' ? JSON.parse(r.linhas) : r.linhas);
  if (itens.length !== num(r.total)) throw new Error('TRAVA DE CONTAGEM em ' + nome + ' (canal ' + wl + '): banco contou ' + r.total + ', chegaram ' + itens.length);
  return itens;
}

const canais = {};
const ids = [];
qs.forEach(function (q) { if (q.wl && ids.indexOf(q.wl) < 0) ids.push(q.wl); });

ids.forEach(function (wl) {
  const k = dados(wl, 'kpi')[0] || {};
  const base = num(k.total_base), comLogin = num(k.com_login);
  const c = {
    kpi: {
      base: base, comLogin: comLogin, semLogin: base - comLogin,
      ofertantes: num(k.ofertantes), compradores: num(k.compradores),
      ofertas: num(k.total_ofertas), negociacoes: num(k.negociacoes),
      volume: num(k.volume), ultima: k.ultima_compra || null
    },
    situacao: {}, recencia: { login: {}, oferta: {}, compra: {} },
    evolucao: {}, volume: {}, coorteAcum: {}, coorteJanela: {}, uf: {}, top: [],
    cadDia: {}, anuncios: {}, baseAcum: {}, ufCompra: {}
  };
  dados(wl, 'cad_dia').forEach(function (r) { c.cadDia[String(r.dia).slice(0, 10)] = num(r.novos); });
  dados(wl, 'anuncios').forEach(function (r) {
    c.anuncios[r.mes] = { publicados: num(r.publicados), criados: num(r.criados), ofertas: num(r.ofertas), vendidos: num(r.vendidos) };
  });
  dados(wl, 'base_acum').forEach(function (r) {
    c.baseAcum[r.mes] = { compraram: num(r.compraram), ofertaram: num(r.ofertaram), acessaram: num(r.acessaram), nunca: num(r.nunca) };
  });
  dados(wl, 'uf_compra').forEach(function (r) { c.ufCompra[r.uf] = { compras: num(r.compras), volume: num(r.volume) }; });

  dados(wl, 'situacao').forEach(function (r) { c.situacao[String(r.situation)] = num(r.qtd); });
  dados(wl, 'recencia').forEach(function (r) { if (c.recencia[r.tipo]) c.recencia[r.tipo][r.faixa] = num(r.qtd); });

  /* evolucao: so entra o mes em que houve atividade (o navegador trata ausente como zero) */
  const evo = function (m, tipo) { if (!c.evolucao[m]) c.evolucao[m] = {}; if (!c.evolucao[m][tipo]) c.evolucao[m][tipo] = { qtd: 0, novos: 0 }; return c.evolucao[m][tipo]; };
  dados(wl, 'evol_login').forEach(function (r) { evo(r.mes, 'login').qtd = num(r.unicos); });
  dados(wl, 'evol_oferta').forEach(function (r) { evo(r.mes, 'oferta').qtd = num(r.unicos); });
  dados(wl, 'evol_compra').forEach(function (r) {
    evo(r.mes, 'compra').qtd = num(r.unicos);
    c.volume[r.mes] = { valor: num(r.volume), qtd: num(r.qtd) };
  });
  dados(wl, 'evol_cadastro').forEach(function (r) { evo(r.mes, 'cadastro').qtd = num(r.qtd); });
  dados(wl, 'nov_login').forEach(function (r) { if (c.evolucao[r.mes] && c.evolucao[r.mes].login) c.evolucao[r.mes].login.novos = num(r.novos); });
  dados(wl, 'nov_oferta').forEach(function (r) { if (c.evolucao[r.mes] && c.evolucao[r.mes].oferta) c.evolucao[r.mes].oferta.novos = num(r.novos); });
  dados(wl, 'nov_compra').forEach(function (r) { if (c.evolucao[r.mes] && c.evolucao[r.mes].compra) c.evolucao[r.mes].compra.novos = num(r.novos); });

  dados(wl, 'coorte_acum').forEach(function (r) {
    c.coorteAcum[r.mes] = { wl: wl, mes: r.mes, cadastrados: num(r.cadastrados), acessaram: num(r.acessaram), ofertaram: num(r.ofertaram), compraram: num(r.compraram), sem_interacao: num(r.sem_interacao) };
  });
  dados(wl, 'coorte_janela').forEach(function (r) {
    const o = { wl: wl, mes: r.mes };
    Object.keys(r).forEach(function (f) { if (f !== 'mes') o[f] = num(r[f]); });
    c.coorteJanela[r.mes] = o;
  });
  dados(wl, 'uf').forEach(function (r) { c.uf[r.uf] = num(r.qtd); });
  linhas(wl, 'top').forEach(function (r) {
    c.top.push({ id: num(r[0]), nome: r[1], loja: r[2] || null, compras: num(r[3]), valor: num(r[4]), ultima: r[5] || null });
  });
  c.top.sort(function (a, b) { return (b.compras - a.compras) || (a.id - b.id); });
  canais[wl] = c;
});

/* canais do maior para o menor; o rotulo do seletor leva o tamanho da base */
const nomes = {};
ids.forEach(function (wl) { const q = qs.find(function (x) { return x.wl === wl; }); nomes[wl] = q.canal; });
const ordem = ids.slice().sort(function (a, b) { return canais[b].kpi.base - canais[a].kpi.base; });
/* Bit de cada canal na mascara dos clientes: a ordem e a das consultas (CANAIS
   do Montar Queries), nao a do seletor */
const BIT = {};
ids.forEach(function (wl, i) { BIT[wl] = 1 << i; });
const U = pacote('usuarios').map(function (r) {
  return [num(r[0]), num(r[1]), String(r[2] || '').trim(), String(r[3] || '').trim(), cnpjFmt(r[4])];
});
/* Linhas por pessoa: [cliente, mes, comitente, ...]. Acesso nao tem comitente. */
const RX = {
  totais: nums(pacote('rx_totais')), modelo: nums(pacote('rx_modelo'), 3), laudo: nums(pacote('rx_laudo'), 3),
  uf: nums(pacote('rx_uf'), 3), faixa: nums(pacote('rx_faixa'), 3), partic: nums(pacote('rx_partic'))
};
const ATV = nums(pacote('atv'));
const LANCES = nums(pacote('lances'));
const COM = {};
pacote('comitentes').forEach(function (r) { COM[num(r[0])] = String(r[1] || '').trim(); });
/* Cliente com atividade e sem cadastro no pacote de usuarios = as consultas
   discordam sobre quem e cliente. Melhor parar do que mostrar id sem nome. */
const temU = {};
U.forEach(function (u) { temU[u[0]] = 1; });
[ATV, LANCES, RX.totais, RX.partic].forEach(function (rows) {
  rows.forEach(function (r) { if (!temU[r[0]]) throw new Error('Cliente ' + r[0] + ' com atividade e fora do pacote de usuarios'); });
});

const dias30 = [];
for (let k = 29; k >= 0; k--) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - k);
  dias30.push(d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()));
}
const D = { ordem: ordem.map(String), nomes: nomes, canais: canais, MON: MON, meses: meses, SITU: CONST.SITU, TIPS: CONST.TIPS,
  BIT: BIT, U: U, ATV: ATV, LANCES: LANCES, RX: RX, COM: COM, DIAS: dias30, ANO: now.getFullYear() };

const br = function (n) { return Number(n).toLocaleString('pt-BR'); };
const total = ordem.reduce(function (s, wl) { return s + canais[wl].kpi.base; }, 0);
const opcoes = '<option value="todos">Todos os canais</option>' + ordem.map(function (wl) {
  return '<option value="' + wl + '">' + nomes[wl] + ' &middot; ' + br(canais[wl].kpi.base) + '</option>';
}).join('');
const dataTxt = pad(now.getDate()) + '/' + pad(now.getMonth() + 1) + '/' + now.getFullYear() + ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes());

/* "<" vira < dentro do JSON: nome de loja com </script> nao fecha a tag antes da hora */
const dadosJson = JSON.stringify(D).split('<').join('\\u003c');
let html = TEMPLATE
  .split('{{DATA}}').join(dataTxt)
  .split('{{N_CANAIS}}').join(String(ordem.length))
  .split('{{TOTAL}}').join(br(total))
  .split('{{OPCOES}}').join(opcoes);
html = html.replace('/*__DADOS__*/', function () { return dadosJson; });

return [{ json: { html: html, total: total, canais: ordem.map(function (wl) { return nomes[wl] + ': ' + canais[wl].kpi.base; }) } }];
