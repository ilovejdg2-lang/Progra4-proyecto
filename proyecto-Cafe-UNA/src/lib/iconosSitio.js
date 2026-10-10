import {
  BookOpen,
  CalendarCheck2,
  CalendarDays,
  CircleCheck,
  ClipboardList,
  Clock,
  Coffee,
  FileText,
  Flame,
  Heart,
  History,
  Image,
  Info,
  Layers,
  Mail,
  MapPin,
  Package,
  Phone,
  Share2,
  ShoppingCart,
  Sparkles,
  Sprout,
  Truck,
  Upload,
  User,
  UserRound,
  Users,
} from "lucide-react";

import { FacebookIcon, InstagramIcon } from "../Components/Footer/SocialIcons";

/**
 * Íconos fijos del sitio que se pueden cambiar desde Ajustes → Catálogos → Íconos.
 * El `id` se guarda como nombre en el catálogo `icono_sitio`; `Original` es el que se usa si no eligen otro.
 */
export const GRUPOS_ICONOS_SITIO = [
  {
    grupo: "Pie de página y redes sociales",
    lugares: [
      { id: "footer.telefono", etiqueta: "Teléfono", Original: Phone },
      { id: "footer.correo", etiqueta: "Correo", Original: Mail },
      { id: "footer.ubicacion", etiqueta: "Ubicación", Original: MapPin },
      { id: "redes.instagram", etiqueta: "Instagram", Original: InstagramIcon },
      { id: "redes.facebook", etiqueta: "Facebook", Original: FacebookIcon },
    ],
  },
  {
    grupo: "Menú del celular",
    lugares: [
      { id: "menu.sobre-nosotros", etiqueta: "Sobre nosotros", Original: BookOpen },
      { id: "menu.productos", etiqueta: "Productos", Original: Coffee },
      { id: "menu.formularios", etiqueta: "Formularios", Original: ClipboardList },
      { id: "menu.repositorio", etiqueta: "Repositorio", Original: Package },
      { id: "menu.equipo", etiqueta: "Equipo", Original: Users },
      { id: "menu.galeria", etiqueta: "Galería e iniciativas", Original: Info },
      { id: "menu.carrito", etiqueta: "Carrito", Original: ShoppingCart },
      { id: "menu.otro", etiqueta: "Otros enlaces", Original: Package },
    ],
  },
  {
    grupo: "Formulario de voluntariado",
    lugares: [
      { id: "voluntariado.personal", etiqueta: "Información personal", Original: User },
      { id: "voluntariado.contacto", etiqueta: "Contacto", Original: Mail },
      { id: "voluntariado.grupo", etiqueta: "Información del grupo", Original: Users },
      { id: "voluntariado.tipo", etiqueta: "Tipo de voluntariado", Original: Sprout },
      { id: "voluntariado.fechas", etiqueta: "Fechas disponibles", Original: CalendarCheck2 },
      { id: "voluntariado.horario", etiqueta: "Horario disponible", Original: Clock },
    ],
  },
  {
    grupo: "Formulario de visitas",
    lugares: [
      { id: "visitas.encargado", etiqueta: "Información del encargado", Original: UserRound },
      { id: "visitas.grupo", etiqueta: "Información del grupo", Original: Users },
      { id: "visitas.fecha", etiqueta: "Fecha y horario", Original: CalendarDays },
      { id: "visitas.necesidades", etiqueta: "Necesidades y recomendaciones", Original: ClipboardList },
    ],
  },
  {
    grupo: "Formulario de donaciones",
    lugares: [
      { id: "donacion.donante", etiqueta: "Información del donante", Original: User },
      { id: "donacion.detalles", etiqueta: "Detalles de la donación", Original: Package },
      { id: "donacion.ubicacion", etiqueta: "Ubicación de la donación", Original: MapPin },
      { id: "donacion.logistica", etiqueta: "Logística de entrega", Original: Truck },
      { id: "donacion.declaracion", etiqueta: "Declaración y confirmación", Original: FileText },
    ],
  },
  {
    grupo: "Formulario de productores",
    lugares: [
      { id: "productor.emprendimiento", etiqueta: "Información del emprendimiento", Original: Sprout },
      { id: "productor.imagen", etiqueta: "Imagen", Original: Image },
      { id: "productor.ubicacion", etiqueta: "Ubicación", Original: MapPin },
      { id: "productor.redes", etiqueta: "Redes sociales", Original: Share2 },
      { id: "productor.contacto", etiqueta: "Contacto", Original: Mail },
      { id: "productor.autorizacion", etiqueta: "Autorización", Original: CircleCheck },
    ],
  },
  {
    grupo: "Repositorio",
    lugares: [
      { id: "repo.biblioteca", etiqueta: "Biblioteca", Original: BookOpen },
      { id: "repo.todos", etiqueta: "Todos", Original: Layers },
      { id: "repo.novedades", etiqueta: "Novedades", Original: Sparkles },
      { id: "repo.populares", etiqueta: "Más descargados", Original: Flame },
      { id: "repo.destacados", etiqueta: "Destacados", Original: CircleCheck },
      { id: "repo.favoritos", etiqueta: "Mis favoritos", Original: Heart },
      { id: "repo.leer-tarde", etiqueta: "Leer más tarde", Original: Clock },
      { id: "repo.historial", etiqueta: "Historial de vistos", Original: History },
      { id: "repo.enviar", etiqueta: "Enviar documento", Original: Upload },
    ],
  },
];

const ORIGINALES = new Map(
  GRUPOS_ICONOS_SITIO.flatMap(({ lugares }) => lugares.map(({ id, Original }) => [id, Original])),
);

export function iconoOriginalSitio(id) {
  return ORIGINALES.get(id) || Package;
}

/** Lugar del menú del celular según la ruta del enlace. */
export function lugarIconoMenu(ruta) {
  const r = String(ruta || "").trim().toLowerCase();
  if (r.includes("product")) return "menu.productos";
  if (r.includes("repositorio")) return "menu.repositorio";
  if (r.includes("equipo")) return "menu.equipo";
  if (r.includes("about") || r.includes("sobre")) return "menu.sobre-nosotros";
  if (r.includes("volunt") || r.includes("formulario") || r.includes("donacion")) return "menu.formularios";
  if (r.includes("iniciativa") || r.includes("gallery") || r.includes("galer")) return "menu.galeria";
  if (r.includes("checkout") || r.includes("cart")) return "menu.carrito";
  return "menu.otro";
}
