# -*- coding: utf-8 -*-
"""LOTE 1 — familia "Todos os whitelabels".

Transformacao MECANICA do Montar Queries de producao. Tres edicoes, so.
Tudo o mais e byte-identico ao original — nenhuma query e reescrita.

  E1. BASE deixa de filtrar whitelabel_id = 43 e passa a usar EXISTS,
      pra nao duplicar quem esta em varios whitelabels (user_whitelabels
      e N:N; com INNER JOIN sem filtro, o COUNT(*) do kpi dobraria).
  E2. evol_media_oferta perde o "AND s.whitelabel_id = 43" inline —
      e metrica de INVENTARIO, entao em modo "Todos" cobre a plataforma.
  E3. paginas do rx_ x8,8 (240 -> 2.105 compradores distintos) + folga.

As 19 agregadas NAO ganham pagina: agregam por mes / UF / situacao /
LIMIT 10, dimensoes que nao crescem com o numero de whitelabels.
"""
import io, os, re, sys, hashlib
sys.stdout.reconfigure(encoding="utf-8")

HERE = os.path.dirname(os.path.abspath(__file__))
ORIG = r"C:\Users\thoma\Documents\work-brain\automations\n8n-sdk\nodes-originais\Montar_Queries.js"
src = io.open(ORIG, encoding="utf-8").read()
print("original: %d chars  md5 %s" % (len(src), hashlib.md5(src.encode()).hexdigest()))
print()

edicoes = []

# ── E1: BASE ───────────────────────────────────────────────────────────
BASE_ANTIGA = ('const BASE = "SELECT u.id as user_id FROM users u INNER JOIN user_whitelabels uw '
               'ON uw.user_id = u.id AND uw.whitelabel_id = 43 WHERE u.deleted_at IS NULL AND '
               'u.internal_user = 0 AND u.email NOT REGEXP '
               "'(@cars2you|@datapage|@icarros|@itau|@teste|@dnr[.]com[.]br|@maisquecliente|@dealersclub|@c6bank[.]com)'"
               '";')
assert src.count(BASE_ANTIGA) == 1, "BASE nao encontrada verbatim"
BASE_NOVA = ('/* MULTI-WL: aqui havia um INNER JOIN em user_whitelabels preso ao WL 43.\n'
             '   O EXISTS troca o join por teste de existencia — sem ele, quem esta\n'
             '   em varios whitelabels apareceria N vezes e o COUNT(*) do kpi\n'
             '   contaria repetido (user_whitelabels e N:N). */\n'
             'const BASE = "SELECT u.id as user_id FROM users u WHERE u.deleted_at IS NULL AND '
             'u.internal_user = 0 AND u.email NOT REGEXP '
             "'(@cars2you|@datapage|@icarros|@itau|@teste|@dnr[.]com[.]br|@maisquecliente|@dealersclub|@c6bank[.]com)'"
             ' AND EXISTS(SELECT 1 FROM user_whitelabels uw0 WHERE uw0.user_id = u.id)";')
src = src.replace(BASE_ANTIGA, BASE_NOVA)
edicoes.append("E1 BASE: whitelabel_id=43 -> EXISTS (base distinta da plataforma)")

# ── E2: evol_media_oferta ──────────────────────────────────────────────
MEDIA_ANTIGA = "INNER JOIN shops s ON s.id = a.shop_id AND s.whitelabel_id = 43 "
assert src.count(MEDIA_ANTIGA) == 1, "join de inventario nao encontrado"
src = src.replace(MEDIA_ANTIGA, "INNER JOIN shops s ON s.id = a.shop_id ")
edicoes.append("E2 evol_media_oferta: tira o filtro de WL do inventario")

# ── E3: paginas do rx_ ────────────────────────────────────────────────
NOVAS = {"rx_totais": (23, 140), "rx_modelo": (54, 320), "rx_laudo": (31, 190),
         "rx_uf": (41, 250), "rx_faixa": (34, 210), "rx_partic": (41, 250),
         "rx_buyers": (10, 60)}
for nome, (antes, depois) in NOVAS.items():
    m = re.search(r"(pushPaged\('" + nome + r"',\s*\n.*?,\s*\n\s*)(\d+)(\);)", src, re.S)
    assert m and int(m.group(2)) == antes, (nome, m.group(2) if m else None)
    src = src[:m.start(2)] + str(depois) + src[m.end(2):]
    edicoes.append("E3 %s: %d -> %d paginas" % (nome, antes, depois))

for e in edicoes:
    print(" ", e)

# ── provas ────────────────────────────────────────────────────────────
print()
print("PROVAS:")
print("  'whitelabel_id = 43' restante :", src.count("whitelabel_id = 43"), "(tem que ser 0)")
print("  'whitelabel_id=43'   restante :", src.count("whitelabel_id=43"), "(tem que ser 0)")
assert src.count("whitelabel_id = 43") == 0 and src.count("whitelabel_id=43") == 0

# nenhuma query foi reescrita: os nomes e a contagem de Q.push/pushPaged batem
orig = io.open(ORIG, encoding="utf-8").read()
for pat, label in [(r"Q\.push\(\{ queryName: '(\w+)'", "Q.push"),
                   (r"pushPaged\('(\w+)'", "pushPaged")]:
    a = re.findall(pat, orig)
    b = re.findall(pat, src)
    print("  %-10s nomes iguais: %s  (%d)" % (label, a == b, len(b)))
    assert a == b

out = os.path.join(HERE, "montar_queries_todos.js")
io.open(out, "w", encoding="utf-8", newline="").write(src)
print()
print("gravado: %s | %d chars  md5 %s" % (out, len(src), hashlib.md5(src.encode()).hexdigest()))
