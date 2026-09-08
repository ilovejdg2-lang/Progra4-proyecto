import { useState } from "react";
import { CalendarDays, CheckCircle2, Users } from "lucide-react";

import PageLoading from "../../Components/PageLoading/PageLoading";
import { usePaintPublicPage } from "../../hooks/usePaintPublicPage";
import { getActiveSessionUser } from "../../services/sessionService";
import { crearSolicitudVisita } from "../../services/visitasService";

const INITIAL_FORM = {
  encargadoNombre: "",
  encargadoIdentificacion: "",
  encargadoEmail: "",
  encargadoTelefono: "",
  encargadoInstitucion: "",
  tipoVisitante: "Nacional",
  paisProcedencia: "",
  ciudadProvincia: "",
  cantidadVisitantes: "",
  tipoGrupo: "",
  fechaVisita: "",
  horaPreferida: "",
  motivoVisita: "",
  requiereAccesibilidad: false,
  requiereParqueoBus: false,
  requiereGuia: false,
  observaciones: "",
};

const REQUIRED_FIELDS = [
  "encargadoNombre",
  "encargadoIdentificacion",
  "encargadoEmail",
  "encargadoTelefono",
  "ciudadProvincia",
  "cantidadVisitantes",
  "tipoGrupo",
  "fechaVisita",
  "horaPreferida",
  "motivoVisita",
];

function Field({ label, children }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      {label}
      {children}
    </label>
  );
}

const inputClass =
  "min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

export default function SolicitarVisita() {
  const session = getActiveSessionUser();
  const [form, setForm] = useState(() => ({
    ...INITIAL_FORM,
    encargadoEmail: session?.email || "",
  }));
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const {
    ref: pageRef,
    showLoading,
    showPrepaint,
    inert,
    loadingMessage,
  } = usePaintPublicPage("visitas");

  const update = (event) => {
    const { checked, name, type, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess(null);

    const missing = REQUIRED_FIELDS.some((field) => !String(form[field] ?? "").trim());
    if (missing) {
      setError("Completá los campos obligatorios antes de enviar la solicitud.");
      return;
    }
    if (Number(form.cantidadVisitantes) < 2) {
      setError("Las visitas grupales requieren al menos 2 personas.");
      return;
    }
    if (form.tipoVisitante === "Internacional" && !form.paisProcedencia.trim()) {
      setError("Indicá el país de procedencia del grupo internacional.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await crearSolicitudVisita(form);
      setSuccess(created);
    } catch (requestError) {
      setError(requestError?.message || "No se pudo enviar la solicitud de visita.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!session?.token && !session?.id) {
    return (
      <>
        {showLoading ? <PageLoading message={loadingMessage} /> : null}
        <main
          className={`mx-auto grid min-h-[60vh] max-w-3xl place-items-center px-4 py-16 ${showPrepaint ? "invisible" : ""}`}
          inert={inert}
          ref={pageRef}
        >
          <section className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
          <Users className="mx-auto mb-4 text-amber-700" size={42} aria-hidden="true" />
          <h1 className="text-2xl font-bold text-slate-950">Solicitud de visitas grupales</h1>
          <p className="mt-3 text-slate-700">Iniciá sesión para registrar y consultar tu solicitud.</p>
          <a
            className="mt-6 inline-flex rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800"
            href="/login?redirect=%2Fvisitas%2Fsolicitar"
          >
            Iniciar sesión
          </a>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      {showLoading ? <PageLoading message={loadingMessage} /> : null}
      <main
        className={`bg-slate-50 px-4 py-10 sm:px-6 lg:px-8 ${showPrepaint ? "invisible" : ""}`}
        inert={inert}
        ref={pageRef}
      >
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 rounded-3xl bg-gradient-to-br from-emerald-900 to-emerald-700 p-7 text-white shadow-lg sm:p-10">
          <div className="flex items-start gap-4">
            <span className="rounded-2xl bg-white/15 p-3"><CalendarDays aria-hidden="true" /></span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-100">Café UNA</p>
              <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Solicitud de visitas grupales</h1>
              <p className="mt-3 max-w-2xl text-emerald-50">
                Coordiná una visita para grupos de dos personas o más. La solicitud quedará pendiente de revisión.
              </p>
            </div>
          </div>
        </header>

        <form className="grid gap-6" onSubmit={submit} noValidate>
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">Información del encargado</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Nombre del encargado *"><input className={inputClass} name="encargadoNombre" value={form.encargadoNombre} onChange={update} /></Field>
              <Field label="Identificación *"><input className={inputClass} name="encargadoIdentificacion" value={form.encargadoIdentificacion} onChange={update} /></Field>
              <Field label="Correo electrónico *"><input className={inputClass} type="email" name="encargadoEmail" value={form.encargadoEmail} onChange={update} /></Field>
              <Field label="Teléfono *"><input className={inputClass} name="encargadoTelefono" value={form.encargadoTelefono} onChange={update} /></Field>
              <Field label="Institución"><input className={inputClass} name="encargadoInstitucion" value={form.encargadoInstitucion} onChange={update} /></Field>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">Grupo y programación</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Tipo de visitante *">
                <select className={inputClass} name="tipoVisitante" value={form.tipoVisitante} onChange={update}>
                  <option>Nacional</option><option>Internacional</option>
                </select>
              </Field>
              {form.tipoVisitante === "Internacional" ? (
                <Field label="País de procedencia *"><input className={inputClass} name="paisProcedencia" value={form.paisProcedencia} onChange={update} /></Field>
              ) : null}
              <Field label="Provincia o ciudad *"><input className={inputClass} name="ciudadProvincia" value={form.ciudadProvincia} onChange={update} /></Field>
              <Field label="Cantidad de visitantes *"><input className={inputClass} min="2" type="number" name="cantidadVisitantes" value={form.cantidadVisitantes} onChange={update} /></Field>
              <Field label="Tipo de grupo *"><input className={inputClass} name="tipoGrupo" value={form.tipoGrupo} onChange={update} placeholder="Universidad, empresa, asociación…" /></Field>
              <Field label="Fecha de visita *"><input className={inputClass} type="date" name="fechaVisita" value={form.fechaVisita} onChange={update} /></Field>
              <Field label="Hora preferida *"><input className={inputClass} name="horaPreferida" value={form.horaPreferida} onChange={update} placeholder="Ej. 09:00" /></Field>
              <Field label="Motivo de la visita *"><input className={inputClass} name="motivoVisita" value={form.motivoVisita} onChange={update} /></Field>
            </div>
            <fieldset className="mt-5 grid gap-3 sm:grid-cols-3">
              <legend className="mb-3 text-sm font-semibold text-slate-700">Necesidades del grupo</legend>
              {[["requiereAccesibilidad", "Accesibilidad"], ["requiereParqueoBus", "Parqueo para bus"], ["requiereGuia", "Guía"]].map(([name, label]) => (
                <label className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-3 text-sm font-medium" key={name}>
                  <input type="checkbox" name={name} checked={form[name]} onChange={update} /> {label}
                </label>
              ))}
            </fieldset>
            <Field label="Observaciones">
              <textarea className={`${inputClass} min-h-28 py-3`} name="observaciones" value={form.observaciones} onChange={update} />
            </Field>
          </section>

          {error ? <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800" role="alert">{error}</p> : null}
          {success ? (
            <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900" role="status">
              <CheckCircle2 aria-hidden="true" /> Solicitud #{success.id} enviada en estado {success.estado}.
            </p>
          ) : null}
          <button className="min-h-12 rounded-xl bg-emerald-700 px-6 py-3 font-bold text-white shadow-sm hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60" disabled={submitting} type="submit">
            {submitting ? "Enviando…" : "Enviar solicitud"}
          </button>
        </form>
      </div>
      </main>
    </>
  );
}
