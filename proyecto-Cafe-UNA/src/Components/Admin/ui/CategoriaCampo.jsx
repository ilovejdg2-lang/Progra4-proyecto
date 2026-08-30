import { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { crearCategoria, eliminarCategoria, obtenerCategorias } from "../../../services/categoriasService";
import { categoriasUnicas, esCategoriaRaiz, nombreCategoria } from "../../../lib/categorias";
import { UiSelect } from "../../ui/Select";
import { ST } from "../../T/ST";
import { useTraducir } from "../../../hooks/useTraducir";
import { t } from "../../../lib/t";

const inputCls =
  "w-full rounded-[var(--ui-radius)] border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-0";

export function CategoriaNueva({
  tipo,
  padre = "",
  onCreada,
  compacto = false,
  enMenu = false,
  placeholder = "Ej. Café de altura",
  etiqueta = "Agregar una nueva categoría",
}) {
  const [nueva, setNueva] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const tEtiqueta = useTraducir(etiqueta);
  const tPlaceholder = useTraducir(placeholder);
  const tPhMenu = useTraducir(padre ? "Nueva subcategoría" : "Nueva categoría");
  const tAgregar = useTraducir("Agregar");
  const tAgregando = useTraducir("Agregando...");

  const agregar = async () => {
    const nombre = nombreCategoria(nueva);
    if (!nombre || guardando) return;
    setGuardando(true);
    setError("");
    try {
      const creada = await crearCategoria({ nombre, tipo, padre });
      onCreada?.(creada?.nombre || nombre);
      setNueva("");
    } catch (err) {
      const mensaje = String(err?.message || "");
      if (/cannot post|not found|404/i.test(mensaje)) {
        onCreada?.(nombre);
        setNueva("");
      } else {
        setError(mensaje || "No se pudo agregar la categoría.");
      }
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className={enMenu ? "grid gap-1.5" : compacto ? "grid gap-1.5" : "grid w-full max-w-xl gap-1.5"}>
      {enMenu ? null : (
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {tEtiqueta}
        </span>
      )}
      <div className={enMenu ? "grid gap-1.5" : "flex flex-col gap-2 sm:flex-row"}>
        <input
          value={nueva}
          onChange={(event) => {
            setNueva(event.target.value);
            if (error) setError("");
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              agregar();
            }
          }}
          placeholder={enMenu ? tPhMenu : tPlaceholder}
          className={inputCls}
        />
        <button
          type="button"
          onClick={agregar}
          disabled={!nombreCategoria(nueva) || guardando}
          className="categoria-nueva__agregar inline-flex min-h-10 items-center justify-center border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {guardando ? tAgregando : tAgregar}
        </button>
      </div>
      {error ? (
        <p className="text-xs font-semibold text-red-700" role="alert">
          <ST>{error}</ST>
        </p>
      ) : null}
    </div>
  );
}

function categoriaEstaAsociada(categoria, nombresEnUso = []) {
  if (Number(categoria?.usos) > 0) return true;
  const nombre = nombreCategoria(categoria?.nombre).toLowerCase();
  if (!nombre) return false;
  return (nombresEnUso || []).some(
    (item) => nombreCategoria(item).toLowerCase() === nombre,
  );
}

export function CategoriaOpcionBorrar({ categoria, nombresEnUso = [], onEliminada }) {
  const [borrando, setBorrando] = useState(false);
  if (!categoria?.id) return null;
  const asociada = categoriaEstaAsociada(categoria, nombresEnUso);

  const borrar = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (asociada || borrando) return;
    setBorrando(true);
    try {
      await eliminarCategoria(categoria.id);
      onEliminada?.(categoria.nombre);
    } catch (err) {
      window.alert(t(err?.message || "No se pudo borrar la categoría."));
    } finally {
      setBorrando(false);
    }
  };

  return (
    <button
      type="button"
      onClick={borrar}
      onMouseDown={(event) => event.stopPropagation()}
      disabled={asociada || borrando}
      title={
        asociada
          ? "No se puede borrar: está asociada a un registro."
          : "Borrar categoría"
      }
      aria-label={
        asociada
          ? `No se puede borrar ${categoria.nombre}`
          : `Borrar ${categoria.nombre}`
      }
      className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-500"
    >
      <Trash2 className="size-3.5" aria-hidden="true" />
    </button>
  );
}

export function CategoriaCampo({
  tipo,
  value = "",
  onChange,
  extras = [],
  label = "Categoría",
  permitirCrear = false,
  onCreada,
  padre,
  placeholderNueva,
  etiquetaNueva,
  vacioLabel = "Sin categoría",
}) {
  const [registros, setRegistros] = useState([]);
  const soloRaices = padre === undefined;

  useEffect(() => {
    let activo = true;
    const padreQuery = soloRaices ? "" : nombreCategoria(padre);
    if (!soloRaices && !padreQuery) {
      setRegistros([]);
      return () => {
        activo = false;
      };
    }
    obtenerCategorias(tipo, padreQuery)
      .then((lista) => {
        if (!activo) return;
        setRegistros(soloRaices ? lista.filter(esCategoriaRaiz) : lista);
      })
      .catch(() => {
        if (activo) setRegistros([]);
      });
    return () => {
      activo = false;
    };
  }, [tipo, padre, soloRaices]);

  const lista = useMemo(() => {
    const nombresApi = registros.map((item) => item.nombre);
    return categoriasUnicas([...nombresApi, ...extras, value].map((nombre) => ({ categoria: nombre })));
  }, [registros, extras, value]);

  return (
    <div className="grid gap-2">
      <div className="grid gap-2 text-sm font-medium text-slate-700">
        <ST>{label}</ST>
        <UiSelect
          ariaLabel={label}
          value={value}
          onChange={onChange}
          disabled={!soloRaices && !nombreCategoria(padre)}
          options={[
            { value: "", label: vacioLabel },
            ...lista.map((categoria) => ({ value: categoria, label: categoria })),
          ]}
        />
      </div>
      {permitirCrear && (soloRaices || nombreCategoria(padre)) ? (
        <CategoriaNueva
          tipo={tipo}
          padre={soloRaices ? "" : nombreCategoria(padre)}
          compacto
          placeholder={placeholderNueva}
          etiqueta={etiquetaNueva}
          onCreada={(nombre) => {
            setRegistros((actual) => {
              const ya = actual.some(
                (item) => nombreCategoria(item.nombre).toLowerCase() === nombre.toLowerCase(),
              );
              if (ya) return actual;
              return [...actual, { id: "", nombre, padre: soloRaices ? "" : nombreCategoria(padre), usos: 0 }];
            });
            onChange(nombre);
            onCreada?.(nombre);
          }}
        />
      ) : null}
    </div>
  );
}
