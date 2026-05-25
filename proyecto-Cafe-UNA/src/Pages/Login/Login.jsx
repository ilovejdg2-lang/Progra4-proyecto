import { useState } from 'react';
import { Link } from '@tanstack/react-router';
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
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ identifier: '', password: '' });
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const clearFieldError = (field) => {
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: '' } : prev));
    if (formError) setFormError('');
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
            <a href="#" className="login-forgot-link" onClick={(e) => e.preventDefault()}>
              ¿Olvidó su contraseña?
            </a>
          </div>

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? 'Ingresando...' : 'INGRESAR'}
          </button>
        </form>

        <p className="login-register">
          ¿No tiene una cuenta?
          {' '}
          <a href="#" className="login-register-link" onClick={(e) => e.preventDefault()}>
            Registrarse
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
