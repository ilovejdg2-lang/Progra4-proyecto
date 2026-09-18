export const PUNTOS_INGRESOS = [
  { id: "general", label: "General", codigo: null },
  { id: "funda", label: "FUNDA-UNA", codigo: "POS_FUNA_UNA" },
  { id: "bodega", label: "Bodega Central", codigo: "BODEGA_CENTRAL" },
  { id: "editorial", label: "Editorial", codigo: "POS_EDITORIAL" },
];

const ESTADOS_INGRESO = new Set(["Entregado", "Aceptado"]);

export function esVentaIngreso(compra) {
  return ESTADOS_INGRESO.has(String(compra?.estado || "").trim());
}

export function formatCRC(value) {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

export function ymdLocal(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function inicioFinMes(year, monthIndex) {
  const desde = new Date(year, monthIndex, 1);
  const hasta = new Date(year, monthIndex + 1, 0);
  return { desde: ymdLocal(desde), hasta: ymdLocal(hasta), dias: hasta.getDate() };
}

export function coincidePunto(compra, codigo) {
  if (!codigo) return true;
  const actual = String(compra?.ubicacionCodigo || "").toUpperCase();
  if (actual === codigo) return true;
  const nombre = String(compra?.ubicacionNombre || "").toLowerCase();
  if (codigo === "POS_FUNA_UNA") {
    return nombre.includes("funda") || nombre.includes("funa");
  }
  if (codigo === "BODEGA_CENTRAL") return nombre.includes("bodega");
  if (codigo === "POS_EDITORIAL") return nombre.includes("editorial");
  return false;
}

export function agruparIngresosPorDia(compras, year, monthIndex, codigo = null) {
  const { dias } = inicioFinMes(year, monthIndex);
  const porDia = Array.from({ length: dias }, (_, i) => ({
    dia: i + 1,
    total: 0,
    transacciones: 0,
  }));

  for (const compra of compras) {
    if (!esVentaIngreso(compra) || !coincidePunto(compra, codigo)) continue;
    const fecha = new Date(compra.fecha);
    if (Number.isNaN(fecha.getTime())) continue;
    if (fecha.getFullYear() !== year || fecha.getMonth() !== monthIndex) continue;
    const idx = fecha.getDate() - 1;
    if (!porDia[idx]) continue;
    porDia[idx].total += Number(compra.total) || 0;
    porDia[idx].transacciones += 1;
  }

  let pico = null;
  for (const fila of porDia) {
    if (fila.total <= 0) continue;
    if (!pico || fila.total > pico.total) pico = fila;
  }

  return { porDia, pico };
}

export function sumarIngresos(compras, { desdeYmd, hastaYmd, codigo } = {}) {
  let total = 0;
  let transacciones = 0;
  for (const compra of compras) {
    if (!esVentaIngreso(compra) || !coincidePunto(compra, codigo)) continue;
    const ymd = ymdLocal(compra.fecha);
    if (desdeYmd && ymd < desdeYmd) continue;
    if (hastaYmd && ymd > hastaYmd) continue;
    total += Number(compra.total) || 0;
    transacciones += 1;
  }
  return { total, transacciones };
}

export function deltaPorcentaje(actual, anterior) {
  if (!Number.isFinite(anterior) || anterior <= 0) return null;
  const delta = ((Number(actual) - anterior) / anterior) * 100;
  if (!Number.isFinite(delta)) return null;
  return Math.round(delta);
}

export function esUsuarioActivo(usuario) {
  return String(usuario?.estado ?? usuario?.Estado ?? "")
    .trim()
    .toLowerCase() === "activo";
}

export function tiempoRelativo(fecha) {
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return "";
  const segundos = Math.max(0, Math.round((Date.now() - d.getTime()) / 1000));
  if (segundos < 60) return "Hace un momento";
  if (segundos < 3600) {
    const n = Math.floor(segundos / 60);
    return n === 1 ? "Hace 1 minuto" : `Hace ${n} minutos`;
  }
  if (segundos < 86400) {
    const n = Math.floor(segundos / 3600);
    return n === 1 ? "Hace 1 hora" : `Hace ${n} horas`;
  }
  const dias = Math.floor(segundos / 86400);
  return dias === 1 ? "Hace 1 día" : `Hace ${dias} días`;
}

export function tituloActividad(registro) {
  const accion = String(registro?.accion || "").toUpperCase();
  const tabla = String(registro?.tabla || "").toLowerCase();
  if (tabla.includes("compra") && accion === "INSERT") return "Nueva venta registrada";
  if (tabla === "usuarios" && accion === "INSERT") return "Nuevo usuario creado";
  if (tabla === "usuarios" && accion === "UPDATE") return "Usuario actualizado";
  if (accion === "AJUSTE_STOCK") return "Inventario actualizado";
  if (tabla === "productos" && /agotad/i.test(String(registro?.detalle || ""))) {
    return "Producto agotado";
  }
  if (tabla === "productos" && accion === "UPDATE") return "Producto actualizado";
  if (accion === "INSERT") return "Registro creado";
  if (accion === "DELETE") return "Registro eliminado";
  if (accion === "UPDATE") return "Registro actualizado";
  return registro?.detalle || "Actividad";
}

export function moduloActividad(tabla) {
  const t = String(tabla || "").toLowerCase();
  if (t.includes("compra")) return "Ventas";
  if (t.startsWith("usuario")) return "Usuarios";
  if (t.includes("producto") || t.includes("categoria")) return "Productos";
  if (t.includes("inventario") || t.includes("activo")) return "Inventario";
  if (t.includes("donacion")) return "Donaciones";
  if (t.includes("visita")) return "Visitas";
  if (t.includes("volunt")) return "Voluntariado";
  return "Sistema";
}
