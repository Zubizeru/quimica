// ========================================
// SCRIPT TABELA PERIÓDICA
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  // ========================================
  // 1) Seletores do DOM
  // ========================================
  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);

  const card = $('.cardnomeelemento');
  const descricaoBox = $('.descricaodoelemento');
  const maisInfo = $('.maisinformacoes');
  const botaoMaisInfo = $('.icone-aumentar');
  const infoGrid = $('.maisinformacoes-grid');
  const pesquisaWrapper = $('.busca');
  const pesquisaInput = $('.campo-busca_input');
  const pesquisaResultados = $('.busca_resultados');
  const botaoLimparPesquisa = $('.campo-busca_limpar');
  const elementos = $$('.celula-elemento');
  const filtros = $$('.filtro-item');

  // ========================================
  // 2) Estado
  // ========================================
  let ultimaCelula = null;
  let elementosPorNumero = {};
  let elementosPorSimbolo = {};
  let elementosCarregados = false;
  let fecharResultados = null;

  // ========================================
  // 3) Utilitários de dados
  // ========================================
  const dentroDe = (alvo, seletores) => {
    if (!(alvo instanceof Element)) return false;
    return seletores.some((selector) => alvo.closest(selector));
  };

  const normalizarValorTexto = (valor) => {
    if (valor === null || valor === undefined) return '';
    if (Array.isArray(valor)) return valor.join(',');
    return String(valor).trim();
  };

  const escolherValor = (datasetValor, jsonValor) => {
    const textoDataset = normalizarValorTexto(datasetValor);
    if (textoDataset) return textoDataset;
    return normalizarValorTexto(jsonValor);
  };

  const obterElementoJson = (dataset) => {
    if (!elementosCarregados || !dataset) return null;
    const numero = parseInt(dataset.numero, 10);
    if (Number.isFinite(numero) && elementosPorNumero[numero]) {
      return elementosPorNumero[numero];
    }
    if (dataset.simbolo && elementosPorSimbolo[dataset.simbolo]) {
      return elementosPorSimbolo[dataset.simbolo];
    }
    return null;
  };

  // ========================================
  // 4) Carregamento de elementos
  // ========================================
  const carregarElementos = async () => {
    try {
      const resposta = await fetch('/data/elementos.json', { cache: 'reload' });
      if (!resposta.ok) throw new Error('Falha ao carregar elementos.json');
      const data = await resposta.json();
      elementosPorNumero = {};
      elementosPorSimbolo = {};
      data.forEach((item) => {
        if (item.numero !== null && item.numero !== undefined) {
          elementosPorNumero[item.numero] = item;
        }
        if (item.simbolo) {
          elementosPorSimbolo[item.simbolo] = item;
        }
      });
      elementosCarregados = true;
      if (ultimaCelula) atualizarCartao(ultimaCelula);
    } catch (erro) {
      console.warn('NÃ£o foi possÃ­vel carregar elementos.json', erro);
    }
  };

  const formatarValor = (valor) => {
    if (valor === null || valor === undefined) return 'N/A';
    const texto = String(valor).trim();
    return texto === '' || texto === '-' ? 'N/A' : texto;
  };

  const formatarValorComUnidade = (valor, unidade) => {
    const base = formatarValor(valor);
    if (base === 'N/A') return 'N/A';
    const unidadeTexto = unidade ? String(unidade).trim() : '';
    return unidadeTexto ? `${base} ${unidadeTexto}` : base;
  };

  const setInfoValue = (classe, valor, unidade) => {
    const contexto = infoGrid || document;
    const alvo = contexto.querySelector(`.${classe} .info-value`);
    if (alvo) alvo.textContent = formatarValorComUnidade(valor, unidade);
  };

  // ========================================
  // 5) Cartão de detalhes
  // ========================================
  function atualizarCartao(cell) {
    if (!cell || !card) return;

    ultimaCelula = cell;

    const d = cell.dataset;
    const dadosJson = obterElementoJson(d);

    const numeroTexto = escolherValor(d.numero, dadosJson?.numero);
    const simboloTexto = escolherValor(d.simbolo, dadosJson?.simbolo);
    const nomeTexto = escolherValor(d.nome, dadosJson?.nome);
    const massaValor = escolherValor(d.massa, dadosJson?.massa_molar);
    const massaUnidade = escolherValor(d.massaUnidade, dadosJson?.massa_molar_unidade);
    const camadasTexto = escolherValor(
      d.camadas,
      Array.isArray(dadosJson?.camadas) ? dadosJson.camadas.join(',') : dadosJson?.camadas
    );
    const descricaoTexto = escolherValor(d.descricao, dadosJson?.descricao);

    const numero = $('.numeroCard');
    const simbolo = $('.simboloCard');
    const nome = $('.nomeCard');
    const massa = $('.massaCard');
    const camadas = $('.camadasCard');

    if (numero) numero.textContent = numeroTexto || '';
    if (simbolo) simbolo.textContent = simboloTexto || '';
    if (nome) nome.textContent = nomeTexto || '';
    if (massa) {
      const massaTexto = massaValor ? `${massaValor}${massaUnidade ? ` ${massaUnidade}` : ''}` : '';
      massa.textContent = massaTexto;
    }
    if (camadas) camadas.textContent = camadasTexto ? camadasTexto.split(',').join('\n') : '';

    if (descricaoBox) {
      descricaoBox.textContent = descricaoTexto || 'Sem descriÃ§Ã£o disponÃ­vel';
    }

    setInfoValue('massaatomica', massaValor, massaUnidade);
    setInfoValue('bloco', escolherValor(d.bloco, dadosJson?.bloco));
    setInfoValue('configuracaoeletronica', escolherValor(d.configuracaoEletronica, dadosJson?.configuracao_eletronica));
    setInfoValue('eletronegatividade', escolherValor(d.eletronegatividade, dadosJson?.eletronegatividade));
    setInfoValue(
      'densidade',
      escolherValor(d.densidade, dadosJson?.densidade),
      escolherValor(d.densidadeUnidade, dadosJson?.densidade_unidade)
    );
    setInfoValue(
      'pontodefusao',
      escolherValor(d.pontoFusao, dadosJson?.ponto_fusao),
      escolherValor(d.pontoFusaoUnidade, dadosJson?.ponto_fusao_unidade)
    );
    setInfoValue(
      'pontodeebulicao',
      escolherValor(d.pontoEbulicao, dadosJson?.ponto_ebulicao),
      escolherValor(d.pontoEbulicaoUnidade, dadosJson?.ponto_ebulicao_unidade)
    );
    setInfoValue('periodo', escolherValor(d.periodo, dadosJson?.periodo));
    setInfoValue('grupo', escolherValor(d.grupo, dadosJson?.grupo));
    setInfoValue('anodedescoberta', escolherValor(d.anoDescoberta, dadosJson?.ano_descoberta));

    card.classList.add('ativo');

    const bg = getComputedStyle(cell).backgroundColor;
    card.style.background = bg;

    const rgb = bg.match(/\d+/g);
    if (rgb) {
      const brilho = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
      card.style.color = brilho < 125 ? '#fff' : '#000';
    }
  }

  function resetarCartao() {
    const numero = $('.numeroCard');
    const simbolo = $('.simboloCard');
    const nome = $('.nomeCard');
    const massa = $('.massaCard');
    const camadas = $('.camadasCard');

    if (numero) numero.textContent = '';
    if (simbolo) simbolo.textContent = '';
    if (nome) nome.textContent = 'Nome do elemento';
    if (massa) massa.textContent = '';
    if (camadas) camadas.textContent = '';

    if (card) {
      card.style.color = 'var(--cor-secundaria)';
      card.style.border = '10px solid #33333325';
      card.style.background = 'transparent';
      card.classList.remove('ativo');
    }

    if (descricaoBox) descricaoBox.textContent = '';

    setInfoValue('massaatomica', '');
    setInfoValue('bloco', '');
    setInfoValue('configuracaoeletronica', '');
    setInfoValue('eletronegatividade', '');
    setInfoValue('densidade', '');
    setInfoValue('pontodefusao', '');
    setInfoValue('pontodeebulicao', '');
    setInfoValue('periodo', '');
    setInfoValue('grupo', '');
    setInfoValue('anodedescoberta', '');
  }

  // ========================================
  // 6) Seleção de células
  // ========================================
  function limparSelecao() {
    const selecionada = document.querySelector('.celula-elemento.selecionado');
    if (!selecionada) return;
    selecionada.classList.remove('selecionado');
    resetarCartao();
  }

  function selecionarCelula(cell, { toggle = false } = {}) {
    if (!cell) return;
    const selecionada = document.querySelector('.celula-elemento.selecionado');
    if (selecionada && selecionada !== cell) selecionada.classList.remove('selecionado');

    if (toggle && selecionada === cell) {
      selecionada.classList.remove('selecionado');
      resetarCartao();
      return;
    }

    cell.classList.add('selecionado');
    atualizarCartao(cell);
  }

  elementos.forEach(cell => {
    cell.addEventListener('mouseenter', () => {
      if (!document.querySelector('.celula-elemento.selecionado')) atualizarCartao(cell);
    });
    cell.addEventListener('click', () => selecionarCelula(cell, { toggle: true }));
  });

  // ========================================
  // 7) Eventos globais
  // ========================================
  document.addEventListener('pointerdown', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    if (fecharResultados && !target.closest('.busca')) fecharResultados();

    const zonasSeguras = [
      '.celula-elemento',
      '.busca',
      '.filtro-item',
      '.icone-aumentar',
      '.maisinformacoes'
    ];

    if (!dentroDe(target, zonasSeguras)) limparSelecao();
  });

  if (botaoMaisInfo && maisInfo) {
    botaoMaisInfo.addEventListener('click', () => {
      const aberto = maisInfo.classList.toggle('aberta');
      botaoMaisInfo.setAttribute('aria-expanded', aberto ? 'true' : 'false');
    });
  }

  // ========================================
  // 8) Busca e autocomplete
  // ========================================
  if (pesquisaWrapper && pesquisaInput && pesquisaResultados) {
    const normalizarTexto = texto => texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const listaElementos = Array.from(elementos)
      .filter(el => el.dataset.numero && el.dataset.simbolo)
      .map(el => ({
        numero: el.dataset.numero,
        nome: el.dataset.nome || '',
        simbolo: el.dataset.simbolo || ''
      }));

    fecharResultados = () => {
      pesquisaWrapper.classList.remove('busca--aberta');
      pesquisaResultados.innerHTML = '';
    };

    const abrirResultados = () => pesquisaWrapper.classList.add('busca--aberta');

    const atualizarBotaoLimpar = () => {
      const temValor = pesquisaInput.value.trim().length > 0;
      pesquisaWrapper.classList.toggle('busca--com-valor', temValor);
    };

    const renderizarResultados = (resultados) => {
      pesquisaResultados.innerHTML = '';
      if (!resultados.length) {
        const vazio = document.createElement('div');
        vazio.className = 'busca_vazio';
        vazio.textContent = 'Nenhum elemento encontrado';
        pesquisaResultados.appendChild(vazio);
        abrirResultados();
        return;
      }

      resultados.forEach(item => {
        const botao = document.createElement('button');
        botao.type = 'button';
        botao.className = 'busca_item';
        botao.setAttribute('role', 'option');
        botao.innerHTML = `
          <span class="busca_simbolo">${item.simbolo}</span>
          <span class="busca_info">
            <span class="busca_nome">${item.nome}</span>
            <span class="busca_meta">${item.nome} - NÂº ${item.numero}</span>
          </span>
        `;
        botao.addEventListener('click', () => {
          const cell = document.querySelector(`.celula-elemento[data-numero="${item.numero}"]`)
            || document.querySelector(`.celula-elemento[data-simbolo="${item.simbolo}"]`);
          selecionarCelula(cell);
          pesquisaInput.value = item.nome;
          atualizarBotaoLimpar();
          fecharResultados();
        });
        pesquisaResultados.appendChild(botao);
      });

      abrirResultados();
    };

    const filtrarResultados = () => {
      const termo = pesquisaInput.value.trim();
      atualizarBotaoLimpar();
      if (!termo) {
        fecharResultados();
        return;
      }

      const termoNormalizado = normalizarTexto(termo);
      const resultados = listaElementos.filter(item => {
        const nome = normalizarTexto(item.nome);
        const simbolo = normalizarTexto(item.simbolo);
        const numero = item.numero.toString();
        return nome.includes(termoNormalizado) || simbolo.includes(termoNormalizado) || numero.startsWith(termoNormalizado);
      }).slice(0, 12);

      renderizarResultados(resultados);
    };

    pesquisaInput.addEventListener('input', filtrarResultados);
    pesquisaInput.addEventListener('focus', filtrarResultados);

    if (botaoLimparPesquisa) {
      botaoLimparPesquisa.addEventListener('click', () => {
        pesquisaInput.value = '';
        atualizarBotaoLimpar();
        fecharResultados();
        pesquisaInput.focus();
      });
    }

  }

  // ========================================
  // 9) Filtros
  // ========================================
  let filtroAtivo = null;

  const aplicarFiltro = (categoria) => {
    elementos.forEach(el => {
      const ativo = el.dataset.categoria === categoria;
      el.style.opacity = ativo ? '1' : '0.15';
      el.style.transform = ativo ? 'scale(1.05)' : 'scale(1)';
      el.style.zIndex = ativo ? '2' : '1';
    });
  };

  const limparFiltro = () => {
    elementos.forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'scale(1)';
      el.style.zIndex = '1';
    });
  };

  filtros.forEach(filtro => {
    filtro.addEventListener('mouseenter', () => { if (!filtroAtivo) aplicarFiltro(filtro.id); });
    filtro.addEventListener('mouseleave', () => { if (!filtroAtivo) limparFiltro(); });
    filtro.addEventListener('click', () => {
      const categoria = filtro.id;
      if (filtroAtivo === categoria) { filtroAtivo = null; filtro.classList.remove('ativo'); limparFiltro(); return; }
      filtroAtivo = categoria;
      filtros.forEach(f => f.classList.remove('ativo'));
      filtro.classList.add('ativo');
      aplicarFiltro(categoria);
    });
  });

  // ========================================
  // 10) Inicialização
  // ========================================
  carregarElementos();
});

