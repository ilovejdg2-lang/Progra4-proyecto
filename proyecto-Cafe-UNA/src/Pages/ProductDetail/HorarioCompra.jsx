import { useEffect, useState } from 'react';
import { addDays, format } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import { CalendarClock, Clock } from 'lucide-react';
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
  const [cargando, setCargando] = useState(true);
  const tTitulo = useTraducir(titulo);
  const tCargando = useTraducir('Cargando horario de retiro...');
  const tSinDias = useTraducir('Este punto no tiene días de retiro publicados por ahora.');

  useEffect(() => {
    let activo = true;
    setCargando(true);
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
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [ubicacionId]);

  if (variante !== 'tarjeta' && variante !== 'incrustada' && !dias.length) return null;

  const locale = idioma === 'en' ? enUS : es;
  const capital = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);
  const partesFecha = (fecha) => {
    const dia = capital(format(fecha, 'EEEE', { locale }));
    const mes = format(fecha, 'MMMM', { locale });
    if (idioma === 'en') return { cuando: dia, fecha: format(fecha, 'MMM d', { locale }) };
    return { cuando: dia, fecha: `${format(fecha, 'd')} de ${mes}` };
  };

  if (variante === 'incrustada') {
    const etiqueta = (fecha) => {
      const dia = format(fecha, 'EEEE', { locale });
      const mes = format(fecha, 'MMMM', { locale });
      const capital = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);
      if (idioma === 'en') return `${capital(dia)}, ${format(fecha, 'MMM d', { locale })}`;
      return `${capital(dia)} ${format(fecha, 'd')} de ${capital(mes)}`;
    };
    return (
      <div className="checkout-retiro">
        <p className="checkout-retiro__title">
          <Clock size={16} aria-hidden="true" />
          {tTitulo}
        </p>
        {cargando ? (
          <p className="checkout-retiro__status">{tCargando}</p>
        ) : dias.length === 0 ? (
          <p className="checkout-retiro__status">{tSinDias}</p>
        ) : (
          <ul>
            {dias.map((dia) => (
              <li key={dia.fecha} className="checkout-retiro__row">
                <span>{etiqueta(fechaLocal(dia.fecha))}</span>
                <strong>{`${horaLegible(dia.horaInicio)} – ${horaLegible(dia.horaFin)}`}</strong>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (variante === 'tarjeta') {
    return (
      <div className="rounded-2xl border border-[#efe4d8] bg-[#fbf8f5] px-4 py-3 text-[length:var(--text-body)]">
        <p className="flex items-center gap-2 font-semibold text-slate-900">
          <CalendarClock size={16} aria-hidden="true" />
          {tTitulo}
        </p>
        {cargando ? (
          <p className="mt-2 text-slate-500">{tCargando}</p>
        ) : dias.length === 0 ? (
          <p className="mt-2 text-slate-500">{tSinDias}</p>
        ) : (
          <ul className="mt-2 grid gap-1">
            {dias.map((dia) => {
              const fecha = partesFecha(fechaLocal(dia.fecha));
              return (
              <li key={dia.fecha} className="flex flex-wrap items-center justify-between gap-x-3 text-slate-700">
                <span>{`${fecha.cuando}, ${fecha.fecha}`}</span>
                <strong className="text-slate-900">
                  {`${horaLegible(dia.horaInicio)} – ${horaLegible(dia.horaFin)}`}
                </strong>
              </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="product-detail-page__pos">
      <p className="product-detail-page__pos-title">{tTitulo}</p>
      <ul>
        {dias.map((dia) => {
          const fecha = partesFecha(fechaLocal(dia.fecha));
          return (
          <li key={dia.fecha}>
            <span className="product-detail-page__pos-name product-detail-page__horario-dia">
              <CalendarClock size={16} aria-hidden="true" />
              <span className="product-detail-page__horario-texto">
                <span>{fecha.cuando}</span>
                <span>{fecha.fecha}</span>
              </span>
            </span>
            <strong>{`${horaLegible(dia.horaInicio)} – ${horaLegible(dia.horaFin)}`}</strong>
          </li>
          );
        })}
      </ul>
    </div>
  );
}
