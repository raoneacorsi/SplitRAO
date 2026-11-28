import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc, getDocFromServer,
  setDoc,
  onSnapshot,
  runTransaction, FieldPath, deleteField
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail, sendEmailVerification, reload, getIdToken,
  signOut,
  updateProfile,
  EmailAuthProvider, reauthenticateWithCredential, updatePassword, reauthenticateWithPopup, deleteUser,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { LANG_STORAGE_KEY, createTranslator } from "./i18n.js";
import { detectarCategoriaAutomatica, mapearCategoriaSplitwise } from "./categorias-keywords.js";

// ===== 01. CONFIGURAÇÃO FIREBASE =====
const firebaseConfig = {
  apiKey: "AIzaSyDheZEifsJ7WDQk9-l6wosXZuewyjyy3Sg",
  authDomain: "splitrao.firebaseapp.com",
  projectId: "splitrao",
  storageBucket: "splitrao.firebasestorage.app",
  messagingSenderId: "164442586974",
  appId: "1:164442586974:web:0210ece879b7b78363d9cf",
  measurementId: "G-WFCD1XNNTY"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// ===== 02. CONSTANTES E ESTADO =====
const STORAGE_KEY_LEGACY = 'raodev_split_v3_multi';
const USER_NAME_STORAGE_KEY = 'raodev_split_user_name_v1';
const ME_BY_GROUP_STORAGE_KEY = 'raodev_split_me_by_group_v1';
const SPLITWISE_IMPORT_KEY = 'raodev_splitwise_pending_import';
const DEFAULT_GROUP_ID = 'grp_padrao';

const CATEGORIAS = [
  {
    "id": "Mercado",
    "icon": "<svg width=\"15\" height=\"15\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2 3h2l3 13h12l3-10H5\"/><circle cx=\"9\" cy=\"21\" r=\"1\"/><circle cx=\"18\" cy=\"21\" r=\"1\"/></svg>"
  },
  {
    "id": "Comer fora",
    "icon": "<svg width=\"15\" height=\"15\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M4 3v7a3 3 0 0 0 6 0V3M7 3v19M20 3c-5 3-5 10 0 10v9\"/></svg>"
  },
  {
    "id": "Entretenimento",
    "icon": "<svg width=\"15\" height=\"15\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2\" y=\"6\" width=\"20\" height=\"12\" rx=\"4\"/><path d=\"M6 12h6m-3-3v6m7-3h.01m3 2h.01\"/></svg>"
  },
  {
    "id": "Transporte",
    "icon": "<svg width=\"15\" height=\"15\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"4\" y=\"3\" width=\"16\" height=\"16\" rx=\"3\"/><path d=\"M4 11h16M8 19v3m8-3v3M8 15h.01m8 0h.01\"/></svg>"
  },
  {
    "id": "Saúde",
    "icon": "<svg width=\"15\" height=\"15\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M12 21 3 12a5 5 0 0 1 9-5 5 5 0 0 1 9 5z\"/><path d=\"M4 12h5l2-4 3 8 2-4h4\"/></svg>"
  },
  {
    "id": "Casa",
    "icon": "<svg width=\"15\" height=\"15\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"m3 10 9-8 9 8v11H3zM9 21v-8h6v8\"/></svg>"
  },
  {
    "id": "Educação",
    "icon": "<svg width=\"15\" height=\"15\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"m2 9 10-5 10 5-10 5zM6 11v6l6 3 6-3v-6m4-2v8\"/></svg>"
  },
  {
    "id": "Presentes",
    "icon": "<svg width=\"15\" height=\"15\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"3\" y=\"8\" width=\"18\" height=\"4\" rx=\"1\"/><path d=\"M5 12v9h14v-9M12 8v13M12 8C2 8 6-1 12 8c6-9 10 0 0 0\"/></svg>"
  },
  {
    "id": "Lazer",
    "icon": "<svg width=\"15\" height=\"15\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"m2 21 10-18 10 18zM8 21l4-8 4 8\"/></svg>"
  },
  {
    "id": "Vestuário",
    "icon": "<svg width=\"15\" height=\"15\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"m8 3-6 4 3 5 3-2v11h8V10l3 2 3-5-6-4a4 4 0 0 1-8 0z\"/></svg>"
  },
  {
    "id": "Seguros / Impostos",
    "icon": "<svg width=\"15\" height=\"15\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"m12 2 9 4v6c0 5-5 9-9 10-4-1-9-5-9-10V6zM8 12l3 3 5-6\"/></svg>"
  },
  {
    "id": "Animais de estimação",
    "icon": "<svg width=\"15\" height=\"15\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><ellipse cx=\"5\" cy=\"9\" rx=\"2\" ry=\"3\"/><ellipse cx=\"10\" cy=\"5\" rx=\"2\" ry=\"3\"/><ellipse cx=\"15\" cy=\"5\" rx=\"2\" ry=\"3\"/><ellipse cx=\"20\" cy=\"9\" rx=\"2\" ry=\"3\"/><path d=\"M6 18c0-3 4-7 6-7s6 4 6 7c0 5-4 2-6 2s-6 3-6-2z\"/></svg>"
  },
  {
    "id": "Geral",
    "icon": "<svg width=\"15\" height=\"15\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"3\"/><path d=\"M7 12h.01m5 0h.01m5 0h.01\"/></svg>"
  }
];
// Categorias antigas preservadas para histórico e edição.
const CATEGORIAS_LEGADAS = [
{ id: 'Comida', icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>' },
{ id: 'Carro', icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>' },
{ id: 'Vida', icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' }
];

const MOEDAS = {
  BRL: { code: 'BRL', symbol: 'R$', name: 'Real' },
  USD: { code: 'USD', symbol: 'US$', name: 'Dólar EUA' },
  CLP: { code: 'CLP', symbol: 'CLP$', name: 'Peso Chileno' },
  ARS: { code: 'ARS', symbol: 'ARS$', name: 'Peso Argentino' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro' },
  BOB: { code: 'BOB', symbol: 'Bs', name: 'Boliviano' },
  GBP: {symbol:'£'}, UYU: {symbol:'UYU$'}, PYG: {symbol:'₲'}, AUD: {symbol:'A$'}, CAD: {symbol:'C$'}, MXN: {symbol:'MXN$'}, JPY: {symbol:'¥'}, CHF: {symbol:'CHF'}, COP: {symbol:'COP$'},
  PEN: { code: 'PEN', symbol: 'S/', name: 'Sol Peruano' },
  CNY:{symbol:'CN¥'}, RUB:{symbol:'₽'}, INR:{symbol:'₹'}, THB:{symbol:'฿'}, TRY:{symbol:'₺'}, KRW:{symbol:'₩'}, IDR:{symbol:'Rp'}, VND:{symbol:'₫'}, EGP:{symbol:'E£'}, ZAR:{symbol:'R'}, AED:{symbol:'AED'}, NZD:{symbol:'NZ$'}, SGD:{symbol:'S$'}, HKD:{symbol:'HK$'}, SEK:{symbol:'SEK'}, NOK:{symbol:'NOK'}, DKK:{symbol:'DKK'}, PLN:{symbol:'zł'}, HUF:{symbol:'Ft'}, CZK:{symbol:'Kč'}, ILS:{symbol:'₪'}, MAD:{symbol:'MAD'}
};

function normalizarTexto(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}



let currentLang = localStorage.getItem(LANG_STORAGE_KEY) || 'pt';
if (!['pt', 'es', 'en'].includes(currentLang)) currentLang = 'pt';
const { t, getNomeCategoriaTraduzido } = createTranslator(() => currentLang);

let currentUser = null;
let currentUserName = localStorage.getItem(USER_NAME_STORAGE_KEY) || '';
let meByGroupCache = (() => {
  try {
    return JSON.parse(localStorage.getItem(ME_BY_GROUP_STORAGE_KEY) || '{}') || {};
  } catch {
    return {};
  }
})();

let authMode = 'login';
let unsubscribeGroupDoc = null;
let unsubscribeUserDoc = null;
let cloudGroupsCache = {};
let isSavingCloud = false;

let state = {
  grupoAtivoId: DEFAULT_GROUP_ID,
  grupos: {}
};

let telaAtiva = 'lista'; // 'lista' | 'detalhe'
let modoDivisaoAtual = 'igual';
let categoriaSelecionada = null;
let categoriaDetectadaAuto = null;
let filtroCategoriaAtual = 'todas';
let totaisAberto = false;
let formGastoAberto = false;
let menu3DotsAberto = false;
let menuHome3DotsAberto = false;
let dataGastoSelecionada = '';
let undoPendente = null;

// ===== 03. NAVEGAÇÃO ENTRE TELAS =====
// Histórico real do navegador: uma entrada para a lista e outra para o grupo.
const NAV_KEY = 'splitraoTela';
function estadoNavegacao(tela, grupoId = null) {
  return { ...history.state, [NAV_KEY]: tela, splitraoGrupo: grupoId };
}
function iniciarNavegacao() {
  history.replaceState(estadoNavegacao('lista'), '', location.href);
  window.addEventListener('popstate', e => {
    if (e.state?.[NAV_KEY] === 'lista') {
      // Se houver um modal no grupo, fecha pelo botão original (inclui limpeza de listeners).
      if (telaAtiva === 'detalhe' && fecharModalPeloVoltar()) {
        history.pushState(estadoNavegacao('detalhe', state.grupoAtivoId), '', location.href);
        return;
      }
      abrirTelaListaGrupos(true);
    } else if (e.state?.[NAV_KEY] === 'detalhe') {
      const id = e.state.splitraoGrupo;
      if (state.grupos[id]) {
        assinarGrupoAtivo(id);
        abrirTelaDetalheGrupo(id, true);
      } else abrirTelaListaGrupos(true);
    }
  });
}
function fecharModalPeloVoltar() {
  const botoes = {
    'modal-form-gasto': 'btn-fechar-form-gasto',
    'modal-escolher-grupo-gasto': 'btn-fechar-escolher-grupo',
    'modal-entrar-codigo': 'btn-fechar-entrar-codigo',
    'modal-novo-grupo': 'btn-fechar-novo-grupo',
    'modal-sair-grupo': 'btn-fechar-sair-grupo',
    'modal-convite': 'btn-fechar-convite',
    'modal-v26': 'v26-cancelar',
    'modal-global': 'btn-fechar-global',
    'modal-quitar': 'btn-fechar-quitar',
    'modal-relatorio': 'btn-fechar-modal'
  };
  const abertos = [...document.querySelectorAll('.modal-overlay:not(.hidden), .modal-gasto-overlay:not(.hidden)')].filter(el => el.getClientRects().length);
  const modal = abertos.at(-1);
  const botao = modal && document.getElementById(botoes[modal.id]);
  if (!botao) return false;
  botao.click();
  return true;
}
function abrirTelaListaGrupos(viaHistorico = false) {
  if (viaHistorico !== true && history.state?.[NAV_KEY] === 'detalhe') history.back();
  telaAtiva = 'lista';
  document.getElementById('menu-3dots-home-wrap')?.classList.remove('hidden');
  cancelarEdicao();
  setFormGastoVisivel(false);
  setMenu3DotsAberto(false);
  setMenu3DotsHomeAberto(false);
  document.getElementById('view-lista-grupos')?.classList.remove('hidden');
  document.getElementById('view-detalhe-grupo')?.classList.add('hidden');
  renderSeletorGrupos();
  renderResumoGlobalUsuario();
}

function abrirTelaDetalheGrupo(groupId, viaHistorico = false) {
  if (groupId && state.grupos[groupId]) {
    state.grupoAtivoId = groupId;
  }
  if (!viaHistorico) {
    const novoEstado = estadoNavegacao('detalhe', state.grupoAtivoId);
    if (history.state?.[NAV_KEY] === 'detalhe') history.replaceState(novoEstado, '', location.href);
    else history.pushState(novoEstado, '', location.href);
  }
  telaAtiva = 'detalhe';
  document.getElementById('menu-3dots-home-wrap')?.classList.remove('hidden');
  setMenu3DotsHomeAberto(false);
  document.getElementById('view-lista-grupos')?.classList.add('hidden');
  document.getElementById('view-detalhe-grupo')?.classList.remove('hidden');
  renderTudo();
}

function abrirFormularioDeNovoGasto() {
  cancelarEdicao();
  setFormGastoVisivel(true);
  renderPagadorSelect(true);
  renderAreaDivisao();
}

function fecharModalEscolherGrupoGasto() {
  document.getElementById('modal-escolher-grupo-gasto')?.classList.add('hidden');
}

async function selecionarGrupoParaNovoGasto(grupoEscolhido) {
  if (!grupoEscolhido) return;
  fecharModalEscolherGrupoGasto();

  state.grupoAtivoId = grupoEscolhido.id;
  salvarEstadoLocal();
  if (currentUser) {
    vincularGrupoAoUsuario(currentUser.uid, grupoEscolhido.id, true).catch(() => {});
  }

  abrirTelaDetalheGrupo(grupoEscolhido.id);
  abrirFormularioDeNovoGasto();
}

async function aoClicarNovoGastoNaHome() {
  const gruposAtivos = getGruposOrdenados();

  if (gruposAtivos.length === 0) {
    const grupoCriado = await criarNovoGrupo();
    if (grupoCriado) {
      abrirTelaDetalheGrupo(grupoCriado.id);
      abrirFormularioDeNovoGasto();
    }
    return;
  }

  const listaEl = document.getElementById('lista-escolher-grupo-gasto');
  const modalEl = document.getElementById('modal-escolher-grupo-gasto');
  if (!listaEl || !modalEl) return;

  listaEl.innerHTML = '';

  gruposAtivos.forEach(grupo => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'picker-group-btn';

    const nomeSpan = document.createElement('span');
    nomeSpan.textContent = grupo.nome || t('genericGroup');

    const setaSpan = document.createElement('span');
    setaSpan.className = 'picker-group-chevron';
    setaSpan.textContent = '›';

    btn.appendChild(nomeSpan);
    btn.appendChild(setaSpan);
    btn.addEventListener('click', () => selecionarGrupoParaNovoGasto(grupo));

    listaEl.appendChild(btn);
  });

  modalEl.classList.remove('hidden');
}

// ===== 04. UTILITÁRIOS DE IDENTIDADE ("EU") =====
function salvarNomeUsuarioLocal(nome) {
  const limpo = String(nome || '').trim();
  currentUserName = limpo;
  if (limpo) {
    localStorage.setItem(USER_NAME_STORAGE_KEY, limpo);
  } else {
    localStorage.removeItem(USER_NAME_STORAGE_KEY);
  }
}

function getNomeUsuarioEfetivo() {
  if (currentUserName && currentUserName.trim()) return currentUserName.trim();
  if (currentUser?.displayName && currentUser.displayName.trim()) {
    return currentUser.displayName.trim();
  }
  if (currentUser?.email) {
    return currentUser.email.split('@')[0];
  }
  return '';
}

function getMeParticipantName(grupo) {
  if (!grupo?.pessoas) return null;
  if (currentUser) {
    const nome = grupo.vinculos?.[currentUser.uid];
    if (grupo.pessoas.includes(nome)) return nome;
    if (grupo.members && !grupo.members[currentUser.uid]) return null;
    const ocupados = Object.values(grupo.vinculos || {});
    return grupo.pessoas.find(p => !ocupados.includes(p) && normalizarTexto(p) === normalizarTexto(getNomeUsuarioEfetivo())) || null;
  }
  return grupo.pessoas.includes(grupo.meuParticipante) ? grupo.meuParticipante : null;
}

function setMeParticipantName(grupo, pessoaNome) {
  if (!grupo || !pessoaNome) return;
  grupo.meuParticipante = pessoaNome;
  if (grupo.id) {
    meByGroupCache[grupo.id] = pessoaNome;
    try {
      localStorage.setItem(ME_BY_GROUP_STORAGE_KEY, JSON.stringify(meByGroupCache));
    } catch {}
  }
}

function garantirUsuarioLogadoNoGrupo(grupo) {
  // Renderização nunca cria participantes em grupos compartilhados.
  return false;
}

async function persistirNomeNoPerfil(nome) {
  const limpo = String(nome || '').trim();
  if (!limpo) return;
  salvarNomeUsuarioLocal(limpo);
  if (currentUser) {
    try {
      if (currentUser.displayName !== limpo) {
        await updateProfile(currentUser, { displayName: limpo });
      }
      await setDoc(getUserProfileRef(currentUser.uid), {
        displayName: limpo,
        updatedAt: Date.now()
      }, { merge: true });
    } catch (e) {
      console.warn('Não foi possível atualizar nome no perfil:', e);
    }
  }
}

// ===== 05. UTILITÁRIOS GERAIS =====
function getTodayISO() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateBR(isoDate) {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatDateLabel(isoDate) {
  if (!isoDate || isoDate === getTodayISO()) return t('todayLabel');
  return formatDateBR(isoDate);
}

// valorBRL é o campo legado: armazena o equivalente na referência fixa do grupo.
function moedaBase(grupo = getGrupoAtivo()) { return MOEDAS[grupo?.moedaBase] ? grupo.moedaBase : 'BRL'; }
// Moeda de referência fixa; fatores de exibição não alteram os lançamentos.
function moedaReferencia(grupo) { return MOEDAS[grupo?.moedaReferencia] ? grupo.moedaReferencia : moedaBase(grupo); }
function fatorMoeda(grupo, moeda = moedaBase(grupo)) {
  if (moeda === moedaReferencia(grupo)) return 1;
  const f = grupo?.fatoresMoeda?.[moeda];
  return Number.isFinite(f) && f > 0 ? f : 1;
}
function assinaturaMonetaria(valor) {
  if (Array.isArray(valor)) return '['+valor.map(assinaturaMonetaria).join(',')+']';
  if (valor && typeof valor==='object') return '{'+Object.keys(valor).sort().map(k=>JSON.stringify(k)+':'+assinaturaMonetaria(valor[k])).join(',')+'}';
  return JSON.stringify(valor);
}
function taxaExibida(gasto, grupo = getGrupoAtivo()) { return gasto.taxaCambio * fatorMoeda(grupo); }
function divisaoExibida(gasto, grupo = getGrupoAtivo()) {
  return Object.fromEntries(Object.entries(gasto.divisao || {}).map(([n,v])=>[n,v*fatorMoeda(grupo)]));
}
function formatMoney(valor, currencyCode = moedaBase()) {
  const num = Number(valor) || 0;
  const sinal = num < 0 ? '-' : '';
  const abs = Math.abs(num).toLocaleString({pt:'pt-BR',es:'es-AR',en:'en-US'}[currentLang], {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  const info = MOEDAS[currencyCode] || MOEDAS.BRL;
  return `${sinal}${info.symbol} ${abs}`;
}

function getTaxaCambioAtual(moeda) {
  if (!moeda) return 1;
  if (moeda === moedaBase()) {
    const grupo = getGrupoAtivo();
    const anterior = grupo.gastos.find(g=>g.id===document.getElementById('edit-gasto-id')?.value && g.moeda===moeda);
    return anterior ? taxaExibida(anterior, grupo) : 1;
  }
  const inputTaxa = parseFloat(document.getElementById('taxa-cambio')?.value);
  if (!isNaN(inputTaxa) && inputTaxa > 0) return inputTaxa;
  const g = getGrupoAtivo();
  const salva = g?.taxasCambio?.[moeda];
  if (typeof salva === 'number' && salva > 0) return salva;
  return 0;
}

function getValorEmBRL(gasto, grupo = getGrupoAtivo()) {
  const fator = fatorMoeda(grupo);
  if (typeof gasto.valorBRL === 'number' && !isNaN(gasto.valorBRL)) {
    return gasto.valorBRL * fator;
  }
  const moeda = gasto.moeda || 'BRL';
  const taxa = typeof gasto.taxaCambio === 'number' && gasto.taxaCambio > 0 ? gasto.taxaCambio : 1;
  return (Number(gasto.valor) || 0) * (moeda === moedaReferencia(grupo) ? 1 : taxa) * fator;
}

function getCategoriaObj(catId) {
  return [...CATEGORIAS, ...CATEGORIAS_LEGADAS].find(c => c.id === (catId)) || null;
}

function escapeHTML(str) {
  return String(str || '')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"');
}

function gerarId(prefixo) {
  return `${prefixo}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

// Gera códigos uniformes de 8 caracteres, sem símbolos ambíguos.
function gerarCodigoGrupo() {
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(8)), n => alfabeto[n & 31]).join('');
}

// Reserva o documento atomicamente; nunca substitui um grupo existente.
async function reservarNovoGrupo(grupo, uid = currentUser?.uid, participanteEscolhido = null) {
  for (let tentativa = 0; tentativa < 20; tentativa++) {
    const id = gerarCodigoGrupo();
    if (state.grupos[id]) continue;
    const novo = { ...grupo, id, members: { [uid]: true }, vinculos: {} };
    const nome = participanteEscolhido || grupo.pessoas.find(p => normalizarTexto(p) === normalizarTexto(getNomeUsuarioEfetivo()));
    if (nome) novo.vinculos[uid] = nome;
    // Importações não herdam preferências de nome de outro grupo.
    if (participanteEscolhido) novo.nomesPadrao = { [uid]: participanteEscolhido === getNomeUsuarioEfetivo() };
    novo.participantesSemApp = participantesSemVinculo(novo);
    if (!uid) throw new Error('Authentication required');
    const reservado = await runTransaction(db, async tx => {
      const ref = getGroupDocRef(id);
      if ((await tx.get(ref)).exists()) return false;
      tx.set(ref, { ...novo, members: { [uid]: true }, updatedAt: Date.now(), updatedBy: uid });
      return true;
    });
    if (reservado) return novo;
  }
  throw new Error('Group code unavailable');
}

function normalizarDataISOOrdenacao(dataStr) {
  if (!dataStr || typeof dataStr !== 'string') return '0000-00-00';
  const limpo = dataStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(limpo)) return limpo;
  const brMatch = limpo.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brMatch) return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`;
  return '0000-00-00';
}

function ordenarLancamentosPorData(lista) {
  return (lista || [])
    .map((item, idx) => ({ item, idx }))
    .sort((a, b) => {
      const da = normalizarDataISOOrdenacao(a.item?.data);
      const db = normalizarDataISOOrdenacao(b.item?.data);
      if (db !== da) return db.localeCompare(da);
      return b.idx - a.idx;
    })
    .map(entry => entry.item);
}

function setSaveStatus(statusKey, extraVars = {}) {
  const el = document.getElementById('save-status');
  if (!el) return;

  const textoCompleto = t(statusKey, extraVars) || '';
  el.title = textoCompleto;
  el.setAttribute('aria-label', textoCompleto);

  if (statusKey === 'statusSyncedAt') {
    el.textContent = '🟢';
  } else if (statusKey === 'statusSaving' || statusKey === 'statusConnecting') {
    el.textContent = '🟡';
  } else {
    el.textContent = '🔴';
  }
}

function comprimirImagemArquivo(file, maxSize = 260, quality = 0.78) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo de imagem.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Arquivo de imagem inválido.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// ===== 06. INICIALIZAÇÃO DE ESTADO =====
function criarGrupoPadrao(id = DEFAULT_GROUP_ID, nome = 'Grupo Principal') {
  return {
    id,
    nome,
    order: 0,
    image: null,
    pessoas: [],
    participantesSemApp: [],
    meuParticipante: null,
    gastos: [],
    moedaBase: 'BRL',
    taxasCambio: {}
  };
}

function parseNumeroFlexivel(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'string') {
    const limpo = v.replace(/[^\d,.-]/g, '').trim();
    if (!limpo) return 0;
    const normalizado = (limpo.includes(',') && limpo.includes('.'))
      ? limpo.replace(/\./g, '').replace(',', '.')
      : limpo.replace(',', '.');
    const n = parseFloat(normalizado);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function extrairPartesPagamento(g) {
  const de = g?.de ?? g?.from ?? g?.quemPagou ?? g?.origem ?? g?.pagador ?? '';

  let para = g?.para ?? g?.to ?? g?.quemRecebeu ?? g?.recebedor ?? g?.destino ?? '';
  if (!para && Array.isArray(g?.participantes) && g.participantes.length > 0) {
    para = g.participantes[0];
  }
  if (!para && g?.divisao && typeof g.divisao === 'object') {
    const chaves = Object.keys(g.divisao).filter(k => k !== de);
    if (chaves.length > 0) para = chaves[0];
  }

  return { de: String(de || '').trim(), para: String(para || '').trim() };
}

function normalizarEstruturaGrupo(id, raw) {
  const g = raw && typeof raw === 'object' ? raw : {};
  const pessoas = Array.isArray(g.pessoas) ? [...g.pessoas] : [];

  const resolverNomePessoa = (nomeCandidato) => {
    if (!nomeCandidato || typeof nomeCandidato !== 'string') return '';
    const limpo = nomeCandidato.trim();
    if (!limpo) return '';
    if (pessoas.includes(limpo)) return limpo;
    const alvo = normalizarTexto(limpo);
    const achado = pessoas.find(p => normalizarTexto(p) === alvo);
    if (achado) return achado;
    pessoas.push(limpo);
    return limpo;
  };

  const participantesSemApp = Array.isArray(g.participantesSemApp)
    ? g.participantesSemApp.map(resolverNomePessoa).filter(Boolean)
    : [];

  let meuParticipante = typeof g.meuParticipante === 'string'
    ? (pessoas.includes(g.meuParticipante) ? g.meuParticipante : null)
    : (meByGroupCache[id] ? (pessoas.includes(meByGroupCache[id]) ? meByGroupCache[id] : null) : null);

  if (!meuParticipante && currentUserName && pessoas.length > 0) {
    const alvo = normalizarTexto(currentUserName);
    const match = pessoas.find(p => normalizarTexto(p) === alvo);
    if (match) meuParticipante = match;
  }

  const gastosBrutos = Array.isArray(g.gastos) ? [...g.gastos] : [];
  const extrasPagamento = [
    ...(Array.isArray(g.pagamentos) ? g.pagamentos : []),
    ...(Array.isArray(g.quitacoes) ? g.quitacoes : []),
    ...(Array.isArray(g.acertos) ? g.acertos : [])
  ].map(item => ({ ...(item || {}), tipo: 'pagamento' }));

  const todosLancamentos = [...gastosBrutos, ...extrasPagamento];

  const gastosNormalizados = todosLancamentos.map(item => {
    if (!item || typeof item !== 'object') return null;

    const tipoNorm = String(item.tipo || '').toLowerCase().trim();
    const parecePagamento =
      tipoNorm === 'pagamento' ||
      tipoNorm === 'quitacao' ||
      tipoNorm === 'quitação' ||
      tipoNorm === 'acerto' ||
      tipoNorm === 'settlement' ||
      Boolean(item.de || item.from || item.recebedor || item.para || item.quemRecebeu);

    if (parecePagamento) {
      const partes = extrairPartesPagamento(item);
      const de = resolverNomePessoa(partes.de);
      const para = resolverNomePessoa(partes.para);

      const moeda = item.moeda || moedaReferencia(g);
      const taxaCambio = parseNumeroFlexivel(item.taxaCambio) > 0 ? parseNumeroFlexivel(item.taxaCambio) : 1;
      const valBruto = parseNumeroFlexivel(item.valor);
      const valBRLBruto = parseNumeroFlexivel(item.valorBRL);
      const valorBRL = valBRLBruto > 0 ? valBRLBruto : (valBruto * (moeda === moedaReferencia(g) ? 1 : taxaCambio));
      const valorOriginal = valBruto > 0 ? valBruto : valorBRL;

      return {
        ...item,
        id: item.id || gerarId('pgt'),
        tipo: 'pagamento',
        de,
        para,
        moeda,
        taxaCambio,
        valor: valorOriginal,
        valorBRL,
        data: item.data || getTodayISO(),
        descricao: item.descricao || (item.obs ? t('settlementObsDesc', { obs: item.obs }) : t('settlementDefaultDesc'))
      };
    }

    const pagador = item.pagadorNaoIdentificado ? null : resolverNomePessoa(item.pagador ?? item.quemPagou ?? item.de);
    const moeda = item.moeda || moedaReferencia(g);
    const taxaCambio = parseNumeroFlexivel(item.taxaCambio) > 0 ? parseNumeroFlexivel(item.taxaCambio) : 1;
    const valBruto = parseNumeroFlexivel(item.valor);
    const valBRLBruto = parseNumeroFlexivel(item.valorBRL);
    const valorBRL = valBRLBruto > 0 ? valBRLBruto : (valBruto * (moeda === moedaReferencia(g) ? 1 : taxaCambio));

    const divisaoObj = {};
    if (item.divisao && typeof item.divisao === 'object') {
      for (const [k, v] of Object.entries(item.divisao)) {
        const nomeChave = resolverNomePessoa(k);
        if (nomeChave) {
          divisaoObj[nomeChave] = parseNumeroFlexivel(v);
        }
      }
    }

    return {
      ...item,
      id: item.id || gerarId('gst'),
      tipo: item.tipo || 'despesa',
      pagador,
      moeda,
      taxaCambio,
      valor: valBruto > 0 ? valBruto : valorBRL,
      valorBRL,
      divisao: item.pagadorNaoIdentificado ? {} : divisaoObj
    };
  }).filter(Boolean);

  const image = typeof g.image === 'string' && g.image
    ? g.image
    : (typeof g.photo === 'string' && g.photo ? g.photo : null);

  return {
    id: g.id || id,
    nome: g.nome || 'Grupo',
    order: typeof g.order === 'number' ? g.order : 0,
    image,
    pessoas,
    participantesSemApp: participantesSemVinculo({ ...g, pessoas, participantesSemApp }),
    meuParticipante,
    members: membrosReais(g),
    vinculos: { ...(g.vinculos || {}) },
    nomesPadrao: { ...(g.nomesPadrao || {}) },
    moedaBase: moedaBase(g),
    moedaReferencia: moedaReferencia(g),
    fatoresMoeda: { ...(g.fatoresMoeda || {}) },
    gastos: gastosNormalizados,
    taxasCambio: g.taxasCambio && typeof g.taxasCambio === 'object' ? g.taxasCambio : {}
  };
}

function carregarEstadoLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LEGACY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.grupos && Object.keys(parsed.grupos).length > 0) {
        const gruposNorm = {};
        for (const [gid, gdata] of Object.entries(parsed.grupos)) {
          gruposNorm[gid] = normalizarEstruturaGrupo(gid, gdata);
        }
        const ativo = gruposNorm[parsed.grupoAtivoId] ? parsed.grupoAtivoId : Object.keys(gruposNorm)[0];
        return { grupoAtivoId: ativo, grupos: gruposNorm };
      }
    }
  } catch (e) {
    console.warn('Falha ao ler cache local:', e);
  }
  const padrao = criarGrupoPadrao();
  return {
    grupoAtivoId: padrao.id,
    grupos: { [padrao.id]: padrao }
  };
}

function salvarEstadoLocal() {
  try {
    localStorage.setItem(STORAGE_KEY_LEGACY, JSON.stringify(state));
  } catch (e) {
    console.warn('Falha ao salvar cache local:', e);
  }
}

// ===== 07. CAMADA FIREBASE / NUVEM =====
function getUserProfileRef(uid) {
  return doc(db, 'users', uid);
}

function getGroupDocRef(groupId) {
  return doc(db, 'groups', groupId);
}

async function garantirPerfilUsuarioNaNuvem(user) {
  if (!user) return null;
  const userRef = getUserProfileRef(user.uid);
  const snap = await getDoc(userRef);

  const nomeEfetivo = user.displayName || user.email?.split('@')[0] || '';
  if (nomeEfetivo && !currentUserName) {
    salvarNomeUsuarioLocal(nomeEfetivo);
  }

  if (!snap.exists()) {
    let inicial = criarGrupoPadrao(DEFAULT_GROUP_ID, 'Grupo Principal');
    if (nomeEfetivo) {
      inicial.pessoas.push(nomeEfetivo);
      inicial.meuParticipante = nomeEfetivo;
    }
    inicial = await reservarNovoGrupo({ ...inicial, ownerUid: user.uid }, user.uid);

    await setDoc(userRef, {
      email: user.email || '',
      displayName: nomeEfetivo,
      groupIds: [inicial.id],
      activeGroupId: inicial.id,
      updatedAt: Date.now()
    });

    return {
      email: user.email || '',
      displayName: nomeEfetivo,
      groupIds: [inicial.id],
      activeGroupId: inicial.id
    };
  }

  const data = snap.data();
  const groupIds = Array.isArray(data.groupIds)
    ? data.groupIds
    : [];
  const activeGroupId = data.activeGroupId && groupIds.includes(data.activeGroupId)
    ? data.activeGroupId
    : (groupIds[0] || null);

  const nomeNuvem = data.displayName || nomeEfetivo;
  if (nomeNuvem) {
    salvarNomeUsuarioLocal(nomeNuvem);
  }

  await setDoc(userRef, {
    email: user.email || data.email || '',
    displayName: nomeNuvem || nomeEfetivo,
    groupIds,
    activeGroupId,
    updatedAt: Date.now()
  }, { merge: true });

  return {
    ...data,
    displayName: nomeNuvem || nomeEfetivo,
    groupIds,
    activeGroupId
  };
}

async function vincularGrupoAoUsuario(uid, groupId, tornarAtivo = true) {
  if (!uid || !groupId) return;
  const userRef = getUserProfileRef(uid);
  const snap = await getDoc(userRef);
  const atual = snap.exists() ? snap.data() : {};
  const lista = Array.isArray(atual.groupIds) ? [...atual.groupIds] : [];
  if (!lista.includes(groupId)) {
    lista.push(groupId);
  }
  const payload = {
    groupIds: lista,
    updatedAt: Date.now()
  };
  if (tornarAtivo) {
    payload.activeGroupId = groupId;
  }
  await setDoc(userRef, payload, { merge: true });
}

async function desvincularGrupoDoUsuario(uid, groupId) {
  if (!uid || !groupId) return;
  const userRef = getUserProfileRef(uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;
  const atual = snap.data();
  const lista = (Array.isArray(atual.groupIds) ? atual.groupIds : []).filter(id => id !== groupId);
  const novoAtivo = lista.length > 0 ? lista[0] : null;
  await setDoc(userRef, {
    groupIds: lista,
    activeGroupId: novoAtivo,
    updatedAt: Date.now()
  }, { merge: true });
}

// Compatibilidade com vínculos antigos gravados como campos literais.
function membrosReais(data) {
  const membros = Object.create(null);
  for (const [uid, ativo] of Object.entries(data.members || {})) if (ativo === true) membros[uid] = true;
  for (const [campo, ativo] of Object.entries(data)) {
    if (campo.startsWith('members.') && ativo === true) membros[campo.slice(8)] = true;
  }
  return membros;
}

function atualizarMembros(tx, ref, data, membros) {
  tx.update(ref, { members: { ...membros } });
  for (const campo of Object.keys(data)) {
    if (campo.startsWith('members.')) tx.update(ref, new FieldPath(campo), deleteField());
  }
}

async function ingressarGrupo(id, uid, escolha, nomeNovo) {
  return runTransaction(db, async tx => {
    const ref = getGroupDocRef(id), perfilRef = getUserProfileRef(uid);
    const snap = await tx.get(ref), perfil = await tx.get(perfilRef);
    if (!snap.exists() || snap.data().deleted || !perfil.exists()) throw new Error('Group unavailable');
    const data = snap.data(), membros = membrosReais(data);
    const vinculos = { ...(data.vinculos || {}) };
    const pessoas = [...(data.pessoas || [])];
    let nome = vinculos[uid];
    if (!membros[uid] || !nome || !pessoas.includes(nome)) {
      if (escolha === null) throw new Error('Selection required');
      nome = escolha || nomeNovo;
      if (!nome || Object.entries(vinculos).some(([u,p]) => u !== uid && normalizarTexto(p) === normalizarTexto(nome))) throw new Error('Participant unavailable');
      if (escolha) {
        if (!participantesDisponiveis(data, uid).includes(escolha)) throw new Error('Participant unavailable');
      }
      else { if (pessoas.some(p => normalizarTexto(p) === normalizarTexto(nome))) throw new Error('Duplicate participant'); pessoas.push(nome); }
      vinculos[uid] = nome;
    }
    membros[uid] = true;
    atualizarMembros(tx, ref, data, membros);
    const semApp = (data.participantesSemApp || []).filter(p => p !== nome);
    const grupo = normalizarEstruturaGrupo(id, { ...data, pessoas, vinculos, members: membros, participantesSemApp: semApp });
    if ((!membrosReais(data)[uid] || !pessoas.includes(data.vinculos?.[uid])) && escolha && nomeNovo && nomeNovo !== nome) {
      if (grupo.pessoas.some(p => p !== nome && normalizarTexto(p) === normalizarTexto(nomeNovo))) throw new Error('Duplicate participant');
      renomearNomeEmGrupo(grupo, nome, nomeNovo);
      grupo.vinculos[uid] = nomeNovo;
    }
    if (!membrosReais(data)[uid] || !pessoas.includes(data.vinculos?.[uid])) grupo.nomesPadrao[uid] = grupo.vinculos[uid] === getNomeUsuarioEfetivo();
    grupo.participantesSemApp = participantesSemVinculo(grupo);
    tx.update(ref, { pessoas: grupo.pessoas, vinculos: grupo.vinculos, nomesPadrao: grupo.nomesPadrao, participantesSemApp: grupo.participantesSemApp, gastos: grupo.gastos, meuParticipante: grupo.meuParticipante || null });
    tx.update(perfilRef, { groupIds: [...new Set([...(perfil.data().groupIds || []), id])], activeGroupId: id, updatedAt: Date.now() });
    return grupo;
  });
}

async function salvarGrupoNaNuvem(grupo) {
  salvarEstadoLocal();
  if (!grupo || !grupo.id) return;

  if (!currentUser) {
    setSaveStatus('statusOffline');
    return;
  }

  isSavingCloud = true;
  setSaveStatus('statusSaving');

  try {
    const groupRef = getGroupDocRef(grupo.id);
    const payload = {
      id: grupo.id,
      nome: grupo.nome,
      order: typeof grupo.order === 'number' ? grupo.order : 0,
      image: grupo.image || null,
      pessoas: grupo.pessoas || [],
      participantesSemApp: participantesSemVinculo(grupo),
      meuParticipante: grupo.meuParticipante || null,
      moedaBase: moedaBase(grupo),
      moedaReferencia: moedaReferencia(grupo),
      fatoresMoeda: grupo.fatoresMoeda || {},
      gastos: grupo.gastos || [],
      taxasCambio: grupo.taxasCambio || {},
      updatedAt: Date.now(),
      updatedBy: currentUser.uid
    };
    await runTransaction(db, async tx => {
      const snap = await tx.get(groupRef);
      if (!snap.exists() || snap.data().deleted || !membrosReais(snap.data())[currentUser.uid]) throw new Error('Group unavailable');
      const remoto = snap.data();
      // Compara os vínculos pelo conteúdo, sem depender da ordem das chaves.
      if (assinaturaMonetaria(remoto.vinculos || {}) !== assinaturaMonetaria(grupo.vinculos || {})) throw new Error("Participant links changed; reload group");
      if (moedaBase(remoto) !== moedaBase(grupo) || fatorMoeda(remoto) !== fatorMoeda(grupo) || moedaReferencia(remoto) !== moedaReferencia(grupo)) throw new Error("Group currency changed; reload group");
      tx.update(groupRef, payload);
    });
    cloudGroupsCache[grupo.id] = normalizarEstruturaGrupo(grupo.id, { ...payload, members: grupo.members, vinculos: grupo.vinculos, nomesPadrao: grupo.nomesPadrao });
    const agora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setSaveStatus('statusSyncedAt', { time: agora });
  } catch (err) {
    console.error('Erro ao salvar grupo no Firestore:', err);
    setSaveStatus('statusSaveError');
  } finally {
    setTimeout(() => {
      isSavingCloud = false;
    }, 300);
  }
}

function renomearNomeEmGrupo(grupo, nomeAntigo, nomeNovo) {
  if (!grupo || !nomeAntigo || !nomeNovo) return false;
  if (nomeAntigo === nomeNovo) return false;

  let alterou = false;
  const alvoAntigo = normalizarTexto(nomeAntigo);
  const alvoNovo = normalizarTexto(nomeNovo);

  const substituirNome = (valor) => {
    if (!valor || typeof valor !== 'string') return valor;
    if (valor === nomeAntigo || normalizarTexto(valor) === alvoAntigo) {
      alterou = true;
      return nomeNovo;
    }
    return valor;
  };

  if (Array.isArray(grupo.pessoas)) {
    const jaTemNovo = grupo.pessoas.some(p => normalizarTexto(p) === alvoNovo && normalizarTexto(p) !== alvoAntigo);
    const mapeadas = [];
    for (const p of grupo.pessoas) {
      if (p === nomeAntigo || normalizarTexto(p) === alvoAntigo) {
        alterou = true;
        if (!jaTemNovo && !mapeadas.some(x => normalizarTexto(x) === alvoNovo)) {
          mapeadas.push(nomeNovo);
        }
      } else if (!mapeadas.some(x => normalizarTexto(x) === normalizarTexto(p))) {
        mapeadas.push(p);
      }
    }
    grupo.pessoas = mapeadas;
  }

  if (Array.isArray(grupo.participantesSemApp)) {
    const semAppAtualizada = [];
    for (const p of grupo.participantesSemApp) {
      const prox = substituirNome(p);
      if (!semAppAtualizada.some(x => normalizarTexto(x) === normalizarTexto(prox))) {
        semAppAtualizada.push(prox);
      }
    }
    grupo.participantesSemApp = semAppAtualizada;
  }

  if (grupo.meuParticipante === nomeAntigo || normalizarTexto(grupo.meuParticipante) === alvoAntigo) {
    grupo.meuParticipante = nomeNovo;
    alterou = true;
  }
  if (grupo.id && meByGroupCache[grupo.id]) {
    if (meByGroupCache[grupo.id] === nomeAntigo || normalizarTexto(meByGroupCache[grupo.id]) === alvoAntigo) {
      meByGroupCache[grupo.id] = nomeNovo;
      try {
        localStorage.setItem(ME_BY_GROUP_STORAGE_KEY, JSON.stringify(meByGroupCache));
      } catch {}
    }
  }

  if (Array.isArray(grupo.gastos)) {
    grupo.gastos = grupo.gastos.map(g => {
      if (!g || typeof g !== 'object') return g;

      if (g.tipo === 'pagamento') {
        const novoDe = substituirNome(g.de);
        const novoPara = substituirNome(g.para);
        return {
          ...g,
          de: novoDe,
          para: novoPara
        };
      }

      const novoPagador = g.pagadorNaoIdentificado ? null : substituirNome(g.pagador);
      const novosParticipantes = Array.isArray(g.participantes)
        ? g.participantes.map(p => substituirNome(p))
        : g.participantes;

      let novaDivisao = g.divisao;
      if (g.divisao && typeof g.divisao === 'object') {
        novaDivisao = {};
        for (const [k, v] of Object.entries(g.divisao)) {
          const chaveAtualizada = substituirNome(k);
          novaDivisao[chaveAtualizada] = (novaDivisao[chaveAtualizada] || 0) + (Number(v) || 0);
        }
      }

      let novasCotas = g.cotas;
      if (g.cotas && typeof g.cotas === 'object') {
        novasCotas = {};
        for (const [k, v] of Object.entries(g.cotas)) {
          const chaveAtualizada = substituirNome(k);
          novasCotas[chaveAtualizada] = (novasCotas[chaveAtualizada] || 0) + (Number(v) || 0);
        }
      }

      return {
        ...g,
        pagador: novoPagador,
        ...(novosParticipantes !== undefined ? { participantes: novosParticipantes } : {}),
        ...(novaDivisao !== undefined ? { divisao: novaDivisao } : {}),
        ...(novasCotas !== undefined ? { cotas: novasCotas } : {})
      };
    });
  }

  return alterou;
}

async function atualizarMeuNomeEmTodosOsGrupos() {
  const nome = await solicitarNomeNovoGrupo({ perfil: true, nomeAtual: getNomeUsuarioEfetivo() });
  if (!nome) return;
  await persistirNomeNoPerfil(nome);
  renderAuthUI();
  renderTudo();
}

function assinarGrupoAtivo(groupId) {
  if (unsubscribeGroupDoc) {
    unsubscribeGroupDoc();
    unsubscribeGroupDoc = null;
  }
  if (!groupId || !currentUser) return;

  const groupRef = getGroupDocRef(groupId);
  unsubscribeGroupDoc = onSnapshot(groupRef, (snap) => {
    if (isSavingCloud) return;
    if (snap.exists()) {
      const data = snap.data();
      const norm = normalizarEstruturaGrupo(groupId, data);
      state.grupos[groupId] = norm;
      cloudGroupsCache[groupId] = norm;
      salvarEstadoLocal();
      if (state.grupoAtivoId === groupId) {
        renderTudo();
      }
      const agora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      setSaveStatus('statusSyncedAt', { time: agora });
    }
  }, (err) => {
    console.warn('Erro no listener do grupo:', err);
    setSaveStatus('statusOffline');
  });
}

async function migrarVinculoLegado(id, data) {
  const uid = currentUser.uid;
  if (!membrosReais(data)[uid] || data.vinculos?.[uid]) return data;
  const candidato = (data.pessoas || []).find(p => normalizarTexto(p) === normalizarTexto(getNomeUsuarioEfetivo()));
  if (!candidato || Object.values(data.vinculos || {}).includes(candidato) || (data.participantesSemApp || []).includes(candidato)) return data;
  return runTransaction(db, async tx => {
    const ref = getGroupDocRef(id), snap = await tx.get(ref);
    if (!snap.exists()) return data;
    const atual = snap.data(), vinculos = { ...(atual.vinculos || {}) };
    if (!membrosReais(atual)[uid] || vinculos[uid] || Object.values(vinculos).includes(candidato) || !(atual.pessoas || []).includes(candidato) || (atual.participantesSemApp || []).includes(candidato)) return atual;
    vinculos[uid] = candidato;
    tx.update(ref, { vinculos });
    return { ...atual, vinculos };
  });
}

async function carregarGruposDoUsuario(userData) {
  if (!currentUser) return;
  const groupIds = Array.isArray(userData?.groupIds) ? userData.groupIds : [];

  if (groupIds.length === 0) {
    let padrao = criarGrupoPadrao('', 'Grupo Principal');
    const nomeEfetivo = getNomeUsuarioEfetivo();
    if (nomeEfetivo) {
      padrao.pessoas.push(nomeEfetivo);
      padrao.meuParticipante = nomeEfetivo;
    }
    padrao = await reservarNovoGrupo(padrao);
    state.grupos = { [padrao.id]: padrao };
    state.grupoAtivoId = padrao.id;
    await salvarGrupoNaNuvem(padrao);
    await vincularGrupoAoUsuario(currentUser.uid, padrao.id, true);
    assinarGrupoAtivo(padrao.id);
    renderTudo();
    return;
  }

  const novosGrupos = {};
  for (const gid of groupIds) {
    try {
      const snap = await getDoc(getGroupDocRef(gid));
      if (snap.exists()) {
        const norm = normalizarEstruturaGrupo(gid, await migrarVinculoLegado(gid, snap.data()));
        novosGrupos[gid] = norm;
        cloudGroupsCache[gid] = norm;
      }
    } catch (e) {
      console.warn(`Erro ao carregar grupo ${gid}:`, e);
      if (state.grupos[gid]) {
        novosGrupos[gid] = normalizarEstruturaGrupo(gid, state.grupos[gid]);
      }
    }
  }

  if (Object.keys(novosGrupos).length === 0) {
    let padrao = criarGrupoPadrao('', 'Grupo Principal');
    const nomeEfetivo = getNomeUsuarioEfetivo();
    if (nomeEfetivo) {
      padrao.pessoas.push(nomeEfetivo);
      padrao.meuParticipante = nomeEfetivo;
    }
    padrao = await reservarNovoGrupo(padrao);
    novosGrupos[padrao.id] = padrao;
    await vincularGrupoAoUsuario(currentUser.uid, padrao.id, true);
  }

  state.grupos = novosGrupos;
  const preferredId = userData?.activeGroupId;
  if (preferredId && state.grupos[preferredId]) {
    state.grupoAtivoId = preferredId;
  } else if (!state.grupos[state.grupoAtivoId]) {
    state.grupoAtivoId = Object.keys(state.grupos)[0];
  }

  salvarEstadoLocal();
  assinarGrupoAtivo(state.grupoAtivoId);
  renderTudo();
}

async function processarConviteDaURL() {
  const params = new URLSearchParams(location.search);
  if (!currentUser || !(params.has('grupo') || params.has('group') || params.has('convite'))) return;
  try {
    await abrirConvites(params);
    history.replaceState(history.state, document.title, location.pathname);
  } catch (e) { console.error(e); alert(t('multiError')); }
}

function assinarPerfilUsuario(uid) {
  if (unsubscribeUserDoc) {
    unsubscribeUserDoc();
    unsubscribeUserDoc = null;
  }
  if (!uid) return;

  const userRef = getUserProfileRef(uid);
  unsubscribeUserDoc = onSnapshot(userRef, async (snap) => {
    if (!snap.exists() || isSavingCloud) return;
    const data = snap.data();
    if (data.displayName && data.displayName !== currentUserName) {
      salvarNomeUsuarioLocal(data.displayName);
      renderAuthUI();
      renderTudo();
    }
    contaAplicarPerfil(data);
    const groupIds = Array.isArray(data.groupIds) ? data.groupIds : [];
    let mudouLista = false;

    for (const gid of groupIds) {
      if (!state.grupos[gid]) {
        mudouLista = true;
        try {
          const gSnap = await getDoc(getGroupDocRef(gid));
          if (gSnap.exists()) {
            const norm = normalizarEstruturaGrupo(gid, gSnap.data());
            state.grupos[gid] = norm;
            cloudGroupsCache[gid] = norm;
          }
        } catch {}
      }
    }

    if (data.activeGroupId && state.grupos[data.activeGroupId] && state.grupoAtivoId !== data.activeGroupId) {
      state.grupoAtivoId = data.activeGroupId;
      assinarGrupoAtivo(state.grupoAtivoId);
      mudouLista = true;
    }

    if (mudouLista) {
      salvarEstadoLocal();
      renderTudo();
    }
  });
}

// ===== 08. AUTENTICAÇÃO =====
function mostrarFeedbackAuth(msg, tipo = 'err') {
  const box = document.getElementById('auth-feedback');
  if (!box) return;
  if (!msg) {
    box.textContent = '';
    box.className = 'auth-feedback hidden';
    return;
  }
  box.textContent = msg;
  box.className = `auth-feedback ${tipo}`;
}

// Validação de novas senhas, sem restringir o login de contas existentes.
function requisitosSenha(senha) {
  return { length: Array.from(senha).length >= 6, letter: /\p{L}/u.test(senha), number: /[0-9]/.test(senha) };
}
function senhaNovaValida(senha) { return Object.values(requisitosSenha(senha)).every(Boolean); }
function atualizarRequisitosSenha(listaId, senhaId, confirmId) {
  const senha = document.getElementById(senhaId).value;
  const confirm = document.getElementById(confirmId).value;
  const regras = { ...requisitosSenha(senha), match: senha.length > 0 && senha === confirm };
  document.querySelectorAll(`#${listaId} [data-rule]`).forEach(item => {
    const ok = regras[item.dataset.rule];
    item.classList.toggle('rule-ok', ok);
    item.querySelector('.password-rule-mark').textContent = ok ? '✓' : '○';
  });
}
function atualizarRequisitosCadastro() { atualizarRequisitosSenha('auth-password-rules','auth-password','auth-confirm-password'); }
function atualizarRequisitosConta() { atualizarRequisitosSenha('account-password-rules','conta-senha-nova','conta-senha-repetir'); }
function setModoAuth(novoModo) {
  authMode = novoModo;
  document.querySelectorAll('#auth-mode-tabs .auth-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.authMode === novoModo);
  });

  const nameGroup = document.getElementById('auth-name-group');
  const nameInput = document.getElementById('auth-name');
  const isRegister = novoModo === 'register';

  if (nameGroup) {
    nameGroup.classList.toggle('hidden', !isRegister);
  }
  if (nameInput) {
    nameInput.required = isRegister;
    nameInput.disabled = !isRegister;
    if (!isRegister) nameInput.value = '';
  }

  const btnSubmit = document.getElementById('btn-submit-auth');
  if (btnSubmit) {
    btnSubmit.textContent = isRegister ? t('authSubmitRegisterBtn') : t('authSubmitLoginBtn');
  }
  const confirm = document.getElementById('auth-confirm-password');
  document.getElementById('auth-confirm-group').classList.toggle('hidden', !isRegister);
  document.getElementById('auth-password-rules').classList.toggle('hidden', !isRegister);
  confirm.required = isRegister;
  confirm.disabled = !isRegister;
  if (!isRegister) confirm.value = '';
  atualizarRequisitosCadastro();
  document.getElementById('btn-reset-senha').classList.toggle('hidden', isRegister);
  document.getElementById('auth-password').autocomplete = isRegister ? 'new-password' : 'current-password';
  mostrarFeedbackAuth('');
}

// Contas anteriores ao lançamento ficam dispensadas da verificação.
const EMAIL_VERIFICATION_CUTOFF = Date.parse('2026-11-28T01:56:00Z');
function precisaVerificarEmail(user) {
  if (!user || user.emailVerified) return false;
  const created = Date.parse(user.metadata.creationTime || '');
  return !Number.isFinite(created) || created >= EMAIL_VERIFICATION_CUTOFF;
}
function mostrarVerificacao(user) {
  const pending = precisaVerificarEmail(user);
  for (const id of ['form-auth','auth-mode-tabs','btn-login-google','auth-divider-login']) {
    document.getElementById(id).classList.toggle('hidden', pending);
  }
  document.getElementById('auth-verification').classList.toggle('hidden', !pending);
  atualizarBotaoVerificacao();
}
// Intervalo local por UID, persistido para sobreviver ao recarregamento.
let verificacaoEnviando = false;
let verificacaoTimer = null;
const verificacaoPrazos = new Map();
function prazoVerificacao(user) {
  if (!user) return 0;
  let salvo = 0;
  try { salvo = Number(localStorage.getItem('splitrao_verify_until_' + user.uid)) || 0; } catch {}
  return Math.max(salvo, verificacaoPrazos.get(user.uid) || 0);
}
function iniciarPrazoVerificacao(user) {
  const prazo = Date.now() + 60000;
  verificacaoPrazos.set(user.uid, prazo);
  try { localStorage.setItem('splitrao_verify_until_' + user.uid, String(prazo)); } catch {}
}
function atualizarBotaoVerificacao() {
  clearTimeout(verificacaoTimer);
  const user = auth.currentUser;
  const btn = document.getElementById('auth-resend');
  const segundos = Math.max(0, Math.ceil((prazoVerificacao(user) - Date.now()) / 1000));
  btn.disabled = verificacaoEnviando || segundos > 0 || !user;
  btn.textContent = t('verifyResend') + (segundos ? ` (${segundos}s)` : '');
  if (segundos && precisaVerificarEmail(user)) verificacaoTimer = setTimeout(atualizarBotaoVerificacao, 250);
}
async function enviarVerificacao(user) {
  if (verificacaoEnviando || prazoVerificacao(user) > Date.now()) return;
  verificacaoEnviando = true;
  atualizarBotaoVerificacao();
  try {
    auth.languageCode = currentLang;
    await sendEmailVerification(user);
    iniciarPrazoVerificacao(user);
    mostrarFeedbackAuth(t('verifySent'), 'ok');
  } catch (err) {
    if (['auth/too-many-requests','auth/quota-exceeded'].includes(err?.code)) iniciarPrazoVerificacao(user);
    console.warn('Falha no envio de verificação:', err?.code);
    throw err;
  } finally {
    verificacaoEnviando = false;
    atualizarBotaoVerificacao();
  }
}

function renderAuthUI() {
  const loggedBox = document.getElementById('user-logged-box');
  const displayEmail = document.getElementById('user-display-email');
  const avatar = document.getElementById('user-avatar');
  const mainApp = document.getElementById('main-app');
  const authGate = document.getElementById('auth-gate');

  if (currentUser) {
    loggedBox?.classList.remove('hidden');
    const rotulo = currentUserName
      ? `${currentUserName} (${currentUser.email || 'Conta'})`
      : (currentUser.email || currentUser.displayName || t('genericUser'));
    if (displayEmail) displayEmail.textContent = rotulo;
    if (avatar) {
      if (currentUser.photoURL) {
        avatar.src = currentUser.photoURL;
        avatar.classList.remove('hidden');
      } else {
        avatar.classList.add('hidden');
      }
    }
    contaAtualizarAvatar();
    mainApp?.classList.remove('hidden');
    authGate?.classList.add('hidden');
  } else {
    loggedBox?.classList.add('hidden');
    mainApp?.classList.add('hidden');
    authGate?.classList.remove('hidden');
  }
}

function traduzirErroAuth(err) {
  const code = err?.code || '';
  const mapa = {
    'auth/invalid-email': t('authInvalidEmail'),
    'auth/user-not-found': t('authUserNotFound'),
    'auth/wrong-password': t('authWrongPassword'),
    'auth/invalid-credential': t('authInvalidCredential'),
    'auth/email-already-in-use': t('authEmailInUse'),
    'auth/weak-password': t('authWeakPassword'),
    'auth/popup-closed-by-user': t('authPopupClosed'),
    'auth/network-request-failed': t('authNetwork'),
    'auth/too-many-requests': t('verifyRateLimit'),
    'auth/quota-exceeded': t('verifyRateLimit')
  };
  return mapa[code] || t('authGeneric');
}

async function aplicarPersistenciaEscolhida() {
  const chk = document.getElementById('chk-manter-conectado');
  const manter = chk ? chk.checked : true;
  await setPersistence(auth, manter ? browserLocalPersistence : browserSessionPersistence);
}

function initAuthListeners() {
  for (const id of ['auth-password','auth-confirm-password']) document.getElementById(id).addEventListener('input', atualizarRequisitosCadastro);
  document.querySelectorAll('[data-password-toggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      const field = document.getElementById(btn.dataset.passwordToggle);
      const visible = field.type === 'password';
      field.type = visible ? 'text' : 'password';
      btn.setAttribute('aria-pressed', String(visible));
      btn.setAttribute('aria-label', t(visible ? 'hidePassword' : 'showPassword'));
      btn.dataset.i18nAriaLabel = visible ? 'hidePassword' : 'showPassword';
    });
  });
  document.getElementById('auth-resend').addEventListener('click', async () => {
    try { if (auth.currentUser) await enviarVerificacao(auth.currentUser); }
    catch (err) { mostrarFeedbackAuth(traduzirErroAuth(err)); }
  });
  document.getElementById('auth-check').addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) return;
    const btn = document.getElementById('auth-check');
    btn.disabled = true;
    try {
      await reload(user);
      if (precisaVerificarEmail(user)) mostrarFeedbackAuth(t('verifyPending'));
      else { await getIdToken(user, true); await processarSessaoAuth(user); }
    } catch (err) { mostrarFeedbackAuth(traduzirErroAuth(err)); }
    finally { btn.disabled = false; }
  });
  document.getElementById('auth-verification-exit').addEventListener('click', () => signOut(auth).catch(err => mostrarFeedbackAuth(traduzirErroAuth(err))));

  document.querySelectorAll('#auth-mode-tabs .auth-tab').forEach(btn => {
    btn.addEventListener('click', () => setModoAuth(btn.dataset.authMode));
  });

  document.getElementById('btn-login-google')?.addEventListener('click', async () => {
    mostrarFeedbackAuth('');

    try {
      await aplicarPersistenciaEscolhida();
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      mostrarFeedbackAuth(traduzirErroAuth(err), 'err');
    }
  });

  document.getElementById('btn-reset-senha')?.addEventListener('click', async () => {
    const email = document.getElementById('auth-email')?.value?.trim();
    if (!email) {
      mostrarFeedbackAuth(t('authEnterEmailFirst'), 'err');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      mostrarFeedbackAuth(t('authResetSentMsg'), 'ok');
    } catch (err) {
      mostrarFeedbackAuth(traduzirErroAuth(err), 'err');
    }
  });

  document.getElementById('form-auth')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const isRegister = authMode === 'register';
    const nomeCadastro = isRegister ? (document.getElementById('auth-name')?.value?.trim() || '') : '';
    const email = document.getElementById('auth-email')?.value?.trim() || '';
    const senha = document.getElementById('auth-password')?.value || '';
    if (!email || !senha) return;
    if (isRegister && !nomeCadastro) return;
    if (isRegister && !senhaNovaValida(senha)) { mostrarFeedbackAuth(t('passwordPolicyError')); return; }
    if (isRegister && senha !== document.getElementById('auth-confirm-password').value) { mostrarFeedbackAuth(t('passwordMismatch')); return; }

    mostrarFeedbackAuth('');

    try {
      await aplicarPersistenciaEscolhida();
      if (!isRegister) {
        await signInWithEmailAndPassword(auth, email, senha);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, senha);
        if (cred.user) {
          await updateProfile(cred.user, { displayName: nomeCadastro });
          await enviarVerificacao(cred.user);
        }
      }
    } catch (err) {
      mostrarFeedbackAuth(traduzirErroAuth(err), 'err');
    }
  });

  document.getElementById('btn-logout')?.addEventListener('click', async () => {
    if (unsubscribeGroupDoc) {
      unsubscribeGroupDoc();
      unsubscribeGroupDoc = null;
    }
    if (unsubscribeUserDoc) {
      unsubscribeUserDoc();
      unsubscribeUserDoc = null;
    }
    await signOut(auth);
  });

  onAuthStateChanged(auth, processarSessaoAuth);
}

async function processarSessaoAuth(user) {
    contaPrefs = {};
    contaSessao++;
    contaEl('modal-conta').classList.add('hidden');
    contaEl('modal-conta-senha').classList.add('hidden');
    contaEl('modal-conta-excluir').classList.add('hidden');
    contaEl('conta-excluir-form').reset();
    mostrarVerificacao(user);
    if (precisaVerificarEmail(user)) {
      currentUser = null;
      renderAuthUI();
      return;
    }
    currentUser = user || null;
    if (currentUser) {
      // Não exibir nem persistir nomes de outra sessão antes de carregar o perfil.
      salvarNomeUsuarioLocal(currentUser.displayName || currentUser.email?.split('@')[0] || '');
      setSaveStatus('statusConnecting');
      try {
        const userData = await garantirPerfilUsuarioNaNuvem(currentUser);
        await carregarGruposDoUsuario(userData);
        contaAplicarPerfil(userData);
        renderAuthUI();
        assinarPerfilUsuario(currentUser.uid);
        await processarConviteDaURL();
        await processarImportacaoPendenteSplitwise();
      } catch (e) {
        console.error('Erro ao inicializar dados do usuário:', e);
        setSaveStatus('statusOffline');
        renderTudo();
      }
    } else {
      renderAuthUI();
      setSaveStatus('statusOffline');
    }
}

// ===== 09. INTERNACIONALIZAÇÃO (I18N) =====
function atualizarBandeiraAtualUI() {
  document.querySelectorAll('.lang-dropdown').forEach(dropdown => {
    const currentFlagEl = dropdown.querySelector('.lang-current-flag');
    const currentBtn = dropdown.querySelector('.lang-current-btn');
    const activeOpt = dropdown.querySelector(`.lang-option[data-lang="${currentLang}"]`);

    dropdown.querySelectorAll('.lang-option').forEach(opt => {
      opt.classList.toggle('active', opt.dataset.lang === currentLang);
    });

    if (activeOpt && currentFlagEl) {
      currentFlagEl.innerHTML = activeOpt.innerHTML;
      if (currentBtn) currentBtn.title = activeOpt.title;
    }
  });
}

function aplicarIdiomaNaInterface() {
  document.documentElement.lang = currentLang === 'pt' ? 'pt-BR' : currentLang;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const trad = t(key);
    if (trad) el.textContent = trad;
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    const trad = t(key);
    if (trad) el.placeholder = trad;
  });

  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.dataset.i18nTitle;
    const trad = t(key);
    if (trad) el.title = trad;
  });

  document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
    el.setAttribute('aria-label', t(el.dataset.i18nAriaLabel));
  });

  for(const id of ['moeda-gasto','novo-grupo-moeda','quitar-moeda']) preencherMoedas(document.getElementById(id));
  atualizarTituloQuitar();
  atualizarBandeiraAtualUI();

  setModoAuth(authMode);
  atualizarBotaoVerificacao();
  atualizarLabelDataGasto();
  atualizarDataQuitacao();
  atualizarSeletorMoedaUI();

  const btnSubmitGasto = document.getElementById('btn-submit-gasto');
  const editIdAtual = document.getElementById('edit-gasto-id')?.value || '';
  if (btnSubmitGasto) {
    btnSubmitGasto.textContent = editIdAtual ? t('updateExpenseBtn') : t('saveExpenseBtn');
  }

  renderTudo();
}

function fecharMenusIdioma() {
  document.querySelectorAll('.lang-dropdown').forEach(dropdown => {
    dropdown.querySelector('.lang-menu')?.classList.add('hidden');
    dropdown.querySelector('.lang-current-btn')?.setAttribute('aria-expanded', 'false');
  });
}

function initLanguageSwitcher() {
  document.querySelectorAll('.lang-dropdown').forEach(dropdown => {
    const trigger = dropdown.querySelector('.lang-current-btn');
    const menu = dropdown.querySelector('.lang-menu');

    trigger?.addEventListener('click', (e) => {
      e.stopPropagation();
      const estavaFechado = menu?.classList.contains('hidden');
      fecharMenusIdioma();
      if (estavaFechado) {
        menu?.classList.remove('hidden');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });

    dropdown.querySelectorAll('.lang-option').forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        const novoLang = opt.dataset.lang;
        fecharMenusIdioma();
        if (!novoLang || novoLang === currentLang) return;
        currentLang = novoLang;
        localStorage.setItem(LANG_STORAGE_KEY, currentLang);
        aplicarIdiomaNaInterface();
        if (currentUser) setDoc(getUserProfileRef(currentUser.uid), {accountPreferences:{language:currentLang}}, {merge:true}).catch(console.warn);
      });
    });
  });

  document.addEventListener('click', fecharMenusIdioma);
}

// ===== 10. MENUS DE 3 TRACINHOS =====
function setMenu3DotsAberto(aberto) {
  menu3DotsAberto = Boolean(aberto);
  if (menu3DotsAberto) setMenu3DotsHomeAberto(false);
  const btn = document.getElementById('btn-menu-3dots');
  const drop = document.getElementById('dropdown-3dots');
  btn?.setAttribute('aria-expanded', String(menu3DotsAberto));
  drop?.classList.toggle('hidden', !menu3DotsAberto);
}

function setMenu3DotsHomeAberto(aberto) {
  menuHome3DotsAberto = Boolean(aberto);
  if (menuHome3DotsAberto) setMenu3DotsAberto(false);
  const btn = document.getElementById('btn-menu-3dots-home');
  const drop = document.getElementById('dropdown-3dots-home');
  btn?.setAttribute('aria-expanded', String(menuHome3DotsAberto));
  drop?.classList.toggle('hidden', !menuHome3DotsAberto);
}

// ===== 11. ACESSO E GERENCIAMENTO DE GRUPOS =====
function getGrupoAtivo() {
  if (!state.grupos[state.grupoAtivoId]) {
    const keys = Object.keys(state.grupos);
    if (keys.length > 0) {
      state.grupoAtivoId = keys[0];
    } else {
      const novo = criarGrupoPadrao();
      state.grupos[novo.id] = novo;
      state.grupoAtivoId = novo.id;
    }
  }
  return state.grupos[state.grupoAtivoId];
}

function getTextoSaldoUsuarioNoGrupo(grupo) {
  garantirUsuarioLogadoNoGrupo(grupo);
  const meName = getMeParticipantName(grupo);
  if (!meName) {
    return { texto: t('myBalanceZero'), classe: 'neutro' };
  }

  const { stats } = calcularBalancoGrupo(grupo);
  const meuSaldo = stats[meName]?.saldo || 0;

  if (meuSaldo > 0.01) {
    return {
      texto: t('myBalanceReceiveTotal', { val: formatMoney(meuSaldo, moedaBase(grupo)) }),
      classe: 'positivo'
    };
  }
  if (meuSaldo < -0.01) {
    return {
      texto: t('myBalancePayTotal', { val: formatMoney(Math.abs(meuSaldo), moedaBase(grupo)) }),
      classe: 'negativo'
    };
  }
  return {
    texto: t('myBalanceZero'),
    classe: 'neutro'
  };
}

function getGruposOrdenados() {
  const lista = Object.values(state.grupos || {}).filter(g => g && !g.deleted);
  return lista
    .map((grupo, idx) => ({
      grupo,
      idx,
      ordem: typeof grupo.order === 'number' ? grupo.order : idx
    }))
    .sort((a, b) => (a.ordem !== b.ordem ? a.ordem - b.ordem : a.idx - b.idx))
    .map(item => item.grupo);
}

async function persistirOrdemGrupos(gruposOrdenados) {
  for (let i = 0; i < gruposOrdenados.length; i++) {
    const g = gruposOrdenados[i];
    g.order = i;
    if (state.grupos[g.id]) {
      state.grupos[g.id].order = i;
    }
  }
  salvarEstadoLocal();

  for (const g of gruposOrdenados) {
    await salvarGrupoNaNuvem(g);
  }
}

// Reordenação visual: os cartões abrem espaço sem alterar o estado durante o gesto.
function anexarDragReordenacaoGrupo(itemEl, grupoId, listaEl) {
  const handle = itemEl.querySelector('.group-drag-handle');
  if (!handle) return;
  let gesto = null;
  let bloquearClick = false;

  function aoMover(ev) {
    if (!gesto || ev.pointerId !== gesto.id) return;
    if (!itemEl.isConnected) { finalizar(ev, false); return; }
    const g = gesto;
    const delta = ev.clientY - g.y + window.scrollY - g.scroll;
    if (!g.ativo && Math.abs(delta) <= 6) return;
    if (!g.ativo) {
      g.ativo = true;
      bloquearClick = true;
      itemEl.classList.add('is-dragging');
      g.itens.forEach(el => { el.style.transition = el === itemEl ? 'none' : 'transform 180ms ease'; });
    }
    ev.preventDefault();
    const centro = g.top.get(itemEl) + delta + g.altura.get(itemEl) / 2;
    // Posições naturais, sem depender dos retângulos em animação.
    const outros = g.itens.filter(el => el !== itemEl);
    let destino = 0;
    for (const el of outros) {
      if (centro > g.top.get(el) + g.altura.get(el) / 2) destino++;
    }
    g.ordem = [...outros];
    g.ordem.splice(destino, 0, itemEl);
    let y = g.top.get(g.itens[0]);
    for (const el of g.ordem) {
      el.style.transform = el === itemEl
        ? `translateY(${delta}px) scale(1.015)`
        : `translateY(${y - g.top.get(el)}px)`;
      y += g.altura.get(el) + g.gap;
    }
  }

  async function finalizar(ev, confirmar) {
    if (!gesto || ev.pointerId !== gesto.id) return;
    const g = gesto;
    gesto = null;
    window.removeEventListener('pointermove', aoMover);
    window.removeEventListener('pointerup', aoSoltar);
    window.removeEventListener('pointercancel', aoCancelar);
    handle.removeEventListener('lostpointercapture', aoCancelar);
    if (handle.hasPointerCapture(ev.pointerId)) handle.releasePointerCapture(ev.pointerId);
    g.itens.forEach(el => {
      el.classList.remove('is-dragging');
      el.style.transform = '';
      el.style.transition = '';
    });
    if (g.ativo) {
      setTimeout(() => { bloquearClick = false; }, 100);
      if (!confirmar || !itemEl.isConnected || g.ordem.every((el, i) => el === g.itens[i])) return;
      const atuais = getGruposOrdenados();
      const ids = g.ordem.map(el => el.dataset.groupId);
      if (atuais.length !== ids.length || atuais.some(el => !ids.includes(el.id))) return;
      const ordenados = ids.map(id => state.grupos[id]);
      // A função atualiza a ordem local antes da primeira operação assíncrona.
      const salvamento = persistirOrdemGrupos(ordenados);
      renderSeletorGrupos();
      await salvamento;
    }
  }
  const aoSoltar = ev => finalizar(ev, true);
  const aoCancelar = ev => finalizar(ev, false);

  handle.addEventListener('pointerdown', ev => {
    if (gesto || ev.isPrimary === false || ev.button !== 0) return;
    ev.stopPropagation();
    ev.preventDefault();
    const itens = Array.from(listaEl.querySelectorAll('.group-list-item'));
    const top = new Map(itens.map(el => [el, el.offsetTop]));
    const altura = new Map(itens.map(el => [el, el.offsetHeight]));
    const gap = parseFloat(getComputedStyle(listaEl).rowGap) || 0;
    gesto = { id: ev.pointerId, y: ev.clientY, scroll: window.scrollY, itens, top, altura, gap, ordem: itens, ativo: false };
    handle.setPointerCapture(ev.pointerId);
    window.addEventListener('pointermove', aoMover, { passive: false });
    window.addEventListener('pointerup', aoSoltar);
    window.addEventListener('pointercancel', aoCancelar);
    handle.addEventListener('lostpointercapture', aoCancelar);
  });
  itemEl.addEventListener('click', ev => {
    if (bloquearClick || ev.target.closest('.group-drag-handle')) {
      ev.preventDefault();
      ev.stopPropagation();
    }
  }, true);
}

function renderSeletorGrupos() {
  const grupo = getGrupoAtivo();
  const listaEl = document.getElementById('lista-grupos');

  if (listaEl) {
    listaEl.innerHTML = '';

    getGruposOrdenados().forEach(g => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'group-list-item';
      item.dataset.groupId = g.id;
      item.setAttribute('role', 'option');

      const foto = g.image || g.photo || '';
      const thumbHTML = foto
        ? `<img src="${escapeHTML(foto)}" alt="${escapeHTML(g.nome)}">`
        : `<span class="group-list-thumb-fallback">👥</span>`;

      const { texto: saldoTexto, classe: saldoClasse } = getTextoSaldoUsuarioNoGrupo(g);

      item.innerHTML = `
        <span class="group-list-thumb">${thumbHTML}</span>
        <span class="group-list-info">
          <span class="group-list-name">${escapeHTML(g.nome)}</span>
          <span class="group-list-balance ${saldoClasse}">${escapeHTML(saldoTexto)}</span>
        </span>
        <span class="group-drag-handle" title="Arrastar para reordenar" aria-label="Arrastar para reordenar">⋮⋮</span>
        <span class="group-list-chevron">›</span>
      `;

      item.addEventListener('click', async () => {
        if (state.grupoAtivoId !== g.id) {
          await trocarGrupoAtivo(g.id, { abrirDetalhe: true });
        } else {
          abrirTelaDetalheGrupo(g.id);
        }
      });

      anexarDragReordenacaoGrupo(item, g.id, listaEl);
      listaEl.appendChild(item);
    });
  }

  const nomeDestaque = document.getElementById('grupo-destaque-nome');
  if (nomeDestaque) {
    nomeDestaque.textContent = grupo.nome;
  }

  const codigoVal = document.getElementById('menu-codigo-valor');
  if (codigoVal) {
    codigoVal.textContent = state.grupoAtivoId;
  }
}

function renderImagemGrupo(grupo) {
  const imgEl = document.getElementById('grupo-destaque-img');
  const fallbackEl = document.getElementById('grupo-destaque-fallback');
  if (!imgEl || !fallbackEl) return;

  const foto = grupo?.image || grupo?.photo || '';
  if (foto) {
    imgEl.src = foto;
    imgEl.alt = grupo?.nome || 'Imagem do grupo';
    imgEl.classList.remove('hidden');
    fallbackEl.classList.add('hidden');
  } else {
    imgEl.removeAttribute('src');
    imgEl.classList.add('hidden');
    fallbackEl.classList.remove('hidden');
  }
}

async function trocarGrupoAtivo(novoId, { abrirDetalhe = false } = {}) {
  if (!state.grupos[novoId]) return;
  state.grupoAtivoId = novoId;
  filtroCategoriaAtual = 'todas';
  cancelarEdicao();
  salvarEstadoLocal();
  assinarGrupoAtivo(novoId);
  if (currentUser) {
    await vincularGrupoAoUsuario(currentUser.uid, novoId, true);
  }
  if (abrirDetalhe || telaAtiva === 'detalhe') {
    abrirTelaDetalheGrupo(novoId);
  } else {
    renderTudo();
  }
}

// Solicita um nome usando o mesmo padrão visual dos demais modais.
// Conversão explícita de uma cópia importada; mantém valores originais.
function converterBaseImportada(grupo, destino, taxa) {
  if (destino===moedaBase(grupo)) return;
  if (!(taxa>0 && Number.isFinite(taxa))) throw new Error('Invalid rate');
  grupo.moedaReferencia = moedaReferencia(grupo);
  grupo.fatoresMoeda = { ...(grupo.fatoresMoeda || {}), [destino]: destino===moedaReferencia(grupo)?1:(grupo.fatoresMoeda?.[destino] || fatorMoeda(grupo)*taxa) };
  grupo.moedaBase=destino; grupo.taxasCambio={};
}
// Lista única de moedas, com nomes localizados pelo navegador.
function preencherMoedas(select) {
  if (!select) return;
  const anterior = select.value;
  const nomes = new Intl.DisplayNames([currentLang], {type:'currency'});
  const principais = ['BRL','USD','EUR','ARS','CLP','UYU','PYG','BOB','PEN'];
  const outras = Object.keys(MOEDAS).filter(c=>!principais.includes(c)).sort((a,b)=>nomes.of(a).localeCompare(nomes.of(b),currentLang));
  select.replaceChildren();
  for (const code of [...principais,...outras]) {
    const compacto = select.id === 'moeda-gasto';
    select.add(new Option(compacto ? code : `${code} — ${nomes.of(code)} (${MOEDAS[code].symbol})`, code));
  }
  select.value = MOEDAS[anterior] ? anterior : 'BRL';
}
// Busca local: não consulta a rede nem altera a moeda até a seleção.
function adicionarBuscaMoeda(select) {
  if (!select || select.dataset.buscaMoeda) return;
  select.dataset.buscaMoeda='1';
  const busca=document.createElement('input'); busca.type='text'; busca.inputMode='search'; busca.autocomplete='off';
  busca.dataset.i18nPlaceholder='currencySearch'; busca.dataset.i18nAriaLabel='currencySearch';
  busca.placeholder=t('currencySearch'); busca.setAttribute('aria-label',t('currencySearch'));
  busca.style.cssText='width:100%;min-width:0;margin-bottom:8px';
  busca.addEventListener('keydown', e=>{if(e.key==='Enter') e.preventDefault();});
  select.before(busca);
  busca.addEventListener('input',()=>{
    const q=normalizarTexto(busca.value);
    for(const opt of select.options) opt.hidden=opt.value!==select.value && !normalizarTexto(opt.text).includes(q);
  });
  select.addEventListener('change',()=>{busca.value='';for(const opt of select.options)opt.hidden=false;});
}
// Duas casas quando a perda relativa é pequena; mais precisão para taxas baixas.
function formatarCotacaoSugerida(rate) {
  if (!Number.isFinite(rate)||rate<=0) return '';
  for(let d=2;d<=15;d++) {
    const texto=rate.toFixed(d), n=Number(texto);
    if(n>0 && (d===2 && rate>=1 || Math.abs(n-rate)/rate<=0.001)) return texto;
  }
  return String(rate);
}
async function consultarCotacao(origem,destino) {
  const res=await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(origem)}`);
  if(!res.ok)throw new Error('FX unavailable');
  const rate=(await res.json())?.rates?.[destino];
  if(!Number.isFinite(rate)||rate<=0)throw new Error('Invalid FX rate');
  return rate;
}

function solicitarNomeNovoGrupo({ perfil = false, renomear = false, nomeAtual = "" } = {}) {
  const modal = document.getElementById('modal-novo-grupo');
  const form = document.getElementById('form-novo-grupo');
  const input = document.getElementById('novo-grupo-nome');
  const campoMoeda = document.getElementById('novo-grupo-moeda-campo');
  campoMoeda.classList.toggle('hidden', perfil || renomear);
  const seletorMoeda = document.getElementById('novo-grupo-moeda');
  seletorMoeda.value = MOEDAS[contaPrefs.currency] ? contaPrefs.currency : 'BRL';
  const buscaMoeda = seletorMoeda.previousElementSibling;
  if (buscaMoeda?.dataset.i18nPlaceholder === 'currencySearch') {
    buscaMoeda.value = '';
    for (const opt of seletorMoeda.options) opt.hidden = false;
  }
  const focoAnterior = document.activeElement;
  document.getElementById('novo-grupo-titulo').textContent = t(renomear ? 'renameGroupTitle' : perfil ? 'nameLabel' : 'newGroupFull');
  document.getElementById('novo-grupo-label').textContent = t(renomear ? 'renameGroupPrompt' : perfil ? 'askMyNamePrompt' : 'newGroupPrompt');
  document.getElementById('btn-confirmar-novo-grupo').textContent = t(renomear ? 'saveGroupName' : perfil ? 'confirmNameBtn' : 'createGroupBtn');
  input.value = nomeAtual;
  modal.classList.remove('hidden');
  input.focus();
  return new Promise(resolve => {
    const fechar = valor => {
      modal.classList.add('hidden');
      form.removeEventListener('submit', enviar);
      modal.removeEventListener('click', clicar);
      document.removeEventListener('keydown', teclado);
      focoAnterior?.focus();
      resolve(valor);
    };
    const enviar = e => {
      e.preventDefault();
      if (input.value.trim()) fechar(perfil || renomear ? input.value.trim() : {nome:input.value.trim(), moeda:seletorMoeda.value});
    };
    const clicar = e => {
      if (e.target === modal || ['btn-fechar-novo-grupo', 'btn-cancelar-novo-grupo'].includes(e.target.id)) fechar(null);
    };
    const teclado = e => {
      if (e.key === 'Escape') { e.preventDefault(); fechar(null); }
    };
    form.addEventListener('submit', enviar);
    modal.addEventListener('click', clicar);
    document.addEventListener('keydown', teclado);
  });
}

async function criarNovoGrupo() {
  const escolha = await solicitarNomeNovoGrupo();
  if (!escolha) return;
  let novoGrupo = criarGrupoPadrao('', escolha.nome);
  novoGrupo.moedaBase = escolha.moeda;
  novoGrupo.moedaReferencia = escolha.moeda;
  novoGrupo.order = getGruposOrdenados().length;

  let nomeUsuario = getNomeUsuarioEfetivo();
  if (!nomeUsuario) {
    const perguntado = await solicitarNomeNovoGrupo({ perfil: true });
    if (perguntado && perguntado.trim()) {
      nomeUsuario = perguntado.trim();
      await persistirNomeNoPerfil(nomeUsuario);
    }
  }

  if (nomeUsuario) {
    novoGrupo.pessoas.push(nomeUsuario);
    novoGrupo.meuParticipante = nomeUsuario;
    if (currentUser) novoGrupo.nomesPadrao = { [currentUser.uid]: true };
  }

  try {
    novoGrupo = await reservarNovoGrupo(novoGrupo);
  } catch (err) {
    console.error('Erro ao reservar grupo:', err);
    alert(t('groupCodeError'));
    return;
  }
  const id = novoGrupo.id;
  if (nomeUsuario) setMeParticipantName(novoGrupo, nomeUsuario);
  state.grupos[id] = novoGrupo;
  state.grupoAtivoId = id;
  filtroCategoriaAtual = 'todas';
  cancelarEdicao();
  await salvarGrupoNaNuvem(novoGrupo);
  if (currentUser) {
    await vincularGrupoAoUsuario(currentUser.uid, id, true);
  }
  assinarGrupoAtivo(id);
  abrirTelaDetalheGrupo(id);
  return novoGrupo;
}

async function renomearGrupoAtual() {
  const grupo = getGrupoAtivo();
  setMenu3DotsAberto(false);
  const novoNome = await solicitarNomeNovoGrupo({ renomear: true, nomeAtual: grupo.nome });
  if (!novoNome || !novoNome.trim()) return;
  grupo.nome = novoNome.trim();
  await salvarGrupoNaNuvem(grupo);
  renderTudo();
}

// Exibe as opções de saída e mantém a confirmação explícita para exclusão global.
function solicitarAcaoSaidaGrupo(grupo, confirmarExclusao = false, podeExcluir = false) {
  const modal = document.getElementById('modal-sair-grupo');
  const opcoes = document.getElementById('sair-grupo-opcoes');
  const confirmar = document.getElementById('btn-confirmar-excluir-todos');
  const cancelar = document.getElementById('btn-cancelar-sair-grupo');
  const focoAnterior = document.activeElement;
  document.getElementById('sair-grupo-titulo').textContent = t(confirmarExclusao ? 'deleteEveryoneBtn' : 'leaveDeleteBtn');
  document.getElementById('sair-grupo-texto').textContent = t(confirmarExclusao ? 'deleteGroupConfirm' : (podeExcluir ? 'leaveGroupModalText' : 'leaveOnlyText'), { name: grupo.nome });
  document.getElementById('btn-excluir-todos').classList.toggle('hidden', !podeExcluir);
  opcoes.classList.toggle('hidden', confirmarExclusao);
  confirmar.classList.toggle('hidden', !confirmarExclusao);
  modal.classList.remove('hidden');
  cancelar.focus();
  return new Promise(resolve => {
    const fechar = valor => {
      modal.classList.add('hidden');
      modal.removeEventListener('click', clicar);
      document.removeEventListener('keydown', teclado);
      focoAnterior?.focus();
      resolve(valor);
    };
    const clicar = e => {
      const id = e.target.id;
      if (e.target === modal || ['btn-fechar-sair-grupo', 'btn-cancelar-sair-grupo'].includes(id)) fechar(null);
      else if (!confirmarExclusao && id === 'btn-apenas-sair') fechar('1');
      else if (!confirmarExclusao && podeExcluir && id === 'btn-excluir-todos') fechar('2');
      else if (confirmarExclusao && id === 'btn-confirmar-excluir-todos') fechar(true);
    };
    const teclado = e => {
      if (e.key === 'Escape') { e.preventDefault(); fechar(null); }
    };
    modal.addEventListener('click', clicar);
    document.addEventListener('keydown', teclado);
  });
}

async function excluirOuSairDoGrupo() {
  const grupo = getGrupoAtivo();
  const uid = currentUser?.uid;
  if (!uid) return;
  const ref = getGroupDocRef(grupo.id);
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Group unavailable');
    const membros = membrosReais(snap.data());
    const podeExcluir = membros[uid] === true && Object.keys(membros).length === 1;
    const op = await solicitarAcaoSaidaGrupo(grupo, false, podeExcluir);
    if (!op) return;
    if (op === '2' && (!podeExcluir || !await solicitarAcaoSaidaGrupo(grupo, true, true))) return;
    isSavingCloud = true;
    // Revalida os vínculos e atualiza o perfil na mesma transação.
    await runTransaction(db, async tx => {
      const atual = await tx.get(ref);
      const perfilRef = getUserProfileRef(uid);
      const perfil = await tx.get(perfilRef);
      if (!atual.exists() || !perfil.exists()) throw new Error('Group unavailable');
      const data = atual.data();
      const ativos = membrosReais(data);
      if (!ativos[uid]) throw new Error('Membership unavailable');
      if (op === '2') {
        if (Object.keys(ativos).length !== 1) throw new Error('Other members exist');
        tx.delete(ref);
      } else {
        delete ativos[uid];
        const vinculos = { ...(data.vinculos || {}) };
        const nome = vinculos[uid];
        delete vinculos[uid];
        tx.update(ref, { vinculos, participantesSemApp: [...new Set([...(data.participantesSemApp || []), ...(nome ? [nome] : [])])] });
        atualizarMembros(tx, ref, data, ativos);
      }
      const ids = (perfil.data().groupIds || []).filter(id => id !== grupo.id);
      tx.update(perfilRef, { groupIds: ids, activeGroupId: ids[0] || null, updatedAt: Date.now() });
    });
    unsubscribeGroupDoc?.();
    unsubscribeGroupDoc = null;
    delete state.grupos[grupo.id];
    delete cloudGroupsCache[grupo.id];
    delete meByGroupCache[grupo.id];
    const restantes = Object.keys(state.grupos);
    if (!restantes.length) {
      // Mantém o comportamento anterior de criar um grupo inicial vazio.
      let padrao = criarGrupoPadrao('', 'Grupo Principal');
      const nome = getNomeUsuarioEfetivo();
      if (nome) { padrao.pessoas.push(nome); padrao.meuParticipante = nome; }
      padrao = await reservarNovoGrupo(padrao);
      state.grupos[padrao.id] = padrao;
      await vincularGrupoAoUsuario(uid, padrao.id, true);
    }
    state.grupoAtivoId = Object.keys(state.grupos)[0];
    salvarEstadoLocal();
    assinarGrupoAtivo(state.grupoAtivoId);
    abrirTelaListaGrupos();
  } catch (e) {
    console.error('Erro ao sair/excluir grupo:', e);
    alert(t('leaveDeleteError'));
  } finally { isSavingCloud = false; }
}

// Abre o convite sem alertas do navegador; mantém o link original do grupo.
function compartilharConviteGrupo(linkPersonalizado = null) {
  const grupo = getGrupoAtivo();
  if (!grupo) return;
  const link = typeof linkPersonalizado === "string" ? linkPersonalizado : `${window.location.origin}${window.location.pathname}?grupo=${encodeURIComponent(grupo.id)}`;
  const modal = document.getElementById('modal-convite');
  const campo = document.getElementById('convite-link');
  const feedback = document.getElementById('convite-feedback');
  const compartilhar = document.getElementById('btn-share-convite');
  const copiar = document.getElementById('btn-copy-convite');
  const focoAnterior = document.activeElement;
  campo.value = link;
  feedback.textContent = '';
  compartilhar.classList.toggle('hidden', typeof navigator.share !== 'function');
  modal.classList.remove('hidden');
  copiar.focus();

  const fechar = () => {
    modal.classList.add('hidden');
    modal.removeEventListener('click', clicar);
    document.removeEventListener('keydown', teclado);
    copiar.removeEventListener('click', copiarLink);
    compartilhar.removeEventListener('click', enviarLink);
    focoAnterior?.focus();
  };
  const clicar = e => {
    if (e.target === modal || ['btn-fechar-convite', 'btn-cancelar-convite'].includes(e.target.id)) fechar();
  };
  const teclado = e => { if (e.key === 'Escape') { e.preventDefault(); fechar(); } };
  const copiarLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      feedback.textContent = t('inviteCopySuccess');
    } catch {
      campo.focus(); campo.select();
      feedback.textContent = t('inviteCopyManual');
    }
  };
  const enviarLink = async () => {
    try {
      await navigator.share({ title: grupo.nome, text: t('inviteModalText'), url: link });
    } catch (erro) {
      if (erro.name !== 'AbortError') feedback.textContent = t('inviteShareError');
    }
  };
  modal.addEventListener('click', clicar);
  document.addEventListener('keydown', teclado);
  copiar.addEventListener('click', copiarLink);
  compartilhar.addEventListener('click', enviarLink);
}

// Solicita código sem usar a janela nativa do navegador.
function solicitarCodigoGrupo() {
  const modal = document.getElementById('modal-entrar-codigo');
  const form = document.getElementById('form-entrar-codigo');
  const input = document.getElementById('entrar-codigo-input');
  const foco = document.activeElement;
  input.value = '';
  modal.classList.remove('hidden');
  input.focus();
  return new Promise(resolve => {
    const fechar = valor => {
      modal.classList.add('hidden');
      form.removeEventListener('submit', enviar);
      modal.removeEventListener('click', clicar);
      document.removeEventListener('keydown', teclado);
      foco?.focus();
      resolve(valor);
    };
    const enviar = e => { e.preventDefault(); if (input.value.trim()) fechar(input.value.trim()); };
    const clicar = e => { if (e.target === modal || e.target.closest('#btn-fechar-entrar-codigo, #btn-cancelar-entrar-codigo')) fechar(null); };
    const teclado = e => { if (e.key === 'Escape') { e.preventDefault(); fechar(null); } };
    form.addEventListener('submit', enviar);
    modal.addEventListener('click', clicar);
    document.addEventListener('keydown', teclado);
  });
}
async function entrarPorCodigoOuLink() {
  if (!currentUser) return;
  const raw = await solicitarCodigoGrupo();
  if (!raw || !currentUser) return;
  try {
    const params = raw.includes('?') ? new URL(raw, location.href).searchParams : new URLSearchParams({grupo: /^[a-hj-np-z2-9]{8}$/i.test(raw) ? raw.toUpperCase() : raw});
    await abrirConvites(params);
  } catch (e) { console.error(e); alert(t('multiError')); }
}

// ===== 12. PARTICIPANTES E CONVITES =====
function modalSelecao(titulo, montar) {
  const modal = document.getElementById('modal-v26'), corpo = document.getElementById('v26-corpo');
  document.getElementById('v26-titulo').textContent = titulo;
  corpo.replaceChildren();
  const confirmar = document.getElementById('v26-confirmar');
  confirmar.onclick = null;
  modal.classList.remove('hidden');
  return new Promise(resolve => {
    const fechar = valor => { modal.classList.add('hidden'); modal.onclick = null; document.removeEventListener('keydown', tecla); resolve(valor); };
    const tecla = e => { if (e.key === 'Escape') fechar(null); };
    modal.onclick = e => { if (e.target === modal || e.target.closest('#v26-cancelar, #v26-fechar')) fechar(null); };
    document.addEventListener('keydown', tecla);
    montar(corpo, fechar);
  });
}
function botaoV26(corpo, texto, acao) {
  const b = document.getElementById('v26-confirmar'); b.textContent = texto; b.onclick = acao;
}
async function criarConviteMultiplo() {
  if (!currentUser) return;
  const ids = await modalSelecao(t('multiInvite'), (corpo, fechar) => {
    const caixas = [];
    const linha = (nome, id) => { const l = document.createElement('label'), c = document.createElement('input'); c.type = 'checkbox'; c.checked = true; l.style.display = 'block'; l.append(c, ' ' + nome); corpo.append(l); if (id) caixas.push([id,c]); return c; };
    const todos = linha(t('multiAll'));
    for (const g of Object.values(state.grupos)) linha(g.nome, g.id);
    todos.onchange = () => caixas.forEach(([,c]) => c.checked = todos.checked);
    caixas.forEach(([,c]) => c.onchange = () => { todos.checked = caixas.every(([,x]) => x.checked); });
    botaoV26(corpo, t('multiGenerate'), () => { const ids = caixas.filter(([,c]) => c.checked).map(([id]) => id); if (ids.length) fechar(ids); });
  });
  if (!ids) return;
  try {
    const codigo = crypto.randomUUID();
    await setDoc(doc(db, 'convitesMultiplos', codigo), { groupIds: ids, createdBy: currentUser.uid, expiresAt: Date.now() + 7*86400000 - 60000 });
    compartilharConviteGrupo(`${location.origin}${location.pathname}?convite=${codigo}`);
  } catch (e) { console.error(e); alert(t(e.code === 'permission-denied' ? 'multiPermissionError' : 'multiError')); }
}
// Identifica nomes livres; em grupos legados, preserva identidades incertas.
function participantesSemVinculo(data, uid = null) {
  const vinculos = data.vinculos || {};
  const pessoas = data.pessoas || [];
  const ocupados = new Set(Object.values(vinculos).map(normalizarTexto));
  const legados = Object.keys(membrosReais(data)).some(u => u !== uid &&
    !pessoas.includes(vinculos[u]));
  const marcados = new Set((data.participantesSemApp || []).map(normalizarTexto));
  return pessoas.filter(nome => !ocupados.has(normalizarTexto(nome)) &&
    (!legados || marcados.has(normalizarTexto(nome))));
}

function participantesDisponiveis(data, uid) {
  return participantesSemVinculo(data, uid);
}

// Campos compartilhados entre ingresso por convite e importação.
function camposParticipante(corpo, nomes) {
  const select = document.createElement('select'), input = document.createElement('input');
  select.style.width = input.style.width = '100%'; input.type = 'text';
  const opcao = (v,n) => { const o = document.createElement('option'); o.value=v; o.textContent=n; select.append(o); };
  // Exige escolha explícita quando existem participantes disponíveis.
  if (nomes.length) {
    opcao('__selecionar__', t('chooseExistingParticipant'));
    select.options[0].disabled = true;
  }
  for (const nome of nomes) {
    opcao(nome,nome);
  }
  opcao('', t('multiNew'));
  if (nomes.length) select.value = '__selecionar__';
  const atualizar = () => {
    input.disabled = select.value === '__selecionar__';
    input.value = getNomeUsuarioEfetivo();
  };
  select.onchange=atualizar; atualizar();
  const label = document.createElement('label'); label.textContent=t('multiName');
  const instrucao = document.createElement('label'); instrucao.textContent = t('chooseExistingParticipant');
  // Controles no padrão dos formulários do aplicativo.
  const campoSelecao = document.createElement('div'), campoNome = document.createElement('div');
  campoSelecao.className = campoNome.className = 'form-group';
  campoSelecao.style.marginBottom = campoNome.style.marginBottom = '0';
  instrucao.append(select); label.append(input);
  select.style.marginTop = input.style.marginTop = '6px';
  campoSelecao.append(instrucao); campoNome.append(label);
  corpo.append(campoSelecao, campoNome);
  return {select,input};
}

// Confirma identidades de todos os grupos antes de gravar qualquer importação.
async function selecionarParticipantesImportacao(grupos, restauracao = false) {
  return modalSelecao(t('importParticipantTitle'), (corpo, fechar) => {
    const campos = grupos.map(grupo => {
      const titulo = document.createElement('h3'); titulo.textContent = grupo.nome; corpo.append(titulo);
      const moeda = document.createElement('select'); preencherMoedas(moeda); moeda.value=moedaBase(grupo);
      const taxa = document.createElement('input'); taxa.type='number'; taxa.step='any'; taxa.min='0'; taxa.value='1';
      const label = document.createElement('label'); label.textContent=t('baseCurrency'); label.append(moeda); corpo.append(label);
      const labelTaxa=document.createElement('label'); labelTaxa.append(taxa); corpo.append(labelTaxa);
      const atualizar=()=>{labelTaxa.hidden=moeda.value===moedaBase(grupo); labelTaxa.firstChild===taxa && labelTaxa.prepend(document.createTextNode('')); labelTaxa.firstChild.textContent=`1 ${moedaBase(grupo)} = ${moeda.value} `; taxa.value=labelTaxa.hidden?'1':'';}; moeda.onchange=atualizar; atualizar();
      const campos = camposParticipante(corpo, grupo.pessoas);
      if (restauracao) {
        label.hidden = true; labelTaxa.hidden = true;
        const atualizarNome = campos.select.onchange;
        campos.select.onchange = () => { atualizarNome(); if (grupo.pessoas.includes(campos.select.value)) campos.input.value = campos.select.value; };
      }
      return {grupo, moeda, taxa, ...campos};
    });
    botaoV26(corpo, t('importParticipantConfirm'), () => {
      for (const {grupo,select,input,moeda,taxa} of campos) {
        if (moeda.value!==moedaBase(grupo) && !(Number(taxa.value)>0 && Number.isFinite(Number(taxa.value)))) {alert(t("baseRateRequired"));return;}
        const nome = input.value.trim();
        if (select.value === '__selecionar__' || !nome || grupo.pessoas.some(p => p !== select.value && normalizarTexto(p) === normalizarTexto(nome))) {
          alert(t('importParticipantDuplicate')); return;
        }
      }
      fechar(campos.map(({select,input,moeda,taxa}) => ({escolha:select.value,nome:input.value.trim(),moeda:moeda.value,taxa:Number(taxa.value)})));
    });
  });
}

async function abrirConvites(params) {
  let ids = [params.get('grupo') || params.get('group')].filter(Boolean);
  if (params.has('convite')) {
    const snap = await getDoc(doc(db, 'convitesMultiplos', params.get('convite')));
    if (!snap.exists() || snap.data().expiresAt <= Date.now()) throw new Error('Expired invite');
    ids = [...new Set(snap.data().groupIds || [])];
  }
  if (!ids.length) throw new Error('Empty invite');
  const uid = currentUser.uid, pendentes = [];
  for (const id of ids) {
    const snap = await getDoc(getGroupDocRef(id));
    if (!snap.exists() || snap.data().deleted) throw new Error('Group unavailable');
    pendentes.push({ id, data: snap.data() });
  }
  const escolhas = await modalSelecao(t('multiJoin'), (corpo, fechar) => {
    const campos = [];
    for (const {id,data} of pendentes) {
      const titulo = document.createElement('h3'); titulo.textContent = data.nome; corpo.append(titulo);
      if (membrosReais(data)[uid] && data.vinculos?.[uid] && data.pessoas.includes(data.vinculos[uid])) { campos.push({id, existente:true}); continue; }
      campos.push({id, ...camposParticipante(corpo, participantesDisponiveis(data, uid))});
    }
    botaoV26(corpo,t('multiConfirm'),() => { if (campos.some(c => !c.existente && (c.select.value === '__selecionar__' || !c.input.value.trim()))) return; fechar(campos.map(c => ({id:c.id, escolha:c.existente?null:c.select.value, nome:c.existente?null:c.input.value.trim()}))); });
  });
  if (!escolhas) return;
  let primeiro = null;
  for (const e of escolhas) {
    let grupo = await ingressarGrupo(e.id, uid, e.escolha, e.nome);

    state.grupos[e.id] = cloudGroupsCache[e.id] = grupo;
    primeiro ||= e.id;
  }
  if (primeiro) { state.grupoAtivoId=primeiro; salvarEstadoLocal(); assinarGrupoAtivo(primeiro); if (ids.length===1) abrirTelaDetalheGrupo(primeiro); else abrirTelaListaGrupos(); }
}
async function renomearMeuNomeV26(id, nome, usarPadrao = false, somentePadrao = false) {
  const uid = currentUser.uid;
  return runTransaction(db, async tx => {
    const ref = getGroupDocRef(id), snap = await tx.get(ref);
    if (!snap.exists() || !membrosReais(snap.data())[uid]) throw new Error('Group unavailable');
    const data = snap.data(), grupo = normalizarEstruturaGrupo(id,data);
    const antigo = grupo.vinculos[uid];
    if (somentePadrao && (grupo.nomesPadrao[uid] !== true || antigo === nome)) return null;
    if (!antigo || grupo.pessoas.some(p => p !== antigo && normalizarTexto(p) === normalizarTexto(nome))) throw new Error('Duplicate or unavailable participant');
    if (!grupo.pessoas.includes(antigo)) throw new Error("Participant unavailable");
    renomearNomeEmGrupo(grupo, antigo, nome);
    grupo.vinculos[uid] = nome;
    grupo.nomesPadrao[uid] = usarPadrao;
    tx.update(ref, { pessoas:grupo.pessoas, gastos:grupo.gastos, participantesSemApp:grupo.participantesSemApp, vinculos:grupo.vinculos, nomesPadrao:grupo.nomesPadrao, meuParticipante:grupo.meuParticipante || null });
    return grupo;
  });
}
// Renomeia somente participantes livres, conferindo o vínculo no servidor.
async function renomearParticipanteSemApp(id, antigo, nome) {
  const uid = currentUser.uid;
  return runTransaction(db, async tx => {
    const ref = getGroupDocRef(id), snap = await tx.get(ref);
    if (!snap.exists() || snap.data().deleted || !membrosReais(snap.data())[uid]) throw new Error('Group unavailable');
    const data = snap.data();
    if (!participantesSemVinculo(data).includes(antigo)) throw new Error('Participant unavailable');
    const grupo = normalizarEstruturaGrupo(id, data);
    if (!grupo.pessoas.includes(antigo) || grupo.pessoas.some(p => p !== antigo && normalizarTexto(p) === normalizarTexto(nome))) throw new Error('Duplicate or unavailable participant');
    renomearNomeEmGrupo(grupo, antigo, nome);
    tx.update(ref, { pessoas:grupo.pessoas, gastos:grupo.gastos, participantesSemApp:grupo.participantesSemApp, meuParticipante:grupo.meuParticipante || null });
    return grupo;
  });
}
async function editarMeuNomeV26(participante = null) {
  const grupo = getGrupoAtivo();
  const proprio = participante === null;
  const atual = proprio ? getMeParticipantName(grupo) : participante;
  if (!proprio && !participantesSemVinculo(grupo).includes(atual)) return;
  if (!atual) { try { await abrirConvites(new URLSearchParams({grupo:grupo.id})); } catch(e) { console.error(e); alert(t('multiError')); } return; }
  const nome = await modalSelecao(t(proprio ? 'groupMyName' : 'editParticipantName'), (corpo,fechar) => { const input=document.createElement('input'); input.type='text'; input.value=atual; input.style.width='100%'; input.style.marginTop='6px'; const campo=document.createElement('div'); campo.className='form-group'; campo.style.marginBottom='0'; const label=document.createElement('label'); label.textContent=t(proprio ? 'multiName' : 'editParticipantName'); label.append(input); campo.append(label); corpo.append(campo); botaoV26(corpo,t('saveGroupName'),()=>{if(input.value.trim()) fechar({nome:input.value.trim(), padrao:false});}); if (proprio) { const padrao=document.createElement('button'); padrao.type='button'; padrao.className='btn-secondary'; padrao.style.marginTop='10px'; padrao.textContent=t('useAccountName'); padrao.onclick=()=>fechar({nome:getNomeUsuarioEfetivo(),padrao:true}); corpo.append(padrao); } });
  if (!nome) return;
  try { const atualizado = proprio ? await renomearMeuNomeV26(grupo.id,nome.nome,nome.padrao) : await renomearParticipanteSemApp(grupo.id,atual,nome.nome); state.grupos[grupo.id] = cloudGroupsCache[grupo.id] = atualizado; salvarEstadoLocal(); renderTudo(); } catch(e) { console.error(e); alert(t('multiError')); }
}



async function adicionarParticipante(nomeRaw, { marcarComoEu = false, semApp = false } = {}) {
  const nome = String(nomeRaw || '').trim();
  if (!nome) return false;

  const grupo = getGrupoAtivo();
  grupo.participantesSemApp = Array.isArray(grupo.participantesSemApp) ? grupo.participantesSemApp : [];
  const existente = grupo.pessoas.find(p => normalizarTexto(p) === normalizarTexto(nome));

  if (existente) {
    if (marcarComoEu) {
      grupo.participantesSemApp = grupo.participantesSemApp.filter(p => p !== existente);
      setMeParticipantName(grupo, existente);
      await salvarGrupoNaNuvem(grupo);
      renderTudo();
      return true;
    }
    alert(t('personExistsAlert'));
    return false;
  }

  grupo.pessoas.push(nome);
  if (semApp && !marcarComoEu) {
    grupo.participantesSemApp.push(nome);
  }
  if (marcarComoEu) {
    setMeParticipantName(grupo, nome);
    await persistirNomeNoPerfil(nome);
  }
  await salvarGrupoNaNuvem(grupo);
  renderTudo();
  return true;
}

async function removerParticipante(nome) {
  const grupo = getGrupoAtivo();
  if (Object.values(grupo.vinculos || {}).includes(nome)) { alert(t('multiError')); return; }
  const emUso = grupo.gastos.some(g => {
    if (g.tipo === 'pagamento') return g.de === nome || g.para === nome;
    if (g.pagador === nome) return true;
    if (g.divisao && Object.prototype.hasOwnProperty.call(g.divisao, nome)) return true;
    return Array.isArray(g.participantes) && g.participantes.includes(nome);
  });

  if (emUso) {
    alert(t('personInUseAlert', { name: nome }));
    return;
  }

  grupo.pessoas = grupo.pessoas.filter(p => p !== nome);
  grupo.participantesSemApp = (grupo.participantesSemApp || []).filter(p => p !== nome);
  if (grupo.meuParticipante === nome) {
    grupo.meuParticipante = null;
  }
  await salvarGrupoNaNuvem(grupo);
  renderTudo();
}

function renderListaPessoas() {
  const grupo = getGrupoAtivo();
  const container = document.getElementById('lista-pessoas');
  if (!container) return;
  container.innerHTML = '';

  const meName = getMeParticipantName(grupo);
  const semAppSet = new Set(participantesSemVinculo(grupo));

  if (grupo.pessoas.length === 0) {
    container.innerHTML = `<span class="empty-state-text">${escapeHTML(t('noParticipantsGroup'))}</span>`;
    return;
  }

  grupo.pessoas.forEach(pessoa => {
    const isMe = pessoa === meName;
    const isUnlinked = !isMe && semAppSet.has(pessoa);
    const tag = document.createElement('span');
    tag.className = isMe ? 'tag tag-is-me' : 'tag';

    const nomeSpan = document.createElement('span');
    nomeSpan.textContent = pessoa;
    tag.appendChild(nomeSpan);

    if (isMe) {
      const euBadge = document.createElement('span');
      euBadge.className = 'tag-eu-badge';
      euBadge.textContent = t('meBadge');
      tag.appendChild(euBadge);
    } else if (isUnlinked) {
      const unlinkedNote = document.createElement('span');
      unlinkedNote.className = 'tag-unlinked-note';
      unlinkedNote.textContent = t('unlinkedParticipantTag');
      tag.appendChild(unlinkedNote);
    }
    if (isMe || isUnlinked) {
      // Edição de nomes permitidos diretamente na lista de participantes.
      const btnEditar = document.createElement('button');
      btnEditar.type = 'button';
      btnEditar.className = 'tag-edit-me';
      btnEditar.title = t(isMe ? 'groupMyName' : 'editParticipantName');
      btnEditar.setAttribute('aria-label', t(isMe ? 'groupMyName' : 'editParticipantName'));
      btnEditar.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 5 4 4M4 20l4-1L20 7l-4-4L4 15z"/></svg>';
      btnEditar.addEventListener('click', () => editarMeuNomeV26(isMe ? null : pessoa));
      tag.appendChild(btnEditar);
    }

    const btnRem = document.createElement('button');
    btnRem.type = 'button';
    btnRem.className = 'tag-remove';
    btnRem.textContent = '×';
    btnRem.title = t('removeLabel');
    btnRem.addEventListener('click', () => removerParticipante(pessoa));

    tag.appendChild(btnRem);
    container.appendChild(tag);
  });
}

// ===== 13. CATEGORIAS, DATA E MOEDA =====
function fecharMenuCategoria() {
  document.getElementById('category-selector')?.classList.add('hidden');
  document.getElementById('btn-categoria')?.setAttribute('aria-expanded', 'false');
}
function renderSeletorCategorias() {
  const grid = document.getElementById('category-selector');
  const trigger = document.getElementById('btn-categoria');
  if (!grid || !trigger) return;
  const atual = categoriaSelecionada || 'Geral';
  const nome = getNomeCategoriaTraduzido(atual);
  trigger.innerHTML = (getCategoriaObj(atual) || getCategoriaObj('Geral')).icon;
  trigger.title = nome;
  trigger.setAttribute('aria-label', t('categoryLabel') + ': ' + nome);
  grid.innerHTML = '';
  CATEGORIAS.forEach(cat => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = atual === cat.id ? 'cat-btn active' : 'cat-btn';
    btn.setAttribute('aria-pressed', String(atual === cat.id));
    btn.innerHTML = `${cat.icon}<span>${escapeHTML(getNomeCategoriaTraduzido(cat.id))}</span>`;
    btn.addEventListener('click', () => {
      categoriaSelecionada = cat.id;
      categoriaDetectadaAuto = null;
      atualizarBadgeCategoriaAuto();
      renderSeletorCategorias();
      fecharMenuCategoria();
      trigger.focus();
    });
    grid.appendChild(btn);
  });
}

function atualizarBadgeCategoriaAuto() {
  const badge = document.getElementById('auto-cat-badge');
  if (!badge) return;
  badge.classList.toggle('hidden', !categoriaDetectadaAuto || categoriaSelecionada !== categoriaDetectadaAuto);
}

// Data da quitação: mesmo padrão visual e formato das despesas.
function atualizarDataQuitacao() {
  const data = document.getElementById('quitar-data').value;
  document.getElementById('label-quitar-data').textContent = data ? formatDateLabel(data) : t('paymentDate');
  document.getElementById('btn-quitar-data').classList.toggle('custom-date', !!data && data !== getTodayISO());
}
function atualizarLabelDataGasto() {
  const label = document.getElementById('label-data-gasto');
  const btn = document.getElementById('btn-data-gasto');
  const hoje = getTodayISO();
  if (!dataGastoSelecionada) dataGastoSelecionada = hoje;
  if (label) label.textContent = formatDateLabel(dataGastoSelecionada);
  if (btn) btn.classList.toggle('custom-date', dataGastoSelecionada !== hoje);
}

function atualizarSeletorMoedaUI() {
  const moeda = document.getElementById('moeda-gasto')?.value || moedaBase();
  const boxCambio = document.getElementById('box-cambio');
  const currCodeEl = document.getElementById('exchange-curr-code');
  const titleEl = document.getElementById('exchange-rate-label');

  if (moeda === moedaBase()) {
    boxCambio?.classList.add('hidden');
    return;
  }

  boxCambio?.classList.remove('hidden');
  if (currCodeEl) currCodeEl.textContent = moeda;
  document.getElementById('exchange-base-code').textContent = moedaBase();
  if (titleEl) titleEl.textContent = t('exchangeTitle', { curr: moeda, base: moedaBase() });

  const inputTaxa = document.getElementById('taxa-cambio');
  const grupo = getGrupoAtivo();
  if (inputTaxa && (!inputTaxa.value || parseFloat(inputTaxa.value) <= 0)) {
    const salva = grupo?.taxasCambio?.[moeda];
    if (typeof salva === 'number' && salva > 0) {
      inputTaxa.value = salva;
    }
  }
  atualizarConversaoCambioUI();
}

function atualizarConversaoCambioUI() {
  const moeda = document.getElementById('moeda-gasto')?.value || moedaBase();
  if (moeda === moedaBase()) return;
  const valor = parseFloat(document.getElementById('valor-gasto')?.value) || 0;
  const taxa = getTaxaCambioAtual(moeda);
  const convertido = valor * taxa;
  const el = document.getElementById('valor-convertido-brl');
  if (el) el.textContent = formatMoney(convertido, moedaBase());
}

async function buscarCotacaoMoeda(moeda) {
  if (!moeda || moeda === moedaBase()) return;
  const statusEl = document.getElementById('cambio-status-msg');
  const inputTaxa = document.getElementById('taxa-cambio');
  if (statusEl) statusEl.textContent = t('fetchingRateMsg');

  const grupo = getGrupoAtivo(), base = moedaBase(grupo);
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(moeda)}`);
    if (!res.ok) throw new Error('Falha na API de câmbio');
    const data = await res.json();
    const rate = data?.rates?.[base];
    if (typeof rate !== 'number' || rate <= 0) throw new Error('Cotação BRL ausente');

    if (getGrupoAtivo().id !== grupo.id || moedaBase() !== base || document.getElementById("moeda-gasto").value !== moeda) return;
    const rounded = rate;
    if (inputTaxa) inputTaxa.value = rounded;

    grupo.taxasCambio = grupo.taxasCambio || {};
    grupo.taxasCambio[moeda] = rounded;
    atualizarConversaoCambioUI();
    if (statusEl) statusEl.textContent = t('rateFetchedMsg', { curr: moeda, base: moedaBase() });
  } catch {
    if (statusEl) statusEl.textContent = t('rateErrorMsg');
  }
}

// ===== 14. FORMULÁRIO DE GASTOS E DIVISÃO =====
function setFormGastoVisivel(visivel) {
  formGastoAberto = Boolean(visivel);
  const modalGasto = document.getElementById('modal-form-gasto');
  const containerForm = document.getElementById('container-form-gasto');

  modalGasto?.classList.toggle('hidden', !formGastoAberto);
  if (containerForm) {
    containerForm.classList.toggle('hidden', !formGastoAberto);
  }
}

function renderPagadorSelect(preferirEu = false) {
  const grupo = getGrupoAtivo();
  const select = document.getElementById('pagador-gasto');
  if (!select) return;

  const valorAnterior = select.value;
  const editId = document.getElementById('edit-gasto-id')?.value;
  const desconhecido = grupo.gastos.some(g => g.id === editId && g.pagadorNaoIdentificado);
  const meName = getMeParticipantName(grupo);
  select.innerHTML = '';

  if (grupo.pessoas.length === 0) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = t('addSomeoneAbove');
    select.appendChild(opt);
    return;
  }

  grupo.pessoas.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p;
    opt.textContent = p === meName ? `${p} (${t('meBadge')})` : p;
    select.appendChild(opt);
  });

  if (desconhecido) {
    const opt = new Option(t('unknownPayer'), '__splitrao_unknown__');
    select.prepend(opt);
    if (valorAnterior === '__splitrao_unknown__') { select.value = valorAnterior; return; }
  }
  if (preferirEu && !editId && meName && grupo.pessoas.includes(meName)) {
    select.value = meName;
  } else if (valorAnterior && grupo.pessoas.includes(valorAnterior)) {
    select.value = valorAnterior;
  } else if (meName && grupo.pessoas.includes(meName)) {
    select.value = meName;
  }
}

function capturarValoresCustomAtuais() {
  const mapa = {};
  document.querySelectorAll('#area-divisao-dinamica [data-pessoa-custom]').forEach(input => {
    mapa[input.dataset.pessoaCustom] = parseFloat(input.value) || 0;
  });
  return mapa;
}

function renderAreaDivisao(valoresPredefinidos = null) {
  const grupo = getGrupoAtivo();
  const area = document.getElementById('area-divisao-dinamica');
  const feedback = document.getElementById('split-feedback');
  if (!area) return;
  const editId = document.getElementById('edit-gasto-id')?.value;
  const pessoalImportado = grupo.gastos.some(g => g.id === editId && g.pagadorNaoIdentificado);
  for (const id of ['split-mode-tabs','btn-todos']) document.getElementById(id)?.classList.toggle('hidden', pessoalImportado);
  if (pessoalImportado) { area.textContent = t('noSplit'); feedback?.classList.add('hidden'); return; }

  if (grupo.pessoas.length === 0) {
    area.innerHTML = `<span class="empty-state-text">${escapeHTML(t('addPeopleStep1Hint'))}</span>`;
    feedback?.classList.add('hidden');
    return;
  }

  const valoresAtuais = valoresPredefinidos || capturarValoresCustomAtuais();

  if (modoDivisaoAtual === 'igual') {
    const wrap = document.createElement('div');
    wrap.className = 'pills-wrap';

    grupo.pessoas.forEach(p => {
      const label = document.createElement('label');
      label.className = 'person-pill';

      const chk = document.createElement('input');
      chk.type = 'checkbox';
      chk.value = p;
      chk.checked = true;
      chk.addEventListener('change', atualizarFeedbackDivisao);

      const span = document.createElement('span');
      span.textContent = p;

      label.appendChild(chk);
      label.appendChild(span);
      wrap.appendChild(label);
    });

    area.innerHTML = '';
    area.appendChild(wrap);
  } else {
    const lista = document.createElement('div');
    lista.className = 'custom-split-list';

    grupo.pessoas.forEach(p => {
      const row = document.createElement('div');
      row.className = 'custom-split-row';

      const nomeSpan = document.createElement('span');
      nomeSpan.className = 'custom-split-name';
      nomeSpan.textContent = p;

      const grp = document.createElement('div');
      grp.className = 'custom-split-input-group';

      const prefix = document.createElement('span');
      prefix.textContent = modoDivisaoAtual === 'exato' ? MOEDAS[moedaBase()].symbol : '×';

      const inp = document.createElement('input');
      inp.type = 'number';
      inp.min = '0';
      inp.step = modoDivisaoAtual === 'exato' ? 'any' : '1';
      inp.dataset.pessoaCustom = p;
      inp.placeholder = modoDivisaoAtual === 'exato' ? '0,00' : '0';
      if (valoresAtuais[p] !== undefined && valoresAtuais[p] > 0) {
        inp.value = valoresAtuais[p];
      }
      inp.addEventListener('input', atualizarFeedbackDivisao);

      grp.appendChild(prefix);
      grp.appendChild(inp);
      row.appendChild(nomeSpan);
      row.appendChild(grp);
      lista.appendChild(row);
    });

    area.innerHTML = '';
    area.appendChild(lista);
  }

  atualizarFeedbackDivisao();
}

function getValorTotalInformadoEmBRL() {
  const valor = parseFloat(document.getElementById('valor-gasto')?.value) || 0;
  const moeda = document.getElementById('moeda-gasto')?.value || moedaBase();
  const taxa = getTaxaCambioAtual(moeda);
  return valor * taxa;
}

function atualizarFeedbackDivisao() {
  const feedback = document.getElementById('split-feedback');
  if (!feedback) return;

  const grupo = getGrupoAtivo();
  if (grupo.gastos.some(g => g.id === document.getElementById('edit-gasto-id')?.value && g.pagadorNaoIdentificado)) { feedback.classList.add('hidden'); return; }
  if (grupo.pessoas.length === 0) {
    feedback.classList.add('hidden');
    return;
  }

  const totalBRL = getValorTotalInformadoEmBRL();
  feedback.classList.remove('hidden', 'ok', 'warn', 'err');

  if (modoDivisaoAtual === 'igual') {
    const selecionados = Array.from(document.querySelectorAll('#area-divisao-dinamica input[type="checkbox"]:checked')).map(c => c.value);
    if (selecionados.length === 0) {
      feedback.classList.add('err');
      feedback.textContent = t('selectAtLeastOne');
      return;
    }
    const cada = totalBRL / selecionados.length;
    feedback.classList.add('ok');
    feedback.textContent = t('perPersonFeedback', {
      val: formatMoney(cada, moedaBase()),
      n: selecionados.length
    });
    return;
  }

  if (modoDivisaoAtual === 'exato') {
    let soma = 0;
    document.querySelectorAll('#area-divisao-dinamica [data-pessoa-custom]').forEach(inp => {
      soma += parseFloat(inp.value) || 0;
    });
    soma = Math.round(soma * 100) / 100;
    const alvo = Math.round(totalBRL * 100) / 100;

    if (alvo <= 0) {
      feedback.classList.add('warn');
      feedback.textContent = t('typedSumFeedback', { val: formatMoney(soma, moedaBase()) });
      return;
    }

    const diff = Math.round((alvo - soma) * 100) / 100;
    if (Math.abs(diff) < 0.01) {
      feedback.classList.add('ok');
      feedback.textContent = t('exactMatchFeedback', { val: formatMoney(alvo, moedaBase()) });
    } else if (diff > 0) {
      feedback.classList.add('warn');
      feedback.textContent = t('missingAmountFeedback', {
        diff: formatMoney(diff, moedaBase()),
        sum: formatMoney(soma, moedaBase())
      });
    } else {
      feedback.classList.add('err');
      feedback.textContent = t('exceededAmountFeedback', {
        diff: formatMoney(Math.abs(diff), moedaBase())
      });
    }
    return;
  }

  if (modoDivisaoAtual === 'cotas') {
    let totalCotas = 0;
    document.querySelectorAll('#area-divisao-dinamica [data-pessoa-custom]').forEach(inp => {
      totalCotas += parseFloat(inp.value) || 0;
    });

    if (totalCotas <= 0) {
      feedback.classList.add('err');
      feedback.textContent = t('sharesZeroErr');
      return;
    }

    if (totalBRL > 0) {
      feedback.classList.add('ok');
      feedback.textContent = t('sharesRateFeedback', {
        n: totalCotas,
        val: formatMoney(totalBRL / totalCotas, moedaBase())
      });
    } else {
      feedback.classList.add('warn');
      feedback.textContent = t('sharesConfigFeedback', { n: totalCotas });
    }
  }
}

function construirDivisaoParaSalvar(totalBRL) {
  if (modoDivisaoAtual === 'igual') {
    const selecionados = Array.from(document.querySelectorAll('#area-divisao-dinamica input[type="checkbox"]:checked')).map(c => c.value);
    if (selecionados.length === 0) {
      alert(t('selectAtLeastOne'));
      return null;
    }
    const parcela = totalBRL / selecionados.length;
    const divisao = {};
    selecionados.forEach(p => {
      divisao[p] = parcela;
    });
    return { modoDivisao: 'igual', divisao, participantes: selecionados };
  }

  if (modoDivisaoAtual === 'exato') {
    const divisao = {};
    const participantes = [];
    let soma = 0;
    document.querySelectorAll('#area-divisao-dinamica [data-pessoa-custom]').forEach(inp => {
      const val = parseFloat(inp.value) || 0;
      if (val > 0) {
        divisao[inp.dataset.pessoaCustom] = val;
        participantes.push(inp.dataset.pessoaCustom);
        soma += val;
      }
    });
    soma = Math.round(soma * 100) / 100;
    const alvo = Math.round(totalBRL * 100) / 100;
    if (Math.abs(alvo - soma) > 0.02) {
      alert(`${t('missingAmountFeedback', { diff: formatMoney(Math.abs(alvo - soma), moedaBase()), sum: formatMoney(soma, moedaBase()) })}`);
      return null;
    }
    return { modoDivisao: 'exato', divisao, participantes };
  }

  const cotas = {};
  let totalCotas = 0;
  document.querySelectorAll('#area-divisao-dinamica [data-pessoa-custom]').forEach(inp => {
    const c = parseFloat(inp.value) || 0;
    if (c > 0) {
      cotas[inp.dataset.pessoaCustom] = c;
      totalCotas += c;
    }
  });
  if (totalCotas <= 0) {
    alert(t('sharesZeroErr'));
    return null;
  }
  const divisao = {};
  const participantes = Object.keys(cotas);
  participantes.forEach(p => {
    divisao[p] = (totalBRL * cotas[p]) / totalCotas;
  });
  return { modoDivisao: 'cotas', divisao, participantes, cotas };
}

function cancelarEdicao() {
  fecharMenuCategoria();
  document.getElementById('edit-gasto-id').value = '';
  document.getElementById('form-gasto')?.reset();
  document.getElementById('moeda-gasto').value = moedaBase();
  document.querySelector('#pagador-gasto option[value="__splitrao_unknown__"]')?.remove();
  renderPagadorSelect(true);
  dataGastoSelecionada = getTodayISO();
  atualizarLabelDataGasto();
  categoriaSelecionada = null;
  categoriaDetectadaAuto = null;
  atualizarBadgeCategoriaAuto();
  renderSeletorCategorias();
  modoDivisaoAtual = 'igual';
  document.querySelectorAll('#split-mode-tabs .mode-tab').forEach(b => b.classList.toggle('active', b.dataset.mode === 'igual'));
  document.getElementById('card-form-gasto')?.classList.remove('editing-mode');
  document.getElementById('titulo-form-gasto').textContent = t('sec2TitleNew');
  document.getElementById('btn-cancelar-edicao')?.classList.add('hidden');
  document.getElementById('btn-submit-gasto').textContent = t('saveExpenseBtn');
  atualizarSeletorMoedaUI();
  renderAreaDivisao();
}

function iniciarEdicaoGasto(gastoId) {
  const grupo = getGrupoAtivo();
  const g = grupo.gastos.find(item => item.id === gastoId);
  if (!g || g.tipo === 'pagamento') return;

  setFormGastoVisivel(true);
  document.getElementById('edit-gasto-id').value = g.id;
  document.getElementById('desc-gasto').value = g.descricao || '';
  dataGastoSelecionada = g.data || getTodayISO();
  atualizarLabelDataGasto();

  fecharMenuCategoria();
  categoriaSelecionada = g.categoria || null;
  categoriaDetectadaAuto = null;
  atualizarBadgeCategoriaAuto();
  renderSeletorCategorias();

  const moeda = g.moeda || moedaBase();
  document.getElementById('moeda-gasto').value = moeda;
  document.getElementById('valor-gasto').value = g.valor;
  if (typeof g.taxaCambio === 'number') {
    document.getElementById('taxa-cambio').value = taxaExibida(g, grupo);
  }
  atualizarSeletorMoedaUI();

  if (g.pagadorNaoIdentificado) {
    renderPagadorSelect();
    document.getElementById('pagador-gasto').value = '__splitrao_unknown__';
  } else if (grupo.pessoas.includes(g.pagador)) {
    document.getElementById('pagador-gasto').value = g.pagador;
  }

  modoDivisaoAtual = g.modoDivisao || 'igual';
  document.querySelectorAll('#split-mode-tabs .mode-tab').forEach(b => b.classList.toggle('active', b.dataset.mode === modoDivisaoAtual));

  if (modoDivisaoAtual === 'igual') {
    const marcados = g.participantes || Object.keys(g.divisao || {});
    const wrap = document.createElement('div');
    wrap.className = 'pills-wrap';
    grupo.pessoas.forEach(p => {
      const lbl = document.createElement('label');
      lbl.className = 'person-pill';
      const chk = document.createElement('input');
      chk.type = 'checkbox';
      chk.value = p;
      chk.checked = marcados.includes(p);
      chk.addEventListener('change', atualizarFeedbackDivisao);
      const sp = document.createElement('span');
      sp.textContent = p;
      lbl.appendChild(chk);
      lbl.appendChild(sp);
      wrap.appendChild(lbl);
    });
    const area = document.getElementById('area-divisao-dinamica');
    area.innerHTML = '';
    area.appendChild(wrap);
    atualizarFeedbackDivisao();
  } else if (modoDivisaoAtual === 'exato') {
    renderAreaDivisao(divisaoExibida(g, grupo));
    document.querySelectorAll('#area-divisao-dinamica [data-pessoa-custom]').forEach(i=>i.dataset.valorInicial=i.value);
  } else {
    renderAreaDivisao(g.cotas || {});
  }

  document.getElementById('card-form-gasto')?.classList.add('editing-mode');
  document.getElementById('titulo-form-gasto').textContent = t('sec2TitleEdit');
  document.getElementById('btn-cancelar-edicao')?.classList.remove('hidden');
  document.getElementById('btn-submit-gasto').textContent = t('updateExpenseBtn');
  document.getElementById('card-form-gasto')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function esconderToastUndo() {
  const toast = document.getElementById('toast-undo');
  toast?.classList.add('hidden');
}

async function confirmarExclusaoPendente() {
  if (!undoPendente) return;
  const pendente = undoPendente;
  clearTimeout(pendente.timerId);
  undoPendente = null;
  esconderToastUndo();

  const grupo = state.grupos[pendente.groupId];
  if (grupo) {
    await salvarGrupoNaNuvem(grupo);
  }
}

async function desfazerExclusaoLancamento() {
  if (!undoPendente) return;
  const pendente = undoPendente;
  clearTimeout(pendente.timerId);
  undoPendente = null;
  esconderToastUndo();

  const grupo = state.grupos[pendente.groupId];
  if (!grupo) return;

  const jaExiste = grupo.gastos.some(g => g.id === pendente.item.id);
  if (!jaExiste) {
    const idx = Math.min(Math.max(0, pendente.index), grupo.gastos.length);
    grupo.gastos.splice(idx, 0, pendente.item);
  }

  await salvarGrupoNaNuvem(grupo);
  if (state.grupoAtivoId === pendente.groupId) {
    renderTudo();
  }
}

async function apagarLancamento(id) {
  const grupo = getGrupoAtivo();
  const idx = grupo.gastos.findIndex(g => g.id === id);
  if (idx < 0) return;

  if (undoPendente) {
    await confirmarExclusaoPendente();
  }

  const [itemRemovido] = grupo.gastos.splice(idx, 1);
  salvarEstadoLocal();
  renderTudo();

  const labelItem = itemRemovido.tipo === 'pagamento'
    ? `${itemRemovido.de || '?'} → ${itemRemovido.para || '?'}`
    : (itemRemovido.descricao || t('genericEntry'));

  const toast = document.getElementById('toast-undo');
  const msgEl = document.getElementById('toast-undo-msg');
  if (msgEl) msgEl.textContent = t('deletedToastMsg', { item: labelItem });
  toast?.classList.remove('hidden');

  const groupId = grupo.id;
  const timerId = setTimeout(async () => {
    if (!undoPendente || undoPendente.item.id !== itemRemovido.id) return;
    undoPendente = null;
    esconderToastUndo();
    const gAlvo = state.grupos[groupId];
    if (gAlvo) {
      await salvarGrupoNaNuvem(gAlvo);
    }
  }, 6000);

  undoPendente = {
    groupId,
    item: itemRemovido,
    index: idx,
    timerId
  };
}

// ===== 15. CÁLCULO DE SALDOS E ACERTOS =====
function calcularBalancoGrupo(grupo) {
  const pessoas = grupo.pessoas || [];
  const gastos = grupo.gastos || [];

  const stats = {};
  pessoas.forEach(p => {
    stats[p] = {
      nome: p,
      pagou: 0,
      consumiu: 0,
      acertosLiquidos: 0,
      saldo: 0
    };
  });

  const acharChaveStats = (nome) => {
    if (!nome) return null;
    if (stats[nome]) return nome;
    const alvo = String(nome).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    return Object.keys(stats).find(k =>
      k.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() === alvo
    ) || null;
  };

  for (const g of gastos) {
    if (!g) continue;
    const valBRL = Number(getValorEmBRL(g, grupo)) || 0;

    if (g.tipo === 'pagamento') {
      const { de: deRaw, para: paraRaw } = extrairPartesPagamento(g);
      const chaveDe = acharChaveStats(deRaw);
      const chavePara = acharChaveStats(paraRaw);

      if (chaveDe && stats[chaveDe]) stats[chaveDe].acertosLiquidos += valBRL;
      if (chavePara && stats[chavePara]) stats[chavePara].acertosLiquidos -= valBRL;
      continue;
    }

    if (g.pagadorNaoIdentificado) continue;
    const chavePagador = acharChaveStats(g.pagador);
    if (chavePagador && stats[chavePagador]) {
      stats[chavePagador].pagou += valBRL;
    }

    const divisao = g.divisao || {};
    for (const [pessoa, share] of Object.entries(divisao)) {
      const parte = (Number(share) || 0) * fatorMoeda(grupo);
      const chavePessoa = acharChaveStats(pessoa);
      if (chavePessoa && stats[chavePessoa]) {
        stats[chavePessoa].consumiu += parte;
      }
    }
  }

  const credores = [];
  const devedores = [];

  pessoas.forEach(p => {
    const s = stats[p];
    const saldoBruto=s.pagou-s.consumiu+s.acertosLiquidos;
    s.pagou = Math.round(s.pagou * 100) / 100;
    s.consumiu = Math.round(s.consumiu * 100) / 100;
    s.acertosLiquidos = Math.round(s.acertosLiquidos * 100) / 100;
    s.saldo = Math.round(saldoBruto * 100) / 100;

    if (s.saldo > 0.01) {
      credores.push({ pessoa: p, valor: s.saldo });
    } else if (s.saldo < -0.01) {
      devedores.push({ pessoa: p, valor: Math.round(Math.abs(s.saldo) * 100) / 100 });
    }
  });

  credores.sort((a, b) => b.valor - a.valor);
  devedores.sort((a, b) => b.valor - a.valor);

  const transferencias = [];
  let i = 0;
  let j = 0;

  while (i < devedores.length && j < credores.length) {
    const dev = devedores[i];
    const cred = credores[j];
    const quantia = Math.round(Math.min(dev.valor, cred.valor) * 100) / 100;

    if (quantia > 0.01) {
      transferencias.push({
        de: dev.pessoa,
        para: cred.pessoa,
        valor: quantia
      });
    }

    dev.valor = Math.round((dev.valor - quantia) * 100) / 100;
    cred.valor = Math.round((cred.valor - quantia) * 100) / 100;

    if (dev.valor <= 0.01) i++;
    if (cred.valor <= 0.01) j++;
  }

  return { stats, transferencias };
}

function renderMeuSaldoDestaque(grupo, stats, transferencias) {
  const box = document.getElementById('meu-saldo-box');
  const cabecalho = document.getElementById('saldo-grupo-cabecalho');
  if (!box || !cabecalho) return;
  cabecalho.classList.add('hidden');
  cabecalho.textContent = '';

  if (!grupo.pessoas || grupo.pessoas.length === 0) {
    box.classList.add('hidden');
    box.innerHTML = '';
    return;
  }

  const meName = getMeParticipantName(grupo);
  box.classList.remove('hidden');

  if (!meName || !stats[meName]) {
    box.innerHTML = `
      <div class="meu-saldo-top">
        <span class="empty-state-text">${escapeHTML(t('myBalanceLinkHint'))}</span>
      </div>
    `;
    return;
  }

  const meuSaldo = stats[meName].saldo || 0;
  const classeSaldo = meuSaldo > 0.01 ? 'positivo' : (meuSaldo < -0.01 ? 'negativo' : 'neutro');
  const valorAbsFmt = formatMoney(Math.abs(meuSaldo), moedaBase());

  let fraseResumoTopo = t('myBalanceZero');
  if (meuSaldo < -0.01) {
    fraseResumoTopo = t('myBalancePayTotal', { val: valorAbsFmt });
  } else if (meuSaldo > 0.01) {
    fraseResumoTopo = t('myBalanceReceiveTotal', { val: valorAbsFmt });
  }

  cabecalho.className = `saldo-grupo-cabecalho ${classeSaldo}`;
  // Destaca o valor sem alterar a frase traduzida ou os cálculos.
  const partes = fraseResumoTopo.split(valorAbsFmt);
  if (partes.length === 2) {
    const valor = document.createElement('strong');
    valor.className = 'saldo-grupo-valor';
    valor.textContent = valorAbsFmt;
    cabecalho.append(partes[0], valor, partes[1]);
  } else cabecalho.textContent = fraseResumoTopo;

  const aReceber = transferencias.filter(tr => tr.para === meName);
  const aPagar = transferencias.filter(tr => tr.de === meName);

  let linhasHTML = '';
  aReceber.forEach(tr => {
    linhasHTML += `
      <div class="meu-saldo-linha">
        <span>${escapeHTML(t('myBalanceReceiveFrom'))} <strong>${escapeHTML(tr.de)}</strong></span>
        <strong class="positivo">+${escapeHTML(formatMoney(tr.valor, moedaBase()))}</strong>
      </div>
    `;
  });
  aPagar.forEach(tr => {
    linhasHTML += `
      <div class="meu-saldo-linha">
        <span>${escapeHTML(t('myBalancePayTo'))} <strong>${escapeHTML(tr.para)}</strong>
          <button type="button" class="btn-quitar-rapido" data-quitar-de="${escapeHTML(tr.de)}" data-quitar-para="${escapeHTML(tr.para)}" data-quitar-valor="${tr.valor.toFixed(2)}">${escapeHTML(t('quickSettleBtn'))}</button>
        </span>
        <strong class="negativo">-${escapeHTML(formatMoney(tr.valor, moedaBase()))}</strong>
      </div>
    `;
  });

  box.innerHTML = `
    ${linhasHTML ? `<div class="meu-saldo-detalhes">${linhasHTML}</div>` : ''}
  `;

  box.classList.toggle('hidden', !linhasHTML);
  box.querySelectorAll('.btn-quitar-rapido').forEach(btn => {
    btn.addEventListener('click', () => {
      abrirModalQuitar(btn.dataset.quitarDe, btn.dataset.quitarPara, btn.dataset.quitarValor);
    });
  });
}

function renderSaldosEAcertos() {
  const grupo = getGrupoAtivo();
  const lista = document.getElementById('lista-acertos');
  if (!lista) return;

  lista.innerHTML = '';

  if (grupo.pessoas.length === 0) {
    document.getElementById('meu-saldo-box')?.classList.add('hidden');
    document.getElementById('saldo-grupo-cabecalho')?.classList.add('hidden');
    lista.innerHTML = `<li class="empty-state-text" style="background:none;border:none;padding:4px 0;">${escapeHTML(t('registerParticipantsSaldos'))}</li>`;
    return;
  }

  const { stats, transferencias } = calcularBalancoGrupo(grupo);

  renderMeuSaldoDestaque(grupo, stats, transferencias);

  if (transferencias.length === 0) {
    lista.innerHTML = `<li class="empty-state-text" style="background:none;border:none;padding:4px 0;">${escapeHTML(t('allSettledShort'))}</li>`;
    return;
  }

  transferencias.forEach(tr => {
    const li = document.createElement('li');
    const texto = document.createElement('span');
    texto.innerHTML = `<strong>${escapeHTML(tr.de)}</strong> ${escapeHTML(t('owesText'))} <strong>${escapeHTML(formatMoney(tr.valor, moedaBase()))}</strong> ${escapeHTML(t('toText'))} <strong>${escapeHTML(tr.para)}</strong>`;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-quitar-rapido';
    btn.textContent = t('quickSettleBtn');
    btn.addEventListener('click', () => abrirModalQuitar(tr.de, tr.para, tr.valor.toFixed(2)));

    li.appendChild(texto);
    li.appendChild(btn);
    lista.appendChild(li);
  });
}

// ===== 16. HISTÓRICO, FILTROS E TOTAIS =====
function renderFiltroCategorias() {
  const select = document.getElementById('filtro-categoria');
  if (!select) return;
  const valorAnterior = select.value || filtroCategoriaAtual;

  select.innerHTML = '';
  const optTodas = document.createElement('option');
  optTodas.value = 'todas';
  optTodas.textContent = t('filterAllCategories');
  select.appendChild(optTodas);

  CATEGORIAS.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.textContent = getNomeCategoriaTraduzido(cat.id);
    select.appendChild(opt);
  });

  if (Array.from(select.options).some(o => o.value === valorAnterior)) {
    select.value = valorAnterior;
    filtroCategoriaAtual = valorAnterior;
  } else {
    select.value = 'todas';
    filtroCategoriaAtual = 'todas';
  }
}

function getLancamentosFiltrados(grupo) {
  const lista = grupo.gastos || [];
  if (filtroCategoriaAtual === 'todas') return lista;
  if (filtroCategoriaAtual === 'pagamentos') return lista.filter(g => g.tipo === 'pagamento');
  if (filtroCategoriaAtual === 'Sem categoria') {
    return lista.filter(g => g.tipo !== 'pagamento' && (!g.categoria || g.categoria === 'Sem categoria'));
  }
  return lista.filter(g => g.tipo !== 'pagamento' && g.categoria === filtroCategoriaAtual);
}

function renderHistorico() {
  const grupo = getGrupoAtivo();
  const ul = document.getElementById('lista-gastos');
  const badgeTotal = document.getElementById('total-grupo-badge');

  const despesas = (grupo.gastos || []).filter(g => g.tipo !== 'pagamento');
  const totalDespesasBRL = despesas.reduce((acc, g) => acc + getValorEmBRL(g), 0);

  if (badgeTotal) {
    badgeTotal.textContent = formatMoney(totalDespesasBRL, moedaBase());
  }

  if (!ul) return;
  ul.innerHTML = '';

  const filtradosOrdenados = ordenarLancamentosPorData(getLancamentosFiltrados(grupo));
  if (filtradosOrdenados.length === 0) {
    ul.innerHTML = `<li class="empty-state-text">${escapeHTML(t('noEntriesFilter'))}</li>`;
    return;
  }

  filtradosOrdenados.forEach(g => {
    const li = document.createElement('li');
    const valBRL = getValorEmBRL(g);
    const moeda = g.moeda || moedaBase();
    const valorDisplay = moeda === moedaBase()
      ? formatMoney(valBRL, moedaBase())
      : `${formatMoney(g.valor, moeda)} (${formatMoney(valBRL, moedaBase())})`;

    if (g.tipo === 'pagamento') {
      const { de: pagadorNome, para: recebedorNome } = extrairPartesPagamento(g);

      li.className = 'gasto-item item-pagamento';
      const obsText = g.obs ? ` • ${g.obs}` : '';
      const dataText = g.data ? `${formatDateBR(g.data)} • ` : '';
      li.innerHTML = `
        <div class="gasto-info">
          <strong><span class="badge-pagamento">${escapeHTML(t('settlementBadge'))}</span>${escapeHTML(pagadorNome || '?')} ${escapeHTML(t('paidToText'))} ${escapeHTML(recebedorNome || '?')}</strong>
          <small>${escapeHTML(dataText + (g.descricao || t('settlementDefaultDesc')) + obsText)}</small>
        </div>
        <div class="gasto-right">
          <span class="gasto-valor pagamento-val">${escapeHTML(valorDisplay)}</span>
          <button type="button" class="btn-icon-action btn-edit-gasto" title="${escapeHTML(t('editPaymentTitle'))}">✎</button>
          <button type="button" class="btn-icon-action btn-del-gasto" title="Apagar">🗑</button>
        </div>
      `;
      li.querySelector('.btn-edit-gasto')?.addEventListener('click', () => abrirModalQuitar('', '', '', g));
      li.querySelector('.btn-del-gasto')?.addEventListener('click', () => apagarLancamento(g.id));
    } else {
      li.className = 'gasto-item';
      const catObj = getCategoriaObj(g.categoria);
      const catNome = getNomeCategoriaTraduzido(g.categoria);
      const catBadge = catObj
        ? `<span class="cat-badge-inline">${catObj.icon}${escapeHTML(catNome)}</span>`
        : '';

      const modoBadge = g.modoDivisao === 'exato'
        ? `<span class="badge-modo">${escapeHTML(t('modeExactBadge'))}</span>`
        : (g.modoDivisao === 'cotas' ? `<span class="badge-modo">${escapeHTML(t('modeSharesBadge'))}</span>` : '');

      const partLista = g.participantes || Object.keys(g.divisao || {});
      const dataPrefix = g.data ? `${formatDateBR(g.data)} • ` : '';

      li.innerHTML = `
        <div class="gasto-info">
          <strong>${catBadge}${escapeHTML(g.descricao)}${modoBadge}</strong>
          <small>${escapeHTML(dataPrefix + t('paidByText'))} <strong>${escapeHTML(g.pagadorNaoIdentificado ? t('unknownPayer') : g.pagador)}</strong> • ${g.pagadorNaoIdentificado ? escapeHTML(t('noSplit')) : escapeHTML(t('splitWithText') + ' ' + partLista.join(', '))}</small>
        </div>
        <div class="gasto-right">
          <span class="gasto-valor">${escapeHTML(valorDisplay)}</span>
          <button type="button" class="btn-icon-action btn-edit-gasto" title="Editar">✎</button>
          <button type="button" class="btn-icon-action btn-del-gasto" title="Apagar">🗑</button>
        </div>
      `;

      li.querySelector('.btn-edit-gasto')?.addEventListener('click', () => iniciarEdicaoGasto(g.id));
      li.querySelector('.btn-del-gasto')?.addEventListener('click', () => apagarLancamento(g.id));
    }

    ul.appendChild(li);
  });
}

function formatarMesAnoCurto(mesIso) {
  if (!mesIso || mesIso === 'sem-data' || mesIso === (t('noDateLabel') || 'Sem data')) {
    return t('noDateLabel') || 'Sem data';
  }

  const partes = String(mesIso).trim().split('-');
  if (partes.length < 2) return String(mesIso);

  const ano = Number(partes[0]);
  const mesIdx = Number(partes[1]) - 1;
  if (!Number.isFinite(ano) || mesIdx < 0 || mesIdx > 11) {
    return String(mesIso);
  }

  const locale = currentLang === 'en' ? 'en-US' : (currentLang === 'es' ? 'es-ES' : 'pt-BR');
  const nomeMes = new Date(Date.UTC(ano, mesIdx, 1)).toLocaleDateString(locale, {
    month: 'long',
    timeZone: 'UTC'
  });

  const mesCapitalizado = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);
  const anoDoisDigitos = String(ano).slice(-2);
  return `${mesCapitalizado}/${anoDoisDigitos}`;
}

function renderPainelTotais() {
  const painel = document.getElementById('painel-totais');
  const conteudo = document.getElementById('totais-conteudo');
  const filtroInfo = document.getElementById('totais-filtro-info');
  if (!painel || !conteudo) return;

  painel.classList.toggle('hidden', !totaisAberto);
  if (!totaisAberto) return;

  const grupo = getGrupoAtivo();
  const despesasGrupo = (grupo.gastos || []).filter(g => g.tipo !== 'pagamento');
  const despesasFiltradas = getLancamentosFiltrados(grupo).filter(g => g.tipo !== 'pagamento');

  if (filtroInfo) {
    const labelFiltro = filtroCategoriaAtual === 'todas'
      ? t('allExpensesLabel')
      : (filtroCategoriaAtual === 'pagamentos'
        ? t('filterOnlySettlements')
        : getNomeCategoriaTraduzido(filtroCategoriaAtual));
    filtroInfo.textContent = `${t('filterPrefix')} ${labelFiltro}`;
  }

  if (despesasGrupo.length === 0) {
    conteudo.innerHTML = `<p class="empty-state-text">${escapeHTML(t('noExpensesToTotal'))}</p>`;
    return;
  }

  const totalGrupo = despesasGrupo.reduce((acc, g) => acc + getValorEmBRL(g), 0);
  const totalFiltro = despesasFiltradas.reduce((acc, g) => acc + getValorEmBRL(g), 0);

  const porCat = {};
  const porMes = {};

  despesasFiltradas.forEach(g => {
    const val = getValorEmBRL(g);
    const catKey = g.categoria || 'Sem categoria';
    porCat[catKey] = (porCat[catKey] || 0) + val;

    const dataIso = normalizarDataISOOrdenacao(g.data);
    const mesKey = dataIso && dataIso !== '0000-00-00' ? dataIso.slice(0, 7) : 'sem-data';
    porMes[mesKey] = (porMes[mesKey] || 0) + val;
  });

  const catHTML = Object.entries(porCat)
    .sort((a, b) => b[1] - a[1])
    .map(([catId, val]) => {
      const pct = totalFiltro > 0 ? Math.round((val / totalFiltro) * 100) : 0;
      const obj = getCategoriaObj(catId);
      return `
        <div class="total-row-item">
          <div class="total-row-top">
            <span class="total-row-label">${obj ? obj.icon : ''}<span>${escapeHTML(getNomeCategoriaTraduzido(catId))}</span></span>
            <strong>${escapeHTML(formatMoney(val, moedaBase()))} (${pct}%)</strong>
          </div>
          <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
        </div>
      `;
    }).join('');

  const mesHTML = Object.entries(porMes)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([mes, val]) => {
      const pct = totalFiltro > 0 ? Math.round((val / totalFiltro) * 100) : 0;
      const rotuloMes = formatarMesAnoCurto(mes);
      return `
        <div class="total-row-item">
          <div class="total-row-top">
            <span class="total-row-label"><span>${escapeHTML(rotuloMes)}</span></span>
            <strong>${escapeHTML(formatMoney(val, moedaBase()))} (${pct}%)</strong>
          </div>
          <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
        </div>
      `;
    }).join('');

  conteudo.innerHTML = `
    <div class="totais-resumo-cards" style="grid-template-columns: 1fr;">
      <div class="total-mini-card">
        <small>${escapeHTML(filtroCategoriaAtual === 'todas' ? t('groupTotalCard') : t('activeFilterTotalCard'))}</small>
        <strong>${escapeHTML(formatMoney(filtroCategoriaAtual === 'todas' ? totalGrupo : totalFiltro, moedaBase()))}</strong>
      </div>
    </div>
    <div class="totais-bloco">
      <h4>${escapeHTML(t('byCategoryHeading'))}</h4>
      <div class="totais-lista">${catHTML || `<span class="empty-state-text">${escapeHTML(t('noEntriesFilter'))}</span>`}</div>
    </div>
    <div class="totais-bloco">
      <h4>${escapeHTML(t('byMonthHeading'))}</h4>
      <div class="totais-lista">${mesHTML || `<span class="empty-state-text">${escapeHTML(t('noEntriesFilter'))}</span>`}</div>
    </div>
  `;
}

// ===== 17. PAGAMENTOS E QUITAÇÕES =====
function sincronizarMoedasQuitar() {
  const origem = document.getElementById('moeda-gasto');
  const destino = document.getElementById('quitar-moeda');
  if (!origem || !destino) return;

  const valorAtual = destino.value;
  preencherMoedas(destino);

  if (valorAtual && Array.from(destino.options).some(o => o.value === valorAtual)) {
    destino.value = valorAtual;
  } else {
    destino.value = moedaBase();
  }
}

function getTaxaQuitar() {
  const moeda = document.getElementById('quitar-moeda')?.value || moedaBase();
  if (moeda === moedaBase()) {
    const grupo = getGrupoAtivo();
    const anterior = grupo.gastos.find(g=>g.id===edicaoPagamento?.id && g.moeda===moeda);
    return anterior ? taxaExibida(anterior, grupo) : 1;
  }

  const taxaDigitada = parseFloat(document.getElementById('quitar-taxa-cambio')?.value);
  if (!isNaN(taxaDigitada) && taxaDigitada > 0) return taxaDigitada;

  const grupo = getGrupoAtivo();
  const taxaSalva = grupo?.taxasCambio?.[moeda];
  if (typeof taxaSalva === 'number' && taxaSalva > 0) return taxaSalva;

  return 0;
}

function atualizarUIQuitarMoeda() {
  const moeda = document.getElementById('quitar-moeda')?.value || moedaBase();
  const boxCambio = document.getElementById('quitar-box-cambio');
  const moedaLabel = document.getElementById('quitar-cambio-moeda');
  const taxaInput = document.getElementById('quitar-taxa-cambio');
  const valorInput = document.getElementById('quitar-valor');
  const convertidoEl = document.getElementById('quitar-valor-convertido-brl');

  if (moeda === moedaBase()) {
    boxCambio?.classList.add('hidden');
    return;
  }

  boxCambio?.classList.remove('hidden');
  if (moedaLabel) moedaLabel.textContent = moeda;
  document.getElementById('quitar-base-code').textContent = moedaBase();

  const grupo = getGrupoAtivo();
  if (taxaInput && (!taxaInput.value || parseFloat(taxaInput.value) <= 0)) {
    const salva = grupo?.taxasCambio?.[moeda];
    if (typeof salva === 'number' && salva > 0) {
      taxaInput.value = salva;
    }
  }

  const valor = parseFloat(valorInput?.value) || 0;
  const taxa = getTaxaQuitar();
  if (convertidoEl) {
    convertidoEl.textContent = formatMoney(valor * taxa, moedaBase());
  }
}

async function buscarCotacaoQuitar() {
  const moeda = document.getElementById('quitar-moeda')?.value || moedaBase();
  if (moeda === moedaBase()) return;

  const statusEl = document.getElementById('quitar-cambio-status');
  const taxaInput = document.getElementById('quitar-taxa-cambio');
  if (statusEl) statusEl.textContent = t('fetchingRateMsg');

  const grupo = getGrupoAtivo(), base = moedaBase(grupo);
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(moeda)}`);
    if (!res.ok) throw new Error('Falha na API de câmbio');
    const data = await res.json();
    const rate = data?.rates?.[base];
    if (typeof rate !== 'number' || rate <= 0) throw new Error('Cotação inválida');

    if (getGrupoAtivo().id !== grupo.id || moedaBase() !== base || document.getElementById("quitar-moeda").value !== moeda) return;
    const rounded = rate;
    if (taxaInput) taxaInput.value = rounded;

    grupo.taxasCambio = grupo.taxasCambio || {};
    grupo.taxasCambio[moeda] = rounded;
    atualizarUIQuitarMoeda();
    if (statusEl) statusEl.textContent = t('rateFetchedMsg', { curr: moeda, base: moedaBase() });
  } catch {
    if (statusEl) statusEl.textContent = t('rateErrorMsg');
  }
}

let edicaoPagamento = null;

function atualizarTituloQuitar() {
  const titulo = document.getElementById('quitar-titulo');
  const botao = document.getElementById('btn-confirmar-quitar');
  titulo.textContent = t(edicaoPagamento ? 'editPaymentTitle' : 'settleModalTitle');
  botao.textContent = t(edicaoPagamento ? 'savePaymentChanges' : 'confirmPaymentBtn');
}

function abrirModalQuitar(dePadrao = '', paraPadrao = '', valorPadrao = '', pagamento = null) {
  const grupo = getGrupoAtivo();
  if (!grupo.pessoas || grupo.pessoas.length < 2) {
    alert(t('need2PeopleAlert'));
    return;
  }

  edicaoPagamento = pagamento ? { grupoId: grupo.id, id: pagamento.id } : null;
  if (pagamento) {
    const partes = extrairPartesPagamento(pagamento);
    dePadrao = partes.de;
    paraPadrao = partes.para;
    valorPadrao = pagamento.valor;
  }
  atualizarTituloQuitar();
  sincronizarMoedasQuitar();

  const selDe = document.getElementById('quitar-de');
  const selPara = document.getElementById('quitar-para');
  const selMoeda = document.getElementById('quitar-moeda');
  const inpTaxa = document.getElementById('quitar-taxa-cambio');
  const statusEl = document.getElementById('quitar-cambio-status');
  const inpVal = document.getElementById('quitar-valor');
  const inpObs = document.getElementById('quitar-obs');

  if (!selDe || !selPara) return;
  selDe.innerHTML = '';
  selPara.innerHTML = '';

  grupo.pessoas.forEach(p => {
    const o1 = document.createElement('option');
    o1.value = p;
    o1.textContent = p;
    selDe.appendChild(o1);

    const o2 = document.createElement('option');
    o2.value = p;
    o2.textContent = p;
    selPara.appendChild(o2);
  });

  if (dePadrao && grupo.pessoas.includes(dePadrao)) selDe.value = dePadrao;
  if (paraPadrao && grupo.pessoas.includes(paraPadrao)) selPara.value = paraPadrao;
  if (selDe.value === selPara.value) {
    selPara.selectedIndex = selDe.selectedIndex === 0 ? 1 : 0;
  }

  if (selMoeda) {
    const moeda = pagamento?.moeda || moedaBase();
    if (!Array.from(selMoeda.options).some(o => o.value === moeda)) selMoeda.add(new Option(moeda, moeda));
    selMoeda.value = moeda;
  }
  if (inpTaxa) inpTaxa.value = pagamento ? taxaExibida(pagamento, grupo) : '';
  if (statusEl) statusEl.textContent = '';
  if (inpVal) inpVal.value = valorPadrao || '';
  if (inpObs) inpObs.value = pagamento?.obs || '';
  document.getElementById('quitar-data').value = pagamento ? normalizarDataISOOrdenacao(pagamento.data).replace('0000-00-00', '') : getTodayISO();
  atualizarDataQuitacao();
  atualizarUIQuitarMoeda();

  document.getElementById('modal-quitar')?.classList.remove('hidden');
}

function fecharModalQuitar() {
  edicaoPagamento = null;
  document.getElementById('modal-quitar')?.classList.add('hidden');
}

// ===== 18. RELATÓRIO E BALANÇO GLOBAL =====
let ultimoTextoWhatsApp = '';

function abrirRelatorio() {
  const grupo = getGrupoAtivo();
  const { stats, transferencias } = calcularBalancoGrupo(grupo);
  const despesas = ordenarLancamentosPorData((grupo.gastos || []).filter(g => g.tipo !== 'pagamento'));
  const pagamentos = ordenarLancamentosPorData((grupo.gastos || []).filter(g => g.tipo === 'pagamento'));
  const totalDespesas = despesas.reduce((acc, g) => acc + getValorEmBRL(g), 0);

  document.getElementById('relatorio-titulo').textContent = `${t('reportTitlePrefix')} • ${grupo.nome}`;

  const pendenciasHTML = transferencias.length === 0
    ? `<p>${escapeHTML(t('reportAllSettled'))}</p>`
    : `<ul>${transferencias.map(tr => `<li><strong>${escapeHTML(tr.de)}</strong> ${escapeHTML(t('reportStillOwes'))} <strong>${escapeHTML(formatMoney(tr.valor, moedaBase()))}</strong> ${escapeHTML(t('toText'))} <strong>${escapeHTML(tr.para)}</strong></li>`).join('')}</ul>`;

  const balancoRows = grupo.pessoas.map(p => {
    const s = stats[p] || { pagou: 0, consumiu: 0, acertosLiquidos: 0, saldo: 0 };
    const cls = s.saldo > 0.01 ? 'positivo' : (s.saldo < -0.01 ? 'negativo' : 'neutro');
    return `
      <tr>
        <td>${escapeHTML(p)}</td>
        <td>${escapeHTML(formatMoney(s.pagou, moedaBase()))}</td>
        <td>${escapeHTML(formatMoney(s.consumiu, moedaBase()))}</td>
        <td>${escapeHTML(formatMoney(s.acertosLiquidos, moedaBase()))}</td>
        <td class="${cls}"><strong>${escapeHTML(formatMoney(s.saldo, moedaBase()))}</strong></td>
      </tr>
    `;
  }).join('');

  const porCat = {};
  despesas.forEach(g => {
    const k = g.categoria || 'Sem categoria';
    porCat[k] = (porCat[k] || 0) + getValorEmBRL(g);
  });
  const catRows = Object.entries(porCat).sort((a, b) => b[1] - a[1]).map(([c, v]) => {
    const pct = totalDespesas > 0 ? ((v / totalDespesas) * 100).toFixed(1) : '0.0';
    return `<tr><td>${escapeHTML(getNomeCategoriaTraduzido(c))}</td><td>${escapeHTML(formatMoney(v, moedaBase()))}</td><td>${pct}%</td></tr>`;
  }).join('');

  const expRows = despesas.length === 0
    ? `<tr><td colspan="4">${escapeHTML(t('noExpensesRecorded'))}</td></tr>`
    : despesas.map(g => `
      <tr>
        <td>${escapeHTML(g.data ? formatDateBR(g.data) : '-')}</td>
        <td>${escapeHTML(g.descricao)}</td>
        <td>${escapeHTML(g.pagadorNaoIdentificado ? t('unknownPayer') : g.pagador)}</td>
        <td>${escapeHTML(formatMoney(getValorEmBRL(g), moedaBase()))}</td>
      </tr>
    `).join('');

  const payRows = pagamentos.map(p => `
    <tr>
      <td>${escapeHTML(p.data ? formatDateBR(p.data) : '-')}</td>
      <td>${escapeHTML(p.de)} → ${escapeHTML(p.para)}${p.obs ? ` (${escapeHTML(p.obs)})` : ''}</td>
      <td>${escapeHTML(formatMoney(getValorEmBRL(p), moedaBase()))}</td>
    </tr>
  `).join('');

  document.getElementById('relatorio-conteudo').innerHTML = `
    <div class="rel-section">
      <p><strong>${escapeHTML(t('reportGroupLabel'))}</strong> ${escapeHTML(grupo.nome)}</p>
      <p><strong>${escapeHTML(t('reportDateLabel'))}</strong> ${escapeHTML(formatDateBR(getTodayISO()))}</p>
      <p><strong>${escapeHTML(t('reportTotalExpensesLabel'))}</strong> ${escapeHTML(formatMoney(totalDespesas, moedaBase()))}</p>
    </div>
    <div class="rel-section">
      <h3>${escapeHTML(t('reportSec1Title'))}</h3>
      ${pendenciasHTML}
    </div>
    <div class="rel-section">
      <h3>${escapeHTML(t('reportSec2Title'))}</h3>
      <table class="rel-table">
        <thead><tr><th>${escapeHTML(t('thParticipant'))}</th><th>${escapeHTML(t('thPaid'))}</th><th>${escapeHTML(t('thConsumed'))}</th><th>${escapeHTML(t('thSettlements'))}</th><th>${escapeHTML(t('thFinalBalance'))}</th></tr></thead>
        <tbody>${balancoRows}</tbody>
      </table>
    </div>
    <div class="rel-section">
      <h3>${escapeHTML(t('reportSec3CatTitle'))}</h3>
      <table class="rel-table">
        <thead><tr><th>${escapeHTML(t('thCategory'))}</th><th>${escapeHTML(t('thAmount'))}</th><th>${escapeHTML(t('thPctTotal'))}</th></tr></thead>
        <tbody>${catRows || '<tr><td colspan="3">-</td></tr>'}</tbody>
      </table>
    </div>
    <div class="rel-section">
      <h3>${escapeHTML(t('reportExpensesExtract'))}</h3>
      <table class="rel-table">
        <thead><tr><th>${escapeHTML(t('thDate'))}</th><th>${escapeHTML(t('thDescription'))}</th><th>${escapeHTML(t('thPayer'))}</th><th>${escapeHTML(t('thAmount'))}</th></tr></thead>
        <tbody>${expRows}</tbody>
      </table>
    </div>
    ${pagamentos.length > 0 ? `
      <div class="rel-section">
        <h3>${escapeHTML(t('reportPaymentsExtract'))}</h3>
        <table class="rel-table">
          <thead><tr><th>${escapeHTML(t('thDate'))}</th><th>${escapeHTML(t('thMovement'))}</th><th>${escapeHTML(t('thAmount'))}</th></tr></thead>
          <tbody>${payRows}</tbody>
        </table>
      </div>
    ` : ''}
  `;

  const linhasWpp = [
    t('wppReportHeader', { name: grupo.nome }),
    t('wppTotalExpenses', { val: formatMoney(totalDespesas, moedaBase()) }),
    '',
    t('wppPendingHeader')
  ];
  if (transferencias.length === 0) {
    linhasWpp.push(t('wppAllSettled'));
  } else {
    transferencias.forEach(tr => {
      linhasWpp.push(t('wppPaysLine', { from: tr.de, val: formatMoney(tr.valor, moedaBase()), to: tr.para }));
    });
  }
  ultimoTextoWhatsApp = linhasWpp.join('\n');

  document.getElementById('modal-relatorio')?.classList.remove('hidden');
}

function calcularBalancoGlobal() {
  const grupos = Object.values(state.grupos || {}).filter(g=>!g.deleted);
  const partes = [...new Set(grupos.map(g=>moedaBase(g)))].map(m=>calcularBalancoGlobalMoeda(grupos.filter(g=>moedaBase(g)===m),m));
  return {totalGrupos:grupos.length, consolidadoPorPessoa:partes.flatMap(p=>p.consolidadoPorPessoa), transferenciasGlobais:partes.flatMap(p=>p.transferenciasGlobais)};
}
function calcularBalancoGlobalMoeda(gruposLista, moeda) {
  const consolidadoPorPessoa = {};

  gruposLista.forEach(g => {
    const { stats } = calcularBalancoGrupo(g);
    const meuNome = getMeParticipantName(g);
    Object.values(stats).forEach(s => {
      // Identifica o próprio usuário pela mesma rotina do saldo individual.
      const uid = currentUser?.uid && s.nome === meuNome
        ? currentUser.uid
        : Object.keys(g.vinculos || {}).find(u=>g.vinculos[u]===s.nome);
      const chave = uid ? `uid:${uid}` : `grupo:${g.id}:${s.nome}`;
      if (!consolidadoPorPessoa[chave]) {
        consolidadoPorPessoa[chave] = { nome: uid && uid === currentUser?.uid ? (getNomeUsuarioEfetivo() || s.nome) : s.nome, moeda, saldoTotal: 0, porGrupo: [] };
      }
      consolidadoPorPessoa[chave].saldoTotal = Math.round((consolidadoPorPessoa[chave].saldoTotal + s.saldo) * 100) / 100;
      if (Math.abs(s.saldo) > 0.01) {
        consolidadoPorPessoa[chave].porGrupo.push({ grupoNome: g.nome, saldo: s.saldo });
      }
    });
  });

  const credores = [];
  const devedores = [];
  Object.values(consolidadoPorPessoa).forEach(item => {
    if (item.saldoTotal > 0.01) credores.push({ pessoa: item.nome, valor: item.saldoTotal });
    else if (item.saldoTotal < -0.01) devedores.push({ pessoa: item.nome, valor: Math.abs(item.saldoTotal) });
  });
  credores.sort((a, b) => b.valor - a.valor);
  devedores.sort((a, b) => b.valor - a.valor);

  const transferenciasGlobais = [];
  let i = 0;
  let j = 0;
  while (i < devedores.length && j < credores.length) {
    const quantia = Math.min(devedores[i].valor, credores[j].valor);
    const arred = Math.round(quantia * 100) / 100;
    if (arred > 0.01) {
      transferenciasGlobais.push({ de: devedores[i].pessoa, para: credores[j].pessoa, valor: arred, moeda });
    }
    devedores[i].valor = Math.round((devedores[i].valor - quantia) * 100) / 100;
    credores[j].valor = Math.round((credores[j].valor - quantia) * 100) / 100;
    if (devedores[i].valor <= 0.01) i++;
    if (credores[j].valor <= 0.01) j++;
  }

  return {
    totalGrupos: gruposLista.length,
    consolidadoPorPessoa: Object.values(consolidadoPorPessoa),
    transferenciasGlobais
  };
}

function abrirModalGlobal() {
  const { totalGrupos, consolidadoPorPessoa, transferenciasGlobais } = calcularBalancoGlobal();
  const corpo = document.getElementById('global-conteudo');
  if (!corpo) return;

  const transfHTML = transferenciasGlobais.length === 0
    ? `<p>${escapeHTML(t('globalAllSettled'))}</p>`
    : `<ul>${transferenciasGlobais.map(tr => `<li><strong>${escapeHTML(tr.de)}</strong> → <strong>${escapeHTML(tr.para)}</strong>: <strong>${escapeHTML(formatMoney(tr.valor, tr.moeda))}</strong></li>`).join('')}</ul>`;

  const rowsHTML = consolidadoPorPessoa
    .sort((a, b) => a.moeda.localeCompare(b.moeda) || b.saldoTotal - a.saldoTotal)
    .map(p => {
      const cls = p.saldoTotal > 0.01 ? 'positivo' : (p.saldoTotal < -0.01 ? 'negativo' : 'neutro');
      const origem = p.porGrupo.length > 0
        ? p.porGrupo.map(og => `${og.grupoNome} (${formatMoney(og.saldo, p.moeda)})`).join(', ')
        : t('zeroedInAll');
      return `
        <tr>
          <td><strong>${escapeHTML(p.nome)}</strong></td>
          <td><small>${escapeHTML(origem)}</small></td>
          <td class="${cls}"><strong>${escapeHTML(formatMoney(p.saldoTotal, p.moeda))}</strong></td>
        </tr>
      `;
    }).join('');

  corpo.innerHTML = `
    <div class="rel-section">
      <p>${t('globalSummaryIntro', { n: totalGrupos })}</p>
    </div>
    <div class="rel-section">
      <h3>${escapeHTML(t('globalSec1Title'))}</h3>
      ${transfHTML}
    </div>
    <div class="rel-section">
      <h3>${escapeHTML(t('globalSec2Title'))}</h3>
      <table class="rel-table">
        <thead><tr><th>${escapeHTML(t('thParticipant'))}</th><th>${escapeHTML(t('thGroupOrigin'))}</th><th>${escapeHTML(t('thGlobalBalance'))}</th></tr></thead>
        <tbody>${rowsHTML || '<tr><td colspan="3">-</td></tr>'}</tbody>
      </table>
    </div>
  `;

  const linhasWpp = [
    t('wppGlobalHeader'),
    `${t('wppGlobalGroups')} ${totalGrupos}`,
    '',
    t('wppGlobalFinalHeader')
  ];
  if (transferenciasGlobais.length === 0) {
    linhasWpp.push(t('wppGlobalAllSettled'));
  } else {
    transferenciasGlobais.forEach(tr => {
      linhasWpp.push(t('wppPaysLine', { from: tr.de, val: formatMoney(tr.valor, tr.moeda), to: tr.para }));
    });
  }
  ultimoTextoWhatsApp = linhasWpp.join('\n');

  document.getElementById('modal-global')?.classList.remove('hidden');
}

// ===== 19. BACKUP E IMPORTAÇÃO (PADRÃO + SPLITWISE) =====
// 19.1. Exportação de backups e lançamentos
function baixarArquivoV30(conteudo, tipo, nome) {
  const url = URL.createObjectURL(new Blob([conteudo], {type: tipo}));
  const a = document.createElement('a'); a.href = url; a.download = nome;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
function nomeArquivoV30(nome) { return String(nome || 'grupo').replace(/[^\p{L}\p{N}_-]+/gu, '-').slice(0,80); }
function montarBackupV30(grupos, ativo, escopo) {
  return {app:'SplitRAO', version:30, scope:escopo, exportedAt:new Date().toISOString(), userName:currentUserName,
    state:{grupoAtivoId:ativo, grupos}};
}
async function exportarBackupJSON(individual = false) {
  try {
    if (isSavingCloud) throw new Error(t('backupBusy'));
    const ativo = state.grupoAtivoId, usuario = currentUser;
    let grupos = {};
    if (usuario) {
      const perfil = await getDocFromServer(getUserProfileRef(usuario.uid));
      const ids = perfil.data()?.groupIds || [];
      if (individual && !ids.includes(ativo)) throw new Error(t('backupInvalid'));
      for (const id of individual ? [ativo] : [...new Set(ids)]) {
        const snap = await getDocFromServer(getGroupDocRef(id));
        if (!snap.exists() || !membrosReais(snap.data())[usuario.uid]) throw new Error(t('backupInvalid'));
        grupos[id] = normalizarEstruturaGrupo(id, snap.data());
      }
      if (currentUser?.uid !== usuario.uid) throw new Error(t('backupInvalid'));
    } else grupos = individual ? {[ativo]:getGrupoAtivo()} : state.grupos;
    if (!Object.keys(grupos).length) throw new Error(t('backupInvalid'));
    const payload = montarBackupV30(grupos, grupos[ativo] ? ativo : Object.keys(grupos)[0], individual?'group':'general');
    baixarArquivoV30(JSON.stringify(payload,null,2),'application/json',`splitrao-backup-${individual?nomeArquivoV30(grupos[ativo].nome):'geral'}-${getTodayISO()}.json`);
  } catch(e) { alert(t('importError',{detail:e.message})); }
}
// Uma linha por participante; totais aparecem somente na primeira linha do lançamento.
function montarCSVV30(grupo) {
  const chaves = ['csvDate','csvType','csvDescription','csvCategory','csvPayer','csvParticipant','csvDebtor','csvCreditor','csvOriginal','csvOriginalCurrency','csvRate','csvBaseCurrency','csvConverted','csvShare','csvDebt','csvSettlement','csvNotes','csvId'];
  const sep = currentLang === 'en' ? ',' : ';';
  const num = v => Number.isFinite(v) ? String(v).replace('.',currentLang==='en'?'.':',') : '';
  // Protege textos contra fórmulas executadas por planilhas.
  const cel = v => { let x=String(v??''); if(typeof v==='string' && /^[\s]*[=+@-]/.test(x) && !/^-?\d+(?:[.,]\d+)?$/.test(x)) x="'"+x; return '"'+x.replace(/"/g,'""')+'"'; };
  const linhas = [chaves.map(k=>t(k))];
  for (const g of ordenarLancamentosPorData(grupo.gastos)) {
    const total = getValorEmBRL(g,grupo), base = moedaBase(grupo), moeda = g.moeda || moedaReferencia(grupo);
    const taxa = Number(g.taxaCambio || 1)*fatorMoeda(grupo);
    const comum = [g.data,g.tipo==='pagamento'?t('csvPayment'):t('csvExpense'),g.descricao||'',g.categoria||''];
    const fim = [g.obs||g.observacoes||'',g.id||''];
    if(g.tipo==='pagamento') {
      const {de,para}=extrairPartesPagamento(g);
      linhas.push([...comum,de,para,'','',num(g.valor),moeda,num(taxa),base,'','','',num(total),...fim]);
      continue;
    }
    const pagador=g.pagadorNaoIdentificado?'':g.pagador||'';
    const partes=Object.entries(g.divisao||{}); if(!partes.length) partes.push(['',null]);
    partes.forEach(([p,v],i)=>{
      const cota=v===null?null:Number(v)*fatorMoeda(grupo);
      const deve=pagador && p && p!==pagador && cota>0;
      linhas.push([...comum,pagador,p,deve?p:'',deve?pagador:'',i?'':num(g.valor),moeda,num(taxa),base,i?'':num(total),num(cota),pagador&&p?num(deve?cota:0):'','',...fim]);
    });
  }
  return '\uFEFF'+linhas.map(l=>l.map(cel).join(sep)).join('\r\n');
}
function exportarDespesasCSV() {
  const grupo=getGrupoAtivo(); if(!grupo)return;
  baixarArquivoV30(montarCSVV30(grupo),'text/csv;charset=utf-8',`splitrao-${nomeArquivoV30(grupo.nome)}-${getTodayISO()}.csv`);
}
// 19.2. Validação e confirmação antes de restaurar cópias.
function validarBackupV30(parsed) {
  if(parsed?.app !== 'SplitRAO' || !parsed.state?.grupos || typeof parsed.state.grupos !== 'object') throw new Error(t('backupInvalid'));
  const entradas=extrairGruposDeJSON(parsed);
  if(Array.isArray(parsed.state.grupos) && entradas.length!==parsed.state.grupos.length) throw new Error(t('backupInvalid'));
  if(!entradas.length || entradas.some(({gdata:g})=>!g || typeof g.nome!=='string' || !Array.isArray(g.pessoas) || !Array.isArray(g.gastos) || g.pessoas.some(p=>typeof p!=='string') || g.gastos.some(x=>!x || typeof x!=='object' || (x.valor===null || x.valor===undefined || x.valor==='' || !Number.isFinite(Number(x.valor))) || (x.divisao && Object.values(x.divisao).some(v=>!Number.isFinite(Number(v))))))) throw new Error(t('backupInvalid'));
  return entradas;
}
async function restaurarBackupV30(file) {
  if(!file || isSavingCloud)return;
  try {
    const entradas=validarBackupV30(JSON.parse((await file.text()).replace(/^\uFEFF/,'')));
    const ok=await modalSelecao(t('restoreBackup'),(corpo,fechar)=>{
      const p=document.createElement('p'); p.textContent=t('backupConfirm'); corpo.append(p);
      const ul=document.createElement('ul'); for(const {gdata} of entradas){const li=document.createElement('li');li.textContent=gdata.nome;ul.append(li);} corpo.append(ul);
      botaoV26(corpo,t('restoreBackup'),()=>fechar(true));
    });
    if(!ok)return;
    isSavingCloud=true; setSaveStatus('statusSaving');
    try { const id=await persistirGruposImportados(entradas,{novoCodigo:true,restauracao:true}); if(!id && id!==false)throw new Error(t('backupInvalid')); setSaveStatus('statusSyncedAt',{time:new Date().toLocaleTimeString()}); }
    finally {isSavingCloud=false;}
  } catch(e){setSaveStatus('statusSaveError');alert(t('importError',{detail:e.message}));}
}

function normalizarDataFlexivel(dataRaw) {
  if (!dataRaw) return getTodayISO();
  const s = String(dataRaw).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const isoMatch = s.match(/^(\d{4}-\d{2}-\d{2})[T\s]/);
  if (isoMatch) return isoMatch[1];
  const brMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (brMatch) {
    const d = brMatch[1].padStart(2, '0');
    const m = brMatch[2].padStart(2, '0');
    return `${brMatch[3]}-${m}-${d}`;
  }
  const dt = new Date(s);
  if (!Number.isNaN(dt.getTime())) {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return getTodayISO();
}



function parseLinhaCSV(linha, separador) {
  const cols = [];
  let atual = '';
  let entreAspas = false;

  for (let i = 0; i < linha.length; i++) {
    const ch = linha[i];
    if (ch === '"') {
      if (entreAspas && linha[i + 1] === '"') {
        atual += '"';
        i++;
      } else {
        entreAspas = !entreAspas;
      }
    } else if (ch === separador && !entreAspas) {
      cols.push(atual.trim());
      atual = '';
    } else {
      atual += ch;
    }
  }
  cols.push(atual.trim());
  return cols;
}

function converterSplitwiseCSVParaGrupo(csvText, nomeArquivo = 'Splitwise') {
  const linhas = String(csvText || '')
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  if (linhas.length < 2) return null;

  const sep = (linhas[0].match(/;/g)?.length || 0) > (linhas[0].match(/,/g)?.length || 0) ? ';' : ',';
  const cabecalho = parseLinhaCSV(linhas[0], sep).map(h => normalizarTexto(h));

  const idxData = cabecalho.findIndex(h => h.includes('date') || h.includes('data'));
  const idxDesc = cabecalho.findIndex(h => h.includes('description') || h.includes('descri'));
  const idxCat = cabecalho.findIndex(h => h.includes('category') || h.includes('categori'));
  const idxCost = cabecalho.findIndex(h => h.includes('cost') || h.includes('valor') || h.includes('amount'));
  const idxCurr = cabecalho.findIndex(h => h.includes('currency') || h.includes('moeda'));

  const pessoasSet = new Set();
  const colPessoas = [];

  cabecalho.forEach((colNome, idx) => {
    if (idx === idxData || idx === idxDesc || idx === idxCat || idx === idxCost || idx === idxCurr) return;
    if (!colNome || colNome.includes('total') || colNome.includes('balance') || colNome.includes('saldo')) return;
    const originalHeader = parseLinhaCSV(linhas[0], sep)[idx]?.trim();
    if (originalHeader) {
      pessoasSet.add(originalHeader);
      colPessoas.push({ idx, nome: originalHeader });
    }
  });

  const gastos = [];

  for (let i = 1; i < linhas.length; i++) {
    const cols = parseLinhaCSV(linhas[i], sep);
    const desc = (idxDesc >= 0 ? cols[idxDesc] : '') || '';
    const descNorm = normalizarTexto(desc);

    if (!desc || descNorm === 'total balance' || descNorm === 'saldo total') continue;

    const data = normalizarDataFlexivel(idxData >= 0 ? cols[idxData] : '');
    const moedaRaw = idxCurr >= 0 ? String(cols[idxCurr] || '').trim().toUpperCase() : 'BRL';
    if (!MOEDAS[moedaRaw]) throw new Error('Unsupported currency: '+moedaRaw);
    const moeda = moedaRaw;

    const deltas = {};
    let totalPositivo = 0;

    for (const cp of colPessoas) {
      const val = parseNumeroFlexivel(cols[cp.idx]);
      if (Math.abs(val) > 0.001) {
        deltas[cp.nome] = val;
        if (val > 0) totalPositivo += val;
      }
    }

    const custoInformado = Math.abs(parseNumeroFlexivel(idxCost >= 0 ? cols[idxCost] : 0));
    const valorTotal = custoInformado > 0 ? custoInformado : totalPositivo;
    if (!(valorTotal > 0)) continue;

    const isPayment =
      descNorm.includes('payment') ||
      descNorm.includes('settle') ||
      descNorm.includes('pagamento') ||
      descNorm.includes('acerto');

    const quemPagou = Object.entries(deltas).sort((a, b) => b[1] - a[1])[0]?.[0] || Array.from(pessoasSet)[0] || 'Participante';
    const quemRecebeu = Object.entries(deltas).sort((a, b) => a[1] - b[1])[0]?.[0] || '';

    if (Object.keys(deltas).length === 0) {
      gastos.push({id: gerarId('gst'), tipo:'despesa', descricao:desc, categoria:mapearCategoriaSplitwise(idxCat >= 0 ? cols[idxCat] : '') || detectarCategoriaAutomatica(desc) || 'Geral', data, valor:valorTotal, moeda, taxaCambio:1, valorBRL:valorTotal, pagador:null, pagadorNaoIdentificado:true, modoDivisao:'exato', divisao:{}, participantes:[]});
      continue;
    }
    if (isPayment && quemPagou && quemRecebeu && quemPagou !== quemRecebeu) {
      gastos.push({
        id: gerarId('pgt'),
        tipo: 'pagamento',
        de: quemPagou,
        para: quemRecebeu,
        valor: valorTotal,
        moeda,
        taxaCambio: 1,
        valorBRL: valorTotal,
        data,
        descricao: desc
      });
    } else {
      const divisao = {};
      const devedoresCol = Object.entries(deltas).filter(([, v]) => v < -0.001);
      if (devedoresCol.length > 0) {
        devedoresCol.forEach(([nomeP, v]) => {
          divisao[nomeP] = Math.abs(v);
        });
      } else {
        const listaP = Array.from(pessoasSet);
        const parcela = listaP.length > 0 ? valorTotal / listaP.length : valorTotal;
        listaP.forEach(p => { divisao[p] = parcela; });
      }

      const catRaw = idxCat >= 0 ? cols[idxCat] : '';
      const categoria = mapearCategoriaSplitwise(catRaw) || detectarCategoriaAutomatica(desc) || 'Geral';

      gastos.push({
        id: gerarId('gst'),
        tipo: 'despesa',
        descricao: desc,
        categoria,
        data,
        valor: valorTotal,
        moeda,
        taxaCambio: 1,
        valorBRL: valorTotal,
        pagador: quemPagou,
        modoDivisao: devedoresCol.length > 0 ? 'exato' : 'igual',
        divisao,
        participantes: Object.keys(divisao)
      });
    }
  }

  const moedasOriginais = [...new Set(gastos.map(g=>g.moeda))];
  if (moedasOriginais.length>1) throw new Error(t('mixedImport'));
  const nomeBase = nomeArquivo.replace(/\.csv$/i, '').trim() || 'Grupo Splitwise';
  return {
    id: gerarId('grp'),
    nome: nomeBase,
    moedaBase: moedasOriginais[0] || 'BRL',
    pessoas: Array.from(pessoasSet),
    gastos
  };
}

function converterSplitwiseJSONParaGrupos(parsed) {
  if (!parsed || typeof parsed !== 'object') return [];

  const listaDespesas = Array.isArray(parsed.expenses)
    ? parsed.expenses
    : (Array.isArray(parsed.items) ? parsed.items : null);

  if (listaDespesas) {
    const pessoasSet = new Set();
    const gastos = [];

    for (const exp of listaDespesas) {
      if (!exp || typeof exp !== 'object') continue;
      if (exp.deleted_at) continue;

      const desc = String(exp.description || exp.name || exp.title || 'Despesa Splitwise').trim();
      const data = normalizarDataFlexivel(exp.date || exp.created_at || exp.updated_at);
      const moedaRaw = String(exp.currency_code || exp.currency || 'BRL').trim().toUpperCase();
      if (!MOEDAS[moedaRaw]) throw new Error('Unsupported currency: '+moedaRaw);
    const moeda = moedaRaw;
      const valorTotal = Math.abs(parseNumeroFlexivel(exp.cost ?? exp.amount ?? exp.total ?? 0));

      const users = Array.isArray(exp.users) ? exp.users : (Array.isArray(exp.repayments) ? exp.repayments : []);
      let pagador = '';
      let recebedor = '';
      const divisao = {};

      for (const u of users) {
        const objUser = u?.user && typeof u.user === 'object' ? u.user : u;
        const nomeP = [objUser?.first_name, objUser?.last_name].filter(Boolean).join(' ').trim()
          || objUser?.name
          || u?.name
          || u?.from
          || '';
        if (!nomeP) continue;
        pessoasSet.add(nomeP);

        const paidShare = parseNumeroFlexivel(u?.paid_share ?? objUser?.paid_share ?? u?.paid ?? 0);
        const owedShare = parseNumeroFlexivel(u?.owed_share ?? objUser?.owed_share ?? u?.owed ?? 0);

        if (paidShare > 0.001) {
          pagador = nomeP;
        }
        if (owedShare > 0.001) {
          divisao[nomeP] = owedShare;
          if (!recebedor && nomeP !== pagador) recebedor = nomeP;
        }
      }

      if (!pagador) {
        pagador = exp.created_by?.first_name || exp.payer || Array.from(pessoasSet)[0] || 'Participante';
        if (pagador) pessoasSet.add(pagador);
      }

      const valorEfetivo = valorTotal > 0
        ? valorTotal
        : Object.values(divisao).reduce((a, b) => a + b, 0);

      if (!(valorEfetivo > 0)) continue;

      const isPayment = Boolean(exp.payment) || normalizarTexto(desc).includes('payment') || normalizarTexto(desc).includes('pagamento');

      if (isPayment && pagador && recebedor && pagador !== recebedor) {
        gastos.push({
          id: gerarId('pgt'),
          tipo: 'pagamento',
          de: pagador,
          para: recebedor,
          valor: valorEfetivo,
          moeda,
          taxaCambio: 1,
          valorBRL: valorEfetivo,
          data,
          descricao: desc
        });
      } else {
        const chavesDiv = Object.keys(divisao);
        if (chavesDiv.length === 0 && pessoasSet.size > 0) {
          const listaP = Array.from(pessoasSet);
          const parcela = valorEfetivo / listaP.length;
          listaP.forEach(p => { divisao[p] = parcela; });
        }

        const catNome = exp.category?.name || exp.category || '';
        const categoria = mapearCategoriaSplitwise(catNome) || detectarCategoriaAutomatica(desc) || 'Geral';

        gastos.push({
          id: gerarId('gst'),
          tipo: 'despesa',
          descricao: desc,
          categoria,
          data,
          valor: valorEfetivo,
          moeda,
          taxaCambio: 1,
          valorBRL: valorEfetivo,
          pagador,
          modoDivisao: 'exato',
          divisao,
          participantes: Object.keys(divisao)
        });
      }
    }

    const moedasOriginais = [...new Set(gastos.map(g=>g.moeda))];
    if (moedasOriginais.length>1) throw new Error(t('mixedImport'));
    const nomeGrupo = parsed.group?.name || parsed.group_name || 'Grupo Splitwise';
    return [{
      chaveOriginal: parsed.group?.id ? `sw_${parsed.group.id}` : gerarId('grp'),
      gdata: {
        id: gerarId('grp'),
        nome: nomeGrupo,
        moedaBase: moedasOriginais[0] || 'BRL',
        pessoas: Array.from(pessoasSet),
        gastos
      }
    }];
  }

  if (Array.isArray(parsed.groups)) {
    const saida = [];
    for (const grp of parsed.groups) {
      if (!grp || typeof grp !== 'object') continue;
      const nomeG = grp.name || grp.nome || 'Grupo Splitwise';
      const membros = Array.isArray(grp.members)
        ? grp.members.map(m => [m?.first_name, m?.last_name].filter(Boolean).join(' ').trim() || m?.name || String(m || '').trim()).filter(Boolean)
        : [];
      const convertido = converterSplitwiseJSONParaGrupos({
        expenses: grp.expenses || grp.gastos || [],
        group: { name: nomeG, id: grp.id }
      });
      if (convertido[0]) {
        const gObj = convertido[0].gdata;
        gObj.pessoas = Array.from(new Set([...membros, ...(gObj.pessoas || [])]));
        saida.push({ chaveOriginal: gObj.id, gdata: gObj });
      }
    }
    return saida;
  }

  return [];
}

function extrairGruposDeJSON(parsed) {
  if (!parsed || typeof parsed !== 'object') return [];

  const gruposFonte = parsed?.state?.grupos ?? parsed?.grupos;
  if (Array.isArray(gruposFonte)) {
    return gruposFonte
      .filter(item => item && typeof item === 'object')
      .map(item => ({ chaveOriginal: item.id || '', gdata: item }));
  }
  if (gruposFonte && typeof gruposFonte === 'object') {
    return Object.entries(gruposFonte).map(([chave, gdata]) => ({
      chaveOriginal: chave,
      gdata
    }));
  }

  if (Array.isArray(parsed)) {
    return parsed
      .filter(item => item && typeof item === 'object')
      .map(item => ({ chaveOriginal: item.id || '', gdata: item }));
  }

  const gruposSplitwise = converterSplitwiseJSONParaGrupos(parsed);
  if (gruposSplitwise.length > 0) {
    return gruposSplitwise;
  }

  if (parsed.grupo && typeof parsed.grupo === 'object') {
    return [{ chaveOriginal: parsed.grupo.id || '', gdata: parsed.grupo }];
  }

  if (typeof parsed.nome === 'string' || Array.isArray(parsed.pessoas) || Array.isArray(parsed.gastos)) {
    return [{ chaveOriginal: parsed.id || '', gdata: parsed }];
  }

  return [];
}

async function persistirGruposImportados(entradas, { novoCodigo = false, restauracao = false } = {}) {
  if (!Array.isArray(entradas) || entradas.length === 0) return null;

  let primeiroIdNovo = null;
  entradas = entradas.filter(e => e.gdata && typeof e.gdata === 'object');
  let escolhas = null;
  // Importações e backups criam cópias independentes, sem substituir grupos ativos.
  if (currentUser) {
    const grupos = entradas.map(({gdata}) => normalizarEstruturaGrupo(gdata.id || '', gdata));
    escolhas = await selecionarParticipantesImportacao(grupos, restauracao);
    if (!escolhas) return false;
  }

  for (const [indice, { chaveOriginal, gdata }] of entradas.entries()) {
    if (!gdata || typeof gdata !== 'object') continue;

    const idCandidato = (typeof gdata.id === 'string' && gdata.id.trim())
      ? gdata.id.trim()
      : (typeof chaveOriginal === 'string' && chaveOriginal.trim() ? chaveOriginal.trim() : gerarId('grp'));

    let gid = state.grupos[idCandidato] ? gerarId('grp') : idCandidato;
    let norm = normalizarEstruturaGrupo(gid, { ...gdata, id: gid });
    if (currentUser) {
      const escolha = escolhas?.[indice];
      if (escolha) {
        converterBaseImportada(norm, escolha.moeda, escolha.taxa);
        if (escolha.escolha) renomearNomeEmGrupo(norm, escolha.escolha, escolha.nome);
        else norm.pessoas.push(escolha.nome);
        norm.meuParticipante = escolha.nome;
        norm.participantesSemApp = norm.pessoas.filter(p => p !== escolha.nome);
      }
      norm = await reservarNovoGrupo(norm, currentUser?.uid, escolha?.nome);
      gid = norm.id;
    }
    state.grupos[gid] = norm;
    cloudGroupsCache[gid] = norm;

    if (!primeiroIdNovo) primeiroIdNovo = gid;

    if (currentUser) {
      await vincularGrupoAoUsuario(currentUser.uid, gid, gid === primeiroIdNovo);
    } else {
      salvarEstadoLocal();
    }
  }

  if (primeiroIdNovo) {
    state.grupoAtivoId = primeiroIdNovo;
    filtroCategoriaAtual = 'todas';
    cancelarEdicao();
    salvarEstadoLocal();

    if (currentUser) {
      assinarGrupoAtivo(primeiroIdNovo);
      const agora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      setSaveStatus('statusSyncedAt', { time: agora });
    }

    abrirTelaDetalheGrupo(primeiroIdNovo);
  }

  return primeiroIdNovo;
}

async function importarBackupJSON(file) {
  if (!file) return;
  isSavingCloud = true;
  setSaveStatus('statusSaving');

  try {
    const text = await file.text();
    const isCSV = /\.csv$/i.test(file.name) || (
      !text.trim().startsWith('{') &&
      !text.trim().startsWith('[') &&
      text.includes(',')
    );

    let entradas = [];
    let novoCodigo = true;
    if (isCSV) {
      const grupoCSV = converterSplitwiseCSVParaGrupo(text, file.name);
      if (grupoCSV) {
        entradas = [{ chaveOriginal: grupoCSV.id, gdata: grupoCSV }];
      }
    } else {
      const parsed = JSON.parse(text);
      entradas = extrairGruposDeJSON(parsed);
      novoCodigo = !(parsed?.app === "SplitRAO" && parsed?.state?.grupos);
    }

    if (entradas.length === 0) {
      setSaveStatus('statusSaveError');
      alert('Não foi possível reconhecer nenhum grupo válido neste arquivo.');
      return;
    }

    const importadoId = await persistirGruposImportados(entradas, { novoCodigo });
    if (importadoId === false) {
      setSaveStatus('statusSyncedAt', { time: new Date().toLocaleTimeString() });
      return;
    }
    if (!importadoId) {
      setSaveStatus('statusSaveError');
      alert('Falha ao importar os grupos do arquivo.');
    }
  } catch (e) {
    console.error('Erro ao importar arquivo:', e);
    setSaveStatus('statusSaveError');
    alert(t('importError', { detail: e.message || t('importErrorDetail') }));
  } finally {
    setTimeout(() => {
      isSavingCloud = false;
    }, 400);
  }
}

async function processarImportacaoPendenteSplitwise() {
  const raw = localStorage.getItem(SPLITWISE_IMPORT_KEY);
  if (!raw) return;

  isSavingCloud = true;
  setSaveStatus('statusSaving');

  try {
    const parsed = JSON.parse(raw);
    const entradas = extrairGruposDeJSON(parsed);
    const resultado = await persistirGruposImportados(entradas, { novoCodigo: true });
    if (resultado || resultado === false) localStorage.removeItem(SPLITWISE_IMPORT_KEY);
    if (resultado === false) setSaveStatus('statusSyncedAt', { time: new Date().toLocaleTimeString() });
  } catch (e) {
    console.error('Erro ao importar grupo pendente do Splitwise:', e);
    setSaveStatus('statusSaveError');
  } finally {
    isSavingCloud = false;
  }
}

// ===== 20. RENDERIZAÇÃO GERAL =====
function renderResumoGlobalUsuario() {
  const banner = document.getElementById('global-user-banner');
  if (!banner) return;
  const saldos = {};
  for (const grupo of getGruposOrdenados()) {
    const nome = getMeParticipantName(grupo);
    if (!nome) continue;
    const moeda = moedaBase(grupo);
    saldos[moeda] = (saldos[moeda] || 0) + (calcularBalancoGrupo(grupo).stats[nome]?.saldo || 0);
  }
  const entradas = Object.entries(saldos).map(([m,v])=>[m,Math.round(v*100)/100]);
  const linhas = (positivos) => entradas.filter(([,v])=>positivos?v>0:v<0).map(([m,v])=>`<p class="resumo-texto ${positivos?'positivo':'negativo'}">${t(positivos?'myBalanceReceiveTotal':'myBalancePayTotal',{val:`<strong class="resumo-valor">${escapeHTML(formatMoney(Math.abs(v),m))}</strong>`})}</p>`).join('');
  const receber=linhas(true), pagar=linhas(false);
  banner.classList.remove('hidden','positivo','negativo','neutro','resumo-devo','resumo-receber','resumo-quitado');
  banner.classList.add(receber && !pagar?'resumo-receber':pagar && !receber?'resumo-devo':'resumo-quitado');
  banner.innerHTML = receber+pagar || `<p class="resumo-texto">${escapeHTML(t('myBalanceGlobalZero'))}</p>`;
}

function renderTudo() {
  const grupo = getGrupoAtivo();
  const adicionouUsuario = garantirUsuarioLogadoNoGrupo(grupo);
  if (adicionouUsuario) {
    salvarEstadoLocal();
  }

  renderSeletorGrupos();
  renderImagemGrupo(grupo);
  renderListaPessoas();
  renderPagadorSelect();
  renderSeletorCategorias();
  renderAreaDivisao();
  renderSaldosEAcertos();
  renderResumoGlobalUsuario();
  renderFiltroCategorias();
  renderHistorico();
  renderPainelTotais();
}

// ===== 21. EVENTOS DA INTERFACE =====
function initListeners() {
  preencherMoedas(document.getElementById('moeda-gasto'));
  preencherMoedas(document.getElementById('novo-grupo-moeda'));
  sincronizarMoedasQuitar();
  adicionarBuscaMoeda(document.getElementById('novo-grupo-moeda'));

  document.getElementById('btn-novo-gasto-grupo')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    abrirFormularioDeNovoGasto();
  });
  document.getElementById('btn-voltar-grupos')?.addEventListener('click', abrirTelaListaGrupos);

  // Menu de 3 tracinhos (Dentro do Grupo)
  document.getElementById('btn-menu-3dots')?.addEventListener('click', (e) => {
    e.stopPropagation();
    setMenu3DotsAberto(!menu3DotsAberto);
  });

  document.getElementById('dropdown-3dots')?.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Menu global (lista e detalhes dos grupos)
  document.getElementById('btn-logout-menu')?.addEventListener('click', () => {
    setMenu3DotsHomeAberto(false);
    document.getElementById('btn-logout')?.click();
  });
  document.getElementById('btn-menu-3dots-home')?.addEventListener('click', (e) => {
    e.stopPropagation();
    setMenu3DotsHomeAberto(!menuHome3DotsAberto);
  });

  document.getElementById('dropdown-3dots-home')?.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  document.getElementById('btn-fechar-form-gasto')?.addEventListener('click', () => {
    setFormGastoVisivel(false);
  });

  document.getElementById('btn-toggle-sem-app')?.addEventListener('click', () => {
    const formPessoa = document.getElementById('form-pessoa');
    const vaiAbrir = formPessoa?.classList.contains('hidden');
    formPessoa?.classList.toggle('hidden', !vaiAbrir);
    if (vaiAbrir) {
      document.getElementById('nome-pessoa')?.focus();
    }
  });

  document.addEventListener('click', () => {
    if (menu3DotsAberto) setMenu3DotsAberto(false);
    if (menuHome3DotsAberto) setMenu3DotsHomeAberto(false);
  });

  document.getElementById('btn-moeda-grupo')?.addEventListener('click', async()=>{
    const grupo=getGrupoAtivo(); setMenu3DotsAberto(false);
    const origem = moedaBase(grupo), referencia = moedaReferencia(grupo);
    const escolha = await modalSelecao(t('baseCurrency'), (corpo, fechar)=>{
      const sel=document.createElement('select'); preencherMoedas(sel); sel.value=origem;
      const aviso=document.createElement('p'); aviso.textContent=t('currencyWarning');
      const label=document.createElement('label'), taxa=document.createElement('input');
      taxa.type='number'; taxa.min='0'; taxa.step='any';
      const status=document.createElement('small');
      let pedido=0;
      const atualizar=async()=>{
        const token=++pedido, destino=sel.value;
        const conhecida=sel.value===referencia || grupo.fatoresMoeda?.[sel.value]>0;
        label.hidden=sel.value===origem || conhecida || (!grupo.gastos.length && !Object.keys(grupo.fatoresMoeda||{}).length);
        label.replaceChildren(document.createTextNode(`1 ${origem} = ${sel.value} `),taxa);
        taxa.value=''; status.textContent='';
        if(label.hidden)return;
        status.textContent=t('fetchingRateMsg');
        try {
          const rate=await consultarCotacao(origem,destino);
          if(token!==pedido || sel.value!==destino || !sel.isConnected)return;
          if(!taxa.value)taxa.value=formatarCotacaoSugerida(rate);
          status.textContent=t('rateFetchedMsg',{curr:origem,base:destino});
        } catch {if(token===pedido)status.textContent=t('rateErrorMsg');}
      };
      sel.onchange=atualizar; corpo.append(sel,aviso,label,status); adicionarBuscaMoeda(sel); atualizar();
      botaoV26(corpo,t('saveGroupName'),()=>{
        if(sel.value===origem){fechar(null);return;}
        const f=sel.value===referencia?1:grupo.fatoresMoeda?.[sel.value] || ((grupo.gastos.length || Object.keys(grupo.fatoresMoeda||{}).length)?Number(taxa.value)*fatorMoeda(grupo):1);
        if(!(f>0 && Number.isFinite(f))){alert(t('baseRateRequired'));return;}
        if(grupo.gastos.length && !confirm(t('currencyConfirm',{from:origem,to:sel.value})))return;
        fechar({moeda:sel.value,fator:f});
      });
    });
    if(!escolha)return;
    try {
      const atualizado=await runTransaction(db,async tx=>{
        const ref=getGroupDocRef(grupo.id), snap=await tx.get(ref), remoto=snap.data();
        if(!snap.exists() || !membrosReais(remoto)[currentUser.uid] || moedaBase(remoto)!==origem || fatorMoeda(remoto)!==fatorMoeda(grupo) || assinaturaMonetaria(normalizarEstruturaGrupo(grupo.id,remoto).gastos)!==assinaturaMonetaria(grupo.gastos||[]))throw new Error('Group changed');
        const vazio=!grupo.gastos.length && !Object.keys(grupo.fatoresMoeda||{}).length;
        const config={moedaBase:escolha.moeda,moedaReferencia:vazio?escolha.moeda:referencia,fatoresMoeda:vazio?{}:{...(remoto.fatoresMoeda||{}),[escolha.moeda]:escolha.fator},taxasCambio:{}};
        tx.update(ref,config); return config;
      });
      Object.assign(grupo,atualizado); Object.assign(state.grupos[grupo.id] || grupo,atualizado); cloudGroupsCache[grupo.id]=state.grupos[grupo.id] || grupo; salvarEstadoLocal(); cancelarEdicao(); fecharModalQuitar(); renderTudo();
    } catch(e){console.error(e);alert(t('currencyChangeError'));}
  });
  document.getElementById('btn-novo-grupo')?.addEventListener('click', criarNovoGrupo);
  document.getElementById('btn-renomear-grupo')?.addEventListener('click', renomearGrupoAtual);

  const btnImgGrupo = document.getElementById('btn-imagem-grupo');
  const inputImgGrupo = document.getElementById('input-imagem-grupo');

  btnImgGrupo?.addEventListener('click', () => {
    inputImgGrupo?.click();
  });

  inputImgGrupo?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const base64Img = await comprimirImagemArquivo(file, 260, 0.78);
      const grupoAtual = getGrupoAtivo();
      if (!grupoAtual) return;

      grupoAtual.image = base64Img;
      renderImagemGrupo(grupoAtual);
      renderSeletorGrupos();
      await salvarGrupoNaNuvem(grupoAtual);
    } catch (err) {
      console.error('Erro ao processar imagem do grupo:', err);
    }
  });

  document.getElementById('btn-toast-undo')?.addEventListener('click', () => {
    desfazerExclusaoLancamento();
  });
  document.getElementById('btn-importar-splitwise')?.addEventListener('click', () => {
    setMenu3DotsHomeAberto(false);
    window.location.href = 'conversor.html';
  });
  document.getElementById('btn-fab-novo-gasto')?.addEventListener('click', () => {
    if (typeof cancelarEdicao === 'function') cancelarEdicao();
    setFormGastoVisivel(true);
    if (typeof renderPagadorSelect === 'function') renderPagadorSelect(true);
    if (typeof renderAreaDivisao === 'function') renderAreaDivisao();
  });

  document.getElementById('modal-form-gasto')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-form-gasto') {
      setFormGastoVisivel(false);
    }
  });

  document.getElementById('btn-excluir-grupo')?.addEventListener('click', async () => {
    setMenu3DotsAberto(false);
    await excluirOuSairDoGrupo();
  });

  document.getElementById('btn-multi-invite')?.addEventListener('click', () => { setMenu3DotsHomeAberto(false); criarConviteMultiplo(); });
  document.getElementById('btn-compartilhar-grupo')?.addEventListener('click', compartilharConviteGrupo);

  const acionarEntrarCodigo = async () => {
    setMenu3DotsAberto(false);
    setMenu3DotsHomeAberto(false);
    await entrarPorCodigoOuLink();
  };
  document.getElementById('btn-entrar-codigo')?.addEventListener('click', acionarEntrarCodigo);
  document.getElementById('btn-entrar-codigo-home')?.addEventListener('click', acionarEntrarCodigo);

  document.getElementById('menu-copiar-codigo')?.addEventListener('click', async () => {
    const id = state.grupoAtivoId;
    try {
      await navigator.clipboard.writeText(id);
    } catch {}
    const labelEl = document.getElementById('menu-codigo-label');
    if (labelEl) {
      const prevHTML = labelEl.innerHTML;
      labelEl.textContent = t('codeCopiedBadge');
      setTimeout(() => {
        labelEl.innerHTML = prevHTML;
        const valEl = document.getElementById('menu-codigo-valor');
        if (valEl) valEl.textContent = state.grupoAtivoId;
      }, 1400);
    }
  });

  document.getElementById('btn-exportar-json')?.addEventListener('click', () => {
    setMenu3DotsHomeAberto(false);
    exportarBackupJSON();
  });

  document.getElementById('btn-backup-grupo')?.addEventListener('click',()=>{setMenu3DotsAberto(false);exportarBackupJSON(true);});
  document.getElementById('btn-exportar-csv')?.addEventListener('click',()=>{setMenu3DotsAberto(false);exportarDespesasCSV();});
  document.getElementById('btn-restaurar-backup')?.addEventListener('click',()=>{setMenu3DotsHomeAberto(false);document.getElementById('input-restaurar-backup').click();});
  document.getElementById('input-restaurar-backup')?.addEventListener('change',e=>{const f=e.target.files?.[0];e.target.value='';restaurarBackupV30(f);});

  document.getElementById('input-importar-json')?.addEventListener('change', (e) => {
    setMenu3DotsAberto(false);
    setMenu3DotsHomeAberto(false);
    if (e.target.files?.[0]) importarBackupJSON(e.target.files[0]);
    e.target.value = '';
  });

  document.getElementById('form-pessoa')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('nome-pessoa');
    if (!input?.value?.trim()) return;
    const ok = await adicionarParticipante(input.value.trim(), { marcarComoEu: false, semApp: true });
    if (ok) {
      input.value = '';
      document.getElementById('form-pessoa')?.classList.add('hidden');
    }
  });

  document.getElementById('btn-abrir-form-gasto')?.addEventListener('click', () => {
    setFormGastoVisivel(true);
    renderPagadorSelect(true);
    renderAreaDivisao();
  });
  document.getElementById('btn-cancelar-edicao')?.addEventListener('click', cancelarEdicao);

  document.getElementById('btn-quitar-data')?.addEventListener('click', () => { const inp = document.getElementById('quitar-data'); if (typeof inp.showPicker === 'function') inp.showPicker(); else inp.click(); });
  document.getElementById('quitar-data')?.addEventListener('change', atualizarDataQuitacao);
  document.getElementById('btn-data-gasto')?.addEventListener('click', () => {
    const inp = document.getElementById('input-data-gasto');
    if (!inp) return;
    inp.value = dataGastoSelecionada || getTodayISO();
    if (typeof inp.showPicker === 'function') inp.showPicker();
    else inp.click();
  });

  document.getElementById('input-data-gasto')?.addEventListener('change', (e) => {
    if (e.target.value) {
      dataGastoSelecionada = e.target.value;
      atualizarLabelDataGasto();
    }
  });

  document.getElementById('desc-gasto')?.addEventListener('input', (e) => {
    if (categoriaSelecionada && categoriaSelecionada !== categoriaDetectadaAuto) return;
    const detectada = detectarCategoriaAutomatica(e.target.value);
    if (detectada) {
      categoriaSelecionada = detectada;
      categoriaDetectadaAuto = detectada;
      atualizarBadgeCategoriaAuto();
      renderSeletorCategorias();
    } else if (categoriaDetectadaAuto) {
      categoriaSelecionada = null;
      categoriaDetectadaAuto = null;
      atualizarBadgeCategoriaAuto();
      renderSeletorCategorias();
    }
  });

  document.getElementById('btn-categoria')?.addEventListener('click', () => {
    const menu = document.getElementById('category-selector');
    const aberto = menu.classList.toggle('hidden') === false;
    document.getElementById('btn-categoria').setAttribute('aria-expanded', String(aberto));
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('#category-selector, #btn-categoria')) fecharMenuCategoria();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !document.getElementById('category-selector')?.classList.contains('hidden')) {
      fecharMenuCategoria(); document.getElementById('btn-categoria')?.focus();
    }
  });

  document.getElementById('moeda-gasto')?.addEventListener('change', async (e) => {
    document.getElementById('taxa-cambio').value='';
    atualizarSeletorMoedaUI();
    if (e.target.value !== moedaBase()) {
      await buscarCotacaoMoeda(e.target.value);
    }
    atualizarFeedbackDivisao();
  });

  document.getElementById('btn-buscar-cotacao')?.addEventListener('click', async () => {
    const moeda = document.getElementById('moeda-gasto')?.value;
    if (moeda && moeda !== moedaBase()) await buscarCotacaoMoeda(moeda);
  });

  document.getElementById('taxa-cambio')?.addEventListener('input', () => {
    atualizarConversaoCambioUI();
    atualizarFeedbackDivisao();
  });

  document.getElementById('valor-gasto')?.addEventListener('input', () => {
    atualizarConversaoCambioUI();
    atualizarFeedbackDivisao();
  });

  document.querySelectorAll('#split-mode-tabs .mode-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const novoModo = btn.dataset.mode;
      if (!novoModo || novoModo === modoDivisaoAtual) return;
      modoDivisaoAtual = novoModo;
      document.querySelectorAll('#split-mode-tabs .mode-tab').forEach(b => b.classList.toggle('active', b === btn));
      renderAreaDivisao();
    });
  });

  document.getElementById('btn-todos')?.addEventListener('click', () => {
    const checkboxes = Array.from(document.querySelectorAll('#area-divisao-dinamica input[type="checkbox"]'));
    if (checkboxes.length === 0) return;
    const todosMarcados = checkboxes.every(c => c.checked);
    checkboxes.forEach(c => { c.checked = !todosMarcados; });
    atualizarFeedbackDivisao();
  });

  document.getElementById('form-gasto')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const grupo = getGrupoAtivo();
    const editId = document.getElementById('edit-gasto-id')?.value || '';
    const desc = document.getElementById('desc-gasto')?.value?.trim() || '';
    const valor = parseFloat(document.getElementById('valor-gasto')?.value) || 0;
    const moeda = document.getElementById('moeda-gasto')?.value || moedaBase();
    const pagador = document.getElementById('pagador-gasto')?.value || '';

    if (!desc || valor <= 0 || !pagador) return;

    let taxaCambio = getTaxaCambioAtual(moeda);
    if (moeda !== moedaBase()) {
      taxaCambio = getTaxaCambioAtual(moeda);
      if (!(taxaCambio > 0)) {
        alert(t('invalidRateAlert'));
        return;
      }
      grupo.taxasCambio = grupo.taxasCambio || {};
      grupo.taxasCambio[moeda] = taxaCambio;
    }

    const valorBRL = valor * taxaCambio;
    const eraDesconhecido = grupo.gastos.some(g => g.id === editId && g.pagadorNaoIdentificado);
    const semPagador = eraDesconhecido && pagador === '__splitrao_unknown__';
    const antigoExato=grupo.gastos.find(g=>g.id===editId && g.modoDivisao==='exato');
    const camposExatos=Array.from(document.querySelectorAll('#area-divisao-dinamica [data-pessoa-custom]'));
    const exatoIntacto=antigoExato && modoDivisaoAtual==='exato' && antigoExato.valor===valor && antigoExato.moeda===moeda && Math.abs(taxaCambio-taxaExibida(antigoExato,grupo))<=1e-10*Math.abs(taxaCambio) && camposExatos.length>0 && camposExatos.every(i=>i.dataset.valorInicial!==undefined && Number(i.value||0)===Number(i.dataset.valorInicial||0));
    const divisaoObj = eraDesconhecido ? { modoDivisao: 'exato', divisao: semPagador ? {} : { [pagador]: valorBRL }, participantes: semPagador ? [] : [pagador] } : exatoIntacto ? {modoDivisao:'exato',divisao:divisaoExibida(antigoExato,grupo),participantes:antigoExato.participantes||Object.keys(antigoExato.divisao||{})} : construirDivisaoParaSalvar(valorBRL);
    if (!divisaoObj) return;

    const novoGasto = {
      id: editId || gerarId('gst'),
      tipo: 'despesa',
      descricao: desc,
      categoria: categoriaSelecionada || 'Geral',
      data: dataGastoSelecionada || getTodayISO(),
      valor,
      moeda,
      taxaCambio,
      valorBRL,
      pagador: semPagador ? null : pagador,
      pagadorNaoIdentificado: semPagador,
      ...divisaoObj
    };

    // Salva equivalentes na referência fixa, não na moeda de exibição.
    const fator = fatorMoeda(grupo);
    novoGasto.valorBRL /= fator;
    novoGasto.taxaCambio /= fator;
    for (const n of Object.keys(novoGasto.divisao || {})) novoGasto.divisao[n] /= fator;
    if (editId) {
      const idx = grupo.gastos.findIndex(g => g.id === editId);
      if (idx >= 0) {
        const antigo=grupo.gastos[idx];
        const perto=(a,b)=>Math.abs(a-b)<=1e-10*Math.max(1,Math.abs(a),Math.abs(b));
        if (antigo.moeda===novoGasto.moeda && antigo.valor===novoGasto.valor && perto(antigo.taxaCambio,novoGasto.taxaCambio)) {
          novoGasto.valorBRL=antigo.valorBRL; novoGasto.taxaCambio=antigo.taxaCambio;
          for (const n of Object.keys(novoGasto.divisao||{})) if (perto(antigo.divisao?.[n],novoGasto.divisao[n])) novoGasto.divisao[n]=antigo.divisao[n];
        }
        grupo.gastos[idx] = novoGasto;
      }
      else grupo.gastos.push(novoGasto);
    } else {
      grupo.gastos.push(novoGasto);
    }

    await salvarGrupoNaNuvem(grupo);
    cancelarEdicao();
    if (!editId) {
      setFormGastoVisivel(false);
    }
    renderTudo();
  });


  document.getElementById('btn-abrir-quitar')?.addEventListener('click', () => abrirModalQuitar());
  document.getElementById('btn-fechar-quitar')?.addEventListener('click', fecharModalQuitar);
  document.getElementById('btn-cancelar-quitar')?.addEventListener('click', fecharModalQuitar);

  document.getElementById('quitar-moeda')?.addEventListener('change', async (e) => {
    document.getElementById('quitar-taxa-cambio').value='';
    atualizarUIQuitarMoeda();
    if (e.target.value !== moedaBase()) {
      await buscarCotacaoQuitar();
    }
  });

  document.getElementById('btn-quitar-buscar-cotacao')?.addEventListener('click', buscarCotacaoQuitar);
  document.getElementById('quitar-valor')?.addEventListener('input', atualizarUIQuitarMoeda);
  document.getElementById('quitar-taxa-cambio')?.addEventListener('input', atualizarUIQuitarMoeda);

  document.getElementById('form-quitar')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const de = document.getElementById('quitar-de')?.value;
    const para = document.getElementById('quitar-para')?.value;
    const moeda = document.getElementById('quitar-moeda')?.value || moedaBase();
    const valor = parseFloat(document.getElementById('quitar-valor')?.value) || 0;
    const obs = document.getElementById('quitar-obs')?.value?.trim() || '';
    const data = document.getElementById('quitar-data').value;
    if (!data) return;

    if (!de || !para || de === para) {
      alert(t('diffPeopleAlert'));
      return;
    }
    if (!(valor > 0)) {
      alert(t('invalidAmountAlert'));
      return;
    }

    const taxaCambio = getTaxaQuitar();
    if (moeda !== moedaBase() && !(taxaCambio > 0)) {
      alert(t('invalidRateAlert'));
      return;
    }

    const valorBRL = valor * taxaCambio;
    const grupo = getGrupoAtivo();

    // Edição substitui o registro original, sem duplicar a transferência.
    const indice = edicaoPagamento ? grupo.gastos.findIndex(g => g.id === edicaoPagamento.id && g.tipo === 'pagamento') : -1;
    if (edicaoPagamento && (edicaoPagamento.grupoId !== grupo.id || indice < 0)) {
      fecharModalQuitar();
      return;
    }
    if (moeda !== moedaBase() && !edicaoPagamento) {
      grupo.taxasCambio = grupo.taxasCambio || {};
      grupo.taxasCambio[moeda] = taxaCambio;
    }

    const registro = {
      ...(indice >= 0 ? grupo.gastos[indice] : {}),
      id: edicaoPagamento?.id || gerarId('pgt'),
      tipo: 'pagamento',
      de,
      para,
      valor,
      moeda,
      taxaCambio,
      valorBRL,
      obs,
      data,
      descricao: obs ? t('settlementObsDesc', { obs }) : t('settlementDefaultDesc')
    };
    registro.valorBRL /= fatorMoeda(grupo);
    registro.taxaCambio /= fatorMoeda(grupo);
    if (indice >= 0) {
      const antigo=grupo.gastos[indice];
      if (antigo.moeda===registro.moeda && antigo.valor===registro.valor && Math.abs(antigo.taxaCambio-registro.taxaCambio)<=1e-10*Math.max(1,Math.abs(antigo.taxaCambio))) {
        registro.valorBRL=antigo.valorBRL; registro.taxaCambio=antigo.taxaCambio;
      }
      grupo.gastos[indice] = registro;
    }
    else grupo.gastos.push(registro);

    await salvarGrupoNaNuvem(grupo);
    fecharModalQuitar();
    renderTudo();
  });

  document.getElementById('filtro-categoria')?.addEventListener('change', (e) => {
    filtroCategoriaAtual = e.target.value;
    renderHistorico();
    renderPainelTotais();
  });

  document.getElementById('btn-toggle-totais')?.addEventListener('click', (e) => {
    totaisAberto = !totaisAberto;
    e.currentTarget.classList.toggle('active', totaisAberto);
    renderPainelTotais();
  });

  document.getElementById('btn-relatorio')?.addEventListener('click', abrirRelatorio);
  document.getElementById('btn-fechar-modal')?.addEventListener('click', () => {
    document.getElementById('modal-relatorio')?.classList.add('hidden');
  });
  document.getElementById('btn-imprimir')?.addEventListener('click', () => window.print());

  const acionarBalancoGlobal = () => {
    setMenu3DotsAberto(false);
    setMenu3DotsHomeAberto(false);
    abrirModalGlobal();
  };
  document.getElementById('btn-balanco-global')?.addEventListener('click', acionarBalancoGlobal);
  document.getElementById('btn-balanco-global-home')?.addEventListener('click', acionarBalancoGlobal);
  document.getElementById('btn-balanco-global-atalho')?.addEventListener('click', acionarBalancoGlobal);

  document.getElementById('modal-global')?.addEventListener('click', e => { if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden'); });
  document.getElementById('btn-fechar-global')?.addEventListener('click', () => {
    document.getElementById('modal-global')?.classList.add('hidden');
  });
  document.getElementById('btn-ok-global')?.addEventListener('click', () => {
    document.getElementById('modal-global')?.classList.add('hidden');
  });

  const copiarWpp = async (btn) => {
    if (!ultimoTextoWhatsApp) return;
    try {
      await navigator.clipboard.writeText(ultimoTextoWhatsApp);
    } catch {}
    if (btn) {
      const prev = btn.textContent;
      btn.textContent = t('copiedBtn');
      setTimeout(() => { btn.textContent = prev; }, 1600);
    }
  };

  document.getElementById('btn-copiar-texto')?.addEventListener('click', (e) => copiarWpp(e.currentTarget));
  document.getElementById('btn-copiar-global')?.addEventListener('click', (e) => copiarWpp(e.currentTarget));

  // ==================== INSTALAÇÃO DO PWA ====================
  let deferredInstallPrompt = null;
  let instalacaoConfirmada = false;
  let instalacaoEmCurso = false;
  const modoStandalone = window.matchMedia('(display-mode: standalone)');
  const dialogInstalar = document.getElementById('modal-instalar-pwa');

  function isAppStandalone() {
    return modoStandalone.matches || window.navigator.standalone === true;
  }
  function isIOSDevice() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (/Mac/i.test(navigator.platform || '') && navigator.maxTouchPoints > 1);
  }
  function sincronizarBotoesInstalar() {
    const ocultar = isAppStandalone() || instalacaoConfirmada;
    ['btn-instalar-app', 'btn-instalar-app-home', 'btn-instalar-app-gate'].forEach(id => {
      document.getElementById(id)?.classList.toggle('hidden', ocultar);
    });
  }
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredInstallPrompt = e;
    sincronizarBotoesInstalar();
  });
  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    instalacaoConfirmada = true;
    sincronizarBotoesInstalar();
  });
  modoStandalone.addEventListener?.('change', sincronizarBotoesInstalar);

  // Instruções localizadas, sem dependências externas.
  function mostrarInstrucoesInstalacao() {
    const tipo = isIOSDevice() ? 'ios' : /android/i.test(navigator.userAgent) ? 'android' : 'desktop';
    const passos = tipo === 'ios' ? ['installIOS1','installIOS2','installIOS3'] :
      tipo === 'android' ? ['installAndroid1','installAndroid2'] : ['installDesktop1','installDesktop2'];
    const icones = tipo === 'ios' ? ['share','plus','check'] : ['menu','plus'];
    const desenhos = {share:'<path d="M12 15V3m-4 4 4-4 4 4M8 10H5v11h14V10h-3"/>',plus:'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M12 7v10M7 12h10"/>',check:'<path d="m5 12 4 4L19 6"/>',menu:'<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>'};
    const corpo = document.getElementById('install-steps');
    corpo.replaceChildren();
    passos.forEach((chave,i) => {
      const linha = document.createElement('div'); linha.className = 'install-step';
      const icone = document.createElement('span'); icone.className = 'install-step-icon';
      icone.innerHTML = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${desenhos[icones[i]]}</svg>`;
      const texto = document.createElement('span'); texto.dataset.i18n = chave; texto.textContent = t(chave);
      linha.append(icone,texto); corpo.append(linha);
    });
    if (!dialogInstalar.open) dialogInstalar.showModal();
  }
  async function acionarInstalacaoApp() {
    setMenu3DotsAberto(false);
    setMenu3DotsHomeAberto(false);
    if (isAppStandalone() || instalacaoConfirmada || instalacaoEmCurso) return;
    if (deferredInstallPrompt) {
      const prompt = deferredInstallPrompt;
      deferredInstallPrompt = null;
      instalacaoEmCurso = true;
      try {
        await prompt.prompt();
        const { outcome } = await prompt.userChoice;
        if (outcome === 'accepted') instalacaoConfirmada = true;
      } catch { mostrarInstrucoesInstalacao(); }
      finally { instalacaoEmCurso = false; sincronizarBotoesInstalar(); }
      return;
    }
    mostrarInstrucoesInstalacao();
  }
  ['install-close','install-ok'].forEach(id => document.getElementById(id)?.addEventListener('click', () => dialogInstalar.close()));
  dialogInstalar.addEventListener('click', e => { if (e.target === dialogInstalar) { const r = dialogInstalar.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialogInstalar.close(); } });
  sincronizarBotoesInstalar();
  ['btn-instalar-app','btn-instalar-app-home','btn-instalar-app-gate'].forEach(id => document.getElementById(id)?.addEventListener('click', acionarInstalacaoApp));
  document.getElementById('btn-fechar-escolher-grupo')?.addEventListener('click', fecharModalEscolherGrupoGasto);

  document.getElementById('modal-escolher-grupo-gasto')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-escolher-grupo-gasto') {
      fecharModalEscolherGrupoGasto();
    }
  });

  document.getElementById('btn-escolher-novo-grupo-gasto')?.addEventListener('click', async () => {
    fecharModalEscolherGrupoGasto();
    const grupoCriado = await criarNovoGrupo();
    if (grupoCriado) {
      abrirTelaDetalheGrupo(grupoCriado.id);
      abrirFormularioDeNovoGasto();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-novo-gasto-home')?.addEventListener('click', aoClicarNovoGastoNaHome);
});


// ===== 23. MINHA CONTA — somente perfil privado =====
let contaPrefs = {};
let contaFotoRascunho = null;
let contaSessao = 0;
let contaOcupada = false;
const contaEl = id => document.getElementById(id);
function contaAplicarPerfil(data = {}) {
  contaPrefs = data.accountPreferences || {};
  const idioma = contaPrefs.language;
  if (['pt','en','es'].includes(idioma) && idioma !== currentLang) {
    currentLang = idioma;
    localStorage.setItem(LANG_STORAGE_KEY, idioma);
    aplicarIdiomaNaInterface();
  }
  contaAplicarTema();
  contaAtualizarAvatar();
}
function contaAplicarTema() {
  const escuro = contaPrefs.theme === 'dark' || (contaPrefs.theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  for (const id of ['modal-conta','modal-conta-senha','modal-conta-excluir']) contaEl(id).classList.toggle('conta-escura', escuro);
}
function contaAtualizarAvatar() {
  const avatar = contaEl('user-avatar');
  const foto = contaPrefs.photo ?? currentUser?.photoURL;
  if (foto) avatar.src = foto; else avatar.removeAttribute('src');
  avatar.classList.toggle('hidden', !foto);
}
function contaRenderFoto() {
  const foto = contaFotoRascunho ?? currentUser?.photoURL;
  const img = contaEl('conta-foto-img');
  if (foto) img.src = foto; else img.removeAttribute('src');
  img.classList.toggle('hidden', !foto);
  const iniciais = contaEl('conta-iniciais');
  iniciais.textContent = contaEl('conta-nome').value.trim().split(/\s+/).slice(0,2).map(n=>n[0] || '').join('').toUpperCase() || '?';
  iniciais.classList.toggle('hidden', !!foto);
  contaEl('conta-remover-foto').classList.toggle('hidden', !foto);
}
function contaFechar() {
  if (contaOcupada) return;
  contaSessao++;
  contaEl('modal-conta').classList.add('hidden');
  contaEl('conta-foto-input').value = '';
}
async function contaAbrir() {
  if (!currentUser || contaOcupada) return;
  setMenu3DotsHomeAberto(false);
  const uid = currentUser.uid, sessao = ++contaSessao;
  const status = contaEl('conta-status');
  contaEl('modal-conta').classList.remove('hidden');
  contaEl('conta-salvar').disabled = true;
  contaEl('conta-foto-btn').disabled = true;
  contaEl('conta-remover-foto').disabled = true;
  status.textContent = t('accountLoading');
  try {
    const snap = await getDoc(getUserProfileRef(uid));
    if (sessao !== contaSessao || currentUser?.uid !== uid) return;
    if (!snap.exists()) throw new Error('profile missing');
    const data = snap.data();
    contaPrefs = data.accountPreferences || {};
    contaEl('conta-nome').value = data.displayName || getNomeUsuarioEfetivo();
    contaEl('conta-email').value = currentUser.email || '';
    contaEl('conta-idioma').value = currentLang;
    preencherMoedas(contaEl('conta-moeda'));
    contaEl('conta-moeda').value = MOEDAS[contaPrefs.currency] ? contaPrefs.currency : 'BRL';
    contaEl('conta-tema').value = contaPrefs.theme || 'light';
    contaFotoRascunho = contaPrefs.photo ?? null;
    const dataCriacao = new Date(currentUser.metadata.creationTime);
    contaEl('conta-data').textContent = Number.isFinite(+dataCriacao) ? t('accountSince',{date:dataCriacao.toLocaleDateString(currentLang,{month:'long',year:'numeric'})}) : '';
    contaRenderFoto(); contaAplicarTema();
    status.textContent = '';
    contaEl('conta-foto-btn').disabled = false;
    contaEl('conta-remover-foto').disabled = false;
    contaEl('conta-salvar').disabled = false;
  } catch(e) { if (sessao === contaSessao) status.textContent = t('accountError'); }
}
function initMinhaConta() {
  contaEl('btn-minha-conta').addEventListener('click', contaAbrir);
  for (const id of ['conta-fechar','conta-cancelar']) contaEl(id).onclick = contaFechar;
  contaEl('modal-conta').onclick = e => { if(e.target === contaEl('modal-conta')) contaFechar(); };
  contaEl('conta-foto-btn').onclick = () => { if (!contaOcupada) contaEl('conta-foto-input').click(); };
  contaEl('conta-nome').oninput = contaRenderFoto;
  // Salva apenas a foto, sem aplicar os outros campos em edição.
  const salvarFotoConta = async (file = null) => {
    if (!currentUser || contaOcupada || contaEl('conta-salvar').disabled) return;
    const uid = currentUser.uid, sessao = contaSessao;
    const status = contaEl('conta-status');
    const mesmaSessao = () => currentUser?.uid === uid && contaSessao === sessao;
    contaOcupada = true;
    for (const id of ['conta-salvar','conta-foto-btn','conta-remover-foto']) contaEl(id).disabled = true;
    status.textContent = t('accountPhotoSaving');
    try {
      const foto = file ? await comprimirImagemArquivo(file,256,.72) : '';
      if (foto.length > 120000) throw new Error('photo too large');
      if (!mesmaSessao()) return;
      await setDoc(getUserProfileRef(uid), {accountPreferences:{photo:foto}}, {merge:true});
      if (!mesmaSessao()) return;
      contaFotoRascunho = foto;
      contaPrefs = {...contaPrefs, photo:foto};
      contaRenderFoto(); contaAtualizarAvatar();
      status.textContent = t('accountPhotoSaved');
    } catch (err) {
      if (mesmaSessao()) status.textContent = t('accountPhotoSaveError');
    } finally {
      contaOcupada = false;
      if (mesmaSessao()) for (const id of ['conta-salvar','conta-foto-btn','conta-remover-foto']) contaEl(id).disabled = false;
    }
  };
  contaEl('conta-remover-foto').onclick = () => salvarFotoConta();
  contaEl('conta-foto-input').onchange = e => {
    const file = e.target.files[0]; e.target.value = '';
    if (file) salvarFotoConta(file);
  };
  contaEl('conta-form').onsubmit = async e => {
    e.preventDefault(); if (!currentUser || contaOcupada || contaEl('conta-salvar').disabled) return;
    const nomeAnterior = getNomeUsuarioEfetivo();
    const user = currentUser, nome = contaEl('conta-nome').value.trim(); if(!nome) return;
    const prefs = {language:contaEl('conta-idioma').value,currency:contaEl('conta-moeda').value,theme:contaEl('conta-tema').value};
    contaOcupada = true; contaEl('conta-salvar').disabled = true;
    try {
      // Atualiza exclusivamente campos do perfil; nunca escreve groupIds ou groups.
      await setDoc(getUserProfileRef(user.uid), {displayName:nome,accountPreferences:prefs}, {merge:true});
      if(currentUser?.uid !== user.uid) return;
      salvarNomeUsuarioLocal(nome);
      try { await updateProfile(user,{displayName:nome}); } catch(err) { console.warn('Nome Auth:',err); }
      renderAuthUI(); contaAplicarPerfil({accountPreferences:{...contaPrefs,...prefs}});
      // Consulta os vínculos no servidor; nomes antigos sem marcação não são alterados.
      let falhas = 0;
      if (nome !== nomeAnterior || getGruposOrdenados().some(g => g.nomesPadrao?.[user.uid] === true && g.vinculos?.[user.uid] !== nome)) {
        for (const grupo of getGruposOrdenados()) {
          if (currentUser?.uid !== user.uid) break;
          try {
            const atualizado = await renomearMeuNomeV26(grupo.id, nome, true, true);
            if (atualizado) state.grupos[grupo.id] = atualizado;
          } catch (err) { falhas++; console.warn('Sincronização de nome:', grupo.id, err); }
        }
        renderTudo();
      }
      contaOcupada = false; contaFechar();
      if (falhas) alert(t('accountNameSyncError'));
    } catch(err) { contaEl('conta-status').textContent = t('accountError'); }
    finally { contaOcupada = false; contaEl('conta-salvar').disabled = false; }
  };
  contaEl('conta-sair').onclick = () => { if(!contaOcupada) { contaFechar(); contaEl('btn-logout').click(); } };
  contaEl('conta-reset').onclick = async () => {
    try { if(!currentUser?.email) throw new Error('email'); await sendPasswordResetEmail(auth,currentUser.email); contaEl('conta-status').textContent = t('authResetSentMsg'); }
    catch(e) { contaEl('conta-status').textContent = traduzirErroAuth(e); }
  };
  const senhaForm = contaEl('conta-senha-form');
  for (const id of ['conta-senha-nova','conta-senha-repetir']) contaEl(id).addEventListener('input', atualizarRequisitosConta);
  const fecharSenha = () => { if(contaOcupada) return; senhaForm.reset(); atualizarRequisitosConta(); contaEl('modal-conta-senha').classList.add('hidden'); };
  contaEl('conta-senha-abrir').onclick = () => {
    if(contaOcupada) return;
    if(!currentUser?.providerData.some(p=>p.providerId==='password')) { contaEl('conta-status').textContent=t('accountGooglePassword'); return; }
    senhaForm.reset(); atualizarRequisitosConta(); contaEl('conta-senha-status').textContent=''; contaEl('modal-conta-senha').classList.remove('hidden');
  };
  for(const id of ['conta-senha-fechar','conta-senha-cancelar']) contaEl(id).onclick=fecharSenha;
  contaEl('modal-conta-senha').onclick=e=>{if(e.target===contaEl('modal-conta-senha')) fecharSenha();};
  senhaForm.onsubmit=async e=>{
    e.preventDefault(); if(contaOcupada || !currentUser) return;
    const user=currentUser, nova=contaEl('conta-senha-nova').value, status=contaEl('conta-senha-status');
    if(!senhaNovaValida(nova)){status.textContent=t('passwordPolicyError');return;}
    if(nova!==contaEl('conta-senha-repetir').value){status.textContent=t('accountMismatch');return;}
    contaOcupada=true; contaEl('conta-senha-salvar').disabled=true;
    try { await reauthenticateWithCredential(user,EmailAuthProvider.credential(user.email,contaEl('conta-senha-atual').value)); await updatePassword(user,nova); contaOcupada=false; fecharSenha(); contaEl('conta-status').textContent=t('accountPasswordSaved'); }
    catch(err){status.textContent=traduzirErroAuth(err);}
    finally{contaOcupada=false;contaEl('conta-senha-salvar').disabled=false;}
  };
  // 24. Exclusão da conta: desvincula sem excluir documentos de grupos.
  const excluirForm = contaEl('conta-excluir-form');
  const excluirModal = contaEl('modal-conta-excluir');
  const fecharExcluir = () => { if (!contaOcupada) { excluirForm.reset(); excluirModal.classList.add('hidden'); } };
  contaEl('conta-excluir-abrir').onclick = () => {
    if (!currentUser || contaOcupada) return;
    excluirForm.reset();
    const senha = currentUser.providerData.some(p => p.providerId === 'password');
    contaEl('conta-excluir-senha-box').classList.toggle('hidden', !senha);
    contaEl('conta-excluir-senha').required = senha;
    contaEl('conta-excluir-google').classList.toggle('hidden', senha);
    contaEl('conta-excluir-instrucao').textContent = t('accountDeleteType', {word:t('accountDeleteWord')});
    contaEl('conta-excluir-status').textContent = '';
    excluirModal.classList.remove('hidden');
  };
  for (const id of ['conta-excluir-fechar','conta-excluir-cancelar']) contaEl(id).onclick = fecharExcluir;
  excluirModal.onclick = e => { if (e.target === excluirModal) fecharExcluir(); };
  excluirForm.onsubmit = async e => {
    e.preventDefault();
    if (!currentUser || contaOcupada || isSavingCloud) return;
    const user = currentUser, uid = user.uid, status = contaEl('conta-excluir-status');
    if (contaEl('conta-excluir-palavra').value.trim() !== t('accountDeleteWord')) { status.textContent = t('accountDeleteType',{word:t('accountDeleteWord')}); return; }
    contaOcupada = true;
    contaEl('conta-excluir-confirmar').disabled = true;
    status.textContent = t('accountDeleting');
    let perfilOriginal = null, limpeza = false, pausado = false;
    try {
      if (user.providerData.some(p => p.providerId === 'password')) {
        await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, contaEl('conta-excluir-senha').value));
      } else if (user.providerData.some(p => p.providerId === 'google.com')) {
        await reauthenticateWithPopup(user, googleProvider);
      } else throw new Error('Unsupported provider');
      contaEl('conta-excluir-senha').value = '';
      if (auth.currentUser?.uid !== uid) throw new Error('Session changed');
      unsubscribeUserDoc?.(); unsubscribeUserDoc = null;
      unsubscribeGroupDoc?.(); unsubscribeGroupDoc = null;
      pausado = true;
      const perfilRef = getUserProfileRef(uid);
      perfilOriginal = await runTransaction(db, async tx => {
        const perfil = await tx.get(perfilRef);
        if (!perfil.exists()) throw new Error('Profile missing');
        const dataPerfil = perfil.data();
        const ids = [...new Set(dataPerfil.groupIds || [])];
        if (ids.length > 100) throw new Error('Too many groups');
        const grupos = await Promise.all(ids.map(id => tx.get(getGroupDocRef(id))));
        for (const snap of grupos) {
          if (!snap.exists()) continue;
          const data = snap.data(), membros = membrosReais(data), vinculos = {...(data.vinculos || {})};
          if (!membros[uid] && !Object.hasOwn(vinculos,uid)) continue;
          const nome = vinculos[uid];
          delete membros[uid]; delete vinculos[uid];
          tx.update(snap.ref, {vinculos, participantesSemApp:[...new Set([...(data.participantesSemApp || []), ...(nome ? [nome] : [])])]});
          atualizarMembros(tx, snap.ref, data, membros);
        }
        tx.delete(perfilRef);
        return dataPerfil;
      });
      limpeza = true;
      await deleteUser(user);
      // Limpa apenas o cache local da conta removida.
      for (const key of [STORAGE_KEY_LEGACY, USER_NAME_STORAGE_KEY, ME_BY_GROUP_STORAGE_KEY]) localStorage.removeItem(key);
      location.reload();
    } catch (err) {
      console.error('Exclusão da conta:', err);
      if (limpeza && auth.currentUser?.uid === uid) {
        // Auth e Firestore não são atômicos. Recupera o perfil para permitir nova tentativa.
        try { await setDoc(getUserProfileRef(uid), perfilOriginal, {merge:true}); } catch (restoreErr) { console.error('Recuperação do perfil:', restoreErr); }
        status.textContent = t('accountDeletePartial');
      } else status.textContent = err?.code?.startsWith('auth/') ? traduzirErroAuth(err) : t('accountDeleteError');
      if (pausado && !limpeza && auth.currentUser?.uid === uid) {
        assinarPerfilUsuario(uid);
        if (state.grupoAtivoId) assinarGrupoAtivo(state.grupoAtivoId);
      }
    } finally {
      contaEl('conta-excluir-senha').value = '';
      contaOcupada = false;
      contaEl('conta-excluir-confirmar').disabled = false;
    }
  };
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!excluirModal.classList.contains('hidden')) fecharExcluir();else if(!contaEl('modal-conta-senha').classList.contains('hidden')) fecharSenha();else if(!contaEl('modal-conta').classList.contains('hidden')) contaFechar();}});
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change',contaAplicarTema);
}

// ===== 22. INICIALIZAÇÃO DO APP =====
state = carregarEstadoLocal();
dataGastoSelecionada = getTodayISO();
iniciarNavegacao();
initLanguageSwitcher();
initMinhaConta();
initAuthListeners();
initListeners();
aplicarIdiomaNaInterface();