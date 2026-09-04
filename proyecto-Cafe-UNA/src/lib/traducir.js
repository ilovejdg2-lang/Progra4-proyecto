/**
 * Traducción automática ES ↔ EN (función dinámica vía API).
 * - Muestra EN: Google Translate (gtx) → MyMemory → caché
 * - Guarda BD: siempre español (asegurarEspanolParaBd)
 * - Café UNA nunca se traduce
 * El diccionario local solo acelera UI conocida o sirve de respaldo si la API falla.
 */

const CACHE_KEY = "cafe-una-traducciones-es-en-v6";
const CACHE_KEY_EN_ES = "cafe-una-traducciones-en-es-v6";
const memoria = new Map();
const memoriaEnEs = new Map();
const inflight = new Map();
const inflightEnEs = new Map();

/** Frases fijas de UI y copy frecuente del Café UNA. */
const DICCIONARIO = {
  // Nav / footer
  "Sobre nosotros": "About us",
  "Café UNA": "Café UNA",
  "Cafe UNA": "Café UNA",
  "CAFÉ UNA": "Café UNA",
  "FUNDA-UNA": "FUNDA-UNA",
  "FUNDA UNA": "FUNDA-UNA",
  "FundaUNA": "FUNDA-UNA",
  "fundauna": "FUNDA-UNA",
  "Bolsa de café UNA": "Café UNA coffee bag",
  "Información del café para nuevos estudiantes": "Coffee information for new students",
  "Puesto de café UNA": "Café UNA booth",
  "Café UNA en la feria": "Café UNA at the fair",
  "Personas de la UNA degustando Café UNA": "People from UNA tasting Café UNA",
  "Puesto de Café UNA en feria": "Café UNA booth at the fair",
  "Bienvenida a nuevos estudiantes": "Welcome to new students",
  "Venta de café": "Coffee sale",
  // Hero / inicio (frases frecuentes de CMS; no depender de cuota MyMemory)
  "El mejor café para el universitario.": "The best coffee for the university student.",
  "El mejor café para el universitario": "The best coffee for the university student.",
  "Ven a deleitarte con este café tan espectacular.": "Come enjoy this spectacular coffee.",
  "Ven a deleitarte con este café tan espectacular": "Come enjoy this spectacular coffee.",
  "Artesanal y orgánico": "Artisanal & organic",
  "ARTESANAL Y ORGÁNICO": "ARTISANAL & ORGANIC",
  "Productos": "Products",
  "Voluntariado": "Volunteering",
  "Donaciones": "Donations",
  "Donación": "Donation",
  "Visitas": "Visits",
  "Inicio": "Home",
  "Explorar": "Explore",
  "EXPLORE": "EXPLORE",
  "Contactos": "Contact",
  "Añadido al carrito": "Added to cart",
  "No se pudo agregar": "Could not add",
  "Revisá la disponibilidad.": "Check availability.",
  "Cerrar aviso": "Close notice",
  "Redes sociales": "Social media",
  "REDES SOCIALES": "SOCIAL MEDIA",
  "unidades": "units",
  "unidad": "unit",
  "Ubicación": "Location",
  "Ir al inicio": "Go to home",
  "Volver al inicio": "Back to home",
  "← Volver al inicio": "← Back to home",
  "Mi Cuenta": "My account",
  "Nuestra Historia": "Our story",
  "Tienda Online": "Online store",
  "Historia": "History",
  "Galería": "Gallery",
  "HISTORIA": "HISTORY",

  // Hero / CTAs
  "Ver productos": "View products",
  "Conócenos": "About us",
  "Formulario": "Form",
  "Formularios": "Forms",
  "Paso": "Step",
  "Solicitud de donación": "Donation request",
  "Tu apoyo nos ayuda a seguir creando un impacto positivo. Completa el formulario para registrar tu donación.":
    "Your support helps us keep creating a positive impact. Complete the form to register your donation.",
  "Información del donante": "Donor information",
  "¿Quién realizará la donación?": "Who will make the donation?",
  "Persona": "Person",
  "Organización": "Organization",
  "Razón social": "Company name",
  "Ingresa tu número de teléfono": "Enter your phone number",
  "Nombre completo o Razón Social": "Full name or company name",
  "Tipo de identificación": "ID type",
  "Número de identificación": "ID number",
  "Cédula, jurídica o pasaporte": "ID card, company ID or passport",
  "Teléfono de contacto": "Contact phone",
  "Detalles de la donación": "Donation details",
  "Cuéntanos más sobre los artículos que deseas donar.": "Tell us more about the items you want to donate.",
  "Categoría de la donación": "Donation category",
  "Descripción detallada de los artículos": "Detailed description of the items",
  "Cantidad o volumen estimado": "Estimated quantity or volume",
  "3 cajas, 5 unidades": "3 boxes, 5 units",
  "Estado de los artículos": "Condition of the items",
  "Fotografías de los artículos": "Photos of the items",
  "JPG, PNG o WEBP. Máximo 5 imágenes de 10 MB cada una.": "JPG, PNG or WEBP. Up to 5 images of 10 MB each.",
  "Arrastra las fotos aquí o haz clic para seleccionarlas": "Drag photos here or click to select them",
  "Logística de entrega": "Delivery logistics",
  "Indica cómo te gustaría realizar la entrega de los artículos.":
    "Tell us how you would like to deliver the items.",
  "Método de entrega preferido": "Preferred delivery method",
  "Lo entregaré personalmente": "I will deliver it in person",
  "Llevaré los artículos al centro de acopio.": "I will take the items to the collection center.",
  "Solicito la recolección a domicilio": "I request home pickup",
  "La organización se encargará de recoger la donación.": "The organization will pick up the donation.",
  "Dirección de recolección": "Pickup address",
  "Solo es necesaria si solicitás recolección a domicilio.": "Only needed if you request home pickup.",
  "Horarios disponibles": "Available time slots",
  "Hora de entrega o recolección": "Delivery or pickup time",
  "Se recibe de lunes a viernes de 8:00 a.m. a 5:00 p.m.":
    "Donations are received Monday to Friday from 8:00 a.m. to 5:00 p.m.",
  "Solo se pueden escoger días de lunes a viernes.": "Only weekdays (Monday to Friday) can be selected.",
  "Indique la hora de entrega o recolección": "Enter the delivery or pickup time",
  "La hora debe estar entre 8:00 a.m. y 5:00 p.m.": "The time must be between 8:00 a.m. and 5:00 p.m.",
  "Día de entrega o recolección": "Delivery or pickup day",
  "Día de entrega": "Delivery day",
  "Día de recolección": "Pickup day",
  "Seleccione el día de entrega o recolección": "Select the delivery or pickup day",
  "FECHA": "DATE",
  "Mañana": "Morning",
  "Tarde": "Afternoon",
  "Fines de semana": "Weekends",
  "Declaración y confirmación": "Declaration and confirmation",
  "Revisa la información y acepta los términos para completar tu solicitud.":
    "Review the information and accept the terms to complete your request.",
  "Valor estimado de la donación": "Estimated donation value",
  "Fecha de la solicitud": "Request date",
  "Certifico que los artículos son de mi propiedad y de origen lícito.":
    "I certify that the items are mine and of lawful origin.",
  "Acepto la Política de privacidad.": "I accept the Privacy Policy.",
  "Cancelar": "Cancel",
  "Debe iniciar sesión para enviar su solicitud de donación.": "You must sign in to send your donation request.",
  "Recibimos tu solicitud de donación en estado Pendiente. El equipo de Café UNA la revisará y podés consultarla en tu perfil.":
    "We received your donation request as Pending. The Café UNA team will review it and you can check it in your profile.",
  "Nuevo": "New",
  "Usado en buen estado": "Used in good condition",
  "Usado con desgaste": "Used with wear",
  "Para reparar": "Needs repair",
  "Cédula física": "National ID",
  "Cédula jurídica": "Company ID",
  "Pasaporte": "Passport",
  "ARTESANAL & ORGÁNICO": "ARTISANAL & ORGANIC",
  "Artesanal & orgánico": "Artisanal & organic",

  // Home / cards
  "DONACIONES": "DONATIONS",
  "VISITAS": "VISITS",
  "VOLUNTARIADO": "VOLUNTEERING",
  "CAFÉ": "COFFEE",
  "disponibles": "available",
  "disponible": "available",

  // Products
  "Explora nuestro catálogo disponible.": "Explore our available catalog.",
  "Buscar productos.": "Search products.",
  "Buscar productos": "Search products",
  "Filtros": "Filters",
  "CATEGORÍA": "CATEGORY",
  "Todas": "All",
  "productos": "products",
  "producto": "product",
  "unidades en bodega": "units in stock",
  "unidad en bodega": "unit in stock",
  "Camisa": "Shirt",
  "Café": "Coffee",
  "Grano entero": "Whole bean",
  "Tueste": "Roast",
  "Bolsas": "Bags",
  "Cafetal": "Coffee plantation",
  "Feria": "Fair",

  // Notifications
  "Notificaciones": "Notifications",
  "STOCK BAJO": "LOW STOCK",
  "Reponer stock": "Restock",
  "Bajo mínimo": "Below minimum",
  "Agotado": "Out of stock",
  "Bodega Central": "Central warehouse",

  // Forms
  "Únete a nuestras iniciativas": "Join our initiatives",
  "Complete el siguiente formulario para aplicar al área de voluntariado de su interés.":
    "Fill out the form below to apply to your area of interest.",
  "¿Cómo desea participar?": "How would you like to participate?",
  "Individual": "Individual",
  "Grupal": "Group",
  "Información personal": "Personal information",
  "¿Es nacional costarricense?": "Are you a Costa Rican national?",
  "Si": "Yes",
  "Sí": "Yes",
  "No": "No",
  "Identificación": "ID",
  "Nombre": "Name",
  "Primer nombre": "First name",
  "Primer apellido": "First last name",
  "Segundo apellido": "Second last name",
  "Institución educativa": "Educational institution",
  "País de residencia": "Country of residence",
  "Pasaporte / ID": "Passport / ID",
  "1° Apellido": "1st last name",
  "2° Apellido": "2nd last name",
  "Ej. Universidad Nacional": "e.g. National University",
  "Ej. Costa Rica": "e.g. Costa Rica",

  // Iniciativas (copy frecuente)
  "Cada aporte, visita o colaboración deja una huella especial.":
    "Every contribution, visit or collaboration leaves a special mark.",
  "Elegí cómo querés involucrarte con el Café UNA y completá el formulario correspondiente.":
    "Choose how you want to get involved with Café UNA and complete the matching form.",
  "Cada aporte transforma una vida": "Every contribution transforms a life",
  "Tu contribución financia iniciativas sostenibles, investigaciones y programas de bienestar que impactan a toda la comunidad universitaria.":
    "Your contribution funds sustainable initiatives, research and wellness programs that impact the whole university community.",
  "Conocé el corazón del proyecto": "Get to know the heart of the project",
  "Agendá una visita guiada a nuestras instalaciones y viví de cerca la experiencia del Café UNA, sus cultivos y su gente.":
    "Book a guided visit to our facilities and experience Café UNA up close — its crops and its people.",
  "Sumá tu energía a nuestra misión": "Add your energy to our mission",
  "Formá parte del equipo de voluntarios que sostiene las actividades del Café UNA. Tu tiempo y dedicación dejan huella.":
    "Join the volunteer team that sustains Café UNA activities. Your time and dedication leave a mark.",

  // Productos / UI
  "Categoría": "Category",
  "Limpiar": "Clear",
  "Detalles": "Details",
  "Sin unidades disponibles": "No units available",
  "No hay productos disponibles en este momento.": "No products available right now.",
  "Todos": "All",
  "Cédula": "ID number",
  "No hay fotos en esta categoría.": "No photos in this category.",
  "Galería de fotos": "Photo gallery",

  // Admin
  "Configuración general del sitio": "General site settings",
  "Información página principal": "Home page information",
  "Manejo de inventario": "Inventory management",
  "Formularios": "Forms",
  "Producto": "Product",
  "Puntos de venta": "Points of sale",
  "Activos fijos": "Fixed assets",
  "Distribución": "Distribution",
  "Ventas presenciales": "In-person sales",
  "Historial de ventas": "Sales history",
  "Historial de movimientos": "Movement history",
  "Consulta de entradas, transferencias y ventas. Solo lectura.":
    "Look up entries, transfers, and sales. Read only.",
  "No tiene permiso para ver el historial de movimientos.":
    "You do not have permission to view the movement history.",
  "Buscar producto...": "Search product...",
  "Todos los tipos": "All types",
  "Todas las ubicaciones": "All locations",
  "Tipo de movimiento": "Movement type",
  "Entrada": "Entry",
  "Transferencia": "Transfer",
  "Venta presencial": "In-person sale",
  "Venta web": "Web sale",
  "Exportar CSV": "Export CSV",
  "Exportar PDF": "Export PDF",
  "Generando archivo...": "Generating file...",
  "Administrar voluntariado": "Manage volunteering",
  "Necesidades de donación": "Donation needs",
  "Solicitudes de donación": "Donation requests",
  "Publicá y desactivá necesidades del catálogo público.":
    "Publish and deactivate needs in the public catalog.",
  "Nueva necesidad": "New need",
  "Editar necesidad": "Edit need",
  "Cantidad requerida (opcional)": "Required quantity (optional)",
  "Cantidad requerida": "Required quantity",
  "No tiene permiso para administrar donaciones.":
    "You do not have permission to manage donations.",
  "No tiene permiso para ver solicitudes de donación.":
    "You do not have permission to view donation requests.",
  "Las solicitudes nuevas quedan en Pendiente.": "New requests stay as Pending.",
  "Gestioná el estado y revisá los datos de cada solicitud de donación recibida.":
    "Manage the status and review the details of each donation request received.",
  "Ver solicitud": "View request",
  "Ver resumen": "View summary",
  "Resumen de la solicitud": "Request summary",
  "Sin valor estimado": "No estimated value",
  "Estado no indicado": "Condition not indicated",
  "Valor estimado": "Estimated value",
  "Estado de los artículos": "Item condition",
  "Estado de la solicitud": "Request status",
  "Aceptar solicitud": "Accept request",
  "Rechazar solicitud": "Reject request",
  "¿Confirmás que querés aceptar esta solicitud de donación?":
    "Do you want to accept this donation request?",
  "¿Confirmás que querés rechazar esta solicitud de donación?":
    "Do you want to reject this donation request?",
  "No se pudo actualizar el estado.": "The status could not be updated.",
  "Aceptada": "Accepted",
  "Rechazada": "Rejected",
  "Estas son las necesidades materiales activas del proyecto. Si podés aportar, registrá tu donación.":
    "These are the project's active material needs. If you can help, register your donation.",
  "Por ahora no hay necesidades activas.": "There are no active needs right now.",
  "Prioridad Alta": "High priority",
  "Prioridad Media": "Medium priority",
  "Prioridad Baja": "Low priority",
  "Quiero donar este material": "I want to donate this material",
  "Registrar donación": "Register donation",
  "Volver al catálogo": "Back to the catalog",
  "Tipo de donación": "Donation type",
  "Esa necesidad ya no está activa.": "That need is no longer active.",
  "¡Listo! Recibimos tu solicitud en estado Pendiente. Podés verla en tu perfil.":
    "Done! We received your request as Pending. You can see it in your profile.",
  "Completá la descripción y la fecha propuesta.": "Fill in the description and the proposed date.",
  "Fecha propuesta": "Proposed date",
  "Persona": "Person",
  "Enviar solicitud": "Submit request",
  "Mis donaciones": "My donations",
  "Todavía no has enviado solicitudes de donación.": "You have not sent any donation requests yet.",
  "Ver catálogo de necesidades": "See the needs catalog",
  "Alta": "High",
  "Media": "Medium",
  "Baja": "Low",
  "Activa": "Active",
  "Inactiva": "Inactive",
  "Administrar usuarios": "Manage users",
  "Auditoría": "Audit",
  "Ajustes del sistema": "System settings",
  "Horarios": "Schedules",
  "Permisos": "Permissions",
  "Idioma": "Language",
  "Mi perfil": "My profile",
  "Cerrar sesión": "Log out",
  "Panel Administrativo": "Admin panel",
  "Bienvenido,": "Welcome,",
  "Aquí puedes gestionar la aplicación.": "Here you can manage the application.",
  "Alertas de stock": "Stock alerts",
  "Cargando alertas...": "Loading alerts...",
  "Todo el inventario está en niveles normales": "All inventory is at normal levels",
  "Peor stock": "Worst stock",
  "Mínimo": "Minimum",
  "Verificando acceso...": "Checking access...",

  // Product detail / cart
  "Volver al catálogo": "Back to catalog",
  "IVA incluido": "VAT included",
  "Presentación": "Size",
  "Ficha técnica": "Tech specs",
  "FICHA TÉCNICA": "TECH SPECS",
  "Subcategoría": "Subcategory",
  "Precio (sin IVA)": "Price (excl. VAT)",
  "Disponibles": "Available",
  "Disponible": "Available",
  "Pocas unidades": "Low stock",
  "unidades": "units",
  "unidad": "unit",
  "Cantidad": "Quantity",
  "Añadir al carrito": "Add to cart",
  "También te puede gustar": "You may also like",
  "Ver catálogo": "View catalog",
  "Resumen del carrito": "Cart summary",
  "Vaciar carrito": "Empty cart",
  "Ir a pagar": "Checkout",
  "Tu carrito está vacío": "Your cart is empty",
  "Todavía no hay cafés por aquí. Explorá el catálogo y agregá el que más te guste.":
    "No coffees here yet. Browse the catalog and add your favorite.",
  "IVA:": "VAT:",
  "Sin IVA:": "Excl. VAT:",
  "Con IVA:": "Incl. VAT:",
  "Subtotal:": "Subtotal:",
  "Subtotal": "Subtotal",
  "Total:": "Total:",
  "Total": "Total",
  "Cerrar carrito": "Close cart",
  "Carrito": "Cart",

  // Voluntariado form
  "Contacto al solicitante": "Applicant contact",
  "Correo electrónico": "Email",
  "Número de teléfono": "Phone number",
  "Información del voluntariado": "Volunteer information",
  "Período de voluntariado (Desde — Hasta)": "Volunteering period (From — To)",
  "Fecha de inicio": "Start date",
  "Fecha de finalización": "End date",
  "FECHA DE INICIO": "START DATE",
  "FECHA DE FINALIZACIÓN": "END DATE",
  "Por definir": "To be defined",
  "Tipo de voluntariado": "Type of volunteering",
  "Seleccione una única opción": "Select a single option",
  "Apoyo General": "General Support",
  "Capacitaciones": "Training",
  "Investigación Académica": "Academic Research",
  "Debe iniciar sesión para enviar su solicitud de voluntariado.":
    "You must log in to submit your volunteering request.",
  "Iniciar sesión →": "Log in →",
  "Inicie sesión para enviar": "Log in to send",
  "Enviar Solicitud": "Submit request",
  "Enviando...": "Sending...",

  // Shared / loaders / admin commons
  "Cargando...": "Loading...",
  "Cargando página...": "Loading page...",
  "Cargando producto...": "Loading product...",
  "Cargando sobre nosotros...": "Loading about us...",
  "Cargando voluntariado...": "Loading volunteering...",
  "Cargando donaciones...": "Loading donations...",
  "Cargando necesidades...": "Loading needs...",
  "Cargando formulario...": "Loading form...",
  "Cargando checkout...": "Loading checkout...",
  "Cargando perfil...": "Loading profile...",
  "Cargando panel administrativo...": "Loading admin panel...",
  "Cargando productos...": "Loading products...",
  "Cargando solicitudes...": "Loading requests...",
  "Buscar...": "Search...",
  "Buscar": "Search",
  "Mostrando": "Showing",
  "de": "of",
  "registro": "record",
  "registros": "records",
  "Limpiar filtros": "Clear filters",
  "No hay resultados con los filtros actuales.": "No results with the current filters.",
  "Guardar": "Save",
  "Guardando...": "Saving...",
  "Guardar cambios": "Save changes",
  "Guardando...": "Saving...",
  "Cancelar": "Cancel",
  "Eliminar": "Delete",
  "Editar": "Edit",
  "Ver": "View",
  "Crear": "Create",
  "Agregar": "Add",
  "Acciones": "Actions",
  "Confirmar": "Confirm",
  "Pendiente": "Pending",
  "Aprobado": "Approved",
  "Rechazado": "Rejected",
  "Aceptado": "Accepted",
  "Activo": "Active",
  "Inactivo": "Inactive",
  "activo": "active",
  "inactivo": "inactive",
  "Sin dato": "No data",
  "Imagen adjunta": "Attached image",
  "Enlace adjunto": "Attached link",
  "Ninguno": "None",
  "Qué sucedió": "What happened",
  "Datos anteriores": "Previous data",
  "Datos nuevos": "New data",
  "Contraseña": "Password",
  "Registro": "Record",
  "Cambió": "Changed",
  "Título": "Title",
  "Imagen": "Image",
  "Categoría": "Category",
  "Acciones": "Actions",
  "Eliminar": "Delete",
  "Editar": "Edit",
  "Bolsas": "Bags",
  "Feria": "Fair",
  "Inactivo": "Inactive",
  "Cliente": "Customer",
  "Estado": "Status",
  "Fecha": "Date",
  "Usuario": "User",
  "Cantidad": "Quantity",
  "Precio": "Price",
  "Stock": "Stock",
  "Iniciar sesión": "Log in",
  "Cerrar sesión": "Log out",
  "Mi cuenta": "My account",
  "Cerrar menú": "Close menu",
  "Eliminar producto": "Remove product",
  "Cargando notificaciones...": "Loading notifications...",
  "No hay notificaciones pendientes.": "No pending notifications.",
  "Finalizar pedido": "Place order",
  "Total del pedido": "Order total",
  "Subtotal (sin IVA)": "Subtotal (excl. VAT)",
  "No hay productos en el carrito.": "There are no products in the cart.",
  "Volver al catálogo": "Back to catalog",
  "Volver al perfil": "Back to profile",
  "Correo o Usuario": "Email or username",
  "Contraseña": "Password",
  "Confirmar contraseña": "Confirm password",
  "¿Olvidó su contraseña?": "Forgot your password?",
  "Volver a iniciar sesión": "Back to log in",
  "Actualizar contraseña": "Update password",
  "Guardar imagen": "Save image",
  "Guardar nombre": "Save name",
  "Cargando perfil...": "Loading profile...",
  "Crear usuario": "Create user",
  "Crear producto": "Create product",
  "Editar producto": "Edit product",
  "Guardar stock": "Save stock",
  "Agregar enlace": "Add link",
  "Agregar a la galería": "Add to gallery",
  "Guardar foto": "Save photo",
  "No hay fotos en la galería.": "There are no photos in the gallery.",
  "Cargando información...": "Loading information...",
  "Horario especial": "Special hours",
  "Cerrado / no disponible": "Closed / unavailable",
  "Guardar día": "Save day",
  "Confirmar venta": "Confirm sale",
  "Confirmar distribución": "Confirm distribution",
  "Buscar producto": "Search product",
  "Agregar punto de venta": "Add point of sale",
  "Editar stock": "Edit stock",
  "Agregar activo fijo": "Add fixed asset",
  "Crear activo": "Create asset",
  "Crear solicitud": "Create request",
  "Agregar proveedor": "Add supplier",
  "Agregar ítem": "Add item",
  "Guardar matriz": "Save matrix",
  "Administrar voluntariado": "Manage volunteering",
  "Cargando historial...": "Loading history...",
  "Cargando compras...": "Loading purchases...",
  "Cargando puntos de venta...": "Loading points of sale...",
  "Cargando auditoría...": "Loading audit...",
  "No hay registros de auditoría todavía.": "There are no audit records yet.",
  "No hay usuarios registrados.": "No users registered.",
  "No hay solicitudes con esos filtros.": "No requests with those filters.",
  "Ya revisé mi pedido": "I reviewed my order",
  "palabras": "words",

  // Voluntariado horario
  "Horario preferido y disponibilidad detallada": "Preferred schedule and detailed availability",
  "El horario para realizar el voluntariado es de 8:00 a. m. a 5:00 p. m., con un período de almuerzo de 12:00 p. m. a 1:00 p. m.":
    "Volunteering hours are from 8:00 a.m. to 5:00 p.m., with a lunch break from 12:00 p.m. to 1:00 p.m.",
  "Describa el horario detallado de su voluntariado por días y horas asignadas. Ejemplo: Lunes (8am - 12pm), Martes (1pm - 5pm), Miércoles (9am - 11am).":
    "Describe your detailed volunteering schedule by days and assigned hours. Example: Monday (8am - 12pm), Tuesday (1pm - 5pm), Wednesday (9am - 11am).",

  // Admin — horarios calendario
  "Calendario de disponibilidad": "Availability calendar",
  "Tipo": "Type",
  "Tipo de disponibilidad": "Availability type",
  "Horario base": "Base schedule",
  "Cargando calendario…": "Loading calendar…",
  "Cerrado / feriado": "Closed / holiday",
  "Seleccionado": "Selected",
  "Elegí un día hábil en el calendario": "Pick a weekday on the calendar",
  "Tocá un lunes a viernes en el calendario para ajustar ese día.":
    "Tap a Monday–Friday on the calendar to adjust that day.",
  "Qué aplica ese día": "What applies that day",
  "Horario normal": "Normal hours",
  "Cerrado / no disponible (feriado)": "Closed / unavailable (holiday)",
  "Horario especial (dentro de 8:00–17:00)": "Special hours (within 8:00–17:00)",
  "Desde": "From",
  "Hasta": "To",
  "Tiene que ser distinto al horario normal": "It must differ from normal hours",
  "Guardando…": "Saving…",
  "Sábados y domingos no son laborables. No se pueden configurar.":
    "Saturdays and Sundays are not working days. They cannot be configured.",
  "Sábados y domingos no son laborables.": "Saturdays and Sundays are not working days.",
  "Día restaurado al horario normal (visitas y voluntariado).":
    "Day restored to normal hours (visits and volunteering).",
  "Día restaurado al horario normal (8:00 a. m. – 5:00 p. m.).":
    "Day restored to normal hours (8:00 a.m. – 5:00 p.m.).",
  "Día marcado como no disponible para visitas y voluntariado.":
    "Day marked as unavailable for visits and volunteering.",
  "Día marcado como no disponible.": "Day marked as unavailable.",
  "La hora de fin debe ser posterior a la de inicio.": "End time must be after start time.",
  "Lunes a viernes de 8:00 a. m. a 5:00 p. m. Sábados y domingos no están disponibles.":
    "Monday to Friday from 8:00 a.m. to 5:00 p.m. Saturdays and Sundays are unavailable.",

  // Admin — voluntariado / usuarios / ventas / permisos / inventario
  "En revisión": "Under review",
  "No indicado": "Not specified",
  "No indicada": "Not specified",
  "Sin nombre": "No name",
  "Sin correo": "No email",
  "sin fecha": "no date",
  "Ver solicitud": "View request",
  "Editar solicitud": "Edit request",
  "Eliminar solicitud": "Delete request",
  "Solicitud": "Request",
  "Recibida el": "Received on",
  "Datos de la solicitud": "Request details",
  "Modalidad": "Modality",
  "Cantidad de participantes": "Number of participants",
  "Fecha de solicitud": "Request date",
  "Horario y disponibilidad": "Schedule and availability",
  "Período de voluntariado": "Volunteering period",
  "Panel de administración": "Admin panel",
  "Observaciones / motivo de rechazo": "Notes / rejection reason",
  "Indique observaciones internas o el motivo si la solicitud es rechazada...":
    "Enter internal notes or the reason if the request is rejected...",
  "Marcar en revisión": "Mark under review",
  "Aprobar": "Approve",
  "Rechazar": "Reject",
  "Guardar observaciones": "Save notes",
  "Cerrar": "Close",
  "Actualizá los datos o el estado del voluntariado.": "Update the volunteering data or status.",
  "Solicitudes registradas": "Registered requests",
  "Gestioná el estado y los datos de cada solicitud de voluntariado recibida.":
    "Manage the status and data of each volunteering request received.",
  "Actualizar": "Refresh",
  "Reintentar": "Retry",
  "No hay solicitudes registradas aún.": "No requests registered yet.",
  "Buscar por nombre, correo, identificación o institución...":
    "Search by name, email, ID or institution...",
  "Todos los tipos": "All types",
  "Todos los estados": "All statuses",
  "Actividades de limpieza y mantenimiento": "Cleaning and maintenance activities",
  "Otro": "Other",
  "Teléfono": "Phone",
  "País de residencia": "Country of residence",
  "Nombre completo": "Full name",
  "Nuevo usuario": "New user",
  "Nuevo usuario +": "New user +",
  "Editar usuario": "Edit user",
  "Gestión de acceso y roles": "Access and role management",
  "Buscar por nombre, correo o rol...": "Search by name, email or role...",
  "Cargando usuarios…": "Loading users…",
  "Habilitado": "Enabled",
  "Deshabilitado": "Disabled",
  "Activar": "Activate",
  "Inactivar": "Deactivate",
  "Desactivar": "Deactivate",
  "Rol": "Role",
  "Roles": "Roles",
  "Solo SuperAdmin puede cambiar estado.": "Only SuperAdmin can change status.",
  "Solo un SuperAdmin puede inactivar o activar usuarios.":
    "Only a SuperAdmin can deactivate or activate users.",
  "No puede inactivarse a sí mismo.": "You cannot deactivate yourself.",
  "Error al cambiar el estado.": "Error changing status.",
  "Error al actualizar la solicitud. Intentá de nuevo.":
    "Error updating the request. Please try again.",
  "Error al eliminar la solicitud. Intentá de nuevo.":
    "Error deleting the request. Please try again.",
  "Solo SuperAdmin puede eliminar solicitudes de voluntariado.":
    "Only SuperAdmin can delete volunteering requests.",
  "No tiene permiso para habilitar o inhabilitar productos.":
    "You do not have permission to enable or disable products.",
  "Quita el producto de destacados antes de deshabilitarlo.":
    "Remove the product from featured before disabling it.",
  "No se pudo cambiar el estado del producto.": "Could not change the product status.",
  "Solo puedes destacar hasta 3 productos en el inicio.":
    "You can feature up to 3 products on the home page.",
  "No puedes destacar un producto deshabilitado.": "You cannot feature a disabled product.",
  "No puedes destacar un producto sin stock.": "You cannot feature a product with no stock.",
  "No se pudo cambiar el estado destacado.": "Could not change the featured status.",

  // Validación / errores de formularios (UI)
  "Indique su nacionalidad": "Indicate your nationality",
  "El nombre es obligatorio": "Name is required",
  "Mínimo 2 caracteres": "Minimum 2 characters",
  "El primer apellido es obligatorio": "First surname is required",
  "La identificación es obligatoria": "ID is required",
  "La cédula costarricense debe tener 9 dígitos": "Costa Rican ID must have 9 digits",
  "La cédula costarricense debe tener 9 dígitos.": "Costa Rican ID must have 9 digits.",
  "Ingrese la institución educativa": "Enter the educational institution",
  "Ingrese el país de procedencia": "Enter the country of origin",
  "El correo es obligatorio": "Email is required",
  "Correo electrónico inválido": "Invalid email address",
  "El teléfono es obligatorio": "Phone number is required",
  "Seleccione el tipo de voluntariado": "Select the type of volunteering",
  "Especifique el tipo de voluntariado": "Specify the type of volunteering",
  "Describa los días y horas disponibles": "Describe the available days and hours",
  "Ingrese la cantidad (mínimo 2)": "Enter the quantity (minimum 2)",
  "Máximo 100 participantes": "Maximum 100 participants",
  "No se pudo completar la acción. Si el problema continúa, comuníquese con el administrador del sitio.":
    "The action could not be completed. If the problem continues, please contact the site administrator.",
  "No se pudo completar la acción en este momento. Si el problema continúa, comuníquese con el administrador del sitio.":
    "The action could not be completed at this time. If the problem continues, please contact the site administrator.",
  "Si el problema continúa, comuníquese con el administrador del sitio.":
    "If the problem continues, please contact the site administrator.",
  "Algo salió mal al mostrar esta sección. Podés recargar o volver al inicio.":
    "Something went wrong while showing this section. You can reload or go back home.",
  "No se pudo cargar la página": "Could not load the page",
  "Recargar": "Reload",
  "Ir al inicio": "Go home",
  "Seleccione la fecha de inicio": "Select the start date",
  "La fecha de inicio no puede ser anterior a hoy": "The start date cannot be earlier than today",
  "Seleccione la fecha de finalización": "Select the end date",
  "La fecha de finalización no puede ser anterior a la fecha de inicio":
    "The end date cannot be earlier than the start date",
  "No se encontraron datos para esta cédula. Complete los datos manualmente.":
    "No data was found for this ID. Complete the fields manually.",
  "Datos cargados automáticamente. Puede editarlos si es necesario.":
    "Data loaded automatically. You can edit it if needed.",
  "Ingrese su nombre o verifique la cédula.": "Enter your name or verify the ID.",
  "Debe iniciar sesión antes de enviar una solicitud de voluntariado.":
    "You must sign in before submitting a volunteering request.",
  "Ocurrió un error al enviar la solicitud. Intente nuevamente.":
    "An error occurred while submitting the request. Please try again.",
  "No se pudo consultar la cédula.": "Could not look up the ID.",
  "El código es obligatorio (máx. 50 caracteres).": "Code is required (max. 50 characters).",
  "El nombre debe tener entre 2 y 200 caracteres.": "Name must be between 2 and 200 characters.",
  "El nombre debe tener entre 2 y 100 caracteres.": "Name must be between 2 and 100 characters.",
  "El valor en libro debe ser un número mayor o igual a 0.":
    "Book value must be a number greater than or equal to 0.",
  "No se pudieron cargar los activos.": "Could not load fixed assets.",
  "No se pudo guardar el activo.": "Could not save the fixed asset.",
  "Seleccioná el punto de venta.": "Select the point of sale.",
  "Seleccioná el producto.": "Select the product.",
  "Seleccioná un producto.": "Select a product.",
  "Seleccioná el punto de venta destino.": "Select the destination point of sale.",
  "La cantidad debe ser un entero positivo.": "Quantity must be a positive integer.",
  "La fecha es obligatoria.": "Date is required.",
  "No se pudo registrar la venta.": "Could not register the sale.",
  "No se pudo cargar el formulario.": "Could not load the form.",
  "No hay stock disponible en Bodega Central para ese producto.":
    "No stock available in Central Warehouse for that product.",
  "No se pudo completar la distribución.": "Could not complete the distribution.",
  "Seleccioná un proveedor.": "Select a supplier.",
  "Agregá al menos un producto con cantidad entera mayor a 0.":
    "Add at least one product with a whole quantity greater than 0.",
  "La proforma debe ser un PDF.": "The proforma must be a PDF.",
  "El PDF no puede superar 5 MB.": "The PDF cannot exceed 5 MB.",
  "El nombre del proveedor debe tener al menos 2 caracteres.":
    "Supplier name must be at least 2 characters.",
  "No se pudo crear el proveedor.": "Could not create the supplier.",
  "El código debe iniciar con POS_ y usar solo letras, números o guion bajo.":
    "Code must start with POS_ and use only letters, numbers, or underscore.",
  "Ingrese un nombre de usuario.": "Enter a username.",
  "El nombre no puede tener más de 20 caracteres.": "Name cannot be more than 20 characters.",
  "La contraseña no puede tener más de 64 caracteres.": "Password cannot be more than 64 characters.",
  "La contraseña debe tener al menos 6 caracteres.": "Password must be at least 6 characters.",
  "Nuevo producto": "New product",
  "+ Nuevo producto": "+ New product",
  "Administración de inventario": "Inventory administration",
  "Destacados en inicio": "Featured on home",
  "No hay productos registrados.": "No products registered.",
  "Buscar por nombre, descripción, categoría, estado o peso...":
    "Search by name, description, category, status or weight...",
  "El catálogo está disponible, pero no se pudo cargar el stock de Bodega Central.":
    "The catalog is available, but central warehouse stock could not be loaded.",
  "Reintentar stock": "Retry stock",
  "Quita el destacado antes de desactivarlo": "Remove featured status before deactivating",
  "Mostrar como destacado en el inicio": "Show as featured on the home page",
  "Descripción": "Description",
  "Destacado": "Featured",
  "Enviado": "Shipped",
  "Pedidos": "Orders",
  "Ganado (enviados en esta página)": "Earned (shipped on this page)",
  "Ganado": "Earned",
  "Recibo": "Receipt",
  "Buscar por cliente o número de compra...": "Search by customer or order number...",
  "Pendiente: aceptá o rechazá. Aceptado: enviá o volvé a pendiente (se restaura el stock). Enviado ya no se edita.":
    "Pending: accept or reject. Accepted: ship or return to pending (stock is restored). Shipped can no longer be edited.",
  "Ver compra": "View order",
  "Anterior": "Previous",
  "Siguiente": "Next",
  "Método": "Method",
  "Impuestos": "Taxes",
  "Pedido cerrado: ya no se puede editar.": "Order closed: it can no longer be edited.",
  "Marcar como pendiente": "Mark as pending",
  "Reabrir como pendiente": "Reopen as pending",
  "No tiene permiso para ver el historial de ventas.": "You do not have permission to view sales history.",
  "Acceso restringido": "Restricted access",
  "Permisos por rol": "Permissions by role",
  "Tocá el círculo para dar o quitar el permiso.": "Tap the circle to grant or revoke the permission.",
  "Buscar permiso o módulo…": "Search permission or module…",
  "Permitido": "Allowed",
  "Sin permiso": "No permission",
  "Permitido — clic para quitar": "Allowed — click to remove",
  "Sin permiso — clic para permitir": "No permission — click to allow",
  "Acción": "Action",
  "Módulo": "Module",
  "Todos los módulos": "All modules",
  "No hay permisos con los filtros actuales.": "No permissions with the current filters.",

  // Login
  "Volver": "Back",
  "correo o usuario": "email or username",
  "Ocultar contraseña": "Hide password",
  "Mostrar contraseña": "Show password",
  "Ingresando...": "Signing in...",
  "INGRESAR": "SIGN IN",
  "Correo": "Email",
  "Enviando código...": "Sending code...",
  "REGISTRARME": "REGISTER",
  "Enviamos un código a": "We sent a code to",
  ". Ingrésalo para activar tu cuenta.": ". Enter it to activate your account.",
  "Si no lo ve, revise la carpeta de": "If you don't see it, check the",
  "spam": "spam",
  "o": "or",
  "correo no deseado": "junk mail",
  "(común en Yahoo y Gmail).": "(common in Yahoo and Gmail).",
  "No pudimos enviar el correo a": "We could not send the email to",
  ". Revise que lo escribiera bien o trate de contactar a Café UNA.":
    ". Double-check the address or try contacting Café UNA.",
  "Código recibido": "Code received",
  "Verificando...": "Verifying...",
  "VERIFICAR CUENTA": "VERIFY ACCOUNT",
  "Reenviar código": "Resend code",
  "Volver al formulario": "Back to the form",
  "Nueva contraseña": "New password",
  "Confirmar nueva contraseña": "Confirm new password",
  "ENVIAR": "SEND",
  "ACTUALIZAR": "UPDATE",
  "¿No tiene una cuenta?": "Don't have an account?",
  "Registrarse": "Sign up",
  "Ingrese su correo o usuario.": "Enter your email or username.",
  "Ingrese su contraseña.": "Enter your password.",
  "Credenciales incorrectas": "Incorrect credentials",
  "Ingrese su correo.": "Enter your email.",
  "Las contraseñas no coinciden.": "Passwords do not match.",
  "Revisa tu correo e ingresa el código de verificación.": "Check your email and enter the verification code.",
  "No se pudo registrar la cuenta.": "Could not register the account.",
  "Complete el formulario de registro antes de reenviar el código.":
    "Complete the registration form before resending the code.",
  "Código reenviado. Revise su correo y la carpeta de spam.":
    "Code resent. Check your email and spam folder.",
  "No se pudo reenviar el código.": "Could not resend the code.",
  "Ingrese el código recibido en su correo.": "Enter the code you received by email.",
  "Cuenta creada correctamente. Ya puede iniciar sesión.":
    "Account created successfully. You can now log in.",
  "No se pudo verificar el código.": "Could not verify the code.",
  "Ingrese su correo o usuario para recuperar la contraseña.":
    "Enter your email or username to recover your password.",
  "Si existe una cuenta con esos datos, enviamos un código de recuperación al correo registrado.":
    "If an account matches those details, we sent a recovery code to the registered email.",
  "No se pudo iniciar la recuperación.": "Could not start recovery.",
  "Contraseña actualizada correctamente.": "Password updated successfully.",
  "No se pudo restablecer la contraseña.": "Could not reset the password.",
  "Ocurrió un error al iniciar sesión.": "An error occurred while signing in.",

  // Checkout
  "Gracias por tu compra": "Thank you for your purchase",
  "Tu pedido quedó pendiente de revisión. Te avisamos cuando se apruebe y envíe.":
    "Your order is pending review. We'll let you know when it's approved and shipped.",
  "Serás redirigido a inicio automáticamente en unos segundos.":
    "You'll be redirected home automatically in a few seconds.",
  "Seguir comprando": "Continue shopping",
  "Resumen de tu pedido": "Your order summary",
  "Pago": "Payment",
  "IVA (13%)": "VAT (13%)",
  "Activá el switch para confirmar el pedido.": "Turn on the switch to confirm your order.",
  "Procesando...": "Processing...",
  "Confirmá que ya revisaste tu pedido.": "Confirm that you already reviewed your order.",
  "Cantidad no disponible": "Quantity unavailable",
  "No se pudo completar la compra por falta de stock.": "Could not complete the purchase due to lack of stock.",

  // Perfil
  "Cerrar": "Close",
  "Cambiar foto de perfil": "Change profile photo",
  "Cambiar banner": "Change banner",
  "URL de la imagen": "Image URL",
  "Vista previa": "Preview",
  "Vista previa (96×96 px)": "Preview (96×96 px)",
  "Vista previa (112×112 px)": "Preview (112×112 px)",
  "Vista previa (220 px de alto)": "Preview (220 px tall)",
  "Vista previa (280 px de alto)": "Preview (280 px tall)",
  "Pega un enlace para ver la vista previa al tamaño real.":
    "Paste a link to see the preview at real size.",
  "Compras": "Purchases",
  "Revisá pedidos, totales y detalle.": "Review orders, totals and details.",
  "Ver historial de compras": "View purchase history",
  "Sin nombre": "No name",
  "Cambiar nombre": "Change name",
  "Nuevo nombre": "New name",
  "Cambiar correo": "Change email",
  "Nuevo correo": "New email",
  "Código de verificación": "Verification code",
  "6 dígitos": "6 digits",
  "Enviar código": "Send code",
  "Confirmar correo": "Confirm email",
  "Seguridad": "Security",
  "Cambiar contraseña": "Change password",
  "Actualizando...": "Updating...",
  "Contraseña actual": "Current password",
  "Contraseña nueva": "New password",
  "Confirmar contraseña nueva": "Confirm new password",
  "No se pudo cargar el perfil.": "Could not load the profile.",
  "Inicie sesión para ver su perfil.": "Log in to view your profile.",
  "Nombre actualizado correctamente.": "Name updated successfully.",
  "No se pudo guardar el nombre.": "Could not save the name.",
  "Imagen actualizada correctamente.": "Image updated successfully.",
  "No se pudo guardar la imagen.": "Could not save the image.",
  "Ingrese el nuevo correo.": "Enter the new email.",
  "Ingrese su contraseña actual.": "Enter your current password.",
  "Se envió el código al nuevo correo.": "The code was sent to the new email.",
  "No se pudo solicitar el cambio de correo.": "Could not request the email change.",
  "Ingrese el código recibido.": "Enter the code you received.",
  "Correo actualizado correctamente.": "Email updated successfully.",
  "No se pudo confirmar el cambio de correo.": "Could not confirm the email change.",
  "Las contraseñas nuevas no coinciden.": "The new passwords do not match.",
  "No se pudo cambiar la contraseña.": "Could not change the password.",
  "Panel administrativo": "Admin panel",

  // Admin — CMS / página principal / sobre nosotros
  "Sobre nosotros (inicio)": "About us (home)",
  "Productos destacados": "Featured products",
  "Iniciativas": "Initiatives",
  "Texto breve": "Short text",
  "Texto introductorio": "Introductory text",
  "Enlace del botón": "Button link",
  "Texto del botón": "Button text",
  "Etiqueta superior": "Upper label",
  "Título principal": "Main title",
  "Título": "Title",
  "Subtítulo": "Subtitle",
  "Enlace de Google Maps": "Google Maps link",
  "Enlaces del navbar": "Navbar links",
  "Menú de navegación": "Navigation menu",
  "Sin enlaces en el menú superior.": "No links in the top menu.",
  "Enlaces del footer": "Footer links",
  "Sección Explorar": "Explore section",
  "Sin enlaces en la columna Explorar del pie de página.": "No links in the Explore column of the footer.",
  "Español": "Spanish",
  "Mini formularios": "Mini forms",
  "Mini formularios del inicio": "Home mini forms",
  "Barra de navegación": "Navigation bar",
  "Pie de página": "Footer",
  "Buscar por etiqueta o ruta...": "Search by label or path...",
  "No hay enlaces configurados. Agregue uno para mostrarlo en el sitio.":
    "No links configured. Add one to show it on the site.",
  "Eliminar enlace": "Delete link",
  "Sin eliminar": "Cannot delete",
  "Buscar secciones por nombre o contenido...": "Search sections by name or content...",
  "Sección": "Section",
  "Enlaces actuales": "Current links",
  "Se guarda en español; la vista pública traduce automático.":
    "Saved in Spanish; the public site translates automatically.",
  "Etiqueta": "Label",
  "Ruta": "Path",
  "Orden": "Order",
  "Abrir en nueva pestana": "Open in new tab",
  "Agregar foto": "Add photo",
  "Editar foto": "Edit photo",
  "Nueva foto": "New photo",
  "Buscar por título, categoría o URL...": "Search by title, category or URL...",
  "No hay fotos que coincidan con la búsqueda.": "No photos match the search.",
  "Imagen": "Image",
  "Sin título": "No title",
  "Sin categoría": "No category",
  "Misión": "Mission",
  "Visión": "Vision",
  "Título de la sección": "Section title",
  "Texto de la sección": "Section text",
  "URL de foto": "Photo URL",
  "URL de imagen": "Image URL",
  "¿Eliminar esta foto de la galería?": "Delete this photo from the gallery?",
  "No se pudo guardar el hero.": "Could not save the hero.",
  "No se pudo guardar la sección del inicio.": "Could not save the home section.",
  "No se pudieron guardar los mini formularios.": "Could not save the mini forms.",
  "No se pudo guardar el navbar.": "Could not save the navbar.",
  "No se pudo guardar el footer.": "Could not save the footer.",
  "No se pudieron guardar los enlaces.": "Could not save the links.",
  "No se pudo guardar la foto.": "Could not save the photo.",
  "No se pudo eliminar la foto.": "Could not delete the photo.",
  "No se pudo guardar la sección.": "Could not save the section.",
  "No se pudo borrar la categoría.": "Could not delete the category.",
  "¿Deseás eliminar la solicitud de esta persona?":
    "Do you want to delete this person's request?",
  "Buscar historia, misión o visión...": "Search history, mission or vision...",
  "Resumen institucional de nuestra historia.": "Institutional summary of our history.",
  "Texto institucional de misión.": "Institutional mission text.",
  "Texto institucional de visión.": "Institutional vision text.",

  // Admin — activos / distribución / ventas / POS
  "Editar activo fijo": "Edit fixed asset",
  "Agregar activo": "Add asset",
  "Acceso restringido": "Restricted access",
  "Cargando activos fijos...": "Loading fixed assets...",
  "Buscar por código, nombre, proyecto o responsable...":
    "Search by code, name, project or responsible person...",
  "Código": "Code",
  "Compra": "Purchase",
  "Valor": "Value",
  "Activos": "Active",
  "Inactivos": "Inactive",
  "Equipo y mobiliario en un solo inventario, sin ubicaciones de punto de venta.":
    "Equipment and furniture in one inventory, without point-of-sale locations.",
  "No tenés permiso para consultar activos fijos.": "You do not have permission to view fixed assets.",
  "Total en libro (filtro actual)": "Book total (current filter)",
  "activos visibles": "visible assets",
  "Modelo": "Model",
  "Número de serie": "Serial number",
  "Fecha de compra": "Purchase date",
  "Valor en libro": "Book value",
  "Código de proyecto": "Project code",
  "Responsable": "Responsible person",
  "Descripción del proyecto": "Project description",
  "Paginación de activos fijos": "Fixed assets pagination",
  "Distribución a puntos de venta": "Distribution to points of sale",
  "Nueva distribución": "New distribution",
  "Punto de venta destino": "Destination point of sale",
  "Notas (opcional)": "Notes (optional)",
  "Historial de transferencias": "Transfer history",
  "Destino": "Destination",
  "Notas": "Notes",
  "Origen": "Origin",
  "Origen:": "Origin:",
  "Destino:": "Destination:",
  "Producto:": "Product:",
  "Cantidad:": "Quantity:",
  "Notas:": "Notes:",
  "Procesando…": "Processing…",
  "No hay transferencias con esos filtros.": "No transfers with those filters.",
  "Stock en Bodega Central:": "Central warehouse stock:",
  "Trasladá unidades desde Bodega Central hacia los puntos de venta, con historial de transferencias.":
    "Move units from Central Warehouse to points of sale, with a transfer history.",
  "Aplicar filtros": "Apply filters",
  "Página": "Page",
  "Nueva venta presencial": "New in-person sale",
  "Punto de venta": "Point of sale",
  "Nombre del producto…": "Product name…",
  "Stock en este punto:": "Stock at this point:",
  "Confirmar venta presencial": "Confirm in-person sale",
  "Punto:": "Point:",
  "Fecha:": "Date:",
  "Registrando...": "Registering...",
  "Registrar venta": "Register sale",
  "No tiene permiso para registrar ventas presenciales.":
    "You do not have permission to register in-person sales.",
  "Registrá ventas en puntos físicos; el stock se descuenta solo de ese punto.":
    "Register sales at physical points; stock is deducted only from that point.",
  "Su rol puede ver esta sección, pero no registrar ventas.":
    "Your role can view this section, but not register sales.",
  "Puntos de venta disponibles": "Available points of sale",
  "Ubicación seleccionada": "Selected location",
  "Ver inventario": "View inventory",
  "Punto inactivo": "Inactive point",
  "Editar punto de venta": "Edit point of sale",
  "Crear punto": "Create point",
  "Editar stock del punto": "Edit point stock",
  "Unidades disponibles": "Available units",
  "Motivo del ajuste": "Adjustment reason",
  "Inventario por ubicación": "Inventory by location",
  "Inventario": "Inventory",
  "No hay puntos de venta configurados.": "No points of sale configured.",
  "Todavía no hay puntos de venta. Agregá el primero para operar stock por ubicación.":
    "There are no points of sale yet. Add the first one to manage stock by location.",
  "Administrá ubicaciones y actualizá el stock de cada punto sin mezclarlo con Bodega Central.":
    "Manage locations and update each point's stock without mixing it with Central Warehouse.",
  "No tienes permiso para consultar el inventario de puntos de venta.":
    "You do not have permission to view point-of-sale inventory.",
  "Stock independiente de Bodega Central.": "Stock independent of Central Warehouse.",
  "Este punto está inhabilitado. Activalo para consultar o ajustar stock.":
    "This point is disabled. Enable it to view or adjust stock.",
  "No se opera inventario en puntos inactivos.": "Inventory is not operated at inactive points.",
  "Reintentar catálogo": "Retry catalog",
  "Peso": "Weight",
  "Stock POS": "POS stock",
  "Sin descripción": "No description",
  "Producto sin imagen": "Product without image",
  "No hay productos que coincidan con la búsqueda.": "No products match the search.",
  "Sin registro": "No record",
  "Bodega Central no se modifica desde aquí.": "Central Warehouse is not modified from here.",
  "Código (opcional)": "Code (optional)",
  "Si lo dejás vacío, se genera automáticamente a partir del nombre.":
    "If you leave it empty, it is generated automatically from the name.",
  "Cerrar editor de punto de venta": "Close point of sale editor",
  "Cerrar editor de stock": "Close stock editor",
  "Este ajuste modifica únicamente el stock de este punto de venta.":
    "This adjustment only changes the stock of this point of sale.",
  "Stock de Bodega Central": "Central warehouse stock",
  "Cerrar editor de stock central": "Close central stock editor",
  "Este valor no modifica activos ni el stock de los puntos de venta.":
    "This value does not change fixed assets or point-of-sale stock.",
  "No se pudo confirmar el stock actual. Ingresa el valor correcto para continuar.":
    "Could not confirm the current stock. Enter the correct value to continue.",
  "Usa únicamente números enteros.": "Use whole numbers only.",

  // Admin — auditoría / solicitudes / historial cliente
  "Registros": "Records",
  "Módulos auditados": "Audited modules",
  "Ocultar cambios": "Hide changes",
  "Ver datos anteriores y nuevos": "View previous and new data",
  "Buscar por acción, módulo, detalle o usuario...": "Search by action, module, detail or user...",
  "Detalle": "Detail",
  "Sin fecha": "No date",
  "Sistema": "System",
  "No tienes permiso para ver esta sección.": "You do not have permission to view this section.",
  "Registro de acciones importantes realizadas por administradores, superadministradores y vendedores.":
    "Log of important actions by administrators, superadministrators and sellers.",
  "Aquí aparecerán cambios importantes en usuarios, productos, contenido y voluntariado.":
    "Important changes to users, products, content and volunteering will appear here.",
  "Información general": "General information",
  "Creación": "Creation",
  "Actualización": "Update",
  "Eliminación": "Deletion",
  "Ajuste de stock": "Stock adjustment",
  "Solicitudes de compra": "Purchase requests",
  "Proveedor": "Supplier",
  "Ítems": "Items",
  "Entrega est.": "Est. delivery",
  "Seleccionar…": "Select…",
  "Seleccionar...": "Select...",
  "Seleccionar": "Select",
  "Horario flexible": "Flexible schedule",
  "Lunes a viernes, 8:00 a. m. a 12:00 p. m.": "Monday to Friday, 8:00 a.m. to 12:00 p.m.",
  "Lunes a viernes, 1:00 p. m. a 5:00 p. m.": "Monday to Friday, 1:00 p.m. to 5:00 p.m.",
  "Lunes a viernes, 8:00 a. m. a 5:00 p. m.": "Monday to Friday, 8:00 a.m. to 5:00 p.m.",
  "Cargando inicio...": "Loading home...",
  "Cargando galería...": "Loading gallery...",
  "Cargando galeria...": "Loading gallery...",
  "Fecha de inicio": "Start date",
  "Fecha de finalización": "End date",
  "Fecha de Finalización": "End date",
  "FECHA DE INICIO": "START DATE",
  "FECHA DE FINALIZACIÓN": "END DATE",
  "otro": "other",
  "Otro": "Other",
  "Premium": "Premium",
  "Especialidad": "Specialty",
  "Altura": "High altitude",
  "Tarrazu": "Tarrazú",
  "Tarrazú": "Tarrazú",
  "prueba": "test",
  "Foto principal (URL)": "Main photo (URL)",
  "Foto extra 2": "Extra photo 2",
  "Foto extra 3": "Extra photo 3",
  "Foto extra 4": "Extra photo 4",
  "Precio normal": "Regular price",
  "Precio con IVA": "Price with VAT",
  "Peso": "Weight",
  "Stock mínimo (alerta por punto de venta)": "Minimum stock (alert per point of sale)",
  "Se avisa si Bodega Central o cualquier punto de venta con stock (salvo Stand Ferias) queda en ese nivel o menos.":
    "You get an alert if Central Warehouse or any point of sale with stock (except Fair Stand) reaches that level or below.",
  "Sin subcategoría": "No subcategory",
  "Agregar una nueva categoría": "Add a new category",
  "AGREGAR UNA NUEVA CATEGORÍA": "ADD A NEW CATEGORY",
  "Agregar subcategoría (ej. tueste)": "Add subcategory (e.g. roast)",
  "Ej. Café de altura": "e.g. High-altitude coffee",
  "Ej. Tueste medio": "e.g. Medium roast",
  "Nueva categoría": "New category",
  "Nueva subcategoría": "New subcategory",
  "Agregar": "Add",
  "Agregando...": "Adding...",
  "Mostrar como destacado en el inicio": "Show as featured on the home page",
  "Máximo 3 productos destacados en el inicio": "Maximum 3 featured products on the home page",
  "Un producto inactivo no puede destacarse.": "An inactive product cannot be featured.",
  "Un producto sin stock no puede destacarse.": "A product without stock cannot be featured.",
  "Descripción del proyecto": "Project description",
  "Nombre completo": "Full name",
  "Inactivo": "Inactive",
  "Habilitado": "Enabled",
  "Deshabilitado": "Disabled",
  "Solo puede cambiar su propia contraseña.": "You can only change your own password.",
  "Correo": "Email",
  "Usuario": "User",
  "Cliente": "Customer",
  "Todos los módulos": "All modules",
  "Matriz de permisos guardada.": "Permission matrix saved.",
  "No se pudieron cargar los ajustes.": "Could not load settings.",
  "No se pudo guardar la matriz.": "Could not save the matrix.",
  "¿Guardar la matriz de permisos? Los cambios aplican de inmediato.": "Save the permission matrix? Changes apply immediately.",
  "Historial": "History",
  "Sin foto": "No photo",
  "Stock central": "Central stock",
  "No disponible": "Unavailable",
  "Img": "Img",
  "Destacado": "Featured",
  "Precio": "Price",
  "de prueba": "test",
  "sisi pa": "sisi pa",
  "Nuevo proveedor (nombre)": "New supplier (name)",
  "Creando…": "Creating…",
  "Producto…": "Product…",
  "Quitar fila": "Remove row",
  "Entrega estimada:": "Estimated delivery:",
  "Proforma:": "Proforma:",
  "Sin proforma adjunta.": "No proforma attached.",
  "Historial de estados": "Status history",
  "Buscar por proveedor, estado o notas…": "Search by supplier, status or notes…",
  "Nueva solicitud": "New request",
  "Nueva solicitud de compra": "New purchase request",
  "Fecha estimada de entrega": "Estimated delivery date",
  "Ver detalle": "View details",
  "Marcar como recibida": "Mark as received",
  "Aprobada": "Approved",
  "Recibida": "Received",
  "Paginación de solicitudes de compra": "Purchase requests pagination",
  "Generá solicitudes internas, adjuntá proformas y registrá la entrada de stock al recibir.":
    "Create internal requests, attach proformas and record stock intake on receipt.",
  "Mis compras": "My purchases",
  "Consultá el estado de tus pedidos: pendiente, aceptado, enviado o rechazado.":
    "Check the status of your orders: pending, accepted, shipped or rejected.",
  "Número": "Number",
  "Monto mínimo": "Minimum amount",
  "Monto máximo": "Maximum amount",
  "Iniciá sesión para ver tu historial de compras.": "Log in to see your purchase history.",
  "Ir a login": "Go to login",
  "Tu rol no tiene acceso al historial de compras.": "Your role cannot access purchase history.",
  "Todavía no tenés compras registradas.": "You do not have any registered purchases yet.",
  "Restablecer filtros": "Reset filters",
  "Proforma PDF (máx. 5 MB)": "Proforma PDF (max. 5 MB)",
  "Descargar PDF": "Download PDF",
  "Proveedor:": "Supplier:",
  "Estado:": "Status:",
  "pendiente": "pending",
  "aprobada": "approved",
  "recibida": "received",
  "Usuario": "User",
  "Cliente": "Customer",
  "Vendedor": "Seller",
  "Abrir en administración": "Open in admin",
  "Mañana": "Morning",
  "Tarde": "Afternoon",
  "Mañana (8:00 – 12:00)": "Morning (8:00 – 12:00)",
  "Mañana (8:00 - 12:00)": "Morning (8:00 - 12:00)",
  "Tarde (13:00 – 17:00)": "Afternoon (1:00 – 5:00 p.m.)",
  "Tarde (13:00 - 17:00)": "Afternoon (1:00 - 5:00 p.m.)",
  "Cambiar banner": "Change banner",
  "Cambiar nombre": "Change name",
  "Cambiar correo": "Change email",
  "Cambiar contraseña": "Change password",
  "Seguridad": "Security",
  "Impuestos": "Taxes",
  "Ajustes del sistema": "System settings",
  "Fechas y horas para recibir grupos de visitas o voluntariado.":
    "Dates and hours to receive visit or volunteering groups.",
  "Horario y disponibilidad": "Hours and availability",
  "Actividades de limpieza y mantenimiento": "Cleaning and maintenance activities",
  "Idioma predeterminado del sitio (cuando alguien entra por primera vez). Cualquier visitante puede cambiarlo en la barra superior (ES / EN). El contenido se guarda en español en Supabase y se traduce automáticamente al mostrar en inglés.":
    "Default site language (first visit). Anyone can change it in the top bar (ES / EN). Content is stored in Spanish in Supabase and is translated automatically when shown in English.",

  // Errores / validación UI (ST)
  "Ingrese el nombre del producto.": "Enter the product name.",
  "Ingrese la descripción del producto.": "Enter the product description.",
  "El nombre no puede tener más de 12 palabras.": "Name cannot be more than 12 words.",
  "El nombre no puede tener más de 200 caracteres.": "Name cannot be more than 200 characters.",
  "La descripción no puede tener más de 80 palabras.": "Description cannot be more than 80 words.",
  "La descripción no puede tener más de 2000 caracteres.": "Description cannot be more than 2000 characters.",
  "Ingrese un entero entre 0 y 2147483647.": "Enter an integer between 0 and 2147483647.",
  "El motivo es obligatorio (máx. 40 palabras).": "Reason is required (max. 40 words).",
  "Usa un número entero entre 0 y 2147483647.": "Use an integer between 0 and 2147483647.",
  "No se pudo actualizar el stock central.": "Could not update central stock.",
  "No se pudo guardar el ajuste.": "Could not save the adjustment.",
  "No se pudo guardar el punto de venta.": "Could not save the point of sale.",
  "No se pudo cambiar el estado.": "Could not change the status.",
  "No se pudo cargar el historial.": "Could not load the history.",
  "No se pudieron cargar las solicitudes.": "Could not load the requests.",
};

function normalizarClave(texto) {
  return String(texto ?? "").trim().replace(/\s+/g, " ");
}

/** Nombre de marca: nunca se traduce. */
const MARCA_CAFE_UNA = "Café UNA";
const MARCA_FUNDA_UNA = "FUNDA-UNA";
/** Tokens ASCII estables; los proveedores de traducción suelen dejarlos intactos. */
const TOKEN_MARCA = "XXCAFEUNAXX";
const TOKEN_UNA = "XXUNAINSTXX";
const TOKEN_FUNDA = "XXFUNDAUNAXX";

function protegerMarca(texto) {
  return String(texto ?? "")
    // Primero la marca completa
    .replace(/\b[Cc]af[eé]\s+UNA\b/gi, TOKEN_MARCA)
    // Punto de venta / fundación: FUNDA-UNA, FUNDA UNA, FundaUNA…
    .replace(/\bFUNDA[\s_-]*UNA\b/gi, TOKEN_FUNDA)
    // "la UNA" / "de la UNA" (universidad), no "ONE"
    .replace(/\b(?:de\s+)?la\s+UNA\b/gi, TOKEN_UNA);
}

function restaurarMarca(texto) {
  let t = String(texto ?? "");

  // Bloques [[...]] / ⟦...⟧ basura de traducciones viejas
  t = t.replace(/[\[⟦]{1,2}([^\]⟧]*)[\]⟧]{1,2}/g, (full, inner) => {
    if (!/(?:CAF[EÉ]|COFFEE|UNA|ONE|FUNDA)/i.test(inner)) return full;
    if (/FUNDA/i.test(inner)) return MARCA_FUNDA_UNA;
    const rest = String(inner)
      .replace(/(?:CAF[EÉ]|COFFEE)/gi, " ")
      .replace(/[_\s-]*(?:UNA|ONE)\b/gi, " ")
      .replace(/[_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return rest ? `${MARCA_CAFE_UNA} ${rest}` : MARCA_CAFE_UNA;
  });

  // Si MyMemory dejó "Café/Coffee" pegado al token → una sola marca
  t = t.replace(/(?:\bCaf[eé]\s+|\bCoffee\s+)?XXCAFEUNAXX\b/gi, MARCA_CAFE_UNA);
  t = t.replace(new RegExp(TOKEN_FUNDA, "gi"), MARCA_FUNDA_UNA);
  t = t.replace(new RegExp(TOKEN_UNA, "gi"), "UNA");

  // Variantes erróneas típicas de la marca
  t = t.replace(/\bCoffee\s*(?:UNA|ONE)\b/gi, MARCA_CAFE_UNA);
  t = t.replace(/\bCaf[eé]\s*(?:UNA|ONE)\b/gi, MARCA_CAFE_UNA);
  // No usar /\bUNA\s*Coffee\b/: rompe "Café UNA coffee bag" → "Café Café UNA bag"
  // Marca duplicada: "Café Café UNA" / "Coffee Café UNA"
  t = t.replace(/\b(?:Caf[eé]|Coffee)\s+(?:Caf[eé]|Coffee)\s+UNA\b/gi, MARCA_CAFE_UNA);
  // FUNDA-UNA / variantes mal traducidas
  t = t.replace(/\bFUNDA[\s_-]*UNA\b/gi, MARCA_FUNDA_UNA);
  t = t.replace(/\bFUNDA[\s_-]*(?:ONE|University)\b/gi, MARCA_FUNDA_UNA);
  // "the ONE" suelto (universidad mal traducida)
  t = t.replace(/\bthe\s+ONE\b/gi, "UNA");
  t = t.replace(/\bof\s+ONE\b/gi, "of UNA");

  return t;
}

function traducirCacheInvalida(valor) {
  const v = String(valor || "");
  if (/QUERY LENGTH LIMIT|MAX ALLOWED QUERY|MYMEMORY WARNING/i.test(v)) return true;
  if (/[\[⟦]{1,2}[^\]]*?(?:CAF[EÉ]|COFFEE|FUNDA)/i.test(v)) return true;
  if (new RegExp(TOKEN_MARCA, "i").test(v)) return true;
  if (new RegExp(TOKEN_FUNDA, "i").test(v)) return true;
  if (new RegExp(TOKEN_UNA, "i").test(v)) return true;
  // Traducciones basura conocidas de la API
  if (/^(Asset|Qualification|Eliminate)$/i.test(v.trim())) return true;
  return false;
}

function leerCachePersistente() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v !== "string") continue;
        const limpio = restaurarMarca(v);
        if (traducirCacheInvalida(limpio)) continue;
        memoria.set(k, limpio);
      }
    }
  } catch {
    /* ignore */
  }
  try {
    const rawEn = sessionStorage.getItem(CACHE_KEY_EN_ES);
    if (!rawEn) return;
    const parsedEn = JSON.parse(rawEn);
    if (parsedEn && typeof parsedEn === "object") {
      for (const [k, v] of Object.entries(parsedEn)) {
        if (typeof v !== "string") continue;
        const limpio = restaurarMarca(v);
        if (traducirCacheInvalida(limpio)) continue;
        memoriaEnEs.set(k, limpio);
      }
    }
  } catch {
    /* ignore */
  }
}

function guardarCachePersistente() {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(memoria.entries())));
  } catch {
    /* ignore */
  }
}

function guardarCacheEnEs() {
  try {
    sessionStorage.setItem(
      CACHE_KEY_EN_ES,
      JSON.stringify(Object.fromEntries(memoriaEnEs.entries())),
    );
  } catch {
    /* ignore */
  }
}

leerCachePersistente();

const DICCIONARIO_EN_ES = (() => {
  const rev = {};
  for (const [es, en] of Object.entries(DICCIONARIO)) {
    if (typeof en === "string" && en.trim()) rev[en] = es;
  }
  // Variantes EN ya guardadas por error en BD (antes de forzar español)
  Object.assign(rev, {
    "People of café UNA tasting café UNA": "Personas de la UNA degustando Café UNA",
    "People of Café UNA tasting Café UNA": "Personas de la UNA degustando Café UNA",
    "People of the ONE tasting Café UNA": "Personas de la UNA degustando Café UNA",
    "People from UNA tasting Café UNA": "Personas de la UNA degustando Café UNA",
    "Café UNA coffee bag": "Bolsa de café UNA",
    "Café Café UNA bag": "Bolsa de café UNA",
    "Café Café UNA coffee bag": "Bolsa de café UNA",
    "Café UNA bag": "Bolsa de café UNA",
    "Coffee UNA bag": "Bolsa de café UNA",
    "Coffee information for new students": "Información del café para nuevos estudiantes",
    "Café UNA booth": "Puesto de café UNA",
    "Café UNA at the fair": "Café UNA en la feria",
    "Café UNA booth at the fair": "Puesto de Café UNA en feria",
    "Welcome to new students": "Bienvenida a nuevos estudiantes",
    "Coffee sale": "Venta de café",
    "Newcomer info": "Información del café para nuevos estudiantes",
    "History": "Historia",
    "Mission": "Misión",
    "Vision": "Visión",
    "Bags": "Bolsas",
    "Fair": "Feria",
    "Coffee": "Café",
  });
  return rev;
})();

function textoSinMarca(texto) {
  return String(texto ?? "")
    .replace(/\b[Cc]af[eé]\s+UNA\b/gi, " ")
    .replace(/\bCoffee\s+(?:UNA|ONE)\b/gi, " ")
    .replace(/\bFUNDA[\s_-]*UNA\b/gi, " ")
    .replace(/\b(?:de\s+)?la\s+UNA\b/gi, " ")
    .replace(/\bUNA\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Heurística: texto libre en inglés (para forzar ES en BD). */
export function pareceIngles(texto) {
  const t = normalizarClave(texto);
  if (!t || t.length < 3) return false;
  if (DICCIONARIO[t] || Object.keys(DICCIONARIO).some((es) => es.toLowerCase() === t.toLowerCase())) {
    return false;
  }
  if (DICCIONARIO_EN_ES[t] || delDiccionarioEnEs(t) != null) return true;

  // Ignorar acentos de la marca (Café UNA) al decidir idioma
  const sinMarca = textoSinMarca(t);
  if (!sinMarca) return false;
  if (/[áéíóúñü¿¡]/i.test(sinMarca)) return false;

  return /\b(the|and|or|of|for|with|your|you|please|select|general|support|training|research|volunteer|period|from|to|available|coffee|shirt|form|login|submit|request|institution|country|phone|email|people|tasting|booth|stand|welcome|newcomer|bag|fair|this|is|are|was|were|have|has|info|information|students|sale)\b/i.test(
    sinMarca,
  );
}

/**
 * Si el texto está en inglés (o el UI está en EN), lo deja en español para la BD.
 * Si ya está en español, no lo toca. Siempre preserva Café UNA.
 */
export async function asegurarEspanolParaBd(texto) {
  const key = normalizarClave(texto);
  if (!key) return "";
  const limpio = restaurarMarca(key);
  if (/^funda[\s_-]*una$/i.test(limpio)) return MARCA_FUNDA_UNA;
  if (/^caf[eé]\s*una$/i.test(limpio)) return MARCA_CAFE_UNA;

  // Ya es una frase conocida en español
  if (
    DICCIONARIO[limpio]
    || Object.keys(DICCIONARIO).some((es) => es.toLowerCase() === limpio.toLowerCase())
  ) {
    // Si la clave es ES conocida, devolver la forma canónica en español del diccionario
    const canon = Object.keys(DICCIONARIO).find((es) => es.toLowerCase() === limpio.toLowerCase());
    return restaurarMarca(canon || limpio);
  }

  // Inglés conocido → español
  const rev = delDiccionarioEnEs(limpio);
  if (rev != null) return restaurarMarca(rev);

  if (pareceIngles(limpio)) {
    return restaurarMarca(await traducirEnAEs(limpio));
  }

  try {
    const uiEn = String(localStorage.getItem("cafe-una-idioma") || "").toLowerCase() === "en";
    if (uiEn) {
      const sinMarca = textoSinMarca(limpio);
      const pareceEspanol =
        /[áéíóúñü¿¡]/i.test(sinMarca)
        || /\b(para|con|los|las|del|por|una|unos|esto|esta|nuestro|nuestra|feria|puesto|bolsa|personas|bienvenida|estudiantes|informaci[oó]n|degustando|venta|nuevos)\b/i.test(
          sinMarca,
        );
      if (sinMarca && !pareceEspanol && /[a-zA-Z]{4,}/.test(sinMarca)) {
        return restaurarMarca(await traducirEnAEs(limpio));
      }
    }
  } catch {
    /* ignore */
  }

  return limpio;
}

function delDiccionario(texto) {
  const key = normalizarClave(texto);
  if (!key) return "";
  // Marca completa
  if (/^caf[eé]\s*una$/i.test(key)) return MARCA_CAFE_UNA;
  if (/^funda[\s_-]*una$/i.test(key)) return MARCA_FUNDA_UNA;
  if (DICCIONARIO[key]) return restaurarMarca(DICCIONARIO[key]);
  const lower = key.toLowerCase();
  for (const [es, en] of Object.entries(DICCIONARIO)) {
    if (es.toLowerCase() === lower) return restaurarMarca(en);
  }
  // Sufijos frecuentes: "72 disponibles"
  const mDisp = key.match(/^(\d+)\s+disponibles?$/i);
  if (mDisp) {
    const n = mDisp[1];
    return Number(n) === 1 ? `${n} available` : `${n} available`;
  }
  const mProd = key.match(/^(\d+)\s+productos?$/i);
  if (mProd) {
    const n = mProd[1];
    return Number(n) === 1 ? `${n} product` : `${n} products`;
  }
  const mBod = key.match(/^(\d+)\s+unidades?\s+en\s+bodega$/i);
  if (mBod) {
    const n = mBod[1];
    return Number(n) === 1 ? `${n} unit in stock` : `${n} units in stock`;
  }
  const mEntero = key.match(/^Ingrese un entero entre 0 y (\d+)\.?$/i);
  if (mEntero) return `Enter an integer between 0 and ${mEntero[1]}.`;
  const mUsaEntero = key.match(/^Usa un n[uú]mero entero entre 0 y (\d+)\.?$/i);
  if (mUsaEntero) return `Use an integer between 0 and ${mUsaEntero[1]}.`;
  const mNombrePalabras = key.match(/^El nombre no puede tener m[aá]s de (\d+) palabras\.?$/i);
  if (mNombrePalabras) return `Name cannot be more than ${mNombrePalabras[1]} words.`;
  const mNombreChars = key.match(/^El nombre no puede tener m[aá]s de (\d+) caracteres\.?$/i);
  if (mNombreChars) return `Name cannot be more than ${mNombreChars[1]} characters.`;
  const mDescPalabras = key.match(/^La descripci[oó]n no puede tener m[aá]s de (\d+) palabras\.?$/i);
  if (mDescPalabras) return `Description cannot be more than ${mDescPalabras[1]} words.`;
  const mDescChars = key.match(/^La descripci[oó]n no puede tener m[aá]s de (\d+) caracteres\.?$/i);
  if (mDescChars) return `Description cannot be more than ${mDescChars[1]} characters.`;
  const mMotivo = key.match(/^El motivo es obligatorio \(m[aá]x\. (\d+) palabras\)\.?$/i);
  if (mMotivo) return `Reason is required (max. ${mMotivo[1]} words).`;
  const mHorarioEsp = key.match(/^El horario especial debe estar entre (.+) y (.+)\.?$/i);
  if (mHorarioEsp) return `The special schedule must be between ${mHorarioEsp[1]} and ${mHorarioEsp[2]}.`;
  const mEliminarSol = key.match(/^\¿Dese[aá]s eliminar la solicitud de (.+)\?$/i);
  if (mEliminarSol) return `Do you want to delete the request from ${mEliminarSol[1]}?`;
  const mCambiaHoras = key.match(/^Cambi[aá] las horas \(ej\. (.+)\)\. (.+) es el horario normal\.?$/i);
  if (mCambiaHoras) return `Change the hours (e.g. ${mCambiaHoras[1]}). ${mCambiaHoras[2]} is the normal schedule.`;
  const mHorarioGuardado = key.match(/^Horario especial guardado: (.+)\.?$/i);
  if (mHorarioGuardado) return `Special schedule saved: ${mHorarioGuardado[1]}.`;
  return null;
}

/** Traducción síncrona: diccionario + caché (sin red). */
export function traducirSync(texto) {
  const key = normalizarClave(texto);
  if (!key) return "";
  if (/^caf[eé]\s*una$/i.test(key)) return MARCA_CAFE_UNA;
  if (/^funda[\s_-]*una$/i.test(key)) return MARCA_FUNDA_UNA;
  const dict = delDiccionario(key);
  if (dict != null) return restaurarMarca(dict);
  if (memoria.has(key)) {
    const cached = memoria.get(key);
    if (traducirCacheInvalida(cached)) {
      memoria.delete(key);
    } else {
      return restaurarMarca(cached);
    }
  }
  return restaurarMarca(key);
}

async function pedirGoogleGtx(texto, langpair = "es|en") {
  const [sl, tl] = String(langpair).split("|");
  if (!sl || !tl) throw new Error("bad langpair");
  const url =
    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(sl)}`
    + `&tl=${encodeURIComponent(tl)}&dt=t&q=${encodeURIComponent(texto)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("gtx failed");
  const data = await res.json();
  if (!Array.isArray(data?.[0])) throw new Error("gtx empty");
  const joined = data[0]
    .map((parte) => (Array.isArray(parte) ? parte[0] : ""))
    .filter(Boolean)
    .join("");
  const limpio = String(joined || "").trim();
  if (!limpio) throw new Error("gtx empty");
  if (
    langpair === "es|en"
    && limpio.toLowerCase() === String(texto || "").trim().toLowerCase()
    && /[áéíóúñü]/i.test(limpio)
  ) {
    throw new Error("untranslated");
  }
  return limpio;
}

async function pedirMyMemory(texto, langpair = "es|en") {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(texto)}&langpair=${langpair}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("translate failed");
  const data = await res.json();
  const translated = data?.responseData?.translatedText;
  if (typeof translated !== "string" || !translated.trim()) {
    throw new Error("empty translation");
  }
  const limpio = translated.trim();
  if (
    data?.responseStatus === 429
    || /MYMEMORY WARNING|QUERY LENGTH LIMIT|MAX ALLOWED QUERY|AVAILABLE FREE TRANSLATIONS/i.test(limpio)
  ) {
    throw new Error("query too long");
  }
  if (
    langpair === "es|en"
    && limpio.toLowerCase() === String(texto || "").trim().toLowerCase()
    && /[áéíóúñü]/i.test(limpio)
  ) {
    throw new Error("untranslated");
  }
  return limpio;
}

/** Traduce un trozo con varios proveedores (dinámico; no hace falta diccionario). */
async function pedirTraduccionProveedores(texto, langpair = "es|en") {
  const errores = [];
  for (const pedir of [pedirGoogleGtx, pedirMyMemory]) {
    try {
      return await pedir(texto, langpair);
    } catch (err) {
      errores.push(err);
    }
  }
  throw errores[errores.length - 1] || new Error("translate failed");
}

/** Parte textos largos para no pasar el tope de ~500 chars de MyMemory / URL de gtx. */
function trocearParaTraducir(texto, maxLen = 450) {
  const t = String(texto || "").trim();
  if (!t) return [];
  if (t.length <= maxLen) return [t];

  const partes = [];
  const bloques = t.split(/(\n+|(?<=[.!?…;:])\s+)/);
  let actual = "";

  const flush = () => {
    const limpio = actual.trim();
    if (limpio) partes.push(limpio);
    actual = "";
  };

  for (const bloque of bloques) {
    if (!bloque) continue;
    if ((actual + bloque).length <= maxLen) {
      actual += bloque;
      continue;
    }
    flush();
    if (bloque.length <= maxLen) {
      actual = bloque;
      continue;
    }
    for (let i = 0; i < bloque.length; i += maxLen) {
      partes.push(bloque.slice(i, i + maxLen));
    }
  }
  flush();
  return partes.length ? partes : [t.slice(0, maxLen)];
}

async function traducirConApi(texto, langpair = "es|en") {
  const protegido = protegerMarca(texto);
  const trozos = trocearParaTraducir(protegido);
  let resultado;
  if (trozos.length <= 1) {
    resultado = await pedirTraduccionProveedores(protegido, langpair);
  } else {
    const traducciones = [];
    for (const trozo of trozos) {
      if (traducciones.length > 0) {
        await new Promise((r) => setTimeout(r, 80));
      }
      traducciones.push(await pedirTraduccionProveedores(trozo, langpair));
    }
    resultado = traducciones.join(" ").replace(/\s+/g, " ").trim();
  }
  return restaurarMarca(resultado);
}

function delDiccionarioEnEs(texto) {
  const key = normalizarClave(texto);
  if (!key) return "";
  if (DICCIONARIO_EN_ES[key]) return DICCIONARIO_EN_ES[key];
  const lower = key.toLowerCase();
  for (const [en, es] of Object.entries(DICCIONARIO_EN_ES)) {
    if (en.toLowerCase() === lower) return es;
  }
  const mDisp = key.match(/^(\d+)\s+available$/i);
  if (mDisp) return `${mDisp[1]} disponibles`;
  const mUnits = key.match(/^(\d+)\s+units?\s+in\s+stock$/i);
  if (mUnits) {
    const n = mUnits[1];
    return Number(n) === 1 ? `${n} unidad en bodega` : `${n} unidades en bodega`;
  }
  return null;
}

export function traducirEnAEsSync(texto) {
  const key = normalizarClave(texto);
  if (!key) return "";
  const conMarca = restaurarMarca(key);
  if (/^caf[eé]\s*una$/i.test(conMarca)) return MARCA_CAFE_UNA;
  const dict = delDiccionarioEnEs(conMarca);
  if (dict != null) return restaurarMarca(dict);
  if (memoriaEnEs.has(key)) return restaurarMarca(memoriaEnEs.get(key));
  return restaurarMarca(conMarca);
}

/** Traduce EN→ES para guardar en Supabase en español (API dinámica). */
export async function traducirEnAEs(texto) {
  const key = normalizarClave(texto);
  if (!key) return "";

  if (memoriaEnEs.has(key)) return restaurarMarca(memoriaEnEs.get(key));
  if (inflightEnEs.has(key)) return inflightEnEs.get(key);

  const job = traducirConApi(key, "en|es")
    .then((es) => {
      const fijo = restaurarMarca(es);
      memoriaEnEs.set(key, fijo);
      guardarCacheEnEs();
      inflightEnEs.delete(key);
      return fijo;
    })
    .catch(() => {
      const dict = delDiccionarioEnEs(key);
      inflightEnEs.delete(key);
      return restaurarMarca(dict != null ? dict : key);
    });

  inflightEnEs.set(key, job);
  return job;
}

export async function asegurarCamposEnEspanol(obj, campos) {
  if (!obj || typeof obj !== "object") return obj;
  const out = { ...obj };
  await Promise.all(
    campos.map(async (campo) => {
      const val = out[campo];
      if (typeof val !== "string" || !val.trim()) return;
      if (pareceNoTraducible(val)) return;
      out[campo] = await asegurarEspanolParaBd(val);
    }),
  );
  return out;
}

/**
 * Traduce ES→EN con función dinámica (API). Cualquier texto nuevo se traduce
 * sin tener que agregarlo al diccionario. Si la API falla, usa caché/diccionario.
 * El diccionario gana primero para no traducir mal UI fija (Activo→Active, no Asset).
 */
export async function traducirEsAEn(texto) {
  const key = normalizarClave(texto);
  if (!key) return "";
  if (/^caf[eé]\s*una$/i.test(key)) return MARCA_CAFE_UNA;
  if (/^funda[\s_-]*una$/i.test(key)) return MARCA_FUNDA_UNA;

  const dict = delDiccionario(key);
  if (dict != null) return restaurarMarca(dict);

  if (memoria.has(key)) {
    const cached = memoria.get(key);
    if (traducirCacheInvalida(cached) || cached === key) {
      memoria.delete(key);
    } else {
      return restaurarMarca(cached);
    }
  }

  // Evita re-traducir texto que ya está en inglés
  if (pareceIngles(key)) return restaurarMarca(key);

  if (inflight.has(key)) return inflight.get(key);

  const job = traducirConApi(key, "es|en")
    .then((en) => {
      const fijo = restaurarMarca(en);
      if (!traducirCacheInvalida(fijo)) {
        memoria.set(key, fijo);
        guardarCachePersistente();
      }
      inflight.delete(key);
      return fijo;
    })
    .catch(() => {
      inflight.delete(key);
      return restaurarMarca(key);
    });

  inflight.set(key, job);
  return job;
}

function esCampoNoTraducible(clave) {
  return /^(id|clave|ruta|url|href|src|image|logo|correo|email|telefono|phone|token|password|fecha|orden|stock|precio|codigo|sku)/i.test(
    String(clave || ""),
  );
}

function pareceNoTraducible(valor) {
  const t = String(valor || "").trim();
  if (!t) return true;
  if (/^https?:\/\//i.test(t)) return true;
  if (/^\/[a-z0-9/_-]*$/i.test(t)) return true;
  if (/^[\d\s.,₡$CRC]+$/i.test(t)) return true;
  if (/^[0-9a-f-]{8,}$/i.test(t)) return true;
  if (/@/.test(t) && /\./.test(t)) return true;
  return false;
}

/** Traduce campos de texto de un objeto (ignora urls, ids, precios). */
export async function traducirCamposObjeto(obj, campos) {
  if (!obj || typeof obj !== "object") return obj;
  const out = { ...obj };
  await Promise.all(
    campos.map(async (campo) => {
      if (esCampoNoTraducible(campo)) return;
      const val = out[campo];
      if (typeof val !== "string" || pareceNoTraducible(val)) return;
      out[campo] = await traducirEsAEn(val);
    }),
  );
  return out;
}

/**
 * Vista admin: ES muestra BD tal cual; EN traduce campos de texto para editar.
 * Al guardar usar asegurarCamposEnEspanol.
 */
export async function camposParaVistaAdmin(obj, campos, idioma) {
  const base = obj && typeof obj === "object" ? { ...obj } : {};
  if (idioma !== "en") return base;
  return traducirCamposObjeto(base, campos);
}

export async function traducirListaObjetos(lista, campos) {
  if (!Array.isArray(lista)) return [];
  return Promise.all(lista.map((item) => traducirCamposObjeto(item, campos)));
}
