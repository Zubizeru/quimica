const fs = require('fs');
const path = require('path');

// Função simples para minificar CSS
function minifyCSS(css) {
    return css
        .replace(/\/\*[\s\S]*?\*\//g, '') // remove comentários
        .replace(/\s+/g, ' ') // múltiplos espaços para um
        .replace(/\s*{\s*/g, '{') // remove espaços ao redor de {
        .replace(/\s*}\s*/g, '}') // remove espaços ao redor de }
        .replace(/\s*;\s*/g, ';') // remove espaços ao redor de ;
        .replace(/\s*:\s*/g, ':') // remove espaços ao redor de :
        .replace(/,\s*/g, ',') // remove espaços após ,
        .trim();
}

// Função simples para minificar JS
function minifyJS(js) {
    return js
        .replace(/\/\*[\s\S]*?\*\//g, '') // remove comentários /* */
        .replace(/\/\/.*$/gm, '') // remove comentários //
        .replace(/\s+/g, ' ') // múltiplos espaços para um
        .replace(/\s*{\s*/g, '{')
        .replace(/\s*}\s*/g, '}')
        .replace(/\s*\(\s*/g, '(')
        .replace(/\s*\)\s*/g, ')')
        .replace(/\s*;\s*/g, ';')
        .replace(/\s*,\s*/g, ',')
        .replace(/\s*=\s*/g, '=')
        .trim();
}

// Arquivos a minificar
const files = [
    { src: 'public/js/main.js', dest: 'public/js/main.min.js', type: 'js' },
    { src: 'public/css/main.css', dest: 'public/css/main.min.css', type: 'css' },
    { src: 'public/css/hubinicial.css', dest: 'public/css/hubinicial.min.css', type: 'css' },
    { src: 'public/js/tabela.js', dest: 'public/js/tabela.min.js', type: 'js' },
    { src: 'public/css/tabela.css', dest: 'public/css/tabela.min.css', type: 'css' },
    { src: 'public/js/massamolar.js', dest: 'public/js/massamolar.min.js', type: 'js' },
    { src: 'public/css/massamolar.css', dest: 'public/css/massamolar.min.css', type: 'css' },
    { src: 'public/js/conversormolmassa.js', dest: 'public/js/conversormolmassa.min.js', type: 'js' },
    { src: 'public/css/conversormolmassa.css', dest: 'public/css/conversormolmassa.min.css', type: 'css' },
];

files.forEach(({ src, dest, type }) => {
    const fullSrc = path.join(__dirname, src);
    const fullDest = path.join(__dirname, dest);

    if (fs.existsSync(fullSrc)) {
        const content = fs.readFileSync(fullSrc, 'utf8');
        const minified = type === 'css' ? minifyCSS(content) : minifyJS(content);
        fs.writeFileSync(fullDest, minified);
        console.log(`Minificado: ${src} -> ${dest}`);
    } else {
        console.log(`Arquivo não encontrado: ${src}`);
    }
});

console.log('Minificação concluída!');