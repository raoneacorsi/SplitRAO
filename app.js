document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'raodev_split_grupos_v1';

  // Definição das Categorias com Ícones Vetoriais (SVG)
  const CATEGORIAS = [
    {
      id: 'Casa',
      nome: 'Casa',
      svg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>'
    },
    {
      id: 'Comida',
      nome: 'Comida',
      svg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>'
    },
    {
      id: 'Carro',
      nome: 'Carro',
      svg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>'
    },
    {
      id: 'Entretenimento',
      nome: 'Entretenimento',
      svg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>'
    },
    {
      id: 'Transporte',
      nome: 'Transporte',
      svg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>'
    },
    {
      id: 'Vida',
      nome: 'Vida',
      svg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>'
    }
  ];

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

  try {
    const salvo = localStorage.getItem(STORAGE_KEY);
    if (salvo) {
      const parsed = JSON.parse(salvo);
      if (parsed && Array.isArray(parsed.grupos) && parsed.grupos.length > 0) {
        appData = parsed;
      }
    }
  } catch (err) {
    console.error('Erro ao carregar dados do navegador:', err);
  }

  // Estados temporários de UI
  let modoDivisaoAtual = 'igual';
  let categoriaSelecionada = '';
  let filtroCategoriaAtual = 'todas';
  let painelTotaisAberto = false;

  // Referências do DOM
  const selectGrupo = document.getElementById('select-grupo');
  const btnRenomearGrupo = document.getElementById('btn-renomear-grupo');
  const btnNovoGrupo = document.getElementById('btn-novo-grupo');
  const btnExcluirGrupo = document.getElementById('btn-excluir-grupo');
  const btnBalancoGlobal = document.getElementById('btn-balanco-global');
  const btnExportarJson = document.getElementById('btn-exportar-json');
  const inputImportarJson = document.getElementById('input-importar-json');
  const saveStatus = document.getElementById('save-status');

  const formPessoa = document.getElementById('form-pessoa');
  const inputNomePessoa = document.getElementById('nome-pessoa');
  const listaPessoas = document.getElementById('lista-pessoas');

  const cardFormGasto = document.getElementById('card-form-gasto');
  const tituloFormGasto = document.getElementById('titulo-form-gasto');
  const btnCancelarEdicao = document.getElementById('btn-cancelar-edicao');
  const inputEditGastoId = document.getElementById('edit-gasto-id');
  const formGasto = document.getElementById('form-gasto');
  const descGasto = document.getElementById('desc-gasto');
  const categorySelector = document.getElementById('category-selector');
  const btnLimparCategoria = document.getElementById('btn-limpar-categoria');
  const valorGasto = document.getElementById('valor-gasto');
  const selectPagador = document.getElementById('pagador-gasto');
  const splitModeTabs = document.getElementById('split-mode-tabs');
  const areaDivisaoDinamica = document.getElementById('area-divisao-dinamica');
  const splitFeedback = document.getElementById('split-feedback');
  const btnTodos = document.getElementById('btn-todos');
  const btnSubmitGasto = document.getElementById('btn-submit-gasto');

  const resumoSaldos = document.getElementById('resumo-saldos');
  const listaAcertos = document.getElementById('lista-acertos');
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

  function getGrupoAtivo() {
    let grupo = appData.grupos.find((g) => g.id === appData.grupoAtivoId);
    if (!grupo) {
      grupo = appData.grupos[0];
      appData.grupoAtivoId = grupo.id;
    }
    return grupo;
  }

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

  function salvarDados() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
      saveStatus.textContent =
        '● Salvo às ' +
        new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch (err) {
      console.error('Erro ao salvar:', err);
      saveStatus.textContent = '⚠ Erro ao salvar no navegador';
    }
    renderizarTudo();
  }

  function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  // --- BALANÇO GLOBAL (CONSOLIDADO ENTRE TODOS OS GRUPOS) ---
  let textoGlobalWhatsApp = '';

  function calcularBalancoGlobal() {
    // Mapeia nome normalizado (lowercase) -> { nomeExibicao, saldoTotal, detalhesPorGrupo: [] }
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
          Consolidado de <strong>${appData.grupos.length} grupo(s)</strong>, compensando automaticamente créditos e débitos cruzados entre grupos diferentes.
        </p>

        <h3>1. Acerto Final Consolidado (Quem paga quem)</h3>
        ${
          transacoesGlobais.length === 0
            ? '<p class="positivo"><strong>Tudo zerado no geral! Nenhuma dívida pendente entre os grupos.</strong></p>'
            : `<ul class="acertos-list" style="margin-top: 8px;">${transacoesGlobais
                .map(
                  (t) =>
                    `<li style="margin-bottom: 6px;"><span><strong>${t.de}</strong> deve <strong>${formatarMoeda(t.valor)}</strong> para <strong>${t.para}</strong></span></li>`
                )
                .join('')}</ul>`
        }
      </div>

      <div class="rel-section" style="margin-bottom: 0;">
        <h3>2. Saldo Líquido por Pessoa (Detalhamento por Grupo)</h3>
        ${
          pessoasList.length === 0
            ? '<p class="empty-state-text">Nenhum participante cadastrado nos grupos.</p>'
            : `<table class="rel-table">
                <thead>
                  <tr>
                    <th>Participante</th>
                    <th>Origem por Grupo</th>
                    <th>Saldo Global</th>
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
                          ? '<small style="color:#64748b">Zerado em todos</small>'
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

    let txt = `*🌐 BALANÇO GLOBAL (TODOS OS GRUPOS)*\n`;
    txt += `📊 Grupos somados: ${appData.grupos.map((g) => g.nome).join(', ')}\n\n`;
    txt += `*💸 ACERTO FINAL COMPENSADO:*\n`;
    if (transacoesGlobais.length === 0) {
      txt += `✅ Tudo quitado no geral!\n`;
    } else {
      transacoesGlobais.forEach((t) => {
        txt += `• *${t.de}* paga *${formatarMoeda(t.valor)}* para *${t.para}*\n`;
      });
    }

    txt += `\n*👤 SALDO LÍQUIDO POR PESSOA:*\n`;
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
      const orig = btnCopiarGlobal.textContent;
      btnCopiarGlobal.textContent = '✅ Copiado!';
      setTimeout(() => (btnCopiarGlobal.textContent = orig), 2000);
    } catch (err) {
      alert('Não foi possível copiar automaticamente.');
    }
  });

  // --- CATEGORIAS UI E PAINEL DE TOTAIS ---
  function renderizarSeletorCategorias() {
    categorySelector.innerHTML = CATEGORIAS.map((cat) => {
      const isSelected = categoriaSelecionada === cat.id;
      return `
        <button type="button" class="cat-btn ${isSelected ? 'active' : ''}" data-cat="${cat.id}">
          ${cat.svg}
          <span>${cat.nome}</span>
        </button>
      `;
    }).join('');

    btnLimparCategoria.classList.toggle('hidden', !categoriaSelecionada);
  }

  categorySelector.addEventListener('click', (e) => {
    const btn = e.target.closest('.cat-btn');
    if (!btn) return;
    const catId = btn.dataset.cat;
    categoriaSelecionada = categoriaSelecionada === catId ? '' : catId;
    renderizarSeletorCategorias();
  });

  btnLimparCategoria.addEventListener('click', () => {
    categoriaSelecionada = '';
    renderizarSeletorCategorias();
  });

  function inicializarFiltroCategorias() {
    const opcoes = [
      '<option value="todas">Todas as categorias</option>',
      ...CATEGORIAS.map((c) => `<option value="${c.id}">${c.nome}</option>`),
      '<option value="sem_categoria">Sem categoria</option>',
      '<option value="acertos">Apenas Acertos / Pagamentos</option>'
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
        '<span class="empty-state-text">Nenhuma despesa lançada neste grupo para totalizar.</span>';
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

      const cat = g.categoria || 'Sem categoria';
      porCategoria[cat] = (porCategoria[cat] || 0) + g.valor;

      let chaveMes = 'Sem data';
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
      ? `Filtro: ${filtroCategoriaAtual === 'sem_categoria' ? 'Sem categoria' : filtroCategoriaAtual}`
      : 'Todas as despesas';

    let html = `
      <div class="totais-resumo-cards">
        <div class="total-mini-card">
          <small>Total Geral do Grupo</small>
          <strong>${formatarMoeda(totalGeral)}</strong>
        </div>
        <div class="total-mini-card">
          <small>${mostrandoFiltroEspecifico ? 'Total do Filtro Ativo' : 'Média por Despesa'}</small>
          <strong>${formatarMoeda(mostrandoFiltroEspecifico ? totalDoFiltro : totalGeral / despesas.length)}</strong>
        </div>
      </div>
    `;

    const catsOrdenadas = Object.entries(porCategoria).sort((a, b) => b[1] - a[1]);
    html += `
      <div class="totais-bloco">
        <h4>Por Categoria</h4>
        <div class="totais-lista">
          ${catsOrdenadas
            .map(([catNome, val]) => {
              const pct = totalGeral > 0 ? ((val / totalGeral) * 100).toFixed(1) : 0;
              const catObj = getCategoriaObj(catNome);
              const icone = catObj ? catObj.svg : '';
              return `
                <div class="total-row-item">
                  <div class="total-row-top">
                    <span class="total-row-label">${icone}${catNome}</span>
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
        <h4>Por Mês</h4>
        <div class="totais-lista">
          ${mesesOrdenados
            .map(([chave, val]) => {
              const labelMes = chave.includes('|') ? chave.split('|')[1] : chave;
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
    salvarDados();
  });

  btnRenomearGrupo.addEventListener('click', () => {
    const grupo = getGrupoAtivo();
    const novoNome = prompt('Novo nome para o grupo:', grupo.nome);
    if (!novoNome || !novoNome.trim()) return;
    grupo.nome = novoNome.trim();
    salvarDados();
  });

  btnNovoGrupo.addEventListener('click', () => {
    const nome = prompt('Nome do novo grupo (ex: Viagem Atacama, Churrasco, Sítio):');
    if (!nome || !nome.trim()) return;

    cancelarEdicaoGasto();
    filtroCategoriaAtual = 'todas';
    filtroCategoriaSelect.value = 'todas';
    const novoGrupo = {
      id: 'grp_' + Date.now(),
      nome: nome.trim(),
      pessoas: [],
      gastos: []
    };

    appData.grupos.push(novoGrupo);
    appData.grupoAtivoId = novoGrupo.id;
    salvarDados();
  });

  btnExcluirGrupo.addEventListener('click', () => {
    const grupo = getGrupoAtivo();
    cancelarEdicaoGasto();

    if (appData.grupos.length <= 1) {
      if (confirm(`Deseja zerar todos os dados do grupo "${grupo.nome}"?`)) {
        grupo.pessoas = [];
        grupo.gastos = [];
        salvarDados();
      }
      return;
    }

    if (confirm(`Excluir permanentemente o grupo "${grupo.nome}" e todos os seus gastos?`)) {
      appData.grupos = appData.grupos.filter((g) => g.id !== grupo.id);
      appData.grupoAtivoId = appData.grupos[0].id;
      salvarDados();
    }
  });

  // --- BACKUP E IMPORTAÇÃO INTELIGENTE ---
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
    reader.onload = (event) => {
      try {
        const importado = JSON.parse(event.target.result);
        if (importado && Array.isArray(importado.grupos) && importado.grupos.length > 0) {
          cancelarEdicaoGasto();

          const nomesImportados = importado.grupos.map((g) => `"${g.nome}"`).join(', ');
          const adicionarAosAtuais = confirm(
            `O arquivo contém ${importado.grupos.length} grupo(s): ${nomesImportados}.\n\n` +
            `• Clique em OK para ADICIONAR esses grupos aos que você já tem.\n` +
            `• Clique em CANCELAR para SUBSTITUIR todos os grupos atuais pelos do arquivo.`
          );

          if (adicionarAosAtuais) {
            importado.grupos.forEach((g, idx) => {
              const novoId = 'grp_' + Date.now() + '_' + idx;
              appData.grupos.push({
                ...g,
                id: novoId
              });
              if (idx === importado.grupos.length - 1) {
                appData.grupoAtivoId = novoId;
              }
            });
            salvarDados();
            alert(`${importado.grupos.length} grupo(s) adicionado(s) com sucesso!`);
          } else {
            if (confirm('Tem certeza que deseja apagar os grupos atuais e ficar apenas com os do arquivo?')) {
              appData = importado;
              salvarDados();
              alert('Grupos substituídos com sucesso!');
            }
          }
        } else {
          alert('Arquivo inválido. Selecione um JSON gerado pelo RAODEV Split ou pelo Conversor.');
        }
      } catch (err) {
        alert('Erro ao ler o arquivo JSON.');
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
      alert('Esse participante já está neste grupo.');
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
      alert(`Não é possível remover "${nome}" pois já participa de lançamentos neste grupo.`);
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
        '<span class="empty-state-text">Adicione participantes na etapa 1 para selecionar.</span>';
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
                    <span>Cotas:</span>
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

    const totalNota = parseFloat(valorGasto.value) || 0;

    if (modoDivisaoAtual === 'igual') {
      const marcados = areaDivisaoDinamica.querySelectorAll('input[type="checkbox"]:checked').length;
      if (marcados === 0) {
        splitFeedback.className = 'split-feedback err';
        splitFeedback.textContent = 'Selecione pelo menos 1 pessoa.';
      } else if (totalNota > 0) {
        splitFeedback.className = 'split-feedback ok';
        splitFeedback.textContent = `${formatarMoeda(totalNota / marcados)} por pessoa (${marcados} selecionados)`;
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
        splitFeedback.textContent = `Soma digitada: ${formatarMoeda(soma)} (Informe o valor total acima)`;
      } else if (Math.abs(diff) < 0.01) {
        splitFeedback.className = 'split-feedback ok';
        splitFeedback.textContent = `✓ Valores batem exatos com o total (${formatarMoeda(totalNota)})`;
      } else if (diff > 0) {
        splitFeedback.className = 'split-feedback warn';
        splitFeedback.textContent = `Falta distribuir: ${formatarMoeda(diff)} (Alocado: ${formatarMoeda(soma)})`;
      } else {
        splitFeedback.className = 'split-feedback err';
        splitFeedback.textContent = `Passou do total em ${formatarMoeda(Math.abs(diff))}!`;
      }
    } else if (modoDivisaoAtual === 'cotas') {
      let totalCotas = 0;
      areaDivisaoDinamica.querySelectorAll('.input-split-cota').forEach((inp) => {
        totalCotas += parseFloat(inp.value) || 0;
      });

      splitFeedback.classList.remove('hidden');
      if (totalCotas <= 0) {
        splitFeedback.className = 'split-feedback err';
        splitFeedback.textContent = 'A soma das cotas deve ser maior que zero.';
      } else if (totalNota > 0) {
        splitFeedback.className = 'split-feedback ok';
        splitFeedback.textContent = `Total de ${totalCotas} cota(s) • 1 cota = ${formatarMoeda(totalNota / totalCotas)}`;
      } else {
        splitFeedback.className = 'split-feedback warn';
        splitFeedback.textContent = `Total de ${totalCotas} cota(s) configuradas.`;
      }
    }
  }

  splitModeTabs.addEventListener('click', (e) => {
    const tab = e.target.closest('.mode-tab');
    if (!tab) return;
    modoDivisaoAtual = tab.dataset.mode;
    renderizarControlesDivisao();
  });

  valorGasto.addEventListener('input', atualizarFeedbackDivisao);
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

    inputEditGastoId.value = gasto.id;
    descGasto.value = gasto.descricao;
    valorGasto.value = gasto.valor.toFixed(2);
    selectPagador.value = gasto.pagador;
    categoriaSelecionada = gasto.categoria || '';
    renderizarSeletorCategorias();

    cardFormGasto.classList.add('editing-mode');
    tituloFormGasto.textContent = 'Editar Despesa';
    btnCancelarEdicao.classList.remove('hidden');
    btnSubmitGasto.innerHTML = '✓ Atualizar Despesa';

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
    renderizarSeletorCategorias();
    cardFormGasto.classList.remove('editing-mode');
    tituloFormGasto.textContent = 'Registrar Novo Gasto';
    btnCancelarEdicao.classList.add('hidden');
    btnSubmitGasto.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      Salvar Despesa
    `;
    modoDivisaoAtual = 'igual';
    renderizarControlesDivisao();
  }

  btnCancelarEdicao.addEventListener('click', cancelarEdicaoGasto);

  formGasto.addEventListener('submit', (e) => {
    e.preventDefault();
    const grupo = getGrupoAtivo();
    const descricao = descGasto.value.trim();
    const valor = parseFloat(valorGasto.value);
    const pagador = selectPagador.value;
    const editId = inputEditGastoId.value ? Number(inputEditGastoId.value) : null;

    if (!pagador) {
      alert('Adicione participantes e selecione quem pagou.');
      return;
    }
    if (isNaN(valor) || valor <= 0) {
      alert('Informe um valor válido maior que zero.');
      return;
    }

    let participantes = [];
    let divisao = {};
    let cotasOriginais = null;

    if (modoDivisaoAtual === 'igual') {
      participantes = Array.from(
        areaDivisaoDinamica.querySelectorAll('input[type="checkbox"]:checked')
      ).map((cb) => cb.value);

      if (participantes.length === 0) {
        alert('Selecione pelo menos uma pessoa para dividir.');
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
        alert('Informe o valor de pelo menos um participante.');
        return;
      }

      if (Math.abs(valor - soma) >= 0.01) {
        alert(
          `A soma dos valores individuais (${formatarMoeda(soma)}) precisa ser igual ao valor total (${formatarMoeda(valor)}).`
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
        alert('A soma das cotas precisa ser maior que zero.');
        return;
      }

      const valorPorCota = valor / totalCotas;
      participantes.forEach((p) => {
        divisao[p] = cotasOriginais[p] * valorPorCota;
      });
    }

    if (editId) {
      const idx = grupo.gastos.findIndex((g) => g.id === editId);
      if (idx !== -1) {
        grupo.gastos[idx] = {
          ...grupo.gastos[idx],
          descricao,
          categoria: categoriaSelecionada,
          valor,
          pagador,
          modoDivisao: modoDivisaoAtual,
          participantes,
          divisao,
          cotasOriginais
        };
      }
      cancelarEdicaoGasto();
    } else {
      grupo.gastos.push({
        id: Date.now(),
        tipo: 'despesa',
        data: new Date().toLocaleDateString('pt-BR'),
        descricao,
        categoria: categoriaSelecionada,
        valor,
        pagador,
        modoDivisao: modoDivisaoAtual,
        participantes,
        divisao,
        cotasOriginais
      });
      descGasto.value = '';
      valorGasto.value = '';
      categoriaSelecionada = '';
      renderizarSeletorCategorias();
      modoDivisaoAtual = 'igual';
      descGasto.focus();
    }

    salvarDados();
  });

  // --- QUITAR CONTAS ---
  function abrirModalQuitar(dePreSelecionado = '', paraPreSelecionado = '', valorPreSelecionado = '') {
    const grupo = getGrupoAtivo();
    if (grupo.pessoas.length < 2) {
      alert('É preciso ter pelo menos 2 participantes no grupo para registrar um pagamento.');
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
      alert('Quem paga e quem recebe devem ser pessoas diferentes.');
      return;
    }

    if (isNaN(valor) || valor <= 0) {
      alert('Informe um valor válido maior que zero.');
      return;
    }

    grupo.gastos.push({
      id: Date.now(),
      tipo: 'pagamento',
      data: new Date().toLocaleDateString('pt-BR'),
      descricao: obs ? `Pagamento (${obs})` : 'Pagamento de acerto',
      valor: valor,
      pagador: de,
      participantes: [para],
      divisao: { [para]: valor }
    });

    modalQuitar.classList.add('hidden');
    salvarDados();
  });

  // Ações no Histórico (Editar ou Excluir)
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
      if (Number(inputEditGastoId.value) === id) {
        cancelarEdicaoGasto();
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

        const nomeCat = item.categoria || 'Sem categoria';
        gastosPorCategoria[nomeCat] = (gastosPorCategoria[nomeCat] || 0) + item.valor;

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

    relatorioTitulo.textContent = `Relatório • ${grupo.nome}`;

    const despesas = grupo.gastos.filter((g) => g.tipo !== 'pagamento');
    const pagamentos = grupo.gastos.filter((g) => g.tipo === 'pagamento');

    const categoriasOrdenadas = Object.entries(gastosPorCategoria).sort((a, b) => b[1] - a[1]);

    let html = `
      <div class="rel-section">
        <p><strong>Grupo:</strong> ${grupo.nome}  |  <strong>Data:</strong> ${dataEmissao}</p>
        <p><strong>Total Gasto em Despesas:</strong> ${formatarMoeda(totalGeralDespesas)}</p>
      </div>

      <div class="rel-section">
        <h3>1. Pendências Restantes (Quem paga quem)</h3>
        ${
          transacoes.length === 0
            ? '<p class="positivo"><strong>Tudo quitado! Nenhuma pendência restante.</strong></p>'
            : `<ul>${transacoes
                .map(
                  (t) =>
                    `<li><strong>${t.de}</strong> ainda deve <strong>${formatarMoeda(t.valor)}</strong> para <strong>${t.para}</strong></li>`
                )
                .join('')}</ul>`
        }
      </div>

      <div class="rel-section">
        <h3>2. Balanço Individual</h3>
        <table class="rel-table">
          <thead>
            <tr>
              <th>Participante</th>
              <th>Pagou</th>
              <th>Consumiu</th>
              <th>Acertos</th>
              <th>Saldo Final</th>
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
          <h3>3. Gastos por Categoria</h3>
          <table class="rel-table">
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Valor</th>
                <th>% do Total</th>
              </tr>
            </thead>
            <tbody>
              ${categoriasOrdenadas
                .map(([catNome, val]) => {
                  const pct =
                    totalGeralDespesas > 0 ? ((val / totalGeralDespesas) * 100).toFixed(1) : '0.0';
                  const catObj = getCategoriaObj(catNome);
                  const icone = catObj ? catObj.svg + ' ' : '';
                  return `
                    <tr>
                      <td style="display:flex; align-items:center; gap:6px;">${icone}<strong>${catNome}</strong></td>
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
        <h3>${categoriasOrdenadas.length > 0 ? '4' : '3'}. Extrato de Despesas (${despesas.length})</h3>
        ${
          despesas.length === 0
            ? '<p>Nenhuma despesa registrada.</p>'
            : `<table class="rel-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Descrição</th>
                    <th>Pagador</th>
                    <th>Valor</th>
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
                        ? `<span style="color:#0284c7; font-weight:600;">[${g.categoria}]</span> `
                        : '';
                      return `
                        <tr>
                          <td>${g.data || '-'}</td>
                          <td>${catTag}${g.descricao}<br><small style="color:#64748b">${detalhe}</small></td>
                          <td>${g.pagador}</td>
                          <td><strong>${formatarMoeda(g.valor)}</strong></td>
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
          <h3>${numSecao}. Pagamentos / Quitações Realizadas (${pagamentos.length})</h3>
          <table class="rel-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Movimentação</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              ${pagamentos
                .map(
                  (p) => `
                <tr>
                  <td>${p.data || '-'}</td>
                  <td><strong>${p.pagador}</strong> pagou para <strong>${p.participantes[0]}</strong> <small style="color:#64748b">(${p.descricao})</small></td>
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

    let txt = `*📊 RELATÓRIO DE DESPESAS: ${grupo.nome.toUpperCase()}*\n`;
    txt += `📅 Data: ${dataEmissao}\n`;
    txt += `💰 *Total em Despesas:* ${formatarMoeda(totalGeralDespesas)}\n\n`;

    txt += `*💸 SALDO PENDENTE (QUEM PAGA QUEM):*\n`;
    if (transacoes.length === 0) {
      txt += `✅ Tudo quitado!\n`;
    } else {
      transacoes.forEach((t) => {
        txt += `• *${t.de}* paga *${formatarMoeda(t.valor)}* para *${t.para}*\n`;
      });
    }

    if (categoriasOrdenadas.length > 0) {
      txt += `\n*🏷️ GASTOS POR CATEGORIA:*\n`;
      categoriasOrdenadas.forEach(([catNome, val]) => {
        const pct = totalGeralDespesas > 0 ? ((val / totalGeralDespesas) * 100).toFixed(0) : '0';
        txt += `• ${catNome}: ${formatarMoeda(val)} (${pct}%)\n`;
      });
    }

    if (pagamentos.length > 0) {
      txt += `\n*🤝 PAGAMENTOS JÁ REALIZADOS:*\n`;
      pagamentos.forEach((p) => {
        txt += `• ${p.pagador} ➔ ${p.participantes[0]}: ${formatarMoeda(p.valor)}\n`;
      });
    }

    txt += `\n*🧾 DESPESAS LANÇADAS:*\n`;
    despesas.forEach((g) => {
      const catStr = g.categoria ? `[${g.categoria}] ` : '';
      txt += `• ${catStr}${g.descricao}: ${formatarMoeda(g.valor)} (Pago por ${g.pagador})\n`;
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
      const original = btnCopiarTexto.textContent;
      btnCopiarTexto.textContent = '✅ Copiado!';
      setTimeout(() => (btnCopiarTexto.textContent = original), 2000);
    } catch (err) {
      alert('Não foi possível copiar automaticamente.');
    }
  });

  btnImprimir.addEventListener('click', () => window.print());

  // --- RENDERIZAÇÃO DO HISTÓRICO (COM FILTRO) ---
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
        '<li class="empty-state-text">Nenhum lançamento encontrado para este filtro.</li>';
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
                <strong><span class="badge-pagamento">Acerto</span>${g.pagador} pagou para ${g.participantes[0]}</strong>
                <small>${g.data ? g.data + ' • ' : ''}${g.descricao}</small>
              </div>
              <div class="gasto-right">
                <span class="gasto-valor pagamento-val">${formatarMoeda(g.valor)}</span>
                <button type="button" class="btn-icon-action btn-del-gasto" data-id="${g.id}" title="Estornar pagamento">✕</button>
              </div>
            </li>
          `;
        }

        const cotas = obterCotasEmReais(g);
        let badgeModo = '';
        let detalheDivisao = `Dividido com ${g.participantes.join(', ')}`;

        if (g.modoDivisao === 'exato') {
          badgeModo = '<span class="badge-modo">Exato</span>';
          detalheDivisao = Object.entries(cotas)
            .map(([p, v]) => `${p}: ${formatarMoeda(v)}`)
            .join(' • ');
        } else if (g.modoDivisao === 'cotas') {
          badgeModo = '<span class="badge-modo">Cotas</span>';
          detalheDivisao = Object.entries(cotas)
            .map(([p, v]) => `${p}: ${formatarMoeda(v)}`)
            .join(' • ');
        }

        const catObj = g.categoria ? getCategoriaObj(g.categoria) : null;
        const badgeCategoria = catObj
          ? `<span class="cat-badge-inline">${catObj.svg} ${catObj.nome}</span>`
          : '';

        return `
          <li class="gasto-item">
            <div class="gasto-info">
              <strong>${badgeCategoria}${g.descricao}${badgeModo}</strong>
              <small>${g.data ? g.data + ' • ' : ''}Pago por <b>${g.pagador}</b></small>
              <small>${detalheDivisao}</small>
            </div>
            <div class="gasto-right">
              <span class="gasto-valor">${formatarMoeda(g.valor)}</span>
              <button type="button" class="btn-icon-action btn-edit-gasto" data-id="${g.id}" title="Editar gasto">✎</button>
              <button type="button" class="btn-icon-action btn-del-gasto" data-id="${g.id}" title="Excluir gasto">✕</button>
            </div>
          </li>
        `;
      })
      .join('');
  }

  // --- RENDERIZAÇÃO GERAL ---
  function renderizarTudo() {
    const grupo = getGrupoAtivo();

    selectGrupo.innerHTML = appData.grupos
      .map(
        (g) =>
          `<option value="${g.id}" ${g.id === grupo.id ? 'selected' : ''}>${g.nome} (${g.gastos.length} lançamentos)</option>`
      )
      .join('');

    if (grupo.pessoas.length === 0) {
      listaPessoas.innerHTML =
        '<span class="empty-state-text">Nenhum participante cadastrado neste grupo.</span>';
      selectPagador.innerHTML = '<option value="">Adicione alguém acima</option>';
    } else {
      listaPessoas.innerHTML = grupo.pessoas
        .map(
          (p) => `
          <span class="tag">
            ${p}
            <button type="button" class="tag-remove" data-nome="${p}" title="Remover">×</button>
          </span>
        `
        )
        .join('');

      const pagadorAtual = selectPagador.value;
      selectPagador.innerHTML = grupo.pessoas
        .map(
          (p) =>
            `<option value="${p}" ${p === pagadorAtual ? 'selected' : ''}>${p}</option>`
        )
        .join('');
    }

    if (!inputEditGastoId.value) {
      renderizarControlesDivisao();
    }

    const { saldos, transacoes, totalGeralDespesas } = calcularAcertos(grupo);
    totalGrupoBadge.textContent = `Total Gasto: ${formatarMoeda(totalGeralDespesas)}`;

    if (grupo.pessoas.length === 0) {
      resumoSaldos.innerHTML =
        '<span class="empty-state-text">Cadastre participantes para ver os saldos.</span>';
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
        '<li class="empty-state-text" style="border:none; background:transparent; padding:0;">Tudo quitado! Nenhuma transferência pendente.</li>';
    } else {
      listaAcertos.innerHTML = transacoes
        .map(
          (t) => `
            <li>
              <span><strong>${t.de}</strong> deve <strong>${formatarMoeda(t.valor)}</strong> para <strong>${t.para}</strong></span>
              <button type="button" class="btn-quitar-rapido" data-de="${t.de}" data-para="${t.para}" data-valor="${t.valor}">✓ Quitar</button>
            </li>
          `
        )
        .join('');
    }

    renderizarHistorico();

    if (painelTotaisAberto) {
      renderizarPainelTotais();
    }
  }

  // Inicialização
  renderizarSeletorCategorias();
  inicializarFiltroCategorias();
  renderizarTudo();
});