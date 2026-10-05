import { Minus, Plus, Trash2 } from "lucide-react";

export function metaCarrito(item) {
  return [item?.peso, item?.subcategoria]
    .map((valor) => String(valor || "").trim())
    .filter(Boolean)
    .join(" · ");
}

export function CartLine({
  nombre,
  meta,
  precio,
  imagen,
  unidades,
  onRemove,
  onDecrease,
  onIncrease,
  increaseDisabled = false,
  removeLabel,
  ivaLabel,
  decreaseLabel,
  increaseLabel,
}) {
  return (
    <article className="cart-item">
      <button
        type="button"
        className="cart-item__remove-inline"
        onClick={onRemove}
        aria-label={removeLabel}
        title={removeLabel}
      >
        <Trash2 size={16} strokeWidth={2.2} aria-hidden="true" />
      </button>
      <div className="cart-item__media">
        {imagen ? (
          <img src={imagen} alt="" className="cart-item__image" />
        ) : (
          <div className="cart-item__image cart-item__image--placeholder" aria-hidden="true" />
        )}
      </div>
      <div className="cart-item__details">
        <div className="cart-item__name">{nombre}</div>
        {meta ? <div className="cart-item__weight">{meta}</div> : null}
        <div className="cart-item__price">{precio}</div>
        <div className="cart-item__iva">{ivaLabel}</div>
      </div>
      <div className="cart-item__bottom">
        <div className="cart-item__controls" aria-label="Controles de cantidad">
          <button
            type="button"
            className="cart-item__stepper"
            onClick={onDecrease}
            aria-label={decreaseLabel}
          >
            <Minus size={14} strokeWidth={2.8} aria-hidden="true" />
          </button>
          <span className="cart-item__units">{unidades}</span>
          <button
            type="button"
            className="cart-item__stepper"
            onClick={onIncrease}
            aria-label={increaseLabel}
            disabled={increaseDisabled}
          >
            <Plus size={14} strokeWidth={2.8} aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}
