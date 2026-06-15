import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Camera, ChevronRight, Eye, EyeOff, KeyRound, Mail, Move, UserRound, X } from "lucide-react";
import {
  actualizarPerfil,
  cambiarPasswordPerfil,
  confirmarCambioCorreo,
  obtenerPerfil,
  solicitarCambioCorreo,
} from "../../services/perfilService";
import { applyPerfilToSession, getActiveSessionUser } from "../../services/sessionService";
import { formatImagePosition, getImageObjectPosition, normalizeImageUrl, parseImagePosition } from "../../lib/imageUtils";
import "./PerfilContent.css";

const DEFAULT_BANNER =
  "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1600&q=80";

const FEEDBACK_AUTO_HIDE_MS = 4000;

function PerfilPasswordField({ label, value, onChange, visible, onToggle, autoFocus = false }) {
  const Icon = visible ? Eye : EyeOff;

  return (
    <label className="perfil-field perfil-password-field">
      <span>{label}</span>
      <div className="perfil-password-field__input-wrap">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          required
          autoFocus={autoFocus}
        />
        <button
          type="button"
          className="perfil-password-field__toggle"
          onClick={onToggle}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          <Icon size={18} aria-hidden="true" />
        </button>
      </div>
    </label>
  );
}

function ImageUrlModal({
  open,
  type,
  variant,
  value,
  position,
  onChange,
  onPositionChange,
  onClose,
  onSave,
  saving,
}) {
  const previewRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!dragging) return undefined;

    function updateFromPointer(clientX, clientY) {
      const frame = previewRef.current;
      if (!frame) return;

      const rect = frame.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;
      onPositionChange({
        x: Math.min(100, Math.max(0, x)),
        y: Math.min(100, Math.max(0, y)),
      });
    }

    function handleMouseMove(event) {
      updateFromPointer(event.clientX, event.clientY);
    }

    function handleTouchMove(event) {
      if (!event.touches[0]) return;
      event.preventDefault();
      updateFromPointer(event.touches[0].clientX, event.touches[0].clientY);
    }

    function stopDragging() {
      setDragging(false);
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopDragging);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", stopDragging);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopDragging);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", stopDragging);
    };
  }, [dragging, onPositionChange]);

  if (!open) return null;

  const isAvatar = type === "avatar";
  const isAdmin = variant === "admin";
  const preview = value ? normalizeImageUrl(value, { width: isAvatar ? 320 : 1600 }) : "";
  const objectPosition = formatImagePosition(position);
  const previewLabel = isAvatar
    ? `Vista previa (${isAdmin ? "96×96" : "112×112"} px)`
    : `Vista previa (${isAdmin ? "220" : "280"} px de alto)`;

  function startDragging(event) {
    if (!preview) return;
    setDragging(true);

    const point = "touches" in event ? event.touches[0] : event;
    const frame = previewRef.current;
    if (!frame || !point) return;

    const rect = frame.getBoundingClientRect();
    const x = ((point.clientX - rect.left) / rect.width) * 100;
    const y = ((point.clientY - rect.top) / rect.height) * 100;
    onPositionChange({
      x: Math.min(100, Math.max(0, x)),
      y: Math.min(100, Math.max(0, y)),
    });
  }

  return (
    <div className="perfil-modal" role="dialog" aria-modal="true">
      <button type="button" className="perfil-modal__backdrop" aria-label="Cerrar" onClick={onClose} />
      <div className={`perfil-modal__card perfil-modal__card--image ${isAvatar ? "perfil-modal__card--avatar" : "perfil-modal__card--banner"}`}>
        <header className="perfil-modal__header">
          <h3>{isAvatar ? "Cambiar foto de perfil" : "Cambiar banner"}</h3>
          <button type="button" className="perfil-modal__close" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </header>

        <label className="perfil-field">
          <span>URL de la imagen</span>
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
              ref={previewRef}
              className={[
                "perfil-modal__preview-frame",
                isAvatar ? "perfil-modal__preview-frame--avatar" : "perfil-modal__preview-frame--banner",
                isAdmin ? "perfil-modal__preview-frame--admin" : "",
                dragging ? "is-dragging" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onMouseDown={startDragging}
              onTouchStart={startDragging}
              role="presentation"
            >
              <img
                src={preview}
                alt="Vista previa"
                className="perfil-modal__preview-img"
                style={{ objectPosition }}
                draggable={false}
              />
              <span className="perfil-modal__preview-hint">
                <Move size={14} aria-hidden="true" />
                Arrastra para acomodar
              </span>
            </div>

            <div className="perfil-modal__position-controls">
              <label className="perfil-field">
                <span>Posición horizontal ({Math.round(position.x)}%)</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={position.x}
                  onChange={(e) => onPositionChange({ ...position, x: Number(e.target.value) })}
                />
              </label>
              <label className="perfil-field">
                <span>Posición vertical ({Math.round(position.y)}%)</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={position.y}
                  onChange={(e) => onPositionChange({ ...position, y: Number(e.target.value) })}
                />
              </label>
            </div>
          </div>
        ) : (
          <p className="perfil-modal__empty-preview">Pega un enlace para ver la vista previa al tamaño real.</p>
        )}

        <div className="perfil-modal__actions">
          <button type="button" className="perfil-button perfil-button--ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="perfil-button" onClick={onSave} disabled={saving || !value.trim()}>
            {saving ? "Guardando..." : "Guardar imagen"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PerfilContent({ variant = "standalone" }) {
  const sessionUser = getActiveSessionUser();
  const sessionUserId = Number(sessionUser?.id) || null;
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [imageModal, setImageModal] = useState(null);
  const [imageDraft, setImageDraft] = useState("");
  const [imagePositionDraft, setImagePositionDraft] = useState({ x: 50, y: 50 });
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
  const [emailForm, setEmailForm] = useState({
    nuevoCorreo: "",
    token: "",
    step: "view",
  });
  const [showPasswords, setShowPasswords] = useState({
    actual: false,
    nueva: false,
    confirm: false,
  });

  function resetPasswordVisibility() {
    setShowPasswords({ actual: false, nueva: false, confirm: false });
  }

  function openPasswordEdit() {
    resetPasswordVisibility();
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
      setError(err.message || "No se pudo cargar el perfil.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    if (!sessionUserId) {
      setCargando(false);
      setError("Inicie sesión para ver su perfil.");
      return;
    }

    setForm((prev) => ({
      ...prev,
      nombre: sessionUser?.name || sessionUser?.username || prev.nombre,
      correo: sessionUser?.email || sessionUser?.correo || prev.correo,
      fotoPerfilUrl: sessionUser?.fotoPerfilUrl || prev.fotoPerfilUrl,
      fotoBannerUrl: sessionUser?.fotoBannerUrl || prev.fotoBannerUrl,
      fotoPerfilPosicion: sessionUser?.fotoPerfilPosicion || prev.fotoPerfilPosicion,
      fotoBannerPosicion: sessionUser?.fotoBannerPosicion || prev.fotoBannerPosicion,
    }));

    cargarPerfil();
  }, [sessionUserId]);

  useEffect(() => {
    if (!mensaje) return undefined;

    const timer = window.setTimeout(() => setMensaje(""), FEEDBACK_AUTO_HIDE_MS);
    return () => window.clearTimeout(timer);
  }, [mensaje]);

  const bannerSrc = normalizeImageUrl(form.fotoBannerUrl || DEFAULT_BANNER, { width: 1600 });
  const avatarSrc = form.fotoPerfilUrl
    ? normalizeImageUrl(form.fotoPerfilUrl, { width: 320 })
    : null;

  const bannerPosition = getImageObjectPosition(form.fotoBannerPosicion);
  const avatarPosition = getImageObjectPosition(form.fotoPerfilPosicion);

  function syncSession(actualizado) {
    applyPerfilToSession(actualizado);
  }

  async function handleGuardarNombre(event) {
    event.preventDefault();
    setError("");
    setMensaje("");
    setGuardando(true);

    const nombre = nombreForm.nombre.trim();
    if (!nombre) {
      setError("Ingrese un nombre válido.");
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
      setError(err.message || "No se pudo guardar el perfil.");
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
    const positionField = imageModal === "avatar" ? "fotoPerfilPosicion" : "fotoBannerPosicion";
    const nextForm = {
      ...form,
      [field]: imageDraft.trim(),
      [positionField]: formatImagePosition(imagePositionDraft),
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
    if (type === "avatar") {
      setImageDraft(form.fotoPerfilUrl);
      setImagePositionDraft(parseImagePosition(form.fotoPerfilPosicion));
    } else {
      setImageDraft(form.fotoBannerUrl);
      setImagePositionDraft(parseImagePosition(form.fotoBannerPosicion));
    }
    setImageModal(type);
  }

  async function handleSolicitarCambioCorreo(event) {
    event.preventDefault();
    setError("");
    setMensaje("");

    const nuevoCorreo = emailForm.nuevoCorreo.trim().toLowerCase();
    if (!nuevoCorreo) {
      setError("Ingrese el nuevo correo.");
      return;
    }

    setGuardando(true);
    try {
      const result = await solicitarCambioCorreo(nuevoCorreo);
      setEmailForm((prev) => ({ ...prev, step: "verify" }));
      setMensaje(result?.message || "Se envió el código al nuevo correo.");
    } catch (err) {
      setError(err.message || "No se pudo solicitar el cambio de correo.");
    } finally {
      setGuardando(false);
    }
  }

  async function handleConfirmarCambioCorreo(event) {
    event.preventDefault();
    setError("");
    setMensaje("");

    const nuevoCorreo = emailForm.nuevoCorreo.trim().toLowerCase();
    if (!nuevoCorreo || !emailForm.token.trim()) {
      setError("Ingrese el nuevo correo y el código recibido.");
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
      setEmailForm({ nuevoCorreo: "", token: "", step: "view" });
      setMensaje("Correo actualizado correctamente.");
    } catch (err) {
      setError(err.message || "No se pudo confirmar el cambio de correo.");
    } finally {
      setGuardando(false);
    }
  }

  async function handleCambiarPassword(event) {
    event.preventDefault();
    setError("");
    setMensaje("");

    if (!passwordForm.passwordActual || !passwordForm.passwordNueva) {
      setError("Complete la contraseña actual y la nueva.");
      return;
    }
    if (passwordForm.passwordNueva.length < 6) {
      setError("La contraseña nueva debe tener al menos 6 caracteres.");
      return;
    }
    if (passwordForm.passwordNueva !== passwordForm.confirmPassword) {
      setError("Las contraseñas nuevas no coinciden.");
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
      setMensaje(result?.message || "Contraseña actualizada correctamente.");
    } catch (err) {
      setError(err.message || "No se pudo cambiar la contraseña.");
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <div className={`perfil-page perfil-page--loading perfil-page--${variant}`}>
        <span className="perfil-page__spinner" aria-hidden="true" />
        <p>Cargando perfil...</p>
      </div>
    );
  }

  if (error && !perfil && !form.nombre && !form.correo) {
    return (
      <div className={`perfil-page perfil-page--error perfil-page--${variant}`}>
        <p className="perfil-feedback perfil-feedback--error">{error}</p>
        <button type="button" className="perfil-button" onClick={cargarPerfil}>
          Reintentar
        </button>
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
          aria-label="Cambiar banner"
        >
          <img
            src={bannerSrc}
            alt=""
            className="perfil-hero__banner"
            style={{ objectPosition: bannerPosition }}
          />
          <span className="perfil-hero__change">
            <Camera size={18} />
            Cambiar banner
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
            aria-label="Cambiar foto de perfil"
          >
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt=""
                className="perfil-hero__avatar"
                style={{ objectPosition: avatarPosition }}
              />
            ) : (
              <div className="perfil-hero__avatar perfil-hero__avatar--placeholder">
                <UserRound size={42} />
              </div>
            )}
            <span className="perfil-hero__avatar-change">
              <Camera size={16} />
            </span>
          </button>
          <div className="perfil-hero__info">
            <h1>{form.nombre || "Mi perfil"}</h1>
            <p className="perfil-hero__email">
              <Mail size={16} />
              {form.correo}
            </p>
            {Array.isArray(perfil?.roles) && perfil.roles.length > 0 ? (
              <div className="perfil-hero__roles">
                {perfil.roles.map((rol) => (
                  <span key={rol} className="perfil-hero__role">{rol}</span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <div className="perfil-grid">
        <section className="perfil-card">
          <header className="perfil-card__header">
            <UserRound size={18} />
            <h2>Información personal</h2>
          </header>

          <p className="perfil-card__current-value">{form.nombre || "Sin nombre"}</p>

          {nombreForm.step === "view" ? (
            <button
              type="button"
              className="perfil-link-action"
              onClick={() => setNombreForm({ nombre: form.nombre, step: "edit" })}
            >
              Cambiar nombre
              <ChevronRight size={16} />
            </button>
          ) : (
            <form onSubmit={handleGuardarNombre}>
              <label className="perfil-field">
                <span>Nuevo nombre</span>
                <input
                  value={nombreForm.nombre}
                  onChange={(e) => setNombreForm((prev) => ({ ...prev, nombre: e.target.value }))}
                  required
                  autoFocus
                />
              </label>

              <div className="perfil-card__actions">
                <button
                  type="button"
                  className="perfil-button perfil-button--ghost"
                  onClick={() => setNombreForm({ nombre: form.nombre, step: "view" })}
                >
                  Cancelar
                </button>
                <button type="submit" className="perfil-button" disabled={guardando}>
                  {guardando ? "Guardando..." : "Guardar nombre"}
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="perfil-card">
          <header className="perfil-card__header">
            <Mail size={18} />
            <h2>Correo electrónico</h2>
          </header>

          <p className="perfil-card__current-value">{form.correo}</p>

          {emailForm.step === "view" ? (
            <button
              type="button"
              className="perfil-link-action"
              onClick={() => setEmailForm((prev) => ({ ...prev, step: "edit" }))}
            >
              Cambiar correo
              <ChevronRight size={16} />
            </button>
          ) : (
            <form onSubmit={emailForm.step === "edit" ? handleSolicitarCambioCorreo : handleConfirmarCambioCorreo}>
              <label className="perfil-field">
                <span>Nuevo correo</span>
                <input
                  type="email"
                  value={emailForm.nuevoCorreo}
                  onChange={(e) => setEmailForm((prev) => ({ ...prev, nuevoCorreo: e.target.value }))}
                  required
                  disabled={emailForm.step === "verify"}
                  autoFocus={emailForm.step === "edit"}
                />
              </label>

              {emailForm.step === "verify" ? (
                <label className="perfil-field">
                  <span>Código de verificación</span>
                  <input
                    value={emailForm.token}
                    onChange={(e) => setEmailForm((prev) => ({ ...prev, token: e.target.value }))}
                    placeholder="6 dígitos"
                    required
                    autoFocus
                  />
                </label>
              ) : null}

              <div className="perfil-card__actions">
                <button
                  type="button"
                  className="perfil-button perfil-button--ghost"
                  onClick={() => setEmailForm({ nuevoCorreo: "", token: "", step: "view" })}
                >
                  Cancelar
                </button>
                <button type="submit" className="perfil-button" disabled={guardando}>
                  {guardando
                    ? "Procesando..."
                    : emailForm.step === "edit"
                      ? "Enviar código"
                      : "Confirmar correo"}
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="perfil-card perfil-card--wide">
          <header className="perfil-card__header">
            <KeyRound size={18} />
            <h2>Seguridad</h2>
          </header>

          <p className="perfil-card__current-value perfil-card__current-value--masked">••••••••</p>

          {passwordForm.step === "view" ? (
            <button type="button" className="perfil-link-action" onClick={openPasswordEdit}>
              Cambiar contraseña
              <ChevronRight size={16} />
            </button>
          ) : (
            <form className="perfil-password-form" onSubmit={handleCambiarPassword}>
              <div className="perfil-password-form__fields">
                <PerfilPasswordField
                  label="Contraseña actual"
                  value={passwordForm.passwordActual}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, passwordActual: e.target.value }))}
                  visible={showPasswords.actual}
                  onToggle={() => setShowPasswords((prev) => ({ ...prev, actual: !prev.actual }))}
                  autoFocus
                />

                <PerfilPasswordField
                  label="Contraseña nueva"
                  value={passwordForm.passwordNueva}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, passwordNueva: e.target.value }))}
                  visible={showPasswords.nueva}
                  onToggle={() => setShowPasswords((prev) => ({ ...prev, nueva: !prev.nueva }))}
                />

                <PerfilPasswordField
                  label="Confirmar contraseña nueva"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  visible={showPasswords.confirm}
                  onToggle={() => setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))}
                />
              </div>

              <div className="perfil-card__actions perfil-card__actions--wide">
                <button type="button" className="perfil-button perfil-button--ghost" onClick={closePasswordEdit}>
                  Cancelar
                </button>
                <button type="submit" className="perfil-button perfil-button--secondary" disabled={guardando}>
                  {guardando ? "Actualizando..." : "Actualizar contraseña"}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>

      {mensaje ? <p className="perfil-feedback perfil-feedback--ok">{mensaje}</p> : null}
      {error && perfil ? <p className="perfil-feedback perfil-feedback--error">{error}</p> : null}

      {variant === "standalone" ? (
        <p className="perfil-back-admin">
          <Link to="/">Volver al inicio</Link>
        </p>
      ) : null}

      <ImageUrlModal
        open={Boolean(imageModal)}
        type={imageModal}
        variant={variant}
        value={imageDraft}
        position={imagePositionDraft}
        onChange={setImageDraft}
        onPositionChange={setImagePositionDraft}
        onClose={() => setImageModal(null)}
        onSave={handleGuardarImagen}
        saving={guardando}
      />
    </div>
  );
}

export default PerfilContent;
