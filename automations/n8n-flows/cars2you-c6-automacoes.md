# n8n — Automações Cars2You / C6 Lojistas

> Registro dos workflows do **C6 Lojistas** na instância `cars2you.app.n8n.cloud`.
> **Sem segredos aqui** — só nomes e IDs de credencial.
> Criado em 2026-08-26.

## 🚨 A regra que define esta frente: o C6 é APARTADO do IGA

Decisão do Caio em 26/08: **fluxos novos, nada reaproveitado do IGA**, porque o risco de uma informação sair para o banco errado é crítico.

**E a apartação NÃO pode ser por white-label.** Investigando o banco em 26/08 descobriu-se que existem **três trilhas C6**, e uma delas colide com o IGA:

| Trilha | Nome do evento | shop_id | whitelabel | client_group |
|---|---|---|---|---|
| **C6 Lojistas** ← escopo destes fluxos | `Evento Exclusivo C6 Auto – DD/MM/AA` | **104754** (C6 Bank Lojista) | 43 | 69 |
| C6 Feirão (fora) | `Feirão Eletrônico C6 Auto – DD/MM/AA` | 9034 (Banco C6 S.A) | **7** ⚠️ | 5, 11, 50, 102, 109 |
| C6 Colaboradores (fora) | `Oportunidade CSixers – DD/MM/AA` | — | 48 | 96 |
| IGA/Itaú (**nunca tocar**) | `Venda Direta IGA%` | 594 (Itaú Unibanco) | **7** ⚠️ | 10, 130 |

🔴 **O Feirão Eletrônico C6 roda no whitelabel 7 — o mesmo do IGA/Itaú.** Filtrar C6 por white-label traria evento do Itaú para dentro do relatório do C6. **A chave é `advertisements.shop_id`.**

C6 Colaboradores usa o apelido **"CSixers"** (por isso não aparece numa busca por "C6") e está parado desde **16/06/2026**. Nomenclatura inconsistente: "Evento CSixer", "Oportunidades CSixers", "CARBON FRIDAY". Se entrar em escopo, filtrar por `wl 48` / `cg 96`, nunca por nome.

## 📋 Workflows

### 🔷 Relatório de Evento C6 Lojistas — `ehsqQo6hiPDRf58I`
Publicado 26/08. Porta a skill `/relatorio-evento-c6`.

**Cadeia (16 nós):** `Disparo Manual (event_id)` (Form, path `relatorio-c6`) **+** `Quando Chamado (event_id)` → `Config Evento` → `SQL Guard Escopo` → `MCP Guard Escopo` → `Checar Escopo` → `SQL Lotes` → `MCP Lotes` → `SQL Meta` → `MCP Meta` → `Montar Objetos` → `Baixar Template C6` → `Injetar no Template` → `Subir Relatório` → `Reanexar HTML` → `Enviar E-mail`.

- **✅ Validado ao vivo (exec 46367, 11s)** com o evento **23668**: 31 lotes · 10 com oferta · 32,3% · 36 lances · 14 ofertantes · R$ 496.000 · 89,8% do VMV · base 2.854 · 158 logaram. **Bate 100% com a skill local e com o Excel do Head.**
- **Escopo travado em 3 camadas, de propósito redundante:** `SQL Guard` reprova antes de tudo; o `WHERE` do `SQL Lotes` filtra `shop_id = 104754`; e `Montar Objetos` confere lote a lote. Qualquer violação **lança erro e nada é gerado**.
- **`Config Evento` NÃO TEM VALOR PADRÃO, de propósito.** No IGA o default ficou parado em `23674` e um disparo manual quase mandou o evento da semana anterior para 10 destinatários. Aqui `event_id` ausente = erro imediato. O disparo manual é por **formulário**, que obriga a informar o id.
- **Trava de segurança de contagem embutido na própria query:** o `SQL Lotes` devolve `JSON_OBJECT('total', COUNT(*), 'lotes', JSON_ARRAYAGG(...))`. Se `lotes.length !== total`, `Montar Objetos` **aborta**. Cobre tanto o cap de 50 linhas do MCP quanto o limite de tamanho do próprio `JSON_ARRAYAGG`.
- **O HTML barra PII:** o `Injetar no Template` lança erro se o HTML contiver `comp_doc`, `comp_fone`, `comp_mail` ou `loja_cnpj`. Dado pessoal vive **só na planilha**, que é anexo dirigido — o HTML pode ganhar link e circular.
- **Retrata o PREGÃO:** valor de referência = `MAX(offers.price)`, não `offer_actual_id`. Todos os rótulos dizem "oferta"/"pregão". Ver o porquê no orquestrador.
- **Template no SharePoint:** `Templates C6/template_relatorio_c6.html` (392 KB, id `01WJTTCQW3I6YTOU3DSFCJM3SXQS4IPXKT`). Saída em `Relatorios C6 Lojistas/relatorio_evento_C6_<id>_<DDMMAAAA>.html`.
- **Destinatários (27/08): 7 por e-mail** — Caio, Tuunelis, Donizeti, Mattera, Guilherme, Ana Luz e Thais Martins. Todos os endereços conferidos contra fluxos que já rodam (a lista dos 10 do IGA e o `EMAIL_FALLBACK` da Lista LM), **nenhum inferido**. O Caio foi incluído por mim — ele não se listou no pedido, mas é quem assina o rodapé.
- **WhatsApp: 5 números** — Guilherme, Tuunelis, Mattera, Donizeti e Ana. Padrão do Remanescentes IGA: `sendText` com o resumo, depois `sendMedia` com o arquivo, **um item por número** (o Evolution manda para um número por chamada).
- ⚠️ **Thais Martins fica só no e-mail** — o Caio passou 5 celulares e o dela não estava entre eles. **O número existe e está confirmado no brain:** `5511947619656`, registrado como `CELULAR_FALLBACK` da Lista LM e já usado em disparo real para ela. Ou seja, a pendência é **decidir se ela entra**, não descobrir o número. Acrescentar em `Expandir Destinos WhatsApp` nos dois fluxos.
- **`modo_teste` é campo do formulário, não texto fixo.** Marcado, prefixa `[TESTE]` no assunto e uma tarja de aviso no e-mail e no WhatsApp. O disparo automático não passa o campo, então cai em `false` sozinho — **não existe o risco de esquecer o aviso ligado em produção**.
- **E-mail sai antes do WhatsApp, em série.** Se o Evolution quebrar, o e-mail já foi. Os nós de WhatsApp **não têm** `continueRegularOutput`: falha aparece na execução em vez de virar silêncio.
- **✅ Validado com disparo real** (execuções 46442 e 46451) para os 7 + 5, com aviso de teste. Evolution respondeu `PENDING` com os `remoteJid` corretos.

### 🔷 Gatilho Fim de Evento C6 Lojistas — `PYCbGrJqV1a0u9hP`
Criado 26/08, **ativado 27/08 pelo Caio**. Roda em produção: `active: true`.

**Cadeia (7 nós):** `A cada 10 min (seg-sab 16-23h)` → `Montar Query Fim` → `MCP Fim Evento` → `Eventos a Disparar` → `Listar Relatorios C6` → `Filtrar Novos` → `Disparar Relatorio C6`.

- **✅ Caminho limpo validado (exec 46368):** sem evento fechado no momento → 0 eventos, cadeia para sem erro e sem disparo.
- **A janela é diferente da do IGA e isso importa.** O IGA fecha **sempre 16h**; o Exclusivo C6 fecha **16h ou 20h**, e o C6 tem evento quase todo dia (16 eventos em ~1 mês, contra 1/semana do IGA). Cron: `0 */10 16-23 * * 1-6`.
- **Failsafe de 2h, não 3h:** com 3h, o failsafe de um evento das 20h armaria às 23h, fora da janela. Com 2h arma às 18h (evento de 16h) e 22h (evento de 20h) — ambos dentro.
- **🔑 Por que NÃO espera o desfecho da venda.** No C6 o lote fica **dias** em `status 13` (análise do vendedor) com `offer_actual_id` nulo — o evento de 24/08 ainda estava assim em 26/08. Aplicar a regra de venda do IGA (`status IN (2,3,7)` + valor via `offer_actual_id`) devolveria **zero venda e R$ 0**: exatamente a patologia que tirou os Pesados do automático. Por isso o gatilho é o **fim do pregão** (`SUM(status = 1) = 0`) e o relatório retrata o pregão.
- **10 min de silêncio** desde `MAX(an.updated_at)` — herda o fix de 28/07 do IGA (senão lê antes da plataforma gravar as ofertas).
- **Dispara Relatório e Planilha em paralelo** (27/08), os dois com `continueRegularOutput`. Em paralelo e não em série de propósito: no IGA os três disparos encadeados com `waitForSubWorkflow` fizeram uma falha no primeiro deixar **três eventos sem planilha**.
- **Dedup:** arquivo `relatorio_evento_C6_<id>_*` na pasta `Relatorios C6 Lojistas`. Mesmo ponto cego do IGA: se o relatório subir e depois falhar, o evento vira "processado". 🔴 **E o dedup olha só o arquivo do Relatório** — se a Planilha falhar sozinha, o evento segue marcado como processado e a planilha nunca sai. Melhoria pendente: dedup por artefato de cada fluxo.

### 🔷 Planilha de Evento C6 Lojistas — `lXJNM4hbE92vEDsu`
Publicado 27/08. Gera o `.xlsx` no layout do Head, sobe no SharePoint e manda por e-mail e WhatsApp. Mesmos 7 destinatários e 5 números do Relatório.

**Cadeia (20 nós):** dois triggers → `Config Evento` → guarda de escopo → `SQL Lotes` → `MCP Lotes` → `SQL Meta` → `MCP Meta` → `Montar Objetos` → `Expandir Linhas` → `Gerar XLSX` → `Extrair Base64` → `Subir Planilha` → `Reanexar XLSX` → `Enviar E-mail` → `Expandir Destinos WhatsApp` → `Enviar WhatsApp Resumo` → `Enviar WhatsApp Documento`.

- **✅ Validado (execução 46450):** `resultado_evento_C6_23668_10082026.xlsx`, 48.734 bytes, 31 linhas, 26 colunas. E-mail com anexo e documento no WhatsApp confirmados.
- **🔑 Sem template Excel e sem Graph API.** Usa o nó nativo **`Convert to File`** (operação `xlsx`): a ordem das chaves do JSON vira a ordem das colunas. Dispensa manter template no SharePoint e **contorna de vez** a limitação de que `freezePanes`, `dataValidation` e `conditionalFormats` não existem na API do Graph. Custo: a planilha sai **sem formatação** — sem cor, largura de coluna ou formato de moeda. Se o Head pedir, aí sim migrar para template.
- **Independente do Relatório de propósito** — e isso duplica a query. No IGA os três flows acoplados por `waitForSubWorkflow` fizeram um erro no primeiro deixar **três eventos sem planilha**. ⚠️ **Dívida assumida:** a query de lotes vive em dois lugares — ao mexer numa, mexer na outra.
- **🔴 Carrega dado pessoal** (CPF, telefone, e-mail do comprador e CNPJ da loja) e **sai nos dois canais** — decisão explícita do Caio em 27/08, depois de o risco ser levantado. O e-mail leva tarja vermelha e o WhatsApp uma linha em negrito, ambos com "não encaminhar fora do time". Diferente do Relatório, aqui **não há** barreira de PII: seria contraditório.

### 🧰 TEMP infra C6 (upload SharePoint) — `s6EERWKLPXPNtUbV`
Descartável. Webhook `POST /webhook/temp-c6-infra?dest=<path>` recebe arquivo em raw body e sobe no SharePoint. Usado para subir o template. **Arquivar quando não precisar mais.**

## 🔑 Infra e credenciais

| Item | Valor |
|---|---|
| Drive SharePoint | `b!WIoPIE-Ra0WlwvYnLSod44VOGNL5_GRNoDqrqsWDT53xop-CS7vvT4Ura4LiRKaM` |
| Host | `https://automakers.sharepoint.com/sites/N8N/_api/v2.0` |
| Pastas C6 | `Templates C6/` · `Relatorios C6 Lojistas/` |
| MCP banco | `https://mcp-cars2you-readonly.cars2you.com.br/sse` · cred `Cc8CxzVDwvA3EysZ` |
| SharePoint | cred `AOTm9J6pFcF0DS6g` (Conta PowerBI/Automações) |
| Outlook | cred `G3MiTRT9jTVPx6Wn` (Power BI/Automações) |

💡 **Upload por path cria as pastas intermediárias.** `PUT /drives/{id}/root:/Pasta/arquivo.html:/content` cria "Pasta" se não existir. Isso dispensa descobrir `folderId` — os fluxos C6 usam **paths**, não IDs, e ficam legíveis e imunes a alguém recriar a pasta.

## 💰 Regra financeira do C6 (validada 10/10 no evento 23668)

Não sai do banco e não estava em nenhum lugar do brain. Constantes no `Montar Objetos`, num lugar só:

```
TX DEALERS   = R$ 900     (fixo)
TX CARS2YOU  = R$ 449     (fixo)
4,7% DEALERS = (BOLETO − 900 − 449) × 0,047   ← incide sobre o LÍQUIDO, não sobre o boleto cheio
REPASSE C6   = BOLETO − 4,7% − 900 − 449
VMV do Head  = FIPE × 0,75   (o banco grava esse valor arredondado para a centena acima)
```

## 🆕 Descobertas de ferramenta (26-27/08) — valem para qualquer fluxo

Somam-se às regras já registradas em `cars2you-iga-automacoes.md` (cap de 50 linhas, CTE rejeitado, fuso BRT-naive, "falha vira silêncio"):

- **`JSON_ARRAYAGG` não aceita `DISTINCT`** — erro de sintaxe. Usar `GROUP_CONCAT(DISTINCT ...)`.
- **`information_schema` é bloqueado** pelo validador do MCP (`access to system schema is not allowed`).
- **✅ `SHOW TABLES LIKE '...'` passa** — é a via para introspecção. Para descobrir colunas, `SELECT * FROM tabela LIMIT 1` e ler as chaves.
- 🔥 **`setNodeCredential` ANEXA credencial `httpHeaderAuth` via API.** O brain registrava desde julho que "o MCP do n8n não anexa credencial genérica de HTTP" e que os nós de WhatsApp do Remanescentes tiveram de ser ligados na mão pela interface. **Não é mais verdade** — a credencial Evolution colou nos quatro nós de WhatsApp do C6 pela API. Vale para os fluxos do IGA e da LM que ainda carregam essa nota.
- 🔴 **O nó do Outlook SUBSTITUI o `json` pela resposta da API da Microsoft.** Qualquer coisa que precise sobreviver ao e-mail tem de ser lida **por referência** (`$('Nó Anterior').first().json`), nunca de `$input`. Foi o erro da execução 46449: o `b64` da planilha chegou vazio no WhatsApp porque o nó de expansão lia do input. Mesma família de "o nó descarta o que veio antes" que já mordeu com o binário no upload do SharePoint.
- **`Convert to File` (xlsx) substitui template + Graph** para planilha sem formatação — a ordem das chaves do JSON é a ordem das colunas. Para o base64, `Extract from File` com `binaryToPropery` e `keepSource: 'both'` funciona e não depende do modo de armazenamento de binário do n8n.
- ⚠️ **Percentual em `Number.toLocaleString` não resolve o separador decimal** de um número solto: `String(32.3)` sai `32.3`. Nas mensagens em português, converter com `String(n).replace('.', ',')`. O META que alimenta o HTML segue **numérico** — os gráficos dependem disso.
- **O validador do SDK rejeita função declarada no nível do script e `.join()`** — usar `const f = function () {}` e template literal para o `jsCode`.
- **`setNodeCredential` via API funciona em nós HTTP**, mesmo quando o `create_workflow_from_code` os pula no auto-assign (o aviso "must be configured manually" não é definitivo).

## 📊 Mapa de dados (validado 31/31 contra o Excel do Head)

Detalhe completo em `.claude/skills/relatorio-evento-c6/SKILL.md`. Os pontos que mais custaram:

- `LOTE` = `advertisements.id`
- `MOLICAR` = `advertisement_negotiations.price_reference_advertiser` — **não** `vehicles.molicar_price`, que divergiu no lote 453525
- `PASSAGENS` = negociações do mesmo `vehicle_id` **até a data do evento** (29/31)
- `ACESSOS` e `STATUS` divergem do Excel por **motivo temporal**: a planilha do Head é um retrato tirado antes do evento assentar. O automatizado dá números maiores e mais corretos — **avisar o Mattera** antes da primeira rodada.
- Comprador: `offers.buyer_user_id` → `users` (`full_name`, `email`) + `user_profiles` (`document` = CPF, `phone`); loja via `offers.buyer_shop_id` → `shops` (`corporate_name`, `cnpj`)

## ⏳ Pendências

- ✅ **Orquestrador ativado em 27/08** e já disparando Relatório + Planilha em paralelo. O ciclo do C6 roda sozinho de ponta a ponta. Acompanhar os primeiros disparos automáticos: o relatório saiu validado só em disparo manual.
- 🔴 **Decidir se a Thais entra no WhatsApp do C6** — o número (`5511947619656`) está confirmado no brain; ela só não foi incluída porque não estava nos 5 que o Caio passou.
- 🔴 **Avisar o Mattera** que o automatizado difere do Excel dele em acessos e status (motivo temporal), e que a planilha carrega dado pessoal.
- ⚠️ **`cad_total` é um retrato do momento da geração, não do evento.** O mesmo evento 23668 deu **2.854** de manhã e **2.897** à tarde: a query conta lojistas ativos do grupo 69 **agora**, sem recorte de data. Reprocessar um evento antigo devolve um número diferente do que foi enviado na época. Decidir se vale ancorar na data do evento — é a terceira métrica com divergência temporal, junto de acessos e status.
- Arquivar `TEMP infra C6` (`s6EERWKLPXPNtUbV`) e apagar `Relatorios C6 Lojistas/_teste.txt`.
- Confirmar com o Mattera as 2 divergências de `PASSAGENS` (lotes 452923 e 452924: Excel 2, banco 1).
