const ETIQUETAS_CAMPO = {
  id: "ID",
  nombre: "Nombre",
  titulo: "Título",
  peso: "Peso",
  stock: "Stock",
  estado: "Estado",
  imagen: "Imagen",
  categoria: "Categoría",
  subcategoria: "Subcategoría",
  disponible: "Disponible",
  alertastock: "Alerta de stock",
  descripcion: "Descripción",
  precionormal: "Precio (sin IVA)",
  precio: "Precio",
  esdestacado: "Destacado",
  motivo: "Motivo",
  correo: "Correo",
  email: "Correo",
  telefono: "Teléfono",
  rol: "Rol",
  roles: "Roles",
  clave: "Clave",
  codigo: "Código",
  cantidad: "Cantidad",
  total: "Total",
  subtotal: "Subtotal",
  ubicacion: "Ubicación",
  idubicacion: "Ubicación",
  idproducto: "Producto",
  idusuario: "Usuario",
  passwordhash: "Contraseña",
  password: "Contraseña",
  contrasena: "Contraseña",
  contraseña: "Contraseña",
  tipovoluntariado: "Tipo de voluntariado",
  tipovisita: "Tipo de visita",
  tipocliente: "Tipo de cliente",
  tipodonante: "Tipo de donante",
  tipodocumento: "Tipo de documento",
  fechavisita: "Fecha de visita",
  fechapropuesta: "Fecha propuesta",
  fechasolicitud: "Fecha de solicitud",
  cantidadvisitantes: "Cantidad de visitantes",
  encargadonombre: "Nombre del encargado",
  encargadoemail: "Correo del encargado",
  motivorechazo: "Motivo de rechazo",
  observacionesadmin: "Observaciones admin",
  necesidadid: "Necesidad",
  razonsocial: "Razón social",
  title: "Título",
  titleen: "Título en inglés",
  description: "Descripción",
  descriptionen: "Descripción en inglés",
  eyebrow: "Encabezado",
  eyebrowen: "Encabezado en inglés",
  image: "Imagen",
  linkurl: "Enlace",
  linktext: "Texto del enlace",
  linktexten: "Texto del enlace en inglés",
  cargo: "Cargo",
  cargoen: "Cargo en inglés",
  foto: "Foto",
  orden: "Orden",
};

export function claveNormalizada(clave) {
  return String(clave || "")
    .replace(/[_-]/g, "")
    .toLowerCase();
}

export function esCampoSecreto(clave) {
  const normal = claveNormalizada(clave);
  return (
    normal.includes("password") ||
    normal.includes("contrasena") ||
    normal.includes("contraseña") ||
    normal === "hash" ||
    normal === "salt" ||
    normal.includes("token") ||
    normal.includes("secret")
  );
}

const CAMPOS_TECNICOS = new Set([
  "createdat",
  "updatedat",
  "deletedat",
  "fechacreacion",
  "fechaactualizacion",
]);

export function parseDatos(valor) {
  if (valor == null || valor === "") return null;
  if (typeof valor === "string") {
    const texto = valor.trim();
    if (!texto || texto === "—") return null;
    try {
      const parsed = JSON.parse(texto);
      if (parsed && typeof parsed === "object") return parsed;
      return { valor: parsed };
    } catch {
      return { detalle: texto };
    }
  }
  if (typeof valor === "object") return valor;
  return { valor };
}

export function etiquetaCampo(clave) {
  const normal = claveNormalizada(clave);
  if (ETIQUETAS_CAMPO[normal]) return ETIQUETAS_CAMPO[normal];
  if (/^(Id[A-Z]|id_)/.test(String(clave))) {
    return etiquetaCampo(String(clave).replace(/^id_?/i, ""));
  }
  const limpio = String(clave || "")
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2");
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
}

export function esUrl(valor) {
  return typeof valor === "string" && /^https?:\/\//i.test(valor.trim());
}

export function esCorreo(valor) {
  return typeof valor === "string" && /@/.test(valor) && /\./.test(valor);
}

function valoresIguales(a, b) {
  if (Object.is(a, b)) return true;
  if (a == null && b == null) return true;
  if (typeof a === "object" || typeof b === "object") {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return String(a) === String(b);
    }
  }
  return String(a) === String(b);
}

function formatearSecreto(valor) {
  if (valor == null || valor === "") return "Sin dato";
  return "Protegida (no se muestra)";
}

function redactarTextoLibre(texto) {
  return String(texto ?? "").replace(
    /("?(?:PasswordHash|password|contrase[nñ]a|token|secret)"?\s*[:=]\s*)("[^"]*"|'[^']*'|[^\s,;}+]+)/gi,
    "$1protegida",
  );
}

export function formatearValor(clave, valor) {
  if (esCampoSecreto(clave)) return formatearSecreto(valor);
  if (valor == null || valor === "") return "Sin dato";
  if (typeof valor === "boolean") return valor ? "Sí" : "No";
  const normal = claveNormalizada(clave);
  if (typeof valor === "number" && Number.isFinite(valor)) {
    if (normal.includes("precio") || normal.includes("total") || normal.includes("subtotal")) {
      return `CRC ${valor.toLocaleString("es-CR")}`;
    }
    return String(valor);
  }
  if (typeof valor === "string") {
    if (esUrl(valor)) {
      if (normal.includes("imagen") || normal.includes("foto") || normal.includes("logo")) {
        return "Imagen adjunta";
      }
      return "Enlace adjunto";
    }
    if (normal === "detalle" || /password|contrasen|hash/i.test(valor)) {
      return redactarTextoLibre(valor);
    }
    return valor;
  }
  if (Array.isArray(valor)) {
    if (valor.length === 0) return "Ninguno";
    return valor
      .map((item) => {
        if (item && typeof item === "object") {
          return item.nombre ?? item.Nombre ?? item.etiqueta ?? JSON.stringify(item);
        }
        return String(item);
      })
      .join(", ");
  }
  if (typeof valor === "object") {
    return (
      valor.nombre ??
      valor.Nombre ??
      valor.titulo ??
      valor.Titulo ??
      valor.codigo ??
      valor.Codigo ??
      Object.entries(valor)
        .filter(([k]) => !esCampoSecreto(k))
        .slice(0, 4)
        .map(([k, v]) => `${etiquetaCampo(k)}: ${v == null ? "Sin dato" : String(v)}`)
        .join(" · ")
    );
  }
  return String(valor);
}

export function extraerNombre(datos) {
  if (!datos || typeof datos !== "object" || Array.isArray(datos)) return "";
  const candidatos = [
    "nombre",
    "Nombre",
    "titulo",
    "Titulo",
    "Title",
    "producto",
    "Producto",
    "correo",
    "Correo",
    "email",
    "Email",
    "clave",
    "Clave",
    "codigo",
    "Codigo",
  ];
  for (const clave of candidatos) {
    const valor = datos[clave];
    if (typeof valor === "string" && valor.trim()) return valor.trim();
  }
  return "";
}

function clavesVisibles(datos) {
  if (!datos || typeof datos !== "object" || Array.isArray(datos)) return [];
  return Object.keys(datos).filter((clave) => {
    const normal = claveNormalizada(clave);
    if (esCampoSecreto(clave) && (normal.includes("password") || normal.includes("contrasen"))) {
      return true;
    }
    if (esCampoSecreto(clave)) return false;
    return !CAMPOS_TECNICOS.has(normal);
  });
}

export function valorDe(datos, clave) {
  if (!datos || typeof datos !== "object") return undefined;
  if (Object.prototype.hasOwnProperty.call(datos, clave)) return datos[clave];
  const normal = claveNormalizada(clave);
  const encontrada = Object.keys(datos).find((item) => claveNormalizada(item) === normal);
  return encontrada != null ? datos[encontrada] : undefined;
}

export function unirClaves(anteriores, nuevos) {
  const ordenPreferido = [
    "nombre",
    "titulo",
    "categoria",
    "subcategoria",
    "peso",
    "stock",
    "precio",
    "precionormal",
    "estado",
    "disponible",
    "descripcion",
    "motivo",
    "passwordhash",
  ];
  const porNormal = new Map();
  for (const clave of [...clavesVisibles(anteriores), ...clavesVisibles(nuevos)]) {
    const normal = claveNormalizada(clave);
    if (!porNormal.has(normal)) porNormal.set(normal, clave);
  }
  const lista = [...porNormal.values()];
  lista.sort((a, b) => {
    const na = claveNormalizada(a);
    const nb = claveNormalizada(b);
    const ia = ordenPreferido.indexOf(na);
    const ib = ordenPreferido.indexOf(nb);
    if (ia !== -1 || ib !== -1) {
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    }
    if (na === "id") return 1;
    if (nb === "id") return -1;
    return etiquetaCampo(a).localeCompare(etiquetaCampo(b), "es");
  });
  return lista;
}

export function camposCambiados(anteriores, nuevos, claves) {
  return claves.filter((clave) => !valoresIguales(valorDe(anteriores, clave), valorDe(nuevos, clave)));
}

const ENTIDADES = {
  productos: ["el", "producto"],
  usuarios: ["el", "usuario"],
  categorias: ["la", "categoría"],
  solicitudes_voluntariado: ["la", "solicitud de voluntariado"],
  fechas_voluntariado: ["la", "fecha de voluntariado"],
  solicitudes_visitas_grupales: ["la", "solicitud de visita"],
  disponibilidades_visitas: ["la", "fecha de visita"],
  donacion_solicitudes: ["la", "solicitud de donación"],
  donacion_necesidades: ["la", "necesidad de donación"],
  donacion_materiales_aceptados: ["el", "material de donación"],
  fechas_recepcion_donaciones: ["la", "fecha de recepción de donaciones"],
  inventario_stock_ubicaciones: ["el", "inventario de una ubicación"],
  inventario_ubicaciones: ["la", "ubicación de inventario"],
  activos_fijos: ["el", "activo fijo"],
  Pedido: ["el", "pedido"],
  hero_principal: ["la", "portada del sitio"],
  textos_institucionales: ["el", "texto institucional"],
  tarjetas_inicio: ["la", "tarjeta de inicio"],
  informacion_navbar: ["el", "menú superior"],
  informacion_footer: ["el", "pie de página"],
  galeria_institucional: ["la", "foto de la galería"],
  enlaces_sitio: ["el", "enlace del sitio"],
  faq_inicio: ["la", "pregunta frecuente"],
  equipo_sobre_nosotros: ["la", "persona del equipo"],
  compras: ["la", "compra"],
  compra_items: ["el", "producto de una compra"],
  facturas: ["la", "factura"],
  factura_items: ["el", "producto de una factura"],
};

const SECCIONES_INICIO = {
  aboutus: ["la", "historia"],
  about: ["la", "historia"],
  sobre: ["la", "historia"],
  homespotlight: ["la", "sección «Conocé más» del inicio"],
  homefeatured: ["la", "sección de productos destacados"],
  homeiniciativas: ["la", "sección de iniciativas"],
  homelocation: ["la", "ubicación"],
  homefaq: ["la", "sección de preguntas frecuentes"],
  homedocumentacion: ["la", "sección de documentación"],
};

const TABLAS_CON_SECCION = new Set(["textos_institucionales", "tarjetas_inicio"]);

function seccionDe(tabla, anteriores, nuevos) {
  if (!TABLAS_CON_SECCION.has(tabla)) return null;
  const clave = valorDe(nuevos, "Clave") ?? valorDe(anteriores, "Clave");
  return SECCIONES_INICIO[String(clave || "").toLowerCase()] || null;
}

function entidadDe(tabla, seccion) {
  const [articulo, entidad] = seccion || ENTIDADES[tabla] || ["el", "registro"];
  const de = articulo === "el" ? `del ${entidad}` : `de la ${entidad}`;
  return { articulo, entidad, de };
}

export const claseMarcaCambio =
  "bg-transparent font-semibold text-slate-900";

function textoAjusteStock(ubicacion, de, a, motivo) {
  const donde = ubicacion ? ` en ${ubicacion}` : "";
  return `El stock${donde} pasó de ${de} a ${a}${motivo ? `. Motivo: ${motivo}` : "."}`;
}

export function resumenCambio({ accion, tabla, detalle, anteriores, nuevos, nombre, cambiados, seccion }) {
  const { articulo, entidad, de: deEntidad } = entidadDe(tabla, seccion);
  const conNombre = nombre ? ` «${nombre}»` : "";

  if (accion === "INSERT") {
    return `Se creó ${articulo} ${entidad}${conNombre}.`;
  }
  if (accion === "DELETE") {
    return `Se eliminó ${articulo} ${entidad}${conNombre}.`;
  }
  if (accion === "AJUSTE_STOCK") {
    const de = anteriores?.Stock ?? anteriores?.stock;
    const a = nuevos?.Stock ?? nuevos?.stock;
    const motivo = nuevos?.Motivo ?? nuevos?.motivo;
    if (de != null && a != null) return textoAjusteStock("", de, a, motivo);
  }

  if (cambiados.length === 1) {
    const campo = etiquetaCampo(cambiados[0]);
    const de = formatearValor(cambiados[0], valorDe(anteriores, cambiados[0]));
    const a = formatearValor(cambiados[0], valorDe(nuevos, cambiados[0]));
    return `${campo} ${deEntidad}${conNombre}: antes «${de}», ahora «${a}».`;
  }
  if (cambiados.length > 1) {
    const lista = cambiados.map((clave) => etiquetaCampo(clave).toLowerCase()).join(", ");
    return `Se actualizó ${articulo} ${entidad}${conNombre}. Cambiaron: ${lista}.`;
  }
  if (detalle && !esDetalleTecnico(detalle)) return detalle;
  return `Se actualizó ${articulo} ${entidad}${conNombre}.`;
}

function esDetalleTecnico(detalle) {
  return /^\s*(INSERT|UPDATE|DELETE)\b/i.test(String(detalle || ""));
}

export function describirRegistro(item) {
  const anteriores = parseDatos(item?.datosAnteriores);
  const nuevos = parseDatos(item?.datosNuevos);
  const claves = unirClaves(anteriores, nuevos);
  const seccion = seccionDe(item?.tabla, anteriores, nuevos);
  return resumenCambio({
    accion: item?.accion,
    tabla: item?.tabla,
    detalle: item?.detalle,
    anteriores,
    nuevos,
    nombre: seccion ? "" : extraerNombre(nuevos) || extraerNombre(anteriores),
    cambiados: camposCambiados(anteriores, nuevos, claves),
    seccion,
  });
}

export function detalleLegible(item) {
  const detalle = String(item?.detalle || "").trim();
  if (!detalle || esDetalleTecnico(detalle)) return describirRegistro(item);
  const ajuste = detalle.match(/^Producto (\S+); ubicación (.+?); anterior (\S+); nuevo (\S+); motivo: (.*)$/i);
  if (ajuste) {
    const [, , ubicacion, de, a, motivo] = ajuste;
    return textoAjusteStock(ubicacion, de, a, motivo);
  }
  return detalle;
}

