"""Quais indicadores estao por tras dos outliers do modelo de preco.

    python automations/precificacao/preditivo/outliers.py

Le `resultado-modelo.json` (as vendas de teste, com previsto e vendido) e
remonta todos os indicadores de cada venda com o `carrega()` do proprio
modelo -- os mesmos, e nao uma copia. Acrescenta campos que o modelo NAO usa
(loja vendedora, cor, cambio...) para ver se o erro mora neles. O VMV fica de
fora: e o que o modelo confronta, nunca variavel dele.

Outlier = erro acima de 20% em modulo. Comparacao: outliers contra as vendas
bem previstas (erro ate 10%). Para cada indicador:
    lift = % entre os outliers / % entre os bem previstos
e o teste exato de Fisher, porque varios grupos sao pequenos.

Sai `outliers.json`, lido por `monta-relatorio.js`.
"""
import importlib.util
import json
import sys
from collections import defaultdict
from pathlib import Path

from scipy.stats import fisher_exact

sys.stdout.reconfigure(encoding="utf-8")
AQUI = Path(__file__).resolve().parent
ESTUDO = AQUI.parent
_spec = importlib.util.spec_from_file_location("_mp", AQUI / "modelo-preco.py")
_mp = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_mp)

CORTE_OUT, CORTE_BOM, N_MIN = 0.20, 0.10, 8
CANAL = {4: "Trucks2you", 7: "Marketplace", 8: "Dealers Club", 43: "C6 Auto",
         48: "Colaboradores C6", 62: "Lance Fácil BTB", 65: "BTB Associados"}


def extras():
    """campos do analitico que o modelo nao usa, por (base, id, data)"""
    out = {}
    for arq, base in _mp.BASES.items():
        vendas = []
        for nome in ("analitico-amplo-%s.json" % arq, "analitico-%s.json" % arq):
            if (ESTUDO / nome).exists():
                vendas += json.loads((ESTUDO / nome).read_text("utf-8"))["vendas"]
        for r in vendas:
            vid = str(int(_mp.num(r.get("veiculo_id"))))
            e = {"vendedor": "vendedor: %s" % (r.get("loja") or "?")[:40],
                 "cambio": "câmbio: %s" % (r.get("cambio") or "?"),
                 "combustivel": "combustível: %s" % (r.get("combustivel") or "?"),
                 "cor": "cor: %s" % (r.get("cor") or "?")}
            # O VMV NAO entra aqui: e o que o modelo existe para confrontar, nao
            # um candidato a variavel (regra do projeto, 14/10). O confronto
            # modelo x VMV x venda e uma secao propria do relatorio.
            out[(base, vid, (r.get("data_venda") or "")[:10])] = e
    return out


def legivel(t):
    if "=" not in t:
        return t
    c, v = t.split("=", 1)
    b = ""
    if ":" in v and v.split(":")[0] in ("Cars2You", "Dealers"):
        b, v = v.split(":", 1)
    if len(v) > 2 and v[1] == " ":
        v = v[2:]
    if c == "canal":
        v = CANAL.get(int(v.replace("wl", "")), v)
    nome = {"km": "km", "idade": "idade", "uf": "UF", "categoria": "categoria",
            "faixa_fipe": "FIPE", "laudo_banco": "laudo no banco", "lataria": "lataria com dano",
            "canal": "canal"}.get(c, c)
    return "%s: %s%s" % (nome, v.replace("_", " "), " (%s)" % b if b else "")


def main():
    R = json.loads((AQUI / "resultado-modelo.json").read_text("utf-8"))
    linhas = {(x["base"], x["id"], x["data"]): x for x in _mp.carrega()}
    ext = extras()

    vendas = []
    for v in R["veiculos"]:
        k = (v["b"], v["id"], v["dt"])
        x = linhas[k]
        erro = (v["prev"] - v["real"]) / v["real"]
        feats = set()
        for c, val in x["cat"].items():
            # vendedor, cor, cambio e combustivel ja entram por NOME em extras();
            # pelo id, o mesmo vendedor apareceria duas vezes na tabela
            if c in ("vendedor", "cor", "cambio", "combustivel", "carroceria", "patio"):
                continue
            feats.add(legivel("%s=%s" % (c, val)))
        feats.update(b.replace("texto: ", "anúncio: ").replace("laudo PDF: ", "laudo PDF: ")
                     for b in x["bin"])
        if x["km"] is None:
            feats.add("km: não informado")
        feats.update(ext.get(k, {}).values())
        vendas.append({"k": k, "erro": erro, "razao": x["razao"], "f": feats, "g": x["modelo"],
                       "base": x["base"], "real": v["real"], "prev": v["prev"], "fipe": x["fipe"]})

    resultado = {}
    for lado, cond in (("caro", lambda e: e > CORTE_OUT), ("barato", lambda e: e < -CORTE_OUT)):
        out = [v for v in vendas if cond(v["erro"])]
        bom = [v for v in vendas if abs(v["erro"]) <= CORTE_BOM]
        cont_o, cont_b = defaultdict(int), defaultdict(int)
        for v in out:
            for f in v["f"]:
                cont_o[f] += 1
        for v in bom:
            for f in v["f"]:
                cont_b[f] += 1
        tab = []
        for f, no in cont_o.items():
            if no < N_MIN and lado == "caro":
                continue
            if no < 3:
                continue
            nb = cont_b.get(f, 0)
            po, pb = no / len(out), nb / len(bom)
            _, p = fisher_exact([[no, len(out) - no], [nb, len(bom) - nb]], alternative="greater")
            com = [v for v in vendas if f in v["f"]]
            taxa = sum(1 for v in com if cond(v["erro"])) / len(com)
            tab.append({"ind": f, "n_out": no, "pct_out": po, "n_bom": nb, "pct_bom": pb,
                        "lift": po / pb if pb else None, "p": p, "taxa": taxa, "n_total": len(com)})
        tab.sort(key=lambda t: (t["p"], -(t["lift"] or 99)))
        resultado[lado] = {"n": len(out), "n_bom": len(bom),
                           "taxa_geral": len(out) / len(vendas), "indicadores": tab}
        print("\n== previu %s: %d outliers contra %d bem previstos (%.1f%% das vendas)"
              % (lado.upper(), len(out), len(bom), 100 * len(out) / len(vendas)))
        print("%-56s %5s %7s %7s %6s %7s %9s" % ("indicador", "n", "% out", "% bom", "lift", "taxa", "p"))
        for t in tab[:28]:
            print("%-56s %5d %6.1f%% %6.1f%% %6s %6.1f%% %9.1e" % (
                t["ind"][:56], t["n_out"], 100 * t["pct_out"], 100 * t["pct_bom"],
                ("%.1fx" % t["lift"]) if t["lift"] else "só out", 100 * t["taxa"], t["p"]))

    # cobertura do PERFIL ofensor: retomado por banco, sem chave/motor, sem km
    # lido, laudo reprovado ou ausente. Calculada aqui para a pagina nunca
    # citar numero de uma rodada antiga.
    def perfil(v):
        f = v["f"]
        return ("km: não informado" in f or "anúncio: Chave ausente ou não funciona" in f
                or "anúncio: Motor não funciona" in f
                or "laudo no banco: reprovado" in f or "laudo no banco: sem laudo" in f
                or any(t.startswith("vendedor:") and ("C6" in t or "Bradesco" in t) for t in f))
    out = [v for v in vendas if v["erro"] > CORTE_OUT]
    bom = [v for v in vendas if abs(v["erro"]) <= CORTE_BOM]
    resultado["cobertura"] = {"out": sum(map(perfil, out)) / len(out),
                              "bom": sum(map(perfil, bom)) / len(bom)}
    print("perfil ofensor: %.0f%% dos outliers, %.0f%% dos bem previstos"
          % (100 * resultado["cobertura"]["out"], 100 * resultado["cobertura"]["bom"]))

    # os piores casos, para ler um a um
    piores = sorted(vendas, key=lambda v: -abs(v["erro"]))[:25]
    resultado["piores"] = [{"base": v["base"], "id": v["k"][1], "data": v["k"][2], "modelo": v["g"],
                            "fipe": v["fipe"], "previsto": v["prev"], "vendido": v["real"],
                            "erro": v["erro"], "razao": v["razao"],
                            "indicadores": sorted(f for f in v["f"] if not f.startswith(("cor:", "combustível:", "câmbio:")))}
                           for v in piores]
    (AQUI / "outliers.json").write_text(json.dumps(resultado, ensure_ascii=False), "utf-8")
    print("\ngravado outliers.json")


if __name__ == "__main__":
    main()
