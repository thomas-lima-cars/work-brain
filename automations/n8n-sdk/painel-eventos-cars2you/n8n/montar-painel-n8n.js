const PECAS = $('Peças do Tema').first().json;
const CSS_TEMA = PECAS.CSS_TEMA;
const LOGO = PECAS.LOGO;
const WL_VITRINE_C6 = [43, 48];
const MIN_CNPJ_CARTEIRA = 500;
const STATUS_NOME = {
  1: 'Ativo', 2: 'Aguardando pagamento', 3: 'Aguardando confirmação de pagamento',
  7: 'Vendido', 8: 'Suspenso', 9: 'Em análise do comprador', 10: 'Cancelado',
  11: 'Sem ofertas', 13: 'Em análise do vendedor', 14: 'Vendedor rejeitou',
  15: 'Comprador rejeitou', 18: 'Venda cancelada'
};
const pedidos = $('Montar Consultas').all().map((i) => i.json);
const respostas = $('MCP Consultas').all();
if (respostas.length !== pedidos.length) {
  throw new Error('MCP Consultas devolveu ' + respostas.length + ' respostas para ' +
    pedidos.length + ' consultas. Sem par um a um nao da para saber qual e qual.');
}
const T = {};
const vistas = {};
pedidos.forEach((p, i) => {
  const r = respostas[i] ? respostas[i].json : null;
  const sc = r ? (r.structuredContent || r) : null;
  if (!sc || !sc.rows || !sc.columns) {
    throw new Error('A consulta ' + p.queryName + ' nao voltou do MCP: ' +
      JSON.stringify(r).slice(0, 400));
  }
  const row = sc.rows[0] || [];
  const total = Number(row[sc.columns.indexOf('total')]);
  let linhas = row[sc.columns.indexOf('linhas')];
  if (typeof linhas === 'string') linhas = JSON.parse(linhas);
  if (linhas === null || linhas === undefined) linhas = [];
  if (!Number.isFinite(total) || linhas.length !== total) {
    throw new Error('Pacote incompleto em ' + p.queryName + ': o banco contou ' + total +
      ' linhas e chegaram ' + linhas.length + '. Publicar meia tabela e pior que nao publicar.');
  }
  if (!T[p.tabela]) T[p.tabela] = [];
  vistas[p.tabela] = (vistas[p.tabela] || 0) + 1;
  linhas.forEach((arr) => {
    if (arr.length !== p.cols.length) {
      throw new Error(p.queryName + ': linha com ' + arr.length + ' colunas, esperadas ' + p.cols.length);
    }
    const o = {};
    p.cols.forEach((k, j) => { o[k] = arr[j]; });
    T[p.tabela].push(o);
  });
});
const META = pedidos[0].meta;
Object.keys(META.partes).forEach((k) => {
  if (vistas[k] !== META.partes[k]) {
    throw new Error('A tabela ' + k + ' chegou em ' + (vistas[k] || 0) + ' parte(s), esperadas ' + META.partes[k]);
  }
});
const num = (x) => (x === null || x === undefined || x === '' ? null : Number(x));
const avisos = [];
const conta = {};
const marca = (chave) => { conta[chave] = (conta[chave] || 0) + 1; };
const CARTEIRA_VELHA_DIAS = 7;
const itCart = $('Ler Carteira').all();
const cj = itCart.length ? itCart[0].json : null;
let CART = cj ? (cj.carteira || cj) : null;
let semCarteira = '';
if (!CART || !Array.isArray(CART.consultores) || !CART.consultores.length ||
    !CART.cnpj || typeof CART.cnpj !== 'object') {
  semCarteira = 'a carteira comercial não veio (ou veio fora do formato): sem o filtro de responsável';
}
const soDigitos = (s) => {
  let o = '';
  const t = String(s === null || s === undefined ? '' : s);
  for (let i = 0; i < t.length; i++) if (t[i] >= '0' && t[i] <= '9') o += t[i];
  return o;
};
const cnpj14 = (s) => { const d = soDigitos(s); return d ? d.padStart(14, '0') : ''; };
let respPorCnpj = {};
if (!semCarteira) {
  Object.keys(CART.cnpj).forEach((k) => {
    const i = Number(CART.cnpj[k]);
    if (i >= 0 && i < CART.consultores.length) respPorCnpj[cnpj14(k)] = i;
    else semCarteira = 'a carteira comercial aponta CNPJ para consultor inexistente: sem o filtro de responsável';
  });
}
if (!semCarteira && Object.keys(respPorCnpj).length < MIN_CNPJ_CARTEIRA) {
  semCarteira = 'a carteira comercial veio com ' + Object.keys(respPorCnpj).length + ' CNPJ, abaixo do piso de ' +
    MIN_CNPJ_CARTEIRA + ' (leitura truncada): sem o filtro de responsável';
}
if (semCarteira) {
  respPorCnpj = {};
  CART = { consultores: [], cnpj: {}, gerado_em: '' };
}
const CATS = ['L', 'P', 'E', 'N'];
const CAT_DE = { 'leves': 'L', 'pesados': 'P' };
const avisoMeta = [];
const lerNo = (nome) => { try { return $(nome).all(); } catch (e) { return []; } };
const pctMeta = (x) => {
  if (x === null || x === undefined || x === '') return null;
  let n = x;
  if (typeof x !== 'number') {
    const t = String(x).trim();
    n = Number(t.split('%').join('').split(' ').join('').split(',').join('.'));
    if (t.indexOf('%') >= 0) n = n / 100;
  }
  if (!isFinite(n)) return null;
  if (n > 1) n = n / 100;
  return n >= 0 && n <= 1 ? n : null;
};
const txtM = (x) => String(x === null || x === undefined ? '' : x).trim();
const lerAba = (aba, linhas) => {
  const vazia = (x) => txtM(x) === '';
  const h = linhas.findIndex((r) => r.some((x) => txtM(x) === 'ID comitente'));
  const cab = h >= 0 ? linhas[h] : [];
  const cId = cab.findIndex((x) => txtM(x) === 'ID comitente');
  const cols = [];
  let medida = '';
  let periodo = '';
  for (let j = cId + 1; h > 1 && j < cab.length; j++) {
    const p = txtM((linhas[h - 2] || [])[j]).toLowerCase();
    if (p) periodo = p;
    const m = txtM((linhas[h - 1] || [])[j]).toLowerCase();
    if (m) medida = m;
    const c = CAT_DE[txtM(cab[j]).toLowerCase()];
    const k = medida.indexOf('oferta') >= 0 ? 0 : medida.indexOf('vend') >= 0 ? 1 : -1;
    const q = periodo.indexOf('mensal') >= 0 ? 'mes' : periodo.indexOf('diári') >= 0 || periodo.indexOf('diari') >= 0 ? 'dia' : '';
    if (c && k >= 0 && q) cols.push([j, c, k, q]);
  }
  const out = { mes: {}, dia: {} };
  if (!cols.length) {
    avisoMeta.push('a aba ' + aba + ' da planilha de metas veio fora do formato (sem a linha do ID comitente com Leves e Pesados, em cima % Com Oferta e % Vendido e, acima, Meta mensal e Meta diária): sem meta nesse mês');
    return null;
  }
  ['mes', 'dia'].forEach((q) => {
    if (!cols.some((x) => x[3] === q)) avisoMeta.push('a aba ' + aba + ' da planilha de metas não tem o bloco ' + (q === 'mes' ? 'Meta mensal' : 'Meta diária') + ': sem essa meta nesse mês');
  });
  let ruins = 0;
  linhas.slice(h + 1).forEach((r) => {
    const id = num(r[cId]);
    const par = {};
    cols.forEach((x) => {
      if (vazia(r[x[0]])) return;
      const kk = x[3] + '|' + x[1];
      if (!par[kk]) par[kk] = [undefined, undefined];
      par[kk][x[2]] = pctMeta(r[x[0]]);
    });
    Object.keys(par).forEach((kk) => {
      const of = par[kk][0];
      const ve = par[kk][1];
      const q = kk.split('|');
      if (id === null || of === null || of === undefined || ve === null || ve === undefined) { ruins++; return; }
      out[q[0]][id + '|' + q[1]] = [of, ve];
    });
  });
  if (ruins) avisoMeta.push(ruins + ' meta(s) da aba ' + aba + ' da planilha sem o ID do comitente, ilegíveis ou só com uma das duas: ficam sem meta');
  return out;
};
const abasPedidas = lerNo('Abas das Metas').map((i) => txtM((i.json || {}).aba));
const linhasDaAba = {};
let semPar = 0;
lerNo('Metas').forEach((i) => {
  const p = Array.isArray(i.pairedItem) ? i.pairedItem[0] : i.pairedItem;
  const k = typeof p === 'number' ? p : p && typeof p === 'object' ? p.item : undefined;
  const aba = abasPedidas[k];
  const linha = i.json && Array.isArray(i.json.row);
  if (!aba) { if (linha) semPar++; return; }
  if (linha) (linhasDaAba[aba] = linhasDaAba[aba] || []).push(i.json.row);
});
if (semPar) avisoMeta.push(semPar + ' linha(s) da planilha de metas sem a aba de origem (pairedItem): ficam fora');
const metaDaAba = {};
Object.keys(linhasDaAba).forEach((aba) => {
  const m = lerAba(aba, linhasDaAba[aba]);
  if (m) metaDaAba[aba] = m;
});
const abasLidas = Object.keys(metaDaAba).sort();
const ABA_DO_MES = META.meses.map((r) => (metaDaAba[r] ? r : abasLidas.filter((a) => a < r).pop() || ''));
if (!abasLidas.length) {
  avisoMeta.push('a planilha de metas não veio, ou nenhuma aba dos 12 meses (' + META.meses[0] + ' a ' +
    META.meses[META.meses.length - 1] + ') foi lida: sem meta');
} else {
  const emprestadas = META.meses.map((r, m) => (ABA_DO_MES[m] && ABA_DO_MES[m] !== r ? r + ' usa ' + ABA_DO_MES[m] : null)).filter((x) => x);
  const sem = META.meses.filter((r, m) => !ABA_DO_MES[m]);
  if (emprestadas.length) avisoMeta.push('planilha de metas sem a aba do mês: ' + emprestadas.join(', ') + ' (a mais recente anterior)');
  if (sem.length) avisoMeta.push('planilha de metas sem aba para ' + sem.join(', ') + ' nem anterior: sem meta nesse(s) mês(es)');
}
const reindexa = (m, idx) => {
  const o = {};
  Object.keys(m).forEach((k) => {
    const p = k.split('|');
    const i = idx[Number(p[0])];
    if (i !== undefined) o[i + '|' + p[1]] = m[k];
  });
  return o;
};
const metasPorMes = (q, idx) => ABA_DO_MES.map((a) => (a ? reindexa(metaDaAba[a][q], idx) : {}));
const PISO_DIA = META.piso_dia;
const utcDe = (s) => Date.UTC(Number(s.slice(0, 4)), Number(s.slice(5, 7)) - 1, Number(s.slice(8, 10)));
const P0 = utcDe(PISO_DIA);
const diaIdx = (s) => (s ? Math.round((utcDe(s) - P0) / 86400000) : null);
const HOJE = diaIdx(META.agora_br);
if (HOJE !== META.dias) throw new Error('o dia de hoje (' + HOJE + ') nao e o ultimo da janela (' + META.dias + ')');
const eventos = T.eventos.map((e) => {
  const d0 = Math.max(0, diaIdx(e.ini));
  let d1 = Math.min(HOJE, diaIdx(e.fim));
  if (d1 < d0) { marca('evento_fim_antes'); d1 = d0; }
  return {
    id: num(e.id), nome: e.nome, ini: e.ini, fim: e.fim, d0: d0, d1: d1,
    wls: String(e.wls || '').split(',').filter((x) => x !== '').map(Number), comits: []
  };
}).sort((a, b) => (a.fim < b.fim ? 1 : a.fim > b.fim ? -1 : b.id - a.id));
const evIdx = {};
eventos.forEach((e, i) => { evIdx[e.id] = i; });
const comitentes = T.comitentes.map((c) => ({ id: num(c.id), nome: String(c.nome || '').trim() || ('loja ' + c.id) }))
  .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
const comIdx = {};
comitentes.forEach((c, i) => { comIdx[c.id] = i; });
const cartConta = { por_cnpj: 0, nao_distribuidas: 0, sem_cnpj: 0 };
const lojas = T.lojas.map((l) => {
  const c = cnpj14(l.cnpj);
  let resp = -1;
  if (!c) cartConta.sem_cnpj++;
  else if (respPorCnpj[c] !== undefined) { resp = respPorCnpj[c]; cartConta.por_cnpj++; }
  else cartConta.nao_distribuidas++;
  return { id: num(l.id), linha: [String(l.nome || '').trim() || ('loja ' + l.id), num(l.wl), resp] };
});
const lojaIdx = {};
lojas.forEach((l, i) => { lojaIdx[l.id] = i; });
const veics = T.veiculos.map((v) => {
  let est = diaIdx(v.estreia);
  if (est === null) { marca('veiculo_sem_estreia'); est = -1; }
  if (est < 0) est = -1;
  let cat = String(v.cat || '');
  if (CATS.indexOf(cat) < 0) { marca('veiculo_sem_categoria'); cat = 'N'; }
  return { id: num(v.veic), linha: [v.marca || '', v.modelo || '', v.versao || '', num(v.ano), num(v.km), est,
    String(v.uuid || '').split('-').join(''), cat] };
});
const veicIdx = {};
veics.forEach((v, i) => { veicIdx[v.id] = i; });
const negs = [];
const negIdx = {};
T.negs.slice().sort((a, b) => num(a.neg) - num(b.neg)).forEach((r) => {
  const e = evIdx[num(r.ev)];
  const v = veicIdx[num(r.veic)];
  if (e === undefined) { marca('neg_sem_evento'); return; }
  if (v === undefined) { marca('neg_sem_veiculo'); return; }
  let c = comIdx[num(r.comit)];
  if (c === undefined) { marca('neg_sem_comitente'); c = -1; }
  if (c >= 0 && eventos[e].comits.indexOf(c) < 0) eventos[e].comits.push(c);
  negIdx[num(r.neg)] = negs.length;
  negs.push([e, v, c, num(r.status), num(r.vmv), num(r.fipe)]);
});
const daLoja = (rotulo, id) => {
  const l = lojaIdx[num(id)];
  if (l === undefined) marca(rotulo);
  return l;
};
const ofertas = [];
T.ofertas.forEach((o) => {
  const n = negIdx[num(o.neg)];
  if (n === undefined) { marca('oferta_sem_neg'); return; }
  const l = daLoja('oferta_sem_loja', o.loja);
  if (l === undefined) return;
  ofertas.push([n, l, num(o.n), num(o.maior), num(o.dias)]);
});
const acessos = [];
T.acessos.forEach((a) => {
  const n = negIdx[num(a.neg)];
  if (n === undefined) { marca('acesso_sem_neg'); return; }
  const l = daLoja('acesso_sem_loja', a.loja);
  if (l === undefined) return;
  acessos.push([n, l, num(a.dias)]);
});
const vendas = [];
T.vendas.forEach((s) => {
  const n = negIdx[num(s.neg)];
  if (n === undefined) { marca('venda_sem_neg'); return; }
  let l = -1;
  if (num(s.loja) === null) marca('venda_sem_loja_compradora');
  else {
    l = daLoja('venda_sem_loja', s.loja);
    if (l === undefined) return;
  }
  const d = diaIdx(s.quando);
  if (d === null || d < 0 || d > HOJE) marca('venda_fora_da_janela');
  vendas.push([n, l, num(s.valor), d === null ? -1 : d]);
});
const logins = [];
T.logins.forEach((g) => {
  const l = daLoja('login_sem_loja', g.loja);
  if (l === undefined) return;
  logins.push([l, num(g.wl), num(g.dias)]);
});
const MESES = META.meses || [];
if (MESES.length !== 12) throw new Error('o Montar Consultas mandou ' + MESES.length + ' meses, esperados 12');
const comMes = T.mes_comitentes.map((c) => ({ id: num(c.id), nome: String(c.nome || '').trim() || ('loja ' + c.id) }))
  .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
const comMesIdx = {};
comMes.forEach((c, i) => { comMesIdx[c.id] = i; });
const comDoMes = (id) => {
  const i = comMesIdx[num(id)];
  if (i === undefined) { marca('mes_comitente_fora'); return -1; }
  return i;
};
const STATUS_MES = [1, 2, 3, 7, 8, 9, 10, 11, 13, 14, 15, 18];
const mesGrupos = T.mes_veic.map((g) => {
  let cat = String(g.cat || '');
  if (CATS.indexOf(cat) < 0) { marca('mes_sem_categoria'); cat = 'N'; }
  const st = STATUS_MES.map((s) => num(g['s' + s])).concat([num(g.sx)]);
  const r = [num(g.m), comDoMes(g.c), num(g.wm), num(g.veic), num(g.novos), num(g.ac), num(g.of), num(g.ve),
    num(g.ac_n), num(g.of_n), num(g.ve_n), st, Math.round(num(g.valor) || 0), cat];
  const soma = st.reduce((t, x) => t + x, 0);
  const vend = st[STATUS_MES.indexOf(2)] + st[STATUS_MES.indexOf(3)] + st[STATUS_MES.indexOf(7)];
  if (soma !== r[3] || vend !== r[7] || r[6] < r[7] || r[6] > r[3]) {
    throw new Error('mes_veic: no mes ' + MESES[r[0]] + ' os status nao fecham (veiculos ' + r[3] + ', soma dos status ' + soma +
      ', vendidos ' + r[7] + ' x status de venda ' + vend + ', com oferta ' + r[6] + ', comitente ' + g.c + ')');
  }
  if (st[STATUS_MES.length]) conta.mes_status_fora = (conta.mes_status_fora || 0) + st[STATUS_MES.length];
  if (!r[2]) marca('mes_sem_canal');
  return r;
});
const mesLoj = T.mes_loj.map((r) => [num(r.m), num(r.wl), num(r.c) ? comDoMes(r.c) : -1, num(r.ac), num(r.of), num(r.co)]);
const mesDe = (s) => MESES.indexOf(String(s || '').slice(0, 7));
const mesEventos = T.mes_eventos.map((e) => {
  let a = mesDe(e.ini);
  let b = mesDe(e.fim);
  if (a < 0) a = String(e.ini) < MESES[0] ? 0 : MESES.length - 1;
  if (b < 0) b = String(e.fim) < MESES[0] ? 0 : MESES.length - 1;
  const cs = String(e.cs || '').split(',').filter((x) => x !== '').map((x) => comDoMes(x)).filter((x) => x >= 0);
  return [a, b, num(e.wm) || 0, cs];
});
const diasAc = {};
T.mes_dias_acesso.forEach((r) => { diasAc[String(r.mes)] = num(r.dias); });
const mesDiasAcesso = MESES.map((r, m) => {
  const ano = Number(r.slice(0, 4));
  const mm = Number(r.slice(5, 7));
  const total = m === MESES.length - 1 ? Number(META.agora_br.slice(8, 10)) : new Date(Date.UTC(ano, mm, 0)).getUTCDate();
  return [diasAc[r] || 0, total];
});
const ABREV = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const incompletos = [];
mesDiasAcesso.forEach((x, m) => {
  if (x[0] < x[1]) incompletos.push(ABREV[Number(MESES[m].slice(5, 7)) - 1] + '/' + MESES[m].slice(2, 4) + ' (' + x[0] + ' de ' + x[1] + ' dias)');
});
const TEXTO_AVISO = {
  evento_fim_antes: 'evento(s) com fim antes do início das ofertas',
  veiculo_sem_estreia: 'veículo(s) sem data de estreia — nunca contam como novos',
  neg_sem_evento: 'negociação(ões) fora dos eventos do recorte',
  neg_sem_veiculo: 'negociação(ões) sem o veículo na consulta de veículos',
  neg_sem_comitente: 'negociação(ões) de comitente fora da lista de comitentes',
  oferta_sem_neg: 'oferta(s) de negociação fora do recorte',
  oferta_sem_loja: 'oferta(s) de loja fora da tabela de lojas',
  acesso_sem_neg: 'acesso(s) de negociação fora do recorte',
  acesso_sem_loja: 'acesso(s) de loja fora da tabela de lojas',
  venda_sem_neg: 'venda(s) de negociação fora do recorte',
  venda_sem_loja: 'venda(s) de loja fora da tabela de lojas',
  venda_sem_loja_compradora: 'venda(s) com a oferta vencedora sem loja — contam como venda do veículo, fora dos lojistas que compraram',
  venda_fora_da_janela: 'venda(s) com a oferta vencedora fora dos 31 dias — não entram nos gráficos',
  login_sem_loja: 'loja(s) com acesso ao canal fora da tabela de lojas',
  mes_comitente_fora: 'linha(s) do mensal com comitente fora da lista de comitentes dos 12 meses',
  mes_sem_canal: 'grupo(s) do mensal sem canal — não aparecem com filtro de canal',
  veiculo_sem_categoria: 'veículo(s) com categoria fora da lista — contam como Não informada',
  mes_sem_categoria: 'grupo(s) do mensal com categoria fora da lista — contam como Não informada',
  mes_status_fora: 'veículo(s)-mês do mensal com status fora do domínio conhecido — contam em Não vendidos, como "outros"'
};
Object.keys(conta).forEach((k) => avisos.push(conta[k] + ' ' + (TEXTO_AVISO[k] || k)));
if (incompletos.length) {
  avisos.push('mensal: o registro de acessos (access_logs) não cobre o mês inteiro em ' + incompletos.join(', ') +
    ' — com acesso e lojistas que acessaram saem subcontados nesses meses');
}
avisoMeta.forEach((a) => avisos.push(a));
if (semCarteira) avisos.push(semCarteira);
else if (CART.gerado_em) {
  const g = String(CART.gerado_em);
  const idade = HOJE - diaIdx(g);
  if (idade > CARTEIRA_VELHA_DIAS) {
    avisos.push('carteira comercial de ' + g.slice(8, 10) + '/' + g.slice(5, 7) + '/' + g.slice(0, 4) + ', com ' + idade +
      ' dias: o responsável de cada loja pode estar desatualizado');
  }
}
const DADOS = {
  agora: META.agora_br, piso_dia: PISO_DIA, hoje: HOJE,
  canais: T.canais.map((c) => [num(c.id), c.nome]).sort((a, b) => a[0] - b[0]),
  eventos: eventos.map((e) => ({ nome: e.nome, ini: e.ini, fim: e.fim, d0: e.d0, d1: e.d1, wls: e.wls, comits: e.comits })),
  comitentes: comitentes.map((c) => c.nome),
  consultores: CART.consultores,
  carteira_em: String(CART.gerado_em || '').slice(0, 10),
  veics: veics.map((v) => v.linha),
  negs: negs, ofertas: ofertas, acessos: acessos, vendas: vendas, logins: logins,
  lojas: lojas.map((l) => l.linha),
  status_nome: STATUS_NOME, vitrine_c6: WL_VITRINE_C6,
  mes: { meses: MESES, wls: META.wls, comitentes: comMes.map((c) => c.nome), status: STATUS_MES, grupos: mesGrupos, loj: mesLoj, eventos: mesEventos,
    dias_max_evento: META.dias_max_evento, dias_acesso: mesDiasAcesso },
  metas: { dia: metasPorMes('dia', comIdx), mes: metasPorMes('mes', comMesIdx), abas: ABA_DO_MES }
};
function calcula(D, F) {
  F = F || {};
  const ST_VENDA = [2, 3, 7];
  const ST_ANALISE = [9, 13];
  const ST_REMOVIDO = [8, 10];
  const vazio = (x) => x === undefined || x === null || x === '';
  let de = vazio(F.de) ? 0 : Number(F.de);
  let ate = vazio(F.ate) ? D.hoje : Number(F.ate);
  if (de > ate) { const t = de; de = ate; ate = t; }
  const faixa = (a, b) => { let m = 0; for (let d = a; d <= b; d++) m |= (1 << d); return m; };
  const bit = (m, d) => ((m >>> d) & 1) === 1;
  const per = faixa(de, ate);
  const wl = vazio(F.wl) ? 0 : Number(F.wl);
  const comit = vazio(F.comit) ? -1 : Number(F.comit);
  const ev = vazio(F.ev) ? -1 : Number(F.ev);
  const resp = vazio(F.resp) ? '' : String(F.resp);
  const cat = vazio(F.cat) ? '' : String(F.cat);
  if (!D._ix) {
    const ix = { of: [], ac: [], ven: [] };
    ix.evCats = D.eventos.map(() => ({}));
    D.negs.forEach((n) => { ix.evCats[n[0]][D.veics[n[1]][7]] = 1; });
    D.negs.forEach(() => { ix.of.push([]); ix.ac.push([]); ix.ven.push(null); });
    D.ofertas.forEach((o) => ix.of[o[0]].push(o));
    D.acessos.forEach((a) => ix.ac[a[0]].push(a));
    D.vendas.forEach((s) => { ix.ven[s[0]] = s; });
    ix.evMask = D.eventos.map((e) => faixa(e.d0, e.d1));
    D._ix = ix;
  }
  const X = D._ix;
  const catOk = (n) => cat === '' || D.veics[n[1]][7] === cat;
  const evCatOk = (i) => cat === '' || X.evCats[i][cat] === 1;
  const evOk = D.eventos.map((e, i) => (!wl || e.wls.indexOf(wl) >= 0) && (ev < 0 || i === ev) &&
    (comit < 0 || e.comits.indexOf(comit) >= 0) && evCatOk(i));
  const lojaOk = D.lojas.map((l) => resp === '' || (resp === 'nd' ? l[2] < 0 : l[2] === Number(resp)));
  const nOk = (n) => evOk[n[0]] && (comit < 0 || n[2] === comit) && catOk(n);
  const NV = D.veics.length;
  const NL = D.lojas.length;
  const zeros = (k) => { const a = []; for (let i = 0; i < k; i++) a.push(0); return a; };
  const vAt = zeros(NV);
  const vNegs = [];
  const lLog = zeros(NL);
  const lAc = zeros(NL);
  const lOf = zeros(NL);
  const lCo = zeros(NL);
  D.negs.forEach((n, i) => {
    if (!nOk(n)) return;
    const m = X.evMask[n[0]] & per;
    const v = n[1];
    if (m) {
      vAt[v] |= m;
      if (!vNegs[v]) vNegs[v] = [];
      vNegs[v].push(i);
    }
    X.ac[i].forEach((a) => { if (lojaOk[a[1]]) lAc[a[1]] |= a[2] & per; });
    X.of[i].forEach((o) => { if (lojaOk[o[1]]) lOf[o[1]] |= o[4] & per; });
    const s = X.ven[i];
    if (s && s[3] >= 0 && s[1] >= 0 && lojaOk[s[1]]) lCo[s[1]] |= (1 << s[3]) & per;
  });
  D.logins.forEach((g) => { if (lojaOk[g[0]] && (!wl || g[1] === wl)) lLog[g[0]] |= g[2] & per; });
  const ultimaNoDia = (lista, d) => {
    let u = -1;
    lista.forEach((i) => {
      const e = D.negs[i][0];
      if (!bit(X.evMask[e], d)) return;
      if (u < 0) { u = i; return; }
      const a = D.eventos[e].fim;
      const b = D.eventos[D.negs[u][0]].fim;
      if (a > b || (a === b && i > u)) u = i;
    });
    return u;
  };
  const acumulado = (i, d) => {
    const m = faixa(0, d);
    const s = X.ven[i];
    const ve = !!s && s[3] <= d && (s[1] < 0 ? resp === '' : lojaOk[s[1]]);
    return {
      ac: X.ac[i].some((a) => lojaOk[a[1]] && (a[2] & m) !== 0),
      of: ve || X.of[i].some((o) => lojaOk[o[1]] && (!o[4] || (o[4] & m) !== 0)),
      ve: ve
    };
  };
  const metaDia = D.metas ? D.metas.dia : [];
  const P0M = Date.UTC(Number(D.piso_dia.slice(0, 4)), Number(D.piso_dia.slice(5, 7)) - 1, Number(D.piso_dia.slice(8, 10)));
  const mesDoDia = {};
  const metaNoDia = (d) => {
    if (mesDoDia[d] === undefined) mesDoDia[d] = D.mes.meses.indexOf(new Date(P0M + d * 86400000).toISOString().slice(0, 7));
    return metaDia[mesDoDia[d]] || {};
  };
  const somaMeta = (g, i, v, nv, d) => {
    const mm = metaNoDia(d)[D.negs[i][2] + '|' + D.veics[v][7]];
    if (!mm) return;
    g.mt++; g.mo += mm[0]; g.mv += mm[1];
    if (nv) { g.mt_n++; g.mo_n += mm[0]; g.mv_n += mm[1]; }
  };
  const zeraMeta = (g) => Object.assign(g, { mt: 0, mo: 0, mv: 0, mt_n: 0, mo_n: 0, mv_n: 0 });
  const dias = [];
  for (let d = de; d <= ate; d++) {
    dias.push(zeraMeta({ d: d, ativos: 0, novos: 0, acesso: 0, oferta: 0, venda: 0, acesso_n: 0, oferta_n: 0, venda_n: 0 }));
  }
  let noPeriodo = 0;
  for (let v = 0; v < NV; v++) {
    if (!vAt[v]) continue;
    noPeriodo++;
    const est = D.veics[v][5];
    for (let d = de; d <= ate; d++) {
      if (!bit(vAt[v], d)) continue;
      const g = dias[d - de];
      const nv = est === d;
      const i = ultimaNoDia(vNegs[v], d);
      const p = acumulado(i, d);
      somaMeta(g, i, v, nv, d);
      g.ativos++;
      if (nv) g.novos++;
      if (p.ac) { g.acesso++; if (nv) g.acesso_n++; }
      if (p.of) { g.oferta++; if (nv) g.oferta_n++; }
      if (p.ve) { g.venda++; if (nv) g.venda_n++; }
    }
  }
  const lojistas = dias.map((g) => ({ d: g.d, logaram: 0, acessaram: 0, ofertaram: 0, compraram: 0 }));
  const totLoj = { logaram: 0, acessaram: 0, ofertaram: 0, compraram: 0 };
  [['logaram', lLog], ['acessaram', lAc], ['ofertaram', lOf], ['compraram', lCo]].forEach((p) => {
    p[1].forEach((m) => {
      if (!m) return;
      totLoj[p[0]]++;
      for (let d = de; d <= ate; d++) if (bit(m, d)) lojistas[d - de][p[0]]++;
    });
  });
  const ref = ate;
  const ativoNoRef = (e) => e.d0 <= ref && ref <= e.d1;
  const cartoes = (evAtivo, passa) => {
    let nEv = 0;
    D.eventos.forEach((e, i) => { if (evAtivo(e, i)) nEv++; });
    const melhor = {};
    D.negs.forEach((n, i) => {
      if (!evAtivo(D.eventos[n[0]], n[0]) || !passa(n)) return;
      const j = melhor[n[1]];
      if (j === undefined) { melhor[n[1]] = i; return; }
      const a = D.eventos[n[0]].fim;
      const b = D.eventos[D.negs[j][0]].fim;
      if (a > b || (a === b && i > j)) melhor[n[1]] = i;
    });
    const ateRef = faixa(0, ref);
    const c = {
      ref: ref, eventos: nEv, veiculos: 0, comitentes: 0, sem_oferta: 0,
      com_oferta: 0, co_abertos: 0, co_analise: 0, co_encerrados: 0,
      vmv: 0, vm_abertos: 0, vm_analise: 0, vm_encerrados: 0,
      vendidos: 0, aguardando: 0, vendido: 0, valor: 0,
      removidos: 0, rem_cancelado: 0, rem_suspenso: 0
    };
    const comRef = {};
    Object.keys(melhor).forEach((v) => {
      const i = melhor[v];
      const n = D.negs[i];
      const st = n[3];
      c.veiculos++;
      if (n[2] >= 0) comRef[n[2]] = 1;
      const vendeu = ST_VENDA.indexOf(st) >= 0 && (!X.ven[i] || X.ven[i][3] <= ref);
      if (vendeu) {
        c.vendidos++;
        if (st === 7) c.vendido++; else c.aguardando++;
        if (X.ven[i]) c.valor += X.ven[i][2];
      }
      if (ST_REMOVIDO.indexOf(st) >= 0) {
        c.removidos++;
        if (st === 10) c.rem_cancelado++; else c.rem_suspenso++;
      }
      let maior = null;
      X.of[i].forEach((o) => {
        if (o[4] && !(o[4] & ateRef)) return;
        if (maior === null || o[3] > maior) maior = o[3];
      });
      const fase = st === 1 ? 'abertos' : ST_ANALISE.indexOf(st) >= 0 ? 'analise' : 'encerrados';
      if (maior === null && !vendeu) { c.sem_oferta++; return; }
      c.com_oferta++;
      c['co_' + fase]++;
      if (vendeu || (n[4] !== null && maior >= n[4])) {
        c.vmv++;
        c['vm_' + fase]++;
      }
    });
    c.comitentes = Object.keys(comRef).length;
    return c;
  };
  const k = cartoes((e, i) => evOk[i] && ativoNoRef(e), nOk);
  const evOkSemCom = D.eventos.map((e, i) => (!wl || e.wls.indexOf(wl) >= 0) && (ev < 0 || i === ev) && evCatOk(i));
  const comHoje = {};
  D.eventos.forEach((e, i) => { if (evOkSemCom[i] && ativoNoRef(e)) e.comits.forEach((c) => { comHoje[c] = 1; }); });
  const porComit = Object.keys(comHoje).map(Number).map((c) => Object.assign({ comit: c },
    cartoes((e, i) => evOkSemCom[i] && ativoNoRef(e) && e.comits.indexOf(c) >= 0, (n) => n[2] === c && catOk(n))))
    .filter((c) => c.veiculos > 0)
    .sort((a, b) => b.veiculos - a.veiculos || a.comit - b.comit);
  const evListaOk = D.eventos.map((e, i) => ativoNoRef(e) && (!wl || e.wls.indexOf(wl) >= 0) &&
    (comit < 0 || e.comits.indexOf(comit) >= 0) && evCatOk(i));
  const doComit = (n) => (comit < 0 || n[2] === comit) && catOk(n);
  const porEvento = [];
  evListaOk.forEach((ok, i) => {
    if (!ok) return;
    porEvento.push(Object.assign({ ev: i }, cartoes((e, j) => j === i, doComit)));
  });
  porEvento.sort((a, b) => b.veiculos - a.veiculos || (D.eventos[a.ev].fim < D.eventos[b.ev].fim ? -1 : 1));
  const vazioDia = () => zeraMeta({ ativos: 0, novos: 0, acesso: 0, oferta: 0, venda: 0, acesso_n: 0, oferta_n: 0, venda_n: 0 });
  const indicadorDia = (grupoDe, d) => {
    const out = {};
    if (d < 0) return out;
    const pv = {};
    D.negs.forEach((n, i) => {
      if (!bit(X.evMask[n[0]], d)) return;
      const g = grupoDe(n);
      if (g === null) return;
      const kk = g + '|' + n[1];
      if (!pv[kk]) { pv[kk] = { g: g, v: n[1], l: [i] }; return; }
      pv[kk].l.push(i);
    });
    Object.keys(pv).forEach((kk) => {
      const i = ultimaNoDia(pv[kk].l, d);
      const p = Object.assign(pv[kk], acumulado(i, d));
      const g = out[p.g] || (out[p.g] = vazioDia());
      const nv = D.veics[p.v][5] === d;
      somaMeta(g, i, p.v, nv, d);
      g.ativos++;
      if (nv) g.novos++;
      if (p.ac) { g.acesso++; if (nv) g.acesso_n++; }
      if (p.of) { g.oferta++; if (nv) g.oferta_n++; }
      if (p.ve) { g.venda++; if (nv) g.venda_n++; }
    });
    return out;
  };
  const grupoComit = (n) => (n[2] >= 0 && comHoje[n[2]] && evOkSemCom[n[0]] && catOk(n) ? n[2] : null);
  const grupoEvento = (n) => (evListaOk[n[0]] && doComit(n) ? n[0] : null);
  const SEMANA = 7;
  const semana = [];
  for (let j = SEMANA - 1; j >= 0; j--) semana.push({ d: ref - j, g: indicadorDia(grupoComit, ref - j) });
  porComit.forEach((c) => {
    c.hist = semana.map((s) => (s.d < 0 ? null : Object.assign({ d: s.d }, s.g[c.comit] || vazioDia())));
    c.dia = c.hist[SEMANA - 1];
    c.dia_ant = c.hist[SEMANA - 2];
  });
  const evHoje = indicadorDia(grupoEvento, ref);
  const evAnt = indicadorDia(grupoEvento, ref - 1);
  porEvento.forEach((c) => {
    c.dia = evHoje[c.ev] || vazioDia();
    c.dia_ant = ref > 0 ? (evAnt[c.ev] || vazioDia()) : null;
  });
  const veiculos = [];
  for (let v = 0; v < NV; v++) {
    const ns = vNegs[v];
    if (!ns) continue;
    let ult = ns[0];
    ns.forEach((i) => {
      const a = D.eventos[D.negs[i][0]].fim;
      const b = D.eventos[D.negs[ult][0]].fim;
      if (a > b || (a === b && i > ult)) ult = i;
    });
    const quemAc = {};
    const quemOf = {};
    let lances = 0;
    let maior = null;
    const evs = {};
    ns.forEach((i) => {
      evs[D.negs[i][0]] = 1;
      X.ac[i].forEach((a) => { if (lojaOk[a[1]] && (a[2] & per)) quemAc[a[1]] = 1; });
      X.of[i].forEach((o) => {
        if (!lojaOk[o[1]]) return;
        quemOf[o[1]] = 1;
        lances += o[2];
        if (maior === null || o[3] > maior) maior = o[3];
      });
    });
    const n = D.negs[ult];
    const vmv = n[4];
    const fipe = n[5];
    const s = X.ven[ult];
    let farol = 'sem';
    if (maior !== null) farol = vmv !== null && maior >= vmv ? 'atingiu' : 'abaixo';
    const vv = D.veics[v];
    veiculos.push({
      v: v, nome: [vv[0], vv[1], vv[2]].filter((x) => x).join(' ') || '(sem modelo)',
      ev: n[0], n_ev: Object.keys(evs).length, comit: n[2], status: n[3],
      acessos: Object.keys(quemAc).length, lances: lances, ofertantes: Object.keys(quemOf).length,
      maior: maior, vmv: vmv, fipe: fipe,
      pvmv: maior !== null && vmv ? maior / vmv : null,
      pfipe: maior !== null && fipe ? maior / fipe : null,
      vendido: ST_VENDA.indexOf(n[3]) >= 0,
      comprador: s && ST_VENDA.indexOf(n[3]) >= 0 ? s[1] : null,
      venda: s && ST_VENDA.indexOf(n[3]) >= 0 ? s[2] : null,
      estreia: vv[5], farol: farol
    });
  }
  return { de: de, ate: ate, kpi: k, por_comit: porComit, por_evento: porEvento, dias: dias, lojistas: lojistas, tot_lojistas: totLoj,
    veiculos_periodo: noPeriodo, veiculos: veiculos };
}
function calculaMes(D, F) {
  F = F || {};
  const M = D.mes;
  const N = M.meses.length;
  const vazio = (x) => x === undefined || x === null || x === '';
  const ref = vazio(F.mes) ? N - 1 : Number(F.mes);
  const wl = vazio(F.wl) ? 0 : Number(F.wl);
  const bitWl = wl ? (1 << M.wls.indexOf(wl)) : 0;
  const comit = vazio(F.comit) ? -1 : Number(F.comit);
  const cat = vazio(F.cat) ? '' : String(F.cat);
  const GRUPO_ST = { st_ativo: [1], an_comprador: [9], an_vendedor: [13], aguardando: [2, 3], vendido: [7],
    sem_ofertas: [11], rejeitados: [14, 15], venda_cancelada: [18], suspensos: [8], cancelados: [10] };
  const CAMPOS_ST = Object.keys(GRUPO_ST).concat(['outros', 'analise', 'vendidos', 'nao_vendidos', 'removidos']);
  const POS_ST = {};
  Object.keys(GRUPO_ST).forEach((k) => { POS_ST[k] = GRUPO_ST[k].map((s) => M.status.indexOf(s)); });
  const zero = (m) => {
    const o = { m: m, rot: M.meses[m], veiculos: 0, ativos: 0, novos: 0, acesso: 0, oferta: 0, venda: 0,
      acesso_n: 0, oferta_n: 0, venda_n: 0, com_oferta: 0, valor: 0,
      eventos: 0, comitentes: 0, mt: 0, mo: 0, mv: 0, mt_n: 0, mo_n: 0, mv_n: 0 };
    CAMPOS_ST.forEach((k) => { o[k] = 0; });
    return o;
  };
  const metaMes = D.metas ? D.metas.mes : [];
  const serie = () => M.meses.map((r, m) => zero(m));
  const soma = (o, g) => {
    o.veiculos += g[3]; o.ativos += g[3]; o.novos += g[4];
    o.acesso += g[5]; o.oferta += g[6]; o.venda += g[7];
    o.acesso_n += g[8]; o.oferta_n += g[9]; o.venda_n += g[10];
    o.com_oferta += g[6];
    const st = g[11];
    Object.keys(POS_ST).forEach((k) => { POS_ST[k].forEach((p) => { o[k] += st[p]; }); });
    const fora = st[M.status.length];
    o.outros += fora;
    o.analise = o.an_comprador + o.an_vendedor;
    o.vendidos = o.aguardando + o.vendido;
    o.nao_vendidos = o.sem_ofertas + o.rejeitados + o.venda_cancelada + o.outros;
    o.removidos = o.suspensos + o.cancelados;
    o.valor += g[12];
    const mm = (metaMes[g[0]] || {})[g[1] + '|' + g[13]];
    if (mm) {
      o.mt += g[3]; o.mo += g[3] * mm[0]; o.mv += g[3] * mm[1];
      o.mt_n += g[4]; o.mo_n += g[4] * mm[0]; o.mv_n += g[4] * mm[1];
    }
  };
  const meses = serie();
  const porC = {};
  const comNoMes = meses.map(() => ({}));
  M.grupos.forEach((g) => {
    if (bitWl && !(g[2] & bitWl)) return;
    if (cat && g[13] !== cat) return;
    const c = g[1];
    if (c >= 0) soma((porC[c] || (porC[c] = serie()))[g[0]], g);
    if (comit >= 0 && c !== comit) return;
    soma(meses[g[0]], g);
    if (c >= 0) comNoMes[g[0]][c] = 1;
  });
  meses.forEach((o, m) => { o.comitentes = Object.keys(comNoMes[m]).length; });
  M.eventos.forEach((e) => {
    if (bitWl && !(e[2] & bitWl)) return;
    for (let m = e[0]; m <= e[1]; m++) {
      if (comit < 0 || e[3].indexOf(comit) >= 0) meses[m].eventos++;
      e[3].forEach((c) => { if (porC[c]) porC[c][m].eventos++; });
    }
  });
  const lk = {};
  M.loj.forEach((r) => { lk[r[0] + '|' + r[1] + '|' + r[2]] = r; });
  meses.forEach((o, m) => {
    const r = lk[m + '|' + wl + '|' + comit];
    o.lojistas = { acessaram: r ? r[3] : 0, ofertaram: r ? r[4] : 0, compraram: r ? r[5] : 0 };
  });
  const HIST = 12;
  const porComit = Object.keys(porC).map(Number).filter((c) => porC[c][ref].veiculos > 0).map((c) => {
    const hist = [];
    for (let j = HIST - 1; j >= 0; j--) hist.push(ref - j >= 0 ? porC[c][ref - j] : null);
    return Object.assign({ comit: c }, porC[c][ref], { hist: hist, dia: porC[c][ref], dia_ant: ref > 0 ? porC[c][ref - 1] : null });
  }).sort((a, b) => b.veiculos - a.veiculos || a.comit - b.comit);
  return { ref: ref, meses: meses, kpi: meses[ref], ant: ref > 0 ? meses[ref - 1] : null, por_comit: porComit };
}
const GLOSSARIO_TXT = PECAS.GLOSSARIO_TXT;
const nomesCanais = DADOS.canais.map((c) => c[1] + ' (' + c[0] + ')').join(', ');
DADOS.glossario = GLOSSARIO_TXT.map((par) => par.map((t) => t.split('{canais}').join(nomesCanais)
  .split('{dias_max}').join(String(META.dias_max_evento)).split('{dias}').join(String(META.dias))));
const CSS_PAINEL = PECAS.CSS_PAINEL;
const ICONE = PECAS.ICONE;
const chip = (k) => '<span class="chip" aria-hidden="true"><svg viewBox="0 0 24 24">' + ICONE[k] + '</svg></span>';
const kpiCard = (ic, rot, idVal, meio, pe, idRot) =>
  '<article class="cartao"><div class="cartao-topo">' + chip(ic) + '<span class="kpi-rot"' + (idRot ? ' id="' + idRot + '"' : '') + '>' + rot + '</span></div>' +
  '<p class="kpi-val num" id="' + idVal + '">—</p>' + meio +
  '<dl class="kpi-pe">' + pe.map((p) => '<div><dt>' + p[0] + '</dt><dd class="num" id="' + p[1] + '">—</dd></div>').join('') +
  '</dl></article>';
const meioPc = (idTxt, idBar, idMeta) => '<div class="kpi-pc"><span class="txt num" id="' + idTxt + '">—</span><span id="' + idBar + '"></span>' +
  (idMeta ? '<span class="meta-txt" id="' + idMeta + '" hidden></span>' : '') + '</div>';
const topoCartao = (ic, titulo, idN, extra) => '<div class="cartao-topo">' + chip(ic) + '<h2>' + titulo + '</h2>' +
  '<span class="dir">' + (extra || '') + '<span class="tag" id="' + idN + '">—</span></span></div>';
const seg = (id, rot, opcoes, ativo) => '<span class="seg" id="' + id + '" role="group" aria-label="' + rot + '">' +
  opcoes.map((o) => '<button type="button" data-v="' + o[0] + '" aria-pressed="' + (o[0] === ativo) + '">' + o[1] + '</button>').join('') +
  '</span>';
const filtro = (id, rotulo) => '<div class="fg"><label for="' + id + '">' + rotulo + '</label>' +
  '<select class="ctrl" id="' + id + '"></select></div>';
const dadosJs = JSON.stringify(DADOS).split('<').join(String.fromCharCode(92) + 'u003c');
const logoJs = JSON.stringify(LOGO);
const html = '<!doctype html><html lang="pt-BR" data-tema="escuro"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width, initial-scale=1">' +
  '<title>Painel de Eventos — Cars2You</title><style>' + CSS_TEMA + CSS_PAINEL + '</style></head><body>' +
  '<header class="topo"><div class="topo-in">' +
  '<span class="marca"><img class="logo logo-extensa" id="logo" src="" alt="Cars2You">' +
  '<img class="logo logo-curta" id="logo-curta" src="" alt="Cars2You"></span>' +
  '<div class="topo-tit"><h1>Painel de Eventos</h1></div>' +
  '<div class="topo-acoes">' +
  seg('seg-aba', 'Visão', [['dia', 'Diário'], ['mes', 'Mensal']], 'dia') +
  '</div></div></header><div id="dica-g" hidden></div><div id="dica-lk" hidden></div>' +
  '<button id="aba" class="aba" type="button" aria-expanded="false" aria-controls="gaveta">' +
  '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICONE.filtros + '</svg><span class="rot">Filtros</span>' +
  '<span class="n" id="aba-n" hidden></span></button>' +
  '<div id="veu" class="veu" hidden></div>' +
  '<aside id="gaveta" class="gaveta" aria-label="Filtros"><div class="cartao">' +
  '<div class="cartao-topo">' + chip('filtros') + '<h2>Filtros</h2>' +
  '<button id="fecha" class="fechar" type="button" aria-label="Fechar filtros">×</button></div>' +
  '<div class="filtros" id="fil-dia">' +
  filtro('f-wl', 'Whitelabel') +
  filtro('f-comit', 'Comitente') +
  filtro('f-cat', 'Categoria') +
  filtro('f-ev', 'Evento') +
  filtro('f-resp', 'Responsável da carteira comercial') +
  '<div class="fg2">' + filtro('f-de', 'Data: de') + filtro('f-ate', 'até') + '</div>' +
  '<p class="nota"><b>Whitelabel</b>, <b>comitente</b> e <b>evento</b> recortam os veículos, e tudo que nasce deles acompanha. ' +
  '<b>Responsável</b> recorta as lojas: os cartões e as barras de veículos não mudam com ele. ' +
  '<b>Data</b> escolhe os dias dos gráficos e da tabela; os cartões mostram o dia do Até.</p>' +
  '</div>' +
  '<div class="filtros" id="fil-mes" hidden>' +
  filtro('f-m-wl', 'Whitelabel') +
  filtro('f-m-comit', 'Comitente') +
  filtro('f-m-cat', 'Categoria') +
  filtro('f-m-mes', 'Mês dos cartões') +
  '<p class="nota"><b>Whitelabel</b> e <b>comitente</b> recortam os veículos e as lojas. <b>Mês</b> escolhe o mês dos cartões; ' +
  'os gráficos mostram sempre os 12 meses. No mensal não há filtro de evento, de responsável nem de data.</p>' +
  '</div>' +
  '<div class="filtros"><div class="fg"><button class="ctrl" id="limpar" type="button">Limpar filtros</button></div></div>' +
  '</div></aside>' +
  '<main class="area">' +
  '<div class="barra-ind"><span class="grupo-ind"><span class="rot-ind" id="seg-kpi-rot">Indicador</span>' +
  seg('seg-kpi', 'Indicador', [['acesso', 'Com acesso'], ['oferta', 'Com oferta'], ['venda', 'Vendidos']], 'oferta') + '</span>' +
  '<span class="grupo-ind"><span class="rot-ind" id="seg-modo-rot">Veículos</span>' +
  seg('seg-modo', 'Veículos', [['todos', 'Todos'], ['novos', 'Novos']], 'todos') + '</span>' +
  '<span class="grupo-ind canto-tema">' +
  '<button class="ctrl so-icone" id="b-tema" type="button" aria-label="Mudar o tema"></button></span></div>' +
  '<div id="v-dia">' +
  '<section class="g4 g5" aria-label="Eventos ativos no dia">' +
  kpiCard('evento', 'Eventos ativos hoje', 'k-ev', '<div class="kpi-pc"><span class="txt" id="k-ev-dia">—</span></div>',
    [['Veículos', 'k-ev-veic'], ['Comitentes', 'k-ev-com']], 'k-ev-rot') +
  kpiCard('oferta', 'Com oferta', 'k-co', meioPc('k-co-pc', 'k-co-bar', 'k-co-meta'),
    [['Abertos', 'k-co-ab'], ['Em análise', 'k-co-an'], ['Encerrados', 'k-co-en']]) +
  kpiCard('alvo', 'VMV atingido', 'k-vm', meioPc('k-vm-pc', 'k-vm-bar'),
    [['Abertos', 'k-vm-ab'], ['Em análise', 'k-vm-an'], ['Encerrados', 'k-vm-en']]) +
  kpiCard('vendido', 'Vendidos', 'k-vd', meioPc('k-vd-pc', 'k-vd-bar', 'k-vd-meta'),
    [['Aguardando pgto.', 'k-vd-ag'], ['Vendido', 'k-vd-vd'], ['Valor', 'k-vd-rs']]) +
  kpiCard('removido', 'Removidos', 'k-rm', meioPc('k-rm-pc', 'k-rm-bar'),
    [['Cancelados', 'k-rm-can'], ['Suspensos', 'k-rm-sus']]) +
  '</section>' +
  '<section class="comitentes" aria-labelledby="comit-rot">' +
  '<div class="barra-comit"><span class="rot-comit" id="comit-rot">Comitentes com evento ativo hoje</span>' +
  '<span class="nota-comit" id="comit-nota"></span></div>' +
  '<div class="g-comit" id="g-comit"></div></section>' +
  '<details class="cartao gloss lista-ev" id="dobra-ev"><summary class="cartao-topo">' + chip('evento') + '<h2 id="ev-rot">Eventos ativos hoje</h2>' +
  '<span class="dir"><span class="dim clique">clique numa linha para filtrar</span><span class="tag" id="n-evlista">—</span>' +
  '<span class="seta" aria-hidden="true">▾</span></span></summary>' +
  '<div class="rolo-ev"><div class="lin cab" id="cab-ev"></div><div id="g-ev"></div></div></details>' +
  '<article class="cartao">' + topoCartao('grafico', 'Veículos ativos por dia', 'n-ativos') +
  '<div class="legenda"><span id="leg-a"><span class="amostra serie-b"></span>Já em evento</span>' +
  '<span><span class="amostra serie-a"></span>Novos no dia</span>' +
  '<span><span class="amostra traco linha-kpi"></span><span id="leg-linha">% com oferta</span> (eixo da direita)</span>' +
  '<span id="leg-meta" hidden><span class="amostra traco linha-meta"></span>Meta</span></div>' +
  '<div class="caixa-g" id="g-ativos" data-rot="Veículos ativos por dia, já em evento e novos, com o percentual do indicador escolhido"></div></article>' +
  '<article class="cartao">' + topoCartao('pessoa', 'Lojistas por dia', 'n-lojistas') +
  '<div class="legenda">' +
  '<span><span class="amostra traco s-ac"></span>Acessaram</span>' +
  '<span><span class="amostra traco s-of"></span>Ofertaram</span>' +
  '<span><span class="amostra traco s-co"></span>Compraram</span></div>' +
  '<div class="caixa-g" id="g-lojistas" data-rot="Lojas distintas por dia que acessaram, ofertaram e compraram"></div>' +
  '<div class="tot" id="tot-lojistas"></div></article>' +
  '<section class="cartao">' + topoCartao('lista', 'Veículos', 'n-veic',
    '<input class="ctrl busca" id="busca" type="search" placeholder="Buscar veículo, evento ou comitente" aria-label="Buscar veículo, evento ou comitente">') +
  '<div class="rolo alto"><table class="dens"><thead><tr id="th-veic"></tr></thead><tbody id="tb-veic"></tbody></table></div>' +
  '<button class="ctrl mais" id="mais-veic" type="button" hidden></button></section>' +
  '</div>' +
  '<div id="v-mes" hidden>' +
  '<section class="g4 g7" aria-label="Eventos e status no mês">' +
  kpiCard('evento', 'Eventos no mês', 'km-ev', '<div class="kpi-pc"><span class="txt" id="km-ev-mes">—</span></div>',
    [['Veículos', 'km-ev-veic'], ['Comitentes', 'km-ev-com']], 'km-ev-rot') +
  kpiCard('veiculo', 'Ativos', 'km-at', meioPc('km-at-pc', 'km-at-bar'), [['Mês anterior', 'km-at-ant']]) +
  kpiCard('relogio', 'Em análise', 'km-an', meioPc('km-an-pc', 'km-an-bar'),
    [['Comprador', 'km-an-comp'], ['Vendedor', 'km-an-vend'], ['Mês anterior', 'km-an-ant']]) +
  kpiCard('vendido', 'Vendidos', 'km-vd', meioPc('km-vd-pc', 'km-vd-bar', 'km-vd-meta'),
    [['Aguardando pgto.', 'km-vd-ag'], ['Vendido', 'km-vd-vd'], ['Mês anterior', 'km-vd-ant']]) +
  kpiCard('oferta', 'Valor vendido', 'km-vr', '<div class="kpi-pc"><span class="txt num" id="km-vr-pc">—</span></div>',
    [['Diferença', 'km-vr-dif'], ['Mês anterior', 'km-vr-ant']]) +
  kpiCard('naovendido', 'Não vendidos', 'km-nv', meioPc('km-nv-pc', 'km-nv-bar'),
    [['Sem ofertas', 'km-nv-sem'], ['Rejeitados', 'km-nv-rej'], ['Venda cancelada', 'km-nv-vc'], ['Outros', 'km-nv-out'],
      ['Mês anterior', 'km-nv-ant']]) +
  kpiCard('removido', 'Removidos', 'km-rm', meioPc('km-rm-pc', 'km-rm-bar'),
    [['Suspensos', 'km-rm-sus'], ['Cancelados', 'km-rm-can'], ['Mês anterior', 'km-rm-ant']]) +
  '</section>' +
  '<section class="comitentes" aria-labelledby="comit-rot-m">' +
  '<div class="barra-comit"><span class="rot-comit" id="comit-rot-m">Comitentes com evento no mês</span>' +
  '<span class="nota-comit" id="comit-nota-m"></span></div>' +
  '<div class="g-comit" id="g-comit-m"></div></section>' +
  '<article class="cartao">' + topoCartao('grafico', 'Veículos ativos por mês', 'n-ativos-m') +
  '<div class="legenda"><span id="leg-a-m"><span class="amostra serie-b"></span>Já em evento antes</span>' +
  '<span><span class="amostra serie-a"></span>Novos no mês</span>' +
  '<span><span class="amostra traco linha-kpi"></span><span id="leg-linha-m">% com oferta</span> (eixo da direita)</span>' +
  '<span id="leg-meta-m" hidden><span class="amostra traco linha-meta"></span>Meta</span></div>' +
  '<div class="caixa-g" id="g-ativos-m" data-rot="Veículos ativos por mês, já em evento e novos, com o percentual do indicador escolhido"></div>' +
  '<p class="nota-ac" id="nota-ac-m" hidden></p></article>' +
  '<article class="cartao">' + topoCartao('pessoa', 'Lojistas por mês', 'n-lojistas-m') +
  '<div class="legenda">' +
  '<span><span class="amostra traco s-ac"></span>Acessaram</span>' +
  '<span><span class="amostra traco s-of"></span>Ofertaram</span>' +
  '<span><span class="amostra traco s-co"></span>Compraram</span></div>' +
  '<div class="caixa-g" id="g-lojistas-m" data-rot="Lojas distintas por mês que acessaram, ofertaram e compraram"></div>' +
  '<div class="tot" id="tot-lojistas-m"></div><p class="nota-ac" id="nota-ac-lm" hidden></p></article>' +
  '</div>' +
  '<details class="cartao gloss" id="gloss"><summary class="cartao-topo">' + chip('gloss') + '<h2>Glossário</h2>' +
  '<span class="dir"><span class="tag" id="gloss-n">—</span><span class="seta" aria-hidden="true">▾</span></span>' +
  '</summary><dl id="gloss-lista"></dl></details>' +
  '<p class="rodape">Atualizado em <span id="gerado">—</span> · <span id="base"></span></p>' +
  '</main><script>' +
  calcula.toString() + calculaMes.toString() + $('Peças da Página').first().json.APP +
  'APP(' + dadosJs + ',' + logoJs + ');' +
  '</script></body></html>';
const todos = calcula(DADOS, {});
const resumo = {
  eventos: eventos.length, negociacoes: negs.length, veiculos: veics.length,
  ofertas: ofertas.length, acessos: acessos.length, vendas: vendas.length, logins: logins.length,
  lojas: lojas.length, comitentes: comitentes.length,
  carteira: { consultores: CART.consultores.length, cnpj: Object.keys(respPorCnpj).length, gerado_em: CART.gerado_em,
    sem_carteira: semCarteira, lojas: cartConta },
  kpi: todos.kpi,
  veiculos_periodo: todos.veiculos_periodo,
  hoje: todos.dias[todos.dias.length - 1],
  lojistas_hoje: todos.lojistas[todos.lojistas.length - 1],
  tot_lojistas: todos.tot_lojistas,
  meses: calculaMes(DADOS, {}).meses.map((g) => ({ mes: g.rot, eventos: g.eventos, veiculos: g.veiculos, novos: g.novos,
    acesso: g.acesso, oferta: g.oferta, venda: g.venda, com_oferta: g.com_oferta, ativos: g.st_ativo, analise: g.analise,
    vendidos: g.vendidos, nao_vendidos: g.nao_vendidos, removidos: g.removidos, outros: g.outros, valor: g.valor,
    comitentes: g.comitentes, lojistas: g.lojistas })),
  avisos: avisos,
  bytes_html: html.length
};
if (CSS_TEMA.length < 5000) throw new Error('CSS do tema nao injetado (rode _aplica-modelo.js)');
if (!LOGO.claro || !LOGO.escuro || !LOGO.claro.extensa || !LOGO.escuro.curta) throw new Error('logos nao injetadas (rode _aplica-modelo.js)');
return [{ json: { html: html, resumo: resumo } }];
