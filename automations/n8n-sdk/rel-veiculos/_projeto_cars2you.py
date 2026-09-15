# -*- coding: utf-8 -*-
"""Registra que o rel-veiculos saiu do projeto pessoal para o Cars2You.

Movido pelo Thomas na interface em 2026-09-11 (o MCP nao tem ferramenta de
transferencia entre projetos -- so entre PASTAS do mesmo projeto).

O ID NAO MUDA ao mover: continua `8fiTFsjWG9RQinz8`. Conferido depois da
mudanca -- os quatro nos Code atravessaram identicos byte a byte e as tres
credenciais continuaram vinculadas, inclusive a do SharePoint.

E o `n8n-ambiente-cars2you.md` dizia que o projeto pessoal "estava vazio ate
criarmos a copia". Hoje tem seis workflows. Frase de inventario que envelhece
sem avisar e pior que nenhuma.

    python _projeto_cars2you.py
"""
import io
import os
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

RAIZ = os.path.join("C:\\", "Users", "thoma", "Documents", "work-brain")


def patch(caminho, velho, novo, rot):
    P = os.path.join(RAIZ, *caminho.split("/"))
    s = io.open(P, encoding="utf-8").read()
    if s.count(velho) != 1:
        raise SystemExit("ANCORA AMBIGUA OU AUSENTE (%d): %s" % (s.count(velho), rot))
    s = s.replace(velho, novo, 1)
    tmp = P + ".tmp"
    with io.open(tmp, "w", encoding="utf-8") as f:
        f.write(s)
    os.replace(tmp, P)
    print("  ok  " + rot)


# ── 1. o inventario do projeto pessoal ───────────────────────────────────
patch("automations/n8n-ambiente-cars2you.md",
"""Todos os workflows de produ\u00e7\u00e3o vivem no projeto **Cars2You**. O projeto pessoal do Thomas estava""",
"""> \U0001F4C1 **Mover workflow entre projetos s\u00f3 pela interface.** O MCP tem
> `move_workflows_to_folder`, que move entre **pastas do mesmo projeto** \u2014 n\u00e3o
> entre projetos. Pelo menu \u22ef do workflow \u2192 **Move**. O **id n\u00e3o muda**, e as
> credenciais continuam vinculadas (elas s\u00e3o globais). Verificado em 11/09 ao
> mover o `rel-veiculos`: os quatro n\u00f3s Code atravessaram id\u00eanticos byte a byte.
>
> \u26a0\ufe0f **O projeto pessoal N\u00c3O est\u00e1 mais vazio.** Em 11/09/2026 tinha seis:
> `LZL3mxfbMIz4avyx` (Lojas ofertantes), `QImk2D4HdzIqHZe9` (C6 lote 2),
> `a6fNNTUYYayehNIn` e `7TCmS8JFacDTmySQ` (sondas, descart\u00e1veis),
> `0pUtqToo0zNNibQT` (sandbox C6) e `GgjVZlU04wvJzLbK` (c\u00f3pia da Auditoria,
> a perigosa). O `rel-veiculos` saiu de l\u00e1 nessa data.

Todos os workflows de produ\u00e7\u00e3o vivem no projeto **Cars2You**. O projeto pessoal do Thomas estava""",
      "n8n-ambiente: inventario do projeto pessoal atualizado")

# ── 2. o README do rel-veiculos diz onde ele mora ────────────────────────
patch("automations/n8n-sdk/rel-veiculos/README.md",
"""Workflow n8n **`8fiTFsjWG9RQinz8`** \u2014 \"RELATORIO Veiculos em evento - lojas mais aderentes\".""",
"""Workflow n8n **`8fiTFsjWG9RQinz8`** \u2014 \"RELATORIO Veiculos em evento - lojas mais aderentes\".
Projeto **Cars2You** (`yAo7DiqDfz6XfXyv`, time) desde 2026-09-11 \u2014 nasceu no projeto
pessoal do Thomas e foi movido pela interface. O id n\u00e3o muda ao mover.""",
      "README do rel-veiculos: projeto declarado")

print("")
print("As sondas e a copia da Auditoria continuam no pessoal, de proposito:")
print("as duas sondas sao descartaveis e a copia tem MODO='producao' + gatilho 08h.")
