# -*- coding: utf-8 -*-
r"""As provas da janela acompanham a regra nova, em vez de serem afrouxadas.

A janela deixou de ser "meia-noite de hoje + 48h" e passou a ser "piso fixo,
sem teto" (pedido de 2026-09-10: finalizados a partir de 09/09 MAIS nao
finalizados). As duas provas que falharam falharam com razao -- elas
descreviam a regra antiga.

O que a prova nova exige, e que continua sendo o que importa:
  - o recorte NAO usa relogio de banco (a armadilha UTC-vs-Brasilia intacta);
  - o piso entra como literal e comeca a meia-noite;
  - SEM TETO significa SEM CLAUSULA: `finish_date_event <=` nao pode aparecer,
    senao evento nao finalizado de fim distante ficaria de fora em silencio
    -- que e exatamente o bug que a mudanca veio consertar;
  - e o modo de 48h continua provado, porque o codigo ainda o oferece: a
    prova monta o recorte com teto e confere que a clausula volta.

Este ultimo ponto e o que impede a mudanca de virar caminho unico sem volta.

Escrito com a ferramenta de arquivo, nao heredoc -- ver nota em
_link_anuncio.py.

    python _prova_janela_aberta.py
"""
import io
import os

AQUI = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(AQUI, "prova-local.js")
s = io.open(P, encoding="utf-8").read()
orig = s

VELHO = r"""  ok(sel1.indexOf(p1[0].meta.janela_ini) > 0 && sel1.indexOf(p1[0].meta.janela_fim) > 0,
     'modo janela: o recorte usa os literais em hora de Brasilia');
  ok(p1[0].meta.janela_ini.slice(11) === '00:00:00',
     'modo janela: piso = meia-noite, evento encerrado hoje continua na base');
  const hIni = Date.parse(p1[0].meta.janela_ini.replace(' ', 'T') + 'Z');
  const hFim = Date.parse(p1[0].meta.janela_fim.replace(' ', 'T') + 'Z');
  const horasJanela = (hFim - hIni) / 3600000;
  ok(horasJanela > 48 && horasJanela <= 72,
     'modo janela: cobre o dia corrente + 48h (' + horasJanela.toFixed(1) + 'h)');"""

NOVO = r"""  ok(sel1.indexOf(p1[0].meta.janela_ini) > 0,
     'modo janela: o piso entra como literal, nao como relogio do banco');
  ok(p1[0].meta.janela_ini.slice(11) === '00:00:00',
     'modo janela: piso = meia-noite, evento encerrado no dia continua na base');
  /* SEM TETO tem que significar SEM CLAUSULA. Se `finish_date_event <=`
     sobrasse no SQL com teto vazio, o recorte viraria
     "<= ''" e a base zeraria; e com teto qualquer, evento nao finalizado de
     fim distante ficaria de fora em silencio -- o bug que a mudanca de
     2026-09-10 veio consertar. */
  if (!p1[0].meta.janela_fim) {
    ok(sel1.indexOf('finish_date_event <=') < 0,
       'sem teto: a clausula de teto nao entra no SQL');
    ok(sel1.indexOf('finish_date_event >=') > 0,
       'sem teto: o piso continua valendo');
  } else {
    ok(sel1.indexOf(p1[0].meta.janela_fim) > 0,
       'com teto: o literal do teto entra no recorte');
    const hIni = Date.parse(p1[0].meta.janela_ini.replace(' ', 'T') + 'Z');
    const hFim = Date.parse(p1[0].meta.janela_fim.replace(' ', 'T') + 'Z');
    ok(hFim > hIni, 'com teto: o teto vem depois do piso');
  }"""

if VELHO not in s:
    raise SystemExit("NAO ENCONTRADO: bloco das provas de janela")
s = s.replace(VELHO, NOVO, 1)
print("  ok  provas de janela reescritas pra regra nova")

io.open(P, "w", encoding="utf-8").write(s)
print("mudou: " + str(s != orig))
