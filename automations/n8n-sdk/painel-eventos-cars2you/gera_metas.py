# -*- coding: utf-8 -*-
"""Gera a planilha de metas do Painel de Eventos Cars2You.

    python gera_metas.py                 -> metas-painel-eventos.xlsx
    python gera_metas.py --ate 2026-11   -> outros 12 meses (o --ate fica fora)

Pedido do Thomas (06/11): meta diaria e mensal do % de veiculos com oferta e
do % vendidos, por comitente e categoria. A planilha nasce com a MEDIA dos 12
meses fechados e uma coluna Meta preenchida com ela; quem quiser muda a Meta,
sobe no SharePoint, e o painel le a coluna Meta.

As duas medias sao as do painel, refeitas aqui das linhas cruas (conexao
direta, VPN):

  Mensal  o % do mes da aba Mensal: de cada veiculo ativo no mes, a negociacao
          mais recente (fim do evento, depois id); com oferta = teve lance ou
          vendeu; vendido = status 2, 3 ou 7. Media simples dos meses em que o
          grupo teve veiculo.
  Diaria  o % do dia do Diario (o acumulado no evento): de cada veiculo ativo
          no dia, a negociacao do evento mais recente ativo nele; com oferta =
          lance ou venda ate o fim do dia; vendido = venda ate o fim do dia.
          Media simples dos dias em que o grupo teve veiculo.

A revisao (Thomas, 06/11, "Sim, revise"):
  - comitente de TESTE (nome com "teste") fica fora da planilha e das medias
    de categoria: os veiculos dele saem sem meta;
  - grupo com BASE PEQUENA leva na Meta a media do COMITENTE (todas as
    categorias dele somadas, mes a mes ou dia a dia), se a base dele for
    suficiente; senao, a da CATEGORIA (todos os comitentes que nao sao de
    teste). Comitente antes de categoria: em "Nao informada" a media da
    categoria e quase so a LM (14% com oferta no mes) e o Itau, com 57% nela,
    levaria 14%. A media do proprio grupo continua nas colunas de media, e a
    coluna "Origem da meta" diz de onde veio. Base pequena: no mensal, menos de
    MIN_MESES meses com veiculo ou menos de MIN_VEIC_MES veiculos somados; no
    diario, menos de MIN_DIAS dias ou menos de MIN_VEIC_DIA veiculos-dia. Com
    1 mes e 1 veiculo a media e 0% ou 100% -- nao e meta, e sorteio.

O grupo e (comitente da negociacao escolhida, categoria do veiculo). Evento:
os seis canais, com no maximo 31 dias de ofertas nos dois (deposito de
anuncio, como o "Anuncios cancelados", nao e evento — o mesmo corte do
Mensal; no Diario de hoje nao ha nenhum).

A categoria (medida em 06/11, categories + category_groups): Pesados = grupo
2 e o "Caminhao" 23 do grupo 1; Leves = o grupo 10, motos inclusive (Thomas,
06/11: "agrupe motos em leves"); Equipamentos = grupo 8; o resto, Nao
informada. O mesmo CASE esta no montar-consultas.js (CATEGORIA).

Comitente INATIVO fica fora da planilha (Thomas, 06/11): sem veiculo em
evento nos ultimos 3 meses fechados. Ele continua nas medias de categoria,
que sao do comportamento da categoria nos 12 meses.
"""
import argparse
import datetime as dt
import sys
from collections import defaultdict
from pathlib import Path

AQUI = Path(__file__).resolve().parent
sys.path.insert(0, str(AQUI.parents[1] / "bancos"))
from conexao import conectar  # noqa: E402

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

WL = "4,7,43,48,62,65"
VENDA = (2, 3, 7)
CATEGORIA_SQL = ("CASE WHEN c.category_group_id = 2 OR v.category_id = 23 THEN 'P'"
                 " WHEN c.category_group_id = 10 THEN 'L' WHEN c.category_group_id = 8 THEN 'E' ELSE 'N' END")
CATEGORIAS = {"L": "Leves", "P": "Pesados", "E": "Equipamentos", "N": "Não informada"}
MESES_ATIVO = 3
MIN_MESES, MIN_VEIC_MES = 3, 30
MIN_DIAS, MIN_VEIC_DIA = 30, 100
ORDEM_CAT = "LPEN"

ap = argparse.ArgumentParser()
ap.add_argument("--ate", help="primeiro mes FORA da media (AAAA-MM); padrao: o mes corrente")
ap.add_argument("--saida", default=str(AQUI / "metas-painel-eventos.xlsx"))
ap.add_argument("--confere", action="store_true", help="imprime o total de cada mes e de alguns dias, para bater com o painel")
args = ap.parse_args()

agora = dt.datetime.now(dt.timezone.utc) - dt.timedelta(minutes=180)
fim_mes = dt.date(int(args.ate[:4]), int(args.ate[5:7]), 1) if args.ate else agora.date().replace(day=1)
meses = []
m = fim_mes
for _ in range(12):
    m = (m - dt.timedelta(days=1)).replace(day=1)
    meses.insert(0, m)
INI, FIM = meses[0], fim_mes
print("media de %s a %s (12 meses fechados)" % (INI.strftime("%m/%Y"), (FIM - dt.timedelta(days=1)).strftime("%m/%Y")))

cx = conectar("cars2you")


def um(sql):
    c = cx.cursor()
    c.execute(sql)
    r = c.fetchall()
    c.close()
    return r


EV = ("SELECT e.id, DATE(e.start_date_offer), DATE(e.finish_date_event), e.finish_date_event FROM events e"
      " WHERE e.deleted_at IS NULL AND e.start_date_offer < '%s' AND e.finish_date_event >= '%s'"
      " AND DATEDIFF(e.finish_date_event, e.start_date_offer) <= 31"
      " AND EXISTS (SELECT 1 FROM event_whitelabels ew WHERE ew.event_id = e.id AND ew.whitelabel_id IN (%s))") % (FIM, INI, WL)
eventos = {r[0]: r[1:] for r in um(EV)}
lista = ",".join(map(str, eventos))
print("%d eventos" % len(eventos))

# uma linha por negociacao: veiculo, comitente, categoria, status, o dia do
# primeiro lance de loja e o dia da venda (a oferta vencedora)
negs = um("SELECT an.id, an.event_id, a.vehicle_id, a.shop_id, " + CATEGORIA_SQL + ", an.status,"
          " (SELECT DATE(MIN(o.created_at)) FROM offers o WHERE o.advs_negotiation_id = an.id"
          " AND o.deleted_at IS NULL AND o.buyer_shop_id IS NOT NULL),"
          " IF(an.status IN (2,3,7), (SELECT DATE(o.created_at) FROM offers o WHERE o.id = an.offer_actual_id), NULL)"
          " FROM advertisement_negotiations an INNER JOIN advertisements a ON a.id = an.advertisement_id"
          " INNER JOIN vehicles v ON v.id = a.vehicle_id LEFT JOIN categories c ON c.id = v.category_id"
          " WHERE an.deleted_at IS NULL AND an.event_id IN (%s)" % lista)
nomes = dict(um("SELECT s.id, s.name FROM shops s WHERE s.id IN (%s)" % ",".join(str(x) for x in {n[3] for n in negs})))
cx.close()
print("%d negociacoes de %d veiculos" % (len(negs), len({n[2] for n in negs})))
teste = {c for c, nome in nomes.items() if "teste" in str(nome or "").lower()}
print("comitentes de teste, fora: %s" % ", ".join(sorted(str(nomes[c]).strip() for c in teste)))

# por evento, as negociacoes; a chave de "mais recente" e (fim do evento, id)
por_ev = defaultdict(list)
for n in negs:
    por_ev[n[1]].append(n)


def ultimas(evs):
    u = {}
    for e in evs:
        fim = eventos[e][2]
        for n in por_ev[e]:
            k = (fim, n[0])
            if n[2] not in u or k > u[n[2]][0]:
                u[n[2]] = (k, n)
    return [x[1] for x in u.values()]


def acumula(soma, grupo, veic, of, ve):
    s = soma[grupo]
    s["n"] += 1
    s["veic"] += veic
    s["of"] += of / veic
    s["ve"] += ve / veic


def conta(lista, ok_of, ok_ve):
    g = defaultdict(lambda: [0, 0, 0])
    for n in lista:
        x = g[(n[3], n[4])]
        x[0] += 1
        x[1] += ok_of(n)
        x[2] += ok_ve(n)
    return g


def referencias(g, soma_cat, soma_com):
    # as referencias do grupo pequeno: o comitente (todas as categorias dele)
    # e a categoria (todos os comitentes, sem os de teste), somados no periodo
    cat = defaultdict(lambda: [0, 0, 0])
    com = defaultdict(lambda: [0, 0, 0])
    for (comit, c), x in g.items():
        for i in range(3):
            com[comit][i] += x[i]
            if comit not in teste:
                cat[c][i] += x[i]
    for c, (v, o, s) in cat.items():
        acumula(soma_cat, c, v, o, s)
    for c, (v, o, s) in com.items():
        acumula(soma_com, c, v, o, s)


# ── mensal: o status da negociacao mais recente do mes ─────────────────
mensal = defaultdict(lambda: {"n": 0, "veic": 0, "of": 0.0, "ve": 0.0})
mensal_cat = defaultdict(lambda: {"n": 0, "veic": 0, "of": 0.0, "ve": 0.0})
mensal_com = defaultdict(lambda: {"n": 0, "veic": 0, "of": 0.0, "ve": 0.0})
ativos = set()
for k, ini in enumerate(meses):
    fim = meses[k + 1] if k + 1 < 12 else FIM
    evs = [e for e, (d0, d1, f) in eventos.items() if d0 < fim and d1 >= ini]
    g = conta(ultimas(evs), lambda n: n[5] in VENDA or n[6] is not None, lambda n: n[5] in VENDA)
    for grupo, (v, o, s) in g.items():
        acumula(mensal, grupo, v, o, s)
    referencias(g, mensal_cat, mensal_com)
    if k >= 12 - MESES_ATIVO:
        ativos.update(comit for comit, c in g)
    if args.confere:
        t = [sum(x[i] for x in g.values()) for i in range(3)]
        print("  mes %s: %d veiculos, %d com oferta, %d vendidos" % (ini.strftime("%m/%Y"), t[0], t[1], t[2]))

# ── diario: o acumulado no evento, dia a dia ───────────────────────────
diaria = defaultdict(lambda: {"n": 0, "veic": 0, "of": 0.0, "ve": 0.0})
diaria_cat = defaultdict(lambda: {"n": 0, "veic": 0, "of": 0.0, "ve": 0.0})
diaria_com = defaultdict(lambda: {"n": 0, "veic": 0, "of": 0.0, "ve": 0.0})
d = INI
while d < FIM:
    evs = [e for e, (d0, d1, f) in eventos.items() if d0 <= d <= d1]
    vend = lambda n: n[5] in VENDA and n[7] is not None and n[7] <= d  # noqa: E731
    g = conta(ultimas(evs), lambda n: vend(n) or (n[6] is not None and n[6] <= d), vend)
    for grupo, (v, o, s) in g.items():
        acumula(diaria, grupo, v, o, s)
    referencias(g, diaria_cat, diaria_com)
    if args.confere and d.day in (15, 29) and d.month == 10:
        t = [sum(x[i] for x in g.values()) for i in range(3)]
        print("  dia %s: %d ativos, %d com oferta, %d vendidos" % (d.strftime("%d/%m/%Y"), t[0], t[1], t[2]))
    d += dt.timedelta(days=1)


# ── a planilha ─────────────────────────────────────────────────────────
from openpyxl import Workbook  # noqa: E402
from openpyxl.styles import Alignment, Border, Font, PatternFill, Protection, Side  # noqa: E402
from openpyxl.worksheet.datavalidation import DataValidation  # noqa: E402

# o desenho (Thomas, 06/11): uma linha por comitente com as metas de cada
# categoria lado a lado ("categoria vira coluna"); a linha 1 e a coluna A sao
# MARGEM; a linha 2 leva "% Com Oferta" e "% Vendido" mesclados sobre as
# categorias; a linha 3, ID comitente, Comitente e as categorias; os dados
# da linha 4 em diante. Celula vazia = o comitente nao teve veiculo da
# categoria nos 12 meses: sem meta.
# O nome da categoria se repete na linha 3, e a Tabela do Excel nao aceita
# nome de coluna repetido: e um intervalo formatado com filtro. Pelo mesmo
# motivo o n8n le a aba SEM cabecalho (linhas de celulas), e o Montar Painel
# acha a linha do "ID comitente" e a medida na linha de cima.
MEDIDAS = (("% Com Oferta", 0), ("% Vendido", 1))
LIN_MEDIDA, LIN_CAB, COL0 = 2, 3, 2      # linha 2, linha 3, coluna B
VERDE, AZUL, CINZA = "E2F0D9", "DDEBF7", "F2F2F2"
# as celulas das metas pintadas (Thomas, 06/11), no tom claro da medida: o
# cabecalho fica no tom cheio e se distingue dos dados. Sem linhas internas:
# so o contorno do bloco
VERDE_CLARO, AZUL_CLARO = "F1F8EC", "EEF5FB"
# a TRAVA (Thomas, 06/11: so inserir linha nova ou alterar o valor das
# metas): a aba e protegida, sem senha (Revisar > Desproteger abre); fica
# destravado so o valor das metas e, para comitente novo, LINHAS_NOVAS
# linhas vazias ja formatadas no fim (ID, nome e metas). Inserir linha e
# filtrar seguem permitidos. Meta so aceita numero de 0 a 100%, ID so inteiro
LINHAS_NOVAS = 100


def escreve_aba(wb, titulo, linhas):
    """linhas: [(id, nome, {categoria: (meta com oferta, meta vendidos)})]"""
    ws = wb.create_sheet(titulo)
    fino = Side(style="thin", color="A6A6A6")
    nc = len(ORDEM_CAT)
    cor = lambda k: VERDE if k == 0 else AZUL  # noqa: E731
    cor_dado = lambda k: VERDE_CLARO if k == 0 else AZUL_CLARO  # noqa: E731
    # linha 2: as medidas, mescladas sobre as categorias
    for k, (rot, _) in enumerate(MEDIDAS):
        c0 = COL0 + 2 + k * nc
        ws.cell(LIN_MEDIDA, c0, rot)
        ws.merge_cells(start_row=LIN_MEDIDA, start_column=c0, end_row=LIN_MEDIDA, end_column=c0 + nc - 1)
        for c in range(c0, c0 + nc):
            x = ws.cell(LIN_MEDIDA, c)
            x.fill = PatternFill("solid", fgColor=cor(k))
        x = ws.cell(LIN_MEDIDA, c0)
        x.font = Font(bold=True)
        x.alignment = Alignment(horizontal="center", vertical="center")
    # linha 3: o cabeçalho
    cab = ["ID comitente", "Comitente"] + [CATEGORIAS[c] for _ in MEDIDAS for c in ORDEM_CAT]
    for j, v in enumerate(cab):
        x = ws.cell(LIN_CAB, COL0 + j, v)
        x.font = Font(bold=True)
        x.alignment = Alignment(horizontal="center" if j >= 2 else "left", vertical="center", wrap_text=True)
        x.fill = PatternFill("solid", fgColor=CINZA if j < 2 else cor((j - 2) // nc))
    # os dados, e as linhas vazias para comitente novo
    livre = Protection(locked=False)
    for i in range(len(linhas) + LINHAS_NOVAS):
        r = LIN_CAB + 1 + i
        nova = i >= len(linhas)
        if nova:
            vals = [None] * (2 + 2 * nc)
        else:
            comit, nome, m = linhas[i]
            vals = [comit, nome] + [m[c][k] if c in m else None for _, k in MEDIDAS for c in ORDEM_CAT]
        for j, v in enumerate(vals):
            x = ws.cell(r, COL0 + j, v)
            if j >= 2:
                x.number_format = "0.0%"
                x.alignment = Alignment(horizontal="center")
                x.fill = PatternFill("solid", fgColor=cor_dado((j - 2) // nc))
            if j >= 2 or nova:
                x.protection = livre
    fim = LIN_CAB + len(linhas) + LINHAS_NOVAS
    # o contorno: ID e Comitente da linha 3 ao fim, as metas da linha 2 ao fim
    c_ini, c_fim = COL0, COL0 + 1 + 2 * nc
    for r in range(LIN_MEDIDA, fim + 1):
        for c in range(c_ini, c_fim + 1):
            if r == LIN_MEDIDA and c < COL0 + 2:
                continue
            topo = r == LIN_MEDIDA or (r == LIN_CAB and c < COL0 + 2)
            esq = c == c_ini or (r == LIN_MEDIDA and c == COL0 + 2)
            ws.cell(r, c).border = Border(left=fino if esq else None, right=fino if c == c_fim else None,
                                          top=fino if topo else None, bottom=fino if r == fim else None)
    pc = DataValidation(type="decimal", operator="between", formula1="0", formula2="1", allow_blank=True,
                        showErrorMessage=True, errorTitle="Meta", error="A meta é um percentual de 0% a 100%.")
    pc.add("%s%d:%s%d" % (chr(64 + COL0 + 2), LIN_CAB + 1, chr(64 + COL0 + 1 + 2 * nc), fim))
    ident = DataValidation(type="whole", operator="greaterThan", formula1="0", allow_blank=True,
                           showErrorMessage=True, errorTitle="ID comitente", error="O ID do comitente é um número inteiro.")
    ident.add("%s%d:%s%d" % (chr(64 + COL0), LIN_CAB + 1, chr(64 + COL0), fim))
    ws.add_data_validation(pc)
    ws.add_data_validation(ident)
    # margens e larguras
    ws.column_dimensions["A"].width = 3
    ws.row_dimensions[1].height = 12
    larg = [13, 38] + [14] * (2 * nc)
    for j, w in enumerate(larg):
        ws.column_dimensions[chr(64 + COL0 + j)].width = w
    ws.row_dimensions[LIN_CAB].height = 30
    ultima = chr(64 + COL0 + len(cab) - 1)
    ws.auto_filter.ref = "%s%d:%s%d" % (chr(64 + COL0), LIN_CAB, ultima, fim)
    ws.freeze_panes = ws.cell(LIN_CAB + 1, COL0 + 2)
    ws.sheet_view.showGridLines = False
    # a trava: no openpyxl, True = proibido. Libera inserir linha, filtrar e
    # selecionar; o resto (formatar, apagar coluna, mexer no travado) fica proibido
    ws.protection.sheet = True
    ws.protection.insertRows = False
    ws.protection.autoFilter = False
    ws.protection.selectLockedCells = False
    ws.protection.selectUnlockedCells = False


def aba(wb, titulo, soma, soma_cat, soma_com, unidade, plural, min_n, min_veic):
    media = lambda s: (round(s["of"] / s["n"], 4), round(s["ve"] / s["n"], 4))  # noqa: E731
    pequena = lambda s: s["n"] < min_n or s["veic"] < min_veic  # noqa: E731
    pequenas = {"comitente": 0, "categoria": 0}
    metas = defaultdict(dict)
    for (comit, cat), s in soma.items():
        if comit in teste or comit not in ativos:
            continue
        # a meta revisada: a media do grupo; base pequena, a do comitente
        # (todas as categorias) e, se ele tambem tem pouca base, a da categoria
        if not pequena(s):
            metas[comit][cat] = media(s)
        elif not pequena(soma_com[comit]):
            pequenas["comitente"] += 1
            metas[comit][cat] = media(soma_com[comit])
        else:
            pequenas["categoria"] += 1
            metas[comit][cat] = media(soma_cat[cat])
    comits = sorted(metas, key=lambda c: str(nomes.get(c) or "").strip().lower())
    escreve_aba(wb, titulo, [(c, str(nomes.get(c) or "loja %s" % c).strip(), metas[c]) for c in comits])
    print("  %s: %d comitentes, %d metas; base pequena: %d com a meta do comitente, %d com a da categoria; categorias: %s" % (
        titulo, len(comits), sum(len(m) for m in metas.values()), pequenas["comitente"], pequenas["categoria"],
        " · ".join("%s %.1f%% / %.1f%%" % (CATEGORIAS[c], 100 * media(soma_cat[c])[0], 100 * media(soma_cat[c])[1])
                   for c in ORDEM_CAT if c in soma_cat)))
    return len(comits)


fora = sorted({str(nomes.get(c) or c).strip() for c, cat in mensal if c not in ativos and c not in teste})
print("inativos nos ultimos %d meses, fora: %s" % (MESES_ATIVO, ", ".join(fora) or "nenhum"))
wb = Workbook()
wb.remove(wb.active)
nm = aba(wb, "Média mensal", mensal, mensal_cat, mensal_com, "mês", "Meses", MIN_MESES, MIN_VEIC_MES)
nd = aba(wb, "Média diária", diaria, diaria_cat, diaria_com, "dia", "Dias", MIN_DIAS, MIN_VEIC_DIA)
wb.save(args.saida)
print("✓ %s · %d comitentes no mensal, %d no diario" % (args.saida, nm, nd))
