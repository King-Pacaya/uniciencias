    const menuButton = document.getElementById('menuButton');
    const menu = document.getElementById('menu');
    const closeMenuButton = document.getElementById('closeMenuButton');
    const resizeButton = document.getElementById('resizeButton');
    const homeButton = document.getElementById('homeButton');

    menuButton.addEventListener('click', () => {
      menu.classList.add('open');
    });

    closeMenuButton.addEventListener('click', () => {
      menu.classList.remove('open');
    });

    resizeButton.addEventListener('click', () => {
      if (resizeButton.querySelector('i').classList.contains('fa-expand')) {
        document.body.requestFullscreen();
        resizeButton.querySelector('i').classList.replace('fa-expand', 'fa-compress');
      } else {
        document.exitFullscreen();
        resizeButton.querySelector('i').classList.replace('fa-compress', 'fa-expand');
      }
    });

    homeButton.addEventListener('click', () => {
      window.location.href = '../../index.html';
    });

function showTab(contentId, buttonId) {
  // Oculta todos los contenidos
  document.querySelectorAll('.tab').forEach(tab => tab.classList.add('hidden'));
  
  // Quita la clase activa de todos los botones de pestañas
  document.querySelectorAll('button').forEach(button => button.classList.remove('active-tab'));
  
  // Muestra el contenido seleccionado y marca el botón correspondiente
  document.getElementById(contentId).classList.remove('hidden');
  document.getElementById(buttonId).classList.add('active-tab');
  
  // Cierra el menú lateral
  menu.classList.remove('open');
}
