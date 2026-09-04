# -*- coding: utf-8 -*-
"""Dimensiona o sharding da coorte_wl a partir de dados REAIS.

A coorte_wl estourou o deadline (execucao 48476, 67s). Duas causas somadas:
  a) o GROUP BY por (wl, nome, ym) sobre a derivada BEXT gera tabela temporaria
     grande, e a derivada nao tem indice;
  b) LIMIT/OFFSET recalcula o resultado INTEIRO a cada pagina e descarta —
     16 paginas = 16 varreduras completas.

Ideia: fatiar por FAIXA de whitelabel_id (`BETWEEN a AND b`), que e sargavel e
usa indice, em vez de paginar por OFFSET. Cada consulta enxerga uma fracao do
universo, e as paginas dentro da fatia so recalculam aquela fatia.

Este script mede, do coorte_wl.json do prototipo, quantas linhas cada faixa
produz — pra escolher os cortes e o numero de paginas SEM chutar.
"""
import io, json, os, sys, collections
sys.stdout.reconfigure(encoding="utf-8")

P = r"C:\Users\thoma\Documents\work-brain\automations\prototipo-safra\dados\coorte_wl.json"
rows = json.load(io.open(P, encoding="utf-8"))

porWl = collections.Counter()
for r in rows:
    porWl[int(r["wl_id"])] += 1

ids = sorted(porWl)
print("universo: %d whitelabels, ids de %d a %d, %d linhas no total"
      % (len(ids), ids[0], ids[-1], sum(porWl.values())))
print()
print("os 8 whitelabels com mais safras:")
for w, n in porWl.most_common(8):
    print("   WL %-3d %3d linhas" % (w, n))
print()

PAGE = 50
for corte in (5, 8, 10, 16, 20):
    faixas = []
    ini = 1
    while ini <= ids[-1]:
        fim = ini + corte - 1
        n = sum(v for k, v in porWl.items() if ini <= k <= fim)
        if n:
            faixas.append((ini, fim, n))
        ini = fim + 1
    maxlin = max(f[2] for f in faixas)
    pgs = sum(max(1, -(-f[2] // PAGE)) for f in faixas)
    # margem de 1,5x na pagina, como o codigo original faz
    pgs_folga = sum(max(1, -(-int(f[2] * 1.5) // PAGE)) for f in faixas)
    print("faixa de %-2d ids -> %2d fatias | maior fatia %3d linhas (%d pgs) | total %2d pgs (%d c/ folga)"
          % (corte, len(faixas), maxlin, -(-maxlin // PAGE), pgs, pgs_folga))

print()
print("=== detalhe da opcao escolhida: faixas de 10 ===")
ini = 1
total_pg = 0
plano = []
while ini <= ids[-1]:
    fim = ini + 9
    n = sum(v for k, v in porWl.items() if ini <= k <= fim)
    if n:
        pg = max(1, -(-int(n * 1.6) // PAGE))
        total_pg += pg
        plano.append((ini, fim, n, pg))
        wls = sorted(k for k in porWl if ini <= k <= fim)
        print("  %2d-%-3d  %3d linhas  %d pg(s)   WLs: %s"
              % (ini, fim, n, pg, ",".join(map(str, wls))))
    ini = fim + 1
print("  TOTAL: %d consultas (era 16 paginas de OFFSET sobre o universo inteiro)" % total_pg)
print()
print("Cada consulta enxerga <= 10 whitelabels em vez dos 58.")
print("Ganho esperado: a temporaria do GROUP BY cai pra ~1/6, e o OFFSET so")
print("recalcula dentro da fatia — nao o universo.")
