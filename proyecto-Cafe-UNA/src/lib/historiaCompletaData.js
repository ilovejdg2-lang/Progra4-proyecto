import { obtenerHistoriaCompleta } from '../services/informacionService';

export const TIPOS_BLOQUE_HISTORIA = [
  { value: 'p', label: 'Párrafo' },
  { value: 'h3', label: 'Subtítulo' },
  { value: 'cita', label: 'Cita' },
  { value: 'foto', label: 'Imagen' },
  { value: 'mapa', label: 'Mapa de parcelas' },
  { value: 'compost', label: 'Gráfico de compost' },
];

const txt = (valor) => (typeof valor === 'string' ? valor : valor == null ? '' : String(valor));
const arr = (valor) => (Array.isArray(valor) ? valor : []);

export function historiaVacia() {
  return {
    portada: {
      eyebrow: '',
      titulo: '',
      subtitulo: '',
      autora: '',
      anio: '',
      foto: '',
      mapa: '',
      pieMapa: '',
      cierre: '',
    },
    cifras: [],
    hitos: [],
    compost: [],
    capitulos: [],
  };
}

export function bloqueVacio(tipo = 'p') {
  return { tipo, texto: '', autor: '', src: '', pie: '' };
}

export function normalizarHistoriaCompleta(raw) {
  const base = historiaVacia();
  const portada = raw?.portada ?? {};
  return {
    portada: Object.fromEntries(Object.keys(base.portada).map((k) => [k, txt(portada[k])])),
    cifras: arr(raw?.cifras).map((c) => ({ valor: txt(c?.valor), texto: txt(c?.texto) })),
    hitos: arr(raw?.hitos).map((h) => ({ anio: txt(h?.anio), texto: txt(h?.texto) })),
    compost: arr(raw?.compost).map((c) => ({ anio: txt(c?.anio), kg: Number(c?.kg) || 0 })),
    capitulos: arr(raw?.capitulos).map((c, i) => ({
      id: txt(c?.id) || `capitulo-${i + 1}`,
      titulo: txt(c?.titulo),
      bloques: arr(c?.bloques).map((b) => ({ ...bloqueVacio(txt(b?.tipo) || 'p'), texto: txt(b?.texto), autor: txt(b?.autor), src: txt(b?.src), pie: txt(b?.pie) })),
    })),
  };
}

export async function fetchHistoriaCompletaPage() {
  return normalizarHistoriaCompleta(await obtenerHistoriaCompleta());
}
