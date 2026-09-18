# E-mail — estudo de precificação

> Rascunho para o Thomas revisar e enviar. Números da extração de 2026-09-17.
> Destinatários em aberto.
>
> ⚠️ Cita deságio médio e drivers de duas operações. É dado comercial —
> conferir a lista de destinatários antes de enviar.

---

**Assunto:** O que move o preço de venda — estudo sobre 9.367 vendas, e o caminho para um modelo

---

Pessoal,

Fechamos um estudo que mede **o que faz um veículo vender mais perto ou mais
longe da tabela FIPE**. Rodou sobre **9.367 vendas dos últimos 12 meses** —
4.596 da Cars2You e 4.771 da Dealers — e está em duas telas, com o dado
linha a linha por trás de cada número.

Abaixo: o que foi medido, o que apareceu, e o que falta para virar um modelo
de precificação.

## O que estamos medindo

**Deságio = 1 − (valor da venda ÷ FIPE do anúncio).** Deságio de 30% quer
dizer que o carro saiu por 70% da tabela. A média geral é **30,4%**.

Três decisões que definem a amostra, e que vale conhecer antes de ler
qualquer número:

- **Venda** é o veículo cuja *última* negociação válida está em status 2, 3 ou
  7. Contar qualquer negociação nesses status incluiria carro que vendeu e
  teve a venda cancelada depois.
- **Valor** é `offers.price` da oferta vencedora — não o campo de valor da
  negociação, que está preenchido até em negociação sem oferta nenhuma.
- **Recorte**: os 20 modelos mais vendidos de cada operação, sem motos e
  pesados, descartando razões venda/FIPE fora de 0,20–1,20. Sobra metade das
  vendas elegíveis, com volume suficiente por modelo.

**Toda comparação é feita dentro do mesmo modelo e da mesma operação.** Sem
isso, qualquer coisa correlacionada com o modelo pareceria um driver sem ser:
um Corolla e um Mobi têm deságios diferentes por serem carros diferentes, não
pelo que estamos medindo.

## Análise 1 — campos do sistema

Pega as colunas estruturadas do cadastro e mede quanto cada faixa desloca o
deságio. Amplitude de ponta a ponta:

| campo | amplitude | leitura |
|---|---:|---|
| **Quilometragem** | **15,0 p.p.** | escada sem degrau fora de lugar: de −6 p.p. até 20 mil km a +9 p.p. acima de 200 mil |
| **Idade** | 10,5 p.p. | concentrada na ponta: 15 anos ou mais sozinho vale +11 p.p. |
| **Laudo cautelar** | 7,2 p.p. | reprovado contra aprovado |
| **UF do pátio** | 5,7 p.p. | geografia pesa menos do que se imaginava |

## Análise 2 — observações do veículo

O campo de texto livre do anúncio (`vehicles.description`) foi quebrado em
**53 sinais** — cada item, cada peça, cada menção a dívida ou documentação —
organizados em sete grupos: avarias, itens presentes, itens faltantes, motor,
tipo de uso, dívidas e documentação.

As expressões não foram inventadas: saíram de uma varredura dos n-gramas do
próprio texto. **24 dos 53 sinais passam no critério estatístico mais rígido.**

Os maiores:

| sinal | vendas | efeito |
|---|---:|---:|
| Motor não funciona | 748 | **+5,8 p.p.** |
| Chave ausente ou não funciona | 907 | **+4,7 p.p.** |
| Sem estepe | 472 | +4,5 p.p. |
| Sem itens de segurança | — | +3,9 p.p. |
| Faróis avariados | 111 | +7,0 p.p. |
| "Crivo" na documentação | 67 | **+11,9 p.p.** |

**O achado que mais surpreende: o que o carro NÃO tem pesa mais do que o que
está amassado.** Chave, estepe e itens de segurança movem de 4 a 5 p.p. cada.
A peça avariada mais forte, fora as raras, fica em +4 p.p. Faz sentido:
"arranhões e avarias em geral" está em três de cada quatro anúncios — é caixa
marcada, não descrição daquele carro. Item faltante é específico.

## O que isso significa na prática

**Informação que hoje está em texto digitado à mão explica preço tanto quanto
campo estruturado.** Chave, estepe, itens de segurança, estado do motor e
situação do documento são, cada um, da mesma ordem de grandeza que a
quilometragem — e nenhum deles é um campo do sistema.

Isso é uma oportunidade e um risco ao mesmo tempo: a informação existe e
influencia o preço, mas depende de alguém digitar a frase certa, e varia entre
as operações.

## O caminho para um modelo de precificação

O que temos hoje **ranqueia drivers, mas não prevê preço.** Cada variável foi
medida sozinha, e várias andam juntas — km, idade e versão se sobrepõem.
Para virar previsão, três passos:

**1. Estruturar o que hoje é texto.** Chave, estepe, itens de segurança,
estado do motor e situação documental viram campos de preenchimento obrigatório
no cadastro. É o passo de maior retorno e o único que depende de produto, não
de análise. Sem ele o modelo herda a inconsistência da digitação.

**2. Modelo multivariado, só com o que se sabe ANTES da venda.** Aqui mora a
armadilha: o fator isolado mais forte que medimos é **quem compra** — e isso
só se conhece depois. Um modelo que use o comprador acerta no histórico e é
inútil na hora de precificar. O modelo tem de rodar com o que existe quando o
anúncio é publicado: modelo, ano, km, laudo, itens, estado do motor,
documentação, pátio.

**3. Validar contra a régua atual.** Hoje o piso segue a regra FIPE × 0,75.
O teste é direto: separar uma parte das vendas, prever com o modelo, e comparar
o erro contra o que a regra fixa daria. Se não ganhar da regra, não vale
substituir.

**O que trava hoje**, e precisa de decisão de quem cuida do dado:

- A FIPE do anúncio está preenchida em ~74% das vendas de uma das operações.
  O que falta sai da amostra — o modelo nasce cego nessa fatia.
- O valor mínimo de venda de uma das bases é um valor fixo em 98% dos
  registros. Qualquer regra que leia esse campo está lendo um placeholder.

## Como conferir

O painel tem as duas análises, filtro por operação e glossário em cada tela.
Clicando em qualquer sinal, aparecem os veículos e o texto do anúncio — dá
para ler a descrição que gerou o número.

Nada aqui é conclusão sobre causa. O estudo mostra **com o que o preço anda
junto**, não o que aconteceria se mudássemos alguma coisa. Um carro com motor
quebrado também costuma ter mais avarias e menos itens: a separação disso é
justamente o passo 2.

Abraço,
Thomas
