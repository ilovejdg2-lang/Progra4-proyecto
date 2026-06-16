import { useEffect, useState } from "react";
import { Image, LayoutTemplate, Link2, PanelBottom, Plus, Sparkles, Trash2, X } from "lucide-react";

import { AdminLayout } from "../layouts/AdminLayout";
import { AdminModal, AdminModalBody, AdminModalFooter, AdminModalHeader } from "../../../Components/Admin/ui/AdminModal";
import {
  actualizarEnlace,
  actualizarFooter,
  actualizarNavbar,
  actualizarSeccion,
  crearEnlace,
  eliminarEnlace,
  obtenerEnlaces,
  obtenerFooter,
  obtenerHero,
  obtenerNavbar,
  obtenerSeccion,
} from "../../../services/informacionService";
import { getActiveSessionUser } from "../../../services/sessionService";

const heroInicial = {
  title: "",
  subtitle: "",
  buttonText: "",
  backgroundImage: "",
};

const homeSpotlightInicial = {
  title: "",
  description: "",
  image: "",
};

const navbarInicial = {
  logoUrl: "",
  logoClaroUrl: "",
};

const footerInicial = {
  logoUrl: "",
  logoClaroUrl: "",
  fraseMarca: "",
  telefono: "",
  correo: "",
  facebookUrl: "",
  instagramUrl: "",
  mapsUrl: "",
  textoCopyright: "",
};

const CONFIG_ENLACES = {
  "enlaces-navbar": {
    seccion: "Navbar",
    etiqueta: "Enlaces del navbar",
    titulo: "Menu de navegacion",
    descripcionVacia: "Sin enlaces en el menu superior.",
  },
  "enlaces-footer": {
    seccion: "FooterExplorar",
    etiqueta: "Enlaces del footer",
    titulo: "Seccion Explorar",
    descripcionVacia: "Sin enlaces en la columna Explorar del pie de pagina.",
  },
};

function EstadoPublicado() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
      <span className="size-2 rounded-full bg-emerald-600" />
      Publicado
    </span>
  );
}

function CampoTexto({ label, name, value, onChange, type = "text", placeholder, hint, required }) {
  return (
    <label className="grid gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
      {label}
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="rounded-xl border border-slate-300 px-4 py-3 text-base font-normal normal-case tracking-normal text-slate-950 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
      />
      {hint ? (
        <span className="text-xs font-medium normal-case tracking-normal text-slate-400">{hint}</span>
      ) : null}
    </label>
  );
}

function ModalHero({ hero, onCerrar, onGuardar, guardando }) {
  const [form, setForm] = useState(() => ({ ...heroInicial, ...hero }));

  const cambiarCampo = (event) => {
    const { name, value } = event.target;
    setForm((actual) => ({ ...actual, [name]: value }));
  };

  const enviar = (event) => {
    event.preventDefault();
    onGuardar(form);
  };

  return (
    <AdminModal open onClose={onCerrar} maxWidth="max-w-2xl" labelledBy="admin-hero-modal-title">
      <form onSubmit={enviar} className="flex min-h-0 flex-1 flex-col">
        <AdminModalHeader>
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700">
              <Image className="size-5" />
            </span>
            <h2 id="admin-hero-modal-title" className="truncate text-lg font-bold text-slate-950 sm:text-xl">Hero section</h2>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-full bg-stone-100 p-2 text-slate-600 transition hover:bg-stone-200"
            aria-label="Cerrar"
          >
            <X className="size-5" />
          </button>
        </AdminModalHeader>

        <AdminModalBody className="space-y-5">
          <CampoTexto
            label="Titulo principal"
            name="title"
            value={form.title}
            onChange={cambiarCampo}
            required
            hint="Texto grande que aparece primero en la pagina."
          />

          <label className="grid gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
            Subtitulo
            <textarea
              name="subtitle"
              value={form.subtitle}
              onChange={cambiarCampo}
              rows={4}
              className="resize-none rounded-xl border border-slate-300 px-4 py-3 text-base font-normal normal-case leading-7 tracking-normal text-slate-950 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              required
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <CampoTexto
              label="Texto del boton"
              name="buttonText"
              value={form.buttonText}
              onChange={cambiarCampo}
            />
            <CampoTexto
              label="Imagen de fondo URL"
              name="backgroundImage"
              value={form.backgroundImage}
              onChange={cambiarCampo}
              placeholder="https://..."
            />
          </div>
        </AdminModalBody>

        <AdminModalFooter>
          <button
            type="button"
            onClick={onCerrar}
            className="w-full rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 sm:w-auto"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="w-full rounded-xl bg-amber-700 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </AdminModalFooter>
      </form>
    </AdminModal>
  );
}

function ModalHomeSpotlight({ data, onCerrar, onGuardar, guardando }) {
  const [form, setForm] = useState(() => ({ ...homeSpotlightInicial, ...data }));

  const cambiarCampo = (event) => {
    const { name, value } = event.target;
    setForm((actual) => ({ ...actual, [name]: value }));
  };

  const enviar = (event) => {
    event.preventDefault();
    onGuardar(form);
  };

  return (
    <AdminModal open onClose={onCerrar} maxWidth="max-w-2xl" labelledBy="admin-home-spotlight-modal-title">
      <form onSubmit={enviar} className="flex min-h-0 flex-1 flex-col">
        <AdminModalHeader>
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700">
              <Sparkles className="size-5" />
            </span>
            <h2 id="admin-home-spotlight-modal-title" className="truncate text-lg font-bold text-slate-950 sm:text-xl">
              Invitacion a Sobre nosotros
            </h2>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-full bg-stone-100 p-2 text-slate-600 transition hover:bg-stone-200"
            aria-label="Cerrar"
          >
            <X className="size-5" />
          </button>
        </AdminModalHeader>

        <AdminModalBody className="space-y-5">
          <p className="text-sm text-slate-600">
            Bloque del inicio que invita a visitar Sobre nosotros. No usa la mision ni la galeria.
          </p>

          <CampoTexto
            label="Titulo"
            name="title"
            value={form.title}
            onChange={cambiarCampo}
            required
          />

          <label className="grid gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
            Texto breve
            <textarea
              name="description"
              value={form.description}
              onChange={cambiarCampo}
              rows={4}
              className="resize-none rounded-xl border border-slate-300 px-4 py-3 text-base font-normal normal-case leading-7 tracking-normal text-slate-950 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              required
            />
          </label>

          <CampoTexto
            label="Imagen URL"
            name="image"
            value={form.image}
            onChange={cambiarCampo}
            placeholder="https://..."
            hint="Imagen propia del bloque. No se toma de la galeria."
          />
        </AdminModalBody>

        <AdminModalFooter>
          <button
            type="button"
            onClick={onCerrar}
            className="w-full rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 sm:w-auto"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="w-full rounded-xl bg-amber-700 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </AdminModalFooter>
      </form>
    </AdminModal>
  );
}

function ModalNavbar({ navbar, onCerrar, onGuardar, guardando }) {
  const [form, setForm] = useState(() => ({ ...navbarInicial, ...navbar }));

  const cambiarCampo = (event) => {
    const { name, value } = event.target;
    setForm((actual) => ({ ...actual, [name]: value }));
  };

  const enviar = (event) => {
    event.preventDefault();
    onGuardar(form);
  };

  return (
    <AdminModal open onClose={onCerrar} maxWidth="max-w-2xl" labelledBy="admin-navbar-modal-title">
      <form onSubmit={enviar} className="flex min-h-0 flex-1 flex-col">
        <AdminModalHeader>
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700">
              <LayoutTemplate className="size-5" />
            </span>
            <h2 id="admin-navbar-modal-title" className="truncate text-lg font-bold text-slate-950 sm:text-xl">Navbar</h2>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-full bg-stone-100 p-2 text-slate-600 transition hover:bg-stone-200"
            aria-label="Cerrar"
          >
            <X className="size-5" />
          </button>
        </AdminModalHeader>

        <AdminModalBody className="space-y-5">
          <CampoTexto
            label="Logo URL"
            name="logoUrl"
            value={form.logoUrl}
            onChange={cambiarCampo}
            placeholder="https://..."
            hint="Logo para fondos claros."
          />
          <CampoTexto
            label="Logo claro URL"
            name="logoClaroUrl"
            value={form.logoClaroUrl}
            onChange={cambiarCampo}
            placeholder="https://..."
            hint="Logo para fondos oscuros o al hacer scroll."
          />
        </AdminModalBody>

        <AdminModalFooter>
          <button
            type="button"
            onClick={onCerrar}
            className="w-full rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 sm:w-auto"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="w-full rounded-xl bg-amber-700 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </AdminModalFooter>
      </form>
    </AdminModal>
  );
}

function ModalFooter({ footer, onCerrar, onGuardar, guardando }) {
  const [form, setForm] = useState(() => ({ ...footerInicial, ...footer }));

  const cambiarCampo = (event) => {
    const { name, value } = event.target;
    setForm((actual) => ({ ...actual, [name]: value }));
  };

  const enviar = (event) => {
    event.preventDefault();
    onGuardar(form);
  };

  return (
    <AdminModal open onClose={onCerrar} maxWidth="max-w-2xl" labelledBy="admin-footer-modal-title">
      <form onSubmit={enviar} className="flex min-h-0 flex-1 flex-col">
        <AdminModalHeader>
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700">
              <PanelBottom className="size-5" />
            </span>
            <h2 id="admin-footer-modal-title" className="truncate text-lg font-bold text-slate-950 sm:text-xl">Footer</h2>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-full bg-stone-100 p-2 text-slate-600 transition hover:bg-stone-200"
            aria-label="Cerrar"
          >
            <X className="size-5" />
          </button>
        </AdminModalHeader>

        <AdminModalBody className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <CampoTexto
              label="Logo URL"
              name="logoUrl"
              value={form.logoUrl}
              onChange={cambiarCampo}
              placeholder="https://..."
            />
            <CampoTexto
              label="Logo claro URL"
              name="logoClaroUrl"
              value={form.logoClaroUrl}
              onChange={cambiarCampo}
              placeholder="https://..."
            />
          </div>

          <CampoTexto
            label="Frase de marca"
            name="fraseMarca"
            value={form.fraseMarca}
            onChange={cambiarCampo}
            placeholder="Ej. Cultivando futuro desde la UNA"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <CampoTexto
              label="Telefono"
              name="telefono"
              value={form.telefono}
              onChange={cambiarCampo}
              placeholder="8888-8888"
            />
            <CampoTexto
              label="Correo"
              name="correo"
              type="email"
              value={form.correo}
              onChange={cambiarCampo}
              placeholder="contacto@cafeuna.com"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <CampoTexto
              label="Facebook URL"
              name="facebookUrl"
              value={form.facebookUrl}
              onChange={cambiarCampo}
              placeholder="https://facebook.com/..."
            />
            <CampoTexto
              label="Instagram URL"
              name="instagramUrl"
              value={form.instagramUrl}
              onChange={cambiarCampo}
              placeholder="https://instagram.com/..."
            />
          </div>

          <CampoTexto
            label="Google Maps URL"
            name="mapsUrl"
            value={form.mapsUrl}
            onChange={cambiarCampo}
            placeholder="https://maps.google.com/..."
          />

          <CampoTexto
            label="Texto de copyright"
            name="textoCopyright"
            value={form.textoCopyright}
            onChange={cambiarCampo}
            placeholder="© 2026 Cafe UNA. Todos los derechos reservados."
          />
        </AdminModalBody>

        <AdminModalFooter>
          <button
            type="button"
            onClick={onCerrar}
            className="w-full rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 sm:w-auto"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="w-full rounded-xl bg-amber-700 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </AdminModalFooter>
      </form>
    </AdminModal>
  );
}

function ModalEnlaces({ config, enlaces, onCerrar, onGuardar, guardando, puedeEliminar }) {
  const [items, setItems] = useState(() => (Array.isArray(enlaces) ? enlaces : []));

  const cambiarItem = (id, campo, valor) => {
    setItems((actual) => actual.map((item) => (item.id === id ? { ...item, [campo]: valor } : item)));
  };

  const agregarItem = () => {
    const siguienteOrden = items.reduce((max, item) => Math.max(max, Number(item.orden) || 0), 0) + 1;
    setItems((actual) => [
      ...actual,
      {
        id: Date.now(),
        etiqueta: "",
        ruta: "",
        orden: siguienteOrden,
        abrirEnNuevaPestana: false,
      },
    ]);
  };

  const eliminarItem = (id) => {
    setItems((actual) => actual.filter((item) => item.id !== id));
  };

  const enviar = (event) => {
    event.preventDefault();
    onGuardar(
      items.filter((item) => item.etiqueta?.trim() && item.ruta?.trim())
    );
  };

  return (
    <AdminModal open onClose={onCerrar} maxWidth="max-w-3xl" labelledBy="admin-enlaces-modal-title">
      <form onSubmit={enviar} className="flex min-h-0 flex-1 flex-col">
        <AdminModalHeader>
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700">
              <Link2 className="size-5" />
            </span>
            <h2 id="admin-enlaces-modal-title" className="truncate text-lg font-bold text-slate-950 sm:text-xl">
              {config.titulo}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-full bg-stone-100 p-2 text-slate-600 transition hover:bg-stone-200"
            aria-label="Cerrar"
          >
            <X className="size-5" />
          </button>
        </AdminModalHeader>

        <AdminModalBody className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Enlaces actuales</p>
            <button
              type="button"
              onClick={agregarItem}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-amber-200 px-4 py-2 text-sm font-bold text-amber-800 transition hover:bg-amber-50 sm:w-auto"
            >
              <Plus className="size-4" />
              Agregar enlace
            </button>
          </div>

          {items.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              No hay enlaces configurados. Agregue uno para mostrarlo en el sitio.
            </p>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1fr_auto]">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="grid gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Etiqueta
                      <input
                        value={item.etiqueta ?? ""}
                        onChange={(event) => cambiarItem(item.id, "etiqueta", event.target.value)}
                        placeholder={`Enlace ${index + 1}`}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-normal normal-case tracking-normal text-slate-950 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                        required
                      />
                    </label>
                    <label className="grid gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Ruta
                      <input
                        value={item.ruta ?? ""}
                        onChange={(event) => cambiarItem(item.id, "ruta", event.target.value)}
                        placeholder="/productos o https://..."
                        className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-normal normal-case tracking-normal text-slate-950 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                        required
                      />
                    </label>
                    <label className="grid gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Orden
                      <input
                        type="number"
                        min="1"
                        value={item.orden ?? index + 1}
                        onChange={(event) => cambiarItem(item.id, "orden", event.target.value)}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-normal normal-case tracking-normal text-slate-950 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                      />
                    </label>
                    <label className="flex items-end gap-2 pb-3 text-sm font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={Boolean(item.abrirEnNuevaPestana)}
                        onChange={(event) => cambiarItem(item.id, "abrirEnNuevaPestana", event.target.checked)}
                        className="size-4 rounded border-slate-300"
                      />
                      Abrir en nueva pestana
                    </label>
                  </div>

                  {puedeEliminar ? (
                    <button
                      type="button"
                      onClick={() => eliminarItem(item.id)}
                      className="inline-flex size-10 items-center justify-center self-start rounded-xl bg-red-50 text-red-700 transition hover:bg-red-100 md:self-center"
                      aria-label="Eliminar enlace"
                    >
                      <Trash2 className="size-5" />
                    </button>
                  ) : (
                    <span className="self-start text-xs font-semibold text-slate-400 md:self-center">Sin eliminar</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </AdminModalBody>

        <AdminModalFooter>
          <button
            type="button"
            onClick={onCerrar}
            className="w-full rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 sm:w-auto"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="w-full rounded-xl bg-amber-700 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </AdminModalFooter>
      </form>
    </AdminModal>
  );
}

function TarjetaSeccion({ etiqueta, titulo, descripcion, icono: Icon, onEditar }) {
  return (
    <article className="border-l-4 border-amber-700 bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">{etiqueta}</p>
          <h2 className="mt-2 break-words text-lg font-bold text-slate-950 sm:text-xl">{titulo}</h2>
          <p className="mt-3 max-w-3xl text-sm text-slate-600 sm:text-base">{descripcion}</p>
        </div>
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700 sm:size-12">
          <Icon className="size-5 sm:size-6" />
        </span>
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <EstadoPublicado />
        <button
          type="button"
          onClick={onEditar}
          className="w-full rounded-xl border border-amber-300 px-5 py-2 text-sm font-bold text-amber-800 transition hover:bg-amber-50 sm:w-auto"
        >
          Editar
        </button>
      </div>
    </article>
  );
}

const AdminInformacionPaginaPrincipal = () => {
  const actor = (() => {
    try {
      return getActiveSessionUser();
    } catch {
      return null;
    }
  })();
  const actorRoles = Array.isArray(actor?.roles) ? actor.roles : [];
  const esSuperAdmin = actorRoles.some((rol) => String(rol).toLowerCase() === "superadmin");

  const [hero, setHero] = useState(heroInicial);
  const [homeSpotlight, setHomeSpotlight] = useState(homeSpotlightInicial);
  const [navbar, setNavbar] = useState(navbarInicial);
  const [footer, setFooter] = useState(footerInicial);
  const [enlacesNavbar, setEnlacesNavbar] = useState([]);
  const [enlacesFooter, setEnlacesFooter] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [editando, setEditando] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    Promise.all([
      obtenerHero().catch(() => null),
      obtenerSeccion("homeSpotlight").catch(() => null),
      obtenerNavbar().catch(() => null),
      obtenerFooter().catch(() => null),
      obtenerEnlaces("Navbar").catch(() => []),
      obtenerEnlaces("FooterExplorar").catch(() => []),
    ])
      .then(([heroData, homeSpotlightData, navbarData, footerData, navbarEnlaces, footerEnlaces]) => {
        if (!activo) return;

        if (heroData) setHero({ ...heroInicial, ...heroData });
        if (homeSpotlightData) {
          setHomeSpotlight({
            title: homeSpotlightData.title || "",
            description: homeSpotlightData.description || "",
            image: homeSpotlightData.image || "",
          });
        }
        if (navbarData) setNavbar({ ...navbarInicial, ...navbarData });
        if (footerData) setFooter({ ...footerInicial, ...footerData });
        setEnlacesNavbar(Array.isArray(navbarEnlaces) ? navbarEnlaces : []);
        setEnlacesFooter(Array.isArray(footerEnlaces) ? footerEnlaces : []);

        if (!heroData && !navbarData && !footerData) {
          setError("No se pudo cargar la informacion principal.");
        }
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  const guardarHero = async (form) => {
    try {
      setGuardando(true);
      const actualizado = await actualizarSeccion("hero", form);
      setHero({ ...heroInicial, ...actualizado });
      setEditando(null);
    } catch (err) {
      alert(err.message || "No se pudo guardar el hero.");
    } finally {
      setGuardando(false);
    }
  };

  const guardarHomeSpotlight = async (form) => {
    try {
      setGuardando(true);
      const actualizado = await actualizarSeccion("homeSpotlight", form);
      setHomeSpotlight({
        title: actualizado?.title || form.title,
        description: actualizado?.description || form.description,
        image: actualizado?.image || form.image,
      });
      setEditando(null);
    } catch (err) {
      alert(err.message || "No se pudo guardar la invitacion a Sobre nosotros.");
    } finally {
      setGuardando(false);
    }
  };

  const guardarNavbar = async (form) => {
    try {
      setGuardando(true);
      const actualizado = await actualizarNavbar(form);
      setNavbar({ ...navbarInicial, ...actualizado });
      setEditando(null);
    } catch (err) {
      alert(err.message || "No se pudo guardar el navbar.");
    } finally {
      setGuardando(false);
    }
  };

  const guardarFooter = async (form) => {
    try {
      setGuardando(true);
      const actualizado = await actualizarFooter(form);
      setFooter({ ...footerInicial, ...actualizado });
      setEditando(null);
    } catch (err) {
      alert(err.message || "No se pudo guardar el footer.");
    } finally {
      setGuardando(false);
    }
  };

  const guardarEnlaces = async (tipo, enlaces) => {
    const config = CONFIG_ENLACES[tipo];
    if (!config) return;

    const actual = tipo === "enlaces-navbar" ? enlacesNavbar : enlacesFooter;
    const actualPorId = new Map(actual.map((item) => [Number(item.id), item]));
    const validos = enlaces.filter((item) => item.etiqueta?.trim() && item.ruta?.trim());

    const removidos = esSuperAdmin
      ? actual.filter((item) => !validos.some((nuevo) => Number(nuevo.id) === Number(item.id)))
      : [];
    const agregados = validos.filter((item) => !actualPorId.has(Number(item.id)));
    const editados = validos.filter((item) => {
      const previo = actualPorId.get(Number(item.id));
      if (!previo) return false;
      return (
        (previo.etiqueta ?? "") !== (item.etiqueta ?? "").trim()
        || (previo.ruta ?? "") !== (item.ruta ?? "").trim()
        || Number(previo.orden ?? 0) !== Number(item.orden ?? 0)
        || Boolean(previo.abrirEnNuevaPestana) !== Boolean(item.abrirEnNuevaPestana)
      );
    });

    try {
      setGuardando(true);
      await Promise.all(removidos.map((item) => eliminarEnlace(item.id)));
      await Promise.all(
        agregados.map((item) =>
          crearEnlace({
            etiqueta: item.etiqueta.trim(),
            ruta: item.ruta.trim(),
            seccion: config.seccion,
            orden: Number(item.orden) || undefined,
            abrirEnNuevaPestana: Boolean(item.abrirEnNuevaPestana),
          })
        )
      );
      await Promise.all(
        editados.map((item) =>
          actualizarEnlace(item.id, {
            etiqueta: item.etiqueta.trim(),
            ruta: item.ruta.trim(),
            orden: Number(item.orden),
            abrirEnNuevaPestana: Boolean(item.abrirEnNuevaPestana),
          })
        )
      );

      const recargado = await obtenerEnlaces(config.seccion);
      if (tipo === "enlaces-navbar") {
        setEnlacesNavbar(recargado);
      } else {
        setEnlacesFooter(recargado);
      }
      setEditando(null);
    } catch (err) {
      alert(err.message || "No se pudieron guardar los enlaces.");
    } finally {
      setGuardando(false);
    }
  };

  const resumenHomeSpotlight = homeSpotlight.title || homeSpotlight.description
    ? `${homeSpotlight.title || "Sin titulo"} · invita a Sobre nosotros`
    : "Bloque del inicio para dirigir visitantes a Sobre nosotros.";

  const resumenNavbar = navbar.logoUrl || navbar.logoClaroUrl
    ? "Logos configurados para la barra superior del sitio."
    : "Sin logos configurados.";

  const resumenFooter = footer.fraseMarca
    || footer.correo
    || footer.telefono
    || "Sin informacion de contacto configurada.";

  const resumenEnlacesNavbar = enlacesNavbar.length
    ? `${enlacesNavbar.length} enlace${enlacesNavbar.length === 1 ? "" : "s"} en el menu superior.`
    : CONFIG_ENLACES["enlaces-navbar"].descripcionVacia;

  const resumenEnlacesFooter = enlacesFooter.length
    ? `${enlacesFooter.length} enlace${enlacesFooter.length === 1 ? "" : "s"} en la seccion Explorar.`
    : CONFIG_ENLACES["enlaces-footer"].descripcionVacia;

  return (
    <AdminLayout>
      <section className="space-y-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Secciones activas</p>
        </div>

        {cargando ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
            Cargando informacion...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : (
          <div className="space-y-5">
            <TarjetaSeccion
              etiqueta="Hero section"
              titulo={hero.title || "Sin titulo"}
              descripcion={hero.subtitle || "Sin subtitulo configurado."}
              icono={Image}
              onEditar={() => setEditando("hero")}
            />

            <TarjetaSeccion
              etiqueta="Inicio"
              titulo="Invitacion a Sobre nosotros"
              descripcion={resumenHomeSpotlight}
              icono={Sparkles}
              onEditar={() => setEditando("homeSpotlight")}
            />

            <TarjetaSeccion
              etiqueta="Navbar"
              titulo="Barra de navegacion"
              descripcion={resumenNavbar}
              icono={LayoutTemplate}
              onEditar={() => setEditando("navbar")}
            />

            <TarjetaSeccion
              etiqueta="Footer"
              titulo="Pie de pagina"
              descripcion={resumenFooter}
              icono={PanelBottom}
              onEditar={() => setEditando("footer")}
            />

            <TarjetaSeccion
              etiqueta={CONFIG_ENLACES["enlaces-navbar"].etiqueta}
              titulo={CONFIG_ENLACES["enlaces-navbar"].titulo}
              descripcion={resumenEnlacesNavbar}
              icono={Link2}
              onEditar={() => setEditando("enlaces-navbar")}
            />

            <TarjetaSeccion
              etiqueta={CONFIG_ENLACES["enlaces-footer"].etiqueta}
              titulo={CONFIG_ENLACES["enlaces-footer"].titulo}
              descripcion={resumenEnlacesFooter}
              icono={Link2}
              onEditar={() => setEditando("enlaces-footer")}
            />
          </div>
        )}
      </section>

      {editando === "hero" ? (
        <ModalHero hero={hero} onCerrar={() => setEditando(null)} onGuardar={guardarHero} guardando={guardando} />
      ) : null}

      {editando === "homeSpotlight" ? (
        <ModalHomeSpotlight
          data={homeSpotlight}
          onCerrar={() => setEditando(null)}
          onGuardar={guardarHomeSpotlight}
          guardando={guardando}
        />
      ) : null}

      {editando === "navbar" ? (
        <ModalNavbar navbar={navbar} onCerrar={() => setEditando(null)} onGuardar={guardarNavbar} guardando={guardando} />
      ) : null}

      {editando === "footer" ? (
        <ModalFooter footer={footer} onCerrar={() => setEditando(null)} onGuardar={guardarFooter} guardando={guardando} />
      ) : null}

      {editando === "enlaces-navbar" ? (
        <ModalEnlaces
          config={CONFIG_ENLACES["enlaces-navbar"]}
          enlaces={enlacesNavbar}
          onCerrar={() => setEditando(null)}
          onGuardar={(lista) => guardarEnlaces("enlaces-navbar", lista)}
          guardando={guardando}
          puedeEliminar={esSuperAdmin}
        />
      ) : null}

      {editando === "enlaces-footer" ? (
        <ModalEnlaces
          config={CONFIG_ENLACES["enlaces-footer"]}
          enlaces={enlacesFooter}
          onCerrar={() => setEditando(null)}
          onGuardar={(lista) => guardarEnlaces("enlaces-footer", lista)}
          guardando={guardando}
          puedeEliminar={esSuperAdmin}
        />
      ) : null}
    </AdminLayout>
  );
};

export default AdminInformacionPaginaPrincipal;
