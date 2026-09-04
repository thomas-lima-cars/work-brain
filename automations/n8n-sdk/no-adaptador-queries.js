/* ══════════════════════════════════════════════════════════════════
   NÓ "Montar Queries" — ADAPTADOR  (arquitetura B, 2026-09-04)

   Por que este nó existe:
   O `Montar HTML` tem 87 KB e o update_workflow do MCP só aceita o jsCode
   inline — esse literal sozinho passa de 50 mil tokens, mais do que cabe
   numa mensagem. Ou seja: aquele nó NÃO PODE ser reescrito pela API.

   Solução: em vez de mudar o gerador, mudamos o que ele lê. O `Montar HTML`
   busca `$('Montar Queries')` e `$('MCP Run')` pelo NOME. Renomeamos os nós
   reais para "Montar Queries Base" e "MCP Exec", e pusemos dois adaptadores
   pequenos com os nomes antigos. O gerador continua byte-idêntico à produção
   (md5 9e570f948b630938665d9e9486b77b6c) e nunca mais precisa ser
   retransmitido por mudança de formato de dado.

   O que este faz: repassa a lista de queryNames do builder real e ACRESCENTA
   'kpi' e 'situacao' no fim — as duas que o lote 1b substituiu pela coorte.
   O nó "MCP Run" (adaptador) acrescenta as respostas correspondentes, na
   mesma ordem. Os dois têm que casar índice a índice: o zipn() do gerador
   cruza qn[i] com outs[i].
   ══════════════════════════════════════════════════════════════════ */

const base = $('Montar Queries Base').all();

const saida = base.map(function (item) {
  return { json: item.json };
});

/* As duas sintéticas, na MESMA ordem do adaptador de MCP Run. */
saida.push({ json: { queryName: 'kpi', database: 'cars2you_production', sql: '/* sintetizada da coorte */' } });
saida.push({ json: { queryName: 'situacao', database: 'cars2you_production', sql: '/* sintetizada da coorte */' } });

return saida;
