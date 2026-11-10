const PECAS = $('Peças do Tema Cars2You').first().json;
const CSS_TEMA = PECAS.CSS_TEMA;
const LOGO_FEN = PECAS.LOGO_FEN;
const VENDEDORES = { C6: [104754], IGA: [594, 598, 16036] };
const WL_VITRINE_C6 = [43, 48];
const STATUS_VENDA = [2, 3, 7];
const SITUACAO_APROVADA = 3;
const PESO_SCORE = { acesso: 1, oferta: 5, vmv: 100 };
const STATUS_NOME = {
  1: 'Ativo', 2: 'Aguardando pagamento', 3: 'Aguardando confirmação de pagamento',
  7: 'Vendido', 8: 'Suspenso', 9: 'Em análise do comprador', 10: 'Cancelado',
  11: 'Sem ofertas', 13: 'Em análise do vendedor', 14: 'Vendedor rejeitou',
  15: 'Comprador rejeitou', 18: 'Venda cancelada'
};
const pedidos = $('Montar Consultas Cars2You').all().map((i) => i.json);
const respostas = $('MCP Consultas Cars2You').all();
if (respostas.length !== pedidos.length) {
  throw new Error('MCP Consultas devolveu ' + respostas.length + ' respostas para ' +
    pedidos.length + ' consultas. Sem par um a um nao da para saber qual e qual.');
}
const T = {};
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
  T[p.queryName] = linhas.map((arr) => {
    if (arr.length !== p.cols.length) {
      throw new Error(p.queryName + ': linha com ' + arr.length + ' colunas, esperadas ' + p.cols.length);
    }
    const o = {};
    p.cols.forEach((k, j) => { o[k] = arr[j]; });
    return o;
  });
});
const META = pedidos[0].meta;
const PARTES = Number(META.partes_acesso);
if (!(PARTES >= 1)) throw new Error('meta.partes_acesso ausente no Montar Consultas');
const nomesAcesso = [];
for (let p = 0; p < PARTES; p++) nomesAcesso.push('acessos_p' + p);
['eventos', 'veiculos', 'ofertas', 'lojas', 'acessos_anuncio'].concat(nomesAcesso).forEach((k) => {
  if (!T[k]) throw new Error('A consulta ' + k + ' nao veio do Montar Consultas');
});
const AGORA = META.agora_br;
const num = (x) => (x === null || x === undefined || x === '' ? null : Number(x));
const avisos = [];
const conta = {};
const marca = (chave) => { conta[chave] = (conta[chave] || 0) + 1; };
const eventos = T.eventos.map((e) => ({
  id: num(e.id), nome: e.nome, status: num(e.status), ini: e.ini, fim: e.fim, op: e.op,
  wls: String(e.wls || '').split(',').filter((x) => x !== '').map(Number)
})).sort((a, b) => (a.fim < b.fim ? 1 : a.fim > b.fim ? -1 : b.id - a.id));
const evPorId = {};
eventos.forEach((e) => { evPorId[e.id] = e; });
const ofertaPorId = {};
const ofertasDaNeg = {};
T.ofertas.forEach((o) => {
  const of = { id: num(o.id), neg: num(o.neg), loja: num(o.loja), valor: num(o.valor), quando: o.quando };
  ofertaPorId[of.id] = of;
  if (!ofertasDaNeg[of.neg]) ofertasDaNeg[of.neg] = [];
  ofertasDaNeg[of.neg].push(of);
});
const lojas = T.lojas.map((l) => ({
  id: num(l.id), nome: l.nome, wl: num(l.wl), situacao: num(l.situacao), cadastro: l.cadastro,
  apagada: num(l.apagada) === 1,
  fenauto: l.fenauto || null
}));
const lojaPorId = {};
lojas.forEach((l) => { lojaPorId[l.id] = l; });
function linkAnuncio(v, ev) {
  const wls = ev.wls;
  const t = (x) => String(x === null || x === undefined ? '' : x).trim();
  const partes = [t(v.marca), t(v.modelo), t(v.versao)];
  const id = t(v.uuid).split('-').join('');
  if (!id || partes.some((p) => !p)) { marca('sem_link'); return null; }
  const soC6 = wls.length > 0 && wls.every((w) => WL_VITRINE_C6.indexOf(w) >= 0);
  if (!soC6 && ev.op === 'C6') marca('link_padrao');
  return (soC6 ? 'https://compraveiculos.cars2you.com.br' : 'https://cars2you.com.br') +
    '/anuncio/veiculo/' + partes.map((p) => encodeURIComponent(p.toLowerCase())).join('/') + '/' + id;
}
const acessoAnuncio = T.acessos_anuncio.map((a) => [num(a.evento), num(a.anuncio), num(a.loja), num(a.dias)]);
const lojasDoAnuncio = {};
acessoAnuncio.forEach((a) => {
  const k = a[0] + '|' + a[1];
  lojasDoAnuncio[k] = (lojasDoAnuncio[k] || 0) + 1;
});
const vistos = {};
const veiculos = [];
T.veiculos.forEach((r) => {
  const ev = evPorId[num(r.evento)];
  if (!ev) { marca('veiculo_sem_evento'); return; }
  const chave = ev.id + '|' + num(r.veiculo);
  if (vistos[chave]) marca('veiculo_repetido');
  vistos[chave] = 1;
  if ((VENDEDORES[ev.op] || []).indexOf(num(r.vendedor)) < 0) marca('outro_vendedor');
  if (num(r.anuncio_apagado) === 1) marca('anuncio_apagado');
  const ofs = ofertasDaNeg[num(r.neg)] || [];
  let ult = null;
  let maior = null;
  ofs.forEach((o) => {
    if (!ult || o.id > ult.id) ult = o;
    if (!maior || o.valor > maior.valor) maior = o;
  });
  const status = num(r.status);
  const vendido = STATUS_VENDA.indexOf(status) >= 0;
  const venc = vendido && r.vencedora !== null ? ofertaPorId[num(r.vencedora)] : null;
  if (vendido && !venc) marca('venda_sem_vencedora');
  const vmv = num(r.vmv);
  let farol = 'sem';
  if (maior) farol = vmv !== null && maior.valor >= vmv ? 'atingiu' : 'abaixo';
  const acessos = lojasDoAnuncio[ev.id + '|' + num(r.anuncio)] || 0;
  const patio = String(r.patio || '').trim();
  if (!patio) marca('sem_patio');
  const nomeVeic = [r.marca, r.modelo, r.versao].filter((x) => x).join(' ');
  veiculos.push({
    ev: ev.id, neg: num(r.neg), anuncio: num(r.anuncio),
    nome: nomeVeic || '(sem modelo)',
    ano: [r.ano_fab, r.ano_mod].filter((x) => x).join('/'),
    patio: patio || '(sem pátio)',
    link: linkAnuncio(r, ev),
    qtd: ofs.length, acessos: acessos,
    ult: ult ? ult.valor : null, ult_quando: ult ? ult.quando : null,
    maior: maior ? maior.valor : null,
    vmv: vmv, fipe: num(r.fipe),
    pvmv: maior && vmv ? maior.valor / vmv : null,
    bruto: acessos * PESO_SCORE.acesso + ofs.length * PESO_SCORE.oferta +
      (farol === 'atingiu' ? PESO_SCORE.vmv : 0),
    status: status, vendido: vendido,
    venc: venc ? venc.id : null,
    venda: venc ? venc.valor : null,
    arrematante: venc ? venc.loja : null,
    pfipe: maior && num(r.fipe) ? maior.valor / num(r.fipe) : null,
    farol: farol
  });
});
const maiorBruto = veiculos.reduce((m, v) => Math.max(m, v.bruto), 0);
veiculos.forEach((v) => { v.score = maiorBruto ? Math.round(1000 * v.bruto / maiorBruto) / 10 : 0; });
const negConhecida = {};
veiculos.forEach((v) => { negConhecida[v.neg] = v; });
T.ofertas.forEach((o) => { if (num(o.loja) === null) marca('lance_sem_loja'); });
const ofertas = T.ofertas.filter((o) => negConhecida[num(o.neg)] && num(o.loja) !== null)
  .map((o) => [num(o.id), num(o.neg), num(o.loja), num(o.valor), o.quando]);
ofertas.forEach((o) => {
  if (!lojaPorId[o[2]]) marca('loja_sem_cadastro');
  else {
    if (evPorId[negConhecida[o[1]].ev].wls.indexOf(lojaPorId[o[2]].wl) < 0) marca('loja_outro_canal');
    if (lojaPorId[o[2]].apagada) marca('loja_apagada');
  }
});
const acessos = [];
nomesAcesso.forEach((k) => {
  T[k].forEach((a) => acessos.push([num(a.loja), String(a.dia), num(a.hora), num(a.n), num(a.evento)]));
});
const TEXTO_AVISO = {
  outro_vendedor: 'veículo(s) de loja vendedora fora da operação do evento (C6: 104754; IGA: 594, 598, 16036)',
  anuncio_apagado: 'veículo(s) com o anúncio apagado e a negociação ainda no evento',
  venda_sem_vencedora: 'venda(s) sem a oferta vencedora entre as ofertas do evento — sem loja compradora',
  veiculo_repetido: 'veículo(s) com mais de uma negociação no mesmo evento',
  veiculo_sem_evento: 'veículo(s) fora dos eventos do recorte',
  sem_link: 'veículo(s) sem marca, modelo, versão ou identificador — sem link do anúncio',
  link_padrao: 'veículo(s) de evento do C6 que alveja outro canal além do C6 — link no cars2you.com.br',
  sem_patio: 'veículo(s) sem pátio no anúncio',
  loja_sem_cadastro: 'lance(s) de loja sem cadastro na tabela de lojas',
  loja_outro_canal: 'lance(s) de loja de um canal que o evento não alveja',
  loja_apagada: 'lance(s) de loja apagada',
  lance_sem_loja: 'lance(s) sem loja compradora — fora das contas'
};
Object.keys(conta).forEach((k) => avisos.push(conta[k] + ' ' + (TEXTO_AVISO[k] || k)));
const DADOS = {
  agora: AGORA, semana: META.semana,
  peso: PESO_SCORE, aprovada: SITUACAO_APROVADA,
  status_nome: STATUS_NOME,
  eventos: eventos, veiculos: veiculos, lojas: lojas, ofertas: ofertas,
  aa: acessoAnuncio, ac: acessos,
  avisos: avisos
};
function calcula(D, sel, F) {
  F = F || {};
  const evs = sel === 'todos' ? D.eventos : D.eventos.filter((e) => e.id === sel);
  const noRecorte = {};
  evs.forEach((e) => { noRecorte[e.id] = e; });
  const lojaPorId = {};
  D.lojas.forEach((l) => { lojaPorId[l.id] = l; });
  const agora = D.agora;
  const estado = (e) => {
    if (agora < e.ini) return 'Agendado';
    if (agora <= e.fim) return 'Em andamento';
    const aberto = D.veiculos.some((v) => v.ev === e.id && v.status === 1);
    return aberto ? 'Encerrando' : 'Encerrado';
  };
  const veicsEv = D.veiculos.filter((v) => noRecorte[v.ev]);
  const Vf = veicsEv.filter((v) => (!F.patio || v.patio === F.patio) && (!F.farol || v.farol === F.farol));
  const vPorNeg = {};
  const vPorAnuncio = {};
  Vf.forEach((v) => { vPorNeg[v.neg] = v; vPorAnuncio[v.ev + '|' + v.anuncio] = v; });
  let pIni = null;
  let pFim = null;
  evs.forEach((e) => {
    if (pIni === null || e.ini < pIni) pIni = e.ini;
    if (pFim === null || e.fim > pFim) pFim = e.fim;
  });
  const dataDe = (c) => '20' + c.slice(0, 2) + '-' + c.slice(2, 4) + '-' + c.slice(4, 6);
  const codDia = (s) => s.slice(2, 4) + s.slice(5, 7) + s.slice(8, 10);
  const diaData = F.dia ? dataDe(F.dia) : null;
  let wIni = pIni;
  let wFim = pFim;
  if (diaData && pIni !== null) {
    const a = diaData + ' 00:00';
    const b = diaData + ' 23:59';
    wIni = a > pIni ? a : pIni;
    wFim = b < pFim ? b : pFim;
  }
  const semJanela = wIni === null || wIni > wFim;
  const hora = (s) => Number(s.slice(11, 13));
  const minuto = (s) => Number(s.slice(14, 16));
  const dIni = semJanela ? null : codDia(wIni);
  const dFim = semJanela ? null : codDia(wFim);
  const hIni = semJanela ? 0 : hora(wIni);
  const hFim = semJanela ? -1 : (minuto(wFim) === 0 ? hora(wFim) - 1 : hora(wFim));
  const horaOk = (d, h) => {
    if (dIni === null || d < dIni || d > dFim) return false;
    if (d === dIni && h < hIni) return false;
    if (d === dFim && h > hFim) return false;
    return true;
  };
  const diaDentro = (d) => !semJanela && d >= wIni.slice(0, 10) && d <= wFim.slice(0, 10) &&
    evs.some((e) => d >= e.ini.slice(0, 10) && d <= e.fim.slice(0, 10));
  const novas = D.lojas.filter((l) => l.fenauto && !l.apagada && diaDentro(l.fenauto.slice(0, 10)));
  const ehNova = {};
  novas.forEach((l) => { ehNova[l.id] = 1; });
  const diasDaLoja = {};
  const lojasDoDia = {};
  const acIni = {};
  const acFim = {};
  const porHoraT = [];
  const porHoraN = [];
  for (let h = 0; h < 24; h++) { porHoraT.push(0); porHoraN.push(0); }
  D.ac.forEach((a) => {
    if (!noRecorte[a[4]] || !horaOk(a[1], a[2])) return;
    (diasDaLoja[a[0]] || (diasDaLoja[a[0]] = {}))[a[1]] = 1;
    (lojasDoDia[a[1]] || (lojasDoDia[a[1]] = {}))[a[0]] = 1;
    const quando = a[1] + (a[2] < 10 ? '0' : '') + a[2];
    if (!acIni[a[0]] || quando < acIni[a[0]]) acIni[a[0]] = quando;
    if (!acFim[a[0]] || quando > acFim[a[0]]) acFim[a[0]] = quando;
  });
  const nDias = (id) => (diasDaLoja[id] ? Object.keys(diasDaLoja[id]).length : 0);
  const Of = D.ofertas.filter((o) => vPorNeg[o[1]] && (!diaData || o[4].slice(0, 10) === diaData));
  const ofPorId = {};
  const ofVeic = {};
  Of.forEach((o) => {
    ofPorId[o[0]] = o;
    const a = ofVeic[o[1]] || (ofVeic[o[1]] = { n: 0, maior: null });
    a.n++;
    if (a.maior === null || o[3] > a.maior) a.maior = o[3];
  });
  const vendidos = Vf.filter((v) => v.vendido && v.venc !== null && ofPorId[v.venc]);
  const comOferta = Vf.filter((v) => ofVeic[v.neg]);
  const vmvAt = Vf.filter((v) => ofVeic[v.neg] && v.vmv !== null && ofVeic[v.neg].maior >= v.vmv);
  const porLoja = {};
  const pl = (id) => porLoja[id] || (porLoja[id] = { negs: {}, lances: 0, arrem: 0 });
  Of.forEach((o) => { const a = pl(o[2]); a.lances++; a.negs[o[1]] = 1; });
  vendidos.forEach((v) => { pl(ofPorId[v.venc][2]).arrem++; });
  const diasEntre = (a, b) => Math.round((Date.UTC(Number(b.slice(0, 4)), Number(b.slice(5, 7)) - 1, Number(b.slice(8, 10))) -
    Date.UTC(Number(a.slice(0, 4)), Number(a.slice(5, 7)) - 1, Number(a.slice(8, 10)))) / 86400000);
  const acessoVeic = {};
  const abriu = {};
  D.aa.forEach((a) => {
    const e = noRecorte[a[0]];
    if (!e) return;
    const v = vPorAnuncio[a[0] + '|' + a[1]];
    if (!v) return;
    if (diaData) {
      const k = diasEntre(e.ini.slice(0, 10), diaData);
      if (k < 0 || k > 30 || !(a[3] & (1 << k))) return;
    }
    acessoVeic[v.neg] = (acessoVeic[v.neg] || 0) + 1;
    abriu[a[2]] = 1;
  });
  const universo = {};
  Object.keys(porLoja).forEach((k) => { universo[k] = 1; });
  Object.keys(diasDaLoja).forEach((k) => { universo[k] = 1; });
  novas.forEach((l) => { universo[l.id] = 1; });
  const rankLojas = Object.keys(universo).map((k) => {
    const id = Number(k);
    const a = porLoja[k] || { negs: {}, lances: 0, arrem: 0 };
    const l = lojaPorId[id] || {};
    const nova = !!ehNova[id];
    const dias = nDias(id);
    return {
      loja: id, nome: l.nome || ('loja ' + id), nova: nova,
      acessos: dias, lances: a.lances, veic: Object.keys(a.negs).length, arrem: a.arrem,
      pri: acIni[id] || null, ult: acFim[id] || null
    };
  }).sort((x, y) => y.arrem - x.arrem || y.lances - x.lances ||
    y.acessos - x.acessos || String(x.nome).localeCompare(String(y.nome)));
  const porPatio = {};
  Vf.forEach((v) => {
    const a = porPatio[v.patio] || (porPatio[v.patio] = { patio: v.patio, veiculos: 0, acesso: 0, oferta: 0, vmv: 0 });
    a.veiculos++;
    if (acessoVeic[v.neg]) a.acesso++;
    if (ofVeic[v.neg]) a.oferta++;
    if (ofVeic[v.neg] && v.vmv !== null && ofVeic[v.neg].maior >= v.vmv) a.vmv++;
  });
  const patios = Object.keys(porPatio).map((k) => {
    const a = porPatio[k];
    a.conversao = a.veiculos ? a.oferta / a.veiculos : null;
    a.pc_vmv = a.veiculos ? a.vmv / a.veiculos : null;
    return a;
  }).sort((x, y) => y.veiculos - x.veiculos || String(x.patio).localeCompare(String(y.patio)));
  const hoje = codDia(agora);
  const listaDias = (ini, fim) => {
    const out = [];
    if (ini === null) return out;
    const ate = fim < hoje ? fim : hoje;
    const dt = new Date(Date.UTC(2000 + Number(ini.slice(0, 2)), Number(ini.slice(2, 4)) - 1, Number(ini.slice(4, 6))));
    const p2 = (n) => (n < 10 ? '0' : '') + n;
    for (let i = 0; i < 400; i++) {
      const c = p2(dt.getUTCFullYear() % 100) + p2(dt.getUTCMonth() + 1) + p2(dt.getUTCDate());
      if (c > ate) break;
      out.push(c);
      dt.setUTCDate(dt.getUTCDate() + 1);
    }
    return out;
  };
  const noRanking = {};
  rankLojas.forEach((r) => { noRanking[r.loja] = 1; });
  const porDia = listaDias(dIni, dFim).map((c) => {
    const ls = Object.keys(lojasDoDia[c] || {}).filter((id) => noRanking[id]);
    return { dia: c, total: ls.length, novas: ls.filter((id) => ehNova[id]).length };
  });
  const lojaHora = {};
  D.ac.forEach((a) => {
    if (!noRanking[a[0]] || !noRecorte[a[4]] || !horaOk(a[1], a[2])) return;
    if (F.dia_hora && a[1] !== F.dia_hora) return;
    const k = a[0] + '|' + a[1] + '|' + a[2];
    if (lojaHora[k]) return;
    lojaHora[k] = 1;
    porHoraT[a[2]]++;
    if (ehNova[a[0]]) porHoraN[a[2]]++;
  });
  let h0 = 0;
  let h1 = 23;
  while (h0 <= 23 && porHoraT[h0] === 0) h0++;
  while (h1 >= 0 && porHoraT[h1] === 0) h1--;
  const porHora = [];
  for (let h = h0; h <= h1; h++) porHora.push({ h: h, total: porHoraT[h], novas: porHoraN[h] });
  const soma = (arr, f) => arr.reduce((t, x) => t + (f(x) || 0), 0);
  const ofertantes = rankLojas.filter((r) => r.lances > 0);
  const participacoes = soma(ofertantes, (r) => r.veic);
  const funilDe = (lista) => [
    ['Cadastrados', lista.length],
    ['Aprovados', lista.filter((l) => l.situacao === D.aprovada).length],
    ['Acessaram', lista.filter((l) => nDias(l.id) > 0).length],
    ['Ofertaram', lista.filter((l) => porLoja[l.id] && porLoja[l.id].lances > 0).length],
    ['Compraram', lista.filter((l) => porLoja[l.id] && porLoja[l.id].arrem > 0).length]
  ];
  const funil = funilDe(novas);
  const kpi = {
    publicados: Vf.length,
    vendidos: vendidos.length,
    volume: soma(vendidos, (v) => v.venda),
    vmv_publicados: soma(Vf, (v) => v.vmv),
    pc_vendido_vmv: soma(Vf, (v) => v.vmv) ? soma(vendidos, (v) => v.venda) / soma(Vf, (v) => v.vmv) : null,
    pc_arrem_fipe: soma(vendidos.filter((v) => v.fipe), (v) => v.fipe)
      ? soma(vendidos.filter((v) => v.fipe), (v) => v.venda) / soma(vendidos.filter((v) => v.fipe), (v) => v.fipe) : null,
    pc_arrem_vmv: soma(vendidos.filter((v) => v.vmv), (v) => v.vmv)
      ? soma(vendidos.filter((v) => v.vmv), (v) => v.venda) / soma(vendidos.filter((v) => v.vmv), (v) => v.vmv) : null,
    vmv_atingido: vmvAt.length,
    acessados: Vf.filter((v) => acessoVeic[v.neg]).length,
    com_oferta: comOferta.length,
    sem_oferta: Vf.length - comOferta.length,
    lances: Of.length,
    ofertantes: ofertantes.length,
    lances_por_lojista: ofertantes.length ? Of.length / ofertantes.length : null,
    compradores: rankLojas.filter((r) => r.arrem > 0).length,
    participacoes: participacoes,
    part_por_lojista: ofertantes.length ? participacoes / ofertantes.length : null,
    novas: novas.length,
    engajamento: novas.length ? funil[2][1] / novas.length : null,
    novas_acessaram: funil[2][1],
    novas_ofertaram: funil[3][1],
    novas_compraram: funil[4][1],
    lojas_acessaram: Object.keys(diasDaLoja).length,
    lojas_ranking_acessaram: rankLojas.filter((r) => r.acessos > 0).length,
    acessos: soma(porHoraT, (n) => n),
    acessos_novas: soma(porHoraN, (n) => n)
  };
  return {
    sel: sel, eventos: evs.map((e) => ({ id: e.id, nome: e.nome, op: e.op, ini: e.ini, fim: e.fim, estado: estado(e) })),
    periodo: [pIni, pFim], janela: [wIni, wFim],
    dias_periodo: listaDias(pIni === null ? null : codDia(pIni), pFim === null ? null : codDia(pFim)),
    patios_evento: Object.keys(veicsEv.reduce((o, v) => { o[v.patio] = 1; return o; }, {})).sort(),
    kpi: kpi, veiculos: Vf, lojas: rankLojas, nova: ehNova,
    patios: patios, por_dia: porDia, por_hora: porHora, funil: funil
  };
}
DADOS.glossario = [
  ['Evento no painel', 'Evento do C6 (alveja o Canal de vendas C6 Auto, whitelabel 43) ou do IGA (tem veículo do Itaú Unibanco, do Repasse Itaú ou da IGA Participações), com "Fenauto" no nome, aberto em algum momento da semana, de segunda a domingo: os em andamento, os agendados e os já encerrados. Evento aberto por mais de 31 dias não entra.'],
  ['Evento', 'Os botões acima da Data: Todos e um por evento da semana, na ordem de início, com a operação (C6 ou IGA) e o estado. Escolher um evento recorta o painel inteiro para ele: veículos, lances, acessos, novos lojistas e os dias da Data.'],
  ['Período', 'Da menor data de início à maior data de encerramento dos eventos filtrados. Acesso e cadastro fora dele não contam.'],
  ['Filtros', 'Na aba lateral. Pátio e status do veículo recortam os veículos, e tudo que nasce deles acompanha: lances, ofertantes, compradores, rankings, pátios e os degraus do funil que dependem de anúncio. Evento e data ficam nos botões acima do funil.'],
  ['Estado do evento', 'Agendado: as ofertas ainda não abriram. Em andamento: dentro do horário. Encerrando: passou do horário de fim e ainda há veículo ativo — os lances da prorrogação caem depois do fim oficial. Encerrado: nenhum veículo ativo.'],
  ['Veículo publicado', 'Cada negociação do evento. O mesmo carro em dois eventos conta uma vez em cada um.'],
  ['Anúncios acessados', 'Veículos que pelo menos uma loja abriu dentro do horário do evento, sobre os publicados.'],
  ['Com ofertas', 'Veículo que recebeu pelo menos um lance naquele evento. O percentual é sobre os publicados.'],
  ['Com VMV atingido', 'Veículo em que alguma oferta alcançou o valor mínimo de venda (VMV) que o vendedor aceita.'],
  ['Vendido / recuperação', 'Negociação em aguardando pagamento, aguardando confirmação de pagamento ou vendido. A loja compradora é a da oferta vencedora; o valor da recuperação, o dessa oferta. Veículo em análise do vendedor ainda não conta.'],
  ['Ofertantes', 'Lojas distintas que deram pelo menos um lance.'],
  ['Compradores', 'Lojas distintas que compraram pelo menos um veículo.'],
  ['Lances/lojista', 'Lances do recorte divididos pelos ofertantes.'],
  ['Participações/lojista', 'Participação é cada veículo em que a loja deu lance (vários lances no mesmo carro contam uma vez). Soma das participações dividida pelos ofertantes.'],
  ['Novos lojistas', 'Lojas com um usuário cadastrado pela campanha da Fenauto (o formulário de cadastro traz "Fenauto"), com esse cadastro num dos dias de um evento do filtro — do dia do início ao dia do fim, o dia inteiro. Vale a data do cadastro do usuário pela campanha, não a da loja: uma loja antiga com um usuário novo da Fenauto conta. Com o filtro de Data, só os cadastros daquele dia. Embaixo, quantas delas acessaram o evento, ofertaram e compraram no recorte.'],
  ['Data', 'Os botões acima do funil: Todos e um por dia do período do evento escolhido. Escolher um dia encolhe o painel inteiro para aquele dia: cadastros (novos lojistas e funil), acessos (gráficos e ranking) e negociações (lances, vendas pela data da oferta vencedora, compradores). A lista de veículos não muda, e o score, as ofertas e o farol de cada veículo continuam os dele.'],
  ['Performance financeira', 'O valor total vendido no recorte. Logo abaixo, esse valor dividido pela soma dos VMV de todos os veículos publicados, vendidos ou não. No pé, a soma das recuperações dividida pela soma da FIPE (só dos vendidos com FIPE) e pela soma dos VMV (só dos vendidos com VMV).'],
  ['Exportar novos lojistas', 'Botão do ranking de lojas: baixa um CSV com as lojas novas do recorte (com ou sem acesso), nas mesmas colunas da tabela. Respeita os filtros da gaveta e o de Data; o botão Todos lojistas / Somente novos não muda o arquivo.'],
  ['Engajamento', 'Novos lojistas que acessaram o evento no período divididos pelos cadastrados.'],
  ['Acessos da loja', 'Dias em que a loja acessou o EVENTO (acesso registrado com o evento) dentro do período; entrar no canal sem abrir o evento não conta. O corte do período é por hora cheia: num evento que começa às 17:13, o acesso das 17:05 entra. O ranking de lojas mostra só quem acessou.'],
  ['Acessos do veículo', 'Lojas distintas que abriram o anúncio dentro do horário do evento. Uma loja que abriu dez vezes conta uma.'],
  ['Score do veículo', 'Acessos × ' + PESO_SCORE.acesso + ' + ofertas × ' + PESO_SCORE.oferta + ' + ' + PESO_SCORE.vmv +
    ' se alguma oferta atingiu o VMV, levado para uma escala de 0 a 100: 100 é o veículo de maior score da coleta inteira. A tabela abre pelo menor score: os veículos que menos engajaram. Score, ofertas e farol são do veículo inteiro: os filtros escolhem quais veículos aparecem, não os recalculam.'],
  ['% VMV', 'A maior oferta do veículo dividida pelo VMV. 100% ou mais = VMV atingido.'],
  ['% FIPE', 'A maior oferta do veículo dividida pela FIPE dele. Só para quem recebeu oferta e tem FIPE; os demais ficam com "—".'],
  ['Resultado', 'O status da negociação e, quando vendeu, a loja compradora — com o selo "novo" se é loja nova do período.'],
  ['Primeiro e último acesso', 'O primeiro e o último acesso da loja ao evento dentro do período, na hora cheia (a coleta guarda o acesso por hora).'],
  ['Pátio', 'Onde o veículo está (o estoque do anúncio). C/ acesso: veículos que alguma loja abriu. % conversão: veículos com oferta sobre os veículos do pátio. % C/ VMV atingido: veículos com VMV atingido sobre os veículos do pátio.'],
  ['Acessos únicos por dia', 'O mesmo indicador da coluna Acessos do ranking de lojas, dia a dia: quantas lojas do ranking (as que ofertaram e as novas) acessaram o evento em cada dia do período — total e só as novas. Somando as colunas dá a soma da coluna Acessos. Clicar num dia mostra as horas daquele dia no gráfico por hora; clicar de novo volta a todos os dias.'],
  ['Acessos por hora', 'A mesma medida dos acessos únicos por dia, contada por hora: quantas lojas do ranking (as que ofertaram e as novas) acessaram o evento em cada hora do dia — cada loja conta uma vez por hora em cada dia. Total e só as novas, do primeiro ao último horário com acesso. Clicando num dia do gráfico por dia, só aquele dia.'],
  ['Funil de ativação', 'Os novos lojistas do período, etapa por etapa: o título à esquerda, o percentual sobre os cadastrados à direita, e a largura da faixa seguindo esse percentual: uma largura mínima (para o número caber dentro) somada em todas as etapas, mais a parte proporcional. Entre as faixas, a passagem de uma etapa para a seguinte. Aprovado: cadastro na situação 3, a de loja operante. Acessaram: acessaram o evento dentro do período — é o mesmo número do engajamento do cartão de novos lojistas. Ofertaram e compraram: no recorte.'],
  ['Farol', 'A bolinha antes do veículo. Vermelho: sem oferta. Amarelo: há oferta, mas nenhuma chegou ao VMV (ou o VMV não foi informado). Verde: alguma oferta alcançou o VMV.'],
  ['Link do anúncio', 'Abre o anúncio na vitrine do evento: a do C6 (compraveiculos.cars2you.com.br) nos eventos do C6, o cars2you.com.br nos do IGA.']
];
const CSS_PAINEL = PECAS.CSS_PAINEL;
const ICONE = PECAS.ICONE;
const chip = (k) => '<span class="chip" aria-hidden="true"><svg viewBox="0 0 24 24">' + ICONE[k] + '</svg></span>';
const kpiCard = (ic, rot, idVal, meio, pe) =>
  '<article class="cartao"><div class="cartao-topo">' + chip(ic) + '<span class="kpi-rot">' + rot + '</span></div>' +
  '<p class="kpi-val num" id="' + idVal + '">—</p>' + meio +
  '<dl class="kpi-pe">' + pe.map((p) => '<div><dt>' + p[0] + '</dt><dd class="num" id="' + p[1] + '">—</dd></div>').join('') +
  '</dl></article>';
const meioPc = (idTxt, idBar) => '<div class="kpi-pc"><span class="txt num" id="' + idTxt + '">—</span><span id="' + idBar + '"></span></div>';
const topoCartao = (ic, titulo, idN, extra) => '<div class="cartao-topo">' + chip(ic) + '<h2>' + titulo + '</h2>' +
  '<span class="dir">' + (extra || '') + '<span class="tag" id="' + idN + '">—</span></span></div>';
const cartaoOrdenavel = (ic, titulo, idN, id, rolo, extra) =>
  '<section class="cartao">' + topoCartao(ic, titulo, idN, extra) +
  '<div class="rolo ' + rolo + '"><table class="dens"><thead><tr id="th-' + id + '"></tr></thead>' +
  '<tbody id="tb-' + id + '"></tbody></table></div></section>';
const LEGENDA = '<div class="legenda"><span><span class="amostra serie-b"></span>Total</span>' +
  '<span><span class="amostra serie-a"></span>Novos</span></div>';
const seg = (id, rot, opcoes, ativo) => '<span class="seg" id="' + id + '" role="group" aria-label="' + rot + '">' +
  opcoes.map((o) => '<button type="button" data-v="' + o[0] + '" aria-pressed="' + (o[0] === ativo) + '">' + o[1] + '</button>').join('') +
  '</span>';
const filtro = (id, rotulo) => '<div class="fg"><label for="' + id + '" id="' + id + '-rot">' + rotulo + '</label>' +
  '<select class="ctrl" id="' + id + '"></select></div>';
const dadosJs = JSON.stringify(DADOS).split('<').join(String.fromCharCode(92) + 'u003c');
const html = '<!doctype html><html lang="pt-BR" data-tema="escuro"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width, initial-scale=1">' +
  '<title>Mega evento Fenauto</title><style>' + CSS_TEMA + CSS_PAINEL + '</style></head><body>' +
  '<header class="topo"><div class="topo-in">' +
  '<span class="marca logo-fen" id="logo-fen">' + LOGO_FEN + '</span>' +
  '<div class="topo-tit"><h1>Mega evento Fenauto</h1><p class="sub" id="sub"></p></div>' +
  '<div class="topo-acoes">' +
  '<button class="ctrl so-icone aviso" id="b-aviso" type="button" hidden aria-label="Pontos de atenção">' +
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/></svg>' +
  '<span class="cont"></span></button>' +
  '<button class="ctrl so-icone" id="b-tema" type="button" aria-label="Mudar o tema"></button>' +
  '</div></div></header><div id="dica" hidden></div><div id="dica-g" hidden></div><div id="dica-lk" hidden></div>' +
  '<button id="aba" class="aba" type="button" aria-expanded="false" aria-controls="gaveta">' +
  '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICONE.filtros + '</svg><span class="rot">Filtros</span>' +
  '<span class="n" id="aba-n" hidden></span></button>' +
  '<div id="veu" class="veu" hidden></div>' +
  '<aside id="gaveta" class="gaveta" aria-label="Filtros"><div class="cartao">' +
  '<div class="cartao-topo">' + chip('filtros') + '<h2>Filtros</h2>' +
  '<button id="fecha" class="fechar" type="button" aria-label="Fechar filtros">×</button></div>' +
  '<div class="filtros">' +
  '<div class="fg"><span class="rot-fg" id="seg-lojas-rot">Lojistas</span>' +
  seg('seg-lojas', 'Lojistas', [['todas', 'Todos lojistas'], ['novas', 'Somente novos']], 'todas') + '</div>' +
  filtro('f-patio', 'Pátio') +
  filtro('f-farol', 'Status do veículo') +
  '<div class="fg"><button class="ctrl" id="limpar" type="button">Limpar filtros</button></div>' +
  '</div>' +
  '<p class="nota"><b>Pátio</b> e <b>status do veículo</b> recortam os veículos: KPIs, rankings, pátios, funil e a lista de veículos acompanham. ' +
  '<b>Lojistas</b> vale só para o ranking de lojas. O <b>evento</b> e a <b>data</b> ficam nos botões acima do funil. ' +
  'Nenhum filtro recalcula o score, as ofertas ou o farol de um veículo.</p>' +
  '</div></aside>' +
  '<main class="area">' +
  '<section class="g4 g5" aria-label="Indicadores">' +
  kpiCard('veiculo', 'Veículos publicados', 'k-pub', meioPc('k-pub-pc', 'k-pub-bar'),
    [['Vendidos', 'k-pub-vend'], ['Com VMV atingido', 'k-pub-vmv']]) +
  kpiCard('oferta', 'Com ofertas', 'k-of', meioPc('k-of-pc', 'k-of-bar'),
    [['Ofertantes', 'k-of-lj'], ['Lances/lojista', 'k-of-lpl']]) +
  kpiCard('vendido', 'Vendidos', 'k-vd', meioPc('k-vd-pc', 'k-vd-bar'),
    [['Compradores', 'k-vd-comp'], ['Participações/lojista', 'k-vd-ppl']]) +
  kpiCard('financeiro', 'Performance financeira', 'k-pf', meioPc('k-pf-pc', 'k-pf-bar'),
    [['Recuperação / FIPE', 'k-pf-fipe'], ['Recuperação / VMV', 'k-pf-vmv']]) +
  kpiCard('nova', 'Novos lojistas', 'k-nv', meioPc('k-nv-pc', 'k-nv-bar'),
    [['Acessaram', 'k-nv-ac'], ['Ofertaram', 'k-nv-of'], ['Compraram', 'k-nv-cp']]) +
  '</section>' +
  '<div class="barras-filtro">' +
  '<div class="barra-dias"><span class="rot-dias" id="f-eventos-rot">Evento</span>' +
  '<div class="seg dias eventos" id="f-eventos" role="group" aria-labelledby="f-eventos-rot"></div></div>' +
  '<div class="barra-dias"><span class="rot-dias" id="f-dias-rot">Data</span>' +
  '<div class="seg dias" id="f-dias" role="group" aria-labelledby="f-dias-rot"></div></div>' +
  '</div>' +
  '<section class="g2i">' +
  '<article class="cartao c-flex">' + topoCartao('funil', 'Funil de ativação dos novos cadastros', 'n-funil') +
  '<div class="funil-g" id="funil"></div></article>' +
  '<article class="cartao c-flex">' + topoCartao('grafico', 'Acessos únicos por dia', 'n-dia') +
  LEGENDA + '<div class="preenche" id="g-dia" data-rot="Acessos únicos por dia: lojas distintas que acessaram o evento, total e novas"></div></article>' +
  '</section>' +
  '<article class="cartao">' + topoCartao('relogio', 'Acessos por hora', 'n-hora', '<span class="hora-dia" id="hora-dia"></span>') +
  LEGENDA + '<div id="g-hora" data-rot="Acessos ao evento por hora do dia, total e das lojas novas"></div></article>' +
  cartaoOrdenavel('rank', 'Ranking de lojas', 'n-lojas', 'lojas', 'medio',
    '<button type="button" class="limpa-dia" id="exporta-novas">Exportar novos lojistas</button>') +
  cartaoOrdenavel('patio', 'Pátios', 'n-patios', 'patios', '') +
  cartaoOrdenavel('veiculo', 'Veículos', 'n-veic', 'veic', 'alto') +
  '<details class="cartao gloss" id="gloss"><summary class="cartao-topo">' + chip('gloss') + '<h2>Glossário</h2>' +
  '<span class="dir"><span class="tag" id="gloss-n">—</span><span class="seta" aria-hidden="true">▾</span></span>' +
  '</summary><dl id="gloss-lista"></dl></details>' +
  '<p class="rodape">Atualizado em <span id="gerado">—</span> · <span id="base"></span></p>' +
  '</main><script>' +
  calcula.toString() + $('Peças da Página Cars2You').first().json.APP +
  'APP(' + dadosJs + ');' +
  '</script></body></html>';
const todos = calcula(DADOS, 'todos', {});
const resumo = {
  eventos: eventos.length, veiculos: veiculos.length, ofertas: ofertas.length,
  lojas_cadastro: lojas.length,
  acessos: { loja_dia_hora: acessos.length, partes: PARTES, anuncio: acessoAnuncio.length },
  kpi: todos.kpi,
  funil: todos.funil,
  patios: todos.patios.length,
  por_evento: eventos.map((e) => {
    const r = calcula(DADOS, e.id, {});
    return { id: e.id, estado: r.eventos[0].estado, kpi: r.kpi, funil: r.funil };
  }),
  top_lojas: todos.lojas.slice(0, 5).map((r) => ({ loja: r.loja, arrem: r.arrem, lances: r.lances, acessos: r.acessos, nova: r.nova })),
  avisos: avisos,
  bytes_html: html.length
};
if (CSS_TEMA.length < 5000) throw new Error('CSS do tema nao injetado (rode _aplica-modelo.js)');
if (LOGO_FEN.indexOf('<svg ') !== 0) throw new Error('logo da Fenauto nao injetada (rode _aplica-modelo.js)');
return [{ json: { html: html, resumo: resumo } }];
