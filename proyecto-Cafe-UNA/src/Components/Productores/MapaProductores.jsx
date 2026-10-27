import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Crosshair, Minus, Plus, X } from "lucide-react";

import { ST } from "../T/ST";
import { urlImagenPublica } from "../../lib/propuestaProductor";
import {
  coordenadasDeProductor,
  CR_CENTER,
  CR_MAX_BOUNDS,
  CR_VIEW_ZOOM,
  resumenUbicacion,
} from "../../lib/ubicacionMaps";
import "./MapaProductores.css";

const HIT = 44;
const PIN = 34;

function enlacePublico(valor) {
  const texto = String(valor || "").trim();
  if (!texto) return "";
  try {
    const url = new URL(texto);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    return url.href;
  } catch {
    return "";
  }
}

function svgPin(activo) {
  const relleno = activo ? "#0b3d2e" : "#111827";
  const halo = activo
    ? '<circle cx="22" cy="22" r="20" fill="rgba(11,61,46,0.18)"/>'
    : "";
  return `
    <span class="mapa-productores__hit${activo ? " mapa-productores__hit--activo" : ""}" aria-hidden="true">
      <svg class="mapa-productores__pin" width="${PIN}" height="${PIN}" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
        ${halo}
        <path d="M22 4c-7.7 0-14 6.1-14 13.7 0 10.2 12.2 21.4 13.3 22.4a1 1 0 0 0 1.4 0C23.8 39.1 36 27.9 36 17.7 36 10.1 29.7 4 22 4z" fill="${relleno}" stroke="#fff" stroke-width="3"/>
        <circle cx="22" cy="17.5" r="5.2" fill="#fff"/>
      </svg>
    </span>
  `;
}

function iconoMarcador(L, activo) {
  return L.divIcon({
    className: "mapa-productores__icono",
    html: svgPin(activo),
    iconSize: [HIT, HIT],
    iconAnchor: [HIT / 2, PIN - 1],
    popupAnchor: [0, -(PIN - 4)],
  });
}

function iconoCluster(L, total) {
  return L.divIcon({
    className: "mapa-productores__icono-cluster",
    html: `<span class="mapa-productores__cluster" aria-hidden="true">${total}</span>`,
    iconSize: [HIT, HIT],
    iconAnchor: [HIT / 2, HIT / 2],
  });
}

function claveCoords(lat, lng) {
  return `${Number(lat).toFixed(5)},${Number(lng).toFixed(5)}`;
}

function zoomParaAncho(ancho) {
  if (ancho >= 960) return CR_VIEW_ZOOM;
  if (ancho >= 640) return 7.5;
  return 7;
}

function aplicarVistaCostaRica(mapa) {
  if (!mapa) return false;
  const caja = mapa.getContainer();
  if (!caja || caja.clientWidth < 80 || caja.clientHeight < 80) return false;
  mapa.invalidateSize({ pan: false });
  // setView centrado (no fitBounds): en lienzos anchos fitBounds abría Panamá a la derecha.
  mapa.setView(CR_CENTER, zoomParaAncho(caja.clientWidth), { animate: false });
  return true;
}

export default function MapaProductores({
  productores = [],
  cargando = false,
  seleccionadoId = null,
  onSeleccionar,
  onVerDetalles,
}) {
  const tituloId = useId();
  const contenedorRef = useRef(null);
  const mapaRef = useRef(null);
  const clusterRef = useRef(null);
  const marcadoresRef = useRef(new Map());
  const leafletRef = useRef(null);
  const onSeleccionarRef = useRef(onSeleccionar);
  const [mapaListo, setMapaListo] = useState(false);
  const [fallaMapa, setFallaMapa] = useState("");
  const [grupoCercano, setGrupoCercano] = useState([]);

  onSeleccionarRef.current = onSeleccionar;

  const conCoordenadas = useMemo(
    () => productores.filter((item) => Boolean(coordenadasDeProductor(item))),
    [productores],
  );

  const seleccionado = useMemo(
    () => productores.find((item) => String(item.id) === String(seleccionadoId)) || null,
    [productores, seleccionadoId],
  );

  const lugar = resumenUbicacion(seleccionado);
  const mapaUrl = enlacePublico(seleccionado?.enlaceUbicacion);

  useEffect(() => {
    let cancelado = false;
    let mapa;
    let observer;

    async function montar() {
      try {
        const leaflet = await import("leaflet");
        await import("leaflet/dist/leaflet.css");
        await import("leaflet.markercluster");
        await import("leaflet.markercluster/dist/MarkerCluster.css");
        if (cancelado || !contenedorRef.current) return;

        const L = leaflet.default || leaflet;
        leafletRef.current = L;

        mapa = L.map(contenedorRef.current, {
          center: CR_CENTER,
          zoom: CR_VIEW_ZOOM,
          minZoom: 7,
          maxZoom: 16,
          zoomControl: false,
          attributionControl: true,
          scrollWheelZoom: false,
          doubleClickZoom: true,
          boxZoom: false,
          maxBounds: CR_MAX_BOUNDS,
          maxBoundsViscosity: 1,
        });

        L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
          {
            attribution:
              "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ",
            maxZoom: 16,
          },
        ).addTo(mapa);

        const cluster = L.markerClusterGroup({
          showCoverageOnHover: false,
          maxClusterRadius: 48,
          spiderfyOnMaxZoom: true,
          zoomToBoundsOnClick: true,
          spiderfyDistanceMultiplier: 1.6,
          disableClusteringAtZoom: 14,
          iconCreateFunction(grupo) {
            return iconoCluster(L, grupo.getChildCount());
          },
        });

        cluster.on("clusterclick", (event) => {
          const hijos = event.layer.getAllChildMarkers();
          const items = hijos
            .map((marcador) => marcador.options?.productor)
            .filter(Boolean);
          const puntos = hijos.map((marcador) => marcador.getLatLng());
          const mismoSitio =
            puntos.length > 1 &&
            puntos.every((punto) => punto.distanceTo(puntos[0]) < 12);
          const enTope = mapa.getZoom() >= mapa.getMaxZoom() - 0.2;

          if (mismoSitio || enTope) {
            event.layer.spiderfy();
            setGrupoCercano(items);
          } else {
            setGrupoCercano([]);
          }
        });

        mapa.addLayer(cluster);
        mapaRef.current = mapa;
        clusterRef.current = cluster;

        let vistaInicialLista = false;
        const fijarVista = () => {
          if (vistaInicialLista) return;
          if (aplicarVistaCostaRica(mapa)) vistaInicialLista = true;
        };
        fijarVista();
        requestAnimationFrame(fijarVista);
        window.setTimeout(fijarVista, 120);
        window.setTimeout(fijarVista, 400);
        window.setTimeout(() => {
          if (!vistaInicialLista) {
            mapa.setView(CR_CENTER, CR_VIEW_ZOOM, { animate: false });
            vistaInicialLista = true;
          }
        }, 700);

        observer = new ResizeObserver(() => {
          mapa.invalidateSize({ pan: false });
          if (!vistaInicialLista) fijarVista();
        });
        observer.observe(contenedorRef.current);

        setMapaListo(true);
        setFallaMapa("");
      } catch (error) {
        if (!cancelado) {
          setFallaMapa(
            error instanceof Error
              ? error.message
              : "No se pudo cargar el mapa interactivo.",
          );
        }
      }
    }

    montar();
    return () => {
      cancelado = true;
      observer?.disconnect();
      setMapaListo(false);
      marcadoresRef.current.clear();
      clusterRef.current = null;
      if (mapaRef.current) {
        mapaRef.current.remove();
        mapaRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const L = leafletRef.current;
    const cluster = clusterRef.current;
    if (!mapaListo || !L || !cluster) return;

    cluster.clearLayers();
    marcadoresRef.current.clear();
    setGrupoCercano([]);

    conCoordenadas.forEach((item) => {
      const coords = coordenadasDeProductor(item);
      if (!coords) return;
      const marcador = L.marker([coords.latitud, coords.longitud], {
        icon: iconoMarcador(L, false),
        title: item.nombre || "Productor",
        keyboard: true,
        riseOnHover: true,
        productor: item,
      });
      marcador.on("click", (event) => {
        L.DomEvent.stopPropagation(event);
        setGrupoCercano([]);
        onSeleccionarRef.current?.(item);
      });
      cluster.addLayer(marcador);
      marcadoresRef.current.set(String(item.id), marcador);
    });
  }, [conCoordenadas, mapaListo]);

  useEffect(() => {
    const L = leafletRef.current;
    if (!mapaListo || !L) return;
    marcadoresRef.current.forEach((marcador, id) => {
      const activo = String(id) === String(seleccionadoId);
      marcador.setIcon(iconoMarcador(L, activo));
      if (activo) marcador.setZIndexOffset(800);
      else marcador.setZIndexOffset(0);
    });
  }, [mapaListo, seleccionadoId]);

  useEffect(() => {
    const mapa = mapaRef.current;
    const L = leafletRef.current;
    if (!mapaListo || !mapa || !L || !seleccionado) return;
    const coords = coordenadasDeProductor(seleccionado);
    if (!coords) return;
    const punto = L.latLng(coords.latitud, coords.longitud);
    const fuera = !mapa.getBounds().pad(-0.15).contains(punto);
    if (fuera) {
      mapa.panTo(punto, { animate: true });
    }
  }, [mapaListo, seleccionado]);

  const restablecerVista = () => {
    setGrupoCercano([]);
    const mapa = mapaRef.current;
    if (!aplicarVistaCostaRica(mapa) && mapa) {
      mapa.setView(CR_CENTER, CR_VIEW_ZOOM, { animate: true });
    }
  };

  const acercar = () => mapaRef.current?.zoomIn();
  const alejar = () => mapaRef.current?.zoomOut();

  const elegirDelGrupo = (item) => {
    setGrupoCercano([]);
    onSeleccionar?.(item);
  };

  return (
    <section className="mapa-productores" aria-labelledby={tituloId}>
      <div className="mapa-productores__encabezado">
        <h2 id={tituloId} className="mapa-productores__titulo">
          <ST>Conocé de dónde vienen nuestros productores</ST>
        </h2>
        <p className="mapa-productores__lead">
          <ST>Explorá el mapa y seleccioná un punto para conocer a cada productor.</ST>
        </p>
      </div>

      <div
        className={`mapa-productores__panel${seleccionado ? "" : " mapa-productores__panel--sin-tarjeta"}`}
      >
        <div className="mapa-productores__lienzo-wrap">
          <div
            ref={contenedorRef}
            className="mapa-productores__lienzo"
            role="application"
            aria-label="Mapa de productores en Costa Rica"
          />
          {mapaListo ? (
            <div className="mapa-productores__controles" role="group" aria-label="Controles del mapa">
              <button
                type="button"
                className="mapa-productores__control"
                onClick={acercar}
                aria-label="Acercar mapa"
              >
                <Plus size={18} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="mapa-productores__control"
                onClick={alejar}
                aria-label="Alejar mapa"
              >
                <Minus size={18} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="mapa-productores__control"
                onClick={restablecerVista}
                aria-label="Ver Costa Rica"
                title="Ver Costa Rica"
              >
                <Crosshair size={18} aria-hidden="true" />
              </button>
            </div>
          ) : null}

          {seleccionado ? (
            <aside className="mapa-productores__tarjeta mapa-productores__tarjeta--escritorio" aria-live="polite">
              <TarjetaProductor
                productor={seleccionado}
                lugar={lugar}
                mapaUrl={mapaUrl}
                onCerrar={() => onSeleccionar?.(null)}
                onVerDetalles={() => onVerDetalles?.(seleccionado)}
              />
            </aside>
          ) : null}
        </div>

        {grupoCercano.length > 1 ? (
          <div className="mapa-productores__grupo" role="listbox" aria-label="Productores en este punto">
            <p className="mapa-productores__grupo-titulo">
              <ST>Hay varios productores aquí. Elegí uno:</ST>
            </p>
            <ul className="mapa-productores__grupo-lista">
              {grupoCercano.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`mapa-productores__grupo-item${
                      String(item.id) === String(seleccionadoId) ? " is-activo" : ""
                    }`}
                    onClick={() => elegirDelGrupo(item)}
                  >
                    <img
                      src={urlImagenPublica(item.imagenUrl)}
                      alt=""
                      onError={(event) => {
                        event.currentTarget.style.visibility = "hidden";
                      }}
                    />
                    <span>
                      <strong>{item.nombre}</strong>
                      <small>{resumenUbicacion(item) || claveCoords(
                        coordenadasDeProductor(item)?.latitud,
                        coordenadasDeProductor(item)?.longitud,
                      )}</small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {seleccionado ? (
          <aside className="mapa-productores__tarjeta mapa-productores__tarjeta--movil" aria-live="polite">
            <TarjetaProductor
              productor={seleccionado}
              lugar={lugar}
              mapaUrl={mapaUrl}
              onCerrar={() => onSeleccionar?.(null)}
              onVerDetalles={() => onVerDetalles?.(seleccionado)}
            />
          </aside>
        ) : (
          <p className="mapa-productores__pista">
            <ST>Tocá un punto para conocer al productor.</ST>
          </p>
        )}
      </div>

      {cargando ? (
        <p className="mapa-productores__estado"><ST>Cargando ubicaciones...</ST></p>
      ) : null}
      {!cargando && !fallaMapa && conCoordenadas.length === 0 && productores.length > 0 ? (
        <p className="mapa-productores__vacio">
          <ST>Todavía no hay ubicaciones confirmadas en el mapa. Podés ver a todos los productores en el listado.</ST>
        </p>
      ) : null}
      {fallaMapa ? (
        <p className="mapa-productores__error" role="status">
          <ST>El mapa no está disponible por ahora. El listado de productores sigue disponible abajo.</ST>
        </p>
      ) : null}
    </section>
  );
}

function TarjetaProductor({ productor, lugar, mapaUrl, onCerrar, onVerDetalles }) {
  return (
    <>
      <button
        type="button"
        className="mapa-productores__tarjeta-cerrar"
        onClick={onCerrar}
        aria-label="Cerrar selección"
      >
        <X size={18} aria-hidden="true" />
      </button>
      <div className="mapa-productores__tarjeta-media">
        <img
          src={urlImagenPublica(productor.imagenUrl)}
          alt=""
          onError={(event) => {
            event.currentTarget.src =
              "data:image/svg+xml," +
              encodeURIComponent(
                '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><rect width="100%" height="100%" fill="#f5f5f4"/><text x="50%" y="52%" text-anchor="middle" fill="#a8a29e" font-size="14">Sin foto</text></svg>',
              );
          }}
        />
        <div>
          <h3>{productor.nombre}</h3>
          {lugar ? (
            <p className="mapa-productores__tarjeta-lugar">
              <span>{lugar}</span>
            </p>
          ) : null}
        </div>
      </div>
      <div className="mapa-productores__tarjeta-acciones">
        <button
          type="button"
          className="mapa-productores__btn-detalle"
          onClick={onVerDetalles}
        >
          <ST>Ver detalles</ST>
        </button>
        {mapaUrl ? (
          <a
            className="mapa-productores__btn-maps"
            href={mapaUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ST>Abrir en Google Maps</ST>
            <ArrowUpRight size={15} aria-hidden="true" />
          </a>
        ) : null}
      </div>
    </>
  );
}
