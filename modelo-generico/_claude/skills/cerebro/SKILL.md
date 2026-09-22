---
name: cerebro
description: Bootstrap de sessão. Pull do repo, leitura do estado-atual.md, context e últimos commits. Acione SEMPRE no início de uma sessão de trabalho neste brain. Acionar para -> "comecar sessao", "acordar", "carregar contexto", "o que rolou", "boot", "inicio de sessao".
---

# Skill: /cerebro

Acorda a IA com o contexto necessário pra trabalhar neste brain. Use SEMPRE no início de uma sessão.

## Filosofia (importante)

Este `/cerebro` é **enxuto por design**. Lê **só o que dá o panorama do dia** e carrega o
resto **sob demanda**, quando a conversa pedir. Ler todas as frentes no boot é caro e
desnecessário — e brain caro é brain que a pessoa abandona.

**A inteligência viva do brain mora em `estado-atual.md`** (raiz). Esse arquivo é mantido
pelo `/salve` no fim de cada sessão e contém: frentes quentes, frentes frias, decisões em
aberto, cobranças, alertas e compromissos. É a fonte da verdade pro "o que tá acontecendo
agora".

Quando a conversa entrar numa frente específica ("vamos mexer em X"), aí sim leia os
arquivos daquela frente. Não antes.

## O que esta skill faz no boot

1. **Sincroniza:** `git pull --rebase`.

2. **Lê o contexto pessoal** (pequeno, alto valor):
   - `context/empresa.md`
   - `context/meu-papel.md`
   - `context/produtos.md`
   - `context/stakeholders.md`

3. **Lê o estado atual (núcleo do boot):**
   - `estado-atual.md` na raiz.
   - Se não existir: "Primeira vez rodando o /cerebro. Quer que eu reconstrua o
     estado-atual.md varrendo todas as frentes? Vai custar tokens dessa vez." E aguarde.
   - Se a data no cabeçalho for de mais de 7 dias atrás: avise que pode estar stale e
     pergunte se reflete a realidade ou se quer reconstruir.

4. **Inspeciona o movimento recente do repo:**
   ```
   git log --since="3 days ago" --pretty=format:"%h %an %ar %s" --stat
   ```
   O log já narra quais arquivos mudaram em quais frentes. **Não abra os arquivos** pra
   descobrir o que mudou.

5. **NÃO LÊ no boot** (sob demanda depois):
   - Nenhum arquivo de `subjects/<frente>/`
   - `memory/sessions/*`, `memory/decisions/*`
   - `memory/inputs/**`
   - `dominio/**`

6. **Sintetiza e entrega o panorama** a partir de `estado-atual.md` + git log. Seu trabalho
   é entregar com clareza, **não regenerar do zero** — destilar já foi o trabalho do `/salve`.

## Output esperado

```
## 🧠 Cérebro carregado — YYYY-MM-DD
---

### 🔹 Frentes quentes agora
[reflete o conteúdo do estado-atual.md]

### ⚙️ Rodando em produção (sem demanda ativa)
[reflete]

### 🧊 Frentes fora do radar
[uma linha por frente]

### 🔥 Decisões em aberto
[copia]

### 📌 Cobranças minhas (preciso agir)
[copia]

### ⏳ Esperando outros
[copia]

### ⚠️ Alertas críticos
[copia]

### 📅 Compromissos próximos
[copia]

---

### Movimento no repo (últimos 3 dias)
- HH:MM ago — commit msg curta — frentes tocadas

---

Pronto pra trabalhar. O que vamos fazer?
```

**Estilo:** o output é em grande parte um **espelho formatado do `estado-atual.md`**.
Não invente, não acrescente análise nova. Se algo estiver confuso ou desatualizado,
**pergunte** em vez de reinterpretar.

## Carregamento sob demanda (DEPOIS do boot)

| Conversa puxa | Você lê |
|---|---|
| "Frente X" / "vamos mexer em Y" | `subjects/<X>/01-contexto.md`, `03-historico.md`, `04-cards.md` |
| Stakeholder específico | `subjects/<frente>/02-stakeholders.md` |
| Decisão histórica referenciada | `memory/decisions/<arquivo>` |
| Reunião / mensagem referenciada | `memory/inputs/<tipo>/<arquivo>` |
| Pergunta técnica de domínio | **`dominio/README.md` primeiro** — ele diz qual arquivo responde a quê. A resposta já pode estar escrita |
| "quanto deu X?" | `dominio/<assunto>/indicadores.md` — **fonte única** dos números medidos. Não recalcule o que já está lá |
| "o que conta como X?" | `dominio/<assunto>/definicoes.md` |

## Modo onboarding (primeira sessão)

Se `context/` ainda está com placeholders, vá pro modo entrevista:
1. Pergunte se existem arquivos de contexto prontos em algum lugar pra ler antes.
2. Entreviste em blocos curtos, um arquivo por vez: `empresa.md`, `meu-papel.md`,
   `produtos.md`, `stakeholders.md`.
3. Confirme antes de escrever cada arquivo.
4. Sugira abrir as primeiras frentes com `/criar-nova-frente`.

## Quando NÃO acionar

- Já rodou nesta sessão (basta uma vez).
- Tarefa rápida que não precisa de contexto (corrigir um typo).

## Falhas comuns

- **`git pull` falha por conflito:** havendo mudança local não commitada, `git stash` →
  `git pull` → `git stash pop`. Avise o que fez.
- **`estado-atual.md` não existe:** primeira vez — confirme antes de reconstruir (caro).
- **`estado-atual.md` com mais de 7 dias:** provável sessão fechada sem `/salve`. Avise.
- **`context/` vazio:** modo onboarding.

## Não confunda

- `/cerebro` lê o estado vivo (sintetizado pelo `/salve` anterior).
- `/rotina` é o cockpit pessoal do dia (o que VOCÊ vai fazer hoje).
- `/salve` é quem **mantém o `estado-atual.md` vivo** — se ele falhar, o `/cerebro` perde precisão.
- `/cerebro` lê do disco. Não busca e-mail, ticket nem calendário ao vivo.
