/* Montar HTML — junta as respostas do MCP no objeto D e injeta no template.
   Contrato de entrada (o mesmo dos outros relatorios):
     $('Montar Queries').all()[i].json = { queryName, wl, ... }
     $('MCP Run').all()[i].json.structuredContent = { columns: [], rows: [[]] }
   O template e o HTML da "Versao A" com o dado trocado por marcador. Quem
   desenha e o navegador: o D aqui so carrega numero. */
const TEMPLATE = __TEMPLATE_JSON__;
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

const canais = {};
const ids = [];
qs.forEach(function (q) { if (ids.indexOf(q.wl) < 0) ids.push(q.wl); });

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
    evolucao: {}, volume: {}, coorteAcum: {}, coorteJanela: {}, uf: {}, top: []
  };

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
  dados(wl, 'top').forEach(function (r) {
    c.top.push({ loja: r.loja || null, nome: r.nome, valor: num(r.valor), ultima: r.ultima || null, compras: num(r.compras) });
  });
  canais[wl] = c;
});

/* canais do maior para o menor; o rotulo do seletor leva o tamanho da base */
const nomes = {};
ids.forEach(function (wl) { const q = qs.find(function (x) { return x.wl === wl; }); nomes[wl] = q.canal; });
const ordem = ids.slice().sort(function (a, b) { return canais[b].kpi.base - canais[a].kpi.base; });
const D = { ordem: ordem.map(String), nomes: nomes, canais: canais, MON: MON, meses: meses, SITU: CONST.SITU, TIPS: CONST.TIPS };

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
