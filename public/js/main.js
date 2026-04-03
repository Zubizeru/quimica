// ========================================
// SCRIPT PRINCIPAL (comportamento site-wide)
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  // ========================================
  // 1) Seletores do DOM
  // ========================================
  const body = document.body;
  const menu = document.querySelector('.menuinicial');
  const botaoMenu = document.querySelector('#botaoMenu');
  const linksMenu = document.querySelectorAll('.links a');
  const botaoTema = document.querySelector('#botaoTema');
  const iconeTema = document.querySelector('#iconeTema');

  // ========================================
  // 2) Menu responsivo
  // ========================================
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

    // Fecha o menu ao clicar em um link (em telas pequenas)
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

  // ========================================
  // 3) Tema claro/escuro
  // ========================================
  if (localStorage.getItem('tema') === 'escuro') {
    body.classList.add('escuro');
    if (iconeTema) iconeTema.classList.replace('fa-sun', 'fa-moon');
  }

  if (botaoTema && iconeTema) {
    botaoTema.addEventListener('click', () => {
      body.classList.toggle('escuro');
      if (body.classList.contains('escuro')) {
        iconeTema.classList.replace('fa-sun', 'fa-moon');
        localStorage.setItem('tema', 'escuro');
      } else {
        iconeTema.classList.replace('fa-moon', 'fa-sun');
        localStorage.setItem('tema', 'claro');
      }
    });
  }

  // ========================================
  // 4) Tooltip: estado e carregamento (lazy load)
  // ========================================
  const siteTooltipDefinitions = {};
  let tooltipsLoaded = false;

  const getTooltipSourceKey = () => {
    const sourceElement = document.querySelector('[data-tooltip-source]');
    return sourceElement?.dataset.tooltipSource;
  };

  const loadTooltipDefinitions = async () => {
    if (tooltipsLoaded) return;
    const sourceKey = getTooltipSourceKey();
    if (!sourceKey) return;

    const fileName = `${sourceKey}_tooltip.json`;
    const url = `/data/tooltips/${fileName}`;

    try {
      const response = await fetch(url, { cache: 'reload' });
      if (!response.ok) {
        console.warn(`Tooltip JSON não encontrado em ${url}.`);
        tooltipsLoaded = true;
        return;
      }
      const json = await response.json();
      if (json && typeof json === 'object') {
        Object.assign(siteTooltipDefinitions, json);
      }
    } catch (error) {
      console.warn(`Erro ao carregar tooltip JSON (${url}):`, error);
    } finally {
      tooltipsLoaded = true;
    }
  };

  // ========================================
  // 5) Tooltip: renderização (fallback para HTML)
  // ========================================
  const tooltipElementId = 'tooltip-global';
  let tooltipElement = document.getElementById(tooltipElementId);
  if (!tooltipElement) {
    tooltipElement = document.createElement('div');
    tooltipElement.id = tooltipElementId;
    tooltipElement.setAttribute('role', 'tooltip');
    tooltipElement.setAttribute('aria-hidden', 'true');
    document.body.appendChild(tooltipElement);
  }

  // Exibe o tooltip próximo ao elemento alvo, com texto do JSON ou fallback
  const showTooltip = (target) => {
    if (!target) return;
    const key = target.dataset.tooltipKey;
    const fallbackText = target.getAttribute('title');
    const text = (key && siteTooltipDefinitions[key]) || fallbackText || target.dataset.tooltipText;
    if (!text) return;
    const isHtml = /<[^>]+>/.test(text);
    if (isHtml) tooltipElement.innerHTML = text;
    else tooltipElement.textContent = text;

    tooltipElement.setAttribute('data-visible', 'true');
    tooltipElement.setAttribute('aria-hidden', 'false');

    const rect = target.getBoundingClientRect();
    const top = rect.top - tooltipElement.offsetHeight - 10;
    const left = Math.min(window.innerWidth - tooltipElement.offsetWidth - 8, Math.max(8, rect.left + rect.width / 2 - tooltipElement.offsetWidth / 2));
    tooltipElement.style.top = `${top < 10 ? rect.bottom + 10 : top}px`;
    tooltipElement.style.left = `${left}px`;
  };

  // Esconde o tooltip
  const hideTooltip = () => {
    tooltipElement.setAttribute('data-visible', 'false');
    tooltipElement.setAttribute('aria-hidden', 'true');
  };

  const prepareTooltip = async (target) => {
    await loadTooltipDefinitions();
    showTooltip(target);
  };

  // ========================================
  // 6) Tooltip: eventos (hover e focus)
  // ========================================
  const setupTooltipTriggers = () => {
    const triggers = document.querySelectorAll('.tooltip-trigger, [data-tooltip-key]');
    triggers.forEach((el) => {
      el.addEventListener('mouseenter', () => prepareTooltip(el));
      el.addEventListener('mouseleave', hideTooltip);
      el.addEventListener('focus', () => prepareTooltip(el));
      el.addEventListener('blur', hideTooltip);
    });
  };

  // ========================================
  // 7) Inicialização
  // ========================================
  setupTooltipTriggers();
});
