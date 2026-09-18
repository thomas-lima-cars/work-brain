"""Efeito no desagio de CADA item e CADA peca da descricao, um a um.

  python analisa-sinais.py [analitico-dealers.json] [sinais-dealers.json]

Substitui a versao por contagem (`analisa-grupos.py`). Aquela dizia "3 pecas
avariadas"; esta diz QUAL peca. O pedido do Thomas em 17/09: detalhar os itens
e as pecas, sem contagem.

── O QUE MUDOU, E POR QUE ───────────────────────────────────────────────────
1. CONTAGEM SAIU. Cada item e cada peca vira um sinal binario proprio, medido
   contra quem nao o tem. "2 itens faltantes" nao diz quais, e eram justamente
   os quais que interessavam.

2. O GRUPO "Detalhamento do texto" SAIU, a pedido. Ele media o tamanho do
   anuncio, nao o veiculo. ⚠️ Mas o achado continua verdadeiro e agora fica sem
   dono: descricao vazia dava +7,3 p.p., o maior efeito da pagina anterior. Sem
   esse grupo, parte desse efeito reaparece diluido nos niveis "sem mencao" dos
   outros sinais. Esta registrado em `resultado-dealers.md`.

3. O ANALITICO ENTRA NA PAGINA. Cada sinal abre as vendas em que ele aparece,
   com o texto original junto.

── COMO O EFEITO E MEDIDO ───────────────────────────────────────────────────
Sempre DENTRO do mesmo modelo: de cada venda se subtrai a media do seu modelo,
e o sinal e comparado entre quem tem e quem nao tem esse residuo. O t e de duas
amostras (Welch), calculado sobre as linhas -- e exato, nao aproximado.
"""

import json
import re
import sys
import unicodedata
from math import sqrt
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
AQUI = Path(__file__).resolve().parent
ENTRADA = Path(sys.argv[1]) if len(sys.argv) > 1 else AQUI / "analitico-dealers.json"
SAIDA = Path(sys.argv[2]) if len(sys.argv) > 2 else AQUI / "sinais-dealers.json"

N_MIN = 30  # abaixo disso o sinal nao entra: t vira ruido


def norm(t):
    t = unicodedata.normalize("NFD", str(t or "").lower())
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    t = re.sub(r"<[^>]*>", " ", t)
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9]+", " ", t)).strip()


DANO = (r"(avari\w*|amassad\w*|quebrad\w*|danificad\w*|risc\w*|arranh\w*"
        r"|trincad\w*|rachad\w*|faltando|torcid\w*|amolgad\w*)")

# (rotulo, termo no texto) — a peca casa quando aparece perto de palavra de dano
PECAS = [
    ("Para-choque", "para choque"), ("Capô", "capo"), ("Porta", "porta"),
    ("Paralama", "paralama"), ("Para-brisa", "para brisa"), ("Pintura", "pintura"),
    ("Retrovisor", "retrovisor"), ("Roda", "roda"), ("Tampa", "tampa"),
    ("Motor (avaria)", "motor"), ("Teto", "teto"), ("Porta-malas", "porta malas"),
    ("Lanterna", "lanterna"), ("Caixa de ar", "caixa de ar"), ("Pneu", "pneu"),
    ("Calota", "calota"), ("Lataria", "lataria"), ("Banco", "banco"),
    ("Painel", "painel"), ("Farol", "farol"), ("Para-brisa (junto)", "parabrisa"),
    ("Coluna", "coluna"), ("Grade", "grade"), ("Para-lama (separado)", "para lama"),
    ("Bateria", "bateria"), ("Faróis", "farois"), ("Câmbio", "cambio"),
    ("Vidro", "vidro"), ("Maçaneta", "macaneta"), ("Estofado", "estofado"),
    ("Friso", "friso"),
]


def rx_peca(termo):
    return (re.escape(termo) + r"[^.;/]{0,40}?" + DANO + r"|" +
            DANO + r"[^.;/]{0,25}?" + re.escape(termo))


SEM_CHAVE = r"\bsem chave\b|nao funciona com chave|nao possui chave"
SEM_ITENS = r"nao possui itens de seguranca"
SEM_ESTEPE = r"\bsem estepe\b"
SEM_MANUAL = r"\bsem manual\b"
MOTOR_RUIM = r"motor nao funciona|motor sem funcionamento|nao funciona o motor|motor nao liga"

# (grupo, rotulo, regex, regex_de_bloqueio)
# O bloqueio existe porque a negacao CONTEM a afirmacao: "nao funciona com
# chave" contem "com chave". Sem ele, 300 vendas entrariam como "tem chave".
SINAIS = []


def add(grupo, rotulo, rx, bloqueio=None, nota=None, destaque=None):
    """`destaque` sao os literais a marcar no texto ORIGINAL da pagina.

    Nao da para reusar `rx` para isso: ela foi escrita para o texto
    normalizado (minusculo, sem acento, sem pontuacao) e nao casaria no
    original. Entao cada sinal declara o que destacar.
    """
    SINAIS.append({"grupo": grupo, "rotulo": rotulo, "rx": rx,
                   "bloqueio": bloqueio, "nota": nota,
                   "destaque": destaque or []})


# Os sete grupos sao os que o Thomas nomeou em 17/09. "Avarias — peça a peça"
# e "Avarias — genérico" eram dois; viraram um so, porque a divisao era minha e
# nao dele: a frase de formulario e so mais uma linha dentro de Avarias.
G_AVARIA = "Avarias (itens avariados, amassados)"
G_PRES = "Itens presentes"
G_FALT = "Itens faltantes"
G_MOTOR = "Veículo funcionando (ou não)"
G_USO = "Tipo de uso"
G_DIVIDA = "Dívidas do veículo (IPVA, multas e etc)"
G_DOC = "Pendências/Irregularidades na documentação"

for rot, termo in PECAS:
    add(G_AVARIA, rot, rx_peca(termo),
        nota="a peça citada a até 40 caracteres de uma palavra de dano",
        destaque=[termo, "avari", "amassad", "quebrad", "danificad", "risc",
                  "arranh", "trincad", "rachad", "torcid", "amolgad"])

add(G_AVARIA, "Arranhões e avarias em geral", r"arranhoes e avarias em geral",
    nota="frase de formulário: está em 75% dos anúncios, então separa pouco",
    destaque=["arranhoes e avarias em geral", "arranhões e avarias em geral"])

for rot, rx, neg, dst in [
        ("Chave", r"\bcom chave\b", SEM_CHAVE, ["com chave"]),
        ("Itens de segurança", r"possui itens de seguranca", SEM_ITENS,
         ["itens de seguranca", "itens de segurança"]),
        ("Estepe", r"\bcom estepe\b", SEM_ESTEPE, ["com estepe"]),
        ("Manual", r"\bcom manual\b", SEM_MANUAL, ["com manual"])]:
    add(G_PRES, rot, rx, neg, destaque=dst)

for rot, rx, dst in [
        ("Chave ausente ou não funciona", SEM_CHAVE,
         ["sem chave", "nao funciona com chave", "não funciona com chave",
          "nao possui chave", "não possui chave"]),
        ("Sem itens de segurança", SEM_ITENS,
         ["nao possui itens de seguranca", "não possui itens de segurança"]),
        ("Sem estepe", SEM_ESTEPE, ["sem estepe"]),
        ("Sem manual", SEM_MANUAL, ["sem manual"])]:
    add(G_FALT, rot, rx, destaque=dst)

add(G_MOTOR, "Motor em funcionamento", r"motor em funcionamento", MOTOR_RUIM,
    destaque=['motor em funcionamento'])
add(G_MOTOR, "Motor não funciona", MOTOR_RUIM,
    destaque=['motor nao funciona', 'motor não funciona', 'motor sem funcionamento', 'nao funciona o motor'])

add(G_USO, "Frota", r"\bfrota\b",
    destaque=["frota"],
    nota=("⚠️ frase-modelo. São exatamente os mesmos 598 veículos cujo texto passa "
          "de 2.500 caracteres — mede o modelo de contrato, não o uso"))

add(G_DIVIDA, "IPVA pago", r"ipva\s*\w*\s*pago",
    destaque=['ipva'])
add(G_DIVIDA, "IPVA por conta do banco", r"ipva[^.]{0,40}por conta do (banco|comitente|vendedor)",
    destaque=['ipva'])
add(G_DIVIDA, "IPVA por conta do comprador", r"ipva[^.]{0,40}por conta do comprador",
    destaque=['ipva'])
add(G_DIVIDA, "Multas citadas", r"\bmultas?\b",
    destaque=['multa'])
add(G_DIVIDA, "Débitos por conta do comprador", r"debitos[^.]{0,60}(comprador|adquirente)",
    destaque=['debitos', 'débitos'])
add(G_DIVIDA, "Licenciamento citado", r"licenciamento",
    destaque=['licenciamento'])

add(G_DOC, "Documento pronto", r"documento pronto|doc pronto",
    r"documento em regularizacao|doc em regularizacao",
    destaque=["documento pronto", "doc pronto", "doc.pronto"])
add(G_DOC, "Documento em regularização", r"documento em regularizacao|doc em regularizacao",
    destaque=['documento em regularizacao', 'documento em regularização'])
add(G_DOC, "Remarcado", r"remarcad",
    destaque=['remarcad'])

# ── REMOVIDOS a pedido em 17/09 ──────────────────────────────────────────
# Ficam comentados, e não apagados, para quem procurar saber que foram
# medidos e retirados de propósito — e com quanto davam:
#
#   Crivo               n=67   +11,9 p.p.  era o maior efeito da lista.
#                              "Crivo" é um procedimento de checagem, não um
#                              estado do veículo.
#   Baixa / sinistrado  n=607   +1,9 p.p.  "baixa" também aparece em contexto
#                              administrativo (baixa de restrição, por
#                              exemplo), então o casamento era ambíguo.
#
# add(G_DOC, "Crivo", r"\bcrivo\b", destaque=['crivo'])
# add(G_DOC, "Baixa / sinistrado", r"\bbaixa\b|sinistrad",
#     destaque=['baixa', 'sinistrad'])


def main():
    D = json.loads(ENTRADA.read_text(encoding="utf-8"))["vendas"]
    linhas = []
    for r in D:
        fipe = float(r["valor_fipe_anuncio"] or 0)
        venda = float(r["venda"] or 0)
        if fipe <= 0:
            continue
        orig = re.sub(r"<[^>]*>", " ", str(r.get("descricao") or ""))
        orig = re.sub(r"[ \t]{2,}", " ", orig).strip()
        linhas.append({
            "id": r["veiculo_id"], "g": r["grupo"], "v": r.get("versao") or "",
            "a": r.get("ano_modelo") or "", "k": r.get("km"),
            "uf": r.get("patio_uf") or "", "l": r.get("loja") or "",
            "f": fipe, "p": venda, "d": 1 - venda / fipe,
            "_n": norm(r.get("descricao")), "txt": orig,
        })

    somaM, nM = {}, {}
    for r in linhas:
        somaM[r["g"]] = somaM.get(r["g"], 0) + r["d"]
        nM[r["g"]] = nM.get(r["g"], 0) + 1
    for r in linhas:
        r["res"] = r["d"] - somaM[r["g"]] / nM[r["g"]]

    N = len(linhas)
    MEDIA = sum(r["d"] for r in linhas) / N
    print("%d vendas · deságio médio %.1f%%" % (N, 100 * MEDIA))

    def media_dp(vals):
        n = len(vals)
        m = sum(vals) / n
        var = sum((x - m) ** 2 for x in vals) / (n - 1) if n > 1 else 0.0
        return m, var, n

    saida_sinais, descartados = [], []
    for s in SINAIS:
        rx = re.compile(s["rx"])
        bl = re.compile(s["bloqueio"]) if s["bloqueio"] else None
        idx = [i for i, r in enumerate(linhas)
               if rx.search(r["_n"]) and not (bl and bl.search(r["_n"]))]
        if len(idx) < N_MIN:
            descartados.append((s["grupo"], s["rotulo"], len(idx)))
            continue
        dentro = set(idx)
        rc = [linhas[i]["res"] for i in idx]
        rs = [r["res"] for i, r in enumerate(linhas) if i not in dentro]
        mc, vc, nc = media_dp(rc)
        ms, vs, ns = media_dp(rs)
        ep = sqrt(vc / nc + vs / ns)
        saida_sinais.append({
            "grupo": s["grupo"], "rotulo": s["rotulo"], "rx": s["rx"],
            "bloqueio": s["bloqueio"], "nota": s["nota"],
            "destaque": s["destaque"],
            "n": nc, "pct": nc / N,
            "desagio_com": sum(linhas[i]["d"] for i in idx) / nc,
            "desagio_sem": sum(linhas[i]["d"] for i in range(N) if i not in dentro) / ns,
            "efeito": mc - ms, "t": (mc - ms) / ep if ep > 0 else 0.0,
            "linhas": idx,
        })

    saida_sinais.sort(key=lambda x: -abs(x["efeito"]))
    TESTES = len(saida_sinais)
    # Bonferroni a 5%: z para alfa/(2*testes)
    corte = 3.0 if TESTES <= 40 else 3.3
    print("%d sinais medidos (n ≥ %d) · %d descartados por amostra pequena"
          % (TESTES, N_MIN, len(descartados)))
    print("Bonferroni para %d testes: |t| ≥ %.1f\n" % (TESTES, corte))

    grupos = {}
    for s in saida_sinais:
        grupos.setdefault(s["grupo"], []).append(s)
    for g, ss in grupos.items():
        print("─" * 78)
        print(g.upper())
        print("  %-32s %6s %7s %9s %9s %8s" % ("sinal", "n", "%base", "c/ sinal", "s/ sinal", "efeito"))
        for s in ss:
            m = " ***" if abs(s["t"]) >= corte else ("  *" if abs(s["t"]) >= 2 else "")
            print("  %-32s %6d %6.1f%% %8.1f%% %8.1f%% %+7.1f pp t=%5.1f%s"
                  % (s["rotulo"], s["n"], 100 * s["pct"], 100 * s["desagio_com"],
                     100 * s["desagio_sem"], 100 * s["efeito"], s["t"], m))
        print()

    if descartados:
        print("descartados (n < %d): %s" % (N_MIN, ", ".join(
            "%s (%d)" % (r, n) for _, r, n in descartados)))

    for r in linhas:
        del r["_n"]
    SAIDA.write_text(json.dumps({
        "base": {"vendas": N, "desagio_medio": MEDIA, "testes": TESTES, "corte_t": corte},
        "sinais": saida_sinais, "linhas": linhas,
    }, ensure_ascii=False), encoding="utf-8")
    print("\ngravado %s (%.1f MB)" % (SAIDA.name, SAIDA.stat().st_size / 1048576))


if __name__ == "__main__":
    main()
