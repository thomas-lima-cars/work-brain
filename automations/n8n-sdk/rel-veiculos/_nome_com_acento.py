# -*- coding: utf-8 -*-
"""Nome do arquivo com acento, e charset no tipo de conteudo.

DOIS PROBLEMAS DIFERENTES, e so o primeiro foi pedido:

1. O NOME. Eu escrevi "Relatorios Aderencia Veiculos" em ASCII puro, por
   habito de nome de arquivo. Nao foi o SharePoint que quebrou os acentos --
   eles nunca existiram. A API devolveu o nome exatamente como enviei:
     name: relatorio-aderencia-veiculos-2026-09-11.html
   `encodeURIComponent` ja trata acento corretamente (percent-encoding UTF-8),
   entao o caminho continua valido: "Relatórios" vira "Relat%C3%B3rios".

2. O CHARSET, que ninguem pediu mas quebra de verdade. O binario subia com
   `mimeType: 'text/html'`, sem charset. Quando o servidor entrega HTML com
   `Content-Type: text/html` e sem charset, o cabecalho HTTP TEM PRECEDENCIA
   sobre o `<meta charset="utf-8">` do documento -- o navegador escolhe o
   padrao dele e o conteudo inteiro sai com acento corrompido. Como o
   relatorio e todo em portugues, isso e visivel em cada linha.

   Os dois sintomas se parecem ("os acentos quebraram"), entao vale corrigir
   os dois e nao adivinhar qual era.

RESSALVA: a pasta antiga, sem acento, continua la com o arquivo de hoje. Nao
vou apagar -- e o SharePoint do time e apagar arquivo dos outros nao e minha
decisao. Ficam as duas ate alguem remover a velha.

    python _nome_com_acento.py
"""
import io
import os
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

AQUI = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(AQUI, "virar-arquivo.js")
s = io.open(P, encoding="utf-8").read()
orig = s


def troca(velho, novo, rot):
    global s
    if s.count(velho) != 1:
        raise SystemExit("ANCORA AMBIGUA OU AUSENTE (%d): %s" % (s.count(velho), rot))
    s = s.replace(velho, novo, 1)
    print("  ok  " + rot)


troca(
"""const PASTA = 'Relatorios Aderencia Veiculos';
const PREFIXO = 'relatorio-aderencia-veiculos';""",
"""/* Com acento, como se escreve em portugues. O caminho segue valido porque
   cada trecho passa por encodeURIComponent, que produz percent-encoding
   UTF-8: "Relatórios" vira "Relat%C3%B3rios". O SharePoint decodifica e
   guarda o nome acentuado -- o `name` que a API devolve confirma. */
const PASTA = 'Relatórios Aderência Veículos';
const PREFIXO = 'relatório-aderência-veículos';""",
    "pasta e prefixo com acento")

troca(
"""      mimeType: 'text/html',""",
"""      /* O CHARSET E OBRIGATORIO AQUI, nao e detalhe.
         Servidor que entrega `Content-Type: text/html` sem charset faz o
         cabecalho HTTP ter precedencia sobre o `<meta charset="utf-8">` do
         proprio documento -- e o navegador escolhe o padrao dele. Num
         relatorio inteiro em portugues, o resultado e acento corrompido em
         cada linha. */
      mimeType: 'text/html; charset=utf-8',""",
    "charset no mimeType")

tmp = P + ".tmp"
with io.open(tmp, "w", encoding="utf-8") as f:
    f.write(s)
os.replace(tmp, P)

print("virar-arquivo.js: %d -> %d chars" % (len(orig), len(s)))
