// ========================================
// CONVERSOR MOL ⇄ MASSA (CLIENTE)
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  // ========================================
  // 1) Seletores do DOM
  // ========================================
  const formulaInput = document.querySelector('#conversorFormulaInput');
  if (!formulaInput) return;

  const preview = document.querySelector('#conversorFormulaPreview');
  const formulaErro = document.querySelector('#conversorFormulaErro');
  const formulaCampo = document.querySelector('#conversorFormulaCampo');
  const limparFormulaBtn = document.querySelector('#conversorLimparFormula');

  const valorInput = document.querySelector('#conversorValorInput');
  const valorErro = document.querySelector('#conversorValorErro');
  const valorCampo = document.querySelector('#conversorValorCampo');
  const limparValorBtn = document.querySelector('#conversorLimparValor');
  const valorLabel = document.querySelector('#conversorValorLabel');
  const valorAjuda = document.querySelector('#conversorValorAjuda');

  const converterBtn = document.querySelector('#convertermolmassa');

  const resultadoBox = document.querySelector('#conversorResultado');
  const resultadoModo = document.querySelector('#resultadoModo');
  const resultadoFormula = document.querySelector('#resultadoFormula');
  const resultadoValor = document.querySelector('#resultadoValor');
  const resultadoDetalhe = document.querySelector('#resultadoDetalhe');
  const resultadoMassaMolar = document.querySelector('#resultadoMassaMolar');
  const resultadoRelacao = document.querySelector('#resultadoRelacao');
  const resultadoPassos = document.querySelector('#resultadoPassos');

  const modoMolBtn = document.querySelector('#molParaMassa');
  const modoMassaBtn = document.querySelector('#massaParaMol');
  const alternarBtn = document.querySelector('#alternarConversao');

  const elementosContainer = document.querySelector('#elementosComuns');
  const compostosContainer = document.querySelector('#compostosComuns');
  const tecladoContainer = document.querySelector('#tecladoQuimico');

  const quimica = window.QuimicaUtils;
  if (!quimica) return;

  const {
    elementosComuns,
    compostosComuns,
    tecladoTeclas,
    inserirTexto: inserirTextoBase,
    apagarUltimo: apagarUltimoBase,
    limparInput: limparInputBase,
    normalizarFormula,
    formatarFormulaHTML,
    parseFormula,
    validarFormula,
    renderTeclado: renderTecladoBase,
    renderElementos: renderElementosBase,
    renderCompostos: renderCompostosBase
  } = quimica;

  // ========================================
  // 2) Estado e formatação
  // ========================================
  const MODO_MOL_PARA_MASSA = 'mol-para-massa';
  const MODO_MASSA_PARA_MOL = 'massa-para-mol';
  let modoAtual = MODO_MOL_PARA_MASSA;
  let elementosMap = {};

  const formatarNumero = (valor) => {
    if (!Number.isFinite(valor)) return '--';
    return valor.toFixed(4).replace(/\.?0+$/, '');
  };

  const formatarNumeroFix = (valor) => {
    if (!Number.isFinite(valor)) return '--';
    return valor.toFixed(4);
  };

  const formatarMassaCurta = (valor) => {
    if (!Number.isFinite(valor)) return '--';
    if (valor < 10) return valor.toFixed(2);
    if (valor < 100) return valor.toFixed(1);
    return valor.toFixed(0);
  };

  // ========================================
  // 3) Helpers de UI
  // ========================================
  const toggleLimpar = (input, wrapper) => {
    if (!wrapper || !input) return;
    const temValor = input.value.trim().length > 0;
    wrapper.classList.toggle('busca--com-valor', temValor);
  };

  const setErro = (el, wrapper, mensagem) => {
    if (el) {
      el.textContent = mensagem || '';
      el.hidden = !mensagem;
    }
    if (wrapper) {
      wrapper.classList.toggle('conversormolmassa_campo--erro', Boolean(mensagem));
    }
  };

  const setFormulaErro = (mensagem) => setErro(formulaErro, formulaCampo, mensagem);
  const setValorErro = (mensagem) => setErro(valorErro, valorCampo, mensagem);

  const ocultarResultado = () => {
    if (resultadoBox) resultadoBox.hidden = true;
  };

  const atualizarPreview = () => {
    if (!preview) return;
    const valor = normalizarFormula(formulaInput.value);
    if (!valor) {
      preview.textContent = 'Digite uma fórmula';
      return;
    }
    preview.innerHTML = formatarFormulaHTML(valor);
  };

  // ========================================
  // 4) Manipulação de input
  // ========================================
  const inserirTexto = (texto) => {
    if (!inserirTextoBase(formulaInput, texto)) return;
    atualizarPreview();
    toggleLimpar(formulaInput, formulaCampo);
    setFormulaErro('');
    ocultarResultado();
  };

  const apagarUltimo = () => {
    if (!apagarUltimoBase(formulaInput)) return;
    atualizarPreview();
    toggleLimpar(formulaInput, formulaCampo);
    setFormulaErro('');
    ocultarResultado();
  };

  const limparFormula = () => {
    if (!limparInputBase(formulaInput)) return;
    atualizarPreview();
    toggleLimpar(formulaInput, formulaCampo);
    setFormulaErro('');
    ocultarResultado();
  };

  const limparValor = () => {
    if (!limparInputBase(valorInput)) return;
    toggleLimpar(valorInput, valorCampo);
    setValorErro('');
    ocultarResultado();
  };

  // ========================================
  // 5) Conversão e validação
  // ========================================
  const normalizarNumero = (valor) => {
    const texto = String(valor ?? '').trim();
    if (!texto) return '';
    const temVirgula = texto.includes(',');
    const temPonto = texto.includes('.');
    let normalizado = texto;

    if (temVirgula && temPonto) {
      normalizado = normalizado.replace(/\./g, '').replace(',', '.');
    } else {
      normalizado = normalizado.replace(',', '.');
    }

    return normalizado.replace(/[^0-9.+-]/g, '');
  };

  const validarValor = () => {
    const texto = valorInput?.value ?? '';
    if (!texto.trim()) return 'Informe um valor.';
    const numero = Number(normalizarNumero(texto));
    if (!Number.isFinite(numero)) return 'Valor inválido.';
    if (numero <= 0) return 'Use um valor maior que zero.';
    return '';
  };

  const calcularMassaMolar = (resultado) => {
    return resultado.ordem.reduce((soma, simbolo) => {
      const massa = elementosMap[simbolo]?.massa;
      return soma + (massa * resultado.contagens[simbolo]);
    }, 0);
  };

  const renderPassos = (passos) => {
    if (!resultadoPassos) return;
    resultadoPassos.innerHTML = '';

    passos.forEach((passo, index) => {
      const item = document.createElement('div');
      item.className = 'conversormolmassa_passo';
      item.innerHTML = `
        <span class="conversormolmassa_passo-num">${index + 1}</span>
        <p>${passo}</p>
      `;
      resultadoPassos.appendChild(item);
    });
  };

  const renderResultado = ({ formula, massaMolar, entrada, saida, isMolParaMassa }) => {
    if (!resultadoBox) return;

    const formulaHTML = formatarFormulaHTML(formula);
    const entradaUnidade = isMolParaMassa ? 'mol' : 'g';
    const saidaUnidade = isMolParaMassa ? 'g' : 'mol';
    const operador = isMolParaMassa ? '×' : '÷';
    const relacaoTexto = isMolParaMassa
      ? 'massa (g) = mol × massa molar (g/mol)'
      : 'mol = massa (g) ÷ massa molar (g/mol)';

    if (resultadoModo) {
      resultadoModo.textContent = isMolParaMassa ? 'Mol para massa' : 'Massa para mol';
    }

    if (resultadoFormula) resultadoFormula.innerHTML = formulaHTML;
    if (resultadoValor) resultadoValor.textContent = `${formatarNumero(saida)} ${saidaUnidade}`;
    if (resultadoDetalhe) {
      resultadoDetalhe.textContent = `${formatarNumero(entrada)} ${entradaUnidade} ${operador} ${formatarNumeroFix(massaMolar)} g/mol`;
    }
    if (resultadoMassaMolar) resultadoMassaMolar.textContent = `${formatarNumeroFix(massaMolar)} g/mol`;
    if (resultadoRelacao) resultadoRelacao.textContent = relacaoTexto;

    const formulaTag = `<span class="conversormolmassa_tag-formula">${formulaHTML}</span>`;
    const substituicao = isMolParaMassa
      ? `${formatarNumero(entrada)} mol × ${formatarNumeroFix(massaMolar)} g/mol = <strong>${formatarNumero(saida)} g</strong>`
      : `${formatarNumero(entrada)} g ÷ ${formatarNumeroFix(massaMolar)} g/mol = <strong>${formatarNumero(saida)} mol</strong>`;

    const passos = [
      `Calcule a massa molar de ${formulaTag}: <strong>${formatarNumeroFix(massaMolar)} g/mol</strong>.`,
      `Aplique a relação <strong>${isMolParaMassa ? 'massa = mol × massa molar' : 'mol = massa ÷ massa molar'}</strong>.`,
      `Substitua os valores: ${substituicao}.`
    ];

    renderPassos(passos);
    resultadoBox.hidden = false;
  };

  const converter = () => {
    setFormulaErro('');
    setValorErro('');

    if (!Object.keys(elementosMap).length) {
      setFormulaErro('Carregando elementos, aguarde um instante.');
      return;
    }

    const erroFormula = validarFormula(formulaInput.value);
    if (erroFormula) {
      setFormulaErro(erroFormula);
      ocultarResultado();
      return;
    }

    const erroValor = validarValor();
    if (erroValor) {
      setValorErro(erroValor);
      ocultarResultado();
      return;
    }

    const formula = normalizarFormula(formulaInput.value);
    const resultado = parseFormula(formula);
    const desconhecidos = resultado.ordem.filter(simbolo => !elementosMap[simbolo]);
    if (desconhecidos.length) {
      setFormulaErro(`Elementos não encontrados: ${desconhecidos.join(', ')}`);
      ocultarResultado();
      return;
    }

    const massaMolar = calcularMassaMolar(resultado);
    const entrada = Number(normalizarNumero(valorInput.value));
    const isMolParaMassa = modoAtual === MODO_MOL_PARA_MASSA;
    const saida = isMolParaMassa ? entrada * massaMolar : entrada / massaMolar;

    renderResultado({ formula, massaMolar, entrada, saida, isMolParaMassa });
  };

  const atualizarModo = (novoModo) => {
    modoAtual = novoModo;
    const isMolParaMassa = modoAtual === MODO_MOL_PARA_MASSA;

    if (modoMolBtn) {
      modoMolBtn.classList.toggle('modo-ativo', isMolParaMassa);
      modoMolBtn.setAttribute('aria-checked', isMolParaMassa ? 'true' : 'false');
    }
    if (modoMassaBtn) {
      modoMassaBtn.classList.toggle('modo-ativo', !isMolParaMassa);
      modoMassaBtn.setAttribute('aria-checked', !isMolParaMassa ? 'true' : 'false');
    }

    if (valorLabel) {
      valorLabel.textContent = isMolParaMassa
        ? 'Quantidade de matéria (mol)'
        : 'Massa (g)';
    }
    if (valorInput) {
      valorInput.placeholder = isMolParaMassa ? 'Ex: 2,5' : 'Ex: 36';
    }
    if (valorAjuda) {
      valorAjuda.textContent = isMolParaMassa
        ? 'Digite a quantidade em mol para converter em gramas.'
        : 'Digite a massa em gramas para converter em mol.';
    }

    setValorErro('');
    ocultarResultado();
  };

  // ========================================
  // 6) Renderização de UI
  // ========================================
  const renderTeclado = () => {
    renderTecladoBase({
      container: tecladoContainer,
      teclas: tecladoTeclas,
      classeBase: 'conversormolmassa_tecla',
      classMap: {
        acao: 'conversormolmassa_tecla--acao',
        limpar: 'conversormolmassa_tecla--limpar'
      },
      onInserir: inserirTexto,
      onApagar: apagarUltimo,
      onLimpar: limparFormula
    });
  };

  const renderElementos = () => {
    renderElementosBase({
      container: elementosContainer,
      elementos: elementosComuns,
      classeBotao: 'conversormolmassa_elemento',
      getAriaLabel: (simbolo) => `Inserir ${simbolo}`,
      getTitle: (simbolo) => {
        const dados = elementosMap[simbolo];
        return dados ? `${dados.nome} (${formatarMassaCurta(dados.massa)})` : simbolo;
      },
      renderHTML: (simbolo) => {
        const dados = elementosMap[simbolo];
        return `
          <span class="conversormolmassa_elemento-simbolo">${simbolo}</span>
          <span class="conversormolmassa_elemento-massa">${dados ? formatarMassaCurta(dados.massa) : '--'}</span>
        `;
      },
      onClick: (simbolo) => inserirTexto(simbolo)
    });
  };

  const renderCompostos = () => {
    renderCompostosBase({
      container: compostosContainer,
      compostos: compostosComuns,
      classeBotao: 'conversormolmassa_composto',
      getAriaLabel: (composto) => `Usar ${composto.formula}`,
      renderHTML: (composto) => `
        <span class="conversormolmassa_composto-formula">
          ${formatarFormulaHTML(composto.formula)}
        </span>
        <span class="conversormolmassa_composto-nome">
          ${composto.nome}
        </span>
      `,
      onClick: (composto) => {
        formulaInput.value = composto.formula;
        atualizarPreview();
        toggleLimpar(formulaInput, formulaCampo);
        setFormulaErro('');
        ocultarResultado();
        formulaInput.focus();
      }
    });
  };

  // ========================================
  // 7) Carregamento de dados
  // ========================================
  const carregarElementos = async () => {
    if (converterBtn) converterBtn.disabled = true;
    try {
      const resposta = await fetch('/data/elementos.json');
      if (!resposta.ok) throw new Error('Falha ao carregar elementos.');
      const data = await resposta.json();
      elementosMap = data.reduce((acc, item) => {
        const massa = Number(item.massa_molar);
        if (item.simbolo && Number.isFinite(massa)) {
          acc[item.simbolo] = {
            nome: item.nome,
            massa
          };
        }
        return acc;
      }, {});
      renderElementos();
      renderCompostos();
      if (converterBtn) converterBtn.disabled = false;
    } catch (erro) {
      setFormulaErro('Não foi possível carregar a tabela de elementos.');
      if (elementosContainer) {
        elementosContainer.textContent = 'Elementos indisponíveis no momento.';
      }
    }
  };

  // ========================================
  // 8) Eventos
  // ========================================
  if (limparFormulaBtn) {
    limparFormulaBtn.addEventListener('click', limparFormula);
  }

  if (limparValorBtn) {
    limparValorBtn.addEventListener('click', limparValor);
  }

  formulaInput.addEventListener('input', () => {
    atualizarPreview();
    toggleLimpar(formulaInput, formulaCampo);
    setFormulaErro('');
    ocultarResultado();
  });

  valorInput.addEventListener('input', () => {
    toggleLimpar(valorInput, valorCampo);
    setValorErro('');
    ocultarResultado();
  });

  valorInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      converter();
    }
  });

  if (converterBtn) {
    converterBtn.addEventListener('click', converter);
  }

  if (modoMolBtn) {
    modoMolBtn.addEventListener('click', () => atualizarModo(MODO_MOL_PARA_MASSA));
  }

  if (modoMassaBtn) {
    modoMassaBtn.addEventListener('click', () => atualizarModo(MODO_MASSA_PARA_MOL));
  }

  if (alternarBtn) {
    alternarBtn.addEventListener('click', () => {
      const novoModo = modoAtual === MODO_MOL_PARA_MASSA ? MODO_MASSA_PARA_MOL : MODO_MOL_PARA_MASSA;
      atualizarModo(novoModo);
    });
  }

  // ========================================
  // 9) Inicialização
  // ========================================
  renderTeclado();
  renderCompostos();
  atualizarPreview();
  toggleLimpar(formulaInput, formulaCampo);
  toggleLimpar(valorInput, valorCampo);
  setFormulaErro('');
  setValorErro('');
  atualizarModo(MODO_MOL_PARA_MASSA);
  carregarElementos();
});
