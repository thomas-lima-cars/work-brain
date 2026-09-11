# -*- coding: utf-8 -*-
r"""q_evento_wl deixa de poder truncar em silencio.

As 4 paginas de q_evento_wl foram escolhidas quando o recorte tinha NOVE
eventos. A janela aberta traz 47, e truncar ESTA consulta e o pior tipo de
falha do relatorio: nao da erro nenhum. O veiculo perde whitelabel, nao acha
loja elegivel (whitelabel e metade da regra) e sai da tela como "sem par" --
indistinguivel de um carro que de fato nao tem loja compativel.

Por que nao dimensionar como as outras: a fase 1 nao consegue. Ela MONTA as
consultas, nao le resultado -- as contagens que dimensionam (q_veic_total,
q_lojas_total) sao lidas pela fase 2. Mover q_evento_wl pra fase 2 seria o
desenho mais puro, mas arrasta a leitura no Montar HTML tambem.

A escolha aqui e mais barata e da a garantia que importa: a fase 1 conta os
pares (q_evwl_total) e a fase 2 CONFERE o que chegou contra a contagem. A
paginacao continua sendo um numero escolhido, mas passa a ser um numero
VERIFICADO -- se um dia faltar pagina, o run morre com a conta na mao em vez
de entregar relatorio errado calado.

Escrito com a ferramenta de arquivo, nao heredoc -- ver nota em
_link_anuncio.py.

    python _dimensiona_evwl.py
"""
import io
import os

AQUI = os.path.dirname(os.path.abspath(__file__))


def patch(nome, pares):
    P = os.path.join(AQUI, nome)
    s = io.open(P, encoding="utf-8").read()
    orig = s
    for velho, novo, rotulo in pares:
        if velho not in s:
            raise SystemExit("NAO ENCONTRADO em " + nome + ": " + rotulo)
        s = s.replace(velho, novo, 1)
        print("  ok  " + nome + ": " + rotulo)
    io.open(P, "w", encoding="utf-8").write(s)
    print("  -> " + nome + " mudou: " + str(s != orig))


# ── fase 1: conta os pares evento x whitelabel ────────────────────────────
patch("montar-fase1.js", [
    (
u"""/* quantas lojas têm histórico de oferta — dimensiona o perfil */""",
u"""/* quantos pares evento x whitelabel existem. Nao dimensiona a paginacao
   daqui (a fase 1 nao le resultado), mas deixa a fase 2 CONFERIR se a
   q_evento_wl veio inteira -- ver a nota na paginacao dela, abaixo. */
push('q_evwl_total',
  "SELECT COUNT(*) AS pares" +
  " FROM event_whitelabels ew" +
  " INNER JOIN events e ON e.id = ew.event_id AND" + SELECAO);

/* quantas lojas têm histórico de oferta — dimensiona o perfil */""",
        "q_evwl_total acrescentada"),
    (
u"""  /* 8 paginas, nao 4: as 4 anteriores dimensionavam NOVE eventos, e a
     janela aberta traz 47. Perder uma pagina aqui nao da erro -- so faz
     veiculo perder whitelabel e ficar sem loja elegivel, em silencio.
     Barato por ser join simples, nao agregado: pagina vazia nao custa o
     preco de um GROUP BY inteiro. */
  " ORDER BY ew.event_id, ew.whitelabel_id", 8);""",
u"""  /* 8 paginas, nao 4: as 4 anteriores dimensionavam NOVE eventos, e a
     janela aberta traz 47. Numero escolhido, mas VERIFICADO -- a fase 2
     confere contra q_evwl_total e mata o run se faltar pagina, em vez de
     deixar veiculo perder whitelabel calado. Barato por ser join simples,
     nao agregado: pagina vazia nao custa um GROUP BY inteiro. */
  " ORDER BY ew.event_id, ew.whitelabel_id", 8);""",
        "nota da paginacao aponta pra conferencia"),
])

# ── fase 2: confere ───────────────────────────────────────────────────────
patch("montar-fase2.js", [
    (
u"""if (LOJAS === 0) throw new Error('nenhuma loja com oferta na janela de historico');""",
u"""if (LOJAS === 0) throw new Error('nenhuma loja com oferta na janela de historico');

/* q_evento_wl e paginada por numero escolhido na fase 1. Truncar ali nao da
   erro: o veiculo perde whitelabel e vira "sem loja elegivel", que na tela
   fica igual a um carro sem loja compativel de verdade. Entao confere. */
const EVWL_ESPERADO = Number((leitura('q_evwl_total')[0] || {}).pares);
if (Number.isFinite(EVWL_ESPERADO) && eventoWl.length !== EVWL_ESPERADO) {
  throw new Error('q_evento_wl veio incompleta: ' + eventoWl.length +
    ' pares evento x whitelabel de ' + EVWL_ESPERADO +
    '. Aumente as paginas dela na fase 1 (whitelabel e metade da regra de ' +
    'elegibilidade -- faltar par faz veiculo perder loja em silencio).');
}""",
        "confere eventoWl contra a contagem"),
])
