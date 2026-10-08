import {
  Banknote,
  Bean,
  BookOpen,
  Box,
  Calendar,
  CalendarCheck2,
  CircleCheck,
  CircleHelp,
  ClipboardList,
  Clock,
  Coffee,
  Cookie,
  CreditCard,
  CupSoda,
  FileText,
  Flame,
  Folder,
  Gift,
  GlassWater,
  Globe,
  GraduationCap,
  HandHeart,
  Heart,
  History,
  House,
  Info,
  Landmark,
  Layers,
  Leaf,
  Mail,
  MapPin,
  MessageCircle,
  Milk,
  Package,
  Phone,
  Scale,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Sprout,
  Star,
  Tag,
  Truck,
  Upload,
  User,
  Users,
  Wallet,
  Wheat,
} from "lucide-react";

/** Íconos que se pueden asignar desde el admin. La clave es lo que se guarda en la BD. */
export const ICONOS_CATALOGO = [
  { clave: "coffee", etiqueta: "Taza de café", Icono: Coffee },
  { clave: "bean", etiqueta: "Grano", Icono: Bean },
  { clave: "cup-soda", etiqueta: "Bebida", Icono: CupSoda },
  { clave: "milk", etiqueta: "Leche", Icono: Milk },
  { clave: "glass-water", etiqueta: "Vaso", Icono: GlassWater },
  { clave: "cookie", etiqueta: "Galleta", Icono: Cookie },
  { clave: "leaf", etiqueta: "Hoja", Icono: Leaf },
  { clave: "sprout", etiqueta: "Planta", Icono: Sprout },
  { clave: "wheat", etiqueta: "Cosecha", Icono: Wheat },
  { clave: "shirt", etiqueta: "Ropa", Icono: Shirt },
  { clave: "shopping-bag", etiqueta: "Bolsa", Icono: ShoppingBag },
  { clave: "package", etiqueta: "Paquete", Icono: Package },
  { clave: "box", etiqueta: "Caja", Icono: Box },
  { clave: "gift", etiqueta: "Regalo", Icono: Gift },
  { clave: "book-open", etiqueta: "Libro", Icono: BookOpen },
  { clave: "heart", etiqueta: "Corazón", Icono: Heart },
  { clave: "hand-heart", etiqueta: "Ayuda / donación", Icono: HandHeart },
  { clave: "star", etiqueta: "Estrella", Icono: Star },
  { clave: "sparkles", etiqueta: "Destacado", Icono: Sparkles },
  { clave: "user", etiqueta: "Persona", Icono: User },
  { clave: "users", etiqueta: "Personas / grupo", Icono: Users },
  { clave: "map-pin", etiqueta: "Ubicación", Icono: MapPin },
  { clave: "house", etiqueta: "Casa / visita", Icono: House },
  { clave: "graduation-cap", etiqueta: "Universidad", Icono: GraduationCap },
  { clave: "calendar", etiqueta: "Calendario", Icono: Calendar },
  { clave: "clock", etiqueta: "Horario", Icono: Clock },
  { clave: "file-text", etiqueta: "Documento", Icono: FileText },
  { clave: "circle-help", etiqueta: "Pregunta", Icono: CircleHelp },
  { clave: "info", etiqueta: "Información", Icono: Info },
  { clave: "message-circle", etiqueta: "Mensaje", Icono: MessageCircle },
  { clave: "mail", etiqueta: "Correo", Icono: Mail },
  { clave: "phone", etiqueta: "Teléfono", Icono: Phone },
  { clave: "truck", etiqueta: "Envío", Icono: Truck },
  { clave: "shield-check", etiqueta: "Seguridad", Icono: ShieldCheck },
  { clave: "scale", etiqueta: "Peso", Icono: Scale },
  { clave: "banknote", etiqueta: "Efectivo", Icono: Banknote },
  { clave: "credit-card", etiqueta: "Tarjeta", Icono: CreditCard },
  { clave: "smartphone", etiqueta: "Celular", Icono: Smartphone },
  { clave: "landmark", etiqueta: "Banco", Icono: Landmark },
  { clave: "wallet", etiqueta: "Billetera", Icono: Wallet },
  { clave: "tag", etiqueta: "Etiqueta", Icono: Tag },
  { clave: "clipboard-list", etiqueta: "Formulario", Icono: ClipboardList },
  { clave: "calendar-check", etiqueta: "Fecha confirmada", Icono: CalendarCheck2 },
  { clave: "shopping-cart", etiqueta: "Carrito", Icono: ShoppingCart },
  { clave: "layers", etiqueta: "Todo / capas", Icono: Layers },
  { clave: "flame", etiqueta: "Popular", Icono: Flame },
  { clave: "circle-check", etiqueta: "Aprobado", Icono: CircleCheck },
  { clave: "history", etiqueta: "Historial", Icono: History },
  { clave: "folder", etiqueta: "Carpeta", Icono: Folder },
  { clave: "globe", etiqueta: "Idioma / mundo", Icono: Globe },
  { clave: "upload", etiqueta: "Subir", Icono: Upload },
];

/** Lugares del admin donde se puede elegir un ícono de esta lista. */
export const LUGARES_CON_ICONO = [
  {
    lugar: "Inventario de productos → Categorías",
    detalle: "Ícono de cada categoría principal en la tienda.",
  },
  {
    lugar: "Información de página principal → Preguntas y respuestas",
    detalle: "Ícono al lado de cada pregunta frecuente del inicio.",
  },
  {
    lugar: "Ajustes del sistema → Catálogos → Íconos → Íconos del sitio",
    detalle: "Pie de página, redes sociales, menú del celular, formularios y repositorio.",
  },
];

const POR_CLAVE = new Map(ICONOS_CATALOGO.map((item) => [item.clave, item]));

export function iconoPorClave(clave) {
  return POR_CLAVE.get(String(clave || "").trim().toLowerCase())?.Icono || null;
}

export function etiquetaIcono(clave) {
  return POR_CLAVE.get(String(clave || "").trim().toLowerCase())?.etiqueta || "";
}

/** Ícono de una categoría de producto: el elegido en Ajustes o uno sugerido por el nombre. */
export function iconoDeCategoriaProducto(nombre, clave) {
  const elegido = iconoPorClave(clave);
  if (elegido) return elegido;
  const n = String(nombre || "").toLowerCase();
  if (n.includes("caf")) return Coffee;
  if (n.includes("camisa") || n.includes("ropa") || n.includes("shirt") || n.includes("polo")) {
    return Shirt;
  }
  return Tag;
}

const ICONOS_FAQ_AUTOMATICOS = [MapPin, Heart, Users, FileText];

/** Ícono de una pregunta frecuente: el elegido en el admin o uno que rota según la posición. */
export function iconoDePreguntaFaq(clave, index = 0) {
  return iconoPorClave(clave) || ICONOS_FAQ_AUTOMATICOS[index % ICONOS_FAQ_AUTOMATICOS.length];
}
