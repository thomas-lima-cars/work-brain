# -*- coding: utf-8 -*-
"""Estudo de Republicacoes Dealers: dados-brutos.json (extrai.py) -> resultados.json (uma linha por carro).

    python -I analisa.py

As escolhas (marcadas "(minha)" no README) estao aqui, uma por constante:
  - publicacao = uma negociacao (o carro naquele evento); o dia e o inicio das ofertas do evento
  - 2026 = inicio das ofertas de 01/01 a 31/12/2026 (hora de Brasilia, como o banco grava o evento);
    ha negociacao com inicio em 2027 e 2028, data lixo, que fica fora
  - conta de teste ('teste' ou 'tutorial' no nome do comitente) sai ANTES de tudo, nas duas bases
  - a ordem e o intervalo saem da PRIMEIRA publicacao de 2026 em cada base; mesmo dia = 'MD'
  - comitente unificado = o dono do carro; quando a Cars2You vende por canal de revenda
    (Outlet Netcarros, Multifrota), vale o nome da Dealers
  - categoria: Pesados se algum lado diz Pesados; senao Leves (moto inclusa) se algum lado diz Leves
  - venda = ultima negociacao da base em status 2, 3 ou 7 (definicoes.md), valor = oferta vencedora
  - FIPE = do anuncio (definicoes.md); sem ela, a do cadastro do veiculo (a Dealers tem 39% no anuncio)
"""
import json
import re
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path

AQUI = Path(__file__).resolve().parent
D = json.loads((AQUI / "dados-brutos.json").read_text(encoding="utf-8"))
BASES = ("cars2you", "dealers")
SIG = {"cars2you": "c", "dealers": "d"}
ANO = "2026"
FIM = "2027"  # inicio de oferta depois de 2026 e data lixo ou agendada: fora
TESTE = re.compile(r"teste|tutorial", re.I)
VENDA = {2, 3, 7}
REVENDA_C2Y = re.compile(r"outlet netcarros|multifrota", re.I)

STATUS = {1: "Ativo", 2: "Aguardando pagamento", 3: "Aguardando confirmação", 7: "Vendido", 8: "Suspenso",
          9: "Em análise comprador", 10: "Cancelado", 11: "Sem ofertas", 13: "Em análise vendedor",
          14: "Vendedor rejeitou", 15: "Comprador rejeitou", 18: "Venda cancelada"}

DONOS = [  # (padrao no nome, nome unificado) -- o primeiro que casar vale
    (r"\bc6\b", "C6 Bank"), (r"volkswagen", "Banco Volkswagen"), (r"toyota", "Banco Toyota"),
    (r"kinto", "Kinto"), (r"\bgmf\b|banco gm", "GM Financial"), (r"\blm transportes\b", "LM Transportes"),
    (r"bradesco", "Bradesco"), (r"santander", "Santander"), (r"\bbmw\b", "BMW Financeira"),
    (r"bb cons|banco do brasil", "Banco do Brasil"), (r"scania", "Scania"), (r"mercado pago", "Mercado Pago"),
    (r"netcarros", "Netcarros"), (r"multifrota", "Multifrota"), (r"finamax", "Finamax"),
    (r"banco pan", "Banco Pan"), (r"safra", "Banco Safra"), (r"brasileiro de credito", "BBC"),
    (r"dealers club", "Dealers Club"), (r"ita[uú]", "Itaú"),
]


def dono(nome):
    for pad, uni in DONOS:
        if re.search(pad, nome or "", re.I):
            return uni
    return (nome or "(sem comitente)").strip()


def categoria(grupo, cat_id):
    if grupo == "Pesados" or cat_id == 23:
        return "Pesados"
    if grupo in ("Leves", "Motos") or cat_id == 6:
        return "Leves"
    return "Outros"


def dia(txt):
    return date(int(txt[:4]), int(txt[5:7]), int(txt[8:10]))


# ---- negociacoes por veiculo, sem conta de teste
negs, cols, fora_teste = {}, {}, Counter()
for b in BASES:
    n = D["negs"][b]
    i = {c: k for k, c in enumerate(n["cols"])}
    cols[b] = i
    por = defaultdict(list)
    for l in n["linhas"]:
        if TESTE.search(l[i["comitente"]] or ""):
            fora_teste[b] += 1
            continue
        if not l[i["inicio"]]:
            continue
        por[l[i["veic"]]].append(l)
    negs[b] = por


def lado(b, veics):
    """Resumo de uma base para um carro (pode ter mais de um veiculo cadastrado nela)."""
    i = cols[b]
    todas = sorted((l for v in veics for l in negs[b][v]), key=lambda l: (l[i["inicio"]], l[i["neg"]]))
    de26 = [l for l in todas if ANO <= l[i["inicio"]] < FIM]
    if not de26:
        return None
    ult = max(de26, key=lambda l: l[i["neg"]])
    com_of = [l for l in de26 if l[i["n_ofertas"]]]
    ult_of = max(com_of, key=lambda l: (l[i["dia_ult_oferta"]] or "", l[i["neg"]])) if com_of else None
    fipe = next((l[i["fipe"]] for l in reversed(de26) if l[i["fipe"]]), None)
    fipe_origem = "anuncio" if fipe else None
    if not fipe:
        fipe = next((l[i["fipe_veic"]] for l in reversed(de26) if l[i["fipe_veic"]]), None)
        fipe_origem = "veiculo" if fipe else None
    molicar = next((l[i["molicar"]] or l[i["molicar_veic"]] for l in reversed(de26)
                    if l[i["molicar"]] or l[i["molicar_veic"]]), None)
    vendido = ult[i["status"]] in VENDA
    return {
        "todas": todas, "de26": de26, "i": i,
        "r": {  # o que vai para a pagina
            "pub": len(de26),
            "ev": len({l[i["evento"]] for l in de26}),
            "ini": de26[0][i["inicio"]][:10],
            "fim": max((l[i["fim"]] or l[i["inicio"]]) for l in de26)[:10],
            "hist": int(any(l[i["inicio"]] < ANO for l in todas)),
            "of": int(sum(l[i["n_ofertas"]] or 0 for l in de26)),
            "pub_of": len(com_of),
            "maior": max((l[i["maior_oferta"]] for l in com_of), default=None),
            "ult": ult_of[i["ult_oferta"]] if ult_of else None,
            "ult_dia": (ult_of[i["dia_ult_oferta"]] or "")[:10] if ult_of else None,
            "st": ult[i["status"]],
            "vend": int(vendido),
            "venda": ult[i["valor_vencedora"]] if vendido else None,
            "fipe": fipe, "fipe_o": fipe_origem,
            "molicar": molicar,
            "vmv": ult[i["vmv"]] if b == "cars2you" else None,  # na Dealers o VMV e sentinela (qualidade.md)
            "com": (ult[i["comitente"]] or "").strip(),
            "evento": ult[i["evento_nome"]],
        },
        "grupo": ult[i["grupo"]], "cat_id": ult[i["cat_id"]],
        "modelo": ult[i["modelo"]], "versao": ult[i["versao"]], "ano": ult[i["ano_mod"]], "km": ult[i["km"]],
    }


carros, sem_dois_lados = [], 0
for k, c in enumerate(D["carros"]):
    L = {b: lado(b, c["veics"][b]) for b in BASES}
    if not all(L.values()):
        sem_dois_lados += 1
        continue
    rc, rd = L["cars2you"]["r"], L["dealers"]["r"]
    dc, dd = dia(rc["ini"]), dia(rd["ini"])
    ordem = "MD" if dc == dd else ("DC" if dd < dc else "CD")
    # a publicacao do 1o lado que estava valendo quando o carro estreou no 2o: como ele saiu de la?
    st_antes = None
    if ordem != "MD":
        pri, seg = ("dealers", "cars2you") if ordem == "DC" else ("cars2you", "dealers")
        i = L[pri]["i"]
        ini2 = L[seg]["de26"][0][L[seg]["i"]["inicio"]]
        antes = [l for l in L[pri]["de26"] if l[i["inicio"]] < ini2]
        st_antes = max(antes, key=lambda l: l[i["neg"]])[i["status"]] if antes else None
    # as duas no ar ao mesmo tempo: algum par de janelas (inicio..fim) se cruza
    def janelas(b):
        i = L[b]["i"]
        return [(l[i["inicio"]], l[i["fim"]] or l[i["inicio"]]) for l in L[b]["de26"]]
    sobre = int(any(a0 <= b1 and b0 <= a1 for a0, a1 in janelas("cars2you") for b0, b1 in janelas("dealers")))
    com_c, com_d = rc["com"], rd["com"]
    uni = dono(com_d) if REVENDA_C2Y.search(com_c) else dono(com_c)
    cat = categoria(L["cars2you"]["grupo"], L["cars2you"]["cat_id"])
    cat_d = categoria(L["dealers"]["grupo"], L["dealers"]["cat_id"])
    if "Pesados" in (cat, cat_d):
        cat = "Pesados"
    elif "Leves" in (cat, cat_d):
        cat = "Leves"
    base_info = L["cars2you"] if L["cars2you"]["modelo"] and "(sem" not in L["cars2you"]["modelo"] else L["dealers"]
    vend = ("ambos" if rc["vend"] and rd["vend"] else "c" if rc["vend"] else "d" if rd["vend"] else "nenhum")
    for r in (rc, rd):
        del r["com"]
    carros.append({
        "id": k + 1, "vc": c["veics"]["cars2you"], "vd": c["veics"]["dealers"], "por": c["casou_por"],
        "cat": cat, "dono": uni, "com_c": com_c, "com_d": com_d,
        "modelo": base_info["modelo"], "versao": base_info["versao"],
        "ano": base_info["ano"] or L["dealers"]["ano"], "km": L["cars2you"]["km"] or L["dealers"]["km"],
        "ordem": ordem, "dias": abs((dc - dd).days), "sobre": sobre, "st_antes": st_antes,
        "vendeu": vend, "c": rc, "d": rd,
    })

resumo = dict(D["resumo"])
resumo.update({"negs_teste_fora": dict(fora_teste), "sem_2026_nos_dois_apos_teste": sem_dois_lados,
               "carros": len(carros), "ordem": dict(Counter(c["ordem"] for c in carros)),
               "cat": dict(Counter(c["cat"] for c in carros)), "vendeu": dict(Counter(c["vendeu"] for c in carros)),
               "fipe_origem_d": dict(Counter(c["d"]["fipe_o"] for c in carros)),
               "fipe_origem_c": dict(Counter(c["c"]["fipe_o"] for c in carros)),
               "molicar_c": sum(1 for c in carros if c["c"]["molicar"])})
saida = {"rodada": D["rodada"], "desde": D["desde"], "resumo": resumo, "status": STATUS, "carros": carros}
(AQUI / "resultados.json").write_text(json.dumps(saida, ensure_ascii=False), encoding="utf-8", newline="\n")
print(json.dumps(resumo, ensure_ascii=False, indent=1))
