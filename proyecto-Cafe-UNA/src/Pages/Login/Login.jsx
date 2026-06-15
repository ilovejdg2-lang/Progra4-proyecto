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
import { saveAuthenticatedUser } from '../../services/sessionService';
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

  return (
    <div className="login-password-wrapper">
      <input
        id={id}
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
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      >
        <Icon className="login-password-icon" aria-hidden="true" />
      </button>
    </div>
  );
}


const Login = () => {
  const [mode, setMode] = useState('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ identifier: '', password: '' });
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
  const successLooksLikeError = successMessage.toLowerCase().includes('no hay ningún usuario')
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
      nextErrors.password = 'Ingrese su contraseña.';
    }

    setFieldErrors(nextErrors);
    return !nextErrors.identifier && !nextErrors.password;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!validateForm()) {
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
        return;
      }

      const authenticatedUser = mapAuthenticatedUser(token);
      saveAuthenticatedUser(authenticatedUser);
      const redirectTo = sessionStorage.getItem('postLoginRedirect') || '/';
      sessionStorage.removeItem('postLoginRedirect');
      window.location.href = redirectTo;
    } catch (err) {
      setFormError(err.message || 'Ocurrió un error al iniciar sesión.');
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setFormError('');
    setSuccessMessage('');
    setRegisterStep('form');
    setRegisterForm({ nombre: '', correo: '', password: '', confirmPassword: '', token: '' });
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setFormError('');
    setSuccessMessage('');

    if (!registerForm.nombre.trim() || !registerForm.correo.trim() || !registerForm.password) {
      setFormError('Complete todos los campos para registrarse.');
      return;
    }

    if (registerForm.password.length < 6) {
      setFormError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setFormError('Las contraseñas no coinciden.');
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
      setSuccessMessage(result?.message || 'Revisa tu correo e ingresa el codigo de verificacion.');
      setRegisterStep('verify');
    } catch (err) {
      setFormError(err.message || 'No se pudo registrar la cuenta.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendRegistrationCode = async () => {
    setFormError('');
    setSuccessMessage('');

    if (!registerForm.nombre.trim() || !registerForm.correo.trim() || !registerForm.password) {
      setFormError('Complete el formulario de registro antes de reenviar el codigo.');
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
      setSuccessMessage(result?.message || 'Codigo reenviado. Revise su correo y la carpeta de spam.');
    } catch (err) {
      setFormError(err.message || 'No se pudo reenviar el codigo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyRegistration = async (event) => {
    event.preventDefault();
    setFormError('');
    setSuccessMessage('');

    if (!registerForm.correo.trim() || !registerForm.token.trim()) {
      setFormError('Ingrese el codigo recibido en su correo.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await verificarRegistro({
        correo: registerForm.correo.trim().toLowerCase(),
        token: registerForm.token.trim(),
      });
      setSuccessMessage(result?.message || 'Cuenta creada correctamente. Ya puede iniciar sesion.');
      setRegisterForm({ nombre: '', correo: '', password: '', confirmPassword: '', token: '' });
      setRegisterStep('form');
      setMode('login');
    } catch (err) {
      setFormError(err.message || 'No se pudo verificar el codigo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestRecovery = async (event) => {
    event.preventDefault();
    setFormError('');
    setSuccessMessage('');

    if (!recoverForm.identifier.trim()) {
      setFormError('Ingrese su correo o usuario para recuperar la contraseña.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await solicitarRecuperacion(recoverForm.identifier.trim());
      if (result?.found) {
        setSuccessMessage(result?.message || 'Solicitud enviada.');
        setRecoverForm((prev) => ({ ...prev, token: '', nuevaPassword: '', confirmPassword: '' }));
      } else {
        setFormError(result?.message || 'No hay ningún usuario con ese correo o nombre de usuario.');
      }
    } catch (err) {
      setFormError(err.message || 'No se pudo iniciar la recuperación.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setFormError('');
    setSuccessMessage('');

    if (!recoverForm.token.trim() || !recoverForm.nuevaPassword) {
      setFormError('Ingrese el código y la nueva contraseña.');
      return;
    }

    if (recoverForm.nuevaPassword.length < 6) {
      setFormError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (recoverForm.nuevaPassword !== recoverForm.confirmPassword) {
      setFormError('Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await restablecerPassword({
        token: recoverForm.token.trim(),
        nuevaPassword: recoverForm.nuevaPassword,
      });
      setSuccessMessage(result?.message || 'Contraseña actualizada correctamente.');
      setRecoverForm({ identifier: '', token: '', nuevaPassword: '', confirmPassword: '' });
      setMode('login');
    } catch (err) {
      setFormError(err.message || 'No se pudo restablecer la contraseña.');
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
        Volver
      </Link>

      <div className="login-card">
        <div className="login-brand">
          {logoUrl ? (
            <img
              src={normalizeImageUrl(logoUrl, { width: 320 })}
              alt="Café UNA"
              className="login-logo"
            />
          ) : (
            <span className="login-brand-text">Café UNA</span>
          )}
        </div>

        {successMessage ? (
          <p className={successLooksLikeError ? 'login-error-banner' : 'login-success'}>
            {successMessage}
          </p>
        ) : null}
        {mode === 'recover' && formError ? <p className="login-error-banner">{formError}</p> : null}
        {mode === 'login' && formError ? <p className="login-error-banner">{formError}</p> : null}
        {mode === 'register' && formError ? <p className="login-error-banner">{formError}</p> : null}
        {mode === 'login' ? (
          <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="login-field">
            <label htmlFor="identifier">Correo o Usuario</label>
            <input
              id="identifier"
              name="identifier"
              type="text"
              placeholder="correo o usuario"
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
              <p id="identifier-error" className="login-field-error">{fieldErrors.identifier}</p>
            )}
          </div>

          <div className="login-field">
            <label htmlFor="password">Contraseña</label>
            <PasswordField
              id="password"
              visible={visiblePasswords.login}
              onToggle={() => togglePasswordVisibility('login')}
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearFieldError('password');
              }}
              className={fieldErrors.password ? 'input-error' : ''}
              ariaInvalid={Boolean(fieldErrors.password)}
              ariaDescribedBy={fieldErrors.password ? 'password-error' : undefined}
            />
            {fieldErrors.password && (
              <p id="password-error" className="login-field-error">
                {fieldErrors.password}
              </p>
            )}
            <button type="button" className="login-forgot-link" onClick={() => switchMode('recover')}>
              ¿Olvidó su contraseña?
            </button>
          </div>

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? 'Ingresando...' : 'INGRESAR'}
          </button>
          </form>
        ) : null}

        {mode === 'register' ? (
          registerStep === 'form' ? (
          <form className="login-form" onSubmit={handleRegister} noValidate>
            <div className="login-field">
              <label htmlFor="nombre">Nombre</label>
              <input
                id="nombre"
                type="text"
                value={registerForm.nombre}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, nombre: e.target.value }))}
                required
              />
            </div>
            <div className="login-field">
              <label htmlFor="correoRegistro">Correo</label>
              <input
                id="correoRegistro"
                type="email"
                value={registerForm.correo}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, correo: e.target.value }))}
                required
              />
            </div>
            <div className="login-field">
              <label htmlFor="passwordRegistro">Contraseña</label>
              <PasswordField
                id="passwordRegistro"
                visible={visiblePasswords.register}
                onToggle={() => togglePasswordVisibility('register')}
                autoComplete="new-password"
                value={registerForm.password}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, password: e.target.value }))}
              />
            </div>
            <div className="login-field">
              <label htmlFor="confirmPasswordRegistro">Confirmar contraseña</label>
              <PasswordField
                id="confirmPasswordRegistro"
                visible={visiblePasswords.registerConfirm}
                onToggle={() => togglePasswordVisibility('registerConfirm')}
                autoComplete="new-password"
                value={registerForm.confirmPassword}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              />
            </div>
            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? 'Enviando código...' : 'REGISTRARME'}
            </button>
            <button type="button" className="login-alt-link" onClick={() => switchMode('login')}>
              Volver a iniciar sesión
            </button>
          </form>
          ) : (
          <form className="login-form" onSubmit={handleVerifyRegistration} noValidate>
            <p className="login-verify-hint">
              {registerEmailSent ? (
                <>
                  Enviamos un codigo a <strong>{registerForm.correo}</strong>. Ingresalo para activar tu cuenta.
                  {' '}Si no lo ve, revise la carpeta de <strong>spam</strong> o <strong>correo no deseado</strong> (comun en Yahoo y Gmail).
                </>
              ) : (
                <>
                  No pudimos enviar el correo a <strong>{registerForm.correo}</strong>. Espere 3 minutos y use <strong>Reenviar codigo</strong>.
                </>
              )}
            </p>
            <div className="login-field">
              <label htmlFor="registerToken">Codigo recibido</label>
              <input
                id="registerToken"
                type="text"
                value={registerForm.token}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, token: e.target.value }))}
                required
              />
            </div>
            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? 'Verificando...' : 'VERIFICAR CUENTA'}
            </button>
            <button
              type="button"
              className="login-alt-link"
              onClick={handleResendRegistrationCode}
              disabled={isLoading}
            >
              Reenviar codigo
            </button>
            <button type="button" className="login-alt-link" onClick={() => setRegisterStep('form')}>
              Volver al formulario
            </button>
          </form>
          )
        ) : null}

        {mode === 'recover' ? (
          <div className="login-recover">
            <form className="login-form" onSubmit={handleRequestRecovery} noValidate>
              <div className="login-field">
                <label htmlFor="recoverIdentifier">Correo o Usuario</label>
                <input
                  id="recoverIdentifier"
                  type="text"
                  value={recoverForm.identifier}
                  onChange={(e) => setRecoverForm((prev) => ({ ...prev, identifier: e.target.value }))}
                  required
                />
              </div>
              <button type="submit" className="login-button" disabled={isLoading}>
                ENVIAR
              </button>
            </form>

            <form className="login-form login-form--compact" onSubmit={handleResetPassword} noValidate>
              <div className="login-field">
                <label htmlFor="recoverToken">Código recibido</label>
                <input
                  id="recoverToken"
                  type="text"
                  value={recoverForm.token}
                  onChange={(e) => setRecoverForm((prev) => ({ ...prev, token: e.target.value }))}
                  required
                />
              </div>
              <div className="login-field">
                <label htmlFor="newPassword">Nueva contraseña</label>
                <PasswordField
                  id="newPassword"
                  visible={visiblePasswords.recoverNew}
                  onToggle={() => togglePasswordVisibility('recoverNew')}
                  autoComplete="new-password"
                  value={recoverForm.nuevaPassword}
                  onChange={(e) => setRecoverForm((prev) => ({ ...prev, nuevaPassword: e.target.value }))}
                />
              </div>
              <div className="login-field">
                <label htmlFor="confirmNewPassword">Confirmar nueva contraseña</label>
                <PasswordField
                  id="confirmNewPassword"
                  visible={visiblePasswords.recoverConfirm}
                  onToggle={() => togglePasswordVisibility('recoverConfirm')}
                  autoComplete="new-password"
                  value={recoverForm.confirmPassword}
                  onChange={(e) => setRecoverForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                />
              </div>
              <button type="submit" className="login-button" disabled={isLoading}>
                ACTUALIZAR
              </button>
              <button type="button" className="login-alt-link" onClick={() => switchMode('login')}>
                Volver a iniciar sesión
              </button>
            </form>
          </div>
        ) : null}

        {mode === 'login' ? (
          <p className="login-register">
            ¿No tiene una cuenta?
            {' '}
            <button type="button" className="login-register-link" onClick={() => switchMode('register')}>
              Registrarse
            </button>
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default Login;
