# -*- coding: utf-8 -*-
"""O montar-html.js passa a NAO terminar em quebra de linha, e uma prova trava isso.

O QUE ACONTECEU: a transcricao do montar-html.js saiu com 73.251 de 73.252
caracteres corretos. A unica diferenca era o ULTIMO byte -- a quebra de linha
final, que eu nao escrevi no fim da string.

POR QUE NAO RETRANSCREVER: reenviar 73 KB digitados a mao para corrigir um
caractere troca um erro conhecido e inofensivo por uma chance real de erro
novo em lugar desconhecido. A transcricao anterior acertou 73.251 caracteres;
a proxima pode nao acertar.

POR QUE NAO IGNORAR: o conferidor perderia o sentido. Foi essa a licao das
reguas de comentario hoje mesmo -- conferidor que acusa divergencia
inofensiva em todo run e conferidor que se aprende a ignorar, e ai ele nao
pega a que importa.

ENTAO: o arquivo local passa a nao ter quebra final, e `prova-local.js` ganha
uma prova que exige isso. Se um editor recolocar a quebra, a falha aparece
LOCALMENTE, em segundos, antes de qualquer run -- e nao na conferencia de
transcricao depois de um upload de 73 KB.

Nao vale para os outros nos: `montar-fase1.js`, `montar-fase2.js` e
`virar-arquivo.js` terminam em quebra e conferem byte a byte com o n8n,
porque nesses eu escrevi o \\n final. O n8n preserva a quebra; quem a perdeu
fui eu.

    python _sem_quebra_final.py
"""
import io
import os
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

AQUI = os.path.dirname(os.path.abspath(__file__))

# ── 1. tira a quebra final do montar-html.js ─────────────────────────────
P = os.path.join(AQUI, "montar-html.js")
s = io.open(P, encoding="utf-8").read()

if not s.endswith("\n"):
    print("  --  montar-html.js ja nao termina em quebra")
else:
    novo = s.rstrip("\n")
    tmp = P + ".tmp"
    with io.open(tmp, "w", encoding="utf-8", newline="") as f:
        f.write(novo)
    os.replace(tmp, P)
    print("  ok  montar-html.js: %d -> %d chars (quebra final removida)"
          % (len(s), len(novo)))

# ── 2. a prova que trava a invariante ────────────────────────────────────
PP = os.path.join(AQUI, "prova-local.js")
p = io.open(PP, encoding="utf-8").read()

ancora = "const nBarras = (semComent.match(/\\\\/g) || []).length;"
if p.count(ancora) != 1:
    raise SystemExit("ancora da contagem de barras nao encontrada (%d)" % p.count(ancora))

prova = """/* O arquivo NAO pode terminar em quebra de linha.

   Motivo concreto: a transcricao do montar-html.js para o n8n saiu com
   73.251 de 73.252 caracteres corretos, e a unica diferenca era a quebra
   final. Reenviar 73 KB digitados a mao por causa de um caractere troca um
   erro conhecido e inofensivo por uma chance real de erro novo -- entao o
   arquivo local se alinhou ao no.

   Esta prova existe para a decisao nao se desfazer sozinha: editor que
   recoloca a quebra final faz a conferencia de transcricao acusar
   divergencia depois de um upload de 73 KB. Aqui a falha aparece em
   segundos, antes de rodar qualquer coisa. */
ok(!fonteHtml.endsWith('\\n'),
   'montar-html.js nao termina em quebra de linha (alinhado byte a byte com o no)');

"""

p = p.replace(ancora, prova + ancora, 1)

tmp = PP + ".tmp"
with io.open(tmp, "w", encoding="utf-8") as f:
    f.write(p)
os.replace(tmp, PP)
print("  ok  prova-local.js: invariante travada")
