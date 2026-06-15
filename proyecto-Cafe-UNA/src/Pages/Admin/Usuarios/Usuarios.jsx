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
import { AdminModal, AdminModalBody, AdminModalHeader } from "../../../Components/Admin/ui/AdminModal";
import {
  obtenerUsuarios,
  actualizarUsuario,
  toggleEstadoUsuario,
  solicitarCreacionUsuario,
  confirmarCreacionUsuario,
  solicitarCambioCorreoUsuario,
  confirmarCambioCorreoUsuario,
} from "../../../services/usuariosServices";
import { getActiveSessionUser } from "../../../services/sessionService";

function Modal({ titulo, onClose, children }) {
  return (
    <AdminModal open onClose={onClose} maxWidth="max-w-lg" labelledBy="admin-usuarios-modal-title">
      <AdminModalHeader>
        <h2 id="admin-usuarios-modal-title" className="text-lg font-semibold text-slate-900">{titulo}</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          aria-label="Cerrar"
        >
          <X className="size-5" />
        </button>
      </AdminModalHeader>
      <AdminModalBody>{children}</AdminModalBody>
    </AdminModal>
  );
}

// ─── Badge de rol ─────────────────────────────────────────────────────────────
const colorRol = {
  Superadministrador: "border border-amber-300 bg-amber-200 text-amber-950",
  SuperAdmin:         "border border-amber-300 bg-amber-200 text-amber-950",
  Administración:     "border border-emerald-300 bg-emerald-100 text-emerald-900",
  Admin:              "border border-emerald-300 bg-emerald-100 text-emerald-900",
  Cliente:            "bg-orange-100 text-orange-700",
  Usuario:            "bg-slate-100 text-slate-500",
};

function BadgeRol({ rol }) {
  return (
    <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${colorRol[rol] ?? "bg-slate-100 text-slate-500"}`}>
      {rol}
    </span>
  );
}

// ─── Formulario de usuario (crear / editar) ───────────────────────────────────
const ROLES_DISPONIBLES = ["SuperAdmin", "Admin", "Usuario", "Cliente"];

function FormUsuario({ inicial, onCreado, onActualizado, onCancelar, cargando, setCargando, puedeEditarRoles = false }) {
  const actor = (() => {
    return getActiveSessionUser();
  })();
  const actorId = Number(actor?.id) || null;
  const editandoPropioUsuario = Boolean(inicial?.id) && actorId !== null && Number(inicial.id) === actorId;
  const correoOriginal = (inicial?.correo ?? "").trim().toLowerCase();

  const [pasoCreacion, setPasoCreacion] = useState("datos");
  const [codigoVerificacion, setCodigoVerificacion] = useState("");
  const [correoVerificado, setCorreoVerificado] = useState(true);
  const [mensajeCorreo, setMensajeCorreo] = useState("");
  const [errorCorreo, setErrorCorreo] = useState("");
  const [verificandoCorreo, setVerificandoCorreo] = useState(false);
  const [correoForm, setCorreoForm] = useState(inicial?.correo ?? "");

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

      if (!payload.nombre || !payload.correo) return;

      if (!inicial) {
        if (pasoCreacion === "datos") {
          if (!value.passwordHash?.trim()) {
            setErrorCorreo("La contraseña es obligatoria.");
            return;
          }
          setCargando(true);
          setErrorCorreo("");
          try {
            const result = await solicitarCreacionUsuario({
              ...payload,
              passwordHash: value.passwordHash,
            });
            setMensajeCorreo(result?.message || "Código enviado al correo.");
            setPasoCreacion("codigo");
          } catch (err) {
            setErrorCorreo(err?.message || "No se pudo enviar el código.");
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
          setErrorCorreo(err?.message || "No se pudo crear el usuario.");
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
        cambios.passwordHash = value.passwordHash;
        cambios.passwordActual = value.passwordActual;
      }

      setCargando(true);
      try {
        await onActualizado(cambios);
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
  }, [correoCambio, inicial]);

  async function handleSolicitarCodigoCorreo() {
    const correo = correoForm.trim().toLowerCase();
    if (!correo) {
      setErrorCorreo("Ingrese el nuevo correo.");
      return;
    }

    setVerificandoCorreo(true);
    setErrorCorreo("");
    setMensajeCorreo("");

    try {
      const result = await solicitarCambioCorreoUsuario(inicial.id, correo);
      setMensajeCorreo(result?.message || "Código enviado al nuevo correo.");
    } catch (err) {
      setErrorCorreo(err?.message || "No se pudo enviar el código.");
    } finally {
      setVerificandoCorreo(false);
    }
  }

  async function handleConfirmarCodigoCorreo() {
    const correo = correoForm.trim().toLowerCase();
    const token = codigoVerificacion.trim();
    if (!correo || !token) {
      setErrorCorreo("Ingrese el correo y el código recibido.");
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
    "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Nombre</label>
        <form.Field name="nombre">
          {(field) => (
            <input
              className={inputCls}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              required
              disabled={!inicial && pasoCreacion === "codigo"}
            />
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
          <div className="mt-3 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-slate-700">
              El correo cambió. Debe verificar el nuevo correo antes de guardar otros cambios.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={handleSolicitarCodigoCorreo}
                disabled={verificandoCorreo}
                className="w-full rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50 sm:w-auto sm:py-1.5"
              >
                Enviar código
              </button>
            </div>
            <input
              className={inputCls}
              value={codigoVerificacion}
              onChange={(e) => setCodigoVerificacion(e.target.value)}
              placeholder="Código de verificación"
            />
            <button
              type="button"
              onClick={handleConfirmarCodigoCorreo}
              disabled={verificandoCorreo}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50 sm:w-auto sm:py-1.5"
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
          <label className="mb-1 block text-xs font-medium text-slate-600">Código de verificación</label>
          <input
            className={inputCls}
            value={codigoVerificacion}
            onChange={(e) => setCodigoVerificacion(e.target.value)}
            placeholder="6 dígitos"
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
                  Contraseña {inicial && <span className="text-slate-400">(opcional)</span>}
                </label>
                <form.Field name="passwordHash">
                  {(field) => (
                    <input
                      type="password"
                      className={inputCls}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      required={!inicial}
                      placeholder={inicial ? "Dejar vacío para no cambiar" : ""}
                    />
                  )}
                </form.Field>
              </div>
              {inicial ? (
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Contraseña actual</label>
                  <form.Field name="passwordActual">
                    {(field) => (
                      <input
                        type="password"
                        className={inputCls}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        placeholder="Requerida si cambia la contraseña"
                      />
                    )}
                  </form.Field>
                </div>
              ) : null}
            </>
          ) : (
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
              Solo puede cambiar su propia contraseña.
            </p>
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
                              ? `${colorRol[rol] ?? "bg-slate-800 text-white"}`
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

      <div className="flex flex-col-reverse justify-end gap-2 pt-2 sm:flex-row">
        <button
          type="button"
          onClick={onCancelar}
          className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50 sm:w-auto"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={cargando || verificandoCorreo}
          className="w-full rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50 sm:w-auto"
        >
          {cargando || verificandoCorreo
            ? "Procesando…"
            : !inicial
              ? pasoCreacion === "datos"
                ? "Enviar código al correo"
                : "Crear usuario"
              : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}


const accionBtnBase =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1";

function AccionesUsuario({
  usuario,
  puedeCambiarEstado,
  toggleando,
  onEditar,
  onToggle,
  variant = "table",
}) {
  const esInactivo = usuario.estado !== "activo";
  const esMovil = variant === "mobile";

  const editarCls = `${accionBtnBase} border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 focus-visible:ring-amber-300`;
  const toggleCls = `${accionBtnBase} ${
    esInactivo
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus-visible:ring-emerald-300"
      : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 focus-visible:ring-rose-300"
  }`;

  const toggleLabel = toggleando === usuario.id
    ? "..."
    : esInactivo
      ? "Habilitar"
      : "Inhabilitar";

  if (esMovil) {
    return (
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onEditar} className={`${editarCls} min-h-10 px-2 py-2`}>
          <Pencil className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">Editar</span>
        </button>
        <button
          type="button"
          onClick={onToggle}
          disabled={toggleando === usuario.id || !puedeCambiarEstado}
          title={!puedeCambiarEstado ? "Solo SuperAdmin puede cambiar estado." : ""}
          className={`${toggleCls} min-h-10 px-2 py-2 disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <Power className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{toggleLabel}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="grid w-[11.5rem] grid-cols-2 gap-1.5">
      <button type="button" onClick={onEditar} className={`${editarCls} h-9 px-2.5`}>
        <Pencil className="size-3.5 shrink-0" aria-hidden="true" />
        <span>Editar</span>
      </button>
      <button
        type="button"
        onClick={onToggle}
        disabled={toggleando === usuario.id || !puedeCambiarEstado}
        title={!puedeCambiarEstado ? "Solo SuperAdmin puede cambiar estado." : ""}
        className={`${toggleCls} h-9 px-2.5 disabled:cursor-not-allowed disabled:opacity-50`}
      >
        <Power className="size-3.5 shrink-0" aria-hidden="true" />
        <span>{toggleLabel}</span>
      </button>
    </div>
  );
}


// ─── Página principal ─────────────────────────────────────────────────────────
const AdminUsuarios = () => {
  const actor = (() => {
    return getActiveSessionUser();
  })();
  const actorId = Number(actor?.id) || null;
  const actorRoles = Array.isArray(actor?.roles) ? actor.roles : [];
  const esSuperAdmin = actorRoles.includes("SuperAdmin");

  const [usuarios, setUsuarios]   = useState([]);
  const [cargando, setCargando]   = useState(true);
  const [error, setError]         = useState(null);
  const [modalCrear, setModalCrear]   = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState(null); // objeto usuario
  const [guardando, setGuardando] = useState(false);
  const [toggleando, setToggleando] = useState(null); // id en proceso
  const [sorting, setSorting] = useState([]);

  async function cargar() {
    try {
      setCargando(true);
      setError(null);
      const data = await obtenerUsuarios();
      setUsuarios(data);
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
        if (activo) setUsuarios(data);
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
      alert(err?.message || "Error al editar usuario.");
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
      alert("No puede inactivarse a sí mismo.");
      return;
    }

    try {
      setToggleando(usuario.id);
      const actualizado = await toggleEstadoUsuario(usuario.id);
      setUsuarios((prev) => prev.map((u) => (u.id === actualizado.id ? actualizado : u)));
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
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            estado === "activo"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-600"
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${estado === "activo" ? "bg-green-500" : "bg-red-400"}`} />
            {estado === "activo" ? "Activo" : "Inactivo"}
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
    data: usuarios,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <AdminLayout>
      {/* Modales */}
      {modalCrear && (
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
      )}
      {usuarioEditar && (
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
      )}

      {/* Contenido */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Administrar usuarios</h1>
            <p className="mt-0.5 text-sm text-slate-500">Gestión de acceso y roles</p>
          </div>
          <button
            onClick={() => setModalCrear(true)}
            className="w-full rounded-full bg-amber-900 px-5 py-2 text-sm font-semibold text-amber-50 transition hover:bg-amber-800 sm:w-auto"
          >
            Nuevo usuario +
          </button>
        </div>

        {/* Tabla */}
        {cargando ? (
          <div className="flex items-center justify-center py-16 text-sm text-slate-400">
            Cargando usuarios…
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-16 text-sm text-red-500">
            {error}
            <button onClick={cargar} className="text-slate-500 underline">Reintentar</button>
          </div>
        ) : usuarios.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400">No hay usuarios registrados.</div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id} className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {headerGroup.headers.map((header) => (
                        <th key={header.id} className="px-6 py-3">
                          {header.column.getCanSort() ? (
                            <button
                              type="button"
                              onClick={header.column.getToggleSortingHandler()}
                              className="inline-flex items-center gap-1 uppercase tracking-wide transition hover:text-slate-800"
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              <span className="text-[10px]">
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
              {usuarios.map((usuario) => {
                const esMismoUsuario = actorId !== null && Number(usuario.id) === actorId;
                const puedeCambiarEstado = esSuperAdmin && !esMismoUsuario;

                return (
                  <article key={usuario.id} className="space-y-3 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-slate-900">{usuario.nombre}</h3>
                        <p className="mt-0.5 truncate text-sm text-slate-500">{usuario.correo}</p>
                      </div>
                      <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        usuario.estado === "activo"
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-600"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${usuario.estado === "activo" ? "bg-green-500" : "bg-red-400"}`} />
                        {usuario.estado === "activo" ? "Activo" : "Inactivo"}
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
          </>
        )}
      </section>
    </AdminLayout>
  );
};

export default AdminUsuarios;
