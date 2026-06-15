/* ============================================================
   ATALAYA STUDIO — app.mjs
   Módulos ES: cada responsabilidad en su propia función
   Orden: Menú → Formulario → Testimonios (API) → Inicialización
   ============================================================ 
*/

/* ============================================================
   MÓDULO 1 — MENÚ MÓVIL ACCESIBLE
   Aplica: DOM, eventos, ARIA, accesibilidad de teclado
   ============================================================ 
*/

function inicializarMenu() {
  const btn  = document.getElementById('menuBtn');
  const menu = document.getElementById('nav-menu');

  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    const estaAbierto = btn.getAttribute('aria-expanded') === 'true';
    toggleMenu(!estaAbierto, btn, menu);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') {
      toggleMenu(false, btn, menu);
      btn.focus();
    }
  });

  document.addEventListener('click', (e) => {
    const fueraDelMenu    = !menu.contains(e.target);
    const fueraDelBoton   = !btn.contains(e.target);
    const menuEstaAbierto = btn.getAttribute('aria-expanded') === 'true';
    if (fueraDelMenu && fueraDelBoton && menuEstaAbierto) {
      toggleMenu(false, btn, menu);
    }
  });

  menu.querySelectorAll('a').forEach(enlace => {
    enlace.addEventListener('click', () => toggleMenu(false, btn, menu));
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) {
      menu.hidden = false;
      menu.removeAttribute('hidden');
      btn.setAttribute('aria-expanded', 'false');
    } else if (btn.getAttribute('aria-expanded') === 'false') {
      menu.hidden = true;
    }
  });
}

function toggleMenu(abrir, btn, menu) {
  btn.setAttribute('aria-expanded', String(abrir));
  menu.hidden = !abrir;
  btn.setAttribute(
    'aria-label',
    abrir ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'
  );
}


/* ============================================================
   MÓDULO 2 — VALIDACIÓN DE FORMULARIO
   Aplica: eventos, DOM, closures, === estricto
   ============================================================ */

function inicializarFormulario() {
  const formulario = document.getElementById('formulario-contacto');
  if (!formulario) return;

  const campos = {
    nombre:  document.getElementById('nombre'),
    email:   document.getElementById('email'),
    mensaje: document.getElementById('mensaje'),
  };

  const errores = {
    nombre:  document.getElementById('nombre-error'),
    email:   document.getElementById('email-error'),
    mensaje: document.getElementById('mensaje-error'),
  };

  const mensajeExito = document.getElementById('formulario-exito');

  Object.keys(campos).forEach(nombreCampo => {
    campos[nombreCampo].addEventListener('blur', () => {
      validarCampo(nombreCampo, campos[nombreCampo], errores[nombreCampo]);
    });

    campos[nombreCampo].addEventListener('input', () => {
      if (campos[nombreCampo].getAttribute('aria-invalid') === 'true') {
        limpiarError(campos[nombreCampo], errores[nombreCampo]);
      }
    });
  });

  formulario.addEventListener('submit', (e) => {
    e.preventDefault();

    const todosValidos = Object.keys(campos).every(nombreCampo =>
      validarCampo(nombreCampo, campos[nombreCampo], errores[nombreCampo])
    );

    if (todosValidos) {
      mostrarExito(formulario, mensajeExito, campos);
    } else {
      const primerError = formulario.querySelector('[aria-invalid="true"]');
      if (primerError) primerError.focus();
    }
  });
}

function validarCampo(nombre, campo, contenedor) {
  const valor = campo.value.trim();
  let mensajeError = '';

  if (nombre === 'nombre') {
    if (valor.length === 0)  mensajeError = 'El nombre es obligatorio.';
    else if (valor.length < 2) mensajeError = 'El nombre debe tener al menos 2 caracteres.';
  }

  if (nombre === 'email') {
    if (valor.length === 0)       mensajeError = 'El correo electrónico es obligatorio.';
    else if (!esEmailValido(valor)) mensajeError = 'Introduce un correo electrónico válido.';
  }

  if (nombre === 'mensaje') {
    if (valor.length === 0)   mensajeError = 'El mensaje es obligatorio.';
    else if (valor.length < 10) mensajeError = 'El mensaje debe tener al menos 10 caracteres.';
  }

  if (mensajeError) {
    campo.setAttribute('aria-invalid', 'true');
    contenedor.textContent = mensajeError;   // textContent — nunca innerHTML
    return false;
  }

  limpiarError(campo, contenedor);
  return true;
}

function esEmailValido(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function limpiarError(campo, contenedor) {
  campo.removeAttribute('aria-invalid');
  contenedor.textContent = '';
}

function mostrarExito(formulario, mensajeExito, campos) {
  formulario.querySelectorAll('.campo').forEach(c => c.style.display = 'none');
  formulario.querySelector('button[type="submit"]').hidden = true;
  mensajeExito.hidden = false;
  mensajeExito.focus();

  setTimeout(() => {
    formulario.reset();
    formulario.querySelectorAll('.campo').forEach(c => c.style.display = '');
    formulario.querySelector('button[type="submit"]').hidden = false;
    mensajeExito.hidden = true;
    Object.values(campos)[0].focus();
  }, 5000);
}


/* ============================================================
   MÓDULO 3 — CARGA DE TESTIMONIOS DESDE API
   Aplica: fetch, async/await, try/catch, textContent (XSS)
   ============================================================ */

async function cargarTestimonios() {
  const lista  = document.getElementById('testimonios-lista');
  const estado = document.getElementById('testimonios-estado');

  if (!lista || !estado) return;

  try {
    estado.textContent = 'Cargando testimonios…';

    const respuesta = await fetch(
      'https://jsonplaceholder.typicode.com/comments?_limit=6'
    );

    if (!respuesta.ok) {
      throw new Error(`Error del servidor: ${respuesta.status}`);
    }

    const datos = await respuesta.json();

    if (!Array.isArray(datos) || datos.length === 0) {
      throw new Error('No se recibieron testimonios válidos.');
    }

    renderizarTestimonios(datos, lista);
    estado.textContent = '';

  } catch (error) {
    estado.textContent = 
    'No pudimos cargar los testimonios. Por favor, intenta más tarde.';
    console.error('Error al cargar testimonios:', error.message);
  }
}

function renderizarTestimonios(datos, lista) {
  lista.innerHTML = '';

  const empresas = [
    'Brandwave Co.', 'Lumina Brands', 'Forma Studio',
    'Pixel & Co.',   'Marca Norte',   'Studio Huit',
  ];

  datos.forEach((item, indice) => {
    const li         = document.createElement('li');
    const pTexto     = document.createElement('p');
    const divAutor   = document.createElement('div');
    const img        = document.createElement('img');
    const divInfo    = document.createElement('div');
    const spanNombre  = document.createElement('span');
    const spanEmpresa = document.createElement('span');

    li.className          = 'testimonio-card';
    pTexto.className      = 'testimonio-texto';
    divAutor.className    = 'testimonio-autor';
    img.className         = 'testimonio-avatar';
    divInfo.className     = 'testimonio-info';
    spanNombre.className  = 'testimonio-nombre';
    spanEmpresa.className = 'testimonio-empresa';

    // textContent en todos los datos externos — prevención XSS
    pTexto.textContent     = item.body;
    spanNombre.textContent = item.name;
    spanEmpresa.textContent = empresas[indice] || 'Cliente Atalaya';

    img.src     = `https://i.pravatar.cc/44?img=${indice + 10}`;
    img.alt     = `Avatar de ${item.name}`;
    img.width   = 44;
    img.height  = 44;
    img.loading = 'lazy';       // lazy loading → mejora LCP

    divInfo.appendChild(spanNombre);
    divInfo.appendChild(spanEmpresa);
    divAutor.appendChild(img);
    divAutor.appendChild(divInfo);
    li.appendChild(pTexto);
    li.appendChild(divAutor);
    lista.appendChild(li);
  });
}


/* ============================================================
   MÓDULO 4 — NAVEGACIÓN SUAVE ACCESIBLE
   Aplica: delegación de eventos
   ============================================================ */

function inicializarNavegacion() {
  document.addEventListener('click', (e) => {
    const enlace = e.target.closest('a[href^="#"]');
    if (!enlace) return;

    const destino = document.querySelector(enlace.getAttribute('href'));
    if (!destino) return;

    if (!destino.hasAttribute('tabindex')) {
      destino.setAttribute('tabindex', '-1');
    }
    destino.focus({ preventScroll: true });
  });
}


/* ============================================================
   INICIALIZACIÓN
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  inicializarMenu();
  inicializarFormulario();
  cargarTestimonios();
  inicializarNavegacion();
});
