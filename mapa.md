# 🧠 Mapa Raiz — Work Brain do Thomas

## Como navegar

| Pasta / arquivo | O que tem | Quando consultar |
|---|---|---|
| `estado-atual.md` (raiz) | **Painel vivo do dia** — frentes quentes, decisões em aberto, cobranças, alertas, compromissos. Mantido pelo `/salve`. | **Sempre no boot** — é o que o `/cerebro` lê pra montar o panorama |
| `context/` | Quem sou: empresa, papel, produtos, stakeholders | **Sempre** — leitura inicial |
| `context/banco-de-dados/` | **Conhecimento acumulado sobre os bancos**, em dois níveis: `plataforma/` (esquema, domínios, acessos, qualidade, receitas de SQL) e `projetos/` (definições, indicadores e palavras-chave de cada estudo) | **Antes de abrir o banco** — a resposta já pode estar escrita. Não ler no boot |
| `subjects/` | **Frentes de trabalho ativas** | Trabalhar numa frente — atualizar histórico, ver decisões |
| `memory/` | Estado vivo: sessions, decisions, inputs (meetings, jira, whatsapp, outlook, dailies) | Retomar contexto recente, detectar contradição |
| `inbox/` | Captura rápida — processar e mover depois | Algo que ainda não tem lugar |
| `automations/` | Automações reais: flows n8n documentados, scripts, estado (JSON), crons | Mexer/debugar uma automação, entender o que roda sozinho |
| `automations/bancos/` | **Acesso direto aos bancos** (Cars2You e Dealers): conexão, runner somente-leitura, gerador de schema | Consultar banco fora do n8n |
| `automations/precificacao/` | O estudo de precificação sobre as duas bases | Mexer no estudo |
| `automations/n8n-sdk/rel-veiculos/` | **Radar de Estoque** — o relatório de veículos em evento × lojas compradoras. A pasta ainda tem o nome antigo | Mexer no Radar |
| `automations/n8n-sdk/carteira-comercial/` | **Quem responde por cada loja** — lê a planilha da área comercial no SharePoint e publica `carteira-comercial.json`, que o Radar consome. Roda 6h, falha alto de propósito | Mexer na carteira, ou quando o Radar disser que a carteira está velha |
| `design/regras-de-layout.md` | 📐 **O que já foi decidido sobre layout** — anatomia do cartão, KPI, gráfico, glossário, tema, tabela | **Antes de ajustar visual de qualquer painel** — a decisão já pode estar tomada |
| `design/kit-de-painel.md` | 📦 **O padrão num arquivo só, para levar para fora** — contrato, esqueleto, regras e o `tema.css` inteiro embutido. Gerado por `monta-kit.js`; quem recebe não precisa deste repo | Compartilhar o padrão com o time ou com outro projeto |
| `design/` | **Identidade e modelos de painel** — marca por produto, paleta por produto, `tema.css` e os dois modelos de dashboard (claro e escuro) | **Antes de montar qualquer HTML** — copiar o modelo, não inventar layout |
| `design/fontes/` | **Fontes embutidas em base64** — hoje só a DM Sans, candidata. A regra 9 não admite requisição de rede, então arquivo de fonte mora aqui e vira `data:` na geração | Trocar a tipografia de um painel |
| `memory/decisions/` | Decisões grandes, com opções consideradas e consequências | Entender por que algo é do jeito que é |
| `.claude/skills/` | Skills (slash commands) | Invocadas via `/<nome>` |
| `modelo-generico/` | **Kit genérico do brain** — este modelo sem nenhum domínio, pronto pra outra pessoa clonar e rodar | Compartilhar o modelo com alguém, ou revisar o desenho do brain em abstrato |
| `modelo-por-projeto/` | **Variante do modelo organizada por projeto/seção** (sem eixo por área): um `.md` que o bot executa pra gerar a estrutura + manual de usuário autônomo | Passar o modelo pra alguém montar sozinho |
| `modelo-local/` | **Variante sem git** — mesma organização por projeto/seção, só pastas locais. A integração com controle de versão fica registrada como pendência no brain gerado | Passar pra quem não usa (ou não quer) git |

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

## Regras que valem para o brain inteiro

### Fonte única para número medido
🔴 **Número medido mora em UM arquivo só. Os outros linkam, não repetem.**

Existe por causa de 17/09: a afirmação "a Dealers é um superconjunto com versão
mais nova" foi escrita em **cinco arquivos**. Quando a medição mostrou que
estava errada, corrigir exigiu caçar com `grep` — e bastaria esquecer um para o
brain seguir afirmando o falso.

Onde mora cada coisa:

| assunto | fonte única |
|---|---|
| Números sobre os bancos | `context/banco-de-dados/projetos/<projeto>/indicadores.md` |
| O que é venda, deságio, FIPE | `context/banco-de-dados/projetos/precificacao/definicoes.md` |
| Estado do dia | `estado-atual.md` |
| O que roda sozinho | `automations/crons.md` |
| Cor, fonte, forma de painel | `design/tokens/tema.css` |
| Regra de layout já decidida | `design/regras-de-layout.md` |
| Paleta e logo de um produto | `design/paletas/<produto>.json` e `design/marca/<produto>/` |

**Todo número traz data e como foi medido.** Número sem data não serve — a base
se move.

### Pasta nova entra no mapa
Pasta criada em `automations/` ou `subjects/` ganha linha aqui **no mesmo
`/salve`**. Três pastas ficaram fora do mapa entre 17 e 18/09.

## Privacidade

- Repo **privado**. Nunca commitar credenciais, senhas, tokens.
- Cuidado com PII de clientes e informação sensível — na dúvida, anonimiza ou deixa fora.
