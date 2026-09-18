# Precificação na Dealers — o mesmo estudo, outra base

> Rodado em **2026-09-17** sobre `wl_dlc_prd`, com as **mesmas definições** do
> estudo da Cars2You (`automations/n8n-sdk/precificacao/`). Venda, "última",
> valor, FIPE, grupo, corte e janela são idênticos.
>
> **4.771 vendas**, 20 modelos, 12 meses, sem motos e pesados.

## O funil

| | Dealers | Cars2You |
|---|---:|---:|
| Vendas em 12 meses (status 2/3/7, última linha) | 13.058 | — |
| Com preço de venda | 13.058 (100%) | — |
| **Com FIPE no anúncio** | **9.639 (73,8%)** | **85,6%** |
| Dentro do corte 0,20–1,20 | 9.601 | — |
| Elegíveis (sem motos/pesados) | 8.944 | 9.083 |
| **Amostra: 20 modelos mais vendidos** | **4.771 (53,3%)** | **4.582 (50,4%)** |

Estrutura quase idêntica. **18 dos 20 modelos são os mesmos.** Só na Dealers:
T-Cross (166) e Virtus (151). Só na Cars2You: Palio e Toro.

## Deságio: 29,6% contra 31,1%

A Dealers vende **1,5 p.p. mais perto da tabela**.

## As quatro dimensões, dentro do mesmo modelo

| dimensão | Dealers | Cars2You |
|---|---:|---:|
| Quilometragem | **14,8 p.p.** | 15,0 p.p. |
| Idade do veículo | **13,7 p.p.** | 9,2 p.p. |
| UF do pátio | **5,4 p.p.** | 7,9 p.p. |
| Laudo cautelar | **7,8 p.p.** | 5,2 p.p. |

Km é escada monótona nas duas bases (−6,1 em "até 20k" → +8,7 em "200k+").

**Idade pesa muito mais aqui**: 15 anos ou mais leva +11,6 p.p. **Laudo
também**: reprovado +4,6 p.p. contra aprovado −3,2 p.p. Em compensação
**geografia pesa menos** — a amplitude entre UFs caiu quase pela metade.

## O ranking das colunas

⚠️ **Os dois lados foram recalculados com o mesmo código e o mesmo controle
(por modelo).** Ver a armadilha no fim deste arquivo.

| coluna | Dealers | Cars2You |
|---|---:|---:|
| comprador (loja) | **32,1%** | 41,6% |
| laudo | **11,3%** | _não extraído_ |
| versão | 11,3% | 13,1% |
| **loja vendedora** | **9,9%** | 5,9% |
| quilometragem | 9,8% | 18,1% |
| código molicar | 8,5% | 12,6% |
| pátio | 5,0% | 9,7% |
| ano | 3,8% | 5,3% |
| **cluster** | **0,1%** | **18,1%** |

**Quem compra continua sendo o maior fator**, nas duas bases, com folga.

**`cluster` morre aqui** — tem 3 níveis na Dealers contra 22 na Cars2You. Não
é que deixou de importar: a coluna não é usada nesta operação.

**A loja vendedora importa quase o dobro** (9,9% contra 5,9%) — com 19 lojas,
contra 128 na Cars2You. Base mais concentrada.

## 🔴 O maior achado da Cars2You NÃO se reproduz

**`REPASSE` e `TRADICIONAL` não aparecem uma única vez** em `vehicles.description`
na Dealers. O efeito de 7,0 p.p. que lidera o estudo da Cars2You é **específico
daquela operação** — não é propriedade da plataforma.

E o texto aqui é de outra natureza: **4.470 textos distintos para 4.771 vendas**.
Na Cars2You eram 1.365 para 4.582, com duas frases cobrindo 44%. Lá é
boilerplate com variação; aqui é texto realmente livre.

### As páginas

| arquivo | o que é |
|---|---|
| `graficos-modelo.html` | km, idade, UF e laudo dentro do mesmo modelo |
| `colunas-desagio.html` | regressão simples de cada uma das 35 colunas |
| `analitico-veiculos.html` | as 4.771 vendas, linha a linha, com filtro e CSV |
| **`termos-linhas.html`** | **cada termo abre as vendas em que ele aparece** |
| **`sinais-contexto.html`** | **cada item e cada peça, com o analítico e o texto junto** |

`termos-linhas.html` é a que responde "quem está por trás desse número":
clicar num termo filtra o analítico para as linhas que o contêm, mostra o
texto normalizado com o termo destacado e exporta CSV. Tem também busca livre,
para testar qualquer expressão que não esteja na lista.

O gerador **confere termo a termo** que a contagem da página bate com a da
análise — nos 770, e se divergir em um só ele não emite o arquivo.

⚠️ **A página de termos da Cars2You (`termos-descricao.html`) não foi
replicada** — aquele gerador afirma no corpo "duas frases cobrem 44% da base" e
traz um destaque fixo de REPASSE vs TRADICIONAL, nenhum dos dois verdadeiro
aqui. Parametrizar seria reescrever a página.

### Item a item e peça a peça

`sinais-contexto.html` mede **53 sinais** individuais, cada um contra quem não o
tem, dentro do mesmo modelo. Os maiores:

| sinal | vendas | efeito | t |
|---|---:|---:|---:|
| Motor em funcionamento | 3.946 | **−7,0 p.p.** | −16,4 |
| Motor não funciona | 605 | **+6,6 p.p.** | 14,1 |
| Chave ausente ou não funciona | 773 | **+5,5 p.p.** | 13,3 |
| Chave (presente) | 3.735 | −5,4 p.p. | −14,0 |
| Sem estepe | 379 | +4,7 p.p. | 7,7 |
| Estepe (presente) | 3.635 | −4,3 p.p. | −12,0 |
| Sem itens de segurança | 622 | +3,9 p.p. | 8,2 |
| Crivo | 67 | **+12,0 p.p.** | 7,0 |
| Faróis avariados | 80 | +7,6 p.p. | 6,1 |

**O que o carro NÃO tem pesa mais do que o que está amassado.** Chave, estepe e
itens de segurança movem 4 a 5,5 p.p. cada. A peça avariada mais forte fora as
raras (`faróis`, 80 vendas) é `banco` com +3,9.

**As peças de formulário quase não separam**, como esperado: `para-choque`
(70,8% da base) dá +1,0 e `arranhões e avarias em geral` (74,7%) dá −0,3. São
caixas marcadas, não descrição daquele carro.

⚠️ **Duas peças dão efeito NEGATIVO**: `roda` (−1,0, t = −2,7) e `calota`
(−0,6). A hipótese é a frase "rodas de ferro com calotas raladas", que marca
carro de entrada — não testada.

### ⚠️ Um achado que ficou sem página

A versão anterior desta análise tinha um grupo por **tamanho do texto**, que
saiu a pedido em 17/09 por medir o anúncio e não o carro. O número continua
valendo e não está em página nenhuma:

**Descrição vazia dá +7,3 p.p. de deságio** (69 vendas) e até 300 caracteres dá
+5,0 (185 vendas). Era o maior efeito daquela página. Sem esse grupo, parte do
efeito reaparece diluída nos sinais "sem menção" dos outros.

### O que o texto entrega na Dealers

Medido dentro do modelo, com o mesmo método de n-gramas:

| termo | vendas | % da base | efeito |
|---|---:|---:|---:|
| `crivo` | 67 | 1,4% | **+11,8 p.p.** |
| `leilao` | 61 | 1,3% | +9,1 p.p. |
| `nao funciona com chave` | 300 | 6,3% | +6,8 p.p. |
| `documento em regularizacao` | 97 | 2,0% | +7,6 p.p. |
| `documento pronto` | 490 | 10,3% | +4,6 p.p. |
| `recuperado` | 610 | 12,8% | +1,5 p.p. |

**O status da documentação replica.** Pronto contra em regularização dá
**3,0 p.p.** aqui e 4,3 p.p. na Cars2You — mesma direção, mesma ordem de
grandeza. É o único achado de texto que sobrevive à troca de base.

⚠️ **Termos com n ≈ 4.600 de 4.771 foram descartados da leitura.** `conta`,
`comprador`, `localizacao` aparecem em 97% das descrições; o "efeito" de
−10 p.p. que a tabela bruta mostra está medido contra as ~130 vendas restantes,
quase todas de **descrição vazia**. Isso mede "tem descrição", não o termo.

## Qualidade de dado

🔴 **O VMV na Dealers é um valor-sentinela.** `min_sale_price = 999000,00` em
**98,1% das vendas** (4.679 de 4.771). Apenas 66 valores distintos na amostra
inteira. A razão VMV/FIPE tem mediana **17,8×** — contra 0,71× na Cars2You.

**A coluna não é ruidosa, é inutilizada.** Qualquer regra de negócio que leia
VMV nesta base está lendo um placeholder. (Na Cars2You o VMV é real: mediana
0,71× e moda em 0,5–0,8×, o que sustenta a regra "FIPE × 0,75".)

| achado | medida |
|---|---|
| `whitelabel_id` constante | 1 nível (8). A Dealers é whitelabel única |
| `valor_molicar_anuncio` | **0,0% preenchida** (54,1% na Cars2You) |
| `valor_ref_vendedor` | **0,0% preenchida** (57,0% na Cars2You) |
| `cluster` | 3 níveis (22 na Cars2You) |
| FIPE do anúncio | 73,8% preenchida (85,6% na Cars2You) |
| descrição vazia | 69 vendas (1,4%) |

## ⚠️ A armadilha que quase entrou neste relatório

**Os dois analisadores do estudo da Cars2You usam controles diferentes:**

| script | controla por |
|---|---|
| `no-analisar.js` (roda dentro do n8n, gerou `drivers-51358.json`) | **`grupo`** (modelo) |
| `analisa-drivers.js` (roda local) | **`codigo_fipe`** |

O ranking publicado (comprador 41,6%, cluster 18,1%...) saiu do **primeiro**.
Rodar o segundo na Dealers e comparar com aquele número seria comparar dois
controles diferentes — e a diferença apareceria como se fosse achado.

Peguei porque na Dealers o `codigo_fipe` deu R²ctl = 0,0 (sinal de que ELE era
o controle) enquanto na Cars2You quem dava 0,0 era o `grupo`.

**Correção aplicada:** os dois lados foram rodados com o mesmo script e o mesmo
controle. A conferência é que o lado Cars2You reproduziu exatamente os números
publicados (41,6 / 18,1 / 18,1 / 13,1).

## Ressalvas

- **Regressão simples não separa causas.** Cada coluna foi testada sozinha.
- **`laudo` não existe na extração da Cars2You** — os 11,3% da Dealers não têm
  contraparte. Para comparar, a sonda 10 de lá precisa incluir a coluna.
- **A amostra se move durante o dia** — todo número é o retrato de uma execução.
- ⚠️ **Dado comercial real de outro tenant.** Repo privado.

## Como reproduzir

```bash
python automations/precificacao/roda-estudo.py
node automations/n8n-sdk/precificacao/analisa-dimensoes.js dados-dealers.json
node automations/n8n-sdk/precificacao/analisa-drivers.js analitico-dealers.json
```
