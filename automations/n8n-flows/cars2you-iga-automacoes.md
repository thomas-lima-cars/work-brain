# n8n — Automações Cars2You / IGA

> Registro dos workflows construídos no n8n (instância `cars2you.app.n8n.cloud`).
> **Sem segredos aqui** — só nomes e IDs de credencial. Tokens/senhas ficam no n8n.
> Última atualização: 2026-08-20.

## 🔴 O relatório era ponto único de falha dos outros dois (RESOLVIDO 10/08)

Por 3 eventos seguidos o Caio recebeu só o e-mail do Relatório — **Planilha e Remanescentes não vinham**. O sintoma mudava, a causa era sempre a mesma: o orquestrador chama os três com `waitForSubWorkflow: true` e **`Disparar Relatório` é o primeiro**; quando ele estoura, a execução inteira aborta e os outros dois nunca chegam a rodar.

| Data | Evento | Nó que quebrou o Relatório |
|---|---|---|
| 28/07 | 23615 | `MCP_FUNIL_ESCOPO` (timeout ~25s em `access_logs`) |
| 07/08 | 23674 | `Link Anônimo` (401 de credencial) |
| 10/08 | 23675 | `Resumo no WhatsApp` (HTTP 400) |

**✅ Correção (10/08):** os 3 `Disparar *` do orquestrador passaram a **`onError: continueRegularOutput` + retry 2x/5s**. Um falhar não bloqueia mais os outros. **Validado ao vivo** no tick das 17:20 (exec 43421, evento 23680 Misto): os três rodaram `success` pela primeira vez desde 28/07.

⚠️ **Ponto cego que sobra:** o dedup olha só `relatorio_evento_IGA_<id>_*` no SharePoint. **Se o Relatório subir o arquivo e depois falhar, o evento vira "processado"** e Planilha/Remanescentes ficam de fora para sempre — viram trabalho manual. Foi o que aconteceu com o 23675. Melhoria pendente: dedup por artefato de cada flow, não só pelo do Relatório.

## 🔑 Receita de acesso ao banco via MCP (vale pra TODO flow que lê o banco)

n8n Cloud está **fora da VPC** → **não conecta no MySQL direto** (RDS na VPC, precisa VPN).
A ponte é o **servidor MCP** (público, HTTPS + bearer), que fica dentro do alcance do banco.

| Item | Valor |
|---|---|
| Nó | **MCP Client** (`@n8n/n8n-nodes-langchain.mcpClient`) |
| Transporte | **SSE** |
| Endpoint | `https://mcp-cars2you-readonly.cars2you.com.br/sse` (com `/sse`!) |
| Auth | Bearer → credencial **`MCP Cars2You Readonly - BD SQL`** (`httpBearerAuth`, id `Cc8CxzVDwvA3EysZ`) |
| Tool | `run_query` · inputMode JSON · `{ "sql": "...", "database": "cars2you_production" }` |
| Saída | `$json.structuredContent.{columns,rows}` → zipar em objetos (rows são arrays) |

> ⚠️ **O validador SQL do servidor MCP REJEITA CTE (`WITH ... AS`)** — erro `query validation failed: ... syntax error at position 5 near 'with'`. Subqueries normais (escalar no SELECT, `IN (SELECT ...)`) passam de boa. Solução: inlinar o CTE como subquery escalar repetida, ex.: trocar `WITH d AS (SELECT DATE(finish_date_event) AS ed FROM events WHERE id=X) ... d.ed` por `(SELECT DATE(finish_date_event) FROM events WHERE id=X)` em cada uso. (Descoberto migrando o Relatório IGA em 30/06.)

Padrão de uso: **Code "Montar Query"** (monta `{sql, database}`, event_id inline) → **MCP Client** → **Code "Converter Linhas"** (`columns`+`rows` → objetos) → resto do flow.

### 🚨 O servidor MCP TRUNCA em 50 LINHAS, silenciosamente (descoberto 06/08)

**`run_query` devolve no máximo 50 linhas e descarta o resto sem erro nenhum.** A execução volta `status: success` e o flow segue como se o dado estivesse completo. **Foi o que fez o Relatório e a Planilha do evento 23662 saírem com 50 placas em vez de 58** (e 29/25 vendas em vez de 34), subnotificando R$ 266.900 e R$ 415.700 respectivamente.

**Prova de que o limite é de LINHAS e não de bytes:** Relatório e Planilha rodaram a mesma base, no mesmo servidor, com 28s de diferença e `ORDER BY` diferentes — **cada um perdeu um conjunto diferente de 8 lotes**, sempre os 8 últimos da sua própria ordenação. Já o flow `IGA - Análise de base de cadastros` puxa **1.864 registros** (~5 MB) sem problema, porque usa a receita abaixo.

#### ✅ Receita obrigatória para qualquer query que possa passar de 50 linhas

**1. `JSON_ARRAYAGG` — empacota N registros dentro de 1 linha.** Como o teto conta linhas, nunca é atingido:

```sql
SELECT JSON_ARRAYAGG(JSON_OBJECT('campo1', x.campo1, 'campo2', x.campo2)) AS payload
FROM ( <a query normal, linha por registro> ) x;
```
Lado n8n: `JSON.parse(rows[0][cols.indexOf('payload')])`. Bônus: os campos vêm **nomeados**, acabando com o mapeamento por índice de coluna (frágil).

**2. Paginação elástica.** Primeiro uma query de `COUNT(*)` + `JSON_ARRAYAGG(id)` (1 linha, imune ao cap), depois fatiar em blocos de **CHUNK = 150** com `WHERE id BETWEEN ini AND fim`. O nº de páginas deriva do volume, não é fixo. 150 é o valor já provado em produção no flow do Guilherme. `BETWEEN` por chave em vez de `LIMIT/OFFSET` (estável e mais rápido).

**3. Trava de segurança — sempre.** Comparar o total do banco com o que chegou; se divergir, **lançar erro** (o flow morre e não envia nada errado). O `JSON_ARRAYAGG` tem limite próprio de tamanho e, se estourar, o sintoma é o mesmo: dado incompleto sem erro.

> ⚠️ O `COUNT` precisa usar **a mesma query base** (`SELECT COUNT(*) FROM (<mesma query>) x`), senão um INNER JOIN que derruba linha gera falso alarme — e trava de segurança que dá falso alarme é trava de segurança que alguém desliga.

Aplicado em 06/08 no Relatório, Planilha e Remanescentes. **Ainda NÃO aplicado no Cockpit Comprador** (decisão do Caio: não afeta).

### 💰 Regra de venda (confirmada com Guilherme, 06/08)

**Venda = `advertisement_negotiations.status IN (2,3,7)`.** Regra já registrada em 03/07 mas até então aplicada **só no Cockpit** — Relatório contava por "recebeu oferta" (`maxOff != null`) e Planilha só por `status = 7`.

- **Valor da venda = `offers.price` via `an.offer_actual_id`** — não `MAX(offers.price)`, que num lote status 18 traz oferta **rejeitada**.
- Impacto medido no evento 23382: vendas caíram de **22 → 17** e conversão de **57,9% → 44,7%** (5 lotes status 18). No 23662 não mudou nada (não tem status 14/18).
- ⚠️ **Relatórios anteriores contavam oferta rejeitada como venda** → a série histórica de conversão terá um degrau.
- Vocabulário validado (120 dias, sessão 06/07): **1** = aberto · **7** = vendido · **11** = sem oferta · **14** = não vendido (oferta rejeitada) · **10/13/18** = outros desfechos terminais. **Status 2 e 3 seguem sem significado documentado** — confirmar com Guilherme.
- ⚠️ **Status 13 também precisa de definição (achado 10/08).** No evento 23675 (Pesados, 8 lotes) os 4 lotes em status 13 **receberam ofertas** (1, 8, 5 e 1) mas aparecem no relatório com `maxOff` **nulo** — por isso a conversão saiu **50%** (4 de 8) em vez de 100%. Se as ofertas valem, **o número que foi ao Itaú está subestimado**; se foram retiradas/invalidadas, 50% está certo. Perguntar ao Guilherme junto com o 2 e o 3.
- ⚠️ O `SKILL.md` da `/relatorio-evento-iga` chama status 10 de "estoque/rascunho" — **está desatualizado**; 10 é desfecho terminal.

### 🧪 Como testar flow de entrega sem enviar nada

Desabilitar o nó **anterior** aos envios **NÃO funciona** — o n8n repassa o input adiante e os nós seguintes rodam. Desabilitar **cada nó de efeito externo** (`setNodeDisabled`), rodar `execute_workflow` em modo `manual`, conferir, reabilitar e `publish_workflow`.

> `update_workflow` aceita **operações parciais** (`updateNodeParameters`, `addNode`, `addConnection`, `removeConnection`, `setNodeDisabled`, `setNodeSettings`) — não precisa reescrever o flow inteiro em SDK. `credentials` inline no `addNode` funciona para o `mcpClient` (`httpBearerAuth` = `Cc8CxzVDwvA3EysZ`).

> ⚠️ **`setNodeParameter` com JSON Pointer não desce em arrays de parâmetro.** `path: "/assignments/assignments/0/value"` devolve `cannot descend into non-object`. Nesses casos usar `updateNodeParameters` passando o objeto inteiro (e **repetir os campos que não mudam**, senão somem).

> ⚠️ **Desabilitar o único trigger desativa o workflow inteiro.** Ao religar o Schedule do orquestrador (10/08), o workflow estava `active: false` com `activeVersionId: null` — foi preciso `publish_workflow` de novo. Conferir sempre `active === true` **e** `versionId === activeVersionId` depois de publicar.

> 💡 **Transporte de `jsCode` grande via MCP:** conferir **SHA-256** do código publicado contra o testado localmente. Foi assim que se garantiu que os 18.890 caracteres do `Ajustes do Relatório` chegaram íntegros — relevante justamente porque o bug do logo foi uma transcrição malfeita de base64.

> ⚠️ **`event_id` default dos disparos manuais.** `Config Evento` de Relatório/Remanescentes/Planilha usa `{{ $json.event_id || <numero> }}`. O disparo automático sempre passa o `event_id` pelo trigger `Quando Chamado`, mas **o disparo manual cai no default** — em 10/08 estava `23674` nos três, e apertar "executar" teria mandado o evento da semana passada para os 10 destinatários. Hoje: `23675`. **Conferir sempre antes de rodar na mão.**

> ❌ Credencial `Cars2You Token` (id `Zs4FCi8Jp8F6QmEa`) NÃO é a do MCP (deu 401).
> ❌ Credencial MySQL `SQL Cars2You` (id `BhVHQp5vRCDotHLK`) não serve (banco inalcançável de fora; estava com SSH tunnel ligado). Pode aposentar.

## 📋 Workflows

### 🟨 Webhook Whatsapp Propostas v2 — `feUpEgVZ4ncd5d9D`
Reescrita robusta do antigo "Webhook Whatsapp Lista". Recebe mensagens do WhatsApp do time de vendas (Evolution, instância **Cars2You Comercial**, `52.206.207.64`), extrai a proposta com IA (1 chamada), valida e grava na planilha; confirma/cobra o consultor.
- **Fluxo:** Webhook → Normalizar (texto + telefone; pega `conversation`/`extendedText`/caption; grupo→participant, individual→remoteJid) → IF consultor → Ignorar Reenvios (dedup por messageId) → Extrair Proposta (Information Extractor, **gpt-5-nano**) → Validar (placa Mercosul, CNPJ dígito verificador, valor "30 mil"/"30k", e-mail) → IF válida → Gravar Excel + Confirmar WhatsApp / senão Cobrar campo faltante.
- **Núcleo validado** com payload real (placa, valor, CNPJ formatado, gravou linha). Erro corrigido: Information Extractor devolve em `$json.output`.
- **Credenciais:** OpenAI `OpenAI Bot N8N - Whats`; Excel `Microsoft Excel Caio`; Evolution `Evolution API Key` (`A46wz7IuxLPWqy5Z`, httpHeaderAuth).
- **Consultor amarrado por telefone** (MAPA_CONSULTORES no nó Normalizar) — hoje vazio, cai no pushName.
- **Pendências:** (1) apontar o workbook pra planilha que foi pro SharePoint N8N (pasta "Planilha Propostas") — o nó ainda aponta pro OneDrive pessoal; ao trocar, **reaplicar as 9 colunas** (zeram). (2) Teste com mensagem de **grupo** (pegar JID/participant — esperar o chip novo entrar no grupo). (3) Apontar Evolution pro webhook `lista_whats_v2` e ativar quando validar.
- Planilha destino (colunas): `Consultor, Data, Placa, Valor Proposta, CNPJ , Razão Social, Código_Lista, Email, Modelo` · aba `BD Propostas`.

### 🟩 Remanescentes do Evento IGA — `yoskRxyXhtjn4vhI` (ex-"Sobra")

> 🔴 **DESLIGADO desde 13/08/2026 (decisão do Caio — ele já sabia).** O workflow está com `active: false`. Consequência: o orquestrador continua chamando, recebe `"Workflow is not active and cannot be executed."`, e o `onError: continueRegularOutput` (correção de 10/08) **engole o erro em silêncio** — a execução do orquestrador aparece `success` mesmo sem nenhum Remanescente ter saído. Confirmado nos dois eventos de 17/08 (23713 Pesados e 23719 Misto): zero execuções. Quando religar, republicar e conferir `active === true`.
Porta a skill `/sobra-evento`: lista carros sem oferta de um evento IGA → **e-mail (corpo) + WhatsApp (resumo + .txt) no grupo + arquivo no SharePoint**. **Renomeado Sobra→Remanescentes em tudo (08/07):** nome do workflow (🟩), nós, arquivo, cabeçalho do TXT, e-mail.
- **Fluxo:** Manual/`Quando Chamado (event_id)` → Config Evento (`event_id` + `wa_numero`) → Montar Query Remanescentes → **MCP Remanescentes** (run_query) → Converter Linhas → Formatar Mensagens por UF → **Montar TXT Remanescentes** → **3 ramos**: [a] `Subir Remanescentes TXT` (SharePoint) · [b] `Enviar E-mail (Remanescentes)` · [c] `Enviar WhatsApp Resumo` → `Enviar WhatsApp Documento`.
- **Query "sem oferta":** `NOT EXISTS (offers WHERE deleted_at IS NULL)` (não mais `status=11`).
- **`Montar TXT Remanescentes`** (Code, runOnceForAllItems) agrega todas as UFs num texto único e expõe no json: `fileName`, `texto` (corpo e-mail), `resumo` (msg WhatsApp curta), `b64` (base64 do .txt p/ WhatsApp) + `binary.data` (p/ SharePoint). Nome `remanescentes_evento_IGA_<event_id>_<ddmmyyyy>.txt`.
- **E-mail:** nó Outlook, corpo = `texto` (bodyContentType Text, sem anexo).
  - ⚠️ **Destinatários (conferido no flow em 10/08 — a lista antiga de 3 nomes que estava aqui estava ERRADA).** São **10**, e **inclui o Itaú**, idêntica à da Planilha:
    `guilherme.pinheiro`, `caio.ledesma`, `carlos.mattera`, `raiane.silva`, `fernando.tuunelis`, `donizeti.junior`, `ana.luz` @cars2you.com.br + `rafael.frugoli`, `carlos.pedreira`, `leandro.lopes-silva` @itau-unibanco.com.br
- **Evento sem nenhum remanescente derrubava o flow (corrigido 10/08).** Com `total = 0`, o `Montar Query Sobra Paginas` devolve um item **sem o campo `sql`** e o `MCP Sobra Paginas` estoura com `missing properties: ["sql"]`. Contornado com `onError: continueRegularOutput` no nó MCP — o guard que já existia no `Converter Linhas` (`esperado === 0 → return []`) encerra sem enviar nada. **Fix mais limpo pendente:** trocar o `return [{ json: { vazio: true, ... } }]` por `return []`.
- **WhatsApp (Evolution, instância `Cars2You Comercial`, `52.206.207.64:8080`, cred `Evolution API Key`):**
  - **Resumo** = `POST /message/sendText/Cars2You Comercial`, body `{number, text:resumo}`.
  - **Documento** = `POST /message/sendMedia/Cars2You Comercial`, body `{number, mediatype:'document', mimetype:'text/plain', media:b64, fileName, caption:''}`. Reaproveita o `b64` do Montar TXT.
  - **Destino** = campo `wa_numero` no Config Evento. **Produção = grupo `120363428156456929@g.us`** ("Remessa de Veiculos Cars2you", 12 membros; chip é membro). Pra testar num número individual, trocar por `55DDDNUMERO` (ex-teste `5511976288713`).
  - ⚠️ **Descoberta do JID:** `GET /group/fetchAllGroups/Cars2You Comercial?getParticipants=false` (só lista grupos onde o chip é membro). Feito via workflow descartável (arquivado).
- **✅ Publicado + validado em produção (08/07):** disparo real no grupo com evento **23463** (9 UFs, 28 carros) — e-mail pros 3 + resumo + .txt no grupo, todos `success` (exec 40648). Teste anterior no número do Caio (exec 40638, evento 23382) também ok.
- **⚠️ Limitação do MCP n8n:** não anexa credencial genérica de HTTP (`httpHeaderAuth`) via API — os 2 nós de WhatsApp tiveram a cred Evolution vinculada **manualmente na UI** pelo Caio. (Outlook/SharePoint anexam via API normalmente.)
- **Pendências menores:** (1) pasta SharePoint ainda se chama **"Sobras de Evento IGA"** (folderId `01WJTTCQRUQ746MRWTVBF3K3OHKE7Y5BY4` estável mesmo renomeando — renomear na UI se quiser). (2) Limpar `sobra_evento_IGA_23463_*.txt` residual (versão antiga rodou junto do novo `remanescentes_*`). (3) `MAPA_GRUPOS_UF` no Formatar ficou vestigial (destino agora é único via `wa_numero`).

### ✅ Alinhamento à skill v4.6 do Guilherme (30/06) — precisão de dados
Reescrita a **camada de dados** do Relatório pra bater 100% com o HTML validado pelo Guilherme (evento 23382, exec 39947). Principais correções:
- **Escopo de usuários dinâmico** (não mais hardcoded cg 10,130): `AND`(`user_whitelabels`∩`event_whitelabels`) **E** (`user_clients_group`∩`event_client_groups`), `situation='3'`, `deleted_at IS NULL`.
- **Base aprovada (EV-13)**: acumulada antes do início, escopo dinâmico → **1959 ➜ 1884**.
- **Ofertas = fonte canônica** `offers WHERE deleted_at IS NULL` (LOTES e OFERTANTES). "Com oferta" = `maxOff != null`, **não** `status IN (7,11)` (removido o filtro de status do LOTES).
- **acc/uniq por lote** vêm de **`access_logs`** (não `advertisement_page_views`).
- **Logins (EV-11/12)**: escopo dinâmico + janela `start_date_display→finish_date_display` (nunca CURDATE).
- **+3 queries access_logs**: EV-08 (KPI "usuários únicos"=acessaram anúncio=100), EV-10 (auditório=74), EV-16 (funil `acessos_unicos`=126, escopo elegível).
- **cad_novos_por_dia = EV-15** (últimos 7 dias a partir de hoje — usa CURDATE; muda conforme o dia da geração).
- **Fuso (regra do Guilherme):** todas as datas do banco são **BRT**; o `Z` é artefato; **nunca** converter -3h. (Reconcilia o debate anterior: eventos fecham 16h BRT.)
- META validado: lotes 38 · com oferta 22 · conversão 57,9% · ofertantes 32 · base 1884 · logins 155 · acessos únicos 126 · anúncio 100 · auditório 74 — **idêntico ao Guilherme**.
- **Sobra**: "sem oferta" agora = `NOT EXISTS (offers WHERE deleted_at IS NULL)` no lugar de `status=11` (validado: 16 carros/8 UFs no 23382).
- Pasta de relatórios no SharePoint renomeada pra **`Relatórios IGA`** (mesmo folderId — dedup do orquestrador segue válido).

### ✅ Template v4.6 do Guilherme adotado — path B (01/07)
Os dados já batiam, mas o **nosso template antigo (Marketplace C2Y)** renderizava diferente do do Guilherme (marca errada, aba Audiência bugada, Recuperação FIPE 69,1% vs 113,4%). Decisão: **adotar o template do Guilherme no n8n**.
- **Template:** subido no SharePoint N8N como **`template_relatorio_iga_v2.html`** (id `01WJTTCQUFB26YNLYYSBG27Q5OXJUPOXKL`, pasta Templates). `Baixar Template` aponta nele.
- **`Injetar no Template` reescrito** (n8n Code) pra preencher os **53 placeholders**: valores simples, arrays JS (`var X={{X}}` bare via JSON.stringify), 15 blocos JS-rendered injetados vazios (o JS do template preenche), e os blocos "Python" construídos em JS (KPIs, EXEC_CARDS, tabelas Pátio/FIPE, KPI_CADASTROS/ENG, INSIGHTS_P1/EX/CO/OP/FI, RECOMENDACOES, ALERTAS) — fórmulas determinísticas espelhando o HTML validado. **Logo IGA base64 inline** (branding loja 594: WL_PRIMARY `#1e289b`, WL_NAME "IGA Gestão de Ativos"). Sem `.join()`/`Object.assign` (validador n8n).
- **`Montar Objetos` — 3 patches:** LOGINS_RAW `h` string "09"; `cad_novos_por_dia.dia` em ISO; STOCKS com `somaOff`/`somaVmv` por pátio.
- **Código-fonte guardado** em `inbox/inject_injetar.js` (+ `inject_montar_patches.md`, `inject_premissas.md`) — reaproveitar/iterar a partir daí.
- **Premissas conscientes:** KPI_ENG usa ponto decimal (igual validado); `usEvento = acessos_unicos` (126), `usAuditOnly = auditorio_unicos` (74); insights por fórmula (títulos espelham o validado). Ver `inbox/inject_premissas.md`.
- **Status:** gerado `relatorio_evento_IGA_23382_01072026.html` OK (run 39987, sem erro). **PENDENTE:** Caio conferir lado a lado com o HTML do Guilherme → apontar divergências → iterar no `Injetar`. **`Enviar E-mail` DESLIGADO** durante a iteração (religar + readicionar Tuunelis após aprovar).

### 🟨 Relatório de Evento IGA — `sYcHnaeVjLRCll9H`
Porta a skill `/relatorio-evento-iga`: 7 queries → monta VEH/STOCKS/LOGINS_RAW/META → injeta no `template.html` → e-mail + WhatsApp.

#### 🆕 Nó `Ajustes do Relatório` (10/08) — ajustes de layout pedidos pelo Caio
Fica **entre `Injetar no Template` e `Subir Relatório`**. O injetor de 430 linhas ficou **intocado**: para reverter tudo, basta **desabilitar este nó**. O `Reanexar HTML` foi repontado para ele (senão o anexo do e-mail sairia com a versão antiga).

**Por que um nó novo e não editar o injetor:** reversível num clique, versionado no histórico do n8n, e evita mexer no template do SharePoint — que é o artefato mais frágil do flow (binário, sem diff, rollback só re-subindo arquivo). Custo aceito: as tabelas Pátio e FIPE são **regeradas** ali, duplicando a formatação do injetor.

O que ele faz:
- **Corrige o logo IGA** (ver bloco do logo abaixo).
- **Referência FIPE:** nova coluna **%VMV** (`maxOff / vmv`; verde ≥100%, laranja abaixo) + colunas numéricas ordenáveis.
- **Performance por pátio:** colunas numéricas ordenáveis (ordem das linhas mantida).
- **Catálogo:** cards de estoque e grupos da tabela em **ordem decrescente por nº de lotes**.
- **Remove:** gráfico "Novos aprovados por dia" (Audiência), **aba Inteligência inteira** (botão + painel p4) e as seções "Recomendações" e "Alertas" (Decisão). Os 4 blocos de Insights da Decisão ficam.

**Ordenação:** cada célula carrega o valor bruto num atributo `data-v`; o JS ordena por ele, não pelo texto formatado. Evita ordem alfabética em valores `R$` e joga os `—` sempre para o fim, nos dois sentidos.

⚠️ **Toda âncora de string é obrigatória** — se o template mudar e alguma sumir, o nó **falha de propósito**. Melhor quebrar do que mandar ao Itaú um relatório com seção que deveria ter sumido. Inclui trava anti-ambiguidade: âncora que aparece mais de uma vez também falha (existem **dois** laços `Object.keys(byS)` no template — o do Catálogo é o que tem `var vlist=byS[sid]`; pegar o errado faz a ordenação silenciosamente não acontecer).

#### 🖼️ O logo do relatório estava corrompido (descoberto 10/08)
O base64 do `WL_LOGO` no `Injetar no Template` tem **duas** corrupções: **4 caracteres a mais na posição 277** e **1 caractere trocado na 4185** — herança de um copiar/colar na migração de 06/07. Assinatura PNG e `IEND` continuam válidos (por isso ninguém percebeu), mas o fluxo comprimido quebra e **o navegador não renderiza a imagem**.

O nó `Ajustes do Relatório` substitui pelo **base64 oficial** (o mesmo do Cockpit, fonte `Downloads/logo_cockpit_iga.txt`), validando em runtime: **4806 bytes · assinatura PNG · 325×48 · checksum 598996**. **PENDENTE:** limpar o `WL_LOGO` corrompido na origem.

#### 🔇 `Resumo no WhatsApp` — DESABILITADO (10/08)
Esse nó **nunca funcionou**: o parâmetro `number` está **vazio** (sem `value`) e o nó está **sem credencial Evolution vinculada**. Sempre devolveu HTTP 400 — ficava invisível porque é o último nó e o e-mail já tinha saído. Foi ele que quebrou a exec 43420 e bloqueou Planilha/Remanescentes do 23675.

Desabilitado até o Caio definir o destino. **Não foi configurado por conta própria porque a mensagem carrega link interno do SharePoint** e o grupo de produção tem gente de fora do time. Ao ligar: definir número/JID **e** vincular a cred Evolution **pela UI** (o MCP não anexa credencial genérica de HTTP).

`Link Anônimo` passou a **`onError: continueRegularOutput` + retry 2x/5s** — deu 401 em 07/08 e barrou o e-mail.
- **✅ MIGRADO PRO MCP (30/06).** As 7 queries viraram pares **`SQL_X` (Code monta `{sql,database}`) → `MCP_X` (run_query)**, espelhando a Sobra. O nó **`Montar Objetos`** agora lê `structuredContent` de cada `MCP_X` via helper `zip(nome)`. Cadeia linear: `Config Evento → SQL_EVENT → MCP_EVENT → … → MCP_CAD_DIA → Montar Objetos`.
- **Etapa 1 (dados) validada via MCP** com os 38 lotes reais do 23382 (exec 39910): **38 lotes · 22 c/ oferta · conversão 57,9% · 32 ofertantes · base 1.959 · 13 pátios** — bate 100% com o esperado. `pct_fipe_medio` 113,4% (>100%, fiel à skill).
- **Gotcha resolvido:** FUNNEL/HOURLY/CAD_DIA usavam CTE (`WITH`), que o MCP rejeita (ver receita acima). Reescritas com subquery escalar `(SELECT DATE(finish_date_event) FROM events WHERE id=X)`.
- **Etapa 2 (entrega) — gera+sobe + E-MAIL validados (30/06, run 39924):** HTML (~392 KB) sobe em `Relatórios` e o **e-mail Outlook envia com anexo** (cred `Microsoft Outlook Caio`). Destinatários de teste: `guilherme.pinheiro` + `caio.ledesma@cars2you.com.br` + `ledesmacaio@gmail.com`.
  - **Bug do anexo resolvido:** o `Subir Relatório` descarta o binário, então o e-mail ficava sem anexo. Inserido nó **`Reanexar HTML`** (Code) entre `Link Anônimo` e `Enviar E-mail` que recupera `binary.data` do `Injetar no Template`. Cadeia: `Subir → Link Anônimo(off) → Reanexar HTML → Enviar E-mail`.
  - **Ainda DESLIGADOS:** `Link Anônimo` (usa `graph.microsoft.com` → daria 401 invalid-audience como o dedup deu; ao ligar, trocar pro host `automakers.sharepoint.com/_api/v2.0`) e `Resumo no WhatsApp`.
  - **⚠️ CORREÇÃO 06/07:** essa nota de "desligados" está **desatualizada**. Na exec 40404 (disparada pelo orquestrador), os nós **`Enviar E-mail`, `Link Anônimo` e `Resumo no WhatsApp` rodaram todos com `success`** — ou seja, estão **LIGADOS**. Consequência: **cada disparo do orquestrador manda e-mail + resumo de WhatsApp reais**. Em 06/07 saíram 2 e-mails + 2 WhatsApp (eventos 23420 e 23434). **PENDENTE:** Caio decidir se mantém ligado (produção) ou desliga até validar, e confirmar destinatários (readicionar `fernando.tuunelis`?).
  - **Pra produção:** readicionar `fernando.tuunelis` aos destinatários quando o Guilherme aprovar.
- Template (385 KB, em branco com o marcador) está no SharePoint N8N. Link do relatório será **público/anônimo** (vai pra fora da organização — decisão do Caio).
- **⚠️ Ajuste pendente do "valor de venda" (analisado 03/07, NÃO aplicado ainda):** hoje o `SQL_LOTES` usa `maxOff = MAX(offers.price)` (maior oferta) como proxy de valor, e o `Montar Objetos` deriva `soma_ofertas`/`somaOff`/`vmv_atingido` disso. O **correto** é `offers.price` da **oferta vencedora** via `advertisement_negotiations.offer_actual_id` (coluna é `offer_actual_id`, **não** `actual_offer_id`; `value_actual` é sujo — preenchido em lote não vendido). Coluna a adicionar no `SQL_LOTES`: `(SELECT o.price FROM offers o WHERE o.id = an.offer_actual_id) AS venda`. **Impacto validado:** em eventos **Misto** não muda nada (todo lote ofertado vende, atinge VMV); em **Pesados** diverge — 23361 (Pesados 26/06): venda real 2.046.100 vs maxOff 2.106.100 (Δ 60k, placa PTR-0847 ofertada não vendida); 23305 (Pesados 22/06): 1.183.900 vs 1.340.900 (Δ 157k, OZM-2F65 + ROQ-0B37). **Bônus:** muita venda ocorre **abaixo do VMV** (condicional), então `vmv_atingido (maxOff≥VMV)` **não** equivale a "vendido" — o sinal de venda é `offer_actual_id` preenchido (= status 7; status 14 = não vendido). Decisão pendente do Caio: opção 1 (substituir maxOff por venda) vs opção 2 (manter ofertado + adicionar campo venda). Mesmo achado do Cockpit Comprador (regra `offers.price` via `offer_actual_id`).

### 🟩 Resultado VD IGA (Planilha) — `UmqceMdN4BSTREMj`
Gera a **planilha .xlsx do Head** (Resultado Operacional VD IGA, 2 abas: Resumo por cluster + Anuncios lote a lote) preenchendo o **template do SharePoint via API de workbook do Graph**. Fluxo isolado (não mexe no Relatório), e-mail próprio.
- **Fluxo:** `Disparar (teste)` / `Quando Chamado (event_id)` → `Config Evento` → `Montar Query` → `MCP Dados` (run_query) → `Montar Valores` (monta matriz 24 col A..X + nome do arquivo) → `Baixar Template` (Graph GET content) → `Subir Copia` (Graph PUT content na pasta **"Resultado IGA - Planilha"**) → `Escrever Anuncios` (Graph PATCH range `Anuncios!A3:X{n}`) → `Baixar Resultado` (Graph GET content) → `Enviar E-mail` (Outlook, anexo). O **Resumo recalcula sozinho** (fórmulas de coluna inteira; Excel Online recalcula no Graph).
- **Descoberta-chave (10/07):** a API de workbook do Graph **NÃO abre pelo host SharePoint `_api/v2.0`** (404). Abre no **`graph.microsoft.com/v1.0/drives/{driveId}/items/{id}/workbook/...`** usando a credencial **`Microsoft Excel Caio`** (audiência Graph + escopo de arquivos, alcança o arquivo do site). O nó nativo Excel do n8n só enxerga OneDrive, por isso vai via HTTP+Graph. Template id `01WJTTCQW6YZUGNFC76RF3G3EMGFXBMTDN`, drive `b!WIoPIE…`.
- **Mapa de dados (validado no 23463, bate 100% com o Head):** cluster=`clusters.name` (via `vehicles.cluster_id`); modelo=`brand+model+version` (UPPER); comb=CASE do `fuels.name`→código F/G/D/H; cor=UPPER `colors.name`; local=`shop_stocks.name` (HUB - UF - leiloeiro); **coluna J (rótulo "FIPE"/grupo "MOLICAR") = `price_reference_advertiser`** (Valor Referência do Vendedor — campo oficial IGA, ~=Molicar mas é o correto); L=VMV=`min_sale_price`; P=Oferta=`offers.price` via `offer_actual_id`; comprador=`offers.buyer_user_id`→`users.full_name/email`; acessos=`access_logs`; status 7→"Vendido", resto→"Sem Ofertas"; K/M="XXX" (não usados). Nome do arquivo usa a **data do evento** (`finish_date_event`), não a de hoje.
- **E-mail (produção):** Outlook, corpo HTML explicativo, anexo .xlsx, assunto usa nome do evento.
  - ⚠️ **Destinatários (conferido 10/08 — a lista de 4 nomes que estava aqui estava ERRADA).** São os **mesmos 10 dos Remanescentes, incluindo o Itaú** — ver seção Remanescentes.
- **Credenciais (limitação MCP):** os 4 nós HTTP Graph (`Baixar Template`, `Subir Copia`, `Escrever Anuncios`, `Baixar Resultado`) precisaram de `Microsoft Excel Caio` vinculada **na UI**. MCP `Cars2You Token` auto-atribuída estava errada → trocada p/ `MCP Cars2You Readonly - BD SQL` (`Cc8CxzVDwvA3EysZ`).
- **Publicado + disparado pros 4 (10/07)** com evento 23463 (52 lotes). **Pendência:** limpar arquivos de teste (`resultado_VD_IGA_23463_10072026*.xlsx` na pasta Templates e o `_10072026` na pasta Resultado IGA - Planilha).

### 🔔 Gatilho Fim de Evento IGA — `Vx8DTLJmho0OvSKJ` (orquestrador)
Dispara Relatório + Sobra **no fim real do evento**, sem depender de relógio.

> 🗓️ **SÁBADO NA JANELA (20/08/2026).** O agendamento passou a ter **dois horários separados por dia da semana**, no mesmo nó (a lista `rule.interval` aceita mais de uma expressão). Publicado, versão ativa `a10da768`. Nó renomeado para `A cada 10 min (seg-sex 16-19h · sáb 12-15h)`.
> | Expressão | Dias | Janela |
> |---|---|---|
> | `0 */10 16-19 * * 1-5` | seg a sex | 16:00 → 19:50 |
> | `0 */10 12-15 * * 6` | sábado | 12:00 → 15:50 |
>
> - **A consulta ao banco NÃO mudou.** Toda a lógica de decisão (silêncio de 10 min, rede de segurança `finish+3h`, `DATE(finish_date_event) = CURDATE()`) é relativa ao **próprio evento** — as 16h só existiam na janela do relógio. Por isso adicionar sábado é mudança de agendamento, não de regra.
> - **Confirmado no banco (75 dias):** sábado **já existia** e sempre com o mesmo padrão — 4 eventos (23321 · 20/06 · 28 lotes; 23382 · 27/06 · 38; 23553 · 18/07 · 59; 23603 · 25/07 · 51), todos com **`finish_date_event` 12:00 e `start_date_offer` 11:00**. Dia de semana é sempre 14:00→16:00. **Nunca houve Pesados no sábado.** Nomes idênticos ao padrão (`Venda Direta IGA - Misto - DD/MM/AA`).
> - **Por que não bastava deixar como estava:** o cron antigo (`* * *`) já rodava no sábado, mas só das 16h. Com o evento encerrando ao meio-dia, a rede de segurança (12:00 + 3h) **armava às 15h, antes do primeiro tique** — então o sábado disparava 4h atrasado **e pelo caminho de último recurso**, não pelo caminho por estado. É o mesmo mecanismo que causou o incidente de 03/07 (evento 23422 disparado com 78 lotes abertos). Com a janela 12-15h, a rede volta a armar perto do **fim** da janela (15h, último tique 15:50), igual ao comportamento de dia de semana (arma 19h, janela fecha 19:50).
> - **Sábado deve sair ~12:20-13h.** A janela de oferta do sábado é de 1h (11-12h) contra 2h no dia de semana (14-16h), e o maior sábado do histórico teve 59 lotes contra 112 no maior dia de semana → cauda menor. Mesmo assim há 3h50 de cobertura, igual aos dias de semana.
> - **Domingo deixou de ter tique** (antes rodava à toa das 16h às 19h50) — não existe evento de domingo no histórico.
> - **Fuso:** o cron roda no relógio do n8n, que é SP (provado: tique das 16:00 SP aparece como 19:00 UTC). `12-15` é literal 12h-15h50 de SP, sem conversão.
> - **Sem risco de borda de meia-noite:** sábado 12:00-15:50 SP = 15:00-18:50 UTC, mesmo dia civil, então `CURDATE()` (que é UTC) continua batendo com `DATE(finish_date_event)`.
> - ⚠️ **Depende do cadastro do evento** — o `finish_date_event` do sábado tem que continuar 12:00. É automático hoje (confirmado pelo Caio), mas se a operação mudar o horário de oferta do sábado, esta janela tem que mudar junto.

> 🚫 **PESADOS FORA DO AUTOMÁTICO (17/08/2026).** Adicionado `AND e.name NOT LIKE '%Pesados%'` na query de detecção do `Montar Query Fim`. Evento de Pesados **não é mais enxergado** pelo orquestrador — não dispara Relatório, nem Planilha, nem Remanescentes. Publicado, versão ativa `49ad40b1`.
> - **Por que:** no Pesados os lotes fecham em `status = 13` (negociação em aberto) com `offer_actual_id` nulo, então a regra de venda (`status IN (2,3,7)` + valor via `offer_actual_id`) devolve **zero venda e R$ 0**. Confirmado no evento **23713** (17/08): 8 lotes, **todos** status 13, todos com oferta (`nOff` 1–4, `lance_max` cheio), todos com `venda: null`. Mesma patologia do 23675 (10/08), lá em 4 de 8 lotes.
> - **O Pesados assenta em minutos** — no 23713 o `finish_date_event` foi 16:00 e a última atividade 16:04, então ele dispara no primeiro tick (16:20) e nunca depende do failsafe. No momento do disparo o desfecho **ainda não existe no banco**.
> - **Cortar na origem (query) e não depois** foi escolha deliberada: o controle de "evento já processado" é o arquivo do relatório no SharePoint. Se o relatório fosse bloqueado *depois* da detecção, o arquivo nunca nasceria, o evento voltaria a ser "novo" a cada 10 min até as 19h e a Planilha dispararia ~16 vezes pros 10 destinatários. Cortando na query, o evento não entra no pipeline e o problema não existe.
> - **Disparo manual continua funcionando** (decisão do Caio) — o corte é só no automático. ⚠️ Ao disparar na mão, conferir o `event_id`: o default do `Config Evento` do Relatório está em **`23674`** (evento de 07/08).
> - **Reverter:** apagar a condição `AND e.name NOT LIKE '%Pesados%'`.
> - ⚠️ **Nó `Disparar Remanescentes` DESABILITADO (17/08)** — foi necessário para conseguir publicar: o n8n **recusa publicar um workflow que chama sub-workflow despublicado** (`Cannot publish workflow: Node "Disparar Remanescentes" references workflow ... which is not published`). Como o Remanescentes está desligado desde 13/08 por decisão do Caio, o nó só produzia erro engolido. **Ao religar o Remanescentes: publicar ele primeiro, depois reabilitar o nó e republicar o orquestrador.**
- **Por que estado e não horário:** `events.status` fica **0 mesmo encerrado** (inútil); o fim do evento é gradual e varia (cauda de disputa). O sinal confiável é: **nenhum lote do evento ainda aberto** — e "aberto" = `advertisement_negotiations.status = 1` (ver FIX 06/07 abaixo).
- **Fluxo:** `Schedule (cron 0 */10 16-19 * * * = a cada 10 min, 16h-19h SP)` → `Montar Query Fim` → `MCP Fim Evento` (run_query) → `Eventos a Disparar` (zip) → `Listar Relatórios` (Graph: lista a pasta Relatórios) → `Filtrar Novos` (dedup) → **[`Disparar Relatório` + `Disparar Remanescentes` + `Disparar Planilha`]** (Execute Workflow, passando `event_id`). **08/07:** nó `Disparar Sobra` renomeado p/ `Disparar Remanescentes` + orquestrador republicado (`098f84cb`). **10/07:** adicionado `Disparar Planilha` (chama `UmqceMdN4BSTREMj`) + republicado (`8eefd7db`); workflow renomeado p/ 🟩. Agora **cada fim de evento IGA dispara os 3 automaticamente**.
- **Query de detecção** (sem CTE): `... HAVING total > 0 AND ((abertos = 0 AND assentado = 1) OR failsafe = 1)`, onde **`abertos = SUM(status = 1)`** (corrigido 06/07 — ver FIX abaixo), **`assentado = (CONVERT_TZ(MAX(an.updated_at),'-03:00','+00:00') + INTERVAL 10 MINUTE <= NOW())`** (carência de 10 min — ver FIX 28/07 abaixo) e `failsafe = (CONVERT_TZ(finish_date_event, '-03:00', '+00:00') + INTERVAL 3 HOUR <= NOW())`. Filtra `name LIKE 'Venda Direta IGA%' AND DATE(finish_date_event)=CURDATE()`.
- **🐛 FIX 06/07 (lógica de detecção por estado):** o `abertos` antigo era `SUM(status NOT IN (7,11))`, assumindo que todo lote termina em **7 (vendido)** ou **11 (sem oferta)**. Errado: os status **terminais reais** de lote IGA são **7, 10, 11, 13, 14, 18** (validado com 120 dias). Lotes fechados em 10/13/14/18 eram contados como "abertos" → o gatilho por estado **nunca** dava OK e sempre caía no failsafe das 19h (foi o que travou 23420 e 23434 em 06/07). **Correção:** inverter a lógica — `abertos = SUM(status = 1)`, pois `status = 1` é o **único** estado de lote aberto/em pregão (aparece só em evento aberto; 0 em fechado). Inverter (whitelist do aberto) é robusto a novos desfechos terminais no futuro. Aplicado + publicado (versão ativa `a22b8f83`). **Validado ao vivo** (exec 40402): detectou 23420+23434 por estado (`abertos=0`, `failsafe=0`), passou dedup, disparou Relatório+Sobra. **Vocabulário de status (IGA):** 1=aberto · 7=vendido · 11=sem oferta · 14=não vendido · 10/13/18=outros terminais.
- **🐛 FIX 28/07 (disparo prematuro — "carros da parte final faltando"):** durante as férias do Caio, os eventos de **21/07 (em branco)**, **22/07 e 24/07 (incompletos)** vieram com carros da ponta final faltando. **Investigação (execuções do orquestrador):** os 3 dias com defeito dispararam às **16:40 SP** (primeiro tick com `abertos=0`, ~40 min após o fim nominal 16:00); o único dia OK (23/07) disparou às **17:20 SP**. Em todos, `failsafe=0` — sempre foi a detecção por estado. **Causa-raiz:** `abertos=0` marca o fim do **pregão** (lote sai do `status=1`), mas **não** garante que a plataforma já gravou os **resultados** (linhas em `offers`, status final 7/11/14, `offer_actual_id`). Existe uma janela A→B entre "pregão fechou" e "resultado gravado"; o gatilho disparava dentro dela e o relatório/planilha/remanescentes liam dados ainda incompletos. **Agravante:** o dedup por arquivo no SharePoint trava o primeiro disparo (furado) como definitivo — não há reprocessamento. **Correção (decisão do Caio + time, 10 min é suficiente):** exigir também **10 min de silêncio desde a última atividade dos lotes** — `assentado = CONVERT_TZ(MAX(an.updated_at),'-03:00','+00:00') + INTERVAL 10 MINUTE <= NOW()`. Ancora no fim **real** (não nos 16:00 nominais, que não resolveriam — os dias furados já disparavam às 16:40); e se a gravação ainda estiver rolando, o relógio se estende sozinho até dar 10 min de silêncio. HAVING passou a `((abertos = 0 AND assentado = 1) OR failsafe = 1)`. Aplicado + publicado (versão ativa `36e3b004`); validado via execução manual (query roda OK, coluna `an.updated_at` existe, colunas novas `ultima_atividade`/`assentado` retornam). Failsafe +3h mantido como rede.
- **🐛 FIX 03/07 (fuso do failsafe):** o failsafe antigo era `finish_date_event + INTERVAL 2 HOUR <= NOW()`, comparando `finish_date_event` **BRT-naive** (16:00) com `NOW()` **UTC** (19:00). A diferença de 3h "comia" as 2h e o failsafe já dava `1` no próprio horário de término → **disparou o evento 23422 hoje às 16:00 com todos os 78 lotes ainda abertos** (só o dedup impediu duplicar às 16:10). Correção: `CONVERT_TZ(finish_date_event,'-03:00','+00:00')` traz o fim pra UTC antes de somar. Subimos a folga pra **3h** (a pedido do Caio) → failsafe arma às **19:00 SP**; por isso o cron foi estendido de `16-18` pra **`16-19`** (senão a hora 19 ficaria fora da janela). `CONVERT_TZ` com offset numérico não precisa das tabelas de timezone do MySQL. Aplicado + publicado (versão ativa `1121dc01`).
- **Dedup = arquivo no SharePoint:** `Listar Relatórios` (HTTP) lista a pasta Relatórios e pula evento que já tem `relatorio_evento_IGA_<id>_*` (prefixo, cobre re-run em dia seguinte). Banco é read-only → não dá pra marcar lá. ⚠️ **URL tem que ser o host do SharePoint** `https://automakers.sharepoint.com/sites/N8N/_api/v2.0/drives/<driveId>/items/<folderId>/children?$select=name` — `graph.microsoft.com` dá **401 invalid-audience** com a cred de SharePoint. (driveId `b!WIoPIE-...`, folder Relatórios `01WJTTCQWOFWTCNZLYDBFII7TRUXMYCRBW`.) Cred do nó HTTP é vinculada manualmente na UI (validador não anexa cred predefinida via API).
- **Como o event_id chega nos flows:** Relatório e Sobra ganharam um 2º trigger **`Quando Chamado (event_id)`** (Execute Workflow Trigger, passthrough) → `Config Evento`, que virou `={{ $json.event_id || 23382 }}` (manual ainda cai no 23382).
- **Regra operacional (Caio):** os lotes do IGA fecham **16h de SP**. A janela do gatilho começa **16h SP**.
- **Relógios:** banco em **UTC puro** (`NOW()` == `UTC_TIMESTAMP()`; confirmado: banco marcava 16:50 enquanto em SP era ~13:50 → **banco = SP + 3h**). Isso afeta só **como a gente LÊ o banco**, não o gatilho: a query de detecção é toda intra-banco (UTC×UTC) → **consistente, não muda**. O **cron roda no relógio do n8n, que é SP**, então a janela `16-19` é literal 16h–19h SP. ⚠️ **Correção 03/07:** a premissa antiga "query intra-banco UTC×UTC, não muda" estava **errada** — `finish_date_event` está **naive-BRT** (não UTC), então comparar com `NOW()` (UTC) dá 3h de erro. O failsafe agora usa `CONVERT_TZ(finish_date_event,'-03:00','+00:00')` antes de somar as 3h (ver FIX acima).
- **Validado (exec 39916):** sem evento hoje → query MCP OK, 0 eventos, **0 disparos** (caminho limpo).
- **✅ Validado ao vivo (30/06):** disparo real forçando o evento 23371 (runs 39920/39921) provou **detecção + hand-off do `event_id` + dedup**. E-mail validado no run 39924 (Relatório direto, 23382). Credencial do `Listar Relatórios` vinculada + URL corrigida pro `_api/v2.0`.
- **⚠️ Pendências pra ativar:** (1) **Ativar o workflow** (Schedule só roda ativo). (2) Readicionar `fernando.tuunelis` no e-mail do Relatório quando o Guilherme aprovar. (3) `Link Anônimo` e `Resumo WhatsApp` seguem off (ligar quando quiser; Link precisa do fix de host `_api/v2.0`). (4) Limpar resíduo de teste: `relatorio_evento_IGA_23371_*` na pasta Relatórios. **Obs:** com o e-mail LIGADO no Relatório, ao ativar o orquestrador ele **vai enviar e-mail de verdade** a cada evento.

### 🧪 Teste MCP Cars2You — `iWllXA6pRTzBZrzh`
Workflow descartável usado pra achar a receita do MCP (SSE + /sse). Pode apagar.

### 🧭 Cockpit Comprador IGA (Loja 594) — `dgxa0pkeFhQVqJ5X`
Relatório **Perfil do Comprador** por **CNPJ de revenda** (não por evento). Projeto pessoal do Caio, **publicado/ativo**. Construído 03/07 do zero (partindo do HTML de referência `cockpit_Clovis_594_v1_3.html`).
- **Fluxo (15 nós):** `Form (E-mail + CNPJ)` → `Normaliza e Valida` (allowlist 4 e-mails: rafael.frugoli/carlos.pedreira @itau + caio.ledesma/guilherme.pinheiro @c2y; normaliza CNPJ tirando máscara) → IF `Autorizado?` (senão tela "Acesso negado") → `SQL Resolve CNPJ` → `MCP Resolve` → `Parse Resolve` → IF `CNPJ encontrado?` (senão tela) → `Montar Queries` (gera 10 queries) → `MCP Run` (roda 1 por item) → `Montar HTML` (template estilizado server-side) → `Anexar HTML` (Code: HTML→binário base64) → `Enviar Relatorio` (Outlook, anexo .html) → `Enviado`.
- **URL do form (produção):** `https://cars2you.app.n8n.cloud/form/12a124e6-bbeb-4100-924c-105dc12fc1c5`. O path `/cockpit` **não gruda via API** (n8n amarra ao webhookId) — só via UI ("Form Path") ou redirect.
- **Resolução do comprador:** `shops.cnpj` → `user_shops` → `user_clients_group.client_group_id=10` → **`users.situation='3'`** (só aprovados; bloqueados como situation=5 NÃO contam). Um CNPJ agrega vários CPFs. Traz também `shops.id` (ID da loja) e `corporate_name`.
- **Regras de dado (validadas):** loja = **`advertisements.shop_id=594`**; valor de venda = **`offers.price`** da oferta vencedora (`an.offer_actual_id`), não `an.value_actual` (idênticos em 99,7%); compra = `an.status IN (2,3,7)`; data = `o.created_at`; ano vigente; estado (market share) via `vehicles.shop_stock_id`; ranking por CNPJ (~501 base c/ situation=3).
- **Nó MCP (padrão que funciona):** typeVersion **1.1**, `tool` resourceLocator modo **id** = `run_query`, `inputMode:json`, `jsonInput: ={{ JSON.stringify({sql,database}) }}`. (`operation/toolName/toolParameters` = errado, dá exclamação.)
- **Entrega:** e-mail do solicitante via cred **`Microsoft Outlook Caio`**; anexo via `additionalFields.attachments.attachments[].binaryPropertyName='data'` (nó `Anexar HTML` cria o binário). HTML render server-side (sem `<script>`, pois abre como anexo).
- **Logo (06/07):** o header do `Montar HTML` usa o **PNG oficial em data URI base64 inline** (`<div class="logos"><img src="data:image/png;base64,…">`), não mais o wordmark CSS de texto antigo. Fonte do data URI: `Downloads/logo_cockpit_iga.txt`. Editado só o bloco do logo (SHA-256 do jsCode conferido). Regras CSS `.c2y`/`.iga`/`.dv` ficaram órfãs no `<style>` (inofensivas).
- **Waiting:** os nós de conclusão do Form pausam a execução p/ servir a página; disparo via API (sem navegador) ficava em Waiting eterno → resolvido com **`limitWaitTime:true` (1 min)** nos 3 nós de conclusão (auto-encerra).
- **Gotchas SDK** (create_workflow_from_code): sem `function`/arrow no nível do script, sem `.join()`; jsCode grande vai como string única. Editar via `update_workflow` (updateNodeParameters). Escapar jsCode grande com `node -e "JSON.stringify(...)"`.
- **Pendências:** Caio validar números CARVAK; deletar execuções Waiting antigas na UI; compartilhar workflow com o time; opcional /cockpit via UI.

## Infra / rede
- n8n Cloud é externo à VPC; banco só via MCP (público + bearer) ou VPN.
- Planilha de propostas: estava no **OneDrive pessoal do Caio**, sendo movida pro **SharePoint N8N** (governança — não depender da conta pessoal).
- Template do relatório: **SharePoint N8N** (biblioteca Documentos).

## 🔐 Contas de serviço / credenciais (migração 28/07)

**Decisão:** tirar as automações IGA da conta pessoal do Caio e centralizar na conta de serviço **`powerbi@cars2you.com.br`** (dona da pasta no SharePoint). Migrado + publicado em 28/07 nos **5 flows do Caio** (Relatório, Remanescentes, Planilha, Cockpit, Orquestrador).

| Tipo | Credencial nova (powerbi) | ID | Substituiu |
|---|---|---|---|
| Outlook | Microsoft Outlook Power BI/Automações | `G3MiTRT9jTVPx6Wn` | Microsoft Outlook Caio |
| SharePoint | Microsoft SharePoint Conta PowerBI/Automações | `AOTm9J6pFcF0DS6g` | Microsoft SharePoint Caio |
| Excel/Graph | Microsoft Excel Power BI/Automações | `ZZlB5pMp9oH6hdlH` | Microsoft Excel Caio |

- **Nós rebindados:** Outlook (4): Relatório·`Enviar E-mail`, Remanescentes·`Enviar E-mail (Remanescentes)`, Planilha·`Enviar E-mail`, Cockpit·`Enviar Relatorio`. SharePoint (5): Relatório·`Baixar Template`+`Subir Relatório`, Remanescentes·`Subir Remanescentes TXT`, Orquestrador·`Listar Relatórios`. Excel/Graph (4): Planilha·`Baixar Template`,`Subir Copia`,`Escrever Anuncios`,`Baixar Resultado`.
- **Novidade:** `setNodeCredential` via API do MCP **funcionou até nos nós HTTP** (`Listar Relatórios`, os 4 Graph) — a limitação antiga ("HTTP só na UI") **não** se aplicou aqui. Nós dedicados (Outlook/SharePoint) idem.
- **Validado por execução manual (28/07):** Planilha `success` (Outlook+Graph powerbi) e Remanescentes `success` (SharePoint upload + Outlook, WhatsApp off, e-mail só p/ Caio). `Listar Relatórios` (dedup) não foi exercido (sem evento no horário do teste) mas usa a mesma cred SharePoint já validada → confirma no evento real.
- **Rodapé "não responda / dúvidas com Caio":** aplicado em Remanescentes + Planilha. **PENDENTE:** Relatório e Cockpit (corpos maiores — Cockpit é HTML server-side no `Montar HTML`).
  - ⚠️ **Gotcha:** no corpo TEXT, quebra de linha na expressão tem que ser `\\n` **escapado** (não quebra literal), senão `ExpressionExtensionError: invalid syntax`. (Quebrou o 1º teste da Remanescentes.)
- **Fora de escopo:** `IGA - Controle de cadastros diários` (Guilherme, já migrou) e (presumido) `IGA - Análise de base de cadastros`.
- **PENDENTE:** (1) limpar arquivos de teste no SharePoint (`resultado_VD_IGA_23463_*.xlsx`, `remanescentes_evento_IGA_23382_*.txt`). (2) Aposentar as creds pessoais do Caio (Outlook/SharePoint/Excel Caio) **só depois** de 1-2 eventos reais OK — manter alguns dias como fallback. (3) `Link Anônimo` (Relatório, off) segue na cred antiga; se ligar, apontar p/ powerbi.
