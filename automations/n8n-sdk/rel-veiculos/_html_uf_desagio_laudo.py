# -*- coding: utf-8 -*-
"""A UF vira preferencia, e desagio e laudo viram indicadores.

Pedido do Thomas em 2026-09-11 (segunda rodada). Quatro mudancas, sendo que a
quarta muda o UNIVERSO e por isso foi medida antes de escrita.

  1. desagio e laudo na base de VEICULOS
  2. desagio como indicador QUANTITATIVO (como preco e km)
  3. laudo como indicador QUALITATIVO (como modelo e categoria)
  4. UF deixa de ser PORTA e vira indicador qualitativo com peso =
     % de ofertas da loja na propria UF

MEDIDO ANTES (simulacao local sobre o dado do run 50379, que reproduziu o
numero real de pares com erro de 2 em 44.448):

  hoje, UF como porta ............ 126.977 avaliados ->  44.450 pares
  porta mantida + componente ..... 126.977 avaliados ->  60.368 pares
  porta derrubada + componente ... 670.480 avaliados -> 203.658 pares (20 MB)

A opcao do meio nao serve: com a porta de pe, toda loja ja esta na mesma UF,
a aderencia de UF e sempre 1 e o componente nao prioriza nada -- so infla os
scores. Os 16 mil pares a mais seriam numero sem significado novo.

Derrubar a porta faz o que foi pedido, mas 203 mil pares dao ~20 MB de HTML,
que trava navegador. Dai o TETO.

O TETO E POR VEICULO, NAO GLOBAL, e isso e deliberado: o relatorio e um
RANKING, e ninguem le a loja numero 150 de um carro. Teto global cortaria
veiculos inteiros; teto por veiculo corta a cauda de cada um. Com 30 o
arquivo fica em ~3,6 MB -- MENOR que os 4,5 MB de hoje, com 5,3x mais
candidatos avaliados.

🚨 PAR CORTADO PELO TETO E CONTADO E DECLARADO. Descartar em silencio e o
defeito que este projeto persegue desde o inicio; o KPI e o glossario dizem
quantos ficaram de fora.

CONSEQUENCIA QUE MUDA A LEITURA DA TELA: "sem correspondencia" cai de 150
para 3, e "sem loja do canal na UF" deixa de existir como categoria -- a UF
nao exclui mais ninguem. Medido, avisado ao Thomas antes de implementar.

    python _html_uf_desagio_laudo.py
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


# ── 1. constantes: teto e corte do desagio ───────────────────────────────
troca(
"""const CORRESP_MIN = 50;""",
"""const CORRESP_MIN = 50;

/* TETO DE LOJAS POR VEICULO (2026-09-11, segunda rodada).
   Existe porque a UF deixou de ser porta: cada veiculo passou a disputar com
   todas as lojas do canal, e sem teto sao 203.658 pares e ~20 MB de HTML,
   que trava navegador. Medido na simulacao local sobre o run 50379.

   E POR VEICULO, nao global, porque o relatorio e um ranking: teto global
   cortaria veiculos inteiros, teto por veiculo corta a cauda de cada um.
   Com 30 o arquivo fica em ~3,6 MB, menor que os 4,5 MB de hoje, com 5,3x
   mais candidatos avaliados.

   Ponha 0 para desligar. */
const TETO_LOJAS = 30;

/* o mesmo corte de outlier que a fase 2 aplica no desagio das lojas. O
   desagio do VEICULO e calculado aqui (valor e fipe ja estao na base, pedir
   ao banco custaria 26 chamadas por nada), entao o corte precisa ser o
   mesmo dos dois lados -- senao a aderencia compara coisas de escalas
   diferentes. */
const DESAGIO_MIN = -100;
const DESAGIO_MAX = 95;

/* os seis estados do laudo. `ausente` NAO e um valor do banco: e a ausencia
   de linha em vehicle_precautionary_reports, e vale como categoria propria
   porque \"nao tem laudo\" e diferente de \"tem laudo que nao diz nada\"
   (`nao_informado`, 78% da base). */
const LAUDO_AUSENTE = 'ausente';
const LAUDO_CHAVES = ['aprovado', 'apontamento', 'reprovado', 'nao_informado',
                      'vazio', LAUDO_AUSENTE];
const LAUDO_NOME = {
  aprovado: 'Aprovado',
  apontamento: 'Aprovado com apontamento',
  reprovado: 'Reprovado',
  nao_informado: 'Nao informado',
  vazio: 'Laudo sem situacao',
  ausente: 'Sem laudo'
};
/* o banco escreve `aprovado_com_apontamento`; a coluna pivotada da fase 2
   chama `laudo_apontamento`. Um de-para explicito evita que a diferenca de
   nome vire aderencia zero em silencio. */
function laudoChave(x) {
  const v = String(x == null ? '' : x).trim();
  if (!v) return null;
  if (v === 'aprovado_com_apontamento') return 'apontamento';
  if (LAUDO_CHAVES.indexOf(v) >= 0) return v;
  return 'vazio';
}""",
    "TETO_LOJAS, corte do desagio e o de-para do laudo")

# ── 2. a loja ganha desvio do desagio, peso, e a moda de laudo ───────────
troca(
"""  const cid = clusterDe(cl.ult_oferta, cl.ult_acesso);""",
"""  const cid = clusterDe(cl.ult_oferta, cl.ult_acesso);

  /* moda de laudo da loja: o balde com mais ofertas, e o peso e a fatia
     dele. Mesma forma de modelo e categoria -- loja que concentra 70% das
     ofertas em carro aprovado faz o indicador pesar; loja que compra de
     tudo tem peso baixo e o indicador deixa de mandar. */
  let laudoModa = null;
  let laudoN = 0;
  if (base) {
    const balde = {
      aprovado: num(ul.laudo_aprovado), apontamento: num(ul.laudo_apontamento),
      reprovado: num(ul.laudo_reprovado), nao_informado: num(ul.laudo_nao_informado),
      vazio: num(ul.laudo_vazio), ausente: num(ul.laudo_ausente)
    };
    /* empate desempatado pela ORDEM de LAUDO_CHAVES, que e fixa -- assim a
       mesma loja da o mesmo resultado entre dois runs. Mesmo motivo do
       MIN(item_id) na moda de modelo. */
    for (let i = 0; i < LAUDO_CHAVES.length; i++) {
      const k = LAUDO_CHAVES[i];
      if ((balde[k] || 0) > laudoN) { laudoN = balde[k]; laudoModa = k; }
    }
  }""",
    "moda de laudo da loja")

troca(
"""    desagio: num(pe.desagio_medio),
    desagio_n: num(pe.desagio_n),""",
"""    desagio: num(pe.desagio_medio),
    desagio_desvio: num(pe.desagio_desvio),
    desagio_n: num(pe.desagio_n),
    /* peso do desagio: o mesmo inverso do CV de preco, idade e km. Loja que
       compra sempre 30% abaixo da FIPE e previsivel; loja erratica tem CV
       alto e o peso cai sozinho. */
    p_desagio: pesoNum(num(pe.desagio_medio), num(pe.desagio_desvio)),
    /* laudo como indicador qualitativo, igual a modelo e categoria */
    laudo_moda: laudoModa,
    laudo_moda_nome: laudoModa ? LAUDO_NOME[laudoModa] : null,
    pct_laudo: base ? (laudoN / base) : 0,
    /* peso da UF: a fatia de ofertas que a loja faz dentro do proprio
       estado. Loja que compra 90% na praca prioriza forte; loja que compra
       20% e quase indiferente a UF. */
    p_uf: base ? (num(ul.ofertas_mesma_uf) / base) : 0,""",
    "desvio, peso do desagio, moda de laudo e peso da UF")

# ── 3. o veiculo ganha desagio e laudo ───────────────────────────────────
troca(
"""    marca: r.marca, model_year: my, idade: my ? ANO - my : null, km: num(r.km),""",
"""    marca: r.marca, model_year: my, idade: my ? ANO - my : null, km: num(r.km),
    /* desagio DO VEICULO: quanto o valor esta abaixo da FIPE do anuncio.
       Calculado aqui porque `valor` e `fipe` ja vieram na q_veiculos --
       pedir ao banco custaria 26 chamadas por um numero que ja se tem.
       Mesmo corte de outlier das lojas: as duas pontas tem que estar na
       mesma escala pra aderencia significar alguma coisa. */
    desagio: desagioDe(num(r.valor), num(r.fipe)),
    /* laudo: NULL no banco vira 'ausente', que e categoria propria. Ver o
       comentario em LAUDO_CHAVES. */
    laudo: laudoChave(r.laudo) || LAUDO_AUSENTE,
    laudo_nome: LAUDO_NOME[laudoChave(r.laudo) || LAUDO_AUSENTE],""",
    "veiculo ganha desagio e laudo")

troca(
"""function linkAnuncio(marca, modelo, versao, uuid) {""",
"""/* desagio do veiculo, com o MESMO corte que a fase 2 aplica no das lojas.
   Fora da faixa devolve null em vez de um numero absurdo: o dado cru chega
   a -1.586%, e um par comparado contra isso produziria aderencia sem
   sentido em vez de nenhuma. */
function desagioDe(valor, fipe) {
  if (valor === null || fipe === null || !fipe || fipe <= 0) return null;
  const d = 100 * (1 - (valor / fipe));
  if (d < DESAGIO_MIN || d > DESAGIO_MAX) return null;
  return Math.round(d * 100) / 100;
}

function linkAnuncio(marca, modelo, versao, uuid) {""",
    "funcao desagioDe()")

# ── 4. a formula ganha tres componentes ──────────────────────────────────
troca(
"""  if (l.pct_categoria > 0 && v.category_id !== null) {
    comps.push({ k: 'categoria', a: (v.category_id === l.categoria_id ? 1 : 0), p: l.pct_categoria });
  }""",
"""  if (l.pct_categoria > 0 && v.category_id !== null) {
    comps.push({ k: 'categoria', a: (v.category_id === l.categoria_id ? 1 : 0), p: l.pct_categoria });
  }
  /* desagio: QUANTITATIVO, mesma forma de preco, idade e km */
  const aD = adNum(v.desagio, l.desagio, l.desagio_desvio);
  if (aD !== null && l.p_desagio > 0) comps.push({ k: 'desagio', a: aD, p: l.p_desagio });
  /* laudo: QUALITATIVO, mesma forma de modelo e categoria */
  if (l.pct_laudo > 0 && l.laudo_moda) {
    comps.push({ k: 'laudo', a: (v.laudo === l.laudo_moda ? 1 : 0), p: l.pct_laudo });
  }
  /* UF: QUALITATIVO. Ate 2026-09-11 era uma PORTA -- par entre UFs
     diferentes simplesmente nao existia. Agora e preferencia, com peso
     igual a fatia de ofertas que a loja faz na propria praca: quem compra
     90% dentro do estado prioriza forte, quem compra 20% e quase
     indiferente. */
  if (l.p_uf > 0) {
    comps.push({ k: 'uf', a: (v.uf === l.uf ? 1 : 0), p: l.p_uf });
  }""",
    "desagio, laudo e UF entram na formula")

# ── 5. a porta da UF cai; entra o indice por whitelabel e o teto ─────────
troca(
"""/* índice de lojas por UF, pra não varrer as 1.300 em cada veículo */
const porUf = {};
lojasTodas.forEach((l, i) => {
  if (!porUf[l.uf]) porUf[l.uf] = [];
  porUf[l.uf].push(i);
});""",
"""/* Indice de lojas por WHITELABEL, nao mais por UF.
   A UF deixou de ser porta em 2026-09-11 (virou indicador com peso), entao
   o que ainda restringe o universo e so o canal do evento. Sem indice
   nenhum seriam 1.256 x 1.299 comparacoes; com ele, 670 mil. */
const porWl = {};
lojasTodas.forEach((l, i) => {
  const k = String(l.whitelabel_id);
  if (!porWl[k]) porWl[k] = [];
  porWl[k].push(i);
});""",
    "indice por whitelabel no lugar do indice por UF")

troca(
"""veiculos.forEach((v, vi) => {
  const cands = porUf[v.uf] || [];
  const wlSet = {};
  v.wls.forEach((w) => { wlSet[String(w)] = 1; });
  let n = 0;
  let eleg = 0;
  for (let i = 0; i < cands.length; i++) {
    const l = lojasTodas[cands[i]];
    if (!wlSet[String(l.whitelabel_id)]) continue;   /* whitelabel do evento */
    /* passou na regra de elegibilidade. Contar AQUI, antes do corte, e o
       que permite distinguir "nao ha loja pra este carro" de "havia loja e
       o corte cortou" -- duas causas que pedem decisoes opostas. */
    eleg++;
    const r = pontua(v, l);
    if (!r || !(r.score >= CORRESP_MIN)) { if (r) descartados++; continue; }
    pares.push(vi, cands[i], Math.round(r.score * 10));
    detPares.push(r.det);
    usadas[cands[i]] = 1;
    n++;
  }
  v.candidatos = n;
  v.elegiveis = eleg;
  /* o canal inteiro nao tem loja: o par era impossivel desde o inicio */
  v.canal_sem_loja = !!(v.wls.length && !v.wls.some((w) => wlComLoja[String(w)]));
});""",
"""let cortadosPeloTeto = 0;  /* passaram no corte mas ficaram fora do top-N */
veiculos.forEach((v, vi) => {
  /* candidatos = lojas do CANAL do evento. A UF nao exclui mais ninguem. */
  const vistosL = {};
  const cands = [];
  v.wls.forEach((w) => {
    (porWl[String(w)] || []).forEach((i) => {
      if (!vistosL[i]) { vistosL[i] = 1; cands.push(i); }
    });
  });
  let eleg = 0;
  /* junta TODOS os que passam do corte, ordena, e so entao aplica o teto.
     Cortar durante a varredura guardaria os primeiros, nao os melhores. */
  const passaram = [];
  for (let i = 0; i < cands.length; i++) {
    const l = lojasTodas[cands[i]];
    /* passou na regra de elegibilidade. Contar AQUI, antes do corte, e o
       que permite distinguir "nao ha loja pra este carro" de "havia loja e
       o corte cortou" -- duas causas que pedem decisoes opostas. */
    eleg++;
    const r = pontua(v, l);
    if (!r || !(r.score >= CORRESP_MIN)) { if (r) descartados++; continue; }
    passaram.push({ i: cands[i], s: Math.round(r.score * 10), d: r.det });
  }
  passaram.sort((a, b) => b.s - a.s);
  const fica = TETO_LOJAS > 0 ? passaram.slice(0, TETO_LOJAS) : passaram;
  cortadosPeloTeto += passaram.length - fica.length;
  for (let i = 0; i < fica.length; i++) {
    pares.push(vi, fica[i].i, fica[i].s);
    detPares.push(fica[i].d);
    usadas[fica[i].i] = 1;
  }
  v.candidatos = fica.length;
  v.acima_do_corte = passaram.length;   /* antes do teto */
  v.elegiveis = eleg;
  /* o canal inteiro nao tem loja: o par era impossivel desde o inicio */
  v.canal_sem_loja = !!(v.wls.length && !v.wls.some((w) => wlComLoja[String(w)]));
});""",
    "porta derrubada, teto por veiculo aplicado DEPOIS da ordenacao")

# ── 6. as falhas mudam de significado ────────────────────────────────────
troca(
"""if (semNaUf) {
  falhas.push(semNaUf + ' veiculo(s) sem nenhuma loja do canal na UF do patio.');
}""",
"""if (semNaUf) {
  /* Ate 2026-09-11 isto dizia "sem loja do canal na UF do patio". A UF
     deixou de ser porta, entao a unica forma de ficar sem elegivel agora e
     o canal nao ter loja alguma -- que ja tem KPI proprio. Se este numero
     aparecer, e sinal de outra coisa. */
  falhas.push(semNaUf + ' veiculo(s) com canal povoado mas nenhuma loja elegivel: ' +
    'a UF nao exclui mais, entao isto nao deveria acontecer — investigar.');
}
/* Par cortado pelo TETO e par que passou de tudo e ficou de fora mesmo
   assim. Declarar, sempre: descarte silencioso e o defeito que este
   relatorio persegue desde o inicio. */
if (cortadosPeloTeto) {
  falhas.push(cortadosPeloTeto.toLocaleString('pt-BR') + ' par(es) passaram da ' +
    'correspondencia minima mas ficaram fora do teto de ' + TETO_LOJAS +
    ' lojas por veiculo — sao os de menor score de cada carro, e o teto existe ' +
    'porque sem ele o arquivo passa de 20 MB.');
}""",
    "falha do teto declarada, e a da UF reescrita")

# ── 7. resumo publica os numeros novos ───────────────────────────────────
troca(
"""    cortados_pelo_min: cortadosPeloMin,""",
"""    cortados_pelo_min: cortadosPeloMin,
    cortados_pelo_teto: cortadosPeloTeto,
    teto_lojas: TETO_LOJAS,""",
    "resumo publica o teto")

tmp = P + ".tmp"
with io.open(tmp, "w", encoding="utf-8", newline="") as f:
    f.write(s)
os.replace(tmp, P)

print("montar-html.js: %d -> %d chars" % (len(orig), len(s)))
