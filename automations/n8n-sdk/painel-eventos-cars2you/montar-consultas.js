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
      ['uuid', "(SELECT a3.uuid FROM advertisements a3 WHERE a3.vehicle_id = v.id ORDER BY a3.id DESC LIMIT 1)"]
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

/* ── guardas ────────────────────────────────────────────────────────── */
function temJanela(sql) {
  const u = String(sql).toUpperCase();
  return u.indexOf('OVER (') >= 0 || u.indexOf('OVER(') >= 0;
}

const PARTES = {};
const itens = [];
TABELAS.forEach((t) => {
  const n = t.partes || 1;
  PARTES[t.nome] = n;
  for (let p = 0; p < n; p++) {
    const de = n > 1 ? t.de.split('PARTE').join('MOD(' + t.parte + ', ' + n + ') = ' + p) : t.de;
    if (de.indexOf('PARTE') >= 0) throw new Error(t.nome + ': PARTE sobrou numa tabela de uma parte so');
    const sql = "SELECT COUNT(*) AS total, JSON_ARRAYAGG(JSON_ARRAY(" +
      t.cols.map((c) => c[1]).join(', ') + ")) AS linhas" + de;
    if (temJanela(sql)) throw new Error('funcao de janela em ' + t.nome + ' (o MCP rejeita)');
    itens.push({
      json: {
        queryName: n > 1 ? t.nome + '_p' + p : t.nome,
        tabela: t.nome,
        database: DB,
        sql: sql,
        cols: t.cols.map((c) => c[0]),
        idx: itens.length,
        meta: { wls: WLS, dias: DIAS, piso: PISO, piso_dia: PISO_DIA, agora_br: AGORA_BR, partes: PARTES }
      }
    });
  }
});

return itens;
