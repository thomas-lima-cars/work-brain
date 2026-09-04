# -*- coding: utf-8 -*-
"""Montar HTML — passa a ler `coorte` no lugar de `kpi` + `situacao`.

O port trocou essas duas queries pela coorte (lote 1b), entao o gerador
recebia lista vazia e renderizava zero em tudo.

ESTRATEGIA: um ADAPTADOR de 15 linhas no topo que remonta os MESMOS objetos
`kpi` e `situ` que o resto do arquivo ja esperava. As safras sao particoes
disjuntas (cada cliente tem 1 mes de cadastro), entao somar reproduz os
totais. Nada depois da linha 7 muda — blast radius minimo num arquivo de
87 KB que nao da pra revisar inteiro.

Campos que o gerador realmente le (medido por regex, nao suposto):
  kpi.: com_login, compradores, negociacoes, ofertantes, status2,
        status7, total_base, ultima_compra, volume
  situ: [{situation, qtd}]
`total_ofertas` NAO e lido por ninguem — era calculado e descartado ja no
original. Fica no dado, fora do HTML.
"""
import io, os, sys, hashlib
sys.stdout.reconfigure(encoding="utf-8")

HERE = os.path.dirname(os.path.abspath(__file__))
ORIG = r"C:\Users\thoma\Documents\work-brain\automations\n8n-sdk\nodes-originais\Montar_HTML.js"
src = io.open(ORIG, encoding="utf-8").read()
print("original: %d chars md5 %s" % (len(src), hashlib.md5(src.encode()).hexdigest()))

ALVO = "const kpi = zipn('kpi')[0] || {};\nconst situ = zipn('situacao');\n"
assert src.count(ALVO) == 1, "linhas 6-7 nao encontradas verbatim"

NOVO = """/* [port multi-WL, 2026-09-04] kpi e situacao foram substituidas pela query
   de coorte no lote 1b — a antiga estourava o deadline do MCP na escala da
   plataforma (10 subqueries independentes sobre 29.010 clientes).
   A coorte devolve 1 linha por safra (mes de cadastro). Como as safras sao
   particoes DISJUNTAS, somar os meses reproduz exatamente os totais que o
   kpi dava — e ainda deixa o dado pronto pra filtrar por safra no cliente.
   Este adaptador remonta os mesmos objetos que o resto do arquivo espera,
   entao nada abaixo desta linha precisou mudar. */
const coorte = zipn('coorte');
function _cSum(campo){
  let t = 0;
  for (let i = 0; i < coorte.length; i++){ t += Number(coorte[i][campo]) || 0; }
  return t;
}
function _cMax(campo){
  let m = null;
  for (let i = 0; i < coorte.length; i++){
    const v = coorte[i][campo];
    if (v && (m === null || String(v) > String(m))) m = v;
  }
  return m;
}
const kpi = {
  total_base:    _cSum('total'),
  com_login:     _cSum('com_login'),
  ofertantes:    _cSum('ofertantes'),
  compradores:   _cSum('compradores'),
  negociacoes:   _cSum('negociacoes'),
  volume:        _cSum('volume'),
  status7:       _cSum('vendido'),
  status2:       _cSum('status2'),
  ultima_compra: _cMax('ultima_compra')
};
const situ = [1,2,3,4,5,6].map(function(n){
  return { situation: n, qtd: _cSum('s' + n) };
});
"""

src = src.replace(ALVO, NOVO)
out = os.path.join(HERE, "Montar_HTML_coorte.js")
io.open(out, "w", encoding="utf-8", newline="").write(src)
print("patched : %d chars md5 %s" % (len(src), hashlib.md5(src.encode()).hexdigest()))
print("delta   : +%d chars" % (len(src) - 87306))
print()
print("PROVAS:")
print("  zipn('kpi') restante      :", src.count("zipn('kpi')"), "(tem que ser 0)")
print("  zipn('situacao') restante :", src.count("zipn('situacao')"), "(tem que ser 0)")
print("  zipn('coorte') presente   :", src.count("zipn('coorte')"))
print("  emoji trofeu preservado   :", src.count("\U0001F3C6"))
print("  U+00B7 preservados        :", src.count("\u00b7"))
print("  tags <svg preservadas     :", src.count("<svg"))
assert src.count("zipn('kpi')") == 0 and src.count("zipn('situacao')") == 0
print("\ngravado:", out)
