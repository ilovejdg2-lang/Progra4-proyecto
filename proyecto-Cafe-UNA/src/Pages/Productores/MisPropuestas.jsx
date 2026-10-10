import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Eye } from "lucide-react";

import { AdminModal, AdminModalBody, AdminModalHeader } from "../../Components/Admin/ui/AdminModal";
import { ImageLightbox } from "../../Components/ImageLightbox/ImageLightbox";
import { PerfilClienteLayout } from "../../Components/Perfil/PerfilClienteLayout";
import { ST } from "../../Components/T/ST";
import { UiSelect } from "../../Components/ui/Select";
import { rolesDeUsuario, tienePermiso } from "../../lib/permisos";
import { formatearFechaPropuesta } from "../../lib/propuestaProductor";
import { obtenerFooter } from "../../services/informacionService";
import {
  obtenerBlobImagenPropuesta,
  obtenerMiPropuesta,
  obtenerMisPropuestas,
} from "../../services/propuestasProductoresService";
import { getActiveSessionUser, SESSION_UPDATED_EVENT } from "../../services/sessionService";
import { DetallePropuestaSecciones, SeccionRevision } from "./DetallePropuesta";

export function rutaMisPropuestas(user) {
  const roles = rolesDeUsuario(user);
  if (tienePermiso(roles, "ver_panel_administrativo")) return "/admin/mis-propuestas";
  return "/perfil/propuestas";
}

function colorEstado(estado) {
  const valor = String(estado || "").toLowerCase();
  if (valor.includes("pendiente")) return "text-amber-800";
  if (valor.includes("aprob")) return "text-emerald-800";
  if (valor.includes("rechaz")) return "text-rose-800";
  return "text-slate-700";
}

function ImagenPropuesta({ nombre, alt }) {
  const [src, setSrc] = useState("");
  const [abierta, setAbierta] = useState(false);
  useEffect(() => {
    if (!nombre) return undefined;
    let activo = true;
    let objectUrl = "";
    obtenerBlobImagenPropuesta(nombre)
      .then((blob) => {
        if (!(blob instanceof Blob) || !activo) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (activo) setSrc("");
      });
    return () => {
      activo = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [nombre]);
  if (!src) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setAbierta(true)}
        className="h-28 w-28 overflow-hidden rounded-2xl border border-slate-200 p-0"
        aria-label="Ver imagen más grande"
      >
        <img src={src} alt={alt || ""} className="h-full w-full cursor-zoom-in object-cover" />
      </button>
      <ImageLightbox images={[src]} index={abierta ? 0 : -1} onClose={() => setAbierta(false)} alt={alt} />
    </>
  );
}

export function MisPropuestasContent({ variant = "cliente", propuestaId = "" }) {
  const navigate = useNavigate();
  const esAdmin = variant === "admin";
  const perfilVolver = esAdmin ? "/admin/perfil" : "/perfil";
  const [usuario, setUsuario] = useState(() => getActiveSessionUser());
  const [lista, setLista] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [estado, setEstado] = useState("todos");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [correoInstitucional, setCorreoInstitucional] = useState("");

  useEffect(() => {
    const sync = () => setUsuario(getActiveSessionUser());
    window.addEventListener(SESSION_UPDATED_EVENT, sync);
    return () => window.removeEventListener(SESSION_UPDATED_EVENT, sync);
  }, []);

  useEffect(() => {
    if (!usuario) {
      sessionStorage.setItem("postLoginRedirect", esAdmin ? "/admin/mis-propuestas" : "/perfil/propuestas");
      navigate({ to: "/login" });
    }
  }, [usuario, navigate, esAdmin]);

  useEffect(() => {
    let activo = true;
    obtenerFooter()
      .then((footer) => {
        if (activo) setCorreoInstitucional(String(footer?.correo || "").trim());
      })
      .catch(() => {
        if (activo) setCorreoInstitucional("");
      });
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (!usuario) return undefined;
    let activo = true;
    setCargando(true);
    setError("");
    obtenerMisPropuestas()
      .then((items) => {
        if (activo) setLista(items);
      })
      .catch((err) => {
        if (activo) setError(err?.message || "No se pudieron cargar tus propuestas.");
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [usuario]);

  useEffect(() => {
    if (!propuestaId || !usuario) return undefined;
    let activo = true;
    obtenerMiPropuesta(propuestaId)
      .then((item) => {
        if (activo) setDetalle(item);
      })
      .catch((err) => {
        if (activo) setError(err?.message || "No se pudo abrir la propuesta.");
      });
    return () => {
      activo = false;
    };
  }, [propuestaId, usuario]);

  const visibles = estado === "todos" ? lista : lista.filter((item) => item.estado === estado);

  const abrir = async (id) => {
    try {
      setDetalle(await obtenerMiPropuesta(id));
    } catch (err) {
      setError(err?.message || "No se pudo abrir la propuesta.");
    }
  };

  return (
    <main className={esAdmin ? "mx-auto max-w-3xl space-y-5" : "mx-auto max-w-3xl space-y-5 px-4 py-8"}>
      <Link
        to={perfilVolver}
        className="inline-flex min-h-[var(--control-height)] items-center gap-2 text-[var(--text-body)] font-semibold text-slate-700"
      >
        <ArrowLeft className="size-4" /> <ST>Volver al perfil</ST>
      </Link>
      <header>
        <h1 className="text-[var(--text-title)] font-semibold text-slate-950"><ST>Mis propuestas</ST></h1>
        <p className="mt-1 text-[var(--text-body)] text-slate-500">
          <ST>Consultá el estado de las propuestas de tu emprendimiento.</ST>
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <label className="grid max-w-sm gap-1 text-[var(--text-body)]">
          <span className="font-medium text-slate-700"><ST>Estado</ST></span>
          <UiSelect
            ariaLabel="Estado"
            value={estado}
            onChange={setEstado}
            options={[
              { value: "todos", label: "Todos" },
              { value: "Pendiente", label: "Pendiente" },
              { value: "Aprobada", label: "Aprobada" },
              { value: "Rechazada", label: "Rechazada" },
            ]}
          />
        </label>
      </section>

      {error ? <p className="text-[var(--text-body)] text-rose-700"><ST>{error}</ST></p> : null}
      {cargando ? <p className="text-[var(--text-body)] text-slate-500"><ST>Cargando propuestas...</ST></p> : null}
      {!cargando && visibles.length === 0 ? (
        <p className="text-[var(--text-body)] text-slate-500"><ST>Todavía no enviaste una propuesta.</ST></p>
      ) : null}

      <ul className="grid gap-3">
        {visibles.map((item) => (
          <li key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <p className="text-[var(--text-subtitle)] font-semibold text-slate-950">{item.nombre}</p>
                <p className="text-[var(--text-body)] text-slate-600">
                  #{item.id}
                  {" · "}
                  {formatearFechaPropuesta(item.fechaEnvio) || <ST>Sin fecha</ST>}
                </p>
                <p className={`text-[var(--text-body)] font-semibold ${colorEstado(item.estado)}`}>
                  <ST>{item.estado}</ST>
                </p>
                {item.estado === "Rechazada" && item.motivoRechazo ? (
                  <p className="text-[var(--text-body)] text-slate-600">{item.motivoRechazo}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => abrir(item.id)}
                className="inline-flex min-h-[var(--control-height)] items-center gap-2 rounded-full border border-slate-200 px-4 text-[var(--text-body)] font-semibold text-slate-800"
              >
                <Eye className="size-4" />
                <ST>Ver detalle</ST>
              </button>
            </div>
          </li>
        ))}
      </ul>

      {detalle ? (
        <AdminModal open onClose={() => setDetalle(null)} maxWidth="max-w-2xl">
          <AdminModalHeader>
            <ST>Detalle de la propuesta</ST>
          </AdminModalHeader>
          <AdminModalBody>
            <header className="mb-6 flex items-center gap-4 border-b border-slate-100 pb-5">
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-bold text-slate-950">{detalle.nombre}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  <ST>Propuesta</ST> #{detalle.id}
                </p>
                <p className={`mt-2 text-sm font-semibold ${colorEstado(detalle.estado)}`}>
                  <ST>{detalle.estado}</ST>
                </p>
              </div>
            </header>
            <DetallePropuestaSecciones
              propuesta={detalle}
              imagen={<ImagenPropuesta nombre={detalle.imagenNombre} alt={detalle.nombre} />}
            />
            <SeccionRevision propuesta={detalle}>
              <p className="text-sm text-slate-600">
                <ST>Esta propuesta no se puede editar desde el sitio. Si necesitás un cambio, escribinos</ST>{" "}
                {correoInstitucional ? (
                  <a className="font-semibold text-slate-900" href={`mailto:${correoInstitucional}`}>{correoInstitucional}</a>
                ) : (
                  <ST>al correo institucional cuando esté configurado.</ST>
                )}
              </p>
            </SeccionRevision>
          </AdminModalBody>
        </AdminModal>
      ) : null}
    </main>
  );
}

export default function MisPropuestasCliente() {
  const { propuestaId = "" } = useParams({ strict: false });
  return (
    <PerfilClienteLayout>
      <MisPropuestasContent variant="cliente" propuestaId={propuestaId} />
    </PerfilClienteLayout>
  );
}
