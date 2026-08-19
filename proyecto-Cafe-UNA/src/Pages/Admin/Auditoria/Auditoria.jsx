import { useEffect, useMemo, useState } from "react";
import { RefreshCw, ScrollText } from "lucide-react";

import { AdminLayout } from "../layouts/AdminLayout";
import { AdminPageGate } from "../../../Components/AdminPageGate/AdminPageGate";
import { AdminListaToolbar, AdminListaVacia } from "../../../Components/Admin/ui/AdminListaToolbar";
import { useAdminPageGate } from "../../../hooks/useAdminPageGate";
import { useAdminListaFiltros } from "../../../hooks/useAdminListaFiltros";
import { obtenerAuditoria } from "../../../services/auditoriaService";
import { tienePermiso, rolesDeUsuario } from "../../../lib/permisos";
import { getActiveSessionUser } from "../../../services/sessionService";

const ETIQUETAS_TABLA = {
  usuarios: "Usuarios",
  productos: "Productos",
  hero_principal: "P\u00e1gina principal",
  textos_institucionales: "Textos institucionales",
  tarjetas_inicio: "Tarjetas de inicio",
  informacion_navbar: "Navbar",
  informacion_footer: "Footer",
  galeria_institucional: "Galer\u00eda",
  enlaces_sitio: "Enlaces del sitio",
  solicitudes_voluntariado: "Voluntariado",
  Pedido: "Ventas",
};

const ETIQUETAS_ACCION = {
  INSERT: "Creaci\u00f3n",
  UPDATE: "Actualizaci\u00f3n",
  DELETE: "Eliminaci\u00f3n",
};

function mapRegistro(registro) {
  return {
    id: registro?.id ?? registro?.Id ?? null,
    accion: registro?.accion ?? registro?.Accion ?? "",
    tabla: registro?.tabla ?? registro?.Tabla ?? "",
    idRegistro: registro?.idRegistro ?? registro?.IdRegistro ?? "",
    detalle: registro?.detalle ?? registro?.Detalle ?? "",
    fecha: registro?.fecha ?? registro?.Fecha ?? null,
    usuario:
      registro?.usuario?.nombre ??
      registro?.usuario?.Nombre ??
      registro?.Usuario?.Nombre ??
      "",
  };
}

function formatearFecha(fecha) {
  if (!fecha) return "Sin fecha";
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return String(fecha);
  return valor.toLocaleString("es-CR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function BadgeAccion({ accion }) {
  const estilos = {
    INSERT: "border-emerald-200 bg-emerald-50 text-emerald-700",
    UPDATE: "border-blue-200 bg-blue-50 text-blue-700",
    DELETE: "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
        estilos[accion] ?? "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      {ETIQUETAS_ACCION[accion] ?? accion}
    </span>
  );
}

function AdminAuditoria() {
  const user = getActiveSessionUser();
  const roles = rolesDeUsuario(user);
  const puedeVer = tienePermiso(roles, "ver_auditoria");

  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [refrescando, setRefrescando] = useState(false);

  const { showLoading, loadingMessage } = useAdminPageGate("/admin/auditoria", !cargando);

  const {
    busqueda,
    setBusqueda,
    filtrados: registrosFiltrados,
    limpiar,
    hayFiltrosActivos,
    total,
    visibles,
  } = useAdminListaFiltros(registros, {
    buscarEn: (item) => [
      item.accion,
      ETIQUETAS_ACCION[item.accion],
      item.tabla,
      ETIQUETAS_TABLA[item.tabla],
      item.detalle,
      item.usuario,
      formatearFecha(item.fecha),
    ],
  });

  useEffect(() => {
    if (!puedeVer) {
      setCargando(false);
      return undefined;
    }

    let activo = true;
    setCargando(true);
    setError("");

    obtenerAuditoria()
      .then((data) => {
        if (!activo) return;
        setRegistros(Array.isArray(data) ? data.map(mapRegistro) : []);
      })
      .catch((err) => {
        if (!activo) return;
        setError(err?.message || "No se pudo cargar la auditor\u00eda.");
        setRegistros([]);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [puedeVer]);

  const resumen = useMemo(() => {
    const total = registros.length;
    const modulos = new Set(registros.map((item) => item.tabla)).size;
    return { total, modulos };
  }, [registros]);

  const recargar = async () => {
    setRefrescando(true);
    setError("");
    try {
      const data = await obtenerAuditoria({ force: true });
      setRegistros(Array.isArray(data) ? data.map(mapRegistro) : []);
    } catch (err) {
      setError(err?.message || "No se pudo actualizar la auditor\u00eda.");
    } finally {
      setRefrescando(false);
    }
  };

  if (!puedeVer) {
    return (
      <AdminLayout>
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h1 className="text-xl font-semibold text-slate-900">{"Auditor\u00eda"}</h1>
          <p className="mt-2 text-sm text-slate-600">{"No tienes permiso para ver esta secci\u00f3n."}</p>
        </section>
      </AdminLayout>
    );
  }

  return (
    <AdminPageGate showLoading={showLoading} message={loadingMessage}>
      <AdminLayout>
        <section className="rounded-xl border border-slate-200 bg-white p-4 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{"Auditor\u00eda"}</h1>
              <p className="mt-1 text-sm text-slate-600">
                Registro de acciones importantes realizadas por administradores, superadministradores y vendedores.
              </p>
            </div>
            <button
              type="button"
              onClick={recargar}
              disabled={refrescando || cargando}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw className={`size-4 ${refrescando ? "animate-spin" : ""}`} />
              Actualizar
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Registros</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{resumen.total}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{"M\u00f3dulos auditados"}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{resumen.modulos}</p>
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {cargando ? (
            <p className="mt-6 text-sm text-slate-500">{"Cargando auditor\u00eda..."}</p>
          ) : registros.length === 0 ? (
            <div className="mt-6 flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 px-6 py-12 text-center">
              <ScrollText className="size-10 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-700">{"No hay registros de auditor\u00eda todav\u00eda."}</p>
              <p className="mt-1 text-sm text-slate-500">{"Aqu\u00ed aparecer\u00e1n cambios importantes en usuarios, productos, contenido y voluntariado."}</p>
            </div>
          ) : (
            <>
              <AdminListaToolbar
                busqueda={busqueda}
                onBusquedaChange={setBusqueda}
                placeholder={"Buscar por acci\u00f3n, m\u00f3dulo, detalle o usuario..."}
                total={total}
                visibles={visibles}
                hayFiltrosActivos={hayFiltrosActivos}
                onLimpiar={limpiar}
              />

              {registrosFiltrados.length === 0 ? (
                <div className="mt-4">
                  <AdminListaVacia onLimpiar={limpiar} />
                </div>
              ) : (
            <>
              <div className="mt-6 hidden overflow-x-auto md:block">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Fecha</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">{"Acci\u00f3n"}</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">{"M\u00f3dulo"}</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Detalle</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Usuario</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {registrosFiltrados.map((item) => (
                      <tr key={item.id ?? `${item.tabla}-${item.idRegistro}-${item.fecha}`}>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                          {formatearFecha(item.fecha)}
                        </td>
                        <td className="px-4 py-3">
                          <BadgeAccion accion={item.accion} />
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {ETIQUETAS_TABLA[item.tabla] ?? item.tabla}
                        </td>
                        <td className="max-w-md px-4 py-3 text-slate-700">{item.detalle || "—"}</td>
                        <td className="px-4 py-3 text-slate-500">{item.usuario || "Sistema"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 grid gap-3 md:hidden">
                {registrosFiltrados.map((item) => (
                  <article
                    key={item.id ?? `${item.tabla}-${item.idRegistro}-${item.fecha}`}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-slate-500">{formatearFecha(item.fecha)}</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {ETIQUETAS_TABLA[item.tabla] ?? item.tabla}
                        </p>
                      </div>
                      <BadgeAccion accion={item.accion} />
                    </div>
                    <p className="mt-3 text-sm text-slate-700">{item.detalle || "—"}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      Usuario: {item.usuario || "Sistema"}
                    </p>
                  </article>
                ))}
              </div>
            </>
              )}
            </>
          )}
        </section>
      </AdminLayout>
    </AdminPageGate>
  );
}

export default AdminAuditoria;
