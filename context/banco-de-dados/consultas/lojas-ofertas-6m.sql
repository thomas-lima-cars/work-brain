-- =============================================================================
-- Lojas com ofertas nos últimos 6 meses — perfil por UF e whitelabel
-- Escrita em 2026-09-09 contra context/banco-de-dados/schema.md
-- MySQL 8.0+ / MariaDB 10.2+ (usa window functions)
--
-- PREMISSAS (trocar aqui se estiverem erradas):
--   1. "loja que ofertou" = offers.buyer_shop_id (a loja que DEU o lance).
--      Pra ler pelo lado de quem RECEBEU, trocar por offers.seller_shop_id
--      nas duas ocorrências marcadas com [LADO].
--   2. whitelabel = shops.whitelabel_id da loja compradora. offers não tem
--      whitelabel_id próprio, então cada loja cai em exatamente um whitelabel.
--   3. UF = shop_addresses.state (VARCHAR livre — normalizo com UPPER/TRIM;
--      se a base gravar "São Paulo" em vez de "SP", precisa de um de-para).
--   4. Idade = ano atual - vehicles.model_year (ano do MODELO, não de fabricação).
--   5. Desvio padrão = STDDEV_SAMP (amostral). Retorna NULL quando n = 1.
--
-- COLUNAS CONFERIDAS contra o schema.md, uma por uma. Única exceção:
--   shops.deleted_at está entre as 13 colunas que o diagrama colapsou, então não
--   aparece no schema.md. Uso ela mesmo assim porque o índice
--   `shops_id_deleted_idx: (id, deleted_at)` prova que existe. Se der erro de coluna
--   desconhecida, é só remover o `AND s.deleted_at IS NULL`.
--
-- DENOMINADORES — são dois, de propósito:
--   · preço / idade / km: calculados sobre a ÚLTIMA oferta de cada veículo
--     (1 linha por loja × veículo), como pedido em "valor da última oferta por veículo".
--   · % do modelo e da categoria: calculados sobre o TOTAL DE OFERTAS,
--     como pedido em "% de ofertas para esse modelo".
--   As colunas qt_ofertas e qt_veiculos deixam os dois visíveis.
-- =============================================================================

WITH base AS (   -- toda oferta válida da janela, já com veículo e loja
    SELECT o.id                AS offer_id,
           o.created_at,
           o.price,
           o.buyer_shop_id     AS shop_id,          -- [LADO]
           a.vehicle_id,
           v.model_id,
           v.category_id,
           NULLIF(v.model_year, 0) AS model_year,
           NULLIF(v.km, 0)         AS km
    FROM offers o
    JOIN advertisements a ON a.id = o.advertisement_id AND a.deleted_at IS NULL
    JOIN vehicles      v ON v.id = a.vehicle_id       AND v.deleted_at IS NULL
    WHERE o.deleted_at IS NULL
      AND o.buyer_shop_id IS NOT NULL                -- [LADO]
      AND o.created_at >= CURDATE() - INTERVAL 6 MONTH
      AND o.price > 0
),

ultima_por_veiculo AS (   -- 1 linha por loja × veículo: a oferta mais recente
    SELECT * FROM (
        SELECT b.*,
               ROW_NUMBER() OVER (PARTITION BY b.shop_id, b.vehicle_id
                                  ORDER BY b.created_at DESC, b.offer_id DESC) AS rn
        FROM base b
    ) x WHERE rn = 1
),

metricas AS (
    SELECT shop_id,
           COUNT(*)                                          AS qt_veiculos,
           ROUND(AVG(price), 2)                              AS preco_medio,
           ROUND(STDDEV_SAMP(price), 2)                      AS preco_desvio,
           ROUND(AVG(YEAR(CURDATE()) - model_year), 2)       AS idade_media,
           ROUND(STDDEV_SAMP(YEAR(CURDATE()) - model_year), 2) AS idade_desvio,
           ROUND(AVG(km), 0)                                 AS km_medio,
           ROUND(STDDEV_SAMP(km), 0)                         AS km_desvio
    FROM ultima_por_veiculo
    GROUP BY shop_id
),

totais AS (
    SELECT shop_id, COUNT(*) AS qt_ofertas
    FROM base GROUP BY shop_id
),

top_modelo AS (
    SELECT shop_id, model_id, n
    FROM (
        SELECT shop_id, model_id, COUNT(*) AS n,
               ROW_NUMBER() OVER (PARTITION BY shop_id
                                  ORDER BY COUNT(*) DESC, model_id) AS rn
        FROM base WHERE model_id IS NOT NULL
        GROUP BY shop_id, model_id
    ) t WHERE rn = 1
),

top_categoria AS (
    SELECT shop_id, category_id, n
    FROM (
        SELECT shop_id, category_id, COUNT(*) AS n,
               ROW_NUMBER() OVER (PARTITION BY shop_id
                                  ORDER BY COUNT(*) DESC, category_id) AS rn
        FROM base WHERE category_id IS NOT NULL
        GROUP BY shop_id, category_id
    ) t WHERE rn = 1
),

endereco AS (   -- shop_addresses não é 1:1 — pego o mais recente não deletado
    SELECT shop_id, state
    FROM (
        SELECT sa.shop_id, sa.state,
               ROW_NUMBER() OVER (PARTITION BY sa.shop_id
                                  ORDER BY sa.updated_at DESC, sa.id DESC) AS rn
        FROM shop_addresses sa WHERE sa.deleted_at IS NULL
    ) t WHERE rn = 1
)

SELECT COALESCE(w.name, CONCAT('whitelabel #', s.whitelabel_id)) AS whitelabel,
       s.whitelabel_id,
       COALESCE(NULLIF(UPPER(TRIM(e.state)), ''), '(sem UF)')    AS uf,
       s.id                                                      AS loja_id,
       s.name                                                     AS loja,
       t.qt_ofertas,
       m.qt_veiculos,
       m.preco_medio,
       m.preco_desvio,
       m.idade_media,
       m.idade_desvio,
       m.km_medio,
       m.km_desvio,
       mo.name                                                    AS principal_modelo,
       ROUND(100.0 * tm.n / t.qt_ofertas, 1)                      AS pct_ofertas_modelo,
       ca.name                                                    AS principal_categoria,
       ROUND(100.0 * tc.n / t.qt_ofertas, 1)                      AS pct_ofertas_categoria
FROM metricas m
JOIN totais        t  ON t.shop_id  = m.shop_id
JOIN shops         s  ON s.id       = m.shop_id AND s.deleted_at IS NULL
LEFT JOIN whitelabels    w  ON w.id  = s.whitelabel_id
LEFT JOIN endereco       e  ON e.shop_id = m.shop_id
LEFT JOIN top_modelo     tm ON tm.shop_id = m.shop_id
LEFT JOIN models         mo ON mo.id = tm.model_id
LEFT JOIN top_categoria  tc ON tc.shop_id = m.shop_id
LEFT JOIN categories     ca ON ca.id = tc.category_id
ORDER BY whitelabel, uf, t.qt_ofertas DESC;
