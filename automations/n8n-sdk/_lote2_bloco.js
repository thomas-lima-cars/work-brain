
/* ══════════════════════════════════════════════════════════════════
   [lote 2] baseWl() — a base de clientes carregando o whitelabel.
   Mesmo filtro de BASEF, verbatim. O INNER JOIN (e nao WHERE) e o ponto:
   quem esta em N whitelabels precisa aparecer N vezes aqui, uma vez em
   cada recorte. O total da plataforma NUNCA sai daqui — sai da query
   global correspondente, que nao tem o join. Somar os WLs pra chegar no
   total daria numero inflado, e e o erro que o EXISTS do BASE evita.
   `ano` null monta a base inteira; com ano, fatia por ano de cadastro
   dentro da subquery (padrao do lote 1f, coluna indexada).
   ══════════════════════════════════════════════════════════════════ */
function baseWl(ano) {
  return "SELECT u.id as user_id, uw.whitelabel_id as wl" +
    " FROM users u INNER JOIN user_whitelabels uw ON uw.user_id = u.id" +
    " WHERE " + BASEF +
    (ano ? " AND u.created_at >= '" + ano + "-01-01' AND u.created_at < '" + (ano + 1) + "-01-01'" : "");
}
const BWL = "(" + baseWl(null) + ") bw";

/* ─── [lote 2] RECENCIA POR WL ────────────────────────────────────────
   Original: agrupa por faixa. Aqui agrupa por (wl, user) pra achar o
   ultimo evento de cada cliente dentro de cada whitelabel, e so entao
   conta por faixa. O CASE de faixa e verbatim do original.
   58 WL x 4 faixas x 3 tipos = teto de 696 linhas. */
const FAIXA = "CASE WHEN DATEDIFF(NOW(), ul) BETWEEN 0 AND 30 THEN '00-30d' WHEN DATEDIFF(NOW(), ul) BETWEEN 31 AND 90 THEN '31-90d' WHEN DATEDIFF(NOW(), ul) BETWEEN 91 AND 180 THEN '91-180d' ELSE '180d+' END";
pushPaged('recencia_wl',
  "SELECT 'login' as tipo, wl, faixa, COUNT(*) as qtd FROM (SELECT bw.wl as wl, " + FAIXA + " as faixa FROM (SELECT ua.user_id as uid, MAX(ua.created_at) as ul FROM user_access ua GROUP BY ua.user_id) t INNER JOIN " + BWL + " ON bw.user_id = t.uid) rl GROUP BY wl, faixa " +
  "UNION ALL " +
  "SELECT 'oferta' as tipo, wl, faixa, COUNT(*) as qtd FROM (SELECT bw.wl as wl, " + FAIXA + " as faixa FROM (SELECT o.buyer_user_id as uid, MAX(o.created_at) as ul FROM offers o WHERE o.deleted_at IS NULL GROUP BY o.buyer_user_id) t INNER JOIN " + BWL + " ON bw.user_id = t.uid) ro GROUP BY wl, faixa " +
  "UNION ALL " +
  "SELECT 'compra' as tipo, wl, faixa, COUNT(*) as qtd FROM (SELECT bw.wl as wl, " + FAIXA + " as faixa FROM (SELECT o.buyer_user_id as uid, MAX(an.finish_date_offer) as ul FROM advertisement_negotiations an INNER JOIN offers o ON o.id=an.offer_actual_id INNER JOIN advertisements a ON a.id=an.advertisement_id WHERE an.status IN (2,3,7) GROUP BY o.buyer_user_id) t INNER JOIN " + BWL + " ON bw.user_id = t.uid) rc GROUP BY wl, faixa " +
  "ORDER BY tipo, wl, faixa",
  16);

/* ─── [lote 2] EVOLUCAO POR WL ────────────────────────────────────────
   Transformacao mecanica das evol_* globais: o
   `X.user_id IN (SELECT user_id FROM (BASE) bb)` vira INNER JOIN em
   baseWl(), e `bw.wl` entra no SELECT e no GROUP BY. Janela de data
   verbatim. 58 WL x 12 meses = teto de 696 linhas.
   NAO fatiam por ano de cadastro: partem da tabela de evento, que ja e
   seletiva pela janela de 12 meses — fatiar multiplicaria chamada sem
   tirar custo. Se estourar deadline, fatiar e o proximo passo. */
pushPaged('evol_login_wl',
  "SELECT bw.wl as wl, DATE_FORMAT(ua.created_at,'%Y-%m') as mes, COUNT(DISTINCT ua.user_id) as unicos FROM user_access ua INNER JOIN " + BWL + " ON bw.user_id = ua.user_id WHERE ua.created_at >= '" + MES_INICIO + "-01' GROUP BY wl, mes ORDER BY wl, mes",
  20);

pushPaged('evol_oferta_wl',
  "SELECT bw.wl as wl, DATE_FORMAT(o.created_at,'%Y-%m') as mes, COUNT(DISTINCT o.buyer_user_id) as unicos FROM offers o INNER JOIN " + BWL + " ON bw.user_id = o.buyer_user_id WHERE o.deleted_at IS NULL AND o.created_at >= '" + MES_INICIO + "-01' AND o.created_at < '" + MES_FIM_EXCLUSIVO + "-01' GROUP BY wl, mes ORDER BY wl, mes",
  20);

pushPaged('evol_compra_wl',
  "SELECT bw.wl as wl, DATE_FORMAT(an.finish_date_offer,'%Y-%m') as mes, COUNT(DISTINCT o.buyer_user_id) as unicos, SUM(o.price) as volume FROM advertisement_negotiations an INNER JOIN offers o ON o.id=an.offer_actual_id INNER JOIN advertisements a ON a.id=an.advertisement_id INNER JOIN " + BWL + " ON bw.user_id = o.buyer_user_id WHERE an.status IN (2,3,7) AND an.finish_date_offer >= '" + MES_INICIO + "-01' AND an.finish_date_offer < '" + MES_FIM_EXCLUSIVO + "-01' GROUP BY wl, mes ORDER BY wl, mes",
  20);

pushPaged('evol_cadastro_dia_wl',
  "SELECT bw.wl as wl, DATE(u.created_at) as dia, COUNT(*) as novos FROM users u INNER JOIN " + BWL + " ON bw.user_id = u.id WHERE u.created_at >= '" + HOJE_MENOS_29D + "' AND u.created_at < '" + AMANHA + "' GROUP BY wl, dia ORDER BY wl, dia",
  40);

/* ─── [lote 2] NOVOS vs RECORRENTES POR WL ────────────────────────────
   A subquery `f` (primeiro_mes) segue SEM filtro de data e SEM wl, de
   proposito: 'novo' e quem esta no mes da primeira ocorrencia na
   historia inteira do cliente — nao na historia dentro daquele
   whitelabel, e nao no comeco da janela. Mudar isso faria o grafico
   medir o comeco da janela, que e exatamente a armadilha descrita no
   comentario original do BC-25/26/27. So `m` ganha wl. */
const NR_SEL_WL = "SELECT m.wl, m.mes, SUM(CASE WHEN m.mes = f.primeiro_mes THEN 1 ELSE 0 END) as novos, SUM(CASE WHEN m.mes > f.primeiro_mes THEN 1 ELSE 0 END) as recorrentes FROM ";
const NR_FIM_WL = " f ON f.uid = m.uid GROUP BY m.wl, m.mes ORDER BY m.wl, m.mes";

pushPaged('nr_login_wl',
  NR_SEL_WL +
  "(SELECT bw.wl as wl, ua.user_id as uid, DATE_FORMAT(ua.created_at,'%Y-%m') as mes FROM user_access ua INNER JOIN " + BWL + " ON bw.user_id = ua.user_id WHERE ua.created_at >= '" + MES_INICIO + "-01' GROUP BY bw.wl, ua.user_id, mes) m INNER JOIN " +
  "(SELECT ua.user_id as uid, DATE_FORMAT(MIN(ua.created_at),'%Y-%m') as primeiro_mes FROM user_access ua WHERE ua.user_id IN (SELECT user_id FROM (" + BASE + ") bb) GROUP BY ua.user_id)" + NR_FIM_WL,
  20);

pushPaged('nr_oferta_wl',
  NR_SEL_WL +
  "(SELECT bw.wl as wl, o.buyer_user_id as uid, DATE_FORMAT(o.created_at,'%Y-%m') as mes FROM offers o INNER JOIN " + BWL + " ON bw.user_id = o.buyer_user_id WHERE o.deleted_at IS NULL AND o.created_at >= '" + MES_INICIO + "-01' AND o.created_at < '" + MES_FIM_EXCLUSIVO + "-01' GROUP BY bw.wl, o.buyer_user_id, mes) m INNER JOIN " +
  "(SELECT o.buyer_user_id as uid, DATE_FORMAT(MIN(o.created_at),'%Y-%m') as primeiro_mes FROM offers o WHERE o.deleted_at IS NULL AND o.buyer_user_id IN (SELECT user_id FROM (" + BASE + ") bb) GROUP BY o.buyer_user_id)" + NR_FIM_WL,
  20);

pushPaged('nr_compra_wl',
  NR_SEL_WL +
  "(SELECT bw.wl as wl, o.buyer_user_id as uid, DATE_FORMAT(an.finish_date_offer,'%Y-%m') as mes FROM advertisement_negotiations an INNER JOIN offers o ON o.id=an.offer_actual_id INNER JOIN advertisements a ON a.id=an.advertisement_id INNER JOIN " + BWL + " ON bw.user_id = o.buyer_user_id WHERE an.status IN (2,3,7) AND an.finish_date_offer >= '" + MES_INICIO + "-01' AND an.finish_date_offer < '" + MES_FIM_EXCLUSIVO + "-01' GROUP BY bw.wl, o.buyer_user_id, mes) m INNER JOIN " +
  "(SELECT o.buyer_user_id as uid, DATE_FORMAT(MIN(an.finish_date_offer),'%Y-%m') as primeiro_mes FROM advertisement_negotiations an INNER JOIN offers o ON o.id=an.offer_actual_id INNER JOIN advertisements a ON a.id=an.advertisement_id WHERE an.status IN (2,3,7) AND o.buyer_user_id IN (SELECT user_id FROM (" + BASE + ") bb) GROUP BY o.buyer_user_id)" + NR_FIM_WL,
  20);

/* ─── [lote 2] UF POR WL ──────────────────────────────────────────────
   uf_cadastro: a `(BASE) b` do original vira baseWl(), que ja traz b.wl.
   O LEFT JOIN de UF, o UF_CASE e o COALESCE ficam verbatim.
   uf_compra: o `IN (BASE)` vira INNER JOIN. ~58 WL x ~28 UF = ~1,6k. */
pushPaged('uf_cadastro_wl',
  "SELECT b.wl as wl, COALESCE(ufn.uf_norm, 'Não identificada') as uf, COUNT(DISTINCT b.user_id) as qtd FROM (" + baseWl(null) + ") b LEFT JOIN (SELECT DISTINCT us.user_id, " + UF_CASE + " as uf_norm FROM user_shops us INNER JOIN shop_addresses sa ON sa.shop_id = us.shop_id AND sa.deleted_at IS NULL) ufn ON ufn.user_id = b.user_id AND ufn.uf_norm IS NOT NULL GROUP BY wl, uf ORDER BY wl, qtd DESC",
  40);

/* [correcao pos-sonda 48644/48645 — MEDIDO, nao suposto]
   Duas execucoes identicas provaram que o problema nao e carga nem janela de
   data: e a FORMA. Juntar a base-por-whitelabel direto contra a tabela de
   negociacoes estoura o deadline em qualquer variacao (com shard, sem shard,
   com a derivada de UF, sem ela). Pre-agregar primeiro passa.

   Variantes medidas, 1 pagina cada, duas vezes com o mesmo resultado:
     A  derivada de UF + shard por ano ......... timeout
     B  join direto em shops + shard ........... timeout
     C  join direto sem shard .................. timeout
     D  pre-agregado por (comprador, loja) ..... OK, 50 linhas
   O padrao D e o mesmo `PC` que a coorte usa em producao: agrega por chave
   pequena UMA vez, e so entao encosta em user_whitelabels.

   Somar as fatias e valido: `ag` tem uma linha por (comprador, loja), e o
   whitelabel multiplica essa linha sem alterar o valor agregado dentro dela. */
pushPaged('uf_compra_wl',
  "SELECT bw.wl as wl, COALESCE(" + UF_CASE + ", 'Não identificada') as uf, SUM(ag.compras) as compras, SUM(ag.volume) as volume" +
  " FROM (SELECT o.buyer_user_id as uid, o.buyer_shop_id as shop, COUNT(DISTINCT an.id) as compras, SUM(o.price) as volume" +
  " FROM advertisement_negotiations an INNER JOIN offers o ON o.id=an.offer_actual_id INNER JOIN advertisements a ON a.id=an.advertisement_id" +
  " WHERE an.status IN (2,3,7) GROUP BY o.buyer_user_id, o.buyer_shop_id) ag" +
  " INNER JOIN " + BWL + " ON bw.user_id = ag.uid" +
  " LEFT JOIN shops s2 ON s2.id = ag.shop" +
  " LEFT JOIN shop_addresses sa ON sa.shop_id = s2.id AND sa.deleted_at IS NULL" +
  " GROUP BY wl, uf ORDER BY wl, compras DESC",
  40);

/* ─── [lote 2] TOP 10 POR WL ──────────────────────────────────────────
   LIMIT 10 nao serve aqui: daria os 10 primeiros do conjunto todo, nao
   os 10 de cada whitelabel. ROW_NUMBER() OVER (PARTITION BY wl) resolve
   — exige MySQL 8. Metricas e criterio de ordenacao verbatim do
   original. 58 WL x 10 = teto de 580 linhas por ranking. */
/* [correcao pos-sonda 48571] A primeira versao agregava DEPOIS de juntar com
   user_whitelabels: cada linha de evento era multiplicada pela quantidade de
   whitelabels do comprador antes do GROUP BY. Foi essa forma que estourou o
   deadline em uf_compra_wl, e estes rankings tem a mesma forma.

   Aqui a ordem se inverte, seguindo o padrao `PC` que a coorte ja usa em
   producao: agrega por usuario UMA vez (poucos milhares de linhas), e so
   entao junta com whitelabel e ranqueia. O join com user_whitelabels passa a
   acontecer sobre o agregado, nao sobre o evento.

   Fatiar por ano nao serviria aqui: top-10 por ano nao soma pra top-10 geral
   — quem for 11o em todo ano e 5o no total sumiria. Por isso pre-agregar, e
   nao paginar por data. */
function topWl(nome, m, ordem, extraWhere) {
  const agregado =
    "SELECT " + m.uid + " as uid, " + m.sel + " FROM " + m.from2 +
    (extraWhere || "") + " GROUP BY " + m.uid;
  pushPaged(nome,
    "SELECT wl, id, full_name, " + m.campos + ", rn FROM (" +
    "SELECT bw.wl as wl, u.id as id, u.full_name as full_name, " + m.campos +
    ", ROW_NUMBER() OVER (PARTITION BY bw.wl ORDER BY " + ordem + " DESC) as rn" +
    " FROM (" + agregado + ") ag" +
    " INNER JOIN users u ON u.id = ag.uid" +
    " INNER JOIN " + BWL + " ON bw.user_id = ag.uid" +
    ") t WHERE t.rn <= 10 ORDER BY wl, rn",
    16);
}

/* `from2` = o mesmo FROM do original, SEM o join com users: o nome do cliente
   entra depois, sobre o agregado. Manter o join com advertisements preserva a
   semantica (negociacao sem anuncio nao e compra real — regra § 3). */
const M_COMPRA = {
  from2: "advertisement_negotiations an INNER JOIN offers o ON o.id=an.offer_actual_id INNER JOIN advertisements a ON a.id=an.advertisement_id",
  uid: "o.buyer_user_id",
  sel: "COUNT(DISTINCT an.id) as compras, SUM(o.price) as volume, MAX(an.finish_date_offer) as ultima_compra",
  campos: "compras, volume, ultima_compra"
};
/* ⚠️ OS 4 RANKINGS POR WHITELABEL ESTAO FORA DA FILA — decisao medida.
   As execucoes 48644 e 48645 (identicas) provaram que os quatro estouram o
   deadline mesmo depois de reescritos no padrao PC. Mante-los aqui custaria
   64 chamadas x ~15s = ~16 minutos de execucao em falha garantida.

   O gerador ja trata a ausencia: cai no ranking GLOBAL e marca a secao com
   "sem recorte por whitelabel — mostrando a plataforma". Melhor um Top 10 da
   plataforma, rotulado, do que 16 minutos gastos pra chegar em secao vazia.

   Pra reativar quando houver um desenho que passe, basta descomentar.
   O que ainda nao foi tentado: materializar o ranking a partir da coorte
   (que ja tem compradores por WL) em vez de ir a negociacao. */
const TOPS_WL_ATIVOS = false;
if (TOPS_WL_ATIVOS) {
  topWl('top_compradores_hist_wl', M_COMPRA, "ag.compras",
    " WHERE an.status IN (2,3,7)");
  topWl('top_compradores_ano_wl', M_COMPRA, "ag.compras",
    " WHERE an.status IN (2,3,7) AND an.finish_date_offer >= '" + ANO + "-01-01'");
  topWl('top_acesso_ano_wl', {
    from2: "user_access ua",
    uid: "ua.user_id",
    sel: "COUNT(DISTINCT DATE(ua.created_at)) as dias_ativos, COUNT(ua.id) as acessos_totais",
    campos: "dias_ativos, acessos_totais"
  }, "ag.dias_ativos", " WHERE ua.created_at >= '" + ANO + "-01-01'");
  topWl('top_ofertas_ano_wl', {
    from2: "offers o",
    uid: "o.buyer_user_id",
    sel: "COUNT(*) as ofertas",
    campos: "ofertas"
  }, "ag.ofertas", " WHERE o.deleted_at IS NULL AND o.created_at >= '" + ANO + "-01-01'");
}


/* ─── [lote 2b] ATIVACAO POR SAFRA — quanto tempo ate a primeira acao ──
   Pedido de 04/09: por mes de cadastro, quantos logaram / ofertaram /
   compraram DENTRO de 30, 60, 90 e 180 dias do proprio cadastro.

   E dado novo: nenhuma query existente sabe "tempo ate a primeira acao".
   A coorte so sabe SE o cliente ja logou algum dia, nao QUANDO.

   Forma: o padrao PC, o unico que passou no deadline hoje. Cada "primeira
   ocorrencia" e agregada UMA vez sobre a tabela de evento inteira (poucos
   milhares de linhas) e so entao encostada na base por LEFT JOIN. Correlacionar
   um MIN() por usuario dentro do SELECT seria a forma que estourou em todas as
   variantes medidas nas execucoes 48644/48645.

   As faixas sao CUMULATIVAS: quem logou em 12 dias conta em 30, 60, 90 e 180.
   E o que "dentro de N dias" quer dizer.

   DATEDIFF negativo (primeira acao ANTES do cadastro) existe no dado e conta
   como "dentro de 30" — o cliente agiu, e a anomalia esta na data de cadastro,
   nao no comportamento. Sao poucos; o campo `anomalos` conta quantos, pra nao
   ficar escondido.

   ⚠️ MATURIDADE: uma safra de mes passado nao teve 180 dias pra acontecer. O
   HTML tem de marcar a celula como imatura em vez de mostrar 0% como se fosse
   resultado. O calculo disso e no cliente, que sabe a data de hoje. */
/* Preenchido pelo gera_lote2.py junto com o resto do recorte de whitelabel,
   pra a lista de ids ter UMA fonte so no arquivo inteiro. */
const FILTRO_WL_JOIN = "";

const PRIMEIRO_LOGIN = "SELECT ua.user_id uid, MIN(ua.created_at) p FROM user_access ua GROUP BY ua.user_id";
const PRIMEIRA_OFERTA = "SELECT o.buyer_user_id uid, MIN(o.created_at) p FROM offers o WHERE o.deleted_at IS NULL GROUP BY o.buyer_user_id";
const PRIMEIRA_COMPRA = "SELECT o.buyer_user_id uid, MIN(an.finish_date_offer) p FROM advertisement_negotiations an INNER JOIN offers o ON o.id=an.offer_actual_id INNER JOIN advertisements a ON a.id=an.advertisement_id WHERE an.status IN (2,3,7) GROUP BY o.buyer_user_id";

function faixasAtivacao(alias) {
  return [30, 60, 90, 180].map(function (d) {
    return "SUM(" + alias + ".p IS NOT NULL AND DATEDIFF(" + alias + ".p, b.cad) <= " + d + ")";
  });
}
const ATIV_METRICS =
  "COUNT(*) total, " +
  faixasAtivacao('fl').map(function (e, i) { return e + " lg" + [30,60,90,180][i]; }).join(', ') + ", " +
  faixasAtivacao('fo').map(function (e, i) { return e + " of" + [30,60,90,180][i]; }).join(', ') + ", " +
  faixasAtivacao('fc').map(function (e, i) { return e + " cp" + [30,60,90,180][i]; }).join(', ') + ", " +
  "SUM(fl.p IS NOT NULL AND DATEDIFF(fl.p, b.cad) < 0) anomalos";

const ATIV_JOINS =
  " LEFT JOIN (" + PRIMEIRO_LOGIN + ") fl ON fl.uid = b.uid" +
  " LEFT JOIN (" + PRIMEIRA_OFERTA + ") fo ON fo.uid = b.uid" +
  " LEFT JOIN (" + PRIMEIRA_COMPRA + ") fc ON fc.uid = b.uid";

/* base enxuta: so id, safra e data de cadastro — nao precisa dos EXISTS do BEXT */
const BASE_CAD = "SELECT u.id uid, DATE_FORMAT(u.created_at,'%Y-%m') ym, u.created_at cad" +
  " FROM users u WHERE " + BASEF;

pushPaged('ativacao',
  "SELECT b.ym, " + ATIV_METRICS +
  " FROM (" + BASE_CAD + ") b" + ATIV_JOINS +
  " GROUP BY b.ym ORDER BY b.ym",
  3);

/* Por whitelabel: mesma coisa com o join de user_whitelabels sobre a base.
   6 WL x ~78 safras = teto de 468 linhas. */
pushPaged('ativacao_wl',
  "SELECT uw.whitelabel_id wl, b.ym, " + ATIV_METRICS +
  " FROM (" + BASE_CAD + ") b" +
  " INNER JOIN user_whitelabels uw ON uw.user_id = b.uid" + FILTRO_WL_JOIN +
  ATIV_JOINS +
  " GROUP BY uw.whitelabel_id, b.ym ORDER BY uw.whitelabel_id, b.ym",
  12);

/* ─── [lote 2] MAPA COMPRADOR -> WHITELABEL (Raio-X) ──────────────────
   O que faz as duas abas do Raio-X filtrarem sem tocar nas 7 queries
   rx_*, que ja somam 855 chamadas ao MCP. Elas vem indexadas por
   buyer_user_id; com este mapa o cliente recorta os arrays existentes.
   O conjunto de compradores e o MESMO subquery do rx_buyers, verbatim,
   pra nao existir comprador no Raio-X sem entrada no mapa. */
pushPaged('rx_buyer_wl',
  "SELECT uw.user_id, uw.whitelabel_id as wl FROM user_whitelabels uw WHERE uw.user_id IN (SELECT DISTINCT o.buyer_user_id FROM advertisement_negotiations an INNER JOIN offers o ON o.id = an.offer_actual_id WHERE an.status IN (2,3,7) AND o.buyer_user_id IN (SELECT user_id FROM (" + BASE + ") bb) AND an.finish_date_offer >= '" + MES_INICIO_RX + "-01' AND an.finish_date_offer < '" + MES_FIM_EXCLUSIVO + "-01') ORDER BY uw.user_id, uw.whitelabel_id",
  60);

