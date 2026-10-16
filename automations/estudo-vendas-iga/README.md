# Estudo de Vendas IGA

Estudo em **HTML estático** — sem workflow, sem n8n. Responde: a performance de vendas do
IGA (Itaú) caiu por causa do deságio baixo? E os compradores mudaram de comportamento?

```bash
python extrai.py                      # VPN. Cars2You → dados-brutos.json
python analise.py                     # → resultados.json (+ compradores-ids.json)
python extrai_compradores.py          # VPN. nome de toda loja compradora + ofertas e acessos dos candidatos a "parou"
python analise.py                     # de novo, agora com os nomes
node monta-estudo.js                  # molde + tema + logo → estudo-vendas-iga.html
```

Números e definições: [`indicadores.md`](../../context/banco-de-dados/projetos/vendas-iga/indicadores.md).
Layout: `design/tokens/tema.css` + `tema-iga.css` (cores e logo da marca em `design/marca/iga/`).

| arquivo | o que é |
|---|---|
| `extrai.py` | duas fatias: **todas** as negociações do IGA (vendidas ou não) e **todas** as vendas dos demais vendedores |
| `analise.py` | agregados cluster × mês (êxito, % sobre a FIPE, diferença para o esperado de mercado, faixas de pedido) e compradores esparsos. A regressão tem efeito fixo de modelo e IGA×mês |
| `monta-estudo.js` | gera o HTML: método, glossário e notas estáticas. **O cálculo mora na página** (`estudo.template.html`), que refaz tudo para os clusters marcados |
| `estudo.template.html` | o molde (edite aqui, não no HTML gerado) |

🔒 `dados-*.json`, `compradores-*.json`, `resultados.json` e o HTML gerado ficam **fora do git**:
têm nome de loja compradora. O HTML é de uso interno.

⚠️ Dois cuidados que valem para qualquer refação:
- A FIPE do anúncio do IGA só existe para quem vendeu até 3T/25. Deságio exigido (1 − VMV/FIPE)
  só enxerga o que vendeu; por isso o pedido é medido em reais contra o preço de comparáveis.
- O cluster mudou de classificação em 2025 (C1–C6 → G1–G17, sem sobreposição): o filtro de cluster não dá série contínua.
- O mês corrente é parcial e sai das séries (`ULTIMO` em `analise.py`).
