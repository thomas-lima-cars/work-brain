# -*- coding: utf-8 -*-
"""Estudo de Republicacoes Dealers: resultados.json (analisa.py) -> estudo-republicacoes-dealers.xlsx

    python monta-excel.py

O analitico em Excel do mesmo estudo do HTML (pedido do Thomas em 24/11):
  - Resumo        cartoes, por ordem, por categoria, por mes da republicacao, status na 1a base, passagens
  - Por comitente a tabela Por comitente do HTML
  - Veiculos      uma linha por carro, os dois lados (Cars2You e Dealers) lado a lado
  - Passagens     uma linha por passagem (publicacoes seguidas na mesma base)
  - Publicacoes   uma linha por publicacao de 2026 das duas bases
  - Metodo        o metodo e o glossario do HTML
Resumo e Por comitente sao FORMULAS sobre a aba Veiculos: filtrar ou corrigir a base recalcula.
As mesmas regras do HTML (estudo.template.html): FIPE de referencia = a da propria base, sem ela a da
outra; % FIPE so entre 20% e 120%; venda / FIPE em media, ultima oferta / FIPE e prazos em mediana;
intervalo mediano sem os de mesmo dia; tempo de venda = data da venda - 1a publicacao de 2026 no banco.
"""
import json
import subprocess
import sys
from collections import Counter
from datetime import date, datetime, timedelta
from pathlib import Path

from openpyxl import Workbook
from openpyxl.comments import Comment
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.formula import ArrayFormula
from openpyxl.worksheet.table import Table, TableStyleInfo

AQUI = Path(__file__).resolve().parent
R = json.loads((AQUI / "resultados.json").read_text(encoding="utf-8"))
SAIDA = AQUI / "estudo-republicacoes-dealers.xlsx"
ST = {int(k): v for k, v in R["status"].items()}
EVENTOS = R["eventos"]
CARROS = R["carros"]
RS = R["resumo"]
DIA0 = date(2026, 1, 1)
NOME_ORD = {"CD": "Cars2You → Dealers", "DC": "Dealers → Cars2You", "MD": "Mesmo dia"}
NOME_BASE = ["Cars2You", "Dealers"]
VENDEU = {"nenhum": "Nenhuma", "c": "Cars2You", "d": "Dealers", "ambos": "As duas"}

# ---- estilo (Arial; azul da Cars2You no cabecalho, design/paletas/cars2you.json)
AZUL, AZUL_CL, CINZA = "1523A0", "487DEA", "E4E6E6"
F = Font(name="Arial", size=10)
FB = Font(name="Arial", size=10, bold=True)
FH = Font(name="Arial", size=10, bold=True, color="FFFFFF")
FT = Font(name="Arial", size=14, bold=True, color=AZUL)
FS = Font(name="Arial", size=9, italic=True, color="666666")
FILL_H = PatternFill("solid", fgColor=AZUL)
FILL_C = PatternFill("solid", fgColor="DCE6FA")   # grupo Cars2You
FILL_D = PatternFill("solid", fgColor="FBE3D6")   # grupo Dealers
FILL_K = PatternFill("solid", fgColor="F3F4F4")
LINHA = Border(bottom=Side(style="thin", color=CINZA))
CENTRO = Alignment(horizontal="center", vertical="center", wrap_text=True)
ESQ = Alignment(horizontal="left", vertical="center", wrap_text=True)
DATA, INT, MOEDA, PCT, DEC = "dd/mm/yyyy", "#,##0", "#,##0", "0.0%", "#,##0.0"


def dia(s):
    return datetime.strptime(s[:10], "%Y-%m-%d").date() if s else None


def d0(n):
    return DIA0 + timedelta(days=n) if n is not None else None


def sim(x):
    return "Sim" if x else "Não"


def rota(pas):
    return " → ".join("CD"[p[0]] for p in pas)


def cabecalho(ws, linha, nomes, fills=None):
    for k, n in enumerate(nomes, 1):
        c = ws.cell(linha, k, n)
        c.font, c.alignment = FH, CENTRO
        c.fill = FILL_H
    ws.row_dimensions[linha].height = 42


def tabela(ws, nome, ncol, nlin):
    t = Table(displayName=nome, ref="A1:%s%d" % (get_column_letter(ncol), nlin))
    t.tableStyleInfo = TableStyleInfo(name="TableStyleLight9", showRowStripes=True)
    ws.add_table(t)
    ws.freeze_panes = "C2"


def larguras(ws, cols):
    for k, (_, w, _) in enumerate(cols, 1):
        ws.column_dimensions[get_column_letter(k)].width = w


wb = Workbook()

# =====================================================================================================
# VEICULOS: uma linha por carro
# =====================================================================================================
wv = wb.active
wv.title = "Veículos"
N = len(CARROS)
U = N + 1  # ultima linha


# (titulo, largura, formato); a ordem define a letra; as formulas usam a letra pelo titulo
def lado_cols(s):
    b = NOME_BASE[0] if s == "c" else NOME_BASE[1]
    cols = [
        ("Publicações %s" % b, 12, INT), ("Eventos %s" % b, 10, INT), ("Ofertas %s" % b, 10, INT),
        ("Maior oferta %s (R$)" % b, 14, MOEDA), ("Última oferta %s (R$)" % b, 14, MOEDA),
        ("Dia da última oferta %s" % b, 12, DATA), ("Status %s" % b, 18, None), ("Vendido %s" % b, 10, None),
        ("Venda %s (R$)" % b, 14, MOEDA), ("Data da venda %s" % b, 12, DATA),
        ("FIPE %s (R$)" % b, 14, MOEDA), ("Origem da FIPE %s" % b, 11, None),
        ("FIPE de referência %s (R$)" % b, 14, MOEDA), ("Última oferta ÷ FIPE %s" % b, 11, PCT),
        ("Venda ÷ FIPE %s" % b, 11, PCT), ("Tempo de venda %s (dias)" % b, 11, INT),
    ]
    if s == "c":
        cols += [("Molicar Cars2You (R$)", 14, MOEDA), ("Venda ÷ Molicar Cars2You", 11, PCT)]
    cols += [("Fim da última publicação %s" % b, 12, DATA), ("Último evento %s" % b, 40, None),
             ("Publicado antes de 2026 %s" % b, 11, None)]
    return cols


COLS_V = [
    ("ID", 6, INT), ("Placa", 10, None), ("Placa na Dealers (se difere)", 11, None), ("Casou por", 8, None),
    ("Comitente", 18, None), ("Comitente na Cars2You", 26, None), ("Comitente na Dealers", 26, None),
    ("Modelo", 24, None), ("Versão", 24, None), ("Ano", 7, "0"), ("KM", 10, INT), ("Categoria", 10, None),
    ("Ordem", 20, None), ("1ª publicação Cars2You", 12, DATA), ("1ª publicação Dealers", 12, DATA),
    ("Intervalo (dias)", 10, INT), ("Dia da republicação", 12, DATA), ("Mês da republicação", 10, "mmm/yy"),
    ("Passagens", 10, INT), ("Rota", 18, None), ("Devolvido", 10, None),
    ("No ar nas duas ao mesmo tempo", 12, None), ("Republicado com a outra vendida ou em análise", 14, None),
    ("Erro operacional", 11, None), ("Motivo do erro operacional", 50, None),
    ("Status na 1ª base quando foi à 2ª", 20, None), ("Vendeu em", 11, None),
] + lado_cols("c") + lado_cols("d")
L = {t: get_column_letter(k) for k, (t, _, _) in enumerate(COLS_V, 1)}


def rng(titulo, aba="'Veículos'"):
    return "%s!$%s$2:$%s$%d" % (aba, L[titulo], L[titulo], U)


cabecalho(wv, 1, [c[0] for c in COLS_V])
for k, (t, _, _) in enumerate(COLS_V, 1):
    if t.endswith("Cars2You") or "Cars2You (" in t or t.startswith("Molicar"):
        wv.cell(1, k).fill = PatternFill("solid", fgColor=AZUL)
    if "Dealers" in t and t not in ("Comitente na Dealers", "Placa na Dealers (se difere)", "1ª publicação Dealers"):
        wv.cell(1, k).fill = PatternFill("solid", fgColor="8A3B12")

for r, c in enumerate(CARROS, 2):
    v = {
        "ID": c["id"], "Placa": c["placa"], "Placa na Dealers (se difere)": c["placa_d"], "Casou por": c["por"],
        "Comitente": c["dono"], "Comitente na Cars2You": c["com_c"], "Comitente na Dealers": c["com_d"],
        "Modelo": c["modelo"], "Versão": c["versao"], "Ano": c["ano"], "KM": c["km"], "Categoria": c["cat"],
        "Ordem": NOME_ORD[c["ordem"]], "1ª publicação Cars2You": dia(c["c"]["ini"]),
        "1ª publicação Dealers": dia(c["d"]["ini"]),
        "Intervalo (dias)": "=ABS({a}{r}-{b}{r})".format(a=L["1ª publicação Cars2You"], b=L["1ª publicação Dealers"], r=r),
        "Dia da republicação": "=MAX({a}{r},{b}{r})".format(a=L["1ª publicação Cars2You"], b=L["1ª publicação Dealers"], r=r),
        "Mês da republicação": "=DATE(YEAR({a}{r}),MONTH({a}{r}),1)".format(a=L["Dia da republicação"], r=r),
        "Passagens": len(c["pas"]), "Rota": rota(c["pas"]), "Devolvido": sim(c["dev"]),
        "No ar nas duas ao mesmo tempo": sim(c["erro_sim"]),
        "Republicado com a outra vendida ou em análise": sim(c["erro_rep"]),
        "Erro operacional": '=IF(OR({a}{r}="Sim",{b}{r}="Sim"),"Sim","Não")'.format(
            a=L["No ar nas duas ao mesmo tempo"], b=L["Republicado com a outra vendida ou em análise"], r=r),
        "Motivo do erro operacional": " | ".join(c["erro_txt"]) or None,
        "Status na 1ª base quando foi à 2ª": (ST.get(c["st_antes"], "status %s" % c["st_antes"]) if c["st_antes"] is not None
                                              else ("Mesmo dia" if c["ordem"] == "MD" else "Sem publicação anterior")),
        "Vendeu em": VENDEU[c["vendeu"]],
    }
    for s, b in (("c", "Cars2You"), ("d", "Dealers")):
        x, o = c[s], c["d" if s == "c" else "c"]
        fipe, fr = "FIPE %s (R$)" % b, "FIPE de referência %s (R$)" % b
        fo = "FIPE Dealers (R$)" if s == "c" else "FIPE Cars2You (R$)"
        ult, ven = "Última oferta %s (R$)" % b, "Venda %s (R$)" % b
        pct = '=IF(AND(ISNUMBER({v}{r}),ISNUMBER({f}{r})),IF(AND({v}{r}/{f}{r}>=0.2,{v}{r}/{f}{r}<=1.2),{v}{r}/{f}{r},""),"")'
        v.update({
            "Publicações %s" % b: x["pub"], "Eventos %s" % b: x["ev"], "Ofertas %s" % b: x["of"],
            "Maior oferta %s (R$)" % b: x["maior"], ult: x["ult"], "Dia da última oferta %s" % b: dia(x["ult_dia"]),
            "Status %s" % b: ST.get(x["st"], x["st"]), "Vendido %s" % b: sim(x["vend"]),
            ven: x["venda"], "Data da venda %s" % b: dia(x["dv"]),
            fipe: x["fipe"], "Origem da FIPE %s" % b: {"anuncio": "anúncio", "veiculo": "cadastro"}.get(x["fipe_o"]),
            fr: '=IF(ISNUMBER({a}{r}),{a}{r},IF(ISNUMBER({b}{r}),{b}{r},""))'.format(a=L[fipe], b=L[fo], r=r),
            "Última oferta ÷ FIPE %s" % b: pct.format(v=L[ult], f=L[fr], r=r),
            "Venda ÷ FIPE %s" % b: pct.format(v=L[ven], f=L[fr], r=r),
            "Tempo de venda %s (dias)" % b: '=IF(AND({vd}{r}="Sim",ISNUMBER({dv}{r})),IF({dv}{r}-{ini}{r}>=0,{dv}{r}-{ini}{r},""),"")'.format(
                vd=L["Vendido %s" % b], dv=L["Data da venda %s" % b], ini=L["1ª publicação %s" % b], r=r),
            "Fim da última publicação %s" % b: dia(x["fim"]), "Último evento %s" % b: x["evento"],
            "Publicado antes de 2026 %s" % b: sim(x["hist"]),
        })
        if s == "c":
            v["Molicar Cars2You (R$)"] = x["molicar"]
            v["Venda ÷ Molicar Cars2You"] = pct.format(v=L[ven], f=L["Molicar Cars2You (R$)"], r=r)
    for k, (t, _, fmt) in enumerate(COLS_V, 1):
        cel = wv.cell(r, k, v[t])
        cel.font = F
        if fmt:
            cel.number_format = fmt
larguras(wv, COLS_V)
tabela(wv, "Veiculos", len(COLS_V), U)
wv.freeze_panes = "C2"

# =====================================================================================================
# PUBLICACOES e PASSAGENS
# =====================================================================================================
wp = wb.create_sheet("Publicações")
COLS_P = [("ID do carro", 7, INT), ("Placa", 10, None), ("Comitente", 18, None), ("Nº", 5, INT),
          ("Passagem", 9, INT), ("Banco", 10, None), ("Evento", 44, None), ("Início", 11, DATA),
          ("Fim no ar", 11, DATA), ("Dias no ar", 8, INT), ("Status", 20, None), ("Ofertas", 8, INT),
          ("Maior oferta (R$)", 13, MOEDA), ("Última oferta (R$)", 13, MOEDA), ("Venda (R$)", 13, MOEDA),
          ("Data da venda", 11, DATA), ("FIPE (R$)", 13, MOEDA), ("Última oferta ÷ FIPE", 10, PCT),
          ("Venda ÷ FIPE", 10, PCT)]
LP = {t: get_column_letter(k) for k, (t, _, _) in enumerate(COLS_P, 1)}
cabecalho(wp, 1, [c[0] for c in COLS_P])
wpa = wb.create_sheet("Passagens")
COLS_A = [("ID do carro", 7, INT), ("Placa", 10, None), ("Comitente", 18, None), ("Passagem", 9, INT),
          ("Banco", 10, None), ("Início", 11, DATA), ("Fim", 11, DATA), ("Dias publicados", 10, INT),
          ("Publicações", 11, INT), ("Status da última", 20, None), ("Status das publicações", 44, None),
          ("Ofertas", 8, INT), ("Maior oferta (R$)", 13, MOEDA), ("Data da venda", 11, DATA)]
cabecalho(wpa, 1, [c[0] for c in COLS_A])
rp = ra = 2
dias_pub_chk = []
for c in CARROS:
    # a passagem de cada publicacao: publicacoes seguidas na mesma base, na ordem de inicio (como no analisa.py)
    k, ant = 0, None
    por_pas = {}
    for n, p in enumerate(c["pubs"], 1):
        b, ini, fim, st, ev, of, maior, ult, venda, dv, fipe = p
        di, df = d0(ini), d0(fim)
        if b != ant:
            k, ant = k + 1, b
        por_pas.setdefault(k, []).append(p)
        pct = '=IF(AND(ISNUMBER({v}{r}),ISNUMBER({f}{r})),IF(AND({v}{r}/{f}{r}>=0.2,{v}{r}/{f}{r}<=1.2),{v}{r}/{f}{r},""),"")'
        linha = [c["id"], c["placa"], c["dono"], n, k, NOME_BASE[b], EVENTOS[ev], di, df,
                 "={f}{r}-{i}{r}+1".format(f=LP["Fim no ar"], i=LP["Início"], r=rp), ST.get(st, st), of, maior, ult,
                 venda, d0(dv), fipe,
                 pct.format(v=LP["Última oferta (R$)"], f=LP["FIPE (R$)"], r=rp),
                 pct.format(v=LP["Venda (R$)"], f=LP["FIPE (R$)"], r=rp)]
        for j, (val, (_, _, fmt)) in enumerate(zip(linha, COLS_P), 1):
            cel = wp.cell(rp, j, val)
            cel.font = F
            if fmt:
                cel.number_format = fmt
        rp += 1
    for k, p in enumerate(c["pas"], 1):
        ps = por_pas.get(k, [])
        dias = set()
        for q in ps:
            dias.update(range(q[1], q[2] + 1))
        cnt = p[5]
        txt = ", ".join("%s: %d" % (ST.get(cnt[j], cnt[j]), cnt[j + 1]) for j in range(0, len(cnt), 2))
        maior = max((q[6] for q in ps if q[6]), default=None)
        linha = [c["id"], c["placa"], c["dono"], k, NOME_BASE[p[0]], dia(p[1]), dia(p[2]), len(dias), p[3],
                 ST.get(p[4], p[4]), txt, sum(q[5] for q in ps), maior, dia(p[6])]
        dias_pub_chk.append(len(ps) == p[3])
        for j, (val, (_, _, fmt)) in enumerate(zip(linha, COLS_A), 1):
            cel = wpa.cell(ra, j, val)
            cel.font = F
            if fmt:
                cel.number_format = fmt
        ra += 1
larguras(wp, COLS_P)
larguras(wpa, COLS_A)
tabela(wp, "Publicacoes", len(COLS_P), rp - 1)
tabela(wpa, "Passagens", len(COLS_A), ra - 1)
wpa.cell(1, 8).comment = Comment("Dias de calendário com alguma publicação da passagem no ar, contando o dia do "
                                 "início e o do fim; dias sobrepostos contam uma vez (regra do HTML).", "estudo")
if not all(dias_pub_chk):
    print("✗ %d passagens com contagem de publicações diferente da do analisa.py" % dias_pub_chk.count(False))
    sys.exit(1)

# =====================================================================================================
# RESUMO (formulas sobre Veiculos)
# =====================================================================================================
wr = wb.create_sheet("Resumo", 0)
wr.sheet_view.showGridLines = False
wr.column_dimensions["A"].width = 44
for col in "BCDEFGHIJKL":
    wr.column_dimensions[col].width = 15
wr["A1"] = "Estudo de Republicações Dealers — analítico"
wr["A1"].font = FT
wr["A2"] = ("O mesmo carro publicado na Cars2You e na Dealers em 2026. Coleta de %s; publicações com início de "
            "01/01/2026 até a coleta (agendadas fora). Todas as contas desta aba são fórmulas sobre a aba Veículos."
            % datetime.strptime(R["rodada"], "%Y-%m-%d %H:%M").strftime("%d/%m/%Y %H:%M"))
wr["A2"].font = FS
wr.merge_cells("A2:L2")
wr.row_dimensions[2].height = 28
wr["A2"].alignment = ESQ

ORD, CAT, DONO = rng("Ordem"), rng("Categoria"), rng("Comitente")
DIAS, VC, VD, VEM = rng("Intervalo (dias)"), rng("Vendido Cars2You"), rng("Vendido Dealers"), rng("Vendeu em")
PVC, PVD = rng("Venda ÷ FIPE Cars2You"), rng("Venda ÷ FIPE Dealers")
PUC, PUD = rng("Última oferta ÷ FIPE Cars2You"), rng("Última oferta ÷ FIPE Dealers")
TVC, TVD = rng("Tempo de venda Cars2You (dias)"), rng("Tempo de venda Dealers (dias)")
SIM, REP, ERR, DEV = (rng("No ar nas duas ao mesmo tempo"), rng("Republicado com a outra vendida ou em análise"),
                      rng("Erro operacional"), rng("Devolvido"))
MES, PAS, ANT = rng("Mês da republicação"), rng("Passagens"), rng("Status na 1ª base quando foi à 2ª")
IDS = rng("ID")


def titulo(ws, r, txt, nota=None):
    ws.cell(r, 1, txt).font = Font(name="Arial", size=12, bold=True, color=AZUL)
    if nota:
        ws.cell(r + 1, 1, nota).font = FS
        return r + 2
    return r + 1


def cab(ws, r, nomes):
    for k, n in enumerate(nomes, 1):
        c = ws.cell(r, k, n)
        c.font, c.fill, c.alignment = FH, FILL_H, CENTRO
    ws.row_dimensions[r].height = 42


def escreve(ws, r, vals, fmts):
    for k, (v, f) in enumerate(zip(vals, fmts), 1):
        c = ws.cell(r, k)
        if isinstance(v, str) and v.startswith("{"):
            c.value = ArrayFormula("%s%d" % (get_column_letter(k), r), v[1:])
        else:
            c.value = v
        c.font = FB if k == 1 else F
        c.border = LINHA
        if f:
            c.number_format = f
        if k > 1:
            c.alignment = Alignment(horizontal="right")


def med_se(rg, *conds):
    """mediana condicional (formula de matriz): conds = [(intervalo, '="x"'), ...]"""
    cond = "*".join("(%s%s)" % (a, b) for a, b in conds)
    return "{=IFERROR(MEDIAN(IF(%s,%s)),\"\")" % (cond, rg)


def media_se(rg, *conds):
    args = ",".join("%s,%s" % (a, b) for a, b in conds)
    return '=IFERROR(AVERAGEIFS(%s,%s),"")' % (rg, args)


# ---- cartoes
r = titulo(wr, 4, "Cartões", "Os cinco cartões do topo do HTML, sem filtro.")
cab(wr, r, ["Indicador", "Todas", "Cars2You → Dealers", "Dealers → Cars2You", "Mesmo dia"])
r += 1
q = lambda o: '"%s"' % o
linhas = [
    ("Carros nas duas bases", "=COUNTA(%s)" % IDS, ['=COUNTIF(%s,%s)' % (ORD, q(NOME_ORD[o])) for o in ("CD", "DC", "MD")], INT),
    ("Intervalo mediano (dias, sem os de mesmo dia)", med_se(DIAS, (ORD, '<>"Mesmo dia"')),
     [med_se(DIAS, (ORD, '="%s"' % NOME_ORD[o])) for o in ("CD", "DC")] + [None], DEC),
    ("No ar nas duas ao mesmo tempo", '=COUNTIF(%s,"Sim")' % SIM,
     ['=COUNTIFS(%s,"Sim",%s,%s)' % (SIM, ORD, q(NOME_ORD[o])) for o in ("CD", "DC", "MD")], INT),
    ("Vendidos em alguma base", '=COUNTIF(%s,"<>Nenhuma")' % VEM,
     ['=COUNTIFS(%s,"<>Nenhuma",%s,%s)' % (VEM, ORD, q(NOME_ORD[o])) for o in ("CD", "DC", "MD")], INT),
    ("   vendidos na Cars2You", '=COUNTIF(%s,"Sim")' % VC,
     ['=COUNTIFS(%s,"Sim",%s,%s)' % (VC, ORD, q(NOME_ORD[o])) for o in ("CD", "DC", "MD")], INT),
    ("   vendidos na Dealers", '=COUNTIF(%s,"Sim")' % VD,
     ['=COUNTIFS(%s,"Sim",%s,%s)' % (VD, ORD, q(NOME_ORD[o])) for o in ("CD", "DC", "MD")], INT),
    ("   vendidos nas duas", '=COUNTIF(%s,"As duas")' % VEM,
     ['=COUNTIFS(%s,"As duas",%s,%s)' % (VEM, ORD, q(NOME_ORD[o])) for o in ("CD", "DC", "MD")], INT),
    ("Tempo de venda mediano, as duas bases (dias)", '=IFERROR(MEDIAN(%s,%s),"")' % (TVC, TVD),
     ["{=IFERROR(MEDIAN(IF(%s=%s,%s),IF(%s=%s,%s)),\"\")" % (ORD, q(NOME_ORD[o]), TVC, ORD, q(NOME_ORD[o]), TVD)
      for o in ("CD", "DC", "MD")], DEC),
    ("   na Cars2You", '=IFERROR(MEDIAN(%s),"")' % TVC, [med_se(TVC, (ORD, '=%s' % q(NOME_ORD[o]))) for o in ("CD", "DC", "MD")], DEC),
    ("   na Dealers", '=IFERROR(MEDIAN(%s),"")' % TVD, [med_se(TVD, (ORD, '=%s' % q(NOME_ORD[o]))) for o in ("CD", "DC", "MD")], DEC),
    ("Venda ÷ FIPE, média, as duas bases", '=IFERROR(AVERAGE(%s,%s),"")' % (PVC, PVD),
     ["{=IFERROR(AVERAGE(IF(%s=%s,%s),IF(%s=%s,%s)),\"\")" % (ORD, q(NOME_ORD[o]), PVC, ORD, q(NOME_ORD[o]), PVD)
      for o in ("CD", "DC", "MD")], PCT),
    ("   na Cars2You", '=IFERROR(AVERAGE(%s),"")' % PVC, [media_se(PVC, (ORD, q(NOME_ORD[o]))) for o in ("CD", "DC", "MD")], PCT),
    ("   na Dealers", '=IFERROR(AVERAGE(%s),"")' % PVD, [media_se(PVD, (ORD, q(NOME_ORD[o]))) for o in ("CD", "DC", "MD")], PCT),
    ("Devolvidos (3 passagens ou mais)", '=COUNTIF(%s,"Sim")' % DEV,
     ['=COUNTIFS(%s,"Sim",%s,%s)' % (DEV, ORD, q(NOME_ORD[o])) for o in ("CD", "DC", "MD")], INT),
    ("Erro operacional", '=COUNTIF(%s,"Sim")' % ERR,
     ['=COUNTIFS(%s,"Sim",%s,%s)' % (ERR, ORD, q(NOME_ORD[o])) for o in ("CD", "DC", "MD")], INT),
    ("   no ar nas duas ao mesmo tempo", '=COUNTIF(%s,"Sim")' % SIM,
     ['=COUNTIFS(%s,"Sim",%s,%s)' % (SIM, ORD, q(NOME_ORD[o])) for o in ("CD", "DC", "MD")], INT),
    ("   republicado com a outra vendida ou em análise", '=COUNTIF(%s,"Sim")' % REP,
     ['=COUNTIFS(%s,"Sim",%s,%s)' % (REP, ORD, q(NOME_ORD[o])) for o in ("CD", "DC", "MD")], INT),
    ("   os dois", '=COUNTIFS(%s,"Sim",%s,"Sim")' % (SIM, REP),
     ['=COUNTIFS(%s,"Sim",%s,"Sim",%s,%s)' % (SIM, REP, ORD, q(NOME_ORD[o])) for o in ("CD", "DC", "MD")], INT),
]
POS = {}
for rot, tot, por, fmt in linhas:
    escreve(wr, r, [rot, tot] + por, [None] + [fmt] * 4)
    POS[rot] = r
    r += 1


# ---- por ordem e por categoria (mesmas colunas do HTML)
def bloco_grupo(r, tit, nota, rotulo, grupos, rg_grupo):
    r = titulo(wr, r + 1, tit, nota)
    cab(wr, r, [rotulo, "Carros", "Intervalo mediano (dias)", "Vendidos na Cars2You", "Vendidos na Dealers",
                "Venda ÷ FIPE (média), Cars2You", "Venda ÷ FIPE (média), Dealers",
                "Última oferta ÷ FIPE (mediana), Cars2You", "Última oferta ÷ FIPE (mediana), Dealers"])
    r += 1
    for g in grupos:
        k = '"%s"' % g
        escreve(wr, r, [g, "=COUNTIF(%s,%s)" % (rg_grupo, k),
                        med_se(DIAS, (rg_grupo, "=" + k), (ORD, '<>"Mesmo dia"')),
                        '=COUNTIFS(%s,%s,%s,"Sim")' % (rg_grupo, k, VC), '=COUNTIFS(%s,%s,%s,"Sim")' % (rg_grupo, k, VD),
                        media_se(PVC, (rg_grupo, k)), media_se(PVD, (rg_grupo, k)),
                        med_se(PUC, (rg_grupo, "=" + k)), med_se(PUD, (rg_grupo, "=" + k))],
                [None, INT, DEC, INT, INT, PCT, PCT, PCT, PCT])
        r += 1
    return r


r = bloco_grupo(r, "Por ordem de publicação", "Ordem = a base da primeira publicação de 2026.", "Ordem",
                [NOME_ORD[o] for o in ("CD", "DC", "MD")], ORD)
r = bloco_grupo(r, "Por categoria", "Pesados se alguma base diz Pesados; Leves (motos inclusas) se alguma diz Leves.",
                "Categoria", ["Leves", "Pesados"], CAT)

# ---- por mes da republicacao
r = titulo(wr, r + 1, "Carros por mês da chegada à segunda base",
           "Mês da republicação = a 1ª publicação de 2026 na base em que o carro chegou depois (mesmo dia: o dia das duas).")
cab(wr, r, ["Mês", "Cars2You → Dealers", "Dealers → Cars2You", "Mesmo dia", "Total", "Vendidos na 2ª base"])
r += 1
ini_mes = r
mes_max = max(dia(max(c["c"]["ini"], c["d"]["ini"])) for c in CARROS).month
for m in range(1, mes_max + 1):
    dm = date(2026, m, 1)
    wr.cell(r, 1, dm).number_format = "mmm/yyyy"
    wr.cell(r, 1).font, wr.cell(r, 1).border = FB, LINHA
    wr.cell(r, 1).alignment = Alignment(horizontal="left")
    for k, o in enumerate(("CD", "DC", "MD"), 2):
        c = wr.cell(r, k, '=COUNTIFS(%s,$A%d,%s,"%s")' % (MES, r, ORD, NOME_ORD[o]))
        c.font, c.border, c.number_format = F, LINHA, INT
    c = wr.cell(r, 5, "=SUM(B%d:D%d)" % (r, r))
    c.font, c.border, c.number_format = FB, LINHA, INT
    c = wr.cell(r, 6, '=COUNTIFS(%s,$A%d,%s,"%s",%s,"Sim")+COUNTIFS(%s,$A%d,%s,"%s",%s,"Sim")' % (
        MES, r, ORD, NOME_ORD["CD"], VD, MES, r, ORD, NOME_ORD["DC"], VC))
    c.font, c.border, c.number_format = F, LINHA, INT
    r += 1
escreve(wr, r, ["Total"] + ["=SUM(%s%d:%s%d)" % (x, ini_mes, x, r - 1) for x in "BCDEF"], [None] + [INT] * 5)
r += 1

# ---- status na 1a base
r = titulo(wr, r + 1, "Como estava na primeira base quando foi à segunda",
           "Status de hoje da última publicação da 1ª base que começou antes da estreia na 2ª.")
cab(wr, r, ["Status", "Carros", "% dos carros (sem mesmo dia)"])
r += 1
ini_ant = r
cnt_ant = Counter(c["st_antes"] for c in CARROS if c["ordem"] != "MD")
for st, _ in cnt_ant.most_common():
    nome = ST.get(st, "status %s" % st) if st is not None else "Sem publicação anterior"
    escreve(wr, r, [nome, '=COUNTIF(%s,A%d)' % (ANT, r),
                    '=B%d/COUNTIF(%s,"<>Mesmo dia")' % (r, ORD)], [None, INT, PCT])
    r += 1
escreve(wr, r, ["Total", "=SUM(B%d:B%d)" % (ini_ant, r - 1), "=SUM(C%d:C%d)" % (ini_ant, r - 1)], [None, INT, PCT])
r += 1

# ---- passagens
r = titulo(wr, r + 1, "Idas e voltas", "Passagem = publicações seguidas na mesma base. 3 ou mais = devolvido.")
cab(wr, r, ["Passagens", "Carros", "% dos carros", "Erro operacional"])
r += 1
ini_pas = r
for n in sorted(Counter(len(c["pas"]) for c in CARROS)):
    escreve(wr, r, [n, "=COUNTIF(%s,A%d)" % (PAS, r), "=B%d/COUNTA(%s)" % (r, IDS),
                    '=COUNTIFS(%s,A%d,%s,"Sim")' % (PAS, r, ERR)], [INT, INT, PCT, INT])
    wr.cell(r, 1).alignment = Alignment(horizontal="left")
    r += 1
escreve(wr, r, ["Total", "=SUM(B%d:B%d)" % (ini_pas, r - 1), "=SUM(C%d:C%d)" % (ini_pas, r - 1),
                "=SUM(D%d:D%d)" % (ini_pas, r - 1)], [None, INT, PCT, INT])
wr.freeze_panes = "A4"

# =====================================================================================================
# POR COMITENTE
# =====================================================================================================
wc = wb.create_sheet("Por comitente", 1)
wc.sheet_view.showGridLines = False
COLS_C = ["Comitente", "Carros", "Cars2You → Dealers", "Dealers → Cars2You", "Mesmo dia", "Intervalo mediano (dias)",
          "Vendidos na Cars2You", "Vendidos na Dealers", "Venda ÷ FIPE (média), Cars2You",
          "Venda ÷ FIPE (média), Dealers", "Última oferta ÷ FIPE (mediana), Cars2You",
          "Última oferta ÷ FIPE (mediana), Dealers", "Devolvidos", "Erro operacional"]
cab(wc, 1, COLS_C)
wc.column_dimensions["A"].width = 26
for k in range(2, len(COLS_C) + 1):
    wc.column_dimensions[get_column_letter(k)].width = 14
donos = [d for d, _ in sorted(Counter(c["dono"] for c in CARROS).items(), key=lambda t: (-t[1], t[0]))]
for r, d in enumerate(donos, 2):
    k = "$A%d" % r
    escreve(wc, r, [d, "=COUNTIF(%s,%s)" % (DONO, k)] +
            ['=COUNTIFS(%s,%s,%s,"%s")' % (DONO, k, ORD, NOME_ORD[o]) for o in ("CD", "DC", "MD")] +
            [med_se(DIAS, (DONO, "=" + k), (ORD, '<>"Mesmo dia"')),
             '=COUNTIFS(%s,%s,%s,"Sim")' % (DONO, k, VC), '=COUNTIFS(%s,%s,%s,"Sim")' % (DONO, k, VD),
             media_se(PVC, (DONO, k)), media_se(PVD, (DONO, k)),
             med_se(PUC, (DONO, "=" + k)), med_se(PUD, (DONO, "=" + k)),
             '=COUNTIFS(%s,%s,%s,"Sim")' % (DONO, k, DEV), '=COUNTIFS(%s,%s,%s,"Sim")' % (DONO, k, ERR)],
            [None, INT, INT, INT, INT, DEC, INT, INT, PCT, PCT, PCT, PCT, INT, INT])
    wc.cell(r, 1).alignment = ESQ
rt = len(donos) + 2
escreve(wc, rt, ["Total"] + ["=SUM(%s2:%s%d)" % (x, x, rt - 1) for x in "BCDE"] +
        [med_se(DIAS, (ORD, '<>"Mesmo dia"'))] + ["=SUM(%s2:%s%d)" % (x, x, rt - 1) for x in "GH"] +
        ['=IFERROR(AVERAGE(%s),"")' % PVC, '=IFERROR(AVERAGE(%s),"")' % PVD,
         '=IFERROR(MEDIAN(%s),"")' % PUC, '=IFERROR(MEDIAN(%s),"")' % PUD] +
        ["=SUM(%s2:%s%d)" % (x, x, rt - 1) for x in "MN"],
        [None, INT, INT, INT, INT, DEC, INT, INT, PCT, PCT, PCT, PCT, INT, INT])
for k in range(1, len(COLS_C) + 1):
    wc.cell(rt, k).font = FB
    wc.cell(rt, k).fill = FILL_K
wc.auto_filter.ref = "A1:%s%d" % (get_column_letter(len(COLS_C)), rt - 1)
wc.freeze_panes = "B2"

# =====================================================================================================
# METODO E GLOSSARIO (o texto do HTML, de monta-estudo.js)
# =====================================================================================================
wm = wb.create_sheet("Método")
wm.sheet_view.showGridLines = False
wm.column_dimensions["A"].width = 26
wm.column_dimensions["B"].width = 120
txt = subprocess.run(["node", "-e", r"""
const fs=require('fs'),src=fs.readFileSync(process.argv[1],'utf8');
const ini=src.indexOf('metodo: ['), fim=src.indexOf('\n};', ini);
const RS=JSON.parse(fs.readFileSync(process.argv[2],'utf8')).resumo;
const nf=n=>Number(n).toLocaleString('pt-BR');
const o=eval('({'+src.slice(ini,fim)+'})');
process.stdout.write(JSON.stringify(o));
""", str(AQUI / "monta-estudo.js"), str(AQUI / "resultados.json")], capture_output=True, text=True, encoding="utf-8")
if txt.returncode:
    print(txt.stderr)
    sys.exit(1)
MG = json.loads(txt.stdout)
r = titulo(wm, 1, "Como foi medido")
for sec, itens in MG["metodo"]:
    wm.cell(r, 1, sec).font = FB
    wm.cell(r, 1).alignment = ESQ
    for it in itens:
        c = wm.cell(r, 2, it)
        c.font, c.alignment = F, ESQ
        r += 1
    r += 1
r = titulo(wm, r, "Glossário")
for termo, defi in MG["glossario"] + [
        ["Abas desta planilha", "Resumo e Por comitente são fórmulas sobre a aba Veículos (uma linha por carro): "
                               "corrigir ou apagar uma linha lá recalcula. Passagens e Publicações abrem cada carro."],
        ["FIPE de referência", "A FIPE da própria base; sem ela, a da outra (como no HTML)."],
        ["Tempo de venda (dias)", "Data da venda − 1ª publicação de 2026 no mesmo banco. Vazio se não vendeu."]]:
    wm.cell(r, 1, termo).font = FB
    wm.cell(r, 1).alignment = ESQ
    c = wm.cell(r, 2, defi)
    c.font, c.alignment = F, ESQ
    r += 1

for ws in wb.worksheets:
    ws.sheet_properties.tabColor = AZUL if ws.title in ("Resumo", "Por comitente") else AZUL_CL
wb.save(SAIDA)
print("✓ %s · %d carros · %d passagens · %d publicações" % (SAIDA.name, N, ra - 2, rp - 2))
