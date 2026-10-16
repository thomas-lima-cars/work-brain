-- Medicao da marcacao de compras na q_ofertas (2026-09-25). Rodar com VPN:
--   python ../../bancos/consulta.py --arquivo _mede-compras.sql --base cars2you
-- Mesmo WHERE nas duas linhas (a regra de 15/09). Esperado: qt_ofertas IGUAL.
-- Data: 6 meses antes do run, em UTC (03:00 = meia-noite de Brasilia).
SELECT 'sem marcacao' AS versao, COUNT(*) AS qt_ofertas, NULL AS qt_compras, NULL AS vl_compras
  FROM offers o
  INNER JOIN shops s ON s.id = o.buyer_shop_id AND s.deleted_at IS NULL AND s.whitelabel_id IN (4,7,43,48,62,65)
 WHERE o.deleted_at IS NULL AND o.buyer_shop_id IS NOT NULL AND o.created_at >= '2026-03-25 03:00:00' AND o.price > 0
UNION ALL
SELECT 'com marcacao', COUNT(*), COUNT(anv.id), SUM(CASE WHEN anv.id IS NOT NULL THEN o.price ELSE 0 END)
  FROM offers o
  INNER JOIN shops s ON s.id = o.buyer_shop_id AND s.deleted_at IS NULL AND s.whitelabel_id IN (4,7,43,48,62,65)
  LEFT JOIN advertisement_negotiations anv ON anv.id = o.advs_negotiation_id
        AND anv.offer_actual_id = o.id AND anv.deleted_at IS NULL AND anv.status IN (2,3,7)
 WHERE o.deleted_at IS NULL AND o.buyer_shop_id IS NOT NULL AND o.created_at >= '2026-03-25 03:00:00' AND o.price > 0;
