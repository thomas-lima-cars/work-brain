# -*- coding: utf-8 -*-
r"""As QUATRO consultas de perfil tambem precisam do filtro de canal.

BUG QUE EU INTRODUZI, pego pela conferencia de completude no run 50268:

  perfil montado para 1292 lojas mas a fase 1 contou 1295

Diagnostico pelos numeros do proprio run:

  q_lojas      26 chamadas -> 1295 linhas  (= esperado_lojas, completa)
  q_ofertas    26 chamadas -> 1300 linhas
  q_perfil     26 chamadas -> 1300 linhas
  q_modelo     26 chamadas -> 1300 linhas
  q_categoria  26 chamadas -> 1300 linhas

1300 = 26 x 50 = o TETO da paginacao. Quatro consultas diferentes batendo
exatamente no teto nao e coincidencia: e truncamento.

O que aconteceu: o recorte de canal (2026-09-11) entrou em q_lojas e
q_lojas_total, o que baixou o total de 1.303 para 1.295 e a paginacao de 27
para 26 paginas. Mas q_ofertas, q_perfil, q_modelo e q_categoria NAO tem o
filtro -- elas continuam varrendo as 1.303 lojas do universo inteiro, agora
com teto de 1.300. As tres ultimas (1303 - 1300) nunca chegam, e as lojas
correspondentes ficam sem perfil e caem no `.filter(l => l.qt_veiculos)`.

Bate exatamente: 1295 esperadas - 1292 com perfil = 3.

A invariante que eu mesmo escrevi no README -- "o gabarito e a consulta
precisam filtrar a mesma coisa, senao a paginacao sobra ou falta" -- eu
apliquei a duas consultas e esqueci das outras quatro. Elas nao tinham
filtro nenhum antes porque o gabarito tambem nao tinha; o problema nasceu
quando so um dos lados mudou.

Correcao: o mesmo INNER JOIN em shops nas quatro. Assim as seis consultas
de loja cobrem o MESMO universo que as dimensiona.

Efeito colateral bom: elas param de varrer loja que o relatorio descarta,
o que e trabalho jogado fora em 26 paginas de agregado.

    python _corrige_universo_lojas.py
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
    if velho not in s:
        raise SystemExit("NAO ENCONTRADO: " + rot)
    s = s.replace(velho, novo, 1)
    print("  ok  " + rot)


# um so lugar monta o join, pras quatro nao divergirem entre si
troca(
"""const JANELA =
  " o.deleted_at IS NULL AND o." + LADO + " IS NOT NULL" +
  " AND o.created_at >= '" + DATA_INI + "' AND o.price > 0";""",
"""const JANELA =
  " o.deleted_at IS NULL AND o." + LADO + " IS NOT NULL" +
  " AND o.created_at >= '" + DATA_INI + "' AND o.price > 0";

/* O MESMO recorte de canal que a q_lojas_total usou pra dimensionar estas
   consultas. Sem ele, q_ofertas/q_perfil/q_modelo/q_categoria varrem o
   universo INTEIRO de lojas com paginacao dimensionada pelo universo
   FILTRADO -- e as ultimas linhas somem no teto. Foi o que aconteceu no
   run 50268: quatro consultas devolvendo exatos 1.300 = 26 x 50, e tres
   lojas ficando sem perfil.

   Montado uma vez so, de proposito: quatro copias do mesmo join e quatro
   chances de uma divergir das outras. */
const JOIN_LOJA_CANAL = SO_WL_LOJA
  ? " INNER JOIN shops s ON s.id = o." + LADO + " AND s.deleted_at IS NULL" + SO_WL_LOJA
  : "";""",
    "JOIN_LOJA_CANAL montado uma vez")

troca(
"""push('q_ofertas',
  "SELECT o." + LADO + " AS shop_id, COUNT(*) AS qt_ofertas" +
  " FROM offers o WHERE" + JANELA +""",
"""push('q_ofertas',
  "SELECT o." + LADO + " AS shop_id, COUNT(*) AS qt_ofertas" +
  " FROM offers o" + JOIN_LOJA_CANAL + " WHERE" + JANELA +""",
    "q_ofertas cobre o mesmo universo")

troca(
"""const ULTIMAS =
  "(SELECT o." + LADO + " AS shop_id, a.vehicle_id AS vehicle_id, MAX(o.id) AS offer_id" +
  " FROM offers o" +
  " INNER JOIN advertisements a ON a.id = o.advertisement_id AND a.deleted_at IS NULL" +""",
"""const ULTIMAS =
  "(SELECT o." + LADO + " AS shop_id, a.vehicle_id AS vehicle_id, MAX(o.id) AS offer_id" +
  " FROM offers o" + JOIN_LOJA_CANAL +
  " INNER JOIN advertisements a ON a.id = o.advertisement_id AND a.deleted_at IS NULL" +""",
    "q_perfil (via ULTIMAS) cobre o mesmo universo")

troca(
"""    "(SELECT o." + LADO + " AS shop_id, v." + campo + " AS item_id, COUNT(*) AS n" +
    " FROM offers o" +
    " INNER JOIN advertisements a ON a.id = o.advertisement_id AND a.deleted_at IS NULL" +""",
"""    "(SELECT o." + LADO + " AS shop_id, v." + campo + " AS item_id, COUNT(*) AS n" +
    " FROM offers o" + JOIN_LOJA_CANAL +
    " INNER JOIN advertisements a ON a.id = o.advertisement_id AND a.deleted_at IS NULL" +""",
    "q_modelo e q_categoria (via AG) cobrem o mesmo universo")

io.open(P, "w", encoding="utf-8").write(s)
print("mudou: " + str(s != orig))
