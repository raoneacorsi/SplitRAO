import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { LANG_STORAGE_KEY, createTranslator } from "./i18n.js";
import { REGRAS_AUTO_CATEGORIA } from "./categorias-keywords.js";

// ==================== CONFIGURAÇÃO FIREBASE ====================
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

// ==================== CONSTANTES E ESTADO ====================
const STORAGE_KEY_LEGACY = 'raodev_split_v3_multi';
const USER_NAME_STORAGE_KEY = 'raodev_split_user_name_v1';
const ME_BY_GROUP_STORAGE_KEY = 'raodev_split_me_by_group_v1';
const DEFAULT_GROUP_ID = 'grp_padrao';

const CATEGORIAS = [
  { id: 'Casa', icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' },
  { id: 'Comida', icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>' },
  { id: 'Carro', icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>' },
  { id: 'Entretenimento', icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M12 12h.01"/><path d="M7 12h2"/><path d="M8 11v2"/><circle cx="15.5" cy="11" r="1"/><circle cx="18" cy="13" r="1"/></svg>' },
  { id: 'Transporte', icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="16" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><circle cx="8" cy="15" r="1"/><circle cx="16" cy="15" r="1"/></svg>' },
  { id: 'Vida', icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' }
];

const MOEDAS = {
  BRL: { code: 'BRL', symbol: 'R$', name: 'Real' },
  USD: { code: 'USD', symbol: 'US$', name: 'Dólar EUA' },
  CLP: { code: 'CLP', symbol: 'CLP$', name: 'Peso Chileno' },
  ARS: { code: 'ARS', symbol: 'ARS$', name: 'Peso Argentino' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro' },
  BOB: { code: 'BOB', symbol: 'Bs', name: 'Boliviano' },
  PEN: { code: 'PEN', symbol: 'S/', name: 'Sol Peruano' }
};

function normalizarTexto(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function detectarCategoriaAutomatica(descricao) {
  const texto = normalizarTexto(descricao);
  if (!texto || texto.length < 2) return null;

  const palavrasTexto = texto.split(/[^a-z0-9]+/).filter(Boolean);

  for (const regra of REGRAS_AUTO_CATEGORIA) {
    for (const kw of regra.palavras) {
      const kwNorm = normalizarTexto(kw);
      if (kwNorm.includes(' ')) {
        if (texto.includes(kwNorm)) return regra.categoria;
      } else {
        if (palavrasTexto.includes(kwNorm) || (kwNorm.length >= 4 && palavrasTexto.some(p => p.startsWith(kwNorm)))) {
          return regra.categoria;
        }
      }
    }
  }
  return null;
}

let currentLang = localStorage.getItem(LANG_STORAGE_KEY) || 'pt';
if (!['pt', 'es', 'en'].includes(currentLang)) currentLang = 'pt';
const { t, getNomeCategoriaTraduzido } = createTranslator(() => currentLang);

let currentUser = null;
let currentUserName = localStorage.getItem(USER_NAME_STORAGE_KEY) || '';
let meByGroupCache = {};

let authMode = 'login';
let unsubscribeGroupDoc = null;
let unsubscribeUserDoc = null;
let cloudGroupsCache = {};
let isSavingCloud = false;

let state = {
  grupoAtivoId: DEFAULT_GROUP_ID,
  grupos: {}
};

let modoDivisaoAtual = 'igual';
let categoriaSelecionada = null;
let categoriaDetectadaAuto = null;
let filtroCategoriaAtual = 'todas';
let totaisAberto = false;
let historicoAberto = false;
let formGastoAberto = false;
let dataGastoSelecionada = '';

// ==================== UTILITÁRIOS DE IDENTIDADE ("EU") ====================
function getMeStorageKey(uid) {
  return `${ME_BY_GROUP_STORAGE_KEY}_${uid || 'anon'}`;
}

function getUserNameStorageKey(uid) {
  return `${USER_NAME_STORAGE_KEY}_${uid || 'anon'}`;
}

function lerCacheMeDoUsuario(uid) {
  try {
    return JSON.parse(localStorage.getItem(getMeStorageKey(uid)) || '{}') || {};
  } catch {
    return {};
  }
}

function salvarCacheMeDoUsuario(uid, mapa) {
  try {
    localStorage.setItem(getMeStorageKey(uid), JSON.stringify(mapa || {}));
  } catch {}
}

function salvarNomeUsuarioLocal(nome, uid = currentUser?.uid) {
  const limpo = String(nome || '').trim();
  currentUserName = limpo;
  if (limpo) {
    localStorage.setItem(getUserNameStorageKey(uid), limpo);
    if (!uid) {
      localStorage.setItem(USER_NAME_STORAGE_KEY, limpo);
    }
  } else {
    localStorage.removeItem(getUserNameStorageKey(uid));
    if (!uid) {
      localStorage.removeItem(USER_NAME_STORAGE_KEY);
    }
  }
}

function carregarNomeUsuarioLocal(uid) {
  if (!uid) return localStorage.getItem(USER_NAME_STORAGE_KEY) || '';
  return localStorage.getItem(getUserNameStorageKey(uid)) || '';
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
  if (!grupo || !Array.isArray(grupo.pessoas) || grupo.pessoas.length === 0) return null;

  const uid = currentUser?.uid || null;
  const mapaGrupo = grupo.meusParticipantes && typeof grupo.meusParticipantes === 'object'
    ? grupo.meusParticipantes
    : {};

  if (uid && mapaGrupo[uid] && grupo.pessoas.includes(mapaGrupo[uid])) {
    return mapaGrupo[uid];
  }

  const cacheUid = lerCacheMeDoUsuario(uid);
  if (grupo.id && cacheUid[grupo.id] && grupo.pessoas.includes(cacheUid[grupo.id])) {
    return cacheUid[grupo.id];
  }

  const meuNome = getNomeUsuarioEfetivo();
  if (meuNome) {
    const alvo = normalizarTexto(meuNome);
    const match = grupo.pessoas.find(p => normalizarTexto(p) === alvo);
    if (match) return match;
  }

  if (!uid && grupo.meuParticipante && grupo.pessoas.includes(grupo.meuParticipante)) {
    return grupo.meuParticipante;
  }

  return null;
}

async function setMeParticipantName(grupo, pessoaNome) {
  if (!grupo || !pessoaNome) return;

  grupo.meusParticipantes = grupo.meusParticipantes && typeof grupo.meusParticipantes === 'object'
    ? { ...grupo.meusParticipantes }
    : {};

  const uid = currentUser?.uid || null;
  if (uid) {
    grupo.meusParticipantes[uid] = pessoaNome;
  } else {
    grupo.meuParticipante = pessoaNome;
  }

  if (grupo.id) {
    const cacheUid = lerCacheMeDoUsuario(uid);
    cacheUid[grupo.id] = pessoaNome;
    meByGroupCache = cacheUid;
    salvarCacheMeDoUsuario(uid, cacheUid);
  }

  salvarEstadoLocal();

  if (currentUser && grupo.id) {
    isSavingCloud = true;
    setSaveStatus('statusSaving');
    try {
      await setDoc(getGroupDocRef(grupo.id), {
        [`meusParticipantes.${currentUser.uid}`]: pessoaNome,
        [`members.${currentUser.uid}`]: true,
        updatedAt: Date.now()
      }, { merge: true });

      await setDoc(getUserProfileRef(currentUser.uid), {
        [`meByGroup.${grupo.id}`]: pessoaNome,
        updatedAt: Date.now()
      }, { merge: true });

      const agora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      setSaveStatus('statusSyncedAt', { time: agora });
    } catch (e) {
      console.warn('Erro ao salvar vínculo de "Eu" por usuário:', e);
      setSaveStatus('statusSaveError');
    } finally {
      setTimeout(() => {
        isSavingCloud = false;
      }, 300);
    }
  }
}

async function persistirNomeNoPerfil(nome) {
  const limpo = String(nome || '').trim();
  if (!limpo) return;
  salvarNomeUsuarioLocal(limpo, currentUser?.uid);
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

// ==================== UTILITÁRIOS GERAIS ====================
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

function formatMoney(valor, currencyCode = 'BRL') {
  const num = Number(valor) || 0;
  const sinal = num < 0 ? '-' : '';
  const abs = Math.abs(num).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  const info = MOEDAS[currencyCode] || MOEDAS.BRL;
  return `${sinal}${info.symbol} ${abs}`;
}

function getTaxaCambioAtual(moeda) {
  if (!moeda || moeda === 'BRL') return 1;
  const inputTaxa = parseFloat(document.getElementById('taxa-cambio')?.value);
  if (!isNaN(inputTaxa) && inputTaxa > 0) return inputTaxa;
  const g = getGrupoAtivo();
  const salva = g?.taxasCambio?.[moeda];
  if (typeof salva === 'number' && salva > 0) return salva;
  return 1;
}

function getValorEmBRL(gasto) {
  if (typeof gasto.valorBRL === 'number' && !isNaN(gasto.valorBRL)) {
    return gasto.valorBRL;
  }
  const moeda = gasto.moeda || 'BRL';
  const taxa = typeof gasto.taxaCambio === 'number' && gasto.taxaCambio > 0 ? gasto.taxaCambio : 1;
  return (Number(gasto.valor) || 0) * (moeda === 'BRL' ? 1 : taxa);
}

function getCategoriaObj(catId) {
  return CATEGORIAS.find(c => c.id === catId) || null;
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

function ordenarLancamentosPorData(lista) {
  return (Array.isArray(lista) ? lista : [])
    .map((item, idx) => ({ item, idx }))
    .sort((a, b) => {
      const da = a.item?.data || '';
      const db = b.item?.data || '';
      if (da !== db) {
        return db.localeCompare(da);
      }
      return b.idx - a.idx;
    })
    .map(entry => entry.item);
}

function setSaveStatus(statusKey, extraVars = {}) {
  const el = document.getElementById('save-status');
  if (!el) return;

  const textoCompleto = t(statusKey, extraVars) || '';
  el.title = textoCompleto;

  if (statusKey === 'statusSyncedAt') {
    el.textContent = '🟢';
  } else if (statusKey === 'statusSaving' || statusKey === 'statusConnecting') {
    el.textContent = '🟡';
  } else {
    el.textContent = '🔴';
  }
}

// ==================== INICIALIZAÇÃO DE ESTADO ====================
function criarGrupoPadrao(id = DEFAULT_GROUP_ID, nome = 'Grupo Principal') {
  return {
    id,
    nome,
    pessoas: [],
    meusParticipantes: {},
    meuParticipante: null,
    gastos: [],
    taxasCambio: {}
  };
}

function normalizarEstruturaGrupo(id, raw) {
  const g = raw && typeof raw === 'object' ? raw : {};
  const pessoas = Array.isArray(g.pessoas) ? g.pessoas : [];
  const meusParticipantes = g.meusParticipantes && typeof g.meusParticipantes === 'object'
    ? { ...g.meusParticipantes }
    : {};

  for (const [uidKey, boundName] of Object.entries(meusParticipantes)) {
    if (!pessoas.includes(boundName)) {
      delete meusParticipantes[uidKey];
    }
  }

  const uid = currentUser?.uid || null;
  const cacheUid = lerCacheMeDoUsuario(uid);
  if (uid && !meusParticipantes[uid] && cacheUid[id] && pessoas.includes(cacheUid[id])) {
    meusParticipantes[uid] = cacheUid[id];
  }

  return {
    id: g.id || id,
    nome: g.nome || 'Grupo',
    pessoas,
    meusParticipantes,
    meuParticipante: typeof g.meuParticipante === 'string' && pessoas.includes(g.meuParticipante)
      ? g.meuParticipante
      : null,
    gastos: Array.isArray(g.gastos) ? g.gastos : [],
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

// ==================== CAMADA FIREBASE / NUVEM ====================
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

  const nomeSalvoLocal = carregarNomeUsuarioLocal(user.uid);
  const nomeEfetivo = nomeSalvoLocal || user.displayName || user.email?.split('@')[0] || '';
  if (nomeEfetivo) {
    salvarNomeUsuarioLocal(nomeEfetivo, user.uid);
  }

  if (!snap.exists()) {
    const inicial = criarGrupoPadrao(DEFAULT_GROUP_ID, 'Grupo Principal');
    await setDoc(getGroupDocRef(DEFAULT_GROUP_ID), {
      ...inicial,
      ownerUid: user.uid,
      members: { [user.uid]: true },
      updatedAt: Date.now()
    }, { merge: true });

    await setDoc(userRef, {
      email: user.email || '',
      displayName: nomeEfetivo,
      groupIds: [DEFAULT_GROUP_ID],
      activeGroupId: DEFAULT_GROUP_ID,
      meByGroup: lerCacheMeDoUsuario(user.uid),
      updatedAt: Date.now()
    });

    return {
      email: user.email || '',
      displayName: nomeEfetivo,
      groupIds: [DEFAULT_GROUP_ID],
      activeGroupId: DEFAULT_GROUP_ID,
      meByGroup: lerCacheMeDoUsuario(user.uid)
    };
  }

  const data = snap.data();
  const groupIds = Array.isArray(data.groupIds) && data.groupIds.length > 0
    ? data.groupIds
    : [DEFAULT_GROUP_ID];
  const activeGroupId = data.activeGroupId && groupIds.includes(data.activeGroupId)
    ? data.activeGroupId
    : groupIds[0];

  const nomeNuvem = data.displayName || user.displayName || nomeSalvoLocal || '';
  if (nomeNuvem) {
    salvarNomeUsuarioLocal(nomeNuvem, user.uid);
  }

  const cacheAtual = lerCacheMeDoUsuario(user.uid);
  const meNuvem = data.meByGroup && typeof data.meByGroup === 'object' ? data.meByGroup : {};
  const cacheMesclado = { ...cacheAtual, ...meNuvem };
  meByGroupCache = cacheMesclado;
  salvarCacheMeDoUsuario(user.uid, cacheMesclado);

  await setDoc(userRef, {
    email: user.email || data.email || '',
    displayName: nomeNuvem || nomeEfetivo,
    groupIds,
    activeGroupId,
    meByGroup: cacheMesclado,
    updatedAt: Date.now()
  }, { merge: true });

  return {
    ...data,
    displayName: nomeNuvem || nomeEfetivo,
    groupIds,
    activeGroupId,
    meByGroup: cacheMesclado
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
      pessoas: grupo.pessoas || [],
      meusParticipantes: grupo.meusParticipantes || {},
      gastos: grupo.gastos || [],
      taxasCambio: grupo.taxasCambio || {},
      [`members.${currentUser.uid}`]: true,
      updatedAt: Date.now(),
      updatedBy: currentUser.uid
    };

    if (grupo.meusParticipantes?.[currentUser.uid]) {
      payload[`meusParticipantes.${currentUser.uid}`] = grupo.meusParticipantes[currentUser.uid];
    }

    await setDoc(groupRef, payload, { merge: true });
    cloudGroupsCache[grupo.id] = normalizarEstruturaGrupo(grupo.id, payload);
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

async function carregarGruposDoUsuario(userData) {
  if (!currentUser) return;
  const groupIds = Array.isArray(userData?.groupIds) ? userData.groupIds : [];

  if (groupIds.length === 0) {
    const padrao = criarGrupoPadrao(DEFAULT_GROUP_ID, 'Grupo Principal');
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
        const norm = normalizarEstruturaGrupo(gid, snap.data());
        novosGrupos[gid] = norm;
        cloudGroupsCache[gid] = norm;
      } else if (state.grupos[gid]) {
        novosGrupos[gid] = normalizarEstruturaGrupo(gid, state.grupos[gid]);
      }
    } catch (e) {
      console.warn(`Erro ao carregar grupo ${gid}:`, e);
      if (state.grupos[gid]) {
        novosGrupos[gid] = normalizarEstruturaGrupo(gid, state.grupos[gid]);
      }
    }
  }

  if (Object.keys(novosGrupos).length === 0) {
    const padrao = criarGrupoPadrao(DEFAULT_GROUP_ID, 'Grupo Principal');
    novosGrupos[padrao.id] = padrao;
    await salvarGrupoNaNuvem(padrao);
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
  const params = new URLSearchParams(window.location.search);
  const inviteGroupId = params.get('grupo') || params.get('group');
  if (!inviteGroupId || !currentUser) return;

  const cleanId = inviteGroupId.trim();
  try {
    const snap = await getDoc(getGroupDocRef(cleanId));
    if (snap.exists()) {
      const norm = normalizarEstruturaGrupo(cleanId, snap.data());
      state.grupos[cleanId] = norm;
      cloudGroupsCache[cleanId] = norm;
      state.grupoAtivoId = cleanId;
      await setDoc(getGroupDocRef(cleanId), {
        [`members.${currentUser.uid}`]: true,
        updatedAt: Date.now()
      }, { merge: true });
      await vincularGrupoAoUsuario(currentUser.uid, cleanId, true);
      salvarEstadoLocal();
      assinarGrupoAtivo(cleanId);
      renderTudo();
    } else {
      alert(t('groupNotFoundAlert'));
    }
  } catch (e) {
    console.warn('Erro ao processar convite da URL:', e);
  } finally {
    const urlLimpa = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, urlLimpa);
  }
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
      salvarNomeUsuarioLocal(data.displayName, uid);
      renderAuthUI();
      renderTudo();
    }

    if (data.meByGroup && typeof data.meByGroup === 'object') {
      const cacheAtual = lerCacheMeDoUsuario(uid);
      const mesclado = { ...cacheAtual, ...data.meByGroup };
      meByGroupCache = mesclado;
      salvarCacheMeDoUsuario(uid, mesclado);

      for (const [gid, nomeMe] of Object.entries(mesclado)) {
        if (state.grupos[gid] && state.grupos[gid].pessoas.includes(nomeMe)) {
          state.grupos[gid].meusParticipantes = state.grupos[gid].meusParticipantes || {};
          state.grupos[gid].meusParticipantes[uid] = nomeMe;
        }
      }
      renderTudo();
    }

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

// ==================== AUTENTICAÇÃO ====================
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
  }

  const btnSubmit = document.getElementById('btn-submit-auth');
  if (btnSubmit) {
    btnSubmit.textContent = isRegister ? t('authSubmitRegisterBtn') : t('authSubmitLoginBtn');
  }
  mostrarFeedbackAuth('');
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
      : (currentUser.email || currentUser.displayName || 'Usuário');
    if (displayEmail) displayEmail.textContent = rotulo;
    if (avatar) {
      if (currentUser.photoURL) {
        avatar.src = currentUser.photoURL;
        avatar.classList.remove('hidden');
      } else {
        avatar.classList.add('hidden');
      }
    }
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
    'auth/invalid-email': 'E-mail inválido.',
    'auth/user-not-found': 'Nenhuma conta encontrada com este e-mail.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/invalid-credential': 'E-mail ou senha inválidos.',
    'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
    'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres.',
    'auth/popup-closed-by-user': 'Login cancelado antes de concluir.',
    'auth/network-request-failed': 'Erro de rede. Verifique sua conexão.'
  };
  return mapa[code] || err?.message || 'Erro na autenticação.';
}

async function aplicarPersistenciaEscolhida() {
  const chk = document.getElementById('chk-manter-conectado');
  const manter = chk ? chk.checked : true;
  await setPersistence(auth, manter ? browserLocalPersistence : browserSessionPersistence);
}

function initAuthListeners() {
  document.querySelectorAll('#auth-mode-tabs .auth-tab').forEach(btn => {
    btn.addEventListener('click', () => setModoAuth(btn.dataset.authMode));
  });

  document.getElementById('btn-login-google')?.addEventListener('click', async () => {
    mostrarFeedbackAuth('');
    const nomeCadastro = authMode === 'register'
      ? (document.getElementById('auth-name')?.value?.trim() || '')
      : '';
    if (nomeCadastro) salvarNomeUsuarioLocal(nomeCadastro, null);

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

    mostrarFeedbackAuth('');

    try {
      await aplicarPersistenciaEscolhida();
      if (!isRegister) {
        await signInWithEmailAndPassword(auth, email, senha);
      } else {
        salvarNomeUsuarioLocal(nomeCadastro, null);
        const cred = await createUserWithEmailAndPassword(auth, email, senha);
        if (cred.user) {
          await updateProfile(cred.user, { displayName: nomeCadastro });
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
    currentUserName = '';
    meByGroupCache = {};
    await signOut(auth);
  });

  onAuthStateChanged(auth, async (user) => {
    currentUser = user || null;
    if (currentUser) {
      const nomeCadastro = authMode === 'register'
        ? (document.getElementById('auth-name')?.value?.trim() || '')
        : '';
      currentUserName = nomeCadastro || carregarNomeUsuarioLocal(currentUser.uid);
      meByGroupCache = lerCacheMeDoUsuario(currentUser.uid);

      if (nomeCadastro) {
        salvarNomeUsuarioLocal(nomeCadastro, currentUser.uid);
      }

      renderAuthUI();
      setSaveStatus('statusConnecting');
      try {
        const userData = await garantirPerfilUsuarioNaNuvem(currentUser);
        await carregarGruposDoUsuario(userData);
        assinarPerfilUsuario(currentUser.uid);
        await processarConviteDaURL();
        if (currentUserName) {
          await persistirNomeNoPerfil(currentUserName);
        }
        renderAuthUI();
        renderTudo();
      } catch (e) {
        console.error('Erro ao inicializar dados do usuário:', e);
        setSaveStatus('statusOffline');
        renderTudo();
      }
    } else {
      currentUserName = '';
      meByGroupCache = {};
      renderAuthUI();
      setSaveStatus('statusOffline');
    }
  });
}

// ==================== INTERNACIONALIZAÇÃO (I18N) ====================
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

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === currentLang);
  });

  setModoAuth(authMode);
  atualizarLabelDataGasto();
  atualizarSeletorMoedaUI();

  const btnSubmitGasto = document.getElementById('btn-submit-gasto');
  const editIdAtual = document.getElementById('edit-gasto-id')?.value || '';
  if (btnSubmitGasto) {
    btnSubmitGasto.textContent = editIdAtual ? t('updateExpenseBtn') : t('saveExpenseBtn');
  }

  renderTudo();
}

function initLanguageSwitcher() {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const novoLang = btn.dataset.lang;
      if (!novoLang || novoLang === currentLang) return;
      currentLang = novoLang;
      localStorage.setItem(LANG_STORAGE_KEY, currentLang);
      aplicarIdiomaNaInterface();
    });
  });
}

// ==================== ACESSO E GERENCIAMENTO DE GRUPOS ====================
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

function renderSeletorGrupos() {
  const select = document.getElementById('select-grupo');
  if (!select) return;
  select.innerHTML = '';

  Object.values(state.grupos).forEach(grupo => {
    const opt = document.createElement('option');
    opt.value = grupo.id;
    opt.textContent = grupo.nome;
    if (grupo.id === state.grupoAtivoId) opt.selected = true;
    select.appendChild(opt);
  });

  const badgeCodigo = document.getElementById('badge-codigo-grupo');
  if (badgeCodigo) {
    badgeCodigo.textContent = `ID: ${state.grupoAtivoId}`;
  }
}

async function trocarGrupoAtivo(novoId) {
  if (!state.grupos[novoId]) return;
  state.grupoAtivoId = novoId;
  filtroCategoriaAtual = 'todas';
  cancelarEdicao();
  salvarEstadoLocal();
  assinarGrupoAtivo(novoId);
  if (currentUser) {
    await vincularGrupoAoUsuario(currentUser.uid, novoId, true);
  }
  renderTudo();
}

async function criarNovoGrupo() {
  const nome = prompt(t('newGroupPrompt'));
  if (!nome || !nome.trim()) return;
  const id = gerarId('grp');
  const novoGrupo = criarGrupoPadrao(id, nome.trim());

  const nomeUsuario = getNomeUsuarioEfetivo();
  if (nomeUsuario) {
    novoGrupo.pessoas.push(nomeUsuario);
    if (currentUser) {
      novoGrupo.meusParticipantes[currentUser.uid] = nomeUsuario;
    }
  }

  state.grupos[id] = novoGrupo;
  state.grupoAtivoId = id;
  filtroCategoriaAtual = 'todas';
  cancelarEdicao();
  await salvarGrupoNaNuvem(novoGrupo);
  if (nomeUsuario) {
    await setMeParticipantName(novoGrupo, nomeUsuario);
  }
  if (currentUser) {
    await vincularGrupoAoUsuario(currentUser.uid, id, true);
  }
  assinarGrupoAtivo(id);
  renderTudo();
}

async function renomearGrupoAtual() {
  const grupo = getGrupoAtivo();
  const novoNome = prompt(t('renameGroupPrompt'), grupo.nome);
  if (!novoNome || !novoNome.trim()) return;
  grupo.nome = novoNome.trim();
  await salvarGrupoNaNuvem(grupo);
  renderTudo();
}

async function excluirOuSairDoGrupo() {
  const grupo = getGrupoAtivo();
  const escolha = prompt(t('deleteGroupPrompt', { name: grupo.nome }));
  if (!escolha) return;
  const op = escolha.trim();

  if (op === '1') {
    if (currentUser) {
      await desvincularGrupoDoUsuario(currentUser.uid, grupo.id);
    }
    delete state.grupos[grupo.id];
    const restantes = Object.keys(state.grupos);
    if (restantes.length === 0) {
      const padrao = criarGrupoPadrao(gerarId('grp'), 'Grupo Principal');
      state.grupos[padrao.id] = padrao;
      state.grupoAtivoId = padrao.id;
      await salvarGrupoNaNuvem(padrao);
      if (currentUser) await vincularGrupoAoUsuario(currentUser.uid, padrao.id, true);
    } else {
      state.grupoAtivoId = restantes[0];
      if (currentUser) await vincularGrupoAoUsuario(currentUser.uid, state.grupoAtivoId, true);
    }
    salvarEstadoLocal();
    assinarGrupoAtivo(state.grupoAtivoId);
    renderTudo();
  } else if (op === '2') {
    if (!confirm(t('deleteGroupConfirm', { name: grupo.nome }))) return;
    if (currentUser) {
      try {
        await setDoc(getGroupDocRef(grupo.id), {
          deleted: true,
          deletedAt: Date.now(),
          updatedAt: Date.now()
        }, { merge: true });
        await desvincularGrupoDoUsuario(currentUser.uid, grupo.id);
      } catch (e) {
        console.warn('Erro ao marcar grupo excluído:', e);
      }
    }
    delete state.grupos[grupo.id];
    const restantes = Object.keys(state.grupos);
    if (restantes.length === 0) {
      const padrao = criarGrupoPadrao(gerarId('grp'), 'Grupo Principal');
      state.grupos[padrao.id] = padrao;
      state.grupoAtivoId = padrao.id;
      await salvarGrupoNaNuvem(padrao);
      if (currentUser) await vincularGrupoAoUsuario(currentUser.uid, padrao.id, true);
    } else {
      state.grupoAtivoId = restantes[0];
      if (currentUser) await vincularGrupoAoUsuario(currentUser.uid, state.grupoAtivoId, true);
    }
    salvarEstadoLocal();
    assinarGrupoAtivo(state.grupoAtivoId);
    renderTudo();
  }
}

async function compartilharConviteGrupo() {
  const grupo = getGrupoAtivo();
  const baseUrl = window.location.origin + window.location.pathname;
  const link = `${baseUrl}?grupo=${encodeURIComponent(grupo.id)}`;
  const msg = t('inviteMsg', { name: grupo.nome, link, id: grupo.id });

  try {
    await navigator.clipboard.writeText(link);
  } catch {}
  alert(t('inviteCopiedAlert', { link }) + '\n\n' + msg);
}

async function entrarPorCodigoOuLink() {
  const raw = prompt(t('enterCodePrompt'));
  if (!raw || !raw.trim()) return;
  let codigo = raw.trim();
  try {
    if (codigo.includes('http') || codigo.includes('?')) {
      const urlObj = new URL(codigo.startsWith('http') ? codigo : `https://x.com/${codigo}`);
      codigo = urlObj.searchParams.get('grupo') || urlObj.searchParams.get('group') || codigo;
    }
  } catch {}
  codigo = codigo.trim();
  if (!codigo) return;

  try {
    const snap = await getDoc(getGroupDocRef(codigo));
    if (!snap.exists()) {
      alert(t('groupNotFoundAlert'));
      return;
    }
    const norm = normalizarEstruturaGrupo(codigo, snap.data());
    state.grupos[codigo] = norm;
    cloudGroupsCache[codigo] = norm;
    state.grupoAtivoId = codigo;
    if (currentUser) {
      await setDoc(getGroupDocRef(codigo), {
        [`members.${currentUser.uid}`]: true,
        updatedAt: Date.now()
      }, { merge: true });
      await vincularGrupoAoUsuario(currentUser.uid, codigo, true);
    }
    salvarEstadoLocal();
    assinarGrupoAtivo(codigo);
    renderTudo();
  } catch (e) {
    console.error('Erro ao entrar por código:', e);
    alert(t('groupNotFoundAlert'));
  }
}

// ==================== PARTICIPANTES E FUNÇÃO "EU" ====================
async function adicionarParticipante(nomeRaw, marcarComoEu = false) {
  const nome = String(nomeRaw || '').trim();
  if (!nome) return false;

  const grupo = getGrupoAtivo();
  const existente = grupo.pessoas.find(p => normalizarTexto(p) === normalizarTexto(nome));

  if (existente) {
    if (marcarComoEu) {
      await setMeParticipantName(grupo, existente);
      renderTudo();
      return true;
    }
    alert(t('personExistsAlert'));
    return false;
  }

  grupo.pessoas.push(nome);
  await salvarGrupoNaNuvem(grupo);
  if (marcarComoEu) {
    await setMeParticipantName(grupo, nome);
    await persistirNomeNoPerfil(nome);
  }
  renderTudo();
  return true;
}

async function acionarBotaoEu() {
  const grupo = getGrupoAtivo();
  const inputPessoa = document.getElementById('nome-pessoa');
  const digitadoNoCampo = inputPessoa?.value?.trim() || '';

  let nomeAlvo = digitadoNoCampo || getNomeUsuarioEfetivo();

  if (!nomeAlvo) {
    const perguntado = prompt(t('askMyNamePrompt'));
    if (!perguntado || !perguntado.trim()) return;
    nomeAlvo = perguntado.trim();
  }

  await persistirNomeNoPerfil(nomeAlvo);
  if (inputPessoa) inputPessoa.value = '';

  const existente = grupo.pessoas.find(p => normalizarTexto(p) === normalizarTexto(nomeAlvo));
  if (existente) {
    await setMeParticipantName(grupo, existente);
    renderTudo();
    return;
  }

  await adicionarParticipante(nomeAlvo, true);
}

async function removerParticipante(nome) {
  const grupo = getGrupoAtivo();
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
  if (grupo.meuParticipante === nome) {
    grupo.meuParticipante = null;
  }
  if (grupo.meusParticipantes && typeof grupo.meusParticipantes === 'object') {
    for (const [uidKey, boundName] of Object.entries(grupo.meusParticipantes)) {
      if (boundName === nome) {
        delete grupo.meusParticipantes[uidKey];
      }
    }
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

  if (grupo.pessoas.length === 0) {
    container.innerHTML = `<span class="empty-state-text">${escapeHTML(t('noParticipantsGroup'))}</span>`;
    return;
  }

  grupo.pessoas.forEach(pessoa => {
    const isMe = pessoa === meName;
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
    }

    const btnRem = document.createElement('button');
    btnRem.type = 'button';
    btnRem.className = 'tag-remove';
    btnRem.textContent = '×';
    btnRem.title = 'Remover';
    btnRem.addEventListener('click', () => removerParticipante(pessoa));

    tag.appendChild(btnRem);
    container.appendChild(tag);
  });
}

// ==================== CATEGORIAS, DATA E MOEDA ====================
function renderSeletorCategorias() {
  const grid = document.getElementById('category-selector');
  if (!grid) return;
  grid.innerHTML = '';

  CATEGORIAS.forEach(cat => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = categoriaSelecionada === cat.id ? 'cat-btn active' : 'cat-btn';
    btn.innerHTML = `${cat.icon}<span>${escapeHTML(getNomeCategoriaTraduzido(cat.id))}</span>`;
    btn.addEventListener('click', () => {
      categoriaSelecionada = categoriaSelecionada === cat.id ? null : cat.id;
      categoriaDetectadaAuto = null;
      atualizarBadgeCategoriaAuto();
      renderSeletorCategorias();
    });
    grid.appendChild(btn);
  });

  const btnLimpar = document.getElementById('btn-limpar-categoria');
  if (btnLimpar) {
    btnLimpar.classList.toggle('hidden', !categoriaSelecionada);
  }
}

function atualizarBadgeCategoriaAuto() {
  const badge = document.getElementById('auto-cat-badge');
  if (!badge) return;
  badge.classList.toggle('hidden', !categoriaDetectadaAuto || categoriaSelecionada !== categoriaDetectadaAuto);
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
  const moeda = document.getElementById('moeda-gasto')?.value || 'BRL';
  const boxCambio = document.getElementById('box-cambio');
  const currCodeEl = document.getElementById('exchange-curr-code');
  const titleEl = document.getElementById('exchange-rate-label');

  if (moeda === 'BRL') {
    boxCambio?.classList.add('hidden');
    return;
  }

  boxCambio?.classList.remove('hidden');
  if (currCodeEl) currCodeEl.textContent = moeda;
  if (titleEl) titleEl.textContent = t('exchangeTitle', { curr: moeda });

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
  const moeda = document.getElementById('moeda-gasto')?.value || 'BRL';
  if (moeda === 'BRL') return;
  const valor = parseFloat(document.getElementById('valor-gasto')?.value) || 0;
  const taxa = getTaxaCambioAtual(moeda);
  const convertido = valor * taxa;
  const el = document.getElementById('valor-convertido-brl');
  if (el) el.textContent = formatMoney(convertido, 'BRL');
}

async function buscarCotacaoMoeda(moeda) {
  if (!moeda || moeda === 'BRL') return;
  const statusEl = document.getElementById('cambio-status-msg');
  const inputTaxa = document.getElementById('taxa-cambio');
  if (statusEl) statusEl.textContent = t('fetchingRateMsg');

  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(moeda)}`);
    if (!res.ok) throw new Error('Falha na API de câmbio');
    const data = await res.json();
    const rate = data?.rates?.BRL;
    if (typeof rate !== 'number' || rate <= 0) throw new Error('Cotação BRL ausente');

    const rounded = Number(rate.toFixed(6));
    if (inputTaxa) inputTaxa.value = rounded;

    const grupo = getGrupoAtivo();
    grupo.taxasCambio = grupo.taxasCambio || {};
    grupo.taxasCambio[moeda] = rounded;
    await salvarGrupoNaNuvem(grupo);

    atualizarConversaoCambioUI();
    if (statusEl) statusEl.textContent = t('rateFetchedMsg', { curr: moeda });
  } catch {
    if (statusEl) statusEl.textContent = t('rateErrorMsg');
  }
}

// ==================== FORMULÁRIO DE GASTOS E DIVISÃO ====================
function setFormGastoVisivel(visivel) {
  formGastoAberto = Boolean(visivel);
  const btnAbrir = document.getElementById('btn-abrir-form-gasto');
  const container = document.getElementById('container-form-gasto');
  btnAbrir?.classList.toggle('hidden', formGastoAberto);
  container?.classList.toggle('hidden', !formGastoAberto);
}

function renderPagadorSelect() {
  const grupo = getGrupoAtivo();
  const select = document.getElementById('pagador-gasto');
  if (!select) return;

  const valorAnterior = select.value;
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

  if (valorAnterior && grupo.pessoas.includes(valorAnterior)) {
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
      prefix.textContent = modoDivisaoAtual === 'exato' ? 'R$' : '×';

      const inp = document.createElement('input');
      inp.type = 'number';
      inp.min = '0';
      inp.step = modoDivisaoAtual === 'exato' ? '0.01' : '1';
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
  const moeda = document.getElementById('moeda-gasto')?.value || 'BRL';
  const taxa = getTaxaCambioAtual(moeda);
  return valor * (moeda === 'BRL' ? 1 : taxa);
}

function atualizarFeedbackDivisao() {
  const feedback = document.getElementById('split-feedback');
  if (!feedback) return;

  const grupo = getGrupoAtivo();
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
      val: formatMoney(cada, 'BRL'),
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
      feedback.textContent = t('typedSumFeedback', { val: formatMoney(soma, 'BRL') });
      return;
    }

    const diff = Math.round((alvo - soma) * 100) / 100;
    if (Math.abs(diff) < 0.01) {
      feedback.classList.add('ok');
      feedback.textContent = t('exactMatchFeedback', { val: formatMoney(alvo, 'BRL') });
    } else if (diff > 0) {
      feedback.classList.add('warn');
      feedback.textContent = t('missingAmountFeedback', {
        diff: formatMoney(diff, 'BRL'),
        sum: formatMoney(soma, 'BRL')
      });
    } else {
      feedback.classList.add('err');
      feedback.textContent = t('exceededAmountFeedback', {
        diff: formatMoney(Math.abs(diff), 'BRL')
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
        val: formatMoney(totalBRL / totalCotas, 'BRL')
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
      alert(`${t('missingAmountFeedback', { diff: formatMoney(Math.abs(alvo - soma), 'BRL'), sum: formatMoney(soma, 'BRL') })}`);
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
  document.getElementById('edit-gasto-id').value = '';
  document.getElementById('form-gasto')?.reset();
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

  categoriaSelecionada = g.categoria || null;
  categoriaDetectadaAuto = null;
  atualizarBadgeCategoriaAuto();
  renderSeletorCategorias();

  const moeda = g.moeda || 'BRL';
  document.getElementById('moeda-gasto').value = moeda;
  document.getElementById('valor-gasto').value = g.valor;
  if (moeda !== 'BRL' && typeof g.taxaCambio === 'number') {
    document.getElementById('taxa-cambio').value = g.taxaCambio;
  }
  atualizarSeletorMoedaUI();

  if (grupo.pessoas.includes(g.pagador)) {
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
    renderAreaDivisao(g.divisao || {});
  } else {
    renderAreaDivisao(g.cotas || {});
  }

  document.getElementById('card-form-gasto')?.classList.add('editing-mode');
  document.getElementById('titulo-form-gasto').textContent = t('sec2TitleEdit');
  document.getElementById('btn-cancelar-edicao')?.classList.remove('hidden');
  document.getElementById('btn-submit-gasto').textContent = t('updateExpenseBtn');
  document.getElementById('card-form-gasto')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function apagarLancamento(id) {
  const grupo = getGrupoAtivo();
  const item = grupo.gastos.find(g => g.id === id);
  if (!item) return;

  const valFmt = formatMoney(getValorEmBRL(item), 'BRL');
  const msg = item.tipo === 'pagamento'
    ? t('confirmDeletePayment', { from: item.de, to: item.para, val: valFmt })
    : t('confirmDeleteExpense', { desc: item.descricao, val: valFmt });

  if (!confirm(msg)) return;
  grupo.gastos = grupo.gastos.filter(g => g.id !== id);
  await salvarGrupoNaNuvem(grupo);
  renderTudo();
}

// ==================== CÁLCULO DE SALDOS E ACERTOS ====================
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

  const devedorParaCredor = {};
  pessoas.forEach(de => {
    devedorParaCredor[de] = {};
    pessoas.forEach(para => {
      if (de !== para) devedorParaCredor[de][para] = 0;
    });
  });

  for (const g of gastos) {
    const valBRL = getValorEmBRL(g);

    if (g.tipo === 'pagamento') {
      if (stats[g.de]) stats[g.de].acertosLiquidos += valBRL;
      if (stats[g.para]) stats[g.para].acertosLiquidos -= valBRL;
      if (devedorParaCredor[g.para]?.[g.de] !== undefined) {
        devedorParaCredor[g.para][g.de] -= valBRL;
      }
      continue;
    }

    if (stats[g.pagador]) {
      stats[g.pagador].pagou += valBRL;
    }

    const divisao = g.divisao || {};
    for (const [pessoa, share] of Object.entries(divisao)) {
      const parte = Number(share) || 0;
      if (stats[pessoa]) {
        stats[pessoa].consumiu += parte;
      }
      if (g.pagador && pessoa !== g.pagador && devedorParaCredor[pessoa]?.[g.pagador] !== undefined) {
        devedorParaCredor[pessoa][g.pagador] += parte;
      }
    }
  }

  pessoas.forEach(p => {
    const s = stats[p];
    s.saldo = Math.round((s.pagou - s.consumiu + s.acertosLiquidos) * 100) / 100;
  });

  const credores = [];
  const devedores = [];

  pessoas.forEach(p => {
    const s = stats[p].saldo;
    if (s > 0.01) credores.push({ pessoa: p, valor: s });
    else if (s < -0.01) devedores.push({ pessoa: p, valor: Math.abs(s) });
  });

  credores.sort((a, b) => b.valor - a.valor);
  devedores.sort((a, b) => b.valor - a.valor);

  const transferencias = [];
  let i = 0;
  let j = 0;

  while (i < devedores.length && j < credores.length) {
    const dev = devedores[i];
    const cred = credores[j];
    const quantia = Math.min(dev.valor, cred.valor);
    const arred = Math.round(quantia * 100) / 100;

    if (arred > 0.01) {
      transferencias.push({
        de: dev.pessoa,
        para: cred.pessoa,
        valor: arred
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
  if (!box) return;

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
        <span class="meu-saldo-titulo">${escapeHTML(t('myBalanceHeading', { name: getNomeUsuarioEfetivo() || t('meBadge') }))}</span>
        <span class="empty-state-text">${escapeHTML(t('myBalanceLinkHint'))}</span>
      </div>
    `;
    return;
  }

  const meuSaldo = stats[meName].saldo || 0;
  const classeSaldo = meuSaldo > 0.01 ? 'positivo' : (meuSaldo < -0.01 ? 'negativo' : 'neutro');
  const sinal = meuSaldo > 0.01 ? '+' : '';

  const aReceber = transferencias.filter(tr => tr.para === meName);
  const aPagar = transferencias.filter(tr => tr.de === meName);

  let linhasHTML = '';
  if (aReceber.length === 0 && aPagar.length === 0) {
    linhasHTML = `<div class="meu-saldo-linha"><span class="neutro">${escapeHTML(t('myBalanceZero'))}</span></div>`;
  } else {
    aReceber.forEach(tr => {
      linhasHTML += `
        <div class="meu-saldo-linha">
          <span>${escapeHTML(t('myBalanceReceiveFrom'))} <strong>${escapeHTML(tr.de)}</strong></span>
          <strong class="positivo">+${escapeHTML(formatMoney(tr.valor, 'BRL'))}</strong>
        </div>
      `;
    });
    aPagar.forEach(tr => {
      linhasHTML += `
        <div class="meu-saldo-linha">
          <span>${escapeHTML(t('myBalancePayTo'))} <strong>${escapeHTML(tr.para)}</strong>
            <button type="button" class="btn-quitar-rapido" data-quitar-de="${escapeHTML(tr.de)}" data-quitar-para="${escapeHTML(tr.para)}" data-quitar-valor="${tr.valor.toFixed(2)}">${escapeHTML(t('quickSettleBtn'))}</button>
          </span>
          <strong class="negativo">-${escapeHTML(formatMoney(tr.valor, 'BRL'))}</strong>
        </div>
      `;
    });
  }

  box.innerHTML = `
    <div class="meu-saldo-top">
      <span class="meu-saldo-titulo">👤 ${escapeHTML(t('myBalanceHeading', { name: meName }))}</span>
      <span class="meu-saldo-total ${classeSaldo}">${sinal}${escapeHTML(formatMoney(meuSaldo, 'BRL'))}</span>
    </div>
    <div class="meu-saldo-detalhes">${linhasHTML}</div>
  `;

  box.querySelectorAll('.btn-quitar-rapido').forEach(btn => {
    btn.addEventListener('click', () => {
      abrirModalQuitar(btn.dataset.quitarDe, btn.dataset.quitarPara, btn.dataset.quitarValor);
    });
  });
}

function renderSaldosEAcertos() {
  const grupo = getGrupoAtivo();
  const grid = document.getElementById('resumo-saldos');
  const lista = document.getElementById('lista-acertos');
  if (!grid || !lista) return;

  grid.innerHTML = '';
  lista.innerHTML = '';

  if (grupo.pessoas.length === 0) {
    document.getElementById('meu-saldo-box')?.classList.add('hidden');
    grid.innerHTML = `<span class="empty-state-text">${escapeHTML(t('registerParticipantsSaldos'))}</span>`;
    return;
  }

  const { stats, transferencias } = calcularBalancoGrupo(grupo);
  const meName = getMeParticipantName(grupo);

  renderMeuSaldoDestaque(grupo, stats, transferencias);

  grupo.pessoas.forEach(p => {
    const saldo = stats[p]?.saldo || 0;
    const isMe = p === meName;
    const card = document.createElement('div');
    card.className = isMe ? 'saldo-card saldo-card-me' : 'saldo-card';

    const classeCor = saldo > 0.01 ? 'positivo' : (saldo < -0.01 ? 'negativo' : 'neutro');
    const sinal = saldo > 0.01 ? '+' : '';

    card.innerHTML = `
      <div class="saldo-nome">${escapeHTML(p)}${isMe ? ` (${escapeHTML(t('meBadge'))})` : ''}</div>
      <div class="saldo-valor ${classeCor}">${sinal}${escapeHTML(formatMoney(saldo, 'BRL'))}</div>
    `;
    grid.appendChild(card);
  });

  if (transferencias.length === 0) {
    lista.innerHTML = `<li class="empty-state-text" style="background:none;border:none;padding:4px 0;">${escapeHTML(t('allSettledShort'))}</li>`;
    return;
  }

  transferencias.forEach(tr => {
    const li = document.createElement('li');
    const texto = document.createElement('span');
    texto.innerHTML = `<strong>${escapeHTML(tr.de)}</strong> ${escapeHTML(t('owesText'))} <strong>${escapeHTML(formatMoney(tr.valor, 'BRL'))}</strong> ${escapeHTML(t('toText'))} <strong>${escapeHTML(tr.para)}</strong>`;

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

// ==================== HISTÓRICO, FILTROS E TOTAIS ====================
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

  const optSemCat = document.createElement('option');
  optSemCat.value = 'Sem categoria';
  optSemCat.textContent = t('catNoCategory');
  select.appendChild(optSemCat);

  const optPag = document.createElement('option');
  optPag.value = 'pagamentos';
  optPag.textContent = t('filterOnlySettlements');
  select.appendChild(optPag);

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
  const btnToggle = document.getElementById('btn-toggle-historico');
  const containerHist = document.getElementById('container-historico');

  const despesas = (grupo.gastos || []).filter(g => g.tipo !== 'pagamento');
  const totalDespesasBRL = despesas.reduce((acc, g) => acc + getValorEmBRL(g), 0);

  if (badgeTotal) {
    badgeTotal.textContent = `${t('totalSpentBadge')}: ${formatMoney(totalDespesasBRL, 'BRL')}`;
  }

  const qtd = (grupo.gastos || []).length;
  const palavraItens = qtd === 1 ? t('entrySingular') : t('entryPlural');
  if (btnToggle) {
    btnToggle.textContent = historicoAberto
      ? t('collapseHistoryBtn', { n: qtd, items: palavraItens })
      : t('viewHistoryBtn', { n: qtd, items: palavraItens });
  }
  containerHist?.classList.toggle('hidden', !historicoAberto);

  if (!ul) return;
  ul.innerHTML = '';

  const filtrados = ordenarLancamentosPorData(getLancamentosFiltrados(grupo));
  if (filtrados.length === 0) {
    ul.innerHTML = `<li class="empty-state-text">${escapeHTML(t('noEntriesFilter'))}</li>`;
    return;
  }

  filtrados.forEach(g => {
    const li = document.createElement('li');
    const valBRL = getValorEmBRL(g);
    const moeda = g.moeda || 'BRL';
    const valorDisplay = moeda === 'BRL'
      ? formatMoney(valBRL, 'BRL')
      : `${formatMoney(g.valor, moeda)} (${formatMoney(valBRL, 'BRL')})`;

    if (g.tipo === 'pagamento') {
      li.className = 'gasto-item item-pagamento';
      const obsText = g.obs ? ` • ${g.obs}` : '';
      const dataText = g.data ? `${formatDateBR(g.data)} • ` : '';
      li.innerHTML = `
        <div class="gasto-info">
          <strong><span class="badge-pagamento">${escapeHTML(t('settlementBadge'))}</span>${escapeHTML(g.de)} ${escapeHTML(t('paidToText'))} ${escapeHTML(g.para)}</strong>
          <small>${escapeHTML(dataText + (g.descricao || t('settlementDefaultDesc')) + obsText)}</small>
        </div>
        <div class="gasto-right">
          <span class="gasto-valor pagamento-val">${escapeHTML(formatMoney(valBRL, 'BRL'))}</span>
          <button type="button" class="btn-icon-action btn-del-gasto" title="Apagar">🗑</button>
        </div>
      `;
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
          <small>${escapeHTML(dataPrefix + t('paidByText'))} <strong>${escapeHTML(g.pagador)}</strong> • ${escapeHTML(t('splitWithText'))} ${escapeHTML(partLista.join(', '))}</small>
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
  const mediaFiltro = despesasFiltradas.length > 0 ? totalFiltro / despesasFiltradas.length : 0;

  const porCat = {};
  const porMes = {};

  despesasFiltradas.forEach(g => {
    const val = getValorEmBRL(g);
    const catKey = g.categoria || 'Sem categoria';
    porCat[catKey] = (porCat[catKey] || 0) + val;

    const mesKey = g.data && g.data.length >= 7 ? g.data.slice(0, 7) : t('noDateLabel');
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
            <strong>${escapeHTML(formatMoney(val, 'BRL'))} (${pct}%)</strong>
          </div>
          <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
        </div>
      `;
    }).join('');

  const mesHTML = Object.entries(porMes)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([mes, val]) => {
      const pct = totalFiltro > 0 ? Math.round((val / totalFiltro) * 100) : 0;
      return `
        <div class="total-row-item">
          <div class="total-row-top">
            <span class="total-row-label"><span>${escapeHTML(mes)}</span></span>
            <strong>${escapeHTML(formatMoney(val, 'BRL'))}</strong>
          </div>
          <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
        </div>
      `;
    }).join('');

  conteudo.innerHTML = `
    <div class="totais-resumo-cards">
      <div class="total-mini-card">
        <small>${escapeHTML(filtroCategoriaAtual === 'todas' ? t('groupTotalCard') : t('activeFilterTotalCard'))}</small>
        <strong>${escapeHTML(formatMoney(filtroCategoriaAtual === 'todas' ? totalGrupo : totalFiltro, 'BRL'))}</strong>
      </div>
      <div class="total-mini-card">
        <small>${escapeHTML(t('avgExpenseCard'))}</small>
        <strong>${escapeHTML(formatMoney(mediaFiltro, 'BRL'))}</strong>
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

// ==================== MODAL QUITAR CONTA ====================
function abrirModalQuitar(dePadrao = '', paraPadrao = '', valorPadrao = '') {
  const grupo = getGrupoAtivo();
  if (!grupo.pessoas || grupo.pessoas.length < 2) {
    alert(t('need2PeopleAlert'));
    return;
  }

  const selDe = document.getElementById('quitar-de');
  const selPara = document.getElementById('quitar-para');
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

  if (inpVal) inpVal.value = valorPadrao || '';
  if (inpObs) inpObs.value = '';

  document.getElementById('modal-quitar')?.classList.remove('hidden');
}

function fecharModalQuitar() {
  document.getElementById('modal-quitar')?.classList.add('hidden');
}

// ==================== RELATÓRIO E BALANÇO GLOBAL ====================
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
    : `<ul>${transferencias.map(tr => `<li><strong>${escapeHTML(tr.de)}</strong> ${escapeHTML(t('reportStillOwes'))} <strong>${escapeHTML(formatMoney(tr.valor, 'BRL'))}</strong> ${escapeHTML(t('toText'))} <strong>${escapeHTML(tr.para)}</strong></li>`).join('')}</ul>`;

  const balancoRows = grupo.pessoas.map(p => {
    const s = stats[p] || { pagou: 0, consumiu: 0, acertosLiquidos: 0, saldo: 0 };
    const cls = s.saldo > 0.01 ? 'positivo' : (s.saldo < -0.01 ? 'negativo' : 'neutro');
    return `
      <tr>
        <td>${escapeHTML(p)}</td>
        <td>${escapeHTML(formatMoney(s.pagou, 'BRL'))}</td>
        <td>${escapeHTML(formatMoney(s.consumiu, 'BRL'))}</td>
        <td>${escapeHTML(formatMoney(s.acertosLiquidos, 'BRL'))}</td>
        <td class="${cls}"><strong>${escapeHTML(formatMoney(s.saldo, 'BRL'))}</strong></td>
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
    return `<tr><td>${escapeHTML(getNomeCategoriaTraduzido(c))}</td><td>${escapeHTML(formatMoney(v, 'BRL'))}</td><td>${pct}%</td></tr>`;
  }).join('');

  const expRows = despesas.length === 0
    ? `<tr><td colspan="4">${escapeHTML(t('noExpensesRecorded'))}</td></tr>`
    : despesas.map(g => `
      <tr>
        <td>${escapeHTML(g.data ? formatDateBR(g.data) : '-')}</td>
        <td>${escapeHTML(g.descricao)}</td>
        <td>${escapeHTML(g.pagador)}</td>
        <td>${escapeHTML(formatMoney(getValorEmBRL(g), 'BRL'))}</td>
      </tr>
    `).join('');

  const payRows = pagamentos.map(p => `
    <tr>
      <td>${escapeHTML(p.data ? formatDateBR(p.data) : '-')}</td>
      <td>${escapeHTML(p.de)} → ${escapeHTML(p.para)}${p.obs ? ` (${escapeHTML(p.obs)})` : ''}</td>
      <td>${escapeHTML(formatMoney(getValorEmBRL(p), 'BRL'))}</td>
    </tr>
  `).join('');

  document.getElementById('relatorio-conteudo').innerHTML = `
    <div class="rel-section">
      <p><strong>${escapeHTML(t('reportGroupLabel'))}</strong> ${escapeHTML(grupo.nome)}</p>
      <p><strong>${escapeHTML(t('reportDateLabel'))}</strong> ${escapeHTML(formatDateBR(getTodayISO()))}</p>
      <p><strong>${escapeHTML(t('reportTotalExpensesLabel'))}</strong> ${escapeHTML(formatMoney(totalDespesas, 'BRL'))}</p>
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
    t('wppTotalExpenses', { val: formatMoney(totalDespesas, 'BRL') }),
    '',
    t('wppPendingHeader')
  ];
  if (transferencias.length === 0) {
    linhasWpp.push(t('wppAllSettled'));
  } else {
    transferencias.forEach(tr => {
      linhasWpp.push(t('wppPaysLine', { from: tr.de, val: formatMoney(tr.valor, 'BRL'), to: tr.para }));
    });
  }
  ultimoTextoWhatsApp = linhasWpp.join('\n');

  document.getElementById('modal-relatorio')?.classList.remove('hidden');
}

function calcularBalancoGlobal() {
  const gruposLista = Object.values(state.grupos || {});
  const consolidadoPorPessoa = {};

  gruposLista.forEach(g => {
    const { stats } = calcularBalancoGrupo(g);
    Object.values(stats).forEach(s => {
      if (!consolidadoPorPessoa[s.nome]) {
        consolidadoPorPessoa[s.nome] = { nome: s.nome, saldoTotal: 0, porGrupo: [] };
      }
      consolidadoPorPessoa[s.nome].saldoTotal = Math.round((consolidadoPorPessoa[s.nome].saldoTotal + s.saldo) * 100) / 100;
      if (Math.abs(s.saldo) > 0.01) {
        consolidadoPorPessoa[s.nome].porGrupo.push({ grupoNome: g.nome, saldo: s.saldo });
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
      transferenciasGlobais.push({ de: devedores[i].pessoa, para: credores[j].pessoa, valor: arred });
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
    : `<ul>${transferenciasGlobais.map(tr => `<li><strong>${escapeHTML(tr.de)}</strong> → <strong>${escapeHTML(tr.para)}</strong>: <strong>${escapeHTML(formatMoney(tr.valor, 'BRL'))}</strong></li>`).join('')}</ul>`;

  const rowsHTML = consolidadoPorPessoa
    .sort((a, b) => b.saldoTotal - a.saldoTotal)
    .map(p => {
      const cls = p.saldoTotal > 0.01 ? 'positivo' : (p.saldoTotal < -0.01 ? 'negativo' : 'neutro');
      const origem = p.porGrupo.length > 0
        ? p.porGrupo.map(og => `${og.grupoNome} (${formatMoney(og.saldo, 'BRL')})`).join(', ')
        : t('zeroedInAll');
      return `
        <tr>
          <td><strong>${escapeHTML(p.nome)}</strong></td>
          <td><small>${escapeHTML(origem)}</small></td>
          <td class="${cls}"><strong>${escapeHTML(formatMoney(p.saldoTotal, 'BRL'))}</strong></td>
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
      linhasWpp.push(t('wppPaysLine', { from: tr.de, val: formatMoney(tr.valor, 'BRL'), to: tr.para }));
    });
  }
  ultimoTextoWhatsApp = linhasWpp.join('\n');

  document.getElementById('modal-global')?.classList.remove('hidden');
}

// ==================== BACKUP E IMPORTAÇÃO JSON ====================
function exportarBackupJSON() {
  const payload = {
    app: 'SplitRAO',
    version: 6,
    exportedAt: new Date().toISOString(),
    userName: currentUserName,
    state
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `splitrao-backup-${getTodayISO()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function importarBackupJSON(file) {
  if (!file) return;
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const gruposFonte = parsed?.state?.grupos || parsed?.grupos;
    if (!gruposFonte || typeof gruposFonte !== 'object') return;

    for (const [gid, gdata] of Object.entries(gruposFonte)) {
      const norm = normalizarEstruturaGrupo(gid, gdata);
      state.grupos[gid] = norm;
      await salvarGrupoNaNuvem(norm);
      if (currentUser) {
        await vincularGrupoAoUsuario(currentUser.uid, gid, false);
      }
    }
    const primeiroId = Object.keys(gruposFonte)[0];
    if (primeiroId) {
      await trocarGrupoAtivo(primeiroId);
    }
    renderTudo();
  } catch (e) {
    console.error('Erro ao importar JSON:', e);
  }
}

// ==================== RENDERIZAÇÃO GERAL ====================
function renderTudo() {
  renderSeletorGrupos();
  renderListaPessoas();
  renderPagadorSelect();
  renderSeletorCategorias();
  renderAreaDivisao();
  renderSaldosEAcertos();
  renderFiltroCategorias();
  renderHistorico();
  renderPainelTotais();
}

// ==================== EVENT LISTENERS ====================
function initListeners() {
  document.getElementById('select-grupo')?.addEventListener('change', (e) => trocarGrupoAtivo(e.target.value));
  document.getElementById('btn-novo-grupo')?.addEventListener('click', criarNovoGrupo);
  document.getElementById('btn-renomear-grupo')?.addEventListener('click', renomearGrupoAtual);
  document.getElementById('btn-excluir-grupo')?.addEventListener('click', excluirOuSairDoGrupo);
  document.getElementById('btn-compartilhar-grupo')?.addEventListener('click', compartilharConviteGrupo);
  document.getElementById('btn-entrar-codigo')?.addEventListener('click', entrarPorCodigoOuLink);

  document.getElementById('badge-codigo-grupo')?.addEventListener('click', async () => {
    const id = state.grupoAtivoId;
    try {
      await navigator.clipboard.writeText(id);
    } catch {}
    const el = document.getElementById('badge-codigo-grupo');
    if (el) {
      const prev = el.textContent;
      el.textContent = t('codeCopiedBadge');
      setTimeout(() => { el.textContent = prev; }, 1600);
    }
  });

  document.getElementById('btn-exportar-json')?.addEventListener('click', exportarBackupJSON);
  document.getElementById('input-importar-json')?.addEventListener('change', (e) => {
    if (e.target.files?.[0]) importarBackupJSON(e.target.files[0]);
    e.target.value = '';
  });

  document.getElementById('form-pessoa')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('nome-pessoa');
    if (!input?.value?.trim()) return;
    const ok = await adicionarParticipante(input.value.trim(), false);
    if (ok) input.value = '';
  });

  document.getElementById('btn-add-eu')?.addEventListener('click', acionarBotaoEu);

  document.getElementById('btn-abrir-form-gasto')?.addEventListener('click', () => {
    setFormGastoVisivel(true);
    renderPagadorSelect();
    renderAreaDivisao();
  });
  document.getElementById('btn-fechar-form-gasto')?.addEventListener('click', () => setFormGastoVisivel(false));
  document.getElementById('btn-cancelar-edicao')?.addEventListener('click', cancelarEdicao);

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

  document.getElementById('btn-limpar-categoria')?.addEventListener('click', () => {
    categoriaSelecionada = null;
    categoriaDetectadaAuto = null;
    atualizarBadgeCategoriaAuto();
    renderSeletorCategorias();
  });

  document.getElementById('moeda-gasto')?.addEventListener('change', async (e) => {
    atualizarSeletorMoedaUI();
    if (e.target.value !== 'BRL') {
      await buscarCotacaoMoeda(e.target.value);
    }
    atualizarFeedbackDivisao();
  });

  document.getElementById('btn-buscar-cotacao')?.addEventListener('click', async () => {
    const moeda = document.getElementById('moeda-gasto')?.value;
    if (moeda && moeda !== 'BRL') await buscarCotacaoMoeda(moeda);
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
    const moeda = document.getElementById('moeda-gasto')?.value || 'BRL';
    const pagador = document.getElementById('pagador-gasto')?.value || '';

    if (!desc || valor <= 0 || !pagador) return;

    let taxaCambio = 1;
    if (moeda !== 'BRL') {
      taxaCambio = getTaxaCambioAtual(moeda);
      if (!(taxaCambio > 0)) {
        alert(t('invalidRateAlert'));
        return;
      }
      grupo.taxasCambio = grupo.taxasCambio || {};
      grupo.taxasCambio[moeda] = taxaCambio;
    }

    const valorBRL = valor * (moeda === 'BRL' ? 1 : taxaCambio);
    const divisaoObj = construirDivisaoParaSalvar(valorBRL);
    if (!divisaoObj) return;

    const novoGasto = {
      id: editId || gerarId('gst'),
      tipo: 'despesa',
      descricao: desc,
      categoria: categoriaSelecionada || null,
      data: dataGastoSelecionada || getTodayISO(),
      valor,
      moeda,
      taxaCambio,
      valorBRL,
      pagador,
      ...divisaoObj
    };

    if (editId) {
      const idx = grupo.gastos.findIndex(g => g.id === editId);
      if (idx >= 0) grupo.gastos[idx] = novoGasto;
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

  document.getElementById('form-quitar')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const de = document.getElementById('quitar-de')?.value;
    const para = document.getElementById('quitar-para')?.value;
    const valor = parseFloat(document.getElementById('quitar-valor')?.value) || 0;
    const obs = document.getElementById('quitar-obs')?.value?.trim() || '';

    if (!de || !para || de === para) {
      alert(t('diffPeopleAlert'));
      return;
    }
    if (!(valor > 0)) {
      alert(t('invalidAmountAlert'));
      return;
    }

    const grupo = getGrupoAtivo();
    grupo.gastos.push({
      id: gerarId('pgt'),
      tipo: 'pagamento',
      de,
      para,
      valor,
      moeda: 'BRL',
      taxaCambio: 1,
      valorBRL: valor,
      obs,
      data: getTodayISO(),
      descricao: obs ? t('settlementObsDesc', { obs }) : t('settlementDefaultDesc')
    });

    await salvarGrupoNaNuvem(grupo);
    fecharModalQuitar();
    renderTudo();
  });

  document.getElementById('btn-toggle-historico')?.addEventListener('click', () => {
    historicoAberto = !historicoAberto;
    renderHistorico();
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

  document.getElementById('btn-balanco-global')?.addEventListener('click', abrirModalGlobal);
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
}

// ==================== BOOT ====================
state = carregarEstadoLocal();
dataGastoSelecionada = getTodayISO();
initLanguageSwitcher();
initAuthListeners();
initListeners();
aplicarIdiomaNaInterface();