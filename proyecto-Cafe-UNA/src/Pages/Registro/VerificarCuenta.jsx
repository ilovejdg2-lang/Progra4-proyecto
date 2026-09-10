import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { ST } from '../../Components/T/ST';
import { useTraducir } from '../../hooks/useTraducir';
import { sanitizeUserFacingError } from '../../lib/formLimits';
import { normalizeImageUrl } from '../../lib/imageUtils';
import { verificarRegistro } from '../../services/authService';
import { obtenerNavbar } from '../../services/informacionService';
import '../Login/Login.css';
import './Registro.css';

const VerificarCuenta = () => {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) || {};
  const correoQuery = String(search.correo || search.Correo || '').trim().toLowerCase();
  const tokenQuery = String(search.token || search.Token || '').trim();

  const tVolver = useTraducir('Volver');
  const tTitulo = useTraducir('Verificar cuenta');
  const tHint = useTraducir('Ingresá el código que enviamos a tu correo para activar la cuenta.');
  const tCodigo = useTraducir('Código de verificación');
  const tCorreo = useTraducir('Correo');
  const tVerificar = useTraducir('Verificar cuenta');
  const tVerificando = useTraducir('Verificando...');
  const tExito = useTraducir('¡Cuenta verificada! Ya puedes iniciar sesión.');
  const tIrLogin = useTraducir('Ir a iniciar sesión');
  const tReenviar = useTraducir('Volver al registro para reenviar el correo');
  const tErrorGenerico = useTraducir('No se pudo verificar la cuenta.');

  const [logoUrl, setLogoUrl] = useState('');
  const [correo, setCorreo] = useState(correoQuery);
  const [token, setToken] = useState(tokenQuery);
  const [status, setStatus] = useState(tokenQuery ? 'loading' : 'form');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    obtenerNavbar()
      .then((data) => {
        if (!cancelled) setLogoUrl(data?.logoUrl || data?.LogoUrl || '');
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!correo && typeof sessionStorage !== 'undefined') {
      const saved = sessionStorage.getItem('registroClienteCorreo') || '';
      if (saved) setCorreo(saved);
    }
  }, [correo]);

  useEffect(() => {
    if (!tokenQuery || !correoQuery) return undefined;
    let cancelled = false;

    (async () => {
      try {
        const result = await verificarRegistro({
          correo: correoQuery,
          token: tokenQuery,
        });
        if (cancelled) return;
        setStatus('success');
        setMessage(result?.message || tExito);
        sessionStorage.removeItem('registroClienteCorreo');
      } catch (err) {
        if (cancelled) return;
        const msg = sanitizeUserFacingError(err.message || tErrorGenerico);
        if (/ya existe|ya está|ya esta/i.test(msg)) {
          setStatus('success');
          setMessage(tExito);
        } else {
          setStatus('error');
          setError(msg);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [correoQuery, tokenQuery, tExito, tErrorGenerico]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const correoValor = correo.trim().toLowerCase();
    const tokenValor = token.trim();
    if (!correoValor || !tokenValor) {
      setError('Correo y código son obligatorios.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const result = await verificarRegistro({
        correo: correoValor,
        token: tokenValor,
      });
      setStatus('success');
      setMessage(result?.message || tExito);
      sessionStorage.removeItem('registroClienteCorreo');
    } catch (err) {
      const msg = sanitizeUserFacingError(err.message || tErrorGenerico);
      if (/ya existe|ya está|ya esta/i.test(msg)) {
        setStatus('success');
        setMessage(tExito);
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

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

        {status === 'loading' ? (
          <p className="registro-subtitle"><ST>{tVerificando}</ST></p>
        ) : null}

        {status === 'success' ? (
          <>
            <p className="login-success" role="status"><ST>{message || tExito}</ST></p>
            <button type="button" className="login-button" onClick={() => navigate({ to: '/login' })}>
              <ST>{tIrLogin}</ST>
            </button>
          </>
        ) : null}

        {status === 'error' || status === 'form' ? (
          <>
            <p className="registro-subtitle"><ST>{tHint}</ST></p>
            {error ? <p className="login-error-banner" role="alert"><ST>{error}</ST></p> : null}
            <form className="login-form" onSubmit={handleSubmit} noValidate>
              <div className="login-field">
                <label htmlFor="correo"><ST>{tCorreo}</ST></label>
                <input
                  id="correo"
                  type="email"
                  value={correo}
                  onChange={(ev) => setCorreo(ev.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
              <div className="login-field">
                <label htmlFor="token"><ST>{tCodigo}</ST></label>
                <input
                  id="token"
                  value={token}
                  onChange={(ev) => setToken(ev.target.value.toUpperCase())}
                  autoComplete="one-time-code"
                  required
                />
              </div>
              <button type="submit" className="login-button" disabled={submitting}>
                <ST>{submitting ? tVerificando : tVerificar}</ST>
              </button>
            </form>
            <p className="login-footer">
              <Link to="/registro" className="login-register-link"><ST>{tReenviar}</ST></Link>
            </p>
          </>
        ) : null}
      </div>
    </main>
  );
};

export default VerificarCuenta;
