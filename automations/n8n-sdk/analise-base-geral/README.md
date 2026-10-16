# `analise-base-geral/` — Análise de Base de Clientes, 6 canais

Reconstrução do HTML "Analise_base_geral_clientes - Versão A" (gerado em
04/09/2026, 21.772 clientes em 6 canais) como workflow n8n no projeto pessoal
do Thomas, com envio para `thomas.lima@cars2you.com.br`.

**Origem:** o gerador original deste HTML não está no repo nem no n8n. O
template é o próprio HTML (dado trocado por marcador); as consultas vêm do
relatório do C6 Lojista (`f6Bw2iiuaWECy9Uz`), parametrizadas por canal.

| Arquivo | O quê |
|---|---|
| `extrai_template.py` | Tira `template.html` e `constantes.json` (SITU, TIPS) do HTML original |
| `montar-queries.js` | Nó Code: 14 consultas × 6 canais = 84 chamadas ao MCP |
| `montar-html.js` | Nó Code: respostas do MCP → objeto `D` → HTML |
| `gen_wf.py` | Gera `analise-base-geral.wf.ts` (nós Code embutidos) |
| `prova-local.js` | Prova sem banco: remonta o `D` a partir da Versão A e compara |

Canais (whitelabel): 7 Marketplace Cars2You, 48 Colaboradores C6, 43 Canal de
vendas C6 Auto, 4 Trucks2you, 65 Lance Fácil BTB Associados, 62 Lance Fácil BTB.

## O que a prova local garante e o que não

- ✓ Aritmética de montagem: `kpi`, `situacao`, `recencia`, `evolucao`,
  `volume`, `uf`, `top` e as coortes saem idênticos aos da Versão A.
- ✗ **Não prova o SQL.** O banco da Cars2You só responde pelo nó MCP do n8n.
  A primeira execução confere os números contra a Versão A (a base se move
  desde 04/09, então esperar diferença pequena, não zero).
- Ponto a calibrar: o texto da Versão A diz que, onde o anunciante é dono do
  canal, o e-mail corporativo dele também sai. Só o `@c6bank.com` (fora do
  canal 48) e o `@cars2you` estão tratados; Trucks2you e Lance Fácil podem ter
  um domínio próprio a excluir. Comparar `total_base` de cada canal com
  14.747 / 3.074 / 2.922 / 782 / 156 / 91.
- A Versão A guardou a coorte de janela em formato antigo (sem `cadastrados`
  nem `mad*`); o workflow já traz os campos completos.

## Estado no n8n

- Workflow `XkRFB5dYc1EFWZkN`, projeto pessoal do Thomas, **inativo**, disparo manual.
  `confere_n8n.py` confirma que os nós Code salvos são idênticos aos arquivos daqui.
- Primeira execução (14/10/2026, execução 61787): sucesso em 2 min 52 s, 84 chamadas,
  e-mail enviado só para `thomas.lima@cars2you.com.br`.
- Base por canal, medida em 14/10/2026 com o filtro unificado de 28/09 (a Versão A, de
  04/09, entre parênteses): Marketplace 14.896 (14.747) · Canal de vendas C6 Auto 3.447
  (2.922) · Colaboradores C6 3.077 (3.074) · Trucks2you 816 (782) · Lance Fácil BTB
  Associados 156 (156) · Lance Fácil BTB 92 (91). Total 22.484 (21.772).
- **Conferido direto no banco (14/10, VPN, `consulta.py --base cars2you`):** as 6 consultas
  `kpi` rodadas direto dão os mesmos números do n8n (só Trucks2you com login 414 contra
  413, entrada nova entre as duas leituras). Refazendo a base **como estava em 04/09**
  (cadastros antes de 04/09) com o filtro de hoje: canal 43 = 2.922 e login 1.438, idênticos
  à Versão A; 48, 65 e 62 também idênticos. Logo o +525 do canal 43 é cadastro novo real
  (187 depois de 04/09 em setembro, 338 em outubro; 480 já com login), não filtro.
  Marketplace (14.705 contra 14.747) e Trucks2you (777 contra 782) ficam abaixo porque a
  Versão A é anterior ao filtro de 28/09 (grupo de clientes 7, `@netcarros`, `@dnr`
  amplo): tirando esses três, Trucks2you volta a 782 exato e Marketplace a 14.751.
