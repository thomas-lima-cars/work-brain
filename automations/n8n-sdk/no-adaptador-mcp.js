/* ══════════════════════════════════════════════════════════════════
   NÓ "MCP Run" — ADAPTADOR  (arquitetura B, 2026-09-04)

   Par do nó "Montar Queries" (adaptador). Repassa as respostas do MCP real
   ("MCP Exec") e acrescenta, no fim e NA MESMA ORDEM, as respostas
   sintéticas de 'kpi' e 'situacao', derivadas da coorte.

   Por que dá pra derivar: a coorte devolve uma linha por safra (mês de
   cadastro). As safras são partições DISJUNTAS — cada cliente tem
   exatamente um mês de cadastro — então somar os meses reproduz os totais
   que a query `kpi` dava. Conferido na execução 48437: soma = 29.010, e
   s1..s6 fecham no mesmo número.

   O formato tem que ser {columns:[...], rows:[[...]]}, porque o zipn() do
   gerador cruza columns com rows para montar objetos.
   ══════════════════════════════════════════════════════════════════ */

const nomes = $('Montar Queries Base').all().map(function (i) { return i.json.queryName; });
const outs = $('MCP Exec').all();

/* junta todas as páginas da coorte num array de objetos */
const coorte = [];
for (let i = 0; i < nomes.length; i++) {
  if (nomes[i] !== 'coorte') continue;
  const sc = (outs[i] && outs[i].json && outs[i].json.structuredContent) || {};
  const cols = sc.columns || [];
  const rows = sc.rows || [];
  for (let r = 0; r < rows.length; r++) {
    const o = {};
    for (let c = 0; c < cols.length; c++) { o[cols[c]] = rows[r][c]; }
    coorte.push(o);
  }
}

function soma(campo) {
  let t = 0;
  for (let i = 0; i < coorte.length; i++) { t += Number(coorte[i][campo]) || 0; }
  return t;
}
function maximo(campo) {
  let m = null;
  for (let i = 0; i < coorte.length; i++) {
    const v = coorte[i][campo];
    if (v && (m === null || String(v) > String(m))) m = v;
  }
  return m;
}

const saida = outs.map(function (item) { return { json: item.json }; });

/* 'kpi' — os 9 campos que o Montar HTML realmente lê (medido por regex no
   gerador, não suposto). total_ofertas ficou de fora porque nenhum trecho
   do HTML o consome: era calculado e descartado já no original. */
saida.push({
  json: {
    structuredContent: {
      columns: ['total_base', 'com_login', 'ofertantes', 'compradores',
                'negociacoes', 'volume', 'ultima_compra', 'status7', 'status2'],
      rows: [[soma('total'), soma('com_login'), soma('ofertantes'), soma('compradores'),
              soma('negociacoes'), soma('volume'), maximo('ultima_compra'),
              soma('vendido'), soma('status2')]]
    }
  }
});

/* 'situacao' — [{situation, qtd}] a partir de s1..s6 */
const linhasSitu = [];
for (let n = 1; n <= 6; n++) { linhasSitu.push([n, soma('s' + n)]); }
saida.push({
  json: { structuredContent: { columns: ['situation', 'qtd'], rows: linhasSitu } }
});

return saida;
