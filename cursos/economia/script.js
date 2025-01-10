    // Referencias a botones principales
    const menuButton = document.getElementById('menuButton');
    const menu = document.getElementById('menu');
    const closeMenuButton = document.getElementById('closeMenuButton');
    const resizeButton = document.getElementById('resizeButton');
    const homeButton = document.getElementById('homeButton');

    // Abrir menú (se desplaza a w-full)
    menuButton.addEventListener('click', () => {
      menu.classList.add('open');
    });

    // Cerrar menú
    closeMenuButton.addEventListener('click', () => {
      menu.classList.remove('open');
    });

    // Pantalla completa
    resizeButton.addEventListener('click', () => {
      if (resizeButton.querySelector('i').classList.contains('fa-expand')) {
        document.body.requestFullscreen();
        resizeButton.querySelector('i').classList.replace('fa-expand', 'fa-compress');
      } else {
        document.exitFullscreen();
        resizeButton.querySelector('i').classList.replace('fa-compress', 'fa-expand');
      }
    });

    // Botón Home (opcional)
    homeButton.addEventListener('click', () => {
      window.location.href = '../../index.html';
    });

    // Función para mostrar los tabs
    function showTab(tabId) {
      // Ocultamos todos los contenedores de tabs
      document.querySelectorAll('.tab').forEach(tab => tab.classList.add('hidden'));
      
      // Quitamos la clase active-tab de todos los botones (solo los del menú)
      document.querySelectorAll('#menu button').forEach(button => button.classList.remove('active-tab'));
      
      // Mostramos el contenedor que corresponde
      document.getElementById(tabId).classList.remove('hidden');

      // Agregamos la clase activa al botón que llamó la función
      const buttonId = `${tabId}-btn`;  // "tabMicro1-btn" si tabId es "tabMicro1", etc.
      const clickedButton = document.getElementById(buttonId);
      if (clickedButton) {
        clickedButton.classList.add('active-tab');
      }

      // Cerramos el menú (por si está abierto en móviles)
      menu.classList.remove('open');
    }

    // Función para abrir/cerrar dropdowns
    function toggleDropdown(dropdownId) {
      const dropdown = document.getElementById(dropdownId);
      dropdown.classList.toggle('hidden');
    }

  document.addEventListener('DOMContentLoaded', function() {
    const navbar = document.getElementById('navbar');
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY) {
        // Desplazamiento hacia abajo: ocultar la barra
        navbar.classList.add('hide');
      } else {
        // Desplazamiento hacia arriba: mostrar la barra
        navbar.classList.remove('hide');
      }

      lastScrollY = currentScrollY;
    });
  });