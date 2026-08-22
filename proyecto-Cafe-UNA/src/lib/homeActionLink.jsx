import { Link } from '@tanstack/react-router';
import { isExternalHeroUrl } from './heroData';

export function HomeActionLink({ href, className, children }) {
  const target = href?.trim();
  if (!target || !children) return null;

  if (isExternalHeroUrl(target)) {
    return (
      <a href={target} className={className} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }

  return (
    <Link to={target} className={className}>
      {children}
    </Link>
  );
}
