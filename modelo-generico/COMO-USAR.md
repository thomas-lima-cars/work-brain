# Como usar o Work Brain

Manual de operação. O [README](README.md) explica o que o modelo é; este documento explica **como se vive com ele** — do primeiro dia ao hábito consolidado.

**Índice**
- [Antes de começar](#antes-de-começar)
- [Dia 1 — instalar e ensinar quem você é](#dia-1--instalar-e-ensinar-quem-você-é)
- [Dia 2 em diante — o ritmo](#dia-2-em-diante--o-ritmo)
- [As quatro skills, uma por uma](#as-quatro-skills-uma-por-uma)
- [Onde cada coisa é salva](#onde-cada-coisa-é-salva)
- [Cenários de uso](#cenários-de-uso)
- [As regras que você vai querer quebrar](#as-regras-que-você-vai-querer-quebrar)
- [Erros comuns](#erros-comuns)
- [Adaptando ao seu trabalho](#adaptando-ao-seu-trabalho)
- [Perguntas frequentes](#perguntas-frequentes)

---

## Antes de começar

**O que você precisa:** Claude Code instalado, git configurado, e um repositório **privado** (o brain vai guardar nome de gente, valor de contrato e decisão interna).

**Quanto tempo custa:** 20 minutos no primeiro dia, depois 2 minutos no começo da sessão e 3 no fim. O `/salve` é o único momento em que você "paga" — e é o que faz todo o resto funcionar.

**Quando o modelo NÃO vale a pena:** se você trabalha numa coisa só, de cabo a rabo, e nunca precisa retomar contexto frio. O brain resolve fragmentação. Sem fragmentação, é burocracia.

---

## Dia 1 — instalar e ensinar quem você é

### 1. Montar o repositório

```bash
git init meu-brain && cd meu-brain
```

Copie o conteúdo do kit pra dentro e renomeie a pasta de skills:

```bash
mv _claude .claude
```

> Essa renomeação **não é opcional**. `.claude/skills/` é onde o Claude Code procura slash commands. Sem ela, `/cerebro` não existe.

```bash
git add -A && git commit -m "Abre o brain"
```

Crie o repositório remoto privado e dê o primeiro push. O brain sem remoto funciona, mas você perde o backup e a possibilidade de trabalhar de outra máquina.

### 2. Primeira conversa

Abra o Claude Code dentro da pasta e digite `/cerebro`.

Ele vai detectar que o `context/` está com placeholders e entrar em **modo onboarding** — uma entrevista em quatro blocos curtos. Responda com naturalidade; ele escreve os arquivos e confirma cada um antes de salvar.

O que ele pergunta, e o que vale a pena responder bem:

| Bloco | O que ele quer saber | Dica |
|---|---|---|
| `empresa.md` | Setor, o que vende, como ganha dinheiro | O modelo de receita explica por que certas frentes têm prioridade. Não pule |
| `meu-papel.md` | Do que você responde — e **do que não** | A fronteira do "não é meu" é o que evita sugestão de trabalho que não te cabe |
| `produtos.md` | O que existe e em que estado | Inclua o descontinuado: economiza a conversa "por que não usamos aquilo?" |
| `stakeholders.md` | Pessoas recorrentes e **como cada uma funciona** | O valor não está no cargo. Está em "só decide com número na mão" |

### 3. Abrir as primeiras frentes

Rode `/criar-nova-frente` uma vez por eixo de trabalho. O teste pra saber se algo é frente:

> Você conversa sobre isso em semanas diferentes e precisa lembrar do que ficou combinado? **É frente.** Nasce e morre na mesma semana? **Não é** — vai pro `inbox/` ou pro log da sessão.

Comece com **três a cinco**. Dá vontade de criar quinze no primeiro dia; resista. Frente que ninguém alimenta vira ruína decorativa, e o `/rotina` vai te cobrar por ela toda manhã.

### 4. Fechar o dia

Rode `/salve` mesmo que o dia 1 tenha sido só configuração. É o `/salve` que escreve o `estado-atual.md` pela primeira vez — e sem ele o `/cerebro` de amanhã acorda cego.

---

## Dia 2 em diante — o ritmo

```
┌─ manhã ───────────────────────────────────────────┐
│  /cerebro     2 min   panorama: o que está quente  │
│  /rotina      1 min   cockpit: o que fazer hoje    │
└────────────────────────────────────────────────────┘
                    ... trabalha ...
┌─ fim do dia ──────────────────────────────────────┐
│  /salve       3 min   destila, regenera, commita   │
└────────────────────────────────────────────────────┘
```

**O `/cerebro` é obrigatório, uma vez por sessão.** É o que carrega o contexto.

**O `/rotina` é opcional** e só vale de manhã, ou quando você voltou de uma ausência e não sabe por onde pegar. Rodar duas vezes no mesmo dia não acrescenta nada.

**O `/salve` é o que sustenta tudo.** Sessão fechada sem `/salve` é sessão que não aconteceu — a conversa foi boa, resolveu o problema, e evaporou. Na manhã seguinte o `estado-atual.md` ainda mostra o mundo de anteontem, e você começa explicando de novo.

> Se você só puder manter um hábito dos três, mantenha o `/salve`.

---

## As quatro skills, uma por uma

### `/cerebro` — acordar

**Quando:** primeira coisa de toda sessão de trabalho.

**O que faz:** `git pull`, lê os quatro arquivos de `context/`, lê o `estado-atual.md`, roda `git log` dos últimos 3 dias e te entrega um panorama formatado.

**O que ele deliberadamente NÃO faz:** ler as frentes, as sessões passadas, os inputs ou o domínio. Isso é carregamento sob demanda — entra quando a conversa chamar.

**Como puxar o resto:** basta falar. "Vamos mexer na frente X" faz ele abrir `subjects/x/`. "Quanto deu aquela medição?" faz ele ir em `dominio/*/indicadores.md`. Você não precisa citar caminho de arquivo; a skill tem uma tabela de gatilhos.

**Sinal de que algo está errado:** se o panorama vier vago ou genérico, o `estado-atual.md` está desatualizado. A causa quase sempre é um `/salve` pulado.

---

### `/rotina` — decidir o dia

**Quando:** de manhã, depois do `/cerebro`.

**O que faz:** lê as últimas 3 sessões, as decisões recentes e o histórico das frentes; calcula **aging** (o que está dormindo), identifica **cobranças** (o que depende de terceiro há tempo demais) e compõe um **top 4-5** do dia.

**O que é o pré-filtro silencioso:** ela descarta sem te perguntar o ruído previsível — status update rotineiro, confirmação de reunião já feita, cobrança que você já fez ontem. Cockpit que mostra tudo não é cockpit, é a mesma pilha formatada.

**Por que o teto de 4-5:** porque uma lista de quinze itens não é priorização. Se o dia tem mais do que isso de urgente, a skill foi instruída a dizer "você está sobrecarregado" em vez de listar — o que é uma informação mais útil.

**Ela só fica boa depois de 3-4 `/salve`.** Antes disso não há histórico pra calcular aging. Na primeira semana, espere um cockpit magro.

---

### `/salve` — fechar

**Quando:** no fim do dia, ou ao terminar uma sessão que produziu algo.

**Quando não:** conversa de cinco minutos que não mudou nada. Não commite lixo.

É a skill mais elaborada, e vale entender os três passos que importam:

**Passo 6 — a caça aos gaps.** Ela varre a conversa procurando conteúdo que ficou só no chat. Uma ata que você gerou e não salvou, uma decisão tomada de boca, um número medido que não foi pra lugar nenhum. Aí ela para e pergunta:

> ⚠️ Detectei conteúdo na conversa que não virou arquivo: [lista]. Quer que eu salve antes de commitar?

Esse é o passo que impede o brain de virar um diário de commits sem substância. Se você responder "salva tudo", ela salva sem perguntar item por item.

**Passo 8 — regenerar o painel.** Ela lê o `estado-atual.md` atual e aplica os deltas da sessão: frente que esquentou sobe, frente que esfriou desce, decisão que fechou some, cobrança nova entra com data. **Não reescreve do zero** — aplica diferença. Por isso o painel não fica inchado nem perde o que você escreveu à mão.

**Passo 9 — as guardas antes do commit.** Duas verificações. A primeira barra arquivo acima de 1 MB no stage:

```bash
git diff --cached --name-only | while read f; do [ -f "$f" ] && s=$(stat -c%s "$f") && [ "$s" -gt 1000000 ] && echo "GRANDE: $f"; done
```

A segunda mostra o que está sendo **apagado**, não só o que entra:

```bash
git diff --cached --name-status | grep "^D"
```

A primeira existe porque coleta bruta de sistema carrega nome real de pessoa e texto livre de cliente, e `.gitignore` falha calado quando o caminho não bate. A segunda existe porque uma regra de ignore mal escrita apaga arquivo já commitado de outro assunto, e ninguém percebe até precisar dele.

**Se o push falhar, ela commita assim mesmo** e escreve um aviso no topo do `estado-atual.md`. Commit é local e não depende de rede; segurar tudo porque o push não foi é perder trabalho se a máquina reiniciar.

---

### `/criar-nova-frente` — abrir um eixo

**Quando:** apareceu um trabalho que vai durar semanas e ter memória própria.

**O que faz:** pergunta o nome (e sugere um), copia o template, faz uma mini-entrevista de três perguntas, preenche `01-contexto.md` e `02-stakeholders.md`, registra no `mapa.md` e commita.

**O que ela deixa vazio de propósito:** `03-historico.md` e `04-cards.md`. Frente cresce com uso. Template preenchido à força vira ficção que ninguém revisita.

---

## Onde cada coisa é salva

Isto é o coração da organização. Quando algo aparece na conversa, ele tem um destino:

| Apareceu | Vai pra | Quem escreve |
|---|---|---|
| Resumo do que foi feito hoje | `memory/sessions/<data>.md` | `/salve` |
| Decisão estratégica, com alternativas | `memory/decisions/<data>-<assunto>.md` | `/salve`, se você confirmar |
| Ata de reunião | `memory/inputs/reunioes/` | `/salve` (gap) |
| Áudio ou mensagem transcrita | `memory/inputs/mensagens/` | `/salve` (gap) |
| Resumo de thread de e-mail | `memory/inputs/email/` | `/salve` (gap) |
| Snapshot do board de tarefas | `memory/inputs/tickets/` | `/salve` (gap) |
| Marco, bloqueio ou virada numa frente | `subjects/<frente>/03-historico.md` | `/salve` (gap) |
| Conhecimento técnico novo | `dominio/<assunto>/` | `/salve` (gap) |
| Panorama do momento | `estado-atual.md` | `/salve`, sempre |
| Algo que não tem lugar ainda | `inbox/` | você, na hora |

**O `inbox/` é estação de passagem, não depósito.** O que sobreviver duas semanas ali ou vira frente, ou vira arquivo de domínio, ou é descartado conscientemente.

---

## Cenários de uso

### "Voltei de duas semanas de férias"

Rode `/cerebro`. O painel te dá o estado, e o `git log` dos últimos 3 dias fica curto demais — peça mais: *"me mostra o que mudou desde o dia X"*. Depois `/rotina` pra ver o que envelheceu. O aging é exatamente o que uma ausência produz.

### "Preciso entrar numa frente que não toco há um mês"

Depois do `/cerebro`, diga: *"vamos mexer na frente `<nome>`"*. Ele abre contexto, histórico e cards daquela frente — e só dela. O `03-historico.md` em ordem inversa te recoloca em cinco linhas.

### "Alguém me disse algo que contradiz o que ficou combinado"

É pra isso que o `03-historico.md` existe. Pergunte: *"o que a gente decidiu sobre X na frente Y?"*. A entrada datada é a prova. Se a informação nova vencer, ela entra como **nova linha no topo** — o histórico não é reescrito, é acrescentado. A contradição registrada vale mais que o histórico limpo.

### "Tive uma reunião e quero salvar a ata"

Cole a ata ou o que você anotou na conversa e siga trabalhando. No `/salve`, a caça aos gaps vai detectar e oferecer salvar em `memory/inputs/reunioes/`. Você não precisa lembrar do caminho.

### "Medi um número e quero que o brain lembre"

Diga onde mediu e como. Ele grava em `dominio/<assunto>/indicadores.md` **com data e método**. Da próxima vez que alguém perguntar, a resposta sai do arquivo — não de uma medição nova que pode dar diferente.

### "Trabalhei até três da manhã"

O `/salve` detecta a virada e escreve **dois arquivos**, um por data, ligados por uma linha de continuidade. Sem isso, metade do trabalho fica num arquivo que ninguém vai abrir procurando por ele.

---

## As regras que você vai querer quebrar

Três regras parecem excesso de zelo até o dia em que não são. Vale saber por que existem antes de decidir ignorá-las.

### Número medido mora em um arquivo só

Você vai querer repetir o número no resumo da frente, no painel e na ata — afinal é só um número. Mas quando a medição mudar, corrigir num lugar tem que bastar. Com o mesmo número escrito em cinco arquivos, basta esquecer um pro brain seguir afirmando o falso — com toda a autoridade de quem tem fonte escrita. **Linke em vez de repetir.**

E todo número carrega **data e método**. Número sem data apodrece em silêncio: continua parecendo verdade muito depois de ter deixado de ser.

### Pasta nova entra no mapa no mesmo `/salve`

Você vai criar uma pasta às pressas e pensar "registro depois". Não registra. Três pastas depois, o `mapa.md` descreve um repositório que não existe mais — e o Claude passa a navegar por um mapa que mente, o que é pior do que não ter mapa.

### O boot não lê tudo

Vai dar vontade de mandar o `/cerebro` ler as frentes todas "pra ter certeza". Não faça. Brain caro é brain que você abandona em três semanas. A disciplina do carregamento sob demanda é o que mantém o boot em dois minutos — e o hábito vivo.

---

## Erros comuns

| Sintoma | Causa provável | Correção |
|---|---|---|
| `/cerebro` dá panorama vago | `/salve` pulado nas últimas sessões | Rode `/salve` hoje. Se estiver muito defasado, peça pra reconstruir varrendo as frentes (é caro — faça uma vez) |
| `/rotina` vem vazia | Menos de 3-4 sessões registradas | Normal na primeira semana. Persista |
| `/rotina` sugere trabalho que não é seu | `meu-papel.md` sem a seção "o que NÃO é meu" | Preencha a fronteira |
| Slash command não existe | `_claude/` não foi renomeado pra `.claude/` | `mv _claude .claude` |
| Frentes demais, nenhuma viva | Tarefas viraram frentes | Consolide. Cinco a oito ativas é saudável |
| Painel com 300 linhas | Histórico vazando pro `estado-atual.md` | Teto de ~150 linhas. O excesso pertence a `memory/sessions/` |
| Commit parado, nada no remoto | Push falhou e passou batido | O aviso está no topo do `estado-atual.md`. Rode `git push` |
| Arquivo enorme entrou no repo | Guarda de 1 MB ignorada | `git rm --cached`, ajuste o `.gitignore`, e confira se não vazou dado pessoal |

---

## Adaptando ao seu trabalho

O kit tem os encaixes prontos; o que muda é o recheio.

| Se você trabalha com | Faça |
|---|---|
| Clientes ou contas | Uma frente por conta em `subjects/` |
| Produtos ou squads | Uma frente por produto |
| Dados, APIs, sistemas | Preencha `dominio/` com esquema, acessos e receitas |
| Pesquisa ou estudos | `dominio/<estudo>/` com definições, indicadores e glossário |
| Design ou marca | Crie `design/` — **e registre a linha no `mapa.md`** |

**Ajuste que quase todo mundo precisa fazer:** a `/rotina` assume que o brain é a única fonte de tarefas. Se você usa Jira, Linear, Trello ou Asana, edite `.claude/skills/rotina/SKILL.md` e diga qual é e como consultar, pra ela cruzar as duas fontes em vez de confiar só nos arquivos.

**As skills são arquivos markdown comuns.** Edite à vontade — mude os limites de aging, o tamanho do top do dia, o formato do output. O modelo é um ponto de partida opinado, não uma jaula.

---

## Perguntas frequentes

**Preciso rodar as três skills todo dia?**
Só o `/cerebro` (pra carregar contexto) e o `/salve` (pra não perder). O `/rotina` é conforto de manhã.

**E se eu esquecer o `/salve`?**
O trabalho no repositório continua lá; o que se perde é a destilação — decisão que ficou só no chat e o painel atualizado. Na sessão seguinte, rode o `/salve` mencionando que ele cobre os dois dias. Ele não tem o contexto da conversa perdida, então seja você a contar o que aconteceu.

**Posso usar em time?**
Tecnicamente sim — é um repositório git. Na prática, o `estado-atual.md` é um painel pessoal e vira campo de conflito com duas pessoas escrevendo. Um brain por pessoa, compartilhando `dominio/` via submódulo, funciona melhor.

**Quanto isso cresce?**
Texto puro. Um ano de uso diário dá alguns megabytes. O que cresce perigosamente é coleta bruta de dado — por isso a guarda de 1 MB.

**Funciona em outra IA?**
A estrutura de arquivos, sim: é markdown. As skills usam o formato de slash command do Claude Code (`.claude/skills/<nome>/SKILL.md` com frontmatter). Em outra ferramenta você reaproveita o conteúdo, mas reempacota o formato.

**E se o brain estiver errado sobre alguma coisa?**
Corrija na fonte única e avise o Claude. Ele foi instruído a **perguntar quando algo parecer confuso ou desatualizado**, em vez de reinterpretar por conta própria — mas ele só sabe o que os arquivos dizem. Brain mal alimentado mente com confiança.
