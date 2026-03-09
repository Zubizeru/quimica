// script principal para interações da tabela e tema

document.addEventListener('DOMContentLoaded', () => {
  // seleção / hover
  let selecionada = null;
  const card = document.querySelector('.cardnomeelemento');
  const descricaoBox = document.querySelector('.descricaodoelemento');

  function atualizarCartao(cell) {
    if (!card || !cell) return;
    const numero = cell.dataset.numero || '';
    const simbolo = cell.dataset.simbolo || '';
    const nome = cell.dataset.nome || '';
    const massa = cell.dataset.massa || '';
    let camadas = cell.dataset.camadas || '';
    const descricao = cell.dataset.descricao || '';

    card.querySelector('.numeroCard').textContent = numero;
    card.querySelector('.simboloCard').textContent = simbolo;
    card.querySelector('.nomeCard').textContent = nome;
    card.querySelector('.massaCard').textContent = massa;
    // convert comma-separated shells into vertical list
    camadas = camadas.split(',').join('\n');
    card.querySelector('.camadasCard').textContent = camadas;

    // atualizar descrição
    if (descricaoBox) {
      descricaoBox.textContent = descricao || 'Sem descrição disponível';
    }

    // borda visível enquanto houver dados
    card.classList.add('ativo');

    // aplicar a cor de fundo da célula (computada) e ajustar cor de texto
    const bg = window.getComputedStyle(cell).backgroundColor;
    card.style.background = bg;
    const rgb = bg.match(/\d+/g);
    if (rgb) {
      const brightness = (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
      card.style.color = brightness < 125 ? '#fff' : '#000';
    }
  }

  const menu = document.querySelector('.menuinicial');
  const originalMenuBg = menu ? window.getComputedStyle(menu).backgroundColor : '';

  // deslocar as linhas de todos os elementos para baixo quando
  // o cabeçalho de grupos está embutido na grade.
  document.querySelectorAll('.celula-elemento').forEach(cell => {
    const start = parseInt(cell.style.gridRowStart || cell.style.gridRow || 0, 10);
    if (start) {
      cell.style.gridRowStart = start + 1;
    }
  });

  document.querySelectorAll('.celula-elemento').forEach(cell => {
    cell.addEventListener('mouseenter', () => {
      if (!selecionada) {
        atualizarCartao(cell);
        // change menu bg to hovered element color
        const bg = window.getComputedStyle(cell).backgroundColor;
        if (menu) menu.style.background = bg;
      }
    });
    cell.addEventListener('mouseleave', () => {
      if (!selecionada && menu) {
        menu.style.background = originalMenuBg;
      }
    });
    cell.addEventListener('click', () => {
      if (selecionada) {
        selecionada.classList.remove('selecionado');
      }
      // if clicking again on the same cell, deselect
      if (selecionada === cell) {
        selecionada = null;
        descricaoBox.textContent = 'Selecione um elemento para ver detalhes';
        // reset card to placeholder state
        card.querySelector('.numeroCard').textContent = '';
        card.querySelector('.simboloCard').textContent = '';
        card.querySelector('.nomeCard').textContent = 'Nome do elemento';
        card.querySelector('.massaCard').textContent = '';
        card.querySelector('.camadasCard').textContent = '';
        card.style.background = 'var(--cor-secundaria)';
        card.style.color = 'var(--cor-texto)';
        card.classList.remove('ativo');
        if (menu) menu.style.background = originalMenuBg;
        return;
      }
      cell.classList.add('selecionado');
      selecionada = cell;
      atualizarCartao(cell);
      // fix menu background to selected color
      const bg = window.getComputedStyle(cell).backgroundColor;
      if (menu) menu.style.background = bg;
    });
  });

  // modo escuro: leitura de preferência e toggle
  const botao = document.getElementById('botaoTema');
  const icone = document.getElementById('iconeTema');
  const root = document.body;
  const urlClaro = 'https://img.icons8.com/ios-filled/24/000000/sun--v1.png';
  const urlEscuro = 'https://img.icons8.com/ios-filled/24/ffffff/moon-symbol.png';
  const atualizaIcone = () => {
    if (root.classList.contains('escuro')) {
      icone.src = urlClaro; // mostra sol branco para retornar ao claro
    } else {
      icone.src = urlEscuro; // mostra lua preta para modo noturno
    }
  };
  // carrega preferência do localStorage
  if (localStorage.getItem('tema') === 'escuro') {
    root.classList.add('escuro');
  }
  atualizaIcone();
  botao.addEventListener('click', () => {
    root.classList.toggle('escuro');
    const tema = root.classList.contains('escuro') ? 'escuro' : 'claro';
    localStorage.setItem('tema', tema);
    atualizaIcone();
  });

  // ============================
  // FILTROS POR HOVER
  // ============================

  const filtros = document.querySelectorAll('.filtro-item');
  const elementos = document.querySelectorAll('.celula-elemento');

  filtros.forEach(filtro => {

    filtro.addEventListener('mouseenter', () => {

      const categoria = filtro.id;

      elementos.forEach(el => {

        const tipo = el.dataset.categoria;

        if (tipo === categoria) {
          el.style.opacity = "1";
          el.style.transform = "scale(1.05)";
          el.style.zIndex = "2";
        } else {
          el.style.opacity = "0.15";
        }

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