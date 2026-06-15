/* ============================================================
   ATALAYA STUDIO — server.js
   Backend con Node.js + Express
   Rutas: GET /api/saludo | GET /api/servicios | POST /api/contacto
   ============================================================ */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Carga las variables de entorno desde .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

/* ============================================================
   MIDDLEWARES GLOBALES
   ============================================================ */

// Habilita CORS para que el frontend (Netlify/Vercel) pueda comunicarse
// En producción reemplaza el "*" por la URL real de tu frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  methods: ["GET", "POST"],
}));

// Permite leer el cuerpo de las peticiones en formato JSON
app.use(express.json());


/* ============================================================
   RUTA 1 — GET /api/saludo
   Prueba de que el servidor está activo
   ============================================================ */
app.get("/api/saludo", (req, res) => {
  res.json({
    status: "ok",
    mensaje: "Servidor de Atalaya Studio activo y funcionando.",
  });
});


/* ============================================================
   RUTA 2 — GET /api/servicios
   Devuelve la lista de servicios de Atalaya Studio
   ============================================================ */
app.get("/api/servicios", (req, res) => {
  const servicios = [
    {
      id: 1,
      nombre: "Identidad de marca",
      descripcion: "Logotipo, paleta, tipografía y guía de estilo.",
      icono: "◐",
    },
    {
      id: 2,
      nombre: "Diseño editorial",
      descripcion: "Catálogos, revistas y materiales impresos.",
      icono: "◑",
    },
    {
      id: 3,
      nombre: "Diseño digital",
      descripcion: "Interfaces, banners y assets digitales.",
      icono: "◒",
    },
    {
      id: 4,
      nombre: "Motion & animación",
      descripcion: "Piezas animadas para redes y presentaciones.",
      icono: "◓",
    },
  ];

  res.json(servicios);
});


/* ============================================================
   RUTA 3 — POST /api/contacto
   Recibe y valida el formulario de contacto del frontend
   ============================================================ */
app.post("/api/contacto", (req, res) => {
  const { nombre, email, mensaje } = req.body;

  // Validación básica en el servidor (nunca confiar solo en el frontend)
  if (!nombre || nombre.trim().length < 2) {
    return res.status(400).json({
      status: "error",
      campo: "nombre",
      mensaje: "El nombre es obligatorio y debe tener al menos 2 caracteres.",
    });
  }

  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !regexEmail.test(email)) {
    return res.status(400).json({
      status: "error",
      campo: "email",
      mensaje: "El correo electrónico no es válido.",
    });
  }

  if (!mensaje || mensaje.trim().length < 10) {
    return res.status(400).json({
      status: "error",
      campo: "mensaje",
      mensaje: "El mensaje debe tener al menos 10 caracteres.",
    });
  }

  // Log en consola del servidor (aquí iría la conexión a BD o envío de email)
  console.log("===== NUEVO MENSAJE DE CONTACTO =====");
  console.log("Nombre: ", nombre);
  console.log("Email:  ", email);
  console.log("Mensaje:", mensaje);
  console.log("Fecha:  ", new Date().toLocaleString("es-CO"));
  console.log("=====================================");

  // Respuesta exitosa al frontend
  res.status(200).json({
    status: "ok",
    recibido: true,
    mensaje: `Gracias, ${nombre}. Hemos recibido tu mensaje y te contactaremos pronto.`,
  });
});


/* ============================================================
   MANEJO DE RUTAS NO ENCONTRADAS (404)
   ============================================================ */
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    mensaje: "Ruta no encontrada.",
  });
});


/* ============================================================
   INICIAR SERVIDOR
   ============================================================ */
app.listen(PORT, () => {
  console.log(`Servidor Atalaya Studio escuchando en http://localhost:${PORT}`);
});
