# Precificação preditiva

Prevê por quanto um veículo deve ser vendido, e se cobra contra vendas que
já aconteceram. Números em
[`indicadores.md`](../../../context/banco-de-dados/projetos/precificacao/indicadores.md).

```bash
# amostra ampliada (100 modelos por base); o estudo de 20 modelos fica intacto
python automations/precificacao/roda-estudo.py --base cars2you --top 100 --ate 2026-09-17 --sufixo amplo
python automations/precificacao/roda-estudo.py --base dealers  --top 100 --ate 2026-09-17 --sufixo amplo
python automations/precificacao/preditivo/coleta-disputa.py    # lances e lojas por venda -> disputa.json (precisa de VPN)
python automations/precificacao/preditivo/coleta-evento.py     # tamanho, alcance e calendario do evento -> evento.json (VPN)
python automations/precificacao/preditivo/modelo-preco.py      # treina, testa, grava resultado-modelo.json
python automations/precificacao/preditivo/outliers.py         # ofensores dos outliers -> outliers.json
node   automations/precificacao/preditivo/monta-relatorio.js   # gera relatorio-preditivo.html
python automations/precificacao/preditivo/resumo-indicadores.py --grava   # numeros no indicadores.md
```

## Atualização de 14/10 — degrau G

O que mais rendeu, medido nas **mesmas 1.091 vendas** do teste anterior: erro
mediano 5,9% → 5,6%, erro médio por carro R$ 3.350 → R$ 3.153. Nos carros de
fora dos 20 modelos o ganho é maior (teste ampliado: 6,6% → 6,0%).

- **Mais dados.** A amostra passou de 20 para 100 modelos por base (5.943 →
  10.388 vendas disputadas). Sozinho não melhora os 20 modelos originais; é o
  que dá massa para os blocos novos aprenderem, e estende o modelo a ~92% das
  vendas.
- **Blocos novos, só os que a validação aprova** (`seleciona_blocos`): entra o
  candidato que mais reduz o erro médio de **três** janelas de validação
  (jan–fev, mar–abr, mai–jun), se reduzir mais de 0,05 p.p. Aprovados:
  calendário do evento, acabamento (cor, câmbio, combustível, carroceria) e
  vendedor. Recusados: versão, itens do laudo, pátio, Molicar, idade contínua,
  ano de fabricação, FIPE do veículo, tamanho e alcance do evento.
- **Por que três janelas:** com duas, tirar UMA venda (de conta de teste)
  mudou a seleção — o vendedor passava por 0,06 p.p. e deixou de passar. O
  teste nunca participa da escolha; a decisão de ampliar para três foi tomada
  por princípio, antes de ver o resultado.
- **Peso de recência e outros parâmetros do boosting:** testados, não ajudaram.
- **Contas de teste** (vendedor com "teste"/"tutorial" no nome) saem da
  análise. Ver `qualidade.md`.
- **Variante testada e recusada (14/10, `variante-teste.py`):** sem as
  Observações do veículo e com o laudo por itens de confiança alta. Pior em
  tudo: validação 8,84% × 8,69%, teste 6,19% × 5,95% de erro mediano, R$ 3.746
  × R$ 3.566 de erro médio por carro. Quem pesa é tirar as **Observações**
  (sozinho, +0,21 p.p. no teste): elas existem em todas as vendas, o laudo
  lido em ~1 de cada 8. Trocar o laudo por itens, sozinho, fica no ruído
  (6,07% × 5,95%). Só **5 itens** passam a confiança alta no treino de
  setembro, todos "presente" (bancos, capô, pneus, portas, rodas) — os
  ofensores do painel (motor danificado, macaco ausente) não passam com as
  vendas disputadas de antes do teste. As opções `sem_texto` e `itens_alta`
  continuam no `CONF`, desligadas.
- **Índice de confiança** ficou mais honesto com mais dados: anunciado e
  observado a 1–3 pontos em cada nível, e erro mediano 8,0% / 5,5% / 4,9%
  em baixa / média / alta.

⚠️ Precisa de `numpy` e `scikit-learn` (instalados com `pip install --user` em
14/10). **Não rodar com `python -I`**: ele desliga o site-packages do usuário e
o import falha.

## O que entra

O que se sabe **antes** da venda, da mesma amostra do estudo (9.367 vendas,
20 modelos mais vendidos de cada base, 12 meses):

| bloco | de onde |
|---|---|
| modelo do carro | média da razão venda/FIPE do (base, modelo), encolhida para a base com k = 10 |
| km, idade, UF, canal, categoria, faixa de FIPE, laudo do banco | `analitico-<base>.json` |
| sinais do texto do anúncio | `analisa-sinais.py` |
| indicadores do laudo em PDF | `laudo_sinais.py` sobre `laudos/textos-vendas/` |

## Como é testado

Re-treinado **todo mês** com as vendas anteriores e cobrado no mês seguinte
(julho, agosto, setembro). A escolha do algoritmo, da regularização e da
"temperatura do mercado" sai de uma validação separada (treino até abril,
cobrança em maio e junho), **antes** de olhar o teste.

Sorteio aleatório foi descartado: punha no treino carros do mesmo lote e
semana dos testados, e o acerto sairia otimista.

## Decisões

- 🔴 **VMV e valor da venda nunca entram no modelo** (Thomas, 14/10). O
  objetivo do projeto é confrontar o preço do modelo com o VMV informado e
  com o vendido. `PROIBIDO` no `modelo-preco.py` derruba o script se uma
  variável com esses nomes chegar à matriz. O VMV viaja na saída só para a
  seção "Modelo × VMV × venda". Um experimento de 14/10 mostrou que incluir
  VMV cortaria outliers de 157 para 122 — **descartado por essa regra**.
- 🔴 **Só vendas disputadas: 3 ou mais lojas distintas deram lance** (Thomas,
  14/10). Com menos disputa o preço para no VMV e o modelo aprenderia o VMV
  por tabela. O corte (`MIN_LOJAS`) saiu da medição, não de palpite: na
  Cars2You, 67% das vendas com 1 loja fecharam a até 2% do VMV, 33% com 2,
  10% com 3 e 5–6% daí para cima. Vale no treino e no teste. Custou 55% das
  vendas da Cars2You e 19% da Dealers. Contagem: `coleta-disputa.py` →
  `disputa.json`.
- **Índice de confiança = chance de a venda ficar a até 10% do previsto.**
  Sai da faixa provável (dois boostings de quantil, 10% e 90%), com duas
  calibrações em maio e junho: a escala da faixa (`k_faixa`, para cobrir
  80%) e a tradução largura → probabilidade por **regressão logística**. A
  fórmula teórica (normal) prometia 86% no topo e entregava 76%; a isotônica
  virou escada com ~1.000 vendas e deu 0% a carro que acertava em 57%.
  Cortes: alta ≥ 80%, média 70–80%, baixa < 70%. **O índice aponta bem os
  carros difíceis** (baixa: erro mediano 8,2%) e **separa pouco média de
  alta** (5,5% × 5,3%) — está dito na página.
- **Página "Como o modelo funciona"** mora em `pagina-como.js`. As listas de
  indicadores saem de `R.variaveis` (a matriz do próprio modelo), para a
  explicação nunca divergir do que roda.
- **Link do laudo** vem de `laudos-url.json` (`coleta-disputa.py`); passa
  direto para a saída, nunca vira variável.
- **Prevê a razão venda/FIPE**, não o preço em reais.
- **Gradient boosting** venceu a ridge na validação (erro médio 8,3% × 8,8%). A
  ridge continua no relatório para **explicar** o preço: dá um peso legível
  por indicador.
- **Temperatura do mercado ficou de fora**: piorou a validação (8,5% × 8,3%).
  Em maio e junho não houve mudança de patamar para ela capturar.
- **O viés positivo é conhecido.** A Dealers caiu de 0,707 para 0,673 de razão
  em julho; nada no passado anunciava. Re-treinar todo mês o absorve com um
  mês de atraso (viés de julho +3,8%, setembro +2,1%).

## Próximo passo

Aplicar o modelo aos **não vendidos** (`laudos/nao-vendidos-2026-10.csv`)
para dar o preço sugerido de cada um — falta montar a extração deles com as
mesmas colunas do analítico.
