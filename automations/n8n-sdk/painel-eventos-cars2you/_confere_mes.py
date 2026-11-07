# -*- coding: utf-8 -*-
"""Confere um mes da aba Mensal contra o banco, por outro caminho.

    python _confere_mes.py 10        -> o mes de indice 10 (0 = o mais antigo)

O painel recebe o mes JA AGREGADO no SQL (mes_veic, mes_loj). Aqui o mesmo
mes sai das linhas cruas -- uma por negociacao, com os lances e os acessos
dela -- e a conta (negociacao mais recente do veiculo, o funil dos status,
novo, o % acumulado no evento) e feita em Python, sem o SQL do Montar Consultas.
Compara com o calculaMes() da pagina gerada pelo dados-local.json.

Precisa de VPN. Mes fechado tem que bater exato; o corrente anda com o banco.
"""
import json
import subprocess
import sys
from pathlib import Path

AQUI = Path(__file__).resolve().parent
sys.path.insert(0, str(AQUI.parents[1] / "bancos"))
from conexao import conectar  # noqa: E402

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

M = int(sys.argv[1]) if len(sys.argv) > 1 else 10
dados = json.loads((AQUI / "dados-local.json").read_text(encoding="utf-8"))
meta = dados["consultas"][0]["json"]["meta"]
MES = meta["meses"][M]
ANO, MM = int(MES[:4]), int(MES[5:7])
INI = "%s-01 00:00:00" % MES
FIM = "%04d-%02d-01 00:00:00" % (ANO + (MM == 12), 1 if MM == 12 else MM + 1)
AGORA = meta["agora_br"]
WL = "4,7,43,48,62,65"

# a pagina: o calculaMes() que viaja no HTML, rodado pelo node sobre o mesmo dado
js = r"""
const { roda } = require('./_roda_no');
const d = require('./dados-local.json');
const h = require('./_roda_no').roda('montar-painel.js', require('./_roda_no').nosLocais(d))[0].json.html;
const ini = h.indexOf('<script>') + 8;
const D = JSON.parse(h.slice(h.lastIndexOf('APP(') + 4, h.lastIndexOf(',{"claro"')));
const cm = new Function(h.slice(ini, h.indexOf('function APP(', ini)) + ' return calculaMes;')();
process.stdout.write(JSON.stringify(cm(D, { mes: String(%d) }).kpi));
""" % M
pag = json.loads(subprocess.run(["node", "-e", js], cwd=AQUI, capture_output=True, text=True,
                                encoding="utf-8", check=True).stdout)

cx = conectar("cars2you")


def um(sql):
    c = cx.cursor()
    c.execute(sql)
    r = c.fetchall()
    c.close()
    return r


EV = ("SELECT e.id FROM events e WHERE e.deleted_at IS NULL AND e.start_date_offer < '%s' AND e.finish_date_event >= '%s'"
      " AND e.start_date_offer <= '%s' AND DATEDIFF(e.finish_date_event, e.start_date_offer) <= 31"
      " AND EXISTS (SELECT 1 FROM event_whitelabels ew WHERE ew.event_id = e.id AND ew.whitelabel_id IN (%s))") % (FIM, INI, AGORA, WL)
evs = [r[0] for r in um(EV)]
lista = ",".join(map(str, evs))
negs = um("SELECT an.id, a.vehicle_id, an.status, NULLIF(an.min_sale_price, 0), e.finish_date_event, an.offer_actual_id"
          " FROM advertisement_negotiations an JOIN advertisements a ON a.id = an.advertisement_id"
          " JOIN events e ON e.id = an.event_id WHERE an.deleted_at IS NULL AND an.event_id IN (%s)" % lista)
ids = ",".join(str(n[0]) for n in negs)
lances = um("SELECT o.advs_negotiation_id, o.price, o.created_at, o.buyer_shop_id FROM offers o"
            " WHERE o.deleted_at IS NULL AND o.buyer_shop_id IS NOT NULL AND o.advs_negotiation_id IN (%s)" % ids)
# acesso a qualquer tempo na negociacao (acumulado no evento, 06/11)
acessos = um("SELECT DISTINCT an.id FROM advertisement_negotiations an"
             " JOIN access_logs al ON al.advertisement_id = an.advertisement_id AND al.event_id = an.event_id"
             " AND al.shop_id IS NOT NULL"
             " WHERE an.deleted_at IS NULL AND an.event_id IN (%s)" % lista)
veics = sorted({n[1] for n in negs})
antes = {r[0] for r in um("SELECT DISTINCT a.vehicle_id FROM advertisements a JOIN advertisement_negotiations an"
                          " ON an.advertisement_id = a.id AND an.deleted_at IS NULL JOIN events e ON e.id = an.event_id"
                          " AND e.deleted_at IS NULL WHERE e.start_date_offer < '%s' AND a.vehicle_id IN (%s)" %
                          (INI, ",".join(map(str, veics))))}
cx.close()

maior, tem_lance = {}, set()
for nid, preco, quando, loja in lances:
    # lance sem preco existe (fev/26): o MAX do SQL ignora, aqui tambem;
    # mas ele conta como lance
    if preco is not None:
        maior[nid] = max(maior.get(nid, -1), preco)
    tem_lance.add(nid)
ac = {r[0] for r in acessos}
ultima, por_v = {}, {}
for n in negs:
    por_v.setdefault(n[1], []).append(n)
    if n[1] not in ultima or (n[4], n[0]) > (ultima[n[1]][4], ultima[n[1]][0]):
        ultima[n[1]] = n
c = {"veiculos": len(ultima), "novos": 0, "acesso": 0, "oferta": 0, "venda": 0,
     "sem_oferta": 0, "com_oferta": 0, "vmv": 0, "vendidos": 0, "removidos": 0}
# o funil (06/11), na negociacao mais recente do mes: com oferta = teve lance
# ou vendeu; VMV = maior lance >= VMV ou vendeu; o % do grafico e o mesmo
for v, n in ultima.items():
    c["novos"] += v not in antes
    st, vmv, mx = n[2], n[3], maior.get(n[0])
    vendeu = st in (2, 3, 7)
    co = vendeu or n[0] in tem_lance
    c["acesso"] += n[0] in ac
    c["oferta"] += co
    c["venda"] += vendeu
    c["vendidos"] += vendeu
    c["removidos"] += st in (8, 10)
    c["com_oferta"] += co
    c["sem_oferta"] += not co
    c["vmv"] += vendeu or (mx is not None and vmv is not None and mx >= vmv)

fechado = M < len(meta["meses"]) - 1
print("%s (%s): %d eventos, %d negociacoes" % (MES, "fechado: tem que bater exato" if fechado else "corrente: anda com o banco",
                                              len(evs), len(negs)))
falhas = 0
for k, v in c.items():
    ok = pag[k] == v
    falhas += 0 if ok else 1
    print("  %s %-11s painel=%-6s banco=%s" % ("✓" if ok else ("✗" if fechado else "≈"), k, pag[k], v))
ok = pag["eventos"] == len(evs)
falhas += 0 if ok else 1
print("  %s %-11s painel=%-6s banco=%s" % ("✓" if ok else "✗", "eventos", pag["eventos"], len(evs)))
if fechado and falhas:
    print("✗ %d divergencia(s)" % falhas)
    sys.exit(1)
print("✓ o mes bate com o banco" if not falhas else "≈ diferencas no mes corrente (o banco andou)")
