import { ArrowUpRight, Calendar, FileText, Globe, Mail, MapPin, Phone, Sprout } from "lucide-react";

import { FacebookIcon, InstagramIcon, WhatsAppIcon } from "../../Components/Footer/SocialIcons";
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

function enlaceSeguro(valor) {
  try {
    const url = new URL(String(valor || "").trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
  } catch {
    return "";
  }
}

function EnlaceMapa({ href }) {
  const vacio = useTraducir("No indicado");
  const seguro = enlaceSeguro(href);
  return (
    <div className="grid gap-2 md:col-span-2">
      <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
        <MapPin className="size-4 text-slate-500" />
        <ST>Enlace de Google Maps o Waze</ST>
      </span>
      {seguro ? (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
          <a
            href={seguro}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[var(--control-height)] items-center gap-1.5 rounded-full bg-slate-900 px-4 text-[length:var(--text-body)] font-semibold text-white transition hover:bg-slate-700"
          >
            <ST>Abrir en el mapa</ST>
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </a>
          <span className="min-w-0 break-all text-sm text-slate-600">{seguro}</span>
        </div>
      ) : (
        <p className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">
          {href || vacio}
        </p>
      )}
    </div>
  );
}

function RedesSociales({ propuesta }) {
  const redes = [
    { id: "facebook", etiqueta: "Facebook", href: enlaceSeguro(propuesta.facebook), icono: <FacebookIcon size={18} /> },
    { id: "instagram", etiqueta: "Instagram", href: enlaceSeguro(propuesta.instagram), icono: <InstagramIcon size={18} /> },
    { id: "whatsapp", etiqueta: "WhatsApp", href: enlaceSeguro(propuesta.whatsapp), icono: <WhatsAppIcon size={18} /> },
    { id: "sitio", etiqueta: "Sitio web", href: enlaceSeguro(propuesta.sitioWeb), icono: <Globe className="size-[18px]" aria-hidden="true" /> },
  ].filter((red) => red.href);
  if (!redes.length) {
    return (
      <p className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 md:col-span-2">
        <ST>No indicó redes sociales</ST>
      </p>
    );
  }
  return (
    <div className="flex flex-wrap gap-2 md:col-span-2">
      {redes.map((red) => (
        <a
          key={red.id}
          href={red.href}
          target="_blank"
          rel="noopener noreferrer"
          title={red.href}
          className="inline-flex min-h-[var(--control-height)] items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-[length:var(--text-body)] font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
        >
          {red.icono}
          <ST>{red.etiqueta}</ST>
        </a>
      ))}
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
        <EnlaceMapa href={propuesta.enlaceUbicacion} />
      </Seccion>

      <Seccion titulo="Redes sociales">
        <RedesSociales propuesta={propuesta} />
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
          <Campo
            icon={FileText}
            label="Administrador responsable"
            value={propuesta.revisadoPorNombre || `#${propuesta.revisadoPorId}`}
          />
        ) : null}
        {propuesta.motivoRechazo ? (
          <Campo icon={FileText} label="Motivo del rechazo" value={propuesta.motivoRechazo} className="md:col-span-2" />
        ) : null}
        {propuesta.sugerencias ? (
          <Campo icon={FileText} label="Sugerencias" value={propuesta.sugerencias} className="md:col-span-2" />
        ) : null}
      </div>
      {children}
    </section>
  );
}
