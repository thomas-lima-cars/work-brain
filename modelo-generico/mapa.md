# 🧠 Mapa Raiz — Work Brain

> Índice do cérebro. Se você é o Claude e acabou de abrir este repositório, este é o
> primeiro arquivo que importa. Ele diz **onde mora cada coisa** e **o que não ler agora**.

## Como navegar

| Pasta / arquivo | O que tem | Quando consultar |
|---|---|---|
| `estado-atual.md` (raiz) | **Painel vivo do dia** — frentes quentes, decisões em aberto, cobranças, alertas, compromissos. Mantido pelo `/salve`. | **Sempre no boot** — é o que o `/cerebro` lê pra montar o panorama |
| `context/` | Quem sou: empresa, papel, produtos, stakeholders | **Sempre** — leitura inicial, são arquivos pequenos |
| `subjects/` | **Frentes de trabalho ativas** — uma pasta por eixo | Ao entrar numa frente — nunca no boot |
| `memory/sessions/` | Log por dia, escrito pelo `/salve` | Retomar o fio de uma sessão específica |
| `memory/decisions/` | Decisões grandes, com opções consideradas e consequências | Entender **por que** algo é do jeito que é |
| `memory/inputs/` | Matéria-prima: reuniões, mensagens, e-mail, tickets | Quando a conversa referenciar uma delas |
| `dominio/` | **Conhecimento técnico acumulado** — esquemas, APIs, definições, indicadores medidos | **Antes de ir na fonte** — a resposta já pode estar escrita |
| `inbox/` | Captura rápida — processar e mover depois | Algo que ainda não tem lugar |

## Frentes ativas

```
subjects/
├── _template/     (modelo pra criar frente nova — não editar)
└── outros/        (coringa: o que não se encaixa em nenhuma outra)
```

**Estrutura padrão de cada frente:**
- `01-contexto.md` — O que é, regras de negócio, integrações
- `02-stakeholders.md` — Quem pede, decide, executa
- `03-historico.md` — Linha do tempo (base da detecção de contradição)
- `04-cards.md` — Índice de tarefas ativas nessa frente

**Frentes não são fixas** — adicionar, remover e mover conforme o trabalho evolui.
Crie com `/criar-nova-frente`, nunca à mão (a skill também atualiza este mapa).

## Como começar uma sessão (workflow padrão)

```
abrir Claude Code dentro do brain
/cerebro     ← acorda contexto + painel do dia + últimos commits
/rotina      ← (manhã) cockpit pessoal do dia
... trabalha ...
/salve       ← (fim) persiste decisões, caça gaps, commit/push
```

## Skills disponíveis

- `/cerebro` — boot enxuto: pull + `context/` + `estado-atual.md` + git log dos últimos 3 dias. Frentes lidas sob demanda.
- `/rotina` — cockpit pessoal: top do dia, aging, cobranças, pré-filtro silencioso.
- `/salve` — fim de sessão: checa gaps, **regenera `estado-atual.md`**, commit + push.
- `/criar-nova-frente` — cria uma frente de trabalho a partir do template.

## Convenções

- **Datas:** `YYYY-MM-DD`. Nunca "semana passada" — a data relativa mente quando o arquivo é lido depois.
- **Nomes de arquivo:** kebab-case
- **Commits:** descritivos, no imperativo. Em lote via `/salve`, não a cada mudança.

## Regras que valem para o brain inteiro

### Fonte única para número medido
🔴 **Número medido mora em UM arquivo só. Os outros linkam, não repetem.**

O dia em que a medição mudar, corrigir num lugar tem que bastar. Quando o mesmo número
está escrito em cinco arquivos, basta esquecer um pro brain seguir afirmando o falso —
com toda a confiança de quem tem fonte escrita.

Onde mora cada coisa:

| assunto | fonte única |
|---|---|
| Números medidos | `dominio/<assunto>/indicadores.md` |
| Definições (o que conta como X) | `dominio/<assunto>/definicoes.md` |
| Estado do dia | `estado-atual.md` |
| Histórico de uma frente | `subjects/<frente>/03-historico.md` |

**Todo número traz data e como foi medido.** Número sem data não serve — a realidade se move.

### Pasta nova entra no mapa
Pasta criada em `subjects/` ou `dominio/` ganha linha aqui **no mesmo `/salve`**.
Mapa que mente custa mais caro que mapa que falta.

### Leitura sob demanda
O boot lê `context/` (4 arquivos pequenos) e `estado-atual.md`. **Mais nada.**
Frentes, sessões e inputs entram na conversa quando a conversa os chama.
Brain que lê tudo toda vez fica caro, e brain caro para de ser usado.

## Privacidade

- Repositório **privado**. Nunca commitar credenciais, senhas, tokens.
- Cuidado com dados pessoais de clientes e informação sensível — na dúvida, anonimize
  ou deixe fora. Coleta bruta de sistema costuma carregar nome real e texto livre.
