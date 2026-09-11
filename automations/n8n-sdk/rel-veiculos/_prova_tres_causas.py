# -*- coding: utf-8 -*-
r"""Prova as TRES causas de "sem correspondencia", cada uma com um caso real.

Sem um veiculo em canal ORFAO no dado sintetico, a categoria que mais
importa -- a dos 108 veiculos do run 50106 cujo canal nao tem loja alguma --
nunca seria exercitada, e a suite passaria por cima dela.

O fixture ganha:
  - um evento (23904) que alveja o whitelabel 62, e NENHUMA loja tem 62;
  - um veiculo nesse evento, em SP, com perfil identico ao v0 -- de
    proposito: em SP ha lojas boas, entao se ele ficasse sem par por causa
    de UF ou de aderencia o teste nao provaria nada. Ele fica sem par
    exclusivamente porque o CANAL nao tem loja.

As tres populacoes ja presentes depois disto:
  canal sem loja  -> o veiculo novo (wl 62)
  sem loja na UF  -> o v3, que esta no RJ e nao ha loja no RJ
  cortado pelo min-> quem tem loja elegivel mas fica abaixo de 50

Nota sobre a estimativa: a quebra 108/52/99 que motivou isto foi calculada
LOCALMENTE sobre o dados-50106.json, usando as lojas PUBLICADAS (728) como
proxy do universo. O no usa o universo inteiro (1.303), entao o numero de
"canal sem loja" pode encolher -- canal que tem loja no universo mas nenhuma
publicada cai em "sem loja na UF", nao em "canal sem loja". Quem da o numero
exato e o run, nao a estimativa.

    python _prova_tres_causas.py
"""
import io
import os
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

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


# 1) evento novo, num canal que nenhuma loja atende
troca(
"""const EVENTOS = [[23885, 'Feirao VWFS', 1, '2026-09-08 16:00', '2026-09-10 14:00'],
                 [23903, 'Venda Direta IGA', 1, '2026-09-09 10:00', '2026-09-10 16:00']];
/* 23885 alveja so o whitelabel 7; 23903 alveja 4 e 7 */
const EVWL = [[23885, 7, 'Marketplace'], [23903, 4, 'Trucks2you'], [23903, 7, 'Marketplace']];""",
"""const EVENTOS = [[23885, 'Feirao VWFS', 1, '2026-09-08 16:00', '2026-09-10 14:00'],
                 [23903, 'Venda Direta IGA', 1, '2026-09-09 10:00', '2026-09-10 16:00'],
                 /* canal de pessoa fisica: existe evento, nao existe loja */
                 [23904, 'Clube de Associados', 1, '2026-09-09 10:00', '2026-09-11 16:00']];
/* 23885 alveja so o whitelabel 7; 23903 alveja 4 e 7.
   23904 alveja o 62, que NENHUMA loja do universo tem -- e o caso dos 108
   veiculos do run 50106 (Bemol, Apeop, Clube FMP, Omni, Especial LM). */
const EVWL = [[23885, 7, 'Marketplace'], [23903, 4, 'Trucks2you'], [23903, 7, 'Marketplace'],
              [23904, 62, 'Clube Associados']];""",
    "evento 23904 num canal orfao")

# 2) o veiculo desse evento. Perfil igual ao v0 e em SP: se ficasse sem par
#    por UF ou por aderencia, o teste nao provaria nada.
troca(
"""const VEIC = [""",
"""const VEIC = [
  /* v_orfao: SP, perfil identico ao v0 (onde HA lojas boas), mas no evento
     23904, cujo canal nao tem loja alguma. Fica sem par exclusivamente por
     causa do canal -- e e isso que a prova precisa isolar. */
  [7, 23904, 'Clube de Associados', '2026-09-11 16:00', 906, 5006, 100000, null, 105000, 501, 'Onix', 1, 'Automovel', 'Chevrolet', 'LT 1.0 Flex 12V 5p', 'aaaa9999bbbb8888cccc7777dddd6666', ANO - 5, 100000, 700, 'Vendedora', 'SP', 1],""",
    "veiculo em canal orfao")

# 3) as provas
ANCORA = "\n/* ── a fonte nao pode reacumular barra invertida ─"
PROVAS = """
/* ── as TRES causas de "sem correspondencia" ───────────────────────────── */
console.log('\\n[10] sem correspondencia: tres causas, tres decisoes');
const R = D.resumo;
/* Declarar as tres como uma frase so fez o run 50106 parecer ter 23% de
   buraco, quando 9,6% era impossivel por construcao e so 8,8% respondia ao
   limiar. Baixar o corte nao mexe nas outras duas populacoes. */
ok(R.sem_canal + R.sem_loja_na_uf + R.cortados_pelo_min === R.sem_par,
   'as tres causas somam exatamente o total sem par (' + R.sem_canal + '+' +
   R.sem_loja_na_uf + '+' + R.cortados_pelo_min + '=' + R.sem_par + ')');

const orfao = D.veiculos.find((v) => v.vehicle_id === 5006);
ok(!!orfao, 'o veiculo do canal orfao chegou ao relatorio');
ok(orfao.canal_sem_loja === true, 'ele esta marcado como canal sem loja');
ok(orfao.elegiveis === 0, 'e nenhuma loja passou na regra de elegibilidade');
ok(orfao.uf === 'SP', 'ele esta em SP DE PROPOSITO — onde ha lojas boas, ' +
   'entao a causa so pode ser o canal');
ok(R.sem_canal === 1, 'exatamente 1 veiculo em canal sem loja');

/* as categorias tem que ser mutuamente exclusivas, senao a soma acima
   fecharia por acaso */
const duplaCategoria = D.veiculos.filter((v) => v.canal_sem_loja && v.elegiveis > 0).length;
ok(duplaCategoria === 0, 'nenhum veiculo cai em duas categorias ao mesmo tempo');

/* e o texto tem que dizer QUAL causa, nao "ou uma ou outra" */
const txt = D.falhas.join(' | ');
ok(txt.indexOf('canal NAO TEM loja alguma') >= 0,
   'a falha nomeia o canal sem loja em vez de generalizar');
ok(txt.indexOf('e so ' + 'estes, que mudariam se o corte baixasse') >= 0 ||
   txt.indexOf('mudariam se o corte baixasse') >= 0 ||
   R.cortados_pelo_min === 0,
   'a falha do corte diz que so ela responde ao limiar');
"""

if ANCORA not in s:
    raise SystemExit("NAO ENCONTRADO: ancora do bloco de barras invertidas")
s = s.replace(ANCORA, PROVAS + ANCORA, 1)
print("  ok  bloco [10] de provas acrescentado")

io.open(P, "w", encoding="utf-8").write(s)
print("mudou: " + str(s != orig))
