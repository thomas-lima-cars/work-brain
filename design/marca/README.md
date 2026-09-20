# Marca — logos e imagens, por produto

Uma pasta por produto. Suba aqui o que for identidade visual: logo em suas
variações, ícone, imagem de capa, selo de parceiro.

```
marca/
├── cars2you/    ✅ logo azul + logo branca
├── c6/          ⬜ vazia
├── itau/        ⬜ vazia
├── dealers/     ⬜ vazia
├── lm/          ⬜ vazia
└── bradesco/    ⬜ vazia
```

## Como subir

1. Coloque o arquivo em `marca/<produto>/`.
2. Nomeie pelo **fundo em que ele é usado**, não pela cor dele:
   `logo-claro.png` é o que vai em fundo claro. Some a dúvida na hora de usar.
3. Registre no `paletas/<produto>.json`, em `"logo"`.
4. Se for entrar em painel, o gerador embute em `data:` URI — mantenha o
   arquivo pequeno. Acima de ~40 KB, pense duas vezes.

## O que NÃO subir aqui

- Captura de tela de painel com dado real (nome de loja, valor, CNPJ). O repo
  é privado, mas histórico de git não se apaga.
- Referência visual de terceiro — isso vai em `design/referencias/`.

## Formato

**PNG com fundo transparente** resolve quase tudo e é o que os geradores
embutem hoje. SVG de verdade (com `<path>`) é melhor e escala sem perder; SVG
que é só um PNG embrulhado não é vetor e não ajuda em nada — foi o caso do
arquivo branco original da Cars2You.
