import { useEffect, useState } from "react";
import { Eye, Image, ImagePlus, Target, Trash2, X } from "lucide-react";

import { AdminLayout } from "../../layouts/AdminLayout";
import { actualizarInformacion, actualizarSeccion, obtenerInformacion } from "../../services/informacionService";

const infoInicial = {
  hero: {},
  mission: {
    title: "",
    description: "",
  },
  vision: {
    title: "",
    description: "",
  },
  gallery: [],
};

const estilos = {
  mission: {
    borde: "border-amber-800",
    icono: "bg-amber-50 text-amber-800",
    etiqueta: "Mision",
    resumen: "Texto institucional de mision.",
    Icon: Target,
  },
  vision: {
    borde: "border-amber-700",
    icono: "bg-amber-50 text-amber-700",
    etiqueta: "Vision",
    resumen: "Texto institucional de vision.",
    Icon: Eye,
  },
};

function EstadoPublicado() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
      <span className="size-2 rounded-full bg-emerald-600" />
      Publicado
    </span>
  );
}

function ModalTexto({ tipo, data, onCerrar, onGuardar, guardando }) {
  const [form, setForm] = useState(() => ({ title: "", description: "", ...data }));
  const estilo = estilos[tipo];
  const Icon = estilo.Icon;

  const cambiarCampo = (event) => {
    const { name, value } = event.target;
    setForm((actual) => ({ ...actual, [name]: value }));
  };

  const enviar = (event) => {
    event.preventDefault();
    onGuardar(tipo, form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <form onSubmit={enviar} className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-7 py-5">
          <div className="flex items-center gap-3">
            <span className={`grid size-10 place-items-center rounded-xl ${estilo.icono}`}>
              <Icon className="size-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-950">{form.title || estilo.etiqueta}</h2>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-full bg-stone-100 p-2 text-slate-600 transition hover:bg-stone-200"
            aria-label="Cerrar"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-6 px-7 py-6">
          <label className="grid gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
            Titulo de la seccion
            <input
              name="title"
              value={form.title}
              onChange={cambiarCampo}
              className="rounded-xl border border-slate-300 px-4 py-3 text-base font-normal normal-case tracking-normal text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required
            />
          </label>

          <label className="grid gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
            Texto de la seccion
            <textarea
              name="description"
              value={form.description}
              onChange={cambiarCampo}
              rows={6}
              className="resize-none rounded-xl border border-slate-300 px-4 py-3 text-base font-normal normal-case leading-7 tracking-normal text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required
            />
          </label>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 px-7 py-5">
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ModalGaleria({ info, onCerrar, onGuardar, guardando }) {
  const [gallery, setGallery] = useState(() => (Array.isArray(info.gallery) ? info.gallery : []));

  const cambiarItem = (id, campo, valor) => {
    setGallery((actual) => actual.map((item) => (item.id === id ? { ...item, [campo]: valor } : item)));
  };

  const agregarItem = () => {
    setGallery((actual) => [...actual, { id: Date.now(), title: "", image: "" }]);
  };

  const eliminarItem = (id) => {
    setGallery((actual) => actual.filter((item) => item.id !== id));
  };

  const enviar = (event) => {
    event.preventDefault();
    onGuardar(gallery.filter((item) => item.title.trim() || item.image.trim()));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <form onSubmit={enviar} className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-7 py-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-700">
              <Image className="size-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-950">Galeria institucional</h2>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-full bg-stone-100 p-2 text-slate-600 transition hover:bg-stone-200"
            aria-label="Cerrar"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="max-h-[65vh] space-y-5 overflow-y-auto px-7 py-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Fotos actuales</p>
            <button
              type="button"
              onClick={agregarItem}
              className="inline-flex items-center gap-2 rounded-xl border border-teal-200 px-4 py-2 text-sm font-bold text-teal-700 transition hover:bg-teal-50"
            >
              <ImagePlus className="size-4" />
              Agregar foto
            </button>
          </div>

          <div className="space-y-4">
            {gallery.map((item, index) => (
              <div key={item.id} className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[140px_1fr_auto]">
                <div className="aspect-square overflow-hidden rounded-lg border border-slate-200 bg-white">
                  {item.image ? (
                    <img src={item.image} alt={item.title || `Imagen ${index + 1}`} className="size-full object-cover" />
                  ) : (
                    <div className="grid size-full place-items-center text-slate-400">
                      <Image className="size-7" />
                    </div>
                  )}
                </div>

                <div className="grid gap-3">
                  <label className="grid gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Titulo
                    <input
                      value={item.title}
                      onChange={(event) => cambiarItem(item.id, "title", event.target.value)}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-normal normal-case tracking-normal text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      required
                    />
                  </label>
                  <label className="grid gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                    URL de imagen
                    <input
                      value={item.image}
                      onChange={(event) => cambiarItem(item.id, "image", event.target.value)}
                      placeholder="https://..."
                      className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-normal normal-case tracking-normal text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      required
                    />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => eliminarItem(item.id)}
                  className="inline-flex size-10 items-center justify-center rounded-xl bg-red-50 text-red-700 transition hover:bg-red-100"
                  aria-label="Eliminar foto"
                >
                  <Trash2 className="size-5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 px-7 py-5">
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}

function TarjetaTexto({ tipo, data, onEditar }) {
  const estilo = estilos[tipo];
  const Icon = estilo.Icon;

  return (
    <article className={`border-l-4 ${estilo.borde} bg-white p-6 shadow-sm ring-1 ring-slate-200`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{estilo.etiqueta}</p>
          <h2 className="mt-2 text-lg font-bold text-slate-950">{data.title || estilo.etiqueta}</h2>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{data.description || estilo.resumen}</p>
        </div>
        <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${estilo.icono}`}>
          <Icon className="size-5" />
        </span>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4">
        <EstadoPublicado />
        <button
          type="button"
          onClick={() => onEditar(tipo)}
          className="rounded-xl border border-amber-700 px-5 py-2 text-sm font-bold text-amber-800 transition hover:bg-amber-50"
        >
          Editar
        </button>
      </div>
    </article>
  );
}

const AdminInformacionSobreNosotros = () => {
  const [info, setInfo] = useState(infoInicial);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [editandoTexto, setEditandoTexto] = useState(null);
  const [editandoGaleria, setEditandoGaleria] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    obtenerInformacion()
      .then((data) => {
        if (activo) setInfo({ ...infoInicial, ...data, gallery: Array.isArray(data.gallery) ? data.gallery : [] });
      })
      .catch(() => {
        if (activo) setError("No se pudo cargar la informacion de sobre nosotros.");
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  const guardarTexto = async (tipo, form) => {
    try {
      setGuardando(true);
      const actualizado = await actualizarSeccion(tipo, form);
      setInfo((actual) => ({ ...actual, [tipo]: actualizado }));
      setEditandoTexto(null);
    } catch (err) {
      alert(err.message || "No se pudo guardar la seccion.");
    } finally {
      setGuardando(false);
    }
  };

  const guardarGaleria = async (gallery) => {
    try {
      setGuardando(true);
      const actualizado = { ...info, gallery };
      await actualizarInformacion(actualizado);
      setInfo(actualizado);
      setEditandoGaleria(false);
    } catch (err) {
      alert(err.message || "No se pudo guardar la galeria.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <AdminLayout>
      <section className="space-y-5">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Secciones de sobre nosotros</p>

        {cargando ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
            Cargando informacion...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : (
          <>
            <div className="grid gap-5 lg:grid-cols-2">
              <TarjetaTexto tipo="mission" data={info.mission ?? {}} onEditar={setEditandoTexto} />
              <TarjetaTexto tipo="vision" data={info.vision ?? {}} onEditar={setEditandoTexto} />
            </div>

            <article className="border-l-4 border-amber-700 bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Galeria de fotos</p>
                  <h2 className="mt-2 text-lg font-bold text-slate-950">Galeria institucional</h2>
                </div>
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-800">
                  <Image className="size-5" />
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                {(info.gallery ?? []).slice(0, 4).map((item) => (
                  <div key={item.id} className="aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="size-full object-cover" />
                    ) : (
                      <div className="grid size-full place-items-center text-slate-400">
                        <Image className="size-7" />
                      </div>
                    )}
                  </div>
                ))}
                {(info.gallery ?? []).length === 0 ? (
                  <div className="aspect-[4/3] rounded-xl border border-dashed border-slate-300 bg-slate-50" />
                ) : null}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4">
                <EstadoPublicado />
                <button
                  type="button"
                  onClick={() => setEditandoGaleria(true)}
                  className="rounded-xl border border-amber-700 px-5 py-2 text-sm font-bold text-amber-800 transition hover:bg-amber-50"
                >
                  Editar
                </button>
              </div>
            </article>
          </>
        )}
      </section>

      {editandoTexto ? (
        <ModalTexto
          tipo={editandoTexto}
          data={info[editandoTexto] ?? {}}
          onCerrar={() => setEditandoTexto(null)}
          onGuardar={guardarTexto}
          guardando={guardando}
        />
      ) : null}

      {editandoGaleria ? (
        <ModalGaleria info={info} onCerrar={() => setEditandoGaleria(false)} onGuardar={guardarGaleria} guardando={guardando} />
      ) : null}
    </AdminLayout>
  );
};

export default AdminInformacionSobreNosotros;
