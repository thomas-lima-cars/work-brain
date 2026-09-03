---
name: criar-novo-subject
description: Orquestra a criação de uma frente de trabalho nova (subject). Copia o template, conduz mini-entrevista pra preencher contexto/stakeholders iniciais. Acionar para -> "criar subject", "nova frente", "abrir iniciativa", "comecar projeto novo", "novo eixo de trabalho".
---

# Skill: /criar-novo-subject

Cria uma frente de trabalho (subject) nova a partir do template.

## O que esta skill faz

1. **Pergunta o nome** da frente (kebab-case, ex: `integracao-c6`).
   - Sugere baseado no que o usuário descreveu.
   - Valida: não pode colidir com pasta existente em `subjects/`.
2. **Copia `subjects/_template/`** pra `subjects/<nome>/`.
3. **Conduz mini-entrevista** (só o essencial pra arrancar):
   - O que é esta frente e por que existe? → `01-contexto.md`
   - Fase atual?
   - Quem são os 2-3 stakeholders principais? → `02-stakeholders.md`
4. **Preenche** os arquivos com as respostas. Deixa o resto como placeholder.
5. **Atualiza `mapa.md`** adicionando a frente à lista "Frentes ativas".
6. **Commit:** `Abre subject: <nome>`.

## Output esperado

```
✅ Frente criada: subjects/<nome>/

Preenchido:
- 01-contexto.md (o que é, por que, fase)
- 02-stakeholders.md (2-3 pessoas)

Vazio (preencher conforme avançar):
- 03-historico.md
- 04-cards.md
```

## Princípios

- **Não exija** preencher tudo agora. Frentes crescem com uso.
- **Não invente** stakeholders ou escopo — se o usuário não souber, deixa placeholder.
- Se o usuário descrever a frente em 1 frase, **proponha** um nome de pasta e confirme antes de criar.

## Quando NÃO acionar

- A frente já existe → vá direto pra `subjects/<nome>/` e edite.
- O usuário só quer registrar uma tarefa pontual → use `inbox/` ou `memory/sessions/`.
