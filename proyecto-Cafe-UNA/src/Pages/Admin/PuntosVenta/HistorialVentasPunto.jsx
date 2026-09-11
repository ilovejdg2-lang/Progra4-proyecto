import { useParams } from "@tanstack/react-router";

import HistorialVentas from "../HistorialVentas/HistorialVentas";

export default function HistorialVentasPunto() {
  const { locationCode } = useParams({ strict: false });
  return <HistorialVentas locationCode={String(locationCode || "").toUpperCase()} />;
}
