/** Pastilla de sección. Color: --cafe-600 en tokens.css. */
export function EtiquetaSeccion({ as: Component = 'p', className = '', children, ...props }) {
  const clases = ['section-eyebrow', className].filter(Boolean).join(' ');
  return (
    <Component className={clases} {...props}>
      {children}
    </Component>
  );
}
