import { useEffect, useState } from 'react';
import { addDays, format } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import { CalendarClock } from 'lucide-react';
import { useTraducir } from '../../hooks/useTraducir';
import { useIdioma } from '../../lib/useIdioma';
import { listarDisponibilidadPublica } from '../../services/ajustesService';

const DIAS_A_MOSTRAR = 5;

function fechaLocal(iso) {
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

function horaLegible(hora) {
  const [h, m] = String(hora).split(':').map(Number);
  const sufijo = h >= 12 ? 'p. m.' : 'a. m.';
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${sufijo}`;
}

/**
 * Próximos días abiertos para comprar. Con `ubicacionId` usa el horario de ese punto de venta.
 * `variante="tarjeta"` es para usarlo fuera del detalle de producto (checkout, mis compras).
 */
export function HorarioCompra({
  ubicacionId = null,
  titulo = 'Próximos días para comprar',
  variante = 'producto',
}) {
  const { idioma } = useIdioma();
  const [dias, setDias] = useState([]);
  const tTitulo = useTraducir(titulo);

  useEffect(() => {
    let activo = true;
    const hoy = new Date();
    listarDisponibilidadPublica(
      'compras',
      format(hoy, 'yyyy-MM-dd'),
      format(addDays(hoy, 30), 'yyyy-MM-dd'),
      ubicacionId,
    )
      .then((lista) => {
        if (!activo) return;
        setDias(lista.filter((dia) => dia.disponible).slice(0, DIAS_A_MOSTRAR));
      })
      .catch(() => {
        if (activo) setDias([]);
      });
    return () => {
      activo = false;
    };
  }, [ubicacionId]);

  if (!dias.length) return null;

  const locale = idioma === 'en' ? enUS : es;
  const patron = idioma === 'en' ? 'EEEE, MMM d' : "EEEE d 'de' MMMM";

  if (variante === 'tarjeta') {
    return (
      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[length:var(--text-body)]">
        <p className="flex items-center gap-2 font-semibold text-slate-900">
          <CalendarClock size={16} aria-hidden="true" />
          {tTitulo}
        </p>
        <ul className="mt-2 grid gap-1">
          {dias.map((dia) => (
            <li key={dia.fecha} className="flex flex-wrap items-center justify-between gap-x-3 text-slate-700">
              <span className="capitalize">{format(fechaLocal(dia.fecha), patron, { locale })}</span>
              <strong className="text-slate-900">
                {`${horaLegible(dia.horaInicio)} – ${horaLegible(dia.horaFin)}`}
              </strong>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="product-detail-page__pos">
      <p className="product-detail-page__pos-title">{tTitulo}</p>
      <ul>
        {dias.map((dia) => (
          <li key={dia.fecha}>
            <span className="product-detail-page__pos-name product-detail-page__horario-dia">
              <CalendarClock size={16} aria-hidden="true" />
              {format(fechaLocal(dia.fecha), patron, { locale })}
            </span>
            <strong>{`${horaLegible(dia.horaInicio)} – ${horaLegible(dia.horaFin)}`}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
