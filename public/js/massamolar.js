// =========================
// MASSA MOLAR - JavaScript
// =========================

document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.massa-molar');
  if (!container) return;

  // Elementos do DOM
  const form = document.getElementById('form-massa-molar');
  const input = document.getElementById('formula-composto');
  const visualInput = container.querySelector('.massa-input-visual');
  const resultado = document.getElementById('resultado-massa-molar');
  const elementosBtns = container.querySelectorAll('[data-simbolo]');
  const teclas = container.querySelectorAll('[data-key]');
  const acoes = container.querySelectorAll('[data-action]');
  const compostosBtns = container.querySelectorAll('[data-formula]');

  let tabelaMassas = null;

  // Funções utilitárias
  const limparResultado = () => {
    if (!resultado) return;
    resultado.classList.remove('visivel', 'erro');
    resultado.innerHTML = '';
  };

  const formatNumero = (valor, casas = 4) => valor.toFixed(casas);

  // Função para mostrar resultado
  const mostrarResultado = (formula, total, itens) => {
    if (!resultado) return;
    resultado.classList.remove('erro');
    resultado.classList.add('visivel');
    const linhasDetalhe = itens.map((item) => `
      <div class="resultado-linha">
        <span class="resultado-simbolo">${item.simbolo}</span>
        <span>${item.quantidade}</span>
        <span>${formatNumero(item.massa)} g/mol</span>
        <span>${formatNumero(item.total)} g/mol</span>
      </div>
    `).join('');

    const linhasPercentual = itens.map((item) => `
      <div class="percentual-linha">
        <span class="resultado-simbolo">${item.simbolo}</span>
        <div class="percentual-barra">
          <span style="width: ${item.percentual.toFixed(2)}%"></span>
        </div>
        <span class="percentual-valor">${item.percentual.toFixed(2)}%</span>
      </div>
    `).join('');

    const formulaHtml = formatarFormulaHtml(formula);

    resultado.innerHTML = `
      <div class="resultado-topo">
        <span class="resultado-legenda">Massa Molar de</span>
        <span class="resultado-formula-destaque">${formulaHtml}</span>
        <span class="resultado-valor-destaque">${formatNumero(total)} g/mol</span>
      </div>
      <div class="resultado-bloco">
        <div class="resultado-tabela">
          <div class="resultado-cabecalho">
            <span>Elemento</span>
            <span>Quantidade</span>
            <span>Massa Molar</span>
            <span>Total</span>
          </div>
          ${linhasDetalhe}
          <div class="resultado-rodape">
            <span></span>
            <span></span>
            <span>Total:</span>
            <span>${formatNumero(total)} g/mol</span>
          </div>
        </div>
      </div>
      <div class="resultado-bloco">
        <span class="resultado-titulo-bloco">Massa Percentual</span>
        <div class="resultado-percentual">
          <div class="percentual-cabecalho">
            <span>Elemento</span>
            <span></span>
            <span>Porcentagem</span>
          </div>
          ${linhasPercentual}
        </div>
      </div>
    `;
  };

  // Função para mostrar erro
  const mostrarErro = (mensagem) => {
    if (!resultado) return;
    resultado.classList.add('visivel', 'erro');
    resultado.innerHTML = `
      <span class="resultado-titulo">Erro</span>
      <span class="resultado-valor">${mensagem}</span>
    `;
  };

  // Funções de parsing e formatação
  const parseMassa = (valor) => {
    if (valor === null || valor === undefined) return null;
    const texto = String(valor).replace(',', '.');
    const numero = parseFloat(texto);
    return Number.isFinite(numero) ? numero : null;
  };

  const escapeHtml = (texto) => texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const formatarFormulaHtml = (texto) => {
    const seguro = escapeHtml(texto);
    return seguro.replace(/\d+/g, (match) => `<sub>${match}</sub>`);
  };

  // Função para renderizar input visual
  const renderizarInputVisual = () => {
    if (!visualInput || !input) return;
    const valor = input.value;
    const placeholder = input.getAttribute('placeholder') || '';

    if (!valor) {
      visualInput.classList.add('placeholder');
      visualInput.textContent = placeholder;
      return;
    }

    visualInput.classList.remove('placeholder');
    visualInput.innerHTML = formatarFormulaHtml(valor);
  };

  // Função para atualizar massas visuais nos botões
  const atualizarMassasVisuais = () => {
    if (!tabelaMassas) return;
    elementosBtns.forEach((btn) => {
      const simbolo = btn.dataset.simbolo;
      const massa = tabelaMassas.get(simbolo);
      const alvo = btn.querySelector('.elemento-massa');
      if (alvo && Number.isFinite(massa)) {
        alvo.textContent = massa.toFixed(1);
      }
    });
  };

  // Função para carregar elementos da tabela periódica
  const carregarElementos = async () => {
    try {
      const resposta = await fetch('/data/elementos.json');
      if (!resposta.ok) throw new Error('Falha ao carregar elementos');

      const dados = await resposta.json();
      tabelaMassas = new Map();

      dados.forEach((elemento) => {
        const simbolo = (elemento.simbolo || '').trim();
        const massa = parseMassa(elemento.massa_molar);
        if (simbolo && Number.isFinite(massa)) {
          tabelaMassas.set(simbolo, massa);
        }
      });

      atualizarMassasVisuais();
    } catch (erro) {
      mostrarErro('Não foi possível carregar a tabela de elementos.');
    }
  };

  // Função para parsear fórmula química
  const parseFormula = (entrada) => {
    const formula = entrada.replace(/\s+/g, '');
    if (!formula) throw new Error('Informe uma fórmula química.');

    const stack = [new Map()];
    let i = 0;

    const lerNumero = () => {
      let numero = '';
      while (i < formula.length && /\d/.test(formula[i])) {
        numero += formula[i];
        i += 1;
      }
      return numero ? parseInt(numero, 10) : 1;
    };

    while (i < formula.length) {
      const char = formula[i];

      if (char === '(') {
        stack.push(new Map());
        i += 1;
        continue;
      }

      if (char === ')') {
        i += 1;
        const multiplicador = lerNumero();
        if (stack.length === 1) {
          throw new Error('Parênteses fechando sem abrir.');
        }
        const topo = stack.pop();
        const destino = stack[stack.length - 1];
        topo.forEach((quantidade, simbolo) => {
          const total = quantidade * multiplicador;
          destino.set(simbolo, (destino.get(simbolo) || 0) + total);
        });
        continue;
      }

      if (/[A-Z]/.test(char)) {
        let simbolo = char;
        i += 1;
        if (i < formula.length && /[a-z]/.test(formula[i])) {
          simbolo += formula[i];
          i += 1;
        }
        const quantidade = lerNumero();
        const destino = stack[stack.length - 1];
        destino.set(simbolo, (destino.get(simbolo) || 0) + quantidade);
        continue;
      }

      if (/[a-z]/.test(char)) {
        throw new Error('Use letras maiúsculas para iniciar cada símbolo químico.');
      }

      throw new Error(`Caractere inválido: ${char}`);
    }

    if (stack.length !== 1) {
      throw new Error('Parênteses não fechados.');
    }

    return stack[0];
  };

  // Função principal de cálculo
  const calcular = () => {
    limparResultado();

    const formula = input ? input.value.trim() : '';
    if (!formula) {
      mostrarErro('Informe uma fórmula química.');
      return;
    }

    if (!tabelaMassas) {
      mostrarErro('Carregando dados dos elementos. Tente novamente.');
      return;
    }

    let composicao;
    try {
      composicao = parseFormula(formula);
    } catch (erro) {
      mostrarErro(erro.message);
      return;
    }

    let total = 0;
    const faltantes = [];
    const itens = [];

    composicao.forEach((quantidade, simbolo) => {
      const massa = tabelaMassas.get(simbolo);
      if (!Number.isFinite(massa)) {
        faltantes.push(simbolo);
        return;
      }
      const totalElemento = massa * quantidade;
      itens.push({
        simbolo,
        quantidade,
        massa,
        total: totalElemento
      });
      total += totalElemento;
    });

    if (faltantes.length) {
      mostrarErro(`Elemento(s) não encontrado(s): ${faltantes.join(', ')}`);
      return;
    }

    const itensComPercentual = itens.map((item) => ({
      ...item,
      percentual: total > 0 ? (item.total / total) * 100 : 0
    }));

    mostrarResultado(formula, total, itensComPercentual);
  };

  // Funções para manipulação do input
  const inserirNoInput = (texto) => {
    if (!input) return;
    const inicio = input.selectionStart ?? input.value.length;
    const fim = input.selectionEnd ?? input.value.length;
    const valorAtual = input.value;
    input.value = `${valorAtual.slice(0, inicio)}${texto}${valorAtual.slice(fim)}`;
    const novaPosicao = inicio + texto.length;
    input.setSelectionRange(novaPosicao, novaPosicao);
    input.focus();
    limparResultado();
    renderizarInputVisual();
  };

  const removerNoInput = () => {
    if (!input) return;
    const inicio = input.selectionStart ?? input.value.length;
    const fim = input.selectionEnd ?? input.value.length;

    if (inicio !== fim) {
      input.value = `${input.value.slice(0, inicio)}${input.value.slice(fim)}`;
      input.setSelectionRange(inicio, inicio);
      input.focus();
      limparResultado();
      renderizarInputVisual();
      return;
    }

    if (inicio <= 0) return;

    input.value = `${input.value.slice(0, inicio - 1)}${input.value.slice(fim)}`;
    const novaPosicao = inicio - 1;
    input.setSelectionRange(novaPosicao, novaPosicao);
    input.focus();
    limparResultado();
    renderizarInputVisual();
  };

  const limparInput = () => {
    if (!input) return;
    input.value = '';
    input.focus();
    limparResultado();
    renderizarInputVisual();
  };

  // Event listeners
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      calcular();
    });
  }

  if (input) {
    input.addEventListener('input', () => {
      limparResultado();
      renderizarInputVisual();
    });
  }

  elementosBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      inserirNoInput(btn.dataset.simbolo || '');
    });
  });

  teclas.forEach((btn) => {
    btn.addEventListener('click', () => {
      inserirNoInput(btn.dataset.key || '');
    });
  });

  acoes.forEach((btn) => {
    btn.addEventListener('click', () => {
      const acao = btn.dataset.action;
      if (acao === 'backspace') removerNoInput();
      if (acao === 'clear') limparInput();
    });
  });

  compostosBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const formula = btn.dataset.formula || '';
      if (input) input.value = formula;
      renderizarInputVisual();
      calcular();
    });
  });

  // Inicialização
  carregarElementos();
  renderizarInputVisual();
});

