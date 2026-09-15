-- =============================================================================
-- vehicles — ficha completa, com todo ID trocado pela descrição
--            + código FIPE, valores de referência e VMV
-- Escrita em 2026-09-14 contra context/banco-de-dados/schema.md (retrato 09/09)
-- MySQL 8.0+ / MariaDB 10.2+ (usa CTE e window function)
--
-- O QUE FAZ: uma linha por veículo, com as 27 colunas de `vehicles`, as 11
-- chaves estrangeiras trocadas pelo texto do catálogo, e os valores de
-- referência anexados a partir da ÚLTIMA negociação daquele carro.
--
-- PREMISSAS (trocar aqui se estiverem erradas):
--
--   1. TODO JOIN DE CATÁLOGO É `LEFT`. As 11 FKs de vehicles são anuláveis e
--      nenhuma fonte do schema traz NOT NULL (ressalva 4 do README). Com INNER,
--      um carro sem cluster sumiria da listagem em silêncio.
--
--   2. NÃO filtro `deleted_at` nas tabelas de catálogo, de propósito. Marca ou
--      cor soft-deletada continua sendo a daquele carro; filtrar ali viraria a
--      descrição em NULL sem o veículo ter mudado.
--
--   3. `drive_shift_id` aponta para `driver_shifts` — com o "r" a mais só do
--      lado da tabela. Não é typo daqui; é como está no banco.
--
--   4. `situation` FICA COMO NÚMERO. Não há tabela de domínio e o significado
--      dos valores NÃO foi medido (pendência do README). A sonda que decodifica
--      está no rodapé. Um CASE aqui seria suposição.
--
--   5. VMV = `advertisement_negotiations.min_sale_price`. Validado contra a
--      planilha do Head na execução 23463 do IGA (`automations/n8n-flows/
--      cars2you-iga-automacoes.md:201` — "L=VMV=min_sale_price"). A própria
--      tabela confirma o termo: existe a coluna
--      `close_seller_analysis_even_if_vmv_reached`.
--
--   6. VMV NÃO É PROPRIEDADE DO CARRO — é da negociação. O caminho é
--      vehicles -> advertisements -> advertisement_negotiations, e um carro pode
--      ser anunciado e renegociado N vezes. Join direto MULTIPLICARIA as
--      linhas. Aqui pego a ÚLTIMA negociação por veículo, que é o mesmo
--      recorte que o `rel-veiculos` já usa ("uma linha por veículo, com o
--      status da última negociação"). Pra ver o histórico inteiro, tirar o
--      `AND neg.rn = 1` do LEFT JOIN — e aí deixa de ser 1 linha por carro.
--      `neg_fim_ofertas` está no SELECT justamente pra essa escolha ser
--      auditável, e não uma caixa-preta.
--
--   7. NÃO EXISTE TABELA DE PREÇO FIPE POR CÓDIGO. `versions.code_fipe` é
--      só o código; o valor vive denormalizado. Medido na sonda 50346 sobre
--      104.305 ofertas (`dominios.md:287`): code_fipe 86,2% · advertisements.
--      fipe_price 85,6% · vehicles.fipe_price 63,8% — e as duas de valor
--      DIVERGEM entre si em 633 ofertas. Por isso trago as DUAS, lado a lado,
--      em vez de escolher uma escondido. Para deságio, a do anúncio é a
--      recomendada: mais cobertura e contemporânea da oferta.
--
--   8. `price_reference_advertiser` vem junto porque é o Valor Referência do
--      Vendedor — o campo oficial do IGA, que sai rotulado como "FIPE" no
--      relatório do Head mas NÃO é o fipe_price (mesma ref: linha 201). Se
--      alguém pedir "o valor FIPE", é bem possível que queira este.
--
--   9. `deleted_at` de `advertisements` está documentado; o de
--      `advertisement_negotiations` está entre as 5 colunas que o diagrama
--      colapsou, mas o índice `idx_an_advertisement_deleted: (advertisement_id,
--      deleted_at)` prova que existe. Se der erro de coluna desconhecida,
--      remover `AND an.deleted_at IS NULL`.
--
-- ⚠️ CUSTO: a CTE `carros` aplica o LIMIT ANTES de tocar em advertisements e
--    advertisement_negotiations. Sem isso, a janela varreria as duas tabelas
--    inteiras pra depois jogar quase tudo fora — o erro que já estourou o
--    deadline do MCP (~15s) mais de uma vez nesta casa. Mexer no recorte é
--    mexer na CTE, não no fim da query.
--
-- ⚠️ SE FOR AGREGAR POR MODELO: `models` tem nomes duplicados em duas faixas de
--    id (Amarok/Fiorino/Strada, `dominios.md:100`). O join daqui resolve
--    sempre — o problema só aparece ao COMPARAR modelos entre si.
--
-- ⚠️ SE FOR CALCULAR DESÁGIO OU %VMV: há lixo nos extremos. Deságio sobre a
--    última oferta vai de -1.586% a +94%. Qualquer média precisa de corte de
--    outlier declarado.
-- =============================================================================

WITH carros AS (
    -- O recorte mora AQUI. Mexer neste bloco, não no fim da query.
    SELECT v.id
      FROM vehicles v
     WHERE v.deleted_at IS NULL          -- tirar pra ver também os excluídos
       -- AND v.created_at >= '2026-01-01'
       -- AND v.situation = ?            -- depois de rodar a sonda do rodapé
     ORDER BY v.created_at DESC
     LIMIT 500                           -- ⚠️ tirar só sabendo o tamanho do retorno
),
neg AS (
    -- Última negociação de cada carro do recorte.
    SELECT a.vehicle_id,
           a.fipe_price,
           a.molicar_price,
           an.min_sale_price,
           an.price_reference_advertiser,
           an.finish_date_offer,
           ROW_NUMBER() OVER (PARTITION BY a.vehicle_id
                              ORDER BY an.finish_date_offer DESC, an.id DESC) AS rn
      FROM advertisements a
     INNER JOIN advertisement_negotiations an ON an.advertisement_id = a.id
     WHERE a.deleted_at IS NULL
       AND an.deleted_at IS NULL         -- ver premissa 9
       AND a.vehicle_id IN (SELECT id FROM carros)   -- <- o que segura o custo
)
SELECT
    v.id                            AS veiculo_id,

    -- ── de onde vem o carro ──────────────────────────────────────────────────
    s.name                          AS loja,
    ss.name                         AS patio,
    ss.city                         AS patio_cidade,   -- a UF do carro é a do
    ss.state                        AS patio_uf,       -- pátio, não a da loja

    -- ── ficha técnica: os 9 catálogos ────────────────────────────────────────
    cat.name                        AS categoria,
    b.name                          AS marca,
    m.name                          AS modelo,
    ver.name                        AS versao,
    bw.name                         AS carroceria,
    c.name                          AS cor,
    ds.name                         AS cambio,
    f.name                          AS combustivel,
    cl.name                         AS cluster,

    -- ── códigos de catálogo ──────────────────────────────────────────────────
    ver.code_fipe                   AS codigo_fipe,
    ver.code_molicar                AS codigo_molicar,

    -- ── valores de referência e VMV ──────────────────────────────────────────
    neg.fipe_price                  AS valor_fipe_anuncio,   -- 85,6% preenchida
    v.fipe_price                    AS valor_fipe_veiculo,   -- 63,8% preenchida
    neg.price_reference_advertiser  AS valor_ref_vendedor,   -- ver premissa 8
    neg.min_sale_price              AS vmv,                  -- ver premissa 5
    neg.finish_date_offer           AS neg_fim_ofertas,      -- ver premissa 6
    v.molicar_price                 AS valor_molicar_veiculo,
    neg.molicar_price               AS valor_molicar_anuncio,
    v.retail_value                  AS valor_varejo,

    -- ── colunas próprias do veículo ──────────────────────────────────────────
    v.situation                     AS situacao_codigo,      -- ver premissa 4
    v.plate                         AS placa,
    v.chassi                        AS chassi,
    v.manufacture_year              AS ano_fabricacao,
    v.model_year                    AS ano_modelo,
    v.km                            AS km,
    v.ports_qtd                     AS portas,
    v.fipe_quantity_version         AS fipe_qtd_versoes,
    v.description                   AS descricao_livre,
    v.created_at                    AS criado_em,
    v.updated_at                    AS atualizado_em,
    v.deleted_at                    AS excluido_em

FROM vehicles v
    INNER JOIN carros k ON k.id = v.id
    LEFT  JOIN neg       ON neg.vehicle_id = v.id AND neg.rn = 1  -- ver premissa 6

    LEFT JOIN shops         s   ON s.id   = v.shop_id
    LEFT JOIN shop_stocks   ss  ON ss.id  = v.shop_stock_id
    LEFT JOIN categories    cat ON cat.id = v.category_id
    LEFT JOIN brands        b   ON b.id   = v.brand_id
    LEFT JOIN models        m   ON m.id   = v.model_id
    LEFT JOIN versions      ver ON ver.id = v.version_id
    LEFT JOIN bodyworks     bw  ON bw.id  = v.bodywork_id
    LEFT JOIN colors        c   ON c.id   = v.color_id
    LEFT JOIN driver_shifts ds  ON ds.id  = v.drive_shift_id   -- ver premissa 3
    LEFT JOIN clusters      cl  ON cl.id  = v.cluster_id
    LEFT JOIN fuels         f   ON f.id   = v.fuel_id

ORDER BY v.created_at DESC;


-- =============================================================================
-- SONDA 1 — decodificar `vehicles.situation` (premissa 4)
-- Agrega sobre o índice `idx_vehicles_situation`; não varre a tabela toda.
-- =============================================================================
-- SELECT v.situation,
--        COUNT(*)                      AS veiculos,
--        COUNT(DISTINCT v.shop_id)     AS lojas,
--        SUM(v.deleted_at IS NOT NULL) AS excluidos,
--        MIN(v.created_at)             AS primeiro,
--        MAX(v.created_at)             AS ultimo
--   FROM vehicles v
--  GROUP BY v.situation
--  ORDER BY veiculos DESC;

-- =============================================================================
-- SONDA 2 — o VMV é mesmo FIPE x 0,75? (premissa 5)
-- A doc do C6 diz: "VMV do Head = FIPE x 0,75, e o banco grava arredondado para
-- a centena acima" (cars2you-c6-automacoes.md:93). Isso nunca foi conferido
-- contra o banco. Se a mediana bater em 0,75, a premissa se sustenta.
-- =============================================================================
-- SELECT COUNT(*)                                        AS negociacoes,
--        ROUND(AVG(an.min_sale_price / a.fipe_price), 4) AS razao_media,
--        MIN(an.min_sale_price / a.fipe_price)           AS razao_min,
--        MAX(an.min_sale_price / a.fipe_price)           AS razao_max
--   FROM advertisement_negotiations an
--  INNER JOIN advertisements a ON a.id = an.advertisement_id
--  WHERE an.deleted_at IS NULL AND a.deleted_at IS NULL
--    AND a.fipe_price > 0 AND an.min_sale_price > 0
--    AND an.finish_date_offer >= '2026-03-01';
