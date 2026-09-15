# -*- coding: utf-8 -*-
"""Os cinco campos novos do perfil de loja, pedidos em 2026-09-11.

  1. % desagio contra a FIPE          -> entra na q_perfil, de graca
  2. % de ofertas na mesma UF da loja -> q_uf_laudo
  3. % de ofertas por status de laudo -> q_uf_laudo (mesma varredura)
  4. contato (e-mail e telefones)     -> q_contato
  5. cluster de recencia              -> q_cluster (datas cruas; a regra e JS)

CUSTO. Cada consulta por loja custa PAG_LOJAS = ceil(lojas/50) = 26 chamadas.
Cinco consultas novas seriam +130, quase dobrando o lado das lojas. Por isso
duas fusoes:

  - o desagio entra na `q_perfil`, que JA varre a ULTIMAS (ultima oferta por
    loja+veiculo) -- exatamente a linha que o desagio precisa. Custo: zero
    chamada nova.
  - UF e laudo compartilham a mesma varredura de offers+advertisements, entao
    viram UMA consulta com colunas pivotadas em vez de duas.

Sobram 3 consultas novas = 78 chamadas.

DECISOES DO THOMAS (2026-09-11), todas medidas antes nas sondas 50346/50347:

  - FIPE vem de `advertisements.fipe_price` (85,6% preenchida) e nao de
    `vehicles.fipe_price` (63,8%). Nao existe tabela de preco FIPE por codigo.
  - desagio da ULTIMA oferta (a "maior" difere em so 3,2% dos pares).
  - corte de outlier -100% a +95%: o dado cru vai de -1.586% a +94%, e uma
    media simples por loja e destruida por um caso desses.
  - e-mail vem de `users` via `user_shops` (99,5%) e nao de `shops` (5,8%).
    Desempate por MENOR user_id, porque `user_shops.function` esta nulo em
    77% dos vinculos e nao serve para dizer quem e o contato.
  - `privative_number` entra, a pedido explicito.
  - cluster com "ofertou" no lugar de "comprou".

ARMADILHA PAGA AQUI: a juncao nova da q_perfil e LEFT JOIN, nao INNER. Com
INNER, uma oferta cujo anuncio foi apagado sumiria da conta -- e qt_veiculos,
preco_medio, idade e km, que ja existem e ja foram conferidos, mudariam de
valor em silencio. Acrescentar coluna nao pode mexer nas antigas.

    python _perfil_cinco_campos.py
"""
import io
import os
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

AQUI = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(AQUI, "montar-fase2.js")
s = io.open(P, encoding="utf-8").read()
orig = s


def troca(velho, novo, rot):
    global s
    if s.count(velho) != 1:
        raise SystemExit("ANCORA AMBIGUA OU AUSENTE (%d): %s" % (s.count(velho), rot))
    s = s.replace(velho, novo, 1)
    print("  ok  " + rot)


# ── 1. constantes do desagio, logo depois do IDADE ───────────────────────
troca(
"""const IDADE = "(YEAR(CURDATE()) - NULLIF(v.model_year, 0))";""",
"""const IDADE = "(YEAR(CURDATE()) - NULLIF(v.model_year, 0))";

/* ── desagio contra a FIPE ────────────────────────────────────────────────
   A FIPE sai de `advertisements.fipe_price`, medida na sonda 50346 em 85,6%
   das ofertas contra 63,8% de `vehicles.fipe_price`. Nao existe tabela de
   preco FIPE por codigo: `versions.code_fipe` guarda so o codigo, e o valor
   vive denormalizado nessas duas colunas, que divergem entre si em 633
   ofertas.

   O corte de outlier NAO e conservadorismo: o desagio cru medido vai de
   -1.586% a +94%, ou seja existe oferta 16 vezes acima da FIPE registrada.
   Uma media por loja e destruida por um unico caso desses. O corte e
   declarado aqui e aparece no glossario -- numero descartado em silencio e
   pior que numero errado. */
const DESAGIO_MIN = -100;
const DESAGIO_MAX = 95;
const DESAGIO = "(100 * (1 - ult.price / aq.fipe_price))";
const DESAGIO_OK = "aq.fipe_price > 0 AND " + DESAGIO +
  " BETWEEN " + DESAGIO_MIN + " AND " + DESAGIO_MAX;""",
    "constantes do desagio")

# ── 2. q_perfil ganha o desagio, com LEFT JOIN ───────────────────────────
troca(
"""  " ROUND(AVG(NULLIF(v.km, 0)), 0) AS km_medio," +
  " ROUND(STDDEV_SAMP(NULLIF(v.km, 0)), 0) AS km_desvio" +
  " FROM " + ULTIMAS +
  " INNER JOIN offers ult ON ult.id = u.offer_id" +
  " INNER JOIN vehicles v ON v.id = u.vehicle_id AND v.deleted_at IS NULL" +
  " GROUP BY u.shop_id ORDER BY u.shop_id", PAG_LOJAS);""",
"""  " ROUND(AVG(NULLIF(v.km, 0)), 0) AS km_medio," +
  " ROUND(STDDEV_SAMP(NULLIF(v.km, 0)), 0) AS km_desvio," +
  /* o desagio pega carona: a ULTIMA oferta de cada (loja, veiculo) ja e a
     linha que ele precisa, entao nao custa chamada nenhuma. */
  " COUNT(CASE WHEN " + DESAGIO_OK + " THEN 1 END) AS desagio_n," +
  " ROUND(AVG(CASE WHEN " + DESAGIO_OK + " THEN " + DESAGIO + " END), 2) AS desagio_medio," +
  " COUNT(CASE WHEN aq.fipe_price > 0 THEN 1 END) AS com_fipe" +
  " FROM " + ULTIMAS +
  " INNER JOIN offers ult ON ult.id = u.offer_id" +
  " INNER JOIN vehicles v ON v.id = u.vehicle_id AND v.deleted_at IS NULL" +
  /* LEFT, nunca INNER: com INNER, oferta cujo anuncio foi apagado sairia da
     conta e qt_veiculos/preco/idade/km -- que ja existem e ja foram
     conferidos -- mudariam de valor em silencio. Coluna nova nao pode mexer
     nas antigas. */
  " LEFT JOIN advertisements aq ON aq.id = ult.advertisement_id AND aq.deleted_at IS NULL" +
  " GROUP BY u.shop_id ORDER BY u.shop_id", PAG_LOJAS);""",
    "q_perfil ganha desagio_n, desagio_medio e com_fipe")

# ── 3. as tres consultas novas, antes da moda ────────────────────────────
troca(
"""function moda(nome, campo, tabela) {""",
"""/* ── UF e laudo cautelar, numa varredura so ───────────────────────────────
   As duas perguntas ("% de ofertas na mesma UF" e "% por status de laudo")
   leem exatamente as mesmas linhas: offers + advertisements da janela. Duas
   consultas custariam 52 chamadas; esta custa 26.

   A UF da loja entra por TABELA DERIVADA, nao por junção direta em
   `shop_addresses`: loja com dois enderecos duplicaria cada oferta dela e
   inflaria a contagem. Agregar antes garante uma linha por loja. (Medido:
   nenhuma loja da base tem mais de um endereco hoje -- isto e guarda contra
   o dia em que tiver.)

   O laudo vem PIVOTADO em colunas em vez de uma linha por (loja, status):
   uma linha por loja mantem a paginacao em PAG_LOJAS e dimensionada. Foi a
   licao do run 50327, em que a moda devolvia uma linha por empate e bateu no
   teto sem ninguem ver.

   🚨 `laudo_nao_informado` NAO e o mesmo que `laudo_ausente`. O primeiro e
   laudo que existe e nao diz o resultado (78% dos laudos do banco); o
   segundo e veiculo sem laudo nenhum. Somar os dois apaga a diferenca. */
const UF_LOJA_AG =
  "(SELECT sa2.shop_id AS shop_id, MAX(sa2.state) AS state" +
  " FROM shop_addresses sa2 WHERE sa2.deleted_at IS NULL" +
  " GROUP BY sa2.shop_id) lu";

push('q_uf_laudo',
  "SELECT o." + LADO + " AS shop_id, COUNT(*) AS ofertas_base," +
  " SUM(CASE WHEN TRIM(COALESCE(ss.state, '')) <> ''" +
  " AND UPPER(TRIM(ss.state)) = UPPER(TRIM(lu.state)) THEN 1 ELSE 0 END) AS ofertas_mesma_uf," +
  " SUM(CASE WHEN vpr.id IS NULL THEN 1 ELSE 0 END) AS laudo_ausente," +
  " SUM(CASE WHEN vpr.situation = 'aprovado' THEN 1 ELSE 0 END) AS laudo_aprovado," +
  " SUM(CASE WHEN vpr.situation = 'aprovado_com_apontamento' THEN 1 ELSE 0 END) AS laudo_apontamento," +
  " SUM(CASE WHEN vpr.situation = 'reprovado' THEN 1 ELSE 0 END) AS laudo_reprovado," +
  " SUM(CASE WHEN vpr.situation = 'nao_informado' THEN 1 ELSE 0 END) AS laudo_nao_informado," +
  " SUM(CASE WHEN vpr.id IS NOT NULL AND TRIM(COALESCE(vpr.situation, '')) = ''" +
  " THEN 1 ELSE 0 END) AS laudo_vazio" +
  " FROM offers o" + JOIN_LOJA_CANAL +
  " INNER JOIN advertisements a ON a.id = o.advertisement_id AND a.deleted_at IS NULL" +
  " LEFT JOIN vehicles v ON v.id = a.vehicle_id" +
  " LEFT JOIN shop_stocks ss ON ss.id = COALESCE(a.shop_stock_id, v.shop_stock_id)" +
  " LEFT JOIN " + UF_LOJA_AG + " ON lu.shop_id = o." + LADO +
  " LEFT JOIN vehicle_precautionary_reports vpr" +
  " ON vpr.vehicle_id = a.vehicle_id AND vpr.deleted_at IS NULL" +
  " WHERE" + JANELA +
  " GROUP BY o." + LADO + " ORDER BY o." + LADO, PAG_LOJAS);

/* ── contato ──────────────────────────────────────────────────────────────
   Telefone sai de `shops` (comercial 79,3%, whatsapp 79,0%, privativo 8,9%).
   O privativo entra a pedido explicito do Thomas em 11/09.

   🔴 O e-mail NAO sai de `shops`: medido em 5,8% ali contra 99,5% em `users`
   via `user_shops` (sonda 50347). Quando a loja tem mais de um usuario com
   e-mail -- 1,19 por loja na media -- o desempate e o MENOR user_id, pelo
   mesmo motivo que a moda usa MIN(item_id): e deterministico entre runs.
   `user_shops.function` nao serve de criterio, esta nulo em 77% dos
   vinculos.

   🚨 ISTO E PII. O relatorio passa a carregar e-mail e telefone de loja real,
   e ele sobe pro SharePoint. `qt_emails` viaja junto para a tela poder dizer
   "1 de N" em vez de fingir que a loja tem um contato so. */
const EMAIL_AG =
  "(SELECT us.shop_id AS shop_id, MIN(us.user_id) AS user_id," +
  " COUNT(DISTINCT us.user_id) AS qt" +
  " FROM user_shops us" +
  " INNER JOIN users u ON u.id = us.user_id AND u.deleted_at IS NULL" +
  " WHERE TRIM(COALESCE(u.email, '')) <> ''" +
  " GROUP BY us.shop_id) ue";

push('q_contato',
  "SELECT s.id AS shop_id," +
  " MAX(s.comercial_number) AS tel_comercial," +
  " MAX(s.whatsapp_number) AS whatsapp," +
  " MAX(s.privative_number) AS tel_privativo," +
  " MAX(uu.email) AS email," +
  " MAX(ue.qt) AS qt_emails" +
  " FROM shops s" +
  " LEFT JOIN " + EMAIL_AG + " ON ue.shop_id = s.id" +
  " LEFT JOIN users uu ON uu.id = ue.user_id" +
  " WHERE s.deleted_at IS NULL" + SO_WL_LOJA +
  " AND EXISTS (SELECT 1 FROM offers o WHERE o." + LADO + " = s.id" +
  " AND o.deleted_at IS NULL AND o.created_at >= '" + DATA_INI + "' AND o.price > 0)" +
  " GROUP BY s.id ORDER BY s.id", PAG_LOJAS);

/* ── as duas datas do cluster ─────────────────────────────────────────────
   So as DATAS CRUAS vem do banco; a regra das sete faixas e calculada no
   Montar HTML. Assim ela e testavel pelo prova-local.js sem tocar no banco,
   e mudar uma faixa nao exige rodar o workflow inteiro.

   `ult_oferta` NAO leva filtro de janela: a pergunta e "ja ofertou alguma
   vez", e `offers` alcanca 2020-06-24 (sonda 50347). `ult_acesso` sai de
   `access_logs`, que so comeca em 2025-08-31 -- por isso "nunca acessou" e,
   na verdade, "nao acessou nos ultimos 12 meses". A tela tem que dizer isso.

   🚨 Na base deste relatorio o cluster e DEGENERADO: 98,8% cai em Diamante
   ou Ouro, porque a base *e* "lojas que ofertaram nos ultimos 6 meses" e
   nenhuma delas pode ser "nunca ofertou". Medido na sonda 50347. Entra assim
   mesmo por decisao do Thomas; os sete so existem sobre o universo inteiro
   de lojas. */
push('q_cluster',
  "SELECT s.id AS shop_id," +
  " (SELECT MAX(o2.created_at) FROM offers o2 WHERE o2." + LADO + " = s.id" +
  " AND o2.deleted_at IS NULL AND o2.price > 0) AS ult_oferta," +
  " (SELECT MAX(al.created_at) FROM access_logs al WHERE al.shop_id = s.id) AS ult_acesso" +
  " FROM shops s" +
  " WHERE s.deleted_at IS NULL" + SO_WL_LOJA +
  " AND EXISTS (SELECT 1 FROM offers o WHERE o." + LADO + " = s.id" +
  " AND o.deleted_at IS NULL AND o.created_at >= '" + DATA_INI + "' AND o.price > 0)" +
  " ORDER BY s.id", PAG_LOJAS);

function moda(nome, campo, tabela) {""",
    "q_uf_laudo, q_contato e q_cluster")

# ── 4. META carrega o corte do desagio ───────────────────────────────────
troca(
"""  meses_historico: META_IN.meses_historico,""",
"""  meses_historico: META_IN.meses_historico,
  /* o corte de outlier viaja pro glossario: numero descartado em silencio e
     pior que numero errado */
  desagio_min: DESAGIO_MIN,
  desagio_max: DESAGIO_MAX,""",
    "META leva o corte do desagio")

tmp = P + ".tmp"
with io.open(tmp, "w", encoding="utf-8") as f:
    f.write(s)
os.replace(tmp, P)

print("montar-fase2.js: %d -> %d chars" % (len(orig), len(s)))
