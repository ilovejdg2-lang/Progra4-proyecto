import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { ST } from "../../../Components/T/ST";
import { UiSelect } from "../../../Components/ui/Select";
import { useTraducir } from "../../../hooks/useTraducir";
import { ORDENES } from "../repositorioLogic";

const ETIQUETAS_ORDEN = {
  recientes: "Recientes",
  descargas: "Más descargados",
  az: "A–Z",
};

function BuscadorDebounced({ valor, onBuscar }) {
  const tPlaceholder = useTraducir("Buscar por título, autor o palabra clave");
  const [texto, setTexto] = useState(valor);
  const [valorPrevio, setValorPrevio] = useState(valor);

  // Reflect URL changes (back/forward, "Limpiar búsqueda") in the input.
  if (valor !== valorPrevio) {
    setValorPrevio(valor);
    setTexto(valor);
  }

  useEffect(() => {
    if (texto === valor) return undefined;
    const timer = setTimeout(() => onBuscar(texto), 350);
    return () => clearTimeout(timer);
  }, [texto, valor, onBuscar]);

  return (
    <div className="repo-search">
      <Search size={18} className="repo-search__icon" aria-hidden="true" />
      <label htmlFor="repo-buscar" className="pub-visually-hidden">
        <ST>Buscar documentos</ST>
      </label>
      <input
        id="repo-buscar"
        type="search"
        className="pub-input repo-search__input"
        placeholder={tPlaceholder}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
      />
    </div>
  );
}

function OrdenSegmentado({ orden, onCambiar }) {
  return (
    <fieldset className="repo-sort repo-only-desktop">
      <legend className="pub-visually-hidden">
        <ST>Ordenar por</ST>
      </legend>
      {ORDENES.map((op) => (
        <label key={op} className="repo-sort__option">
          <input
            type="radio"
            name="repo-orden"
            className="pub-visually-hidden"
            checked={orden === op}
            onChange={() => onCambiar(op)}
          />
          <span>
            <ST>{ETIQUETAS_ORDEN[op]}</ST>
          </span>
        </label>
      ))}
    </fieldset>
  );
}

function SelectorMovil({ etiqueta, valor, onCambiar, opciones }) {
  const tEtiqueta = useTraducir(etiqueta);
  return (
    <div className="repo-pill-select">
      <UiSelect
        ariaLabel={tEtiqueta}
        value={valor}
        onChange={onCambiar}
        options={opciones.map((op) => ({ value: op.valor, label: op.etiqueta }))}
        traducirOpciones={false}
        className="repo-pill-select__ui"
      />
    </div>
  );
}

export function BarraHerramientas({ buscar, orden, categoria, categorias, onBuscar, onOrden, onCategoria }) {
  const tTodas = useTraducir("Todas");
  const tRecientes = useTraducir(ETIQUETAS_ORDEN.recientes);
  const tDescargas = useTraducir(ETIQUETAS_ORDEN.descargas);
  const tAz = useTraducir(ETIQUETAS_ORDEN.az);
  const etiquetasOrden = { recientes: tRecientes, descargas: tDescargas, az: tAz };

  const opcionesCategoria = [{ valor: "todas", etiqueta: tTodas }].concat(
    categorias.map((c) => ({ valor: c.nombre, etiqueta: c.nombre })),
  );
  // Keep a category coming from the URL selectable even if it has no documents.
  if (!opcionesCategoria.some((o) => o.valor === categoria)) {
    opcionesCategoria.push({ valor: categoria, etiqueta: categoria });
  }

  return (
    <div className="repo-toolbar">
      <BuscadorDebounced valor={buscar} onBuscar={onBuscar} />
      <OrdenSegmentado orden={orden} onCambiar={onOrden} />
      <div className="repo-mobile-filters repo-only-mobile">
        <SelectorMovil
          etiqueta="Categoría"
          valor={categoria}
          onCambiar={onCategoria}
          opciones={opcionesCategoria}
        />
        <SelectorMovil
          etiqueta="Orden"
          valor={orden}
          onCambiar={onOrden}
          opciones={ORDENES.map((op) => ({ valor: op, etiqueta: etiquetasOrden[op] }))}
        />
      </div>
    </div>
  );
}
