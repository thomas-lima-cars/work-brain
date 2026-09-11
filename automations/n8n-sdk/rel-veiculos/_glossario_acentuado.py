# -*- coding: utf-8 -*-
r"""Reescreve o glossario inteiro com acentuacao correta.

O corpo do glossario e o maior bloco de texto da tela e estava todo sem
acento -- heranca de quando o arquivo viajava pro n8n com escape manual e
qualquer caractere fora do ASCII era risco. Isso deixou de valer: desde a
limpeza das barras invertidas o arquivo ja carrega ·, — e ↗ como
caractere literal, e o diff byte a byte confere o que chegou no no.

Por que reescrever o bloco inteiro em vez de trocar palavra por palavra:
troca cega por dicionario acertaria tambem o que NAO pode ser acentuado --
"categoria" e "modelo" sao CHAVES do objeto `det`, lidas em
`["preco","idade","km","modelo","categoria"]`. Acentuar uma dessas quebra a
decomposicao do par em silencio. Substituir o bloco declarado, com as partes
dinamicas preservadas uma a uma, nao tem esse risco.

As partes dinamicas que precisam sobreviver intactas:
  LINHAS_ST, descreveRecorte(), MIN_TX, CONFIANCA_MIN,
  META.meses_historico, DADOS.parametros.whitelabels/wl_esperado

    python _glossario_acentuado.py
"""
import io
import os
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
AQUI = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(AQUI, "montar-html.js")
s = io.open(P, encoding="utf-8").read()
orig = s

INI = "  '<div class=\"card\"><div class=\"card-h\">O que entra na base</div><div class=\"card-b\"><dl>',"
FIM = "  '</dl></div></div>',\n  '</div>',"

i = s.find(INI)
j = s.find(FIM, i)
if i < 0 or j < 0:
    raise SystemExit("nao achei os limites do glossario")
antigo = s[i:j + len(FIM)]

# as partes dinamicas tem que continuar existindo depois da troca
DINAMICAS = ["LINHAS_ST", "descreveRecorte()", "MIN_TX", "CONFIANCA_MIN",
             "META.meses_historico", "DADOS.parametros"]
faltando = [d for d in DINAMICAS if d not in antigo]
if faltando:
    raise SystemExit("bloco errado, faltam: " + str(faltando))

NOVO = """  '<div class="card"><div class="card-h">O que entra na base</div><div class="card-b"><dl>',
  '<dt>Uma linha por veículo</dt>',
  '<dd>Não uma linha por negociação. O mesmo carro aparece em vários eventos &mdash; os feirões são diários e reciclam estoque &mdash; e contar por negociação o duplicava.</dd>',
  '<dt>Última negociação</dt>',
  '<dd>De cada veículo, vale o status da <b>última</b> negociação dentro da janela de eventos escolhida. A ordem importa e é fácil de inverter sem perceber: primeiro se acha a última negociação, <b>depois</b> se olha o status dela. O contrário faria um carro vendido hoje reaparecer como disponível pela negociação de ontem, que ficou em "Sem Ofertas".</dd>',
  '<dt>Status da negociação</dt>',
  '<dd>Cinco dos doze estados entram. Ficam de fora os que têm <b>oferta viva na mesa</b> (9 e 13) &mdash; ranquear loja para um carro em negociação atrapalha o negócio em andamento &mdash; além da venda e do que foi suspenso ou cancelado.</dd>',
  '<dd><table><thead><tr><th>Cód.</th><th class="tx">Significado</th><th class="tx">No relatório</th></tr></thead><tbody>' + LINHAS_ST + '</tbody></table></dd>',
  '<dt>Sobra</dt>',
  '<dd>Veículo cuja última negociação NÃO está em "Ativo": passou pelo evento e não foi vendido. É o estoque que faz sentido reofertar, e vem marcado com o nome do status na tabela.</dd>',
  '<dt>Canais que entram</dt>',
  /* o recorte de 2026-09-11. Quem le a tela tem que saber que a base NAO e
     a plataforma inteira, senao compara com outro numero e acha erro */
  '<dd>A base <b>não</b> é a plataforma inteira: só entram eventos e lojas de <b>' + ((DADOS.parametros.whitelabels || []).length || 'todos os') + '</b> canais &mdash; ' + (Object.keys(DADOS.parametros.wl_esperado || {}).length ? Object.keys(DADOS.parametros.wl_esperado).map((k) => DADOS.parametros.wl_esperado[k]).join(', ') : 'todos') + '. Evento que não alveja nenhum deles fica fora, e loja de outro canal sai do universo.</dd>',
  '<dt>UF do veículo</dt>',
  /* a UF mudou de fonte em 2026-09-10 e o glossario tem que dizer qual e,
     porque ela decide metade da elegibilidade */
  '<dd>É a UF do <b>pátio</b> onde o carro está (o estoque da loja), não a do endereço da loja vendedora. São coisas diferentes com frequência: <b>68%</b> dos veículos desta base têm pátio numa UF diferente da UF cadastral de quem vende. Como a elegibilidade exige mesma UF, é o pátio que decide quem pode ver o carro.</dd>',
  '<dt>Link do anúncio</dt>',
  '<dd>Cada veículo leva o link do anúncio na plataforma. Faltando marca, modelo, versão ou identificador, o link <b>não</b> é mostrado &mdash; melhor sem botão que botão que cai em lugar nenhum.</dd>',
  '<dd class="ex">Ter anúncio não é o mesmo que poder receber proposta: veículo de evento encerrado ou marcado como sobra tem link, mas o anúncio pode não aceitar mais lance. O status vem ao lado do link justamente por isso.</dd>',
  '<dt>Janela de eventos</dt>',
  /* o glossario descreve o recorte DESTA coleta, nao um recorte de exemplo:
     ele dizia "meia-noite de hoje ate 48h a frente" mesmo depois de a
     janela virar aberta, e glossario errado engana com autoridade */
  '<dd>Nesta coleta: ' + descreveRecorte() + '. Datas em <b>hora de Brasília</b> &mdash; o banco responde em UTC, então o recorte é calculado fora do SQL e vai como literal; evento que já encerrou continua na base de propósito, porque é justamente onde está a sobra.</dd>',
  '<dd>Quando não há teto, tudo o que ainda não encerrou entra, inclusive evento de fim distante. O filtro de <b>evento</b> acima é a forma de isolar uma edição. O recorte também pode ser uma lista fixa de ids, modo usado para reanalisar edições específicas.</dd>',
  '</dl></div></div>',

  '<div class="card"><div class="card-h">Regras de elegibilidade</div><div class="card-b"><dl>',
  '<dt>Elegibilidade</dt>',
  '<dd>Um par (veículo, loja) <b>só existe</b> se as duas condições valerem: a loja está na <b>mesma UF</b> do veículo <b>e</b> pertence a um dos <b>whitelabels que o evento alveja</b>.</dd>',
  '<dd>Fora disso não há aderência baixa &mdash; o par simplesmente não existe. É por isso que o ranking de cada veículo é curto: ele só disputa dentro da própria praça e do próprio canal.</dd>',
  '<dt>Whitelabel do evento</dt>',
  '<dd>Um evento pode alvejar vários whitelabels, então a comparação é "o whitelabel da loja está no conjunto do evento", não uma igualdade simples. Como consequência, somar veículos por whitelabel dá um número maior que o total: o mesmo carro conta em cada canal onde é exposto.</dd>',
  '<dt>Canal sem loja compradora</dt>',
  /* sem este verbete, esses carros parecem so "sem correspondencia" e o
     leitor procura culpa na aderencia ou no corte */
  '<dd>Alguns eventos alvejam <b>canais de pessoa física</b> &mdash; colaborador, associado, clube. Ali não existe loja compradora como categoria, então o veículo <b>nunca</b> pode ter par: não é aderência baixa, é ausência de contraparte. Esses carros vêm marcados com a etiqueta <b>canal sem loja</b> e têm KPI próprio, separado de <b>Sem correspondência</b>.</dd>',
  '<dt>Correspondência mínima</dt>',
  '<dd>Par com score abaixo de <b>' + (MIN_TX || 0) + '%</b> não existe em lugar nenhum do relatório: não entra nas tabelas, não conta nos KPIs, não aparece em nenhuma das duas direções. O KPI <b>Sem correspondência</b> conta só quem <b>podia</b> ter par: tinha loja elegível e nenhuma alcançou o piso. São esses, e só esses, que mudariam se o corte baixasse.</dd>',
  '</dl></div></div>',

  '<div class="card"><div class="card-h">Como o número é feito</div><div class="card-b"><dl>',
  '<dt>A ideia</dt>',
  '<dd>Cada loja tem um <b>perfil de compra</b> tirado dos últimos ' + (META.meses_historico || 6) + ' meses de lances dela: em que faixa de preço compra, de que idade, de que quilometragem, e qual modelo e categoria mais oferta. A aderência mede o quanto um veículo cai dentro desse perfil.</dd>',
  '<dt>Aderência de um indicador</dt>',
  '<dd>Nos numéricos (preço, idade, km): <code>1 / (1 + |valor &minus; média| / desvio)</code>. Vale 1 quando o veículo está exatamente na média da loja e cai conforme se afasta, medido em desvios.</dd>',
  '<dd>Em modelo e categoria é binário: 1 se bate com o item que a loja mais oferta, 0 se não bate.</dd>',
  '<dt>Peso de um indicador</dt>',
  '<dd>Nos numéricos: <code>1 / (1 + desvio / média)</code> &mdash; o inverso do coeficiente de variação. <b>Loja de faixa apertada é previsível</b>, então acertar o número dela vale muito; loja que compra de tudo tem dispersão alta, o peso cai sozinho e o indicador deixa de mandar no resultado.</dd>',
  '<dd>Em modelo e categoria, o peso é o <b>% de ofertas</b> da loja naquele item. Loja que concentra 70% dos lances num modelo faz esse indicador pesar mais do que uma que espalha.</dd>',
  '<dt>Aderência (o total)</dt>',
  '<dd><code>&Sigma;(peso &times; aderência) / &Sigma;(peso)</code>, de 0 a 100. É a média dos cinco indicadores ponderada pelo quanto cada um informa sobre aquela loja.</dd>',
  '<dt>Fator de confiança</dt>',
  '<dd><code>min(1, veículos / ' + CONFIANCA_MIN + ')</code>. Loja com pouco histórico tem perfil pouco confiável, então o resultado dela é descontado &mdash; com menos de ' + CONFIANCA_MIN + ' veículos ela aparece marcada como <b>amostra baixa</b>.</dd>',
  '<dd class="ex">Esta parte foi adição minha, não estava no pedido original: sem ela, uma loja com um único carro de histórico e aderência 100 lideraria por sorte.</dd>',
  '<dt>Score</dt>',
  '<dd><b>Aderência &times; confiança.</b> É o número que ordena as duas tabelas e o que a barra azul desenha. Quando há seleção, as duas colunas aparecem lado a lado: <b>aderência</b> é o casamento bruto com o perfil, <b>score</b> já é o número descontado.</dd>',
  '<dt>Componentes</dt>',
  '<dd>A decomposição do par, indicador a indicador (P, I, K, M, C), cada um de 0 a 100. Serve para ver <i>por que</i> aquele score saiu: um 90 sustentado por preço e idade é diferente de um 90 que veio só de categoria.</dd>',
  '<dt>O que o filtro não muda</dt>',
  '<dd>O perfil de compra e o fator de confiança saem do histórico da <b>loja inteira</b>, sem recorte por whitelabel, UF ou evento. Como a aderência é calculada contra esse perfil, <b>o score de cada par não muda</b> com o filtro. O filtro escolhe quais pares aparecem; não os recalcula.</dd>',
  '<dt>Volume de ofertas</dt>',
  '<dd>Não entra no score. "Veículos ofertados 6m" está na tabela como leitura de porte da loja, não como critério de ranking.</dd>',
  '</dl></div></div>',
  '</div>',"""

s = s[:i] + NOVO + s[j + len(FIM):]

# as dinamicas tem que ter sobrevivido
for d in DINAMICAS:
    if d not in NOVO:
        raise SystemExit("a reescrita perdeu a parte dinamica: " + d)

io.open(P, "w", encoding="utf-8").write(s)
print("  ok  glossario reescrito com acentuacao")
print("  ok  partes dinamicas preservadas: " + ", ".join(DINAMICAS))
print("mudou: " + str(s != orig))
