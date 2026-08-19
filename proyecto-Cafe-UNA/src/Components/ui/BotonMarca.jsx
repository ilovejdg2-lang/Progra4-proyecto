/**
 * Botón de marca. Cambia el color en tokens.css (--cafe-500, --cafe-900).
 * variante: accent | dark | outline
 */
export function BotonMarca({
  as: Component = 'button',
  variante = 'accent',
  className = '',
  children,
  ...props
}) {
  const clases = ['btn-pill', `btn-pill--${variante}`, className]
    .filter(Boolean)
    .join(' ');

  return (
    <Component className={clases} {...props}>
      {children}
    </Component>
  );
}
