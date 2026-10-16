# Painel de Precificação

> Para cada carro **não vendido** da Cars2You cadastrado nos últimos 30 dias,
> em evento encerrado, ativo ou futuro: o preço que o **modelo de
> precificação** estima, a faixa provável, o índice de confiança — e o
> **VMV do cliente** ao lado, para ver onde os dois discordam.

Workflow n8n **`gzc0zOKMF4vCbXGH`** — "Painel de Precificação", projeto
**Cars2You** (criado em 14/10 com o ok do Thomas). ⚠️ **Inativo**: rodou uma
vez à mão (execução 61975, 14/10, sucesso); ligar o agendamento espera ok.
Transcrição conferida byte a byte (`_confere_transcricao.py`): os três nós de
código idênticos aos de `n8n/`.

```
Diariamente 07h → Ler Modelo → Montar Consultas → MCP Consultas → Montar Painel
               → Virar Arquivo → Subir no SharePoint
```

Publica em `Painel de Precificação/painel-precificacao.html` no site N8N do
SharePoint, e lê o modelo de `Painel de Precificação/modelo.json`, na mesma pasta.

## As regras (Thomas, 14/10)

| | |
|---|---|
| **Recorte** | Carros com `vehicles.created_at` nos últimos 30 dias (hora de Brasília), cuja **última** negociação está fora de 2, 3 e 7, em qualquer evento — encerrado, ativo ou futuro |
| **Base** | Só a **Cars2You**: o MCP do n8n não alcança o banco da Dealers |
| **Modelo** | O G do preditivo (`automations/precificacao/preditivo/`). Treina **fora** do n8n, mensal, em Python; o n8n só avalia as árvores em JavaScript |
| **VMV** | Só para o **confronto**. O modelo não o recebe — o nó entrega ao avaliador uma cópia da linha só com os campos de entrada, e a prova troca todo VMV e confere que nenhum preço muda |
| **VMV válido** | Entre 20% e 150% da FIPE do anúncio; fora disso aparece como inválido |
| **VMV provisório** | Exatos R$ 100.000 — valor de cadastro, trocado depois pelo VMV real. Fora do confronto, com aviso (14/10) |
| **Sem estimativa** | Motos e pesados (o modelo não foi treinado neles) e carro sem FIPE no anúncio. A FIPE do cadastro do veículo **não** serve de reserva: os 340 carros sem FIPE no anúncio também não a têm (14/10) |
| **Agenda** | Diária, às 7h |

## Filtros (gaveta lateral, regra 5c do design)

Whitelabel (canais do **evento** — um evento pode estar em vários), comitente,
evento, situação do evento (encerrado / ativo / futuro), encerramento de / até,
modelo. Limpar tudo.

## Como o modelo chega ao n8n

```bash
# no re-treino mensal (com VPN)
python automations/precificacao/preditivo/modelo-preco.py
python automations/precificacao/preditivo/exporta-modelo.py      # -> modelo.json + gabarito
node   automations/precificacao/preditivo/prova-modelo-js.js     # o JS dá o mesmo preço do Python
# e substituir Painel de Precificação/modelo.json no SharePoint
```

O workflow não muda no re-treino: o arquivo é lido a cada run. Se o modelo
passar de 45 dias, o painel avisa no ícone de atenção.

## Montar e provar

```bash
python coleta_local.py      # SQL exato do nó, pela conexão direta (VPN) -> dados-local.json
node _aplica-modelo.js      # injeta tema, logos e o avaliador (aplica-modelo.js) no nó
for f in montar-consultas.js montar-painel.js virar-arquivo.js; do node _enxuga.js $f; done
node monta_local.js         # -> saida-local.html
node prova-local.js         # 15 provas
python build_wf.py          # -> painel-precificacao.wf.ts
# depois de sincronizar com o n8n, ANTES de rodar:
python _confere_transcricao.py <dump do get_workflow_details>
```

As provas cobrem: injeção atualizada, nós sem barra invertida / crase / `${`,
nó enxuto = original, **VMV não influi no preço**, todo veículo na tela,
todo carro leve com FIPE estimado, preço dentro da faixa, JS = Python,
página sem requisição de rede, caminho do SharePoint codificado.

## Medido em 14/10 (coleta local)

| | |
|---|---:|
| não vendidos no recorte | 2.230 |
| com estimativa | 1.805 |
| com VMV válido | 1.746 |
| eventos | 125 |
| consultas | 11 (10 partes de veículos de 109–121 KB + eventos), < 1 s cada |

Leitura de 14/10: somados, os VMV ficam **5,9% acima** do que o modelo
estima; 26% dos carros com VMV mais de 15% acima.

## Primeira execução no n8n (61975, 14/10)

49 s, sucesso: 2.262 não vendidos, 1.837 com estimativa, 1.821 com VMV válido,
124 eventos, HTML de 708 KB publicado em `Painel de Precificação/`.
A diferença para a coleta local de horas antes é o dado que mudou (85 carros
com VMV/FIPE alterados), não o código.

⚠️ **VMV = 100.000 é provisório** (ver `context/banco-de-dados/plataforma/dominios.md`):
91 carros com ele na coleta local, 31 na execução — 26 do C6 Bank Lojista.
Hoje entram no confronto como "VMV muito acima do modelo".

## Pendências para ir ao ar

1. ✅ `modelo.json` no SharePoint (o Thomas subiu em 14/10). Workflow de uso
   único `yl0OLqXpDQrL9D9a`, que criou a pasta, arquivado.
2. ✅ Rodado à mão (61975).
3. ✅ Fuso do workflow em `America/Sao_Paulo` (14/10). Fica nas configurações
   do workflow, não no `.wf.ts`: recriar o workflow do SDK exige refazer o fuso,
   senão "7h" vira 4h de Brasília.
4. ✅ VMV = 100.000 tratado como **provisório** (14/10): fora do confronto,
   "(provisório)" na tabela e aviso próprio. Transcrição conferida.
5. Ligar o agendamento (espera ok).
