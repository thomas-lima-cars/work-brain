# -*- coding: utf-8 -*-
r"""O cabecalho tem que descrever a janela que existe, nao a que existia.

Com HORAS_ADIANTE = 0 nao ha teto, e a frase "eventos que encerram entre
<piso> e <teto>" imprimia literalmente "e <b>?</b>" -- o tipo de detalhe que
faz o leitor desconfiar do relatorio inteiro, com razao.

Agora a frase muda de forma conforme o recorte, e nos tres casos diz a
verdade:
  - sem teto      -> "encerrados a partir de X, mais os nao encerrados"
  - com teto      -> "encerram entre X e Y"
  - lista de ids  -> "N eventos escolhidos a dedo", porque nesse modo as
                     datas nao valem e anunciar janela seria mentira

Escrito com a ferramenta de arquivo, nao heredoc -- ver nota em
_link_anuncio.py.

    python _cabecalho_sem_teto.py
"""
import io
import os

AQUI = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(AQUI, "montar-html.js")
s = io.open(P, encoding="utf-8").read()
orig = s

VELHO = (u"  '<span class=\"via\">eventos que encerram entre <b>' + "
         u"(META.janela_ini || '?') + '</b> e <b>' + (META.janela_fim || '?') + "
         u"'</b> (hora de Brasilia) &middot; perfil de compra desde ' + "
         u"(META.data_ini || '?') + '</span></div>',")

NOVO = (u"  '<span class=\"via\">' + descreveRecorte() + "
        u"' &middot; perfil de compra desde ' + (META.data_ini || '?') + "
        u"'</span></div>',")

if VELHO not in s:
    raise SystemExit("NAO ENCONTRADO: a frase do recorte no cabecalho")
s = s.replace(VELHO, NOVO, 1)
print("  ok  cabecalho passa a chamar descreveRecorte()")

# a funcao, colada antes do array do RENDER. Ancora: a marca de inicio.
ANC = u"RENDER:INICIO"
i = s.index(ANC)
ini_linha = s.rindex("\n", 0, s.rindex("\n", 0, i))
FUNC = u"""

/* A frase do cabecalho muda de forma conforme o recorte, porque os tres
   modos sao mesmo diferentes -- e no modo lista as datas simplesmente nao
   valem, entao anunciar uma janela seria mentira. */
function descreveRecorte() {
  const ids = META.eventos_ids || [];
  if (ids.length) {
    return ids.length + ' evento(s) escolhido(s) a dedo (o recorte e a lista de ids, nao a data)';
  }
  const de = META.janela_ini || '?';
  if (!META.janela_fim) {
    return 'eventos encerrados a partir de <b>' + de +
      '</b> (hora de Brasilia), mais os que ainda nao encerraram';
  }
  return 'eventos que encerram entre <b>' + de + '</b> e <b>' +
    META.janela_fim + '</b> (hora de Brasilia)';
}
"""
s = s[:ini_linha] + FUNC + s[ini_linha:]
print("  ok  descreveRecorte() inserida")

io.open(P, "w", encoding="utf-8").write(s)
print("mudou: " + str(s != orig))
