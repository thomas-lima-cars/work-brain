/* ══════════════════════════════════════════════════════════════════════
   NÓ "Montar Consultas" — Painel de Eventos Cars2You

   Monta as consultas do painel. Cada uma devolve UMA linha só:

       SELECT COUNT(*) AS total, JSON_ARRAYAGG(JSON_ARRAY(...)) AS linhas

   O padrão é o do Painel de Eventos C6 (painel-eventos-c6/montar-consultas.js):
   a tabela inteira viaja num JSON, o teto de 50 linhas do MCP não corta
   nada, e o "total" sai da MESMA varredura — se o pacote chegar menor, o
   Montar Painel derruba o run em vez de publicar meia tabela.

   ─── O RECORTE (Thomas, 2026-10-28) ──────────────────────────────────
   Eventos que alvejam algum dos seis canais principais (4 Trucks2you,
   7 Marketplace, 43 C6 Auto, 48 Colaboradores C6, 62 Lance Fácil BTB,
   65 BTB Associados), que JÁ ABRIRAM as ofertas e que encerram a partir
   de 30 dias atrás: os encerrados dos últimos 30 dias e os ativos. O
   agendado (ofertas ainda fechadas) fica de fora.

   ─── POR QUE TANTAS PARTES ───────────────────────────────────────────
   Medido em 28/10: 286 eventos, ~28 mil negociações de ~4,9 mil veículos.
   A LM Transportes recria o anúncio a cada feirão (23.495 negociações de
   2.781 veículos), então a negociação é o grão que pesa. Cada pacote
   precisa ficar abaixo dos ~130 KB que o MCP já provou passar: as
   tabelas grandes saem em PARTES pelo resto do id, e o Montar Painel junta
   quantas vierem — parte que faltar derruba o run.

   ─── OS DIAS ─────────────────────────────────────────────────────────
   Todo acesso, oferta e login viaja como MÁSCARA de dias: bit k = k dias
   depois do piso. São 31 dias (do piso a hoje), bits 0 a 30 — cabe no
   inteiro de 32 bits do JavaScript sem tocar no bit de sinal. Subir DIAS
   acima de 30 quebra a conta: a guarda abaixo recusa.

   ─── FUSO ────────────────────────────────────────────────────────────
   O banco responde NOW() em UTC e grava evento, oferta e acesso em hora de
   Brasília (dominios.md). O piso e o "agora" são calculados aqui, em hora
   de Brasília, e viajam como literal. Não trocar por NOW()/CURDATE().

   ⚠️ Este arquivo viaja pro n8n como string. Sem barra invertida e sem
   regex, de propósito — ver automations/n8n-sdk/README.md.
   ══════════════════════════════════════════════════════════════════════ */

const WLS = [4, 7, 43, 48, 62, 65];
const DIAS = 30;
const STATUS_VENDA = [2, 3, 7];
const FUSO_MIN = -180;          /* America/Sao_Paulo, sem horário de verão */
const DB = 'cars2you_production';
if (DIAS > 30) throw new Error('DIAS acima de 30 estoura a mascara de dias (bit 31 e o sinal)');

const pad = (n) => String(n).padStart(2, '0');
const dataDe = (d) => d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
const agora = new Date(Date.now() + FUSO_MIN * 60000);
const AGORA_BR = dataDe(agora) + ' ' + pad(agora.getUTCHours()) + ':' + pad(agora.getUTCMinutes());
const PISO_DIA = dataDe(new Date(agora.getTime() - DIAS * 86400000));
const PISO = PISO_DIA + ' 00:00:00';
const LISTA_WL = WLS.join(',');

/* o recorte de evento, escrito uma vez só e reusado em todas as consultas */
const EVENTO =
  " e.deleted_at IS NULL AND e.finish_date_event >= '" + PISO + "'" +
  " AND e.start_date_offer <= '" + AGORA_BR + "'" +
  " AND EXISTS (SELECT 1 FROM event_whitelabels ew" +
  " WHERE ew.event_id = e.id AND ew.whitelabel_id IN (" + LISTA_WL + "))";

/* as negociações do recorte — base de quase todas as consultas */
const NEGS =
  " FROM advertisement_negotiations an" +
  " INNER JOIN events e ON e.id = an.event_id AND" + EVENTO +
  " INNER JOIN advertisements a ON a.id = an.advertisement_id" +
  " WHERE an.deleted_at IS NULL";

/* a categoria do veículo (Thomas, 06/11: as metas são por comitente e
   categoria). Medido em 06/11 em categories + category_groups: P = Pesados
   (o grupo 2 e o "Caminhao" 23, que caiu no grupo 1), L = Leves (o grupo
   10, motos inclusive: "agrupe motos em leves", 06/11), E = Equipamentos
   (grupo 8), N = Não informada (o resto e o sem categoria). O MESMO CASE
   está no gera_metas.py, que faz a planilha das metas */
const CATEGORIA = (v, c) => "CASE" +
  " WHEN " + c + ".category_group_id = 2 OR " + v + ".category_id = 23 THEN 'P'" +
  " WHEN " + c + ".category_group_id = 10 THEN 'L' WHEN " + c + ".category_group_id = 8 THEN 'E' ELSE 'N' END";

/* o dia de uma data, contado a partir do piso, e a máscara de um dia */
const DIA = (col) => "DATEDIFF(" + col + ", '" + PISO_DIA + "')";
const BIT = (col) => "IF(" + col + " >= '" + PISO + "', 1 << " + DIA(col) + ", 0)";
const DATA = (col) => "DATE_FORMAT(" + col + ", '%Y-%m-%d %H:%i')";

/* ── as tabelas ──────────────────────────────────────────────────────
   "cols" é a fonte única da ordem: dela saem o JSON_ARRAY daqui e o
   decodificador do Montar Painel. "partes" > 1 corta a tabela pelo resto
   do id em "parte" — "PARTE" no texto é trocado pelo filtro de cada uma. */
const TABELAS = [
  {
    nome: 'canais',
    de: " FROM whitelabels w WHERE w.id IN (" + LISTA_WL + ")",
    cols: [['id', 'w.id'], ['nome', 'w.name']]
  },
  {
    nome: 'eventos',
    de: " FROM events e WHERE" + EVENTO,
    cols: [
      ['id', 'e.id'],
      ['nome', 'e.name'],
      ['status', 'e.status'],
      ['ini', DATA('e.start_date_offer')],
      ['fim', DATA('e.finish_date_event')],
      /* só os seis canais do painel: o filtro de whitelabel não conhece outros */
      ['wls', "(SELECT GROUP_CONCAT(ew2.whitelabel_id ORDER BY ew2.whitelabel_id)" +
              " FROM event_whitelabels ew2 WHERE ew2.event_id = e.id AND ew2.whitelabel_id IN (" + LISTA_WL + "))"]
    ]
  },
  {
    /* uma linha por NEGOCIAÇÃO: o mesmo carro em dois eventos aparece duas
       vezes, uma em cada. O painel conta veículo distinto por dia. */
    nome: 'negs',
    partes: 14,
    de: NEGS + " AND PARTE",
    parte: 'an.id',
    cols: [
      ['neg', 'an.id'],
      ['ev', 'an.event_id'],
      ['veic', 'a.vehicle_id'],
      /* comitente: a loja que anuncia (dominios.md, event_shops) */
      ['comit', 'a.shop_id'],
      ['status', 'an.status'],
      ['vmv', 'NULLIF(an.min_sale_price, 0)'],
      /* FIPE do ANÚNCIO, a mais preenchida (precificacao/definicoes.md) */
      ['fipe', 'NULLIF(a.fipe_price, 0)']
    ]
  },
  {
    /* uma linha por VEÍCULO distinto do recorte. "estreia" é o início de
       ofertas do PRIMEIRO evento da vida do veículo, em qualquer canal: o
       veículo novo do dia é o que estreou naquele dia (Thomas, 28/10:
       "cadastrados no dia" — ver o README sobre por que não é
       vehicles.created_at). "uuid" é o do anúncio mais recente, para o link. */
    nome: 'veiculos',
    partes: 7,
    de: " FROM (SELECT DISTINCT a.vehicle_id AS vid" + NEGS + ") x" +
        " INNER JOIN vehicles v ON v.id = x.vid" +
        /* LEFT nos catálogos: INNER descarta veículo sem avisar */
        " LEFT JOIN brands b ON b.id = v.brand_id" +
        " LEFT JOIN models m ON m.id = v.model_id" +
        " LEFT JOIN versions ver ON ver.id = v.version_id" +
        " LEFT JOIN categories cg ON cg.id = v.category_id" +
        " WHERE PARTE",
    parte: 'x.vid',
    cols: [
      ['veic', 'v.id'],
      ['marca', 'b.name'],
      ['modelo', 'm.name'],
      ['versao', 'ver.name'],
      ['ano', 'v.model_year'],
      ['km', 'NULLIF(v.km, 0)'],
      ['cadastro', DATA('v.created_at')],
      ['estreia', DATA("(SELECT MIN(e2.start_date_offer) FROM advertisements a2" +
        " INNER JOIN advertisement_negotiations an2 ON an2.advertisement_id = a2.id AND an2.deleted_at IS NULL" +
        " INNER JOIN events e2 ON e2.id = an2.event_id AND e2.deleted_at IS NULL" +
        " WHERE a2.vehicle_id = v.id)")],
      ['uuid', "(SELECT a3.uuid FROM advertisements a3 WHERE a3.vehicle_id = v.id ORDER BY a3.id DESC LIMIT 1)"],
      ['cat', CATEGORIA('v', 'cg')]
    ]
  },
  {
    /* a venda: a oferta vencedora das negociações em 2, 3 ou 7 */
    nome: 'vendas',
    de: " FROM advertisement_negotiations an" +
        " INNER JOIN events e ON e.id = an.event_id AND" + EVENTO +
        " INNER JOIN offers o ON o.id = an.offer_actual_id" +
        " WHERE an.deleted_at IS NULL AND an.status IN (" + STATUS_VENDA.join(',') + ")",
    cols: [
      ['neg', 'an.id'],
      ['loja', 'o.buyer_shop_id'],
      ['valor', 'o.price'],
      ['quando', DATA('o.created_at')]
    ]
  },
  {
    /* lances por (negociação, loja), com a máscara dos dias em que a loja
       deu lance. Lance de antes do piso (evento que abriu antes) entra na
       contagem e no maior valor, não na máscara. */
    nome: 'ofertas',
    partes: 3,
    de: " FROM (SELECT o.advs_negotiation_id AS neg, o.buyer_shop_id AS loja, COUNT(*) AS n," +
        " MAX(o.price) AS maior, BIT_OR(" + BIT('o.created_at') + ") AS dias" +
        " FROM offers o INNER JOIN advertisement_negotiations an ON an.id = o.advs_negotiation_id AND an.deleted_at IS NULL" +
        " INNER JOIN events e ON e.id = an.event_id AND" + EVENTO +
        " WHERE o.deleted_at IS NULL AND o.buyer_shop_id IS NOT NULL AND PARTE" +
        " GROUP BY o.advs_negotiation_id, o.buyer_shop_id) x",
    parte: 'o.advs_negotiation_id',
    cols: [['neg', 'x.neg'], ['loja', 'x.loja'], ['n', 'x.n'], ['maior', 'x.maior'], ['dias', 'x.dias']]
  },
  {
    /* quem abriu cada anúncio, por negociação, com a máscara dos dias.
       access_logs traz o anúncio e o evento (0 acesso a anúncio sem evento,
       dominios.md); o join é por igualdade nos dois, que é o índice. Uma
       linha por (negociação, loja): o painel conta lojas, não cliques. */
    nome: 'acessos',
    partes: 12,
    de: " FROM (SELECT an.id AS neg, al.shop_id AS loja, BIT_OR(" + BIT('al.created_at') + ") AS dias" +
        " FROM events e INNER JOIN advertisement_negotiations an ON an.event_id = e.id AND an.deleted_at IS NULL" +
        " INNER JOIN access_logs al ON al.advertisement_id = an.advertisement_id AND al.event_id = e.id" +
        " AND al.shop_id IS NOT NULL AND al.created_at >= '" + PISO + "'" +
        " WHERE" + EVENTO + " AND PARTE GROUP BY an.id, al.shop_id) x",
    parte: 'an.id',
    cols: [['neg', 'x.neg'], ['loja', 'x.loja'], ['dias', 'x.dias']]
  },
  {
    /* "logou" = qualquer linha de access_logs da loja no canal (dominios.md,
       access_logs.route). Uma linha por (loja, canal) com a máscara dos dias */
    nome: 'logins',
    de: " FROM (SELECT al.shop_id AS loja, al.whitelabel_id AS wl, BIT_OR(" + BIT('al.created_at') + ") AS dias" +
        " FROM access_logs al WHERE al.whitelabel_id IN (" + LISTA_WL + ")" +
        " AND al.created_at >= '" + PISO + "' AND al.shop_id IS NOT NULL" +
        " GROUP BY al.shop_id, al.whitelabel_id) x",
    cols: [['loja', 'x.loja'], ['wl', 'x.wl'], ['dias', 'x.dias']]
  },
  {
    /* as lojas que o painel cita: quem logou nos canais, quem abriu anúncio
       e quem deu lance no recorte. O CNPJ é a chave da carteira comercial e
       NÃO chega ao HTML — o Montar Painel troca pelo responsável. */
    nome: 'lojas',
    partes: 2,
    de: " FROM (SELECT al.shop_id AS id FROM access_logs al WHERE al.whitelabel_id IN (" + LISTA_WL + ")" +
        " AND al.created_at >= '" + PISO + "' AND al.shop_id IS NOT NULL" +
        " UNION SELECT al2.shop_id AS id FROM events e INNER JOIN access_logs al2 ON al2.event_id = e.id" +
        " AND al2.shop_id IS NOT NULL AND al2.created_at >= '" + PISO + "' WHERE" + EVENTO +
        " UNION SELECT o.buyer_shop_id AS id FROM offers o INNER JOIN advertisement_negotiations an ON an.id = o.advs_negotiation_id" +
        " AND an.deleted_at IS NULL INNER JOIN events e ON e.id = an.event_id AND" + EVENTO +
        " WHERE o.deleted_at IS NULL AND o.buyer_shop_id IS NOT NULL) ids" +
        " INNER JOIN shops s ON s.id = ids.id WHERE PARTE",
    parte: 's.id',
    cols: [['id', 's.id'], ['nome', 's.name'], ['wl', 's.whitelabel_id'], ['cnpj', 's.cnpj']]
  },
  {
    /* os comitentes: as lojas que anunciam no recorte */
    nome: 'comitentes',
    de: " FROM shops s WHERE s.id IN (SELECT a.shop_id" + NEGS + ")",
    cols: [['id', 's.id'], ['nome', 's.name']]
  }
];

/* ══════════════════════════════════════════════════════════════════════
   A ABA MENSAL (Thomas, 06/11): os últimos 12 meses — o mês corrente, até
   agora, e os 11 anteriores. Não dá para levar o cru de um ano para a
   página (~340 mil negociações; a LM recria o anúncio a cada feirão),
   então o mês sai JÁ AGREGADO no banco, uma consulta por mês:

     mes_veic   por (comitente, máscara de canais, categoria): veículos ativos no mês,
                novos, com acesso / oferta / venda no mês (e dos novos), os
                cinco status e o valor vendido. Cada veículo cai num grupo só
                — o do comitente da negociação mais recente no mês, com a
                máscara de TODOS os canais em que esteve no mês —, então a
                soma dos grupos é a contagem distinta, com qualquer filtro
                de canal ou de comitente.
     mes_loj    lojas distintas que acessaram, ofertaram e compraram no mês,
                por (canal, comitente), (canal), (comitente) e o total, quatro
                GROUP BY unidos (o MCP recusa WITH ROLLUP). Loja distinta não soma entre grupos: cada recorte que
                a tela oferece vem contado pronto.

   Medido em 06/11 (conexão direta): ~2 s por mês em cada uma, 19 grupos
   de veículos e 27 linhas de lojistas em outubro.

   ⚠️ Evento com mais de 31 dias de ofertas fica fora do mensal: é depósito,
   não evento. "Anúncios cancelados" (id 266, aberto de 2021 a 16/12/2025,
   10.127 negociações) sozinho levava dezembro de 2,4 mil para 11,7 mil
   veículos; os "Em preparação LM" são do mesmo tipo.
   ══════════════════════════════════════════════════════════════════════ */
const MESES = 12;
const DIAS_MAX_EVENTO = 31;
const MES = [];
for (let k = MESES - 1; k >= 0; k--) {
  const a = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth() - k, 1));
  const b = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth() - k + 1, 1));
  MES.push({ rot: dataDe(a).slice(0, 7), ini: dataDe(a) + ' 00:00:00', fim: dataDe(b) + ' 00:00:00' });
}
const MES_PISO = MES[0].ini;
/* posição do canal na lista: bit 0 = 4, bit 1 = 7, ... (FIELD conta de 1) */
const BIT_WL = "(1 << (FIELD(ew.whitelabel_id, " + LISTA_WL + ") - 1))";
const EVENTO_MES = (m) =>
  " e.deleted_at IS NULL AND e.start_date_offer < '" + m.fim + "' AND e.finish_date_event >= '" + m.ini + "'" +
  " AND e.start_date_offer <= '" + AGORA_BR + "' AND DATEDIFF(e.finish_date_event, e.start_date_offer) <= " + DIAS_MAX_EVENTO;
/* o lance de loja (o mesmo filtro da tabela de ofertas do diário) */
const LANCE = "o.deleted_at IS NULL AND o.buyer_shop_id IS NOT NULL";
/* a negociação mais recente do veículo no mês (fim do evento, depois id):
   sem função de janela (o MCP rejeita), pelo MAX de uma chave que ordena */
const CHAVE = "CONCAT(DATE_FORMAT(n.fim, '%Y%m%d%H%i'), LPAD(n.nid, 10, '0'))";
const ULT = (col) => "SUBSTRING_INDEX(MAX(CONCAT(" + CHAVE + ", '|', IFNULL(" + col + ", ''))), '|', -1)";

const deMesVeic = (m) => {
  const evs = "SELECT e.id, e.finish_date_event AS fim, BIT_OR(" + BIT_WL + ") AS wm FROM events e" +
    " INNER JOIN event_whitelabels ew ON ew.event_id = e.id AND ew.whitelabel_id IN (" + LISTA_WL + ")" +
    " WHERE" + EVENTO_MES(m) + " GROUP BY e.id";
  const neg = "SELECT an.id AS nid, a.vehicle_id AS v, a.shop_id AS c, an.status AS st, NULLIF(an.min_sale_price, 0) AS vmv," +
    " ev.fim, ev.wm, " + CATEGORIA('vc', 'cg') + " AS cat," +
    " (SELECT MAX(o.price) FROM offers o WHERE o.advs_negotiation_id = an.id AND " + LANCE + ") AS maior," +
    " EXISTS (SELECT 1 FROM offers o WHERE o.advs_negotiation_id = an.id AND " + LANCE + ") AS tem_lance," +
    " (SELECT o.price FROM offers o WHERE o.id = an.offer_actual_id AND an.status IN (" + STATUS_VENDA.join(',') + ")) AS pv," +
    " EXISTS (SELECT 1 FROM access_logs al WHERE al.advertisement_id = an.advertisement_id AND al.event_id = ev.id" +
    " AND al.shop_id IS NOT NULL) AS ac" +
    " FROM (" + evs + ") ev INNER JOIN advertisement_negotiations an ON an.event_id = ev.id AND an.deleted_at IS NULL" +
    " INNER JOIN advertisements a ON a.id = an.advertisement_id" +
    " INNER JOIN vehicles vc ON vc.id = a.vehicle_id LEFT JOIN categories cg ON cg.id = vc.category_id";
  /* novo no mês = estreou no mês: nenhuma negociação num evento (de qualquer
     canal) que abriu antes do mês — a mesma "estreia" do diário */
  const veic = "SELECT n.v, " + ULT('n.c') + " AS c, " + ULT('n.st') + " AS st, " + ULT('n.vmv') + " AS vmv, " +
    ULT('n.maior') + " AS maior, " + ULT('n.tem_lance') + " AS tl, " + ULT('n.pv') + " AS pv, " + ULT('n.ac') + " AS ac," +
    " BIT_OR(n.wm) AS wm, MAX(n.cat) AS cat," +
    " NOT EXISTS (SELECT 1 FROM advertisements a2 INNER JOIN advertisement_negotiations an2 ON an2.advertisement_id = a2.id" +
    " AND an2.deleted_at IS NULL INNER JOIN events e2 ON e2.id = an2.event_id AND e2.deleted_at IS NULL" +
    " WHERE a2.vehicle_id = n.v AND e2.start_date_offer < '" + m.ini + "') AS novo" +
    " FROM (" + neg + ") n GROUP BY n.v";
  /* o funil do diário (Thomas, 06/11), sobre a negociação mais recente do
     mês: com oferta = teve lance ou vendeu; VMV atingido = o maior lance
     chegou ao VMV ou vendeu; removido (8, 10) à parte. O % do gráfico é o
     mesmo acumulado no evento: com acesso = alguma loja abriu o anúncio
     nele, com oferta = o status, vendido = o status. Sem oferta = o resto */
  const vend = "(x.st IN (" + STATUS_VENDA.join(',') + "))";
  const co = "(" + vend + " OR x.tl = '1')";
  const vm = "(" + vend + " OR (x.vmv <> '' AND x.maior <> '' AND x.maior + 0 >= x.vmv + 0))";
  const ac = "(x.ac = '1')";
  return " FROM (SELECT x.c, x.wm, x.cat, COUNT(*) AS veic, SUM(x.novo) AS novos, SUM(" + ac + ") AS ac, SUM(" + co + ") AS ofe, SUM(" + vend + ") AS ve," +
    " SUM(x.novo AND " + ac + ") AS ac_n, SUM(x.novo AND " + co + ") AS of_n, SUM(x.novo AND " + vend + ") AS ve_n," +
    " SUM(NOT " + co + ") AS so, SUM(" + co + ") AS co, SUM(" + vm + ") AS vm, SUM(" + vend + ") AS vd, SUM(x.st IN (8, 10)) AS rm," +
    " SUM(IF(" + vend + " AND x.pv <> '', x.pv + 0, 0)) AS valor" +
    " FROM (" + veic + ") x GROUP BY x.c, x.wm, x.cat) g";
};

const deMesLoj = (m) => {
  const evs = "SELECT e.id FROM events e WHERE" + EVENTO_MES(m) +
    " AND EXISTS (SELECT 1 FROM event_whitelabels ew WHERE ew.event_id = e.id AND ew.whitelabel_id IN (" + LISTA_WL + "))";
  const noMes = (col) => col + " >= '" + m.ini + "' AND " + col + " < '" + m.fim + "'";
  const base = " FROM (" + evs + ") ev INNER JOIN advertisement_negotiations an ON an.event_id = ev.id AND an.deleted_at IS NULL";
  const anuncio = " INNER JOIN advertisements a ON a.id = an.advertisement_id";
  /* k: 1 acessou (abriu anúncio do evento), 2 ofertou, 4 comprou */
  const acoes = "SELECT DISTINCT 1 AS k, al.shop_id AS l, a.shop_id AS c, ev.id AS eid" + base + anuncio +
    " INNER JOIN access_logs al ON al.advertisement_id = an.advertisement_id AND al.event_id = ev.id AND al.shop_id IS NOT NULL" +
    " AND " + noMes('al.created_at') +
    " UNION SELECT DISTINCT 2, o.buyer_shop_id, a.shop_id, ev.id" + base + anuncio +
    " INNER JOIN offers o ON o.advs_negotiation_id = an.id AND " + LANCE + " AND " + noMes('o.created_at') +
    " UNION SELECT DISTINCT 4, o.buyer_shop_id, a.shop_id, ev.id" + base + " AND an.status IN (" + STATUS_VENDA.join(',') + ")" + anuncio +
    " INNER JOIN offers o ON o.id = an.offer_actual_id AND o.buyer_shop_id IS NOT NULL AND " + noMes('o.created_at');
  const conta = "COUNT(DISTINCT IF(x.k = 1, x.l, NULL)) AS ac, COUNT(DISTINCT IF(x.k = 2, x.l, NULL)) AS ofe," +
    " COUNT(DISTINCT IF(x.k = 4, x.l, NULL)) AS co";
  /* canal 0 = todos, comitente 0 = todos: os quatro recortes da tela,
     (canal, comitente), (canal), (comitente) e o total, cada um num GROUP
     BY e unidos. Era um WITH ROLLUP, e o MCP o recusa ("syntax error near
     'with'", run 68394 de 06/11) — a mesma conta, por extenso. O total sai
     sem o canal: todo evento do mês alveja algum dos seis (evs), então as
     lojas distintas são as mesmas */
  const porCanal = " FROM (" + acoes + ") x INNER JOIN event_whitelabels ew ON ew.event_id = x.eid AND ew.whitelabel_id IN (" + LISTA_WL + ")";
  return " FROM (SELECT ew.whitelabel_id AS wl, x.c, " + conta + porCanal + " GROUP BY ew.whitelabel_id, x.c" +
    " UNION ALL SELECT ew.whitelabel_id, 0, " + conta + porCanal + " GROUP BY ew.whitelabel_id" +
    " UNION ALL SELECT 0, x.c, " + conta + " FROM (" + acoes + ") x GROUP BY x.c" +
    " UNION ALL SELECT 0, 0, " + conta + " FROM (" + acoes + ") x) g";
};

TABELAS.push(
  {
    nome: 'mes_veic',
    meses: true,
    deMes: deMesVeic,
    cols: [['c', 'g.c'], ['wm', 'g.wm'], ['veic', 'g.veic'], ['novos', 'g.novos'], ['ac', 'g.ac'], ['of', 'g.ofe'], ['ve', 'g.ve'],
      ['ac_n', 'g.ac_n'], ['of_n', 'g.of_n'], ['ve_n', 'g.ve_n'], ['so', 'g.so'], ['co', 'g.co'], ['vm', 'g.vm'], ['vd', 'g.vd'],
      ['rm', 'g.rm'], ['valor', 'g.valor'], ['cat', 'g.cat']]
  },
  {
    nome: 'mes_loj',
    meses: true,
    deMes: deMesLoj,
    cols: [['wl', 'g.wl'], ['c', 'g.c'], ['ac', 'g.ac'], ['of', 'g.ofe'], ['co', 'g.co']]
  },
  {
    /* os eventos dos 12 meses, para contar os do mês com qualquer filtro:
       dia de abrir e de fechar, máscara de canais e os comitentes */
    nome: 'mes_eventos',
    de: " FROM (SELECT e.id, DATE_FORMAT(e.start_date_offer, '%Y-%m-%d') AS ini, DATE_FORMAT(e.finish_date_event, '%Y-%m-%d') AS fim," +
        " (SELECT BIT_OR(" + BIT_WL + ") FROM event_whitelabels ew WHERE ew.event_id = e.id AND ew.whitelabel_id IN (" + LISTA_WL + ")) AS wm," +
        " (SELECT GROUP_CONCAT(DISTINCT a.shop_id) FROM advertisement_negotiations an INNER JOIN advertisements a ON a.id = an.advertisement_id" +
        " WHERE an.event_id = e.id AND an.deleted_at IS NULL) AS cs" +
        " FROM events e WHERE e.deleted_at IS NULL AND e.finish_date_event >= '" + MES_PISO + "' AND e.start_date_offer <= '" + AGORA_BR + "'" +
        " AND DATEDIFF(e.finish_date_event, e.start_date_offer) <= " + DIAS_MAX_EVENTO +
        " AND EXISTS (SELECT 1 FROM event_whitelabels ew WHERE ew.event_id = e.id AND ew.whitelabel_id IN (" + LISTA_WL + "))) g",
    cols: [['ini', 'g.ini'], ['fim', 'g.fim'], ['wm', 'g.wm'], ['cs', 'g.cs']]
  },
  {
    /* quantos dias de cada mês o access_logs tem: medido em 06/11, ele não
       tem NENHUMA linha de 06/02 a 11/03/2026. Sem isto, o acesso de
       fevereiro (16% dos veículos, contra ~90% nos outros meses) pareceria
       uma queda que não aconteceu. O Montar Painel avisa o mês incompleto */
    nome: 'mes_dias_acesso',
    de: " FROM (SELECT DATE_FORMAT(al.created_at, '%Y-%m') AS m, COUNT(DISTINCT DATE(al.created_at)) AS dias" +
        " FROM access_logs al WHERE al.created_at >= '" + MES_PISO + "' GROUP BY m) g",
    cols: [['mes', 'g.m'], ['dias', 'g.dias']]
  },
  {
    /* os comitentes dos 12 meses (o "comitentes" do diário é só dos 30 dias) */
    nome: 'mes_comitentes',
    de: " FROM shops s WHERE s.id IN (SELECT a.shop_id FROM events e INNER JOIN advertisement_negotiations an ON an.event_id = e.id" +
        " AND an.deleted_at IS NULL INNER JOIN advertisements a ON a.id = an.advertisement_id" +
        " WHERE e.deleted_at IS NULL AND e.finish_date_event >= '" + MES_PISO + "' AND e.start_date_offer <= '" + AGORA_BR + "'" +
        " AND DATEDIFF(e.finish_date_event, e.start_date_offer) <= " + DIAS_MAX_EVENTO +
        " AND EXISTS (SELECT 1 FROM event_whitelabels ew WHERE ew.event_id = e.id AND ew.whitelabel_id IN (" + LISTA_WL + ")))",
    cols: [['id', 's.id'], ['nome', 's.name']]
  }
);

/* ── guardas ────────────────────────────────────────────────────────── */
function temJanela(sql) {
  const u = String(sql).toUpperCase();
  return u.indexOf('OVER (') >= 0 || u.indexOf('OVER(') >= 0;
}

const PARTES = {};
const itens = [];
TABELAS.forEach((t) => {
  /* tabela do mensal: uma parte por mês, e o índice do mês vira a primeira
     coluna de cada linha (0 = o mais antigo) */
  const n = t.meses ? MESES : (t.partes || 1);
  PARTES[t.nome] = n;
  for (let p = 0; p < n; p++) {
    const de = t.meses ? t.deMes(MES[p]) : n > 1 ? t.de.split('PARTE').join('MOD(' + t.parte + ', ' + n + ') = ' + p) : t.de;
    if (de.indexOf('PARTE') >= 0) throw new Error(t.nome + ': PARTE sobrou numa tabela de uma parte so');
    const cols = t.meses ? [['m', String(p)]].concat(t.cols) : t.cols;
    const sql = "SELECT COUNT(*) AS total, JSON_ARRAYAGG(JSON_ARRAY(" +
      cols.map((c) => c[1]).join(', ') + ")) AS linhas" + de;
    if (temJanela(sql)) throw new Error('funcao de janela em ' + t.nome + ' (o MCP rejeita)');
    if (sql.toUpperCase().indexOf('WITH ROLLUP') >= 0) throw new Error('WITH ROLLUP em ' + t.nome + ' (o MCP rejeita: run 68394)');
    itens.push({
      json: {
        queryName: n > 1 ? t.nome + '_p' + p : t.nome,
        tabela: t.nome,
        database: DB,
        sql: sql,
        cols: cols.map((c) => c[0]),
        idx: itens.length,
        meta: { wls: WLS, dias: DIAS, piso: PISO, piso_dia: PISO_DIA, agora_br: AGORA_BR, partes: PARTES,
          meses: MES.map((m) => m.rot), dias_max_evento: DIAS_MAX_EVENTO }
      }
    });
  }
});

return itens;
