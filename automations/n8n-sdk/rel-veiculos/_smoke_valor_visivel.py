# -*- coding: utf-8 -*-
"""O smoke confere VALOR na tela, nao so a moldura.

Descoberto tentando sabotar o painel de proposito: `esc()` transforma
`undefined` em string VAZIA. Entao um campo que o no esqueceu de repassar
nao aparece como "undefined" -- aparece como buraco, e a checagem de
"undefined" que eu tinha escrito passava batido.

Buraco em tela e o modo de falha real deste projeto ("campo esquecido chega
undefined em silencio", README). Conferir a moldura -- o rotulo "Faixa de
recencia" -- nao prova nada, porque o rotulo e texto fixo: ele aparece com
ou sem dado.

Entao o smoke passa a exigir que o VALOR esteja la: o nome da faixa tem que
ser um dos sete nomes conhecidos. Isso so passa se `cluster_nome` chegou de
verdade ate a tela.

    python _smoke_valor_visivel.py
"""
import io
import os
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

AQUI = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(AQUI, "_smoke_dom.js")
s = io.open(P, encoding="utf-8").read()
orig = s

velho = """        if (ex.indexOf('Faixa de recência') < 0) {
          erros.push('o painel abriu sem a faixa de recencia');
        }"""

novo = """        if (ex.indexOf('Faixa de recência') < 0) {
          erros.push('o painel abriu sem a faixa de recencia');
        }
        /* O ROTULO nao prova nada: e texto fixo, aparece com ou sem dado.
           O que prova e o VALOR. `esc()` transforma undefined em string
           vazia, entao campo nao repassado vira buraco silencioso na tela
           -- o modo de falha classico deste projeto. Exigir um dos sete
           nomes conhecidos so passa se `cluster_nome` chegou de verdade. */
        const NOMES = ['Cliente Diamante', 'Cliente Ouro', 'Cliente Prata',
          'Cliente Recuperação', 'Lead Quente', 'Lead Morno', 'Lead Frio'];
        if (!NOMES.some(function (n) { return ex.indexOf(n) >= 0; })) {
          erros.push('o painel mostra o rotulo da faixa mas nenhum nome de faixa — ' +
            'o valor nao chegou na tela');
        }"""

if s.count(velho) != 1:
    raise SystemExit("ANCORA AMBIGUA OU AUSENTE (%d)" % s.count(velho))
s = s.replace(velho, novo, 1)
print("  ok  o smoke exige o VALOR da faixa, nao so o rotulo")

tmp = P + ".tmp"
with io.open(tmp, "w", encoding="utf-8") as f:
    f.write(s)
os.replace(tmp, P)

print("_smoke_dom.js: %d -> %d chars" % (len(orig), len(s)))
