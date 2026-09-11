# -*- coding: utf-8 -*-
r"""Provas do patio e do link.

Sem isto, as duas mudancas de 2026-09-10 entrariam sem rede: a UF do veiculo
mudou de fonte (endereco da loja -> patio) e o relatorio passou a montar URL.

O dado sintetico ganha `versao` e `anuncio_uuid` porque a prova do link tem
que atravessar o pipeline inteiro, nao so a funcao. E o v3 fica DE PROPOSITO
sem versao: e o unico jeito de provar que a regra dura ("faltando um pedaco,
nao entrega link") sobrevive ate o HTML, em vez de virar um link quebrado
com "undefined" no meio.

Escrito com a ferramenta de arquivo, nao heredoc -- ver nota em
_link_anuncio.py.

    python _prova_patio_link.py
"""
import io
import os
import re

AQUI = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(AQUI, "prova-local.js")
s = io.open(P, encoding="utf-8").read()
orig = s


def troca(velho, novo, rotulo):
    global s
    if velho not in s:
        raise SystemExit("NAO ENCONTRADO: " + rotulo)
    s = s.replace(velho, novo, 1)
    print("  ok  " + rotulo)


# 1) o dado sintetico ganha as duas colunas novas
troca(
    u"'categoria', 'marca', 'model_year'",
    u"'categoria', 'marca', 'versao', 'anuncio_uuid', 'model_year'",
    "COLV declara versao e anuncio_uuid")

# 2) cada linha ganha versao + uuid, logo depois da marca. O v3 fica sem
#    versao pra provar a regra dura ponta a ponta.
UUID = {
    1: "aaaa1111bbbb2222cccc3333dddd4444",
    2: "bbbb1111cccc2222dddd3333eeee4444",
    3: "cccc1111dddd2222eeee3333ffff4444",
    4: "dddd1111eeee2222ffff3333aaaa4444",
    5: "eeee1111ffff2222aaaa3333bbbb4444",
    6: "ffff1111aaaa2222bbbb3333cccc4444",
}
VERSAO = {
    1: "'LT 1.0 Flex 12V 5p'",
    2: "'Comfort Plus 1.0'",
    3: "'LT 1.0 Flex 12V 5p'",
    4: "null",   # v3: sem versao DE PROPOSITO -> nao pode sair link
    5: "'LT 1.0 Flex 12V 5p'",
    6: "'LT 1.0 Flex 12V 5p'",
}

ini = s.index("const VEIC = [")
fim = s.index("\n];", ini)
bloco = s[ini:fim]
novo_bloco = bloco
for neg, uuid in UUID.items():
    # ancora: o inicio da linha ate a marca, que e o campo antes de model_year
    padrao = re.compile(
        r"(\n  \[" + str(neg) + r", .*?, )('[A-Za-z]+', )(ANO - \d+, )")
    m = padrao.search(novo_bloco)
    if not m:
        raise SystemExit("linha do neg_id " + str(neg) + " nao casou")
    novo_bloco = novo_bloco[:m.start()] + (
        m.group(1) + m.group(2) + VERSAO[neg] + ", '" + uuid + "', " + m.group(3)
    ) + novo_bloco[m.end():]
s = s[:ini] + novo_bloco + s[fim:]
print("  ok  6 linhas sinteticas com versao e uuid (v3 sem versao)")

# 3) as provas
ANCORA = u"\nfs.writeFileSync(path.join(AQUI, 'saida-teste-local.html'), h);"
PROVAS = r"""
/* ── [9] a UF do veiculo sai do PATIO ─────────────────────────────────── */
console.log('\n[9] UF pelo patio e link do anuncio');
const sqlV = p2.find((p) => p.queryName === 'q_veiculos').sql;
/* 68% dos veiculos tem UF de patio diferente da UF da loja (sonda 50068), e
   UF e metade da regra de elegibilidade -- se esta query voltar a ler
   shop_addresses, o par (veiculo, loja) muda sem ninguem notar. */
ok(sqlV.indexOf('shop_stocks ss') > 0, 'q_veiculos entra em shop_stocks');
ok(sqlV.indexOf('COALESCE(a.shop_stock_id, v.shop_stock_id)') > 0,
   'o patio vem pelos dois caminhos, preferindo o do anuncio');
ok(sqlV.indexOf('UPPER(TRIM(ss.state))') > 0, 'a UF do veiculo sai de ss.state');
ok(sqlV.indexOf('shop_addresses') < 0,
   'q_veiculos NAO le mais shop_addresses (join que ninguem le custa caro)');
/* a UF da LOJA continua sendo a dela -- o carro esta no patio, a loja
   compradora esta onde ela e. Trocar as duas seria o erro simetrico. */
const sqlL = p2.find((p) => p.queryName === 'q_lojas').sql;
ok(sqlL.indexOf('sa.state') > 0, 'q_lojas mantem a UF do endereco da loja');

/* ── o link ───────────────────────────────────────────────────────────── */
ok(sqlV.indexOf('a.uuid AS anuncio_uuid') > 0, 'q_veiculos traz o uuid');
ok(sqlV.indexOf('ve.name AS versao') > 0, 'q_veiculos traz a versao');
ok(sqlV.indexOf('versions ve') > 0, 'q_veiculos entra em versions');
/* GROUP BY incompleto em MySQL nao da erro: escolhe um valor qualquer. Sem
   esta prova, versao e uuid poderiam vir de outra linha do grupo. */
ok(/GROUP BY[\s\S]*versao/.test(sqlV) && /GROUP BY[\s\S]*anuncio_uuid/.test(sqlV),
   'GROUP BY lista versao e anuncio_uuid');

/* o padrao, conferido contra os exemplos do Gui (reuniao de 25/08) */
const vLink = D.veiculos.find((v) => v.vehicle_id === 5001 && v.link);
ok(!!vLink, 'ha veiculo com link montado');
ok(vLink.link.indexOf('https://cars2you.com.br/anuncio/veiculo/') === 0,
   'o link comeca com o padrao decidido em 25/08');
ok(vLink.link === vLink.link.toLowerCase().replace('HTTPS', 'https'),
   'os trechos vao em minusculo');
ok(vLink.link.indexOf('%20') > 0, 'espaco vira %20, NAO hifen');
ok(vLink.link.split('/').pop().indexOf('-') < 0, 'o uuid vai sem hifens');
ok(vLink.link.split('/anuncio/veiculo/')[1].split('/').length === 4,
   'quatro trechos: marca, modelo, versao e uuid');

/* a regra dura, ponta a ponta: o v3 nao tem versao */
const semVersao = D.veiculos.filter((v) => !v.versao);
ok(semVersao.length === 1, 'o dado sintetico tem 1 veiculo sem versao');
ok(semVersao[0].link === null,
   'sem um pedaco, NAO sai link (melhor sem botao que botao pra lugar nenhum)');
ok(h.indexOf('undefined/') < 0 && h.indexOf('/null/') < 0,
   'nenhum link com undefined ou null no meio chegou ao HTML');

/* e o link aparece de fato na tela, com o stopPropagation que impede o
   clique de mexer na selecao da linha por baixo */
ok(h.indexOf("class=\'lk\'") > 0 || h.indexOf('class=\'lk\'') > 0,
   'o link e renderizado com a classe lk');
ok(h.indexOf('event.stopPropagation()') > 0,
   'o clique no link nao mexe na selecao da linha');
ok(h.indexOf("rel=\'noopener\'") > 0 || h.indexOf('noopener') > 0,
   'o link abre em outra aba com noopener');
"""
if ANCORA not in s:
    raise SystemExit("NAO ENCONTRADO: ancora da escrita do HTML")
s = s.replace(ANCORA, PROVAS + ANCORA, 1)
print("  ok  bloco [9] de provas acrescentado")

io.open(P, "w", encoding="utf-8").write(s)
print("mudou: " + str(s != orig))
