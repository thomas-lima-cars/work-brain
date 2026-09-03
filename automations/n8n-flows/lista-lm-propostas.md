# Lista de Estoque LM → Proposta do Lojista

> Automação nova (19/08/2026), ampliada em 20 e 21/08. Instância `cars2you.app.n8n.cloud`.
> **Sem segredos aqui** — só nomes e IDs de credencial.

## O que é

A LM manda quase diariamente para a operação uma planilha de estoque ativo. O ciclo é:

1. Caio manda o `.xlsx` para a IA de manhã.
2. `node automations/scripts/gerar-lista-lm.js "<planilha>.xlsx"` gera o HTML — um veículo por linha.
3. O HTML vai para o **SharePoint** (histórico) e é disparado por **e-mail e WhatsApp** como arquivo, igual ao padrão do Remanescentes IGA.
4. O lojista abre, clica em **Enviar proposta**, cai no formulário n8n **já com os dados do carro preenchidos**, digita só CNPJ + valor + WhatsApp.
5. O fluxo acha o vendedor responsável pela conta e avisa por e-mail + WhatsApp.

## O gerador do HTML

`automations/scripts/gerar-lista-lm.js` — Node puro, zero dependência. Descompacta o `.xlsx` com `unzip` e lê o XML na mão (o mesmo truque usado para inspecionar a planilha; não há `openpyxl`/`python` nesta máquina).

Saída: `lista_estoque_LM_<ddmmaaaa>.html`, autossuficiente (sem CDN, sem fonte externa) — funciona aberto como anexo de WhatsApp, offline. Layout de **lista contínua com divisórias** (não cartões soltos): linha de ~63px no desktop.

Quatro filtros combináveis, todos client-side: busca por placa/modelo/cidade, **tipo de veículo**, **UF** e **status do laudo**. Cada opção mostra a contagem.

🔑 **As opções dos filtros saem dos dados, não de uma lista fixa.** O tipo vem da coluna `Classif.` agregada em runtime e ordenada por volume; laudo e UF idem. Consequências:
- lista sem pesados **não mostra** a opção "Pesado" — opção com zero não é renderizada;
- se a LM começar a mandar `Moto`, ela **aparece sozinha** no filtro, sem tocar no código;
- combinação sem resultado mostra "Nenhum veículo encontrado", não quebra.

🛡️ **Trava de colunas.** `conferirColunas()` valida as 14 colunas usadas e **encerra com código 1** listando o que falta se a LM renomear ou remover alguma. É a lição do cap de 50 linhas do IGA aplicada aqui: melhor morrer barulhento do que publicar lista silenciosamente incompleta. Testado renomeando `Valor FIPE` — abortou como esperado.

🐛 **Duas armadilhas de CSS que já custaram bug — não repetir:**
1. O painel expandido usa o atributo `hidden`, mas `.detalhes{display:grid}` **vence o `[hidden]` do navegador** por especificidade: a lista abria com tudo expandido e a setinha sem efeito visível. `.detalhes[hidden]{display:none}` é obrigatória. Bônus: com ela o painel nasce fechado mesmo sem JavaScript.
2. Item de grid/flex tem `min-width:auto`, então o **min-content de um nome longo de pátio estourava a coluna** e a página ganhava 11px de rolagem horizontal no mobile. `.grafico{min-width:0}` e `.rot span{flex:1;min-width:0}` são obrigatórias. Sempre conferir `scrollWidth > clientWidth` a 375px antes de entregar.

🔒 **O gerador nunca sobrescreve arquivo** (20/08): lista do dia já existente vira `_v2`, `_v3`… A versão anterior pode já ter sido disparada.

🎨 **Identidade visual** (paleta aprovada pelo Tuunelis, tom executivo — o público inclui bancos): fundo `#f6f8fb`, capa em gradiente `#0f172a → #1e3a5f`, azul de ação `#2563eb`, hairline `#dbe4f0`, cartões raio 16–20px com sombra `0 8px 26px rgba(15,23,42,.06)`, títulos peso 800, micro-rótulos em caixa alta. Fonte Roboto com fallback de sistema — **sem requisição externa**, o arquivo segue autossuficiente.

⚠️ **Todo indicador declara a própria base.** Erro real pego pelo Caio em 20/08: o cartão dizia "100% com laudo/vistoria" enquanto o gráfico ao lado mostrava 67 sem laudo. Eram campos diferentes (`Link` em 123/123, `Status Laudo` em 56/123), mas juntos viravam contradição. Hoje o cartão é "laudo com resultado 46%" com a nota "56 de 123 · 100% têm link do laudo", e "valor de referência"/"preço médio" declaram que cobrem 116 dos 123.

**A data sai do nome do arquivo** (`... - 19.08.xlsx` → `19-08-2026`), com fallback para hoje. Ela vai no parâmetro `lista` de cada link de proposta, o que permite saber de qual lista do dia veio cada oferta.

### 🔗 Botão de proposta na plataforma (25/08)

O `Enviar proposta` deixou de apontar para o formulário do n8n e passa a abrir o **anúncio na plataforma**. Decisão da reunião de 25/08: o lojista loga uma vez, dá o lance dentro do sistema, a concorrência fica registrada e ele não digita CNPJ e WhatsApp a cada carro.

**Padrão da URL:** `cars2you.com.br/anuncio/veiculo/{marca}/{modelo}/{versão}/{uuid}` — tudo minúsculo, `encodeURIComponent` em cada trecho (espaço vira `%20`, **não** hífen), e o **uuid sem hífens**. Conferido caractere por caractere contra os quatro links de exemplo do Guilherme.

Marca, modelo e versão saem de `brands.name`, `models.name` e `versions.name` (por `vehicle.brand_id/model_id/version_id`); o uuid de `advertisements.uuid`. Sem um dos três trechos o link não é entregue — melhor sem botão que botão que leva a lugar nenhum.

🔴 **Ter link não é o mesmo que poder receber proposta.** Um carro em `Analise do comprador` tem anúncio, mas está travado numa negociação; um que voltou para `Sobra` tem o link do evento **já encerrado**. Nos dois casos o lojista clicaria e cairia num anúncio que não aceita lance. **Só entra na lista quem está `No ar`** (veículo `PUBLISHED`, anúncio `ACTIVE`). Foi um erro que passou na primeira implementação — o filtro estava em "tem link" em vez de "está no ar".

**Dois arquivos alimentam o gerador, de propósito:**

```bash
node automations/scripts/gerar-lista-lm.js "<planilha da LM>.xlsx" . --tipo=leve --cruzamento="<excel do fluxo>.xlsx"
```

A planilha da LM tem o que descreve o carro (km, ano, cor, pátio, cidade); o Excel do cruzamento tem o que a plataforma sabe (uuid, link, situação, feirão). Nenhum dos dois basta sozinho, e juntar tudo num arquivo só deixaria a lista de trabalho da Rai ilegível. Casam por placa, sem hífen e em caixa alta.

- Sem `--cruzamento` o comportamento é o antigo (botão no formulário do n8n) — nada quebra.
- `--incluir-sem-anuncio` mantém na lista quem não está no ar, e nesses o botão cai no formulário. O link de anúncio é **zerado** nesses casos, para não levar a evento encerrado.
- O corte nunca é silencioso: o gerador imprime quantos ficaram fora e **por qual motivo** (`267 sobra · 51 analise do comprador · 14 nova · 5 sem registro`).
- A intro do HTML muda sozinha quando o botão vai para a plataforma, avisando que o primeiro clique pede login. Surpresa no clique derruba proposta.

⚠️ **`vmv` saiu das colunas obrigatórias da lib** (a LM parou de mandar em 25/08). Quando falta, o gerador **herda o último VMV conhecido** do estado entre remessas (`automations/estado/estoque-lm.json`) e carimba `vmvOrigem`. Na remessa de 25/08: 595 herdados, 36 sem preço. Nunca derivar da FIPE.

### Decisões de exposição (Caio, 19/08)
- Mostra **cidade e UF**. **Não** mostra endereço do pátio nem telefone de contato.
- Mostra **placa completa** (diferente da `/sobra-evento`, que mascara — lá é leilão aberto, aqui é lista fechada para lojista).
- Carros **sem valor FIPE entram na lista** com "FIPE não informada".

### Sujeira conhecida da planilha da LM
| Problema | Como o gerador trata |
|---|---|
| **Coluna `Curva` corrompida** — em 84 de 123 linhas traz um ID de estoque (455882…455968) em vez de curva | **Ignorada por completo.** Vale cobrar a LM. |
| `Status Laudo` e `Chave` vazios em 67 de 123 | Sem selo / campo omitido no expandido |
| `Valor FIPE` vazio em 7 carros | "FIPE não informada" |
| `Ano/Modelo` ora `2024`, ora `24/24` | Se vier só um ano solto, tenta achar o par no `Modelo`; **não inventa par** — mostra o ano cru |
| `Modelo` repete o ano no fim | Removido para não duplicar na tela |
| Caixa alta e case inconsistente (`S/ chave reserva` × `S/ CHAVE RESERVA`) | Normalizado; conectivos em minúscula, siglas sem vogal (VJB, SGP, PG) mantidas em caixa alta |
| `#N/A` em UF, Nome Pátio e KM Laudo | Tratado como vazio |
| `Acessório` 100% vazia, `Contato` com 1 linha de 123 | Não usadas |

## 🟦 Proposta LM (Formulário) — `BvqnJZoex3Y7ekL6`

Projeto pessoal do Caio. **Publicado em 19/08/2026**, versão ativa `f1dfd200-7efc-4ff5-a2ab-00b1c6fd7cb4`.

**URL do formulário:** `https://cars2you.app.n8n.cloud/form/proposta-lm`

### Como o pré-preenchimento funciona (validado ao vivo)
O Form Trigger tem 7 campos do tipo **`hiddenField`**. O schema do nó diz: *"Input value can be set here or will be passed as a query parameter via Field Name if no value is set"*. Ou seja, basta montar a query string com os nomes dos campos:

```
/form/proposta-lm?placa=SEI3C18&modelo=Kwid+1.0+Zen&ano=23%2F24&km=32181&fipe=52177&uf=PR&lista=19-08-2026
```

✅ **Confirmado abrindo a URL real:** os 7 inputs `type="hidden"` chegaram com os valores certos. Campo oculto não é editável na tela, então o lojista não altera os dados do carro.

✅ **Campo visível também aceita pré-preenchimento por query param** — testado ao vivo, apesar de o schema documentar isso só para `hiddenField`. É assim que o lojista **vê** qual carro está propondo: existe um campo de texto `veiculo`, rótulo "Veículo", que o HTML preenche com `Modelo · PLACA · ano · km · FIPE R$ x`.

⚠️ Como o n8n não tem campo somente-leitura, o `veiculo` é neutralizado por CSS via `options.customCss`: `#field-7{...;pointer-events:none}`. **O id é posicional** (`field-0`…`field-10`, na ordem em que os campos estão declarados). Se alguém inserir ou reordenar campos, esse seletor passa a mirar o campo errado — conferir depois de qualquer mexida na lista de campos. Os dados que valem são os ocultos, então uma edição no `veiculo` não contamina nada.

### O campo do veículo é `textarea`, não `text` (20/08)
Em campo de uma linha o nome do modelo era **cortado** — "T-Cross 1.0 200 TSI Comfortline Auto · GIT8I45 · 23/23 · 17…". Duas mudanças resolveram:
- tipo `textarea`, que quebra linha;
- o HTML manda o texto em **duas linhas** (`%0A` na query string): modelo em cima, `Placa X · ano · km · FIPE` embaixo.

Altura dimensionada pelo **pior caso real da base**: `Q8 e-tron Sportback 114 KWh Performance Black Quattro`, 53 caracteres por linha, 4 linhas visuais → `min-height:132px`. Medido: 130px de conteúdo, sem corte. Ao mudar a fonte ou a largura do cartão, **remedir**.

## 🐛 O WhatsApp falhava em silêncio (20/08) — resolvido

Caio testou com CNPJ não cadastrado: execução `success`, e-mail entregue, **WhatsApp nunca saiu**. A saída do nó dizia:

```
{"error":"The value in the \"JSON Body\" field is not valid JSON"}
```

**Causa:** o `jsonBody` era montado à mão e o alerta de CNPJ não cadastrado usava `\n` **dentro de uma expressão `{{ }}`**. Dentro da expressão, `'\n'` é uma quebra de linha real — e quebra de linha crua dentro de string JSON é JSON inválido. Fora da expressão o `\n` sobrevive como escape e funciona; foi por isso que a versão anterior (sem o alerta no começo) passava.

**Agravante:** `onError: continueRegularOutput` transformou a falha em `success`. É o mesmo padrão já registrado no IGA — falha que vira silêncio.

**Correção estrutural, não remendo:** a mensagem passou a ser montada no Code node `Definir Destinatario`, num array com `join('\n')` (quebras reais), e o nó HTTP usa **`specifyBody: 'keypair'`** com os pares `number` e `text`. O n8n serializa o JSON. **Nunca mais montar JSON à mão neste fluxo** — a classe do bug desaparece.

Validado na execução `45144`: mensagem entregue em `5511947619656@s.whatsapp.net`, status `PENDING`, com alerta de CNPJ não cadastrado, valor inicial e aviso de proposta abaixo do piso.

⚠️ **Esse teste foi um WhatsApp real na linha da Thais.** Para testar o caminho de fallback sem incomodar ninguém, trocar `CELULAR_FALLBACK` por um número de teste antes de disparar.

## Campos do formulário — índices e armadilhas

Ordem atual (o `#field-N` é **posicional**, e o customCss depende disso):

| id | campo | papel |
|---|---|---|
| `field-0`…`field-7` | placa, modelo, ano, km, fipe, uf, lista, **inicial** | ocultos, vindos da query string |
| `field-8` | `veiculo` | nome do modelo, textarea, 17px peso 800 |
| `field-9` | `detalhe` | placa/ano/km/UF + FIPE, textarea, 13px discreto, **rótulo oculto** |
| `field-10` | `valor_inicial` | destaque verde, 21px peso 800 |
| `field-11` | `aviso_piso` | campo `html` com o aviso do piso |
| `field-12`…`field-15` | cnpj, valor, whatsapp, obs | preenchidos pelo lojista |

**Por que o veículo virou dois campos:** não há como estilizar parte de um `textarea`. Separando nome e detalhe, cada um recebe seu peso visual, e os dois painéis são emendados por CSS (borda de baixo do primeiro e de cima do segundo removidas, raios complementares).

🐛 **O campo `html` perde `class` e `style`.** O n8n sanitiza: de `<div class="aviso-piso" style="...">` sobra `<div>`. O aviso é estilizado pelo customCss via posição do grupo (`.form-group:nth-of-type(4)>div`, com `:has(#field-11)` como reforço).

🐛 **Cada `.form-group` tem um `<p class="error-hidden">` que ocupa 31px mesmo oculto.** Era a folga de 34px que impedia os painéis de se emendarem. Suprimido **só nos três campos de leitura** — nos campos que o lojista preenche o `<p>` fica, senão a mensagem de erro não teria onde aparecer.

## Aparência do formulário — o que dá para editar

O n8n expõe pouco, mas o `customCss` alcança quase tudo, porque a página tem ganchos estáveis: `.container`, `form.card#n8n-form`, `.form-header` + `h1`, `.form-group`, `.form-label`, `.form-input`, `#field-N`, `#submit-btn`, `.card#submitted-form`.

| Editável | Como |
|---|---|
| Fundo, tipografia, cores, raios, sombras | `options.customCss` |
| Título e descrição | `formTitle`, `formDescription` (aceita HTML, **não** aceita `script`/`style`/`input`) |
| Eyebrow "CARS2YOU · ESTOQUE LM" | `.form-header::before{content:...}` — dá para **inserir texto** via CSS |
| Rótulos, placeholders, obrigatoriedade | parâmetros dos campos |
| Texto do botão | `options.buttonLabel` |
| Página de conclusão | nó `Confirmacao da Proposta` (HTML livre) |
| Marca d'água do n8n | `appendAttribution: false` (já desligado) |

**Não editável:** a estrutura do DOM, a ordem dos elementos dentro de `.form-group`, o `<title>` da aba, o favicon — e **máscara de digitação**.

### Máscaras: não é possível no formulário do n8n
Máscara exige JavaScript no cliente, e o n8n não dá essa brecha: `customCss` só aceita CSS, `formDescription` e o campo `html` **rejeitam `<script>`, `<style>` e `<input>`**, e não há parâmetro de `pattern`/`inputmode`. Não há caminho por dentro.

O que existe hoje como mitigação: o `Normalizar Proposta` **aceita qualquer formato** — `48.000,00`, `48000`, `R$ 48.000` e `44.555.666/7777-88` ou `44555666777788` todos são normalizados. O placeholder mostra o formato esperado. Ou seja, digitação livre não quebra o fluxo; só não guia o lojista enquanto ele digita.

**Se máscara passar a ser requisito**, o caminho é trocar o formulário do n8n por uma **página HTML própria** (no SharePoint ou servida por um Webhook do n8n) que faça POST no webhook. Aí se ganha máscara, validação de piso no cliente, campos condicionais e a mesma identidade visual da lista. É um projeto à parte, não um ajuste.

### Condicionais: sim, mas entre páginas
- **Dentro de uma página:** não. Não há mostrar/esconder campo conforme resposta.
- **Entre páginas:** sim. Encadeando nós `n8n Form` (operation `page`) com `IF`/`Switch` no meio, cada página seguinte depende da resposta anterior.
- **Campos gerados dinamicamente:** sim, nas páginas seguintes — o nó `n8n Form` aceita `defineForm: 'json'` com `jsonOutput` por expressão, então a lista de campos pode ser calculada em runtime.
- **Na primeira página (o Form Trigger):** não, porque ele não tem entrada — nada para avaliar. É a mesma razão pela qual os dados do veículo entram por query string.

O tema aplicado troca o coral padrão do n8n (`rgb(255,109,90)`) pelo azul institucional `#2563eb`, com cartão de raio 20px e sombra suave — mesma paleta do HTML da lista.

⚠️ **O output do Form Trigger usa o `fieldLabel` como chave** nos campos visíveis (`$json['CNPJ da loja']`), e o `fieldName` nos ocultos. O nó `Normalizar Proposta` lê com fallback nos dois nomes justamente por isso — **não trocar os labels sem ajustar o código**.

### Fluxo
`Formulario Proposta LM` → `Normalizar Proposta` → `Buscar Vendedor da Conta` → `Buscar Contato do Consultor` → `Definir Destinatario` → 5 ramos paralelos:
- **[a]** `Gravar Proposta` (Data Table `Propostas LM`)
- **[b]** `Enviar E-mail ao Vendedor` (Outlook)
- **[c]** `Expandir Copias WhatsApp` → `Vendedor tem WhatsApp?` → `Enviar WhatsApp ao Vendedor` (Evolution)
- **[d]** `Confirmacao da Proposta` (página de retorno para o lojista, com placa e valor dinâmicos)
- **[e]** `Montar Linha da Planilha` → `Gravar na Planilha` (planilha de controle no SharePoint — 21/08)

A confirmação usa `respondWith: 'showText'`, que **aceita HTML de verdade** — é uma página com cartão, resumo do veículo e o valor destacado. ⚠️ O n8n **injeta o conteúdo dentro do `body` da página dele**, então `<!doctype>`/`<html>`/`<head>` são achatados; o `<style>` continua valendo (por isso funciona). Não vale a pena tentar servir um documento "limpo".

`Normalizar Proposta` limpa o CNPJ para 14 dígitos, lê o valor digitado em qualquer formato (ver seção própria abaixo), calcula o **% da FIPE** que a proposta representa, e monta a data como **número de série do Excel** para a planilha. Não aceita "30 mil" — só formato numérico.

### Data Tables (projeto **Cars2You** `yAo7DiqDfz6XfXyv` — migradas em 21/08)

O roteamento é em **duas etapas de propósito**: a carteira tem centenas de CNPJs, mas só um punhado de consultoras. Guardar e-mail e celular junto do CNPJ obrigaria a editar centenas de linhas a cada troca de contato.

| Tabela | ID | Antes se chamava |
|---|---|---|
| **Lojistas Cadastrados** | `NRnV3OFmPG0Nxlkd` | Vendedores LM |
| **Consultores Cars2You** | `2XMBeQUMouambE5o` | Consultores LM |
| **Propostas LM** | `GHMMLDjmzfsAlYmf` | (mesmo nome, tabela nova) |
| **Estoque LM** | `gOD5ufpvkDyKmg0n` | (nova, 21/08) |

- **Lojistas Cadastrados** · `CNPJ, CNPJ_Formatado, Razao_Social, Vendedor, Telefone, Email` — **597 contas** da "Carteira comercial atualizada 19.08".
- **Consultores Cars2You** · `Vendedor, Email, Celular` — 7 linhas, editadas na mão. É aqui que se mexe em contato de consultora.
- **Propostas LM** · histórico bruto de toda proposta recebida, o que dá auditoria.
- **Estoque LM** · uma linha por placa do estoque, alimentada pelo fluxo do estoque (seção abaixo).

🔴 **O CNPJ é guardado em DÍGITOS na coluna `CNPJ`.** A `CNPJ_Formatado` existe só para leitura humana.
**Esse foi o bug de 21/08:** a tabela antiga guardava `52.284.109/0001-00` e o fluxo buscava `52284109000100` — nunca casava, então **todo CNPJ caía como "não cadastrado"**. Os dois CNPJs que o Caio testou (`52284109000100` TOP VEICULOS e `30709049000189` GB VEICULOS, as duas contas da Thais) **estavam** na carteira. Ao recarregar, sempre normalizar para dígitos.

🔴 **O nome da consultora é normalizado para casar entre as duas tabelas.** A carteira vem em caixa alta (`THAIS`) e a tabela de consultores tem `Thais Martins`. Se divergir, `Buscar Contato do Consultor` não acha e o WhatsApp não sai.

⚠️ **As tabelas antigas do projeto pessoal continuam lá, intactas.** Não foram apagadas de propósito — só depois de o Caio validar as novas.

### A carga da carteira (como foi feita, e como repetir)
Colar 597 linhas numa chamada de ferramenta é caro e frágil. O caminho usado: um workflow descartável **`TEMP Carga Vendedores LM`** (`wKDSmA8OcZ76TPN5`, hoje **arquivado**) com Webhook → Code → Data table insert, alimentado por `curl --data-binary @rows-final.json`. 51 KB, 597 linhas, 3,5s, uma chamada. **Repetir esse padrão** quando a carteira for atualizada — desarquivar, publicar, POST, arquivar de novo.

⚠️ O insert **não faz upsert**. Recarregar a carteira inteira por cima duplica tudo. Para atualizar: limpar a tabela antes (`resource: table, operation: clear`) ou carregar só o delta.

### Qualidade da carteira comercial (recarregada em 21/08)
617 linhas com CNPJ → **597 CNPJs únicos roteáveis**. O que ficou de fora e o que foi decidido:
- **4 CNPJs inválidos:** `308.813.068-43` (é **CPF**, DOUGLAS FERRAZ PONGELUPPI), `542454.08000151999` (PIRACICABA VEICULOS) e `8164.4400010899999` (Duda Veículos) com dígitos sobrando, `4201622000139` (ROBSON VEICULOS) com 13 dígitos.
- **11 CNPJs em duas consultoras.** Regra aplicada: **mantida a primeira ocorrência**. Precisam de decisão do Caio: `28372017000199` Auto Fácil (Gabriela × Thais), `28972331000102` LM Veículos (Camila × Thais), `46286615000127` Nova HD (Gabriela × Thais), `20104304000106` Energytech (Isabella × Camila), `08917933000150` Radar Veículos (Isabella × Camila), `07033758000197` Lobcar (Thais × Camila), `55769009000153` Vitorioso (Gabriela × Camila), `30886864000113` Master Auto (Isabella × Camila), `13181780000165` No Risk (Isabella × Camila), `63445883000163` Silva Comércio (Larissa × Camila), `30254014000100` Kick (Larissa × Camila).
- Distribuição final: Gabriela 210 · Isabella 155 · Thais Martins 93 · Larissa 84 · Camila 55.
- **Patricia não tem nenhum CNPJ** — está na `Consultores LM` esperando a carteira dela.
- ⚠️ A coluna `EMAIL`/`TELEFONE` da carteira é do **lojista**, não da consultora. Não confundir.
### Três desfechos possíveis do roteamento
`Definir Destinatario` decide entre três casos e grava o motivo em `motivo_fallback`:

| Situação | E-mail vai para | WhatsApp vai para |
|---|---|---|
| CNPJ na carteira **e** consultora com e-mail cadastrado | a consultora | a consultora |
| CNPJ na carteira, consultora **sem e-mail** cadastrado | Thais + Donizeti, com aviso de qual consultora é | **a consultora** (ela é avisada normalmente) |
| CNPJ **fora** da carteira | Thais + Donizeti, com aviso | Thais |

Constantes no nó: `EMAIL_FALLBACK = 'thais.martins@cars2you.com.br,donizeti.junior@cars2you.com.br'` e `CELULAR_FALLBACK = '<celular da Thais — ver no nó>'` (redigido: convenção do brain é não guardar telefone).

**O alerta de CNPJ não cadastrado é explícito (20/08):** o assunto do e-mail vem prefixado com `[CNPJ NAO CADASTRADO]` e a mensagem de WhatsApp **abre** com `*ATENCAO: CNPJ NAO CADASTRADO*` e a instrução de encaminhar para quem atende a conta. Antes o aviso existia, mas ficava no meio do corpo e passava batido. Validado na execução `45111`.

O caso do meio existe porque hoje **nenhuma consultora tem e-mail cadastrado** — só Thais e Caio. Preenchendo a coluna `Email` da `Consultores LM`, o desfecho vira o primeiro sozinho, sem tocar no fluxo.

### Credenciais
| Nó | Credencial |
|---|---|
| `Enviar E-mail ao Vendedor` | Outlook `Microsoft Outlook Power BI/Automações` (`G3MiTRT9jTVPx6Wn`) — anexada pela API |
| `Enviar WhatsApp ao Vendedor` | Evolution `Evolution API Key` (`A46wz7IuxLPWqy5Z`, httpHeaderAuth) — 🔴 **anexar na interface** |

⚠️ Mesma limitação já documentada no Remanescentes IGA: **o MCP do n8n não anexa credencial genérica de HTTP** (`httpHeaderAuth`). O retorno da criação confirmou: *"HTTP Request nodes (Enviar WhatsApp ao Vendedor) were skipped during credential auto-assignment"*.

## Teste de 19/08 (execução `44919`)

Rodado com **e-mail e WhatsApp desabilitados** (`setNodeDisabled`), o padrão já usado no IGA para testar entrega sem enviar nada. Depois reabilitados e republicado — versão ativa `31172888-41e0-4ca1-b185-b5452b1f2c23`.

Proposta de R$ 48.500,00 no Kwid `SEI3C18` com o CNPJ de teste. Confirmado:
- busca achou a linha e devolveu **Caio Ledesma**;
- celular normalizado de `11976288713` para **`5511976288713`** (o fluxo prefixa 55 quando vem com até 11 dígitos);
- **93% da FIPE** calculado;
- linha gravada em `Propostas LM` (id 2);
- página de confirmação renderizada com estilo.

🧹 **Limpar depois:** as linhas de teste em `Propostas LM` (id 1 do teste do Caio às 20:03 e id 2 deste).

## Teste do roteamento em duas etapas (19/08, execuções `44951` e `44952`)

Também com os envios desligados. Dois caminhos exercitados:
- **CNPJ real da carteira** (`48730744000198`, 467 Multimarcas) → identificou **Isabella**, WhatsApp para `5511914714185`, e-mail para Thais+Donizeti com `motivo_fallback = email-nao-cadastrado`. Exatamente o desenho.
- **CNPJ inexistente** (`99999999999999`) → `vendedor = nao identificado`, e-mail **e** WhatsApp para a Thais, `motivo_fallback = cnpj-nao-encontrado`.

## SharePoint

Site **N8N** (`automakers.sharepoint.com,200f8a58-914f-456b-a5c2-f6272d2a1de3,d2184e85-fcf9-4d64-a03a-abaac5834f9d`), pasta **`Lista LM - Disparo HTML`** → `folderId 01WJTTCQV6DXY7OZB6HRCL3QZJ72G7CYAX`. Acesso confirmado em 19/08 com a credencial `Microsoft SharePoint Conta PowerBI/Automações` (`AOTm9J6pFcF0DS6g`), a mesma dos fluxos IGA.

> 📌 Ao listar as pastas apareceu que **"Sobras de Evento IGA" já foi renomeada para "Remanescentes de Evento IGA"** — resolve uma pendência antiga do doc do IGA. O `folderId` segue o mesmo (`01WJTTCQRUQ746MRWTVBF3K3OHKE7Y5BY4`), como esperado.

## 🟪 Lista LM (HTML) — `8YnGmVUvl6BmrKKb` (25/08)

Gera a lista de veículos lendo a **Data Table** para descrever o carro e o **banco** para saber o estado dele. Formulário: `cars2you.app.n8n.cloud/form/gerar-lista-lm` (escolhe Leve ou Pesado e a data).

`Gerar Lista` → `Config da Lista` → `Ler Estoque LM` → `Montar HTML` → `Virar Arquivo` → `Subir no SharePoint` → `Enviar por E-mail` → `Enviar por WhatsApp`.

**Quem dispara e quando:** o time de montagem, **depois de subir os carros no evento do dia** (decisão do Caio, 25/08). Não é agendado, e o motivo está abaixo.

🔴 **A lista tem uma janela, e ela é estreita.** O estoque no ar muda ao longo do dia: com o evento montado quase tudo está `PUBLISHED`; quando o evento **encerra às 15h**, os carros voltam para `AVAILABLE` ou entram em análise. Medido em 25/08 com a mesma base:

| | Manhã | 19h |
|---|---|---|
| No ar | 555 | **45** |
| Sobra | 45 | **516** |
| Em análise do vendedor | 1 | **48** |

Gerar às 19h produz uma lista de ~45 carros — tecnicamente correta e comercialmente inútil. Por isso o gatilho é manual, atrelado ao fim da montagem.

⚠️ **O fluxo avisa, não trava,** quando menos de 50% dos ativos do tipo estão no ar. Travar bloquearia um dia legítimo de pouco volume; o aviso vai no corpo do e-mail. Se a lista sair vazia, aí sim ele **falha** com o diagnóstico (`Nenhum Leve no ar com link de anúncio`) em vez de mandar arquivo vazio.

### O gerador é um só, extraído para dois destinos

O HTML tem **uma fonte de verdade**: `automations/scripts/gerar-lista-lm.js`. O script `automations/scripts/extrair-nucleo-lista-lm.js` remove dele tudo que toca disco (leitura do `.xlsx`, arquivo de estado, escrita, logo) e escreve `automations/n8n-code/lista-lm-html.js` — o corpo do Code node.

**Nunca editar `n8n-code/lista-lm-html.js` à mão.** Editar o gerador e reextrair; senão as duas versões do HTML divergem e ninguém descobre qual está certa.

A extração é por **remoção**, não por seleção de trechos: função nova pura vem junto sozinha, e faixas de linha não quebram a cada edição. O extrator confere no fim se sobrou `fs`, `path`, `require` ou `process.exit`.

O que muda no Code node em relação ao local:
- entrada é a Data Table (some o `unzip` e o `fs`);
- dias na lista, remessas e VMV anterior vêm da tabela, que já é a memória entre remessas — **não recalcular**, senão haveria dois números para a mesma coisa;
- o logo vai embutido em base64 (4,8 KB), porque não há disco.

🔴 **O Code node é grande demais para a API do n8n** (55.700 caracteres). Ele entra **pela interface, colando o arquivo**, uma vez. Conferir o SHA-256 depois de colar — foi assim que se garantiu a integridade do `Ajustes do Relatório` no IGA.

⚠️ **Duas credenciais têm que ser vinculadas na interface:** SharePoint no `Subir no SharePoint` e Evolution no `Enviar por WhatsApp`. O MCP do n8n não anexa credencial genérica de HTTP nem `httpHeaderAuth`.

**SharePoint:** pasta `Documentos > Lista LM - Excel Cruzamento Base`, endereçada **por nome** via `automakers.sharepoint.com/sites/N8N/_api/v2.0/drive/root:/<pasta>/<arquivo>:/content` — dispensa descobrir `folderId`. `graph.microsoft.com` dá 401 com essa credencial.

**Destinatário:** só o Caio no começo (e-mail e WhatsApp), a pedido dele.

**WhatsApp:** Evolution em `52.206.207.64:8080`, instância `Cars2You Comercial`, credencial `Evolution API Key`. **Não existe domínio** `evolution.cars2you.com.br` — chutar isso custou uma execução com `ENOTFOUND`.

### Armadilhas pagas na montagem deste fluxo (25/08)

🔴 **`Convert to File` em modo `toBinary` espera base64 na propriedade de origem.** Passando o HTML em texto puro ele gerou um arquivo de **14 bytes** — e com `status: success`, sem erro nenhum. O e-mail saiu com anexo quebrado. Trocado por um Code node que monta o binário com `Buffer.from(html).toString('base64')`, **com conferência de tamanho mínimo** (abaixo de 20 KB o fluxo falha). Arquivo minúsculo é sintoma de conversão que comeu o conteúdo, e é melhor falhar do que subir lista vazia.

🔴 **Nó HTTP consome o binário e devolve a resposta da API.** O e-mail depois do SharePoint não achava o anexo (`expects binary file 'data'`). Quando dois nós precisam do mesmo arquivo, **ramificar** a partir de quem o produziu — não encadear.

🔑 **O Form Trigger ACEITA POST por `curl`, desde que seja `multipart/form-data`.** A nota antiga deste doc dizia que o endpoint recusava (401) — estava errada, era o content-type. Com `-F` funciona, e as chaves são os **`fieldLabel`**, não os `fieldName`:

```bash
curl -X POST "https://cars2you.app.n8n.cloud/form/gerar-lista-lm" -F "Tipo=Leve" -F "Data da lista=25/08/2026"
```

Isso vale para qualquer formulário da instância, inclusive os de upload (`-F "Planilha da LM=@arquivo.xlsx"`) — dá para testar fluxo de formulário sem depender de alguém abrir o navegador.

⚠️ **`execute_workflow` do MCP não serve para Form Trigger** com `responseMode: onReceived`: a execução fica pendurada em `running` e morre por timeout depois de 5 min, sem processar nada.

🔴 **O `montarHtml` lê nomes exatos do contexto:** `{ etiquetaLista, dataTitulo, rotuloTipo, resumoTipos, movimento }`. Passar nome diferente **não dá erro** — chega `undefined` e a peça desaparece calada. Foi assim que o selo "novo hoje" e o rótulo do tipo sumiram do primeiro HTML gerado no n8n.

### O selo "novo hoje" não funciona com o dado atual

O selo existe e funciona (provado com dado sintético: 9 selos). Mas com o dado real ele quase nunca aparece, e o motivo é estrutural:

- quem é **novo na base da LM** ainda não está no ar (o time de montagem precisa cadastrar antes);
- quem **está no ar** já estava na base antes, então não é novo.

A Data Table guarda a primeira aparição **na base da LM** (`Primeira_Vez`), não na **lista disparada** — e é a segunda que interessa ao lojista ("menos de 24 h no ar"). Para o selo voltar a ter sentido, falta uma coluna `Primeira_Lista`, gravada pelo próprio fluxo da lista na primeira vez que a placa sai num disparo. **Pendente de decisão do Caio.**

⚠️ **O contador `Remessas` da tabela não é confiável** — foi subcontado pelas gravações parciais antigas. Por isso "novo" usa `Primeira_Vez === Ultima_Vez`, não `Remessas <= 1`.

## 🟩 Estoque LM (Planilha → Data Table) — `noemX4AA7FFxafYZ` (21/08)

Formulário: `cars2you.app.n8n.cloud/form/estoque-lm`. Sobe o `.xlsx` da LM; data da remessa é opcional (vazio = hoje).

`Subir Planilha LM` → `Extrair Planilha` → `Ler Estoque LM` → `Comparar Remessas` → `Gravar Estoque LM` (upsert por placa) → `Resumir Remessa` → `Enviar Resumo por E-mail`.

Guarda por placa: primeira e última aparição, dias no estoque, contagem de remessas, VMV atual e anterior (queda de preço), FIPE, status do laudo, curva e `Ativo`.

- **Idempotente:** subir a mesma remessa duas vezes não infla contagem nem mexe na primeira aparição.
- **Placa que não vem na remessa vira `Ativo = false`** — é o proxy de venda.
- 🔴 **Chassi não entra.** A tabela não tem o campo e não pode passar a ter.
- `Ler Estoque LM` tem `executeOnce` — sem isso rodaria 750 vezes.

🔴 **Duas armadilhas que fizeram o fluxo "dar sucesso" sem gravar nada:**
1. **Nó que devolve zero itens faz o n8n pular o resto da cadeia.** Com a tabela vazia na primeira carga, `Ler Estoque LM` devolvia `[[]]` e o `Comparar Remessas` nunca rodava — execuções `45287` e `45295`, ambas marcadas **sucesso**. Corrigido com `alwaysOutputData`.
2. **`update_workflow` mexe no RASCUNHO.** A correção acima ficou dois testes sem efeito porque faltou `publish_workflow` — produção seguia na versão antiga. Sempre conferir `versionId === activeVersionId`.

⚠️ O formulário usa `responseMode: 'onReceived'`: o upsert de ~750 linhas leva tempo e com `lastNode` o navegador ficava pendurado.

⚠️ O endpoint público do formulário **recusa POST via curl** (401) — não dá para testar upload por linha de comando, a submissão tem que sair do navegador. A carga inicial (748 linhas: 639 leves + 109 pesados) foi feita por webhook descartável, em 10,7s.

### Cruzamento com a plataforma (25/08)

Depois do upsert o fluxo consulta o banco `cars2you_production` pelo servidor MCP e classifica cada placa pela **ação que ela gera para o time de montagem**.

**Anunciante LM Transportes = `shops.id` 9830.** A placa no banco tem hífen (`BDB-1D56`), na planilha não — compara-se sempre por `REPLACE(plate,'-','')`.

#### 🔑 Os três enums oficiais (Confluence › Sistema de vendas)

`vehicles.situation` — página [Veículos (Situações)](https://cars2you.atlassian.net/wiki/spaces/sv/pages/385122325):

| | | | | |
|---|---|---|---|---|
| 1 `NOT_AVAILABLE` | 2 `AVAILABLE` | 3 `PUBLISHED` | 4 `IN_NEGOTIATION` | 5 `IN_PAYMENT_PROCESS` |
| 6 `AWAITING_SCHEDULING` | 7 `AWAITING_SCHEDULING_CONFIRMATION` | 8 `AWAITING_WITHDRAWAL` | 9 `FINISHED` | 10 `UNDER_EVALUATION` |

`advertisement_negotiations.status` e a correspondência com a situação do veículo — página [Relação Veículo × Anúncio](https://cars2you.atlassian.net/wiki/spaces/sv/pages/784760833) (criada pelo Guilherme em 25/08):

| Veículo | Anúncio |
|---|---|
| 3 `PUBLISHED` | 1 `ACTIVE` · 8 `SUSPENDED` |
| 4 `IN_NEGOTIATION` | **9 `IN_CUSTOMER_ANALYSIS`** · **13 `IN_ANALYSIS_SELLER`** |
| 2 `AVAILABLE` / 1 `NOT_AVAILABLE` | 10 `CANCELLED` · 11 `NO_OFFERS` · 14 `I_DONT_ACCEPT_STORES` · 15 `I_DONT_ACCEPT_BUYER` · 18 `SALE_CANCELLED` |
| 5 `IN_PAYMENT_PROCESS` | 2 `AWAITING_PAYMENT` · 3 `AWAITING_PAYMENT_CONFIRMATION` |
| 6/7/8/9 | 7 `SOLD` |

`advertisement_negotiations.situation_counterproposal` — página [Contraproposta (Situações)](https://cars2you.atlassian.net/wiki/spaces/sv/pages/514293761): 1 enviada pelo vendedor · 2 enviada pelo comprador · 3 aceita pelo vendedor · 4 aceita pelo comprador · 5 negada pelo vendedor · 6 negada pelo comprador.

#### A taxonomia é a da operação, não a do banco

| Desfecho | Regra | Ação |
|---|---|---|
| **Nova** | nenhum registro fora de `NOT_AVAILABLE` | cadastrar |
| **Sobra** | `AVAILABLE` | subir no próximo evento |
| **No ar** | `PUBLISHED` (+ nome do feirão) | nada |
| **Análise do comprador** | `IN_NEGOTIATION` + anúncio 9 | espera o prazo automático |
| **Análise do vendedor** | `IN_NEGOTIATION` + anúncio 13 | cobrar o Alex |
| **Em pagamento / entrega / avaliação** | 5 · 6,7,8 · 10 | não tocar |
| **Saiu da remessa** | estava na tabela e nao veio na remessa | nada — grava `Ativo=false` e some da lista |

🔴 **Não juntar `AVAILABLE` com `PUBLISHED`.** Foi o erro do primeiro desenho: os dois viravam "Sobra", e o Excel reportava **599 sobras** quando o trabalho real da Rai era **45**. Para a operação são estados opostos — publicado não dá trabalho nenhum, disponível é justamente o que falta subir.

🔴 **`IN_NEGOTIATION` tem que ser dividido pelo status do anúncio.** Análise do comprador destrava sozinha pelo prazo automático (48h, indo para 24h); análise do vendedor só sai cobrando a LM. Ação diferente, linha diferente.

⚠️ **Quando há mais de um veículo com a mesma placa**, vale o mais vivo, nesta ordem: `3, 2, 4, 5, 6, 7, 8, 10, 9, 1`. Publicado antes de disponível — se já está no ar, não há o que subir.

⚠️ **`NOT_AVAILABLE` não conta como "existe"**: veículo baixado precisa ser recadastrado, então para o time de montagem é trabalho novo igual a placa inédita.

#### Gabarito: o batimento manual da Rai (25/08)

A Rai fez o cruzamento na mão e deixou o resultado na coluna `Categoria` da própria planilha (`Base LM 25.08.2026.xlsx`), com o `vehicle_id` na coluna `id`. **É o gabarito para conferir qualquer mudança na regra.**

| Categoria dela | n | Equivale a |
|---|---|---|
| 4 feirões (Leves 262 · Utilitários 152 · Pesados 76 · Avariados 65) | **555** | `PUBLISHED` |
| Sobra | **45** | `AVAILABLE` |
| Em Analise do Comprador | **25** | `IN_NEGOTIATION` + anúncio 9 |
| Em Analise do Vendedor | **1** | `IN_NEGOTIATION` + anúncio 13 |
| nova | **5** | não existe no 9830 |
| | **631** | |

Conferido contra o banco ~1h depois: `IN_NEGOTIATION` = 26 (=25+1) ✅ e 5 placas não encontradas ✅ — exatos. `PUBLISHED` deu 558 (+3) e `AVAILABLE` 41 (−4) porque **ela já tinha começado a subir as sobras**.

⚠️ **O estado do banco se move durante o dia.** Os números valem para o instante da consulta; o e-mail diz isso explicitamente.

📌 **No e-mail dela estava escrito "4 novas", mas ela categorizou 5.** As 5 batem com o banco.

💡 **Sujeira de coluna é indício de placa nova.** As 5 novas de 25/08 são exatamente as linhas onde o saneador desfez troca entre `Status Laudo` e `Vistoriadora` — linha nova a LM digita na mão, e é aí que a coluna sai do lugar.

### E-mail de fechamento da remessa (24/08)

Depois do upsert o fluxo manda um e-mail com o que mudou. Versão ativa `017d776e-394d-4134-9b2a-d34c82936fc0`.

**Assunto:** `Estoque LM DD/MM — N ativos · N entraram · N sairam`.

**Corpo:** capa com a data da remessa e contra qual remessa a comparação foi feita · 4 cartões (ativos, entraram, saíram, mudaram de preço) · composição do ativo (classificação, faixas de tempo na lista, UF, VMV somado) · pontos de atenção · e três tabelas: **saíram** (placa, modelo, UF, dias na lista, VMV), **entraram** (com % da FIPE) e **mudança de preço** (antes, agora, variação em R$ e %).

🔑 **O `Comparar Remessas` carimba `_evento` (`novo`/`permanece`/`saiu`), `_vmv_delta`, `_remessa` e `_remessa_anterior` em cada item.** Esses campos **não chegam à tabela** porque o `Gravar Estoque LM` usa `mappingMode: defineBelow` — só as 16 colunas listadas lá são gravadas. É o que permite o resumo sem uma segunda leitura da Data Table.

🔴 **O resumo roda DEPOIS do `Gravar`, não em paralelo.** Assim o e-mail só sai se o upsert passou, e o número de linhas gravadas vai no cabeçalho como prova. O `Gravar Estoque LM` ganhou `alwaysOutputData` para o e-mail não ser engolido caso o upsert devolva vazio — a armadilha de "nó com zero itens pula a cadeia" que já custou dois testes cegos nesta frente.

🔴 **O nó de e-mail não tem `onError: continueRegularOutput`, de propósito.** Se o envio falhar, a execução tem que falhar. É o oposto do padrão que transformou falha em silêncio no IGA.

- **Destinatário:** constante `DESTINATARIOS` no Code node `Resumir Remessa`. Hoje só o Caio — ampliar é trocar uma linha.
- **Corte:** `CORTE = 60` linhas por tabela; o excedente é **declarado** no rodapé da tabela ("Mostrando 60 de 100 — os outros 40 estão na tabela Estoque LM"), nunca omitido em silêncio.
- ⚠️ **"Saiu" não é venda confirmada** — é o proxy. O próprio e-mail diz isso embaixo do título da tabela.
- O HTML tem CSS **inline por elemento** (e-mail não respeita `<style>` em boa parte dos clientes) e sai com ~55 KB numa remessa de 750 veículos.

**Remessa de 24/08 (execução `45931`, arquivo `Base atacado anuncio 24-08.xlsx`):** 648 ativos, **0 entraram, 100 saíram** (99 leves + 1 pesado, R$ 5,25 mi de VMV) e **nenhuma mudança de preço** em 648 veículos. A remessa é subconjunto puro da anterior — a LM tirou 100 placas e não repôs nem remarcou nada.

## Leitura de valor em dinheiro digitado por humano (21/08)

O lojista digitou `38.650` e o fluxo entendeu **R$ 38,65** — o parser tratava ponto sempre como decimal. Regra nova, olhando o **último** separador:

| Dígitos depois do último separador | Interpretação | Exemplo |
|---|---|---|
| 3 | separador de **milhar** | `38.650` e `38,650` → 38650 |
| 1 ou 2 | separador de **centavos** | `38650,00` → 38650 · `38.6` → 38,6 |
| nenhum | inteiro puro | `38650` → 38650 |

Separadores antes do último são sempre milhar (`1.234.567` → 1234567). Validado em **18 formatos** antes de aplicar, incluindo `R$ 48.000,00` e `12.345.678,90`.

⚠️ **Nenhuma regra cobre 100%:** em português estrito `38,650` é 38 reais e 65 centavos. Para preço de veículo isso nunca acontece, então a regra assume milhar. Três camadas de proteção em volta:
1. o campo virou "Valor da proposta (em reais, sem centavos)" com placeholder `48000` — ataca a ambiguidade na origem;
2. quando o texto digitado **tem separador**, o aviso mostra o texto cru (`O lojista digitou: "38.650"`);
3. valor abaixo de **10% da FIPE** ou de **R$ 1.000** marca `valor_suspeito` → alerta no WhatsApp e prefixo `[CONFERIR VALOR]` no assunto do e-mail.

⚠️ **Campo `number` no formulário não resolveria** — o HTML aceita `38.650` como float válido igual a 38,65. Máscara de verdade só trocando o formulário por página HTML própria.

## Planilha de controle dos vendedores (SharePoint, 21/08)

**Arquivo:** `Inserção de Propostas LM.xlsx` — site **N8N**, pasta **Planilha Propostas**.
- `itemId`: `01WJTTCQUFVPXVWTFYBFEKQJVLB7BTMRIG`
- aba **Propostas**, tabela **Propostas**, 18 colunas (A..R)
- credencial: **Microsoft Excel Power BI/Automações** (`ZZlB5pMp9oH6hdlH`, conta `powerbi@cars2you.com.br`)

Gravação: `POST .../workbook/tables/Propostas/rows/add`.

🔴 **As colunas A (`Inserido`) e B (`Data da inserção`) são do vendedor — a automação nunca escreve nelas.** Se passar a preencher, apaga o controle do time.

🔴 **Datas vão como número de série do Excel** (`25569 + Date.UTC(...)/86400000`, hora de parede de São Paulo), não como texto: texto pareceria igual na tela mas não ordenaria nem filtraria. Mesma ideia no `% FIPE` — vai a **fração** e a coluna tem formato de porcentagem.

🔴 **O corpo JSON é montado em Code node**, nunca na expressão do nó HTTP: `Observação` e `Razão social` são texto livre e podem conter aspas ou quebra de linha.

### O que o Graph consegue e o que não consegue

Funciona por API: renomear aba, escrever cabeçalho, criar/renomear tabela, largura de coluna, formato numérico por faixa.

❌ **Não existe na API** (testado em v1.0 **e** beta, todos 400 "Resource not found for the segment"): `freezePanes`, `dataValidation`, `conditionalFormats`. Para dropdown, realce condicional e linha congelada, o caminho é **gerar o .xlsx e subir o arquivo inteiro** — sem Python/openpyxl nesta máquina, foi OOXML + ZIP escritos em Node.

🔴 **Lições do arquivo montado à mão (todas medidas, nenhuma dava erro):**
1. **Tabela salva só com cabeçalho corrompe o arquivo** (`FileCorruptTryRepair`). A API aceita header-only; o formato de arquivo exige ao menos uma linha de dados.
2. **O arquivo tem que subir já com linhas de dados.** Com a tabela vazia, a linha inserida entra em A2 — o começo da faixa da formatação condicional — e o Excel **empurra** a regra: `A2:R501` virou `A5:R503`, deixando as primeiras linhas sem realce. Com linhas existentes, o acréscimo cai dentro da faixa e ela estende (conferido: virou `A2:R502`).
3. **Formato de coluna não vale para linha nova.** `<col style>` só se aplica a célula sem estilo próprio, e o Graph escreve estilo explícito ao acrescentar — data virou `46255,66`, moeda virou `66681`, telefone virou `5,56298E+12`. Carimbar o estilo **em cada célula de dado**.
4. **Nunca apagar e recriar a tabela via Graph num arquivo que veio de upload:** `DELETE /tables` + `POST /tables/add` **renomeou os cabeçalhos para `Coluna1`..`Coluna18`**.
5. **Código de formato:** o símbolo da moeda precisa de aspas (`R$ #,##0.00` exibiu `RR$ 66.681,00`) e o separador decimal no código é **sempre ponto**, mesmo em pt-BR (`0,0%` exibiu `72%` em vez de `72,0%`).
6. **`423 locked`** no `PUT .../content` quando alguém está com o arquivo aberto — é lock de coautoria, não permissão. O `rows/add` **continua funcionando** nesse estado.
7. **Apagar linha da tabela:** só `DELETE .../rows/itemAt(index=N)` funciona.
8. **Para inspecionar o que a API não lê**, pedir o item **sem `$select`** e usar o `@microsoft.graph.downloadUrl` — URL pré-autenticada, baixa com `curl` puro.

**Estado em 21/08:** tabela em `A1:R5` com 4 linhas de exemplo (a primeira marcada `Sim` para mostrar o realce verde), regras cobrindo `A2:R502` e `A2:A502`, primeira linha congelada. As linhas de exemplo podem ser apagadas **pelo Excel**.

## Status do laudo colhido do próprio laudo (21/08)

```bash
node automations/scripts/colher-status-laudo.js "<planilha>.xlsx"            # colhe os que faltam
node automations/scripts/colher-status-laudo.js "<planilha>.xlsx" --validar   # confere contra o que a LM preencheu
```

Cache em `automations/estado/status-laudo.json`; o gerador preenche **só** onde a LM não informou, e o painel mostra "(lido no laudo)".

🔴 **Nunca inferir.** Só entra o veredito que o laudo publica. Proibido deduzir de comentário, conservação ou descrição de avaria — a régua de classificação é da LM.

**Sempre rodar `--validar`:** a planilha traz ~400 laudos já classificados, que servem de gabarito. O adaptador da **Alesca bateu 59 de 59 (100%)** e preencheu 35 veículos.

| Fornecedor | Onde está o veredito | Situação |
|---|---|---|
| **alesca** | nome do arquivo do selo (`/template/imagens/N.png`, aspas **simples** no HTML) | ✅ 100% validado |
| **conferilaudo** | texto no topo da página renderizada | precisa navegador (SPA em hash) |
| **unionsolutions** | `bg-danger`=REPROVADO · `bg-warning`=APROVADO COM APONTAMENTO · `bg-success`=APROVADO | precisa navegador (Angular) |
| **vistoriago** | `<img src="">` vazio, preenchido por JS; sem status em JSON embutido; 5 veículos por página | precisa navegador |
| **carvist** | imagem no topo de PDF de ~5 MB e 253 páginas | precisa OCR/visão |
| **nasli** | "APROVADO" aparece em texto, mas também em cada item de checagem | indefinido |
| **autorola** | — | sem acesso |

**Carvist investigado até o fim (21/08):** não está na camada de texto (`pdftotext` da página 1), não existe versão HTML (4 rotas, todas 404), e as imagens pequenas do PDF (154x50) são **idênticas** entre laudos de status diferente — o único objeto que varia é o QR code. Isolar o selo exigiria renderizar a página e comparar imagem.

**A saída barata segue sendo o Alex preencher a coluna** — resolve os 6 fornecedores de uma vez.

## Cópias de monitoramento (fase de testes)

Toda proposta é espelhada além da consultora da conta: **e-mail** para Caio, Donizeti e Tuunelis (dedup contra o endereço da consultora) e **WhatsApp** para Thais, Donizeti, Tuunelis e Caio, via `Expandir Copias WhatsApp` (um item por número). As cópias levam `_Copia de monitoramento (fase de testes)_`.

**Para desligar:** esvaziar `COPIAS` (Code node) e `EMAILS_COPIA` (`Definir Destinatario`).

## Padrão dos fluxos descartáveis

Carga em massa e chamadas ao Graph foram feitas com **webhook descartável + `curl --data-binary`**, e o fluxo **arquivado em seguida**. Usados e arquivados em 21/08: `TEMP carga Lojistas Cadastrados`, `TEMP carga Estoque LM`, `TEMP proxy Graph (planilha LM)`, `TEMP upload planilha propostas`.

⚠️ **Proxy de Graph genérico não pode ficar de pé** — aceita chamada arbitrária com a credencial do powerbi numa URL pública. Arquivar assim que terminar.

⚠️ **`setNodeParameter` não desce em índice de array** (`/formFields/values/12/...` falha) — para mexer num campo de formulário, reenviar o `formFields` inteiro.

## Pendências

- 🔴 **Status do laudo** — pedir ao Alex/LM a coluna preenchida. Só a Alesca é automática hoje (204 leves seguem sem resultado).
- 🔴 **E-mails das consultoras** — Isabella, Gabriela, Patricia, Larissa e Camila seguem sem e-mail na `Consultores Cars2You`. Enquanto isso o e-mail delas cai na Thais (o WhatsApp já vai certo).
- 🔴 **11 CNPJs em duas consultoras** — decidir (lista acima). Hoje vale a primeira ocorrência da planilha.
- ⚠️ **Celular da Larissa** — `557186656938` tem 8 dígitos após o DDD.
- ✅ **Pesados** — primeira lista gerada em 27/08 (execução `46636`): 83 no ar de 105 ativos, 187 KB. Falta chamar Patrícia e Alexandre e descobrir quem é a carteira de lojistas de pesados.
- ⏳ **Teste do WhatsApp espelhado** — dispara para Thais, Donizeti e Tuunelis; fazer só com o Caio avisado.
- ⏳ **Fluxo de disparo da lista** — subir o HTML no SharePoint e mandar por e-mail + WhatsApp, reaproveitando o padrão do Remanescentes IGA.
- ⏳ **Avisar a LM** da coluna `Curva` e dos links de laudo corrompidos na origem (123 de 748 na remessa de 20/08).
- ⏳ **Tabelas antigas** no projeto pessoal — apagar depois de validar as novas.
- 💡 **Data da inserção automática** quando marcarem "Sim" — não sai por n8n, teria que ser fórmula ou script na própria planilha. Decisão do Caio.
- 💡 **Máscara de digitação** — só trocando o formulário por página HTML própria.

---

## Mudanças de 27/08 (tarde)

### 🔑 A lista passou a ler o estado vivo do banco

Até 27/08 o `Lista LM (HTML)` lia **só a Data Table**, que é um retrato do momento em que o `Estoque LM` rodou. O trabalho que a Raiane faz depois — cadastrar as novas e subir as sobras no evento — não chegava na lista: em 27/08 foram **66 carros** de fora, e a lista saiu com 497 quando a realidade era 563.

Três nós novos entre o `Ler Estoque LM` e o `Montar HTML`:

```
Ler Estoque LM → Montar Query Banco → Consultar Banco → Atualizar Estado → Montar HTML
```

O `Atualizar Estado` reescreve `Cruzamento`, `Situacao_Veiculo`, `Status_Anuncio`, `Evento`, `Vehicle_Id` e `Link_Anuncio` com o que o banco diz **no momento de gerar**. A divisão de papéis: **a tabela descreve o carro, o banco diz o estado dele.**

🔴 **O `Atualizar Estado` duplica a taxonomia do `Classificar Veiculos`.** Mudou uma, muda a outra — senão a lista e a planilha da Rai discordam sobre o mesmo carro. Há aviso no topo dos dois nós.

**O `Montar HTML` não foi tocado** (56 KB, colado à mão). Alimentado com estado fresco, o filtro que já existia passou a refletir a realidade sozinho.

### 🚫 O desfecho "Baixar" saiu (decisão do Guilherme, 27/08)

Ele trata isso por outra ação do lado dele. Mas a remoção resolveu dois problemas maiores que o pedido:

1. **O `Baixar` destruía dado em toda execução.** 212 linhas por rodada com 15 dos 38 campos mapeados; como o upsert substitui a linha inteira, zerava `VMV`, `Primeira_Vez`, `KM`, `Ativo` e mais 19 colunas. Silencioso desde 25/08.
2. **O `Ativo = false` nunca era gravado.** O `Comparar Remessas` calculava certo, mas o `Classificar Veiculos` filtrava `Ativo === true` e descartava as linhas. Placa que saía ficava `Ativo: true` para sempre — o proxy de venda documentado aqui **não acontecia na prática**.

Agora as linhas "saiu" passam pelo `Classificar Veiculos` com o estado da plataforma **zerado** e `Cruzamento = 'Saiu da remessa'` (decisão do Caio: link de anúncio velho guardado é a munição para carro vendido reaparecer numa lista). São marcadas `Na_Remessa: false` e o `Montar Planilha Rai` e o `Resumir Cruzamento` filtram por isso — o time de montagem não vê nada a mais.

A query perdeu o recorte `v.situation IN (2,3)`, que existia só para achar os candidatos a Baixar.

### 🐛 Bug de acento no `Resumir Cruzamento`

O nó procurava `'Analise do comprador'` **sem acento**; o `Classificar Veiculos` devolve **com acento**. Os dois cartões de análise mostravam sempre **zero** e as linhas caíam todas em "Presas em outro estado" (43 em 27/08). A planilha anexa sempre esteve certa — o `Montar Planilha Rai` usa os rótulos acentuados. **Não tirar os acentos.**

### 🛡️ Trava: o fluxo recusa a própria saída como entrada

Nó `Conferir Planilha` entre o `Extrair Planilha` e o `Sanear Planilha`. Em 27/08 a planilha de saída (`cruzamento_LM_*.xlsx`, baixada do e-mail) foi subida por engano no lugar da base da LM: o saneador seguiu em frente, adotou colunas pelo conteúdo, declarou 17 colunas novas e gravou **890 linhas ocas** — execução `46615`, marcada sucesso. A trava recusa quando acha 2 ou mais colunas da assinatura da saída (`o que fazer`, `confere com o sistema`, `link do anuncio`, `dias na lista`, `id do veiculo`…). Duas já são conclusivas; uma isolada não derruba.

### 📱 WhatsApp com o arquivo

O `Lista LM (HTML)` passou a mandar o **próprio HTML** por WhatsApp, não só um aviso. Mesmo desenho do Relatório C6: `Expandir Destinos WhatsApp` → `sendText` (resumo) → `sendMedia` (documento), um item por número, `b64` trafegando pelo **json** e não pelo binário.

**Seis destinos:** Caio `5511976288713` · Guilherme `5511932699017` · Tuunelis `5511942426140` · Mattera `5511992753263` · Donizeti `5511941491229` · Thais Martins `5511947619656`.

⚠️ **Não testado com arquivo grande.** A lista de leves tem 1,13 MB (~1,5 MB em base64) e o maior arquivo já validado nesse caminho é o relatório C6, de ~400 KB. Timeout de 180 s.

📌 O número da Thais Martins **resolve a dúvida anotada no fluxo do C6**, onde ele estava marcado como inferido e por isso não era usado.

### Coluna KM na planilha do cruzamento

Entre `Modelo` e `Pátio (LM)`. O campo já existia no `Comparar Remessas` e atravessava o `Classificar Veiculos` — faltava só o mapeamento. **KM = 0 sai em branco**, porque a LM manda texto em algumas linhas (`-`, `inviável`, `N/D`) e zero numa planilha de trabalho se lê como carro zero km. Medido em 27/08: 671 de 678 com número, 7 em branco (3 texto, 3 zero literal, 1 vazio).

### Versões ativas depois desta rodada
- `🟩 Estoque LM` (`noemX4AA7FFxafYZ`) — `53ffa0e2`
- `🟩 Lista LM (HTML)` (`8YnGmVUvl6BmrKKb`) — `7f782a47`
