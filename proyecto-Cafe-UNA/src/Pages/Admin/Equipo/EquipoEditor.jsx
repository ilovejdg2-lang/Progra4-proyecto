import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Mail, Pencil, Phone, Trash2, UserPlus, UserRound, X } from "lucide-react";

import { AdminModal, AdminModalActions, AdminModalBody, AdminModalFooter, AdminModalHeader } from "../../../Components/Admin/ui/AdminModal";
import { AdminListaVacia } from "../../../Components/Admin/ui/AdminListaToolbar";
import { AdminEditorConPreview } from "../../../Components/Admin/ui/AdminCmsPreview";
import { PersonaEquipo } from "../../AboutUs/EquipoSection";
import "../../AboutUs/AboutUs.css";
import { CampoLimitePalabras } from "../../../Components/Admin/ui/CampoLimitePalabras";
import { NumericInput } from "../../../Components/NumericInput/NumericInput";
import { ST } from "../../../Components/T/ST";
import { useTraducir } from "../../../hooks/useTraducir";
import { normalizarEquipo } from "../../../lib/aboutPageData";
import { esCorreoValido, limpiarCorreo, MENSAJE_CORREO_INVALIDO } from "../../../lib/correo";
import { filtrarEnteros } from "../../../lib/numericInput";
import { MAX_PALABRAS_TITULO } from "../../../lib/formLimits";
import { t } from "../../../lib/t";
import { asegurarCamposEnEspanol, camposParaVistaAdmin } from "../../../lib/traducir";
import { useIdioma } from "../../../lib/useIdioma";
import {
  actualizarMiembroEquipo,
  crearMiembroEquipo,
  eliminarMiembroEquipo,
  obtenerEquipo,
} from "../../../services/informacionService";

const CAMPOS_TRADUCIBLES = ["cargo"];
const MIEMBRO_VACIO = { nombre: "", cargo: "", correo: "", telefono: "", foto: "" };

const claseInput =
  "h-[var(--control-height)] w-full rounded-full border border-slate-200 bg-slate-50 px-4 text-[length:var(--text-body)] font-normal normal-case tracking-normal text-slate-950 outline-none transition focus:border-slate-400 focus:bg-white";
const claseEtiqueta = "grid gap-2 text-[length:var(--text-body)] font-bold uppercase tracking-wide text-slate-500";

function Avatar({ miembro, size = "h-12 w-12" }) {
  if (miembro.foto) {
    return <img src={miembro.foto} alt="" className={`${size} shrink-0 rounded-full object-cover ring-1 ring-slate-200`} />;
  }
  return (
    <span className={`${size} grid shrink-0 place-items-center rounded-full bg-slate-100 text-slate-400`} aria-hidden="true">
      <UserRound className="size-5" />
    </span>
  );
}

function Contactos({ miembro }) {
  if (!miembro.correo && !miembro.telefono) {
    return <span className="text-slate-400"><ST>Sin contactos</ST></span>;
  }
  return (
    <div className="grid min-w-0 gap-1 text-slate-600">
      {miembro.correo ? (
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <Mail className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{miembro.correo}</span>
        </span>
      ) : null}
      {miembro.telefono ? (
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <Phone className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{miembro.telefono}</span>
        </span>
      ) : null}
    </div>
  );
}

function PreviewMiembro({ form }) {
  const tNombre = useTraducir("Nombre de la persona");
  const persona = {
    nombre: form.nombre.trim() || tNombre,
    cargo: form.cargo.trim(),
    correo: form.correo.trim(),
    telefono: form.telefono.trim(),
    foto: form.foto.trim(),
  };
  return (
    <div className="about-page" style={{ maxWidth: "none", padding: "1.5rem" }}>
      <ul className="about-equipo__lista">
        <PersonaEquipo persona={persona} />
      </ul>
    </div>
  );
}

function ModalMiembro({ inicial, guardando, onCerrar, onGuardar }) {
  const esEdicion = Boolean(inicial?.id);
  const tEditar = useTraducir("Editar persona");
  const tNueva = useTraducir("Nueva persona");
  const { idioma } = useIdioma();
  const [form, setForm] = useState(() => ({
    ...MIEMBRO_VACIO,
    ...inicial,
    telefono: filtrarEnteros(inicial?.telefono).slice(0, 15),
  }));

  useEffect(() => {
    let cancelado = false;
    const base = { ...MIEMBRO_VACIO, ...inicial, telefono: filtrarEnteros(inicial?.telefono).slice(0, 15) };
    (async () => {
      const vista = await camposParaVistaAdmin(base, CAMPOS_TRADUCIBLES, idioma);
      if (!cancelado) setForm(vista);
    })();
    return () => {
      cancelado = true;
    };
  }, [inicial, idioma]);

  const cambiarCampo = (event) => {
    const { name, value } = event.target;
    setForm((actual) => ({ ...actual, [name]: name === "correo" ? limpiarCorreo(value) : value }));
  };

  const enviar = async (event) => {
    event.preventDefault();
    if (guardando) return;
    const enEspanol = await asegurarCamposEnEspanol(form, CAMPOS_TRADUCIBLES);
    const miembro = {
      nombre: form.nombre.trim(),
      cargo: String(enEspanol.cargo || "").trim(),
      correo: form.correo.trim(),
      telefono: form.telefono.trim(),
      foto: form.foto.trim(),
    };
    if (!miembro.nombre || !miembro.cargo) return;
    if (miembro.correo && !esCorreoValido(miembro.correo)) {
      alert(t(MENSAJE_CORREO_INVALIDO));
      return;
    }
    onGuardar(inicial?.id, miembro);
  };

  return (
    <AdminModal open onClose={onCerrar} maxWidth="max-w-xl" labelledBy="admin-equipo-title" elevated>
      <form onSubmit={enviar} className="flex min-h-0 flex-1 flex-col">
        <AdminModalHeader>
          <div className="flex min-w-0 items-center gap-2.5">
            {esEdicion ? (
              <Pencil className="size-6 shrink-0 text-amber-700" strokeWidth={1.75} aria-hidden="true" />
            ) : (
              <UserPlus className="size-6 shrink-0 text-amber-700" strokeWidth={1.75} aria-hidden="true" />
            )}
            <h2 id="admin-equipo-title" className="truncate text-[length:var(--text-subtitle)] font-bold text-slate-950">
              {esEdicion ? tEditar : tNueva}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-60"
            aria-label={t("Cerrar")}
          >
            <X className="size-5" />
          </button>
        </AdminModalHeader>

        <AdminModalBody cms>
          <AdminEditorConPreview preview={<PreviewMiembro form={form} />}>
          <CampoLimitePalabras
            label="Nombre"
            name="nombre"
            value={form.nombre}
            onChange={cambiarCampo}
            maxPalabras={MAX_PALABRAS_TITULO}
            placeholder={"Ej. Mar\u00eda Rodr\u00edguez"}
            required
          />

          <CampoLimitePalabras
            label={"Cargo o responsabilidad"}
            name="cargo"
            value={form.cargo}
            onChange={cambiarCampo}
            maxPalabras={MAX_PALABRAS_TITULO}
            placeholder="Ej. Encargada de ventas y pedidos"
            required
          />

          <label className={claseEtiqueta}>
            <ST>Correo</ST>
            <input
              type="email"
              inputMode="email"
              name="correo"
              value={form.correo}
              onChange={cambiarCampo}
              placeholder="nombre@una.cr"
              maxLength={200}
              className={claseInput}
            />
          </label>

          <label className={claseEtiqueta}>
            <ST>{"Tel\u00e9fono"}</ST>
            <NumericInput
              name="telefono"
              value={form.telefono}
              onChange={cambiarCampo}
              placeholder="88888888"
              maxLength={15}
              className={claseInput}
            />
          </label>

          <label className={claseEtiqueta}>
            <ST>URL de foto (opcional)</ST>
            <input
              name="foto"
              value={form.foto}
              onChange={cambiarCampo}
              placeholder="https://..."
              maxLength={1000}
              className={claseInput}
            />
          </label>
          </AdminEditorConPreview>
        </AdminModalBody>

        <AdminModalFooter>
          <AdminModalActions
            buttonStyle="voluntariado"
            onCancel={onCerrar}
            primaryDisabled={guardando}
            primaryLabel={guardando ? "Guardando..." : esEdicion ? "Guardar cambios" : "Agregar persona"}
          />
        </AdminModalFooter>
      </form>
    </AdminModal>
  );
}

function BotonIcono({ label, onClick, disabled, children }) {
  const tLabel = useTraducir(label);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={tLabel}
      title={tLabel}
      className="grid size-8 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white"
    >
      {children}
    </button>
  );
}

function Acciones({ indice, total, guardando, puedeEliminar, onMover, onEditar, onEliminar }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <BotonIcono label="Subir" onClick={() => onMover(-1)} disabled={guardando || indice === 0}>
        <ArrowUp className="size-3.5" aria-hidden="true" />
      </BotonIcono>
      <BotonIcono label="Bajar" onClick={() => onMover(1)} disabled={guardando || indice === total - 1}>
        <ArrowDown className="size-3.5" aria-hidden="true" />
      </BotonIcono>
      <button
        type="button"
        onClick={onEditar}
        disabled={guardando}
        className="inline-flex h-8 items-center justify-center gap-1 rounded-full border border-slate-950 bg-slate-950 px-2.5 text-[length:var(--text-body)] font-semibold text-white transition hover:border-neutral-700 hover:bg-neutral-700 disabled:opacity-60"
      >
        <Pencil className="size-3 shrink-0" aria-hidden="true" />
        <span><ST>Editar</ST></span>
      </button>
      {puedeEliminar ? (
        <button
          type="button"
          onClick={onEliminar}
          disabled={guardando}
          className="inline-flex h-8 items-center justify-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 text-[length:var(--text-body)] font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
        >
          <Trash2 className="size-3 shrink-0" aria-hidden="true" />
          <span><ST>Eliminar</ST></span>
        </button>
      ) : null}
    </div>
  );
}

export function EquipoEditor({ puedeEliminar }) {
  const [equipo, setEquipo] = useState([]);
  const [estado, setEstado] = useState("loading");
  const [modal, setModal] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const lista = await obtenerEquipo();
      setEquipo(normalizarEquipo(lista));
      setEstado("ready");
    } catch {
      setEstado("error");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  const ejecutar = async (accion, mensajeError) => {
    try {
      setGuardando(true);
      await accion();
      await cargar();
      return true;
    } catch (err) {
      alert(t(err?.message || mensajeError));
      return false;
    } finally {
      setGuardando(false);
    }
  };

  const guardar = async (id, miembro) => {
    const ok = await ejecutar(
      () => (id ? actualizarMiembroEquipo(id, miembro) : crearMiembroEquipo(miembro)),
      "No se pudo guardar la persona.",
    );
    if (ok) setModal(null);
  };

  const eliminar = (miembro) => {
    if (!window.confirm(t(`¿Quitar a ${miembro.nombre} del equipo?`))) return;
    ejecutar(() => eliminarMiembroEquipo(miembro.id), "No se pudo eliminar la persona.");
  };

  const mover = (indice, direccion) => {
    const destino = indice + direccion;
    if (destino < 0 || destino >= equipo.length) return;
    const reordenado = [...equipo];
    [reordenado[indice], reordenado[destino]] = [reordenado[destino], reordenado[indice]];
    const cambiados = reordenado
      .map((miembro, posicion) => ({ miembro, orden: posicion + 1 }))
      .filter(({ miembro, orden }) => miembro.orden !== orden);
    ejecutar(
      () => Promise.all(cambiados.map(({ miembro, orden }) => actualizarMiembroEquipo(miembro.id, { orden }))),
      "No se pudo cambiar el orden.",
    );
  };

  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
        <div className="min-w-0">
          <h1 className="text-[length:var(--text-title)] font-bold text-slate-950"><ST>Equipo</ST></h1>
          <p className="text-[length:var(--text-body)] text-slate-500">
            <ST>{"Personas encargadas de cada \u00e1rea del proyecto y sus contactos. Se muestran en la secci\u00f3n Equipo del sitio."}</ST>
          </p>
        </div>
        <button
          type="button"
          disabled={guardando || estado !== "ready"}
          onClick={() => setModal({ ...MIEMBRO_VACIO })}
          className="inline-flex h-[var(--control-height)] w-full shrink-0 items-center justify-center gap-2 rounded-full border border-slate-950 bg-slate-950 px-4 text-[length:var(--text-body)] font-semibold text-white transition hover:border-neutral-700 hover:bg-neutral-700 disabled:opacity-60 sm:w-auto"
        >
          <UserPlus className="size-4" aria-hidden="true" />
          <ST>Agregar persona</ST>
        </button>
      </div>

      {estado === "loading" ? (
        <div className="p-8 text-[length:var(--text-body)] text-slate-500"><ST>Cargando equipo...</ST></div>
      ) : estado === "error" ? (
        <div className="p-8 text-[length:var(--text-body)] font-semibold text-red-700">
          <ST>No se pudo cargar el equipo.</ST>
          <button
            type="button"
            onClick={cargar}
            className="mt-4 block h-[var(--control-height)] rounded-full bg-red-700 px-4 text-white"
          >
            <ST>Reintentar</ST>
          </button>
        </div>
      ) : equipo.length === 0 ? (
        <AdminListaVacia mensaje={"Todav\u00eda no hay personas en el equipo."} />
      ) : (
        <>
          <div className="admin-table-shell hidden min-w-0 md:block">
            <table className="w-full text-left text-[length:var(--text-body)]">
              <thead>
                <tr>
                  <th scope="col"><ST>Persona</ST></th>
                  <th scope="col"><ST>Cargo</ST></th>
                  <th scope="col"><ST>Contactos</ST></th>
                  <th scope="col"><ST>Acciones</ST></th>
                </tr>
              </thead>
              <tbody>
                {equipo.map((miembro, indice) => (
                  <tr key={miembro.id} className="border-b border-slate-100 last:border-b-0">
                    <td className="py-3 align-middle">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar miembro={miembro} />
                        <span className="font-semibold text-slate-950">{miembro.nombre}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle text-slate-700"><ST>{miembro.cargo}</ST></td>
                    <td className="max-w-[16rem] px-4 py-3 align-middle"><Contactos miembro={miembro} /></td>
                    <td className="py-3 align-middle">
                      <Acciones
                        indice={indice}
                        total={equipo.length}
                        guardando={guardando}
                        puedeEliminar={puedeEliminar}
                        onMover={(direccion) => mover(indice, direccion)}
                        onEditar={() => setModal(miembro)}
                        onEliminar={() => eliminar(miembro)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-slate-100 md:hidden">
            {equipo.map((miembro, indice) => (
              <article key={miembro.id} className="flex gap-3 px-4 py-4">
                <Avatar miembro={miembro} size="h-14 w-14" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-950">{miembro.nombre}</p>
                    <p className="text-slate-600"><ST>{miembro.cargo}</ST></p>
                  </div>
                  <Contactos miembro={miembro} />
                  <Acciones
                    indice={indice}
                    total={equipo.length}
                    guardando={guardando}
                    puedeEliminar={puedeEliminar}
                    onMover={(direccion) => mover(indice, direccion)}
                    onEditar={() => setModal(miembro)}
                    onEliminar={() => eliminar(miembro)}
                  />
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {modal ? (
        <ModalMiembro
          key={modal.id ?? "nueva"}
          inicial={modal}
          guardando={guardando}
          onCerrar={() => !guardando && setModal(null)}
          onGuardar={guardar}
        />
      ) : null}
    </section>
  );
}
