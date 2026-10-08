import { useEffect, useMemo, useState } from "react";
import { ListChecks, Search } from "lucide-react";

import { claseInputCatalogo, PanelLista } from "../../../Components/Admin/ui/CatalogoPaneles";
import { SelectorIcono } from "../../../Components/Admin/ui/SelectorIcono";
import { ST } from "../../../Components/T/ST";
import { recargarIconosSitio } from "../../../hooks/useIconosSitio";
import { useTraducir } from "../../../hooks/useTraducir";
import { sanitizeUserFacingError } from "../../../lib/formLimits";
import { ICONOS_CATALOGO, LUGARES_CON_ICONO, iconoPorClave } from "../../../lib/iconosCatalogo";
import { GRUPOS_ICONOS_SITIO } from "../../../lib/iconosSitio";
import {
  actualizarItemCatalogo,
  crearItemCatalogo,
  eliminarItemCatalogo,
  listarCatalogo,
  TIPOS_CATALOGO,
} from "../../../services/catalogosService";

const PESTANAS = [
  {
    id: TIPOS_CATALOGO.presentacion,
    label: "Presentaciones",
    ayuda: "Pesos o tamaños que se pueden elegir al crear o editar un producto (por ejemplo 250 g, 500 g, 1 kg).",
    placeholder: "Ej. 340",
    presentacion: true,
  },
  {
    id: TIPOS_CATALOGO.unidadPresentacion,
    label: "Unidades de presentación",
    ayuda: "Unidades que se pueden elegir al crear una presentación (por ejemplo g, kg, ml, L, unidad).",
    placeholder: "Ej. oz",
  },
  {
    id: TIPOS_CATALOGO.metodoPago,
    label: "Métodos de pago",
    ayuda: "Métodos disponibles en Ventas presenciales. Las ventas ya registradas mantienen el nombre que tenían.",
    placeholder: "Ej. Depósito",
  },
  {
    id: "iconos",
    label: "Íconos",
    ayuda: "Cambiá los íconos del sitio y mirá los íconos disponibles con su nombre y dónde se usan.",
  },
];

const TIPO_ICONO_SITIO = TIPOS_CATALOGO.iconoSitio;

function PanelIconosSitio({ onMessage, onError }) {
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState("");
  const porLugar = useMemo(() => new Map(items.map((item) => [item.nombre, item])), [items]);

  useEffect(() => {
    let activo = true;
    listarCatalogo(TIPO_ICONO_SITIO, { forzar: true })
      .then((lista) => {
        if (activo) setItems(lista);
      })
      .catch((err) => {
        onError(sanitizeUserFacingError(err?.message || "No se pudieron cargar los íconos del sitio."));
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [onError]);

  const elegir = async (lugar, clave) => {
    const actual = porLugar.get(lugar);
    if ((actual?.icono || "") === clave) return;
    setGuardando(lugar);
    try {
      if (actual && !clave) await eliminarItemCatalogo(TIPO_ICONO_SITIO, actual.id);
      else if (actual) await actualizarItemCatalogo(TIPO_ICONO_SITIO, actual.id, { icono: clave });
      else await crearItemCatalogo(TIPO_ICONO_SITIO, { nombre: lugar, icono: clave });
      setItems(await recargarIconosSitio());
      onMessage(clave ? "Ícono actualizado." : "Se volvió al ícono original.");
    } catch (err) {
      onError(sanitizeUserFacingError(err?.message || "No se pudo guardar el ícono."));
    } finally {
      setGuardando("");
    }
  };

  if (cargando) {
    return (
      <p className="text-[length:var(--text-body)] text-slate-500">
        <ST>Cargando...</ST>
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {GRUPOS_ICONOS_SITIO.map(({ grupo, lugares }) => (
        <section key={grupo} className="flex flex-col gap-2">
          <h3 className="text-[length:var(--text-body)] font-semibold text-slate-800">
            <ST>{grupo}</ST>
          </h3>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {lugares.map(({ id, etiqueta, Original }) => {
              const elegido = porLugar.get(id)?.icono || "";
              return (
                <li key={id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-2 pr-3">
                  <SelectorIcono
                    valor={elegido}
                    IconoActual={iconoPorClave(elegido) || Original}
                    onElegir={(clave) => elegir(id, clave)}
                    disabled={guardando === id}
                    etiquetaAuto="Ícono original"
                  />
                  <span className="min-w-0 truncate text-[length:var(--text-body)] text-slate-700">
                    <ST>{etiqueta}</ST>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

function PanelIconos({ onMessage, onError }) {
  const [busqueda, setBusqueda] = useState("");
  const tBuscar = useTraducir("Buscar ícono por nombre...");
  const tDonde = useTraducir("Dónde se pueden elegir");
  const filtro = busqueda.trim().toLowerCase();
  const visibles = ICONOS_CATALOGO.filter(
    ({ clave, etiqueta }) => !filtro || etiqueta.toLowerCase().includes(filtro) || clave.includes(filtro),
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="mb-2 text-[length:var(--text-body)] font-semibold text-slate-700">{tDonde}</p>
        <ul className="flex flex-col gap-1.5">
          {LUGARES_CON_ICONO.map(({ lugar, detalle }) => (
            <li key={lugar} className="text-[length:var(--text-body)] text-slate-600">
              <span className="font-semibold text-slate-800"><ST>{lugar}</ST></span>
              {" — "}
              <ST>{detalle}</ST>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="text-[length:var(--text-subtitle)] font-bold text-slate-950">
          <ST>Íconos del sitio</ST>
        </h3>
        <p className="text-[length:var(--text-body)] text-slate-500">
          <ST>Tocá un ícono para cambiarlo. «Ícono original» lo deja como venía.</ST>
        </p>
      </div>
      <PanelIconosSitio onMessage={onMessage} onError={onError} />

      <h3 className="border-t border-slate-100 pt-5 text-[length:var(--text-subtitle)] font-bold text-slate-950">
        <ST>Íconos disponibles</ST>
      </h3>
      <label className="relative block">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
        <input
          className={`${claseInputCatalogo} pl-10`}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder={tBuscar}
          aria-label={tBuscar}
        />
      </label>

      {visibles.length === 0 ? (
        <p className="text-[length:var(--text-body)] text-slate-500">
          <ST>No hay íconos con ese nombre.</ST>
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {visibles.map(({ clave, etiqueta, Icono }) => (
            <li key={clave} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-800">
                <Icono className="size-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[length:var(--text-body)] font-semibold text-slate-900">
                  <ST>{etiqueta}</ST>
                </span>
                <span className="block truncate text-[length:var(--text-body)] text-slate-500">{clave}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CatalogosSistema({ onMessage, onError }) {
  const [pestana, setPestana] = useState(PESTANAS[0].id);
  const actual = PESTANAS.find((p) => p.id === pestana) || PESTANAS[0];
  const tTitulo = useTraducir(actual.label);
  const tAyuda = useTraducir(actual.ayuda);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white">
      <div className="flex flex-wrap gap-2 border-b border-slate-100 px-4 py-4 sm:px-6" role="tablist">
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={pestana === p.id}
            onClick={() => {
              setPestana(p.id);
              onMessage("");
            }}
            className={`min-h-[var(--control-height)] rounded-full border px-4 text-[length:var(--text-body)] font-semibold ${
              pestana === p.id
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <ST>{p.label}</ST>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 px-4 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700">
            <ListChecks className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-[length:var(--text-subtitle)] font-bold text-slate-950">{tTitulo}</h2>
            <p className="text-[length:var(--text-body)] text-slate-500">{tAyuda}</p>
          </div>
        </div>

        {pestana === "iconos" ? (
          <PanelIconos onMessage={onMessage} onError={onError} />
        ) : (
          <PanelLista
            key={pestana}
            tipo={pestana}
            placeholder={actual.placeholder}
            presentacion={Boolean(actual.presentacion)}
            onMessage={onMessage}
            onError={onError}
          />
        )}
      </div>
    </section>
  );
}
