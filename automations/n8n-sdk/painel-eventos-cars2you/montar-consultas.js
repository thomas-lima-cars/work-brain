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
/* o domínio de advertisement_negotiations.status (dominios.md, 09/09): o
   mensal conta cada um, e o Montar Painel agrupa (17/11) */
const STATUS_SISTEMA = [1, 2, 3, 7, 8, 9, 10, 11, 13, 14, 15, 18];
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
    /* 16 desde 19/11: com 14 cada pacote tinha 140 KB, acima dos ~130 KB provados */
    partes: 16,
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
    /* 8 desde 19/11: com 7, até 132 KB */
    partes: 8,
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
   então o mês sai JÁ AGREGADO no banco — desde 19/11, POR EVENTO:

     mes_ev     por (evento, comitente, categoria), dois blocos de contagens:
                "o_" = os veículos DO EVENTO (cada um pela negociação mais
                recente dele no evento) e "d_" = os veículos de que este
                evento é o DONO no mês (a negociação mais recente do veículo
                no mês, pelo fim do evento e depois o id, caiu nele). Cada
                veículo tem um dono só: somar o "d_" dos eventos que passam
                no filtro é a contagem distinta. O "o_" é a linha do evento
                na tabela e o recorte de um evento escolhido.
     mes_dia    o mesmo, por dia do mês (k = dia - 1): o veículo ativo no dia
                e o acumulado no evento até o dia, para o gráfico diário do
                mês (Thomas, 19/11). O dono do dia é o evento mais recente
                entre os ativos no dia — a regra do Diário.
     mes_lojd   por evento, as lojas com a máscara dos dias do mês em que
                acessaram, ofertaram e compraram (bit k = dia k + 1). Loja
                distinta não soma entre eventos: com a máscara, a página
                junta as lojas de qualquer conjunto de eventos.

   Pedido do Thomas em 19/11: "volte os eventos ativos" — o recorte de evento
   fechado (FECHADO, de 18/11) saiu de todas as consultas. A situação do
   evento (ativo ou finalizado) vai no mes_eventos, e a página filtra.

   Medido em 19/11 (conexão direta): out/26, o maior mês, 268 eventos, 601
   grupos de evento, comitente e categoria, 682 eventos-dia e 17.135 pares
   evento-loja; 139 mil pares nos 12 meses.

   ⚠️ Evento com mais de 31 dias de ofertas fica fora do mensal: é depósito,
   não evento. "Anúncios cancelados" (id 266, aberto de 2021 a 16/12/2025,
   10.127 negociações) sozinho levava dezembro de 2,4 mil para 11,7 mil
   veículos; os "Em preparação LM" são do mesmo tipo.
   ══════════════════════════════════════════════════════════════════════ */
const MESES = 12;
const DIAS_MAX_EVENTO = 31;
const PARTES_LOJD = 3;
const PARTES_EVENTOS = 3;
const MES = [];
for (let k = MESES - 1; k >= 0; k--) {
  const a = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth() - k, 1));
  const b = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth() - k + 1, 1));
  /* "ult" = o último dia que conta: o dia de hoje no mês corrente */
  const ult = k === 0 ? dataDe(agora) : dataDe(new Date(b.getTime() - 86400000));
  MES.push({ rot: dataDe(a).slice(0, 7), ini: dataDe(a) + ' 00:00:00', fim: dataDe(b) + ' 00:00:00', dia0: dataDe(a), ult: ult });
}
const MES_PISO = MES[0].ini;
/* posição do canal na lista: bit 0 = 4, bit 1 = 7, ... (FIELD conta de 1) */
const BIT_WL = "(1 << (FIELD(ew.whitelabel_id, " + LISTA_WL + ") - 1))";
/* o evento do mês: dos seis canais, já aberto, ativo em algum dia do mês,
   com no máximo 31 dias de ofertas. Aberto OU fechado (Thomas, 19/11) */
const EVENTO_MES = (m) =>
  " e.deleted_at IS NULL AND e.start_date_offer < '" + m.fim + "' AND e.finish_date_event >= '" + m.ini + "'" +
  " AND e.start_date_offer <= '" + AGORA_BR + "' AND DATEDIFF(e.finish_date_event, e.start_date_offer) <= " + DIAS_MAX_EVENTO +
  " AND EXISTS (SELECT 1 FROM event_whitelabels ew WHERE ew.event_id = e.id AND ew.whitelabel_id IN (" + LISTA_WL + "))";
const VENDA_IN = STATUS_VENDA.join(',');
/* REMOVIDOS FORA DO MENSAL (Thomas, 25/11: "retire os veículos removidos").
   A NEGOCIAÇÃO suspensa (8) ou cancelada (10) não existe para o mês: sai
   antes de tudo, em todas as consultas do mês (mes_ev, mes_dia, mes_lojd e
   a escolha do dono). O veículo segue pelas outras negociações dele no mês;
   só some se todas foram removidas. Cortar a negociação, e não o veículo
   pela última dela, é o que mantém o mês, os dias, os eventos e as lojas
   coerentes entre si: na 1ª versão (veículo fora quando a última do mês era
   removida) os novos dos dias somavam 3.019 contra 2.613 do mês (nov/26,
   coleta de 25/11). A estreia (NOVO e "est") também ignora a removida: com
   ela, o veículo que estreou numa negociação removida era novo no mês e em
   nenhum dia (jan/26: 1.691 no mês contra 1.690 nos dias). O Diário segue
   contando as removidas */
const STATUS_REMOVIDO = [8, 10];
const NAO_REMOVIDO = (col) => col + " NOT IN (" + STATUS_REMOVIDO.join(',') + ")";
/* a junção de evento com negociação, sem a removida */
const NEG_DO_EVENTO = " INNER JOIN advertisement_negotiations an ON an.event_id = e.id AND an.deleted_at IS NULL AND " + NAO_REMOVIDO('an.status');
/* o lance de loja (o mesmo filtro da tabela de ofertas do diário) */
const LANCE = "o.deleted_at IS NULL AND o.buyer_shop_id IS NOT NULL";
/* a negociação mais recente do veículo no mês (fim do evento, depois id):
   sem função de janela (o MCP rejeita), pelo MAX de uma chave que ordena */
const CHAVE = "CONCAT(DATE_FORMAT(n.fim, '%Y%m%d%H%i'), LPAD(n.nid, 10, '0'))";
/* a mais recente DENTRO do evento: o id maior (o mesmo desempate do diário) */
const ULT_ID = (col) => "SUBSTRING_INDEX(MAX(CONCAT(LPAD(n.nid, 10, '0'), '|', IFNULL(" + col + ", ''))), '|', -1)";
/* o dia do mês (0 = dia 1) em que o evento abre e fecha, cortado no mês e,
   no mês corrente, em hoje */
const K0 = (m) => "DATEDIFF(GREATEST(DATE(e.start_date_offer), '" + m.dia0 + "'), '" + m.dia0 + "')";
const K1 = (m) => "DATEDIFF(LEAST(DATE(e.finish_date_event), '" + m.ult + "'), '" + m.dia0 + "')";
/* a negociação leve: só o que decide o dono (do mês e do dia) */
const NEG_LEVE = (m) => "SELECT an.id AS nid, an.event_id AS eid, a.vehicle_id AS v, e.finish_date_event AS fim," +
  " " + K0(m) + " AS k0, " + K1(m) + " AS k1" +
  " FROM events e" + NEG_DO_EVENTO +
  " INNER JOIN advertisements a ON a.id = an.advertisement_id WHERE" + EVENTO_MES(m);
/* novo no mês = estreou no mês: nenhuma negociação num evento (de qualquer
   canal) que abriu antes do mês — a mesma "estreia" do diário */
const NOVO = (m, col) => "NOT EXISTS (SELECT 1 FROM advertisements a2 INNER JOIN advertisement_negotiations an2 ON an2.advertisement_id = a2.id" +
  " AND an2.deleted_at IS NULL" + " AND " + NAO_REMOVIDO('an2.status') + " INNER JOIN events e2 ON e2.id = an2.event_id AND e2.deleted_at IS NULL" +
  " WHERE a2.vehicle_id = " + col + " AND e2.start_date_offer < '" + m.ini + "')";
/* os 31 dias do mês (k = 0 a 30), sem tabela de números no banco */
const DIAS_MES = (() => {
  const u = [];
  for (let k = 0; k <= 30; k++) u.push('SELECT ' + k + ' AS k');
  return '(' + u.join(' UNION ALL ') + ')';
})();

/* ── mes_ev: o mês por evento ──────────────────────────────────────────
   Os status do mês são os do SISTEMA (Thomas, 17/11), da negociação
   escolhida: uma contagem por status de advertisement_negotiations.status
   (dominios.md), e a página agrupa em Ativos, Em análise, Vendidos, Não
   vendidos e Removidos. "sx" = status fora do domínio conhecido. Com acesso
   = alguma loja abriu o anúncio no evento; com oferta = teve lance ou
   vendeu; vendido = status 2, 3 ou 7 (acumulados no evento) */
const BLOCO_EV = (p, w) => {
  const e = (c) => (w === '1' ? c : '(' + w + ' AND ' + c + ')');
  const vend = "o.st IN (" + VENDA_IN + ")";
  const co = "(" + vend + " OR o.tl = '1')";
  const ac = "o.ac = '1'";
  return [
    [p + 'veic', 'SUM(' + w + ')'],
    [p + 'novos', 'SUM(' + e('d.novo') + ')'],
    [p + 'ac', 'SUM(' + e(ac) + ')'],
    [p + 'of', 'SUM(' + e(co) + ')'],
    [p + 've', 'SUM(' + e(vend) + ')'],
    [p + 'ac_n', 'SUM(' + e('d.novo AND ' + ac) + ')'],
    [p + 'of_n', 'SUM(' + e('d.novo AND ' + co) + ')'],
    [p + 've_n', 'SUM(' + e('d.novo AND ' + vend) + ')']
  ].concat(STATUS_SISTEMA.map((s) => [p + 's' + s, 'SUM(' + e('o.st = ' + s) + ')']), [
    [p + 'sx', 'SUM(' + e('o.st NOT IN (' + STATUS_SISTEMA.join(',') + ')') + ')'],
    [p + 'valor', 'SUM(IF(' + e(vend + " AND o.pv <> ''") + ', o.pv + 0, 0))']
  ]);
};
const COLS_EV = BLOCO_EV('o_', '1').concat(BLOCO_EV('d_', '(o.eid = d.de)'));
const deMesEv = (m) => {
  const neg = "SELECT an.id AS nid, an.event_id AS eid, a.vehicle_id AS v, a.shop_id AS c, an.status AS st, " + CATEGORIA('vc', 'cg') + " AS cat," +
    " EXISTS (SELECT 1 FROM offers o WHERE o.advs_negotiation_id = an.id AND " + LANCE + ") AS tl," +
    " (SELECT o.price FROM offers o WHERE o.id = an.offer_actual_id AND an.status IN (" + VENDA_IN + ")) AS pv," +
    " EXISTS (SELECT 1 FROM access_logs al WHERE al.advertisement_id = an.advertisement_id AND al.event_id = e.id" +
    " AND al.shop_id IS NOT NULL) AS ac" +
    " FROM events e" + NEG_DO_EVENTO +
    " INNER JOIN advertisements a ON a.id = an.advertisement_id" +
    " INNER JOIN vehicles vc ON vc.id = a.vehicle_id LEFT JOIN categories cg ON cg.id = vc.category_id WHERE" + EVENTO_MES(m);
  const own = "SELECT n.eid, n.v, " + ULT_ID('n.c') + " AS c, " + ULT_ID('n.st') + " AS st, " + ULT_ID('n.tl') + " AS tl, " +
    ULT_ID('n.pv') + " AS pv, " + ULT_ID('n.ac') + " AS ac, MAX(n.cat) AS cat FROM (" + neg + ") n GROUP BY n.eid, n.v";
  /* o dono do mês: dentro do mesmo evento a negociação mais recente é a de
     id maior nas duas chaves, então a linha do dono É a linha do evento —
     basta marcar "o evento é o dono" (o.eid = d.de) */
  const dono = "SELECT n.v, SUBSTRING_INDEX(MAX(CONCAT(" + CHAVE + ", '|', n.eid)), '|', -1) AS de, " + NOVO(m, 'n.v') + " AS novo" +
    " FROM (" + NEG_LEVE(m) + ") n GROUP BY n.v";
  return " FROM (SELECT o.eid, o.c, o.cat, " + COLS_EV.map((c) => c[1] + ' AS ' + c[0]).join(', ') +
    " FROM (" + own + ") o INNER JOIN (" + dono + ") d ON d.v = o.v GROUP BY o.eid, o.c, o.cat) g";
};

/* ── mes_dia: o mês por dia ─────────────────────────────────────────────
   O gráfico diário do mês (Thomas, 19/11: "uma visão diária dos gráficos
   de veículos ativos e lojistas limitado ao mês de referência"). Veículo
   ativo no dia k = negociação num evento aberto no dia; o acumulado no
   evento até o fim do dia, como no Diário: com acesso = o primeiro acesso
   ao anúncio no evento até o dia; com oferta = o primeiro lance de loja até
   o dia, ou vendeu até ele; vendido = a oferta vencedora até o dia. Novo no
   dia = estreou no dia (o início de ofertas do primeiro evento da vida do
   veículo). Os dias de cada data vêm contados do dia 1 do mês (negativo =
   antes do mês: conta em todo dia) */
const BLOCO_DIA = (p, w) => {
  const e = (c) => (w === '1' ? c : '(' + w + ' AND ' + c + ')');
  const ate = (col) => "(" + col + " <> '' AND " + col + " + 0 <= dd.k)";
  const ve = ate('o.fvk');
  const of = "(" + ve + " OR " + ate('o.flk') + ")";
  const ac = ate('o.fak');
  const nv = "s.ek = dd.k";
  return [
    [p + 'veic', 'SUM(' + w + ')'],
    [p + 'novos', 'SUM(' + e(nv) + ')'],
    [p + 'ac', 'SUM(' + e(ac) + ')'],
    [p + 'of', 'SUM(' + e(of) + ')'],
    [p + 've', 'SUM(' + e(ve) + ')'],
    [p + 'ac_n', 'SUM(' + e(nv + ' AND ' + ac) + ')'],
    [p + 'of_n', 'SUM(' + e(nv + ' AND ' + of) + ')'],
    [p + 've_n', 'SUM(' + e(nv + ' AND ' + ve) + ')']
  ];
};
const COLS_DIA = BLOCO_DIA('o_', '1').concat(BLOCO_DIA('d_', '(o.eid = d.de)'));
const deMesDia = (m) => {
  const desde = (col) => "DATEDIFF(" + col + ", '" + m.dia0 + "')";
  const neg = "SELECT an.id AS nid, an.event_id AS eid, a.vehicle_id AS v, a.shop_id AS c, " + CATEGORIA('vc', 'cg') + " AS cat," +
    " " + K0(m) + " AS k0, " + K1(m) + " AS k1," +
    " " + desde("(SELECT MIN(al.created_at) FROM access_logs al WHERE al.advertisement_id = an.advertisement_id AND al.event_id = e.id" +
    " AND al.shop_id IS NOT NULL)") + " AS fak," +
    " " + desde("(SELECT MIN(o.created_at) FROM offers o WHERE o.advs_negotiation_id = an.id AND " + LANCE + ")") + " AS flk," +
    " IF(an.status IN (" + VENDA_IN + "), " + desde("(SELECT o.created_at FROM offers o WHERE o.id = an.offer_actual_id)") + ", NULL) AS fvk" +
    " FROM events e" + NEG_DO_EVENTO +
    " INNER JOIN advertisements a ON a.id = an.advertisement_id" +
    " INNER JOIN vehicles vc ON vc.id = a.vehicle_id LEFT JOIN categories cg ON cg.id = vc.category_id WHERE" + EVENTO_MES(m);
  const own = "SELECT n.eid, n.v, " + ULT_ID('n.c') + " AS c, " + ULT_ID('n.fak') + " AS fak, " + ULT_ID('n.flk') + " AS flk, " +
    ULT_ID('n.fvk') + " AS fvk, MAX(n.cat) AS cat, MIN(n.k0) AS k0, MAX(n.k1) AS k1 FROM (" + neg + ") n GROUP BY n.eid, n.v";
  const dono = "SELECT n.v, dd.k, SUBSTRING_INDEX(MAX(CONCAT(" + CHAVE + ", '|', n.eid)), '|', -1) AS de" +
    " FROM (" + NEG_LEVE(m) + ") n INNER JOIN " + DIAS_MES + " dd ON dd.k BETWEEN n.k0 AND n.k1 GROUP BY n.v, dd.k";
  const est = "SELECT x.v, DATEDIFF((SELECT MIN(e2.start_date_offer) FROM advertisements a2" +
    " INNER JOIN advertisement_negotiations an2 ON an2.advertisement_id = a2.id AND an2.deleted_at IS NULL" + " AND " + NAO_REMOVIDO('an2.status') +
    " INNER JOIN events e2 ON e2.id = an2.event_id AND e2.deleted_at IS NULL WHERE a2.vehicle_id = x.v), '" + m.dia0 + "') AS ek" +
    " FROM (SELECT DISTINCT n.v FROM (" + NEG_LEVE(m) + ") n) x";
  return " FROM (SELECT dd.k, o.eid, o.c, o.cat, " + COLS_DIA.map((c) => c[1] + ' AS ' + c[0]).join(', ') +
    " FROM (" + own + ") o INNER JOIN " + DIAS_MES + " dd ON dd.k BETWEEN o.k0 AND o.k1" +
    " INNER JOIN (" + dono + ") d ON d.v = o.v AND d.k = dd.k" +
    " INNER JOIN (" + est + ") s ON s.v = o.v GROUP BY dd.k, o.eid, o.c, o.cat) g";
};

/* ── mes_lojd: as lojas de cada evento, com os dias ──────────────────────
   Uma linha por evento: [evento, ["loja.acessou.ofertou.comprou", ...]], as
   máscaras dos dias do mês em base 36 (bit k = dia k + 1; o dia 31 é o bit
   30, dentro do inteiro de 32 bits do JavaScript), e as que forem zero no
   fim ficam de fora ("123.1f" = a loja 123 só acessou). Acessou = abriu um
   anúncio do evento; ofertou = deu lance; comprou = a oferta vencedora de
   uma venda (2, 3, 7), no dia dela. Partes pelo resto do id do evento */
const deMesLojd = (m, p) => {
  const noMes = (col) => col + " >= '" + m.ini + "' AND " + col + " < '" + m.fim + "'";
  const bitDia = (col) => "(1 << (DAY(" + col + ") - 1))";
  const evs = "SELECT e.id FROM events e WHERE" + EVENTO_MES(m) + " AND MOD(e.id, " + PARTES_LOJD + ") = " + p;
  const base = " FROM (" + evs + ") ev INNER JOIN advertisement_negotiations an ON an.event_id = ev.id AND an.deleted_at IS NULL" +
    " AND " + NAO_REMOVIDO('an.status');
  const acoes = "SELECT 1 AS t, al.shop_id AS l, ev.id AS eid, " + bitDia('al.created_at') + " AS b" + base +
    " INNER JOIN access_logs al ON al.advertisement_id = an.advertisement_id AND al.event_id = ev.id AND al.shop_id IS NOT NULL" +
    " AND " + noMes('al.created_at') +
    " UNION ALL SELECT 2, o.buyer_shop_id, ev.id, " + bitDia('o.created_at') + base +
    " INNER JOIN offers o ON o.advs_negotiation_id = an.id AND " + LANCE + " AND " + noMes('o.created_at') +
    " UNION ALL SELECT 4, o.buyer_shop_id, ev.id, " + bitDia('o.created_at') + base + " AND an.status IN (" + VENDA_IN + ")" +
    " INNER JOIN offers o ON o.id = an.offer_actual_id AND o.buyer_shop_id IS NOT NULL AND " + noMes('o.created_at');
  const pares = "SELECT x.eid, x.l, BIT_OR(IF(x.t = 1, x.b, 0)) AS mac, BIT_OR(IF(x.t = 2, x.b, 0)) AS mof," +
    " BIT_OR(IF(x.t = 4, x.b, 0)) AS mco FROM (" + acoes + ") x GROUP BY x.eid, x.l";
  const b36 = (c) => "LOWER(CONV(" + c + ", 10, 36))";
  const txt = "CONCAT(p.l, '.', " + b36('p.mac') + ", IF(p.mof > 0 OR p.mco > 0, CONCAT('.', " + b36('p.mof') +
    ", IF(p.mco > 0, CONCAT('.', " + b36('p.mco') + "), '')), ''))";
  return " FROM (SELECT p.eid, JSON_ARRAYAGG(" + txt + ") AS ls FROM (" + pares + ") p GROUP BY p.eid) g";
};

TABELAS.push(
  {
    nome: 'mes_ev',
    meses: true,
    deMes: deMesEv,
    cols: [['eid', 'g.eid'], ['c', 'g.c'], ['cat', 'g.cat']].concat(COLS_EV.map((c) => [c[0], 'g.' + c[0]]))
  },
  {
    nome: 'mes_dia',
    meses: true,
    deMes: deMesDia,
    cols: [['k', 'g.k'], ['eid', 'g.eid'], ['c', 'g.c'], ['cat', 'g.cat']].concat(COLS_DIA.map((c) => [c[0], 'g.' + c[0]]))
  },
  {
    nome: 'mes_lojd',
    meses: true,
    partesMes: PARTES_LOJD,
    deMes: deMesLojd,
    cols: [['eid', 'g.eid'], ['ls', 'g.ls']]
  },
  {
    /* os eventos dos 12 meses: nome, situação (status do sistema), abre,
       fecha, máscara de canais e os comitentes. Finalizado = status 0 E o
       fim já passou (medido em 17/11: nenhuma das duas sozinha separa); o
       Montar Painel decide, com o "agora" da coleta */
    nome: 'mes_eventos',
    partes: PARTES_EVENTOS,
    parte: 'e.id',
    de: " FROM (SELECT e.id, e.name AS nome, e.status AS st, " + DATA('e.start_date_offer') + " AS ini, " + DATA('e.finish_date_event') + " AS fim," +
        " (SELECT BIT_OR(" + BIT_WL + ") FROM event_whitelabels ew WHERE ew.event_id = e.id AND ew.whitelabel_id IN (" + LISTA_WL + ")) AS wm," +
        " (SELECT GROUP_CONCAT(DISTINCT a.shop_id) FROM advertisement_negotiations an INNER JOIN advertisements a ON a.id = an.advertisement_id" +
        " WHERE an.event_id = e.id AND an.deleted_at IS NULL) AS cs" +
        " FROM events e WHERE e.deleted_at IS NULL AND e.finish_date_event >= '" + MES_PISO + "' AND e.start_date_offer <= '" + AGORA_BR + "'" +
        " AND DATEDIFF(e.finish_date_event, e.start_date_offer) <= " + DIAS_MAX_EVENTO +
        " AND EXISTS (SELECT 1 FROM event_whitelabels ew WHERE ew.event_id = e.id AND ew.whitelabel_id IN (" + LISTA_WL + "))" +
        " AND PARTE) g",
    cols: [['id', 'g.id'], ['nome', 'g.nome'], ['st', 'g.st'], ['ini', 'g.ini'], ['fim', 'g.fim'], ['wm', 'g.wm'], ['cs', 'g.cs']]
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
  /* tabela do mensal com partes (mes_lojd): mês a mês, cada mês em
     "partesMes" partes; a parte p é o mês p / partesMes */
  const pm = t.partesMes || 1;
  const n = t.meses ? MESES * pm : (t.partes || 1);
  PARTES[t.nome] = n;
  for (let p = 0; p < n; p++) {
    const mi = Math.floor(p / pm);
    const de = t.meses ? t.deMes(MES[mi], p % pm) : n > 1 ? t.de.split('PARTE').join('MOD(' + t.parte + ', ' + n + ') = ' + p) : t.de;
    if (de.indexOf('PARTE') >= 0) throw new Error(t.nome + ': PARTE sobrou numa tabela de uma parte so');
    const cols = t.meses ? [['m', String(mi)]].concat(t.cols) : t.cols;
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
          meses: MES.map((m) => m.rot), meses_ult: MES.map((m) => m.ult), dias_max_evento: DIAS_MAX_EVENTO }
      }
    });
  }
});

return itens;
