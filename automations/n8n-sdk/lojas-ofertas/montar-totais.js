/* ══════════════════════════════════════════════════════════════════════
   NÓ "Montar Totais" — fase 1 de 2

   Uma chamada só, antes de qualquer outra coisa: quantas lojas e quantas
   ofertas existem na janela. Serve para duas coisas:

     1. DIMENSIONAR a paginação. O "Montar Queries" monta exatamente
        ceil(lojas / 50) páginas por query, em vez de chutar um teto.
        Na execução 49803 eu chutei 60 páginas para um universo de
        ~1.000-2.000 lojas: as páginas que sobraram custaram o agregado
        completo de 6 meses de `offers` e devolveram ZERO linha. É o
        mesmo desperdício dos 74% do Raio-X no relatório C6.

     2. GABARITO de completude. O HTML compara o que a coleta trouxe com
        esse número e abre em vermelho se não fechar.

   Por que uma fase separada: o OFFSET faz o banco re-executar a query
   inteira a cada página. Página vazia não é de graça — é um agregado
   completo jogado fora. A única forma de não pagar por ela é saber o
   tamanho ANTES de montar as páginas.
   ══════════════════════════════════════════════════════════════════════ */

const MESES = 6;
const PAGE = 50;        /* teto duro do MCP. NÃO aumentar */
const LADO = 'buyer_shop_id';   /* confirmado pelo Thomas em 2026-09-09 */

const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const ini = new Date(now.getFullYear(), now.getMonth() - MESES, now.getDate());
const DATA_INI = ini.getFullYear() + '-' + pad(ini.getMonth() + 1) + '-' + pad(ini.getDate());

const JANELA =
  " o.deleted_at IS NULL AND o." + LADO + " IS NOT NULL" +
  " AND o.created_at >= '" + DATA_INI + "' AND o.price > 0";

return [{
  json: {
    queryName: 'q_totais',
    database: 'cars2you_production',
    sql: "SELECT COUNT(DISTINCT o." + LADO + ") AS lojas, COUNT(*) AS ofertas" +
         " FROM offers o WHERE" + JANELA,
    meta: { data_ini: DATA_INI, meses: MESES, page: PAGE, lado: LADO }
  }
}];
