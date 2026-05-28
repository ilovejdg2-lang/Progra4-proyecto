import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "@tanstack/react-form";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { AdminLayout } from "../layouts/AdminLayout";
import {
  obtenerUsuarios,
  crearUsuario,
  actualizarUsuario,
  toggleEstadoUsuario,
} from "../../../services/usuariosServices";
import { getActiveSessionUser } from "../../../services/sessionService";

// ─── Modal reutilizable ───────────────────────────────────────────────────────
function Modal({ titulo, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{titulo}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
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

function FormUsuario({ inicial, onGuardar, onCancelar, cargando, puedeEditarRoles = false }) {
  const actor = (() => {
    return getActiveSessionUser();
  })();
  const actorId = Number(actor?.id) || null;
  const editandoPropioUsuario = Boolean(inicial?.id) && actorId !== null && Number(inicial.id) === actorId;

  const form = useForm({
    defaultValues: {
      nombre: inicial?.nombre ?? "",
      correo: inicial?.correo ?? "",
      passwordHash: inicial?.passwordHash ?? "",
      roles: inicial?.roles ?? ["Usuario"],
    },
    onSubmit: ({ value }) => {
      const payload = {
        ...value,
        nombre: value.nombre.trim(),
        correo: value.correo.trim(),
        roles: Array.isArray(value.roles) && value.roles.length > 0 ? value.roles : ["Usuario"],
      };

      if (!payload.nombre || !payload.correo) return;
      onGuardar(payload);
    },
  });

  function handleSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit();
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
              onChange={(event) => field.handleChange(event.target.value)}
              required
            />
          )}
        </form.Field>
      </div>
      {!inicial || editandoPropioUsuario ? (
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Contraseña {inicial && <span className="text-slate-400">(secreta)</span>}
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
                placeholder={inicial ? "••••••••" : ""}
              />
            )}
          </form.Field>
        </div>
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

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancelar}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={cargando}
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
        >
          {cargando ? "Guardando…" : inicial ? "Guardar cambios" : "Crear usuario"}
        </button>
      </div>
    </form>
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

  async function handleCrear(form) {
    try {
      setGuardando(true);
      const nuevo = await crearUsuario(form);
      setUsuarios((prev) => [...prev, nuevo]);
      setModalCrear(false);
    } catch {
      alert("Error al crear usuario.");
    } finally {
      setGuardando(false);
    }
  }

  async function handleEditar(form) {
    try {
      setGuardando(true);
      const cambios = { ...form };
      // Si la contraseña quedó vacía, no la actualizamos
      if (!cambios.passwordHash) delete cambios.passwordHash;
      const actualizado = await actualizarUsuario(usuarioEditar.id, cambios);
      setUsuarios((prev) => prev.map((u) => (u.id === actualizado.id ? actualizado : u)));
      setUsuarioEditar(null);
    } catch {
      alert("Error al editar usuario.");
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setUsuarioEditar(usuario)}
              className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-100"
            >
              Editar
            </button>
            <button
              onClick={() => handleToggle(usuario)}
              disabled={toggleando === usuario.id || !puedeCambiarEstado || usuario.estado !== "activo"}
              title={
                !esSuperAdmin
                  ? "Solo SuperAdmin puede cambiar estado."
                  : esMismoUsuario
                    ? "No puede inactivarse a sí mismo."
                    : usuario.estado !== "activo"
                      ? "Solo se permite inactivar usuarios activos."
                      : ""
              }
              className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-50"
            >
              {toggleando === usuario.id ? "..." : "Inactivar"}
            </button>
          </div>
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
          <FormUsuario onGuardar={handleCrear} onCancelar={() => setModalCrear(false)} cargando={guardando} puedeEditarRoles={esSuperAdmin} />
        </Modal>
      )}
      {usuarioEditar && (
        <Modal titulo="Editar usuario" onClose={() => setUsuarioEditar(null)}>
          <FormUsuario
            inicial={usuarioEditar}
            onGuardar={handleEditar}
            onCancelar={() => setUsuarioEditar(null)}
            cargando={guardando}
            puedeEditarRoles={esSuperAdmin}
          />
        </Modal>
      )}

      {/* Contenido */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Administrar usuarios</h1>
            <p className="mt-0.5 text-sm text-slate-500">Gestión de acceso y roles</p>
          </div>
          <button
            onClick={() => setModalCrear(true)}
            className="rounded-full bg-amber-900 px-5 py-2 text-sm font-semibold text-amber-50 transition hover:bg-amber-800"
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
          <div className="overflow-x-auto">
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
        )}
      </section>
    </AdminLayout>
  );
};

export default AdminUsuarios;
