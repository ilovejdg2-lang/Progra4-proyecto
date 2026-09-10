import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Camera, ChevronRight, Eye, EyeOff, HandCoins, IdCard, KeyRound, Mail, UserRound, X } from "lucide-react";
import {
  actualizarPerfil,
  actualizarPerfilCliente,
  cambiarPasswordPerfil,
  clearPerfilCache,
  confirmarCambioCorreo,
  obtenerPerfil,
  solicitarCambioCorreo,
} from "../../services/perfilService";
import { obtenerMisSolicitudesDonacion } from "../../services/donacionesService";
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
import { UiSelect } from "../ui/Select";
import "./PerfilContent.css";

const FEEDBACK_AUTO_HIDE_MS = 4000;

function soloLetras(valor, max = 100) {
  return String(valor ?? "")
    .replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+/g, "")
    .replace(/\s{2,}/g, " ")
    .slice(0, max);
}

function soloDigitos(valor, max) {
  return String(valor ?? "").replace(/\D/g, "").slice(0, max);
}

function soloTelefono(valor) {
  const texto = String(valor ?? "");
  const tieneMas = texto.trimStart().startsWith("+");
  const digitos = texto.replace(/\D/g, "").slice(0, tieneMas ? 14 : 15);
  return tieneMas ? `+${digitos}` : digitos;
}

function formatearCedulaJuridica(valor) {
  const digitos = String(valor ?? "").replace(/\D/g, "").slice(0, 10);
  if (digitos.length <= 1) return digitos;
  if (digitos.length <= 4) return `${digitos.slice(0, 1)}-${digitos.slice(1)}`;
  return `${digitos.slice(0, 1)}-${digitos.slice(1, 4)}-${digitos.slice(4)}`;
}

function inferTipoDocumento(identificacion) {
  const digitos = String(identificacion ?? "").replace(/\D/g, "");
  if (/^\d{9}$/.test(digitos)) return "cedula";
  if (/^\d{10,12}$/.test(digitos)) return "dimex";
  return "pasaporte";
}

function splitApellidos(apellidos) {
  const partes = String(apellidos ?? "").trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return { apellido1: "", apellido2: "" };
  if (partes.length === 1) return { apellido1: partes[0], apellido2: "" };
  return { apellido1: partes[0], apellido2: partes.slice(1).join(" ") };
}

function buildClienteFormFromPerfil(perfil) {
  const apellidos = splitApellidos(perfil?.apellidos);
  const tipoDocumento = perfil?.tipoDocumento || inferTipoDocumento(perfil?.identificacion) || "cedula";
  return {
    esNacional: tipoDocumento === "cedula" ? "si" : "no",
    tipoDocumento: tipoDocumento === "cedula" ? "cedula" : tipoDocumento,
    nombreLegal: perfil?.nombreLegal || "",
    telefono: perfil?.telefono || "",
    apellido1: apellidos.apellido1,
    apellido2: apellidos.apellido2,
    identificacion: perfil?.identificacion || "",
    razonSocial: perfil?.razonSocial || "",
    nombreComercial: perfil?.nombreComercial || "",
    representanteLegal: perfil?.representanteLegal || "",
    cedulaJuridica: perfil?.cedulaJuridica || "",
    direccionFiscal: perfil?.direccionFiscal || "",
    telefonoOficina: perfil?.telefonoOficina || "",
  };
}

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
  const tMisDonaciones = useTraducir("Mis donaciones");
  const tSinDonaciones = useTraducir("Todavía no has enviado solicitudes de donación.");
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
  const tDatosCliente = useTraducir("Datos de cliente");
  const tSinFichaCliente = useTraducir("Todavía no tenés ficha de cliente. Se pide al ir a pagar el carrito.");
  const tGuardarCliente = useTraducir("Guardar datos de cliente");
  const [perfil, setPerfil] = useState(null);
  const [donaciones, setDonaciones] = useState([]);
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
  const [clienteForm, setClienteForm] = useState(buildClienteFormFromPerfil(null));
  const [clienteError, setClienteError] = useState("");
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
    clearPerfilCache();
    try {
      const data = await obtenerPerfil();
      setPerfil(data);
      setClienteForm(buildClienteFormFromPerfil(data));
      setForm({
        nombre: data?.nombre || "",
        correo: data?.correo || "",
        fotoPerfilUrl: data?.fotoPerfilUrl || "",
        fotoBannerUrl: data?.fotoBannerUrl || "",
        fotoPerfilPosicion: data?.fotoPerfilPosicion || "",
        fotoBannerPosicion: data?.fotoBannerPosicion || "",
      });
      applyPerfilToSession(data);
      try {
        setDonaciones(await obtenerMisSolicitudesDonacion());
      } catch {
        setDonaciones([]);
      }
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
  const esCliente = Boolean(perfil?.tipoCliente)
    || (Array.isArray(perfil?.roles)
      && perfil.roles.some((rol) => String(rol).toLowerCase() === "cliente"));

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

  async function handleGuardarCliente(event) {
    event.preventDefault();
    setError("");
    setMensaje("");
    setClienteError("");
    setGuardando(true);

    try {
      const esEmpresa = perfil?.tipoCliente === "empresa";
      const payload = esEmpresa
        ? {
            tipo: "empresa",
            telefono: clienteForm.telefono.trim(),
            razonSocial: clienteForm.razonSocial.trim(),
            nombreComercial: clienteForm.nombreComercial.trim(),
            representanteLegal: clienteForm.representanteLegal.trim(),
            cedulaJuridica: clienteForm.cedulaJuridica.trim(),
            direccionFiscal: clienteForm.direccionFiscal.trim(),
            telefonoOficina: clienteForm.telefonoOficina.trim(),
          }
        : {
            tipo: "persona",
            telefono: clienteForm.telefono.trim(),
            nombre: clienteForm.nombreLegal.trim(),
            apellido1: clienteForm.apellido1.trim(),
            apellido2: clienteForm.apellido2.trim(),
            identificacion: clienteForm.identificacion.trim(),
            esNacional: clienteForm.esNacional,
            tipoDocumento: clienteForm.esNacional === "si" ? "cedula" : clienteForm.tipoDocumento,
          };

      const actualizado = await actualizarPerfilCliente(payload);
      setPerfil(actualizado);
      setClienteForm(buildClienteFormFromPerfil(actualizado));
      setMensaje("Datos de cliente actualizados.");
    } catch (err) {
      setClienteError(sanitizeUserFacingError(err.message || "No se pudieron guardar los datos de cliente."));
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

      {variant === "standalone" ? (
        <section className="perfil-card" style={{ marginBottom: "1rem" }}>
          <header className="perfil-card__header">
            <HandCoins size={18} />
            <h2>{tMisDonaciones}</h2>
          </header>
          {donaciones.length === 0 ? (
            <p className="perfil-card__current-value">{tSinDonaciones}</p>
          ) : (
            <ul className="perfil-donaciones-list">
              {donaciones.map((row) => (
                <li key={row.id}>
                  <strong><ST>{row.necesidadTitulo || row.tipo}</ST></strong>
                  {" · "}
                  <ST>{row.estado}</ST>
                  {row.fechaPropuesta ? ` · ${row.fechaPropuesta}` : ""}
                </li>
              ))}
            </ul>
          )}
          <Link to="/donaciones/solicitar" className="perfil-link-action">
            <ST>Registrar donación</ST>
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

      {esCliente ? (
        <section className="perfil-card perfil-card--wide" style={{ marginTop: "1rem", marginBottom: "1rem" }}>
          <header className="perfil-card__header">
            <IdCard size={18} />
            <h2>{tDatosCliente}</h2>
          </header>
          {perfil?.tipoCliente ? (
            <form className="perfil-cliente-form" onSubmit={handleGuardarCliente}>
              <p className="perfil-card__current-value">
                <ST>{perfil.tipoCliente === "empresa" ? "Empresa" : "Persona"}</ST>
              </p>
              {perfil.tipoCliente === "empresa" ? (
                <>
                  <label className="perfil-field">
                    <span><ST>Razón social</ST></span>
                    <input
                      value={clienteForm.razonSocial}
                      onChange={(e) => setClienteForm((prev) => ({ ...prev, razonSocial: e.target.value.slice(0, 120) }))}
                      maxLength={120}
                      required
                    />
                  </label>
                  <label className="perfil-field">
                    <span><ST>Nombre comercial</ST></span>
                    <input
                      value={clienteForm.nombreComercial}
                      onChange={(e) => setClienteForm((prev) => ({ ...prev, nombreComercial: e.target.value.slice(0, 120) }))}
                      maxLength={120}
                      required
                    />
                  </label>
                  <label className="perfil-field">
                    <span><ST>Cédula jurídica</ST></span>
                    <input
                      value={clienteForm.cedulaJuridica}
                      onChange={(e) => setClienteForm((prev) => ({
                        ...prev,
                        cedulaJuridica: formatearCedulaJuridica(e.target.value),
                      }))}
                      maxLength={12}
                      required
                    />
                  </label>
                  <label className="perfil-field">
                    <span><ST>Representante legal</ST></span>
                    <input
                      value={clienteForm.representanteLegal}
                      onChange={(e) => setClienteForm((prev) => ({
                        ...prev,
                        representanteLegal: soloLetras(e.target.value, 100),
                      }))}
                      maxLength={100}
                      required
                    />
                  </label>
                  <label className="perfil-field">
                    <span><ST>Dirección fiscal</ST></span>
                    <input
                      value={clienteForm.direccionFiscal}
                      onChange={(e) => setClienteForm((prev) => ({ ...prev, direccionFiscal: e.target.value.slice(0, 200) }))}
                      maxLength={200}
                    />
                  </label>
                  <label className="perfil-field">
                    <span><ST>Tel. oficina</ST></span>
                    <input
                      value={clienteForm.telefonoOficina}
                      onChange={(e) => setClienteForm((prev) => ({
                        ...prev,
                        telefonoOficina: soloTelefono(e.target.value),
                      }))}
                      maxLength={15}
                      inputMode="tel"
                    />
                  </label>
                  <label className="perfil-field">
                    <span><ST>Teléfono</ST></span>
                    <input
                      value={clienteForm.telefono}
                      onChange={(e) => setClienteForm((prev) => ({
                        ...prev,
                        telefono: soloTelefono(e.target.value),
                      }))}
                      maxLength={15}
                      inputMode="tel"
                      required
                    />
                  </label>
                </>
              ) : (
                <>
                  <div className="perfil-field">
                    <span className="registro-label"><ST>¿Es extranjero?</ST></span>
                    <div className="registro-radio-row" role="radiogroup" aria-label="¿Es extranjero?">
                      <label className={`registro-radio${clienteForm.esNacional === "no" ? " is-active" : ""}`}>
                        <input
                          type="radio"
                          name="esExtranjeroPerfil"
                          value="si"
                          checked={clienteForm.esNacional === "no"}
                          onChange={() => setClienteForm((prev) => ({
                            ...prev,
                            esNacional: "no",
                            tipoDocumento: prev.tipoDocumento === "cedula" ? "dimex" : prev.tipoDocumento,
                          }))}
                        />
                        <span className="registro-radio__text"><ST>Sí</ST></span>
                      </label>
                      <label className={`registro-radio${clienteForm.esNacional === "si" ? " is-active" : ""}`}>
                        <input
                          type="radio"
                          name="esExtranjeroPerfil"
                          value="no"
                          checked={clienteForm.esNacional === "si"}
                          onChange={() => setClienteForm((prev) => ({
                            ...prev,
                            esNacional: "si",
                            tipoDocumento: "cedula",
                            identificacion: soloDigitos(prev.identificacion, 9),
                          }))}
                        />
                        <span className="registro-radio__text"><ST>No</ST></span>
                      </label>
                    </div>
                  </div>
                  {clienteForm.esNacional === "no" ? (
                    <label className="perfil-field">
                      <span><ST>Tipo de documento</ST></span>
                      <UiSelect
                        value={clienteForm.tipoDocumento === "cedula" ? "dimex" : clienteForm.tipoDocumento}
                        onChange={(valor) => setClienteForm((prev) => ({
                          ...prev,
                          tipoDocumento: valor,
                          identificacion: valor === "pasaporte"
                            ? String(prev.identificacion).replace(/[^A-Za-z0-9]/g, "").slice(0, 20)
                            : soloDigitos(prev.identificacion, 12),
                        }))}
                        options={[
                          { value: "dimex", label: "DIMEX" },
                          { value: "pasaporte", label: "Pasaporte" },
                        ]}
                      />
                    </label>
                  ) : null}
                  <label className="perfil-field">
                    <span><ST>{clienteForm.esNacional === "si" ? "Cédula" : (clienteForm.tipoDocumento === "pasaporte" ? "Pasaporte" : "DIMEX")}</ST></span>
                    <input
                      value={clienteForm.identificacion}
                      onChange={(e) => {
                        const tipo = clienteForm.esNacional === "si" ? "cedula" : clienteForm.tipoDocumento;
                        const valor = tipo === "pasaporte"
                          ? e.target.value.replace(/[^A-Za-z0-9]/g, "").slice(0, 20)
                          : soloDigitos(e.target.value, tipo === "dimex" ? 12 : 9);
                        setClienteForm((prev) => ({ ...prev, identificacion: valor }));
                      }}
                      maxLength={20}
                      required
                    />
                  </label>
                  <label className="perfil-field">
                    <span><ST>Nombre</ST></span>
                    <input
                      value={clienteForm.nombreLegal}
                      onChange={(e) => setClienteForm((prev) => ({
                        ...prev,
                        nombreLegal: soloLetras(e.target.value, 50),
                      }))}
                      maxLength={50}
                      required
                    />
                  </label>
                  <label className="perfil-field">
                    <span><ST>Apellido 1</ST></span>
                    <input
                      value={clienteForm.apellido1}
                      onChange={(e) => setClienteForm((prev) => ({
                        ...prev,
                        apellido1: soloLetras(e.target.value, 40),
                      }))}
                      maxLength={40}
                      required
                    />
                  </label>
                  <label className="perfil-field">
                    <span><ST>Apellido 2</ST></span>
                    <input
                      value={clienteForm.apellido2}
                      onChange={(e) => setClienteForm((prev) => ({
                        ...prev,
                        apellido2: soloLetras(e.target.value, 40),
                      }))}
                      maxLength={40}
                      required={clienteForm.esNacional === "si"}
                    />
                  </label>
                  <label className="perfil-field">
                    <span><ST>Teléfono</ST></span>
                    <input
                      value={clienteForm.telefono}
                      onChange={(e) => setClienteForm((prev) => ({
                        ...prev,
                        telefono: soloTelefono(e.target.value),
                      }))}
                      maxLength={15}
                      inputMode="tel"
                      required
                    />
                  </label>
                </>
              )}
              {clienteError ? <p className="perfil-field-error"><ST>{clienteError}</ST></p> : null}
              <div className="perfil-card__actions">
                <button type="submit" className="perfil-button" disabled={guardando}>
                  {guardando ? tGuardando : tGuardarCliente}
                </button>
              </div>
            </form>
          ) : (
            <p className="perfil-card__current-value">{tSinFichaCliente}</p>
          )}
        </section>
      ) : null}


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
