---
name: criar-nova-frente
description: Orquestra a criação de uma frente de trabalho nova. Copia o template, conduz mini-entrevista pra preencher contexto e stakeholders iniciais, e registra no mapa. Acionar para -> "criar frente", "nova frente", "abrir iniciativa", "comecar projeto novo", "novo eixo de trabalho", "novo cliente", "novo subject".
---

# Skill: /criar-nova-frente

Cria uma frente de trabalho nova a partir do template.

Uma **frente** é um eixo estável de trabalho: um cliente, um produto, uma squad, uma
iniciativa longa. O teste é simples — se você conversa sobre isso em semanas diferentes
e precisa lembrar do que ficou combinado, é uma frente. Se é uma tarefa que nasce e morre
na mesma semana, não é: vai pro `inbox/` ou pro log da sessão.

## O que esta skill faz

1. **Pergunta o nome** (kebab-case, ex: `integracao-pagamentos`).
   - Sugira um nome baseado no que a pessoa descreveu, e confirme antes de criar.
   - Valide: não pode colidir com pasta existente em `subjects/`.
2. **Copia `subjects/_template/`** pra `subjects/<nome>/`.
3. **Conduz mini-entrevista** — só o essencial pra arrancar:
   - O que é esta frente e por que existe? → `01-contexto.md`
   - Em que fase está?
   - Quem são os 2-3 stakeholders principais e qual o papel de cada um? → `02-stakeholders.md`
4. **Preenche** os arquivos com as respostas. Deixa o resto como placeholder.
5. **Atualiza o `mapa.md`**, adicionando a frente à lista "Frentes ativas".
6. **Commit:** `Abre frente: <nome>`.

## Output esperado

```
✅ Frente criada: subjects/<nome>/

Preenchido:
- 01-contexto.md (o que é, por que existe, fase)
- 02-stakeholders.md (2-3 pessoas)

Vazio (preencher conforme avançar):
- 03-historico.md
- 04-cards.md

Registrada no mapa.md.
```

## Princípios

- **Não exija** preencher tudo agora. Frentes crescem com uso; template preenchido à força
  vira ficção que ninguém revisita.
- **Não invente** stakeholders nem escopo. Se a pessoa não souber, deixe placeholder.
- **Não crie frente demais.** Cinco a oito frentes ativas é um número saudável. Vinte
  significa que algumas são tarefas disfarçadas.

## Quando NÃO acionar

- A frente já existe → vá direto pra `subjects/<nome>/` e edite.
- É uma tarefa pontual → `inbox/` ou o log da sessão em `memory/sessions/`.
