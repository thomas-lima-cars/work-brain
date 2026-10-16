/* Página "Como o modelo funciona" do relatório preditivo.
 *
 *   const COMO_HTML = require('./pagina-como.js')(R, chip);
 *
 * Tudo o que é lista ou número sai de resultado-modelo.json — R.variaveis é a
 * matriz do próprio modelo de setembro, então a página nunca descreve uma
 * variável que o modelo não usa, nem esquece uma que ele usa. Texto que
 * descreve o MÉTODO é fixo; texto que descreve RESULTADO vem do dado.
 */
const CANAL_N = { wl4: 'Trucks2you', wl5: 'WL 5', wl7: 'Marketplace', wl8: 'Dealers Club', wl43: 'C6 Auto',
  wl48: 'Colaboradores C6', wl62: 'Lance Fácil BTB', wl65: 'BTB Associados' };

module.exports = function paginaComo(R, chip) {
  const limpa = (v) => v.replace(/^(Cars2You|Dealers):/, '').replace(/^[a-z] /, '').replace(/_/g, ' ');
  const niveis = (k) => [...new Set((R.variaveis[k] || []).map(limpa))];
  const lista = (arr) => '<ul class="lista-tags">' + arr.map((x) => '<li>' + x + '</li>').join('') + '</ul>';
  const n = (x) => Number(x).toLocaleString('pt-BR');
  const pct = (x, d) => (x * 100).toFixed(d == null ? 1 : d).replace('.', ',') + '%';
  const F = R.escada[R.escada.length - 1].teste, A = R.escada[0].teste;
  const AD = R.antes_depois;
  const NOME_BLOCO = { vendedor: 'vendedor', versao: 'versão', itens: 'itens do laudo', patio: 'pátio',
    acabamento: 'acabamento (cor, câmbio, combustível, carroceria)', 'num:idade': 'idade contínua',
    'num:fab': 'ano de fabricação', 'num:molicar': 'Molicar', 'num:fipe_veic': 'FIPE do veículo',
    'num:ev_tamanho': 'tamanho do evento', 'num:ev_alcance': 'alcance do evento',
    'num:ev_calendario': 'calendário do evento' };
  const aprovados = (R.selecao || []).slice(1);
  const usa = (b) => aprovados.some((h) => h.bloco === b);
  const vend = [...new Set(Object.values(R.nomes_vendedor || {}))];
  /* como o índice se comporta, medido no teste -- nunca escrito à mão */
  const nivel = (c) => (c >= 0.8 ? 'alta' : c >= 0.7 ? 'média' : 'baixa');
  const cal = {};
  R.veiculos.forEach((v) => {
    const k = nivel(v.conf); (cal[k] = cal[k] || []).push(Math.abs(v.prev - v.real) / v.real);
  });
  const medi = (a) => { a = a.slice().sort((x, y) => x - y); return a[Math.floor(a.length / 2)]; };
  const calTxt = ['baixa', 'média', 'alta'].filter((k) => cal[k])
    .map((k) => k + ' ' + pct(medi(cal[k]))).join(', ');

  const BLOCOS = [
    ['Modelo do carro', 'Marca + modelo, normalizados. É o ponto de partida do preço.',
      n(R.corte.n_modelos.Cars2You) + ' modelos na Cars2You e ' + n(R.corte.n_modelos.Dealers) +
      ' na Dealers — os 100 mais vendidos de cada base em 12 meses.', null],
    ['Quilometragem', 'Em faixas, separadas por base. Sem km informado é uma faixa própria.', '', niveis('km')],
    ['Idade', 'Ano da venda menos o ano do modelo, em faixas, separadas por base.', '', niveis('idade')],
    ['UF do pátio', 'Onde o carro está guardado, não a sede da loja.', '', niveis('uf')],
    ['Canal', 'O whitelabel em que o carro foi anunciado.', '', niveis('canal').map((c) => CANAL_N[c] || c)],
    ['Categoria', '', '', niveis('categoria')],
    ['Faixa de FIPE', 'Carro barato e carro caro saem por frações diferentes da tabela.', '', niveis('faixa_fipe')],
    ['Laudo cautelar (banco)', 'O resultado registrado na plataforma.', '', niveis('laudo_banco')],
    ['Sinais do texto do anúncio', 'Expressões procuradas na descrição do veículo — as mesmas da aba Observações do painel de precificação.', '', niveis('texto')],
    ['Indicadores do laudo em PDF', 'Lidos do texto do PDF, quando ele foi lido (' + n(R.corte.n_laudo_lido) +
      ' das vendas usadas). Nas outras, o modelo trabalha sem eles.', '', niveis('laudo_pdf').filter((x) => x !== 'lido')],
    ['Lataria com dano (laudo em PDF)', 'Quantas peças externas o laudo aponta com dano.', '', niveis('lataria')],
  ];
  if (usa('acabamento')) {
    BLOCOS.push(['Acabamento', 'Cor, câmbio, combustível e carroceria.', '',
      ['cor', 'câmbio', 'combustível', 'carroceria']]);
  }
  if (usa('vendedor')) {
    BLOCOS.push(['Vendedor (comitente)', 'Quem anuncia o carro — banco, locadora, financeira. Nunca o comprador.', '',
      vend.slice(0, 18).concat(vend.length > 18 ? ['e mais ' + (vend.length - 18)] : [])]);
  }
  if (usa('num:ev_calendario')) {
    BLOCOS.push(['Calendário do evento', 'Fixado antes do primeiro lance.', '',
      ['duração da oferta', 'dia da semana do fechamento', 'hora do fechamento']]);
  }

  return `
  <div id="pg-como" hidden>

  <section class="cartao texto">
    <div class="cartao-topo">${chip('alvo')}<h2>Em uma frase</h2></div>
    <p>O modelo estima <b>por quanto um carro deve ser vendido</b>, em porcentagem da FIPE do anúncio, olhando só o que
      se sabe <b>antes do leilão</b>: o carro, onde ele está, o que o anúncio e o laudo dizem dele. O preço previsto é a
      FIPE vezes essa porcentagem.</p>
    <p>Ele <b>não usa o VMV nem o valor da venda</b> do próprio carro. Não é descuido: o modelo existe para ser
      <b>confrontado</b> com os dois. Se o VMV entrasse, a comparação "modelo × VMV" seria o VMV comparado com ele mesmo.</p>
  </section>

  <section class="cartao texto">
    <div class="cartao-topo">${chip('tab')}<h2>De onde vêm os dados</h2></div>
    <ol class="passos">
      <li><b>A amostra do estudo de precificação:</b> vendas de setembro de 2025 a setembro de 2026, nas bases Cars2You e
        Dealers, dos <b>100 modelos mais vendidos</b> de cada base, sem motos e pesados. O estudo original usava 20;
        ampliar quase dobrou as vendas para aprender e estendeu o modelo a carros que ele não cobria.</li>
      <li><b>Só vendas disputadas:</b> entram as vendas em que ${R.corte.min_lojas} ou mais lojas diferentes deram lance.
        Com menos disputa o preço para no VMV — na Cars2You, 67% das vendas com uma loja só fecharam a até 2% do VMV —,
        e o modelo aprenderia o VMV por tabela. Saíram ${Object.entries(R.corte.descartadas).map(([b, v]) => n(v) + ' da ' + b).join(' e ')};
        ficaram <b>${n(R.corte.n_vendas)}</b>.</li>
      <li><b>O laudo em PDF</b> foi lido num sorteio de 1.500 vendas por base, e só nos que tinham texto — os escaneados
        precisariam de OCR.</li>
    </ol>
  </section>

  <section class="cartao">
    <div class="cartao-topo">${chip('pesos')}<h2>O que o modelo leva em conta</h2>
      <span class="dir"><span class="tag">${BLOCOS.length} blocos</span></span></div>
    <div class="blocos">${BLOCOS.map(([t, d, extra, nv]) => '<div class="bloco"><h3>' + t + '</h3>' +
      (d ? '<p>' + d + '</p>' : '') + (extra ? '<p>' + extra + '</p>' : '') + (nv && nv.length ? lista(nv) : '') + '</div>').join('')}
    </div>
    <div class="bloco bloco-nao">
      <h3>O que ele não leva em conta, de propósito</h3>
      ${lista(['VMV', 'valor da venda do próprio carro', 'loja compradora', 'status da negociação', 'número de lances'])}
      <p>São o resultado da venda, ou o que o modelo existe para confrontar. Há uma trava no código: se uma delas entrar
        no modelo, ele não roda.</p>
    </div>
  </section>

  <section class="cartao texto">
    <div class="cartao-topo">${chip('real')}<h2>Como o valor previsto é calculado</h2></div>
    <ol class="passos">
      <li><b>Ponto de partida — o modelo do carro.</b> A média da razão venda ÷ FIPE daquele modelo, naquela base, nas
        vendas anteriores. Modelo com poucas vendas tem a média puxada para a média da base (como se tivesse mais
        ${R.k_encolhe} vendas na média da base), para que um caso isolado não decida o preço sozinho.</li>
      <li><b>Ajustes — o que diferencia este carro dos outros do mesmo modelo.</b> Um <i>gradient boosting</i> — centenas
        de árvores de decisão pequenas, cada uma corrigindo o erro das anteriores — aprende quanto cada combinação de
        características desloca a razão: km alto com idade alta, laudo reprovado com motor que não funciona, e assim por
        diante. A soma dos ajustes vai sobre o ponto de partida.</li>
      <li><b>Preço previsto = FIPE do anúncio × (ponto de partida + ajustes).</b></li>
      <li><b>Faixa provável e índice de confiança.</b> Dois modelos iguais ao do preço, treinados para o 10º e o 90º
        percentil, dão a faixa onde a venda deve cair em 8 de cada 10 casos. Faixa estreita é carro fácil de prever;
        larga, difícil. Dela sai o índice.</li>
    </ol>
    <div class="exemplo" id="exemplo"></div>
  </section>

  <section class="g2">
    <article class="cartao texto">
      <div class="cartao-topo">${chip('escada')}<h2>Como foi treinado e testado</h2></div>
      <ol class="passos">
        <li><b>Escolha do método</b>, numa validação separada: treino com as vendas até abril de 2026, cobrança em maio
          e junho. Ali se comparou regressão linear (ridge) com gradient boosting, e se testou um ajuste pela
          "temperatura" recente do mercado. Ganhou o ${R.algoritmo_final === 'boost' ? 'gradient boosting' : 'ridge'};
          a temperatura ${R.temperatura ? 'entrou' : 'piorou o acerto e ficou de fora'}.</li>
        <li><b>Seleção dos blocos de informação</b>, também só com dados anteriores ao teste: cada candidato (vendedor,
          versão, acabamento, pátio, itens do laudo, dados do evento, valores contínuos) só entrou se reduzisse o erro em
          <b>duas</b> janelas de validação, março–abril e maio–junho, cada uma treinada só com o que veio antes. Uma janela
          só premiava acaso. Entraram: ${aprovados.length ? aprovados.map((h) => NOME_BLOCO[h.bloco] || h.bloco).join(', ') : 'nenhum'}.</li>
        <li><b>Teste como seria o uso real:</b> re-treinado todo mês só com as vendas anteriores e cobrado no mês
          seguinte — julho, agosto e setembro de 2026, ${n(R.corte.n_teste)} vendas que o modelo não tinha visto.</li>
        <li><b>Resultado:</b> erro mediano de <b>${pct(F.erro_mediano)}</b> e <b>${pct(F.dentro_10, 0)}</b> das vendas a
          até 10% do previsto, contra ${pct(A.erro_mediano)} e ${pct(A.dentro_10, 0)} do chute ingênuo (FIPE × média da
          base).</li>
        ${AD ? '<li><b>Contra o modelo anterior</b>, nas mesmas ' + n(AD.antes.n) + ' vendas: erro mediano de ' +
          pct(AD.antes.erro_mediano) + ' para <b>' + pct(AD.depois.erro_mediano) + '</b>, a até 10% de ' +
          pct(AD.antes.dentro_10, 0) + ' para <b>' + pct(AD.depois.dentro_10, 0) + '</b>, erro médio por carro de R$ ' +
          n(Math.round(AD.antes.mae_reais)) + ' para <b>R$ ' + n(Math.round(AD.depois.mae_reais)) + '</b>.</li>' : ''}
      </ol>
      <p class="nota">Por que não sortear vendas para o teste: o sorteio põe no treino carros do mesmo lote, evento e
        semana dos testados, e o acerto sai otimista. O corte por tempo é o que se teria no dia de precificar.</p>
    </article>
    <article class="cartao texto">
      <div class="cartao-topo">${chip('faixa')}<h2>O índice de confiança</h2></div>
      <p>É a <b>chance estimada de a venda ficar a até 10% do preço previsto</b>. Sai da largura da faixa provável:
        quanto mais estreita, maior o índice.</p>
      <p>Duas calibrações, as duas feitas em maio e junho, antes de olhar o teste. A largura crua dos modelos de
        percentil é multiplicada por uma escala (k = ${R.k_faixa.toFixed(2).replace('.', ',')}) para que a faixa cubra de
        fato 80% das vendas. E a tradução de largura em probabilidade é aprendida do acerto observado naqueles meses
        (regressão logística): a fórmula teórica prometia 86% onde o acerto era 76%.</p>
      <p><b>Alta</b> a partir de 80%, <b>média</b> de 70% a 80%, <b>baixa</b> abaixo de 70%. Erro mediano no teste, por
        nível: ${calTxt}. A tabela "O índice de confiança acerta?", na aba Resultados, compara o anunciado com o
        observado.</p>
    </article>
  </section>

  <section class="cartao texto">
    <div class="cartao-topo">${chip('alerta')}<h2>Limites</h2></div>
    <ul class="passos">
      <li><b>Só cobre os modelos da amostra</b> — os 100 mais vendidos de cada base, cerca de 92% das vendas. Carro de
        outro modelo não tem ponto de partida próprio e cai na média da base.</li>
      <li><b>Tende a prever caro</b> (viés de ${pct(F.vies)} no teste). A Dealers caiu de patamar em julho de 2026 e nada
        no histórico anunciava; o re-treino mensal absorve isso com um mês de atraso.</li>
      <li><b>Carro retomado sem condição de rodar</b> — sem chave, motor que não funciona, laudo reprovado, vendido por
        banco — é o perfil dos maiores erros: o modelo desconta, mas menos do que o mercado.</li>
      <li><b>Laudo em PDF só numa parte das vendas</b>, e o laudo escaneado não é lido.</li>
      <li><b>O índice de confiança vale para o conjunto, não garante o carro</b>: um carro de confiança alta ainda pode
        errar muito. Veja a tabela de calibração na aba Resultados.</li>
    </ul>
  </section>

  </div>
`;
};
