"""Monta a planilha de projeção 2027 a partir dos fechamentos de 2026.

Uso:  python monta_projecao.py <pasta-dos-relatorios> <saida.xlsx>

Abas: Base (consolidado, uma aba só) · Projeção 2027 (um bloco por comitente, no formato
da tabela de origem: mesmas colunas, jan–dez/26 realizados e logo abaixo jan–dez/27
projetados) · Resumo 2027 (o mesmo formato por bloco e no total) · De-para · Conferência.

Regras combinadas com o Thomas em 29/10 (respostas às dúvidas da reunião com o Tuunelis):
  1. "Vendidos" = Vendas Confirmadas.
  2. Entram as colunas de caixa (depois da Receita Bruta).
  3. Dois nomes de comitente viram uma linha só se forem do mesmo relatório
     operacional, do mesmo produto e nunca aparecerem no mesmo mês.
  4. Mês sem valor em 2026 fica sem projeção em 2027 (nada de estimativa); só o volume bruto cria publicação.
  5. O % e o # de incremento (volume bruto por mês) valem o ano todo, editáveis mês a mês.
  6. A receita de 2027 usa a receita por venda atual (a tarifa subiu em mar/abr-26).
"""
import sys
from collections import defaultdict
from datetime import date

from openpyxl import Workbook
from openpyxl.comments import Comment
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter as L
from openpyxl.worksheet.hyperlink import Hyperlink
from openpyxl.worksheet.properties import Outline

from consolida import CAIXA, METRICAS, MOEDA, RAZOES, confere, confere_competencia, le_todos

BLOCOS = ["Repasse", "Venda Direta - Projetos Especiais", "Trucks2you", "B2AUTO"]
ABREV = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]
PREFIXO_AJUSTE = "Dealers - Venda Direta - Ajuste"
NOME_AJUSTES = "Dealers - Venda Direta - Ajustes"
# pares apontados na leitura da reunião; a regra 3 decide se mesclam
CANDIDATOS = [
    ("Repasse", ["Banco VW", "Banco VW - Dealers"]),
    ("Repasse", ["GM", "GM - Dealers"]),
    ("Repasse", ["C6 Bank - icarrosclub", "C6 Bank - Cars2you"]),
    ("Repasse", ["Multifrota - Netcarros", "Outlet Netcarros"]),
    ("Repasse", ["LM Transportes - Venda Direta", "LM Transportes - Venda Direta - Leves - Lista"]),
    ("Trucks2you", ["Banco do Brasil - Dealers", "Banco do Brasil"]),
]

# colunas da tabela de origem (aba geral, C..Y), na mesma ordem
ORIG = METRICAS[:14] + ["Êxito de Venda"] + METRICAS[14:17] + ["% Rec. VMV", "% Rec. Mercado", "Receita Bruta"]
# como cada coluna vai para 2027: proporcional aos publicados ou às vendas do mesmo mês de 2026
PELOS_PUBLICADOS = {"Em Preparação", "Em aberto", "Anúncio Ativo", "Qtde Com Ofertas", "Ativo s/ Oferta",
                    "Retirados s/ Oferta", "Retirado c/ Oferta", "Encerrado c/ Oferta", "Encerrado s/ Oferta",
                    "Qtde Recusada / Cancelada"}
PELAS_VENDAS = {"Qtde de Vendas", "Em Análise", "Valor de Mercado", "Expectativa de Venda Cliente (VMV)", "Valor de Venda"}
PREMISSAS = ["% Incremento publicados", "# Incremento publicados", "Var. êxito (p.p.)", "Receita por venda (R$)"]
COLS = ["Mês"] + PREMISSAS + ORIG
X0 = 1                                                  # coluna A e linha 1 em branco, de margem


def X(i):
    """Coluna na planilha da i-ésima coluna da tabela (1 = Mês)."""
    return i + X0


C = {n: L(X(i + 1)) for i, n in enumerate(COLS)}       # B mês, C..F premissas, G..AA origem
PUB, VEN, REC = C["Qtde Publicadas"], C["Vendas Confirmadas"], C["Receita Bruta"]
GPCT, GQTD, DEX, RPV = (C[n] for n in PREMISSAS)       # % incremento, volume, var. êxito, receita por venda
COL_BLOCO, COL_COM = 31, 32                             # AE, AF: critérios dos SUMIFS (ocultas)
# linhas de um bloco, a partir do título (t): cabeçalho, jan–dez/26, Total 2026, premissa do ano,
# jan–dez/27, Total 2027, variação. O Resumo não tem a linha de premissa.
LAY_PJ = {"cab": 1, "m26": 2, "t26": 14, "ano": 15, "m27": 16, "t27": 28, "var": 29}
LAY_RS = {"cab": 1, "m26": 2, "t26": 14, "ano": None, "m27": 15, "t27": 27, "var": 28}
ALTURA_PJ, ALTURA_RS = LAY_PJ["var"] + 2, LAY_RS["var"] + 2
COL_OBS = X(len(COLS))                                  # observação na última coluna da tabela, à direita
ULT = COL_OBS                                           # última coluna da tabela

ARIAL = "Arial"
F = Font(name=ARIAL, size=10)
FBOLD = Font(name=ARIAL, size=10, bold=True)
FHDR = Font(name=ARIAL, size=9, bold=True, color="FFFFFF")
FIN = Font(name=ARIAL, size=10, color="0000FF")
FOBS = Font(name=ARIAL, size=9, color="C00000")
FNOTA = Font(name=ARIAL, size=9, italic=True, color="595959")
FBLOCO = Font(name=ARIAL, size=13, bold=True, color="1F3864")
FPAG = Font(name=ARIAL, size=15, bold=True, color="1F3864")
FLINKC = Font(name=ARIAL, size=10, color="0563C1", underline="single")
CENTRO = Alignment(horizontal="center", vertical="center")
ESQ = Alignment(horizontal="left", vertical="center")
DIR = Alignment(horizontal="right", vertical="center")
_fio = Side(style="thin", color="8EA9DB")
FILL_HDR = PatternFill("solid", fgColor="1F3864")
FILL_IN = PatternFill("solid", fgColor="FFFF00")
FILL_MES = PatternFill("solid", fgColor="FFF2CC")
FILL_PROJ = PatternFill("solid", fgColor="E2EFDA")
FILL_SUB = PatternFill("solid", fgColor="D9E1F2")
QTD = "#,##0;(#,##0);-"
RS = "#,##0;(#,##0);-"
PCT = "0.0%;(0.0%);-"
RS2 = "#,##0.00;(#,##0.00);-"


def fmt_col(nome):
    if nome == "Mês":
        return "mmm/yy"
    if nome in RAZOES or nome in ("% Incremento publicados", "Var. êxito (p.p.)"):
        return PCT
    if nome == "Receita por venda (R$)":
        return RS2
    return RS if nome in MOEDA else QTD


# ---------------------------------------------------------------- mesclagem

def mesclar(linhas):
    """Grava l['padronizado'] em cada linha e devolve o registro do de-para."""
    meses_de, prods, originais = defaultdict(set), defaultdict(set), defaultdict(set)
    for l in linhas:
        k = (l["bloco"], l["comitente"])
        meses_de[k].add(l["mes"])
        prods[k].add(l["produto"])
        originais[k].add(l["comitente_orig"])
    # rótulos de produto equivalentes: o mesmo comitente aparece com os dois em meses diferentes
    # (ex.: "icarros club" vira "Cars2you" em mar/26; na Venda Direta "Cars2you" vira "WL" em abr/26)
    pai = {}

    def raiz(x):
        while pai.setdefault(x, x) != x:
            x = pai[x]
        return x

    for (b, _), ps in prods.items():
        ps = sorted(ps)
        for p in ps[1:]:
            pai[raiz((b, p))] = raiz((b, ps[0]))

    grupos = list(CANDIDATOS)
    for b in BLOCOS:
        aj = sorted(c for (bb, c) in meses_de if bb == b and c.startswith(PREFIXO_AJUSTE))
        if len(aj) > 1:
            grupos.append((b, aj))

    destino, situacao = {}, {}
    for b, nomes in grupos:
        presentes = [n for n in nomes if (b, n) in meses_de]
        if len(presentes) < 2:
            continue
        mesmo_prod = len({raiz((b, p)) for n in presentes for p in prods[(b, n)]}) == 1
        juntos = sorted({m for i, x in enumerate(presentes) for y in presentes[i + 1:]
                         for m in meses_de[(b, x)] & meses_de[(b, y)]})
        if presentes[0].startswith(PREFIXO_AJUSTE):
            final = NOME_AJUSTES
        else:
            final = max(presentes, key=lambda n: max(meses_de[(b, n)]))
        for n in presentes:
            if mesmo_prod and not juntos:
                destino[(b, n)] = final
                situacao[(b, n)] = f"Mesclado em '{final}'"
            elif not mesmo_prod:
                situacao[(b, n)] = "Candidato recusado: produto diferente"
            else:
                situacao[(b, n)] = "Candidato recusado: aparecem no mesmo mês (" + ", ".join(ABREV[m - 1] for m in juntos) + ")"

    for l in linhas:
        l["padronizado"] = destino.get((l["bloco"], l["comitente"]), l["comitente"])

    registro = []
    for (b, n) in sorted(meses_de, key=lambda k: (BLOCOS.index(k[0]), destino.get(k, k[1]), min(meses_de[k]))):
        orig = sorted(originais[(b, n)])
        sit = situacao.get((b, n), "Sem mudança")
        if any(o != n for o in orig):
            sit = "Grafia corrigida (Delares → Dealers); " + sit
        registro.append({"bloco": b, "original": " / ".join(orig), "nome": n,
                         "padronizado": destino.get((b, n), n),
                         "meses": ", ".join(ABREV[m - 1] for m in sorted(meses_de[(b, n)])),
                         "produtos": " / ".join(sorted(prods[(b, n)])), "situacao": sit})
    return registro


def regra_receita(d):
    """'fixo' (R$ por venda) ou 'percentual' (% do valor de venda): a razão que menos varia
    nos meses com venda, a partir da tarifa nova (abr/26). Um mês só ou valor de venda zerado: fixo."""
    meses = [m for m in d["ven"] if d["ven"][m] > 0 and d["rec"][m] > 0 and m >= 4]
    if len(meses) < 2 or any(d["vv"][m] <= 0 for m in meses):
        return "fixo"
    por_venda = [d["rec"][m] / d["ven"][m] for m in meses]
    por_valor = [d["rec"][m] / d["vv"][m] for m in meses]
    return "percentual" if max(por_valor) / min(por_valor) < max(por_venda) / min(por_venda) else "fixo"


def descreve_linhas(linhas, meses_dado):
    """Uma entrada por bloco × comitente padronizado, na ordem do fechamento mais recente."""
    por = defaultdict(lambda: {"meses": set(), "pub": defaultdict(float), "ven": defaultdict(float),
                               "rec": defaultdict(float), "vv": defaultdict(float), "ordem": {}, "nomes": set()})
    for l in linhas:
        d = por[(l["bloco"], l["padronizado"])]
        d["meses"].add(l["mes"])
        d["pub"][l["mes"]] += l.get("Qtde Publicadas") or 0
        d["ven"][l["mes"]] += l.get("Vendas Confirmadas") or 0
        d["rec"][l["mes"]] += l.get("Receita Bruta") or 0
        d["vv"][l["mes"]] += l.get("Valor de Venda") or 0
        d["ordem"][l["mes"]] = min(d["ordem"].get(l["mes"], 10 ** 9), l["linha"])
        d["nomes"].add(l["comitente"])
    prim, ult = min(meses_dado), max(meses_dado)
    out = []
    for (b, c), d in por.items():
        inicio, ultimo = min(d["meses"]), max(d["meses"])
        # Repasse é R$ 990 por placa vendida (Tuunelis, reunião); os outros blocos, pelos dados
        regra = "fixo" if b == "Repasse" else regra_receita(d)
        obs, curta = [], []          # completa (título do bloco) e curta (resumo por comitente)
        if inicio > prim:
            obs.append(f"Primeira linha no fechamento em {ABREV[inicio - 1]}/26")
            curta.append(f"Desde {ABREV[inicio - 1]}/26")
        if ultimo < ult:
            obs.append(f"⚠ Última linha no fechamento em {ABREV[ultimo - 1]}/26")
            curta.append(f"⚠ Até {ABREV[ultimo - 1]}/26")
        if c.startswith(PREFIXO_AJUSTE):
            obs.append("⚠ Ajuste de mês anterior")
            curta.append("⚠ Ajuste")
        if not any(d["pub"].values()):
            obs.append("Sem publicação em 2026")
            curta.append("Sem publicação")
        if len(d["nomes"]) > 1:
            obs.append("Mesclado (ver De-para)")
            curta.append("Mesclado")
        obs.append("Receita: % do valor de venda" if regra == "percentual" else "Receita: R$ fixo por venda")
        curta.append("Receita % da venda" if regra == "percentual" else "Receita R$ fixo")
        out.append({"bloco": b, "com": c, "regra": regra, "obs": " · ".join(obs), "obs_curta": " · ".join(curta),
                    "ordem": (BLOCOS.index(b), -ultimo, d["ordem"][ultimo])})
    out.sort(key=lambda x: x["ordem"])
    return out


# ---------------------------------------------------------------- planilha

def cabecalho(ws, r, rotulos):
    for c, v in enumerate(rotulos, start=X(1)):
        cel = ws.cell(r, c, v)
        cel.font, cel.fill = FHDR, FILL_HDR
        cel.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    ws.row_dimensions[r].height = 40


def pinta(ws, r, fill):
    """Fundo da linha inteira da tabela."""
    for c in range(X(1), ULT + 1):
        ws.cell(r, c).fill = fill


def contorno(ws, r1, r2, c1, c2):
    """Só a borda de fora da tabela; nada de borda interna."""
    for r in range(r1, r2 + 1):
        for c in range(c1, c2 + 1):
            ws.cell(r, c).border = Border(left=_fio if c == c1 else None, right=_fio if c == c2 else None,
                                          top=_fio if r == r1 else None, bottom=_fio if r == r2 else None)


def larguras(ws):
    ws.column_dimensions["A"].width = 2                     # margem
    ws.row_dimensions[1].height = 8
    ws.column_dimensions[L(X(1))].width = 18
    for c in range(X(2), ULT + 1):
        ws.column_dimensions[L(c)].width = 13 if c <= X(1 + len(PREMISSAS)) else 12
    ws.freeze_panes = f"{L(X(2))}1"


def titulo_bloco(ws, t, titulo, obs=None):
    """Linha acima do cabeçalho: título na 2ª coluna da tabela, à esquerda; observação na última, à direita."""
    ws.row_dimensions[t].height = 24
    c = ws.cell(t, X(2), titulo)
    c.font, c.alignment = FBLOCO, ESQ
    if obs:
        c = ws.cell(t, COL_OBS, obs)
        c.font, c.alignment = (FOBS if "⚠" in obs else FNOTA), DIR


def totais_e_formato(ws, t, lay):
    """Total 2026, Total 2027, variação, cores, formatos e bordas de um bloco (comitente ou resumo)."""
    m26, t26, m27, t27, var = (t + lay[k] for k in ("m26", "t26", "m27", "t27", "var"))
    ano = t + lay["ano"] if lay["ano"] else None
    ws.cell(t26, X(1), "Total 2026")
    ws.cell(t27, X(1), "Total 2027")
    ws.cell(var, X(1), "Var. 2027 × 2026")
    for nome in COLS[1:]:
        col = C[nome]
        if nome in RAZOES:
            a, b = RAZOES[nome]
            for r in (t26, t27):
                ws[f"{col}{r}"] = f'=IFERROR({C[a]}{r}/{C[b]}{r},"")'
            ws[f"{col}{var}"] = f'=IFERROR(ROUND({col}{t27}-{col}{t26},6),"")'
        elif nome == "% Incremento publicados":
            ws[f"{col}{t27}"] = f'=IFERROR({PUB}{t27}/{PUB}{t26}-1,"")'
        elif nome == "# Incremento publicados":
            ws[f"{col}{t27}"] = f"=SUM({col}{m27}:{col}{m27 + 11})"
        elif nome == "Var. êxito (p.p.)":
            ws[f"{col}{t27}"] = f'=IFERROR({VEN}{t27}/{PUB}{t27}-{VEN}{t26}/{PUB}{t26},"")'
        elif nome == "Receita por venda (R$)":
            for r in (t26, t27):
                ws[f"{col}{r}"] = f'=IFERROR({REC}{r}/{VEN}{r},"")'
            ws[f"{col}{var}"] = f'=IFERROR(ROUND({col}{t27}/{col}{t26}-1,6),"")'
        else:
            ws[f"{col}{t26}"] = f"=SUM({col}{m26}:{col}{m26 + 11})"
            ws[f"{col}{t27}"] = f"=SUM({col}{m27}:{col}{m27 + 11})"
            ws[f"{col}{var}"] = f'=IFERROR(ROUND({col}{t27}/{col}{t26}-1,6),"")'
    for r in range(m26, var + 1):
        for c, nome in enumerate(COLS, start=X(1)):
            cel = ws.cell(r, c)
            cel.number_format = PCT if r == var and c > X(1) else fmt_col(nome)
            cel.alignment = CENTRO
            if r == ano and X(2) <= c <= X(4):
                continue                                    # entradas, já em azul
            cel.font = FNOTA if r == var else FBOLD if r in (t26, t27) or (r == ano and c == X(1)) else F
        if m27 <= r < t27:
            pinta(ws, r, FILL_PROJ)
            if ano:
                for c in range(X(2), X(2) + len(PREMISSAS)):
                    ws.cell(r, c).fill = FILL_MES
    pinta(ws, t26, FILL_SUB)
    pinta(ws, t27, FILL_SUB)
    contorno(ws, t + lay["cab"], var, X(1), ULT)


def grava(linhas, totais, depara, info, meses_dado, saida):
    wb = Workbook()
    ult = max(meses_dado)
    ref_tarifa = meses_dado[-3:]   # os 3 últimos meses fechados dão a tarifa atual (regra 6)
    janela = f"{ABREV[ref_tarifa[0] - 1]}–{ABREV[ref_tarifa[-1] - 1]}/26"

    # --- Base: o consolidado, uma linha por comitente × bloco × mês ---
    base = wb.active
    base.title = "Base"
    cab = ["Mês", "Bloco", "Produto", "Origem", "Comitente padronizado", "Comitente no fechamento"] + METRICAS + CAIXA + list(RAZOES) + ["Arquivo", "Aba", "Linha"]
    base.append(cab)
    cb = {n: L(i + 1) for i, n in enumerate(cab)}
    for i, l in enumerate(linhas, start=2):
        row = [date(2026, l["mes"], 1), l["bloco"], l["produto"], l["origem"], l["padronizado"], l["comitente_orig"]]
        row += [l.get(m) for m in METRICAS + CAIXA]
        row += [f'=IFERROR({cb[a]}{i}/{cb[b]}{i},"")' for a, b in RAZOES.values()]
        row += [l["arquivo"], l["aba"], l["linha"]]
        base.append(row)
    nb = len(linhas) + 1
    for c, nome in enumerate(cab, start=1):
        h = base.cell(1, c)
        h.font, h.fill = FHDR, FILL_HDR
        h.alignment = Alignment(wrap_text=True, vertical="center")
        fmt = ("mmm/yy" if nome == "Mês" else RS2 if nome in MOEDA else PCT if nome in RAZOES
               else QTD if nome in METRICAS or nome in CAIXA else None)
        for r in range(2, nb + 1):
            cel = base.cell(r, c)
            cel.font = F
            if fmt:
                cel.number_format = fmt
        base.column_dimensions[L(c)].width = 36 if nome.startswith("Comitente") or nome == "Arquivo" else 26 if nome == "Bloco" else 13
    base.row_dimensions[1].height = 54
    base.freeze_panes = "G2"
    base.auto_filter.ref = f"A1:{L(len(cab))}{nb}"

    def rng(nome):
        return f"Base!${cb[nome]}$2:${cb[nome]}${nb}"

    def S(met, t, m, com=True):
        """SUMIFS na Base, no mês m de 2026, para o bloco (e o comitente) do bloco de linhas que começa em t."""
        crit = f'{rng("Bloco")},${L(COL_BLOCO)}${t}'
        if com:
            crit += f',{rng("Comitente padronizado")},${L(COL_COM)}${t}'
        return f"SUMIFS({rng(met)},{crit},{rng('Mês')},DATE(2026,{m},1))"

    def soma(partes):
        return "(" + "+".join(partes) + ")"

    # --- Projeção 2027: um bloco por comitente ---
    pj = wb.create_sheet("Projeção 2027")
    pj.sheet_view.showGridLines = False
    pj.sheet_properties.outlinePr = Outline(summaryBelow=True, summaryRight=True)
    pj.cell(2, X(2), "Projeção 2027 por comitente").font = FPAG
    pj.cell(3, X(2), "No topo, a comparação anual por comitente (2026 realizado × 2027 projetado). "
                     "Em cada comitente: jan–dez/26 realizados (fundo branco), Total 2026, a premissa do ano e jan–dez/27 projetados "
                     "(fundo verde). Cada mês de 2027 parte da linha do mesmo mês de 2026: publicados = 2026 × (1 + %) + #. "
                     "Amarelo forte = premissa do ano; amarelo claro = do mês, segue o ano até ser sobrescrito.").font = FNOTA
    linhas_info = list(info)

    # no topo, a comparação anual por comitente (sem bloco) e o total; os blocos vêm depois
    rc = 5
    linhas_rc = [("l", x) for x in linhas_info] + [("t", None)]
    topo = rc + 2 + 3 * len(linhas_rc) + 2
    pos = {id(x): topo + i * ALTURA_PJ for i, x in enumerate(linhas_info)}

    def alvo(t):
        """Link para o bloco: uma faixa maior que a tela faz o Excel pôr o título no topo
        (uma célula só para no pé da tela; medido no Excel em 30/10)."""
        return f"'Projeção 2027'!{L(X(2))}{t}:{L(X(2))}{t + 100}"

    # --- comparação anual por comitente: o formato das tabelas, com o comitente mesclado no lugar
    # das premissas e 2026 / 2027 / variação no lugar dos meses. Todos os comitentes num grupo de
    # tópicos (botão [–] do Excel); o total geral fica de fora, e é o que sobra ao recolher.
    titulo_bloco(pj, rc, "Comparação anual por comitente",
                 "Clique no comitente para ir ao bloco dele · [–] à esquerda recolhe e deixa só o total")
    cabecalho(pj, rc + 1, ["Ano", "Comitente", "", "", ""] + ORIG)
    pj.merge_cells(start_row=rc + 1, start_column=X(2), end_row=rc + 1, end_column=X(5))
    contorno(pj, rc + 1, rc + 1, X(1), ULT)
    ini = rc + 2
    membros = []                                            # linha de 2026 de cada comitente
    for i, (tipo, x) in enumerate(linhas_rc):
        r26, r27, rv = ini + 3 * i, ini + 3 * i + 1, ini + 3 * i + 2
        pj.merge_cells(start_row=r26, start_column=X(2), end_row=rv, end_column=X(5))
        for r, rot in ((r26, "2026"), (r27, "2027"), (rv, "Var.")):
            pj.cell(r, X(1), rot)
        if tipo == "l":
            t = pos[id(x)]
            rotulo = pj.cell(r26, X(2), x["com"])
            rotulo.hyperlink = Hyperlink(ref=rotulo.coordinate, location=alvo(t))
            pj.cell(r26, COL_BLOCO, x["bloco"])
            pj.cell(r26, COL_COM, x["com"])
            membros.append(r26)
        else:
            pj.cell(r26, X(2), "TOTAL GERAL")
        for nome in ORIG:
            col = C[nome]
            if nome in RAZOES:
                a, b = RAZOES[nome]
                for r in (r26, r27):
                    pj[f"{col}{r}"] = f'=IFERROR({C[a]}{r}/{C[b]}{r},"")'
                pj[f"{col}{rv}"] = f'=IFERROR(ROUND({col}{r27}-{col}{r26},6),"")'
                continue
            if tipo == "l":
                pj[f"{col}{r26}"] = f"={col}{t + LAY_PJ['t26']}"
                pj[f"{col}{r27}"] = f"={col}{t + LAY_PJ['t27']}"
            else:
                pj[f"{col}{r26}"] = "=" + "+".join(f"{col}{p}" for p in membros)
                pj[f"{col}{r27}"] = "=" + "+".join(f"{col}{p + 1}" for p in membros)
            pj[f"{col}{rv}"] = f'=IFERROR(ROUND({col}{r27}/{col}{r26}-1,6),"")'
        for r in (r26, r27, rv):
            for c, nome in enumerate(COLS, start=X(1)):
                cel = pj.cell(r, c)
                cel.alignment = CENTRO
                cel.number_format = PCT if r == rv and c > X(1) else fmt_col(nome)
                cel.font = FNOTA if r == rv else FBOLD if tipo != "l" else F
        rotulo = pj.cell(r26, X(2))
        rotulo.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        rotulo.font = FLINKC if tipo == "l" else FBOLD
        if tipo == "l":
            for c in [X(1)] + list(range(X(6), ULT + 1)):
                pj.cell(r27, c).fill = FILL_PROJ
        else:
            for r in (r26, r27, rv):
                pinta(pj, r, FILL_SUB)
            # comitentes num grupo de tópicos; o total, logo abaixo, fica de fora
            pj.row_dimensions.group(membros[0], membros[-1] + 2, outline_level=1, hidden=False)
        contorno(pj, r26, rv, X(1), ULT)                    # uma borda em torno de cada comitente

    for x in linhas_info:
        t = pos[id(x)]
        ano, t26, m26, m27 = (t + LAY_PJ[k] for k in ("ano", "t26", "m26", "m27"))
        pj.cell(t, COL_BLOCO, x["bloco"])
        pj.cell(t, COL_COM, x["com"])
        titulo_bloco(pj, t, f"{x['com']}  ·  {x['bloco']}", x["obs"])
        topo_link = pj.cell(t, X(1), "↑ Topo")
        topo_link.hyperlink = Hyperlink(ref=topo_link.coordinate, location="'Projeção 2027'!A1")
        topo_link.font, topo_link.alignment = FLINKC, CENTRO
        cabecalho(pj, t + LAY_PJ["cab"], COLS)

        # premissas do ano, logo abaixo do Total 2026: valem para todos os meses de 2027
        pj.cell(ano, X(1), "Premissa do ano")
        for col in (GPCT, GQTD, DEX):
            c = pj[f"{col}{ano}"]
            c.value, c.font, c.fill = 0, FIN, FILL_IN
        pj[f"{GQTD}{ano}"].comment = Comment("Publicados a mais em cada mês de 2027, além do %. Vale para os 12 meses; "
                                              "digite num mês para mudar só ele.", "monta_projecao.py")
        rec_rec = soma(f"{REC}{m26 + m - 1}" for m in ref_tarifa)
        ven_rec = soma(f"{VEN}{m26 + m - 1}" for m in ref_tarifa)
        rec_blo = soma(S("Receita Bruta", t, m, com=False) for m in ref_tarifa)
        ven_blo = soma(S("Vendas Confirmadas", t, m, com=False) for m in ref_tarifa)
        d = pj[f"{RPV}{ano}"]
        d.value = f"=IFERROR({rec_rec}/{ven_rec},IFERROR({REC}{t26}/{VEN}{t26},IFERROR({rec_blo}/{ven_blo},0)))"
        d.fill = FILL_IN
        d.comment = Comment(f"Receita ÷ vendas confirmadas de {janela} (tarifa atual). Sem venda: o ano todo; "
                            "sem venda no ano: média do bloco. Pode digitar outro valor.", "monta_projecao.py")

        # 2026 realizado: as mesmas colunas, direto da Base
        for m in range(1, 13):
            r = m26 + m - 1
            pj.cell(r, X(1), date(2026, m, 1))
            pj[f"{RPV}{r}"] = f'=IFERROR({REC}{r}/{VEN}{r},"")'
            for nome in ORIG:
                if nome in RAZOES:
                    a, b = RAZOES[nome]
                    pj[f"{C[nome]}{r}"] = f'=IFERROR({C[a]}{r}/{C[b]}{r},"")'
                else:
                    pj[f"{C[nome]}{r}"] = f"={S(nome, t, m)}"

        # 2027 projetado: cada mês parte da linha do mesmo mês de 2026. O volume bruto pode
        # criar publicação em mês sem 2026: aí vale o êxito e as proporções do ano (Total 2026).
        for m in range(1, 13):
            r, rr = m27 + m - 1, m26 + m - 1
            pj.cell(r, X(1), date(2027, m, 1))
            for col in (GPCT, GQTD, DEX):
                pj[f"{col}{r}"] = f"=${col}${ano}"
            if x["regra"] == "percentual":
                pj[f"{RPV}{r}"] = f"=IFERROR({REC}{rr}/{VEN}{rr},${RPV}${ano})"
            else:
                pj[f"{RPV}{r}"] = f"=${RPV}${ano}"
            exito_ano = f"IFERROR({VEN}{t26}/{PUB}{t26},0)"
            pj[f"{PUB}{r}"] = f"={PUB}{rr}*(1+{GPCT}{r})+{GQTD}{r}"
            pj[f"{VEN}{r}"] = (f"=IF({PUB}{rr}=0,{VEN}{rr}*(1+{GPCT}{r})+{GQTD}{r}*MAX(0,{exito_ano}+{DEX}{r}),"
                               f"MAX(0,{PUB}{r}*({VEN}{rr}/{PUB}{rr}+{DEX}{r})))")
            for nome in ORIG:
                col = C[nome]
                if nome in PELOS_PUBLICADOS:
                    v = f"={PUB}{r}*IFERROR({col}{rr}/{PUB}{rr},IFERROR({col}{t26}/{PUB}{t26},0))"
                elif nome in PELAS_VENDAS:
                    v = f"={VEN}{r}*IFERROR({col}{rr}/{VEN}{rr},IFERROR({col}{t26}/{VEN}{t26},0))"
                elif nome in RAZOES:
                    a, b = RAZOES[nome]
                    v = f'=IFERROR({C[a]}{r}/{C[b]}{r},"")'
                elif nome == "Receita Bruta":
                    v = f"={VEN}{r}*{RPV}{r}"
                else:
                    continue
                pj[f"{col}{r}"] = v

        totais_e_formato(pj, t, LAY_PJ)

    larguras(pj)
    for c in (COL_BLOCO, COL_COM):
        pj.column_dimensions[L(c)].hidden = True

    # --- Resumo 2027: o mesmo formato por bloco e no total (sem linha de premissa) ---
    rs = wb.create_sheet("Resumo 2027")
    rs.sheet_view.showGridLines = False
    rs.cell(2, X(2), "Resumo 2027 por bloco").font = FPAG
    rs.cell(3, X(2), "Soma dos comitentes da aba Projeção 2027. Nas linhas de 2027, as colunas de premissa mostram o efeito "
                  "resultante: incremento dos publicados e variação do êxito contra o mesmo mês de 2026, receita por venda média.").font = FNOTA
    blocos = [b for b in BLOCOS if any(x["bloco"] == b for x in linhas_info)]
    rpos = {b: 5 + i * ALTURA_RS for i, b in enumerate(blocos + ["TOTAL GERAL"])}
    somaveis = [n for n in ORIG if n not in RAZOES] + ["# Incremento publicados"]

    def parcelas(b, col, ano_ref, m):
        """Soma de uma célula do mês nos comitentes do bloco (ou nos blocos, para o total geral)."""
        if b == "TOTAL GERAL":
            ini = LAY_RS["m26"] if ano_ref == 2026 else LAY_RS["m27"]
            return "=" + "+".join(f"{col}{rpos[o] + ini + m - 1}" for o in blocos)
        ini = LAY_PJ["m26"] if ano_ref == 2026 else LAY_PJ["m27"]
        return "=" + "+".join(f"'Projeção 2027'!{col}{pos[id(x)] + ini + m - 1}" for x in linhas_info if x["bloco"] == b)

    for b in blocos + ["TOTAL GERAL"]:
        t = rpos[b]
        titulo_bloco(rs, t, b)
        cabecalho(rs, t + LAY_RS["cab"], COLS)
        for ano_ref, ini in ((2026, LAY_RS["m26"]), (2027, LAY_RS["m27"])):
            for m in range(1, 13):
                r = t + ini + m - 1
                rs.cell(r, X(1), date(ano_ref, m, 1))
                for nome in somaveis:
                    if ano_ref == 2027 or nome in ORIG:
                        rs[f"{C[nome]}{r}"] = parcelas(b, C[nome], ano_ref, m)
                for nome, (a, bb) in RAZOES.items():
                    rs[f"{C[nome]}{r}"] = f'=IFERROR({C[a]}{r}/{C[bb]}{r},"")'
                rs[f"{RPV}{r}"] = f'=IFERROR({REC}{r}/{VEN}{r},"")'
                if ano_ref == 2027:
                    rr = t + LAY_RS["m26"] + m - 1
                    rs[f"{GPCT}{r}"] = f'=IFERROR({PUB}{r}/{PUB}{rr}-1,"")'
                    rs[f"{DEX}{r}"] = f'=IFERROR({VEN}{r}/{PUB}{r}-{VEN}{rr}/{PUB}{rr},"")'
        totais_e_formato(rs, t, LAY_RS)
    larguras(rs)

    # --- De-para ---
    dp = wb.create_sheet("De-para")
    dp.append(["Bloco", "Nome no fechamento", "Comitente padronizado", "Meses em que aparece", "Produto(s) no fechamento", "Situação"])
    for c in range(1, 7):
        dp.cell(1, c).font, dp.cell(1, c).fill = FHDR, FILL_HDR
    for d in depara:
        dp.append([d["bloco"], d["original"], d["padronizado"], d["meses"], d["produtos"], d["situacao"]])
    for row in dp.iter_rows(min_row=2):
        for c in row:
            c.font = FBOLD if c.column == 6 and c.value.startswith(("Mesclado", "Candidato")) else F
    n = dp.max_row + 2
    for t in ["Regra (Thomas, 29/10): mescla só se for o mesmo relatório operacional (bloco), o mesmo produto e se os nomes nunca aparecem no mesmo mês.",
              "Produto: 'icarros club' e 'Cars2you' (e, na Venda Direta, 'Cars2you' e 'WL') contam como o mesmo produto — o mesmo comitente aparece com os dois rótulos em meses diferentes.",
              "Candidatos avaliados: os pares apontados na leitura da reunião e todas as linhas 'Dealers - Venda Direta - Ajuste <mês>'."]:
        dp.cell(n, 1, t).font = FNOTA
        n += 1
    for c, w in zip("ABCDEF", (32, 46, 42, 34, 30, 60)):
        dp.column_dimensions[c].width = w
    dp.freeze_panes = "A2"

    # --- Conferência: soma da Base x RESULTADO GERAL de cada fechamento ---
    cs = wb.create_sheet("Conferência")
    cs.append(["Mês", "Métrica", "Origem (RESULTADO GERAL)", "Base consolidada", "Diferença"])
    for c in range(1, 6):
        cs.cell(1, c).font, cs.cell(1, c).fill = FHDR, FILL_HDR
    gerais = {t["mes"]: t for t in totais if t["bloco"] == "GERAL"}
    rr = 2
    for m in meses_dado:
        t = gerais[m]
        for met in ["Qtde Publicadas", "Vendas Confirmadas", "Valor de Venda", "Receita Bruta"] + CAIXA:
            cs.cell(rr, 1, date(2026, m, 1)).number_format = "mmm/yy"
            cs.cell(rr, 2, met)
            o = cs.cell(rr, 3, t.get(met) or 0)
            o.font = FIN
            o.comment = Comment(f"Copiado da linha RESULTADO GERAL (L{t['linha']}) da aba geral do fechamento de {ABREV[m - 1]}/2026.", "monta_projecao.py")
            cs.cell(rr, 4, f'=SUMIFS({rng(met)},{rng("Mês")},A{rr})')
            cs.cell(rr, 5, f"=D{rr}-C{rr}")
            for c in (1, 2, 4, 5):
                cs.cell(rr, c).font = F
            for c in range(3, 6):
                cs.cell(rr, c).number_format = RS2
            rr += 1
    for c, w in zip("ABCDE", (10, 50, 24, 18, 12)):
        cs.column_dimensions[c].width = w
    cs.freeze_panes = "A2"

    # --- Leia-me ---
    lm = wb.create_sheet("Leia-me", 0)
    texto = [
        ("Projeção de vendas 2027 — base: fechamentos de 2026 (aba geral)", "tit"),
        (f"Fechamentos lidos: jan–{ABREV[ult - 1]}/2026 ({len(linhas)} linhas, {len(linhas_info)} comitentes depois da mesclagem).", ""),
        ("", ""),
        ("Abas (à vista: Projeção 2027 e Base; as outras estão ocultas — Página Inicial › Formatar › Ocultar e Reexibir)", "sec"),
        ("• Projeção 2027 — no topo, a comparação anual por comitente no formato das tabelas: comitente mesclado no lugar das "
         "premissas e 2026 / 2027 / variação no lugar dos meses, uma borda em torno de cada comitente e o total geral no fim. "
         "O [–] à esquerda recolhe os comitentes e deixa só o total; o nome do comitente leva ao bloco dele, e o '↑ Topo' "
         "de cada bloco volta. Depois, um bloco por comitente no formato da tabela de origem (Em Preparação … Receita Bruta): "
         "jan–dez/26 realizados (fundo branco), Total 2026, a premissa do ano, jan–dez/27 projetados (fundo verde), Total 2027 "
         "e a variação.", ""),
        ("• Resumo 2027 (oculta) — o mesmo formato por bloco (Repasse, Venda Direta, Trucks2you, B2AUTO) e no total geral.", ""),
        ("• Base — o consolidado: uma linha por comitente × bloco × mês, todas as colunas da aba geral, inclusive as de caixa.", ""),
        ("• De-para — quais nomes de comitente viraram uma linha só, e por quê. • Conferência — Base contra o RESULTADO GERAL de cada fechamento (diferença zero).", ""),
        ("", ""),
        ("Como usar", "sec"),
        ("1. Na linha 'Premissa do ano' de cada comitente, logo abaixo do Total 2026 (amarelo forte): '% Incremento publicados', "
         "'# Incremento publicados' — volume bruto a mais em cada mês, além do % — e 'Var. êxito (p.p.)'. "
         "Os meses de 2027 (amarelo claro) seguem o ano; digite num mês para mudar só ele.", ""),
        (f"2. 'Receita por venda' do ano já vem com a tarifa atual ({janela}); mude se a de 2027 for outra.", ""),
        (f"3. {ABREV[ult].capitalize()}–dez/2026: quando os fechamentos saírem, rode o script de novo (ou acrescente as linhas na aba Base, "
         "com o 'Comitente padronizado'). As linhas de 2026 e a projeção desses meses se atualizam sozinhas.", ""),
        ("", ""),
        ("Como cada coluna vai para 2027 (mês a mês, a partir da linha do mesmo mês de 2026)", "sec"),
        ("• Qtde Publicadas = 2026 × (1 + % incremento) + volume bruto do mês. Sem estimativa: mês sem valor em 2026 só ganha "
         "projeção se tiver volume bruto (o % sozinho não cria volume).", ""),
        ("• Vendas Confirmadas = publicados 2027 × (êxito do mesmo mês de 2026 + variação em p.p.). Mês sem publicados em 2026: "
         "o volume bruto vende pelo êxito do Total 2026 do comitente + variação. Com premissas zeradas, 2027 = 2026.", ""),
        ("• Em Preparação, Em aberto, Anúncio Ativo, Com Ofertas, Ativo s/ Oferta, Retirados, Encerrados e Recusadas: "
         "mesma proporção sobre os publicados que tiveram no mesmo mês de 2026 (sem publicados no mês: a do Total 2026).", ""),
        ("• Qtde de Vendas, Em Análise, Valor de Mercado, VMV e Valor de Venda: mesma proporção sobre as vendas confirmadas "
         "do mesmo mês de 2026 (sem vendas no mês: a do Total 2026).", ""),
        ("• Êxito, % Rec. VMV e % Rec. Mercado: recalculados. Receita Bruta = vendas confirmadas × receita por venda.", ""),
        ("• Receita por venda: 'R$ fixo por venda' (todo o Repasse, como o Tuunelis disse, e a maioria) usa a tarifa atual — a tarifa subiu "
         "em mar/abr-26 (R$ 799 → R$ 990 por placa; R$ 2.000 → R$ 2.500 nos pesados), então mesmo zerada a receita de jan–mar/27 sai acima. "
         "'% do valor de venda' (Itaú VD, Itaú VD Pesados, Scania Trucks2you) usa a receita por venda do mesmo mês de 2026, que carrega o preço do carro.", ""),
        ("• Comitentes mesclados só quando são do mesmo relatório operacional, do mesmo produto e nunca aparecem no mesmo mês.", ""),
        ("", ""),
        ("Pontos da origem", "sec"),
        ("• Ago/26, C6 Bank (Venda Direta): há um 9 na coluna G, sem cabeçalho e fora do total do bloco. Ficou de fora.", ""),
        ("• Abr/26, Toyota Lance Fácil BTB - Concessionárias: a origem calcula o êxito com Qtde de Vendas (37,0%); aqui usa Vendas Confirmadas (33,3%).", ""),
        ("", ""),
        ("Cores", "sec"),
        ("Azul = valor digitado · Preto = fórmula · Branco = 2026 realizado · Verde = 2027 projetado · "
         "Amarelo forte = premissa do ano · Amarelo claro = premissa do mês · Azul-claro = totais.", ""),
        ("", ""),
        ("Gerado por automations/projecao-vendas-2027/monta_projecao.py (work-brain do Thomas). Rodar de novo quando chegar um fechamento novo.", "nota"),
    ]
    for i, (t, est) in enumerate(texto, start=1):
        c = lm.cell(i, 1, t)
        c.font = (Font(name=ARIAL, size=13, bold=True, color="1F3864") if est == "tit" else FBOLD if est == "sec"
                  else FNOTA if est == "nota" else F)
        c.alignment = Alignment(wrap_text=True, vertical="top")
    lm.column_dimensions["A"].width = 160

    # só Projeção 2027 e Base ficam à vista (Thomas, 30/10); as outras seguem no arquivo, ocultas
    visiveis = ["Projeção 2027", "Base"]
    wb._sheets = [wb[n] for n in visiveis + ["Leia-me", "Resumo 2027", "De-para", "Conferência"]]
    for ws in wb.worksheets:
        ws.sheet_state = "visible" if ws.title in visiveis else "hidden"
        ws.sheet_view.tabSelected = ws.title == visiveis[0]
    wb.active = 0
    wb.save(saida)


def main():
    pasta, saida = sys.argv[1], sys.argv[2]
    linhas, totais, avisos = le_todos(pasta)
    for a in avisos:
        print("AVISO", a)
    difs = confere(linhas, totais) + confere_competencia(linhas)
    print(f"\nconferência: {len(difs)} diferença(s)")
    for d in difs:
        print("  ", d)
    depara = mesclar(linhas)
    meses_dado = sorted({l["mes"] for l in linhas})
    info = descreve_linhas(linhas, meses_dado)
    print(f"\n{len(info)} comitentes; receita em %: {[x['com'] for x in info if x['regra'] == 'percentual']}")
    grava(linhas, totais, depara, info, meses_dado, saida)
    print(f"planilha gravada em {saida}")


if __name__ == "__main__":
    main()
