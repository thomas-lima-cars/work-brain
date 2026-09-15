# -*- coding: utf-8 -*-
"""Provas dos cinco campos novos do perfil de loja.

A prova de custo (`fase 2 = N chamadas`) pegou a mudanca sozinha: 134 -> 212.
Ela existe exatamente para isso -- consulta nova por loja custa 26 chamadas e
o preco tem que ser uma decisao, nao uma surpresa. Aqui o numero e atualizado
COM o motivo escrito ao lado, e nao so bumped.

De quebra some um comentario obsoleto sobre PAG_MODA que sobreviveu a
correcao da moda, igual ao que estava no montar-fase2.js.

    python _prova_cinco_campos.py
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


troca(
"""/* 4 paginas de veiculo + 3 consultas de loja x 26 + 2 modas x 28.
   As modas levam 2 paginas a mais porque empate no topo rende mais de uma
   linha por loja -- ver PAG_MODA na fase 2. */
/* 4 paginas de veiculo + 5 consultas de loja x 26. As modas voltaram a
   PAG_LOJAS porque agora colapsam os empates no SQL e devolvem UMA linha
   por loja -- antes levavam folga chutada, e o chute nao bastou. */
ok(p2.length === 4 + 5 * 26, 'fase 2 = ' + (4 + 5 * 26) + ' chamadas — tem ' + p2.length);""",
"""/* 4 paginas de veiculo + 8 consultas de loja x 26 = 212 chamadas.
   Toda consulta por loja custa PAG_LOJAS, entao este numero E a conta do
   run -- por isso a prova e um valor exato e nao um "menor que".

   Historico do numero, que e o historico das decisoes:
     134 = 4 + 5x26   depois que as modas colapsaram os empates no SQL
     212 = 4 + 8x26   com os cinco campos de 11/09

   Foram CINCO pedidos e so TRES consultas novas: o desagio pegou carona na
   q_perfil (mesma varredura da ULTIMAS) e UF + laudo compartilham uma
   varredura so. Ingenuamente seriam +130 chamadas; sao +78. */
ok(p2.length === 4 + 8 * 26, 'fase 2 = ' + (4 + 8 * 26) + ' chamadas — tem ' + p2.length);

/* ── os cinco campos de 2026-09-11 ─────────────────────────────────────── */
(function () {
  const acha = (n) => p2.find((x) => x.queryName === n);

  /* 1. desagio: FIPE do ANUNCIO, nao do veiculo (85,6% contra 63,8%) */
  const perfil = acha('q_perfil');
  ok(!!perfil, 'q_perfil existe');
  ok(perfil.sql.indexOf('aq.fipe_price') > 0, 'desagio usa a FIPE do anuncio');
  ok(perfil.sql.indexOf('AS desagio_medio') > 0, 'q_perfil publica desagio_medio');
  ok(perfil.sql.indexOf('BETWEEN -100 AND 95') > 0, 'o corte de outlier esta na SQL');

  /* NEGATIVA: junção INNER em advertisements mudaria qt_veiculos, preco,
     idade e km -- numeros que ja existem e ja foram conferidos. Coluna nova
     nao pode mexer nas antigas. */
  ok(perfil.sql.indexOf('LEFT JOIN advertisements aq') > 0,
    'a juncao do desagio e LEFT');
  ok(perfil.sql.indexOf('INNER JOIN advertisements aq') < 0,
    '[neg] NAO existe INNER JOIN em advertisements na q_perfil');

  /* 2 e 3. UF e laudo, numa varredura so */
  const ufl = acha('q_uf_laudo');
  ok(!!ufl, 'q_uf_laudo existe');
  ok(ufl.sql.indexOf('AS ofertas_mesma_uf') > 0, 'publica ofertas_mesma_uf');
  ok(ufl.sql.indexOf('AS ofertas_base') > 0, 'publica o denominador');
  /* os cinco status medidos na sonda 50346, cada um com coluna propria */
  ['laudo_aprovado', 'laudo_apontamento', 'laudo_reprovado',
   'laudo_nao_informado', 'laudo_vazio', 'laudo_ausente'].forEach(function (c) {
    ok(ufl.sql.indexOf('AS ' + c) > 0, 'laudo pivotado: ' + c);
  });
  /* ausente (sem laudo) e nao_informado (laudo sem veredito) sao COISAS
     DIFERENTES -- 78% dos laudos do banco sao nao_informado */
  ok(ufl.sql.indexOf('vpr.id IS NULL') > 0,
    'laudo_ausente conta veiculo SEM laudo');
  ok(ufl.sql.indexOf("vpr.situation = 'nao_informado'") > 0,
    'laudo_nao_informado conta laudo SEM veredito');
  /* a UF da loja entra agregada: loja com dois enderecos duplicaria ofertas */
  ok(ufl.sql.indexOf('GROUP BY sa2.shop_id') > 0,
    'a UF da loja vem de tabela derivada, sem fan-out de endereco');

  /* 4. contato */
  const cont = acha('q_contato');
  ok(!!cont, 'q_contato existe');
  ok(cont.sql.indexOf('MIN(us.user_id)') > 0,
    'o e-mail desempata por menor user_id (deterministico entre runs)');
  ok(cont.sql.indexOf('INNER JOIN users u') > 0, 'o e-mail vem de users');
  ok(cont.sql.indexOf('AS qt_emails') > 0,
    'a contagem de usuarios viaja: a tela diz "1 de N"');
  ['tel_comercial', 'whatsapp', 'tel_privativo'].forEach(function (c) {
    ok(cont.sql.indexOf('AS ' + c) > 0, 'telefone: ' + c);
  });
  /* NEGATIVA: o e-mail de shops esta em 5,8% -- se voltar a ser a fonte, o
     campo sai vazio em 19 de cada 20 linhas */
  ok(cont.sql.indexOf('comercial_email') < 0,
    '[neg] o e-mail NAO vem de shops.comercial_email');

  /* 5. cluster: so as datas cruas; a regra e JS e testavel */
  const clu = acha('q_cluster');
  ok(!!clu, 'q_cluster existe');
  ok(clu.sql.indexOf('AS ult_oferta') > 0 && clu.sql.indexOf('AS ult_acesso') > 0,
    'o cluster traz as duas datas');
  /* "ja ofertou alguma vez" nao pode levar a janela de 6 meses: offers
     alcanca 2020-06-24 e e isso que torna "nunca ofertou" verificavel */
  const uo = clu.sql.slice(clu.sql.indexOf('AS ult_oferta') - 220,
                           clu.sql.indexOf('AS ult_oferta'));
  ok(uo.indexOf('created_at >=') < 0,
    'ult_oferta NAO leva filtro de janela: a pergunta e "ja ofertou alguma vez"');

  /* o corte do desagio viaja no META pro glossario */
  ok(M.desagio_min === -100 && M.desagio_max === 95,
    'o META publica o corte de outlier do desagio');

  /* toda consulta nova e UMA linha por loja, entao pagina por PAG_LOJAS */
  ['q_uf_laudo', 'q_contato', 'q_cluster'].forEach(function (n) {
    const paginas = p2.filter((x) => x.queryName === n).length;
    ok(paginas === 26, n + ' pagina por PAG_LOJAS (26), nao por chute — tem ' + paginas);
  });

  /* parenteses equilibrados: a SQL viaja como string e nenhum validador
     local olha pra ela. A sonda de 11/09 nasceu com um COALESCE(x,, ) que
     passou no node --check e so morreria no banco. */
  ['q_perfil', 'q_uf_laudo', 'q_contato', 'q_cluster'].forEach(function (n) {
    const sql = acha(n).sql;
    const a = sql.split('(').length - 1;
    const b = sql.split(')').length - 1;
    ok(a === b, n + ': parenteses equilibrados (' + a + '/' + b + ')');
    ok(sql.indexOf(',,') < 0 && sql.indexOf('( )') < 0 && sql.indexOf(',)') < 0,
      n + ': sem virgula dupla nem parentese vazio');
  });
})();""",
    "prova de custo atualizada (134 -> 212) + 30 provas dos cinco campos")

tmp = P + ".tmp"
with io.open(tmp, "w", encoding="utf-8") as f:
    f.write(s)
os.replace(tmp, P)

print("prova-local.js: %d -> %d chars" % (len(orig), len(s)))
