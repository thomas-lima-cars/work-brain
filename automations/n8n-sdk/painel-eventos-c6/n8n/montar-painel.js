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
  ' animation:none !important }}:root,[data-tema="claro"]{color-scheme: light;',
  '--marca-azul:       #242424;--marca-azul-claro: #242424;--fundo:          #DCDCDC;',
  '--fundo-veu:      radial-gradient(420px 300px at 0% -14%,rgba(255,255,255,.72), transparent 70%),radial-gradient(1200px 900px at 100% 100%,rgba(150,150,150,.45), transparent 66%);',
  '--superficie:     #FAFAFA;--superficie-2:   #EFEFEF;--borda:          #E6E6E6;',
  '--borda-forte:    #CCCCCC;--texto:          #242424;--texto-2:        #595959;',
  '--texto-3:        #737373;--acento:         #242424;--acento-cheio:   #242424;',
  '--acento-veu:     rgba(36,36,36,.08);--positivo:       #0C6E4B;--negativo:       #7F1112;',
  '--atencao:        #6F4047;--grade:          rgba(36,36,36,.07);',
  '--sombra:         0 1px 1px  rgba(24,24,24,.03),0 6px 16px rgba(24,24,24,.05),0 18px 44px rgba(24,24,24,.07),inset 0 1px 0 rgba(255,255,255,.85);',
  '--cartao-borda:   1px solid rgba(255,255,255,.72);',
  '--cartao-fundo:   linear-gradient(155deg, rgba(255,255,255,.82) 0%,rgba(255,255,255,.95) 58%);',
  '--cartao-blur:    blur(18px) saturate(100%);',
  '--brilho:         radial-gradient(420px 260px at 0% 0%,rgba(36,36,36,.09), transparent 72%);}',
  '[data-tema="escuro"]{color-scheme: dark;--marca-azul:       #D6D6D6;--marca-azul-claro: #D6D6D6;',
  '--fundo:          #111111;',
  '--fundo-veu:      radial-gradient(900px 500px at 8% -8%,rgba(255,255,255,.07), transparent 62%),radial-gradient(800px 500px at 96% 4%,rgba(255,255,255,.035), transparent 60%);',
  '--superficie:     #1A1A1A;--superficie-2:   #242424;--borda:          rgba(255,255,255,.09);',
  '--borda-forte:    rgba(255,255,255,.16);--texto:          #EDEDED;--texto-2:        #A8A8A8;',
  '--texto-3:        #767676;--acento:         #D6D6D6;--acento-cheio:   #D6D6D6;',
  '--acento-veu:     rgba(255,255,255,.10);--positivo:       #35C08A;--negativo:       #EF5B60;',
  '--atencao:        #C98A92;--grade:          rgba(255,255,255,.07);',
  '--sombra:         0 1px 1px rgba(0,0,0,.4), 0 16px 40px rgba(0,0,0,.45);',
  '--cartao-borda:   1px solid rgba(255,255,255,.08);',
  '--cartao-fundo:   linear-gradient(158deg, rgba(255,255,255,.075),rgba(255,255,255,.025));',
  '--cartao-blur:    blur(16px) saturate(100%);',
  '--brilho:         radial-gradient(420px 180px at 0% 0%,rgba(255,255,255,.07), transparent 70%);}'
].join('');
const LOGO = {
  claro: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDQuMDYiIGhlaWdodD0iMjMuNjciIHZpZXdCb3g9IjE3Ljg1IDE4LjA1IDQ0LjA2IDIzLjY3IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTMyLjg1NDIgMzMuNzQwOEMzMy42MDk0IDMzLjA5MjEgMzQuMTAyNiAzMi4yMzk5IDM0LjMzNDYgMzEuMTgzOUg0MS43OTU2QzQxLjQ1MjkgMzQuMjAwOSA0MC4yMTQ0IDM2LjY0NDYgMzguMDc5OSAzOC41MTUzQzM1Ljk0NTMgNDAuMzg1NiAzMy4zMTcxIDQxLjMyMDkgMzAuMTk2IDQxLjMyMDlDMjcuOTIwNSA0MS4zMjA5IDI1Ljg3MTMgNDAuODMwNyAyNC4wNDkgMzkuODUwM0MyMi4yMjY4IDM4Ljg2OTYgMjAuODA0MiAzNy41MDcgMTkuNzgyMyAzNS43NjIyQzE4Ljc2MDMgMzQuMDE3NSAxOC4yNDk1IDMyLjA1ODcgMTguMjQ5NSAyOS44ODY4QzE4LjI0OTUgMjcuNzE0NiAxOC43NjAzIDI1Ljc1NjIgMTkuNzgyMyAyNC4wMTEzQzIwLjgwNDIgMjIuMjY2NiAyMi4yMjY4IDIwLjkwNCAyNC4wNDkgMTkuOTIzNUMyNS44NzEzIDE4Ljk0MyAyNy45MjA1IDE4LjQ1MjggMzAuMTk2IDE4LjQ1MjhDMzMuMjY2OCAxOC40NTI4IDM1Ljg1OTkgMTkuMzU1NSAzNy45NzQ0IDIxLjE2MDVDNDAuMDg4NiAyMi45NjU3IDQxLjMzNzEgMjUuMzMxMiA0MS43MTk3IDI4LjI1NzdIMzQuMzY0NkMzNC4wNTIzIDI3LjI5MjIgMzMuNTE4NyAyNi41MTU0IDMyLjc2MzYgMjUuOTI3MUMzMi4wMDg4IDI1LjMzODcgMzEuMTYyOSAyNS4wNDQ2IDMwLjIyNiAyNS4wNDQ2QzI4LjkzNzIgMjUuMDQ0NiAyNy44OTc3IDI1LjQ4OTcgMjcuMTA3NCAyNi4zNzk2QzI2LjMxNjcgMjcuMjY5NyAyNS45MjE3IDI4LjQzODggMjUuOTIxNyAyOS44ODY4QzI1LjkyMTcgMzEuMzI0OSAyNi4zMTk0IDMyLjQ4ODggMjcuMTE0OSAzMy4zNzg3QzI3LjkxMDUgMzQuMjY4OCAyOC45NDczIDM0LjcxMzcgMzAuMjI2IDM0LjcxMzdDMzEuMjIyOSAzNC43MTM3IDMyLjA5OTEgMzQuMzg5NCAzMi44NTQyIDMzLjc0MDhaTTU5LjMzNDQgMjcuNzk1M0M2MC43ODM3IDI5LjE1ODEgNjEuNTA4NyAzMC45MiA2MS41MDg3IDMzLjA4MUM2MS41MDg3IDM1LjU1MDkgNjAuNjc0NiAzNy41NDE2IDU5LjAwNjcgMzkuMDUzNUM1Ny4zMzg1IDQwLjU2NTEgNTUuMTM5NyA0MS4zMjEgNTIuNDExMSA0MS4zMjFDNDkuNzE0NiA0MS4zMjEgNDcuNTIxMyA0MC41NjIyIDQ1LjgzMTkgMzkuMDQ1NEM0NC4xNDI0IDM3LjUyODEgNDMuMjk3OSAzNS41NjE2IDQzLjI5NzkgMzMuMTQ0N0M0My4yOTc5IDMxLjgyNDggNDMuNTI5OSAzMC40OTY4IDQzLjk5MzMgMjkuMTYwNkM0NC40NTcgMjcuODI0OSA0NS4xNzM3IDI2LjM2MzcgNDYuMTQzOCAyNC43NzcyTDQ5LjU3MzggMTkuMTg1MUw1Ni44MTk3IDE5LjE4MzVMNTIuNzYyOSAyNS43ODMzQzUzLjE2NzggMjUuNzYyIDUzLjQ4NzUgMjUuNzUxNCA1My43MjI1IDI1Ljc1MTRDNTYuMDEzOSAyNS43NTE0IDU3Ljg4NDMgMjYuNDMyNyA1OS4zMzQ0IDI3Ljc5NTNaTTU0LjQ0MiAzNS4xMDg5QzU0Ljk2MzggMzQuNTg3NSA1NS4yMjUxIDMzLjkxMTMgNTUuMjI1MSAzMy4wODFDNTUuMjI1MSAzMi4yNTA2IDU0Ljk2MzggMzEuNTY5MyA1NC40NDIgMzEuMDM2OUM1My45MTk2IDMwLjUwNDYgNTMuMjQyNiAzMC4yMzg1IDUyLjQxMTEgMzAuMjM4NUM1MS41Nzk5IDMwLjIzODUgNTAuOTAyNiAzMC41MDQ2IDUwLjM4MDkgMzEuMDM2OUM0OS44NTgzIDMxLjU2OTMgNDkuNTk3MSAzMi4yNTA2IDQ5LjU5NzEgMzMuMDgxQzQ5LjU5NzEgMzMuOTExMyA0OS44NTgzIDM0LjU4NzUgNTAuMzgwOSAzNS4xMDg5QzUwLjkwMjYgMzUuNjMwNyA1MS41Nzk5IDM1Ljg5MTQgNTIuNDExMSAzNS44OTE0QzUzLjI0MjYgMzUuODkxNCA1My45MTk2IDM1LjYzMDcgNTQuNDQyIDM1LjEwODlaIiBmaWxsPSIjMjQyNDI0Ii8+Cjwvc3ZnPgo=',
  escuro: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDQuMDYiIGhlaWdodD0iMjMuNjciIHZpZXdCb3g9IjE4LjA1IDE4LjA1IDQ0LjA2IDIzLjY3IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTMzLjA1NzIgMzMuNzQwOEMzMy44MTI0IDMzLjA5MjEgMzQuMzA1NiAzMi4yMzk5IDM0LjUzNzYgMzEuMTgzOUg0MS45OTg2QzQxLjY1NTkgMzQuMjAwOSA0MC40MTc0IDM2LjY0NDYgMzguMjgyOSAzOC41MTUzQzM2LjE0ODMgNDAuMzg1NiAzMy41MjAxIDQxLjMyMDkgMzAuMzk5IDQxLjMyMDlDMjguMTIzNSA0MS4zMjA5IDI2LjA3NDMgNDAuODMwNyAyNC4yNTIxIDM5Ljg1MDNDMjIuNDI5OCAzOC44Njk2IDIxLjAwNzIgMzcuNTA3IDE5Ljk4NTQgMzUuNzYyMkMxOC45NjMzIDM0LjAxNzUgMTguNDUyNSAzMi4wNTg3IDE4LjQ1MjUgMjkuODg2OEMxOC40NTI1IDI3LjcxNDYgMTguOTYzMyAyNS43NTYyIDE5Ljk4NTQgMjQuMDExM0MyMS4wMDcyIDIyLjI2NjYgMjIuNDI5OCAyMC45MDQgMjQuMjUyMSAxOS45MjM1QzI2LjA3NDMgMTguOTQzIDI4LjEyMzUgMTguNDUyOCAzMC4zOTkgMTguNDUyOEMzMy40Njk4IDE4LjQ1MjggMzYuMDYyOSAxOS4zNTU1IDM4LjE3NzQgMjEuMTYwNUM0MC4yOTE2IDIyLjk2NTcgNDEuNTQwMSAyNS4zMzEyIDQxLjkyMjcgMjguMjU3N0gzNC41Njc2QzM0LjI1NTQgMjcuMjkyMiAzMy43MjE3IDI2LjUxNTQgMzIuOTY2NiAyNS45MjcxQzMyLjIxMTggMjUuMzM4NyAzMS4zNjU5IDI1LjA0NDYgMzAuNDI5IDI1LjA0NDZDMjkuMTQwMiAyNS4wNDQ2IDI4LjEwMDcgMjUuNDg5NyAyNy4zMTA0IDI2LjM3OTZDMjYuNTE5NyAyNy4yNjk3IDI2LjEyNDcgMjguNDM4OCAyNi4xMjQ3IDI5Ljg4NjhDMjYuMTI0NyAzMS4zMjQ5IDI2LjUyMjQgMzIuNDg4OCAyNy4zMTggMzMuMzc4N0MyOC4xMTM1IDM0LjI2ODggMjkuMTUwMyAzNC43MTM3IDMwLjQyOSAzNC43MTM3QzMxLjQyNTkgMzQuNzEzNyAzMi4zMDIxIDM0LjM4OTQgMzMuMDU3MiAzMy43NDA4Wk01OS41Mzc0IDI3Ljc5NTNDNjAuOTg2NyAyOS4xNTgxIDYxLjcxMTcgMzAuOTIgNjEuNzExNyAzMy4wODFDNjEuNzExNyAzNS41NTA5IDYwLjg3NzYgMzcuNTQxNiA1OS4yMDk3IDM5LjA1MzVDNTcuNTQxNSA0MC41NjUxIDU1LjM0MjcgNDEuMzIxIDUyLjYxNDEgNDEuMzIxQzQ5LjkxNzYgNDEuMzIxIDQ3LjcyNDMgNDAuNTYyMiA0Ni4wMzQ5IDM5LjA0NTRDNDQuMzQ1NCAzNy41MjgxIDQzLjUwMDkgMzUuNTYxNiA0My41MDA5IDMzLjE0NDdDNDMuNTAwOSAzMS44MjQ4IDQzLjczMjkgMzAuNDk2OCA0NC4xOTYzIDI5LjE2MDZDNDQuNjYgMjcuODI0OSA0NS4zNzY3IDI2LjM2MzcgNDYuMzQ2OCAyNC43NzcyTDQ5Ljc3NjggMTkuMTg1MUw1Ny4wMjI3IDE5LjE4MzVMNTIuOTY1OSAyNS43ODMzQzUzLjM3MDggMjUuNzYyIDUzLjY5MDUgMjUuNzUxNCA1My45MjU1IDI1Ljc1MTRDNTYuMjE2OSAyNS43NTE0IDU4LjA4NzMgMjYuNDMyNyA1OS41Mzc0IDI3Ljc5NTNaTTU0LjY0NSAzNS4xMDg5QzU1LjE2NjggMzQuNTg3NSA1NS40MjgxIDMzLjkxMTMgNTUuNDI4MSAzMy4wODFDNTUuNDI4MSAzMi4yNTA2IDU1LjE2NjggMzEuNTY5MyA1NC42NDUgMzEuMDM2OUM1NC4xMjI2IDMwLjUwNDYgNTMuNDQ1NiAzMC4yMzg1IDUyLjYxNDEgMzAuMjM4NUM1MS43ODI5IDMwLjIzODUgNTEuMTA1NiAzMC41MDQ2IDUwLjU4MzkgMzEuMDM2OUM1MC4wNjEzIDMxLjU2OTMgNDkuODAwMSAzMi4yNTA2IDQ5LjgwMDEgMzMuMDgxQzQ5LjgwMDEgMzMuOTExMyA1MC4wNjEzIDM0LjU4NzUgNTAuNTgzOSAzNS4xMDg5QzUxLjEwNTYgMzUuNjMwNyA1MS43ODI5IDM1Ljg5MTQgNTIuNjE0MSAzNS44OTE0QzUzLjQ0NTYgMzUuODkxNCA1NC4xMjI2IDM1LjYzMDcgNTQuNjQ1IDM1LjEwODlaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K'
};
const VENDEDOR_C6 = 104754;
const WL_VITRINE_C6 = [43, 48];
const STATUS_VENDA = [2, 3, 7];
const PONTOS_VEICULO = 1;
const PONTOS_ARREMATE = 10;
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
  T[p.queryName] = linhas.map((arr) => {
    if (arr.length !== p.cols.length) {
      throw new Error(p.queryName + ': linha com ' + arr.length + ' colunas, esperadas ' + p.cols.length);
    }
    const o = {};
    p.cols.forEach((k, j) => { o[k] = arr[j]; });
    return o;
  });
});
const META = pedidos[0].meta;
const COL_CNPJ = 'NR_CNPJ';
const COL_REP = 'USUARIO_GP';
const SEM_REP = 'Sem Representante';
const MIN_LINHAS_PLANILHA = 1000;
const soDigitos = (v) => {
  const s = String(v === null || v === undefined ? '' : v);
  let d = '';
  for (let i = 0; i < s.length; i++) {
    const c = s.charAt(i);
    if (c >= '0' && c <= '9') d += c;
  }
  return d;
};
const cnpjDe = (v) => { const d = soDigitos(v); return d ? d.padStart(14, '0') : ''; };
const planilha = $('Ler Representantes').all().map((i) => i.json);
if (planilha.length === 1 && planilha[0] && planilha[0].error !== undefined) {
  throw new Error('A planilha de representantes nao veio: ' + JSON.stringify(planilha[0].error).slice(0, 200));
}
let temCnpj = false;
let temRep = false;
for (let i = 0; i < planilha.length && !(temCnpj && temRep); i++) {
  if (planilha[i][COL_CNPJ] !== undefined) temCnpj = true;
  if (planilha[i][COL_REP] !== undefined) temRep = true;
}
if (!temCnpj || !temRep) {
  throw new Error('A planilha de representantes veio sem as colunas ' + COL_CNPJ + ' (' + temCnpj +
    ') ou ' + COL_REP + ' (' + temRep + '). Foi reorganizada?');
}
if (planilha.length < MIN_LINHAS_PLANILHA) {
  throw new Error('A planilha de representantes tem so ' + planilha.length + ' linhas, abaixo do piso de ' +
    MIN_LINHAS_PLANILHA + ' — leitura truncada ou arquivo trocado.');
}
const votos = {};
planilha.forEach((l) => {
  const c = cnpjDe(l[COL_CNPJ]);
  if (c.length !== 14) return;
  if (!votos[c]) votos[c] = {};
  const rep = String(l[COL_REP] === null || l[COL_REP] === undefined ? '' : l[COL_REP]).trim();
  if (rep) votos[c][rep] = (votos[c][rep] || 0) + 1;
});
function representanteDo(cnpj) {
  if (!cnpj) return { rep: SEM_REP, motivo: 'sem_cnpj' };
  const v = votos[cnpj];
  if (!v) return { rep: SEM_REP, motivo: 'fora_planilha' };
  const reps = Object.keys(v).sort((a, b) => v[b] - v[a] || (a < b ? -1 : 1));
  if (!reps.length) return { rep: SEM_REP, motivo: 'vazio_planilha' };
  if (reps.length > 1 && v[reps[0]] === v[reps[1]]) return { rep: SEM_REP, motivo: 'empate' };
  return { rep: reps[0], motivo: reps.length > 1 ? 'maioria' : 'unico' };
}
const contaRep = { unico: 0, maioria: 0, empate: 0, fora_planilha: 0, vazio_planilha: 0, sem_cnpj: 0 };
const AGORA = META.agora_br;
const num = (x) => (x === null || x === undefined || x === '' ? null : Number(x));
const avisos = [];
const conta = {};
const marca = (chave) => { conta[chave] = (conta[chave] || 0) + 1; };
const eventos = T.eventos.map((e) => ({
  id: num(e.id), nome: e.nome, status: num(e.status), ini: e.ini, fim: e.fim,
  wls: String(e.wls || '').split(',').filter((x) => x !== '').map(Number)
})).sort((a, b) => (a.fim < b.fim ? 1 : a.fim > b.fim ? -1 : b.id - a.id));
const evPorId = {};
eventos.forEach((e) => { evPorId[e.id] = e; });
const ofertaPorId = {};
const ofertasDaNeg = {};
T.ofertas.forEach((o) => {
  const of = { id: num(o.id), neg: num(o.neg), loja: num(o.loja), valor: num(o.valor), quando: o.quando };
  ofertaPorId[of.id] = of;
  if (!ofertasDaNeg[of.neg]) ofertasDaNeg[of.neg] = [];
  ofertasDaNeg[of.neg].push(of);
});
const lojas = T.lojas.map((l) => {
  const r = representanteDo(cnpjDe(l.cnpj));
  contaRep[r.motivo]++;
  return {
    id: num(l.id), nome: l.nome, wl: num(l.wl), cadastro: l.cadastro,
    apagada: num(l.apagada) === 1, representante: r.rep
  };
});
const lojaPorId = {};
lojas.forEach((l) => { lojaPorId[l.id] = l; });
function linkAnuncio(v, wls) {
  const t = (x) => String(x === null || x === undefined ? '' : x).trim();
  const partes = [t(v.marca), t(v.modelo), t(v.versao)];
  const id = t(v.uuid).split('-').join('');
  if (!id || partes.some((p) => !p)) { marca('sem_link'); return null; }
  const soC6 = wls.length > 0 && wls.every((w) => WL_VITRINE_C6.indexOf(w) >= 0);
  if (!soC6) marca('link_padrao');
  return (soC6 ? 'https://compraveiculos.cars2you.com.br' : 'https://cars2you.com.br') +
    '/anuncio/veiculo/' + partes.map((p) => encodeURIComponent(p.toLowerCase())).join('/') + '/' + id;
}
const vistos = {};
const veiculos = [];
T.veiculos.forEach((r) => {
  const ev = evPorId[num(r.evento)];
  if (!ev) { marca('veiculo_sem_evento'); return; }
  const chave = ev.id + '|' + num(r.veiculo);
  if (vistos[chave]) marca('veiculo_repetido');
  vistos[chave] = 1;
  if (num(r.vendedor) !== VENDEDOR_C6) marca('outro_vendedor');
  if (num(r.anuncio_apagado) === 1) marca('anuncio_apagado');
  const ofs = ofertasDaNeg[num(r.neg)] || [];
  let ult = null;
  let maior = null;
  const lojasOf = {};
  ofs.forEach((o) => {
    if (!ult || o.id > ult.id) ult = o;
    if (!maior || o.valor > maior.valor) maior = o;
    if (o.loja !== null) lojasOf[o.loja] = 1;
  });
  const status = num(r.status);
  const vendido = STATUS_VENDA.indexOf(status) >= 0;
  const venc = vendido && r.vencedora !== null ? ofertaPorId[num(r.vencedora)] : null;
  if (vendido && !venc) marca('venda_sem_vencedora');
  const vmv = num(r.vmv);
  const fipe = num(r.fipe);
  const ref = venc ? venc.valor : (ult ? ult.valor : null);
  const razao = ref !== null && fipe ? ref / fipe : null;
  let farol = 'sem';
  if (maior) farol = vmv !== null && maior.valor >= vmv ? 'atingiu' : 'abaixo';
  const nomeVeic = [r.marca, r.modelo, r.versao].filter((x) => x).join(' ');
  veiculos.push({
    ev: ev.id, neg: num(r.neg), veiculo: num(r.veiculo),
    nome: nomeVeic || '(sem modelo)',
    ano: [r.ano_fab, r.ano_mod].filter((x) => x).join('/'),
    km: num(r.km), placa: r.placa || '', chassi: r.chassi || '',
    link: linkAnuncio(r, ev.wls),
    qtd: ofs.length, lojas_of: Object.keys(lojasOf).length,
    ult: ult ? ult.valor : null, ult_quando: ult ? ult.quando : null,
    maior: maior ? maior.valor : null,
    vmv: vmv, fipe: fipe,
    desagio: razao === null ? null : 1 - razao,
    fora_faixa: razao !== null && (razao < 0.2 || razao > 1.2),
    laudo: r.laudo || null,
    status: status, vendido: vendido,
    venda: venc ? venc.valor : null,
    arrematante: venc ? venc.loja : null,
    farol: farol
  });
});
const negEv = {};
veiculos.forEach((v) => { negEv[v.neg] = v.ev; });
const part = {};
const pega = (ev, loja) => {
  const k = ev + '|' + loja;
  if (!part[k]) part[k] = { ev: ev, loja: loja, negs: {}, lances: 0, arrem: 0, ult_ant: null };
  return part[k];
};
T.ofertas.forEach((o) => {
  const ev = negEv[num(o.neg)];
  const loja = num(o.loja);
  if (ev === undefined || loja === null) return;
  const p = pega(ev, loja);
  p.lances++;
  p.negs[num(o.neg)] = 1;
});
veiculos.forEach((v) => {
  if (v.arrematante !== null) pega(v.ev, v.arrematante).arrem++;
});
T.ult_anterior.forEach((u) => {
  const k = num(u.evento) + '|' + num(u.loja);
  if (part[k]) part[k].ult_ant = u.ult || null;
});
const participacao = Object.keys(part).map((k) => {
  const p = part[k];
  if (!lojaPorId[p.loja]) marca('loja_sem_cadastro');
  else {
    if (lojaPorId[p.loja].wl !== META.wl) marca('loja_outro_canal');
    if (lojaPorId[p.loja].apagada) marca('loja_apagada');
  }
  return [p.ev, p.loja, Object.keys(p.negs).length, p.lances, p.arrem, p.ult_ant];
});
const TEXTO_AVISO = {
  outro_vendedor: 'veículo(s) de loja vendedora diferente do C6 Bank Lojista (104754)',
  anuncio_apagado: 'veículo(s) com o anúncio apagado e a negociação ainda no evento',
  venda_sem_vencedora: 'venda(s) sem a oferta vencedora entre as ofertas do evento — sem arrematante',
  veiculo_repetido: 'veículo(s) com mais de uma negociação no mesmo evento',
  veiculo_sem_evento: 'veículo(s) fora dos eventos do recorte',
  sem_link: 'veículo(s) sem marca, modelo, versão ou identificador — sem link do anúncio',
  link_padrao: 'veículo(s) de evento que alveja outro canal além do C6 — link no cars2you.com.br',
  loja_sem_cadastro: 'loja(s) ofertante(s) sem cadastro na tabela de lojas',
  loja_outro_canal: 'loja(s) de outro canal ofertando no evento',
  loja_apagada: 'loja(s) apagada(s) que ofertaram',
  rep_maioria: 'loja(s) com mais de um representante para o mesmo CNPJ na planilha — ficou o que aparece em mais linhas',
  rep_empate: 'loja(s) com empate entre representantes para o mesmo CNPJ na planilha — ficaram Sem Representante',
  rep_sem_cnpj: 'loja(s) sem CNPJ no banco — ficaram Sem Representante'
};
if (contaRep.maioria) conta.rep_maioria = contaRep.maioria;
if (contaRep.empate) conta.rep_empate = contaRep.empate;
if (contaRep.sem_cnpj) conta.rep_sem_cnpj = contaRep.sem_cnpj;
Object.keys(conta).forEach((k) => avisos.push(conta[k] + ' ' + (TEXTO_AVISO[k] || k)));
const DADOS = {
  agora: AGORA, piso: META.piso, wl: META.wl, dias: META.dias_janela, sem_rep: SEM_REP,
  pontos: { veiculo: PONTOS_VEICULO, arremate: PONTOS_ARREMATE },
  status_nome: STATUS_NOME,
  eventos: eventos, veiculos: veiculos, lojas: lojas, part: participacao,
  avisos: avisos
};
function calcula(D, sel) {
  const evs = sel === 'todos' ? D.eventos : D.eventos.filter((e) => e.id === sel);
  const noRecorte = {};
  evs.forEach((e) => { noRecorte[e.id] = e; });
  const veics = D.veiculos.filter((v) => noRecorte[v.ev]);
  const parts = D.part.filter((p) => noRecorte[p[0]]);
  const lojaPorId = {};
  D.lojas.forEach((l) => { lojaPorId[l.id] = l; });
  const agora = D.agora;
  const estado = (e) => {
    if (agora < e.ini) return 'Agendado';
    if (agora <= e.fim) return 'Em andamento';
    const aberto = D.veiculos.some((v) => v.ev === e.id && v.status === 1);
    return aberto ? 'Encerrando' : 'Encerrado';
  };
  let jIni = null;
  let jFim = null;
  evs.forEach((e) => { if (jIni === null || e.ini < jIni) jIni = e.ini; });
  jFim = sel === 'todos' ? agora : (evs[0] ? evs[0].fim : agora);
  const novas = D.lojas.filter((l) => l.wl === D.wl && !l.apagada &&
    jIni !== null && l.cadastro >= jIni && l.cadastro <= jFim);
  const ehNova = {};
  novas.forEach((l) => { ehNova[l.id] = 1; });
  const porLoja = {};
  parts.forEach((p) => {
    const a = porLoja[p[1]] || (porLoja[p[1]] = {
      loja: p[1], veic: 0, lances: 0, arrem: 0, eventos: 0, ult_ant: null, _ini: null
    });
    a.veic += p[2];
    a.lances += p[3];
    a.arrem += p[4];
    a.eventos++;
    const ini = noRecorte[p[0]].ini;
    if (a._ini === null || ini < a._ini) { a._ini = ini; a.ult_ant = p[5]; }
  });
  const rankLojas = Object.keys(porLoja).map((k) => {
    const a = porLoja[k];
    const l = lojaPorId[a.loja] || {};
    return {
      loja: a.loja, nome: l.nome || ('loja ' + a.loja), cadastro: l.cadastro || null,
      representante: l.representante || D.sem_rep, nova: !!ehNova[a.loja],
      veic: a.veic, lances: a.lances, arrem: a.arrem, eventos: a.eventos, ult_ant: a.ult_ant,
      pontos: a.veic * D.pontos.veiculo + a.arrem * D.pontos.arremate
    };
  }).sort((x, y) => y.pontos - x.pontos || y.arrem - x.arrem || y.lances - x.lances ||
    String(x.nome).localeCompare(String(y.nome)));
  const porRep = {};
  rankLojas.forEach((r) => {
    const a = porRep[r.representante] || (porRep[r.representante] = {
      representante: r.representante, lojas: 0, pontos: 0, arrem: 0, veic: 0
    });
    a.lojas++;
    a.pontos += r.pontos;
    a.arrem += r.arrem;
    a.veic += r.veic;
  });
  const semRep = (g) => (g.representante === D.sem_rep ? 1 : 0);
  const rankReps = Object.keys(porRep).map((k) => porRep[k])
    .sort((x, y) => semRep(x) - semRep(y) || y.pontos - x.pontos ||
      String(x.representante).localeCompare(String(y.representante)));
  const soma = (arr, f) => arr.reduce((t, x) => t + (f(x) || 0), 0);
  const vendidos = veics.filter((v) => v.vendido);
  const comOferta = veics.filter((v) => v.qtd > 0);
  const kpi = {
    publicados: veics.length,
    vendidos: vendidos.length,
    volume: soma(vendidos, (v) => v.venda),
    com_oferta: comOferta.length,
    sem_oferta: veics.length - comOferta.length,
    lances: soma(veics, (v) => v.qtd),
    vmv_atingido: veics.filter((v) => v.farol === 'atingiu').length,
    ofertantes: rankLojas.length,
    arremataram: rankLojas.filter((r) => r.arrem > 0).length,
    novas: novas.length,
    novas_ofertaram: novas.filter((l) => porLoja[l.id]).length,
    sem_representante: rankLojas.filter((r) => r.representante === D.sem_rep).length
  };
  return {
    sel: sel, eventos: evs.map((e) => ({ id: e.id, nome: e.nome, ini: e.ini, fim: e.fim, estado: estado(e) })),
    janela_cadastro: [jIni, jFim],
    kpi: kpi, veiculos: veics, lojas: rankLojas, representantes: rankReps,
    novas: novas.slice().sort((x, y) => (x.cadastro < y.cadastro ? 1 : -1))
      .map((l) => ({ id: l.id, nome: l.nome, cadastro: l.cadastro, ofertou: !!porLoja[l.id],
        representante: l.representante || D.sem_rep,
        pontos: porLoja[l.id] ? rankLojas.find((r) => r.loja === l.id).pontos : 0 }))
  };
}
function APP(D, LOGO) {
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s === null || s === undefined ? '' : s)
    .split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;').split('"').join('&quot;');
  const nf = (n) => (n === null || n === undefined ? '—' : Number(n).toLocaleString('pt-BR'));
  const rs = (n) => (n === null || n === undefined ? '—' : 'R$ ' + Math.round(n).toLocaleString('pt-BR'));
  const pc = (x) => (x === null || x === undefined ? '—' : (100 * x).toFixed(1).replace('.', ',') + '%');
  const dt = (s) => (s ? s.slice(8, 10) + '/' + s.slice(5, 7) + '/' + s.slice(2, 4) + ' ' + s.slice(11, 16) : '—');
  const dia = (s) => (s ? s.slice(8, 10) + '/' + s.slice(5, 7) + '/' + s.slice(0, 4) : '—');
  const curto = (s) => (s ? s.slice(8, 10) + '/' + s.slice(5, 7) : '');
  const TAG_ESTADO = { 'Agendado': '', 'Em andamento': 'ok', 'Encerrando': 'atencao', 'Encerrado': '' };
  const LAUDO = {
    aprovado: ['ok', 'Aprovado'], aprovado_com_apontamento: ['atencao', 'Com apontamento'],
    reprovado: ['ruim', 'Reprovado'], nao_informado: ['', 'Sem veredito']
  };
  const FAROL = { sem: 'Sem oferta', abaixo: 'Oferta abaixo do VMV', atingiu: 'VMV atingido' };
  const tagStatus = (v) => {
    const nome = D.status_nome[v.status] || ('status ' + v.status);
    let cls = '';
    if (v.vendido) cls = 'ok';
    else if (v.status === 11 || v.status === 10) cls = 'ruim';
    else if ([14, 15, 18, 8].indexOf(v.status) >= 0) cls = 'atencao';
    return '<span class="tag ' + cls + '">' + esc(nome) + '</span>';
  };
  const tagLaudo = (l) => {
    if (!l) return '<span class="dim">sem laudo</span>';
    const x = LAUDO[l] || ['', l];
    return '<span class="tag ' + x[0] + '">' + esc(x[1]) + '</span>';
  };
  const nomeLoja = {};
  D.lojas.forEach((l) => { nomeLoja[l.id] = l.nome; });
  let sel = 'todos';
  function desenhaRank(alvo, itens, rotulo, detalhe) {
    if (!itens.length) { alvo.innerHTML = '<li class="vazio">Nenhuma loja ofertou neste recorte.</li>'; return; }
    const topo = Math.max.apply(null, itens.map((r) => r.pontos)) || 1;
    alvo.innerHTML = itens.map((r, i) =>
      '<li><span class="pos num">' + (i + 1) + '</span>' +
      '<span><span class="nome">' + esc(rotulo(r)) + '</span>' +
      '<span class="barra"><i style="width:' + (100 * r.pontos / topo).toFixed(1) + '%"></i></span>' +
      '<span class="det">' + esc(detalhe(r)) + '</span></span>' +
      '<span class="val num">' + nf(r.pontos) + ' pts</span></li>').join('');
  }
  function render() {
    const R = calcula(D, sel);
    const k = R.kpi;
    const ev = sel === 'todos' ? null : R.eventos[0];
    $('#sub').textContent = ev
      ? ev.nome + ' · ' + dt(ev.ini) + ' → ' + dt(ev.fim) + ' · ' + ev.estado
      : 'Canal de vendas C6 Auto · ' + D.eventos.length + ' eventos com fim desde ' + dia(D.piso);
    $('#k-pub').textContent = nf(k.publicados);
    $('#k-pub-vend').textContent = nf(k.vendidos);
    $('#k-pub-vol').textContent = rs(k.volume);
    $('#k-of').textContent = nf(k.com_oferta);
    $('#k-of-pc').textContent = k.publicados ? pc(k.com_oferta / k.publicados) + ' dos publicados' : '—';
    $('#k-of-sem').textContent = nf(k.sem_oferta);
    $('#k-of-lan').textContent = nf(k.lances);
    $('#k-lj').textContent = nf(k.ofertantes);
    $('#k-lj-arr').textContent = nf(k.arremataram);
    $('#k-lj-vmv').textContent = nf(k.vmv_atingido);
    $('#k-nv').textContent = nf(k.novas);
    $('#k-nv-jan').textContent = 'cadastradas de ' + dia(R.janela_cadastro[0]) + ' a ' + dia(R.janela_cadastro[1]);
    $('#k-nv-of').textContent = nf(k.novas_ofertaram);
    $('#k-nv-pc').textContent = k.novas ? pc(k.novas_ofertaram / k.novas) : '—';
    desenhaRank($('#rank-lojas'), R.lojas.slice(0, 10), (r) => r.nome,
      (r) => r.arrem + ' arremate(s) · ' + r.veic + ' veículo(s) ofertado(s)');
    $('#n-lojas').textContent = R.lojas.length + ' lojas';
    desenhaRank($('#rank-reps'), R.representantes, (g) => g.representante,
      (g) => g.lojas + ' loja(s) · ' + g.arrem + ' arremate(s) · ' + g.veic + ' veículo(s) ofertado(s)');
    $('#n-reps').textContent = R.representantes.filter((g) => g.representante !== D.sem_rep).length + ' representantes';
    $('#n-ev-x').textContent = D.eventos.length + ' eventos';
    $('#tab-eventos').innerHTML = D.eventos.map((e) => {
      const r = calcula(D, e.id);
      const x = r.kpi;
      const est = r.eventos[0].estado;
      return '<tr class="clicavel' + (sel === e.id ? ' marcado' : '') + '" data-ev="' + e.id + '">' +
        '<td>' + esc(e.nome) + '</td>' +
        '<td><span class="tag ' + TAG_ESTADO[est] + '">' + est + '</span></td>' +
        '<td class="n">' + dt(e.ini) + '</td><td class="n">' + dt(e.fim) + '</td>' +
        '<td class="n">' + nf(x.publicados) + '</td><td class="n">' + nf(x.com_oferta) + '</td>' +
        '<td class="n">' + nf(x.vendidos) + '</td><td class="n">' + nf(x.lances) + '</td>' +
        '<td class="n">' + nf(x.ofertantes) + '</td><td class="n">' + nf(x.novas) + '</td></tr>';
    }).join('');
    const comEv = sel === 'todos';
    $('#th-ev').style.display = comEv ? '' : 'none';
    const evNome = {};
    D.eventos.forEach((e) => { evNome[e.id] = e.fim; });
    const veics = R.veiculos.slice().sort((a, b) =>
      (a.ev === b.ev ? 0 : (evNome[a.ev] < evNome[b.ev] ? 1 : -1)) || (b.maior || 0) - (a.maior || 0));
    $('#n-veic').textContent = veics.length + ' veículos';
    $('#tab-veic').innerHTML = veics.map((v) =>
      '<tr>' +
      '<td><span class="farol ' + v.farol + '" title="' + FAROL[v.farol] + '"></span>' +
        (v.link ? '<a href="' + esc(v.link) + '" target="_blank" rel="noopener">' + esc(v.nome) + ' ↗</a>' : esc(v.nome)) +
        '<span class="dim"> ' + esc(v.ano) + '</span></td>' +
      (comEv ? '<td class="n">' + curto(evNome[v.ev]) + '</td>' : '') +
      '<td class="mono">' + esc(v.placa) + '</td><td class="mono">' + esc(v.chassi) + '</td>' +
      '<td class="n">' + nf(v.qtd) + '</td>' +
      '<td class="n">' + rs(v.ult) + (v.ult_quando ? '<span class="dim sub">' + dt(v.ult_quando) + '</span>' : '') + '</td>' +
      '<td class="n">' + rs(v.vmv) + '</td><td class="n">' + rs(v.fipe) + '</td>' +
      '<td class="n' + (v.fora_faixa ? ' fora" title="Fora da faixa de 20% a 120% da FIPE: provável erro de cadastro' : '') + '">' + pc(v.desagio) + '</td>' +
      '<td>' + tagLaudo(v.laudo) + '</td>' +
      '<td>' + tagStatus(v) + (v.arrematante !== null ? '<span class="dim sub">' + esc(nomeLoja[v.arrematante] || ('loja ' + v.arrematante)) + ' · ' + rs(v.venda) + '</span>' : '') + '</td>' +
      '</tr>').join('');
    $('#n-part').textContent = R.lojas.length + ' lojas';
    $('#th-ult').textContent = comEv ? 'Última oferta antes do período' : 'Última oferta antes do evento';
    $('#tab-lojas').innerHTML = R.lojas.map((r) =>
      '<tr><td>' + esc(r.nome) + (r.nova ? ' <span class="tag ok">nova</span>' : '') + '</td>' +
      '<td class="n">' + dia(r.cadastro) + '</td>' +
      '<td class="n">' + (r.ult_ant ? dia(r.ult_ant) : '<span class="dim">nunca</span>') + '</td>' +
      '<td>' + (r.representante !== D.sem_rep ? esc(r.representante) : '<span class="dim">' + esc(D.sem_rep) + '</span>') + '</td>' +
      '<td class="n">' + nf(r.veic) + '</td><td class="n">' + nf(r.lances) + '</td>' +
      '<td class="n">' + nf(r.arrem) + '</td><td class="n forte">' + nf(r.pontos) + '</td></tr>').join('');
    $('#n-novas').textContent = R.novas.length + ' lojas';
    $('#tab-novas').innerHTML = R.novas.length
      ? R.novas.map((l) => '<tr><td>' + esc(l.nome) + '</td><td class="n">' + dt(l.cadastro) + '</td>' +
          '<td>' + (l.representante !== D.sem_rep ? esc(l.representante) : '<span class="dim">' + esc(D.sem_rep) + '</span>') + '</td>' +
          '<td>' + (l.ofertou ? '<span class="tag ok">ofertou</span>' : '<span class="dim">ainda não</span>') + '</td>' +
          '<td class="n">' + nf(l.pontos) + '</td></tr>').join('')
      : '<tr><td colspan="5" class="dim">Nenhuma loja nova no canal nesta janela.</td></tr>';
  }
  const evOrd = D.eventos.slice().sort((a, b) => (a.fim < b.fim ? 1 : -1));
  $('#f-evento').innerHTML = '<option value="todos">Todos os eventos (' + D.eventos.length + ')</option>' +
    evOrd.map((e) => '<option value="' + e.id + '">' + esc(e.nome) + ' · ' +
      calcula(D, e.id).eventos[0].estado + '</option>').join('');
  $('#f-evento').addEventListener('change', (ev) => {
    sel = ev.target.value === 'todos' ? 'todos' : Number(ev.target.value);
    render();
  });
  $('#tab-eventos').addEventListener('click', (ev) => {
    const tr = ev.target.closest('tr[data-ev]');
    if (!tr) return;
    const id = Number(tr.getAttribute('data-ev'));
    sel = sel === id ? 'todos' : id;
    $('#f-evento').value = String(sel);
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  if (D.avisos.length) {
    const b = $('#b-aviso');
    b.hidden = false;
    b.querySelector('.cont').textContent = D.avisos.length;
    $('#dica').innerHTML = '<b>Pontos de atenção desta coleta</b><ul>' +
      D.avisos.map((a) => '<li>' + esc(a) + '</li>').join('') + '</ul>';
    const abre = () => { $('#dica').hidden = false; };
    const fecha = () => { $('#dica').hidden = true; };
    b.addEventListener('mouseenter', abre);
    b.addEventListener('focus', abre);
    b.addEventListener('mouseleave', fecha);
    b.addEventListener('blur', fecha);
    b.addEventListener('click', () => { $('#dica').hidden = !$('#dica').hidden; });
  }
  $('#gloss-lista').innerHTML = D.glossario.map((g) =>
    '<dt>' + esc(g[0]) + '</dt><dd>' + esc(g[1]) + '</dd>').join('');
  $('#gloss-n').textContent = D.glossario.length + ' termos';
  $('#gerado').textContent = dt(D.agora);
  $('#base').textContent = D.eventos.length + ' eventos do Canal de vendas C6 Auto (whitelabel ' + D.wl +
    ') com fim desde ' + dia(D.piso);
  const ICO = {
    claro: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    escuro: '<path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/>'
  };
  function tema(t) {
    document.documentElement.dataset.tema = t;
    $('#logo').src = LOGO[t];
    const alvo = t === 'escuro' ? 'claro' : 'escuro';
    const b = $('#b-tema');
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICO[alvo] + '</svg>';
    b.setAttribute('aria-label', 'Mudar para o tema ' + alvo);
    b.setAttribute('title', 'Tema ' + alvo);
  }
  tema(document.documentElement.dataset.tema || 'claro');
  $('#b-tema').addEventListener('click', () =>
    tema(document.documentElement.dataset.tema === 'escuro' ? 'claro' : 'escuro'));
  render();
}
DADOS.glossario = [
  ['Evento no painel', 'Evento que alveja o Canal de vendas C6 Auto (whitelabel 43) e termina a partir de ' +
    DADOS.dias + ' dias atrás: os abertos, os agendados e os encerrados recentes.'],
  ['Estado do evento', 'Agendado: as ofertas ainda não abriram. Em andamento: dentro do horário. Encerrando: passou do horário de fim e ainda há veículo ativo — os lances da prorrogação caem depois do fim oficial. Encerrado: nenhum veículo ativo.'],
  ['Veículo publicado', 'Cada negociação do evento. O mesmo carro em dois eventos conta uma vez em cada um.'],
  ['Com oferta / sem oferta', 'Se o veículo recebeu pelo menos um lance naquele evento.'],
  ['Lance', 'Cada oferta registrada. Uma loja pode dar vários lances no mesmo veículo.'],
  ['Última oferta', 'O lance mais recente do veículo no evento, com a hora em que entrou.'],
  ['VMV', 'Valor mínimo de venda que o vendedor aceita naquela negociação.'],
  ['FIPE', 'Valor FIPE gravado no anúncio.'],
  ['Deságio', '1 − (valor ÷ FIPE). O valor é o da venda quando o veículo vendeu, senão a última oferta. Deságio de 30% = o lance ficou em 70% da FIPE. Marcado quando o valor sai da faixa de 20% a 120% da FIPE, que indica erro de cadastro, não negócio.'],
  ['Farol', 'A bolinha antes do veículo. Vermelho: sem oferta. Vinho: há oferta, mas nenhuma chegou ao VMV (ou o VMV não foi informado). Verde: alguma oferta alcançou o VMV.'],
  ['Laudo cautelar', 'Resultado do laudo do veículo. "Sem veredito" é laudo que existe e não traz resultado — diferente de "sem laudo", quando não há laudo nenhum.'],
  ['Vendido / arremate', 'Negociação em aguardando pagamento, aguardando confirmação de pagamento ou vendido. O arrematante é a loja da oferta vencedora. Veículo em análise do vendedor ainda não conta.'],
  ['Pontuação', textoPontos()],
  ['Loja ofertante', 'Loja que deu pelo menos um lance em veículo do recorte.'],
  ['Loja nova', 'Loja do canal C6 cadastrada dentro da janela: do início das ofertas ao fim do evento; em "Todos os eventos", do início do evento mais antigo até a atualização.'],
  ['Última oferta antes do evento', 'O último lance que a loja deu em qualquer evento da plataforma antes de este começar. Em "Todos os eventos", antes do primeiro evento do período em que ela ofertou. "Nunca" = é a primeira vez que ela oferta.'],
  ['Representante comercial', 'O representante (USUARIO_GP) da planilha de lojas ativas do C6, cruzada pelo CNPJ da loja. CNPJ que não está na planilha, ou está sem representante, fica como "Sem Representante". CNPJ com mais de um representante na planilha (filiais) fica com o que aparece em mais linhas; empate fica Sem Representante. O ranking de representantes soma a pontuação das lojas de cada um.'],
  ['Link do anúncio', 'Abre o anúncio na vitrine do C6 (compraveiculos.cars2you.com.br).']
];
function textoPontos() {
  return PONTOS_VEICULO + ' ponto por veículo ofertado e ' + PONTOS_ARREMATE +
    ' por arremate, somados por evento. Vários lances no mesmo veículo valem um ponto só.';
}
const CSS_PAINEL = [
  '[hidden]{display:none!important}',
  '.marca .logo{height:26px}',
  '.topo-acoes select.ctrl{max-width:340px;text-overflow:ellipsis}',
  '@media(max-width:620px){.topo-in{grid-template-columns:auto 1fr auto auto}',
  '.topo-acoes{display:contents}.topo-acoes select.ctrl{grid-column:1/-1;grid-row:2;max-width:none;width:100%}}',
  '.aviso{position:relative}.aviso .cont{position:absolute;top:-5px;right:-5px;min-width:16px;height:16px;border-radius:8px;',
  'background:var(--negativo);color:var(--superficie);font-size:10px;font-weight:700;line-height:16px;text-align:center}',
  '#dica{position:fixed;z-index:40;top:calc(var(--topo-h) + 4px);right:20px;width:max-content;max-width:min(560px,92vw);',
  'background:var(--superficie);color:var(--texto);border:1px solid var(--borda-forte);border-radius:var(--r-m);',
  'box-shadow:var(--sombra);padding:12px 14px;font-size:12.5px;pointer-events:none}',
  '#dica ul{margin:6px 0 0;padding-left:18px}',
  '.rank .det{display:block;font-size:11.5px;color:var(--texto-3);margin-top:3px}',
  '.rank .vazio{display:block;color:var(--texto-2);font-size:13px}',
  '.rolo.alto{max-height:560px;overflow:auto}',
  'table.dens thead th{text-align:left}table.dens tbody td{text-align:left}',
  'table.dens td.n,table.dens th.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}',
  'table.dens td.mono{font-variant-numeric:tabular-nums;letter-spacing:.02em;white-space:nowrap}',
  'table.dens td.forte{font-weight:700}',
  'table.dens td.fora{color:var(--atencao);text-decoration:underline dotted}',
  'table.dens a{color:var(--texto);text-decoration:underline;text-underline-offset:2px}',
  '.dim{color:var(--texto-3)}.sub{display:block;font-size:11px}',
  'tr.clicavel{cursor:pointer}tr.marcado td{background:var(--acento-veu);font-weight:650}',
  '.farol{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:7px;vertical-align:1px}',
  '.farol.sem{background:var(--negativo)}.farol.abaixo{background:var(--atencao)}.farol.atingiu{background:var(--positivo)}',
  '.g2 .cartao{min-width:0}'
].join('');
const ICONE = {
  veiculo: '<path d="M3 13l2-5a2 2 0 012-1h10a2 2 0 012 1l2 5v5h-3M6 18H3v-5h18"/><circle cx="7.5" cy="16.5" r="1.5"/><circle cx="16.5" cy="16.5" r="1.5"/>',
  oferta: '<path d="M12 2v20"/><path d="M17 6H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>',
  loja: '<path d="M3 21V10l9-7 9 7v11"/><path d="M9 21v-6h6v6"/>',
  nova: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
  rank: '<path d="M4 6h16"/><path d="M4 12h11"/><path d="M4 18h6"/>',
  pessoa: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>',
  evento: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  tabela: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 10v10"/>',
  gloss: '<path d="M4 19V5a2 2 0 012-2h13v18H6a2 2 0 01-2-2z"/><path d="M4 19a2 2 0 012-2h13"/>'
};
const chip = (k) => '<span class="chip" aria-hidden="true"><svg viewBox="0 0 24 24">' + ICONE[k] + '</svg></span>';
const kpiCard = (ic, rot, idVal, delta, pe) =>
  '<article class="cartao"><div class="cartao-topo">' + chip(ic) + '<span class="kpi-rot">' + rot + '</span></div>' +
  '<p class="kpi-val num" id="' + idVal + '">—</p><p class="kpi-delta neutro">' + delta + '</p>' +
  '<dl class="kpi-pe">' + pe.map((p) => '<div><dt>' + p[0] + '</dt><dd class="num" id="' + p[1] + '">—</dd></div>').join('') +
  '</dl></article>';
const cartaoTabela = (ic, titulo, idN, thead, idCorpo, alto) =>
  '<section class="cartao"><div class="cartao-topo">' + chip(ic) + '<h2>' + titulo + '</h2>' +
  '<span class="dir"><span class="tag" id="' + idN + '">—</span></span></div>' +
  '<div class="rolo' + (alto ? ' alto' : '') + '"><table class="dens"><thead><tr>' + thead +
  '</tr></thead><tbody id="' + idCorpo + '"></tbody></table></div></section>';
const dadosJs = JSON.stringify(DADOS).split('<').join(String.fromCharCode(92) + 'u003c');
const logoJs = JSON.stringify(LOGO);
const html = '<!doctype html><html lang="pt-BR" data-tema="claro"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width, initial-scale=1">' +
  '<title>Painel de Eventos C6</title><style>' + CSS_TEMA + CSS_PAINEL + '</style></head><body>' +
  '<header class="topo"><div class="topo-in">' +
  '<span class="marca"><img class="logo" id="logo" src="" alt="C6 Bank"></span>' +
  '<div class="topo-tit"><h1>Painel de Eventos C6</h1><p class="sub" id="sub"></p></div>' +
  '<div class="topo-acoes">' +
  '<select class="ctrl" id="f-evento" aria-label="Evento"></select>' +
  '<button class="ctrl so-icone aviso" id="b-aviso" type="button" hidden aria-label="Pontos de atenção">' +
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/></svg>' +
  '<span class="cont"></span></button>' +
  '<button class="ctrl so-icone" id="b-tema" type="button" aria-label="Mudar o tema"></button>' +
  '</div></div></header><div id="dica" hidden></div>' +
  '<main class="area">' +
  '<section class="g4" aria-label="Indicadores">' +
  kpiCard('veiculo', 'Veículos publicados', 'k-pub', 'negociações nos eventos',
    [['Vendidos', 'k-pub-vend'], ['Volume vendido', 'k-pub-vol']]) +
  kpiCard('oferta', 'Com ofertas', 'k-of', '<span id="k-of-pc"></span>',
    [['Sem ofertas', 'k-of-sem'], ['Lances', 'k-of-lan']]) +
  kpiCard('loja', 'Lojas ofertantes', 'k-lj', 'deram pelo menos um lance',
    [['Arremataram', 'k-lj-arr'], ['Veículos no VMV', 'k-lj-vmv']]) +
  kpiCard('nova', 'Novos lojistas', 'k-nv', '<span id="k-nv-jan"></span>',
    [['Já ofertaram', 'k-nv-of'], ['Conversão', 'k-nv-pc']]) +
  '</section>' +
  '<section class="g2">' +
  '<article class="cartao"><div class="cartao-topo">' + chip('rank') + '<h2>Ranking de lojas</h2>' +
  '<span class="dir"><span class="tag" id="n-lojas">—</span></span></div><ol class="rank" id="rank-lojas"></ol></article>' +
  '<article class="cartao"><div class="cartao-topo">' + chip('pessoa') + '<h2>Ranking de representantes</h2>' +
  '<span class="dir"><span class="tag" id="n-reps">—</span></span></div><ol class="rank" id="rank-reps"></ol></article>' +
  '</section>' +
  cartaoTabela('evento', 'Eventos', 'n-ev-x',
    '<th>Evento</th><th>Estado</th><th class="n">Início</th><th class="n">Fim</th><th class="n">Veículos</th>' +
    '<th class="n">Com oferta</th><th class="n">Vendidos</th><th class="n">Lances</th><th class="n">Lojas</th><th class="n">Lojas novas</th>',
    'tab-eventos', false) +
  cartaoTabela('veiculo', 'Veículos', 'n-veic',
    '<th>Veículo</th><th class="n" id="th-ev">Evento</th><th>Placa</th><th>Chassi</th><th class="n">Ofertas</th>' +
    '<th class="n">Última oferta</th><th class="n">VMV</th><th class="n">FIPE</th><th class="n">Deságio</th>' +
    '<th>Laudo</th><th>Resultado</th>',
    'tab-veic', true) +
  cartaoTabela('loja', 'Lojas ofertantes', 'n-part',
    '<th>Loja</th><th class="n">Cadastro</th><th class="n" id="th-ult">Última oferta antes do evento</th>' +
    '<th>Representante</th><th class="n">Veículos ofertados</th><th class="n">Lances</th>' +
    '<th class="n">Arremates</th><th class="n">Pontos</th>',
    'tab-lojas', true) +
  cartaoTabela('nova', 'Lojas novas no canal', 'n-novas',
    '<th>Loja</th><th class="n">Cadastro</th><th>Representante</th><th>No recorte</th><th class="n">Pontos</th>',
    'tab-novas', true) +
  '<details class="cartao gloss" id="gloss"><summary class="cartao-topo">' + chip('gloss') + '<h2>Glossário</h2>' +
  '<span class="dir"><span class="tag" id="gloss-n">—</span><span class="seta" aria-hidden="true">▾</span></span>' +
  '</summary><dl id="gloss-lista"></dl></details>' +
  '<p class="rodape">Atualizado em <span id="gerado">—</span> · <span id="base"></span></p>' +
  '</main><script>' +
  calcula.toString() + APP.toString() +
  'APP(' + dadosJs + ',' + logoJs + ');' +
  '</script></body></html>';
const todos = calcula(DADOS, 'todos');
const resumo = {
  eventos: eventos.length, veiculos: veiculos.length, ofertas: T.ofertas.length,
  lojas_cadastro: lojas.length, participacoes: participacao.length,
  representantes: Object.assign({ linhas_planilha: planilha.length, cnpjs_planilha: Object.keys(votos).length },
    contaRep),
  kpi: todos.kpi,
  por_evento: eventos.map((e) => {
    const r = calcula(DADOS, e.id);
    return { id: e.id, estado: r.eventos[0].estado, kpi: r.kpi };
  }),
  top_lojas: todos.lojas.slice(0, 5).map((r) => ({ loja: r.loja, pontos: r.pontos, arrem: r.arrem, veic: r.veic })),
  avisos: avisos,
  bytes_html: html.length
};
if (CSS_TEMA.length < 5000) throw new Error('CSS do tema nao injetado (rode _aplica-modelo.js)');
if (!LOGO.claro || !LOGO.escuro) throw new Error('logos nao injetadas (rode _aplica-modelo.js)');
return [{ json: { html: html, resumo: resumo } }];
