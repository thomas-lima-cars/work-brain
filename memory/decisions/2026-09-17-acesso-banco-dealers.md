# Decisão — acesso direto ao banco da Dealers

**Data:** 2026-09-17 · **Quem decidiu:** Thomas · **Executou:** sessão de madrugada

## O que se decidiu

Abrir um **segundo caminho de acesso a banco**, direto e fora do MCP, para o
RDS de produção da Dealers (`wl_dlc_prd`, `wl-dlc-prd-mysql-default...rds.amazonaws.com`).

## Por que não deu para usar o caminho que já existia

O acesso da Cars2You é o MCP `run_query`, chamado de dentro de um workflow n8n.
O nó aceita **`{sql, database}` e nada mais** — não existe parâmetro de host, e
o endpoint `mcp-cars2you-readonly.cars2you.com.br` está preso ao RDS da
Cars2You. `database` escolhe schema *naquele* servidor.

Alternativas consideradas:

| opção | por que não |
|---|---|
| Adicionar a conexão no serviço MCP | Depende do Caio, dono do serviço. Continua sendo o caminho certo se o acesso virar rotina |
| MySQL Workbench (já instalado) | GUI; não serve para a IA rodar consulta |
| Instalar o cliente `mysql` CLI | Instalação nova sem necessidade — `mysql-connector` já estava disponível no Python |

## O que veio junto, de bom

O caminho direto **não tem as limitações do MCP**: sem teto de 50 linhas, sem
rejeição de função de janela, `information_schema` acessível. O estudo de
precificação, que na Cars2You exige 96 chamadas paginadas, aqui roda em uma
consulta por dimensão. **Some a classe inteira de erro "filtro no gabarito e
não na página"**, que já custou uma refação em 15/09.

## O que veio junto, de risco

É **produção de outro tenant**, e a credencial não é do serviço MCP — é uma
credencial de banco em arquivo. Mitigações aplicadas:

1. Credencial **fora do repo** (`~/.dealers-dlc.env`); `conexao.py` **recusa**
   ler credencial de dentro do repo; senha mascarada até em mensagem de erro
2. Runner **só de leitura**, com guarda provada em 17 casos
3. Sessão em `TRANSACTION READ ONLY`
4. Credencial usada é readonly por nome e por permissão (`bi_read_wl_dlc_prd`)
5. Coleta bruta **fora do git** — 25 MB de dado comercial linha a linha

## Consequência que ainda não foi resolvida

❓ **O objetivo do acesso não foi declarado.** Por isso a Dealers **não ganhou
pasta em `subjects/`** — saiu do "fora do radar" em `context/empresa.md` e
`produtos.md`, mas sem escopo. Enquanto isso não for definido, cada pedido é
tratado como avulso.

## O que o primeiro uso já mostrou

- A Dealers **roda a mesma plataforma** — e em 18/09, com a conexão à Cars2You
  aberta também, deu para medir o quanto: **193 tabelas cada, 192 em comum, e
  das 192 só `notifications` difere em coluna**. 2.075 colunas contra 2.074.
  ⚠️ Em 17/09 eu registrei aqui que a Dealers era um superconjunto com versão
  mais nova. Não é.
- **O estudo de precificação não é transferível como conclusão.** Roda igual,
  mas `REPASSE`/`TRADICIONAL` — o maior efeito da Cars2You — não existe lá.
  O método viaja; os achados, não.

## Desdobramento em 2026-09-18

O acesso à Dealers puxou o acesso à **Cars2You** pelo mesmo caminho, e o módulo
virou multi-base em `automations/bancos/`. Consequências que valem registro:

- **O `context/banco-de-dados/` estava incompleto e ninguém sabia**: 149 de 193
  tabelas, desde a importação de 09/09. Só apareceu porque passou a existir um
  banco para conferir contra.
- **A ressalva 2 de 09/09 fechou** — as 79 colunas que o diagrama escondeu foram
  lidas direto.
- **O `schema.md` deveria passar a ser gerado**, não importado à mão. A fonte
  que o alimentou já nasceu faltando 44 tabelas.
- ⚠️ **O acesso depende de VPN.** Em 18/09 as duas bases caíram ao mesmo tempo e
  voltaram juntas.

Ver [`../sessions/2026-09-17.md`](../sessions/2026-09-17.md) e
[`resultado-dealers.md`](../../automations/dealers-db/precificacao/resultado-dealers.md).
