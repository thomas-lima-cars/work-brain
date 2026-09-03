---
name: cerebro
description: Bootstrap de sessão. Pull do repo, leitura do estado-atual.md, context e últimos commits. Acione SEMPRE no início de uma sessão de trabalho neste brain. Acionar para -> "comecar sessao", "acordar", "carregar contexto", "o que rolou", "boot", "inicio de sessao".
---

# Skill: /cerebro

Acorda a IA com o contexto necessário pra trabalhar neste brain. Use SEMPRE no início de uma sessão.

## Filosofia (importante)

Este `/cerebro` é **enxuto por design**. Lê **só o que dá o panorama do dia** e carrega o resto **sob demanda** quando a conversa pedir. Ler todas as frentes no boot é caro e desnecessário.

**A inteligência viva do brain mora em `estado-atual.md`** (raiz). Esse arquivo é mantido pelo `/salve` no fim de cada sessão e contém: frentes quentes, frentes frias, decisões em aberto, cobranças, alertas e compromissos próximos. É a fonte da verdade pro "o que tá acontecendo agora".

Quando a conversa entrar numa frente específica (ex: "vamos mexer em X"), aí sim leia os arquivos daquela frente. Não antes.

## O que esta skill faz no boot

1. **Sincroniza com o GitHub:** `git pull --rebase`.

2. **Lê o contexto pessoal** (pequeno, alto valor):
   - `context/empresa.md`
   - `context/meu-papel.md`
   - `context/produtos.md`
   - `context/stakeholders.md`

3. **Lê o estado atual do brain (núcleo do boot):**
   - `estado-atual.md` (raiz) — é o coração do panorama do dia.
   - Se este arquivo não existir, avise: "Primeira vez rodando o /cerebro. Quer que eu reconstrua o estado-atual.md varrendo todas as frentes? Vai custar tokens dessa vez." E aguarde decisão.
   - Se está claramente desatualizado (data > 7 dias atrás), avise que pode estar stale e pergunte se reflete a realidade ou quer reconstruir.

4. **Inspeciona últimos commits do repo:**
   ```
   git log --since="3 days ago" --pretty=format:"%h %an %ar %s" --stat
   ```
   Isso mostra o delta recente — quais arquivos mudaram em quais frentes. Você **não precisa abrir os arquivos** pra saber o que mudou — o git log já narra.

5. **NÃO LÊ no boot** (lidos sob demanda quando a conversa puxa):
   - Nenhum arquivo de `subjects/<frente>/`
   - `memory/sessions/*`, `memory/decisions/*`
   - `memory/inputs/meetings/*`, `whatsapp/*`, `outlook/*`, `dailies/*`, `jira/*`

6. **Sintetiza e entrega o panorama** com base em `estado-atual.md` + git log. Seu trabalho é entregar com clareza, **não regenerar do zero** — o trabalho pesado de destilar já foi feito pelo `/salve` anterior.

## Output esperado

```
## 🧠 Cérebro carregado — YYYY-MM-DD
---

### 🔹 Frentes quentes agora
[reflete o conteúdo do estado-atual.md]

### ⚙️ Rodando em produção (sem demanda ativa)
[reflete — automação que trabalha sozinha, não é frente quente]

### 🧊 Frentes fora do radar
[reflete — uma linha por frente]

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

**Estilo:** o output é em grande parte um **espelho formatado do `estado-atual.md`**. Não invente, não acrescente análise nova — entregue o que tá lá. Se algo estiver confuso ou desatualizado, pergunte em vez de reinterpretar.

## Carregamento sob demanda (DEPOIS do boot)

| Conversa puxa | Você lê |
|---|---|
| "Frente X" / "vamos mexer em Y" | `subjects/<X>/01-contexto.md`, `03-historico.md`, `04-cards.md` |
| Stakeholder específico | `subjects/<frente>/02-stakeholders.md` |
| Decisão histórica referenciada | `memory/decisions/<arquivo>` |
| Ata específica referenciada | `memory/inputs/meetings/<arquivo>` |

## Modo onboarding (primeira sessão)

Se `context/` está com placeholders sem preencher, vá pro modo entrevista:
1. Pergunte se há arquivos de contexto salvos em algum lugar pra ler antes.
2. Entreviste em blocos curtos por arquivo: `empresa.md`, `meu-papel.md`, `produtos.md`, `stakeholders.md`.
3. Confirme antes de escrever cada arquivo.
4. Sugira criar frentes em `subjects/` via `/criar-novo-subject`.

## Quando NÃO acionar

- Já invocou esta skill nesta sessão (basta uma vez).
- Tarefa rápida sem contexto (ex: corrigir um typo).

## Falhas comuns

- **`git pull` falha por conflito:** se houver mudanças locais não commitadas, `git stash` → `git pull` → `git stash pop`. Avise.
- **`estado-atual.md` não existe:** primeira vez — confirme se quer reconstruir varrendo as frentes (operação cara, faz só essa vez).
- **`estado-atual.md` muito antigo (>7 dias):** avise. Pode ser sessão fechada sem `/salve`.
- **`context/` vazio:** vá pra modo onboarding.

## Não confunda

- `/cerebro` lê estado vivo do brain (sintetizado pelo `/salve` anterior).
- `/rotina` é cockpit pessoal do dia (o que VOCÊ vai fazer hoje).
- `/salve` é quem **mantém o `estado-atual.md` vivo** — se falhar em atualizar, o /cerebro perde precisão.
- `/cerebro` lê do disco. Não busca Jira live, e-mail, etc.
