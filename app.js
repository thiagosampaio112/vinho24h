/* ==========================================================================
   VINHO 24 HORAS — Lógica do app
   ========================================================================== */

/* --------------------------------------------------------------------------
   CONFIGURAÇÃO — Google Sheets (opcional)
   --------------------------------------------------------------------------
   Enquanto estiver "" (vazio), o app usa os vinhos de data.js.
   Para ler de uma planilha do Google Sheets:
     1) Monte a planilha com as MESMAS colunas de data.js (veja SHEETS.md).
     2) Arquivo → Compartilhar → Publicar na web → escolha a aba → formato CSV.
     3) Cole aqui o link .csv publicado.
   -------------------------------------------------------------------------- */
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQLsX4VZuxj_ziZXO4UmLKmd3l3ngpKwaNPcDicBCZoB63y5dP0VcVdH93uW731E9uPAPSOe-6pho-5/pub?output=csv";

// ---- Rótulos amigáveis para as escalas (0 a 5) --------------------------
const ESCALAS = {
  docura:  { titulo: "Doçura",  niveis: ["Bem seco", "Seco", "Meio-seco", "Suave", "Doce", "Bem doce"] },
  corpo:   { titulo: "Corpo",   niveis: ["Muito leve", "Leve", "Médio-leve", "Médio", "Encorpado", "Muito encorpado"] },
  taninos: { titulo: "Taninos", niveis: ["Sem taninos", "Bem macio", "Macio", "Médio", "Marcante", "Muito marcante"] },
  acidez:  { titulo: "Acidez",  niveis: ["Baixa", "Média-baixa", "Média", "Média-alta", "Alta", "Muito refrescante"] },
};

// Catálogo em uso (começa com data.js; pode ser trocado pelo Google Sheets)
let CATALOGO = Array.isArray(typeof VINHOS !== "undefined" ? VINHOS : null) ? VINHOS.slice() : [];

// ---- Estado da tela -----------------------------------------------------
let adegaAtual = null;
const estado = { busca: "", tipo: null, perfil: null };

// ---- Utilidades DOM -----------------------------------------------------
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};

// ======================================================================
//  ILUSTRAÇÃO DA GARRAFA (placeholder até haver foto real no campo `foto`)
// ======================================================================
function garrafaHTML(v, contexto) {
  // Se o vinho tiver uma foto real, usa a imagem.
  if (v.foto) {
    return `<img src="${v.foto}" alt="Garrafa ${v.nome}" loading="lazy" />`;
  }
  // Senão, desenha uma garrafa colorida conforme o tipo.
  const vinho = { Tinto: "#6b0f2a", Branco: "#d8c66a", "Rosé": "#e492a8", Espumante: "#e3cf7f" }[v.tipo] || "#6b0f2a";
  const capsula = { Tinto: "#3d0a1f", Branco: "#8a7d2a", "Rosé": "#a64d66", Espumante: "#b89a2f" }[v.tipo] || "#3d0a1f";
  const id = "g" + v.id + (contexto || "");
  return `
  <svg viewBox="0 0 44 132" role="img" aria-label="Garrafa de ${v.tipo}">
    <defs>
      <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="${vinho}" stop-opacity="0.75"/>
        <stop offset="0.4" stop-color="${vinho}"/>
        <stop offset="0.75" stop-color="${vinho}" stop-opacity="0.9"/>
        <stop offset="1" stop-color="#000" stop-opacity="0.3"/>
      </linearGradient>
    </defs>
    <path d="M18 6 h8 v16 c7 3 9 10 9 20 v58 a6 6 0 0 1 -6 6 H15 a6 6 0 0 1 -6 -6 V42 c0 -10 2 -17 9 -20 Z"
          fill="url(#${id})" stroke="rgba(255,255,255,.22)" stroke-width="1.2"/>
    <rect x="16" y="4" width="12" height="9" rx="2" fill="${capsula}"/>
    <rect x="10" y="74" width="24" height="30" rx="3" fill="#f7efe8" opacity="0.94"/>
    <rect x="14" y="82" width="16" height="2.5" rx="1" fill="${capsula}" opacity="0.65"/>
    <rect x="14" y="88" width="16" height="2"   rx="1" fill="#b9a48f"/>
    <rect x="14" y="93" width="11" height="2"   rx="1" fill="#b9a48f"/>
  </svg>`;
}

// ======================================================================
//  INICIALIZAÇÃO
// ======================================================================
async function iniciar() {
  await carregarDados();

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("adega");
  const ativas = Object.keys(ADEGAS).filter((s) => ADEGAS[s].ativa !== false);

  if (slug && ADEGAS[slug] && ADEGAS[slug].ativa !== false) {
    abrirCatalogo(slug);          // QR da unidade → vai direto
  } else if (ativas.length === 1) {
    abrirCatalogo(ativas[0]);     // só uma unidade ativa → pula a escolha
  } else {
    abrirSelecao();               // várias ativas → mostra a escolha
  }

  window.addEventListener("popstate", () => {
    if (location.hash !== "#ficha") fecharFicha();
  });
}

// Carrega os vinhos do Google Sheets se configurado; senão mantém data.js.
async function carregarDados() {
  if (!SHEET_CSV_URL) return;
  try {
    const resp = await fetch(SHEET_CSV_URL, { cache: "no-store" });
    if (!resp.ok) throw new Error("HTTP " + resp.status);
    const csv = await resp.text();
    const linhas = parseCSV(csv);
    if (linhas.length) CATALOGO = linhas.map(normalizarLinha);
  } catch (err) {
    console.warn("Não foi possível ler o Google Sheets, usando data.js.", err);
  }
}

// Converte uma linha da planilha (colunas em texto) num objeto de vinho.
function normalizarLinha(row) {
  const num = (x) => { const n = parseFloat(String(x).replace(",", ".")); return isNaN(n) ? 0 : n; };
  const sim = (x) => /^(sim|s|true|1|x)$/i.test(String(x).trim());
  return {
    id: row.id || (row.nome || "").toLowerCase().replace(/\s+/g, "-"),
    codigo: row.codigo || "",
    adegas: String(row.adegas || "").split(/[;,]/).map((s) => s.trim()).filter(Boolean),
    nome: row.nome, produtor: row.produtor, tipo: row.tipo, uva: row.uva,
    pais: row.pais, regiao: row.regiao, safra: row.safra, alcool: num(row.alcool),
    docura: num(row.docura), corpo: num(row.corpo), taninos: num(row.taninos), acidez: num(row.acidez),
    gelavel: sim(row.gelavel), temperatura: row.temperatura,
    harmonizacao: row.harmonizacao, queijos: row.queijos, descricao: row.descricao,
    combina_se_voce_gosta: row.combina_se_voce_gosta, foto: row.foto || "",
  };
}

// Parser de CSV simples e robusto (lida com aspas e vírgulas dentro do campo).
function parseCSV(texto) {
  const linhas = [];
  let campo = "", registro = [], dentroAspas = false;
  texto = texto.replace(/\r\n?/g, "\n");
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (dentroAspas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') dentroAspas = false;
      else campo += c;
    } else if (c === '"') dentroAspas = true;
    else if (c === ",") { registro.push(campo); campo = ""; }
    else if (c === "\n") { registro.push(campo); linhas.push(registro); registro = []; campo = ""; }
    else campo += c;
  }
  if (campo.length || registro.length) { registro.push(campo); linhas.push(registro); }
  if (!linhas.length) return [];
  const cabecalho = linhas.shift().map((h) => h.trim());
  return linhas
    .filter((l) => l.some((c) => c.trim() !== ""))
    .map((l) => Object.fromEntries(cabecalho.map((h, i) => [h, (l[i] || "").trim()])));
}

// ======================================================================
//  TELA 1 — Seleção de adega
// ======================================================================
function abrirSelecao() {
  $("#tela-catalogo").classList.add("hidden");
  $("#tela-selecao").classList.remove("hidden");

  const lista = $("#lista-adegas");
  lista.innerHTML = "";
  Object.entries(ADEGAS)
    .filter(([, info]) => info.ativa !== false)  // esconde unidades não ativas
    .forEach(([slug, info]) => {
    const btn = el("button", "adega-btn");
    btn.innerHTML = `<b>${info.nome}</b><span>${info.cidade} · toque para ver os vinhos</span>`;
    btn.addEventListener("click", () => {
      history.pushState({}, "", `?adega=${slug}`);
      abrirCatalogo(slug);
    });
    lista.appendChild(btn);
  });
}

// ======================================================================
//  TELA 2 — Catálogo da adega
// ======================================================================
function abrirCatalogo(slug) {
  adegaAtual = slug;
  $("#tela-selecao").classList.add("hidden");
  $("#tela-catalogo").classList.remove("hidden");
  $("#topo-adega").textContent = ADEGAS[slug].nome;

  montarFiltros();
  ligarBusca();
  renderizar();
  window.scrollTo(0, 0);
}

// ---- Filtros (chips) — sem o filtro "servir gelado" ---------------------
function montarFiltros() {
  const container = $("#filtros");
  container.innerHTML = "";

  const chips = [
    { rotulo: "🍷 Tinto",     set: () => toggleTipo("Tinto") },
    { rotulo: "🥂 Branco",    set: () => toggleTipo("Branco") },
    { rotulo: "🌸 Rosé",      set: () => toggleTipo("Rosé") },
    { rotulo: "✨ Espumante", set: () => toggleTipo("Espumante") },
    { rotulo: "Seco",         set: () => togglePerfil("seco") },
    { rotulo: "Docinho",      set: () => togglePerfil("doce") },
    { rotulo: "Leve",         set: () => togglePerfil("leve") },
    { rotulo: "Encorpado",    set: () => togglePerfil("encorpado") },
  ];

  chips.forEach((c) => {
    const b = el("button", "chip", c.rotulo);
    b.dataset.rotulo = c.rotulo;
    b.addEventListener("click", () => { c.set(); atualizarChips(); renderizar(); });
    container.appendChild(b);
  });
}

function toggleTipo(t)   { estado.tipo   = estado.tipo === t ? null : t; }
function togglePerfil(p) { estado.perfil = estado.perfil === p ? null : p; }

function atualizarChips() {
  $$("#filtros .chip").forEach((b) => {
    const r = b.dataset.rotulo;
    let ativo = false;
    if (r.includes("Tinto"))          ativo = estado.tipo === "Tinto";
    else if (r.includes("Branco"))    ativo = estado.tipo === "Branco";
    else if (r.includes("Rosé"))      ativo = estado.tipo === "Rosé";
    else if (r.includes("Espumante")) ativo = estado.tipo === "Espumante";
    else if (r === "Seco")      ativo = estado.perfil === "seco";
    else if (r === "Docinho")   ativo = estado.perfil === "doce";
    else if (r === "Leve")      ativo = estado.perfil === "leve";
    else if (r === "Encorpado") ativo = estado.perfil === "encorpado";
    b.classList.toggle("ativo", ativo);
  });
}

// ---- Busca --------------------------------------------------------------
function ligarBusca() {
  const input = $("#busca");
  input.value = estado.busca;
  input.oninput = (e) => { estado.busca = e.target.value; renderizar(); };
}

// ---- Filtragem ----------------------------------------------------------
function vinhosDaAdega() {
  return CATALOGO.filter((v) => v.adegas.includes(adegaAtual));
}

function aplicarFiltros(lista) {
  const q = estado.busca.trim().toLowerCase();
  return lista.filter((v) => {
    if (estado.tipo && v.tipo !== estado.tipo) return false;
    if (estado.perfil === "seco" && v.docura > 1) return false;
    if (estado.perfil === "doce" && v.docura < 3) return false;
    if (estado.perfil === "leve" && v.corpo > 2) return false;
    if (estado.perfil === "encorpado" && v.corpo < 4) return false;
    if (q) {
      const alvo = `${v.nome} ${v.uva} ${v.pais} ${v.regiao} ${v.tipo} ${v.produtor}`.toLowerCase();
      if (!alvo.includes(q)) return false;
    }
    return true;
  });
}

// ---- Render principal ---------------------------------------------------
function renderizar() {
  const lista = aplicarFiltros(vinhosDaAdega());
  const grade = $("#grade");
  const vazio = $("#vazio");
  grade.innerHTML = "";

  $("#resultado-info").textContent =
    `${lista.length} ${lista.length === 1 ? "vinho" : "vinhos"} nesta adega`;

  if (lista.length === 0) { vazio.classList.remove("hidden"); return; }
  vazio.classList.add("hidden");

  lista.forEach((v) => grade.appendChild(cardVinho(v)));
}

function classeTipo(tipo) {
  return { Tinto: "tag-tinto", Branco: "tag-branco", "Rosé": "tag-rose", Espumante: "tag-espumante" }[tipo] || "tag-tinto";
}

function miniBarra(rotulo, valor) {
  return `
    <div class="mini-linha">
      <span class="mini-rotulo">${rotulo}</span>
      <span class="barra"><span class="barra-fill" style="width:${(valor / 5) * 100}%"></span></span>
    </div>`;
}

function cardVinho(v) {
  const card = el("div", "card");
  const selo = v.gelavel ? `<span class="selo-gelado">🧊 Gelado</span>` : "";
  card.innerHTML = `
    <div class="card-foto">${garrafaHTML(v, "card")}</div>
    <div class="card-info">
      <div class="card-topo">
        <span class="tag-tipo ${classeTipo(v.tipo)}">${v.tipo}</span>
        ${selo}
      </div>
      <div class="card-nome">${v.nome}</div>
      <div class="card-uva">${v.uva}</div>
      <div class="mini-medidas">
        ${miniBarra("Doçura", v.docura)}
        ${miniBarra("Corpo", v.corpo)}
      </div>
      <div class="card-origem">${bandeira(v.pais)} ${v.regiao}, ${v.pais}</div>
    </div>
  `;
  card.addEventListener("click", () => abrirFicha(v.id));
  return card;
}

function bandeira(pais) {
  const m = {
    "Argentina": "🇦🇷", "Chile": "🇨🇱", "Brasil": "🇧🇷", "França": "🇫🇷",
    "Itália": "🇮🇹", "Espanha": "🇪🇸", "Portugal": "🇵🇹", "Alemanha": "🇩🇪",
  };
  return m[pais] || "🍇";
}

// ======================================================================
//  FICHA DO VINHO
// ======================================================================
function escala(chave, valor) {
  const e = ESCALAS[chave];
  const pips = Array.from({ length: 5 }, (_, i) =>
    `<span class="pip ${i < valor ? "on" : ""}"></span>`).join("");
  return `
    <div class="medida">
      <div class="medida-topo"><b>${e.titulo}</b><span>${e.niveis[valor]}</span></div>
      <div class="medida-escala">${pips}</div>
    </div>`;
}

function abrirFicha(id) {
  const v = CATALOGO.find((x) => x.id === id);
  if (!v) return;

  const seloGelado = v.gelavel
    ? `<div style="margin:14px 0"><span class="selo-gelado-ficha">🧊 Fica ótimo bem gelado</span></div>` : "";

  $("#ficha-conteudo").innerHTML = `
    <button class="ficha-fechar" aria-label="Fechar">✕</button>
    <div class="ficha-puxador"></div>

    <div class="ficha-foto">${garrafaHTML(v, "ficha")}</div>

    <div class="ficha-tipo-linha">
      <span class="tag-tipo ${classeTipo(v.tipo)}">${v.tipo}</span>
      <span class="card-uva">${v.uva}</span>
    </div>
    <h2 class="ficha-nome">${v.nome}</h2>
    <p class="ficha-produtor">${v.produtor} · ${bandeira(v.pais)} ${v.regiao}, ${v.pais}</p>

    <p class="ficha-texto">${v.descricao}</p>

    <div class="ficha-destaque">
      👉 <b>Escolha este se você gosta</b> ${v.combina_se_voce_gosta}
    </div>

    ${seloGelado}

    <div class="ficha-origem-grid">
      <div class="ficha-dado"><span>Safra</span><b>${v.safra}</b></div>
      <div class="ficha-dado"><span>Teor alcoólico</span><b>${v.alcool}%</b></div>
      <div class="ficha-dado"><span>Servir a</span><b>${v.temperatura}</b></div>
      <div class="ficha-dado"><span>Uva</span><b>${v.uva}</b></div>
    </div>

    <div class="ficha-secao-titulo">Perfil de sabor</div>
    ${escala("docura", v.docura)}
    ${escala("corpo", v.corpo)}
    ${escala("taninos", v.taninos)}
    ${escala("acidez", v.acidez)}

    <div class="ficha-secao-titulo">Combina com</div>
    <div class="ficha-harmoniza">
      <div class="harm-item">
        <span class="harm-icone">🍽️</span>
        <div><span>Pratos</span><p>${v.harmonizacao}</p></div>
      </div>
      <div class="harm-item">
        <span class="harm-icone">🧀</span>
        <div><span>Queijos</span><p>${v.queijos}</p></div>
      </div>
    </div>
  `;

  const overlay = $("#ficha");
  overlay.classList.remove("hidden");
  document.body.style.overflow = "hidden";

  $("#ficha-conteudo .ficha-fechar").addEventListener("click", fecharFicha);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) fecharFicha(); });

  if (location.hash !== "#ficha") history.pushState({}, "", "#ficha");
}

function fecharFicha() {
  $("#ficha").classList.add("hidden");
  document.body.style.overflow = "";
  if (location.hash === "#ficha") history.back();
}

// ---- Botão "limpar" do estado vazio ------------------------------------
$("#btn-limpar-vazio").addEventListener("click", () => {
  estado.busca = ""; estado.tipo = null; estado.perfil = null;
  $("#busca").value = "";
  atualizarChips();
  renderizar();
});

// Fechar ficha com ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !$("#ficha").classList.contains("hidden")) fecharFicha();
});

// ---- Service worker (PWA / offline) ------------------------------------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

// Bora!
iniciar();
