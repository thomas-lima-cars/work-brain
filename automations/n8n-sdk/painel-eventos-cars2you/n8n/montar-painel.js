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
const LOGO = {"claro":{"extensa":"data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgOTMzIDE2OCIgd2lkdGg9IjkzMyIgaGVpZ2h0PSIxNjgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHhtbDpzcGFjZT0icHJlc2VydmUiIG92ZXJmbG93PSJoaWRkZW4iPjxkZWZzPjxjbGlwUGF0aCBpZD0iY2xpcDAiPjxyZWN0IHg9IjIwIiB5PSIxNCIgd2lkdGg9IjkzMyIgaGVpZ2h0PSIxNjgiLz48L2NsaXBQYXRoPjwvZGVmcz48ZyBjbGlwLXBhdGg9InVybCgjY2xpcDApIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMjAgLTE0KSI+PHBhdGggZD0iTTU0MC40MTggNjMuOTcwMyA1NDAuNDE4IDM4Ljk4NTEgNDY1LjQ2MyAzOC45ODUxIDQ2NS40NjMgMTQgNTQwLjQxOCAxNCA1NDAuNDE4IDM4Ljk4NTEgNTY1LjQwMyAzOC45ODUxIDU2NS40MDMgNjMuOTcwMyA1NDAuNDE4IDYzLjk3MDNaTTQ2NS40NjMgMTM4LjkyNiA0NjUuNDYzIDg4Ljk1NTQgNDkwLjQ0OCA4OC45NTU0IDQ5MC40NDggMTEzLjk0MSA1NjUuNDAzIDExMy45NDEgNTY1LjQwMyAxMzguOTI2IDQ2NS40NjMgMTM4LjkyNlpNNDkwLjQ0OCA4OC45NTU0IDQ5MC40NDggNjMuOTcwMyA1NDAuNDE4IDYzLjk3MDMgNTQwLjQxOCA4OC45NTU0IDQ5MC40NDggODguOTU1NFoiIGZpbGw9IiMzQTQ1NTIiLz48cGF0aCBkPSJNMzE5Ljc0OSA0My4zODI1IDMxNC43NTIgNjQuMDcwMkMzMTAuMzU1IDYxLjc3MTYgMzAzLjk1OSA2MC41NzIzIDI5OC44NjIgNjAuNTcyMyAyODUuNTcgNjAuNTcyMyAyNzYuMDc1IDY5Ljk2NjcgMjc2LjA3NSA4Ni4yNTdMMjc2LjA3NSAxMzguOTI2IDI1NS4xODggMTM4LjkyNiAyNTUuMTg4IDQzLjE4MjYgMjc1Ljg3NSA0My4xODI2IDI3NS44NzUgNTMuOTc2MkMyODIuMTcyIDQ0Ljg4MTYgMjkxLjk2NiA0MC42ODQxIDMwMy42NTkgNDAuNjg0MSAzMTUuMzUyIDQwLjY4NDEgMzE0Ljk1MiA0MS40ODM2IDMxOS43NDkgNDMuMzgyNVoiIGZpbGw9IiMzQTQ1NTIiLz48cGF0aCBkPSJNNDA0LjE5OSA2Ny4xNjg0QzM5OC40MDIgNjMuNTcwNSAzODYuNTEgNTguOTczMiAzNzQuNjE3IDU4Ljk3MzIgMzYyLjcyNCA1OC45NzMyIDM1Ni41MjcgNjMuNTcwNSAzNTYuNTI3IDcwLjM2NjUgMzU2LjUyNyA3Ny4xNjI0IDM2My41MjMgNzguOTYxMyAzNzIuMzE4IDgwLjI2MDZMMzgyLjIxMiA4MS43NTk3QzQwMy4xIDg0Ljc1NzkgNDE1LjQ5MiA5My42NTI2IDQxNS40OTIgMTEwLjA0MyA0MTUuNDkyIDEyNi40MzMgMzk5LjUwMiAxNDEuMzI0IDM3MS45MTggMTQxLjMyNCAzNDQuMzM1IDE0MS4zMjQgMzQ0LjgzNCAxMzkuNDI1IDMzMC44NDMgMTI5LjAzMkwzNDAuNTM3IDExMy4zNDFDMzQ3LjQzMyAxMTguNjM4IDM1Ni41MjcgMTIzLjEzNSAzNzIuMTE4IDEyMy4xMzUgMzg3LjcwOSAxMjMuMTM1IDM5My45MDUgMTE4LjYzOCAzOTMuOTA1IDExMS40NDIgMzkzLjkwNSAxMDQuMjQ2IDM4OC43MDggMTAyLjQ0NyAzNzcuMzE1IDEwMC44NDhMMzY3LjMyMSA5OS41NDkxQzM0Ni4xMzQgOTYuNjUwOCAzMzQuODQgODYuODU2NiAzMzQuODQgNzEuNDY1OCAzMzQuODQgNTYuMDc1IDM1MC4wMzEgNDAuNzg0MSAzNzQuNDE3IDQwLjc4NDEgMzk4LjgwMiA0MC43ODQxIDQwMy4zIDQ0LjQ4MTkgNDEzLjE5NCA1MC44NzgxTDQwNC4xOTkgNjcuMTY4NFoiIGZpbGw9IiMzQTQ1NTIiLz48cGF0aCBkPSJNNjQ0LjY1NiAxODIgNjIxLjQ3IDE4MiA2NTUuNzQ5IDEyMS43MzYgNjEzLjI3NSA0NS42ODExIDYzNi43NjEgNDUuNjgxMSA2NjcuNTQyIDEwMC42NDggNjk3LjIyNSA0NS42ODExIDcyMC4yMTEgNDUuNjgxMSA2NDQuNjU2IDE4MloiIGZpbGw9IiMzQTQ1NTIiLz48cGF0aCBkPSJNOTUyLjc3MiAxMDAuODQ4Qzk1Mi43NzIgMTMxLjMzIDkzMC43ODYgMTQzLjkyMyA5MDguMzk5IDE0My45MjMgODg2LjAxMiAxNDMuOTIzIDg2NC4wMjUgMTMxLjMzIDg2NC4wMjUgMTAwLjg0OEw4NjQuMDI1IDQ1LjY4MTEgODg1LjAxMyA0NS42ODExIDg4NS4wMTMgOTguOTQ5NEM4ODUuMDEzIDExNy40MzggODk1LjMwNyAxMjQuMjM0IDkwOC4zOTkgMTI0LjIzNCA5MjEuNDkxIDEyNC4yMzQgOTMxLjc4NSAxMTcuNDM4IDkzMS43ODUgOTguOTQ5NEw5MzEuNzg1IDQ1LjY4MTEgOTUyLjc3MiA0NS42ODExIDk1Mi43NzIgMTAwLjg0OFoiIGZpbGw9IiMzQTQ1NTIiLz48cGF0aCBkPSJNMTA2LjM3NiA1NS45NzUgOTIuOTg0MiA3MC4yNjY1Qzg2LjI4ODIgNjMuOTcwMyA3OS4xOTI0IDYwLjM3MjQgNjkuOTk3OSA2MC4zNzI0IDUzLjkwNzUgNjAuMzcyNCA0MS43MTQ4IDcyLjk2NDkgNDEuNzE0OCA5MS4wNTQxIDQxLjcxNDggMTA5LjE0MyA1My45MDc1IDEyMS43MzYgNjkuOTk3OSAxMjEuNzM2IDg2LjA4ODMgMTIxLjczNiA4Ny4zODc2IDExNy40MzggOTMuNDgzOSAxMTEuNzQyTDEwNi4zNzYgMTI2LjEzM0M5Ny42ODE0IDEzNi4yMjcgODQuODg5MSAxNDEuNDI0IDcwLjU5NzYgMTQxLjQyNCA0MC4xMTU3IDE0MS40MjQgMjAuMjI3NSAxMTkuNzM3IDIwLjIyNzUgOTEuMDU0MSAyMC4yMjc1IDYyLjM3MTIgNDAuMTE1NyA0MC42ODQxIDcwLjU5NzYgNDAuNjg0MSAxMDEuMDc5IDQwLjY4NDEgOTcuODgxMyA0NS44ODEgMTA2LjM3NiA1NS45NzVaIiBmaWxsPSIjM0E0NTUyIi8+PHBhdGggZD0iTTIyMS45MDggMTM4LjkyNiAyMDEuMDIgMTM4LjkyNiAyMDEuMDIgMTI3LjQzMkMxOTQuNDI0IDEzNS45MjcgMTg0LjUzIDE0MS40MjQgMTcwLjkzOCAxNDEuNDI0IDE0NC4xNTQgMTQxLjQyNCAxMjMuMDY2IDEyMC4zMzcgMTIzLjA2NiA5MS4wNTQxIDEyMy4wNjYgNjEuNzcxNiAxNDQuMTU0IDQwLjY4NDEgMTcwLjkzOCA0MC42ODQxIDE5Ny43MjIgNDAuNjg0MSAxOTQuNDI0IDQ2LjI4MDggMjAxLjAyIDU0Ljc3NTdMMjAxLjAyIDQzLjE4MjYgMjIxLjkwOCA0My4xODI2IDIyMS45MDggMTM4LjkyNlpNMTQ0LjU1NCA5MS4wNTQxQzE0NC41NTQgMTA3Ljg0NCAxNTUuNDQ3IDEyMS43MzYgMTczLjQzNiAxMjEuNzM2IDE5MS40MjYgMTIxLjczNiAyMDIuMzE5IDEwOC41NDQgMjAyLjMxOSA5MS4wNTQxIDIwMi4zMTkgNzMuNTY0NSAxOTAuNzI2IDYwLjM3MjQgMTczLjQzNiA2MC4zNzI0IDE1Ni4xNDcgNjAuMzcyNCAxNDQuNTU0IDc0LjI2NDEgMTQ0LjU1NCA5MS4wNTQxWiIgZmlsbD0iIzNBNDU1MiIvPjxwYXRoIGQ9Ik04MzUuMTQzIDkzLjU1MjdDODM1LjE0MyAxMjIuMjM2IDgxMy4xNTYgMTQzLjkyMyA3ODMuNTczIDE0My45MjMgNzUzLjk5MSAxNDMuOTIzIDczMi4xMDQgMTIyLjIzNiA3MzIuMTA0IDkzLjU1MjcgNzMyLjEwNCA2NC44Njk3IDc1My45OTEgNDMuMTgyNiA3ODMuNTczIDQzLjE4MjYgODEzLjE1NiA0My4xODI2IDgzNS4xNDMgNjQuODY5NyA4MzUuMTQzIDkzLjU1MjdaTTc1My41OTEgOTMuNTUyN0M3NTMuNTkxIDExMS42NDIgNzY2LjQ4MyAxMjQuMjM0IDc4My41NzMgMTI0LjIzNCA4MDAuNjYzIDEyNC4yMzQgODEzLjY1NSAxMTEuNjQyIDgxMy42NTUgOTMuNTUyNyA4MTMuNjU1IDc1LjQ2MzQgODAwLjY2MyA2Mi44NzA5IDc4My41NzMgNjIuODcwOSA3NjYuNDgzIDYyLjg3MDkgNzUzLjU5MSA3NS40NjM0IDc1My41OTEgOTMuNTUyN1oiIGZpbGw9IiMzQTQ1NTIiLz48L2c+PC9zdmc+","curta":"data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgOTkwIDQ1NCIgd2lkdGg9Ijk5MCIgaGVpZ2h0PSI0NTQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHhtbDpzcGFjZT0icHJlc2VydmUiIG92ZXJmbG93PSJoaWRkZW4iPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDk2IC0xOTcpIj48cGF0aCBkPSJNMjE5Ljc4IDEzOC4yNTggMTg1LjU4MyAxNzUuMjczQzE2OC41MjEgMTU4Ljk2OSAxNTAuMzc2IDE0OS42NDIgMTI2Ljk1MiAxNDkuNjQyIDg1Ljg4NzYgMTQ5LjY0MiA1NC44MDAzIDE4Mi4yNSA1NC44MDAzIDIyOS4xNzkgNTQuODAwMyAyNzYuMTA4IDg1Ljg4NzYgMzA4LjcxNiAxMjYuOTUyIDMwOC43MTYgMTUwLjQ0OCAzMDguNzE2IDE3MS4zNDEgMjk3LjU1MyAxODYuODg1IDI4Mi43OTFMMjE5Ljc4IDMyMC4wOTlDMTk3LjU4NSAzNDYuMjQ1IDE2NC45OCAzNTkuNzU4IDEyOC40NyAzNTkuNzU4IDUwLjc1MTcgMzU5LjY4NCAwIDMwMy41MDEgMCAyMjkuMTc5IDAgMTU0Ljg1NiA1MC43NTE3IDk4LjYwMDEgMTI4LjU0MiA5OC42MDAxIDE2NC45OCA5OC42MDAxIDE5OC4xNjMgMTEyLjA0IDIxOS44NTEgMTM4LjI1OEwyMTkuNzggMTM4LjI1OFoiIGZpbGw9IiMzQTQ1NTIiIHRyYW5zZm9ybT0ibWF0cml4KDEgMCAwIDEuMDAxMzEgLTk2IDE5NykiLz48cGF0aCBkPSJNNTMyLjI5MSAxNDMuODIyIDUzMi4yOTEgNzEuODcgMzQyLjQzNiA3MS44NyAzNDIuNDM2IDAgNTMyLjI5MSAwIDUzMi4yOTEgNzEuOTUxNiA1OTUuNTk5IDcxLjk1MTYgNTk1LjU5OSAxNDMuOTAzIDUzMi4yOTEgMTQzLjkwMyA1MzIuMjkxIDE0My44MjJaTTM0Mi40MzYgMzU5LjY3NiAzNDIuNDM2IDIxNS44NTUgNDA1Ljc0NCAyMTUuODU1IDQwNS43NDQgMjg3LjgwNiA1OTUuNTk5IDI4Ny44MDYgNTk1LjU5OSAzNTkuNzU4IDM0Mi40MzYgMzU5Ljc1OCAzNDIuNDM2IDM1OS42NzZaTTQwNS42NzMgMjE1Ljc3MyA0MDUuNjczIDE0My44MjIgNTMyLjIxOCAxNDMuODIyIDUzMi4yMTggMjE1Ljc3MyA0MDUuNjczIDIxNS43NzNaIiBmaWxsPSIjM0E0NTUyIiB0cmFuc2Zvcm09Im1hdHJpeCgxIDAgMCAxLjAwMTMxIC05NiAxOTcpIi8+PHBhdGggZD0iTTc5Ni45NzEgNDUzLjAyOSA3MzcuNzY4IDQ1My4wMjkgODI1LjM0NCAyOTYuMzMxIDcxNi44NSA5OC42MDAxIDc3Ni44NTEgOTguNjAwMSA4NTUuNDUxIDI0MS41MiA5MzEuMzAzIDk4LjYwMDEgOTkwIDk4LjYwMDEgNzk2Ljk3MSA0NTMuMDI5WiIgZmlsbD0iIzNBNDU1MiIgdHJhbnNmb3JtPSJtYXRyaXgoMSAwIDAgMS4wMDEzMSAtOTYgMTk3KSIvPjwvZz48L3N2Zz4="},"escuro":{"extensa":"data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgOTMzIDE2OCIgd2lkdGg9IjkzMyIgaGVpZ2h0PSIxNjgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHhtbDpzcGFjZT0icHJlc2VydmUiIG92ZXJmbG93PSJoaWRkZW4iPjxkZWZzPjxjbGlwUGF0aCBpZD0iY2xpcDAiPjxyZWN0IHg9IjIwIiB5PSIxNCIgd2lkdGg9IjkzMyIgaGVpZ2h0PSIxNjgiLz48L2NsaXBQYXRoPjwvZGVmcz48ZyBjbGlwLXBhdGg9InVybCgjY2xpcDApIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMjAgLTE0KSI+PHBhdGggZD0iTTU0MC40MTggNjMuOTcwMyA1NDAuNDE4IDM4Ljk4NTEgNDY1LjQ2MyAzOC45ODUxIDQ2NS40NjMgMTQgNTQwLjQxOCAxNCA1NDAuNDE4IDM4Ljk4NTEgNTY1LjQwMyAzOC45ODUxIDU2NS40MDMgNjMuOTcwMyA1NDAuNDE4IDYzLjk3MDNaTTQ2NS40NjMgMTM4LjkyNiA0NjUuNDYzIDg4Ljk1NTQgNDkwLjQ0OCA4OC45NTU0IDQ5MC40NDggMTEzLjk0MSA1NjUuNDAzIDExMy45NDEgNTY1LjQwMyAxMzguOTI2IDQ2NS40NjMgMTM4LjkyNlpNNDkwLjQ0OCA4OC45NTU0IDQ5MC40NDggNjMuOTcwMyA1NDAuNDE4IDYzLjk3MDMgNTQwLjQxOCA4OC45NTU0IDQ5MC40NDggODguOTU1NFoiIGZpbGw9IiNGRkZGRkYiLz48cGF0aCBkPSJNMzE5Ljc0OSA0My4zODI1IDMxNC43NTIgNjQuMDcwMkMzMTAuMzU1IDYxLjc3MTYgMzAzLjk1OSA2MC41NzIzIDI5OC44NjIgNjAuNTcyMyAyODUuNTcgNjAuNTcyMyAyNzYuMDc1IDY5Ljk2NjcgMjc2LjA3NSA4Ni4yNTdMMjc2LjA3NSAxMzguOTI2IDI1NS4xODggMTM4LjkyNiAyNTUuMTg4IDQzLjE4MjYgMjc1Ljg3NSA0My4xODI2IDI3NS44NzUgNTMuOTc2MkMyODIuMTcyIDQ0Ljg4MTYgMjkxLjk2NiA0MC42ODQxIDMwMy42NTkgNDAuNjg0MSAzMTUuMzUyIDQwLjY4NDEgMzE0Ljk1MiA0MS40ODM2IDMxOS43NDkgNDMuMzgyNVoiIGZpbGw9IiNGRkZGRkYiLz48cGF0aCBkPSJNNDA0LjE5OSA2Ny4xNjg0QzM5OC40MDIgNjMuNTcwNSAzODYuNTEgNTguOTczMiAzNzQuNjE3IDU4Ljk3MzIgMzYyLjcyNCA1OC45NzMyIDM1Ni41MjcgNjMuNTcwNSAzNTYuNTI3IDcwLjM2NjUgMzU2LjUyNyA3Ny4xNjI0IDM2My41MjMgNzguOTYxMyAzNzIuMzE4IDgwLjI2MDZMMzgyLjIxMiA4MS43NTk3QzQwMy4xIDg0Ljc1NzkgNDE1LjQ5MiA5My42NTI2IDQxNS40OTIgMTEwLjA0MyA0MTUuNDkyIDEyNi40MzMgMzk5LjUwMiAxNDEuMzI0IDM3MS45MTggMTQxLjMyNCAzNDQuMzM1IDE0MS4zMjQgMzQ0LjgzNCAxMzkuNDI1IDMzMC44NDMgMTI5LjAzMkwzNDAuNTM3IDExMy4zNDFDMzQ3LjQzMyAxMTguNjM4IDM1Ni41MjcgMTIzLjEzNSAzNzIuMTE4IDEyMy4xMzUgMzg3LjcwOSAxMjMuMTM1IDM5My45MDUgMTE4LjYzOCAzOTMuOTA1IDExMS40NDIgMzkzLjkwNSAxMDQuMjQ2IDM4OC43MDggMTAyLjQ0NyAzNzcuMzE1IDEwMC44NDhMMzY3LjMyMSA5OS41NDkxQzM0Ni4xMzQgOTYuNjUwOCAzMzQuODQgODYuODU2NiAzMzQuODQgNzEuNDY1OCAzMzQuODQgNTYuMDc1IDM1MC4wMzEgNDAuNzg0MSAzNzQuNDE3IDQwLjc4NDEgMzk4LjgwMiA0MC43ODQxIDQwMy4zIDQ0LjQ4MTkgNDEzLjE5NCA1MC44NzgxTDQwNC4xOTkgNjcuMTY4NFoiIGZpbGw9IiNGRkZGRkYiLz48cGF0aCBkPSJNNjQ0LjY1NiAxODIgNjIxLjQ3IDE4MiA2NTUuNzQ5IDEyMS43MzYgNjEzLjI3NSA0NS42ODExIDYzNi43NjEgNDUuNjgxMSA2NjcuNTQyIDEwMC42NDggNjk3LjIyNSA0NS42ODExIDcyMC4yMTEgNDUuNjgxMSA2NDQuNjU2IDE4MloiIGZpbGw9IiNGRkZGRkYiLz48cGF0aCBkPSJNOTUyLjc3MiAxMDAuODQ4Qzk1Mi43NzIgMTMxLjMzIDkzMC43ODYgMTQzLjkyMyA5MDguMzk5IDE0My45MjMgODg2LjAxMiAxNDMuOTIzIDg2NC4wMjUgMTMxLjMzIDg2NC4wMjUgMTAwLjg0OEw4NjQuMDI1IDQ1LjY4MTEgODg1LjAxMyA0NS42ODExIDg4NS4wMTMgOTguOTQ5NEM4ODUuMDEzIDExNy40MzggODk1LjMwNyAxMjQuMjM0IDkwOC4zOTkgMTI0LjIzNCA5MjEuNDkxIDEyNC4yMzQgOTMxLjc4NSAxMTcuNDM4IDkzMS43ODUgOTguOTQ5NEw5MzEuNzg1IDQ1LjY4MTEgOTUyLjc3MiA0NS42ODExIDk1Mi43NzIgMTAwLjg0OFoiIGZpbGw9IiNGRkZGRkYiLz48cGF0aCBkPSJNMTA2LjM3NiA1NS45NzUgOTIuOTg0MiA3MC4yNjY1Qzg2LjI4ODIgNjMuOTcwMyA3OS4xOTI0IDYwLjM3MjQgNjkuOTk3OSA2MC4zNzI0IDUzLjkwNzUgNjAuMzcyNCA0MS43MTQ4IDcyLjk2NDkgNDEuNzE0OCA5MS4wNTQxIDQxLjcxNDggMTA5LjE0MyA1My45MDc1IDEyMS43MzYgNjkuOTk3OSAxMjEuNzM2IDg2LjA4ODMgMTIxLjczNiA4Ny4zODc2IDExNy40MzggOTMuNDgzOSAxMTEuNzQyTDEwNi4zNzYgMTI2LjEzM0M5Ny42ODE0IDEzNi4yMjcgODQuODg5MSAxNDEuNDI0IDcwLjU5NzYgMTQxLjQyNCA0MC4xMTU3IDE0MS40MjQgMjAuMjI3NSAxMTkuNzM3IDIwLjIyNzUgOTEuMDU0MSAyMC4yMjc1IDYyLjM3MTIgNDAuMTE1NyA0MC42ODQxIDcwLjU5NzYgNDAuNjg0MSAxMDEuMDc5IDQwLjY4NDEgOTcuODgxMyA0NS44ODEgMTA2LjM3NiA1NS45NzVaIiBmaWxsPSIjRkZGRkZGIi8+PHBhdGggZD0iTTIyMS45MDggMTM4LjkyNiAyMDEuMDIgMTM4LjkyNiAyMDEuMDIgMTI3LjQzMkMxOTQuNDI0IDEzNS45MjcgMTg0LjUzIDE0MS40MjQgMTcwLjkzOCAxNDEuNDI0IDE0NC4xNTQgMTQxLjQyNCAxMjMuMDY2IDEyMC4zMzcgMTIzLjA2NiA5MS4wNTQxIDEyMy4wNjYgNjEuNzcxNiAxNDQuMTU0IDQwLjY4NDEgMTcwLjkzOCA0MC42ODQxIDE5Ny43MjIgNDAuNjg0MSAxOTQuNDI0IDQ2LjI4MDggMjAxLjAyIDU0Ljc3NTdMMjAxLjAyIDQzLjE4MjYgMjIxLjkwOCA0My4xODI2IDIyMS45MDggMTM4LjkyNlpNMTQ0LjU1NCA5MS4wNTQxQzE0NC41NTQgMTA3Ljg0NCAxNTUuNDQ3IDEyMS43MzYgMTczLjQzNiAxMjEuNzM2IDE5MS40MjYgMTIxLjczNiAyMDIuMzE5IDEwOC41NDQgMjAyLjMxOSA5MS4wNTQxIDIwMi4zMTkgNzMuNTY0NSAxOTAuNzI2IDYwLjM3MjQgMTczLjQzNiA2MC4zNzI0IDE1Ni4xNDcgNjAuMzcyNCAxNDQuNTU0IDc0LjI2NDEgMTQ0LjU1NCA5MS4wNTQxWiIgZmlsbD0iI0ZGRkZGRiIvPjxwYXRoIGQ9Ik04MzUuMTQzIDkzLjU1MjdDODM1LjE0MyAxMjIuMjM2IDgxMy4xNTYgMTQzLjkyMyA3ODMuNTczIDE0My45MjMgNzUzLjk5MSAxNDMuOTIzIDczMi4xMDQgMTIyLjIzNiA3MzIuMTA0IDkzLjU1MjcgNzMyLjEwNCA2NC44Njk3IDc1My45OTEgNDMuMTgyNiA3ODMuNTczIDQzLjE4MjYgODEzLjE1NiA0My4xODI2IDgzNS4xNDMgNjQuODY5NyA4MzUuMTQzIDkzLjU1MjdaTTc1My41OTEgOTMuNTUyN0M3NTMuNTkxIDExMS42NDIgNzY2LjQ4MyAxMjQuMjM0IDc4My41NzMgMTI0LjIzNCA4MDAuNjYzIDEyNC4yMzQgODEzLjY1NSAxMTEuNjQyIDgxMy42NTUgOTMuNTUyNyA4MTMuNjU1IDc1LjQ2MzQgODAwLjY2MyA2Mi44NzA5IDc4My41NzMgNjIuODcwOSA3NjYuNDgzIDYyLjg3MDkgNzUzLjU5MSA3NS40NjM0IDc1My41OTEgOTMuNTUyN1oiIGZpbGw9IiNGRkZGRkYiLz48L2c+PC9zdmc+","curta":"data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgOTkwIDQ1NCIgd2lkdGg9Ijk5MCIgaGVpZ2h0PSI0NTQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHhtbDpzcGFjZT0icHJlc2VydmUiIG92ZXJmbG93PSJoaWRkZW4iPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDk2IC0xOTcpIj48cGF0aCBkPSJNMjE5Ljc4IDEzOC4yNTggMTg1LjU4MyAxNzUuMjczQzE2OC41MjEgMTU4Ljk2OSAxNTAuMzc2IDE0OS42NDIgMTI2Ljk1MiAxNDkuNjQyIDg1Ljg4NzYgMTQ5LjY0MiA1NC44MDAzIDE4Mi4yNSA1NC44MDAzIDIyOS4xNzkgNTQuODAwMyAyNzYuMTA4IDg1Ljg4NzYgMzA4LjcxNiAxMjYuOTUyIDMwOC43MTYgMTUwLjQ0OCAzMDguNzE2IDE3MS4zNDEgMjk3LjU1MyAxODYuODg1IDI4Mi43OTFMMjE5Ljc4IDMyMC4wOTlDMTk3LjU4NSAzNDYuMjQ1IDE2NC45OCAzNTkuNzU4IDEyOC40NyAzNTkuNzU4IDUwLjc1MTcgMzU5LjY4NCAwIDMwMy41MDEgMCAyMjkuMTc5IDAgMTU0Ljg1NiA1MC43NTE3IDk4LjYwMDEgMTI4LjU0MiA5OC42MDAxIDE2NC45OCA5OC42MDAxIDE5OC4xNjMgMTEyLjA0IDIxOS44NTEgMTM4LjI1OEwyMTkuNzggMTM4LjI1OFoiIGZpbGw9IiNGRkZGRkYiIHRyYW5zZm9ybT0ibWF0cml4KDEgMCAwIDEuMDAxMzEgLTk2IDE5NykiLz48cGF0aCBkPSJNNTMyLjI5MSAxNDMuODIyIDUzMi4yOTEgNzEuODcgMzQyLjQzNiA3MS44NyAzNDIuNDM2IDAgNTMyLjI5MSAwIDUzMi4yOTEgNzEuOTUxNiA1OTUuNTk5IDcxLjk1MTYgNTk1LjU5OSAxNDMuOTAzIDUzMi4yOTEgMTQzLjkwMyA1MzIuMjkxIDE0My44MjJaTTM0Mi40MzYgMzU5LjY3NiAzNDIuNDM2IDIxNS44NTUgNDA1Ljc0NCAyMTUuODU1IDQwNS43NDQgMjg3LjgwNiA1OTUuNTk5IDI4Ny44MDYgNTk1LjU5OSAzNTkuNzU4IDM0Mi40MzYgMzU5Ljc1OCAzNDIuNDM2IDM1OS42NzZaTTQwNS42NzMgMjE1Ljc3MyA0MDUuNjczIDE0My44MjIgNTMyLjIxOCAxNDMuODIyIDUzMi4yMTggMjE1Ljc3MyA0MDUuNjczIDIxNS43NzNaIiBmaWxsPSIjRkZGRkZGIiB0cmFuc2Zvcm09Im1hdHJpeCgxIDAgMCAxLjAwMTMxIC05NiAxOTcpIi8+PHBhdGggZD0iTTc5Ni45NzEgNDUzLjAyOSA3MzcuNzY4IDQ1My4wMjkgODI1LjM0NCAyOTYuMzMxIDcxNi44NSA5OC42MDAxIDc3Ni44NTEgOTguNjAwMSA4NTUuNDUxIDI0MS41MiA5MzEuMzAzIDk4LjYwMDEgOTkwIDk4LjYwMDEgNzk2Ljk3MSA0NTMuMDI5WiIgZmlsbD0iI0ZGRkZGRiIgdHJhbnNmb3JtPSJtYXRyaXgoMSAwIDAgMS4wMDEzMSAtOTYgMTk3KSIvPjwvZz48L3N2Zz4="}};
const WL_VITRINE_C6 = [43, 48];
const MIN_CNPJ_CARTEIRA = 500;
const STATUS_NOME = {
  1: 'Ativo', 2: 'Aguardando pagamento', 3: 'Aguardando confirmação de pagamento',
  7: 'Vendido', 8: 'Suspenso', 9: 'Em análise do comprador', 10: 'Cancelado',
  11: 'Sem ofertas', 13: 'Em análise do vendedor', 14: 'Vendedor rejeitou',
  15: 'Comprador rejeitou', 18: 'Venda cancelada'
};
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
Object.keys(META.partes).forEach((k) => {
  if (vistas[k] !== META.partes[k]) {
    throw new Error('A tabela ' + k + ' chegou em ' + (vistas[k] || 0) + ' parte(s), esperadas ' + META.partes[k]);
  }
});
const num = (x) => (x === null || x === undefined || x === '' ? null : Number(x));
const avisos = [];
const conta = {};
const marca = (chave) => { conta[chave] = (conta[chave] || 0) + 1; };
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
const CATS = ['L', 'P', 'E', 'N'];
const CAT_DE = { 'leves': 'L', 'pesados': 'P', 'equipamentos': 'E', 'não informada': 'N', 'nao informada': 'N' };
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
  if (n > 1) n = n / 100;
  return n >= 0 && n <= 1 ? n : null;
};
const lerMetas = (nome, aba) => {
  const linhas = lerNo(nome).map((i) => (i.json && Array.isArray(i.json.row) ? i.json.row : null)).filter((r) => r);
  const txt = (x) => String(x === null || x === undefined ? '' : x).trim();
  const vazia = (x) => txt(x) === '';
  const qual = aba === 'Média diária' ? 'do diário' : 'do mensal';
  const out = {};
  if (!linhas.length) { avisoMeta.push('a aba ' + aba + ' da planilha de metas não veio: sem a meta ' + qual); return out; }
  const h = linhas.findIndex((r) => r.some((x) => txt(x) === 'ID comitente'));
  const cab = h >= 0 ? linhas[h] : [];
  const cId = cab.findIndex((x) => txt(x) === 'ID comitente');
  const cols = [];
  let medida = '';
  for (let j = cId + 1; h > 0 && j < cab.length; j++) {
    const m = txt((linhas[h - 1] || [])[j]).toLowerCase();
    if (m) medida = m;
    const c = CAT_DE[txt(cab[j]).toLowerCase()];
    const k = medida.indexOf('oferta') >= 0 ? 0 : medida.indexOf('vend') >= 0 ? 1 : -1;
    if (c && k >= 0) cols.push([j, c, k]);
  }
  if (!cols.length) {
    avisoMeta.push('a aba ' + aba + ' da planilha de metas veio fora do formato (sem a linha do ID comitente, as categorias e, em cima, % Com Oferta e % Vendido): sem a meta ' + qual);
    return out;
  }
  let ruins = 0;
  linhas.slice(h + 1).forEach((r) => {
    const id = num(r[cId]);
    const par = {};
    cols.forEach((x) => {
      if (vazia(r[x[0]])) return;
      if (!par[x[1]]) par[x[1]] = [undefined, undefined];
      par[x[1]][x[2]] = pctMeta(r[x[0]]);
    });
    Object.keys(par).forEach((c) => {
      const of = par[c][0];
      const ve = par[c][1];
      if (id === null || of === null || of === undefined || ve === null || ve === undefined) { ruins++; return; }
      out[id + '|' + c] = [of, ve];
    });
  });
  if (ruins) avisoMeta.push(ruins + ' meta(s) da aba ' + aba + ' da planilha sem o ID do comitente, ilegíveis ou só com uma das duas: ficam sem meta');
  return out;
};
const metaDiaId = lerMetas('Metas Diárias', 'Média diária');
const metaMesId = lerMetas('Metas Mensais', 'Média mensal');
const reindexa = (m, idx) => {
  const o = {};
  Object.keys(m).forEach((k) => {
    const p = k.split('|');
    const i = idx[Number(p[0])];
    if (i !== undefined) o[i + '|' + p[1]] = m[k];
  });
  return o;
};
const PISO_DIA = META.piso_dia;
const utcDe = (s) => Date.UTC(Number(s.slice(0, 4)), Number(s.slice(5, 7)) - 1, Number(s.slice(8, 10)));
const P0 = utcDe(PISO_DIA);
const diaIdx = (s) => (s ? Math.round((utcDe(s) - P0) / 86400000) : null);
const HOJE = diaIdx(META.agora_br);
if (HOJE !== META.dias) throw new Error('o dia de hoje (' + HOJE + ') nao e o ultimo da janela (' + META.dias + ')');
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
  return { id: num(v.veic), linha: [v.marca || '', v.modelo || '', v.versao || '', num(v.ano), num(v.km), est,
    String(v.uuid || '').split('-').join(''), cat] };
});
const veicIdx = {};
veics.forEach((v, i) => { veicIdx[v.id] = i; });
const negs = [];
const negIdx = {};
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
const mesGrupos = T.mes_veic.map((g) => {
  let cat = String(g.cat || '');
  if (CATS.indexOf(cat) < 0) { marca('mes_sem_categoria'); cat = 'N'; }
  const r = [num(g.m), comDoMes(g.c), num(g.wm), num(g.veic), num(g.novos), num(g.ac), num(g.of), num(g.ve),
    num(g.ac_n), num(g.of_n), num(g.ve_n), num(g.so), num(g.co), num(g.vm), num(g.vd), num(g.rm), Math.round(num(g.valor) || 0), cat];
  if (r[11] + r[12] !== r[3] || r[14] > r[13] || r[13] > r[12] || r[15] > r[3] || r[6] !== r[12] || r[7] !== r[14]) {
    throw new Error('mes_veic: no mes ' + MESES[r[0]] + ' o funil nao fecha (veiculos ' + r[3] + ', sem oferta ' + r[11] +
      ', com oferta ' + r[12] + ', VMV ' + r[13] + ', vendidos ' + r[14] + ', comitente ' + g.c + ')');
  }
  if (!r[2]) marca('mes_sem_canal');
  return r;
});
const mesLoj = T.mes_loj.map((r) => [num(r.m), num(r.wl), num(r.c) ? comDoMes(r.c) : -1, num(r.ac), num(r.of), num(r.co)]);
const mesDe = (s) => MESES.indexOf(String(s || '').slice(0, 7));
const mesEventos = T.mes_eventos.map((e) => {
  let a = mesDe(e.ini);
  let b = mesDe(e.fim);
  if (a < 0) a = String(e.ini) < MESES[0] ? 0 : MESES.length - 1;
  if (b < 0) b = String(e.fim) < MESES[0] ? 0 : MESES.length - 1;
  const cs = String(e.cs || '').split(',').filter((x) => x !== '').map((x) => comDoMes(x)).filter((x) => x >= 0);
  return [a, b, num(e.wm) || 0, cs];
});
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
  mes_sem_canal: 'grupo(s) do mensal sem canal — não aparecem com filtro de canal',
  veiculo_sem_categoria: 'veículo(s) com categoria fora da lista — contam como Não informada',
  mes_sem_categoria: 'grupo(s) do mensal com categoria fora da lista — contam como Não informada'
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
  mes: { meses: MESES, wls: META.wls, comitentes: comMes.map((c) => c.nome), grupos: mesGrupos, loj: mesLoj, eventos: mesEventos,
    dias_max_evento: META.dias_max_evento, dias_acesso: mesDiasAcesso },
  metas: { dia: reindexa(metaDiaId, comIdx), mes: reindexa(metaMesId, comMesIdx) }
};
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
  const cat = vazio(F.cat) ? '' : String(F.cat);
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
  const nOk = (n) => evOk[n[0]] && (comit < 0 || n[2] === comit) && catOk(n);
  const NV = D.veics.length;
  const NL = D.lojas.length;
  const zeros = (k) => { const a = []; for (let i = 0; i < k; i++) a.push(0); return a; };
  const vAt = zeros(NV);
  const vNegs = [];
  const lLog = zeros(NL);
  const lAc = zeros(NL);
  const lOf = zeros(NL);
  const lCo = zeros(NL);
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
    const ve = !!s && s[3] <= d && (s[1] < 0 ? resp === '' : lojaOk[s[1]]);
    return {
      ac: X.ac[i].some((a) => lojaOk[a[1]] && (a[2] & m) !== 0),
      of: ve || X.of[i].some((o) => lojaOk[o[1]] && (!o[4] || (o[4] & m) !== 0)),
      ve: ve
    };
  };
  const metaDia = D.metas ? D.metas.dia : {};
  const somaMeta = (g, i, v, nv) => {
    const mm = metaDia[D.negs[i][2] + '|' + D.veics[v][7]];
    if (!mm) return;
    g.mt++; g.mo += mm[0]; g.mv += mm[1];
    if (nv) { g.mt_n++; g.mo_n += mm[0]; g.mv_n += mm[1]; }
  };
  const zeraMeta = (g) => Object.assign(g, { mt: 0, mo: 0, mv: 0, mt_n: 0, mo_n: 0, mv_n: 0 });
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
      somaMeta(g, i, v, nv);
      g.ativos++;
      if (nv) g.novos++;
      if (p.ac) { g.acesso++; if (nv) g.acesso_n++; }
      if (p.of) { g.oferta++; if (nv) g.oferta_n++; }
      if (p.ve) { g.venda++; if (nv) g.venda_n++; }
    }
  }
  const lojistas = dias.map((g) => ({ d: g.d, logaram: 0, acessaram: 0, ofertaram: 0, compraram: 0 }));
  const totLoj = { logaram: 0, acessaram: 0, ofertaram: 0, compraram: 0 };
  [['logaram', lLog], ['acessaram', lAc], ['ofertaram', lOf], ['compraram', lCo]].forEach((p) => {
    p[1].forEach((m) => {
      if (!m) return;
      totLoj[p[0]]++;
      for (let d = de; d <= ate; d++) if (bit(m, d)) lojistas[d - de][p[0]]++;
    });
  });
  const ref = ate;
  const ativoNoRef = (e) => e.d0 <= ref && ref <= e.d1;
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
  const evOkSemCom = D.eventos.map((e, i) => (!wl || e.wls.indexOf(wl) >= 0) && (ev < 0 || i === ev) && evCatOk(i));
  const comHoje = {};
  D.eventos.forEach((e, i) => { if (evOkSemCom[i] && ativoNoRef(e)) e.comits.forEach((c) => { comHoje[c] = 1; }); });
  const porComit = Object.keys(comHoje).map(Number).map((c) => Object.assign({ comit: c },
    cartoes((e, i) => evOkSemCom[i] && ativoNoRef(e) && e.comits.indexOf(c) >= 0, (n) => n[2] === c && catOk(n))))
    .filter((c) => c.veiculos > 0)
    .sort((a, b) => b.veiculos - a.veiculos || a.comit - b.comit);
  const evListaOk = D.eventos.map((e, i) => ativoNoRef(e) && (!wl || e.wls.indexOf(wl) >= 0) &&
    (comit < 0 || e.comits.indexOf(comit) >= 0) && evCatOk(i));
  const doComit = (n) => (comit < 0 || n[2] === comit) && catOk(n);
  const porEvento = [];
  evListaOk.forEach((ok, i) => {
    if (!ok) return;
    porEvento.push(Object.assign({ ev: i }, cartoes((e, j) => j === i, doComit)));
  });
  porEvento.sort((a, b) => b.veiculos - a.veiculos || (D.eventos[a.ev].fim < D.eventos[b.ev].fim ? -1 : 1));
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
      somaMeta(g, i, p.v, nv);
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
function calculaMes(D, F) {
  F = F || {};
  const M = D.mes;
  const N = M.meses.length;
  const vazio = (x) => x === undefined || x === null || x === '';
  const ref = vazio(F.mes) ? N - 1 : Number(F.mes);
  const wl = vazio(F.wl) ? 0 : Number(F.wl);
  const bitWl = wl ? (1 << M.wls.indexOf(wl)) : 0;
  const comit = vazio(F.comit) ? -1 : Number(F.comit);
  const cat = vazio(F.cat) ? '' : String(F.cat);
  const zero = (m) => ({ m: m, rot: M.meses[m], veiculos: 0, ativos: 0, novos: 0, acesso: 0, oferta: 0, venda: 0,
    acesso_n: 0, oferta_n: 0, venda_n: 0, sem_oferta: 0, com_oferta: 0, vmv: 0, vendidos: 0, removidos: 0, valor: 0,
    eventos: 0, comitentes: 0, mt: 0, mo: 0, mv: 0, mt_n: 0, mo_n: 0, mv_n: 0 });
  const metaMes = D.metas ? D.metas.mes : {};
  const serie = () => M.meses.map((r, m) => zero(m));
  const soma = (o, g) => {
    o.veiculos += g[3]; o.ativos += g[3]; o.novos += g[4];
    o.acesso += g[5]; o.oferta += g[6]; o.venda += g[7];
    o.acesso_n += g[8]; o.oferta_n += g[9]; o.venda_n += g[10];
    o.sem_oferta += g[11]; o.com_oferta += g[12]; o.vmv += g[13]; o.vendidos += g[14]; o.removidos += g[15];
    o.valor += g[16];
    const mm = metaMes[g[1] + '|' + g[17]];
    if (mm) {
      o.mt += g[3]; o.mo += g[3] * mm[0]; o.mv += g[3] * mm[1];
      o.mt_n += g[4]; o.mo_n += g[4] * mm[0]; o.mv_n += g[4] * mm[1];
    }
  };
  const meses = serie();
  const porC = {};
  const comNoMes = meses.map(() => ({}));
  M.grupos.forEach((g) => {
    if (bitWl && !(g[2] & bitWl)) return;
    if (cat && g[17] !== cat) return;
    const c = g[1];
    if (c >= 0) soma((porC[c] || (porC[c] = serie()))[g[0]], g);
    if (comit >= 0 && c !== comit) return;
    soma(meses[g[0]], g);
    if (c >= 0) comNoMes[g[0]][c] = 1;
  });
  meses.forEach((o, m) => { o.comitentes = Object.keys(comNoMes[m]).length; });
  M.eventos.forEach((e) => {
    if (bitWl && !(e[2] & bitWl)) return;
    for (let m = e[0]; m <= e[1]; m++) {
      if (comit < 0 || e[3].indexOf(comit) >= 0) meses[m].eventos++;
      e[3].forEach((c) => { if (porC[c]) porC[c][m].eventos++; });
    }
  });
  const lk = {};
  M.loj.forEach((r) => { lk[r[0] + '|' + r[1] + '|' + r[2]] = r; });
  meses.forEach((o, m) => {
    const r = lk[m + '|' + wl + '|' + comit];
    o.lojistas = { acessaram: r ? r[3] : 0, ofertaram: r ? r[4] : 0, compraram: r ? r[5] : 0 };
  });
  const HIST = 12;
  const porComit = Object.keys(porC).map(Number).filter((c) => porC[c][ref].veiculos > 0).map((c) => {
    const hist = [];
    for (let j = HIST - 1; j >= 0; j--) hist.push(ref - j >= 0 ? porC[c][ref - j] : null);
    return Object.assign({ comit: c }, porC[c][ref], { hist: hist, dia: porC[c][ref], dia_ant: ref > 0 ? porC[c][ref - 1] : null });
  }).sort((a, b) => b.veiculos - a.veiculos || a.comit - b.comit);
  return { ref: ref, meses: meses, kpi: meses[ref], ant: ref > 0 ? meses[ref - 1] : null, por_comit: porComit };
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
  const trilho = (x, m) => '<span class="trilho" aria-hidden="true"><i style="width:' +
    (x === null ? 0 : Math.max(0, Math.min(100, 100 * x))).toFixed(1) + '%"></i>' +
    (m === null || m === undefined ? '' : '<b class="marca-meta" style="left:' + Math.max(0, Math.min(99, 100 * m)).toFixed(1) + '%"></b>') + '</span>';
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
  const CATEGORIAS = [['L', 'Leves (motos inclusive)'], ['P', 'Pesados'], ['E', 'Equipamentos'], ['N', 'Não informada']];
  const EV_CATS = D.eventos.map(() => ({}));
  D.negs.forEach((n) => { EV_CATS[n[0]][D.veics[n[1]][7]] = 1; });
  const FM = { wl: '', comit: '', cat: '', mes: '' };
  const FILTROS_M = ['wl', 'comit', 'cat', 'mes'];
  let aba = 'dia';
  let kpi = 'oferta';
  let modo = 'todos';
  let busca = '';
  const PASSO = 100;
  const ordem = { veic: { k: 'lances', dir: -1 } };
  const TABELAS = {};
  function tabela(id, cols, linhas) {
    const lim = TABELAS[id] ? TABELAS[id].lim : PASSO;
    TABELAS[id] = { cols: cols, linhas: linhas, lim: lim };
    desenhaTabela(id);
  }
  function desenhaTabela(id) {
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
    const b = ev.target.closest('button.ord');
    if (!b) return;
    const id = b.getAttribute('data-t');
    const k = b.getAttribute('data-k');
    const t = TABELAS[id];
    const c = t.cols.find((x) => x.k === k);
    if (ordem[id].k === k) ordem[id].dir = -ordem[id].dir;
    else { ordem[id].k = k; ordem[id].dir = c.n ? -1 : 1; }
    desenhaTabela(id);
  });
  $('#mais-veic').addEventListener('click', () => {
    TABELAS.veic.lim += PASSO;
    desenhaTabela('veic');
  });
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
    const evs = [];
    D.eventos.forEach((e, i) => {
      if (F.wl && e.wls.indexOf(Number(F.wl)) < 0) return;
      if (F.comit !== '' && e.comits.indexOf(Number(F.comit)) < 0) return;
      if (F.cat !== '' && !EV_CATS[i][F.cat]) return;
      evs.push([String(i), e.nome + ' · ' + estado(e)]);
    });
    F.ev = opcoes('f-ev', evs, 'Todos os eventos (' + nf(evs.length) + ')', F.ev);
    F.resp = opcoes('f-resp', D.consultores.map((c, i) => [String(i), c]).concat([['nd', 'Não distribuído']]), 'Todos os responsáveis', F.resp);
    $('#f-resp').closest('.fg').hidden = !D.consultores.length;
    const dias = [];
    for (let d = 0; d <= D.hoje; d++) dias.push([String(d), rotDiaLongo(d)]);
    F.de = opcoes('f-de', dias, 'Desde ' + rotDia(0), F.de);
    F.ate = opcoes('f-ate', dias.slice().reverse(), 'Até hoje (' + rotDia(D.hoje) + ')', F.ate);
  }
  function contaFiltros() {
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
  [['f-m-wl', 'wl'], ['f-m-comit', 'comit'], ['f-m-cat', 'cat'], ['f-m-mes', 'mes']].forEach((p) => {
    $('#' + p[0]).addEventListener('change', (ev) => {
      FM[p[1]] = ev.target.value;
      renderMes();
    });
  });
  function alterna(id, valor) {
    document.querySelectorAll('#' + id + ' button').forEach((b) =>
      b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === valor)));
  }
  $('#seg-kpi').addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-v]');
    if (!b) return;
    kpi = b.getAttribute('data-v');
    alterna('seg-kpi', kpi);
    redesenhaIndicador();
  });
  $('#seg-modo').addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-v]');
    if (!b) return;
    modo = b.getAttribute('data-v');
    alterna('seg-modo', modo);
    redesenhaIndicador();
  });
  let esperaBusca = null;
  $('#busca').addEventListener('input', (ev) => {
    clearTimeout(esperaBusca);
    esperaBusca = setTimeout(() => {
      busca = ev.target.value.trim().toLowerCase();
      if (TABELAS.veic) TABELAS.veic.lim = PASSO;
      desenhaVeiculos();
    }, 160);
  });
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
  const STATUS_C = [['veiculos', 'Veículos'], ['com_oferta', 'Com oferta'],
    ['vmv', 'VMV atingido'], ['vendidos', 'Vendidos'], ['removidos', 'Removidos']];
  const baseDe = (g) => (g ? (modo === 'novos' ? g.novos : g.ativos) : 0);
  const acertoDe = (g) => (g ? (modo === 'novos' ? g[kpi + '_n'] : g[kpi]) : 0);
  const pctDe = (g) => (baseDe(g) ? acertoDe(g) / baseDe(g) : null);
  const CAMPO_META = { oferta: 'mo', venda: 'mv' };
  const metaDe = (g, k, todos) => {
    const c = CAMPO_META[k || kpi];
    if (!g || !c) return null;
    const f = !todos && modo === 'novos' ? '_n' : '';
    return g['mt' + f] ? g[c + f] / g['mt' + f] : null;
  };
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
  const difPP = (c) => {
    const a = pctDe(c.dia);
    const b = pctDe(c.dia_ant);
    return a === null || b === null ? null : Math.round(1000 * (a - b)) / 10;
  };
  const delta = (c, curto) => {
    const vs = curto ? '' : '<span class="dim"> vs ' + contraAnt() + '</span>';
    const d = difPP(c);
    if (d === null) return '<span class="dim">—</span>' + vs;
    const t = (d > 0 ? '+' : '') + d.toFixed(1).replace('.', ',') + ' p.p.';
    return '<span class="pp">' + (d > 0 ? '▲ ' : d < 0 ? '▼ ' : '') + t + '</span>' + vs;
  };
  const luzMeta = (g) => {
    const x = pctDe(g);
    const m = metaDe(g);
    return x === null || m === null ? '' : x >= m ? ' luz-sobe' : ' luz-desce';
  };
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
    const raio = 36;
    const volta = 2 * Math.PI * raio;
    const arco = x === null ? 0 : Math.max(0, Math.min(1, x)) * volta;
    return '<svg class="rosca" viewBox="0 0 88 88" aria-hidden="true">' +
      '<circle class="r-fundo" cx="44" cy="44" r="' + raio + '"/>' +
      (arco > 0 ? '<circle class="r-arco" cx="44" cy="44" r="' + raio + '" stroke-dasharray="' + arco.toFixed(2) + ' ' +
        volta.toFixed(2) + '" transform="rotate(-90 44 44)"/>' : '') +
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
  function cartaoComit(c, nome, sel, attr, rotLongo) {
      const marcado = sel === c.comit;
      const x = pctDe(c.dia);
      const m = metaDe(c.dia);
      const luz = luzMeta(c.dia);
      return '<button type="button" class="cartao comit' + luz + (sel !== null && !marcado ? ' apagado' : '') + '" ' + attr + '="' + c.comit + '"' +
        ' aria-pressed="' + marcado + '" aria-label="' + esc((marcado ? 'Tirar o filtro do comitente ' : 'Filtrar pelo comitente ') + nome) + '">' +
        '<span class="comit-topo"><span class="comit-nome">' + esc(nome) + '</span>' +
        '<span class="tag">' + nf(c.eventos) + (c.eventos === 1 ? ' evento' : ' eventos') + '</span></span>' +
        '<span class="comit-meio"><span class="comit-graf"><span class="comit-ind">' + esc(rotIndicador()) +
          (m === null ? '' : ' · meta ' + pc(m)) + '</span><span class="comit-minis">' +
          '<span class="mini m-rosca">' + rosca(x, m) + '</span>' +
          '<span class="mini m-sem">' + areaSemana(c.hist, rotLongo, m) + '</span></span>' +
          '<span class="comit-num"><b class="num">' + nf(acertoDe(c.dia)) + ' de ' + nf(baseDe(c.dia)) +
            (modo === 'novos' ? ' novos' : '') + '</b><span class="sep">·</span><span>' + delta(c, true) + '</span></span></span>' +
        '<span class="comit-st">' + STATUS_C.map((s) => '<span' + (s[0] === 'veiculos' ? ' class="tot"' : '') + '>' + s[1] +
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
      const luz = luzMeta(c.dia);
      return '<button type="button" class="lin' + luz + (marcado ? ' marcada' : '') + (sel !== null && !marcado ? ' apagado' : '') + '" data-e="' + c.ev + '"' +
        ' aria-pressed="' + marcado + '" aria-label="' + esc((marcado ? 'Tirar o filtro do evento ' : 'Filtrar pelo evento ') + e.nome) + '">' +
        '<span class="c-nome"><b title="' + esc(e.nome) + '">' + esc(e.nome) + '</b><span class="dim sub">' +
          esc(e.comits.map((j) => D.comitentes[j]).join(', ')) + ' · até ' + dt(e.fim) + '</span></span>' +
        STATUS_C.map((s) => '<span class="n num" data-r="' + s[1] + '">' + nf(c[s[0]]) + '</span>').join('') +
        '<span class="termo">' + trilho(x, m) + '<span class="pc num">' + (x === null ? '—' : pc(x)) + '</span>' +
          '<span class="de">' + delta(c, true) + '</span></span>' +
        '</button>';
    }).join('') : '<p class="dim">Nenhum evento ativo neste dia.</p>';
  }
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
  function desenhaVeiculos() {
    const linhasV = busca
      ? R.veiculos.filter((r) => (r.nome + ' ' + D.eventos[r.ev].nome + ' ' + (r.comit >= 0 ? D.comitentes[r.comit] : '')).toLowerCase().indexOf(busca) >= 0)
      : R.veiculos;
    $('#n-veic').textContent = nf(linhasV.length) + (linhasV.length === 1 ? ' veículo' : ' veículos');
    tabela('veic', [
      { k: 'nome', t: 'Veículo', h: (r) => {
        const vv = D.veics[r.v];
        const lk = linkDe(r);
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
        (r.comprador !== null ? '<span class="dim sub">' + esc(r.comprador >= 0 ? D.lojas[r.comprador][0] : 'comprador sem loja') +
          ' · ' + rs(r.venda) + '</span>' : '') }
    ], linhasV);
  }
  function metaCartao(id, x, m, g) {
    const el = $('#' + id + '-meta');
    el.hidden = m === null;
    el.innerHTML = m === null ? '' : 'Meta <b class="num">' + pc(m) + '</b> · ' + contraMeta(x, m);
    el.title = m === null ? '' : notaCobertura(g, true);
    $('#' + id + '-bar').innerHTML = trilho(x, m);
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
    [['co', 'com_oferta', [['ab', 'co_abertos'], ['an', 'co_analise'], ['en', 'co_encerrados']]],
      ['vm', 'vmv', [['ab', 'vm_abertos'], ['an', 'vm_analise'], ['en', 'vm_encerrados']]],
      ['vd', 'vendidos', [['ag', 'aguardando'], ['vd', 'vendido']]],
      ['rm', 'removidos', [['can', 'rem_cancelado'], ['sus', 'rem_suspenso']]]].forEach((s) => {
      $('#k-' + s[0]).textContent = nf(k[s[1]]);
      pcBar('#k-' + s[0] + '-pc', '#k-' + s[0] + '-bar', sobre(k[s[1]]), 'dos veículos');
      s[2].forEach((p) => { $('#k-' + s[0] + '-' + p[0]).textContent = nf(k[p[1]]); });
    });
    $('#k-vd-rs').textContent = rs(k.valor);
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
    $('#tot-lojistas').innerHTML = [['Acessaram', 'acessaram'], ['Ofertaram', 'ofertaram'], ['Compraram', 'compraram']]
      .map((p) => '<span>' + p[0] + ' no período <b class="num">' + nf(R.tot_lojistas[p[1]]) + '</b></span>').join('');
    desenhaVeiculos();
  }
  const NOME_MES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const ABREV_MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const MESES_D = D.mes.meses;
  const ULT_M = MESES_D.length - 1;
  const parcial = (m) => m === ULT_M ? ' (até ' + D.agora.slice(8, 10) + '/' + D.agora.slice(5, 7) + ')' : '';
  const rotMes = (m) => ABREV_MES[Number(MESES_D[m].slice(5, 7)) - 1] + '/' + MESES_D[m].slice(2, 4);
  const rotMesLongo = (m) => NOME_MES[Number(MESES_D[m].slice(5, 7)) - 1] + ' de ' + MESES_D[m].slice(0, 4) + parcial(m);
  let RM = null;
  const acIncompleto = (m) => D.mes.dias_acesso[m][0] < D.mes.dias_acesso[m][1];
  const rotMesEixo = (m) => rotMes(m) + (acIncompleto(m) ? ' ⚠' : '');
  const notaAc = (m) => (acIncompleto(m) ? 'acesso registrado em ' + D.mes.dias_acesso[m][0] + ' de ' + D.mes.dias_acesso[m][1] + ' dias' : '');
  function montaFiltrosMes() {
    FM.wl = opcoes('f-m-wl', D.canais.map((c) => [String(c[0]), c[1] + ' (' + c[0] + ')']), 'Todos os canais', FM.wl);
    FM.comit = opcoes('f-m-comit', D.mes.comitentes.map((c, i) => [String(i), c]), 'Todos os comitentes', FM.comit);
    FM.cat = opcoes('f-m-cat', CATEGORIAS, 'Todas as categorias', FM.cat);
    const ms = MESES_D.map((r, m) => [String(m), rotMesLongo(m)]).reverse();
    FM.mes = opcoes('f-m-mes', ms.slice(1), 'Mês corrente (' + rotMesLongo(ULT_M) + ')', FM.mes);
  }
  function desenhaMes() {
    const novos = modo === 'novos';
    const grupos = RM.meses.map((g) => {
      const base = novos ? g.novos : g.ativos;
      const hit = novos ? g[kpi + '_n'] : g[kpi];
      const linhaMes = (k2, nome) => {
        const h = novos ? g[k2 + '_n'] : g[k2];
        return '<br>' + esc(nome) + ': ' + nf(h) + ' (' + (base ? pc(h / base) : '—') + ')';
      };
      const mt = metaDe(g);
      return {
        rot: rotMesEixo(g.m),
        a: novos ? 0 : g.ativos - g.novos,
        b: g.novos,
        p: base ? hit / base : null,
        m: mt,
        dica: '<b>' + esc(rotMesLongo(g.m)) + '</b><br>' +
          (novos ? '' : '<span class="amostra serie-b"></span>Veículos ativos: ' + nf(g.ativos) + '<br>') +
          '<span class="amostra serie-a"></span>Novos: ' + nf(g.novos) +
          linhaMes('acesso', 'Com acesso') + linhaMes('oferta', 'Com oferta') + linhaMes('venda', 'Vendidos') +
          (mt === null ? '' : '<br><span class="amostra traco linha-meta"></span>Meta do ' + esc(KPI[kpi].linha) + ': ' + pc(mt) +
            (notaCobertura(g) ? '<br><span class="dim">' + esc(notaCobertura(g)) + '</span>' : '')) +
          (acIncompleto(g.m) ? '<br><span class="aviso-txt">⚠ ' + esc(notaAc(g.m)) + ': com acesso a menos</span>' : '')
      };
    });
    $('#leg-meta-m').hidden = !grupos.some((g) => g.m !== null);
    $('#leg-a-m').hidden = novos;
    $('#leg-linha-m').textContent = KPI[kpi].linha + (novos ? ' dos novos' : '');
    combo($('#g-ativos-m'), grupos);
    const sel = FM.comit === '' ? null : Number(FM.comit);
    $('#comit-rot-m').textContent = 'Comitentes com evento em ' + rotMesLongo(RM.ref) + ' · clique para filtrar';
    $('#comit-nota-m').textContent = rotIndicador() + ': o mês na rosca, os 12 meses até ele na linha (meta tracejada), e a diferença para ' +
      (RM.ref > 0 ? rotMesLongo(RM.ref - 1) : 'o mês anterior') + ' · verde na meta ou acima, vermelho abaixo';
    $('#g-comit-m').innerHTML = RM.por_comit.length
      ? RM.por_comit.map((c) => cartaoComit(c, D.mes.comitentes[c.comit], sel, 'data-cm', (g) => rotMesLongo(g.m))).join('')
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
    [['co', 'com_oferta'], ['vm', 'vmv'], ['vd', 'vendidos'], ['rm', 'removidos']].forEach((s) => {
      $('#km-' + s[0]).textContent = nf(k[s[1]]);
      const x = sobre(k[s[1]]);
      $('#km-' + s[0] + '-pc').textContent = x === null ? '—' : pc(x) + ' dos veículos';
      $('#km-' + s[0] + '-bar').innerHTML = trilho(x);
      $('#km-' + s[0] + '-ant').textContent = a ? nf(a[s[1]]) + (a.veiculos ? ' · ' + pc(a[s[1]] / a.veiculos) : '') : '—';
    });
    $('#km-vd-rs').textContent = rs(k.valor);
    metaCartao('km-co', sobre(k.com_oferta), metaDe(k, 'oferta', true), k);
    metaCartao('km-vd', sobre(k.vendidos), metaDe(k, 'venda', true), k);
    desenhaMes();
    $('#n-ativos-m').textContent = '12 meses';
    const inc = MESES_D.map((r, m) => (acIncompleto(m) && m !== ULT_M ? rotMes(m) + ' (' + notaAc(m) + ')' : null)).filter((x) => x);
    const txtInc = inc.length ? '⚠ O registro de acessos tem buraco em ' + inc.join(', ') + ': nesses meses, com acesso e lojistas que acessaram saem a menos.' : '';
    $('#nota-ac-m').textContent = txtInc;
    $('#nota-ac-m').hidden = !txtInc;
    const txtCat = FM.cat ? 'Os lojistas e os eventos do mês não seguem o filtro de categoria: vêm contados do banco por canal e comitente.' : '';
    $('#nota-ac-lm').textContent = [txtInc, txtCat].filter((x) => x).join(' ');
    $('#nota-ac-lm').hidden = !txtInc && !txtCat;
    linhas($('#g-lojistas-m'), RM.meses.map((g) => Object.assign({ rot: rotMesEixo(g.m),
      longo: rotMesLongo(g.m) + (acIncompleto(g.m) ? ' · ⚠ ' + notaAc(g.m) : '') }, g.lojistas)), [
      { k: 'acessaram', nome: 'Acessaram', cls: 's-ac' },
      { k: 'ofertaram', nome: 'Ofertaram', cls: 's-of' },
      { k: 'compraram', nome: 'Compraram', cls: 's-co' }
    ]);
    $('#n-lojistas-m').textContent = nf(k.lojistas.acessaram) + ' lojas acessaram em ' + rotMes(RM.ref);
    $('#tot-lojistas-m').innerHTML = [['Acessaram', 'acessaram'], ['Ofertaram', 'ofertaram'], ['Compraram', 'compraram']]
      .map((p) => '<span>' + p[0] + ' em ' + esc(rotMes(RM.ref)) + ' <b class="num">' + nf(k.lojistas[p[1]]) + '</b></span>').join('');
  }
  $('#g-comit-m').addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-cm]');
    if (!b) return;
    const c = b.getAttribute('data-cm');
    FM.comit = FM.comit === c ? '' : c;
    montaFiltrosMes();
    renderMes();
  });
  function trocaAba(a2) {
    aba = a2;
    alterna('seg-aba', aba);
    $('#v-dia').hidden = aba !== 'dia';
    $('#v-mes').hidden = aba !== 'mes';
    $('#fil-dia').hidden = aba !== 'dia';
    $('#fil-mes').hidden = aba !== 'mes';
    if (aba === 'mes') renderMes(); else render();
  }
  $('#seg-aba').addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-v]');
    if (b && b.getAttribute('data-v') !== aba) trocaAba(b.getAttribute('data-v'));
  });
  function redesenhaIndicador() {
    if (aba === 'mes') { desenhaMes(); return; }
    desenhaAtivos();
    desenhaComitentes();
    desenhaEventos();
  }
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
  $('#gloss-lista').innerHTML = D.glossario.map((g) =>
    '<dt>' + esc(g[0]) + '</dt><dd>' + esc(g[1]) + '</dd>').join('');
  $('#gloss-n').textContent = D.glossario.length + ' termos';
  $('#gerado').textContent = dt(D.agora);
  $('#base').textContent = nf(D.eventos.length) + ' eventos dos canais ' + D.canais.map((c) => c[0]).join(', ') +
    ' com fim desde ' + rotDia(0) + '/' + D.piso_dia.slice(0, 4) +
    (D.carteira_em ? ' · carteira comercial de ' + D.carteira_em.slice(8, 10) + '/' + D.carteira_em.slice(5, 7) + '/' + D.carteira_em.slice(0, 4) : '');
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
  render();
}
const nomesCanais = DADOS.canais.map((c) => c[1] + ' (' + c[0] + ')').join(', ');
DADOS.glossario = [
  ['Evento no painel', 'Evento que alveja algum dos canais ' + nomesCanais + ', que já abriu as ofertas e termina a partir de ' +
    META.dias + ' dias atrás: os ativos e os encerrados recentes. Agendado, com as ofertas ainda fechadas, não entra.'],
  ['Filtros', 'Na aba lateral. Canal, comitente, categoria e evento recortam os veículos, e tudo que nasce deles acompanha. Categoria: Leves (motos inclusive), Pesados, Equipamentos ou Não informada, a do cadastro do veículo; no Mensal, os eventos e os lojistas do mês não a seguem (vêm contados do banco sem ela). Responsável recorta as lojas. Data escolhe os dias dos gráficos e da tabela, e o dia dos cartões.'],
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
  ['Meta', 'Do % com oferta e do % vendidos, por comitente e categoria (Leves, motos inclusive; Pesados; Equipamentos; Não informada), da planilha de metas no SharePoint: a aba Média diária vale para o Diário e a Média mensal para o Mensal. Cada uma nasce com a média dos 12 meses fechados e pode ser mudada à mão. A meta de um recorte é a média das metas dos veículos dele — cada veículo leva a do seu comitente e categoria —, então muda com o perfil dos veículos do dia. Aparece no cartão (linha e traço no trilho), tracejada no gráfico e como traço na rosca do comitente. Com acesso não tem meta. Veículo de comitente ou categoria fora da planilha fica sem meta, e o balão diz quantos.'],
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
  ['Visão Mensal', 'As abas Diário e Mensal, no canto do cabeçalho, trocam para os últimos 12 meses: o mês corrente, até hoje, e os 11 anteriores. Os mesmos cartões, os cartões por comitente e os dois gráficos, em meses. Sem a lista de eventos e sem a tabela de veículos. Indicador e Todos/Novos valem para as duas visões.'],
  ['Evento no mensal', 'O mesmo recorte de canais, ativo em algum dia do mês. Evento com mais de ' + META.dias_max_evento + ' dias de ofertas fica fora: é depósito de anúncios, não evento (o "Anúncios cancelados", aberto de 2021 a dezembro de 2025, sozinho quintuplicava dezembro).'],
  ['Veículo no mês', 'Veículo distinto com negociação num evento ativo no mês. Novo no mês: estreou no mês. O status é o da negociação no evento mais recente dele no mês, no mesmo funil do diário (Com oferta e VMV atingido acumulam os de depois); nos meses fechados, é o desfecho. O comitente é o dessa negociação.'],
  ['% no mês', 'Dos veículos ativos no mês, quantos já tiveram o anúncio aberto, receberam lance ou foram vendidos no evento — a negociação do evento mais recente dele no mês, como nos cartões. Com oferta e vendidos são os mesmos números dos cartões do mês.'],
  ['Cartões por comitente no mês', 'Como no diário, para o mês escolhido no filtro Mês: a rosca é o indicador no mês, a área mostra os 12 meses até ele e a diferença em p.p. é contra o mês anterior.'],
  ['Lojistas por mês', 'Lojas distintas no mês que abriram anúncio, deram lance ou compraram nos eventos do recorte. Uma loja ativa no mês inteiro conta uma vez. Embaixo, os números do mês escolhido.']
];
const CSS_PAINEL = [
  ':root{--serie-2:#748290;--farol-abaixo:#946200}',
  '[data-tema="escuro"]{--serie-2:#646E86;--farol-abaixo:#E3B341}',
  ':root,[data-tema="escuro"]{--atencao:var(--farol-abaixo)}',
  '[data-tema="escuro"]{--texto:#F3F5FA;--texto-2:#C0C6D4;--texto-3:#8E95A8}',
  '[hidden]{display:none!important}',
  '#dica-lk{position:fixed;z-index:50;left:50%;bottom:20px;transform:translateX(-50%);width:max-content;max-width:min(640px,92vw);',
  'background:var(--superficie);border:1px solid var(--borda);border-radius:10px;padding:10px 14px;box-shadow:0 6px 24px rgba(0,0,0,.18);font-size:13px}',
  '#dica-lk .lk-url{display:block;margin-top:4px;word-break:break-all;user-select:all}',
  '#dica-g{position:fixed;z-index:40;width:max-content;max-width:min(320px,92vw);background:var(--superficie);',
  'color:var(--texto);border:1px solid var(--borda-forte);border-radius:var(--r-p);box-shadow:var(--sombra);',
  'padding:8px 10px;font-size:12px;line-height:1.5;pointer-events:none;font-variant-numeric:tabular-nums}',
  '.kpi-pc{display:flex;flex-direction:column;gap:5px;margin-top:2px}',
  '.kpi-pc .txt{font-size:11.5px;font-weight:600;color:var(--texto-2)}',
  '.trilho{display:block;height:6px;border-radius:3px;background:var(--acento-veu);overflow:hidden;min-width:40px}',
  '.trilho i{display:block;height:100%;border-radius:3px;background:var(--acento-cheio)}',
  '.trilho{position:relative}.trilho .marca-meta{position:absolute;top:0;bottom:0;width:2px;margin-left:-1px;background:var(--texto)}',
  '.meta-txt{font-size:11.5px;color:var(--texto-2)}.meta-txt b{color:var(--texto)}',
  '.g4.g5{grid-template-columns:repeat(5,minmax(0,1fr))}',
  '@media (max-width:1400px){.g4.g5{grid-template-columns:repeat(3,minmax(0,1fr))}}',
  '@media (max-width:900px){.g4.g5{grid-template-columns:repeat(2,minmax(0,1fr))}}',
  '@media (max-width:620px){.g4.g5{grid-template-columns:1fr}}',
  '.barra-ind{display:flex;justify-content:flex-start;align-items:center;gap:8px 16px;flex-wrap:wrap}',
  '.barra-ind .canto-tema{margin-left:auto}',
  '.grupo-ind{display:flex;align-items:center;gap:8px 10px;flex-wrap:wrap}',
  '.rot-ind{font-size:12px;font-weight:600;color:var(--texto-2)}.nota-ind{font-size:12px;color:var(--texto-2)}',
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
  '.mini.m-rosca{flex:1 1 0;max-width:110px}',
  '.rosca{width:100%;height:auto;display:block}',
  '.rosca .r-fundo{fill:none;stroke:var(--acento-veu);stroke-width:6}',
  '.rosca .r-arco{fill:none;stroke:var(--acento-cheio);stroke-width:6;stroke-linecap:round}',
  '.rosca .r-meta{stroke:var(--texto);stroke-width:2;stroke-linecap:round}',
  '.semana .s-meta{fill:none;stroke:var(--texto-2);stroke-width:1.25;stroke-dasharray:3 3}',
  '.pp{color:var(--texto-2)}',
  '.rosca .r-pc{font-size:14px;font-weight:700;fill:var(--texto);font-variant-numeric:tabular-nums}',
  'button.cartao.comit > .comit-meio{display:grid;grid-template-columns:3fr 2fr;gap:14px;align-items:center}',
  '.comit-graf{display:flex;flex-direction:column;align-items:center;gap:6px;min-width:0}',
  '.comit-minis{display:flex;align-items:flex-end;justify-content:center;gap:6px;width:100%}',
  '.mini{display:flex;flex-direction:column;align-items:center;gap:3px;min-width:0}',
  '.comit-ind{font-size:11.5px;font-weight:600;color:var(--texto-2);text-align:center;white-space:nowrap}',
  'button.cartao.comit.luz-sobe{--brilho:radial-gradient(420px 220px at 0% 0%,color-mix(in srgb,var(--positivo) 24%,transparent),transparent 72%)}',
  'button.cartao.comit.luz-desce{--brilho:radial-gradient(420px 220px at 0% 0%,color-mix(in srgb,var(--negativo) 24%,transparent),transparent 72%)}',
  '.mini.m-sem{flex:1 1 0;max-width:150px}',
  '.semana{width:100%;height:auto;display:block;overflow:visible}',
  '.semana .s-base{stroke:var(--borda-forte);stroke-width:1}',
  '.semana .s-area{fill:var(--acento-cheio);fill-opacity:.22;stroke:none}',
  '.semana .s-linha{fill:none;stroke:var(--acento-cheio);stroke-width:2;stroke-linejoin:round;stroke-linecap:round}',
  '.semana .s-hoje{fill:var(--acento-cheio);stroke:var(--superficie);stroke-width:1.5}',
  '.semana .s-alvo{fill:transparent}.semana .s-alvo:hover{fill:var(--acento-veu)}',
  '.comit-num{display:flex;align-items:baseline;justify-content:center;gap:5px;white-space:nowrap;font-size:11.5px;color:var(--texto-2)}',
  '.comit-num .sep{color:var(--texto-3)}',
  '.comit-num b{font-size:12.5px;color:var(--texto);font-weight:650}',
  '.comit-st{min-width:0;display:grid;gap:4px;font-size:12px;color:var(--texto-2)}',
  '.comit-st > span{display:flex;justify-content:space-between;gap:8px;white-space:nowrap}',
  '.comit-st b{color:var(--texto);font-weight:650}',
  '.comit-st .tot{color:var(--texto);font-weight:600;border-bottom:1px solid var(--borda);padding-bottom:4px;margin-bottom:1px}',
  '.comit-rodape{font-size:11px;color:var(--texto-3);border-top:1px solid var(--borda);padding-top:7px}',
  '.comit-rodape b{color:var(--texto-2);font-weight:650}',
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
  'button.lin.luz-sobe{background-image:radial-gradient(320px 70px at 0% 50%,color-mix(in srgb,var(--positivo) 22%,transparent),transparent 75%)}',
  'button.lin.luz-desce{background-image:radial-gradient(320px 70px at 0% 50%,color-mix(in srgb,var(--negativo) 22%,transparent),transparent 75%)}',
  'button.comit.luz-sobe .r-arco,button.comit.luz-sobe .s-linha{stroke:var(--positivo)}',
  'button.comit.luz-sobe .s-area,button.comit.luz-sobe .s-hoje{fill:var(--positivo)}',
  'button.comit.luz-desce .r-arco,button.comit.luz-desce .s-linha{stroke:var(--negativo)}',
  'button.comit.luz-desce .s-area,button.comit.luz-desce .s-hoje{fill:var(--negativo)}',
  'button.lin.luz-sobe .termo .trilho i{background:var(--positivo)}',
  'button.lin.luz-desce .termo .trilho i{background:var(--negativo)}',
  'button.lin.apagado{opacity:.5}button.lin.apagado:hover{opacity:.85}',
  '.c-nome{min-width:0}.c-nome b{display:block;font-weight:650;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
  '.termo{display:grid;grid-template-columns:minmax(60px,1fr) 52px 84px;align-items:center;gap:10px;min-width:0}',
  '.termo .trilho{height:8px;border-radius:4px;min-width:0}',
  '.termo .pc{font-weight:700;text-align:right}.termo .de{font-size:11px;white-space:nowrap;text-align:right}',
  '.lista-ev .clique{font-size:11.5px}',
  '.lista-ev > .rolo-ev{padding:0 18px 12px}',
  '@media (max-width:900px){.rolo-ev .cab{display:none}',
  '.lin{grid-template-columns:repeat(3,minmax(0,1fr));gap:6px 10px}',
  '.lin .c-nome,.lin .termo{grid-column:1 / -1}.lin .termo{order:-1}.lin .c-nome{order:-2}',
  '.lin .n{text-align:left;font-weight:650}.lin .n::before{content:attr(data-r);display:block;font-size:10.5px;font-weight:500;color:var(--texto-3)}}',
  '@media (max-width:620px){.g-comit{grid-template-columns:none;grid-auto-flow:column;grid-auto-columns:86%;',
  'overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:4px}.g-comit > .comit{scroll-snap-align:start}',
  'button.cartao.comit > .comit-meio{grid-template-columns:1fr}}',
  '.seg{display:inline-flex;padding:2px;gap:2px;border-radius:var(--r-p);background:var(--superficie-2);border:1px solid var(--borda)}',
  '.seg button{font:inherit;font-size:12px;font-weight:600;color:var(--texto-2);background:transparent;border:0;',
  'border-radius:8px;padding:5px 10px;cursor:pointer}',
  '.seg button[aria-pressed="true"]{background:var(--acento);color:var(--superficie)}',
  '.seg button:focus-visible{outline:2px solid var(--acento);outline-offset:1px}',
  '.cartao-topo{flex-wrap:wrap}',
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
  '.legenda{display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:var(--texto-2);margin:0 0 8px}',
  '.amostra{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:6px;vertical-align:-1px}',
  '.amostra.traco{height:3px;border-radius:2px;vertical-align:2px;width:14px}',
  '.graf .serie-a,.amostra.serie-a{fill:var(--acento-cheio);background:var(--acento-cheio)}',
  '.graf .serie-b,.amostra.serie-b{fill:var(--serie-2);background:var(--serie-2)}',
  '.graf .linha-kpi{fill:none;stroke:var(--texto);stroke-width:2.25;stroke-linejoin:round;stroke-linecap:round}',
  '.graf .ponto-kpi{fill:var(--texto)}.amostra.linha-kpi{background:var(--texto)}',
  '.graf .linha-meta{fill:none;stroke:var(--texto-2);stroke-width:1.75;stroke-dasharray:5 4;stroke-linecap:round}',
  '.amostra.linha-meta{background:repeating-linear-gradient(90deg,var(--texto-2) 0 5px,transparent 5px 8px)}',
  '.graf .eixo-p{fill:var(--texto-2)}',
  '.graf .linha-grade.forte{stroke:var(--borda-forte)}',
  '.graf .linha{fill:none;stroke-width:2.25;stroke-linejoin:round;stroke-linecap:round}',
  '.graf .rot-p text{font-size:10.5px;font-weight:700;fill:var(--texto);font-variant-numeric:tabular-nums;pointer-events:none}',
  '.graf .rot-p rect{pointer-events:none;fill-opacity:.28;stroke:none}',
  '.graf .rot-p.s-ac rect{fill:var(--texto)}.graf .rot-p.s-of rect{fill:var(--acento-cheio)}.graf .rot-p.s-co rect{fill:var(--positivo)}',
  '.graf .linha.s-ac{stroke:var(--texto)}.graf .ponto.s-ac,.amostra.s-ac{fill:var(--texto);background:var(--texto)}',
  '.graf .linha.s-of{stroke:var(--acento-cheio)}.graf .ponto.s-of,.amostra.s-of{fill:var(--acento-cheio);background:var(--acento-cheio)}',
  '.graf .linha.s-co{stroke:var(--positivo)}.graf .ponto.s-co,.amostra.s-co{fill:var(--positivo);background:var(--positivo)}',
  '.graf .alvo{fill:transparent;cursor:default}.graf .alvo:hover,.graf .alvo:focus{fill:var(--acento-veu);outline:none}',
  '.caixa-g{width:100%;min-height:280px}.caixa-g > svg{display:block;width:100%;height:auto}',
  '.tot{display:flex;gap:18px;flex-wrap:wrap;font-size:12px;color:var(--texto-2);margin-top:10px}',
  '.tot b{color:var(--texto);font-weight:650;margin-left:4px}',
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
  oferta: '<path d="M12 3v18M17 7H9.5a3 3 0 000 6h5a3 3 0 010 6H6"/>',
  alvo: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  grafico: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  pessoa: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>',
  lista: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  filtros: '<path d="M3 5h18M6 12h12M10 19h4"/>',
  gloss: '<path d="M4 19V5a2 2 0 012-2h13v18H6a2 2 0 01-2-2z"/><path d="M4 19a2 2 0 012-2h13"/>'
};
const chip = (k) => '<span class="chip" aria-hidden="true"><svg viewBox="0 0 24 24">' + ICONE[k] + '</svg></span>';
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
const dadosJs = JSON.stringify(DADOS).split('<').join(String.fromCharCode(92) + 'u003c');
const logoJs = JSON.stringify(LOGO);
const html = '<!doctype html><html lang="pt-BR" data-tema="escuro"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width, initial-scale=1">' +
  '<title>Painel de Eventos — Cars2You</title><style>' + CSS_TEMA + CSS_PAINEL + '</style></head><body>' +
  '<header class="topo"><div class="topo-in">' +
  '<span class="marca"><img class="logo logo-extensa" id="logo" src="" alt="Cars2You">' +
  '<img class="logo logo-curta" id="logo-curta" src="" alt="Cars2You"></span>' +
  '<div class="topo-tit"><h1>Painel de Eventos</h1></div>' +
  '<div class="topo-acoes">' +
  seg('seg-aba', 'Visão', [['dia', 'Diário'], ['mes', 'Mensal']], 'dia') +
  '</div></div></header><div id="dica-g" hidden></div><div id="dica-lk" hidden></div>' +
  '<button id="aba" class="aba" type="button" aria-expanded="false" aria-controls="gaveta">' +
  '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICONE.filtros + '</svg><span class="rot">Filtros</span>' +
  '<span class="n" id="aba-n" hidden></span></button>' +
  '<div id="veu" class="veu" hidden></div>' +
  '<aside id="gaveta" class="gaveta" aria-label="Filtros"><div class="cartao">' +
  '<div class="cartao-topo">' + chip('filtros') + '<h2>Filtros</h2>' +
  '<button id="fecha" class="fechar" type="button" aria-label="Fechar filtros">×</button></div>' +
  '<div class="filtros" id="fil-dia">' +
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
  '<div class="filtros" id="fil-mes" hidden>' +
  filtro('f-m-wl', 'Whitelabel') +
  filtro('f-m-comit', 'Comitente') +
  filtro('f-m-cat', 'Categoria') +
  filtro('f-m-mes', 'Mês dos cartões') +
  '<p class="nota"><b>Whitelabel</b> e <b>comitente</b> recortam os veículos e as lojas. <b>Mês</b> escolhe o mês dos cartões; ' +
  'os gráficos mostram sempre os 12 meses. No mensal não há filtro de evento, de responsável nem de data.</p>' +
  '</div>' +
  '<div class="filtros"><div class="fg"><button class="ctrl" id="limpar" type="button">Limpar filtros</button></div></div>' +
  '</div></aside>' +
  '<main class="area">' +
  '<div class="barra-ind"><span class="grupo-ind"><span class="rot-ind" id="seg-kpi-rot">Indicador</span>' +
  seg('seg-kpi', 'Indicador', [['acesso', 'Com acesso'], ['oferta', 'Com oferta'], ['venda', 'Vendidos']], 'oferta') + '</span>' +
  '<span class="grupo-ind"><span class="rot-ind" id="seg-modo-rot">Veículos</span>' +
  seg('seg-modo', 'Veículos', [['todos', 'Todos'], ['novos', 'Novos']], 'todos') + '</span>' +
  '<span class="grupo-ind canto-tema">' +
  '<button class="ctrl so-icone" id="b-tema" type="button" aria-label="Mudar o tema"></button></span></div>' +
  '<div id="v-dia">' +
  '<section class="g4 g5" aria-label="Eventos ativos no dia">' +
  kpiCard('evento', 'Eventos ativos hoje', 'k-ev', '<div class="kpi-pc"><span class="txt" id="k-ev-dia">—</span></div>',
    [['Veículos', 'k-ev-veic'], ['Comitentes', 'k-ev-com']], 'k-ev-rot') +
  kpiCard('oferta', 'Com oferta', 'k-co', meioPc('k-co-pc', 'k-co-bar', 'k-co-meta'),
    [['Abertos', 'k-co-ab'], ['Em análise', 'k-co-an'], ['Encerrados', 'k-co-en']]) +
  kpiCard('alvo', 'VMV atingido', 'k-vm', meioPc('k-vm-pc', 'k-vm-bar'),
    [['Abertos', 'k-vm-ab'], ['Em análise', 'k-vm-an'], ['Encerrados', 'k-vm-en']]) +
  kpiCard('vendido', 'Vendidos', 'k-vd', meioPc('k-vd-pc', 'k-vd-bar', 'k-vd-meta'),
    [['Aguardando pgto.', 'k-vd-ag'], ['Vendido', 'k-vd-vd'], ['Valor', 'k-vd-rs']]) +
  kpiCard('removido', 'Removidos', 'k-rm', meioPc('k-rm-pc', 'k-rm-bar'),
    [['Cancelados', 'k-rm-can'], ['Suspensos', 'k-rm-sus']]) +
  '</section>' +
  '<section class="comitentes" aria-labelledby="comit-rot">' +
  '<div class="barra-comit"><span class="rot-comit" id="comit-rot">Comitentes com evento ativo hoje</span>' +
  '<span class="nota-comit" id="comit-nota"></span></div>' +
  '<div class="g-comit" id="g-comit"></div></section>' +
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
  '<div id="v-mes" hidden>' +
  '<section class="g4 g5" aria-label="Eventos e status no mês">' +
  kpiCard('evento', 'Eventos no mês', 'km-ev', '<div class="kpi-pc"><span class="txt" id="km-ev-mes">—</span></div>',
    [['Veículos', 'km-ev-veic'], ['Comitentes', 'km-ev-com']], 'km-ev-rot') +
  kpiCard('oferta', 'Com oferta', 'km-co', meioPc('km-co-pc', 'km-co-bar', 'km-co-meta'), [['Mês anterior', 'km-co-ant']]) +
  kpiCard('alvo', 'VMV atingido', 'km-vm', meioPc('km-vm-pc', 'km-vm-bar'), [['Mês anterior', 'km-vm-ant']]) +
  kpiCard('vendido', 'Vendidos', 'km-vd', meioPc('km-vd-pc', 'km-vd-bar', 'km-vd-meta'), [['Valor', 'km-vd-rs'], ['Mês anterior', 'km-vd-ant']]) +
  kpiCard('removido', 'Removidos', 'km-rm', meioPc('km-rm-pc', 'km-rm-bar'), [['Mês anterior', 'km-rm-ant']]) +
  '</section>' +
  '<section class="comitentes" aria-labelledby="comit-rot-m">' +
  '<div class="barra-comit"><span class="rot-comit" id="comit-rot-m">Comitentes com evento no mês</span>' +
  '<span class="nota-comit" id="comit-nota-m"></span></div>' +
  '<div class="g-comit" id="g-comit-m"></div></section>' +
  '<article class="cartao">' + topoCartao('grafico', 'Veículos ativos por mês', 'n-ativos-m') +
  '<div class="legenda"><span id="leg-a-m"><span class="amostra serie-b"></span>Já em evento antes</span>' +
  '<span><span class="amostra serie-a"></span>Novos no mês</span>' +
  '<span><span class="amostra traco linha-kpi"></span><span id="leg-linha-m">% com oferta</span> (eixo da direita)</span>' +
  '<span id="leg-meta-m" hidden><span class="amostra traco linha-meta"></span>Meta</span></div>' +
  '<div class="caixa-g" id="g-ativos-m" data-rot="Veículos ativos por mês, já em evento e novos, com o percentual do indicador escolhido"></div>' +
  '<p class="nota-ac" id="nota-ac-m" hidden></p></article>' +
  '<article class="cartao">' + topoCartao('pessoa', 'Lojistas por mês', 'n-lojistas-m') +
  '<div class="legenda">' +
  '<span><span class="amostra traco s-ac"></span>Acessaram</span>' +
  '<span><span class="amostra traco s-of"></span>Ofertaram</span>' +
  '<span><span class="amostra traco s-co"></span>Compraram</span></div>' +
  '<div class="caixa-g" id="g-lojistas-m" data-rot="Lojas distintas por mês que acessaram, ofertaram e compraram"></div>' +
  '<div class="tot" id="tot-lojistas-m"></div><p class="nota-ac" id="nota-ac-lm" hidden></p></article>' +
  '</div>' +
  '<details class="cartao gloss" id="gloss"><summary class="cartao-topo">' + chip('gloss') + '<h2>Glossário</h2>' +
  '<span class="dir"><span class="tag" id="gloss-n">—</span><span class="seta" aria-hidden="true">▾</span></span>' +
  '</summary><dl id="gloss-lista"></dl></details>' +
  '<p class="rodape">Atualizado em <span id="gerado">—</span> · <span id="base"></span></p>' +
  '</main><script>' +
  calcula.toString() + calculaMes.toString() + APP.toString() +
  'APP(' + dadosJs + ',' + logoJs + ');' +
  '</script></body></html>';
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
  meses: calculaMes(DADOS, {}).meses.map((g) => ({ mes: g.rot, eventos: g.eventos, veiculos: g.veiculos, novos: g.novos,
    acesso: g.acesso, oferta: g.oferta, venda: g.venda, sem_oferta: g.sem_oferta, com_oferta: g.com_oferta, vmv: g.vmv,
    vendidos: g.vendidos, removidos: g.removidos, valor: g.valor, comitentes: g.comitentes, lojistas: g.lojistas })),
  avisos: avisos,
  bytes_html: html.length
};
if (CSS_TEMA.length < 5000) throw new Error('CSS do tema nao injetado (rode _aplica-modelo.js)');
if (!LOGO.claro || !LOGO.escuro || !LOGO.claro.extensa || !LOGO.escuro.curta) throw new Error('logos nao injetadas (rode _aplica-modelo.js)');
return [{ json: { html: html, resumo: resumo } }];
