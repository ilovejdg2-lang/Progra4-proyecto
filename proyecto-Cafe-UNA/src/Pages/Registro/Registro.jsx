import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Eye, EyeOff } from 'lucide-react';
import { ST } from '../../Components/T/ST';
import { useTraducir } from '../../hooks/useTraducir';
import { sanitizeUserFacingError, MAX_PASSWORD } from '../../lib/formLimits';
import { queueFocusFormError } from '../../lib/formFocus';
import { normalizeImageUrl } from '../../lib/imageUtils';
import { rolesDeUsuario } from '../../lib/permisos';
import {
  completarCliente,
  limpiarIntentRegistroCliente,
  mapAuthenticatedUser,
  puedeAbrirRegistroCliente,
  puedeComprar,
  registrarCliente,
} from '../../services/authService';
import { consultarCedulaDetallada } from '../../services/cedulaService';
import { obtenerNavbar } from '../../services/informacionService';
import {
  getActiveSessionUser,
  saveAuthenticatedUser,
} from '../../services/sessionService';
import { UiSelect } from '../../Components/ui/Select';
import '../Login/Login.css';
import './Registro.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEFONO_RE = /^(\+?\d{1,3}[\s-]?)?(\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4}$/;
const NOMBRE_RE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/;
const CEDULA_JURIDICA_RE = /^\d{1}-\d{3}-\d{6}$/;

const LIMITE = {
  nombre: 50,
  apellido: 40,
  cedula: 9,
  dimex: 12,
  pasaporte: 20,
  razonSocial: 120,
  nombreComercial: 120,
  representanteLegal: 100,
  cedulaJuridica: 12,
  direccionFiscal: 200,
  telefono: 15,
  correo: 100,
  password: MAX_PASSWORD,
};

function normalizarCedulaCr(valor) {
  return String(valor ?? '').replace(/\D/g, '').slice(0, LIMITE.cedula);
}

function soloLetras(valor, max) {
  return String(valor ?? '')
    .replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+/g, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, max);
}

function soloDigitos(valor, max) {
  return String(valor ?? '').replace(/\D/g, '').slice(0, max);
}

function soloTelefono(valor) {
  const texto = String(valor ?? '');
  const tieneMas = texto.trimStart().startsWith('+');
  const digitos = texto.replace(/\D/g, '').slice(0, LIMITE.telefono - (tieneMas ? 1 : 0));
  return tieneMas ? `+${digitos}` : digitos;
}

function formatearCedulaJuridica(valor) {
  const digitos = String(valor ?? '').replace(/\D/g, '').slice(0, 10);
  if (digitos.length <= 1) return digitos;
  if (digitos.length <= 4) return `${digitos.slice(0, 1)}-${digitos.slice(1)}`;
  return `${digitos.slice(0, 1)}-${digitos.slice(1, 4)}-${digitos.slice(4)}`;
}

function soloCorreo(valor) {
  return String(valor ?? '')
    .replace(/\s+/g, '')
    .slice(0, LIMITE.correo);
}

function PasswordField({
  id,
  value,
  onChange,
  visible,
  onToggle,
  ariaInvalid,
  ariaDescribedBy,
  maxLength,
}) {
  const Icon = visible ? Eye : EyeOff;
  const tOcultar = useTraducir('Ocultar contraseña');
  const tMostrar = useTraducir('Mostrar contraseña');

  return (
    <div className="login-password-wrapper">
      <input
        id={id}
        name={id}
        type={visible ? 'text' : 'password'}
        placeholder="••••••••"
        autoComplete="new-password"
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        className={ariaInvalid ? 'input-error' : ''}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
      />
      <button
        type="button"
        className="login-password-toggle"
        onClick={onToggle}
        aria-label={visible ? tOcultar : tMostrar}
      >
        <Icon className="login-password-icon" aria-hidden="true" />
      </button>
    </div>
  );
}

function validarPasswordCliente(password) {
  if (!password) return 'La contraseña es obligatoria.';
  if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  if (password.length > LIMITE.password) {
    return `La contraseña no puede tener más de ${LIMITE.password} caracteres.`;
  }
  if (!/[A-ZÁÉÍÓÚÜÑ]/.test(password)) return 'La contraseña debe incluir al menos una mayúscula.';
  if (!/\d/.test(password)) return 'La contraseña debe incluir al menos un número.';
  if (!/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s]/.test(password)) {
    return 'La contraseña debe incluir al menos un carácter especial.';
  }
  return '';
}

function validarTelefono(valor, obligatorio = true) {
  const telefono = String(valor || '').trim();
  if (!telefono) return obligatorio ? 'El teléfono es obligatorio.' : '';
  if (!TELEFONO_RE.test(telefono) || telefono.replace(/\D/g, '').length < 8) {
    return 'El teléfono no tiene un formato válido.';
  }
  return '';
}

const emptyErrors = () => ({
  esNacional: '',
  tipoDocumento: '',
  nombre: '',
  apellido1: '',
  apellido2: '',
  identificacion: '',
  razonSocial: '',
  nombreComercial: '',
  representanteLegal: '',
  cedulaJuridica: '',
  direccionFiscal: '',
  telefonoOficina: '',
  correo: '',
  password: '',
  confirmPassword: '',
  telefono: '',
  aceptoTerminos: '',
  aceptoPrivacidad: '',
});

const Registro = () => {
  const navigate = useNavigate();
  const sessionUser = getActiveSessionUser();
  const upgradeMode = Boolean(sessionUser) && !puedeComprar(sessionUser);

  const tVolver = useTraducir('Volver');
  const tTitulo = useTraducir('Registro de cliente');
  const tSubtitulo = useTraducir(
    upgradeMode
      ? 'Completá tus datos para obtener el rol de cliente y poder comprar.'
      : 'Registrate como persona natural o persona jurídica para comprar en Café UNA.',
  );
  const tPersona = useTraducir('Persona natural');
  const tEmpresa = useTraducir('Persona jurídica');
  const tNombre = useTraducir('Nombre');
  const tApellido1 = useTraducir('Apellido 1');
  const tApellido2 = useTraducir('Apellido 2');
  const tCedula = useTraducir('Cédula');
  const tEsNacional = useTraducir('¿Es nacional de Costa Rica?');
  const tSi = useTraducir('Sí');
  const tNo = useTraducir('No');
  const tTipoDocumento = useTraducir('Tipo de documento');
  const tDimex = useTraducir('DIMEX');
  const tPasaporte = useTraducir('Pasaporte');
  const tConsultandoCedula = useTraducir('Consultando cédula...');
  const tDatosCargados = useTraducir('Datos cargados automáticamente. Podés editarlos si hace falta.');
  const tRazonSocial = useTraducir('Razón social');
  const tNombreComercial = useTraducir('Nombre comercial');
  const tRepresentante = useTraducir('Nombre del representante legal');
  const tCedulaJuridica = useTraducir('Cédula jurídica');
  const tDireccionFiscal = useTraducir('Dirección fiscal');
  const tTelefonoOficina = useTraducir('Teléfono de oficina');
  const tCorreo = useTraducir('Correo');
  const tPassword = useTraducir('Contraseña');
  const tConfirm = useTraducir('Confirmar contraseña');
  const tTelefono = useTraducir('Teléfono');
  const tTerminos = useTraducir('Acepto los términos y condiciones');
  const tPrivacidad = useTraducir('Acepto las políticas de privacidad');
  const tEnviar = useTraducir(upgradeMode ? 'Ingresar como cliente' : 'Crear cuenta de cliente');
  const tEnviando = useTraducir(upgradeMode ? 'Guardando...' : 'Enviando...');
  const tOpcional = useTraducir('(opcional)');
  const tYaCliente = useTraducir('Tu cuenta ya puede comprar.');
  const tIrCheckout = useTraducir('Ir al checkout');
  const tLogin = useTraducir('Ya tengo cuenta');

  const [tipo, setTipo] = useState('persona');
  const [logoUrl, setLogoUrl] = useState('');
  const [formError, setFormError] = useState('');
  const [avisoCedula, setAvisoCedula] = useState('');
  const [consultandoCedula, setConsultandoCedula] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState(emptyErrors);
  const consultaCedulaRef = useRef({ digitos: '', enCurso: false });
  const [form, setForm] = useState({
    esNacional: 'si',
    tipoDocumento: 'cedula',
    nombre: '',
    apellido1: '',
    apellido2: '',
    identificacion: '',
    razonSocial: '',
    nombreComercial: '',
    representanteLegal: '',
    cedulaJuridica: '',
    direccionFiscal: '',
    telefonoOficina: '',
    correo: sessionUser?.email || '',
    password: '',
    confirmPassword: '',
    telefono: '',
    aceptoTerminos: false,
    aceptoPrivacidad: false,
  });

  const esNacionalCr = form.esNacional === 'si';
  const labelIdentificacion = esNacionalCr
    ? tCedula
    : form.tipoDocumento === 'dimex'
      ? tDimex
      : tPasaporte;

  useEffect(() => {
    let cancelled = false;
    obtenerNavbar()
      .then((data) => {
        if (cancelled) return;
        setLogoUrl(data?.logoUrl || data?.LogoUrl || '');
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (sessionUser && puedeComprar(sessionUser)) {
      const redirect = sessionStorage.getItem('postLoginRedirect') || '/checkout';
      sessionStorage.removeItem('postLoginRedirect');
      navigate({ to: redirect });
      return;
    }
    if (!puedeAbrirRegistroCliente()) {
      navigate({ to: '/checkout' });
    }
  }, [sessionUser, navigate]);

  const consultarDatosCedula = useCallback(async (digitos, { forzar = false } = {}) => {
    if (!esNacionalCr || digitos.length !== 9) return;
    if (consultaCedulaRef.current.enCurso) return;
    if (!forzar && consultaCedulaRef.current.digitos === digitos) return;

    consultaCedulaRef.current = { digitos, enCurso: true };
    setConsultandoCedula(true);
    setAvisoCedula('');

    try {
      const datos = await consultarCedulaDetallada(digitos);
      const nombre = datos?.nombre || datos?.Nombre || '';
      const apellido1 = datos?.primerApellido || datos?.PrimerApellido || '';
      const apellido2 = datos?.segundoApellido || datos?.SegundoApellido || '';

      if (!nombre && !apellido1) {
        consultaCedulaRef.current = { digitos: '', enCurso: false };
        setAvisoCedula('No se encontraron datos para esta cédula. Completá los datos manualmente.');
        return;
      }

      consultaCedulaRef.current = { digitos, enCurso: false };
      setForm((prev) => ({
        ...prev,
        identificacion: digitos,
        nombre,
        apellido1,
        apellido2,
      }));
      setAvisoCedula(tDatosCargados);
      setErrors((prev) => ({
        ...prev,
        identificacion: '',
        nombre: '',
        apellido1: '',
        apellido2: '',
      }));
    } catch (error) {
      consultaCedulaRef.current = { digitos: '', enCurso: false };
      const mensajeBase = error?.message?.trim() || 'No se pudo consultar la cédula.';
      const yaIndicaManual = /manualmente|completar/i.test(mensajeBase);
      setAvisoCedula(
        yaIndicaManual
          ? mensajeBase
          : `${mensajeBase} Completá los datos manualmente.`,
      );
    } finally {
      setConsultandoCedula(false);
    }
  }, [esNacionalCr, tDatosCargados]);

  useEffect(() => {
    if (tipo !== 'persona' || !esNacionalCr) return undefined;
    const digitos = normalizarCedulaCr(form.identificacion);
    if (digitos.length !== 9) return undefined;
    if (consultaCedulaRef.current.enCurso) return undefined;
    if (consultaCedulaRef.current.digitos === digitos) return undefined;

    const timeoutId = window.setTimeout(() => {
      consultarDatosCedula(digitos);
    }, 350);
    return () => window.clearTimeout(timeoutId);
  }, [form.identificacion, tipo, esNacionalCr, consultarDatosCedula]);

  const setEsNacional = (valor) => {
    const nacional = valor === 'si';
    setForm((prev) => ({
      ...prev,
      esNacional: valor,
      tipoDocumento: nacional ? 'cedula' : 'dimex',
      identificacion: '',
      nombre: '',
      apellido1: '',
      apellido2: '',
    }));
    setErrors(emptyErrors());
    setAvisoCedula('');
    consultaCedulaRef.current = { digitos: '', enCurso: false };
  };

  const setTipoDocumentoExtranjero = (valor) => {
    setForm((prev) => ({
      ...prev,
      tipoDocumento: valor,
      identificacion: '',
    }));
    setErrors((prev) => ({ ...prev, tipoDocumento: '', identificacion: '' }));
    setAvisoCedula('');
  };

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
    setFormError('');
    if (key === 'identificacion') {
      setAvisoCedula('');
      consultaCedulaRef.current = { digitos: '', enCurso: false };
    }
  };

  const validate = () => {
    const next = emptyErrors();

    if (tipo === 'persona') {
      if (form.esNacional !== 'si' && form.esNacional !== 'no') {
        next.esNacional = 'Indicá si sos nacional de Costa Rica.';
      }
      if (!esNacionalCr && form.tipoDocumento !== 'dimex' && form.tipoDocumento !== 'pasaporte') {
        next.tipoDocumento = 'Elegí DIMEX o pasaporte.';
      }

      if (!form.identificacion.trim()) {
        next.identificacion = `El ${labelIdentificacion.toLowerCase()} es obligatorio.`;
      } else if (esNacionalCr) {
        const digitos = normalizarCedulaCr(form.identificacion);
        if (digitos.length !== 9) {
          next.identificacion = 'La cédula costarricense debe tener 9 dígitos.';
        }
      } else if (form.tipoDocumento === 'dimex') {
        const digitos = form.identificacion.replace(/\D/g, '');
        if (digitos.length < 10 || digitos.length > 12) {
          next.identificacion = 'El DIMEX debe tener entre 10 y 12 dígitos.';
        }
      } else if (!/^[A-Za-z0-9]{5,20}$/.test(form.identificacion.trim())) {
        next.identificacion = 'El pasaporte no tiene un formato válido.';
      }

      if (!form.nombre.trim()) next.nombre = 'El nombre es obligatorio.';
      else if (!NOMBRE_RE.test(form.nombre.trim())) {
        next.nombre = 'El nombre solo puede incluir letras y espacios.';
      }
      if (!form.apellido1.trim()) next.apellido1 = 'El apellido 1 es obligatorio.';
      else if (!NOMBRE_RE.test(form.apellido1.trim())) {
        next.apellido1 = 'El apellido 1 solo puede incluir letras y espacios.';
      }
      if (esNacionalCr) {
        if (!form.apellido2.trim()) next.apellido2 = 'El apellido 2 es obligatorio.';
        else if (!NOMBRE_RE.test(form.apellido2.trim())) {
          next.apellido2 = 'El apellido 2 solo puede incluir letras y espacios.';
        }
      } else if (form.apellido2.trim() && !NOMBRE_RE.test(form.apellido2.trim())) {
        next.apellido2 = 'El apellido 2 solo puede incluir letras y espacios.';
      }
    } else {
      if (!form.razonSocial.trim()) next.razonSocial = 'La razón social es obligatoria.';
      if (!form.nombreComercial.trim()) {
        next.nombreComercial = 'El nombre comercial es obligatorio.';
      }
      if (!form.representanteLegal.trim()) {
        next.representanteLegal = 'El nombre del representante legal es obligatorio.';
      }
      if (!form.cedulaJuridica.trim()) next.cedulaJuridica = 'La cédula jurídica es obligatoria.';
      else if (!CEDULA_JURIDICA_RE.test(form.cedulaJuridica.trim())) {
        next.cedulaJuridica = 'La cédula jurídica debe tener el formato 3-101-123456.';
      }
      next.telefonoOficina = validarTelefono(form.telefonoOficina, false);
    }

    if (!upgradeMode) {
      if (!form.correo.trim()) next.correo = 'El correo es obligatorio.';
      else if (!EMAIL_RE.test(form.correo.trim())) next.correo = 'El correo no tiene un formato válido.';
      next.password = validarPasswordCliente(form.password);
      if (!form.confirmPassword) next.confirmPassword = 'Confirmá la contraseña.';
      else if (form.password !== form.confirmPassword) {
        next.confirmPassword = 'Las contraseñas no coinciden.';
      }
    }

    next.telefono = validarTelefono(form.telefono, true);
    if (!form.aceptoTerminos) next.aceptoTerminos = 'Debe aceptar los términos y condiciones.';
    if (!form.aceptoPrivacidad) next.aceptoPrivacidad = 'Debe aceptar las políticas de privacidad.';

    setErrors(next);
    return !Object.values(next).some(Boolean);
  };

  const canSubmit = useMemo(() => {
    if (submitting || consultandoCedula) return false;
    if (!form.aceptoTerminos || !form.aceptoPrivacidad) return false;
    if (!form.telefono.trim()) return false;
    if (tipo === 'persona') {
      if (!form.esNacional) return false;
      if (!esNacionalCr && form.tipoDocumento !== 'dimex' && form.tipoDocumento !== 'pasaporte') {
        return false;
      }
      if (!form.identificacion.trim() || !form.nombre.trim() || !form.apellido1.trim()) {
        return false;
      }
      if (esNacionalCr && !form.apellido2.trim()) return false;
    }
    if (tipo === 'empresa') {
      if (
        !form.razonSocial.trim()
        || !form.nombreComercial.trim()
        || !form.representanteLegal.trim()
        || !form.cedulaJuridica.trim()
      ) {
        return false;
      }
    }
    if (!upgradeMode) {
      if (!form.correo.trim() || !form.password || !form.confirmPassword) return false;
      if (form.password !== form.confirmPassword) return false;
      if (validarPasswordCliente(form.password)) return false;
    }
    return !Object.values(errors).some(Boolean);
  }, [form, tipo, upgradeMode, submitting, consultandoCedula, errors, esNacionalCr]);

  const buildPayload = () => {
    const payload = {
      tipo,
      telefono: form.telefono.trim(),
      aceptoTerminos: form.aceptoTerminos,
      aceptoPrivacidad: form.aceptoPrivacidad,
    };
    if (tipo === 'persona') {
      payload.esNacional = form.esNacional;
      payload.tipoDocumento = esNacionalCr ? 'cedula' : form.tipoDocumento;
      payload.nombre = form.nombre.trim();
      payload.apellido1 = form.apellido1.trim();
      if (form.apellido2.trim()) payload.apellido2 = form.apellido2.trim();
      payload.identificacion = esNacionalCr || form.tipoDocumento === 'dimex'
        ? form.identificacion.replace(/\D/g, '')
        : form.identificacion.trim().toUpperCase();
    } else {
      payload.razonSocial = form.razonSocial.trim();
      payload.nombreComercial = form.nombreComercial.trim();
      payload.representanteLegal = form.representanteLegal.trim();
      payload.cedulaJuridica = form.cedulaJuridica.trim();
      if (form.direccionFiscal.trim()) payload.direccionFiscal = form.direccionFiscal.trim();
      if (form.telefonoOficina.trim()) payload.telefonoOficina = form.telefonoOficina.trim();
    }
    if (!upgradeMode) {
      payload.correo = form.correo.trim().toLowerCase();
      payload.password = form.password;
      payload.confirmPassword = form.confirmPassword;
    }
    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || submitting) {
      queueFocusFormError({ root: e.currentTarget });
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      const payload = buildPayload();
      if (upgradeMode) {
        const result = await completarCliente(payload);
        const token = result?.token || result?.Token;
        if (token) {
          saveAuthenticatedUser(mapAuthenticatedUser(token));
        }
        limpiarIntentRegistroCliente();
        const redirect = sessionStorage.getItem('postLoginRedirect') || '/checkout';
        sessionStorage.removeItem('postLoginRedirect');
        window.location.href = redirect;
        return;
      }

      await registrarCliente(payload);
      sessionStorage.setItem('registroClienteCorreo', payload.correo);
      navigate({
        to: '/verificar-cuenta',
        search: { correo: payload.correo },
      });
    } catch (err) {
      setFormError(sanitizeUserFacingError(err.message || 'No se pudo completar el registro.'));
      queueFocusFormError({ root: e.currentTarget });
    } finally {
      setSubmitting(false);
    }
  };

  if (sessionUser && puedeComprar(sessionUser)) {
    return (
      <main className="login-page registro-page">
        <Link to="/" className="login-back">
          ← <ST>{tVolver}</ST>
        </Link>
        <div className="login-card registro-card">
          <p className="login-success"><ST>{tYaCliente}</ST></p>
          <button type="button" className="login-button" onClick={() => navigate({ to: '/checkout' })}>
            <ST>{tIrCheckout}</ST>
          </button>
        </div>
      </main>
    );
  }

  if (!puedeAbrirRegistroCliente()) {
    return null;
  }

  const field = (key, label, props = {}) => (
    <div className="login-field" key={key}>
      <label htmlFor={key}>
        <ST>{label}</ST>
        {props.optional ? (
          <>
            {' '}
            <span className="registro-optional"><ST>{tOpcional}</ST></span>
          </>
        ) : null}
      </label>
      <input
        id={key}
        name={key}
        value={form[key]}
        className={errors[key] ? 'input-error' : ''}
        aria-invalid={Boolean(errors[key])}
        aria-describedby={errors[key] ? `${key}-error` : undefined}
        onChange={(ev) => setField(key, ev.target.value)}
        {...props.input}
      />
      {errors[key] ? (
        <p id={`${key}-error`} className="login-field-error"><ST>{errors[key]}</ST></p>
      ) : null}
    </div>
  );

  const campoLetras = (key, label, max, extra = {}) => field(key, label, {
    ...extra,
    input: {
      autoComplete: extra.autoComplete,
      maxLength: max,
      onChange: (ev) => setField(key, soloLetras(ev.target.value, max)),
      ...(extra.input || {}),
    },
  });

  const campoDigitos = (key, label, max, extra = {}) => field(key, label, {
    ...extra,
    input: {
      inputMode: 'numeric',
      autoComplete: 'off',
      maxLength: max,
      onChange: (ev) => setField(key, soloDigitos(ev.target.value, max)),
      ...(extra.input || {}),
    },
  });

  const campoTelefono = (key, label, extra = {}) => field(key, label, {
    ...extra,
    input: {
      inputMode: 'tel',
      autoComplete: 'tel',
      maxLength: LIMITE.telefono,
      onChange: (ev) => setField(key, soloTelefono(ev.target.value)),
      ...(extra.input || {}),
    },
  });


  return (
    <main className="login-page registro-page">
      <Link to="/" className="login-back">
        ← <ST>{tVolver}</ST>
      </Link>
      <div className="login-card registro-card">
        <div className="login-brand">
          {logoUrl ? (
            <img className="login-logo" src={normalizeImageUrl(logoUrl, { width: 200 })} alt="Café UNA" />
          ) : (
            <h1 className="registro-title"><ST>{tTitulo}</ST></h1>
          )}
        </div>
        <p className="registro-subtitle"><ST>{tSubtitulo}</ST></p>

        <div className="registro-tipo" role="tablist" aria-label="Tipo de cliente">
          <button
            type="button"
            role="tab"
            aria-selected={tipo === 'persona'}
            className={`registro-tipo__btn${tipo === 'persona' ? ' is-active' : ''}`}
            onClick={() => {
              setTipo('persona');
              setErrors(emptyErrors());
              setFormError('');
            }}
          >
            <ST>{tPersona}</ST>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tipo === 'empresa'}
            className={`registro-tipo__btn${tipo === 'empresa' ? ' is-active' : ''}`}
            onClick={() => {
              setTipo('empresa');
              setErrors(emptyErrors());
              setFormError('');
              setAvisoCedula('');
            }}
          >
            <ST>{tEmpresa}</ST>
          </button>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {tipo === 'persona' ? (
            <>
              <div className="login-field">
                <span className="registro-label"><ST>{tEsNacional}</ST></span>
                <div className="registro-radio-row" role="radiogroup" aria-label={tEsNacional}>
                  <label className={`registro-radio${form.esNacional === 'si' ? ' is-active' : ''}`}>
                    <input
                      type="radio"
                      name="esNacional"
                      value="si"
                      checked={form.esNacional === 'si'}
                      onChange={() => setEsNacional('si')}
                    />
                    <span className="registro-radio__text"><ST>{tSi}</ST></span>
                  </label>
                  <label className={`registro-radio${form.esNacional === 'no' ? ' is-active' : ''}`}>
                    <input
                      type="radio"
                      name="esNacional"
                      value="no"
                      checked={form.esNacional === 'no'}
                      onChange={() => setEsNacional('no')}
                    />
                    <span className="registro-radio__text"><ST>{tNo}</ST></span>
                  </label>
                </div>
                {errors.esNacional ? (
                  <p className="login-field-error"><ST>{errors.esNacional}</ST></p>
                ) : null}
              </div>

              <div className={`registro-grid${!esNacionalCr ? '' : ' registro-grid--full'}`}>
                {!esNacionalCr ? (
                  <div className="login-field">
                    <label htmlFor="tipoDocumento"><ST>{tTipoDocumento}</ST></label>
                    <UiSelect
                      id="tipoDocumento"
                      ariaLabel={tTipoDocumento}
                      className={`registro-ui-select${errors.tipoDocumento ? ' is-error' : ''}`}
                      value={form.tipoDocumento}
                      onChange={setTipoDocumentoExtranjero}
                      options={[
                        { value: 'dimex', label: tDimex },
                        { value: 'pasaporte', label: tPasaporte },
                      ]}
                    />
                    {errors.tipoDocumento ? (
                      <p className="login-field-error"><ST>{errors.tipoDocumento}</ST></p>
                    ) : null}
                  </div>
                ) : null}

                {field('identificacion', labelIdentificacion, {
                  input: esNacionalCr || form.tipoDocumento === 'dimex'
                    ? {
                        inputMode: 'numeric',
                        autoComplete: 'off',
                        maxLength: esNacionalCr ? LIMITE.cedula : LIMITE.dimex,
                        placeholder: esNacionalCr ? '9 dígitos' : '10 a 12 dígitos',
                        onChange: (ev) => setField(
                          'identificacion',
                          soloDigitos(
                            ev.target.value,
                            esNacionalCr ? LIMITE.cedula : LIMITE.dimex,
                          ),
                        ),
                      }
                    : {
                        autoComplete: 'off',
                        maxLength: LIMITE.pasaporte,
                        placeholder: tPasaporte,
                        onChange: (ev) => setField(
                          'identificacion',
                          ev.target.value
                            .replace(/[^A-Za-z0-9]/g, '')
                            .toUpperCase()
                            .slice(0, LIMITE.pasaporte),
                        ),
                      },
                })}
              </div>

              {esNacionalCr && consultandoCedula ? (
                <p className="registro-cedula-aviso"><ST>{tConsultandoCedula}</ST></p>
              ) : null}
              {esNacionalCr && avisoCedula ? (
                <p className="registro-cedula-aviso"><ST>{avisoCedula}</ST></p>
              ) : null}

              {campoLetras('nombre', tNombre, LIMITE.nombre, { autoComplete: 'given-name' })}
              <div className="registro-grid">
                {campoLetras('apellido1', tApellido1, LIMITE.apellido, { autoComplete: 'family-name' })}
                {campoLetras('apellido2', tApellido2, LIMITE.apellido, {
                  optional: !esNacionalCr,
                  autoComplete: 'additional-name',
                })}
              </div>
            </>
          ) : (
            <>
              <div className="registro-grid">
                {field('razonSocial', tRazonSocial, {
                  input: {
                    autoComplete: 'organization',
                    maxLength: LIMITE.razonSocial,
                    onChange: (ev) => setField(
                      'razonSocial',
                      ev.target.value.slice(0, LIMITE.razonSocial),
                    ),
                  },
                })}
                {field('nombreComercial', tNombreComercial, {
                  input: {
                    autoComplete: 'organization',
                    maxLength: LIMITE.nombreComercial,
                    onChange: (ev) => setField(
                      'nombreComercial',
                      ev.target.value.slice(0, LIMITE.nombreComercial),
                    ),
                  },
                })}
              </div>
              <div className="registro-grid">
                {field('cedulaJuridica', tCedulaJuridica, {
                  input: {
                    placeholder: '3-101-123456',
                    inputMode: 'numeric',
                    maxLength: LIMITE.cedulaJuridica,
                    onChange: (ev) => setField(
                      'cedulaJuridica',
                      formatearCedulaJuridica(ev.target.value),
                    ),
                  },
                })}
                {campoLetras('representanteLegal', tRepresentante, LIMITE.representanteLegal)}
              </div>
              <div className="registro-grid">
                {field('direccionFiscal', tDireccionFiscal, {
                  optional: true,
                  input: {
                    maxLength: LIMITE.direccionFiscal,
                    onChange: (ev) => setField(
                      'direccionFiscal',
                      ev.target.value.slice(0, LIMITE.direccionFiscal),
                    ),
                  },
                })}
                {campoTelefono('telefonoOficina', tTelefonoOficina, { optional: true })}
              </div>
            </>
          )}

          {!upgradeMode ? (
            <>
              <div className="registro-grid">
                {field('correo', tCorreo, {
                  input: {
                    type: 'email',
                    autoComplete: 'email',
                    maxLength: LIMITE.correo,
                    onChange: (ev) => setField('correo', soloCorreo(ev.target.value)),
                  },
                })}
                {campoTelefono('telefono', tTelefono)}
              </div>
              <div className="registro-grid">
                <div className="login-field">
                  <label htmlFor="password"><ST>{tPassword}</ST></label>
                  <PasswordField
                    id="password"
                    value={form.password}
                    onChange={(ev) => setField(
                      'password',
                      ev.target.value.slice(0, LIMITE.password),
                    )}
                    visible={showPass}
                    onToggle={() => setShowPass((v) => !v)}
                    maxLength={LIMITE.password}
                    ariaInvalid={Boolean(errors.password)}
                    ariaDescribedBy={errors.password ? 'password-error' : undefined}
                  />
                  {errors.password ? (
                    <p id="password-error" className="login-field-error"><ST>{errors.password}</ST></p>
                  ) : null}
                </div>
                <div className="login-field">
                  <label htmlFor="confirmPassword"><ST>{tConfirm}</ST></label>
                  <PasswordField
                    id="confirmPassword"
                    value={form.confirmPassword}
                    onChange={(ev) => setField(
                      'confirmPassword',
                      ev.target.value.slice(0, LIMITE.password),
                    )}
                    visible={showConfirm}
                    onToggle={() => setShowConfirm((v) => !v)}
                    maxLength={LIMITE.password}
                    ariaInvalid={Boolean(errors.confirmPassword)}
                    ariaDescribedBy={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                  />
                  {errors.confirmPassword ? (
                    <p id="confirmPassword-error" className="login-field-error">
                      <ST>{errors.confirmPassword}</ST>
                    </p>
                  ) : null}
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="registro-session-note">
                <ST>{`Cuenta: ${sessionUser?.email || sessionUser?.username || rolesDeUsuario(sessionUser).join(', ')}`}</ST>
              </p>
              {campoTelefono('telefono', tTelefono)}
            </>
          )}

          <div className="registro-checks">
            <label className={`registro-check${form.aceptoTerminos ? ' is-checked' : ''}${errors.aceptoTerminos ? ' is-error' : ''}`}>
              <input
                type="checkbox"
                checked={form.aceptoTerminos}
                onChange={(ev) => setField('aceptoTerminos', ev.target.checked)}
              />
              <span className="registro-check__box" aria-hidden="true" />
              <span className="registro-check__text"><ST>{tTerminos}</ST></span>
            </label>
            {errors.aceptoTerminos ? (
              <p className="login-field-error"><ST>{errors.aceptoTerminos}</ST></p>
            ) : null}

            <label className={`registro-check${form.aceptoPrivacidad ? ' is-checked' : ''}${errors.aceptoPrivacidad ? ' is-error' : ''}`}>
              <input
                type="checkbox"
                checked={form.aceptoPrivacidad}
                onChange={(ev) => setField('aceptoPrivacidad', ev.target.checked)}
              />
              <span className="registro-check__box" aria-hidden="true" />
              <span className="registro-check__text"><ST>{tPrivacidad}</ST></span>
            </label>
            {errors.aceptoPrivacidad ? (
              <p className="login-field-error"><ST>{errors.aceptoPrivacidad}</ST></p>
            ) : null}
          </div>

          {formError ? <p className="login-error-banner" role="alert"><ST>{formError}</ST></p> : null}

          <button type="submit" className="login-button" disabled={!canSubmit || submitting}>
            <ST>{submitting ? tEnviando : tEnviar}</ST>
          </button>
        </form>

        {!upgradeMode ? (
          <p className="login-footer">
            <Link to="/login" className="login-register-link"><ST>{tLogin}</ST></Link>
          </p>
        ) : null}
      </div>
    </main>
  );
};

export default Registro;
