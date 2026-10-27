# Decisão — todo painel novo abre no tema escuro

**Data:** 2026-10-26 · **Quem decidiu:** Thomas · **Executou:** sessão da noite (Eventos Fenauto C6)

## O que se decidiu

"Torne o layout escuro padrão (isso vale para todos os projetos daqui em diante)."
Painel novo nasce com `<html data-tema="escuro">`, e o JS que lê o tema cai no
escuro quando o atributo falta. O botão continua levando ao claro.

A regra mora em **`design/regras-de-layout.md`, regra 7** — este arquivo só guarda o
contexto. O primeiro painel a nascer assim foi o Eventos Fenauto C6.

## O que NÃO muda

- **O que já está publicado.** Radar de Estoque, Painel de Eventos C6, Painel de
  Precificação, Análise de Base e o Estudo de Vendas IGA seguem abrindo como abrem
  hoje, até alguém pedir. "Daqui em diante" foi lido como: projeto novo.
- **O CSS.** O claro segue sendo o `:root` (e o "sem atributo") do `tema.css`. Muda o
  tema em que o **arquivo** abre, não o tema base da folha. Por isso a regra do
  seletor negativo (`:root:not([data-tema="escuro"])`) continua valendo.
- **A troca não é gravada.** O tema do arquivo manda, como antes: painel que vai por
  link abre igual para todo mundo.

## Consequências

- A logo do tema escuro passa a ser a **primeira** que o cliente vê. Logo nova chega
  com a versão branca (ou a do escuro) pronta, não só com a do claro.
- Contraste se confere primeiro no escuro: é onde as cores de marca somem (o azul da
  Cars2You dá 1,65:1, o roxo da Fenauto 1,76:1 no fundo `#0B0D12`).
- **Pendente:** o `design/kit-de-painel.md` (gerado por `design/monta-kit.js`) ainda
  diz que o claro é o padrão. Regerar e conferir o texto antes de mandar o kit ao time.

## Alternativas que não foram adiante

| opção | por que não |
|---|---|
| Converter os painéis publicados agora | Não foi pedido; muda a tela de quem já recebe o link sem aviso |
| Lembrar a escolha do usuário em `localStorage` | Já recusado na regra 7: arquivo que abre diferente para cada um vira armadilha |
| Trocar o `:root` do `tema.css` para o escuro | Mexeria em todos os painéis publicados de uma vez, pela porta dos fundos |
