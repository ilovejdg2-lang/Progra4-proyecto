import { Switch } from "../../../../Components/ui/Switch";

export function ProductCatalogFeaturedToggle({
  producto,
  disabled,
  onToggle,
  variant = "table",
  compact = false,
}) {
  const esMovil = variant === "mobile";
  const etiqueta = compact
    ? undefined
    : esMovil
      ? producto.esDestacado
        ? "Destacado en inicio"
        : "Marcar como destacado"
      : producto.esDestacado
        ? "Sí"
        : "No";

  return (
    <Switch
      id={`destacado-${producto.id}`}
      checked={Boolean(producto.esDestacado)}
      disabled={disabled}
      onCheckedChange={() => onToggle()}
      label={etiqueta}
      ariaLabel={producto.esDestacado ? "Quitar de destacados" : "Marcar como destacado"}
    />
  );
}
