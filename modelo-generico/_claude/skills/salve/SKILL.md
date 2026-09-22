---
name: salve
description: Persiste fim de sessão. Resume o que foi feito, lista pendências, próximos passos, regenera o estado-atual.md, e commita em memory/sessions/<data>.md + push. Use no fim do dia ou ao terminar uma sessão importante. Acionar para -> "salve", "salvar sessao", "fim de dia", "fechar trabalho", "salvar progresso", "log do dia", "commit do dia".
---

# Skill: /salve

Fecha a sessão persistindo memória de longo prazo. Faz commit + push.

Esta é a skill mais importante do brain. O `/cerebro` só consegue ser barato porque o
`/salve` já destilou. Se ela for pulada, a próxima sessão começa cega.

## O que esta skill faz

1. **Resume o que rolou na sessão**, a partir do contexto da conversa.
2. **Lista decisões tomadas.**
3. **Lista pendências abertas**, com prazo quando houver.
4. **Lista próximos passos** (o que fazer na próxima sessão).
5. **Identifica arquivos modificados** durante a sessão.

6. **🔍 CHECAGEM DE GAPS (passo crítico):** varre o histórico da conversa procurando
   **conteúdo persistível que ficou só no chat**:

   | Apareceu na conversa | Deveria estar em |
   |---|---|
   | Ata ou resumo de reunião | `memory/inputs/reunioes/` |
   | Áudio/mensagem transcrita | `memory/inputs/mensagens/` |
   | Resumo de e-mail | `memory/inputs/email/` |
   | Snapshot de tickets | `memory/inputs/tickets/` |
   | Decisão grande | `memory/decisions/` |
   | Marco ou bloqueio numa frente | `subjects/<frente>/03-historico.md` |
   | Conhecimento técnico novo (esquema, regra, medição) | `dominio/<assunto>/` |

   Achou gap? **Alerte antes de commitar:**
   > "⚠️ Detectei conteúdo na conversa que não virou arquivo: [lista]. Quer que eu salve
   > antes de commitar?"

   Salvar depende da confirmação — ou é automático se a pessoa disser "salva tudo".

7. **Escreve `memory/sessions/<YYYY-MM-DD>.md`.**
   Se já existe arquivo do dia, **anexa nova seção** (manhã/tarde/noite). Nunca sobrescreve.

8. **🔄 REGENERA `estado-atual.md` (passo crítico — não pular):**

   - **Leia o `estado-atual.md` atual** pra ter o ponto de partida.
   - **Aplique os deltas da sessão**:
     - Frente esquentou? Move pra "Frentes quentes" ou atualiza o parágrafo dela.
     - Frente esfriou (concluída ou parada)? Move pra "Frentes fora do radar".
     - Frente cuja automação roda sozinha mas não consome atenção? Vai pra
       "⚙️ Rodando em produção" — não é frente quente nem parada.
     - Decisão fechou? Remove. Decisão nova? Adiciona.
     - Cobrança cumprida? Remove. Nova? Adiciona.
     - Item de "Esperando outros" resolvido? Remove. Novo? Adiciona **com a data**.
     - Alerta perdeu urgência? Remove. Compromisso passou? Remove.
   - **Atualize o cabeçalho:** "Última atualização: YYYY-MM-DD (manhã/tarde/noite)".
   - **Mantenha enxuto** — teto de ~150 linhas. O que transbordar é histórico e mora em
     `memory/sessions/`.
   - **Não invente** conteúdo que a sessão não tocou.

   Sessão pequena que não mudou o panorama: só atualize a data do cabeçalho.

9. **🔒 GUARDA DE TAMANHO — antes de commitar:**

   ```bash
   git diff --cached --name-only | while read f; do
     [ -f "$f" ] && s=$(stat -c%s "$f") && [ "$s" -gt 1000000 ] && \
       printf "%6.1f MB  %s\n" "$(echo $s | awk '{print $1/1048576}')" "$f"
   done
   ```

   Arquivo acima de 1 MB no stage **para o commit** até haver decisão explícita.
   Coleta bruta de sistema costuma carregar nome real de pessoa e texto livre de cliente.

   Regras de `.gitignore` falham calado — por nome de arquivo que não bate, por pasta
   renomeada. **Esta guarda é a que não depende de o caminho estar certo.**

   E confira o que está sendo **APAGADO**, não só o que entra:

   ```bash
   git diff --cached --name-status | grep "^D"
   ```

   Uma regra de `.gitignore` escrita sem caminho apaga arquivos já commitados de outro
   assunto, e ninguém percebe até precisar deles.

10. **`git add` + `git commit` + `git push`.**

    🔴 **Se o push falhar, COMMITE MESMO ASSIM e avise alto.** O commit é local e não
    depende de rede; deixar tudo sem commitar porque o push não foi é perder o trabalho
    se a máquina reiniciar.

    Depois de commitar sem push, escreva no topo do `estado-atual.md`:
    > ⚠️ **N commit(s) local(is) não enviado(s)** desde <data>. Rodar `git push`.

    E tire essa linha assim que o push sair.

11. **Sessão que atravessa a meia-noite** ganha um arquivo por data, não um só.
    O da data nova abre com uma linha de continuidade:
    > Continuação direta de <data anterior> — a sessão atravessou a meia-noite.

    O da data anterior recebe um ponteiro no fim. Sem isso, metade do trabalho fica num
    arquivo que ninguém vai abrir procurando por ele.

12. **Pasta nova entra no `mapa.md` no mesmo `/salve`.** Criar pasta e não registrar
    deixa o mapa mentindo — e mapa que mente custa mais caro que mapa que falta.

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
[nova seção se o /salve rodar de novo no mesmo dia]
```

## Mensagem de commit

Formato: `Sessao YYYY-MM-DD: <resumo curto>`

## Etiqueta extra: decisão grande

Houve decisão estratégica? Pergunte se quer também um arquivo em
`memory/decisions/<data>-<assunto>.md` com opções consideradas, razão da escolha e
consequências. Decisão pequena fica no log da sessão.

## Etiqueta extra: frente mexida

Se a sessão tocou numa frente, atualize `subjects/<frente>/03-historico.md` quando algo
material mudou: status, marco, bloqueio. Conversa que não deixou rastro no histórico não
aconteceu, do ponto de vista da próxima sessão.

## Checagem de fonte única

Antes de escrever um número novo em qualquer arquivo, procure se ele já existe em outro:

```bash
grep -rn "<o número>" --include="*.md" .
```

Se existir, **linke em vez de repetir**. Se mudou, corrija na fonte e confira quem
apontava pra ela. A regra e o mapa de onde mora cada coisa estão no `mapa.md`.

## Quando NÃO acionar

- Sessão muito curta (5 min de conversa pontual). Não commite lixo.
- Tudo já está em arquivos commitados — nesse caso só faça push se houver commit local pendente.

## Falhas comuns

- **`git push` falha por divergência:** `git pull --rebase`, resolve conflito, push de novo.
- **`git push` falha por auth:** avise pra rodar `gh auth status`.
- **Nada pra commitar:** confirme "sessão registrada sem mudanças no repo".
- **`git push` falha por rede:** commite local assim mesmo e registre o aviso no
  `estado-atual.md`. Nunca deixe de commitar por causa do push.
