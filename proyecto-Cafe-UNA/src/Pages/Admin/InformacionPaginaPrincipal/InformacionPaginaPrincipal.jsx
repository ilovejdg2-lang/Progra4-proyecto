import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { CircleHelp, Coffee, ClipboardList, FileText, Image, LayoutTemplate, Link2, MapPin, PanelBottom, Plus, Search, Send, Sparkles, Sprout, Trash2, Users, X } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

import { AdminLayout } from "../layouts/AdminLayout";
import { AdminModal, AdminModalActions, AdminModalBody, AdminModalFooter, AdminModalHeader, adminBtnQuiet } from "../../../Components/Admin/ui/AdminModal";
import { AdminCampo, AdminFieldset, ContadorCampo } from "../../../Components/Admin/ui/AdminModalCampos";
import { adminCampoAreaCls, adminCampoInputCls } from "../../../Components/Admin/ui/adminCampoStyles";
import { AdminListaToolbar, AdminListaVacia } from "../../../Components/Admin/ui/AdminListaToolbar";
import {
  AdminEditorConPreview,
  PreviewEnlaces,
  PreviewFaqInicioLive,
  PreviewFooterLive,
  PreviewHeroLive,
  PreviewHomeSectionLive,
  PreviewNavbarLive,
  PreviewTarjetasInicioLive,
} from "../../../Components/Admin/ui/AdminCmsPreview";
import { AdminSeccionFila } from "../../../Components/Admin/ui/AdminSeccionFila";
import { SelectorIcono } from "../../../Components/Admin/ui/SelectorIcono";
import { iconoDePreguntaFaq, iconoPorClave } from "../../../lib/iconosCatalogo";
import { iconoOriginalSitio } from "../../../lib/iconosSitio";
import { recargarIconosSitio } from "../../../hooks/useIconosSitio";
import {
  actualizarItemCatalogo,
  crearItemCatalogo,
  eliminarItemCatalogo,
  listarCatalogo,
  TIPOS_CATALOGO,
} from "../../../services/catalogosService";
import { NumericInput } from "../../../Components/NumericInput/NumericInput";
import { AdminPageGate } from "../../../Components/AdminPageGate/AdminPageGate";
import { useAdminPageGate } from "../../../hooks/useAdminPageGate";
import { useAdminListaFiltros } from "../../../hooks/useAdminListaFiltros";
import { useCachedPageData } from "../../../hooks/useCachedPageData";
import { filtrarPorBusqueda } from "../../../lib/adminListaFiltros";
import { fetchAdminMainPageData } from "../../../lib/adminMainPageData";
import { mapHero } from "../../../lib/heroData";
import {
  DEFAULT_PRODUCTORES_HERO,
  actualizarEnlace,
  actualizarFaqInicio,
  actualizarFooter,
  actualizarNavbar,
  actualizarProductoresHero,
  actualizarSeccion,
  actualizarTarjetasInicio,
  crearEnlace,
  crearFaqInicio,
  eliminarEnlace,
  eliminarFaqInicio,
  obtenerEnlaces,
  obtenerFaqInicio,
  obtenerProductoresHero,
} from "../../../services/informacionService";
import { getActiveSessionUser } from "../../../services/sessionService";
import { tienePermiso } from "../../../lib/permisos";
import { esCorreoValido, MENSAJE_CORREO_INVALIDO } from "../../../lib/correo";
import {
  MAX_PALABRAS_BOTON,
  MAX_PALABRAS_ETIQUETA,
  MAX_PALABRAS_TEXTO,
  MAX_PALABRAS_TEXTO_BREVE,
  MAX_PALABRAS_TITULO,
  conLimitePalabras,
  etiquetaContadorPalabras,
  limitarPalabras,
} from "../../../lib/formLimits";
import { ST } from "../../../Components/T/ST";
import { useTraducir } from "../../../hooks/useTraducir";
import { t } from "../../../lib/t";
import { asegurarCamposEnEspanol, camposParaVistaAdmin, traducirListaObjetos } from "../../../lib/traducir";
import { useIdioma } from "../../../lib/useIdioma";
import { CmsImageField } from "../../../Components/ui/CmsImageField";

const EMPTY_ARRAY = [];

// Short segment labels for narrow screens; the full title remains the accessible name.
const TABS_CORTOS = { inicio: "Inicio", navbar: "Navegación", footer: "Pie" };

const HERO_CAMPOS_TEXTO = ["eyebrow", "title", "subtitle", "primaryButtonText", "buttonText"];
const SECCION_CAMPOS_TEXTO = ["eyebrow", "title", "description", "linkText"];
const TARJETA_CAMPOS_TEXTO = ["etiqueta", "titulo", "descripcion", "textoBoton"];
const FOOTER_CAMPOS_TEXTO = ["fraseMarca", "textoCopyright"];
const ENLACE_CAMPOS_TEXTO = ["etiqueta"];
const FAQ_CAMPOS_TEXTO = ["pregunta", "respuesta"];

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
  homeFaq: {
    etiqueta: "Inicio",
    tituloTarjeta: "Preguntas frecuentes",
    modalTitle: "Preguntas frecuentes",
    ayuda: "Título e introducción del apartado de preguntas frecuentes en el inicio.",
    icon: CircleHelp,
    showEyebrow: true,
    showImage: false,
    eyebrowLabel: "Etiqueta superior",
    titleLabel: "Título",
    descriptionLabel: "Texto introductorio",
  },
  homeDocumentacion: {
    etiqueta: "Inicio",
    tituloTarjeta: "Documentación del proyecto",
    modalTitle: "Documentación del proyecto",
    ayuda: "Texto, imagen y botón del bloque de documentación en el inicio.",
    icon: FileText,
    showEyebrow: false,
    showImage: true,
    titleLabel: "Título",
    descriptionLabel: "Descripción",
    showLinkText: true,
    showLinkUrl: false,
    linkTextLabel: "Texto del botón principal",
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

function useLegendas() {
  return {
    tTextos: useTraducir("Textos"),
    tBotones: useTraducir("Botones"),
    tBoton: useTraducir("Botón"),
    tImagen: useTraducir("Imagen"),
    tImagenFondo: useTraducir("Imagen de fondo"),
    tImagenMapa: useTraducir("Imagen de fondo del mapa"),
    tLogos: useTraducir("Logos"),
    tContacto: useTraducir("Contacto"),
    tRedes: useTraducir("Redes y ubicación"),
  };
}

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
  const id = useId();
  const tLabel = useTraducir(label || "");
  const tPlaceholder = useTraducir(placeholder || "");
  const tHint = useTraducir(hint || "");
  // URLs, teléfonos, correos y rutas no llevan tope de palabras.
  const limitado = !(soloNumeros || sinLimite || type === "url" || type === "email" || type === "tel");
  const hintId = `${id}-hint`;
  const contadorId = `${id}-count`;
  const describedBy = [hint ? hintId : "", limitado ? contadorId : ""].filter(Boolean).join(" ") || undefined;

  let control;
  if (soloNumeros) {
    control = (
      <NumericInput
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={tPlaceholder || undefined}
        required={required}
        maxLength={maxLength}
        aria-describedby={describedBy}
        className={adminCampoInputCls}
      />
    );
  } else if (!limitado) {
    control = (
      <input
        id={id}
        name={name}
        type={type === "url" ? "text" : type}
        inputMode={type === "email" ? "email" : undefined}
        value={value}
        onChange={onChange}
        placeholder={tPlaceholder || undefined}
        required={required}
        aria-describedby={describedBy}
        className={adminCampoInputCls}
      />
    );
  } else {
    control = (
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={conLimitePalabras(onChange, maxPalabras)}
        placeholder={tPlaceholder || undefined}
        required={required}
        aria-describedby={describedBy}
        className={adminCampoInputCls}
      />
    );
  }

  return (
    <AdminCampo
      id={id}
      label={tLabel}
      hint={hint ? tHint : ""}
      hintId={hintId}
      contador={limitado ? <ContadorCampo id={contadorId} value={value} maxPalabras={maxPalabras} /> : null}
    >
      {control}
    </AdminCampo>
  );
}

function CampoArea({ label, name, value, onChange, rows = 3, required, maxPalabras = MAX_PALABRAS_TEXTO, hint }) {
  const id = useId();
  const tLabel = useTraducir(label || "");
  const tHint = useTraducir(hint || "");
  const hintId = `${id}-hint`;
  const contadorId = `${id}-count`;

  return (
    <AdminCampo
      id={id}
      label={tLabel}
      hint={hint ? tHint : ""}
      hintId={hintId}
      contador={<ContadorCampo id={contadorId} value={value} maxPalabras={maxPalabras} />}
    >
      <textarea
        id={id}
        name={name}
        value={value}
        onChange={conLimitePalabras(onChange, maxPalabras)}
        rows={rows}
        required={required}
        aria-describedby={[hint ? hintId : "", contadorId].filter(Boolean).join(" ")}
        className={adminCampoAreaCls}
      />
    </AdminCampo>
  );
}

/**
 * One segment of the section switcher. `corto` is the label shown below sm; the
 * full title stays the accessible name on every width. Rounded corners are
 * forced with `!` because index.css sets `button { border-radius: ... !important }`.
 */
function SegmentoSeccion({ grupo, corto, activa, onSeleccionar, onTecla, registrarRef, tabId, panelId }) {
  const tTitulo = useTraducir(grupo.titulo);
  return (
    <button
      ref={registrarRef}
      type="button"
      role="tab"
      id={tabId}
      aria-label={`${tTitulo} (${grupo.filas.length})`}
      aria-selected={activa}
      aria-controls={panelId}
      tabIndex={activa ? 0 : -1}
      onClick={onSeleccionar}
      onKeyDown={onTecla}
      className={`inline-flex min-h-[var(--control-height)] min-w-0 items-center justify-center gap-2 rounded-full! border px-2 text-[length:var(--text-body)] transition-colors sm:px-4 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[color:var(--admin-focus-ring)] ${
        activa
          ? "border-[var(--admin-border)] bg-[var(--admin-surface)] font-semibold text-[var(--admin-text-primary)] shadow-sm"
          : "border-transparent font-medium text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]"
      }`}
    >
      <span className="lg:hidden"><ST>{corto}</ST></span>
      <span className="hidden lg:inline"><ST>{grupo.titulo}</ST></span>
      <span aria-hidden="true" className="hidden text-xs font-medium tabular-nums text-[var(--admin-text-muted)] sm:inline">{grupo.filas.length}</span>
    </button>
  );
}

export function ModalHero({ hero, onCerrar, onGuardar, guardando }) {
  const [form, setForm] = useState(() => ({ ...heroInicial, ...hero }));
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const { idioma } = useIdioma();
  const tGuardando = useTraducir("Guardando...");
  const tGuardarCambios = useTraducir("Guardar cambios");
  const { tTextos, tBotones, tImagenFondo } = useLegendas();
  const tPortada = useTraducir("Portada principal");

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
        <AdminModalHeader
          icon={Image}
          title={tPortada}
          titleId="admin-hero-modal-title"
          description={"Banner principal de la p\u00e1gina de inicio."}
          onClose={onCerrar}
        />

        <AdminModalBody cms>
          <AdminEditorConPreview
            variant="modal"
            preview={<PreviewHeroLive form={form} />}
          >
          <AdminFieldset legend={tTextos}>
            <CampoTexto
              label="Etiqueta superior"
              name="eyebrow"
              value={form.eyebrow}
              onChange={cambiarCampo}
              hint={"Texto pequeño que aparece sobre el título principal."}
              maxPalabras={MAX_PALABRAS_ETIQUETA}
            />
            <CampoTexto
              label={"Título principal"}
              name="title"
              value={form.title}
              onChange={cambiarCampo}
              required
              hint={"Puedes usar Enter para forzar un salto de línea en el título."}
              maxPalabras={MAX_PALABRAS_TITULO}
            />
            <CampoArea
              label={"Subtítulo"}
              name="subtitle"
              value={form.subtitle}
              onChange={cambiarCampo}
              rows={3}
              required
              maxPalabras={MAX_PALABRAS_TEXTO}
            />
          </AdminFieldset>

          <AdminFieldset legend={tBotones} className="items-start sm:grid-cols-2">
            <CampoTexto
              label={"Texto botón principal"}
              name="primaryButtonText"
              value={form.primaryButtonText}
              onChange={cambiarCampo}
              maxPalabras={MAX_PALABRAS_BOTON}
            />
            <CampoTexto
              label={"Enlace botón principal"}
              name="primaryButtonUrl"
              sinLimite
              value={form.primaryButtonUrl}
              onChange={cambiarCampo}
              placeholder="/productos o https://..."
              hint="Ruta interna del sitio o URL externa."
            />
            <CampoTexto
              label={"Texto botón secundario"}
              name="buttonText"
              value={form.buttonText}
              onChange={cambiarCampo}
              maxPalabras={MAX_PALABRAS_BOTON}
            />
            <CampoTexto
              label={"Enlace botón secundario"}
              name="buttonUrl"
              sinLimite
              value={form.buttonUrl}
              onChange={cambiarCampo}
              placeholder="/AboutUs o https://..."
              hint="Ruta interna del sitio o URL externa."
            />
          </AdminFieldset>

          <AdminFieldset legend={tImagenFondo}>
            <CmsImageField
              variant="bloque"
              label="Imagen de fondo URL"
              value={form.backgroundImage}
              onChange={(backgroundImage) => setForm((actual) => ({ ...actual, backgroundImage }))}
              onUploadingChange={setSubiendoImagen}
              disabled={guardando}
            />
          </AdminFieldset>
          </AdminEditorConPreview>
        </AdminModalBody>

        <AdminModalFooter>
          <AdminModalActions
            variant="coffee"
            onCancel={onCerrar}
            primaryLabel={guardando ? tGuardando : tGuardarCambios}
            primaryDisabled={guardando || subiendoImagen}
          />
        </AdminModalFooter>
      </form>
    </AdminModal>
  );
}

export function ModalSeccionInicio({ clave, config, data, tarjetasInicio = EMPTY_ARRAY, onCerrar, onGuardar, guardando }) {
  const [form, setForm] = useState(() => ({ ...seccionInicioVacia, ...data }));
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const tModalTitle = useTraducir(config.modalTitle || "");
  const tGuardando = useTraducir("Guardando...");
  const tGuardarCambios = useTraducir("Guardar cambios");
  const { tTextos, tBoton, tImagen } = useLegendas();
  const hayMasGrupos = Boolean(config.showLinkText || config.showLinkUrl || config.showImage);
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
        <AdminModalHeader
          icon={config.icon}
          title={tModalTitle}
          titleId="admin-seccion-inicio-modal-title"
          description={config.ayuda}
          onClose={onCerrar}
        />

        <AdminModalBody cms>
          <AdminEditorConPreview
            variant="modal"
            preview={(
              <PreviewHomeSectionLive
                clave={clave}
                form={form}
                tarjetasInicio={tarjetasInicio}
              />
            )}
          >
          <AdminFieldset legend={hayMasGrupos ? tTextos : undefined}>
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
              label={config.titleLabel || "Título"}
              name="title"
              value={form.title}
              onChange={cambiarCampo}
              required
              maxPalabras={MAX_PALABRAS_TITULO}
            />
            <CampoArea
              label={config.descriptionLabel || "Descripción"}
              name="description"
              value={form.description}
              onChange={cambiarCampo}
              rows={3}
              required
              maxPalabras={MAX_PALABRAS_TEXTO}
            />
          </AdminFieldset>

          {config.showLinkText || config.showLinkUrl ? (
            <AdminFieldset legend={tBoton} className="items-start sm:grid-cols-2">
              {config.showLinkText ? (
                <CampoTexto
                  label={config.linkTextLabel || "Texto del botón"}
                  name="linkText"
                  value={form.linkText}
                  onChange={cambiarCampo}
                  maxPalabras={MAX_PALABRAS_BOTON}
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
            </AdminFieldset>
          ) : null}

          {config.showImage ? (
            <AdminFieldset legend={tImagen}>
              {clave === "homeLocation" ? (
                <CmsImageField
                  variant="bloque"
                  label="Imagen URL"
                  value={form.image}
                  onChange={(image) => setForm((actual) => ({ ...actual, image }))}
                  onUploadingChange={setSubiendoImagen}
                  disabled={guardando}
                  hint="Imagen propia del bloque. JPG, PNG o WEBP. Máximo 10 MB."
                />
              ) : (
                <CampoTexto
                  label="Imagen URL"
                  name="image"
                  sinLimite
                  value={form.image}
                  onChange={cambiarCampo}
                  placeholder="https://..."
                  hint={"Imagen propia del bloque. No se toma de la galería."}
                />
              )}
            </AdminFieldset>
          ) : null}
          </AdminEditorConPreview>
        </AdminModalBody>

        <AdminModalFooter>
          <AdminModalActions
            variant="coffee"
            onCancel={onCerrar}
            primaryLabel={guardando ? tGuardando : tGuardarCambios}
            primaryDisabled={guardando || subiendoImagen}
          />
        </AdminModalFooter>
      </form>
    </AdminModal>
  );
}

function PreviewProductoresHeroLive({ form }) {
  const previewImage = form.image || DEFAULT_PRODUCTORES_HERO.image;
  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-[#dce5df] flex items-center justify-center p-3">
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-300"
        style={{ backgroundImage: `url("${previewImage}")` }}
      />
      <div className="absolute inset-0 bg-black/5 pointer-events-none" />
      <div className="relative z-10 w-full max-w-[340px] rounded-2xl bg-white shadow-xl overflow-hidden border border-black/5 p-5">
        {form.eyebrow ? (
          <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-emerald-800 uppercase">
            <Sprout className="size-3 text-emerald-700" />
            <span>{form.eyebrow}</span>
          </div>
        ) : null}
        <h3 className="text-base font-extrabold leading-snug text-slate-900 line-clamp-2">
          {form.title || "Da a conocer tu emprendimiento"}
        </h3>
        {form.description ? (
          <p className="mt-1.5 text-xs text-[#5a5148] line-clamp-3 leading-relaxed">
            {form.description}
          </p>
        ) : null}
        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          {form.linkText ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm">
              <Send className="size-2.5" />
              <span>{form.linkText}</span>
            </span>
          ) : null}
          {form.secondaryButtonText ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-900 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-900 shadow-sm">
              <Search className="size-2.5" />
              <span>{form.secondaryButtonText}</span>
            </span>
          ) : null}
        </div>
        {form.footerText ? (
          <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center gap-1.5 text-[10px] font-semibold text-slate-600">
            <MapPin className="size-3 text-slate-500" />
            <span>{form.footerText}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ModalProductoresHero({ data, onCerrar, onGuardar, guardando }) {
  const [form, setForm] = useState(() => ({ ...DEFAULT_PRODUCTORES_HERO, ...data }));
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const { idioma } = useIdioma();
  const tModalTitle = useTraducir("Productores (inicio)");
  const tGuardando = useTraducir("Guardando...");
  const tGuardarCambios = useTraducir("Guardar cambios");
  const { tTextos, tBotones, tImagenMapa } = useLegendas();

  useEffect(() => {
    let cancelado = false;
    const base = { ...DEFAULT_PRODUCTORES_HERO, ...data };
    setForm(base);
    (async () => {
      const vista = await camposParaVistaAdmin(base, ["eyebrow", "title", "description", "linkText", "secondaryButtonText", "footerText"], idioma);
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
    const paraGuardar = await asegurarCamposEnEspanol(form, ["eyebrow", "title", "description", "linkText", "secondaryButtonText", "footerText"]);
    onGuardar(paraGuardar);
  };

  return (
    <AdminModal open onClose={onCerrar} maxWidth="max-w-xl" labelledBy="admin-productores-modal-title">
      <form onSubmit={enviar} className="flex min-h-0 flex-1 flex-col">
        <AdminModalHeader
          icon={Sprout}
          title={tModalTitle}
          titleId="admin-productores-modal-title"
          description="Sección interactiva con el mapa y presentación de productores locales en el inicio."
          onClose={onCerrar}
        />

        <AdminModalBody cms>
          <AdminEditorConPreview
            variant="modal"
            preview={<PreviewProductoresHeroLive form={form} />}
          >
          <AdminFieldset legend={tTextos}>
            <CampoTexto
              label="Etiqueta superior"
              name="eyebrow"
              value={form.eyebrow}
              onChange={cambiarCampo}
              maxPalabras={MAX_PALABRAS_ETIQUETA}
              hint="Texto en la insignia sobre el título."
            />
            <CampoTexto
              label="Título principal"
              name="title"
              value={form.title}
              onChange={cambiarCampo}
              required
              maxPalabras={MAX_PALABRAS_TITULO}
            />
            <CampoArea
              label="Descripción"
              name="description"
              value={form.description}
              onChange={cambiarCampo}
              rows={3}
              required
              maxPalabras={MAX_PALABRAS_TEXTO}
            />
            <CampoTexto
              label="Texto inferior (ubicaciones)"
              name="footerText"
              value={form.footerText}
              onChange={cambiarCampo}
              maxPalabras={MAX_PALABRAS_ETIQUETA}
              hint="Ejemplo: +30 Ubicaciones activas"
            />
          </AdminFieldset>

          <AdminFieldset legend={tBotones} className="items-start sm:grid-cols-2">
            <CampoTexto
              label="Texto botón principal"
              name="linkText"
              value={form.linkText}
              onChange={cambiarCampo}
              maxPalabras={MAX_PALABRAS_BOTON}
            />
            <CampoTexto
              label="Enlace botón principal"
              name="linkUrl"
              sinLimite
              value={form.linkUrl}
              onChange={cambiarCampo}
              placeholder="/productores/propuesta"
            />
            <CampoTexto
              label="Texto botón secundario"
              name="secondaryButtonText"
              value={form.secondaryButtonText}
              onChange={cambiarCampo}
              maxPalabras={MAX_PALABRAS_BOTON}
            />
            <CampoTexto
              label="Enlace botón secundario"
              name="secondaryButtonUrl"
              sinLimite
              value={form.secondaryButtonUrl}
              onChange={cambiarCampo}
              placeholder="/productores"
            />
          </AdminFieldset>

          <AdminFieldset legend={tImagenMapa}>
            <CmsImageField
              variant="bloque"
              label="Imagen de fondo del mapa (URL)"
              value={form.image}
              onChange={(image) => setForm((actual) => ({ ...actual, image }))}
              onUploadingChange={setSubiendoImagen}
              disabled={guardando}
              hint="URL de la imagen del mapa ilustrado o JPG, PNG o WEBP de máximo 10 MB."
            />
          </AdminFieldset>
          </AdminEditorConPreview>
        </AdminModalBody>

        <AdminModalFooter>
          <AdminModalActions
            variant="coffee"
            onCancel={onCerrar}
            primaryLabel={guardando ? tGuardando : tGuardarCambios}
            primaryDisabled={guardando || subiendoImagen}
          />
        </AdminModalFooter>
      </form>
    </AdminModal>
  );
}

export function ModalTarjetasInicio({ tarjetas, onCerrar, onGuardar, guardando }) {
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
        <AdminModalHeader
          icon={ClipboardList}
          title={tTituloMini}
          titleId="admin-tarjetas-inicio-modal-title"
          description={"Edit\u00e1 las tres tarjetas de donaciones, visitas y voluntariado que aparecen en el inicio."}
          onClose={onCerrar}
        />

        <AdminModalBody cms>
          <AdminEditorConPreview
            variant="modal"
            preview={<PreviewTarjetasInicioLive tarjetas={form} />}
          >
          {form.map((tarjeta, index) => (
            <AdminFieldset key={tarjeta.clave} legend={TARJETAS_INICIO_LABELS[tarjeta.clave] || tarjeta.clave}>
              <div className="grid items-start gap-4 sm:grid-cols-2">
                <CampoTexto
                  label="Etiqueta"
                  name={`etiqueta-${index}`}
                  value={tarjeta.etiqueta}
                  onChange={(event) => cambiarCampo(index, "etiqueta", event.target.value)}
                  required
                  maxPalabras={MAX_PALABRAS_ETIQUETA}
                />
                <CampoTexto
                  label={"Título"}
                  name={`titulo-${index}`}
                  value={tarjeta.titulo}
                  onChange={(event) => cambiarCampo(index, "titulo", event.target.value)}
                  required
                  maxPalabras={MAX_PALABRAS_TITULO}
                />
              </div>

              <CampoArea
                label={"Descripción"}
                name={`descripcion-${index}`}
                value={tarjeta.descripcion}
                onChange={(event) => cambiarCampo(index, "descripcion", event.target.value)}
                rows={3}
                required
                maxPalabras={MAX_PALABRAS_TEXTO_BREVE}
              />

              <div className="grid items-start gap-4 sm:grid-cols-2">
                <CampoTexto
                  label={"Texto del botón"}
                  name={`textoBoton-${index}`}
                  value={tarjeta.textoBoton}
                  onChange={(event) => cambiarCampo(index, "textoBoton", event.target.value)}
                  maxPalabras={MAX_PALABRAS_BOTON}
                />
                {tarjeta.clave === "voluntariado" || tarjeta.clave === "donaciones" ? (
                  <CampoTexto
                    label="Ruta del formulario"
                    name={`ruta-${index}`}
                    value={tarjeta.ruta}
                    onChange={(event) => cambiarCampo(index, "ruta", event.target.value)}
                    placeholder={tarjeta.clave === "donaciones" ? "/donaciones/solicitar" : "/voluntariado/solicitar"}
                    hint={"Ruta interna del botón."}
                    sinLimite
                  />
                ) : null}
              </div>
            </AdminFieldset>
          ))}
          </AdminEditorConPreview>
        </AdminModalBody>

        <AdminModalFooter>
          <AdminModalActions
            variant="coffee"
            onCancel={onCerrar}
            primaryLabel={guardando ? tGuardando : tGuardarCambios}
            primaryDisabled={guardando}
          />
        </AdminModalFooter>
      </form>
    </AdminModal>
  );
}

function ModalNavbar({ navbar, enlaces = EMPTY_ARRAY, onCerrar, onGuardar, guardando }) {
  const [form, setForm] = useState(() => ({ ...navbarInicial, ...navbar }));
  const tGuardando = useTraducir("Guardando...");
  const tGuardarCambios = useTraducir("Guardar cambios");
  const { tLogos } = useLegendas();

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
        <AdminModalHeader
          icon={LayoutTemplate}
          title="Navbar"
          titleId="admin-navbar-modal-title"
          description={"Logos que aparecen en la barra de navegaci\u00f3n del sitio."}
          onClose={onCerrar}
        />

        <AdminModalBody cms>
          <AdminEditorConPreview
            variant="modal"
            preview={<PreviewNavbarLive form={form} enlaces={enlaces} />}
          >
          <AdminFieldset legend={tLogos}>
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
          </AdminFieldset>
          </AdminEditorConPreview>
        </AdminModalBody>

        <AdminModalFooter>
          <AdminModalActions
            variant="coffee"
            onCancel={onCerrar}
            primaryLabel={guardando ? tGuardando : tGuardarCambios}
            primaryDisabled={guardando}
          />
        </AdminModalFooter>
      </form>
    </AdminModal>
  );
}

/** Íconos del sitio que se eligen dentro de un modal y se guardan junto con el formulario. */
function useIconosSitioEditables(activo) {
  const [guardados, setGuardados] = useState(() => new Map());
  const [pendientes, setPendientes] = useState({});

  useEffect(() => {
    if (!activo) return undefined;
    let vivo = true;
    listarCatalogo(TIPOS_CATALOGO.iconoSitio, { forzar: true })
      .then((items) => {
        if (vivo) setGuardados(new Map(items.map((item) => [item.nombre, item])));
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [activo]);

  if (!activo) return null;

  const valor = (lugar) => (lugar in pendientes ? pendientes[lugar] : guardados.get(lugar)?.icono || "");
  const elegir = (lugar, clave) => setPendientes((actual) => ({ ...actual, [lugar]: clave }));
  const guardar = async () => {
    const tipo = TIPOS_CATALOGO.iconoSitio;
    let cambio = false;
    for (const [lugar, clave] of Object.entries(pendientes)) {
      const actual = guardados.get(lugar);
      if ((actual?.icono || "") === clave) continue;
      if (actual && !clave) await eliminarItemCatalogo(tipo, actual.id);
      else if (actual) await actualizarItemCatalogo(tipo, actual.id, { icono: clave });
      else await crearItemCatalogo(tipo, { nombre: lugar, icono: clave });
      cambio = true;
    }
    if (cambio) await recargarIconosSitio();
  };
  return { valor, elegir, guardar };
}

function CampoConIcono({ lugar, iconos, children }) {
  if (!iconos) return children;
  const valor = iconos.valor(lugar);
  return (
    <div className="flex min-w-0 items-end gap-2">
      <SelectorIcono
        valor={valor}
        IconoActual={iconoPorClave(valor) || iconoOriginalSitio(lugar)}
        onElegir={(clave) => iconos.elegir(lugar, clave)}
        etiquetaAuto="Ícono original"
      />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function ModalFooter({ footer, enlaces = EMPTY_ARRAY, onCerrar, onGuardar, guardando, puedeEditarIconos = false }) {
  const [form, setForm] = useState(() => ({ ...footerInicial, ...footer }));
  const { idioma } = useIdioma();
  const tGuardando = useTraducir("Guardando...");
  const tGuardarCambios = useTraducir("Guardar cambios");
  const { tLogos, tTextos, tContacto, tRedes } = useLegendas();
  const iconos = useIconosSitioEditables(puedeEditarIconos);

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
    if (iconos) {
      try {
        await iconos.guardar();
      } catch (err) {
        alert(t(err?.message || "No se pudieron guardar los íconos."));
        return;
      }
    }
    const paraGuardar = await asegurarCamposEnEspanol(form, FOOTER_CAMPOS_TEXTO);
    onGuardar(paraGuardar);
  };

  return (
    <AdminModal open onClose={onCerrar} maxWidth="max-w-xl" labelledBy="admin-footer-modal-title">
      <form onSubmit={enviar} className="flex min-h-0 flex-1 flex-col">
        <AdminModalHeader
          icon={PanelBottom}
          title="Footer"
          titleId="admin-footer-modal-title"
          description={"Informaci\u00f3n de contacto y pie de p\u00e1gina del sitio."}
          onClose={onCerrar}
        />

        <AdminModalBody cms>
          <AdminEditorConPreview
            variant="modal"
            preview={
              <PreviewFooterLive
                form={form}
                enlaces={enlaces}
                iconoDe={iconos ? (lugar) => iconoPorClave(iconos.valor(lugar)) || iconoOriginalSitio(lugar) : undefined}
              />
            }
          >
          <AdminFieldset legend={tLogos} className="items-start sm:grid-cols-2">
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
          </AdminFieldset>

          <AdminFieldset legend={tTextos}>
            <CampoTexto
              label="Frase de marca"
              name="fraseMarca"
              value={form.fraseMarca}
              onChange={cambiarCampo}
              placeholder="Ej. Cultivando futuro desde la UNA"
              maxPalabras={MAX_PALABRAS_TEXTO_BREVE}
            />
            <CampoTexto
              label="Texto de copyright"
              name="textoCopyright"
              value={form.textoCopyright}
              onChange={cambiarCampo}
              placeholder="Ej. © 2026 Nombre del sitio. Todos los derechos reservados."
              maxPalabras={MAX_PALABRAS_TEXTO_BREVE}
            />
          </AdminFieldset>

          <AdminFieldset legend={tContacto} className="items-start sm:grid-cols-2">
            <CampoConIcono lugar="footer.telefono" iconos={iconos}>
              <CampoTexto
                label={"Teléfono"}
                name="telefono"
                value={form.telefono}
                onChange={cambiarCampo}
                placeholder="88888888"
                soloNumeros
                maxLength={8}
                sinLimite
              />
            </CampoConIcono>
            <CampoConIcono lugar="footer.correo" iconos={iconos}>
              <CampoTexto
                label="Correo"
                name="correo"
                type="email"
                value={form.correo}
                onChange={cambiarCampo}
                placeholder="correo@ejemplo.com"
              />
            </CampoConIcono>
          </AdminFieldset>

          <AdminFieldset legend={tRedes}>
            <div className="grid items-start gap-4 sm:grid-cols-2">
              <CampoConIcono lugar="redes.facebook" iconos={iconos}>
                <CampoTexto
                  label="Facebook URL"
                  name="facebookUrl"
                  sinLimite
                  value={form.facebookUrl}
                  onChange={cambiarCampo}
                  placeholder="https://facebook.com/..."
                />
              </CampoConIcono>
              <CampoConIcono lugar="redes.instagram" iconos={iconos}>
                <CampoTexto
                  label="Instagram URL"
                  name="instagramUrl"
                  sinLimite
                  value={form.instagramUrl}
                  onChange={cambiarCampo}
                  placeholder="https://instagram.com/..."
                />
              </CampoConIcono>
            </div>
            <CampoConIcono lugar="footer.ubicacion" iconos={iconos}>
              <CampoTexto
                label="Google Maps URL"
                name="mapsUrl"
                sinLimite
                value={form.mapsUrl}
                onChange={cambiarCampo}
                placeholder="https://maps.google.com/..."
              />
            </CampoConIcono>
            {iconos ? (
              <p className="text-xs text-[var(--admin-text-muted)]">
                <ST>El botón redondo junto a cada campo cambia el ícono que se ve en el pie de página.</ST>
              </p>
            ) : null}
          </AdminFieldset>
          </AdminEditorConPreview>
        </AdminModalBody>

        <AdminModalFooter>
          <AdminModalActions
            variant="coffee"
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
        <AdminModalHeader
          icon={Link2}
          title={tTitulo}
          titleId="admin-enlaces-modal-title"
          description={`Gestion\u00e1 los enlaces de ${config.titulo.toLowerCase()}.`}
          onClose={onCerrar}
        />

        <AdminModalBody cms className="space-y-5">
          <AdminEditorConPreview
            variant="modal"
            preview={(
              <PreviewEnlaces
                items={items}
                variante={config.seccion === "Navbar" ? "navbar" : "footer"}
                navbar={navbar}
                footer={footer}
              />
            )}
          >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-[length:var(--text-body)] font-bold text-[var(--admin-text-primary)]"><ST>Enlaces actuales</ST></h3>
            <button
              type="button"
              onClick={agregarItem}
              className={`${adminBtnQuiet} w-full sm:w-auto`}
            >
              <Plus size={14} aria-hidden="true" />
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
                    <label className="grid gap-1.5 text-[13px] font-semibold text-[var(--admin-text-muted)]">
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
                    <label className="grid gap-1.5 text-[13px] font-semibold text-[var(--admin-text-muted)]">
                      <ST>Ruta</ST>
                      <input
                        value={item.ruta ?? ""}
                        onChange={(event) => cambiarItem(item.id, "ruta", event.target.value)}
                        placeholder="/productos o https://..."
                        className="h-[var(--control-height)] rounded-full border border-slate-200 bg-white px-4 text-[length:var(--text-body)] font-normal normal-case tracking-normal text-slate-950 shadow-none outline-none transition focus:border-slate-400 focus:bg-white focus:shadow-none focus:ring-0 focus:outline-none"
                        required
                      />
                    </label>
                    <label className="grid gap-1.5 text-[13px] font-semibold text-[var(--admin-text-muted)]">
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
            variant="coffee"
            onCancel={onCerrar}
            primaryLabel={guardando ? tGuardando : tGuardarCambios}
            primaryDisabled={guardando}
          />
        </AdminModalFooter>
      </form>
    </AdminModal>
  );
}

function ModalFaqInicio({ items, seccion, onCerrar, onGuardar, guardando, puedeEliminar }) {
  const [lista, setLista] = useState(() => (Array.isArray(items) ? items : []));
  const [busqueda, setBusqueda] = useState("");
  const tTitulo = useTraducir("Preguntas y respuestas");
  const tGuardando = useTraducir("Guardando...");
  const tGuardarCambios = useTraducir("Guardar cambios");
  const { idioma } = useIdioma();

  useEffect(() => {
    let cancelado = false;
    const base = Array.isArray(items) ? items : [];
    setLista(base);
    (async () => {
      if (idioma !== "en") {
        if (!cancelado) setLista(base);
        return;
      }
      const vista = await traducirListaObjetos(base, FAQ_CAMPOS_TEXTO);
      if (!cancelado) setLista(vista);
    })();
    return () => {
      cancelado = true;
    };
  }, [items, idioma]);

  const itemsFiltrados = useMemo(
    () => filtrarPorBusqueda(lista, busqueda, (item) => [item.pregunta, item.respuesta]),
    [lista, busqueda],
  );

  const cambiarItem = (id, campo, valor) => {
    setLista((actual) => actual.map((item) => (item.id === id ? { ...item, [campo]: valor } : item)));
  };

  const agregarItem = () => {
    const siguienteOrden = lista.reduce((max, item) => Math.max(max, Number(item.orden) || 0), 0) + 1;
    setLista((actual) => [
      ...actual,
      {
        id: `nuevo-${Date.now()}`,
        pregunta: "",
        respuesta: "",
        icono: "",
        orden: siguienteOrden,
      },
    ]);
  };

  const eliminarItem = (id) => {
    setLista((actual) => actual.filter((item) => item.id !== id));
  };

  const enviar = async (event) => {
    event.preventDefault();
    const validos = lista.filter((item) => item.pregunta?.trim() && item.respuesta?.trim());
    const normalizados = await Promise.all(
      validos.map((item) => asegurarCamposEnEspanol(item, FAQ_CAMPOS_TEXTO)),
    );
    onGuardar(normalizados);
  };

  return (
    <AdminModal open onClose={onCerrar} maxWidth="max-w-3xl" labelledBy="admin-faq-inicio-modal-title">
      <form onSubmit={enviar} className="flex min-h-0 flex-1 flex-col">
        <AdminModalHeader
          icon={CircleHelp}
          title={tTitulo}
          titleId="admin-faq-inicio-modal-title"
          description="Agregá, editá u ordená las preguntas del inicio. El título de la sección se edita en la tarjeta Preguntas frecuentes."
          onClose={onCerrar}
        />

        <AdminModalBody cms className="space-y-5">
          <AdminEditorConPreview
            variant="modal"
            preview={<PreviewFaqInicioLive items={lista} seccion={seccion} />}
          >
            <div className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-[length:var(--text-body)] font-bold text-[var(--admin-text-primary)]"><ST>Preguntas actuales</ST></h3>
                <button
                  type="button"
                  onClick={agregarItem}
                  className={`${adminBtnQuiet} w-full sm:w-auto`}
                >
                  <Plus size={14} aria-hidden="true" />
                  <ST>Agregar pregunta</ST>
                </button>
              </div>

              <AdminListaToolbar
                compacto
                busqueda={busqueda}
                onBusquedaChange={setBusqueda}
                placeholder="Buscar por pregunta o respuesta..."
                total={lista.length}
                visibles={itemsFiltrados.length}
                hayFiltrosActivos={Boolean(busqueda.trim())}
                onLimpiar={() => setBusqueda("")}
              />

              {lista.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  <ST>No hay preguntas configuradas. Agregue una para mostrarla en el inicio.</ST>
                </p>
              ) : itemsFiltrados.length === 0 ? (
                <AdminListaVacia onLimpiar={() => setBusqueda("")} />
              ) : (
                <div className="space-y-4">
                  {itemsFiltrados.map((item) => (
                    <div key={item.id} className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-end justify-between gap-2">
                        <div className="space-y-1">
                          <span className="block text-[length:var(--text-body)] font-medium text-slate-600"><ST>Ícono</ST></span>
                          <SelectorIcono
                            valor={item.icono || ""}
                            IconoActual={iconoDePreguntaFaq(item.icono, lista.indexOf(item))}
                            etiquetaAuto="Automático según la posición"
                            onElegir={(clave) => cambiarItem(item.id, "icono", clave)}
                          />
                        </div>
                        <label className="min-w-0 flex-1 space-y-1">
                          <span className="text-[length:var(--text-body)] font-medium text-slate-600"><ST>Pregunta</ST></span>
                          <input
                            value={item.pregunta ?? ""}
                            onChange={(e) => cambiarItem(item.id, "pregunta", e.target.value.slice(0, 500))}
                            maxLength={500}
                            className="w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-[length:var(--text-body)] outline-none focus:border-slate-400"
                            required
                          />
                        </label>
                        {puedeEliminar ? (
                          <button
                            type="button"
                            onClick={() => eliminarItem(item.id)}
                            className="rounded-full p-2 text-slate-500 transition hover:bg-white hover:text-red-600"
                            aria-label={t("Eliminar")}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        ) : null}
                      </div>
                      <label className="block space-y-1">
                        <span className="text-[length:var(--text-body)] font-medium text-slate-600"><ST>Respuesta</ST></span>
                        <textarea
                          value={item.respuesta ?? ""}
                          onChange={(e) => cambiarItem(item.id, "respuesta", e.target.value.slice(0, 4000))}
                          maxLength={4000}
                          rows={3}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-[length:var(--text-body)] outline-none focus:border-slate-400"
                          required
                        />
                      </label>
                      <label className="inline-flex items-center gap-2 text-[length:var(--text-body)] text-slate-600">
                        <ST>Orden</ST>
                        <NumericInput
                          value={item.orden ?? 0}
                          onChange={(event) => cambiarItem(item.id, "orden", Number(event.target.value) || 0)}
                          className="w-20 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[length:var(--text-body)] outline-none focus:border-slate-400"
                        />
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </AdminEditorConPreview>
        </AdminModalBody>

        <AdminModalFooter>
          <AdminModalActions
            variant="coffee"
            onCancel={onCerrar}
            primaryDisabled={guardando}
            primaryLabel={guardando ? tGuardando : tGuardarCambios}
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
  const navigate = useNavigate();
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
    homeFaq: { ...seccionInicioVacia },
    homeDocumentacion: { ...seccionInicioVacia },
  });
  const [navbar, setNavbar] = useState(navbarInicial);
  const [footer, setFooter] = useState(footerInicial);
  const [enlacesNavbar, setEnlacesNavbar] = useState([]);
  const [enlacesFooter, setEnlacesFooter] = useState([]);
  const [tarjetasInicio, setTarjetasInicio] = useState([]);
  const [faqInicio, setFaqInicio] = useState([]);
  const [productoresHero, setProductoresHero] = useState(() => ({ ...DEFAULT_PRODUCTORES_HERO }));
  const [guardando, setGuardando] = useState(false);
  const [editando, setEditando] = useState(null);

  const loadMain = useCallback(() => fetchAdminMainPageData(), []);
  const { data, status, error: loadError, reload } = useCachedPageData("admin-main", loadMain);
  const { showLoading, loadingMessage } = useAdminPageGate('/admin/informacion-pagina-principal', status === 'ready');

  useEffect(() => {
    let activo = true;
    obtenerProductoresHero().then((res) => {
      if (activo && res) setProductoresHero(res);
    }).catch(() => {});
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (!data) return;

    if (data.hero) setHero(mapHero(data.hero));
    setSeccionesInicio(data.seccionesInicio ?? {
      homeSpotlight: { ...seccionInicioVacia },
      homeFeatured: { ...seccionInicioVacia },
      homeIniciativas: { ...seccionInicioVacia },
      homeLocation: { ...seccionInicioVacia },
      homeFaq: { ...seccionInicioVacia },
      homeDocumentacion: { ...seccionInicioVacia },
    });
    setTarjetasInicio(Array.isArray(data.tarjetasInicio) ? data.tarjetasInicio : []);
    setFaqInicio(Array.isArray(data.faqInicio) ? data.faqInicio : []);
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

  const guardarProductoresHero = async (form) => {
    try {
      setGuardando(true);
      const actualizado = await actualizarProductoresHero(form);
      setProductoresHero(actualizado);
      await reload();
      setEditando(null);
    } catch (err) {
      alert(t(err.message || "No se pudo guardar la sección de productores."));
    } finally {
      setGuardando(false);
    }
  };

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
    if (String(form.correo ?? "").trim() && !esCorreoValido(form.correo)) {
      alert(t(MENSAJE_CORREO_INVALIDO));
      return;
    }
    try {
      setGuardando(true);
      const payload = {
        logoUrl: form.logoUrl ?? "",
        logoClaroUrl: form.logoClaroUrl ?? "",
        fraseMarca: form.fraseMarca ?? "",
        telefono: form.telefono ?? "",
        correo: String(form.correo ?? "").trim(),
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


  const guardarFaqInicio = async (items) => {
    const actual = faqInicio;
    const actualPorId = new Map(actual.map((item) => [String(item.id), item]));
    const validos = items.filter((item) => item.pregunta?.trim() && item.respuesta?.trim());

    const removidos = esSuperAdmin
      ? actual.filter((item) => !validos.some((nuevo) => String(nuevo.id) === String(item.id)))
      : [];
    const agregados = validos.filter((item) => {
      const id = String(item.id ?? "");
      return id.startsWith("nuevo-") || !actualPorId.has(id);
    });
    const editados = validos.filter((item) => {
      const previo = actualPorId.get(String(item.id));
      if (!previo) return false;
      return (
        (previo.pregunta ?? "") !== (item.pregunta ?? "").trim()
        || (previo.respuesta ?? "") !== (item.respuesta ?? "").trim()
        || (previo.icono ?? "") !== (item.icono ?? "")
        || Number(previo.orden ?? 0) !== Number(item.orden ?? 0)
      );
    });

    try {
      setGuardando(true);
      await Promise.all(removidos.map((item) => eliminarFaqInicio(item.id)));
      await Promise.all(
        agregados.map((item) =>
          crearFaqInicio({
            pregunta: item.pregunta.trim(),
            respuesta: item.respuesta.trim(),
            icono: item.icono || "",
            orden: Number(item.orden) || undefined,
          }),
        ),
      );
      await Promise.all(
        editados.map((item) =>
          actualizarFaqInicio(item.id, {
            pregunta: item.pregunta.trim(),
            respuesta: item.respuesta.trim(),
            icono: item.icono || "",
            orden: Number(item.orden) || 0,
          }),
        ),
      );
      const actualizados = await obtenerFaqInicio();
      setFaqInicio(
        (Array.isArray(actualizados) ? actualizados : []).map((item) => ({
          id: item?.id ?? item?.Id ?? null,
          pregunta: item?.pregunta ?? item?.Pregunta ?? "",
          respuesta: item?.respuesta ?? item?.Respuesta ?? "",
          icono: item?.icono ?? item?.Icono ?? "",
          orden: Number(item?.orden ?? item?.Orden ?? 0) || 0,
        })),
      );
      await reload();
      setEditando(null);
    } catch (err) {
      alert(t(err.message || "No se pudo guardar las preguntas frecuentes."));
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
      { id: "hero", grupo: "inicio", busqueda: ["Portada principal", "Hero", hero.title, hero.subtitle] },
      ...seccionesInicioItems,
      { id: "tarjetas-inicio", grupo: "inicio", busqueda: ["Mini formularios", "Inicio", resumenTarjetasInicio] },
      { id: "faq-inicio", grupo: "inicio", busqueda: ["Preguntas frecuentes", "FAQ", "Inicio", faqInicio.map((i) => i.pregunta).join(" ")] },
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
      {
        id: "productores-hero",
        grupo: "inicio",
        busqueda: [
          "Productores",
          "Portada y mapa de productores",
          "Finca Santa Lucía",
          "Emprendimientos",
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
    productoresHero,
    faqInicio,
  ]);

  const {
    busqueda,
    setBusqueda,
    filtrados: seccionesFiltradas,
    limpiar: limpiarFiltros,
    hayFiltrosActivos,
  } = useAdminListaFiltros(seccionesPaginaPrincipal, {
    buscarEn: (seccion) => seccion.busqueda,
  });

  const tTabsEtiqueta = useTraducir("Secciones de la página principal");
  const tBuscar = useTraducir("Buscar");
  const tBuscarSecciones = useTraducir("Buscar secciones por nombre o contenido...");
  const tLimpiarFiltros = useTraducir("Limpiar filtros");
  const [tabActiva, setTabActiva] = useState("inicio");
  const tabRefs = useRef({});
  const tabsBaseId = useId();

  const idsVisibles = useMemo(
    () => new Set(seccionesFiltradas.map((seccion) => seccion.id)),
    [seccionesFiltradas],
  );

  const filaSeccionInicio = (clave) => {
    const config = CONFIG_SECCIONES_INICIO[clave];
    const data = seccionesInicio[clave];
    return {
      id: clave,
      nombre: config.tituloTarjeta,
      icono: config.icon,
      resumen: data?.title || data?.description || "",
      imagen: data?.image || "",
    };
  };

  // Order follows the public homepage render order (src/Pages/Home/Home.jsx).
  const gruposFilas = [
    {
      id: "inicio",
      titulo: "Página de inicio",
      filas: [
        { id: "hero", nombre: "Portada principal", icono: Image, resumen: hero.title || hero.subtitle, imagen: hero.backgroundImage },
        filaSeccionInicio("homeSpotlight"),
        filaSeccionInicio("homeFeatured"),
        filaSeccionInicio("homeIniciativas"),
        {
          id: "tarjetas-inicio",
          nombre: "Mini formularios",
          icono: ClipboardList,
          resumen: tarjetasInicio.length ? resumenTarjetasInicio : "",
        },
        filaSeccionInicio("homeDocumentacion"),
        {
          id: "productores-hero",
          nombre: "Portada y mapa de productores",
          icono: Sprout,
          resumen: productoresHero.title,
          imagen: productoresHero.image,
        },
        filaSeccionInicio("homeLocation"),
        filaSeccionInicio("homeFaq"),
        {
          id: "faq-inicio",
          nombre: "Preguntas y respuestas",
          icono: CircleHelp,
          resumen: faqInicio.length ? `${faqInicio.length} pregunta${faqInicio.length === 1 ? "" : "s"}` : "",
        },
      ].map((fila, indice) => ({ ...fila, numero: indice + 1 })),
    },
    {
      id: "navbar",
      titulo: "Barra de navegación",
      filas: [
        {
          id: "navbar",
          nombre: "Barra de navegación",
          icono: LayoutTemplate,
          resumen: navbar.logoUrl || navbar.logoClaroUrl ? "Logos configurados" : "",
        },
        {
          id: "enlaces-navbar",
          nombre: CONFIG_ENLACES["enlaces-navbar"].titulo,
          icono: Link2,
          resumen: enlacesNavbar.length ? `${enlacesNavbar.length} enlace${enlacesNavbar.length === 1 ? "" : "s"}` : "",
        },
      ],
    },
    {
      id: "footer",
      titulo: "Pie de página",
      filas: [
        {
          id: "footer",
          nombre: "Pie de página",
          icono: PanelBottom,
          resumen: footer.fraseMarca || footer.correo || footer.telefono,
        },
        {
          id: "enlaces-footer",
          nombre: CONFIG_ENLACES["enlaces-footer"].titulo,
          icono: Link2,
          resumen: enlacesFooter.length ? `${enlacesFooter.length} enlace${enlacesFooter.length === 1 ? "" : "s"}` : "",
        },
      ],
    },
  ].map((grupo) => ({ ...grupo, filas: grupo.filas.filter((fila) => idsVisibles.has(fila.id)) }));

  // While searching, jump to the first tab with matches if the chosen one has none.
  const grupoActivo = (() => {
    const elegido = gruposFilas.find((grupo) => grupo.id === tabActiva) || gruposFilas[0];
    if (!busqueda.trim() || elegido.filas.length > 0) return elegido;
    return gruposFilas.find((grupo) => grupo.filas.length > 0) || elegido;
  })();

  const seleccionarTab = (id, enfocar = false) => {
    setTabActiva(id);
    if (enfocar) tabRefs.current[id]?.focus();
  };

  const teclaTab = (event, indice) => {
    const ultimo = gruposFilas.length - 1;
    const destinos = {
      ArrowRight: indice === ultimo ? 0 : indice + 1,
      ArrowLeft: indice === 0 ? ultimo : indice - 1,
      Home: 0,
      End: ultimo,
    };
    if (!(event.key in destinos)) return;
    event.preventDefault();
    seleccionarTab(gruposFilas[destinos[event.key]].id, true);
  };

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
            <div className="flex min-w-0 flex-col-reverse gap-3 border-b border-[var(--admin-border)] px-4 py-4 sm:px-6 xl:flex-row xl:items-center xl:justify-between xl:gap-6">
              <div
                role="tablist"
                aria-label={tTabsEtiqueta}
                className="grid min-w-0 grid-cols-3 gap-1 rounded-full border border-[var(--admin-border)] bg-[var(--admin-surface-hover)] p-1 xl:flex xl:w-fit xl:shrink-0"
              >
                {gruposFilas.map((grupo, indice) => (
                  <SegmentoSeccion
                    key={grupo.id}
                    grupo={grupo}
                    corto={TABS_CORTOS[grupo.id]}
                    activa={grupo.id === grupoActivo.id}
                    onSeleccionar={() => seleccionarTab(grupo.id)}
                    onTecla={(event) => teclaTab(event, indice)}
                    registrarRef={(nodo) => {
                      tabRefs.current[grupo.id] = nodo;
                    }}
                    tabId={`${tabsBaseId}-tab-${grupo.id}`}
                    panelId={`${tabsBaseId}-panel`}
                  />
                ))}
              </div>

              <div className="relative w-full min-w-0 xl:max-w-[22rem]">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--admin-text-muted)]" aria-hidden="true" />
                <input
                  type="search"
                  value={busqueda}
                  onChange={(event) => setBusqueda(event.target.value)}
                  placeholder={tBuscarSecciones}
                  aria-label={tBuscar}
                  className="h-[var(--control-height)] w-full min-w-0 rounded-[var(--admin-control-radius)] border border-[var(--admin-border-input)] bg-[var(--admin-surface)] py-2 pl-9 pr-11 text-[length:var(--text-body)] text-[var(--admin-text-primary)] outline-none transition-colors placeholder:text-[var(--admin-text-muted)] [&::-webkit-search-cancel-button]:appearance-none"
                />
                {hayFiltrosActivos ? (
                  <button
                    type="button"
                    onClick={limpiarFiltros}
                    aria-label={tLimpiarFiltros}
                    className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full! text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-surface-hover)] hover:text-[var(--admin-text-primary)] focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[color:var(--admin-focus-ring)]"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            </div>

            <div
              role="tabpanel"
              id={`${tabsBaseId}-panel`}
              aria-labelledby={`${tabsBaseId}-tab-${grupoActivo.id}`}
              className="min-w-0 pb-4"
            >
              {grupoActivo.filas.length === 0 ? (
                <AdminListaVacia onLimpiar={limpiarFiltros} />
              ) : (
                <ul className="divide-y divide-[var(--admin-border)] border-b border-[var(--admin-border)]">
                  {grupoActivo.filas.map((fila) => (
                    <li key={fila.id}>
                      <AdminSeccionFila
                        numero={fila.numero}
                        nombre={fila.nombre}
                        resumen={fila.resumen}
                        icono={fila.icono}
                        imagen={fila.imagen}
                        onEditar={() => setEditando(fila.id)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
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

      {editando === "productores-hero" ? (
        <ModalProductoresHero
          data={productoresHero}
          onCerrar={() => setEditando(null)}
          onGuardar={guardarProductoresHero}
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

      {editando === "faq-inicio" ? (
        <ModalFaqInicio
          items={faqInicio}
          seccion={seccionesInicio.homeFaq}
          onCerrar={() => setEditando(null)}
          onGuardar={guardarFaqInicio}
          guardando={guardando}
          puedeEliminar={esSuperAdmin}
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
          puedeEditarIconos={tienePermiso(actorRoles, "administrar_roles_permisos")}
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
