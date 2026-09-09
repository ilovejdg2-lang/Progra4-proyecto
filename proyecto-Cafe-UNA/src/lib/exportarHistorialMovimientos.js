import {
  LOGO_ASPECT_RATIO,
  LOGO_CAFE_UNA_JPEG_BASE64,
  LOGO_HEIGHT_PX,
  LOGO_WIDTH_PX,
} from "./logoCafeUnaBase64";

export function etiquetaTipo(tipo) {
  if (tipo === "entrada") return "Entrada";
  if (tipo === "transferencia") return "Transferencia";
  if (tipo === "venta_presencial") return "Venta presencial";
  if (tipo === "venta_web") return "Venta web";
  return tipo || "";
}

function csvEscape(valor) {
  const texto = String(valor ?? "");
  if (/[",\n\r]/.test(texto)) return `"${texto.replace(/"/g, '""')}"`;
  return texto;
}

export function construirCsvMovimientos(rows = []) {
  const encabezados = [
    "FECHA",
    "TIPO DE MOVIMIENTO",
    "PRODUCTO",
    "CANTIDAD",
    "ORIGEN",
    "DESTINO",
    "RESPONSABLE",
    "NOTAS",
  ];
  const lineas = [encabezados.join(",")];
  for (const row of rows) {
    lineas.push(
      [
        csvEscape(row.fechaTexto || row.fecha),
        csvEscape(etiquetaTipo(row.tipo)),
        csvEscape(row.productoNombre || row.productoId),
        csvEscape(row.cantidad),
        csvEscape(row.origenNombre || "—"),
        csvEscape(row.destinoNombre || "—"),
        csvEscape(row.responsableNombre || "—"),
        csvEscape(row.notas || ""),
      ].join(","),
    );
  }
  return `\uFEFF${lineas.join("\r\n")}`;
}

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

function pdfText(x, y, texto, size = 10, font = "/F1", gray = 0) {
  return `q ${gray} g BT ${font} ${size} Tf ${x} ${y} Td (${pdfEscape(texto)}) Tj ET Q`;
}

function pdfLineStroke(x1, y1, x2, y2, gray = 0.6, width = 0.5) {
  return `q ${gray} G ${width} w ${x1} ${y1} m ${x2} ${y2} l S Q`;
}

function pdfRectFill(x, y, w, h, gray = 0.92) {
  return `q ${gray} g ${x} ${y} ${w} ${h} re f Q`;
}

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

  const logoObjNum = logoData?.binary ? 5 : null;
  const firstPageNum = logoData?.binary ? 6 : 5;

  const kids = paginas.map((_, i) => `${firstPageNum + i * 2} 0 R`).join(" ");
  objects.push(
    `2 0 obj << /Type /Pages /Count ${paginas.length} /Kids [${kids}] >> endobj`,
  );

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
    const xObjectRes = logoData?.binary ? `/XObject << /ImLogo ${logoObjNum} 0 R >>` : "";
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

export function construirPdfMovimientos({
  filas = [],
  adminNombre = "",
  fechaGeneracion = "",
  filtrosTexto = "",
  logoData = obtenerLogoDefault(),
}) {
  const pageWidth = 842;
  const pageHeight = 595;
  const margin = 36;
  const lineHeight = 16;
  const headerY = pageHeight - margin;
  const contentStart = headerY - 68;
  const rowsPerPage = Math.floor((contentStart - margin - 22) / lineHeight);

  const chunks = [];
  for (let i = 0; i < filas.length; i += rowsPerPage) {
    chunks.push(filas.slice(i, i + rowsPerPage));
  }
  if (chunks.length === 0) chunks.push([]);

  // Usable width: 842 - 72 = 770 pt
  const colX = {
    fecha: margin + 4,          // 40
    tipo: margin + 115,         // 151
    producto: margin + 225,     // 261
    cantidad: margin + 415,     // 451
    origen: margin + 475,       // 511
    destino: margin + 575,      // 611
    responsable: margin + 675,  // 711
  };

  const paginas = [];

  chunks.forEach((chunk, pageIndex) => {
    const ops = [];

    // Header institucional con logo oficial
    if (logoData && logoData.binary) {
      const logoH = 34;
      const logoW = Math.round(logoH * (logoData.aspectRatio || 1.95));
      const logoX = margin;
      const logoY = headerY - logoH + 4;
      ops.push(`q ${logoW} 0 0 ${logoH} ${logoX} ${logoY} cm /ImLogo Do Q`);

      ops.push(
        pdfText(
          margin + logoW + 18,
          headerY - 4,
          "Reporte Administrativo de Movimientos de Inventario",
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
          0.15,
        ),
      );
      ops.push(
        pdfText(
          margin + logoW + 18,
          headerY - 30,
          `Filtros aplicados: ${filtrosTexto || "Ninguno (todos los registros)"}`,
          9,
          "/F1",
          0.25,
        ),
      );
    } else {
      ops.push(pdfText(margin, headerY, "Café-UNA", 16, "/F2", 0));
      ops.push(
        pdfText(
          margin,
          headerY - 18,
          "Reporte Administrativo de Movimientos de Inventario",
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
          0.15,
        ),
      );
      ops.push(
        pdfText(
          margin,
          headerY - 45,
          `Filtros aplicados: ${filtrosTexto || "Ninguno (todos los registros)"}`,
          9,
          "/F1",
          0.25,
        ),
      );
    }

    // Línea divisoria cabecera
    ops.push(pdfLineStroke(margin, headerY - 44, pageWidth - margin, headerY - 44, 0.65, 1));

    // Cabecera oscura de la tabla
    const tableHeaderY = contentStart;
    ops.push(pdfRectFill(margin, tableHeaderY - 4, pageWidth - 2 * margin, 18, 0.18));
    ops.push(pdfText(colX.fecha, tableHeaderY, "FECHA", 8.5, "/F2", 1));
    ops.push(pdfText(colX.tipo, tableHeaderY, "TIPO DE MOVIMIENTO", 8.5, "/F2", 1));
    ops.push(pdfText(colX.producto, tableHeaderY, "PRODUCTO", 8.5, "/F2", 1));
    ops.push(pdfText(colX.cantidad, tableHeaderY, "CANTIDAD", 8.5, "/F2", 1));
    ops.push(pdfText(colX.origen, tableHeaderY, "ORIGEN", 8.5, "/F2", 1));
    ops.push(pdfText(colX.destino, tableHeaderY, "DESTINO", 8.5, "/F2", 1));
    ops.push(pdfText(colX.responsable, tableHeaderY, "RESPONSABLE", 8.5, "/F2", 1));

    // Filas de datos
    chunk.forEach((row, idx) => {
      const y = tableHeaderY - 17 - idx * lineHeight;
      if (idx % 2 === 1) {
        ops.push(pdfRectFill(margin, y - 4, pageWidth - 2 * margin, lineHeight, 0.96));
      }

      ops.push(pdfText(colX.fecha, y, String(row.fechaTexto || row.fecha || "—").slice(0, 22), 8, "/F1", 0.15));
      ops.push(pdfText(colX.tipo, y, String(etiquetaTipo(row.tipo)).slice(0, 20), 8, "/F2", 0));
      ops.push(pdfText(colX.producto, y, String(row.productoNombre || row.productoId || "—").slice(0, 32), 8, "/F1", 0));
      ops.push(pdfText(colX.cantidad, y, String(row.cantidad ?? "0"), 8, "/F2", 0));
      ops.push(pdfText(colX.origen, y, String(row.origenNombre || "—").slice(0, 18), 8, "/F1", 0.25));
      ops.push(pdfText(colX.destino, y, String(row.destinoNombre || "—").slice(0, 18), 8, "/F1", 0.25));
      ops.push(pdfText(colX.responsable, y, String(row.responsableNombre || "—").slice(0, 18), 8, "/F1", 0.2));

      ops.push(pdfLineStroke(margin, y - 5, pageWidth - margin, y - 5, 0.88, 0.3));
    });

    if (chunk.length === 0) {
      ops.push(
        pdfText(
          margin + 20,
          tableHeaderY - 26,
          "No se encontraron movimientos registrados para los criterios seleccionados.",
          9.5,
          "/F1",
          0.3,
        ),
      );
    }

    // Pie de página con numeración
    ops.push(pdfLineStroke(margin, margin + 12, pageWidth - margin, margin + 12, 0.6, 0.5));
    ops.push(
      pdfText(
        margin,
        margin,
        "Café-UNA · Documento confidencial para uso administrativo y control de inventario.",
        8,
        "/F1",
        0.3,
      ),
    );
    ops.push(
      pdfText(
        pageWidth - margin - 80,
        margin,
        `Página ${pageIndex + 1} de ${chunks.length}`,
        8,
        "/F2",
        0.2,
      ),
    );

    paginas.push(ops.join("\n"));
  });

  return ensamblarPdf(paginas, pageWidth, pageHeight, logoData);
}


