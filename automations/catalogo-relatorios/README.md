# Catálogo de Relatórios

Página com todos os relatórios das automações, separados por operação: o que cada um
mostra, quando roda, onde chega, para quem e em que situação está.

- **Artifact:** https://claude.ai/artifact/6PcahstRhTsxXVfUm4eXXZ (privado; compartilhar pelo menu Share)
- **Arquivo autossuficiente:** `catalogo-relatorios.html` — abre do SharePoint ou de um anexo

## Atualizar

1. Mexa em `relatorios.json` (um objeto por relatório; `ops` aceita mais de uma operação).
2. Rode `node automations/catalogo-relatorios/monta-catalogo.js`.
3. Republique o `_artifact/catalogo-relatorios.html` no mesmo link.

O visual vem de `design/modelos/dashboard-claro.html`: o gerador recorta dele a folha de
estilo, as logos e a troca de tema. Mexeu no `tema.css`? Regere os modelos e depois o
catálogo.

## O que entra

Tudo que uma automação entrega para alguém ler, mais os **insumos** que alimentam outro
relatório (marcados como tal). **Não entram:** gatilhos (aparecem no "quando roda" do
relatório que disparam), sondas, cópias de teste, TEMP e legados.

Inventário lido do n8n em 25/09/2026 (projeto Cars2You, 35 workflows).

## Em aberto

- **Links do SharePoint:** o brain só tem os caminhos da API, não os de navegador. O
  catálogo mostra o caminho da pasta em texto. Com os links de visualização, entram como
  link.
- **Cars2You — Envia Relatório** (`TKxpirO9fUg5KYcY`): ativo, conteúdo não documentado.
- **Carteira Comercial** (`ksZI8cqSbexqLOre`): aparece **inativa** no n8n em 25/09, mas o
  brain a dá como rodando às 06h desde 21/09.
