import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "@tanstack/react-form";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Pencil, Power, X } from "lucide-react";
import { AdminLayout } from "../layouts/AdminLayout";
import { AdminPageGate } from "../../../Components/AdminPageGate/AdminPageGate";
import { useAdminPageGate } from "../../../hooks/useAdminPageGate";
import { AdminModal, AdminModalActions, AdminModalBody, AdminModalHeader, adminBtnCancel } from "../../../Components/Admin/ui/AdminModal";
import { AdminListaToolbar, AdminListaVacia } from "../../../Components/Admin/ui/AdminListaToolbar";
import { AdminPaginacion } from "../../../Components/Admin/ui/AdminPaginacion";
import { useAdminListaFiltros } from "../../../hooks/useAdminListaFiltros";
import { useAdminPaginacion } from "../../../hooks/useAdminPaginacion";
import {
  obtenerUsuarios,
  actualizarUsuario,
  cambiarEstadoUsuario,
  solicitarCreacionUsuario,
  confirmarCreacionUsuario,
  solicitarCambioCorreoUsuario,
  confirmarCambioCorreoUsuario,
} from "../../../services/usuariosService";
import { getActiveSessionUser } from "../../../services/sessionService";
import { tienePermiso } from "../../../lib/permisos";
import {
  MAX_NOMBRE_USUARIO,
  MAX_PASSWORD,
  sanitizeUserFacingError,
  validateNombreUsuario,
  validatePassword,
} from "../../../lib/formLimits";

function Modal({ titulo, onClose, children }) {
  return (
    <AdminModal open onClose={onClose} maxWidth="max-w-lg" labelledBy="admin-usuarios-modal-title">
      <AdminModalHeader>
        <h2 id="admin-usuarios-modal-title" className="text-lg font-semibold text-slate-900">{titulo}</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          aria-label="Cerrar"
        >
          <X className="size-5" />
        </button>
      </AdminModalHeader>
      <AdminModalBody>{children}</AdminModalBody>
    </AdminModal>
  );
}

const colorRol = {
  Superadministrador: "bg-slate-100 text-yellow-500",
  SuperAdmin:         "bg-slate-100 text-yellow-500",
  Administración:     "bg-slate-100 text-green-600",
  Admin:              "bg-slate-100 text-green-600",
  Vendedor:           "bg-slate-100 text-[#5c3317]",
  Cliente:            "bg-slate-100 text-red-600",
  Usuario:            "bg-slate-100 text-slate-700",
};

function claseRol(rol) {
  const clave = String(rol ?? "").trim().toLowerCase();
  if (clave === "superadmin" || clave === "superadministrador") return colorRol.SuperAdmin;
  if (clave === "admin" || clave === "administración" || clave === "administracion") return colorRol.Admin;
  if (clave === "vendedor") return colorRol.Vendedor;
  if (clave === "cliente") return colorRol.Cliente;
  if (clave === "usuario") return colorRol.Usuario;
  return colorRol[rol] ?? "bg-slate-100 text-slate-700";
}

function BadgeRol({ rol }) {
  return (
    <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${claseRol(rol)}`}>
      {rol}
    </span>
  );
}

const btnNegro =
  "w-full rounded-full border border-slate-950 bg-slate-950 px-5 py-2.5 text-sm font-bold text-white transition hover:border-neutral-700 hover:bg-neutral-700 active:border-neutral-700 active:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto";

const btnCancelarGris =
  "w-full rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 sm:w-auto";

const ROLES_DISPONIBLES = ["SuperAdmin", "Admin", "Vendedor", "Usuario", "Cliente"];

function FormUsuario({ inicial, onCreado, onActualizado, onCancelar, cargando, setCargando, puedeEditarRoles = false }) {
  const actor = (() => {
    return getActiveSessionUser();
  })();
  const actorId = Number(actor?.id) || null;
  const editandoPropioUsuario = Boolean(inicial?.id) && actorId !== null && Number(inicial.id) === actorId;
  const correoOriginal = (inicial?.correo ?? "").trim().toLowerCase();

  const [pasoCreacion, setPasoCreacion] = useState("datos");
  const [codigoVerificacion, setCodigoVerificacion] = useState("");
  const [passwordCorreoUsuario, setPasswordCorreoUsuario] = useState("");
  const [errorPasswordCorreo, setErrorPasswordCorreo] = useState("");
  const [correoVerificado, setCorreoVerificado] = useState(true);
  const [mensajeCorreo, setMensajeCorreo] = useState("");
  const [errorCorreo, setErrorCorreo] = useState("");
  const [verificandoCorreo, setVerificandoCorreo] = useState(false);
  const [correoForm, setCorreoForm] = useState(inicial?.correo ?? "");
  const [fieldErrors, setFieldErrors] = useState({
    nombre: "",
    passwordHash: "",
    passwordActual: "",
    formulario: "",
  });

  const form = useForm({
    defaultValues: {
      nombre: inicial?.nombre ?? "",
      correo: inicial?.correo ?? "",
      passwordHash: "",
      passwordActual: "",
      roles: inicial?.roles ?? ["Usuario"],
    },
    onSubmit: async ({ value }) => {
      const correoActual = value.correo.trim().toLowerCase();
      const payload = {
        nombre: value.nombre.trim(),
        correo: correoActual,
        roles: Array.isArray(value.roles) && value.roles.length > 0 ? value.roles : ["Usuario"],
      };

      const nextErrors = {
        nombre: validateNombreUsuario(value.nombre),
        passwordHash: "",
        passwordActual: "",
        formulario: "",
      };

      if (!payload.correo) {
        setErrorCorreo("Ingrese el correo.");
        return;
      }

      if (nextErrors.nombre) {
        setFieldErrors(nextErrors);
        return;
      }

      if (!inicial) {
        if (pasoCreacion === "datos") {
          const passwordError = validatePassword(value.passwordHash);
          if (passwordError) {
            setFieldErrors({ ...nextErrors, passwordHash: passwordError });
            return;
          }
          setFieldErrors(nextErrors);
          setCargando(true);
          setErrorCorreo("");
          try {
            const result = await solicitarCreacionUsuario({
              ...payload,
              passwordHash: value.passwordHash,
            });
            setMensajeCorreo(result?.message || "C\u00f3digo enviado al correo.");
            setPasoCreacion("codigo");
          } catch (err) {
            setFieldErrors({
              ...nextErrors,
              formulario: sanitizeUserFacingError(err?.message || "No se pudo enviar el c\u00f3digo."),
            });
          } finally {
            setCargando(false);
          }
          return;
        }

        setCargando(true);
        setErrorCorreo("");
        try {
          const nuevo = await confirmarCreacionUsuario({
            correo: correoActual,
            token: codigoVerificacion.trim(),
          });
          onCreado(nuevo);
        } catch (err) {
          setErrorCorreo(sanitizeUserFacingError(err?.message || "No se pudo crear el usuario."));
        } finally {
          setCargando(false);
        }
        return;
      }

      if (correoActual !== correoOriginal && !correoVerificado) {
        setErrorCorreo("Debe verificar el nuevo correo antes de guardar.");
        return;
      }

      const cambios = { ...payload };
      if (value.passwordHash?.trim()) {
        const passwordError = validatePassword(value.passwordHash, { required: true });
        if (passwordError) {
          setFieldErrors({ ...nextErrors, passwordHash: passwordError });
          return;
        }
        if (!value.passwordActual?.trim()) {
          setFieldErrors({ ...nextErrors, passwordActual: "Ingrese su contrase\u00f1a actual." });
          return;
        }
        cambios.passwordHash = value.passwordHash;
        cambios.passwordActual = value.passwordActual;
      }

      setFieldErrors(nextErrors);
      setCargando(true);
      try {
        await onActualizado(cambios);
      } catch (err) {
        const message = sanitizeUserFacingError(err?.message || "No se pudo guardar el usuario.");
        if (value.passwordHash?.trim()) {
          setFieldErrors((prev) => ({ ...prev, passwordHash: message }));
        } else {
          setFieldErrors((prev) => ({ ...prev, formulario: message }));
        }
      } finally {
        setCargando(false);
      }
    },
  });

  function handleSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit();
  }

  const correoCambio = Boolean(inicial) && correoForm.trim().toLowerCase() !== correoOriginal;

  useEffect(() => {
    if (!inicial) {
      setCorreoVerificado(false);
      return;
    }
    setCorreoVerificado(!correoCambio);
    if (!correoCambio) {
      setPasswordCorreoUsuario("");
      setErrorPasswordCorreo("");
    }
  }, [correoCambio, inicial]);

  async function handleSolicitarCodigoCorreo() {
    const correo = correoForm.trim().toLowerCase();
    if (!correo) {
      setErrorCorreo("Ingrese el nuevo correo.");
      return;
    }
    if (!passwordCorreoUsuario) {
      setErrorPasswordCorreo(
        editandoPropioUsuario
          ? "Ingrese su contrase\u00f1a actual."
          : "Ingrese la contrase\u00f1a de esta cuenta.",
      );
      return;
    }

    setVerificandoCorreo(true);
    setErrorCorreo("");
    setErrorPasswordCorreo("");
    setMensajeCorreo("");

    try {
      const result = await solicitarCambioCorreoUsuario(inicial.id, {
        nuevoCorreo: correo,
        passwordActual: passwordCorreoUsuario,
      });
      setPasswordCorreoUsuario("");
      setMensajeCorreo(result?.message || "C\u00f3digo enviado al nuevo correo.");
    } catch (err) {
      const message = sanitizeUserFacingError(err?.message || "No se pudo enviar el c\u00f3digo.");
      if (message.toLowerCase().includes("contrase\u00f1a")) {
        setErrorPasswordCorreo(message);
      } else {
        setErrorCorreo(message);
      }
    } finally {
      setVerificandoCorreo(false);
    }
  }

  async function handleConfirmarCodigoCorreo() {
    const correo = correoForm.trim().toLowerCase();
    const token = codigoVerificacion.trim();
    if (!correo || !token) {
      setErrorCorreo("Ingrese el correo y el c\u00f3digo recibido.");
      return;
    }

    setVerificandoCorreo(true);
    setErrorCorreo("");
    setMensajeCorreo("");

    try {
      const actualizado = await confirmarCambioCorreoUsuario(inicial.id, { nuevoCorreo: correo, token });
      setCorreoVerificado(true);
      setCodigoVerificacion("");
      setMensajeCorreo("Correo verificado y actualizado.");
      form.setFieldValue("correo", actualizado?.correo || correo);
      setCorreoForm(actualizado?.correo || correo);
      if (actualizado?.id) {
        onActualizado({ ...actualizado, soloActualizarLista: true });
      }
    } catch (err) {
      setErrorCorreo(err?.message || "No se pudo verificar el correo.");
    } finally {
      setVerificandoCorreo(false);
    }
  }

  const inputCls =
    "w-full rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-none outline-none transition focus:border-slate-400 focus:bg-white focus:shadow-none focus:ring-0 focus:outline-none";

  return (
    <form onSubmit={handleSubmit} className="usuarios-form space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Nombre</label>
        <form.Field name="nombre">
          {(field) => (
            <>
              <input
                className={`${inputCls} ${fieldErrors.nombre ? "border-red-500 focus:border-red-500" : ""}`}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => {
                  setFieldErrors((prev) => ({ ...prev, nombre: "" }));
                  field.handleChange(event.target.value.slice(0, MAX_NOMBRE_USUARIO));
                }}
                maxLength={MAX_NOMBRE_USUARIO}
                required
                disabled={!inicial && pasoCreacion === "codigo"}
              />
              {fieldErrors.nombre ? <p className="mt-1 text-xs text-red-600">{fieldErrors.nombre}</p> : null}
            </>
          )}
        </form.Field>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Correo</label>
        <form.Field name="correo">
          {(field) => (
            <input
              type="email"
              className={inputCls}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => {
                field.handleChange(event.target.value);
                setCorreoForm(event.target.value);
              }}
              required
              disabled={!inicial && pasoCreacion === "codigo"}
            />
          )}
        </form.Field>
        {inicial && correoCambio ? (
          <div className="mt-3 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs text-slate-700">{"El correo cambi\u00f3. Debe verificar el nuevo correo antes de guardar otros cambios."}</p>
            <label className="block text-xs font-medium text-slate-600">
              {editandoPropioUsuario ? "Su contrase\u00f1a actual" : "Contrase\u00f1a de esta cuenta"}
              <input
                type="password"
                className={`${inputCls} mt-1 ${errorPasswordCorreo ? "border-red-500 focus:border-red-500" : ""}`}
                value={passwordCorreoUsuario}
                onChange={(e) => {
                  setErrorPasswordCorreo("");
                  setPasswordCorreoUsuario(e.target.value.slice(0, MAX_PASSWORD));
                }}
                maxLength={MAX_PASSWORD}
                placeholder={editandoPropioUsuario ? "Requerida para cambiar el correo" : "Contrase\u00f1a del usuario"}
              />
              {errorPasswordCorreo ? <p className="mt-1 text-xs text-red-600">{errorPasswordCorreo}</p> : null}
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={handleSolicitarCodigoCorreo}
                disabled={verificandoCorreo}
                className={`${btnNegro} text-xs sm:py-1.5`}
              >{"Enviar c\u00f3digo"}</button>
            </div>
            <input
              className={inputCls}
              value={codigoVerificacion}
              onChange={(e) => setCodigoVerificacion(e.target.value)}
              placeholder={"C\u00f3digo de verificaci\u00f3n"}
            />
            <button
              type="button"
              onClick={handleConfirmarCodigoCorreo}
              disabled={verificandoCorreo}
              className={`${adminBtnCancel} text-xs sm:py-1.5`}
            >
              Verificar correo
            </button>
          </div>
        ) : null}
        {mensajeCorreo ? <p className="mt-2 text-xs text-emerald-700">{mensajeCorreo}</p> : null}
        {errorCorreo ? <p className="mt-2 text-xs text-red-600">{errorCorreo}</p> : null}
      </div>
      {!inicial && pasoCreacion === "codigo" ? (
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">{"C\u00f3digo de verificaci\u00f3n"}</label>
          <input
            className={inputCls}
            value={codigoVerificacion}
            onChange={(e) => setCodigoVerificacion(e.target.value)}
            placeholder={"6 d\u00edgitos"}
            required
          />
        </div>
      ) : null}
      {(!inicial && pasoCreacion === "datos") || inicial ? (
        <>
          {!inicial || editandoPropioUsuario ? (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  {"Contrase\u00f1a"} {inicial && <span className="text-slate-400">(opcional)</span>}
                </label>
                <form.Field name="passwordHash">
                  {(field) => (
                    <>
                      <input
                        type="password"
                        className={`${inputCls} ${fieldErrors.passwordHash ? "border-red-500 focus:border-red-500" : ""}`}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => {
                          setFieldErrors((prev) => ({ ...prev, passwordHash: "" }));
                          field.handleChange(event.target.value.slice(0, MAX_PASSWORD));
                        }}
                        maxLength={MAX_PASSWORD}
                        required={!inicial}
                        placeholder={inicial ? "Dejar vac\u00edo para no cambiar" : ""}
                      />
                      {fieldErrors.passwordHash ? (
                        <p className="mt-1 text-xs text-red-600">{fieldErrors.passwordHash}</p>
                      ) : null}
                    </>
                  )}
                </form.Field>
              </div>
              {inicial ? (
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">{"Contrase\u00f1a actual"}</label>
                  <form.Field name="passwordActual">
                    {(field) => (
                      <>
                        <input
                          type="password"
                          className={`${inputCls} ${fieldErrors.passwordActual ? "border-red-500 focus:border-red-500" : ""}`}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) => {
                            setFieldErrors((prev) => ({ ...prev, passwordActual: "" }));
                            field.handleChange(event.target.value.slice(0, MAX_PASSWORD));
                          }}
                          maxLength={MAX_PASSWORD}
                          placeholder={"Requerida si cambia la contrase\u00f1a"}
                        />
                        {fieldErrors.passwordActual ? (
                          <p className="mt-1 text-xs text-red-600">{fieldErrors.passwordActual}</p>
                        ) : null}
                      </>
                    )}
                  </form.Field>
                </div>
              ) : null}
            </>
          ) : (
            <p className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-500">{"Solo puede cambiar su propia contrase\u00f1a."}</p>
          )}
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-600">Roles</label>
            {puedeEditarRoles ? (
              <form.Field name="roles">
                {(field) => {
                  const selectedRoles = Array.isArray(field.state.value) ? field.state.value : [];
                  const toggleRol = (rol) => {
                    field.handleChange(
                      selectedRoles.includes(rol)
                        ? selectedRoles.filter((actual) => actual !== rol)
                        : [...selectedRoles, rol],
                    );
                  };

                  return (
                    <div className="flex flex-wrap gap-2">
                      {ROLES_DISPONIBLES.map((rol) => (
                        <button
                          key={rol}
                          type="button"
                          onClick={() => toggleRol(rol)}
                          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                            selectedRoles.includes(rol)
                              ? claseRol(rol)
                              : "border border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                          }`}
                        >
                          {rol}
                        </button>
                      ))}
                    </div>
                  );
                }}
              </form.Field>
            ) : (
              <form.Field name="roles">
                {(field) => (
                  <div className="flex flex-wrap gap-2">
                    {(Array.isArray(field.state.value) ? field.state.value : []).map((rol) => (
                      <BadgeRol key={rol} rol={rol} />
                    ))}
                  </div>
                )}
              </form.Field>
            )}
          </div>
        </>
      ) : null}

      {fieldErrors.formulario ? <p className="text-xs text-red-600">{fieldErrors.formulario}</p> : null}

      <div className="flex flex-row flex-wrap justify-end gap-2 pt-2">
        <AdminModalActions
          onCancel={onCancelar}
          primaryDisabled={cargando || verificandoCorreo}
          primaryClassName={btnNegro}
          cancelClassName={btnCancelarGris}
          primaryLabel={
            cargando || verificandoCorreo
              ? "Procesando…"
              : !inicial
                ? pasoCreacion === "datos"
                  ? "Enviar código al correo"
                  : "Crear usuario"
                : "Guardar cambios"
          }
        />
      </div>
    </form>
  );
}


const accionBtnBase =
  "inline-flex items-center justify-center gap-1 rounded-full border text-[11px] font-semibold leading-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1";

function mapUsuario(item) {
  const estado = String(item?.estado ?? item?.Estado ?? "").trim().toLowerCase();
  return {
    ...item,
    id: item?.id ?? item?.Id,
    nombre: item?.nombre ?? item?.Nombre ?? "",
    correo: item?.correo ?? item?.Correo ?? "",
    estado: estado === "activo" ? "activo" : "inactivo",
    roles: Array.isArray(item?.roles) ? item.roles : Array.isArray(item?.Roles) ? item.Roles : [],
  };
}

function esUsuarioActivo(estado) {
  return String(estado ?? "").trim().toLowerCase() === "activo";
}

function AccionesUsuario({
  usuario,
  puedeCambiarEstado,
  toggleando,
  onEditar,
  onToggle,
  variant = "table",
}) {
  const esInactivo = !esUsuarioActivo(usuario.estado);
  const esMovil = variant === "mobile";

  const editarCls = `${accionBtnBase} border-slate-950 bg-slate-950 text-white hover:border-neutral-700 hover:bg-neutral-700 active:border-neutral-700 active:bg-neutral-700 focus-visible:ring-slate-400`;
  const toggleCls = `${accionBtnBase} ${
    esInactivo
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus-visible:ring-emerald-300"
      : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 focus-visible:ring-rose-300"
  }`;

  const toggleLabel = toggleando === usuario.id
    ? "..."
    : esInactivo
      ? "Activar"
      : "Inactivar";

  if (esMovil) {
    return (
      <div className="flex gap-1.5">
        <button type="button" onClick={onEditar} className={`${editarCls} h-8 px-2.5`}>
          <Pencil className="size-3 shrink-0" aria-hidden="true" />
          <span>Editar</span>
        </button>
        <button
          type="button"
          onClick={onToggle}
          disabled={toggleando === usuario.id || !puedeCambiarEstado}
          title={!puedeCambiarEstado ? "Solo SuperAdmin puede cambiar estado." : ""}
          className={`${toggleCls} h-8 px-2.5 disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <Power className="size-3 shrink-0" aria-hidden="true" />
          <span>{toggleLabel}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-1">
      <button type="button" onClick={onEditar} className={`${editarCls} h-7 px-2`}>
        <Pencil className="size-3 shrink-0" aria-hidden="true" />
        <span>Editar</span>
      </button>
      <button
        type="button"
        onClick={onToggle}
        disabled={toggleando === usuario.id || !puedeCambiarEstado}
        title={!puedeCambiarEstado ? "Solo SuperAdmin puede cambiar estado." : ""}
        className={`${toggleCls} h-7 px-2 disabled:cursor-not-allowed disabled:opacity-50`}
      >
        <Power className="size-3 shrink-0" aria-hidden="true" />
        <span>{toggleLabel}</span>
      </button>
    </div>
  );
}


const AdminUsuarios = () => {
  const actor = (() => {
    return getActiveSessionUser();
  })();
  const actorId = Number(actor?.id) || null;
  const actorRoles = Array.isArray(actor?.roles) ? actor.roles : [];
  const esSuperAdmin = tienePermiso(actorRoles, "editar_usuarios");

  const [usuarios, setUsuarios]   = useState([]);
  const [cargando, setCargando]   = useState(true);
  const [error, setError]         = useState(null);
  const [modalCrear, setModalCrear]   = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState(null); // objeto usuario
  const [guardando, setGuardando] = useState(false);
  const [toggleando, setToggleando] = useState(null); // id en proceso
  const [sorting, setSorting] = useState([]);
  const { showLoading, loadingMessage } = useAdminPageGate('/admin/usuarios', !cargando);
  const {
    busqueda,
    setBusqueda,
    valoresFiltro,
    setValorFiltro,
    filtrados: usuariosFiltrados,
    limpiar,
    hayFiltrosActivos,
    total,
    visibles,
  } = useAdminListaFiltros(usuarios, {
    buscarEn: (usuario) => [
      usuario.nombre,
      usuario.correo,
      usuario.estado,
      ...(Array.isArray(usuario.roles) ? usuario.roles : []),
    ],
    filtrosConfig: [
      {
        id: "rol",
        aplicar: (lista, valor) =>
          !valor || valor === "todos"
            ? lista
            : lista.filter((usuario) => (usuario.roles || []).includes(valor)),
      },
      { id: "estado", obtenerValor: (usuario) => usuario.estado },
    ],
  });

  const {
    page,
    setPage,
    pageItems: usuariosPagina,
    totalPages,
  } = useAdminPaginacion(usuariosFiltrados);

  const rolesDisponibles = useMemo(() => {
    const vistos = new Set();
    usuarios.forEach((usuario) => {
      (usuario.roles || []).forEach((rol) => {
        if (rol) vistos.add(rol);
      });
    });
    return [...vistos];
  }, [usuarios]);

  async function cargar() {
    try {
      setCargando(true);
      setError(null);
      const data = await obtenerUsuarios();
      setUsuarios(Array.isArray(data) ? data.map(mapUsuario) : []);
    } catch {
      setError("No se pudieron cargar los usuarios.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    let activo = true;

    obtenerUsuarios()
      .then((data) => {
        if (activo) setUsuarios(Array.isArray(data) ? data.map(mapUsuario) : []);
      })
      .catch(() => {
        if (activo) setError("No se pudieron cargar los usuarios.");
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  async function handleCrear(usuario) {
    setUsuarios((prev) => [...prev, usuario]);
    setModalCrear(false);
  }

  async function handleEditar(form) {
    if (form?.soloActualizarLista) {
      setUsuarios((prev) => prev.map((u) => (u.id === form.id ? form : u)));
      setUsuarioEditar(form);
      return;
    }

    try {
      setGuardando(true);
      const cambios = { ...form };
      if (!cambios.passwordHash) {
        delete cambios.passwordHash;
        delete cambios.passwordActual;
      }
      const actualizado = await actualizarUsuario(usuarioEditar.id, cambios);
      setUsuarios((prev) => prev.map((u) => (u.id === actualizado.id ? actualizado : u)));
      setUsuarioEditar(null);
    } catch (err) {
      throw err;
    } finally {
      setGuardando(false);
    }
  }

  const handleToggle = useCallback(async (usuario) => {
    const esMismoUsuario = actorId !== null && Number(usuario.id) === actorId;
    if (!esSuperAdmin) {
      alert("Solo un SuperAdmin puede inactivar o activar usuarios.");
      return;
    }
    if (esMismoUsuario) {
      alert("No puede inactivarse a s\u00ed mismo.");
      return;
    }

    try {
      setToggleando(usuario.id);
      const nuevoEstado = esUsuarioActivo(usuario.estado) ? "inactivo" : "activo";
      const actualizado = await cambiarEstadoUsuario(usuario.id, nuevoEstado);
      setUsuarios((prev) => prev.map((u) => (u.id === actualizado.id ? mapUsuario(actualizado) : u)));
    } catch (err) {
      alert(err?.message || "Error al cambiar el estado.");
    } finally {
      setToggleando(null);
    }
  }, [actorId, esSuperAdmin]);

  const columns = useMemo(() => [
    {
      accessorKey: "nombre",
      header: "Nombre",
      cell: ({ getValue }) => (
        <span className="font-medium text-slate-800">{getValue()}</span>
      ),
    },
    {
      accessorKey: "correo",
      header: "Email",
      cell: ({ getValue }) => (
        <span className="text-slate-500">{getValue()}</span>
      ),
    },
    {
      accessorKey: "roles",
      header: "Roles",
      enableSorting: false,
      cell: ({ getValue }) => (
        <div className="flex flex-wrap gap-1">
          {(Array.isArray(getValue()) ? getValue() : []).map((rol) => <BadgeRol key={rol} rol={rol} />)}
        </div>
      ),
    },
    {
      accessorKey: "estado",
      header: "Estado",
      cell: ({ getValue }) => {
        const estado = getValue();
        return (
          <span className={`text-xs font-medium ${
            esUsuarioActivo(estado) ? "text-green-700" : "text-red-600"
          }`}>
            {esUsuarioActivo(estado) ? "Habilitado" : "Deshabilitado"}
          </span>
        );
      },
    },
    {
      id: "acciones",
      header: "Acciones",
      enableSorting: false,
      cell: ({ row }) => {
        const usuario = row.original;
        const esMismoUsuario = actorId !== null && Number(usuario.id) === actorId;
        const puedeCambiarEstado = esSuperAdmin && !esMismoUsuario;

        return (
          <AccionesUsuario
            usuario={usuario}
            puedeCambiarEstado={puedeCambiarEstado}
            toggleando={toggleando}
            onEditar={() => setUsuarioEditar(usuario)}
            onToggle={() => handleToggle(usuario)}
          />
        );
      },
    },
  ], [actorId, esSuperAdmin, handleToggle, toggleando]);

  // TanStack Table returns instance helpers by design; the warning is expected with React Compiler.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: usuariosPagina,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <AdminPageGate showLoading={showLoading} message={loadingMessage}>
    <AdminLayout>
      {/* Contenido */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Administrar usuarios</h1>
            <p className="mt-0.5 text-sm text-slate-600">{"Gesti\u00f3n de acceso y roles"}</p>
          </div>
          <button
            onClick={() => setModalCrear(true)}
            className="w-full rounded-full border border-slate-950 bg-slate-950 px-5 py-2 text-sm font-semibold text-white transition hover:border-neutral-700 hover:bg-neutral-700 active:border-neutral-700 active:bg-neutral-700 sm:w-auto"
          >
            Nuevo usuario +
          </button>
        </div>

        {!cargando && !error ? (
          <AdminListaToolbar
            busqueda={busqueda}
            onBusquedaChange={setBusqueda}
            placeholder="Buscar por nombre, correo o rol..."
            total={total}
            visibles={visibles}
            hayFiltrosActivos={hayFiltrosActivos}
            onLimpiar={limpiar}
            filtros={[
              {
                id: "rol",
                label: "Rol",
                value: valoresFiltro.rol || "todos",
                onChange: (valor) => setValorFiltro("rol", valor),
                opciones: [
                  { value: "todos", label: "Todos" },
                  ...rolesDisponibles.map((rol) => ({ value: rol, label: rol })),
                ],
              },
              {
                id: "estado",
                label: "Estado",
                value: valoresFiltro.estado || "todos",
                onChange: (valor) => setValorFiltro("estado", valor),
                opciones: [
                  { value: "todos", label: "Todos" },
                  { value: "Habilitado", label: "Habilitado" },
                  { value: "Deshabilitado", label: "Deshabilitado" },
                ],
              },
            ]}
          />
        ) : null}

        {cargando ? (
          <div className="flex items-center justify-center py-16 text-sm text-slate-600">
            Cargando usuarios…
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-16 text-sm text-red-500">
            {error}
            <button onClick={cargar} className="text-slate-600 underline">Reintentar</button>
          </div>
        ) : usuarios.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-600">No hay usuarios registrados.</div>
        ) : usuariosFiltrados.length === 0 ? (
          <AdminListaVacia onLimpiar={limpiar} />
        ) : (
          <>
            <div className="admin-table-shell hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th key={header.id}>
                          {header.column.getCanSort() ? (
                            <button
                              type="button"
                              onClick={header.column.getToggleSortingHandler()}
                              className="admin-th-sort"
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              <span className="admin-th-sort__icon" aria-hidden="true">
                                {header.column.getIsSorted() === "asc" ? "▲" : header.column.getIsSorted() === "desc" ? "▼" : "↕"}
                              </span>
                            </button>
                          ) : (
                            flexRender(header.column.columnDef.header, header.getContext())
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="transition hover:bg-slate-50/60">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-6 py-3.5">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 md:hidden">
              {usuariosPagina.map((usuario) => {
                const esMismoUsuario = actorId !== null && Number(usuario.id) === actorId;
                const puedeCambiarEstado = esSuperAdmin && !esMismoUsuario;

                return (
                  <article key={usuario.id} className="space-y-3 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-slate-900">{usuario.nombre}</h3>
                        <p className="mt-0.5 truncate text-sm text-slate-500">{usuario.correo}</p>
                      </div>
                      <span className={`shrink-0 text-xs font-medium ${
                        esUsuarioActivo(usuario.estado) ? "text-green-700" : "text-red-600"
                      }`}>
                        {esUsuarioActivo(usuario.estado) ? "Habilitado" : "Deshabilitado"}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {(Array.isArray(usuario.roles) ? usuario.roles : []).map((rol) => (
                        <BadgeRol key={rol} rol={rol} />
                      ))}
                    </div>

                    <AccionesUsuario
                      usuario={usuario}
                      puedeCambiarEstado={puedeCambiarEstado}
                      toggleando={toggleando}
                      onEditar={() => setUsuarioEditar(usuario)}
                      onToggle={() => handleToggle(usuario)}
                      variant="mobile"
                    />
                  </article>
                );
              })}
            </div>
            <AdminPaginacion
              page={page}
              totalPages={totalPages}
              total={usuariosFiltrados.length}
              onChange={setPage}
              label={"Paginaci\u00f3n de usuarios"}
            />
          </>
        )}
      </section>

      {modalCrear ? (
        <Modal titulo="Nuevo usuario" onClose={() => setModalCrear(false)}>
          <FormUsuario
            onCreado={handleCrear}
            onActualizado={handleEditar}
            onCancelar={() => setModalCrear(false)}
            cargando={guardando}
            setCargando={setGuardando}
            puedeEditarRoles={esSuperAdmin}
          />
        </Modal>
      ) : null}
      {usuarioEditar ? (
        <Modal titulo="Editar usuario" onClose={() => setUsuarioEditar(null)}>
          <FormUsuario
            inicial={usuarioEditar}
            onCreado={handleCrear}
            onActualizado={handleEditar}
            onCancelar={() => setUsuarioEditar(null)}
            cargando={guardando}
            setCargando={setGuardando}
            puedeEditarRoles={esSuperAdmin}
          />
        </Modal>
      ) : null}
    </AdminLayout>
    </AdminPageGate>
  );
};

export default AdminUsuarios;
