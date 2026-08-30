import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { BookOpenText, Eye, Image, ImagePlus, Pencil, Target, Trash2, X } from "lucide-react";
import { useRouterState } from "@tanstack/react-router";

import { AdminLayout } from "../layouts/AdminLayout";
import { AdminModal, AdminModalActions, AdminModalBody, AdminModalFooter, AdminModalHeader } from "../../../Components/Admin/ui/AdminModal";
import { AdminListaToolbar, AdminListaVacia } from "../../../Components/Admin/ui/AdminListaToolbar";
import { AdminPaginacion } from "../../../Components/Admin/ui/AdminPaginacion";
import {
  AdminEditorConPreview,
  PreviewTextoInstitucionalLive,
} from "../../../Components/Admin/ui/AdminCmsPreview";
import { AdminSeccionCard } from "../../../Components/Admin/ui/AdminSeccionCard";
import { CategoriaCampo, CategoriaNueva, CategoriaOpcionBorrar } from "../../../Components/Admin/ui/CategoriaCampo";
import { AdminPageGate } from "../../../Components/AdminPageGate/AdminPageGate";
import { useAdminPageGate } from "../../../hooks/useAdminPageGate";
import { useCachedPageData } from "../../../hooks/useCachedPageData";
import { useAdminListaFiltros } from "../../../hooks/useAdminListaFiltros";
import { useAdminPaginacion } from "../../../hooks/useAdminPaginacion";
import { filtrarPorBusqueda } from "../../../lib/adminListaFiltros";
import { categoriasUnicas, filtrarPorCategoria, TIPO_CATEGORIA_GALERIA } from "../../../lib/categorias";
import { fetchAboutAdminPageData } from "../../../lib/aboutAdminPageData";
import {
  actualizarGaleriaItem,
  actualizarSeccion,
  agregarGaleriaItem,
  eliminarGaleriaItem,
  obtenerInformacionSobreNosotros,
} from "../../../services/informacionService";
import { obtenerCategorias } from "../../../services/categoriasService";
import { getActiveSessionUser } from "../../../services/sessionService";
import { tienePermiso } from "../../../lib/permisos";
import { CampoLimitePalabras } from "../../../Components/Admin/ui/CampoLimitePalabras";
import {
  MAX_PALABRAS_ETIQUETA,
  MAX_PALABRAS_TEXTO_LARGO,
  MAX_PALABRAS_TITULO,
} from "../../../lib/formLimits";
import { ST } from "../../../Components/T/ST";
import { useTraducir } from "../../../hooks/useTraducir";
import { t } from "../../../lib/t";
import { useIdioma } from "../../../lib/useIdioma";
import { asegurarCamposEnEspanol, pareceIngles, traducirCamposObjeto } from "../../../lib/traducir";

const TEXTO_CAMPOS = ["eyebrow", "title", "description"];
const FOTO_CAMPOS = ["title", "categoria"];

const infoInicial = {
  hero: {},
  historia: {
    title: "",
    description: "",
    eyebrow: "",
    image: "",
  },
  mission: {
    title: "",
    description: "",
    eyebrow: "",
    image: "",
  },
  vision: {
    title: "",
    description: "",
    eyebrow: "",
    image: "",
  },
  gallery: [],
};

const estilos = {
  historia: {
    borde: "border-amber-700",
    icono: "text-amber-700",
    etiqueta: "Historia",
    resumen: "Resumen institucional de nuestra historia.",
    Icon: BookOpenText,
  },
  mission: {
    borde: "border-amber-700",
    icono: "text-amber-700",
    etiqueta: "Misi\u00f3n",
    resumen: "Texto institucional de misi\u00f3n.",
    Icon: Target,
  },
  vision: {
    borde: "border-amber-700",
    icono: "text-amber-700",
    etiqueta: "Visi\u00f3n",
    resumen: "Texto institucional de visi\u00f3n.",
    Icon: Eye,
  },
};

function ModalTexto({ tipo, data, onCerrar, onGuardar, guardando }) {
  const { idioma } = useIdioma();
  const [form, setForm] = useState(() => ({ title: "", description: "", image: "", eyebrow: "", ...data }));
  const estilo = estilos[tipo];
  const Icon = estilo.Icon;
  const tEtiqueta = useTraducir(estilo.etiqueta);

  useEffect(() => {
    let cancelado = false;
    const base = { title: "", description: "", image: "", eyebrow: "", ...data };
    if (idioma !== "en") {
      setForm(base);
      return undefined;
    }
    (async () => {
      const traducido = await traducirCamposObjeto(base, TEXTO_CAMPOS);
      if (!cancelado) setForm(traducido);
    })();
    return () => {
      cancelado = true;
    };
  }, [data, idioma]);

  const cambiarCampo = (event) => {
    const { name, value } = event.target;
    setForm((actual) => ({ ...actual, [name]: value }));
  };

  const enviar = async (event) => {
    event.preventDefault();
    const paraGuardar = await asegurarCamposEnEspanol(form, TEXTO_CAMPOS);
    onGuardar(tipo, paraGuardar);
  };

  return (
    <AdminModal open onClose={onCerrar} maxWidth="max-w-xl" labelledBy="admin-texto-modal-title">
      <form onSubmit={enviar} className="flex min-h-0 flex-1 flex-col">
        <AdminModalHeader>
          <div className="flex min-w-0 items-center gap-2.5">
            <Icon className={`size-6 shrink-0 ${estilo.icono}`} strokeWidth={1.75} aria-hidden="true" />
            <h2 id="admin-texto-modal-title" className="truncate text-[length:var(--text-subtitle)] font-bold text-slate-950">{form.title || tEtiqueta}</h2>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label={t("Cerrar")}
          >
            <X className="size-5" />
          </button>
        </AdminModalHeader>

        <AdminModalBody cms>
          <AdminEditorConPreview preview={<PreviewTextoInstitucionalLive form={form} tipo={tipo} />}>
            <CampoLimitePalabras
              label={"Etiqueta superior"}
              name="eyebrow"
              value={form.eyebrow}
              onChange={cambiarCampo}
              maxPalabras={MAX_PALABRAS_ETIQUETA}
            />

            <CampoLimitePalabras
              label={"T\u00edtulo de la secci\u00f3n"}
              name="title"
              value={form.title}
              onChange={cambiarCampo}
              maxPalabras={MAX_PALABRAS_TITULO}
              required
            />

            <CampoLimitePalabras
              label={"Texto de la secci\u00f3n"}
              name="description"
              value={form.description}
              onChange={cambiarCampo}
              maxPalabras={MAX_PALABRAS_TEXTO_LARGO}
              multiline
              rows={8}
              required
            />

            <label className="grid gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              <ST>URL de foto</ST>
              <input
                name="image"
                value={form.image}
                onChange={cambiarCampo}
                placeholder="https://..."
                className="h-[var(--control-height)] w-full rounded-full border border-slate-200 bg-slate-50 px-4 text-[length:var(--text-body)] font-normal normal-case tracking-normal text-slate-950 shadow-none outline-none transition focus:border-slate-400 focus:bg-white focus:shadow-none focus:ring-0 focus:outline-none"
              />
            </label>

          </AdminEditorConPreview>
        </AdminModalBody>

        <AdminModalFooter>
          <AdminModalActions
            buttonStyle="voluntariado"
            onCancel={onCerrar}
            primaryLabel={guardando ? "Guardando..." : "Guardar cambios"}
            primaryDisabled={guardando}
          />
        </AdminModalFooter>
      </form>
    </AdminModal>
  );
}

function ModalFoto({ onCerrar, onGuardar, categorias = [], inicial = null, guardando = false }) {
  const { idioma } = useIdioma();
  const esEdicion = Boolean(inicial);
  const tEditar = useTraducir("Editar");
  const tNuevaFoto = useTraducir("Nueva foto");
  const [form, setForm] = useState({
    title: inicial?.title || "",
    image: inicial?.image || "",
    categoria: inicial?.categoria || "",
  });

  useEffect(() => {
    let cancelado = false;
    const base = {
      title: inicial?.title || "",
      image: inicial?.image || "",
      categoria: inicial?.categoria || "",
    };
    if (idioma !== "en") {
      setForm(base);
      return undefined;
    }
    (async () => {
      const traducido = await traducirCamposObjeto(base, FOTO_CAMPOS);
      if (!cancelado) setForm(traducido);
    })();
    return () => {
      cancelado = true;
    };
  }, [inicial, idioma]);

  const cambiarCampo = (event) => {
    const { name, value } = event.target;
    setForm((actual) => ({ ...actual, [name]: value }));
  };

  const enviar = async (event) => {
    event.preventDefault();
    if (guardando) return;
    const paraGuardar = await asegurarCamposEnEspanol(form, FOTO_CAMPOS);
    const title = paraGuardar.title.trim();
    const image = form.image.trim();
    if (!title || !image) return;
    onGuardar({
      id: inicial?.id,
      title,
      image,
      categoria: (paraGuardar.categoria || "").trim(),
    });
  };

  return (
    <AdminModal open onClose={onCerrar} maxWidth="max-w-xl" labelledBy="admin-foto-title" elevated>
      <form onSubmit={enviar} className="flex min-h-0 flex-1 flex-col">
        <AdminModalHeader>
          <div className="flex min-w-0 items-center gap-2.5">
            {esEdicion ? (
              <Pencil className="size-6 shrink-0 text-teal-700" strokeWidth={1.75} aria-hidden="true" />
            ) : (
              <ImagePlus className="size-6 shrink-0 text-teal-700" strokeWidth={1.75} aria-hidden="true" />
            )}
            <h2 id="admin-foto-title" className="truncate text-[length:var(--text-subtitle)] font-bold text-slate-950">
              {esEdicion ? tEditar : tNuevaFoto}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-60"
            aria-label={t("Cerrar")}
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

          <CampoLimitePalabras
            label={"T\u00edtulo"}
            name="title"
            value={form.title}
            onChange={cambiarCampo}
            maxPalabras={MAX_PALABRAS_TITULO}
            placeholder={"Ej. Feria del caf\u00e9"}
            required
          />

          <label className="grid gap-2 text-[length:var(--text-body)] font-bold uppercase tracking-wide text-slate-500">
            <ST>URL de imagen</ST>
            <input
              name="image"
              value={form.image}
              onChange={cambiarCampo}
              placeholder="https://..."
              className="h-[var(--control-height)] rounded-full border border-slate-200 bg-slate-50 px-4 text-[length:var(--text-body)] font-normal normal-case tracking-normal text-slate-950 outline-none transition focus:border-slate-400 focus:bg-white"
              required
            />
          </label>

          <CategoriaCampo
            tipo={TIPO_CATEGORIA_GALERIA}
            value={form.categoria}
            extras={categorias}
            onChange={(valor) => setForm((actual) => ({ ...actual, categoria: valor }))}
          />
        </AdminModalBody>

        <AdminModalFooter>
          <AdminModalActions
            buttonStyle="voluntariado"
            onCancel={onCerrar}
            primaryDisabled={guardando}
            primaryLabel={
              guardando
                ? "Guardando..."
                : esEdicion
                  ? "Guardar foto"
                  : "Agregar a la galer\u00eda"
            }
          />
        </AdminModalFooter>
      </form>
    </AdminModal>
  );
}

function GaleriaAcciones({ puedeEliminar, onEditar, onEliminar }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        type="button"
        onClick={onEditar}
        className="inline-flex h-8 items-center justify-center gap-1 rounded-full border border-slate-950 bg-slate-950 px-2.5 text-[length:var(--text-body)] font-semibold text-white transition hover:border-neutral-700 hover:bg-neutral-700"
      >
        <Pencil className="size-3 shrink-0" aria-hidden="true" />
        <span><ST>Editar</ST></span>
      </button>
      {puedeEliminar ? (
        <button
          type="button"
          onClick={onEliminar}
          className="inline-flex h-8 items-center justify-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 text-[length:var(--text-body)] font-semibold text-rose-700 transition hover:bg-rose-100"
        >
          <Trash2 className="size-3 shrink-0" aria-hidden="true" />
          <span><ST>Eliminar</ST></span>
        </button>
      ) : null}
    </div>
  );
}

function GaleriaInlineEditor({ galleryInicial, onRecargar, puedeEliminar }) {
  const [gallery, setGallery] = useState(() => (Array.isArray(galleryInicial) ? galleryInicial : []));
  const [busqueda, setBusqueda] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("todos");
  const [modalFoto, setModalFoto] = useState(null);
  const [categoriasApi, setCategoriasApi] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const reparacionHecha = useRef(false);

  useEffect(() => {
    setGallery(Array.isArray(galleryInicial) ? galleryInicial : []);
  }, [galleryInicial]);

  // Si quedó inglés en Supabase, lo corrige a español una vez al cargar
  useEffect(() => {
    const items = Array.isArray(galleryInicial) ? galleryInicial : [];
    if (!items.length || reparacionHecha.current) return undefined;
    let cancelado = false;
    (async () => {
      let cambio = false;
      for (const item of items) {
        if (!item?.id || typeof item.title !== "string" || !item.title.trim()) continue;
        if (!pareceIngles(item.title)) continue;
        const titleEs = await asegurarCamposEnEspanol({ title: item.title }, ["title"]);
        const nuevo = String(titleEs.title || "").trim();
        if (!nuevo || nuevo === item.title.trim()) continue;
        try {
          await actualizarGaleriaItem(item.id, {
            title: nuevo,
            image: item.image,
            categoria: item.categoria || "",
          });
          cambio = true;
        } catch {
          /* ignore item */
        }
      }
      reparacionHecha.current = true;
      if (!cancelado && cambio) await onRecargar();
    })();
    return () => {
      cancelado = true;
    };
  }, [galleryInicial, onRecargar]);

  const recargarCategorias = () =>
    obtenerCategorias(TIPO_CATEGORIA_GALERIA)
      .then((lista) => setCategoriasApi(lista))
      .catch(() => setCategoriasApi([]));

  useEffect(() => {
    recargarCategorias();
  }, []);

  const nombresCategoriasApi = useMemo(
    () => categoriasApi.map((item) => item.nombre),
    [categoriasApi],
  );
  const categoriasDisponibles = useMemo(
    () => categoriasUnicas([...gallery, ...nombresCategoriasApi.map((nombre) => ({ categoria: nombre }))]),
    [gallery, nombresCategoriasApi],
  );
  const nombresCategoriasEnUso = useMemo(
    () => gallery.map((item) => item.categoria),
    [gallery],
  );

  const galleryFiltrada = useMemo(() => {
    const porTexto = filtrarPorBusqueda(gallery, busqueda, (item) => [item.title, item.image, item.categoria]);
    return filtrarPorCategoria(porTexto, categoriaFiltro === "todos" ? "todas" : categoriaFiltro);
  }, [gallery, busqueda, categoriaFiltro]);

  const { page, setPage, pageItems, totalPages, showPagination } = useAdminPaginacion(galleryFiltrada);

  const guardarFotoModal = async (foto) => {
    try {
      setGuardando(true);
      if (foto.id) {
        await actualizarGaleriaItem(foto.id, {
          title: foto.title,
          image: foto.image,
          categoria: foto.categoria || "",
        });
      } else {
        await agregarGaleriaItem({
          title: foto.title,
          image: foto.image,
          categoria: foto.categoria || "",
        });
      }
      setModalFoto(null);
      await onRecargar();
      await recargarCategorias();
    } catch (err) {
      alert(err?.message || "No se pudo guardar la foto.");
    } finally {
      setGuardando(false);
    }
  };

  const eliminarItem = async (id) => {
    if (!window.confirm("¿Eliminar esta foto de la galería?")) return;
    try {
      setGuardando(true);
      await eliminarGaleriaItem(id);
      await onRecargar();
      await recargarCategorias();
    } catch (err) {
      alert(err?.message || "No se pudo eliminar la foto.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <div className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
          <h1 className="text-[length:var(--text-title)] font-bold text-slate-950"><ST>{"Galer\u00eda"}</ST></h1>
          <button
            type="button"
            disabled={guardando}
            onClick={() => setModalFoto({ modo: "nueva" })}
            className="inline-flex h-[var(--control-height)] w-full items-center justify-center gap-2 rounded-full border border-slate-950 bg-slate-950 px-4 text-[length:var(--text-body)] font-semibold text-white transition hover:border-neutral-700 hover:bg-neutral-700 disabled:opacity-60 sm:w-auto"
          >
            <ImagePlus className="size-4" />
            <ST>Agregar foto</ST>
          </button>
        </div>

        <AdminListaToolbar
          compacto
          busqueda={busqueda}
          onBusquedaChange={setBusqueda}
          placeholder={"Buscar por t\u00edtulo, categor\u00eda o URL..."}
          total={gallery.length}
          visibles={galleryFiltrada.length}
          hayFiltrosActivos={Boolean(busqueda.trim()) || categoriaFiltro !== "todos"}
          onLimpiar={() => {
            setBusqueda("");
            setCategoriaFiltro("todos");
          }}
          filtros={[
            {
              id: "categoria",
              label: "Categoría",
              value: categoriaFiltro || "todos",
              onChange: setCategoriaFiltro,
              footer: (
                <CategoriaNueva
                  tipo={TIPO_CATEGORIA_GALERIA}
                  enMenu
                  onCreada={(nombre) => {
                    recargarCategorias();
                    if (nombre) setCategoriaFiltro(nombre);
                  }}
                  placeholder="Ej. Eventos"
                />
              ),
              renderOptionEnd: (opcion) =>
                opcion.id ? (
                  <CategoriaOpcionBorrar
                    categoria={opcion}
                    nombresEnUso={nombresCategoriasEnUso}
                    onEliminada={(nombre) => {
                      recargarCategorias();
                      if ((categoriaFiltro || "").toLowerCase() === String(nombre || "").toLowerCase()) {
                        setCategoriaFiltro("todos");
                      }
                    }}
                  />
                ) : null,
              opciones: [
                { value: "todos", label: "Todas" },
                ...categoriasDisponibles.map((categoria) => {
                  const registro = categoriasApi.find(
                    (item) => (item.nombre || "").toLowerCase() === String(categoria).toLowerCase(),
                  );
                  return {
                    value: categoria,
                    label: categoria,
                    id: registro?.id,
                    nombre: categoria,
                    usos: registro?.usos,
                  };
                }),
              ],
            },
          ]}
        />

        {galleryFiltrada.length === 0 ? (
          <AdminListaVacia
            mensaje={gallery.length === 0 ? "No hay fotos en la galer\u00eda." : "No hay fotos que coincidan con la b\u00fasqueda."}
            onLimpiar={
              busqueda.trim() || categoriaFiltro !== "todos"
                ? () => {
                    setBusqueda("");
                    setCategoriaFiltro("todos");
                  }
                : undefined
            }
          />
        ) : (
          <>
            <div className="admin-table-shell hidden min-w-0 md:block">
              <table className="w-full text-left text-[length:var(--text-body)]">
                <thead>
                  <tr>
                    <th scope="col"><ST>Imagen</ST></th>
                    <th scope="col"><ST>{"T\u00edtulo"}</ST></th>
                    <th scope="col"><ST>{"Categor\u00eda"}</ST></th>
                    <th scope="col"><ST>Acciones</ST></th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 last:border-b-0">
                      <td className="py-3 align-middle">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title || "Foto"}
                            className="h-12 w-12 rounded-xl object-cover ring-1 ring-slate-200"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-200 text-slate-500">
                            <Image className="size-5" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 align-middle font-medium text-slate-900">
                        {item.title ? <ST>{item.title}</ST> : "—"}
                      </td>
                      <td className="px-4 py-3 align-middle text-slate-600">
                        {item.categoria ? <ST>{item.categoria}</ST> : "—"}
                      </td>
                      <td className="py-3 align-middle">
                        <GaleriaAcciones
                          puedeEliminar={puedeEliminar}
                          onEditar={() => setModalFoto({ modo: "editar", item })}
                          onEliminar={() => eliminarItem(item.id)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 md:hidden">
              {pageItems.map((item) => (
                <article key={item.id} className="flex gap-3 px-4 py-4">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title || "Foto"}
                      className="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-slate-200"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-500">
                      <Image className="size-5" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1 space-y-2">
                    <div>
                      <p className="font-semibold text-slate-950">{item.title ? <ST>{item.title}</ST> : <ST>Sin título</ST>}</p>
                      <p className="text-slate-500">{item.categoria ? <ST>{item.categoria}</ST> : <ST>Sin categoría</ST>}</p>
                    </div>
                    <GaleriaAcciones
                      puedeEliminar={puedeEliminar}
                      onEditar={() => setModalFoto({ modo: "editar", item })}
                      onEliminar={() => eliminarItem(item.id)}
                    />
                  </div>
                </article>
              ))}
            </div>

            {showPagination ? (
              <AdminPaginacion
                page={page}
                totalPages={totalPages}
                total={galleryFiltrada.length}
                onChange={setPage}
                label={"Paginaci\u00f3n de galer\u00eda"}
              />
            ) : null}
          </>
        )}
      </div>

      {modalFoto ? (
        <ModalFoto
          key={modalFoto.item?.id ?? "nueva"}
          onCerrar={() => !guardando && setModalFoto(null)}
          onGuardar={guardarFotoModal}
          categorias={categoriasDisponibles}
          inicial={modalFoto.modo === "editar" ? modalFoto.item : null}
          guardando={guardando}
        />
      ) : null}
    </>
  );
}

const AdminInformacionSobreNosotros = () => {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const esVistaGaleria = pathname === "/admin/galeria";
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
  const { showLoading, loadingMessage } = useAdminPageGate(
    esVistaGaleria ? "/admin/galeria" : "/admin/sobre-nosotros",
    status === "ready",
  );

  const [info, setInfo] = useState(infoInicial);
  const [guardando, setGuardando] = useState(false);
  const [editandoTexto, setEditandoTexto] = useState(null);

  const seccionesSobreNosotros = useMemo(() => {
    if (esVistaGaleria) return [];
    return [
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
    ];
  }, [esVistaGaleria, info]);

  const {
    busqueda,
    setBusqueda,
    valoresFiltro,
    setValorFiltro,
    filtrados: seccionesFiltradas,
    limpiar: limpiarFiltros,
    hayFiltrosActivos,
    total: totalSecciones,
    visibles: seccionesVisibles,
  } = useAdminListaFiltros(seccionesSobreNosotros, {
    buscarEn: (seccion) => seccion.busqueda,
    filtrosConfig: [{ id: "tipo", obtenerValor: (seccion) => seccion.tipo }],
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
      await reload();
      setEditandoTexto(null);
    } catch (err) {
      alert(err.message || "No se pudo guardar la secci\u00f3n.");
    } finally {
      setGuardando(false);
    }
  };

  const recargarGaleria = async () => {
    const recargado = await obtenerInformacionSobreNosotros();
    setInfo({
      ...infoInicial,
      ...recargado,
      gallery: Array.isArray(recargado.gallery) ? recargado.gallery : [],
    });
    await reload();
  };

  return (
    <AdminPageGate showLoading={showLoading} message={loadingMessage}>
    <AdminLayout>
      {esVistaGaleria ? (
        <section className="space-y-5">
          {cargando ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-[length:var(--text-body)] text-slate-500 shadow-sm">
              <ST>{"Cargando informaci\u00f3n..."}</ST>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-[length:var(--text-body)] font-semibold text-red-700">
              {error}
              <button
                type="button"
                onClick={reload}
                className="mt-4 block h-[var(--control-height)] rounded-full bg-red-700 px-4 text-white"
              >
                <ST>Reintentar</ST>
              </button>
            </div>
          ) : (
            <GaleriaInlineEditor
              galleryInicial={info.gallery}
              onRecargar={recargarGaleria}
              puedeEliminar={esSuperAdmin}
            />
          )}
        </section>
      ) : (
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5">
            <h1 className="text-[length:var(--text-title)] font-bold text-slate-950"><ST>Historia</ST></h1>
          </div>

          {cargando ? (
            <div className="p-8 text-[length:var(--text-body)] text-slate-500"><ST>{"Cargando informaci\u00f3n..."}</ST></div>
          ) : error ? (
            <div className="p-8 text-[length:var(--text-body)] font-semibold text-red-700">
              {error}
              <button
                type="button"
                onClick={reload}
                className="mt-4 block h-[var(--control-height)] rounded-full bg-red-700 px-4 text-white"
              >
                <ST>Reintentar</ST>
              </button>
            </div>
          ) : (
            <>
              <AdminListaToolbar
                busqueda={busqueda}
                onBusquedaChange={setBusqueda}
                placeholder={"Buscar historia, misi\u00f3n o visi\u00f3n..."}
                total={totalSecciones}
                visibles={seccionesVisibles}
                hayFiltrosActivos={hayFiltrosActivos}
                onLimpiar={limpiarFiltros}
              />

              {seccionesFiltradas.length === 0 ? (
                <AdminListaVacia onLimpiar={limpiarFiltros} />
              ) : (
                <div className="grid min-w-0 grid-cols-1 gap-3 overflow-x-hidden p-4 sm:grid-cols-2 sm:px-6 sm:pb-6 xl:grid-cols-3">
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
                </div>
              )}
            </>
          )}
        </section>
      )}

      {editandoTexto ? (
        <ModalTexto
          tipo={editandoTexto}
          data={info[editandoTexto] ?? {}}
          onCerrar={() => setEditandoTexto(null)}
          onGuardar={guardarTexto}
          guardando={guardando}
        />
      ) : null}
    </AdminLayout>
    </AdminPageGate>
  );
};

export default AdminInformacionSobreNosotros;
