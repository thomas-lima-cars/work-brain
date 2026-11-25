/* ══════════════════════════════════════════════════════════════════════
   NÓ "Montar Painel" — Painel de Eventos Cars2You

   Recebe as tabelas do "MCP Consultas" e a carteira comercial do "Ler
   Carteira", confere cada pacote contra o próprio total e monta o HTML:
   cartões dos eventos ativos no dia, veículos ativos por dia (com os novos
   e o percentual com acesso, oferta ou venda), lojistas por dia, tabela de
   veículos, filtros (gaveta) e glossário.

   Nasceu em 28/10 a partir do Painel de Eventos C6: o mesmo jeito de
   empacotar consultas e de conferir pacote, a mesma gaveta, a mesma tabela
   ordenável. O recorte e a tela são outros.

   ─── ONDE CADA NÚMERO É CALCULADO ────────────────────────────────────
   O nó só prepara as linhas-base, em arrays de índices (o painel tem ~28
   mil negociações e ~50 mil pares negociação × loja com acesso: objeto
   com nome de campo dobraria o arquivo). Tudo que depende do recorte
   escolhido na tela sai de "calcula()", que é UMA função: roda aqui, para
   o "resumo" que as provas conferem, e viaja para a página pelo
   "toString()". Duas contas escritas separadas seriam duas contas
   divergindo.

   ─── AS REGRAS (Thomas, 28/10; as marcadas "minha" estão a confirmar) ──
   Recorte            eventos dos seis canais que já abriram as ofertas e
                      encerram a partir de 30 dias atrás.
   Veículo ativo      veículo distinto com negociação num evento aberto
   no dia             naquele dia (do dia do início das ofertas ao dia do
                      fim). O mesmo carro em dois feirões no mesmo dia conta
                      uma vez.
   Novo no dia        o dia em que o veículo ESTREOU: o início das ofertas
                      do primeiro evento da vida dele, em qualquer canal.
                      (minha — o pedido diz "cadastrados no dia"; ver o
                      README sobre por que não é vehicles.created_at)
   Status do cartão   de cada veículo dos eventos ativos no dia, a
                      negociação no evento mais recente, em funil (Thomas,
                      06/11): Com oferta (teve lance ou vendeu) contém VMV
                      atingido (lance >= VMV ou vendeu), que contém Vendido
                      (2, 3, 7). Removido (8, 10) à parte. Sem oferta, o
                      resto, não tem cartão.
   Gráfico            acumulado no evento: o veículo ativo no dia com
                      acesso, lance ou venda do começo do evento até o dia.
                      Hoje, fecha com os cartões.
   Venda              negociação em 2, 3 ou 7; o dia é o da oferta vencedora.
   Logou              qualquer acesso da loja ao canal (access_logs).
   Acessou            abriu algum anúncio dos eventos filtrados.
   Responsável        o consultor da carteira comercial, pelo CNPJ da loja.
                      Recorta as LOJAS, nunca os veículos (como no Radar).

   ⚠️ Sem barra invertida, crase ou cifrão-chave neste arquivo: ele viaja pro
   n8n como string.
   ══════════════════════════════════════════════════════════════════════ */

/* TEMA:INICIO */
const CSS_TEMA = [
  ':root{--marca-azul:       #1523A0;--marca-azul-claro: #487DEA;--marca-cinza:      #E4E6E6;',
  '--marca-vinho:      #6F4047;--marca-vermelho:   #7F1112;--d-verde:          #0E7C55;',
  '--d-verde-vivo:     #35C08A;--d-vermelho-vivo:  #EF5B60;--r-g: 22px;--r-m: 14px;--r-p: 11px;',
  '--gap: 16px;--topo-h: 68px;',
  '--fonte: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,"Helvetica Neue", Arial, "Noto Sans", sans-serif;',
  '}:root,[data-tema="claro"]{color-scheme: light;--fundo:          #D8E1E9;',
  '--fundo-veu:      radial-gradient(420px 300px at 0% -14%,rgba(255,255,255,.72), transparent 70%),radial-gradient(1200px 900px at 100% 100%,rgba(128,155,178,.50), transparent 66%);',
  '--superficie:     #FAFCFD;--superficie-2:   #EDF1F5;--borda:          #E3E9EE;',
  '--borda-forte:    #C9D4DD;--texto:          #3A4552;--texto-2:        #55626F;',
  '--texto-3:        #6F7D89;--acento:         #3A4552;--acento-cheio:   var(--marca-azul-claro);',
  '--acento-veu:     rgba(58,69,82,.07);--positivo:       #0C6E4B;',
  '--negativo:       var(--marca-vermelho);--atencao:        var(--marca-vinho);',
  '--grade:          rgba(23,33,43,.06);',
  '--sombra:         0 1px 1px  rgba(23,33,43,.03),0 6px 16px rgba(23,33,43,.05),0 18px 44px rgba(23,33,43,.07),inset 0 1px 0 rgba(255,255,255,.85);',
  '--cartao-borda:   1px solid rgba(255,255,255,.72);',
  '--cartao-fundo:   linear-gradient(155deg, rgba(255,255,255,.82) 0%,rgba(255,255,255,.95) 58%);',
  '--cartao-blur:    blur(18px) saturate(115%);',
  '--brilho:         radial-gradient(420px 260px at 0% 0%,rgba(86,112,138,.13), transparent 72%);}',
  '[data-tema="escuro"]{color-scheme: dark;--fundo:          #0B0D12;',
  '--fundo-veu:      radial-gradient(900px 500px at 8% -8%,rgba(72,125,234,.20), transparent 62%),radial-gradient(800px 500px at 96% 4%,rgba(111,64,71,.16), transparent 60%);',
  '--superficie:     #12151D;--superficie-2:   #171B25;--borda:          rgba(255,255,255,.09);',
  '--borda-forte:    rgba(255,255,255,.16);--texto:          #EDEFF5;--texto-2:        #A4ABBF;',
  '--texto-3:        #6E7589;--acento:         var(--marca-azul-claro);',
  '--acento-cheio:   var(--marca-azul-claro);--acento-veu:     rgba(72,125,234,.18);',
  '--positivo:       var(--d-verde-vivo);--negativo:       var(--d-vermelho-vivo);',
  '--atencao:        #C98A92;--grade:          rgba(255,255,255,.07);',
  '--sombra:         0 1px 1px rgba(0,0,0,.4), 0 16px 40px rgba(0,0,0,.45);',
  '--cartao-borda:   1px solid rgba(255,255,255,.08);',
  '--cartao-fundo:   linear-gradient(158deg, rgba(255,255,255,.075),rgba(255,255,255,.025));',
  '--cartao-blur:    blur(16px) saturate(140%);',
  '--brilho:         radial-gradient(420px 180px at 0% 0%,rgba(72,125,234,.16), transparent 70%);}',
  '*,*::before,*::after{ box-sizing:border-box }html{ -webkit-text-size-adjust:100% }body{margin:0;',
  'font-family:var(--fonte);font-size:14px;line-height:1.45;color:var(--texto);',
  'background-color:var(--fundo);background-image:var(--fundo-veu);background-attachment:fixed;',
  'background-repeat:no-repeat;-webkit-font-smoothing:antialiased;}h1,h2,h3{ margin:0;',
  ' font-weight:650; letter-spacing:-.01em }p{ margin:0 }.num{ font-variant-numeric:tabular-nums;',
  ' font-feature-settings:"tnum" 1 }.topo{position:sticky; top:0; z-index:30;',
  'background:transparent;backdrop-filter:var(--cartao-blur);',
  '-webkit-backdrop-filter:var(--cartao-blur);}.topo-in{max-width:1680px; margin:0 auto;',
  'min-height:var(--topo-h);padding:10px 20px;display:grid; grid-template-columns:1fr auto 1fr;',
  'align-items:center; gap:16px;}.marca{ justify-self:start; min-width:0; display:block;',
  ' line-height:0 }.logo{ height:26px; width:auto; display:block; flex:none }.logo-curta{',
  ' display:none }.topo-tit{ text-align:center; min-width:0 }.topo-tit h1{ font-size:22px;',
  ' letter-spacing:-.01em }.topo-tit .sub{ font-size:12.5px; color:var(--texto-2); margin-top:1px }',
  '.topo-acoes{ display:flex; align-items:center; justify-content:flex-end;gap:8px; flex-wrap:wrap;',
  ' justify-self:end }:root:not([data-tema="escuro"]) .ctrl{background:rgba(255,255,255,.55);',
  'border-color:rgba(255,255,255,.7);',
  'box-shadow:inset 0 1px 2px rgba(23,33,43,.06),0 1px 0 rgba(255,255,255,.9);}',
  ':root:not([data-tema="escuro"]) .chip{background:var(--acento);color:#FFFFFF;}',
  ':root:not([data-tema="escuro"]) .g4 .cartao{',
  'box-shadow:0 1px 1px rgba(23,33,43,.03),0 4px 12px rgba(23,33,43,.05),inset 0 1px 0 rgba(255,255,255,.85);',
  '}.ctrl{font:inherit; font-size:13px; color:var(--texto);background:var(--superficie-2);',
  'border:1px solid var(--borda);border-radius:var(--r-p);padding:7px 11px;cursor:pointer;',
  'transition:border-color .15s, background .15s;}.ctrl:hover{ border-color:var(--borda-forte) }',
  '.ctrl:focus-visible{ outline:2px solid var(--acento); outline-offset:1px }select.ctrl{',
  ' padding-right:26px }.ctrl.so-icone{ padding:7px; display:inline-flex; align-items:center }',
  '.ctrl.so-icone svg{ width:16px; height:16px; display:block; stroke:currentColor;fill:none;',
  ' stroke-width:1.9; stroke-linecap:round;stroke-linejoin:round }.area{max-width:1680px;',
  ' margin:0 auto;padding:var(--gap) 20px 48px;display:flex; flex-direction:column; gap:var(--gap);',
  '}.g4{ display:grid; gap:var(--gap); grid-template-columns:repeat(4,1fr) }.g2{ display:grid;',
  ' gap:var(--gap); grid-template-columns:2fr 1fr }@media (max-width:1100px){.g4{',
  ' grid-template-columns:repeat(2,1fr) }.g2{ grid-template-columns:1fr }}@media (max-width:620px){',
  '.g4{ grid-template-columns:1fr }.area{ padding:12px 12px 40px }.topo-in{ padding:10px 12px;',
  ' grid-template-columns:auto 1fr auto; gap:8px }.logo-extensa{ display:none }.logo-curta{',
  ' display:block; height:22px }.topo-tit h1{ font-size:16px }}.cartao{position:relative;',
  'background:var(--cartao-fundo);border:var(--cartao-borda);border-radius:var(--r-g);',
  'box-shadow:var(--sombra);backdrop-filter:var(--cartao-blur);',
  '-webkit-backdrop-filter:var(--cartao-blur);padding:18px;overflow:hidden;}.cartao::before{',
  'content:""; position:absolute; inset:0;background:var(--brilho);pointer-events:none;}',
  '.cartao > *{ position:relative }.cartao-topo{display:flex; align-items:center; gap:10px;',
  'margin-bottom:14px;}.cartao-topo h2{ font-size:14.5px; font-weight:650 }.cartao-topo .dir{',
  ' margin-left:auto; display:flex; gap:6px; align-items:center }.chip{flex:none; width:34px;',
  ' height:34px; border-radius:50%;display:grid; place-items:center;background:var(--acento-veu);',
  'color:var(--acento);}.chip svg{ width:17px; height:17px; stroke:currentColor; fill:none;',
  'stroke-width:1.9; stroke-linecap:round; stroke-linejoin:round }.g4 .cartao{ padding:13px 14px }',
  '.g4 .cartao-topo{ margin-bottom:6px; gap:8px }.g4 .chip{ width:26px; height:26px }.g4 .chip svg{',
  ' width:14px; height:14px }.kpi-rot{ font-size:12.5px; color:var(--texto-2); font-weight:500 }',
  '.kpi-val{font-size:23px; line-height:1.15; font-weight:700; letter-spacing:-.015em;',
  'margin:4px 0 2px;}.kpi-delta{ font-size:11.5px; font-weight:600; display:inline-flex; gap:4px;',
  'align-items:center }.sobe{ color:var(--positivo) } .desce{ color:var(--negativo) }.neutro{',
  ' color:var(--texto-3) }.kpi-pe{display:flex; gap:16px;margin-top:9px; padding-top:8px;',
  'border-top:1px solid var(--borda);}.kpi-pe div{ min-width:0 }.kpi-pe dt{ font-size:11px;',
  ' color:var(--texto-3); white-space:nowrap;overflow:hidden; text-overflow:ellipsis }.kpi-pe dd{',
  ' margin:1px 0 0; font-size:13.5px; font-weight:650 }.graf{ width:100%; height:auto;',
  ' display:block; overflow:visible }.graf .eixo{ font-size:10.5px; fill:var(--texto-3) }',
  '.graf .linha-grade{ stroke:var(--grade); stroke-width:1 }.graf .serie{ fill:none;',
  ' stroke:var(--acento-cheio); stroke-width:2.25;stroke-linecap:round; stroke-linejoin:round }',
  '.graf .area-serie{ fill:url(#veu-serie); stroke:none }.graf .ponto{ fill:var(--acento-cheio) }',
  '.graf .rotulo{ font-size:11px; font-weight:650; fill:var(--texto);',
  'font-variant-numeric:tabular-nums }.rank{ list-style:none; margin:0; padding:0; display:flex;',
  'flex-direction:column; gap:11px }.rank li{ display:grid; grid-template-columns:22px 1fr auto;',
  ' gap:10px;align-items:center }.rank .pos{ font-size:12px; color:var(--texto-3);',
  ' text-align:right }.rank .nome{ display:block; font-size:13px; overflow:hidden;',
  'text-overflow:ellipsis; white-space:nowrap }.rank .barra{ display:block; height:5px;',
  ' border-radius:3px;background:var(--acento-veu); margin-top:5px; overflow:hidden }',
  '.rank .barra i{ display:block; height:100%; border-radius:3px;background:var(--acento-cheio) }',
  '.rank .val{ font-size:13px; font-weight:650 }.rolo{ overflow-x:auto; margin:0 -18px -18px;',
  ' padding:0 18px 18px }table{ width:100%; border-collapse:collapse; font-size:13px }thead th{',
  'position:sticky; top:0;background:var(--superficie-2);color:var(--texto-2); font-weight:600;',
  ' font-size:12px;text-align:center; white-space:nowrap;padding:9px 10px;',
  'border-bottom:1px solid var(--borda);}tbody td{ padding:9px 10px; text-align:center;',
  'border-bottom:1px solid var(--borda) }tbody td:first-child, thead th:first-child{',
  ' text-align:left }tbody tr:last-child td{ border-bottom:none }tbody tr:hover td{',
  ' background:var(--acento-veu) }.tag{display:inline-block; font-size:11.5px; font-weight:600;',
  'padding:2px 8px; border-radius:999px;background:var(--acento-veu); color:var(--acento);}.tag.ok{',
  ' background:color-mix(in srgb, var(--positivo) 16%, transparent);color:var(--positivo) }',
  '.tag.ruim{ background:color-mix(in srgb, var(--negativo) 16%, transparent);',
  'color:var(--negativo) }.tag.atencao{',
  ' background:color-mix(in srgb, var(--atencao) 18%, transparent);color:var(--atencao) }.rodape{',
  ' color:var(--texto-3); font-size:12px; padding:4px 2px 0 }.rodape a{ color:var(--acento) }',
  '.gloss{ padding:0 }.gloss > summary{cursor:pointer; padding:18px; margin:0;list-style:none;',
  'border-radius:var(--r-g);}.gloss > summary::-webkit-details-marker{ display:none }',
  '.gloss > summary:focus-visible{ outline:2px solid var(--acento); outline-offset:-2px }',
  '.gloss .seta{ color:var(--texto-3); font-size:11px; transition:transform .15s }',
  '.gloss[open] > summary{ border-radius:var(--r-g) var(--r-g) 0 0 }.gloss[open] .seta{',
  ' transform:rotate(180deg) }.gloss dl{margin:0; padding:0 18px 18px;display:grid;',
  ' grid-template-columns:auto 1fr; gap:9px 18px;font-size:12.5px;}.gloss dt{ font-weight:650;',
  ' white-space:nowrap }.gloss dd{ margin:0; color:var(--texto-2) }@media (max-width:620px){',
  '.gloss dl{ grid-template-columns:1fr; gap:2px 0 }.gloss dt{ white-space:normal; margin-top:8px }',
  '.gloss dt:first-child{ margin-top:0 }}@media print{body{ background:#fff; color:#000 }.topo{',
  ' position:static }.topo-acoes{ display:none }.cartao{ box-shadow:none; border:1px solid #ccc;',
  ' backdrop-filter:none;break-inside:avoid }.cartao::before{ display:none }}',
  '@media (prefers-reduced-motion:reduce){*{ transition:none !important;',
  ' animation:none !important }}'
].join('');
/* TEMA:FIM */
/* LOGOS:INICIO */
const LOGO = {"claro":{"extensa":"data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgOTMzIDE2OCIgd2lkdGg9IjkzMyIgaGVpZ2h0PSIxNjgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHhtbDpzcGFjZT0icHJlc2VydmUiIG92ZXJmbG93PSJoaWRkZW4iPjxkZWZzPjxjbGlwUGF0aCBpZD0iY2xpcDAiPjxyZWN0IHg9IjIwIiB5PSIxNCIgd2lkdGg9IjkzMyIgaGVpZ2h0PSIxNjgiLz48L2NsaXBQYXRoPjwvZGVmcz48ZyBjbGlwLXBhdGg9InVybCgjY2xpcDApIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMjAgLTE0KSI+PHBhdGggZD0iTTU0MC40MTggNjMuOTcwMyA1NDAuNDE4IDM4Ljk4NTEgNDY1LjQ2MyAzOC45ODUxIDQ2NS40NjMgMTQgNTQwLjQxOCAxNCA1NDAuNDE4IDM4Ljk4NTEgNTY1LjQwMyAzOC45ODUxIDU2NS40MDMgNjMuOTcwMyA1NDAuNDE4IDYzLjk3MDNaTTQ2NS40NjMgMTM4LjkyNiA0NjUuNDYzIDg4Ljk1NTQgNDkwLjQ0OCA4OC45NTU0IDQ5MC40NDggMTEzLjk0MSA1NjUuNDAzIDExMy45NDEgNTY1LjQwMyAxMzguOTI2IDQ2NS40NjMgMTM4LjkyNlpNNDkwLjQ0OCA4OC45NTU0IDQ5MC40NDggNjMuOTcwMyA1NDAuNDE4IDYzLjk3MDMgNTQwLjQxOCA4OC45NTU0IDQ5MC40NDggODguOTU1NFoiIGZpbGw9IiMzQTQ1NTIiLz48cGF0aCBkPSJNMzE5Ljc0OSA0My4zODI1IDMxNC43NTIgNjQuMDcwMkMzMTAuMzU1IDYxLjc3MTYgMzAzLjk1OSA2MC41NzIzIDI5OC44NjIgNjAuNTcyMyAyODUuNTcgNjAuNTcyMyAyNzYuMDc1IDY5Ljk2NjcgMjc2LjA3NSA4Ni4yNTdMMjc2LjA3NSAxMzguOTI2IDI1NS4xODggMTM4LjkyNiAyNTUuMTg4IDQzLjE4MjYgMjc1Ljg3NSA0My4xODI2IDI3NS44NzUgNTMuOTc2MkMyODIuMTcyIDQ0Ljg4MTYgMjkxLjk2NiA0MC42ODQxIDMwMy42NTkgNDAuNjg0MSAzMTUuMzUyIDQwLjY4NDEgMzE0Ljk1MiA0MS40ODM2IDMxOS43NDkgNDMuMzgyNVoiIGZpbGw9IiMzQTQ1NTIiLz48cGF0aCBkPSJNNDA0LjE5OSA2Ny4xNjg0QzM5OC40MDIgNjMuNTcwNSAzODYuNTEgNTguOTczMiAzNzQuNjE3IDU4Ljk3MzIgMzYyLjcyNCA1OC45NzMyIDM1Ni41MjcgNjMuNTcwNSAzNTYuNTI3IDcwLjM2NjUgMzU2LjUyNyA3Ny4xNjI0IDM2My41MjMgNzguOTYxMyAzNzIuMzE4IDgwLjI2MDZMMzgyLjIxMiA4MS43NTk3QzQwMy4xIDg0Ljc1NzkgNDE1LjQ5MiA5My42NTI2IDQxNS40OTIgMTEwLjA0MyA0MTUuNDkyIDEyNi40MzMgMzk5LjUwMiAxNDEuMzI0IDM3MS45MTggMTQxLjMyNCAzNDQuMzM1IDE0MS4zMjQgMzQ0LjgzNCAxMzkuNDI1IDMzMC44NDMgMTI5LjAzMkwzNDAuNTM3IDExMy4zNDFDMzQ3LjQzMyAxMTguNjM4IDM1Ni41MjcgMTIzLjEzNSAzNzIuMTE4IDEyMy4xMzUgMzg3LjcwOSAxMjMuMTM1IDM5My45MDUgMTE4LjYzOCAzOTMuOTA1IDExMS40NDIgMzkzLjkwNSAxMDQuMjQ2IDM4OC43MDggMTAyLjQ0NyAzNzcuMzE1IDEwMC44NDhMMzY3LjMyMSA5OS41NDkxQzM0Ni4xMzQgOTYuNjUwOCAzMzQuODQgODYuODU2NiAzMzQuODQgNzEuNDY1OCAzMzQuODQgNTYuMDc1IDM1MC4wMzEgNDAuNzg0MSAzNzQuNDE3IDQwLjc4NDEgMzk4LjgwMiA0MC43ODQxIDQwMy4zIDQ0LjQ4MTkgNDEzLjE5NCA1MC44NzgxTDQwNC4xOTkgNjcuMTY4NFoiIGZpbGw9IiMzQTQ1NTIiLz48cGF0aCBkPSJNNjQ0LjY1NiAxODIgNjIxLjQ3IDE4MiA2NTUuNzQ5IDEyMS43MzYgNjEzLjI3NSA0NS42ODExIDYzNi43NjEgNDUuNjgxMSA2NjcuNTQyIDEwMC42NDggNjk3LjIyNSA0NS42ODExIDcyMC4yMTEgNDUuNjgxMSA2NDQuNjU2IDE4MloiIGZpbGw9IiMzQTQ1NTIiLz48cGF0aCBkPSJNOTUyLjc3MiAxMDAuODQ4Qzk1Mi43NzIgMTMxLjMzIDkzMC43ODYgMTQzLjkyMyA5MDguMzk5IDE0My45MjMgODg2LjAxMiAxNDMuOTIzIDg2NC4wMjUgMTMxLjMzIDg2NC4wMjUgMTAwLjg0OEw4NjQuMDI1IDQ1LjY4MTEgODg1LjAxMyA0NS42ODExIDg4NS4wMTMgOTguOTQ5NEM4ODUuMDEzIDExNy40MzggODk1LjMwNyAxMjQuMjM0IDkwOC4zOTkgMTI0LjIzNCA5MjEuNDkxIDEyNC4yMzQgOTMxLjc4NSAxMTcuNDM4IDkzMS43ODUgOTguOTQ5NEw5MzEuNzg1IDQ1LjY4MTEgOTUyLjc3MiA0NS42ODExIDk1Mi43NzIgMTAwLjg0OFoiIGZpbGw9IiMzQTQ1NTIiLz48cGF0aCBkPSJNMTA2LjM3NiA1NS45NzUgOTIuOTg0MiA3MC4yNjY1Qzg2LjI4ODIgNjMuOTcwMyA3OS4xOTI0IDYwLjM3MjQgNjkuOTk3OSA2MC4zNzI0IDUzLjkwNzUgNjAuMzcyNCA0MS43MTQ4IDcyLjk2NDkgNDEuNzE0OCA5MS4wNTQxIDQxLjcxNDggMTA5LjE0MyA1My45MDc1IDEyMS43MzYgNjkuOTk3OSAxMjEuNzM2IDg2LjA4ODMgMTIxLjczNiA4Ny4zODc2IDExNy40MzggOTMuNDgzOSAxMTEuNzQyTDEwNi4zNzYgMTI2LjEzM0M5Ny42ODE0IDEzNi4yMjcgODQuODg5MSAxNDEuNDI0IDcwLjU5NzYgMTQxLjQyNCA0MC4xMTU3IDE0MS40MjQgMjAuMjI3NSAxMTkuNzM3IDIwLjIyNzUgOTEuMDU0MSAyMC4yMjc1IDYyLjM3MTIgNDAuMTE1NyA0MC42ODQxIDcwLjU5NzYgNDAuNjg0MSAxMDEuMDc5IDQwLjY4NDEgOTcuODgxMyA0NS44ODEgMTA2LjM3NiA1NS45NzVaIiBmaWxsPSIjM0E0NTUyIi8+PHBhdGggZD0iTTIyMS45MDggMTM4LjkyNiAyMDEuMDIgMTM4LjkyNiAyMDEuMDIgMTI3LjQzMkMxOTQuNDI0IDEzNS45MjcgMTg0LjUzIDE0MS40MjQgMTcwLjkzOCAxNDEuNDI0IDE0NC4xNTQgMTQxLjQyNCAxMjMuMDY2IDEyMC4zMzcgMTIzLjA2NiA5MS4wNTQxIDEyMy4wNjYgNjEuNzcxNiAxNDQuMTU0IDQwLjY4NDEgMTcwLjkzOCA0MC42ODQxIDE5Ny43MjIgNDAuNjg0MSAxOTQuNDI0IDQ2LjI4MDggMjAxLjAyIDU0Ljc3NTdMMjAxLjAyIDQzLjE4MjYgMjIxLjkwOCA0My4xODI2IDIyMS45MDggMTM4LjkyNlpNMTQ0LjU1NCA5MS4wNTQxQzE0NC41NTQgMTA3Ljg0NCAxNTUuNDQ3IDEyMS43MzYgMTczLjQzNiAxMjEuNzM2IDE5MS40MjYgMTIxLjczNiAyMDIuMzE5IDEwOC41NDQgMjAyLjMxOSA5MS4wNTQxIDIwMi4zMTkgNzMuNTY0NSAxOTAuNzI2IDYwLjM3MjQgMTczLjQzNiA2MC4zNzI0IDE1Ni4xNDcgNjAuMzcyNCAxNDQuNTU0IDc0LjI2NDEgMTQ0LjU1NCA5MS4wNTQxWiIgZmlsbD0iIzNBNDU1MiIvPjxwYXRoIGQ9Ik04MzUuMTQzIDkzLjU1MjdDODM1LjE0MyAxMjIuMjM2IDgxMy4xNTYgMTQzLjkyMyA3ODMuNTczIDE0My45MjMgNzUzLjk5MSAxNDMuOTIzIDczMi4xMDQgMTIyLjIzNiA3MzIuMTA0IDkzLjU1MjcgNzMyLjEwNCA2NC44Njk3IDc1My45OTEgNDMuMTgyNiA3ODMuNTczIDQzLjE4MjYgODEzLjE1NiA0My4xODI2IDgzNS4xNDMgNjQuODY5NyA4MzUuMTQzIDkzLjU1MjdaTTc1My41OTEgOTMuNTUyN0M3NTMuNTkxIDExMS42NDIgNzY2LjQ4MyAxMjQuMjM0IDc4My41NzMgMTI0LjIzNCA4MDAuNjYzIDEyNC4yMzQgODEzLjY1NSAxMTEuNjQyIDgxMy42NTUgOTMuNTUyNyA4MTMuNjU1IDc1LjQ2MzQgODAwLjY2MyA2Mi44NzA5IDc4My41NzMgNjIuODcwOSA3NjYuNDgzIDYyLjg3MDkgNzUzLjU5MSA3NS40NjM0IDc1My41OTEgOTMuNTUyN1oiIGZpbGw9IiMzQTQ1NTIiLz48L2c+PC9zdmc+","curta":"data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgOTkwIDQ1NCIgd2lkdGg9Ijk5MCIgaGVpZ2h0PSI0NTQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHhtbDpzcGFjZT0icHJlc2VydmUiIG92ZXJmbG93PSJoaWRkZW4iPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDk2IC0xOTcpIj48cGF0aCBkPSJNMjE5Ljc4IDEzOC4yNTggMTg1LjU4MyAxNzUuMjczQzE2OC41MjEgMTU4Ljk2OSAxNTAuMzc2IDE0OS42NDIgMTI2Ljk1MiAxNDkuNjQyIDg1Ljg4NzYgMTQ5LjY0MiA1NC44MDAzIDE4Mi4yNSA1NC44MDAzIDIyOS4xNzkgNTQuODAwMyAyNzYuMTA4IDg1Ljg4NzYgMzA4LjcxNiAxMjYuOTUyIDMwOC43MTYgMTUwLjQ0OCAzMDguNzE2IDE3MS4zNDEgMjk3LjU1MyAxODYuODg1IDI4Mi43OTFMMjE5Ljc4IDMyMC4wOTlDMTk3LjU4NSAzNDYuMjQ1IDE2NC45OCAzNTkuNzU4IDEyOC40NyAzNTkuNzU4IDUwLjc1MTcgMzU5LjY4NCAwIDMwMy41MDEgMCAyMjkuMTc5IDAgMTU0Ljg1NiA1MC43NTE3IDk4LjYwMDEgMTI4LjU0MiA5OC42MDAxIDE2NC45OCA5OC42MDAxIDE5OC4xNjMgMTEyLjA0IDIxOS44NTEgMTM4LjI1OEwyMTkuNzggMTM4LjI1OFoiIGZpbGw9IiMzQTQ1NTIiIHRyYW5zZm9ybT0ibWF0cml4KDEgMCAwIDEuMDAxMzEgLTk2IDE5NykiLz48cGF0aCBkPSJNNTMyLjI5MSAxNDMuODIyIDUzMi4yOTEgNzEuODcgMzQyLjQzNiA3MS44NyAzNDIuNDM2IDAgNTMyLjI5MSAwIDUzMi4yOTEgNzEuOTUxNiA1OTUuNTk5IDcxLjk1MTYgNTk1LjU5OSAxNDMuOTAzIDUzMi4yOTEgMTQzLjkwMyA1MzIuMjkxIDE0My44MjJaTTM0Mi40MzYgMzU5LjY3NiAzNDIuNDM2IDIxNS44NTUgNDA1Ljc0NCAyMTUuODU1IDQwNS43NDQgMjg3LjgwNiA1OTUuNTk5IDI4Ny44MDYgNTk1LjU5OSAzNTkuNzU4IDM0Mi40MzYgMzU5Ljc1OCAzNDIuNDM2IDM1OS42NzZaTTQwNS42NzMgMjE1Ljc3MyA0MDUuNjczIDE0My44MjIgNTMyLjIxOCAxNDMuODIyIDUzMi4yMTggMjE1Ljc3MyA0MDUuNjczIDIxNS43NzNaIiBmaWxsPSIjM0E0NTUyIiB0cmFuc2Zvcm09Im1hdHJpeCgxIDAgMCAxLjAwMTMxIC05NiAxOTcpIi8+PHBhdGggZD0iTTc5Ni45NzEgNDUzLjAyOSA3MzcuNzY4IDQ1My4wMjkgODI1LjM0NCAyOTYuMzMxIDcxNi44NSA5OC42MDAxIDc3Ni44NTEgOTguNjAwMSA4NTUuNDUxIDI0MS41MiA5MzEuMzAzIDk4LjYwMDEgOTkwIDk4LjYwMDEgNzk2Ljk3MSA0NTMuMDI5WiIgZmlsbD0iIzNBNDU1MiIgdHJhbnNmb3JtPSJtYXRyaXgoMSAwIDAgMS4wMDEzMSAtOTYgMTk3KSIvPjwvZz48L3N2Zz4="},"escuro":{"extensa":"data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgOTMzIDE2OCIgd2lkdGg9IjkzMyIgaGVpZ2h0PSIxNjgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHhtbDpzcGFjZT0icHJlc2VydmUiIG92ZXJmbG93PSJoaWRkZW4iPjxkZWZzPjxjbGlwUGF0aCBpZD0iY2xpcDAiPjxyZWN0IHg9IjIwIiB5PSIxNCIgd2lkdGg9IjkzMyIgaGVpZ2h0PSIxNjgiLz48L2NsaXBQYXRoPjwvZGVmcz48ZyBjbGlwLXBhdGg9InVybCgjY2xpcDApIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMjAgLTE0KSI+PHBhdGggZD0iTTU0MC40MTggNjMuOTcwMyA1NDAuNDE4IDM4Ljk4NTEgNDY1LjQ2MyAzOC45ODUxIDQ2NS40NjMgMTQgNTQwLjQxOCAxNCA1NDAuNDE4IDM4Ljk4NTEgNTY1LjQwMyAzOC45ODUxIDU2NS40MDMgNjMuOTcwMyA1NDAuNDE4IDYzLjk3MDNaTTQ2NS40NjMgMTM4LjkyNiA0NjUuNDYzIDg4Ljk1NTQgNDkwLjQ0OCA4OC45NTU0IDQ5MC40NDggMTEzLjk0MSA1NjUuNDAzIDExMy45NDEgNTY1LjQwMyAxMzguOTI2IDQ2NS40NjMgMTM4LjkyNlpNNDkwLjQ0OCA4OC45NTU0IDQ5MC40NDggNjMuOTcwMyA1NDAuNDE4IDYzLjk3MDMgNTQwLjQxOCA4OC45NTU0IDQ5MC40NDggODguOTU1NFoiIGZpbGw9IiNGRkZGRkYiLz48cGF0aCBkPSJNMzE5Ljc0OSA0My4zODI1IDMxNC43NTIgNjQuMDcwMkMzMTAuMzU1IDYxLjc3MTYgMzAzLjk1OSA2MC41NzIzIDI5OC44NjIgNjAuNTcyMyAyODUuNTcgNjAuNTcyMyAyNzYuMDc1IDY5Ljk2NjcgMjc2LjA3NSA4Ni4yNTdMMjc2LjA3NSAxMzguOTI2IDI1NS4xODggMTM4LjkyNiAyNTUuMTg4IDQzLjE4MjYgMjc1Ljg3NSA0My4xODI2IDI3NS44NzUgNTMuOTc2MkMyODIuMTcyIDQ0Ljg4MTYgMjkxLjk2NiA0MC42ODQxIDMwMy42NTkgNDAuNjg0MSAzMTUuMzUyIDQwLjY4NDEgMzE0Ljk1MiA0MS40ODM2IDMxOS43NDkgNDMuMzgyNVoiIGZpbGw9IiNGRkZGRkYiLz48cGF0aCBkPSJNNDA0LjE5OSA2Ny4xNjg0QzM5OC40MDIgNjMuNTcwNSAzODYuNTEgNTguOTczMiAzNzQuNjE3IDU4Ljk3MzIgMzYyLjcyNCA1OC45NzMyIDM1Ni41MjcgNjMuNTcwNSAzNTYuNTI3IDcwLjM2NjUgMzU2LjUyNyA3Ny4xNjI0IDM2My41MjMgNzguOTYxMyAzNzIuMzE4IDgwLjI2MDZMMzgyLjIxMiA4MS43NTk3QzQwMy4xIDg0Ljc1NzkgNDE1LjQ5MiA5My42NTI2IDQxNS40OTIgMTEwLjA0MyA0MTUuNDkyIDEyNi40MzMgMzk5LjUwMiAxNDEuMzI0IDM3MS45MTggMTQxLjMyNCAzNDQuMzM1IDE0MS4zMjQgMzQ0LjgzNCAxMzkuNDI1IDMzMC44NDMgMTI5LjAzMkwzNDAuNTM3IDExMy4zNDFDMzQ3LjQzMyAxMTguNjM4IDM1Ni41MjcgMTIzLjEzNSAzNzIuMTE4IDEyMy4xMzUgMzg3LjcwOSAxMjMuMTM1IDM5My45MDUgMTE4LjYzOCAzOTMuOTA1IDExMS40NDIgMzkzLjkwNSAxMDQuMjQ2IDM4OC43MDggMTAyLjQ0NyAzNzcuMzE1IDEwMC44NDhMMzY3LjMyMSA5OS41NDkxQzM0Ni4xMzQgOTYuNjUwOCAzMzQuODQgODYuODU2NiAzMzQuODQgNzEuNDY1OCAzMzQuODQgNTYuMDc1IDM1MC4wMzEgNDAuNzg0MSAzNzQuNDE3IDQwLjc4NDEgMzk4LjgwMiA0MC43ODQxIDQwMy4zIDQ0LjQ4MTkgNDEzLjE5NCA1MC44NzgxTDQwNC4xOTkgNjcuMTY4NFoiIGZpbGw9IiNGRkZGRkYiLz48cGF0aCBkPSJNNjQ0LjY1NiAxODIgNjIxLjQ3IDE4MiA2NTUuNzQ5IDEyMS43MzYgNjEzLjI3NSA0NS42ODExIDYzNi43NjEgNDUuNjgxMSA2NjcuNTQyIDEwMC42NDggNjk3LjIyNSA0NS42ODExIDcyMC4yMTEgNDUuNjgxMSA2NDQuNjU2IDE4MloiIGZpbGw9IiNGRkZGRkYiLz48cGF0aCBkPSJNOTUyLjc3MiAxMDAuODQ4Qzk1Mi43NzIgMTMxLjMzIDkzMC43ODYgMTQzLjkyMyA5MDguMzk5IDE0My45MjMgODg2LjAxMiAxNDMuOTIzIDg2NC4wMjUgMTMxLjMzIDg2NC4wMjUgMTAwLjg0OEw4NjQuMDI1IDQ1LjY4MTEgODg1LjAxMyA0NS42ODExIDg4NS4wMTMgOTguOTQ5NEM4ODUuMDEzIDExNy40MzggODk1LjMwNyAxMjQuMjM0IDkwOC4zOTkgMTI0LjIzNCA5MjEuNDkxIDEyNC4yMzQgOTMxLjc4NSAxMTcuNDM4IDkzMS43ODUgOTguOTQ5NEw5MzEuNzg1IDQ1LjY4MTEgOTUyLjc3MiA0NS42ODExIDk1Mi43NzIgMTAwLjg0OFoiIGZpbGw9IiNGRkZGRkYiLz48cGF0aCBkPSJNMTA2LjM3NiA1NS45NzUgOTIuOTg0MiA3MC4yNjY1Qzg2LjI4ODIgNjMuOTcwMyA3OS4xOTI0IDYwLjM3MjQgNjkuOTk3OSA2MC4zNzI0IDUzLjkwNzUgNjAuMzcyNCA0MS43MTQ4IDcyLjk2NDkgNDEuNzE0OCA5MS4wNTQxIDQxLjcxNDggMTA5LjE0MyA1My45MDc1IDEyMS43MzYgNjkuOTk3OSAxMjEuNzM2IDg2LjA4ODMgMTIxLjczNiA4Ny4zODc2IDExNy40MzggOTMuNDgzOSAxMTEuNzQyTDEwNi4zNzYgMTI2LjEzM0M5Ny42ODE0IDEzNi4yMjcgODQuODg5MSAxNDEuNDI0IDcwLjU5NzYgMTQxLjQyNCA0MC4xMTU3IDE0MS40MjQgMjAuMjI3NSAxMTkuNzM3IDIwLjIyNzUgOTEuMDU0MSAyMC4yMjc1IDYyLjM3MTIgNDAuMTE1NyA0MC42ODQxIDcwLjU5NzYgNDAuNjg0MSAxMDEuMDc5IDQwLjY4NDEgOTcuODgxMyA0NS44ODEgMTA2LjM3NiA1NS45NzVaIiBmaWxsPSIjRkZGRkZGIi8+PHBhdGggZD0iTTIyMS45MDggMTM4LjkyNiAyMDEuMDIgMTM4LjkyNiAyMDEuMDIgMTI3LjQzMkMxOTQuNDI0IDEzNS45MjcgMTg0LjUzIDE0MS40MjQgMTcwLjkzOCAxNDEuNDI0IDE0NC4xNTQgMTQxLjQyNCAxMjMuMDY2IDEyMC4zMzcgMTIzLjA2NiA5MS4wNTQxIDEyMy4wNjYgNjEuNzcxNiAxNDQuMTU0IDQwLjY4NDEgMTcwLjkzOCA0MC42ODQxIDE5Ny43MjIgNDAuNjg0MSAxOTQuNDI0IDQ2LjI4MDggMjAxLjAyIDU0Ljc3NTdMMjAxLjAyIDQzLjE4MjYgMjIxLjkwOCA0My4xODI2IDIyMS45MDggMTM4LjkyNlpNMTQ0LjU1NCA5MS4wNTQxQzE0NC41NTQgMTA3Ljg0NCAxNTUuNDQ3IDEyMS43MzYgMTczLjQzNiAxMjEuNzM2IDE5MS40MjYgMTIxLjczNiAyMDIuMzE5IDEwOC41NDQgMjAyLjMxOSA5MS4wNTQxIDIwMi4zMTkgNzMuNTY0NSAxOTAuNzI2IDYwLjM3MjQgMTczLjQzNiA2MC4zNzI0IDE1Ni4xNDcgNjAuMzcyNCAxNDQuNTU0IDc0LjI2NDEgMTQ0LjU1NCA5MS4wNTQxWiIgZmlsbD0iI0ZGRkZGRiIvPjxwYXRoIGQ9Ik04MzUuMTQzIDkzLjU1MjdDODM1LjE0MyAxMjIuMjM2IDgxMy4xNTYgMTQzLjkyMyA3ODMuNTczIDE0My45MjMgNzUzLjk5MSAxNDMuOTIzIDczMi4xMDQgMTIyLjIzNiA3MzIuMTA0IDkzLjU1MjcgNzMyLjEwNCA2NC44Njk3IDc1My45OTEgNDMuMTgyNiA3ODMuNTczIDQzLjE4MjYgODEzLjE1NiA0My4xODI2IDgzNS4xNDMgNjQuODY5NyA4MzUuMTQzIDkzLjU1MjdaTTc1My41OTEgOTMuNTUyN0M3NTMuNTkxIDExMS42NDIgNzY2LjQ4MyAxMjQuMjM0IDc4My41NzMgMTI0LjIzNCA4MDAuNjYzIDEyNC4yMzQgODEzLjY1NSAxMTEuNjQyIDgxMy42NTUgOTMuNTUyNyA4MTMuNjU1IDc1LjQ2MzQgODAwLjY2MyA2Mi44NzA5IDc4My41NzMgNjIuODcwOSA3NjYuNDgzIDYyLjg3MDkgNzUzLjU5MSA3NS40NjM0IDc1My41OTEgOTMuNTUyN1oiIGZpbGw9IiNGRkZGRkYiLz48L2c+PC9zdmc+","curta":"data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgOTkwIDQ1NCIgd2lkdGg9Ijk5MCIgaGVpZ2h0PSI0NTQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHhtbDpzcGFjZT0icHJlc2VydmUiIG92ZXJmbG93PSJoaWRkZW4iPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDk2IC0xOTcpIj48cGF0aCBkPSJNMjE5Ljc4IDEzOC4yNTggMTg1LjU4MyAxNzUuMjczQzE2OC41MjEgMTU4Ljk2OSAxNTAuMzc2IDE0OS42NDIgMTI2Ljk1MiAxNDkuNjQyIDg1Ljg4NzYgMTQ5LjY0MiA1NC44MDAzIDE4Mi4yNSA1NC44MDAzIDIyOS4xNzkgNTQuODAwMyAyNzYuMTA4IDg1Ljg4NzYgMzA4LjcxNiAxMjYuOTUyIDMwOC43MTYgMTUwLjQ0OCAzMDguNzE2IDE3MS4zNDEgMjk3LjU1MyAxODYuODg1IDI4Mi43OTFMMjE5Ljc4IDMyMC4wOTlDMTk3LjU4NSAzNDYuMjQ1IDE2NC45OCAzNTkuNzU4IDEyOC40NyAzNTkuNzU4IDUwLjc1MTcgMzU5LjY4NCAwIDMwMy41MDEgMCAyMjkuMTc5IDAgMTU0Ljg1NiA1MC43NTE3IDk4LjYwMDEgMTI4LjU0MiA5OC42MDAxIDE2NC45OCA5OC42MDAxIDE5OC4xNjMgMTEyLjA0IDIxOS44NTEgMTM4LjI1OEwyMTkuNzggMTM4LjI1OFoiIGZpbGw9IiNGRkZGRkYiIHRyYW5zZm9ybT0ibWF0cml4KDEgMCAwIDEuMDAxMzEgLTk2IDE5NykiLz48cGF0aCBkPSJNNTMyLjI5MSAxNDMuODIyIDUzMi4yOTEgNzEuODcgMzQyLjQzNiA3MS44NyAzNDIuNDM2IDAgNTMyLjI5MSAwIDUzMi4yOTEgNzEuOTUxNiA1OTUuNTk5IDcxLjk1MTYgNTk1LjU5OSAxNDMuOTAzIDUzMi4yOTEgMTQzLjkwMyA1MzIuMjkxIDE0My44MjJaTTM0Mi40MzYgMzU5LjY3NiAzNDIuNDM2IDIxNS44NTUgNDA1Ljc0NCAyMTUuODU1IDQwNS43NDQgMjg3LjgwNiA1OTUuNTk5IDI4Ny44MDYgNTk1LjU5OSAzNTkuNzU4IDM0Mi40MzYgMzU5Ljc1OCAzNDIuNDM2IDM1OS42NzZaTTQwNS42NzMgMjE1Ljc3MyA0MDUuNjczIDE0My44MjIgNTMyLjIxOCAxNDMuODIyIDUzMi4yMTggMjE1Ljc3MyA0MDUuNjczIDIxNS43NzNaIiBmaWxsPSIjRkZGRkZGIiB0cmFuc2Zvcm09Im1hdHJpeCgxIDAgMCAxLjAwMTMxIC05NiAxOTcpIi8+PHBhdGggZD0iTTc5Ni45NzEgNDUzLjAyOSA3MzcuNzY4IDQ1My4wMjkgODI1LjM0NCAyOTYuMzMxIDcxNi44NSA5OC42MDAxIDc3Ni44NTEgOTguNjAwMSA4NTUuNDUxIDI0MS41MiA5MzEuMzAzIDk4LjYwMDEgOTkwIDk4LjYwMDEgNzk2Ljk3MSA0NTMuMDI5WiIgZmlsbD0iI0ZGRkZGRiIgdHJhbnNmb3JtPSJtYXRyaXgoMSAwIDAgMS4wMDEzMSAtOTYgMTk3KSIvPjwvZz48L3N2Zz4="}};
/* LOGOS:FIM */

const WL_VITRINE_C6 = [43, 48];   /* canais servidos por compraveiculos.cars2you.com.br */
const MIN_CNPJ_CARTEIRA = 500;    /* o piso do Tratar Carteira: 1.436 clientes em 09/2026 */

/* domínio completo em context/banco-de-dados/plataforma/dominios.md */
const STATUS_NOME = {
  1: 'Ativo', 2: 'Aguardando pagamento', 3: 'Aguardando confirmação de pagamento',
  7: 'Vendido', 8: 'Suspenso', 9: 'Em análise do comprador', 10: 'Cancelado',
  11: 'Sem ofertas', 13: 'Em análise do vendedor', 14: 'Vendedor rejeitou',
  15: 'Comprador rejeitou', 18: 'Venda cancelada'
};

/* ── 1. ingestão: cada pacote conferido contra o seu total ──────────── */
const pedidos = $('Montar Consultas').all().map((i) => i.json);
const respostas = $('MCP Consultas').all();
if (respostas.length !== pedidos.length) {
  throw new Error('MCP Consultas devolveu ' + respostas.length + ' respostas para ' +
    pedidos.length + ' consultas. Sem par um a um nao da para saber qual e qual.');
}

const T = {};
const vistas = {};
pedidos.forEach((p, i) => {
  const r = respostas[i] ? respostas[i].json : null;
  const sc = r ? (r.structuredContent || r) : null;
  if (!sc || !sc.rows || !sc.columns) {
    throw new Error('A consulta ' + p.queryName + ' nao voltou do MCP: ' +
      JSON.stringify(r).slice(0, 400));
  }
  const row = sc.rows[0] || [];
  const total = Number(row[sc.columns.indexOf('total')]);
  let linhas = row[sc.columns.indexOf('linhas')];
  if (typeof linhas === 'string') linhas = JSON.parse(linhas);
  if (linhas === null || linhas === undefined) linhas = [];
  if (!Number.isFinite(total) || linhas.length !== total) {
    throw new Error('Pacote incompleto em ' + p.queryName + ': o banco contou ' + total +
      ' linhas e chegaram ' + linhas.length + '. Publicar meia tabela e pior que nao publicar.');
  }
  if (!T[p.tabela]) T[p.tabela] = [];
  vistas[p.tabela] = (vistas[p.tabela] || 0) + 1;
  linhas.forEach((arr) => {
    if (arr.length !== p.cols.length) {
      throw new Error(p.queryName + ': linha com ' + arr.length + ' colunas, esperadas ' + p.cols.length);
    }
    const o = {};
    p.cols.forEach((k, j) => { o[k] = arr[j]; });
    T[p.tabela].push(o);
  });
});
const META = pedidos[0].meta;
/* as tabelas grandes chegam em PARTES: parte que faltar derruba o run —
   faltaria um pedaço das negociações, calado */
Object.keys(META.partes).forEach((k) => {
  if (vistas[k] !== META.partes[k]) {
    throw new Error('A tabela ' + k + ' chegou em ' + (vistas[k] || 0) + ' parte(s), esperadas ' + META.partes[k]);
  }
});

const num = (x) => (x === null || x === undefined || x === '' ? null : Number(x));
const avisos = [];
const conta = {};
const marca = (chave) => { conta[chave] = (conta[chave] || 0) + 1; };

/* ── 2. a carteira comercial: quem responde por cada loja ─────────────
   Vem do carteira-comercial.json que o workflow Carteira Comercial
   publica às 6h (cnpj -> índice do consultor), o mesmo arquivo que o Radar
   lê. Ausente, fora do formato ou truncada, o painel sai SEM o filtro de
   responsável e diz isso no aviso: todo mundo em "Não distribuído" seria
   uma tela plausível e errada, e derrubar o painel inteiro por um filtro
   seria caro demais. Velha (mais de CARTEIRA_VELHA_DIAS), sai e avisa. */
const CARTEIRA_VELHA_DIAS = 7;
const itCart = $('Ler Carteira').all();
const cj = itCart.length ? itCart[0].json : null;
let CART = cj ? (cj.carteira || cj) : null;
let semCarteira = '';
if (!CART || !Array.isArray(CART.consultores) || !CART.consultores.length ||
    !CART.cnpj || typeof CART.cnpj !== 'object') {
  semCarteira = 'a carteira comercial não veio (ou veio fora do formato): sem o filtro de responsável';
}
const soDigitos = (s) => {
  let o = '';
  const t = String(s === null || s === undefined ? '' : s);
  for (let i = 0; i < t.length; i++) if (t[i] >= '0' && t[i] <= '9') o += t[i];
  return o;
};
const cnpj14 = (s) => { const d = soDigitos(s); return d ? d.padStart(14, '0') : ''; };
let respPorCnpj = {};
if (!semCarteira) {
  Object.keys(CART.cnpj).forEach((k) => {
    const i = Number(CART.cnpj[k]);
    if (i >= 0 && i < CART.consultores.length) respPorCnpj[cnpj14(k)] = i;
    else semCarteira = 'a carteira comercial aponta CNPJ para consultor inexistente: sem o filtro de responsável';
  });
}
if (!semCarteira && Object.keys(respPorCnpj).length < MIN_CNPJ_CARTEIRA) {
  semCarteira = 'a carteira comercial veio com ' + Object.keys(respPorCnpj).length + ' CNPJ, abaixo do piso de ' +
    MIN_CNPJ_CARTEIRA + ' (leitura truncada): sem o filtro de responsável';
}
if (semCarteira) {
  respPorCnpj = {};
  CART = { consultores: [], cnpj: {}, gerado_em: '' };
}

/* ── 2b. as metas (Thomas, 06/11; refeitas em 17/11): % com oferta e %
   vendidos por comitente e categoria, numa planilha no SharePoint com UMA
   ABA POR MÊS, de nome "AAAA-MM" (2026-11), e as metas mensal e diária na
   mesma aba (Thomas, 17/11: "inclua a meta mensal e diária nas mesmas abas,
   uma aba por mês com ano e mês; no painel a meta deve refletir a meta do
   mês de referência"). Só Leves e Pesados têm meta (17/11); Equipamentos e
   Não informada seguem no painel, sem meta.

   O n8n lê as abas dos 12 meses do Mensal: o nó Abas das Metas faz um item
   por mês (json.aba) com o arquivo, e o Metas (Extract From File, a aba
   pela expressão) roda uma vez por item. Cada linha que sai dele aponta
   para o item de entrada pelo pairedItem: é assim que a linha sabe de que
   aba veio. Aba que não existe sai como item de erro (onError continua).

   O mês de referência: no Mensal, cada mês usa a aba dele; no Diário, cada
   dia usa a aba do mês do dia. Mês sem aba usa a aba mais recente anterior
   a ele, e avisa (Thomas, 17/11); sem nenhuma anterior, fica sem meta.
   Aba ilegível: o mês sai sem a meta daquele recorte e avisa — meta errada
   é pior que meta nenhuma. A meta de um recorte com vários grupos é a média
   das metas dos veículos dele: cada veículo leva a meta do seu comitente e
   categoria.

   19/11 (Thomas: "remova as metas diárias e adicione uma coluna de
   whitelabel antes do id do comitente"): só a meta MENSAL, e uma linha por
   canal e comitente — a coluna "Whitelabel" traz "7 - Marketplace", e o
   número do começo é o canal. O veículo leva a meta do canal do evento dele;
   evento com mais de um canal (quase todos 4 + 7) leva a média das metas
   dos canais que a planilha tem. O Diário usa a meta mensal do mês do dia.
   Planilha sem a coluna Whitelabel (a de 17/11) vale para todos os canais
   (canal 0); o bloco "Meta diária" de uma planilha antiga é ignorado */
const CATS = ['L', 'P', 'E', 'N'];
/* a aba (17/11): uma linha por comitente, a categoria vira coluna; margem
   na linha 1 e na coluna A; na linha 2, "Meta mensal" e "Meta diária"
   mesclados sobre as suas colunas; na 3, "% Com Oferta" e "% Vendido"
   mesclados sobre as categorias; na 4, ID comitente, Comitente e as
   categorias (o nome se repete). Por isso o Extract From File lê SEM
   cabeçalho — cada item é { row: [células da área usada] } — e a leitura
   acha a linha do "ID comitente", tira a categoria dela, a medida da linha
   de cima e o período da de cima dela (a mesclada só tem valor na primeira
   célula: vale até a próxima). Célula vazia = sem meta */
const CAT_DE = { 'leves': 'L', 'pesados': 'P' };
const avisoMeta = [];
const lerNo = (nome) => { try { return $(nome).all(); } catch (e) { return []; } };
const pctMeta = (x) => {
  if (x === null || x === undefined || x === '') return null;
  let n = x;
  if (typeof x !== 'number') {
    const t = String(x).trim();
    n = Number(t.split('%').join('').split(' ').join('').split(',').join('.'));
    if (t.indexOf('%') >= 0) n = n / 100;
  }
  if (!isFinite(n)) return null;
  /* 25 (ou "25") é 25%: a planilha guarda fração, mas quem digita pode não saber */
  if (n > 1) n = n / 100;
  return n >= 0 && n <= 1 ? n : null;
};
const txtM = (x) => String(x === null || x === undefined ? '' : x).trim();
/* o canal do começo da célula: "7 - Marketplace" -> 7 */
const canalDe = (x) => {
  const t = txtM(x);
  let d = '';
  for (let i = 0; i < t.length && t[i] >= '0' && t[i] <= '9'; i++) d += t[i];
  return d ? Number(d) : null;
};
/* uma aba: { mes: { "canal|id|cat": [oferta, vendidos] } } (canal 0 = a
   planilha sem a coluna Whitelabel, que vale para todos), ou null se ela
   veio fora do formato */
const lerAba = (aba, linhas) => {
  const vazia = (x) => txtM(x) === '';
  const h = linhas.findIndex((r) => r.some((x) => txtM(x) === 'ID comitente'));
  const cab = h >= 0 ? linhas[h] : [];
  const cId = cab.findIndex((x) => txtM(x) === 'ID comitente');
  const cWl = cab.findIndex((x) => txtM(x).toLowerCase() === 'whitelabel');
  /* [coluna, categoria, 0 = com oferta | 1 = vendidos] */
  const cols = [];
  let medida = '';
  let periodo = '';
  for (let j = cId + 1; h > 0 && j < cab.length; j++) {
    const p = txtM((linhas[h - 2] || [])[j]).toLowerCase();
    if (p) periodo = p;
    const m = txtM((linhas[h - 1] || [])[j]).toLowerCase();
    if (m) medida = m;
    const c = CAT_DE[txtM(cab[j]).toLowerCase()];
    const k = medida.indexOf('oferta') >= 0 ? 0 : medida.indexOf('vend') >= 0 ? 1 : -1;
    /* o bloco diário de uma planilha antiga fica de fora (19/11) */
    const diaria = periodo.indexOf('diári') >= 0 || periodo.indexOf('diari') >= 0;
    if (c && k >= 0 && !diaria) cols.push([j, c, k]);
  }
  const out = { mes: {} };
  if (!cols.length) {
    avisoMeta.push('a aba ' + aba + ' da planilha de metas veio fora do formato (sem a linha do ID comitente com Leves e Pesados e, em cima, % Com Oferta e % Vendido): sem meta nesse mês');
    return null;
  }
  if (cWl < 0) marca('metas_sem_canal');
  let ruins = 0;
  linhas.slice(h + 1).forEach((r) => {
    const id = num(r[cId]);
    const wl = cWl < 0 ? 0 : canalDe(r[cWl]);
    const par = {};
    cols.forEach((x) => {
      if (vazia(r[x[0]])) return;
      if (!par[x[1]]) par[x[1]] = [undefined, undefined];
      par[x[1]][x[2]] = pctMeta(r[x[0]]);
    });
    Object.keys(par).forEach((cat) => {
      const of = par[cat][0];
      const ve = par[cat][1];
      /* as duas metas da categoria andam juntas: uma sem a outra, ilegível,
         ou sem o ID do comitente (ou o canal), fica sem meta */
      if (id === null || wl === null || of === null || of === undefined || ve === null || ve === undefined) { ruins++; return; }
      out.mes[wl + '|' + id + '|' + cat] = [of, ve];
    });
  });
  if (ruins) avisoMeta.push(ruins + ' meta(s) da aba ' + aba + ' da planilha sem o ID do comitente ou o whitelabel, ilegíveis ou só com uma das duas: ficam sem meta');
  return out;
};
/* as linhas de cada aba, pelo pairedItem (o item de entrada do Metas) */
const abasPedidas = lerNo('Abas das Metas').map((i) => txtM((i.json || {}).aba));
const linhasDaAba = {};
let semPar = 0;
lerNo('Metas').forEach((i) => {
  const p = Array.isArray(i.pairedItem) ? i.pairedItem[0] : i.pairedItem;
  const k = typeof p === 'number' ? p : p && typeof p === 'object' ? p.item : undefined;
  const aba = abasPedidas[k];
  const linha = i.json && Array.isArray(i.json.row);
  if (!aba) { if (linha) semPar++; return; }
  if (linha) (linhasDaAba[aba] = linhasDaAba[aba] || []).push(i.json.row);
});
if (semPar) avisoMeta.push(semPar + ' linha(s) da planilha de metas sem a aba de origem (pairedItem): ficam fora');
const metaDaAba = {};
Object.keys(linhasDaAba).forEach((aba) => {
  const m = lerAba(aba, linhasDaAba[aba]);
  if (m) metaDaAba[aba] = m;
});
/* o mês de referência: a aba do mês, ou a mais recente anterior a ele */
const abasLidas = Object.keys(metaDaAba).sort();
const ABA_DO_MES = META.meses.map((r) => (metaDaAba[r] ? r : abasLidas.filter((a) => a < r).pop() || ''));
if (!abasLidas.length) {
  avisoMeta.push('a planilha de metas não veio, ou nenhuma aba dos 12 meses (' + META.meses[0] + ' a ' +
    META.meses[META.meses.length - 1] + ') foi lida: sem meta');
} else {
  const emprestadas = META.meses.map((r, m) => (ABA_DO_MES[m] && ABA_DO_MES[m] !== r ? r + ' usa ' + ABA_DO_MES[m] : null)).filter((x) => x);
  const sem = META.meses.filter((r, m) => !ABA_DO_MES[m]);
  if (emprestadas.length) avisoMeta.push('planilha de metas sem a aba do mês: ' + emprestadas.join(', ') + ' (a mais recente anterior)');
  if (sem.length) avisoMeta.push('planilha de metas sem aba para ' + sem.join(', ') + ' nem anterior: sem meta nesse(s) mês(es)');
}
/* do id do comitente para o índice da lista: "canal|índice|categoria" */
const reindexa = (m, idx) => {
  const o = {};
  Object.keys(m).forEach((k) => {
    const p = k.split('|');
    const i = idx[Number(p[1])];
    if (i !== undefined) o[p[0] + '|' + i + '|' + p[2]] = m[k];
  });
  return o;
};
/* por mês do Mensal (o índice de META.meses), a meta mensal com os índices
   de comitente de uma das listas (a do Diário ou a do Mensal) */
const metasPorMes = (idx) => ABA_DO_MES.map((a) => (a ? reindexa(metaDaAba[a].mes, idx) : {}));

/* ── 3. os dias: índice 0 = o piso, HOJE = o último ─────────────────── */
const PISO_DIA = META.piso_dia;
const utcDe = (s) => Date.UTC(Number(s.slice(0, 4)), Number(s.slice(5, 7)) - 1, Number(s.slice(8, 10)));
const P0 = utcDe(PISO_DIA);
const diaIdx = (s) => (s ? Math.round((utcDe(s) - P0) / 86400000) : null);
const HOJE = diaIdx(META.agora_br);
if (HOJE !== META.dias) throw new Error('o dia de hoje (' + HOJE + ') nao e o ultimo da janela (' + META.dias + ')');

/* ── 4. eventos, do mais recente ao mais antigo ──────────────────────── */
const eventos = T.eventos.map((e) => {
  const d0 = Math.max(0, diaIdx(e.ini));
  let d1 = Math.min(HOJE, diaIdx(e.fim));
  if (d1 < d0) { marca('evento_fim_antes'); d1 = d0; }
  return {
    id: num(e.id), nome: e.nome, ini: e.ini, fim: e.fim, d0: d0, d1: d1,
    wls: String(e.wls || '').split(',').filter((x) => x !== '').map(Number), comits: []
  };
}).sort((a, b) => (a.fim < b.fim ? 1 : a.fim > b.fim ? -1 : b.id - a.id));
const evIdx = {};
eventos.forEach((e, i) => { evIdx[e.id] = i; });

/* ── 5. comitentes, lojas e veículos ─────────────────────────────────── */
const comitentes = T.comitentes.map((c) => ({ id: num(c.id), nome: String(c.nome || '').trim() || ('loja ' + c.id) }))
  .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
const comIdx = {};
comitentes.forEach((c, i) => { comIdx[c.id] = i; });

const cartConta = { por_cnpj: 0, nao_distribuidas: 0, sem_cnpj: 0 };
const lojas = T.lojas.map((l) => {
  const c = cnpj14(l.cnpj);
  let resp = -1;
  if (!c) cartConta.sem_cnpj++;
  else if (respPorCnpj[c] !== undefined) { resp = respPorCnpj[c]; cartConta.por_cnpj++; }
  else cartConta.nao_distribuidas++;
  /* [nome, canal, responsável]; o CNPJ fica aqui, não vai para a página */
  return { id: num(l.id), linha: [String(l.nome || '').trim() || ('loja ' + l.id), num(l.wl), resp] };
});
const lojaIdx = {};
lojas.forEach((l, i) => { lojaIdx[l.id] = i; });

const veics = T.veiculos.map((v) => {
  let est = diaIdx(v.estreia);
  if (est === null) { marca('veiculo_sem_estreia'); est = -1; }
  if (est < 0) est = -1;
  let cat = String(v.cat || '');
  if (CATS.indexOf(cat) < 0) { marca('veiculo_sem_categoria'); cat = 'N'; }
  /* [marca, modelo, versão, ano, km, dia da estreia (-1 = antes da janela),
     uuid sem hífen, categoria (L, P, E, N)] */
  return { id: num(v.veic), linha: [v.marca || '', v.modelo || '', v.versao || '', num(v.ano), num(v.km), est,
    String(v.uuid || '').split('-').join(''), cat] };
});
const veicIdx = {};
veics.forEach((v, i) => { veicIdx[v.id] = i; });

/* ── 6. negociações: [evento, veículo, comitente, status, VMV, FIPE] ──── */
const negs = [];
const negIdx = {};
/* em ordem de id: o desempate do "evento mais recente" (mesmo fim) é o
   índice, e tem que ser o id maior, como no mensal (SQL) e nas
   conferências. As partes chegam cortadas pelo resto do id, fora de ordem:
   em 29/10 o veículo 454869 tinha duas negociações no mesmo evento, uma
   com acesso e outra sem, e o painel escolhia pela ordem de chegada */
T.negs.slice().sort((a, b) => num(a.neg) - num(b.neg)).forEach((r) => {
  const e = evIdx[num(r.ev)];
  const v = veicIdx[num(r.veic)];
  if (e === undefined) { marca('neg_sem_evento'); return; }
  if (v === undefined) { marca('neg_sem_veiculo'); return; }
  let c = comIdx[num(r.comit)];
  if (c === undefined) { marca('neg_sem_comitente'); c = -1; }
  if (c >= 0 && eventos[e].comits.indexOf(c) < 0) eventos[e].comits.push(c);
  negIdx[num(r.neg)] = negs.length;
  negs.push([e, v, c, num(r.status), num(r.vmv), num(r.fipe)]);
});

/* ── 7. o que as lojas fizeram, por negociação ───────────────────────── */
const daLoja = (rotulo, id) => {
  const l = lojaIdx[num(id)];
  if (l === undefined) marca(rotulo);
  return l;
};
const ofertas = [];
T.ofertas.forEach((o) => {
  const n = negIdx[num(o.neg)];
  if (n === undefined) { marca('oferta_sem_neg'); return; }
  const l = daLoja('oferta_sem_loja', o.loja);
  if (l === undefined) return;
  ofertas.push([n, l, num(o.n), num(o.maior), num(o.dias)]);
});
const acessos = [];
T.acessos.forEach((a) => {
  const n = negIdx[num(a.neg)];
  if (n === undefined) { marca('acesso_sem_neg'); return; }
  const l = daLoja('acesso_sem_loja', a.loja);
  if (l === undefined) return;
  acessos.push([n, l, num(a.dias)]);
});
const vendas = [];
T.vendas.forEach((s) => {
  const n = negIdx[num(s.neg)];
  if (n === undefined) { marca('venda_sem_neg'); return; }
  /* oferta vencedora sem loja (buyer_shop_id nulo): existe no Marketplace,
     3 em 28/10 — no C6 nunca. A venda fica (o veículo vendeu), com -1 no
     lugar da loja: entra no % vendidos, fica fora dos lojistas que compraram */
  let l = -1;
  if (num(s.loja) === null) marca('venda_sem_loja_compradora');
  else {
    l = daLoja('venda_sem_loja', s.loja);
    if (l === undefined) return;
  }
  const d = diaIdx(s.quando);
  if (d === null || d < 0 || d > HOJE) marca('venda_fora_da_janela');
  vendas.push([n, l, num(s.valor), d === null ? -1 : d]);
});
const logins = [];
T.logins.forEach((g) => {
  const l = daLoja('login_sem_loja', g.loja);
  if (l === undefined) return;
  logins.push([l, num(g.wl), num(g.dias)]);
});

/* ── 7b. o mensal (Thomas, 06/11; POR EVENTO desde 19/11) ────────────
   mes_ev traz, por (mês, evento, comitente, categoria), os veículos DO
   evento ("o_") e os de que o evento é o DONO no mês ("d_": a negociação
   mais recente do veículo no mês caiu nele). Cada veículo tem um dono só:
   somar o "d_" dos eventos que passam no filtro é a contagem distinta. O
   mes_dia é o mesmo por dia do mês, e o mes_lojd traz as lojas de cada
   evento com a máscara dos dias em que acessaram, ofertaram e compraram. */
const MESES = META.meses || [];
if (MESES.length !== 12) throw new Error('o Montar Consultas mandou ' + MESES.length + ' meses, esperados 12');
const comMes = T.mes_comitentes.map((c) => ({ id: num(c.id), nome: String(c.nome || '').trim() || ('loja ' + c.id) }))
  .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
const comMesIdx = {};
comMes.forEach((c, i) => { comMesIdx[c.id] = i; });
const comDoMes = (id) => {
  const i = comMesIdx[num(id)];
  if (i === undefined) { marca('mes_comitente_fora'); return -1; }
  return i;
};
/* os status do SISTEMA no mensal (Thomas, 17/11), na ordem das colunas
   s1..s18, mais "fora do domínio" no fim. A mesma lista do STATUS_SISTEMA
   do Montar Consultas (a prova confere) */
const STATUS_MES = [1, 2, 3, 7, 8, 9, 10, 11, 13, 14, 15, 18];
/* os eventos dos 12 meses: [nome, abre, fecha, mês em que abre (0 se
   antes), mês em que fecha, canais, comitentes, 1 = finalizado].
   Finalizado = status 0 E o fim já passou (o recorte FECHADO de 18/11, que
   virou o filtro Situação em 19/11: "volte os eventos ativos") */
const mesDe = (s) => MESES.indexOf(String(s || '').slice(0, 7));
const evMes = T.mes_eventos.map((e) => {
  let a = mesDe(e.ini);
  let b = mesDe(e.fim);
  if (a < 0) a = String(e.ini) < MESES[0] ? 0 : MESES.length - 1;
  if (b < 0) b = String(e.fim) < MESES[0] ? 0 : MESES.length - 1;
  const wm = num(e.wm) || 0;
  if (!wm) marca('mes_sem_canal');
  const cs = String(e.cs || '').split(',').filter((x) => x !== '').map((x) => comDoMes(x)).filter((x) => x >= 0);
  return { id: num(e.id), nome: String(e.nome || '').trim() || ('evento ' + e.id), ini: String(e.ini || ''), fim: String(e.fim || ''),
    a: a, b: b, wls: META.wls.filter((w, i) => ((wm >> i) & 1) === 1), cs: cs,
    fin: num(e.st) === 0 && String(e.fim || '') < META.agora_br ? 1 : 0 };
}).sort((x, y) => (x.fim < y.fim ? 1 : x.fim > y.fim ? -1 : y.id - x.id));
const evMesIdx = {};
evMes.forEach((e, i) => { evMesIdx[e.id] = i; });
const evDoMes = (id, rotulo) => {
  const i = evMesIdx[num(id)];
  if (i === undefined) { marca(rotulo); return -1; }
  return i;
};
const catDe = (x) => {
  const c = String(x || '');
  if (CATS.indexOf(c) < 0) { marca('mes_sem_categoria'); return 'N'; }
  return c;
};
const POS_VENDA = [2, 3, 7].map((x) => STATUS_MES.indexOf(x));
/* um bloco do mes_ev: [veículos, novos, com acesso, com oferta, vendidos,
   os três dos novos, [veículos por status, na ordem do STATUS_MES, e os
   fora do domínio], valor vendido]. Os status fecham: somam os veículos,
   os vendidos são os status 2, 3 e 7, com oferta fica entre os vendidos e
   os veículos. Se não, a consulta está errada — publicar seria mostrar
   cartões que não somam */
const blocoEv = (g, p, rot) => {
  const st = STATUS_MES.map((x) => num(g[p + 's' + x])).concat([num(g[p + 'sx'])]);
  const b = [num(g[p + 'veic']), num(g[p + 'novos']), num(g[p + 'ac']), num(g[p + 'of']), num(g[p + 've']),
    num(g[p + 'ac_n']), num(g[p + 'of_n']), num(g[p + 've_n']), st, Math.round(num(g[p + 'valor']) || 0)];
  const soma = st.reduce((t, x) => t + x, 0);
  const vend = POS_VENDA.reduce((t, i) => t + st[i], 0);
  if (soma !== b[0] || vend !== b[4] || b[3] < b[4] || b[3] > b[0] || b[1] > b[0] || b[2] > b[0]) {
    throw new Error('mes_ev: no mes ' + MESES[num(g.m)] + ' os status nao fecham (' + rot + ': veiculos ' + b[0] + ', soma dos status ' + soma +
      ', vendidos ' + b[4] + ' x status de venda ' + vend + ', com oferta ' + b[3] + ', evento ' + g.eid + ', comitente ' + g.c + ')');
  }
  return b;
};
const mesEv = [];
T.mes_ev.forEach((g) => {
  const e = evDoMes(g.eid, 'mes_ev_fora');
  if (e < 0) return;
  const o = blocoEv(g, 'o_', 'do evento');
  const d = blocoEv(g, 'd_', 'do dono');
  if (d[0] > o[0]) throw new Error('mes_ev: o evento ' + g.eid + ' e dono de mais veiculos do que tem (' + d[0] + ' x ' + o[0] + ')');
  if (d[8][STATUS_MES.length]) conta.mes_status_fora = (conta.mes_status_fora || 0) + d[8][STATUS_MES.length];
  /* [mês, evento, comitente, categoria, bloco do evento, bloco do dono] */
  mesEv.push([num(g.m), e, comDoMes(g.c), catDe(g.cat), o, d]);
});
/* o mes_dia: [mês, dia do mês (0 = dia 1), evento, comitente, categoria,
   [veículos, novos, com acesso, com oferta, vendidos, os três dos novos]
   do evento, o mesmo do dono do dia] */
const blocoDia = (g, p) => ['veic', 'novos', 'ac', 'of', 've', 'ac_n', 'of_n', 've_n'].map((k) => num(g[p + k]));
const mesDia = [];
T.mes_dia.forEach((g) => {
  const e = evDoMes(g.eid, 'mes_ev_fora');
  if (e < 0) return;
  const o = blocoDia(g, 'o_');
  const d = blocoDia(g, 'd_');
  [o, d].forEach((b) => {
    if (b[1] > b[0] || b[3] > b[0] || b[4] > b[3] || b[2] > b[0] || b[7] > b[6] || b[6] > b[1]) {
      throw new Error('mes_dia: contas que nao fecham no mes ' + MESES[num(g.m)] + ', dia ' + (num(g.k) + 1) + ', evento ' + g.eid);
    }
  });
  if (d[0] > o[0]) throw new Error('mes_dia: o evento ' + g.eid + ' e dono de mais veiculos do que tem no dia ' + (num(g.k) + 1));
  mesDia.push([num(g.m), num(g.k), e, comDoMes(g.c), catDe(g.cat), o, d]);
});
/* o mes_lojd: por mês, [evento, "loja.acessou.ofertou.comprou,..."], a loja
   trocada por um índice curto (base 36) e as máscaras como vieram (base
   36; as zeradas no fim não vêm). A página desmonta na abertura */
const lojaMesIdx = {};
let nLojasMes = 0;
let paresLoj = 0;
const mesLojd = MESES.map(() => []);
T.mes_lojd.forEach((r) => {
  const e = evDoMes(r.eid, 'mes_ev_fora');
  if (e < 0) return;
  let ls = r.ls;
  if (typeof ls === 'string') ls = JSON.parse(ls);
  const partes = (ls || []).map((x) => {
    const q = String(x).split('.');
    const id = Number(q[0]);
    let li = lojaMesIdx[id];
    if (li === undefined) { li = nLojasMes++; lojaMesIdx[id] = li; }
    q[0] = li.toString(36);
    return q.join('.');
  });
  paresLoj += partes.length;
  mesLojd[num(r.m)].push([e, partes.join(',')]);
});
/* [dias com acesso registrado, dias do mês até hoje]: o access_logs tem
   buraco (06/02 a 11/03/2026, medido em 06/11) e o mês incompleto
   subconta acesso e lojistas que acessaram — vira aviso e nota no balão */
const diasAc = {};
T.mes_dias_acesso.forEach((r) => { diasAc[String(r.mes)] = num(r.dias); });
const mesDiasAcesso = MESES.map((r, m) => {
  const ano = Number(r.slice(0, 4));
  const mm = Number(r.slice(5, 7));
  const total = m === MESES.length - 1 ? Number(META.agora_br.slice(8, 10)) : new Date(Date.UTC(ano, mm, 0)).getUTCDate();
  return [diasAc[r] || 0, total];
});
const ABREV = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const incompletos = [];
mesDiasAcesso.forEach((x, m) => {
  if (x[0] < x[1]) incompletos.push(ABREV[Number(MESES[m].slice(5, 7)) - 1] + '/' + MESES[m].slice(2, 4) + ' (' + x[0] + ' de ' + x[1] + ' dias)');
});

/* ── 8. avisos: só sobre o que esta coleta trouxe ──────────────────── */
const TEXTO_AVISO = {
  evento_fim_antes: 'evento(s) com fim antes do início das ofertas',
  veiculo_sem_estreia: 'veículo(s) sem data de estreia — nunca contam como novos',
  neg_sem_evento: 'negociação(ões) fora dos eventos do recorte',
  neg_sem_veiculo: 'negociação(ões) sem o veículo na consulta de veículos',
  neg_sem_comitente: 'negociação(ões) de comitente fora da lista de comitentes',
  oferta_sem_neg: 'oferta(s) de negociação fora do recorte',
  oferta_sem_loja: 'oferta(s) de loja fora da tabela de lojas',
  acesso_sem_neg: 'acesso(s) de negociação fora do recorte',
  acesso_sem_loja: 'acesso(s) de loja fora da tabela de lojas',
  venda_sem_neg: 'venda(s) de negociação fora do recorte',
  venda_sem_loja: 'venda(s) de loja fora da tabela de lojas',
  venda_sem_loja_compradora: 'venda(s) com a oferta vencedora sem loja — contam como venda do veículo, fora dos lojistas que compraram',
  venda_fora_da_janela: 'venda(s) com a oferta vencedora fora dos 31 dias — não entram nos gráficos',
  login_sem_loja: 'loja(s) com acesso ao canal fora da tabela de lojas',
  mes_comitente_fora: 'linha(s) do mensal com comitente fora da lista de comitentes dos 12 meses',
  mes_sem_canal: 'evento(s) do mensal sem canal — não aparecem com filtro de canal',
  mes_ev_fora: 'linha(s) do mensal de evento fora da lista de eventos dos 12 meses',
  metas_sem_canal: 'aba(s) da planilha de metas sem a coluna Whitelabel — a meta vale para todos os canais',
  veiculo_sem_categoria: 'veículo(s) com categoria fora da lista — contam como Não informada',
  mes_sem_categoria: 'linha(s) do mensal com categoria fora da lista — contam como Não informada',
  mes_status_fora: 'veículo(s)-mês do mensal com status fora do domínio conhecido — contam em Não vendidos, como "outros"'
};
Object.keys(conta).forEach((k) => avisos.push(conta[k] + ' ' + (TEXTO_AVISO[k] || k)));
if (incompletos.length) {
  avisos.push('mensal: o registro de acessos (access_logs) não cobre o mês inteiro em ' + incompletos.join(', ') +
    ' — com acesso e lojistas que acessaram saem subcontados nesses meses');
}
avisoMeta.forEach((a) => avisos.push(a));
if (semCarteira) avisos.push(semCarteira);
else if (CART.gerado_em) {
  const g = String(CART.gerado_em);
  const idade = HOJE - diaIdx(g);
  if (idade > CARTEIRA_VELHA_DIAS) {
    avisos.push('carteira comercial de ' + g.slice(8, 10) + '/' + g.slice(5, 7) + '/' + g.slice(0, 4) + ', com ' + idade +
      ' dias: o responsável de cada loja pode estar desatualizado');
  }
}

const DADOS = {
  agora: META.agora_br, piso_dia: PISO_DIA, hoje: HOJE,
  canais: T.canais.map((c) => [num(c.id), c.nome]).sort((a, b) => a[0] - b[0]),
  eventos: eventos.map((e) => ({ nome: e.nome, ini: e.ini, fim: e.fim, d0: e.d0, d1: e.d1, wls: e.wls, comits: e.comits })),
  comitentes: comitentes.map((c) => c.nome),
  consultores: CART.consultores,
  carteira_em: String(CART.gerado_em || '').slice(0, 10),
  veics: veics.map((v) => v.linha),
  negs: negs, ofertas: ofertas, acessos: acessos, vendas: vendas, logins: logins,
  lojas: lojas.map((l) => l.linha),
  status_nome: STATUS_NOME, vitrine_c6: WL_VITRINE_C6,
  /* o evento e o comitente do Diário na lista do Mensal, pelo id (-1 = fora
     dela): a tabela de veículos do mês (24/11) */
  ev_mes: eventos.map((e) => (evMesIdx[e.id] === undefined ? -1 : evMesIdx[e.id])),
  com_mes: comitentes.map((c) => (comMesIdx[c.id] === undefined ? -1 : comMesIdx[c.id])),
  mes: { meses: MESES, ult: META.meses_ult, wls: META.wls, comitentes: comMes.map((c) => c.nome), status: STATUS_MES,
    eventos: evMes.map((e) => [e.nome, e.ini, e.fim, e.a, e.b, e.wls, e.cs, e.fin]),
    ev: mesEv, dia: mesDia, lojd: mesLojd, n_lojas: nLojasMes,
    dias_max_evento: META.dias_max_evento, dias_acesso: mesDiasAcesso },
  /* um mapa por mês do Mensal (o índice de mes.meses): "canal|índice do
     comitente|categoria" -> [meta % com oferta, meta % vendidos]; "abas" diz
     de que aba veio a meta de cada mês (17/11). Desde 19/11 as duas são a
     meta MENSAL (a diária saiu da planilha): "dia" com os comitentes do
     Diário, "mes" com os do Mensal */
  metas: { dia: metasPorMes(comIdx), mes: metasPorMes(comMesIdx), abas: ABA_DO_MES }
};

/* ══════════════════════════════════════════════════════════════════════
   calcula(D, F) — o recorte. "F" = os filtros da tela, todos texto ('' =
   todos): wl (id do canal), comit e ev (índices), resp (índice do
   consultor ou 'nd'), de e ate (índices de dia). Roda aqui e na página.
   Nada de DOM aqui dentro.

   O QUE CADA FILTRO RECORTA
     wl, comit, ev  as NEGOCIAÇÕES (e os veículos delas). O canal recorta
                    também o "logaram": login naquele canal.
     resp           as LOJAS: acessos, ofertas, vendas e logins de quem é da
                    carteira. Veículo não tem responsável, então os cartões e
                    as barras de veículos ativos não mudam.
     de, ate        os DIAS dos gráficos e da tabela. Os cartões mostram os
                    eventos ativos no dia "ate" (hoje, sem filtro).
   ══════════════════════════════════════════════════════════════════════ */
function calcula(D, F) {
  F = F || {};
  const ST_VENDA = [2, 3, 7];
  const ST_ANALISE = [9, 13];
  const ST_REMOVIDO = [8, 10];
  const vazio = (x) => x === undefined || x === null || x === '';
  let de = vazio(F.de) ? 0 : Number(F.de);
  let ate = vazio(F.ate) ? D.hoje : Number(F.ate);
  if (de > ate) { const t = de; de = ate; ate = t; }
  const faixa = (a, b) => { let m = 0; for (let d = a; d <= b; d++) m |= (1 << d); return m; };
  const bit = (m, d) => ((m >>> d) & 1) === 1;
  const per = faixa(de, ate);
  const wl = vazio(F.wl) ? 0 : Number(F.wl);
  const comit = vazio(F.comit) ? -1 : Number(F.comit);
  const ev = vazio(F.ev) ? -1 : Number(F.ev);
  const resp = vazio(F.resp) ? '' : String(F.resp);
  /* a categoria do veículo (06/11): L, P, E, N; recorta as negociações pelo
     veículo, como o comitente recorta pela loja que anuncia */
  const cat = vazio(F.cat) ? '' : String(F.cat);

  /* índices por negociação: montados uma vez, guardados no próprio dado */
  if (!D._ix) {
    const ix = { of: [], ac: [], ven: [] };
    ix.evCats = D.eventos.map(() => ({}));
    D.negs.forEach((n) => { ix.evCats[n[0]][D.veics[n[1]][7]] = 1; });
    D.negs.forEach(() => { ix.of.push([]); ix.ac.push([]); ix.ven.push(null); });
    D.ofertas.forEach((o) => ix.of[o[0]].push(o));
    D.acessos.forEach((a) => ix.ac[a[0]].push(a));
    D.vendas.forEach((s) => { ix.ven[s[0]] = s; });
    ix.evMask = D.eventos.map((e) => faixa(e.d0, e.d1));
    D._ix = ix;
  }
  const X = D._ix;

  const catOk = (n) => cat === '' || D.veics[n[1]][7] === cat;
  const evCatOk = (i) => cat === '' || X.evCats[i][cat] === 1;
  const evOk = D.eventos.map((e, i) => (!wl || e.wls.indexOf(wl) >= 0) && (ev < 0 || i === ev) &&
    (comit < 0 || e.comits.indexOf(comit) >= 0) && evCatOk(i));
  const lojaOk = D.lojas.map((l) => resp === '' || (resp === 'nd' ? l[2] < 0 : l[2] === Number(resp)));
  /* F.sem_rem: a negociação removida (8, 10) não existe — a regra do Mensal
     (25/11), usada pela tabela de veículos do mês; o Diário segue com ela */
  const nOk = (n) => evOk[n[0]] && (comit < 0 || n[2] === comit) && catOk(n) && !(F.sem_rem && (n[3] === 8 || n[3] === 10));

  const NV = D.veics.length;
  const NL = D.lojas.length;
  const zeros = (k) => { const a = []; for (let i = 0; i < k; i++) a.push(0); return a; };
  const vAt = zeros(NV);
  const vNegs = [];
  const lLog = zeros(NL);
  const lAc = zeros(NL);
  const lOf = zeros(NL);
  const lCo = zeros(NL);

  /* a Data corta DIAS, não negociações: a loja que abriu no dia D o anúncio
     de um evento que só abre as ofertas em D+1 (a vitrine mostra antes)
     acessou em D, com período de um dia ou de trinta. Sem isso, "acessaram
     em 20/10" dava 532 no período inteiro e 487 com De = Até = 20/10
     (_confere_banco.py, 28/10). O evento só decide se o VEÍCULO está ativo. */
  D.negs.forEach((n, i) => {
    if (!nOk(n)) return;
    const m = X.evMask[n[0]] & per;
    const v = n[1];
    if (m) {
      vAt[v] |= m;
      if (!vNegs[v]) vNegs[v] = [];
      vNegs[v].push(i);
    }
    X.ac[i].forEach((a) => { if (lojaOk[a[1]]) lAc[a[1]] |= a[2] & per; });
    X.of[i].forEach((o) => { if (lojaOk[o[1]]) lOf[o[1]] |= o[4] & per; });
    const s = X.ven[i];
    if (s && s[3] >= 0 && s[1] >= 0 && lojaOk[s[1]]) lCo[s[1]] |= (1 << s[3]) & per;
  });
  D.logins.forEach((g) => { if (lojaOk[g[0]] && (!wl || g[1] === wl)) lLog[g[0]] |= g[2] & per; });

  /* ── o acumulado no evento (Thomas, 06/11). De cada veículo ativo no dia
     "d", a negociação do evento mais recente entre os ativos em "d" — a
     mesma regra do cartão — e se ela já teve acesso, lance ou venda ATÉ
     "d", só das lojas do responsável. Lance de antes do piso viaja sem bit
     e conta em todo dia; venda de antes do piso também. No dia de
     referência o gráfico fecha com os cartões. Até 06/11 era o que
     aconteceu NO dia: em 05/11, 311 com acesso e 11 com lance, contra 531
     e 21 nos veículos dos cartões (coleta de 05/11) */
  const ultimaNoDia = (lista, d) => {
    let u = -1;
    lista.forEach((i) => {
      const e = D.negs[i][0];
      if (!bit(X.evMask[e], d)) return;
      if (u < 0) { u = i; return; }
      const a = D.eventos[e].fim;
      const b = D.eventos[D.negs[u][0]].fim;
      if (a > b || (a === b && i > u)) u = i;
    });
    return u;
  };
  const acumulado = (i, d) => {
    const m = faixa(0, d);
    const s = X.ven[i];
    /* comprador sem loja (-1) só conta sem o filtro de responsável. Vendeu
       conta como com oferta: o funil do cartão (Com oferta acumula os
       status de depois) */
    const ve = !!s && s[3] <= d && (s[1] < 0 ? resp === '' : lojaOk[s[1]]);
    return {
      ac: X.ac[i].some((a) => lojaOk[a[1]] && (a[2] & m) !== 0),
      of: ve || X.of[i].some((o) => lojaOk[o[1]] && (!o[4] || (o[4] & m) !== 0)),
      ve: ve
    };
  };

  /* a meta do veículo (Thomas, 06/11): a do comitente da negociação
     escolhida no dia e da categoria do veículo. "mt" conta os veículos com
     meta, "mo" e "mv" somam as metas de com oferta e de vendidos: a meta do
     recorte é mo / mt (e mv / mt). Os "_n" são o mesmo só dos novos */
  /* a meta do MÊS DO DIA (17/11): a planilha tem uma aba por mês, e o dia d
     usa a do mês dele (D.metas.dia, alinhado com D.mes.meses). Desde 19/11 é
     a meta MENSAL do mês (a diária saiu da planilha) */
  const metaDia = D.metas ? D.metas.dia : [];
  const P0M = Date.UTC(Number(D.piso_dia.slice(0, 4)), Number(D.piso_dia.slice(5, 7)) - 1, Number(D.piso_dia.slice(8, 10)));
  const mesDoDia = {};
  const metaNoDia = (d) => {
    if (mesDoDia[d] === undefined) mesDoDia[d] = D.mes.meses.indexOf(new Date(P0M + d * 86400000).toISOString().slice(0, 7));
    return metaDia[mesDoDia[d]] || {};
  };
  /* a meta do canal do evento (19/11): evento de mais de um canal leva a
     média dos canais que têm meta; a planilha sem canal (0) vale para todos */
  const metaVeic = (mp, wls, c, ct) => {
    let n = 0;
    let o = 0;
    let v = 0;
    wls.forEach((w) => { const x = mp[w + '|' + c + '|' + ct]; if (x) { n++; o += x[0]; v += x[1]; } });
    return n ? [o / n, v / n] : (mp['0|' + c + '|' + ct] || null);
  };
  const somaMeta = (g, i, v, nv, d) => {
    const mm = metaVeic(metaNoDia(d), D.eventos[D.negs[i][0]].wls, D.negs[i][2], D.veics[v][7]);
    if (!mm) return;
    g.mt++; g.mo += mm[0]; g.mv += mm[1];
    if (nv) { g.mt_n++; g.mo_n += mm[0]; g.mv_n += mm[1]; }
  };
  const zeraMeta = (g) => Object.assign(g, { mt: 0, mo: 0, mv: 0, mt_n: 0, mo_n: 0, mv_n: 0 });

  /* ── veículos ativos por dia, e o percentual com acesso, oferta e venda */
  const dias = [];
  for (let d = de; d <= ate; d++) {
    dias.push(zeraMeta({ d: d, ativos: 0, novos: 0, acesso: 0, oferta: 0, venda: 0, acesso_n: 0, oferta_n: 0, venda_n: 0 }));
  }
  let noPeriodo = 0;
  for (let v = 0; v < NV; v++) {
    if (!vAt[v]) continue;
    noPeriodo++;
    const est = D.veics[v][5];
    for (let d = de; d <= ate; d++) {
      if (!bit(vAt[v], d)) continue;
      const g = dias[d - de];
      const nv = est === d;
      const i = ultimaNoDia(vNegs[v], d);
      const p = acumulado(i, d);
      somaMeta(g, i, v, nv, d);
      g.ativos++;
      if (nv) g.novos++;
      if (p.ac) { g.acesso++; if (nv) g.acesso_n++; }
      if (p.of) { g.oferta++; if (nv) g.oferta_n++; }
      if (p.ve) { g.venda++; if (nv) g.venda_n++; }
    }
  }

  /* ── lojistas por dia ─────────────────────────────────────────────── */
  const lojistas = dias.map((g) => ({ d: g.d, logaram: 0, acessaram: 0, ofertaram: 0, compraram: 0 }));
  const totLoj = { logaram: 0, acessaram: 0, ofertaram: 0, compraram: 0 };
  [['logaram', lLog], ['acessaram', lAc], ['ofertaram', lOf], ['compraram', lCo]].forEach((p) => {
    p[1].forEach((m) => {
      if (!m) return;
      totLoj[p[0]]++;
      for (let d = de; d <= ate; d++) if (bit(m, d)) lojistas[d - de][p[0]]++;
    });
  });

  /* ── cartões: os eventos ativos no dia de referência ─────────────────
     De cada veículo, a negociação do evento mais recente entre os ativos
     no dia: o mesmo carro num feirão que fecha e noutro que abre no mesmo
     dia conta uma vez, pelo status do que abriu. */
  const ref = ate;
  const ativoNoRef = (e) => e.d0 <= ref && ref <= e.d1;
  /* "evAtivo" diz quais eventos contam, "passa" quais negociações deles.
     Uma função só para o total e para cada comitente: o cartão do
     comitente é, por construção, o total com aquele comitente filtrado */
  const cartoes = (evAtivo, passa) => {
    let nEv = 0;
    D.eventos.forEach((e, i) => { if (evAtivo(e, i)) nEv++; });
    const melhor = {};
    D.negs.forEach((n, i) => {
      if (!evAtivo(D.eventos[n[0]], n[0]) || !passa(n)) return;
      const j = melhor[n[1]];
      if (j === undefined) { melhor[n[1]] = i; return; }
      const a = D.eventos[n[0]].fim;
      const b = D.eventos[D.negs[j][0]].fim;
      if (a > b || (a === b && i > j)) melhor[n[1]] = i;
    });
    /* os status em funil (Thomas, 06/11): Com oferta e VMV atingido
       acumulam os status de depois. Com oferta = teve lance de loja até o
       dia de referência, ou vendeu até ele; VMV atingido = o maior lance
       chegou ao VMV, ou vendeu. Vendidos (2, 3, 7) cabem no VMV atingido, que cabe no
       Com oferta. Removidos (8 suspenso, 10 cancelado) é à parte: o
       removido que teve lance conta também em Com oferta. O 11 ("sem
       ofertas") não é Removido: num dia passado ele é o status de quase
       todo carro de evento já fechado (1.618 de 1.862 em 24/10, coleta de
       03/11). Sem oferta (o que falta para os veículos) não tem cartão.
       Com oferta é, no dia de hoje, o "com oferta" do gráfico (todas as
       lojas: o cartão é o estado do veículo e não segue o responsável) */
    const ateRef = faixa(0, ref);
    const c = {
      ref: ref, eventos: nEv, veiculos: 0, comitentes: 0, sem_oferta: 0,
      com_oferta: 0, co_abertos: 0, co_analise: 0, co_encerrados: 0,
      vmv: 0, vm_abertos: 0, vm_analise: 0, vm_encerrados: 0,
      vendidos: 0, aguardando: 0, vendido: 0, valor: 0,
      removidos: 0, rem_cancelado: 0, rem_suspenso: 0
    };
    const comRef = {};
    Object.keys(melhor).forEach((v) => {
      const i = melhor[v];
      const n = D.negs[i];
      const st = n[3];
      c.veiculos++;
      if (n[2] >= 0) comRef[n[2]] = 1;
      /* vendido ATÉ o dia: num dia passado, o carro que vendeu depois ainda
         não é vendido (o mesmo corte do gráfico; sem isso, em 29/10 o cartão
         dava 150 com oferta e o gráfico 86) */
      const vendeu = ST_VENDA.indexOf(st) >= 0 && (!X.ven[i] || X.ven[i][3] <= ref);
      if (vendeu) {
        c.vendidos++;
        if (st === 7) c.vendido++; else c.aguardando++;
        if (X.ven[i]) c.valor += X.ven[i][2];
      }
      if (ST_REMOVIDO.indexOf(st) >= 0) {
        c.removidos++;
        if (st === 10) c.rem_cancelado++; else c.rem_suspenso++;
      }
      /* lance de antes do piso (sem bit) conta; o de depois do dia, não */
      let maior = null;
      X.of[i].forEach((o) => {
        if (o[4] && !(o[4] & ateRef)) return;
        if (maior === null || o[3] > maior) maior = o[3];
      });
      const fase = st === 1 ? 'abertos' : ST_ANALISE.indexOf(st) >= 0 ? 'analise' : 'encerrados';
      if (maior === null && !vendeu) { c.sem_oferta++; return; }
      c.com_oferta++;
      c['co_' + fase]++;
      if (vendeu || (n[4] !== null && maior >= n[4])) {
        c.vmv++;
        c['vm_' + fase]++;
      }
    });
    c.comitentes = Object.keys(comRef).length;
    return c;
  };
  const k = cartoes((e, i) => evOk[i] && ativoNoRef(e), nOk);

  /* ── os cartões por comitente (03/11): os mesmos indicadores do dia, um
     cartão por comitente com evento ativo no dia. Ignoram o PRÓPRIO filtro
     de comitente — eles são o filtro, e o escolhido não pode sumir junto
     com os outros. Os demais filtros valem. */
  const evOkSemCom = D.eventos.map((e, i) => (!wl || e.wls.indexOf(wl) >= 0) && (ev < 0 || i === ev) && evCatOk(i));
  const comHoje = {};
  D.eventos.forEach((e, i) => { if (evOkSemCom[i] && ativoNoRef(e)) e.comits.forEach((c) => { comHoje[c] = 1; }); });
  const porComit = Object.keys(comHoje).map(Number).map((c) => Object.assign({ comit: c },
    cartoes((e, i) => evOkSemCom[i] && ativoNoRef(e) && e.comits.indexOf(c) >= 0, (n) => n[2] === c && catOk(n))))
    .filter((c) => c.veiculos > 0)
    .sort((a, b) => b.veiculos - a.veiculos || a.comit - b.comit);

  /* ── a lista por evento (03/11): os eventos ativos no dia, com os mesmos
     indicadores. Ignora o PRÓPRIO filtro de evento (ela é o filtro) e segue
     o de comitente: escolher um comitente estreita a lista aos eventos dele */
  const evListaOk = D.eventos.map((e, i) => ativoNoRef(e) && (!wl || e.wls.indexOf(wl) >= 0) &&
    (comit < 0 || e.comits.indexOf(comit) >= 0) && evCatOk(i));
  const doComit = (n) => (comit < 0 || n[2] === comit) && catOk(n);
  const porEvento = [];
  evListaOk.forEach((ok, i) => {
    if (!ok) return;
    /* evento aberto sem veículo também entra, com zeros: o big number de
       eventos ativos conta ele (em 03/11, 1 dos 26) */
    porEvento.push(Object.assign({ ev: i }, cartoes((e, j) => j === i, doComit)));
  });
  porEvento.sort((a, b) => b.veiculos - a.veiculos || (D.eventos[a.ev].fim < D.eventos[b.ev].fim ? -1 : 1));

  /* ── o indicador do dia, por grupo (Thomas, 03/11): com acesso, com
     oferta, vendido — acumulado até o dia "d" (06/11) — para a rosca do
     cartão e o termômetro da lista. É a MESMA conta do gráfico (veículo
     ativo no dia, a negociação do evento mais recente ativo nele, acesso,
     oferta ou venda até o dia, só as lojas do responsável): a prova confere
     com o gráfico filtrado pelo comitente ou pelo evento. Sai para o dia de
     referência e para o anterior, de onde vem a diferença em p.p. */
  const vazioDia = () => zeraMeta({ ativos: 0, novos: 0, acesso: 0, oferta: 0, venda: 0, acesso_n: 0, oferta_n: 0, venda_n: 0 });
  const indicadorDia = (grupoDe, d) => {
    const out = {};
    if (d < 0) return out;
    const pv = {};
    D.negs.forEach((n, i) => {
      if (!bit(X.evMask[n[0]], d)) return;
      const g = grupoDe(n);
      if (g === null) return;
      const kk = g + '|' + n[1];
      if (!pv[kk]) { pv[kk] = { g: g, v: n[1], l: [i] }; return; }
      pv[kk].l.push(i);
    });
    Object.keys(pv).forEach((kk) => {
      const i = ultimaNoDia(pv[kk].l, d);
      const p = Object.assign(pv[kk], acumulado(i, d));
      const g = out[p.g] || (out[p.g] = vazioDia());
      const nv = D.veics[p.v][5] === d;
      somaMeta(g, i, p.v, nv, d);
      g.ativos++;
      if (nv) g.novos++;
      if (p.ac) { g.acesso++; if (nv) g.acesso_n++; }
      if (p.of) { g.oferta++; if (nv) g.oferta_n++; }
      if (p.ve) { g.venda++; if (nv) g.venda_n++; }
    });
    return out;
  };
  const grupoComit = (n) => (n[2] >= 0 && comHoje[n[2]] && evOkSemCom[n[0]] && catOk(n) ? n[2] : null);
  const grupoEvento = (n) => (evListaOk[n[0]] && doComit(n) ? n[0] : null);
  /* o cartão do comitente leva a semana (Thomas, 03/11): o indicador nos
     últimos 7 dias até o de referência; o dia e o anterior saem dela. Dia
     antes do começo da janela fica null. A lista de eventos só precisa do
     dia e do anterior */
  /* a linha do cartão: o indicador DE CADA DIA nos últimos 7 dias até o de
     referência (Thomas, 06/11: "a linha deve ser o indicador por dia" —
     por umas horas foi a média móvel de 7 dias). A referência é a meta, reta.
     O dia e o anterior saem dela; dia antes da janela fica null */
  const SEMANA = 7;
  const semana = [];
  for (let j = SEMANA - 1; j >= 0; j--) semana.push({ d: ref - j, g: indicadorDia(grupoComit, ref - j) });
  porComit.forEach((c) => {
    c.hist = semana.map((s) => (s.d < 0 ? null : Object.assign({ d: s.d }, s.g[c.comit] || vazioDia())));
    c.dia = c.hist[SEMANA - 1];
    c.dia_ant = c.hist[SEMANA - 2];
  });
  const evHoje = indicadorDia(grupoEvento, ref);
  const evAnt = indicadorDia(grupoEvento, ref - 1);
  porEvento.forEach((c) => {
    c.dia = evHoje[c.ev] || vazioDia();
    c.dia_ant = ref > 0 ? (evAnt[c.ev] || vazioDia()) : null;
  });

  /* ── a tabela: um veículo por linha, pela negociação mais recente do
     período. Acessos, ofertas e maior oferta somam as negociações do
     período, só das lojas que passam no filtro de responsável. */
  const veiculos = [];
  for (let v = 0; v < NV; v++) {
    const ns = vNegs[v];
    if (!ns) continue;
    let ult = ns[0];
    ns.forEach((i) => {
      const a = D.eventos[D.negs[i][0]].fim;
      const b = D.eventos[D.negs[ult][0]].fim;
      if (a > b || (a === b && i > ult)) ult = i;
    });
    const quemAc = {};
    const quemOf = {};
    let lances = 0;
    let maior = null;
    const evs = {};
    ns.forEach((i) => {
      evs[D.negs[i][0]] = 1;
      X.ac[i].forEach((a) => { if (lojaOk[a[1]] && (a[2] & per)) quemAc[a[1]] = 1; });
      X.of[i].forEach((o) => {
        if (!lojaOk[o[1]]) return;
        quemOf[o[1]] = 1;
        lances += o[2];
        if (maior === null || o[3] > maior) maior = o[3];
      });
    });
    const n = D.negs[ult];
    const vmv = n[4];
    const fipe = n[5];
    const s = X.ven[ult];
    let farol = 'sem';
    if (maior !== null) farol = vmv !== null && maior >= vmv ? 'atingiu' : 'abaixo';
    const vv = D.veics[v];
    veiculos.push({
      v: v, nome: [vv[0], vv[1], vv[2]].filter((x) => x).join(' ') || '(sem modelo)',
      ev: n[0], n_ev: Object.keys(evs).length, comit: n[2], status: n[3],
      acessos: Object.keys(quemAc).length, lances: lances, ofertantes: Object.keys(quemOf).length,
      maior: maior, vmv: vmv, fipe: fipe,
      pvmv: maior !== null && vmv ? maior / vmv : null,
      pfipe: maior !== null && fipe ? maior / fipe : null,
      vendido: ST_VENDA.indexOf(n[3]) >= 0,
      comprador: s && ST_VENDA.indexOf(n[3]) >= 0 ? s[1] : null,
      venda: s && ST_VENDA.indexOf(n[3]) >= 0 ? s[2] : null,
      estreia: vv[5], farol: farol
    });
  }

  return { de: de, ate: ate, kpi: k, por_comit: porComit, por_evento: porEvento, dias: dias, lojistas: lojistas, tot_lojistas: totLoj,
    veiculos_periodo: noPeriodo, veiculos: veiculos };
}

/* ══════════════════════════════════════════════════════════════════════
   calculaMes(D, F) — a aba Mensal (Thomas, 06/11; refeita em 19/11). "F",
   todos texto ('' = todos): wl (id do canal), comit (índice em
   D.mes.comitentes), cat (L, P, E, N), mes (índice, 0 = o mais antigo;
   vazio = o mês corrente), ev (índice em D.mes.eventos), sit ('at' ativos,
   'fin' finalizados), ini_de, ini_ate, fim_de, fim_ate ('AAAA-MM-DD': o
   dia de início e o de fim do evento). Roda aqui e na página, como o
   calcula(). Os meses e os dias saem com os MESMOS nomes de campo do Diário
   (ativos, novos, acesso, oferta, venda e os "_n", os status): a rosca, a
   área, o Δ e a tabela de status dos cartões servem às duas abas.

   O QUE CADA FILTRO RECORTA (19/11)
     wl, sit, datas  os EVENTOS: o veículo conta pelo evento dono dele no
                     mês (a negociação mais recente) — escolher "Ativos"
                     mostra os veículos cujo evento mais recente no mês
                     segue aberto
     ev              o evento escolhido: os veículos DELE (a linha da
                     tabela de eventos), não só os de que ele é o dono
     comit, cat      a negociação escolhida e o veículo, como antes
     mes             o mês dos cartões, da tabela de eventos e dos
                     gráficos dia a dia
   Lojistas: as lojas dos eventos que passam (a máscara de cada evento,
   juntada por loja); seguem o comitente pelo evento e não seguem a
   categoria.
   ══════════════════════════════════════════════════════════════════════ */
function calculaMes(D, F) {
  F = F || {};
  const M = D.mes;
  const N = M.meses.length;
  const vazio = (x) => x === undefined || x === null || x === '';
  const ref = vazio(F.mes) ? N - 1 : Number(F.mes);
  const comit = vazio(F.comit) ? -1 : Number(F.comit);
  /* categoria (06/11): recorta as linhas de veículos; os lojistas não a
     seguem (a página avisa) */
  const cat = vazio(F.cat) ? '' : String(F.cat);
  const ev = vazio(F.ev) ? -1 : Number(F.ev);
  /* canal, situação e datas: evPassaF (24/11) */
  /* os status do SISTEMA (Thomas, 17/11), da negociação mais recente do
     veículo no mês, em cinco grupos que não se cruzam e somam os veículos:
     Ativos (1); Em análise (9 do comprador, 13 do vendedor); Vendidos (2 e
     3 aguardando pagamento, 7 vendido); Não vendidos (11 sem ofertas, 14 e
     15 rejeitados, 18 venda cancelada, e status fora do domínio); Removidos
     (8 suspenso, 10 cancelado). "ativos" segue sendo a BASE do indicador
     (todos os veículos do mês, como no diário); o status 1 é "st_ativo" */
  const GRUPO_ST = { st_ativo: [1], an_comprador: [9], an_vendedor: [13], aguardando: [2, 3], vendido: [7],
    sem_ofertas: [11], rejeitados: [14, 15], venda_cancelada: [18], suspensos: [8], cancelados: [10] };
  const CAMPOS_ST = Object.keys(GRUPO_ST).concat(['outros', 'analise', 'vendidos', 'nao_vendidos', 'removidos']);
  const POS_ST = {};
  Object.keys(GRUPO_ST).forEach((k) => { POS_ST[k] = GRUPO_ST[k].map((x) => M.status.indexOf(x)); });
  const zero = (m) => {
    const o = { m: m, rot: M.meses[m], veiculos: 0, ativos: 0, novos: 0, acesso: 0, oferta: 0, venda: 0,
      acesso_n: 0, oferta_n: 0, venda_n: 0, com_oferta: 0, valor: 0,
      eventos: 0, comitentes: 0, mt: 0, mo: 0, mv: 0, mt_n: 0, mo_n: 0, mv_n: 0 };
    CAMPOS_ST.forEach((k) => { o[k] = 0; });
    return o;
  };
  /* a meta do mês (06/11): cada veículo leva a meta do canal do evento, do
     comitente e da categoria dele (19/11: o canal entrou; evento de mais de
     um canal leva a média dos que têm meta; a planilha sem canal, 0, vale
     para todos). D.metas.mes[m] é a aba do mês m (17/11) */
  const metaMes = D.metas ? D.metas.mes : [];
  const metaVeic = (mp, wls, c, ct) => {
    if (!mp) return null;
    let n = 0;
    let o = 0;
    let v = 0;
    wls.forEach((w) => { const x = mp[w + '|' + c + '|' + ct]; if (x) { n++; o += x[0]; v += x[1]; } });
    return n ? [o / n, v / n] : (mp['0|' + c + '|' + ct] || null);
  };
  const E = M.eventos;
  /* índices montados uma vez, guardados no próprio dado: as categorias de
     cada evento e as lojas de cada evento em cada mês, desmontadas */
  if (!M._ix) {
    const ix = { cats: E.map(() => ({})), loj: [] };
    M.ev.forEach((r) => { ix.cats[r[1]][r[3]] = 1; });
    ix.loj = M.lojd.map((lst) => lst.map((x) => {
      const out = [];
      String(x[1]).split(',').forEach((t) => {
        if (!t) return;
        const q = t.split('.');
        out.push(parseInt(q[0], 36), parseInt(q[1] || '0', 36), parseInt(q[2] || '0', 36), parseInt(q[3] || '0', 36));
      });
      return [x[0], out];
    }));
    M._ix = ix;
  }
  const X = M._ix;
  const serie = () => M.meses.map((r, m) => zero(m));
  /* o bloco: [veículos, novos, com acesso, com oferta, vendidos, os "_n",
     [status], valor] */
  const soma = (o, b, mm) => {
    o.veiculos += b[0]; o.ativos += b[0]; o.novos += b[1];
    o.acesso += b[2]; o.oferta += b[3]; o.venda += b[4];
    o.acesso_n += b[5]; o.oferta_n += b[6]; o.venda_n += b[7];
    o.com_oferta += b[3];
    const st = b[8];
    Object.keys(POS_ST).forEach((k) => { POS_ST[k].forEach((q) => { o[k] += st[q]; }); });
    o.outros += st[M.status.length];
    o.analise = o.an_comprador + o.an_vendedor;
    o.vendidos = o.aguardando + o.vendido;
    o.nao_vendidos = o.sem_ofertas + o.rejeitados + o.venda_cancelada + o.outros;
    o.removidos = o.suspensos + o.cancelados;
    o.valor += b[9];
    if (mm) {
      o.mt += b[0]; o.mo += b[0] * mm[0]; o.mv += b[0] * mm[1];
      o.mt_n += b[1]; o.mo_n += b[1] * mm[0]; o.mv_n += b[1] * mm[1];
    }
  };
  /* o evento passa nos filtros de evento (canal, situação, datas); o
     filtro de evento em si fica à parte, porque a tabela o ignora */
  const evBase = E.map((e) => evPassaF(e, F));
  const evPassa = E.map((e, i) => evBase[i] && (ev < 0 || i === ev));
  const evCatOk = (i) => cat === '' || X.cats[i][cat] === 1;
  const evComOk = (i) => comit < 0 || E[i][6].indexOf(comit) >= 0;
  /* com um evento escolhido valem os veículos DELE ("o", posição 4); sem,
     os de que cada evento é o dono ("d", posição 5), que somam sem repetir */
  const BL = ev >= 0 ? 4 : 5;

  /* ── a META DO EVENTO (Thomas, 24/11: "o % que temos que atingir no
     evento para atingir a meta mensal considerando o volume e as vendas dos
     eventos finalizados"; era a "meta ajustada" de 19/11, e a regra de
     24/11 — compensar só os que terminaram antes de cada evento abrir —
     saiu). Por grupo — os canais do evento, o comitente e a categoria, o
     grão da planilha —, com os veículos DO MÊS (cada um pelo evento dono
     dele): o que os eventos ainda ativos precisam fazer para o mês fechar
     na meta,
         (meta × veículos do mês − realizado nos finalizados) ÷ veículos dos ativos,
     limitada a 0% e 100% (abaixo de 0: a meta já está garantida; acima de
     100%: não dá mais para chegar). É do grupo inteiro: os filtros não
     mexem nela, só escolhem os veículos que a mostram. A de um recorte (o
     evento, o comitente, os cartões) é a média dos grupos dos veículos
     ativos dele, pesada pelos veículos. Só existe no mês corrente: num mês
     fechado não há evento ativo */
  const aj = {};
  M.ev.forEach((r) => {
    if (r[0] !== ref) return;
    const b = r[5];
    if (!b[0]) return;
    const k = E[r[1]][5].join(',') + '|' + r[2] + '|' + r[3];
    const g = aj[k] || (aj[k] = { n: 0, at: 0, of: 0, ve: 0, mm: metaVeic(metaMes[ref], E[r[1]][5], r[2], r[3]) });
    g.n += b[0];
    if (E[r[1]][7]) { g.of += b[3]; g.ve += b[4]; } else g.at += b[0];
  });
  const lim01 = (x) => ({ x: Math.max(0, Math.min(1, x)), cru: x });
  Object.keys(aj).forEach((k) => {
    const g = aj[k];
    const f = (q, real) => (g.mm && g.at ? lim01((g.mm[q] * g.n - real) / g.at) : null);
    g.aj_of = f(0, g.of);
    g.aj_ve = f(1, g.ve);
  });
  const grupoDe = (r) => aj[E[r[1]][5].join(',') + '|' + r[2] + '|' + r[3]];
  /* a soma pesada da meta do evento: [Σ oferta × veíc., Σ venda × veíc., veículos] */
  const somaEv = (a, g, n) => { if (g && g.aj_of) { a[0] += g.aj_of.x * n; a[1] += g.aj_ve.x * n; a[2] += n; } };
  const metaEv = (a) => ({ oferta: a[2] ? a[0] / a[2] : null, venda: a[2] ? a[1] / a[2] : null });
  const evTot = [0, 0, 0];
  const evC = {};

  const meses = serie();
  /* por comitente, sem o PRÓPRIO filtro de comitente (os cartões são o
     filtro, como no dia) */
  const porC = {};
  const comNoMes = meses.map(() => ({}));
  M.ev.forEach((r) => {
    if (!evPassa[r[1]] || (cat && r[3] !== cat)) return;
    const b = r[BL];
    if (!b[0]) return;
    const m = r[0];
    const c = r[2];
    const mm = metaVeic(metaMes[m], E[r[1]][5], c, r[3]);
    const g = m === ref && !E[r[1]][7] ? grupoDe(r) : null;
    if (c >= 0) {
      soma((porC[c] || (porC[c] = serie()))[m], b, mm);
      somaEv(evC[c] || (evC[c] = [0, 0, 0]), g, b[0]);
    }
    if (comit >= 0 && c !== comit) return;
    soma(meses[m], b, mm);
    somaEv(evTot, g, b[0]);
    if (c >= 0) comNoMes[m][c] = 1;
  });
  meses.forEach((o, m) => { o.comitentes = Object.keys(comNoMes[m]).length; });
  /* eventos ativos em algum dia do mês */
  E.forEach((e, i) => {
    if (!evPassa[i] || !evCatOk(i)) return;
    for (let m = e[3]; m <= e[4]; m++) {
      if (evComOk(i)) meses[m].eventos++;
      e[6].forEach((c) => { if (porC[c]) porC[c][m].eventos++; });
    }
  });
  /* lojas distintas: as máscaras dos eventos que passam, juntadas por loja.
     No mês de referência, também dia a dia */
  const NL = M.n_lojas || 0;
  const mAc = new Int32Array(NL);
  const mOf = new Int32Array(NL);
  const mCo = new Int32Array(NL);
  const nDias = Number(String(M.ult[ref] || '').slice(8, 10)) || 0;
  const lojistasDias = [];
  for (let k = 0; k < nDias; k++) lojistasDias.push({ k: k, acessaram: 0, ofertaram: 0, compraram: 0 });
  meses.forEach((o, m) => {
    const tocadas = [];
    X.loj[m].forEach((x) => {
      const i = x[0];
      if (!evPassa[i] || !evComOk(i)) return;
      const a = x[1];
      for (let j = 0; j < a.length; j += 4) {
        const l = a[j];
        if (!mAc[l] && !mOf[l] && !mCo[l]) tocadas.push(l);
        mAc[l] |= a[j + 1]; mOf[l] |= a[j + 2]; mCo[l] |= a[j + 3];
      }
    });
    const t = { acessaram: 0, ofertaram: 0, compraram: 0 };
    tocadas.forEach((l) => {
      if (mAc[l]) t.acessaram++;
      if (mOf[l]) t.ofertaram++;
      if (mCo[l]) t.compraram++;
      if (m === ref) {
        for (let k = 0; k < nDias; k++) {
          if ((mAc[l] >>> k) & 1) lojistasDias[k].acessaram++;
          if ((mOf[l] >>> k) & 1) lojistasDias[k].ofertaram++;
          if ((mCo[l] >>> k) & 1) lojistasDias[k].compraram++;
        }
      }
      mAc[l] = 0; mOf[l] = 0; mCo[l] = 0;
    });
    o.lojistas = t;
  });
  /* os cartões por comitente do mês escolhido: a rosca do mês, a área dos
     12 meses até ele e o Δ contra o mês anterior */
  const HIST = 12;
  const porComit = Object.keys(porC).map(Number).filter((c) => porC[c][ref].veiculos > 0).map((c) => {
    const hist = [];
    for (let j = HIST - 1; j >= 0; j--) hist.push(ref - j >= 0 ? porC[c][ref - j] : null);
    return Object.assign({ comit: c }, porC[c][ref], { meta_ev: metaEv(evC[c] || [0, 0, 0]), hist: hist, dia: porC[c][ref], dia_ant: ref > 0 ? porC[c][ref - 1] : null });
  }).sort((a, b) => b.veiculos - a.veiculos || a.comit - b.comit);

  /* ── o mês de referência dia a dia (Thomas, 19/11: "uma visão diária dos
     gráficos de veículos ativos e lojistas limitado ao mês de referência mas
     respeitando os demais filtros"). Veículo ativo no dia e o acumulado no
     evento até o dia, como no Diário; o dono do dia é o evento mais
     recente entre os ativos no dia */
  const dias = [];
  for (let k = 0; k < nDias; k++) {
    dias.push({ k: k, ativos: 0, novos: 0, acesso: 0, oferta: 0, venda: 0, acesso_n: 0, oferta_n: 0, venda_n: 0,
      mt: 0, mo: 0, mv: 0, mt_n: 0, mo_n: 0, mv_n: 0 });
  }
  const BLD = ev >= 0 ? 5 : 6;
  M.dia.forEach((r) => {
    if (r[0] !== ref || !evPassa[r[2]] || (cat && r[4] !== cat) || (comit >= 0 && r[3] !== comit)) return;
    const b = r[BLD];
    const g = dias[r[1]];
    if (!b[0] || !g) return;
    g.ativos += b[0]; g.novos += b[1]; g.acesso += b[2]; g.oferta += b[3]; g.venda += b[4];
    g.acesso_n += b[5]; g.oferta_n += b[6]; g.venda_n += b[7];
    const mm = metaVeic(metaMes[ref], E[r[2]][5], r[3], r[4]);
    if (mm) {
      g.mt += b[0]; g.mo += b[0] * mm[0]; g.mv += b[0] * mm[1];
      g.mt_n += b[1]; g.mo_n += b[1] * mm[0]; g.mv_n += b[1] * mm[1];
    }
  });

  /* ── a tabela de eventos do mês (Thomas, 19/11: "semelhante à visão
     diária"): os eventos ativos em algum dia do mês de referência, com os
     veículos DELES. Ignora o PRÓPRIO filtro de evento (ela é o filtro) e
     segue os outros */
  const eventos = [];
  /* a etiqueta do topo da tabela: a meta do evento dos ativos da lista;
     "fora" conta os veículos em grupos que já não chegam (limitada a 100%) */
  const evLista = [0, 0, 0];
  const fora = [0, 0];
  E.forEach((e, i) => {
    if (e[3] > ref || e[4] < ref || !evBase[i] || !evComOk(i) || !evCatOk(i)) return;
    eventos.push(Object.assign(zero(ref), { ev: i, fin: e[7], me: [0, 0, 0], lim_of: 0, lim_ve: 0 }));
  });
  const linhaEv = {};
  eventos.forEach((o, j) => { linhaEv[o.ev] = j; });
  M.ev.forEach((r) => {
    const j = linhaEv[r[1]];
    if (r[0] !== ref || j === undefined || (cat && r[3] !== cat) || (comit >= 0 && r[2] !== comit)) return;
    const o = eventos[j];
    const b = r[4];
    if (!b[0]) return;
    soma(o, b, metaVeic(metaMes[ref], E[r[1]][5], r[2], r[3]));
    /* a coluna: a meta do evento, só nos ativos (o finalizado já está na conta) */
    const g = o.fin ? null : grupoDe(r);
    somaEv(o.me, g, b[0]);
    somaEv(evLista, g, b[0]);
    if (g && g.aj_of) {
      if (g.aj_of.cru > 1) { o.lim_of += b[0]; fora[0] += b[0]; }
      if (g.aj_ve.cru > 1) { o.lim_ve += b[0]; fora[1] += b[0]; }
    }
  });
  eventos.forEach((o) => { o.meta_ev = metaEv(o.me); });
  eventos.sort((a, b) => a.fin - b.fin || b.veiculos - a.veiculos || (E[a.ev][2] < E[b.ev][2] ? 1 : -1));
  return { ref: ref, meses: meses, kpi: meses[ref], ant: ref > 0 ? meses[ref - 1] : null, por_comit: porComit,
    dias: dias, lojistas_dias: lojistasDias, eventos: eventos, meta_ev: metaEv(evTot),
    meta_ev_lista: Object.assign(metaEv(evLista), { veic: evLista[2], fora: { oferta: fora[0], venda: fora[1] } }) };
}

/* o evento do Mensal passa em canal, situação e datas (19/11) — a mesma
   regra no calculaMes, na tabela de veículos do mês e no filtro de evento
   da página. "e" é uma linha de D.mes.eventos */
function evPassaF(e, F) {
  const v = (k) => (F[k] === undefined || F[k] === null ? '' : String(F[k]));
  if (v('wl') && e[5].indexOf(Number(v('wl'))) < 0) return false;
  if ((v('sit') === 'at' && e[7]) || (v('sit') === 'fin' && !e[7])) return false;
  const di = e[1].slice(0, 10);
  const df = e[2].slice(0, 10);
  const d = (k) => v(k).slice(0, 10);
  return !((d('ini_de') && di < d('ini_de')) || (d('ini_ate') && di > d('ini_ate')) || (d('fim_de') && df < d('fim_de')) || (d('fim_ate') && df > d('fim_ate')));
}

/* ══ a tabela de veículos do Mensal (Thomas, 24/11: "inclua a tabela de
   veículos semelhante ao diário com opção de exportar") ════════════════
   O Mensal só tem contagens; o veículo um a um está no dado do Diário, que
   cobre os últimos 31 dias. A tabela é a do Diário (calcula) nos dias do
   mês de referência que caem nessa janela, com os filtros do Mensal. Sem
   evento escolhido, o veículo vem pela negociação mais recente no período
   — o dono, a regra do Mensal — e entra se o evento dela passa em canal,
   situação e datas; com um evento escolhido, os veículos dele. Comitente
   pela negociação, categoria pelo veículo. O mês fora da janela sai vazio
   ("de" > "ate"); o que começa antes dela, só a parte de dentro
   ("parcial"). Os eventos e os comitentes das duas listas casam pelo id
   (D.ev_mes, D.com_mes) */
function calculaVeicMes(D, F) {
  F = F || {};
  const M = D.mes;
  const vazio = (x) => x === undefined || x === null || x === '';
  const ref = vazio(F.mes) ? M.meses.length - 1 : Number(F.mes);
  const utc = (s, a, m, d) => Date.UTC(Number(s.slice(0, 4)) + a, Number(s.slice(5, 7)) - 1 + m, d);
  const p0 = utc(D.piso_dia, 0, 0, Number(D.piso_dia.slice(8, 10)));
  const d0 = Math.round((utc(M.meses[ref], 0, 0, 1) - p0) / 86400000);
  const d1 = Math.round((utc(M.meses[ref], 0, 1, 0) - p0) / 86400000);
  const o = { ref: ref, de: Math.max(0, d0), ate: Math.min(D.hoje, d1), parcial: d0 < 0, linhas: [] };
  const evD = vazio(F.ev) ? -1 : D.ev_mes.indexOf(Number(F.ev));
  if (o.de > o.ate || (!vazio(F.ev) && evD < 0)) return o;
  const c = vazio(F.comit) ? -1 : Number(F.comit);
  /* sem_rem: a negociação removida não existe no Mensal (Thomas, 25/11); o
     veículo vem pela mais recente das outras, como no cartão */
  o.linhas = calcula(D, { de: o.de, ate: o.ate, ev: evD < 0 ? '' : evD, sem_rem: true }).veiculos.filter((x) => {
    const e = M.eventos[D.ev_mes[x.ev]];
    return !!e && (evD >= 0 || evPassaF(e, F)) && (c < 0 || D.com_mes[x.comit] === c) && (vazio(F.cat) || D.veics[x.v][7] === F.cat);
  });
  return o;
}

function APP(D, LOGO) {
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s === null || s === undefined ? '' : s)
    .split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;').split('"').join('&quot;');
  const nf = (n) => (n === null || n === undefined ? '—' : Number(n).toLocaleString('pt-BR'));
  const rs = (n) => (n === null || n === undefined ? '—' : 'R$ ' + Math.round(n).toLocaleString('pt-BR'));
  const pc = (x) => (x === null || x === undefined ? '—' : (100 * x).toFixed(1).replace('.', ',') + '%');
  const pc0 = (x) => (x === null || x === undefined ? '—' : Math.round(100 * x) + '%');
  const dt = (s) => (s ? s.slice(8, 10) + '/' + s.slice(5, 7) + '/' + s.slice(2, 4) + ' ' + s.slice(11, 16) : '—');
  const P0 = Date.UTC(Number(D.piso_dia.slice(0, 4)), Number(D.piso_dia.slice(5, 7)) - 1, Number(D.piso_dia.slice(8, 10)));
  const SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  const dataDia = (d) => new Date(P0 + d * 86400000);
  const rotDia = (d) => { const x = dataDia(d); return String(x.getUTCDate()).padStart(2, '0') + '/' + String(x.getUTCMonth() + 1).padStart(2, '0'); };
  const rotDiaLongo = (d) => SEMANA[dataDia(d).getUTCDay()] + ' ' + rotDia(d);

  const FAROL = { sem: 'Sem oferta', abaixo: 'Oferta abaixo do VMV', atingiu: 'VMV atingido' };
  const KPI = {
    acesso: { nome: 'Com acesso', linha: '% com acesso' },
    oferta: { nome: 'Com oferta', linha: '% com oferta' },
    venda: { nome: 'Vendidos', linha: '% vendidos' }
  };
  const tagStatus = (st) => {
    const nome = D.status_nome[st] || ('status ' + st);
    let cls = '';
    if ([2, 3, 7].indexOf(st) >= 0) cls = 'ok';
    else if (st === 11 || st === 10 || st === 8) cls = 'ruim';
    else if ([14, 15, 18].indexOf(st) >= 0) cls = 'atencao';
    return '<span class="tag ' + cls + '">' + esc(nome) + '</span>';
  };
  /* "m": a meta, um traço vertical sobre o trilho (06/11) */
  const trilho = (x, m) => '<span class="trilho" aria-hidden="true"><i style="width:' +
    (x === null ? 0 : Math.max(0, Math.min(100, 100 * x))).toFixed(1) + '%"></i>' +
    (m === null || m === undefined ? '' : '<b class="marca-meta" style="left:' + Math.max(0, Math.min(99, 100 * m)).toFixed(1) + '%"></b>') + '</span>';

  /* o link do anúncio: {host}/anuncio/veiculo/{marca}/{modelo}/{versao}/{uuid},
     o padrão do Radar e do Painel C6. Evento só dos canais do C6 abre na
     vitrine do C6; faltando um pedaço, sem link */
  const linkDe = (r) => {
    const vv = D.veics[r.v];
    const partes = [vv[0], vv[1], vv[2]].map((x) => String(x || '').trim());
    if (!vv[6] || partes.some((p) => !p)) return null;
    const wls = D.eventos[r.ev].wls;
    const soC6 = wls.length > 0 && wls.every((w) => D.vitrine_c6.indexOf(w) >= 0);
    return (soC6 ? 'https://compraveiculos.cars2you.com.br' : 'https://cars2you.com.br') +
      '/anuncio/veiculo/' + partes.map((p) => encodeURIComponent(p.toLowerCase())).join('/') + '/' + vv[6];
  };

  const F = { wl: '', comit: '', cat: '', ev: '', resp: '', de: '', ate: '' };
  const FILTROS = ['wl', 'comit', 'cat', 'ev', 'resp', 'de', 'ate'];
  /* as categorias do filtro (06/11), na ordem da planilha de metas */
  const CATEGORIAS = [['L', 'Leves (motos inclusive)'], ['P', 'Pesados'], ['E', 'Equipamentos'], ['N', 'Não informada']];
  const EV_CATS = D.eventos.map(() => ({}));
  D.negs.forEach((n) => { EV_CATS[n[0]][D.veics[n[1]][7]] = 1; });
  /* a aba Mensal (06/11) tem os filtros dela: canal, comitente e mês */
  /* os filtros do Mensal (19/11: evento, situação e as datas de início e
     de fim do evento entraram) */
  /* a situação (24/11) subiu para o topo, no lugar das abas Diário e
     Mensal: Ativos, Finalizados ou Todos, nasce em Ativos. Não é filtro da
     gaveta — não conta no número da aba nem sai no Limpar */
  const FM = { wl: '', comit: '', cat: '', mes: '', ev: '', sit: 'at', ini_de: '', ini_ate: '', fim_de: '', fim_ate: '' };
  const FILTROS_M = ['wl', 'comit', 'cat', 'mes', 'ev', 'ini_de', 'ini_ate', 'fim_de', 'fim_ate'];
  const DATAS_M = [['f-m-ini-de', 'ini_de'], ['f-m-ini-ate', 'ini_ate'], ['f-m-fim-de', 'fim_de'], ['f-m-fim-ate', 'fim_ate']];
  /* as categorias de cada evento do Mensal, para o filtro de evento */
  const EV_CATS_M = D.mes.eventos.map(() => ({}));
  D.mes.ev.forEach((r) => { EV_CATS_M[r[1]][r[3]] = 1; });
  /* os gráficos do Mensal: os 12 meses ou os dias do mês de referência (19/11) */
  const VIS_M = { at: 'mes', lj: 'mes' };
  let aba = 'dia';
  /* o indicador nasce em Com oferta (Thomas, 06/11): é o que tem meta */
  let kpi = 'oferta';
  let modo = 'todos';
  let busca = '';
  const PASSO = 100;

  /* ── tabela ordenável, com página ──────────────────────────────────────
     Clique no título ordena pela coluna; clique de novo inverte. Vazio vai
     sempre para o fim. São milhares de veículos: desenha os primeiros
     PASSO, e o botão embaixo traz mais. */
  const ordem = { veic: { k: 'lances', dir: -1 }, 'veic-m': { k: 'lances', dir: -1 } };
  const TABELAS = {};
  function tabela(id, cols, linhas) {
    const lim = TABELAS[id] ? TABELAS[id].lim : PASSO;
    TABELAS[id] = { cols: cols, linhas: linhas, lim: lim };
    desenhaTabela(id);
  }
  /* as linhas na ordem da tabela: a página e o Exportar (24/11) */
  function ordena(id) {
    const t = TABELAS[id];
    const o = ordem[id];
    const col = t.cols.find((c) => c.k === o.k) || t.cols[0];
    const val = (r) => (col.v ? col.v(r) : r[col.k]);
    const idx = t.linhas.map((r, i) => [r, i]);
    idx.sort((a, b) => {
      const x = val(a[0]);
      const y = val(b[0]);
      const vx = x === null || x === undefined;
      const vy = y === null || y === undefined;
      if (vx || vy) return vx === vy ? a[1] - b[1] : (vx ? 1 : -1);
      if (x === y) return a[1] - b[1];
      if (typeof x === 'string') return o.dir * x.localeCompare(y);
      return o.dir * (x < y ? -1 : 1);
    });
    return idx;
  }
  function desenhaTabela(id) {
    const t = TABELAS[id];
    const o = ordem[id];
    const idx = ordena(id);
    $('#th-' + id).innerHTML = t.cols.map((c) => {
      const at = c.k === o.k;
      return '<th class="' + (c.n ? 'n' : '') + '"' + (at ? ' aria-sort="' + (o.dir > 0 ? 'ascending' : 'descending') + '"' : '') + '>' +
        '<button type="button" class="ord' + (at ? ' at' : '') + '" data-t="' + id + '" data-k="' + c.k + '">' +
        esc(c.t) + '<span class="seta-ord" aria-hidden="true">' + (at ? (o.dir > 0 ? '▲' : '▼') : '') + '</span></button></th>';
    }).join('');
    const vis = idx.slice(0, t.lim);
    $('#tb-' + id).innerHTML = vis.length
      ? vis.map((p) => '<tr>' + t.cols.map((c) => '<td class="' + (c.n ? 'n' : '') + (c.cls ? ' ' + c.cls : '') + '">' +
          (c.h ? c.h(p[0]) : esc(p[0][c.k])) + '</td>').join('') + '</tr>').join('')
      : '<tr><td colspan="' + t.cols.length + '" class="dim">Nada neste recorte.</td></tr>';
    const resta = idx.length - vis.length;
    const b = $('#mais-' + id);
    b.hidden = resta <= 0;
    b.textContent = 'Mostrar mais ' + nf(Math.min(PASSO, resta)) + ' · ' + nf(vis.length) + ' de ' + nf(idx.length);
  }
  document.addEventListener('click', (ev) => {
    const b = ev.target.closest('button.ord[data-t]');
    if (!b) return;
    const id = b.getAttribute('data-t');
    const k = b.getAttribute('data-k');
    const t = TABELAS[id];
    const c = t.cols.find((x) => x.k === k);
    if (ordem[id].k === k) ordem[id].dir = -ordem[id].dir;
    else { ordem[id].k = k; ordem[id].dir = c.n ? -1 : 1; }
    desenhaTabela(id);
  });
  ['veic', 'veic-m'].forEach((id) => $('#mais-' + id).addEventListener('click', () => {
    TABELAS[id].lim += PASSO;
    desenhaTabela(id);
  }));

  /* ── balão dos gráficos: um só para a página (regra 8b) ────────────── */
  const dica = $('#dica-g');
  function mostraDica(alvo, html) {
    dica.innerHTML = html;
    dica.hidden = false;
    const r = alvo.getBoundingClientRect();
    const w = dica.offsetWidth;
    let x = r.left + r.width / 2 - w / 2;
    x = Math.max(8, Math.min(window.innerWidth - w - 8, x));
    let y = r.top - dica.offsetHeight - 8;
    if (y < 8) y = r.bottom + 8;
    dica.style.left = x + 'px';
    dica.style.top = y + 'px';
  }
  const escondeDica = () => { dica.hidden = true; };
  ['mouseover', 'focusin'].forEach((tipo) => document.addEventListener(tipo, (ev) => {
    const a = ev.target.closest ? ev.target.closest('[data-dica]') : null;
    if (a) mostraDica(a, a.getAttribute('data-dica'));
  }));
  ['mouseout', 'focusout'].forEach((tipo) => document.addEventListener(tipo, (ev) => {
    const a = ev.target.closest ? ev.target.closest('[data-dica]') : null;
    if (a) escondeDica();
  }));
  window.addEventListener('scroll', escondeDica, { passive: true });

  /* ── os dois gráficos, em SVG, na largura real da caixa ──────────────
     O viewBox tem a largura da caixa em pixels: o texto sai em 10,5px no
     telefone e no monitor, em vez de encolher junto com o desenho.
     São séries densas (até 31 dias) e com duas medidas no mesmo gráfico:
     a exceção da regra 3 — eixo com grade e sem rótulo em cada ponto; o
     valor de cada dia está no balão. */
  const ALT_G = 280;
  const passoRedondo = (topo) => {
    const p = Math.pow(10, Math.floor(Math.log(Math.max(1, topo)) / Math.LN10)) / 10;
    return Math.max(1, [1, 2, 5, 10, 20, 50].map((m) => m * p).find((c) => topo / c <= 5) || p * 100);
  };
  const largura = (alvo) => Math.max(300, Math.round(alvo.getBoundingClientRect().width) || 960);
  const eixoX = (s, grupos, esq, slot, base, ALT) => {
    const cadaX = Math.max(1, Math.ceil(grupos.length / Math.max(1, Math.floor(slot * grupos.length / 44))));
    grupos.forEach((g, i) => {
      if (i % cadaX === 0) {
        s.push('<text class="eixo" x="' + (esq + i * slot + slot / 2).toFixed(1) + '" y="' + (ALT - 6) + '" text-anchor="middle">' + esc(g.rot) + '</text>');
      }
    });
    s.push('<line class="linha-grade forte" x1="' + esq + '" x2="' + (esq + slot * grupos.length).toFixed(1) + '" y1="' + base + '" y2="' + base + '"/>');
  };

  /* barras empilhadas (a: já em evento, b: novos) + linha de percentual
     com o eixo próprio à direita */
  function combo(alvo, grupos) {
    const W = largura(alvo);
    const n = grupos.length;
    if (!n) { alvo.innerHTML = '<p class="dim">Nenhum dia no período.</p>'; return; }
    const esq = 44;
    const dir = 44;
    const topo = 12;
    const base = ALT_G - 24;
    const slot = (W - esq - dir) / n;
    const barra = Math.max(3, Math.min(28, slot * 0.62));
    const topoV = Math.max(1, Math.max.apply(null, grupos.map((g) => g.a + g.b)));
    const passo = passoRedondo(topoV);
    const topoN = Math.ceil(topoV / passo) * passo;
    /* eixo do percentual em passo redondo (1, 2, 5, 10, 20 ou 25%), de 2 a
       5 marcas: 19%, 38%, 56% não se leem */
    const maxP = Math.max(0.005, Math.max.apply(null, grupos.map((g) => Math.max(g.p === null ? 0 : g.p,
      g.m === null || g.m === undefined ? 0 : g.m))) * 1.08);
    const passoP = [0.01, 0.02, 0.05, 0.1, 0.2, 0.25].find((p) => Math.ceil(maxP / p) <= 5) || 0.25;
    const marcasP = Math.max(2, Math.ceil(maxP / passoP));
    const topoP = Math.min(1, passoP * marcasP);
    const hN = (v) => (base - topo) * v / topoN;
    const yP = (p) => base - (base - topo) * p / topoP;
    const s = ['<svg class="graf" viewBox="0 0 ' + W + ' ' + ALT_G + '" width="' + W + '" height="' + ALT_G + '" role="img" aria-label="' + esc(alvo.getAttribute('data-rot')) + '">'];
    for (let v = passo; v <= topoN; v += passo) {
      const y = base - hN(v);
      s.push('<line class="linha-grade" x1="' + esq + '" x2="' + (W - dir) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '"/>' +
        '<text class="eixo" x="' + (esq - 6) + '" y="' + (y + 3.5).toFixed(1) + '" text-anchor="end">' + nf(v) + '</text>');
    }
    for (let p = passoP; p <= topoP + 1e-9; p += passoP) {
      s.push('<text class="eixo eixo-p" x="' + (W - dir + 6) + '" y="' + (yP(p) + 3.5).toFixed(1) + '">' + pc0(p) + '</text>');
    }
    s.push('<text class="eixo" x="' + (esq - 6) + '" y="' + (base + 3.5) + '" text-anchor="end">0</text>');
    eixoX(s, grupos, esq, slot, base, ALT_G);
    const pontos = [];
    grupos.forEach((g, i) => {
      const x0 = esq + i * slot;
      const x = x0 + (slot - barra) / 2;
      const ha = hN(g.a);
      const hb = hN(g.b);
      const r = Math.min(3, barra / 2);
      if (ha > 0) s.push('<rect class="serie-b" x="' + x.toFixed(1) + '" y="' + (base - ha).toFixed(1) + '" width="' + barra.toFixed(1) + '" height="' + ha.toFixed(1) + '"' + (hb > 0 ? '' : ' rx="' + r + '"') + '/>');
      if (hb > 0) s.push('<rect class="serie-a" x="' + x.toFixed(1) + '" y="' + (base - ha - hb).toFixed(1) + '" width="' + barra.toFixed(1) + '" height="' + hb.toFixed(1) + '" rx="' + r + '"/>');
      if (g.p !== null) pontos.push([x0 + slot / 2, yP(g.p)]);
      else pontos.push(null);
    });
    let d = '';
    pontos.forEach((p, i) => {
      if (!p) return;
      d += (i && pontos[i - 1] ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1);
    });
    /* a meta (06/11): tracejada, atrás da linha do indicador; um degrau por
       ponto, porque a meta muda com o perfil dos veículos do dia */
    const temM = (g) => g && g.m !== null && g.m !== undefined;
    let dm = '';
    grupos.forEach((g, i) => {
      if (!temM(g)) return;
      const x = esq + i * slot + slot / 2;
      const y = yP(g.m).toFixed(1);
      dm += (temM(grupos[i - 1]) ? 'L' + x.toFixed(1) : 'M' + (x - slot * 0.35).toFixed(1)) + ' ' + y;
      if (!temM(grupos[i + 1])) dm += 'L' + (x + slot * 0.35).toFixed(1) + ' ' + y;
    });
    if (dm) s.push('<path class="linha-meta" d="' + dm + '"/>');
    if (d) s.push('<path class="linha-kpi" d="' + d + '"/>');
    pontos.forEach((p) => { if (p) s.push('<circle class="ponto-kpi" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3"/>'); });
    grupos.forEach((g, i) => {
      s.push('<rect class="alvo" x="' + (esq + i * slot).toFixed(1) + '" y="' + topo + '" width="' + slot.toFixed(1) + '" height="' + (base - topo + 22) +
        '" tabindex="0" data-dica="' + esc(g.dica) + '"/>');
    });
    alvo.innerHTML = s.join('') + '</svg>';
  }

  /* várias linhas no mesmo eixo. Com rótulo em cada ponto (Thomas, 03/11):
     uma pílula com o fundo na cor da linha e o número por cima. Rótulo e eixo
     dizem a mesma coisa (regra 3): com rótulo, sai o eixo Y e a grade. A
     decisão é por medida — se o maior rótulo não cabe no espaço de um dia
     (o telefone), volta o eixo e o valor fica no balão. Os rótulos do mesmo
     dia que encostariam são afastados na vertical */
  function linhas(alvo, grupos, series) {
    const W = largura(alvo);
    const n = grupos.length;
    if (!n) { alvo.innerHTML = '<p class="dim">Nenhum dia no período.</p>'; return; }
    const ALT_R = 15;
    const largRot = (v) => String(nf(v)).length * 6.4 + 10;
    const maiorRot = Math.max.apply(null, grupos.map((g) => Math.max.apply(null, series.map((se) => largRot(g[se.k])))));
    const comRotulo = (W - 16) / n >= maiorRot + 2;
    const esq = comRotulo ? 8 : 44;
    const dir = comRotulo ? 8 : 12;
    const topo = comRotulo ? ALT_R + 8 : 12;
    const base = ALT_G - 24;
    const slot = (W - esq - dir) / n;
    const topoV = Math.max(1, Math.max.apply(null, grupos.map((g) => Math.max.apply(null, series.map((se) => g[se.k])))));
    const passo = passoRedondo(topoV);
    const topoN = comRotulo ? topoV : Math.ceil(topoV / passo) * passo;
    const y = (v) => base - (base - topo) * v / topoN;
    const s = ['<svg class="graf" viewBox="0 0 ' + W + ' ' + ALT_G + '" width="' + W + '" height="' + ALT_G + '" role="img" aria-label="' + esc(alvo.getAttribute('data-rot')) + '">'];
    if (!comRotulo) {
      for (let v = passo; v <= topoN; v += passo) {
        s.push('<line class="linha-grade" x1="' + esq + '" x2="' + (W - dir) + '" y1="' + y(v).toFixed(1) + '" y2="' + y(v).toFixed(1) + '"/>' +
          '<text class="eixo" x="' + (esq - 6) + '" y="' + (y(v) + 3.5).toFixed(1) + '" text-anchor="end">' + nf(v) + '</text>');
      }
      s.push('<text class="eixo" x="' + (esq - 6) + '" y="' + (base + 3.5) + '" text-anchor="end">0</text>');
    }
    eixoX(s, grupos, esq, slot, base, ALT_G);
    series.forEach((se) => {
      const pts = grupos.map((g, i) => [esq + i * slot + slot / 2, y(g[se.k])]);
      s.push('<path class="linha ' + se.cls + '" d="' + pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('') + '"/>');
      if (n <= 45) pts.forEach((p) => s.push('<circle class="ponto ' + se.cls + '" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="2.5"/>'));
    });
    if (comRotulo) {
      grupos.forEach((g, i) => {
        const x = esq + i * slot + slot / 2;
        /* o centro de cada pílula, acima do ponto; de cima para baixo, cada
           uma pelo menos uma altura abaixo da anterior */
        const rs = series.map((se) => ({ se: se, v: g[se.k], c: y(g[se.k]) - ALT_R / 2 - 4 }))
          .sort((p, q) => p.c - q.c);
        rs.forEach((r, j) => {
          r.c = Math.max(r.c, ALT_R / 2 + 1);
          if (j && r.c - rs[j - 1].c < ALT_R + 1) r.c = rs[j - 1].c + ALT_R + 1;
        });
        const sobra = rs.length ? rs[rs.length - 1].c + ALT_R / 2 - base : 0;
        if (sobra > 0) rs.forEach((r) => { r.c -= sobra; });
        rs.forEach((r) => {
          const w = largRot(r.v);
          s.push('<g class="rot-p ' + r.se.cls + '"><rect x="' + (x - w / 2).toFixed(1) + '" y="' + (r.c - ALT_R / 2).toFixed(1) + '" width="' + w.toFixed(1) +
            '" height="' + ALT_R + '" rx="4"/><text x="' + x.toFixed(1) + '" y="' + (r.c + 3.6).toFixed(1) + '" text-anchor="middle">' + nf(r.v) + '</text></g>');
        });
      });
    }
    grupos.forEach((g, i) => {
      const txt = '<b>' + esc(g.longo) + '</b>' + series.map((se) => '<br><span class="amostra ' + se.cls + '"></span>' +
        esc(se.nome) + ': ' + nf(g[se.k])).join('');
      s.push('<rect class="alvo" x="' + (esq + i * slot).toFixed(1) + '" y="0" width="' + slot.toFixed(1) + '" height="' + (base + 22) +
        '" tabindex="0" data-dica="' + esc(txt) + '"/>');
    });
    alvo.innerHTML = s.join('') + '</svg>';
  }

  /* ── a gaveta de filtros (regra 5c: mais de ~3 controles) ────────────── */
  function opcoes(id, lista, rotTodos, atual) {
    const el = $('#' + id);
    el.innerHTML = '<option value="">' + esc(rotTodos) + '</option>' + lista.map((o) =>
      '<option value="' + esc(o[0]) + '"' + (o[0] === atual ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('');
    el.value = lista.some((o) => o[0] === atual) ? atual : '';
    return el.value;
  }
  const estado = (e) => (D.agora < e.ini ? 'agendado' : D.agora <= e.fim ? 'em andamento' : 'encerrado');
  function montaFiltros() {
    F.wl = opcoes('f-wl', D.canais.map((c) => [String(c[0]), c[1] + ' (' + c[0] + ')']), 'Todos os canais', F.wl);
    F.comit = opcoes('f-comit', D.comitentes.map((c, i) => [String(i), c]), 'Todos os comitentes', F.comit);
    F.cat = opcoes('f-cat', CATEGORIAS, 'Todas as categorias', F.cat);
    /* o evento acompanha canal, comitente e categoria: só os que passam nos três */
    const evs = [];
    D.eventos.forEach((e, i) => {
      if (F.wl && e.wls.indexOf(Number(F.wl)) < 0) return;
      if (F.comit !== '' && e.comits.indexOf(Number(F.comit)) < 0) return;
      if (F.cat !== '' && !EV_CATS[i][F.cat]) return;
      evs.push([String(i), e.nome + ' · ' + estado(e)]);
    });
    F.ev = opcoes('f-ev', evs, 'Todos os eventos (' + nf(evs.length) + ')', F.ev);
    F.resp = opcoes('f-resp', D.consultores.map((c, i) => [String(i), c]).concat([['nd', 'Não distribuído']]), 'Todos os responsáveis', F.resp);
    /* sem carteira, sem o filtro (o aviso do topo diz por quê) */
    $('#f-resp').closest('.fg').hidden = !D.consultores.length;
    const dias = [];
    for (let d = 0; d <= D.hoje; d++) dias.push([String(d), rotDiaLongo(d)]);
    F.de = opcoes('f-de', dias, 'Desde ' + rotDia(0), F.de);
    F.ate = opcoes('f-ate', dias.slice().reverse(), 'Até hoje (' + rotDia(D.hoje) + ')', F.ate);
  }
  function contaFiltros() {
    /* conta os filtros da aba à vista: cada aba tem os seus */
    const n = aba === 'mes' ? FILTROS_M.filter((k) => FM[k] !== '').length : FILTROS.filter((k) => F[k] !== '').length;
    const b = $('#aba-n');
    b.textContent = n ? String(n) : '';
    b.hidden = !n;
  }
  function gaveta(abre) {
    $('#gaveta').className = abre ? 'gaveta aberta' : 'gaveta';
    $('#veu').hidden = !abre;
    $('#aba').setAttribute('aria-expanded', abre ? 'true' : 'false');
  }
  $('#aba').addEventListener('click', () => gaveta($('#gaveta').className.indexOf('aberta') < 0));
  $('#fecha').addEventListener('click', () => gaveta(false));
  $('#veu').addEventListener('click', () => gaveta(false));
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') gaveta(false); });
  [['f-wl', 'wl'], ['f-comit', 'comit'], ['f-cat', 'cat'], ['f-ev', 'ev'], ['f-resp', 'resp'], ['f-de', 'de'], ['f-ate', 'ate']].forEach((p) => {
    $('#' + p[0]).addEventListener('change', (ev) => {
      F[p[1]] = ev.target.value;
      if (p[1] === 'wl' || p[1] === 'comit' || p[1] === 'cat') montaFiltros();
      if (TABELAS.veic) TABELAS.veic.lim = PASSO;
      render();
    });
  });
  $('#limpar').addEventListener('click', () => {
    if (aba === 'mes') {
      FILTROS_M.forEach((k) => { FM[k] = ''; });
      montaFiltrosMes();
      renderMes();
      return;
    }
    FILTROS.forEach((k) => { F[k] = ''; });
    montaFiltros();
    if (TABELAS.veic) TABELAS.veic.lim = PASSO;
    render();
  });
  [['f-m-wl', 'wl'], ['f-m-comit', 'comit'], ['f-m-cat', 'cat'], ['f-m-mes', 'mes'], ['f-m-ev', 'ev']].concat(DATAS_M).forEach((p) => {
    $('#' + p[0]).addEventListener('change', (ev) => {
      FM[p[1]] = ev.target.value;
      /* a lista de eventos acompanha os outros filtros */
      if (p[1] !== 'ev') montaFiltrosMes();
      renderMes();
    });
  });
  $('#seg-sit').addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-v]');
    if (!b) return;
    FM.sit = b.getAttribute('data-v');
    montaFiltrosMes();
    renderMes();
  });
  [['seg-vis-at', 'at'], ['seg-vis-lj', 'lj']].forEach((p) => {
    $('#' + p[0]).addEventListener('click', (ev) => {
      const b = ev.target.closest('button[data-v]');
      if (!b) return;
      VIS_M[p[1]] = b.getAttribute('data-v');
      alterna(p[0], VIS_M[p[1]]);
      renderMes();
    });
  });

  /* botões de alternância */
  function alterna(id, valor) {
    document.querySelectorAll('#' + id + ' button').forEach((b) =>
      b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === valor)));
  }
  $('#seg-kpi').addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-v]');
    if (!b) return;
    kpi = b.getAttribute('data-v');
    alterna('seg-kpi', kpi);
    /* o indicador do topo vale também para a rosca e para a lista, e para
       a aba Mensal */
    redesenhaIndicador();
  });
  $('#seg-modo').addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-v]');
    if (!b) return;
    modo = b.getAttribute('data-v');
    alterna('seg-modo', modo);
    /* Todos/Novos no topo (03/11): vale também para a rosca e a lista */
    redesenhaIndicador();
  });
  let esperaBusca = null;
  let buscaM = '';
  /* a busca das duas tabelas de veículos: a do Diário e a do Mensal (24/11) */
  [['busca', 'veic'], ['busca-m', 'veic-m']].forEach((p) => $('#' + p[0]).addEventListener('input', (ev) => {
    clearTimeout(esperaBusca);
    esperaBusca = setTimeout(() => {
      const q = ev.target.value.trim().toLowerCase();
      if (TABELAS[p[1]]) TABELAS[p[1]].lim = PASSO;
      if (p[1] === 'veic') { busca = q; desenhaVeiculos(); } else { buscaM = q; desenhaVeicMes(); }
    }, 160);
  }));

  let R = null;
  function desenhaAtivos() {
    const novos = modo === 'novos';
    const grupos = R.dias.map((g) => {
      const base = novos ? g.novos : g.ativos;
      const hit = novos ? g[kpi + '_n'] : g[kpi];
      const linhaDia = (k2, nome) => {
        const h = novos ? g[k2 + '_n'] : g[k2];
        return '<br>' + esc(nome) + ': ' + nf(h) + ' (' + (base ? pc(h / base) : '—') + ')';
      };
      const m = metaDe(g);
      return {
        rot: rotDia(g.d),
        a: novos ? 0 : g.ativos - g.novos,
        b: g.novos,
        p: base ? hit / base : null,
        m: m,
        dica: '<b>' + esc(rotDiaLongo(g.d)) + '</b><br>' +
          (novos ? '' : '<span class="amostra serie-b"></span>Veículos ativos: ' + nf(g.ativos) + '<br>') +
          '<span class="amostra serie-a"></span>Novos: ' + nf(g.novos) +
          linhaDia('acesso', 'Com acesso') + linhaDia('oferta', 'Com oferta') + linhaDia('venda', 'Vendidos') +
          (m === null ? '' : '<br><span class="amostra traco linha-meta"></span>Meta do ' + esc(KPI[kpi].linha) + ': ' + pc(m) +
            (notaCobertura(g) ? '<br><span class="dim">' + esc(notaCobertura(g)) + '</span>' : ''))
      };
    });
    $('#leg-meta').hidden = !grupos.some((g) => g.m !== null);
    $('#leg-a').hidden = novos;
    $('#leg-linha').textContent = KPI[kpi].linha + (novos ? ' dos novos' : '');
    combo($('#g-ativos'), grupos);
  }
  /* os cartões por comitente (Thomas, 03/11): um por comitente com evento
     ativo no dia, três por linha, e cada um é o FILTRO de comitente — clique
     filtra, clique de novo solta. A rosca é o indicador escolhido no topo
     (com acesso, com oferta, vendidos) no dia, com a diferença em p.p. para
     o dia anterior; os status ficam à direita dela. A lista ignora o próprio
     filtro de comitente (calcula): o escolhido fica marcado, os outros
     apagados */
  const STATUS_C = [['veiculos', 'Veículos'], ['com_oferta', 'Com oferta'],
    ['vmv', 'VMV atingido'], ['vendidos', 'Vendidos'], ['removidos', 'Removidos']];
  /* no Mensal, os status do sistema (Thomas, 17/11). Com oferta e Removidos
     saíram em 25/11 (Thomas): o removido não conta no Mensal, e a quantidade
     com oferta já está na rosca ("44 de 1.800") */
  const STATUS_C_MES = [['veiculos', 'Veículos'], ['st_ativo', 'Ativos'],
    ['analise', 'Em análise'], ['vendidos', 'Vendidos'], ['nao_vendidos', 'Não vendidos']];
  /* o indicador do topo, e Todos/Novos: com Novos, a base são os veículos
     que estrearam no dia e o acerto é só deles (a mesma regra do gráfico) */
  const baseDe = (g) => (g ? (modo === 'novos' ? g.novos : g.ativos) : 0);
  const acertoDe = (g) => (g ? (modo === 'novos' ? g[kpi + '_n'] : g[kpi]) : 0);
  const pctDe = (g) => (baseDe(g) ? acertoDe(g) / baseDe(g) : null);
  /* a meta do indicador num grupo — dia, mês ou comitente (06/11): a média
     das metas dos veículos dele. null no Com acesso (não tem meta) e quando
     nenhum veículo do grupo tem meta na planilha. "todos": ignora o Novos
     (os cartões do topo são sempre de todos os veículos) */
  const CAMPO_META = { oferta: 'mo', venda: 'mv' };
  const metaDe = (g, k, todos) => {
    const c = CAMPO_META[k || kpi];
    if (!g || !c) return null;
    const f = !todos && modo === 'novos' ? '_n' : '';
    return g['mt' + f] ? g[c + f] / g['mt' + f] : null;
  };
  /* quando a planilha não cobre todos os veículos do grupo */
  const notaCobertura = (g, todos) => {
    const f = !todos && modo === 'novos' ? '_n' : '';
    const base = f ? g.novos : g.ativos;
    return g['mt' + f] < base ? 'meta de ' + nf(g['mt' + f]) + ' dos ' + nf(base) + ' veículos — os outros não têm meta na planilha' : '';
  };
  const contraMeta = (x, m) => {
    if (x === null || m === null) return '';
    const d = Math.round(1000 * (x - m)) / 10;
    const cls = d > 0 ? 'sobe' : d < 0 ? 'desce' : 'dim';
    return '<span class="' + cls + '">' + (d > 0 ? '▲ +' : d < 0 ? '▼ ' : '') + d.toFixed(1).replace('.', ',') + ' p.p.</span>';
  };
  const rotIndicador = () => KPI[kpi].linha + (modo === 'novos' ? ' dos novos' : '');
  const quandoRef = () => (R.ate === D.hoje ? 'hoje' : 'em ' + rotDia(R.ate));
  const contraAnt = () => (R.ate === D.hoje ? 'ontem' : rotDia(R.ate - 1));
  /* a diferença em pontos percentuais para o dia anterior: ▲ verde, ▼
     vermelho; sem veículo ativo num dos dois dias, "—" */
  /* "curto": sem o "vs ontem" — no cartão, número e diferença dividem uma
     linha só na metade do cartão (03/11), e a nota acima dos cartões já diz
     contra que dia é a diferença */
  /* a diferença em p.p., com uma casa; null sem base num dos dois dias.
     Uma conta só para o texto e para a luz do cartão */
  const difPP = (c) => {
    const a = pctDe(c.dia);
    const b = pctDe(c.dia_ant);
    return a === null || b === null ? null : Math.round(1000 * (a - b)) / 10;
  };
  /* a diferença para ontem fica com a seta e SEM cor (06/11): a cor do
     cartão e da linha é a da meta */
  const delta = (c, curto) => {
    const vs = curto ? '' : '<span class="dim"> vs ' + contraAnt() + '</span>';
    const d = difPP(c);
    if (d === null) return '<span class="dim">—</span>' + vs;
    const t = (d > 0 ? '+' : '') + d.toFixed(1).replace('.', ',') + ' p.p.';
    return '<span class="pp">' + (d > 0 ? '▲ ' : d < 0 ? '▼ ' : '') + t + '</span>' + vs;
  };
  /* a luz (Thomas, 06/11: "as cores olham para a meta"): verde no indicador
     igual ou acima da meta, vermelha abaixo; sem meta (Com acesso, ou grupo
     fora da planilha), a cor normal */
  const luzMeta = (g) => {
    const x = pctDe(g);
    const m = metaDe(g);
    return x === null || m === null ? '' : x >= m ? ' luz-sobe' : ' luz-desce';
  };
  /* a rosca: anel de fundo, arco do acento pelo percentual, o % no centro */
  /* a semana em ÁREA (Thomas, 03/11): o % do indicador do topo (com
     Todos/Novos) nos últimos 7 dias, uma linha com o preenchimento
     transparente embaixo e o ponto de hoje marcado. Escala pelo maior da
     semana (piso de 5%), sem eixo: o valor de cada dia está no balão. Dia
     sem veículo ativo (ou antes da janela) interrompe a linha */
  /* "rotLongo" dá o nome do ponto no balão: o dia (padrão) ou o mês, na
     aba Mensal, onde a mesma área leva os 12 meses */
  /* "meta": a linha de referência (Thomas, 06/11: "a linha de referência
     deve ser = meta") — reta, na MESMA meta do título do cartão e do traço
     da rosca */
  const areaSemana = (hist, rotLongo, meta) => {
    rotLongo = rotLongo || ((g) => rotDiaLongo(g.d));
    const W = 98;
    const H = 80;
    const topo = 6;
    const base = H - 3;
    const n = hist.length;
    const passo = (W - 8) / (n - 1);
    const vals = hist.map((g) => (g ? pctDe(g) : null));
    const temMeta = meta !== null && meta !== undefined;
    const max = Math.max(0.05, Math.max.apply(null, vals.concat([temMeta ? meta : 0]).map((v) => (v === null ? 0 : v))) * 1.05);
    const xDe = (i) => 4 + i * passo;
    const yDe = (v) => base - (base - topo) * v / max;
    let s = '<svg class="semana" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">' +
      '<line class="s-base" x1="0" x2="' + W + '" y1="' + base + '" y2="' + base + '"/>';
    /* trechos contínuos: cada um vira uma área e uma linha */
    const trechos = [];
    let atual = [];
    vals.forEach((v, i) => {
      if (v === null) { if (atual.length) trechos.push(atual); atual = []; return; }
      atual.push([xDe(i), yDe(v)]);
    });
    if (atual.length) trechos.push(atual);
    if (temMeta) s += '<line class="s-meta" x1="0" x2="' + W + '" y1="' + yDe(meta).toFixed(1) + '" y2="' + yDe(meta).toFixed(1) + '"/>';
    trechos.forEach((t) => {
      const linha = t.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('');
      if (t.length > 1) {
        s += '<path class="s-area" d="' + linha + 'L' + t[t.length - 1][0].toFixed(1) + ' ' + base + 'L' + t[0][0].toFixed(1) + ' ' + base + 'Z"/>' +
          '<path class="s-linha" d="' + linha + '"/>';
      }
    });
    const ult = vals[n - 1];
    if (ult !== null) s += '<circle class="s-hoje" cx="' + xDe(n - 1).toFixed(1) + '" cy="' + yDe(ult).toFixed(1) + '" r="3"/>';
    hist.forEach((g, i) => {
      const v = vals[i];
      const dica = g ? '<b>' + esc(rotLongo(g)) + '</b><br>' + esc(rotIndicador()) + ': ' + (v === null ? '—' : pc(v)) +
        '<br>' + nf(acertoDe(g)) + ' de ' + nf(baseDe(g)) + (modo === 'novos' ? ' novos' : ' veículos') +
        (temMeta ? '<br>Meta: ' + pc(meta) : '') : 'antes da janela';
      s += '<rect class="s-alvo" x="' + (xDe(i) - passo / 2).toFixed(1) + '" y="0" width="' + passo.toFixed(1) + '" height="' + H + '" data-dica="' + esc(dica) + '"/>';
    });
    return s + '</svg>';
  };
  const rosca = (x, m) => {
    /* anel mais fino (Thomas, 03/11): 6 no lugar de 10, e o raio sobe de 34
       para 36 para a borda de fora continuar no mesmo lugar */
    const raio = 36;
    const volta = 2 * Math.PI * raio;
    const arco = x === null ? 0 : Math.max(0, Math.min(1, x)) * volta;
    return '<svg class="rosca" viewBox="0 0 88 88" aria-hidden="true">' +
      '<circle class="r-fundo" cx="44" cy="44" r="' + raio + '"/>' +
      (arco > 0 ? '<circle class="r-arco" cx="44" cy="44" r="' + raio + '" stroke-dasharray="' + arco.toFixed(2) + ' ' +
        volta.toFixed(2) + '" transform="rotate(-90 44 44)"/>' : '') +
      /* a meta (06/11): um traço atravessando o anel, no ângulo dela */
      (m === null || m === undefined ? '' : (() => {
        const a = 2 * Math.PI * Math.max(0, Math.min(1, m));
        const px = (r) => (44 + r * Math.sin(a)).toFixed(1);
        const py = (r) => (44 - r * Math.cos(a)).toFixed(1);
        return '<line class="r-meta" x1="' + px(raio - 6) + '" y1="' + py(raio - 6) + '" x2="' + px(raio + 6) + '" y2="' + py(raio + 6) + '"/>';
      })()) +
      '<text class="r-pc" x="44" y="49" text-anchor="middle">' + (x === null ? '—' : pc(x)) + '</text></svg>';
  };
  function desenhaComitentes() {
    const lista = R.por_comit;
    $('#comit-rot').textContent = 'Comitentes com evento ativo ' + quandoRef() + ' · clique para filtrar';
    $('#comit-nota').textContent = rotIndicador() + ': ' + quandoRef() + ' na rosca, os últimos 7 dias na linha (meta tracejada), a diferença para ' +
      contraAnt() + ' · verde na meta ou acima, vermelho abaixo';
    const sel = F.comit === '' ? null : Number(F.comit);
    $('#g-comit').innerHTML = lista.length ? lista.map((c) => cartaoComit(c, D.comitentes[c.comit], sel, 'data-c', null))
      .join('') : '<p class="dim">Nenhum comitente com evento ativo neste dia.</p>';
  }
  /* o cartão de um comitente, nas duas abas: "attr" é o atributo que o
     clique lê (data-c no dia, data-cm no mês), "rotLongo" o nome de cada
     ponto da área (dia ou mês) */
  /* "me": a meta do evento do comitente (24/11), com Ativos no Mensal — o
     título, o traço da rosca, a reta da área e a luz passam a ser dela */
  function cartaoComit(c, nome, sel, attr, rotLongo, stc, me) {
      const ST = stc || STATUS_C;
      const marcado = sel === c.comit;
      const x = pctDe(c.dia);
      const ev = me !== undefined;
      const m = ev ? me : metaDe(c.dia);
      const luz = !ev ? luzMeta(c.dia) : x === null || m === null ? '' : x >= m ? ' luz-sobe' : ' luz-desce';
      return '<button type="button" class="cartao comit' + luz + (sel !== null && !marcado ? ' apagado' : '') + '" ' + attr + '="' + c.comit + '"' +
        ' aria-pressed="' + marcado + '" aria-label="' + esc((marcado ? 'Tirar o filtro do comitente ' : 'Filtrar pelo comitente ') + nome) + '">' +
        '<span class="comit-topo"><span class="comit-nome">' + esc(nome) + '</span>' +
        '<span class="tag">' + nf(c.eventos) + (c.eventos === 1 ? ' evento' : ' eventos') + '</span></span>' +
        /* metade esquerda: os dois gráficos lado a lado e, centralizados
           embaixo, o "x de y" e a diferença para o dia anterior; metade
           direita: a tabela de status (Thomas, 03/11) */
        /* o indicador centralizado acima dos dois gráficos, sem os rótulos
           "hoje" e "7 dias" embaixo deles (Thomas, 03/11) */
        '<span class="comit-meio"><span class="comit-graf"><span class="comit-ind">' + esc(rotIndicador()) +
          (m === null ? '' : (ev ? ' · meta do evento ' : ' · meta ') + pc(m)) + '</span><span class="comit-minis">' +
          '<span class="mini m-rosca">' + rosca(x, m) + '</span>' +
          '<span class="mini m-sem">' + areaSemana(c.hist, rotLongo, m) + '</span></span>' +
          '<span class="comit-num"><b class="num">' + nf(acertoDe(c.dia)) + ' de ' + nf(baseDe(c.dia)) +
            (modo === 'novos' ? ' novos' : '') + '</b><span class="sep">·</span><span>' + delta(c, true) + '</span></span></span>' +
        '<span class="comit-st">' + ST.map((s) => '<span' + (s[0] === 'veiculos' ? ' class="tot"' : '') + '>' + s[1] +
          '<b class="num">' + nf(c[s[0]]) + '</b></span>').join('') + '</span></span>' +
        (c.valor ? '<span class="comit-rodape">Vendido <b class="num">' + rs(c.valor) + '</b></span>' : '') +
        '</button>';
  }
  $('#g-comit').addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-c]');
    if (!b) return;
    const c = b.getAttribute('data-c');
    F.comit = F.comit === c ? '' : c;
    montaFiltros();
    if (TABELAS.veic) TABELAS.veic.lim = PASSO;
    render();
  });

  /* a lista por evento (Thomas, 03/11), abaixo dos cartões: uma linha por
     evento ativo no dia, com os status e o termômetro do indicador do topo.
     Clicar filtra pelo evento; segue o filtro de comitente, então o cartão
     escolhido estreita a lista aos eventos dele */
  function desenhaEventos() {
    const lista = R.por_evento;
    $('#ev-rot').textContent = 'Eventos ativos ' + quandoRef();
    $('#n-evlista').textContent = nf(lista.length) + (lista.length === 1 ? ' evento' : ' eventos');
    $('#cab-ev').innerHTML = '<span>Evento</span>' + STATUS_C.map((s) => '<span class="n">' + s[1] + '</span>').join('') +
      '<span>' + esc(rotIndicador() + ' ' + quandoRef() + ' · vs ' + contraAnt()) + '</span>';
    const sel = F.ev === '' ? null : Number(F.ev);
    $('#g-ev').innerHTML = lista.length ? lista.map((c) => {
      const e = D.eventos[c.ev];
      const marcado = sel === c.ev;
      const x = pctDe(c.dia);
      const m = metaDe(c.dia);
      /* a mesma luz dos cartões, por linha: contra a meta (06/11) */
      const luz = luzMeta(c.dia);
      return '<button type="button" class="lin' + luz + (marcado ? ' marcada' : '') + (sel !== null && !marcado ? ' apagado' : '') + '" data-e="' + c.ev + '"' +
        ' aria-pressed="' + marcado + '" aria-label="' + esc((marcado ? 'Tirar o filtro do evento ' : 'Filtrar pelo evento ') + e.nome) + '">' +
        '<span class="c-nome"><b title="' + esc(e.nome) + '">' + esc(e.nome) + '</b><span class="dim sub">' +
          esc(e.comits.map((j) => D.comitentes[j]).join(', ')) + ' · até ' + dt(e.fim) + '</span></span>' +
        STATUS_C.map((s) => '<span class="n num" data-r="' + s[1] + '">' + nf(c[s[0]]) + '</span>').join('') +
        '<span class="termo">' + trilho(x, m) + '<span class="pc num">' + (x === null ? '—' : pc(x)) + '</span>' +
          /* sem o "vs ontem" em cada linha (03/11): está no cabeçalho */
          '<span class="de">' + delta(c, true) + '</span></span>' +
        '</button>';
    }).join('') : '<p class="dim">Nenhum evento ativo neste dia.</p>';
  }
  /* a lista é retrátil (Thomas, 03/11): nasce fechada, abre ao escolher um
     comitente (e fecha ao soltá-lo) ou no clique do cabeçalho. Quem abriu ou
     fechou com a mão manda até o comitente mudar de novo. "esperado" separa a
     mudança feita aqui (o evento toggle chega depois) da feita no clique */
  const dobra = $('#dobra-ev');
  let evMao = false;
  let ultComit = '';
  let esperado = null;
  dobra.addEventListener('toggle', () => {
    if (esperado !== null && dobra.open === esperado) { esperado = null; return; }
    esperado = null;
    evMao = dobra.open;
  });
  function dobraEventos() {
    if (F.comit === ultComit) return;
    ultComit = F.comit;
    const quer = F.comit !== '' || evMao;
    if (dobra.open !== quer) { esperado = quer; dobra.open = quer; }
  }
  $('#g-ev').addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-e]');
    if (!b) return;
    const e = b.getAttribute('data-e');
    F.ev = F.ev === e ? '' : e;
    montaFiltros();
    if (TABELAS.veic) TABELAS.veic.lim = PASSO;
    render();
  });

  const filtraBusca = (lst, q) => (q
    ? lst.filter((r) => (r.nome + ' ' + D.eventos[r.ev].nome + ' ' + (r.comit >= 0 ? D.comitentes[r.comit] : '')).toLowerCase().indexOf(q) >= 0)
    : lst);
  const nVeic = (n) => nf(n) + (n === 1 ? ' veículo' : ' veículos');
  function desenhaVeiculos() {
    const linhasV = filtraBusca(R.veiculos, busca);
    $('#n-veic').textContent = nVeic(linhasV.length);
    tabela('veic', colsVeic(), linhasV);
  }
  /* as colunas das duas tabelas de veículos (24/11: a do Mensal é a mesma) */
  const colsVeic = () => [
      { k: 'nome', t: 'Veículo', h: (r) => {
        const vv = D.veics[r.v];
        const lk = linkDe(r);
        /* sem selo de "novo": em 30 dias, 7 de cada 10 veículos estreiam no
           período e o selo vira ruído. A data da estreia fica embaixo */
        return '<span class="farol ' + r.farol + '" title="' + FAROL[r.farol] + '"></span>' +
          (lk ? '<a href="' + esc(lk) + '" target="_blank" rel="noopener">' + esc(r.nome) + ' ↗</a>' : esc(r.nome)) +
          '<span class="dim sub">' + [vv[3], vv[4] !== null ? nf(vv[4]) + ' km' : null, r.estreia >= 0 ? 'estreia ' + rotDia(r.estreia) : 'estreia antes de ' + rotDia(0)]
            .filter((x) => x !== null && x !== '').join(' · ') + '</span>';
      } },
      { k: 'evento', t: 'Evento', v: (r) => D.eventos[r.ev].nome, h: (r) => esc(D.eventos[r.ev].nome) +
        '<span class="dim sub">' + esc(r.comit >= 0 ? D.comitentes[r.comit] : '—') +
        (r.n_ev > 1 ? ' · ' + r.n_ev + ' eventos no período' : '') + '</span>' },
      { k: 'acessos', t: 'Acessos', n: true, h: (r) => nf(r.acessos) },
      { k: 'lances', t: 'Ofertas', n: true, h: (r) => nf(r.lances) + (r.ofertantes ? '<span class="dim sub">' + nf(r.ofertantes) + (r.ofertantes === 1 ? ' loja' : ' lojas') + '</span>' : '') },
      { k: 'maior', t: 'Maior oferta', n: true, h: (r) => rs(r.maior) },
      { k: 'fipe', t: 'FIPE', n: true, h: (r) => rs(r.fipe) },
      { k: 'pfipe', t: '% FIPE', n: true, cls: 'c-vmv', h: (r) => (r.pfipe === null ? '<span class="dim">—</span>'
        : '<span class="vmv">' + trilho(r.pfipe) + '<span class="num">' + pc0(r.pfipe) + '</span></span>') },
      { k: 'vmv', t: 'VMV', n: true, h: (r) => rs(r.vmv) },
      { k: 'pvmv', t: '% VMV', n: true, cls: 'c-vmv', h: (r) => (r.pvmv === null ? '<span class="dim">—</span>'
        : '<span class="vmv' + (r.pvmv >= 1 ? ' ok' : '') + '">' + trilho(r.pvmv) + '<span class="num">' + pc0(r.pvmv) + '</span></span>') },
      { k: 'status', t: 'Resultado', v: (r) => D.status_nome[r.status] || '', h: (r) => tagStatus(r.status) +
        (r.comprador !== null ? '<span class="dim sub">' + esc(compradorDe(r)) +
          ' · ' + rs(r.venda) + '</span>' : '') }
  ];
  const compradorDe = (r) => (r.comprador === null ? '' : r.comprador >= 0 ? D.lojas[r.comprador][0] : 'comprador sem loja');

  /* ── a tabela de veículos do Mensal (Thomas, 24/11), a do Diário com os
     filtros do Mensal (calculaVeicMes), e o Exportar: as linhas do recorte
     inteiro — com a busca, na ordem da tabela, não só as já desenhadas —
     num CSV para o Excel (separador ";", vírgula decimal, BOM do UTF-8) */
  let RVM = null;
  function desenhaVeicMes() {
    const l = filtraBusca(RVM.linhas, buscaM);
    $('#tit-veic-m').textContent = 'Veículos em ' + rotMesLongo(RM.ref);
    $('#n-veic-m').textContent = nVeic(l.length);
    const janela = 'o veículo um a um vem do dado dos últimos ' + (D.hoje + 1) + ' dias, desde ' + rotDia(0) + '/' + D.piso_dia.slice(0, 4);
    const nota = RVM.de > RVM.ate ? 'Sem a tabela neste mês: ' + janela + '.' : RVM.parcial ? 'Só de ' + rotDia(RVM.de) + ' em diante: ' + janela + '.' : '';
    $('#nota-veic-m').textContent = nota;
    $('#nota-veic-m').hidden = !nota;
    tabela('veic-m', colsVeic(), l);
  }
  $('#exporta-m').addEventListener('click', () => {
    const t = TABELAS['veic-m'];
    if (!t) return;
    const num = (x) => (x === null || x === undefined ? '' : String(Math.round(x)));
    const dia = (d) => { const x = dataDia(d).toISOString(); return x.slice(8, 10) + '/' + x.slice(5, 7) + '/' + x.slice(0, 4); };
    const cel = (x) => {
      const s = x === null || x === undefined ? '' : String(x);
      return s.indexOf('"') >= 0 || s.indexOf(';') >= 0 || s.indexOf(String.fromCharCode(10)) >= 0 ? '"' + s.split('"').join('""') + '"' : s;
    };
    const cab = ['Veículo', 'Ano', 'Km', 'Estreia', 'Evento', 'Fim do evento', 'Comitente', 'Eventos no mês', 'Acessos', 'Ofertas', 'Lojas que ofertaram',
      'Maior oferta', 'FIPE', '% FIPE', 'VMV', '% VMV', 'Farol', 'Resultado', 'Comprador', 'Valor da venda', 'Link do anúncio'];
    const linhasCsv = ordena('veic-m').map((p) => {
      const r = p[0];
      const vv = D.veics[r.v];
      const e = D.eventos[r.ev];
      return [r.nome, vv[3], num(vv[4]), r.estreia >= 0 ? dia(r.estreia) : 'antes de ' + dia(0), e.nome, dt(e.fim),
        r.comit >= 0 ? D.comitentes[r.comit] : '', r.n_ev, r.acessos, r.lances, r.ofertantes, num(r.maior), num(r.fipe),
        r.pfipe === null ? '' : pc(r.pfipe), num(r.vmv), r.pvmv === null ? '' : pc(r.pvmv), FAROL[r.farol],
        D.status_nome[r.status] || '', compradorDe(r), num(r.venda), linkDe(r) || ''];
    });
    const txt = [cab].concat(linhasCsv).map((l) => l.map(cel).join(';')).join(String.fromCharCode(13, 10));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([String.fromCharCode(65279) + txt], { type: 'text/csv;charset=utf-8' }));
    a.download = 'veiculos-' + MESES_D[RM.ref] + '-' + { at: 'ativos', fin: 'finalizados', '': 'todos' }[FM.sit] + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  });

  /* a linha da meta no cartão e o traço dela no trilho */
  /* "me": a meta do evento (24/11), com Ativos no Mensal — o traço e a
     comparação passam a ser dela, e a do mês fica ao lado */
  function metaCartao(id, x, m, g, me) {
    const el = $('#' + id + '-meta');
    const ev = me !== undefined && me !== null;
    const alvo = ev ? me : m;
    el.hidden = alvo === null;
    el.innerHTML = alvo === null ? '' : (ev ? 'Meta do evento' : 'Meta') + ' <b class="num">' + pc(alvo) + '</b> · ' + contraMeta(x, alvo) +
      (ev && m !== null ? ' · <span class="dim">do mês ' + pc(m) + '</span>' : '');
    el.title = alvo === null ? '' : notaCobertura(g, true);
    $('#' + id + '-bar').innerHTML = trilho(x, alvo);
  }
  function render() {
    contaFiltros();
    R = calcula(D, F);
    const k = R.kpi;
    const pcBar = (idTxt, idBar, x, rot) => {
      $(idTxt).textContent = x === null ? '—' : pc(x) + ' ' + rot;
      $(idBar).innerHTML = trilho(x);
    };
    const hoje = R.ate === D.hoje;
    $('#k-ev-rot').textContent = hoje ? 'Eventos ativos hoje' : 'Eventos ativos em ' + rotDia(R.ate);
    $('#k-ev').textContent = nf(k.eventos);
    $('#k-ev-dia').textContent = rotDiaLongo(R.ate) + (hoje ? ' · até ' + D.agora.slice(11, 16) : '');
    $('#k-ev-veic').textContent = nf(k.veiculos);
    $('#k-ev-com').textContent = nf(k.comitentes);
    const sobre = (x) => (k.veiculos ? x / k.veiculos : null);
    /* os status em funil (06/11): cada id do cartão recebe o campo de mesmo nome */
    [['co', 'com_oferta', [['ab', 'co_abertos'], ['an', 'co_analise'], ['en', 'co_encerrados']]],
      ['vm', 'vmv', [['ab', 'vm_abertos'], ['an', 'vm_analise'], ['en', 'vm_encerrados']]],
      ['vd', 'vendidos', [['ag', 'aguardando'], ['vd', 'vendido']]],
      ['rm', 'removidos', [['can', 'rem_cancelado'], ['sus', 'rem_suspenso']]]].forEach((s) => {
      $('#k-' + s[0]).textContent = nf(k[s[1]]);
      pcBar('#k-' + s[0] + '-pc', '#k-' + s[0] + '-bar', sobre(k[s[1]]), 'dos veículos');
      s[2].forEach((p) => { $('#k-' + s[0] + '-' + p[0]).textContent = nf(k[p[1]]); });
    });
    $('#k-vd-rs').textContent = rs(k.valor);
    /* a meta nos cartões de Com oferta e Vendidos (06/11): a do dia de
       referência, de todos os veículos (o cartão não segue o Novos) */
    const gRef = R.dias[R.dias.length - 1];
    metaCartao('k-co', sobre(k.com_oferta), metaDe(gRef, 'oferta', true), gRef);
    metaCartao('k-vd', sobre(k.vendidos), metaDe(gRef, 'venda', true), gRef);

    desenhaComitentes();
    desenhaEventos();
    dobraEventos();

    $('#n-ativos').textContent = nf(R.veiculos_periodo) + ' veículos no período';
    desenhaAtivos();

    $('#n-lojistas').textContent = nf(R.tot_lojistas.acessaram) + ' lojas acessaram';
    linhas($('#g-lojistas'), R.lojistas.map((g) => Object.assign({ rot: rotDia(g.d), longo: rotDiaLongo(g.d) }, g)), [
      { k: 'acessaram', nome: 'Acessaram', cls: 's-ac' },
      { k: 'ofertaram', nome: 'Ofertaram', cls: 's-of' },
      { k: 'compraram', nome: 'Compraram', cls: 's-co' }
    ]);
    /* sem o Logaram (Thomas, 03/11): o gráfico e o total ficam nas três
       ações sobre os eventos — acessar, ofertar, comprar */
    $('#tot-lojistas').innerHTML = [['Acessaram', 'acessaram'], ['Ofertaram', 'ofertaram'], ['Compraram', 'compraram']]
      .map((p) => '<span>' + p[0] + ' no período <b class="num">' + nf(R.tot_lojistas[p[1]]) + '</b></span>').join('');
    desenhaVeiculos();
  }

  /* ══ a aba Mensal (Thomas, 06/11) ═════════════════════════════════════
     O espelho do diário em meses: os cartões do mês escolhido, os cartões
     por comitente (rosca do mês, área dos 12 meses, Δ contra o mês
     anterior), veículos ativos por mês e lojistas por mês. Sem lista de
     eventos e sem tabela de veículos: num mês são centenas de eventos e
     milhares de carros. Filtros: canal, comitente e mês */
  const NOME_MES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const ABREV_MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const MESES_D = D.mes.meses;
  const ULT_M = MESES_D.length - 1;
  const parcial = (m) => m === ULT_M ? ' (até ' + D.agora.slice(8, 10) + '/' + D.agora.slice(5, 7) + ')' : '';
  const rotMes = (m) => ABREV_MES[Number(MESES_D[m].slice(5, 7)) - 1] + '/' + MESES_D[m].slice(2, 4);
  const rotMesLongo = (m) => NOME_MES[Number(MESES_D[m].slice(5, 7)) - 1] + ' de ' + MESES_D[m].slice(0, 4) + parcial(m);
  let RM = null;
  /* mês em que o access_logs não cobre todos os dias: o acesso sai a menos */
  const acIncompleto = (m) => D.mes.dias_acesso[m][0] < D.mes.dias_acesso[m][1];
  /* no eixo, o mês com buraco leva o ⚠ — a queda dele não é queda */
  const rotMesEixo = (m) => rotMes(m) + (acIncompleto(m) ? ' ⚠' : '');
  const notaAc = (m) => (acIncompleto(m) ? 'acesso registrado em ' + D.mes.dias_acesso[m][0] + ' de ' + D.mes.dias_acesso[m][1] + ' dias' : '');
  function montaFiltrosMes() {
    FM.wl = opcoes('f-m-wl', D.canais.map((c) => [String(c[0]), c[1] + ' (' + c[0] + ')']), 'Todos os canais', FM.wl);
    FM.comit = opcoes('f-m-comit', D.mes.comitentes.map((c, i) => [String(i), c]), 'Todos os comitentes', FM.comit);
    FM.cat = opcoes('f-m-cat', CATEGORIAS, 'Todas as categorias', FM.cat);
    const ms = MESES_D.map((r, m) => [String(m), rotMesLongo(m)]).reverse();
    FM.mes = opcoes('f-m-mes', ms.slice(1), 'Mês corrente (' + rotMesLongo(ULT_M) + ')', FM.mes);
    /* o evento (19/11): os do mês escolhido que passam nos outros filtros */
    const ref = FM.mes === '' ? ULT_M : Number(FM.mes);
    const evs = [];
    D.mes.eventos.forEach((e, i) => {
      if (e[3] > ref || e[4] < ref || !evPassaFM(e)) return;
      if (FM.comit !== '' && e[6].indexOf(Number(FM.comit)) < 0) return;
      if (FM.cat !== '' && !EV_CATS_M[i][FM.cat]) return;
      evs.push([String(i), e[0] + ' · ' + (e[7] ? 'finalizado' : 'ativo')]);
    });
    FM.ev = opcoes('f-m-ev', evs, 'Todos os eventos (' + nf(evs.length) + ')', FM.ev);
    DATAS_M.forEach((q) => { $('#' + q[0]).value = FM[q[1]]; });
    alterna('seg-sit', FM.sit);
  }
  /* canal, situação e datas do evento — a mesma regra do calculaMes */
  const evPassaFM = (e) => evPassaF(e, FM);
  /* as datas vão do primeiro dos 12 meses a hoje */
  DATAS_M.forEach((q) => { $('#' + q[0]).min = MESES_D[0] + '-01'; $('#' + q[0]).max = D.agora.slice(0, 10); });
  /* o dia do mês de referência: "05/11" e "qua 05/11" */
  const dataDiaM = (k) => new Date(Date.UTC(Number(MESES_D[RM.ref].slice(0, 4)), Number(MESES_D[RM.ref].slice(5, 7)) - 1, k + 1));
  const rotDiaM = (k) => String(k + 1).padStart(2, '0') + '/' + MESES_D[RM.ref].slice(5, 7);
  const rotDiaMLongo = (k) => SEMANA[dataDiaM(k).getUTCDay()] + ' ' + rotDiaM(k);
  /* uma barra do gráfico de veículos ativos do Mensal: um mês ou um dia */
  function barraM(g, rot, longo, nota) {
    const novos = modo === 'novos';
    const base = novos ? g.novos : g.ativos;
    const hit = novos ? g[kpi + '_n'] : g[kpi];
    const linhaM = (k2, nome) => {
      const h = novos ? g[k2 + '_n'] : g[k2];
      return '<br>' + esc(nome) + ': ' + nf(h) + ' (' + (base ? pc(h / base) : '—') + ')';
    };
    const mt = metaDe(g);
    return {
      rot: rot,
      a: novos ? 0 : g.ativos - g.novos,
      b: g.novos,
      p: base ? hit / base : null,
      m: mt,
      dica: '<b>' + esc(longo) + '</b><br>' +
        (novos ? '' : '<span class="amostra serie-b"></span>Veículos ativos: ' + nf(g.ativos) + '<br>') +
        '<span class="amostra serie-a"></span>Novos: ' + nf(g.novos) +
        linhaM('acesso', 'Com acesso') + linhaM('oferta', 'Com oferta') + linhaM('venda', 'Vendidos') +
        (mt === null ? '' : '<br><span class="amostra traco linha-meta"></span>Meta do ' + esc(KPI[kpi].linha) + ': ' + pc(mt) +
          (notaCobertura(g) ? '<br><span class="dim">' + esc(notaCobertura(g)) + '</span>' : '')) +
        (nota ? '<br><span class="aviso-txt">⚠ ' + esc(nota) + ': com acesso a menos</span>' : '')
    };
  }
  function desenhaMes() {
    const novos = modo === 'novos';
    const porDia = VIS_M.at === 'dia';
    const grupos = porDia
      ? RM.dias.map((g) => barraM(g, rotDiaM(g.k), rotDiaMLongo(g.k), ''))
      : RM.meses.map((g) => barraM(g, rotMesEixo(g.m), rotMesLongo(g.m), acIncompleto(g.m) ? notaAc(g.m) : ''));
    $('#tit-at-m').textContent = porDia ? 'Veículos ativos por dia em ' + rotMes(RM.ref) : 'Veículos ativos por mês';
    $('#leg-a-m').firstChild.nextSibling.textContent = porDia ? 'Já em evento' : 'Já em evento antes';
    $('#leg-b-m').lastChild.textContent = porDia ? 'Novos no dia' : 'Novos no mês';
    $('#n-ativos-m').textContent = porDia ? nf(RM.dias.length) + ' dias' : '12 meses';
    $('#leg-meta-m').hidden = !grupos.some((g) => g.m !== null);
    $('#leg-a-m').hidden = novos;
    $('#leg-linha-m').textContent = KPI[kpi].linha + (novos ? ' dos novos' : '');
    combo($('#g-ativos-m'), grupos);
    desenhaEventosMes();
    const sel = FM.comit === '' ? null : Number(FM.comit);
    $('#comit-rot-m').textContent = 'Comitentes com evento em ' + rotMesLongo(RM.ref) + ' · clique para filtrar';
    /* com Ativos (24/11), a meta dos cartões é a do evento */
    const comEv = FM.sit === 'at';
    $('#comit-nota-m').textContent = rotIndicador() + ': o mês na rosca, os 12 meses até ele na linha (meta ' + (comEv ? 'do evento ' : '') + 'tracejada), e a diferença para ' +
      (RM.ref > 0 ? rotMesLongo(RM.ref - 1) : 'o mês anterior') + ' · verde na meta ou acima, vermelho abaixo';
    $('#g-comit-m').innerHTML = RM.por_comit.length
      ? RM.por_comit.map((c) => cartaoComit(c, D.mes.comitentes[c.comit], sel, 'data-cm', (g) => rotMesLongo(g.m), STATUS_C_MES,
        comEv ? (CAMPO_META[kpi] ? c.meta_ev[kpi] : null) : undefined)).join('')
      : '<p class="dim">Nenhum comitente com evento neste mês.</p>';
  }
  function renderMes() {
    contaFiltros();
    RM = calculaMes(D, FM);
    const k = RM.kpi;
    const a = RM.ant;
    const sobre = (x) => (k.veiculos ? x / k.veiculos : null);
    $('#km-ev-rot').textContent = 'Eventos em ' + rotMes(RM.ref);
    $('#km-ev').textContent = nf(k.eventos);
    $('#km-ev-mes').textContent = rotMesLongo(RM.ref);
    $('#km-ev-veic').textContent = nf(k.veiculos);
    $('#km-ev-com').textContent = nf(k.comitentes);
    [['at', 'st_ativo'], ['an', 'analise'], ['vd', 'vendidos'], ['nv', 'nao_vendidos']].forEach((s) => {
      $('#km-' + s[0]).textContent = nf(k[s[1]]);
      const x = sobre(k[s[1]]);
      $('#km-' + s[0] + '-pc').textContent = x === null ? '—' : pc(x) + ' dos veículos';
      $('#km-' + s[0] + '-bar').innerHTML = trilho(x);
      /* o mês anterior, com o percentual dele: a comparação que o mês pede */
      $('#km-' + s[0] + '-ant').textContent = a ? nf(a[s[1]]) + (a.veiculos ? ' · ' + pc(a[s[1]] / a.veiculos) : '') : '—';
    });
    /* o valor das vendas e o mês anterior (18/11): a variação em %, ▲ verde
       e ▼ vermelho; sem venda no mês anterior, não há base para o % */
    $('#km-vr').textContent = rs(k.valor);
    const dv = a ? k.valor - a.valor : null;
    const pv = a && a.valor ? dv / a.valor : null;
    $('#km-vr-pc').innerHTML = pv === null ? (a ? 'sem venda em ' + rotMes(RM.ref - 1) : '—')
      : '<span class="' + (pv > 0 ? 'sobe' : pv < 0 ? 'desce' : 'dim') + '">' + (pv > 0 ? '▲ +' : pv < 0 ? '▼ ' : '') +
        pc(pv) + '</span> sobre ' + rotMes(RM.ref - 1);
    $('#km-vr-dif').textContent = dv === null ? '—' : (dv > 0 ? '+' : dv < 0 ? '−' : '') + rs(Math.abs(dv));
    $('#km-vr-ant').textContent = a ? rs(a.valor) : '—';
    /* as partes de cada status, como no pé dos cartões do diário de 03/11 */
    [['an-comp', 'an_comprador'], ['an-vend', 'an_vendedor'], ['vd-ag', 'aguardando'], ['vd-vd', 'vendido'],
      ['nv-sem', 'sem_ofertas'], ['nv-rej', 'rejeitados'], ['nv-vc', 'venda_cancelada'], ['nv-out', 'outros']].forEach((s) => { $('#km-' + s[0]).textContent = nf(k[s[1]]); });
    /* "outros" (status fora do domínio) só aparece quando existe */
    $('#km-nv-out').parentNode.hidden = !k.outros;
    metaCartao('km-vd', sobre(k.vendidos), metaDe(k, 'venda', true), k, FM.sit === 'at' ? RM.meta_ev.venda : null);
    desenhaMes();
    RVM = calculaVeicMes(D, FM);
    if (TABELAS['veic-m']) TABELAS['veic-m'].lim = PASSO;
    desenhaVeicMes();
    /* a nota do buraco no access_logs, embaixo dos dois gráficos. Cada gráfico
       tem a sua escala (24/11): nos 12 meses, os meses com buraco; nos dias do
       mês, só se o próprio mês de referência tem buraco — em nov/26 a nota
       aparecia nos dias sem ter o que avisar */
    const inc = MESES_D.map((r, m) => (acIncompleto(m) && m !== ULT_M ? rotMes(m) + ' (' + notaAc(m) + ')' : null)).filter((x) => x);
    const txtIncMes = inc.length ? '⚠ O registro de acessos tem buraco em ' + inc.join(', ') + ': nesses meses, com acesso e lojistas que acessaram saem a menos.' : '';
    const txtIncDia = acIncompleto(RM.ref) && RM.ref !== ULT_M
      ? '⚠ O registro de acessos tem buraco em ' + rotMes(RM.ref) + ' (' + notaAc(RM.ref) + '): nos dias sem registro, com acesso e lojistas que acessaram saem a menos.' : '';
    const txtInc = (dia) => (dia ? txtIncDia : txtIncMes);
    const txtAt = txtInc(VIS_M.at === 'dia');
    $('#nota-ac-m').textContent = txtAt;
    $('#nota-ac-m').hidden = !txtAt;
    const txtLj = txtInc(VIS_M.lj === 'dia');
    const txtCat = FM.cat ? 'Os lojistas não seguem o filtro de categoria: a loja age no evento, não na categoria do veículo.' : '';
    $('#nota-ac-lm').textContent = [txtLj, txtCat].filter((x) => x).join(' ');
    $('#nota-ac-lm').hidden = !txtLj && !txtCat;
    /* os lojistas: 12 meses ou os dias do mês de referência (19/11) */
    const ljDia = VIS_M.lj === 'dia';
    $('#tit-lj-m').textContent = ljDia ? 'Lojistas por dia em ' + rotMes(RM.ref) : 'Lojistas por mês';
    linhas($('#g-lojistas-m'), ljDia
      ? RM.lojistas_dias.map((g) => Object.assign({ rot: rotDiaM(g.k), longo: rotDiaMLongo(g.k) }, g))
      : RM.meses.map((g) => Object.assign({ rot: rotMesEixo(g.m),
        longo: rotMesLongo(g.m) + (acIncompleto(g.m) ? ' · ⚠ ' + notaAc(g.m) : '') }, g.lojistas)), [
      { k: 'acessaram', nome: 'Acessaram', cls: 's-ac' },
      { k: 'ofertaram', nome: 'Ofertaram', cls: 's-of' },
      { k: 'compraram', nome: 'Compraram', cls: 's-co' }
    ]);
    $('#n-lojistas-m').textContent = nf(k.lojistas.acessaram) + ' lojas acessaram em ' + rotMes(RM.ref);
    $('#tot-lojistas-m').innerHTML = [['Acessaram', 'acessaram'], ['Ofertaram', 'ofertaram'], ['Compraram', 'compraram']]
      .map((p) => '<span>' + p[0] + ' em ' + esc(rotMes(RM.ref)) + ' <b class="num">' + nf(k.lojistas[p[1]]) + '</b></span>').join('');
  }
  /* a tabela de eventos do mês (Thomas, 19/11: "semelhante à visão
     diária"): uma linha por evento ativo em algum dia do mês de referência,
     com os veículos DELE, os status do sistema, o termômetro do indicador
     com a meta do mês e a META AJUSTADA do evento — o que ele precisava
     fazer para o mês fechar na meta, compensando os eventos que terminaram
     antes dele abrir (24/11). Clique
     filtra pelo evento, como no Diário */
  const STATUS_EV_M = [['veiculos', 'Veículos'], ['st_ativo', 'Ativos'], ['analise', 'Em análise'], ['vendidos', 'Vendidos'],
    ['nao_vendidos', 'Não vendidos']];
  const dataCurta = (s) => (s ? s.slice(8, 10) + '/' + s.slice(5, 7) : '—');
  /* a ordenação por coluna (Thomas, 24/11): clique no título ordena,
     clique de novo inverte; número começa do maior, texto e data do menor.
     Vazio vai para o fim; o empate fica na ordem de sempre (ativos
     primeiro, depois do maior para o menor), que é a de quando nada foi
     clicado */
  const ordEvM = { k: '', dir: 1 };
  function desenhaEventosMes() {
    const E = D.mes.eventos;
    const k = CAMPO_META[kpi] ? kpi : null;
    const cols = [['nome', 'Evento'], ['fim', 'Fim']].concat(STATUS_EV_M.map((q) => [q[0], q[1], 1]),
      [['ind', rotIndicador() + ' no mês · meta do mês'], ['aj', 'Meta do evento', 1]]);
    const val = (c, q) => (q === 'nome' ? E[c.ev][0] : q === 'fim' ? E[c.ev][2] || null : q === 'ind' ? pctDe(c)
      : q === 'aj' ? (k ? c.meta_ev[k] : null) : c[q]);
    const o = ordEvM;
    const lista = !o.k ? RM.eventos : RM.eventos.map((c, i) => [c, i]).sort((a, b) => {
      const x = val(a[0], o.k);
      const y = val(b[0], o.k);
      if (x === null || y === null || x === y) return x === y ? a[1] - b[1] : x === null ? 1 : -1;
      return o.dir * (typeof x === 'string' ? x.localeCompare(y, 'pt-BR') : x - y);
    }).map((p) => p[0]);
    const sel = FM.ev === '' ? null : Number(FM.ev);
    $('#ev-rot-m').textContent = (FM.sit === 'at' ? 'Eventos ativos' : FM.sit === 'fin' ? 'Eventos finalizados' : 'Eventos') +
      ' em ' + rotMesLongo(RM.ref);
    $('#n-evlista-m').textContent = nf(lista.length) + (lista.length === 1 ? ' evento' : ' eventos');
    const ML = RM.meta_ev_lista;
    const ma = k ? ML[k] : null;
    const tagAj = $('#aj-m');
    tagAj.hidden = ma === null;
    tagAj.textContent = ma === null ? '' : 'Meta do evento dos ativos: ' + pc(ma);
    tagAj.title = ma === null ? '' : 'Média pesada pelos veículos dos eventos ativos da lista' +
      (ML.fora[k] ? '; ' + nf(ML.fora[k]) + ' veículo(s) em grupos que não chegam mais à meta do mês (limitada a 100%)' : '');
    $('#cab-ev-m').innerHTML = cols.map((q) => {
      const at = q[0] === o.k;
      return '<span' + (q[2] || q[0] === 'fim' ? ' class="n"' : '') + '><button type="button" class="ord' + (at ? ' at' : '') + '" data-ok="' + q[0] +
        '" aria-label="Ordenar por ' + esc(q[1]) + '">' + esc(q[1]) + '<span class="seta-ord" aria-hidden="true">' + (at ? (o.dir > 0 ? '▲' : '▼') : '') + '</span></button></span>';
    }).join('');
    $('#g-ev-m').innerHTML = lista.length ? lista.map((c) => {
      const e = E[c.ev];
      const marcado = sel === c.ev;
      const x = pctDe(c);
      const m = metaDe(c);
      let aj = '<span class="dim">—</span>';
      if (k && c.meta_ev[k] !== null) {
        const lim = c[k === 'oferta' ? 'lim_of' : 'lim_ve'];
        /* verde quando o evento já está na meta do evento ou acima (24/11) */
        aj = '<b class="' + (x === null ? '' : x >= c.meta_ev[k] ? 'sobe' : 'desce') + '">' + pc(c.meta_ev[k]) + '</b>' +
          (lim ? ' <span class="aviso-txt" title="' + esc(nf(lim) + ' veículo(s) em grupos que, com os finalizados, já não chegam à meta do mês: a meta do evento deles ficou em 100%') + '">⚠</span>' : '');
      }
      return '<button type="button" class="lin lin-m' + luzMeta(c) + (marcado ? ' marcada' : '') + (sel !== null && !marcado ? ' apagado' : '') +
        '" data-em="' + c.ev + '" aria-pressed="' + marcado + '" aria-label="' + esc((marcado ? 'Tirar o filtro do evento ' : 'Filtrar pelo evento ') + e[0]) + '">' +
        '<span class="c-nome"><b title="' + esc(e[0]) + '">' + esc(e[0]) + '</b><span class="dim sub">' +
          esc(e[6].map((j) => D.mes.comitentes[j]).join(', ') + ' · ' + dataCurta(e[1]) + ' a ' + dataCurta(e[2]) + ' · ' + (e[7] ? 'finalizado' : 'ativo')) +
        '</span></span>' +
        '<span class="n num" data-r="Fim">' + esc(dt(e[2])) + '</span>' +
        STATUS_EV_M.map((q) => '<span class="n num" data-r="' + q[1] + '">' + nf(c[q[0]]) + '</span>').join('') +
        '<span class="termo">' + trilho(x, m) + '<span class="pc num">' + (x === null ? '—' : pc(x)) + '</span>' +
          '<span class="de">' + (m === null ? '' : 'meta ' + pc(m)) + '</span></span>' +
        '<span class="n num aj" data-r="Meta do evento">' + aj + '</span>' +
        '</button>';
    }).join('') : '<p class="dim">' + (FM.sit === 'at' && RM.ref !== ULT_M ? 'Nenhum evento ativo em ' + rotMesLongo(RM.ref) + ': evento ativo só no mês corrente.'
      : 'Nenhum evento neste mês com estes filtros.') + '</p>';
  }
  $('#cab-ev-m').addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-ok]');
    if (!b) return;
    const q = b.getAttribute('data-ok');
    if (ordEvM.k === q) ordEvM.dir = -ordEvM.dir;
    else { ordEvM.k = q; ordEvM.dir = ['nome', 'fim'].indexOf(q) < 0 ? -1 : 1; }
    desenhaEventosMes();
  });
  $('#g-ev-m').addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-em]');
    if (!b) return;
    const e = b.getAttribute('data-em');
    FM.ev = FM.ev === e ? '' : e;
    montaFiltrosMes();
    renderMes();
  });
  $('#g-comit-m').addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-cm]');
    if (!b) return;
    const c = b.getAttribute('data-cm');
    FM.comit = FM.comit === c ? '' : c;
    montaFiltrosMes();
    renderMes();
  });
  /* as abas: Diário e Mensal mostram blocos diferentes e têm filtros
     diferentes na gaveta; indicador e Todos/Novos valem para as duas */
  function trocaAba(a2) {
    aba = a2;
    alterna('seg-aba', aba);
    $('#v-dia').hidden = aba !== 'dia';
    $('#v-mes').hidden = aba !== 'mes';
    $('#fil-dia').hidden = aba !== 'dia';
    $('#fil-mes').hidden = aba !== 'mes';
    if (aba === 'mes') renderMes(); else render();
  }
  /* o Diário ficou escondido (Thomas, 24/11: "oculte a página diário"): as
     abas saíram do topo, a página abre no Mensal e o Diário segue no código
     — trocaAba('dia') o traz de volta */
  function redesenhaIndicador() {
    if (aba === 'mes') { desenhaMes(); return; }
    desenhaAtivos();
    desenhaComitentes();
    desenhaEventos();
  }

  /* links de anúncio: aberto pelo SharePoint o arquivo pode ficar num
     quadro que bloqueia nova aba. Tenta abrir; se o navegador barrar, copia
     o endereço e mostra (o mesmo do Painel C6) */
  let esperaLk = null;
  document.addEventListener('click', (ev) => {
    const a = ev.target.closest ? ev.target.closest('a[target="_blank"]') : null;
    if (!a) return;
    ev.preventDefault();
    const url = a.href;
    let w = null;
    try { w = window.open(url, '_blank'); if (w) w.opener = null; } catch (e) { w = null; }
    if (w) return;
    let copiou = false;
    try {
      const t = document.createElement('textarea');
      t.value = url;
      t.style.position = 'fixed';
      t.style.opacity = '0';
      document.body.appendChild(t);
      t.select();
      copiou = document.execCommand('copy');
      document.body.removeChild(t);
    } catch (e) { copiou = false; }
    const cx = $('#dica-lk');
    cx.innerHTML = '<b>' + (copiou ? 'Link copiado' : 'O navegador bloqueou a abertura') + '</b>' +
      '<span class="dim sub">Abra uma nova aba e cole o endereço:</span><span class="lk-url"></span>';
    cx.querySelector('.lk-url').textContent = url;
    cx.hidden = false;
    clearTimeout(esperaLk);
    esperaLk = setTimeout(() => { cx.hidden = true; }, 12000);
  });
  let espera = null;
  let largAnt = window.innerWidth;
  window.addEventListener('resize', () => {
    if (window.innerWidth === largAnt) return;
    largAnt = window.innerWidth;
    clearTimeout(espera);
    espera = setTimeout(() => { if (aba === 'mes') renderMes(); else { desenhaAtivos(); render(); } }, 150);
  });

  /* glossário: peça fixa, do dado */
  $('#gloss-lista').innerHTML = D.glossario.map((g) =>
    '<dt>' + esc(g[0]) + '</dt><dd>' + esc(g[1]) + '</dd>').join('');
  $('#gloss-n').textContent = D.glossario.length + ' termos';
  $('#gerado').textContent = dt(D.agora);
  $('#base').textContent = nf(D.eventos.length) + ' eventos dos canais ' + D.canais.map((c) => c[0]).join(', ') +
    ' com fim desde ' + rotDia(0) + '/' + D.piso_dia.slice(0, 4) +
    (D.carteira_em ? ' · carteira comercial de ' + D.carteira_em.slice(8, 10) + '/' + D.carteira_em.slice(5, 7) + '/' + D.carteira_em.slice(0, 4) : '');

  /* tema: nasce no do arquivo (escuro), troca ao vivo, não é gravado */
  const ICO = {
    claro: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    escuro: '<path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/>'
  };
  function tema(t) {
    document.documentElement.dataset.tema = t;
    $('#logo').src = LOGO[t].extensa;
    $('#logo-curta').src = LOGO[t].curta;
    const alvo = t === 'escuro' ? 'claro' : 'escuro';
    const b = $('#b-tema');
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICO[alvo] + '</svg>';
    b.setAttribute('aria-label', 'Mudar para o tema ' + alvo);
    b.setAttribute('title', 'Tema ' + alvo);
  }
  tema(document.documentElement.dataset.tema || 'escuro');
  $('#b-tema').addEventListener('click', () =>
    tema(document.documentElement.dataset.tema === 'escuro' ? 'claro' : 'escuro'));

  gaveta(false);
  montaFiltros();
  montaFiltrosMes();
  trocaAba('mes');
}

/* ── 9. glossário: só a regra vigente ────────────────────────────────── */
/* o glossário (17/11: virou texto com marcas — {canais}, {dias}, {dias_max} —,
   para morar na Peças da Página no n8n e o Montar Painel caber nos 56 KB da
   API; _divide.js). As marcas são trocadas logo abaixo */
const GLOSSARIO_TXT = [
  ['Evento no painel', 'Evento que alveja algum dos canais {canais}, que já abriu as ofertas e termina a partir de {dias} dias atrás: os ativos e os encerrados recentes. Agendado, com as ofertas ainda fechadas, não entra.'],
  ['Filtros', 'Na aba lateral. Whitelabel, comitente, categoria, mês de referência, evento e as datas de início e de fim do evento. Whitelabel e as datas, com a situação do topo, escolhem os eventos; comitente e categoria recortam os veículos; evento mostra os veículos do evento escolhido. Categoria: Leves (motos inclusive), Pesados, Equipamentos ou Não informada, a do cadastro do veículo; os lojistas não a seguem.'],
  ['Comitente', 'A loja que anuncia o veículo no evento — o banco, a locadora ou a frota que está vendendo.'],
  ['Responsável', 'O consultor comercial dono da loja na carteira comercial, pelo CNPJ. Recorta as lojas: acessos, ofertas e vendas de quem é da carteira dele. Os veículos não têm responsável, então os cartões e as barras de veículos ativos não mudam com ele. Não distribuído: loja fora da carteira.'],
  ['Data', 'De e Até escolhem os dias dos dois gráficos e da tabela de veículos. Os cartões mostram os eventos ativos no dia do Até — hoje, sem filtro.'],
  ['Eventos ativos', 'Eventos abertos no dia: do dia do início das ofertas ao dia do fim. Embaixo, os veículos distintos desses eventos e os comitentes deles.'],
  ['Status nos cartões', 'De cada veículo dos eventos ativos no dia, vale a negociação no evento mais recente. Os status formam um funil: Com oferta conta todo veículo que recebeu lance até o dia, inclusive os que depois atingiram o VMV, venderam ou foram removidos; VMV atingido conta os que alcançaram o VMV e os vendidos; Vendidos cabe em VMV atingido, que cabe em Com oferta. Removidos fica à parte. O mesmo carro num feirão que fecha e noutro que abre no mesmo dia conta uma vez. O percentual é sobre os veículos dos eventos ativos. Num dia passado, lances e vendas contam só até aquele dia — Com oferta e Vendidos são os do gráfico no mesmo dia —, mas removido e a fase (aberto, em análise, encerrado) são os de hoje: o banco não guarda o status de cada dia.'],
  ['Indicador e Todos/Novos', 'Os botões no topo da página. Indicador: com acesso, com oferta ou vendidos. Veículos: todos ou só os novos do dia. Valem juntos para a rosca dos cartões, o termômetro da lista de eventos e o gráfico de veículos ativos por dia — os três mostram a mesma conta: dos veículos ativos no dia (com Novos, dos que estrearam no dia), quantos já tiveram o anúncio aberto, receberam lance ou foram vendidos no evento, do começo dele até aquele dia.'],
  ['Cartões por comitente', 'Logo abaixo dos números do dia, três por linha, um cartão por comitente com evento ativo no dia. À esquerda, sob o nome do indicador, dois gráficos do indicador do topo para os veículos do comitente: a rosca, com o percentual do dia no centro, e a linha dos últimos 7 dias, um ponto por dia (preenchimento transparente embaixo, o ponto de hoje marcado, o valor de cada dia no balão), com a linha de referência tracejada na meta — a mesma do título do cartão e do traço da rosca. Embaixo deles, na mesma linha, quantos de quantos e a diferença em pontos percentuais (p.p.) para o dia anterior, com a seta e sem cor. À direita, os status: veículos dos eventos ativos, com oferta, VMV atingido, vendidos e removidos. A base da rosca são os veículos ativos no dia. A luz do cartão, no canto, e a cor dos dois gráficos olham para a META: verdes com o indicador do dia na meta ou acima, vermelhas abaixo; sem meta (Com acesso, ou comitente fora da planilha), azul. A mesma cor vale para cada linha da lista de eventos. Clicar num cartão filtra o painel inteiro por aquele comitente; clicar de novo tira o filtro. Os cartões seguem os outros filtros (canal, evento, responsável, data), mas não o de comitente: o escolhido fica marcado e os demais, apagados.'],
  ['Lista de eventos', 'Abaixo dos cartões, uma linha por evento ativo no dia: os mesmos status e o termômetro do indicador do topo, com a diferença em p.p. para o dia anterior; a linha acende verde quando o indicador subiu e vermelha quando caiu, e o termômetro ganha a mesma cor, como os cartões. Clicar numa linha filtra pelo evento; clicar de novo tira. Ela segue o comitente escolhido: com um cartão marcado, só os eventos dele. Nasce fechada; abre ao escolher um comitente ou ao clicar no título.'],
  ['Com oferta', 'Recebeu lance de alguma loja até o dia, ou foi vendido — em qualquer status: inclui os que atingiram o VMV, os vendidos e os removidos que tinham lance. Hoje, é o mesmo número do gráfico com o indicador Com oferta. Abertos: ainda recebendo lance. Em análise: a decisão está com o comprador ou com o vendedor. Encerrados: o resto (rejeitados, vendidos, removidos, fechados).'],
  ['VMV atingido', 'O maior lance alcançou o valor mínimo de venda (VMV), ou o veículo foi vendido — em qualquer status. Abertos, em análise e encerrados como em Com oferta.'],
  ['Vendidos', 'Aguardando pagamento, aguardando confirmação de pagamento ou vendido. O valor é a soma das ofertas vencedoras.'],
  ['Removidos', 'Tirados do evento sem chegar à venda: cancelados ou suspensos. Os que tinham lance contam também em Com oferta.'],
  ['Meta', 'Do % com oferta e do % vendidos, por whitelabel, comitente e categoria — só Leves (motos inclusive) e Pesados; Equipamentos e Não informada não têm meta —, da planilha de metas no SharePoint, que tem uma aba por mês (2026-11) com a meta mensal. O veículo leva a meta do whitelabel do evento dele; evento de mais de um whitelabel leva a média das metas deles. Vale a meta do mês de referência: no Mensal, a aba de cada mês; no Diário, a meta mensal do mês de cada dia. A meta de um recorte é a média das metas dos veículos dele. Com acesso não tem meta.'],
  ['Veículos ativos por dia', 'Veículos distintos com negociação num evento aberto no dia. A barra separa os que já estavam em evento dos novos do dia.'],
  ['Novo', 'Veículo que estreou no dia: o dia de início das ofertas do primeiro evento da vida dele, em qualquer canal. O carro que volta num feirão seguinte não é novo de novo. Na tabela, a data da estreia fica embaixo do veículo.'],
  ['% com acesso, com oferta, vendidos', 'A linha do gráfico, escolhida nos botões do indicador, no topo da página: dos veículos ativos no dia, quantos já tiveram o anúncio aberto por alguma loja, receberam lance ou foram vendidos (pela data da oferta vencedora) no evento, do começo dele até aquele dia — a negociação do evento mais recente ativo no dia, a mesma dos cartões. Vendido conta como com oferta. No dia de hoje, com oferta e vendidos fecham com os cartões. Com Novos, a conta é só dos novos do dia.'],
  ['Lojistas por dia', 'Lojas distintas por dia, com o número de cada dia no ponto. Acessaram: abriram algum anúncio dos eventos filtrados. Ofertaram: deram lance. Compraram: têm a oferta vencedora de uma venda, no dia dela. Embaixo, as lojas distintas do período inteiro.'],
  ['Acessos (tabela)', 'Lojas distintas que abriram o anúncio do veículo no período. Uma loja que abriu dez vezes conta uma.'],
  ['Ofertas', 'Lances nas negociações do veículo no período e, embaixo, quantas lojas deram lance.'],
  ['Maior oferta', 'O maior lance do veículo nas negociações do período.'],
  ['% FIPE e % VMV', 'A maior oferta dividida pela FIPE do anúncio e pelo valor mínimo de venda (VMV) que o comitente aceita. 100% ou mais no VMV = VMV atingido.'],
  ['Evento e resultado', 'Na tabela, o evento mais recente do veículo no período e o status da negociação nele. Quando vendeu, a loja compradora e o valor.'],
  ['Farol', 'A bolinha antes do veículo. Vermelho: sem oferta. Amarelo: há oferta, mas nenhuma chegou ao VMV (ou o VMV não foi informado). Verde: alguma oferta alcançou o VMV.'],
  ['Link do anúncio', 'Abre o anúncio mais recente do veículo — na vitrine do C6 quando o evento é só dos canais do C6, no cars2you.com.br nos demais.'],
  ['Visão Mensal', 'O painel mostra os últimos 12 meses: o mês corrente, até hoje, e os 11 anteriores. Os cartões com os status do sistema, os cartões por comitente, a tabela de eventos do mês, os dois gráficos (em meses ou nos dias do mês de referência) e a tabela de veículos do mês. A visão diária ficou escondida em 24/11.'],
  ['Evento no mensal', 'O mesmo recorte de canais, ativo em algum dia do mês, aberto ou já finalizado. Evento com mais de {dias_max} dias de ofertas fica fora: é depósito de anúncios, não evento.'],
  ['Situação do evento', 'Os botões Eventos, no canto do topo: Ativos (o painel abre nele), Finalizados ou Todos. Finalizado: o sistema encerrou o evento e o horário de fim já passou — as duas coisas. Ativo: o resto (aberto, em prorrogação ou ainda não encerrado). Com Ativos, cada veículo conta se o evento mais recente dele no mês ainda está ativo, e a meta dos cartões passa a ser a meta do evento. Num mês fechado não há evento ativo.'],
  ['Início e fim do evento', 'Dois filtros de data no Mensal, cada um com De e Até: o dia em que o evento abriu as ofertas e o dia em que termina. Escolhem os eventos; o veículo conta pelo evento mais recente dele no mês.'],
  ['Veículo no mês', 'Veículo distinto com negociação num evento ativo no mês. Novo no mês: estreou no mês. O status é o da negociação no evento mais recente dele no mês — o dono dele no mês —; nos meses fechados, é o desfecho. Se essa negociação foi removida (suspensa ou cancelada), o veículo sai do mês. O comitente é o dessa negociação. Com um evento escolhido, contam os veículos do evento, cada um pela negociação dele no evento.'],
  ['Status no mês', 'Os status do sistema, da negociação mais recente de cada veículo no mês. Os cinco grupos não se cruzam e somam os veículos do mês. Ativos: negociação ativa, ainda recebendo lance. Em análise: a oferta está na mesa, com o comprador ou com o vendedor. Vendidos: aguardando pagamento, aguardando confirmação de pagamento ou vendido. Não vendidos: o evento passou e não vendeu — sem ofertas, vendedor ou comprador rejeitou, ou a venda foi cancelada depois de fechada. Os removidos (suspensos ou cancelados) não entram no Mensal: não contam nos veículos, nos percentuais, nos gráficos, nos lojistas, nas tabelas nem nas metas.'],
  ['Valor vendido', 'No mensal, cartão próprio ao lado dos Vendidos: a soma das ofertas vencedoras dos veículos vendidos no mês. Embaixo, a variação em % e a diferença em reais contra o mês anterior, e o valor dele.'],
  ['% no mês', 'Dos veículos ativos no mês, quantos já tiveram o anúncio aberto, receberam lance ou foram vendidos no evento — a negociação do evento mais recente dele no mês, como nos cartões. Vendidos é o mesmo número do cartão do mês.'],
  ['Cartões por comitente no mês', 'Como no diário, para o mês escolhido no filtro Mês: a rosca é o indicador no mês, a área mostra os 12 meses até ele e a diferença em p.p. é contra o mês anterior. À direita, os veículos e os status do sistema; a quantidade do indicador fica embaixo da rosca ("44 de 1.800").'],
  ['Lojistas por mês', 'Lojas distintas que abriram anúncio, deram lance ou compraram nos eventos do recorte — no mês, ou em cada dia do mês de referência. Uma loja ativa no mês inteiro conta uma vez. Seguem canal, evento, situação, datas e comitente (pelos eventos do comitente); não seguem a categoria. Embaixo, os números do mês escolhido.'],
  ['Tabela de eventos do mês', 'Abaixo dos cartões por comitente, uma linha por evento ativo em algum dia do mês de referência: o fim do evento, os veículos e os status do sistema, o termômetro do indicador do topo com a meta do mês, e a meta do evento — verde quando o evento já está nela ou acima, vermelha abaixo; no finalizado, traço. Clicar no título de uma coluna ordena por ela; de novo, inverte. Clicar numa linha filtra pelo evento; clicar de novo solta.'],
  ['Meta do evento', 'O % que os eventos ativos precisam atingir para o mês fechar na meta, considerando o volume do mês e o que os eventos finalizados já fizeram: (meta do mês × veículos do mês − realizado nos finalizados) ÷ veículos dos eventos ativos, entre 0% e 100% — 0% quando a meta do mês já está garantida, 100% com aviso quando não dá mais para chegar. É calculada por whitelabel, comitente e categoria, com cada veículo pelo evento mais recente dele no mês; a de um evento, de um comitente ou dos cartões é a média dos grupos dos veículos ativos deles. Os filtros não a mudam. Conta só os veículos que já estão em eventos do mês: um evento que abre depois muda a meta dos ativos. Aparece na tabela de eventos e, com Ativos, nos cartões. Segue o indicador: com oferta ou vendidos.'],
  ['Dias do mês', 'Os botões 12 meses e Dias do mês nos dois gráficos do Mensal: os dias do mês de referência (até hoje no mês corrente), com os mesmos filtros. Veículo ativo no dia e o percentual acumulado no evento até o dia, como no Diário. Os lojistas são os dos eventos do mês: quem abriu no dia o anúncio de um evento que fechou no mês anterior conta no Diário e não aqui.'],
  ['Tabela de veículos do mês', 'No fim da página, um veículo por linha, como a tabela de veículos do Diário, com os mesmos filtros do painel: sem evento escolhido, cada veículo vem pelo evento mais recente dele no mês; com um evento, os veículos dele. O veículo um a um vem do dado dos últimos {dias_tab} dias: no mês corrente a tabela é inteira, no anterior só a parte dentro dessa janela, e nos mais antigos não há tabela. Exportar CSV baixa as linhas da tabela — todas, com a busca e na ordem escolhida — num arquivo que abre no Excel.']
];
const nomesCanais = DADOS.canais.map((c) => c[1] + ' (' + c[0] + ')').join(', ');
/* com o Diário escondido (24/11), os termos só dele ficam fora da página
   (seguem no texto, para a volta dele) */
const SO_DIARIO = ['Responsável', 'Data', 'Eventos ativos', 'Status nos cartões', 'Lista de eventos', 'Com oferta', 'VMV atingido',
  'Veículos ativos por dia', '% com acesso, com oferta, vendidos', 'Lojistas por dia'];
DADOS.glossario = GLOSSARIO_TXT.filter((par) => SO_DIARIO.indexOf(par[0]) < 0).map((par) => par.map((t) => t.split('{canais}').join(nomesCanais)
  .split('{dias_max}').join(String(META.dias_max_evento)).split('{dias_tab}').join(String(META.dias + 1)).split('{dias}').join(String(META.dias))));

/* ── 10. o HTML ──────────────────────────────────────────────────────── */
const CSS_PAINEL = [
  /* cores do painel que o tema.css não tem. Derivadas, não marca — o
     registro está no README: segunda série de barra (cinza), farol amarelo.
     Medidas (design/_contraste.js) contra o pior plano, AA de traço 3,0:
     claro #748290 3,19 no canto do cartão; escuro #646E86 3,18 no cartão;
     farol #946200 4,25 no canto e #E3B341 9,38 no escuro */
  ':root{--serie-2:#748290;--farol-abaixo:#946200}',
  '[data-tema="escuro"]{--serie-2:#646E86;--farol-abaixo:#E3B341}',
  /* sem rosa/vinho no painel (Thomas, 03/11): o --atencao do tema.css é o
     vinho no claro e o rosa no escuro, e sai daqui inteiro — o que era dele
     (selo de rejeitado na tabela) vai para o amarelo do farol */
  ':root,[data-tema="escuro"]{--atencao:var(--farol-abaixo)}',
  /* fontes um pouco mais claras no escuro (Thomas, 03/11), medidas sobre o
     cartão #12151D: texto 16,7:1, texto-2 10,7 (era 8,0), texto-3 6,1 (era
     4,0 — abaixo de AA). Só neste painel; o tema.css segue como está */
  '[data-tema="escuro"]{--texto:#F3F5FA;--texto-2:#C0C6D4;--texto-3:#8E95A8}',
  /* ".ctrl.so-icone" declara display e venceria o atributo hidden */
  '[hidden]{display:none!important}',
  '#dica-lk{position:fixed;z-index:50;left:50%;bottom:20px;transform:translateX(-50%);width:max-content;max-width:min(640px,92vw);',
  'background:var(--superficie);border:1px solid var(--borda);border-radius:10px;padding:10px 14px;box-shadow:0 6px 24px rgba(0,0,0,.18);font-size:13px}',
  '#dica-lk .lk-url{display:block;margin-top:4px;word-break:break-all;user-select:all}',
  '#dica-g{position:fixed;z-index:40;width:max-content;max-width:min(320px,92vw);background:var(--superficie);',
  'color:var(--texto);border:1px solid var(--borda-forte);border-radius:var(--r-p);box-shadow:var(--sombra);',
  'padding:8px 10px;font-size:12px;line-height:1.5;pointer-events:none;font-variant-numeric:tabular-nums}',
  /* KPI: o percentual e a barra logo abaixo do número grande */
  '.kpi-pc{display:flex;flex-direction:column;gap:5px;margin-top:2px}',
  '.kpi-pc .txt{font-size:11.5px;font-weight:600;color:var(--texto-2)}',
  '.trilho{display:block;height:6px;border-radius:3px;background:var(--acento-veu);overflow:hidden;min-width:40px}',
  '.trilho i{display:block;height:100%;border-radius:3px;background:var(--acento-cheio)}',
  '.trilho{position:relative}.trilho .marca-meta{position:absolute;top:0;bottom:0;width:2px;margin-left:-1px;background:var(--texto)}',
  '.meta-txt{font-size:11.5px;color:var(--texto-2)}.meta-txt b{color:var(--texto)}',
  /* cinco cartões na linha: 5, depois 3, 2 e 1 conforme a largura */
  '.g4.g5{grid-template-columns:repeat(5,minmax(0,1fr))}',
  '@media (max-width:1400px){.g4.g5{grid-template-columns:repeat(3,minmax(0,1fr))}}',
  '@media (max-width:900px){.g4.g5{grid-template-columns:repeat(2,minmax(0,1fr))}}',
  '@media (max-width:620px){.g4.g5{grid-template-columns:1fr}}',
  /* sete cartões no Mensal (18/11: sem o Com oferta, com o Valor vendido):
     7 na linha, depois 4 (4 + 3), 2 e 1 */
  '.g4.g6{grid-template-columns:repeat(6,minmax(0,1fr))}',
  '@media (max-width:1600px){.g4.g6{grid-template-columns:repeat(3,minmax(0,1fr))}}',
  '@media (max-width:900px){.g4.g6{grid-template-columns:repeat(2,minmax(0,1fr))}}',
  '@media (max-width:620px){.g4.g6{grid-template-columns:1fr}}',
  '.kpi-pe div[hidden]{display:none}',
  /* o pé dos sete cartões leva até quatro números: quebra linha em vez de
     cortar o rótulo, e o mês anterior fica numa linha própria embaixo */
  '.g4.g6 .kpi-pe{flex-wrap:wrap;gap:6px 14px}',
  '.g4.g6 .kpi-pe div:has(dd[id$="-ant"]){flex-basis:100%}',
  /* as abas Diário e Mensal levam o mesmo respiro da página entre os
     visuais (Thomas, 16/11): eram blocos, e os visuais saíam colados */
  '#v-dia,#v-mes{display:flex;flex-direction:column;gap:var(--gap)}',
  /* o indicador no topo (Thomas, 03/11): rótulo e botões direto no campo,
     --texto-2 e não --texto-3 (regra 10c) */
  '.barra-ind{display:flex;justify-content:flex-start;align-items:center;gap:8px 16px;flex-wrap:wrap}',
  '.barra-ind .canto-tema{margin-left:auto}',
  '.grupo-ind{display:flex;align-items:center;gap:8px 10px;flex-wrap:wrap}',
  '.rot-ind{font-size:12px;font-weight:600;color:var(--texto-2)}.nota-ind{font-size:12px;color:var(--texto-2)}',
  /* os cartões por comitente (03/11): o cartão é um botão — reset do botão,
     aperto do KPI (regra 2), marcado com contorno e os outros apagados.
     Três por linha; rosca à esquerda, status à direita */
  '.barra-comit{display:flex;justify-content:space-between;align-items:center;gap:6px 14px;flex-wrap:wrap;margin:0 0 10px}',
  '.rot-comit,.nota-comit{font-size:12px;font-weight:600;color:var(--texto-2)}.nota-comit{font-weight:500}',
  '.g-comit{display:grid;gap:var(--gap);grid-template-columns:repeat(3,minmax(0,1fr))}',
  '@media (max-width:1100px){.g-comit{grid-template-columns:repeat(2,minmax(0,1fr))}}',
  'button.cartao.comit{font:inherit;color:inherit;text-align:left;cursor:pointer;width:100%;display:flex;flex-direction:column;',
  'gap:10px;padding:13px 14px;transition:opacity .15s ease}',
  'button.cartao.comit > span{display:block}',
  'button.cartao.comit:hover{border-color:var(--borda-forte)}',
  'button.cartao.comit:focus-visible{outline:2px solid var(--acento);outline-offset:2px}',
  'button.cartao.comit[aria-pressed="true"]{outline:2px solid var(--acento-cheio);outline-offset:-1px}',
  'button.cartao.comit.apagado{opacity:.5}button.cartao.comit.apagado:hover{opacity:.85}',
  'button.cartao.comit > .comit-topo{display:flex;align-items:center;gap:8px}',
  '.comit-nome{font-size:12.5px;font-weight:650;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
  '.comit-topo .tag{margin-left:auto;flex:none}',
  /* minigráficos maiores (Thomas, 03/11): rosca e área dividem a parte
     dos gráficos por igual, a rosca até 110px e a área até 150px, cada uma
     na proporção do desenho. Com a rosca fixa, em 1.180px a área caía a 59px */
  '.mini.m-rosca{flex:1 1 0;max-width:110px}',
  '.rosca{width:100%;height:auto;display:block}',
  '.rosca .r-fundo{fill:none;stroke:var(--acento-veu);stroke-width:6}',
  '.rosca .r-arco{fill:none;stroke:var(--acento-cheio);stroke-width:6;stroke-linecap:round}',
  '.rosca .r-meta{stroke:var(--texto);stroke-width:2;stroke-linecap:round}',
  '.semana .s-meta{fill:none;stroke:var(--texto-2);stroke-width:1.25;stroke-dasharray:3 3}',
  '.pp{color:var(--texto-2)}',
  '.rosca .r-pc{font-size:14px;font-weight:700;fill:var(--texto);font-variant-numeric:tabular-nums}',
  /* o cartão em duas metades (03/11): gráficos à esquerda, status à direita */
  /* 60/40 (Thomas, 03/11): os gráficos ganham largura da tabela de status */
  'button.cartao.comit > .comit-meio{display:grid;grid-template-columns:3fr 2fr;gap:14px;align-items:center}',
  '.comit-graf{display:flex;flex-direction:column;align-items:center;gap:6px;min-width:0}',
  '.comit-minis{display:flex;align-items:flex-end;justify-content:center;gap:6px;width:100%}',
  '.mini{display:flex;flex-direction:column;align-items:center;gap:3px;min-width:0}',
  '.comit-ind{font-size:11.5px;font-weight:600;color:var(--texto-2);text-align:center;white-space:nowrap}',
  /* a luz do cartão pela diferença (03/11): o mesmo véu do canto do
     --brilho do tema, em verde ou vermelho. Os dois temas têm brilho */
  'button.cartao.comit.luz-sobe{--brilho:radial-gradient(420px 220px at 0% 0%,color-mix(in srgb,var(--positivo) 24%,transparent),transparent 72%)}',
  'button.cartao.comit.luz-desce{--brilho:radial-gradient(420px 220px at 0% 0%,color-mix(in srgb,var(--negativo) 24%,transparent),transparent 72%)}',
  '.mini.m-sem{flex:1 1 0;max-width:150px}',
  '.semana{width:100%;height:auto;display:block;overflow:visible}',
  '.semana .s-base{stroke:var(--borda-forte);stroke-width:1}',
  '.semana .s-area{fill:var(--acento-cheio);fill-opacity:.22;stroke:none}',
  '.semana .s-linha{fill:none;stroke:var(--acento-cheio);stroke-width:2;stroke-linejoin:round;stroke-linecap:round}',
  '.semana .s-hoje{fill:var(--acento-cheio);stroke:var(--superficie);stroke-width:1.5}',
  '.semana .s-alvo{fill:transparent}.semana .s-alvo:hover{fill:var(--acento-veu)}',
  /* o número e a diferença na MESMA linha (Thomas, 03/11), centralizados */
  '.comit-num{display:flex;align-items:baseline;justify-content:center;gap:5px;white-space:nowrap;font-size:11.5px;color:var(--texto-2)}',
  '.comit-num .sep{color:var(--texto-3)}',
  '.comit-num b{font-size:12.5px;color:var(--texto);font-weight:650}',
  '.comit-st{min-width:0;display:grid;gap:4px;font-size:12px;color:var(--texto-2)}',
  '.comit-st > span{display:flex;justify-content:space-between;gap:8px;white-space:nowrap}',
  '.comit-st b{color:var(--texto);font-weight:650}',
  '.comit-st .tot{color:var(--texto);font-weight:600;border-bottom:1px solid var(--borda);padding-bottom:4px;margin-bottom:1px}',
  '.comit-rodape{font-size:11px;color:var(--texto-3);border-top:1px solid var(--borda);padding-top:7px}',
  '.comit-rodape b{color:var(--texto-2);font-weight:650}',
  /* a lista por evento (03/11): grade de colunas iguais em todas as linhas,
     cabeçalho incluído; a linha é um botão. No telefone, o nome e o
     termômetro em cima e os cinco números embaixo, cada um com o rótulo */
  '.lin{display:grid;grid-template-columns:minmax(200px,2.6fr) repeat(5,minmax(62px,.7fr)) minmax(250px,2.6fr);',
  'gap:12px;align-items:center;padding:9px 10px}',
  '.lin .n{text-align:right;font-variant-numeric:tabular-nums}',
  '.lin.cab{font-size:11.5px;font-weight:600;color:var(--texto-3);border-bottom:1px solid var(--borda);padding-top:0}',
  'button.lin{font:inherit;color:inherit;text-align:left;width:100%;background:none;border:0;border-bottom:1px solid var(--borda);',
  'cursor:pointer;border-radius:0;transition:opacity .15s ease}',
  'button.lin:last-child{border-bottom:0}',
  'button.lin:hover{background-color:var(--acento-veu)}',
  'button.lin:focus-visible{outline:2px solid var(--acento);outline-offset:-2px}',
  'button.lin.marcada{background-color:var(--acento-veu);box-shadow:inset 3px 0 0 var(--acento-cheio)}',
  /* a luz por linha (03/11): o véu dos cartões, deitado — do começo da
     linha para a direita, em verde ou vermelho pela diferença */
  'button.lin.luz-sobe{background-image:radial-gradient(320px 70px at 0% 50%,color-mix(in srgb,var(--positivo) 22%,transparent),transparent 75%)}',
  'button.lin.luz-desce{background-image:radial-gradient(320px 70px at 0% 50%,color-mix(in srgb,var(--negativo) 22%,transparent),transparent 75%)}',
  /* a cor dos gráficos pela diferença também (Thomas, 03/11): rosca, área e
     termômetro em verde quando subiu e vermelho quando caiu; igual ou sem
     dado, o azul de sempre. Pega carona nas classes da luz */
  'button.comit.luz-sobe .r-arco,button.comit.luz-sobe .s-linha{stroke:var(--positivo)}',
  'button.comit.luz-sobe .s-area,button.comit.luz-sobe .s-hoje{fill:var(--positivo)}',
  'button.comit.luz-desce .r-arco,button.comit.luz-desce .s-linha{stroke:var(--negativo)}',
  'button.comit.luz-desce .s-area,button.comit.luz-desce .s-hoje{fill:var(--negativo)}',
  'button.lin.luz-sobe .termo .trilho i{background:var(--positivo)}',
  'button.lin.luz-desce .termo .trilho i{background:var(--negativo)}',
  'button.lin.apagado{opacity:.5}button.lin.apagado:hover{opacity:.85}',
  '.c-nome{min-width:0}.c-nome b{display:block;font-weight:650;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
  /* a coluna do indicador com a mesma largura em toda linha (03/11): barra,
     percentual e diferença em colunas fixas — antes a barra encolhia quando
     a diferença era mais longa */
  '.termo{display:grid;grid-template-columns:minmax(60px,1fr) 52px 84px;align-items:center;gap:10px;min-width:0}',
  '.termo .trilho{height:8px;border-radius:4px;min-width:0}',
  '.termo .pc{font-weight:700;text-align:right}.termo .de{font-size:11px;white-space:nowrap;text-align:right}',
  '.lista-ev .clique{font-size:11.5px}',
  '.lista-ev > .rolo-ev{padding:0 18px 12px}',
  /* a tabela de eventos do Mensal (19/11): seis números, o termômetro e a meta ajustada */
  '.lin.lin-m{grid-template-columns:minmax(180px,2.2fr) minmax(92px,.8fr) repeat(6,minmax(50px,.6fr)) minmax(200px,2fr) minmax(80px,.8fr)}',
  '.lin.cab .n button.ord{flex-direction:row-reverse}.lin.cab button.ord{text-align:inherit}',
  '.lin-m .aj{white-space:nowrap}.lin-m .aj b{font-weight:700}',
  '.tag-aj{background:var(--acento-veu);color:var(--texto)}',
  /* a situação no topo (24/11): no celular, sem o rótulo, para o título caber */
  '@media(max-width:600px){.topo-acoes .rot-ind{display:none}}',
  '[data-tema="escuro"] input.ctrl[type="date"]{color-scheme:dark}',
  'input.ctrl[type="date"]{width:100%;min-width:0}',
  '@media (max-width:900px){.rolo-ev .cab{display:none}',
  '.lin,.lin.lin-m{grid-template-columns:repeat(3,minmax(0,1fr));gap:6px 10px}',
  '.lin .c-nome,.lin .termo{grid-column:1 / -1}.lin .termo{order:-1}.lin .c-nome{order:-2}',
  '.lin .n{text-align:left;font-weight:650}.lin .n::before{content:attr(data-r);display:block;font-size:10.5px;font-weight:500;color:var(--texto-3)}}',
  /* no telefone, uma fileira que corre de lado em vez de dez cartões empilhados */
  '@media (max-width:620px){.g-comit{grid-template-columns:none;grid-auto-flow:column;grid-auto-columns:86%;',
  'overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:4px}.g-comit > .comit{scroll-snap-align:start}',
  /* a metade do cartão não cabe a rosca e a semana lado a lado: uma embaixo da outra */
  'button.cartao.comit > .comit-meio{grid-template-columns:1fr}}',
  /* segmentado: os botões acima do gráfico e na gaveta */
  '.seg{display:inline-flex;padding:2px;gap:2px;border-radius:var(--r-p);background:var(--superficie-2);border:1px solid var(--borda)}',
  '.seg button{font:inherit;font-size:12px;font-weight:600;color:var(--texto-2);background:transparent;border:0;',
  'border-radius:8px;padding:5px 10px;cursor:pointer}',
  '.seg button[aria-pressed="true"]{background:var(--acento);color:var(--superficie)}',
  '.seg button:focus-visible{outline:2px solid var(--acento);outline-offset:1px}',
  '.cartao-topo{flex-wrap:wrap}',
  /* a linha de controles do gráfico: Todos/Novos à direita (o indicador
     subiu para o topo em 03/11) */
  /* título ordenável: botão dentro do th */
  'button.ord{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer;display:inline-flex;gap:4px;',
  'align-items:center;white-space:nowrap;text-align:inherit}',
  'button.ord.at{color:var(--texto)}button.ord:focus-visible{outline:2px solid var(--acento);outline-offset:2px}',
  '.seta-ord{font-size:9px;min-width:8px}th.n button.ord{flex-direction:row-reverse}',
  '.rolo.alto{max-height:640px;overflow:auto}',
  'table.dens thead th{text-align:left}table.dens tbody td{text-align:left}',
  'table.dens td.n,table.dens th.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}',
  'table.dens a{color:var(--texto);text-decoration:underline;text-underline-offset:2px}',
  '.dim{color:var(--texto-3)}.sub{display:block;font-size:11px}',
  '.farol{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:7px;vertical-align:1px}',
  '.farol.sem{background:var(--negativo)}.farol.abaixo{background:var(--farol-abaixo)}.farol.atingiu{background:var(--positivo)}',
  'td.c-vmv{min-width:110px}.vmv{display:inline-flex;align-items:center;gap:8px;justify-content:flex-end;width:100%}',
  '.vmv .trilho{width:56px;flex:none}.vmv.ok .trilho i{background:var(--positivo)}',
  '.mais{display:block;margin:12px auto 0}',
  '.busca{max-width:260px}',
  /* gráficos */
  '.legenda{display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:var(--texto-2);margin:0 0 8px}',
  '.amostra{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:6px;vertical-align:-1px}',
  '.amostra.traco{height:3px;border-radius:2px;vertical-align:2px;width:14px}',
  '.graf .serie-a,.amostra.serie-a{fill:var(--acento-cheio);background:var(--acento-cheio)}',
  '.graf .serie-b,.amostra.serie-b{fill:var(--serie-2);background:var(--serie-2)}',
  /* a linha do indicador na cor do texto (branca no escuro): sem rosa (03/11),
     e as barras já são cinza e azul */
  '.graf .linha-kpi{fill:none;stroke:var(--texto);stroke-width:2.25;stroke-linejoin:round;stroke-linecap:round}',
  '.graf .ponto-kpi{fill:var(--texto)}.amostra.linha-kpi{background:var(--texto)}',
  '.graf .linha-meta{fill:none;stroke:var(--texto-2);stroke-width:1.75;stroke-dasharray:5 4;stroke-linecap:round}',
  '.amostra.linha-meta{background:repeating-linear-gradient(90deg,var(--texto-2) 0 5px,transparent 5px 8px)}',
  '.graf .eixo-p{fill:var(--texto-2)}',
  '.graf .linha-grade.forte{stroke:var(--borda-forte)}',
  '.graf .linha{fill:none;stroke-width:2.25;stroke-linejoin:round;stroke-linecap:round}',
  /* o rótulo do ponto: pílula na cor da linha com o fundo TRANSPARENTE (28%,
     Thomas, 03/11), sem contorno, número na cor do texto. Medido no
     pior plano de cada tema: de 4,99 a 11,63:1, AA nos seis casos */
  '.graf .rot-p text{font-size:10.5px;font-weight:700;fill:var(--texto);font-variant-numeric:tabular-nums;pointer-events:none}',
  '.graf .rot-p rect{pointer-events:none;fill-opacity:.28;stroke:none}',
  '.graf .rot-p.s-ac rect{fill:var(--texto)}.graf .rot-p.s-of rect{fill:var(--acento-cheio)}.graf .rot-p.s-co rect{fill:var(--positivo)}',
  /* Acessaram branco (a cor do texto: branca no escuro, grafite no claro) e
     Ofertaram azul (Thomas, 03/11) */
  '.graf .linha.s-ac{stroke:var(--texto)}.graf .ponto.s-ac,.amostra.s-ac{fill:var(--texto);background:var(--texto)}',
  '.graf .linha.s-of{stroke:var(--acento-cheio)}.graf .ponto.s-of,.amostra.s-of{fill:var(--acento-cheio);background:var(--acento-cheio)}',
  '.graf .linha.s-co{stroke:var(--positivo)}.graf .ponto.s-co,.amostra.s-co{fill:var(--positivo);background:var(--positivo)}',
  '.graf .alvo{fill:transparent;cursor:default}.graf .alvo:hover,.graf .alvo:focus{fill:var(--acento-veu);outline:none}',
  '.caixa-g{width:100%;min-height:280px}.caixa-g > svg{display:block;width:100%;height:auto}',
  '.tot{display:flex;gap:18px;flex-wrap:wrap;font-size:12px;color:var(--texto-2);margin-top:10px}',
  '.tot b{color:var(--texto);font-weight:650;margin-left:4px}',
  /* a gaveta de filtros (regra 5c, padrão do Radar e do Painel C6) */
  '.aba{position:fixed;left:0;top:50%;transform:translateY(-50%);z-index:41;display:flex;flex-direction:column;',
  'align-items:center;gap:6px;padding:14px 7px;border-radius:0 var(--r-m) var(--r-m) 0;border:var(--cartao-borda);',
  'border-left:0;background:var(--superficie);color:var(--texto);box-shadow:var(--sombra);cursor:pointer;font:inherit}',
  '.aba:hover{color:var(--acento);border-color:var(--borda-forte)}',
  '.aba svg{width:17px;height:17px;stroke:currentColor;fill:none;stroke-width:1.9;stroke-linecap:round}',
  '.aba .rot{writing-mode:vertical-rl;font-size:11.5px;font-weight:600;letter-spacing:.06em;text-transform:uppercase}',
  '.aba .n{min-width:18px;height:18px;border-radius:9px;background:var(--acento);color:var(--superficie);',
  'font-size:11px;font-weight:700;line-height:18px;text-align:center}',
  '.gaveta{position:fixed;left:0;top:0;bottom:0;z-index:42;width:min(380px,92vw);overflow:auto;padding:14px;',
  'transform:translateX(-102%);transition:transform .18s ease;background:var(--fundo)}',
  '.gaveta.aberta{transform:none}',
  '.veu{position:fixed;inset:0;z-index:41;background:rgba(4,6,12,.45)}',
  '.fechar{margin-left:auto;background:none;border:0;padding:0 4px;font-size:20px;line-height:1;color:var(--texto-3);cursor:pointer}',
  '.fechar:hover{color:var(--texto)}',
  '.filtros{display:grid;gap:12px;grid-template-columns:1fr}',
  '.fg label,.fg .rot-fg{display:block;font-size:12px;font-weight:600;color:var(--texto-2);margin-bottom:4px}',
  '.fg select,.fg button{width:100%}',
  '.fg2{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
  '.nota{font-size:12px;color:var(--texto-2);margin-top:14px;line-height:1.5}',
  /* a nota do buraco no access_logs (aba Mensal): texto do aviso, sem fundo */
  '.nota-ac{font-size:12px;color:var(--texto-2);margin:10px 0 0;line-height:1.5}',
  '.aviso-txt{color:var(--farol-abaixo)}',
  '.area{padding-left:52px}',
  '@media(max-width:620px){.area{padding-left:12px}.aba{top:auto;bottom:16px;transform:none;flex-direction:row}',
  '.aba .rot{writing-mode:horizontal-tb}.busca{max-width:none;width:100%}}',
  '@media (prefers-reduced-motion:reduce){.gaveta{transition:none}}'
].join('');

const ICONE = {
  evento: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  veiculo: '<path d="M3 13l2-5a2 2 0 012-1h10a2 2 0 012 1l2 5v5h-3M6 18H3v-5h18"/><circle cx="7.5" cy="16.5" r="1.5"/><circle cx="16.5" cy="16.5" r="1.5"/>',
  relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
  vendido: '<path d="M20 6L9 17l-5-5"/>',
  removido: '<circle cx="12" cy="12" r="9"/><path d="M8 8l8 8M16 8l-8 8"/>',
  naovendido: '<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>',
  oferta: '<path d="M12 3v18M17 7H9.5a3 3 0 000 6h5a3 3 0 010 6H6"/>',
  alvo: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  grafico: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  pessoa: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>',
  lista: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  filtros: '<path d="M3 5h18M6 12h12M10 19h4"/>',
  gloss: '<path d="M4 19V5a2 2 0 012-2h13v18H6a2 2 0 01-2-2z"/><path d="M4 19a2 2 0 012-2h13"/>'
};
const chip = (k) => '<span class="chip" aria-hidden="true"><svg viewBox="0 0 24 24">' + ICONE[k] + '</svg></span>';
/* cartão de KPI: número grande, percentual com barra e números no pé */
const kpiCard = (ic, rot, idVal, meio, pe, idRot) =>
  '<article class="cartao"><div class="cartao-topo">' + chip(ic) + '<span class="kpi-rot"' + (idRot ? ' id="' + idRot + '"' : '') + '>' + rot + '</span></div>' +
  '<p class="kpi-val num" id="' + idVal + '">—</p>' + meio +
  '<dl class="kpi-pe">' + pe.map((p) => '<div><dt>' + p[0] + '</dt><dd class="num" id="' + p[1] + '">—</dd></div>').join('') +
  '</dl></article>';
const meioPc = (idTxt, idBar, idMeta) => '<div class="kpi-pc"><span class="txt num" id="' + idTxt + '">—</span><span id="' + idBar + '"></span>' +
  (idMeta ? '<span class="meta-txt" id="' + idMeta + '" hidden></span>' : '') + '</div>';
const topoCartao = (ic, titulo, idN, extra) => '<div class="cartao-topo">' + chip(ic) + '<h2>' + titulo + '</h2>' +
  '<span class="dir">' + (extra || '') + '<span class="tag" id="' + idN + '">—</span></span></div>';
const seg = (id, rot, opcoes, ativo) => '<span class="seg" id="' + id + '" role="group" aria-label="' + rot + '">' +
  opcoes.map((o) => '<button type="button" data-v="' + o[0] + '" aria-pressed="' + (o[0] === ativo) + '">' + o[1] + '</button>').join('') +
  '</span>';
const filtro = (id, rotulo) => '<div class="fg"><label for="' + id + '">' + rotulo + '</label>' +
  '<select class="ctrl" id="' + id + '"></select></div>';
/* um campo de data (19/11: as datas de início e fim do evento no Mensal) */
const data = (id, rotulo) => '<div class="fg"><label for="' + id + '">' + rotulo + '</label>' +
  '<input class="ctrl" type="date" id="' + id + '"></div>';

/* dado dentro do <script>: "<" vira a sequência de escape unicode, para
   nenhum nome de loja fechar a tag. A barra é montada em tempo de execução
   porque este arquivo não pode ter barra invertida literal. */
const dadosJs = JSON.stringify(DADOS).split('<').join(String.fromCharCode(92) + 'u003c');
const logoJs = JSON.stringify(LOGO);

/* abre no ESCURO (regra 7 de design/regras-de-layout.md: todo painel novo,
   desde 26/10). O botão troca para o claro; não é gravado */
const html = '<!doctype html><html lang="pt-BR" data-tema="escuro"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width, initial-scale=1">' +
  '<title>Painel de Eventos — Cars2You</title><style>' + CSS_TEMA + CSS_PAINEL + '</style></head><body>' +
  '<header class="topo"><div class="topo-in">' +
  '<span class="marca"><img class="logo logo-extensa" id="logo" src="" alt="Cars2You">' +
  '<img class="logo logo-curta" id="logo-curta" src="" alt="Cars2You"></span>' +
  '<div class="topo-tit"><h1>Painel de Eventos</h1></div>' +
  /* 24/11 (Thomas: "substitua o filtro de navegação pela opção eventos
     ativos, finalizados" e todos): no lugar das abas Diário e Mensal, que
     saíram com o Diário escondido, a situação dos eventos */
  '<div class="topo-acoes"><span class="grupo-ind"><span class="rot-ind">Eventos</span>' +
  seg('seg-sit', 'Situação dos eventos', [['at', 'Ativos'], ['fin', 'Finalizados'], ['', 'Todos']], 'at') + '</span>' +
  '</div></div></header><div id="dica-g" hidden></div><div id="dica-lk" hidden></div>' +
  '<button id="aba" class="aba" type="button" aria-expanded="false" aria-controls="gaveta">' +
  '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICONE.filtros + '</svg><span class="rot">Filtros</span>' +
  '<span class="n" id="aba-n" hidden></span></button>' +
  '<div id="veu" class="veu" hidden></div>' +
  '<aside id="gaveta" class="gaveta" aria-label="Filtros"><div class="cartao">' +
  '<div class="cartao-topo">' + chip('filtros') + '<h2>Filtros</h2>' +
  '<button id="fecha" class="fechar" type="button" aria-label="Fechar filtros">×</button></div>' +
  '<div class="filtros" id="fil-dia" hidden>' +
  /* a ordem do pedido (28/10): whitelabel, comitente, evento, responsável, data */
  filtro('f-wl', 'Whitelabel') +
  filtro('f-comit', 'Comitente') +
  filtro('f-cat', 'Categoria') +
  filtro('f-ev', 'Evento') +
  filtro('f-resp', 'Responsável da carteira comercial') +
  '<div class="fg2">' + filtro('f-de', 'Data: de') + filtro('f-ate', 'até') + '</div>' +
  '<p class="nota"><b>Whitelabel</b>, <b>comitente</b> e <b>evento</b> recortam os veículos, e tudo que nasce deles acompanha. ' +
  '<b>Responsável</b> recorta as lojas: os cartões e as barras de veículos não mudam com ele. ' +
  '<b>Data</b> escolhe os dias dos gráficos e da tabela; os cartões mostram o dia do Até.</p>' +
  '</div>' +
  /* os filtros da aba Mensal (06/11) */
  '<div class="filtros" id="fil-mes">' +
  filtro('f-m-wl', 'Whitelabel') +
  filtro('f-m-comit', 'Comitente') +
  filtro('f-m-cat', 'Categoria') +
  filtro('f-m-mes', 'Mês de referência') +
  filtro('f-m-ev', 'Evento') +
  /* a situação (Ativos, Finalizados, Todos) subiu para o topo em 24/11 */
  '<div class="fg2">' + data('f-m-ini-de', 'Início do evento: de') + data('f-m-ini-ate', 'até') + '</div>' +
  '<div class="fg2">' + data('f-m-fim-de', 'Fim do evento: de') + data('f-m-fim-ate', 'até') + '</div>' +
  '<p class="nota"><b>Whitelabel</b> e as <b>datas</b>, com a situação escolhida no topo (Ativos, Finalizados ou Todos), escolhem os eventos: cada veículo conta pelo evento mais recente dele no mês. ' +
  '<b>Evento</b> mostra os veículos do evento escolhido. <b>Comitente</b> e <b>categoria</b> recortam os veículos. <b>Mês de referência</b> escolhe o mês dos cartões, ' +
  'das tabelas e dos gráficos dia a dia. Finalizado = o sistema encerrou o evento e o fim já passou.</p>' +
  '</div>' +
  '<div class="filtros"><div class="fg"><button class="ctrl" id="limpar" type="button">Limpar filtros</button></div></div>' +
  '</div></aside>' +
  '<main class="area">' +
  /* o indicador no topo (Thomas, 03/11), e Todos/Novos junto dele (03/11,
     a seguir): os dois valem para a rosca dos cartões, o termômetro da lista
     de eventos e o gráfico de veículos ativos. Indicador à esquerda,
     Todos/Novos à direita — a ordem que tinham em cima do gráfico */
  /* o botão de tema desceu para cá (Thomas, 06/11): Indicador e Veículos
     juntos à esquerda, o tema no canto direito */
  '<div class="barra-ind"><span class="grupo-ind"><span class="rot-ind" id="seg-kpi-rot">Indicador</span>' +
  seg('seg-kpi', 'Indicador', [['acesso', 'Com acesso'], ['oferta', 'Com oferta'], ['venda', 'Vendidos']], 'oferta') + '</span>' +
  '<span class="grupo-ind"><span class="rot-ind" id="seg-modo-rot">Veículos</span>' +
  seg('seg-modo', 'Veículos', [['todos', 'Todos'], ['novos', 'Novos']], 'todos') + '</span>' +
  '<span class="grupo-ind canto-tema">' +
  '<button class="ctrl so-icone" id="b-tema" type="button" aria-label="Mudar o tema"></button></span></div>' +
  '<div id="v-dia" hidden>' +
  '<section class="g4 g5" aria-label="Eventos ativos no dia">' +
  kpiCard('evento', 'Eventos ativos hoje', 'k-ev', '<div class="kpi-pc"><span class="txt" id="k-ev-dia">—</span></div>',
    [['Veículos', 'k-ev-veic'], ['Comitentes', 'k-ev-com']], 'k-ev-rot') +
  /* os status em funil (Thomas, 06/11): Com oferta e VMV atingido acumulam
     os de depois; Sem oferta não tem cartão */
  kpiCard('oferta', 'Com oferta', 'k-co', meioPc('k-co-pc', 'k-co-bar', 'k-co-meta'),
    [['Abertos', 'k-co-ab'], ['Em análise', 'k-co-an'], ['Encerrados', 'k-co-en']]) +
  kpiCard('alvo', 'VMV atingido', 'k-vm', meioPc('k-vm-pc', 'k-vm-bar'),
    [['Abertos', 'k-vm-ab'], ['Em análise', 'k-vm-an'], ['Encerrados', 'k-vm-en']]) +
  kpiCard('vendido', 'Vendidos', 'k-vd', meioPc('k-vd-pc', 'k-vd-bar', 'k-vd-meta'),
    [['Aguardando pgto.', 'k-vd-ag'], ['Vendido', 'k-vd-vd'], ['Valor', 'k-vd-rs']]) +
  kpiCard('removido', 'Removidos', 'k-rm', meioPc('k-rm-pc', 'k-rm-bar'),
    [['Cancelados', 'k-rm-can'], ['Suspensos', 'k-rm-sus']]) +
  '</section>' +
  /* os cartões por comitente logo abaixo dos big numbers (Thomas, 03/11).
     O rótulo e a legenda ficam direto no campo, como a barra de Data do
     Fenauto: --texto-2, não --texto-3 (regra 10c) */
  '<section class="comitentes" aria-labelledby="comit-rot">' +
  '<div class="barra-comit"><span class="rot-comit" id="comit-rot">Comitentes com evento ativo hoje</span>' +
  '<span class="nota-comit" id="comit-nota"></span></div>' +
  '<div class="g-comit" id="g-comit"></div></section>' +
  /* a lista por evento abaixo dos cartões (Thomas, 03/11) */
  /* retrátil (03/11): o <details> é o cartão e o cabeçalho é a área de
     clique (regra 4b), com a forma do glossário (.gloss no tema.css) */
  '<details class="cartao gloss lista-ev" id="dobra-ev"><summary class="cartao-topo">' + chip('evento') + '<h2 id="ev-rot">Eventos ativos hoje</h2>' +
  '<span class="dir"><span class="dim clique">clique numa linha para filtrar</span><span class="tag" id="n-evlista">—</span>' +
  '<span class="seta" aria-hidden="true">▾</span></span></summary>' +
  '<div class="rolo-ev"><div class="lin cab" id="cab-ev"></div><div id="g-ev"></div></div></details>' +
  '<article class="cartao">' + topoCartao('grafico', 'Veículos ativos por dia', 'n-ativos') +
  '<div class="legenda"><span id="leg-a"><span class="amostra serie-b"></span>Já em evento</span>' +
  '<span><span class="amostra serie-a"></span>Novos no dia</span>' +
  '<span><span class="amostra traco linha-kpi"></span><span id="leg-linha">% com oferta</span> (eixo da direita)</span>' +
  '<span id="leg-meta" hidden><span class="amostra traco linha-meta"></span>Meta</span></div>' +
  '<div class="caixa-g" id="g-ativos" data-rot="Veículos ativos por dia, já em evento e novos, com o percentual do indicador escolhido"></div></article>' +
  '<article class="cartao">' + topoCartao('pessoa', 'Lojistas por dia', 'n-lojistas') +
  '<div class="legenda">' +
  '<span><span class="amostra traco s-ac"></span>Acessaram</span>' +
  '<span><span class="amostra traco s-of"></span>Ofertaram</span>' +
  '<span><span class="amostra traco s-co"></span>Compraram</span></div>' +
  '<div class="caixa-g" id="g-lojistas" data-rot="Lojas distintas por dia que acessaram, ofertaram e compraram"></div>' +
  '<div class="tot" id="tot-lojistas"></div></article>' +
  '<section class="cartao">' + topoCartao('lista', 'Veículos', 'n-veic',
    '<input class="ctrl busca" id="busca" type="search" placeholder="Buscar veículo, evento ou comitente" aria-label="Buscar veículo, evento ou comitente">') +
  '<div class="rolo alto"><table class="dens"><thead><tr id="th-veic"></tr></thead><tbody id="tb-veic"></tbody></table></div>' +
  '<button class="ctrl mais" id="mais-veic" type="button" hidden></button></section>' +
  '</div>' +
  /* a aba Mensal (06/11): o mesmo desenho, em meses */
  '<div id="v-mes">' +
  /* os status do sistema (Thomas, 17/11): Ativos, Em análise, Vendidos,
     Não vendidos e Removidos somam os veículos do mês. O cartão Com oferta
     saiu (Thomas, 18/11); o indicador segue no gráfico e nos comitentes.
     O valor das vendas saiu do pé do Vendidos para um cartão seu, com a
     comparação com o mês anterior (Thomas, 18/11). O Removidos saiu em
     25/11 (Thomas): removido não conta no Mensal. Seis cartões: grade
     própria (.g6), três por linha abaixo de 1.600 px */
  '<section class="g4 g6" aria-label="Eventos e status no mês">' +
  kpiCard('evento', 'Eventos no mês', 'km-ev', '<div class="kpi-pc"><span class="txt" id="km-ev-mes">—</span></div>',
    [['Veículos', 'km-ev-veic'], ['Comitentes', 'km-ev-com']], 'km-ev-rot') +
  kpiCard('veiculo', 'Ativos', 'km-at', meioPc('km-at-pc', 'km-at-bar'), [['Mês anterior', 'km-at-ant']]) +
  kpiCard('relogio', 'Em análise', 'km-an', meioPc('km-an-pc', 'km-an-bar'),
    [['Comprador', 'km-an-comp'], ['Vendedor', 'km-an-vend'], ['Mês anterior', 'km-an-ant']]) +
  kpiCard('vendido', 'Vendidos', 'km-vd', meioPc('km-vd-pc', 'km-vd-bar', 'km-vd-meta'),
    [['Aguardando pgto.', 'km-vd-ag'], ['Vendido', 'km-vd-vd'], ['Mês anterior', 'km-vd-ant']]) +
  kpiCard('oferta', 'Valor vendido', 'km-vr', '<div class="kpi-pc"><span class="txt num" id="km-vr-pc">—</span></div>',
    [['Diferença', 'km-vr-dif'], ['Mês anterior', 'km-vr-ant']]) +
  kpiCard('naovendido', 'Não vendidos', 'km-nv', meioPc('km-nv-pc', 'km-nv-bar'),
    [['Sem ofertas', 'km-nv-sem'], ['Rejeitados', 'km-nv-rej'], ['Venda cancelada', 'km-nv-vc'], ['Outros', 'km-nv-out'],
      ['Mês anterior', 'km-nv-ant']]) +
  '</section>' +
  '<section class="comitentes" aria-labelledby="comit-rot-m">' +
  '<div class="barra-comit"><span class="rot-comit" id="comit-rot-m">Comitentes com evento no mês</span>' +
  '<span class="nota-comit" id="comit-nota-m"></span></div>' +
  '<div class="g-comit" id="g-comit-m"></div></section>' +
  /* a tabela de eventos do mês (19/11), aberta: o pedido é vê-la */
  '<details class="cartao gloss lista-ev" id="dobra-ev-m" open><summary class="cartao-topo">' + chip('evento') + '<h2 id="ev-rot-m">Eventos no mês</h2>' +
  '<span class="dir"><span class="tag tag-aj" id="aj-m" hidden></span><span class="dim clique">clique numa linha para filtrar</span><span class="tag" id="n-evlista-m">—</span>' +
  '<span class="seta" aria-hidden="true">▾</span></span></summary>' +
  '<div class="rolo-ev"><div class="lin lin-m cab" id="cab-ev-m"></div><div id="g-ev-m"></div></div></details>' +
  '<article class="cartao">' + topoCartao('grafico', '<span id="tit-at-m">Veículos ativos por mês</span>', 'n-ativos-m',
    seg('seg-vis-at', 'Escala do gráfico', [['mes', '12 meses'], ['dia', 'Dias do mês']], 'mes')) +
  '<div class="legenda"><span id="leg-a-m"><span class="amostra serie-b"></span>Já em evento antes</span>' +
  '<span id="leg-b-m"><span class="amostra serie-a"></span>Novos no mês</span>' +
  '<span><span class="amostra traco linha-kpi"></span><span id="leg-linha-m">% com oferta</span> (eixo da direita)</span>' +
  '<span id="leg-meta-m" hidden><span class="amostra traco linha-meta"></span>Meta</span></div>' +
  '<div class="caixa-g" id="g-ativos-m" data-rot="Veículos ativos por mês, já em evento e novos, com o percentual do indicador escolhido"></div>' +
  '<p class="nota-ac" id="nota-ac-m" hidden></p></article>' +
  '<article class="cartao">' + topoCartao('pessoa', '<span id="tit-lj-m">Lojistas por mês</span>', 'n-lojistas-m',
    seg('seg-vis-lj', 'Escala do gráfico', [['mes', '12 meses'], ['dia', 'Dias do mês']], 'mes')) +
  '<div class="legenda">' +
  '<span><span class="amostra traco s-ac"></span>Acessaram</span>' +
  '<span><span class="amostra traco s-of"></span>Ofertaram</span>' +
  '<span><span class="amostra traco s-co"></span>Compraram</span></div>' +
  '<div class="caixa-g" id="g-lojistas-m" data-rot="Lojas distintas por mês que acessaram, ofertaram e compraram"></div>' +
  '<div class="tot" id="tot-lojistas-m"></div><p class="nota-ac" id="nota-ac-lm" hidden></p></article>' +
  /* a tabela de veículos do mês (Thomas, 24/11), como a do Diário, com o Exportar */
  '<section class="cartao">' + topoCartao('lista', '<span id="tit-veic-m">Veículos</span>', 'n-veic-m',
    '<input class="ctrl busca" id="busca-m" type="search" placeholder="Buscar veículo, evento ou comitente" aria-label="Buscar veículo, evento ou comitente">' +
    '<button class="ctrl" id="exporta-m" type="button" title="Baixa as linhas da tabela (com a busca, na ordem dela) num CSV que abre no Excel">Exportar CSV</button>') +
  '<p class="nota-ac" id="nota-veic-m" hidden></p>' +
  '<div class="rolo alto"><table class="dens"><thead><tr id="th-veic-m"></tr></thead><tbody id="tb-veic-m"></tbody></table></div>' +
  '<button class="ctrl mais" id="mais-veic-m" type="button" hidden></button></section>' +
  '</div>' +
  '<details class="cartao gloss" id="gloss"><summary class="cartao-topo">' + chip('gloss') + '<h2>Glossário</h2>' +
  '<span class="dir"><span class="tag" id="gloss-n">—</span><span class="seta" aria-hidden="true">▾</span></span>' +
  '</summary><dl id="gloss-lista"></dl></details>' +
  '<p class="rodape">Atualizado em <span id="gerado">—</span> · <span id="base"></span></p>' +
  '</main><script>' +
  calcula.toString() + calculaMes.toString() + evPassaF.toString() + calculaVeicMes.toString() + APP.toString() +
  'APP(' + dadosJs + ',' + logoJs + ');' +
  '</script></body></html>';

/* ── 11. o resumo, que as provas conferem ─────────────────────────────── */
const todos = calcula(DADOS, {});
const resumo = {
  eventos: eventos.length, negociacoes: negs.length, veiculos: veics.length,
  ofertas: ofertas.length, acessos: acessos.length, vendas: vendas.length, logins: logins.length,
  lojas: lojas.length, comitentes: comitentes.length,
  carteira: { consultores: CART.consultores.length, cnpj: Object.keys(respPorCnpj).length, gerado_em: CART.gerado_em,
    sem_carteira: semCarteira, lojas: cartConta },
  kpi: todos.kpi,
  veiculos_periodo: todos.veiculos_periodo,
  hoje: todos.dias[todos.dias.length - 1],
  lojistas_hoje: todos.lojistas[todos.lojistas.length - 1],
  tot_lojistas: todos.tot_lojistas,
  /* o mensal: um resumo por mês, sem filtro */
  meses: calculaMes(DADOS, {}).meses.map((g) => ({ mes: g.rot, eventos: g.eventos, veiculos: g.veiculos, novos: g.novos,
    acesso: g.acesso, oferta: g.oferta, venda: g.venda, com_oferta: g.com_oferta, ativos: g.st_ativo, analise: g.analise,
    vendidos: g.vendidos, nao_vendidos: g.nao_vendidos, removidos: g.removidos, outros: g.outros, valor: g.valor,
    comitentes: g.comitentes, lojistas: g.lojistas })),
  avisos: avisos,
  bytes_html: html.length
};

/* A página não pode sair sem os blocos injetados: sem tema ela abre crua,
   sem logo abre com imagem quebrada — e nenhum dos dois dá erro. */
if (CSS_TEMA.length < 5000) throw new Error('CSS do tema nao injetado (rode _aplica-modelo.js)');
if (!LOGO.claro || !LOGO.escuro || !LOGO.claro.extensa || !LOGO.escuro.curta) throw new Error('logos nao injetadas (rode _aplica-modelo.js)');

return [{ json: { html: html, resumo: resumo } }];
