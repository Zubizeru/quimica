const express = require('express');
const { engine } = require('express-handlebars');
const path = require('path');

const app = express();
app.engine('handlebars', engine({
  extname: '.handlebars',
  layoutsDir: path.join(__dirname, 'views', 'layouts'),
  partialsDir: path.join(__dirname, 'views', 'partials')
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views', 'partials'));

// carregar dados dos elementos
const elementos = require('./data/elementos.json');

// disponibilizar o JSON para o front-end
app.use('/data', express.static(path.join(__dirname, 'data')));

// === constantes químicas =================================================
const ALKALI_METALS = [3, 11, 19, 37, 55, 87];
const ALKALINE_EARTHS = [4, 12, 20, 38, 56, 88];
const TRANSITION_RANGES = [
  [21, 30], [39, 48], [72, 80], [104, 112]
];
const P_BLOCK_METALS = [13, 31, 49, 81, 50, 82, 83, 84, 113, 114, 115, 116];
const NON_METALS = [1, 6, 7, 8, 15, 16, 34];
const HALOGENS = [9, 17, 35, 53, 85, 117];
const NOBLE_GASES = [2, 10, 18, 36, 54, 86, 118];
const METALLOIDS = [5, 14, 32, 33, 51, 52, 84, 85];

const CSS_LOOKUP = {
  'metal-alcalino': 'alcalino',
  'metal-alcalino-terroso': 'alcalino-terroso',
  'metal-pos-transicao': 'pos-transicao'
};

const normalizarValor = (valor) => {
  if (valor === null || valor === undefined) return '';
  return String(valor).trim();
};

const inferirBloco = (grupo, isFblock) => {
  if (isFblock) return 'f';
  const g = parseInt(grupo, 10);
  if (!Number.isFinite(g)) return '';
  if (g <= 2) return 's';
  if (g >= 13) return 'p';
  return 'd';
};

// === funções auxiliares ==================================================
/**
 * Retorna a linha da grade associada a um número atômico.
 * A tabela principal usa 1‑7; elementos f são reposicionados depois.
 */
const computeRow = numero => {
  if (numero <= 2) return 1;
  if (numero <= 10) return 2;
  if (numero <= 18) return 3;
  if (numero <= 36) return 4;
  if (numero <= 54) return 5;
  if (numero <= 86) return 6;
  if (numero <= 118) return 7;
  return null;
};

/**
 * Classifica um elemento em categorias usadas para filtro/cores.
 * A lógica é derivada do número atômico e ignorará propriedades
 * armazenadas no JSON, o que facilita alterações futuras.
 */
function classifyElement({ numero }) {
  if (ALKALI_METALS.includes(numero)) return 'metal-alcalino';
  if (ALKALINE_EARTHS.includes(numero)) return 'metal-alcalino-terroso';
  if (numero >= 57 && numero <= 71) return 'lantanideo';
  if (numero >= 89 && numero <= 103) return 'actinideo';

  if (TRANSITION_RANGES.some(([a, b]) => numero >= a && numero <= b))
    return 'metal-transicao';

  if (P_BLOCK_METALS.includes(numero)) return 'metal-pos-transicao';
  if (NON_METALS.includes(numero)) return 'nao-metal';
  if (HALOGENS.includes(numero)) return 'halogenio';
  if (NOBLE_GASES.includes(numero)) return 'gas-nobre';
  if (METALLOIDS.includes(numero)) return 'metaloide';

  return 'outro';
}

/**
 * Adiciona um placeholder estilizado à lista (usado para a linha f).
 */
const addPlaceholder = (arr, { simbolo, row, col, cssVar, category, extraClass }) => {
  arr.push({
    numero: null,
    simbolo,
    nome: '',
    massa_molar: '',
    camadas: [],
    descricao: '',
    row,
    col,
    cssVar,
    category,
    extraClass: extraClass || ''
  });
};

// === construção da tabela ===============================================
let tabelaElements = elementos.map(e => {
  let row = computeRow(e.numero);
  let isFblock = false;
  let series = null;
  const grupoValor = normalizarValor(e.grupo);

  if (e.numero >= 57 && e.numero <= 71) {
    row = 8; isFblock = true; series = 'lanth';
  } else if (e.numero >= 89 && e.numero <= 103) {
    row = 9; isFblock = true; series = 'act';
  }

  let col;
  if (isFblock) {
    const base = series === 'lanth' ? 56 : 88;
    col = e.numero - base + 3; // espalha f‑block horizontamente
  } else {
    col = parseInt(grupoValor, 10);
  }
  // desloca todas as colunas em uma unidade para abrir a coluna de períodos
  col += 1;

  const category = classifyElement(e);
  const cssVar = 'categoria-' + (CSS_LOOKUP[category] || category);
  const periodoValor = normalizarValor(e.periodo)
    || (isFblock ? (series === 'lanth' ? '6' : '7') : String(computeRow(e.numero)));
  const blocoValor = normalizarValor(e.bloco) || inferirBloco(grupoValor, isFblock);
  const camadasTexto = Array.isArray(e.camadas)
    ? e.camadas.join(',')
    : normalizarValor(e.camadas);
  const configuracaoValor = normalizarValor(e.configuracao_eletronica)
    || (camadasTexto ? `Camadas: ${camadasTexto}` : '');

  return {
    ...e,
    row,
    col,
    cssVar,
    isFblock,
    series,
    category,
    grupo: grupoValor,
    periodo: periodoValor,
    bloco: blocoValor,
    configuracao_eletronica: configuracaoValor
  };
});

// marcadores fixos para indicar onde ficaria o bloco-f
addPlaceholder(tabelaElements, {
  simbolo: '57-71\n*',
  row: 6,
  col: 4,  // deslocado para a direita um espaco
  cssVar: 'categoria-lantanideo',
  category: 'lantanideo',
  extraClass: 'celulas-comeco-lact'
});
addPlaceholder(tabelaElements, {
  simbolo: '89-103\n**',
  row: 7,
  col: 4,
  cssVar: 'categoria-actinideo',
  category: 'actinideo',
  extraClass: 'celulas-comeco-lact'
});
addPlaceholder(tabelaElements, {
  simbolo: '*',
  row: 8,
  col: 4,
  cssVar: '',
  category: '',
  extraClass: 'celulas-listagem-lact'
});
addPlaceholder(tabelaElements, {
  simbolo: '**',
  row: 9,
  col: 4,
  cssVar: '',
  category: '',
  extraClass: 'celulas-listagem-lact'
});

tabelaElements = tabelaElements.map(el => ({
  ...el,
  extraClass: el.extraClass || '',
  gridRow: el.row + 1,
  gridCol: el.col
}));

// exemplo no seu router/handler
const grupos = Array.from({ length: 18 }, (_, i) => ({
  value: i + 1,
  col: i + 2
}));
// periodos 1‑7, com número e linha para posicionamento na grade
const periodos = Array.from({ length: 7 }, (_, i) => ({
  value: i + 1,
  row: i + 2
}));

app.get('/tabela', (req, res) => {
  res.render('tabela', {
    elementos: tabelaElements,
    grupos,
    periodos,
    /* …outros dados… */
    additionalStyles: '<link rel="stylesheet" href="/css/tabela.css">',
    showBackButton: true
  });
});

app.get('/massamolar', (req, res) => {
  res.render('massamolar', {
    additionalStyles: '<link rel="stylesheet" href="/css/massamolar.css">',
    additionalScripts: '<script src="/js/massamolar.js"></script>',
    showBackButton: true
  });
});

// simplifica: redireciona / para /tabela (ou repete a mesma renderização)
app.get('/', (req, res) => {
  res.render('hubinicial', {
    additionalStyles: '<link rel="stylesheet" href="/css/hubinicial.css">',
    showBackButton: false
  });
});

app.get('/conversormolmassa', (req, res) => {
  res.render('conversormolmassa', {
    additionalStyles: '<link rel="stylesheet" href="/css/conversormolmassa.css">',
    additionalScripts: '<script src="/js/conversormolmassa.js"></script>',
    showBackButton: true
  });
});


// rotas para as demais páginas precriadas
app.get('/ferramentas', (req, res) => res.render('ferramentas', { showBackButton: true }));
app.get('/topicos', (req, res) => res.render('topicos', { showBackButton: true }));


app.use(express.static('public')); // para css, js, etc.

app.listen(3000, () => console.log('Servidor rodando em http://localhost:3000'));
