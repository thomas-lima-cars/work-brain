# `sessions/` — log por dia

Um arquivo por dia, escrito pelo `/salve`. Se o `/salve` rodar mais de uma vez no mesmo
dia, ele **anexa** uma nova seção (manhã / tarde / noite) em vez de sobrescrever.

Padrão de nome: `<YYYY-MM-DD>.md`

Sessão que atravessa a meia-noite vira dois arquivos, ligados por uma linha de
continuidade — não um arquivo só com data errada.
