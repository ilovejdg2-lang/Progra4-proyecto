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
    "Fecha",
    "Tipo de movimiento",
    "Producto",
    "Cantidad",
    "Origen",
    "Destino",
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

function pdfLine(x, y, texto, size = 10) {
  return `BT /F1 ${size} Tf ${x} ${y} Td (${pdfEscape(texto)}) Tj ET`;
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
  const lineHeight = 14;
  const headerY = pageHeight - margin;
  const contentStart = headerY - 72;
  const rowsPerPage = Math.floor((contentStart - margin) / lineHeight) - 1;

  const paginas = [];
  const chunks = [];
  for (let i = 0; i < filas.length; i += rowsPerPage) {
    chunks.push(filas.slice(i, i + rowsPerPage));
  }
  if (chunks.length === 0) chunks.push([]);

  chunks.forEach((chunk, pageIndex) => {
    const ops = [
      pdfLine(margin, headerY, "Café-UNA", 16),
      pdfLine(margin, headerY - 18, `Historial de movimientos — generado: ${fechaGeneracion}`, 10),
      pdfLine(margin, headerY - 32, `Administrador: ${adminNombre || "—"}`, 10),
      pdfLine(margin, headerY - 46, `Filtros: ${filtrosTexto || "ninguno"}`, 10),
      pdfLine(
        margin,
        contentStart,
        "Fecha | Tipo | Producto | Cant. | Origen | Destino | Responsable",
        9,
      ),
    ];
    chunk.forEach((row, idx) => {
      const y = contentStart - lineHeight * (idx + 1);
      const linea = [
        row.fechaTexto,
        etiquetaTipo(row.tipo),
        row.productoNombre,
        String(row.cantidad),
        row.origenNombre || "—",
        row.destinoNombre || "—",
        row.responsableNombre || "—",
      ]
        .map((parte) => String(parte).slice(0, 28))
        .join(" | ");
      ops.push(pdfLine(margin, y, linea, 8));
    });
    ops.push(
      pdfLine(
        pageWidth - 120,
        margin - 8,
        `Página ${pageIndex + 1} de ${chunks.length}`,
        8,
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

  const fontObjNum = 3 + paginas.length * 2;
  paginas.forEach((content, i) => {
    const pageNum = 3 + i * 2;
    const contentNum = pageNum + 1;
    objects.push(
      `${pageNum} 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontObjNum} 0 R >> >> /Contents ${contentNum} 0 R >> endobj`,
    );
    objects.push(
      `${contentNum} 0 obj << /Length ${content.length} >> stream\n${content}\nendstream endobj`,
    );
  });
  objects.push(
    `${fontObjNum} 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj`,
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
