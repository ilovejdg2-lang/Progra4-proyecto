import { useCallback, useEffect, useMemo, useState } from "react";
import { Coffee, ClipboardList, Image, LayoutTemplate, Link2, MapPin, PanelBottom, Plus, Sparkles, Trash2, Users, X } from "lucide-react";

import { AdminLayout } from "../layouts/AdminLayout";
import { AdminModal, AdminModalActions, AdminModalBody, AdminModalFooter, AdminModalHeader } from "../../../Components/Admin/ui/AdminModal";
import { AdminListaToolbar, AdminListaVacia } from "../../../Components/Admin/ui/AdminListaToolbar";
import {
  AdminEditorConPreview,
  PreviewEnlaces,
  PreviewFooterLive,
  PreviewHeroLive,
  PreviewHomeSectionLive,
  PreviewNavbarLive,
  PreviewTarjetasInicioLive,
} from "../../../Components/Admin/ui/AdminCmsPreview";
import { AdminSeccionCard } from "../../../Components/Admin/ui/AdminSeccionCard";
import { NumericInput } from "../../../Components/NumericInput/NumericInput";
import { AdminPageGate } from "../../../Components/AdminPageGate/AdminPageGate";
import { useAdminPageGate } from "../../../hooks/useAdminPageGate";
import { useAdminListaFiltros } from "../../../hooks/useAdminListaFiltros";
import { useCachedPageData } from "../../../hooks/useCachedPageData";
import { filtrarPorBusqueda } from "../../../lib/adminListaFiltros";
import { fetchAdminMainPageData } from "../../../lib/adminMainPageData";
import { mapHero } from "../../../lib/heroData";
import {
  actualizarEnlace,
  actualizarFooter,
  actualizarNavbar,
  actualizarSeccion,
  actualizarTarjetasInicio,
  crearEnlace,
  eliminarEnlace,
  obtenerEnlaces,
} from "../../../services/informacionService";
import { getActiveSessionUser } from "../../../services/sessionService";
import { tienePermiso } from "../../../lib/permisos";
import { CampoLimitePalabras } from "../../../Components/Admin/ui/CampoLimitePalabras";
import {
  MAX_PALABRAS_BOTON,
  MAX_PALABRAS_ETIQUETA,
  MAX_PALABRAS_TEXTO,
  MAX_PALABRAS_TEXTO_BREVE,
  MAX_PALABRAS_TITULO,
  etiquetaContadorPalabras,
  limitarPalabras,
} from "../../../lib/formLimits";
import { ST } from "../../../Components/T/ST";
import { useTraducir } from "../../../hooks/useTraducir";
import { t } from "../../../lib/t";
import { asegurarCamposEnEspanol, camposParaVistaAdmin, traducirListaObjetos } from "../../../lib/traducir";
import { useIdioma } from "../../../lib/useIdioma";

const HERO_CAMPOS_TEXTO = ["eyebrow", "title", "subtitle", "primaryButtonText", "buttonText"];
const SECCION_CAMPOS_TEXTO = ["eyebrow", "title", "description", "linkText"];
const TARJETA_CAMPOS_TEXTO = ["etiqueta", "titulo", "descripcion", "textoBoton"];
const FOOTER_CAMPOS_TEXTO = ["fraseMarca", "textoCopyright"];
const ENLACE_CAMPOS_TEXTO = ["etiqueta"];

const heroInicial = {
  eyebrow: "",
  title: "",
  subtitle: "",
  primaryButtonText: "",
  primaryButtonUrl: "",
  buttonText: "",
  buttonUrl: "",
  backgroundImage: "",
};

const seccionInicioVacia = {
  eyebrow: "",
  title: "",
  description: "",
  image: "",
  linkUrl: "",
  linkText: "",
};

const CONFIG_SECCIONES_INICIO = {
  homeSpotlight: {
    etiqueta: "Inicio",
    tituloTarjeta: "Sobre nosotros (inicio)",
    modalTitle: "Sobre nosotros (inicio)",
    ayuda: "Bloque del inicio que invita a visitar Sobre nosotros. No usa la misi\u00f3n ni la galer\u00eda.",
    icon: Sparkles,
    showEyebrow: false,
    showImage: true,
    titleLabel: "T\u00edtulo",
    descriptionLabel: "Texto breve",
    showLinkUrl: true,
    showLinkText: true,
    linkUrlLabel: "Enlace del bot\u00f3n",
    linkTextLabel: "Texto del bot\u00f3n",
  },
  homeFeatured: {
    etiqueta: "Inicio",
    tituloTarjeta: "Productos destacados",
    modalTitle: "Productos destacados",
    ayuda: "Encabezado de la secci\u00f3n de productos destacados en el inicio.",
    icon: Coffee,
    showEyebrow: false,
    showImage: false,
    titleLabel: "T\u00edtulo",
    descriptionLabel: "Texto introductorio",
    showLinkUrl: true,
    showLinkText: true,
    linkUrlLabel: "Enlace del bot\u00f3n",
    linkTextLabel: "Texto del bot\u00f3n",
  },
  homeIniciativas: {
    etiqueta: "Inicio",
    tituloTarjeta: "Iniciativas",
    modalTitle: "Iniciativas",
    ayuda: "Texto principal de la secci\u00f3n de iniciativas (donaciones, visitas y voluntariado).",
    icon: Users,
    showEyebrow: true,
    showImage: false,
    eyebrowLabel: "Etiqueta superior",
    titleLabel: "T\u00edtulo principal",
    descriptionLabel: "Subt\u00edtulo",
  },
  homeLocation: {
    etiqueta: "Inicio",
    tituloTarjeta: "Ubicaci\u00f3n",
    modalTitle: "Ubicaci\u00f3n",
    ayuda: "Texto, foto y enlace de la secci\u00f3n de ubicaci\u00f3n en el inicio.",
    icon: MapPin,
    showEyebrow: true,
    showImage: true,
    showLinkUrl: true,
    showLinkText: true,
    eyebrowLabel: "Etiqueta superior",
    titleLabel: "T\u00edtulo",
    descriptionLabel: "Descripci\u00f3n",
    linkUrlLabel: "Enlace de Google Maps",
    linkTextLabel: "Texto del bot\u00f3n",
  },
};

const TARJETAS_INICIO_LABELS = {
  donaciones: "Donaciones",
  visitas: "Visitas",
  voluntariado: "Voluntariado",
};

const tarjetaInicioVacia = {
  clave: "",
  etiqueta: "",
  titulo: "",
  descripcion: "",
  ruta: "",
  textoBoton: "",
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
    titulo: "Men\u00fa de navegaci\u00f3n",
    descripcionVacia: "Sin enlaces en el men\u00fa superior.",
  },
  "enlaces-footer": {
    seccion: "FooterExplorar",
    etiqueta: "Enlaces del footer",
    titulo: "Secci\u00f3n Explorar",
    descripcionVacia: "Sin enlaces en la columna Explorar del pie de p\u00e1gina.",
  },
};

function CampoTexto({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  hint,
  required,
  maxPalabras = MAX_PALABRAS_TITULO,
  sinLimite = false,
  soloNumeros = false,
  maxLength,
}) {
  const tLabel = useTraducir(label || "");
  const tPlaceholder = useTraducir(placeholder || "");
  const tHint = useTraducir(hint || "");
  // URLs, teléfonos, correos y rutas no llevan tope de palabras.
  if (soloNumeros) {
    return (
      <label className="grid gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
        {tLabel}
        <NumericInput
          name={name}
          value={value}
          onChange={onChange}
          placeholder={tPlaceholder || undefined}
          required={required}
          maxLength={maxLength}
          className="h-[var(--control-height)] w-full rounded-full border border-slate-200 bg-slate-50 px-4 text-[length:var(--text-body)] font-normal normal-case tracking-normal text-slate-950 shadow-none outline-none transition focus:border-slate-400 focus:bg-white focus:shadow-none focus:ring-0 focus:outline-none"
        />
        {hint ? (
          <span className="text-xs font-medium normal-case tracking-normal text-slate-400">{tHint}</span>
        ) : null}
      </label>
    );
  }

  if (sinLimite || type === "url" || type === "email" || type === "tel") {
    return (
      <label className="grid gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
        {tLabel}
        <input
          name={name}
          type={type === "url" ? "text" : type}
          value={value}
          onChange={onChange}
          placeholder={tPlaceholder || undefined}
          required={required}
          className="h-[var(--control-height)] w-full rounded-full border border-slate-200 bg-slate-50 px-4 text-[length:var(--text-body)] font-normal normal-case tracking-normal text-slate-950 shadow-none outline-none transition focus:border-slate-400 focus:bg-white focus:shadow-none focus:ring-0 focus:outline-none"
        />
        {hint ? (
          <span className="text-xs font-medium normal-case tracking-normal text-slate-400">{tHint}</span>
        ) : null}
      </label>
    );
  }

  return (
    <CampoLimitePalabras
      label={label}
      name={name}
      value={value}
      onChange={onChange}
      maxPalabras={maxPalabras}
      type={type}
      placeholder={placeholder}
      hint={hint}
      required={required}
    />
  );
}

function CampoArea({ label, name, value, onChange, rows = 4, required, maxPalabras = MAX_PALABRAS_TEXTO, hint }) {
  return (
    <CampoLimitePalabras
      label={label}
      name={name}
      value={value}
      onChange={onChange}
      maxPalabras={maxPalabras}
      multiline
      rows={rows}
      required={required}
      hint={hint}
    />
  );
}

function ModalHero({ hero, onCerrar, onGuardar, guardando }) {
  const [form, setForm] = useState(() => ({ ...heroInicial, ...hero }));
  const { idioma } = useIdioma();
  const tGuardando = useTraducir("Guardando...");
  const tGuardarCambios = useTraducir("Guardar cambios");

  useEffect(() => {
    let cancelado = false;
    const base = { ...heroInicial, ...hero };
    setForm(base);
    (async () => {
      const vista = await camposParaVistaAdmin(base, HERO_CAMPOS_TEXTO, idioma);
      if (!cancelado) setForm(vista);
    })();
    return () => {
      cancelado = true;
    };
  }, [hero, idioma]);

  const cambiarCampo = (event) => {
    const { name, value } = event.target;
    setForm((actual) => ({ ...actual, [name]: value }));
  };

  const enviar = async (event) => {
    event.preventDefault();
    const paraGuardar = await asegurarCamposEnEspanol(form, HERO_CAMPOS_TEXTO);
    onGuardar(paraGuardar);
  };

  return (
    <AdminModal open onClose={onCerrar} maxWidth="max-w-xl" labelledBy="admin-hero-modal-title">
      <form onSubmit={enviar} className="flex min-h-0 flex-1 flex-col">
        <AdminModalHeader>
          <div className="flex min-w-0 items-center gap-2.5">
            <Image className="size-6 shrink-0 text-amber-700" strokeWidth={1.75} aria-hidden="true" />
            <h2 id="admin-hero-modal-title" className="truncate text-[length:var(--text-subtitle)] font-bold text-slate-950">Hero section</h2>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label={t("Cerrar")}
          >
            <X className="size-5" />
          </button>
        </AdminModalHeader>

        <AdminModalBody cms>
          <AdminEditorConPreview
            preview={<PreviewHeroLive form={form} />}
            ayuda={"Banner principal de la p\u00e1gina de inicio."}
          >
          <CampoTexto
            label="Etiqueta superior"
            name="eyebrow"
            value={form.eyebrow}
            onChange={cambiarCampo}
            hint={"Texto peque\u00f1o que aparece sobre el t\u00edtulo principal."}
            maxPalabras={MAX_PALABRAS_ETIQUETA}
          />

          <CampoTexto
            label={"T\u00edtulo principal"}
            name="title"
            value={form.title}
            onChange={cambiarCampo}
            required
            hint={"Puedes usar Enter para forzar un salto de l\u00ednea en el t\u00edtulo."}
            maxPalabras={MAX_PALABRAS_TITULO}
          />

          <CampoArea
            label={"Subt\u00edtulo"}
            name="subtitle"
            value={form.subtitle}
            onChange={cambiarCampo}
            rows={4}
            required
            maxPalabras={MAX_PALABRAS_TEXTO}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <CampoTexto
              label={"Texto bot\u00f3n principal"}
              name="primaryButtonText"
              value={form.primaryButtonText}
              onChange={cambiarCampo}
              maxPalabras={MAX_PALABRAS_BOTON}
            />
            <CampoTexto
              label={"Enlace bot\u00f3n principal"}
              name="primaryButtonUrl"
            sinLimite
              value={form.primaryButtonUrl}
              onChange={cambiarCampo}
              placeholder="/productos o https://..."
              hint="Ruta interna del sitio o URL externa."
            />
            <CampoTexto
              label={"Texto bot\u00f3n secundario"}
              name="buttonText"
              value={form.buttonText}
              onChange={cambiarCampo}
              maxPalabras={MAX_PALABRAS_BOTON}
            />
            <CampoTexto
              label={"Enlace bot\u00f3n secundario"}
              name="buttonUrl"
            sinLimite
              value={form.buttonUrl}
              onChange={cambiarCampo}
              placeholder="/AboutUs o https://..."
              hint="Ruta interna del sitio o URL externa."
            />
          </div>

          <CampoTexto
            label="Imagen de fondo URL"
            name="backgroundImage"
            sinLimite
            value={form.backgroundImage}
            onChange={cambiarCampo}
            placeholder="https://..."
          />
          </AdminEditorConPreview>
        </AdminModalBody>

        <AdminModalFooter>
          <AdminModalActions
            buttonStyle="voluntariado"
            onCancel={onCerrar}
            primaryLabel={guardando ? tGuardando : tGuardarCambios}
            primaryDisabled={guardando}
          />
        </AdminModalFooter>
      </form>
    </AdminModal>
  );
}

function ModalSeccionInicio({ clave, config, data, tarjetasInicio = [], onCerrar, onGuardar, guardando }) {
  const [form, setForm] = useState(() => ({ ...seccionInicioVacia, ...data }));
  const tModalTitle = useTraducir(config.modalTitle || "");
  const tGuardando = useTraducir("Guardando...");
  const tGuardarCambios = useTraducir("Guardar cambios");
  const { idioma } = useIdioma();

  useEffect(() => {
    let cancelado = false;
    const base = { ...seccionInicioVacia, ...data };
    setForm(base);
    (async () => {
      const vista = await camposParaVistaAdmin(base, SECCION_CAMPOS_TEXTO, idioma);
      if (!cancelado) setForm(vista);
    })();
    return () => {
      cancelado = true;
    };
  }, [data, idioma]);

  const cambiarCampo = (event) => {
    const { name, value } = event.target;
    setForm((actual) => ({ ...actual, [name]: value }));
  };

  const enviar = async (event) => {
    event.preventDefault();
    const paraGuardar = await asegurarCamposEnEspanol(form, SECCION_CAMPOS_TEXTO);
    onGuardar(paraGuardar);
  };

  return (
    <AdminModal open onClose={onCerrar} maxWidth="max-w-xl" labelledBy="admin-seccion-inicio-modal-title">
      <form onSubmit={enviar} className="flex min-h-0 flex-1 flex-col">
        <AdminModalHeader>
          <div className="flex min-w-0 items-center gap-2.5">
            <config.icon className="size-6 shrink-0 text-amber-700" strokeWidth={1.75} aria-hidden="true" />
            <h2 id="admin-seccion-inicio-modal-title" className="truncate text-[length:var(--text-subtitle)] font-bold text-slate-950">
              {tModalTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label={t("Cerrar")}
          >
            <X className="size-5" />
          </button>
        </AdminModalHeader>

        <AdminModalBody cms>
          <AdminEditorConPreview
            preview={(
              <PreviewHomeSectionLive
                clave={clave}
                form={form}
                tarjetasInicio={tarjetasInicio}
              />
            )}
            ayuda={config.ayuda}
          >
          {config.showEyebrow ? (
            <CampoTexto
              label={config.eyebrowLabel || "Etiqueta superior"}
              name="eyebrow"
              value={form.eyebrow}
              onChange={cambiarCampo}
              maxPalabras={MAX_PALABRAS_ETIQUETA}
            />
          ) : null}
          <CampoTexto
            label={config.titleLabel || "T\u00edtulo"}
            name="title"
            value={form.title}
            onChange={cambiarCampo}
            required
            maxPalabras={MAX_PALABRAS_TITULO}
          />
          <CampoArea
            label={config.descriptionLabel || "Descripci\u00f3n"}
            name="description"
            value={form.description}
            onChange={cambiarCampo}
            rows={4}
            required
            maxPalabras={MAX_PALABRAS_TEXTO}
          />
          {config.showLinkText ? (
            <CampoTexto
              label={config.linkTextLabel || "Texto del bot\u00f3n"}
              name="linkText"
              value={form.linkText}
              onChange={cambiarCampo}
              maxPalabras={MAX_PALABRAS_BOTON}
            />
          ) : null}

          {config.showImage ? (
            <CampoTexto
              label="Imagen URL"
              name="image"
            sinLimite
              value={form.image}
              onChange={cambiarCampo}
              placeholder="https://..."
              hint={"Imagen propia del bloque. No se toma de la galer\u00eda."}
            />
          ) : null}

          {config.showLinkUrl ? (
            <CampoTexto
              label={config.linkUrlLabel || "Enlace"}
              name="linkUrl"
            sinLimite
              value={form.linkUrl}
              onChange={cambiarCampo}
              placeholder="/productos o https://..."
            />
          ) : null}
          </AdminEditorConPreview>
        </AdminModalBody>

        <AdminModalFooter>
          <AdminModalActions
            buttonStyle="voluntariado"
            onCancel={onCerrar}
            primaryLabel={guardando ? tGuardando : tGuardarCambios}
            primaryDisabled={guardando}
          />
        </AdminModalFooter>
      </form>
    </AdminModal>
  );
}

function ModalTarjetasInicio({ tarjetas, onCerrar, onGuardar, guardando }) {
  const mapTarjetas = (lista) =>
    (Array.isArray(lista) ? lista : []).map((tarjeta) => ({
      ...tarjetaInicioVacia,
      ...tarjeta,
      clave: tarjeta.clave || tarjeta.Clave || "",
      etiqueta: tarjeta.etiqueta || tarjeta.Etiqueta || "",
      titulo: tarjeta.titulo || tarjeta.Titulo || "",
      descripcion: tarjeta.descripcion || tarjeta.Descripcion || "",
      ruta: tarjeta.ruta || tarjeta.Ruta || "",
      textoBoton: tarjeta.textoBoton || tarjeta.TextoBoton || "",
    }));

  const [form, setForm] = useState(() => mapTarjetas(tarjetas));
  const { idioma } = useIdioma();
  const tTituloMini = useTraducir("Mini formularios del inicio");
  const tGuardando = useTraducir("Guardando...");
  const tGuardarCambios = useTraducir("Guardar cambios");

  useEffect(() => {
    let cancelado = false;
    const base = mapTarjetas(tarjetas);
    setForm(base);
    (async () => {
      if (idioma !== "en") {
        if (!cancelado) setForm(base);
        return;
      }
      const vista = await traducirListaObjetos(base, TARJETA_CAMPOS_TEXTO);
      if (!cancelado) setForm(vista);
    })();
    return () => {
      cancelado = true;
    };
  }, [tarjetas, idioma]);

  const cambiarCampo = (index, name, value) => {
    setForm((actual) =>
      actual.map((tarjeta, idx) => (idx === index ? { ...tarjeta, [name]: value } : tarjeta)),
    );
  };

  const enviar = async (event) => {
    event.preventDefault();
    const normalizadas = await Promise.all(
      form.map(async (tarjeta) => {
        const enEs = await asegurarCamposEnEspanol(tarjeta, TARJETA_CAMPOS_TEXTO);
        return {
          clave: enEs.clave,
          etiqueta: enEs.etiqueta,
          titulo: enEs.titulo,
          descripcion: enEs.descripcion,
          ruta: enEs.ruta,
          textoBoton: enEs.textoBoton,
        };
      }),
    );
    onGuardar(normalizadas);
  };

  return (
    <AdminModal open onClose={onCerrar} maxWidth="max-w-xl" labelledBy="admin-tarjetas-inicio-modal-title">
      <form onSubmit={enviar} className="flex min-h-0 flex-1 flex-col">
        <AdminModalHeader>
          <div className="flex min-w-0 items-center gap-2.5">
            <ClipboardList className="size-6 shrink-0 text-emerald-700" strokeWidth={1.75} aria-hidden="true" />
            <h2 id="admin-tarjetas-inicio-modal-title" className="truncate text-[length:var(--text-subtitle)] font-bold text-slate-950">
              {tTituloMini}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label={t("Cerrar")}
          >
            <X className="size-5" />
          </button>
        </AdminModalHeader>

        <AdminModalBody cms>
          <AdminEditorConPreview
            preview={<PreviewTarjetasInicioLive tarjetas={form} />}
            ayuda={"Edit\u00e1 las tres tarjetas de donaciones, visitas y voluntariado que aparecen en el inicio."}
          >

          {form.map((tarjeta, index) => (
            <div key={tarjeta.clave || index} className="space-y-4 rounded-2xl border border-slate-200 p-4 sm:p-5">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                {TARJETAS_INICIO_LABELS[tarjeta.clave] || tarjeta.clave}
              </h3>

              <CampoTexto
                label="Etiqueta"
                name={`etiqueta-${index}`}
                value={tarjeta.etiqueta}
                onChange={(event) => cambiarCampo(index, "etiqueta", event.target.value)}
                required
                maxPalabras={MAX_PALABRAS_ETIQUETA}
              />

              <CampoTexto
                label={"T\u00edtulo"}
                name={`titulo-${index}`}
                value={tarjeta.titulo}
                onChange={(event) => cambiarCampo(index, "titulo", event.target.value)}
                required
                maxPalabras={MAX_PALABRAS_TITULO}
              />

              <CampoArea
                label={"Descripci\u00f3n"}
                name={`descripcion-${index}`}
                value={tarjeta.descripcion}
                onChange={(event) => cambiarCampo(index, "descripcion", event.target.value)}
                rows={3}
                required
                maxPalabras={MAX_PALABRAS_TEXTO_BREVE}
              />

              {tarjeta.clave === "voluntariado" ? (
                <CampoTexto
                  label="Ruta del formulario"
                  name={`ruta-${index}`}
                  value={tarjeta.ruta}
                  onChange={(event) => cambiarCampo(index, "ruta", event.target.value)}
                  placeholder="/voluntariado/solicitar"
                  hint={"Ruta interna del bot\u00f3n."}
                  sinLimite
                />
              ) : null}

              <CampoTexto
                label={"Texto del bot\u00f3n"}
                name={`textoBoton-${index}`}
                value={tarjeta.textoBoton}
                onChange={(event) => cambiarCampo(index, "textoBoton", event.target.value)}
                maxPalabras={MAX_PALABRAS_BOTON}
              />
            </div>
          ))}
          </AdminEditorConPreview>
        </AdminModalBody>

        <AdminModalFooter>
          <AdminModalActions
            buttonStyle="voluntariado"
            onCancel={onCerrar}
            primaryLabel={guardando ? tGuardando : tGuardarCambios}
            primaryDisabled={guardando}
          />
        </AdminModalFooter>
      </form>
    </AdminModal>
  );
}

function ModalNavbar({ navbar, enlaces = [], onCerrar, onGuardar, guardando }) {
  const [form, setForm] = useState(() => ({ ...navbarInicial, ...navbar }));
  const tGuardando = useTraducir("Guardando...");
  const tGuardarCambios = useTraducir("Guardar cambios");

  const cambiarCampo = (event) => {
    const { name, value } = event.target;
    setForm((actual) => ({ ...actual, [name]: value }));
  };

  const enviar = (event) => {
    event.preventDefault();
    onGuardar(form);
  };

  return (
    <AdminModal open onClose={onCerrar} maxWidth="max-w-xl" labelledBy="admin-navbar-modal-title">
      <form onSubmit={enviar} className="flex min-h-0 flex-1 flex-col">
        <AdminModalHeader>
          <div className="flex min-w-0 items-center gap-2.5">
            <LayoutTemplate className="size-6 shrink-0 text-amber-700" strokeWidth={1.75} aria-hidden="true" />
            <h2 id="admin-navbar-modal-title" className="truncate text-[length:var(--text-subtitle)] font-bold text-slate-950">Navbar</h2>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label={t("Cerrar")}
          >
            <X className="size-5" />
          </button>
        </AdminModalHeader>

        <AdminModalBody cms>
          <AdminEditorConPreview
            preview={<PreviewNavbarLive form={form} enlaces={enlaces} />}
            ayuda={"Logos que aparecen en la barra de navegaci\u00f3n del sitio."}
          >
          <CampoTexto
            label="Logo URL"
            name="logoUrl"
            sinLimite
            value={form.logoUrl}
            onChange={cambiarCampo}
            placeholder="https://..."
            hint="Logo para fondos claros (al hacer scroll)."
          />
          <CampoTexto
            label="Logo claro URL"
            name="logoClaroUrl"
            sinLimite
            value={form.logoClaroUrl}
            onChange={cambiarCampo}
            placeholder="https://..."
            hint="Logo para fondos oscuros (inicio, sin scroll)."
          />
          </AdminEditorConPreview>
        </AdminModalBody>

        <AdminModalFooter>
          <AdminModalActions
            buttonStyle="voluntariado"
            onCancel={onCerrar}
            primaryLabel={guardando ? tGuardando : tGuardarCambios}
            primaryDisabled={guardando}
          />
        </AdminModalFooter>
      </form>
    </AdminModal>
  );
}

function ModalFooter({ footer, enlaces = [], onCerrar, onGuardar, guardando }) {
  const [form, setForm] = useState(() => ({ ...footerInicial, ...footer }));
  const { idioma } = useIdioma();
  const tGuardando = useTraducir("Guardando...");
  const tGuardarCambios = useTraducir("Guardar cambios");

  useEffect(() => {
    let cancelado = false;
    const base = { ...footerInicial, ...footer };
    setForm(base);
    (async () => {
      const vista = await camposParaVistaAdmin(base, FOOTER_CAMPOS_TEXTO, idioma);
      if (!cancelado) setForm(vista);
    })();
    return () => {
      cancelado = true;
    };
  }, [footer, idioma]);

  const cambiarCampo = (event) => {
    const { name, value } = event.target;
    setForm((actual) => ({ ...actual, [name]: value }));
  };

  const enviar = async (event) => {
    event.preventDefault();
    const paraGuardar = await asegurarCamposEnEspanol(form, FOOTER_CAMPOS_TEXTO);
    onGuardar(paraGuardar);
  };

  return (
    <AdminModal open onClose={onCerrar} maxWidth="max-w-xl" labelledBy="admin-footer-modal-title">
      <form onSubmit={enviar} className="flex min-h-0 flex-1 flex-col">
        <AdminModalHeader>
          <div className="flex min-w-0 items-center gap-2.5">
            <PanelBottom className="size-6 shrink-0 text-amber-700" strokeWidth={1.75} aria-hidden="true" />
            <h2 id="admin-footer-modal-title" className="truncate text-[length:var(--text-subtitle)] font-bold text-slate-950">Footer</h2>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label={t("Cerrar")}
          >
            <X className="size-5" />
          </button>
        </AdminModalHeader>

        <AdminModalBody cms>
          <AdminEditorConPreview
            preview={<PreviewFooterLive form={form} enlaces={enlaces} />}
            ayuda={"Informaci\u00f3n de contacto y pie de p\u00e1gina del sitio."}
          >
          <div className="grid gap-4 md:grid-cols-2">
            <CampoTexto
              label="Logo URL"
              name="logoUrl"
            sinLimite
              value={form.logoUrl}
              onChange={cambiarCampo}
              placeholder="https://..."
            />
            <CampoTexto
              label="Logo claro URL"
              name="logoClaroUrl"
            sinLimite
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
            maxPalabras={MAX_PALABRAS_TEXTO_BREVE}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <CampoTexto
              label={"Tel\u00e9fono"}
              name="telefono"
              value={form.telefono}
              onChange={cambiarCampo}
              placeholder="88888888"
              soloNumeros
              maxLength={8}
              sinLimite
            />
            <CampoTexto
              label="Correo"
              name="correo"
              type="email"
              value={form.correo}
              onChange={cambiarCampo}
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <CampoTexto
              label="Facebook URL"
              name="facebookUrl"
            sinLimite
              value={form.facebookUrl}
              onChange={cambiarCampo}
              placeholder="https://facebook.com/..."
            />
            <CampoTexto
              label="Instagram URL"
              name="instagramUrl"
            sinLimite
              value={form.instagramUrl}
              onChange={cambiarCampo}
              placeholder="https://instagram.com/..."
            />
          </div>

          <CampoTexto
            label="Google Maps URL"
            name="mapsUrl"
            sinLimite
            value={form.mapsUrl}
            onChange={cambiarCampo}
            placeholder="https://maps.google.com/..."
          />

          <CampoTexto
            label="Texto de copyright"
            name="textoCopyright"
            value={form.textoCopyright}
            onChange={cambiarCampo}
            placeholder="Ej. © 2026 Nombre del sitio. Todos los derechos reservados."
            maxPalabras={MAX_PALABRAS_TEXTO_BREVE}
          />
          </AdminEditorConPreview>
        </AdminModalBody>

        <AdminModalFooter>
          <AdminModalActions
            buttonStyle="voluntariado"
            onCancel={onCerrar}
            primaryLabel={guardando ? tGuardando : tGuardarCambios}
            primaryDisabled={guardando}
          />
        </AdminModalFooter>
      </form>
    </AdminModal>
  );
}

function ModalEnlaces({ config, enlaces, navbar, footer, onCerrar, onGuardar, guardando, puedeEliminar }) {
  const [items, setItems] = useState(() => (Array.isArray(enlaces) ? enlaces : []));
  const [busqueda, setBusqueda] = useState("");
  const tTitulo = useTraducir(config.titulo);
  const tGuardando = useTraducir("Guardando...");
  const tGuardarCambios = useTraducir("Guardar cambios");
  const { idioma } = useIdioma();

  useEffect(() => {
    let cancelado = false;
    const base = Array.isArray(enlaces) ? enlaces : [];
    setItems(base);
    (async () => {
      if (idioma !== "en") {
        if (!cancelado) setItems(base);
        return;
      }
      const vista = await traducirListaObjetos(base, ENLACE_CAMPOS_TEXTO);
      if (!cancelado) setItems(vista);
    })();
    return () => {
      cancelado = true;
    };
  }, [enlaces, idioma]);

  const itemsFiltrados = useMemo(
    () => filtrarPorBusqueda(items, busqueda, (item) => [item.etiqueta, item.ruta]),
    [items, busqueda],
  );

  const cambiarItem = (id, campo, valor) => {
    let next = valor;
    if (campo === "etiqueta" && typeof valor === "string") {
      next = limitarPalabras(valor, MAX_PALABRAS_BOTON);
    }
    setItems((actual) => actual.map((item) => (item.id === id ? { ...item, [campo]: next } : item)));
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

  const enviar = async (event) => {
    event.preventDefault();
    const validos = items.filter((item) => item.etiqueta?.trim() && item.ruta?.trim());
    const normalizados = await Promise.all(
      validos.map((item) => asegurarCamposEnEspanol(item, ENLACE_CAMPOS_TEXTO)),
    );
    onGuardar(normalizados);
  };

  return (
    <AdminModal open onClose={onCerrar} maxWidth="max-w-xl" labelledBy="admin-enlaces-modal-title">
      <form onSubmit={enviar} className="flex min-h-0 flex-1 flex-col">
        <AdminModalHeader>
          <div className="flex min-w-0 items-center gap-2.5">
            <Link2 className="size-6 shrink-0 text-amber-700" strokeWidth={1.75} aria-hidden="true" />
            <h2 id="admin-enlaces-modal-title" className="truncate text-[length:var(--text-subtitle)] font-bold text-slate-950">
              {tTitulo}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label={t("Cerrar")}
          >
            <X className="size-5" />
          </button>
        </AdminModalHeader>

        <AdminModalBody cms className="space-y-5">
          <AdminEditorConPreview
            preview={(
              <PreviewEnlaces
                items={items}
                variante={config.seccion === "Navbar" ? "navbar" : "footer"}
                navbar={navbar}
                footer={footer}
              />
            )}
            ayuda={`Gestion\u00e1 los enlaces de ${config.titulo.toLowerCase()}.`}
          >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500"><ST>Enlaces actuales</ST></p>
            <button
              type="button"
              onClick={agregarItem}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-950 bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:border-neutral-700 hover:bg-neutral-700 sm:w-auto"
            >
              <Plus className="size-4" />
              <ST>Agregar enlace</ST>
            </button>
          </div>

          <AdminListaToolbar
            compacto
            busqueda={busqueda}
            onBusquedaChange={setBusqueda}
            placeholder="Buscar por etiqueta o ruta..."
            total={items.length}
            visibles={itemsFiltrados.length}
            hayFiltrosActivos={Boolean(busqueda.trim())}
            onLimpiar={() => setBusqueda("")}
          />

          {items.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              <ST>No hay enlaces configurados. Agregue uno para mostrarlo en el sitio.</ST>
            </p>
          ) : itemsFiltrados.length === 0 ? (
            <AdminListaVacia onLimpiar={() => setBusqueda("")} />
          ) : (
            <div className="space-y-4">
              {itemsFiltrados.map((item, index) => (
                <div key={item.id} className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1fr_auto]">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="grid gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                      <ST>Etiqueta</ST>
                      <input
                        value={item.etiqueta ?? ""}
                        onChange={(event) => cambiarItem(item.id, "etiqueta", event.target.value)}
                        placeholder={`Enlace ${index + 1}`}
                        className="h-[var(--control-height)] rounded-full border border-slate-200 bg-white px-4 text-[length:var(--text-body)] font-normal normal-case tracking-normal text-slate-950 shadow-none outline-none transition focus:border-slate-400 focus:bg-white focus:shadow-none focus:ring-0 focus:outline-none"
                        required
                      />
                      <span className="text-xs font-medium normal-case tracking-normal text-slate-400">
                        {etiquetaContadorPalabras(item.etiqueta ?? "", MAX_PALABRAS_BOTON)}
                      </span>
                    </label>
                    <label className="grid gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                      <ST>Ruta</ST>
                      <input
                        value={item.ruta ?? ""}
                        onChange={(event) => cambiarItem(item.id, "ruta", event.target.value)}
                        placeholder="/productos o https://..."
                        className="h-[var(--control-height)] rounded-full border border-slate-200 bg-white px-4 text-[length:var(--text-body)] font-normal normal-case tracking-normal text-slate-950 shadow-none outline-none transition focus:border-slate-400 focus:bg-white focus:shadow-none focus:ring-0 focus:outline-none"
                        required
                      />
                    </label>
                    <label className="grid gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                      <ST>Orden</ST>
                      <NumericInput
                        value={item.orden ?? index + 1}
                        onChange={(event) => cambiarItem(item.id, "orden", event.target.value)}
                        className="h-[var(--control-height)] rounded-full border border-slate-200 bg-white px-4 text-[length:var(--text-body)] font-normal normal-case tracking-normal text-slate-950 shadow-none outline-none transition focus:border-slate-400 focus:bg-white focus:shadow-none focus:ring-0 focus:outline-none"
                      />
                    </label>
                    <label className="flex items-end gap-2 pb-3 text-sm font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={Boolean(item.abrirEnNuevaPestana)}
                        onChange={(event) => cambiarItem(item.id, "abrirEnNuevaPestana", event.target.checked)}
                        className="size-4 rounded border-slate-300"
                      />
                      <ST>Abrir en nueva pestana</ST>
                    </label>
                  </div>

                  {puedeEliminar ? (
                    <button
                      type="button"
                      onClick={() => eliminarItem(item.id)}
                      className="inline-flex size-10 items-center justify-center self-start rounded-full bg-red-50 text-red-700 transition hover:bg-red-100 md:self-center"
                      aria-label={t("Eliminar enlace")}
                    >
                      <Trash2 className="size-5" />
                    </button>
                  ) : (
                    <span className="self-start text-xs font-semibold text-slate-400 md:self-center"><ST>Sin eliminar</ST></span>
                  )}
                </div>
              ))}
            </div>
          )}
          </AdminEditorConPreview>
        </AdminModalBody>

        <AdminModalFooter>
          <AdminModalActions
            buttonStyle="voluntariado"
            onCancel={onCerrar}
            primaryLabel={guardando ? tGuardando : tGuardarCambios}
            primaryDisabled={guardando}
          />
        </AdminModalFooter>
      </form>
    </AdminModal>
  );
}

function mapSeccionInicio(data) {
  return {
    eyebrow: typeof data?.eyebrow === "string" ? data.eyebrow.trim() : "",
    title: typeof data?.title === "string" ? data.title.trim() : "",
    description: typeof data?.description === "string" ? data.description.trim() : "",
    image: typeof data?.image === "string" ? data.image.trim() : "",
    linkUrl:
      typeof data?.linkUrl === "string"
        ? data.linkUrl.trim()
        : typeof data?.LinkUrl === "string"
          ? data.LinkUrl.trim()
          : "",
    linkText:
      typeof data?.linkText === "string"
        ? data.linkText.trim()
        : typeof data?.LinkText === "string"
          ? data.LinkText.trim()
          : "",
  };
}

function tituloVisibleSeccion(data, config) {
  const titulo = typeof data?.title === "string" ? data.title.trim() : "";
  const etiqueta = typeof data?.eyebrow === "string" ? data.eyebrow.trim() : "";
  return titulo || etiqueta || config.tituloTarjeta;
}

function resumenSeccionInicio(data, config) {
  if (data.title) return data.title;
  if (data.description) return data.description;
  return `Sin contenido guardado para "${config.tituloTarjeta}".`;
}

function mapTarjetaInicio(item) {
  return {
    clave: item?.clave || item?.Clave || "",
    etiqueta: item?.etiqueta || item?.Etiqueta || "",
    titulo: item?.titulo || item?.Titulo || "",
    descripcion: item?.descripcion || item?.Descripcion || "",
    ruta: item?.ruta || item?.Ruta || "",
    textoBoton: item?.textoBoton || item?.TextoBoton || "",
  };
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
  const esSuperAdmin = tienePermiso(actorRoles, "inactivar_informacion");

  const [hero, setHero] = useState(heroInicial);
  const [seccionesInicio, setSeccionesInicio] = useState({
    homeSpotlight: { ...seccionInicioVacia },
    homeFeatured: { ...seccionInicioVacia },
    homeIniciativas: { ...seccionInicioVacia },
    homeLocation: { ...seccionInicioVacia },
  });
  const [navbar, setNavbar] = useState(navbarInicial);
  const [footer, setFooter] = useState(footerInicial);
  const [enlacesNavbar, setEnlacesNavbar] = useState([]);
  const [enlacesFooter, setEnlacesFooter] = useState([]);
  const [tarjetasInicio, setTarjetasInicio] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [editando, setEditando] = useState(null);

  const loadMain = useCallback(() => fetchAdminMainPageData(), []);
  const { data, status, error: loadError, reload } = useCachedPageData("admin-main", loadMain);
  const { showLoading, loadingMessage } = useAdminPageGate('/admin/informacion-pagina-principal', status === 'ready');

  useEffect(() => {
    if (!data) return;

    if (data.hero) setHero(mapHero(data.hero));
    setSeccionesInicio(data.seccionesInicio ?? {
      homeSpotlight: { ...seccionInicioVacia },
      homeFeatured: { ...seccionInicioVacia },
      homeIniciativas: { ...seccionInicioVacia },
      homeLocation: { ...seccionInicioVacia },
    });
    setTarjetasInicio(Array.isArray(data.tarjetasInicio) ? data.tarjetasInicio : []);
    if (data.navbar) setNavbar({ ...navbarInicial, ...data.navbar });
    if (data.footer) setFooter({ ...footerInicial, ...data.footer });
    setEnlacesNavbar(Array.isArray(data.enlacesNavbar) ? data.enlacesNavbar : []);
    setEnlacesFooter(Array.isArray(data.enlacesFooter) ? data.enlacesFooter : []);
  }, [data]);

  const cargando = status === "loading";
  const error = status === "error"
    ? loadError || "No se pudo cargar la informaci\u00f3n principal."
    : data?.hasError
      ? "No se pudo cargar la informaci\u00f3n principal."
      : "";

  const guardarHero = async (form) => {
    try {
      setGuardando(true);
      const actualizado = await actualizarSeccion("hero", {
        eyebrow: form.eyebrow,
        title: form.title,
        subtitle: form.subtitle,
        primaryButtonText: form.primaryButtonText,
        primaryButtonUrl: form.primaryButtonUrl,
        buttonText: form.buttonText,
        buttonUrl: form.buttonUrl,
        backgroundImage: form.backgroundImage,
      });
      setHero(mapHero(actualizado));
      await reload();
      setEditando(null);
    } catch (err) {
      alert(t(err.message || "No se pudo guardar el hero."));
    } finally {
      setGuardando(false);
    }
  };

  const guardarSeccionInicio = async (clave, form) => {
    try {
      setGuardando(true);
      const payload = {
        eyebrow: form.eyebrow ?? "",
        title: form.title ?? "",
        description: form.description ?? "",
        image: form.image ?? "",
        linkUrl: form.linkUrl ?? "",
        linkText: form.linkText ?? "",
      };
      const actualizado = await actualizarSeccion(clave, payload);
      setSeccionesInicio((actual) => ({
        ...actual,
        [clave]: mapSeccionInicio(actualizado ?? payload),
      }));
      await reload();
      setEditando(null);
    } catch (err) {
      alert(t(err.message || "No se pudo guardar la secci\u00f3n del inicio."));
    } finally {
      setGuardando(false);
    }
  };

  const guardarTarjetasInicio = async (tarjetas) => {
    try {
      setGuardando(true);
      const actualizadas = await actualizarTarjetasInicio(tarjetas);
      setTarjetasInicio(Array.isArray(actualizadas) ? actualizadas.map(mapTarjetaInicio) : []);
      await reload();
      setEditando(null);
    } catch (err) {
      alert(t(err.message || "No se pudieron guardar los mini formularios."));
    } finally {
      setGuardando(false);
    }
  };

  const guardarNavbar = async (form) => {
    try {
      setGuardando(true);
      const actualizado = await actualizarNavbar(form);
      setNavbar({ ...navbarInicial, ...actualizado });
      await reload();
      setEditando(null);
    } catch (err) {
      alert(t(err.message || "No se pudo guardar el navbar."));
    } finally {
      setGuardando(false);
    }
  };

  const guardarFooter = async (form) => {
    try {
      setGuardando(true);
      const payload = {
        logoUrl: form.logoUrl ?? "",
        logoClaroUrl: form.logoClaroUrl ?? "",
        fraseMarca: form.fraseMarca ?? "",
        telefono: form.telefono ?? "",
        correo: form.correo ?? "",
        facebookUrl: form.facebookUrl ?? "",
        instagramUrl: form.instagramUrl ?? "",
        mapsUrl: form.mapsUrl ?? "",
        textoCopyright: form.textoCopyright ?? "",
      };
      const actualizado = await actualizarFooter(payload);
      setFooter({ ...footerInicial, ...actualizado });
      await reload();
      setEditando(null);
    } catch (err) {
      alert(t(err.message || "No se pudo guardar el footer."));
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
      await reload();
      setEditando(null);
    } catch (err) {
      alert(t(err.message || "No se pudieron guardar los enlaces."));
    } finally {
      setGuardando(false);
    }
  };

  const resumenTarjetasInicio = tarjetasInicio.length
    ? tarjetasInicio.map((tarjeta) => tarjeta.titulo || TARJETAS_INICIO_LABELS[tarjeta.clave] || tarjeta.clave).join(" · ")
    : "Donaciones, visitas y voluntariado (sin textos cargados).";

  const resumenNavbar = navbar.logoUrl || navbar.logoClaroUrl
    ? "Logos configurados para la barra superior del sitio."
    : "Sin logos configurados.";

  const resumenFooter = footer.fraseMarca
    || footer.correo
    || footer.telefono
    || "Sin informaci\u00f3n de contacto configurada.";

  const resumenEnlacesNavbar = enlacesNavbar.length
    ? `${enlacesNavbar.length} enlace${enlacesNavbar.length === 1 ? "" : "s"} en el men\u00fa superior.`
    : CONFIG_ENLACES["enlaces-navbar"].descripcionVacia;

  const resumenEnlacesFooter = enlacesFooter.length
    ? `${enlacesFooter.length} enlace${enlacesFooter.length === 1 ? "" : "s"} en la secci\u00f3n Explorar.`
    : CONFIG_ENLACES["enlaces-footer"].descripcionVacia;

  const seccionesPaginaPrincipal = useMemo(() => {
    const seccionesInicioItems = Object.entries(CONFIG_SECCIONES_INICIO).map(([clave, config]) => ({
      id: clave,
      grupo: "inicio",
      busqueda: [
        config.etiqueta,
        config.tituloTarjeta,
        resumenSeccionInicio(seccionesInicio[clave], config),
      ],
    }));

    return [
      { id: "hero", grupo: "inicio", busqueda: ["Hero section", hero.title, hero.subtitle] },
      ...seccionesInicioItems,
      { id: "tarjetas-inicio", grupo: "inicio", busqueda: ["Mini formularios", "Inicio", resumenTarjetasInicio] },
      { id: "navbar", grupo: "navbar", busqueda: ["Navbar", "Barra de navegaci\u00f3n", resumenNavbar] },
      { id: "footer", grupo: "footer", busqueda: ["Footer", "Pie de p\u00e1gina", resumenFooter] },
      {
        id: "enlaces-navbar",
        grupo: "navbar",
        busqueda: [
          CONFIG_ENLACES["enlaces-navbar"].etiqueta,
          CONFIG_ENLACES["enlaces-navbar"].titulo,
          resumenEnlacesNavbar,
        ],
      },
      {
        id: "enlaces-footer",
        grupo: "footer",
        busqueda: [
          CONFIG_ENLACES["enlaces-footer"].etiqueta,
          CONFIG_ENLACES["enlaces-footer"].titulo,
          resumenEnlacesFooter,
        ],
      },
    ];
  }, [
    hero,
    seccionesInicio,
    resumenTarjetasInicio,
    resumenNavbar,
    resumenFooter,
    resumenEnlacesNavbar,
    resumenEnlacesFooter,
  ]);

  const {
    busqueda,
    setBusqueda,
    valoresFiltro,
    setValorFiltro,
    filtrados: seccionesFiltradas,
    limpiar: limpiarFiltros,
    hayFiltrosActivos,
    total: totalSecciones,
    visibles: seccionesVisibles,
  } = useAdminListaFiltros(seccionesPaginaPrincipal, {
    buscarEn: (seccion) => seccion.busqueda,
    filtrosConfig: [{ id: "grupo", obtenerValor: (seccion) => seccion.grupo }],
  });

  const idsVisibles = useMemo(
    () => new Set(seccionesFiltradas.map((seccion) => seccion.id)),
    [seccionesFiltradas],
  );

  return (
    <AdminPageGate showLoading={showLoading} message={loadingMessage}>
    <AdminLayout>
      <section className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5">
          <h1 className="text-[length:var(--text-title)] font-bold text-slate-950">
            <ST>{"Informaci\u00f3n p\u00e1gina principal"}</ST>
          </h1>
        </div>

        {cargando ? (
          <div className="p-8 text-[length:var(--text-body)] text-slate-500"><ST>{"Cargando informaci\u00f3n..."}</ST></div>
        ) : error ? (
          <div className="p-8 text-[length:var(--text-body)] font-semibold text-red-700">
            <ST>{error}</ST>
            <button
              type="button"
              onClick={reload}
              className="mt-4 block h-[var(--control-height)] rounded-full bg-red-700 px-4 text-white"
            >
              <ST>Reintentar</ST>
            </button>
          </div>
        ) : (
          <>
            <AdminListaToolbar
              busqueda={busqueda}
              onBusquedaChange={setBusqueda}
              placeholder="Buscar secciones por nombre o contenido..."
              total={totalSecciones}
              visibles={seccionesVisibles}
              hayFiltrosActivos={hayFiltrosActivos}
              onLimpiar={limpiarFiltros}
              filtros={[
                {
                  id: "grupo",
                  label: "Sección",
                  value: valoresFiltro.grupo || "todos",
                  onChange: (valor) => setValorFiltro("grupo", valor),
                  opciones: [
                    { value: "todos", label: "Todas" },
                    { value: "inicio", label: "Inicio" },
                    { value: "navbar", label: "Navbar" },
                    { value: "footer", label: "Footer" },
                  ],
                },
              ]}
            />

            {seccionesFiltradas.length === 0 ? (
              <AdminListaVacia onLimpiar={limpiarFiltros} />
            ) : (
              <div className="grid min-w-0 grid-cols-1 gap-4 overflow-x-hidden p-4 sm:grid-cols-2 sm:px-6 sm:pb-6 xl:grid-cols-3">
            {idsVisibles.has("hero") ? (
            <AdminSeccionCard
              etiqueta="Hero section"
              titulo={hero.title || "Hero section"}
              icono={Image}
              onEditar={() => setEditando("hero")}
            />
            ) : null}

            {Object.entries(CONFIG_SECCIONES_INICIO).map(([clave, config]) =>
              idsVisibles.has(clave) ? (
              <AdminSeccionCard
                key={clave}
                etiqueta={config.etiqueta}
                titulo={tituloVisibleSeccion(seccionesInicio[clave], config)}
                icono={config.icon}
                onEditar={() => setEditando(clave)}
              />
              ) : null,
            )}

            {idsVisibles.has("tarjetas-inicio") ? (
            <AdminSeccionCard
              etiqueta="Inicio"
              titulo="Mini formularios"
              icono={ClipboardList}
              onEditar={() => setEditando("tarjetas-inicio")}
            />
            ) : null}

            {idsVisibles.has("navbar") ? (
            <AdminSeccionCard
              etiqueta="Navbar"
              titulo={"Barra de navegaci\u00f3n"}
              icono={LayoutTemplate}
              onEditar={() => setEditando("navbar")}
            />
            ) : null}

            {idsVisibles.has("footer") ? (
            <AdminSeccionCard
              etiqueta="Footer"
              titulo={"Pie de p\u00e1gina"}
              icono={PanelBottom}
              onEditar={() => setEditando("footer")}
            />
            ) : null}

            {idsVisibles.has("enlaces-navbar") ? (
            <AdminSeccionCard
              etiqueta={CONFIG_ENLACES["enlaces-navbar"].etiqueta}
              titulo={CONFIG_ENLACES["enlaces-navbar"].titulo}
              icono={Link2}
              onEditar={() => setEditando("enlaces-navbar")}
            />
            ) : null}

            {idsVisibles.has("enlaces-footer") ? (
            <AdminSeccionCard
              etiqueta={CONFIG_ENLACES["enlaces-footer"].etiqueta}
              titulo={CONFIG_ENLACES["enlaces-footer"].titulo}
              icono={Link2}
              onEditar={() => setEditando("enlaces-footer")}
            />
            ) : null}
              </div>
            )}
          </>
        )}
      </section>

      {editando === "hero" ? (
        <ModalHero hero={hero} onCerrar={() => setEditando(null)} onGuardar={guardarHero} guardando={guardando} />
      ) : null}

      {editando && CONFIG_SECCIONES_INICIO[editando] ? (
        <ModalSeccionInicio
          clave={editando}
          config={CONFIG_SECCIONES_INICIO[editando]}
          data={seccionesInicio[editando]}
          tarjetasInicio={tarjetasInicio}
          onCerrar={() => setEditando(null)}
          onGuardar={(form) => guardarSeccionInicio(editando, form)}
          guardando={guardando}
        />
      ) : null}

      {editando === "tarjetas-inicio" ? (
        <ModalTarjetasInicio
          tarjetas={tarjetasInicio}
          onCerrar={() => setEditando(null)}
          onGuardar={guardarTarjetasInicio}
          guardando={guardando}
        />
      ) : null}

      {editando === "navbar" ? (
        <ModalNavbar
          navbar={navbar}
          enlaces={enlacesNavbar}
          onCerrar={() => setEditando(null)}
          onGuardar={guardarNavbar}
          guardando={guardando}
        />
      ) : null}

      {editando === "footer" ? (
        <ModalFooter
          footer={footer}
          enlaces={enlacesFooter}
          onCerrar={() => setEditando(null)}
          onGuardar={guardarFooter}
          guardando={guardando}
        />
      ) : null}

      {editando === "enlaces-navbar" ? (
        <ModalEnlaces
          config={CONFIG_ENLACES["enlaces-navbar"]}
          enlaces={enlacesNavbar}
          navbar={navbar}
          footer={footer}
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
          navbar={navbar}
          footer={footer}
          onCerrar={() => setEditando(null)}
          onGuardar={(lista) => guardarEnlaces("enlaces-footer", lista)}
          guardando={guardando}
          puedeEliminar={esSuperAdmin}
        />
      ) : null}
    </AdminLayout>
    </AdminPageGate>
  );
};

export default AdminInformacionPaginaPrincipal;
