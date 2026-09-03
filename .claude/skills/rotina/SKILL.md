---
name: rotina
description: Cockpit pessoal do dia — top do dia, aging de itens dormindo, cobranças necessárias, alertas. Pré-filtra ruído silenciosamente. Use de manhã, depois de /cerebro. Acionar para -> "rotina", "cockpit", "comeco do dia", "manha", "o que tenho hoje", "agenda do dia", "pendencias do dia", "meu dia".
---

# Skill: /rotina

Cockpit **pessoal** do dia. Foco: **o que VOCÊ vai executar hoje**.

## Pré-requisito

`/cerebro` carregado nessa sessão.

## O que esta skill faz

### 1. Lê o estado atual do brain
- `memory/sessions/` últimas 3 sessões — extrai pendências em aberto
- `memory/decisions/` últimos 7 dias — cobranças pendentes
- `subjects/<frente>/03-historico.md` últimos 7 dias — frentes "quentes"
- `subjects/<frente>/04-cards.md` se existir — referência cruzada

### 2. Consulta Jira (live via MCP, SE configurado)
Para cada frente ativa, busca cards não concluídos com foco no Thomas (assignee ou aguardando decisão dele).
JQL de exemplo (ajustar projetos e status ao fluxo real):
```
project IN (<SEUS_PROJETOS>) AND statusCategory != Done
AND (assignee = currentUser() OR status IN (<status que aguardam você>))
ORDER BY updated DESC
```

> **Configuração pendente:** substituir `<SEUS_PROJETOS>` pelas chaves reais e `<status que aguardam você>` pelos status do fluxo. Enquanto não estiver preenchido, esta seção roda em modo degradado (ver "Falhas comuns").

### 3. Calcula aging
Para cada card, sinaliza os que estão parados tempo demais num status. Limites padrão:
- "Em Desenvolvimento" > 7 dias
- "Aguardando decisão" > 5 dias

Ajuste os limites ao fluxo real conforme o padrão ficar claro.

### 4. Identifica cobranças
Cruza pendências do brain × estado do Jira × dia da semana:
- Itens que dependem de terceiros há > X dias = candidatos a cobrança
- Reuniões agendadas pra hoje
- Compromissos assumidos em sessões anteriores chegando perto do prazo

### 5. Aplica pré-filtro silencioso
Descarta automaticamente (sem perguntar): status updates rotineiros, confirmações de reunião já feitas, cobranças já feitas na última sessão, itens fechados nas últimas 24h.

### 6. Compõe o cockpit
Resultado: **top 4-5 do dia** + pool secundário organizado por frente.

## Output esperado

```
# ☀️ Rotina — YYYY-MM-DD (HH:MM)

## 🎯 Top 4-5 do dia
1. **[Ação concreta]** — [Frente] — [Por quê HOJE]
2. ...

> Se você só fizer essas, o dia está bom.

## 📂 Pool secundário (por frente)
### `<frente>`
- _

## 🚧 Aging — coisas dormindo
- **[card]** ([N] dias em [status]) — [resumo]

## 🔴 Cobranças pra hoje
- **[Pessoa]** sobre **[assunto]** — última menção há [N] dias

## 📅 Reuniões agendadas hoje
- HH:MM — [Assunto] — [Participantes]

## ⚠️ Alertas em radar (não exigem ação hoje)
- _

---
[Resumo de 1 linha: "Hoje você tem N reuniões, M cobranças e o foco é X"]
```

## Regras de Top 4-5

**Entra no top:** tem prazo hoje/iminente; tem visibilidade de quem cobra; é bloqueador de outra frente; foi sinalizado como prioridade na última sessão.
**Não entra (vai pro pool):** pode esperar 1-2 dias; cobrança não-crítica; análise exploratória; reunião já confirmada.
**Limite:** 4 padrão, 5 quando há reunião + entrega + cobrança juntas. 6+ é sinal de sobrecarga — flag pro usuário.

## Falhas comuns

- **Jira indisponível/não configurado:** usa último snapshot em `memory/inputs/jira/` se existir, senão gera rotina só com o estado do brain.
- **Sem pendências:** OK — rotina enxuta. Significa tudo em dia (ou brain não alimentado).
- **Carga muito alta (10+ no top):** flagueia sobrecarga, sugere repriorizar/delegar.

## Limites de token

- Queries Jira com `maxResults: 50`, sem puxar Concluído.
- Não re-lê arquivos já lidos no `/cerebro` da mesma sessão.
