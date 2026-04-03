// ========================================
// ESTRUTURA ATOMICA (CLIENTE)
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  // ========================================
  // 1) Seletores do DOM
  // ========================================
  const formulaInput = document.querySelector('#estruturaAtomicaInput');
  if (!formulaInput) return;

  const formulaErro = document.querySelector('#estruturaAtomicaFormulaErro');
  const formulaCampo = document.querySelector('#conversorFormulaCampo');
  const resultadosContainer = formulaCampo ? formulaCampo.querySelector('.busca_resultados') : null;

  const elementosContainer = document.querySelector('#elementosComuns');

  const resumoSimbolo = document.querySelector('#estruturaAtomicaResumoSimbolo');
  const resumoNome = document.querySelector('#estruturaAtomicaResumoNome');
  const resumoCategoria = document.querySelector('#estruturaAtomicaResumoCategoria');
  const resumoMassa = document.querySelector('#estruturaAtomicaResumoMassa');
  const resumoProtons = document.querySelector('#estruturaAtomicaResumoProtons');
  const resumoNeutrons = document.querySelector('#estruturaAtomicaResumoNeutrons');
  const resumoEletrons = document.querySelector('#estruturaAtomicaResumoEletrons');

  const configAbreviada = document.querySelector('#estruturaAtomicaConfigAbreviada');
  const configExpandida = document.querySelector('#estruturaAtomicaConfigExpandida');

  const orbitasContainer = document.querySelector('#estruturaAtomicaOrbitas');
  const nucleoSimbolo = document.querySelector('#estruturaAtomicaNucleoSimbolo');
  const camadasLista = document.querySelector('#estruturaAtomicaCamadasLista');

  const paulingLista = document.querySelector('#estruturaAtomicaPaulingLista');

  const valenciaLabel = document.querySelector('#estruturaAtomicaValenciaLabel');
  const valenciaValor = document.querySelector('#estruturaAtomicaValenciaValor');
  const valenciaDots = document.querySelector('#estruturaAtomicaValenciaDots');
  const valenciaTexto = document.querySelector('#estruturaAtomicaValenciaTexto');

  const quimica = window.QuimicaUtils;
  if (!quimica) return;

  const { ELEMENTOS, renderElementos: renderElementosBase } = quimica;

  // ========================================
  // 2) Estado
  // ========================================
  let elementosMap = {};
  let elementosPorNumero = {};
  let elementosPorNome = {};
  let elementosPorSimbolo = {};
  let listaBusca = [];
  let botoesElementos = {};
  let botaoSelecionado = null;

  const letrasCamadas = ['K', 'L', 'M', 'N', 'O', 'P', 'Q'];
  const coresEletrons = [
    'var(--texto-destaque)',
    'var(--categoria-metal-transicao)',
    'var(--categoria-halogenio)',
    'var(--categoria-alcalino)',
    'var(--categoria-gas-nobre)',
    'var(--categoria-metaloide)',
    'var(--categoria-pos-transicao)'
  ];

  const orbitaisPorSubnivel = {
    s: 1,
    p: 3,
    d: 5,
    f: 7
  };
  const ordemPauling = [
    '1s', '2s', '2p', '3s', '3p', '4s', '3d', '4p', '5s', '4d', '5p',
    '6s', '4f', '5d', '6p', '7s', '5f', '6d', '7p'
  ];

  const categoriasMap = {
    'metal-alcalino': 'Metal alcalino',
    'metal-alcalino-terroso': 'Metal alcalino-terroso',
    'metal-transicao': 'Metal de transicao',
    'metal-pos-transicao': 'Metal pos-transicao',
    metaloide: 'Metaloide',
    'nao-metal': 'Nao metal',
    halogenio: 'Halogenio',
    'gas-nobre': 'Gas nobre',
    lantanideo: 'Lantanideo',
    actinideo: 'Actinideo',
    outro: 'Outro'
  };

  const configExpansoes = {
    He: '1s2',
    Ne: '1s2 2s2 2p6',
    Ar: '1s2 2s2 2p6 3s2 3p6',
    Kr: '1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p6',
    Cd: '1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p6 4d10 5s2',
    Xe: '1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p6 4d10 5s2 5p6',
    Hg: '1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p6 4d10 5s2 5p6 4f14 5d10 6s2',
    Rn: '1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p6 4d10 5s2 5p6 4f14 5d10 6s2 6p6',
    Og: '1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p6 4d10 5s2 5p6 4f14 5d10 6s2 6p6 5f14 6d10 7s2 7p6'
  };

  // ========================================
  // 3) Helpers de UI
  // ========================================
  const setErro = (el, wrapper, mensagem) => {
    if (el) {
      el.textContent = mensagem || '';
      el.hidden = !mensagem;
    }
    if (wrapper) {
      wrapper.classList.toggle('estruturaatomica_campo--erro', Boolean(mensagem));
    }
  };

  const setFormulaErro = (mensagem) => setErro(formulaErro, formulaCampo, mensagem);

  const normalizarTexto = (texto) =>
    String(texto || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const formatarMassa = (valor, unidade) => {
    const num = Number(valor);
    if (!Number.isFinite(num)) return '--';
    const texto = num < 10 ? num.toFixed(3) : num < 100 ? num.toFixed(2) : num.toFixed(1);
    const unidadeTexto = unidade ? String(unidade).trim() : 'u';
    return `${texto} ${unidadeTexto}`.trim();
  };

  const formatarConfiguracaoHTML = (texto) => {
    const limpo = String(texto || '').replace(/[^A-Za-z0-9\[\]\s().-]/g, '');
    return limpo.replace(/([spdf])(\d+)/gi, '$1<sup>$2</sup>');
  };

  const expandirConfiguracao = (configuracao) => {
    if (!configuracao) return '';
    return configuracao
      .replace(/\[(He|Ne|Ar|Kr|Xe|Rn|Og)\]/g, (match, gas) => configExpansoes[gas] || match)
      .replace(/\s+/g, ' ')
      .trim();
  };

  const limparSelecao = () => {
    if (botaoSelecionado) botaoSelecionado.classList.remove('is-ativo');
    botaoSelecionado = null;
  };

  // ========================================
  // 4) Renderizacao de detalhes
  // ========================================
  const limparDetalhes = () => {
    if (resumoSimbolo) resumoSimbolo.textContent = '--';
    if (resumoNome) resumoNome.textContent = 'Selecione um elemento';
    if (resumoCategoria) resumoCategoria.textContent = 'Categoria: --';
    if (resumoMassa) resumoMassa.textContent = 'Massa: --';
    if (resumoProtons) resumoProtons.textContent = '-';
    if (resumoNeutrons) resumoNeutrons.textContent = '-';
    if (resumoEletrons) resumoEletrons.textContent = '-';

    if (configAbreviada) configAbreviada.textContent = '--';
    if (configExpandida) configExpandida.textContent = '--';

    if (nucleoSimbolo) nucleoSimbolo.textContent = '--';
    if (camadasLista) camadasLista.textContent = 'Camadas: --';

    if (orbitasContainer) orbitasContainer.innerHTML = '';
    if (paulingLista) paulingLista.innerHTML = '';

    if (valenciaLabel) valenciaLabel.textContent = 'Ultima camada (--)';
    if (valenciaValor) valenciaValor.textContent = '-';
    if (valenciaDots) valenciaDots.innerHTML = '';
    if (valenciaTexto) valenciaTexto.textContent = 'Selecione um elemento para ver os eletrons de valencia.';

    limparSelecao();
  };

  const renderizarOrbitas = (camadas) => {
    if (!orbitasContainer) return;
    orbitasContainer.innerHTML = '';

    if (!Array.isArray(camadas) || !camadas.length) return;

    const total = camadas.length;
    const tamanhoMin = 90;
    const tamanhoMax = 220;
    const passo = total > 1 ? (tamanhoMax - tamanhoMin) / (total - 1) : 0;

    camadas.forEach((quantidade, index) => {
      const tamanho = Math.round(tamanhoMin + (index * passo));
      const orbita = document.createElement('div');
      orbita.className = 'estruturaatomica_orbita';
      orbita.style.width = `${tamanho}px`;
      orbita.style.height = `${tamanho}px`;
      orbita.style.zIndex = `${index + 1}`;
      orbitasContainer.appendChild(orbita);

      const eletrons = Number(quantidade);
      if (!Number.isFinite(eletrons) || eletrons <= 0) return;

      const raio = tamanho / 2 - 10;
      const cor = coresEletrons[index % coresEletrons.length];

      for (let i = 0; i < eletrons; i += 1) {
        const angulo = (360 / eletrons) * i;
        const eletron = document.createElement('span');
        eletron.className = 'estruturaatomica_eletron';
        eletron.style.transform = `translate(-50%, -50%) rotate(${angulo}deg) translate(${raio}px)`;
        eletron.style.background = cor;
        orbita.appendChild(eletron);
      }
    });
  };

  const renderizarCamadas = (camadas) => {
    if (!camadasLista) return;
    camadasLista.innerHTML = '';

    if (!Array.isArray(camadas) || !camadas.length) {
      camadasLista.textContent = 'Camadas: --';
      return;
    }

    camadas.forEach((valor, index) => {
      const letra = letrasCamadas[index] || `N${index + 1}`;
      const tag = document.createElement('span');
      tag.className = 'estruturaatomica_camada-tag';
      tag.innerHTML = `Camada ${letra}: <strong>${valor}e-</strong>`;
      camadasLista.appendChild(tag);
    });
  };

  const parseConfiguracao = (configuracao) => {
    if (!configuracao) return {};
    const tokens = configuracao
      .replace(/\([^)]*\)/g, '')
      .replace(/\[.*?\]/g, '')
      .match(/\d+[spdf]\d+/gi) || [];

    return tokens.reduce((acc, token) => {
      const match = token.match(/(\d+)([spdf])(\d+)/i);
      if (!match) return acc;
      const chave = `${match[1]}${match[2].toLowerCase()}`;
      const quantidade = Number(match[3]);
      if (!Number.isFinite(quantidade)) return acc;
      acc[chave] = (acc[chave] || 0) + quantidade;
      return acc;
    }, {});
  };
  const renderizarPauling = (configuracao) => {
    if (!paulingLista) return;
    paulingLista.innerHTML = '';

    const contagens = parseConfiguracao(configuracao);
    const ordem = ordemPauling.filter((chave) => (contagens[chave] || 0) > 0);
    const extras = Object.keys(contagens).filter((chave) => (contagens[chave] || 0) > 0 && !ordemPauling.includes(chave));
    const lista = ordem.concat(extras);

    if (!lista.length) {
      const vazio = document.createElement('div');
      vazio.className = 'estruturaatomica_pauling-linha';
      vazio.textContent = '--';
      paulingLista.appendChild(vazio);
      return;
    }

    lista.forEach((chave) => {
      const match = chave.match(/(\d+)([spdf])/i);
      if (!match) return;
      const nivel = match[1];
      const subnivel = match[2].toLowerCase();
      const eletronsNumero = contagens[chave] || 0;

      const linha = document.createElement('div');
      linha.className = 'estruturaatomica_pauling-linha';

      const titulo = document.createElement('span');
      titulo.className = 'estruturaatomica_pauling-nivel';
      titulo.textContent = `${nivel}${subnivel}`;

      const orbitais = document.createElement('div');
      orbitais.className = 'estruturaatomica_pauling-orbitais';

      const totalOrbitais = orbitaisPorSubnivel[subnivel] || 1;
      const ocupacao = Array.from({ length: totalOrbitais }, () => 0);
      let restantes = eletronsNumero;
      for (let i = 0; i < totalOrbitais && restantes > 0; i += 1) {
        ocupacao[i] += 1;
        restantes -= 1;
      }
      for (let i = 0; i < totalOrbitais && restantes > 0; i += 1) {
        ocupacao[i] += 1;
        restantes -= 1;
      }

      for (let i = 0; i < totalOrbitais; i += 1) {
        const orbital = document.createElement('span');
        orbital.className = 'estruturaatomica_pauling-orbital';

        if (ocupacao[i] >= 1) {
          const up = document.createElement('span');
          up.textContent = '↑';
          orbital.appendChild(up);
        }
        if (ocupacao[i] >= 2) {
          const down = document.createElement('span');
          down.textContent = '↓';
          orbital.appendChild(down);
        }

        orbitais.appendChild(orbital);
      }

      const contagem = document.createElement('span');
      contagem.className = 'estruturaatomica_pauling-contagem';
      contagem.textContent = `(${eletronsNumero}e-)`;

      linha.appendChild(titulo);
      linha.appendChild(orbitais);
      linha.appendChild(contagem);
      paulingLista.appendChild(linha);
    });
  };
  const atualizarBotaoSelecionado = (simbolo) => {
    if (botaoSelecionado) botaoSelecionado.classList.remove('is-ativo');
    botaoSelecionado = null;

    if (!simbolo) return;
    const chave = normalizarTexto(simbolo);
    const botao = botoesElementos[chave];
    if (botao) {
      botao.classList.add('is-ativo');
      botaoSelecionado = botao;
    }
  };

  const atualizarDetalhes = (elemento) => {
    if (!elemento) {
      limparDetalhes();
      return;
    }

    const numero = Number(elemento.numero);
    const massa = Number(elemento.massa_molar);
    const neutrons = Number.isFinite(numero) && Number.isFinite(massa)
      ? Math.max(0, Math.round(massa) - numero)
      : null;

    const categoriaKey = elemento.categoria_filtro || elemento.categoria || elemento.category || '';
    const categoriaTexto = categoriasMap[categoriaKey] || categoriaKey || '--';

    if (resumoSimbolo) resumoSimbolo.textContent = elemento.simbolo || '--';
    if (resumoNome) resumoNome.textContent = elemento.nome || 'Elemento';
    if (resumoCategoria) resumoCategoria.textContent = `Categoria: ${categoriaTexto}`;
    if (resumoMassa) resumoMassa.textContent = `Massa: ${formatarMassa(elemento.massa_molar, elemento.massa_molar_unidade)}`;

    if (resumoProtons) resumoProtons.textContent = Number.isFinite(numero) ? numero.toString() : '-';
    if (resumoNeutrons) resumoNeutrons.textContent = Number.isFinite(neutrons) ? neutrons.toString() : '-';
    if (resumoEletrons) resumoEletrons.textContent = Number.isFinite(numero) ? numero.toString() : '-';

    const configBase = elemento.configuracao_eletronica || '';
    const configExpandidaTexto = expandirConfiguracao(configBase);

    if (configAbreviada) {
      const html = configBase ? formatarConfiguracaoHTML(configBase) : '--';
      configAbreviada.innerHTML = html;
    }

    if (configExpandida) {
      const html = configExpandidaTexto ? formatarConfiguracaoHTML(configExpandidaTexto) : '--';
      configExpandida.innerHTML = html;
    }

    if (nucleoSimbolo) nucleoSimbolo.textContent = elemento.simbolo || '--';

    const camadas = Array.isArray(elemento.camadas) ? elemento.camadas : [];
    renderizarOrbitas(camadas);
    renderizarCamadas(camadas);

    renderizarPauling(configExpandidaTexto || configBase);

    const valencia = camadas.length ? camadas[camadas.length - 1] : null;
    const letraValencia = camadas.length ? (letrasCamadas[camadas.length - 1] || '') : '';

    if (valenciaLabel) {
      valenciaLabel.textContent = letraValencia ? `Ultima camada (${letraValencia})` : 'Ultima camada (--)';
    }

    if (valenciaValor) {
      valenciaValor.textContent = valencia !== null && valencia !== undefined ? String(valencia) : '-';
    }

    if (valenciaDots) {
      valenciaDots.innerHTML = '';
      const totalDots = 8;
      for (let i = 1; i <= totalDots; i += 1) {
        const dot = document.createElement('span');
        dot.className = 'estruturaatomica_valencia-dot';
        if (Number.isFinite(valencia) && i <= valencia) {
          dot.classList.add('is-ativo');
        }
        valenciaDots.appendChild(dot);
      }
    }

    if (valenciaTexto) {
      if (Number.isFinite(valencia)) {
        let tendencia = '';
        const camadaUnica = camadas.length === 1 && valencia === 2;
        if (valencia === 8 || camadaUnica) {
          tendencia = 'Camada completa, baixa reatividade.';
        } else if (valencia === 4) {
          tendencia = 'Tendencia a compartilhar 4 eletron(s) em ligacoes covalentes.';
        } else if (valencia > 4) {
          tendencia = `Tendencia a ganhar ${8 - valencia} eletron(s) para formar anion.`;
        } else if (valencia > 0) {
          tendencia = `Tendencia a perder ${valencia} eletron(s) para formar cation.`;
        }

        valenciaTexto.textContent = `Eletrons na ultima camada: ${valencia}. ${tendencia}`.trim();
      } else {
        valenciaTexto.textContent = 'Selecione um elemento para ver os eletrons de valencia.';
      }
    }
  };

  const selecionarElemento = (elemento, { limparBusca = true } = {}) => {
    if (!elemento) return;
    atualizarDetalhes(elemento);
    atualizarBotaoSelecionado(elemento.simbolo);

    if (limparBusca) {
      formulaInput.value = '';
      if (resultadosContainer) fecharResultados();
    }
  };

  const selecionarElementoPorSimbolo = (simbolo) => {
    const chave = normalizarTexto(simbolo);
    const elemento = elementosPorSimbolo[chave] || elementosMap[simbolo];
    if (!elemento) return;
    selecionarElemento(elemento);
  };

  // ========================================
  // 5) Busca e autocomplete
  // ========================================
  const abrirResultados = () => {
    if (formulaCampo) formulaCampo.classList.add('busca--aberta');
  };

  const fecharResultados = () => {
    if (!resultadosContainer || !formulaCampo) return;
    formulaCampo.classList.remove('busca--aberta');
    resultadosContainer.innerHTML = '';
  };

  const renderizarResultados = (resultados) => {
    if (!resultadosContainer) return;
    resultadosContainer.innerHTML = '';

    if (!resultados.length) {
      const vazio = document.createElement('div');
      vazio.className = 'busca_vazio';
      vazio.textContent = 'Nenhum elemento encontrado';
      resultadosContainer.appendChild(vazio);
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
          <span class="busca_meta">${item.nome} - No ${item.numero}</span>
        </span>
      `;
      botao.addEventListener('click', () => {
        const elemento = elementosPorNumero[item.numero]
          || elementosPorSimbolo[normalizarTexto(item.simbolo)]
          || elementosPorNome[normalizarTexto(item.nome)];
        if (elemento) selecionarElemento(elemento);
      });
      resultadosContainer.appendChild(botao);
    });

    abrirResultados();
  };

  const filtrarResultados = () => {
    if (!resultadosContainer) return;
    const termo = formulaInput.value.trim();

    if (!termo) {
      fecharResultados();
      return;
    }

    const termoNormalizado = normalizarTexto(termo);
    const resultados = listaBusca.filter(item => {
      const nome = normalizarTexto(item.nome);
      const simbolo = normalizarTexto(item.simbolo);
      const numero = item.numero;
      return (
        nome.includes(termoNormalizado)
        || simbolo.includes(termoNormalizado)
        || numero.startsWith(termoNormalizado)
      );
    }).slice(0, 12);

    renderizarResultados(resultados);
  };

  // ========================================
  // 6) Renderizacao de UI
  // ========================================
  const renderElementos = () => {
    renderElementosBase({
      container: elementosContainer,
      elementos: ELEMENTOS,
      classeBotao: 'estruturaatomica_elemento',
      getAriaLabel: (simbolo) => `Selecionar ${simbolo}`,
      getTitle: (simbolo) => {
        const dados = elementosMap[simbolo];
        return dados ? `${dados.nome} (${dados.numero})` : simbolo;
      },
      renderHTML: (simbolo) => simbolo,
      onClick: (simbolo) => selecionarElementoPorSimbolo(simbolo)
    });

    botoesElementos = {};
    if (!elementosContainer) return;

    const botoes = elementosContainer.querySelectorAll('.estruturaatomica_elemento');
    botoes.forEach((botao) => {
      const simbolo = botao.textContent.trim();
      if (!simbolo) return;
      botao.dataset.simbolo = simbolo;
      botoesElementos[normalizarTexto(simbolo)] = botao;
    });
  };

  // ========================================
  // 7) Carregamento de dados
  // ========================================
  const carregarElementos = async () => {
    try {
      const resposta = await fetch('/data/elementos.json');
      if (!resposta.ok) throw new Error('Erro ao carregar elementos');
      const data = await resposta.json();
      const lista = Array.isArray(data) ? data : Object.values(data);

      elementosMap = {};
      elementosPorNumero = {};
      elementosPorNome = {};
      elementosPorSimbolo = {};

      lista.forEach((item) => {
        if (!item) return;
        if (item.simbolo) {
          elementosMap[item.simbolo] = item;
          elementosPorSimbolo[normalizarTexto(item.simbolo)] = item;
        }
        if (item.numero !== null && item.numero !== undefined) {
          elementosPorNumero[String(item.numero)] = item;
        }
        if (item.nome) {
          elementosPorNome[normalizarTexto(item.nome)] = item;
        }
      });

      listaBusca = lista
        .filter(item => item && item.simbolo && item.numero !== undefined && item.numero !== null)
        .map(item => ({
          numero: String(item.numero),
          nome: item.nome || '',
          simbolo: item.simbolo
        }));

      renderElementos();

      const hidrogenio = elementosPorSimbolo['h'];
      if (hidrogenio) {
        selecionarElemento(hidrogenio);
      } else {
        limparDetalhes();
      }
    } catch (erro) {
      console.error('Erro ao carregar elementos:', erro);
      setFormulaErro('Erro ao carregar elementos.');
      limparDetalhes();
    }
  };

  // ========================================
  // 8) Eventos
  // ========================================
  formulaInput.addEventListener('input', () => {
    setFormulaErro('');
    filtrarResultados();
  });

  if (resultadosContainer) {
    formulaInput.addEventListener('focus', filtrarResultados);

    document.addEventListener('pointerdown', (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (!target.closest('.busca')) fecharResultados();
    });
  }

  // ========================================
  // 9) Inicializacao
  // ========================================
  setFormulaErro('');
  carregarElementos();
});


