"""O EVENTO de cada venda da amostra: tamanho, concorrencia, alcance, calendario.

    python automations/precificacao/preditivo/coleta-evento.py      (precisa de VPN)

Grava `evento.json`: {base: {negociacao_id: {...}}}.

Tudo aqui e fixado ANTES do primeiro lance -- composicao do evento, para quem
ele e aberto, quando abre e fecha. Nada de lance, acesso ou resultado: isso e
o que o modelo preve ou confronta (regra do projeto, 14/10).

    n_evento    negociacoes no evento (quantos carros disputam atencao)
    n_mesmo     carros do MESMO modelo (marca + modelo) no mesmo evento
    n_wl        whitelabels (canais) para os quais o evento e aberto
    n_grupos    grupos de cliente alvejados pelo evento
    dias        duracao da oferta, de start_date_offer a finish_date_event
    dia_semana  0 = segunda ... 6 = domingo, do fechamento
    hora        hora do fechamento (horario de Brasilia, como esta no banco)
"""
import json
import sys
from collections import defaultdict
from pathlib import Path

AQUI = Path(__file__).resolve().parent
ESTUDO = AQUI.parent
sys.path.insert(0, str(ESTUDO.parent / "bancos"))
from conexao import conectar  # noqa: E402

BASES = {"cars2you": "Cars2You", "dealers": "Dealers"}
MODELO = ("CONCAT(UPPER(TRIM(COALESCE(b.name, '(sem marca)'))), ' ',"
          " UPPER(TRIM(COALESCE(m.name, '(sem modelo)'))))")


def lista(ids):
    return ",".join(str(int(i)) for i in ids)


def main():
    saida = {}
    for arq, base in BASES.items():
        # a amostra do estudo e a ampliada do preditivo (roda-estudo.py --sufixo amplo)
        vendas = []
        for nome in ("analitico-%s.json" % arq, "analitico-amplo-%s.json" % arq):
            if (ESTUDO / nome).exists():
                vendas += json.loads((ESTUDO / nome).read_text("utf-8"))["vendas"]
        negs = sorted({int(float(v["negociacao_id"])) for v in vendas})
        cx = conectar(arq)
        cur = cx.cursor()
        # negociacao -> evento e modelo do carro dela
        cur.execute("SELECT an.id, an.event_id, %s FROM advertisement_negotiations an"
                    " INNER JOIN advertisements a ON a.id = an.advertisement_id"
                    " INNER JOIN vehicles v ON v.id = a.vehicle_id"
                    " LEFT JOIN brands b ON b.id = v.brand_id LEFT JOIN models m ON m.id = v.model_id"
                    " WHERE an.id IN (%s)" % (MODELO, lista(negs)))
        neg = {r[0]: (r[1], r[2]) for r in cur.fetchall()}
        evs = sorted({e for e, _ in neg.values() if e})
        # o evento
        cur.execute("SELECT e.id, e.start_date_offer, e.finish_date_event,"
                    " (SELECT COUNT(*) FROM event_whitelabels w WHERE w.event_id = e.id),"
                    " (SELECT COUNT(*) FROM event_client_groups g WHERE g.event_id = e.id)"
                    " FROM events e WHERE e.id IN (%s)" % lista(evs))
        ev = {r[0]: r[1:] for r in cur.fetchall()}
        # composicao: quantos carros, e quantos de cada modelo, em cada evento
        cur.execute("SELECT an.event_id, %s, COUNT(*) FROM advertisement_negotiations an"
                    " INNER JOIN advertisements a ON a.id = an.advertisement_id"
                    " INNER JOIN vehicles v ON v.id = a.vehicle_id"
                    " LEFT JOIN brands b ON b.id = v.brand_id LEFT JOIN models m ON m.id = v.model_id"
                    " WHERE an.event_id IN (%s) AND an.deleted_at IS NULL"
                    " GROUP BY an.event_id, 2" % (MODELO, lista(evs)))
        tot, mesmo = defaultdict(int), {}
        for e, mod, c in cur.fetchall():
            tot[e] += c
            mesmo[(e, mod)] = c
        cx.close()
        d = {}
        for n, (e, mod) in neg.items():
            if not e or e not in ev:
                continue
            ini, fim, nwl, ngr = ev[e]
            d[str(n)] = {
                "n_evento": tot[e], "n_mesmo": mesmo.get((e, mod), 1), "n_wl": nwl, "n_grupos": ngr,
                "dias": ((fim - ini).total_seconds() / 86400) if ini and fim else None,
                "dia_semana": fim.weekday() if fim else None, "hora": fim.hour if fim else None,
            }
        saida[base] = d
        print("%s: %d negociacoes, %d com evento, %d eventos" % (base, len(negs), len(d), len(evs)))
    (AQUI / "evento.json").write_text(json.dumps(saida), "utf-8")
    print("gravado evento.json")


if __name__ == "__main__":
    main()
