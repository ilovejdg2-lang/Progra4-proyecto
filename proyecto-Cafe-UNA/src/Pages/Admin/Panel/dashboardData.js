import { obtenerComprasAdmin } from "../../../services/comprasService";

export async function obtenerComprasRango({ desde, hasta }) {
  const pageSize = 50;
  let page = 1;
  let acumulado = [];
  let totalPages = 1;
  do {
    const result = await obtenerComprasAdmin({
      page,
      pageSize,
      desde,
      hasta,
    });
    acumulado = acumulado.concat(result.data || []);
    totalPages = Number(result.totalPages) || 1;
    page += 1;
  } while (page <= totalPages && page <= 40);
  return acumulado;
}
