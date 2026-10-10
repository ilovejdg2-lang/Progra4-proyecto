import { Calendar, FileText, Mail, MapPin, Phone, Share2, Sprout } from "lucide-react";

import { ST } from "../../Components/T/ST";
import { useTraducir } from "../../hooks/useTraducir";
import { formatearFechaPropuesta } from "../../lib/propuestaProductor";

function Campo({ icon: Icon, label, value, className = "", enlace = false }) {
  const vacio = useTraducir("No indicado");
  const texto = value ? String(value) : "";
  return (
    <div className={`grid gap-2 ${className}`}>
      <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
        <Icon className="size-4 text-slate-500" />
        <ST>{label}</ST>
      </span>
      {enlace && texto ? (
        <a
          href={texto}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 underline-offset-2 hover:underline"
        >
          {texto}
        </a>
      ) : (
        <p className="whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">
          {texto || vacio}
        </p>
      )}
    </div>
  );
}

function Seccion({ titulo, children, primera = false }) {
  return (
    <section className={primera ? "space-y-4" : "mt-6 space-y-4 border-t border-slate-100 pt-6"}>
      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">
        <ST>{titulo}</ST>
      </h4>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

export function DetallePropuestaSecciones({ propuesta, imagen = null }) {
  return (
    <>
      <Seccion titulo="Información del emprendimiento" primera>
        <Campo icon={Sprout} label="Nombre del emprendimiento" value={propuesta.nombre} className="md:col-span-2" />
        <Campo icon={FileText} label="Descripción" value={propuesta.descripcion} className="md:col-span-2" />
        <div className="grid gap-2 md:col-span-2">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
            <Sprout className="size-4 text-slate-500" />
            <ST>Imagen representativa</ST>
          </span>
          {imagen || (
            <p className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">
              <ST>No indicado</ST>
            </p>
          )}
        </div>
      </Seccion>

      <Seccion titulo="Ubicación">
        <Campo icon={MapPin} label="Provincia" value={propuesta.provincia} />
        <Campo icon={MapPin} label="Cantón" value={propuesta.canton} />
        <Campo icon={MapPin} label="Distrito" value={propuesta.distrito} />
        <Campo icon={MapPin} label="Dirección o señas adicionales" value={propuesta.senas || propuesta.direccion} className="md:col-span-2" />
        <Campo icon={MapPin} label="Enlace de Google Maps o Waze" value={propuesta.enlaceUbicacion} className="md:col-span-2" enlace />
      </Seccion>

      <Seccion titulo="Redes sociales">
        <Campo icon={Share2} label="Facebook" value={propuesta.facebook} enlace />
        <Campo icon={Share2} label="Instagram" value={propuesta.instagram} enlace />
        <Campo icon={Share2} label="WhatsApp" value={propuesta.whatsapp} enlace />
        <Campo icon={Share2} label="Sitio web" value={propuesta.sitioWeb} enlace />
      </Seccion>

      <Seccion titulo="Contacto">
        <Campo icon={Mail} label="Correo electrónico" value={propuesta.correo} />
        <Campo icon={Phone} label="Teléfono" value={propuesta.telefono} />
      </Seccion>
    </>
  );
}

export function SeccionRevision({ propuesta, children }) {
  return (
    <section className="mt-6 space-y-4 border-t border-slate-100 pt-6">
      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">
        <ST>Estado de la solicitud</ST>
      </h4>
      <div className="grid gap-4 md:grid-cols-2">
        <Campo icon={FileText} label="Estado" value={propuesta.estado} />
        <Campo icon={Calendar} label="Fecha de envío" value={formatearFechaPropuesta(propuesta.fechaEnvio)} />
        <Campo icon={Calendar} label="Fecha de revisión" value={formatearFechaPropuesta(propuesta.fechaRevision)} />
        {propuesta.revisadoPorId ? (
          <Campo icon={FileText} label="Administrador responsable" value={`#${propuesta.revisadoPorId}`} />
        ) : null}
        {propuesta.motivoRechazo ? (
          <Campo icon={FileText} label="Motivo del rechazo" value={propuesta.motivoRechazo} className="md:col-span-2" />
        ) : null}
      </div>
      {children}
    </section>
  );
}
