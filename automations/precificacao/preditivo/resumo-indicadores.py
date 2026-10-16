"""Gera o trecho "Modelo preditivo" do indicadores.md a partir dos JSONs.

    python automations/precificacao/preditivo/resumo-indicadores.py [--grava]

Sem --grava, imprime. Com --grava, substitui no indicadores.md tudo entre
"## Modelo preditivo de preço" e "## Medições mais antigas". Existe para o
numero nunca ser transcrito a mao: a fonte unica e o resultado do modelo.
"""
import json
import statistics as st
import sys
from pathlib import Path

AQUI = Path(__file__).resolve().parent
RAIZ = AQUI.parents[2]
IND = RAIZ / "context" / "banco-de-dados" / "projetos" / "precificacao" / "indicadores.md"
R = json.loads((AQUI / "resultado-modelo.json").read_text("utf-8"))
O = json.loads((AQUI / "outliers.json").read_text("utf-8"))

br = lambda x, d=0: ("{:,.%df}" % d).format(x).replace(",", "X").replace(".", ",").replace("X", ".")  # noqa: E731
pc = lambda x, d=1: br(100 * x, d) + "%"  # noqa: E731
sg = lambda x: ("+" if x >= 0 else "−") + pc(abs(x))  # noqa: E731
data = R["gerado_em"]
c = R["corte"]
V = R["veiculos"]
erro = lambda v: abs(v["prev"] - v["real"]) / v["real"]  # noqa: E731
MES = {"07": "julho", "08": "agosto", "09": "setembro"}
NOME = {"vendedor": "vendedor", "versao": "versão", "itens": "itens do laudo", "patio": "pátio",
        "acabamento": "acabamento", "num:idade": "idade contínua", "num:fab": "ano de fabricação",
        "num:molicar": "Molicar", "num:fipe_veic": "FIPE do veículo", "num:ev_tamanho": "tamanho do evento",
        "num:ev_alcance": "alcance do evento", "num:ev_calendario": "calendário do evento"}

L = []
L.append("## Modelo preditivo de preço — %s" % data)
L.append("")
L.append("`automations/precificacao/preditivo/modelo-preco.py`. Prevê a razão venda/FIPE;")
L.append("re-treinado mês a mês e cobrado em julho, agosto e setembro de 2026.")
L.append("Erro = (previsto − vendido) ÷ vendido. Trecho gerado por `resumo-indicadores.py`.")
L.append("")
L.append("**Amostra:** os 100 modelos mais vendidos de cada base em 12 meses (`roda-estudo.py")
L.append("--top 100 --sufixo amplo`), mais a amostra do estudo (20 modelos). %d modelos na" % c["n_modelos"]["Cars2You"])
L.append("Cars2You e %d na Dealers." % c["n_modelos"]["Dealers"])
L.append("")
L.append("🔴 **Só vendas disputadas — %d ou mais lojas distintas deram lance** (Thomas, 14/10:" % c["min_lojas"])
L.append("\"o VMV impacta diretamente no valor da venda\"). Medido na Cars2You, % de vendas que")
L.append("fecharam a até 2% do VMV: 1 loja **67%** · 2 lojas **33%** · 3 lojas 10% · 4+ lojas 5 a 6%.")
L.append("Saíram %s; ficam **%s**, das quais **%s** no teste." % (
    " e ".join("%s da %s" % (br(n), b) for b, n in c["descartadas"].items()), br(c["n_vendas"]), br(c["n_teste"])))
L.append("")
L.append("| modelo | erro mediano | ±10% | erro médio R$ | viés |")
L.append("|---|---:|---:|---:|---:|")
for e in R["escada"]:
    t = e["teste"]
    neg = e["degrau"] == R.get("final")
    f = (lambda s: "**%s**" % s) if neg else (lambda s: s)
    L.append("| %s | %s | %s | %s | %s |" % (f(e["degrau"] + " · " + e["rotulo"]), f(pc(t["erro_mediano"])),
                                           f(pc(t["dentro_10"], 0)), f(br(t["mae_reais"])), f(sg(t["vies"]))))
fin = R["escada"][-1]
L.append("")
L.append("Por base (%s): %s. Por mês: %s." % (fin["degrau"], " · ".join(
    "%s %s (%s vendas)" % (b, pc(m["erro_mediano"]), br(m["n"])) for b, m in fin["por_base"].items()),
    ", ".join("%s %s (viés %s)" % (MES[k[5:]], pc(m["erro_mediano"]), sg(m["vies"])) for k, m in fin["por_mes"].items())))
L.append("")
sel = R.get("selecao", [])
if len(sel) > 1:
    L.append("**Blocos do G**, escolhidos em três janelas de validação (jan–fev, mar–abr, mai–jun),")
    L.append("cada um só entra se reduzir o erro médio em mais de 0,05 p.p.: " + ", ".join(
        "%s (%s → %s)" % (NOME.get(h["bloco"], h["bloco"]), pc(sel[i]["erro"], 2), pc(h["erro"], 2))
        for i, h in enumerate(sel[1:])) + ".")
    L.append("Testados e recusados: os demais de `CANDIDATOS` (versão, itens do laudo, pátio, Molicar,")
    L.append("idade contínua, tamanho e alcance do evento...).")
    L.append("")
ad = R.get("antes_depois")
if ad:
    a, d = ad["antes"], ad["depois"]
    L.append("**Antes × depois, nas mesmas %s vendas do teste anterior** (20 modelos): erro mediano" % br(a["n"]))
    L.append("%s → **%s** · ±10%% %s → **%s** · erro médio por carro R$ %s → **R$ %s**. No teste" % (
        pc(a["erro_mediano"]), pc(d["erro_mediano"]), pc(a["dentro_10"]), pc(d["dentro_10"]),
        br(a["mae_reais"]), br(d["mae_reais"])))
    aa = ad["antes_ampliado"]
    L.append("ampliado (%s vendas), o modelo anterior fazia %s, %s e R$ %s." % (
        br(aa["n"]), pc(aa["erro_mediano"]), pc(aa["dentro_10"]), br(aa["mae_reais"])))
    L.append("")
L.append("**Índice de confiança** (chance de ficar a até 10% do previsto; calibrado em maio–junho):")
L.append("")
L.append("| confiança | vendas | anunciado | observado | erro mediano | dentro da faixa provável |")
L.append("|---|---:|---:|---:|---:|---:|")
for r, a_, b_ in (("baixa (< 70%)", 0, .7), ("média (70–80%)", .7, .8), ("alta (≥ 80%)", .8, 2)):
    s = [v for v in V if a_ <= v["conf"] < b_]
    if not s:
        continue
    m = lambda g: sum(map(g, s)) / len(s)  # noqa: E731
    L.append("| %s | %s | %s | %s | %s | %s |" % (r, br(len(s)), pc(m(lambda v: v["conf"]), 0),
             pc(m(lambda v: erro(v) <= .1), 0), pc(st.median(map(erro, s))),
             pc(m(lambda v: v["faixa"][0] <= v["real"] <= v["faixa"][1]), 0)))
L.append("")
L.append("### Ofensores dos outliers — %s" % data)
L.append("")
L.append("`preditivo/outliers.py`. Outlier = previsto mais de 20%% acima do vendido: **%s de %s**" % (
    br(O["caro"]["n"]), br(len(V))))
L.append("(%s). O lado oposto tem %s. Comparação contra as %s bem previstas (erro ≤ 10%%)." % (
    pc(O["caro"]["taxa_geral"]), br(O["barato"]["n"]), br(O["caro"]["n_bom"])))
L.append("")
L.append("| indicador | nos outliers | nas bem previstas | vezes mais comum | vira outlier |")
L.append("|---|---:|---:|---:|---:|")
for t in [t for t in O["caro"]["indicadores"] if t["p"] < 0.001 and (t["lift"] or 0) >= 1.8
          and not t["ind"].startswith(("câmbio", "combustível", "cor", "km: sem km"))][:8]:
    L.append("| %s | %s | %s | %s× | %s |" % (t["ind"], pc(t["pct_out"], 0), pc(t["pct_bom"], 0),
                                           br(t["lift"], 1), pc(t["taxa"], 0)))
L.append("")
L.append("Perfil ofensor (retomado por banco, sem chave/motor, sem km lido, laudo reprovado):")
L.append("**%s** dos outliers, %s dos bem previstos." % (pc(O["cobertura"]["out"], 0), pc(O["cobertura"]["bom"], 0)))
L.append("")
L.append("### Modelo × VMV × venda — %s" % data)
L.append("")
L.append("🔴 **Regra do projeto (Thomas, 14/10): VMV e valor da venda nunca entram no modelo** —")
L.append("ele existe para ser confrontado com os dois. Há trava (`PROIBIDO`) no `modelo-preco.py`.")
L.append("")
cv = [v for v in V if v["vmv"]]
L.append("VMV válido = 20%% a 150%% da FIPE. Teste: **%s vendas disputadas com VMV** (%s). Erro mediano:" % (
    br(len(cv)), ", ".join("%s %s" % (b, br(sum(v["b"] == b for v in cv))) for b in ("Cars2You", "Dealers"))))
perto = lambda s: sum(abs(v["prev"] - v["real"]) < abs(v["vmv"] - v["real"]) for v in s) / len(s)  # noqa: E731
L.append("modelo **%s**, VMV **%s**. O modelo chega mais perto da venda em **%s**." % (
    pc(st.median(map(erro, cv))), pc(st.median(abs(v["vmv"] - v["real"]) / v["real"] for v in cv)), pc(perto(cv), 0)))
L.append("")
L.append("| VMV, comparado ao modelo | vendas | venda ÷ modelo | venda ÷ VMV | modelo mais perto | vendeu abaixo do VMV |")
L.append("|---|---:|---:|---:|---:|---:|")
for rot, a_, b_ in (("mais de 15% abaixo", -9, -.15), ("5% a 15% abaixo", -.15, -.05), ("dentro de ±5%", -.05, .05),
                    ("5% a 15% acima", .05, .15), ("mais de 15% acima", .15, 9)):
    s = [v for v in cv if a_ <= v["vmv"] / v["prev"] - 1 < b_]
    if s:
        L.append("| %s | %s | %s | %s | %s | %s |" % (
            rot, br(len(s)), br(st.median(v["real"] / v["prev"] for v in s), 3),
            br(st.median(v["real"] / v["vmv"] for v in s), 3), pc(perto(s), 0),
            pc(sum(v["real"] < v["vmv"] for v in s) / len(s), 0)))
L.append("")
L.append("⚠️ Com todas as vendas (sem o corte de disputa) a conclusão era outra — VMV 5,7% contra")
L.append("modelo 6,0%, quase empate. Era artefato: sem disputa a venda **é** o VMV.")
L.append("")
texto = "\n".join(L) + "\n"

if "--grava" in sys.argv:
    s = IND.read_text("utf-8")
    a = s.index("## Modelo preditivo de preço")
    b = s.index("## Medições mais antigas")
    IND.write_text(s[:a] + texto + s[b:], "utf-8", newline="\n")
    print("gravado em", IND)
else:
    sys.stdout.reconfigure(encoding="utf-8")
    print(texto)
