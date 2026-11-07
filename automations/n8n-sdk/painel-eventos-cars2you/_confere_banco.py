# -*- coding: utf-8 -*-
"""Confere os numeros do painel contra SQL ESCRITO DE NOVO, direto no banco.

    python _confere_banco.py [dia]        (dia = indice 0..30; padrao 22)

A prova-local.js confere o painel contra ele mesmo (o cru das consultas). Esta
confere contra o banco por outro caminho: SQL de contagem distinta, sem
mascara de dias e sem o calcula(). Se os dois concordam, a mascara, o indice
e o recorte estao certos.

Usa o recorte da coleta (as datas gravadas em dados-local.json), entao o dia
fechado tem que bater EXATO. O que e de hoje (cartoes) anda enquanto o banco
recebe lance, e sai com a diferenca, sem reprovar por ela.

Precisa de VPN.
"""
import json
import subprocess
import sys
from datetime import date, timedelta
from pathlib import Path

AQUI = Path(__file__).resolve().parent
sys.path.insert(0, str(AQUI.parents[1] / "bancos"))
from conexao import conectar  # noqa: E402

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

DIA = int(sys.argv[1]) if len(sys.argv) > 1 else 22

JS = r"""
const fs = require('fs');
const { roda } = require('./_roda_no');
const d = JSON.parse(fs.readFileSync('dados-local.json', 'utf8'));
const html = require('./_roda_no').roda('montar-painel.js', require('./_roda_no').nosLocais(d))[0].json.html;
const ini = html.indexOf('<script>') + 8;
const fimFn = html.indexOf('function APP(', ini);
const chamada = html.lastIndexOf('APP(');
const src = html.slice(ini, fimFn);
const D = JSON.parse(html.slice(chamada + 4, html.lastIndexOf(',{"claro"')));
const calcula = new Function(src + ' return calcula;')();
const dia = Number(process.argv[process.argv.length - 1]);
const todo = calcula(D, {});
const so = calcula(D, { de: String(dia), ate: String(dia) });
process.stdout.write(JSON.stringify({ meta: d.consultas[0].json.meta, kpi: todo.kpi, dia: todo.dias[dia], loj_dia: todo.lojistas[dia],
  tot: todo.tot_lojistas, so_dia: { veiculos: so.veiculos_periodo, tot: so.tot_lojistas, kpi: so.kpi } }));
"""
saida = subprocess.run(["node", "-e", JS, str(DIA)], cwd=AQUI, capture_output=True, text=True,
                       encoding="utf-8", check=True)
P = json.loads(saida.stdout)
M = P["meta"]
PISO, PISO_DIA, AGORA = M["piso"], M["piso_dia"], M["agora_br"]
WLS = ",".join(str(w) for w in M["wls"])
D = (date.fromisoformat(PISO_DIA) + timedelta(days=DIA)).isoformat()
HOJE = AGORA[:10]

REC = ("e.deleted_at IS NULL AND e.finish_date_event >= '%s' AND e.start_date_offer <= '%s'"
       " AND EXISTS (SELECT 1 FROM event_whitelabels ew WHERE ew.event_id = e.id AND ew.whitelabel_id IN (%s))"
       % (PISO, AGORA, WLS))
NEG = ("FROM events e JOIN advertisement_negotiations an ON an.event_id = e.id AND an.deleted_at IS NULL"
       " JOIN advertisements a ON a.id = an.advertisement_id WHERE " + REC)
ATIVO_EM = lambda d: " AND DATE(e.start_date_offer) <= '%s' AND DATE(e.finish_date_event) >= '%s'" % (d, d)

cx = conectar("cars2you")
def um(sql):
    cur = cx.cursor()
    cur.execute(sql)
    r = cur.fetchall()
    cur.close()
    return r

VEIC_DIA = "SELECT DISTINCT a.vehicle_id " + NEG + ATIVO_EM(D)
sql = {
    "ativos": "SELECT COUNT(*) FROM (%s) x" % VEIC_DIA,
    "novos": ("SELECT COUNT(*) FROM (%s) x WHERE (SELECT DATE(MIN(e2.start_date_offer)) FROM advertisements a2"
              " JOIN advertisement_negotiations an2 ON an2.advertisement_id = a2.id AND an2.deleted_at IS NULL"
              " JOIN events e2 ON e2.id = an2.event_id AND e2.deleted_at IS NULL WHERE a2.vehicle_id = x.vehicle_id) = '%s'"
              % (VEIC_DIA, D)),
    "logaram": ("SELECT COUNT(DISTINCT al.shop_id) FROM access_logs al WHERE al.whitelabel_id IN (%s)"
                " AND al.shop_id IS NOT NULL AND al.created_at >= '%s' AND al.created_at < '%s' + INTERVAL 1 DAY" % (WLS, D, D)),
    "acessaram": ("SELECT COUNT(DISTINCT al.shop_id) " + NEG.replace("WHERE ", "JOIN access_logs al ON al.advertisement_id = an.advertisement_id"
                  " AND al.event_id = e.id AND al.shop_id IS NOT NULL WHERE ", 1) +
                  " AND al.created_at >= '%s' AND al.created_at < '%s' + INTERVAL 1 DAY" % (D, D)),
    "ofertaram": ("SELECT COUNT(DISTINCT o.buyer_shop_id) " + NEG.replace("WHERE ", "JOIN offers o ON o.advs_negotiation_id = an.id"
                  " AND o.deleted_at IS NULL AND o.buyer_shop_id IS NOT NULL WHERE ", 1) + " AND DATE(o.created_at) = '%s'" % D),
    "compraram": ("SELECT COUNT(DISTINCT o.buyer_shop_id) " + NEG.replace("WHERE ", "JOIN offers o ON o.id = an.offer_actual_id WHERE ", 1) +
                  " AND an.status IN (2,3,7) AND DATE(o.created_at) = '%s'" % D),
    "ofertaram_periodo": ("SELECT COUNT(DISTINCT o.buyer_shop_id) " + NEG.replace("WHERE ", "JOIN offers o ON o.advs_negotiation_id = an.id"
                          " AND o.deleted_at IS NULL AND o.buyer_shop_id IS NOT NULL WHERE ", 1) + " AND o.created_at >= '%s'" % PISO),
    "compraram_periodo": ("SELECT COUNT(DISTINCT o.buyer_shop_id) " + NEG.replace("WHERE ", "JOIN offers o ON o.id = an.offer_actual_id WHERE ", 1) +
                          " AND an.status IN (2,3,7) AND o.created_at >= '%s'" % PISO),
}
B = {k: um(v)[0][0] for k, v in sql.items()}

# o grafico acumulado no evento (06/11): de cada veiculo ativo no dia, a
# negociacao do evento mais recente ativo nele, e se ela teve acesso, lance ou
# venda ATE o fim do dia (venda conta como lance: o funil dos cartoes)
FIM_D = "'%s' + INTERVAL 1 DAY" % D
acum = {}
for v, fim, nid, ac, of, ve in um(
        "SELECT a.vehicle_id, e.finish_date_event, an.id,"
        " EXISTS (SELECT 1 FROM access_logs al WHERE al.advertisement_id = an.advertisement_id AND al.event_id = e.id"
        " AND al.shop_id IS NOT NULL AND al.created_at >= '" + PISO + "' AND al.created_at < " + FIM_D + "),"
        " EXISTS (SELECT 1 FROM offers o WHERE o.advs_negotiation_id = an.id AND o.deleted_at IS NULL"
        " AND o.buyer_shop_id IS NOT NULL AND o.created_at < " + FIM_D + "),"
        " (an.status IN (2,3,7) AND EXISTS (SELECT 1 FROM offers o WHERE o.id = an.offer_actual_id AND o.created_at < " + FIM_D + "))"
        " " + NEG + ATIVO_EM(D)):
    if v not in acum or (fim, nid) > acum[v][:2]:
        acum[v] = (fim, nid, ac, of or ve, ve)
B["acesso"] = sum(1 for x in acum.values() if x[2])
B["oferta"] = sum(1 for x in acum.values() if x[3])
B["venda"] = sum(1 for x in acum.values() if x[4])

pagina = {
    "ativos": P["dia"]["ativos"], "novos": P["dia"]["novos"], "acesso": P["dia"]["acesso"],
    "oferta": P["dia"]["oferta"], "venda": P["dia"]["venda"],
    "logaram": P["loj_dia"]["logaram"], "acessaram": P["loj_dia"]["acessaram"],
    "ofertaram": P["loj_dia"]["ofertaram"], "compraram": P["loj_dia"]["compraram"],
    "ofertaram_periodo": P["tot"]["ofertaram"], "compraram_periodo": P["tot"]["compraram"],
}
falhas = 0
print("dia %d = %s (fechado: tem que bater exato)" % (DIA, D))
for k in pagina:
    ok = pagina[k] == B[k]
    falhas += 0 if ok else 1
    print("  %s %-18s painel=%-6s banco=%s" % ("✓" if ok else "✗", k, pagina[k], B[k]))
# o "so naquele dia" tem que repetir o dia dentro do periodo inteiro
for k in ("logaram", "acessaram", "ofertaram", "compraram"):
    ok = P["so_dia"]["tot"][k] == P["loj_dia"][k]
    falhas += 0 if ok else 1
    print("  %s De=Ate=dia: %-10s %s = %s" % ("✓" if ok else "✗", k, P["so_dia"]["tot"][k], P["loj_dia"][k]))

# os cartoes de hoje, por outro caminho: as linhas cruas e o "mais recente" em Python
# o funil (06/11): com oferta = teve lance ou vendeu; VMV atingido = maior lance
# >= VMV ou vendeu; vendidos (2,3,7); removidos (8,10) a parte
linhas = um("SELECT a.vehicle_id, e.finish_date_event, an.id, an.status, NULLIF(an.min_sale_price, 0),"
           " (SELECT MAX(o.price) FROM offers o WHERE o.advs_negotiation_id = an.id AND o.deleted_at IS NULL"
           " AND o.buyer_shop_id IS NOT NULL) " + NEG + ATIVO_EM(HOJE))
evs = um("SELECT COUNT(*) FROM events e WHERE " + REC + ATIVO_EM(HOJE))[0][0]
melhor = {}
for v, fim, nid, st, vmv, maior in linhas:
    if v not in melhor or (fim, nid) > melhor[v][:2]:
        melhor[v] = (fim, nid, st, vmv, maior)
hoje = {"eventos": evs, "veiculos": len(melhor), "com_oferta": 0, "vmv": 0, "vendidos": 0, "removidos": 0}
for fim, nid, st, vmv, maior in melhor.values():
    vendeu = st in (2, 3, 7)
    hoje["vendidos"] += vendeu
    hoje["removidos"] += st in (8, 10)
    hoje["com_oferta"] += vendeu or maior is not None
    hoje["vmv"] += vendeu or (maior is not None and vmv is not None and maior >= vmv)
print("hoje = %s (anda com o banco: diferenca e informativa)" % HOJE)
for k, v in hoje.items():
    print("  %s %-10s painel=%-6s banco agora=%s" % ("✓" if P["kpi"][k] == v else "≈", k, P["kpi"][k], v))
cx.close()
print("✗ %d divergencia(s) no dia fechado" % falhas if falhas else "✓ dia fechado e periodo batem com o banco")
sys.exit(1 if falhas else 0)
