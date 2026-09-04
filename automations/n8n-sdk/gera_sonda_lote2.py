# -*- coding: utf-8 -*-
"""Monta o builder da SONDA: so as 15 queries _wl do lote 2, nada mais.

Por que uma sonda separada em vez de subir o lote 2 inteiro e ver no que da:
o lote 1f levou 13min32s. Subir o lote 2 completo e esperar significa descobrir
um timeout depois de ~19 minutos, e sem saber QUAL query estourou — porque
quando uma query passa do deadline o no inteiro falha e nao devolve nada
(execucao 48410). A sonda isola as 15 novas: ~430 chamadas em vez de 1.280, e o
resultado diz linha a linha quanto cada uma custou.

O texto das queries NAO e reescrito aqui — e recortado do
montar-queries-LOTE2-full-wl.js, que ja passou pelo prova_lote2.js.
"""
import io, os, sys, json, hashlib
sys.stdout.reconfigure(encoding="utf-8")

HERE = os.path.dirname(os.path.abspath(__file__))
LOTE2 = os.path.join(HERE, "montar-queries-LOTE2-full-wl.js")
src = io.open(LOTE2, encoding="utf-8").read()
print("base: lote 2 — md5 %s, %d chars\n" % (hashlib.md5(src.encode()).hexdigest(), len(src)))

def recorta(ini, fim, rotulo):
    """Recorta [ini, fim) do fonte, verbatim. Assert nas duas pontas."""
    assert src.count(ini) == 1, "ancora inicial nao unica: %r" % ini
    a = src.index(ini)
    b = src.index(fim, a)
    print("  + %-34s %5d chars" % (rotulo, b - a))
    return src[a:b]

print("recortes verbatim do lote 2:")

# 1. cabecalho: datas, BASE, UF_CASE, Q — tudo antes da primeira query
cabecalho = recorta("const now = new Date();", "Q.push({ queryName: 'recencia'", "cabecalho (datas, BASE, UF_CASE)")

# 2. BASEF — o filtro de usuario sem o SELECT, usado pelo baseWl()
basef = recorta('const BASEF = "u.deleted_at', "\nconst BEXT", "BASEF")

# 3. RX_PAGE + pushPaged — a maquinaria de paginacao
paginacao = recorta("const RX_PAGE = 50;", "/* ═════", "RX_PAGE + pushPaged()")

# 4. ANO_INI_WL — usado pelo baseWl(ano)
ano_ini = "const ANO_INI_WL = 2019;\n"
print("  + %-34s %5d chars" % ("ANO_INI_WL", len(ano_ini)))

# 5. o bloco do lote 2 inteiro
bloco = recorta("/* ══════════════════════════════════════════════════════════════════\n   [lote 2] baseWl()",
                "/* A coorte vai PRIMEIRO na fila.", "bloco do lote 2 (15 queries _wl)")

# Quais queries a sonda roda. Sem argumento: as 15. Com argumento: so as
# listadas — serve pra re-sondar o que foi corrigido sem repetir o que ja
# passou. A sonda 48571 provou 9 delas; repetir aquelas 216 chamadas seria
# gastar 9 minutos pra reconfirmar o que ja se sabe.
ALVO = sys.argv[1:] or [
    'recencia_wl', 'evol_login_wl', 'evol_oferta_wl', 'evol_compra_wl',
    'nr_login_wl', 'nr_oferta_wl', 'nr_compra_wl', 'evol_cadastro_dia_wl',
    'uf_cadastro_wl', 'uf_compra_wl', 'top_compradores_hist_wl',
    'top_compradores_ano_wl', 'top_acesso_ano_wl', 'top_ofertas_ano_wl',
    'rx_buyer_wl']
print("\nalvo da sonda: %d queries — %s" % (len(ALVO), ', '.join(ALVO)))

RODAPE = '''
/* ─── SONDA ────────────────────────────────────────────────────────────
   So as queries listadas. As globais e as rx_ ficam de fora: elas ja rodaram
   na 48492 e o que se quer medir aqui e o custo NOVO.
   A ordem e a do lote 2 — se estourar, estoura na mesma sequencia. */
const SONDA = __ALVO__;

const ordem = {};
SONDA.forEach(function (n, i) { ordem[n] = i; });

const Q_SONDA = Q.filter(function (q) { return ordem[q.queryName] !== undefined; })
  .sort(function (a, b) { return ordem[a.queryName] - ordem[b.queryName]; });

if (Q_SONDA.length === 0) throw new Error('sonda vazia — nenhuma query _wl encontrada');

return Q_SONDA.map(function (q, i) {
  return { json: { queryName: q.queryName, database: q.database, sql: q.sql, idx: i, total: Q_SONDA.length } };
});
'''

RODAPE = RODAPE.replace('__ALVO__', json.dumps(ALVO))

out_js = cabecalho + basef + "\n\n" + paginacao + "\n" + ano_ini + bloco + RODAPE

# provas antes de gravar
NOVAS = ALVO
print("\nprovas:")
for n in NOVAS:
    # os 4 rankings entram pelo helper topWl(), nao por pushPaged literal
    assert ("pushPaged('%s'," % n in out_js) or ("topWl('%s'," % n in out_js), \
        "query ausente na sonda: %s" % n
print("  ok  as %d queries _wl estao no recorte" % len(NOVAS))

for proibida in ["pushPaged('rx_totais'", "queryName: 'recencia'", "pushPaged('coorte'"]:
    assert proibida not in out_js, "a sonda arrastou query que nao devia: %s" % proibida
print("  ok  nenhuma query global ou rx_ entrou junto")

for dep in ["const BASE ", "const BASEF", "const UF_CASE", "function pushPaged",
            "const MES_INICIO", "const HOJE_MENOS_29D", "const ANO_INI_WL", "const Q = []"]:
    assert dep in out_js, "dependencia ausente: %s" % dep
    assert out_js.index(dep) < out_js.index("function baseWl("), "%s depois de baseWl()" % dep
print("  ok  as 8 dependencias estao presentes e antes do bloco")

out = os.path.join(HERE, "sonda-lote2-queries.js")
io.open(out, "w", encoding="utf-8", newline="").write(out_js)
print("\ngravado: %s" % os.path.basename(out))
print("%d chars — md5 %s" % (len(out_js), hashlib.md5(out_js.encode()).hexdigest()))
