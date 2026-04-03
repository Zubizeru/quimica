(() => {
  if (window.QuimicaUtils) return;

  // ========================================
  // CONSTANTES
  // ========================================
  const MIDDOT = '·';

  const ELEMENTOS = [
    'H','He','Li','Be','B','C','N','O','F','Ne',
    'Na','Mg','Al','Si','P','S','Cl','Ar',
    'K','Ca','Fe','Cu','Zn','Ag','Au'
  ];

  const COMPOSTOS = [
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

  // ========================================
  // INPUT UTILS
  // ========================================
  const inserirTexto = (input, texto) => {
    if (!input) return false;

    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;

    input.value = input.value.slice(0, start) + texto + input.value.slice(end);

    const pos = start + texto.length;
    input.setSelectionRange(pos, pos);
    input.focus();
    return true;
  };

  const apagarUltimo = (input) => {
    if (!input) return false;

    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;

    if (start !== end) return inserirTexto(input, '');

    if (start === 0) return false;

    input.value = input.value.slice(0, start - 1) + input.value.slice(end);
    input.setSelectionRange(start - 1, start - 1);
    input.focus();

    return true;
  };

  const limparInput = (input) => {
    if (!input) return false;
    input.value = '';
    input.focus();
    return true;
  };

  // ========================================
  // FORMATAÇÃO
  // ========================================
  const normalizarFormula = (str = '') =>
    String(str).replace(/\s+/g, '').replace(/\./g, MIDDOT);

  const formatarFormulaHTML = (formula = '') =>
    String(formula)
      .replace(/[^A-Za-z0-9()[\]{}·]/g, '')
      .replace(/(\d+)/g, '<sub>$1</sub>')
      .replace(/·/g, '&middot;');

  // ========================================
  // PARSER
  // ========================================
  const splitSegmentos = (formula) => {
    let nivel = 0;
    let atual = '';
    const out = [];

    for (const ch of formula) {
      if ('([{'.includes(ch)) nivel++;
      if (')]}'.includes(ch)) nivel--;

      if (nivel === 0 && ch === MIDDOT) {
        out.push(atual);
        atual = '';
        continue;
      }

      atual += ch;
    }

    if (atual) out.push(atual);
    return out;
  };

  const parseFormula = (formula) => {
    const segmentos = splitSegmentos(formula);
    const contagens = {};

    for (const seg of segmentos) {
      const res = parseSegmento(seg);
      for (const el in res) {
        contagens[el] = (contagens[el] || 0) + res[el];
      }
    }

    const ordem = Object.keys(contagens);
    return { contagens, ordem };
  };

  const parseSegmento = (seg) => {
    let i = 0;

    const lerNumero = () => {
      let num = '';
      while (/\d/.test(seg[i])) num += seg[i++];
      return num ? parseInt(num) : 1;
    };

    const parseGrupo = () => {
      const mapa = {};

      const add = (el, q) => {
        mapa[el] = (mapa[el] || 0) + q;
      };

      while (i < seg.length) {
        const ch = seg[i];

        if ('([{'.includes(ch)) {
          i++;
          const interno = parseGrupo();
          const mult = lerNumero();
          for (const el in interno) add(el, interno[el] * mult);
          continue;
        }

        if (')]}'.includes(ch)) {
          i++;
          return mapa;
        }

        if (/[A-Z]/.test(ch)) {
          let el = ch;
          i++;
          if (seg[i] && /[a-z]/.test(seg[i])) el += seg[i++];
          const qtd = lerNumero();
          add(el, qtd);
          continue;
        }

        if (/\d/.test(ch)) {
          throw new Error('Número inválido.');
        }

        throw new Error(`Caractere inválido: ${ch}`);
      }

      return mapa;
    };

    const coef = lerNumero();
    const base = parseGrupo();

    for (const el in base) base[el] *= coef;

    return base;
  };

  // ========================================
  // VALIDAÇÃO
  // ========================================
  const validarFormula = (valor) => {
    const f = normalizarFormula(valor);

    if (!f) return 'Fórmula vazia.';

    if (!/^[A-Za-z0-9()[\]{}·]+$/.test(f))
      return 'Caracteres inválidos.';

    try {
      parseFormula(f);
      return '';
    } catch (e) {
      return e.message;
    }
  };

  // ========================================
  // UI RENDER
  // ========================================
  const criarBotao = (texto, onClick, classe = '', aria = '') => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = classe;
    b.textContent = texto;
    if (aria) b.setAttribute('aria-label', aria);
    b.onclick = onClick;
    return b;
  };

  const tecladoTeclas = ['(', ')', '[', ']', '{', '}', '·', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

  const renderTeclado = ({
    container,
    teclas = tecladoTeclas,
    classeBase = '',
    classMap = {},
    onInserir,
    onApagar,
    onLimpar
  } = {}) => {
    if (!container) return;
    container.innerHTML = '';

    const criarTecla = (valor) => {
      const btn = criarBotao(valor, () => onInserir && onInserir(valor), classeBase);
      btn.setAttribute('data-quimica-tecla', valor);
      return btn;
    };

    teclas.forEach(tecla => {
      container.appendChild(criarTecla(tecla));
    });

    if (onApagar) {
      const apagarBtn = criarBotao('⌫', onApagar, classMap.acao || '', 'Apagar último caractere');
      container.appendChild(apagarBtn);
    }

    if (onLimpar) {
      const limparBtn = criarBotao('C', onLimpar, classMap.limpar || '', 'Limpar fórmula');
      container.appendChild(limparBtn);
    }
  };

  const renderElementos = ({
    container,
    elementos = [],
    classeBotao = '',
    getAriaLabel,
    getTitle,
    renderHTML,
    onClick
  } = {}) => {
    if (!container) return;
    container.innerHTML = '';

    elementos.forEach(simbolo => {
      const botao = document.createElement('button');
      botao.type = 'button';
      botao.className = classeBotao;
      botao.setAttribute('aria-label', getAriaLabel ? getAriaLabel(simbolo) : simbolo);
      if (getTitle) botao.title = getTitle(simbolo);
      botao.innerHTML = renderHTML ? renderHTML(simbolo) : simbolo;
      botao.onclick = () => onClick && onClick(simbolo);
      container.appendChild(botao);
    });
  };

  const renderCompostos = ({
    container,
    compostos = [],
    classeBotao = '',
    getAriaLabel,
    renderHTML,
    onClick
  } = {}) => {
    if (!container) return;
    container.innerHTML = '';

    compostos.forEach(composto => {
      const botao = document.createElement('button');
      botao.type = 'button';
      botao.className = classeBotao;
      botao.setAttribute('aria-label', getAriaLabel ? getAriaLabel(composto) : composto.formula);
      botao.innerHTML = renderHTML ? renderHTML(composto) : composto.formula;
      botao.onclick = () => onClick && onClick(composto);
      container.appendChild(botao);
    });
  };

  const renderLista = (container, lista, handler, classe) => {
    if (!container) return;
    container.innerHTML = '';

    lista.forEach(item => {
      const valor = typeof item === 'string' ? item : item.formula;

      const btn = criarBotao(valor, () => handler(item), classe);
      container.appendChild(btn);
    });
  };

  // ========================================
  // EXPORT
  // ========================================
  window.QuimicaUtils = {
    MIDDOT,
    ELEMENTOS,
    COMPOSTOS,

    // Aliases para compatibilidade
    elementosComuns: ELEMENTOS,
    compostosComuns: COMPOSTOS,
    tecladoTeclas,

    inserirTexto,
    apagarUltimo,
    limparInput,

    normalizarFormula,
    formatarFormulaHTML,

    splitSegmentos,
    parseFormula,
    parseSegmento,
    validarFormula,

    renderTeclado,
    renderElementos,
    renderCompostos,
    renderLista
  };
})();