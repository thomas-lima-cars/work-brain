# Palavras-chave — o dicionário do texto livre

> O que procurar em `vehicles.description` e o que cada expressão vale. Serve
> para **interpretar um pedido sem reabrir o banco**: se a pergunta é "quanto
> pesa não ter chave", a resposta está aqui.
>
> 🔴 **A fonte viva é `automations/precificacao/analisa-sinais.py`.** Editar lá
> é o jeito de mudar a análise; este arquivo é o retrato legível dela, de
> 2026-09-18. Números em [`indicadores.md`](indicadores.md).

## Como o casamento funciona

1. O texto é **normalizado**: minúsculo, sem acento, pontuação vira espaço.
2. Token que é **só número com mais de 2 dígitos sai da sequência** — por isso
   `motor 12345 funciona` casa com `motor funciona`, e busca por substring no
   texto cru **não acharia**.
3. A **negação tem prioridade**: `nao funciona com chave` contém `com chave`.
   Toda regra positiva só vale se a negativa não casou antes.
4. Peça avariada conta quando aparece a **até 40 caracteres** de uma palavra de
   dano, sem atravessar `.`, `;` ou `/`.

## Os sete grupos


### Avarias (itens avariados, amassados)

| expressão | regra | vendas | efeito |
|---|---|---:|---:|
| Para-choque | `para\ choque[^.;/]{0,40}?(avari\w*|amassad\w*|que…` | 4.385 | +0.5 p.p. |
| Capô | `capo[^.;/]{0,40}?(avari\w*|amassad\w*|quebrad\w*|…` | 2.103 | +1.8 p.p. |
| Porta | `porta[^.;/]{0,40}?(avari\w*|amassad\w*|quebrad\w*…` | 2.065 | +0.7 p.p. |
| Paralama | `paralama[^.;/]{0,40}?(avari\w*|amassad\w*|quebrad…` | 1.291 | +0.9 p.p. |
| Para-brisa | `para\ brisa[^.;/]{0,40}?(avari\w*|amassad\w*|queb…` | 1.151 | +0.6 p.p. |
| Pintura | `pintura[^.;/]{0,40}?(avari\w*|amassad\w*|quebrad\…` | 1.176 | -0.3 p.p. |
| Retrovisor | `retrovisor[^.;/]{0,40}?(avari\w*|amassad\w*|quebr…` | 1.097 | +0.4 p.p. |
| Roda | `roda[^.;/]{0,40}?(avari\w*|amassad\w*|quebrad\w*|…` | 962 | -0.8 p.p. |
| Tampa | `tampa[^.;/]{0,40}?(avari\w*|amassad\w*|quebrad\w*…` | 777 | +1.7 p.p. |
| Motor (avaria) | `motor[^.;/]{0,40}?(avari\w*|amassad\w*|quebrad\w*…` | 833 | +1.8 p.p. |
| Teto | `teto[^.;/]{0,40}?(avari\w*|amassad\w*|quebrad\w*|…` | 623 | +1.3 p.p. |
| Porta-malas | `porta\ malas[^.;/]{0,40}?(avari\w*|amassad\w*|que…` | 585 | +1.1 p.p. |
| Lanterna | `lanterna[^.;/]{0,40}?(avari\w*|amassad\w*|quebrad…` | 476 | +2.8 p.p. |
| Caixa de ar | `caixa\ de\ ar[^.;/]{0,40}?(avari\w*|amassad\w*|qu…` | 473 | +1.4 p.p. |
| Pneu | `pneu[^.;/]{0,40}?(avari\w*|amassad\w*|quebrad\w*|…` | 440 | +2.3 p.p. |
| Calota | `calota[^.;/]{0,40}?(avari\w*|amassad\w*|quebrad\w…` | 361 | -0.3 p.p. |
| Lataria | `lataria[^.;/]{0,40}?(avari\w*|amassad\w*|quebrad\…` | 374 | +0.4 p.p. |
| Banco | `banco[^.;/]{0,40}?(avari\w*|amassad\w*|quebrad\w*…` | 336 | +3.4 p.p. |
| Painel | `painel[^.;/]{0,40}?(avari\w*|amassad\w*|quebrad\w…` | 280 | +1.8 p.p. |
| Farol | `farol[^.;/]{0,40}?(avari\w*|amassad\w*|quebrad\w*…` | 285 | +2.2 p.p. |
| Para-brisa (junto) | `parabrisa[^.;/]{0,40}?(avari\w*|amassad\w*|quebra…` | 167 | +1.7 p.p. |
| Coluna | `coluna[^.;/]{0,40}?(avari\w*|amassad\w*|quebrad\w…` | 152 | +1.0 p.p. |
| Grade | `grade[^.;/]{0,40}?(avari\w*|amassad\w*|quebrad\w*…` | 163 | +1.3 p.p. |
| Para-lama (separado) | `para\ lama[^.;/]{0,40}?(avari\w*|amassad\w*|quebr…` | 154 | +2.3 p.p. |
| Bateria | `bateria[^.;/]{0,40}?(avari\w*|amassad\w*|quebrad\…` | 109 | +2.5 p.p. |
| Faróis | `farois[^.;/]{0,40}?(avari\w*|amassad\w*|quebrad\w…` | 111 | +7.0 p.p. |
| Câmbio | `cambio[^.;/]{0,40}?(avari\w*|amassad\w*|quebrad\w…` | 93 | +2.2 p.p. |
| Vidro | `vidro[^.;/]{0,40}?(avari\w*|amassad\w*|quebrad\w*…` | 63 | +4.1 p.p. |
| Maçaneta | `macaneta[^.;/]{0,40}?(avari\w*|amassad\w*|quebrad…` | 63 | +3.7 p.p. |
| Estofado | `estofado[^.;/]{0,40}?(avari\w*|amassad\w*|quebrad…` | 56 | +4.2 p.p. |
| Friso | `friso[^.;/]{0,40}?(avari\w*|amassad\w*|quebrad\w*…` | 49 | +1.7 p.p. |
| Arranhões e avarias em geral | `arranhoes e avarias em geral` | 4.677 | -0.2 p.p. |

### Itens presentes

| expressão | regra | vendas | efeito |
|---|---|---:|---:|
| Chave | `\bcom chave\b` | 3.915 | -2.0 p.p. |
| Itens de segurança | `possui itens de seguranca` | 4.141 | -2.3 p.p. |
| Estepe | `\bcom estepe\b` | 4.788 | -2.1 p.p. |
| Manual | `\bcom manual\b` | 706 | -2.3 p.p. |

### Itens faltantes

| expressão | regra | vendas | efeito |
|---|---|---:|---:|
| Chave ausente ou não funciona | `\bsem chave\b|nao funciona com chave|nao possui c…` | 907 | +4.7 p.p. |
| Sem itens de segurança | `nao possui itens de seguranca` | 804 | +3.4 p.p. |
| Sem estepe | `\bsem estepe\b` | 472 | +4.5 p.p. |
| Sem manual | `\bsem manual\b` | 2.391 | +0.7 p.p. |

### Veículo funcionando (ou não)

| expressão | regra | vendas | efeito |
|---|---|---:|---:|
| Motor em funcionamento | `motor em funcionamento` | 3.946 | -2.1 p.p. |
| Motor não funciona | `motor nao funciona|motor sem funcionamento|nao fu…` | 748 | +5.8 p.p. |

### Tipo de uso

| expressão | regra | vendas | efeito |
|---|---|---:|---:|
| Frota | `\bfrota\b` | 598 | +1.3 p.p. |

### Dívidas do veículo (IPVA, multas e etc)

| expressão | regra | vendas | efeito |
|---|---|---:|---:|
| IPVA pago | `ipva\s*\w*\s*pago` | 2.094 | -1.2 p.p. |
| IPVA por conta do banco | `ipva[^.]{0,40}por conta do (banco|comitente|vende…` | 1.146 | -0.3 p.p. |
| IPVA por conta do comprador | `ipva[^.]{0,40}por conta do comprador` | 365 | +2.8 p.p. |
| Multas citadas | `\bmultas?\b` | 808 | +0.6 p.p. |
| Débitos por conta do comprador | `debitos[^.]{0,60}(comprador|adquirente)` | 653 | +1.5 p.p. |
| Licenciamento citado | `licenciamento` | 526 | +0.8 p.p. |

### Pendências/Irregularidades na documentação

| expressão | regra | vendas | efeito |
|---|---|---:|---:|
| Documento pronto | `documento pronto|doc pronto` | 4.399 | -0.9 p.p. |
| Documento em regularização | `documento em regularizacao|doc em regularizacao` | 696 | +2.1 p.p. |
| Remarcado | `remarcad` | — | não medido |

## Bloqueios — a negação que contém a afirmação

| positiva | só vale se NÃO casar |
|---|---|
| `com chave` | `sem chave`, `nao funciona com chave`, `nao possui chave` |
| `possui itens de seguranca` | `nao possui itens de seguranca` |
| `com estepe` | `sem estepe` |
| `com manual` | `sem manual` |
| `motor em funcionamento` | `motor nao funciona`, `motor sem funcionamento` |
| `documento pronto` | `documento em regularizacao` |

## O que ficou de fora, e por quê

| expressão | por quê |
|---|---|
| `nao mencionamos sobre o funcionamento do motor` | Cláusula de contrato, em 71,4% das vendas. Não fala daquele carro |
| `checagem sob responsabilidade do comprador` | Idem, 82,8% |
| `regularizacao e despesas por conta do comprador` | Diz quem paga, não o estado do veículo |
| `Crivo` | Removido a pedido em 17/09. Era o maior efeito da lista (+11,9 p.p., 67 vendas), mas é procedimento de checagem |
| `Baixa / sinistrado` | Removido a pedido. `baixa` também aparece em contexto administrativo |

## ⚠️ Achados de texto que NÃO se transferem entre bases

| expressão | Cars2You | Dealers |
|---|---|---|
| `REPASSE` / `TRADICIONAL` | **7,0 p.p., o maior efeito do estudo** | **não existe** |
| `crivo`, `frota`, `baixa`, `multas`, `licenciamento` | não aparecem | aparecem |

**O método viaja; os achados, não.** Antes de levar um número de texto de uma
operação para a outra, conferir se a expressão existe lá.

