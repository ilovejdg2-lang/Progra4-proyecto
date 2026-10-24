import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import { CalendarClock, Clock } from 'lucide-react';
import { useTraducir } from '../../hooks/useTraducir';
import { useIdioma } from '../../lib/useIdioma';
import { listarCierresCompra } from '../../services/ajustesService';

function fechaLocal(iso) {
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Fechas registradas en las que no se recogen pedidos.
 * Si no hay ninguna, no renderiza nada.
 */
export function HorarioCompra({
  ubicacionId = null,
  titulo = 'Fechas sin retiro de pedidos',
  variante = 'producto',
}) {
  const incrustada = variante === 'incrustada';
  const { idioma } = useIdioma();
  const [dias, setDias] = useState([]);
  const [listo, setListo] = useState(false);
  const tTitulo = useTraducir(titulo);
  const tSinMotivo = useTraducir('No se recogerán pedidos');

  useEffect(() => {
    let activo = true;
    setListo(false);
    listarCierresCompra(ubicacionId)
      .then((lista) => {
        if (!activo) return;
        setDias(Array.isArray(lista) ? lista : []);
      })
      .catch(() => {
        if (activo) setDias([]);
      })
      .finally(() => {
        if (activo) setListo(true);
      });
    return () => {
      activo = false;
    };
  }, [ubicacionId]);

  if (!listo || dias.length === 0) return null;

  const locale = idioma === 'en' ? enUS : es;
  const capital = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);
  const etiqueta = (fecha) => {
    const dia = format(fecha, 'EEEE', { locale });
    const mes = format(fecha, 'MMMM', { locale });
    if (idioma === 'en') return `${capital(dia)}, ${format(fecha, 'MMM d', { locale })}`;
    return `${capital(dia)} ${format(fecha, 'd')} de ${capital(mes)}`;
  };
  const motivo = (dia) => String(dia.nota || '').trim() || tSinMotivo;

  if (incrustada) {
    return (
      <div className="checkout-retiro">
        <p className="checkout-retiro__title">
          <Clock size={16} aria-hidden="true" />
          {tTitulo}
        </p>
        <ul>
          {dias.map((dia) => (
            <li key={`${dia.fecha}-${dia.ubicacionId ?? 'general'}`} className="checkout-retiro__row">
              <strong>{etiqueta(fechaLocal(dia.fecha))}</strong>
              <span>{motivo(dia)}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="mt-3 min-w-0 max-w-full rounded-2xl border border-[#efe4d8] bg-[#fbf8f5] px-3 py-3 text-[length:var(--text-body)] sm:px-4">
      <p className="flex min-w-0 items-start gap-2 font-semibold leading-snug text-slate-900">
        <CalendarClock className="mt-0.5 shrink-0" size={16} aria-hidden="true" />
        <span className="min-w-0 break-words">{tTitulo}</span>
      </p>
      <ul className="mt-2 grid min-w-0 gap-2">
        {dias.map((dia) => (
          <li
            key={`${dia.fecha}-${dia.ubicacionId ?? 'general'}`}
            className="flex min-w-0 flex-col gap-0.5 text-slate-700"
          >
            <strong className="break-words text-slate-900">{etiqueta(fechaLocal(dia.fecha))}</strong>
            <span className="min-w-0 break-words">{motivo(dia)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
