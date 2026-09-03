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

### 2. Calcula aging (a partir do brain)
Sinaliza o que está dormindo tempo demais:
- Pendência que reaparece em 2+ sessões seguidas em `memory/sessions/` sem fechar
- Frente sem nenhuma entrada nova em `03-historico.md` há > 7 dias
- Item em "Esperando outros" no `estado-atual.md` há > 5 dias

Ajuste os limites conforme o padrão do seu fluxo ficar claro.

### 3. Identifica cobranças
Cruza pendências do brain × dia da semana:
- Itens que dependem de terceiros há > X dias = candidatos a cobrança
- Reuniões agendadas pra hoje
- Compromissos assumidos em sessões anteriores chegando perto do prazo

### 4. Aplica pré-filtro silencioso
Descarta automaticamente (sem perguntar): status updates rotineiros, confirmações de reunião já feitas, cobranças já feitas na última sessão, itens fechados nas últimas 24h.

### 5. Compõe o cockpit
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
- **[item]** ([N] dias parado) — [resumo]

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

- **Sem ferramenta de cards:** o Thomas não usa Jira. A rotina roda inteiramente com o estado do brain (`memory/sessions/`, `estado-atual.md`, `03-historico.md` das frentes). Não tente consultar Jira.
- **Sem pendências:** OK — rotina enxuta. Significa tudo em dia (ou brain não alimentado).
- **Carga muito alta (10+ no top):** flagueia sobrecarga, sugere repriorizar/delegar.

## Limites de token

- Não re-lê arquivos já lidos no `/cerebro` da mesma sessão.
