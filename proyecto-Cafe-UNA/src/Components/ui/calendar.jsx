import * as React from "react";
import { DayPicker } from "react-day-picker";
import { es } from "date-fns/locale";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import "react-day-picker/style.css";
import "./calendar.css";

export function Calendar({
  className = "",
  showOutsideDays = true,
  locale = es,
  captionLayout = "dropdown",
  navLayout = "around",
  startMonth = new Date(2025, 0, 1),
  endMonth = new Date(2030, 11, 31),
  components = {},
  formatters = {},
  ...props
}) {
  return (
    <DayPicker
      locale={locale}
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      navLayout={navLayout}
      startMonth={startMonth}
      endMonth={endMonth}
      className={`shadcn-calendar ${className}`}
      formatters={{
        formatWeekdayName: (date) => {
          const name = format(date, "cccccc", { locale });
          return name.charAt(0).toUpperCase() + name.slice(1);
        },
        formatMonthDropdown: (month) => {
          try {
            const d = month instanceof Date ? month : typeof month === "number" ? new Date(2026, month, 1) : new Date(month);
            if (!d || isNaN(d.getTime())) return String(month || "");
            const name = format(d, "MMM", { locale });
            return name.replace(".", "").toLowerCase();
          } catch {
            return String(month || "");
          }
        },
        ...formatters,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClass, ...chevronProps }) => {
          if (orientation === "left") {
            return <ChevronLeft className={`size-4 text-slate-700 ${chevronClass || ""}`} {...chevronProps} />;
          }
          if (orientation === "right") {
            return <ChevronRight className={`size-4 text-slate-700 ${chevronClass || ""}`} {...chevronProps} />;
          }
          if (orientation === "down") {
            return <ChevronDown className={`size-3 text-slate-500 ml-0.5 inline-block ${chevronClass || ""}`} {...chevronProps} />;
          }
          if (orientation === "up") {
            return <ChevronUp className={`size-3 text-slate-500 ml-0.5 inline-block ${chevronClass || ""}`} {...chevronProps} />;
          }
          return null;
        },
        ...components,
      }}
      {...props}
    />
  );
}

export default Calendar;
