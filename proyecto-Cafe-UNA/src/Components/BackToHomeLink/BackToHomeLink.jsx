import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { clearHomeScrollTarget, setHomeScrollTarget } from '../../lib/homeScrollTarget';
import './BackToHomeLink.css';

export const HOME_SCROLL_SECTIONS = {
  about: 'sobre-nosotros',
  products: 'productos',
  voluntariado: 'iniciativas',
};

const BackToHomeLink = ({ className = '', homeSection }) => {
  const navigate = useNavigate();

  const handleClick = (event) => {
    event.preventDefault();

    if (homeSection) {
      setHomeScrollTarget(homeSection);
    } else {
      clearHomeScrollTarget();
    }

    navigate({ to: '/' });
  };

  return (
    <Link
      to="/"
      className={['page-back-link', className].filter(Boolean).join(' ')}
      aria-label="Volver al inicio"
      onClick={handleClick}
    >
      <ArrowLeft size={16} strokeWidth={2.4} aria-hidden="true" />
      Volver al inicio
    </Link>
  );
};

export default BackToHomeLink;
