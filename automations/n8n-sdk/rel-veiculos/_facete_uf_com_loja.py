# -*- coding: utf-8 -*-
"""O filtro de UF para de descartar UF que tem loja mas nao tem veiculo.

O DEFEITO, achado pelo smoke no run 50406:
  "a soma das UFs (714) nao fecha com o total de lojas (715)"

A loja #104753 fica em RR e tem 19 pares. Nenhum VEICULO da base esta em RR.
O contador do facete de UF conta veiculos, e `opcoes()` descarta opcao com
contagem zero -- entao "RR" nao aparecia na lista e aquela loja so era
alcancavel por "todas as UFs".

POR QUE SO APARECEU AGORA: enquanto a UF era porta, toda loja publicada
tinha, por construcao, pelo menos um veiculo na propria UF -- senao nao teria
par nenhum e nao seria publicada. Derrubar a porta quebrou essa garantia
implicita. O codigo do facete nao mudou; o que mudou foi a invariante em que
ele se apoiava sem dizer.

A CORRECAO mantem a contagem de VEICULOS como rotulo (e o que o leitor
procura), mas deixa a opcao sobreviver quando ha loja. O rotulo entao diz as
duas coisas -- "0 veiculos, 1 loja" -- em vez de esconder a UF ou mentir um
numero.

    python _facete_uf_com_loja.py
"""
import io
import os
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

AQUI = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(AQUI, "montar-html.js")
s = io.open(P, encoding="utf-8").read()
orig = s


def troca(velho, novo, rot):
    global s
    if s.count(velho) != 1:
        raise SystemExit("ANCORA AMBIGUA OU AUSENTE (%d): %s" % (s.count(velho), rot))
    s = s.replace(velho, novo, 1)
    print("  ok  " + rot)


# ── opcoes() aceita um contador secundario ───────────────────────────────
troca(
"""  'function opcoes(alvo,itens,rotulo,conta,tot,cur){',
  'var manteve=false;',
  'const opts=itens.map(function(it,i){',
  'const n=conta(it);if(!n)return \"\";',
  'if(String(i)===cur)manteve=true;',
  `return \"<option value='\"+i+\"'>\"+rotulo(it)+\" (\"+n+\")</option>\";}).join(\"\");`,""",
"""  /* `extra` e um contador SECUNDARIO, opcional. Existe por causa do facete\n     de UF: desde que a UF deixou de ser porta (11/09), uma loja pode ficar\n     numa UF onde nao ha veiculo nenhum -- e ela sumia da lista, porque a\n     contagem e de veiculos e opcao zerada era descartada. Medido no run\n     50406: a loja #104753 fica em RR, tem 19 pares, e RR nao aparecia. */\n  'function opcoes(alvo,itens,rotulo,conta,tot,cur,extra){',\n  'var manteve=false;',\n  'const opts=itens.map(function(it,i){',\n  'const n=conta(it);const x=extra?extra(it):0;',\n  'if(!n&&!x)return \"\";',\n  'if(String(i)===cur)manteve=true;',\n  `const rot=n?(\" (\"+n+\")\"):(\" (0 · \"+x+\" loja\"+(x>1?\"s\":\"\")+\")\");`,\n  `return \"<option value='\"+i+\"'>\"+rotulo(it)+rot+\"</option>\";}).join(\"\");`,""",
    "opcoes() aceita contador secundario")

# ── o facete de UF passa o contador de lojas ────────────────────────────
troca(
"""  'opcoes(\"#f_uf\",ufs,function(x){return esc(x);},',
  'function(x){return qt(ev,w,x);},qt(ev,w,null),$(\"#f_uf\").value);',""",
"""  /* o quinto argumento conta LOJAS naquela UF: e o que impede uma UF com\n     loja e sem veiculo de desaparecer do filtro. */\n  'const qtL=function(w2,u2){return D.lojas.filter(function(l){return passaL(l,w2,u2);}).length;};',\n  'opcoes(\"#f_uf\",ufs,function(x){return esc(x);},',\n  'function(x){return qt(ev,w,x);},qt(ev,w,null),$(\"#f_uf\").value,',\n  'function(x){return qtL(w,x);});',""",
    "o facete de UF conta lojas tambem")

tmp = P + ".tmp"
with io.open(tmp, "w", encoding="utf-8", newline="") as f:
    f.write(s)
os.replace(tmp, P)

print("montar-html.js: %d -> %d chars" % (len(orig), len(s)))
