import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Eye, EyeOff } from 'lucide-react';
import {
  iniciarSesion,
  mapAuthenticatedUser,
  registrarUsuario,
  verificarRegistro,
  solicitarRecuperacion,
  restablecerPassword,
} from '../../services/authService';
import { obtenerNavbar } from '../../services/informacionService';
import { normalizeImageUrl } from '../../lib/imageUtils';
import {
  MAX_NOMBRE_USUARIO,
  MAX_PASSWORD,
  sanitizeUserFacingError,
  validateNombreUsuario,
  validatePassword,
} from '../../lib/formLimits';
import { queueFocusFormError } from '../../lib/formFocus';
import { saveAuthenticatedUser } from '../../services/sessionService';
import { useTraducir } from '../../hooks/useTraducir';
import { ST } from '../../Components/T/ST';
import './Login.css';

function PasswordField({
  id,
  value,
  onChange,
  visible,
  onToggle,
  placeholder = '••••••••',
  autoComplete,
  className = '',
  ariaInvalid,
  ariaDescribedBy,
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
          placeholder={placeholder}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          className={className}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
          required
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


const Login = () => {
  const tVolver = useTraducir('Volver');
  const tCorreoUsuario = useTraducir('Correo o Usuario');
  const tPhCorreoUsuario = useTraducir('correo o usuario');
  const tContrasena = useTraducir('Contraseña');
  const tOlvido = useTraducir('¿Olvidó su contraseña?');
  const tIngresando = useTraducir('Ingresando...');
  const tIngresar = useTraducir('INGRESAR');
  const tNombre = useTraducir('Nombre');
  const tCorreo = useTraducir('Correo');
  const tConfirmar = useTraducir('Confirmar contraseña');
  const tEnviandoCodigo = useTraducir('Enviando código...');
  const tRegistrarme = useTraducir('REGISTRARME');
  const tVolverLogin = useTraducir('Volver a iniciar sesión');
  const tCodigoHintAntes = useTraducir('Enviamos un código a');
  const tCodigoHintDespues = useTraducir('. Ingrésalo para activar tu cuenta.');
  const tSpamHint = useTraducir('Si no lo ve, revise la carpeta de');
  const tSpam = useTraducir('spam');
  const tO = useTraducir('o');
  const tCorreoNoDeseado = useTraducir('correo no deseado');
  const tComunYahoo = useTraducir('(común en Yahoo y Gmail).');
  const tNoPudimos = useTraducir('No pudimos enviar el correo a');
  const tReviseEscribio = useTraducir('. Revise que lo escribiera bien o trate de contactar a Café UNA.');
  const tCodigoRecibido = useTraducir('Código recibido');
  const tVerificando = useTraducir('Verificando...');
  const tVerificarCuenta = useTraducir('VERIFICAR CUENTA');
  const tReenviar = useTraducir('Reenviar código');
  const tVolverForm = useTraducir('Volver al formulario');
  const tNuevaPass = useTraducir('Nueva contraseña');
  const tConfirmarNueva = useTraducir('Confirmar nueva contraseña');
  const tEnviar = useTraducir('ENVIAR');
  const tActualizar = useTraducir('ACTUALIZAR');
  const tNoTieneCuenta = useTraducir('¿No tiene una cuenta?');
  const tRegistrarse = useTraducir('Registrarse');

  const [mode, setMode] = useState('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ identifier: '', password: '' });
  const [registerFieldErrors, setRegisterFieldErrors] = useState({
    nombre: '',
    correo: '',
    password: '',
    confirmPassword: '',
  });
  const [recoverFieldErrors, setRecoverFieldErrors] = useState({
    nuevaPassword: '',
    confirmPassword: '',
  });
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState({
    login: false,
    register: false,
    registerConfirm: false,
    recoverNew: false,
    recoverConfirm: false,
  });

  const [registerForm, setRegisterForm] = useState({
    nombre: '',
    correo: '',
    password: '',
    confirmPassword: '',
    token: '',
  });
  const [registerStep, setRegisterStep] = useState('form');
  const [registerEmailSent, setRegisterEmailSent] = useState(true);

  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    let activo = true;

    obtenerNavbar()
      .then((navbar) => {
        if (!activo) return;
        setLogoUrl(typeof navbar?.logoUrl === 'string' ? navbar.logoUrl.trim() : '');
      })
      .catch(() => {});

    return () => {
      activo = false;
    };
  }, []);

  const [recoverForm, setRecoverForm] = useState({
    identifier: '',
    token: '',
    nuevaPassword: '',
    confirmPassword: '',
  });
  const successLooksLikeError = successMessage.toLowerCase().includes('no hay ning\u00fan usuario')
    || successMessage.toLowerCase().includes('no hay ningun usuario');

  useEffect(() => {
    if (!successMessage && !formError) {
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      setSuccessMessage('');
      setFormError('');
    }, 4500);

    return () => window.clearTimeout(timerId);
  }, [successMessage, formError]);

  const clearFieldError = (field) => {
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: '' } : prev));
    if (formError) {
      setFormError('');
    }
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const togglePasswordVisibility = (field) => {
    setVisiblePasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const validateForm = () => {
    const nextErrors = { identifier: '', password: '' };

    if (!identifier.trim()) {
      nextErrors.identifier = 'Ingrese su correo o usuario.';
    }

    if (!password) {
      nextErrors.password = 'Ingrese su contrase\u00f1a.';
    } else if (password.length > MAX_PASSWORD) {
      nextErrors.password = `La contrase\u00f1a no puede tener m\u00e1s de ${MAX_PASSWORD} caracteres.`;
    }

    setFieldErrors(nextErrors);
    return nextErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const nextErrors = validateForm();
    if (nextErrors.identifier || nextErrors.password) {
      queueFocusFormError({
        errors: nextErrors,
        root: e.currentTarget,
        fieldOrder: ['identifier', 'password'],
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await iniciarSesion({
        identifier: identifier.trim(),
        password,
      });

      const token = result?.token || result?.Token;
      if (!token) {
        setFormError('Credenciales incorrectas');
        queueFocusFormError({ root: e.currentTarget.closest('.login-card') || e.currentTarget });
        return;
      }

      const authenticatedUser = mapAuthenticatedUser(token);
      saveAuthenticatedUser(authenticatedUser);
      const redirectTo = sessionStorage.getItem('postLoginRedirect') || '/';
      sessionStorage.removeItem('postLoginRedirect');
      window.location.href = redirectTo;
    } catch (err) {
      setFormError(sanitizeUserFacingError(err.message || 'Ocurri\u00f3 un error al iniciar sesi\u00f3n.'));
      queueFocusFormError({ root: e.currentTarget.closest('.login-card') || document });
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setFormError('');
    setSuccessMessage('');
    setRegisterStep('form');
    setFieldErrors({ identifier: '', password: '' });
    setRegisterFieldErrors({ nombre: '', correo: '', password: '', confirmPassword: '' });
    setRecoverFieldErrors({ nuevaPassword: '', confirmPassword: '' });
    setRegisterForm({ nombre: '', correo: '', password: '', confirmPassword: '', token: '' });
  };

  const validateRegisterForm = () => {
    const nextErrors = {
      nombre: validateNombreUsuario(registerForm.nombre),
      correo: registerForm.correo.trim() ? '' : 'Ingrese su correo.',
      password: validatePassword(registerForm.password),
      confirmPassword: '',
    };

    if (registerForm.password && registerForm.password !== registerForm.confirmPassword) {
      nextErrors.confirmPassword = 'Las contrase\u00f1as no coinciden.';
    }

    setRegisterFieldErrors(nextErrors);
    return nextErrors;
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setFormError('');
    setSuccessMessage('');

    const nextErrors = validateRegisterForm();
    if (Object.values(nextErrors).some(Boolean)) {
      queueFocusFormError({
        errors: nextErrors,
        root: event.currentTarget,
        fieldMap: {
          correo: 'correoRegistro',
          password: 'passwordRegistro',
          confirmPassword: 'confirmPasswordRegistro',
        },
        fieldOrder: ['nombre', 'correo', 'password', 'confirmPassword'],
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await registrarUsuario({
        nombre: registerForm.nombre.trim(),
        correo: registerForm.correo.trim().toLowerCase(),
        password: registerForm.password,
      });
      setRegisterEmailSent(result?.emailSent !== false);
      setSuccessMessage(result?.message || 'Revisa tu correo e ingresa el c\u00f3digo de verificaci\u00f3n.');
      setRegisterStep('verify');
    } catch (err) {
      setFormError(sanitizeUserFacingError(err.message || 'No se pudo registrar la cuenta.'));
      queueFocusFormError({ root: event.currentTarget.closest('.login-card') || document });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendRegistrationCode = async () => {
    setFormError('');
    setSuccessMessage('');

    if (!registerForm.nombre.trim() || !registerForm.correo.trim() || !registerForm.password) {
      setFormError('Complete el formulario de registro antes de reenviar el código.');
      setRegisterStep('form');
      return;
    }

    if (!validateRegisterForm()) {
      setRegisterStep('form');
      return;
    }

    setIsLoading(true);
    try {
      const result = await registrarUsuario({
        nombre: registerForm.nombre.trim(),
        correo: registerForm.correo.trim().toLowerCase(),
        password: registerForm.password,
      });
      setRegisterEmailSent(result?.emailSent !== false);
      setSuccessMessage(result?.message || 'Código reenviado. Revise su correo y la carpeta de spam.');
    } catch (err) {
      setFormError(err.message || 'No se pudo reenviar el código.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyRegistration = async (event) => {
    event.preventDefault();
    setFormError('');
    setSuccessMessage('');

    if (!registerForm.correo.trim() || !registerForm.token.trim()) {
      setFormError('Ingrese el c\u00f3digo recibido en su correo.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await verificarRegistro({
        correo: registerForm.correo.trim().toLowerCase(),
        token: registerForm.token.trim(),
      });
      setSuccessMessage(result?.message || 'Cuenta creada correctamente. Ya puede iniciar sesión.');
      setRegisterForm({ nombre: '', correo: '', password: '', confirmPassword: '', token: '' });
      setRegisterStep('form');
      setMode('login');
    } catch (err) {
      setFormError(err.message || 'No se pudo verificar el código.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestRecovery = async (event) => {
    event.preventDefault();
    setFormError('');
    setSuccessMessage('');

    if (!recoverForm.identifier.trim()) {
      setFormError('Ingrese su correo o usuario para recuperar la contrase\u00f1a.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await solicitarRecuperacion(recoverForm.identifier.trim());
      setSuccessMessage(
        result?.message ||
          'Si existe una cuenta con esos datos, enviamos un código de recuperación al correo registrado.',
      );
      setRecoverForm((prev) => ({
        ...prev,
        token: '',
        nuevaPassword: '',
        confirmPassword: '',
      }));
    } catch (err) {
      setFormError(err.message || 'No se pudo iniciar la recuperaci\u00f3n.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setFormError('');
    setSuccessMessage('');

    const nextErrors = {
      nuevaPassword: !recoverForm.token.trim()
        ? 'Ingrese el c\u00f3digo recibido en su correo.'
        : validatePassword(recoverForm.nuevaPassword),
      confirmPassword: '',
    };

    if (recoverForm.nuevaPassword && recoverForm.nuevaPassword !== recoverForm.confirmPassword) {
      nextErrors.confirmPassword = 'Las contrase\u00f1as no coinciden.';
    }

    if (nextErrors.nuevaPassword || nextErrors.confirmPassword) {
      setRecoverFieldErrors(nextErrors);
      return;
    }

    setRecoverFieldErrors({ nuevaPassword: '', confirmPassword: '' });

    setIsLoading(true);
    try {
      const result = await restablecerPassword({
        identifier: recoverForm.identifier.trim(),
        token: recoverForm.token.trim(),
        nuevaPassword: recoverForm.nuevaPassword,
      });
      setSuccessMessage(result?.message || 'Contrase\u00f1a actualizada correctamente.');
      setRecoverForm({ identifier: '', token: '', nuevaPassword: '', confirmPassword: '' });
      setMode('login');
    } catch (err) {
      setFormError(err.message || 'No se pudo restablecer la contrase\u00f1a.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Link to="/" className="login-back">
        <svg className="login-back-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M10 12L6 8l4-4"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {tVolver}
      </Link>

      <div className="login-card">
        <div className="login-brand">
          {logoUrl ? (
            <img
              src={normalizeImageUrl(logoUrl, { width: 320 })}
              alt={"Caf\u00e9 UNA"}
              className="login-logo"
            />
          ) : (
            <span className="login-brand-text">{"Caf\u00e9 UNA"}</span>
          )}
        </div>

        {successMessage ? (
          <p className={successLooksLikeError ? 'login-error-banner' : 'login-success'}>
            <ST>{successMessage}</ST>
          </p>
        ) : null}
        {mode === 'recover' && formError ? <p className="login-error-banner" role="alert"><ST>{formError}</ST></p> : null}
        {mode === 'login' && formError ? <p className="login-error-banner" role="alert"><ST>{formError}</ST></p> : null}
        {mode === 'register' && formError ? <p className="login-error-banner" role="alert"><ST>{formError}</ST></p> : null}
        {mode === 'login' ? (
          <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="login-field">
            <label htmlFor="identifier">{tCorreoUsuario}</label>
            <input
              id="identifier"
              name="identifier"
              type="text"
              placeholder={tPhCorreoUsuario}
              autoComplete="username"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                clearFieldError('identifier');
              }}
              className={fieldErrors.identifier ? 'input-error' : ''}
              aria-invalid={Boolean(fieldErrors.identifier)}
              aria-describedby={fieldErrors.identifier ? 'identifier-error' : undefined}
            />
            {fieldErrors.identifier && (
              <p id="identifier-error" className="login-field-error"><ST>{fieldErrors.identifier}</ST></p>
            )}
          </div>

          <div className="login-field">
            <label htmlFor="password">{tContrasena}</label>
            <PasswordField
              id="password"
              visible={visiblePasswords.login}
              onToggle={() => togglePasswordVisibility('login')}
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value.slice(0, MAX_PASSWORD));
                clearFieldError('password');
              }}
              className={fieldErrors.password ? 'input-error' : ''}
              ariaInvalid={Boolean(fieldErrors.password)}
              ariaDescribedBy={fieldErrors.password ? 'password-error' : undefined}
            />
            {fieldErrors.password && (
              <p id="password-error" className="login-field-error">
                <ST>{fieldErrors.password}</ST>
              </p>
            )}
            <button type="button" className="login-forgot-link" onClick={() => switchMode('recover')}>{tOlvido}</button>
          </div>

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? tIngresando : tIngresar}
          </button>
          </form>
        ) : null}

        {mode === 'register' ? (
          registerStep === 'form' ? (
          <form className="login-form" onSubmit={handleRegister} noValidate>
            <div className="login-field">
              <label htmlFor="nombre">{tNombre}</label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                value={registerForm.nombre}
                onChange={(e) => {
                  setRegisterFieldErrors((prev) => ({ ...prev, nombre: '' }));
                  setRegisterForm((prev) => ({ ...prev, nombre: e.target.value.slice(0, MAX_NOMBRE_USUARIO) }));
                }}
                maxLength={MAX_NOMBRE_USUARIO}
                className={registerFieldErrors.nombre ? 'input-error' : ''}
                aria-invalid={Boolean(registerFieldErrors.nombre)}
                required
              />
              {registerFieldErrors.nombre ? (
                <p className="login-field-error" role="alert"><ST>{registerFieldErrors.nombre}</ST></p>
              ) : null}
            </div>
            <div className="login-field">
              <label htmlFor="correoRegistro">{tCorreo}</label>
              <input
                id="correoRegistro"
                name="correoRegistro"
                type="email"
                value={registerForm.correo}
                onChange={(e) => {
                  setRegisterFieldErrors((prev) => ({ ...prev, correo: '' }));
                  setRegisterForm((prev) => ({ ...prev, correo: e.target.value }));
                }}
                className={registerFieldErrors.correo ? 'input-error' : ''}
                aria-invalid={Boolean(registerFieldErrors.correo)}
                required
              />
              {registerFieldErrors.correo ? (
                <p className="login-field-error"><ST>{registerFieldErrors.correo}</ST></p>
              ) : null}
            </div>
            <div className="login-field">
              <label htmlFor="passwordRegistro">{tContrasena}</label>
              <PasswordField
                id="passwordRegistro"
                visible={visiblePasswords.register}
                onToggle={() => togglePasswordVisibility('register')}
                autoComplete="new-password"
                value={registerForm.password}
                onChange={(e) => {
                  setRegisterFieldErrors((prev) => ({ ...prev, password: '' }));
                  setRegisterForm((prev) => ({ ...prev, password: e.target.value.slice(0, MAX_PASSWORD) }));
                }}
                className={registerFieldErrors.password ? 'input-error' : ''}
                ariaInvalid={Boolean(registerFieldErrors.password)}
                ariaDescribedBy={registerFieldErrors.password ? 'password-registro-error' : undefined}
              />
              {registerFieldErrors.password ? (
                <p id="password-registro-error" className="login-field-error"><ST>{registerFieldErrors.password}</ST></p>
              ) : null}
            </div>
            <div className="login-field">
              <label htmlFor="confirmPasswordRegistro">{tConfirmar}</label>
              <PasswordField
                id="confirmPasswordRegistro"
                visible={visiblePasswords.registerConfirm}
                onToggle={() => togglePasswordVisibility('registerConfirm')}
                autoComplete="new-password"
                value={registerForm.confirmPassword}
                onChange={(e) => {
                  setRegisterFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                  setRegisterForm((prev) => ({ ...prev, confirmPassword: e.target.value.slice(0, MAX_PASSWORD) }));
                }}
                className={registerFieldErrors.confirmPassword ? 'input-error' : ''}
                ariaInvalid={Boolean(registerFieldErrors.confirmPassword)}
                ariaDescribedBy={registerFieldErrors.confirmPassword ? 'confirm-password-registro-error' : undefined}
              />
              {registerFieldErrors.confirmPassword ? (
                <p id="confirm-password-registro-error" className="login-field-error"><ST>{registerFieldErrors.confirmPassword}</ST></p>
              ) : null}
            </div>
            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? tEnviandoCodigo : tRegistrarme}
            </button>
            <button type="button" className="login-alt-link" onClick={() => switchMode('login')}>{tVolverLogin}</button>
          </form>
          ) : (
          <form className="login-form" onSubmit={handleVerifyRegistration} noValidate>
            <p className="login-verify-hint">
              {registerEmailSent ? (
                <>
                  {tCodigoHintAntes}{' '}
                  <strong>{registerForm.correo}</strong>
                  {tCodigoHintDespues}
                  {' '}
                  {tSpamHint}{' '}
                  <strong>{tSpam}</strong>
                  {' '}{tO}{' '}
                  <strong>{tCorreoNoDeseado}</strong>
                  {' '}{tComunYahoo}
                </>
              ) : (
                <>
                  {tNoPudimos} <strong>{registerForm.correo}</strong>{tReviseEscribio}
                </>
              )}
            </p>
            <div className="login-field">
              <label htmlFor="registerToken">{tCodigoRecibido}</label>
              <input
                id="registerToken"
                type="text"
                value={registerForm.token}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, token: e.target.value }))}
                required
              />
            </div>
            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? tVerificando : tVerificarCuenta}
            </button>
            <button
              type="button"
              className="login-alt-link"
              onClick={handleResendRegistrationCode}
              disabled={isLoading}
            >
              {tReenviar}
            </button>
            <button type="button" className="login-alt-link" onClick={() => setRegisterStep('form')}>
              {tVolverForm}
            </button>
          </form>
          )
        ) : null}

        {mode === 'recover' ? (
          <div className="login-recover">
            <form className="login-form" onSubmit={handleRequestRecovery} noValidate>
              <div className="login-field">
                <label htmlFor="recoverIdentifier">{tCorreoUsuario}</label>
                <input
                  id="recoverIdentifier"
                  type="text"
                  value={recoverForm.identifier}
                  onChange={(e) => setRecoverForm((prev) => ({ ...prev, identifier: e.target.value }))}
                  required
                />
              </div>
              <button type="submit" className="login-button" disabled={isLoading}>
                {tEnviar}
              </button>
            </form>

            <form className="login-form login-form--compact" onSubmit={handleResetPassword} noValidate>
              <div className="login-field">
                <label htmlFor="recoverToken">{tCodigoRecibido}</label>
                <input
                  id="recoverToken"
                  type="text"
                  value={recoverForm.token}
                  onChange={(e) => setRecoverForm((prev) => ({ ...prev, token: e.target.value }))}
                  required
                />
              </div>
              <div className="login-field">
                <label htmlFor="newPassword">{tNuevaPass}</label>
                <PasswordField
                  id="newPassword"
                  visible={visiblePasswords.recoverNew}
                  onToggle={() => togglePasswordVisibility('recoverNew')}
                  autoComplete="new-password"
                  value={recoverForm.nuevaPassword}
                  onChange={(e) => {
                    setRecoverFieldErrors((prev) => ({ ...prev, nuevaPassword: '' }));
                    setRecoverForm((prev) => ({ ...prev, nuevaPassword: e.target.value.slice(0, MAX_PASSWORD) }));
                  }}
                  className={recoverFieldErrors.nuevaPassword ? 'input-error' : ''}
                  ariaInvalid={Boolean(recoverFieldErrors.nuevaPassword)}
                  ariaDescribedBy={recoverFieldErrors.nuevaPassword ? 'recover-password-error' : undefined}
                />
                {recoverFieldErrors.nuevaPassword ? (
                  <p id="recover-password-error" className="login-field-error"><ST>{recoverFieldErrors.nuevaPassword}</ST></p>
                ) : null}
              </div>
              <div className="login-field">
                <label htmlFor="confirmNewPassword">{tConfirmarNueva}</label>
                <PasswordField
                  id="confirmNewPassword"
                  visible={visiblePasswords.recoverConfirm}
                  onToggle={() => togglePasswordVisibility('recoverConfirm')}
                  autoComplete="new-password"
                  value={recoverForm.confirmPassword}
                  onChange={(e) => {
                    setRecoverFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                    setRecoverForm((prev) => ({ ...prev, confirmPassword: e.target.value.slice(0, MAX_PASSWORD) }));
                  }}
                  className={recoverFieldErrors.confirmPassword ? 'input-error' : ''}
                  ariaInvalid={Boolean(recoverFieldErrors.confirmPassword)}
                  ariaDescribedBy={recoverFieldErrors.confirmPassword ? 'recover-confirm-password-error' : undefined}
                />
                {recoverFieldErrors.confirmPassword ? (
                  <p id="recover-confirm-password-error" className="login-field-error"><ST>{recoverFieldErrors.confirmPassword}</ST></p>
                ) : null}
              </div>
              <button type="submit" className="login-button" disabled={isLoading}>
                {tActualizar}
              </button>
              <button type="button" className="login-alt-link" onClick={() => switchMode('login')}>{tVolverLogin}</button>
            </form>
          </div>
        ) : null}

        {mode === 'login' ? (
          <p className="login-register">
            {tNoTieneCuenta}
            {' '}
            <button type="button" className="login-register-link" onClick={() => switchMode('register')}>
              {tRegistrarse}
            </button>
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default Login;
