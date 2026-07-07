# Como usar o Google Sheets para gerenciar os vinhos

O app já vem pronto para ler os vinhos de uma planilha do Google Sheets — assim
você e sua esposa atualizam a lista **sem mexer no código**. Enquanto não configurar,
ele usa os vinhos de `data.js`.

## Passo 1 — Criar a planilha

Crie uma planilha nova no Google Sheets. Na **primeira linha**, coloque exatamente
estes títulos de coluna (pode copiar e colar):

```
id	adegas	nome	produtor	tipo	uva	pais	regiao	safra	alcool	docura	corpo	taninos	acidez	gelavel	temperatura	harmonizacao	queijos	descricao	combina_se_voce_gosta	foto
```

Cada linha abaixo é um vinho. Regras dos campos:

| Coluna | Como preencher |
|---|---|
| `id` | um apelido único sem espaços, ex: `malbec-reserva` |
| `adegas` | slugs das adegas separados por vírgula, ex: `unidade-centro, unidade-praia` |
| `tipo` | `Tinto`, `Branco`, `Rosé` ou `Espumante` |
| `docura`, `corpo`, `taninos`, `acidez` | número de **0 a 5** |
| `gelavel` | `sim` ou deixe vazio |
| `foto` | link de uma imagem (opcional). Vazio = garrafa ilustrada |
| demais | texto livre |

> Dica: copie os dados de `data.js` para não começar do zero.

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
