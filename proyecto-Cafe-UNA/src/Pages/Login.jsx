import { useState } from 'react';
import './Login.css';

const JSONBIN_USERS_URL = `https://api.jsonbin.io/v3/b/${import.meta.env.VITE_JSONBIN_USERS_BIN_ID_USUARIOS}/latest`;

const isAdminUser = (roles = []) => roles.some((role) => role === 'SuperAdmin');

const mapAuthenticatedUser = (user) => ({
  id: user.id,
  username: user.nombre,
  email: user.correo,
  name: user.nombre,
  role: isAdminUser(user.roles) ? 'admin' : 'user',
  roles: user.roles || [],
});

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !import.meta.env.VITE_JSONBIN_USERS_BIN_ID_USUARIOS
      || !import.meta.env.VITE_JSONBIN_ACCESS_KEY_LECTURA_USUARIOS
    ) {
      setError('Falta configurar las variables de entorno del login.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(JSONBIN_USERS_URL, {
        headers: {
          'X-Access-Key': import.meta.env.VITE_JSONBIN_ACCESS_KEY_LECTURA_USUARIOS,
        },
      });

      if (!response.ok) {
        throw new Error('No se pudo consultar JSONBin.');
      }

      const data = await response.json();
      const users = Array.isArray(data) ? data : data.record || [];
      const normalizedUsername = username.trim().toLowerCase();
      const foundUser = users.find((user) => (
        user.estado === 'activo'
        && (
          user.nombre?.toLowerCase() === normalizedUsername
          || user.correo?.toLowerCase() === normalizedUsername
        )
        && user.passwordHash === password
      ));

      if (!foundUser) {
        setError('Credenciales incorrectas');
        return;
      }

      localStorage.setItem('user', JSON.stringify(mapAuthenticatedUser(foundUser)));
      window.dispatchEvent(new Event('storage'));
      window.location.href = '/';
    } catch (err) {
      setError(err.message || 'Ocurrió un error al iniciar sesión.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>{'Iniciar Sesi\u00f3n'}</h2>
        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="username">Usuario</label>
          <input
            id="username"
            name="username"
            type="text"
            required
            placeholder="Usuario"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <label htmlFor="password">{'Contrase\u00f1a'}</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            placeholder={'Contrase\u00f1a'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? 'Ingresando...' : 'Iniciar Sesi\u00f3n'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
