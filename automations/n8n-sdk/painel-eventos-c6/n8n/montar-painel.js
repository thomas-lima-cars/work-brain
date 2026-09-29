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
  '--acento-veu:     rgba(36,36,36,.08);--serie-2:        #7A7A7A;--farol-abaixo:   #B8860B;',
  '--positivo:       #0C6E4B;--negativo:       #7F1112;--atencao:        #6F4047;',
  '--grade:          rgba(36,36,36,.07);',
  '--sombra:         0 1px 1px  rgba(24,24,24,.03),0 6px 16px rgba(24,24,24,.05),0 18px 44px rgba(24,24,24,.07),inset 0 1px 0 rgba(255,255,255,.85);',
  '--cartao-borda:   1px solid rgba(255,255,255,.72);',
  '--cartao-fundo:   linear-gradient(155deg, rgba(255,255,255,.82) 0%,rgba(255,255,255,.95) 58%);',
  '--cartao-blur:    blur(18px) saturate(100%);',
  '--brilho:         radial-gradient(420px 260px at 0% 0%,rgba(36,36,36,.09), transparent 72%);}',
  '[data-tema="escuro"]{color-scheme: dark;--marca-azul:       #FFC000;--marca-azul-claro: #FFC000;',
  '--fundo:          #111111;',
  '--fundo-veu:      radial-gradient(900px 500px at 8% -8%,rgba(255,255,255,.07), transparent 62%),radial-gradient(800px 500px at 96% 4%,rgba(255,255,255,.035), transparent 60%);',
  '--superficie:     #1A1A1A;--superficie-2:   #242424;--borda:          rgba(255,255,255,.09);',
  '--borda-forte:    rgba(255,255,255,.16);--texto:          #EDEDED;--texto-2:        #A8A8A8;',
  '--texto-3:        #767676;--acento:         #FFC000;--acento-cheio:   #FFC000;',
  '--acento-veu:     rgba(255,192,0,.13);--serie-2:        #7A7A7A;--farol-abaixo:   #FFC000;',
  '--positivo:       #35C08A;--negativo:       #EF5B60;--atencao:        #C98A92;',
  '--grade:          rgba(255,255,255,.07);',
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
const SITUACAO_APROVADA = 3;
const PONTOS = { arremate: 10, dia: 1 };
const PESO_SCORE = { acesso: 1, oferta: 5, vmv: 10 };
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
const PARTES = Number(META.partes_acesso);
if (!(PARTES >= 1)) throw new Error('meta.partes_acesso ausente no Montar Consultas');
const nomesAcesso = [];
for (let p = 0; p < PARTES; p++) nomesAcesso.push('acessos_p' + p);
['eventos', 'veiculos', 'ofertas', 'lojas', 'acessos_anuncio'].concat(nomesAcesso).forEach((k) => {
  if (!T[k]) throw new Error('A consulta ' + k + ' nao veio do Montar Consultas');
});
const COL_CNPJ = 'NR_CNPJ';
const COL_REP = { gp: 'USUARIO_GP', gn: 'USUARIO_GN' };
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
const temCol = {};
[COL_CNPJ, COL_REP.gp, COL_REP.gn].forEach((c) => {
  temCol[c] = planilha.some((l) => l && l[c] !== undefined);
});
if (!temCol[COL_CNPJ] || !temCol[COL_REP.gp] || !temCol[COL_REP.gn]) {
  throw new Error('A planilha de representantes veio sem as colunas ' + JSON.stringify(temCol) +
    '. Foi reorganizada?');
}
if (planilha.length < MIN_LINHAS_PLANILHA) {
  throw new Error('A planilha de representantes tem so ' + planilha.length + ' linhas, abaixo do piso de ' +
    MIN_LINHAS_PLANILHA + ' — leitura truncada ou arquivo trocado.');
}
const votos = { gp: {}, gn: {} };
planilha.forEach((l) => {
  const c = cnpjDe(l[COL_CNPJ]);
  if (c.length !== 14) return;
  ['gp', 'gn'].forEach((q) => {
    if (!votos[q][c]) votos[q][c] = {};
    const v = l[COL_REP[q]];
    const rep = String(v === null || v === undefined ? '' : v).trim();
    if (rep) votos[q][c][rep] = (votos[q][c][rep] || 0) + 1;
  });
});
function representanteDo(q, cnpj) {
  if (!cnpj) return { rep: SEM_REP, motivo: 'sem_cnpj' };
  const v = votos[q][cnpj];
  if (!v) return { rep: SEM_REP, motivo: 'fora_planilha' };
  const reps = Object.keys(v).sort((a, b) => v[b] - v[a] || (a < b ? -1 : 1));
  if (!reps.length) return { rep: SEM_REP, motivo: 'vazio_planilha' };
  if (reps.length > 1 && v[reps[0]] === v[reps[1]]) return { rep: SEM_REP, motivo: 'empate' };
  return { rep: reps[0], motivo: reps.length > 1 ? 'maioria' : 'unico' };
}
const zeraConta = () => ({ unico: 0, maioria: 0, empate: 0, fora_planilha: 0, vazio_planilha: 0, sem_cnpj: 0 });
const contaRep = { gp: zeraConta(), gn: zeraConta() };
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
  const c = cnpjDe(l.cnpj);
  const gp = representanteDo('gp', c);
  const gn = representanteDo('gn', c);
  contaRep.gp[gp.motivo]++;
  contaRep.gn[gn.motivo]++;
  return {
    id: num(l.id), nome: l.nome, wl: num(l.wl), situacao: num(l.situacao), cadastro: l.cadastro,
    apagada: num(l.apagada) === 1, gp: gp.rep, gn: gn.rep
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
const acessoAnuncio = T.acessos_anuncio.map((a) => [num(a.evento), num(a.anuncio), num(a.loja), num(a.dias)]);
const lojasDoAnuncio = {};
acessoAnuncio.forEach((a) => {
  const k = a[0] + '|' + a[1];
  lojasDoAnuncio[k] = (lojasDoAnuncio[k] || 0) + 1;
});
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
  ofs.forEach((o) => {
    if (!ult || o.id > ult.id) ult = o;
    if (!maior || o.valor > maior.valor) maior = o;
  });
  const status = num(r.status);
  const vendido = STATUS_VENDA.indexOf(status) >= 0;
  const venc = vendido && r.vencedora !== null ? ofertaPorId[num(r.vencedora)] : null;
  if (vendido && !venc) marca('venda_sem_vencedora');
  const vmv = num(r.vmv);
  let farol = 'sem';
  if (maior) farol = vmv !== null && maior.valor >= vmv ? 'atingiu' : 'abaixo';
  const acessos = lojasDoAnuncio[ev.id + '|' + num(r.anuncio)] || 0;
  const patio = String(r.patio || '').trim();
  if (!patio) marca('sem_patio');
  const nomeVeic = [r.marca, r.modelo, r.versao].filter((x) => x).join(' ');
  veiculos.push({
    ev: ev.id, neg: num(r.neg), anuncio: num(r.anuncio),
    nome: nomeVeic || '(sem modelo)',
    ano: [r.ano_fab, r.ano_mod].filter((x) => x).join('/'),
    patio: patio || '(sem pátio)',
    link: linkAnuncio(r, ev.wls),
    qtd: ofs.length, acessos: acessos,
    ult: ult ? ult.valor : null, ult_quando: ult ? ult.quando : null,
    maior: maior ? maior.valor : null,
    vmv: vmv, fipe: num(r.fipe),
    pvmv: maior && vmv ? maior.valor / vmv : null,
    score: acessos * PESO_SCORE.acesso + ofs.length * PESO_SCORE.oferta +
      (farol === 'atingiu' ? PESO_SCORE.vmv : 0),
    status: status, vendido: vendido,
    venc: venc ? venc.id : null,
    venda: venc ? venc.valor : null,
    arrematante: venc ? venc.loja : null,
    farol: farol
  });
});
const negConhecida = {};
veiculos.forEach((v) => { negConhecida[v.neg] = 1; });
const ofertas = T.ofertas.filter((o) => negConhecida[num(o.neg)] && num(o.loja) !== null)
  .map((o) => [num(o.id), num(o.neg), num(o.loja), num(o.valor), o.quando]);
ofertas.forEach((o) => {
  if (!lojaPorId[o[2]]) marca('loja_sem_cadastro');
  else {
    if (lojaPorId[o[2]].wl !== META.wl) marca('loja_outro_canal');
    if (lojaPorId[o[2]].apagada) marca('loja_apagada');
  }
});
const acessos = [];
nomesAcesso.forEach((k) => {
  T[k].forEach((a) => acessos.push([num(a.loja), String(a.dia), num(a.hora), num(a.n)]));
});
const TEXTO_AVISO = {
  outro_vendedor: 'veículo(s) de loja vendedora diferente do C6 Bank Lojista (104754)',
  anuncio_apagado: 'veículo(s) com o anúncio apagado e a negociação ainda no evento',
  venda_sem_vencedora: 'venda(s) sem a oferta vencedora entre as ofertas do evento — sem arrematante',
  veiculo_repetido: 'veículo(s) com mais de uma negociação no mesmo evento',
  veiculo_sem_evento: 'veículo(s) fora dos eventos do recorte',
  sem_link: 'veículo(s) sem marca, modelo, versão ou identificador — sem link do anúncio',
  link_padrao: 'veículo(s) de evento que alveja outro canal além do C6 — link no cars2you.com.br',
  sem_patio: 'veículo(s) sem pátio no anúncio',
  loja_sem_cadastro: 'lance(s) de loja sem cadastro na tabela de lojas',
  loja_outro_canal: 'lance(s) de loja de outro canal',
  loja_apagada: 'lance(s) de loja apagada',
  rep_maioria_gp: 'loja(s) com mais de um USUARIO_GP para o mesmo CNPJ na planilha — ficou o que aparece em mais linhas',
  rep_empate_gp: 'loja(s) com empate de USUARIO_GP para o mesmo CNPJ na planilha — ficaram Sem Representante',
  rep_maioria_gn: 'loja(s) com mais de um USUARIO_GN para o mesmo CNPJ na planilha — ficou o que aparece em mais linhas',
  rep_empate_gn: 'loja(s) com empate de USUARIO_GN para o mesmo CNPJ na planilha — ficaram Sem Representante',
  rep_sem_cnpj: 'loja(s) sem CNPJ no banco — ficaram Sem Representante'
};
['gp', 'gn'].forEach((q) => {
  if (contaRep[q].maioria) conta['rep_maioria_' + q] = contaRep[q].maioria;
  if (contaRep[q].empate) conta['rep_empate_' + q] = contaRep[q].empate;
});
if (contaRep.gp.sem_cnpj) conta.rep_sem_cnpj = contaRep.gp.sem_cnpj;
Object.keys(conta).forEach((k) => avisos.push(conta[k] + ' ' + (TEXTO_AVISO[k] || k)));
const DADOS = {
  agora: AGORA, piso: META.piso, wl: META.wl, dias: META.dias_janela, sem_rep: SEM_REP,
  pontos: PONTOS, peso: PESO_SCORE, aprovada: SITUACAO_APROVADA,
  status_nome: STATUS_NOME,
  eventos: eventos, veiculos: veiculos, lojas: lojas, ofertas: ofertas,
  aa: acessoAnuncio, ac: acessos,
  avisos: avisos
};
function calcula(D, sel, F) {
  F = F || {};
  const col = F.col || 'gn';
  const evs = sel === 'todos' ? D.eventos : D.eventos.filter((e) => e.id === sel);
  const noRecorte = {};
  evs.forEach((e) => { noRecorte[e.id] = e; });
  const lojaPorId = {};
  D.lojas.forEach((l) => { lojaPorId[l.id] = l; });
  const agora = D.agora;
  const estado = (e) => {
    if (agora < e.ini) return 'Agendado';
    if (agora <= e.fim) return 'Em andamento';
    const aberto = D.veiculos.some((v) => v.ev === e.id && v.status === 1);
    return aberto ? 'Encerrando' : 'Encerrado';
  };
  const veicsEv = D.veiculos.filter((v) => noRecorte[v.ev]);
  const Vf = veicsEv.filter((v) => (!F.patio || v.patio === F.patio) && (!F.farol || v.farol === F.farol));
  const vPorNeg = {};
  const vPorAnuncio = {};
  Vf.forEach((v) => { vPorNeg[v.neg] = v; vPorAnuncio[v.ev + '|' + v.anuncio] = v; });
  const lojaOk = (id) => !F.rep || (!!lojaPorId[id] && lojaPorId[id][col] === F.rep);
  let pIni = null;
  let pFim = null;
  evs.forEach((e) => {
    if (pIni === null || e.ini < pIni) pIni = e.ini;
    if (pFim === null || e.fim > pFim) pFim = e.fim;
  });
  const dataDe = (c) => '20' + c.slice(0, 2) + '-' + c.slice(2, 4) + '-' + c.slice(4, 6);
  const codDia = (s) => s.slice(2, 4) + s.slice(5, 7) + s.slice(8, 10);
  const diaData = F.dia ? dataDe(F.dia) : null;
  let wIni = pIni;
  let wFim = pFim;
  if (diaData && pIni !== null) {
    const a = diaData + ' 00:00';
    const b = diaData + ' 23:59';
    wIni = a > pIni ? a : pIni;
    wFim = b < pFim ? b : pFim;
  }
  const semJanela = wIni === null || wIni > wFim;
  const hora = (s) => Number(s.slice(11, 13));
  const minuto = (s) => Number(s.slice(14, 16));
  const dIni = semJanela ? null : codDia(wIni);
  const dFim = semJanela ? null : codDia(wFim);
  const hIni = semJanela ? 0 : hora(wIni);
  const hFim = semJanela ? -1 : (minuto(wFim) === 0 ? hora(wFim) - 1 : hora(wFim));
  const horaOk = (d, h) => {
    if (dIni === null || d < dIni || d > dFim) return false;
    if (d === dIni && h < hIni) return false;
    if (d === dFim && h > hFim) return false;
    return true;
  };
  const novas = semJanela ? [] : D.lojas.filter((l) => l.wl === D.wl && !l.apagada &&
    l.cadastro >= wIni && l.cadastro <= wFim && lojaOk(l.id));
  const ehNova = {};
  novas.forEach((l) => { ehNova[l.id] = 1; });
  const diasDaLoja = {};
  const lojasDoDia = {};
  const porHoraT = [];
  const porHoraN = [];
  for (let h = 0; h < 24; h++) { porHoraT.push(0); porHoraN.push(0); }
  D.ac.forEach((a) => {
    if (!horaOk(a[1], a[2]) || !lojaOk(a[0])) return;
    (diasDaLoja[a[0]] || (diasDaLoja[a[0]] = {}))[a[1]] = 1;
    (lojasDoDia[a[1]] || (lojasDoDia[a[1]] = {}))[a[0]] = 1;
    if (F.dia_hora && a[1] !== F.dia_hora) return;
    porHoraT[a[2]] += a[3];
    if (ehNova[a[0]]) porHoraN[a[2]] += a[3];
  });
  const nDias = (id) => (diasDaLoja[id] ? Object.keys(diasDaLoja[id]).length : 0);
  const Of = D.ofertas.filter((o) => vPorNeg[o[1]] && lojaOk(o[2]) && (!diaData || o[4].slice(0, 10) === diaData));
  const ofPorId = {};
  const ofVeic = {};
  Of.forEach((o) => {
    ofPorId[o[0]] = o;
    const a = ofVeic[o[1]] || (ofVeic[o[1]] = { n: 0, maior: null });
    a.n++;
    if (a.maior === null || o[3] > a.maior) a.maior = o[3];
  });
  const vendidos = Vf.filter((v) => v.vendido && v.venc !== null && ofPorId[v.venc]);
  const comOferta = Vf.filter((v) => ofVeic[v.neg]);
  const vmvAt = Vf.filter((v) => ofVeic[v.neg] && v.vmv !== null && ofVeic[v.neg].maior >= v.vmv);
  const porLoja = {};
  const pl = (id) => porLoja[id] || (porLoja[id] = { negs: {}, lances: 0, arrem: 0 });
  Of.forEach((o) => { const a = pl(o[2]); a.lances++; a.negs[o[1]] = 1; });
  vendidos.forEach((v) => { pl(ofPorId[v.venc][2]).arrem++; });
  const diasEntre = (a, b) => Math.round((Date.UTC(Number(b.slice(0, 4)), Number(b.slice(5, 7)) - 1, Number(b.slice(8, 10))) -
    Date.UTC(Number(a.slice(0, 4)), Number(a.slice(5, 7)) - 1, Number(a.slice(8, 10)))) / 86400000);
  const acessoVeic = {};
  const abriu = {};
  D.aa.forEach((a) => {
    const e = noRecorte[a[0]];
    if (!e) return;
    const v = vPorAnuncio[a[0] + '|' + a[1]];
    if (!v || !lojaOk(a[2])) return;
    if (diaData) {
      const k = diasEntre(e.ini.slice(0, 10), diaData);
      if (k < 0 || k > 30 || !(a[3] & (1 << k))) return;
    }
    acessoVeic[v.neg] = (acessoVeic[v.neg] || 0) + 1;
    abriu[a[2]] = 1;
  });
  const universo = {};
  Object.keys(porLoja).forEach((k) => { universo[k] = 1; });
  novas.forEach((l) => { universo[l.id] = 1; });
  const rankLojas = Object.keys(universo).map((k) => {
    const id = Number(k);
    const a = porLoja[k] || { negs: {}, lances: 0, arrem: 0 };
    const l = lojaPorId[id] || {};
    const nova = !!ehNova[id];
    const dias = nDias(id);
    return {
      loja: id, nome: l.nome || ('loja ' + id), nova: nova,
      gp: l.gp || D.sem_rep, gn: l.gn || D.sem_rep,
      acessos: dias, lances: a.lances, veic: Object.keys(a.negs).length, arrem: a.arrem,
      pontos: nova ? a.arrem * D.pontos.arremate + dias * D.pontos.dia : 0
    };
  }).sort((x, y) => y.pontos - x.pontos || y.arrem - x.arrem || y.lances - x.lances ||
    y.acessos - x.acessos || String(x.nome).localeCompare(String(y.nome)));
  const semRep = (g) => (g.representante === D.sem_rep ? 1 : 0);
  const agrupa = (q) => {
    const por = {};
    rankLojas.forEach((r) => {
      const a = por[r[q]] || (por[r[q]] = {
        representante: r[q], lojas: 0, novas: 0, acessos: 0, lances: 0, veic: 0, arrem: 0, pontos: 0
      });
      a.lojas++;
      if (r.nova) a.novas++;
      a.acessos += r.acessos;
      a.lances += r.lances;
      a.veic += r.veic;
      a.arrem += r.arrem;
      a.pontos += r.pontos;
    });
    return Object.keys(por).map((k) => por[k]).sort((x, y) => semRep(x) - semRep(y) ||
      y.pontos - x.pontos || y.arrem - x.arrem || String(x.representante).localeCompare(String(y.representante)));
  };
  const porPatio = {};
  Vf.forEach((v) => {
    const a = porPatio[v.patio] || (porPatio[v.patio] = { patio: v.patio, veiculos: 0, acesso: 0, oferta: 0, vmv: 0 });
    a.veiculos++;
    if (acessoVeic[v.neg]) a.acesso++;
    if (ofVeic[v.neg]) a.oferta++;
    if (ofVeic[v.neg] && v.vmv !== null && ofVeic[v.neg].maior >= v.vmv) a.vmv++;
  });
  const patios = Object.keys(porPatio).map((k) => {
    const a = porPatio[k];
    a.conversao = a.veiculos ? a.oferta / a.veiculos : null;
    a.pc_vmv = a.veiculos ? a.vmv / a.veiculos : null;
    return a;
  }).sort((x, y) => y.veiculos - x.veiculos || String(x.patio).localeCompare(String(y.patio)));
  const hoje = codDia(agora);
  const listaDias = (ini, fim) => {
    const out = [];
    if (ini === null) return out;
    const ate = fim < hoje ? fim : hoje;
    const dt = new Date(Date.UTC(2000 + Number(ini.slice(0, 2)), Number(ini.slice(2, 4)) - 1, Number(ini.slice(4, 6))));
    const p2 = (n) => (n < 10 ? '0' : '') + n;
    for (let i = 0; i < 400; i++) {
      const c = p2(dt.getUTCFullYear() % 100) + p2(dt.getUTCMonth() + 1) + p2(dt.getUTCDate());
      if (c > ate) break;
      out.push(c);
      dt.setUTCDate(dt.getUTCDate() + 1);
    }
    return out;
  };
  const porDia = listaDias(dIni, dFim).map((c) => {
    const ls = Object.keys(lojasDoDia[c] || {});
    return { dia: c, total: ls.length, novas: ls.filter((id) => ehNova[id]).length };
  });
  let h0 = 0;
  let h1 = 23;
  while (h0 <= 23 && porHoraT[h0] === 0) h0++;
  while (h1 >= 0 && porHoraT[h1] === 0) h1--;
  const porHora = [];
  for (let h = h0; h <= h1; h++) porHora.push({ h: h, total: porHoraT[h], novas: porHoraN[h] });
  const soma = (arr, f) => arr.reduce((t, x) => t + (f(x) || 0), 0);
  const ofertantes = rankLojas.filter((r) => r.lances > 0);
  const participacoes = soma(ofertantes, (r) => r.veic);
  const funil = [
    ['Cadastrados', novas.length],
    ['Aprovados', novas.filter((l) => l.situacao === D.aprovada).length],
    ['Logaram', novas.filter((l) => nDias(l.id) > 0).length],
    ['Acessaram', novas.filter((l) => abriu[l.id]).length],
    ['Ofertaram', novas.filter((l) => porLoja[l.id] && porLoja[l.id].lances > 0).length],
    ['Compraram', novas.filter((l) => porLoja[l.id] && porLoja[l.id].arrem > 0).length]
  ];
  const kpi = {
    publicados: Vf.length,
    vendidos: vendidos.length,
    volume: soma(vendidos, (v) => v.venda),
    vmv_atingido: vmvAt.length,
    acessados: Vf.filter((v) => acessoVeic[v.neg]).length,
    com_oferta: comOferta.length,
    sem_oferta: Vf.length - comOferta.length,
    lances: Of.length,
    ofertantes: ofertantes.length,
    lances_por_lojista: ofertantes.length ? Of.length / ofertantes.length : null,
    compradores: rankLojas.filter((r) => r.arrem > 0).length,
    participacoes: participacoes,
    part_por_lojista: ofertantes.length ? participacoes / ofertantes.length : null,
    novas: novas.length,
    novas_logaram: funil[2][1],
    engajamento: novas.length ? funil[2][1] / novas.length : null,
    novas_ofertaram: funil[4][1],
    novas_compraram: funil[5][1],
    lojas_acessaram: Object.keys(diasDaLoja).length,
    acessos: soma(porHoraT, (n) => n),
    acessos_novas: soma(porHoraN, (n) => n)
  };
  return {
    sel: sel, eventos: evs.map((e) => ({ id: e.id, nome: e.nome, ini: e.ini, fim: e.fim, estado: estado(e) })),
    periodo: [pIni, pFim], janela: [wIni, wFim],
    dias_periodo: listaDias(pIni === null ? null : codDia(pIni), pFim === null ? null : codDia(pFim)),
    patios_evento: Object.keys(veicsEv.reduce((o, v) => { o[v.patio] = 1; return o; }, {})).sort(),
    kpi: kpi, veiculos: Vf, lojas: rankLojas, nova: ehNova,
    representantes: { gp: agrupa('gp'), gn: agrupa('gn') },
    patios: patios, por_dia: porDia, por_hora: porHora, funil: funil
  };
}
function APP(D, LOGO) {
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s === null || s === undefined ? '' : s)
    .split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;').split('"').join('&quot;');
  const nf = (n) => (n === null || n === undefined ? '—' : Number(n).toLocaleString('pt-BR'));
  const n1 = (n) => (n === null || n === undefined ? '—' : Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 1 }));
  const rs = (n) => (n === null || n === undefined ? '—' : 'R$ ' + Math.round(n).toLocaleString('pt-BR'));
  const pc = (x) => (x === null || x === undefined ? '—' : (100 * x).toFixed(1).replace('.', ',') + '%');
  const pc0 = (x) => (x === null || x === undefined ? '—' : Math.round(100 * x) + '%');
  const dt = (s) => (s ? s.slice(8, 10) + '/' + s.slice(5, 7) + '/' + s.slice(2, 4) + ' ' + s.slice(11, 16) : '—');
  const dia = (s) => (s ? s.slice(8, 10) + '/' + s.slice(5, 7) + '/' + s.slice(0, 4) : '—');
  const diaCod = (c) => c.slice(4, 6) + '/' + c.slice(2, 4);
  const FAROL = { sem: 'Sem oferta', abaixo: 'Oferta abaixo do VMV', atingiu: 'VMV atingido' };
  const tagStatus = (v) => {
    const nome = D.status_nome[v.status] || ('status ' + v.status);
    let cls = '';
    if (v.vendido) cls = 'ok';
    else if (v.status === 11 || v.status === 10) cls = 'ruim';
    else if ([14, 15, 18, 8].indexOf(v.status) >= 0) cls = 'atencao';
    return '<span class="tag ' + cls + '">' + esc(nome) + '</span>';
  };
  const lojaPorId = {};
  D.lojas.forEach((l) => { lojaPorId[l.id] = l; });
  const trilho = (x) => '<span class="trilho" aria-hidden="true"><i style="width:' +
    (x === null ? 0 : Math.max(0, Math.min(100, 100 * x))).toFixed(1) + '%"></i></span>';
  const semRepHtml = (r) => (r !== D.sem_rep ? esc(r) : '<span class="dim">' + esc(D.sem_rep) + '</span>');
  let sel = 'todos';
  let soNovas = false;
  const F = { col: 'gn', rep: '', dia: '', patio: '', farol: '', dia_hora: '' };
  const ordem = {
    lojas: { k: 'pontos', dir: -1 }, reps: { k: 'pontos', dir: -1 },
    veic: { k: 'score', dir: 1 }, patios: { k: 'veiculos', dir: -1 }
  };
  const TABELAS = {};
  function tabela(id, cols, linhas, fixo) {
    TABELAS[id] = { cols: cols, linhas: linhas, fixo: fixo };
    desenhaTabela(id);
  }
  function desenhaTabela(id) {
    const t = TABELAS[id];
    const o = ordem[id];
    const col = t.cols.find((c) => c.k === o.k) || t.cols[0];
    const val = (r) => (col.v ? col.v(r) : r[col.k]);
    const idx = t.linhas.map((r, i) => [r, i]);
    idx.sort((a, b) => {
      if (t.fixo) {
        const fa = t.fixo(a[0]) ? 1 : 0;
        const fb = t.fixo(b[0]) ? 1 : 0;
        if (fa !== fb) return fa - fb;
      }
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
    $('#tb-' + id).innerHTML = idx.length
      ? idx.map((p, i) => '<tr>' + t.cols.map((c) => '<td class="' + (c.n ? 'n' : '') + (c.cls ? ' ' + c.cls : '') + '">' +
          (c.h ? c.h(p[0], i) : esc(p[0][c.k])) + '</td>').join('') + '</tr>').join('')
      : '<tr><td colspan="' + t.cols.length + '" class="dim">Nada neste recorte.</td></tr>';
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
  const LARG_PADRAO = 640;
  function colunas(alvo, grupos, series, rotX, op) {
    op = op || {};
    const LARG = op.largura || LARG_PADRAO;
    let ALT = 210;
    if (op.preenche) {
      const cx = alvo.getBoundingClientRect();
      if (cx.width > 0 && cx.height > 0) ALT = Math.max(180, Math.round(LARG * cx.height / cx.width));
    }
    const n = grupos.length;
    if (!n) { alvo.innerHTML = '<p class="dim">Sem acesso no período.</p>'; return; }
    const topoVal = Math.max(1, Math.max.apply(null, grupos.map((g) => Math.max.apply(null, series.map((s) => g[s.k])))));
    const larguraTexto = (v) => String(nf(v)).length * 6.2 + 4;
    const maiorRot = Math.max.apply(null, grupos.map((g) => Math.max.apply(null, series.map((s) => larguraTexto(g[s.k])))));
    const slot0 = (LARG - 8) / n;
    const barra0 = Math.min(24, (slot0 - 6 - 2 * (series.length - 1)) / series.length);
    const comRotulo = barra0 + 2 >= maiorRot;
    const esq = comRotulo ? 4 : 40;
    const slot = (LARG - esq - 4) / n;
    const barra = Math.max(2, Math.min(24, (slot - 6 - 2 * (series.length - 1)) / series.length));
    const topo = comRotulo ? 18 : 10;
    const base = ALT - 22;
    const h = (v) => (base - topo) * v / topoVal;
    let s = '<svg class="graf" viewBox="0 0 ' + LARG + ' ' + ALT + '" role="img" aria-label="' + esc(alvo.getAttribute('data-rot')) + '">';
    if (!comRotulo) {
      const passo = Math.pow(10, Math.floor(Math.log(topoVal) / Math.LN10)) / 10;
      const pas = Math.max(1, [1, 2, 5, 10, 20, 50].map((m) => m * passo).find((p) => topoVal / p <= 5) || passo * 100);
      for (let v = 0; v <= topoVal; v += pas) {
        const y = base - h(v);
        s += '<line class="linha-grade" x1="' + esq + '" x2="' + (LARG - 4) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '"/>' +
          '<text class="eixo" x="' + (esq - 6) + '" y="' + (y + 3.5).toFixed(1) + '" text-anchor="end">' + nf(v) + '</text>';
      }
    } else {
      s += '<line class="linha-grade" x1="' + esq + '" x2="' + (LARG - 4) + '" y1="' + base + '" y2="' + base + '"/>';
    }
    const cadaX = Math.max(1, Math.ceil(n / Math.floor((LARG - esq) / 40)));
    grupos.forEach((g, i) => {
      const x0 = esq + i * slot;
      const chave = op.chave ? op.chave(g) : null;
      const marcado = chave !== null && chave === op.marcado;
      if (marcado) {
        s += '<rect class="marca-col" x="' + x0.toFixed(1) + '" y="' + topo + '" width="' + slot.toFixed(1) + '" height="' + (base - topo) + '"/>';
      }
      const larg = series.length * barra + 2 * (series.length - 1);
      const xi = x0 + (slot - larg) / 2;
      series.forEach((se, j) => {
        const v = g[se.k];
        const hh = h(v);
        const x = xi + j * (barra + 2);
        const y = base - hh;
        const r = Math.min(4, barra / 2, hh);
        if (hh > 0) {
          s += '<path class="' + se.cls + '" d="M' + x.toFixed(1) + ' ' + base + 'V' + (y + r).toFixed(1) +
            'Q' + x.toFixed(1) + ' ' + y.toFixed(1) + ' ' + (x + r).toFixed(1) + ' ' + y.toFixed(1) +
            'H' + (x + barra - r).toFixed(1) + 'Q' + (x + barra).toFixed(1) + ' ' + y.toFixed(1) + ' ' +
            (x + barra).toFixed(1) + ' ' + (y + r).toFixed(1) + 'V' + base + 'Z"/>';
        }
        if (comRotulo && v > 0) {
          s += '<text class="rotulo" x="' + (x + barra / 2).toFixed(1) + '" y="' + (y - 5).toFixed(1) + '" text-anchor="middle">' + nf(v) + '</text>';
        }
      });
      if (i % cadaX === 0 || marcado) {
        s += '<text class="eixo' + (marcado ? ' forte' : '') + '" x="' + (x0 + slot / 2).toFixed(1) + '" y="' + (ALT - 6) + '" text-anchor="middle">' + esc(rotX(g)) + '</text>';
      }
      const txt = '<b>' + esc(rotX(g)) + '</b>' + series.map((se) => '<br><span class="amostra ' + se.cls + '"></span>' +
        esc(se.nome) + ': ' + nf(g[se.k])).join('') + (chave !== null ? '<br><span class="dim">' +
        (marcado ? 'clique para voltar a todos os dias' : 'clique para ver as horas deste dia') + '</span>' : '');
      s += '<rect class="alvo' + (chave !== null ? ' clicavel' : '') + '" x="' + x0.toFixed(1) + '" y="' + topo + '" width="' + slot.toFixed(1) + '" height="' + (base - topo + 22) +
        '" tabindex="0" data-dica="' + esc(txt) + '"' + (chave !== null ? ' data-k="' + esc(chave) + '"' : '') + '/>';
    });
    alvo.innerHTML = s + '</svg>';
  }
  function funil(alvo, etapas) {
    const W = 640;
    const COL_ROT = 120;
    const COL_PC = 60;
    const FW = W - COL_ROT - COL_PC - 16;
    const ALT_F = 38;
    const VAO = 20;
    const v0 = etapas[0][1] || 0;
    const MIN_F = 3 * 7.4 + 16;
    const larg = etapas.map((f) => MIN_F + (FW - MIN_F) * (v0 ? f[1] / v0 : 0));
    const H = etapas.length * ALT_F + (etapas.length - 1) * VAO;
    const c = COL_ROT + 8 + FW / 2;
    let s = '<svg class="graf funil-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Funil de ativação dos novos cadastros">';
    etapas.forEach((f, i) => {
      const y = i * (ALT_F + VAO);
      const meio = y + ALT_F / 2 + 4.5;
      const wt = larg[i];
      const wb = i < etapas.length - 1 ? larg[i + 1] : Math.max(MIN_F, larg[i] * 0.94);
      const pts = [[c - wt / 2, y], [c + wt / 2, y], [c + wb / 2, y + ALT_F], [c - wb / 2, y + ALT_F]]
        .map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
      const pcTot = v0 ? pc0(f[1] / v0) : '—';
      const ant = i > 0 ? etapas[i - 1][1] : null;
      const txtN = nf(f[1]);
      const cabe = Math.min(wt, wb) >= txtN.length * 7.4 + 14;
      s += '<text class="f-rot" x="0" y="' + meio + '">' + esc(f[0]) + '</text>' +
        '<polygon class="f-forma" points="' + pts + '" tabindex="0" data-dica="' +
        esc('<b>' + esc(f[0]) + '</b><br>' + txtN + ' lojas · ' + pcTot + ' dos cadastrados' +
          (i ? '<br>' + (ant ? pc(f[1] / ant) : '—') + ' da etapa anterior' : '')) + '"/>' +
        (cabe
          ? '<text class="f-txt" x="' + c + '" y="' + meio + '" text-anchor="middle">' + txtN + '</text>'
          : '<text class="f-txt" x="' + (c + Math.max(wt, wb) / 2 + 6).toFixed(1) + '" y="' + meio + '">' + txtN + '</text>') +
        '<text class="f-pc" x="' + W + '" y="' + meio + '" text-anchor="end">' + pcTot + '</text>';
      if (i < etapas.length - 1) {
        s += '<text class="f-conv" x="' + c + '" y="' + (y + ALT_F + VAO / 2 + 4) + '" text-anchor="middle">' +
          '↓ ' + (etapas[i][1] ? pc(etapas[i + 1][1] / etapas[i][1]) : '—') + '</text>';
      }
    });
    alvo.innerHTML = s + '</svg>';
  }
  function opcoes(id, lista, rotTodos, atual) {
    const el = $('#' + id);
    el.innerHTML = '<option value="">' + esc(rotTodos) + '</option>' + lista.map((o) =>
      '<option value="' + esc(o[0]) + '"' + (o[0] === atual ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('');
    el.value = lista.some((o) => o[0] === atual) ? atual : '';
    return el.value;
  }
  function montaFiltros() {
    const base = calcula(D, sel, { col: F.col });
    const reps = {};
    D.lojas.forEach((l) => { reps[l[F.col]] = 1; });
    const listaReps = Object.keys(reps).filter((r) => r !== D.sem_rep).sort().concat(reps[D.sem_rep] ? [D.sem_rep] : []);
    F.rep = opcoes('f-rep', listaReps.map((r) => [r, r]), 'Todos os representantes', F.rep);
    $('#f-rep-rot').textContent = 'Representante (' + (F.col === 'gn' ? 'Usuário GN' : 'Usuário GP') + ')';
    F.dia = opcoes('f-dia', base.dias_periodo.map((c) => [c, diaCod(c) + '/' + c.slice(0, 2)]), 'Todas as datas', F.dia);
    F.patio = opcoes('f-patio', base.patios_evento.map((p) => [p, p]), 'Todos os pátios', F.patio);
    F.farol = opcoes('f-farol', [['sem', FAROL.sem], ['abaixo', FAROL.abaixo], ['atingiu', FAROL.atingiu]], 'Todos os status', F.farol);
    if (F.dia_hora && base.dias_periodo.indexOf(F.dia_hora) < 0) F.dia_hora = '';
  }
  function contaFiltros() {
    const n = ['rep', 'dia', 'patio', 'farol'].filter((k) => F[k]).length + (sel === 'todos' ? 0 : 1);
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
  [['f-rep', 'rep'], ['f-dia', 'dia'], ['f-patio', 'patio'], ['f-farol', 'farol']].forEach((p) => {
    $('#' + p[0]).addEventListener('change', (ev) => {
      F[p[1]] = ev.target.value;
      if (p[1] === 'dia') F.dia_hora = '';
      render();
    });
  });
  $('#limpar').addEventListener('click', () => {
    F.rep = ''; F.dia = ''; F.patio = ''; F.farol = ''; F.dia_hora = '';
    sel = 'todos';
    $('#f-evento').value = 'todos';
    alterna('seg-lojas', 'todas', (v) => { soNovas = v === 'novas'; });
    alterna('seg-reps', 'gn', (v) => { F.col = v; });
    montaFiltros();
    render();
  });
  function render() {
    contaFiltros();
    const R = calcula(D, sel, F);
    const k = R.kpi;
    const ev = sel === 'todos' ? null : R.eventos[0];
    $('#sub').textContent = (ev
      ? ev.nome + ' · ' + dt(ev.ini) + ' → ' + dt(ev.fim) + ' · ' + ev.estado
      : 'Canal de vendas C6 Auto · ' + D.eventos.length + ' eventos · ' + dt(R.periodo[0]) + ' → ' + dt(R.periodo[1])) +
      (['rep', 'dia', 'patio', 'farol'].some((x) => F[x]) ? ' · com filtros' : '');
    const pcBar = (idTxt, idBar, x, rot) => {
      $(idTxt).textContent = x === null ? '—' : pc(x) + ' ' + rot;
      $(idBar).innerHTML = trilho(x);
    };
    $('#k-pub').textContent = nf(k.publicados);
    pcBar('#k-pub-pc', '#k-pub-bar', k.publicados ? k.acessados / k.publicados : null, 'dos anúncios acessados');
    $('#k-pub-vend').textContent = nf(k.vendidos);
    $('#k-pub-vmv').textContent = nf(k.vmv_atingido);
    $('#k-of').textContent = nf(k.com_oferta);
    pcBar('#k-of-pc', '#k-of-bar', k.publicados ? k.com_oferta / k.publicados : null, 'dos publicados');
    $('#k-of-lj').textContent = nf(k.ofertantes);
    $('#k-of-lpl').textContent = n1(k.lances_por_lojista);
    $('#k-vd').innerHTML = nf(k.vendidos) + '<span class="kpi-val-2">' + rs(k.volume) + '</span>';
    pcBar('#k-vd-pc', '#k-vd-bar', k.publicados ? k.vendidos / k.publicados : null, 'dos publicados');
    $('#k-vd-comp').textContent = nf(k.compradores);
    $('#k-vd-ppl').textContent = n1(k.part_por_lojista);
    $('#k-nv').textContent = nf(k.novas);
    pcBar('#k-nv-pc', '#k-nv-bar', k.engajamento, 'de engajamento');
    $('#k-nv-of').textContent = nf(k.novas_ofertaram);
    $('#k-nv-cp').textContent = nf(k.novas_compraram);
    const reps = R.representantes[F.col].filter((g) => g.novas > 0);
    const nReps = reps.filter((g) => g.representante !== D.sem_rep).length;
    $('#n-reps').textContent = nReps + (nReps === 1 ? ' representante · ' : ' representantes · ') +
      (F.col === 'gn' ? 'Usuário GN' : 'Usuário GP');
    tabela('reps', [
      { k: 'representante', t: 'Representante', h: (g) => semRepHtml(g.representante) },
      { k: 'novas', t: 'Lojas', n: true, h: (g) => nf(g.novas) + '<span class="dim sub">novas, de ' + nf(g.lojas) + '</span>' },
      { k: 'acessos', t: 'Acessos', n: true, h: (g) => nf(g.acessos) },
      { k: 'lances', t: 'Ofertas', n: true, h: (g) => nf(g.lances) },
      { k: 'veic', t: 'Veículos', n: true, h: (g) => nf(g.veic) },
      { k: 'arrem', t: 'Arremates', n: true, h: (g) => nf(g.arrem) },
      { k: 'pontos', t: 'Pontos', n: true, cls: 'forte', h: (g) => nf(g.pontos) }
    ], reps, (g) => g.representante === D.sem_rep);
    const lojasVis = R.lojas.filter((r) => r.acessos > 0 && (!soNovas || r.nova));
    $('#n-lojas').textContent = lojasVis.length + (lojasVis.length === 1 ? (soNovas ? ' loja nova' : ' loja') : (soNovas ? ' lojas novas' : ' lojas'));
    tabela('lojas', [
      { k: 'nome', t: 'Loja', h: (r) => esc(r.nome) + (r.nova && !soNovas ? ' <span class="tag ok">nova</span>' : '') +
        '<span class="dim sub">' + semRepHtml(r[F.col]) + '</span>' },
      { k: 'acessos', t: 'Acessos', n: true, h: (r) => nf(r.acessos) },
      { k: 'lances', t: 'Ofertas', n: true, h: (r) => nf(r.lances) },
      { k: 'veic', t: 'Veículos', n: true, h: (r) => nf(r.veic) },
      { k: 'arrem', t: 'Arremates', n: true, h: (r) => nf(r.arrem) },
      { k: 'pontos', t: 'Pontos', n: true, cls: 'forte', h: (r) => (r.nova ? nf(r.pontos) : '<span class="dim">—</span>') }
    ], lojasVis);
    $('#n-funil').textContent = nf(R.funil[0][1]) + ' cadastros';
    funil($('#funil'), R.funil);
    $('#n-dia').textContent = nf(k.lojas_acessaram) + ' lojas';
    colunas($('#g-dia'), R.por_dia, [
      { k: 'total', nome: 'Total', cls: 'serie-b' },
      { k: 'novas', nome: 'Novos', cls: 'serie-a' }
    ], (g) => diaCod(g.dia), { preenche: true, chave: (g) => g.dia, marcado: F.dia_hora });
    $('#n-hora').textContent = nf(k.acessos) + ' acessos';
    $('#hora-dia').innerHTML = F.dia_hora
      ? 'em ' + diaCod(F.dia_hora) + ' <button type="button" class="limpa-dia" id="limpa-dia">todos os dias ✕</button>'
      : '';
    colunas($('#g-hora'), R.por_hora, [
      { k: 'total', nome: 'Total', cls: 'serie-b' },
      { k: 'novas', nome: 'Novos', cls: 'serie-a' }
    ], (g) => g.h + 'h', { largura: 1280 });
    $('#n-patios').textContent = R.patios.length + ' pátios';
    tabela('patios', [
      { k: 'patio', t: 'Pátio', cls: 'sem-quebra' },
      { k: 'veiculos', t: 'Veículos', n: true, h: (p) => nf(p.veiculos) },
      { k: 'acesso', t: 'C/ acesso', n: true, h: (p) => nf(p.acesso) },
      { k: 'oferta', t: 'C/ oferta', n: true, h: (p) => nf(p.oferta) },
      { k: 'conversao', t: '% conversão', n: true, h: (p) => pc(p.conversao) },
      { k: 'vmv', t: 'C/ VMV atingido', n: true, h: (p) => nf(p.vmv) },
      { k: 'pc_vmv', t: '% VMV atingido', n: true, h: (p) => pc(p.pc_vmv) }
    ], R.patios);
    $('#n-veic').textContent = R.veiculos.length + ' veículos';
    tabela('veic', [
      { k: 'nome', t: 'Veículo', h: (v) => '<span class="farol ' + v.farol + '" title="' + FAROL[v.farol] + '"></span>' +
        (v.link ? '<a href="' + esc(v.link) + '" target="_blank" rel="noopener">' + esc(v.nome) + ' ↗</a>' : esc(v.nome)) +
        '<span class="dim sub">' + esc(v.ano) + ' · ' + esc(v.patio) + '</span>' },
      { k: 'acessos', t: 'Acessos', n: true, h: (v) => nf(v.acessos) },
      { k: 'qtd', t: 'Ofertas', n: true, h: (v) => nf(v.qtd) },
      { k: 'ult', t: 'Última oferta', n: true, h: (v) => rs(v.ult) + (v.ult_quando ? '<span class="dim sub">' + dt(v.ult_quando) + '</span>' : '') },
      { k: 'fipe', t: 'FIPE', n: true, h: (v) => rs(v.fipe) },
      { k: 'pvmv', t: '% VMV', n: true, cls: 'c-vmv', h: (v) => (v.pvmv === null ? '<span class="dim">—</span>'
        : '<span class="vmv' + (v.pvmv >= 1 ? ' ok' : '') + '">' + trilho(v.pvmv) + '<span class="num">' + pc0(v.pvmv) + '</span></span>') },
      { k: 'score', t: 'Score', n: true, cls: 'forte', h: (v) => nf(v.score) },
      { k: 'status', t: 'Resultado', v: (v) => D.status_nome[v.status] || '', h: (v) => {
        if (v.arrematante === null) return tagStatus(v);
        const l = lojaPorId[v.arrematante] || {};
        return tagStatus(v) + '<span class="dim sub">' + esc(l.nome || ('loja ' + v.arrematante)) +
          (R.nova[v.arrematante] ? ' <span class="tag ok">novo</span>' : '') +
          ' · ' + semRepHtml(l[F.col] || D.sem_rep) + '</span>';
      } }
    ], R.veiculos);
  }
  function alterna(id, valor, aplica) {
    document.querySelectorAll('#' + id + ' button').forEach((b) =>
      b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === valor)));
    aplica(valor);
  }
  $('#seg-lojas').addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-v]');
    if (!b) return;
    alterna('seg-lojas', b.getAttribute('data-v'), (v) => { soNovas = v === 'novas'; });
    render();
  });
  $('#seg-reps').addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-v]');
    if (!b) return;
    alterna('seg-reps', b.getAttribute('data-v'), (v) => { F.col = v; F.rep = ''; });
    montaFiltros();
    render();
  });
  $('#g-dia').addEventListener('click', (ev) => {
    const r = ev.target.closest('rect[data-k]');
    if (!r) return;
    const c = r.getAttribute('data-k');
    F.dia_hora = F.dia_hora === c ? '' : c;
    escondeDica();
    render();
  });
  $('#g-dia').addEventListener('keydown', (ev) => {
    if (ev.key !== 'Enter' && ev.key !== ' ') return;
    const r = ev.target.closest('rect[data-k]');
    if (!r) return;
    ev.preventDefault();
    r.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  document.addEventListener('click', (ev) => {
    if (!ev.target.closest('#limpa-dia')) return;
    F.dia_hora = '';
    render();
  });
  let espera = null;
  window.addEventListener('resize', () => {
    clearTimeout(espera);
    espera = setTimeout(render, 150);
  });
  const evOrd = D.eventos.slice().sort((a, b) => (a.fim < b.fim ? 1 : -1));
  $('#f-evento').innerHTML = '<option value="todos">Todos os eventos (' + D.eventos.length + ')</option>' +
    evOrd.map((e) => '<option value="' + e.id + '">' + esc(e.nome) + ' · ' +
      calcula(D, e.id).eventos[0].estado + '</option>').join('');
  $('#f-evento').addEventListener('change', (ev) => {
    sel = ev.target.value === 'todos' ? 'todos' : Number(ev.target.value);
    montaFiltros();
    render();
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
  gaveta(false);
  montaFiltros();
  render();
}
DADOS.glossario = [
  ['Evento no painel', 'Evento que alveja o Canal de vendas C6 Auto (whitelabel 43) e termina a partir de ' +
    DADOS.dias + ' dias atrás: os abertos, os agendados e os encerrados recentes.'],
  ['Período', 'Da menor data de início à maior data de encerramento dos eventos filtrados. Acesso e cadastro fora dele não contam.'],
  ['Filtros', 'Na aba lateral. Pátio e status do veículo recortam os veículos, e tudo que nasce deles acompanha: lances, ofertantes, compradores, rankings, pátios e os degraus do funil que dependem de anúncio. Representante recorta as lojas, pela coluna GN ou GP escolhida acima dele: rankings, novos lojistas, funil, acessos e lances só das lojas dele. Data encolhe o período para aquele dia: acessos, cadastros, lances e vendas (pela data da oferta vencedora) daquele dia. Representante e Data não mudam a lista de veículos.'],
  ['Estado do evento', 'Agendado: as ofertas ainda não abriram. Em andamento: dentro do horário. Encerrando: passou do horário de fim e ainda há veículo ativo — os lances da prorrogação caem depois do fim oficial. Encerrado: nenhum veículo ativo.'],
  ['Veículo publicado', 'Cada negociação do evento. O mesmo carro em dois eventos conta uma vez em cada um.'],
  ['Anúncios acessados', 'Veículos que pelo menos uma loja abriu dentro do horário do evento, sobre os publicados.'],
  ['Com ofertas', 'Veículo que recebeu pelo menos um lance naquele evento. O percentual é sobre os publicados.'],
  ['Com VMV atingido', 'Veículo em que alguma oferta alcançou o valor mínimo de venda (VMV) que o vendedor aceita.'],
  ['Vendido / arremate', 'Negociação em aguardando pagamento, aguardando confirmação de pagamento ou vendido. O arrematante é a loja da oferta vencedora. Veículo em análise do vendedor ainda não conta.'],
  ['Ofertantes', 'Lojas distintas que deram pelo menos um lance.'],
  ['Compradores', 'Lojas distintas que arremataram pelo menos um veículo.'],
  ['Lances/lojista', 'Lances do recorte divididos pelos ofertantes.'],
  ['Participações/lojista', 'Participação é cada veículo em que a loja deu lance (vários lances no mesmo carro contam uma vez). Soma das participações dividida pelos ofertantes.'],
  ['Novos lojistas', 'Lojas do canal C6 cadastradas dentro do período.'],
  ['Engajamento', 'Novos lojistas que acessaram o canal no período divididos pelos cadastrados.'],
  ['Acessos da loja', 'Dias em que a loja acessou o canal C6 dentro do período, qualquer tela. O corte do período é por hora cheia: num evento que começa às 17:13, o acesso das 17:05 entra. O ranking de lojas mostra só quem acessou.'],
  ['Pontuação', 'Só loja nova pontua: ' + PONTOS.arremate + ' pontos por arremate e ' + PONTOS.dia +
    ' ponto por dia com acesso no período. As demais aparecem no ranking com "—". O ranking de representantes soma a pontuação das lojas de cada um e mostra só quem tem loja nova.'],
  ['Representante comercial', 'Usuário GP ou Usuário GN (escolhido no painel de filtros) da planilha de lojas ativas do C6, cruzada pelo CNPJ da loja. CNPJ fora da planilha, ou sem representante naquela coluna, fica como "Sem Representante". CNPJ com mais de um representante (filiais) fica com o que aparece em mais linhas; empate fica Sem Representante.'],
  ['Acessos do veículo', 'Lojas distintas que abriram o anúncio dentro do horário do evento. Uma loja que abriu dez vezes conta uma.'],
  ['Score do veículo', 'Acessos × ' + PESO_SCORE.acesso + ' + ofertas × ' + PESO_SCORE.oferta + ' + ' + PESO_SCORE.vmv +
    ' se alguma oferta atingiu o VMV. A tabela abre pelo menor score: os veículos que menos engajaram. Score, ofertas e farol são do veículo inteiro: os filtros escolhem quais veículos aparecem, não os recalculam.'],
  ['% VMV', 'A maior oferta do veículo dividida pelo VMV. 100% ou mais = VMV atingido.'],
  ['Resultado', 'O status da negociação e, quando vendeu, a loja arrematante — com o selo "novo" se é loja nova do período — e o representante dela.'],
  ['Pátio', 'Onde o veículo está (o estoque do anúncio). C/ acesso: veículos que alguma loja abriu. % conversão: veículos com oferta sobre os veículos do pátio. % VMV atingido: veículos com VMV atingido sobre os veículos do pátio.'],
  ['Acessos únicos por dia', 'Lojas distintas que acessaram o canal em cada dia do período — total e só as novas. Clicar num dia mostra as horas daquele dia no gráfico por hora; clicar de novo volta a todos os dias.'],
  ['Acessos por hora', 'Todos os acessos do período ao canal, somados por hora do dia — o total e só os das lojas novas —, do primeiro ao último horário com acesso.'],
  ['Funil de ativação', 'Os novos lojistas do período, etapa por etapa: o título à esquerda, o percentual sobre os cadastrados à direita, e a largura da faixa seguindo esse percentual: uma largura mínima (para o número caber dentro) somada em todas as etapas, mais a parte proporcional. Entre as faixas, a passagem de uma etapa para a seguinte. Aprovado: cadastro na situação 3, a de loja operante. Logaram: acessaram o canal no período. Acessaram: abriram algum anúncio de evento do filtro. Ofertaram e compraram: no recorte.'],
  ['Farol', 'A bolinha antes do veículo. Vermelho: sem oferta. Amarelo: há oferta, mas nenhuma chegou ao VMV (ou o VMV não foi informado). Verde: alguma oferta alcançou o VMV.'],
  ['Link do anúncio', 'Abre o anúncio na vitrine do C6 (compraveiculos.cars2you.com.br).']
];
const CSS_PAINEL = [
  '[hidden]{display:none!important}',
  '.marca .logo{height:26px}',
  '.aviso{position:relative}.aviso .cont{position:absolute;top:-5px;right:-5px;min-width:16px;height:16px;border-radius:8px;',
  'background:var(--negativo);color:var(--superficie);font-size:10px;font-weight:700;line-height:16px;text-align:center}',
  '#dica{position:fixed;z-index:40;top:calc(var(--topo-h) + 4px);right:20px;width:max-content;max-width:min(560px,92vw);',
  'background:var(--superficie);color:var(--texto);border:1px solid var(--borda-forte);border-radius:var(--r-m);',
  'box-shadow:var(--sombra);padding:12px 14px;font-size:12.5px;pointer-events:none}',
  '#dica ul{margin:6px 0 0;padding-left:18px}',
  '#dica-g{position:fixed;z-index:40;width:max-content;max-width:min(320px,92vw);background:var(--superficie);',
  'color:var(--texto);border:1px solid var(--borda-forte);border-radius:var(--r-p);box-shadow:var(--sombra);',
  'padding:8px 10px;font-size:12px;line-height:1.5;pointer-events:none;font-variant-numeric:tabular-nums}',
  '.kpi-pc{display:flex;flex-direction:column;gap:5px;margin-top:2px}',
  '.kpi-pc .txt{font-size:11.5px;font-weight:600;color:var(--texto-2)}',
  '.kpi-val-2{font-size:15px;font-weight:650;color:var(--texto-2);margin-left:10px;letter-spacing:0}',
  '.trilho{display:block;height:6px;border-radius:3px;background:var(--acento-veu);overflow:hidden;min-width:40px}',
  '.trilho i{display:block;height:100%;border-radius:3px;background:var(--acento-cheio)}',
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
  '.rolo.alto{max-height:560px;overflow:auto}.rolo.medio{max-height:440px;overflow:auto}',
  'table.dens thead th{text-align:left}table.dens tbody td{text-align:left}',
  'table.dens td.n,table.dens th.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}',
  'table.dens td.forte{font-weight:700}table.dens td.sem-quebra{white-space:nowrap}',
  'table.dens a{color:var(--texto);text-decoration:underline;text-underline-offset:2px}',
  '.dim{color:var(--texto-3)}.sub{display:block;font-size:11px}',
  '.farol{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:7px;vertical-align:1px}',
  '.farol.sem{background:var(--negativo)}.farol.abaixo{background:var(--farol-abaixo)}.farol.atingiu{background:var(--positivo)}',
  'td.c-vmv{min-width:120px}.vmv{display:inline-flex;align-items:center;gap:8px;justify-content:flex-end;width:100%}',
  '.vmv .trilho{width:64px;flex:none}.vmv.ok .trilho i{background:var(--positivo)}',
  '.g2i{display:grid;gap:var(--gap);grid-template-columns:1fr 1fr}@media (max-width:1100px){.g2i{grid-template-columns:1fr}}',
  '.g2i > .cartao,.g2 > .cartao{min-width:0}',
  '.legenda{display:flex;gap:14px;font-size:12px;color:var(--texto-2);margin:-4px 0 8px}',
  '.amostra{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:6px;vertical-align:-1px}',
  '.graf .serie-a,.amostra.serie-a{fill:var(--acento-cheio);background:var(--acento-cheio)}',
  '.graf .serie-b,.amostra.serie-b{fill:var(--serie-2);background:var(--serie-2)}',
  '.graf .alvo{fill:transparent;cursor:default}.graf .alvo:hover,.graf .alvo:focus{fill:var(--acento-veu);outline:none}',
  '.graf .alvo.clicavel{cursor:pointer}.graf .marca-col{fill:var(--acento-veu)}.graf .eixo.forte{fill:var(--texto);font-weight:700}',
  '.c-flex{display:flex;flex-direction:column}',
  '.preenche{flex:1;position:relative;min-height:220px}.preenche > svg{position:absolute;inset:0;width:100%;height:100%}',
  '.hora-dia{font-size:12px;font-weight:600;color:var(--texto-2)}',
  '.limpa-dia{font:inherit;font-size:11.5px;margin-left:6px;padding:2px 8px;border-radius:999px;cursor:pointer;',
  'border:1px solid var(--borda-forte);background:var(--superficie-2);color:var(--texto)}',
  '.funil-g{flex:1;display:flex;justify-content:center;align-items:center}',
  '.funil-svg{max-width:640px}',
  '.funil-svg .f-rot{fill:var(--texto);font-size:13px;font-weight:600}',
  '.funil-svg .f-pc{fill:var(--texto);font-size:13px;font-weight:700;font-variant-numeric:tabular-nums}',
  '.funil-svg .f-forma{fill:color-mix(in srgb,var(--acento-cheio) 20%,transparent);stroke:color-mix(in srgb,var(--acento-cheio) 45%,transparent);stroke-width:1;stroke-linejoin:round}',
  '.funil-svg .f-forma:hover,.funil-svg .f-forma:focus{fill:color-mix(in srgb,var(--acento-cheio) 30%,transparent);outline:none}',
  '[data-tema="escuro"] .funil-svg .f-forma{fill:rgba(255,255,255,.09);stroke:rgba(255,255,255,.20)}',
  '[data-tema="escuro"] .funil-svg .f-forma:hover,[data-tema="escuro"] .funil-svg .f-forma:focus{fill:rgba(255,255,255,.15)}',
  '.funil-svg .f-txt{fill:var(--texto);font-size:13px;font-weight:650;font-variant-numeric:tabular-nums;pointer-events:none}',
  '.funil-svg .f-conv{fill:var(--texto-3);font-size:11px;font-weight:600;font-variant-numeric:tabular-nums}',
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
  '.fg .seg{display:flex;width:100%}.fg .seg button{flex:1;width:auto}',
  '.nota{font-size:12px;color:var(--texto-2);margin-top:14px;line-height:1.5}',
  '.area{padding-left:52px}',
  '@media(max-width:620px){.area{padding-left:12px}.aba{top:auto;bottom:16px;transform:none;flex-direction:row}',
  '.aba .rot{writing-mode:horizontal-tb}}',
  '@media (prefers-reduced-motion:reduce){.gaveta{transition:none}}'
].join('');
const ICONE = {
  veiculo: '<path d="M3 13l2-5a2 2 0 012-1h10a2 2 0 012 1l2 5v5h-3M6 18H3v-5h18"/><circle cx="7.5" cy="16.5" r="1.5"/><circle cx="16.5" cy="16.5" r="1.5"/>',
  oferta: '<path d="M12 2v20"/><path d="M17 6H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>',
  vendido: '<path d="M20 6L9 17l-5-5"/>',
  nova: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
  rank: '<path d="M4 6h16"/><path d="M4 12h11"/><path d="M4 18h6"/>',
  pessoa: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>',
  grafico: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
  funil: '<path d="M3 4h18l-7 9v6l-4 2v-8z"/>',
  patio: '<path d="M3 21h18M5 21V8l7-4 7 4v13"/><path d="M9 21v-5h6v5"/>',
  filtros: '<path d="M3 5h18M6 12h12M10 19h4"/>',
  gloss: '<path d="M4 19V5a2 2 0 012-2h13v18H6a2 2 0 01-2-2z"/><path d="M4 19a2 2 0 012-2h13"/>'
};
const chip = (k) => '<span class="chip" aria-hidden="true"><svg viewBox="0 0 24 24">' + ICONE[k] + '</svg></span>';
const kpiCard = (ic, rot, idVal, meio, pe) =>
  '<article class="cartao"><div class="cartao-topo">' + chip(ic) + '<span class="kpi-rot">' + rot + '</span></div>' +
  '<p class="kpi-val num" id="' + idVal + '">—</p>' + meio +
  '<dl class="kpi-pe">' + pe.map((p) => '<div><dt>' + p[0] + '</dt><dd class="num" id="' + p[1] + '">—</dd></div>').join('') +
  '</dl></article>';
const meioPc = (idTxt, idBar) => '<div class="kpi-pc"><span class="txt num" id="' + idTxt + '">—</span><span id="' + idBar + '"></span></div>';
const topoCartao = (ic, titulo, idN, extra) => '<div class="cartao-topo">' + chip(ic) + '<h2>' + titulo + '</h2>' +
  '<span class="dir">' + (extra || '') + '<span class="tag" id="' + idN + '">—</span></span></div>';
const cartaoOrdenavel = (ic, titulo, idN, id, rolo, extra) =>
  '<section class="cartao">' + topoCartao(ic, titulo, idN, extra) +
  '<div class="rolo ' + rolo + '"><table class="dens"><thead><tr id="th-' + id + '"></tr></thead>' +
  '<tbody id="tb-' + id + '"></tbody></table></div></section>';
const LEGENDA = '<div class="legenda"><span><span class="amostra serie-b"></span>Total</span>' +
  '<span><span class="amostra serie-a"></span>Novos</span></div>';
const seg = (id, rot, opcoes, ativo) => '<span class="seg" id="' + id + '" role="group" aria-label="' + rot + '">' +
  opcoes.map((o) => '<button type="button" data-v="' + o[0] + '" aria-pressed="' + (o[0] === ativo) + '">' + o[1] + '</button>').join('') +
  '</span>';
const filtro = (id, rotulo) => '<div class="fg"><label for="' + id + '" id="' + id + '-rot">' + rotulo + '</label>' +
  '<select class="ctrl" id="' + id + '"></select></div>';
const dadosJs = JSON.stringify(DADOS).split('<').join(String.fromCharCode(92) + 'u003c');
const logoJs = JSON.stringify(LOGO);
const html = '<!doctype html><html lang="pt-BR" data-tema="claro"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width, initial-scale=1">' +
  '<title>Painel de Eventos C6</title><style>' + CSS_TEMA + CSS_PAINEL + '</style></head><body>' +
  '<header class="topo"><div class="topo-in">' +
  '<span class="marca"><img class="logo" id="logo" src="" alt="C6 Bank"></span>' +
  '<div class="topo-tit"><h1>Painel de Eventos C6</h1><p class="sub" id="sub"></p></div>' +
  '<div class="topo-acoes">' +
  '<button class="ctrl so-icone aviso" id="b-aviso" type="button" hidden aria-label="Pontos de atenção">' +
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/></svg>' +
  '<span class="cont"></span></button>' +
  '<button class="ctrl so-icone" id="b-tema" type="button" aria-label="Mudar o tema"></button>' +
  '</div></div></header><div id="dica" hidden></div><div id="dica-g" hidden></div>' +
  '<button id="aba" class="aba" type="button" aria-expanded="false" aria-controls="gaveta">' +
  '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICONE.filtros + '</svg><span class="rot">Filtros</span>' +
  '<span class="n" id="aba-n" hidden></span></button>' +
  '<div id="veu" class="veu" hidden></div>' +
  '<aside id="gaveta" class="gaveta" aria-label="Filtros"><div class="cartao">' +
  '<div class="cartao-topo">' + chip('filtros') + '<h2>Filtros</h2>' +
  '<button id="fecha" class="fechar" type="button" aria-label="Fechar filtros">×</button></div>' +
  '<div class="filtros">' +
  filtro('f-evento', 'Evento') +
  '<div class="fg"><span class="rot-fg" id="seg-lojas-rot">Lojistas</span>' +
  seg('seg-lojas', 'Lojistas', [['todas', 'Todos lojistas'], ['novas', 'Somente novos']], 'todas') + '</div>' +
  '<div class="fg"><span class="rot-fg" id="seg-reps-rot">Coluna do representante</span>' +
  seg('seg-reps', 'Coluna do representante', [['gn', 'Usuário GN'], ['gp', 'Usuário GP']], 'gn') + '</div>' +
  filtro('f-rep', 'Representante') + filtro('f-dia', 'Data') + filtro('f-patio', 'Pátio') +
  filtro('f-farol', 'Status do veículo') +
  '<div class="fg"><button class="ctrl" id="limpar" type="button">Limpar filtros</button></div>' +
  '</div>' +
  '<p class="nota"><b>Pátio</b> e <b>status do veículo</b> recortam os veículos: KPIs, rankings, pátios, funil e a lista de veículos acompanham. ' +
  '<b>Evento</b> escolhe o recorte inteiro. <b>Lojistas</b> vale só para o ranking de lojas. <b>Representante</b> recorta as lojas, pela coluna GN ou GP escolhida acima dele. <b>Data</b> encolhe o período para aquele dia. ' +
  'Representante e Data não mudam a lista de veículos, e nenhum filtro recalcula o score, as ofertas ou o farol de um veículo.</p>' +
  '</div></aside>' +
  '<main class="area">' +
  '<section class="g4" aria-label="Indicadores">' +
  kpiCard('veiculo', 'Veículos publicados', 'k-pub', meioPc('k-pub-pc', 'k-pub-bar'),
    [['Vendidos', 'k-pub-vend'], ['Com VMV atingido', 'k-pub-vmv']]) +
  kpiCard('oferta', 'Com ofertas', 'k-of', meioPc('k-of-pc', 'k-of-bar'),
    [['Ofertantes', 'k-of-lj'], ['Lances/lojista', 'k-of-lpl']]) +
  kpiCard('vendido', 'Vendidos', 'k-vd', meioPc('k-vd-pc', 'k-vd-bar'),
    [['Compradores', 'k-vd-comp'], ['Participações/lojista', 'k-vd-ppl']]) +
  kpiCard('nova', 'Novos lojistas', 'k-nv', meioPc('k-nv-pc', 'k-nv-bar'),
    [['Ofertaram', 'k-nv-of'], ['Compraram', 'k-nv-cp']]) +
  '</section>' +
  '<section class="g2i">' +
  cartaoOrdenavel('pessoa', 'Ranking de representantes', 'n-reps', 'reps', 'medio') +
  cartaoOrdenavel('rank', 'Ranking de lojas', 'n-lojas', 'lojas', 'medio') +
  '</section>' +
  '<section class="g2i">' +
  '<article class="cartao c-flex">' + topoCartao('funil', 'Funil de ativação dos novos cadastros', 'n-funil') +
  '<div class="funil-g" id="funil"></div></article>' +
  '<article class="cartao c-flex">' + topoCartao('grafico', 'Acessos únicos por dia', 'n-dia') +
  LEGENDA + '<div class="preenche" id="g-dia" data-rot="Acessos únicos por dia: lojas distintas que acessaram o canal, total e novas"></div></article>' +
  '</section>' +
  '<article class="cartao">' + topoCartao('relogio', 'Acessos por hora do dia', 'n-hora', '<span class="hora-dia" id="hora-dia"></span>') +
  LEGENDA + '<div id="g-hora" data-rot="Acessos ao canal por hora do dia, total e das lojas novas"></div></article>' +
  cartaoOrdenavel('patio', 'Pátios', 'n-patios', 'patios', '') +
  cartaoOrdenavel('veiculo', 'Veículos', 'n-veic', 'veic', 'alto') +
  '<details class="cartao gloss" id="gloss"><summary class="cartao-topo">' + chip('gloss') + '<h2>Glossário</h2>' +
  '<span class="dir"><span class="tag" id="gloss-n">—</span><span class="seta" aria-hidden="true">▾</span></span>' +
  '</summary><dl id="gloss-lista"></dl></details>' +
  '<p class="rodape">Atualizado em <span id="gerado">—</span> · <span id="base"></span></p>' +
  '</main><script>' +
  calcula.toString() + APP.toString() +
  'APP(' + dadosJs + ',' + logoJs + ');' +
  '</script></body></html>';
const todos = calcula(DADOS, 'todos', {});
const resumo = {
  eventos: eventos.length, veiculos: veiculos.length, ofertas: ofertas.length,
  lojas_cadastro: lojas.length,
  acessos: { loja_dia_hora: acessos.length, partes: PARTES, anuncio: acessoAnuncio.length },
  representantes: {
    linhas_planilha: planilha.length, cnpjs_planilha: Object.keys(votos.gp).length,
    gp: contaRep.gp, gn: contaRep.gn
  },
  kpi: todos.kpi,
  funil: todos.funil,
  patios: todos.patios.length,
  por_evento: eventos.map((e) => {
    const r = calcula(DADOS, e.id, {});
    return { id: e.id, estado: r.eventos[0].estado, kpi: r.kpi, funil: r.funil };
  }),
  top_lojas: todos.lojas.slice(0, 5).map((r) => ({ loja: r.loja, pontos: r.pontos, arrem: r.arrem, acessos: r.acessos, nova: r.nova })),
  avisos: avisos,
  bytes_html: html.length
};
if (CSS_TEMA.length < 5000) throw new Error('CSS do tema nao injetado (rode _aplica-modelo.js)');
if (!LOGO.claro || !LOGO.escuro) throw new Error('logos nao injetadas (rode _aplica-modelo.js)');
return [{ json: { html: html, resumo: resumo } }];
