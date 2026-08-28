export function CategoryFilter({
  categorias = [],
  valor = "todas",
  onChange,
  subcategorias = [],
  subvalor = "todas",
  onSubChange,
  todasLabel = "Todas",
  todasSubLabel = "Todos",
}) {
  if (!categorias.length) return null;

  const mostrarSub =
    valor !== "todas" && Array.isArray(subcategorias) && subcategorias.length > 0 && typeof onSubChange === "function";

  return (
    <div className="category-filter-stack">
      <div className="category-filter" role="group" aria-label={"Filtro por categor\u00eda"}>
        <button
          type="button"
          className={`category-filter__chip${valor === "todas" ? " is-active" : ""}`}
          onClick={() => onChange("todas")}
        >
          {todasLabel}
        </button>
        {categorias.map((categoria) => (
          <button
            key={categoria}
            type="button"
            className={`category-filter__chip${valor === categoria ? " is-active" : ""}`}
            onClick={() => onChange(categoria)}
          >
            {categoria}
          </button>
        ))}
      </div>

      {mostrarSub ? (
        <div className="category-filter category-filter--sub" role="group" aria-label={"Filtro por subcategor\u00eda"}>
          <button
            type="button"
            className={`category-filter__chip${subvalor === "todas" ? " is-active" : ""}`}
            onClick={() => onSubChange("todas")}
          >
            {todasSubLabel}
          </button>
          {subcategorias.map((subcategoria) => (
            <button
              key={subcategoria}
              type="button"
              className={`category-filter__chip${subvalor === subcategoria ? " is-active" : ""}`}
              onClick={() => onSubChange(subcategoria)}
            >
              {subcategoria}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
