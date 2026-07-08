# Como usar o Google Sheets para gerenciar os vinhos

O app já vem pronto para ler os vinhos de uma planilha do Google Sheets — assim
você e sua esposa atualizam a lista **sem mexer no código**. Enquanto não configurar,
ele usa os vinhos de `data.js`.

## Passo 1 — Criar a planilha (JÁ VEM PRONTA)

Você não precisa digitar nada. O arquivo **`vinhos-google-sheets.csv`** (na pasta do
projeto) já tem os 15 vinhos reais da Unidade Ecopark IV e as colunas certas.
Para virar uma planilha:

1. Acesse **sheets.google.com** e crie uma planilha em branco (ou abra uma existente).
2. Menu **Arquivo → Importar → Fazer upload** e selecione o arquivo `vinhos-google-sheets.csv`.
3. Em "Importar arquivo", escolha **Substituir a planilha atual**.
4. **DESMARQUE** a opção *"Converter texto em números, datas e fórmulas"* — assim os
   códigos com zero à esquerda (ex: `00562`) não viram `562`.
5. Clique em **Importar dados**.

Pronto: a planilha nasce preenchida. Agora é só editar/adicionar vinhos por ali.

> **Já publicou a planilha antes?** Se você re-importar (Substituir a planilha atual)
> na MESMA planilha que já está publicada, o link `output=csv` continua o mesmo e o
> site atualiza sozinho — não precisa republicar nem mexer no `app.js` de novo.

### Regras das colunas (para quando for editar)

| Coluna | Como preencher |
|---|---|
| `id` | um apelido único sem espaços, ex: `crotta-malbec-reserva` |
| `codigo` | código do vinho no seu sistema de estoque (só para conferência) |
| `adegas` | slugs das adegas separados por **ponto e vírgula**, ex: `ecopark-iv; unidade-2` |
| `tipo` | `Tinto`, `Branco`, `Rosé` ou `Espumante` |
| `docura`, `corpo`, `taninos`, `acidez` | número de **0 a 5** |
| `gelavel` | `sim` ou deixe vazio |
| `foto` | link de uma imagem (opcional). Vazio = garrafa ilustrada |
| demais | texto livre |

## Passo 2 — Publicar a planilha em CSV

No Google Sheets:

1. **Arquivo → Compartilhar → Publicar na web**
2. Em "Vincular", escolha a **aba** dos vinhos e o formato **Valores separados por vírgula (.csv)**
3. Clique em **Publicar** e copie o link gerado (termina em `output=csv`)

## Passo 3 — Ligar no app

Abra `app.js`, no topo, e cole o link:

```js
const SHEET_CSV_URL = "https://docs.google.com/.../pub?gid=0&single=true&output=csv";
```

Pronto. Ao abrir o site, ele lê a planilha. Se a planilha estiver fora do ar,
ele volta a usar `data.js` sozinho (não quebra).

## Observações

- As **adegas** (nomes das duas unidades) continuam em `data.js`, pois quase nunca mudam.
- Depois de editar a planilha, as mudanças aparecem em alguns minutos (o Google leva um tempinho para atualizar o CSV publicado).
- Isso só funciona com o site **hospedado** (GitHub Pages), não abrindo o arquivo local.
