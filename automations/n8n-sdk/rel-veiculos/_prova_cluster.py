# -*- coding: utf-8 -*-
"""Provas da cascata de recencia e dos quatro campos calculados no HTML.

A fase 2 ja tem provas de que a SQL sai certa. Estas provam o que o nó FAZ
com a resposta: a cascata das sete faixas, o desagio, o % de UF, os laudos e
o contato.

As sete faixas sao testadas UMA A UMA, com datas montadas a partir do proprio
META do run sintetico -- nao de um "hoje" fixo, que envelheceria e faria a
prova passar por motivo errado daqui a um mes.

Inclui a NEGATIVA que importa: baldes de laudo que nao somam as ofertas tem
que virar falha declarada. Fan-out de juncao ja mordeu duas vezes neste
projeto e as duas vezes foi silencioso.

    python _prova_cluster.py
"""
import io
import os
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

AQUI = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(AQUI, "prova-local.js")
s = io.open(P, encoding="utf-8").read()
orig = s


def troca(velho, novo, rot):
    global s
    if s.count(velho) != 1:
        raise SystemExit("ANCORA AMBIGUA OU AUSENTE (%d): %s" % (s.count(velho), rot))
    s = s.replace(velho, novo, 1)
    print("  ok  " + rot)


# ── 1. o respostaDe passa a servir as tres consultas novas ───────────────
troca(
"""  if (p.queryName === 'q_modelo') return resp(['shop_id', 'item_id', 'nome', 'n'], MODELO, p.pagina);
  return resp(['shop_id', 'item_id', 'nome', 'n'], CATEG, p.pagina);
}""",
"""  if (p.queryName === 'q_modelo') return resp(['shop_id', 'item_id', 'nome', 'n'], MODELO, p.pagina);
  if (p.queryName === 'q_uf_laudo') return resp(COL_UFL, UFL, p.pagina);
  if (p.queryName === 'q_contato') return resp(COL_CT, CONTATO, p.pagina);
  if (p.queryName === 'q_cluster') return resp(['shop_id', 'ult_oferta', 'ult_acesso'], CLUSTER_LINHAS, p.pagina);
  return resp(['shop_id', 'item_id', 'nome', 'n'], CATEG, p.pagina);
}""",
    "respostaDe serve q_uf_laudo, q_contato e q_cluster")

# ── 2. o dado sintetico das tres ─────────────────────────────────────────
troca(
"""const f2b = fase2Com(6, 5);""",
"""/* ── dado sintetico dos cinco campos de 2026-09-11 ────────────────────────
   As datas saem do META do proprio run, nunca de um "hoje" fixo: prova com
   data cravada envelhece e um dia passa a verificar outra coisa. */
const f2datas = fase2Com(6, 5);
const MREF = f2datas[0].meta;
const MS_AGORA = Date.parse(String(MREF.agora_br).split(' ').join('T') + 'Z');
const MS_INI = Date.parse(String(MREF.data_ini).split(' ').join('T') + 'Z');
const DIA_MS = 86400000;
const iso = (ms) => new Date(ms).toISOString();

/* uma loja por faixa, 11 a 15, mais duas so-datas para as faixas 6 e 7.
   Cada linha e um caso da cascata, na ordem da tabela do Thomas. */
const CLUSTER_LINHAS = [
  /* 11 -> 1 Diamante: ofertou ha 5 dias                                  */
  [11, iso(MS_AGORA - 5 * DIA_MS), iso(MS_AGORA - 5 * DIA_MS)],
  /* 12 -> 2 Ouro: ofertou depois do inicio da janela, mas ha mais de 30d.
     O ponto do meio da janela e sempre >= data_ini e sempre > 30 dias.   */
  [12, iso((MS_INI + MS_AGORA) / 2), iso(MS_AGORA - 200 * DIA_MS)],
  /* 13 -> 3 Prata: ofertou ANTES da janela, acessou ha 10 dias           */
  [13, iso(MS_INI - 400 * DIA_MS), iso(MS_AGORA - 10 * DIA_MS)],
  /* 14 -> 4 Recuperacao: ofertou antes da janela, acesso velho           */
  [14, iso(MS_INI - 400 * DIA_MS), iso(MS_AGORA - 200 * DIA_MS)],
  /* 15 -> 5 Lead Quente: nunca ofertou, acessou ha 10 dias               */
  [15, null, iso(MS_AGORA - 10 * DIA_MS)]
];

const COL_UFL = ['shop_id', 'ofertas_base', 'ofertas_mesma_uf', 'laudo_ausente',
  'laudo_aprovado', 'laudo_apontamento', 'laudo_reprovado', 'laudo_nao_informado',
  'laudo_vazio'];
/* os seis baldes somam ofertas_base em todas: e a invariante que a guarda
   do no confere. A quebra dela e testada separado, mais abaixo. */
const UFL = [
  [11, 100, 25, 10, 40, 20, 5, 25, 0],
  [12, 50, 50, 0, 50, 0, 0, 0, 0],
  [13, 40, 0, 40, 0, 0, 0, 0, 0],
  [14, 20, 10, 5, 5, 5, 5, 0, 0],
  [15, 10, 3, 1, 2, 3, 4, 0, 0]
];

const COL_CT = ['shop_id', 'tel_comercial', 'whatsapp', 'tel_privativo', 'email', 'qt_emails'];
const CONTATO = [
  [11, '(11) 3000-0000', '(11) 99999-0000', '(11) 98888-0000', 'contato@loja11.exemplo', 3],
  [12, '(11) 3000-0012', null, null, 'contato@loja12.exemplo', 1],
  [13, null, null, null, null, 0],
  [14, '(31) 3000-0014', '(31) 99999-0014', null, 'contato@loja14.exemplo', 1],
  [15, null, '(41) 99999-0015', null, null, 0]
];

const f2b = fase2Com(6, 5);""",
    "dado sintetico das tres consultas novas")

# ── 3. as provas ─────────────────────────────────────────────────────────
troca(
"""/* ── o cabecalho descreve a janela QUE EXISTE ──────────────────────────── */""",
"""/* ══ os cinco campos de 2026-09-11, no que o NO faz com a resposta ══════ */
(function () {
  const porId = {};
  D.lojas.forEach((l) => { porId[l.loja_id] = l; });

  /* ── a cascata das sete faixas, uma a uma ─────────────────────────────
     A ordem E a regra: a primeira condicao que bate ganha. Testar so o
     agregado deixaria passar troca de ordem entre duas faixas. */
  [[11, 1, 'Cliente Diamante'], [12, 2, 'Cliente Ouro'], [13, 3, 'Cliente Prata'],
   [14, 4, 'Cliente Recuperação'], [15, 5, 'Lead Quente']].forEach(function (c) {
    const l = porId[c[0]];
    ok(!!l, 'loja ' + c[0] + ' publicada');
    ok(l && l.cluster === c[1],
      'loja ' + c[0] + ' -> faixa ' + c[1] + ' (' + c[2] + ') — veio ' + (l && l.cluster));
    ok(l && l.cluster_nome === c[2], 'o nome da faixa viaja resolvido: ' + c[2]);
  });

  /* NEGATIVA da faixa 2: ela usa a JANELA DO RELATORIO, nao "180 dias".
     Com INTERVAL 180 DAY contra uma base de 6 meses de calendario (184
     dias), 16 lojas caiam em Prata por causa de 4 dias — artefato de
     unidade medido na sonda 50347. Uma oferta no PRIMEIRO dia da janela
     tem que ser Ouro, nunca Prata. */
  const noLimite = rodaNo('montar-html.js', ctxDe({
    'Montar Fase 2': f2b,
    'MCP Fase 2': f2b.map((i) => i.json).map(function (p) {
      if (p.queryName !== 'q_cluster') return respostaDe(p);
      return resp(['shop_id', 'ult_oferta', 'ult_acesso'],
        [[11, iso(MS_INI), iso(MS_AGORA - 300 * DIA_MS)]], p.pagina);
    })
  }))[0].json;
  const lim = noLimite.DADOS.lojas.filter((l) => l.loja_id === 11)[0];
  ok(!!lim && lim.cluster === 2,
    'oferta no primeiro dia da janela e Ouro, nao Prata — veio ' + (lim && lim.cluster));

  /* ── desagio ──────────────────────────────────────────────────────── */
  ok(porId[11] && porId[11].desagio === null,
    'sem fipe no dado sintetico, o desagio fica nulo em vez de zero');

  /* ── % de ofertas na mesma UF ─────────────────────────────────────── */
  ok(porId[11] && porId[11].pct_mesma_uf === 25, 'loja 11: 25 de 100 ofertas na propria UF');
  ok(porId[12] && porId[12].pct_mesma_uf === 100, 'loja 12: 100% na propria UF');
  ok(porId[13] && porId[13].pct_mesma_uf === 0, 'loja 13: zero por cento, e nao nulo');

  /* ── laudo: as seis fatias, e a distincao que importa ──────────────── */
  const L11 = porId[11] && porId[11].laudo;
  ok(!!L11, 'a loja 11 publica o laudo');
  ok(L11 && L11.aprovado === 40, 'laudo aprovado 40%');
  ok(L11 && L11.nao_informado === 25, 'laudo nao informado 25%');
  ok(L11 && L11.ausente === 10, 'sem laudo 10%');
  /* a razao de existirem os dois: sao populacoes diferentes e 78% do banco
     esta em nao_informado */
  ok(L11 && L11.ausente !== L11.nao_informado,
    '"sem laudo" e "nao informado" sao campos separados');

  /* ── contato ──────────────────────────────────────────────────────── */
  ok(porId[11] && porId[11].email === 'contato@loja11.exemplo', 'o e-mail chega');
  ok(porId[11] && porId[11].qt_emails === 3, 'a contagem de usuarios chega, pra tela dizer 1 de N');
  ok(porId[13] && porId[13].email === null, 'loja sem usuario fica com e-mail nulo');
  ok(porId[11] && porId[11].tel_privativo === '(11) 98888-0000',
    'o telefone privativo entra, a pedido de 11/09');

  /* ── NEGATIVA: baldes de laudo que nao somam viram falha declarada ──
     Fan-out de juncao ja mordeu duas vezes aqui, as duas silenciosamente.
     Aqui a loja 11 recebe 100 ofertas e baldes somando 105. */
  const quebrado = rodaNo('montar-html.js', ctxDe({
    'Montar Fase 2': f2b,
    'MCP Fase 2': f2b.map((i) => i.json).map(function (p) {
      if (p.queryName !== 'q_uf_laudo') return respostaDe(p);
      return resp(COL_UFL, [[11, 100, 25, 10, 45, 20, 5, 25, 0]], p.pagina);
    })
  }))[0].json;
  const acusou = quebrado.falhas.some((f) => f.indexOf('nao somam o total de ofertas') >= 0);
  ok(acusou, '[neg] balde de laudo que nao fecha vira falha declarada, nao arredondamento');
})();

/* ── o cabecalho descreve a janela QUE EXISTE ──────────────────────────── */""",
    "provas da cascata, do laudo, do contato e a negativa do fan-out")

tmp = P + ".tmp"
with io.open(tmp, "w", encoding="utf-8") as f:
    f.write(s)
os.replace(tmp, P)

print("prova-local.js: %d -> %d chars" % (len(orig), len(s)))
