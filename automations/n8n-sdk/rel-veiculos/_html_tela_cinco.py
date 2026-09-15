# -*- coding: utf-8 -*-
"""Os cinco campos na TELA: falha declarada, extrato e glossario.

Tudo aqui e dentro dos marcadores RENDER, porque le `D` (o dado embarcado) e
nao `dados` (a coleta crua). O criterio esta escrito no _html_cinco_campos.py.

O extrato ganha uma faixa nova acima da tabela de indicadores, com os cinco
campos juntos. Nao viram coluna da tabela principal de proposito: a tabela ja
tem 9 colunas e o contato e PII -- deixar em painel que se abre por clique e
melhor que espalhar telefone por 732 linhas visiveis.

    python _html_tela_cinco.py
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


# ── 1. o desencontro do laudo vira falha declarada ───────────────────────
troca(
"""if (semWl) falhas.push(semWl + ' veiculo(s) em evento sem whitelabel declarado: ficam sem nenhuma loja elegivel');""",
"""if (semWl) falhas.push(semWl + ' veiculo(s) em evento sem whitelabel declarado: ficam sem nenhuma loja elegivel');
/* os seis baldes de laudo tem que somar as ofertas da loja; nao somando, a
   juncao duplicou ofertas (veiculo com mais de um laudo). Declarar, nao
   arredondar -- fan-out silencioso ja mordeu duas vezes neste projeto. */
if (laudoDesencontro) {
  falhas.push(laudoDesencontro + ' loja(s) em que os status de laudo nao somam o total de ofertas: ' +
    'algum veiculo tem mais de um laudo e as ofertas dele foram contadas em duplicata');
}""",
    "desencontro do laudo vira falha declarada")

# ── 2. o extrato ganha a faixa dos cinco campos ──────────────────────────
troca(
"""  `"<div style='margin-bottom:12px'>"+esc(l.uf)+" &middot; "+esc(l.whitelabel)+" &middot; <b>"+nf(l.qt_veiculos)+"</b> veículos ofertados em <b>"+nf(l.qt_ofertas)+"</b> lances nos últimos 6 meses"+(l.amostra_baixa?" <span class='tag w'>amostra baixa</span>":"")+" &middot; fator de confiança <b>"+nf(l.confianca,2)+"</b> &middot; elegível para <b>"+nf(l.pares)+"</b> veículo(s)</div>"+`,""",
"""  `"<div style='margin-bottom:12px'>"+esc(l.uf)+" &middot; "+esc(l.whitelabel)+" &middot; <b>"+nf(l.qt_veiculos)+"</b> veículos ofertados em <b>"+nf(l.qt_ofertas)+"</b> lances nos últimos 6 meses"+(l.amostra_baixa?" <span class='tag w'>amostra baixa</span>":"")+" &middot; fator de confiança <b>"+nf(l.confianca,2)+"</b> &middot; elegível para <b>"+nf(l.pares)+"</b> veículo(s)</div>"+`,
  /* ---- os cinco campos de 11/09 ---- */
  'perfilExtra(l)+',""",
    "chamada do painel novo no extrato")

# ── 3. a funcao que desenha o painel ─────────────────────────────────────
troca(
"""  'const acima=todos.filter(function(x){return passaV(D.veiculos[x.o],ev2,w2,uf2);});',""",
"""  /* ---- painel dos cinco campos de 11/09 ----
     Cada bloco se apaga sozinho quando o dado nao existe, em vez de mostrar
     um travessao: linha vazia ocupa espaco e nao informa nada. */
  'function perfilExtra(l){',
  'const b=[];',
  /* deságio: media ja cortada nos extremos, com o n ao lado porque media de
     3 carros e media de 300 nao valem o mesmo */
  `if(l.desagio!==null&&l.desagio!==undefined){b.push("<div class='xk'><span>Deságio médio</span><b>"+nf(l.desagio,1)+"%</b><i>abaixo da FIPE, em "+nf(l.desagio_n)+" veículo(s)</i></div>");}`,
  `if(l.pct_mesma_uf!==null&&l.pct_mesma_uf!==undefined){b.push("<div class='xk'><span>Ofertas na própria UF</span><b>"+nf(l.pct_mesma_uf,1)+"%</b><i>o resto foi para fora de "+esc(l.uf)+"</i></div>");}`,
  `b.push("<div class='xk'><span>Faixa de recência</span><b>"+esc(l.cluster_nome||"—")+"</b><i>"+(l.ult_oferta?("última oferta "+dataBr(l.ult_oferta)):"sem oferta registrada")+"</i></div>");`,
  /* laudo: so os status com valor, e `sem laudo` separado de `não informado` */
  'if(l.laudo){const L=l.laudo;const p=[];',
  `[["Aprovado",L.aprovado],["Com apontamento",L.apontamento],["Reprovado",L.reprovado],["Não informado",L.nao_informado],["Sem laudo",L.ausente]].forEach(function(x){if(x[1]){p.push(esc(x[0])+" <b>"+nf(x[1],1)+"%</b>");}});`,
  `if(p.length){b.push("<div class='xk' style='flex:1 1 100%'><span>Laudo cautelar dos veículos ofertados</span><b style='font-size:13px;font-weight:400'>"+p.join(" &middot; ")+"</b><i>&ldquo;não informado&rdquo; é laudo sem veredito, diferente de não ter laudo</i></div>");}}`,
  /* contato: PII, por isso so aparece no painel que se abre por clique */
  'const c=[];',
  `if(l.email){c.push("<a href='mailto:"+esc(l.email)+"'>"+esc(l.email)+"</a>"+(l.qt_emails>1?" <span class='dim'>(1 de "+l.qt_emails+")</span>":""));}`,
  `if(l.tel_comercial){c.push(esc(l.tel_comercial)+" <span class='dim'>comercial</span>");}`,
  `if(l.whatsapp){c.push(esc(l.whatsapp)+" <span class='dim'>WhatsApp</span>");}`,
  `if(l.tel_privativo){c.push(esc(l.tel_privativo)+" <span class='dim'>privativo</span>");}`,
  `if(c.length){b.push("<div class='xk' style='flex:1 1 100%'><span>Contato</span><b style='font-size:13px;font-weight:400'>"+c.join(" &middot; ")+"</b></div>");}`,
  `return b.length?("<div class='xg'>"+b.join("")+"</div>"):"";}`,
  /* data curta em pt-BR, tolerante a formato do banco */
  'function dataBr(x){const t=Date.parse(String(x).indexOf("T")>0?String(x):String(x).split(" ").join("T")+"Z");return isNaN(t)?"—":new Date(t).toLocaleDateString("pt-BR");}',
  'const acima=todos.filter(function(x){return passaV(D.veiculos[x.o],ev2,w2,uf2);});',""",
    "funcao perfilExtra() e dataBr()")

# ── 4. o CSS do painel ───────────────────────────────────────────────────
troca(
"""  '.tag{display:inline-block;padding:1px 7px;border-radius:99px;font-size:10px;""",
"""  /* painel dos cinco campos: grade que quebra sozinha no estreito */
  '.xg{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}',
  '.xk{flex:1 1 170px;background:var(--bg);border:1px solid var(--line);',
  'border-left:3px solid var(--mar);border-radius:7px;padding:8px 11px}',
  '.xk span{display:block;color:var(--dim);font-size:10.5px;text-transform:uppercase;letter-spacing:.4px}',
  '.xk b{display:block;font-size:17px;font-weight:600;margin-top:2px}',
  '.xk i{display:block;color:var(--dim);font-size:10.5px;font-style:normal;margin-top:2px}',
  '.xk a{color:var(--mar)}',
  '.tag{display:inline-block;padding:1px 7px;border-radius:99px;font-size:10px;""",
    "CSS do painel")

# ── 5. glossario ─────────────────────────────────────────────────────────
troca(
"""  '<dt>Componentes</dt>',""",
"""  '<dt>Deságio médio</dt>',
  `<dd>Quanto a loja costuma pagar <b>abaixo da tabela FIPE</b>. Para cada veículo toma-se a <b>última</b> oferta dela e compara-se com a FIPE do anúncio; o número é a média dessas diferenças.</dd>`,
  `<dd class="ex">São descartadas as distorções fora da faixa de ${META.desagio_min}% a ${META.desagio_max}%. O dado cru chega a &minus;1.586%, ou seja oferta dezesseis vezes acima da FIPE registrada, e um único caso desses destrói a média de uma loja. A quantidade de veículos que sobrou aparece ao lado — média de três carros e média de trezentos não valem o mesmo.</dd>`,
  '<dt>Ofertas na própria UF</dt>',
  `<dd>Fatia dos lances da loja em veículos cujo <b>pátio</b> fica no mesmo estado dela. O complemento é compra para fora, que envolve frete e logística.</dd>`,
  '<dt>Laudo cautelar</dt>',
  `<dd>Distribuição dos veículos que a loja ofertou por situação do laudo. <b>&ldquo;Não informado&rdquo; não é o mesmo que &ldquo;sem laudo&rdquo;:</b> o primeiro é um laudo que existe e não traz o resultado — a maior parte da base —, o segundo é veículo sem laudo nenhum. Os dois aparecem separados de propósito.</dd>`,
  '<dt>Faixa de recência</dt>',
  `<dd>Classificação da loja em sete faixas, da mais ativa à mais fria, combinando <b>quando ofertou pela última vez</b> e <b>quando acessou a plataforma pela última vez</b>. A primeira faixa que se aplica é a que vale.</dd>`,
  `<dd class="ex"><b>Nesta tela a faixa quase não varia, e isso é esperado:</b> a base do relatório é justamente &ldquo;lojas que ofertaram nos últimos 6 meses&rdquo;, então praticamente toda loja aqui é Diamante ou Ouro. As sete faixas só se separam sobre o conjunto completo de lojas da plataforma.</dd>`,
  `<dd class="ex">⚠️ O registro de acesso começa em 31/08/2025. Onde se lê &ldquo;nunca acessou&rdquo;, o que o dado sustenta é <b>&ldquo;não acessou nos últimos 12 meses&rdquo;</b>. Já &ldquo;nunca ofertou&rdquo; é verificável de verdade: o histórico de ofertas alcança 2020.</dd>`,
  '<dt>Contato</dt>',
  `<dd>Telefones vêm do cadastro da loja; o <b>e-mail vem do usuário vinculado a ela</b>, porque o campo de e-mail do cadastro está preenchido em menos de 6% dos casos contra 99% no usuário. Quando há mais de um usuário com e-mail, mostra-se o de menor identificador e a contagem aparece ao lado.</dd>`,
  '<dt>Componentes</dt>',""",
    "cinco verbetes novos no glossario")

tmp = P + ".tmp"
with io.open(tmp, "w", encoding="utf-8") as f:
    f.write(s)
os.replace(tmp, P)

print("montar-html.js: %d -> %d chars" % (len(orig), len(s)))
