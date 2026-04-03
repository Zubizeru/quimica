// ========================================
// MASSA MOLAR (CLIENTE)
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  // ========================================
  // 1) Seletores do DOM
  // ========================================
  const input = document.querySelector('#formulaInput');
  if (!input) return;

  const preview = document.querySelector('#formulaPreview');
  const errorEl = document.querySelector('#formulaErro');
  const campoWrapper = document.querySelector('#massaMolarCampo');
  const limparBtn = document.querySelector('#limparFormula');
  const calcularBtn = document.querySelector('#calcularMassa');
  const resultadoBox = document.querySelector('#massaResultado');
  const resultadoFormula = document.querySelector('#resultadoFormula');
  const resultadoTotal = document.querySelector('#resultadoTotal');
  const resultadoTotalLinha = document.querySelector('#resultadoTotalLinha');
  const resultadoLinhas = document.querySelector('#resultadoLinhas');
  const resultadoPercentual = document.querySelector('#resultadoPercentual');
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
  // 2) Utilitários e estado
  // ========================================
  let elementosMap = {};
  // ========================================
  // 3) Preview e validação
  // ========================================
  const ocultarResultado = () => {
    if (resultadoBox) resultadoBox.hidden = true;
  };

  const setErro = (mensagem) => {
    if (!errorEl) return;
    errorEl.textContent = mensagem || '';
    errorEl.hidden = !mensagem;
    if (campoWrapper) {
      campoWrapper.classList.toggle('massa-molar_campo--erro', Boolean(mensagem));
    }
  };

  const toggleLimpar = () => {
    if (!campoWrapper) return;
    const temValor = input.value.trim().length > 0;
    campoWrapper.classList.toggle('busca--com-valor', temValor);
  };
  const atualizarPreview = () => {
    if (!preview) return;
    const valor = normalizarFormula(input.value);
    if (!valor) {
      preview.textContent = 'Digite uma fórmula';
      return;
    }
    preview.innerHTML = formatarFormulaHTML(valor);
  };
  const inserirTexto = (texto) => {
    if (!inserirTextoBase(input, texto)) return;
    atualizarPreview();
    toggleLimpar();
    setErro('');
    ocultarResultado();
  };

  const apagarUltimo = () => {
    if (!apagarUltimoBase(input)) return;
    atualizarPreview();
    toggleLimpar();
    setErro('');
    ocultarResultado();
  };

  const limparFormula = () => {
    if (!limparInputBase(input)) return;
    atualizarPreview();
    toggleLimpar();
    setErro('');
    ocultarResultado();
  };
  // ========================================
  // 4) Formatação e renderização de resultado
  // ========================================
  const formatarMassaCurta = (valor) => {
    if (!Number.isFinite(valor)) return '--';
    if (valor < 10) return valor.toFixed(2);
    if (valor < 100) return valor.toFixed(1);
    return valor.toFixed(0);
  };

  const formatarMassa = (valor) => {
    if (!Number.isFinite(valor)) return 'N/A';
    return valor.toFixed(4);
  };
  const renderResultado = (formula, resultado) => {
    if (!resultadoBox || !resultadoLinhas || !resultadoPercentual) return;

    resultadoLinhas.innerHTML = '';
    resultadoPercentual.innerHTML = '';

    const total = resultado.ordem.reduce((soma, simbolo) => {
      const massa = elementosMap[simbolo]?.massa;
      return soma + (massa * resultado.contagens[simbolo]);
    }, 0);

    resultadoFormula.innerHTML = formatarFormulaHTML(formula);
    resultadoTotal.textContent = `${formatarMassa(total)} g/mol`;
    resultadoTotalLinha.textContent = `${formatarMassa(total)} g/mol`;

    resultado.ordem.forEach(simbolo => {
      const dados = elementosMap[simbolo];
      const quantidade = resultado.contagens[simbolo];
      const massaAtomica = dados.massa;
      const subtotal = quantidade * massaAtomica;

      const linha = document.createElement('div');
      linha.className = 'massa-molar_linha';
      linha.innerHTML = `
        <div class="massa-molar_elemento-cell">
          <span class="massa-molar_tag">${simbolo}</span>
          <span class="massa-molar_elemento-nome">${dados.nome}</span>
        </div>
        <span>${quantidade}</span>
        <span>${formatarMassa(massaAtomica)}</span>
        <span>${formatarMassa(subtotal)} g/mol</span>
      `;
      resultadoLinhas.appendChild(linha);

      const percentual = total > 0 ? (subtotal / total) * 100 : 0;
      const percentualFormatado = percentual.toFixed(2);
      const item = document.createElement('div');
      item.className = 'massa-molar_percentual-item';
      item.innerHTML = `
        <span class="massa-molar_elemento-cell">
          <span class="massa-molar_tag">${simbolo}</span>
          ${dados.nome}
        </span>
        <div class="massa-molar_barra">
          <span style="width: ${Math.min(100, Math.max(0, percentual))}%"></span>
        </div>
        <strong>${percentualFormatado}%</strong>
      `;
      resultadoPercentual.appendChild(item);
    });

    resultadoBox.hidden = false;
  };
  // ========================================
  // 5) Cálculo principal
  // ========================================
  const calcular = () => {
    setErro('');
    if (!Object.keys(elementosMap).length) {
      setErro('Carregando elementos, aguarde um instante.');
      return;
    }

    const erro = validarFormula(input.value);
    if (erro) {
      setErro(erro);
      if (resultadoBox) resultadoBox.hidden = true;
      return;
    }

    const formula = normalizarFormula(input.value);
    const resultado = parseFormula(formula);

    const desconhecidos = resultado.ordem.filter(simbolo => !elementosMap[simbolo]);
    if (desconhecidos.length) {
      setErro(`Elementos não encontrados: ${desconhecidos.join(', ')}`);
      if (resultadoBox) resultadoBox.hidden = true;
      return;
    }

    renderResultado(formula, resultado);
  };
  // ========================================
  // 6) Renderização de UI (teclado/elementos/compostos)
  // ========================================
  const renderTeclado = () => {
    renderTecladoBase({
      container: tecladoContainer,
      teclas: tecladoTeclas,
      classeBase: 'massa-molar_tecla',
      classMap: {
        acao: 'massa-molar_tecla--acao',
        limpar: 'massa-molar_tecla--limpar'
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
      classeBotao: 'massa-molar_elemento',
      getAriaLabel: (simbolo) => `Inserir ${simbolo}`,
      getTitle: (simbolo) => {
        const dados = elementosMap[simbolo];
        return dados ? `${dados.nome} (${formatarMassaCurta(dados.massa)})` : simbolo;
      },
      renderHTML: (simbolo) => {
        const dados = elementosMap[simbolo];
        return `
          <span class="massa-molar_elemento-simbolo">${simbolo}</span>
          <span class="massa-molar_elemento-massa">${dados ? formatarMassaCurta(dados.massa) : '--'}</span>
        `;
      },
      onClick: (simbolo) => inserirTexto(simbolo)
    });
  };
  const renderCompostos = () => {
    renderCompostosBase({
      container: compostosContainer,
      compostos: compostosComuns,
      classeBotao: 'massa-molar_composto',
      getAriaLabel: (composto) => `Usar ${composto.formula}`,
      renderHTML: (composto) => `
        <span class="massa-molar_composto-formula">${formatarFormulaHTML(composto.formula)}</span>
        <span class="massa-molar_composto-nome">${composto.nome}</span>
      `,
      onClick: (composto) => {
        input.value = composto.formula;
        atualizarPreview();
        toggleLimpar();
        calcular();
      }
    });
  };
  // ========================================
  // 7) Carregamento de dados
  // ========================================
  const carregarElementos = async () => {
    if (calcularBtn) calcularBtn.disabled = true;
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
      if (calcularBtn) calcularBtn.disabled = false;
    } catch (erro) {
      setErro('Não foi possível carregar a tabela de elementos.');
      if (elementosContainer) {
        elementosContainer.textContent = 'Elementos indisponíveis no momento.';
      }
    }
  };
  // ========================================
  // 8) Eventos
  // ========================================
  if (limparBtn) {
    limparBtn.addEventListener('click', limparFormula);
  }

  input.addEventListener('input', () => {
    atualizarPreview();
    toggleLimpar();
    setErro('');
    ocultarResultado();
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      calcular();
    }
  });

  if (calcularBtn) {
    calcularBtn.addEventListener('click', calcular);
  }
  // ========================================
  // 9) Inicialização
  // ========================================
  renderTeclado();
  renderCompostos();
  atualizarPreview();
  toggleLimpar();
  setErro('');
  carregarElementos();
});














