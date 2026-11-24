# -*- coding: utf-8 -*-
"""Estudo de Republicacoes Dealers: dados-brutos.json (extrai.py) -> resultados.json (uma linha por carro).

    python -I analisa.py

As escolhas (marcadas "(minha)" no README) estao aqui, uma por constante:
  - publicacao = uma negociacao (o carro naquele evento); o dia e o inicio das ofertas do evento
  - 2026 = inicio das ofertas de 01/01/2026 ate a hora da coleta (hora de Brasilia, como o banco grava
    o evento): a agendada fica fora (23/11); ha negociacao com inicio em 2027 e 2028, data lixo, fora
  - conta de teste ('teste' ou 'tutorial' no nome do comitente) sai ANTES de tudo, nas duas bases
  - a ordem e o intervalo saem da PRIMEIRA publicacao de 2026 em cada base; mesmo dia = 'MD'
  - comitente unificado = o dono do carro; quando a Cars2You vende por canal de revenda
    (Outlet Netcarros, Multifrota), vale o nome da Dealers
  - categoria: Pesados se algum lado diz Pesados; senao Leves (moto inclusa) se algum lado diz Leves
  - venda = ultima negociacao da base em status 2, 3 ou 7 (definicoes.md), valor = oferta vencedora
  - FIPE = do anuncio (definicoes.md); sem ela, a do cadastro do veiculo (a Dealers tem 39% no anuncio)
23/11 (pedido do Thomas):
  - data da venda = dia da oferta vencedora da publicacao vendida (sem ela, o fim do evento)
  - passagem = publicacoes seguidas na mesma base, em ordem de inicio; o carro "foi e voltou" a cada troca
  - DEVOLVIDO = voltou a base de origem depois de passar pela outra (3 passagens ou mais)
  - ERRO OPERACIONAL = (a) no ar nas duas ao mesmo tempo: janelas que se cruzam (estrito: uma
    terminar quando a outra comeca nao conta); a publicacao CANCELADA termina no updated_at da
    negociacao quando ele cai antes do fim do evento (minha: o banco nao guarda a hora do
    cancelamento); ou (b) republicado com a outra base em Vendido, Aguardando pagamento ou
    confirmacao, ou Em analise: a ultima publicacao da outra base que comecou antes tem um desses
    status (status de hoje, nao o do dia)
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
# 23/11 (Thomas): publicacao AGENDADA (inicio das ofertas depois da coleta) fica fora. A rodada e
# gravada na hora do computador, Brasilia, como o inicio do evento.
AGORA = D["rodada"]
TESTE = re.compile(r"teste|tutorial", re.I)
VENDA = {2, 3, 7}
EM_ANALISE = {9, 13}
CANCELADO = 10
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


def fim_ef(l, i):
    """Fim da janela no ar: o fim do evento; a cancelada para no updated_at, se ele vier antes."""
    ini, fim = l[i["inicio"]], l[i["fim"]] or l[i["inicio"]]
    at = l[i["atualizado"]] if "atualizado" in i else None
    if l[i["status"]] == CANCELADO and at and ini <= at < fim:
        return at
    return fim


def placa_br(p):
    """Placa como se le: antiga com hifen (ABC-1234), Mercosul junta (ABC1D23)."""
    if not p or len(p) != 7:
        return p or None
    return p[:3] + "-" + p[3:] if p[4].isdigit() else p


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
    de26 = [l for l in todas if ANO <= l[i["inicio"]] < FIM and l[i["inicio"]] <= AGORA]
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
    placa = next((l[i["placa"]] for l in reversed(de26) if l[i["placa"]]), None) if "placa" in i else None
    return {
        "placa": placa,
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
            "dv": ((ult[i["dia_vencedora"]] or ult[i["fim"]] or "")[:10] or None) if vendido else None,
            "fipe": fipe, "fipe_o": fipe_origem,
            "molicar": molicar,
            "vmv": ult[i["vmv"]] if b == "cars2you" else None,  # na Dealers o VMV e sentinela (qualidade.md)
            "com": (ult[i["comitente"]] or "").strip(),
            "evento": ult[i["evento_nome"]],
        },
        "grupo": ult[i["grupo"]], "cat_id": ult[i["cat_id"]],
        "modelo": ult[i["modelo"]], "versao": ult[i["versao"]], "ano": ult[i["ano_mod"]], "km": ult[i["km"]],
    }


DIA0 = date(2026, 1, 1)
EVENTOS, EV_IDX = [], {}


def ev_idx(nome):
    nome = (nome or "").strip()
    if nome not in EV_IDX:
        EV_IDX[nome] = len(EVENTOS)
        EVENTOS.append(nome)
    return EV_IDX[nome]


def r0(x):
    return int(round(x)) if x else None


def pubs_do_carro(L):
    """Todas as publicacoes de 2026 das duas bases, em ordem de inicio (pedido de 23/11: a dica e uma
    tabela vertical com elas). Cada uma: [base 0/1, inicio, fim no ar, status, evento, ofertas, maior,
    ultima, venda, dia da venda, FIPE], datas em dias desde 01/01/2026, evento = indice em EVENTOS."""
    linhas = []
    for k, b in enumerate(BASES):
        i = L[b]["i"]
        for l in L[b]["de26"]:
            st = l[i["status"]]
            dv = (l[i["dia_vencedora"]] or l[i["fim"]] or "")[:10] if st in VENDA else ""
            linhas.append(((l[i["inicio"]], l[i["neg"]]), [
                k, (dia(l[i["inicio"]]) - DIA0).days, (dia(fim_ef(l, i)) - DIA0).days, st, ev_idx(l[i["evento_nome"]]),
                int(l[i["n_ofertas"]] or 0), r0(l[i["maior_oferta"]]), r0(l[i["ult_oferta"]]),
                r0(l[i["valor_vencedora"]]) if st in VENDA else None, (dia(dv) - DIA0).days if dv else None,
                r0(l[i["fipe"]] or l[i["fipe_veic"]])]))
    return [v for _, v in sorted(linhas, key=lambda t: t[0])]


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
    # todas as publicacoes de 2026 das duas bases, em ordem de inicio: (inicio, fim no ar, base, status)
    def dv_de(l, i):
        return (l[i["dia_vencedora"]] or l[i["fim"]] or "")[:10] or None if l[i["status"]] in VENDA else None
    seq = sorted((l[L[b]["i"]["inicio"]], fim_ef(l, L[b]["i"]), b, l[L[b]["i"]["status"]], l[L[b]["i"]["neg"]],
                  dv_de(l, L[b]["i"])) for b in BASES for l in L[b]["de26"])
    # passagens: publicacoes seguidas na mesma base; status e data da venda = os da ultima
    pas = []
    for ini, fim, b, st, _, dv in seq:
        if pas and pas[-1]["b"] == b:
            p = pas[-1]
            p["fim"] = max(p["fim"], fim)
            p["n"] += 1
            p["st"] = st
            p["dv"] = dv
            p["cnt"][st] += 1
        else:
            pas.append({"b": b, "ini": ini, "fim": fim, "n": 1, "st": st, "dv": dv, "cnt": Counter([st])})
    devolvido = int(len(pas) >= 3)
    # erro operacional (a): no ar nas duas ao mesmo tempo
    sim = next(((x, y) for x in seq if x[2] == "cars2you" for y in seq
                if y[2] == "dealers" and x[0] < y[1] and y[0] < x[1]), None)
    sobre = int(bool(sim))
    # erro operacional (b): republicado com a outra base vendida ou em analise
    rep = None
    for p in seq:
        antes_outra = [q for q in seq if q[2] != p[2] and q[0] < p[0]]
        if antes_outra:
            q = max(antes_outra, key=lambda q: (q[0], q[4]))
            if q[3] in VENDA or q[3] in EM_ANALISE:
                rep = (p, q)
                break
    NB = {"cars2you": "Cars2You", "dealers": "Dealers"}
    br = lambda s: s[8:10] + "/" + s[5:7] + "/" + s[2:4]
    erro_txt = []
    if sim:
        x, y = sim
        erro_txt.append("No ar nas duas ao mesmo tempo: Cars2You de %s a %s (%s) e Dealers de %s a %s (%s)" % (
            br(x[0]), br(x[1]), STATUS.get(x[3], x[3]), br(y[0]), br(y[1]), STATUS.get(y[3], y[3])))
    if rep:
        p, q = rep
        erro_txt.append("Republicado na %s em %s com a %s em %s (publicação de %s)" % (
            NB[p[2]], br(p[0]), NB[q[2]], STATUS.get(q[3], q[3]), br(q[0])))
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
    pc_, pd_ = L["cars2you"]["placa"], L["dealers"]["placa"]
    carros.append({
        "id": k + 1, "vc": c["veics"]["cars2you"], "vd": c["veics"]["dealers"], "por": c["casou_por"],
        "placa": placa_br(pc_ or pd_), "placa_d": placa_br(pd_) if pd_ and pc_ and pd_ != pc_ else None,
        # passagem: [base 0=Cars2You 1=Dealers, inicio, fim, publicacoes, status da ultima, [status, n, ...],
        #            data da venda da ultima]
        "pas": [[0 if p["b"] == "cars2you" else 1, p["ini"][:10], p["fim"][:10], p["n"], p["st"],
                 [v for s, n in sorted(p["cnt"].items(), key=lambda t: -t[1]) for v in (s, n)], p["dv"]] for p in pas],
        "pubs": pubs_do_carro(L),
        "dev": devolvido, "erro_sim": int(bool(sim)), "erro_rep": int(bool(rep)), "erro_txt": erro_txt,
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
               "molicar_c": sum(1 for c in carros if c["c"]["molicar"]),
               "agendadas_fora": {b: sum(1 for v in negs[b] for l in negs[b][v]
                                         if AGORA < l[cols[b]["inicio"]] < FIM) for b in BASES},
               "passagens": dict(sorted(Counter(len(c["pas"]) for c in carros).items())),
               "devolvidos": sum(c["dev"] for c in carros),
               "erro_operacional": sum(1 for c in carros if c["erro_sim"] or c["erro_rep"]),
               "erro_sim": sum(c["erro_sim"] for c in carros), "erro_rep": sum(c["erro_rep"] for c in carros),
               "erro_ambos": sum(1 for c in carros if c["erro_sim"] and c["erro_rep"]),
               "com_placa": sum(1 for c in carros if c["placa"]),
               "placa_difere": sum(1 for c in carros if c["placa_d"]),
               "cancelada_com_atualizado": "atualizado" in cols["cars2you"]})
saida = {"rodada": D["rodada"], "desde": D["desde"], "resumo": resumo, "status": STATUS, "eventos": EVENTOS, "carros": carros}
(AQUI / "resultados.json").write_text(json.dumps(saida, ensure_ascii=False), encoding="utf-8", newline="\n")
print(json.dumps(resumo, ensure_ascii=False, indent=1))
