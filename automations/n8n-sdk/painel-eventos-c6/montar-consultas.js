/* ══════════════════════════════════════════════════════════════════════
   NÓ "Montar Consultas" — Painel de Eventos C6

   Monta as sete consultas do painel. Cada uma devolve UMA linha só:

       SELECT COUNT(*) AS total, JSON_ARRAYAGG(JSON_ARRAY(...)) AS linhas

   A tabela inteira viaja empacotada num JSON, então o teto de 50 linhas
   do MCP não corta nada e não existe paginação — sete chamadas por run,
   e não dezenas. O padrão é o do relatório de evento C6 em produção
   ("ehsqQo6hiPDRf58I", nó SQL Lotes), que já roda assim desde 26/08.

   O "total" sai da MESMA varredura do array. Se o pacote chegar menor que
   o total (limite de tamanho do JSON_ARRAYAGG, resposta cortada no
   caminho), o Montar Painel para o run em vez de publicar meia tabela.

   ─── O RECORTE (Thomas, 2026-09-24; outubro em 2026-10-02) ───────────
   Eventos que alvejam o whitelabel 43 (Canal de vendas C6 Auto) e que
   ENCERRAM A PARTIR DE 01/10/2026 — a seleção de outubro. Sem teto: evento
   agendado já tem veículo publicado, e os de outubro entram sozinhos. Até
   02/10 o piso era móvel, 30 dias antes de hoje.

   ─── LOJA NOVA (Thomas, 2026-10-02) ──────────────────────────────────
   Cadastrada a partir de 01/10/2026 E no grupo de cliente 146 ("Parceiros
   C6 - Exclusivo SP"). O grupo mora no USUÁRIO (user_shops ->
   user_clients_group), não na loja: a loja está no grupo quando algum
   usuário dela está. A consulta de lojas traz esse sinal; o corte é do
   Montar Painel.

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
/* a seleção de outubro (02/10): eventos que encerram a partir daqui */
const RECORTE_DESDE = '2026-10-01 00:00:00';
/* loja nova (02/10): cadastro a partir daqui E no grupo de cliente */
const NOVAS_DESDE = '2026-10-01 00:00';
const GRUPO_NOVAS = 146;
const GRUPO_NOVAS_NOME = 'Parceiros C6 - Exclusivo SP';
const FUSO_MIN = -180;          /* America/Sao_Paulo, sem horário de verão */
const DB = 'cars2you_production';

const pad = (n) => String(n).padStart(2, '0');
const dataDe = (d) => d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
const agora = new Date(Date.now() + FUSO_MIN * 60000);
const AGORA_BR = dataDe(agora) + ' ' + pad(agora.getUTCHours()) + ':' + pad(agora.getUTCMinutes());
const PISO = RECORTE_DESDE;
/* 05/10: o painel mostra SÓ o Mega Evento (24052, 145 anúncios, 05 a 08/10), a pedido do Thomas */
const SO_EVENTOS = '24052';

/* o recorte de evento, escrito uma vez só e reusado em todas as consultas.
   Cinco cópias à mão seriam cinco chances de uma divergir das outras. */
const EVENTO =
  " e.deleted_at IS NULL AND e.id IN (" + SO_EVENTOS + ") AND e.finish_date_event >= '" + PISO + "'" +
  " AND EXISTS (SELECT 1 FROM event_whitelabels ew" +
  " WHERE ew.event_id = e.id AND ew.whitelabel_id = " + WL_C6 + ")";

/* ofertas das negociações dos eventos do recorte — base de três consultas */
const OFERTAS_DO_RECORTE =
  " FROM offers o" +
  " INNER JOIN advertisement_negotiations an ON an.id = o.advs_negotiation_id AND an.deleted_at IS NULL" +
  " INNER JOIN events e ON e.id = an.event_id AND" + EVENTO +
  " WHERE o.deleted_at IS NULL";

/* acessos de loja AO EVENTO (08/10, Thomas): linha de access_logs com o
   event_id do evento, dentro do horário DELE (início da oferta ao fim), no
   minuto. Antes contava qualquer acesso ao canal no período — medido em
   08/10 no 24052: 251 lojas no canal, 91 no evento. Join por igualdade no
   event_id, como em acessos_anuncio; por faixa de data passou de 5 min. */
const ACESSOS_DO_EVENTO =
  " FROM events e INNER JOIN access_logs al ON al.event_id = e.id" +
  " AND al.whitelabel_id = " + WL_C6 + " AND al.shop_id IS NOT NULL" +
  " AND al.created_at >= e.start_date_offer AND al.created_at <= e.finish_date_event" +
  " WHERE" + EVENTO;

const DATA = (col) =>"DATE_FORMAT(" + col + ", '%Y-%m-%d %H:%i')";

/* ── as sete tabelas ─────────────────────────────────────────────────
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
        " LEFT JOIN shop_stocks ss ON ss.id = a.shop_stock_id" +
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
      /* placa, chassi e laudo saíram em 2026-09-28 (Thomas: "oculte todas as
         placas e chassis"; laudo saiu da tabela). Saem da CONSULTA, não só da
         tela: dado que não vem não vaza. */
      ['marca', 'b.name'],
      ['modelo', 'm.name'],
      ['versao', 'ver.name'],
      ['ano_fab', 'v.manufacture_year'],
      ['ano_mod', 'v.model_year'],
      ['km', 'NULLIF(v.km, 0)'],
      /* o pátio onde o carro está: 100% preenchido nos eventos do C6
         (medido em 2026-09-28). O nome, não o id — dois ids têm o mesmo nome
         ("HUB Varzea Grande/MT") e o painel agrupa pelo nome */
      ['patio', 'ss.name'],
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
       canal cadastradas desde o início do evento mais antigo da janela MAIS
       as do grupo das novas cadastradas desde a data das novas (02/10). O
       UNION deduplica. "grupo" = 1 quando algum usuário da loja está no
       grupo de cliente das novas.
       O CNPJ é a chave do cruzamento com a planilha de representantes
       comerciais (Montar Painel). Ele NÃO vai para o HTML — é chave, não
       dado de tela, e a prova confere. O key account saiu em 2026-09-24:
       o responsável da loja passou a ser o representante da planilha. */
    nome: 'lojas',
    de: " FROM (SELECT o.buyer_shop_id AS id" + OFERTAS_DO_RECORTE +
        " AND o.buyer_shop_id IS NOT NULL" +
        " UNION SELECT al.shop_id AS id" + ACESSOS_DO_EVENTO +
        " UNION SELECT s2.id AS id FROM shops s2" +
        " WHERE s2.whitelabel_id = " + WL_C6 + " AND s2.deleted_at IS NULL" +
        " AND s2.created_at >= (SELECT MIN(e.start_date_offer) FROM events e WHERE" + EVENTO + ")" +
        " UNION SELECT us3.shop_id AS id FROM user_shops us3" +
        " INNER JOIN user_clients_group ucg3 ON ucg3.user_id = us3.user_id AND ucg3.client_group_id = " + GRUPO_NOVAS +
        " INNER JOIN shops s3 ON s3.id = us3.shop_id AND s3.deleted_at IS NULL" +
        " AND s3.created_at >= '" + NOVAS_DESDE + "') ids" +
        " INNER JOIN shops s ON s.id = ids.id",
    cols: [
      ['id', 's.id'],
      ['nome', 's.name'],
      ['wl', 's.whitelabel_id'],
      ['situacao', 's.situation'],
      ['cadastro', DATA('s.created_at')],
      ['apagada', 's.deleted_at IS NOT NULL'],
      ['grupo', "EXISTS (SELECT 1 FROM user_shops us INNER JOIN user_clients_group ucg ON ucg.user_id = us.user_id" +
        " AND ucg.client_group_id = " + GRUPO_NOVAS + " WHERE us.shop_id = s.id)"],
      ['cnpj', 's.cnpj']
    ]
  },
  /* ── os acessos (2026-09-28/29) ───────────────────────────────────────
     Vêm de access_logs, que grava em hora de Brasília como as ofertas. O
     bruto da janela são ~35 mil linhas: não passa pelo MCP, então cada
     pacote chega RESUMIDO — mas no grão mais fino que o painel precisa, e o
     corte por evento e pelos filtros é feito na página. Medido em
     context/banco-de-dados/projetos/c6/indicadores.md.

     Regra do Thomas (28/09): acesso só conta DENTRO do período do filtro —
     do menor início ao maior fim dos eventos escolhidos. Aqui entra o
     período do recorte inteiro; a página corta o do evento. */
  {
    /* quem abriu cada anúncio, por evento, com a máscara dos DIAS do evento
       em que abriu (bit k = k dias depois do dia de início). A máscara é o
       que deixa o filtro de Data cortar o acesso a anúncio. Todo acesso a
       anúncio traz o event_id (0 sem, em 14.619 — medido em 28/09), e o
       corte é pelo horário do PRÓPRIO evento, no minuto. Uma linha por
       (evento, anúncio, loja): o score conta lojas, não cliques — um anúncio
       teve 575 acessos de uma loja só. Join por igualdade no event_id; por
       faixa de data ele passou de 5 min. */
    nome: 'acessos_anuncio',
    de: " FROM (SELECT e.id AS ev, al.advertisement_id AS anuncio, al.shop_id AS loja," +
        " BIT_OR(1 << DATEDIFF(al.created_at, e.start_date_offer)) AS dias" +
        " FROM events e INNER JOIN access_logs al ON al.event_id = e.id" +
        " AND al.whitelabel_id = " + WL_C6 + " AND al.advertisement_id IS NOT NULL AND al.shop_id IS NOT NULL" +
        " AND al.created_at >= e.start_date_offer AND al.created_at <= e.finish_date_event" +
        " WHERE" + EVENTO + " GROUP BY e.id, al.advertisement_id, al.shop_id) x",
    cols: [
      ['evento', 'x.ev'],
      ['anuncio', 'x.anuncio'],
      ['loja', 'x.loja'],
      ['dias', 'x.dias']
    ]
  }
];

/* ── acessos ao evento: loja × dia × hora, em PARTES ─────────────────────
   O filtro de Representante (29/09) precisa saber de QUEM é cada acesso
   por hora, então o pacote é loja × dia × hora com a contagem. Inteiro ele
   passa de 200 KB; em duas partes (resto da divisão do id da loja) cada uma
   fica abaixo dos 130 KB que o MCP já provou passar — 119 e 91 KB em 29/09.
   Se a janela crescer e uma parte engordar, é subir PARTES_ACESSO: o Montar
   Painel junta quantas vierem e confere pelo meta. */
const PARTES_ACESSO = 2;
for (let p = 0; p < PARTES_ACESSO; p++) {
  TABELAS.push({
    nome: 'acessos_p' + p,
    de: " FROM (SELECT al.shop_id AS loja, DATE_FORMAT(al.created_at, '%y%m%d') AS dia," +
        " HOUR(al.created_at) AS hora, COUNT(*) AS n" + ACESSOS_DO_EVENTO +
        " AND MOD(al.shop_id, " + PARTES_ACESSO + ") = " + p +
        " GROUP BY al.shop_id, DATE_FORMAT(al.created_at, '%y%m%d'), HOUR(al.created_at)) x",
    cols: [
      ['loja', 'x.loja'],
      ['dia', 'x.dia'],
      ['hora', 'x.hora'],
      ['n', 'x.n']
    ]
  });
}

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
      meta: {
        wl: WL_C6, piso: PISO, agora_br: AGORA_BR, partes_acesso: PARTES_ACESSO,
        novas: { desde: NOVAS_DESDE, grupo: GRUPO_NOVAS, grupo_nome: GRUPO_NOVAS_NOME }
      }
    }
  };
});

return itens;
