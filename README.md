# Vinho 24 Horas · Guia de Vinhos (PWA)

Guia de bolso que o cliente acessa via **QR Code na porta da adega** para descobrir
qual garrafa combina com ele: doçura, corpo, taninos, acidez, harmonização com pratos
e queijos, temperatura de serviço e uma dica de "escolha este se você gosta de…".

Feito em **HTML + CSS + JavaScript puro** — sem build, sem framework, leve e instalável
como app (PWA). Roda offline depois da primeira visita.

## Estrutura dos arquivos

| Arquivo | O que é |
|---|---|
| `index.html` | Estrutura das telas |
| `styles.css` | Visual (tema "vinho", mobile-first) |
| `app.js` | Lógica: roteamento por adega, busca, filtros, ficha |
| `data.js` | **A base dos vinhos** — cada objeto = 1 linha da futura planilha |
| `manifest.webmanifest` + `sw.js` + `icons/` | Arquivos do PWA (instalar + offline) |

## Como testar

- **Rápido:** dê duplo-clique em `index.html` (abre a tela de seleção de adega).
- **Simulando o QR:** abra `index.html?adega=unidade-centro` (ou `?adega=unidade-praia`).
- O modo offline/instalável só funciona quando hospedado (ver abaixo), não via arquivo local.

## Como cada adega tem seu QR

Cada adega é uma URL com o parâmetro `?adega=<slug>`. Os slugs estão em `data.js` (`ADEGAS`).
Depois de publicado, o QR de cada porta aponta para:

```
https://SEU-SITE/?adega=unidade-centro
https://SEU-SITE/?adega=unidade-praia
```

## Editar / adicionar vinhos (hoje)

Abra `data.js` e edite os objetos. Campos e escalas estão documentados no topo do arquivo.
Escalas vão de 0 a 5. `adegas: [...]` define em quais adegas o vinho aparece.

## Próximos passos combinados

1. **Migrar para Google Sheets** — planilha com as mesmas colunas do `data.js`;
   o site lê a planilha publicada (CSV/JSON) e monta os vinhos. Vocês atualizam sem mexer no código.
2. **Publicar grátis** — arrastar a pasta no Netlify (ou GitHub Pages / Vercel).
3. **Gerar os QR Codes** das 2 adegas apontando para as URLs acima.

---
Beba com moderação. Venda proibida para menores de 18 anos.
