import { useState } from "react";
import { normalizeImageUrl } from "../../lib/imageUtils";
import "./OptimizedImage.css";

function OptimizedImageFrame({
  alt,
  className,
  width,
  height,
  priority,
  resolvedSrc,
  resolvedFallback,
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [activeSrc, setActiveSrc] = useState(resolvedSrc);
  const showImage = activeSrc && !failed;

  return (
    <div
      className={`optimized-image ${className}`.trim()}
      style={width && height ? { aspectRatio: `${width} / ${height}` } : undefined}
    >
      {!loaded && showImage ? <span className="optimized-image__placeholder" aria-hidden="true" /> : null}
      {showImage ? (
        <img
          key={activeSrc}
          src={activeSrc}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          className={`optimized-image__img ${loaded ? "optimized-image__img--loaded" : ""}`}
          onLoad={() => setLoaded(true)}
          onError={() => {
            if (resolvedFallback && activeSrc !== resolvedFallback) {
              setActiveSrc(resolvedFallback);
              setLoaded(false);
              return;
            }
            setFailed(true);
            setLoaded(true);
          }}
        />
      ) : (
        <span className="optimized-image__fallback" role="img" aria-label={alt || "Imagen no disponible"} />
      )}
    </div>
  );
}

const OptimizedImage = ({
  src,
  alt = "",
  className = "",
  width,
  height,
  priority = false,
  fallbackSrc = "",
}) => {
  const resolvedSrc = normalizeImageUrl(src, { width: width ?? 800 });
  const resolvedFallback = fallbackSrc ? normalizeImageUrl(fallbackSrc, { width: width ?? 800 }) : "";

  return (
    <OptimizedImageFrame
      key={`${resolvedSrc}|${resolvedFallback}`}
      alt={alt}
      className={className}
      width={width}
      height={height}
      priority={priority}
      resolvedSrc={resolvedSrc}
      resolvedFallback={resolvedFallback}
    />
  );
};

export default OptimizedImage;
