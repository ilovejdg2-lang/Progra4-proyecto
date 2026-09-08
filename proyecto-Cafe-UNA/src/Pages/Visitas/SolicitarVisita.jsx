import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, ClipboardList, UserRound, Users } from "lucide-react";

import PageLoading from "../../Components/PageLoading/PageLoading";
import { usePaintPublicPage } from "../../hooks/usePaintPublicPage";
import { getActiveSessionUser } from "../../services/sessionService";
import {
  crearSolicitudVisita,
  obtenerDisponibilidadVisitasPublica,
} from "../../services/visitasService";
import "../Voluntariado/SolicitarVoluntariado.css";

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
  disponibilidadVisitaId: "",
  motivoVisita: "",
  requiereAccesibilidad: false,
  requiereParqueoBus: false,
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
  "disponibilidadVisitaId",
  "motivoVisita",
];

function Field({ label, children }) {
  return (
    <label className="campo">
      {label}
      {children}
    </label>
  );
}

function SectionCard({ icon: Icon, title, hint, children }) {
  return (
    <section className="section-card">
      <div className="section-card__header">
        <Icon aria-hidden="true" className="section-card__icon-inline" size={20} />
        <div className="section-card__titles">
          <h4>{title}</h4>
          {hint ? <span className="section-card__hint">{hint}</span> : null}
        </div>
      </div>
      <div className="section-card__body">{children}</div>
    </section>
  );
}

const dateFormatter = new Intl.DateTimeFormat("es-CR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function slotLabel(slot) {
  const date = dateFormatter.format(new Date(`${slot.fecha}T00:00:00Z`));
  return `${date} · ${slot.horaInicio.slice(0, 5)} – ${slot.horaFin.slice(0, 5)}`;
}

export default function SolicitarVisita() {
  const session = getActiveSessionUser();
  const [form, setForm] = useState(() => ({
    ...INITIAL_FORM,
    encargadoEmail: session?.email || "",
  }));
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [availability, setAvailability] = useState([]);
  const [availabilityStatus, setAvailabilityStatus] = useState("loading");
  const [availabilityError, setAvailabilityError] = useState("");
  const {
    ref: pageRef,
    showLoading,
    showPrepaint,
    inert,
    loadingMessage,
  } = usePaintPublicPage("visitas");
  const isAuthenticated = Boolean(session?.token || session?.id);
  const selectedSlot = useMemo(
    () => availability.find((slot) => slot.id === form.disponibilidadVisitaId) || null,
    [availability, form.disponibilidadVisitaId],
  );

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let active = true;
    obtenerDisponibilidadVisitasPublica()
      .then((slots) => {
        if (!active) return;
        setAvailability(slots);
        setAvailabilityStatus("success");
      })
      .catch((loadError) => {
        if (!active) return;
        setAvailability([]);
        setAvailabilityError(loadError?.message || "No se pudieron cargar los horarios disponibles.");
        setAvailabilityStatus("error");
      });
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

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

  if (!isAuthenticated) {
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
        className={`voluntariado-page${showPrepaint ? " voluntariado-page--prepaint" : ""}`}
        inert={inert}
        ref={pageRef}
      >
        <section className="voluntariado-section">
          <header className="voluntariado-header">
            <h1>Solicitud de visitas grupales</h1>
            <p>
              Completá la información del grupo y elegí uno de los horarios habilitados por la administración.
              La solicitud quedará pendiente de revisión.
            </p>
          </header>

          <form className="formulario-card" onSubmit={submit} noValidate>
            <div className="form-secciones">
              <SectionCard
                icon={UserRound}
                title="Información del encargado"
                hint="Datos de la persona responsable de coordinar la visita."
              >
                <div className="form-grid">
                  <Field label="Nombre del encargado *"><input name="encargadoNombre" value={form.encargadoNombre} onChange={update} /></Field>
                  <Field label="Identificación *"><input name="encargadoIdentificacion" value={form.encargadoIdentificacion} onChange={update} /></Field>
                  <Field label="Correo electrónico *"><input type="email" name="encargadoEmail" value={form.encargadoEmail} onChange={update} /></Field>
                  <Field label="Teléfono *"><input name="encargadoTelefono" value={form.encargadoTelefono} onChange={update} /></Field>
                  <Field label="Institución"><input name="encargadoInstitucion" value={form.encargadoInstitucion} onChange={update} /></Field>
                </div>
              </SectionCard>

              <SectionCard
                icon={Users}
                title="Información del grupo"
                hint="Las visitas grupales requieren al menos dos personas."
              >
                <div className="form-grid">
                  <Field label="Tipo de visitante *">
                    <select name="tipoVisitante" value={form.tipoVisitante} onChange={update}>
                      <option>Nacional</option>
                      <option>Internacional</option>
                    </select>
                  </Field>
                  {form.tipoVisitante === "Internacional" ? (
                    <Field label="País de procedencia *"><input name="paisProcedencia" value={form.paisProcedencia} onChange={update} /></Field>
                  ) : null}
                  <Field label="Provincia o ciudad *"><input name="ciudadProvincia" value={form.ciudadProvincia} onChange={update} /></Field>
                  <Field label="Cantidad de visitantes *"><input min="2" type="number" name="cantidadVisitantes" value={form.cantidadVisitantes} onChange={update} /></Field>
                  <Field label="Tipo de grupo *"><input name="tipoGrupo" value={form.tipoGrupo} onChange={update} placeholder="Universidad, empresa, asociación…" /></Field>
                  <Field label="Motivo de la visita *"><input name="motivoVisita" value={form.motivoVisita} onChange={update} /></Field>
                </div>
              </SectionCard>

              <SectionCard
                icon={CalendarDays}
                title="Fecha y horario"
                hint="Solo podés solicitar horarios publicados por la administración."
              >
                <Field label="Fecha y horario disponibles *">
                  <select
                    disabled={availabilityStatus !== "success" || availability.length === 0}
                    name="disponibilidadVisitaId"
                    value={form.disponibilidadVisitaId}
                    onChange={update}
                  >
                    <option value="">
                      {availabilityStatus === "loading" ? "Cargando horarios…" : "Seleccioná un horario"}
                    </option>
                    {availability.map((slot) => <option key={slot.id} value={slot.id}>{slotLabel(slot)}</option>)}
                  </select>
                </Field>
                {availabilityStatus === "success" && availability.length === 0 ? (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    No hay fechas y horarios habilitados en este momento.
                  </p>
                ) : null}
                {availabilityError ? <p className="mensaje-error" role="alert">{availabilityError}</p> : null}
                {selectedSlot?.nota ? (
                  <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                    <strong>Indicación del horario:</strong> {selectedSlot.nota}
                  </p>
                ) : null}
              </SectionCard>

              <SectionCard
                icon={ClipboardList}
                title="Necesidades y recomendaciones"
                hint="Todas las visitas serán recibidas o acompañadas por personal del proyecto."
              >
                <fieldset className="grid gap-3 sm:grid-cols-2">
                  <legend className="mb-3 text-sm font-semibold text-slate-700">Necesidades del grupo</legend>
                  {[["requiereAccesibilidad", "Requerimientos de accesibilidad"], ["requiereParqueoBus", "Parqueo para bus"]].map(([name, label]) => (
                    <label className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-3 text-sm font-medium" key={name}>
                      <input type="checkbox" name={name} checked={form[name]} onChange={update} /> {label}
                    </label>
                  ))}
                </fieldset>
                <aside className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">Recomendaciones para la visita</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    <li>Usá vestimenta cómoda y apropiada para recorridos al aire libre.</li>
                    <li>Llevá repelente si visitarán zonas con vegetación.</li>
                    <li>Considerá protección solar e hidratación.</li>
                  </ul>
                </aside>
                <Field label="Observaciones">
                  <textarea name="observaciones" value={form.observaciones} onChange={update} />
                </Field>
              </SectionCard>
            </div>

            {error ? <p className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800" role="alert">{error}</p> : null}
            {success ? (
              <p className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900" role="status">
                <CheckCircle2 aria-hidden="true" /> Solicitud #{success.id} enviada en estado {success.estado}.
              </p>
            ) : null}
            <div className="acciones-formulario">
              <button
                className="btn-enviar"
                disabled={submitting || availabilityStatus === "error" || (availabilityStatus === "success" && availability.length === 0)}
                type="submit"
              >
                {submitting ? "Enviando…" : "Enviar solicitud"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </>
  );
}
