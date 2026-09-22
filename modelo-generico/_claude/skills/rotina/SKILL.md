---
name: rotina
description: Cockpit pessoal do dia — top do dia, aging de itens dormindo, cobranças necessárias, alertas. Pré-filtra ruído silenciosamente. Use de manhã, depois de /cerebro. Acionar para -> "rotina", "cockpit", "comeco do dia", "manha", "o que tenho hoje", "agenda do dia", "pendencias do dia", "meu dia".
---

# Skill: /rotina

Cockpit **pessoal** do dia. Foco: **o que VOCÊ vai executar hoje** — não o panorama do
negócio, que é trabalho do `/cerebro`.

## Pré-requisito

`/cerebro` carregado nesta sessão.

## O que esta skill faz

### 1. Lê o estado do brain
- `memory/sessions/` — últimas 3 sessões, extraindo pendências em aberto
- `memory/decisions/` — últimos 7 dias, extraindo cobranças pendentes
- `subjects/<frente>/03-historico.md` — últimos 7 dias, pra saber quais frentes estão quentes
- `subjects/<frente>/04-cards.md` — se existir, referência cruzada

### 2. Calcula aging
Sinaliza o que está dormindo tempo demais:
- Pendência que reaparece em 2+ sessões seguidas sem fechar
- Frente sem nenhuma entrada nova em `03-historico.md` há mais de 7 dias
- Item em "Esperando outros" no `estado-atual.md` há mais de 5 dias

Ajuste os limites conforme o padrão do seu fluxo ficar claro. Quem trabalha em ciclos
longos precisa de números maiores; quem responde a demanda diária, menores.

### 3. Identifica cobranças
Cruza pendências × tempo × dia da semana:
- Itens que dependem de terceiros há mais de X dias = candidatos a cobrança
- Reuniões agendadas para hoje
- Compromissos assumidos em sessões anteriores chegando perto do prazo

### 4. Aplica pré-filtro silencioso
Descarta **sem perguntar**: status updates rotineiros, confirmações de reunião já feitas,
cobranças já feitas na última sessão, itens fechados nas últimas 24h. Cockpit que mostra
tudo não é cockpit — é a mesma pilha, só que formatada.

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

**Entra no top:** tem prazo hoje ou iminente; tem visibilidade de quem cobra; é bloqueador
de outra frente; foi sinalizado como prioridade na última sessão.

**Vai pro pool:** pode esperar 1-2 dias; cobrança não-crítica; análise exploratória;
reunião já confirmada.

**Limite:** 4 por padrão, 5 quando há reunião + entrega + cobrança no mesmo dia. 6 ou mais
é sinal de sobrecarga — diga isso em voz alta em vez de listar.

## Adaptação

O padrão assume que **o brain é a única fonte de tarefas**. Se você usa Jira, Linear,
Trello ou Asana, registre aqui qual é e como consultar — e mande a skill cruzar as duas
fontes em vez de confiar só nos arquivos.

## Falhas comuns

- **Sem pendências:** OK — rotina enxuta. Significa tudo em dia, ou brain não alimentado.
  Diga qual dos dois você acha que é.
- **Carga muito alta:** sinalize sobrecarga e sugira repriorizar ou delegar. Não expanda o top.
- **Brain vazio (primeira semana):** a rotina só fica útil depois de 3-4 `/salve`. Avise.

## Limites de token

- Não releia arquivos já lidos no `/cerebro` da mesma sessão.
