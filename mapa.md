# 🧠 Mapa Raiz — Work Brain do Thomas

## Como navegar

| Pasta / arquivo | O que tem | Quando consultar |
|---|---|---|
| `estado-atual.md` (raiz) | **Painel vivo do dia** — frentes quentes, decisões em aberto, cobranças, alertas, compromissos. Mantido pelo `/salve`. | **Sempre no boot** — é o que o `/cerebro` lê pra montar o panorama |
| `context/` | Quem sou: empresa, papel, produtos, stakeholders | **Sempre** — leitura inicial |
| `subjects/` | **Frentes de trabalho ativas** | Trabalhar numa frente — atualizar histórico, ver decisões |
| `memory/` | Estado vivo: sessions, decisions, inputs (meetings, jira, whatsapp, outlook, dailies) | Retomar contexto recente, detectar contradição |
| `inbox/` | Captura rápida — processar e mover depois | Algo que ainda não tem lugar |
| `automations/` | Automações reais: flows n8n documentados, scripts, estado (JSON), crons | Mexer/debugar uma automação, entender o que roda sozinho |
| `.claude/skills/` | Skills (slash commands) | Invocadas via `/<nome>` |

## Frentes ativas

```
subjects/
├── _template/          (modelo pra criar nova frente)
├── cars2you/
├── bradesco/
├── c6/
├── itau/
├── lm/
└── outros/             (coringa: o que não se encaixa nas outras)
```

**Estrutura padrão de cada frente:**
- `01-contexto.md` — O que é, regras de negócio, integrações
- `02-stakeholders.md` — Quem pede, decide, executa
- `03-historico.md` — Linha do tempo (base da detecção de contradição)
- `04-cards.md` — Índice de tarefas/cards ativos nessa frente

**Frentes não são fixas** — adicionar/remover/mover conforme o trabalho evolui.

## Como começar uma sessão (workflow padrão)

```
abrir Claude Code dentro do work-brain
/cerebro     ← acorda contexto + últimas 72h
/rotina      ← (manhã) cockpit pessoal do dia
... trabalha ...
/salve       ← (fim) persiste decisões, gaps, commit/push
```

## Skills disponíveis

- `/cerebro` — boot enxuto: pull + context + `estado-atual.md` + git log dos últimos 3 dias. Frentes lidas sob demanda.
- `/rotina` — cockpit pessoal: top do dia, aging, cobranças, pré-filtro silencioso.
- `/salve` — fim de sessão: checa gaps, **regenera `estado-atual.md`**, commit + push.
- `/criar-novo-subject` — cria uma frente de trabalho nova a partir do template.

## Convenções

- **Datas:** `YYYY-MM-DD`
- **Nomes de arquivo:** kebab-case
- **Idioma:** português (Brasil)
- **Commits:** descritivos, em português, no imperativo. Batch via `/salve` (não a cada mudança).

## Privacidade

- Repo **privado**. Nunca commitar credenciais, senhas, tokens.
- Cuidado com PII de clientes e informação sensível — na dúvida, anonimiza ou deixa fora.
