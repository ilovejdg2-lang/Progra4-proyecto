/**
 * Manual de uso para personas con rol Cliente (se ve en Mi cuenta).
 * La foto de cada sección y de los pasos que la tienen sale de `public/manual/cliente/`
 * y la genera `npm run manual:capturas`.
 */
export const SECCIONES_MANUAL_CLIENTE = [
  {
    id: "cuenta",
    titulo: "Crear tu cuenta e iniciar sesión",
    grupo: "Primeros pasos",
    ruta: "/login",
    resumen: "Con una cuenta podés comprar en la tienda, enviar solicitudes y ver el estado de todo lo que hiciste.",
    pasos: [
      "Tocá Iniciar sesión arriba a la derecha.",
      "Si todavía no tenés cuenta, tocá Registrarse y completá tu nombre y correo.",
      "Te llega un código de 5 dígitos al correo. Escribilo para activar la cuenta.",
      "Para entrar después, usá tu correo o usuario y tu contraseña.",
    ],
    consejos: ["Si olvidaste la contraseña, tocá ¿Olvidó su contraseña? y te llega un código para crear una nueva."],
  },
  {
    id: "comprar",
    titulo: "Comprar productos",
    grupo: "Tienda",
    ruta: "/productos",
    resumen: "En la tienda elegís los productos, los agregás al carrito y pagás subiendo el comprobante.",
    pasos: [
      "Entrá a la tienda y filtrá por categoría o buscá el producto que querés.",
      "Abrí el producto, elegí la cantidad y agregalo al carrito.",
      { texto: "Tocá el carrito arriba a la derecha para revisar lo que llevás y luego Ir a pagar.", imagen: "carrito" },
      { texto: "En el pago elegí el punto de venta. Solo aparecen los que tienen todos tus productos.", imagen: "checkout" },
      "Subí una imagen del comprobante de pago (JPG, PNG o WEBP, máximo 10 MB).",
      "Activá Ya revisé mi pedido y tocá Finalizar pedido.",
    ],
    consejos: ["Los precios del carrito ya incluyen el IVA (13%)."],
  },
  {
    id: "mis-compras",
    titulo: "Mis compras",
    grupo: "Mi cuenta",
    ruta: "/perfil/compras",
    resumen: "Lista de tus compras con su estado: pendiente de aceptar, aceptada o lista para entregar.",
    pasos: [
      "Entrá a Mi cuenta y tocá Mis compras en el menú.",
      "Abrí una compra para ver los productos, el total y el punto de venta.",
    ],
    consejos: ["Cuando el estado de una compra cambia, te aparece un aviso en la campanita de notificaciones."],
  },
  {
    id: "voluntariado",
    titulo: "Solicitar voluntariado",
    grupo: "Formularios",
    ruta: "/voluntariado/solicitar",
    resumen: "Formulario para ofrecerte como voluntaria o voluntario en la finca.",
    pasos: [
      "En el menú Formularios elegí Voluntariado.",
      "Completá tus datos y elegí las fechas disponibles.",
      "Enviá la solicitud. Su estado lo ves en Mis solicitudes.",
    ],
  },
  {
    id: "visitas",
    titulo: "Solicitar una visita grupal",
    grupo: "Formularios",
    ruta: "/visitas/solicitar",
    resumen: "Para escuelas, universidades, empresas u otros grupos que quieren visitar la finca.",
    pasos: [
      "En el menú Formularios elegí Visitas.",
      "Indicá los datos del grupo, la cantidad de personas y elegí un día y horario disponible.",
      "Enviá la solicitud y revisá su estado en Mis solicitudes.",
    ],
  },
  {
    id: "donaciones",
    titulo: "Donar",
    grupo: "Formularios",
    ruta: "/donaciones/necesidades",
    resumen: "Podés ver qué necesita el proyecto y ofrecer una donación.",
    pasos: [
      "En el menú Formularios elegí Donaciones para ver las necesidades actuales.",
      "Elegí una necesidad y tocá Donar, o llená el formulario de donación general.",
      "Indicá qué vas a donar, el estado de los artículos y cómo lo vas a entregar.",
      "Enviá la solicitud. Te avisamos en Mis solicitudes si fue aceptada.",
    ],
  },
  {
    id: "productores",
    titulo: "Enviar una propuesta de productor",
    grupo: "Formularios",
    ruta: "/productores/propuesta",
    resumen: "Formulario para proponer tu emprendimiento y, si se aprueba, publicarlo en el sitio.",
    pasos: [
      "En el menú Formularios elegí Productores y tocá Enviar propuesta.",
      "Completá los datos, la imagen y la autorización.",
      "Revisá el estado en Mis propuestas, dentro de Mi cuenta.",
    ],
  },
  {
    id: "mis-solicitudes",
    titulo: "Mis solicitudes",
    grupo: "Mi cuenta",
    ruta: "/perfil/solicitudes",
    resumen: "Todas tus solicitudes de voluntariado, visitas y donaciones en un solo lugar.",
    pasos: [
      "Entrá a Mi cuenta y tocá Mis solicitudes.",
      "Filtrá por tipo o estado (Pendiente, En revisión, Aceptada o Rechazada).",
      "Tocá el ojo para ver el detalle de una solicitud.",
    ],
  },
  {
    id: "documentos",
    titulo: "Documentos",
    grupo: "Información",
    ruta: "/repositorio",
    resumen: "Repositorio de documentos del proyecto. Los públicos se descargan directo; los privados necesitan permiso.",
    pasos: [
      "Buscá el documento por nombre o categoría.",
      "Si es público, abrilo o descargalo.",
      "Si es privado, pedí acceso. Cuando lo aprueben vas a poder descargarlo.",
    ],
  },
  {
    id: "mi-perfil",
    titulo: "Mi perfil",
    grupo: "Mi cuenta",
    ruta: "/perfil",
    resumen: "Tus datos personales: nombre, teléfono, foto y contraseña.",
    pasos: [
      "Entrá a Mi cuenta › Mi perfil.",
      "Cambiá los datos que necesités y guardá.",
      "Para cambiar el correo te llega un código de confirmación al correo nuevo.",
    ],
  },
];
