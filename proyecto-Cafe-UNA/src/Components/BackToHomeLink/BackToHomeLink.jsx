import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { HOME_SCROLL_SECTIONS, navigateToHomeSection } from '../../lib/homeScrollTarget';
import './BackToHomeLink.css';

const BackToHomeLink = ({ className = '', homeSection }) => {
  const navigate = useNavigate();

  const handleClick = (event) => {
    event.preventDefault();
    navigateToHomeSection(navigate, homeSection);
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
export { HOME_SCROLL_SECTIONS };
