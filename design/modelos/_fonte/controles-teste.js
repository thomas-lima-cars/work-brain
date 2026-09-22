/* ============================================================================
   ⏳ TEMPORÁRIO — o seletor de fonte do modelo de LABORATÓRIO
   ----------------------------------------------------------------------------
   Injetado só em `dashboard-teste.html`, no marcador de enxerto que o molde
   deixa no fim do script.
   (O nome do marcador NÃO se escreve aqui: o monta-modelos varre o arquivo
    gerado atrás de marcador que sobrou, e acharia este comentário — achou,
    na primeira tentativa, e reprovou a geração. Guarda boa.)
   O `dashboard-claro.html` e o `dashboard-escuro.html` recebem string vazia
   ali e não sabem que isto existe.

   ── O QUE JÁ SAIU DAQUI ────────────────────────────────────────────────────
   Este arquivo nasceu com um seletor de TRÊS temas, para julgar o candidato
   "vidro" contra o claro e o escuro. O vidro foi aprovado em 22/09 e virou o
   tema claro de verdade, então voltaram a ser dois — e o botão de dois
   estados do próprio molde dá conta. Sobrou a fonte, que continua em aberto.

   ── POR QUE UM <select>, E NÃO BOTÕES ──────────────────────────────────────
   Seis opções não cabem como botão ao lado do que já existe no topo, e ali já
   há dois `<select>` de filtro — a peça já é da página.

   ── POR QUE O RÓTULO É MEDIDO, E NÃO ESCRITO ───────────────────────────────
   Ver `defeitos()` lá embaixo. Resumo: eu afirmei de cabeça que todas as
   candidatas tinham algarismos tabulares e estava errado justamente sobre a
   que eu mesmo tinha recomendado.
   ========================================================================== */
(function () {
  const acoes = document.querySelector('.topo-acoes');
  if (!acoes) return;

  /* Duas famílias de candidata, e elas custam coisas diferentes:

       JÁ INSTALADAS  trocam um token e pronto. De graça, e degradam sozinhas
                      em máquina que não as tem.
       EMBUTIDA       a DM Sans viaja dentro do arquivo, em base64 (+48 KB).
                      Tem que ser assim: a regra 9 não admite requisição de
                      rede, e `<link>` pro Google Fonts abriria a porta pro
                      pior dos mundos — a página abre, o texto aparece, e
                      ninguém percebe que está vendo a fonte errada.

     Nome de fonte com espaço vai entre ASPAS SIMPLES. Aspas duplas dentro de
     um atributo `style` de aspas duplas matam o atributo no meio, e o
     navegador cai em Times New Roman sem avisar — foi como eu comparei seis
     fontes e vi seis vezes a mesma. */
  const FONTES = [
    ['-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, ' +
     '\'Helvetica Neue\', Arial, \'Noto Sans\', sans-serif',
     'Padrão de hoje', null],

    ['\'Segoe UI Variable Display\', \'Segoe UI Variable Text\', ' +
     '-apple-system, \'Segoe UI\', sans-serif',
     'Segoe UI Variable', 'Segoe UI Variable Display'],

    ['\'DM Sans\', -apple-system, \'Segoe UI\', sans-serif',
     'DM Sans (embutida)', 'DM Sans'],

    ['Calibri, -apple-system, \'Segoe UI\', sans-serif',
     'Calibri', 'Calibri'],

    ['Corbel, -apple-system, \'Segoe UI\', sans-serif',
     'Corbel', 'Corbel'],

    ['Candara, -apple-system, \'Segoe UI\', sans-serif',
     'Candara', 'Candara'],
  ];

  /* A fonte está mesmo instalada, ou o navegador está me mostrando o
     fallback caladinho?

     Compara a largura do mesmo texto com a fonte pedida e sem ela, contra
     DUAS bases diferentes. Uma base só daria falso negativo quando a fonte
     testada tem, por acaso, a mesma métrica da base.

     Sem esta conferência o seletor vira armadilha: a pessoa escolhe "Segoe
     UI Variable" num Windows 10, vê o Segoe UI de sempre, e conclui que a
     troca não muda nada. */
  const tela = document.createElement('canvas').getContext('2d');
  function largura(familia, texto) {
    tela.font = '40px ' + familia;
    return tela.measureText(texto).width;
  }
  function instalada(nome) {
    if (!nome) return true;                 /* o padrão é sempre o que há */
    const amostra = 'Radar de Estoque 1.879';
    return ['serif', 'monospace'].some(function (base) {
      return Math.abs(largura('\'' + nome + '\', ' + base, amostra) -
                      largura(base, amostra)) > 0.5;
    });
  }

  /* ── O DEFEITO VAI NA ETIQUETA, E É MEDIDO, NÃO LEMBRADO ────────────────
     Este painel é uma coluna de R$, de km e de %, e duas coisas estragam
     isso — as duas invisíveis num espécime de nome de fonte:

       sem tabular  o "1" é mais estreito que o "8", e a coluna de números
                    dança linha a linha. A DM Sans, que eu tinha recomendado
                    justamente por ser macia, cai aqui: "1111" mede 49,9px
                    contra 97,3px de "8888", e nem `tabular-nums` nem
                    `font-feature-settings:"tnum"` mudam isso — o recurso
                    não existe neste arquivo.
       old-style    o 3, 4, 5, 7 e 9 descem abaixo da linha de base. Bonito
                    em texto corrido, ruim numa tabela. Corbel e Candara.

     Medir aqui em vez de escrever o defeito à mão não é preciosismo: eu já
     afirmei de cabeça que "todas têm algarismos tabulares" e estava errado
     sobre a que eu mesmo tinha recomendado. Etiqueta que sai de medição não
     envelhece nem mente. */
  function larguraDom(familia, texto) {
    const s = document.createElement('span');
    s.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;' +
      'font-size:40px;font-family:' + familia + ';' +
      'font-variant-numeric:tabular-nums;font-feature-settings:"tnum" 1';
    s.textContent = texto;
    document.body.appendChild(s);
    const w = s.getBoundingClientRect().width;
    s.remove();
    return w;
  }

  function defeitos(nome) {
    if (!nome) return [];
    const f = '\'' + nome + '\'';
    const fora = [];

    /* A largura tem que ser medida no DOM, e não no canvas: o canvas ignora
       `font-variant-numeric`, e o painel LIGA `tabular-nums` em todo número.
       Medindo no canvas a Segoe UI aparecia como "sem algarismos tabulares",
       que é falso — ela tem o recurso, só não é o padrão dela. Errar para o
       lado de acusar quem está certo é pior que não acusar ninguém. */
    const tabular = Math.abs(larguraDom(f, '1111') - larguraDom(f, '8888')) < 0.5;
    if (!tabular) fora.push('sem algarismos tabulares');

    /* Largura e desenho são recursos DIFERENTES: `tnum` alinha a largura,
       `lnum` troca o desenho. O painel liga só o primeiro, então uma fonte
       pode passar no teste de coluna e continuar com o 3, o 4 e o 7 caindo
       abaixo da linha de base. É o caso da Corbel — conferido na tela, com
       `tabular-nums` ligado.

       Por isso este teste roda SEMPRE, e não só quando o tabular falha: foi
       a primeira versão, e ela dava "limpa" para a Corbel.

       Aqui o canvas serve, porque é justamente o desenho padrão que
       interessa — `tnum` não o altera. `actualBoundingBoxDescent` do "3": em
       algarismo alinhado ele para na linha de base (≈0); em old-style, desce. */
    tela.font = '40px ' + f;
    const m = tela.measureText('3');
    if ((m.actualBoundingBoxDescent || 0) > 1.5) fora.push('algarismos old-style');
    return fora;
  }

  const sel = document.createElement('select');
  sel.className = 'ctrl';
  sel.id = 'f-fonte';
  sel.setAttribute('aria-label', 'Fonte do painel');

  function rotula() {
    FONTES.forEach(function (f, i) {
      if (!instalada(f[2])) {
        sel.options[i].textContent = f[1] + ' (não instalada)';
        return;
      }
      const d = defeitos(f[2]);
      sel.options[i].textContent = f[1] + (d.length ? ' — ' + d.join(', ') : '');
    });
  }

  FONTES.forEach(function (f, i) {
    const o = document.createElement('option');
    o.value = String(i);
    o.textContent = f[1];
    sel.appendChild(o);
  });
  rotula();

  /* A fonte EMBUTIDA ainda não está pronta quando este script roda: o
     `@font-face` é um data URI, decodifica rápido, mas não instantaneamente.
     Medir antes da hora marcaria a DM Sans como "não instalada" — e seria
     mentira em cima de uma fonte que está ali dentro do arquivo.
     Por isso a etiqueta é refeita quando o navegador termina de carregar. */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(rotula);
  }

  sel.addEventListener('change', function () {
    document.documentElement.style.setProperty('--fonte', FONTES[Number(sel.value)][0]);
  });

  /* Antes do botão de tema, que é sempre a última coisa do topo. */
  acoes.insertBefore(sel, acoes.firstChild);
})();
