# -*- coding: utf-8 -*-
"""LOTE 1f — coorte_wl fatiada por ANO DE CADASTRO.

Por que a versao anterior morreu (execucao 48476, 67s):
  `(BEXT) b INNER JOIN user_whitelabels uw ... GROUP BY wl, nome, ym` com
  LIMIT/OFFSET. Cada uma das 16 paginas recalculava o universo INTEIRO —
  29.010 usuarios, dois EXISTS cada — pra depois descartar 50 linhas.

Por que fatiar por ANO e melhor que fatiar por faixa de whitelabel_id
(medido em mede_shards.py, nao chutado):
  - Por faixa de id: os WLs grandes se concentram nos ids baixos. A fatia
    1-10 fica com 304 das 516 linhas (59%). E, pior, o filtro age DEPOIS
    do BEXT — todo shard ainda varre os 29.010.
  - Por ano: o filtro vira `u.created_at >= 'YYYY-01-01' AND < ...` DENTRO
    do BEXT. Os EXISTS rodam sobre 1/7 da base. Maior fatia: 6.797
    usuarios (23%), 92 linhas. Distribuicao equilibrada.

3 paginas por ano = 150 linhas de teto contra 92 medidas (folga de 1,6x,
que e a convencao do arquivo original).
"""
import io, os, re, sys, hashlib
sys.stdout.reconfigure(encoding="utf-8")

HERE = os.path.dirname(os.path.abspath(__file__))
LOTE1D = r"C:\Users\thoma\Documents\work-brain\automations\n8n-sdk\montar-queries-LOTE1d.js"
src = io.open(LOTE1D, encoding="utf-8").read()
print("base: lote 1d (validado na 48437) — md5 %s\n" % hashlib.md5(src.encode()).hexdigest())

BLOCO = '''
/* [lote 1f] COORTE POR WHITELABEL — fatiada por ANO DE CADASTRO.
   E o que faz o seletor de whitelabel funcionar.

   A versao com LIMIT/OFFSET sobre o universo inteiro estourou o deadline do
   MCP (execucao 48476, 67s): cada pagina recalculava os 29.010 usuarios do
   BEXT — dois EXISTS cada — pra descartar 50 linhas.

   Aqui o recorte de ano entra DENTRO do BEXT, como filtro em u.created_at,
   que e indexado. Cada consulta monta um BEXT de ~1/7 do tamanho. Medido no
   coorte_wl.json do prototipo: maior fatia = 6.797 usuarios / 92 linhas.

   Fatiar por faixa de whitelabel_id foi descartado: os WLs grandes se
   concentram nos ids baixos (a faixa 1-10 tem 59% das linhas) e o filtro so
   agiria depois do BEXT montado — nao economiza o que custa. */
const ANO_INI_WL = 2019;
for (let ano = ANO_INI_WL; ano <= ANO; ano++) {
  const bextAno = BEXT + " AND u.created_at >= '" + ano + "-01-01'" +
    " AND u.created_at < '" + (ano + 1) + "-01-01'";
  pushPaged('coorte_wl',
    "SELECT uw.whitelabel_id wl, w.name wl_name, b.ym, " + METRICS +
    " FROM (" + bextAno + ") b" +
    " INNER JOIN user_whitelabels uw ON uw.user_id = b.uid" +
    " INNER JOIN whitelabels w ON w.id = uw.whitelabel_id" +
    " LEFT JOIN (" + PC + ") pc ON pc.uid = b.uid" +
    " GROUP BY uw.whitelabel_id, w.name, b.ym ORDER BY uw.whitelabel_id, b.ym",
    3);
}

'''

anc = "pushPaged('kpi_ofertas',"
i = src.index(anc)
fim = src.index("  1);", i) + len("  1);\n")
src = src[:fim] + BLOCO + src[fim:]
print("E14 coorte_wl fatiada por ano, inserida apos kpi_ofertas")

old = "const PRIMEIRO = ['coorte', 'kpi_ofertas'];"
assert src.count(old) == 1
src = src.replace(old, "const PRIMEIRO = ['coorte', 'coorte_wl', 'kpi_ofertas'];")
print("E15 coorte_wl na frente da fila")

out = os.path.join(HERE, "montar_queries_lote1f.js")
io.open(out, "w", encoding="utf-8", newline="").write(src)
print("\ngravado: %s\n%d chars md5 %s" % (out, len(src), hashlib.md5(src.encode()).hexdigest()))
