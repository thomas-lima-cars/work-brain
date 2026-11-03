"""Confere a planilha de projeção depois de recalculada no Excel.

Uso:
  python confere_planilha.py <projecao.xlsx>                      erros, Conferência, 2026 = Base, premissas zeradas, Resumo
  python confere_planilha.py <projecao.xlsx> --enderecos <saida>  células do teste de sensibilidade (para o Excel)
  python confere_planilha.py <projecao.xlsx> <copia.xlsx>         efeito do teste de sensibilidade

O teste: +10% de incremento no ano de todos os comitentes, +5 p.p. de êxito no ano do 1º,
−50% de incremento em mar/27 no 2º, volume bruto de 5/mês no 3º e de 10/mês no 1º comitente
sem publicação em jan/26 (testa o volume criando publicação onde 2026 não tem).
"""
import sys
from collections import defaultdict

import openpyxl
from openpyxl.utils import get_column_letter as L

ABA = "Projeção 2027"
# linhas a partir do título do bloco (t): jan/26 t+2, Total 2026 t+14, premissa t+15, jan/27 t+16, Total 2027 t+28
M26, T26, ANO, M27, T27 = 2, 14, 15, 16, 28
RS_T26, RS_T27 = 14, 27            # no Resumo não há linha de premissa


def v(x):
    return x if isinstance(x, (int, float)) else 0


MES, TIT = 2, 3                    # colunas do Mês e do título (a coluna A é margem)


def blocos(ws):
    """[(t, bloco, comitente)] de cada bloco de comitente da aba de projeção."""
    return [(r - ANO, ws.cell(r - ANO, 31).value, ws.cell(r - ANO, 32).value)
            for r in range(1, ws.max_row + 1) if ws.cell(r, MES).value == "Premissa do ano"]


def colunas(ws, t):
    return {ws.cell(t + 1, c).value: c for c in range(1, 30) if ws.cell(t + 1, c).value}


def base_agregada(wb):
    b = wb["Base"]
    cab = {b.cell(1, c).value: c for c in range(1, b.max_column + 1)}
    agg = defaultdict(float)
    for r in range(2, b.max_row + 1):
        chave = (b.cell(r, cab["Bloco"]).value, b.cell(r, cab["Comitente padronizado"]).value, b.cell(r, cab["Mês"]).value.month)
        for nome, c in cab.items():
            if isinstance(b.cell(r, c).value, (int, float)):
                agg[chave + (nome,)] += b.cell(r, c).value
    return agg, cab


def base(path):
    wb = openpyxl.load_workbook(path, data_only=True)
    fo = openpyxl.load_workbook(path)
    erros = formulas = 0
    for ws in fo.worksheets:
        for row in ws.iter_rows():
            for c in row:
                if isinstance(c.value, str) and c.value.startswith("="):
                    formulas += 1
                    val = wb[ws.title][c.coordinate].value
                    if isinstance(val, str) and val.startswith("#"):
                        erros += 1
                        if erros <= 10:
                            print("ERRO", ws.title, c.coordinate, val)
    print(f"fórmulas: {formulas}, erros: {erros}")

    cs = wb["Conferência"]
    pior = max(abs(v(cs.cell(r, 5).value)) for r in range(2, cs.max_row + 1))
    print(f"conferência: maior diferença Base x RESULTADO GERAL = {pior}")

    agg, cab = base_agregada(wb)
    pj = wb[ABA]
    contaveis = lambda cols: {n: c for n, c in cols.items() if n in cab and not n.startswith(("Êxito", "%"))}

    # linhas de 2026 = Base, em todas as colunas
    difs26, conf26 = [], 0
    for t, bloco, com in blocos(pj):
        for nome, c in contaveis(colunas(pj, t)).items():
            for m in range(1, 13):
                conf26 += 1
                if abs(agg.get((bloco, com, m, nome), 0) - v(pj.cell(t + M26 + m - 1, c).value)) > 1e-6:
                    difs26.append(f"{com} {m:02d} {nome}")
    print(f"linhas 2026: {conf26} células conferidas contra a Base, {len(difs26)} diferentes {difs26[:3]}")

    # premissas zeradas: cada coluna de 2027 = linha do mesmo mês de 2026
    difs, conferidas = defaultdict(list), 0
    for t, _, com in blocos(pj):
        for nome, c in contaveis(colunas(pj, t)).items():
            for m in range(1, 13):
                a, b = v(pj.cell(t + M26 + m - 1, c).value), v(pj.cell(t + M27 + m - 1, c).value)
                conferidas += 1
                if abs(a - b) > 1e-6:
                    difs[nome].append(f"{com} {m:02d}: 2026 {a:,.2f} x 2027 {b:,.2f}")
    print(f"premissas zeradas: {conferidas} células conferidas, {sum(map(len, difs.values()))} diferentes")
    for nome, lst in difs.items():
        print(f"   {nome}: {len(lst)} — ex.: {lst[0]}")

    # Resumo: total geral = soma dos comitentes; Total 2026 = Base
    rs = wb["Resumo 2027"]
    t_tot = next(r for r in range(1, rs.max_row + 1) if rs.cell(r, TIT).value == "TOTAL GERAL")
    rc = colunas(rs, t_tot)
    for nome in ("Qtde Publicadas", "Vendas Confirmadas", "Receita Bruta"):
        soma27 = sum(v(pj.cell(t + T27, colunas(pj, t)[nome]).value) for t, _, _ in blocos(pj))
        base_tot = sum(x for k, x in agg.items() if k[3] == nome)
        print(f"resumo {nome}: 2027 {v(rs.cell(t_tot + RS_T27, rc[nome]).value):,.0f} (comitentes {soma27:,.0f}) · "
              f"2026 {v(rs.cell(t_tot + RS_T26, rc[nome]).value):,.0f} (Base {base_tot:,.0f})")

    # topo da Projeção: comparação por comitente (2026/2027/var. por comitente, chave bloco +
    # comitente nas colunas ocultas) = totais de cada bloco; total geral = aba Resumo
    hc = next(r for r in range(1, 20) if pj.cell(r, TIT).value == "Comparação anual por comitente") + 1
    cg = colunas(pj, hc - 1)
    tg = next(r for r in range(hc, hc + 300) if pj.cell(r, TIT).value == "TOTAL GERAL")
    rot = {(pj.cell(r, 31).value, pj.cell(r, 32).value): r for r in range(hc + 1, tg, 3) if pj.cell(r, 32).value}
    difs_top = []
    for nome in ("Qtde Publicadas", "Vendas Confirmadas", "Receita Bruta"):
        for d, tt in enumerate((RS_T26, RS_T27)):
            resumo = v(rs.cell(t_tot + tt, rc[nome]).value)
            if abs(v(pj.cell(tg + d, cg[nome]).value) - resumo) > 1e-6:
                difs_top.append(f"comparação total {nome} {2026 + d}")
    for t, bloco, com in blocos(pj):
        r = rot[(bloco, com)]
        for nome in ("Qtde Publicadas", "Vendas Confirmadas", "Receita Bruta"):
            for d, tt in enumerate((T26, T27)):
                if abs(v(pj.cell(r + d, cg[nome]).value) - v(pj.cell(t + tt, colunas(pj, t)[nome]).value)) > 1e-6:
                    difs_top.append(f"{com} {nome} {2026 + d}")
    grupos = sorted({pj.row_dimensions[r].outline_level for r in range(hc + 1, tg)})
    print(f"resumos do topo: {len(rot)} comitentes na comparação, {len(difs_top)} diferença(s) {difs_top[:5]}; "
          f"níveis de agrupamento {grupos}")


PCT, QTD, DEX = "% Incremento publicados", "# Incremento publicados", "Var. êxito (p.p.)"


def plano_teste(ws):
    """Premissas do teste por bloco: {t: (g_ano, qtd_ano, dx_ano)} e o mês sobrescrito.
    Volume bruto: 5/mês no 3º comitente e 10/mês no 1º que não publicou em jan/26 mas publicou no ano."""
    bl = blocos(ws)
    cp = lambda t: colunas(ws, t)["Qtde Publicadas"]
    vazio = next(t for t, _, _ in bl if not v(ws.cell(t + M26, cp(t)).value) and v(ws.cell(t + T26, cp(t)).value))
    plano = {t: (0.10, 5 if i == 2 else 10 if t == vazio else 0, 0.05 if i == 0 else 0) for i, (t, _, _) in enumerate(bl)}
    return plano, (bl[1][0], 3, -0.5)   # 2º comitente, mar/27, −50%


def enderecos(path, saida):
    ws = openpyxl.load_workbook(path, data_only=True)[ABA]
    plano, (tm, mm, gm) = plano_teste(ws)
    linhas = []
    for t, (g, q, dx) in plano.items():
        cols = colunas(ws, t)
        for nome, val in ((PCT, g), (QTD, q), (DEX, dx)):
            if val:
                linhas.append(f"{L(cols[nome])}{t + ANO}={val}")
    linhas.append(f"{L(colunas(ws, tm)[PCT])}{tm + M27 + mm - 1}={gm}")
    with open(saida, "w", newline="\n") as f:
        f.write("\n".join(linhas) + "\n")
    print(f"{len(linhas)} células em {saida}")


def sensibilidade(path0, path1):
    w0, w1 = openpyxl.load_workbook(path0, data_only=True)[ABA], openpyxl.load_workbook(path1, data_only=True)[ABA]
    plano, (tm, mm, gm) = plano_teste(w0)
    falhas = conferidas = 0
    for i, (t, _, com) in enumerate(blocos(w0)):
        cols = colunas(w0, t)
        cp, cv, ca = cols["Qtde Publicadas"], cols["Vendas Confirmadas"], cols["Anúncio Ativo"]
        g_ano, q, dx = plano[t]
        pt, vt, at = (v(w0.cell(t + T26, c).value) for c in (cp, cv, ca))
        exito_ano = vt / pt if pt else 0
        for m in range(1, 13):
            r, rr = t + M27 + m - 1, t + M26 + m - 1
            g = gm if (t == tm and m == mm) else g_ano
            e, f, a26 = (v(w0.cell(rr, c).value) for c in (cp, cv, ca))
            pub = e * (1 + g) + q
            ven = f * (1 + g) + q * max(0, exito_ano + dx) if e == 0 else max(0, pub * (f / e + dx))
            anun = pub * (a26 / e if e else at / pt if pt else 0)
            for esp, got, rot in ((pub, w1.cell(r, cp).value, "pub"), (ven, w1.cell(r, cv).value, "ven"),
                                  (anun, w1.cell(r, ca).value, "anúncio")):
                conferidas += 1
                if abs(esp - v(got)) > 1e-6:
                    falhas += 1
                    print("FALHA", rot, com, m, esp, got)
    print(f"sensibilidade: {falhas} falha(s) em {conferidas} células conferidas")


if __name__ == "__main__":
    if len(sys.argv) > 3 and sys.argv[2] == "--enderecos":
        enderecos(sys.argv[1], sys.argv[3])
    elif len(sys.argv) > 2:
        sensibilidade(sys.argv[1], sys.argv[2])
    else:
        base(sys.argv[1])
