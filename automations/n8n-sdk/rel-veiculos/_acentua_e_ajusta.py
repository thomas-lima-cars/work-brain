# -*- coding: utf-8 -*-
r"""Acentuacao, maiusculas, KPI a menos, titulo novo e cabecalho centrado.

Pedido do Thomas em 2026-09-11, ultimas mudancas de tela antes do /salve:

  1. acentuacao correta em todo texto visivel
  2. inicio com letra maiuscula
  3. tirar o indicador "Correspondencias"
  4. "Quem pode casar com quem" -> "Regras de elegibilidade"
  5. centralizar o titulo do cabecalho

SOBRE O KPI REMOVIDO: sai o de correspondencias (o total de pares). Os
outros cinco continuam, inclusive "Sem correspondencia", que e outra coisa
-- conta veiculo que podia ter par e nao teve. Com um KPI a menos a grade
passa de 6 para 5 colunas, senao sobra um buraco no fim da linha.

SOBRE A ACENTUACAO: o texto vivia sem acento por causa da transcricao manual
pro n8n. Isso deixou de ser motivo -- o arquivo ja viaja com ·, — e
↗ como caractere literal desde a limpeza das barras invertidas, e o
diff byte a byte confere o resultado. Entao acento entra como caractere.

Cuidado tomado: NAO acentuar identificador, nome de campo, chave de objeto
nem classe CSS -- so o que o humano le na tela.

    python _acentua_e_ajusta.py
"""
import io
import os
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
AQUI = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(AQUI, "montar-html.js")
s = io.open(P, encoding="utf-8").read()
orig = s
n_ok = 0


def troca(velho, novo, rot, obrigatorio=True):
    global s, n_ok
    if velho not in s:
        if obrigatorio:
            raise SystemExit("NAO ENCONTRADO: " + rot)
        print("  .. pulado (ja aplicado?): " + rot)
        return
    s = s.replace(velho, novo, 1)
    n_ok += 1
    print("  ok  " + rot)


def trocaTodas(velho, novo, rot):
    global s, n_ok
    c = s.count(velho)
    if not c:
        raise SystemExit("NAO ENCONTRADO: " + rot)
    s = s.replace(velho, novo)
    n_ok += 1
    print("  ok  " + rot + "  (" + str(c) + "x)")


# ── 3. fora o KPI de correspondencias, e a grade vira de 5 ────────────────
troca(
"""  'kpi(\"var(--pu)\",ICO.par,\"correspondencias\",nf(nPares))+',\n""",
"""""",
    "KPI de correspondencias removido")
troca(
"""  '.kpis{display:grid;grid-template-columns:repeat(6,1fr);background:#fff;',""",
"""  /* 5 colunas, nao 6: o KPI de correspondencias saiu a pedido, e deixar a\n     grade em 6 abriria um buraco no fim da linha. */\n  '.kpis{display:grid;grid-template-columns:repeat(5,1fr);background:#fff;',""",
    "grade de KPIs passa a 5 colunas")

# ── 5. cabecalho: titulo ao centro ────────────────────────────────────────
troca(
"""  '.topo{background:var(--mar);color:#fff;padding:10px 24px;',
  'display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px}',
  '.topo .esq{display:flex;align-items:center;gap:12px;min-width:0}',""",
"""  '.topo{background:var(--mar);color:#fff;padding:10px 24px;',
  'display:flex;align-items:center;gap:10px}',
  /* tres faixas de mesma largura (1fr cada) com o titulo no meio: e o que\n     mantem o titulo no CENTRO DA PAGINA, e nao no centro do espaco que\n     sobrou entre a logo e o botao -- que e o que `space-between` faria. */\n  '.topo .esq,.topo .dir{flex:1 1 0;display:flex;align-items:center;gap:12px;min-width:0}',
  '.topo .dir{justify-content:flex-end}',
  '.topo .meio{flex:1 1 auto;text-align:center;min-width:0}',""",
    "cabecalho em tres faixas, titulo ao centro")

troca(
"""  '<div class=\"topo\"><span class=\"esq\">' +""",
"""  '<div class=\"topo\"><span class=\"esq\">' +""",
    "ancora do cabecalho (sem mudanca)", obrigatorio=False)

troca(
"""  '<b>Veiculos em evento &times; lojas compradoras</b></span>',
  '<span class=\"dir\"><button id=\"btn_info\"></button>',
  '<span class=\"dim\">gerado em <span id=\"ger\"></span></span></span></div>',""",
"""  '</span>',
  '<span class=\"meio\"><b>Veículos em evento &times; lojas compradoras</b></span>',
  '<span class=\"dir\"><button id=\"btn_info\"></button>',
  '<span class=\"dim\">Gerado em <span id=\"ger\"></span></span></span></div>',""",
    "titulo vai para a faixa do meio, acentuado")

# ── 4. o titulo do glossario ──────────────────────────────────────────────
troca(
"""'<div class=\"card\"><div class=\"card-h\">Quem pode casar com quem</div>""",
"""'<div class=\"card\"><div class=\"card-h\">Regras de elegibilidade</div>""",
    "\"Quem pode casar com quem\" -> \"Regras de elegibilidade\"")
troca(
"""'<span class=\"via\">o que entra na base, quem pode casar com quem, e como o numero e feito</span></div>',""",
"""'<span class=\"via\">O que entra na base, as regras de elegibilidade, e como o número é feito</span></div>',""",
    "subtitulo do glossario acompanha")

# ── 1 e 2. acentuacao e maiusculas nos rotulos ────────────────────────────
for velho, novo, rot in [
    ('ICO.veic,"veiculos"', 'ICO.veic,"Veículos"', 'KPI Veiculos'),
    ('ICO.loja,"lojas elegiveis"', 'ICO.loja,"Lojas elegíveis"', 'KPI Lojas elegiveis'),
    ('ICO.med,"media de lojas por veiculo"', 'ICO.med,"Média de lojas por veículo"', 'KPI Media'),
    ('ICO.sobra,"canal sem loja"', 'ICO.sobra,"Canal sem loja"', 'KPI Canal sem loja'),
    ('ICO.zero,"sem correspondencia"', 'ICO.zero,"Sem correspondência"', 'KPI Sem correspondencia'),
    ('"todos os whitelabels"', '"Todos os whitelabels"', 'opcao todos os whitelabels'),
    ('"todas as UFs"', '"Todas as UFs"', 'opcao todas as UFs'),
    ('"todos os eventos"', '"Todos os eventos"', 'opcao todos os eventos'),
    (">limpar tudo<", ">Limpar tudo<", 'botao limpar'),
    (">Buscar veiculo<", ">Buscar veículo<", 'rotulo buscar veiculo'),
    ("btn_tx'>glossario<", "btn_tx'>Glossário<", 'botao glossario'),
    ('"voltar ao relatorio"', '"Voltar ao relatório"', 'botao voltar'),
    ('"glossario";', '"Glossário";', 'texto do botao de volta'),
    ('>Aderencia por veiculo<', '>Aderência por veículo<', 'titulo da tela 1'),
    ('>Glossario<', '>Glossário<', 'titulo da tela 2'),
    ('>Filtros<', '>Filtros<', 'cartao Filtros'),
    ('>Veiculos <span', '>Veículos <span', 'cartao Veiculos'),
    ('[encerrado]', '[encerrado]', 'marca de encerrado'),
]:
    troca(velho, novo, rot, obrigatorio=(rot not in ('cartao Filtros', 'marca de encerrado')))

# cabecalhos de tabela e textos repetidos
for velho, novo, rot in [
    ("<th class='tx'>Veiculo</th>", "<th class='tx'>Veículo</th>", 'th Veiculo'),
    ("<th>Aderencia</th>", "<th>Aderência</th>", 'th Aderencia'),
    ("<th>Veiculos ofertados 6m</th>", "<th>Veículos ofertados 6m</th>", 'th Veiculos ofertados'),
    ("<th>Referencia</th>", "<th>Referência</th>", 'th Referencia'),
    ("<th class=\"tx\">No relatorio</th>", "<th class=\"tx\">No relatório</th>", 'th No relatorio'),
    ("Nenhum veiculo no filtro atual.", "Nenhum veículo no filtro atual.", 'vazio veiculos'),
    ("Nenhuma loja no filtro atual.", "Nenhuma loja no filtro atual.", 'vazio lojas'),
    ("ponto(s) de atencao", "ponto(s) de atenção", 'titulo dos avisos'),
    ("Extrato da loja", "Extrato da loja", 'titulo do extrato'),
    ("Veiculos com aderencia acima de ", "Veículos com aderência acima de ", 'titulo da lista do extrato'),
    ("veiculo(s) acima de ", "veículo(s) acima de ", 'texto do extrato vazio'),
    ("Nenhum veiculo passa de ", "Nenhum veículo passa de ", 'texto do extrato sem ninguem'),
    ("% de aderencia para esta loja. O melhor e ", "% de aderência para esta loja. O melhor é ", 'idem'),
    ("desta loja estao fora do filtro atual.", "desta loja estão fora do filtro atual.", 'idem 2'),
    ("elegiveis\"+(escondidos?", "elegíveis\"+(escondidos?", 'contador do extrato'),
    (" fora do filtro\"", " fora do filtro\"", 'idem 3'),
    ("veiculos ofertados em <b>", "veículos ofertados em <b>", 'linha do extrato'),
    ("lances nos ultimos 6 meses", "lances nos últimos 6 meses", 'idem 4'),
    ("fator de confianca <b>", "fator de confiança <b>", 'idem 5'),
    ("elegivel para <b>", "elegível para <b>", 'idem 6'),
    ("veiculo(s)</div>", "veículo(s)</div>", 'idem 7'),
    ("sem desvio medido", "sem desvio medido", 'leitura sem desvio'),
    ("faixa apertada: acertar este numero vale muito", "faixa apertada: acertar este número vale muito", 'leitura apertada'),
    ("faixa media", "faixa média", 'leitura media'),
    ("dispersao alta: este indicador quase nao informa", "dispersão alta: este indicador quase não informa", 'leitura dispersa'),
    ("amostra baixa</span>", "amostra baixa</span>", 'etiqueta amostra baixa'),
    ("canal sem loja</span>", "canal sem loja</span>", 'etiqueta canal'),
    ("Veiculos elegiveis: \"+nf(l.pares)+\", ordenados por aderencia.",
     "Veículos elegíveis: \"+nf(l.pares)+\", ordenados por aderência.", 'contexto da loja'),
    ("% das ofertas)", "% das ofertas)", 'contexto da loja 2'),
]:
    troca(velho, novo, rot, obrigatorio=False)

io.open(P, "w", encoding="utf-8").write(s)
print("")
print("trocas aplicadas: " + str(n_ok))
print("mudou: " + str(s != orig))
