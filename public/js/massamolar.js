document.addEventListener('DOMContentLoaded', () => {
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
  const tooltip = document.getElementById('tooltip');
  const equacoes = document.querySelectorAll('.equacao');

  const elementosComuns = [
    'H', 'C', 'N', 'O', 'F', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'K', 'Ca', 'Fe', 'Cu', 'Zn', 'Ag'
  ];

  const compostosComuns = [
    { formula: 'H2O', nome: 'Água' },
    { formula: 'CO2', nome: 'Dióxido de Carbono' },
    { formula: 'NaCl', nome: 'Cloreto de Sódio' },
    { formula: 'NH3', nome: 'Amônia' },
    { formula: 'CH4', nome: 'Metano' },
    { formula: 'H2SO4', nome: 'Ácido Sulfúrico' },
    { formula: 'CaCO3', nome: 'Carbonato de Cálcio' },
    { formula: 'Ca(OH)2', nome: 'Hidróxido de Cálcio' },
    { formula: 'C6H12O6', nome: 'Glicose' }
  ];

  const tecladoTeclas = [
    { label: '1', value: '1' },
    { label: '2', value: '2' },
    { label: '3', value: '3' },
    { label: '4', value: '4' },
    { label: '5', value: '5' },
    { label: '6', value: '6' },
    { label: '7', value: '7' },
    { label: '8', value: '8' },
    { label: '9', value: '9' },
    { label: '0', value: '0' },
    { label: '(', value: '(' },
    { label: ')', value: ')' },
    { label: '·', value: '·', aria: 'Ponto para hidratação' },
    { label: '⌫', action: 'backspace', aria: 'Apagar último caractere', className: 'massa-molar_tecla--acao' },
    { label: 'Limpar', action: 'clear', aria: 'Limpar fórmula', className: 'massa-molar_tecla--limpar' }
  ];

  let elementosMap = {};

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

  const normalizarFormula = (valor) => {
    return valor.replace(/\s+/g, '').replace(/\./g, '·');
  };

  const formatarFormulaHTML = (formula) => {
    const segura = formula.replace(/[^A-Za-z0-9()[\]{}·]/g, '');
    return segura.replace(/(\d+)/g, '<sub>$1</sub>').replace(/·/g, '&middot;');
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
    const inicio = input.selectionStart || 0;
    const fim = input.selectionEnd || 0;
    const valor = input.value;
    input.value = valor.slice(0, inicio) + texto + valor.slice(fim);
    const novaPosicao = inicio + texto.length;
    input.setSelectionRange(novaPosicao, novaPosicao);
    input.focus();
    atualizarPreview();
    toggleLimpar();
    setErro('');
    ocultarResultado();
  };

  const apagarUltimo = () => {
    const inicio = input.selectionStart || 0;
    const fim = input.selectionEnd || 0;
    if (inicio !== fim) {
      inserirTexto('');
      return;
    }
    if (inicio === 0) return;
    const valor = input.value;
    input.value = valor.slice(0, inicio - 1) + valor.slice(fim);
    const novaPosicao = inicio - 1;
    input.setSelectionRange(novaPosicao, novaPosicao);
    input.focus();
    atualizarPreview();
    toggleLimpar();
    setErro('');
    ocultarResultado();
  };

  const limparFormula = () => {
    input.value = '';
    atualizarPreview();
    toggleLimpar();
    setErro('');
    ocultarResultado();
    input.focus();
  };

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

  const splitSegmentos = (formula) => {
    const segmentos = [];
    let atual = '';
    let nivel = 0;

    for (let i = 0; i < formula.length; i++) {
      const ch = formula[i];
      if (ch === '(' || ch === '[' || ch === '{') nivel += 1;
      if (ch === ')' || ch === ']' || ch === '}') nivel -= 1;

      if (nivel === 0 && ch === '·') {
        segmentos.push(atual);
        atual = '';
        continue;
      }
      atual += ch;
    }

    if (atual) segmentos.push(atual);
    return segmentos;
  };

  const parseSegmento = (segmento) => {
    let i = 0;
    const tamanho = segmento.length;
    const matchCoef = segmento.match(/^(\d+)/);
    let coef = 1;

    if (matchCoef) {
      coef = parseInt(matchCoef[1], 10);
      i = matchCoef[1].length;
    }

    const parseGrupo = (fechar) => {
      const contagens = {};
      const ordem = [];

      const adicionar = (simbolo, quantidade) => {
        if (!contagens[simbolo]) {
          contagens[simbolo] = 0;
          ordem.push(simbolo);
        }
        contagens[simbolo] += quantidade;
      };

      const lerNumero = () => {
        let inicio = i;
        while (i < tamanho && /[0-9]/.test(segmento[i])) i += 1;
        if (inicio === i) return 1;
        return parseInt(segmento.slice(inicio, i), 10);
      };

      while (i < tamanho) {
        const ch = segmento[i];

        if (fechar && ch === fechar) {
          i += 1;
          return { contagens, ordem };
        }

        if (ch === '(' || ch === '[' || ch === '{') {
          const fecha = ch === '(' ? ')' : ch === '[' ? ']' : '}';
          i += 1;
          const interno = parseGrupo(fecha);
          const mult = lerNumero();
          interno.ordem.forEach(simbolo => {
            adicionar(simbolo, interno.contagens[simbolo] * mult);
          });
          continue;
        }

        if (ch === ')' || ch === ']' || ch === '}') {
          throw new Error('Parênteses não estão balanceados.');
        }

        if (/[A-Z]/.test(ch)) {
          let simbolo = ch;
          i += 1;
          if (i < tamanho && /[a-z]/.test(segmento[i])) {
            simbolo += segmento[i];
            i += 1;
          }
          const quantidade = lerNumero();
          adicionar(simbolo, quantidade);
          continue;
        }

        if (/[0-9]/.test(ch)) {
          throw new Error('Número sem elemento associado.');
        }

        throw new Error(`Caractere inválido: ${ch}`);
      }

      if (fechar) {
        throw new Error('Parênteses não estão balanceados.');
      }

      return { contagens, ordem };
    };

    const resultado = parseGrupo(null);

    if (i < tamanho) {
      throw new Error('Fórmula inválida.');
    }

    if (coef !== 1) {
      resultado.ordem.forEach(simbolo => {
        resultado.contagens[simbolo] *= coef;
      });
    }

    return resultado;
  };

  const parseFormula = (formula) => {
    const segmentos = splitSegmentos(formula);
    if (!segmentos.length || segmentos.some(segmento => segmento.trim() === '')) {
      throw new Error('Fórmula incompleta.');
    }

    const contagens = {};
    const ordem = [];

    segmentos.forEach(segmento => {
      const resultado = parseSegmento(segmento);
      resultado.ordem.forEach(simbolo => {
        if (!contagens[simbolo]) {
          contagens[simbolo] = 0;
          ordem.push(simbolo);
        }
        contagens[simbolo] += resultado.contagens[simbolo];
      });
    });

    return { contagens, ordem };
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

  const calcular = () => {
    setErro('');
    if (!Object.keys(elementosMap).length) {
      setErro('Carregando elementos, aguarde um instante.');
      return;
    }

    const formula = normalizarFormula(input.value);
    if (!formula) {
      setErro('Digite uma fórmula química para calcular.');
      if (resultadoBox) resultadoBox.hidden = true;
      return;
    }

    let resultado;
    try {
      resultado = parseFormula(formula);
    } catch (erro) {
      setErro(erro.message || 'Fórmula inválida.');
      if (resultadoBox) resultadoBox.hidden = true;
      return;
    }

    const desconhecidos = resultado.ordem.filter(simbolo => !elementosMap[simbolo]);
    if (desconhecidos.length) {
      setErro(`Elementos não encontrados: ${desconhecidos.join(', ')}`);
      if (resultadoBox) resultadoBox.hidden = true;
      return;
    }

    renderResultado(formula, resultado);
  };

  const renderTeclado = () => {
    if (!tecladoContainer) return;
    tecladoContainer.innerHTML = '';

    tecladoTeclas.forEach(tecla => {
      const botao = document.createElement('button');
      botao.type = 'button';
      botao.className = `massa-molar_tecla${tecla.className ? ` ${tecla.className}` : ''}`;
      botao.setAttribute('aria-label', tecla.aria || tecla.label);
      botao.textContent = tecla.label;

      botao.addEventListener('click', () => {
        if (tecla.action === 'backspace') {
          apagarUltimo();
          return;
        }
        if (tecla.action === 'clear') {
          limparFormula();
          return;
        }
        if (tecla.value) inserirTexto(tecla.value);
      });

      tecladoContainer.appendChild(botao);
    });
  };

  const renderElementos = () => {
    if (!elementosContainer) return;
    elementosContainer.innerHTML = '';

    elementosComuns.forEach(simbolo => {
      const dados = elementosMap[simbolo];
      const botao = document.createElement('button');
      botao.type = 'button';
      botao.className = 'massa-molar_elemento';
      botao.setAttribute('aria-label', `Inserir ${simbolo}`);
      botao.title = dados ? `${dados.nome} (${formatarMassaCurta(dados.massa)})` : simbolo;
      botao.innerHTML = `
        <span class="massa-molar_elemento-simbolo">${simbolo}</span>
        <span class="massa-molar_elemento-massa">${dados ? formatarMassaCurta(dados.massa) : '--'}</span>
      `;
      botao.addEventListener('click', () => inserirTexto(simbolo));
      elementosContainer.appendChild(botao);
    });
  };

  const renderCompostos = () => {
    if (!compostosContainer) return;
    compostosContainer.innerHTML = '';

    compostosComuns.forEach(composto => {
      const botao = document.createElement('button');
      botao.type = 'button';
      botao.className = 'massa-molar_composto';
      botao.setAttribute('aria-label', `Usar ${composto.formula}`);
      botao.innerHTML = `
        <span class="massa-molar_composto-formula">${formatarFormulaHTML(composto.formula)}</span>
        <span class="massa-molar_composto-nome">${composto.nome}</span>
      `;
      botao.addEventListener('click', () => {
        input.value = composto.formula;
        atualizarPreview();
        toggleLimpar();
        calcular();
      });
      compostosContainer.appendChild(botao);
    });
  };

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

  renderTeclado();
  renderCompostos();
  atualizarPreview();
  toggleLimpar();
  setErro('');
  carregarElementos();
});

