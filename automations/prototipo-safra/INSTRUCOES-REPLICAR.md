# Instruções — Replicar o HTML do protótipo em outra máquina (com Claude)

> **Objetivo:** regenerar o arquivo `relatorio-c6-PROTO-safra-atual.html` — **idêntico** — em outra máquina.
> **Não precisa** de n8n, banco de dados, credenciais nem internet: os dados já estão **embarcados** nos JSONs.
> Só precisa de **Python 3** + os arquivos desta pasta.

---

## Para o operador (humano)

1. Copie a pasta inteira **`prototipo-safra/`** para a outra máquina (pode ser um `.zip`). Ela deve conter:
   ```
   prototipo-safra/
   ├── build_proto.py                       (o gerador)
   ├── relatorio-c6-original-baseline.html  (fonte)
   ├── relatorio-c6-PROTO-safra-atual.html  (resultado esperado — referência)
   ├── INSTRUCOES-REPLICAR.md               (este arquivo)
   ├── HANDOFF-PROTOTIPO-SAFRA.md           (contexto completo, opcional)
   └── dados/
       ├── coorte_all.json
       ├── coorte_wl.json
       ├── wl_list.json
       ├── recencia.json
       ├── situacao.json
       └── status.json
   ```
2. Abra o **Claude Code** (terminal, app ou IDE) **dentro dessa pasta** (ou aponte-o para ela).
3. Cole o prompt abaixo para o Claude.

---

## Prompt para colar no Claude (outra máquina)

```
Preciso replicar um HTML a partir de um gerador Python. Nesta pasta há um script `build_proto.py`
que lê um HTML baseline + JSONs na subpasta `dados/` e produz `relatorio-c6-PROTO-safra-atual.html`.
NÃO precisa de banco de dados, n8n nem internet — os dados já estão embarcados.

Faça:
1. Confirme que existem: build_proto.py, relatorio-c6-original-baseline.html, e dados/ com
   coorte_all.json, coorte_wl.json, wl_list.json, recencia.json.
2. Localize um Python 3 (>=3.9). No Windows, tente:
   %LOCALAPPDATA%\Programs\Python\Python314\python.exe  (ou `py -3`, ou `python`).
   No Mac/Linux: `python3`.
3. Rode o gerador a partir DESTA pasta:  <python> build_proto.py
   (o script usa caminhos relativos à própria pasta — não precisa editar nada).
4. Confirme que ele imprimiu "OK gerado: ..." e a linha "checks: safra-box=True ... sem_rxwl=True",
   e que o arquivo relatorio-c6-PROTO-safra-atual.html foi criado.
5. Abra o HTML no navegador (é um arquivo estático e autocontido). Valide:
   - No bloco "Safra de cadastro", com Whitelabel = "Todos os whitelabels" e Ano/Mês = Todos:
     Clientes na base deve mostrar 29.002.
   - Selecionando Whitelabel = "Canal de vendas C6 Auto": Clientes na base = 2.921, Compradores = 240,
     Valor total = R$ 146,7 Mi.
   Se esses números baterem, a replicação está correta.
Me avise o caminho do HTML gerado e o resultado da validação.
```

---

## O que o Claude vai executar (referência, caso queira rodar manualmente)

**Windows (PowerShell ou Git Bash):**
```bash
cd prototipo-safra
"%LOCALAPPDATA%\Programs\Python\Python314\python.exe" build_proto.py
# ou:  py -3 build_proto.py   |   python build_proto.py
```
**Mac/Linux:**
```bash
cd prototipo-safra
python3 build_proto.py
```
Saída esperada (stdout):
```
OK gerado: .../relatorio-c6-PROTO-safra-atual.html | tamanho: ~490000
checks: safra-box=True scWl_no_bloco=True header_C6_intacto=True sem_gfilter=True sem_rxwl=True
```

---

## Validação (o que confirmar no navegador)

O HTML é **estático e autocontido** (os gráficos usam Chart.js via CDN — precisam de internet só para renderizar
os gráficos das abas de Raio-X; o bloco de safra e a Recência funcionam offline). Abra e confira o bloco **"Safra de cadastro"**:

| Filtro | Clientes na base | Compradores | Valor total |
|---|---|---|---|
| Todos os whitelabels | **29.002** | 2.105 | R$ 2,50 bi |
| Canal de vendas C6 Auto (WL43) | **2.921** | **240** | **R$ 146,7 Mi** |
| Marketplace Cars2You (WL7) | 14.741 | 1.447 | R$ 1,96 bi |

Também: o seletor de Whitelabel/Ano/Mês tem **cross-filter** (escolher 2020 no Ano reduz a lista de Whitelabels
para os 11 com cadastro em 2020; escolher o C6 limita os anos a 2022–2026). E a seção **Recência** muda com o Whitelabel.

Se os números baterem, o HTML replicado é **idêntico** ao original.

---

## Se algo der errado

- **`python` não encontrado:** instale Python 3 (python.org). No Windows, o launcher `py -3` costuma existir.
  No Mac, `python3` já vem; senão `brew install python`.
- **Erro de encoding ao imprimir acentos (Windows):** o script já faz `sys.stdout.reconfigure(encoding="utf-8")`;
  se ainda assim quebrar, rode `set PYTHONUTF8=1` antes (ou `chcp 65001`).
- **`FileNotFoundError`:** você não está rodando de dentro da pasta `prototipo-safra/`, ou faltam arquivos em `dados/`.
  O script usa caminhos relativos à **localização dele** — então rodar `python <caminho>/build_proto.py` de qualquer
  lugar também funciona, desde que `dados/` e o baseline estejam ao lado do `build_proto.py`.
- **Quer apenas o HTML pronto, sem regenerar:** o próprio `relatorio-c6-PROTO-safra-atual.html` já é o resultado —
  basta abri-lo no navegador. Regenerar só é útil para reproduzir/alterar.

---

## Observações

- Isto **replica o HTML** (regenera o mesmo arquivo). Para **continuar o desenvolvimento** (novas seções WL-reativas,
  pull de dados novos, port pro n8n) veja o **`HANDOFF-PROTOTIPO-SAFRA.md`** — esse sim exige acesso ao n8n/banco.
- Os JSONs em `dados/` são um **snapshot** dos dados de 2026-09-03. Para atualizar os números, é preciso re-extrair
  do banco via n8n (ver handoff) — a replicação por si só usa o snapshot.
