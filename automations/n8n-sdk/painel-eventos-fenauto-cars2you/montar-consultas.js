/* ══════════════════════════════════════════════════════════════════════
   NÓ "Montar Consultas" — Mega Evento Fenauto (Cars2You)

   Nasceu em 03/11 como cópia do nó do Eventos Fenauto C6, com o recorte
   trocado. Monta as consultas do painel. Cada uma devolve UMA linha só:

       SELECT COUNT(*) AS total, JSON_ARRAYAGG(JSON_ARRAY(...)) AS linhas

   A tabela inteira viaja empacotada num JSON, então o teto de 50 linhas
   do MCP não corta nada e não existe paginação. O "total" sai da MESMA
   varredura do array: se o pacote chegar menor, o Montar Painel para o run.

   ─── O RECORTE (Thomas, 2026-11-03) ──────────────────────────────────
   Os eventos do C6 E do IGA abertos em algum momento da SEMANA corrente,
   de segunda 00:00 a domingo 23:59 em hora de Brasília: começam antes da
   segunda seguinte e terminam a partir da segunda. A semana anda sozinha.
     C6   evento que alveja o whitelabel 43 (Canal de vendas C6 Auto) — o
          critério do Painel de Eventos C6.
     IGA  evento com veículo dos vendedores 594 (Itaú Unibanco), 598
          (Repasse Itaú) ou 16036 (IGA Participações) — o critério do
          Estudo de Vendas IGA (projetos/vendas-iga/indicadores.md). Os
          eventos do IGA alvejam os whitelabels 5 e 7, então o canal não
          serve para achá-los.
   Teto de duração: evento aberto há mais de 31 dias não entra. Existe por
   causa do 266 "Anúncios cancelados" (2021 a 2025, 10 mil negociações do
   IGA), um balde de anúncios, não um evento.

   ─── LOJA NOVA (Thomas, 2026-11-03) ──────────────────────────────────
   Loja com algum usuário cadastrado pela campanha da Fenauto: perfil com
   register_form_value contendo "fenauto" (user_profiles; medido em 03/11:
   só "Fenauto 2025 IGA", 227 usuários de 226 lojas, de 19 a 24/11/2025).
   A data do cadastro é a do PERFIL, não a da loja: 11 daquelas lojas já
   existiam desde 2020. A consulta de lojas traz essa data; o corte pelos
   dias do evento é do Montar Painel.

   ─── FUSO ────────────────────────────────────────────────────────────
   O banco responde NOW() em UTC, mas grava as datas de evento E de oferta
   em hora de Brasília (medido em 2026-09-24). Por isso a semana é calculada
   aqui, em hora de Brasília, e viaja como literal. Não trocar por
   NOW()/CURDATE().

   ⚠️ Este arquivo viaja pro n8n como string. Sem barra invertida e sem
   regex, de propósito — ver automations/n8n-sdk/README.md.
   ══════════════════════════════════════════════════════════════════════ */

const WL_C6 = 43;
const VENDEDORES_IGA = [594, 598, 16036];
/* loja nova (03/11): o valor do formulário de cadastro, sem caixa */
const CAMPANHA_NOVAS = 'fenauto';
const DURACAO_MAX_DIAS = 31;
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

const EH_C6 = "EXISTS (SELECT 1 FROM event_whitelabels ew WHERE ew.event_id = e.id AND ew.whitelabel_id = " + WL_C6 + ")";
const EH_IGA = "EXISTS (SELECT 1 FROM advertisement_negotiations ani" +
  " INNER JOIN advertisements ai ON ai.id = ani.advertisement_id" +
  " WHERE ani.event_id = e.id AND ani.deleted_at IS NULL AND ai.shop_id IN (" + VENDEDORES_IGA.join(',') + "))";

/* o recorte de evento, escrito uma vez só e reusado em todas as consultas.
   Cópias à mão seriam chances de uma divergir das outras. */
const EVENTO =
  " e.deleted_at IS NULL AND e.start_date_offer < '" + SEMANA_FIM + "' AND e.finish_date_event >= '" + SEMANA_INI + "'" +
  " AND DATEDIFF(e.finish_date_event, e.start_date_offer) <= " + DURACAO_MAX_DIAS +
  " AND (" + EH_C6 + " OR " + EH_IGA + ")";

/* ofertas das negociações dos eventos do recorte — base de três consultas */
const OFERTAS_DO_RECORTE =
  " FROM offers o" +
  " INNER JOIN advertisement_negotiations an ON an.id = o.advs_negotiation_id AND an.deleted_at IS NULL" +
  " INNER JOIN events e ON e.id = an.event_id AND" + EVENTO +
  " WHERE o.deleted_at IS NULL";

/* acessos de loja AO EVENTO: linha de access_logs com o event_id do evento,
   dentro do horário DELE (início da oferta ao fim), no minuto. Sem trava de
   canal (03/11): no C6 era o whitelabel 43, mas o IGA vende pelos 5 e 7, e
   o event_id já diz de que evento é o acesso. Join por igualdade no
   event_id; por faixa de data passou de 5 min. */
const ACESSOS_DO_EVENTO =
  " FROM events e INNER JOIN access_logs al ON al.event_id = e.id" +
  " AND al.shop_id IS NOT NULL" +
  " AND al.created_at >= e.start_date_offer AND al.created_at <= e.finish_date_event" +
  " WHERE" + EVENTO;

/* a data do cadastro pela campanha: o primeiro perfil da Fenauto da loja */
const CADASTRO_FENAUTO = (loja) => "(SELECT MIN(upf.created_at) FROM user_shops usf" +
  " INNER JOIN user_profiles upf ON upf.user_id = usf.user_id AND upf.deleted_at IS NULL" +
  " AND upf.register_form_value LIKE '%" + CAMPANHA_NOVAS + "%'" +
  " WHERE usf.shop_id = " + loja + ")";

const DATA = (col) =>"DATE_FORMAT(" + col + ", '%Y-%m-%d %H:%i')";

/* ── as tabelas ─────────────────────────────────────────────────
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
      /* a operação (03/11): C6 quando alveja o 43, senão IGA. Um evento que
         fosse dos dois sairia como C6 — nenhum foi, medido em 03/11 */
      ['op', "CASE WHEN " + EH_C6 + " THEN 'C6' ELSE 'IGA' END"],
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
       um evento do recorte MAIS as lojas com cadastro pela Fenauto feito
       desde o início do evento mais antigo da semana. O UNION deduplica.
       "fenauto" = a data do primeiro perfil da campanha (nulo sem ele). */
    nome: 'lojas',
    de: " FROM (SELECT o.buyer_shop_id AS id" + OFERTAS_DO_RECORTE +
        " AND o.buyer_shop_id IS NOT NULL" +
        " UNION SELECT al.shop_id AS id" + ACESSOS_DO_EVENTO +
        " UNION SELECT us3.shop_id AS id FROM user_shops us3" +
        " INNER JOIN user_profiles up3 ON up3.user_id = us3.user_id AND up3.deleted_at IS NULL" +
        " AND up3.register_form_value LIKE '%" + CAMPANHA_NOVAS + "%'" +
        " AND up3.created_at >= (SELECT MIN(e.start_date_offer) FROM events e WHERE" + EVENTO + ")) ids" +
        " INNER JOIN shops s ON s.id = ids.id",
    cols: [
      ['id', 's.id'],
      ['nome', 's.name'],
      ['wl', 's.whitelabel_id'],
      ['situacao', 's.situation'],
      ['cadastro', DATA('s.created_at')],
      ['apagada', 's.deleted_at IS NOT NULL'],
      ['fenauto', "DATE_FORMAT(" + CADASTRO_FENAUTO('s.id') + ", '%Y-%m-%d %H:%i')"]
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
        " AND al.advertisement_id IS NOT NULL AND al.shop_id IS NOT NULL" +
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

/* ── acessos ao evento: evento × loja × dia × hora, em PARTES ────────────
   Os gráficos por dia e por hora contam só as lojas do ranking, então o
   pacote precisa saber de QUEM é cada acesso: loja × dia × hora com a
   contagem. E de QUAL evento (03/11): na mesma semana correm eventos do C6
   e do IGA ao mesmo tempo, e sem o evento o filtro de um contaria os
   acessos do outro na mesma hora. Inteiro ele
   passa de 200 KB; em duas partes (resto da divisão do id da loja) cada uma
   fica abaixo dos 130 KB que o MCP já provou passar — 119 e 91 KB em 29/09.
   Se a janela crescer e uma parte engordar, é subir PARTES_ACESSO: o Montar
   Painel junta quantas vierem e confere pelo meta. */
const PARTES_ACESSO = 2;
for (let p = 0; p < PARTES_ACESSO; p++) {
  TABELAS.push({
    nome: 'acessos_p' + p,
    de: " FROM (SELECT e.id AS ev, al.shop_id AS loja, DATE_FORMAT(al.created_at, '%y%m%d') AS dia," +
        " HOUR(al.created_at) AS hora, COUNT(*) AS n" + ACESSOS_DO_EVENTO +
        " AND MOD(al.shop_id, " + PARTES_ACESSO + ") = " + p +
        " GROUP BY e.id, al.shop_id, DATE_FORMAT(al.created_at, '%y%m%d'), HOUR(al.created_at)) x",
    cols: [
      ['loja', 'x.loja'],
      ['dia', 'x.dia'],
      ['hora', 'x.hora'],
      ['n', 'x.n'],
      ['evento', 'x.ev']
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
        semana: [SEMANA_INI, SEMANA_FIM], agora_br: AGORA_BR, partes_acesso: PARTES_ACESSO,
        wl_c6: WL_C6, vendedores_iga: VENDEDORES_IGA, campanha_novas: CAMPANHA_NOVAS
      }
    }
  };
});

return itens;
