# -*- coding: utf-8 -*-
"""Corrige os docs: o MCP ANEXA credencial predefinida em no HTTP.

Dois arquivos afirmam o contrario, e eu repeti a afirmacao hoje:

  cars2you-iga-automacoes.md : "Cred do no HTTP e vinculada manualmente na
                                UI (validador nao anexa cred predefinida
                                via API)."
  lista-lm-propostas.md      : "Duas credenciais tem que ser vinculadas na
                                interface... O MCP do n8n nao anexa
                                credencial generica de HTTP nem
                                httpHeaderAuth."

MEDIDO no run 50379 (2026-09-11): o `Subir no SharePoint` autenticou e subiu
4,47 MB, com a credencial anexada SO pela API.

A distincao que faltava: sao DUAS coisas diferentes.

  - auto-atribuicao: o MCP procura sozinho uma credencial compativel ao
    criar o no. Isso realmente NAO acontece em no HTTP -- ele avisa
    "were skipped during credential auto-assignment".
  - atribuicao EXPLICITA: a operacao `setNodeCredential`, com
    credentialKey/credentialId/credentialName na mao. Essa FUNCIONA.

Passar `credentials` dentro do `addNode` cai no primeiro caso e nao basta.
O que resolve e a operacao dedicada, depois.

`httpHeaderAuth` (Evolution) nao foi testado e continua com a ressalva.

    python _credencial_http_via_mcp.py
"""
import io
import os
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

RAIZ = os.path.join("C:\\", "Users", "thoma", "Documents", "work-brain",
                    "automations", "n8n-flows")

NOTA = """

> ✅ **Corrigido em 2026-09-11 (run 50379):** o MCP **anexa** credencial
> predefinida em nó HTTP — mas só pela operação **`setNodeCredential`**, com
> `credentialKey`/`credentialId`/`credentialName` explícitos. O que não
> funciona é a **auto-atribuição** (o MCP procurar sozinho ao criar o nó), e
> é dela que vem o aviso `were skipped during credential auto-assignment`.
> Passar `credentials` dentro do `addNode` cai no mesmo caso e não basta.
> Medido com o `Subir no SharePoint` do `rel-veiculos`, que autenticou e
> subiu 4,47 MB sem ninguém tocar na interface.
> ⚠️ `httpHeaderAuth` (Evolution) **não** foi testado; a ressalva continua.
"""

ALVOS = [
    ("cars2you-iga-automacoes.md",
     "(Outlook/SharePoint anexam via API normalmente.)"),
    ("lista-lm-propostas.md",
     "O MCP do n8n n\u00e3o anexa credencial gen\u00e9rica de HTTP nem `httpHeaderAuth`."),
]

for arq, ancora in ALVOS:
    P = os.path.join(RAIZ, arq)
    s = io.open(P, encoding="utf-8").read()
    if ancora not in s:
        print("  !!  ANCORA NAO ENCONTRADA em " + arq)
        continue
    if "Corrigido em 2026-09-11 (run 50379)" in s:
        print("  --  %s ja corrigido" % arq)
        continue
    i = s.index(ancora) + len(ancora)
    s = s[:i] + NOTA + s[i:]
    tmp = P + ".tmp"
    with io.open(tmp, "w", encoding="utf-8") as f:
        f.write(s)
    os.replace(tmp, P)
    print("  ok  %s corrigido" % arq)
