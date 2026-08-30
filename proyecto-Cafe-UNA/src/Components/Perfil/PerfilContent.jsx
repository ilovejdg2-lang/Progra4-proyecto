import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Camera, ChevronRight, Eye, EyeOff, KeyRound, Mail, UserRound, X } from "lucide-react";
import {
  actualizarPerfil,
  cambiarPasswordPerfil,
  confirmarCambioCorreo,
  obtenerPerfil,
  solicitarCambioCorreo,
} from "../../services/perfilService";
import { applyPerfilToSession, getActiveSessionUser } from "../../services/sessionService";
import { normalizeImageUrl } from "../../lib/imageUtils";
import { inicialDeNombre } from "../../lib/inicialDeNombre";
import {
  MAX_NOMBRE_USUARIO,
  MAX_PASSWORD,
  contactSupportMessage,
  sanitizeUserFacingError,
  validateNombreUsuario,
  validatePassword,
} from "../../lib/formLimits";
import PageLoading from "../PageLoading/PageLoading";
import { useTraducir } from "../../hooks/useTraducir";
import { ST } from "../T/ST";
import "./PerfilContent.css";

const FEEDBACK_AUTO_HIDE_MS = 4000;

function claseRolPerfil(rol) {
  const clave = String(rol ?? "").trim().toLowerCase();
  if (clave === "superadmin" || clave === "superadministrador") return "perfil-hero__role--superadmin";
  if (clave === "admin" || clave === "administración" || clave === "administracion") return "perfil-hero__role--admin";
  if (clave === "vendedor") return "perfil-hero__role--vendedor";
  if (clave === "cliente") return "perfil-hero__role--cliente";
  return "perfil-hero__role--usuario";
}

function PerfilPasswordField({ label, value, onChange, visible, onToggle, autoFocus = false, error = "" }) {
  const Icon = visible ? Eye : EyeOff;
  const tOcultar = useTraducir("Ocultar contraseña");
  const tMostrar = useTraducir("Mostrar contraseña");

  return (
    <label className="perfil-field perfil-password-field">
      <span><ST>{label}</ST></span>
      <div className="perfil-password-field__input-wrap">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          required
          autoFocus={autoFocus}
          maxLength={MAX_PASSWORD}
          className={error ? "input-error" : ""}
          aria-invalid={Boolean(error)}
        />
        <button
          type="button"
          className="perfil-password-field__toggle"
          onClick={onToggle}
          aria-label={visible ? tOcultar : tMostrar}
        >
          <Icon size={18} aria-hidden="true" />
        </button>
      </div>
      {error ? <p className="perfil-field-error"><ST>{error}</ST></p> : null}
    </label>
  );
}

function ImageUrlModal({
  open,
  type,
  variant,
  value,
  onChange,
  onClose,
  onSave,
  saving,
}) {
  const tCerrar = useTraducir("Cerrar");
  const tCambiarFoto = useTraducir("Cambiar foto de perfil");
  const tCambiarBanner = useTraducir("Cambiar banner");
  const tUrlImagen = useTraducir("URL de la imagen");
  const tVistaPreviaAvatarAdmin = useTraducir("Vista previa (96×96 px)");
  const tVistaPreviaAvatar = useTraducir("Vista previa (112×112 px)");
  const tVistaPreviaBannerAdmin = useTraducir("Vista previa (220 px de alto)");
  const tVistaPreviaBanner = useTraducir("Vista previa (280 px de alto)");
  const tVistaPrevia = useTraducir("Vista previa");
  const tPegaEnlace = useTraducir("Pega un enlace para ver la vista previa al tamaño real.");
  const tGuardando = useTraducir("Guardando...");
  const tGuardarImagen = useTraducir("Guardar imagen");
  const tCancelar = useTraducir("Cancelar");

  if (!open) return null;

  const isAvatar = type === "avatar";
  const isAdmin = variant === "admin";
  const preview = value ? normalizeImageUrl(value, { width: isAvatar ? 320 : 1600 }) : "";
  const previewLabel = isAvatar
    ? (isAdmin ? tVistaPreviaAvatarAdmin : tVistaPreviaAvatar)
    : (isAdmin ? tVistaPreviaBannerAdmin : tVistaPreviaBanner);

  return (
    <div className="perfil-modal" role="dialog" aria-modal="true">
      <button type="button" className="perfil-modal__backdrop" aria-label={tCerrar} onClick={onClose} />
      <div className={`perfil-modal__card perfil-modal__card--image ${isAvatar ? "perfil-modal__card--avatar" : "perfil-modal__card--banner"}`}>
        <header className="perfil-modal__header">
          <h3>{isAvatar ? tCambiarFoto : tCambiarBanner}</h3>
          <button type="button" className="perfil-modal__close" onClick={onClose} aria-label={tCerrar}>
            <X size={18} />
          </button>
        </header>

        <label className="perfil-field">
          <span>{tUrlImagen}</span>
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://..."
            autoFocus
          />
        </label>

        {preview ? (
          <div className="perfil-modal__preview-block">
            <p className="perfil-modal__preview-label">{previewLabel}</p>
            <div
              className={[
                "perfil-modal__preview-frame",
                isAvatar ? "perfil-modal__preview-frame--avatar" : "perfil-modal__preview-frame--banner",
                isAdmin ? "perfil-modal__preview-frame--admin" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <img
                src={preview}
                alt={tVistaPrevia}
                className="perfil-modal__preview-img"
                draggable={false}
              />
            </div>
          </div>
        ) : (
          <p className="perfil-modal__empty-preview">{tPegaEnlace}</p>
        )}

        <div className="perfil-modal__actions">
          <button type="button" className="perfil-button" onClick={onSave} disabled={saving || !value.trim()}>
            {saving ? tGuardando : tGuardarImagen}
          </button>
          <button type="button" className="perfil-button perfil-button--ghost" onClick={onClose}>
            {tCancelar}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PerfilContent({ variant = "standalone" }) {
  const sessionUser = getActiveSessionUser();
  const sessionUserId = Number(sessionUser?.id) || null;
  const tCargandoPerfil = useTraducir("Cargando perfil...");
  const tCambiarBanner = useTraducir("Cambiar banner");
  const tCambiarFoto = useTraducir("Cambiar foto de perfil");
  const tMiPerfil = useTraducir("Mi perfil");
  const tCompras = useTraducir("Compras");
  const tRevisaPedidos = useTraducir("Revisá pedidos, totales y detalle.");
  const tVerHistorial = useTraducir("Ver historial de compras");
  const tInfoPersonal = useTraducir("Información personal");
  const tSinNombre = useTraducir("Sin nombre");
  const tCambiarNombre = useTraducir("Cambiar nombre");
  const tNuevoNombre = useTraducir("Nuevo nombre");
  const tGuardando = useTraducir("Guardando...");
  const tGuardarNombre = useTraducir("Guardar nombre");
  const tCancelar = useTraducir("Cancelar");
  const tCorreoElectronico = useTraducir("Correo electrónico");
  const tCambiarCorreo = useTraducir("Cambiar correo");
  const tNuevoCorreo = useTraducir("Nuevo correo");
  const tCodigoVerif = useTraducir("Código de verificación");
  const tSeisDigitos = useTraducir("6 dígitos");
  const tProcesando = useTraducir("Procesando...");
  const tEnviarCodigo = useTraducir("Enviar código");
  const tConfirmarCorreo = useTraducir("Confirmar correo");
  const tSeguridad = useTraducir("Seguridad");
  const tCambiarPass = useTraducir("Cambiar contraseña");
  const tActualizando = useTraducir("Actualizando...");
  const tActualizarPass = useTraducir("Actualizar contraseña");
  const tVolverInicio = useTraducir("Volver al inicio");
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const tErrorCarga = useTraducir(error || "No se pudo cargar el perfil.");
  const tMensaje = useTraducir(mensaje);
  const [imageModal, setImageModal] = useState(null);
  const [imageDraft, setImageDraft] = useState("");
  const [form, setForm] = useState({
    nombre: "",
    correo: "",
    fotoPerfilUrl: "",
    fotoBannerUrl: "",
    fotoPerfilPosicion: "",
    fotoBannerPosicion: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    passwordActual: "",
    passwordNueva: "",
    confirmPassword: "",
    step: "view",
  });
  const [nombreForm, setNombreForm] = useState({
    nombre: "",
    step: "view",
  });
  const [nombreError, setNombreError] = useState("");
  const [passwordErrors, setPasswordErrors] = useState({
    passwordActual: "",
    passwordNueva: "",
    confirmPassword: "",
  });
  const [emailForm, setEmailForm] = useState({
    nuevoCorreo: "",
    token: "",
    passwordActual: "",
    step: "view",
  });
  const [emailErrors, setEmailErrors] = useState({
    nuevoCorreo: "",
    passwordActual: "",
    token: "",
    formulario: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    actual: false,
    nueva: false,
    confirm: false,
    email: false,
  });
  const [avatarRoto, setAvatarRoto] = useState(false);

  function resetPasswordVisibility() {
    setShowPasswords({ actual: false, nueva: false, confirm: false });
  }

  function openPasswordEdit() {
    resetPasswordVisibility();
    setPasswordErrors({ passwordActual: "", passwordNueva: "", confirmPassword: "" });
    setPasswordForm({
      passwordActual: "",
      passwordNueva: "",
      confirmPassword: "",
      step: "edit",
    });
  }

  function closePasswordEdit() {
    resetPasswordVisibility();
    setPasswordForm({
      passwordActual: "",
      passwordNueva: "",
      confirmPassword: "",
      step: "view",
    });
  }

  async function cargarPerfil() {
    if (!sessionUserId) return;

    setCargando(true);
    setError("");
    try {
      const data = await obtenerPerfil();
      setPerfil(data);
      setForm({
        nombre: data?.nombre || "",
        correo: data?.correo || "",
        fotoPerfilUrl: data?.fotoPerfilUrl || "",
        fotoBannerUrl: data?.fotoBannerUrl || "",
        fotoPerfilPosicion: data?.fotoPerfilPosicion || "",
        fotoBannerPosicion: data?.fotoBannerPosicion || "",
      });
      applyPerfilToSession(data);
    } catch (err) {
      setError(sanitizeUserFacingError(err.message || "No se pudo cargar el perfil."));
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    if (!sessionUserId) {
      setCargando(false);
      setError("Inicie sesi\u00f3n para ver su perfil.");
      return;
    }

    cargarPerfil();
  }, [sessionUserId]);

  useEffect(() => {
    if (!mensaje) return undefined;

    const timer = window.setTimeout(() => setMensaje(""), FEEDBACK_AUTO_HIDE_MS);
    return () => window.clearTimeout(timer);
  }, [mensaje]);

  const bannerSrc = form.fotoBannerUrl
    ? normalizeImageUrl(form.fotoBannerUrl, { width: 1200 })
    : null;
  const avatarSrc = form.fotoPerfilUrl
    ? normalizeImageUrl(form.fotoPerfilUrl, { width: 320 })
    : null;
  const inicialAvatar = inicialDeNombre(form.nombre || sessionUser?.name || sessionUser?.username);

  useEffect(() => {
    setAvatarRoto(false);
  }, [avatarSrc]);

  function syncSession(actualizado) {
    applyPerfilToSession(actualizado);
  }

  async function handleGuardarNombre(event) {
    event.preventDefault();
    setError("");
    setMensaje("");
    setNombreError("");
    setGuardando(true);

    const nombre = nombreForm.nombre.trim();
    const nombreValidation = validateNombreUsuario(nombre);
    if (nombreValidation) {
      setNombreError(nombreValidation);
      setGuardando(false);
      return;
    }

    try {
      const actualizado = await actualizarPerfil({
        nombre,
        fotoPerfilUrl: form.fotoPerfilUrl.trim() || null,
        fotoBannerUrl: form.fotoBannerUrl.trim() || null,
        fotoPerfilPosicion: form.fotoPerfilPosicion || null,
        fotoBannerPosicion: form.fotoBannerPosicion || null,
      });
      setPerfil(actualizado);
      setForm((prev) => ({
        ...prev,
        nombre: actualizado.nombre,
        fotoPerfilUrl: actualizado.fotoPerfilUrl || "",
        fotoBannerUrl: actualizado.fotoBannerUrl || "",
        fotoPerfilPosicion: actualizado.fotoPerfilPosicion || "",
        fotoBannerPosicion: actualizado.fotoBannerPosicion || "",
      }));
      syncSession(actualizado);
      setNombreForm({ nombre: actualizado.nombre, step: "view" });
      setMensaje("Nombre actualizado correctamente.");
    } catch (err) {
      setNombreError(sanitizeUserFacingError(err.message || "No se pudo guardar el nombre."));
    } finally {
      setGuardando(false);
    }
  }

  async function handleGuardarImagen() {
    if (!imageModal) return;
    setError("");
    setMensaje("");
    setGuardando(true);

    const field = imageModal === "avatar" ? "fotoPerfilUrl" : "fotoBannerUrl";
    const nextForm = {
      ...form,
      [field]: imageDraft.trim(),
    };

    try {
      const actualizado = await actualizarPerfil({
        nombre: nextForm.nombre.trim(),
        fotoPerfilUrl: nextForm.fotoPerfilUrl.trim() || null,
        fotoBannerUrl: nextForm.fotoBannerUrl.trim() || null,
        fotoPerfilPosicion: nextForm.fotoPerfilPosicion || null,
        fotoBannerPosicion: nextForm.fotoBannerPosicion || null,
      });
      setPerfil(actualizado);
      setForm({
        nombre: actualizado.nombre,
        correo: actualizado.correo,
        fotoPerfilUrl: actualizado.fotoPerfilUrl || "",
        fotoBannerUrl: actualizado.fotoBannerUrl || "",
        fotoPerfilPosicion: actualizado.fotoPerfilPosicion || "",
        fotoBannerPosicion: actualizado.fotoBannerPosicion || "",
      });
      syncSession(actualizado);
      setImageModal(null);
      setMensaje("Imagen actualizada correctamente.");
    } catch (err) {
      setError(err.message || "No se pudo guardar la imagen.");
    } finally {
      setGuardando(false);
    }
  }

  function openImageModal(type) {
    setImageDraft(type === "avatar" ? form.fotoPerfilUrl : form.fotoBannerUrl);
    setImageModal(type);
  }

  async function handleSolicitarCambioCorreo(event) {
    event.preventDefault();
    setError("");
    setMensaje("");
    setEmailErrors({ nuevoCorreo: "", passwordActual: "", token: "", formulario: "" });

    const nuevoCorreo = emailForm.nuevoCorreo.trim().toLowerCase();
    if (!nuevoCorreo) {
      setEmailErrors((prev) => ({ ...prev, nuevoCorreo: "Ingrese el nuevo correo." }));
      return;
    }
    if (!emailForm.passwordActual) {
      setEmailErrors((prev) => ({ ...prev, passwordActual: "Ingrese su contrase\u00f1a actual." }));
      return;
    }

    setGuardando(true);
    try {
      const result = await solicitarCambioCorreo(nuevoCorreo, emailForm.passwordActual);
      setEmailForm((prev) => ({ ...prev, step: "verify", passwordActual: "" }));
      setShowPasswords((prev) => ({ ...prev, email: false }));
      setMensaje(result?.message || "Se envi\u00f3 el c\u00f3digo al nuevo correo.");
    } catch (err) {
      const message = sanitizeUserFacingError(err.message || "No se pudo solicitar el cambio de correo.");
      if (message.toLowerCase().includes("contrase\u00f1a")) {
        setEmailErrors((prev) => ({ ...prev, passwordActual: message }));
      } else {
        setEmailErrors((prev) => ({ ...prev, formulario: message }));
      }
    } finally {
      setGuardando(false);
    }
  }

  async function handleConfirmarCambioCorreo(event) {
    event.preventDefault();
    setError("");
    setMensaje("");
    setEmailErrors({ nuevoCorreo: "", passwordActual: "", token: "", formulario: "" });

    const nuevoCorreo = emailForm.nuevoCorreo.trim().toLowerCase();
    if (!nuevoCorreo || !emailForm.token.trim()) {
      setEmailErrors((prev) => ({
        ...prev,
        token: !emailForm.token.trim() ? "Ingrese el c\u00f3digo recibido." : "",
        nuevoCorreo: !nuevoCorreo ? "Ingrese el nuevo correo." : "",
      }));
      return;
    }

    setGuardando(true);
    try {
      const actualizado = await confirmarCambioCorreo({
        nuevoCorreo,
        token: emailForm.token.trim(),
      });
      setPerfil(actualizado);
      setForm((prev) => ({ ...prev, correo: actualizado.correo }));
      syncSession(actualizado);
      setEmailForm({ nuevoCorreo: "", token: "", passwordActual: "", step: "view" });
      setMensaje("Correo actualizado correctamente.");
    } catch (err) {
      const message = sanitizeUserFacingError(err.message || "No se pudo confirmar el cambio de correo.");
      if (message.toLowerCase().includes("c\u00f3digo")) {
        setEmailErrors((prev) => ({ ...prev, token: message }));
      } else {
        setEmailErrors((prev) => ({ ...prev, formulario: message }));
      }
    } finally {
      setGuardando(false);
    }
  }

  async function handleCambiarPassword(event) {
    event.preventDefault();
    setError("");
    setMensaje("");
    setPasswordErrors({ passwordActual: "", passwordNueva: "", confirmPassword: "" });

    const nextErrors = {
      passwordActual: passwordForm.passwordActual ? "" : "Ingrese su contrase\u00f1a actual.",
      passwordNueva: validatePassword(passwordForm.passwordNueva),
      confirmPassword: "",
    };

    if (passwordForm.passwordNueva && passwordForm.passwordNueva !== passwordForm.confirmPassword) {
      nextErrors.confirmPassword = "Las contrase\u00f1as nuevas no coinciden.";
    }

    if (nextErrors.passwordActual || nextErrors.passwordNueva || nextErrors.confirmPassword) {
      setPasswordErrors(nextErrors);
      return;
    }

    setGuardando(true);
    try {
      const result = await cambiarPasswordPerfil({
        passwordActual: passwordForm.passwordActual,
        passwordNueva: passwordForm.passwordNueva,
      });
      setPasswordForm({ passwordActual: "", passwordNueva: "", confirmPassword: "", step: "view" });
      resetPasswordVisibility();
      setMensaje(result?.message || "Contrase\u00f1a actualizada correctamente.");
    } catch (err) {
      setPasswordErrors((prev) => ({
        ...prev,
        passwordNueva: sanitizeUserFacingError(err.message || "No se pudo cambiar la contrase\u00f1a."),
      }));
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <div className={`perfil-page perfil-page--${variant}`}>
        <PageLoading message={tCargandoPerfil} />
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className={`perfil-page perfil-page--${variant}`}>
        <PageLoading
          isError
          message={tErrorCarga}
          detail={contactSupportMessage()}
          onRetry={sessionUserId ? cargarPerfil : undefined}
        />
      </div>
    );
  }

  return (
    <div className={`perfil-page perfil-page--${variant}`}>
      <section className="perfil-hero">
        <button
          type="button"
          className="perfil-hero__banner-btn"
          onClick={() => openImageModal("banner")}
          aria-label={tCambiarBanner}
        >
          {bannerSrc ? (
          <img
            src={bannerSrc}
            alt=""
            className="perfil-hero__banner"
            width={1600}
            height={420}
            decoding="async"
            fetchPriority="high"
          />
          ) : (
          <div className="perfil-hero__banner perfil-hero__banner--placeholder" aria-hidden="true" />
          )}
          <span className="perfil-hero__change">
            <Camera size={18} />
            {tCambiarBanner}
          </span>
        </button>
        <div className="perfil-hero__overlay" />
        <div className="perfil-hero__content">
          <button
            type="button"
            className="perfil-hero__avatar-btn"
            onClick={(e) => {
              e.stopPropagation();
              openImageModal("avatar");
            }}
            aria-label={tCambiarFoto}
          >
            {avatarSrc && !avatarRoto ? (
              <img
                src={avatarSrc}
                alt=""
                className="perfil-hero__avatar"
                width={160}
                height={160}
                decoding="async"
                onError={() => setAvatarRoto(true)}
              />
            ) : (
              <div className="perfil-hero__avatar perfil-hero__avatar--placeholder" aria-hidden="true">
                <span className="perfil-hero__avatar-inicial">{inicialAvatar}</span>
              </div>
            )}
            <span className="perfil-hero__avatar-change">
              <Camera size={16} />
            </span>
          </button>
          <div className="perfil-hero__info">
            <h1>{form.nombre || tMiPerfil}</h1>
            <p className="perfil-hero__email">
              <Mail size={16} />
              {form.correo}
            </p>
            {Array.isArray(perfil?.roles) && perfil.roles.length > 0 ? (
              <div className="perfil-hero__roles">
                {perfil.roles.map((rol) => (
                  <span key={rol} className={`perfil-hero__role ${claseRolPerfil(rol)}`}>{rol}</span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {variant === "standalone" ? (
        <section className="perfil-card" style={{ marginBottom: "1rem" }}>
          <header className="perfil-card__header">
            <UserRound size={18} />
            <h2>{tCompras}</h2>
          </header>
          <p className="perfil-card__current-value">{tRevisaPedidos}</p>
          <Link to="/perfil/compras" className="perfil-link-action">
            {tVerHistorial}
            <ChevronRight size={16} />
          </Link>
        </section>
      ) : null}

      <div className="perfil-grid">
        <section className="perfil-card">
          <header className="perfil-card__header">
            <UserRound size={18} />
            <h2>{tInfoPersonal}</h2>
          </header>

          <p className="perfil-card__current-value">{form.nombre || tSinNombre}</p>

          {nombreForm.step === "view" ? (
            <button
              type="button"
              className="perfil-link-action"
              onClick={() => {
                setNombreError("");
                setNombreForm({ nombre: form.nombre, step: "edit" });
              }}
            >
              {tCambiarNombre}
              <ChevronRight size={16} />
            </button>
          ) : (
            <form onSubmit={handleGuardarNombre}>
              <label className="perfil-field">
                <span>{tNuevoNombre}</span>
                <input
                  value={nombreForm.nombre}
                  onChange={(e) => {
                    setNombreError("");
                    setNombreForm((prev) => ({ ...prev, nombre: e.target.value }));
                  }}
                  maxLength={MAX_NOMBRE_USUARIO}
                  className={nombreError ? "input-error" : ""}
                  required
                  autoFocus
                />
                {nombreError ? <p className="perfil-field-error"><ST>{nombreError}</ST></p> : null}
              </label>

              <div className="perfil-card__actions">
                <button type="submit" className="perfil-button" disabled={guardando}>
                  {guardando ? tGuardando : tGuardarNombre}
                </button>
                <button
                  type="button"
                  className="perfil-button perfil-button--ghost"
                  onClick={() => setNombreForm({ nombre: form.nombre, step: "view" })}
                >
                  {tCancelar}
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="perfil-card">
          <header className="perfil-card__header">
            <Mail size={18} />
            <h2>{tCorreoElectronico}</h2>
          </header>

          <p className="perfil-card__current-value">{form.correo}</p>

          {emailForm.step === "view" ? (
            <button
              type="button"
              className="perfil-link-action"
              onClick={() => {
                setEmailErrors({ nuevoCorreo: "", passwordActual: "", token: "", formulario: "" });
                setEmailForm((prev) => ({ ...prev, step: "edit" }));
              }}
            >
              {tCambiarCorreo}
              <ChevronRight size={16} />
            </button>
          ) : (
            <form onSubmit={emailForm.step === "edit" ? handleSolicitarCambioCorreo : handleConfirmarCambioCorreo}>
              <label className="perfil-field">
                <span>{tNuevoCorreo}</span>
                <input
                  type="email"
                  value={emailForm.nuevoCorreo}
                  onChange={(e) => {
                    setEmailErrors((prev) => ({ ...prev, nuevoCorreo: "", formulario: "" }));
                    setEmailForm((prev) => ({ ...prev, nuevoCorreo: e.target.value }));
                  }}
                  className={emailErrors.nuevoCorreo ? "input-error" : ""}
                  required
                  disabled={emailForm.step === "verify"}
                  autoFocus={emailForm.step === "edit"}
                />
                {emailErrors.nuevoCorreo ? <p className="perfil-field-error"><ST>{emailErrors.nuevoCorreo}</ST></p> : null}
              </label>

              {emailForm.step === "edit" ? (
                <PerfilPasswordField
                  label={"Contrase\u00f1a actual"}
                  value={emailForm.passwordActual}
                  onChange={(e) => {
                    setEmailErrors((prev) => ({ ...prev, passwordActual: "", formulario: "" }));
                    setEmailForm((prev) => ({
                      ...prev,
                      passwordActual: e.target.value.slice(0, MAX_PASSWORD),
                    }));
                  }}
                  visible={showPasswords.email}
                  onToggle={() => setShowPasswords((prev) => ({ ...prev, email: !prev.email }))}
                  error={emailErrors.passwordActual}
                />
              ) : null}

              {emailForm.step === "verify" ? (
                <label className="perfil-field">
                  <span>{tCodigoVerif}</span>
                  <input
                    value={emailForm.token}
                    onChange={(e) => {
                      setEmailErrors((prev) => ({ ...prev, token: "", formulario: "" }));
                      setEmailForm((prev) => ({ ...prev, token: e.target.value }));
                    }}
                    className={emailErrors.token ? "input-error" : ""}
                    placeholder={tSeisDigitos}
                    required
                    autoFocus
                  />
                  {emailErrors.token ? <p className="perfil-field-error"><ST>{emailErrors.token}</ST></p> : null}
                </label>
              ) : null}

              {emailErrors.formulario ? <p className="perfil-field-error"><ST>{emailErrors.formulario}</ST></p> : null}

              <div className="perfil-card__actions">
                <button type="submit" className="perfil-button" disabled={guardando}>
                  {guardando
                    ? tProcesando
                    : emailForm.step === "edit"
                      ? tEnviarCodigo
                      : tConfirmarCorreo}
                </button>
                <button
                  type="button"
                  className="perfil-button perfil-button--ghost"
                  onClick={() => {
                    setEmailErrors({ nuevoCorreo: "", passwordActual: "", token: "", formulario: "" });
                    setEmailForm({ nuevoCorreo: "", token: "", passwordActual: "", step: "view" });
                    setShowPasswords((prev) => ({ ...prev, email: false }));
                  }}
                >
                  {tCancelar}
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="perfil-card perfil-card--wide">
          <header className="perfil-card__header">
            <KeyRound size={18} />
            <h2>{tSeguridad}</h2>
          </header>

          <p className="perfil-card__current-value perfil-card__current-value--masked">••••••••</p>

          {passwordForm.step === "view" ? (
            <button type="button" className="perfil-link-action" onClick={openPasswordEdit}>{tCambiarPass}<ChevronRight size={16} />
            </button>
          ) : (
            <form className="perfil-password-form" onSubmit={handleCambiarPassword}>
              <div className="perfil-password-form__fields">
                <PerfilPasswordField
                  label={"Contrase\u00f1a actual"}
                  value={passwordForm.passwordActual}
                  onChange={(e) => {
                    setPasswordErrors((prev) => ({ ...prev, passwordActual: "" }));
                    setPasswordForm((prev) => ({ ...prev, passwordActual: e.target.value }));
                  }}
                  visible={showPasswords.actual}
                  onToggle={() => setShowPasswords((prev) => ({ ...prev, actual: !prev.actual }))}
                  autoFocus
                  error={passwordErrors.passwordActual}
                />

                <PerfilPasswordField
                  label={"Contrase\u00f1a nueva"}
                  value={passwordForm.passwordNueva}
                  onChange={(e) => {
                    setPasswordErrors((prev) => ({ ...prev, passwordNueva: "" }));
                    setPasswordForm((prev) => ({ ...prev, passwordNueva: e.target.value }));
                  }}
                  visible={showPasswords.nueva}
                  onToggle={() => setShowPasswords((prev) => ({ ...prev, nueva: !prev.nueva }))}
                  error={passwordErrors.passwordNueva}
                />

                <PerfilPasswordField
                  label={"Confirmar contrase\u00f1a nueva"}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => {
                    setPasswordErrors((prev) => ({ ...prev, confirmPassword: "" }));
                    setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }));
                  }}
                  visible={showPasswords.confirm}
                  onToggle={() => setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))}
                  error={passwordErrors.confirmPassword}
                />
              </div>

              <div className="perfil-card__actions perfil-card__actions--wide">
                <button type="submit" className="perfil-button" disabled={guardando}>
                  {guardando ? tActualizando : tActualizarPass}
                </button>
                <button type="button" className="perfil-button perfil-button--ghost" onClick={closePasswordEdit}>
                  {tCancelar}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>

      {mensaje ? <p className="perfil-feedback perfil-feedback--ok">{tMensaje}</p> : null}
      {error && perfil ? <p className="perfil-feedback perfil-feedback--error"><ST>{error}</ST></p> : null}

      {variant === "standalone" ? (
        <p className="perfil-back-admin">
          <Link to="/">{tVolverInicio}</Link>
        </p>
      ) : null}

      <ImageUrlModal
        open={Boolean(imageModal)}
        type={imageModal}
        variant={variant}
        value={imageDraft}
        onChange={setImageDraft}
        onClose={() => setImageModal(null)}
        onSave={handleGuardarImagen}
        saving={guardando}
      />
    </div>
  );
}

export default PerfilContent;
