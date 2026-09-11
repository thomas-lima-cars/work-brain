# -*- coding: utf-8 -*-
r"""Tira as barras invertidas do montar-html.js. Todas, menos seis.

MOTIVO, medido hoje: este arquivo viaja pro n8n transcrito a mao como string
JSON, e as 248 sequencias de escape de aspas foram DOBRADAS nas duas
tentativas seguidas -- 568 barras no no em vez de 320, e o JS do cliente nem
compila. E a mesma classe de erro que derrubou a execucao 49963.

O fato que resolve: montar-fase1.js e montar-fase2.js tem ZERO barras e
passaram no diff byte a byte na primeira tentativa. O problema nao e falta de
cuidado, e o material.

Duas trocas, nenhuma delas cosmetica no efeito:

  1. Elemento de array que usa `\'` pra emitir aspa simples de atributo HTML
     passa a ser delimitado por CRASE. Dentro de template literal a aspa
     simples nao precisa de escape nenhum. Seguro aqui porque a fonte tem
     ZERO `${` e nenhum desses elementos contem crase (as 8 craseS do arquivo
     estao em comentario, fora de literal).

  2. `\\u00b7`, `\\u2014` e `\\u2197` viram os caracteres de verdade
     (·, — e ↗). Eles existiam pra o JS do cliente receber `·` e o
     navegador decodificar; com o documento em UTF-8, o caractere literal
     chega igual e ninguem precisa contar barras.

Sobram SEIS barras: dois `\n` do join e o `<\/` que quebra `</script>` dentro
do JSON embarcado. Seis eu confiro na mao; 320 eu nao.

PROVA DE EQUIVALENCIA: o HTML gerado antes e depois tem que ser identico,
exceto o timestamp `gerado_em`. Sem isso isto seria refatoracao no escuro.

    python _sem_barra_invertida.py
"""
import io
import os
import re
import sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

AQUI = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(AQUI, "montar-html.js")
s = io.open(P, encoding="utf-8").read()
orig = s
B = chr(92)
CRASE = chr(96)
APOS = chr(39)

if "${" in s:
    raise SystemExit("a fonte tem ${ -- crase deixaria de ser segura")

# 1) os escapes unicode viram o caractere de verdade
UNI = [(B + B + "u00b7", "·"), (B + B + "u2014", "—"),
       (B + B + "u2197", "↗")]
for velho, novo in UNI:
    n = s.count(velho)
    s = s.replace(velho, novo)
    print("  ok  %s -> %s  (%d ocorrencias)" % (velho, novo, n))

# 2) elemento de array com \' passa a usar crase
linhas = s.split("\n")
convertidas = 0
for i, ln in enumerate(linhas):
    if B + APOS not in ln:
        continue
    m = re.match(r"^(\s*)" + APOS + r"(.*)" + APOS + r"(,?)$", ln)
    if not m:
        raise SystemExit("linha com escape que nao casa o formato de elemento:\n" + ln)
    corpo = m.group(2)
    if CRASE in corpo:
        raise SystemExit("elemento com crase -- converter quebraria:\n" + ln)
    if APOS + "," in corpo or corpo.endswith(APOS):
        pass  # aspas internas sao permitidas; a crase delimita
    linhas[i] = m.group(1) + CRASE + corpo.replace(B + APOS, APOS) + CRASE + m.group(3)
    convertidas += 1
s = "\n".join(linhas)
print("  ok  %d elementos de array passaram a usar crase" % convertidas)

io.open(P, "w", encoding="utf-8").write(s)
print("")
print("barras restantes: %d  (esperado 6: dois \\n do join e o <\\/ do script)" % s.count(B))
print("mudou: " + str(s != orig))
