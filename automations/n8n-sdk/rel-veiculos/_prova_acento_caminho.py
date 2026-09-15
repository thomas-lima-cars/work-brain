# -*- coding: utf-8 -*-
"""Provas do nome acentuado e do charset.

As seis que falharam fixavam o nome em ASCII e o mimeType sem charset. Cada
uma passa a dizer a coisa nova, e entram duas que nao existiam:

  - o percent-encoding VOLTA a ser o nome acentuado (decodeURIComponent).
    E o que prova que o acento atravessa o caminho da URL intacto, em vez de
    so conferir que a string mudou de forma;
  - o mimeType declara charset, porque cabecalho HTTP sem charset tem
    precedencia sobre o <meta> do documento e corrompe o portugues inteiro.

    python _prova_acento_caminho.py
"""
import io
import os
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

AQUI = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(AQUI, "_prova_virar_arquivo.js")
s = io.open(P, encoding="utf-8").read()
orig = s

NOME = "relatório-aderência-veículos"
CAMINHO = ("Relat%C3%B3rios%20Ader%C3%AAncia%20Ve%C3%ADculos/"
           "relat%C3%B3rio-ader%C3%AAncia-ve%C3%ADculos-2026-09-11.html")


def troca(velho, novo, rot):
    global s
    if s.count(velho) != 1:
        raise SystemExit("ANCORA AMBIGUA OU AUSENTE (%d): %s" % (s.count(velho), rot))
    s = s.replace(velho, novo, 1)
    print("  ok  " + rot)


# ── o mimeType agora declara charset ─────────────────────────────────────
troca(
"""  igual(r[0].binary.data.mimeType, 'text/html', 'mimeType');""",
"""  /* com charset, sempre: sem ele o cabecalho HTTP vence o <meta charset>
     do documento e o portugues inteiro sai corrompido no navegador */
  igual(r[0].binary.data.mimeType, 'text/html; charset=utf-8', 'mimeType com charset');""",
    "mimeType declara charset")

# ── os tres nomes datados ────────────────────────────────────────────────
for dia in ["2026-09-11", "2026-09-12", "2026-09-11"]:
    velho = "igual(r[0].json.nomeArquivo, 'relatorio-aderencia-veiculos-%s.html', 'nome do arquivo');" % dia
    novo = "igual(r[0].json.nomeArquivo, '%s-%s.html', 'nome do arquivo');" % (NOME, dia)
    if velho in s:
        s = s.replace(velho, novo, 1)
        print("  ok  nome datado %s" % dia)
    else:
        raise SystemExit("ANCORA AUSENTE: nome datado %s" % dia)

# ── o caminho, agora com acento percent-encoded ─────────────────────────
troca(
"""  igual(r[0].json.caminho,
    'Relatorios%20Aderencia%20Veiculos/relatorio-aderencia-veiculos-2026-09-11.html',
    'caminho');""",
"""  igual(r[0].json.caminho, '%s', 'caminho');""" % CAMINHO,
    "caminho com acento codificado")

# ── a prova que faltava: o acento VOLTA ─────────────────────────────────
troca(
"""prova('o nome do arquivo atravessa a codificação intacto', () => {
  const r = roda({ html: htmlDe(200 * 1024) });
  igual(r[0].json.caminho.split('/')[1], r[0].json.nomeArquivo, 'nome preservado');
});""",
"""prova('o acento SOBREVIVE à codificação: o caminho decodifica de volta', () => {
  const r = roda({ html: htmlDe(200 * 1024) });
  const partes = r[0].json.caminho.split('/');
  /* Conferir que a string "mudou de forma" nao prova nada -- percent-encoding
     errado tambem muda a forma. O que prova e a VOLTA: decodificado, o
     caminho tem que ser exatamente a pasta e o nome acentuados. */
  igual(decodeURIComponent(partes[0]), r[0].json.pasta, 'a pasta volta acentuada');
  igual(decodeURIComponent(partes[1]), r[0].json.nomeArquivo, 'o nome volta acentuado');
  /* e o nome acentuado e mesmo acentuado, senao a prova acima passaria com
     dois ASCII iguais e nao teria testado nada */
  if (!/[áàâãéêíóôõúüç]/i.test(r[0].json.nomeArquivo)) {
    throw new Error('o nome nao tem acento: a prova de ida e volta passaria por acaso');
  }
  /* nenhum acento CRU sobra no caminho: tudo tem que estar codificado */
  if (/[áàâãéêíóôõúüç]/i.test(r[0].json.caminho)) {
    throw new Error('sobrou acento sem codificar no caminho da URL');
  }
});""",
    "prova de ida e volta do acento")

tmp = P + ".tmp"
with io.open(tmp, "w", encoding="utf-8") as f:
    f.write(s)
os.replace(tmp, P)

print("_prova_virar_arquivo.js: %d -> %d chars" % (len(orig), len(s)))
