"""Lê a aba geral dos relatórios de fechamento de 2026 e confere contra os totais.

Uso:  python consolida.py <pasta-dos-relatorios>     (só imprime a conferência)
A planilha é montada por monta_projecao.py, que importa este módulo.

Cada arquivo mensal tem uma aba geral ("Relatório" em jan/fev, "Geral" depois)
com quatro blocos (Repasse, Venda Direta, Trucks2you, B2AUTO). A posição das
colunas muda de mês para mês, então elas são casadas pelo nome do cabeçalho.
As colunas de caixa (depois da Receita Bruta) são casadas pela ORDEM dos três
grupos, porque o rótulo às vezes traz o mês errado (maio diz "Março").
Linhas de total ficam de fora da base e servem para conferir a soma.
"""
import glob
import os
import re
import sys

import openpyxl
from openpyxl.utils import get_column_letter

MESES = {"janeiro": 1, "fevereiro": 2, "março": 3, "abril": 4, "maio": 5, "junho": 6,
         "julho": 7, "agosto": 8, "setembro": 9, "outubro": 10, "novembro": 11, "dezembro": 12}

# nome canônico <- variações vistas nos cabeçalhos
CANON = {
    "em preparação": "Em Preparação", "em preparação / teste": "Em Preparação",
    "em aberto": "Em aberto",
    "qtde publicadas": "Qtde Publicadas", "anuncio ativo": "Anúncio Ativo",
    "qtde com ofertas": "Qtde Com Ofertas", "qtde de vendas": "Qtde de Vendas",
    "vendas confirmadas": "Vendas Confirmadas", "em analise": "Em Análise",
    "ativo s/ oferta": "Ativo s/ Oferta",
    "retirados": "Retirados s/ Oferta", "retirados s/ ofertas": "Retirados s/ Oferta",
    "retirado c/ oferta": "Retirado c/ Oferta",
    "encerrado c / ofertas": "Encerrado c/ Oferta", "encerrado s / ofertas": "Encerrado s/ Oferta",
    "qtde recusada": "Qtde Recusada / Cancelada", "qtde recusada / cancelada": "Qtde Recusada / Cancelada",
    "qtde recusada / cliente declinou": "Qtde Recusada / Cancelada",
    "êxito de venda": "Êxito de Venda", "valor de mercado": "Valor de Mercado",
    "expectativa de venda cliente": "Expectativa de Venda Cliente (VMV)",
    "valor de venda": "Valor de Venda", "% rec. vmv": "% Rec. VMV",
    "% rec. mercado": "% Rec. Mercado", "receita bruta": "Receita Bruta",
}
METRICAS = ["Em Preparação", "Em aberto", "Qtde Publicadas", "Anúncio Ativo", "Qtde Com Ofertas",
            "Qtde de Vendas", "Vendas Confirmadas", "Em Análise", "Ativo s/ Oferta",
            "Retirados s/ Oferta", "Retirado c/ Oferta", "Encerrado c/ Oferta",
            "Encerrado s/ Oferta", "Qtde Recusada / Cancelada", "Valor de Mercado",
            "Expectativa de Venda Cliente (VMV)", "Valor de Venda", "Receita Bruta"]
# os três grupos de caixa, na ordem em que aparecem; cada um tem Quantidade e Valores
GRUPOS_CAIXA = ["Anteriores contabilizadas no mês", "Do mês contabilizadas no mês", "Do mês não contabilizadas"]
CAIXA = [f"Caixa: {g} ({u})" for g in GRUPOS_CAIXA for u in ("qtd", "R$")]
# razões viram fórmula; a origem só é usada para conferir
RAZOES = {"Êxito de Venda": ("Vendas Confirmadas", "Qtde Publicadas"),
          "% Rec. VMV": ("Valor de Venda", "Expectativa de Venda Cliente (VMV)"),
          "% Rec. Mercado": ("Valor de Venda", "Valor de Mercado")}
MOEDA = {"Valor de Mercado", "Expectativa de Venda Cliente (VMV)", "Valor de Venda", "Receita Bruta"} | {c for c in CAIXA if c.endswith("(R$)")}
SOMA_CONFERIDA = ["Qtde Publicadas", "Vendas Confirmadas", "Valor de Venda", "Receita Bruta"] + CAIXA


def bloco_do_titulo(t):
    t = t.lower()
    if "venda direta" in t:
        return "Venda Direta - Projetos Especiais"
    if "trucks2you" in t:
        return "Trucks2you"
    if "b2auto" in t:
        return "B2AUTO"
    if "repasse" in t:
        return "Repasse"
    raise ValueError(f"bloco desconhecido: {t}")


def norm(s):
    return re.sub(r"\s+", " ", str(s)).strip() if s is not None else None


def num(v):
    return v if isinstance(v, (int, float)) and not isinstance(v, bool) else None


def mes_do_arquivo(nome):
    m = re.search(r"\d+ de (\w+)", nome.lower())
    return MESES[m.group(1)]


def le_arquivo(caminho):
    mes = mes_do_arquivo(os.path.basename(caminho))
    wb = openpyxl.load_workbook(caminho, data_only=True)
    ws = wb.worksheets[0]
    ncol = ws.max_column
    linhas, totais, avisos = [], [], []
    bloco, mapa, col_com, col_org, grupos = None, None, None, None, []
    for r in range(1, ws.max_row + 1):
        val = [ws.cell(r, c).value for c in range(1, ncol + 1)]
        C = norm(val[2])
        if not C:
            continue
        if C.lower().startswith("relatório operacional"):
            bloco, mapa = bloco_do_titulo(C), None
            # rótulos dos grupos de caixa ficam na linha do título, depois da coluna Z
            grupos = [c for c in range(27, ncol + 1) if norm(val[c - 1])]
            if len(grupos) != 3:
                raise ValueError(f"{caminho} L{r}: esperava 3 grupos de caixa, achei {len(grupos)}")
            continue
        if C == "Produto":
            mapa = {}
            for c in range(4, ncol + 1):
                h = norm(val[c - 1])
                if not h:
                    continue
                if c >= grupos[0]:
                    g = sum(1 for s in grupos if s <= c) - 1
                    u = {"quantidade": "qtd", "valores": "R$"}.get(h.lower())
                    if u is None:
                        raise ValueError(f"{caminho} L{r}: cabeçalho de caixa desconhecido {h!r}")
                    mapa[c] = f"Caixa: {GRUPOS_CAIXA[g]} ({u})"
                elif h.lower() == "comitente vendedor":
                    col_com = c
                elif h.lower() == "origem":
                    col_org = c
                elif h.lower() in CANON:
                    mapa[c] = CANON[h.lower()]
                else:
                    raise ValueError(f"{caminho} L{r}: cabeçalho desconhecido {h!r}")
            # origem sem rótulo: coluna entre Produto e Comitente
            col_org = col_org if col_org else (4 if col_com == 5 else None)
            continue
        if mapa is None:
            continue
        valores = {nome: val[c - 1] for c, nome in mapa.items()}
        # coluna sem cabeçalho com número não pode sumir calada
        for c in range(6, ncol + 1):
            if c not in mapa and c not in (col_com, col_org) and num(val[c - 1]) not in (None, 0):
                avisos.append(f"mês {mes} L{r} col {get_column_letter(c)} sem cabeçalho: {val[c - 1]}")
        if C.lower().startswith("total") or C.lower() == "resultado geral":
            totais.append({"mes": mes, "bloco": bloco if C.lower() != "resultado geral" else "GERAL",
                           "rotulo": C, "linha": r, **{k: num(v) for k, v in valores.items()}})
            continue
        com = norm(val[col_com - 1])
        if not com:
            continue
        linhas.append({"mes": mes, "bloco": bloco, "produto": C,
                       "origem": norm(val[col_org - 1]) if col_org else None,
                       "comitente_orig": com, "comitente": com.replace("Delares", "Dealers"),
                       "arquivo": os.path.basename(caminho), "aba": ws.title, "linha": r,
                       **{k: num(v) for k, v in valores.items()}})
    return linhas, totais, avisos


def le_todos(pasta):
    linhas, totais, avisos = [], [], []
    for f in sorted(glob.glob(os.path.join(pasta, "*.xlsx")), key=lambda p: mes_do_arquivo(os.path.basename(p))):
        l, t, a = le_arquivo(f)
        linhas += l
        totais += t
        avisos += a
        print(f"mês {l[0]['mes']:02d}: {len(l)} linhas  ({os.path.basename(f)})")
    return linhas, totais, avisos


def confere(linhas, totais):
    """Soma das linhas de cada bloco contra o total do bloco na origem."""
    difs = []
    for t in totais:
        if t["rotulo"] == "Total Repasse menos Itaú":
            continue
        base = [l for l in linhas if l["mes"] == t["mes"] and (t["bloco"] == "GERAL" or l["bloco"] == t["bloco"])]
        for col in SOMA_CONFERIDA:
            s = sum(l.get(col) or 0 for l in base)
            o = t.get(col) or 0
            if abs(s - o) > 0.01:
                difs.append(f"mês {t['mes']:02d} {t['bloco']} ({t['rotulo']}, L{t['linha']}) {col}: base {s:,.2f} x origem {o:,.2f}")
    for l in linhas:
        for nome, (a, b) in RAZOES.items():
            orig = l.get(nome)
            den = l.get(b) or 0
            calc = (l.get(a) or 0) / den if den else None
            if orig is not None and calc is not None and abs(orig - calc) > 1e-6:
                difs.append(f"mês {l['mes']:02d} {l['comitente']} L{l['linha']} {nome}: fórmula {calc:.4f} x origem {orig:.4f}")
    return difs


def confere_competencia(linhas):
    """Receita Bruta (competência) = vendas do mês contabilizadas + não contabilizadas (Tuunelis, reunião)."""
    difs = []
    for l in linhas:
        caixa = (l.get(CAIXA[3]) or 0) + (l.get(CAIXA[5]) or 0)
        if abs((l.get("Receita Bruta") or 0) - caixa) > 0.01:
            difs.append(f"mês {l['mes']:02d} {l['bloco']} | {l['comitente']} L{l['linha']}: receita {l.get('Receita Bruta') or 0:,.2f} x caixa do mês {caixa:,.2f}")
    return difs


if __name__ == "__main__":
    linhas, totais, avisos = le_todos(sys.argv[1])
    for a in avisos:
        print("AVISO", a)
    difs = confere(linhas, totais)
    print(f"\nconferência: {len(difs)} diferença(s)")
    for d in difs:
        print("  ", d)
    comp = confere_competencia(linhas)
    print(f"\ncompetência x caixa: {len(comp)} linha(s) que não fecham")
    for d in comp:
        print("  ", d)
