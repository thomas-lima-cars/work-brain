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

/* CORRESPONDENCIA MINIMA. DESLIGADA em 2026-09-18 a pedido do Thomas.
   Par com score abaixo disto nao existiria em lugar nenhum do relatorio.

   Foi 50 entre 10 e 18/09. Desligar mexe menos do que o nome sugere, e
   medir antes evitou a surpresa: no run 50406 o minimo zerava apenas 10
   veiculos dos 1.221, e os pares iam de 33.503 para no maximo 36.409
   (+8,7%). Quem corta de verdade e o TETO_LOJAS abaixo -- 110.006 pares
   por run. Se um dia o pedido for "ver mais loja por veiculo", a alavanca
   e o teto, nao este numero.

   O piso agora e do usuario: a barra deslizante do extrato nasce em 70%.
   Em troca, a cauda dos veiculos com poucas lojas boas passa a exibir par
   de score baixo -- e isso e intencional desde a decisao de 18/09.

   Se voltar a valer: o corte e sobre o SCORE, nao sobre a aderencia bruta
   -- score = aderencia x confianca, e e o numero que ordena as tabelas.
   Cortar pela aderencia deixaria passar loja com um carro so de historico
   e aderencia 100, que e justamente o caso que a confianca segura. */
const CORRESP_MIN = 0;

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
/* Com o minimo em 0 a frase acima nunca sai, e o silencio enganaria: o
   teto continua cortando. Entao declara que o piso agora e do leitor. */
if (!CORRESP_MIN) {
  falhas.push('Sem correspondencia minima nesta coleta: todo par elegivel entra, ' +
    'ate score baixo. O piso e a barra deslizante do extrato, que nasce em 70%.');
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

/* ══════════════════════════════════════════════════════════════════════
   VISUAL — o modelo de painel do brain, e nao um tema so deste relatorio
   ----------------------------------------------------------------------
   Ate 18/09 este relatorio tinha paleta e componentes proprios: fundo
   #f4f6f9, cartao de raio 3px, topo azul solido, cinco KPIs numa faixa
   unica. Funcionava, e estava SOZINHO: cada relatorio novo reinventava o
   mesmo cartao, e contraste corrigido num nao chegava no outro.

   Agora a folha vem de `design/tokens/tema.css`, a mesma dos modelos em
   `design/modelos/`. Este no roda DENTRO do n8n e nao pode ler arquivo do
   disco, entao a folha e injetada aqui por:

       node automations/n8n-sdk/rel-veiculos/_aplica-modelo.js

   🔴 NAO EDITE O BLOCO TEMA A MAO. Mexa em `design/tokens/tema.css` e rode
   o injetor. `_prova-modelo.js` confere que esta copia bate com a fonte —
   copia que so um humano atualiza vira copia desatualizada.
   ══════════════════════════════════════════════════════════════════════ */
const TEMA = [
/* TEMA:INICIO */
  ':root{--marca-azul:       #1523A0;--marca-azul-claro: #487DEA;--marca-cinza:      #E4E6E6;',
  '--marca-vinho:      #6F4047;--marca-vermelho:   #7F1112;--d-verde:          #0E7C55;',
  '--d-verde-vivo:     #35C08A;--d-vermelho-vivo:  #EF5B60;--r-g: 16px;--r-m: 12px;--r-p: 10px;',
  '--gap: 16px;--topo-h: 68px;',
  '--fonte: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,"Helvetica Neue", Arial, "Noto Sans", sans-serif;',
  '}:root,[data-tema="claro"]{color-scheme: light;--fundo:          #F2F3F5;',
  '--fundo-veu:      radial-gradient(1200px 600px at 12% -10%,rgba(72,125,234,.10), transparent 60%);',
  '--superficie:     #FFFFFF;--superficie-2:   #F7F8FA;--borda:          var(--marca-cinza);',
  '--borda-forte:    #CFD3D8;--texto:          #14161C;--texto-2:        #565B6B;',
  '--texto-3:        #8A8FA0;--acento:         var(--marca-azul);',
  '--acento-cheio:   var(--marca-azul-claro);--acento-veu:     rgba(72,125,234,.12);',
  '--positivo:       var(--d-verde);--negativo:       var(--marca-vermelho);',
  '--atencao:        var(--marca-vinho);--grade:          rgba(20,22,28,.08);',
  '--sombra:         0 1px 2px rgba(16,20,40,.05), 0 8px 24px rgba(16,20,40,.06);',
  '--cartao-borda:   1px solid var(--borda);--cartao-fundo:   var(--superficie);',
  '--cartao-blur:    none;--brilho:         none;}[data-tema="escuro"]{color-scheme: dark;',
  '--fundo:          #0B0D12;',
  '--fundo-veu:      radial-gradient(900px 500px at 8% -8%,rgba(72,125,234,.20), transparent 62%),radial-gradient(800px 500px at 96% 4%,rgba(111,64,71,.16), transparent 60%);',
  '--superficie:     #12151D;--superficie-2:   #171B25;--borda:          rgba(255,255,255,.09);',
  '--borda-forte:    rgba(255,255,255,.16);--texto:          #EDEFF5;--texto-2:        #A4ABBF;',
  '--texto-3:        #6E7589;--acento:         var(--marca-azul-claro);',
  '--acento-cheio:   var(--marca-azul-claro);--acento-veu:     rgba(72,125,234,.18);',
  '--positivo:       var(--d-verde-vivo);--negativo:       var(--d-vermelho-vivo);',
  '--atencao:        #C98A92;--grade:          rgba(255,255,255,.07);',
  '--sombra:         0 1px 1px rgba(0,0,0,.4), 0 16px 40px rgba(0,0,0,.45);',
  '--cartao-borda:   1px solid rgba(255,255,255,.08);',
  '--cartao-fundo:   linear-gradient(158deg, rgba(255,255,255,.075),rgba(255,255,255,.025));',
  '--cartao-blur:    blur(16px) saturate(140%);',
  '--brilho:         radial-gradient(420px 180px at 0% 0%,rgba(72,125,234,.16), transparent 70%);',
  '}*,*::before,*::after{ box-sizing:border-box }html{ -webkit-text-size-adjust:100% }body{',
  'margin:0;font-family:var(--fonte);font-size:14px;line-height:1.45;color:var(--texto);',
  'background-color:var(--fundo);background-image:var(--fundo-veu);background-attachment:fixed;',
  'background-repeat:no-repeat;-webkit-font-smoothing:antialiased;}h1,h2,h3{ margin:0;',
  ' font-weight:650; letter-spacing:-.01em }p{ margin:0 }.num{',
  ' font-variant-numeric:tabular-nums; font-feature-settings:"tnum" 1 }.topo{position:sticky;',
  ' top:0; z-index:30;background:var(--cartao-fundo);',
  'background-color:color-mix(in srgb, var(--superficie) 88%, transparent);',
  'border-bottom:var(--cartao-borda);backdrop-filter:var(--cartao-blur);',
  '-webkit-backdrop-filter:var(--cartao-blur);}.topo-in{max-width:1680px; margin:0 auto;',
  'min-height:var(--topo-h);padding:10px 20px;display:flex; align-items:center; gap:16px;',
  ' flex-wrap:wrap;}.logo{ height:26px; width:auto; display:block; flex:none }.topo-tit{',
  ' margin-right:auto; min-width:200px }.topo-tit h1{ font-size:17px }.topo-tit .sub{',
  ' font-size:12.5px; color:var(--texto-3); margin-top:1px }.topo-acoes{ display:flex;',
  ' align-items:center; gap:8px; flex-wrap:wrap }.ctrl{font:inherit; font-size:13px;',
  ' color:var(--texto);background:var(--superficie-2);border:1px solid var(--borda);',
  'border-radius:var(--r-p);padding:7px 11px;cursor:pointer;',
  'transition:border-color .15s, background .15s;}.ctrl:hover{',
  ' border-color:var(--borda-forte) }.ctrl:focus-visible{ outline:2px solid var(--acento);',
  ' outline-offset:1px }select.ctrl{ padding-right:26px }.ctrl.so-icone{ padding:7px;',
  ' display:inline-flex; align-items:center }.ctrl.so-icone svg{ width:16px; height:16px;',
  ' display:block; stroke:currentColor;fill:none; stroke-width:1.9; stroke-linecap:round;',
  'stroke-linejoin:round }.area{max-width:1680px; margin:0 auto;padding:var(--gap) 20px 48px;',
  'display:flex; flex-direction:column; gap:var(--gap);}.g4{ display:grid; gap:var(--gap);',
  ' grid-template-columns:repeat(4,1fr) }.g2{ display:grid; gap:var(--gap);',
  ' grid-template-columns:2fr 1fr }@media (max-width:1100px){.g4{',
  ' grid-template-columns:repeat(2,1fr) }.g2{ grid-template-columns:1fr }}',
  '@media (max-width:620px){.g4{ grid-template-columns:1fr }.area{ padding:12px 12px 40px }',
  '.topo-in{ padding:10px 12px }}.cartao{position:relative;background:var(--cartao-fundo);',
  'border:var(--cartao-borda);border-radius:var(--r-g);box-shadow:var(--sombra);',
  'backdrop-filter:var(--cartao-blur);-webkit-backdrop-filter:var(--cartao-blur);padding:18px;',
  'overflow:hidden;}.cartao::before{content:""; position:absolute; inset:0;',
  'background:var(--brilho);pointer-events:none;}.cartao > *{ position:relative }.cartao-topo{',
  'display:flex; align-items:center; gap:10px;margin-bottom:14px;}.cartao-topo h2{',
  ' font-size:14.5px; font-weight:650 }.cartao-topo .dir{ margin-left:auto; display:flex;',
  ' gap:6px; align-items:center }.chip{flex:none; width:34px; height:34px; border-radius:50%;',
  'display:grid; place-items:center;background:var(--acento-veu);color:var(--acento);}',
  '.chip svg{ width:17px; height:17px; stroke:currentColor; fill:none;stroke-width:1.9;',
  ' stroke-linecap:round; stroke-linejoin:round }.g4 .cartao{ padding:13px 14px }',
  '.g4 .cartao-topo{ margin-bottom:6px; gap:8px }.g4 .chip{ width:26px; height:26px }',
  '.g4 .chip svg{ width:14px; height:14px }.kpi-rot{ font-size:12.5px; color:var(--texto-2);',
  ' font-weight:500 }.kpi-val{font-size:23px; line-height:1.15; font-weight:700;',
  ' letter-spacing:-.015em;margin:4px 0 2px;}.kpi-delta{ font-size:11.5px; font-weight:600;',
  ' display:inline-flex; gap:4px;align-items:center }.sobe{ color:var(--positivo) } .desce{',
  ' color:var(--negativo) }.neutro{ color:var(--texto-3) }.kpi-pe{display:flex; gap:16px;',
  'margin-top:9px; padding-top:8px;border-top:1px solid var(--borda);}.kpi-pe div{',
  ' min-width:0 }.kpi-pe dt{ font-size:11px; color:var(--texto-3); white-space:nowrap;',
  'overflow:hidden; text-overflow:ellipsis }.kpi-pe dd{ margin:1px 0 0; font-size:13.5px;',
  ' font-weight:650 }.graf{ width:100%; height:auto; display:block; overflow:visible }',
  '.graf .eixo{ font-size:10.5px; fill:var(--texto-3) }.graf .linha-grade{ stroke:var(--grade);',
  ' stroke-width:1 }.graf .serie{ fill:none; stroke:var(--acento-cheio); stroke-width:2.25;',
  'stroke-linecap:round; stroke-linejoin:round }.graf .area-serie{ fill:url(#veu-serie);',
  ' stroke:none }.graf .ponto{ fill:var(--acento-cheio) }.graf .rotulo{ font-size:11px;',
  ' font-weight:650; fill:var(--texto);font-variant-numeric:tabular-nums }.rank{',
  ' list-style:none; margin:0; padding:0; display:flex;flex-direction:column; gap:11px }',
  '.rank li{ display:grid; grid-template-columns:22px 1fr auto; gap:10px;align-items:center }',
  '.rank .pos{ font-size:12px; color:var(--texto-3); text-align:right }.rank .nome{',
  ' display:block; font-size:13px; overflow:hidden;text-overflow:ellipsis; white-space:nowrap }',
  '.rank .barra{ display:block; height:5px; border-radius:3px;background:var(--acento-veu);',
  ' margin-top:5px; overflow:hidden }.rank .barra i{ display:block; height:100%;',
  ' border-radius:3px;background:var(--acento-cheio) }.rank .val{ font-size:13px;',
  ' font-weight:650 }.rolo{ overflow-x:auto; margin:0 -18px -18px; padding:0 18px 18px }table{',
  ' width:100%; border-collapse:collapse; font-size:13px }thead th{position:sticky; top:0;',
  'background:var(--superficie-2);color:var(--texto-2); font-weight:600; font-size:12px;',
  'text-align:center; white-space:nowrap;padding:9px 10px;border-bottom:1px solid var(--borda);',
  '}tbody td{ padding:9px 10px; text-align:center;border-bottom:1px solid var(--borda) }',
  'tbody td:first-child, thead th:first-child{ text-align:left }tbody tr:last-child td{',
  ' border-bottom:none }tbody tr:hover td{ background:var(--acento-veu) }.tag{',
  'display:inline-block; font-size:11.5px; font-weight:600;padding:2px 8px;',
  ' border-radius:999px;background:var(--acento-veu); color:var(--acento);}.tag.ok{',
  ' background:color-mix(in srgb, var(--positivo) 16%, transparent);color:var(--positivo) }',
  '.tag.ruim{ background:color-mix(in srgb, var(--negativo) 16%, transparent);',
  'color:var(--negativo) }.tag.atencao{',
  ' background:color-mix(in srgb, var(--atencao) 18%, transparent);color:var(--atencao) }',
  '.rodape{ color:var(--texto-3); font-size:12px; padding:4px 2px 0 }.rodape a{',
  ' color:var(--acento) }.gloss{ padding:0 }.gloss > summary{cursor:pointer; padding:18px;',
  ' margin:0;list-style:none;border-radius:var(--r-g);}',
  '.gloss > summary::-webkit-details-marker{ display:none }.gloss > summary:focus-visible{',
  ' outline:2px solid var(--acento); outline-offset:-2px }.gloss .seta{ color:var(--texto-3);',
  ' font-size:11px; transition:transform .15s }.gloss[open] > summary{',
  ' border-radius:var(--r-g) var(--r-g) 0 0 }.gloss[open] .seta{ transform:rotate(180deg) }',
  '.gloss dl{margin:0; padding:0 18px 18px;display:grid; grid-template-columns:auto 1fr;',
  ' gap:9px 18px;font-size:12.5px;}.gloss dt{ font-weight:650; white-space:nowrap }.gloss dd{',
  ' margin:0; color:var(--texto-2) }@media (max-width:620px){.gloss dl{',
  ' grid-template-columns:1fr; gap:2px 0 }.gloss dt{ white-space:normal; margin-top:8px }',
  '.gloss dt:first-child{ margin-top:0 }}@media print{body{ background:#fff; color:#000 }.topo{',
  ' position:static }.topo-acoes{ display:none }.cartao{ box-shadow:none;',
  ' border:1px solid #ccc; backdrop-filter:none;break-inside:avoid }.cartao::before{',
  ' display:none }}@media (prefers-reduced-motion:reduce){*{ transition:none !important;',
  ' animation:none !important }}'
/* TEMA:FIM */
].join('');

/* ══════════════════════════════════════════════════════════════════════
   A PONTE
   ----------------------------------------------------------------------
   Este relatorio usa 24 nomes de classe proprios (.pg, .card, .card-h,
   .kpi, .wrap, .xk, .gl...) em centenas de lugares, dentro do APP e do
   esqueleto. Renomear tudo seria mexer em 86 KB de gerador para nao mudar
   nada na tela — e cada ponto esquecido viraria um elemento sem estilo.

   Entao a ponte faz o contrario: mantem os nomes e troca o que eles
   SIGNIFICAM. Os tokens antigos viram apelido dos novos, e o tema escuro
   passa a funcionar de graca em tudo que ja usava var(--ac) e companhia.
   ══════════════════════════════════════════════════════════════════════ */
const PONTE = [
  /* 1. tokens antigos -> tokens do modelo. `var()` dentro de custom property
        resolve na HORA DO USO, entao o apelido acompanha a troca de tema. */
  ':root{--bg:var(--fundo);--card:var(--superficie);--line:var(--borda);',
  '--line2:var(--borda);--tx:var(--texto);--dim:var(--texto-3);',
  '--ac:var(--acento);--mar:var(--acento);--gr:var(--positivo);',
  '--or:var(--atencao);--rd:var(--negativo);--pu:#7C5CD6;--tl:#0E7F97}',
  /* --pu e --tl rotulam CLUSTER: sao categorias, nao estado. Precisam de
     matiz propria, e a versao clara some no fundo escuro. */
  '[data-tema=escuro]{--pu:#A78BFA;--tl:#22D3EE}',

  /* tabela densa pede corpo menor que o do modelo (14px) */
  'body{font-size:13px}',

  /* 2. topo: era barra azul solida; no modelo e superficie, e fica fixa */
  /* `display:flex` mora AQUI porque o bloco de CSS antigo (que o tinha) foi
     inteiro substituido. Sem ele `.esq` e `.dir` voltam a ser span inline e
     a logo cai numa linha, o titulo noutra. */
  '.topo{display:flex;align-items:center;gap:16px;flex-wrap:wrap;',
  'position:sticky;top:0;z-index:30;padding:10px 20px 10px 52px;',
  'background:var(--cartao-fundo);background-color:var(--superficie);',
  'border-bottom:var(--cartao-borda);color:var(--texto);',
  'backdrop-filter:var(--cartao-blur);-webkit-backdrop-filter:var(--cartao-blur)}',
  /* o titulo deixa de ser centralizado: no modelo ele encosta na logo e as
     acoes e que vao pra direita */
  '.topo .esq{flex:0 0 auto}',
  '.topo .meio{flex:1 1 auto;text-align:left;padding-left:2px}',
  '.topo .dir{flex:0 0 auto;gap:8px}',
  '.topo .logo{height:26px;width:auto;flex:none;display:block}',
  '.topo b{font-size:17px;font-weight:650;letter-spacing:-.01em;color:var(--texto)}',
  '.topo .dim{font-size:12.5px;color:var(--texto-3)}',
  /* so o icone: quadrado, e o nome vem do aria-label */
  '#btn_tema{background:var(--superficie-2);color:var(--texto);',
  'border:1px solid var(--borda);border-radius:var(--r-p);padding:7px;height:auto;',
  'display:inline-flex;align-items:center}',
  '#btn_tema svg{width:16px;height:16px;display:block;stroke:currentColor;',
  'fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}',
  '#btn_tema:hover{background:var(--superficie-2);color:var(--texto);',
  'border-color:var(--borda-forte)}',
  /* logo e titulo colados; a acao encosta na direita */
  '.topo .esq{display:flex;align-items:center;gap:12px;min-width:0}',
  '.topo .dir{margin-left:auto;display:flex;align-items:center;gap:8px}',

  /* ── GAVETA DE FILTROS ─────────────────────────────────────────────
     Aba fixa na lateral esquerda, painel que desliza por cima. A aba fica
     no meio da altura, que e onde a mao ja esta; no topo ela brigaria com
     o cabecalho fixo. */
  '.aba{position:fixed;left:0;top:50%;transform:translateY(-50%);z-index:41;',
  'display:flex;flex-direction:column;align-items:center;gap:6px;',
  'padding:14px 7px;border-radius:0 var(--r-m) var(--r-m) 0;',
  'border:var(--cartao-borda);border-left:0;background:var(--superficie);',
  'color:var(--texto);box-shadow:var(--sombra);cursor:pointer}',
  '.aba:hover{color:var(--acento);border-color:var(--borda-forte)}',
  '.aba svg{width:17px;height:17px;stroke:currentColor;fill:none;stroke-width:1.9;',
  'stroke-linecap:round}',
  '.aba span{writing-mode:vertical-rl;font-size:11.5px;font-weight:600;',
  'letter-spacing:.06em;text-transform:uppercase}',
  '.gaveta{position:fixed;left:0;top:0;bottom:0;z-index:42;width:min(430px,92vw);',
  'overflow:auto;padding:14px;transform:translateX(-102%);',
  'transition:transform .18s ease;background:var(--fundo)}',
  '.gaveta.aberta{transform:none}',
  '.gaveta .card{margin-bottom:0}',
  '.gaveta .filtros{grid-template-columns:1fr}',
  '.veu{position:fixed;inset:0;z-index:41;background:rgba(4,6,12,.45)}',
  '.fechar{margin-left:auto;background:none;border:0;padding:0 4px;',
  'font-size:20px;line-height:1;color:var(--texto-3);cursor:pointer}',
  '.fechar:hover{color:var(--texto)}',
  /* a pagina abre espaco pra aba nao cobrir conteudo */
  '.pg{padding-left:52px}',
  '@media(max-width:620px){.pg{padding-left:20px}',
  '.topo{padding-left:20px}',
  '.aba{top:auto;bottom:16px;transform:none;flex-direction:row;',
  'border-radius:0 var(--r-m) var(--r-m) 0}',
  '.aba span{writing-mode:horizontal-tb}}',
  '@media (prefers-reduced-motion:reduce){.gaveta{transition:none}}',

  /* 3. pagina, cartao e titulo de secao */
  '.pg{max-width:1680px;margin:0 auto;padding:16px 20px 48px}',
  '.tit{display:flex;align-items:center;justify-content:space-between;',
  'margin-bottom:16px;flex-wrap:wrap;gap:8px}',
  '.tit h1{margin:0;font-size:15px;font-weight:650;text-transform:uppercase;',
  'letter-spacing:.5px;border-left:3px solid var(--acento);padding-left:10px;color:var(--texto)}',
  '.tit .via{font-size:12px;color:var(--texto-3)}',
  '.card{position:relative;overflow:hidden;background:var(--cartao-fundo);',
  'border:var(--cartao-borda);border-radius:var(--r-g);box-shadow:var(--sombra);',
  'margin-bottom:16px;',
  'backdrop-filter:var(--cartao-blur);-webkit-backdrop-filter:var(--cartao-blur)}',
  /* a luz azul no canto superior esquerdo. `--brilho` e `none` no tema claro
     e um degrade radial no escuro — e ela que da profundidade ao vidro. O
     `> *` sobe o conteudo acima da luz, senao o texto fica por baixo. */
  '.card::before,.kpi::before{content:"";position:absolute;inset:0;',
  'background:var(--brilho);pointer-events:none}',
  '.card>*,.kpi>*{position:relative}',
  /* chip + titulo a esquerda, contagem empurrada pra direita. Era
     `space-between`, que separava o chip do proprio titulo. */
  '.card-h{padding:14px 18px;border-bottom:1px solid var(--borda);',
  'font-size:14.5px;font-weight:650;text-transform:none;letter-spacing:-.01em;',
  'color:var(--texto);display:flex;align-items:center;gap:10px}',
  '.card-h .chip{flex:none}',
  '.card-h .n{margin-left:auto;font-weight:500;color:var(--texto-3);',
  'font-size:12px;letter-spacing:0}',
  '.card-b{padding:18px}',

  /* 4. KPI — cartoes soltos, e MENORES.
        Decisao de 18/09: o numero grande chama o olho primeiro e e o dado
        menos interessante da pagina. Quem explica e a tabela. */
  '.kpis{display:grid;gap:14px;grid-template-columns:repeat(5,1fr);',
  'background:none;border:0;border-radius:0;margin-bottom:16px}',
  '@media(max-width:1250px){.kpis{grid-template-columns:repeat(3,1fr)}}',
  '@media(max-width:700px){.kpis{grid-template-columns:repeat(2,1fr)}}',
  '.kpi{position:relative;overflow:hidden;display:flex;align-items:center;',
  'gap:10px;min-width:0;',
  'background:var(--cartao-fundo);border:var(--cartao-borda);',
  'border-radius:var(--r-g);box-shadow:var(--sombra);padding:13px 14px;',
  'backdrop-filter:var(--cartao-blur);-webkit-backdrop-filter:var(--cartao-blur)}',
  '.kpi .ring{width:30px;height:30px;flex:0 0 30px;border:0;border-radius:50%;',
  'background:var(--acento-veu);display:flex;align-items:center;justify-content:center}',
  '.ic{width:16px;height:16px}',
  '.kpi .tx{min-width:0}',
  '.kpi .lb{font-size:11.5px;font-weight:500;color:var(--texto-2);',
  'text-transform:none;letter-spacing:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
  '.kpi .vl{font-size:22px;font-weight:700;letter-spacing:-.015em;color:var(--texto);',
  'line-height:1.15;white-space:nowrap}',

  /* 5. controles */
  /* Era `flex-wrap` com largura intrinseca: cada select nascia do tamanho do
     texto mais longo da lista, entao "Evento" ficava gigante, "UF" minusculo,
     e a linha quebrava em lugar diferente a cada coleta. Grade de colunas
     iguais resolve — o alinhamento deixa de depender do conteudo. */
  '.filtros{display:grid;gap:12px 14px;align-items:end;',
  'grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}',
  '.fg{display:flex;flex-direction:column;gap:4px;min-width:0}',
  '.fg select,.fg input,.fg button{width:100%}',
  '.fg label{font-size:11px;font-weight:600;color:var(--texto-3);',
  'text-transform:none;letter-spacing:0}',
  'select,input,button{background:var(--superficie-2);color:var(--texto);',
  'border:1px solid var(--borda);border-radius:var(--r-p);padding:7px 11px;',
  'font:inherit;font-size:13px;height:auto}',
  'button{cursor:pointer}',
  'button:hover{border-color:var(--borda-forte);color:var(--texto)}',
  'select:focus,input:focus,button:focus-visible{outline:2px solid var(--acento);',
  'outline-offset:1px;border-color:var(--borda-forte)}',
  /* ── seleção de veículos e texto pro lojista ─────────────────────── */
  '.barra-corte{display:flex;align-items:center;gap:12px;flex-wrap:wrap;',
  'padding-bottom:0}',
  '.barra-corte label{font-size:11px;font-weight:600;color:var(--texto-3)}',
  '.barra-corte input[type=range]{flex:1 1 200px;max-width:340px;accent-color:var(--acento-cheio);',
  'padding:0;border:0;background:none;height:auto}',
  '.barra-corte output{font-size:14px;font-weight:700;color:var(--texto);',
  'min-width:46px;font-variant-numeric:tabular-nums}',
  '#btn_msg{margin-left:auto}',
  'th.sel,td.sel{width:34px;text-align:center;padding-left:12px;padding-right:0}',
  'td.sel input,th.sel input{width:15px;height:15px;accent-color:var(--acento-cheio);',
  'cursor:pointer;padding:0;border:0;background:none;height:auto}',
  '#saida_msg textarea{width:100%;margin-top:6px;font-family:ui-monospace,SFMono-Regular,',
  'Consolas,monospace;font-size:12px;line-height:1.5;resize:vertical;',
  'background:var(--superficie-2);color:var(--texto);border:1px solid var(--borda);',
  'border-radius:var(--r-p);padding:10px}',
  '.msg_acoes{display:flex;align-items:center;gap:10px;margin-top:8px}',
  '.nota{margin-top:12px;padding-top:12px;border-top:1px solid var(--borda);',
  'font-size:12px;color:var(--texto-2);line-height:1.6}',

  /* 6. tabela.
        O alinhamento NAO segue o modelo, de proposito: o modelo centraliza
        porque tem 6 colunas curtas; aqui sao nove, quase todas numero. Numero
        se compara pela direita. O `thead th` do tema tem especificidade 2, e
        por isso a regra daqui precisa dela tambem — com `th` puro o tema
        vencia e a tabela inteira ia pro centro. */
  'table{border-collapse:collapse;width:100%;font-size:12.5px}',
  'thead th,tbody td{padding:9px 10px;border-bottom:1px solid var(--borda);',
  'text-align:right;white-space:nowrap}',
  /* o tema alinha a primeira coluna a esquerda; aqui a primeira e Aderencia,
     que e numero */
  'thead th:first-child,tbody td:first-child{text-align:right}',
  'thead th.tx,tbody td.tx{text-align:left}',
  'thead th{background:var(--superficie-2);position:sticky;top:0;z-index:1;',
  'font-weight:600;color:var(--texto-2);font-size:11.5px;',
  'text-transform:none;letter-spacing:0}',
  'tbody tr{cursor:pointer}',
  'tbody tr:hover td{background:var(--acento-veu)}',
  'tr.sel td,tr.sel+tr.dado td{background:var(--acento-veu)}',
  'tr.ctxr td{border-bottom:0;padding:9px 10px 1px;font-size:11.5px;color:var(--texto-3)}',
  'tr.ctxr:hover td,tr.ctxr:hover+tr.dado td{background:var(--acento-veu)}',
  'tr.dado td{padding-top:2px;padding-bottom:9px}',
  'tr.dado{border-bottom:1px solid var(--borda)}',
  'tr.ctxr .uf{color:var(--texto);font-weight:600;letter-spacing:.3px}',
  '.wrap{overflow:auto;max-height:62vh}',
  '.vazio{padding:26px 18px;color:var(--texto-3);text-align:center}',
  'td.nm{max-width:250px;overflow:hidden;text-overflow:ellipsis}',

  /* 7. o resto dos componentes proprios */
  'a.lk{color:var(--acento);text-decoration:none;border-bottom:1px dotted currentColor}',
  'a.lk:hover{border-bottom-style:solid}',
  '.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start}',
  /* sem min-width:0 a tabela larga empurra a coluna vizinha e a PAGINA ganha
     rolagem horizontal; com ele quem rola e a tabela, dentro do cartao */
  '.grid>*{min-width:0}',
  '@media(max-width:1200px){.grid{grid-template-columns:1fr}}',
  '.xg{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:14px}',
  '.xk{flex:1 1 170px;background:var(--superficie-2);border:1px solid var(--borda);',
  'border-left:3px solid var(--acento);border-radius:var(--r-m);padding:9px 12px}',
  '.xk span{display:block;color:var(--texto-3);font-size:11px;',
  'text-transform:none;letter-spacing:0}',
  '.xk b{display:block;font-size:16px;font-weight:650;margin-top:2px}',
  '.xk i{display:block;color:var(--texto-3);font-size:11px;font-style:normal;margin-top:2px}',
  '.xk a{color:var(--acento)}',
  /* `.tag` ja vem do tema; aqui so a variante de aviso */
  '.tag.w{background:color-mix(in srgb,var(--atencao) 20%,transparent);color:var(--atencao)}',
  '.dim{color:var(--texto-3)}',
  '.mono{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:11.5px}',
  'code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px;',
  'background:var(--superficie-2);padding:1px 5px;border-radius:6px}',
  '.bar{display:inline-block;height:6px;background:var(--acento-cheio);',
  'border-radius:99px;vertical-align:middle}',
  '.aviso{border-color:var(--negativo)}',
  '.aviso .card-h{color:var(--negativo);border-bottom-color:var(--negativo)}',
  '.aviso ul{margin:0;padding-left:18px}',
  '.aviso li{margin-bottom:5px}',
  '.ctx{background:var(--acento-veu);border:1px solid var(--borda);',
  'border-radius:var(--r-m);padding:10px 14px;margin-bottom:16px;font-size:12.5px}',

  /* 8. glossario.
        O modelo manda que ele seja bloco proprio e nunca rodape de outro
        cartao. Aqui ele ja e uma TELA inteira, que separa mais ainda. */
  /* O glossario acompanha a largura da pagina (ele e o fim dela agora, nao
     uma tela a parte). Quem limita a linha e o TEXTO, nao o cartao — bloco
     estreito debaixo de um largo pareceria desalinhado. */
  /* ── GLOSSARIO ─────────────────────────────────────────────────────
     Um bloco so, fechado ate clicarem. O <details> E o cartao: o cabecalho
     inteiro e a area de clique. */
  '.gl{padding:0}',
  '.gl>summary{cursor:pointer;list-style:none;border-radius:var(--r-g)}',
  '.gl>summary::-webkit-details-marker{display:none}',
  '.gl>summary:focus-visible{outline:2px solid var(--acento);outline-offset:-2px}',
  '.gl[open]>summary{border-radius:var(--r-g) var(--r-g) 0 0}',
  '.gl .seta{color:var(--texto-3);font-size:12px;transition:transform .15s}',
  '.gl[open] .seta{transform:rotate(180deg)}',
  '.gl .n{margin-left:auto;margin-right:10px}',
  '.gl-sub{display:flex;align-items:center;gap:10px;margin:26px 0 10px;',
  'font-size:13.5px;font-weight:650;color:var(--texto)}',
  '.gl-sub:first-child{margin-top:0}',
  '.gl dd,.gl .sub{max-width:92ch}',
  '.gl h2{font-size:13px;margin:0 0 4px;color:var(--acento);',
  'text-transform:none;letter-spacing:0}',
  '.gl .sub{color:var(--texto-3);font-size:12.5px;margin:0 0 16px}',
  '.gl dl{margin:0}',
  '.gl dt{font-weight:650;margin-top:16px;font-size:13px;color:var(--texto)}',
  '.gl dt:first-child{margin-top:0}',
  '.gl dd{margin:3px 0 0;color:var(--texto-2);line-height:1.65}',
  '.gl dd+dd{margin-top:6px}',
  '.gl .ex{color:var(--texto-3);font-size:12.5px}',
  '.gl table{margin-top:8px;font-size:12.5px;border:1px solid var(--borda)}',
  '.gl td,.gl th{white-space:normal}',
  '.gl .st-in{color:var(--positivo);font-weight:600}',
  '.gl .st-out{color:var(--texto-3)}'
].join('');

const CSS = [TEMA, PONTE].join('');

/* Os dois logos, em data URI. Tambem injetados por `_aplica-modelo.js` a
   partir de design/marca/cars2you/ — o azul some no fundo escuro (1,65:1),
   entao o tema troca o arquivo junto com as cores. */
const LOGOS = {
/* LOGOS:INICIO */
  claro: 'data:image/png;base64,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',
  escuro: 'data:image/png;base64,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'
/* LOGOS:FIM */
};

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
  /* ---- o corte de aderencia agora e do usuario ----
     Era `const LIMIAR=70`, escolhido por mim. 70 nao tem nada de especial:
     numa loja com perfil apertado sobra carro demais, e numa loja de nicho
     nao sobra nenhum. Quem conhece a loja e quem deve decidir, entao virou
     barra deslizante. O padrao continua 70 pra ninguem ter que mexer. */
  'var LIMIAR=70;',
  /* Selecao de veiculos, por id — sobrevive a mover a barra e a trocar de
     filtro. Guardar por POSICAO na lista seria mais simples e estaria errado:
     a lista se reordena, e o usuario perderia a selecao sem entender por que. */
  'var escolhidos={};',
  'function idsEscolhidos(){return Object.keys(escolhidos).filter(function(k){return escolhidos[k];});}',
  'const MIN=(D.parametros&&D.parametros.corresp_min)||0;',
  'function cvDe(m,d){if(!m||d===null||d===undefined)return null;return d/m;}',
  `function leitura(cv){if(cv===null)return "<span class='dim'>sem desvio medido</span>";if(cv<0.25)return "faixa apertada: acertar este número vale muito";if(cv<0.6)return "faixa média";return "dispersão alta: este indicador quase não informa";}`,
  `const chipLista="<span class='chip' aria-hidden='true'><svg viewBox='0 0 24 24'><path d='M9 11l3 3 8-8'/><path d='M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11'/></svg></span>";`,
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
  /* `onclick=event.stopPropagation()` na celula da caixa: sem isso o clique
     sobe pra linha, que tem handler de selecao de veiculo, e marcar a caixa
     trocaria a tela inteira. */
  `const listaV=acima.length?("<div class='wrap' style='max-height:40vh'><table><thead><tr><th class='sel'><input type='checkbox' id='sel_todos' title='Selecionar todos os visíveis'></th><th>Aderência</th><th>Score</th><th class='tx'>Veículo</th><th class='tx'>Categoria</th><th>Ano</th><th>Km</th><th>Valor</th><th class='tx'>Evento</th><th class='tx'>Componentes</th></tr></thead><tbody>"+acima.map(function(x){const v=D.veiculos[x.o];return "<tr><td class='sel' onclick='event.stopPropagation()'><input type='checkbox' class='cx' data-vid='"+v.vehicle_id+"'"+(escolhidos[v.vehicle_id]?" checked":"")+"></td>"+celulas(x.s,l.confianca)+"<td class='tx'>"+esc((v.marca?v.marca+" ":"")+(v.modelo||"?"))+" <span class='dim mono'>#"+v.vehicle_id+"</span></td><td class='tx'>"+esc(v.categoria||"—")+"</td><td>"+(v.model_year||"—")+"</td><td>"+nf(v.km)+"</td><td>"+money(v.valor)+"</td><td class='tx'>"+esc(v.evento)+"</td><td class='tx'>"+det(x.d)+"</td></tr>";}).join("")+"</tbody></table></div>")`,
  `:(todos.length?("<div class='vazio'>Os "+todos.length+" veículo(s) acima de "+LIMIAR+"% desta loja estão fora do filtro atual.</div>"):("<div class='vazio'>Nenhum veículo passa de "+LIMIAR+"% de aderência para esta loja. O melhor é "+nf(l.melhor,1)+"%.</div>"));`,
  `$("#extrato").innerHTML="<div class='card'><div class='card-h'>Extrato da loja — "+esc(l.loja)+" <span class='n mono'>#"+l.loja_id+"</span></div><div class='card-b'>"+`,
  `"<div style='margin-bottom:12px'>"+esc(l.uf)+" &middot; "+esc(l.whitelabel)+" &middot; <b>"+nf(l.qt_veiculos)+"</b> veículos ofertados em <b>"+nf(l.qt_ofertas)+"</b> lances nos últimos 6 meses"+(l.amostra_baixa?" <span class='tag w'>amostra baixa</span>":"")+" &middot; fator de confiança <b>"+nf(l.confianca,2)+"</b> &middot; elegível para <b>"+nf(l.pares)+"</b> veículo(s)</div>"+`,
  /* ---- os cinco campos de 11/09 ---- */
  'perfilExtra(l)+',
  `"<table><thead><tr><th class='tx'>Indicador</th><th>Referência</th><th>Desvio</th><th>CV</th><th>Peso</th><th class='tx'>Leitura</th></tr></thead><tbody>"+linhas.join("")+"</tbody></table>"+`,
  `"<div class='dim' style='margin-top:10px;font-size:11.5px'>Estes números vêm do histórico de 6 meses da loja inteira e <b>não mudam</b> com o filtro. Ver o glossário para como o peso é formado.</div></div></div>"+`,
  `"<div class='card'><div class='card-h'>"+chipLista+"Veículos selecionáveis <span class='n'>"+acima.length+" de "+nf(l.pares)+" elegíveis"+(escondidos?", "+escondidos+" fora do filtro":"")+"</span></div>"+`,
  `"<div class='card-b barra-corte'><label for='lim'>Aderência mínima</label>"+`,
  `"<input type='range' id='lim' min='0' max='100' step='1' value='"+LIMIAR+"'>"+`,
  `"<output id='lim_v'>"+LIMIAR+"%</output>"+`,
  `"<button id='btn_msg' type='button'>Gerar texto para o lojista</button>"+`,
  `"<span class='dim' id='msg_n'></span></div>"+`,
  `listaV+"<div id='saida_msg'></div></div>";`,
  '$("#extrato").style.display="";',
  'ligaExtrato(l,acima);}',

  /* ══ controles do extrato ═══════════════════════════════════════════
     Ligados a cada render: o innerHTML do extrato e reescrito inteiro, e
     handler preso no no antigo morre com ele. */
  'function ligaExtrato(l,acima){',
  'const bar=$("#lim");if(!bar)return;',
  /* `oninput` e nao `onchange`: o numero tem que acompanhar o dedo. Redesenhar
     a lista a cada pixel e barato aqui (dezenas de linhas), e a selecao
     sobrevive porque mora em `escolhidos`, fora do HTML. */
  'bar.oninput=function(){LIMIAR=Number(bar.value);$("#lim_v").textContent=LIMIAR+"%";extrato();};',
  'const todosCx=$("#sel_todos");',
  'if(todosCx){todosCx.onclick=function(e){e.stopPropagation();',
  'const m=todosCx.checked;',
  'acima.forEach(function(x){escolhidos[D.veiculos[x.o].vehicle_id]=m;});',
  'extrato();};}',
  'Array.prototype.forEach.call(document.querySelectorAll("#extrato .cx"),function(cx){',
  'cx.onclick=function(e){e.stopPropagation();',
  'escolhidos[cx.getAttribute("data-vid")]=cx.checked;contaEscolhidos();};});',
  'contaEscolhidos();',
  '$("#btn_msg").onclick=function(){montaMensagem(l);};}',

  'function contaEscolhidos(){const n=idsEscolhidos().length;',
  'const el=$("#msg_n");if(el)el.textContent=n?(n+" selecionado(s)"):"nenhum selecionado";}',

  /* ══ o texto para o lojista ═════════════════════════════════════════
     Texto PURO, sem marcacao: o mesmo bloco precisa colar limpo no corpo de
     um e-mail e no WhatsApp. `*negrito*` ficaria certo num e errado no outro.
     Nada e enviado daqui — isto gera e copia; quem manda e a pessoa. */
  'function montaMensagem(l){',
  'const ids=idsEscolhidos();',
  'const box=$("#saida_msg");',
  `if(!ids.length){box.innerHTML="<div class='vazio'>Selecione ao menos um veículo na lista acima.</div>";return;}`,
  'const dentro={};ids.forEach(function(i){dentro[i]=1;});',
  'const vs=D.veiculos.filter(function(v){return dentro[v.vehicle_id];});',
  'const L=[];',
  'L.push("Olá, "+l.loja+"!");L.push("");',
  'L.push("Separamos "+vs.length+" veículo(s) que combinam com o perfil de compra da sua loja:");',
  'L.push("");',
  'vs.forEach(function(v,i){',
  'const cab=(i+1)+". "+((v.marca?v.marca+" ":"")+(v.modelo||"")).trim()+(v.model_year?" "+v.model_year:"");',
  'L.push(cab);',
  'const d=[];',
  'if(v.km||v.km===0)d.push(nf(v.km)+" km");',
  'if(v.valor)d.push(money(v.valor));',
  'if(v.categoria)d.push(v.categoria);',
  'if(d.length)L.push("   "+d.join(" | "));',
  'if(v.evento)L.push("   Evento: "+v.evento);',
  /* sem link e melhor do que link quebrado — mesma regra da tabela */
  'if(v.link)L.push("   "+v.link);',
  'L.push("");});',
  'L.push("Qualquer duvida, e so responder por aqui.");',
  /* `String.fromCharCode(10)` e nao "
": dentro desta string de JS o
     escape seria consumido AQUI e chegaria no cliente como quebra de linha
     de verdade no meio de um literal — foi o erro de sintaxe da primeira
     versao. Escapar em dobro resolveria e acrescentaria barra invertida,
     que e o que este arquivo nao pode ter. */
  'const NL=String.fromCharCode(10);',
  'const txt=L.join(NL);',
  `box.innerHTML="<div class='card-b'><label for='msg_txt' class='dim'>Texto pronto — confira antes de enviar</label>"+`,
  `"<textarea id='msg_txt' rows='12' spellcheck='false'></textarea>"+`,
  `"<div class='msg_acoes'><button id='btn_copiar' type='button'>Copiar</button>"+`,
  `"<span class='dim' id='copiado'></span></div></div>";`,
  'const ta=$("#msg_txt");ta.value=txt;',
  'const cp=$("#btn_copiar");',
  'cp.onclick=function(){',
  'ta.select();',
  'let ok=false;',
  /* `navigator.clipboard` so existe em contexto seguro (https ou localhost).
     Este relatorio abre de arquivo local e do SharePoint, entao o caminho
     antigo fica como alternativa em vez de o botao nao fazer nada. */
  'try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(ta.value);ok=true;}',
  'else{ok=document.execCommand("copy");}}catch(e){ok=false;}',
  '$("#copiado").textContent=ok?"copiado":"não consegui copiar — use Ctrl+C";};}',
  /* ---- avisos ---- */
  'const av=[];D.falhas.forEach(f=>av.push("<li>"+esc(f)+"</li>"));',
  `D.diagnostico.filter(d=>d.veredito!=="ok").forEach(p=>av.push("<li><code>"+p.queryName+"</code>: "+esc(p.veredito)+(p.erro?" — <span class='mono'>"+esc(p.erro)+"</span>":"")+"</li>"));`,
  `if(av.length){$("#alerta").innerHTML="<div class='card aviso'><div class='card-h'><span class='chip' aria-hidden='true'><svg viewBox='0 0 24 24'><path d='M12 9v4M12 17h.01'/><path d='M10.3 3.9L2 18a2 2 0 001.7 3h16.6a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z'/></svg></span>"+av.length+" ponto(s) de atenção</div><div class='card-b'><ul>"+av.join("")+"</ul></div></div>";}`,
  /* ---- o glossario ----
     Ate 18/09 ele era uma SEGUNDA TELA: clicar escondia o relatorio inteiro.
     Virou o fim da MESMA pagina, como manda o modelo do brain — glossario e
     referencia, e referencia que exige trocar de tela nao e consultada.
     O botao agora leva ate la; o endereco proprio continua existindo. */
  /* ---- gaveta de filtros ----
     Sem `document.body`: o DOM de mentira do smoke so tem querySelector, e
     amarrar o estado a uma classe no <body> tornaria o teste impossivel sem
     motivo. O estado mora na propria gaveta. */
  'function gaveta(abre){',
  '$("#gaveta").className=abre?"gaveta aberta":"gaveta";',
  '$("#veu_filtros").style.display=abre?"":"none";',
  '$("#btn_filtros").setAttribute("aria-expanded",abre?"true":"false");}',
  'function gavetaAberta(){return $("#gaveta").className.indexOf("aberta")>=0;}',
  '$("#btn_filtros").onclick=function(){gaveta(!gavetaAberta());};',
  '$("#fecha_filtros").onclick=function(){gaveta(false);};',
  '$("#veu_filtros").onclick=function(){gaveta(false);};',
  'gaveta(false);',

  /* ── TEMA ────────────────────────────────────────────────────────────
     O arquivo nasce no tema declarado no <html> e o botao troca ao vivo.
     A escolha NAO e gravada: o relatorio vai por link pra muita gente e
     precisa abrir igual pra todo mundo. Mesma regra do modelo do brain,
     em design/modelos/ — arquivo chamado claro que abre escuro e cilada.
     O logo troca junto, porque o azul da marca some no fundo escuro. */
  'const LOGOS=' + JSON.stringify(LOGOS) + ';',
  /* O icone mostra PARA ONDE o botao leva, nao onde voce esta: sol quando o
     tema atual e escuro. SVG e nao caractere — ☀ e ☾ viram emoji colorido em
     parte dos sistemas. Sem texto visivel, o nome vem do aria-label. */
  /* CRASE nestas linhas, nao aspa simples com escape: a aspa simples do
     atributo HTML entra literal dentro de template literal, sem nenhuma
     barra invertida. E a convencao deste arquivo (ver o comentario antes do
     APP) — a primeira versao deste trecho subiu a contagem de 4 para 9. */
  `var ICO_TEMA={claro:"<circle cx='12' cy='12' r='4'/><path d='M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4'/>",`,
  `escuro:"<path d='M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z'/>"};`,
  'function aplicaTema(t){document.documentElement.dataset.tema=t;',
  '$("#logo").src=LOGOS[t];',
  'var alvo=(t==="escuro"?"claro":"escuro");var b=$("#btn_tema");',
  `b.innerHTML="<svg viewBox='0 0 24 24' aria-hidden='true'>"+ICO_TEMA[alvo]+"</svg>";`,
  'b.setAttribute("aria-label","Mudar para o tema "+alvo);',
  'b.setAttribute("title","Tema "+alvo);}',
  'aplicaTema(document.documentElement.dataset.tema||"claro");',
  '$("#btn_tema").onclick=function(){',
  'aplicaTema(document.documentElement.dataset.tema==="escuro"?"claro":"escuro");};',
  /* quem abre o link com #pg_gloss encontra o glossario ja aberto */
  'if(location.hash==="#pg_gloss"||location.hash==="#glossario"){',
  'var gl=$("#pg_gloss");if(gl){gl.open=true;',
  'if(gl.scrollIntoView)gl.scrollIntoView({block:"start"});}}',
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

/* Cabecalho de cartao segue a anatomia do modelo do brain: chip redondo com
   icone no canto superior esquerdo, titulo ao lado, contagem empurrada pra
   direita. No tema escuro o cartao ainda ganha o brilho azul no mesmo canto
   (`--brilho`), que e o que da profundidade ao vidro. */
function chip(d) {
  return '<span class="chip" aria-hidden="true"><svg viewBox="0 0 24 24">' + d + '</svg></span>';
}
const ICO_CARD = {
  filtros: '<path d="M3 5h18M6 12h12M10 19h4"/>',
  veiculos: '<path d="M3 17v-4l2-5h12l3 5v4"/><path d="M5 17h14"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  lojas: '<path d="M3 21V10l9-7 9 7v11"/><path d="M9 21v-6h6v6"/>',
  base: '<path d="M4 19V5a2 2 0 012-2h13v18H6a2 2 0 01-2-2z"/><path d="M4 19a2 2 0 012-2h13"/>',
  regras: '<path d="M9 11l3 3 8-8"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>',
  calculo: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 12h3M8 16h3M14 12v5"/>',
};

const html = [
  '<!doctype html><html lang="pt-BR" data-tema="claro"><head><meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width,initial-scale=1">',
  '<title>Radar de Estoque — Cars2You</title>',
  '<style>' + CSS + '</style></head><body>',
  /* O topo carrega SO identidade e a troca de tema, como no modelo: logo,
     titulo colado nela, e a acao encostada na direita. Saíram daqui o botao
     do glossario (ele agora e um bloco que abre no proprio lugar) e o
     "Gerado em" (foi pro rodape, junto da descricao da base). */
  '<div class="topo"><span class="esq">' +
  /* src vazio de proposito: quem preenche e o APP, porque o arquivo
     muda com o tema. Ver `aplicaTema` no fim do APP. */
  '<img class="logo" id="logo" alt="Cars2You" src="">' +
  '<b>Radar de Estoque</b>' +
  '</span>',
  '<span class="dir"><button id="btn_tema" type="button" aria-label="Mudar o tema"></button></span></div>',
  /* ═══ TELA 1: o relatorio ═══ */
  '<div class="pg" id="pg_rel">',
  /* ═══ FILTROS SUSPENSOS ═══
     Eles ocupavam a primeira dobra inteira e sao consultados poucas vezes por
     sessao: quem abre o relatorio quer ver o dado. Viraram gaveta, com aba
     fixa na lateral esquerda. Fecha clicando fora, no X, ou no Esc. */
  '<button id="btn_filtros" class="aba" type="button" aria-expanded="false" aria-controls="gaveta">' +
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18M6 12h12M10 19h4"/></svg>' +
  '<span>Filtros</span></button>',
  '<div id="veu_filtros" class="veu" style="display:none"></div>',
  '<aside id="gaveta" class="gaveta">',
  '<div class="card"><div class="card-h">' + chip(ICO_CARD.filtros) + 'Filtros' +
  '<button id="fecha_filtros" class="fechar" type="button" aria-label="Fechar filtros">&times;</button>' +
  '</div><div class="card-b">',
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
  ' Os termos estão no <b>glossário</b>, no fim da página.</div>',
  '</div></div>',
  '</aside>',
  '<div class="kpis" id="kpis"></div>',
  '<div id="alerta"></div>',
  '<div id="ctx" class="ctx" style="display:none"></div>',
  '<div class="grid">',
  '<div class="card"><div class="card-h">' + chip(ICO_CARD.veiculos) + 'Veículos <span class="n" id="cv"></span></div>',
  '<div class="wrap"><table id="t_v"></table></div><div id="v_vazio"></div></div>',
  '<div class="card"><div class="card-h">' + chip(ICO_CARD.lojas) + 'Lojas <span class="n" id="cl"></span></div>',
  '<div class="wrap"><table id="t_l"></table></div><div id="l_vazio"></div></div>',
  '</div>',
  '<div id="extrato" style="display:none"></div>',
  '</div>',
  /* ═══ GLOSSARIO — ultimo bloco, e FECHADO ate clicarem ═══
     Regra do modelo (design/regras-de-layout.md): peca obrigatoria, bloco
     proprio, fim da pagina. Fechado porque e referencia: quem precisa, abre.
     Era uma segunda tela ate 18/09, e tela que esconde o relatorio inteiro
     nao e consultada. */
  '<div class="pg">',
  '<details class="card gl" id="pg_gloss">',
  '<summary class="card-h">' + chip(ICO_CARD.base) + 'Glossário' +
  '<span class="n">o que entra na base, as regras, e como o número é feito</span>' +
  '<span class="seta" aria-hidden="true">&#9662;</span></summary>',
  '<div class="card-b">',

  '<h3 class="gl-sub">' + chip(ICO_CARD.base) + 'O que entra na base</h3><dl>',
  '<dt>Uma linha por veículo</dt>',
  '<dd>Não uma linha por negociação. O mesmo carro aparece em vários eventos &mdash; os feirões são diários e reciclam estoque &mdash; e contar por negociação o duplicava.</dd>',
  '<dt>Última negociação</dt>',
  '<dd>De cada veículo, vale o status da <b>última</b> negociação dentro da janela de eventos escolhida. A ordem importa e é fácil de inverter sem perceber: primeiro se acha a última negociação, <b>depois</b> se olha o status dela. O contrário faria um carro vendido hoje reaparecer como disponível pela negociação de ontem, que ficou em "Sem Ofertas".</dd>',
  '<dt>Status da negociação</dt>',
  '<dd>Cinco dos doze estados entram. Ficam de fora os que têm <b>oferta viva na mesa</b> (9 e 13) &mdash; ranquear loja para um carro em negociação atrapalha o negócio em andamento &mdash; além da venda e do que foi suspenso ou cancelado.</dd>',
  '<dd><table><thead><tr><th>Cód.</th><th class="tx">Significado</th><th class="tx">No relatório</th></tr></thead><tbody>' + LINHAS_ST + '</tbody></table></dd>',
  '<dt>Sobra</dt>',
  '<dd>Veículo cuja última negociação NÃO está em "Ativo": passou pelo evento e não foi vendido. Vem marcado com o nome do status na tabela. <b>Desde 18/09 a sobra aparece pouco aqui</b>: a janela passou a olhar os 7 dias à frente, então quase tudo na base ainda está em evento por encerrar.</dd>',
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
  '<dd>Nesta coleta: ' + descreveRecorte() + '. Datas em <b>hora de Brasília</b> &mdash; o banco responde em UTC, então o recorte é calculado fora do SQL e vai como literal.</dd>',
  /* o piso na meia-noite nao e detalhe: sem ele o mesmo relatorio encolhe
     conforme a hora em que roda, e ninguem entende por que */
  '<dd class="ex">⚠️ <b>Mudou em 18/09/2026.</b> Antes a janela era aberta para trás (tudo que encerrou desde 09/09, mais o que não encerrou) e o relatório mostrava sobretudo a <b>sobra</b>. Agora ele olha para a frente: <b>os eventos que encerram nos próximos 7 dias</b>. Comparar a contagem com um relatório anterior a essa data não faz sentido &mdash; é outra pergunta, não a mesma base menor. O piso é a <b>meia-noite de hoje</b>, não o instante da coleta: evento que encerrou mais cedo no mesmo dia continua aqui até o dia virar.</dd>',
  '<dd>Quando não há teto, tudo o que ainda não encerrou entra, inclusive evento de fim distante. O filtro de <b>evento</b> acima é a forma de isolar uma edição. O recorte também pode ser uma lista fixa de ids, modo usado para reanalisar edições específicas.</dd>',
  '</dl>',

  '<h3 class="gl-sub">' + chip(ICO_CARD.regras) + 'Regras de elegibilidade</h3><dl>',
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
  (MIN_TX
    ? '<dd>Par com score abaixo de <b>' + MIN_TX + '%</b> não existe em lugar nenhum do relatório: não entra nas tabelas, não conta nos KPIs, não aparece em nenhuma das duas direções. O KPI <b>Sem correspondência</b> conta só quem <b>podia</b> ter par: tinha loja elegível e nenhuma alcançou o piso. São esses, e só esses, que mudariam se o corte baixasse.</dd>'
    : '<dd><b>Não há piso nesta coleta</b> (mudou em 18/09/2026): todo par elegível entra, inclusive score baixo. Quem filtra é você, na <b>barra deslizante</b> do extrato da loja, que nasce em 70%. O que ainda corta é o <b>teto de lojas por veículo</b> — ele guarda as melhores de cada carro, não as melhores no geral. Por isso o KPI <b>Sem correspondência</b> tende a zero: sobra só quem não tem contraparte possível.</dd>'),
  '</dl>',

  '<h3 class="gl-sub">' + chip(ICO_CARD.calculo) + 'Como o número é feito</h3><dl>',
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
  '</dl>',
  '</div></details></div>',

  /* ═══ RODAPE ═══
     Fica so o que o modelo pede: quando foi atualizado, e qual base esta na
     tela. Os dois moraram no topo ate 18/09 — data de geracao competindo com
     o titulo, e o recorte como subtitulo de uma secao que nem existe mais. */
  '<div class="pg"><p class="rodape">',
  'Atualizado em <span id="ger"></span>',
  /* O topo passou a levar so o nome do projeto. O que ele dizia antes
     — "veículos em evento × lojas compradoras" — descreve a BASE, entao
     e aqui que ele pertence, junto do recorte. */
  ' &middot; veículos em evento &times; lojas compradoras',
  ' &middot; ' + descreveRecorte() + ' &middot; perfil de compra desde ' + (META.data_ini || '?'),
  '</p></div>',
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