# 🧠 Work Brain — modelo genérico

Um "cérebro de trabalho" em arquivos de texto, operado pelo Claude Code através de
quatro skills. Serve pra qualquer pessoa que trabalhe com várias frentes em paralelo
e perca contexto entre um dia e o outro.

Este kit é **agnóstico de domínio**. Não sabe nada sobre nenhum negócio específico —
quem ensina isso é você, na primeira sessão.

---

## O que este modelo resolve

Conversa com IA é volátil. Você explica o contexto, resolve algo bom, fecha a janela,
e no dia seguinte começa do zero. O brain quebra esse ciclo com três movimentos:

1. **Destilar no fim** — a skill `/salve` transforma a conversa em arquivos antes de
   você fechar. Ata que ficou no chat, decisão tomada de boca, pendência combinada:
   tudo vira arquivo.
2. **Acordar barato** — a skill `/cerebro` não relê o repositório inteiro. Lê um único
   painel (`estado-atual.md`) que a sessão anterior já deixou pronto.
3. **Carregar sob demanda** — o resto só é lido quando a conversa pede.

## O ciclo

```
/cerebro        acorda: contexto + painel do dia + o que mudou no repo
/rotina         cockpit: top do dia, o que está dormindo, quem cobrar
   ... trabalha ...
/salve          fecha: caça gaps, escreve a sessão, regenera o painel, commita
```

---

## Instalação

> Manual completo de operação: **[COMO-USAR.md](COMO-USAR.md)** — primeiro dia, ritmo diário, cenários, erros comuns e FAQ.

```bash
git init meu-brain && cd meu-brain
# copie o conteúdo deste kit para dentro
mv _claude .claude
git add -A && git commit -m "Abre o brain"
```

Abra o Claude Code dentro da pasta e digite `/cerebro`. Como o `context/` está com
placeholders, ele entra em **modo onboarding** e te entrevista pra preencher quem você
é, o que a empresa faz e quem são os stakeholders. Depois disso, `/criar-nova-frente`
pra cada eixo de trabalho.

> A pasta se chama `_claude` no kit só pra não conflitar enquanto está dentro de outro
> repositório. Renomear pra `.claude` é obrigatório — é onde o Claude Code procura skills.

---

## Anatomia

| Caminho | Papel | Lido no boot? |
|---|---|---|
| `CLAUDE.md` | isca — manda o Claude ler o `mapa.md` | sim, automático |
| `mapa.md` | índice raiz e regras que valem pro brain inteiro | sim |
| `estado-atual.md` | **painel vivo**: frentes quentes, decisões abertas, cobranças | sim — é o coração |
| `context/` | identidade: empresa, seu papel, produtos, stakeholders | sim |
| `subjects/` | uma pasta por frente de trabalho | **não** — sob demanda |
| `memory/sessions/` | um arquivo por dia, escrito pelo `/salve` | não |
| `memory/decisions/` | decisões grandes, com opções e consequências | não |
| `memory/inputs/` | matéria-prima: reuniões, mensagens, e-mail, tickets | não |
| `dominio/` | conhecimento técnico acumulado (esquemas, APIs, regras) | não |
| `inbox/` | captura rápida do que ainda não tem lugar | não |

---

## As regras que seguram o conjunto

**Fonte única para número medido.** Um número mora em um arquivo só; os outros linkam.
Quando a medição muda, corrigir é um `sed` — não uma caçada. E todo número traz **data
e método**: sem isso ele apodrece em silêncio.

**Carregamento sob demanda.** O boot lê quatro arquivos pequenos e um painel. Nada mais.
Brain que lê tudo toda vez fica caro e a pessoa para de usar.

**Pasta nova entra no mapa no mesmo `/salve`.** Mapa que mente é pior que mapa que falta.

**Commit local nunca depende do push.** Se a rede falhar, commita mesmo assim e registra
o aviso no painel.

---

## Adaptando ao seu domínio

O kit já tem os encaixes; o que muda é o recheio.

| Se você trabalha com | Preencha |
|---|---|
| Clientes / contas | uma frente por conta em `subjects/` |
| Produtos / squads | uma frente por produto |
| Bancos de dados, APIs | `dominio/` com esquema, acessos, receitas de consulta |
| Design / marca | crie `design/` e registre a linha no `mapa.md` |
| Pesquisa / estudos | `dominio/<estudo>/` com definições, indicadores, glossário |

As skills não citam nenhum domínio — funcionam igual em qualquer recheio. O único ajuste
comum é em `/rotina`: se você usa Jira, Linear ou Trello, diga isso lá; o padrão assume
que o brain é a única fonte de tarefas.
