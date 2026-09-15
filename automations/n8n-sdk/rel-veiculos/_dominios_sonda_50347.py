# -*- coding: utf-8 -*-
"""Registra a sonda 50347 e CORRIGE o que a sonda 50346 me fez concluir errado.

A 50346 mediu tres tabelas comecando em 2025-08-31/09-02 e eu generalizei
para "o banco so tem um ano de historico". `offers` vai a 2020-06-24. A
generalizacao estava errada e mudava uma conclusao pratica: "nunca ofertou"
E verificavel; so "nunca acessou" nao e.

GRAVACAO ATOMICA: `io.open(P, "w")` trunca na abertura.

    python _dominios_sonda_50347.py
"""
import io
import os
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

P = os.path.join("C:\\", "Users", "thoma", "Documents", "work-brain",
                 "context", "banco-de-dados", "dominios.md")
s = io.open(P, encoding="utf-8").read()
orig = s

# ── 1. CORRECAO: o titulo generalizava demais ────────────────────────────
velho_titulo = "## \u23f3 O banco s\u00f3 tem cerca de UM ANO de hist\u00f3rico"
novo_titulo = "## \u23f3 Tr\u00eas tabelas s\u00f3 t\u00eam cerca de UM ANO de hist\u00f3rico \u2014 mas `offers` n\u00e3o"
if s.count(velho_titulo) != 1:
    raise SystemExit("ancora do titulo nao encontrada")
s = s.replace(velho_titulo, novo_titulo, 1)

velho_conseq = """\U0001F6A8 **Consequ\u00eancia dura: \"nunca acessou\" e \"nunca comprou\" n\u00e3o s\u00e3o verific\u00e1veis.**
O que o banco sabe dizer \u00e9 \"n\u00e3o acessou desde 31/08/2025\". Qualquer
segmenta\u00e7\u00e3o que tenha uma faixa \"nunca\" est\u00e1, na pr\u00e1tica, medindo \"n\u00e3o nos
\u00faltimos 12 meses\" \u2014 e precisa dizer isso na tela, senão promete uma certeza
que o dado n\u00e3o tem."""

novo_conseq = """\u26a0\ufe0f **Corrigido em 2026-09-11 (sonda 50347): isto vale para essas tr\u00eas
tabelas, N\u00c3O para o banco todo.** `offers` come\u00e7a em **2020-06-24**, com
749.109 ofertas. A generaliza\u00e7\u00e3o anterior ("o banco s\u00f3 tem um ano") estava
errada e mudava uma conclus\u00e3o pr\u00e1tica:

| pergunta | verific\u00e1vel? |
|---|---|
| "nunca **ofertou**" | \u2705 sim \u2014 `offers` cobre 6 anos |
| "nunca **acessou**" | \u274c n\u00e3o \u2014 s\u00f3 "n\u00e3o desde 31/08/2025" |
| "nunca **comprou**" | \u274c n\u00e3o \u2014 `transactions` s\u00f3 desde 02/09/2025 |

\U0001F6A8 Qualquer segmenta\u00e7\u00e3o com faixa "nunca acessou" est\u00e1 medindo "n\u00e3o nos
\u00faltimos 12 meses" e precisa dizer isso na tela, sen\u00e3o promete uma certeza que
o dado n\u00e3o tem."""

if s.count(velho_conseq) != 1:
    raise SystemExit("ancora da consequencia nao encontrada (%d)" % s.count(velho_conseq))
s = s.replace(velho_conseq, novo_conseq, 1)
print("  ok  correcao do horizonte aplicada")

# ── 2. CORRECAO: o e-mail existe, so nao em `shops` ──────────────────────
velho_email = """\u26a0\ufe0f Telefone \u00e9 coluna utiliz\u00e1vel; **e-mail n\u00e3o \u00e9**. Uma coluna de e-mail no
relat\u00f3rio sairia vazia em 19 de cada 20 linhas. Se o e-mail for necess\u00e1rio, a
fonte prov\u00e1vel \u00e9 `users` via `user_shops`, que ainda n\u00e3o foi medida."""

novo_email = """\u26a0\ufe0f Telefone \u00e9 coluna utiliz\u00e1vel; **e-mail em `shops` n\u00e3o \u00e9**.

\u2705 **O e-mail existe \u2014 em `users`, via `user_shops`** (medido na sonda 50347):

| medida | valor |
|---|---:|
| lojas da base com usu\u00e1rio vinculado | 1.291 de 1.298 |
| lojas com pelo menos um e-mail | **1.291 (99,5%)** |
| usu\u00e1rios vinculados | 1.534 |
| usu\u00e1rios com e-mail | 1.534 (100%) |

**5,8% em `shops` contra 99,5% em `users`.** A fonte do e-mail de loja \u00e9
`users`, sem d\u00favida.

\u26a0\ufe0f 1,19 usu\u00e1rio por loja \u2014 a maioria tem um s\u00f3, mas parte tem v\u00e1rios, ent\u00e3o
"o e-mail da loja" exige regra de desempate. `user_shops.function` **n\u00e3o
serve**: est\u00e1 nulo em 15.994 dos 20.634 v\u00ednculos. Usar **menor `user_id`**,
pelo mesmo motivo que a moda usa `MIN(item_id)`: \u00e9 determin\u00edstico entre runs."""

if s.count(velho_email) != 1:
    raise SystemExit("ancora do e-mail nao encontrada")
s = s.replace(velho_email, novo_email, 1)
print("  ok  correcao do e-mail aplicada")

# ── 3. secao nova ────────────────────────────────────────────────────────
ancora = "## Ainda sem decodificar"
if s.count(ancora) != 1:
    raise SystemExit("ancora '## Ainda sem decodificar' ausente ou ambigua")

secao = """## `shops.situation` \u2014 seis valores, e s\u00f3 um opera

Medido na sonda **50347**, nas 21.188 lojas dos seis canais:

| situation | lojas | com oferta em 6M |
|---:|---:|---:|
| **3** | 17.250 | **1.285** |
| 1 | 3.419 | 0 |
| 2 | 442 | 0 |
| 5 | 37 | 5 |
| 6 | 24 | 8 |
| 4 | 16 | 0 |

`3` \u00e9 o estado operante: 99% das lojas que ofertam est\u00e3o nele. `1`, `2` e `4`
somam **3.877 lojas com zero oferta** \u2014 provavelmente cadastro em andamento ou
encerrado. `5` e `6` s\u00e3o residuais mas **ofertam**, ent\u00e3o n\u00e3o s\u00e3o in\u00f3cuos.

\u26a0\ufe0f "Lojas ativas" n\u00e3o tem defini\u00e7\u00e3o \u00fanica no banco. Se a inten\u00e7\u00e3o for
`situation = 3`, dizer isso explicitamente \u2014 e lembrar que 13 lojas da base
(5 + 8) ficariam de fora.

## `user_shops.function` \u2014 medido, e n\u00e3o serve para escolher contato

Medido na sonda **50347**. 13 valores em 20.634 v\u00ednculos, mas **15.994 (77%)
s\u00e3o `NULL`**. Curiosidade \u00fatil: a fun\u00e7\u00e3o `23` tem 958 v\u00ednculos e apenas **9**
usu\u00e1rios com e-mail, contra quase 100% nas outras \u2014 \u00e9 outro tipo de usu\u00e1rio.

Conclus\u00e3o pr\u00e1tica: **n\u00e3o d\u00e1 para usar `function` como "este \u00e9 o contato da
loja"**. Para escolher um e-mail entre v\u00e1rios, usar menor `user_id`.

## Segmenta\u00e7\u00e3o de loja por recência: a base avaliada n\u00e3o segmenta

Medido na sonda **50347** com a regra de sete faixas do Thomas, trocando
"comprou" por "ofertou".

| # | categoria | na base (1.298) | no universo (21.188) |
|---:|---|---:|---:|
| 1 | Diamante \u2014 ofertou \u2264 30d | 665 (51,2%) | 665 (3,1%) |
| 2 | Ouro \u2014 ofertou \u2264 6 meses | 617 (47,5%) | 617 (2,9%) |
| 3 | Prata \u2014 j\u00e1 ofertou, acessou \u2264 90d | 9 | 379 |
| 4 | Recupera\u00e7\u00e3o \u2014 j\u00e1 ofertou, sem acesso | 7 | 1.343 |
| 5 | Lead Quente \u2014 acessou, nunca ofertou | 0 | 1.432 |
| 6 | Lead Morno \u2014 sem acesso, nunca ofertou | 0 | 1.417 |
| 7 | Lead Frio \u2014 nunca acessou nem ofertou | 0 | 15.335 (72,4%) |

\U0001F6A8 **Na base do relat\u00f3rio a segmenta\u00e7\u00e3o \u00e9 degenerada: 98,8% cai em 1 ou 2.**
E \u00e9 por constru\u00e7\u00e3o \u2014 a base *\u00e9* "lojas que ofertaram nos \u00faltimos 6 meses",
ent\u00e3o nenhuma pode ser "nunca ofertou". Um campo com dois valores poss\u00edveis
n\u00e3o segmenta nada.

\u26a0\ufe0f As 16 lojas em 3 e 4 **n\u00e3o s\u00e3o exce\u00e7\u00e3o real**: s\u00e3o artefato de unidade. A
base usa 6 meses de calend\u00e1rio (184 dias nesta janela) e a faixa 2 usa
`INTERVAL 180 DAY`. Os 4 dias de diferen\u00e7a produzem as 16. Ao implementar,
usar a **mesma** defini\u00e7\u00e3o nos dois lugares.

Os sete s\u00f3 existem sobre o universo inteiro de lojas \u2014 \u00e9 l\u00e1 que a
segmenta\u00e7\u00e3o tem para onde variar.

"""

s = s.replace(ancora, secao + ancora, 1)
print("  ok  secao nova acrescentada")

tmp = P + ".tmp"
with io.open(tmp, "w", encoding="utf-8") as f:
    f.write(s)
os.replace(tmp, P)

print("dominios.md: %d -> %d chars" % (len(orig), len(s)))
