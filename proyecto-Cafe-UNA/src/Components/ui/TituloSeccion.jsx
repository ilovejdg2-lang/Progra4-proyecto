/** Título de sección pública. Color: --cafe-titulo en tokens.css. */
export function TituloSeccion({ as: Component = 'h2', className = '', children, ...props }) {
  const clases = ['section-title', className].filter(Boolean).join(' ');
  return (
    <Component className={clases} {...props}>
      {children}
    </Component>
  );
}
