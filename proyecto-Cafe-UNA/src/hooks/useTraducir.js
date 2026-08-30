import { useEffect, useMemo, useRef, useState } from "react";
import { useIdioma } from "../lib/useIdioma";
import {
  traducirCamposObjeto,
  traducirEsAEn,
  traducirListaObjetos,
  traducirSync,
} from "../lib/traducir";

/** Traduce un string si el idioma es inglés. */
export function useTraducir(texto) {
  const { idioma } = useIdioma();
  const base = String(texto ?? "");
  const [valor, setValor] = useState(() =>
    idioma === "en" ? traducirSync(base) : base,
  );

  useEffect(() => {
    if (idioma !== "en") {
      setValor(base);
      return undefined;
    }
    setValor(traducirSync(base));
    let cancel = false;
    void traducirEsAEn(base).then((en) => {
      if (!cancel) setValor(en);
    });
    return () => {
      cancel = true;
    };
  }, [base, idioma]);

  return idioma === "en" ? valor : base;
}

/** Traduce campos de un objeto cuando idioma = en. */
export function useTraducirObjeto(obj, campos) {
  const { idioma } = useIdioma();
  const camposKey = Array.isArray(campos) ? campos.join("|") : "";
  const camposRef = useRef(campos);
  const objRef = useRef(obj);
  camposRef.current = campos;
  objRef.current = obj;

  const firma = useMemo(() => {
    if (!obj || !camposKey) return "";
    return camposKey.split("|").map((c) => obj[c]).join("\u0001");
  }, [obj, camposKey]);

  const [valor, setValor] = useState(obj);

  useEffect(() => {
    const actual = objRef.current;
    const camposActuales = camposRef.current;
    if (!actual || !Array.isArray(camposActuales)) {
      setValor(actual);
      return undefined;
    }
    if (idioma !== "en") {
      setValor(actual);
      return undefined;
    }
    const sync = { ...actual };
    for (const c of camposActuales) {
      if (typeof sync[c] === "string") sync[c] = traducirSync(sync[c]);
    }
    setValor(sync);
    let cancel = false;
    void traducirCamposObjeto(actual, camposActuales).then((en) => {
      if (!cancel) setValor(en);
    });
    return () => {
      cancel = true;
    };
  }, [idioma, firma]);

  return idioma === "en" ? valor : obj;
}

/** Traduce una lista de objetos. */
export function useTraducirLista(lista, campos) {
  const { idioma } = useIdioma();
  const camposKey = Array.isArray(campos) ? campos.join("|") : "";
  const camposRef = useRef(campos);
  const listaRef = useRef(lista);
  camposRef.current = campos;
  listaRef.current = lista;

  const firma = useMemo(() => {
    if (!Array.isArray(lista) || !camposKey) return "";
    const keys = camposKey.split("|");
    return lista.map((item) => keys.map((c) => item?.[c]).join("\u0001")).join("\u0002");
  }, [lista, camposKey]);

  const [valor, setValor] = useState(lista);

  useEffect(() => {
    const actual = listaRef.current;
    const camposActuales = camposRef.current;
    if (!Array.isArray(actual) || !Array.isArray(camposActuales)) {
      setValor(actual);
      return undefined;
    }
    if (idioma !== "en") {
      setValor(actual);
      return undefined;
    }
    const sync = actual.map((item) => {
      const copy = { ...item };
      for (const c of camposActuales) {
        if (typeof copy[c] === "string") copy[c] = traducirSync(copy[c]);
      }
      return copy;
    });
    setValor(sync);
    let cancel = false;
    void traducirListaObjetos(actual, camposActuales).then((en) => {
      if (!cancel) setValor(en);
    });
    return () => {
      cancel = true;
    };
  }, [idioma, firma]);

  return idioma === "en" ? valor : lista;
}
