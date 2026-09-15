# -*- coding: utf-8 -*-
"""Os cinco campos novos no Montar HTML: ingestao, cluster e tela.

A fase 2 ja traz os dados; aqui eles viram numero e pixel.

ONDE CADA COISA MORA, e por que:

  - `clusterDe()` fica FORA dos marcadores RENDER de proposito: ela produz
    DADOS, nao desenha. O `monta_html_de_dados.js` regenera a tela a partir
    do dados-*.json, que ja tem o cluster resolvido em id E nome -- entao a
    tela so exibe. (A regra oposta tambem vale: `descreveRecorte()` nasceu
    fora do RENDER em 10/09 e quebrou a regeneracao. O criterio e: quem le
    `dados` fica fora, quem le `D` fica dentro.)

  - a regra das sete faixas e JS e nao SQL para ser testavel pelo
    prova-local.js sem tocar no banco, e para mudar faixa sem rodar o
    workflow de nove minutos.

A FAIXA 2 USA A JANELA DO PROPRIO RELATORIO, nao "180 dias". Medido na sonda
50347: com `INTERVAL 180 DAY` contra uma base de 6 meses de calendario (184
dias nesta janela), 16 lojas cairam em Prata/Recuperacao por causa dos 4 dias
de diferenca. Nao eram excecao real, eram artefato de unidade. Usando a mesma
data dos dois lados o artefato some.

GUARDA NOVA: os seis baldes de laudo tem que somar as ofertas da loja. Se nao
somarem, e porque algum veiculo tem mais de um laudo e as ofertas dele foram
contadas em duplicata pela juncao -- exatamente a familia de erro que ja
mordeu duas vezes neste projeto (fan-out silencioso). Vira falha declarada na
tela, nao arredondamento escondido.

    python _html_cinco_campos.py
"""
import io
import os
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

AQUI = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(AQUI, "montar-html.js")
s = io.open(P, encoding="utf-8").read()
orig = s


def troca(velho, novo, rot):
    global s
    if s.count(velho) != 1:
        raise SystemExit("ANCORA AMBIGUA OU AUSENTE (%d): %s" % (s.count(velho), rot))
    s = s.replace(velho, novo, 1)
    print("  ok  " + rot)


# ── 1. cluster + ingestao, antes do perfil das lojas ─────────────────────
troca(
"""/* ── perfil das lojas ───────────────────────────────────────────── */
const iOf = indexa(dados.q_ofertas || [], 'shop_id');
const iPe = indexa(dados.q_perfil || [], 'shop_id');""",
"""/* ── as sete faixas de recencia ──────────────────────────────────────────
   Regra do Thomas (2026-09-11), com "ofertou" no lugar de "comprou". Em
   cascata: a primeira que bate ganha, entao a ORDEM e a regra.

   A faixa 2 usa a janela do proprio relatorio em vez de "180 dias". Medido
   na sonda 50347: com INTERVAL 180 DAY contra uma base de 6 meses de
   calendario (184 dias), 16 lojas cairam em Prata/Recuperacao so pelos 4
   dias de diferenca -- artefato de unidade, nao segmento real.

   🚨 Nesta base o cluster e DEGENERADO e isso nao e defeito da regra: a base
   *e* "lojas que ofertaram nos ultimos 6 meses", entao nenhuma pode cair em
   "nunca ofertou" e 98,8% fica em Diamante ou Ouro. Medido antes de
   implementar; entra assim por decisao do Thomas. Os sete so tem para onde
   variar sobre o universo inteiro de lojas.

   ⚠️ "Nunca acessou" e uma promessa que o dado NAO sustenta: `access_logs`
   comeca em 2025-08-31. O que existe e "nao acessou nos ultimos 12 meses", e
   o glossario diz isso com todas as letras. Ja "nunca ofertou" e verificavel
   de verdade -- `offers` alcanca 2020-06-24. */
const CLUSTERS = {
  1: { nome: 'Cliente Diamante', desc: 'Top — ofertou nos últimos 30 dias' },
  2: { nome: 'Cliente Ouro', desc: 'Ativo recente — ofertou na janela de 6 meses' },
  3: { nome: 'Cliente Prata', desc: 'Risco de churn — já ofertou e acessou nos últimos 90 dias' },
  4: { nome: 'Cliente Recuperação', desc: 'Ex-ofertante — já ofertou mas não acessou nos últimos 90 dias' },
  5: { nome: 'Lead Quente', desc: 'Engajado sem oferta — acessou nos últimos 90 dias, nunca ofertou' },
  6: { nome: 'Lead Morno', desc: 'Inativo — não acessou nos últimos 90 dias e nunca ofertou' },
  7: { nome: 'Lead Frio', desc: 'Nunca engajado — sem acesso registrado e nunca ofertou' }
};

/* O banco grava data de evento em hora de Brasilia mas responde NOW() em
   UTC (ver dominios.md). META.agora_br ja e o relogio de Brasilia calculado
   no no, entao comparar contra ele mantem os dois lados no mesmo fuso. */
function instante(x) {
  if (!x) return null;
  const t = Date.parse(String(x).indexOf('T') > 0 ? String(x)
    : String(x).split(' ').join('T') + 'Z');
  return isNaN(t) ? null : t;
}
const AGORA_MS = instante(META.agora_br) || Date.now();
const INI_MS = instante(META.data_ini);
const DIA = 86400000;

function clusterDe(ultOferta, ultAcesso) {
  const o = instante(ultOferta);
  const a = instante(ultAcesso);
  if (o !== null && o >= AGORA_MS - 30 * DIA) return 1;
  if (o !== null && INI_MS !== null && o >= INI_MS) return 2;
  if (o !== null && a !== null && a >= AGORA_MS - 90 * DIA) return 3;
  if (o !== null) return 4;
  if (a !== null && a >= AGORA_MS - 90 * DIA) return 5;
  if (a !== null) return 6;
  return 7;
}

/* ── perfil das lojas ───────────────────────────────────────────── */
const iOf = indexa(dados.q_ofertas || [], 'shop_id');
const iPe = indexa(dados.q_perfil || [], 'shop_id');
const iUl = indexa(dados.q_uf_laudo || [], 'shop_id');
const iCt = indexa(dados.q_contato || [], 'shop_id');
const iCl = indexa(dados.q_cluster || [], 'shop_id');

/* Os seis baldes de laudo tem que somar as ofertas da loja. Nao somando, a
   juncao com vehicle_precautionary_reports duplicou ofertas (veiculo com
   mais de um laudo) -- fan-out silencioso, a familia de erro que ja mordeu
   duas vezes aqui. Conta-se para declarar na tela, nao para arredondar. */
let laudoDesencontro = 0;
(dados.q_uf_laudo || []).forEach((r) => {
  const soma = num(r.laudo_ausente) + num(r.laudo_aprovado) + num(r.laudo_apontamento) +
    num(r.laudo_reprovado) + num(r.laudo_nao_informado) + num(r.laudo_vazio);
  if (soma !== num(r.ofertas_base)) laudoDesencontro++;
});""",
    "CLUSTERS, clusterDe() e a ingestao das tres consultas novas")

# ── 2. os campos no objeto de loja ───────────────────────────────────────
troca(
"""  const qtVeiculos = num(pe.qt_veiculos);
  return {
    loja_id: num(s.shop_id), loja: s.loja,""",
"""  const qtVeiculos = num(pe.qt_veiculos);

  /* os cinco campos de 11/09 */
  const ul = iUl[k] || {};
  const ct = iCt[k] || {};
  const cl = iCl[k] || {};
  const base = num(ul.ofertas_base);
  const fatia = (n) => (base ? Math.round((num(n) / base) * 1000) / 10 : null);
  const cid = clusterDe(cl.ult_oferta, cl.ult_acesso);

  return {
    loja_id: num(s.shop_id), loja: s.loja,""",
    "campos novos calculados por loja")

troca(
"""    confianca: Math.min(1, (qtVeiculos || 0) / CONFIANCA_MIN),
    amostra_baixa: (qtVeiculos || 0) < CONFIANCA_MIN
  };
}).filter((l) => l.qt_veiculos);""",
"""    confianca: Math.min(1, (qtVeiculos || 0) / CONFIANCA_MIN),
    amostra_baixa: (qtVeiculos || 0) < CONFIANCA_MIN,

    /* 1. desagio medio contra a FIPE do anuncio, ja com o corte de outlier
       aplicado no SQL. `desagio_n` diz sobre quantos veiculos a media foi
       feita -- media de 3 carros e media de 300 nao valem a mesma coisa. */
    desagio: num(pe.desagio_medio),
    desagio_n: num(pe.desagio_n),
    /* 2. quanto a loja oferta dentro da propria praca */
    pct_mesma_uf: fatia(ul.ofertas_mesma_uf),
    /* 3. laudo: seis categorias, e `ausente` nao e `nao_informado` */
    laudo: base ? {
      ausente: fatia(ul.laudo_ausente),
      aprovado: fatia(ul.laudo_aprovado),
      apontamento: fatia(ul.laudo_apontamento),
      reprovado: fatia(ul.laudo_reprovado),
      nao_informado: fatia(ul.laudo_nao_informado),
      vazio: fatia(ul.laudo_vazio)
    } : null,
    /* 4. contato. PII: isto sai no HTML e o HTML sobe pro SharePoint. */
    email: ct.email || null,
    qt_emails: num(ct.qt_emails),
    tel_comercial: ct.tel_comercial || null,
    whatsapp: ct.whatsapp || null,
    tel_privativo: ct.tel_privativo || null,
    /* 5. faixa de recencia, id e nome resolvidos aqui para a tela so exibir */
    cluster: cid,
    cluster_nome: CLUSTERS[cid].nome,
    ult_oferta: cl.ult_oferta || null,
    ult_acesso: cl.ult_acesso || null
  };
}).filter((l) => l.qt_veiculos);""",
    "os cinco campos no objeto de loja")

# ── 3. publicar no array final ───────────────────────────────────────────
troca(
"""    pct_categoria: Math.round(l.pct_categoria * 1000) / 10,
    amostra_baixa: l.amostra_baixa
  });""",
"""    pct_categoria: Math.round(l.pct_categoria * 1000) / 10,
    amostra_baixa: l.amostra_baixa,
    desagio: l.desagio, desagio_n: l.desagio_n,
    pct_mesma_uf: l.pct_mesma_uf,
    laudo: l.laudo,
    email: l.email, qt_emails: l.qt_emails,
    tel_comercial: l.tel_comercial, whatsapp: l.whatsapp,
    tel_privativo: l.tel_privativo,
    cluster: l.cluster, cluster_nome: l.cluster_nome,
    ult_oferta: l.ult_oferta, ult_acesso: l.ult_acesso
  });""",
    "campos publicados no array de lojas")

tmp = P + ".tmp"
with io.open(tmp, "w", encoding="utf-8") as f:
    f.write(s)
os.replace(tmp, P)

print("montar-html.js: %d -> %d chars" % (len(orig), len(s)))
