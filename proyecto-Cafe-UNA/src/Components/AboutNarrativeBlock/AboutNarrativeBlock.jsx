export function AboutNarrativeBlock({ title, description }) {
  return (
    <article className="about-narrative">
      <div className="about-narrative__copy">
        {title ? <h2>{title}</h2> : null}
        {description ? <p>{description}</p> : null}
      </div>
    </article>
  );
}
