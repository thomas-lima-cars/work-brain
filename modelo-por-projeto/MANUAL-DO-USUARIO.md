# Work Brain — Manual do Usuário

Um cérebro de trabalho em arquivos de texto, operado pelo Claude Code através de quatro
comandos. Serve pra quem toca vários projetos em paralelo e perde contexto entre um dia e
o outro.

---

## Índice

- [O problema que isso resolve](#o-problema-que-isso-resolve)
- [Como funciona, em trinta segundos](#como-funciona-em-trinta-segundos)
- [Instalação](#instalação)
- [O primeiro dia](#o-primeiro-dia)
- [O ritmo diário](#o-ritmo-diário)
- [Os quatro comandos](#os-quatro-comandos)
- [Onde cada coisa é salva](#onde-cada-coisa-é-salva)
- [Situações do dia a dia](#situações-do-dia-a-dia)
- [As três regras](#as-três-regras)
- [Quando algo dá errado](#quando-algo-dá-errado)
- [Adaptando ao seu trabalho](#adaptando-ao-seu-trabalho)
- [Perguntas frequentes](#perguntas-frequentes)

---

## O problema que isso resolve

Conversa com IA é volátil. Você explica o contexto, resolve algo bom, fecha a janela — e
no dia seguinte começa do zero. Explica de novo quem é o cliente, o que já foi decidido,
por que aquela alternativa foi descartada.

Pior: o que ficou combinado some. Três semanas depois alguém pergunta "por que a gente fez
assim?" e a resposta honesta é "não lembro".

O brain quebra esse ciclo com três movimentos:

1. **Destilar no fim.** O comando `/salve` transforma a conversa em arquivos antes de você
   fechar. Ata que ficou no chat, decisão tomada de boca, pendência combinada: vira arquivo.
2. **Acordar barato.** O comando `/cerebro` não relê o repositório inteiro. Lê um único
   painel que a sessão anterior já deixou pronto.
3. **Carregar sob demanda.** O resto entra na conversa só quando a conversa pede.

**Quando NÃO vale a pena:** se você trabalha numa coisa só, de cabo a rabo, e nunca precisa
retomar contexto frio. O brain resolve fragmentação. Sem fragmentação, é burocracia.

---

## Como funciona, em trinta segundos

É uma pasta com arquivos markdown, versionada em git. Nada roda, nada precisa de servidor.

```
.
├── mapa.md              índice: onde mora cada coisa
├── estado-atual.md      painel vivo — o que está quente agora
├── context/             quem eu sou, com quem trabalho
├── projetos/            uma pasta por projeto ou seção
├── memory/              sessões, decisões, atas e mensagens
├── referencia/          conhecimento que atravessa projetos
└── inbox/               o que ainda não tem lugar
```

**O eixo é o projeto.** Não existe agrupamento por área, cliente ou time — cada unidade de
trabalho é uma pasta, seja ela um projeto com fim previsto ou uma seção permanente de
responsabilidade.

Cada projeto tem sempre os mesmos quatro arquivos:

| Arquivo | Responde |
|---|---|
| `01-visao.md` | o que é, por que existe, o que está fora de escopo |
| `02-pessoas.md` | quem pede, decide, executa, aprova |
| `03-historico.md` | linha do tempo — a memória do que ficou combinado |
| `04-tarefas.md` | o que está em andamento, bloqueado, próximo |

---

## Instalação

**Você precisa de:** Claude Code instalado, git configurado, e um repositório **privado**
(o brain vai guardar nome de gente, valor de contrato e decisão interna).

Crie uma pasta vazia, abra o Claude Code dentro dela, cole o arquivo de instruções de
geração e diga **"execute estas instruções"**. Ele constrói a estrutura, faz o primeiro
commit e te entrevista.

Leva uns vinte minutos, quase todos de entrevista.

Depois crie o repositório remoto privado e dê o primeiro push. Sem remoto o brain funciona,
mas você perde o backup e a possibilidade de trabalhar de outra máquina.

---

## O primeiro dia

### A entrevista

O assistente vai te perguntar coisas em blocos curtos. Vale responder bem a três delas:

**"Do que você NÃO responde."** Parece bobo, e é o campo mais útil do brain inteiro. Sem
essa fronteira, o cockpit da manhã vai te sugerir trabalho que não te cabe — todo dia.

**"Como cada pessoa funciona."** Não é organograma. É "só decide com número na mão",
"responde em dois dias", "não gosta de ser copiado em e-mail". Isso muda como você prepara
cada conversa, e é o tipo de coisa que você sabe mas nunca escreveu.

**"Como a empresa ganha dinheiro."** Explica por que certos projetos têm prioridade. Sem
isso, a IA prioriza pelo que parece urgente em vez do que importa.

### Os primeiros projetos

O assistente vai perguntar quais projetos estão em andamento. O teste pra saber se algo
merece pasta própria:

> Você conversa sobre isso em semanas diferentes e precisa lembrar do que ficou combinado?
> **Merece.** Nasce e morre na mesma semana? **Não** — isso é tarefa, vai pro `inbox/`.

Comece com **três a cinco**. Dá vontade de criar quinze no primeiro dia; resista. Projeto
que ninguém alimenta vira ruína decorativa, e o cockpit vai te cobrar por ele toda manhã.

### Feche o dia

Rode `/salve` mesmo que o dia 1 tenha sido só configuração. É ele que escreve o painel pela
primeira vez — sem isso, o `/cerebro` de amanhã acorda cego.

---

## O ritmo diário

```
┌─ manhã ──────────────────────────────────────────┐
│  /cerebro    2 min   panorama: o que está quente  │
│  /rotina     1 min   cockpit: o que fazer hoje    │
└───────────────────────────────────────────────────┘
                   ... trabalha ...
┌─ fim do dia ─────────────────────────────────────┐
│  /salve      3 min   destila, atualiza, commita   │
└───────────────────────────────────────────────────┘
```

**`/cerebro` é obrigatório**, uma vez por sessão. É o que carrega contexto.

**`/rotina` é opcional** — vale de manhã, ou quando você voltou de uma ausência e não sabe
por onde pegar.

**`/salve` é o que sustenta tudo.** Sessão fechada sem `/salve` é sessão que não aconteceu:
a conversa foi boa, resolveu o problema, e evaporou. Na manhã seguinte o painel ainda mostra
o mundo de anteontem.

> Se você só conseguir manter um hábito dos três, mantenha o `/salve`.

---

## Os quatro comandos

### `/cerebro` — acordar

Primeira coisa de toda sessão. Sincroniza o repositório, lê quem você é, lê o painel, olha
o que mudou nos últimos três dias e te entrega um panorama.

**O que ele não faz:** abrir os projetos. Isso é de propósito — ler tudo no boot é caro, e
brain caro é brain que se abandona em três semanas.

**Como puxar o resto:** basta falar. *"Vamos mexer no projeto X"* faz ele abrir a pasta.
*"Quanto deu aquela medição?"* faz ele ir na referência. Você não precisa citar caminho de
arquivo.

**Se o panorama vier vago,** o painel está desatualizado — quase sempre porque um `/salve`
foi pulado.

---

### `/rotina` — decidir o dia

Lê as últimas sessões e o histórico dos projetos, calcula o que está dormindo há tempo
demais, identifica quem você precisa cobrar, e devolve um **top 4-5 do dia**.

**Ele filtra ruído sem te perguntar:** status rotineiro, confirmação de reunião já feita,
cobrança que você já fez ontem. Cockpit que mostra tudo não é cockpit — é a mesma pilha,
só que formatada.

**Por que só 4-5:** uma lista de quinze itens não é priorização. Se o dia tem mais que isso
de urgente, ele foi instruído a dizer "você está sobrecarregado" em vez de listar — o que é
uma informação mais útil que a lista.

**Ele só fica bom depois de três ou quatro `/salve`.** Antes disso não há histórico pra
calcular nada. Na primeira semana, espere um cockpit magro.

---

### `/salve` — fechar

Resume a sessão, grava o log do dia, atualiza o painel e commita. Três partes merecem
atenção:

**A caça aos gaps.** Ele varre a conversa procurando o que ficou só no chat — uma ata que
você gerou, uma decisão tomada de boca, um número medido. Aí ele para e pergunta:

> ⚠️ Detectei conteúdo na conversa que não virou arquivo: [lista]. Quer que eu salve antes
> de commitar?

É o passo que impede o brain de virar um diário de commits sem substância. Responda "salva
tudo" se não quiser revisar item por item.

**A atualização do painel.** Ele não reescreve do zero: aplica as diferenças. Projeto que
esquentou sobe, decisão que fechou some, cobrança nova entra com data. Por isso o painel
não incha nem perde o que você escreveu à mão.

**As guardas antes do commit.** Nada acima de 1 MB entra sem você decidir, e ele te mostra
o que está sendo **apagado**, não só o que entra. As duas existem pelo mesmo motivo: coleta
bruta de sistema carrega nome real de pessoa e texto livre de cliente, e regra de
`.gitignore` falha calada quando o caminho não bate.

**Se o push falhar, ele commita mesmo assim** e deixa um aviso no topo do painel. Commit é
local e não depende de rede; segurar tudo porque o push não foi é perder trabalho se a
máquina reiniciar.

---

### `/novo-projeto` — abrir uma unidade

Pergunta o nome, copia o template, faz três perguntas, preenche visão e pessoas, registra
no mapa e commita.

Deixa `03-historico.md` e `04-tarefas.md` **vazios de propósito**. Projeto cresce com uso;
template preenchido à força vira ficção que ninguém revisita.

Serve tanto pra projeto (tem fim) quanto pra seção (permanente) — a estrutura é a mesma, a
diferença é só se existe linha de chegada.

---

## Onde cada coisa é salva

Quando algo aparece na conversa, ele tem um destino:

| Apareceu | Vai pra | Quem escreve |
|---|---|---|
| Resumo do que foi feito hoje | `memory/sessions/<data>.md` | `/salve`, sempre |
| Decisão com alternativas consideradas | `memory/decisions/` | `/salve`, se você confirmar |
| Ata, mensagem, e-mail, snapshot | `memory/inputs/` | `/salve`, ao achar o gap |
| Marco, bloqueio ou virada num projeto | `projetos/<X>/03-historico.md` | `/salve`, ao achar o gap |
| Conhecimento técnico que serve a vários | `referencia/<assunto>/` | `/salve`, ao achar o gap |
| Panorama do momento | `estado-atual.md` | `/salve`, sempre |
| Algo sem lugar ainda | `inbox/` | você, na hora |

**O `inbox/` é estação de passagem, não depósito.** O que sobreviver duas semanas ali ou
vira projeto, ou vira referência, ou é descartado conscientemente.

---

## Situações do dia a dia

**"Voltei de duas semanas fora."**
Rode `/cerebro`. O log de três dias vai ficar curto — peça mais: *"me mostra o que mudou
desde o dia X"*. Depois `/rotina`, que é onde o envelhecimento aparece. Ausência é
exatamente o que produz aging.

**"Preciso entrar num projeto que não toco há um mês."**
Diga *"vamos mexer no projeto `<nome>`"*. Ele abre visão, histórico e tarefas daquele — e
só daquele. O histórico em ordem inversa te recoloca em cinco linhas.

**"Alguém disse algo que contradiz o que ficou combinado."**
É pra isso que o histórico existe. Pergunte: *"o que a gente decidiu sobre X?"*. A entrada
datada é a prova. Se a informação nova vencer, ela entra como **nova linha no topo** — o
histórico é acrescentado, nunca reescrito. A contradição registrada vale mais que o
histórico limpo.

**"Tive uma reunião e quero guardar a ata."**
Cole na conversa e siga trabalhando. No `/salve`, a caça aos gaps detecta e oferece salvar.
Você não precisa lembrar de caminho de pasta.

**"Medi um número e quero que fique registrado."**
Diga onde mediu e como. Ele grava **com data e método**. Da próxima vez que perguntarem, a
resposta sai do arquivo — não de uma medição nova que pode dar diferente.

**"Trabalhei até três da manhã."**
O `/salve` detecta a virada e escreve dois arquivos, um por data, ligados por uma linha de
continuidade. Sem isso, metade do trabalho fica num arquivo que ninguém vai abrir
procurando por ele.

---

## As três regras

Parecem excesso de zelo até o dia em que não são.

### Número medido mora em um arquivo só

Você vai querer repetir o número no resumo do projeto, no painel e na ata — afinal é só um
número. Mas quando a medição mudar, corrigir num lugar tem que bastar. Com o mesmo número
em cinco arquivos, basta esquecer um pro brain seguir afirmando o falso — com toda a
autoridade de quem tem fonte escrita. **Linke em vez de repetir.**

E todo número carrega **data e método**. Número sem data apodrece em silêncio: continua
parecendo verdade muito depois de ter deixado de ser.

### Pasta nova entra no mapa na mesma sessão

Você vai criar uma pasta às pressas e pensar "registro depois". Não registra. Três pastas
depois, o mapa descreve um repositório que não existe mais — e a IA passa a navegar por um
mapa que mente, o que é pior do que não ter mapa.

### O boot não lê tudo

Vai dar vontade de mandar o `/cerebro` ler todos os projetos "pra ter certeza". Não faça. A
disciplina do carregamento sob demanda é o que mantém o boot em dois minutos — e o hábito
vivo.

---

## Quando algo dá errado

| Sintoma | Causa provável | Correção |
|---|---|---|
| Panorama vago no `/cerebro` | `/salve` pulado nas últimas sessões | Rode `/salve` hoje. Se estiver muito defasado, peça pra reconstruir o painel varrendo os projetos (é caro — faça uma vez) |
| `/rotina` vem vazia | Menos de 3-4 sessões registradas | Normal na primeira semana |
| Sugere trabalho que não é seu | Falta a seção "do que NÃO respondo" | Preencha `context/quem-sou.md` |
| Comando `/cerebro` não existe | A pasta de skills não está em `.claude/` | Verifique se é `.claude/skills/`, com ponto |
| Muitos projetos, nenhum vivo | Tarefas viraram projetos | Consolide. Cinco a oito ativos é saudável |
| Painel com 300 linhas | Histórico vazando pro painel | Teto de ~150 linhas. O excesso pertence a `memory/sessions/` |
| Nada aparece no repositório remoto | Push falhou e passou batido | O aviso está no topo do painel. Rode `git push` |
| Arquivo enorme entrou no repo | A guarda de 1 MB foi ignorada | `git rm --cached`, ajuste o `.gitignore`, e confira se não vazou dado pessoal |

---

## Adaptando ao seu trabalho

O modelo tem os encaixes prontos; o que muda é o recheio.

| Se você trabalha com | Faça |
|---|---|
| Clientes ou contas | Uma pasta por conta em `projetos/` |
| Produtos | Uma pasta por produto |
| Operação contínua | Seções permanentes — mesma estrutura, sem data de fim |
| Dados, APIs, sistemas | Preencha `referencia/` com esquemas, definições e procedimentos |
| Pesquisa | `referencia/<estudo>/` com definições, indicadores e glossário |

**O ajuste que quase todo mundo precisa fazer:** o `/rotina` assume que o brain é a única
fonte de tarefas. Se você usa Jira, Linear, Trello ou Asana, edite
`.claude/skills/rotina/SKILL.md` e diga qual é e como consultar, pra ele cruzar as duas
fontes em vez de confiar só nos arquivos.

**Os comandos são arquivos markdown comuns.** Edite à vontade: mude os limites de
envelhecimento, o tamanho do top do dia, o formato da saída. O modelo é um ponto de partida
opinado, não uma jaula.

---

## Perguntas frequentes

**Preciso rodar os três comandos todo dia?**
Só o `/cerebro` (pra carregar contexto) e o `/salve` (pra não perder). O `/rotina` é
conforto de manhã.

**E se eu esquecer o `/salve`?**
O trabalho no repositório continua lá; o que se perde é a destilação — decisão que ficou só
no chat, painel desatualizado. Na sessão seguinte, rode o `/salve` avisando que ele cobre os
dois dias. Ele não tem o contexto da conversa perdida, então seja você a contar o que
aconteceu.

**Dá pra usar em time?**
Tecnicamente sim — é um repositório git. Na prática o painel é pessoal e vira campo de
conflito com duas pessoas escrevendo nele. Um brain por pessoa, compartilhando a
`referencia/`, tende a funcionar melhor. _(Isto é raciocínio, não prática testada — se for
virar decisão de time, experimente antes.)_

**Quanto isso cresce?**
Texto puro. Um ano de uso diário dá alguns megabytes. O que cresce perigosamente é coleta
bruta de dado — por isso a guarda de 1 MB.

**Funciona em outra IA?**
A estrutura de arquivos sim, é markdown. Os comandos usam o formato de skill do Claude Code
(`.claude/skills/<nome>/SKILL.md` com frontmatter). Em outra ferramenta você reaproveita o
conteúdo e reempacota o formato.

**Preciso saber git?**
Não. Os comandos fazem commit e push por você. Saber git ajuda quando algo dá errado, mas o
uso normal não exige.

**E se o brain estiver errado sobre alguma coisa?**
Corrija na fonte única e avise. A IA foi instruída a **perguntar quando algo parecer confuso
ou desatualizado**, em vez de reinterpretar por conta própria — mas ela só sabe o que os
arquivos dizem. Brain mal alimentado mente com confiança.
