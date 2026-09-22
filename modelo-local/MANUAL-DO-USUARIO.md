# Work Brain — Manual do Usuário (versão local)

Um cérebro de trabalho em arquivos de texto, operado pelo Claude Code através de quatro
comandos. Serve pra quem toca vários projetos em paralelo e perde contexto entre um dia e
o outro.

**Esta versão não usa git nem nenhuma ferramenta de versionamento.** É uma pasta no seu
computador, e só. A integração com controle de versão fica registrada como pendência
dentro do próprio brain — para quando fizer sentido.

---

## Índice

- [O problema que isso resolve](#o-problema-que-isso-resolve)
- [Como funciona, em trinta segundos](#como-funciona-em-trinta-segundos)
- [O que você ganha e o que você perde por não ter git](#o-que-você-ganha-e-o-que-você-perde-por-não-ter-git)
- [Instalação](#instalação)
- [O primeiro dia](#o-primeiro-dia)
- [O ritmo diário](#o-ritmo-diário)
- [Os quatro comandos](#os-quatro-comandos)
- [Onde cada coisa é salva](#onde-cada-coisa-é-salva)
- [Cópia de segurança](#cópia-de-segurança)
- [Situações do dia a dia](#situações-do-dia-a-dia)
- [As quatro regras](#as-quatro-regras)
- [Quando algo dá errado](#quando-algo-dá-errado)
- [Adaptando ao seu trabalho](#adaptando-ao-seu-trabalho)
- [Perguntas frequentes](#perguntas-frequentes)

---

## O problema que isso resolve

Conversa com IA é volátil. Você explica o contexto, resolve algo bom, fecha a janela — e no
dia seguinte começa do zero. Explica de novo quem é o cliente, o que já foi decidido, por
que aquela alternativa foi descartada.

Pior: o que ficou combinado some. Três semanas depois alguém pergunta "por que a gente fez
assim?" e a resposta honesta é "não lembro".

O brain quebra esse ciclo com três movimentos:

1. **Destilar no fim.** O comando `/salve` transforma a conversa em arquivos antes de você
   fechar. Ata que ficou no chat, decisão tomada de boca, pendência combinada: vira arquivo.
2. **Acordar barato.** O comando `/cerebro` não relê a pasta inteira. Lê um único painel que
   a sessão anterior já deixou pronto.
3. **Carregar sob demanda.** O resto entra na conversa só quando a conversa pede.

**Quando NÃO vale a pena:** se você trabalha numa coisa só, de cabo a rabo, e nunca precisa
retomar contexto frio. O brain resolve fragmentação. Sem fragmentação, é burocracia.

---

## Como funciona, em trinta segundos

É uma pasta com arquivos markdown. Nada roda, nada precisa de servidor, nada precisa de
conta em lugar nenhum.

```
.
├── mapa.md              índice: onde mora cada coisa
├── estado-atual.md      painel vivo — o que está quente agora
├── PENDENCIAS.md        melhorias conhecidas do próprio brain
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

## O que você ganha e o que você perde por não ter git

**Ganha:** simplicidade. Nenhum conceito novo pra aprender, nenhuma conta pra criar,
nenhuma etapa de commit no fim do dia. Você mexe em arquivos e pronto.

**Perde três coisas**, e vale saber exatamente quais:

| O que falta | Consequência prática |
|---|---|
| Histórico de versões | Não dá pra ver o que mudou nem voltar atrás. **O que for sobrescrito, perdeu** |
| Backup automático | O disco morreu, o brain morreu junto |
| Acesso de outro computador | O brain vive onde a pasta está |

O modelo compensa a primeira com uma regra de disciplina — **nada é sobrescrito, tudo é
anexado** — e a segunda com um lembrete semanal de cópia de segurança. A terceira não tem
compensação: se você precisa do brain em duas máquinas, é hora de adotar git.

Tudo isso está escrito no arquivo `PENDENCIAS.md` do brain, junto com o checklist exato do
que muda quando você decidir integrar. **A estrutura de pastas é idêntica com ou sem git**
— adotar depois não exige reorganizar nada.

---

## Instalação

**Você precisa de:** Claude Code instalado. Só isso.

Crie uma pasta vazia, abra o Claude Code dentro dela, cole o arquivo de instruções de
geração e diga **"execute estas instruções"**. Ele constrói a estrutura e te entrevista.

Leva uns vinte minutos, quase todos de entrevista.

**Escolha bem onde a pasta vai ficar.** Se você já usa alguma pasta sincronizada com nuvem
(OneDrive, Google Drive, Dropbox, iCloud), colocar o brain dentro dela resolve o backup de
graça — e é a decisão mais barata deste manual inteiro.

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

No fim ele pergunta **onde vai ficar a cópia de segurança**. Responda de verdade — essa
resposta fica gravada no painel e vira o lembrete semanal.

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
│  /salve      3 min   destila e atualiza o painel  │
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

Primeira coisa de toda sessão. Lê quem você é, lê o painel, lê as duas últimas sessões e
olha quais arquivos foram mexidos nos últimos dias. Devolve um panorama.

**O que ele não faz:** abrir os projetos. Isso é de propósito — ler tudo no boot é caro, e
brain caro é brain que se abandona em três semanas.

**Como puxar o resto:** basta falar. *"Vamos mexer no projeto X"* faz ele abrir a pasta.
*"Quanto deu aquela medição?"* faz ele ir na referência. Você não precisa citar caminho de
arquivo.

**Ele pega edição manual.** Se você mexeu num arquivo direto, sem passar por uma conversa,
ele nota pela data de modificação e menciona. É o substituto local do histórico de commits.

**Se o panorama vier vago,** o painel está desatualizado — quase sempre porque um `/salve`
foi pulado.

---

### `/rotina` — decidir o dia

Lê as últimas sessões e o histórico dos projetos, calcula o que está dormindo há tempo
demais, identifica quem você precisa cobrar, e devolve um **top 4-5 do dia**.

**Ele filtra ruído sem te perguntar:** status rotineiro, confirmação de reunião já feita,
cobrança que você já fez ontem. Cockpit que mostra tudo não é cockpit — é a mesma pilha, só
que formatada.

**Por que só 4-5:** uma lista de quinze itens não é priorização. Se o dia tem mais que isso
de urgente, ele foi instruído a dizer "você está sobrecarregado" em vez de listar — o que é
uma informação mais útil que a lista.

**Ele só fica bom depois de três ou quatro `/salve`.** Antes disso não há histórico pra
calcular nada. Na primeira semana, espere um cockpit magro.

---

### `/salve` — fechar

Resume a sessão, grava o log do dia e atualiza o painel. Quatro partes merecem atenção:

**A caça aos gaps.** Ele varre a conversa procurando o que ficou só no chat — uma ata que
você gerou, uma decisão tomada de boca, um número medido. Aí ele para e pergunta:

> ⚠️ Detectei conteúdo na conversa que não virou arquivo: [lista]. Quer que eu salve?

É o passo que impede o brain de virar um diário sem substância. Responda "salva tudo" se não
quiser revisar item por item.

**A atualização do painel.** Ele não reescreve do zero: aplica as diferenças. Projeto que
esquentou sobe, decisão que fechou some, cobrança nova entra com data. Por isso o painel não
incha nem perde o que você escreveu à mão.

**O lembrete de cópia de segurança.** Uma vez por semana ele checa quando foi a última e
avisa. **Ele não executa a cópia** — o destino é sua escolha, e copiar sua pasta pra fora do
projeto sem pedir não é papel dele.

**O recibo.** Sem commit, não existe confirmação automática de que algo foi gravado. Por
isso ele termina listando os caminhos de tudo que escreveu. Vale bater o olho.

---

### `/novo-projeto` — abrir uma unidade

Pergunta o nome, copia o template, faz três perguntas, preenche visão e pessoas, e registra
no mapa.

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

**O `inbox/` é estação de passagem, não depósito.** O que sobreviver duas semanas ali ou vira
projeto, ou vira referência, ou é descartado conscientemente.

---

## Cópia de segurança

Esta é a parte que exige disciplina sua. Sem git, a pasta é a única via do brain.

**A opção mais barata:** coloque a pasta dentro de algo que já sincroniza — OneDrive, Google
Drive, Dropbox, iCloud. Aí o backup acontece sozinho e você pode ignorar o resto desta seção.

**Se não for o caso:** copie a pasta inteira pra outro lugar uma vez por semana. Um pen
drive, um disco externo, um zip anexado num e-mail pra você mesmo. Não precisa de elegância,
precisa de existir.

O painel tem uma seção "Cópia de segurança" no rodapé com a data da última e o destino. O
`/salve` lê essa data e te cutuca quando passa de sete dias. Quando você fizer a cópia,
diga a ele — ele atualiza o registro.

> Vale dizer o óbvio: sincronização em nuvem **não é histórico**. Se você apagar algo por
> engano, a nuvem replica o apagamento. Ela protege contra disco morto, não contra erro
> seu. Proteção contra erro é a regra de nunca sobrescrever — ou é git.

---

## Situações do dia a dia

**"Voltei de duas semanas fora."**
Rode `/cerebro`. Ele lê as duas últimas sessões, que serão de duas semanas atrás — peça
mais: *"lê as últimas cinco sessões"*. Depois `/rotina`, que é onde o envelhecimento
aparece. Ausência é exatamente o que produz aging.

**"Preciso entrar num projeto que não toco há um mês."**
Diga *"vamos mexer no projeto `<nome>`"*. Ele abre visão, histórico e tarefas daquele — e só
daquele. O histórico em ordem inversa te recoloca em cinco linhas.

**"Alguém disse algo que contradiz o que ficou combinado."**
É pra isso que o histórico existe. Pergunte: *"o que a gente decidiu sobre X?"*. A entrada
datada é a prova. Se a informação nova vencer, ela entra como **nova linha no topo** — o
histórico é acrescentado, nunca reescrito.

**"Escrevi uma coisa errada num arquivo."**
Não apague. Marque a correção deixando rastro:

> ~~O número era 42~~ → **corrigido em 2026-03-14:** eram 38. Medido por <método>.

Sem histórico de versão, o rastro é o que impede a informação errada de voltar por outro
caminho — numa ata antiga, num resumo que alguém salvou.

**"Tive uma reunião e quero guardar a ata."**
Cole na conversa e siga trabalhando. No `/salve`, a caça aos gaps detecta e oferece salvar.
Você não precisa lembrar de caminho de pasta.

**"Medi um número e quero que fique registrado."**
Diga onde mediu e como. Ele grava **com data e método**. Da próxima vez que perguntarem, a
resposta sai do arquivo — não de uma medição nova que pode dar diferente.

**"Trabalhei até três da manhã."**
O `/salve` detecta a virada e escreve dois arquivos, um por data, ligados por uma linha de
continuidade. Sem isso, metade do trabalho fica num arquivo que ninguém vai abrir procurando
por ele.

---

## As quatro regras

Parecem excesso de zelo até o dia em que não são.

### Nada é sobrescrito

Esta é **a regra desta versão**. Sem controle de versão, sobrescrever é destruir — não existe
desfazer, não existe "como estava antes". Texto novo é anexado; correção deixa rastro. A
única exceção é o painel, que é painel por natureza, e mesmo ele é atualizado por diferença,
não reescrito.

### Número medido mora em um arquivo só

Você vai querer repetir o número no resumo do projeto, no painel e na ata — afinal é só um
número. Mas quando a medição mudar, corrigir num lugar tem que bastar. Com o mesmo número em
cinco arquivos, basta esquecer um pro brain seguir afirmando o falso — com toda a autoridade
de quem tem fonte escrita. **Linke em vez de repetir.**

E todo número carrega **data e método**. Número sem data apodrece em silêncio: continua
parecendo verdade muito depois de ter deixado de ser.

### Pasta nova entra no mapa na mesma sessão

Você vai criar uma pasta às pressas e pensar "registro depois". Não registra. Três pastas
depois, o mapa descreve uma estrutura que não existe mais — e a IA passa a navegar por um
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
| **Apaguei algo sem querer** | Sem versionamento, não há desfazer | Veja se a cópia de segurança tem. Se não tiver, está perdido — e isso é o argumento pra integrar git |
| A IA sugere fazer commit | Ela ignorou o aviso do `mapa.md` | Diga que este brain é local. O checklist de integração está em `PENDENCIAS.md` |

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
Só o `/cerebro` (pra carregar contexto) e o `/salve` (pra não perder). O `/rotina` é conforto
de manhã.

**E se eu esquecer o `/salve`?**
Os arquivos que já existiam continuam lá; o que se perde é a destilação — decisão que ficou
só no chat, painel desatualizado. Na sessão seguinte, rode o `/salve` avisando que ele cobre
os dois dias. Ele não tem o contexto da conversa perdida, então seja você a contar o que
aconteceu.

**Quando eu devo adotar git?**
Três sinais: você perdeu (ou quase perdeu) trabalho; precisa do brain em outro computador;
ou passou a querer saber "quando foi que isso mudou?". O `PENDENCIAS.md` tem o checklist
completo — são umas seis edições, e **a estrutura de pastas não muda em nada**.

**Posso mover a pasta de lugar?**
Pode. Nada aqui depende do caminho absoluto. Só lembre de reabrir o Claude Code no novo
lugar, e de atualizar o destino da cópia de segurança se ele mudou junto.

**Dá pra usar em time?**
Nesta versão, não de verdade. Sem versionamento, duas pessoas editando a mesma pasta
compartilhada sobrescrevem uma à outra em silêncio — que é o pior modo de falhar. Se for pra
time, adote git primeiro.

**Quanto isso cresce?**
Texto puro. Um ano de uso diário dá alguns megabytes. O que cresce perigosamente é coleta
bruta de dado — o `/salve` checa arquivos acima de 1 MB de vez em quando.

**Funciona em outra IA?**
A estrutura de arquivos sim, é markdown. Os comandos usam o formato de skill do Claude Code
(`.claude/skills/<nome>/SKILL.md` com frontmatter). Em outra ferramenta você reaproveita o
conteúdo e reempacota o formato.

**E se o brain estiver errado sobre alguma coisa?**
Corrija na fonte única, deixando rastro da versão antiga, e avise. A IA foi instruída a
**perguntar quando algo parecer confuso ou desatualizado**, em vez de reinterpretar por conta
própria — mas ela só sabe o que os arquivos dizem. Brain mal alimentado mente com confiança.
