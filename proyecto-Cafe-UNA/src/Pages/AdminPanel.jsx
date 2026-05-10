
import { useNavigate } from '@tanstack/react-router';
import './AdminPanel.css';

const AdminPanel = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('storage'));
    window.location.href = '/';
  };

  if (!user || user.role !== 'admin') {
    navigate({ to: '/' });
    return null;
  }

  return (
    <div className="admin-panel">
      <h2>Panel Administrativo</h2>
      <p>Bienvenido, {user.name}!</p>
      <p>Aquí puedes gestionar la aplicación.</p>
      <button onClick={handleLogout}>Cerrar Sesión</button>
    </div>
  );
};

export default AdminPanel;