"""Texto dos laudos cautelares das VENDAS da amostra do estudo de precificacao.

    python automations/precificacao/laudos/coleta-textos-vendas.py --por-base 1500

Para cada base (cars2you, dealers):
  1. pega os veiculo_id de `analitico-<base>.json` (a amostra do estudo);
  2. busca no banco o laudo mais recente de cada um (MAX(id), nao deletado);
  3. sorteia N com semente fixa -- rodar de novo devolve os mesmos;
  4. baixa o PDF, extrai o texto com `pdftotext -layout` e APAGA o PDF.

Fica so o texto, em textos-vendas/<base>/<veiculo_id>.txt, e um indice
`textos-vendas/indice.csv`. O PDF medio tem ~17 MB (medido em 14/10, quase
tudo foto); o texto, ~12 KB. Guardar os PDFs da amostra seriam ~50 GB.

Retomavel: texto ja extraido e pulado.
"""
import argparse
import csv
import os
import random
import subprocess
import sys
import tempfile
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
import json

AQUI = os.path.dirname(os.path.abspath(__file__))
ESTUDO = os.path.dirname(AQUI)
sys.path.insert(0, os.path.join(ESTUDO, "..", "bancos"))
from conexao import conectar  # noqa: E402

SAIDA = os.path.join(AQUI, "textos-vendas")
BASES = ("cars2you", "dealers")


def laudos_da_base(base):
    vendas = json.load(open(os.path.join(ESTUDO, "analitico-%s.json" % base),
                            encoding="utf-8"))["vendas"]
    ids = sorted({int(v["veiculo_id"]) for v in vendas})
    cx = conectar(base)
    cur = cx.cursor()
    cur.execute(
        "SELECT vpr.vehicle_id, vpr.id, vpr.situation, vpr.file_url"
        "  FROM vehicle_precautionary_reports vpr"
        "  INNER JOIN (SELECT vehicle_id, MAX(id) lid"
        "                FROM vehicle_precautionary_reports"
        "               WHERE deleted_at IS NULL AND vehicle_id IN (%s)"
        "               GROUP BY vehicle_id) l ON l.lid = vpr.id"
        % ",".join(str(i) for i in ids))
    linhas = [dict(zip(("vehicle_id", "laudo_id", "situacao", "url"), r))
              for r in cur.fetchall()]
    cx.close()
    return len(ids), linhas


def baixa_e_extrai(base, l):
    destino = os.path.join(SAIDA, base, "%s.txt" % l["vehicle_id"])
    if os.path.exists(destino):
        return "ja", destino
    ext = l["url"].rsplit(".", 1)[-1].lower()
    if ext != "pdf":
        return "nao-pdf:" + ext, None
    fd, tmp = tempfile.mkstemp(suffix=".pdf")
    os.close(fd)
    try:
        with urllib.request.urlopen(l["url"], timeout=180) as r, open(tmp, "wb") as out:
            while True:
                b = r.read(1 << 20)
                if not b:
                    break
                out.write(b)
        p = subprocess.run(["pdftotext", "-layout", "-enc", "UTF-8", tmp, destino + ".part"],
                           capture_output=True)
        if p.returncode != 0:
            return "pdftotext-falhou", None
        os.replace(destino + ".part", destino)
        n = os.path.getsize(destino)
        return ("ok" if n > 200 else "sem-texto"), destino
    except Exception as e:
        return "erro:" + type(e).__name__, None
    finally:
        if os.path.exists(tmp):
            os.remove(tmp)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--por-base", type=int, required=True)
    ap.add_argument("--semente", type=int, default=20261014)
    ap.add_argument("--paralelo", type=int, default=8)
    a = ap.parse_args()

    indice = []
    for base in BASES:
        os.makedirs(os.path.join(SAIDA, base), exist_ok=True)
        n_vendas, laudos = laudos_da_base(base)
        laudos = [l for l in laudos if l["url"]]
        laudos.sort(key=lambda l: l["vehicle_id"])
        escolhidos = random.Random(a.semente).sample(laudos, min(a.por_base, len(laudos)))
        print("%s: %d vendas, %d com laudo, %d sorteados" % (base, n_vendas, len(laudos),
                                                           len(escolhidos)), flush=True)
        feitos = 0
        with ThreadPoolExecutor(a.paralelo) as ex:
            fut = {ex.submit(baixa_e_extrai, base, l): l for l in escolhidos}
            for f in as_completed(fut):
                l = fut[f]
                st, _ = f.result()
                feitos += 1
                indice.append({"base": base, "vehicle_id": l["vehicle_id"],
                                "laudo_id": l["laudo_id"], "situacao_banco": l["situacao"] or "",
                                "status_coleta": st, "url": l["url"]})
                if feitos % 100 == 0:
                    print("  %s %d/%d" % (base, feitos, len(escolhidos)), flush=True)

    with open(os.path.join(SAIDA, "indice.csv"), "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=list(indice[0].keys()), delimiter=";")
        w.writeheader()
        w.writerows(sorted(indice, key=lambda x: (x["base"], x["vehicle_id"])))
    cont = {}
    for i in indice:
        k = (i["base"], i["status_coleta"].split(":")[0])
        cont[k] = cont.get(k, 0) + 1
    for k in sorted(cont):
        print(k, cont[k])


if __name__ == "__main__":
    main()
