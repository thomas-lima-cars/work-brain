/* ════════
   NÓ "Montar HTML" — aderência loja x veículo, com filtro cruzado

   ─── ELEGIBILIDADE (a regra que define o universo) ────────
   Um par (veículo, loja) só existe se UMA condição valer:

     MESMO WHITELABEL — a loja compradora precisa pertencer a um dos
                        whitelabels que o EVENTO do veículo alveja. Um
                        evento pode alvejar vários (`event_whitelabels`),
                        então a comparação é loja.whitelabel_id ∈ conjunto
                        do evento, não uma igualdade simples.

   Fora disso não há aderência — nem baixa, nem zero: o par não existe.

   ⚠️ ATÉ 2026-09-11 A UF TAMBÉM ERA PORTA, e deixou de ser. Carro de São
   Paulo nunca aparecia para loja de Minas; agora aparece, com o componente
   de UF pesando contra. A UF do veículo continua saindo do PÁTIO
   (`shop_stocks`), não do endereço da loja vendedora — 68% divergem entre
   as duas (sonda 50068) —, só que agora ela informa em vez de excluir.

   Consequência medida: o universo de pares cresceu 5,3x e o ranking de
   cada veículo ficou longo, o que é a razão de existir o TETO_LOJAS.
   Comparar o número de correspondências com o de um relatório anterior a
   essa data não faz sentido.

   ─── A FÓRMULA ────────
   OITO componentes. Cada um tem uma ADERÊNCIA (0..1) e um PESO (0..1).

     preço, idade, km, deságio:
                        aderência = 1 / (1 + |valor − média| / desvio)
                        peso      = 1 / (1 + desvio / média)     ← CV

       Loja de faixa apertada é previsível, então acertar o número dela
       vale muito. Loja que compra de tudo tem CV alto e o peso cai
       sozinho, porque o indicador não informa.

     modelo, categoria, laudo, UF:
                        aderência = 1 se bate com o item mais ofertado
                        peso      = o % de ofertas da loja naquele item

       ⚠️ A UF entrou aqui em 2026-09-11 e ANTES ERA UMA PORTA: par entre
       UFs diferentes simplesmente não existia. Agora é preferência com
       peso proporcional — loja que compra 90% na própria praça prioriza
       forte, loja que compra 0% fica indiferente. Como o universo de pares
       cresceu 5,3x, existe TETO_LOJAS por veículo.

   score = Σ(peso × aderência) / Σ(peso), de 0 a 100.

   `CONFIANCA_MIN` é adição minha, não estava no pedido: multiplica o
   score por min(1, veículos / 5) para loja de histórico minúsculo não
   liderar por sorte. Ponha 1 para desligar.

   Volume de ofertas NÃO entra no score — está na tela como leitura.
   ════════ */

const CONFIANCA_MIN = 5;

/* CORRESPONDENCIA MINIMA (pedido do Thomas em 2026-09-10).
   Par com score abaixo disto nao existe: nao entra no HTML, nao conta nos
   KPIs, nao aparece em nenhuma das duas direcoes.

   O corte e sobre o SCORE, nao sobre a aderencia bruta -- score = aderencia
   x confianca, e e o numero que ordena as tabelas. Cortar pela aderencia
   deixaria passar loja com um carro so de historico e aderencia 100, que e
   justamente o caso que a confianca existe pra segurar. */
const CORRESP_MIN = 50;

/* TETO DE LOJAS POR VEICULO (2026-09-11, segunda rodada).
   Existe porque a UF deixou de ser porta: cada veiculo passou a disputar com
   todas as lojas do canal, e sem teto sao 203.658 pares e ~20 MB de HTML,
   que trava navegador. Medido na simulacao local sobre o run 50379.

   E POR VEICULO, nao global, porque o relatorio e um ranking: teto global
   cortaria veiculos inteiros, teto por veiculo corta a cauda de cada um.
   Com 30 o arquivo fica em ~3,6 MB, menor que os 4,5 MB de hoje, com 5,3x
   mais candidatos avaliados.

   Ponha 0 para desligar. */
const TETO_LOJAS = 30;

/* o mesmo corte de outlier que a fase 2 aplica no desagio das lojas. O
   desagio do VEICULO e calculado aqui (valor e fipe ja estao na base, pedir
   ao banco custaria 26 chamadas por nada), entao o corte precisa ser o
   mesmo dos dois lados -- senao a aderencia compara coisas de escalas
   diferentes. */
const DESAGIO_MIN = -100;
const DESAGIO_MAX = 95;

/* os seis estados do laudo. `ausente` NAO e um valor do banco: e a ausencia
   de linha em vehicle_precautionary_reports, e vale como categoria propria
   porque "nao tem laudo" e diferente de "tem laudo que nao diz nada"
   (`nao_informado`, 78% da base). */
const LAUDO_AUSENTE = 'ausente';
const LAUDO_CHAVES = ['aprovado', 'apontamento', 'reprovado', 'nao_informado',
                      'vazio', LAUDO_AUSENTE];
const LAUDO_NOME = {
  aprovado: 'Aprovado',
  apontamento: 'Aprovado com apontamento',
  reprovado: 'Reprovado',
  nao_informado: 'Nao informado',
  vazio: 'Laudo sem situacao',
  ausente: 'Sem laudo'
};
/* o banco escreve `aprovado_com_apontamento`; a coluna pivotada da fase 2
   chama `laudo_apontamento`. Um de-para explicito evita que a diferenca de
   nome vire aderencia zero em silencio. */
function laudoChave(x) {
  const v = String(x == null ? '' : x).trim();
  if (!v) return null;
  if (v === 'aprovado_com_apontamento') return 'apontamento';
  if (LAUDO_CHAVES.indexOf(v) >= 0) return v;
  return 'vazio';
}

const pedidos = $('Montar Fase 2').all().map((i) => i.json);
const outs = $('MCP Fase 2').all();
const META = pedidos.length ? pedidos[0].meta : {};

function erroTexto(e) {
  if (!e) return null;
  if (typeof e === 'string') return e.slice(0, 300);
  if (Array.isArray(e)) return e.map(erroTexto).join(' | ').slice(0, 300);
  if (e.message) return String(e.message).slice(0, 300);
  if (e.error) return erroTexto(e.error);
  try { return JSON.stringify(e).slice(0, 300); } catch (x) { return String(e).slice(0, 300); }
}

/* ── ingestão ──────── */
const dados = {};
const diag = {};
for (let i = 0; i < pedidos.length; i++) {
  const nome = pedidos[i].queryName;
  if (!dados[nome]) dados[nome] = [];
  if (!diag[nome]) diag[nome] = { queryName: nome, chamadas: 0, linhas: 0, vazias: 0, truncadas: 0, erro: null };
  diag[nome].chamadas++;
  const o = outs[i] ? outs[i].json : null;
  const sc = o ? (o.structuredContent || o) : null;
  const err = o ? (o.error || (sc && sc.error)) : null;
  if (err && !diag[nome].erro) diag[nome].erro = erroTexto(err);
  if (sc && sc.truncated) diag[nome].truncadas++;
  const cols = (sc && sc.columns) || [];
  const rows = (sc && sc.rows) || [];
  if (!rows.length) { diag[nome].vazias++; continue; }
  diag[nome].linhas += rows.length;
  for (let r = 0; r < rows.length; r++) {
    const obj = {};
    for (let c = 0; c < cols.length; c++) obj[cols[c]] = rows[r][c];
    dados[nome].push(obj);
  }
}
const diagnostico = Object.keys(diag).map((k) => {
  const d = diag[k];
  d.veredito = d.erro ? 'ERRO'
    : (d.truncadas ? 'RESPOSTA CORTADA - pagina maior que o teto do MCP'
      : (d.linhas === 0 ? 'ZERO LINHAS' : 'ok'));
  return d;
});

const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v));
function indexa(arr, chave) {
  const m = {};
  for (let i = 0; i < arr.length; i++) m[String(arr[i][chave])] = arr[i];
  return m;
}
function primeiraPorLoja(arr) {
  const m = {};
  for (let i = 0; i < arr.length; i++) {
    const k = String(arr[i].shop_id);
    if (!m[k]) m[k] = arr[i];
  }
  return m;
}

/* ── mapa evento -> whitelabels que ele alveja ──────── */
const eventoWl = {};
const wlNome = {};
(META.evento_wl || []).forEach((r) => {
  const e = String(r.evento_id);
  if (!eventoWl[e]) eventoWl[e] = {};
  eventoWl[e][String(r.whitelabel_id)] = 1;
  if (r.whitelabel) wlNome[String(r.whitelabel_id)] = r.whitelabel;
});

/* ── as sete faixas de recencia ────────
   Regra do Thomas (2026-09-11), com "ofertou" no lugar de "comprou". Em
   cascata: a primeira que bate ganha, entao a ORDEM e a regra.

   A faixa 2 usa a janela do proprio relatorio em vez de "180 dias". Medido
   na sonda 50347: com INTERVAL 180 DAY contra uma base de 6 meses de
   calendario (184 dias), 16 lojas cairam em Prata/Recuperacao so pelos 4
   dias de diferenca -- artefato de unidade, nao segmento real.

   🚨 Nesta base o cluster e DEGENERADO e isso nao e defeito da regra: a base
   *e* "lojas que ofertaram nos ultimos 6 meses", entao nenhuma pode cair em
   "nunca ofertou" e 98,8% fica em Diamante ou Ouro. Medido antes de
   implementar; entra assim por decisao do Thomas. Os sete so tem para onde
   variar sobre o universo inteiro de lojas.

   ⚠️ "Nunca acessou" e uma promessa que o dado NAO sustenta: `access_logs`
   comeca em 2025-08-31. O que existe e "nao acessou nos ultimos 12 meses", e
   o glossario diz isso com todas as letras. Ja "nunca ofertou" e verificavel
   de verdade -- `offers` alcanca 2020-06-24. */
const CLUSTERS = {
  1: { nome: 'Cliente Diamante', desc: 'Top — ofertou nos últimos 30 dias' },
  2: { nome: 'Cliente Ouro', desc: 'Ativo recente — ofertou na janela de 6 meses' },
  3: { nome: 'Cliente Prata', desc: 'Risco de churn — já ofertou e acessou nos últimos 90 dias' },
  4: { nome: 'Cliente Recuperação', desc: 'Ex-ofertante — já ofertou mas não acessou nos últimos 90 dias' },
  5: { nome: 'Lead Quente', desc: 'Engajado sem oferta — acessou nos últimos 90 dias, nunca ofertou' },
  6: { nome: 'Lead Morno', desc: 'Inativo — não acessou nos últimos 90 dias e nunca ofertou' },
  7: { nome: 'Lead Frio', desc: 'Nunca engajado — sem acesso registrado e nunca ofertou' }
};

/* O banco grava data de evento em hora de Brasilia mas responde NOW() em
   UTC (ver dominios.md). META.agora_br ja e o relogio de Brasilia calculado
   no no, entao comparar contra ele mantem os dois lados no mesmo fuso. */
function instante(x) {
  if (!x) return null;
  const t = Date.parse(String(x).indexOf('T') > 0 ? String(x)
    : String(x).split(' ').join('T') + 'Z');
  return isNaN(t) ? null : t;
}
const AGORA_MS = instante(META.agora_br) || Date.now();
const INI_MS = instante(META.data_ini);
const DIA = 86400000;

function clusterDe(ultOferta, ultAcesso) {
  const o = instante(ultOferta);
  const a = instante(ultAcesso);
  if (o !== null && o >= AGORA_MS - 30 * DIA) return 1;
  if (o !== null && INI_MS !== null && o >= INI_MS) return 2;
  if (o !== null && a !== null && a >= AGORA_MS - 90 * DIA) return 3;
  if (o !== null) return 4;
  if (a !== null && a >= AGORA_MS - 90 * DIA) return 5;
  if (a !== null) return 6;
  return 7;
}

/* ── perfil das lojas ──────── */
const iOf = indexa(dados.q_ofertas || [], 'shop_id');
const iPe = indexa(dados.q_perfil || [], 'shop_id');
const iUl = indexa(dados.q_uf_laudo || [], 'shop_id');
const iCt = indexa(dados.q_contato || [], 'shop_id');
const iCl = indexa(dados.q_cluster || [], 'shop_id');

/* Os seis baldes de laudo tem que somar as ofertas da loja. Nao somando, a
   juncao com vehicle_precautionary_reports duplicou ofertas (veiculo com
   mais de um laudo) -- fan-out silencioso, a familia de erro que ja mordeu
   duas vezes aqui. Conta-se para declarar na tela, nao para arredondar. */
let laudoDesencontro = 0;
(dados.q_uf_laudo || []).forEach((r) => {
  const soma = num(r.laudo_ausente) + num(r.laudo_aprovado) + num(r.laudo_apontamento) +
    num(r.laudo_reprovado) + num(r.laudo_nao_informado) + num(r.laudo_vazio);
  if (soma !== num(r.ofertas_base)) laudoDesencontro++;
});
const iMo = primeiraPorLoja(dados.q_modelo || []);
const iCa = primeiraPorLoja(dados.q_categoria || []);

function pesoNum(media, desvio) {
  if (!media || media <= 0) return 0;
  if (desvio === null || desvio === undefined || desvio < 0) return 0;
  return 1 / (1 + (desvio / media));
}

const lojasTodas = (dados.q_lojas || []).map((s) => {
  const k = String(s.shop_id);
  const of = iOf[k] || {};
  const pe = iPe[k] || {};
  const mo = iMo[k] || {};
  const ca = iCa[k] || {};
  const qtOfertas = num(of.qt_ofertas);
  const pct = (n) => (qtOfertas && n ? Number(n) / qtOfertas : 0);
  const precoMedio = num(pe.preco_medio);
  const precoDesvio = num(pe.preco_desvio);
  const idadeMedia = num(pe.idade_media);
  const idadeDesvio = num(pe.idade_desvio);
  const kmMedio = num(pe.km_medio);
  const kmDesvio = num(pe.km_desvio);
  const qtVeiculos = num(pe.qt_veiculos);

  /* os cinco campos de 11/09 */
  const ul = iUl[k] || {};
  const ct = iCt[k] || {};
  const cl = iCl[k] || {};
  const base = num(ul.ofertas_base);
  const fatia = (n) => (base ? Math.round((num(n) / base) * 1000) / 10 : null);
  const cid = clusterDe(cl.ult_oferta, cl.ult_acesso);

  /* moda de laudo da loja: o balde com mais ofertas, e o peso e a fatia
     dele. Mesma forma de modelo e categoria -- loja que concentra 70% das
     ofertas em carro aprovado faz o indicador pesar; loja que compra de
     tudo tem peso baixo e o indicador deixa de mandar. */
  let laudoModa = null;
  let laudoN = 0;
  if (base) {
    const balde = {
      aprovado: num(ul.laudo_aprovado), apontamento: num(ul.laudo_apontamento),
      reprovado: num(ul.laudo_reprovado), nao_informado: num(ul.laudo_nao_informado),
      vazio: num(ul.laudo_vazio), ausente: num(ul.laudo_ausente)
    };
    /* empate desempatado pela ORDEM de LAUDO_CHAVES, que e fixa -- assim a
       mesma loja da o mesmo resultado entre dois runs. Mesmo motivo do
       MIN(item_id) na moda de modelo. */
    for (let i = 0; i < LAUDO_CHAVES.length; i++) {
      const k = LAUDO_CHAVES[i];
      if ((balde[k] || 0) > laudoN) { laudoN = balde[k]; laudoModa = k; }
    }
  }

  return {
    loja_id: num(s.shop_id), loja: s.loja,
    whitelabel_id: num(s.whitelabel_id),
    whitelabel: s.whitelabel || ('whitelabel #' + s.whitelabel_id),
    uf: s.uf || 'Nao identificada',
    qt_ofertas: qtOfertas, qt_veiculos: qtVeiculos,
    preco_medio: precoMedio, preco_desvio: precoDesvio,
    idade_media: idadeMedia, idade_desvio: idadeDesvio,
    km_medio: kmMedio, km_desvio: kmDesvio,
    modelo_id: num(mo.item_id), modelo: mo.nome || null, pct_modelo: pct(mo.n),
    categoria_id: num(ca.item_id), categoria: ca.nome || null, pct_categoria: pct(ca.n),
    p_preco: pesoNum(precoMedio, precoDesvio),
    p_idade: pesoNum(idadeMedia, idadeDesvio),
    p_km: pesoNum(kmMedio, kmDesvio),
    confianca: Math.min(1, (qtVeiculos || 0) / CONFIANCA_MIN),
    amostra_baixa: (qtVeiculos || 0) < CONFIANCA_MIN,

    /* 1. desagio medio contra a FIPE do anuncio, ja com o corte de outlier
       aplicado no SQL. `desagio_n` diz sobre quantos veiculos a media foi
       feita -- media de 3 carros e media de 300 nao valem a mesma coisa. */
    desagio: num(pe.desagio_medio),
    desagio_desvio: num(pe.desagio_desvio),
    desagio_n: num(pe.desagio_n),
    /* peso do desagio: o mesmo inverso do CV de preco, idade e km. Loja que
       compra sempre 30% abaixo da FIPE e previsivel; loja erratica tem CV
       alto e o peso cai sozinho. */
    p_desagio: pesoNum(num(pe.desagio_medio), num(pe.desagio_desvio)),
    /* laudo como indicador qualitativo, igual a modelo e categoria */
    laudo_moda: laudoModa,
    laudo_moda_nome: laudoModa ? LAUDO_NOME[laudoModa] : null,
    pct_laudo: base ? (laudoN / base) : 0,
    /* peso da UF: a fatia de ofertas que a loja faz dentro do proprio
       estado. Loja que compra 90% na praca prioriza forte; loja que compra
       20% e quase indiferente a UF. */
    p_uf: base ? (num(ul.ofertas_mesma_uf) / base) : 0,
    /* 2. quanto a loja oferta dentro da propria praca */
    pct_mesma_uf: fatia(ul.ofertas_mesma_uf),
    /* 3. laudo: seis categorias, e `ausente` nao e `nao_informado` */
    laudo: base ? {
      ausente: fatia(ul.laudo_ausente),
      aprovado: fatia(ul.laudo_aprovado),
      apontamento: fatia(ul.laudo_apontamento),
      reprovado: fatia(ul.laudo_reprovado),
      nao_informado: fatia(ul.laudo_nao_informado),
      vazio: fatia(ul.laudo_vazio)
    } : null,
    /* 4. contato. PII: isto sai no HTML e o HTML sobe pro SharePoint. */
    email: ct.email || null,
    qt_emails: num(ct.qt_emails),
    tel_comercial: ct.tel_comercial || null,
    whatsapp: ct.whatsapp || null,
    tel_privativo: ct.tel_privativo || null,
    /* 5. faixa de recencia, id e nome resolvidos aqui para a tela so exibir */
    cluster: cid,
    cluster_nome: CLUSTERS[cid].nome,
    ult_oferta: cl.ult_oferta || null,
    ult_acesso: cl.ult_acesso || null
  };
}).filter((l) => l.qt_veiculos);

/* ── veículos ──────── */
const STATUS_NOME = {
  1: 'Ativo', 2: 'Aguardando Pagamento', 3: 'Aguardando Confirmacao de Pagamento',
  7: 'Vendido', 8: 'Suspenso', 9: 'Em Analise Comprador', 10: 'Cancelado',
  11: 'Sem Ofertas', 13: 'Em Analise Vendedor', 14: 'Vendedor Rejeitou',
  15: 'Comprador Rejeitou', 18: 'Venda Cancelada'
};

/* a chave e o VEICULO, nao a negociacao: o mesmo carro reaparece em
   eventos diferentes e o SQL ja colapsa por MAX(an.id). Refazer aqui e
   barato e transforma uma regressao silenciosa em falha visivel. */
const vistos = {};
let dupVeic = 0;
const ANO = new Date().getFullYear();
const veiculos = [];

/* desagio do veiculo, com o MESMO corte que a fase 2 aplica no das lojas.
   Fora da faixa devolve null em vez de um numero absurdo: o dado cru chega
   a -1.586%, e um par comparado contra isso produziria aderencia sem
   sentido em vez de nenhuma. */
function desagioDe(valor, fipe) {
  if (valor === null || fipe === null || !fipe || fipe <= 0) return null;
  const d = 100 * (1 - (valor / fipe));
  if (d < DESAGIO_MIN || d > DESAGIO_MAX) return null;
  return Math.round(d * 100) / 100;
}

/* cars2you.com.br/anuncio/veiculo/{marca}/{modelo}/{versao}/{uuid}
   Padrao da reuniao de 25/08, conferido contra os exemplos do Gui. Tudo
   minusculo, encodeURIComponent por trecho (espaco vira %20, nao hifen),
   uuid sem hifens.

   Faltando UM pedaco, devolve null e o relatorio nao mostra botao. Melhor
   sem botao que botao que cai em lugar nenhum. */
function linkAnuncio(marca, modelo, versao, uuid) {
  const t = (x) => String(x == null ? '' : x).trim();
  const partes = [t(marca), t(modelo), t(versao)];
  const id = t(uuid).split('-').join('');
  if (!id || partes.some((p) => !p)) return null;
  return 'https://cars2you.com.br/anuncio/veiculo/' +
    partes.map((p) => encodeURIComponent(p.toLowerCase())).join('/') +
    '/' + id;
}

(dados.q_veiculos || []).forEach((r) => {
  const k = String(r.vehicle_id);
  if (vistos[k]) { dupVeic++; return; }
  vistos[k] = 1;
  const my = num(r.model_year);
  const evid = num(r.evento_id);
  const wls = Object.keys(eventoWl[String(evid)] || {}).map(Number);
  veiculos.push({
    versao: r.versao || null,
    link: linkAnuncio(r.marca, r.modelo, r.versao, r.anuncio_uuid),
    neg_id: num(r.neg_id), vehicle_id: num(r.vehicle_id),
    evento_id: evid, evento: r.evento, fim_evento: r.fim_evento,
    valor: num(r.valor), fipe: num(r.fipe),
    model_id: num(r.model_id), modelo: r.modelo,
    category_id: num(r.category_id), categoria: r.categoria,
    marca: r.marca, model_year: my, idade: my ? ANO - my : null, km: num(r.km),
    /* desagio DO VEICULO: quanto o valor esta abaixo da FIPE do anuncio.
       Calculado aqui porque `valor` e `fipe` ja vieram na q_veiculos --
       pedir ao banco custaria 26 chamadas por um numero que ja se tem.
       Mesmo corte de outlier das lojas: as duas pontas tem que estar na
       mesma escala pra aderencia significar alguma coisa. */
    desagio: desagioDe(num(r.valor), num(r.fipe)),
    /* laudo: NULL no banco vira 'ausente', que e categoria propria. Ver o
       comentario em LAUDO_CHAVES. */
    laudo: laudoChave(r.laudo) || LAUDO_AUSENTE,
    laudo_nome: LAUDO_NOME[laudoChave(r.laudo) || LAUDO_AUSENTE],
    loja_id: num(r.loja_id), loja_vendedora: r.loja_vendedora, uf: r.uf,
    wls: wls,
    wl_nomes: wls.map((w) => wlNome[String(w)] || ('#' + w)).join(', '),
    /* string x string: os dois lados sao 'YYYY-MM-DD HH:MM' em hora de
       Brasilia, entao a ordem lexicografica e a ordem cronologica */
    encerrado: !!(META.agora_br && r.fim_evento && r.fim_evento < META.agora_br),
    neg_status: num(r.neg_status),
    status_nome: STATUS_NOME[num(r.neg_status)] || ('status ' + r.neg_status),
    /* sobra = passou pelo evento e nao foi vendido nem esta em negociacao.
       Status 1 e o unico que significa "ainda em disputa". */
    sobra: num(r.neg_status) !== null && num(r.neg_status) !== 1
  });
});

/* ── aderência, só entre pares elegíveis ──────── */
function adNum(valor, media, desvio) {
  if (valor === null || media === null || !media) return null;
  if (desvio && desvio > 0) return 1 / (1 + (Math.abs(valor - media) / desvio));
  return 1 / (1 + (Math.abs(valor - media) / media));
}
function pontua(v, l) {
  const comps = [];
  const aP = adNum(v.valor, l.preco_medio, l.preco_desvio);
  if (aP !== null && l.p_preco > 0) comps.push({ k: 'preco', a: aP, p: l.p_preco });
  const aI = adNum(v.idade, l.idade_media, l.idade_desvio);
  if (aI !== null && l.p_idade > 0) comps.push({ k: 'idade', a: aI, p: l.p_idade });
  const aK = adNum(v.km, l.km_medio, l.km_desvio);
  if (aK !== null && l.p_km > 0) comps.push({ k: 'km', a: aK, p: l.p_km });
  if (l.pct_modelo > 0 && v.model_id !== null) {
    comps.push({ k: 'modelo', a: (v.model_id === l.modelo_id ? 1 : 0), p: l.pct_modelo });
  }
  if (l.pct_categoria > 0 && v.category_id !== null) {
    comps.push({ k: 'categoria', a: (v.category_id === l.categoria_id ? 1 : 0), p: l.pct_categoria });
  }
  /* desagio: QUANTITATIVO, mesma forma de preco, idade e km */
  const aD = adNum(v.desagio, l.desagio, l.desagio_desvio);
  if (aD !== null && l.p_desagio > 0) comps.push({ k: 'desagio', a: aD, p: l.p_desagio });
  /* laudo: QUALITATIVO, mesma forma de modelo e categoria */
  if (l.pct_laudo > 0 && l.laudo_moda) {
    comps.push({ k: 'laudo', a: (v.laudo === l.laudo_moda ? 1 : 0), p: l.pct_laudo });
  }
  /* UF: QUALITATIVO. Ate 2026-09-11 era uma PORTA -- par entre UFs
     diferentes simplesmente nao existia. Agora e preferencia, com peso
     igual a fatia de ofertas que a loja faz na propria praca: quem compra
     90% dentro do estado prioriza forte, quem compra 20% e quase
     indiferente. */
  if (l.p_uf > 0) {
    comps.push({ k: 'uf', a: (v.uf === l.uf ? 1 : 0), p: l.p_uf });
  }
  if (!comps.length) return null;
  let somaP = 0, somaPA = 0;
  for (let i = 0; i < comps.length; i++) { somaP += comps[i].p; somaPA += comps[i].p * comps[i].a; }
  if (somaP <= 0) return null;
  const det = {};
  for (let i = 0; i < comps.length; i++) det[comps[i].k] = Math.round(comps[i].a * 100);
  return { score: (somaPA / somaP) * l.confianca * 100, det: det };
}

/* Indice de lojas por WHITELABEL, nao mais por UF.
   A UF deixou de ser porta em 2026-09-11 (virou indicador com peso), entao
   o que ainda restringe o universo e so o canal do evento. Sem indice
   nenhum seriam 1.256 x 1.299 comparacoes; com ele, 670 mil. */
const porWl = {};
lojasTodas.forEach((l, i) => {
  const k = String(l.whitelabel_id);
  if (!porWl[k]) porWl[k] = [];
  porWl[k].push(i);
});

/* Canais que tem PELO MENOS UMA loja no universo inteiro, nao so entre as
   publicadas. Evento que alveja unicamente canal de pessoa fisica --
   colaborador, associado, clube -- nao tem loja compradora possivel, e o
   veiculo dele nunca vai ter par. Isso e categoria, nao falta de
   aderencia, e a tela tem que dizer a diferenca. */
const wlComLoja = {};
lojasTodas.forEach((l) => { wlComLoja[String(l.whitelabel_id)] = 1; });

let descartados = 0;       /* pares que existiam mas nao chegaram a CORRESP_MIN */
const pares = [];          /* flat: [vi, li, score*10, det...] */
const detPares = [];       /* decomposição, mesmo índice do par */
const usadas = {};
let cortadosPeloTeto = 0;  /* passaram no corte mas ficaram fora do top-N */
veiculos.forEach((v, vi) => {
  /* candidatos = lojas do CANAL do evento. A UF nao exclui mais ninguem. */
  const vistosL = {};
  const cands = [];
  v.wls.forEach((w) => {
    (porWl[String(w)] || []).forEach((i) => {
      if (!vistosL[i]) { vistosL[i] = 1; cands.push(i); }
    });
  });
  let eleg = 0;
  /* junta TODOS os que passam do corte, ordena, e so entao aplica o teto.
     Cortar durante a varredura guardaria os primeiros, nao os melhores. */
  const passaram = [];
  for (let i = 0; i < cands.length; i++) {
    const l = lojasTodas[cands[i]];
    /* passou na regra de elegibilidade. Contar AQUI, antes do corte, e o
       que permite distinguir "nao ha loja pra este carro" de "havia loja e
       o corte cortou" -- duas causas que pedem decisoes opostas. */
    eleg++;
    const r = pontua(v, l);
    if (!r || !(r.score >= CORRESP_MIN)) { if (r) descartados++; continue; }
    passaram.push({ i: cands[i], s: Math.round(r.score * 10), d: r.det });
  }
  passaram.sort((a, b) => b.s - a.s);
  const fica = TETO_LOJAS > 0 ? passaram.slice(0, TETO_LOJAS) : passaram;
  cortadosPeloTeto += passaram.length - fica.length;
  for (let i = 0; i < fica.length; i++) {
    pares.push(vi, fica[i].i, fica[i].s);
    detPares.push(fica[i].d);
    usadas[fica[i].i] = 1;
  }
  v.candidatos = fica.length;
  v.acima_do_corte = passaram.length;   /* antes do teto */
  v.elegiveis = eleg;
  /* o canal inteiro nao tem loja: o par era impossivel desde o inicio */
  v.canal_sem_loja = !!(v.wls.length && !v.wls.some((w) => wlComLoja[String(w)]));
});

/* só publica as lojas que participam de pelo menos um par */
const mapaLoja = {};
const lojas = [];
Object.keys(usadas).map(Number).sort((a, b) => a - b).forEach((idx) => {
  mapaLoja[idx] = lojas.length;
  const l = lojasTodas[idx];
  lojas.push({
    loja_id: l.loja_id, loja: l.loja, uf: l.uf,
    whitelabel: l.whitelabel, whitelabel_id: l.whitelabel_id,
    qt_ofertas: l.qt_ofertas, qt_veiculos: l.qt_veiculos,
    preco_medio: l.preco_medio, preco_desvio: l.preco_desvio,
    idade_media: l.idade_media, idade_desvio: l.idade_desvio,
    km_medio: l.km_medio, km_desvio: l.km_desvio,
    p_preco: Math.round(l.p_preco * 1000) / 1000,
    p_idade: Math.round(l.p_idade * 1000) / 1000,
    p_km: Math.round(l.p_km * 1000) / 1000,
    confianca: Math.round(l.confianca * 100) / 100,
    modelo: l.modelo, categoria: l.categoria,
    pct_modelo: Math.round(l.pct_modelo * 1000) / 10,
    pct_categoria: Math.round(l.pct_categoria * 1000) / 10,
    amostra_baixa: l.amostra_baixa,
    desagio: l.desagio, desagio_n: l.desagio_n,
    /* os pesos e as modas dos indicadores novos TEM que ser publicados:
       a pontuacao usa `lojasTodas`, mas a tela e o prova-local so enxergam
       este array. Esqueci na primeira versao e o efeito foi silencioso --
       score certo, campo `undefined` na tela. E a mesma familia do "cada no
       reconstroi o proprio META". */
    desagio_desvio: l.desagio_desvio, p_desagio: l.p_desagio,
    laudo_moda: l.laudo_moda, laudo_moda_nome: l.laudo_moda_nome,
    pct_laudo: Math.round(l.pct_laudo * 1000) / 10,
    p_uf: Math.round(l.p_uf * 1000) / 1000,
    pct_mesma_uf: l.pct_mesma_uf,
    laudo: l.laudo,
    email: l.email, qt_emails: l.qt_emails,
    tel_comercial: l.tel_comercial, whatsapp: l.whatsapp,
    tel_privativo: l.tel_privativo,
    cluster: l.cluster, cluster_nome: l.cluster_nome,
    ult_oferta: l.ult_oferta, ult_acesso: l.ult_acesso
  });
});
/* reindexa os pares para o array publicado */
for (let i = 1; i < pares.length; i += 3) pares[i] = mapaLoja[pares[i]];

/* melhor score de cada lado, pra ordenação inicial */
const melhorV = new Array(veiculos.length).fill(0);
const melhorL = new Array(lojas.length).fill(0);
const nParesL = new Array(lojas.length).fill(0);
for (let i = 0; i < pares.length; i += 3) {
  const vi = pares[i], li = pares[i + 1], s = pares[i + 2] / 10;
  if (s > melhorV[vi]) melhorV[vi] = s;
  if (s > melhorL[li]) melhorL[li] = s;
  nParesL[li]++;
}
veiculos.forEach((v, i) => { v.melhor = v.candidatos ? melhorV[i] : null; });
lojas.forEach((l, i) => { l.melhor = melhorL[i]; l.pares = nParesL[i]; });

/* ── completude ──────── */
const falhas = [];
if (META.esperado_veiculos && veiculos.length !== META.esperado_veiculos) {
  falhas.push('coletei ' + veiculos.length + ' veiculos mas a fase 1 contou ' +
    META.esperado_veiculos + ': faltam ' + (META.esperado_veiculos - veiculos.length));
}
if (META.esperado_lojas && lojasTodas.length !== META.esperado_lojas) {
  falhas.push('perfil montado para ' + lojasTodas.length + ' lojas mas a fase 1 contou ' + META.esperado_lojas);
}
const semValor = veiculos.filter((v) => !v.valor).length;
if (semValor) falhas.push(semValor + ' veiculo(s) sem value_actual: ficam sem o componente de preco');
if (dupVeic) {
  falhas.push(dupVeic + ' veiculo(s) vieram mais de uma vez do banco e foram descartados: ' +
    'a query deveria trazer so a ultima negociacao de cada um');
}
/* ── os canais do recorte sao mesmo os que eu penso? ────────
   O recorte e por ID, e id errado nao da erro de SQL: a base so vem menor,
   com um canal faltando, e parece plausivel. A fase 1 perguntou o nome de
   cada id ao banco; aqui se confere contra o nome esperado. */
const wlEsperado = META.wl_esperado || {};
const wlBanco = {};
(META.wl_nomes_banco || []).forEach((r) => {
  wlBanco[String(r.whitelabel_id)] = r.whitelabel;
});
const wlIds = Object.keys(wlEsperado);
if (wlIds.length) {
  const sumiram = wlIds.filter((id) => !wlBanco[id]);
  if (sumiram.length) {
    falhas.push('whitelabel(s) que o recorte pede mas o banco nao tem: ' +
      sumiram.map((id) => id + ' (esperado "' + wlEsperado[id] + '")').join(', ') +
      ' — o canal sumiu da base inteira sem dar erro de SQL.');
  }
  const trocados = wlIds.filter((id) => wlBanco[id] && wlBanco[id] !== wlEsperado[id]);
  if (trocados.length) {
    falhas.push('whitelabel(s) com nome diferente do esperado: ' +
      trocados.map((id) => id + ' e "' + wlBanco[id] + '", nao "' + wlEsperado[id] + '"').join('; ') +
      ' — confira se o id ainda aponta pro canal certo.');
  }
}

/* As duas consultas de moda podem passar do numero de lojas (empate no
   topo rende mais de uma linha por loja), entao elas NAO dao pra conferir
   por contagem de linha -- so por LOJA DISTINTA. Sem isto, truncamento
   nelas tira o componente de modelo/categoria de algumas lojas e o score
   sai menor sem ninguem notar. */
const mLoj = META.moda_lojas || {};
[['q_modelo', 'lojas_modelo', 'modelo'], ['q_categoria', 'lojas_categoria', 'categoria']]
  .forEach((par) => {
    const esperado = Number(mLoj[par[1]]);
    if (!Number.isFinite(esperado)) return;
    const vistas = {};
    (dados[par[0]] || []).forEach((r) => { vistas[String(r.shop_id)] = 1; });
    const n = Object.keys(vistas).length;
    if (n < esperado) {
      falhas.push('a moda de ' + par[2] + ' cobriu ' + n + ' lojas de ' + esperado +
        ': faltam ' + (esperado - n) + ' — provavel truncamento da consulta, e as ' +
        'lojas que faltam perdem esse componente do score em silencio.');
    }
  });

const semWl = veiculos.filter((v) => !v.wls.length).length;
if (semWl) falhas.push(semWl + ' veiculo(s) em evento sem whitelabel declarado: ficam sem nenhuma loja elegivel');
/* os seis baldes de laudo tem que somar as ofertas da loja; nao somando, a
   juncao duplicou ofertas (veiculo com mais de um laudo). Declarar, nao
   arredondar -- fan-out silencioso ja mordeu duas vezes neste projeto. */
if (laudoDesencontro) {
  falhas.push(laudoDesencontro + ' loja(s) em que os status de laudo nao somam o total de ofertas: ' +
    'algum veiculo tem mais de um laudo e as ofertas dele foram contadas em duplicata');
}
/* Tres populacoes, tres causas, tres decisoes diferentes. Declarar as tres
   como uma frase so fez o run 50106 parecer ter 23% de buraco, quando 9,6%
   era impossivel por construcao e so 8,8% responde ao limiar. */
const semCanal = veiculos.filter((v) => v.canal_sem_loja).length;
const semNaUf = veiculos.filter((v) => !v.canal_sem_loja && !v.elegiveis).length;
const cortadosPeloMin = veiculos.filter((v) => v.elegiveis && !v.candidatos).length;
const semPar = veiculos.filter((v) => !v.candidatos).length;
if (semCanal) {
  falhas.push(semCanal + ' veiculo(s) em evento cujo canal NAO TEM loja alguma ' +
    '(canal de pessoa fisica: colaborador, associado, clube). Par impossivel por ' +
    'construcao — nao e falta de aderencia, e categoria.');
}
if (semNaUf) {
  /* Ate 2026-09-11 isto dizia "sem loja do canal na UF do patio". A UF
     deixou de ser porta, entao a unica forma de ficar sem elegivel agora e
     o canal nao ter loja alguma -- que ja tem KPI proprio. Se este numero
     aparecer, e sinal de outra coisa. */
  falhas.push(semNaUf + ' veiculo(s) com canal povoado mas nenhuma loja elegivel: ' +
    'a UF nao exclui mais, entao isto nao deveria acontecer — investigar.');
}
/* Par cortado pelo TETO e par que passou de tudo e ficou de fora mesmo
   assim. Declarar, sempre: descarte silencioso e o defeito que este
   relatorio persegue desde o inicio. */
if (cortadosPeloTeto) {
  falhas.push(cortadosPeloTeto.toLocaleString('pt-BR') + ' par(es) passaram da ' +
    'correspondencia minima mas ficaram fora do teto de ' + TETO_LOJAS +
    ' lojas por veiculo — sao os de menor score de cada carro, e o teto existe ' +
    'porque sem ele o arquivo passa de 20 MB.');
}
if (cortadosPeloMin) {
  falhas.push(cortadosPeloMin + ' veiculo(s) TINHAM loja elegivel, mas nenhuma ' +
    'passou da correspondencia minima de ' + CORRESP_MIN + '% — sao estes, e so ' +
    'estes, que mudariam se o corte baixasse.');
}

const DADOS = {
  gerado_em: new Date().toISOString(),
  meta: {
    meses_historico: META.meses_historico, data_ini: META.data_ini,
    agora_br: META.agora_br, janela_ini: META.janela_ini, janela_fim: META.janela_fim,
    /* o glossario imprime o corte do desagio, e a regeneracao local le
       META de DADOS.meta -- que e um SUBCONJUNTO curado, nao o META
       inteiro. Campo esquecido aqui chega `undefined` no texto do
       glossario, em silencio. Ja aconteceu duas vezes neste projeto. */
    desagio_min: META.desagio_min, desagio_max: META.desagio_max,
    esperado_veiculos: META.esperado_veiculos, esperado_lojas: META.esperado_lojas,
    cobertura_valor: META.cobertura_valor
  },
  parametros: {
    confianca_min: CONFIANCA_MIN,
    corresp_min: CORRESP_MIN,
    whitelabels: META.whitelabels || [],
    wl_esperado: wlEsperado,
    pares_descartados: descartados,
    status_ok: META.status_ok || [],
    status_nome: STATUS_NOME
  },
  por_status: (META.por_status || []).map((r) => ({
    status: num(r.status), nome: STATUS_NOME[num(r.status)] || ('status ' + r.status),
    veiculos: num(r.veiculos), no_relatorio: (META.status_ok || []).indexOf(num(r.status)) >= 0
  })),
  resumo: {
    veiculos: veiculos.length,
    lojas_elegiveis: lojas.length,
    lojas_no_universo: lojasTodas.length,
    pares: pares.length / 3,
    eventos: (META.eventos || []).length,
    encerrados: veiculos.filter((v) => v.encerrado).length,
    sobra: veiculos.filter((v) => v.sobra).length,
    sem_par: semPar,
    sem_canal: semCanal,
    sem_loja_na_uf: semNaUf,
    cortados_pelo_min: cortadosPeloMin,
    cortados_pelo_teto: cortadosPeloTeto,
    teto_lojas: TETO_LOJAS,
    media_candidatos: veiculos.length
      ? Math.round(veiculos.reduce((s, v) => s + v.candidatos, 0) / veiculos.length) : 0
  },
  falhas: falhas,
  diagnostico: diagnostico,
  eventos: META.eventos || [],
  veiculos: veiculos,
  lojas: lojas,
  pares: pares,
  det: detPares
};

const problemas = diagnostico.filter((d) => d.veredito !== 'ok').length + falhas.length;
const DADOS_JSON = JSON.stringify(DADOS).split('</').join('<\\/');

/* ==== RENDER:INICIO ==== (daqui pra baixo tudo depende so de DADOS,
   entao monta_html_de_dados.js reusa este trecho pra regerar o HTML sem
   rodar o workflow de novo. Mexeu so na tela? roda o script local.) */

/* A frase do cabecalho muda de forma conforme o recorte, porque os tres
   modos sao mesmo diferentes -- e no modo lista as datas simplesmente nao
   valem, entao anunciar uma janela seria mentira.

   Ela mora DENTRO do bloco RENDER de proposito: o cabecalho e o glossario
   a usam, e fora daqui o monta_html_de_dados.js nao a enxerga e estoura. */
function descreveRecorte() {
  const ids = META.eventos_ids || [];
  if (ids.length) {
    return ids.length + ' evento(s) escolhido(s) a dedo (o recorte é a lista de ids, não a data)';
  }
  const de = META.janela_ini || '?';
  if (!META.janela_fim) {
    return 'Eventos encerrados a partir de <b>' + de +
      '</b> (hora de Brasília), mais os que ainda não encerraram';
  }
  return 'Eventos que encerram entre <b>' + de + '</b> e <b>' +
    META.janela_fim + '</b> (hora de Brasília)';
}

const CSS = [
  /* --mar e a cor da marca (#1523A0), medida no proprio arquivo da logo.
     Ela tambem vira o acento (--ac) do relatorio: barra de score, links, a
     barra do titulo e o KPI de veiculos passam a falar a mesma lingua. */
  ':root{--bg:#f4f6f9;--card:#fff;--line:#e3e7ed;--line2:#eef1f5;',
  '--mar:#1523A0;',
  '--tx:#1b2e4b;--dim:#7987a1;--ac:#1523A0;--gr:#10b759;--or:#f49917;',
  '--rd:#dc3545;--pu:#6f42c1;--tl:#00b8d4}',
  '*{box-sizing:border-box}',
  'body{margin:0;background:var(--bg);color:var(--tx);',
  'font:13px/1.5 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif}',
  '.topo{background:var(--mar);color:#fff;padding:10px 24px;',
  'display:flex;align-items:center;gap:10px}',
  /* tres faixas de mesma largura (1fr cada) com o titulo no meio: e o que
     mantem o titulo no CENTRO DA PAGINA, e nao no centro do espaco que
     sobrou entre a logo e o botao -- que e o que `space-between` faria. */
  '.topo .esq,.topo .dir{flex:1 1 0;display:flex;align-items:center;gap:12px;min-width:0}',
  '.topo .dir{justify-content:flex-end}',
  '.topo .meio{flex:1 1 auto;text-align:center;min-width:0}',
  /* o fundo da logo e exatamente --mar, entao ela encaixa sem emenda: o que
     se ve e so o wordmark branco. Nada de borda ou raio aqui. */
  '.topo .logo{height:26px;width:26px;display:block;flex:0 0 26px}',
  '.topo b{font-size:19px;letter-spacing:-.4px;color:#fff}',
  '.topo .dim{font-size:11.5px;color:rgba(255,255,255,.72)}',
  /* botao sobre fundo escuro: contorno claro, nao a borda cinza do tema */
  '#btn_info{display:flex;align-items:center;gap:6px;font-weight:600;',
  'background:transparent;color:#fff;border-color:rgba(255,255,255,.45)}',
  '#btn_info:hover{background:rgba(255,255,255,.14);color:#fff;',
  'border-color:rgba(255,255,255,.8)}',
  '#btn_info svg{width:15px;height:15px}',
  '.pg{max-width:1460px;margin:0 auto;padding:20px 24px 40px}',
  '.tit{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px}',
  '.tit h1{font-size:15px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;',
  'margin:0;border-left:3px solid var(--ac);padding-left:10px}',
  '.tit .via{font-size:11.5px;color:var(--dim)}',
  '.card{background:var(--card);border:1px solid var(--line);border-radius:3px;margin-bottom:20px}',
  '.card-h{padding:12px 18px;border-bottom:1px solid var(--line2);font-size:11.5px;',
  'font-weight:600;text-transform:uppercase;letter-spacing:.6px;',
  'display:flex;align-items:center;justify-content:space-between;gap:10px}',
  '.card-h .n{font-weight:400;color:var(--dim);letter-spacing:0;text-transform:none;font-size:11.5px}',
  '.card-b{padding:16px 18px}',
  '.filtros{display:flex;flex-wrap:wrap;gap:14px;align-items:flex-end}',
  '.fg{display:flex;flex-direction:column;gap:4px}',
  '.fg label{font-size:10.5px;text-transform:uppercase;letter-spacing:.5px;color:var(--dim);font-weight:600}',
  'select,input{background:#fff;color:var(--tx);border:1px solid #d5dae1;border-radius:3px;',
  'padding:7px 10px;font-size:12.5px;font-family:inherit;height:34px}',
  'select:focus,input:focus{outline:none;border-color:var(--ac)}',
  'button{background:#fff;color:var(--tx);border:1px solid #d5dae1;border-radius:3px;',
  'padding:7px 14px;font-size:12.5px;font-family:inherit;height:34px;cursor:pointer}',
  'button:hover{border-color:var(--ac);color:var(--ac)}',
  '.nota{margin-top:12px;padding-top:12px;border-top:1px solid var(--line2);',
  'font-size:11.5px;color:var(--dim);line-height:1.6}',
  /* 5 colunas, nao 6: o KPI de correspondencias saiu a pedido, e deixar a
     grade em 6 abriria um buraco no fim da linha. */
  '.kpis{display:grid;grid-template-columns:repeat(5,1fr);background:#fff;',
  'border:1px solid var(--line);border-radius:3px;margin-bottom:20px}',
  '@media(max-width:1250px){.kpis{grid-template-columns:repeat(3,1fr)}}',
  '@media(max-width:700px){.kpis{grid-template-columns:repeat(2,1fr)}}',
  '.kpi{display:flex;align-items:center;gap:11px;padding:15px 16px;',
  'border-left:1px solid var(--line2);min-width:0}',
  '.kpi:first-child{border-left:0}',
  '@media(max-width:1250px){.kpi:nth-child(3n+1){border-left:0}',
  '.kpi:nth-child(n+4){border-top:1px solid var(--line2)}}',
  '@media(max-width:700px){.kpi:nth-child(2n+1){border-left:0}',
  '.kpi:nth-child(n+3){border-top:1px solid var(--line2)}}',
  '.ic{width:20px;height:20px}',
  '.kpi .ring{width:38px;height:38px;border-radius:50%;border:1px solid currentColor;',
  'display:flex;align-items:center;justify-content:center;flex:0 0 38px}',
  '.kpi .tx{min-width:0}',
  '.kpi .lb{font-size:10.5px;text-transform:uppercase;letter-spacing:.5px;font-weight:600;',
  'white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
  '.kpi .vl{font-size:21px;font-weight:600;letter-spacing:-.5px;color:var(--tx);',
  'line-height:1.2;white-space:nowrap}',
  'table{border-collapse:collapse;width:100%;font-size:12px}',
  'th,td{padding:8px 10px;border-bottom:1px solid var(--line2);text-align:right;white-space:nowrap}',
  'th{background:#fbfcfd;position:sticky;top:0;font-weight:600;color:var(--dim);',
  'font-size:10.5px;text-transform:uppercase;letter-spacing:.4px;z-index:1}',
  'th.tx,td.tx{text-align:left}',
  'tbody tr{cursor:pointer}tbody tr:hover{background:#f7f9fc}',
  'tr.sel,tr.sel+tr.dado{background:#eaf2fe}',
  '.wrap{overflow:auto;max-height:62vh}',
  '.vazio{padding:26px 18px;color:var(--dim);text-align:center}',
  /* ---- dois niveis por veiculo: contexto em cima, dados embaixo ---- */
  'tr.ctxr td{border-bottom:0;padding:9px 10px 1px;font-size:11px;color:var(--dim)}',
  'tr.ctxr:hover,tr.ctxr:hover+tr.dado{background:#f7f9fc}',
  'tr.dado td{padding-top:2px;padding-bottom:9px}',
  'tr.dado{border-bottom:1px solid var(--line2)}',
  'tr.ctxr .uf{color:var(--tx);font-weight:600;letter-spacing:.3px}',
  'a.lk{color:var(--ac);text-decoration:none;border-bottom:1px dotted var(--ac)}',
  'a.lk:hover{border-bottom-style:solid}',
  /* painel dos cinco campos: grade que quebra sozinha no estreito */
  '.xg{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}',
  '.xk{flex:1 1 170px;background:var(--bg);border:1px solid var(--line);',
  'border-left:3px solid var(--mar);border-radius:7px;padding:8px 11px}',
  '.xk span{display:block;color:var(--dim);font-size:10.5px;text-transform:uppercase;letter-spacing:.4px}',
  '.xk b{display:block;font-size:17px;font-weight:600;margin-top:2px}',
  '.xk i{display:block;color:var(--dim);font-size:10.5px;font-style:normal;margin-top:2px}',
  '.xk a{color:var(--mar)}',
  '.tag{display:inline-block;padding:1px 7px;border-radius:99px;font-size:10px;',
  'background:#eaf2fe;color:var(--ac);white-space:nowrap}',
  '.tag.w{background:#fff3e0;color:#b25e00}',
  '.dim{color:var(--dim)}',
  '.mono{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:11px}',
  'code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:11.5px;',
  'background:#f1f3f7;padding:1px 5px;border-radius:3px}',
  '.bar{display:inline-block;height:6px;background:var(--ac);border-radius:99px;vertical-align:middle}',
  '.grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start}',
  /* sem isto o 1fr nao vale: item de grade nao encolhe abaixo do conteudo,
     a tabela larga empurra a coluna vizinha e a PAGINA ganha rolagem
     horizontal. Com min-width:0 quem rola e a tabela, dentro do cartao. */
  '.grid>*{min-width:0}',
  '@media(max-width:1200px){.grid{grid-template-columns:1fr}}',
  'td.nm{max-width:250px;overflow:hidden;text-overflow:ellipsis}',
  '.aviso{border-color:#f5c6cb}',
  '.aviso .card-h{color:var(--rd);border-bottom-color:#f5c6cb}',
  '.aviso ul{margin:0;padding-left:18px}.aviso li{margin-bottom:5px}',
  '.ctx{background:#eaf2fe;border:1px solid #bcd8fd;border-radius:3px;',
  'padding:10px 14px;margin-bottom:20px;font-size:12.5px}',
  /* ---- glossario ---- */
  '.gl{max-width:900px}',
  '.gl h2{font-size:13px;text-transform:uppercase;letter-spacing:.6px;',
  'margin:0 0 4px;color:var(--ac)}',
  '.gl .sub{color:var(--dim);font-size:12px;margin:0 0 16px}',
  '.gl dl{margin:0}',
  '.gl dt{font-weight:600;margin-top:16px;font-size:13px}',
  '.gl dt:first-child{margin-top:0}',
  '.gl dd{margin:3px 0 0;color:#3b4b63;line-height:1.65}',
  '.gl dd+dd{margin-top:6px}',
  '.gl .ex{color:var(--dim);font-size:12px}',
  '.gl table{margin-top:8px;font-size:12px;border:1px solid var(--line2)}',
  '.gl td,.gl th{white-space:normal}',
  '.gl .st-in{color:var(--gr);font-weight:600}',
  '.gl .st-out{color:var(--dim)}'
].join('');

/* O JS do cliente viaja como STRING dentro deste no, e este no viaja pro n8n
   como string JSON transcrita a mao. Barra invertida e onde este projeto
   erra: em 2026-09-10 as 248 sequencias de escape de aspa foram dobradas em
   duas tentativas seguidas e o cliente nem compilou. Por isso:

     - elemento que emite aspa simples de atributo HTML usa CRASE, e dentro
       de template literal a aspa nao precisa de escape nenhum;
     - ·, — e ↗ vao como CARACTERE.

   Resultado: 4 barras no arquivo inteiro, que dao pra conferir na mao.
   NAO reintroduza \' aqui, e nao use ${ -- a prova local mede as duas. */
const APP = [
  'const $=(s)=>document.querySelector(s);',
  'const nf=(v,d)=>v===null||v===undefined?"—":Number(v).toLocaleString("pt-BR",{minimumFractionDigits:d||0,maximumFractionDigits:d||0});',
  'const money=(v)=>v===null||v===undefined?"—":"R$ "+nf(v,0);',
  'const esc=(s)=>String(s===null||s===undefined?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;");',
  '$("#ger").textContent=new Date(D.gerado_em).toLocaleString("pt-BR");',
  /* ---- indexa os pares nas duas direcoes ---- */
  'const P=D.pares,DET=D.det;',
  'const porV={},porL={};',
  'for(let i=0,k=0;i<P.length;i+=3,k++){const vi=P[i],li=P[i+1],s=P[i+2]/10;',
  '(porV[vi]=porV[vi]||[]).push({o:li,s:s,d:DET[k]});',
  '(porL[li]=porL[li]||[]).push({o:vi,s:s,d:DET[k]});}',
  'for(const k in porV)porV[k].sort((a,b)=>b.s-a.s);',
  'for(const k in porL)porL[k].sort((a,b)=>b.s-a.s);',
  /* ---- catalogos dos filtros ---- */
  'const evs=Array.from(new Set(D.veiculos.map(v=>v.evento))).sort();',
  'const ufs=Array.from(new Set(D.veiculos.map(v=>v.uf).concat(D.lojas.map(l=>l.uf)))).sort();',
  'const evFechado={};D.veiculos.forEach(function(v){if(v.encerrado)evFechado[v.evento]=1;});',
  'const wlNome={};',
  'D.lojas.forEach(function(l){if(l.whitelabel_id!==null&&l.whitelabel_id!==undefined&&!wlNome[l.whitelabel_id])wlNome[l.whitelabel_id]=l.whitelabel;});',
  'D.veiculos.forEach(function(v){const ns=String(v.wl_nomes||"").split(", ");(v.wls||[]).forEach(function(w,i){if(!wlNome[w])wlNome[w]=ns[i]||("#"+w);});});',
  'const wls=Object.keys(wlNome).map(Number).sort(function(a,b){return String(wlNome[a]).localeCompare(String(wlNome[b]));});',
  'function wlSel(){const i=$("#f_wl").value;return i===""?null:wls[Number(i)];}',
  'function evSel(){const i=$("#f_ev").value;return i===""?null:evs[Number(i)];}',
  'function ufSel(){const i=$("#f_uf").value;return i===""?null:ufs[Number(i)];}',
  'function noWl(v,w){return w===null||(v.wls||[]).indexOf(w)>=0;}',
  'function passaV(v,ev,w,uf){return (!ev||v.evento===ev)&&noWl(v,w)&&(uf===null||v.uf===uf);}',
  'function passaL(l,w,uf){return (w===null||l.whitelabel_id===w)&&(uf===null||l.uf===uf);}',
  /* `tot` e CONTADO, nao somado. Somar as opcoes inflava o whitelabel:
     um evento alveja varios canais e o mesmo carro conta em cada um. */
  /* `extra` e um contador SECUNDARIO, opcional. Existe por causa do facete
     de UF: desde que a UF deixou de ser porta (11/09), uma loja pode ficar
     numa UF onde nao ha veiculo nenhum -- e ela sumia da lista, porque a
     contagem e de veiculos e opcao zerada era descartada. Medido no run
     50406: a loja #104753 fica em RR, tem 19 pares, e RR nao aparecia. */
  'function opcoes(alvo,itens,rotulo,conta,tot,cur,extra){',
  'var manteve=false;',
  'const opts=itens.map(function(it,i){',
  'const n=conta(it);const x=extra?extra(it):0;',
  'if(!n&&!x)return "";',
  'if(String(i)===cur)manteve=true;',
  `const rot=n?(" ("+n+")"):(" (0 · "+x+" loja"+(x>1?"s":"")+")");`,
  `return "<option value='"+i+"'>"+rotulo(it)+rot+"</option>";}).join("");`,
  `$(alvo).innerHTML="<option value=''>"+(alvo==="#f_wl"?"Todos os whitelabels":alvo==="#f_uf"?"Todas as UFs":"Todos os eventos")+" ("+tot+")</option>"+opts;`,
  '$(alvo).value=manteve?cur:"";}',
  'function pintaFiltros(){',
  'const w=wlSel(),ev=evSel(),uf=ufSel();',
  'const qt=function(e2,w2,u2){return D.veiculos.filter(function(v){return passaV(v,e2,w2,u2);}).length;};',
  'opcoes("#f_wl",wls,function(x){return esc(wlNome[x]);},',
  'function(x){return qt(ev,x,uf);},qt(ev,null,uf),$("#f_wl").value);',
  /* o quinto argumento conta LOJAS naquela UF: e o que impede uma UF com
     loja e sem veiculo de desaparecer do filtro. */
  'const qtL=function(w2,u2){return D.lojas.filter(function(l){return passaL(l,w2,u2);}).length;};',
  'opcoes("#f_uf",ufs,function(x){return esc(x);},',
  'function(x){return qt(ev,w,x);},qt(ev,w,null),$("#f_uf").value,',
  'function(x){return qtL(w,x);});',
  'opcoes("#f_ev",evs,function(x){return esc(x)+(evFechado[x]?" [encerrado]":"");},',
  'function(x){return qt(x,w,uf);},qt(null,w,uf),$("#f_ev").value);}',
  'var selV=null,selL=null;',
  /* ---- KPIs: recalculados a cada troca de filtro ---- */
  `function ic(p){return "<svg class='ic' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'>"+p+"</svg>";}`,
  'const ICO={',
  `veic:"<rect x='2.5' y='8' width='19' height='8' rx='2'/><path d='M6.5 16v2M17.5 16v2M5 8l1.6-3.2A2 2 0 018.4 3.7h7.2a2 2 0 011.8 1.1L19 8'/>",`,
  `loja:"<path d='M4.5 9.5h15V20h-15z'/><path d='M4.5 9.5L5.7 4.5h12.6l1.2 5'/><path d='M10 20v-5h4v5'/>",`,
  `par:"<circle cx='8.5' cy='12' r='4.5'/><circle cx='15.5' cy='12' r='4.5'/>",`,
  `med:"<path d='M3.5 19.5h17'/><path d='M6.5 19.5v-6M11 19.5v-11M15.5 19.5v-8M20 19.5v-4'/>",`,
  `sobra:"<path d='M12 3.5l8.5 4-8.5 4-8.5-4z'/><path d='M3.5 7.5v9l8.5 4 8.5-4v-9'/>",`,
  `zero:"<circle cx='12' cy='12' r='8.5'/><path d='M9 9l6 6M15 9l-6 6'/>",`,
  `info:"<circle cx='12' cy='12' r='9'/><path d='M12 11v5M12 7.6v.6'/>"};`,
  `function kpi(cor,icone,rot,val){return "<div class='kpi'><div class='ring' style='color:"+cor+"'>"+ic(icone)+"</div>"+`,
  `"<div class='tx'><div class='lb' style='color:"+cor+"'>"+rot+"</div><div class='vl'>"+val+"</div></div></div>";}`,
  'function pintaKpis(){',
  'const ev=evSel(),w=wlSel(),uf=ufSel();',
  'const vIdx=[];D.veiculos.forEach(function(v,i){if(passaV(v,ev,w,uf))vIdx.push(i);});',
  'const naLista={};vIdx.forEach(function(i){naLista[i]=1;});',
  'var nPares=0;const lojasVistas={};const porVeic={};',
  'for(let i=0;i<P.length;i+=3){',
  'if(!naLista[P[i]])continue;',
  'if(!passaL(D.lojas[P[i+1]],w,uf))continue;',
  'nPares++;lojasVistas[P[i+1]]=1;porVeic[P[i]]=(porVeic[P[i]]||0)+1;}',
  /* "Sem correspondencia" so conta quem PODIA ter par. Veiculo cujo canal
     nao tem loja alguma vai pro KPI proprio, em cinza: numero que nao e
     culpa de ninguem nao deve aparecer em vermelho ao lado dos que sao. */
  'const semCanal=vIdx.filter(function(i){return D.veiculos[i].canal_sem_loja;}).length;',
  'const semPar=vIdx.filter(function(i){return !porVeic[i]&&!D.veiculos[i].canal_sem_loja;}).length;',
  'const media=vIdx.length?Math.round(nPares/vIdx.length):0;',
  '$("#kpis").innerHTML=',
  'kpi("var(--ac)",ICO.veic,"Veículos",nf(vIdx.length))+',
  'kpi("var(--gr)",ICO.loja,"Lojas elegíveis",nf(Object.keys(lojasVistas).length))+',
  'kpi("var(--tl)",ICO.med,"Média de lojas por veículo",nf(media))+',
  'kpi("var(--dim)",ICO.sobra,"Canal sem loja",nf(semCanal))+',
  'kpi(semPar?"var(--rd)":"var(--dim)",ICO.zero,"Sem correspondência",nf(semPar));}',
  /* ---- helpers de celula ---- */
  `function barra(s){return "<span class='bar' style='width:"+Math.round(s/2.6)+"px'></span> "+nf(s,1);}`,
  'function celulas(s,conf){if(s===null||s===undefined)return "<td>—</td><td>—</td>";const c=conf||1;const bruto=s/c;return "<td>"+nf(bruto,1)+"</td><td>"+barra(s)+"</td>";}',
  `function det(d){if(!d)return "";const p=[];["preco","idade","km","desagio","modelo","categoria","laudo","uf"].forEach(k=>{if(d[k]!==undefined)p.push(k[0].toUpperCase()+" "+d[k]);});return "<span class='dim mono'>"+p.join(" · ")+"</span>";}`,
  /* ---- veiculos: dois niveis por carro ---- */
  'function linhasV(){',
  'const q=$("#f_v").value.toLowerCase();',
  'const ev=evSel(),w=wlSel(),uf=ufSel();',
  'let base;',
  'if(selL!==null){base=(porL[selL]||[]).map(x=>({v:D.veiculos[x.o],i:x.o,s:x.s,d:x.d}));}',
  'else{base=D.veiculos.map((v,i)=>({v:v,i:i,s:v.melhor,d:null}));base.sort((a,b)=>(b.s||0)-(a.s||0));}',
  'return base.filter(r=>passaV(r.v,ev,w,uf)&&(!q||((r.v.marca||"")+" "+(r.v.modelo||"")+" "+(r.v.status_nome||"")).toLowerCase().indexOf(q)>=0));}',
  'function pintaV(){',
  'const rows=linhasV();',
  'const comScore=selL!==null;',
  'const nCols=comScore?7:6;',
  '$("#cv").textContent=rows.length+" de "+D.veiculos.length;',
  `if(!rows.length){$("#t_v").innerHTML="";$("#v_vazio").innerHTML="<div class='vazio'>Nenhum veículo no filtro atual.</div>";return;}`,
  '$("#v_vazio").innerHTML="";',
  `$("#t_v").innerHTML="<thead><tr><th class='tx'>Veículo</th><th>Ano</th><th>Km</th><th>Valor</th>"+(comScore?"<th>Aderência</th><th>Score</th>":"<th>Melhor score</th>")+"<th>Lojas</th></tr></thead><tbody>"+`,
  'rows.map(function(r){',
  'const sel=(r.i===selV?" sel":"");',
  /* nivel 1: UF e evento */
  `return "<tr data-i='"+r.i+"' class='ctxr"+sel+"'><td class='tx' colspan='"+nCols+"'>"+`,
  `"<span class='uf'>"+esc(r.v.uf)+"</span> · "+esc(r.v.evento)+`,
  `(r.v.sobra?" <span class='tag w'>"+esc(r.v.status_nome)+"</span>":"")+`,
  /* canal sem loja: dizer na propria linha, senao o carro parece so "sem
     correspondencia" e o leitor procura culpa na aderencia */
  `(r.v.canal_sem_loja?" <span class='tag'>canal sem loja</span>":"")+`,
  /* stopPropagation: a linha toda seleciona o veiculo, e clicar no link nao
     deve mexer na selecao por baixo */
  `(r.v.link?" · <a class='lk' href='"+esc(r.v.link)+"' target='_blank' rel='noopener' onclick='event.stopPropagation()'>anúncio ↗</a>":"")+"</td></tr>"+`,
  /* nivel 2: o veiculo em si */
  `"<tr data-i='"+r.i+"' class='dado"+sel+"'>"+`,
  `"<td class='tx nm' title='"+esc((r.v.marca?r.v.marca+" ":"")+(r.v.modelo||"?"))+"'>"+esc((r.v.marca?r.v.marca+" ":"")+(r.v.modelo||"?"))+" <span class='dim mono'>#"+r.v.vehicle_id+"</span></td>"+`,
  '"<td>"+(r.v.model_year||"—")+"</td><td>"+nf(r.v.km)+"</td><td>"+money(r.v.valor)+"</td>"+',
  '(comScore?celulas(r.s,D.lojas[selL].confianca):"<td>"+(r.s===null?"—":barra(r.s))+"</td>")+',
  '"<td>"+nf(r.v.candidatos)+"</td></tr>";}).join("")+"</tbody>";',
  'Array.prototype.forEach.call($("#t_v").querySelectorAll("tbody tr"),function(tr){tr.onclick=function(){const i=Number(tr.getAttribute("data-i"));selV=(selV===i?null:i);selL=null;pinta();};});}',
  /* ---- lojas ---- */
  'function linhasL(){',
  'const q=$("#f_l").value.toLowerCase();',
  'const w=wlSel(),uf=ufSel();',
  'let base;',
  'if(selV!==null){base=(porV[selV]||[]).map(x=>({l:D.lojas[x.o],i:x.o,s:x.s,d:x.d}));}',
  'else{base=D.lojas.map((l,i)=>({l:l,i:i,s:l.melhor,d:null}));base.sort((a,b)=>(b.s||0)-(a.s||0));}',
  'return base.filter(r=>passaL(r.l,w,uf)&&(!q||((r.l.loja||"")+" "+(r.l.uf||"")+" "+(r.l.whitelabel||"")).toLowerCase().indexOf(q)>=0));}',
  'function pintaL(){',
  'const rows=linhasL();',
  'const comScore=selV!==null;',
  '$("#cl").textContent=rows.length+" de "+D.lojas.length;',
  `if(!rows.length){$("#t_l").innerHTML="";$("#l_vazio").innerHTML="<div class='vazio'>Nenhuma loja no filtro atual.</div>";return;}`,
  '$("#l_vazio").innerHTML="";',
  `$("#t_l").innerHTML="<thead><tr><th class='tx'>Loja</th><th class='tx'>UF</th>"+(comScore?"<th>Aderência</th><th>Score</th><th class='tx'>Componentes</th>":"<th>Melhor score</th>")+"<th>Veículos ofertados 6m</th></tr></thead><tbody>"+`,
  `rows.map(r=>"<tr data-i='"+r.i+"' class='"+(r.i===selL?"sel":"")+"'>"+`,
  `"<td class='tx nm' title='"+esc(r.l.loja)+"'>"+esc(r.l.loja)+" <span class='dim mono'>#"+r.l.loja_id+"</span>"+(r.l.amostra_baixa?" <span class='tag w'>amostra baixa</span>":"")+"</td>"+`,
  `"<td class='tx'>"+esc(r.l.uf)+"</td>"+`,
  `(comScore?celulas(r.s,r.l.confianca)+"<td class='tx'>"+det(r.d)+"</td>":"<td>"+(r.s===null?"—":barra(r.s))+"</td>")+`,
  '"<td>"+nf(r.l.qt_veiculos)+"</td></tr>").join("")+"</tbody>";',
  'Array.prototype.forEach.call($("#t_l").querySelectorAll("tbody tr"),function(tr){tr.onclick=function(){const i=Number(tr.getAttribute("data-i"));selL=(selL===i?null:i);selV=null;pinta();};});}',
  /* ---- contexto da selecao ---- */
  'function ctx(){',
  'if(selV!==null){const v=D.veiculos[selV];',
  `$("#ctx").innerHTML="<b>"+esc((v.marca?v.marca+" ":"")+(v.modelo||"?"))+" "+(v.model_year||"")+"</b> · "+money(v.valor)+" · "+nf(v.km)+" km · "+esc(v.categoria||"?")+" · "+esc(v.uf)+" · "+esc(v.evento)+(v.link?" · <a class='lk' href='"+esc(v.link)+"' target='_blank' rel='noopener'>abrir anúncio ↗</a>":"")+"<br><span class='dim'>"+(v.canal_sem_loja?"O canal deste evento (<b>"+esc(v.wl_nomes||"?")+"</b>) não tem loja compradora alguma — é canal de pessoa física, então não existe par possível para este veículo.":"Lojas elegíveis: as do canal do evento (<b>"+esc(v.wl_nomes||"nenhum")+"</b>) — "+nf(v.elegiveis)+" elegível(is), "+nf(v.candidatos)+" acima de "+MIN+"%. A UF do pátio (<b>"+esc(v.uf)+"</b>) não exclui ninguém: ela <b>pesa</b> no score de cada loja, conforme o quanto aquela loja compra na própria praça.")+"</span>";`,
  '$("#ctx").style.display="";return;}',
  'if(selL!==null){const l=D.lojas[selL];',
  `$("#ctx").innerHTML="<b>"+esc(l.loja)+"</b> · "+esc(l.uf)+" · "+esc(l.whitelabel)+" · perfil: "+money(l.preco_medio)+" · "+nf(l.idade_media,1)+" anos · "+nf(l.km_medio)+" km · "+esc(l.modelo||"?")+" ("+nf(l.pct_modelo,1)+"% das ofertas)<br><span class='dim'>Veículos elegíveis: "+nf(l.pares)+", ordenados por aderência.</span>";`,
  '$("#ctx").style.display="";return;}',
  '$("#ctx").style.display="none";}',
  /* ---- extrato ---- */
  'const LIMIAR=70;',
  'const MIN=(D.parametros&&D.parametros.corresp_min)||0;',
  'function cvDe(m,d){if(!m||d===null||d===undefined)return null;return d/m;}',
  `function leitura(cv){if(cv===null)return "<span class='dim'>sem desvio medido</span>";if(cv<0.25)return "faixa apertada: acertar este número vale muito";if(cv<0.6)return "faixa média";return "dispersão alta: este indicador quase não informa";}`,
  'function extrato(){',
  'if(selL===null){$("#extrato").innerHTML="";$("#extrato").style.display="none";return;}',
  'const l=D.lojas[selL];',
  'const linhas=[];',
  '[["Preço",l.preco_medio,l.preco_desvio,l.p_preco,money],',
  ' ["Idade",l.idade_media,l.idade_desvio,l.p_idade,function(v){return nf(v,1)+" anos";}],',
  ' ["Km",l.km_medio,l.km_desvio,l.p_km,function(v){return nf(v)+" km";}],',
  /* desagio entrou como quantitativo em 11/09: mesma forma de preco, idade
     e km, entao entra na MESMA tabela e nao num canto separado. */
  ' ["Deságio",l.desagio,l.desagio_desvio,l.p_desagio,function(v){return nf(v,1)+"%";}]].forEach(function(r){',
  'const cv=cvDe(r[1],r[2]);',
  `linhas.push("<tr><td class='tx'>"+r[0]+"</td><td>"+(r[1]===null?"—":r[4](r[1]))+"</td><td>"+(r[2]===null||r[2]===undefined?"—":r[4](r[2]))+"</td><td>"+(cv===null?"—":nf(cv,2))+"</td><td>"+nf(r[3],3)+"</td><td class='tx'>"+leitura(cv)+"</td></tr>");});`,
  `linhas.push("<tr><td class='tx'>Modelo</td><td class='tx' colspan='3'>"+esc(l.modelo||"—")+"</td><td>"+nf(l.pct_modelo/100,3)+"</td><td class='tx'>"+nf(l.pct_modelo,1)+"% das ofertas caem neste modelo</td></tr>");`,
  `linhas.push("<tr><td class='tx'>Categoria</td><td class='tx' colspan='3'>"+esc(l.categoria||"—")+"</td><td>"+nf(l.pct_categoria/100,3)+"</td><td class='tx'>"+nf(l.pct_categoria,1)+"% das ofertas caem nesta categoria</td></tr>");`,
  /* laudo e UF: qualitativos, como modelo e categoria.
     As duas linhas SE APAGAM quando o dado nao existe, em vez de renderizar
     NaN. Acontece de verdade: um `dados-*.json` anterior a 11/09 (noite) nao
     tem pct_laudo, e `undefined/100` vira NaN na tela. O smoke pegou isso na
     regeneracao do run 50379. */
  'if(l.pct_laudo!==null&&l.pct_laudo!==undefined){',
  `linhas.push("<tr><td class='tx'>Laudo</td><td class='tx' colspan='3'>"+esc(l.laudo_moda_nome||"—")+"</td><td>"+nf(l.pct_laudo/100,3)+"</td><td class='tx'>"+nf(l.pct_laudo,1)+"% das ofertas caem neste estado de laudo</td></tr>");}`,
  'if(l.p_uf!==null&&l.p_uf!==undefined){',
  `linhas.push("<tr><td class='tx'>UF</td><td class='tx' colspan='3'>"+esc(l.uf)+"</td><td>"+nf(l.p_uf,3)+"</td><td class='tx'>"+nf(l.pct_mesma_uf,1)+"% das ofertas na própria praça"+(l.p_uf?"":" — indiferente à UF")+"</td></tr>");}`,
  'const ev2=evSel(),w2=wlSel(),uf2=ufSel();',
  'const todos=(porL[selL]||[]).filter(function(x){return x.s>LIMIAR;});',
  /* ---- painel dos cinco campos de 11/09 ----
     Cada bloco se apaga sozinho quando o dado nao existe, em vez de mostrar
     um travessao: linha vazia ocupa espaco e nao informa nada. */
  'function perfilExtra(l){',
  'const b=[];',
  /* deságio: media ja cortada nos extremos, com o n ao lado porque media de
     3 carros e media de 300 nao valem o mesmo */
  `if(l.desagio!==null&&l.desagio!==undefined){b.push("<div class='xk'><span>Deságio médio</span><b>"+nf(l.desagio,1)+"%</b><i>abaixo da FIPE, em "+nf(l.desagio_n)+" veículo(s)</i></div>");}`,
  `if(l.pct_mesma_uf!==null&&l.pct_mesma_uf!==undefined){b.push("<div class='xk'><span>Ofertas na própria UF</span><b>"+nf(l.pct_mesma_uf,1)+"%</b><i>o resto foi para fora de "+esc(l.uf)+"</i></div>");}`,
  `if(l.cluster_nome){b.push("<div class='xk'><span>Faixa de recência</span><b>"+esc(l.cluster_nome||"—")+"</b><i>"+(l.ult_oferta?("última oferta "+dataBr(l.ult_oferta)):"sem oferta registrada")+"</i></div>");}`,
  /* laudo: so os status com valor, e `sem laudo` separado de `não informado` */
  'if(l.laudo){const L=l.laudo;const p=[];',
  `[["Aprovado",L.aprovado],["Com apontamento",L.apontamento],["Reprovado",L.reprovado],["Não informado",L.nao_informado],["Sem laudo",L.ausente]].forEach(function(x){if(x[1]){p.push(esc(x[0])+" <b>"+nf(x[1],1)+"%</b>");}});`,
  `if(p.length){b.push("<div class='xk' style='flex:1 1 100%'><span>Laudo cautelar dos veículos ofertados</span><b style='font-size:13px;font-weight:400'>"+p.join(" &middot; ")+"</b><i>&ldquo;não informado&rdquo; é laudo sem veredito, diferente de não ter laudo</i></div>");}}`,
  /* contato: PII, por isso so aparece no painel que se abre por clique */
  'const c=[];',
  `if(l.email){c.push("<a href='mailto:"+esc(l.email)+"'>"+esc(l.email)+"</a>"+(l.qt_emails>1?" <span class='dim'>(1 de "+l.qt_emails+")</span>":""));}`,
  `if(l.tel_comercial){c.push(esc(l.tel_comercial)+" <span class='dim'>comercial</span>");}`,
  `if(l.whatsapp){c.push(esc(l.whatsapp)+" <span class='dim'>WhatsApp</span>");}`,
  `if(l.tel_privativo){c.push(esc(l.tel_privativo)+" <span class='dim'>privativo</span>");}`,
  `if(c.length){b.push("<div class='xk' style='flex:1 1 100%'><span>Contato</span><b style='font-size:13px;font-weight:400'>"+c.join(" &middot; ")+"</b></div>");}`,
  `return b.length?("<div class='xg'>"+b.join("")+"</div>"):"";}`,
  /* data curta em pt-BR, tolerante a formato do banco */
  'function dataBr(x){const t=Date.parse(String(x).indexOf("T")>0?String(x):String(x).split(" ").join("T")+"Z");return isNaN(t)?"—":new Date(t).toLocaleDateString("pt-BR");}',
  'const acima=todos.filter(function(x){return passaV(D.veiculos[x.o],ev2,w2,uf2);});',
  'const escondidos=todos.length-acima.length;',
  `const listaV=acima.length?("<div class='wrap' style='max-height:40vh'><table><thead><tr><th>Aderência</th><th>Score</th><th class='tx'>Veículo</th><th class='tx'>Categoria</th><th>Ano</th><th>Km</th><th>Valor</th><th class='tx'>Evento</th><th class='tx'>Componentes</th></tr></thead><tbody>"+acima.map(function(x){const v=D.veiculos[x.o];return "<tr>"+celulas(x.s,l.confianca)+"<td class='tx'>"+esc((v.marca?v.marca+" ":"")+(v.modelo||"?"))+" <span class='dim mono'>#"+v.vehicle_id+"</span></td><td class='tx'>"+esc(v.categoria||"—")+"</td><td>"+(v.model_year||"—")+"</td><td>"+nf(v.km)+"</td><td>"+money(v.valor)+"</td><td class='tx'>"+esc(v.evento)+"</td><td class='tx'>"+det(x.d)+"</td></tr>";}).join("")+"</tbody></table></div>")`,
  `:(todos.length?("<div class='vazio'>Os "+todos.length+" veículo(s) acima de "+LIMIAR+"% desta loja estão fora do filtro atual.</div>"):("<div class='vazio'>Nenhum veículo passa de "+LIMIAR+"% de aderência para esta loja. O melhor é "+nf(l.melhor,1)+"%.</div>"));`,
  `$("#extrato").innerHTML="<div class='card'><div class='card-h'>Extrato da loja — "+esc(l.loja)+" <span class='n mono'>#"+l.loja_id+"</span></div><div class='card-b'>"+`,
  `"<div style='margin-bottom:12px'>"+esc(l.uf)+" &middot; "+esc(l.whitelabel)+" &middot; <b>"+nf(l.qt_veiculos)+"</b> veículos ofertados em <b>"+nf(l.qt_ofertas)+"</b> lances nos últimos 6 meses"+(l.amostra_baixa?" <span class='tag w'>amostra baixa</span>":"")+" &middot; fator de confiança <b>"+nf(l.confianca,2)+"</b> &middot; elegível para <b>"+nf(l.pares)+"</b> veículo(s)</div>"+`,
  /* ---- os cinco campos de 11/09 ---- */
  'perfilExtra(l)+',
  `"<table><thead><tr><th class='tx'>Indicador</th><th>Referência</th><th>Desvio</th><th>CV</th><th>Peso</th><th class='tx'>Leitura</th></tr></thead><tbody>"+linhas.join("")+"</tbody></table>"+`,
  `"<div class='dim' style='margin-top:10px;font-size:11.5px'>Estes números vêm do histórico de 6 meses da loja inteira e <b>não mudam</b> com o filtro. Ver o glossário para como o peso é formado.</div></div></div>"+`,
  `"<div class='card'><div class='card-h'>Veículos com aderência acima de "+LIMIAR+"% <span class='n'>"+acima.length+" de "+nf(l.pares)+" elegíveis"+(escondidos?", "+escondidos+" fora do filtro":"")+"</span></div>"+listaV+"</div>";`,
  '$("#extrato").style.display="";}',
  /* ---- avisos ---- */
  'const av=[];D.falhas.forEach(f=>av.push("<li>"+esc(f)+"</li>"));',
  `D.diagnostico.filter(d=>d.veredito!=="ok").forEach(p=>av.push("<li><code>"+p.queryName+"</code>: "+esc(p.veredito)+(p.erro?" — <span class='mono'>"+esc(p.erro)+"</span>":"")+"</li>"));`,
  `if(av.length){$("#alerta").innerHTML="<div class='card aviso'><div class='card-h'>"+av.length+" ponto(s) de atenção</div><div class='card-b'><ul>"+av.join("")+"</ul></div></div>";}`,
  /* ---- as duas telas ---- */
  `$("#btn_info").innerHTML=ic(ICO.info)+"<span id='btn_tx'>Glossário</span>";`,
  'var vendoGloss=false;',
  'function mostra(g){vendoGloss=g;',
  '$("#pg_rel").style.display=g?"none":"";',
  '$("#pg_gloss").style.display=g?"":"none";',
  '$("#btn_tx").textContent=g?"Voltar ao relatório":"Glossário";',
  'window.scrollTo(0,0);}',
  '$("#btn_info").onclick=function(){const g=!vendoGloss;location.hash=g?"glossario":"";mostra(g);};',
  'window.onhashchange=function(){mostra(location.hash==="#glossario");};',
  'mostra(location.hash==="#glossario");',
  /* ---- orquestracao ---- */
  'function pinta(){pintaKpis();ctx();pintaV();pintaL();extrato();}',
  '$("#f_v").oninput=pintaV;$("#f_l").oninput=pintaL;',
  '$("#f_ev").onchange=function(){pintaFiltros();pinta();};',
  '$("#f_uf").onchange=function(){pintaFiltros();pinta();};',
  '$("#f_wl").onchange=function(){pintaFiltros();pinta();};',
  '$("#limpar").onclick=function(){selV=null;selL=null;$("#f_v").value="";$("#f_l").value="";$("#f_ev").value="";$("#f_wl").value="";$("#f_uf").value="";pintaFiltros();pinta();};',
  'pintaFiltros();pinta();'
].join('\n');

const MIN_TX = (DADOS.parametros && DADOS.parametros.corresp_min) || 0;
const CORTADOS = (DADOS.parametros && DADOS.parametros.pares_descartados) || 0;
const ST_NOME = (DADOS.parametros && DADOS.parametros.status_nome) || {};
const ST_OK = (DADOS.parametros && DADOS.parametros.status_ok) || [];

/* a tabela de status do glossario sai do proprio dicionario publicado,
   entao mudar STATUS_OK la em cima muda a documentacao junto */
const LINHAS_ST = Object.keys(ST_NOME).map(Number).sort((a, b) => a - b).map((k) => {
  const dentro = ST_OK.indexOf(k) >= 0;
  return '<tr><td>' + k + '</td><td class="tx">' + ST_NOME[k] + '</td><td class="tx ' +
    (dentro ? 'st-in">entra' : 'st-out">fica de fora') + '</td></tr>';
}).join('');

const html = [
  '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width,initial-scale=1">',
  '<title>Veículos x lojas — aderência</title>',
  '<style>' + CSS + '</style></head><body>',
  '<div class="topo"><span class="esq">' +
  '<img class="logo" alt="Cars2You" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAIAAABMXPacAAACAUlEQVR42u3c223CMBgGULCyQlmg2YvVmr2YgCn6gIQqIqLUsfPb4XyPlCLHx/cEzl/fPyeJS1IFAAAIAAACAIAAACAAAAgAAAIAgAAAIAAACAAAAgCAAAAgAAAIAAACAIAAACAAAAgAAAIAgAAAIAAACIBuMjRevvvt+t9/uYyTHhBW+4YgAQBAAHSTc+M/WbZ9Hm58UXQ+3m/Gzc1aNjAEHXQj9m7oaLMxvpR2ZSGLdLVU42IWBu7lv3Y98eS1rbRb1bfMkFF3pcqfHBsUuZzsoXU4Xr3k1cVlnF4+/H67vvuogq1tqFcv89L/fVtfZ5b1thppzzJdxunxepu1v9xiKg22af+NT8ttP6NsGy8nNdUf2591iq817IQ3NaDtrW2wHFxThsfH5m2YOwaIOlabL0lPH3tT/vBNwRwQvJQAEMyTPEsS2wn0gGCYMrck189Rj3dm3/HYv8pqr8RSvWXDfA/5fKXfYar4uDRUXTgv3xpr/9Bih4aSHAHFXmPq9xTlGI8GDzXayHLRO+0rlYpd98Gs7bfAop6Mq3Hu9ilPxvV1CGgjFjxdAQg+SgEQvFoDEHySCCB4swIg+CAdQPCG0T7g5BsyAAQAAAEAQAAAEAAABAAAAQBAAAAQAAAEAAABAEAAABAAAAQAAAEAQAAAEAAABAAAAQBAAAAQAF3lFyBct/RsBkMiAAAAAElFTkSuQmCC">' +
  '</span>',
  '<span class="meio"><b>Veículos em evento &times; lojas compradoras</b></span>',
  '<span class="dir"><button id="btn_info"></button>',
  '<span class="dim">Gerado em <span id="ger"></span></span></span></div>',
  /* ═══ TELA 1: o relatorio ═══ */
  '<div class="pg" id="pg_rel">',
  '<div class="tit"><h1>Aderência por veículo</h1>',
  '<span class="via">' + descreveRecorte() + ' &middot; perfil de compra desde ' + (META.data_ini || '?') + '</span></div>',
  '<div class="card"><div class="card-h">Filtros</div><div class="card-b">',
  '<div class="filtros">',
  '<div class="fg"><label for="f_wl">Whitelabel</label><select id="f_wl"></select></div>',
  '<div class="fg"><label for="f_uf">UF</label><select id="f_uf"></select></div>',
  '<div class="fg"><label for="f_ev">Evento</label><select id="f_ev"></select></div>',
  '<div class="fg"><label for="f_v">Buscar veículo</label><input id="f_v" placeholder="marca, modelo ou status" size="26"></div>',
  '<div class="fg"><label for="f_l">Buscar loja</label><input id="f_l" placeholder="loja, UF ou whitelabel" size="26"></div>',
  '<div class="fg"><label>&nbsp;</label><button id="limpar">Limpar tudo</button></div>',
  '</div>',
  '<div class="nota"><b>Whitelabel</b>, <b>UF</b> e <b>evento</b> valem para a página inteira: KPIs, as duas tabelas e o extrato. As duas <b>buscas</b> só filtram a tabela em que estão.<br>',
  'O filtro <b>não</b> alcança o perfil de compra da loja nem o fator de confiança: esses vêm do histórico de <b>6 meses da loja inteira</b>. Como a aderência é calculada contra esse perfil, o <b>score de cada par também não muda</b> com o filtro &mdash; o filtro escolhe quais pares aparecem, não os recalcula.' +
  (MIN_TX ? ' Correspondência mínima de <b>' + MIN_TX + '%</b>' + (CORTADOS ? ' (' + CORTADOS.toLocaleString('pt-BR') + ' pares descartados nesta coleta)' : '') + '.' : '') +
  ' Os termos estão no <b>glossário</b>, no botão acima.</div>',
  '</div></div>',
  '<div class="kpis" id="kpis"></div>',
  '<div id="alerta"></div>',
  '<div id="ctx" class="ctx" style="display:none"></div>',
  '<div class="grid">',
  '<div class="card"><div class="card-h">Veículos <span class="n" id="cv"></span></div>',
  '<div class="wrap"><table id="t_v"></table></div><div id="v_vazio"></div></div>',
  '<div class="card"><div class="card-h">Lojas <span class="n" id="cl"></span></div>',
  '<div class="wrap"><table id="t_l"></table></div><div id="l_vazio"></div></div>',
  '</div>',
  '<div id="extrato" style="display:none"></div>',
  '</div>',
  /* ═══ TELA 2: o glossario ═══ */
  '<div class="pg gl" id="pg_gloss" style="display:none">',
  '<div class="tit"><h1>Glossário</h1>',
  '<span class="via">O que entra na base, as regras de elegibilidade, e como o número é feito</span></div>',

  '<div class="card"><div class="card-h">O que entra na base</div><div class="card-b"><dl>',
  '<dt>Uma linha por veículo</dt>',
  '<dd>Não uma linha por negociação. O mesmo carro aparece em vários eventos &mdash; os feirões são diários e reciclam estoque &mdash; e contar por negociação o duplicava.</dd>',
  '<dt>Última negociação</dt>',
  '<dd>De cada veículo, vale o status da <b>última</b> negociação dentro da janela de eventos escolhida. A ordem importa e é fácil de inverter sem perceber: primeiro se acha a última negociação, <b>depois</b> se olha o status dela. O contrário faria um carro vendido hoje reaparecer como disponível pela negociação de ontem, que ficou em "Sem Ofertas".</dd>',
  '<dt>Status da negociação</dt>',
  '<dd>Cinco dos doze estados entram. Ficam de fora os que têm <b>oferta viva na mesa</b> (9 e 13) &mdash; ranquear loja para um carro em negociação atrapalha o negócio em andamento &mdash; além da venda e do que foi suspenso ou cancelado.</dd>',
  '<dd><table><thead><tr><th>Cód.</th><th class="tx">Significado</th><th class="tx">No relatório</th></tr></thead><tbody>' + LINHAS_ST + '</tbody></table></dd>',
  '<dt>Sobra</dt>',
  '<dd>Veículo cuja última negociação NÃO está em "Ativo": passou pelo evento e não foi vendido. É o estoque que faz sentido reofertar, e vem marcado com o nome do status na tabela.</dd>',
  '<dt>Canais que entram</dt>',
  /* o recorte de 2026-09-11. Quem le a tela tem que saber que a base NAO e
     a plataforma inteira, senao compara com outro numero e acha erro */
  '<dd>A base <b>não</b> é a plataforma inteira: só entram eventos e lojas de <b>' + ((DADOS.parametros.whitelabels || []).length || 'todos os') + '</b> canais &mdash; ' + (Object.keys(DADOS.parametros.wl_esperado || {}).length ? Object.keys(DADOS.parametros.wl_esperado).map((k) => DADOS.parametros.wl_esperado[k]).join(', ') : 'todos') + '. Evento que não alveja nenhum deles fica fora, e loja de outro canal sai do universo.</dd>',
  '<dt>UF do veículo</dt>',
  /* a UF mudou de fonte em 2026-09-10 e o glossario tem que dizer qual e,
     porque ela decide metade da elegibilidade */
  '<dd>É a UF do <b>pátio</b> onde o carro está (o estoque da loja), não a do endereço da loja vendedora. São coisas diferentes com frequência: <b>68%</b> dos veículos desta base têm pátio numa UF diferente da UF cadastral de quem vende. É a UF do pátio que entra no score, como preferência de praça &mdash; e era ela que, até 11/09/2026, decidia sozinha quem podia ver o carro.</dd>',
  '<dt>Link do anúncio</dt>',
  '<dd>Cada veículo leva o link do anúncio na plataforma. Faltando marca, modelo, versão ou identificador, o link <b>não</b> é mostrado &mdash; melhor sem botão que botão que cai em lugar nenhum.</dd>',
  '<dd class="ex">Ter anúncio não é o mesmo que poder receber proposta: veículo de evento encerrado ou marcado como sobra tem link, mas o anúncio pode não aceitar mais lance. O status vem ao lado do link justamente por isso.</dd>',
  '<dt>Janela de eventos</dt>',
  /* o glossario descreve o recorte DESTA coleta, nao um recorte de exemplo */
  '<dd>Nesta coleta: ' + descreveRecorte() + '. Datas em <b>hora de Brasília</b> &mdash; o banco responde em UTC, então o recorte é calculado fora do SQL e vai como literal; evento que já encerrou continua na base de propósito, porque é justamente onde está a sobra.</dd>',
  '<dd>Quando não há teto, tudo o que ainda não encerrou entra, inclusive evento de fim distante. O filtro de <b>evento</b> acima é a forma de isolar uma edição. O recorte também pode ser uma lista fixa de ids, modo usado para reanalisar edições específicas.</dd>',
  '</dl></div></div>',

  '<div class="card"><div class="card-h">Regras de elegibilidade</div><div class="card-b"><dl>',
  '<dt>Elegibilidade</dt>',
  '<dd>Um par (veículo, loja) <b>só existe</b> se a loja pertence a um dos <b>whitelabels que o evento alveja</b>. O canal é a única condição obrigatória.</dd>',
  '<dd class="ex">⚠️ <b>Mudou em 11/09/2026.</b> Até então a <b>mesma UF</b> também era obrigatória: carro de São Paulo nunca aparecia para loja de Minas. Agora a UF <b>pesa</b> em vez de excluir (ver <i>UF como preferência</i> abaixo), então o ranking de cada veículo ficou bem mais longo e comparar o número de correspondências com o de um relatório anterior a essa data não faz sentido.</dd>',
  '<dt>Whitelabel do evento</dt>',
  '<dd>Um evento pode alvejar vários whitelabels, então a comparação é "o whitelabel da loja está no conjunto do evento", não uma igualdade simples. Como consequência, somar veículos por whitelabel dá um número maior que o total: o mesmo carro conta em cada canal onde é exposto.</dd>',
  '<dt>Canal sem loja compradora</dt>',
  /* sem este verbete, esses carros parecem so "sem correspondencia" e o
     leitor procura culpa na aderencia ou no corte */
  '<dd>Alguns eventos alvejam <b>canais de pessoa física</b> &mdash; colaborador, associado, clube. Ali não existe loja compradora como categoria, então o veículo <b>nunca</b> pode ter par: não é aderência baixa, é ausência de contraparte. Esses carros vêm marcados com a etiqueta <b>canal sem loja</b> e têm KPI próprio, separado de <b>Sem correspondência</b>.</dd>',
  '<dt>Correspondência mínima</dt>',
  '<dd>Par com score abaixo de <b>' + (MIN_TX || 0) + '%</b> não existe em lugar nenhum do relatório: não entra nas tabelas, não conta nos KPIs, não aparece em nenhuma das duas direções. O KPI <b>Sem correspondência</b> conta só quem <b>podia</b> ter par: tinha loja elegível e nenhuma alcançou o piso. São esses, e só esses, que mudariam se o corte baixasse.</dd>',
  '</dl></div></div>',

  '<div class="card"><div class="card-h">Como o número é feito</div><div class="card-b"><dl>',
  '<dt>A ideia</dt>',
  '<dd>Cada loja tem um <b>perfil de compra</b> tirado dos últimos ' + (META.meses_historico || 6) + ' meses de lances dela: em que faixa de preço compra, de que idade, de que quilometragem, e qual modelo e categoria mais oferta. A aderência mede o quanto um veículo cai dentro desse perfil.</dd>',
  '<dt>Aderência de um indicador</dt>',
  '<dd>Nos numéricos (preço, idade, km e deságio): <code>1 / (1 + |valor &minus; média| / desvio)</code>. Vale 1 quando o veículo está exatamente na média da loja e cai conforme se afasta, medido em desvios.</dd>',
  '<dd>Nos qualitativos (modelo, categoria, laudo e UF) é binário: 1 se bate com o item que a loja mais oferta, 0 se não bate.</dd>',
  '<dt>Peso de um indicador</dt>',
  '<dd>Nos numéricos: <code>1 / (1 + desvio / média)</code> &mdash; o inverso do coeficiente de variação. <b>Loja de faixa apertada é previsível</b>, então acertar o número dela vale muito; loja que compra de tudo tem dispersão alta, o peso cai sozinho e o indicador deixa de mandar no resultado.</dd>',
  '<dd>Nos qualitativos, o peso é o <b>% de ofertas</b> da loja naquele item. Loja que concentra 70% dos lances num modelo faz esse indicador pesar mais do que uma que espalha.</dd>',
  '<dt>Aderência (o total)</dt>',
  '<dd><code>&Sigma;(peso &times; aderência) / &Sigma;(peso)</code>, de 0 a 100. É a média dos <b>oito</b> indicadores ponderada pelo quanto cada um informa sobre aquela loja.</dd>',
  '<dd class="ex">Quantitativos: preço, idade, km e <b>deságio</b>. Qualitativos: modelo, categoria, <b>laudo</b> e <b>UF</b>. Indicador sem dado na loja simplesmente não entra na média — não entra como zero, que puxaria o resultado para baixo sem motivo.</dd>',
  '<dt>Fator de confiança</dt>',
  '<dd><code>min(1, veículos / ' + CONFIANCA_MIN + ')</code>. Loja com pouco histórico tem perfil pouco confiável, então o resultado dela é descontado &mdash; com menos de ' + CONFIANCA_MIN + ' veículos ela aparece marcada como <b>amostra baixa</b>.</dd>',
  '<dd class="ex">Esta parte foi adição minha, não estava no pedido original: sem ela, uma loja com um único carro de histórico e aderência 100 lideraria por sorte.</dd>',
  '<dt>Score</dt>',
  '<dd><b>Aderência &times; confiança.</b> É o número que ordena as duas tabelas e o que a barra azul desenha. Quando há seleção, as duas colunas aparecem lado a lado: <b>aderência</b> é o casamento bruto com o perfil, <b>score</b> já é o número descontado.</dd>',
  '<dt>Deságio médio</dt>',
  `<dd>Quanto a loja costuma pagar <b>abaixo da tabela FIPE</b>. Para cada veículo toma-se a <b>última</b> oferta dela e compara-se com a FIPE do anúncio; o número é a média dessas diferenças.</dd>`,
  '<dd class="ex">São descartadas as distorções fora da faixa de ' + META.desagio_min + '% a ' + META.desagio_max + '%. O dado cru chega a &minus;1.586%, ou seja oferta dezesseis vezes acima da FIPE registrada, e um único caso desses destrói a média de uma loja. A quantidade de veículos que sobrou aparece ao lado — média de três carros e média de trezentos não valem o mesmo.</dd>',
  '<dt>Ofertas na própria UF</dt>',
  `<dd>Fatia dos lances da loja em veículos cujo <b>pátio</b> fica no mesmo estado dela. O complemento é compra para fora, que envolve frete e logística.</dd>`,
  '<dt>Laudo cautelar</dt>',
  `<dd>Distribuição dos veículos que a loja ofertou por situação do laudo. <b>&ldquo;Não informado&rdquo; não é o mesmo que &ldquo;sem laudo&rdquo;:</b> o primeiro é um laudo que existe e não traz o resultado — a maior parte da base —, o segundo é veículo sem laudo nenhum. Os dois aparecem separados de propósito.</dd>`,
  '<dt>Faixa de recência</dt>',
  `<dd>Classificação da loja em sete faixas, da mais ativa à mais fria, combinando <b>quando ofertou pela última vez</b> e <b>quando acessou a plataforma pela última vez</b>. A primeira faixa que se aplica é a que vale.</dd>`,
  `<dd class="ex"><b>Nesta tela a faixa quase não varia, e isso é esperado:</b> a base do relatório é justamente &ldquo;lojas que ofertaram nos últimos 6 meses&rdquo;, então praticamente toda loja aqui é Diamante ou Ouro. As sete faixas só se separam sobre o conjunto completo de lojas da plataforma.</dd>`,
  `<dd class="ex">⚠️ O registro de acesso começa em 31/08/2025. Onde se lê &ldquo;nunca acessou&rdquo;, o que o dado sustenta é <b>&ldquo;não acessou nos últimos 12 meses&rdquo;</b>. Já &ldquo;nunca ofertou&rdquo; é verificável de verdade: o histórico de ofertas alcança 2020.</dd>`,
  '<dt>Contato</dt>',
  `<dd>Telefones vêm do cadastro da loja; o <b>e-mail vem do usuário vinculado a ela</b>, porque o campo de e-mail do cadastro está preenchido em menos de 6% dos casos contra 99% no usuário. Quando há mais de um usuário com e-mail, mostra-se o de menor identificador e a contagem aparece ao lado.</dd>`,
  '<dt>UF como preferência</dt>',
  '<dd>A UF do pátio do veículo comparada com a da loja. Vale 1 se batem, 0 se não batem &mdash; e o <b>peso</b> é a fatia de lances que aquela loja faz dentro do próprio estado.</dd>',
  '<dd class="ex">É o que torna a preferência <b>proporcional ao comportamento de cada loja</b>: quem compra 90% na própria praça prioriza forte o carro local; quem compra 20% quase não se importa; quem nunca comprou no próprio estado fica <b>exatamente indiferente</b>, porque o peso é zero e o indicador nem entra na conta.</dd>',
  '<dt>Teto de lojas por veículo</dt>',
  /* DADOS.resumo, nao a constante: dentro do RENDER so existe o que o
     `monta_html_de_dados.js` injeta (DADOS, META, CONFIANCA_MIN,
     DADOS_JSON). Citar TETO_LOJAS aqui quebrou a regeneracao na hora --
     mesma familia do descreveRecorte() de 10/09, so que ao contrario. */
  '<dd>Cada veículo publica no máximo <b>' + ((DADOS.resumo && DADOS.resumo.teto_lojas) || 0) + '</b> lojas &mdash; as de maior score. Existe porque a UF deixou de excluir: o universo de pares cresceu mais de cinco vezes e, sem teto, o arquivo passaria de 20 MB e travaria o navegador.</dd>',
  '<dd class="ex">O corte é da <b>cauda</b> de cada carro, nunca de carros inteiros, e o número de pares que ficaram de fora é declarado no aviso do topo &mdash; descarte silencioso seria pior que teto nenhum.</dd>',
  '<dt>Componentes</dt>',
  '<dd>A decomposição do par, indicador a indicador (P preço, I idade, K km, D deságio, M modelo, C categoria, L laudo, U UF), cada um de 0 a 100. Serve para ver <i>por que</i> aquele score saiu: um 90 sustentado por preço e idade é diferente de um 90 que veio só de categoria.</dd>',
  '<dt>O que o filtro não muda</dt>',
  '<dd>O perfil de compra e o fator de confiança saem do histórico da <b>loja inteira</b>, sem recorte por whitelabel, UF ou evento. Como a aderência é calculada contra esse perfil, <b>o score de cada par não muda</b> com o filtro. O filtro escolhe quais pares aparecem; não os recalcula.</dd>',
  '<dt>Volume de ofertas</dt>',
  '<dd>Não entra no score. "Veículos ofertados 6m" está na tabela como leitura de porte da loja, não como critério de ranking.</dd>',
  '</dl></div></div>',
  '</div>',
  '<script>const D=' + DADOS_JSON + ';</' + 'script>',
  '<script>' + APP + '</' + 'script>',
  '</body></html>'
].join('\n');

/* ==== RENDER:FIM ==== */

return [{
  json: {
    resumo: DADOS.resumo,
    falhas: falhas,
    diagnostico: diagnostico,
    problemas: problemas,
    html_bytes: html.length,
    html: html,
    DADOS: DADOS
  }
}];