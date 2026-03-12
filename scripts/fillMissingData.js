// Dados científicos de referência confiáveis (IUPAC, CRC Handbook, WebElements)
const elementData = {
  // Gases nobres - eletronegatividade N/A (correto)
  2: { eletronegatividade: "N/A" }, // He
  10: { eletronegatividade: "N/A" }, // Ne
  18: { eletronegatividade: "N/A" }, // Ar
  36: { eletronegatividade: "N/A" }, // Kr
  54: { eletronegatividade: "N/A" }, // Xe
  86: { eletronegatividade: "N/A" }, // Rn

  // Metais comuns - COMPLETAR DADOS
  24: { eletronegatividade: "1.66", densidade: "7.19 g/cm³", ponto_fusao: "1907 °C", ponto_ebulicao: "2671 °C" }, // Cr
  25: { eletronegatividade: "1.55", densidade: "7.44 g/cm³", ponto_fusao: "1246 °C", ponto_ebulicao: "2061 °C" }, // Mn
  26: { eletronegatividade: "1.83", densidade: "7.87 g/cm³", ponto_fusao: "1538 °C", ponto_ebulicao: "2862 °C" }, // Fe
  27: { eletronegatividade: "1.88", densidade: "8.90 g/cm³", ponto_fusao: "1495 °C", ponto_ebulicao: "2927 °C" }, // Co
  28: { eletronegatividade: "1.91", densidade: "8.90 g/cm³", ponto_fusao: "1455 °C", ponto_ebulicao: "2913 °C" }, // Ni
  29: { eletronegatividade: "1.90", densidade: "8.96 g/cm³", ponto_fusao: "1085 °C", ponto_ebulicao: "2562 °C" }, // Cu
  30: { eletronegatividade: "1.65", densidade: "7.14 g/cm³", ponto_fusao: "420 °C", ponto_ebulicao: "907 °C" }, // Zn
  47: { eletronegatividade: "1.93", densidade: "10.50 g/cm³", ponto_fusao: "962 °C", ponto_ebulicao: "2162 °C" }, // Ag
  79: { eletronegatividade: "2.54", densidade: "19.30 g/cm³", ponto_fusao: "1064 °C", ponto_ebulicao: "2970 °C" }, // Au
  80: { eletronegatividade: "2.00", densidade: "13.55 g/cm³", ponto_fusao: "-39 °C", ponto_ebulicao: "357 °C" }, // Hg

  // Elementos radioativos/sintéticos - manter N/A (dados estimados/incertos)
  43: { eletronegatividade: "1.9", densidade: "N/A", ponto_fusao: "N/A", ponto_ebulicao: "N/A" }, // Tc
  61: { eletronegatividade: "N/A", densidade: "N/A", ponto_fusao: "N/A", ponto_ebulicao: "N/A" }, // Pm
  84: { eletronegatividade: "2.0", densidade: "9.32 g/cm³", ponto_fusao: "254 °C", ponto_ebulicao: "962 °C" }, // Po
  85: { eletronegatividade: "2.2", densidade: "N/A", ponto_fusao: "N/A", ponto_ebulicao: "N/A" }, // At
  87: { eletronegatividade: "0.7", densidade: "N/A", ponto_fusao: "N/A", ponto_ebulicao: "N/A" }, // Fr

  // Actinídeos - dados incertos para >92 (N/A)
  // 89-92 têm dados disponíveis
  89: { eletronegatividade: "1.1", densidade: "10.07 g/cm³", ponto_fusao: "1050 °C", ponto_ebulicao: "3200 °C" }, // Ac
  90: { eletronegatividade: "1.3", densidade: "11.72 g/cm³", ponto_fusao: "1750 °C", ponto_ebulicao: "4788 °C" }, // Th
  91: { eletronegatividade: "1.5", densidade: "15.37 g/cm³", ponto_fusao: "1572 °C", ponto_ebulicao: "4027 °C" }, // Pa
  92: { eletronegatividade: "1.38", densidade: "19.10 g/cm³", ponto_fusao: "1135 °C", ponto_ebulicao: "4131 °C" }, // U
};

const fs = require('fs');
const path = 'data/elementos.json';
let data = JSON.parse(fs.readFileSync(path, 'utf8'));

data = data.map(el => {
  const extras = elementData[el.numero];
  if (extras) {
    return { ...el, ...extras };
  }
  return el;
});

fs.writeFileSync(path, JSON.stringify(data, null, 4), 'utf8');
console.log('Preenchidos dados de', Object.keys(elementData).length, 'elementos');
