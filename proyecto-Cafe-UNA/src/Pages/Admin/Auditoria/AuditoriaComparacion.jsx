import { ST } from "../../../Components/T/ST";
import {
  camposCambiados,
  claseMarcaCambio,
  claveNormalizada,
  esCampoSecreto,
  esCorreo,
  esUrl,
  etiquetaCampo,
  extraerNombre,
  formatearValor,
  describirRegistro,
  parseDatos,
  unirClaves,
  valorDe,
} from "./auditoriaTexto";

function ValorVisible({ clave, valor }) {
  const texto = formatearValor(clave, valor);
  const normal = claveNormalizada(clave);
  if (
    esCampoSecreto(clave) ||
    esCorreo(valor) ||
    (typeof valor === "number" && Number.isFinite(valor)) ||
    (typeof valor === "string" && esUrl(valor)) ||
    normal === "id"
  ) {
    return texto;
  }
  return <ST>{texto}</ST>;
}

function PanelCampos({ titulo, datos, claves, cambiados, vacioTexto, marcarCambios = false }) {
  const hayDatos = datos && typeof datos === "object" && claves.length > 0;
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-[length:var(--text-body)] font-semibold uppercase tracking-wide text-slate-500">
        <ST>{titulo}</ST>
      </p>
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
                  <ST>{etiquetaCampo(clave)}</ST>
                  {cambio ? (
                    <span className="ml-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-[length:var(--text-body)] font-bold text-amber-800">
                      <ST>{"Cambi\u00f3"}</ST>
                    </span>
                  ) : null}
                </dt>
                <dd className="mt-0.5 break-words text-[length:var(--text-body)] font-medium text-slate-800">
                  {cambio && marcarCambios ? (
                    <mark className={claseMarcaCambio}>
                      <ValorVisible clave={clave} valor={valorDe(datos, clave)} />
                    </mark>
                  ) : (
                    <ValorVisible clave={clave} valor={valorDe(datos, clave)} />
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
      ) : (
        <p className="mt-3 text-[length:var(--text-body)] text-slate-500"><ST>{vacioTexto}</ST></p>
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
  const resumen = describirRegistro(item);

  return (
    <div className="grid gap-3">
      <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
        <p className="text-[length:var(--text-body)] font-semibold uppercase tracking-wide text-slate-500">
          <ST>{"Qu\u00e9 sucedi\u00f3"}</ST>
        </p>
        <p className="mt-1 text-[length:var(--text-body)] font-semibold text-slate-900">
          <ST>{resumen}</ST>
        </p>
        {nombre ? (
          <p className="mt-1 text-[length:var(--text-body)] text-slate-600">
            <ST>{item?.tabla === "usuarios" ? "Usuario" : "Nombre"}</ST>:{" "}
            <span className="font-semibold text-slate-800">
              {item?.tabla === "usuarios" ? nombre : <ST>{nombre}</ST>}
            </span>
          </p>
        ) : null}
        {item?.idRegistro ? (
          <p className="mt-1 text-[length:var(--text-body)] text-slate-400">
            <ST>Registro</ST> #{item.idRegistro}
          </p>
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
          marcarCambios
          vacioTexto="No quedaron datos nuevos. Este registro se eliminó en esta acción."
        />
      </div>
    </div>
  );
}
