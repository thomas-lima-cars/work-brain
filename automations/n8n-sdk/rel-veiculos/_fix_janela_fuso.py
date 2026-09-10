# -*- coding: utf-8 -*-
"""Corrige a janela de eventos: fuso do banco x fuso das datas.

O QUE A SONDA 49954 MOSTROU (nao e suposicao):

    q_relogio -> agora = 2026-09-10 01:51:56 | hoje = 2026-09-10

O relogio do BANCO esta em UTC. Mas as datas dos eventos estao gravadas em
hora de Brasilia, como texto sem fuso: o evento "Venda Direta IGA" fecha
`2026-09-10 16:00`, e o IGA fecha as 16h -- hora local. Os nomes dos eventos
("- 10/09/26") tambem batem com a data da coluna, nao com a UTC.

Ou seja: comparar `finish_date_event` com `NOW()` compara maca com laranja,
e a janela sempre esteve 3 horas adiantada. Nunca doeu porque o recorte era
frouxo, mas dói agora: as 22:51 de 9/09 em Brasilia o banco ja acha que e
dia 10, entao `CURDATE()` excluiria o dia 9 inteiro -- exatamente o que o
Thomas pediu pra incluir.

A CORRECAO: calcular o piso e o teto em hora de Brasilia, aqui no no, e
mandar para o SQL como literal. A aritmetica e feita sobre o epoch com
deslocamento explicito e lida com getUTC*, entao nao depende do fuso do
processo do n8n (que tambem e UTC) nem de tabela de fuso no MySQL.

    piso = meia-noite de HOJE em Brasilia   -> 2026-09-09 00:00:00
    teto = agora em Brasilia + HORAS_ADIANTE

Com isso "hoje" volta a significar o dia que o Thomas esta vivendo, e o
evento que fechou de manha continua na base.

    python _fix_janela_fuso.py
"""
import io
import os

AQUI = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(AQUI, "montar-fase1.js")
s = io.open(P, encoding="utf-8").read()
orig = s
feito = []


def troca(velho, novo, rotulo):
    global s
    if velho not in s:
        raise SystemExit("NAO ENCONTRADO (" + rotulo + ")")
    s = s.replace(velho, novo, 1)
    feito.append(rotulo)


# ── 1. o relogio de Brasilia, calculado sem depender do fuso do processo ──
troca(
"""const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const ini = new Date(now.getFullYear(), now.getMonth() - MESES_HISTORICO, now.getDate());
const DATA_INI = ini.getFullYear() + '-' + pad(ini.getMonth() + 1) + '-' + pad(ini.getDate());""",
"""/* ─── RELOGIO ────────────────────────────────────────────────────────────
   O banco responde NOW() em UTC (medido: sonda 49954, q_relogio devolveu
   2026-09-10 01:51 quando em Brasilia eram 22:51 do dia 9). Mas as datas
   dos eventos estao gravadas em hora de Brasilia. Entao NADA aqui pode
   usar NOW()/CURDATE() do banco pra recortar evento: o piso e o teto sao
   calculados aqui, em hora de Brasilia, e viajam como literal.

   O deslocamento e feito sobre o epoch e lido com getUTC*, entao o fuso do
   processo do n8n (tambem UTC) nao interfere. */
const FUSO_MIN = -180;               /* America/Sao_Paulo, sem horario de verao */
const pad = (n) => String(n).padStart(2, '0');
const now = new Date(Date.now() + FUSO_MIN * 60000);
const dataDe = (d) => d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
const horaDe = (d) => dataDe(d) + ' ' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':00';

const AGORA_BR = horaDe(now);
const HOJE_BR = dataDe(now);
const ini = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - MESES_HISTORICO, now.getUTCDate()));
const DATA_INI = dataDe(ini);

/* piso = meia-noite de hoje em Brasilia, pra evento que ja encerrou hoje
   continuar na base; teto = agora + HORAS_ADIANTE, tambem em Brasilia */
const PISO = INCLUI_ENCERRADOS_HOJE ? (HOJE_BR + ' 00:00:00') : AGORA_BR;
const TETO = horaDe(new Date(now.getTime() + HORAS_ADIANTE * 3600000));""",
"relogio em hora de Brasilia")

# ── 2. a selecao usa os literais, nao NOW()/CURDATE() ────────────────────
troca(
"""/* O PISO DA JANELA - onde eu ja errei uma vez.
   Com NOW(), evento que fechou mais cedo HOJE fica invisivel: foi assim que
   respondi "nenhum evento finaliza hoje" quando nove ja tinham fechado.
   CURDATE() e a meia-noite de hoje, entao o dia inteiro entra, encerrado ou
   nao, e o teto de HORAS_ADIANTE continua valendo pra frente. */
const PISO = INCLUI_ENCERRADOS_HOJE ? 'CURDATE()' : 'NOW()';

/* o filtro de evento, montado uma vez e reusado na fase 2 */
const SELECAO = EVENTOS_IDS.length
  ? " e.deleted_at IS NULL AND e.id IN (" + EVENTOS_IDS.join(',') + ")"
  : " e.deleted_at IS NULL AND e.status = 1" +
    " AND e.finish_date_event >= " + PISO +
    " AND e.finish_date_event <= DATE_ADD(NOW(), INTERVAL " + HORAS_ADIANTE + " HOUR)";""",
"""/* o filtro de evento, montado uma vez e reusado na fase 2.
   Erro que ja cometi: com o piso em NOW(), evento que fechou mais cedo no
   mesmo dia some, e eu respondi "nenhum evento finaliza hoje" quando nove
   ja tinham fechado. O piso agora e a meia-noite de hoje em Brasilia. */
const SELECAO = EVENTOS_IDS.length
  ? " e.deleted_at IS NULL AND e.id IN (" + EVENTOS_IDS.join(',') + ")"
  : " e.deleted_at IS NULL AND e.status = 1" +
    " AND e.finish_date_event >= '" + PISO + "'" +
    " AND e.finish_date_event <= '" + TETO + "'";""",
"selecao com literais em hora de Brasilia")

# ── 3. o cabecalho conta a historia certa ────────────────────────────────
troca(
"""   A janela vai da MEIA-NOITE DE HOJE até HORAS_ADIANTE à frente, então
   evento que já encerrou hoje continua na base (INCLUI_ENCERRADOS_HOJE).
   Pondo false, volta a contar só do instante atual pra frente.""",
"""   A janela vai da MEIA-NOITE DE HOJE EM BRASÍLIA até HORAS_ADIANTE à
   frente, então evento que já encerrou hoje continua na base
   (INCLUI_ENCERRADOS_HOJE). Pondo false, conta do instante atual pra frente.

   ⚠️ FUSO: o banco responde NOW() em UTC, mas grava as datas dos eventos em
   hora de Brasília — medido na sonda 49954. Por isso o recorte é calculado
   aqui e vai como literal; NÃO troque por NOW()/CURDATE(), que às 21h de
   Brasília já apontam para o dia seguinte e cortam o dia inteiro.""",
"nota de fuso no cabecalho")

# ── 4. META carrega o relogio, pra montar-html poder marcar o encerrado ──
troca(
"""const META = {
  selecao: SELECAO,""",
"""const META = {
  selecao: SELECAO,
  agora_br: AGORA_BR,
  janela_ini: PISO,
  janela_fim: TETO,""",
"META carrega o relogio e a janela")

io.open(P, "w", encoding="utf-8").write(s)
print("mudou: " + str(s != orig))
for r in feito:
    print("  ok  " + r)
