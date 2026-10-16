"""Baixa os PDFs de laudo cautelar listados num CSV de nao vendidos.

    python automations/precificacao/laudos/baixa-laudos.py nao-vendidos-2026-10.csv --amostra 50
    python automations/precificacao/laudos/baixa-laudos.py nao-vendidos-2026-10.csv --todos

A amostra e estratificada por `laudo_situacao` (fatias iguais) e tem semente
fixa: rodar de novo devolve os mesmos veiculos. Arquivo ja baixado e pulado.
Os PDFs (~17 MB em media, medido em 14/10) ficam fora do git.
"""
import argparse
import csv
import os
import random
import sys
import urllib.request
from collections import defaultdict

AQUI = os.path.dirname(os.path.abspath(__file__))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("csv")
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--amostra", type=int)
    g.add_argument("--todos", action="store_true")
    ap.add_argument("--semente", type=int, default=20261014)
    a = ap.parse_args()

    caminho = a.csv if os.path.isabs(a.csv) else os.path.join(AQUI, a.csv)
    with open(caminho, encoding="utf-8-sig") as fh:
        linhas = [l for l in csv.DictReader(fh, delimiter=";") if l["laudo_url"]]

    if a.todos:
        escolhidos = linhas
    else:
        por_sit = defaultdict(list)
        for l in linhas:
            por_sit[l["laudo_situacao"] or "(vazio)"].append(l)
        rnd = random.Random(a.semente)
        # fatia pequena entrega o que tem; a sobra vai para as outras
        sits = sorted(por_sit, key=lambda s: len(por_sit[s]))
        escolhidos, resta = [], a.amostra
        for i, s in enumerate(sits):
            n = min(resta // (len(sits) - i), len(por_sit[s]))
            escolhidos += rnd.sample(por_sit[s], n)
            resta -= n

    base = os.path.splitext(os.path.basename(caminho))[0]
    pasta = os.path.join(AQUI, base + ("-todos" if a.todos else "-amostra"))
    os.makedirs(pasta, exist_ok=True)

    with open(os.path.join(pasta, "indice.csv"), "w", newline="", encoding="utf-8-sig") as fh:
        w = csv.DictWriter(fh, fieldnames=list(escolhidos[0].keys()), delimiter=";")
        w.writeheader()
        w.writerows(escolhidos)

    falhas = 0
    for i, l in enumerate(escolhidos, 1):
        destino = os.path.join(pasta, l["arquivo_laudo"])
        if os.path.exists(destino) and os.path.getsize(destino) > 0:
            continue
        try:
            with urllib.request.urlopen(l["laudo_url"], timeout=120) as r, open(destino + ".part", "wb") as out:
                while True:
                    bloco = r.read(1 << 20)
                    if not bloco:
                        break
                    out.write(bloco)
            os.replace(destino + ".part", destino)
            print("%d/%d %s %.1f MB" % (i, len(escolhidos), l["arquivo_laudo"], os.path.getsize(destino) / 1e6), flush=True)
        except Exception as e:
            falhas += 1
            print("%d/%d FALHOU %s: %s" % (i, len(escolhidos), l["arquivo_laudo"], type(e).__name__), file=sys.stderr, flush=True)

    print("pasta: %s | %d arquivos | %d falhas" % (pasta, len(escolhidos), falhas))


if __name__ == "__main__":
    main()
