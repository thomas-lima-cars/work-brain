# HANDOFF — Protótipo "Safra de Cadastro" + Generalização Multi-Whitelabel

> Documento de passagem para **outra pessoa continuar** o trabalho exatamente do ponto atual.
> Gerado em **2026-09-03**. Idioma: pt-BR. Frente: `analise-base-c6-lojista`.
> Autor do trabalho até aqui: Everton (Cars2You). Base: relatório "C6 Lojista - Análise de base de cadastros".

---

## 0. TL;DR — o que é isso

Estamos **evoluindo** o relatório HTML "Análise de Base de Clientes — Canal de Vendas C6 Auto" (whitelabel 43),
gerado por um workflow n8n. Duas evoluções foram pedidas e estão **parcialmente feitas num protótipo HTML**:

1. **Bloco "Safra de Cadastro"** no topo da aba *Visão Geral*: seletor **Ano/Mês** por mês de **cadastro** (coorte),
   que recalcula ao vivo os KPIs + Cadastros por Situação + Funil de Conversão. ✅ **FEITO**
2. **Generalização multi-whitelabel**: removido o filtro fixo `whitelabel_id = 43`; adicionado **seletor de Whitelabel**
   (58 WLs + "Todos os whitelabels" distinto) com **cross-filter bidirecional** (WL↔datas). ✅ **FEITO** (só na Visão Geral)
3. **Aplicar o filtro de whitelabel na aba Visão Geral inteira** (as seções fora do bloco de safra: Recência, Evolução,
   UF, Top 10, Destaques). 🚧 **EM ANDAMENTO** — Recência ✅ feita; faltam UF, Top 10, Destaques, Evolução.

> **Tudo foi feito num protótipo HTML client-side** (não no workflow n8n). O protótipo é o arquivo
> `relatorio-c6-PROTO-safra-atual.html`. O workflow n8n **NÃO foi alterado** (só usado como ponte pra puxar dados).

### Decisão de arquitetura pendente (IMPORTANTE)
O caminho client-side (embarcar dados de todos os WLs no HTML + reescrever cada seção) é **grande e frágil** —
na prática reescreve o relatório inteiro. O caminho **correto** é o **port no n8n**: parametrizar `whitelabel_id`
no `Montar Queries` e o relatório inteiro é regerado por WL (todas as seções e abas saem no escopo nativamente).
O usuário optou por **continuar client-side por etapas**, mas quem continuar deve reavaliar se vale portar pro n8n.

---

## 1. Contexto de negócio (essencial)

- **Cars2You** opera marketplace/leilão B2B de veículos. Clientes = **whitelabels** (ex.: C6 Auto = WL43, Marketplace = WL7).
- **`user_whitelabels` é N:N** — um cliente pode estar em vários whitelabels. Por isso:
  - "Todos os whitelabels" mostra clientes **DISTINTOS** (dataset separado), **não** a soma dos WLs (que duplicaria).
- **Regras de negócio do banco `cars2you_production`:**
  - **Base de clientes** = `users` INNER JOIN `user_whitelabels` (wl fixo), `deleted_at IS NULL`, `internal_user = 0`,
    e `email NOT REGEXP '(@cars2you|@datapage|@icarros|@itau|@teste|@dnr[.]com[.]br|@maisquecliente|@dealersclub|@c6bank[.]com)'`.
  - **Compra** = `advertisement_negotiations.status IN (2,3,7)`, via `offer_actual_id → offers`. **Valor** = `offers.price`.
  - **Regra §0 (cross-shop):** compra/oferta do cliente **NÃO** são restritas à loja do WL — contam em **qualquer loja**.
    (Já verificado: as queries de coorte abaixo seguem isso — não filtram `shop_id`.)
  - **Login** = `user_access` (nunca `access_logs`).
  - **Situação cadastral** = `users.situation` (1 Pré-cadastrado, 2 Para aprovação, 3 Aprovado, 4 Reprovado,
    5 Bloqueado, 6 Inadimplente). **É estado ATUAL — não há histórico.**

---

## 2. Ambiente e acessos

- **n8n:** `https://cars2you.app.n8n.cloud`
- **Banco:** `cars2you_production` (MySQL, AWS RDS). **Só acessível via n8n** (o n8n Cloud está fora da VPC).
  - Ponte = nó **MCP Run** do workflow, que chama a tool `run_query` no MCP readonly
    `https://mcp-cars2you-readonly.cars2you.com.br/sse` (credencial n8n bearer `Cc8CxzVDwvA3EysZ`).
  - ⚠️ **Não existe acesso direto ao `cars2you_production`** de fora do n8n. (Há um MCP `query_database` que aponta
    para o banco `dealersclub` — usuário `claude_tuunelis` — que **NÃO** tem acesso ao cars2you. Ignore-o.)
- **Ferramentas MCP do n8n** (server id `ad7bbf4e-95de-4891-81aa-0a35fe700e94`; se estiverem "deferred", carregue via ToolSearch):
  `get_workflow_details`, `update_workflow`, `execute_workflow`, `get_workflow_execution`,
  `restore_workflow_version`, `get_workflow_history`, `get_workflow_sdk_reference`.

### Limites técnicos do MCP (críticos)
- **Corte de 50 linhas por chamada** de `run_query` (trunca em silêncio). ⇒ **paginar** com `LIMIT 50 OFFSET k*50`
  e concatenar depois. `ORDER BY` **obrigatório** para paginação estável.
- **Deadline do servidor MCP ≈ 15s por query.** As queries multi-WL estão **no limite** (recência bateu 15,3s).
  Se estourar: erro `query failed: context deadline exceeded`. Otimize (set-based, sem subqueries correlacionadas).
- `get_workflow_details` e `get_workflow_execution` com dados grandes **excedem o limite de tokens** e são
  **salvos em arquivo** `.txt` — leia com **python (utf-8)**, `jq` NÃO está instalado nesta máquina.
- **stdout do Windows é cp1252** — reconfigure para utf-8 (`sys.stdout.reconfigure(encoding="utf-8")`) ao imprimir acentos.
- Python real: `%LOCALAPPDATA%\Programs\Python\Python314\python.exe` (não o stub da Store).

---

## 3. Workflows e IDs de referência

| Item | ID | Observação |
|---|---|---|
| **Workflow ORIGINAL C6 (produção)** | `2ECmLRceNEgCCYyb` | **ATIVO**, cron diário 08h, envia e-mail. **NÃO ALTERAR.** Só ler. |
| **CÓPIA pessoal (sandbox)** | `ZIwusfx9IK1Owpg1` | **INATIVA**, e-mail desabilitado. **Usada para puxar dados.** |
| Versão "limpa" da cópia (restaurar aqui) | `5a79c7dc-a6ae-43ba-9bb2-459f1b6e8f6d` | Montar Queries original, Montar HTML habilitado, e-mail desabilitado |
| Análise IGA (irmã) | `mgDSyxuO0Mzjkrfy` | — |
| Cred MCP dados (bearer) | `Cc8CxzVDwvA3EysZ` | "MCP Cars2You Readonly - BD SQL" |
| Cred Outlook | `G3MiTRT9jTVPx6Wn` | — |
| whitelabel C6 Lojista | **43** | loja "C6 Bank Lojista" shop 104754; "C6 Bank" (WL7) shop 9034 |

**Backup do workflow cópia (estado limpo):** `../backups/ZIwusfx9IK1Owpg1_2026-09-03_baseline-limpo.json`

### Estrutura do workflow (6 nós, cadeia linear)
`Diariamente às 08h (scheduleTrigger) → Montar Queries (code, ~23KB, gera ~234 queries) → MCP Run (mcpClient run_query) → Montar HTML (code, ~87KB, monta o HTML) → Anexar HTML (code) → Enviar Relatorio por Email (Outlook)`

Config do nó **MCP Run** (para replicar): type `@n8n/n8n-nodes-langchain.mcpClient` v1.1, `tool.value = run_query`,
`jsonInput = ={{ JSON.stringify({ sql: $json.sql, database: $json.database }) }}`, cred `httpBearerAuth = Cc8CxzVDwvA3EysZ`,
timeout 60000. O nó **roda 1x por item** que o `Montar Queries` retorna.

---

## 4. O PADRÃO "swap-run-restore" — como puxar dados do cars2you (LEIA)

Como só dá pra consultar o banco via n8n, o padrão usado foi: **substituir temporariamente** o `Montar Queries` da
**cópia** por uma query-sonda, executar, ler o resultado do `MCP Run`, e **restaurar** a cópia. Passo a passo:

1. **Swap:** `update_workflow(ZIwusfx9IK1Owpg1, operations:[`
   `{type:"setNodeDisabled", nodeName:"Montar HTML", disabled:true},`  ← evita erro/ruído do HTML
   `{type:"updateNodeParameters", nodeName:"Montar Queries", replace:true, parameters:{jsCode:"...return [{json:{queryName:'x', database:'cars2you_production', sql}}...];"}}])`
   - O `jsCode` deve **retornar um array** `[{json:{queryName, database:'cars2you_production', sql}}, ...]` (1 item por página).
2. **Run:** `execute_workflow(ZIwusfx9IK1Owpg1, executionMode:"manual")` → devolve `executionId`.
3. **Espera** ~o tempo estimado (cada página ~2-6s; recência ~5,7s/pág). Use um `sleep` em background.
4. **Lê:** `get_workflow_execution(ZIwusfx9IK1Owpg1, executionId, includeData:true, nodeNames:["MCP Run"])`.
   - O status vem como **`error`** — isso é **esperado e inofensivo**: é o nó `Anexar HTML` recebendo `html` undefined
     (porque desabilitamos o `Montar HTML`). O **`MCP Run` roda com sucesso** e os dados estão em
     `data.resultData.runData["MCP Run"][0].data.main[0]` — um item por página, cada um com
     `json.structuredContent.{columns, rows}`.
   - Se o resultado exceder tokens, ele é salvo em arquivo `.txt` → parseie com python.
5. **Restore:** `restore_workflow_version(ZIwusfx9IK1Owpg1, versionId:"5a79c7dc-a6ae-43ba-9bb2-459f1b6e8f6d")`.

> **SEMPRE restaure a cópia ao final.** E **nunca** rode/ative com o e-mail habilitado (ver §12).

---

## 5. Estrutura do relatório original (o que existe hoje)

Arquivo baseline: `relatorio-c6-original-baseline.html` (307KB). Título/abas:
- **3 abas** (tabs, `data-tab`): `panel-geral` (Visão Geral da Base), `panel-matriz` (Raio-X de Compradores),
  `panel-individual` (Raio-X Individual).
- **Seções do `panel-geral`** (em ordem):
  1. Visão Geral da Base (KPIs) — *substituída pelo bloco de safra no protótipo*
  2. Cadastros por Situação — *idem, virou reativa no bloco de safra*
  3. Funil de Conversão — *idem*
  4. **Recência — Há Quanto Tempo Sem Agir** ← ✅ já reconstruída WL-reativa
  5. **Evolução Mensal** (≈9 gráficos Chart.js: `ch_uniq, ch_nr_login, ch_nr_oferta, ch_nr_compra, ch_vol, ch_cad, ch_cad_dia, ch_oferta_anuncio, ch_exito_venda, ch_media_publicacoes`) 🔴 falta
  6. **Distribuição Geográfica (UF)** (`ch_uf_compra` + tabela) 🔴 falta
  7. **Top 10 Clientes — Compras no Período Total** (tabela) 🔴 falta
  8. **Top 10 Clientes — Compras em 2026** (tabela) 🔴 falta
  9. **Top 10 Acesso e Top 10 Oferta — 2026** (2 tabelas) 🔴 falta
  10. **Destaques do Período** (cards de insight) 🔴 falta
- **Raio-X (abas matriz/individual):** dados granulares por comprador (`RX_TOTALS, RX_MODELO, RX_LAUDO, RX_UF, RX_FAIXA, RX_PARTIC, RX_BUYERS`), com filtros próprios `rxAno/rxMes`. **NÃO** foram tocados. Aplicar WL aqui = pull gigante (evitar client-side; é caso de port).

> **Ponto-chave:** todas essas seções são **"assadas" server-side** no `Montar HTML` — os valores vêm **fixos no HTML**
> (ex.: `width:30,4%`, `count:437`), **sem variável/hook de dados no client** (exceto as abas de Raio-X). Por isso
> torná-las WL-reativas = **substituir o HTML fixo por template + JS + dados por-WL embarcados**.

---

## 6. O que foi construído no protótipo (histórico detalhado)

Todo o protótipo é gerado por um script python **`build_proto.py`** que:
1. lê o baseline `relatorio-c6-original-baseline.html`,
2. injeta CSS + o bloco de safra + JS,
3. **remove** as seções estáticas redundantes (KPI-grid original, "Cadastros por Situação", "Funil"),
4. **substitui** a seção "Recência" por uma versão WL-reativa,
5. embarca os dados (JSONs em `dados/`),
6. grava `relatorio-c6-PROTO-safra-atual.html`.

**Evolução do protótipo (iterações já feitas):**
1. Rodou a cópia sem envio e gerou o HTML de teste; comparado byte-a-byte com a produção (**idênticos**, mesmo SHA-256).
2. Bloco de safra (coorte por mês de cadastro): KPIs + Situação + Funil reativos ao Ano/Mês.
3. Removida a "composição"; incluídas Situação + Funil no bloco; removidas as 3 seções estáticas redundantes.
4. Ajustes de KPI (títulos/subs alinhados ao original; "Valor total" com formatador compacto `R$ X,X Mi`;
   fontes 30px, exceto Valor total e Última compra em 22px; Valor total cor `#7c3aed`).
5. KPI "Vendas": sub "Vendido" (status 7) e "Pgto. Pendente" (status 2+3 = Vendas − Vendido).
6. **Multi-whitelabel:** removido filtro WL43; seletor de Whitelabel (58 WLs + "Todos" distinto).
7. **Cross-filter bidirecional** (WL↔Ano↔Mês). **← ESTE É O ESTADO-BASE ATUAL do bloco de safra.**
8. **Recência WL-reativa** (etapa 1 da "aba inteira").

**Estado visual atual:** filtros (WL/Ano/Mês) ficam **dentro do bloco de safra**, na aba Visão Geral. Header original
intacto. Recência reage ao seletor de WL.

---

## 7. Modelo de dados e decisões

- **Coorte = mês de cadastro** (`DATE_FORMAT(users.created_at,'%Y-%m')`). Propriedade-chave: as safras são
  **partições disjuntas** (cada cliente tem 1 mês de cadastro) ⇒ agregar por ano/"todos" é **soma** e bate com os totais.
- **Dois datasets** (por causa do N:N):
  - **`coorte_all.json`** (dataset "Todos"/distinto): 1 linha por mês (`ym`), sobre **clientes distintos** de todos os WLs.
    Σ total = **29.002** (usuários distintos). 78 meses.
  - **`coorte_wl.json`** (dataset por-WL): 1 linha por `(whitelabel × mês)`. 516 linhas, **58 whitelabels**.
    "Todos" usa `coorte_all`; ao escolher um WL, usa `coorte_wl` filtrado.
- **Cross-filter:** cada seletor lista só opções válidas dadas as outras (usa `coorte_wl` como universo).
- **Validação cruzada (confia nisso):** WL43 pela query multi-WL → total **2.921**, compradores **240**,
  volume **R$ 146.746.209,69**, situação 2.865 aprovados — **idêntico ao baseline C6**. ✅

### Números de referência (para validar regressões)
| Recorte | total | com login | ofertantes | compradores | vendas(2,3,7) | vendido(7) | volume |
|---|---|---|---|---|---|---|---|
| **Todos (distinto)** | 29.002 | 10.956 | 3.923 | 2.105 | — | — | R$ 2,50 bi |
| **C6 / WL43** | 2.921 | 1.436 | 444 | 240 | 3.405 | 3.221 | R$ 146,7 Mi |
| Marketplace / WL7 | 14.741 | — | — | 1.447 | — | — | R$ 1,96 bi |

---

## 8. As queries SQL usadas (verbatim — para regenerar/estender)

> Todas rodam via o padrão swap-run-restore (§4), `database:'cars2you_production'`. `EMAIL` é a regex de exclusão.
> `EMAIL = (@cars2you|@datapage|@icarros|@itau|@teste|@dnr[.]com[.]br|@maisquecliente|@dealersclub|@c6bank[.]com)`

### 8.1 Coorte (KPIs + Situação + Vendido) — gerou coorte_all/coorte_wl
Fragmentos (montados em template string no jsCode):
```
BASEF = u.deleted_at IS NULL AND u.internal_user=0 AND u.email NOT REGEXP '<EMAIL>'
        AND EXISTS(SELECT 1 FROM user_whitelabels uw0 WHERE uw0.user_id=u.id)
BEXT  = SELECT u.id uid, u.situation sit, DATE_FORMAT(u.created_at,'%Y-%m') ym,
          EXISTS(SELECT 1 FROM user_access ua WHERE ua.user_id=u.id) has_login,
          EXISTS(SELECT 1 FROM offers o WHERE o.deleted_at IS NULL AND o.buyer_user_id=u.id) has_offer
        FROM users u WHERE <BASEF>
PC    = SELECT o.buyer_user_id uid, COUNT(DISTINCT an.id) neg,
          COUNT(DISTINCT CASE WHEN an.status=7 THEN an.id END) neg7,
          SUM(o.price) vol, MAX(an.finish_date_offer) ult
        FROM advertisement_negotiations an
          INNER JOIN offers o ON o.id=an.offer_actual_id
          INNER JOIN advertisements a ON a.id=an.advertisement_id
        WHERE an.status IN (2,3,7) GROUP BY o.buyer_user_id
METRICS = COUNT(*) total, SUM(b.has_login) com_login, SUM(b.has_login=0) sem_login, SUM(b.has_offer) ofertantes,
          SUM(pc.neg>0) compradores, COALESCE(SUM(pc.neg),0) negociacoes, COALESCE(SUM(pc.neg7),0) vendido,
          COALESCE(SUM(pc.vol),0) volume, MAX(pc.ult) ultima_compra,
          SUM(b.sit=1) s1, SUM(b.sit=2) s2, SUM(b.sit=3) s3, SUM(b.sit=4) s4, SUM(b.sit=5) s5, SUM(b.sit=6) s6
```
Dataset A (Todos, distinto) — **2 páginas** (LIMIT 50 OFFSET 0,50):
```sql
SELECT b.ym, <METRICS> FROM (<BEXT>) b LEFT JOIN (<PC>) pc ON pc.uid=b.uid
GROUP BY b.ym ORDER BY b.ym LIMIT 50 OFFSET <k>
```
Dataset B (por whitelabel) — **11 páginas** (OFFSET 0..500):
```sql
SELECT uw.whitelabel_id wl_id, w.name wl_name, b.ym, <METRICS>
FROM (<BEXT>) b
  INNER JOIN user_whitelabels uw ON uw.user_id=b.uid
  INNER JOIN whitelabels w ON w.id=uw.whitelabel_id
  LEFT JOIN (<PC>) pc ON pc.uid=b.uid
GROUP BY uw.whitelabel_id, w.name, b.ym ORDER BY uw.whitelabel_id, b.ym LIMIT 50 OFFSET <k>
```

### 8.2 Recência — gerou recencia.json
```
BF = u.deleted_at IS NULL AND u.internal_user=0 AND u.email NOT REGEXP '<EMAIL>'
LL = LEFT JOIN (SELECT user_id uid, MAX(created_at) d FROM user_access GROUP BY user_id) ll ON ll.uid=u.id
LO = LEFT JOIN (SELECT buyer_user_id uid, MAX(created_at) d FROM offers WHERE deleted_at IS NULL GROUP BY buyer_user_id) lo ON lo.uid=u.id
LC = LEFT JOIN (SELECT o.buyer_user_id uid, MAX(an.finish_date_offer) d FROM advertisement_negotiations an
        INNER JOIN offers o ON o.id=an.offer_actual_id INNER JOIN advertisements a ON a.id=an.advertisement_id
        WHERE an.status IN (2,3,7) GROUP BY o.buyer_user_id) lc ON lc.uid=u.id
bk(al,p) = SUM(<al>.d IS NOT NULL) <p>_com,
           SUM(DATEDIFF(NOW(),<al>.d) BETWEEN 0 AND 30) <p>_b0,
           SUM(DATEDIFF(NOW(),<al>.d) BETWEEN 31 AND 90) <p>_b1,
           SUM(DATEDIFF(NOW(),<al>.d) BETWEEN 91 AND 180) <p>_b2,
           SUM(DATEDIFF(NOW(),<al>.d) > 180) <p>_b3
REC = COUNT(*) total, bk(ll,'lg'), bk(lo,'of'), bk(lc,'cp')
```
Todos (1 linha): `SELECT <REC> FROM users u <LL> <LO> <LC> WHERE <BF> AND EXISTS(SELECT 1 FROM user_whitelabels uw0 WHERE uw0.user_id=u.id)`
Por WL (**2 páginas**): `SELECT uw.whitelabel_id wl_id, w.name wl_name, <REC> FROM users u INNER JOIN user_whitelabels uw ON uw.user_id=u.id INNER JOIN whitelabels w ON w.id=uw.whitelabel_id <LL> <LO> <LC> WHERE <BF> GROUP BY uw.whitelabel_id, w.name ORDER BY uw.whitelabel_id LIMIT 50 OFFSET <k>`
> ⚠️ Query pesada (~5,7s/pág, última bateu 15,3s). Se estourar, restrinja os derivados a base users.
> Bar width = `bucket / com * 100`. Nunca = `total − com`. (Pequenas divergências de 1-2 = compras com data futura, DATEDIFF negativo.)

### 8.3 Queries ORIGINAIS (do `Montar Queries` do workflow) — base para as seções que FALTAM
Estas são as queries do relatório original (hoje com `whitelabel_id = 43` fixo). Para as próximas seções, **adapte**
(troque 43 por parâmetro, ou agrupe por `uw.whitelabel_id` + `whitelabels w`, como nos datasets acima). `BASE` = subquery de ids da base.

- **Evolução Mensal** (janela: últimos 12 meses; `MES_INICIO` = mês atual −11):
  - `evol_login`: `SELECT DATE_FORMAT(ua.created_at,'%Y-%m') mes, COUNT(DISTINCT ua.user_id) unicos FROM user_access ua WHERE ua.user_id IN (BASE) AND ua.created_at >= 'MES_INICIO-01' GROUP BY mes`
  - `evol_oferta`: `... FROM offers o WHERE o.deleted_at IS NULL AND o.buyer_user_id IN (BASE) AND o.created_at >= ... GROUP BY mes`
  - `evol_compra`: `SELECT DATE_FORMAT(an.finish_date_offer,'%Y-%m') mes, COUNT(DISTINCT o.buyer_user_id) unicos, SUM(o.price) volume FROM advertisement_negotiations an JOIN offers o ON o.id=an.offer_actual_id JOIN advertisements a ON a.id=an.advertisement_id WHERE an.status IN (2,3,7) AND o.buyer_user_id IN (BASE) AND an.finish_date_offer >= ... GROUP BY mes`
  - `evol_cadastro`: `SELECT DATE_FORMAT(u.created_at,'%Y-%m') mes, COUNT(*) novos FROM users u WHERE u.id IN (BASE) AND u.created_at >= ... GROUP BY mes`
  - `evol_cadastro_dia`: por DIA nos últimos 30 dias.
  - `evol_media_oferta`: métricas de inventário/anúncio (join `shops s ON s.whitelabel_id = 43`) — **este é escopado ao WL** (anúncios do WL), atenção ao generalizar.
  - `nr_login/oferta/compra`: novos vs recorrentes por mês ("novo" = mês da 1ª ocorrência histórica).
- **UF de compra** (`uf_compra`): `SELECT COALESCE(uf_norm,'Não identificada') uf, COUNT(DISTINCT an.id) compras, SUM(o.price) volume FROM advertisement_negotiations an JOIN offers o ON o.id=an.offer_actual_id JOIN advertisements a ON a.id=an.advertisement_id LEFT JOIN (SELECT s.id shop_id, <UF_CASE> uf_norm FROM shops s JOIN shop_addresses sa ON sa.shop_id=s.id AND sa.deleted_at IS NULL) ufn2 ON ufn2.shop_id=o.buyer_shop_id WHERE an.status IN (2,3,7) AND o.buyer_user_id IN (BASE) GROUP BY uf`. (`UF_CASE` normaliza siglas; ver builder original.)
- **Top 10** (4 rankings, cada um `LIMIT 10`):
  - `top_compradores_hist`: `SELECT u.id, u.full_name, COUNT(DISTINCT an.id) compras, SUM(o.price) volume, MAX(an.finish_date_offer) ultima_compra FROM advertisement_negotiations an JOIN offers o ON o.id=an.offer_actual_id JOIN advertisements a ON a.id=an.advertisement_id JOIN users u ON u.id=o.buyer_user_id WHERE an.status IN (2,3,7) AND o.buyer_user_id IN (BASE) GROUP BY u.id ORDER BY compras DESC LIMIT 10`
  - `top_compradores_ano`: idem + `AND an.finish_date_offer >= 'ANO-01-01'`
  - `top_acesso_ano`: `SELECT u.id, u.full_name, COUNT(DISTINCT DATE(ua.created_at)) dias_ativos, COUNT(ua.id) acessos FROM user_access ua JOIN users u ON u.id=ua.user_id WHERE ua.user_id IN (BASE) AND ua.created_at >= 'ANO-01-01' GROUP BY u.id ORDER BY dias_ativos DESC LIMIT 10`
  - `top_ofertas_ano`: `SELECT u.id, u.full_name, COUNT(*) ofertas FROM offers o JOIN users u ON u.id=o.buyer_user_id WHERE o.deleted_at IS NULL AND o.created_at >= 'ANO-01-01' AND o.buyer_user_id IN (BASE) GROUP BY u.id ORDER BY ofertas DESC LIMIT 10`
  - `top_lojas` (BC-17): loja+CNPJ dos usuários dos 4 Top 10 (subtítulo dos nomes).
- **Destaques do Período:** não é query — é **motor de insights** dentro do `Montar HTML` (variável `TIPS`), derivado dos números acima. Ao reconstruir, derive client-side a partir dos dados já embarcados.

---

## 9. Arquivos entregues nesta pasta (`prototipo-safra/`)

| Arquivo | O que é |
|---|---|
| `HANDOFF-PROTOTIPO-SAFRA.md` | **este documento** |
| `build_proto.py` | **o builder** — gera o protótipo a partir do baseline + dados. É o "código-fonte" do protótipo. |
| `relatorio-c6-original-baseline.html` | relatório C6 original (fonte que o builder lê como `SRC`). |
| `relatorio-c6-PROTO-safra-atual.html` | **o protótipo atual** (output do builder). |
| `dados/coorte_all.json` | coorte distinta por mês (Todos). Schema: `{ "YYYY-MM": {total,com_login,sem_login,ofertantes,compradores,negociacoes,vendido,volume,ultima_compra,s1..s6} }` |
| `dados/coorte_wl.json` | coorte por (WL×mês). Array de `{wl_id,wl_name,ym, ...mesmas métricas}` |
| `dados/wl_list.json` | lista de WLs p/ dropdown, ordenada por tamanho: `[{id,name,total}]` (58 itens) |
| `dados/recencia.json` | `{ "all": {...}, "<wl_id>": {total, lg:{com,b:[b0,b1,b2,b3]}, of:{...}, cp:{...}} }` |
| `dados/situacao.json`, `dados/status.json` | coorte de situação e status7/2 por mês de cadastro do C6 (usados numa iteração anterior; hoje as métricas de situação/vendido já estão em `coorte_*`). |

> ⚠️ Os JSONs contêm **números reais agregados** (sem PII). Se for versionar em git público, avalie mantê-los fora.
> `../saida-teste/` (onde estão as cópias de trabalho) está no `.gitignore`.

---

## 10. Como rodar/regenerar o protótipo

Pré-requisito: python real (`%LOCALAPPDATA%\Programs\Python\Python314\python.exe`).

1. Ajuste os caminhos no topo do `build_proto.py` (`SP` = pasta dos dados; `SRC` = baseline; `OUT` = saída).
   - No estado atual do arquivo, `SP` aponta pro scratchpad da sessão. **Troque `SP` para a pasta `dados/`** desta pasta.
2. Rode: `python build_proto.py` → gera o HTML.
3. Abra o HTML no navegador. Teste: selecione um WL (ex.: C6) e confira os números contra a tabela do §7.

O `build_proto.py` está estruturado em: `CSS` (string) + `BLOCK` (HTML do bloco de safra) + `JS` (string com a lógica:
`refresh()` cross-filter, `agg()`, `render()`, `renderRec()`) + montagem (injeta CSS/BLOCK/JS, remove seções estáticas,
substitui a Recência). **Padrão para adicionar uma seção nova:** (a) puxar os dados por-WL (§8), salvar em `dados/`,
(b) `REC=json.load(...)` no topo, (c) `.replace("__X__", json.dumps(...))` no JS, (d) função `renderX()` chamada dentro
de `render()`, (e) `SECTION_X` (template com ids) e `html2 = html2.replace(sec_original, SECTION_X)`. A Recência é o
**exemplo completo** a copiar.

---

## 11. O QUE FALTA — roteiro de continuação

Ordem recomendada (menor risco → maior): **UF → Top 10 → Destaques → Evolução (gráficos)**.

Para cada seção, o ciclo é: **(1)** escrever a query por-WL (adaptando §8.3: agrupar por `uw.whitelabel_id, w.name`
+ produzir também a versão "Todos" distinta), **(2)** puxar via swap-run-restore (§4) paginando (§2), **(3)** salvar JSON
em `dados/`, **(4)** validar C6 contra o baseline, **(5)** reconstruir a seção no `build_proto.py` (padrão §10),
**(6)** testar no navegador, **(7)** restaurar a cópia.

- [ ] **Distribuição UF** — pull `(wl, uf) → compras, volume`. Reconstruir a tabela + `ch_uf_compra` (Chart.js bar).
      "Todos" = distinto. ~58 WLs × ~10 UFs → paginar.
- [ ] **Top 10 (×4)** — pull top10 por WL para: compradores histórico, compradores ano, acesso ano, ofertas ano
      (+ loja/CNPJ). Reconstruir 4 tabelas. Cuidado: top-10 **por WL** exige ranking dentro de cada WL (window function
      `ROW_NUMBER() OVER (PARTITION BY wl ORDER BY ...)` ou N queries). Volume alto — pagine com folga.
- [ ] **Destaques do Período** — derivar client-side dos dados já embarcados (coorte + recência + UF + top10). Não precisa pull novo.
- [ ] **Evolução Mensal (9 gráficos)** — O MAIS PESADO. Pull `(wl, mês) → login/oferta/compra únicos, volume, cadastros,
      novos vs recorrentes, média ofertas/anúncio, êxito venda`. Reconstruir cada `<canvas>` reinicializando o Chart.js
      no `render()` (destruir/re-criar o chart ao trocar de WL). Atenção: `evol_media_oferta` usa join a `shops` do WL
      (métrica de inventário — escopo por WL, não cross-shop). Janela = últimos 12 meses (ou generalizar).

### Alternativa forte (reavaliar): PORT NO N8N
Em vez de itens acima, parametrizar `whitelabel_id` no `Montar Queries` (hoje `43` fixo → variável no topo do nó) e
adicionar o bloco de safra + filtros ao `Montar HTML`. O relatório inteiro passa a ser gerado por WL, **todas as seções
e abas** saem no escopo nativamente, **sem** reescrever nada no cliente nem embarcar dados de 58 WLs. É o entregável real
da frente. Cuidado ao editar o `Montar HTML` (87KB): gerar programaticamente, validar, e há um `·` U+00B7 sensível
(ver §12). **Recomendação:** se as seções restantes forem muitas, portar é mais barato e robusto que continuar client-side.

---

## 12. Gotchas e caveats (não tropece)

- **NUNCA ative a cópia nem rode com o e-mail habilitado.** A cópia mantém (no nó de e-mail) os 6 destinatários reais
  (`guilherme.pinheiro, fernando.tuunelis, caio.ledesma, carlos.mattera, ana.luz, donizeti.junior @cars2you.com.br`)
  e o cron 08h. Rodar/ativar como está = **relatório duplicado** aos reais. O nó `Enviar Relatorio por Email` está
  **desabilitado** na versão limpa — mantenha assim; para gerar HTML use o padrão swap-run-restore (que também
  desabilita o `Montar HTML`).
- **Status "error" na execução é esperado** no padrão de sonda (Anexar HTML recebe html undefined). Os dados do MCP Run
  vêm mesmo assim. Não confunda com falha real (ex.: `context deadline exceeded` = timeout de verdade).
- **Situação cadastral não tem histórico** — o filtro de safra mostra a situação **atual** dos clientes daquela safra.
- **N:N (user_whitelabels):** somar os 58 WLs ≠ base distinta. Use `coorte_all` para "Todos".
- **Drift temporal:** recência/última-compra dependem de `NOW()` — re-rodar em horário diferente muda ligeiramente
  (ex.: C6 login 437→440 entre 16:47 e 20:30). Normal. No baseline C6, os números "oficiais" são os da geração das 16:47.
- **`Montar HTML` (87KB):** ao editar no n8n, cuidado com caracteres não-ASCII (`·` U+00B7 aparece 2× como escape
  `·`; emoji `🏆`). Reemitir por LLM pode manglear — gerar programaticamente com gate de verificação.
- **Formatador de valor** (idêntico ao original, replicado no protótipo): `≥1e9 → R$ X,XX bi; ≥1e6 → R$ X,X Mi; ≥1e3 → R$ X K; senão R$ <n>`.
- **Formatos:** datas `YYYY-MM-DD`; números pt-BR; commits em português.

---

## 13. Checklist rápido para quem assume

1. [ ] Ler este MD inteiro + o `build_proto.py` (é o "estado" do protótipo).
2. [ ] Carregar as ferramentas MCP do n8n (ToolSearch se deferred).
3. [ ] Confirmar que a cópia `ZIwusfx9IK1Owpg1` está na versão limpa (`restore_workflow_version` se preciso).
4. [ ] Ajustar `SP` no `build_proto.py` para a pasta `dados/` e regenerar o protótipo (validar C6 = tabela §7).
5. [ ] **Decidir:** continuar client-side por etapas (§11) OU portar pro n8n (§11 alternativa). Recomendo reavaliar o port.
6. [ ] Se client-side: seguir UF → Top 10 → Destaques → Evolução, usando a Recência como molde.
7. [ ] Sempre **restaurar a cópia** ao fim de cada pull.

---

*Fim do handoff. Dúvidas de contexto de negócio: falar com Everton / Caio Ledesma (PO dados) / Guilherme (criou o relatório original).*
