# unipath-site

Site vitrine do UniPath, o app que acompanha o estudante de universidade federal do Enem ao diploma.

Página estática (HTML, CSS e JavaScript sem dependências), publicada pelo GitHub Pages a partir da branch `main`:
https://unipath-app.github.io/unipath-site/

## Estrutura

- `index.html`: a página inteira, em pt-BR.
- `styles.css`: tokens de cor da marca (navy `#1E3A5F`, laranja `#F97316`) e o layout por seção.
- `js/main.js`: tour pelas fases, calculadora de média ponderada, fichas das universidades e animações de entrada.
- `js/fichas.js`: links oficiais das federais, gerado a partir de `unipath-api/data/universidades/*.json`.
- `img/`: ícone e favicon do app.

As telas do app aparecem redesenhadas em HTML com dados de exemplo. O site não usa fotografia de terceiros.

## Rodar localmente

```bash
npx serve .
```

O `main.js` é um módulo ES, então a página precisa de um servidor (abrir o arquivo direto não carrega o script).

## Atualizar as fichas

Quando uma ficha nova entrar em `unipath-api/data/universidades/`, regenere `js/fichas.js` com o mesmo formato
(`sigla`, `nome`, `cidade`, `uf`, `verificado`, `itens[]` com `titulo`, `url`, `chave`) e acrescente o nome,
a cidade e a UF da universidade.
