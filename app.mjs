/* ============================================================
   ATALAYA STUDIO — app.mjs  (versión Unidad 2)
   Módulos ES: cada responsabilidad en su propia función
   Nuevo en esta versión:
     - Módulo 5: Modo oscuro persistente (LocalStorage)
     - Módulo 6: Saludo personalizado (LocalStorage)
     - Módulo 7: Últimos servicios vistos (SessionStorage)
     - Formulario conectado al backend real (POST /api/contacto)
   ============================================================ */

/* ============================================================
   CONFIGURACIÓN — URL del backend
   En desarrollo usa localhost; en producción usa la URL de Render
   ============================================================ */
const API_URL = window.location.hostname === "localhost"
  ? "http://localhost:3000"
  : "https://atalaya-api.onrender.com";   // ← reemplaza con tu URL real de Render


/* ============================================================
   MÓDULO 1 — MENÚ MÓVIL ACCESIBLE
   ============================================================ */
function inicializarMenu() {
  const btn  = document.getElementById("menuBtn");
  const menu = document.getElementById("nav-menu");
  if (!btn || !menu) return;

  btn.addEventListener("click", () => {
    const estaAbierto = btn.getAttribute("aria-expanded") === "true";
    toggleMenu(!estaAbierto, btn, menu);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && btn.getAttribute("aria-expanded") === "true") {
      toggleMenu(false, btn, menu);
      btn.focus();
    }
  });

  document.addEventListener("click", (e) => {
    const fueraDelMenu    = !menu.contains(e.target);
    const fueraDelBoton   = !btn.contains(e.target);
    const menuEstaAbierto = btn.getAttribute("aria-expanded") === "true";
    if (fueraDelMenu && fueraDelBoton && menuEstaAbierto) {
      toggleMenu(false, btn, menu);
    }
  });

  menu.querySelectorAll("a").forEach(enlace => {
    enlace.addEventListener("click", () => toggleMenu(false, btn, menu));
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 768) {
      menu.hidden = false;
      menu.removeAttribute("hidden");
      btn.setAttribute("aria-expanded", "false");
    } else if (btn.getAttribute("aria-expanded") === "false") {
      menu.hidden = true;
    }
  });
}

function toggleMenu(abrir, btn, menu) {
  btn.setAttribute("aria-expanded", String(abrir));
  menu.hidden = !abrir;
  btn.setAttribute(
    "aria-label",
    abrir ? "Cerrar menú de navegación" : "Abrir menú de navegación"
  );
}


/* ============================================================
   MÓDULO 2 — VALIDACIÓN DE FORMULARIO + CONEXIÓN AL BACKEND
   Conecta el formulario con POST /api/contacto en Express
   ============================================================ */
function inicializarFormulario() {
  const formulario = document.getElementById("formulario-contacto");
  if (!formulario) return;

  const campos = {
    nombre:  document.getElementById("nombre"),
    email:   document.getElementById("email"),
    mensaje: document.getElementById("mensaje"),
  };

  const errores = {
    nombre:  document.getElementById("nombre-error"),
    email:   document.getElementById("email-error"),
    mensaje: document.getElementById("mensaje-error"),
  };

  const mensajeExito = document.getElementById("formulario-exito");

  // Validación en tiempo real al salir de cada campo (blur)
  Object.keys(campos).forEach(nombreCampo => {
    campos[nombreCampo].addEventListener("blur", () => {
      validarCampo(nombreCampo, campos[nombreCampo], errores[nombreCampo]);
    });

    campos[nombreCampo].addEventListener("input", () => {
      if (campos[nombreCampo].getAttribute("aria-invalid") === "true") {
        limpiarError(campos[nombreCampo], errores[nombreCampo]);
      }
    });
  });

  // Envío del formulario al backend
  formulario.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Validación en frontend antes de enviar
    const todosValidos = Object.keys(campos).every(nombreCampo =>
      validarCampo(nombreCampo, campos[nombreCampo], errores[nombreCampo])
    );

    if (!todosValidos) {
      const primerError = formulario.querySelector("[aria-invalid=\"true\"]");
      if (primerError) primerError.focus();
      return;
    }

    // Deshabilitar botón durante el envío (evita doble clic)
    const btnEnviar = formulario.querySelector("button[type=\"submit\"]");
    btnEnviar.disabled = true;
    btnEnviar.textContent = "Enviando…";

    try {
      // ── Petición POST al backend Express ──
      const respuesta = await fetch(`${API_URL}/api/contacto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre:  campos.nombre.value.trim(),
          email:   campos.email.value.trim(),
          mensaje: campos.mensaje.value.trim(),
        }),
      });

      const datos = await respuesta.json();

      if (respuesta.ok && datos.status === "ok") {
        // Guardar en SessionStorage el último servicio o acción del usuario
        sessionStorage.setItem("ultimaAccion", "formulario-contacto");
        mostrarExito(formulario, mensajeExito, campos, datos.mensaje);
      } else {
        // Error de validación devuelto por el servidor
        if (datos.campo && errores[datos.campo]) {
          campos[datos.campo].setAttribute("aria-invalid", "true");
          errores[datos.campo].textContent = datos.mensaje;
          campos[datos.campo].focus();
        }
      }

    } catch (error) {
      // Error de red (servidor caído, sin internet)
      mensajeExito.textContent = "Error de conexión. Por favor intenta más tarde.";
      mensajeExito.hidden = false;
      console.error("Error al enviar formulario:", error.message);
    } finally {
      btnEnviar.disabled = false;
      btnEnviar.textContent = "Enviar mensaje";
    }
  });
}

function validarCampo(nombre, campo, contenedor) {
  const valor = campo.value.trim();
  let mensajeError = "";

  if (nombre === "nombre") {
    if (valor.length === 0)    mensajeError = "El nombre es obligatorio.";
    else if (valor.length < 2) mensajeError = "El nombre debe tener al menos 2 caracteres.";
  }

  if (nombre === "email") {
    if (valor.length === 0)         mensajeError = "El correo electrónico es obligatorio.";
    else if (!esEmailValido(valor)) mensajeError = "Introduce un correo electrónico válido.";
  }

  if (nombre === "mensaje") {
    if (valor.length === 0)     mensajeError = "El mensaje es obligatorio.";
    else if (valor.length < 10) mensajeError = "El mensaje debe tener al menos 10 caracteres.";
  }

  if (mensajeError) {
    campo.setAttribute("aria-invalid", "true");
    contenedor.textContent = mensajeError;
    return false;
  }

  limpiarError(campo, contenedor);
  return true;
}

function esEmailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function limpiarError(campo, contenedor) {
  campo.removeAttribute("aria-invalid");
  contenedor.textContent = "";
}

function mostrarExito(formulario, mensajeExito, campos, textoMensaje) {
  formulario.querySelectorAll(".campo").forEach(c => c.style.display = "none");
  formulario.querySelector("button[type=\"submit\"]").hidden = true;
  mensajeExito.textContent = `✓ ${textoMensaje}`;
  mensajeExito.hidden = false;
  mensajeExito.focus();

  setTimeout(() => {
    formulario.reset();
    formulario.querySelectorAll(".campo").forEach(c => c.style.display = "");
    formulario.querySelector("button[type=\"submit\"]").hidden = false;
    mensajeExito.hidden = true;
    mensajeExito.textContent = "";
    Object.values(campos)[0].focus();
  }, 5000);
}


/* ============================================================
   MÓDULO 3 — CARGA DE TESTIMONIOS DESDE API EXTERNA
   ============================================================ */
async function cargarTestimonios() {
  const lista  = document.getElementById("testimonios-lista");
  const estado = document.getElementById("testimonios-estado");
  if (!lista || !estado) return;

  try {
    estado.textContent = "Cargando testimonios…";

    const respuesta = await fetch(
      "https://jsonplaceholder.typicode.com/comments?_limit=6"
    );

    if (!respuesta.ok) throw new Error(`Error del servidor: ${respuesta.status}`);

    const datos = await respuesta.json();
    if (!Array.isArray(datos) || datos.length === 0) {
      throw new Error("No se recibieron testimonios válidos.");
    }

    renderizarTestimonios(datos, lista);
    estado.textContent = "";

  } catch (error) {
    estado.textContent = "No pudimos cargar los testimonios. Por favor, intenta más tarde.";
    console.error("Error al cargar testimonios:", error.message);
  }
}

function renderizarTestimonios(datos, lista) {
  lista.innerHTML = "";

  const empresas = [
    "Brandwave Co.", "Lumina Brands", "Forma Studio",
    "Pixel & Co.",   "Marca Norte",   "Studio Huit",
  ];

  datos.forEach((item, indice) => {
    const li          = document.createElement("li");
    const pTexto      = document.createElement("p");
    const divAutor    = document.createElement("div");
    const img         = document.createElement("img");
    const divInfo     = document.createElement("div");
    const spanNombre  = document.createElement("span");
    const spanEmpresa = document.createElement("span");

    li.className          = "testimonio-card";
    pTexto.className      = "testimonio-texto";
    divAutor.className    = "testimonio-autor";
    img.className         = "testimonio-avatar";
    divInfo.className     = "testimonio-info";
    spanNombre.className  = "testimonio-nombre";
    spanEmpresa.className = "testimonio-empresa";

    pTexto.textContent      = item.body;
    spanNombre.textContent  = item.name;
    spanEmpresa.textContent = empresas[indice] || "Cliente Atalaya";

    img.src     = `https://i.pravatar.cc/44?img=${indice + 10}`;
    img.alt     = `Avatar de ${item.name}`;
    img.width   = 44;
    img.height  = 44;
    img.loading = "lazy";

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
   ============================================================ */
function inicializarNavegacion() {
  document.addEventListener("click", (e) => {
    const enlace = e.target.closest("a[href^=\"#\"]");
    if (!enlace) return;
    const destino = document.querySelector(enlace.getAttribute("href"));
    if (!destino) return;
    if (!destino.hasAttribute("tabindex")) destino.setAttribute("tabindex", "-1");
    destino.focus({ preventScroll: true });
  });
}


/* ============================================================
   MÓDULO 5 — TOGGLE DE TEMA PERSISTENTE (LocalStorage)
   Este módulo permite cambiar al modo CLARO y recordarlo.
   ============================================================ */
function inicializarModoOscuro() {
  const body = document.body;

  // Al cargar: si el usuario prefirió el modo claro, aplicarlo
  const temaGuardado = localStorage.getItem("atalaya-tema");
  if (temaGuardado === "claro") {
    body.classList.add("modo-claro");
  }

  // Crear el botón de cambio de tema dinámicamente
  const btnTema = document.createElement("button");
  btnTema.id        = "btn-tema";
  btnTema.className = "btn-tema";
  btnTema.setAttribute("aria-label", "Cambiar tema de color");
  // Si está en modo claro, ofrece volver al oscuro; si está oscuro, ofrece el claro
  btnTema.textContent = temaGuardado === "claro" ? "◑ Modo oscuro" : "◐ Modo claro";

  // Insertar el botón al final del header-inner
  const headerInner = document.querySelector(".header-inner");
  if (headerInner) headerInner.appendChild(btnTema);

  // Al hacer clic: alternar clase y guardar preferencia en LocalStorage
  btnTema.addEventListener("click", () => {
    body.classList.toggle("modo-claro");
    const esModoClaro = body.classList.contains("modo-claro");
    localStorage.setItem("atalaya-tema", esModoClaro ? "claro" : "oscuro");
    btnTema.textContent = esModoClaro ? "◑ Modo oscuro" : "◐ Modo claro";
  });
}


/* ============================================================
   MÓDULO 6 — SALUDO PERSONALIZADO (LocalStorage)
   Recuerda el nombre del usuario entre visitas
   ============================================================ */
function inicializarSaludoPersonalizado() {
  const nombreGuardado = localStorage.getItem("atalaya-usuario");

  if (nombreGuardado) {
    // Crear banner de bienvenida si ya conocemos al usuario
    const banner = document.createElement("div");
    banner.className = "banner-bienvenida";
    banner.setAttribute("role", "status");
    banner.setAttribute("aria-live", "polite");
    banner.textContent = `Bienvenido de nuevo, ${nombreGuardado}. `;

    // Botón para olvidar el nombre
    const btnOlvidar = document.createElement("button");
    btnOlvidar.textContent = "No soy yo";
    btnOlvidar.className = "btn-olvidar";
    btnOlvidar.addEventListener("click", () => {
      localStorage.removeItem("atalaya-usuario");
      banner.remove();
    });

    banner.appendChild(btnOlvidar);
    document.body.insertBefore(banner, document.body.firstChild);
  }

  // Cuando el usuario llena el campo nombre en el formulario y sale del campo,
  // guardamos su nombre en LocalStorage automáticamente
  const campoNombre = document.getElementById("nombre");
  if (campoNombre) {
    campoNombre.addEventListener("blur", () => {
      const valor = campoNombre.value.trim();
      if (valor.length >= 2) {
        localStorage.setItem("atalaya-usuario", valor);
      }
    });
  }
}


/* ============================================================
   MÓDULO 7 — ÚLTIMOS SERVICIOS VISTOS (SessionStorage)
   Guarda qué tarjetas de servicio observó el usuario en esta sesión
   ============================================================ */
function inicializarServiciosVistos() {
  const tarjetas = document.querySelectorAll(".servicio-card");
  if (!tarjetas.length) return;

  // Recuperar servicios ya vistos en esta sesión
  const vistos = JSON.parse(sessionStorage.getItem("atalaya-servicios-vistos") || "[]");

  // Marcar visualmente los ya vistos
  tarjetas.forEach(tarjeta => {
    const titulo = tarjeta.querySelector("h3")?.textContent;
    if (titulo && vistos.includes(titulo)) {
      tarjeta.classList.add("servicio-visto");
    }

    // Observar cuándo el usuario ve una tarjeta (IntersectionObserver)
    const observer = new IntersectionObserver((entradas) => {
      entradas.forEach(entrada => {
        if (entrada.isIntersecting && titulo && !vistos.includes(titulo)) {
          vistos.push(titulo);
          sessionStorage.setItem("atalaya-servicios-vistos", JSON.stringify(vistos));
          tarjeta.classList.add("servicio-visto");
        }
      });
    }, { threshold: 0.6 });

    observer.observe(tarjeta);
  });
}


/* ============================================================
   INICIALIZACIÓN — ejecuta todo al cargar el DOM
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  inicializarModoOscuro();          // Módulo 5 — primero para evitar flash de tema
  inicializarSaludoPersonalizado(); // Módulo 6
  inicializarMenu();                // Módulo 1
  inicializarFormulario();          // Módulo 2 (ahora conectado al backend)
  cargarTestimonios();              // Módulo 3
  inicializarNavegacion();          // Módulo 4
  inicializarServiciosVistos();     // Módulo 7
});
