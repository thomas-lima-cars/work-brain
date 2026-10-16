# Laudos cautelares

O PDF do laudo (`vehicle_precautionary_reports.file_url`) lido como texto, para
o estudo de precificação. Números em
[`indicadores.md`](../../../context/banco-de-dados/projetos/precificacao/indicadores.md).

| arquivo | o que faz |
|---|---|
| `coleta-textos-vendas.py` | Sorteia N vendas por base da amostra do estudo, baixa o PDF, extrai o texto e **apaga o PDF**. Retomável |
| `audita-sinais.py` | Frequência de cada indicador e os trechos que mais casaram — rodar depois de mexer no dicionário |
| `../laudo_sinais.py` | O dicionário de indicadores (peça + estado na mesma cláusula) |
| `../laudo_itens.py` | 26 itens do laudo em três estados — presente, ausente, danificado (aba "Laudo item a item") |
| `audita-itens.py` | Contagem por item e estado, com os trechos que mais casaram — rodar depois de mexer em `laudo_itens.py` |
| `baixa-laudos.py` | Baixa os PDFs de uma lista (amostra estratificada ou todos), para leitura manual |
| `nao-vendidos-2026-10.csv` | Não vendidos dos eventos de 01 a 14/10/2026, com o link do laudo |

Fica fora do git: `textos-vendas/` (nome de vistoriador, renavam) e todo `.pdf`.

## Regerar o painel

```bash
python automations/precificacao/laudos/coleta-textos-vendas.py --por-base 1500
python automations/precificacao/monta-painel-dados.py
cd automations/precificacao && node ../n8n-sdk/precificacao/monta-painel.js painel-dados.json painel-precificacao.html
node ../n8n-sdk/precificacao/_smoke_painel.js painel-precificacao.html
```

## O que já se sabe (14/10)

- PDF médio de **~17 MB**, quase tudo foto; o texto tem ~12 KB.
- **Pelo menos dez modelos de laudo** (Auditec, Alesca, Carvist, Plenaver, Plena Visão,
  Auto 100%, Natus…). Por isso dicionário, e não parser por layout.
- 11% (Cars2You) e 21% (Dealers) são **escaneados**: sem texto, pedem OCR.
- O **veredito escrito no laudo não é confiável** de extrair ("aprovado" aparece por
  item, "resultado" mora no rodapé). O veredito vem do banco.
- **Natus** (Dealers): o checklist em grade sai embaralhado; só "Detalhe das avarias" é legível.
