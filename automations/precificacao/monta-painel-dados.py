"""Une Cars2You + Dealers numa base so e calcula as duas analises do painel.

  python monta-painel-dados.py [saida.json]

Sai `painel-dados.json`, consumido por `monta-painel.js`.

── A UNIAO ──────────────────────────────────────────────────────────────────
Campo `base` separa as duas. As duas rodam a MESMA plataforma -- conferido em
17/09 contra os dois bancos ao vivo: 193 tabelas cada, identicas exceto por uma
(`base_cars2you` x `base_dealersclub`). E os dois analiticos saem do MESMO
script (`roda-estudo.py --base ...`), com as mesmas definicoes e as MESMAS 41
colunas. Por isso a uniao e legitima.

⚠️ Historico que vale registrar: ate 17/09 a extracao da Cars2You vinha do MCP
e tinha 39 colunas -- faltavam `descricao` e `laudo`. Com a conexao direta as
duas passaram a ter as 41. Enquanto faltava, os sinais de texto da Cars2You
eram medidos por CELULA (modelo x texto), com t aproximado. Agora sao linha a
linha nas duas, com t exato.

── "NAO CONSTA NA BASE" ─────────────────────────────────────────────────────
Quando um sinal ou nivel nao aparece numa base, a saida traz `null` e a tela
escreve "nao consta na base" -- nunca 0 nem "—" sozinho. Zero diria "medi e deu
zero", que e uma afirmacao diferente e mais forte do que "nao existe aqui".

── O CONTROLE E POR (base, modelo) ──────────────────────────────────────────
Nao so por modelo. Um Gol da Cars2You e um da Dealers sao vendidos em operacoes
diferentes; juntar os dois num grupo so faria a diferenca entre as BASES vazar
para dentro do efeito de km, idade e UF.
"""

import json
import re
import sys
from math import sqrt
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
AQUI = Path(__file__).resolve().parent
SAIDA = Path(sys.argv[1]) if len(sys.argv) > 1 else AQUI / "painel-dados.json"

sys.path.insert(0, str(AQUI))
from analisa_sinais_lib import SINAIS, norm  # noqa: E402

BASES = ("Cars2You", "Dealers")
ARQ = {"Cars2You": "analitico-cars2you.json", "Dealers": "analitico-dealers.json"}
N_MIN = 30


def n(x):
    try:
        return float(x)
    except (TypeError, ValueError):
        return 0.0


def faixa_km(km):
    if km in (None, "", "None"):
        return "z sem km"
    k = n(km)
    for lim, rot in ((20000, "a até 20k"), (40000, "b 20 a 40k"), (60000, "c 40 a 60k"),
                     (80000, "d 60 a 80k"), (100000, "e 80 a 100k"),
                     (150000, "f 100 a 150k"), (200000, "g 150 a 200k")):
        if k < lim:
            return rot
    return "h 200k ou mais"


def faixa_idade(ano_modelo, data_venda):
    am = n(ano_modelo)
    if am < 1950:
        return "z sem ano"
    m = re.match(r"(\d{4})", str(data_venda or ""))
    if not m:
        return "z sem ano"
    i = int(m.group(1)) - int(am)
    for lim, rot in ((1, "a 0 a 1 ano"), (2, "b 2 anos"), (3, "c 3 anos"), (4, "d 4 anos"),
                     (5, "e 5 anos"), (6, "f 6 anos"), (7, "g 7 anos"),
                     (9, "h 8 a 9 anos"), (14, "i 10 a 14 anos")):
        if i <= lim:
            return rot
    return "j 15 anos ou mais"


def estat(dentro, fora, campo="res"):
    """Efeito e t de duas amostras (Welch), sobre LINHAS. Exato."""
    nc, ns = len(dentro), len(fora)
    if nc < N_MIN or ns < N_MIN:
        return None
    mc = sum(r[campo] for r in dentro) / nc
    ms = sum(r[campo] for r in fora) / ns
    vc = sum((r[campo] - mc) ** 2 for r in dentro) / (nc - 1)
    vs = sum((r[campo] - ms) ** 2 for r in fora) / (ns - 1)
    ep = sqrt(vc / nc + vs / ns)
    return {"n": nc, "pct": nc / (nc + ns),
            "desagio_com": sum(r["d"] for r in dentro) / nc,
            "desagio_sem": sum(r["d"] for r in fora) / ns,
            "efeito": mc - ms, "t": (mc - ms) / ep if ep > 0 else 0.0}


TEXTOS_LAUDO = AQUI / "laudos" / "textos-vendas"
ROTULO_BASE = {"cars2you": "Cars2You", "dealers": "Dealers"}


def analisa_laudos(linhas, recorte):
    """Aba 3: indicadores lidos do TEXTO do laudo cautelar.

    So entram as vendas sorteadas por `laudos/coleta-textos-vendas.py` cujo PDF
    tinha texto. O grupo de comparacao e o resto DESSAS vendas, e nao a base
    inteira: comparar "laudo diz longarina avariada" contra "nao li o laudo"
    misturaria o efeito da longarina com o efeito de ter sido sorteado.
    O residuo continua sendo contra a media do (base, modelo) da amostra toda.
    """
    if not TEXTOS_LAUDO.exists():
        print("sem textos de laudo -- aba 3 sai vazia")
        return None
    from laudo_sinais import S as SINAIS_LAUDO, ler, faixa_lataria

    url = {}
    p_idx = TEXTOS_LAUDO / "indice.csv"
    if p_idx.exists():
        import csv
        with open(p_idx, encoding="utf-8") as fh:
            for i in csv.DictReader(fh, delimiter=";"):
                url[(ROTULO_BASE[i["base"]], str(i["vehicle_id"]))] = i["url"]

    lidos = {b: 0 for b in BASES}
    legiveis = {b: 0 for b in BASES}
    for r in linhas:
        b = [k for k, v in ROTULO_BASE.items() if v == r["base"]][0]
        p = TEXTOS_LAUDO / b / ("%s.txt" % int(n(r["id"])))
        if not p.exists():
            continue
        lidos[r["base"]] += 1
        ld = ler(p.read_text(encoding="utf-8", errors="replace"))
        if not ld["legivel"]:
            continue
        legiveis[r["base"]] += 1
        r["_ld"] = ld
        r["_flat"] = faixa_lataria(ld["lataria"])
        r["ld"] = {"u": url.get((r["base"], str(int(n(r["id"])))), ""),
                   "t": ld["sinais"], "pl": ld["lataria"]}

    def rec(b):
        return [r for r in recorte(b) if "_ld" in r]

    if not any(legiveis.values()):
        return None

    sinais = []
    for s in SINAIS_LAUDO:
        por = {}
        for b in ("Ambas",) + BASES:
            rs = rec(b)
            dentro = [r for r in rs if s["rotulo"] in r["_ld"]["sinais"]]
            fora = [r for r in rs if s["rotulo"] not in r["_ld"]["sinais"]]
            por[b] = estat(dentro, fora)
        if not por["Ambas"]:
            continue
        sinais.append({"grupo": s["grupo"], "rotulo": s["rotulo"], "rx": s["rx"],
                       "bloqueio": s["bloqueio"], "nota": s["nota"], "por_base": por,
                       "linhas": [i for i, r in enumerate(linhas)
                                  if "_ld" in r and s["rotulo"] in r["_ld"]["sinais"]]})

    # peças de lataria com dano: faixa, como km e idade na aba 1
    lat = {}
    for b in ("Ambas",) + BASES:
        niveis = {}
        for r in rec(b):
            niveis.setdefault(r["_flat"], []).append(r)
        out = []
        for nivel, ss in sorted(niveis.items()):
            res = [x["res"] for x in ss]
            m = sum(res) / len(res)
            var = sum((x - m) ** 2 for x in res) / (len(res) - 1) if len(res) > 1 else 0
            out.append({"nivel": nivel, "n": len(ss),
                        "desagio": sum(x["d"] for x in ss) / len(ss), "efeito": m,
                        "t": m / sqrt(var / len(res)) if var > 0 else 0.0})
        lat[b] = out

    itens = analisa_itens(linhas, rec)

    for r in linhas:
        r.pop("_flat", None)
    ordem = []
    for s in SINAIS_LAUDO:
        if s["grupo"] not in ordem:
            ordem.append(s["grupo"])
    print("laudo: lidos %s · legiveis %s · %d sinais com %d+ vendas"
          % (lidos, legiveis, len(sinais), N_MIN))
    return {"lidos": lidos, "legiveis": legiveis, "sinais": sinais, "lataria": lat,
            "ordem_grupos": ordem, "lido_em": "2026-10-14", "itens": itens}


def confianca(e):
    """Indice de confianca de um efeito: 1 - p (bicaudal, normal) e o IC 95%.

    Faixas iguais as do negrito do painel: alta = passa Bonferroni (|t| >= 3,3),
    media = passa o corte usual (|t| >= 2), baixa = abaixo disso. "Confianca"
    aqui e de que o efeito e REAL e nao acaso da amostra -- nao de que o
    tamanho dele esta certo; para isso serve o intervalo."""
    from math import erfc
    t = e["t"]
    ep = abs(e["efeito"] / t) if t else 0.0
    e["conf"] = 1 - erfc(abs(t) / sqrt(2))
    e["nivel"] = "alta" if abs(t) >= 3.3 else "média" if abs(t) >= 2 else "baixa"
    e["ic"] = [e["efeito"] - 1.96 * ep, e["efeito"] + 1.96 * ep]
    return e


def analisa_itens(linhas, rec):
    """Aba "Laudo item a item": cada item do laudo em PDF, em tres estados.

    Mesma conta da aba do laudo: o estado contra as OUTRAS vendas de laudo lido,
    residuo do (base, modelo). Estado com menos de N_MIN vendas sai como
    "poucos casos" -- com o n, para ninguem achar que nao existe."""
    from laudo_itens import ITENS, ESTADOS, ler as ler_itens
    idx = {id(r): i for i, r in enumerate(linhas)}
    for r in linhas:
        if "_ld" in r:
            b = [k for k, v in ROTULO_BASE.items() if v == r["base"]][0]
            p = TEXTOS_LAUDO / b / ("%s.txt" % int(n(r["id"])))
            it = ler_itens(p.read_text(encoding="utf-8", errors="replace")) or {}
            r["_it"] = it
            # so o trecho de ausente/danificado vai para a pagina: e o que se
            # quer conferir, e o de "presente" dobraria o peso do arquivo
            r["ld"]["it"] = {k: [est, t[:90] if est != "presente" else ""] for k, (est, t) in it.items()}
    out = []
    for nome, *_ in ITENS:
        estados = {}
        for est in ESTADOS:
            por = {}
            for b in ("Ambas",) + BASES:
                rs = rec(b)
                dentro = [r for r in rs if r["_it"].get(nome, ("",))[0] == est]
                fora = [r for r in rs if r["_it"].get(nome, ("",))[0] != est]
                e = estat(dentro, fora)
                por[b] = confianca(e) if e else ({"n": len(dentro), "poucos": True} if dentro else None)
            todos = rec("Ambas")
            estados[est] = {"por_base": por,
                            "linhas": [idx[id(r)] for r in todos if r["_it"].get(nome, ("",))[0] == est]}
        out.append({"item": nome, "estados": estados})
    for r in linhas:
        r.pop("_it", None)
    return out


def main():
    linhas = []
    for b in BASES:
        p = AQUI / ARQ[b]
        if not p.exists():
            raise SystemExit("falta %s — rode: python roda-estudo.py --base %s"
                             % (p.name, b.lower()))
        for r in json.loads(p.read_text(encoding="utf-8"))["vendas"]:
            f, v = n(r.get("valor_fipe_anuncio")), n(r.get("venda"))
            if f <= 0 or v <= 0:
                continue
            linhas.append({
                "base": b, "id": r.get("veiculo_id"), "g": r.get("grupo"),
                "v": r.get("versao") or "", "a": r.get("ano_modelo") or "",
                "k": None if r.get("km") in (None, "", "None") else int(n(r.get("km"))),
                "uf": (r.get("patio_uf") or "").strip().upper() or "z sem UF",
                "l": r.get("loja") or "", "f": f, "p": v, "d": 1 - v / f,
                "laudo": (r.get("laudo") or "").strip() or "z sem laudo",
                "txt": re.sub(r"[ \t]{2,}", " ",
                              re.sub(r"<[^>]*>", " ", str(r.get("descricao") or ""))).strip(),
                "_fkm": faixa_km(r.get("km")),
                "_fid": faixa_idade(r.get("ano_modelo"), r.get("data_venda")),
                "_n": norm(r.get("descricao")),
            })

    soma, cont = {}, {}
    for r in linhas:
        k = (r["base"], r["g"])
        soma[k] = soma.get(k, 0) + r["d"]
        cont[k] = cont.get(k, 0) + 1
    for r in linhas:
        k = (r["base"], r["g"])
        r["res"] = r["d"] - soma[k] / cont[k]

    def recorte(b):
        return linhas if b == "Ambas" else [r for r in linhas if r["base"] == b]

    por_base = {}
    for b in ("Ambas",) + BASES:
        rs = recorte(b)
        por_base[b] = {"n": len(rs), "desagio": sum(x["d"] for x in rs) / len(rs)}
    print("Cars2You %d · Dealers %d · total %d"
          % (por_base["Cars2You"]["n"], por_base["Dealers"]["n"], len(linhas)))

    # ── análise 1: campos do sistema ─────────────────────────────────────
    DIMS = [("km", "Quilometragem", "_fkm"),
            ("idade", "Idade do veículo", "_fid"),
            ("uf", "UF do pátio", "uf"),
            ("laudo", "Laudo cautelar", "laudo")]

    def tabela(rs, campo):
        niveis = {}
        for r in rs:
            niveis.setdefault(r[campo], []).append(r)
        out = []
        for nivel, ss in sorted(niveis.items()):
            res = [x["res"] for x in ss]
            m = sum(res) / len(res)
            if len(res) > 1:
                var = sum((x - m) ** 2 for x in res) / (len(res) - 1)
                t = m / sqrt(var / len(res)) if var > 0 else 0.0
            else:
                t = 0.0
            out.append({"nivel": nivel, "n": len(ss),
                        "desagio": sum(x["d"] for x in ss) / len(ss),
                        "efeito": m, "t": t})
        return out

    campos = [{"chave": c, "titulo": tt,
               "por_base": {b: tabela(recorte(b), campo) for b in ("Ambas",) + BASES}}
              for c, tt, campo in DIMS]

    # ── análise 2: observações, agora nas DUAS bases, linha a linha ──────
    idx = {id(r): i for i, r in enumerate(linhas)}
    sinais = []
    for s in SINAIS:
        rx = re.compile(s["rx"])
        bl = re.compile(s["bloqueio"]) if s["bloqueio"] else None
        casa = [r for r in linhas
                if rx.search(r["_n"]) and not (bl and bl.search(r["_n"]))]
        if len(casa) < N_MIN:
            continue
        marca = set(id(r) for r in casa)
        por = {}
        for b in ("Ambas",) + BASES:
            rs = recorte(b)
            dentro = [r for r in rs if id(r) in marca]
            fora = [r for r in rs if id(r) not in marca]
            # None = "nao consta na base". Zero diria "medi e deu zero".
            por[b] = estat(dentro, fora)
        if not por["Ambas"]:
            continue
        sinais.append({
            "grupo": s["grupo"], "rotulo": s["rotulo"], "rx": s["rx"],
            "bloqueio": s["bloqueio"], "nota": s["nota"], "destaque": s["destaque"],
            "por_base": por,
            "linhas": [idx[id(r)] for r in casa],
        })
    sinais.sort(key=lambda x: -abs(x["por_base"]["Ambas"]["efeito"]))

    # A ordem dos GRUPOS e fixa, e sai da ordem em que foram declarados no
    # dicionario -- que e a ordem que o Thomas definiu em 17/09. Ordenar por
    # efeito, como eu fazia, embaralhava a lista a cada troca de base e a
    # pessoa perdia a referencia de onde estava cada assunto. As LINHAS dentro
    # do grupo continuam do menor para o maior efeito.
    ordem_grupos = []
    for s in SINAIS:
        if s["grupo"] not in ordem_grupos:
            ordem_grupos.append(s["grupo"])
    nas_duas = sum(1 for s in sinais if s["por_base"]["Cars2You"] and s["por_base"]["Dealers"])
    print("%d sinais · %d medidos nas duas bases · %d em só uma"
          % (len(sinais), nas_duas, len(sinais) - nas_duas))

    laudo = analisa_laudos(linhas, recorte)

    for r in linhas:
        for k in ("_n", "_fkm", "_fid", "res", "_ld"):
            r.pop(k, None)

    SAIDA.write_text(json.dumps({
        "gerado_em": "2026-09-17",
        "por_base": por_base, "campos": campos, "sinais": sinais,
        "ordem_grupos": ordem_grupos, "laudo": laudo,
        "linhas": linhas, "corte_t": 3.3, "n_min": N_MIN,
    }, ensure_ascii=False), encoding="utf-8")
    print("gravado %s (%.1f MB)" % (SAIDA.name, SAIDA.stat().st_size / 1048576))


if __name__ == "__main__":
    main()
