# Radar de Estoque — indicadores medidos

> Cada número traz data e como foi medido. O significado das tabelas está em
> [`plataforma/dominios.md`](../../plataforma/dominios.md).

## Run 53859 — primeira execução com as compras (2026-09-25, 10:36)

Execução manual, sucesso, **16min48s**. Comparada com o run **53827** (cron das 07h do
mesmo dia, sem as compras, 16min24s). Lido do `runData` das duas execuções.

| medida | 53827 | 53859 |
|---|---:|---:|
| MCP Fase 2 | — | 975,3s |
| Montar HTML | 4,8s | 4,9s |
| run inteiro | 984s | 1.008s (**+24s**) |
| `q_ofertas`: chamadas / linhas / erro | 27 / 1.314 / nenhum | 27 / 1.315 / nenhum |

**A marcação da oferta vencedora não duplicou oferta.** Das 742 lojas publicadas nos dois,
14 mudaram `qt_ofertas`, todas **para cima** e no máximo +6. São as ofertas que entraram
nas 3,5h entre um run e outro. Nenhuma loja ficou com mais compras que ofertas.

Compras nos últimos 6 meses, sobre as 745 lojas publicadas:

| medida | valor |
|---|---:|
| lojas com pelo menos uma compra | 638 (85,6%) |
| compras | 5.405 |
| valor comprado | R$ 383.308.235 |
| ticket médio por loja, mediana | R$ 51.198 |
| maior volume de uma loja | 150 compras (R$ 4,1 mi) em 1.289 ofertas |

Referência de ordem de grandeza: a Cars2You inteira tem 47.415 vendas em toda a história
(`precificacao/indicadores.md`).

## Run 53433 — primeira execução com a trava de grupo (2026-09-23, 19:41)

Execução manual, sucesso, **16min15s** do início ao fim. Tempos lidos do `runData` da
execução.

| nó | duração |
|---|---:|
| Baixar Carteira | 3,1s |
| Montar Fase 1 | 1,4s |
| MCP Fase 1 (30 chamadas) | 15,1s |
| Montar Fase 2 | 1,8s |
| **MCP Fase 2 (210 chamadas)** | **943,3s** |
| Montar HTML | 5,6s |
| Virar Arquivo | 0,6s |
| Subir no SharePoint | 3,1s |

Comparação com o run **53411** (21:31 do mesmo dia, sem a trava, 183 chamadas na fase 2):
MCP Fase 2 em 896,5s. A trava custou **+27 chamadas e +47s** (~1,7s por chamada a mais,
menos que os ~4s estimados pela VPN).

⚠️ **O banco estava mais lento que no run 53272** (anterior a 23/09): 4,5 a 4,9s por
chamada, contra 2,9s. A estimativa de 10 a 13 minutos para o MCP Fase 2, feita com base no
53272, errou para menos: os dois runs de 23/09 passaram de 15 minutos.

Resultado:

| medida | valor |
|---|---:|
| veículos | 1.032, em 31 eventos |
| lojas na base | 1.316 (1.309 com grupo) |
| lojas publicadas (em algum par) | 742 |
| pares publicados | 30.728 (teto de 30 por veículo) |
| **pares cortados pela trava de grupo** | **31.275** |
| veículos sem loja por causa do grupo | 0 |
| cobertura de `q_modelo` e `q_categoria` | 1.316 e 1.316 (a regressão do run 53385 acabou) |

Todas as oito consultas de loja e veículo vieram sem erro e sem página cortada. Único aviso
fora do esperado: 1 veículo veio duas vezes do banco e foi descartado (a `q_veiculos` não
mudou neste run).

## Trava por grupo de cliente — quanto cortaria (2026-09-23)

Medido por conexão direta (`consulta.py --base cars2you`) sobre o recorte do
dia: 31 eventos com fim entre 23/09 e 30/09, 1.042 veículos disponíveis e
1.316 lojas da base (canais 4, 7, 43, 48, 62, 65, com oferta nos últimos 6
meses). "Par" é veículo × loja que passa na regra de elegibilidade, antes do
corte de aderência.

| regra | pares | variação |
|---|---:|---:|
| só whitelabel (hoje) | 985.388 | — |
| whitelabel + grupo, loja herda grupo de **todos** os usuários | 946.875 | −3,9% |
| whitelabel + grupo, ignorando usuários com **mais de 10 lojas** | 912.972 | −7,3% |

O corte se concentra em poucos eventos. Números da variante sem
super-usuários:

| evento | veículos | lojas hoje | lojas com a trava |
|---|---:|---:|---:|
| 23995 | 21 | 234 | 1 |
| 24001 | 20 | 944 | 319 |
| 24008 | 53 | 944 | 319 |

Nos demais, entre 88% e 99% das lojas continuam elegíveis, porque os grupos
alvejados são largos (ver `dominios.md`).

### Custo no banco, por passada única pela VPN

Medido com o SQL exato gerado pelos nós, depois da implementação.

| consulta | linhas | tempo | páginas no MCP |
|---|---:|---:|---:|
| `q_loja_grupos` (`GROUP_CONCAT`, uma linha por loja) | 1.309 | ~4,1s por página | 27 |
| `q_lojas_grupo_total` (gabarito de cobertura) | 1 | ~4,1s | 1 |
| `q_evento_grupo` (pares evento × grupo, 14 inativos) | 156 | ~2,3s | 8 |
| `q_evgr_total` | 1 | ~2,5s | 1 |

🔴 A primeira versão de `q_loja_grupos` juntava `client_groups` (para filtrar grupo ativo)
e filtrava só os grupos alvejados pelos eventos: **20 a 36s por página**. O plano começava
por `client_groups` e refazia o `EXISTS` de oferta para cada par loja × grupo. Sem os dois
filtros, que não mudam o resultado do cruzamento, caiu para ~4s. A maior lista de grupos
por loja tem 93 caracteres.
