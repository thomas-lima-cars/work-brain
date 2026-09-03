---
name: salve
description: Persiste fim de sessão. Resume o que foi feito, lista pendências, próximos passos, regenera o estado-atual.md, e commita em memory/sessions/<data>.md + push. Use no fim do dia ou ao terminar uma sessão importante. Acionar para -> "salve", "salvar sessao", "fim de dia", "fechar trabalho", "salvar progresso", "log do dia", "commit do dia".
---

# Skill: /salve

Fecha a sessão de trabalho persistindo memória de longo prazo. Faz commit + push.

## O que esta skill faz

1. **Resume o que rolou na sessão** (a partir do contexto da conversa).
2. **Lista decisões tomadas**.
3. **Lista pendências abertas** (com prazo se mencionado).
4. **Lista próximos passos** (o que fazer amanhã / próxima sessão).
5. **Identifica arquivos modificados** durante a sessão.
6. **🔍 CHECAGEM DE GAPS (passo crítico):** Varre o histórico da conversa procurando **conteúdo persistível que ficou só no chat**:
   - Atas de reunião geradas mas não salvas em `memory/inputs/meetings/`
   - Mensagens de WhatsApp/áudio transcritas mas não em `memory/inputs/whatsapp/`
   - Resumos de e-mail mencionados mas não em `memory/inputs/outlook/`
   - Decisões grandes não salvas em `memory/decisions/`
   - Snapshots de Jira gerados mas não em `memory/inputs/jira/`
   - Atualizações de frente mencionadas mas sem editar `subjects/<frente>/03-historico.md`

   Se encontrar gap, **alerta o usuário** ANTES de commitar:
   > "⚠️ Detectei conteúdo na conversa que não virou arquivo: [lista]. Quer que eu salve antes de commitar?"

   Salvar depende da confirmação (ou automático se o usuário disser "salve tudo").

7. **Escreve `memory/sessions/<YYYY-MM-DD>.md`**.
   - Se já existe arquivo do dia: **anexa nova seção** (manhã/tarde/noite), não sobrescreve.

8. **🔄 REGENERA `estado-atual.md` (passo crítico — não pular):**

   Este é o arquivo que o `/cerebro` lê no próximo boot. Sem ele atualizado, a próxima sessão começa cega.

   Como atualizar:
   - **Lê o `estado-atual.md` atual** pra ter o ponto de partida.
   - **Aplica os deltas da sessão** que acabou de rolar:
     - Frente que esquentou? Move pra "Frentes quentes" ou atualiza o parágrafo dela.
     - Frente que esfriou (concluída, parada)? Move pra "Frentes fora do radar".
     - Frente cuja automação roda sozinha mas não consome atenção do Thomas? Vai pra
       "⚙️ Rodando em produção" — não confundir com parada nem com quente.
     - Decisão em aberto que fechou? Remove. Decisão nova? Adiciona.
     - Cobrança cumprida? Remove. Nova cobrança? Adiciona.
     - Item de "Esperando outros" resolvido? Remove. Novo? Adiciona.
     - Alerta que perdeu urgência? Remove. Compromisso que passou? Remove.
   - **Atualiza o cabeçalho** com a nova data: "Última atualização: YYYY-MM-DD (manhã/tarde/noite)".
   - **Mantém o arquivo enxuto** — não passar de ~150 linhas.
   - **Não invente conteúdo novo** que não foi tocado na sessão.

   Se a sessão foi pequena e nada mudou no panorama, só atualiza a data do cabeçalho.

9. **Faz `git add` + `git commit` + `git push`**.

## Formato do arquivo `memory/sessions/<YYYY-MM-DD>.md`

```markdown
# Sessão — YYYY-MM-DD

## 🌅 Manhã (HH:MM - HH:MM)

### Resumo
_(2-4 linhas do que foi feito)_

### Decisões tomadas
- _

### Pendências
- [ ] _ (prazo: YYYY-MM-DD)

### Próximos passos
- [ ] _

### Arquivos modificados
- `subjects/<frente>/03-historico.md`

### Notas
_(observações soltas, links, contexto adicional)_

---

## 🌆 Tarde (HH:MM - HH:MM)
[novas seções se /salve for chamado mais de uma vez no mesmo dia]
```

## Mensagem de commit

Formato: `Sessao YYYY-MM-DD: <resumo curto>`

## Etiqueta extra: decisão grande

Se houve **decisão estratégica grande**, pergunte se quer também um arquivo em `memory/decisions/<data>-<assunto>.md` com mais contexto (opções consideradas, razão, consequências).

## Etiqueta extra: frente mexida

Se a sessão tocou numa frente específica, lembre de atualizar `subjects/<frente>/03-historico.md` se algo material mudou (status, marco, bloqueio).

## Quando NÃO acionar

- Sessão muito curta (5min de conversa pontual). Não commitar lixo.
- Tudo que rolou já está em arquivos commitados — nesse caso só faça push se houver commits locais não pusheados.

## Falhas comuns

- **`git push` falha por divergência:** roda `git pull --rebase`, resolve conflitos, push de novo.
- **`git push` falha por auth:** avise pra rodar `gh auth status`.
- **Nada pra commitar:** confirma "sessão registrada sem mudanças no repo".
