# -*- coding: utf-8 -*-
"""LOTE 1d — sobre o 1b VALIDADO. Corrige o que derrubou o 1c.

O 1c falhou porque kpi_ofertas / kpi_status2, mesmo separadas, sao caras:
`COUNT(*) FROM offers WHERE buyer_user_id IN (29.002 ids)` varre offers
inteira, e IN com tabela derivada e o pior formato pro otimizador.

E7.  Paginacao pelas linhas reais medidas na 48417 (so REDUZ paginas —
     mudanca segura, ja que 680 das 1.440 chamadas voltaram vazias).

E10. status2 sai de graca: o PC ja varre advertisement_negotiations com
     status IN (2,3,7) agrupado por comprador. Um COUNT condicional a mais
     usa A MESMA varredura. Zero query nova, zero custo relevante.

E11. total_ofertas com INNER JOIN no lugar do IN.
     EQUIVALENCIA: BASE devolve 1 linha por usuario (SELECT u.id FROM users
     u WHERE ... EXISTS(...)), entao o join NAO pode duplicar oferta. O
     COUNT e identico ao da versao com IN — muda o plano, nao o resultado.
     Esta e a unica linha de SQL escrita por mim neste lote.
"""
import io, os, re, sys, hashlib
sys.stdout.reconfigure(encoding="utf-8")

HERE = os.path.dirname(os.path.abspath(__file__))
LOTE1B = r"C:\Users\thoma\Documents\work-brain\automations\n8n-sdk\montar-queries-LOTE1b-coorte.js"
src = io.open(LOTE1B, encoding="utf-8").read()
print("base: lote 1b (validado na 48417) — %d chars md5 %s\n" % (
    len(src), hashlib.md5(src.encode()).hexdigest()))

# ── E7 ────────────────────────────────────────────────────────────────
MEDIDO = {"rx_totais": 82, "rx_modelo": 212, "rx_laudo": 105, "rx_uf": 157,
          "rx_faixa": 121, "rx_partic": 153, "rx_buyers": 25}
a = b = 0
for nome, novo in MEDIDO.items():
    m = re.search(r"(pushPaged\('" + nome + r"',\s*\n.*?,\s*\n\s*)(\d+)(\);)", src, re.S)
    assert m, nome
    a += int(m.group(2)); b += novo
    src = src[:m.start(2)] + str(novo) + src[m.end(2):]
print("E7  paginas rx: %d -> %d (-%d chamadas)" % (a, b, a - b))

# ── E10: neg2 no PC + status2 nas METRICS ────────────────────────────
alvo_pc = '  " COUNT(DISTINCT CASE WHEN an.status = 7 THEN an.id END) neg7," +\n'
assert src.count(alvo_pc) == 1, "linha neg7 do PC nao encontrada"
src = src.replace(alvo_pc, alvo_pc +
    '  " COUNT(DISTINCT CASE WHEN an.status = 2 THEN an.id END) neg2," +\n')
print("E10 PC ganhou neg2 (mesma varredura do neg7)")

alvo_met = '  " COALESCE(SUM(pc.neg),0) negociacoes, COALESCE(SUM(pc.neg7),0) vendido," +\n'
assert src.count(alvo_met) == 1, "linha de METRICS nao encontrada"
src = src.replace(alvo_met, alvo_met +
    '  " COALESCE(SUM(pc.neg2),0) status2," +\n')
print("E10 METRICS ganhou status2")

# ── E11: total_ofertas por JOIN ──────────────────────────────────────
BLOCO = '''
/* [lote 1d] total_ofertas — o unico KPI que nao sai da coorte (contagem
   bruta de ofertas, nao de compradores). A versao original usava
   `IN (SELECT user_id FROM (BASE) bb)`, que na escala da plataforma
   estourou o deadline do MCP (execucao 48429). Trocado por INNER JOIN.
   EQUIVALENCIA: BASE devolve 1 linha por usuario, entao o join nao
   duplica oferta nenhuma — mesmo COUNT, plano de execucao diferente. */
pushPaged('kpi_ofertas',
  "SELECT COUNT(*) as total_ofertas FROM offers o" +
  " INNER JOIN (" + BASE + ") bb ON bb.user_id = o.buyer_user_id" +
  " WHERE o.deleted_at IS NULL",
  1);

'''
anc = "pushPaged('coorte',"
i = src.index(anc)
fim = src.index("  3);", i) + len("  3);\n")
src = src[:fim] + BLOCO + src[fim:]
print("E11 kpi_ofertas inserida (INNER JOIN)")

# ── E9': ordem da fila ───────────────────────────────────────────────
old = ("const Q_ORD = Q.filter(function(q){ return q.queryName === 'coorte'; })\n"
       "  .concat(Q.filter(function(q){ return q.queryName !== 'coorte'; }));")
assert src.count(old) == 1
src = src.replace(old,
    "const PRIMEIRO = ['coorte', 'kpi_ofertas'];\n"
    "const Q_ORD = Q.filter(function(q){ return PRIMEIRO.indexOf(q.queryName) >= 0; })\n"
    "  .concat(Q.filter(function(q){ return PRIMEIRO.indexOf(q.queryName) < 0; }));")
print("E9' coorte + kpi_ofertas na frente da fila")

out = os.path.join(HERE, "montar_queries_lote1d.js")
io.open(out, "w", encoding="utf-8", newline="").write(src)
print("\ngravado: %s\n%d chars md5 %s" % (out, len(src), hashlib.md5(src.encode()).hexdigest()))
