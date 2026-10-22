import { X } from "lucide-react";
import { useTraducir } from "../../hooks/useTraducir";
import { normalizeImageUrl } from "../../lib/imageUtils";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useProfileImage } from "../../hooks/useProfileImage";
import { subirImagenPerfil } from "../../services/perfilService";
import { getStoredUser, isLoggingOut, isSessionExpired, SESSION_UPDATED_EVENT } from "../../services/sessionService";
import { getTokenExpirationMs } from "../../lib/jwt";
import { ImageFilePicker } from "../ui/ImageFilePicker";

function sessionIdentity() {
  const user = getStoredUser();
  return user?.id && user.token && !isLoggingOut() && !isSessionExpired(user)
    ? JSON.stringify([String(user.id), user.token]) : "";
}

function subscribeSession(notify) {
  window.addEventListener("storage", notify);
  window.addEventListener(SESSION_UPDATED_EVENT, notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener(SESSION_UPDATED_EVENT, notify);
  };
}

export function ProfileImageModal({
  open,
  type,
  variant,
  value,
  onChange,
  onClose,
  onSave,
  saving,
  uploader = subirImagenPerfil,
}) {
  const identity = useSyncExternalStore(subscribeSession, sessionIdentity);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const request = useRef(null);
  const generation = useRef(0);
  const initialIdentity = useRef(identity);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  const invalidate = () => {
    generation.current += 1;
    request.current?.abort();
    request.current = null;
  };
  useEffect(() => {
    if (initialIdentity.current !== identity) closeRef.current();
    return invalidate;
  }, [identity, open, type]);
  useEffect(() => {
    const user = getStoredUser();
    const deadlines = [Number(user?.expiresAt), getTokenExpirationMs(user?.token)].filter((time) => Number.isFinite(time) && time > 0);
    if (!open || !deadlines.length) return;
    const timer = window.setTimeout(() => {
      invalidate();
      closeRef.current();
    }, Math.min(Math.max(0, Math.min(...deadlines) - Date.now()), 2_147_483_647));
    return () => window.clearTimeout(timer);
  }, [identity, open]);
  const preview = useProfileImage(value ? normalizeImageUrl(value, { width: type === "avatar" ? 320 : 1600 }) : "");

  async function selectImage(file) {
    if (saving || request.current || !identity) return;
    const supported = ["image/jpeg", "image/png", "image/webp"].includes(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name);
    if (!supported || file.size > 10 * 1024 * 1024) {
      setError("Adjunte una imagen JPG, PNG o WEBP de hasta 10 MB.");
      return;
    }
    const controller = new AbortController();
    const current = ++generation.current;
    request.current = controller;
    setUploading(true);
    setError("");
    try {
      const url = await uploader(file, controller.signal);
      if (!controller.signal.aborted && current === generation.current && identity === sessionIdentity()) onChange(url);
    } catch {
      if (!controller.signal.aborted && current === generation.current) setError("No se pudo cargar la imagen. Intente nuevamente.");
    } finally {
      if (current === generation.current) {
        request.current = null;
        setUploading(false);
      }
    }
  }
  function close() {
    invalidate();
    onClose();
  }
  function save() {
    if (!saving && !request.current && identity && identity === sessionIdentity() && value.trim()) onSave();
  }
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
  const previewLabel = isAvatar
    ? (isAdmin ? tVistaPreviaAvatarAdmin : tVistaPreviaAvatar)
    : (isAdmin ? tVistaPreviaBannerAdmin : tVistaPreviaBanner);

  return (
    <div className="perfil-modal" role="dialog" aria-modal="true">
      <button type="button" className="perfil-modal__backdrop" aria-label={tCerrar} onClick={close} disabled={saving} />
      <div className={`perfil-modal__card perfil-modal__card--image ${isAvatar ? "perfil-modal__card--avatar" : "perfil-modal__card--banner"}`}>
        <header className="perfil-modal__header">
          <h3>{isAvatar ? tCambiarFoto : tCambiarBanner}</h3>
          <button type="button" className="perfil-modal__close" onClick={close} aria-label={tCerrar} disabled={saving}>
            <X size={18} />
          </button>
        </header>

        <label className="perfil-field">
          <span>{tUrlImagen}</span>
          <input
            value={value}
            disabled={uploading || saving}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://..."
            autoFocus
          />
        </label>
        <ImageFilePicker id="profile-image-file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" hint="JPG, PNG o WEBP. Máximo 10 MB." onSelect={selectImage} disabled={uploading || saving || !identity} error={error} />
        {uploading ? <p role="status">Cargando imagen...</p> : null}

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
          <button type="button" className="perfil-button" onClick={save} disabled={saving || uploading || !identity || !value.trim()}>
            {saving ? tGuardando : tGuardarImagen}
          </button>
          <button type="button" className="perfil-button perfil-button--ghost" onClick={close} disabled={saving}>
            {tCancelar}
          </button>
        </div>
      </div>
    </div>
  );
}

