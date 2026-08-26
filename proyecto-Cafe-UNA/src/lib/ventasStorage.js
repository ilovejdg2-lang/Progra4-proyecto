const STORAGE_KEY = "cafe-una-ventas";

function leerVentas() {
  try {
    const crudo = localStorage.getItem(STORAGE_KEY);
    const parsed = crudo ? JSON.parse(crudo) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function guardarVentas(ventas) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ventas));
}

export function obtenerVentas() {
  return leerVentas().sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}

export function registrarVenta(venta) {
  const ventas = leerVentas();
  const registro = {
    id: venta.id || `V-${Date.now()}`,
    fecha: venta.fecha || new Date().toISOString(),
    cliente: venta.cliente || "Cliente",
    correo: venta.correo || "",
    items: Array.isArray(venta.items) ? venta.items : [],
    subtotal: Number(venta.subtotal) || 0,
    iva: Number(venta.iva) || 0,
    total: Number(venta.total) || 0,
    estadoPago: venta.estadoPago || "Pagado",
    metodo: venta.metodo || "Tarjeta",
  };
  ventas.push(registro);
  guardarVentas(ventas);
  return registro;
}
