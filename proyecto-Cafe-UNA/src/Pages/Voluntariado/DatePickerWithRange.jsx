import { useEffect, useMemo, useState } from "react";
import { format, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, ArrowRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

function useMesesCalendario() {
  const [meses, setMeses] = useState(1);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const sync = () => setMeses(media.matches ? 2 : 1);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return meses;
}

export function DatePickerWithRange({ dateRange, setDateRange, error }) {
  const hoy = useMemo(() => startOfDay(new Date()), []);
  const numberOfMonths = useMesesCalendario();

  const formatearFecha = (fecha) => {
    if (!fecha) return "Por definir";
    return format(fecha, "dd 'de' MMMM, yyyy", { locale: es });
  };

  return (
    <div className={`calendario-fijo-wrapper ${error ? "calendario-fijo-wrapper--error" : ""}`}>
      <div className="calendario-resumen-fechas">
        <div className="fecha-badge fecha-badge--inicio">
          <span className="fecha-badge__label">Fecha de inicio</span>
          <div className="fecha-badge__valor">
            <CalendarIcon size={15} />
            <span>{formatearFecha(dateRange?.from)}</span>
          </div>
        </div>

        <ArrowRight size={18} className="fecha-badge__flecha" aria-hidden="true" />

        <div className="fecha-badge fecha-badge--fin">
          <span className="fecha-badge__label">Fecha de finalización</span>
          <div className="fecha-badge__valor">
            <CalendarIcon size={15} />
            <span>{formatearFecha(dateRange?.to)}</span>
          </div>
        </div>
      </div>

      <div className="calendario-fijo-contenedor">
        <DayPicker
          mode="range"
          defaultMonth={dateRange?.from || hoy}
          selected={dateRange}
          onSelect={setDateRange}
          disabled={{ before: hoy }}
          numberOfMonths={numberOfMonths}
          locale={es}
          className="calendar-shadcn-custom"
          classNames={{
            selected: "rdp-selected-custom",
            range_start: "rdp-range-start-custom",
            range_end: "rdp-range-end-custom",
            range_middle: "rdp-range-middle-custom",
          }}
        />
      </div>
    </div>
  );
}

export default DatePickerWithRange;
