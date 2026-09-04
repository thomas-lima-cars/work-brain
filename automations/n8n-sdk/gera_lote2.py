# -*- coding: utf-8 -*-
"""LOTE 2 — whitelabel em TODAS as secoes do relatorio.

Metodo (o mesmo dos lotes 1d/1e/1f): le o lote 1f, que esta no ar e validado na
execucao 48492, e aplica transformacoes mecanicas com assert em cada uma.
Nenhuma query e reescrita de cabeca — o que existe e transformacao de texto.
O bloco novo vive em `_lote2_bloco.js`, como JS de verdade, pra ser lido e
revisado como codigo em vez de string dentro de string.

O PADRAO, herdado do lote 1f:
  a) a dimensao whitelabel entra por INNER JOIN em user_whitelabels, nunca por
     WHERE. Quem esta em N whitelabels tem de aparecer N vezes no recorte por
     WL e UMA vez no total — por isso cada secao passa a ter DUAS queries: a
     global (ja existente, INTOCADA, alimenta "Todos") e a _wl nova. Somar os
     WLs pra chegar no total daria numero inflado.
  b) onde o custo esta em materializar a base inteira, o recorte por ano de
     cadastro entra DENTRO da subquery, em coluna indexada.

O QUE NAO GANHA WHITELABEL, e por que:
  - evol_media_oferta: nao tem filtro de usuario nenhum. Sai de advertisements
    + shops — e metrica do lado da OFERTA, nao do cliente. Nao existe
    "whitelabel de um anuncio": a doc da casa e explicita em que a chave ali e
    advertisements.shop_id, e em que o Feirao C6 roda no mesmo WL 7 do IGA.
    Filtrar por whitelabel traria evento do Itau pra dentro do recorte do C6.
    Fica global; o HTML rotula os 3 graficos dela como "plataforma".
  - evol_cadastro: NAO ganha versao _wl e nao precisa. O `ym` da coorte_wl JA E
    o mes de cadastro — a serie por WL sai de graca no cliente, somando a
    coorte que ja esta embarcada. Uma query a menos.
  - rx_* (as 7 do Raio-X): INTOCADAS. Ja sao indexadas por buyer_user_id, entao
    o recorte se resolve no cliente com um mapa comprador->wl. Por ai, +1 query
    barata (rx_buyer_wl, 60 paginas). Por GROUP BY, seriam as 855 chamadas que
    o Raio-X ja faz, vezes 58.
"""
import io, os, sys, hashlib
sys.stdout.reconfigure(encoding="utf-8")

HERE = os.path.dirname(os.path.abspath(__file__))
LOTE1F = os.path.join(HERE, "montar-queries-LOTE1f-wl-por-ano.js")
BLOCO = os.path.join(HERE, "_lote2_bloco.js")

src = io.open(LOTE1F, encoding="utf-8").read()
MD5_1F = hashlib.md5(src.encode()).hexdigest()
assert MD5_1F == "8fe100bbf8a679971ebb39f4e1254f13", "lote 1f mudou — md5 %s" % MD5_1F
print("base:  lote 1f (no ar, validado na 48492) — md5 %s, %d chars" % (MD5_1F, len(src)))

bloco = io.open(BLOCO, encoding="utf-8").read()
print("bloco: _lote2_bloco.js — %d chars\n" % len(bloco))

edits = 0
def edit(label):
    global edits; edits += 1
    print("E%02d %s" % (edits, label))

# ── E01 ─ splice do bloco, antes da ordenacao da fila ───────────────────────
ANC = "/* A coorte vai PRIMEIRO na fila."
assert src.count(ANC) == 1, "ancora da fila nao unica"
i = src.index(ANC)
src = src[:i] + bloco + src[i:]
edit("bloco do lote 2 inserido antes da ordenacao da fila")

# ── E02 ─ ordem de declaracao: tudo que o bloco usa vem antes dele ──────────
POS = src.index("function baseWl(")
for nome in ["const BASEF", "const BASE ", "const UF_CASE", "function pushPaged",
             "const MES_INICIO", "const HOJE_MENOS_29D", "const ANO "]:
    assert nome in src, "declaracao ausente: %s" % nome
    assert src.index(nome) < POS, "%s declarado depois de baseWl()" % nome
edit("ordem de declaracao conferida (7 dependencias vem antes do bloco)")

# ── E03 ─ as _wl leves entram na frente da fila, atras da coorte ────────────
old = "const PRIMEIRO = ['coorte', 'coorte_wl', 'kpi_ofertas'];"
new = ("const PRIMEIRO = ['coorte', 'coorte_wl', 'kpi_ofertas',\n"
       "  /* [lote 2] as _wl entram logo atras da coorte: se uma query pesada\n"
       "     estourar o deadline la na frente, o no inteiro falha e nao devolve\n"
       "     nada (execucao 48410). O que e barato e colhido antes do risco. */\n"
       "  'recencia_wl', 'evol_login_wl', 'evol_oferta_wl', 'evol_compra_wl',\n"
       "  'nr_login_wl', 'nr_oferta_wl', 'nr_compra_wl', 'evol_cadastro_dia_wl',\n"
       "  'uf_cadastro_wl', 'uf_compra_wl', 'top_compradores_hist_wl',\n"
       "  'top_compradores_ano_wl', 'top_acesso_ano_wl', 'top_ofertas_ano_wl',\n"
       "  'rx_buyer_wl'];")
assert src.count(old) == 1
src = src.replace(old, new)
edit("fila reordenada — 15 queries _wl logo atras da coorte")

# ── E04 ─ prova: as globais nao foram tocadas ───────────────────────────────
orig = io.open(LOTE1F, encoding="utf-8").read()
GLOBAIS = ['recencia', 'evol_login', 'evol_oferta', 'evol_compra', 'evol_cadastro',
           'evol_cadastro_dia', 'evol_media_oferta', 'nr_login', 'nr_oferta',
           'nr_compra', 'uf_cadastro', 'uf_compra', 'top_compradores_hist',
           'top_compradores_ano', 'top_acesso_ano', 'top_ofertas_ano', 'top_lojas',
           'coorte', 'coorte_wl', 'kpi_ofertas',
           'rx_totais', 'rx_modelo', 'rx_laudo', 'rx_uf', 'rx_faixa', 'rx_partic',
           'rx_buyers']
def defs(txt, nome):
    """Conta DEFINICOES da query, nao mencoes do nome. O nome sozinho aparece
    tambem na fila PRIMEIRO, e 'coorte' e prefixo de 'coorte_wl' — as duas
    coisas ja produziram falso positivo aqui."""
    return txt.count("pushPaged('%s'," % nome) + txt.count("queryName: '%s'," % nome)

for g in GLOBAIS:
    a, b = defs(orig, g), defs(src, g)
    assert a == b and a > 0, "query global %s mudou de contagem (%d -> %d)" % (g, a, b)
edit("roundtrip: as %d queries globais seguem verbatim e na mesma contagem" % len(GLOBAIS))

# ── E05 ─ inventario das novas ──────────────────────────────────────────────
NOVAS = ['recencia_wl', 'evol_login_wl', 'evol_oferta_wl', 'evol_compra_wl',
         'evol_cadastro_dia_wl', 'nr_login_wl', 'nr_oferta_wl', 'nr_compra_wl',
         'uf_cadastro_wl', 'uf_compra_wl', 'top_compradores_hist_wl',
         'top_compradores_ano_wl', 'top_acesso_ano_wl', 'top_ofertas_ano_wl',
         'rx_buyer_wl']
for n in NOVAS:
    assert "'%s'" % n in src, "query nova ausente: %s" % n
edit("inventario: %d queries _wl presentes" % len(NOVAS))


# ── E06 ─ RECORTE DE WHITELABEL, na raiz da base ───────────────────────────
# Pedido de 04/09: o relatorio cobre 6 whitelabels, nao os 58.
#
# Aplicado no BASE/BASEF (o filtro de usuario que TODAS as 34 queries usam) e
# no join de baseWl(). Nao no cliente, por duas razoes:
#
#   1. "Todos" tem de significar a UNIAO dos 6, e uniao nao e soma: quem esta
#      em dois whitelabels contaria duas vezes. Filtrar no cliente somando os
#      recortes daria 18.703; a uniao real e menor. So o EXISTS no SQL conta
#      cada cliente uma vez.
#   2. O join de baseWl() precisa do filtro tambem — sem ele, um cliente que
#      esta no WL 7 (na lista) e no WL 20 (fora) geraria linha para o 20.
#
# Efeito colateral bem-vindo: a base encolhe, e as queries que estouravam o
# deadline passam a varrer bem menos. Vale re-testar os 4 rankings depois.
WL_ESCOPO = [
    (43, 'Canal de vendas C6 Auto'),
    (48, 'Colaboradores C6'),
    (62, 'Lance Facil BTB'),
    (65, 'Lance Facil BTB Associados'),
    (7,  'Marketplace Cars2You'),
    (4,  'Trucks2you'),
]
IDS = ', '.join(str(i) for i, _ in WL_ESCOPO)

# no BASE e no BASEF o filtro entra DENTRO do EXISTS que ja existe
velho_exists = "EXISTS(SELECT 1 FROM user_whitelabels uw0 WHERE uw0.user_id = u.id)"
novo_exists = ("EXISTS(SELECT 1 FROM user_whitelabels uw0 WHERE uw0.user_id = u.id"
               " AND uw0.whitelabel_id IN (" + IDS + "))")
antes = src.count(velho_exists)
assert antes >= 2, "esperava o EXISTS em BASE e BASEF, achei %d" % antes
src = src.replace(velho_exists, novo_exists)
edit("recorte de whitelabel no EXISTS de BASE/BASEF (%d ocorrencias)" % antes)

# a ativacao_wl tem o proprio join com user_whitelabels; o filtro entra pela
# constante, pra a lista de ids nao aparecer escrita duas vezes no arquivo
velho_fj = 'const FILTRO_WL_JOIN = "";'
novo_fj = 'const FILTRO_WL_JOIN = " AND uw.whitelabel_id IN (' + IDS + ')";'
assert src.count(velho_fj) == 1, "FILTRO_WL_JOIN nao encontrado no bloco"
src = src.replace(velho_fj, novo_fj)
edit("recorte de whitelabel na constante FILTRO_WL_JOIN (ativacao_wl)")

# e no join de baseWl(), senao aparece linha de WL fora da lista
velho_join = '" FROM users u INNER JOIN user_whitelabels uw ON uw.user_id = u.id" +'
novo_join = ('" FROM users u INNER JOIN user_whitelabels uw ON uw.user_id = u.id"'
             ' + " AND uw.whitelabel_id IN (' + IDS + ')" +')
assert src.count(velho_join) == 1, "join de baseWl nao encontrado"
src = src.replace(velho_join, novo_join)
edit("recorte de whitelabel no join de baseWl()")

# prova: nenhum EXISTS ficou sem o filtro
assert velho_exists not in src, "sobrou EXISTS sem recorte de whitelabel"
edit("prova: nenhum EXISTS ficou sem o recorte")

out = os.path.join(HERE, "montar-queries-LOTE2-full-wl.js")
io.open(out, "w", encoding="utf-8", newline="").write(src)
print("\ngravado: %s" % os.path.basename(out))
print("%d chars — md5 %s" % (len(src), hashlib.md5(src.encode()).hexdigest()))
