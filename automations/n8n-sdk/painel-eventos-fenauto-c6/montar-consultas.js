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

   ─── O RECORTE (Thomas, 2026-11-09) ──────────────────────────────────
   Eventos que alvejam o whitelabel 43 (Canal de vendas C6 Auto) com
   "fenauto" no NOME, abertos em algum momento da SEMANA corrente, de
   segunda 00:00 a domingo 23:59 em hora de Brasília: começam antes da
   segunda seguinte e terminam a partir da segunda. A semana anda sozinha.
   Em 09/11 (medido): 24384 "Evento Exclusivo C6 Fenauto – 13/11/26" (06 a
   13/11) e 24368 "Esquenta Fenauto C6 - 10/11/26" (09 a 10/11). Os da
   Fenauto do IGA da mesma semana (24377 a 24379) não alvejam o 43.
   Antes: só o 24052 (05/10) e fim desde 01/10/2026 (02/10).

   ─── LOJA NOVA (Thomas, 2026-11-12) ──────────────────────────────────
   "Clientes novos: quem se cadastrou a partir de 10/11 e está no grupo ...
   (ou equivalente no C6)" e "antigos sem compra que voltaram: já
   cadastrados, sem compra nos últimos 6 meses, que acessaram a partir de
   10/11" — somados num número só. Fora: compradores dos últimos 6 meses
   (aparecem só nos acessos), internos, teste e contas do banco.
   Loja cliente do C6 = algum usuário EXTERNO da loja está nos grupos 69
   ("Parceiros C6 - Geral") ou 146 ("Parceiros C6 - Exclusivo SP"), os que
   os eventos C6 da Fenauto (24368, 24384) alvejam. Usuário externo: não
   apagado, e-mail fora de @cars2you.com.br, @itau*, @c6bank* e "teste";
   loja não apagada e sem "teste" no nome. A ENTRADA da loja é:
     - o cadastro da loja, se é de INICIO_CAMPANHA em diante (nova);
     - senão, se a loja não comprou em [SEM_COMPRA_DESDE, INICIO_CAMPANHA)
       (oferta vencedora de negociação em 2, 3 ou 7, pela data da oferta),
       o primeiro access_logs dela de INICIO_CAMPANHA em diante (voltou);
     - senão nula (compradora antiga, ou antiga que não voltou).
   A janela sem compra é a de ANTES da campanha: quem voltou e comprou no
   evento continua contando. A consulta de lojas traz a entrada na coluna
   "fenauto" e a loja no universo; o corte pelo fim do evento (e pelo dia,
   com Data) é do Montar Painel.
   Custo (12/11): access_logs não tem índice por data — a volta é UMA
   passada agrupada, como derivada; subconsulta correlacionada por loja
   levou 3 min para 163 lojas. Medido em 12/11 ~15h nos grupos 69 e 146:
   7 novas + 69 que voltaram = 76; 121 compradoras fora.
   Em 11/11 (um dia): campanha do formulário "Fenauto <ano> C6"
   (user_profiles.register_form_value), que não chegou a ter perfil. Até
   10/11: grupo 146, loja cadastrada desde 01/10/2026 (02/10).

   Por WHITELABEL, a pedido. O relatório de produção trava por loja
   vendedora (104754); aqui a loja vendedora viaja como coluna e o painel
   avisa se aparecer outra.

   ─── FUSO ────────────────────────────────────────────────────────────
   O banco responde NOW() em UTC, mas grava as datas de evento E de oferta
   em hora de Brasília (medido em 2026-09-24: NOW() 17:22, última oferta
   14:22, relógio local 14:22). Por isso a semana é calculada aqui, em hora
   de Brasília, e viaja como literal. Não trocar por NOW()/CURDATE().

   ⚠️ Este arquivo viaja pro n8n como string. Sem barra invertida e sem
   regex, de propósito — ver automations/n8n-sdk/README.md.
   ══════════════════════════════════════════════════════════════════════ */

const WL_C6 = 43;
/* o recorte (09/11): só evento com isto no nome, sem caixa (a collation
   do banco não diferencia maiúscula) */
const NOME_EVENTO = 'fenauto';
/* loja nova (Thomas, 12/11): "a partir de 10/11", e sem compra nos 6
   meses ANTES disso. As datas viajam como literal, em hora de Brasília,
   como o banco grava (ver FUSO) */
const INICIO_CAMPANHA = '2026-11-10 00:00:00';
const MESES_SEM_COMPRA = 6;
/* INICIO_CAMPANHA menos os meses, mesmo dia e hora: '2026-05-10 00:00:00' */
const SEM_COMPRA_DESDE = (() => {
  let ano = Number(INICIO_CAMPANHA.slice(0, 4));
  let mes = Number(INICIO_CAMPANHA.slice(5, 7)) - MESES_SEM_COMPRA;
  while (mes < 1) { mes += 12; ano--; }
  return ano + '-' + String(mes).padStart(2, '0') + INICIO_CAMPANHA.slice(7);
})();
/* os grupos de cliente que os eventos C6 da Fenauto alvejam (Thomas, 12/11:
   "usa os 2"): 69 "Parceiros C6 - Geral", 146 "Parceiros C6 - Exclusivo SP" */
const GRUPOS_C6 = [69, 146];
const FUSO_MIN = -180;          /* America/Sao_Paulo, sem horário de verão */
const DB = 'cars2you_production';

const pad = (n) => String(n).padStart(2, '0');
const dataDe = (d) => d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
const agora = new Date(Date.now() + FUSO_MIN * 60000);
const AGORA_BR = dataDe(agora) + ' ' + pad(agora.getUTCHours()) + ':' + pad(agora.getUTCMinutes());
/* a semana de segunda a domingo que contém hoje (getUTCDay: 0 = domingo) */
const segunda = new Date(agora.getTime() - ((agora.getUTCDay() + 6) % 7) * 86400000);
const SEMANA_INI = dataDe(segunda) + ' 00:00:00';
const SEMANA_FIM = dataDe(new Date(segunda.getTime() + 7 * 86400000)) + ' 00:00:00';

/* o recorte de evento, escrito uma vez só e reusado em todas as consultas.
   Cinco cópias à mão seriam cinco chances de uma divergir das outras. */
const EVENTO =
  " e.deleted_at IS NULL AND e.start_date_offer < '" + SEMANA_FIM + "' AND e.finish_date_event >= '" + SEMANA_INI + "'" +
  " AND e.name LIKE '%" + NOME_EVENTO + "%'" +
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

/* ── os clientes da campanha (Thomas, 12/11) ─────────────────────────────
   Uma linha por loja cliente do C6 com ENTRADA (ver o cabeçalho): "id" e
   "entrada" (AAAA-MM-DD HH:MM). Quem não tem entrada nem aparece.
   VOLTA é UMA passada agrupada no access_logs (sem índice por data):
   correlacionada por loja, levou 3 min. Sem WITH e sem função de janela:
   o MCP do n8n rejeita. Roda uma vez só, dentro da consulta de lojas. */
const USUARIO_EXTERNO =
  " u.deleted_at IS NULL AND u.email NOT LIKE '%@cars2you.com.br' AND u.email NOT LIKE '%@itau%'" +
  " AND u.email NOT LIKE '%@c6bank%' AND u.email NOT LIKE '%teste%'";
const VOLTA =
  "SELECT al.shop_id, MIN(al.created_at) AS volta FROM access_logs al" +
  " WHERE al.created_at >= '" + INICIO_CAMPANHA + "' AND al.shop_id IS NOT NULL GROUP BY al.shop_id";
const COMPRAS =
  "SELECT DISTINCT o.buyer_shop_id AS shop_id FROM offers o" +
  " INNER JOIN advertisement_negotiations an ON an.offer_actual_id = o.id AND an.deleted_at IS NULL AND an.status IN (2, 3, 7)" +
  " WHERE o.deleted_at IS NULL AND o.buyer_shop_id IS NOT NULL" +
  " AND o.created_at >= '" + SEM_COMPRA_DESDE + "' AND o.created_at < '" + INICIO_CAMPANHA + "'";
const CLIENTES =
  "SELECT sc.id, " + DATA("IF(sc.created_at >= '" + INICIO_CAMPANHA + "', sc.created_at, va.volta)") + " AS entrada" +
  " FROM (SELECT DISTINCT us.shop_id FROM user_clients_group ucg" +
  " INNER JOIN users u ON u.id = ucg.user_id AND" + USUARIO_EXTERNO +
  " INNER JOIN user_shops us ON us.user_id = u.id" +
  " WHERE ucg.client_group_id IN (" + GRUPOS_C6.join(', ') + ")) cg" +
  " INNER JOIN shops sc ON sc.id = cg.shop_id AND sc.deleted_at IS NULL AND sc.name NOT LIKE '%teste%'" +
  " LEFT JOIN (" + VOLTA + ") va ON va.shop_id = sc.id" +
  " LEFT JOIN (" + COMPRAS + ") cp ON cp.shop_id = sc.id" +
  " WHERE sc.created_at >= '" + INICIO_CAMPANHA + "' OR (va.volta IS NOT NULL AND cp.shop_id IS NULL)";

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
    /* as lojas que o painel cita: quem ofertou no recorte MAIS quem acessou
       um evento do recorte MAIS as lojas do canal cadastradas desde o início
       do evento mais antigo da janela MAIS os clientes da campanha (12/11),
       que já trazem a ENTRADA junto. O universo e a coluna saem da MESMA
       derivada: CLIENTES numa subconsulta da coluna rodaria a passada no
       access_logs duas vezes. O UNION deduplica; as outras uniões levam
       entrada nula e o MAX por loja fica com a do cliente. "fenauto" = a
       entrada (nula para quem não é cliente da campanha).
       Sem CNPJ (26/10): no painel do C6 ele era a chave da carteira de
       representantes; aqui não há representante, e o que não vai para a tela
       não precisa vir do banco. */
    nome: 'lojas',
    de: " FROM (SELECT u0.id, MAX(u0.fen) AS fen FROM (" +
        "SELECT o.buyer_shop_id AS id, NULL AS fen" + OFERTAS_DO_RECORTE +
        " AND o.buyer_shop_id IS NOT NULL" +
        " UNION SELECT al.shop_id AS id, NULL AS fen" + ACESSOS_DO_EVENTO +
        " UNION SELECT s2.id AS id, NULL AS fen FROM shops s2" +
        " WHERE s2.whitelabel_id = " + WL_C6 + " AND s2.deleted_at IS NULL" +
        " AND s2.created_at >= (SELECT MIN(e.start_date_offer) FROM events e WHERE" + EVENTO + ")" +
        " UNION SELECT f.id AS id, f.entrada AS fen FROM (" + CLIENTES + ") f" +
        ") u0 GROUP BY u0.id) ids" +
        " INNER JOIN shops s ON s.id = ids.id",
    cols: [
      ['id', 's.id'],
      ['nome', 's.name'],
      ['wl', 's.whitelabel_id'],
      ['situacao', 's.situation'],
      ['cadastro', DATA('s.created_at')],
      ['apagada', 's.deleted_at IS NOT NULL'],
      /* 12/11: a entrada na campanha (cadastro novo ou volta); nula sem ela */
      ['fenauto', 'ids.fen']
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
   Os gráficos por dia e por hora contam só as lojas do ranking, então o
   pacote precisa saber de QUEM é cada acesso: loja × dia × hora com a
   contagem. Inteiro ele
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
        wl: WL_C6, semana: [SEMANA_INI, SEMANA_FIM], nome_evento: NOME_EVENTO, agora_br: AGORA_BR, partes_acesso: PARTES_ACESSO,
        inicio_campanha: INICIO_CAMPANHA, sem_compra_desde: SEM_COMPRA_DESDE,
        meses_sem_compra: MESES_SEM_COMPRA, grupos_c6: GRUPOS_C6
      }
    }
  };
});

return itens;
