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

9. **🔒 GUARDA DE TAMANHO — antes de commitar:**

   ```bash
   git diff --cached --name-only | while read f; do
     [ -f "$f" ] && s=$(stat -c%s "$f") && [ "$s" -gt 1000000 ]        && printf "%6.1f MB  %s
" "$(echo $s | awk '{print $1/1048576}')" "$f"
   done
   ```

   Arquivo acima de 1 MB no stage **para o commit** até haver decisão explícita.
   Coleta bruta de banco carrega nome real de loja e texto livre de cliente.

   As regras do `.gitignore` já falharam duas vezes (por nome de arquivo e por
   renomeação de pasta). **Esta guarda é a que não depende de o caminho estar
   certo.**

   E confira o que está sendo **APAGADO**, não só o que entra:

   ```bash
   git diff --cached --name-status | grep "^D"
   ```

   Em 18/09 uma regra de `.gitignore` escrita sem caminho ia apagar três
   arquivos já commitados de outro estudo.

10. **Faz `git add` + `git commit` + `git push`**.

   🔴 **Se o push falhar, COMMITE MESMO ASSIM e avise alto.** O commit é local e
   não depende de rede; deixar tudo sem commitar porque o push não foi é perder
   o trabalho se a máquina reiniciar. Aconteceu em 17–18/09: o commit ficou
   represado dois dias e 51 arquivos existiram só como alteração solta.

   Depois de commitar sem push, escreva no topo de `estado-atual.md`:
   > ⚠️ **N commit(s) local(is) não enviado(s)** desde <data>. Rodar `git push`.

   E tire essa linha assim que o push sair.

11. **Sessão que atravessa a meia-noite** ganha um arquivo por data, não um só.
    O da data nova abre com uma linha de continuidade:
    > Continuação direta de <data anterior> — a sessão atravessou a meia-noite.

    O da data anterior recebe um ponteiro no fim. Sem isso, metade do trabalho
    fica num arquivo que ninguém vai abrir procurando por ele.

12. **Pasta nova entra no `mapa.md` no mesmo `/salve`.** Criar pasta em
    `automations/` ou `subjects/` e não registrar deixa o mapa mentindo —
    aconteceu com três pastas entre 17 e 18/09.

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
- **`git push` falha por rede/auth:** commite local assim mesmo e registre o
  aviso no `estado-atual.md`. Nunca deixe de commitar por causa do push.

## Checagem de fonte única

Antes de escrever um número novo em qualquer arquivo, procure se ele já existe
em outro:

```bash
grep -rn "<o número>" --include="*.md" .
```

Se existir, **linke em vez de repetir**. Se o número mudou, corrija na fonte e
confira quem apontava para ela. A regra e o mapa de onde mora cada coisa estão
no `mapa.md`.
