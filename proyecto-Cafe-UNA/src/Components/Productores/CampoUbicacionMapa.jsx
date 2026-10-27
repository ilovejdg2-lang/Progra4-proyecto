import { useEffect, useRef, useState } from "react";
import { Crosshair, MapPin } from "lucide-react";

import { ST } from "../T/ST";
import { resolverUbicacionEnlace } from "../../services/propuestasProductoresService";
import { validarEnlaceUbicacion } from "../../lib/propuestaProductor";
import {
  CR_BOUNDS,
  CR_CENTER,
  estaEnCostaRica,
  extraerCoordenadasDeEnlace,
  MENSAJE_SOLO_COSTA_RICA,
} from "../../lib/ubicacionMaps";
import "./CampoUbicacionMapa.css";

export default function CampoUbicacionMapa({
  enlaceUbicacion = "",
  latitud = "",
  longitud = "",
  onChangeCoords,
}) {
  const contenedorRef = useRef(null);
  const mapaRef = useRef(null);
  const marcadorRef = useRef(null);
  const leafletRef = useRef(null);
  const onChangeRef = useRef(onChangeCoords);
  const ultimoEnlaceResuelto = useRef("");
  const [listo, setListo] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [esError, setEsError] = useState(false);
  const [resolviendo, setResolviendo] = useState(false);

  onChangeRef.current = onChangeCoords;

  const latNum = Number(latitud);
  const lngNum = Number(longitud);
  const tienePin = estaEnCostaRica(latNum, lngNum);

  useEffect(() => {
    let cancelado = false;
    let mapa;

    async function montar() {
      const leaflet = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      if (cancelado || !contenedorRef.current) return;
      const L = leaflet.default || leaflet;
      leafletRef.current = L;
      mapa = L.map(contenedorRef.current, {
        center: CR_CENTER,
        zoom: 8,
        minZoom: 7,
        maxZoom: 17,
        zoomControl: true,
        scrollWheelZoom: false,
        maxBounds: CR_BOUNDS,
        maxBoundsViscosity: 1,
      });
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ",
          maxZoom: 16,
        },
      ).addTo(mapa);
      mapa.fitBounds(CR_BOUNDS, { padding: [20, 20] });
      mapa.on("click", (event) => {
        const { lat, lng } = event.latlng;
        if (!estaEnCostaRica(lat, lng)) {
          setEsError(true);
          setMensaje("Seleccioná un punto dentro de Costa Rica.");
          return;
        }
        setEsError(false);
        setMensaje("Ubicación confirmada en el mapa. Ya podés enviar la propuesta.");
        onChangeRef.current?.({ latitud: String(lat), longitud: String(lng) });
      });
      mapaRef.current = mapa;
      setListo(true);
      requestAnimationFrame(() => mapa.invalidateSize());
    }

    montar().catch(() => {
      if (!cancelado) {
        setEsError(true);
        setMensaje("No se pudo cargar el mapa de confirmación.");
      }
    });

    return () => {
      cancelado = true;
      if (mapaRef.current) {
        mapaRef.current.remove();
        mapaRef.current = null;
      }
      marcadorRef.current = null;
    };
  }, []);

  useEffect(() => {
    const L = leafletRef.current;
    const mapa = mapaRef.current;
    if (!listo || !L || !mapa) return;
    if (!tienePin) {
      if (marcadorRef.current) {
        mapa.removeLayer(marcadorRef.current);
        marcadorRef.current = null;
      }
      return;
    }
    const punto = L.latLng(latNum, lngNum);
    if (!marcadorRef.current) {
      marcadorRef.current = L.marker(punto, { draggable: true }).addTo(mapa);
      marcadorRef.current.on("dragend", () => {
        const pos = marcadorRef.current.getLatLng();
        if (!estaEnCostaRica(pos.lat, pos.lng)) {
          setEsError(true);
          setMensaje("El punto debe quedar dentro de Costa Rica.");
          marcadorRef.current.setLatLng([latNum, lngNum]);
          return;
        }
        onChangeRef.current?.({
          latitud: String(pos.lat),
          longitud: String(pos.lng),
        });
        setEsError(false);
        setMensaje("Ubicación actualizada.");
      });
    } else {
      marcadorRef.current.setLatLng(punto);
    }
    mapa.setView(punto, Math.max(mapa.getZoom(), 11));
  }, [listo, latNum, lngNum, tienePin]);

  const aplicarCoords = (lat, lng, textoOk) => {
    onChangeCoords?.({
      latitud: String(lat),
      longitud: String(lng),
    });
    setEsError(false);
    setMensaje(textoOk);
  };

  const intentarDesdeEnlace = async (enlaceForzado) => {
    const enlace = String(enlaceForzado ?? enlaceUbicacion ?? "").trim();
    if (!enlace) {
      setEsError(true);
      setMensaje("Pegá primero el enlace de Google Maps o Waze.");
      return;
    }
    const errorFormato = validarEnlaceUbicacion(enlace);
    if (errorFormato) {
      setEsError(true);
      setMensaje(errorFormato);
      return;
    }
    const local = extraerCoordenadasDeEnlace(enlace);
    if (local) {
      ultimoEnlaceResuelto.current = enlace;
      if (!estaEnCostaRica(local.latitud, local.longitud)) {
        setEsError(true);
        setMensaje(MENSAJE_SOLO_COSTA_RICA);
        onChangeCoords?.({ latitud: "", longitud: "" });
        return;
      }
      aplicarCoords(
        local.latitud,
        local.longitud,
        "Se leyó la ubicación en Costa Rica. Confirmala o ajustala en el mapa si hace falta.",
      );
      return;
    }
    setResolviendo(true);
    setEsError(false);
    setMensaje("Verificando el enlace...");
    try {
      const data = await resolverUbicacionEnlace(enlace);
      ultimoEnlaceResuelto.current = enlace;
      if (data?.resuelto) {
        if (!estaEnCostaRica(data.latitud, data.longitud)) {
          setEsError(true);
          setMensaje(MENSAJE_SOLO_COSTA_RICA);
          onChangeCoords?.({ latitud: "", longitud: "" });
          return;
        }
        aplicarCoords(
          data.latitud,
          data.longitud,
          "El enlace está en Costa Rica. Confirmá o mové el punto si hace falta.",
        );
      } else {
        setEsError(true);
        setMensaje(
          data?.mensaje ||
            "El enlace sirve, pero no trae el pin exacto. Tocá el mapa de Costa Rica para marcar el lugar.",
        );
      }
    } catch (error) {
      setEsError(true);
      setMensaje(
        error?.message ||
          "Ese enlace no se pudo verificar. Tiene que ser de Google Maps o Waze y estar en Costa Rica.",
      );
    } finally {
      setResolviendo(false);
    }
  };

  useEffect(() => {
    const enlace = String(enlaceUbicacion || "").trim();
    if (!enlace) {
      setMensaje("");
      setEsError(false);
      ultimoEnlaceResuelto.current = "";
      return undefined;
    }
    if (enlace === ultimoEnlaceResuelto.current && tienePin) return undefined;

    const errorFormato = validarEnlaceUbicacion(enlace);
    if (errorFormato) {
      const t = window.setTimeout(() => {
        setEsError(true);
        setMensaje(errorFormato);
      }, 450);
      return () => window.clearTimeout(t);
    }

    const t = window.setTimeout(() => {
      void intentarDesdeEnlace(enlace);
    }, 650);
    return () => window.clearTimeout(t);
    // Solo reaccionamos al enlace pegado; el pin lo maneja el efecto del mapa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enlaceUbicacion]);

  const restablecer = () => {
    mapaRef.current?.fitBounds(CR_BOUNDS, { padding: [20, 20] });
  };

  return (
    <div className="campo-ubicacion-mapa">
      <div className="campo-ubicacion-mapa__toolbar">
        <button
          type="button"
          className="campo-ubicacion-mapa__btn"
          onClick={() => void intentarDesdeEnlace()}
          disabled={resolviendo}
        >
          <MapPin size={16} aria-hidden="true" />
          <ST>{resolviendo ? "Verificando..." : "Verificar enlace"}</ST>
        </button>
        <button type="button" className="campo-ubicacion-mapa__btn campo-ubicacion-mapa__btn--linea" onClick={restablecer}>
          <Crosshair size={16} aria-hidden="true" />
          <ST>Vista de Costa Rica</ST>
        </button>
      </div>
      <p className="campo-ubicacion-mapa__ayuda">
        <ST>
          Pegá el enlace de Compartir de Google Maps o Waze de un lugar en Costa Rica. Lo verificamos al momento. Si no trae el pin exacto, tocá el mapa o arrastrá el marcador.
        </ST>
      </p>
      <div
        ref={contenedorRef}
        className="campo-ubicacion-mapa__lienzo"
        role="application"
        aria-label="Mapa para confirmar la ubicación del emprendimiento"
      />
      {mensaje ? (
        <p
          className={
            esError
              ? "campo-ubicacion-mapa__mensaje campo-ubicacion-mapa__mensaje--error"
              : "campo-ubicacion-mapa__mensaje"
          }
          role={esError ? "alert" : undefined}
        >
          {mensaje}
        </p>
      ) : null}
      {tienePin ? (
        <p className="campo-ubicacion-mapa__coords">
          <ST>Punto confirmado</ST>: {latNum.toFixed(5)}, {lngNum.toFixed(5)}
        </p>
      ) : (
        <p className="campo-ubicacion-mapa__aviso">
          <ST>Falta confirmar un punto en Costa Rica para poder enviar la propuesta y aparecer en el mapa público.</ST>
        </p>
      )}
    </div>
  );
}
