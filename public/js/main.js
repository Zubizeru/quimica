// ========================================
// SCRIPT PRINCIPAL
// ========================================

document.addEventListener('DOMContentLoaded', () => {

  let selecionada = null;

  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);

  const card = $('.cardnomeelemento');
  const descricaoBox = $('.descricaodoelemento');
  const maisInfo = $('.maisinformacoes');
  const botaoMaisInfo = $('.icone-aumentar');
  const pesquisaWrapper = $('.busca'); // container geral
  const pesquisaInput = $('.campo-busca_input');
  const pesquisaResultados = $('.busca_resultados');
  const botaoLimparPesquisa = $('.campo-busca_limpar');
  const elementos = $$('.celula-elemento');
  const filtros = $$('.filtro-item');
  const body = document.body;
  const botaoTema = $('#botaoTema');
  const menu = $('.menuinicial');
  const botaoMenu = $('#botaoMenu');
  const linksMenu = $$('.links a');

  const atualizarAlturaMenu = () => {
    if (!menu) return;
    document.documentElement.style.setProperty('--menu-altura', `${menu.offsetHeight}px`);
  };

  atualizarAlturaMenu();
  window.addEventListener('resize', atualizarAlturaMenu);

  if (botaoMenu && menu) {
    botaoMenu.addEventListener('click', () => {
      const aberto = menu.classList.toggle('menu-aberto');
      menu.classList.remove('menu-oculto');
      botaoMenu.setAttribute('aria-expanded', aberto ? 'true' : 'false');

      const icone = botaoMenu.querySelector('i');
      if (icone) {
        icone.classList.toggle('fa-bars', !aberto);
        icone.classList.toggle('fa-xmark', aberto);
      }
    });

    linksMenu.forEach(link => {
      link.addEventListener('click', () => {
        if (!menu.classList.contains('menu-aberto')) return;
        menu.classList.remove('menu-aberto');
        botaoMenu.setAttribute('aria-expanded', 'false');
        const icone = botaoMenu.querySelector('i');
        if (icone) {
          icone.classList.remove('fa-xmark');
          icone.classList.add('fa-bars');
        }
      });
    });
  }

  if (menu) {
    let lastScrollY = window.scrollY || document.documentElement.scrollTop;
    let ticking = false;
    const threshold = 2;

    const onScroll = () => {
      const current = window.scrollY || document.documentElement.scrollTop;

      if (menu.classList.contains('menu-aberto')) {
        lastScrollY = current;
        return;
      }

      if (current <= 0) {
        menu.classList.remove('menu-oculto');
        lastScrollY = current;
        return;
      }

      if (current > lastScrollY + threshold) {
        menu.classList.add('menu-oculto');
      } else if (current < lastScrollY - threshold) {
        menu.classList.remove('menu-oculto');
      }

      lastScrollY = current;
    };

    window.addEventListener('scroll', () => {
      if (ticking) return;
      window.requestAnimationFrame(() => {
        onScroll();
        ticking = false;
      });
      ticking = true;
    }, { passive: true });
  }

  // =========================
  // CARTÃO DO ELEMENTO
  // =========================

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
    const alvo = document.querySelector(`.${classe} .info-value`);
    if (alvo) alvo.textContent = formatarValorComUnidade(valor, unidade);
  };

  function atualizarCartao(cell) {

    if (!cell || !card) return;

    const d = cell.dataset;

    const numero = $('.numeroCard');
    const simbolo = $('.simboloCard');
    const nome = $('.nomeCard');
    const massa = $('.massaCard');
    const camadas = $('.camadasCard');

    if (numero) numero.textContent = d.numero || '';
    if (simbolo) simbolo.textContent = d.simbolo || '';
    if (nome) nome.textContent = d.nome || '';
    if (massa) {
      const massaTexto = d.massa
        ? `${d.massa}${d.massaUnidade ? ` ${d.massaUnidade}` : ''}`
        : '';
      massa.textContent = massaTexto;
    }
    if (camadas) camadas.textContent = (d.camadas || '').split(',').join('\n');

    if (descricaoBox)
      descricaoBox.textContent = d.descricao || 'Sem descrição disponível';

    setInfoValue('massaatomica', d.massa, d.massaUnidade);
    setInfoValue('bloco', d.bloco);
    setInfoValue('configuracaoeletronica', d.configuracaoEletronica);
    setInfoValue('eletronegatividade', d.eletronegatividade);
    setInfoValue('densidade', d.densidade, d.densidadeUnidade);
    setInfoValue('pontodefusao', d.pontoFusao, d.pontoFusaoUnidade);
    setInfoValue('pontodeebulicao', d.pontoEbulicao, d.pontoEbulicaoUnidade);
    setInfoValue('periodo', d.periodo);
    setInfoValue('grupo', d.grupo);
    setInfoValue('anodedescoberta', d.anoDescoberta);

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
      card.style.border = '10px solid #33333325;';
      card.style.background = 'transparent';
      card.classList.remove('ativo');
    }

    if (descricaoBox)
      descricaoBox.textContent = '';

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

  function limparSelecao() {
    if (!selecionada) return;
    selecionada.classList.remove('selecionado');
    selecionada = null;
    resetarCartao();
  }

  function selecionarCelula(cell, { toggle = false } = {}) {
    if (!cell) return;

    if (selecionada && selecionada !== cell) {
      selecionada.classList.remove('selecionado');
    }

    if (toggle && selecionada === cell) {
      selecionada = null;
      resetarCartao();
      return;
    }

    cell.classList.add('selecionado');
    selecionada = cell;
    atualizarCartao(cell);
  }

  // =========================
  // INTERAÇÃO DOS ELEMENTOS
  // =========================

  elementos.forEach(cell => {

    cell.addEventListener('mouseenter', () => {
      if (!selecionada) atualizarCartao(cell);
    });

    cell.addEventListener('click', () => {
      selecionarCelula(cell, { toggle: true });
    });

  });

  if (botaoMaisInfo && maisInfo) {
    botaoMaisInfo.addEventListener('click', () => {
      const aberto = maisInfo.classList.toggle('aberta');
      botaoMaisInfo.setAttribute('aria-expanded', aberto ? 'true' : 'false');
    });
  }

  // =========================
  // PESQUISA DE ELEMENTOS
  // =========================
  if (pesquisaWrapper && pesquisaInput && pesquisaResultados) {
    const normalizarTexto = texto => texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const listaElementos = Array.from(elementos)
      .filter(el => el.dataset.numero && el.dataset.simbolo)
      .map(el => ({
        numero: el.dataset.numero,
        nome: el.dataset.nome || '',
        simbolo: el.dataset.simbolo || '',
        cell: el
      }));

    const fecharResultados = () => {
      pesquisaWrapper.classList.remove('busca--aberta');
      pesquisaResultados.innerHTML = '';
    };

    const abrirResultados = () => {
      pesquisaWrapper.classList.add('busca--aberta');
    };

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
            <span class="busca_meta">${item.nome} - Nº ${item.numero}</span>
          </span>
        `;
        botao.addEventListener('click', (event) => {
          event.stopPropagation();
          selecionarCelula(item.cell);
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
        return nome.includes(termoNormalizado)
          || simbolo.includes(termoNormalizado)
          || numero.startsWith(termoNormalizado);
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

    document.addEventListener('click', (event) => {
      const caminho = event.composedPath ? event.composedPath() : [];
      const dentroPesquisa = caminho.some(node => node instanceof Element && node.classList?.contains('busca'));
      if (!dentroPesquisa) {
        fecharResultados();
      }
    });
  }

  // =========================
  // MODO ESCURO
  // =========================

  const iconeTema = document.querySelector("#iconeTema");

  // carregar tema salvo
  if (localStorage.getItem("tema") === "escuro") {
    body.classList.add("escuro");
    iconeTema.classList.replace("fa-sun", "fa-moon");
  }

  botaoTema.addEventListener("click", () => {

    body.classList.toggle("escuro");

    if (body.classList.contains("escuro")) {
      iconeTema.classList.replace("fa-sun", "fa-moon");
      localStorage.setItem("tema", "escuro");
    } else {
      iconeTema.classList.replace("fa-moon", "fa-sun");
      localStorage.setItem("tema", "claro");
    }

  });

  // =========================
  // FILTROS
  // =========================

  let filtroAtivo = null;

  function aplicarFiltro(categoria) {
    elementos.forEach(el => {
      const ativo = el.dataset.categoria === categoria;
      el.style.opacity = ativo ? "1" : "0.15";
      el.style.transform = ativo ? "scale(1.05)" : "scale(1)";
      el.style.zIndex = ativo ? "2" : "1";
    });
  }

  function limparFiltro() {
    elementos.forEach(el => {
      el.style.opacity = "1";
      el.style.transform = "scale(1)";
      el.style.zIndex = "1";
    });
  }

  filtros.forEach(filtro => {

    filtro.addEventListener('mouseenter', () => {
      if (filtroAtivo) return;
      aplicarFiltro(filtro.id);
    });

    filtro.addEventListener('mouseleave', () => {
      if (filtroAtivo) return;
      limparFiltro();
    });

    filtro.addEventListener('click', () => {
      const categoria = filtro.id;

      if (filtroAtivo === categoria) {
        filtroAtivo = null;
        filtro.classList.remove('ativo');
        limparFiltro();
        return;
      }

      filtroAtivo = categoria;
      filtros.forEach(f => f.classList.remove('ativo'));
      filtro.classList.add('ativo');
      aplicarFiltro(categoria);
    });

  });

  /* Script tooltip global */


  // clicar fora para limpar seleção
  document.addEventListener('click', (event) => {
    const caminho = event.composedPath ? event.composedPath() : [];
    const dentroPesquisa = caminho.some(node => node instanceof Element && node.classList?.contains('busca')); // evitar fechar ao clicar dentro da pesquisa
    const dentroCelula = caminho.some(node => node instanceof Element && node.classList?.contains('celula-elemento')); // evitar fechar ao clicar dentro de uma célula
    const dentroCard = caminho.some(node => node instanceof Element && node.classList?.contains('cardelemento')); // evitar fechar ao clicar dentro do cartão
    const dentroFiltro = caminho.some(node => node instanceof Element && node.classList?.contains('filtragem')); // evitar fechar ao clicar dentro da área de filtros

    if (!dentroPesquisa && !dentroCelula && !dentroCard && !dentroFiltro) {
      limparSelecao();
    }
  });

});
