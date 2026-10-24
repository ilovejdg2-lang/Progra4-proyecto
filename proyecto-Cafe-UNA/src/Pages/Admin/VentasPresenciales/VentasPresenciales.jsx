import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Coffee,
  Mail,
  Minus,
  Plus,
  Printer,
  RefreshCw,
  Search,
  ShoppingCart,
  Store,
  Trash2,
  User,
} from "lucide-react";

import { AdminPageGate } from "../../../Components/AdminPageGate/AdminPageGate";
import {
  AdminModal,
  AdminModalBody,
  AdminModalHeader,
} from "../../../Components/Admin/ui/AdminModal";
import { UiSelect } from "../../../Components/ui/Select";
import { AdminLayout } from "../layouts/AdminLayout";
import { useAdminPageGate } from "../../../hooks/useAdminPageGate";
import { calcularVuelto, deduplicarMetodos, esEfectivo } from "../../../lib/pagoPresencial";
import { listarCatalogo, TIPOS_CATALOGO } from "../../../services/catalogosService";
import { rolesDeUsuario, tienePermiso } from "../../../lib/permisos";
import { esCorreoValido, limpiarCorreo, MENSAJE_CORREO_INVALIDO } from "../../../lib/correo";
import { ST } from "../../../Components/T/ST";
import { t } from "../../../lib/t";
import { useIdioma } from "../../../lib/useIdioma";
import { obtenerCatalogoProductos, obtenerStockPorUbicacion } from "../../../services/productosService";
import { getActiveSessionUser } from "../../../services/sessionService";
import {
  enviarComprobanteVentaFisica,
  obtenerPuntosVentaPresencial,
  registrarVentaPresencial,
} from "../../../services/ventasPresencialesService";
import { PagoVentaPresencial } from "./PagoVentaPresencial";

function operaSoloPuntosAsignados(roles) {
  return !roles.some((rol) => {
    const valor = String(rol || "").toLowerCase();
    return valor === "admin" || valor === "administrador" || valor === "superadmin" || valor === "superadministrador";
  });
}

function formatearColones(monto) {
  const n = Math.round(Number(monto) || 0);
  return `₡${n.toLocaleString("es-CR")}`;
}

function FilaResumen({ etiqueta, children }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
      <span className="text-slate-500 font-medium">{etiqueta}</span>
      <span className="min-w-0 break-words font-semibold text-slate-900 sm:text-right">{children}</span>
    </div>
  );
}

const METODOS_PAGO_RESPALDO = ["Efectivo", "Tarjeta", "SINPE Móvil", "Transferencia"];

export default function AdminVentasPresenciales() {
  const user = getActiveSessionUser();
  const roles = rolesDeUsuario(user);
  const puedeVer =
    tienePermiso(roles, "ver_inventario") ||
    tienePermiso(roles, "registrar_ventas") ||
    tienePermiso(roles, "ajustar_stock_ubicaciones");
  const puedeRegistrar =
    tienePermiso(roles, "registrar_ventas") ||
    tienePermiso(roles, "ajustar_stock_ubicaciones");

  const [ready, setReady] = useState(false);
  const { showLoading, loadingMessage } = useAdminPageGate("/admin/ventas-presenciales", ready);

  const [puntos, setPuntos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [stockMap, setStockMap] = useState(new Map());
  const [ubicacionCodigo, setUbicacionCodigo] = useState("");
  const [busquedaProducto, setBusquedaProducto] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("todos");

  // Carrito de compra
  const [carrito, setCarrito] = useState([]);
  const [metodosPago, setMetodosPago] = useState([]);
  const [metodoPagoElegido, setMetodoPago] = useState("Efectivo");
  const metodoPago = metodosPago.includes(metodoPagoElegido)
    ? metodoPagoElegido
    : metodosPago[0] || "";
  const [montoRecibido, setMontoRecibido] = useState("");
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteCorreo, setClienteCorreo] = useState("");
  const [enviarCorreo, setEnviarCorreo] = useState(false);
  const [notas, setNotas] = useState("");

  // Estados de proceso y UI
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [loadError, setLoadError] = useState("");
  const { idioma } = useIdioma();

  // Modal Resumen de Compra
  const [resumenVenta, setResumenVenta] = useState(null);
  const [modalResumenOpen, setModalResumenOpen] = useState(false);
  const [correoResumenInput, setCorreoResumenInput] = useState("");
  const [isEnviandoCorreoModal, setIsEnviandoCorreoModal] = useState(false);
  const [mensajeCorreoModal, setMensajeCorreoModal] = useState({ tipo: "", texto: "" });

  const nombreVendedor = user?.nombre || user?.Nombre || user?.correo || user?.email || "Vendedor Café UNA";

  useEffect(() => {
    let activo = true;
    listarCatalogo(TIPOS_CATALOGO.metodoPago)
      .then((items) => {
        if (activo) setMetodosPago(deduplicarMetodos(items.map((item) => item.nombre)));
      })
      .catch(() => {
        if (activo) setMetodosPago(deduplicarMetodos(METODOS_PAGO_RESPALDO));
      });
    return () => {
      activo = false;
    };
  }, []);

  const loadBase = async () => {
    setLoadError("");
    try {
      const [puntosData, catalogo] = await Promise.all([
        obtenerPuntosVentaPresencial(),
        obtenerCatalogoProductos(),
      ]);
      const puntosActivos = puntosData.filter((p) => p.activo !== false);
      setPuntos(puntosActivos);
      if (puntosActivos.length === 1) {
        setUbicacionCodigo(puntosActivos[0].code);
      }
      setProductos(Array.isArray(catalogo) ? catalogo : catalogo?.data || []);
    } catch (err) {
      setPuntos([]);
      setProductos([]);
      setLoadError(err instanceof Error ? err.message : "No se pudo cargar la información del punto de venta.");
    } finally {
      setReady(true);
    }
  };

  useEffect(() => {
    if (!puedeVer) {
      setReady(true);
      return;
    }
    loadBase();
  }, [puedeVer]);

  // Cargar inventario del punto seleccionado
  useEffect(() => {
    if (!ubicacionCodigo) {
      setStockMap(new Map());
      return;
    }
    let activo = true;
    obtenerStockPorUbicacion(ubicacionCodigo)
      .then((rows) => {
        if (!activo) return;
        const map = new Map();
        (Array.isArray(rows) ? rows : []).forEach((row) => {
          map.set(String(row.productId ?? row.productoId), Number(row.stock) || 0);
        });
        setStockMap(map);
      })
      .catch(() => {
        if (activo) setStockMap(new Map());
      });
    return () => {
      activo = false;
    };
  }, [ubicacionCodigo]);

  // Limpiar carrito si cambia la ubicación
  const cambiarUbicacion = (nuevoCodigo) => {
    if (nuevoCodigo !== ubicacionCodigo && carrito.length > 0) {
      if (window.confirm(t("Al cambiar de punto de venta se reiniciará el carrito para validar el inventario del nuevo punto. ¿Deseás continuar?"))) {
        setCarrito([]);
        setUbicacionCodigo(nuevoCodigo);
      }
    } else {
      setUbicacionCodigo(nuevoCodigo);
    }
    setFormError("");
  };

  const opcionesPunto = useMemo(
    () => [
      { value: "", label: t("Seleccionar punto de venta...") },
      ...puntos.map((p) => ({ value: p.code, label: `${p.name || p.code}` })),
    ],
    [puntos, idioma],
  );

  const puntoSeleccionado = puntos.find((p) => p.code === ubicacionCodigo) || null;

  // Categorías para filtrado rápido
  const categorias = useMemo(() => {
    const setCat = new Set();
    productos.forEach((p) => {
      if (p.categoria?.trim()) setCat.add(p.categoria.trim());
    });
    return ["todos", ...Array.from(setCat)];
  }, [productos]);

  // Filtrar productos por búsqueda y categoría
  const productosFiltrados = useMemo(() => {
    const q = busquedaProducto.trim().toLowerCase();
    return productos.filter((p) => {
      if ((p.estado || "").toLowerCase() === "deshabilitado") return false;
      const matchBusqueda =
        !q ||
        (p.nombre || "").toLowerCase().includes(q) ||
        String(p.id || "").toLowerCase().includes(q) ||
        (p.categoria || "").toLowerCase().includes(q);
      const matchCategoria =
        categoriaSeleccionada === "todos" ||
        (p.categoria || "").toLowerCase() === categoriaSeleccionada.toLowerCase();
      return matchBusqueda && matchCategoria;
    });
  }, [productos, busquedaProducto, categoriaSeleccionada]);

  // Helpers de carrito
  const obtenerCantidadEnCarrito = (prodId) => {
    const item = carrito.find((i) => String(i.productoId) === String(prodId));
    return item ? item.cantidad : 0;
  };

  const agregarAlCarrito = (producto) => {
    if (!ubicacionCodigo) {
      setFormError("Primero seleccioná un punto de venta.");
      return;
    }
    const pId = String(producto.id);
    const stockDisp = Number(stockMap.get(pId) ?? 0);
    const actualEnCarrito = obtenerCantidadEnCarrito(pId);

    if (stockDisp <= 0) {
      setFormError(`El producto "${producto.nombre}" está agotado en este punto de venta.`);
      return;
    }

    if (actualEnCarrito >= stockDisp) {
      setFormError(`No podés agregar más unidades de "${producto.nombre}". Stock disponible: ${stockDisp} unidades.`);
      return;
    }

    setFormError("");
    setCarrito((prev) => {
      const index = prev.findIndex((i) => String(i.productoId) === pId);
      const precio = Number(producto.precioConIVA ?? producto.precioNormal) || 0;
      if (index >= 0) {
        const nuevo = [...prev];
        nuevo[index] = {
          ...nuevo[index],
          cantidad: nuevo[index].cantidad + 1,
          subtotal: Math.round(precio * (nuevo[index].cantidad + 1)),
        };
        return nuevo;
      }
      return [
        ...prev,
        {
          productoId: pId,
          productoNombre: producto.nombre || `Producto #${pId}`,
          precioUnitario: precio,
          cantidad: 1,
          subtotal: precio,
          stockDisponible: stockDisp,
          imagen: producto.imagen || "",
        },
      ];
    });
  };

  const modificarCantidadCarrito = (productoId, delta) => {
    setFormError("");
    setCarrito((prev) => {
      return prev
        .map((item) => {
          if (String(item.productoId) !== String(productoId)) return item;
          const stockDisp = Number(stockMap.get(String(productoId)) ?? item.stockDisponible ?? 0);
          const nuevaCant = item.cantidad + delta;
          if (nuevaCant > stockDisp) {
            setFormError(`Stock máximo alcanzado para "${item.productoNombre}". Disponible: ${stockDisp} unidades.`);
            return item;
          }
          if (nuevaCant <= 0) return null;
          return {
            ...item,
            cantidad: nuevaCant,
            subtotal: Math.round(item.precioUnitario * nuevaCant),
          };
        })
        .filter(Boolean);
    });
  };

  const eliminarDelCarrito = (productoId) => {
    setCarrito((prev) => prev.filter((item) => String(item.productoId) !== String(productoId)));
  };

  const limpiarCarrito = () => {
    setCarrito([]);
    setClienteNombre("");
    setClienteCorreo("");
    setEnviarCorreo(false);
    setNotas("");
    setMontoRecibido("");
    setFormError("");
  };

  const totalCarrito = useMemo(() => {
    return carrito.reduce((acc, item) => acc + (Number(item.subtotal) || 0), 0);
  }, [carrito]);

  const totalItemsCount = useMemo(() => {
    return carrito.reduce((acc, item) => acc + item.cantidad, 0);
  }, [carrito]);

  // Confirmar y registrar venta con validaciones estrictas de inventario
  const registrarVenta = async (e) => {
    if (e) e.preventDefault();
    setFormError("");

    if (!ubicacionCodigo) {
      setFormError("Seleccioná el punto de venta.");
      return;
    }

    if (carrito.length === 0) {
      setFormError("El carrito está vacío. Agregá al menos un producto.");
      return;
    }

    // Validación estricta de stock disponible para cada ítem en el carrito
    for (const it of carrito) {
      const stockDisp = Number(stockMap.get(String(it.productoId)) ?? 0);
      if (it.cantidad > stockDisp) {
        setFormError(`Stock insuficiente para "${it.productoNombre}". Solicitado: ${it.cantidad}, Disponible: ${stockDisp}.`);
        return;
      }
    }

    if (enviarCorreo && !esCorreoValido(clienteCorreo)) {
      setFormError(MENSAJE_CORREO_INVALIDO);
      return;
    }

    const pago = esEfectivo(metodoPago) ? calcularVuelto(totalCarrito, montoRecibido) : null;
    if (!metodoPago) {
      setFormError("Seleccioná un método de pago.");
      return;
    }
    if (pago && !pago.suficiente) {
      setFormError("El monto recibido es menor que el total.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ubicacionCodigo,
        items: carrito.map((item) => ({
          productoId: item.productoId,
          productoNombre: item.productoNombre,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          subtotal: item.subtotal,
        })),
        metodoPago,
        montoRecibido: pago ? pago.montoRecibido : undefined,
        clienteNombre: clienteNombre.trim(),
        clienteCorreo: clienteCorreo.trim(),
        enviarCorreo: Boolean(enviarCorreo && clienteCorreo.trim()),
        notas: notas.trim(),
        total: totalCarrito,
      };

      const resultado = await registrarVentaPresencial(payload);

      // Actualizar stocks en tiempo real
      if (ubicacionCodigo) {
        const rows = await obtenerStockPorUbicacion(ubicacionCodigo);
        const map = new Map();
        (Array.isArray(rows) ? rows : []).forEach((row) => {
          map.set(String(row.productId ?? row.productoId), Number(row.stock) || 0);
        });
        setStockMap(map);
      }

      // Preparar el resumen de compra para el modal de ticket
      const resumen = {
        id: resultado?.id || `VP-${Date.now()}`,
        numero: resultado?.numero || `VP-${Date.now().toString().slice(-6)}`,
        fecha: resultado?.fecha || new Date().toISOString(),
        puntoVenta: puntoSeleccionado?.name || ubicacionCodigo,
        vendedor: resultado?.responsableNombre || nombreVendedor,
        clienteNombre: clienteNombre.trim(),
        clienteCorreo: clienteCorreo.trim(),
        metodoPago: resultado?.metodoPago || metodoPago,
        items: [...carrito],
        total: Number.isFinite(Number(resultado?.total)) ? Number(resultado.total) : totalCarrito,
        montoRecibido: resultado?.montoRecibido ?? pago?.montoRecibido ?? null,
        vuelto: resultado?.vuelto ?? pago?.vuelto ?? null,
        notas: notas.trim(),
        correoEnviado: Boolean(resultado?.correoEnviado),
      };

      setResumenVenta(resumen);
      setCorreoResumenInput(clienteCorreo.trim());
      setMensajeCorreoModal({
        tipo: resultado?.correoEnviado ? "success" : "",
        texto: resultado?.correoEnviado ? `Comprobante enviado a ${clienteCorreo.trim()}` : "",
      });
      setModalResumenOpen(true);

      // Limpiar el carrito para la próxima venta
      limpiarCarrito();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al registrar la venta física.");
    } finally {
      setIsSaving(false);
    }
  };

  // Envío manual o reenvío de correo desde el modal de resumen
  const handleEnviarCorreoModal = async () => {
    if (!esCorreoValido(correoResumenInput)) {
      setMensajeCorreoModal({ tipo: "error", texto: MENSAJE_CORREO_INVALIDO });
      return;
    }
    if (!resumenVenta) return;

    setIsEnviandoCorreoModal(true);
    setMensajeCorreoModal({ tipo: "", texto: "" });
    try {
      const resp = await enviarComprobanteVentaFisica({
        destinatario: correoResumenInput.trim(),
        numero: resumenVenta.numero,
        puntoVenta: resumenVenta.puntoVenta,
        vendedor: resumenVenta.vendedor,
        clienteNombre: resumenVenta.clienteNombre,
        metodoPago: resumenVenta.metodoPago,
        fecha: resumenVenta.fecha,
        items: resumenVenta.items.map((i) => ({
          nombre: i.productoNombre,
          cantidad: i.cantidad,
          precioUnitario: i.precioUnitario,
          subtotal: i.subtotal,
        })),
        total: resumenVenta.total,
        montoRecibido: resumenVenta.montoRecibido,
        vuelto: resumenVenta.vuelto,
        notas: resumenVenta.notas,
      });

      if (resp?.success !== false) {
        setMensajeCorreoModal({
          tipo: "success",
          texto: `¡Comprobante enviado exitosamente a ${correoResumenInput.trim()}!`,
        });
      } else {
        setMensajeCorreoModal({
          tipo: "error",
          texto: resp?.message || "No se pudo enviar el correo.",
        });
      }
    } catch (err) {
      setMensajeCorreoModal({
        tipo: "error",
        texto: err instanceof Error ? err.message : "Error al enviar el comprobante.",
      });
    } finally {
      setIsEnviandoCorreoModal(false);
    }
  };

  const imprimirTicket = () => {
    window.print();
  };

  if (!puedeVer) {
    return (
      <AdminPageGate showLoading={showLoading} loadingMessage={loadingMessage}>
        <AdminLayout>
          <section
            className="border border-slate-200 bg-white px-5 py-14 text-center shadow-sm"
            style={{ borderRadius: "16px" }}
          >
            <h1 className="text-[length:var(--text-title)] font-semibold text-slate-950">
              <ST>Acceso restringido</ST>
            </h1>
            <p className="mx-auto mt-2 max-w-md text-[length:var(--text-body)] text-slate-500">
              <ST>No tiene permiso para registrar ventas presenciales.</ST>
            </p>
          </section>
        </AdminLayout>
      </AdminPageGate>
    );
  }

  const sinAsignaciones = ready && operaSoloPuntosAsignados(roles) && puntos.length === 0 && !loadError;
  if (sinAsignaciones) {
    return (
      <AdminPageGate showLoading={showLoading} loadingMessage={loadingMessage}>
        <AdminLayout>
          <section
            className="border border-slate-200 bg-white px-5 py-14 text-center shadow-sm"
            style={{ borderRadius: "16px" }}
          >
            <h1 className="text-[length:var(--text-title)] font-semibold text-slate-950">
              <ST>Registrar Venta Física</ST>
            </h1>
            <p className="mx-auto mt-3 max-w-md text-[length:var(--text-body)] text-slate-600">
              <ST>No tienes puntos de venta asignados. Contacta a un administrador.</ST>
            </p>
          </section>
        </AdminLayout>
      </AdminPageGate>
    );
  }

  return (
    <AdminPageGate showLoading={showLoading} loadingMessage={loadingMessage}>
      <AdminLayout>
        <div className="space-y-6 pb-12">
          {/* Encabezado principal */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
              <ST>Registrar Venta Física</ST>
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              <ST>Punto de venta para vendedores · Descuento automático de inventario</ST>
            </p>
          </div>

          {loadError ? (
            <div
              className="border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-2"
              style={{ borderRadius: "16px" }}
            >
              <AlertCircle className="size-5 shrink-0" />
              <span><ST>{loadError}</ST></span>
            </div>
          ) : null}

          {/* Barra superior de configuración de venta (Punto de venta y Vendedor) */}
          <div
            className="border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs"
            style={{ borderRadius: "16px" }}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12 items-end">
              <div className="lg:col-span-6 space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Store className="size-3.5 text-neutral-900" />
                  <ST>Punto de Venta</ST>
                </label>
                <UiSelect
                  id="pos-punto-venta-select"
                  ariaLabel={t("Punto de venta")}
                  value={ubicacionCodigo}
                  onChange={cambiarUbicacion}
                  options={opcionesPunto}
                  className="w-full font-medium"
                />
              </div>

              <div className="lg:col-span-6 space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <User className="size-3.5 text-neutral-900" />
                  <ST>Vendedor</ST>
                </label>
                <div className="min-h-[var(--control-height)] flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-800">
                  <span className="truncate">{nombreVendedor}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mensaje de error general si ocurre */}
          {formError ? (
            <div
              className="border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 flex items-center gap-2 shadow-xs"
              style={{ borderRadius: "16px" }}
            >
              <AlertCircle className="size-5 shrink-0 text-amber-700" />
              <span className="font-medium"><ST>{formError}</ST></span>
            </div>
          ) : null}

          {/* Grid principal: Catálogo de productos a la izquierda, Carrito a la derecha */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
            {/* COLUMNA IZQUIERDA: Selector de Productos con Cards Cuadradas de Puntas Redondeadas */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-4">
              {/* Barra de Búsqueda y Filtro de Categorías (Botones Negros) */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <input
                    type="search"
                    value={busquedaProducto}
                    onChange={(e) => setBusquedaProducto(e.target.value)}
                    placeholder={t("Buscar por nombre, código o presentación...")}
                    className="h-11 w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                  />
                </div>

                {categorias.length > 1 ? (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
                    {categorias.map((cat) => {
                      const activa = categoriaSeleccionada.toLowerCase() === cat.toLowerCase();
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCategoriaSeleccionada(cat)}
                          className={`rounded-full px-4 py-2 font-bold transition whitespace-nowrap ${
                            activa
                              ? "bg-black text-white shadow-xs hover:bg-neutral-900 border border-black"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-transparent"
                          }`}
                        >
                          {cat === "todos" ? <ST>Todos los productos</ST> : cat}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              {/* Grid de Cards de Productos - Rectangulares con puntas redondeadas */}
              {productosFiltrados.length === 0 ? (
                <div
                  className="border border-dashed border-slate-200 bg-white p-12 text-center"
                  style={{ borderRadius: "16px" }}
                >
                  <Coffee className="mx-auto size-12 text-slate-300 mb-3" />
                  <p className="text-sm font-medium text-slate-600">
                    <ST>No se encontraron productos coincidentes.</ST>
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {productosFiltrados.map((prod) => {
                    const pId = String(prod.id);
                    const stockDisp = Number(stockMap.get(pId) ?? 0);
                    const enCarrito = obtenerCantidadEnCarrito(pId);
                    const sinStock = stockDisp <= 0;
                    const precio = Number(prod.precioConIVA ?? prod.precioNormal) || 0;
                    const sku = `CAFE-${pId.padStart(3, "0")}`;

                    return (
                      <div
                        key={pId}
                        role="button"
                        tabIndex={sinStock || !puedeRegistrar ? -1 : 0}
                        onClick={() => {
                          if (!sinStock && puedeRegistrar) {
                            agregarAlCarrito(prod);
                          }
                        }}
                        onKeyDown={(e) => {
                          if ((e.key === "Enter" || e.key === " ") && !sinStock && puedeRegistrar) {
                            e.preventDefault();
                            agregarAlCarrito(prod);
                          }
                        }}
                        style={{ borderRadius: "16px" }}
                        className={`group relative flex flex-col p-4 text-left transition-all duration-200 select-none ${
                          enCarrito > 0
                            ? "border-2 border-amber-500 bg-amber-50/20 shadow-md dark:border-amber-400 dark:bg-amber-950/40"
                            : "border border-slate-200/90 bg-white hover:border-slate-400 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-500"
                        } ${sinStock ? "opacity-80 cursor-not-allowed" : "cursor-pointer active:scale-[0.99]"}`}
                      >
                        {/* Contenedor de Imagen o Placeholder cuadrado con puntas redondeadas */}
                        <div
                          style={{ borderRadius: "12px" }}
                          className="relative mb-3 flex h-36 w-full items-center justify-center overflow-hidden bg-slate-100/90 transition group-hover:bg-slate-200/70 dark:bg-slate-800 dark:group-hover:bg-slate-700"
                        >
                          {prod.imagen ? (
                            <img
                              src={prod.imagen}
                              alt={prod.nombre}
                              className="h-full w-full object-cover object-center transition duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <Coffee className="size-14 stroke-1 text-slate-300 transition group-hover:text-slate-500 dark:text-slate-500 dark:group-hover:text-slate-400" />
                          )}

                          {/* SKU badge */}
                          <span
                            style={{ borderRadius: "6px" }}
                            className="absolute top-2.5 left-2.5 bg-white/95 px-2 py-0.5 text-[11px] font-semibold tracking-wider text-slate-700 shadow-xs dark:bg-slate-950/90 dark:text-slate-100"
                          >
                            {sku}
                          </span>
                        </div>

                        {/* Nombre del Producto */}
                        <div className="flex-1">
                          <h3 className="line-clamp-2 text-sm font-bold text-slate-900 transition group-hover:text-black dark:text-slate-100 dark:group-hover:text-white">
                            <ST>{prod.nombre}</ST>
                          </h3>
                        </div>

                        {/* Fila Inferior: Precio y Badge de Stock */}
                        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-800">
                          <span className="text-base font-bold text-slate-950 dark:text-slate-50">
                            {formatearColones(precio)}
                          </span>

                          <span
                            className={`text-[length:var(--text-body)] font-semibold ${
                              sinStock
                                ? "text-rose-700 dark:text-rose-300"
                                : stockDisp <= 3
                                ? "text-amber-800 dark:text-amber-300"
                                : "text-emerald-800 dark:text-emerald-300"
                            }`}
                          >
                            {sinStock ? t("Agotado") : `${stockDisp} ${t("disp.")}`}
                          </span>
                        </div>

                        {/* Banner inferior de "En carrito: X" */}
                        {enCarrito > 0 ? (
                          <div
                            style={{ borderRadius: "8px" }}
                            className="mt-2.5 w-full bg-amber-100/80 py-1 text-center text-xs font-bold text-amber-950"
                          >
                            {t("En carrito")}: {enCarrito}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* COLUMNA DERECHA: Carrito de Compras Estilo Punto de Venta (Con Botones Negros) */}
            <div className="lg:col-span-5 xl:col-span-4">
              <div
                style={{ borderRadius: "16px" }}
                className="sticky top-4 overflow-hidden border border-slate-200/90 bg-white shadow-sm"
              >
                {/* Cabecera del Carrito en Color Negro con Tipografía Nítida */}
                <div
                  style={{ backgroundColor: "#000000", color: "#ffffff" }}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 px-4 py-4 sm:px-5"
                >
                  <div className="flex items-center gap-3">
                    <div
                      style={{ backgroundColor: "rgba(255, 255, 255, 0.12)", color: "#ffffff" }}
                      className="flex size-9 items-center justify-center rounded-xl shadow-inner"
                    >
                      <ShoppingCart className="size-5" style={{ color: "#ffffff" }} aria-hidden="true" />
                    </div>
                    <div>
                      <h2
                        style={{ color: "#ffffff" }}
                        className="text-[18px] font-extrabold tracking-tight font-sans leading-none m-0"
                      >
                        <ST>Carrito</ST>
                      </h2>
                      <p
                        style={{ color: "#9ca3af" }}
                        className="text-[11px] font-medium leading-none mt-1"
                      >
                        <ST>Resumen de venta</ST>
                      </p>
                    </div>
                  </div>
                  <span
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.15)",
                      color: "#ffffff",
                      borderColor: "rgba(255, 255, 255, 0.25)",
                    }}
                    className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold tracking-normal border"
                  >
                    {totalItemsCount} {t("ítem(s)")}
                  </span>
                </div>

                {/* Lista de productos en Carrito */}
                <div className="p-4 sm:p-5 space-y-4">
                  {carrito.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 space-y-2">
                      <ShoppingCart className="mx-auto size-10 opacity-30 stroke-1" />
                      <p className="text-xs font-medium text-slate-500">
                        <ST>El carrito está vacío</ST>
                      </p>
                      <p className="text-[11px] text-slate-400">
                        <ST>Haz clic en los productos para agregarlos a la venta</ST>
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto pr-1">
                      {carrito.map((item) => (
                        <div key={item.productoId} className="py-3 flex flex-col gap-2 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-bold text-slate-900 break-words">
                              <ST>{item.productoNombre}</ST>
                            </h4>
                            <p className="text-[11px] text-slate-500">
                              {formatearColones(item.precioUnitario)} {t("c/u")}
                            </p>
                            <p className="text-xs font-bold text-slate-900 mt-0.5">
                              {formatearColones(item.subtotal)}
                            </p>
                          </div>

                          <div className="flex items-center justify-between gap-2 min-[420px]:justify-end">
                            <div className="flex items-center rounded-full border border-slate-200 bg-slate-50 p-0.5">
                              <button
                                type="button"
                                onClick={() => modificarCantidadCarrito(item.productoId, -1)}
                                className="size-9 rounded-full flex items-center justify-center text-slate-700 hover:bg-black hover:text-white transition active:scale-95"
                                title={t("Disminuir")}
                                aria-label={t("Disminuir")}
                              >
                                <Minus className="size-4" />
                              </button>
                              <span className="w-8 text-center text-sm font-bold text-slate-900">
                                {item.cantidad}
                              </span>
                              <button
                                type="button"
                                onClick={() => modificarCantidadCarrito(item.productoId, 1)}
                                className="size-9 rounded-full flex items-center justify-center text-slate-700 hover:bg-black hover:text-white transition active:scale-95"
                                title={t("Aumentar")}
                                aria-label={t("Aumentar")}
                              >
                                <Plus className="size-4" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => eliminarDelCarrito(item.productoId)}
                              className="size-9 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition"
                              title={t("Eliminar")}
                              aria-label={t("Eliminar")}
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Formulario de Checkout (Método de Pago, Cliente, Correo) */}
                  <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
                    {/* Método de Pago */}
                    <PagoVentaPresencial
                      metodos={metodosPago}
                      metodoPago={metodoPago}
                      onMetodoPago={setMetodoPago}
                      total={totalCarrito}
                      montoRecibido={montoRecibido}
                      onMontoRecibido={setMontoRecibido}
                    />

                    {/* Cliente (opcional) */}
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">
                        <ST>Cliente (opcional)</ST>
                      </label>
                      <input
                        type="text"
                        value={clienteNombre}
                        onChange={(e) => setClienteNombre(e.target.value)}
                        placeholder={t("Nombre del cliente")}
                        className="h-9 w-full rounded-full border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 outline-none transition focus:border-black focus:bg-white"
                      />
                    </div>

                    {/* Correo Electrónico (opcional) para envío de comprobante */}
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Mail className="size-3 text-neutral-900" />
                          <ST>Correo para comprobante (opcional)</ST>
                        </span>
                      </label>
                      <input
                        type="email"
                        value={clienteCorreo}
                        onChange={(e) => {
                          const valor = limpiarCorreo(e.target.value);
                          setClienteCorreo(valor);
                          if (esCorreoValido(valor)) {
                            setEnviarCorreo(true);
                          }
                        }}
                        placeholder="cliente@correo.com"
                        className="h-9 w-full rounded-full border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 outline-none transition focus:border-black focus:bg-white"
                      />

                      {clienteCorreo.trim() ? (
                        <label className="flex items-start gap-2 mt-1.5 cursor-pointer text-slate-700 select-none">
                          <input
                            type="checkbox"
                            checked={enviarCorreo}
                            onChange={(e) => setEnviarCorreo(e.target.checked)}
                            className="mt-0.5 rounded text-black focus:ring-black size-3.5 shrink-0"
                          />
                          <span className="text-[11px] font-medium leading-snug text-slate-600">
                            <ST>Enviar comprobante automáticamente al registrar</ST>
                          </span>
                        </label>
                      ) : null}
                    </div>

                    {/* Total de la venta */}
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 pt-3 border-t border-slate-200">
                      <span className="text-sm font-semibold text-slate-700">
                        <ST>Total</ST>
                      </span>
                      <span className="text-2xl font-black text-black">
                        {formatearColones(totalCarrito)}
                      </span>
                    </div>

                    {/* Botón Principal: Registrar Venta (Color Negro) */}
                    <button
                      type="button"
                      disabled={
                        isSaving ||
                        carrito.length === 0 ||
                        !ubicacionCodigo ||
                        !puedeRegistrar ||
                        !metodoPago ||
                        (esEfectivo(metodoPago) && !calcularVuelto(totalCarrito, montoRecibido).suficiente)
                      }
                      onClick={registrarVenta}
                      className="w-full mt-2 rounded-2xl bg-black py-3.5 text-sm font-bold text-white shadow-sm hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-40 transition active:scale-[0.99] flex items-center justify-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <RefreshCw className="size-4 animate-spin" />
                          <span><ST>Procesando venta...</ST></span>
                        </>
                      ) : (
                        <span><ST>Registrar Venta</ST></span>
                      )}
                    </button>

                    {carrito.length > 0 ? (
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={limpiarCarrito}
                        className="w-full py-1 text-center text-[11px] text-slate-400 hover:text-red-600 transition"
                      >
                        <ST>Vaciar carrito</ST>
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL: RESUMEN DE COMPRA / TICKET DIGITAL */}
        {modalResumenOpen && resumenVenta ? (
          <AdminModal
            open
            onClose={() => setModalResumenOpen(false)}
            maxWidth="max-w-lg"
            labelledBy="resumen-compra-title"
          >
            <AdminModalHeader onClose={() => setModalResumenOpen(false)}>
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="size-5" />
                </div>
                <h2 id="resumen-compra-title" className="min-w-0 text-base font-bold text-slate-950 sm:text-lg">
                  <ST>Resumen de Compra</ST>
                </h2>
              </div>
            </AdminModalHeader>

            <AdminModalBody>
              <div className="space-y-4">
                {/* Tarjeta del Ticket (Imprimible y Elegante) */}
                <div
                  id="ticket-imprimible"
                  style={{ borderRadius: "16px" }}
                  className="min-w-0 max-w-full overflow-hidden border border-slate-200 bg-white shadow-sm font-sans"
                >
                  {/* Franja roja institucional */}
                  <div className="h-1 bg-[#C41E3A] w-full" />

                  <div className="space-y-4 p-3 text-xs text-slate-700 sm:p-5">
                    <div className="space-y-2 rounded-xl border border-slate-200/80 bg-slate-50 p-3 text-xs sm:p-4">
                      <div className="border-b border-slate-200/60 pb-2">
                        <FilaResumen etiqueta="Comprobante:">
                          <span className="inline-block max-w-full break-all rounded border border-slate-200 bg-white px-2 py-0.5 font-mono text-xs font-bold text-slate-900">
                            {resumenVenta.numero}
                          </span>
                        </FilaResumen>
                      </div>
                      <FilaResumen etiqueta="Fecha y hora:">
                        {new Date(resumenVenta.fecha).toLocaleString("es-CR")}
                      </FilaResumen>
                      <FilaResumen etiqueta="Punto de venta:">{resumenVenta.puntoVenta}</FilaResumen>
                      <FilaResumen etiqueta="Atendido por:">{resumenVenta.vendedor}</FilaResumen>
                      {resumenVenta.clienteNombre ? (
                        <FilaResumen etiqueta="Cliente:">{resumenVenta.clienteNombre}</FilaResumen>
                      ) : null}
                      <FilaResumen etiqueta="Método de Pago:">{resumenVenta.metodoPago}</FilaResumen>
                      {resumenVenta.montoRecibido != null ? (
                        <FilaResumen etiqueta="Monto recibido:">{formatearColones(resumenVenta.montoRecibido)}</FilaResumen>
                      ) : null}
                      {resumenVenta.vuelto != null ? (
                        <FilaResumen etiqueta="Vuelto:">{formatearColones(resumenVenta.vuelto)}</FilaResumen>
                      ) : null}
                    </div>

                    {/* Tabla de ítems */}
                    <div className="space-y-2 border-b border-dashed border-slate-200 pb-3">
                      <div className="flex justify-between gap-3 font-bold text-slate-400 text-[10px] uppercase tracking-wider">
                        <span>Cant. / Detalle</span>
                        <span className="text-right">Subtotal</span>
                      </div>
                      {resumenVenta.items.map((it, idx) => (
                        <div key={idx} className="flex min-w-0 items-start justify-between gap-3 py-0.5 text-xs">
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-slate-900 mr-1.5">{it.cantidad}×</span>
                            <span className="break-words font-medium text-slate-700"><ST>{it.productoNombre}</ST></span>
                            <div className="text-[10px] text-slate-400">
                              {formatearColones(it.precioUnitario)} c/u
                            </div>
                          </div>
                          <span className="shrink-0 font-mono text-xs font-bold text-slate-900">
                            {formatearColones(it.subtotal)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Desglose de impuestos */}
                    <div className="space-y-1 border-b border-slate-100 pb-2 text-[11px] text-slate-500">
                      <div className="flex min-w-0 justify-between gap-3">
                        <span className="min-w-0">Subtotal (sin IVA):</span>
                        <span className="shrink-0 font-mono">{formatearColones(Math.round(resumenVenta.total / 1.13))}</span>
                      </div>
                      <div className="flex min-w-0 justify-between gap-3">
                        <span className="min-w-0">IVA (13% incluido):</span>
                        <span className="shrink-0 font-mono">{formatearColones(Math.round(resumenVenta.total - Math.round(resumenVenta.total / 1.13)))}</span>
                      </div>
                    </div>

                    {/* Total destacado */}
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-black px-4 py-3 text-white shadow-sm">
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 block">Total Pagado</span>
                        <span className="text-[10px] text-neutral-400">CRC - Colones</span>
                      </div>
                      <span className="text-lg font-extrabold tracking-tight text-white font-mono sm:text-xl">
                        {formatearColones(resumenVenta.total)}
                      </span>
                    </div>

                    <div className="text-center pt-1 text-[10px] text-slate-400">
                      <p>¡Gracias por apoyar el café universitario!</p>
                      <p className="font-mono tracking-widest text-[9px] text-slate-300 mt-1">|||| | ||| || |||||| | |||</p>
                    </div>
                  </div>
                </div>

                {/* Sección de Envío por Correo Electrónico (Botón Negro) */}
                <div
                  style={{ borderRadius: "16px" }}
                  className="min-w-0 space-y-2 border border-slate-200 bg-slate-50 p-3 text-xs sm:p-4"
                >
                  <div className="flex items-start gap-1.5 font-bold text-slate-950">
                    <Mail className="mt-0.5 size-4 shrink-0 text-black" />
                    <ST>Enviar comprobante por correo al cliente</ST>
                  </div>
                  <p className="text-[11px] leading-snug text-slate-600">
                    <ST>Podés enviar o reenviar el comprobante digital a la dirección que indique el cliente:</ST>
                  </p>

                  <div className="flex flex-col gap-2 pt-1 sm:flex-row">
                    <input
                      type="email"
                      value={correoResumenInput}
                      onChange={(e) => setCorreoResumenInput(limpiarCorreo(e.target.value))}
                      placeholder="cliente@correo.com"
                      className="h-11 w-full min-w-0 rounded-full border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-black sm:h-10 sm:flex-1 sm:text-xs"
                    />
                    <button
                      type="button"
                      disabled={isEnviandoCorreoModal || !correoResumenInput}
                      onClick={handleEnviarCorreoModal}
                      className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-black px-4 text-sm font-bold text-white transition hover:bg-neutral-900 disabled:opacity-50 sm:h-10 sm:w-auto sm:shrink-0 sm:text-xs"
                    >
                      {isEnviandoCorreoModal ? (
                        <RefreshCw className="size-3.5 animate-spin" />
                      ) : (
                        <Mail className="size-3.5" />
                      )}
                      <span><ST>Enviar</ST></span>
                    </button>
                  </div>

                  {mensajeCorreoModal.texto ? (
                    <div
                      className={`text-[11px] font-medium rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 ${
                        mensajeCorreoModal.tipo === "success"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {mensajeCorreoModal.tipo === "success" ? (
                        <CheckCircle2 className="size-3.5 shrink-0" />
                      ) : (
                        <AlertCircle className="size-3.5 shrink-0" />
                      )}
                      <span>{mensajeCorreoModal.texto}</span>
                    </div>
                  ) : null}
                </div>

                {/* Botones de acción del Modal (Botones Negros) */}
                <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={imprimirTicket}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 whitespace-normal rounded-full border-2 border-black bg-white px-4 py-2.5 text-center text-sm font-bold text-black transition hover:bg-black hover:text-white sm:min-h-10 sm:flex-1 sm:text-xs"
                  >
                    <Printer className="size-4 shrink-0" />
                    <span><ST>Imprimir comprobante</ST></span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalResumenOpen(false)}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 whitespace-normal rounded-full bg-black px-4 py-2.5 text-center text-sm font-bold text-white transition hover:bg-neutral-900 sm:min-h-10 sm:flex-1 sm:text-xs"
                  >
                    <ST>Nueva venta</ST>
                  </button>
                </div>
              </div>
            </AdminModalBody>
          </AdminModal>
        ) : null}
      </AdminLayout>
    </AdminPageGate>
  );
}
