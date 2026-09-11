# -*- coding: utf-8 -*-
"""Janela nova: tudo que encerrou a partir de 09/09/2026 MAIS o que nao encerrou.

Pedido do Thomas em 2026-09-10. Um piso fixo com teto nenhum cobre os dois
casos de uma vez: evento encerrado depois de 09/09 tem finish no passado
recente, evento nao encerrado tem finish no futuro. Os dois satisfazem
`finish_date_event >= '2026-09-09'`.

Medido antes de escrever (sonda 50068, q_janela_nova / q_eventos_novos):
47 eventos, 1.060 veiculos, 1.740 negociacoes -- contra 735 veiculos do run
49984. E a cauda longa: sem teto entram Mega Feirao da Virada (fim 12/12),
Banco GM, OMNI, VWFS, Apeop, Clube FMP, e "Em preparacao Net Carros" com
UM veiculo e fim em 23/08/2027. Entram de proposito -- "nao finalizados"
nao tem teto. O filtro de evento na pagina e a saida pra isolar.

De quebra ESVAZIA EVENTOS_IDS, que estava pregado nos nove eventos de 09/09
e fazia todo run devolver aquele recorte em vez da regra.

Fuso: PISO_FIXO e literal e vai cru pro SQL, entao a armadilha UTC-vs-Brasilia
nao se aplica ao piso -- a data e interpretada como hora local, que e como o
banco grava finish_date_event. O relogio de Brasilia continua sendo calculado
porque AGORA_BR marca quem ja encerrou e HOJE_BR serve o modo de 48h.

    python _janela_aberta.py
"""
import io
import os

AQUI = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(AQUI, "montar-fase1.js")
s = io.open(P, encoding="utf-8").read()
orig = s


def troca(velho, novo, rotulo):
    global s
    if velho not in s:
        raise SystemExit("NAO ENCONTRADO: " + rotulo)
    s = s.replace(velho, novo, 1)
    print("  ok  " + rotulo)


troca(
    u"const EVENTOS_IDS = [23882, 23890, 23891, 23892, 23860, 23884, 23887, 23888, 23889];\n"
    u"const HORAS_ADIANTE = 48;\n",
    u"const EVENTOS_IDS = [];\n"
    u"/* piso fixo do recorte, em hora de Brasilia (pedido de 2026-09-10:\n"
    u"   \"todos os eventos finalizados a partir do dia 09/09 e nao finalizados\").\n"
    u"   Vazio => volta a valer a meia-noite de hoje. */\n"
    u"const PISO_FIXO = '2026-09-09';\n"
    u"/* 0 = SEM TETO. Com teto, evento que ainda nao encerrou mas termina depois\n"
    u"   da janela ficaria de fora -- e \"nao finalizados\" nao tem teto. */\n"
    u"const HORAS_ADIANTE = 0;\n",
    "EVENTOS_IDS vazio, PISO_FIXO e HORAS_ADIANTE = 0")

troca(
    u"const PISO = INCLUI_ENCERRADOS_HOJE ? (HOJE_BR + ' 00:00:00') : AGORA_BR;\n"
    u"const TETO = horaDe(new Date(now.getTime() + HORAS_ADIANTE * 3600000));",
    u"const PISO = PISO_FIXO\n"
    u"  ? (PISO_FIXO + ' 00:00:00')\n"
    u"  : (INCLUI_ENCERRADOS_HOJE ? (HOJE_BR + ' 00:00:00') : AGORA_BR);\n"
    u"/* string vazia = sem teto, e a clausula nem entra no SQL */\n"
    u"const TETO = HORAS_ADIANTE > 0\n"
    u"  ? horaDe(new Date(now.getTime() + HORAS_ADIANTE * 3600000))\n"
    u"  : '';",
    "PISO respeita PISO_FIXO e TETO pode ser vazio")

troca(
    u"    \" AND e.finish_date_event >= '\" + PISO + \"'\" +\n"
    u"    \" AND e.finish_date_event <= '\" + TETO + \"'\";",
    u"    \" AND e.finish_date_event >= '\" + PISO + \"'\" +\n"
    u"    (TETO ? \" AND e.finish_date_event <= '\" + TETO + \"'\" : \"\");",
    "SELECAO omite o teto quando nao ha teto")

io.open(P, "w", encoding="utf-8").write(s)
print("mudou: " + str(s != orig))
