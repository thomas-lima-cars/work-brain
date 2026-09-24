/* ══════════════════════════════════════════════════════════════════════
   NÓ "Montar Consultas" — Painel de Eventos C6

   Monta as cinco consultas do painel. Cada uma devolve UMA linha só:

       SELECT COUNT(*) AS total, JSON_ARRAYAGG(JSON_ARRAY(...)) AS linhas

   A tabela inteira viaja empacotada num JSON, então o teto de 50 linhas
   do MCP não corta nada e não existe paginação — cinco chamadas por run,
   e não dezenas. O padrão é o do relatório de evento C6 em produção
   ("ehsqQo6hiPDRf58I", nó SQL Lotes), que já roda assim desde 26/08.

   O "total" sai da MESMA varredura do array. Se o pacote chegar menor que
   o total (limite de tamanho do JSON_ARRAYAGG, resposta cortada no
   caminho), o Montar Painel para o run em vez de publicar meia tabela.

   ─── O RECORTE (decidido pelo Thomas em 2026-09-24) ──────────────────
   Eventos que alvejam o whitelabel 43 (Canal de vendas C6 Auto) e que
   terminam de 30 dias atrás em diante — os abertos, os agendados e os
   encerrados recentes. Sem teto: evento agendado já tem veículo publicado.

   Por WHITELABEL, a pedido. O relatório de produção trava por loja
   vendedora (104754); aqui a loja vendedora viaja como coluna e o painel
   avisa se aparecer outra.

   ─── FUSO ────────────────────────────────────────────────────────────
   O banco responde NOW() em UTC, mas grava as datas de evento E de oferta
   em hora de Brasília (medido em 2026-09-24: NOW() 17:22, última oferta
   14:22, relógio local 14:22). Por isso o piso é calculado aqui, em hora
   de Brasília, e viaja como literal. Não trocar por NOW()/CURDATE().

   ⚠️ Este arquivo viaja pro n8n como string. Sem barra invertida e sem
   regex, de propósito — ver automations/n8n-sdk/README.md.
   ══════════════════════════════════════════════════════════════════════ */

const WL_C6 = 43;
const DIAS_JANELA = 30;
const FUSO_MIN = -180;          /* America/Sao_Paulo, sem horário de verão */
const DB = 'cars2you_production';

const pad = (n) => String(n).padStart(2, '0');
const dataDe = (d) => d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
const agora = new Date(Date.now() + FUSO_MIN * 60000);
const AGORA_BR = dataDe(agora) + ' ' + pad(agora.getUTCHours()) + ':' + pad(agora.getUTCMinutes());
const PISO = dataDe(new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(),
  agora.getUTCDate() - DIAS_JANELA))) + ' 00:00:00';

/* o recorte de evento, escrito uma vez só e reusado nas cinco consultas.
   Cinco cópias à mão seriam cinco chances de uma divergir das outras. */
const EVENTO =
  " e.deleted_at IS NULL AND e.finish_date_event >= '" + PISO + "'" +
  " AND EXISTS (SELECT 1 FROM event_whitelabels ew" +
  " WHERE ew.event_id = e.id AND ew.whitelabel_id = " + WL_C6 + ")";

/* ofertas das negociações dos eventos do recorte — base de três consultas */
const OFERTAS_DO_RECORTE =
  " FROM offers o" +
  " INNER JOIN advertisement_negotiations an ON an.id = o.advs_negotiation_id AND an.deleted_at IS NULL" +
  " INNER JOIN events e ON e.id = an.event_id AND" + EVENTO +
  " WHERE o.deleted_at IS NULL";

const DATA = (col) => "DATE_FORMAT(" + col + ", '%Y-%m-%d %H:%i')";

/* ── as cinco tabelas ─────────────────────────────────────────────────
   "cols" é a fonte única da ordem: dela saem o JSON_ARRAY daqui e o
   decodificador do Montar Painel (que recebe as chaves no item). */
const TABELAS = [
  {
    nome: 'eventos',
    de: " FROM events e WHERE" + EVENTO,
    cols: [
      ['id', 'e.id'],
      ['nome', 'e.name'],
      ['status', 'e.status'],
      ['situacao', 'e.situation'],
      ['ini', DATA('e.start_date_offer')],
      ['fim', DATA('e.finish_date_event')],
      ['wls', "(SELECT GROUP_CONCAT(ew2.whitelabel_id ORDER BY ew2.whitelabel_id)" +
              " FROM event_whitelabels ew2 WHERE ew2.event_id = e.id)"]
    ]
  },
  {
    /* uma linha por NEGOCIAÇÃO: é ela que pertence ao evento. O mesmo carro
       em dois eventos aparece duas vezes, uma em cada — é o certo aqui. */
    nome: 'veiculos',
    de: " FROM advertisement_negotiations an" +
        " INNER JOIN events e ON e.id = an.event_id AND" + EVENTO +
        " INNER JOIN advertisements a ON a.id = an.advertisement_id" +
        " INNER JOIN vehicles v ON v.id = a.vehicle_id" +
        /* LEFT nos catálogos: INNER descarta veículo sem avisar */
        " LEFT JOIN brands b ON b.id = v.brand_id" +
        " LEFT JOIN models m ON m.id = v.model_id" +
        " LEFT JOIN versions ver ON ver.id = v.version_id" +
        " WHERE an.deleted_at IS NULL",
    cols: [
      ['neg', 'an.id'],
      ['evento', 'an.event_id'],
      ['anuncio', 'a.id'],
      ['uuid', 'a.uuid'],
      ['veiculo', 'a.vehicle_id'],
      ['vendedor', 'a.shop_id'],
      ['status', 'an.status'],
      ['vencedora', 'an.offer_actual_id'],
      /* VMV: valor mínimo que o vendedor aceita, por negociação */
      ['vmv', 'NULLIF(an.min_sale_price, 0)'],
      /* FIPE do ANÚNCIO, não do veículo — mais preenchida e contemporânea
         da oferta (context/banco-de-dados/projetos/precificacao/definicoes.md) */
      ['fipe', 'NULLIF(a.fipe_price, 0)'],
      /* placa e chassi a pedido do Thomas (2026-09-24): o painel é do C6,
         dono dos veículos. Nada de documento de pessoa entra. */
      ['placa', 'v.plate'],
      ['chassi', 'v.chassi'],
      ['marca', 'b.name'],
      ['modelo', 'm.name'],
      ['versao', 'ver.name'],
      ['ano_fab', 'v.manufacture_year'],
      ['ano_mod', 'v.model_year'],
      ['km', 'NULLIF(v.km, 0)'],
      /* um laudo por veículo (medido na sonda 50346); o MAX só resume a
         linha. nao_informado = laudo SEM veredito, não ausência de laudo */
      ['laudo', "(SELECT MAX(vpr.situation) FROM vehicle_precautionary_reports vpr" +
                " WHERE vpr.vehicle_id = a.vehicle_id AND vpr.deleted_at IS NULL)"],
      ['anuncio_apagado', 'a.deleted_at IS NOT NULL']
    ]
  },
  {
    nome: 'ofertas',
    de: OFERTAS_DO_RECORTE,
    cols: [
      ['id', 'o.id'],
      ['neg', 'o.advs_negotiation_id'],
      ['loja', 'o.buyer_shop_id'],
      ['usuario', 'o.buyer_user_id'],
      ['valor', 'o.price'],
      ['quando', DATA('o.created_at')]
    ]
  },
  {
    /* as lojas que o painel cita: quem ofertou no recorte MAIS as lojas do
       canal cadastradas desde o início do evento mais antigo da janela. O
       UNION deduplica.
       O CNPJ é a chave do cruzamento com a planilha de representantes
       comerciais (Montar Painel). Ele NÃO vai para o HTML — é chave, não
       dado de tela, e a prova confere. O key account saiu em 2026-09-24:
       o responsável da loja passou a ser o representante da planilha. */
    nome: 'lojas',
    de: " FROM (SELECT o.buyer_shop_id AS id" + OFERTAS_DO_RECORTE +
        " AND o.buyer_shop_id IS NOT NULL" +
        " UNION SELECT s2.id AS id FROM shops s2" +
        " WHERE s2.whitelabel_id = " + WL_C6 + " AND s2.deleted_at IS NULL" +
        " AND s2.created_at >= (SELECT MIN(e.start_date_offer) FROM events e WHERE" + EVENTO + ")) ids" +
        " INNER JOIN shops s ON s.id = ids.id",
    cols: [
      ['id', 's.id'],
      ['nome', 's.name'],
      ['wl', 's.whitelabel_id'],
      ['situacao', 's.situation'],
      ['cadastro', DATA('s.created_at')],
      ['apagada', 's.deleted_at IS NOT NULL'],
      ['cnpj', 's.cnpj']
    ]
  },
  {
    /* a última oferta de cada loja ANTES de cada evento em que ela ofertou.
       Um par (evento, loja) por linha, e o MAX vai pelo índice de
       offers.buyer_shop_id. Oferta e evento no mesmo fuso (Brasília), então
       a comparação é direta. Qualquer evento conta, não só os do C6. */
    nome: 'ult_anterior',
    de: " FROM (SELECT DISTINCT an.event_id AS ev, o.buyer_shop_id AS loja, e.start_date_offer AS ini" +
        OFERTAS_DO_RECORTE + " AND o.buyer_shop_id IS NOT NULL) p",
    cols: [
      ['evento', 'p.ev'],
      ['loja', 'p.loja'],
      ['ult', "(SELECT " + DATA('MAX(o2.created_at)') + " FROM offers o2" +
              " WHERE o2.buyer_shop_id = p.loja AND o2.deleted_at IS NULL AND o2.created_at < p.ini)"]
    ]
  }
];

/* ── guardas ────────────────────────────────────────────────────────── */
function temJanela(sql) {
  const u = String(sql).toUpperCase();
  return u.indexOf('OVER (') >= 0 || u.indexOf('OVER(') >= 0;
}

const itens = TABELAS.map((t, i) => {
  const sql = "SELECT COUNT(*) AS total, JSON_ARRAYAGG(JSON_ARRAY(" +
    t.cols.map((c) => c[1]).join(', ') + ")) AS linhas" + t.de;
  if (temJanela(sql)) throw new Error('funcao de janela em ' + t.nome + ' (o MCP rejeita)');
  return {
    json: {
      queryName: t.nome,
      database: DB,
      sql: sql,
      cols: t.cols.map((c) => c[0]),
      idx: i,
      meta: { wl: WL_C6, dias_janela: DIAS_JANELA, piso: PISO, agora_br: AGORA_BR }
    }
  };
});

return itens;
