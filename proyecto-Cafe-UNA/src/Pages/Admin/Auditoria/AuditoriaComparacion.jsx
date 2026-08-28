const ETIQUETAS_CAMPO = {
  id: "ID",
  nombre: "Nombre",
  titulo: "Título",
  peso: "Peso",
  stock: "Stock",
  estado: "Estado",
  imagen: "Imagen",
  categoria: "Categoría",
  subcategoria: "Subcategoría",
  disponible: "Disponible",
  alertastock: "Alerta de stock",
  descripcion: "Descripción",
  precionormal: "Precio (sin IVA)",
  precio: "Precio",
  esdestacado: "Destacado",
  motivo: "Motivo",
  correo: "Correo",
  email: "Correo",
  telefono: "Teléfono",
  rol: "Rol",
  roles: "Roles",
  clave: "Clave",
  codigo: "Código",
  cantidad: "Cantidad",
  total: "Total",
  subtotal: "Subtotal",
  ubicacion: "Ubicación",
  idubicacion: "Ubicación",
  idproducto: "Producto",
  idusuario: "Usuario",
};

const CAMPOS_OCULTOS = new Set([
  "password",
  "contrasena",
  "contraseña",
  "hash",
  "salt",
  "token",
  "refreshtoken",
]);

const CAMPOS_TECNICOS = new Set([
  "createdat",
  "updatedat",
  "deletedat",
  "fechacreacion",
  "fechaactualizacion",
]);

function parseDatos(valor) {
  if (valor == null || valor === "") return null;
  if (typeof valor === "string") {
    const texto = valor.trim();
    if (!texto || texto === "—") return null;
    try {
      const parsed = JSON.parse(texto);
      if (parsed && typeof parsed === "object") return parsed;
      return { valor: parsed };
    } catch {
      return { detalle: texto };
    }
  }
  if (typeof valor === "object") return valor;
  return { valor };
}

function claveNormalizada(clave) {
  return String(clave || "")
    .replace(/[_-]/g, "")
    .toLowerCase();
}

function etiquetaCampo(clave) {
  const normal = claveNormalizada(clave);
  if (ETIQUETAS_CAMPO[normal]) return ETIQUETAS_CAMPO[normal];
  const limpio = String(clave || "")
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2");
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
}

function esUrl(valor) {
  return typeof valor === "string" && /^https?:\/\//i.test(valor.trim());
}

function valoresIguales(a, b) {
  if (Object.is(a, b)) return true;
  if (a == null && b == null) return true;
  if (typeof a === "object" || typeof b === "object") {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return String(a) === String(b);
    }
  }
  return String(a) === String(b);
}

function formatearValor(clave, valor) {
  if (valor == null || valor === "") return "Sin dato";
  if (typeof valor === "boolean") return valor ? "Sí" : "No";
  const normal = claveNormalizada(clave);
  if (typeof valor === "number" && Number.isFinite(valor)) {
    if (normal.includes("precio") || normal.includes("total") || normal.includes("subtotal")) {
      return `CRC ${valor.toLocaleString("es-CR")}`;
    }
    return String(valor);
  }
  if (typeof valor === "string") {
    if (esUrl(valor)) {
      if (normal.includes("imagen") || normal.includes("foto") || normal.includes("logo")) {
        return "Imagen adjunta";
      }
      return "Enlace adjunto";
    }
    return valor;
  }
  if (Array.isArray(valor)) {
    if (valor.length === 0) return "Ninguno";
    return valor
      .map((item) => {
        if (item && typeof item === "object") {
          return item.nombre ?? item.Nombre ?? item.etiqueta ?? JSON.stringify(item);
        }
        return String(item);
      })
      .join(", ");
  }
  if (typeof valor === "object") {
    return (
      valor.nombre ??
      valor.Nombre ??
      valor.titulo ??
      valor.Titulo ??
      valor.codigo ??
      valor.Codigo ??
      Object.entries(valor)
        .filter(([k]) => !CAMPOS_OCULTOS.has(claveNormalizada(k)))
        .slice(0, 4)
        .map(([k, v]) => `${etiquetaCampo(k)}: ${v == null ? "Sin dato" : String(v)}`)
        .join(" · ")
    );
  }
  return String(valor);
}

function extraerNombre(datos) {
  if (!datos || typeof datos !== "object" || Array.isArray(datos)) return "";
  const candidatos = [
    "nombre",
    "Nombre",
    "titulo",
    "Titulo",
    "producto",
    "Producto",
    "correo",
    "Correo",
    "email",
    "Email",
    "clave",
    "Clave",
    "codigo",
    "Codigo",
  ];
  for (const clave of candidatos) {
    const valor = datos[clave];
    if (typeof valor === "string" && valor.trim()) return valor.trim();
  }
  return "";
}

function clavesVisibles(datos) {
  if (!datos || typeof datos !== "object" || Array.isArray(datos)) return [];
  return Object.keys(datos).filter((clave) => {
    const normal = claveNormalizada(clave);
    return !CAMPOS_OCULTOS.has(normal) && !CAMPOS_TECNICOS.has(normal);
  });
}

function valorDe(datos, clave) {
  if (!datos || typeof datos !== "object") return undefined;
  if (Object.prototype.hasOwnProperty.call(datos, clave)) return datos[clave];
  const normal = claveNormalizada(clave);
  const encontrada = Object.keys(datos).find((item) => claveNormalizada(item) === normal);
  return encontrada != null ? datos[encontrada] : undefined;
}

function unirClaves(anteriores, nuevos) {
  const ordenPreferido = [
    "nombre",
    "titulo",
    "categoria",
    "subcategoria",
    "peso",
    "stock",
    "precio",
    "precionormal",
    "estado",
    "disponible",
    "descripcion",
    "motivo",
  ];
  const porNormal = new Map();
  for (const clave of [...clavesVisibles(anteriores), ...clavesVisibles(nuevos)]) {
    const normal = claveNormalizada(clave);
    if (!porNormal.has(normal)) porNormal.set(normal, clave);
  }
  const lista = [...porNormal.values()];
  lista.sort((a, b) => {
    const na = claveNormalizada(a);
    const nb = claveNormalizada(b);
    const ia = ordenPreferido.indexOf(na);
    const ib = ordenPreferido.indexOf(nb);
    if (ia !== -1 || ib !== -1) {
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    }
    if (na === "id") return 1;
    if (nb === "id") return -1;
    return etiquetaCampo(a).localeCompare(etiquetaCampo(b), "es");
  });
  return lista;
}

function camposCambiados(anteriores, nuevos, claves) {
  return claves.filter((clave) => !valoresIguales(valorDe(anteriores, clave), valorDe(nuevos, clave)));
}

function resumenCambio({ accion, tabla, detalle, anteriores, nuevos, nombre, cambiados }) {
  const entidad =
    tabla === "productos"
      ? "producto"
      : tabla === "usuarios"
        ? "usuario"
        : tabla === "categorias"
          ? "categoría"
          : tabla === "solicitudes_voluntariado"
            ? "solicitud de voluntariado"
            : "registro";
  const conNombre = nombre ? ` «${nombre}»` : "";

  if (accion === "INSERT") {
    return `Se creó ${entidad === "categoría" ? "la" : "el"} ${entidad}${conNombre}.`;
  }
  if (accion === "DELETE") {
    return `Se eliminó ${entidad === "categoría" ? "la" : "el"} ${entidad}${conNombre}.`;
  }
  if (accion === "AJUSTE_STOCK") {
    const de = anteriores?.Stock ?? anteriores?.stock;
    const a = nuevos?.Stock ?? nuevos?.stock;
    const motivo = nuevos?.Motivo ?? nuevos?.motivo;
    if (de != null && a != null) {
      return `El stock pasó de ${de} a ${a}${motivo ? `. Motivo: ${motivo}` : "."}`;
    }
  }

  if (cambiados.length === 1) {
    const campo = etiquetaCampo(cambiados[0]).toLowerCase();
    const de = formatearValor(cambiados[0], valorDe(anteriores, cambiados[0]));
    const a = formatearValor(cambiados[0], valorDe(nuevos, cambiados[0]));
    return `Se actualizó el ${campo} de ${entidad}${conNombre}: «${de}» → «${a}».`;
  }
  if (cambiados.length > 1) {
    const lista = cambiados.map((clave) => etiquetaCampo(clave).toLowerCase()).join(", ");
    return `Se actualizó ${entidad === "categoría" ? "la" : "el"} ${entidad}${conNombre}. Cambiaron: ${lista}.`;
  }
  if (detalle) return detalle;
  return `Se actualizó ${entidad === "categoría" ? "la" : "el"} ${entidad}${conNombre}.`;
}

function PanelCampos({ titulo, datos, claves, cambiados, vacioTexto }) {
  const hayDatos = datos && typeof datos === "object" && claves.length > 0;
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-[length:var(--text-body)] font-semibold uppercase tracking-wide text-slate-500">{titulo}</p>
      {hayDatos ? (
        <dl className="mt-3 grid max-h-80 gap-2 overflow-auto pr-1">
          {claves.map((clave) => {
            const cambio = cambiados.includes(clave);
            return (
              <div
                key={clave}
                className={`rounded-lg px-2.5 py-2 ${
                  cambio ? "bg-amber-50 ring-1 ring-amber-100" : "bg-slate-50"
                }`}
              >
                <dt className="text-[length:var(--text-body)] font-semibold uppercase tracking-wide text-slate-500">
                  {etiquetaCampo(clave)}
                  {cambio ? (
                    <span className="ml-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-[length:var(--text-body)] font-bold text-amber-800">
                      Cambió
                    </span>
                  ) : null}
                </dt>
                <dd className="mt-0.5 break-words text-[length:var(--text-body)] font-medium text-slate-800">
                  {formatearValor(clave, valorDe(datos, clave))}
                </dd>
              </div>
            );
          })}
        </dl>
      ) : (
        <p className="mt-3 text-[length:var(--text-body)] text-slate-500">{vacioTexto}</p>
      )}
    </div>
  );
}

export function AuditoriaComparacion({ item }) {
  const anteriores = parseDatos(item?.datosAnteriores);
  const nuevos = parseDatos(item?.datosNuevos);
  const claves = unirClaves(anteriores, nuevos);
  const cambiados = camposCambiados(anteriores, nuevos, claves);
  const nombre = extraerNombre(nuevos) || extraerNombre(anteriores);
  const resumen = resumenCambio({
    accion: item?.accion,
    tabla: item?.tabla,
    detalle: item?.detalle,
    anteriores,
    nuevos,
    nombre,
    cambiados,
  });

  return (
    <div className="grid gap-3">
      <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
        <p className="text-[length:var(--text-body)] font-semibold uppercase tracking-wide text-slate-500">Qué sucedió</p>
        <p className="mt-1 text-[length:var(--text-body)] font-semibold text-slate-900">{resumen}</p>
        {nombre ? (
          <p className="mt-1 text-[length:var(--text-body)] text-slate-600">
            {item?.tabla === "usuarios" ? "Usuario" : "Nombre"}:{" "}
            <span className="font-semibold text-slate-800">{nombre}</span>
          </p>
        ) : null}
        {item?.idRegistro ? (
          <p className="mt-1 text-[length:var(--text-body)] text-slate-400">Registro #{item.idRegistro}</p>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <PanelCampos
          titulo="Datos anteriores"
          datos={anteriores}
          claves={claves}
          cambiados={cambiados}
          vacioTexto="No había datos previos. Este registro se creó en esta acción."
        />
        <PanelCampos
          titulo="Datos nuevos"
          datos={nuevos}
          claves={claves}
          cambiados={cambiados}
          vacioTexto="No quedaron datos nuevos. Este registro se eliminó en esta acción."
        />
      </div>
    </div>
  );
}
