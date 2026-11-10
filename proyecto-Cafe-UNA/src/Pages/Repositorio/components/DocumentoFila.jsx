import { Download } from "lucide-react";
import { ST } from "../../../Components/T/ST";
import { useTraducir } from "../../../hooks/useTraducir";
import { etiquetaTipoArchivo, metaDocumento } from "../repositorioLogic";

export function DocumentoFila({ doc, esAdmin, onVer, onDescargar }) {
  const tDescargar = useTraducir("Descargar");
  const tPrivado = useTraducir("Privado");
  const tDescarga = useTraducir("descarga");
  const tDescargas = useTraducir("descargas");

  // The meta helper emits Spanish words; translate the two variable ones here.
  const meta = metaDocumento(doc, { esAdmin }).map((parte) => {
    if (parte === "Privado") return tPrivado;
    const m = /^(\d+) (descargas?)$/.exec(parte);
    return m ? `${m[1]} ${m[2] === "descarga" ? tDescarga : tDescargas}` : parte;
  });

  return (
    <li className="repo-row">
      <span className="repo-row__tile" aria-hidden="true">
        {etiquetaTipoArchivo(doc)}
      </span>
      <div className="repo-row__main">
        <h3 className="repo-row__title">
          <button type="button" className="repo-row__link" onClick={() => onVer(doc)}>
            {doc.titulo}
          </button>
        </h3>
        {meta.length > 0 ? <p className="repo-row__meta">{meta.join(" · ")}</p> : null}
      </div>
      <div className="repo-row__actions">
        <button type="button" className="pub-btn pub-btn--secondary repo-row__ver" onClick={() => onVer(doc)}>
          <ST>Ver</ST>
        </button>
        <button
          type="button"
          className="pub-btn pub-btn--secondary pub-btn--icon"
          aria-label={`${tDescargar} ${doc.titulo}`}
          onClick={() => onDescargar(doc)}
        >
          <Download size={18} aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}

export function FilasEsqueleto({ cantidad = 5 }) {
  return (
    <ul className="repo-list" aria-hidden="true">
      {Array.from({ length: cantidad }, (_, i) => (
        <li key={i} className="repo-row repo-row--skeleton">
          <span className="repo-row__tile repo-skeleton" />
          <div className="repo-row__main">
            <span className="repo-skeleton repo-skeleton--title" />
            <span className="repo-skeleton repo-skeleton--meta" />
          </div>
        </li>
      ))}
    </ul>
  );
}
