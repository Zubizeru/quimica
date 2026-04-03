const fs = require('fs/promises');

const NIST_URL =
  'https://physics.nist.gov/cgi-bin/ASD/ie.pl?at_num_out=on&el_name_out=on&shells_out=on&spectra=H-DS+i&units=1&format=3';
const CIAAW_URL = 'https://www.ciaaw.org/abridged-atomic-weights.htm';

const SUP_MAP = {
  '⁰': '0',
  '¹': '1',
  '²': '2',
  '³': '3',
  '⁴': '4',
  '⁵': '5',
  '⁶': '6',
  '⁷': '7',
  '⁸': '8',
  '⁹': '9'
};

const CORE_EXPANSOES = {
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

const NOBLE_EXPANSOES = {
  He: CORE_EXPANSOES.He,
  Ne: CORE_EXPANSOES.Ne,
  Ar: CORE_EXPANSOES.Ar,
  Kr: CORE_EXPANSOES.Kr,
  Xe: CORE_EXPANSOES.Xe,
  Rn: CORE_EXPANSOES.Rn,
  Og: CORE_EXPANSOES.Og
};

const NOBLE_ORDEM = ['Og', 'Rn', 'Xe', 'Kr', 'Ar', 'Ne', 'He'];

const decodeHtml = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&plusmn;/gi, '±')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/<[^>]+>/g, ' ');

const normalizarSuperscrito = (texto) =>
  texto
    .replace(/\^\{(\d+)\}/g, '$1')
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (ch) => SUP_MAP[ch] || ch);

const normalizarShells = (shells) => {
  if (!shells) return '';
  let texto = normalizarSuperscrito(shells);
  texto = texto.replace(/\./g, ' ');
  texto = texto.replace(/(\d)\s+([spdf])/gi, '$1$2');
  texto = texto.replace(/\s+/g, ' ').trim();

  const tokens = texto.split(' ').filter(Boolean);
  let core = '';
  if (tokens[0] && tokens[0].startsWith('[')) {
    core = tokens.shift();
  }

  const convertidos = tokens
    .map((token) => {
      const match = token.match(/^(\d+)([spdf])(\d+)?$/i);
      if (!match) return null;
      const exp = match[3] || '1';
      return `${match[1]}${match[2]}${exp}`;
    })
    .filter(Boolean);

  if (!convertidos.length && !core) return '';
  return core ? `${core} ${convertidos.join(' ')}`.trim() : convertidos.join(' ').trim();
};

const parseNist = (content) => {
  const map = new Map();
  if (content.includes('\t') && content.includes('At. num')) {
    const linhas = content.split(/\r?\n/).filter((l) => l.trim());
    linhas.forEach((linha) => {
      if (/^At\. num/i.test(linha)) return;
      const cols = linha.split('\t').map((c) => c.replace(/^\"|\"$/g, '').trim());
      const numero = parseInt(cols[0], 10);
      if (!Number.isFinite(numero)) return;
      const shellsCell = cols[2];
      if (!shellsCell) return;
      const config = normalizarShells(shellsCell);
      if (config) map.set(numero, config);
    });
    return map;
  }

  const html = content;
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;
  let foundTable = false;

  while ((rowMatch = rowRegex.exec(html))) {
    foundTable = true;
    const rowHtml = rowMatch[1];
    const cells = [];
    const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let cellMatch;
    while ((cellMatch = cellRegex.exec(rowHtml))) {
      const cellText = decodeHtml(cellMatch[1]).replace(/\s+/g, ' ').trim();
      if (cellText) cells.push(cellText);
    }
    if (!cells.length) continue;
    const numero = parseInt(cells[0], 10);
    if (!Number.isFinite(numero)) continue;
    const shellsCell = cells.find((cell) => /\d\s*[spdf]/i.test(cell));
    if (!shellsCell) continue;
    const config = normalizarShells(shellsCell);
    if (config) map.set(numero, config);
  }

  if (foundTable && map.size) return map;

  const texto = decodeHtml(html);
  const linhas = texto.split(/\r?\n/);
  for (const linha of linhas) {
    if (!/^\s*\d+/.test(linha)) continue;
    const partes = linha.trim().split(/\s{2,}/);
    if (partes.length < 3) continue;
    const numero = parseInt(partes[0], 10);
    if (!Number.isFinite(numero)) continue;
    const shellsCell = partes.find((parte, idx) => idx > 0 && /\d\s*[spdf]/i.test(parte));
    if (!shellsCell) continue;
    const config = normalizarShells(shellsCell);
    if (config) map.set(numero, config);
  }

  return map;
};

const parseCiaaw = (html) => {
  const map = new Map();
  const texto = decodeHtml(html);
  const linhas = texto.split(/\r?\n/);

  for (const linha of linhas) {
    const line = linha.replace(/\s+/g, ' ').trim();
    if (!/^\d+\s+[A-Z]/.test(line)) continue;
    const match = line.match(
      /^(\d+)\s+([A-Z][a-z]?)(?:\s+)?([A-Za-z]+)\s+([0-9.]+)\s*(?:±|$)/i
    );
    if (!match) continue;
    const numero = parseInt(match[1], 10);
    const peso = parseFloat(match[4]);
    if (!Number.isFinite(numero) || !Number.isFinite(peso)) continue;
    map.set(numero, peso);
  }

  return map;
};

const expandirConfiguracao = (config) =>
  config.replace(/\[(He|Ne|Ar|Kr|Cd|Xe|Hg|Rn|Og)\]/g, (match, gas) => CORE_EXPANSOES[gas] || match);

const abreviarConfiguracao = (config) => {
  if (!config) return '';
  const expandida = expandirConfiguracao(String(config)).replace(/\s+/g, ' ').trim();

  for (const gas of NOBLE_ORDEM) {
    const core = NOBLE_EXPANSOES[gas];
    if (!core) continue;
    if (expandida.startsWith(core)) {
      const resto = expandida.slice(core.length).trim();
      if (!resto) return expandida;
      return `[${gas}] ${resto}`.trim();
    }
  }

  return expandida;
};

const calcularCamadas = (config) => {
  if (!config) return null;
  const expandida = expandirConfiguracao(config)
    .replace(/\([^)]*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const tokens = expandida.match(/\d+[spdf]\d+/gi) || [];
  if (!tokens.length) return null;

  const porCamada = {};
  tokens.forEach((token) => {
    const match = token.match(/^(\d+)([spdf])(\d+)$/i);
    if (!match) return;
    const camada = Number(match[1]);
    const eletrons = Number(match[3]);
    if (!Number.isFinite(camada) || !Number.isFinite(eletrons)) return;
    porCamada[camada] = (porCamada[camada] || 0) + eletrons;
  });

  const camadas = Object.keys(porCamada)
    .map((n) => Number(n))
    .sort((a, b) => a - b)
    .map((n) => porCamada[n]);

  return camadas.length ? camadas : null;
};

const atualizar = async () => {
  const [nistResp, ciaawResp] = await Promise.all([fetch(NIST_URL), fetch(CIAAW_URL)]);
  if (!nistResp.ok) throw new Error(`Falha ao baixar NIST: ${nistResp.status}`);
  if (!ciaawResp.ok) throw new Error(`Falha ao baixar CIAAW: ${ciaawResp.status}`);

  const [nistHtml, ciaawHtml] = await Promise.all([nistResp.text(), ciaawResp.text()]);
  const nistMap = parseNist(nistHtml);
  const ciaawMap = parseCiaaw(ciaawHtml);

  const raw = await fs.readFile('data/elementos.json', 'utf8');
  const elementos = JSON.parse(raw.replace(/^\uFEFF/, ''));

  elementos.forEach((el) => {
    if (!el || !el.numero) return;

    const numero = Number(el.numero);
    if (Number.isFinite(numero) && nistMap.has(numero)) {
      const configNist = nistMap.get(numero);
      el.configuracao_eletronica = abreviarConfiguracao(configNist);
    }

    if (Number.isFinite(numero) && ciaawMap.has(numero)) {
      el.massa_molar = ciaawMap.get(numero);
      if (!el.massa_molar_unidade) el.massa_molar_unidade = 'g/mol';
    }

    const camadas = calcularCamadas(String(el.configuracao_eletronica || ''));
    if (camadas && camadas.length) el.camadas = camadas;
  });

  const conteudo = '\uFEFF' + JSON.stringify(elementos, null, 4);
  await fs.writeFile('data/elementos.json', conteudo);

  console.log(`Atualizado: configs=${nistMap.size}, massas=${ciaawMap.size}, elementos=${elementos.length}`);
};

atualizar().catch((err) => {
  console.error(err);
  process.exit(1);
});
