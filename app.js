import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  deleteDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { LANG_STORAGE_KEY, I18N, createTranslator } from "./i18n.js";

// Configuração do projeto Firebase (splitrao)
const firebaseConfig = {
  apiKey: "AIzaSyDheZEifsJ7WDQk9-l6wosXZuewyjyy3Sg",
  authDomain: "splitrao.firebaseapp.com",
  projectId: "splitrao",
  storageBucket: "splitrao.firebasestorage.app",
  messagingSenderId: "164442586974",
  appId: "1:164442586974:web:0210ece879b7b78363d9cf"
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Registra Service Worker para abrir o app mesmo sem internet
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.warn('Service Worker não registrado:', err);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const BASE_STORAGE_KEY = 'raodev_split_grupos_v2';
  const LAST_PAYER_STORAGE_KEY = 'raodev_split_last_payer_v1';

  let idiomaAtual = localStorage.getItem(LANG_STORAGE_KEY) || 'pt';
  if (!I18N[idiomaAtual]) idiomaAtual = 'pt';

  const { t, getNomeCategoriaTraduzido } = createTranslator(() => idiomaAtual);

  const CATEGORIAS = [
    {
      id: 'Casa',
      svg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>'
    },
    {
      id: 'Comida',
      svg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>'
    },
    {
      id: 'Carro',
      svg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>'
    },
    {
      id: 'Entretenimento',
      svg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>'
    },
    {
      id: 'Transporte',
      svg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>'
    },
    {
      id: 'Vida',
      svg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>'
    }
  ];

  const KEYWORDS_CATEGORIAS = {
    Comida: [
      'mercado', 'supermercado', 'atacadao', 'assai', 'carrefour', 'extra', 'pao', 'padaria',
      'restaurante', 'almoco', 'jantar', 'lanche', 'lanchonete', 'pizza', 'pizzaria',
      'hamburguer', 'burger', 'ifood', 'rappi', 'cafe', 'acougue', 'hortifruti',
      'feira', 'bebida', 'cerveja', 'churrasco', 'comida', 'grocery', 'groceries', 'dinner', 'lunch',
      'breakfast', 'food', 'cena', 'almuerzo', 'desayuno', 'panaderia', 'carniceria', 'empanada'
    ],
    Carro: [
      'gasolina', 'combustivel', 'etanol', 'alcool', 'diesel', 'gnv', 'posto',
      'estacionamento', 'pedagio', 'mecanico', 'oficina', 'oleo', 'pneu',
      'lava jato', 'lavagem', 'seguro auto', 'ipva', 'multa', 'bencina', 'nafta', 'combustible',
      'peaje', 'estacionamiento', 'taller', 'fuel', 'gas', 'gas station', 'parking', 'toll'
    ],
    Transporte: [
      'uber', '99', 'taxi', 'cabify', 'indriver', 'onibus', 'passagem', 'metro',
      'trem', 'voo', 'aviao', 'aereo', 'latam', 'gol', 'azul', 'balsa', 'ferry',
      'transfer', 'aeroporto', 'rodoviaria', 'flight', 'bus', 'train', 'subway', 'ticket',
      'colectivo', 'subte', 'avion', 'pasaje'
    ],
    Casa: [
      'aluguel', 'airbnb', 'hotel', 'pousada', 'hostel', 'hospedagem', 'diaria', 'condominio',
      'luz', 'energia', 'agua', 'internet', 'wifi', 'gas de cozinha', 'gas',
      'limpeza', 'faxina', 'reforma', 'ferramenta', 'moveis', 'eletro', 'rent', 'stay',
      'accommodation', 'electricity', 'water', 'alojamiento', 'cabana'
    ],
    Entretenimento: [
      'cinema', 'ingresso', 'show', 'teatro', 'museu', 'parque', 'passeio', 'tour',
      'bar', 'balada', 'festa', 'netflix', 'spotify', 'jogo', 'futebol', 'praia',
      'trilha', 'mirante', 'observatorio', 'geiser', 'salar', 'laguna', 'movie', 'park', 'party',
      'entrada', 'excursion'
    ],
    Vida: [
      'farmacia', 'remedio', 'medicamento', 'medico', 'consulta',
      'exame', 'dentista', 'hospital', 'academia', 'roupa', 'tenis', 'calcado',
      'presente', 'corte de cabelo', 'barbearia', 'salao', 'seguro viagem', 'pharmacy',
      'doctor', 'health', 'clothes', 'gift', 'salud', 'ropa', 'regalo'
    ]
  };

  function criarEstadoInicial() {
    const idPadrao = 'grp_' + Date.now();
    return {
      grupoAtivoId: idPadrao,
      grupos: [
        {
          id: idPadrao,
          nome: 'Geral / Viagem',
          pessoas: [],
          gastos: []
        }
      ]
    };
  }

  let appData = criarEstadoInicial();
  let usuarioAtual = null;
  let modoAuthAtual = 'login';

  // Captura link de convite (?grupo=ID_DO_GRUPO) caso exista na URL
  const urlParams = new URLSearchParams(window.location.search);
  const grupoUrlId = urlParams.get('grupo');

  // Estados temporários de UI
  let modoDivisaoAtual = 'igual';
  let categoriaSelecionada = '';
  let categoriaDefinidaManualmente = false;
  let cacheTaxasCambio = {};
  let filtroCategoriaAtual = 'todas';
  let painelTotaisAberto = false;
  let formGastoAberto = false;
  let historicoAberto = false;
  let ultimoStatusNuvem = { key: 'statusConnecting', vars: {} };
  const unsubscribersNuvem = {};

  // Referências do DOM
  const langSwitcher = document.getElementById('lang-switcher');
  const selectGrupo = document.getElementById('select-grupo');
  const btnRenomearGrupo = document.getElementById('btn-renomear-grupo');
  const btnNovoGrupo = document.getElementById('btn-novo-grupo');
  const btnExcluirGrupo = document.getElementById('btn-excluir-grupo');
  const btnCompartilharGrupo = document.getElementById('btn-compartilhar-grupo');
  const btnEntrarCodigo = document.getElementById('btn-entrar-codigo');
  const btnBalancoGlobal = document.getElementById('btn-balanco-global');
  const btnExportarJson = document.getElementById('btn-exportar-json');
  const inputImportarJson = document.getElementById('input-importar-json');
  const saveStatus = document.getElementById('save-status');
  const badgeCodigoGrupo = document.getElementById('badge-codigo-grupo');

  const formPessoa = document.getElementById('form-pessoa');
  const inputNomePessoa = document.getElementById('nome-pessoa');
  const listaPessoas = document.getElementById('lista-pessoas');

  const cardFormGasto = document.getElementById('card-form-gasto');
  const btnAbrirFormGasto = document.getElementById('btn-abrir-form-gasto');
  const btnFecharFormGasto = document.getElementById('btn-fechar-form-gasto');
  const containerFormGasto = document.getElementById('container-form-gasto');
  const tituloFormGasto = document.getElementById('titulo-form-gasto');
  const btnCancelarEdicao = document.getElementById('btn-cancelar-edicao');
  const inputEditGastoId = document.getElementById('edit-gasto-id');
  const formGasto = document.getElementById('form-gasto');
  const descGasto = document.getElementById('desc-gasto');
  const btnDataGasto = document.getElementById('btn-data-gasto');
  const labelDataGasto = document.getElementById('label-data-gasto');
  const inputDataGasto = document.getElementById('input-data-gasto');
  const categorySelector = document.getElementById('category-selector');
  const btnLimparCategoria = document.getElementById('btn-limpar-categoria');
  const autoCatBadge = document.getElementById('auto-cat-badge');
  const selectMoedaGasto = document.getElementById('moeda-gasto');
  const valorGasto = document.getElementById('valor-gasto');
  const selectPagador = document.getElementById('pagador-gasto');
  const boxCambio = document.getElementById('box-cambio');
  const exchangeRateLabel = document.getElementById('exchange-rate-label');
  const exchangeCurrCode = document.getElementById('exchange-curr-code');
  const btnBuscarCotacao = document.getElementById('btn-buscar-cotacao');
  const inputTaxaCambio = document.getElementById('taxa-cambio');
  const valorConvertidoBrl = document.getElementById('valor-convertido-brl');
  const cambioStatusMsg = document.getElementById('cambio-status-msg');
  const splitModeTabs = document.getElementById('split-mode-tabs');
  const areaDivisaoDinamica = document.getElementById('area-divisao-dinamica');
  const splitFeedback = document.getElementById('split-feedback');
  const btnTodos = document.getElementById('btn-todos');
  const btnSubmitGasto = document.getElementById('btn-submit-gasto');

  const resumoSaldos = document.getElementById('resumo-saldos');
  const listaAcertos = document.getElementById('lista-acertos');
  const btnToggleHistorico = document.getElementById('btn-toggle-historico');
  const containerHistorico = document.getElementById('container-historico');
  const filtroCategoriaSelect = document.getElementById('filtro-categoria');
  const btnToggleTotais = document.getElementById('btn-toggle-totais');
  const painelTotais = document.getElementById('painel-totais');
  const totaisFiltroInfo = document.getElementById('totais-filtro-info');
  const totaisConteudo = document.getElementById('totais-conteudo');
  const listaGastos = document.getElementById('lista-gastos');
  const totalGrupoBadge = document.getElementById('total-grupo-badge');

  // Modal Balanço Global
  const modalGlobal = document.getElementById('modal-global');
  const btnFecharGlobal = document.getElementById('btn-fechar-global');
  const btnOkGlobal = document.getElementById('btn-ok-global');
  const btnCopiarGlobal = document.getElementById('btn-copiar-global');
  const globalConteudo = document.getElementById('global-conteudo');

  // Modal Quitar Conta
  const btnAbrirQuitar = document.getElementById('btn-abrir-quitar');
  const modalQuitar = document.getElementById('modal-quitar');
  const btnFecharQuitar = document.getElementById('btn-fechar-quitar');
  const btnCancelarQuitar = document.getElementById('btn-cancelar-quitar');
  const formQuitar = document.getElementById('form-quitar');
  const selectQuitarDe = document.getElementById('quitar-de');
  const selectQuitarPara = document.getElementById('quitar-para');
  const inputQuitarValor = document.getElementById('quitar-valor');
  const inputQuitarObs = document.getElementById('quitar-obs');

  // Modal Relatório
  const btnRelatorio = document.getElementById('btn-relatorio');
  const modalRelatorio = document.getElementById('modal-relatorio');
  const btnFecharModal = document.getElementById('btn-fechar-modal');
  const relatorioTitulo = document.getElementById('relatorio-titulo');
  const relatorioConteudo = document.getElementById('relatorio-conteudo');
  const btnCopiarTexto = document.getElementById('btn-copiar-texto');
  const btnImprimir = document.getElementById('btn-imprimir');

  // --- MONITOR DE CONEXÃO OFFLINE / ONLINE ---
  function atualizarStatusNuvem(key, vars = {}) {
    ultimoStatusNuvem = { key, vars };
    if (!navigator.onLine) {
      saveStatus.textContent = '🟠 Offline (salvo no aparelho)';
      return;
    }
    saveStatus.textContent = t(key, vars);
  }

  window.addEventListener('online', () => {
    const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    atualizarStatusNuvem('statusSyncedAt', { time: hora });
  });

  window.addEventListener('offline', () => {
    saveStatus.textContent = '🟠 Offline (salvo no aparelho)';
  });

  // --- APLICAR IDIOMA ---
  function aplicarIdiomaNaUI() {
    document.documentElement.lang =
      idiomaAtual === 'pt' ? 'pt-BR' : idiomaAtual === 'es' ? 'es' : 'en';

    document.querySelectorAll('.lang-switcher').forEach((sw) => {
      sw.querySelectorAll('.lang-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.lang === idiomaAtual);
      });
    });

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n;
      if (key) el.textContent = t(key);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.dataset.i18nPlaceholder;
      if (key) el.placeholder = t(key);
    });

    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
      const key = el.dataset.i18nTitle;
      if (key) el.title = t(key);
    });

    if (inputEditGastoId.value) {
      tituloFormGasto.textContent = t('sec2TitleEdit');
      btnSubmitGasto.innerHTML = t('updateExpenseBtn');
    } else {
      tituloFormGasto.textContent = t('sec2TitleNew');
      btnSubmitGasto.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        ${t('saveExpenseBtn')}
      `;
    }

    atualizarStatusNuvem(ultimoStatusNuvem.key, ultimoStatusNuvem.vars);
    atualizarVisualDataGasto();
    atualizarBoxCambio();
    renderizarSeletorCategorias(!categoriaDefinidaManualmente && Boolean(categoriaSelecionada));
    inicializarFiltroCategorias();
    renderizarTudo();
  }

  if (langSwitcher) {
    langSwitcher.addEventListener('click', (e) => {
      const btn = e.target.closest('.lang-btn');
      if (!btn) return;
      const novoLang = btn.dataset.lang;
      if (!I18N[novoLang] || novoLang === idiomaAtual) return;
      idiomaAtual = novoLang;
      localStorage.setItem(LANG_STORAGE_KEY, idiomaAtual);
      aplicarIdiomaNaUI();
    });
  }

  // --- COPIAR CÓDIGO AO CLICAR NO BADGE ---
  if (badgeCodigoGrupo) {
    badgeCodigoGrupo.addEventListener('click', async () => {
      const grupo = getGrupoAtivo();
      try {
        await navigator.clipboard.writeText(grupo.id);
        badgeCodigoGrupo.textContent = t('codeCopiedBadge');
        setTimeout(() => {
          badgeCodigoGrupo.textContent = `ID: ${grupo.id}`;
        }, 1800);
      } catch (err) {
        prompt(t('copyCodeTitle'), grupo.id);
      }
    });
  }

  // --- CONTROLE DE EXPANSÃO (GASTO E HISTÓRICO) ---
  function setFormGastoVisivel(visivel) {
    formGastoAberto = visivel;
    containerFormGasto.classList.toggle('hidden', !visivel);
    btnAbrirFormGasto.classList.toggle('hidden', visivel);
  }

  btnAbrirFormGasto.addEventListener('click', () => {
    setFormGastoVisivel(true);
    descGasto.focus();
  });

  btnFecharFormGasto.addEventListener('click', () => {
    if (inputEditGastoId.value) {
      cancelarEdicaoGasto();
    }
    setFormGastoVisivel(false);
  });

  function setHistoricoVisivel(visivel) {
    historicoAberto = visivel;
    containerHistorico.classList.toggle('hidden', !visivel);
    atualizarBotaoHistorico();
  }

  function atualizarBotaoHistorico() {
    const grupo = getGrupoAtivo();
    const qtd = grupo.gastos.length;
    const itemsLabel = qtd === 1 ? t('entrySingular') : t('entryPlural');
    if (historicoAberto) {
      btnToggleHistorico.textContent = t('collapseHistoryBtn', { n: qtd, items: itemsLabel });
    } else {
      btnToggleHistorico.textContent = t('viewHistoryBtn', { n: qtd, items: itemsLabel });
    }
  }

  btnToggleHistorico.addEventListener('click', () => {
    setHistoricoVisivel(!historicoAberto);
  });

  // --- SELETOR OPCIONAL DE DATA ---
  function getDataHojeISO() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  function isoParaBR(isoStr) {
    if (!isoStr || !isoStr.includes('-')) return new Date().toLocaleDateString('pt-BR');
    const [ano, mes, dia] = isoStr.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  function brParaISO(brStr) {
    if (!brStr || !brStr.includes('/')) return getDataHojeISO();
    const partes = brStr.split('/');
    if (partes.length !== 3) return getDataHojeISO();
    return `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
  }

  function atualizarVisualDataGasto() {
    const hojeIso = getDataHojeISO();
    const valIso = inputDataGasto.value || hojeIso;
    if (valIso === hojeIso) {
      labelDataGasto.textContent = t('todayLabel');
      btnDataGasto.classList.remove('custom-date');
    } else {
      labelDataGasto.textContent = isoParaBR(valIso);
      btnDataGasto.classList.add('custom-date');
    }
  }

  function resetarDataGasto() {
    inputDataGasto.value = getDataHojeISO();
    atualizarVisualDataGasto();
  }

  btnDataGasto.addEventListener('click', () => {
    if (typeof inputDataGasto.showPicker === 'function') {
      inputDataGasto.showPicker();
    } else {
      inputDataGasto.focus();
      inputDataGasto.click();
    }
  });

  inputDataGasto.addEventListener('change', atualizarVisualDataGasto);

  function getGrupoAtivo() {
    let grupo = appData.grupos.find((g) => g.id === appData.grupoAtivoId);
    if (!grupo) {
      grupo = appData.grupos[0];
      appData.grupoAtivoId = grupo.id;
    }
    return grupo;
  }

  function getChaveCacheUsuario() {
    return usuarioAtual ? `${BASE_STORAGE_KEY}_${usuarioAtual.uid}` : null;
  }

  function salvarCacheLocal() {
    const chave = getChaveCacheUsuario();
    if (!chave) return;
    try {
      localStorage.setItem(chave, JSON.stringify(appData));
    } catch (err) {
      console.error('Erro ao salvar cache local:', err);
    }
  }

  function carregarCacheLocalUsuario(uid) {
    try {
      const salvo = localStorage.getItem(`${BASE_STORAGE_KEY}_${uid}`);
      if (salvo) {
        const parsed = JSON.parse(salvo);
        if (parsed && Array.isArray(parsed.grupos) && parsed.grupos.length > 0) {
          return parsed;
        }
      }
    } catch (_) {}
    return null;
  }

  // --- SINCRONIZAÇÃO EM TEMPO REAL COM O FIRESTORE ---
  function conectarGrupoNuvem(grupoId) {
    if (!usuarioAtual || unsubscribersNuvem[grupoId]) return;

    const docRef = doc(db, 'grupos', grupoId);
    unsubscribersNuvem[grupoId] = onSnapshot(
      docRef,
      async (snapshot) => {
        if (!usuarioAtual) return;

        if (snapshot.exists()) {
          const dadosRemotos = snapshot.data();
          const idx = appData.grupos.findIndex((g) => g.id === grupoId);
          if (idx !== -1) {
            appData.grupos[idx] = {
              id: grupoId,
              nome: dadosRemotos.nome || 'Grupo Sem Nome',
              pessoas: Array.isArray(dadosRemotos.pessoas) ? dadosRemotos.pessoas : [],
              gastos: Array.isArray(dadosRemotos.gastos) ? dadosRemotos.gastos : []
            };
          } else {
            appData.grupos.push({
              id: grupoId,
              nome: dadosRemotos.nome || 'Grupo Compartilhado',
              pessoas: Array.isArray(dadosRemotos.pessoas) ? dadosRemotos.pessoas : [],
              gastos: Array.isArray(dadosRemotos.gastos) ? dadosRemotos.gastos : []
            });
          }

          salvarCacheLocal();
          const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          atualizarStatusNuvem('statusSyncedAt', { time: hora });
          renderizarTudo();
        } else {
          const localGrp = appData.grupos.find((g) => g.id === grupoId);
          if (localGrp && localGrp.nome !== 'Carregando grupo...') {
            await enviarGrupoParaNuvem(localGrp);
          } else if (localGrp && localGrp.nome === 'Carregando grupo...' && navigator.onLine) {
            alert(t('groupNotFoundAlert'));
            appData.grupos = appData.grupos.filter((g) => g.id !== grupoId);
            if (appData.grupos.length === 0) appData = criarEstadoInicial();
            appData.grupoAtivoId = appData.grupos[0].id;
            salvarCacheLocal();
            sincronizarListaGruposUsuario();
            renderizarTudo();
          }
        }
      },
      (error) => {
        console.error('Erro na sincronização:', error);
        atualizarStatusNuvem('statusOffline');
      }
    );
  }

  function conectarTodosGruposNuvem() {
    appData.grupos.forEach((g) => conectarGrupoNuvem(g.id));
  }

  async function enviarGrupoParaNuvem(grupo) {
    if (!usuarioAtual) return;
    salvarCacheLocal();
    renderizarTudo();
    atualizarStatusNuvem('statusSaving');

    try {
      const docRef = doc(db, 'grupos', grupo.id);
      await setDoc(docRef, {
        nome: grupo.nome,
        pessoas: grupo.pessoas,
        gastos: grupo.gastos,
        atualizadoEm: new Date().toISOString()
      });
      const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      atualizarStatusNuvem('statusSyncedAt', { time: hora });
    } catch (err) {
      console.error('Erro ao enviar para Firestore:', err);
      atualizarStatusNuvem('statusSaveError');
    }
  }

  function salvarDados() {
    const grupo = getGrupoAtivo();
    enviarGrupoParaNuvem(grupo);
    sincronizarListaGruposUsuario();
  }

  // --- COMPARTILHAR LINK E ENTRAR COM CÓDIGO ---
  btnCompartilharGrupo.addEventListener('click', async () => {
    const grupo = getGrupoAtivo();
    await enviarGrupoParaNuvem(grupo);
    await sincronizarListaGruposUsuario();

    const baseUrl = window.location.origin + window.location.pathname;
    const linkConvite = `${baseUrl}?grupo=${encodeURIComponent(grupo.id)}`;
    const mensagem = t('inviteMsg', { name: grupo.nome, link: linkConvite, id: grupo.id });

    try {
      await navigator.clipboard.writeText(mensagem);
      alert(t('inviteCopiedAlert', { link: linkConvite }));
    } catch (err) {
      prompt(t('inviteLinkBtn'), linkConvite);
    }
  });

  btnEntrarCodigo.addEventListener('click', () => {
    const entrada = prompt(t('enterCodePrompt'));
    if (!entrada || !entrada.trim()) return;

    let codigo = entrada.trim();
    if (codigo.includes('grupo=')) {
      try {
        const u = new URL(codigo);
        codigo = u.searchParams.get('grupo') || codigo;
      } catch (_) {
        codigo = codigo.split('grupo=')[1].split('&')[0];
      }
    }

    if (!appData.grupos.some((g) => g.id === codigo)) {
      appData.grupos.push({
        id: codigo,
        nome: 'Carregando grupo...',
        pessoas: [],
        gastos: []
      });
    }

    appData.grupoAtivoId = codigo;
    salvarCacheLocal();
    conectarGrupoNuvem(codigo);
    sincronizarListaGruposUsuario();
    renderizarTudo();
  });

  function getCategoriaObj(catId) {
    return CATEGORIAS.find((c) => c.id === catId) || null;
  }

  function obterCotasEmReais(gasto) {
    if (gasto.divisao && typeof gasto.divisao === 'object') {
      return gasto.divisao;
    }
    const mapa = {};
    if (Array.isArray(gasto.participantes) && gasto.participantes.length > 0) {
      const cota = gasto.valor / gasto.participantes.length;
      gasto.participantes.forEach((p) => {
        mapa[p] = cota;
      });
    }
    return mapa;
  }

  function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  // --- MULTI-MOEDA E CÂMBIO ---
  function formatarMoedaEstrangeira(valor, moeda) {
    if (!moeda || moeda === 'BRL') return formatarMoeda(valor);
    try {
      return valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: moeda,
        maximumFractionDigits: moeda === 'CLP' || moeda === 'ARS' ? 0 : 2
      });
    } catch (_) {
      return `${moeda} ${valor.toFixed(2)}`;
    }
  }

  function getValorGastoEmBRL() {
    const valorInformado = parseFloat(valorGasto.value) || 0;
    const moeda = selectMoedaGasto.value || 'BRL';
    if (moeda === 'BRL') return valorInformado;
    const taxa = parseFloat(inputTaxaCambio.value) || 0;
    return valorInformado * taxa;
  }

  function atualizarBoxCambio() {
    const moeda = selectMoedaGasto.value || 'BRL';
    if (moeda === 'BRL') {
      boxCambio.classList.add('hidden');
      return;
    }

    boxCambio.classList.remove('hidden');
    exchangeRateLabel.textContent = t('exchangeTitle', { curr: moeda });
    exchangeCurrCode.textContent = moeda;

    const totalBrl = getValorGastoEmBRL();
    valorConvertidoBrl.textContent = formatarMoeda(totalBrl);
  }

  async function buscarCotacaoOnline(moeda, forcar = false) {
    if (!moeda || moeda === 'BRL') return;

    if (!forcar && cacheTaxasCambio[moeda]) {
      inputTaxaCambio.value = cacheTaxasCambio[moeda];
      cambioStatusMsg.textContent = t('rateFetchedMsg', { curr: moeda });
      atualizarBoxCambio();
      atualizarFeedbackDivisao();
      return;
    }

    cambioStatusMsg.textContent = t('fetchingRateMsg');
    try {
      const resp = await fetch(`https://economia.awesomeapi.com.br/last/${moeda}-BRL`);
      if (resp.ok) {
        const data = await resp.json();
        const key = `${moeda}BRL`;
        if (data[key] && data[key].bid) {
          const taxa = parseFloat(data[key].bid);
          cacheTaxasCambio[moeda] = taxa;
          inputTaxaCambio.value = taxa;
          cambioStatusMsg.textContent = t('rateFetchedMsg', { curr: moeda });
          atualizarBoxCambio();
          atualizarFeedbackDivisao();
          return;
        }
      }
      throw new Error('AwesomeAPI sem par');
    } catch (_) {
      try {
        const resp2 = await fetch(`https://open.er-api.com/v6/latest/${moeda}`);
        const data2 = await resp2.json();
        if (data2 && data2.rates && data2.rates.BRL) {
          const taxa = parseFloat(data2.rates.BRL);
          cacheTaxasCambio[moeda] = taxa;
          inputTaxaCambio.value = taxa;
          cambioStatusMsg.textContent = t('rateFetchedMsg', { curr: moeda });
          atualizarBoxCambio();
          atualizarFeedbackDivisao();
          return;
        }
      } catch (err2) {
        console.warn('Falha ao buscar câmbio:', err2);
      }
      cambioStatusMsg.textContent = t('rateErrorMsg');
    }
  }

  selectMoedaGasto.addEventListener('change', () => {
    const moeda = selectMoedaGasto.value;
    atualizarBoxCambio();
    if (moeda !== 'BRL') {
      buscarCotacaoOnline(moeda, false);
    }
    atualizarFeedbackDivisao();
  });

  btnBuscarCotacao.addEventListener('click', () => {
    buscarCotacaoOnline(selectMoedaGasto.value, true);
  });

  inputTaxaCambio.addEventListener('input', () => {
    atualizarBoxCambio();
    atualizarFeedbackDivisao();
  });

  // --- DETECÇÃO AUTOMÁTICA DE CATEGORIA ---
  function normalizarTexto(str) {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function detectarCategoriaPorTexto(texto) {
    const limpo = normalizarTexto(texto.trim());
    if (limpo.length < 3) return '';

    for (const [catId, palavras] of Object.entries(KEYWORDS_CATEGORIAS)) {
      for (const kw of palavras) {
        const kwNorm = normalizarTexto(kw);
        const regex = new RegExp(`(^|\\b|\\s)${kwNorm}`, 'i');
        if (regex.test(limpo)) {
          return catId;
        }
      }
    }
    return '';
  }

  descGasto.addEventListener('input', () => {
    if (categoriaDefinidaManualmente) return;
    const detectada = detectarCategoriaPorTexto(descGasto.value);
    if (detectada !== categoriaSelecionada) {
      categoriaSelecionada = detectada;
      renderizarSeletorCategorias(Boolean(detectada));
    }
  });

  // --- LEMBRAR ÚLTIMO PAGADOR POR GRUPO ---
  function salvarUltimoPagador(grupoId, pagador) {
    try {
      const mapa = JSON.parse(localStorage.getItem(LAST_PAYER_STORAGE_KEY) || '{}');
      mapa[grupoId] = pagador;
      localStorage.setItem(LAST_PAYER_STORAGE_KEY, JSON.stringify(mapa));
    } catch (_) {}
  }

  function obterUltimoPagador(grupoId) {
    try {
      const mapa = JSON.parse(localStorage.getItem(LAST_PAYER_STORAGE_KEY) || '{}');
      return mapa[grupoId] || '';
    } catch (_) {
      return '';
    }
  }

  // --- BALANÇO GLOBAL ---
  let textoGlobalWhatsApp = '';

  function calcularBalancoGlobal() {
    const mapaPessoas = {};

    function garantirPessoa(nomeOriginal) {
      const chave = nomeOriginal.trim().toLowerCase();
      if (!mapaPessoas[chave]) {
        mapaPessoas[chave] = {
          nome: nomeOriginal.trim(),
          saldoTotal: 0,
          detalhes: []
        };
      }
      return mapaPessoas[chave];
    }

    appData.grupos.forEach((grupo) => {
      const { saldos } = calcularAcertos(grupo);
      for (const [pessoa, saldoGrupo] of Object.entries(saldos)) {
        const reg = garantirPessoa(pessoa);
        reg.saldoTotal += saldoGrupo;
        if (Math.abs(saldoGrupo) >= 0.01) {
          reg.detalhes.push({
            grupoNome: grupo.nome,
            valor: saldoGrupo
          });
        }
      }
    });

    const devedores = [];
    const credores = [];

    Object.values(mapaPessoas).forEach((p) => {
      if (p.saldoTotal < -0.01) {
        devedores.push({ pessoa: p.nome, valor: -p.saldoTotal });
      } else if (p.saldoTotal > 0.01) {
        credores.push({ pessoa: p.nome, valor: p.saldoTotal });
      }
    });

    devedores.sort((a, b) => b.valor - a.valor);
    credores.sort((a, b) => b.valor - a.valor);

    const transacoesGlobais = [];
    let i = 0;
    let j = 0;

    while (i < devedores.length && j < credores.length) {
      const dev = devedores[i];
      const cred = credores[j];
      const val = Math.min(dev.valor, cred.valor);

      transacoesGlobais.push({
        de: dev.pessoa,
        para: cred.pessoa,
        valor: val
      });

      dev.valor -= val;
      cred.valor -= val;

      if (dev.valor < 0.01) i++;
      if (cred.valor < 0.01) j++;
    }

    return {
      pessoasList: Object.values(mapaPessoas),
      transacoesGlobais
    };
  }

  btnBalancoGlobal.addEventListener('click', () => {
    const { pessoasList, transacoesGlobais } = calcularBalancoGlobal();

    let html = `
      <div class="rel-section">
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 12px;">
          ${t('globalSummaryIntro', { n: appData.grupos.length })}
        </p>

        <h3>${t('globalSec1Title')}</h3>
        ${
          transacoesGlobais.length === 0
            ? `<p class="positivo"><strong>${t('globalAllSettled')}</strong></p>`
            : `<ul class="acertos-list" style="margin-top: 8px;">${transacoesGlobais
                .map(
                  (tItem) =>
                    `<li style="margin-bottom: 6px;"><span><strong>${tItem.de}</strong> ${t('owesText')} <strong>${formatarMoeda(tItem.valor)}</strong> ${t('toText')} <strong>${tItem.para}</strong></span></li>`
                )
                .join('')}</ul>`
        }
      </div>

      <div class="rel-section" style="margin-bottom: 0;">
        <h3>${t('globalSec2Title')}</h3>
        ${
          pessoasList.length === 0
            ? `<p class="empty-state-text">${t('noParticipantsGroup')}</p>`
            : `<table class="rel-table">
                <thead>
                  <tr>
                    <th>${t('thParticipant')}</th>
                    <th>${t('thGroupOrigin')}</th>
                    <th>${t('thGlobalBalance')}</th>
                  </tr>
                </thead>
                <tbody>
                  ${pessoasList
                    .map((p) => {
                      const cls =
                        p.saldoTotal > 0.01
                          ? 'positivo'
                          : p.saldoTotal < -0.01
                          ? 'negativo'
                          : 'neutro';
                      const sinal = p.saldoTotal > 0.01 ? '+' : '';
                      const origemHtml =
                        p.detalhes.length === 0
                          ? `<small style="color:#64748b">${t('zeroedInAll')}</small>`
                          : p.detalhes
                              .map((d) => {
                                const dCls = d.valor > 0 ? 'positivo' : 'negativo';
                                const dSinal = d.valor > 0 ? '+' : '';
                                return `<div style="font-size:0.78rem;">${d.grupoNome}: <span class="${dCls}"><strong>${dSinal}${formatarMoeda(d.valor)}</strong></span></div>`;
                              })
                              .join('');

                      return `
                        <tr>
                          <td><strong>${p.nome}</strong></td>
                          <td>${origemHtml}</td>
                          <td class="${cls}"><strong>${sinal}${formatarMoeda(p.saldoTotal)}</strong></td>
                        </tr>
                      `;
                    })
                    .join('')}
                </tbody>
              </table>`
        }
      </div>
    `;

    globalConteudo.innerHTML = html;

    let txt = `${t('wppGlobalHeader')}\n`;
    txt += `${t('wppGlobalGroups')} ${appData.grupos.map((g) => g.nome).join(', ')}\n\n`;
    txt += `${t('wppGlobalFinalHeader')}\n`;
    if (transacoesGlobais.length === 0) {
      txt += `${t('wppGlobalAllSettled')}\n`;
    } else {
      transacoesGlobais.forEach((tr) => {
        txt += `${t('wppPaysLine', { from: tr.de, val: formatarMoeda(tr.valor), to: tr.para })}\n`;
      });
    }

    txt += `\n${t('wppGlobalPersonHeader')}\n`;
    pessoasList.forEach((p) => {
      const sinal = p.saldoTotal > 0.01 ? '+' : '';
      txt += `• ${p.nome}: *${sinal}${formatarMoeda(p.saldoTotal)}*\n`;
    });

    textoGlobalWhatsApp = txt;
    modalGlobal.classList.remove('hidden');
  });

  btnFecharGlobal.addEventListener('click', () => modalGlobal.classList.add('hidden'));
  btnOkGlobal.addEventListener('click', () => modalGlobal.classList.add('hidden'));
  modalGlobal.addEventListener('click', (e) => {
    if (e.target === modalGlobal) modalGlobal.classList.add('hidden');
  });

  btnCopiarGlobal.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(textoGlobalWhatsApp);
      btnCopiarGlobal.textContent = t('copiedBtn');
      setTimeout(() => (btnCopiarGlobal.textContent = t('copyWhatsAppBtn')), 2000);
    } catch (err) {
      alert('Error copying.');
    }
  });

  // --- CATEGORIAS UI E PAINEL DE TOTAIS ---
  function renderizarSeletorCategorias(isAuto = false) {
    categorySelector.innerHTML = CATEGORIAS.map((cat) => {
      const isSelected = categoriaSelecionada === cat.id;
      return `
        <button type="button" class="cat-btn ${isSelected ? 'active' : ''}" data-cat="${cat.id}">
          ${cat.svg}
          <span>${getNomeCategoriaTraduzido(cat.id)}</span>
        </button>
      `;
    }).join('');

    btnLimparCategoria.classList.toggle('hidden', !categoriaSelecionada);
    if (autoCatBadge) {
      autoCatBadge.classList.toggle('hidden', !(categoriaSelecionada && isAuto));
    }
  }

  categorySelector.addEventListener('click', (e) => {
    const btn = e.target.closest('.cat-btn');
    if (!btn) return;
    const catId = btn.dataset.cat;
    categoriaSelecionada = categoriaSelecionada === catId ? '' : catId;
    categoriaDefinidaManualmente = Boolean(categoriaSelecionada);
    renderizarSeletorCategorias(false);
  });

  btnLimparCategoria.addEventListener('click', () => {
    categoriaSelecionada = '';
    categoriaDefinidaManualmente = false;
    renderizarSeletorCategorias(false);
  });

  function inicializarFiltroCategorias() {
    const opcoes = [
      `<option value="todas">${t('filterAllCategories')}</option>`,
      ...CATEGORIAS.map((c) => `<option value="${c.id}">${getNomeCategoriaTraduzido(c.id)}</option>`),
      `<option value="sem_categoria">${t('catNoCategory')}</option>`,
      `<option value="acertos">${t('filterOnlySettlements')}</option>`
    ];
    filtroCategoriaSelect.innerHTML = opcoes.join('');
    filtroCategoriaSelect.value = filtroCategoriaAtual;
  }

  filtroCategoriaSelect.addEventListener('change', (e) => {
    filtroCategoriaAtual = e.target.value;
    renderizarHistorico();
    if (painelTotaisAberto) {
      renderizarPainelTotais();
    }
  });

  btnToggleTotais.addEventListener('click', () => {
    painelTotaisAberto = !painelTotaisAberto;
    painelTotais.classList.toggle('hidden', !painelTotaisAberto);
    btnToggleTotais.classList.toggle('active', painelTotaisAberto);
    if (painelTotaisAberto) {
      renderizarPainelTotais();
    }
  });

  function renderizarPainelTotais() {
    const grupo = getGrupoAtivo();
    const despesas = grupo.gastos.filter((g) => g.tipo !== 'pagamento');

    if (despesas.length === 0) {
      totaisFiltroInfo.textContent = '';
      totaisConteudo.innerHTML =
        `<span class="empty-state-text">${t('noExpensesToTotal')}</span>`;
      return;
    }

    let totalGeral = 0;
    let totalDoFiltro = 0;
    const porCategoria = {};
    const porMes = {};

    const nomesMeses = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];

    despesas.forEach((g) => {
      totalGeral += g.valor;

      const passaFiltro =
        filtroCategoriaAtual === 'todas' ||
        (filtroCategoriaAtual === 'sem_categoria' && !g.categoria) ||
        g.categoria === filtroCategoriaAtual;

      if (passaFiltro) {
        totalDoFiltro += g.valor;
      }

      const catKey = g.categoria || 'Sem categoria';
      porCategoria[catKey] = (porCategoria[catKey] || 0) + g.valor;

      let chaveMes = 'NO_DATE';
      if (g.data && g.data.includes('/')) {
        const partes = g.data.split('/');
        if (partes.length === 3) {
          const mesIdx = parseInt(partes[1], 10) - 1;
          const ano = partes[2];
          const nomeMes = nomesMeses[mesIdx] || partes[1];
          chaveMes = `${ano}-${partes[1].padStart(2, '0')}|${nomeMes}/${ano}`;
        }
      }
      porMes[chaveMes] = (porMes[chaveMes] || 0) + g.valor;
    });

    const mostrandoFiltroEspecifico =
      filtroCategoriaAtual !== 'todas' && filtroCategoriaAtual !== 'acertos';

    totaisFiltroInfo.textContent = mostrandoFiltroEspecifico
      ? `${t('filterPrefix')} ${filtroCategoriaAtual === 'sem_categoria' ? t('catNoCategory') : getNomeCategoriaTraduzido(filtroCategoriaAtual)}`
      : t('allExpensesLabel');

    let html = `
      <div class="totais-resumo-cards">
        <div class="total-mini-card">
          <small>${t('groupTotalCard')}</small>
          <strong>${formatarMoeda(totalGeral)}</strong>
        </div>
        <div class="total-mini-card">
          <small>${mostrandoFiltroEspecifico ? t('activeFilterTotalCard') : t('avgExpenseCard')}</small>
          <strong>${formatarMoeda(mostrandoFiltroEspecifico ? totalDoFiltro : totalGeral / despesas.length)}</strong>
        </div>
      </div>
    `;

    const catsOrdenadas = Object.entries(porCategoria).sort((a, b) => b[1] - a[1]);
    html += `
      <div class="totais-bloco">
        <h4>${t('byCategoryHeading')}</h4>
        <div class="totais-lista">
          ${catsOrdenadas
            .map(([catKey, val]) => {
              const pct = totalGeral > 0 ? ((val / totalGeral) * 100).toFixed(1) : 0;
              const catObj = getCategoriaObj(catKey);
              const icone = catObj ? catObj.svg : '';
              const nomeExibido = getNomeCategoriaTraduzido(catKey);
              return `
                <div class="total-row-item">
                  <div class="total-row-top">
                    <span class="total-row-label">${icone}${nomeExibido}</span>
                    <span><strong>${formatarMoeda(val)}</strong> <small style="color:var(--text-muted)">(${pct}%)</small></span>
                  </div>
                  <div class="progress-track">
                    <div class="progress-fill" style="width: ${pct}%"></div>
                  </div>
                </div>
              `;
            })
            .join('')}
        </div>
      </div>
    `;

    const mesesOrdenados = Object.entries(porMes).sort((a, b) => b[0].localeCompare(a[0]));
    html += `
      <div class="totais-bloco">
        <h4>${t('byMonthHeading')}</h4>
        <div class="totais-lista">
          ${mesesOrdenados
            .map(([chave, val]) => {
              const labelMes =
                chave === 'NO_DATE'
                  ? t('noDateLabel')
                  : chave.includes('|')
                  ? chave.split('|')[1]
                  : chave;
              const pct = totalGeral > 0 ? ((val / totalGeral) * 100).toFixed(1) : 0;
              return `
                <div class="total-row-item">
                  <div class="total-row-top">
                    <span class="total-row-label">📅 ${labelMes}</span>
                    <span><strong>${formatarMoeda(val)}</strong> <small style="color:var(--text-muted)">(${pct}%)</small></span>
                  </div>
                  <div class="progress-track">
                    <div class="progress-fill" style="width: ${pct}%"></div>
                  </div>
                </div>
              `;
            })
            .join('')}
        </div>
      </div>
    `;

    totaisConteudo.innerHTML = html;
  }

  // --- GERENCIAMENTO DE GRUPOS ---
  selectGrupo.addEventListener('change', (e) => {
    cancelarEdicaoGasto();
    filtroCategoriaAtual = 'todas';
    filtroCategoriaSelect.value = 'todas';
    appData.grupoAtivoId = e.target.value;
    salvarCacheLocal();
    sincronizarListaGruposUsuario();
    renderizarTudo();
  });

  btnRenomearGrupo.addEventListener('click', () => {
    const grupo = getGrupoAtivo();
    const novoNome = prompt(t('renameGroupPrompt'), grupo.nome);
    if (!novoNome || !novoNome.trim()) return;
    grupo.nome = novoNome.trim();
    salvarDados();
  });

  btnNovoGrupo.addEventListener('click', () => {
    const nome = prompt(t('newGroupPrompt'));
    if (!nome || !nome.trim()) return;

    cancelarEdicaoGasto();
    filtroCategoriaAtual = 'todas';
    filtroCategoriaSelect.value = 'todas';
    const novoId = 'grp_' + Date.now();
    const novoGrupo = {
      id: novoId,
      nome: nome.trim(),
      pessoas: [],
      gastos: []
    };

    appData.grupos.push(novoGrupo);
    appData.grupoAtivoId = novoId;
    conectarGrupoNuvem(novoId);
    salvarDados();
  });

  btnExcluirGrupo.addEventListener('click', async () => {
    const grupo = getGrupoAtivo();
    cancelarEdicaoGasto();

    const acao = prompt(t('deleteGroupPrompt', { name: grupo.nome }));

    if (acao === '1') {
      if (unsubscribersNuvem[grupo.id]) {
        unsubscribersNuvem[grupo.id]();
        delete unsubscribersNuvem[grupo.id];
      }
      appData.grupos = appData.grupos.filter((g) => g.id !== grupo.id);
      if (appData.grupos.length === 0) {
        appData = criarEstadoInicial();
        conectarTodosGruposNuvem();
      }
      appData.grupoAtivoId = appData.grupos[0].id;
      salvarCacheLocal();
      sincronizarListaGruposUsuario();
      renderizarTudo();
    } else if (acao === '2') {
      if (confirm(t('deleteGroupConfirm', { name: grupo.nome }))) {
        try {
          await deleteDoc(doc(db, 'grupos', grupo.id));
        } catch (err) {
          console.error('Erro ao deletar documento:', err);
        }
        if (unsubscribersNuvem[grupo.id]) {
          unsubscribersNuvem[grupo.id]();
          delete unsubscribersNuvem[grupo.id];
        }
        appData.grupos = appData.grupos.filter((g) => g.id !== grupo.id);
        if (appData.grupos.length === 0) {
          appData = criarEstadoInicial();
          conectarTodosGruposNuvem();
        }
        appData.grupoAtivoId = appData.grupos[0].id;
        salvarCacheLocal();
        sincronizarListaGruposUsuario();
        renderizarTudo();
      }
    }
  });

  // --- BACKUP E IMPORTAÇÃO ---
  btnExportarJson.addEventListener('click', () => {
    const dataStr = JSON.stringify(appData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const dataHoje = new Date().toISOString().slice(0, 10);
    const a = document.createElement('a');
    a.href = url;
    a.download = `raodev-split-backup-${dataHoje}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  inputImportarJson.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importado = JSON.parse(event.target.result);
        if (importado && Array.isArray(importado.grupos) && importado.grupos.length > 0) {
          cancelarEdicaoGasto();

          const nomesImportados = importado.grupos.map((g) => `"${g.nome}"`).join(', ');
          const adicionarAosAtuais = confirm(
            `JSON: ${importado.grupos.length} (${nomesImportados}).\n\nOK = Add to current & sync to cloud.\nCANCEL = Replace list.`
          );

          if (adicionarAosAtuais) {
            for (let idx = 0; idx < importado.grupos.length; idx++) {
              const g = importado.grupos[idx];
              const novoId = 'grp_' + Date.now() + '_' + idx;
              const novoObj = { ...g, id: novoId };
              appData.grupos.push(novoObj);
              appData.grupoAtivoId = novoId;
              await enviarGrupoParaNuvem(novoObj);
              conectarGrupoNuvem(novoId);
            }
          } else {
            appData = importado;
            salvarCacheLocal();
            for (const g of appData.grupos) {
              await enviarGrupoParaNuvem(g);
              conectarGrupoNuvem(g.id);
            }
          }
          sincronizarListaGruposUsuario();
        } else {
          alert('Invalid JSON file.');
        }
      } catch (err) {
        alert('Error reading JSON.');
      }
      inputImportarJson.value = '';
    };
    reader.readAsText(file);
  });

  // --- PARTICIPANTES ---
  formPessoa.addEventListener('submit', (e) => {
    e.preventDefault();
    const grupo = getGrupoAtivo();
    const nome = inputNomePessoa.value.trim();
    if (!nome) return;

    if (grupo.pessoas.some((p) => p.toLowerCase() === nome.toLowerCase())) {
      alert(t('personExistsAlert'));
      inputNomePessoa.select();
      return;
    }

    grupo.pessoas.push(nome);
    inputNomePessoa.value = '';
    inputNomePessoa.focus();
    salvarDados();
  });

  listaPessoas.addEventListener('click', (e) => {
    const btn = e.target.closest('.tag-remove');
    if (!btn) return;

    const grupo = getGrupoAtivo();
    const nome = btn.dataset.nome;
    const emUso = grupo.gastos.some((g) => {
      const cotas = obterCotasEmReais(g);
      return g.pagador === nome || g.participantes.includes(nome) || (cotas[nome] && cotas[nome] > 0);
    });

    if (emUso) {
      alert(t('personInUseAlert', { name: nome }));
      return;
    }

    grupo.pessoas = grupo.pessoas.filter((p) => p !== nome);
    salvarDados();
  });

  // --- INTERFACE DE DIVISÃO DINÂMICA ---
  function renderizarControlesDivisao(valoresPrePreenchidos = null) {
    const grupo = getGrupoAtivo();

    splitModeTabs.querySelectorAll('.mode-tab').forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.mode === modoDivisaoAtual);
    });

    btnTodos.classList.toggle('hidden', modoDivisaoAtual !== 'igual');

    if (grupo.pessoas.length === 0) {
      areaDivisaoDinamica.innerHTML =
        `<span class="empty-state-text">${t('addPeopleStep1Hint')}</span>`;
      splitFeedback.classList.add('hidden');
      return;
    }

    if (modoDivisaoAtual === 'igual') {
      areaDivisaoDinamica.innerHTML = `
        <div class="pills-wrap">
          ${grupo.pessoas
            .map((p) => {
              const checked = valoresPrePreenchidos
                ? valoresPrePreenchidos.includes(p)
                : true;
              return `
                <label class="person-pill">
                  <input type="checkbox" value="${p}" ${checked ? 'checked' : ''}>
                  <span>✓ ${p}</span>
                </label>
              `;
            })
            .join('')}
        </div>
      `;
    } else if (modoDivisaoAtual === 'exato') {
      areaDivisaoDinamica.innerHTML = `
        <div class="custom-split-list">
          ${grupo.pessoas
            .map((p) => {
              const val =
                valoresPrePreenchidos && valoresPrePreenchidos[p] !== undefined
                  ? Number(valoresPrePreenchidos[p]).toFixed(2)
                  : '';
              return `
                <div class="custom-split-row">
                  <span class="custom-split-name">${p}</span>
                  <div class="custom-split-input-group">
                    <span>R$</span>
                    <input type="number" class="input-split-exato" data-pessoa="${p}" step="0.01" min="0" placeholder="0,00" value="${val}">
                  </div>
                </div>
              `;
            })
            .join('')}
        </div>
      `;
    } else if (modoDivisaoAtual === 'cotas') {
      areaDivisaoDinamica.innerHTML = `
        <div class="custom-split-list">
          ${grupo.pessoas
            .map((p) => {
              const cota =
                valoresPrePreenchidos && valoresPrePreenchidos[p] !== undefined
                  ? valoresPrePreenchidos[p]
                  : 1;
              return `
                <div class="custom-split-row">
                  <span class="custom-split-name">${p}</span>
                  <div class="custom-split-input-group">
                    <span>${t('sharesLabel')}</span>
                    <input type="number" class="input-split-cota" data-pessoa="${p}" step="0.5" min="0" value="${cota}">
                  </div>
                </div>
              `;
            })
            .join('')}
        </div>
      `;
    }

    atualizarFeedbackDivisao();
  }

  function atualizarFeedbackDivisao() {
    const grupo = getGrupoAtivo();
    if (grupo.pessoas.length === 0) {
      splitFeedback.classList.add('hidden');
      return;
    }

    const totalNota = getValorGastoEmBRL();

    if (modoDivisaoAtual === 'igual') {
      const marcados = areaDivisaoDinamica.querySelectorAll('input[type="checkbox"]:checked').length;
      if (marcados === 0) {
        splitFeedback.className = 'split-feedback err';
        splitFeedback.textContent = t('selectAtLeastOne');
      } else if (totalNota > 0) {
        splitFeedback.className = 'split-feedback ok';
        splitFeedback.textContent = t('perPersonFeedback', {
          val: formatarMoeda(totalNota / marcados),
          n: marcados
        });
      } else {
        splitFeedback.classList.add('hidden');
        return;
      }
      splitFeedback.classList.remove('hidden');
    } else if (modoDivisaoAtual === 'exato') {
      let soma = 0;
      areaDivisaoDinamica.querySelectorAll('.input-split-exato').forEach((inp) => {
        soma += parseFloat(inp.value) || 0;
      });

      const diff = totalNota - soma;
      splitFeedback.classList.remove('hidden');

      if (totalNota <= 0) {
        splitFeedback.className = 'split-feedback warn';
        splitFeedback.textContent = t('typedSumFeedback', { val: formatarMoeda(soma) });
      } else if (Math.abs(diff) < 0.01) {
        splitFeedback.className = 'split-feedback ok';
        splitFeedback.textContent = t('exactMatchFeedback', { val: formatarMoeda(totalNota) });
      } else if (diff > 0) {
        splitFeedback.className = 'split-feedback warn';
        splitFeedback.textContent = t('missingAmountFeedback', {
          diff: formatarMoeda(diff),
          sum: formatarMoeda(soma)
        });
      } else {
        splitFeedback.className = 'split-feedback err';
        splitFeedback.textContent = t('exceededAmountFeedback', {
          diff: formatarMoeda(Math.abs(diff))
        });
      }
    } else if (modoDivisaoAtual === 'cotas') {
      let totalCotas = 0;
      areaDivisaoDinamica.querySelectorAll('.input-split-cota').forEach((inp) => {
        totalCotas += parseFloat(inp.value) || 0;
      });

      splitFeedback.classList.remove('hidden');
      if (totalCotas <= 0) {
        splitFeedback.className = 'split-feedback err';
        splitFeedback.textContent = t('sharesZeroErr');
      } else if (totalNota > 0) {
        splitFeedback.className = 'split-feedback ok';
        splitFeedback.textContent = t('sharesRateFeedback', {
          n: totalCotas,
          val: formatarMoeda(totalNota / totalCotas)
        });
      } else {
        splitFeedback.className = 'split-feedback warn';
        splitFeedback.textContent = t('sharesConfigFeedback', { n: totalCotas });
      }
    }
  }

  splitModeTabs.addEventListener('click', (e) => {
    const tab = e.target.closest('.mode-tab');
    if (!tab) return;
    modoDivisaoAtual = tab.dataset.mode;
    renderizarControlesDivisao();
  });

  valorGasto.addEventListener('input', () => {
    atualizarBoxCambio();
    atualizarFeedbackDivisao();
  });
  areaDivisaoDinamica.addEventListener('input', atualizarFeedbackDivisao);
  areaDivisaoDinamica.addEventListener('change', atualizarFeedbackDivisao);

  btnTodos.addEventListener('click', () => {
    const inputs = areaDivisaoDinamica.querySelectorAll('input[type="checkbox"]');
    if (inputs.length === 0) return;
    const todosMarcados = Array.from(inputs).every((cb) => cb.checked);
    inputs.forEach((cb) => (cb.checked = !todosMarcados));
    atualizarFeedbackDivisao();
  });

  // --- EDIÇÃO E LANÇAMENTO DE GASTOS ---
  function iniciarEdicaoGasto(id) {
    const grupo = getGrupoAtivo();
    const gasto = grupo.gastos.find((g) => g.id === id);
    if (!gasto || gasto.tipo === 'pagamento') return;

    setFormGastoVisivel(true);

    inputEditGastoId.value = gasto.id;
    descGasto.value = gasto.descricao;
    selectPagador.value = gasto.pagador;
    categoriaSelecionada = gasto.categoria || '';
    categoriaDefinidaManualmente = Boolean(gasto.categoria);
    renderizarSeletorCategorias(false);

    if (gasto.moeda && gasto.moeda !== 'BRL') {
      selectMoedaGasto.value = gasto.moeda;
      valorGasto.value = Number(gasto.valorOriginal).toFixed(2);
      inputTaxaCambio.value = gasto.taxaCambio || '';
      cambioStatusMsg.textContent = '';
    } else {
      selectMoedaGasto.value = 'BRL';
      valorGasto.value = gasto.valor.toFixed(2);
      inputTaxaCambio.value = '';
    }
    atualizarBoxCambio();

    inputDataGasto.value = brParaISO(gasto.data);
    atualizarVisualDataGasto();

    cardFormGasto.classList.add('editing-mode');
    tituloFormGasto.textContent = t('sec2TitleEdit');
    btnCancelarEdicao.classList.remove('hidden');
    btnSubmitGasto.innerHTML = t('updateExpenseBtn');

    modoDivisaoAtual = gasto.modoDivisao || 'igual';

    if (modoDivisaoAtual === 'exato') {
      renderizarControlesDivisao(gasto.divisao);
    } else if (modoDivisaoAtual === 'cotas' && gasto.cotasOriginais) {
      renderizarControlesDivisao(gasto.cotasOriginais);
    } else {
      modoDivisaoAtual = 'igual';
      renderizarControlesDivisao(gasto.participantes);
    }

    cardFormGasto.scrollIntoView({ behavior: 'smooth', block: 'center' });
    descGasto.focus();
  }

  function cancelarEdicaoGasto() {
    inputEditGastoId.value = '';
    descGasto.value = '';
    valorGasto.value = '';
    categoriaSelecionada = '';
    categoriaDefinidaManualmente = false;
    selectMoedaGasto.value = 'BRL';
    inputTaxaCambio.value = '';
    cambioStatusMsg.textContent = '';
    atualizarBoxCambio();
    renderizarSeletorCategorias(false);
    resetarDataGasto();
    cardFormGasto.classList.remove('editing-mode');
    tituloFormGasto.textContent = t('sec2TitleNew');
    btnCancelarEdicao.classList.add('hidden');
    btnSubmitGasto.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      ${t('saveExpenseBtn')}
    `;
    modoDivisaoAtual = 'igual';
    renderizarControlesDivisao();
  }

  btnCancelarEdicao.addEventListener('click', () => {
    cancelarEdicaoGasto();
    setFormGastoVisivel(false);
  });

  formGasto.addEventListener('submit', (e) => {
    e.preventDefault();
    const grupo = getGrupoAtivo();
    const descricao = descGasto.value.trim();
    const moeda = selectMoedaGasto.value || 'BRL';
    const valorInformado = parseFloat(valorGasto.value);
    const taxaCambio = moeda === 'BRL' ? 1 : parseFloat(inputTaxaCambio.value);
    const pagador = selectPagador.value;
    const editId = inputEditGastoId.value ? Number(inputEditGastoId.value) : null;
    const dataFormatada = isoParaBR(inputDataGasto.value || getDataHojeISO());

    if (!pagador) {
      alert(t('addSomeoneAbove'));
      return;
    }
    if (isNaN(valorInformado) || valorInformado <= 0) {
      alert(t('invalidAmountAlert'));
      return;
    }
    if (moeda !== 'BRL' && (isNaN(taxaCambio) || taxaCambio <= 0)) {
      alert(t('invalidRateAlert'));
      inputTaxaCambio.focus();
      return;
    }

    const valor = Number((valorInformado * taxaCambio).toFixed(2));

    let participantes = [];
    let divisao = {};
    let cotasOriginais = null;

    if (modoDivisaoAtual === 'igual') {
      participantes = Array.from(
        areaDivisaoDinamica.querySelectorAll('input[type="checkbox"]:checked')
      ).map((cb) => cb.value);

      if (participantes.length === 0) {
        alert(t('selectAtLeastOne'));
        return;
      }

      const cota = valor / participantes.length;
      participantes.forEach((p) => {
        divisao[p] = cota;
      });
    } else if (modoDivisaoAtual === 'exato') {
      let soma = 0;
      areaDivisaoDinamica.querySelectorAll('.input-split-exato').forEach((inp) => {
        const v = parseFloat(inp.value) || 0;
        if (v > 0) {
          const p = inp.dataset.pessoa;
          participantes.push(p);
          divisao[p] = v;
          soma += v;
        }
      });

      if (participantes.length === 0) {
        alert(t('selectAtLeastOne'));
        return;
      }

      if (Math.abs(valor - soma) >= 0.01) {
        alert(
          t('missingAmountFeedback', {
            diff: formatarMoeda(Math.abs(valor - soma)),
            sum: formatarMoeda(soma)
          })
        );
        return;
      }
    } else if (modoDivisaoAtual === 'cotas') {
      let totalCotas = 0;
      cotasOriginais = {};

      areaDivisaoDinamica.querySelectorAll('.input-split-cota').forEach((inp) => {
        const c = parseFloat(inp.value) || 0;
        const p = inp.dataset.pessoa;
        cotasOriginais[p] = c;
        if (c > 0) {
          participantes.push(p);
          totalCotas += c;
        }
      });

      if (totalCotas <= 0) {
        alert(t('sharesZeroErr'));
        return;
      }

      const valorPorCota = valor / totalCotas;
      participantes.forEach((p) => {
        divisao[p] = cotasOriginais[p] * valorPorCota;
      });
    }

    const dadosMoeda =
      moeda !== 'BRL'
        ? { moeda, valorOriginal: valorInformado, taxaCambio }
        : { moeda: 'BRL', valorOriginal: null, taxaCambio: null };

    if (editId) {
      const idx = grupo.gastos.findIndex((g) => g.id === editId);
      if (idx !== -1) {
        grupo.gastos[idx] = {
          ...grupo.gastos[idx],
          data: dataFormatada,
          descricao,
          categoria: categoriaSelecionada,
          valor,
          ...dadosMoeda,
          pagador,
          modoDivisao: modoDivisaoAtual,
          participantes,
          divisao,
          cotasOriginais
        };
      }
      cancelarEdicaoGasto();
      setFormGastoVisivel(false);
    } else {
      grupo.gastos.push({
        id: Date.now(),
        tipo: 'despesa',
        data: dataFormatada,
        descricao,
        categoria: categoriaSelecionada,
        valor,
        ...dadosMoeda,
        pagador,
        modoDivisao: modoDivisaoAtual,
        participantes,
        divisao,
        cotasOriginais
      });
      descGasto.value = '';
      valorGasto.value = '';
      selectMoedaGasto.value = 'BRL';
      inputTaxaCambio.value = '';
      cambioStatusMsg.textContent = '';
      atualizarBoxCambio();
      categoriaSelecionada = '';
      categoriaDefinidaManualmente = false;
      renderizarSeletorCategorias(false);
      resetarDataGasto();
      modoDivisaoAtual = 'igual';
      setFormGastoVisivel(false);
    }

    salvarUltimoPagador(grupo.id, pagador);
    salvarDados();
  });

  // --- QUITAR CONTAS ---
  function abrirModalQuitar(dePreSelecionado = '', paraPreSelecionado = '', valorPreSelecionado = '') {
    const grupo = getGrupoAtivo();
    if (grupo.pessoas.length < 2) {
      alert(t('need2PeopleAlert'));
      return;
    }

    const opcoesHtml = grupo.pessoas.map((p) => `<option value="${p}">${p}</option>`).join('');

    selectQuitarDe.innerHTML = opcoesHtml;
    selectQuitarPara.innerHTML = opcoesHtml;

    if (dePreSelecionado && grupo.pessoas.includes(dePreSelecionado)) {
      selectQuitarDe.value = dePreSelecionado;
    } else {
      selectQuitarDe.selectedIndex = 0;
    }

    if (paraPreSelecionado && grupo.pessoas.includes(paraPreSelecionado)) {
      selectQuitarPara.value = paraPreSelecionado;
    } else {
      selectQuitarPara.selectedIndex = grupo.pessoas.length > 1 ? 1 : 0;
    }

    inputQuitarValor.value = valorPreSelecionado ? Number(valorPreSelecionado).toFixed(2) : '';
    inputQuitarObs.value = '';

    modalQuitar.classList.remove('hidden');
    if (!valorPreSelecionado) {
      inputQuitarValor.focus();
    }
  }

  btnAbrirQuitar.addEventListener('click', () => abrirModalQuitar());
  btnFecharQuitar.addEventListener('click', () => modalQuitar.classList.add('hidden'));
  btnCancelarQuitar.addEventListener('click', () => modalQuitar.classList.add('hidden'));

  modalQuitar.addEventListener('click', (e) => {
    if (e.target === modalQuitar) modalQuitar.classList.add('hidden');
  });

  listaAcertos.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-quitar-rapido');
    if (!btn) return;
    abrirModalQuitar(btn.dataset.de, btn.dataset.para, btn.dataset.valor);
  });

  formQuitar.addEventListener('submit', (e) => {
    e.preventDefault();
    const grupo = getGrupoAtivo();
    const de = selectQuitarDe.value;
    const para = selectQuitarPara.value;
    const valor = parseFloat(inputQuitarValor.value);
    const obs = inputQuitarObs.value.trim();

    if (de === para) {
      alert(t('diffPeopleAlert'));
      return;
    }

    if (isNaN(valor) || valor <= 0) {
      alert(t('invalidAmountAlert'));
      return;
    }

    grupo.gastos.push({
      id: Date.now(),
      tipo: 'pagamento',
      data: new Date().toLocaleDateString('pt-BR'),
      descricao: obs ? t('settlementObsDesc', { obs }) : t('settlementDefaultDesc'),
      valor: valor,
      pagador: de,
      participantes: [para],
      divisao: { [para]: valor }
    });

    modalQuitar.classList.add('hidden');
    salvarDados();
  });

  // Ações no Histórico
  listaGastos.addEventListener('click', (e) => {
    const btnEdit = e.target.closest('.btn-edit-gasto');
    if (btnEdit) {
      iniciarEdicaoGasto(Number(btnEdit.dataset.id));
      return;
    }

    const btnDel = e.target.closest('.btn-del-gasto');
    if (btnDel) {
      const grupo = getGrupoAtivo();
      const id = Number(btnDel.dataset.id);
      const item = grupo.gastos.find((g) => g.id === id);
      if (!item) return;

      const msgConfirm =
        item.tipo === 'pagamento'
          ? t('confirmDeletePayment', {
              from: item.pagador,
              to: item.participantes[0],
              val: formatarMoeda(item.valor)
            })
          : t('confirmDeleteExpense', {
              desc: item.descricao,
              val: formatarMoeda(item.valor)
            });

      if (!confirm(msgConfirm)) {
        return;
      }

      if (Number(inputEditGastoId.value) === id) {
        cancelarEdicaoGasto();
        setFormGastoVisivel(false);
      }
      grupo.gastos = grupo.gastos.filter((g) => g.id !== id);
      salvarDados();
    }
  });

  // --- CÁLCULO DE ACERTOS E CATEGORIAS ---
  function calcularAcertos(grupo) {
    const saldos = {};
    const totalPagoDespesas = {};
    const totalConsumido = {};
    const totalTransferido = {};
    const totalRecebido = {};
    const gastosPorCategoria = {};

    grupo.pessoas.forEach((p) => {
      saldos[p] = 0;
      totalPagoDespesas[p] = 0;
      totalConsumido[p] = 0;
      totalTransferido[p] = 0;
      totalRecebido[p] = 0;
    });

    let totalGeralDespesas = 0;

    grupo.gastos.forEach((item) => {
      const isPagamento = item.tipo === 'pagamento';

      if (isPagamento) {
        const recebedor = item.participantes[0];
        if (saldos[item.pagador] !== undefined) {
          saldos[item.pagador] += item.valor;
          totalTransferido[item.pagador] += item.valor;
        }
        if (saldos[recebedor] !== undefined) {
          saldos[recebedor] -= item.valor;
          totalRecebido[recebedor] += item.valor;
        }
      } else {
        totalGeralDespesas += item.valor;

        const catKey = item.categoria || 'Sem categoria';
        gastosPorCategoria[catKey] = (gastosPorCategoria[catKey] || 0) + item.valor;

        const cotas = obterCotasEmReais(item);

        if (saldos[item.pagador] !== undefined) {
          saldos[item.pagador] += item.valor;
          totalPagoDespesas[item.pagador] += item.valor;
        }

        for (const [pessoa, valorCota] of Object.entries(cotas)) {
          if (saldos[pessoa] !== undefined) {
            saldos[pessoa] -= valorCota;
            totalConsumido[pessoa] += valorCota;
          }
        }
      }
    });

    const devedores = [];
    const credores = [];

    for (const [pessoa, saldo] of Object.entries(saldos)) {
      if (saldo < -0.01) devedores.push({ pessoa, valor: -saldo });
      else if (saldo > 0.01) credores.push({ pessoa, valor: saldo });
    }

    devedores.sort((a, b) => b.valor - a.valor);
    credores.sort((a, b) => b.valor - a.valor);

    const transacoes = [];
    let i = 0,
      j = 0;

    while (i < devedores.length && j < credores.length) {
      const dev = devedores[i];
      const cred = credores[j];
      const valorTransferencia = Math.min(dev.valor, cred.valor);

      transacoes.push({
        de: dev.pessoa,
        para: cred.pessoa,
        valor: valorTransferencia
      });

      dev.valor -= valorTransferencia;
      cred.valor -= valorTransferencia;

      if (dev.valor < 0.01) i++;
      if (cred.valor < 0.01) j++;
    }

    return {
      saldos,
      transacoes,
      totalGeralDespesas,
      totalPagoDespesas,
      totalConsumido,
      totalTransferido,
      totalRecebido,
      gastosPorCategoria
    };
  }

  // --- RELATÓRIO ---
  let textoRelatorioWhatsApp = '';

  btnRelatorio.addEventListener('click', () => {
    const grupo = getGrupoAtivo();
    const {
      saldos,
      transacoes,
      totalGeralDespesas,
      totalPagoDespesas,
      totalConsumido,
      totalTransferido,
      totalRecebido,
      gastosPorCategoria
    } = calcularAcertos(grupo);
    const dataEmissao = new Date().toLocaleDateString('pt-BR');

    relatorioTitulo.textContent = `${t('reportTitlePrefix')} • ${grupo.nome}`;

    const despesas = grupo.gastos.filter((g) => g.tipo !== 'pagamento');
    const pagamentos = grupo.gastos.filter((g) => g.tipo === 'pagamento');

    const categoriasOrdenadas = Object.entries(gastosPorCategoria).sort((a, b) => b[1] - a[1]);

    let html = `
      <div class="rel-section">
        <p><strong>${t('reportGroupLabel')}</strong> ${grupo.nome}  |  <strong>${t('reportDateLabel')}</strong> ${dataEmissao}</p>
        <p><strong>${t('reportTotalExpensesLabel')}</strong> ${formatarMoeda(totalGeralDespesas)}</p>
      </div>

      <div class="rel-section">
        <h3>${t('reportSec1Title')}</h3>
        ${
          transacoes.length === 0
            ? `<p class="positivo"><strong>${t('reportAllSettled')}</strong></p>`
            : `<ul>${transacoes
                .map(
                  (tr) =>
                    `<li><strong>${tr.de}</strong> ${t('reportStillOwes')} <strong>${formatarMoeda(tr.valor)}</strong> ${t('toText')} <strong>${tr.para}</strong></li>`
                )
                .join('')}</ul>`
        }
      </div>

      <div class="rel-section">
        <h3>${t('reportSec2Title')}</h3>
        <table class="rel-table">
          <thead>
            <tr>
              <th>${t('thParticipant')}</th>
              <th>${t('thPaid')}</th>
              <th>${t('thConsumed')}</th>
              <th>${t('thSettlements')}</th>
              <th>${t('thFinalBalance')}</th>
            </tr>
          </thead>
          <tbody>
            ${grupo.pessoas
              .map((p) => {
                const s = saldos[p] || 0;
                const cls = s > 0.01 ? 'positivo' : s < -0.01 ? 'negativo' : '';
                const liquidoAcertos = (totalTransferido[p] || 0) - (totalRecebido[p] || 0);
                return `
                  <tr>
                    <td><strong>${p}</strong></td>
                    <td>${formatarMoeda(totalPagoDespesas[p] || 0)}</td>
                    <td>${formatarMoeda(totalConsumido[p] || 0)}</td>
                    <td>${liquidoAcertos !== 0 ? (liquidoAcertos > 0 ? '+' : '') + formatarMoeda(liquidoAcertos) : '-'}</td>
                    <td class="${cls}">${s > 0.01 ? '+' : ''}${formatarMoeda(s)}</td>
                  </tr>
                `;
              })
              .join('')}
          </tbody>
        </table>
      </div>
    `;

    if (categoriasOrdenadas.length > 0) {
      html += `
        <div class="rel-section">
          <h3>${t('reportSec3CatTitle')}</h3>
          <table class="rel-table">
            <thead>
              <tr>
                <th>${t('thCategory')}</th>
                <th>${t('thAmount')}</th>
                <th>${t('thPctTotal')}</th>
              </tr>
            </thead>
            <tbody>
              ${categoriasOrdenadas
                .map(([catKey, val]) => {
                  const pct =
                    totalGeralDespesas > 0 ? ((val / totalGeralDespesas) * 100).toFixed(1) : '0.0';
                  const catObj = getCategoriaObj(catKey);
                  const icone = catObj ? catObj.svg + ' ' : '';
                  return `
                    <tr>
                      <td style="display:flex; align-items:center; gap:6px;">${icone}<strong>${getNomeCategoriaTraduzido(catKey)}</strong></td>
                      <td>${formatarMoeda(val)}</td>
                      <td>${pct}%</td>
                    </tr>
                  `;
                })
                .join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    html += `
      <div class="rel-section">
        <h3>${categoriasOrdenadas.length > 0 ? '4' : '3'}. ${t('reportExpensesExtract')} (${despesas.length})</h3>
        ${
          despesas.length === 0
            ? `<p>${t('noExpensesRecorded')}</p>`
            : `<table class="rel-table">
                <thead>
                  <tr>
                    <th>${t('thDate')}</th>
                    <th>${t('thDescription')}</th>
                    <th>${t('thPayer')}</th>
                    <th>${t('thAmount')}</th>
                  </tr>
                </thead>
                <tbody>
                  ${despesas
                    .map((g) => {
                      const cotas = obterCotasEmReais(g);
                      const detalhe = Object.entries(cotas)
                        .map(([p, v]) => `${p} (${formatarMoeda(v)})`)
                        .join(', ');
                      const catTag = g.categoria
                        ? `<span style="color:#0284c7; font-weight:600;">[${getNomeCategoriaTraduzido(g.categoria)}]</span> `
                        : '';
                      const fxTag =
                        g.moeda && g.moeda !== 'BRL' && g.valorOriginal
                          ? `<br><small style="color:#0369a1;">(${formatarMoedaEstrangeira(g.valorOriginal, g.moeda)} × ${g.taxaCambio})</small>`
                          : '';
                      return `
                        <tr>
                          <td>${g.data || '-'}</td>
                          <td>${catTag}${g.descricao}<br><small style="color:#64748b">${detalhe}</small></td>
                          <td>${g.pagador}</td>
                          <td><strong>${formatarMoeda(g.valor)}</strong>${fxTag}</td>
                        </tr>
                      `;
                    })
                    .join('')}
                </tbody>
              </table>`
        }
      </div>
    `;

    if (pagamentos.length > 0) {
      const numSecao = categoriasOrdenadas.length > 0 ? '5' : '4';
      html += `
        <div class="rel-section">
          <h3>${numSecao}. ${t('reportPaymentsExtract')} (${pagamentos.length})</h3>
          <table class="rel-table">
            <thead>
              <tr>
                <th>${t('thDate')}</th>
                <th>${t('thMovement')}</th>
                <th>${t('thAmount')}</th>
              </tr>
            </thead>
            <tbody>
              ${pagamentos
                .map(
                  (p) => `
                <tr>
                  <td>${p.data || '-'}</td>
                  <td><strong>${p.pagador}</strong> ${t('paidToText')} <strong>${p.participantes[0]}</strong> <small style="color:#64748b">(${p.descricao})</small></td>
                  <td class="positivo"><strong>${formatarMoeda(p.valor)}</strong></td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    relatorioConteudo.innerHTML = html;

    let txt = `${t('wppReportHeader', { name: grupo.nome.toUpperCase() })}\n`;
    txt += `📅 ${t('reportDateLabel')} ${dataEmissao}\n`;
    txt += `${t('wppTotalExpenses', { val: formatarMoeda(totalGeralDespesas) })}\n\n`;

    txt += `${t('wppPendingHeader')}\n`;
    if (transacoes.length === 0) {
      txt += `${t('wppAllSettled')}\n`;
    } else {
      transacoes.forEach((tr) => {
        txt += `${t('wppPaysLine', { from: tr.de, val: formatarMoeda(tr.valor), to: tr.para })}\n`;
      });
    }

    if (categoriasOrdenadas.length > 0) {
      txt += `\n${t('wppCategoryHeader')}\n`;
      categoriasOrdenadas.forEach(([catKey, val]) => {
        const pct = totalGeralDespesas > 0 ? ((val / totalGeralDespesas) * 100).toFixed(0) : '0';
        txt += `• ${getNomeCategoriaTraduzido(catKey)}: ${formatarMoeda(val)} (${pct}%)\n`;
      });
    }

    if (pagamentos.length > 0) {
      txt += `\n${t('wppPaymentsHeader')}\n`;
      pagamentos.forEach((p) => {
        txt += `• ${p.pagador} ➔ ${p.participantes[0]}: ${formatarMoeda(p.valor)}\n`;
      });
    }

    txt += `\n${t('wppExpensesHeader')}\n`;
    despesas.forEach((g) => {
      const catStr = g.categoria ? `[${getNomeCategoriaTraduzido(g.categoria)}] ` : '';
      const fxStr =
        g.moeda && g.moeda !== 'BRL' && g.valorOriginal
          ? ` [${formatarMoedaEstrangeira(g.valorOriginal, g.moeda)}]`
          : '';
      txt += `• ${catStr}${g.descricao}: ${formatarMoeda(g.valor)}${fxStr} (${t('wppPaidBy')} ${g.pagador})\n`;
    });

    textoRelatorioWhatsApp = txt;
    modalRelatorio.classList.remove('hidden');
  });

  btnFecharModal.addEventListener('click', () => modalRelatorio.classList.add('hidden'));
  modalRelatorio.addEventListener('click', (e) => {
    if (e.target === modalRelatorio) modalRelatorio.classList.add('hidden');
  });

  btnCopiarTexto.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(textoRelatorioWhatsApp);
      btnCopiarTexto.textContent = t('copiedBtn');
      setTimeout(() => (btnCopiarTexto.textContent = t('copyWhatsAppBtn')), 2000);
    } catch (err) {
      alert('Error copying.');
    }
  });

  btnImprimir.addEventListener('click', () => window.print());

  // --- RENDERIZAÇÃO DO HISTÓRICO ---
  function renderizarHistorico() {
    const grupo = getGrupoAtivo();

    const listaFiltrada = grupo.gastos.filter((g) => {
      if (filtroCategoriaAtual === 'todas') return true;
      if (filtroCategoriaAtual === 'acertos') return g.tipo === 'pagamento';
      if (filtroCategoriaAtual === 'sem_categoria') {
        return g.tipo !== 'pagamento' && !g.categoria;
      }
      return g.tipo !== 'pagamento' && g.categoria === filtroCategoriaAtual;
    });

    if (listaFiltrada.length === 0) {
      listaGastos.innerHTML =
        `<li class="empty-state-text">${t('noEntriesFilter')}</li>`;
      return;
    }

    listaGastos.innerHTML = listaFiltrada
      .slice()
      .reverse()
      .map((g) => {
        const isPagamento = g.tipo === 'pagamento';
        if (isPagamento) {
          return `
            <li class="gasto-item item-pagamento">
              <div class="gasto-info">
                <strong><span class="badge-pagamento">${t('settlementBadge')}</span>${g.pagador} ${t('paidToText')} ${g.participantes[0]}</strong>
                <small>${g.data ? g.data + ' • ' : ''}${g.descricao}</small>
              </div>
              <div class="gasto-right">
                <span class="gasto-valor pagamento-val">${formatarMoeda(g.valor)}</span>
                <button type="button" class="btn-icon-action btn-del-gasto" data-id="${g.id}">✕</button>
              </div>
            </li>
          `;
        }

        const cotas = obterCotasEmReais(g);
        let badgeModo = '';
        let detalheDivisao = `${t('splitWithText')} ${g.participantes.join(', ')}`;

        if (g.modoDivisao === 'exato') {
          badgeModo = `<span class="badge-modo">${t('modeExactBadge')}</span>`;
          detalheDivisao = Object.entries(cotas)
            .map(([p, v]) => `${p}: ${formatarMoeda(v)}`)
            .join(' • ');
        } else if (g.modoDivisao === 'cotas') {
          badgeModo = `<span class="badge-modo">${t('modeSharesBadge')}</span>`;
          detalheDivisao = Object.entries(cotas)
            .map(([p, v]) => `${p}: ${formatarMoeda(v)}`)
            .join(' • ');
        }

        const catObj = g.categoria ? getCategoriaObj(g.categoria) : null;
        const badgeCategoria = catObj
          ? `<span class="cat-badge-inline">${catObj.svg} ${getNomeCategoriaTraduzido(g.categoria)}</span>`
          : '';

        const infoMoedaEstrangeira =
          g.moeda && g.moeda !== 'BRL' && g.valorOriginal
            ? ` • <span style="color:#0369a1; font-weight:600;">${formatarMoedaEstrangeira(g.valorOriginal, g.moeda)} (× ${g.taxaCambio})</span>`
            : '';

        return `
          <li class="gasto-item">
            <div class="gasto-info">
              <strong>${badgeCategoria}${g.descricao}${badgeModo}</strong>
              <small>${g.data ? g.data + ' • ' : ''}${t('paidByText')} <b>${g.pagador}</b>${infoMoedaEstrangeira}</small>
              <small>${detalheDivisao}</small>
            </div>
            <div class="gasto-right">
              <span class="gasto-valor">${formatarMoeda(g.valor)}</span>
              <button type="button" class="btn-icon-action btn-edit-gasto" data-id="${g.id}">✎</button>
              <button type="button" class="btn-icon-action btn-del-gasto" data-id="${g.id}">✕</button>
            </div>
          </li>
        `;
      })
      .join('');
  }

  // --- RENDERIZAÇÃO GERAL ---
  function renderizarTudo() {
    const grupo = getGrupoAtivo();

    if (badgeCodigoGrupo) {
      badgeCodigoGrupo.textContent = `ID: ${grupo.id}`;
    }

    selectGrupo.innerHTML = appData.grupos
      .map((g) => {
        const qtd = g.gastos.length;
        const lbl = qtd === 1 ? t('entrySingular') : t('entryPlural');
        return `<option value="${g.id}" ${g.id === grupo.id ? 'selected' : ''}>${g.nome} (${qtd} ${lbl})</option>`;
      })
      .join('');

    if (grupo.pessoas.length === 0) {
      listaPessoas.innerHTML =
        `<span class="empty-state-text">${t('noParticipantsGroup')}</span>`;
      selectPagador.innerHTML = `<option value="">${t('addSomeoneAbove')}</option>`;
    } else {
      listaPessoas.innerHTML = grupo.pessoas
        .map(
          (p) => `
          <span class="tag">
            ${p}
            <button type="button" class="tag-remove" data-nome="${p}">×</button>
          </span>
        `
        )
        .join('');

      const pagadorSalvo = obterUltimoPagador(grupo.id);
      const pagadorPreferido =
        inputEditGastoId.value && selectPagador.value
          ? selectPagador.value
          : grupo.pessoas.includes(pagadorSalvo)
          ? pagadorSalvo
          : selectPagador.value;

      selectPagador.innerHTML = grupo.pessoas
        .map(
          (p) =>
            `<option value="${p}" ${p === pagadorPreferido ? 'selected' : ''}>${p}</option>`
        )
        .join('');
    }

    if (!inputEditGastoId.value) {
      renderizarControlesDivisao();
    }

    const { saldos, transacoes, totalGeralDespesas } = calcularAcertos(grupo);
    totalGrupoBadge.textContent = `${t('totalSpentBadge')}: ${formatarMoeda(totalGeralDespesas)}`;

    if (grupo.pessoas.length === 0) {
      resumoSaldos.innerHTML =
        `<span class="empty-state-text">${t('registerParticipantsSaldos')}</span>`;
    } else {
      resumoSaldos.innerHTML = Object.entries(saldos)
        .map(([pessoa, saldo]) => {
          let classe = 'neutro';
          let sinal = '';
          if (saldo > 0.01) {
            classe = 'positivo';
            sinal = '+';
          } else if (saldo < -0.01) {
            classe = 'negativo';
          }
          return `
            <div class="saldo-card">
              <div class="saldo-nome">${pessoa}</div>
              <div class="saldo-valor ${classe}">${sinal}${formatarMoeda(saldo)}</div>
            </div>
          `;
        })
        .join('');
    }

    if (transacoes.length === 0) {
      listaAcertos.innerHTML =
        `<li class="empty-state-text" style="border:none; background:transparent; padding:0;">${t('allSettledShort')}</li>`;
    } else {
      listaAcertos.innerHTML = transacoes
        .map(
          (tr) => `
            <li>
              <span><strong>${tr.de}</strong> ${t('owesText')} <strong>${formatarMoeda(tr.valor)}</strong> ${t('toText')} <strong>${tr.para}</strong></span>
              <button type="button" class="btn-quitar-rapido" data-de="${tr.de}" data-para="${tr.para}" data-valor="${tr.valor}">${t('quickSettleBtn')}</button>
            </li>
          `
        )
        .join('');
    }

    atualizarBotaoHistorico();
    renderizarHistorico();

    if (painelTotaisAberto) {
      renderizarPainelTotais();
    }
  }

  // --- AUTENTICAÇÃO OBRIGATÓRIA E SINCRONIZAÇÃO DOS GRUPOS DA CONTA ---
  const mainApp = document.getElementById('main-app');
  const authGate = document.getElementById('auth-gate');
  const langSwitcherGate = document.getElementById('lang-switcher-gate');
  const userLoggedBox = document.getElementById('user-logged-box');
  const userAvatar = document.getElementById('user-avatar');
  const userDisplayEmail = document.getElementById('user-display-email');
  const btnLogout = document.getElementById('btn-logout');

  const btnLoginGoogle = document.getElementById('btn-login-google');
  const authModeTabs = document.getElementById('auth-mode-tabs');
  const authFeedback = document.getElementById('auth-feedback');
  const formAuth = document.getElementById('form-auth');
  const inputAuthEmail = document.getElementById('auth-email');
  const inputAuthPassword = document.getElementById('auth-password');
  const chkManterConectado = document.getElementById('chk-manter-conectado');
  const btnResetSenha = document.getElementById('btn-reset-senha');
  const btnSubmitAuth = document.getElementById('btn-submit-auth');

  if (langSwitcherGate) {
    langSwitcherGate.addEventListener('click', (e) => {
      const btn = e.target.closest('.lang-btn');
      if (!btn) return;
      const novoLang = btn.dataset.lang;
      if (!I18N[novoLang] || novoLang === idiomaAtual) return;
      idiomaAtual = novoLang;
      localStorage.setItem(LANG_STORAGE_KEY, idiomaAtual);
      aplicarIdiomaNaUI();
    });
  }

  function mostrarFeedbackAuth(msg, tipo = 'err') {
    authFeedback.textContent = msg;
    authFeedback.className = `auth-feedback ${tipo}`;
    authFeedback.classList.remove('hidden');
  }

  function limparFeedbackAuth() {
    authFeedback.classList.add('hidden');
  }

  function atualizarModoAuthUI() {
    authModeTabs.querySelectorAll('.auth-tab').forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.authMode === modoAuthAtual);
    });
    btnSubmitAuth.textContent =
      modoAuthAtual === 'login' ? t('authSubmitLoginBtn') : t('authSubmitRegisterBtn');
    btnResetSenha.classList.toggle('hidden', modoAuthAtual !== 'login');
    limparFeedbackAuth();
  }

  authModeTabs.addEventListener('click', (e) => {
    const tab = e.target.closest('.auth-tab');
    if (!tab) return;
    modoAuthAtual = tab.dataset.authMode;
    atualizarModoAuthUI();
  });

  function traduzirErroFirebaseAuth(code) {
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      return 'E-mail ou senha incorretos.';
    }
    if (code === 'auth/email-already-in-use') {
      return 'Este e-mail já está cadastrado. Tente entrar.';
    }
    if (code === 'auth/weak-password') {
      return 'A senha deve ter pelo menos 6 caracteres.';
    }
    if (code === 'auth/popup-closed-by-user') {
      return 'Janela de login fechada antes de concluir.';
    }
    return `Erro de autenticação (${code}).`;
  }

  async function aplicarPersistenciaEscolhida() {
    const modoPersistencia =
      chkManterConectado && !chkManterConectado.checked
        ? browserSessionPersistence
        : browserLocalPersistence;
    await setPersistence(auth, modoPersistencia);
  }

  btnLoginGoogle.addEventListener('click', async () => {
    limparFeedbackAuth();
    try {
      await aplicarPersistenciaEscolhida();
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      mostrarFeedbackAuth(traduzirErroFirebaseAuth(err.code), 'err');
    }
  });

  formAuth.addEventListener('submit', async (e) => {
    e.preventDefault();
    limparFeedbackAuth();
    const email = inputAuthEmail.value.trim();
    const senha = inputAuthPassword.value;

    try {
      await aplicarPersistenciaEscolhida();
      if (modoAuthAtual === 'login') {
        await signInWithEmailAndPassword(auth, email, senha);
      } else {
        await createUserWithEmailAndPassword(auth, email, senha);
      }
      inputAuthPassword.value = '';
    } catch (err) {
      mostrarFeedbackAuth(traduzirErroFirebaseAuth(err.code), 'err');
    }
  });

  btnResetSenha.addEventListener('click', async () => {
    const email = inputAuthEmail.value.trim();
    if (!email) {
      mostrarFeedbackAuth(t('authEnterEmailFirst'), 'err');
      inputAuthEmail.focus();
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      mostrarFeedbackAuth(t('authResetSentMsg'), 'ok');
    } catch (err) {
      mostrarFeedbackAuth(traduzirErroFirebaseAuth(err.code), 'err');
    }
  });

  btnLogout.addEventListener('click', async () => {
    try {
      // 1. Encerra listeners ativos do Firestore antes de sair
      Object.keys(unsubscribersNuvem).forEach((id) => {
        if (unsubscribersNuvem[id]) unsubscribersNuvem[id]();
        delete unsubscribersNuvem[id];
      });

      const chaveContaAtual = getChaveCacheUsuario();
      usuarioAtual = null;

      // 2. Desloga da conta no Firebase Authentication (dados na nuvem permanecem salvos)
      await signOut(auth);

      // 3. Limpa o cache local desta conta e dados temporários
      appData = criarEstadoInicial();
      if (chaveContaAtual) localStorage.removeItem(chaveContaAtual);
      localStorage.removeItem('raodev_split_grupos_v1');
      localStorage.removeItem(LAST_PAYER_STORAGE_KEY);
      sessionStorage.clear();

      // 4. Limpa parâmetros de convite da URL e recarrega a página limpa
      if (window.location.search) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      window.location.reload();
    } catch (err) {
      console.error('Erro ao sair:', err);
      window.location.reload();
    }
  });

async function sincronizarListaGruposUsuario() {
    if (!usuarioAtual) return;
    try {
      const userRef = doc(db, 'usuarios', usuarioAtual.uid);
      const gruposIds = appData.grupos
        .filter((g) => g.nome !== 'Carregando grupo...')
        .map((g) => g.id);

      // Nunca sobrescreve a nuvem se só houver o grupo padrão vazio recém-criado
      const ehApenasGrupoPadraoVazio =
        appData.grupos.length === 1 &&
        appData.grupos[0].nome === 'Geral / Viagem' &&
        appData.grupos[0].pessoas.length === 0 &&
        appData.grupos[0].gastos.length === 0;

      if (ehApenasGrupoPadraoVazio) return;

      await setDoc(
        userRef,
        {
          email: usuarioAtual.email || '',
          nome: usuarioAtual.displayName || '',
          gruposIds,
          ultimoGrupoAtivoId: appData.grupoAtivoId,
          atualizadoEm: new Date().toISOString()
        },
        { merge: true }
      );
    } catch (err) {
      console.error('Erro ao salvar lista de grupos do usuário:', err);
    }
  }
 async function carregarGruposDaConta(user) {
    // 1. Mostra cache local do UID imediatamente enquanto consulta o servidor
    const cacheConta = carregarCacheLocalUsuario(user.uid);
    if (cacheConta) {
      appData = cacheConta;
      renderizarTudo();
    }

    try {
      const userRef = doc(db, 'usuarios', user.uid);
      // Busca direto do servidor se estiver online, evitando cache desatualizado do PC
      const snap = navigator.onLine
        ? await getDocFromServer(userRef)
        : await getDoc(userRef);

      let idsNuvem = [];
      let ultimoAtivoNuvem = null;

      if (snap.exists()) {
        const dadosUser = snap.data();
        idsNuvem = Array.isArray(dadosUser.gruposIds) ? dadosUser.gruposIds : [];
        ultimoAtivoNuvem = dadosUser.ultimoGrupoAtivoId || null;
      }

      if (grupoUrlId && !idsNuvem.includes(grupoUrlId)) {
        idsNuvem.push(grupoUrlId);
      }

      // Desconecta listeners antigos que não pertencem a esta conta
      Object.keys(unsubscribersNuvem).forEach((id) => {
        if (!idsNuvem.includes(id)) {
          unsubscribersNuvem[id]();
          delete unsubscribersNuvem[id];
        }
      });

      if (idsNuvem.length > 0) {
        appData.grupos = idsNuvem.map((id) => {
          const existente = appData.grupos.find((g) => g.id === id);
          return (
            existente || {
              id,
              nome: 'Carregando grupo...',
              pessoas: [],
              gastos: []
            }
          );
        });

        if (grupoUrlId && idsNuvem.includes(grupoUrlId)) {
          appData.grupoAtivoId = grupoUrlId;
        } else if (ultimoAtivoNuvem && idsNuvem.includes(ultimoAtivoNuvem)) {
          appData.grupoAtivoId = ultimoAtivoNuvem;
        } else {
          appData.grupoAtivoId = idsNuvem[0];
        }
      } else if (!cacheConta) {
        appData = criarEstadoInicial();
      }

      salvarCacheLocal();
      renderizarTudo();
      conectarTodosGruposNuvem();

      // Só atualiza a lista na nuvem se entrou via link de convite (?grupo=...)
      if (grupoUrlId) {
        await sincronizarListaGruposUsuario();
      }
    } catch (err) {
      console.warn('Falha ao consultar servidor, mantendo cache offline:', err);
      if (!cacheConta) {
        appData = criarEstadoInicial();
        renderizarTudo();
      }
      conectarTodosGruposNuvem();
    }
  }

  onAuthStateChanged(auth, async (user) => {
    usuarioAtual = user;
    if (user) {
      authGate.classList.add('hidden');
      mainApp.classList.remove('hidden');
      userLoggedBox.classList.remove('hidden');
      userDisplayEmail.textContent = user.displayName || user.email;

      if (user.photoURL) {
        userAvatar.src = user.photoURL;
        userAvatar.classList.remove('hidden');
      } else {
        userAvatar.classList.add('hidden');
      }

      await carregarGruposDaConta(user);
    } else {
      Object.keys(unsubscribersNuvem).forEach((id) => {
        if (unsubscribersNuvem[id]) unsubscribersNuvem[id]();
        delete unsubscribersNuvem[id];
      });
      appData = criarEstadoInicial();
      mainApp.classList.add('hidden');
      authGate.classList.remove('hidden');
    }
  });

  // Inicialização
  resetarDataGasto();
  aplicarIdiomaNaUI();
});