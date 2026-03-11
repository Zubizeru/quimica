// ========================================
// SCRIPT PRINCIPAL
// ========================================

document.addEventListener('DOMContentLoaded', () => {

  let selecionada = null;

  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);

  const card = $('.cardnomeelemento');
  const descricaoBox = $('.descricaodoelemento');
  const elementos = $$('.celula-elemento');
  const filtros = $$('.filtro-item');
  const body = document.body;
  const botaoTema = $('#botaoTema');
  const menu = $('.menuinicial');
  const botaoMenu = $('#botaoMenu');
  const linksMenu = $$('.links a');

  const atualizarAlturaMenu = () => {
    if (!menu) return;
    document.documentElement.style.setProperty('--menu-altura', `${menu.offsetHeight}px`);
  };

  atualizarAlturaMenu();
  window.addEventListener('resize', atualizarAlturaMenu);

  if (botaoMenu && menu) {
    botaoMenu.addEventListener('click', () => {
      const aberto = menu.classList.toggle('menu-aberto');
      menu.classList.remove('menu-oculto');
      botaoMenu.setAttribute('aria-expanded', aberto ? 'true' : 'false');

      const icone = botaoMenu.querySelector('i');
      if (icone) {
        icone.classList.toggle('fa-bars', !aberto);
        icone.classList.toggle('fa-xmark', aberto);
      }
    });

    linksMenu.forEach(link => {
      link.addEventListener('click', () => {
        if (!menu.classList.contains('menu-aberto')) return;
        menu.classList.remove('menu-aberto');
        botaoMenu.setAttribute('aria-expanded', 'false');
        const icone = botaoMenu.querySelector('i');
        if (icone) {
          icone.classList.remove('fa-xmark');
          icone.classList.add('fa-bars');
        }
      });
    });
  }

  if (menu) {
    let lastScrollY = window.scrollY || document.documentElement.scrollTop;
    let ticking = false;
    const threshold = 2;

    const onScroll = () => {
      const current = window.scrollY || document.documentElement.scrollTop;

      if (menu.classList.contains('menu-aberto')) {
        lastScrollY = current;
        return;
      }

      if (current <= 0) {
        menu.classList.remove('menu-oculto');
        lastScrollY = current;
        return;
      }

      if (current > lastScrollY + threshold) {
        menu.classList.add('menu-oculto');
      } else if (current < lastScrollY - threshold) {
        menu.classList.remove('menu-oculto');
      }

      lastScrollY = current;
    };

    window.addEventListener('scroll', () => {
      if (ticking) return;
      window.requestAnimationFrame(() => {
        onScroll();
        ticking = false;
      });
      ticking = true;
    }, { passive: true });
  }

  // =========================
  // CARTÃO DO ELEMENTO
  // =========================

  function atualizarCartao(cell) {

    if (!cell || !card) return;

    const d = cell.dataset;

    const numero = $('.numeroCard');
    const simbolo = $('.simboloCard');
    const nome = $('.nomeCard');
    const massa = $('.massaCard');
    const camadas = $('.camadasCard');

    if (numero) numero.textContent = d.numero || '';
    if (simbolo) simbolo.textContent = d.simbolo || '';
    if (nome) nome.textContent = d.nome || '';
    if (massa) massa.textContent = d.massa || '';
    if (camadas) camadas.textContent = (d.camadas || '').split(',').join('\n');

    if (descricaoBox)
      descricaoBox.textContent = d.descricao || 'Sem descrição disponível';

    card.classList.add('ativo');

    const bg = getComputedStyle(cell).backgroundColor;
    card.style.background = bg;

    const rgb = bg.match(/\d+/g);

    if (rgb) {
      const brilho = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
      card.style.color = brilho < 125 ? '#fff' : '#000';
    }
  }

  function resetarCartao() {

    const numero = $('.numeroCard');
    const simbolo = $('.simboloCard');
    const nome = $('.nomeCard');
    const massa = $('.massaCard');
    const camadas = $('.camadasCard');

    if (numero) numero.textContent = '';
    if (simbolo) simbolo.textContent = '';
    if (nome) nome.textContent = 'Nome do elemento';
    if (massa) massa.textContent = '';
    if (camadas) camadas.textContent = '';

    if (card) {
      card.style.background = 'var(--cor-secundaria)';
      card.style.color = 'var(--cor-texto)';
      card.classList.remove('ativo');
    }

    if (descricaoBox)
      descricaoBox.textContent = 'Selecione um elemento para ver detalhes';
  }

  // =========================
  // AJUSTE GRID
  // =========================

  // =========================
  // INTERAÇÃO DOS ELEMENTOS
  // =========================

  elementos.forEach(cell => {

    cell.addEventListener('mouseenter', () => {
      if (!selecionada) atualizarCartao(cell);
    });

    cell.addEventListener('click', () => {

      if (selecionada) selecionada.classList.remove('selecionado');

      if (selecionada === cell) {
        selecionada = null;
        resetarCartao();
        return;
      }

      cell.classList.add('selecionado');
      selecionada = cell;

      atualizarCartao(cell);

    });

  });

  // =========================
  // MODO ESCURO
  // =========================

  const iconeTema = document.querySelector("#iconeTema");

  // carregar tema salvo
  if (localStorage.getItem("tema") === "escuro") {
    body.classList.add("escuro");
    iconeTema.classList.replace("fa-sun", "fa-moon");
  }

  botaoTema.addEventListener("click", () => {

    body.classList.toggle("escuro");

    if (body.classList.contains("escuro")) {
      iconeTema.classList.replace("fa-sun", "fa-moon");
      localStorage.setItem("tema", "escuro");
    } else {
      iconeTema.classList.replace("fa-moon", "fa-sun");
      localStorage.setItem("tema", "claro");
    }

  });

  // =========================
  // FILTROS
  // =========================

  let filtroAtivo = null;

  function aplicarFiltro(categoria) {
    elementos.forEach(el => {
      const ativo = el.dataset.categoria === categoria;
      el.style.opacity = ativo ? "1" : "0.15";
      el.style.transform = ativo ? "scale(1.05)" : "scale(1)";
      el.style.zIndex = ativo ? "2" : "1";
    });
  }

  function limparFiltro() {
    elementos.forEach(el => {
      el.style.opacity = "1";
      el.style.transform = "scale(1)";
      el.style.zIndex = "1";
    });
  }

  filtros.forEach(filtro => {

    filtro.addEventListener('mouseenter', () => {
      if (filtroAtivo) return;
      aplicarFiltro(filtro.id);
    });

    filtro.addEventListener('mouseleave', () => {
      if (filtroAtivo) return;
      limparFiltro();
    });

    filtro.addEventListener('click', () => {
      const categoria = filtro.id;

      if (filtroAtivo === categoria) {
        filtroAtivo = null;
        filtro.classList.remove('ativo');
        limparFiltro();
        return;
      }

      filtroAtivo = categoria;
      filtros.forEach(f => f.classList.remove('ativo'));
      filtro.classList.add('ativo');
      aplicarFiltro(categoria);
    });

  });

});
