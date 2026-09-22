# Instruções para gerar um Work Brain local (sem git)

> **Como usar este arquivo:** crie uma pasta vazia, abra o Claude Code dentro dela, cole
> este documento inteiro e diga: **"execute estas instruções"**. Ao final você terá um
> cérebro de trabalho funcional, guardado apenas em pastas locais, e será entrevistado
> para preenchê-lo.

**Esta versão não usa git nem GitHub.** Só arquivos e pastas no seu computador. A
integração com controle de versão fica registrada como pendência no próprio brain, em
`PENDENCIAS.md` — para o dia em que fizer sentido.

---

## Instruções de execução (para o assistente)

Você vai construir um repositório de memória de trabalho **sem nenhum controle de versão**.
Siga nesta ordem:

1. **Confirme que a pasta está vazia** (ou quase). Se já houver um brain montado, pare e
   pergunte se é pra sobrescrever.
2. **Crie a árvore de diretórios** da seção seguinte.
3. **Escreva cada arquivo** exatamente com o conteúdo especificado. Os blocos delimitados
   por `~~~~` são conteúdo literal de arquivo — copie como está, incluindo as cercas de
   código internas.
4. **Não rode `git init`.** Não crie `.gitignore`. Não sugira commit, push ou repositório
   remoto em nenhum momento.
5. **Só então** conduza a entrevista de onboarding descrita no último passo.

**Não invente pastas, arquivos nem seções além do especificado.** A estrutura é enxuta de
propósito. Não pergunte nada antes do passo 5 — construa primeiro, converse depois.

---

## Árvore final

```
.
├── CLAUDE.md
├── mapa.md
├── estado-atual.md
├── PENDENCIAS.md
├── .claude/skills/
│   ├── cerebro/SKILL.md
│   ├── rotina/SKILL.md
│   ├── salve/SKILL.md
│   └── novo-projeto/SKILL.md
├── context/
│   ├── quem-sou.md
│   └── pessoas.md
├── projetos/
│   └── _template/
│       ├── 01-visao.md
│       ├── 02-pessoas.md
│       ├── 03-historico.md
│       └── 04-tarefas.md
├── memory/
│   ├── sessions/README.md
│   ├── decisions/README.md
│   └── inputs/README.md
├── referencia/README.md
└── inbox/README.md
```

**O eixo de organização é o projeto/seção.** Não existe agrupamento por área, cliente ou
time — cada unidade de trabalho é uma pasta em `projetos/`, seja ela um projeto com fim
previsto ou uma seção permanente de responsabilidade. Mesma estrutura para as duas.

---

## O que muda por não haver git

Três coisas que o controle de versão dava de graça e agora precisam de substituto. Elas
estão embutidas nas skills abaixo — este resumo é só pra você entender o desenho:

| O que o git dava | Substituto nesta versão |
|---|---|
| "O que mudou nos últimos dias" | O `/cerebro` lê os **dois últimos arquivos** de `memory/sessions/` e olha as datas de modificação dos arquivos |
| Histórico — poder voltar atrás | **Nada é sobrescrito.** Texto novo é anexado; correção deixa rastro. E há um passo de cópia de segurança no `/salve` |
| Backup fora da máquina | **Responsabilidade sua.** O `/salve` lembra, mas não executa |

A perda real é a terceira: um disco que morre leva o brain junto. Por isso o `/salve`
pergunta pela cópia de segurança uma vez por semana, e por isso a integração com git está
registrada como pendência.

---

## Arquivos

### `CLAUDE.md`

~~~~
# Claude Code — Isca

> Este arquivo existe só para o Claude Code auto-carregar o mapa raiz.
> A fonte da verdade é `mapa.md`.

Leia `mapa.md` na raiz desta pasta AGORA, antes de qualquer outra ação.

@mapa.md
~~~~

---

### `mapa.md`

~~~~
# 🧠 Mapa Raiz — Work Brain

> Índice do cérebro. Se você é o assistente e acabou de abrir esta pasta, este é o primeiro
> arquivo que importa: ele diz **onde mora cada coisa** e **o que não ler agora**.

> ⚠️ **Este brain é local.** Não há git, commit nem repositório remoto. Não sugira nenhum
> dos três. O que existe sobre isso está em `PENDENCIAS.md`.

## Como navegar

| Caminho | O que tem | Quando consultar |
|---|---|---|
| `estado-atual.md` | **Painel vivo** — projetos quentes, decisões em aberto, cobranças, alertas | **Sempre no boot** |
| `context/` | Quem eu sou e com quem eu trabalho | **Sempre** — são dois arquivos pequenos |
| `projetos/` | **Uma pasta por projeto ou seção** | Ao entrar num projeto — nunca no boot |
| `memory/sessions/` | Log por dia, escrito pelo `/salve` | Retomar o fio de uma sessão |
| `memory/decisions/` | Decisões grandes, com opções e consequências | Entender **por que** algo é assim |
| `memory/inputs/` | Matéria-prima: atas, mensagens, e-mails, snapshots | Quando a conversa referenciar |
| `referencia/` | Conhecimento que atravessa vários projetos | Antes de ir na fonte original |
| `inbox/` | Captura rápida do que ainda não tem lugar | Algo sem destino definido |
| `PENDENCIAS.md` | Melhorias conhecidas do próprio brain | Ao pensar em mudar como o brain funciona |

## Projetos ativos

```
projetos/
└── _template/     (modelo — não editar)
```

**Estrutura de cada projeto:**
- `01-visao.md` — o que é, por que existe, regras não óbvias, fora de escopo
- `02-pessoas.md` — quem pede, decide, executa, aprova
- `03-historico.md` — linha do tempo em ordem inversa (base da detecção de contradição)
- `04-tarefas.md` — o que está em andamento, bloqueado, próximo

Crie com `/novo-projeto`, nunca à mão — a skill também registra aqui.

## Ritmo da sessão

```
/cerebro     ← acorda: contexto + painel + últimas sessões
/rotina      ← (manhã) cockpit do dia
... trabalha ...
/salve       ← (fim) destila e regenera o painel
```

## Skills

- `/cerebro` — boot enxuto. Lê `context/` + `estado-atual.md` + as duas últimas sessões.
- `/rotina` — cockpit do dia: top 4-5, aging, cobranças.
- `/salve` — fim de sessão: caça gaps, **regenera o `estado-atual.md`**.
- `/novo-projeto` — abre um projeto ou seção a partir do template.

## Convenções

- **Datas:** `YYYY-MM-DD`. Nunca "semana passada" — data relativa mente quando lida depois.
- **Nomes de arquivo:** kebab-case.

## Regras que valem para o brain inteiro

### Nada é sobrescrito
🔴 **Sem controle de versão, sobrescrever é destruir.**

Texto novo é **anexado**; correção **deixa rastro** (a linha antiga vira tachado ou ganha
uma nota "corrigido em <data>"). A única exceção é o `estado-atual.md`, que é painel por
natureza — e mesmo ele é atualizado por delta, não reescrito do zero.

### Fonte única para número medido
🔴 **Número medido mora em UM arquivo só. Os outros linkam, não repetem.**

No dia em que a medição mudar, corrigir num lugar tem que bastar. Com o mesmo número
escrito em cinco arquivos, basta esquecer um para o brain seguir afirmando o falso — com
toda a autoridade de quem tem fonte escrita.

| assunto | fonte única |
|---|---|
| Números medidos | `referencia/<assunto>/indicadores.md` |
| Definições (o que conta como X) | `referencia/<assunto>/definicoes.md` |
| Estado do dia | `estado-atual.md` |
| Histórico de um projeto | `projetos/<projeto>/03-historico.md` |

**Todo número traz data e como foi medido.** Número sem data apodrece em silêncio.

### Pasta nova entra no mapa
Pasta criada em `projetos/` ou `referencia/` ganha linha aqui **no mesmo `/salve`**.
Mapa que mente custa mais caro que mapa que falta.

### Leitura sob demanda
O boot lê `context/` e `estado-atual.md`. **Mais nada.** Projetos, sessões e inputs entram
quando a conversa os chama. Brain caro é brain que se abandona em três semanas.

## Privacidade e segurança

Pasta local, sem backup automático. Duas consequências:

- **Cópia de segurança é manual.** O `/salve` lembra uma vez por semana; executar é com você.
- **Cuidado com dado pessoal e credencial.** Não existe `.gitignore` pra te proteger de
  nada aqui — o que você escrever, fica escrito. Na dúvida, anonimize.
~~~~

---

### `estado-atual.md`

~~~~
# 📊 Estado Atual

> **Última atualização:** _(ainda não rodou um `/salve`)_
>
> Painel vivo do brain: é o que o `/cerebro` lê no boot e o que o `/salve` regenera no fim
> de cada sessão. Teto de ~150 linhas — o que passar disso é histórico e pertence a
> `memory/sessions/`.

---

## 🔹 Projetos quentes agora
_(um parágrafo curto por projeto: onde está, o que trava, próximo movimento)_

- _vazio — preencha com o primeiro `/salve`_

## ⚙️ Rodando sozinho (sem demanda ativa)
_(o que funciona sem consumir sua atenção — não confundir com projeto parado)_

- _vazio_

## 🧊 Projetos fora do radar
_(uma linha por projeto: por que esfriou e o que o reacenderia)_

- _vazio_

## 🔥 Decisões em aberto
_(a decisão, quem decide, parada desde quando)_

- _vazio_

## 📌 Cobranças minhas (preciso agir)
- _vazio_

## ⏳ Esperando outros
_(quem, o quê, desde quando — a data é o que permite calcular aging)_

- _vazio_

## ⚠️ Alertas críticos
- _vazio_

## 📅 Compromissos próximos
- _vazio_

---

## 🗄️ Cópia de segurança
**Última cópia:** _(nunca)_
**Onde:** _(preencha: nuvem, disco externo, outra pasta)_
~~~~

---

### `PENDENCIAS.md`

~~~~
# 🔧 Pendências do próprio brain

Melhorias conhecidas na ferramenta — não no trabalho. O que está aqui foi decidido
conscientemente como "depois", não esquecido.

---

## 1. Integrar com controle de versão (git) — PENDENTE

**Situação hoje:** o brain vive só em pastas locais. Não há histórico, não há como voltar
atrás, e um disco que morre leva tudo junto. A cópia de segurança é manual e depende de
você lembrar.

**Por que ficou pra depois:** git adiciona um conjunto de conceitos (commit, stage, push,
conflito) que não tem relação com o trabalho em si. Começar sem ele deixa o hábito se
formar primeiro. A estrutura de pastas é idêntica com ou sem git — adotar depois não
exige reorganizar nada.

**O que se ganha ao integrar:**
- Histórico real: dá pra ver o que mudou, quando, e desfazer
- Backup fora da máquina, automático a cada sessão
- Acesso ao mesmo brain de outro computador
- O `/cerebro` passa a mostrar "o que mudou nos últimos 3 dias" a partir do log, que é
  mais preciso que ler as últimas sessões

**O que muda quando for integrar** (checklist, quando decidir fazer):

- [ ] `git init` na raiz e primeiro commit
- [ ] Criar um `.gitignore` (credenciais, arquivos grandes, lixo de sistema)
- [ ] Criar repositório remoto **privado** e vincular
- [ ] `/cerebro`: acrescentar `git pull --rebase` no passo 1, e trocar a leitura das duas
      últimas sessões por `git log --since="3 days ago"`
- [ ] `/salve`: acrescentar `git add` + `git commit` + `git push` no fim, com a regra
      "se o push falhar, commite mesmo assim e avise"
- [ ] `/salve`: acrescentar a guarda de tamanho antes do commit — nada acima de 1 MB entra
      sem decisão explícita, e conferir também o que está sendo **apagado**
- [ ] `/novo-projeto`: acrescentar o commit ao fim
- [ ] `mapa.md`: remover o aviso "este brain é local"
- [ ] Remover a seção "Cópia de segurança" do `estado-atual.md` e este item daqui

**Sinal de que chegou a hora:** você perdeu (ou quase perdeu) trabalho; precisa acessar o
brain de outra máquina; ou passou a querer saber "quando foi que isso mudou?".

---

## 2. _(próxima pendência)_

_Registre aqui o que você decidir adiar sobre o funcionamento do brain._
~~~~

---

### `.claude/skills/cerebro/SKILL.md`

~~~~
---
name: cerebro
description: Bootstrap de sessão. Lê o estado-atual.md, o contexto pessoal e as últimas sessões. Acione SEMPRE no início de uma sessão de trabalho neste brain. Acionar para -> "comecar sessao", "acordar", "carregar contexto", "o que rolou", "boot", "inicio de sessao".
---

# Skill: /cerebro

Acorda a IA com o contexto necessário pra trabalhar neste brain. Use SEMPRE no início de
uma sessão.

⚠️ **Este brain é local, sem git.** Não rode `git pull`, não sugira commit ou repositório
remoto. O equivalente ao "log do repo" aqui são os arquivos de `memory/sessions/`.

## Filosofia (importante)

Este `/cerebro` é **enxuto por design**. Lê só o que dá o panorama do dia e carrega o resto
**sob demanda**, quando a conversa pedir. Ler todos os projetos no boot é caro e
desnecessário — e brain caro é brain que a pessoa abandona.

**A inteligência viva mora em `estado-atual.md`**, mantido pelo `/salve` no fim de cada
sessão. É a fonte da verdade pro "o que está acontecendo agora".

## O que fazer no boot

1. **Ler o contexto pessoal:** `context/quem-sou.md` e `context/pessoas.md`.

2. **Ler `estado-atual.md`** (núcleo do boot).
   - Não existe? "Primeira vez rodando o /cerebro. Quer que eu reconstrua varrendo os
     projetos? Vai custar tokens dessa vez." E aguarde.
   - Data do cabeçalho com mais de 7 dias? Avise que pode estar stale e pergunte se
     reflete a realidade.

3. **Ler os dois arquivos mais recentes de `memory/sessions/`.** Sem git, é daqui que sai
   o "o que aconteceu ultimamente". Extraia só pendências e próximos passos — não repita o
   resumo inteiro.

4. **Olhar o que foi mexido recentemente.** Liste os arquivos modificados nos últimos dias
   pela data de modificação, pra pegar edição manual que não passou por um `/salve`:
   ```bash
   find . -name "*.md" -mtime -3 -not -path "./.claude/*" | head -20
   ```
   No Windows, o equivalente em PowerShell:
   ```powershell
   Get-ChildItem -Recurse -Filter *.md | Where-Object { $_.LastWriteTime -gt (Get-Date).AddDays(-3) } | Select-Object -First 20 FullName
   ```

5. **NÃO LER no boot:** nada de `projetos/`, `referencia/` ou o resto de `memory/`.

6. **Sintetizar o panorama** a partir do painel + últimas sessões. Entregar com clareza,
   **não regenerar do zero** — destilar já foi trabalho do `/salve`.

## Output esperado

```
## 🧠 Cérebro carregado — YYYY-MM-DD
---

### 🔹 Projetos quentes agora
### ⚙️ Rodando sozinho (sem demanda ativa)
### 🧊 Projetos fora do radar
### 🔥 Decisões em aberto
### 📌 Cobranças minhas
### ⏳ Esperando outros
### ⚠️ Alertas críticos
### 📅 Compromissos próximos

---
### Últimas sessões
- YYYY-MM-DD — [o que ficou pendente]

---
Pronto pra trabalhar. O que vamos fazer?
```

**Estilo:** o output é em grande parte um **espelho formatado do `estado-atual.md`**.
Não invente e não acrescente análise nova. Se algo estiver confuso ou desatualizado,
**pergunte** em vez de reinterpretar.

## Carregamento sob demanda (DEPOIS do boot)

| Conversa puxa | Você lê |
|---|---|
| "vamos mexer no projeto X" | `projetos/<X>/01-visao.md`, `03-historico.md`, `04-tarefas.md` |
| Pessoa específica | `projetos/<X>/02-pessoas.md` |
| Decisão histórica referenciada | `memory/decisions/<arquivo>` |
| Reunião ou mensagem referenciada | `memory/inputs/<arquivo>` |
| Pergunta técnica recorrente | **`referencia/README.md` primeiro** — a resposta já pode estar escrita |
| "quanto deu X?" | `referencia/<assunto>/indicadores.md` — **fonte única**. Não recalcule |
| "como o brain funciona / por que não tem git" | `PENDENCIAS.md` |

## Modo onboarding (primeira sessão)

`context/` ainda com placeholders? Entreviste em blocos curtos, confirme antes de escrever
cada arquivo, e sugira abrir os primeiros projetos com `/novo-projeto`.

## Quando NÃO acionar

- Já rodou nesta sessão. Ou tarefa rápida que não precisa de contexto.

## Falhas comuns

- **Painel com mais de 7 dias:** provável sessão fechada sem `/salve`.
- **`context/` vazio:** modo onboarding.
- **Arquivo editado à mão sem passar pelo `/salve`:** o passo 4 pega. Mencione no panorama.
~~~~

---

### `.claude/skills/rotina/SKILL.md`

~~~~
---
name: rotina
description: Cockpit pessoal do dia — top do dia, aging de itens dormindo, cobranças necessárias, alertas. Pré-filtra ruído silenciosamente. Use de manhã, depois de /cerebro. Acionar para -> "rotina", "cockpit", "comeco do dia", "manha", "o que tenho hoje", "pendencias do dia", "meu dia".
---

# Skill: /rotina

Cockpit **pessoal** do dia. Foco: **o que VOCÊ vai executar hoje** — não o panorama geral,
que é trabalho do `/cerebro`.

## Pré-requisito

`/cerebro` carregado nesta sessão.

## O que fazer

### 1. Ler o estado
- `memory/sessions/` — últimas 3 sessões, extraindo pendências em aberto
- `memory/decisions/` — últimos 7 dias, extraindo cobranças pendentes
- `projetos/<X>/03-historico.md` — últimos 7 dias, pra saber o que está quente
- `projetos/<X>/04-tarefas.md` — referência cruzada

### 2. Calcular aging
- Pendência que reaparece em 2+ sessões seguidas sem fechar
- Projeto sem entrada nova em `03-historico.md` há mais de 7 dias
- Item em "Esperando outros" há mais de 5 dias

Ajuste os limites conforme o padrão do fluxo ficar claro.

### 3. Identificar cobranças
Itens que dependem de terceiros há tempo demais, reuniões de hoje, e compromissos
assumidos em sessões anteriores chegando perto do prazo.

### 4. Pré-filtro silencioso
Descarte **sem perguntar**: status rotineiro, confirmação de reunião já feita, cobrança já
feita ontem, item fechado nas últimas 24h. Cockpit que mostra tudo não é cockpit — é a
mesma pilha, só que formatada.

### 5. Compor
**Top 4-5 do dia** + pool secundário por projeto.

## Output esperado

```
# ☀️ Rotina — YYYY-MM-DD (HH:MM)

## 🎯 Top 4-5 do dia
1. **[Ação concreta]** — [Projeto] — [Por quê HOJE]

> Se você só fizer essas, o dia está bom.

## 📂 Pool secundário (por projeto)
## 🚧 Aging — coisas dormindo
- **[item]** ([N] dias parado)

## 🔴 Cobranças pra hoje
- **[Pessoa]** sobre **[assunto]** — última menção há [N] dias

## 📅 Reuniões de hoje
## ⚠️ Alertas em radar (não exigem ação hoje)

---
[1 linha: "Hoje você tem N reuniões, M cobranças e o foco é X"]
```

## Regras de Top 4-5

**Entra:** prazo hoje ou iminente; visibilidade de quem cobra; bloqueia outro projeto;
foi marcado como prioridade na última sessão.
**Vai pro pool:** pode esperar 1-2 dias; cobrança não-crítica; exploração.
**Limite:** 4 por padrão, 5 quando há reunião + entrega + cobrança no mesmo dia. 6 ou mais
é sobrecarga — diga isso em voz alta em vez de listar.

## Adaptação

O padrão assume que **o brain é a única fonte de tarefas**. Se houver Jira, Linear, Trello
ou Asana, registre aqui qual é e como consultar, pra cruzar as duas fontes.

## Falhas comuns

- **Sem pendências:** ou está tudo em dia, ou o brain não foi alimentado. Diga qual você acha.
- **Brain novo:** só fica útil depois de 3-4 `/salve`. Avise.
- **Carga alta:** sinalize sobrecarga, não expanda o top.

## Limites de token

Não releia arquivos já lidos no `/cerebro` da mesma sessão.
~~~~

---

### `.claude/skills/salve/SKILL.md`

~~~~
---
name: salve
description: Persiste fim de sessão. Resume o que foi feito, lista pendências, próximos passos, regenera o estado-atual.md e grava memory/sessions/<data>.md. Use no fim do dia ou ao terminar uma sessão importante. Acionar para -> "salve", "salvar sessao", "fim de dia", "fechar trabalho", "salvar progresso", "log do dia".
---

# Skill: /salve

Fecha a sessão persistindo memória de longo prazo.

Esta é a skill mais importante do brain. O `/cerebro` só consegue ser barato porque o
`/salve` já destilou. Pulada, a próxima sessão começa cega.

⚠️ **Brain local, sem git.** Não faça commit, não faça push, não sugira repositório remoto.
Em compensação, **não existe desfazer** — o que for sobrescrito está perdido. Por isso o
passo 9 existe.

## O que fazer

1. **Resumir a sessão** a partir do contexto da conversa.
2. **Listar decisões tomadas.**
3. **Listar pendências abertas**, com prazo quando houver.
4. **Listar próximos passos.**
5. **Identificar arquivos modificados.**

6. **🔍 CHECAGEM DE GAPS (passo crítico):** varra a conversa procurando **conteúdo
   persistível que ficou só no chat**:

   | Apareceu na conversa | Deveria estar em |
   |---|---|
   | Ata ou resumo de reunião | `memory/inputs/` |
   | Mensagem ou áudio transcrito | `memory/inputs/` |
   | Resumo de e-mail | `memory/inputs/` |
   | Decisão grande | `memory/decisions/` |
   | Marco ou bloqueio num projeto | `projetos/<X>/03-historico.md` |
   | Conhecimento técnico novo | `referencia/<assunto>/` |

   Achou gap? **Alerte antes de gravar:**
   > "⚠️ Detectei conteúdo na conversa que não virou arquivo: [lista]. Quer que eu salve?"

   Salvar depende de confirmação — ou é automático se a pessoa disser "salva tudo".

7. **Escrever `memory/sessions/<YYYY-MM-DD>.md`.** Já existe arquivo do dia? **Anexe nova
   seção** (manhã/tarde/noite). **Nunca sobrescreva** — sem git, sobrescrever é destruir.

8. **🔄 REGENERAR `estado-atual.md` (passo crítico — não pular):**
   - Leia o painel atual pra ter o ponto de partida.
   - Aplique os **deltas** da sessão: projeto que esquentou sobe; que esfriou desce; que
     roda sozinho vai pra "Rodando sozinho"; decisão fechada some; cobrança nova entra
     **com data**; alerta sem urgência sai.
   - Atualize o cabeçalho: "Última atualização: YYYY-MM-DD (manhã/tarde/noite)".
   - Mantenha ~150 linhas. Não invente o que a sessão não tocou.
   - Sessão pequena sem mudança de panorama: só atualize a data.

9. **🗄️ CÓPIA DE SEGURANÇA — uma vez por semana.**

   Leia a seção "Cópia de segurança" no fim do `estado-atual.md`. Se a última cópia tem
   mais de 7 dias (ou nunca houve), **avise**:

   > 🗄️ A última cópia de segurança foi em <data> (há N dias). Sem git, esta pasta é a
   > única via do brain. Vale copiar pra nuvem ou disco externo hoje.

   Se a pessoa disser que fez, atualize a data e o destino na seção. **Não tente executar
   a cópia** — o destino é escolha dela, e copiar pasta pra fora do projeto sem pedir não
   é seu papel.

10. **Verificar arquivos grandes.** Sem `.gitignore` pra filtrar nada, vale checar de vez
    em quando o que está engordando a pasta:

    ```bash
    find . -type f -size +1M -not -path "./.claude/*"
    ```

    Achou algo? Pergunte se é pra manter. Coleta bruta de sistema costuma carregar nome
    real de pessoa e texto livre de cliente — e aqui não há camada nenhuma protegendo.

11. **Sessão que atravessa a meia-noite** vira um arquivo por data, ligados por uma linha
    de continuidade. Sem isso, metade do trabalho fica num arquivo que ninguém vai abrir.

12. **Pasta nova entra no `mapa.md` na mesma sessão.**

13. **Confirme o que foi gravado**, listando os caminhos. Sem commit, essa lista é o único
    recibo que a pessoa tem.

## Formato de `memory/sessions/<YYYY-MM-DD>.md`

```markdown
# Sessão — YYYY-MM-DD

## 🌅 Manhã (HH:MM - HH:MM)

### Resumo
_(2-4 linhas)_

### Decisões tomadas
### Pendências
- [ ] _ (prazo: YYYY-MM-DD)

### Próximos passos
### Arquivos modificados
### Notas
```

## Correção sem desfazer

Sem histórico de versão, **corrigir não é apagar**. Quando algo escrito antes se revelar
errado, mantenha a linha original e marque:

```markdown
- ~~O número era 42~~ → **corrigido em 2026-03-14:** eram 38. Medido por <método>.
```

O rastro da correção vale mais que o texto limpo: ele impede que a informação errada
volte por outro caminho.

## Etiquetas extras

- **Decisão estratégica?** Ofereça um arquivo em `memory/decisions/<data>-<assunto>.md`
  com opções consideradas, razão e consequências. Decisão pequena fica no log da sessão.
- **Projeto mexido?** Atualize `03-historico.md` se algo material mudou. Conversa que não
  deixou rastro no histórico não aconteceu, do ponto de vista da próxima sessão.

## Checagem de fonte única

Antes de escrever um número novo, veja se ele já existe:

```bash
grep -rn "<o número>" --include="*.md" .
```

Existe? **Linke em vez de repetir.** Mudou? Corrija na fonte (com rastro) e confira quem
apontava pra ela.

## Quando NÃO acionar

- Sessão de cinco minutos que não mudou nada.

## Falhas comuns

- **Arquivo do dia já existe:** anexe seção, nunca sobrescreva.
- **Painel inchado:** passou de ~150 linhas, mova o excesso pro log da sessão.
- **Pessoa pede pra commitar:** explique que este brain é local e aponte `PENDENCIAS.md`,
  que tem o checklist de como integrar com git quando ela quiser.
~~~~

---

### `.claude/skills/novo-projeto/SKILL.md`

~~~~
---
name: novo-projeto
description: Cria um projeto ou seção novo a partir do template, com mini-entrevista e registro no mapa. Acionar para -> "novo projeto", "criar projeto", "abrir iniciativa", "nova secao", "comecar algo novo".
---

# Skill: /novo-projeto

Abre uma unidade de trabalho nova em `projetos/`.

Uma unidade é um **projeto** (tem fim previsto) ou uma **seção** (responsabilidade
permanente). Os dois usam a mesma estrutura — a diferença é só se existe linha de chegada.

O teste pra saber se algo merece pasta própria:

> Você conversa sobre isso em semanas diferentes e precisa lembrar do que ficou combinado?
> **Merece.** Nasce e morre na mesma semana? **Não** — vai pro `inbox/` ou pro log da sessão.

## O que fazer

1. **Pergunte o nome** (kebab-case). Sugira um baseado na descrição e confirme antes de
   criar. Valide que não colide com pasta existente.
2. **Copie `projetos/_template/`** pra `projetos/<nome>/`.
3. **Mini-entrevista** — só o essencial:
   - O que é e por que existe? → `01-visao.md`
   - Em que fase está? Tem data de fim ou é permanente?
   - Quem são as 2-3 pessoas principais e o papel de cada uma? → `02-pessoas.md`
4. **Preencha** esses dois arquivos. Deixe `03-historico.md` e `04-tarefas.md` vazios.
5. **Atualize o `mapa.md`**, na lista "Projetos ativos".

## Output esperado

```
✅ Criado: projetos/<nome>/

Preenchido: 01-visao.md, 02-pessoas.md
Vazio (cresce com uso): 03-historico.md, 04-tarefas.md
Registrado no mapa.md.
```

## Princípios

- **Não exija** preencher tudo agora. Template preenchido à força vira ficção que ninguém
  revisita.
- **Não invente** pessoas nem escopo. Sem resposta, deixe placeholder.
- **Não crie demais.** Cinco a oito unidades ativas é saudável. Vinte significa que
  algumas são tarefas disfarçadas.

## Quando NÃO acionar

- Já existe → edite a pasta direto.
- Tarefa pontual → `inbox/` ou o log da sessão.
~~~~

---

### `context/quem-sou.md`

~~~~
# Quem sou

> _Preencha na primeira sessão — o `/cerebro` te entrevista._

## Onde trabalho
_(empresa ou contexto, setor, o que se vende e como se ganha dinheiro — isso explica por
que certos projetos têm prioridade)_

## Meu papel
_(cargo, time, e as 3-5 coisas pelas quais eu sou cobrado)_

## O que NÃO é meu
_(fronteira explícita — evita que o assistente sugira trabalho que não te cabe)_

## Como eu trabalho
_(ritmo, preferências, o que a IA pode fazer sem perguntar e o que exige confirmação)_

## Ferramentas
_(onde moram tarefas, código, documentos, conversas)_

## Vocabulário interno
| Termo | Significa |
|---|---|
| _ | _ |
~~~~

---

### `context/pessoas.md`

~~~~
# Pessoas

> _Preencha na primeira sessão. Só quem é recorrente — não todo mundo._

## <Nome> — <papel>

- **Relação comigo:** _(pede / decide / executa / aprova)_
- **Projetos:** _
- **Como funciona:** _(prefere o quê, responde em quanto tempo, o que trava)_
- **Canal:** _

---

> O valor deste arquivo não está no organograma. Está no "como funciona": saber que alguém
> só decide com número na mão muda como você prepara a conversa.
~~~~

---

### `projetos/_template/01-visao.md`

~~~~
# <Projeto> — Visão

> **Tipo:** projeto (tem fim) / seção (permanente)
> **Fase:** descoberta / construção / operação / encerramento
> **Aberto em:** YYYY-MM-DD

## O que é
_(2-4 linhas)_

## Por que importa
_(o que acontece se falhar, ou o que destrava)_

## Regras não óbvias
_(o conhecimento que hoje só existe na cabeça de alguém)_

- _

## Dependências
_(sistemas, times ou fornecedores de que isto depende)_

- _

## Fora de escopo
_(o que já foi descartado, e por quê — evita reabrir discussão morta)_

- _
~~~~

---

### `projetos/_template/02-pessoas.md`

~~~~
# <Projeto> — Pessoas

| Pessoa | Papel aqui | Canal | Observação |
|---|---|---|---|
| _ | pede / decide / executa / aprova | _ | _ |

## Quem decide o quê
_(explícito: qual decisão passa por quem — é o que evita retrabalho)_

- _
~~~~

---

### `projetos/_template/03-historico.md`

~~~~
# <Projeto> — Histórico

> Ordem **cronológica inversa** (mais recente no topo).
> É daqui que sai a detecção de contradição: quando algo novo bate de frente com uma
> entrada antiga, o histórico é a prova.
>
> **Nunca reescreva uma entrada antiga.** Informação nova entra como linha nova no topo;
> correção deixa rastro. Sem controle de versão, o passado apagado não volta.
>
> Registre **marco, decisão e bloqueio**. Não registre conversa rotineira.

## YYYY-MM-DD — <título curto>

_(o que aconteceu, quem estava envolvido, o que ficou decidido)_

**Consequência:** _(o que muda daqui pra frente)_

---
~~~~

---

### `projetos/_template/04-tarefas.md`

~~~~
# <Projeto> — Tarefas

> Item fechado sai daqui: vira linha no `03-historico.md` se foi material, ou simplesmente
> some, se foi rotina.

## Em andamento
- [ ] **<título>** — _(o que falta, quem depende, prazo)_

## Bloqueado
- [ ] **<título>** — _(por quem/o quê, desde YYYY-MM-DD)_

## Próximos
- [ ] **<título>** — _
~~~~

---

### `memory/sessions/README.md`

~~~~
# `sessions/` — log por dia

Um arquivo por dia, escrito pelo `/salve`. Rodou mais de uma vez no mesmo dia? Ele
**anexa** nova seção (manhã / tarde / noite) — nunca sobrescreve.

Nome: `<YYYY-MM-DD>.md`

Sessão que atravessa a meia-noite vira dois arquivos ligados por uma linha de
continuidade — não um arquivo só com data errada.

Sem controle de versão, esta pasta é o **único histórico** do brain. É ela que o
`/cerebro` lê pra saber o que aconteceu ultimamente.
~~~~

---

### `memory/decisions/README.md`

~~~~
# `decisions/` — decisões grandes

Só decisões que merecem contexto completo: **opções consideradas, razão da escolha,
consequências**. Decisão pequena fica no log da sessão.

Nome: `<YYYY-MM-DD>-<assunto>.md`

O valor aparece seis meses depois, quando alguém perguntar "por que a gente fez assim?" —
e a resposta não for "não lembro".

Decisão revista depois **não apaga a anterior**: escreva um arquivo novo que referencia o
antigo e explica o que mudou.

## Esqueleto

```markdown
# <Decisão> — YYYY-MM-DD

## Contexto
_(qual era o problema, o que forçou a decisão agora)_

## Opções consideradas
### A — _
**A favor:** _ **Contra:** _

### B — _
**A favor:** _ **Contra:** _

## Escolha
_(qual, e por quê)_

## Consequências
_(o que passa a ser verdade, o que se aceita perder, o que revisar e quando)_

## Quem decidiu
```
~~~~

---

### `memory/inputs/README.md`

~~~~
# `inputs/` — matéria-prima

Atas de reunião, mensagens e áudios transcritos, resumos de e-mail, snapshots de board.
Tudo que veio de fora e carrega decisão ou compromisso.

Nome: `<YYYY-MM-DD>-<tipo>-<assunto>.md` — ex: `2026-03-14-reuniao-kickoff.md`.

O `/salve` procura por estes: conteúdo gerado na conversa e não salvo aqui é um **gap**.

⚠️ Pasta local, sem filtro nenhum entre você e o que fica gravado. Cuidado com dado
pessoal — anonimize o que não for necessário.
~~~~

---

### `referencia/README.md`

~~~~
# `referencia/` — conhecimento que atravessa projetos

Esquemas, contratos de API, definições de indicador, regras de cálculo, glossários,
procedimentos que já funcionaram.

É diferente de `projetos/`. Um projeto é um eixo de trabalho; a referência é o saber que
serve a vários deles ao mesmo tempo. Sem este lugar, o mesmo conhecimento é copiado em
três pastas — e a regra de fonte única quebra no primeiro mês.

## Organização

```
referencia/
└── <assunto>/
    ├── definicoes.md      o que conta como X (fonte única)
    ├── indicadores.md     números medidos, com data e método (fonte única)
    └── receitas.md        procedimentos que funcionaram
```

## Índice

O `/cerebro` lê **este README primeiro** quando surge pergunta técnica. Mantenha a tabela
viva — se ela estiver boa, a resposta sai daqui sem abrir a fonte original.

| Pergunta | Arquivo |
|---|---|
| _ | _ |

## Regra dura

🔴 **Número medido mora em um arquivo só**, com **data e método**. Os outros linkam.
Número corrigido mantém rastro da versão antiga — sem git, o que some não volta.

_Pasta opcional: se o seu trabalho não acumula conhecimento técnico, pode deletar._
~~~~

---

### `inbox/README.md`

~~~~
# `inbox/` — captura rápida

Coisa que apareceu e ainda não tem lugar. Jogue aqui em vez de perder.

Um arquivo por captura: `<YYYY-MM-DD>-<assunto-curto>.md`. Ou uma linha num arquivo só, se
for miudeza — o formato importa menos que o hábito.

**Regra:** estação de passagem, não depósito. O que sobreviver duas semanas aqui ou vira
projeto, ou vira arquivo de referência, ou é descartado conscientemente.
~~~~

---

## Passo final: onboarding

**Não rode `git init`.** A estrutura está pronta assim que os arquivos existirem.

Avise que o brain está montado, diga em uma linha onde ele mora (caminho completo da pasta)
e **conduza a entrevista de onboarding**:

1. Pergunte se já existe algum documento de contexto pra ler antes (evita reperguntar o
   que já está escrito em algum lugar).
2. Entreviste em blocos curtos, **um arquivo por vez**, confirmando antes de escrever:
   - `context/quem-sou.md` — onde trabalha, papel, do que responde, **do que não responde**
   - `context/pessoas.md` — 3-5 pessoas recorrentes e como cada uma funciona
3. Pergunte quais são os **três a cinco** projetos ou seções em andamento e crie cada um
   com `/novo-projeto`. Não deixe a pessoa criar quinze — explique que unidade que ninguém
   alimenta vira ruína decorativa.
4. Rode `/salve` pra gravar o primeiro `estado-atual.md` e fechar a instalação.
5. **Pergunte onde vai ficar a cópia de segurança** (nuvem, disco externo, outra pasta) e
   registre a resposta na seção "Cópia de segurança" do `estado-atual.md`. Sem git, essa é
   a única proteção que existe.

Termine explicando o ritmo em uma linha:

> `/cerebro` no começo, `/salve` no fim. O resto é trabalho.

E mencione, uma vez só, que a integração com controle de versão está registrada em
`PENDENCIAS.md` pra quando fizer sentido — sem insistir.
