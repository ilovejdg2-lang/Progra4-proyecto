import { useEffect, useState } from "react";
import { Image, X } from "lucide-react";

import { AdminLayout } from "../../layouts/AdminLayout";
import { actualizarSeccion, obtenerInformacion } from "../../services/informacionService";

const heroInicial = {
  title: "",
  subtitle: "",
  buttonText: "",
  backgroundImage: "",
};

function EstadoPublicado() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
      <span className="size-2 rounded-full bg-emerald-600" />
      Publicado
    </span>
  );
}

function ModalHero({ hero, onCerrar, onGuardar, guardando }) {
  const [form, setForm] = useState(() => ({ ...heroInicial, ...hero }));

  const cambiarCampo = (event) => {
    const { name, value } = event.target;
    setForm((actual) => ({ ...actual, [name]: value }));
  };

  const enviar = (event) => {
    event.preventDefault();
    onGuardar(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <form onSubmit={enviar} className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-7 py-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-700">
              <Image className="size-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-950">Hero section</h2>
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

        <div className="space-y-5 px-7 py-6">
          <label className="grid gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
            Titulo principal
            <input
              name="title"
              value={form.title}
              onChange={cambiarCampo}
              className="rounded-xl border border-slate-300 px-4 py-3 text-base font-normal normal-case tracking-normal text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required
            />
            <span className="text-xs font-medium normal-case tracking-normal text-slate-400">
              Texto grande que aparece primero en la pagina.
            </span>
          </label>

          <label className="grid gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
            Subtitulo
            <textarea
              name="subtitle"
              value={form.subtitle}
              onChange={cambiarCampo}
              rows={4}
              className="resize-none rounded-xl border border-slate-300 px-4 py-3 text-base font-normal normal-case leading-7 tracking-normal text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              Texto del boton
              <input
                name="buttonText"
                value={form.buttonText}
                onChange={cambiarCampo}
                className="rounded-xl border border-slate-300 px-4 py-3 text-base font-normal normal-case tracking-normal text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <label className="grid gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              Imagen de fondo URL
              <input
                name="backgroundImage"
                value={form.backgroundImage}
                onChange={cambiarCampo}
                placeholder="https://..."
                className="rounded-xl border border-slate-300 px-4 py-3 text-base font-normal normal-case tracking-normal text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
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

const AdminInformacionPaginaPrincipal = () => {
  const [hero, setHero] = useState(heroInicial);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    obtenerInformacion()
      .then((info) => {
        if (activo) setHero({ ...heroInicial, ...(info.hero ?? {}) });
      })
      .catch(() => {
        if (activo) setError("No se pudo cargar la informacion principal.");
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  const guardarHero = async (form) => {
    try {
      setGuardando(true);
      const actualizado = await actualizarSeccion("hero", form);
      setHero({ ...heroInicial, ...actualizado });
      setEditando(false);
    } catch (err) {
      alert(err.message || "No se pudo guardar el hero.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <AdminLayout>
      <section className="space-y-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Secciones activas</p>
        </div>

        {cargando ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
            Cargando informacion...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : (
          <article className="border-l-4 border-amber-700 bg-white p-7 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-start justify-between gap-5">
              <div className="min-w-0">
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">Hero section</p>
                <h1 className="mt-2 break-words text-xl font-bold text-slate-950">{hero.title || "Sin titulo"}</h1>
                <p className="mt-3 max-w-3xl text-slate-600">{hero.subtitle || "Sin subtitulo configurado."}</p>
              </div>
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-800">
                <Image className="size-6" />
              </span>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-5">
              <EstadoPublicado />
              <button
                type="button"
                onClick={() => setEditando(true)}
                className="rounded-xl border border-amber-700 px-5 py-2 text-sm font-bold text-amber-800 transition hover:bg-amber-50"
              >
                Editar
              </button>
            </div>
          </article>
        )}
      </section>

      {editando ? (
        <ModalHero hero={hero} onCerrar={() => setEditando(false)} onGuardar={guardarHero} guardando={guardando} />
      ) : null}
    </AdminLayout>
  );
};

export default AdminInformacionPaginaPrincipal;
