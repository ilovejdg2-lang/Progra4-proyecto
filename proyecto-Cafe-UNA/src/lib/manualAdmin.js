import { tienePermiso } from "./permisos.js";

const alguno = (...codigos) => (roles) => codigos.some((codigo) => tienePermiso(roles, codigo));
const siempre = () => true;

/**
 * Manual de uso del panel administrativo. Cada sección se muestra solo a quien
 * tiene permiso para usar ese módulo (`visible`).
 */
export const SECCIONES_MANUAL = [
  {
    id: "primeros-pasos",
    titulo: "Primeros pasos en el panel",
    grupo: "General",
    visible: siempre,
    resumen:
      "El panel administrativo es donde se cambia todo lo que se ve en la web y se gestionan inventario, ventas, solicitudes y usuarios.",
    pasos: [
      "Usá el menú de la izquierda para moverte entre módulos. En celular se abre con el botón de las tres rayitas arriba a la izquierda.",
      "Arriba ves la ruta en la que estás (por ejemplo: Administración › Ajustes del sistema › Horarios). Tocá cualquier parte para volver.",
      "En la barra superior podés cambiar el idioma del panel, activar el modo oscuro y ver las alertas de stock bajo (la campanita).",
      "Solo ves los módulos para los que tu rol tiene permiso. Si te falta alguno, pedile a una persona administradora que lo active en Ajustes del sistema › Permisos.",
      "Esta ayuda siempre está en Ajustes del sistema › Ayuda, o con el botón del salvavidas en la barra superior.",
    ],
    consejos: [
      "Casi todos los formularios tienen un botón Guardar o Guardar cambios. Si salís sin guardar, los cambios se pierden.",
      "Los campos con asterisco (*) son obligatorios. Si falta algo, el formulario te marca el campo en rojo.",
      "Los campos de números solo aceptan números y los de correo necesitan un correo completo (con @).",
    ],
  },
  {
    id: "pagina-principal",
    titulo: "Información de la página principal",
    grupo: "Configuración general del sitio",
    ruta: "/admin/informacion-pagina-principal",
    visible: alguno("actualizar_informacion"),
    resumen:
      "Edita lo que aparece en el inicio de la web: portada (hero), barra de navegación, tarjetas, preguntas frecuentes y pie de página.",
    pasos: [
      "Elegí la sección que querés cambiar.",
      "Editá los textos e imágenes. A la par ves una vista previa de cómo va a quedar.",
      "Tocá Guardar en esa sección. El cambio se ve en la web de inmediato.",
    ],
    consejos: [
      "Usá imágenes horizontales y livianas (JPG o WebP) para que la página cargue rápido.",
      "Los datos de contacto del pie de página (correo, teléfono, redes) también se cambian aquí.",
    ],
  },
  {
    id: "sobre-nosotros",
    titulo: "Sobre nosotros: historia, galería y equipo",
    grupo: "Configuración general del sitio",
    ruta: "/admin/sobre-nosotros",
    visible: alguno("actualizar_informacion", "agregar_imagenes_galeria"),
    resumen:
      "Cuatro pantallas para la sección Sobre nosotros: Historia (resumen), Historia completa (el relato largo por capítulos), Galería y Equipo.",
    pasos: [
      "Historia: editá el texto corto que aparece en Sobre nosotros.",
      "Historia completa: editá la portada, las cifras, los hitos, la producción de compost y los capítulos. Dentro de cada capítulo usá Agregar bloque (párrafo, subtítulo, cita, mapa o gráfico) o Agregar imagen. Al final tocá Guardar cambios.",
      "Galería: subí fotos, ponéles una descripción y elegí su categoría.",
      "Equipo: agregá a las personas con nombre, cargo, correo y teléfono, y ordenalas como querés que aparezcan.",
    ],
    consejos: [
      "En Historia completa podés subir los bloques con las flechas y el botón Ver en el sitio abre la página para revisar cómo quedó.",
      "Si cerrás la pestaña con cambios sin guardar, el navegador te avisa.",
    ],
  },
  {
    id: "productos",
    titulo: "Productos",
    grupo: "Manejo de inventario",
    ruta: "/admin/producto",
    visible: alguno("ver_productos", "ver_inventario"),
    resumen:
      "Catálogo de productos que se venden en la tienda: nombre, descripción, fotos, precio, presentación (gramos), categoría y estado.",
    pasos: [
      {
        texto: "Para crear un producto, tocá + Nuevo producto y completá nombre, precio, fotos y categoría.",
        imagen: "nuevo",
      },
      "El precio con IVA se calcula solo a partir del precio normal.",
      "En Peso elegí la presentación (por ejemplo 250 g o 1 kg). Las opciones se administran en Ajustes del sistema › Catálogos.",
      "Marcá un producto como destacado para que aparezca en el inicio (máximo 3).",
      "Para que deje de verse en la tienda sin borrarlo, cambiá su estado a Deshabilitado.",
      {
        texto: "Con el botón Categorías renombrás categorías y subcategorías y elegís el ícono que se ve en la tienda.",
        imagen: "categorias",
      },
    ],
    consejos: [
      "El stock mínimo sirve para que la campanita avise cuando quedan pocas unidades en un punto de venta.",
      "Las categorías se pueden crear desde el mismo formulario. Para renombrarlas o cambiar su ícono usá el botón Categorías arriba de la lista de productos.",
    ],
  },
  {
    id: "puntos-venta",
    titulo: "Puntos de venta y stock",
    grupo: "Manejo de inventario",
    ruta: "/admin/puntos-venta",
    visible: alguno("ver_inventario", "actualizar_inventario", "registrar_ventas", "ver_ventas"),
    resumen: "Muestra cuántas unidades hay de cada producto en cada punto de venta y en la bodega central.",
    pasos: [
      "Elegí el punto de venta para ver su inventario.",
      "Ajustá las cantidades cuando entra o sale mercadería.",
    ],
    consejos: ["Cada ajuste queda registrado en Historial de movimientos con la persona que lo hizo."],
  },
  {
    id: "activos-distribucion",
    titulo: "Activos fijos, distribución y salidas de bodega",
    grupo: "Manejo de inventario",
    ruta: "/admin/activos-fijos",
    visible: alguno("ver_inventario", "actualizar_inventario", "ajustar_stock_ubicaciones"),
    resumen:
      "Activos fijos registra equipo y mobiliario del proyecto. Distribución mueve producto entre la bodega y los puntos de venta. Salidas de bodega registra producto que sale por venta, donación, traslado o merma.",
    pasos: [
      "Activos fijos: registrá cada activo con su origen de fondos y su ubicación.",
      "Distribución: elegí el producto, la cantidad y a qué punto de venta se envía.",
      "Salidas de bodega: elegí el motivo, la cantidad y, si aplica, quién recibe.",
    ],
    consejos: ["Todos estos movimientos se pueden revisar después en Historial de movimientos."],
  },
  {
    id: "ventas",
    titulo: "Ventas presenciales e historial de ventas",
    grupo: "Manejo de inventario",
    ruta: "/admin/ventas-presenciales",
    visible: alguno("registrar_ventas", "ajustar_stock_ubicaciones", "ver_ventas", "ver_historial_compras_clientes"),
    resumen:
      "Ventas presenciales funciona como caja: se arma el carrito, se elige el método de pago y se registra la venta. Ventas pendientes e Historial de ventas muestran las compras en línea y presenciales.",
    pasos: [
      "Elegí el punto de venta, buscá los productos y agregalos al carrito.",
      "Elegí el método de pago. Si querés enviar el comprobante, escribí el correo de la persona cliente.",
      "Registrá la venta: el stock se descuenta solo y podés imprimir el comprobante.",
      "En Ventas pendientes revisá los comprobantes de pago de las compras en línea y aprobalas o rechazalas.",
    ],
    consejos: ["Los métodos de pago se agregan o cambian en Ajustes del sistema › Catálogos."],
  },
  {
    id: "propuestas-productores",
    titulo: "Propuestas de productores",
    grupo: "Solicitudes",
    ruta: "/admin/propuestas",
    visible: alguno("administrar_solicitudes_productores"),
    resumen: "Revisión de emprendimientos que piden publicarse en el sitio.",
    pasos: [
      "Abrí una propuesta pendiente para ver la imagen, la ubicación y el contacto.",
      "Aprobala para publicarla o rechazala con un motivo.",
      "La persona solicitante recibe el aviso en la campanita y en Mis propuestas.",
    ],
  },
  {
    id: "voluntariado",
    titulo: "Voluntariado",
    grupo: "Solicitudes",
    ruta: "/admin/voluntariado",
    visible: alguno("ver_solicitudes_voluntariado", "administrar_solicitudes_voluntariado"),
    resumen: "Solicitudes de personas que quieren hacer voluntariado y las fechas disponibles para hacerlo.",
    pasos: [
      "Abrí una solicitud para ver los datos de la persona y la fecha que eligió.",
      "Cambiá el estado (por ejemplo Aprobada o Rechazada). La persona puede verlo en Mis solicitudes.",
      "En Fechas disponibles agregá los días y horarios en que se recibe voluntariado y el cupo de cada uno.",
    ],
  },
  {
    id: "visitas",
    titulo: "Visitas grupales",
    grupo: "Solicitudes",
    ruta: "/admin/visitas",
    visible: alguno("administrar_solicitudes_visitantes"),
    resumen: "Solicitudes de grupos (escuelas, universidades, empresas) que quieren visitar la finca.",
    pasos: [
      "Revisá los datos del grupo, la cantidad de visitantes y el horario elegido.",
      "Cambiá el estado de la solicitud y, si hace falta, corregí los datos de contacto.",
      "Administrá las fechas y horarios disponibles para visitas y su cupo.",
    ],
  },
  {
    id: "donaciones",
    titulo: "Donaciones",
    grupo: "Solicitudes",
    ruta: "/admin/donaciones/necesidades",
    visible: alguno("administrar_solicitudes_donaciones", "ver_solicitudes_donacion", "inactivar_donacion"),
    resumen:
      "Necesidades de donación (qué necesita el proyecto), solicitudes de donación que envía la gente y fechas en que se reciben donaciones.",
    pasos: [
      "Necesidades: creá cada necesidad con su prioridad y los materiales que se aceptan.",
      "Solicitudes: revisá lo que la persona quiere donar, cómo lo entrega y cambiá el estado.",
      "Fechas de recepción: indicá qué días se reciben donaciones.",
    ],
    consejos: ["Los estados de los artículos que ve la persona donante se editan con el botón Estados de artículos en Solicitudes de donación."],
  },
  {
    id: "documentacion",
    titulo: "Documentación",
    grupo: "Documentación y facturas",
    ruta: "/admin/documentacion",
    visible: alguno(
      "ver_documentacion_privada",
      "crear_documentacion",
      "actualizar_documentacion",
      "administrar_solicitudes_documentacion",
    ),
    resumen:
      "Repositorio de documentos públicos y privados, las solicitudes de acceso a documentos y la documentación administrativa interna.",
    pasos: [
      "Subí un documento con título, categoría y si es público o privado.",
      "En Solicitudes aprobá o rechazá los pedidos de acceso a documentos privados.",
    ],
    consejos: ["Los documentos privados solo se pueden descargar con una solicitud aprobada."],
  },
  {
    id: "facturas",
    titulo: "Facturación",
    grupo: "Documentación y facturas",
    ruta: "/admin/facturas",
    visible: alguno("ver_todas_las_facturas", "ver_ventas", "descargar_facturas"),
    resumen: "Lista de facturas generadas por las compras. Se pueden filtrar, ver y descargar en PDF.",
    pasos: ["Filtrá por fecha o estado, abrí la factura y descargala en PDF si la necesitás."],
  },
  {
    id: "usuarios",
    titulo: "Administrar usuarios",
    grupo: "Administración",
    ruta: "/admin/usuarios",
    visible: alguno("editar_usuarios", "crear_usuarios", "gestionar_asignaciones_puntos"),
    resumen: "Cuentas de las personas que usan la plataforma, sus roles y los puntos de venta asignados.",
    pasos: [
      "Creá un usuario con su correo y su rol. La persona recibe un código para activar la cuenta.",
      "Editá los datos o el rol de un usuario existente.",
      "Asigná a cada vendedor los puntos de venta donde puede registrar ventas.",
    ],
    consejos: ["El rol define qué módulos ve cada persona. Los permisos de cada rol se cambian en Ajustes del sistema › Permisos."],
  },
  {
    id: "ajustes",
    titulo: "Ajustes del sistema",
    grupo: "Administración",
    ruta: "/admin/ajustes/horarios",
    visible: alguno("administrar_roles_permisos"),
    resumen: "Configuración general: días de compra, permisos de cada rol y catálogos (listas) que usan los formularios.",
    pasos: [
      "Horarios: marcá en el calendario los días cerrados, feriados u horarios especiales para llegar a comprar productos.",
      "Permisos: elegí qué puede hacer cada rol. Filtrá por módulo, activá o quitá permisos y tocá Guardar.",
      "Catálogos: editá las presentaciones (cantidad y unidad: g, kg, ml o L) y los métodos de pago. En la pestaña Íconos ves todos los íconos disponibles con su nombre.",
    ],
    consejos: [
      "Las categorías de productos se editan en Productos › Categorías y los estados de artículos donados en Solicitudes de donación.",
    ],
  },
  {
    id: "auditoria",
    titulo: "Auditoría",
    grupo: "Administración",
    ruta: "/admin/auditoria",
    visible: alguno("ver_auditoria"),
    resumen: "Registro de quién cambió qué y cuándo en la plataforma.",
    pasos: ["Filtrá por fecha, tabla o acción para encontrar un cambio."],
  },
  {
    id: "mi-cuenta",
    titulo: "Mi cuenta",
    grupo: "General",
    ruta: "/admin/perfil",
    visible: siempre,
    resumen: "Tus datos personales, tus compras y tus solicitudes.",
    pasos: [
      "Mi perfil: actualizá tu nombre, teléfono, foto y contraseña. Para cambiar el correo te llega un código de confirmación.",
      "Mis compras y Mis solicitudes: revisá el estado de lo que hiciste como cliente.",
    ],
  },
];
