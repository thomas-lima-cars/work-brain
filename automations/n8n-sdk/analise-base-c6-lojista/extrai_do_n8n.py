"""Traz o workflow f6Bw2iiuaWECy9Uz (C6 Lojista - Analise de base de cadastros)
do n8n para esta pasta, ou confere a pasta contra o n8n.

Entrada: o JSON de `get_workflow_details` do MCP do n8n, salvo em disco
(o resultado passa de 140 KB e o MCP grava num arquivo).

    python extrai_do_n8n.py <detalhes.json>             # grava n8n/*.js e workflow.json
    python extrai_do_n8n.py <detalhes.json> --confere   # só compara, não grava

O que sai:
- n8n/<no>.js        o jsCode de cada nó Code, um arquivo por nó
- workflow.json      o resto do workflow (nós, ligações, gatilho, credenciais por
                     id/nome), com o jsCode trocado por "@arquivo n8n/<no>.js"

Telefone NUNCA entra no repo (regra do mapa.md): número de WhatsApp vira
'<telefone>' na gravação e na conferência, então os dois lados batem.
Credencial aparece só por id e nome, como o próprio n8n devolve; nenhum segredo
passa pela API.
"""
import json
import re
import sys
from pathlib import Path

AQUI = Path(__file__).resolve().parent
WF_ID = "f6Bw2iiuaWECy9Uz"

# 55 + DDD + 8 ou 9 dígitos, entre aspas: o formato que a Evolution API recebe.
TELEFONE = re.compile(r"(['\"])55\d{10,11}\1")


def slug(nome):
    s = nome.lower()
    for a, b in (("á", "a"), ("ã", "a"), ("â", "a"), ("é", "e"), ("ê", "e"),
                 ("í", "i"), ("ó", "o"), ("ô", "o"), ("õ", "o"), ("ú", "u"), ("ç", "c")):
        s = s.replace(a, b)
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def sem_telefone(txt):
    return TELEFONE.sub(lambda m: m.group(1) + "<telefone>" + m.group(1), txt)


def normaliza(txt):
    # core.autocrlf=true grava CRLF no checkout; a comparação é sobre LF.
    return txt.replace("\r\n", "\n")


def separa(detalhes):
    w = detalhes["workflow"]
    if w["id"] != WF_ID:
        sys.exit(f"Este JSON é do workflow {w['id']}, não do {WF_ID}.")
    codigos = {}
    nos = []
    for n in w["nodes"]:
        n = json.loads(json.dumps(n))  # cópia
        p = n.get("parameters", {})
        if "jsCode" in p:
            arq = f"n8n/{slug(n['name'])}.js"
            codigos[arq] = sem_telefone(normaliza(p["jsCode"]))
            p["jsCode"] = "@arquivo " + arq
        nos.append(n)
    resto = {
        "id": w["id"],
        "name": w["name"],
        "description": w.get("description"),
        "active": w["active"],
        "versionId": w["versionId"],
        "activeVersionId": w.get("activeVersionId"),
        "updatedAt": w["updatedAt"],
        "parentFolderId": w.get("parentFolderId"),
        "settings": w.get("settings"),
        "nodes": nos,
        "connections": w["connections"],
    }
    texto = sem_telefone(json.dumps(resto, ensure_ascii=False, indent=2)) + "\n"
    return codigos, texto


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    detalhes = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    confere = "--confere" in sys.argv
    codigos, wf_txt = separa(detalhes)
    alvo = dict(codigos)
    alvo["workflow.json"] = wf_txt

    sobra = [a for a, t in alvo.items() if TELEFONE.search(t)]
    if sobra:
        sys.exit(f"Telefone sobrou em {sobra}. Nada gravado.")

    if confere:
        difs = []
        for arq, txt in alvo.items():
            p = AQUI / arq
            local = normaliza(p.read_text(encoding="utf-8")) if p.exists() else None
            if arq == "workflow.json" and local is not None:
                # versionId/updatedAt mudam a cada save; o que importa é o resto
                a, b = json.loads(local), json.loads(txt)
                for k in ("versionId", "activeVersionId", "updatedAt"):
                    a.pop(k, None); b.pop(k, None)
                igual = a == b
            else:
                igual = local == txt
            print(("IGUAL     " if igual else "DIFERENTE ") + arq)
            if not igual:
                difs.append(arq)
        locais = {str(p.relative_to(AQUI)).replace("\\", "/") for p in (AQUI / "n8n").glob("*.js")}
        for extra in sorted(locais - set(codigos)):
            print("SÓ LOCAL  " + extra)
            difs.append(extra)
        print(f"versionId no n8n: {detalhes['workflow']['versionId']}")
        sys.exit(1 if difs else 0)

    (AQUI / "n8n").mkdir(exist_ok=True)
    for arq, txt in alvo.items():
        with open(AQUI / arq, "w", encoding="utf-8", newline="\n") as f:
            f.write(txt)
        print(f"gravado {arq} ({len(txt.encode('utf-8')) // 1024} KB)")


if __name__ == "__main__":
    main()
