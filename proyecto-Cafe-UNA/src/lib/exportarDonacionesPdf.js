import { camposSolicitudDonacion } from "../services/donacionesService";
import {
  LOGO_ASPECT_RATIO,
  LOGO_CAFE_UNA_JPEG_BASE64,
  LOGO_HEIGHT_PX,
  LOGO_WIDTH_PX,
} from "./logoCafeUnaBase64";

export function descargarArchivo(nombre, contenido, mime, { binario = false } = {}) {
  const blob = binario
    ? new Blob([Uint8Array.from(contenido, (ch) => ch.charCodeAt(0) & 0xff)], { type: mime })
    : new Blob([contenido], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const WIN1252 = {
  Á: 0xc1,
  É: 0xc9,
  Í: 0xcd,
  Ó: 0xd3,
  Ú: 0xda,
  Ü: 0xdc,
  Ñ: 0xd1,
  á: 0xe1,
  é: 0xe9,
  í: 0xed,
  ó: 0xf3,
  ú: 0xfa,
  ü: 0xfc,
  ñ: 0xf1,
  "¿": 0xbf,
  "¡": 0xa1,
  "—": 0x97,
  "–": 0x96,
  "·": 0xb7,
  "°": 0xb0,
};

function pdfEscape(texto) {
  const bytes = [];
  for (const ch of String(texto ?? "")) {
    if (ch === "\\" || ch === "(" || ch === ")") {
      bytes.push(0x5c, ch.charCodeAt(0));
      continue;
    }
    const code = ch.charCodeAt(0);
    if (code < 128) {
      bytes.push(code);
      continue;
    }
    bytes.push(WIN1252[ch] ?? 0x3f);
  }
  let out = "";
  for (const b of bytes) out += String.fromCharCode(b);
  return out;
}

/**
 * Dibuja texto con aislamiento de estado gráfico y color definido (por defecto negro puro: 0 g).
 */
function pdfText(x, y, texto, size = 10, font = "/F1", gray = 0) {
  return `q ${gray} g BT ${font} ${size} Tf ${x} ${y} Td (${pdfEscape(texto)}) Tj ET Q`;
}

/**
 * Traza una línea con aislamiento de estado gráfico.
 */
function pdfLineStroke(x1, y1, x2, y2, gray = 0.6, width = 0.5) {
  return `q ${gray} G ${width} w ${x1} ${y1} m ${x2} ${y2} l S Q`;
}

/**
 * Rellena un rectángulo con aislamiento de estado gráfico (evita fugar color hacia el texto).
 */
function pdfRectFill(x, y, w, h, gray = 0.92) {
  return `q ${gray} g ${x} ${y} ${w} ${h} re f Q`;
}

function formatFechaDisplay(valor) {
  if (!valor) return "—";
  const str = String(valor).slice(0, 10);
  const parts = str.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return str;
}

/**
 * Devuelve el descriptor del logo institucional predeterminado (Café UNA).
 */
export function obtenerLogoDefault() {
  const binary =
    typeof atob === "function"
      ? atob(LOGO_CAFE_UNA_JPEG_BASE64)
      : typeof globalThis !== "undefined" && globalThis.Buffer
        ? globalThis.Buffer.from(LOGO_CAFE_UNA_JPEG_BASE64, "base64").toString("binary")
        : "";
  return {
    binary,
    width: LOGO_WIDTH_PX,
    height: LOGO_HEIGHT_PX,
    aspectRatio: LOGO_ASPECT_RATIO,
  };
}

/**
 * Carga la imagen logo.webp en el navegador y la prepara para incrustación directa en el PDF.
 * Si falla o está fuera del entorno de navegador, retorna de forma segura el logo predeterminado.
 */
export async function cargarLogoWebpParaPdf(url = "/logo.webp") {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return obtenerLogoDefault();
  }
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    await new Promise((resolve, reject) => {
      if (img.complete && img.naturalWidth > 0) return resolve();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("No se pudo cargar logo.webp"));
    });

    const canvas = document.createElement("canvas");
    const targetW = Math.min(360, img.naturalWidth || 360);
    const scale = targetW / (img.naturalWidth || 360);
    const targetH = Math.round((img.naturalHeight || 185) * scale);
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return obtenerLogoDefault();

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    const base64 = dataUrl.split(",")[1];
    const binary = atob(base64);

    return {
      binary,
      width: canvas.width,
      height: canvas.height,
      aspectRatio: canvas.width / canvas.height,
    };
  } catch {
    return obtenerLogoDefault();
  }
}

function ensamblarPdf(paginas, pageWidth, pageHeight, logoData = null) {
  const objects = [];
  objects.push("1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj");

  const logoObjNum = logoData ? 5 : null;
  const firstPageNum = logoData ? 6 : 5;

  const kids = paginas.map((_, i) => `${firstPageNum + i * 2} 0 R`).join(" ");
  objects.push(
    `2 0 obj << /Type /Pages /Count ${paginas.length} /Kids [${kids}] >> endobj`,
  );

  // Fonts: F1 = Helvetica, F2 = Helvetica-Bold
  objects.push(
    "3 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >> endobj",
  );
  objects.push(
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >> endobj",
  );

  if (logoData && logoData.binary) {
    objects.push(
      `5 0 obj << /Type /XObject /Subtype /Image /Width ${logoData.width} /Height ${logoData.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logoData.binary.length} >> stream\n${logoData.binary}\nendstream endobj`,
    );
  }

  paginas.forEach((content, i) => {
    const pageNum = firstPageNum + i * 2;
    const contentNum = pageNum + 1;
    const xObjectRes = logoData ? `/XObject << /ImLogo ${logoObjNum} 0 R >>` : "";
    objects.push(
      `${pageNum} 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> ${xObjectRes} >> /Contents ${contentNum} 0 R >> endobj`,
    );
    objects.push(
      `${contentNum} 0 obj << /Length ${content.length} >> stream\n${content}\nendstream endobj`,
    );
  });

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += `${obj}\n`;
  }
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return pdf;
}

/**
 * Genera el reporte general consolidado de solicitudes de donación (formato apaisado).
 * Incluye el logo oficial de Café UNA y texto en negro de alto contraste.
 */
export function construirPdfReporteDonaciones({
  solicitudes = [],
  adminNombre = "",
  fechaGeneracion = "",
  filtrosTexto = "",
  resumenEstados = null,
  logoData = obtenerLogoDefault(),
}) {
  const pageWidth = 842;
  const pageHeight = 595;
  const margin = 36;
  const lineHeight = 18;
  const headerY = pageHeight - margin;
  const contentStart = headerY - 88;
  const rowsPerPage = Math.floor((contentStart - margin - 25) / lineHeight);

  const filas = solicitudes.map((item) => {
    const campos = camposSolicitudDonacion(item);
    return {
      id: item.id,
      donante: campos.donanteNombre || "Sin nombre",
      contacto:
        [campos.numeroIdentificacion, campos.correo || campos.telefono]
          .filter(Boolean)
          .join(" | ") || "—",
      categoria: campos.categoria || "No indicada",
      fecha: formatFechaDisplay(campos.fechaSolicitud),
      estado: campos.estado || "Pendiente",
      cantidadArticulos:
        [campos.cantidadEstimada, campos.estadoArticulos]
          .filter(Boolean)
          .join(" - ") || campos.descripcion || "—",
    };
  });

  const chunks = [];
  for (let i = 0; i < filas.length; i += rowsPerPage) {
    chunks.push(filas.slice(i, i + rowsPerPage));
  }
  if (chunks.length === 0) chunks.push([]);

  const colX = {
    id: margin,
    donante: margin + 35,
    contacto: margin + 200,
    categoria: margin + 400,
    fecha: margin + 535,
    estado: margin + 615,
    detalle: margin + 685,
  };

  const paginas = [];

  chunks.forEach((chunk, pageIndex) => {
    const ops = [];

    // Header institucional con logo oficial
    if (logoData) {
      const logoH = 34;
      const logoW = Math.round(logoH * (logoData.aspectRatio || 1.95));
      const logoX = margin;
      const logoY = headerY - logoH + 4;
      ops.push(`q ${logoW} 0 0 ${logoH} ${logoX} ${logoY} cm /ImLogo Do Q`);

      ops.push(
        pdfText(
          margin + logoW + 18,
          headerY - 4,
          "Reporte Administrativo de Solicitudes de Donación",
          13,
          "/F2",
          0,
        ),
      );
      ops.push(
        pdfText(
          margin + logoW + 18,
          headerY - 18,
          `Generado el: ${fechaGeneracion || "—"}   |   Administrador: ${adminNombre || "—"}`,
          9,
          "/F1",
          0,
        ),
      );
      ops.push(
        pdfText(
          margin + logoW + 18,
          headerY - 30,
          `Filtros aplicados: ${filtrosTexto || "Ninguno (todas las solicitudes)"}`,
          9,
          "/F1",
          0,
        ),
      );
    } else {
      ops.push(pdfText(margin, headerY, "Café-UNA", 16, "/F2", 0));
      ops.push(
        pdfText(
          margin,
          headerY - 18,
          "Reporte Administrativo de Solicitudes de Donación",
          12,
          "/F2",
          0,
        ),
      );
      ops.push(
        pdfText(
          margin,
          headerY - 32,
          `Generado el: ${fechaGeneracion || "—"}   |   Administrador: ${adminNombre || "—"}`,
          9,
          "/F1",
          0,
        ),
      );
      ops.push(
        pdfText(
          margin,
          headerY - 45,
          `Filtros aplicados: ${filtrosTexto || "Ninguno (todas las solicitudes)"}`,
          9,
          "/F1",
          0,
        ),
      );
    }

    if (resumenEstados) {
      const resumenStr = `Total: ${resumenEstados.Total ?? solicitudes.length}  |  Pendientes: ${resumenEstados.Pendiente ?? 0}  |  Aceptadas: ${resumenEstados.Aceptada ?? 0}  |  Rechazadas: ${resumenEstados.Rechazada ?? 0}`;
      ops.push(pdfText(margin, headerY - 48, resumenStr, 9.5, "/F2", 0));
    }

    // Línea separadora
    ops.push(pdfLineStroke(margin, headerY - 56, pageWidth - margin, headerY - 56, 0.6, 1));

    // Cabecera de la tabla
    const tableHeaderY = contentStart;
    ops.push(pdfRectFill(margin, tableHeaderY - 4, pageWidth - 2 * margin, 18, 0.90));
    ops.push(pdfText(colX.id, tableHeaderY, "#", 9, "/F2", 0));
    ops.push(pdfText(colX.donante, tableHeaderY, "Donante", 9, "/F2", 0));
    ops.push(pdfText(colX.contacto, tableHeaderY, "Identificación / Contacto", 9, "/F2", 0));
    ops.push(pdfText(colX.categoria, tableHeaderY, "Categoría", 9, "/F2", 0));
    ops.push(pdfText(colX.fecha, tableHeaderY, "Fecha", 9, "/F2", 0));
    ops.push(pdfText(colX.estado, tableHeaderY, "Estado", 9, "/F2", 0));
    ops.push(pdfText(colX.detalle, tableHeaderY, "Cant. / Detalle", 9, "/F2", 0));

    ops.push(pdfLineStroke(margin, tableHeaderY - 5, pageWidth - margin, tableHeaderY - 5, 0.5, 0.75));

    // Filas
    chunk.forEach((row, idx) => {
      const y = tableHeaderY - 18 - idx * lineHeight;
      if (idx % 2 === 1) {
        ops.push(pdfRectFill(margin, y - 4, pageWidth - 2 * margin, lineHeight, 0.96));
      }

      ops.push(pdfText(colX.id, y, String(row.id), 8, "/F1", 0));
      ops.push(pdfText(colX.donante, y, row.donante.slice(0, 30), 8, "/F2", 0));
      ops.push(pdfText(colX.contacto, y, row.contacto.slice(0, 38), 8, "/F1", 0));
      ops.push(pdfText(colX.categoria, y, row.categoria.slice(0, 24), 8, "/F1", 0));
      ops.push(pdfText(colX.fecha, y, row.fecha, 8, "/F1", 0));
      ops.push(pdfText(colX.estado, y, row.estado, 8, "/F2", 0));
      ops.push(pdfText(colX.detalle, y, row.cantidadArticulos.slice(0, 26), 8, "/F1", 0));

      ops.push(pdfLineStroke(margin, y - 5, pageWidth - margin, y - 5, 0.7, 0.3));
    });

    if (chunk.length === 0) {
      ops.push(
        pdfText(
          margin + 20,
          tableHeaderY - 30,
          "No se encontraron solicitudes registradas para los criterios seleccionados.",
          10,
          "/F1",
          0,
        ),
      );
    }

    // Pie de página
    ops.push(pdfLineStroke(margin, margin + 12, pageWidth - margin, margin + 12, 0.6, 0.5));
    ops.push(
      pdfText(
        margin,
        margin,
        "Café-UNA · Documento confidencial para uso administrativo y auditoría.",
        8,
        "/F1",
        0,
      ),
    );
    ops.push(
      pdfText(
        pageWidth - margin - 90,
        margin,
        `Página ${pageIndex + 1} de ${chunks.length}`,
        8,
        "/F1",
        0,
      ),
    );

    paginas.push(ops.join("\n"));
  });

  return ensamblarPdf(paginas, pageWidth, pageHeight, logoData);
}

/**
 * Genera la ficha individual oficial de una solicitud de donación (formato vertical A4).
 * Incluye el logo oficial de Café UNA y texto en negro de alto contraste.
 */
export function construirPdfFichaDonacion({
  solicitud,
  adminNombre = "",
  fechaGeneracion = "",
  logoData = obtenerLogoDefault(),
}) {
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 40;
  const innerWidth = pageWidth - 2 * margin;

  const campos = camposSolicitudDonacion(solicitud);

  const ops = [];

  let y = pageHeight - margin;

  // Encabezado con logo oficial
  if (logoData) {
    const logoH = 36;
    const logoW = Math.round(logoH * (logoData.aspectRatio || 1.95));
    const logoX = margin;
    const logoY = y - logoH + 2;
    ops.push(`q ${logoW} 0 0 ${logoH} ${logoX} ${logoY} cm /ImLogo Do Q`);

    ops.push(pdfText(margin + logoW + 16, y - 6, "Ficha de Solicitud de Donación", 14, "/F2", 0));
    ops.push(
      pdfText(
        margin + logoW + 16,
        y - 20,
        `Solicitud #${solicitud?.id || "—"}   |   Fecha de emisión: ${fechaGeneracion || "—"}`,
        9,
        "/F1",
        0,
      ),
    );
  } else {
    ops.push(pdfText(margin, y, "Café-UNA", 18, "/F2", 0));
    ops.push(pdfText(margin, y - 18, "Ficha de Solicitud de Donación", 13, "/F2", 0));
    ops.push(
      pdfText(
        margin,
        y - 32,
        `Solicitud #${solicitud?.id || "—"}   |   Fecha de emisión: ${fechaGeneracion || "—"}`,
        9,
        "/F1",
        0,
      ),
    );
  }

  // Badge de estado en la esquina superior derecha
  const estadoTexto = `Estado: ${(campos.estado || "Pendiente").toUpperCase()}`;
  ops.push(pdfRectFill(pageWidth - margin - 150, y - 10, 150, 24, 0.92));
  ops.push(pdfLineStroke(pageWidth - margin - 150, y - 10, pageWidth - margin, y - 10, 0.6, 0.5));
  ops.push(pdfText(pageWidth - margin - 140, y + 2, estadoTexto, 10, "/F2", 0));

  y -= 46;
  ops.push(pdfLineStroke(margin, y, margin + innerWidth, y, 0.5, 1));
  y -= 20;

  function dibujarSeccion(titulo, camposArray) {
    ops.push(pdfRectFill(margin, y - 4, innerWidth, 18, 0.90));
    ops.push(pdfText(margin + 8, y, titulo.toUpperCase(), 9, "/F2", 0));
    y -= 18;

    camposArray.forEach(([etiqueta, valor]) => {
      const valorStr = String(valor || "No indicado").trim();
      ops.push(pdfText(margin + 12, y, etiqueta, 9, "/F2", 0));
      ops.push(pdfText(margin + 180, y, valorStr.slice(0, 65), 9, "/F1", 0));
      y -= 14;
    });
    y -= 10;
  }

  // Sección 1: Donante
  dibujarSeccion("1. Información del Donante", [
    ["Tipo de donante:", campos.tipoDonante],
    [
      campos.esOrganizacion ? "Razón social:" : "Nombre completo:",
      campos.donanteNombre || "—",
    ],
    ["Tipo de identificación:", campos.tipoIdentificacion || "—"],
    ["Número de identificación:", campos.numeroIdentificacion || "—"],
    ["Correo electrónico:", campos.correo || "—"],
    ["Teléfono:", campos.telefono || "—"],
  ]);

  // Sección 2: Detalles de la donación
  dibujarSeccion("2. Detalles de los Artículos / Bienes Donados", [
    ["Categoría:", campos.categoria || "—"],
    ["Cantidad o volumen:", campos.cantidadEstimada || "—"],
    ["Estado de los artículos:", campos.estadoArticulos || "—"],
    ["Valor estimado:", campos.valorEstimado ? `CRC ${campos.valorEstimado}` : "No indicado"],
  ]);

  // Descripción detallada en caja
  ops.push(pdfText(margin + 12, y, "Descripción detallada:", 9, "/F2", 0));
  y -= 14;
  const descripcionLimpia = String(campos.descripcion || "Sin descripción proporcionada.").trim();
  ops.push(pdfRectFill(margin + 12, y - 24, innerWidth - 24, 34, 0.96));
  ops.push(pdfLineStroke(margin + 12, y - 24, margin + innerWidth - 12, y - 24, 0.7, 0.5));
  ops.push(pdfText(margin + 18, y, descripcionLimpia.slice(0, 95), 8, "/F1", 0));
  if (descripcionLimpia.length > 95) {
    ops.push(pdfText(margin + 18, y - 11, descripcionLimpia.slice(95, 190), 8, "/F1", 0));
  }
  y -= 38;

  // Sección 3: Logística y Entrega
  dibujarSeccion("3. Logística de Entrega y Recolección", [
    ["Método preferido:", campos.metodoEntrega || "—"],
    ["Día coordinado:", formatFechaDisplay(campos.fechaEntrega)],
    ["Hora coordinada:", campos.horaEntrega || "—"],
    ["Dirección de recolección:", (campos.direccionRecoleccion || "No aplica / No indicada").slice(0, 65)],
  ]);

  // Sección 4: Registro y Auditoría
  dibujarSeccion("4. Registro y Auditoría Administrativa", [
    ["Fecha de la solicitud:", formatFechaDisplay(campos.fechaSolicitud)],
    ["Administrador emisor:", adminNombre || "—"],
    ["Resolución / Estado:", campos.estado || "Pendiente"],
  ]);

  // Área de firmas
  y -= 15;
  ops.push(pdfLineStroke(margin + 30, y, margin + 200, y, 0.5, 0.7));
  ops.push(pdfLineStroke(margin + innerWidth - 200, y, margin + innerWidth - 30, y, 0.5, 0.7));
  ops.push(pdfText(margin + 60, y - 12, "Firma del Donante", 8, "/F1", 0));
  ops.push(pdfText(margin + innerWidth - 175, y - 12, "Recepción Café-UNA", 8, "/F1", 0));

  // Pie de página
  ops.push(pdfLineStroke(margin, margin + 12, margin + innerWidth, margin + 12, 0.6, 0.5));
  ops.push(
    pdfText(
      margin,
      margin,
      "Café-UNA · Ficha oficial de recepción de donación. Sujeto a verificación de inventario.",
      7.5,
      "/F1",
      0,
    ),
  );
  ops.push(
    pdfText(pageWidth - margin - 75, margin, "Página 1 de 1", 7.5, "/F1", 0),
  );

  return ensamblarPdf([ops.join("\n")], pageWidth, pageHeight, logoData);
}
