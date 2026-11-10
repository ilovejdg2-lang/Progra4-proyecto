import { ST } from "../../../Components/T/ST";

export function CategoriasLista({ categorias, total, seleccionada, onSeleccionar }) {
  const opciones = [{ valor: "todas", nombre: null, count: total }].concat(
    categorias.map((c) => ({ valor: c.nombre, nombre: c.nombre, count: c.count })),
  );

  return (
    <nav className="repo-categories" aria-labelledby="repo-categorias-titulo">
      <h2 id="repo-categorias-titulo" className="repo-categories__title">
        <ST>Categorías</ST>
      </h2>
      <ul className="repo-categories__list">
        {opciones.map((op) => {
          const activa = seleccionada === op.valor;
          return (
            <li key={op.valor}>
              <button
                type="button"
                className={`repo-category${activa ? " repo-category--active" : ""}`}
                aria-pressed={activa}
                onClick={() => onSeleccionar(op.valor)}
              >
                <span>{op.nombre ?? <ST>Todas</ST>}</span>
                <span className="repo-category__count">{op.count}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
