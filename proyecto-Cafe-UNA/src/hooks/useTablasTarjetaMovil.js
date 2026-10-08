import { useEffect } from "react";

const FLECHAS_ORDEN = /[▲▼↕↑↓⇅]/g;

function textoEncabezado(th) {
  return (th.textContent || "").replace(FLECHAS_ORDEN, "").replace(/\s+/g, " ").trim();
}

function etiquetarTabla(tabla) {
  const encabezados = tabla.tHead?.rows;
  const filaEncabezado = encabezados?.[encabezados.length - 1];
  if (!filaEncabezado) return;

  const etiquetas = [];
  for (const th of filaEncabezado.cells) {
    const texto = textoEncabezado(th);
    for (let i = 0; i < (th.colSpan || 1); i += 1) etiquetas.push(texto);
  }

  tabla.classList.add("tabla-tarjetas");
  for (const cuerpo of tabla.tBodies) {
    for (const fila of cuerpo.rows) {
      const filaUnica = fila.cells.length === 1;
      let columna = 0;
      for (const celda of fila.cells) {
        const etiqueta = filaUnica ? "" : etiquetas[columna] || "";
        if (celda.getAttribute("data-label") !== etiqueta) celda.setAttribute("data-label", etiqueta);
        columna += celda.colSpan || 1;
      }
    }
  }
}

/**
 * Pone a cada celda el nombre de su columna (`data-label`) para que en celular
 * las tablas se vean como tarjetas (estilos `.tabla-tarjetas` en index.css).
 * Una tabla dentro de `[data-sin-tarjetas]` se queda como tabla.
 */
export function useTablasTarjetaMovil(ref) {
  useEffect(() => {
    const raiz = ref.current;
    if (!raiz) return undefined;

    let frame = 0;
    const etiquetar = () => {
      frame = 0;
      raiz.querySelectorAll("table").forEach((tabla) => {
        if (!tabla.closest("[data-sin-tarjetas]")) etiquetarTabla(tabla);
      });
    };
    const programar = () => {
      if (!frame) frame = requestAnimationFrame(etiquetar);
    };

    programar();
    const observador = new MutationObserver(programar);
    observador.observe(raiz, { childList: true, subtree: true, characterData: true });
    return () => {
      observador.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [ref]);
}
