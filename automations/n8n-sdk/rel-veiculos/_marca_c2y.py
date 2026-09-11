# -*- coding: utf-8 -*-
r"""Cabecalho na cor da marca (#1523A0) com a logo embutida.

Pedido do Thomas em 2026-09-11. O tom tambem passa a valer nos detalhes --
barra de score, links, a barra do titulo e o KPI de veiculos.

SOBRE A LOGO, e por que ela nao entra como o .jpg original:

  - o relatorio e um arquivo unico, sem dependencia externa, entao a imagem
    tem que ser data URI. Referenciar um arquivo local quebraria assim que
    alguem encaminhasse o HTML;
  - o .jpg tem 6.216 bytes, o que vira ~8.300 caracteres de base64 que EU
    transcrevo a mao pro n8n. Um caractere errado corrompe a imagem, e 8 mil
    caracteres de base64 sao exatamente o tipo de coisa que se transcreve
    errado (ver o episodio das barras invertidas, 2026-09-10);
  - a logo e de DUAS cores por desenho, e aparece a 26px de altura. Entao
    ela vai como PNG paletizado de 128px construido por limiar de
    luminancia: 570 bytes, 760 caracteres de base64. Treze vezes menor, sem
    artefato de JPEG na borda do glifo, e conferivel.

  ⚠️ A quantizacao automatica do Pillow (`quantize(colors=2)`) escolheu DOIS
  AZUIS e perdeu o branco. Por isso a paleta e construida a mao: luminancia
  acima de 128 vira branco, o resto vira #1523A0 exato.

O fundo da logo e #1523A0 medido pixel a pixel -- identico ao do cabecalho.
Entao ela encaixa sem emenda, e o que se ve e so o wordmark.

    python _marca_c2y.py
"""
import io
import os
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
AQUI = os.path.dirname(os.path.abspath(__file__))

b64 = io.open(os.path.join(AQUI, "_logo.b64")).read().strip()
if len(b64) > 1200:
    raise SystemExit("base64 grande demais pra transcrever a mao: " + str(len(b64)))
print("  logo: %d caracteres de base64" % len(b64))

P = os.path.join(AQUI, "montar-html.js")
s = io.open(P, encoding="utf-8").read()
orig = s


def troca(velho, novo, rot):
    global s
    if velho not in s:
        raise SystemExit("NAO ENCONTRADO: " + rot)
    s = s.replace(velho, novo, 1)
    print("  ok  " + rot)


# 1) a cor da marca entra como token e vira o acento do relatorio inteiro
troca(
"""  ':root{--bg:#f4f6f9;--card:#fff;--line:#e3e7ed;--line2:#eef1f5;',
  '--tx:#1b2e4b;--dim:#7987a1;--ac:#0168fa;--gr:#10b759;--or:#f49917;',""",
"""  /* --mar e a cor da marca (#1523A0), medida no proprio arquivo da logo.
     Ela tambem vira o acento (--ac) do relatorio: barra de score, links, a
     barra do titulo e o KPI de veiculos passam a falar a mesma lingua. */
  ':root{--bg:#f4f6f9;--card:#fff;--line:#e3e7ed;--line2:#eef1f5;',
  '--mar:#1523A0;',
  '--tx:#1b2e4b;--dim:#7987a1;--ac:#1523A0;--gr:#10b759;--or:#f49917;',""",
    "token --mar e --ac na cor da marca")

# 2) o cabecalho fica escuro
troca(
"""  '.topo{background:#fff;border-bottom:1px solid var(--line);padding:12px 24px;',
  'display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px}',
  '.topo b{font-size:19px;letter-spacing:-.4px}',
  '.topo .dir{display:flex;align-items:center;gap:14px}',
  '.topo .dim{font-size:11.5px}',
  '#btn_info{display:flex;align-items:center;gap:6px;font-weight:600}',
  '#btn_info svg{width:15px;height:15px}',""",
"""  '.topo{background:var(--mar);color:#fff;padding:10px 24px;',
  'display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px}',
  '.topo .esq{display:flex;align-items:center;gap:12px;min-width:0}',
  /* o fundo da logo e exatamente --mar, entao ela encaixa sem emenda: o que
     se ve e so o wordmark branco. Nada de borda ou raio aqui. */
  '.topo .logo{height:26px;width:26px;display:block;flex:0 0 26px}',
  '.topo b{font-size:19px;letter-spacing:-.4px;color:#fff}',
  '.topo .dir{display:flex;align-items:center;gap:14px}',
  '.topo .dim{font-size:11.5px;color:rgba(255,255,255,.72)}',
  /* botao sobre fundo escuro: contorno claro, nao a borda cinza do tema */
  '#btn_info{display:flex;align-items:center;gap:6px;font-weight:600;',
  'background:transparent;color:#fff;border-color:rgba(255,255,255,.45)}',
  '#btn_info:hover{background:rgba(255,255,255,.14);color:#fff;',
  'border-color:rgba(255,255,255,.8)}',
  '#btn_info svg{width:15px;height:15px}',""",
    "cabecalho na cor da marca, com slot da logo")

# 3) a logo no HTML
troca(
"""  '<div class=\"topo\"><b>Veiculos em evento &times; lojas compradoras</b>',""",
"""  '<div class=\"topo\"><span class=\"esq\">' +
  '<img class=\"logo\" alt=\"Cars2You\" src=\"data:image/png;base64,""" + b64 + """\">' +
  '<b>Veiculos em evento &times; lojas compradoras</b></span>',""",
    "logo embutida no cabecalho")

io.open(P, "w", encoding="utf-8").write(s)
print("mudou: " + str(s != orig))
