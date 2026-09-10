# -*- coding: utf-8 -*-
"""Faz as duas colunas da grade terem o mesmo tamanho, de verdade.

`grid-template-columns:1fr 1fr` promete metade e metade, mas item de grade
nasce com `min-width:auto`: ele se recusa a encolher abaixo do proprio
conteudo. Com uma tabela larga dentro, a coluna da esquerda empurrava a da
direita e a pagina inteira ganhava barra de rolagem horizontal -- que e
justamente o que nao pode acontecer.

`min-width:0` nos filhos devolve o controle ao 1fr. A rolagem horizontal,
quando precisa existir, passa a ser DA TABELA, dentro do cartao.

Alem disso, nome de loja e de veiculo passam a truncar com reticencias em
vez de esticar a coluna: "BNORDESTE TRANSPORTES E LOCACAO LTDA" nao pode
decidir a largura da tela.

    python _ajusta_grade.py
"""
import io
import os

AQUI = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(AQUI, "montar-html.js")
s = io.open(P, encoding="utf-8").read()
orig = s
feito = []


def troca(velho, novo, rotulo):
    global s
    if velho not in s:
        raise SystemExit("NAO ENCONTRADO: " + rotulo)
    s = s.replace(velho, novo, 1)
    feito.append(rotulo)


troca(
r"""  '.grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start}',
  '@media(max-width:1200px){.grid{grid-template-columns:1fr}}',""",
r"""  '.grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start}',
  /* sem isto o 1fr nao vale: item de grade nao encolhe abaixo do conteudo,
     a tabela larga empurra a coluna vizinha e a PAGINA ganha rolagem
     horizontal. Com min-width:0 quem rola e a tabela, dentro do cartao. */
  '.grid>*{min-width:0}',
  '@media(max-width:1200px){.grid{grid-template-columns:1fr}}',
  /* nome comprido nao pode decidir a largura da coluna */
  'td.nm{max-width:230px;overflow:hidden;text-overflow:ellipsis}',""",
"grade encolhe e nome trunca")

# a primeira celula de cada tabela ganha a classe de truncamento
troca(
r"""  '"<td class=\'tx\'>"+esc((r.v.marca?r.v.marca+" ":"")+(r.v.modelo||"?"))+" <span class=\'dim mono\'>#"+r.v.vehicle_id+"</span></td>"+',""",
r"""  '"<td class=\'tx nm\' title=\'"+esc((r.v.marca?r.v.marca+" ":"")+(r.v.modelo||"?"))+"\'>"+esc((r.v.marca?r.v.marca+" ":"")+(r.v.modelo||"?"))+" <span class=\'dim mono\'>#"+r.v.vehicle_id+"</span></td>"+',""",
"nome do veiculo trunca")

troca(
r"""  '"<td class=\'tx\'>"+esc(r.l.loja)+" <span class=\'dim mono\'>#"+r.l.loja_id+"</span>"+(r.l.amostra_baixa?" <span class=\'tag w\'>amostra "+r.l.qt_veiculos+"</span>":"")+"</td>"+',""",
r"""  '"<td class=\'tx nm\' title=\'"+esc(r.l.loja)+"\'>"+esc(r.l.loja)+" <span class=\'dim mono\'>#"+r.l.loja_id+"</span>"+(r.l.amostra_baixa?" <span class=\'tag w\'>amostra "+r.l.qt_veiculos+"</span>":"")+"</td>"+',""",
"nome da loja trunca")

io.open(P, "w", encoding="utf-8").write(s)
print("mudou: " + str(s != orig))
for r in feito:
    print("  ok  " + r)
