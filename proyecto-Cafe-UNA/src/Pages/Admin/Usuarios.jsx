<<<<<<< HEAD
<<<<<<< HEAD
﻿import { useEffect, useState } from "react";
import { AdminLayout } from "./layouts/AdminLayout";
=======
=======
>>>>>>> a084ec307cbdea781d7d1484d190be3701275d4a
import { useEffect, useState } from "react";
import { AdminLayout } from "../../layouts/AdminLayout";
>>>>>>> a084ec307cbdea781d7d1484d190be3701275d4a
import {
  obtenerUsuarios,
  crearUsuario,
  actualizarUsuario,
  toggleEstadoUsuario,
} from "../../services/usuariosServices";

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

// ─── Formulario de usuario (crear / editar) ───────────────────────────────────
const ROLES_DISPONIBLES = ["SuperAdmin", "Admin", "Usuario", "Cliente"];

function FormUsuario({ inicial, onGuardar, onCancelar, cargando }) {
  const [form, setForm] = useState({
    nombre: inicial?.nombre ?? "",
    correo: inicial?.correo ?? "",
    passwordHash: inicial?.passwordHash ?? "",
    roles: inicial?.roles ?? ["Usuario"],
  });

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  function toggleRol(rol) {
    setForm((f) => ({
      ...f,
      roles: f.roles.includes(rol)
        ? f.roles.filter((r) => r !== rol)
        : [...f.roles, rol],
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.nombre.trim() || !form.correo.trim()) return;
    onGuardar(form);
  }

  const inputCls =
    "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Nombre</label>
        <input className={inputCls} value={form.nombre} onChange={set("nombre")} required />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Correo</label>
        <input type="email" className={inputCls} value={form.correo} onChange={set("correo")} required />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Contraseña {inicial && <span className="text-slate-400">(secreta)</span>}
        </label>
        <input
          type="password"
          className={inputCls}
          value={form.passwordHash}
          onChange={set("passwordHash")}
          required={!inicial}
          placeholder={inicial ? "••••••••" : ""}
        />
      </div>
      <div>
        <label className="mb-2 block text-xs font-medium text-slate-600">Roles</label>
        <div className="flex flex-wrap gap-2">
          {ROLES_DISPONIBLES.map((rol) => (
            <button
              key={rol}
              type="button"
              onClick={() => toggleRol(rol)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                form.roles.includes(rol)
                  ? "bg-slate-800 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              {rol}
            </button>
          ))}
        </div>
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

// ─── Badge de rol ─────────────────────────────────────────────────────────────
const colorRol = {
  SuperAdmin: "bg-violet-100 text-violet-700",
  Admin:      "bg-blue-100 text-blue-700",
  Cliente:    "bg-amber-100 text-amber-700",
  Usuario:    "bg-slate-100 text-slate-600",
};

function BadgeRol({ rol }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${colorRol[rol] ?? "bg-slate-100 text-slate-600"}`}>
      {rol}
    </span>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
const AdminUsuarios = () => {
  const [usuarios, setUsuarios]   = useState([]);
  const [cargando, setCargando]   = useState(true);
  const [error, setError]         = useState(null);
  const [modalCrear, setModalCrear]   = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState(null); // objeto usuario
  const [guardando, setGuardando] = useState(false);
  const [toggleando, setToggleando] = useState(null); // id en proceso

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

  async function handleToggle(usuario) {
    try {
      setToggleando(usuario.id);
      const actualizado = await toggleEstadoUsuario(usuario.id);
      setUsuarios((prev) => prev.map((u) => (u.id === actualizado.id ? actualizado : u)));
    } catch {
      alert("Error al cambiar el estado.");
    } finally {
      setToggleando(null);
    }
  }

  return (
    <AdminLayout>
      {/* Modales */}
      {modalCrear && (
        <Modal titulo="Nuevo usuario" onClose={() => setModalCrear(false)}>
          <FormUsuario onGuardar={handleCrear} onCancelar={() => setModalCrear(false)} cargando={guardando} />
        </Modal>
      )}
      {usuarioEditar && (
        <Modal titulo="Editar usuario" onClose={() => setUsuarioEditar(null)}>
          <FormUsuario
            inicial={usuarioEditar}
            onGuardar={handleEditar}
            onCancelar={() => setUsuarioEditar(null)}
            cargando={guardando}
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
            className="rounded-lg bg-green-100 px-4 py-2 text-sm font-medium text-green-700 transition hover:bg-green-200"
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
                <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-3">Nombre</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Roles</th>
                  <th className="px-6 py-3">Estado</th>
                  <th className="px-6 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {usuarios.map((u) => (
                  <tr key={u.id} className="transition hover:bg-slate-50/60">
                    <td className="px-6 py-3.5 font-medium text-slate-800">{u.nombre}</td>
                    <td className="px-6 py-3.5 text-slate-500">{u.correo}</td>
                    <td className="px-6 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {u.roles?.map((r) => <BadgeRol key={r} rol={r} />)}
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        u.estado === "activo"
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-600"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${u.estado === "activo" ? "bg-green-500" : "bg-red-400"}`} />
                        {u.estado === "activo" ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        {/* Editar */}
                        <button
                          onClick={() => setUsuarioEditar(u)}
                          className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-100"
                        >
                          Editar
                        </button>
                        {/* Toggle activo/inactivo */}
                        <button
                          onClick={() => handleToggle(u)}
                          disabled={toggleando === u.id}
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
                            u.estado === "activo"
                              ? "bg-red-50 text-red-600 hover:bg-red-100"
                              : "bg-green-50 text-green-700 hover:bg-green-100"
                          }`}
                        >
                          {toggleando === u.id
                            ? "…"
                            : u.estado === "activo"
                            ? "Inactivar"
                            : "Activar"}
                        </button>
                      </div>
                    </td>
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
