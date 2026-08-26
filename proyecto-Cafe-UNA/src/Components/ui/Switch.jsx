import "./Switch.css";

export function Switch({
  id,
  checked,
  onCheckedChange,
  label,
  disabled = false,
  className = "",
}) {
  return (
    <div className={`ui-switch${disabled ? " is-disabled" : ""}${className ? ` ${className}` : ""}`}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        className={`ui-switch__track${checked ? " is-on" : ""}${disabled ? " is-disabled" : ""}`}
        onClick={() => {
          if (disabled) return;
          onCheckedChange(!checked);
        }}
      >
        <span className="ui-switch__thumb" />
      </button>
      {label ? (
        <label htmlFor={id} className="ui-switch__label">
          {label}
        </label>
      ) : null}
    </div>
  );
}
