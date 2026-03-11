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

  elementos.forEach(el => {
    const start = parseInt(el.style.gridRowStart || el.style.gridRow || 0);
    if (start) el.style.gridRowStart = start + 1;
  });

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

  filtros.forEach(filtro => {

    filtro.addEventListener('mouseenter', () => {

      const categoria = filtro.id;

      elementos.forEach(el => {

        const ativo = el.dataset.categoria === categoria;

        el.style.opacity = ativo ? "1" : "0.15";
        el.style.transform = ativo ? "scale(1.05)" : "scale(1)";
        el.style.zIndex = ativo ? "2" : "1";

      });

    });

    filtro.addEventListener('mouseleave', () => {

      elementos.forEach(el => {
        el.style.opacity = "1";
        el.style.transform = "scale(1)";
        el.style.zIndex = "1";
      });

    });

  });

});