# `n8n-sdk/` — workflows como código

Definições de workflow no **n8n Workflow SDK** (`@n8n/workflow-sdk`), do jeito que
`create_workflow_from_code` consome. Diferente de `../n8n-code/`, que guarda só o
conteúdo de nós Code isolados.

| Arquivo | Workflow de origem | Observação |
|---|---|---|
| `auditoria-estoque-loja.wf.ts` | 🟩 Auditoria de Estoque por Loja (`vxyzWHfrcIR2gdsd`) | Gerou a cópia `GgjVZlU04wvJzLbK` no projeto pessoal do Thomas. Fidelidade verificada por MD5. |

## Cuidados

- O SDK é um **subset restrito de TS**: sem arrow function, loop, `try`, `new`; só `const`;
  sem métodos nativos de array/string exceto `.repeat()`/`.trim()` e `JSON.stringify`.
  Isso vale pro código do SDK, **não** pro `jsCode` embutido nos nós Code.
- **Sempre conferir MD5** dos `jsCode` contra a origem depois de criar. O nó "Montar HTML"
  contém um logo em base64 (~8876 chars) — um caractere trocado passa silencioso.
- Credenciais entram por `newCredential('Nome', 'ID')` reusando o ID exato. Nunca inventar ID.
- Procedimento completo em `../n8n-ambiente-cars2you.md`, seção 5.
