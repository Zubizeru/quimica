const express = require('express');
const { engine } = require('express-handlebars');
const path = require('path');

const app = express();
app.engine('handlebars', engine({ extname: '.handlebars' }));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// carregar dados dos elementos
const elementos = require('./data/elementos.json');

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

// utilitário para gerar ranges numéricos
const range = (start, end) => {
  const arr = [];
  for (let i = start; i <= end; i++) arr.push(i);
  return arr;
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
const addPlaceholder = (arr, { simbolo, row, col, cssVar, category }) => {
  arr.push({
    numero: null,
    simbolo,
    nome: '',
    massa_molar: '',
    camadas_eletrons: '',
    descricao: '',
    row,
    col,
    cssVar,
    category
  });
};

// === construção da tabela ===============================================
let tabelaElements = elementos.map(e => {
  let row = computeRow(e.numero);
  let isFblock = false;
  let series = null;

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
    col = parseInt(e.grupo, 10);
  }

  const category = classifyElement(e);
  const cssVar = 'categoria-' + (CSS_LOOKUP[category] || category);

  return { ...e, row, col, cssVar, isFblock, series, category };
});

// marcadores fixos para indicar onde ficaria o bloco‑f
addPlaceholder(tabelaElements, {
  simbolo: '57-71\n*',
  row: 6,
  col: 3,
  cssVar: 'categoria-lantanideo',
  category: 'lantanideo'
});
addPlaceholder(tabelaElements, {
  simbolo: '89-103\n**',
  row: 7,
  col: 3,
  cssVar: 'categoria-actinideo',
  category: 'actinideo'
});
addPlaceholder(tabelaElements, {
  simbolo: '*',
  row: 8,
  col: 3,
  cssVar: '',
  category: ''
});
addPlaceholder(tabelaElements, {
  simbolo: '**',
  row: 9,
  col: 3,
  cssVar: '',
  category: ''
});

// indices especiais para customização de estilo em cima da renderização
const specialIndices = {
  comeco: [118, 119],   // células iniciais (anteriormente "primeiros")
  listagem: [120, 121]  // células finais (anteriormente "ultimos")
};

tabelaElements = tabelaElements.map((el, idx) => {
  const classes = [];
  if (specialIndices.comeco.includes(idx)) classes.push('celulas-comeco-lact');
  if (specialIndices.listagem.includes(idx)) classes.push('celulas-listagem-lact');
  return { ...el, extraClass: classes.join(' ') };
});


app.get('/', (req, res) => {
  res.render('tabela', { elementos: tabelaElements });
});

// rotas para as demais páginas precriadas
app.get('/opcao2', (req, res) => res.render('opcao2'));
app.get('/opcao3', (req, res) => res.render('opcao3'));
app.get('/opcao4', (req, res) => res.render('opcao4'));

app.use(express.static('public')); // para css, js, etc.

app.listen(3000, () => console.log('Servidor rodando em http://localhost:3000'));