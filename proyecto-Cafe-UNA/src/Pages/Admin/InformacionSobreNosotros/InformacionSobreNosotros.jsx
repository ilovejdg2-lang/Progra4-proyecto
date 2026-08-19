import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpenText, Eye, Image, ImagePlus, Target, Trash2, X } from "lucide-react";

import { AdminLayout } from "../layouts/AdminLayout";
import { AdminModal, AdminModalBody, AdminModalFooter, AdminModalHeader } from "../../../Components/Admin/ui/AdminModal";
import { AdminListaToolbar, AdminListaVacia } from "../../../Components/Admin/ui/AdminListaToolbar";
import {
  AdminEditorConPreview,
  PreviewGaleriaLive,
  PreviewTextoInstitucionalLive,
} from "../../../Components/Admin/ui/AdminCmsPreview";
import { AdminSeccionCard } from "../../../Components/Admin/ui/AdminSeccionCard";
import { AdminPageGate } from "../../../Components/AdminPageGate/AdminPageGate";
import { useAdminPageGate } from "../../../hooks/useAdminPageGate";
import { useCachedPageData } from "../../../hooks/useCachedPageData";
import { useAdminListaFiltros } from "../../../hooks/useAdminListaFiltros";
import { filtrarPorBusqueda } from "../../../lib/adminListaFiltros";
import { fetchAboutAdminPageData } from "../../../lib/aboutAdminPageData";
import {
  actualizarGaleriaItem,
  actualizarSeccion,
  agregarGaleriaItem,
  eliminarGaleriaItem,
  obtenerInformacionSobreNosotros,
} from "../../../services/informacionService";
import { getActiveSessionUser } from "../../../services/sessionService";
import { tienePermiso } from "../../../lib/permisos";

const infoInicial = {
  hero: {},
  historia: {
    title: "",
    description: "",
  },
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
  historia: {
    borde: "border-amber-700",
    icono: "bg-amber-50 text-amber-700",
    etiqueta: "Historia",
    resumen: "Resumen institucional de nuestra historia.",
    Icon: BookOpenText,
  },
  mission: {
    borde: "border-amber-700",
    icono: "bg-amber-50 text-amber-700",
    etiqueta: "Misi\u00f3n",
    resumen: "Texto institucional de misi\u00f3n.",
    Icon: Target,
  },
  vision: {
    borde: "border-amber-700",
    icono: "bg-amber-50 text-amber-700",
    etiqueta: "Visi\u00f3n",
    resumen: "Texto institucional de visi\u00f3n.",
    Icon: Eye,
  },
};

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
    <AdminModal open onClose={onCerrar} maxWidth="max-w-5xl" labelledBy="admin-texto-modal-title">
      <form onSubmit={enviar} className="flex min-h-0 flex-1 flex-col">
        <AdminModalHeader>
          <div className="flex min-w-0 items-center gap-3">
            <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${estilo.icono}`}>
              <Icon className="size-5" />
            </span>
            <h2 id="admin-texto-modal-title" className="truncate text-lg font-bold text-slate-950 sm:text-xl">{form.title || estilo.etiqueta}</h2>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-full bg-stone-100 p-2 text-slate-600 transition hover:bg-stone-200"
            aria-label="Cerrar"
          >
            <X className="size-5" />
          </button>
        </AdminModalHeader>

        <AdminModalBody cms>
          <AdminEditorConPreview preview={<PreviewTextoInstitucionalLive form={form} tipo={tipo} />}>
            <label className="grid gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">{"T\u00edtulo de la secci\u00f3n"}<input
                name="title"
                value={form.title}
                onChange={cambiarCampo}
                className="rounded-xl border border-slate-300 px-4 py-3 text-base font-normal normal-case tracking-normal text-slate-950 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                required
              />
            </label>

            <label className="grid gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">{"Texto de la secci\u00f3n"}<textarea
                name="description"
                value={form.description}
                onChange={cambiarCampo}
                rows={8}
                className="resize-none rounded-xl border border-slate-300 px-4 py-3 text-base font-normal normal-case leading-7 tracking-normal text-slate-950 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                required
              />
            </label>
          </AdminEditorConPreview>
        </AdminModalBody>

        <AdminModalFooter>
          <button
            type="button"
            onClick={onCerrar}
            className="w-full rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 sm:w-auto"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="w-full rounded-xl bg-amber-700 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </AdminModalFooter>
      </form>
    </AdminModal>
  );
}

function ModalNuevaFoto({ onCerrar, onAgregar }) {
  const [form, setForm] = useState({ title: "", image: "" });

  const cambiarCampo = (event) => {
    const { name, value } = event.target;
    setForm((actual) => ({ ...actual, [name]: value }));
  };

  const enviar = (event) => {
    event.preventDefault();
    const title = form.title.trim();
    const image = form.image.trim();
    if (!title || !image) return;
    onAgregar({ title, image });
  };

  return (
    <AdminModal open onClose={onCerrar} maxWidth="max-w-lg" labelledBy="admin-nueva-foto-title" elevated>
      <form onSubmit={enviar} className="flex min-h-0 flex-1 flex-col">
        <AdminModalHeader>
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700">
              <ImagePlus className="size-5" />
            </span>
            <h2 id="admin-nueva-foto-title" className="truncate text-lg font-bold text-slate-950 sm:text-xl">
              Nueva foto
            </h2>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-full bg-stone-100 p-2 text-slate-600 transition hover:bg-stone-200"
            aria-label="Cerrar"
          >
            <X className="size-5" />
          </button>
        </AdminModalHeader>

        <AdminModalBody className="space-y-4">
          {form.image.trim() ? (
            <div className="aspect-video overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              <img src={form.image.trim()} alt="" className="size-full object-cover" />
            </div>
          ) : (
            <div className="grid aspect-video place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-400">
              <Image className="size-8" />
            </div>
          )}

          <label className="grid gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">{"T\u00edtulo"}<input
              name="title"
              value={form.title}
              onChange={cambiarCampo}
              placeholder={"Ej. Feria del caf\u00e9"}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-normal normal-case tracking-normal text-slate-950 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              required
            />
          </label>

          <label className="grid gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
            URL de imagen
            <input
              name="image"
              value={form.image}
              onChange={cambiarCampo}
              placeholder="https://..."
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-normal normal-case tracking-normal text-slate-950 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              required
            />
          </label>
        </AdminModalBody>

        <AdminModalFooter>
          <button
            type="button"
            onClick={onCerrar}
            className="w-full rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 sm:w-auto"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="w-full rounded-xl bg-teal-700 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-teal-800 sm:w-auto"
          >{"Agregar a la galer\u00eda"}</button>
        </AdminModalFooter>
      </form>
    </AdminModal>
  );
}

function ModalGaleria({ info, onCerrar, onGuardar, guardando, puedeEliminar }) {
  const [gallery, setGallery] = useState(() => (Array.isArray(info.gallery) ? info.gallery : []));
  const [busqueda, setBusqueda] = useState("");
  const [agregandoFoto, setAgregandoFoto] = useState(false);

  const galleryFiltrada = useMemo(
    () => filtrarPorBusqueda(gallery, busqueda, (item) => [item.title, item.image]),
    [gallery, busqueda],
  );

  const cambiarItem = (id, campo, valor) => {
    setGallery((actual) => actual.map((item) => (item.id === id ? { ...item, [campo]: valor } : item)));
  };

  const agregarItem = ({ title, image }) => {
    setGallery((actual) => [...actual, { id: Date.now(), title, image }]);
    setAgregandoFoto(false);
  };

  const eliminarItem = (id) => {
    setGallery((actual) => actual.filter((item) => item.id !== id));
  };

  const enviar = (event) => {
    event.preventDefault();
    onGuardar(gallery.filter((item) => item.title.trim() || item.image.trim()));
  };

  return (
    <>
    <AdminModal open onClose={onCerrar} maxWidth="max-w-5xl" labelledBy="admin-galeria-modal-title">
      <form onSubmit={enviar} className="flex min-h-0 flex-1 flex-col">
        <AdminModalHeader>
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700">
              <Image className="size-5" />
            </span>
            <h2 id="admin-galeria-modal-title" className="truncate text-lg font-bold text-slate-950 sm:text-xl">{"Galer\u00eda institucional"}</h2>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-full bg-stone-100 p-2 text-slate-600 transition hover:bg-stone-200"
            aria-label="Cerrar"
          >
            <X className="size-5" />
          </button>
        </AdminModalHeader>

        <AdminModalBody cms className="space-y-5">
          <AdminEditorConPreview
            preview={<PreviewGaleriaLive items={gallery} />}
            ayuda={"Administr\u00e1 las fotos que aparecen en la galer\u00eda de Sobre nosotros."}
          >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Fotos actuales</p>
            <button
              type="button"
              onClick={() => setAgregandoFoto(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-teal-200 px-4 py-2 text-sm font-bold text-teal-700 transition hover:bg-teal-50 sm:w-auto"
            >
              <ImagePlus className="size-4" />
              Agregar foto
            </button>
          </div>

          <AdminListaToolbar
            compacto
            busqueda={busqueda}
            onBusquedaChange={setBusqueda}
            placeholder={"Buscar por t\u00edtulo o URL..."}
            total={gallery.length}
            visibles={galleryFiltrada.length}
            hayFiltrosActivos={Boolean(busqueda.trim())}
            onLimpiar={() => setBusqueda("")}
          />

          <div className="space-y-4">
            {galleryFiltrada.length === 0 ? (
              <AdminListaVacia
                mensaje={gallery.length === 0 ? "No hay fotos en la galer\u00eda." : "No hay fotos que coincidan con la b\u00fasqueda."}
                onLimpiar={busqueda.trim() ? () => setBusqueda("") : undefined}
              />
            ) : null}
            {galleryFiltrada.map((item, index) => (
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
                  <label className="grid gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">{"T\u00edtulo"}<input
                      value={item.title}
                      onChange={(event) => cambiarItem(item.id, "title", event.target.value)}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-normal normal-case tracking-normal text-slate-950 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                      required
                    />
                  </label>
                  <label className="grid gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                    URL de imagen
                    <input
                      value={item.image}
                      onChange={(event) => cambiarItem(item.id, "image", event.target.value)}
                      placeholder="https://..."
                      className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-normal normal-case tracking-normal text-slate-950 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                      required
                    />
                  </label>
                </div>

                {puedeEliminar ? (
                  <button
                    type="button"
                    onClick={() => eliminarItem(item.id)}
                    className="inline-flex size-10 items-center justify-center self-start rounded-xl bg-red-50 text-red-700 transition hover:bg-red-100 md:self-center"
                    aria-label="Eliminar foto"
                  >
                    <Trash2 className="size-5" />
                  </button>
                ) : (
                  <span className="self-start text-xs font-semibold text-slate-400 md:self-center">Sin eliminar</span>
                )}
              </div>
            ))}
          </div>
          </AdminEditorConPreview>
        </AdminModalBody>

        <AdminModalFooter>
          <button
            type="button"
            onClick={onCerrar}
            className="w-full rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 sm:w-auto"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="w-full rounded-xl bg-amber-700 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </AdminModalFooter>
      </form>
    </AdminModal>
    {agregandoFoto ? (
      <ModalNuevaFoto onCerrar={() => setAgregandoFoto(false)} onAgregar={agregarItem} />
    ) : null}
    </>
  );
}

const AdminInformacionSobreNosotros = () => {
  const actor = (() => {
    try {
      return getActiveSessionUser();
    } catch {
      return null;
    }
  })();
  const actorRoles = Array.isArray(actor?.roles) ? actor.roles : [];
  const esSuperAdmin = tienePermiso(actorRoles, "inactivar_informacion");
  const loadAbout = useCallback(() => fetchAboutAdminPageData(), []);
  const { data, status, error: loadError, reload } = useCachedPageData("about-admin", loadAbout);
  const { showLoading, loadingMessage } = useAdminPageGate('/admin/sobre-nosotros', status === 'ready');

  const [info, setInfo] = useState(infoInicial);
  const [guardando, setGuardando] = useState(false);
  const [editandoTexto, setEditandoTexto] = useState(null);
  const [editandoGaleria, setEditandoGaleria] = useState(false);

  const seccionesSobreNosotros = useMemo(() => ([
    {
      id: "historia",
      tipo: "texto",
      busqueda: ["Historia", info.historia?.title, info.historia?.description],
    },
    {
      id: "mission",
      tipo: "texto",
      busqueda: ["Misi\u00f3n", info.mission?.title, info.mission?.description],
    },
    {
      id: "vision",
      tipo: "texto",
      busqueda: ["Visi\u00f3n", info.vision?.title, info.vision?.description],
    },
    {
      id: "galeria",
      tipo: "galeria",
      busqueda: ["Galer\u00eda", "Galer\u00eda institucional", ...(info.gallery ?? []).map((item) => item.title)],
    },
  ]), [info]);

  const {
    busqueda,
    setBusqueda,
    filtrados: seccionesFiltradas,
    limpiar: limpiarFiltros,
    hayFiltrosActivos,
    total: totalSecciones,
    visibles: seccionesVisibles,
  } = useAdminListaFiltros(seccionesSobreNosotros, {
    buscarEn: (seccion) => seccion.busqueda,
  });

  const idsVisibles = useMemo(
    () => new Set(seccionesFiltradas.map((seccion) => seccion.id)),
    [seccionesFiltradas],
  );

  useEffect(() => {
    if (data) {
      setInfo(data);
    }
  }, [data]);

  const cargando = status === "loading";
  const error = status === "error" ? loadError || "No se pudo cargar la informaci\u00f3n de sobre nosotros." : "";

  const guardarTexto = async (tipo, form) => {
    try {
      setGuardando(true);
      const actualizado = await actualizarSeccion(tipo, form);
      setInfo((actual) => ({ ...actual, [tipo]: actualizado }));
      setEditandoTexto(null);
    } catch (err) {
      alert(err.message || "No se pudo guardar la secci\u00f3n.");
    } finally {
      setGuardando(false);
    }
  };

  const guardarGaleria = async (gallery) => {
    try {
      setGuardando(true);
      const actual = Array.isArray(info.gallery) ? info.gallery : [];
      const actualPorId = new Map(actual.map((item) => [Number(item.id), item]));
      const nuevaPorId = new Map(gallery.map((item) => [Number(item.id), item]));

      const removidos = esSuperAdmin ? actual.filter((item) => !nuevaPorId.has(Number(item.id))) : [];
      const agregados = gallery.filter((item) => !actualPorId.has(Number(item.id)));
      const editados = gallery.filter((item) => {
        const previo = actualPorId.get(Number(item.id));
        if (!previo) return false;
        return (previo.title ?? "") !== (item.title ?? "") || (previo.image ?? "") !== (item.image ?? "");
      });

      await Promise.all(removidos.map((item) => eliminarGaleriaItem(item.id)));
      await Promise.all(agregados.map((item) => agregarGaleriaItem({ title: item.title, image: item.image })));
      await Promise.all(
        editados.map((item) =>
          actualizarGaleriaItem(item.id, {
            title: item.title,
            image: item.image,
          })
        )
      );

      const recargado = await obtenerInformacionSobreNosotros();
      setInfo({ ...infoInicial, ...recargado, gallery: Array.isArray(recargado.gallery) ? recargado.gallery : [] });
      setEditandoGaleria(false);
    } catch (err) {
      alert(err.message || "No se pudo guardar la galer\u00eda.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <AdminPageGate showLoading={showLoading} message={loadingMessage}>
    <AdminLayout>
      <section className="space-y-5">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Secciones de sobre nosotros</p>

        {cargando ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">{"Cargando informaci\u00f3n..."}</div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-sm font-semibold text-red-700">
            {error}
            <button
              type="button"
              onClick={reload}
              className="mt-4 block rounded-lg bg-red-700 px-4 py-2 text-white"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <>
            <AdminListaToolbar
              busqueda={busqueda}
              onBusquedaChange={setBusqueda}
              placeholder={"Buscar secciones por t\u00edtulo o contenido..."}
              total={totalSecciones}
              visibles={seccionesVisibles}
              hayFiltrosActivos={hayFiltrosActivos}
              onLimpiar={limpiarFiltros}
            />

            {seccionesFiltradas.length === 0 ? (
              <AdminListaVacia onLimpiar={limpiarFiltros} />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {idsVisibles.has("historia") ? (
                <AdminSeccionCard
                  etiqueta="Historia"
                  titulo={info.historia?.title || "Historia"}
                  icono={BookOpenText}
                  onEditar={() => setEditandoTexto("historia")}
                />
              ) : null}
              {idsVisibles.has("mission") ? (
                <AdminSeccionCard
                  etiqueta={"Misi\u00f3n"}
                  titulo={info.mission?.title || "Misi\u00f3n"}
                  icono={Target}
                  onEditar={() => setEditandoTexto("mission")}
                />
              ) : null}
              {idsVisibles.has("vision") ? (
                <AdminSeccionCard
                  etiqueta={"Visi\u00f3n"}
                  titulo={info.vision?.title || "Visi\u00f3n"}
                  icono={Eye}
                  onEditar={() => setEditandoTexto("vision")}
                />
              ) : null}

              {idsVisibles.has("galeria") ? (
                <AdminSeccionCard
                  etiqueta={"Galer\u00eda de fotos"}
                  titulo={"Galer\u00eda institucional"}
                  icono={Image}
                  borde="border-teal-600"
                  iconoCls="bg-teal-50 text-teal-700"
                  botonCls="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  onEditar={() => setEditandoGaleria(true)}
                />
              ) : null}
              </div>
            )}
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
        <ModalGaleria info={info} onCerrar={() => setEditandoGaleria(false)} onGuardar={guardarGaleria} guardando={guardando} puedeEliminar={esSuperAdmin} />
      ) : null}
    </AdminLayout>
    </AdminPageGate>
  );
};

export default AdminInformacionSobreNosotros;
