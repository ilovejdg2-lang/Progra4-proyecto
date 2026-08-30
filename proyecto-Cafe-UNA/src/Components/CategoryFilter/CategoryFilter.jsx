import { useTraducir } from "../../hooks/useTraducir";

function ChipLabel({ texto }) {
  return useTraducir(texto);
}

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
  const labelTodas = useTraducir(todasLabel);
  const labelTodasSub = useTraducir(todasSubLabel);
  const ariaCat = useTraducir("Filtro por categoría");
  const ariaSub = useTraducir("Filtro por subcategoría");

  if (!categorias.length) return null;

  const mostrarSub =
    valor !== "todas" && Array.isArray(subcategorias) && subcategorias.length > 0 && typeof onSubChange === "function";

  return (
    <div className="category-filter-stack">
      <div className="category-filter" role="group" aria-label={ariaCat}>
        <button
          type="button"
          className={`category-filter__chip${valor === "todas" ? " is-active" : ""}`}
          onClick={() => onChange("todas")}
        >
          {labelTodas}
        </button>
        {categorias.map((categoria) => (
          <button
            key={categoria}
            type="button"
            className={`category-filter__chip${valor === categoria ? " is-active" : ""}`}
            onClick={() => onChange(categoria)}
          >
            <ChipLabel texto={categoria} />
          </button>
        ))}
      </div>

      {mostrarSub ? (
        <div className="category-filter category-filter--sub" role="group" aria-label={ariaSub}>
          <button
            type="button"
            className={`category-filter__chip${subvalor === "todas" ? " is-active" : ""}`}
            onClick={() => onSubChange("todas")}
          >
            {labelTodasSub}
          </button>
          {subcategorias.map((subcategoria) => (
            <button
              key={subcategoria}
              type="button"
              className={`category-filter__chip${subvalor === subcategoria ? " is-active" : ""}`}
              onClick={() => onSubChange(subcategoria)}
            >
              <ChipLabel texto={subcategoria} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
