function etiquetaTipo(tipo) {
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

export function construirCsvMovimientos(rows) {
  const encabezados = [
    "Fecha y Hora",
    "Tipo de Movimiento",
    "Producto",
    "Cantidad",
    "Ubicación Origen",
    "Ubicación Destino",
    "Responsable",
    "Notas",
  ];
  const lineas = [encabezados.join(",")];
  for (const row of rows) {
    lineas.push(
      [
        csvEscape(row.fechaTexto),
        csvEscape(etiquetaTipo(row.tipo)),
        csvEscape(row.productoNombre),
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
    ? new Blob([Uint8Array.from(contenido, (ch) => ch.charCodeAt(0))], { type: mime })
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

function pdfLine(x, y, texto, size = 10, font = "F1") {
  return `BT /${font} ${size} Tf ${x} ${y} Td (${pdfEscape(texto)}) Tj ET`;
}

function pdfTrunc(texto, maxLen = 25) {
  const str = String(texto ?? "").trim();
  if (str.length <= maxLen) return str;
  return `${str.slice(0, maxLen - 2)}..`;
}

export function construirPdfMovimientos({
  filas,
  adminNombre,
  fechaGeneracion,
  filtrosTexto,
}) {
  const pageWidth = 842;
  const pageHeight = 595;
  const margin = 36;
  const tableWidth = pageWidth - margin * 2; // 770pt
  const rowHeight = 18;

  // Encabezados de tabla
  const colX = {
    fecha: 42,
    tipo: 175,
    producto: 275,
    cant: 445,
    origen: 495,
    destino: 600,
    resp: 705,
  };

  const headerTop = pageHeight - margin - 36; // 523
  const tableHeaderTop = headerTop - 55; // 468
  const contentStart = tableHeaderTop - 22; // 446
  const bottomMargin = 45;

  const rowsPerPage = Math.floor((contentStart - bottomMargin) / rowHeight); // ~22 filas por página

  const paginas = [];
  const chunks = [];
  for (let i = 0; i < filas.length; i += rowsPerPage) {
    chunks.push(filas.slice(i, i + rowsPerPage));
  }
  if (chunks.length === 0) chunks.push([]);

  chunks.forEach((chunk, pageIndex) => {
    const ops = [];

    // Header banner top bar (Sleek dark background box)
    ops.push("0.12 0.15 0.18 rg"); // dark slate fill
    ops.push(`36 ${pageHeight - margin - 32} ${tableWidth} 32 re f`);

    // Title in header bar
    ops.push("1 1 1 rg"); // White text
    ops.push(pdfLine(48, pageHeight - margin - 22, "CAFÉ-UNA — REPORTES DE INVENTARIO", 13, "F2"));

    // Subheader info block
    ops.push("0.2 0.2 0.25 rg"); // dark slate text
    ops.push(pdfLine(margin, headerTop - 5, `Historial de movimientos — Generado: ${fechaGeneracion}`, 10, "F2"));
    ops.push(pdfLine(margin, headerTop - 19, `Administrador: ${adminNombre || "—"}`, 9, "F1"));
    ops.push(pdfLine(margin, headerTop - 33, `Filtros aplicados: ${filtrosTexto || "ninguno"}`, 9, "F1"));

    // Table Header Background Box
    ops.push("0.93 0.94 0.96 rg"); // Light grey background
    ops.push(`36 ${tableHeaderTop - 4} ${tableWidth} 18 re f`);
    ops.push("0.8 0.82 0.85 RG 0.7 w");
    ops.push(`36 ${tableHeaderTop - 4} m ${36 + tableWidth} ${tableHeaderTop - 4} l S`);

    // Table Header Labels
    ops.push("0.2 0.25 0.3 rg");
    ops.push(pdfLine(colX.fecha, tableHeaderTop, "Fecha y Hora", 9, "F2"));
    ops.push(pdfLine(colX.tipo, tableHeaderTop, "Tipo Movimiento", 9, "F2"));
    ops.push(pdfLine(colX.producto, tableHeaderTop, "Producto", 9, "F2"));
    ops.push(pdfLine(colX.cant, tableHeaderTop, "Cant.", 9, "F2"));
    ops.push(pdfLine(colX.origen, tableHeaderTop, "Origen", 9, "F2"));
    ops.push(pdfLine(colX.destino, tableHeaderTop, "Destino", 9, "F2"));
    ops.push(pdfLine(colX.resp, tableHeaderTop, "Responsable", 9, "F2"));

    // Rows
    chunk.forEach((row, idx) => {
      const y = contentStart - rowHeight * idx;

      // Alternating row background
      if (idx % 2 === 1) {
        ops.push("0.97 0.98 0.99 rg");
        ops.push(`36 ${y - 4} ${tableWidth} ${rowHeight} re f`);
      }

      // Bottom border for row
      ops.push("0.90 0.91 0.93 RG 0.5 w");
      ops.push(`36 ${y - 4} m ${36 + tableWidth} ${y - 4} l S`);

      // Text cells
      ops.push("0.15 0.15 0.2 rg");
      ops.push(pdfLine(colX.fecha, y, pdfTrunc(row.fechaTexto, 24), 8, "F1"));
      ops.push(pdfLine(colX.tipo, y, pdfTrunc(etiquetaTipo(row.tipo), 18), 8, "F2"));
      ops.push(pdfLine(colX.producto, y, pdfTrunc(row.productoNombre || row.productoId, 28), 8, "F1"));
      ops.push(pdfLine(colX.cant, y, String(row.cantidad), 8, "F2"));
      ops.push(pdfLine(colX.origen, y, pdfTrunc(row.origenNombre || "—", 18), 8, "F1"));
      ops.push(pdfLine(colX.destino, y, pdfTrunc(row.destinoNombre || "—", 18), 8, "F1"));
      ops.push(pdfLine(colX.resp, y, pdfTrunc(row.responsableNombre || "—", 18), 8, "F1"));
    });

    // Footer
    ops.push("0.5 0.5 0.55 rg");
    ops.push(pdfLine(margin, margin - 10, "Café-UNA — Registro Inmutable de Movimientos de Inventario", 8, "F1"));
    ops.push(
      pdfLine(
        pageWidth - margin - 80,
        margin - 10,
        `Página ${pageIndex + 1} de ${chunks.length}`,
        8,
        "F2",
      ),
    );

    paginas.push(ops.join("\n"));
  });

  const objects = [];
  objects.push("1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj");

  const kids = paginas.map((_, i) => `${3 + i * 2} 0 R`).join(" ");
  objects.push(
    `2 0 obj << /Type /Pages /Count ${paginas.length} /Kids [${kids}] >> endobj`,
  );

  const fontF1Num = 3 + paginas.length * 2;
  const fontF2Num = fontF1Num + 1;

  paginas.forEach((content, i) => {
    const pageNum = 3 + i * 2;
    const contentNum = pageNum + 1;
    objects.push(
      `${pageNum} 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontF1Num} 0 R /F2 ${fontF2Num} 0 R >> >> /Contents ${contentNum} 0 R >> endobj`,
    );
    objects.push(
      `${contentNum} 0 obj << /Length ${content.length} >> stream\n${content}\nendstream endobj`,
    );
  });

  // Fonts with WinAnsiEncoding for correct Spanish accents
  objects.push(
    `${fontF1Num} 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >> endobj`,
  );
  objects.push(
    `${fontF2Num} 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >> endobj`,
  );

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

export { etiquetaTipo };
