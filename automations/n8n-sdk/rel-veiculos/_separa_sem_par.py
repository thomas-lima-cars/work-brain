# -*- coding: utf-8 -*-
r"""Separa as TRES causas de "sem correspondencia", que hoje viram uma so.

Medido no run 50106: 259 dos 1.123 veiculos (23%) ficaram sem par, e o
relatorio declara isso numa frase unica -- "ou nao ha loja na mesma UF e
whitelabel, ou nenhuma passou da correspondencia minima". Analisando o
dados-50106.json, os 259 sao tres populacoes com causas opostas:

   108  o CANAL do evento nao tem loja nenhuma, em UF alguma
         (Evento Especial LM, Colaboradores Bemol, Apeop Associados,
          Clube FMP, Canal de vendas Omni -- canais de pessoa fisica:
          colaborador, associado, clube. "Loja compradora" nao existe
          como categoria ali.)
    52  ha loja no canal, mas nenhuma naquela UF
    99  havia loja elegivel e o CORTE de 50% cortou

Por que isso importa e nao e cosmetico: para os 108 a frase atual ENGANA.
Ela sugere que se procurou e nao se achou nada bom, quando na verdade a
busca era impossivel por construcao. E quem le "23% sem correspondencia"
conclui que o corte esta alto -- mas baixar o corte so mexe em 99 deles.

O que muda:
  - cada veiculo passa a publicar `elegiveis` (lojas que passaram na regra
    de UF + whitelabel, ANTES do corte) e `canal_sem_loja`;
  - as falhas declaram as tres populacoes separadamente;
  - o KPI "sem correspondencia" passa a contar so quem PODIA ter par, e os
    impossiveis ganham KPI proprio, em cinza -- numero que nao e culpa de
    ninguem nao deve aparecer em vermelho.

    python _separa_sem_par.py
"""
import io
import os
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

AQUI = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(AQUI, "montar-html.js")
s = io.open(P, encoding="utf-8").read()
orig = s


def troca(velho, novo, rotulo):
    global s
    if velho not in s:
        raise SystemExit("NAO ENCONTRADO: " + rotulo)
    s = s.replace(velho, novo, 1)
    print("  ok  " + rotulo)


# 1) conjunto de whitelabels que TEM loja no universo (nao so entre as publicadas)
troca(
"""let descartados = 0;       /* pares que existiam mas nao chegaram a CORRESP_MIN */""",
"""/* Canais que tem PELO MENOS UMA loja no universo inteiro (as 1.303), nao
   so entre as publicadas. Evento que alveja unicamente canal de pessoa
   fisica -- colaborador, associado, clube -- nao tem loja compradora
   possivel, e o veiculo dele nunca vai ter par. Isso e categoria, nao
   falta de aderencia, e a tela tem que dizer a diferenca. */
const wlComLoja = {};
lojasTodas.forEach((l) => { wlComLoja[String(l.whitelabel_id)] = 1; });

let descartados = 0;       /* pares que existiam mas nao chegaram a CORRESP_MIN */""",
    "conjunto wlComLoja")

# 2) contar elegiveis antes do corte, e marcar canal sem loja
troca(
"""  let n = 0;
  for (let i = 0; i < cands.length; i++) {
    const l = lojasTodas[cands[i]];
    if (!wlSet[String(l.whitelabel_id)]) continue;   /* whitelabel do evento */
    const r = pontua(v, l);
    if (!r || !(r.score >= CORRESP_MIN)) { if (r) descartados++; continue; }
    pares.push(vi, cands[i], Math.round(r.score * 10));
    detPares.push(r.det);
    usadas[cands[i]] = 1;
    n++;
  }
  v.candidatos = n;
});""",
"""  let n = 0;
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
    "conta elegiveis e marca canal_sem_loja")

# 3) as falhas param de misturar as tres populacoes
troca(
"""const semPar = veiculos.filter((v) => !v.candidatos).length;
if (semPar) {
  falhas.push(semPar + ' veiculo(s) sem nenhuma loja: ou nao ha loja na mesma UF e whitelabel, ' +
    'ou nenhuma passou da correspondencia minima de ' + CORRESP_MIN + '%');
}""",
"""/* Tres populacoes, tres causas, tres decisoes diferentes. Declarar as tres
   como uma frase so fez o run 50106 parecer ter 23% de buraco, quando 9,6%
   era impossivel por construcao e so 8,8% responde ao limiar. */
const semCanal = veiculos.filter((v) => v.canal_sem_loja).length;
const semNaUf = veiculos.filter((v) => !v.canal_sem_loja && !v.elegiveis).length;
const cortadosPeloMin = veiculos.filter((v) => v.elegiveis && !v.candidatos).length;
const semPar = veiculos.filter((v) => !v.candidatos).length;
if (semCanal) {
  falhas.push(semCanal + ' veiculo(s) em evento cujo canal NAO TEM loja alguma ' +
    '(canal de pessoa fisica: colaborador, associado, clube). Par impossivel por ' +
    'construcao — nao e falta de aderencia, e categoria.');
}
if (semNaUf) {
  falhas.push(semNaUf + ' veiculo(s) sem nenhuma loja do canal na UF do patio.');
}
if (cortadosPeloMin) {
  falhas.push(cortadosPeloMin + ' veiculo(s) TINHAM loja elegivel, mas nenhuma ' +
    'passou da correspondencia minima de ' + CORRESP_MIN + '% — sao estes, e so ' +
    'estes, que mudariam se o corte baixasse.');
}""",
    "falhas separam as tres causas")

# 4) o resumo publica a quebra
troca(
"""    sem_par: semPar,""",
"""    sem_par: semPar,
    sem_canal: semCanal,
    sem_loja_na_uf: semNaUf,
    cortados_pelo_min: cortadosPeloMin,""",
    "resumo publica a quebra")

io.open(P, "w", encoding="utf-8").write(s)
print("mudou: " + str(s != orig))
