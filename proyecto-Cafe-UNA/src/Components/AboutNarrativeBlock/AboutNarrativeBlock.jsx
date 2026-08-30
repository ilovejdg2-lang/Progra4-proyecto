import OptimizedImage from '../OptimizedImage/OptimizedImage';
import { ST } from '../T/ST';

export function AboutNarrativeBlock({
  eyebrow = '',
  title = '',
  description = '',
  image = '',
  reverse = false,
  className = '',
}) {
  const hasCopy = Boolean(title || description || eyebrow);
  const hasImage = Boolean(image);
  if (!hasCopy && !hasImage) return null;

  const clases = [
    'about-narrative',
    reverse ? 'about-narrative--reverse' : '',
    hasImage ? 'about-narrative--with-media' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <article className={clases}>
      {hasCopy ? (
        <div className="about-narrative__copy">
          {eyebrow ? <p className="about-narrative__eyebrow"><ST>{eyebrow}</ST></p> : null}
          {title ? <h2><ST>{title}</ST></h2> : null}
          {description ? <p><ST>{description}</ST></p> : null}
        </div>
      ) : null}
      {hasImage ? (
        <figure className="about-narrative__media">
          <OptimizedImage
            src={image}
            alt={title || ''}
            width={960}
            height={960}
            className="about-narrative__image"
          />
        </figure>
      ) : null}
    </article>
  );
}
