# -*- coding: utf-8 -*-
"""Documenta a publicacao no SharePoint no README do rel-veiculos.

Escrito com a ferramenta Write, nunca por heredoc: o heredoc do bash come
uma barra invertida MESMO citado (<<'FIM'), e este projeto ja pagou por isso.

GRAVACAO ATOMICA, e o motivo e uma cicatriz fresca: `io.open(P, "w")`
TRUNCA o arquivo na abertura, antes do `.write()`. Uma versao anterior
deste patch levantou UnicodeEncodeError no meio da escrita e deixou o
README com ZERO byte -- recuperado do indice do git. Aqui o texto novo vai
para um arquivo temporario e so entao substitui o original, entao falha no
meio deixa o original intacto.

Pelo mesmo motivo o texto usa caractere literal, nao escape \\uXXXX: par
substituto solto ("surrogate") nao codifica em utf-8, que foi exatamente a
excecao que truncou o arquivo.

    python _doc_sharepoint.py
"""
import io
import os
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

AQUI = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(AQUI, "README.md")

s = io.open(P, encoding="utf-8").read()
orig = s

# ── 1. a nota antiga sobre distribuicao virou decisao tomada ─────────────
velho = """⚠️ **O HTML foi a 3,3 MB.** Anexo de e-mail desse tamanho é arriscado — mesma questão já
aberta no C6 (que estava em 1,27 MB). SharePoint + link é a alternativa que já existe na
casa, como o IGA faz."""

novo = """⚠️ **O HTML foi a 4,1 MB.** Anexo de e-mail desse tamanho é arriscado — mesma questão já
aberta no C6 (que estava em 1,27 MB). **Resolvido em 2026-09-11: o relatório sobe no
SharePoint** (seção abaixo), como o IGA já faz."""

if s.count(velho) != 1:
    raise SystemExit("ANCORA AMBIGUA OU AUSENTE: nota de distribuicao (%d ocorrencias)"
                     % s.count(velho))
s = s.replace(velho, novo, 1)
print("  ok  nota de distribuicao atualizada")

# ── 2. secao nova, antes de "## Estado" ──────────────────────────────────
ancora = "## Estado"
if s.count(ancora) != 1:
    raise SystemExit("ANCORA AMBIGUA OU AUSENTE: '## Estado' (%d ocorrencias)"
                     % s.count(ancora))

secao = """## A publicação no SharePoint (2026-09-11)

Dois nós no fim da cadeia: `Montar HTML` → **`Virar Arquivo`** → **`Subir no SharePoint`**.

```
Relatorios Aderencia Veiculos/relatorio-aderencia-veiculos-AAAA-MM-DD.html
```

Site **N8N**, drive `b!WIoPIE-…`, credencial `AOTm9J6pFcF0DS6g`
(Conta PowerBI/Automações) — a mesma do IGA, do C6 e da Lista LM.

💡 **Endereçado por path, e path CRIA a pasta.**
`PUT /drives/{id}/root:/Pasta/arquivo.html:/content` cria "Pasta" se ela não existir —
medido nos fluxos C6. Dispensa descobrir `folderId` e sobrevive a alguém recriar a pasta.

🔴 **Host tem que ser `automakers.sharepoint.com/sites/N8N/_api/v2.0`.**
`graph.microsoft.com` dá **401 invalid-audience** com essa credencial. Já custou depuração
no IGA e na LM; está escrito na `notes` do nó.

⚠️ **A credencial tem que ser vinculada na interface.** O MCP do n8n não anexa credencial
predefinida em nó HTTP — ele avisa (`were skipped during credential auto-assignment`).
Mesma pendência que o `Listar Relatórios` do IGA e o `Subir no SharePoint` da LM tiveram.

### Por que `Virar Arquivo` é um Code node

🔴 **O `Convert to File` em modo `toBinary` espera base64**, e recebendo HTML em texto puro
gera um arquivo de **14 bytes com `status: success`**. Foi o que aconteceu na Lista LM em
25/08: o anexo saiu quebrado e sem erro nenhum.

Aqui o binário é montado à mão e conferido por duas guardas que **falham de verdade**:

| guarda | pega |
|---|---|
| `html` existe e tem ≥ 100 KB | `Montar HTML` que devolveu erro em vez de relatório |
| o base64 decodifica para os **mesmos bytes** da fonte | conversão que comeu conteúdo |

A segunda não é limiar chutado, é igualdade — e `_prova_virar_arquivo.js` **sabota o
`Buffer`** para provar que ela morde. 18 provas, sem tocar no banco nem no SharePoint.

⚠️ **O nome do arquivo é datado em hora de Brasília**, com o mesmo `FUSO_MIN = -180` do
`Montar Fase 1`. `new Date()` no nó responde em UTC: às 21h daqui o arquivo sairia datado
de amanhã. Três provas travam isso, uma delas exatamente às 23h.

### Um arquivo por dia, e o PUT substitui

Dois runs no mesmo dia geram **um arquivo só**, o do último. É de propósito: a pasta não
acumula lixo de teste. O custo é não haver histórico intradiário — se fizer falta,
acrescentar a hora ao `PREFIXO`.

💡 **Mexendo só na tela?** Desabilite o `Subir no SharePoint` no canvas, ou use o
`monta_html_de_dados.js`, que nem roda o workflow.

### Subir ≠ aparecer embutido numa página

O que estes dois nós entregam é **arquivo na pasta + link**. Renderizar o relatório
*dentro* de uma página do SharePoint é outro problema, e não está resolvido:

- o SharePoint Online moderno **não executa HTML de biblioteca de documentos** — o `.html`
  clicado baixa, não abre. O *custom script* que permitia isso foi aposentado pela
  Microsoft;
- a web part **Incorporar** aceita `<iframe>` de domínio em lista de permissão, não um
  bloco de 4 MB inline.

Para embutir, o HTML precisaria ser **servido** com `Content-Type: text/html` por um
domínio permitido — um `Respond to Webhook` do n8n, ou hospedagem estática.
🚨 **A rota do webhook esbarra em autenticação:** iframe não manda header, então a URL
ficaria pública para quem tivesse o link, com 732 nomes de loja reais dentro. Não fazer sem
decisão explícita do Thomas.

📐 **Medição que decide isso, e só o Thomas pode fazer:** abrir um
`relatorio_evento_IGA_*.html` pelo link do SharePoint. Se abrir no navegador, o tenant
ainda permite render e a conversa muda inteira; se baixar, está confirmado o acima.

"""

s = s.replace(ancora, secao + ancora, 1)
print("  ok  secao de publicacao acrescentada")

# ── gravacao atomica ─────────────────────────────────────────────────────
tmp = P + ".tmp"
with io.open(tmp, "w", encoding="utf-8") as f:
    f.write(s)
os.replace(tmp, P)

print("mudou: %s (%d -> %d bytes)" % (s != orig, len(orig), len(s)))
