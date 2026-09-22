# `dominio/` — conhecimento técnico acumulado

O que o brain **aprendeu** sobre a matéria-prima do trabalho: esquemas de banco, contratos
de API, definições de indicador, regras de cálculo, glossários, receitas de consulta.

É diferente de `subjects/`. Uma frente é um eixo de trabalho ("o projeto com o cliente X");
o domínio é o saber que atravessa várias frentes ("como se calcula a margem", "onde mora
o dado de venda"). O mesmo arquivo de domínio serve a três frentes diferentes.

## Organização sugerida

```
dominio/
├── README.md              ← este arquivo: o índice que diz qual arquivo responde a quê
└── <assunto>/
    ├── definicoes.md      o que conta como X (fonte única)
    ├── indicadores.md     números medidos, cada um com data e método (fonte única)
    ├── acessos.md         como chegar na fonte (sem credencial commitada)
    └── receitas.md        consultas e procedimentos que já funcionaram
```

## Por que o índice importa

O `/cerebro` foi instruído a ler **este README primeiro** quando surge uma pergunta
técnica. Se ele estiver bem escrito, a resposta sai daqui sem abrir a fonte original —
que é lento, caro e às vezes indisponível.

Mantenha uma tabela viva:

| Pergunta | Arquivo |
|---|---|
| _ | _ |

## Regra dura

🔴 **Número medido mora em um arquivo só**, com **data e método**. Os outros linkam.
Número repetido em cinco lugares é uma contradição esperando a hora de acontecer.
