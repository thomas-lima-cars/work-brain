# -*- coding: utf-8 -*-
r"""O relatorio confere que cada id de canal e o canal que se pensa que e.

O recorte de 2026-09-11 restringe a base a seis whitelabels POR ID. Dois
deles -- 48 (Colaboradores C6) e 65 (Lance Facil BTB Associados) -- vieram
da documentacao do brain, que declara seus numeros como inferidos, e nenhum
aparecia na janela atual, entao nao deu pra confirmar pelo dado.

Id errado nao da erro de SQL: `IN (4,7,43,99,62,65)` roda liso e devolve uma
base menor. O canal simplesmente some, e o relatorio fica plausivel -- que e
o pior tipo de defeito.

Entao a fase 1 pergunta ao banco o nome de cada id (`q_wl_nomes`) e aqui se
confere contra o nome esperado. Divergiu, ou id que nao existe, vira falha
declarada no topo da tela.

    python _confere_canais.py
"""
import io
import os
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
AQUI = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(AQUI, "montar-html.js")
s = io.open(P, encoding="utf-8").read()
orig = s

VELHO = """const semWl = veiculos.filter((v) => !v.wls.length).length;"""

NOVO = """/* ── os canais do recorte sao mesmo os que eu penso? ───────────────────
   O recorte e por ID, e id errado nao da erro de SQL: a base so vem menor,
   com um canal faltando, e parece plausivel. A fase 1 perguntou o nome de
   cada id ao banco; aqui se confere contra o nome esperado. */
const wlEsperado = META.wl_esperado || {};
const wlBanco = {};
(META.wl_nomes_banco || []).forEach((r) => {
  wlBanco[String(r.whitelabel_id)] = r.whitelabel;
});
const wlIds = Object.keys(wlEsperado);
if (wlIds.length) {
  const sumiram = wlIds.filter((id) => !wlBanco[id]);
  if (sumiram.length) {
    falhas.push('whitelabel(s) que o recorte pede mas o banco nao tem: ' +
      sumiram.map((id) => id + ' (esperado "' + wlEsperado[id] + '")').join(', ') +
      ' — o canal sumiu da base inteira sem dar erro de SQL.');
  }
  const trocados = wlIds.filter((id) => wlBanco[id] && wlBanco[id] !== wlEsperado[id]);
  if (trocados.length) {
    falhas.push('whitelabel(s) com nome diferente do esperado: ' +
      trocados.map((id) => id + ' e "' + wlBanco[id] + '", nao "' + wlEsperado[id] + '"').join('; ') +
      ' — confira se o id ainda aponta pro canal certo.');
  }
}

const semWl = veiculos.filter((v) => !v.wls.length).length;"""

if VELHO not in s:
    raise SystemExit("NAO ENCONTRADO: ancora do semWl")
s = s.replace(VELHO, NOVO, 1)
print("  ok  conferencia de nome x id dos canais")

# publica o recorte no DADOS, pra tela e pra conferencia posterior
V2 = """  parametros: {
    confianca_min: CONFIANCA_MIN,
    corresp_min: CORRESP_MIN,"""
N2 = """  parametros: {
    confianca_min: CONFIANCA_MIN,
    corresp_min: CORRESP_MIN,
    whitelabels: META.whitelabels || [],
    wl_esperado: wlEsperado,"""
if V2 not in s:
    raise SystemExit("NAO ENCONTRADO: bloco parametros")
s = s.replace(V2, N2, 1)
print("  ok  parametros publicam o recorte de canal")

io.open(P, "w", encoding="utf-8").write(s)
print("mudou: " + str(s != orig))
