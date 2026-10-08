import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, ExternalLink, ImagePlus, Plus, Save, Trash2 } from "lucide-react";

import { AdminLayout } from "../layouts/AdminLayout";
import { AdminPageGate } from "../../../Components/AdminPageGate/AdminPageGate";
import { ST } from "../../../Components/T/ST";
import { NumericInput } from "../../../Components/NumericInput/NumericInput";
import { SelectFiltro } from "../../../Components/ui/SelectFiltro";
import { useAdminPageGate } from "../../../hooks/useAdminPageGate";
import { useTraducir } from "../../../hooks/useTraducir";
import {
  TIPOS_BLOQUE_HISTORIA,
  bloqueVacio,
  historiaVacia,
  normalizarHistoriaCompleta,
} from "../../../lib/historiaCompletaData";
import { t } from "../../../lib/t";
import {
  actualizarHistoriaCompleta,
  obtenerHistoriaCompleta,
  subirImagenInformacion,
} from "../../../services/informacionService";
import { ProductoImagenCampo } from "../InventarioProducto/components/ProductoImagenCampo";

const claseInput =
  "h-[var(--control-height)] w-full rounded-full border border-slate-200 bg-slate-50 px-4 text-[length:var(--text-body)] font-normal normal-case tracking-normal text-slate-950 outline-none transition focus:border-slate-400 focus:bg-white";
const claseTextarea =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[length:var(--text-body)] font-normal normal-case tracking-normal text-slate-950 outline-none transition focus:border-slate-400 focus:bg-white";
const claseEtiqueta = "grid gap-2 text-[length:var(--text-body)] font-bold uppercase tracking-wide text-slate-500";
const claseBotonSecundario =
  "inline-flex h-[var(--control-height)] items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-[length:var(--text-body)] font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60";

function Campo({ label, value, onChange, multiline = false, numerico = false, rows = 3, placeholder, maxLength = 1000 }) {
  return (
    <label className={claseEtiqueta}>
      <ST>{label}</ST>
      {numerico ? (
        <NumericInput
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className={claseInput}
        />
      ) : multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          maxLength={maxLength}
          className={claseTextarea}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className={claseInput}
        />
      )}
    </label>
  );
}

function CampoImagen({ label, value, onChange }) {
  return (
    <ProductoImagenCampo
      label={label}
      name="imagen"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      inputClassName={claseInput}
      subir={subirImagenInformacion}
    />
  );
}

function BotonIcono({ label, onClick, disabled, peligro = false, children }) {
  const tLabel = useTraducir(label);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={tLabel}
      title={tLabel}
      className={`grid size-8 shrink-0 place-items-center rounded-full border transition disabled:opacity-40 ${
        peligro
          ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}

function AccionesFila({ indice, total, onMover, onQuitar }) {
  return (
    <div className="flex items-center gap-1.5">
      <BotonIcono label="Subir" onClick={() => onMover(-1)} disabled={indice === 0}>
        <ArrowUp className="size-3.5" aria-hidden="true" />
      </BotonIcono>
      <BotonIcono label="Bajar" onClick={() => onMover(1)} disabled={indice === total - 1}>
        <ArrowDown className="size-3.5" aria-hidden="true" />
      </BotonIcono>
      <BotonIcono label="Quitar" onClick={onQuitar} peligro>
        <Trash2 className="size-3.5" aria-hidden="true" />
      </BotonIcono>
    </div>
  );
}

function mover(lista, indice, direccion) {
  const destino = indice + direccion;
  if (destino < 0 || destino >= lista.length) return lista;
  const copia = [...lista];
  [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
  return copia;
}

function reemplazar(lista, indice, cambios) {
  return lista.map((item, i) => (i === indice ? { ...item, ...cambios } : item));
}

function Seccion({ titulo, descripcion, accion, children }) {
  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="min-w-0">
          <h2 className="text-[length:var(--text-subtitle)] font-bold text-slate-950"><ST>{titulo}</ST></h2>
          {descripcion ? (
            <p className="text-[length:var(--text-body)] text-slate-500"><ST>{descripcion}</ST></p>
          ) : null}
        </div>
        {accion}
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 p-4 sm:p-6">{children}</div>
    </section>
  );
}

function BotonAgregar({ label, onClick, icono: Icono = Plus }) {
  return (
    <button type="button" onClick={onClick} className={claseBotonSecundario}>
      <Icono className="size-4" aria-hidden="true" />
      <ST>{label}</ST>
    </button>
  );
}

function ListaVacia({ mensaje }) {
  return <p className="text-[length:var(--text-body)] text-slate-400"><ST>{mensaje}</ST></p>;
}

function EditorBloque({ bloque, onChange }) {
  const tipo = bloque.tipo;
  return (
    <div className="grid gap-3">
      <label className={claseEtiqueta}>
        <ST>Tipo de bloque</ST>
        <SelectFiltro value={tipo} onChange={(e) => onChange({ tipo: e.target.value })}>
          {TIPOS_BLOQUE_HISTORIA.map((opcion) => (
            <option key={opcion.value} value={opcion.value}>{t(opcion.label)}</option>
          ))}
        </SelectFiltro>
      </label>
      {tipo === "p" || tipo === "cita" ? (
        <Campo
          label={tipo === "cita" ? "Texto de la cita" : "Texto"}
          value={bloque.texto}
          onChange={(texto) => onChange({ texto })}
          multiline
          rows={tipo === "p" ? 6 : 3}
          maxLength={8000}
        />
      ) : null}
      {tipo === "h3" ? (
        <Campo label="Subtítulo" value={bloque.texto} onChange={(texto) => onChange({ texto })} maxLength={300} />
      ) : null}
      {tipo === "cita" ? (
        <Campo label="Autor de la cita" value={bloque.autor} onChange={(autor) => onChange({ autor })} maxLength={300} />
      ) : null}
      {tipo === "foto" ? (
        <CampoImagen label="Imagen" value={bloque.src} onChange={(src) => onChange({ src })} />
      ) : null}
      {tipo === "foto" || tipo === "compost" ? (
        <Campo label="Pie de imagen o gráfico" value={bloque.pie} onChange={(pie) => onChange({ pie })} maxLength={500} />
      ) : null}
      {tipo === "mapa" ? (
        <ListaVacia mensaje="Muestra el mapa de parcelas configurado en la portada." />
      ) : null}
      {tipo === "compost" ? (
        <ListaVacia mensaje="Usa los datos de la sección Producción de compost." />
      ) : null}
    </div>
  );
}

function EditorCapitulo({ capitulo, indice, total, abierto, onToggle, onChange, onMover, onQuitar }) {
  const tBloques = useTraducir(`${capitulo.bloques.length} bloques`);
  const bloques = capitulo.bloques;
  const cambiarBloques = (nuevos) => onChange({ bloques: nuevos });

  return (
    <article className="min-w-0 rounded-2xl border border-slate-200">
      <div className="flex flex-wrap items-center justify-end gap-3 px-4 py-3">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={abierto}
          className="flex min-w-[12rem] flex-1 items-center gap-3 text-left"
        >
          <span className="text-[length:var(--text-body)] font-bold text-amber-700">{String(indice + 1).padStart(2, "0")}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[length:var(--text-body)] font-semibold text-slate-950">
              {capitulo.titulo || <ST>Capítulo sin título</ST>}
            </span>
            <span className="block text-[length:var(--text-body)] text-slate-500">{tBloques}</span>
          </span>
          <ChevronDown className={`size-4 shrink-0 text-slate-500 transition-transform ${abierto ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
        <AccionesFila indice={indice} total={total} onMover={onMover} onQuitar={onQuitar} />
      </div>

      {abierto ? (
        <div className="grid gap-4 border-t border-slate-100 p-4">
          <Campo label="Título del capítulo" value={capitulo.titulo} onChange={(titulo) => onChange({ titulo })} maxLength={200} />
          {bloques.length === 0 ? <ListaVacia mensaje="Este capítulo todavía no tiene bloques." /> : null}
          {bloques.map((bloque, j) => (
            <div key={j} className="grid gap-3 rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[length:var(--text-body)] font-semibold text-slate-600">
                  <ST>{`Bloque ${j + 1}`}</ST>
                </span>
                <AccionesFila
                  indice={j}
                  total={bloques.length}
                  onMover={(dir) => cambiarBloques(mover(bloques, j, dir))}
                  onQuitar={() => cambiarBloques(bloques.filter((_, k) => k !== j))}
                />
              </div>
              <EditorBloque bloque={bloque} onChange={(cambios) => cambiarBloques(reemplazar(bloques, j, cambios))} />
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <BotonAgregar label="Agregar bloque" onClick={() => cambiarBloques([...bloques, bloqueVacio()])} />
            <BotonAgregar label="Agregar imagen" icono={ImagePlus} onClick={() => cambiarBloques([...bloques, bloqueVacio("foto")])} />
          </div>
        </div>
      ) : null}
    </article>
  );
}

const AdminHistoriaCompleta = () => {
  const { showLoading, loadingMessage } = useAdminPageGate("/admin/historia-completa", true);
  const [historia, setHistoria] = useState(historiaVacia);
  const [estado, setEstado] = useState("loading");
  const [guardando, setGuardando] = useState(false);
  const [sinGuardar, setSinGuardar] = useState(false);
  const [abierto, setAbierto] = useState(null);
  const [mensaje, setMensaje] = useState("");

  const cargar = useCallback(async () => {
    setEstado("loading");
    try {
      setHistoria(normalizarHistoriaCompleta(await obtenerHistoriaCompleta()));
      setSinGuardar(false);
      setEstado("ready");
    } catch {
      setEstado("error");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  useEffect(() => {
    if (!sinGuardar) return undefined;
    const avisar = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [sinGuardar]);

  const actualizar = (cambios) => {
    setHistoria((actual) => ({ ...actual, ...cambios }));
    setSinGuardar(true);
    setMensaje("");
  };
  const cambiarPortada = (campo) => (valor) => actualizar({ portada: { ...historia.portada, [campo]: valor } });
  const cambiarLista = (clave) => (nueva) => actualizar({ [clave]: nueva });

  const guardar = async () => {
    if (!historia.portada.titulo.trim()) {
      alert(t("El título de la historia es obligatorio."));
      return;
    }
    try {
      setGuardando(true);
      const guardada = await actualizarHistoriaCompleta(historia);
      setHistoria(normalizarHistoriaCompleta(guardada));
      setSinGuardar(false);
      setMensaje("Cambios guardados.");
    } catch (err) {
      alert(t(err?.message || "No se pudo guardar la historia."));
    } finally {
      setGuardando(false);
    }
  };

  const { portada, cifras, hitos, compost, capitulos } = historia;

  return (
    <AdminPageGate showLoading={showLoading} message={loadingMessage}>
      <AdminLayout>
        <div className="grid min-w-0 gap-5">
          <section className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
              <div className="min-w-0">
                <h1 className="text-[length:var(--text-title)] font-bold text-slate-950"><ST>Historia completa</ST></h1>
                <p className="text-[length:var(--text-body)] text-slate-500">
                  <ST>{sinGuardar ? "Tenés cambios sin guardar." : mensaje || "Relato largo que se abre desde «Leer la historia completa» en Sobre nosotros."}</ST>
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <a href="/AboutUs/historia" target="_blank" rel="noopener noreferrer" className={claseBotonSecundario}>
                  <ExternalLink className="size-4" aria-hidden="true" />
                  <ST>Ver en el sitio</ST>
                </a>
                <button
                  type="button"
                  onClick={guardar}
                  disabled={guardando || estado !== "ready" || !sinGuardar}
                  className="inline-flex h-[var(--control-height)] items-center justify-center gap-2 rounded-full border border-slate-950 bg-slate-950 px-4 text-[length:var(--text-body)] font-semibold text-white transition hover:border-neutral-700 hover:bg-neutral-700 disabled:opacity-60"
                >
                  <Save className="size-4" aria-hidden="true" />
                  <ST>{guardando ? "Guardando..." : "Guardar cambios"}</ST>
                </button>
              </div>
            </div>
          </section>

          {estado === "loading" ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-[length:var(--text-body)] text-slate-500 shadow-sm">
              <ST>Cargando historia...</ST>
            </div>
          ) : estado === "error" ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-[length:var(--text-body)] font-semibold text-red-700">
              <ST>No se pudo cargar la historia completa.</ST>
              <button
                type="button"
                onClick={cargar}
                className="mt-4 block h-[var(--control-height)] rounded-full bg-red-700 px-4 text-white"
              >
                <ST>Reintentar</ST>
              </button>
            </div>
          ) : (
            <>
              <Seccion titulo="Portada" descripcion="Encabezado, autoría e imágenes de la historia.">
                <div className="grid gap-4 md:grid-cols-2">
                  <Campo label="Etiqueta superior" value={portada.eyebrow} onChange={cambiarPortada("eyebrow")} maxLength={120} />
                  <Campo label="Título" value={portada.titulo} onChange={cambiarPortada("titulo")} maxLength={200} />
                  <Campo label="Autora o autor" value={portada.autora} onChange={cambiarPortada("autora")} maxLength={200} />
                  <Campo label="Año del relato" value={portada.anio} onChange={cambiarPortada("anio")} numerico maxLength={4} />
                </div>
                <Campo label="Subtítulo" value={portada.subtitulo} onChange={cambiarPortada("subtitulo")} multiline rows={2} maxLength={500} />
                <div className="grid gap-4 md:grid-cols-2">
                  <CampoImagen label="Foto de portada" value={portada.foto} onChange={cambiarPortada("foto")} />
                  <CampoImagen label="Mapa de parcelas" value={portada.mapa} onChange={cambiarPortada("mapa")} />
                </div>
                <Campo label="Pie del mapa" value={portada.pieMapa} onChange={cambiarPortada("pieMapa")} maxLength={500} />
                <Campo label="Texto de cierre" value={portada.cierre} onChange={cambiarPortada("cierre")} multiline rows={2} maxLength={1000} />
              </Seccion>

              <Seccion
                titulo="Cifras"
                descripcion="Datos destacados que aparecen debajo de la portada."
                accion={<BotonAgregar label="Agregar cifra" onClick={() => cambiarLista("cifras")([...cifras, { valor: "", texto: "" }])} />}
              >
                {cifras.length === 0 ? <ListaVacia mensaje="No hay cifras." /> : null}
                {cifras.map((cifra, i) => (
                  <div key={i} className="grid items-end gap-3 md:grid-cols-[12rem_minmax(0,1fr)_auto]">
                    <Campo label="Valor" value={cifra.valor} onChange={(valor) => cambiarLista("cifras")(reemplazar(cifras, i, { valor }))} maxLength={40} />
                    <Campo label="Descripción" value={cifra.texto} onChange={(texto) => cambiarLista("cifras")(reemplazar(cifras, i, { texto }))} maxLength={300} />
                    <AccionesFila
                      indice={i}
                      total={cifras.length}
                      onMover={(dir) => cambiarLista("cifras")(mover(cifras, i, dir))}
                      onQuitar={() => cambiarLista("cifras")(cifras.filter((_, k) => k !== i))}
                    />
                  </div>
                ))}
              </Seccion>

              <Seccion
                titulo="Hitos del proyecto"
                descripcion="Línea de tiempo por año."
                accion={<BotonAgregar label="Agregar hito" onClick={() => cambiarLista("hitos")([...hitos, { anio: "", texto: "" }])} />}
              >
                {hitos.length === 0 ? <ListaVacia mensaje="No hay hitos." /> : null}
                {hitos.map((hito, i) => (
                  <div key={i} className="grid items-end gap-3 md:grid-cols-[8rem_minmax(0,1fr)_auto]">
                    <Campo label="Año" value={hito.anio} onChange={(anio) => cambiarLista("hitos")(reemplazar(hitos, i, { anio }))} numerico maxLength={4} />
                    <Campo label="Qué pasó" value={hito.texto} onChange={(texto) => cambiarLista("hitos")(reemplazar(hitos, i, { texto }))} maxLength={500} />
                    <AccionesFila
                      indice={i}
                      total={hitos.length}
                      onMover={(dir) => cambiarLista("hitos")(mover(hitos, i, dir))}
                      onQuitar={() => cambiarLista("hitos")(hitos.filter((_, k) => k !== i))}
                    />
                  </div>
                ))}
              </Seccion>

              <Seccion
                titulo="Producción de compost"
                descripcion="Datos del gráfico de compost (kilos por año)."
                accion={<BotonAgregar label="Agregar año" onClick={() => cambiarLista("compost")([...compost, { anio: "", kg: 0 }])} />}
              >
                {compost.length === 0 ? <ListaVacia mensaje="No hay datos de compost." /> : null}
                {compost.map((fila, i) => (
                  <div key={i} className="grid items-end gap-3 sm:grid-cols-[8rem_12rem_auto]">
                    <label className={claseEtiqueta}>
                      <ST>Año</ST>
                      <NumericInput
                        value={fila.anio}
                        onChange={(e) => cambiarLista("compost")(reemplazar(compost, i, { anio: e.target.value }))}
                        maxLength={4}
                        className={claseInput}
                      />
                    </label>
                    <label className={claseEtiqueta}>
                      <ST>Kilos</ST>
                      <NumericInput
                        value={fila.kg}
                        onChange={(e) => cambiarLista("compost")(reemplazar(compost, i, { kg: Number(e.target.value) || 0 }))}
                        maxLength={9}
                        className={claseInput}
                      />
                    </label>
                    <AccionesFila
                      indice={i}
                      total={compost.length}
                      onMover={(dir) => cambiarLista("compost")(mover(compost, i, dir))}
                      onQuitar={() => cambiarLista("compost")(compost.filter((_, k) => k !== i))}
                    />
                  </div>
                ))}
              </Seccion>

              <Seccion
                titulo="Capítulos"
                descripcion="Cada capítulo tiene bloques de texto, subtítulos, citas, fotos, el mapa o el gráfico de compost."
                accion={
                  <BotonAgregar
                    label="Agregar capítulo"
                    onClick={() => {
                      cambiarLista("capitulos")([...capitulos, { id: "", titulo: "", bloques: [bloqueVacio()] }]);
                      setAbierto(capitulos.length);
                    }}
                  />
                }
              >
                {capitulos.length === 0 ? <ListaVacia mensaje="No hay capítulos." /> : null}
                {capitulos.map((capitulo, i) => (
                  <EditorCapitulo
                    key={i}
                    capitulo={capitulo}
                    indice={i}
                    total={capitulos.length}
                    abierto={abierto === i}
                    onToggle={() => setAbierto((actual) => (actual === i ? null : i))}
                    onChange={(cambios) => cambiarLista("capitulos")(reemplazar(capitulos, i, cambios))}
                    onMover={(dir) => {
                      cambiarLista("capitulos")(mover(capitulos, i, dir));
                      if (abierto === i) setAbierto(i + dir);
                    }}
                    onQuitar={() => {
                      if (!window.confirm(t(`¿Quitar el capítulo «${capitulo.titulo || i + 1}»?`))) return;
                      cambiarLista("capitulos")(capitulos.filter((_, k) => k !== i));
                      setAbierto(null);
                    }}
                  />
                ))}
              </Seccion>
            </>
          )}
        </div>
      </AdminLayout>
    </AdminPageGate>
  );
};

export default AdminHistoriaCompleta;
