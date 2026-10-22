import { useState } from "react";

export function FotoMini({ src, alt = "", className, fallback = null }) {
  const [rota, setRota] = useState(false);
  if (!src || rota) return fallback;
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setRota(true)}
    />
  );
}
