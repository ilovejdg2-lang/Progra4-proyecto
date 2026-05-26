import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { registrarUsuario, solicitarRecuperacion, restablecerPassword } from '../../services/authService';
import { obtenerUsuariosActivos } from '../../services/usuariosServices';
import './Login.css';

const isAdminUser = (roles = []) => roles.some((role) => role === 'SuperAdmin');

const mapAuthenticatedUser = (user) => ({
  id: user.id,
  username: user.nombre,
  email: user.correo,
  name: user.nombre,
  role: isAdminUser(user.roles) ? 'admin' : 'user',
  roles: user.roles || [],
});

const LOGO_URL = '/logo.webp';


const Login = () => {
  const [mode, setMode] = useState('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ identifier: '', password: '' });
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [registerForm, setRegisterForm] = useState({
    nombre: '',
    correo: '',
    password: '',
    confirmPassword: '',
  });

  const [recoverForm, setRecoverForm] = useState({
    identifier: '',
    token: '',
    nuevaPassword: '',
    confirmPassword: '',
  });
  const [devToken, setDevToken] = useState('');
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
      const users = await obtenerUsuariosActivos();
      const normalizedIdentifier = identifier.trim().toLowerCase();
      const foundUser = users.find((user) => (
        (
          user.nombre?.toLowerCase() === normalizedIdentifier
          || user.correo?.toLowerCase() === normalizedIdentifier
        )
        && user.passwordHash === password
      ));

      if (!foundUser) {
        setFormError('Credenciales incorrectas');
        return;
      }

      localStorage.setItem('user', JSON.stringify(mapAuthenticatedUser(foundUser)));
      window.dispatchEvent(new Event('storage'));
      window.location.href = '/';
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
    setDevToken('');
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
      await registrarUsuario({
        nombre: registerForm.nombre.trim(),
        correo: registerForm.correo.trim().toLowerCase(),
        password: registerForm.password,
      });
      setSuccessMessage('Cuenta creada correctamente. Ya puede iniciar sesión.');
      setRegisterForm({ nombre: '', correo: '', password: '', confirmPassword: '' });
      setMode('login');
    } catch (err) {
      setFormError(err.message || 'No se pudo registrar la cuenta.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestRecovery = async (event) => {
    event.preventDefault();
    setFormError('');
    setSuccessMessage('');
    setDevToken('');

    if (!recoverForm.identifier.trim()) {
      setFormError('Ingrese su correo o usuario para recuperar la contraseña.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await solicitarRecuperacion(recoverForm.identifier.trim());
      if (result?.found && result?.devToken) {
        setDevToken(result.devToken);
      } else {
        setDevToken('');
      }
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
      setDevToken('');
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
          <img
            src={LOGO_URL}
            alt="Café UNA"
            className="login-logo"
          />
        </div>

        {successMessage ? (
          <p className={successLooksLikeError ? 'login-error-banner' : 'login-success'}>
            {successMessage}
          </p>
        ) : null}
        {mode === 'recover' && formError ? <p className="login-error-banner">{formError}</p> : null}
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
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearFieldError('password');
              }}
              className={fieldErrors.password || formError ? 'input-error' : ''}
              aria-invalid={Boolean(fieldErrors.password || formError)}
              aria-describedby={fieldErrors.password || formError ? 'password-error' : undefined}
            />
            {(fieldErrors.password || formError) && (
              <p id="password-error" className="login-field-error">
                {fieldErrors.password || formError}
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
              <input
                id="passwordRegistro"
                type="password"
                value={registerForm.password}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>
            <div className="login-field">
              <label htmlFor="confirmPasswordRegistro">Confirmar contraseña</label>
              <input
                id="confirmPasswordRegistro"
                type="password"
                value={registerForm.confirmPassword}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                required
              />
            </div>
            {formError ? <p className="login-field-error">{formError}</p> : null}
            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? 'Creando cuenta...' : 'REGISTRARME'}
            </button>
            <button type="button" className="login-alt-link" onClick={() => switchMode('login')}>
              Volver a iniciar sesión
            </button>
          </form>
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

            {devToken ? (
              <p className="login-dev-token">
                Código de recuperación (modo desarrollo): <strong>{devToken}</strong>
              </p>
            ) : null}

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
                <input
                  id="newPassword"
                  type="password"
                  value={recoverForm.nuevaPassword}
                  onChange={(e) => setRecoverForm((prev) => ({ ...prev, nuevaPassword: e.target.value }))}
                  required
                />
              </div>
              <div className="login-field">
                <label htmlFor="confirmNewPassword">Confirmar nueva contraseña</label>
                <input
                  id="confirmNewPassword"
                  type="password"
                  value={recoverForm.confirmPassword}
                  onChange={(e) => setRecoverForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  required
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
