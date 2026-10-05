import {
  ensamblarPdf,
  pdfLineStroke,
  pdfRectFill,
  pdfText,
} from "./exportarHistorialMovimientos";

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 40;

function texto(valor, fallback = "—") {
  const limpio = String(valor ?? "").trim();
  return limpio || fallback;
}

export function formatearFechaCompra(fecha) {
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return texto(fecha);
  return date
    .toLocaleString("es-CR", {
      dateStyle: "medium",
      timeStyle: "short",
    })
    .replace(/[\u00A0\u202F\u2007\u2009]/g, " ");
}

export function nombreClienteCompra(compra) {
  const ficha = compra?.cliente;
  if (ficha?.razonSocial) return texto(ficha.razonSocial);
  const partes = [ficha?.nombre, ficha?.apellidos].filter(Boolean).join(" ").trim();
  return texto(partes || compra?.clienteNombre, "Cliente");
}

export function presentarCompra(compra = {}) {
  const ficha = compra.cliente;
  const meta = [
    ["Número de orden", texto(compra.numero)],
    ["Fecha", formatearFechaCompra(compra.fecha)],
    ["Estado", texto(compra.estado, "Pendiente")],
    ["Cliente", nombreClienteCompra(compra)],
    ["Correo", texto(compra.clienteCorreo || ficha?.correo)],
  ];
  if (ficha?.telefono) meta.push(["Teléfono", texto(ficha.telefono)]);
  if (ficha?.identificacion) meta.push(["Identificación", texto(ficha.identificacion)]);
  if (ficha?.cedulaJuridica) meta.push(["Cédula jurídica", texto(ficha.cedulaJuridica)]);
  if (ficha?.direccionFiscal) meta.push(["Dirección fiscal", texto(ficha.direccionFiscal)]);
  meta.push(["Punto de venta", texto(compra.ubicacionNombre || compra.ubicacionCodigo)]);
  meta.push(["Método de pago", texto(compra.metodoPago, "Comprobante")]);

  return {
    meta,
    items: Array.isArray(compra.items) ? compra.items : [],
    subtotal: Number(compra.subtotal) || 0,
    impuestos: Number(compra.impuestos) || 0,
    total: Number(compra.total) || 0,
  };
}

function formatoCrc(amount) {
  const value = Number.isFinite(Number(amount)) ? Number(amount) : 0;
  const negativo = value < 0;
  const [entera, decimal] = Math.abs(value).toFixed(2).split(".");
  const conMiles = entera.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `CRC ${negativo ? "-" : ""}${conMiles},${decimal}`;
}

function anchoTexto(valor, size) {
  return String(valor ?? "").length * size * 0.52;
}

function pdfTextRight(rightX, y, valor, size = 9, font = "/F1", gray = 0) {
  return pdfText(rightX - anchoTexto(valor, size), y, valor, size, font, gray);
}

function partirTexto(valor, maxChars) {
  const palabras = texto(valor, "").split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return ["—"];
  const lineas = [];
  let actual = "";
  for (const palabra of palabras) {
    const siguiente = actual ? `${actual} ${palabra}` : palabra;
    if (siguiente.length > maxChars && actual) {
      lineas.push(actual);
      actual = palabra;
    } else {
      actual = siguiente;
    }
  }
  if (actual) lineas.push(actual);
  return lineas;
}

export function construirPdfResumenCompra({
  compra,
  logoData = null,
  textos = {},
} = {}) {
  const vista = presentarCompra(compra);
  const titulo = textos.titulo || "Resumen de la compra";
  const nota =
    textos.nota ||
    "Tu pedido quedó pendiente de revisión. Te avisamos cuando se apruebe y envíe.";
  const columnas = {
    producto: textos.producto || "Producto",
    cantidad: textos.cantidad || "Cantidad",
    precio: textos.precio || "Precio unitario",
    subtotal: textos.subtotal || "Subtotal",
  };
  const traducirEtiqueta = textos.traducirEtiqueta || ((valor) => valor);
  const traducirValor = textos.traducirValor || ((_etiqueta, valor) => valor);
  const totales = [
    [textos.subtotalSinIva || "Subtotal (sin IVA)", vista.subtotal],
    [textos.iva || "IVA (13%)", vista.impuestos],
    [textos.total || "Total", vista.total],
  ];

  const pages = [];
  let ops = [];
  let y = PAGE_HEIGHT - MARGIN;

  const cerrarPagina = () => {
    ops.push(pdfLineStroke(MARGIN, 28, PAGE_WIDTH - MARGIN, 28, 0.75, 0.4));
    ops.push(pdfText(MARGIN, 16, "Café UNA · Universidad Nacional de Costa Rica", 8, "/F1", 0.35));
    pages.push(ops.join("\n"));
    ops = [];
    y = PAGE_HEIGHT - MARGIN;
  };

  const asegurar = (espacio) => {
    if (y - espacio >= 48) return;
    cerrarPagina();
  };

  if (logoData?.binary) {
    const logoH = 36;
    const logoW = Math.round(logoH * (logoData.aspectRatio || 1.95));
    ops.push(`q ${logoW} 0 0 ${logoH} ${MARGIN} ${y - logoH + 8} cm /ImLogo Do Q`);
    ops.push(pdfText(MARGIN + logoW + 14, y - 8, titulo, 16, "/F2", 0));
    ops.push(pdfText(MARGIN + logoW + 14, y - 26, nota, 8, "/F1", 0.3));
    y -= logoH + 16;
  } else {
    ops.push(pdfText(MARGIN, y, "Café UNA", 16, "/F2", 0));
    y -= 20;
    ops.push(pdfText(MARGIN, y, titulo, 13, "/F2", 0));
    y -= 16;
    ops.push(pdfText(MARGIN, y, nota, 8, "/F1", 0.3));
    y -= 18;
  }

  ops.push(pdfLineStroke(MARGIN, y, PAGE_WIDTH - MARGIN, y, 0.7, 0.8));
  y -= 22;

  for (const [etiqueta, valor] of vista.meta) {
    const etiquetaTxt = traducirEtiqueta(etiqueta);
    const valorTxt = traducirValor(etiqueta, valor);
    const lineas = partirTexto(valorTxt, 62);
    asegurar(16 + lineas.length * 12);
    ops.push(pdfText(MARGIN, y, etiquetaTxt, 8, "/F2", 0.35));
    lineas.forEach((linea, index) => {
      ops.push(pdfText(MARGIN + 150, y - index * 12, linea, 10, "/F1", 0));
    });
    y -= 14 + (lineas.length - 1) * 12;
  }

  y -= 8;
  asegurar(36);
  const tableTop = y;
  ops.push(pdfRectFill(MARGIN, tableTop - 6, PAGE_WIDTH - MARGIN * 2, 18, 0.16));
  ops.push(pdfText(MARGIN + 6, tableTop, columnas.producto.toUpperCase(), 8, "/F2", 1));
  ops.push(pdfText(MARGIN + 280, tableTop, columnas.cantidad.toUpperCase(), 8, "/F2", 1));
  ops.push(pdfTextRight(PAGE_WIDTH - MARGIN - 78, tableTop, columnas.precio.toUpperCase(), 8, "/F2", 1));
  ops.push(pdfTextRight(PAGE_WIDTH - MARGIN - 8, tableTop, columnas.subtotal.toUpperCase(), 8, "/F2", 1));
  y = tableTop - 22;

  const items = vista.items.length > 0 ? vista.items : [];
  if (items.length === 0) {
    ops.push(pdfText(MARGIN + 6, y, "—", 9, "/F1", 0.35));
    y -= 18;
  }

  items.forEach((item, index) => {
    const nombreLineas = partirTexto(item.nombre || "Producto", 36);
    const alto = Math.max(16, nombreLineas.length * 12);
    asegurar(alto + 8);
    if (index % 2 === 1) {
      ops.push(pdfRectFill(MARGIN, y - 4, PAGE_WIDTH - MARGIN * 2, alto, 0.96));
    }
    nombreLineas.forEach((linea, lineaIndex) => {
      ops.push(pdfText(MARGIN + 6, y - lineaIndex * 12, linea, 9, "/F1", 0));
    });
    const cantidad = String(item.cantidad ?? 0);
    const precio = formatoCrc(item.precioUnitario);
    const subtotal = formatoCrc(item.subtotal);
    ops.push(pdfText(MARGIN + 286, y, cantidad, 9, "/F1", 0));
    ops.push(pdfTextRight(PAGE_WIDTH - MARGIN - 78, y, precio, 9, "/F1", 0));
    ops.push(pdfTextRight(PAGE_WIDTH - MARGIN - 8, y, subtotal, 9, "/F2", 0));
    y -= alto + 6;
  });

  y -= 8;
  asegurar(totales.length * 16 + 8);
  totales.forEach(([etiqueta, monto], index) => {
    const esTotal = index === totales.length - 1;
    if (esTotal) {
      ops.push(pdfLineStroke(PAGE_WIDTH - MARGIN - 210, y + 12, PAGE_WIDTH - MARGIN, y + 12, 0.7, 0.6));
    }
    ops.push(pdfText(PAGE_WIDTH - MARGIN - 210, y, etiqueta, esTotal ? 11 : 9, "/F2", esTotal ? 0 : 0.3));
    ops.push(
      pdfTextRight(PAGE_WIDTH - MARGIN - 8, y, formatoCrc(monto), esTotal ? 11 : 9, "/F2", 0),
    );
    y -= esTotal ? 18 : 15;
  });

  cerrarPagina();
  return ensamblarPdf(pages, PAGE_WIDTH, PAGE_HEIGHT, logoData);
}

export function nombreArchivoResumenCompra(numero) {
  const seguro = String(numero || "cafe-una").replace(/[^\w.-]+/g, "-");
  return `resumen-compra-${seguro}.pdf`;
}
