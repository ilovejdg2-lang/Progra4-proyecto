import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ClipboardList,
  FileBarChart,
  Package,
  ScrollText,
  ShoppingBag,
  Store,
  Users,
  Wallet,
} from "lucide-react";

import { AdminLayout } from "../layouts/AdminLayout";
import { AdminPageGate } from "../../../Components/AdminPageGate/AdminPageGate";
import { useAdminPageGate } from "../../../hooks/useAdminPageGate";
import { getActiveSessionUser } from "../../../services/sessionService";
import { obtenerAlertasStock, obtenerProductos } from "../../../services/productosService";
import { obtenerUsuarios } from "../../../services/usuariosService";
import { obtenerAuditoria } from "../../../services/auditoriaService";
import { tienePermiso, rolesDeUsuario } from "../../../lib/permisos";
import { imagenPrincipalProducto } from "../../../lib/productoImagenes";
import { useTraducir } from "../../../hooks/useTraducir";
import { DashboardHeader } from "./components/DashboardHeader";
import { DashboardStatCard } from "./components/DashboardStatCard";
import { MonthlyRevenueChart } from "./components/MonthlyRevenueChart";
import { UserStatusChart } from "./components/UserStatusChart";
import { QuickAccess } from "./components/QuickAccess";
import { StockAlerts } from "./components/StockAlerts";
import { RecentActivity } from "./components/RecentActivity";
import { DashboardCalendar } from "./components/DashboardCalendar";
import {
  agruparIngresosPorDia,
  deltaPorcentaje,
  esUsuarioActivo,
  formatCRC,
  inicioFinMes,
  PUNTOS_INGRESOS,
  sumarIngresos,
  ymdLocal,
} from "./dashboardUtils";
import { obtenerComprasRango } from "./dashboardData";
import "./Panel.css";

function mesInputDeFecha(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

const AdminPanel = () => {
  const user = getActiveSessionUser();
  const roles = rolesDeUsuario(user);
  const { showLoading, loadingMessage } = useAdminPageGate("/admin", true);

  const puedeVerAlertas = tienePermiso(roles, "ver_inventario");
  const puedeVentas =
    tienePermiso(roles, "ver_ventas") ||
    tienePermiso(roles, "ver_historial_compras_clientes");
  const puedeProductos =
    tienePermiso(roles, "ver_productos") || tienePermiso(roles, "ver_inventario");
  const puedeUsuarios =
    tienePermiso(roles, "editar_usuarios") || tienePermiso(roles, "crear_usuarios");
  const puedeAuditoria = tienePermiso(roles, "ver_auditoria");
  const puedePuntosVenta =
    tienePermiso(roles, "ver_inventario") || tienePermiso(roles, "actualizar_inventario");
  const puedeAjustes = tienePermiso(roles, "administrar_roles_permisos");
  const puedeVoluntariado =
    tienePermiso(roles, "ver_solicitudes_voluntariado") ||
    tienePermiso(roles, "administrar_solicitudes_voluntariado");
  const puedeVisitas = tienePermiso(roles, "administrar_solicitudes_visitantes");
  const puedeDonaciones =
    tienePermiso(roles, "administrar_solicitudes_donaciones") ||
    tienePermiso(roles, "ver_solicitudes_donacion");
  const puedeMovimientos = tienePermiso(roles, "ver_inventario");

  const tPanel = useTraducir("Panel Administrativo");
  const tReponer = useTraducir("Reponer stock");
  const nombreUsuario = user?.name || user?.username || user?.nombre || "";
  const tBienvenido = useTraducir(`¡Bienvenido, ${nombreUsuario}!`);

  const hoy = useMemo(() => new Date(), []);
  const [mesValor, setMesValor] = useState(() => mesInputDeFecha(new Date()));
  const [filtroPunto, setFiltroPunto] = useState("general");

  const [compras, setCompras] = useState([]);
  const [comprasAnterior, setComprasAnterior] = useState([]);
  const [cargandoVentas, setCargandoVentas] = useState(puedeVentas);
  const [errorVentas, setErrorVentas] = useState("");

  const [usuarios, setUsuarios] = useState([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(puedeUsuarios);

  const [alertas, setAlertas] = useState([]);
  const [cargandoAlertas, setCargandoAlertas] = useState(puedeVerAlertas);
  const [errorAlertas, setErrorAlertas] = useState("");

  const [actividad, setActividad] = useState([]);
  const [cargandoActividad, setCargandoActividad] = useState(puedeAuditoria);

  const year = Number(mesValor.slice(0, 4));
  const monthIndex = Number(mesValor.slice(5, 7)) - 1;
  const codigoFiltro = PUNTOS_INGRESOS.find((p) => p.id === filtroPunto)?.codigo ?? null;

  useEffect(() => {
    if (!puedeVentas || !Number.isFinite(year) || monthIndex < 0) {
      setCargandoVentas(false);
      return undefined;
    }
    let activo = true;
    const actual = inicioFinMes(year, monthIndex);
    const prev = inicioFinMes(monthIndex === 0 ? year - 1 : year, monthIndex === 0 ? 11 : monthIndex - 1);
    setCargandoVentas(true);
    Promise.all([
      obtenerComprasRango({ desde: actual.desde, hasta: actual.hasta }),
      obtenerComprasRango({ desde: prev.desde, hasta: prev.hasta }),
    ])
      .then(([mes, anterior]) => {
        if (!activo) return;
        setCompras(mes);
        setComprasAnterior(anterior);
        setErrorVentas("");
      })
      .catch((err) => {
        if (!activo) return;
        setCompras([]);
        setComprasAnterior([]);
        setErrorVentas(err?.message || "No se pudieron cargar las ventas.");
      })
      .finally(() => {
        if (activo) setCargandoVentas(false);
      });
    return () => {
      activo = false;
    };
  }, [puedeVentas, year, monthIndex]);

  useEffect(() => {
    if (!puedeUsuarios) {
      setCargandoUsuarios(false);
      return undefined;
    }
    let activo = true;
    obtenerUsuarios()
      .then((data) => {
        if (!activo) return;
        setUsuarios(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!activo) return;
        setUsuarios([]);
      })
      .finally(() => {
        if (activo) setCargandoUsuarios(false);
      });
    return () => {
      activo = false;
    };
  }, [puedeUsuarios]);

  useEffect(() => {
    if (!puedeVerAlertas) {
      setCargandoAlertas(false);
      return undefined;
    }
    let activo = true;
    Promise.all([
      obtenerAlertasStock(),
      puedeProductos ? obtenerProductos().catch(() => []) : Promise.resolve([]),
    ])
      .then(([lista, productos]) => {
        if (!activo) return;
        const porId = new Map(
          (Array.isArray(productos) ? productos : []).map((p) => [String(p.id), p]),
        );
        setAlertas(
          (Array.isArray(lista) ? lista : []).map((item) => ({
            ...item,
            imagen: imagenPrincipalProducto(porId.get(String(item.id)) || {}),
          })),
        );
        setErrorAlertas("");
      })
      .catch((err) => {
        if (!activo) return;
        setAlertas([]);
        setErrorAlertas(err?.message || "No se pudieron cargar las alertas de stock.");
      })
      .finally(() => {
        if (activo) setCargandoAlertas(false);
      });
    return () => {
      activo = false;
    };
  }, [puedeVerAlertas, puedeProductos]);

  useEffect(() => {
    if (!puedeAuditoria) {
      setCargandoActividad(false);
      return undefined;
    }
    let activo = true;
    obtenerAuditoria({ limit: 8 })
      .then((data) => {
        if (!activo) return;
        const filas = (Array.isArray(data) ? data : []).map((registro, index) => ({
          id: registro?.id ?? registro?.Id ?? `${registro?.fecha || registro?.Fecha || "a"}-${index}`,
          accion: registro?.accion ?? registro?.Accion ?? "",
          tabla: registro?.tabla ?? registro?.Tabla ?? "",
          detalle: registro?.detalle ?? registro?.Detalle ?? "",
          fecha: registro?.fecha ?? registro?.Fecha ?? null,
          usuario:
            registro?.usuario?.nombre ??
            registro?.usuario?.Nombre ??
            registro?.Usuario?.Nombre ??
            "",
        }));
        setActividad(filas);
      })
      .catch(() => {
        if (!activo) return;
        setActividad([]);
      })
      .finally(() => {
        if (activo) setCargandoActividad(false);
      });
    return () => {
      activo = false;
    };
  }, [puedeAuditoria]);

  const { porDia, pico } = useMemo(
    () => agruparIngresosPorDia(compras, year, monthIndex, codigoFiltro),
    [compras, year, monthIndex, codigoFiltro],
  );
  const hayIngresosMes = porDia.some((d) => d.total > 0);

  const ingresosMes = useMemo(
    () => sumarIngresos(compras, { codigo: null }),
    [compras],
  );
  const ingresosMesAnterior = useMemo(
    () => sumarIngresos(comprasAnterior, { codigo: null }),
    [comprasAnterior],
  );
  const hoyYmd = ymdLocal(hoy);
  const ventasHoy = useMemo(
    () => sumarIngresos(compras, { desdeYmd: hoyYmd, hastaYmd: hoyYmd }),
    [compras, hoyYmd],
  );
  const ventasAyer = useMemo(() => {
    const esMismoMes = hoy.getFullYear() === year && hoy.getMonth() === monthIndex;
    if (!esMismoMes) return { total: 0, transacciones: 0 };
    const previa = new Date(hoy);
    previa.setDate(hoy.getDate() - 1);
    return sumarIngresos(compras, { desdeYmd: ymdLocal(previa), hastaYmd: ymdLocal(previa) });
  }, [compras, hoy, year, monthIndex]);

  const deltaIngresos = deltaPorcentaje(ingresosMes.total, ingresosMesAnterior.total);
  const deltaVentasDia = deltaPorcentaje(ventasHoy.total, ventasAyer.total);

  const totalUsuarios = usuarios.length;
  const usuariosActivos = usuarios.filter(esUsuarioActivo).length;
  const usuariosInactivos = Math.max(0, totalUsuarios - usuariosActivos);

  const fechaEtiqueta = hoy.toLocaleDateString("es-CR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const picoEtiqueta = pico
    ? new Date(year, monthIndex, pico.dia).toLocaleDateString("es-CR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  const accesos = [];
  if (puedeUsuarios) accesos.push({ to: "/admin/usuarios", label: "Usuarios", Icon: Users });
  if (puedePuntosVenta) accesos.push({ to: "/admin/puntos-venta", label: "Puntos de venta", Icon: Store });
  if (puedeVerAlertas) accesos.push({ to: "/admin/distribucion", label: "Inventario", Icon: Package });
  if (puedeProductos) accesos.push({ to: "/admin/producto", label: "Productos", Icon: ShoppingBag });
  if (puedeVentas) accesos.push({ to: "/admin/historial-ventas", label: "Ventas", Icon: Wallet });
  if (puedeMovimientos || puedeVentas) {
    accesos.push({
      to: puedeMovimientos ? "/admin/historial-movimientos" : "/admin/historial-ventas",
      label: "Reportes",
      Icon: FileBarChart,
    });
  }
  if (puedeAuditoria) accesos.push({ to: "/admin/auditoria", label: "Auditoría", Icon: ScrollText });
  if (puedeVoluntariado) accesos.push({ to: "/admin/voluntariado", label: "Formularios", Icon: ClipboardList });
  else if (puedeVisitas) accesos.push({ to: "/admin/visitas", label: "Formularios", Icon: ClipboardList });
  else if (puedeDonaciones) {
    accesos.push({ to: "/admin/donaciones/solicitudes", label: "Formularios", Icon: ClipboardList });
  }

  const mesEnCurso = hoy.getFullYear() === year && hoy.getMonth() === monthIndex;

  return (
    <AdminPageGate showLoading={showLoading} message={loadingMessage}>
      <AdminLayout>
        <div className="admin-dashboard">
          <DashboardHeader
            titulo={tPanel}
            saludo={nombreUsuario ? tBienvenido : null}
            descripcion="Aquí puedes monitorear la actividad de Café UNA y gestionar la aplicación."
            fechaEtiqueta={fechaEtiqueta}
            saludoDia="Que tengas un gran día."
          />

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {puedeUsuarios ? (
              <DashboardStatCard
                icon={Users}
                label="Total de usuarios"
                value={cargandoUsuarios ? "—" : String(totalUsuarios)}
                hint="Registrados en el sistema"
                loading={cargandoUsuarios}
                accent="wine"
              />
            ) : null}
            {puedeUsuarios ? (
              <DashboardStatCard
                icon={Users}
                label="Usuarios activos"
                value={cargandoUsuarios ? "—" : String(usuariosActivos)}
                hint="Con estado activo"
                loading={cargandoUsuarios}
                accent="green"
              />
            ) : null}
            {puedeVentas ? (
              <DashboardStatCard
                icon={Wallet}
                label="Ingresos del mes"
                value={cargandoVentas ? "—" : formatCRC(ingresosMes.total)}
                hint="Suma de los 3 puntos de venta"
                delta={deltaIngresos}
                loading={cargandoVentas}
                accent="wine"
              />
            ) : null}
            {puedeVentas ? (
              <DashboardStatCard
                icon={ShoppingBag}
                label="Ventas del día"
                value={cargandoVentas ? "—" : formatCRC(mesEnCurso ? ventasHoy.total : 0)}
                hint={
                  mesEnCurso
                    ? `${ventasHoy.transacciones} transacciones`
                    : "Cambia al mes actual para ver el día de hoy"
                }
                delta={mesEnCurso ? deltaVentasDia : null}
                loading={cargandoVentas}
                accent="slate"
              />
            ) : null}
            {puedeVerAlertas ? (
              <DashboardStatCard
                icon={AlertTriangle}
                label="Alertas de stock"
                value={cargandoAlertas ? "—" : String(alertas.length)}
                hint="Productos bajo mínimo"
                loading={cargandoAlertas}
                accent="amber"
              />
            ) : null}
          </div>
          {errorVentas ? (
            <p className="mt-2 text-sm text-rose-600">{errorVentas}</p>
          ) : null}

          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(18rem,0.9fr)]">
            {puedeVentas ? (
              <MonthlyRevenueChart
                titulo="Ingresos mensuales generales"
                subtitulo="Suma de los 3 puntos de venta (FUNDA-UNA, Bodega Central y Editorial)."
                mesValor={mesValor}
                onMesChange={setMesValor}
                filtro={filtroPunto}
                onFiltroChange={setFiltroPunto}
                series={porDia}
                pico={pico}
                picoEtiqueta={picoEtiqueta}
                loading={cargandoVentas}
                vacio={!cargandoVentas && !hayIngresosMes}
              />
            ) : null}
            <div className="grid gap-4">
              {puedeUsuarios ? (
                <UserStatusChart
                  total={totalUsuarios}
                  activos={usuariosActivos}
                  inactivos={usuariosInactivos}
                  loading={cargandoUsuarios}
                  puedeVerTodos={puedeUsuarios}
                />
              ) : null}
              <QuickAccess items={accesos} gestionarTo={puedeAjustes ? "/admin/ajustes/permisos" : null} />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.7fr)_minmax(16rem,0.7fr)]">
            {puedeVerAlertas ? (
              <StockAlerts
                alertas={alertas}
                loading={cargandoAlertas}
                error={errorAlertas}
                tReponer={tReponer}
              />
            ) : null}
            <RecentActivity
              registros={actividad}
              loading={cargandoActividad}
              puedeVer={puedeAuditoria}
            />
            <DashboardCalendar fecha={hoy} />
          </div>
        </div>
      </AdminLayout>
    </AdminPageGate>
  );
};

export default AdminPanel;
