"""Quanto cada venda da amostra foi DISPUTADA: lances e lojas distintas.

    python automations/precificacao/preditivo/coleta-disputa.py

Grava `disputa.json`: {base: {negociacao_id: [lances, lojas_distintas]}}
e `laudos-url.json`: {base: {veiculo_id: url do PDF do laudo}}, so para o link
de download no relatorio.

Por que existe (Thomas, 14/10): venda com pouca oferta nao e preco de mercado
-- com um lance so, o valor para no VMV, que o vendedor definiu. Essas vendas
saem da analise, do treino e do teste, senao o modelo aprende o VMV por tabela
e o confronto modelo x VMV fica circular.

So contagem; nenhum dado de loja sai daqui.
"""
import json
import sys
from pathlib import Path

AQUI = Path(__file__).resolve().parent
ESTUDO = AQUI.parent
sys.path.insert(0, str(ESTUDO.parent / "bancos"))
from conexao import conectar  # noqa: E402

BASES = {"cars2you": "Cars2You", "dealers": "Dealers"}


def main():
    saida, urls = {}, {}
    for arq, base in BASES.items():
        # a amostra do estudo e a ampliada do preditivo (roda-estudo.py --sufixo amplo)
        vendas = []
        for nome in ("analitico-%s.json" % arq, "analitico-amplo-%s.json" % arq):
            if (ESTUDO / nome).exists():
                vendas += json.loads((ESTUDO / nome).read_text("utf-8"))["vendas"]
        negs = sorted({int(float(v["negociacao_id"])) for v in vendas if v.get("negociacao_id")})
        cx = conectar(arq)
        cur = cx.cursor()
        cur.execute(
            "SELECT o.advs_negotiation_id, COUNT(*), COUNT(DISTINCT o.buyer_shop_id)"
            "  FROM offers o"
            " WHERE o.deleted_at IS NULL AND o.advs_negotiation_id IN (%s)"
            " GROUP BY o.advs_negotiation_id" % ",".join(str(n) for n in negs))
        d = {str(r[0]): [int(r[1]), int(r[2])] for r in cur.fetchall()}
        # o PDF do laudo de cada veiculo, para o download na tabela do
        # relatorio. Passa direto para a saida; nunca vira variavel.
        vids = sorted({int(float(v["veiculo_id"])) for v in vendas})
        cur.execute(
            "SELECT vpr.vehicle_id, vpr.file_url FROM vehicle_precautionary_reports vpr"
            " INNER JOIN (SELECT vehicle_id, MAX(id) lid FROM vehicle_precautionary_reports"
            "              WHERE deleted_at IS NULL AND vehicle_id IN (%s) GROUP BY vehicle_id) l"
            "    ON l.lid = vpr.id" % ",".join(str(i) for i in vids))
        urls[base] = {str(r[0]): r[1] for r in cur.fetchall() if r[1]}
        cx.close()
        # negociacao vendida sem nenhuma oferta registrada: 0 lances, 0 lojas
        for n in negs:
            d.setdefault(str(n), [0, 0])
        saida[base] = d
        print("%s: %d negociacoes, %d com oferta" % (base, len(negs), sum(1 for v in d.values() if v[0])))
    (AQUI / "disputa.json").write_text(json.dumps(saida), "utf-8")
    (AQUI / "laudos-url.json").write_text(json.dumps(urls), "utf-8")
    print("gravado disputa.json e laudos-url.json (%s laudos)"
          % {b: len(u) for b, u in urls.items()})


if __name__ == "__main__":
    main()
