import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './Navbar.css';
import { calcularPrecioConIVA, obtenerAlertasStock } from '../../services/productosService';
import { Bell, ChevronDown, Gift, HandHeart, LayoutDashboard, LogOut, MapPin, Menu, Package, ShoppingBag, ShoppingCart, Sprout, User, X } from 'lucide-react';
import { LanguageSwitcher } from '../LanguageSwitcher/LanguageSwitcher';
import { CartLine, metaCarrito } from './CartLine';
import { obtenerEnlaces, obtenerFooter, obtenerNavbar } from '../../services/informacionService';
import { IconoSitio } from '../IconoSitio/IconoSitio';
import { lugarIconoMenu } from '../../lib/iconosSitio';
import { normalizeImageUrl } from '../../lib/imageUtils';
import { useHomeBrandNavigation } from '../../hooks/useHomeBrandNavigation';
import { readPageCache } from '../../lib/pageDataCache';
import { obtenerSolicitudes, obtenerSolicitudesDeUsuario } from '../../services/voluntariadoService';
import { obtenerVentasParaNotificaciones } from '../../services/comprasService';
import {
    obtenerMisSolicitudesDonacion,
    obtenerSolicitudesDonacionAdmin,
} from '../../services/donacionesService';
import {
    obtenerSolicitudesVisitaDeUsuario,
    obtenerSolicitudesVisitas,
} from '../../services/visitasService';
import { obtenerMisSolicitudes } from '../../services/solicitudesService';
import { marcarNotificacionLeida, obtenerNotificacionesPropias } from '../../services/propuestasProductoresService';
import { cancelPendingSessionRefresh } from '../../services/apiClient';
import { beginLogout, clearSession, getActiveSessionUser } from '../../services/sessionService';
import { marcarIntentRegistroCliente, puedeComprar } from '../../services/authService';
import { rolesDeUsuario, tienePermiso } from '../../lib/permisos';
import { textoIdioma } from '../../lib/idioma';
import { useIdioma } from '../../lib/useIdioma';
import { useTraducir } from '../../hooks/useTraducir';
import { requestAdminStockProduct } from '../../lib/adminStockAlert';
import SiteNavLink from '../SiteNavLink/SiteNavLink';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { normalizePathname } from '../../lib/paths';
import { rutaMisCompras } from '../../Pages/HistorialCompras/rutasCompras';
import { rutaMisSolicitudes } from '../../Pages/HistorialSolicitudes/HistorialSolicitudesCliente';

import { clearCart as emptyCart, getStoredCart, saveCart } from '../../lib/cartStorage';
import { soltarCarritoAlCerrarSesion } from '../../lib/cartSync';

function NombreCarrito({ nombre }) {
    return useTraducir(nombre || '');
}

const ABOUT_HISTORIA_PATH = '/AboutUs';
const ABOUT_GALERIA_PATH = '/AboutUs/galeria';
const EQUIPO_PATH = '/equipo';

function etiquetaEnlace(enlace, idioma) {
    const es = enlace?.etiqueta ?? enlace?.Etiqueta ?? '';
    return textoIdioma(es, null, idioma) || es;
}

function isFormsNavLink(enlace) {
    const ruta = String(enlace?.ruta ?? enlace?.Ruta ?? '').toLowerCase();
    const etiqueta = String(
        `${enlace?.etiqueta ?? enlace?.Etiqueta ?? ''} ${enlace?.etiquetaEn ?? enlace?.EtiquetaEn ?? ''}`,
    ).toLowerCase();
    return (
        ruta.includes('voluntariado') ||
        etiqueta.includes('voluntariado') ||
        etiqueta.includes('volunteering') ||
        etiqueta.includes('formularios') ||
        (etiqueta.includes('forms') && !etiqueta.includes('about'))
    );
}

function isAboutNavLink(enlace) {
    const ruta = String(enlace?.ruta ?? enlace?.Ruta ?? '').toLowerCase();
    const etiqueta = String(
        `${enlace?.etiqueta ?? enlace?.Etiqueta ?? ''} ${enlace?.etiquetaEn ?? enlace?.EtiquetaEn ?? ''}`,
    ).toLowerCase();
    return (
        ruta.includes('aboutus') ||
        ruta.includes('/about') ||
        ruta.includes('sobre') ||
        etiqueta.includes('sobre nosotros') ||
        etiqueta.includes('about us') ||
        (etiqueta.includes('nosotros') && !etiqueta.includes('product'))
    );
}

const formatCRC = (amount) => {
    const value = Number.isFinite(amount) ? amount : 0;
    return `CRC ${value.toLocaleString('es-CR')}`;
};

const getQuantity = (item) => Number(item.units) || 1;
const getUnitPriceWithoutIva = (item) => Number(item.precioNormal ?? item.priceWithoutIva ?? item.price ?? 0) || 0;
const getUnitPriceWithIva = (item) => calcularPrecioConIVA(getUnitPriceWithoutIva(item));
const getAvailableStock = (item) => Number(item.stock) || 0;
const canSeeAllSolicitudes = (user) => {
    const roles = Array.isArray(user?.roles) ? user.roles : [];
    return roles.some((role) => {
        const normalizedRole = String(role).toLowerCase();
        return normalizedRole === 'admin' || normalizedRole === 'superadmin';
    });
};
const canSeeStockAlerts = (user) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    const roles = rolesDeUsuario(user);
    return (
        tienePermiso(roles, 'ver_inventario') ||
        tienePermiso(roles, 'ver_panel_administrativo')
    );
};
const canSeeAllDonaciones = (user) => {
    if (!user) return false;
    if (canSeeAllSolicitudes(user) || user.role === 'admin') return true;
    const roles = rolesDeUsuario(user);
    return (
        tienePermiso(roles, 'ver_solicitudes_donacion') ||
        tienePermiso(roles, 'administrar_solicitudes_donaciones')
    );
};
const canSeeAllVisitas = (user) => {
    if (!user) return false;
    if (canSeeAllSolicitudes(user) || user.role === 'admin') return true;
    const roles = rolesDeUsuario(user);
    return (
        tienePermiso(roles, 'administrar_solicitudes_visitantes') ||
        tienePermiso(roles, 'ver_solicitudes_visitantes')
    );
};
const canSeeAdminVentas = (user) => {
    if (!user) return false;
    const roles = rolesDeUsuario(user);
    return (
        tienePermiso(roles, 'ver_ventas') ||
        tienePermiso(roles, 'ver_historial_compras_clientes')
    );
};
const canSeeVentasNotificaciones = (user) => {
    if (!user) return false;
    const roles = rolesDeUsuario(user);
    return canSeeAdminVentas(user) || tienePermiso(roles, 'ver_historial_compras_propio');
};
const canSeeSolicitudesPropiasNotif = (user) => {
    if (!user) return false;
    const roles = rolesDeUsuario(user);
    return (
        tienePermiso(roles, 'ver_solicitudes_propias') ||
        tienePermiso(roles, 'hacer_solicitud_donacion') ||
        tienePermiso(roles, 'ingresar_solicitud_voluntariado') ||
        tienePermiso(roles, 'crear_solicitud_visitante')
    );
};
const isSolicitudPendiente = (solicitud) =>
    String(solicitud?.estado || '').trim().toLowerCase() === 'pendiente';

function getCachedNavbarLogos() {
    const home = readPageCache('home');
    return {
        logoUrl: typeof home?.navbar?.logoUrl === 'string' ? home.navbar.logoUrl.trim() : '',
        logoClaroUrl: typeof home?.navbar?.logoClaroUrl === 'string' ? home.navbar.logoClaroUrl.trim() : '',
    };
}

function getCachedFooterSocial() {
    const home = readPageCache('home');
    const footer = home?.footer;
    return {
        facebookUrl: typeof footer?.facebookUrl === 'string' ? footer.facebookUrl.trim() : '',
        instagramUrl: typeof footer?.instagramUrl === 'string' ? footer.instagramUrl.trim() : '',
    };
}

function getCachedNavbarLinks() {
    const home = readPageCache('home');
    if (Array.isArray(home?.enlacesNavbar) && home.enlacesNavbar.length > 0) {
        return filterNavLinks(home.enlacesNavbar);
    }

    const adminMain = readPageCache('admin-main');
    if (Array.isArray(adminMain?.enlacesNavbar) && adminMain.enlacesNavbar.length > 0) {
        return filterNavLinks(adminMain.enlacesNavbar);
    }

    return [];
}

const ENLACE_EQUIPO = { id: 'equipo', etiqueta: 'Equipo', ruta: EQUIPO_PATH };

const esEnlaceEquipo = (enlace) =>
    normalizePathname(String(enlace?.ruta ?? enlace?.Ruta ?? '')) === EQUIPO_PATH;

/** Equipo va dentro del submenú de Sobre nosotros; solo queda suelto si no hay ese enlace. */
function conEnlaceEquipo(enlaces) {
    if (!enlaces.length) return enlaces;
    if (enlaces.some(isAboutNavLink)) return enlaces.filter((enlace) => !esEnlaceEquipo(enlace));
    if (enlaces.some(esEnlaceEquipo)) return enlaces;
    return [...enlaces, ENLACE_EQUIPO];
}

function filterNavLinks(enlaces) {
    return conEnlaceEquipo(enlaces.filter((enlace) => {
        const ruta = String(enlace?.ruta ?? enlace?.Ruta ?? '').trim();
        return ruta !== '/' && ruta !== '';
    }));
}


const Navbar = () => {
    const { idioma } = useIdioma();
    const labelHistoria = useTraducir('Historia');
    const labelGaleria = useTraducir('Galería');
    const labelEquipo = useTraducir('Equipo');
    const labelNotificaciones = useTraducir('Notificaciones');
    const labelStockBajo = useTraducir('STOCK BAJO');
    const labelReponer = useTraducir('Reponer stock');
    const labelAgotado = useTraducir('Agotado');
    const labelBajoMinimo = useTraducir('Bajo mínimo');
    const labelRedes = useTraducir('Redes sociales');
    const labelSobreNosotros = useTraducir('Sobre nosotros');
    const labelFormularios = useTraducir('Formularios');
    const labelVoluntariado = useTraducir('Voluntariado');
    const labelVisitas = useTraducir('Visitas');
    const labelDonaciones = useTraducir('Donaciones');
    const labelProductores = useTraducir('Productores');
    const labelVentasNotif = useTraducir('Ventas');
    const labelMisComprasNotif = useTraducir('Mis compras');
    const labelVentaAceptar = useTraducir('Pendiente de aceptar');
    const labelVentaEntregar = useTraducir('Pendiente de entregar');
    const labelCompraPendiente = useTraducir('Tu compra está pendiente');
    const labelCompraAceptada = useTraducir('Tu compra fue aceptada');
    const labelVerMisSolicitudes = useTraducir('Ver mis solicitudes');
    const labelVerMisCompras = useTraducir('Ver mis compras');
    const tCartResumen = useTraducir('Resumen del carrito');
    const tCartVacio = useTraducir('Tu carrito está vacío');
    const tCartVacioLead = useTraducir('Todavía no hay cafés por aquí. Explorá el catálogo y agregá el que más te guste.');
    const tVerCatalogo = useTraducir('Ver catálogo');
    const tVaciar = useTraducir('Vaciar carrito');
    const tIrPagar = useTraducir('Ir a pagar');
    const tSubtotal = useTraducir('Subtotal:');
    const tIva = useTraducir('IVA:');
    const tTotal = useTraducir('Total:');
    const tCerrarCart = useTraducir('Cerrar carrito');
    const tIvaIncluido = useTraducir('IVA incluido');
    const tIniciarSesion = useTraducir('Iniciar sesión');
    const tMiCuenta = useTraducir('Mi cuenta');
    const tCerrarSesion = useTraducir('Cerrar sesión');
    const tCerrarMenu = useTraducir('Cerrar menú');
    const tCargandoNotif = useTraducir('Cargando notificaciones...');
    const tNoHayNotif = useTraducir('No hay notificaciones pendientes.');
    const tEliminarProducto = useTraducir('Eliminar producto');
    const tMiPerfil = useTraducir('Mi perfil');
    const tPanelAdmin = useTraducir('Panel administrativo');
    const labelAbrirAdminNotif = useTraducir('Abrir en administración');
    const navigate = useNavigate();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showCartDropdown, setShowCartDropdown] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showAboutMenu, setShowAboutMenu] = useState(false);
    const [showFormsMenu, setShowFormsMenu] = useState(false);
    const [showMobileAbout, setShowMobileAbout] = useState(true);
    const [showMobileForms, setShowMobileForms] = useState(true);
    const [isCartClosing, setIsCartClosing] = useState(false);
    const [user, setUser] = useState(null);
    const [cartItems, setCartItems] = useState([]);
    const [solicitudes, setSolicitudes] = useState([]);
    const [solicitudesDonacion, setSolicitudesDonacion] = useState([]);
    const [solicitudesVisita, setSolicitudesVisita] = useState([]);
    const [alertasStock, setAlertasStock] = useState([]);
    const [ventasNotificaciones, setVentasNotificaciones] = useState([]);
    const [propuestasNotificaciones, setPropuestasNotificaciones] = useState([]);
    const [notificationsLoading, setNotificationsLoading] = useState(false);
    const [notificationsError, setNotificationsError] = useState('');
    const [enlacesNavbar, setEnlacesNavbar] = useState(() => getCachedNavbarLinks());
    const cachedLogos = getCachedNavbarLogos();
    const cachedSocial = getCachedFooterSocial();
    const [logoUrl, setLogoUrl] = useState(cachedLogos.logoUrl);
    const [logoClaroUrl, setLogoClaroUrl] = useState(cachedLogos.logoClaroUrl);
    const [facebookUrl, setFacebookUrl] = useState(cachedSocial.facebookUrl);
    const [instagramUrl, setInstagramUrl] = useState(cachedSocial.instagramUrl);
    const cartContainerRef = useRef(null);
    const notificationsRef = useRef(null);
    const userMenuRef = useRef(null);
    const aboutMenuRef = useRef(null);
    const formsMenuRef = useRef(null);
    const cartCloseTimerRef = useRef(null);
    const navMenuHoverTimerRef = useRef(null);
    const navbarRef = useRef(null);
    const pathname = useRouterState({
        select: (state) => state.location.pathname,
    });

    useBodyScrollLock(isMobileMenuOpen);

    useEffect(() => {
        let activo = true;

        Promise.all([
            obtenerEnlaces('Navbar').catch(() => []),
            obtenerNavbar().catch(() => null),
            obtenerFooter().catch(() => null),
        ])
            .then(([enlaces, navbar, footer]) => {
                if (!activo) return;
                setEnlacesNavbar(filterNavLinks(Array.isArray(enlaces) ? enlaces : []));
                setLogoUrl(typeof navbar?.logoUrl === 'string' ? navbar.logoUrl.trim() : '');
                setLogoClaroUrl(typeof navbar?.logoClaroUrl === 'string' ? navbar.logoClaroUrl.trim() : '');
                setFacebookUrl(typeof footer?.facebookUrl === 'string' ? footer.facebookUrl.trim() : '');
                setInstagramUrl(typeof footer?.instagramUrl === 'string' ? footer.instagramUrl.trim() : '');
            })
            .catch((err) => {
                console.error('No se pudo cargar la información del navbar.', err);
            });

        return () => {
            activo = false;
        };
    }, [idioma]);

    useEffect(() => {
        const syncNavbarState = () => {
            const storedUser = getActiveSessionUser();
            const storedCart = getStoredCart();
            setUser(storedUser);
            setCartItems(Array.isArray(storedCart) ? storedCart : []);
            if (!storedUser) {
                setSolicitudes([]);
                setSolicitudesDonacion([]);
                setSolicitudesVisita([]);
                setAlertasStock([]);
                setVentasNotificaciones([]);
                setPropuestasNotificaciones([]);
                setShowNotifications(false);
            }
        };
        syncNavbarState();
        window.addEventListener('storage', syncNavbarState);
        window.addEventListener('cart-updated', syncNavbarState);
        return () => {
            window.removeEventListener('storage', syncNavbarState);
            window.removeEventListener('cart-updated', syncNavbarState);
        };
    }, []);

    const loadSolicitudesUsuario = useCallback(async (currentUser = user) => {
        if (!currentUser) {
            setSolicitudes([]);
            setSolicitudesDonacion([]);
            setSolicitudesVisita([]);
            setAlertasStock([]);
            setVentasNotificaciones([]);
            setPropuestasNotificaciones([]);
            return;
        }

        setNotificationsLoading(true);
        setNotificationsError('');
        try {
            const userId = currentUser?.id || currentUser?.email || currentUser?.username;
            const esStaffSolicitudes = canSeeAllSolicitudes(currentUser);
            const esStaffDonaciones = canSeeAllDonaciones(currentUser);
            const esStaffVisitas = canSeeAllVisitas(currentUser);
            const verPropias = canSeeSolicitudesPropiasNotif(currentUser);

            let voluntariado = [];
            let donaciones = [];
            let visitas = [];

            if (esStaffSolicitudes || esStaffDonaciones || esStaffVisitas) {
                const [volData, donData, visData] = await Promise.all([
                    esStaffSolicitudes
                        ? obtenerSolicitudes().catch(() => [])
                        : verPropias
                          ? obtenerSolicitudesDeUsuario(String(userId)).catch(() => [])
                          : Promise.resolve([]),
                    esStaffDonaciones
                        ? obtenerSolicitudesDonacionAdmin().catch(() => [])
                        : verPropias
                          ? obtenerMisSolicitudesDonacion().catch(() => [])
                          : Promise.resolve([]),
                    esStaffVisitas
                        ? obtenerSolicitudesVisitas({ estado: 'Pendiente' }).catch(() => [])
                        : verPropias
                          ? obtenerSolicitudesVisitaDeUsuario(String(userId)).catch(() => [])
                          : Promise.resolve([]),
                ]);
                voluntariado = Array.isArray(volData) ? volData : [];
                donaciones = Array.isArray(donData) ? donData : [];
                visitas = Array.isArray(visData) ? visData : [];
            } else if (verPropias) {
                // Cliente / usuario: unificado por JWT (compras aparte).
                const propias = await obtenerMisSolicitudes({ estado: 'pendiente' }).catch(() => null);
                const items = Array.isArray(propias?.data) ? propias.data : [];
                voluntariado = items.filter((item) => item.tipo === 'voluntariado');
                donaciones = items.filter((item) => item.tipo === 'donacion');
                visitas = items.filter((item) => item.tipo === 'visita');
            }

            let alertas = [];
            if (canSeeStockAlerts(currentUser)) {
                try {
                    alertas = await obtenerAlertasStock();
                } catch (stockErr) {
                    console.error('No se pudieron cargar las alertas de stock.', stockErr);
                    alertas = [];
                }
            }

            const ventas = canSeeVentasNotificaciones(currentUser)
                ? await obtenerVentasParaNotificaciones({
                    admin: canSeeAdminVentas(currentUser),
                }).catch(() => [])
                : [];

            setSolicitudes(voluntariado);
            setSolicitudesDonacion(donaciones);
            setSolicitudesVisita(visitas);
            setAlertasStock(Array.isArray(alertas) ? alertas : []);
            setVentasNotificaciones(Array.isArray(ventas) ? ventas : []);
            const propuestas = await obtenerNotificacionesPropias().catch(() => ({ data: [] }));
            setPropuestasNotificaciones(Array.isArray(propuestas?.data) ? propuestas.data : []);
        } catch (err) {
            console.error('No se pudieron cargar las notificaciones.', err);
            setNotificationsError('No se pudieron cargar las notificaciones.');
        } finally {
            setNotificationsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (!user) return;
        const initialLoadId = window.setTimeout(() => {
            loadSolicitudesUsuario(user);
        }, 0);

        const syncSolicitudes = () => loadSolicitudesUsuario(user);
        window.addEventListener('voluntariado-updated', syncSolicitudes);
        window.addEventListener('donaciones-updated', syncSolicitudes);
        window.addEventListener('compras-updated', syncSolicitudes);
        window.addEventListener('visitas-updated', syncSolicitudes);
        window.addEventListener('propuestas-updated', syncSolicitudes);
        return () => {
            window.clearTimeout(initialLoadId);
            window.removeEventListener('voluntariado-updated', syncSolicitudes);
            window.removeEventListener('donaciones-updated', syncSolicitudes);
            window.removeEventListener('compras-updated', syncSolicitudes);
            window.removeEventListener('visitas-updated', syncSolicitudes);
            window.removeEventListener('propuestas-updated', syncSolicitudes);
        };
    }, [user, loadSolicitudesUsuario]);

    const isMobileMenuOpenRef = useRef(false);
    isMobileMenuOpenRef.current = isMobileMenuOpen;

    const syncScrolledState = useCallback(() => {
        if (isMobileMenuOpenRef.current) return;
        let scrollY = window.scrollY || window.pageYOffset || 0;
        if (document.documentElement.classList.contains("scroll-locked")) {
            const top = document.body.style.top || "";
            const lockedY = Math.abs(Number.parseInt(top, 10) || 0);
            scrollY = lockedY || scrollY;
        }
        setIsScrolled(scrollY > 10);
        if (scrollY > 10) {
            setShowAboutMenu(false);
            setShowFormsMenu(false);
        }
    }, []);

    useEffect(() => {
        const rafId = window.requestAnimationFrame(syncScrolledState);
        window.addEventListener('scroll', syncScrolledState, { passive: true });
        return () => {
            window.cancelAnimationFrame(rafId);
            window.removeEventListener('scroll', syncScrolledState);
        };
    }, [syncScrolledState]);

    useEffect(() => {
        const rafId = window.requestAnimationFrame(syncScrolledState);
        const timeoutId = window.setTimeout(syncScrolledState, 80);

        return () => {
            window.cancelAnimationFrame(rafId);
            window.clearTimeout(timeoutId);
        };
    }, [pathname, syncScrolledState]);

    useEffect(() => {
        setIsMobileMenuOpen(false);
        setShowAboutMenu(false);
        setShowFormsMenu(false);
    }, [pathname]);

    useEffect(() => {
        if (!showAboutMenu && !showFormsMenu) return undefined;
        const onPointerDown = (event) => {
            if (showAboutMenu && aboutMenuRef.current && !aboutMenuRef.current.contains(event.target)) {
                setShowAboutMenu(false);
            }
            if (showFormsMenu && formsMenuRef.current && !formsMenuRef.current.contains(event.target)) {
                setShowFormsMenu(false);
            }
        };
        const onEscape = (event) => {
            if (event.key === 'Escape') {
                setShowAboutMenu(false);
                setShowFormsMenu(false);
            }
        };
        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onEscape);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onEscape);
        };
    }, [showAboutMenu, showFormsMenu]);

    useEffect(() => {
        if (!isMobileMenuOpen) {
            return;
        }

        const handleEscapeKey = (event) => {
            if (event.key === 'Escape') {
                setIsMobileMenuOpen(false);
            }
        };

        document.addEventListener('keydown', handleEscapeKey);
        return () => document.removeEventListener('keydown', handleEscapeKey);
    }, [isMobileMenuOpen]);

    useEffect(() => () => {
        if (cartCloseTimerRef.current) {
            window.clearTimeout(cartCloseTimerRef.current);
        }
        if (navMenuHoverTimerRef.current) {
            window.clearTimeout(navMenuHoverTimerRef.current);
        }
    }, []);

    useEffect(() => {
        const updateNavbarHeight = () => {
            const currentHeight = navbarRef.current?.offsetHeight;
            if (!currentHeight) return;
            document.documentElement.style.setProperty('--navbar-height', `${currentHeight}px`);
        };

        updateNavbarHeight();
        window.addEventListener('resize', updateNavbarHeight);
        const resizeObserver =
            typeof ResizeObserver !== 'undefined' && navbarRef.current
                ? new ResizeObserver(() => updateNavbarHeight())
                : null;

        if (resizeObserver && navbarRef.current) {
            resizeObserver.observe(navbarRef.current);
        }

        return () => {
            window.removeEventListener('resize', updateNavbarHeight);
            resizeObserver?.disconnect();
        };
    }, [pathname, isScrolled, cartItems, showCartDropdown, showDropdown, isMobileMenuOpen]);

    const closeCartPanel = useCallback(() => {
        if (!showCartDropdown || isCartClosing) {
            return;
        }

        setIsCartClosing(true);
        cartCloseTimerRef.current = window.setTimeout(() => {
            setShowCartDropdown(false);
            setIsCartClosing(false);
        }, 240);
    }, [showCartDropdown, isCartClosing]);

    useEffect(() => {
        if (!showCartDropdown) {
            return undefined;
        }

        const html = document.documentElement;
        const body = document.body;
        const navbar = navbarRef.current;
        const scrollbarWidth = Math.max(0, window.innerWidth - html.clientWidth);
        const previousHtmlOverflow = html.style.overflow;
        const previousBodyOverflow = body.style.overflow;
        const previousBodyPaddingRight = body.style.paddingRight;
        const previousNavbarRight = navbar?.style.right ?? "";

        html.style.overflow = "hidden";
        body.style.overflow = "hidden";
        if (scrollbarWidth > 0) {
            body.style.paddingRight = `${scrollbarWidth}px`;
            if (navbar) {
                navbar.style.right = `${scrollbarWidth}px`;
            }
        }

        return () => {
            html.style.overflow = previousHtmlOverflow;
            body.style.overflow = previousBodyOverflow;
            body.style.paddingRight = previousBodyPaddingRight;
            if (navbar) {
                navbar.style.right = previousNavbarRight;
            }
        };
    }, [showCartDropdown]);

    useEffect(() => {
        if (!showCartDropdown) {
            return;
        }

        const handlePointerDown = (event) => {
            if (cartContainerRef.current && !cartContainerRef.current.contains(event.target)) {
                closeCartPanel();
            }
        };

        const handleEscapeKey = (event) => {
            if (event.key === 'Escape') {
                closeCartPanel();
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleEscapeKey);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [showCartDropdown, closeCartPanel]);

    useEffect(() => {
        if (!showNotifications) {
            return;
        }

        const handlePointerDown = (event) => {
            if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };

        const handleEscapeKey = (event) => {
            if (event.key === 'Escape') {
                setShowNotifications(false);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleEscapeKey);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [showNotifications]);

    useEffect(() => {
        if (!showDropdown) {
            return;
        }

        const handlePointerDown = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        const handleEscapeKey = (event) => {
            if (event.key === 'Escape') {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleEscapeKey);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [showDropdown]);

    const cartUnits = cartItems.reduce((acc, item) => acc + (Number(item.units) || 0), 0);
    const cartSubtotal = cartItems.reduce((acc, item) => acc + (getUnitPriceWithoutIva(item) * getQuantity(item)), 0);
    const cartIva = cartItems.reduce((acc, item) => acc + ((getUnitPriceWithIva(item) - getUnitPriceWithoutIva(item)) * getQuantity(item)), 0);
    const cartTotal = cartItems.reduce((acc, item) => acc + (getUnitPriceWithIva(item) * getQuantity(item)), 0);
    const userDisplayName = user?.username?.includes('@') ? user?.name : user?.username || user?.name;
    const solicitudesPendientes = solicitudes.filter(isSolicitudPendiente);
    const solicitudesPendientesCount = solicitudesPendientes.length;
    const donacionesPendientes = solicitudesDonacion.filter(isSolicitudPendiente);
    const donacionesPendientesCount = donacionesPendientes.length;
    const visitasPendientes = solicitudesVisita.filter(isSolicitudPendiente);
    const visitasPendientesCount = visitasPendientes.length;
    const alertasStockCount = alertasStock.length;
    const ventasNotificacionesCount = ventasNotificaciones.length;
    const propuestasNotificacionesCount = propuestasNotificaciones.length;
    const notificationsCount =
        solicitudesPendientesCount +
        donacionesPendientesCount +
        visitasPendientesCount +
        alertasStockCount +
        ventasNotificacionesCount +
        propuestasNotificacionesCount;
    const puedeAbrirVentasAdmin = canSeeAdminVentas(user);
    const puedeAbrirSolicitudesAdmin = canSeeAllSolicitudes(user);
    const puedeAbrirDonacionesAdmin = canSeeAllDonaciones(user);
    const puedeAbrirVisitasAdmin = canSeeAllVisitas(user);
    const showStockAlerts = canSeeStockAlerts(user);
    const labelSeccionCompras = puedeAbrirVentasAdmin ? labelVentasNotif : labelMisComprasNotif;

    const persistCart = (updatedCart) => {
        setCartItems(updatedCart);
        saveCart(updatedCart);
    };

    const removeOneUnit = (productId) => {
        const updatedCart = cartItems
            .map((item) => (
                item.id === productId
                    ? { ...item, units: Math.max((item.units || 1) - 1, 0) }
                    : item
            ))
            .filter((item) => (item.units || 0) > 0);

        persistCart(updatedCart);
    };

    const addOneUnit = (productId) => {
        const targetItem = cartItems.find((item) => item.id === productId);
        if (!targetItem) {
            return;
        }

        const stockDisponible = getAvailableStock(targetItem);
        const unidadesActuales = getQuantity(targetItem);

        if (stockDisponible <= 0 || targetItem.estado === 'Agotado') {
            window.alert('Este producto est\u00e1 agotado.');
            return;
        }

        if (unidadesActuales >= stockDisponible) {
            window.alert('No hay m\u00e1s unidades disponibles de este producto.');
            return;
        }

        const updatedCart = cartItems.map((item) => (
            item.id === productId
                ? { ...item, units: unidadesActuales + 1 }
                : item
        ));

        persistCart(updatedCart);
    };

    const removeLineItem = (productId) => {
        const updatedCart = cartItems.filter((item) => item.id !== productId);
        persistCart(updatedCart);
    };

    const clearCartItems = () => {
        setCartItems([]);
        emptyCart();
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    const clearNavMenuHoverTimer = useCallback(() => {
        if (navMenuHoverTimerRef.current) {
            window.clearTimeout(navMenuHoverTimerRef.current);
            navMenuHoverTimerRef.current = null;
        }
    }, []);

    const openDesktopNavMenu = useCallback((menu) => {
        clearNavMenuHoverTimer();
        if (menu === 'about') {
            setShowAboutMenu(true);
            setShowFormsMenu(false);
        } else {
            setShowFormsMenu(true);
            setShowAboutMenu(false);
        }
        setShowDropdown(false);
        setShowCartDropdown(false);
        setShowNotifications(false);
    }, [clearNavMenuHoverTimer]);

    const closeDesktopNavMenu = useCallback((menu) => {
        if (menu === 'about') setShowAboutMenu(false);
        else setShowFormsMenu(false);
    }, []);

    const handleDesktopNavMenuEnter = useCallback((menu) => {
        openDesktopNavMenu(menu);
    }, [openDesktopNavMenu]);

    const handleDesktopNavMenuLeave = useCallback((menu) => {
        clearNavMenuHoverTimer();
        navMenuHoverTimerRef.current = window.setTimeout(() => {
            closeDesktopNavMenu(menu);
        }, 140);
    }, [clearNavMenuHoverTimer, closeDesktopNavMenu]);

    const handleDesktopNavMenuClick = useCallback((menu) => {
        clearNavMenuHoverTimer();
        if (menu === 'about') {
            setShowAboutMenu((prev) => !prev);
            setShowFormsMenu(false);
        }
        if (menu === 'forms') {
            setShowFormsMenu((prev) => !prev);
            setShowAboutMenu(false);
        }
    }, [clearNavMenuHoverTimer]);

    const onBrandClick = useHomeBrandNavigation();

    const handleBrandClick = (event) => {
        closeMobileMenu();
        onBrandClick(event);
    };

    const handleMobileMenuToggle = () => {
        const nextState = !isMobileMenuOpen;
        setIsMobileMenuOpen(nextState);
        if (nextState) {
            setShowDropdown(false);
            setShowCartDropdown(false);
            setShowNotifications(false);
        }
    };

    const handleIconClick = () => {
        if (user) {
            setShowDropdown(!showDropdown);
            setShowCartDropdown(false);
            setShowNotifications(false);
            setIsMobileMenuOpen(false);
        } else {
            navigate({ to: '/login' });
        }
    };

    const handleNotificationsClick = (event) => {
        event?.stopPropagation?.();
        const nextState = !showNotifications;
        setShowNotifications(nextState);
        setShowDropdown(false);
        setShowCartDropdown(false);
        if (nextState) {
            loadSolicitudesUsuario(user);
        }
    };

    const handleNotificationOpen = (event) => {
        event?.stopPropagation?.();
        setShowNotifications(false);
        if (puedeAbrirSolicitudesAdmin) {
            navigate({ to: '/admin/voluntariado' });
            return;
        }
        navigate({ to: rutaMisSolicitudes(user) });
    };

    const handleDonacionNotificationOpen = (event) => {
        event?.stopPropagation?.();
        setShowNotifications(false);
        if (puedeAbrirDonacionesAdmin) {
            navigate({ to: '/admin/donaciones/solicitudes' });
            return;
        }
        navigate({ to: rutaMisSolicitudes(user) });
    };

    const handleVisitaNotificationOpen = (event) => {
        event?.stopPropagation?.();
        setShowNotifications(false);
        if (puedeAbrirVisitasAdmin) {
            navigate({ to: '/admin/visitas' });
            return;
        }
        navigate({ to: rutaMisSolicitudes(user) });
    };

    const handleVentaNotificationOpen = (event, venta) => {
        event?.stopPropagation?.();
        setShowNotifications(false);
        if (puedeAbrirVentasAdmin) {
            navigate({
                to: String(venta?.estado) === 'Pendiente' ? '/admin/ventas-pendientes' : '/admin/historial-ventas',
            });
            return;
        }
        navigate({ to: rutaMisCompras(user) });
    };

    const handlePropuestaNotificationOpen = async (item) => {
        setShowNotifications(false);
        try {
            await marcarNotificacionLeida(item.id);
        } catch {
            /* el contador se actualiza en el próximo refresco */
        }
        const enlace = String(item?.enlace || '');
        const id = enlace.split('/').filter(Boolean).pop();
        if (!id) return;
        if (enlace.startsWith('/admin/propuestas/')) {
            navigate({ to: '/admin/propuestas/$propuestaId', params: { propuestaId: id } });
            return;
        }
        navigate({ to: '/perfil/propuestas/$propuestaId', params: { propuestaId: id } });
    };

    const handleStockAlertOpen = (alerta) => {
        setShowNotifications(false);
        requestAdminStockProduct(alerta?.id ?? alerta, { nombre: alerta?.nombre });
        if (pathname !== '/admin/producto') {
            navigate({ to: '/admin/producto' });
        }
    };

    const handleCartClick = () => {
        if (showCartDropdown) {
            closeCartPanel();
            return;
        }

        if (cartCloseTimerRef.current) {
            window.clearTimeout(cartCloseTimerRef.current);
            cartCloseTimerRef.current = null;
        }

        setIsCartClosing(false);
        setShowCartDropdown(true);
        setShowDropdown(false);
        setShowNotifications(false);
    };

    const handleCheckoutClick = (event) => {
        event.preventDefault();
        setShowCartDropdown(false);
        sessionStorage.setItem('postLoginRedirect', '/checkout');
        if (puedeComprar(user)) {
            navigate({ to: '/checkout' });
            return;
        }
        marcarIntentRegistroCliente();
        navigate({ to: '/registro' });
    };

    const handleLogout = async () => {
        beginLogout();
        cancelPendingSessionRefresh();
        await soltarCarritoAlCerrarSesion();
        clearSession();
        setUser(null);
        setShowDropdown(false);
        window.location.replace('/');
    };

    const isTransparent = pathname === '/' && !isScrolled;
    const useSolidNavbar = isScrolled;
    const showLogoClaro = isTransparent && !useSolidNavbar;
    const brandLogoOscuroSrc = normalizeImageUrl(logoUrl, { width: 480 });
    const brandLogoClaroSrc = normalizeImageUrl(logoClaroUrl || logoUrl, { width: 480 });
    const navLinks = filterNavLinks(enlacesNavbar);
    const mobileMenuLogoSrc = normalizeImageUrl(logoUrl || logoClaroUrl, { width: 320 });
    const hasMobileSocial = Boolean(instagramUrl || facebookUrl);

    const brandMark = brandLogoOscuroSrc || brandLogoClaroSrc ? (
        <span className="navbar__brand-logos">
            {brandLogoOscuroSrc ? (
                <img
                    src={brandLogoOscuroSrc}
                    alt={"Caf\u00e9 UNA"}
                    className={`navbar__brand-logo navbar__brand-logo--dark${!showLogoClaro || !brandLogoClaroSrc ? ' is-visible' : ''}`}
                    width={240}
                    height={52}
                    decoding="async"
                />
            ) : null}
            {brandLogoClaroSrc ? (
                <img
                    src={brandLogoClaroSrc}
                    alt=""
                    aria-hidden="true"
                    className={`navbar__brand-logo navbar__brand-logo--light${showLogoClaro || !brandLogoOscuroSrc ? ' is-visible' : ''}`}
                    width={240}
                    height={52}
                    decoding="async"
                />
            ) : null}
        </span>
    ) : (
        <span className="navbar__brand-text">{"Caf\u00e9 UNA"}</span>
    );

    return (
        <nav
            ref={navbarRef}
            className={`navbar ${isTransparent && !useSolidNavbar ? 'navbar--transparent' : 'navbar--solid'}${isScrolled ? ' navbar--scrolled' : ''}${isMobileMenuOpen ? ' navbar--menu-open' : ''}`}
        >
            <div className="navbar__start">
                <Link to="/" className="navbar__brand" aria-label="Ir al inicio" onClick={handleBrandClick}>
                    {brandMark}
                </Link>
            </div>

            <div className="navbar__menu">
                {navLinks.map((enlace) => {
                    if (isAboutNavLink(enlace)) {
                        const pathNorm = normalizePathname(pathname);
                        const aboutActive =
                            pathNorm === normalizePathname(ABOUT_HISTORIA_PATH) ||
                            pathNorm === normalizePathname(ABOUT_GALERIA_PATH) ||
                            pathNorm === EQUIPO_PATH ||
                            pathNorm.startsWith('/aboutus');
                        return (
                            <div
                                key={enlace.id ?? enlace.ruta ?? 'about'}
                                className={`navbar__about ${aboutActive ? 'is-current' : ''} ${showAboutMenu ? 'is-open' : ''}`}
                                ref={aboutMenuRef}
                                onMouseEnter={() => handleDesktopNavMenuEnter('about')}
                                onMouseLeave={() => handleDesktopNavMenuLeave('about')}
                                onBlur={(event) => {
                                    if (!event.currentTarget.contains(event.relatedTarget)) {
                                        closeDesktopNavMenu('about');
                                    }
                                }}
                            >
                                <button
                                    type="button"
                                    className="navbar__about-trigger"
                                    aria-expanded={showAboutMenu}
                                    aria-haspopup="true"
                                    onClick={() => handleDesktopNavMenuClick('about')}
                                    onFocus={() => handleDesktopNavMenuEnter('about')}
                                >
                                    <span>{etiquetaEnlace(enlace, idioma) || labelSobreNosotros}</span>
                                    <ChevronDown size={16} strokeWidth={2.4} aria-hidden="true" />
                                </button>
                                <div
                                    className="navbar__about-menu"
                                    role="menu"
                                    aria-label={labelSobreNosotros}
                                    aria-hidden={!showAboutMenu}
                                >
                                    <Link
                                        to={ABOUT_HISTORIA_PATH}
                                        role="menuitem"
                                        className="navbar__about-item"
                                        activeOptions={{ exact: true }}
                                        activeProps={{ className: "navbar__about-item" }}
                                        onClick={() => setShowAboutMenu(false)}
                                    >
                                        {labelHistoria}
                                    </Link>
                                    <Link
                                        to={ABOUT_GALERIA_PATH}
                                        role="menuitem"
                                        className="navbar__about-item"
                                        activeProps={{ className: "navbar__about-item" }}
                                        onClick={() => setShowAboutMenu(false)}
                                    >
                                        {labelGaleria}
                                    </Link>
                                    <Link
                                        to={EQUIPO_PATH}
                                        role="menuitem"
                                        className="navbar__about-item"
                                        activeProps={{ className: "navbar__about-item" }}
                                        onClick={() => setShowAboutMenu(false)}
                                    >
                                        {labelEquipo}
                                    </Link>
                                </div>
                            </div>
                        );
                    }

                    if (isFormsNavLink(enlace)) {
                        const pathNorm = normalizePathname(pathname);
                        const formsActive =
                            pathNorm.startsWith('/voluntariado')
                            || pathNorm.startsWith('/visitas')
                            || pathNorm.startsWith('/donaciones');
                        return (
                            <div
                                key={enlace.id ?? enlace.ruta ?? 'forms'}
                                className={`navbar__about ${formsActive ? 'is-current' : ''} ${showFormsMenu ? 'is-open' : ''}`}
                                ref={formsMenuRef}
                                onMouseEnter={() => handleDesktopNavMenuEnter('forms')}
                                onMouseLeave={() => handleDesktopNavMenuLeave('forms')}
                                onBlur={(event) => {
                                    if (!event.currentTarget.contains(event.relatedTarget)) {
                                        closeDesktopNavMenu('forms');
                                    }
                                }}
                            >
                                <button
                                    type="button"
                                    className="navbar__about-trigger"
                                    aria-expanded={showFormsMenu}
                                    aria-haspopup="true"
                                    onClick={() => handleDesktopNavMenuClick('forms')}
                                    onFocus={() => handleDesktopNavMenuEnter('forms')}
                                >
                                    <span>{labelFormularios}</span>
                                    <ChevronDown size={16} strokeWidth={2.4} aria-hidden="true" />
                                </button>
                                <div
                                    className="navbar__about-menu"
                                    role="menu"
                                    aria-label={labelFormularios}
                                    aria-hidden={!showFormsMenu}
                                >
                                    <Link
                                        to="/voluntariado/solicitar"
                                        role="menuitem"
                                        className="navbar__about-item"
                                        activeProps={{ className: "navbar__about-item" }}
                                        onClick={() => setShowFormsMenu(false)}
                                    >
                                        {labelVoluntariado}
                                    </Link>
                                    <Link
                                        to="/visitas/solicitar"
                                        role="menuitem"
                                        className="navbar__about-item"
                                        activeProps={{ className: "navbar__about-item" }}
                                        onClick={() => setShowFormsMenu(false)}
                                    >
                                        {labelVisitas}
                                    </Link>
                                    <Link
                                        to="/donaciones/solicitar"
                                        role="menuitem"
                                        className="navbar__about-item"
                                        activeProps={{ className: "navbar__about-item" }}
                                        onClick={() => setShowFormsMenu(false)}
                                    >
                                        {labelDonaciones}
                                    </Link>
                                    <Link
                                        to="/productores"
                                        role="menuitem"
                                        className="navbar__about-item"
                                        activeProps={{ className: "navbar__about-item" }}
                                        onClick={() => setShowFormsMenu(false)}
                                    >
                                        {labelProductores}
                                    </Link>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <SiteNavLink
                            key={enlace.id ?? enlace.ruta}
                            enlace={enlace}
                            activeProps={{ style: { fontWeight: '600' } }}
                        />
                    );
                })}
            </div>

            <div className="navbar__actions">
                <LanguageSwitcher compact className="navbar__lang" />
                <div className="navbar__cart" ref={cartContainerRef} onClick={handleCartClick}>
                    <button
                        type="button"
                        className="navbar__icon-button navbar__cart-button"
                        aria-label="Ver carrito de compras"
                        title="Carrito"
                    >
                        <ShoppingCart size={24} strokeWidth={2} aria-hidden="true" />
                    </button>
                    <span className="cart-badge">{cartUnits}</span>
                    {showCartDropdown ? (
                        <aside
                            className={`dropdown dropdown--cart dropdown--cart-panel ${isCartClosing ? 'is-closing' : 'is-open'}`}
                            role="dialog"
                            aria-modal="true"
                            aria-label={tCartResumen}
                            onClick={(event) => event.stopPropagation()}
                        >
                            <header className="cart-drawer-header">
                                <button
                                    type="button"
                                    className="cart-drawer__close-btn"
                                    aria-label={tCerrarCart}
                                    title={tCerrarCart}
                                    onClick={(e) => { e.stopPropagation(); closeCartPanel(); }}
                                >
                                    <X size={20} strokeWidth={2.4} aria-hidden="true" />
                                </button>
                                <h2>{tCartResumen}</h2>
                            </header>
                            {cartItems.length === 0 ? (
                                <div className="cart-empty">
                                    <span className="cart-empty__icon" aria-hidden="true">
                                        <ShoppingBag size={28} strokeWidth={1.8} />
                                    </span>
                                    <h3>{tCartVacio}</h3>
                                    <p>{tCartVacioLead}</p>
                                    <Link
                                        to="/productos"
                                        className="cart-empty__cta"
                                        onClick={() => closeCartPanel()}
                                    >
                                        {tVerCatalogo}
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    <section className="cart-items" aria-label={tCartResumen}>
                                        {cartItems.map((item) => {
                                            const nombre = item.nombre || item.name || 'producto';
                                            return (
                                            <CartLine
                                                key={item.id}
                                                nombre={<NombreCarrito nombre={item.nombre || item.name} />}
                                                meta={metaCarrito(item)}
                                                precio={formatCRC(getUnitPriceWithIva(item))}
                                                imagen={item.imagen}
                                                unidades={item.units}
                                                onRemove={() => removeLineItem(item.id)}
                                                onDecrease={() => removeOneUnit(item.id)}
                                                onIncrease={() => addOneUnit(item.id)}
                                                increaseDisabled={getAvailableStock(item) <= getQuantity(item) || item.estado === 'Agotado'}
                                                removeLabel={`${tEliminarProducto}: ${nombre}`}
                                                ivaLabel={tIvaIncluido}
                                                decreaseLabel={`Quitar una unidad de ${item.name || nombre}`}
                                                increaseLabel={`Agregar una unidad de ${item.name || nombre}`}
                                            />
                                            );
                                        })}
                                    </section>
                                    <footer className="cart-subtotal" aria-label={tCartResumen}>
                                        <div className="cart-subtotal-row">
                                            <span>{tSubtotal}</span>
                                            <strong>{formatCRC(cartSubtotal)}</strong>
                                        </div>
                                        <div className="cart-subtotal-row">
                                            <span>{tIva}</span>
                                            <strong>{formatCRC(cartIva)}</strong>
                                        </div>
                                        <div className="cart-total-row">
                                            <strong>{tTotal}</strong>
                                            <strong>{formatCRC(cartTotal)}</strong>
                                        </div>
                                    </footer>
                                    <div className="cart-actions-row">
                                        <Link to="/checkout" className="cart-go-checkout" onClick={handleCheckoutClick}>
                                            {tIrPagar}
                                        </Link>
                                        <button
                                            type="button"
                                            className="cart-clear-button"
                                            onClick={clearCartItems}
                                        >
                                            {tVaciar}
                                        </button>
                                    </div>
                                </>
                            )}
                        </aside>
                    ) : null}
                </div>

                {user ? (
                    <div
                        className="navbar__notifications"
                        ref={notificationsRef}
                        onClick={handleNotificationsClick}
                    >
                        <button
                            type="button"
                            className="navbar__icon-button navbar__notifications-button"
                            aria-label={labelNotificaciones}
                            title={labelNotificaciones}
                        >
                            <Bell size={25} strokeWidth={2.2} aria-hidden="true" />
                        </button>
                        {notificationsCount > 0 ? (
                            <span className="notifications-badge">{notificationsCount}</span>
                        ) : null}
                        <aside
                            className={`dropdown dropdown--notifications${showNotifications ? ' is-open' : ''}`}
                            aria-label={labelNotificaciones}
                            aria-hidden={!showNotifications}
                        >
                                <header className="notifications-header">
                                    <h2>{labelNotificaciones}</h2>
                                    <span>{notificationsCount}</span>
                                </header>

                                {notificationsLoading ? (
                                    <p className="dropdown__empty">{tCargandoNotif}</p>
                                ) : notificationsError ? (
                                    <p className="dropdown__empty">{notificationsError}</p>
                                ) : notificationsCount === 0 ? (
                                    <p className="dropdown__empty">{tNoHayNotif}</p>
                                ) : (
                                    <div className="notifications-list">
                                        {showStockAlerts && alertasStockCount > 0 ? (
                                            <section className="notifications-section" aria-label={labelStockBajo}>
                                                <p className="notifications-section-label">{labelStockBajo}</p>
                                                {alertasStock.map((alerta) => {
                                                    const lugares =
                                                        Array.isArray(alerta.ubicaciones) && alerta.ubicaciones.length > 0
                                                            ? alerta.ubicaciones
                                                                .map((ubi) => `${ubi.nombre}: ${ubi.stock}`)
                                                                .join(' · ')
                                                            : `Stock ${alerta.stockActual} (mín. ${alerta.stockMinimo})`;

                                                    return (
                                                        <button
                                                            key={`stock-${alerta.id}`}
                                                            type="button"
                                                            className={`notification-item ${alerta.agotado ? 'notification-item--agotado' : 'notification-item--bajo'}`}
                                                            onClick={() => handleStockAlertOpen(alerta)}
                                                            title="Abrir inventario del producto"
                                                        >
                                                            <span className="notification-item__icon" aria-hidden="true">
                                                                <Package size={16} />
                                                            </span>
                                                            <div className="notification-item__main">
                                                                <strong>
                                                                    <NombreCarrito nombre={alerta.nombre} />
                                                                </strong>
                                                                <span>
                                                                    {alerta.agotado ? labelAgotado : labelBajoMinimo}
                                                                    {' · '}
                                                                    {lugares}
                                                                </span>
                                                                <small className="notification-item__stock">
                                                                    {labelReponer}
                                                                </small>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </section>
                                        ) : null}

                                        {solicitudesPendientesCount > 0 ? (
                                            <section className="notifications-section" aria-label={labelVoluntariado}>
                                                <p className="notifications-section-label">{labelVoluntariado}</p>
                                                {solicitudesPendientes.map((solicitud) => {
                                                    const titulo =
                                                        solicitud.titulo ||
                                                        solicitud.tipoVoluntariado ||
                                                        solicitud.area ||
                                                        solicitud.tipoEtiqueta ||
                                                        'Voluntariado';
                                                    const key = solicitud.id || solicitud.identificador || titulo;
                                                    return (
                                                        <button
                                                            key={`vol-${key}`}
                                                            type="button"
                                                            className="notification-item notification-item--voluntariado"
                                                            onClick={handleNotificationOpen}
                                                            title={puedeAbrirSolicitudesAdmin ? labelAbrirAdminNotif : labelVerMisSolicitudes}
                                                        >
                                                            <span className="notification-item__icon" aria-hidden="true">
                                                                <HandHeart size={16} />
                                                            </span>
                                                            <div className="notification-item__main">
                                                                <strong>
                                                                    <NombreCarrito nombre={titulo} />
                                                                </strong>
                                                                <small>
                                                                    {puedeAbrirSolicitudesAdmin
                                                                        ? labelAbrirAdminNotif
                                                                        : labelVerMisSolicitudes}
                                                                </small>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </section>
                                        ) : null}

                                        {donacionesPendientesCount > 0 ? (
                                            <section className="notifications-section" aria-label={labelDonaciones}>
                                                <p className="notifications-section-label">{labelDonaciones}</p>
                                                {donacionesPendientes.map((solicitud) => {
                                                    const titulo =
                                                        solicitud.titulo ||
                                                        solicitud.necesidadTitulo ||
                                                        solicitud.tipo ||
                                                        solicitud.tipoEtiqueta ||
                                                        'Donación';
                                                    const key = solicitud.id || solicitud.identificador || titulo;
                                                    return (
                                                        <button
                                                            key={`donacion-${key}`}
                                                            type="button"
                                                            className="notification-item notification-item--donacion"
                                                            onClick={handleDonacionNotificationOpen}
                                                            title={puedeAbrirDonacionesAdmin ? labelAbrirAdminNotif : labelVerMisSolicitudes}
                                                        >
                                                            <span className="notification-item__icon" aria-hidden="true">
                                                                <Gift size={16} />
                                                            </span>
                                                            <div className="notification-item__main">
                                                                <strong>
                                                                    <NombreCarrito nombre={titulo} />
                                                                </strong>
                                                                <small>
                                                                    {puedeAbrirDonacionesAdmin
                                                                        ? labelAbrirAdminNotif
                                                                        : labelVerMisSolicitudes}
                                                                </small>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </section>
                                        ) : null}

                                        {visitasPendientesCount > 0 ? (
                                            <section className="notifications-section" aria-label={labelVisitas}>
                                                <p className="notifications-section-label">{labelVisitas}</p>
                                                {visitasPendientes.map((solicitud) => {
                                                    const titulo =
                                                        solicitud.titulo ||
                                                        solicitud.tipoGrupo ||
                                                        solicitud.tipoVisitante ||
                                                        solicitud.encargadoNombre ||
                                                        solicitud.tipoEtiqueta ||
                                                        'Visita grupal';
                                                    const key = solicitud.id || solicitud.identificador || titulo;
                                                    return (
                                                        <button
                                                            key={`visita-${key}`}
                                                            type="button"
                                                            className="notification-item notification-item--visita"
                                                            onClick={handleVisitaNotificationOpen}
                                                            title={puedeAbrirVisitasAdmin ? labelAbrirAdminNotif : labelVerMisSolicitudes}
                                                        >
                                                            <span className="notification-item__icon" aria-hidden="true">
                                                                <MapPin size={16} />
                                                            </span>
                                                            <div className="notification-item__main">
                                                                <strong>
                                                                    <NombreCarrito nombre={titulo} />
                                                                </strong>
                                                                <small>
                                                                    {puedeAbrirVisitasAdmin
                                                                        ? labelAbrirAdminNotif
                                                                        : labelVerMisSolicitudes}
                                                                </small>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </section>
                                        ) : null}

                                        {ventasNotificacionesCount > 0 ? (
                                            <section className="notifications-section" aria-label={labelSeccionCompras}>
                                                <p className="notifications-section-label">{labelSeccionCompras}</p>
                                                {ventasNotificaciones.map((venta) => {
                                                    const pendienteAceptar = String(venta.estado) === 'Pendiente';
                                                    const detalle = puedeAbrirVentasAdmin
                                                        ? (pendienteAceptar ? labelVentaAceptar : labelVentaEntregar)
                                                        : (pendienteAceptar ? labelCompraPendiente : labelCompraAceptada);
                                                    return (
                                                        <button
                                                            key={`venta-${venta.id}`}
                                                            type="button"
                                                            className="notification-item notification-item--venta"
                                                            onClick={(event) => handleVentaNotificationOpen(event, venta)}
                                                            title={detalle}
                                                        >
                                                            <span className="notification-item__icon" aria-hidden="true">
                                                                <ShoppingBag size={16} />
                                                            </span>
                                                            <div className="notification-item__main">
                                                                <strong>
                                                                    {venta.numero || venta.id}
                                                                    {puedeAbrirVentasAdmin && venta.clienteNombre
                                                                        ? ` · ${venta.clienteNombre}`
                                                                        : ''}
                                                                </strong>
                                                                <span>{detalle}</span>
                                                                <small>
                                                                    {puedeAbrirVentasAdmin
                                                                        ? labelAbrirAdminNotif
                                                                        : labelVerMisCompras}
                                                                </small>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </section>
                                        ) : null}

                                        {propuestasNotificacionesCount > 0 ? (
                                            <section className="notifications-section" aria-label={labelProductores}>
                                                <p className="notifications-section-label">{labelProductores}</p>
                                                {propuestasNotificaciones.map((item) => (
                                                    <button
                                                        key={`propuesta-${item.id}`}
                                                        type="button"
                                                        className="notification-item notification-item--propuesta"
                                                        onClick={() => handlePropuestaNotificationOpen(item)}
                                                    >
                                                        <span className="notification-item__icon" aria-hidden="true">
                                                            <Sprout size={16} />
                                                        </span>
                                                        <div className="notification-item__main">
                                                            <strong>{item.titulo}</strong>
                                                            <span>{item.mensaje}</span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </section>
                                        ) : null}
                                    </div>
                                )}
                            </aside>
                    </div>
                ) : null}

                <div className="navbar__user" ref={userMenuRef} onClick={handleIconClick}>
                    <button
                        type="button"
                        className="navbar__icon-button navbar__user-button"
                        aria-label={user ? 'Abrir men\u00fa de usuario' : tIniciarSesion}
                        title={user ? tMiCuenta : tIniciarSesion}
                    >
                        <User size={24} strokeWidth={2} aria-hidden="true" />
                    </button>
                    {user ? (
                        <div
                          className={`dropdown dropdown--user${showDropdown ? ' is-open' : ''}`}
                          role="menu"
                          aria-label="Menú de usuario"
                          aria-hidden={!showDropdown}
                        >
                          <div className="dropdown__user">
                            <span className="dropdown__avatar" aria-hidden="true">
                              <User size={18} strokeWidth={2.1} />
                            </span>
                            <div className="dropdown__user-copy">
                              <p className="dropdown__name">{userDisplayName}</p>
                              <p className="dropdown__email" title={user?.email || user?.correo || ''}>
                                {user?.email || user?.correo}
                              </p>
                            </div>
                          </div>
                          <div className="dropdown__actions">
                            {(() => {
                              const rolesUser = rolesDeUsuario(user);
                              const puedePanel = tienePermiso(rolesUser, 'ver_panel_administrativo');
                              const path = String(pathname || '');
                              const enAdmin = path.startsWith('/admin');
                              const enZonaPerfil =
                                path === '/perfil' ||
                                path.startsWith('/perfil/') ||
                                path === '/admin/perfil' ||
                                path === '/admin/mis-compras' ||
                                path === '/admin/mis-solicitudes' ||
                                path.startsWith('/perfil/propuestas') ||
                                path.startsWith('/admin/mis-propuestas');
                              const perfilTo = puedePanel ? '/admin/perfil' : '/perfil';
                              // Solo una: en sitio público con panel → Panel; en admin/perfil/compras → Mi perfil.
                              if (puedePanel && !enAdmin && !enZonaPerfil) {
                                return (
                                  <Link
                                    to="/admin"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="dropdown__item"
                                    role="menuitem"
                                    onClick={() => setShowDropdown(false)}
                                  >
                                    <LayoutDashboard size={16} strokeWidth={2.1} aria-hidden="true" />
                                    {tPanelAdmin}
                                  </Link>
                                );
                              }
                              return (
                                <Link to={perfilTo} className="dropdown__item" role="menuitem" onClick={() => setShowDropdown(false)}>
                                  <User size={16} strokeWidth={2.1} aria-hidden="true" />
                                  {tMiPerfil}
                                </Link>
                              );
                            })()}
                            <button type="button" className="dropdown__logout" role="menuitem" onClick={handleLogout}>
                              <LogOut size={16} strokeWidth={2.1} aria-hidden="true" />
                              {tCerrarSesion}
                            </button>
                          </div>
                        </div>
                    ) : null}
                </div>

                <button
                    type="button"
                    className="navbar__menu-toggle"
                    aria-label={isMobileMenuOpen ? tCerrarMenu : 'Abrir men\u00fa'}
                    aria-expanded={isMobileMenuOpen}
                    aria-controls="navbar-mobile-menu"
                    onClick={handleMobileMenuToggle}
                >
                    {isMobileMenuOpen ? (
                        <X size={24} strokeWidth={2.2} aria-hidden="true" />
                    ) : (
                        <Menu size={24} strokeWidth={2.2} aria-hidden="true" />
                    )}
                </button>
            </div>

            {typeof document !== 'undefined'
                ? createPortal(
                    <div
                        className={`navbar__mobile-drawer ${isMobileMenuOpen ? 'is-open' : ''}`}
                        inert={!isMobileMenuOpen || undefined}
                    >
                        <button
                            type="button"
                            className="navbar__mobile-backdrop"
                            aria-label={tCerrarMenu}
                            tabIndex={isMobileMenuOpen ? 0 : -1}
                            onClick={closeMobileMenu}
                            onTouchMove={(event) => event.preventDefault()}
                        />
                        <aside
                            id="navbar-mobile-menu"
                            className="navbar__mobile-panel"
                            role="dialog"
                            aria-modal="true"
                            aria-label={"Men\u00fa de navegaci\u00f3n"}
                        >
                            <header className="navbar__mobile-header">
                                <Link
                                    to="/"
                                    className="navbar__mobile-brand"
                                    aria-label="Ir al inicio"
                                    onClick={handleBrandClick}
                                >
                                    {mobileMenuLogoSrc ? (
                                        <img
                                            src={mobileMenuLogoSrc}
                                            alt={"Caf\u00e9 UNA"}
                                            className="navbar__mobile-brand-logo"
                                            width={200}
                                            height={44}
                                            decoding="async"
                                        />
                                    ) : (
                                        <span className="navbar__mobile-brand-text">{"Caf\u00e9 UNA"}</span>
                                    )}
                                </Link>
                                <div className="flex items-center gap-2">
                                    <LanguageSwitcher compact className="lang-switch--on-light" />
                                    <button
                                    type="button"
                                    className="navbar__mobile-close"
                                    aria-label={tCerrarMenu}
                                    onClick={closeMobileMenu}
                                >
                                    <X size={20} strokeWidth={2.2} aria-hidden="true" />
                                </button>
                                </div>
                            </header>

                            <nav className="navbar__mobile-links" aria-label="Secciones del sitio">
                                {navLinks.map((enlace) => {
                                    if (isAboutNavLink(enlace)) {
                                        const pathNorm = normalizePathname(pathname);
                                        const historiaActive = pathNorm === normalizePathname(ABOUT_HISTORIA_PATH);
                                        const galeriaActive = pathNorm === normalizePathname(ABOUT_GALERIA_PATH);
                                        const equipoActive = pathNorm === EQUIPO_PATH;
                                        return (
                                            <div
                                                key={`mobile-about-${enlace.id ?? enlace.ruta}`}
                                                className={`navbar__mobile-about ${showMobileAbout ? 'is-open' : ''}`}
                                            >
                                                <button
                                                    type="button"
                                                    className="navbar__mobile-about-trigger"
                                                    aria-expanded={showMobileAbout}
                                                    onClick={() => setShowMobileAbout((open) => !open)}
                                                >
                                                    <span className="navbar__mobile-about-trigger-main">
                                                        <IconoSitio lugar="menu.sobre-nosotros" className="navbar__mobile-link-icon" size={22} strokeWidth={1.9} />
                                                        <span className="navbar__mobile-link-label">
                                                            <NombreCarrito
                                                                nombre={enlace?.etiqueta || enlace?.Etiqueta || 'Sobre nosotros'}
                                                            />
                                                        </span>
                                                    </span>
                                                    <ChevronDown
                                                        className="navbar__mobile-about-chevron"
                                                        size={18}
                                                        strokeWidth={2.4}
                                                        aria-hidden="true"
                                                    />
                                                </button>
                                                {showMobileAbout ? (
                                                    <div className="navbar__mobile-about-sub">
                                                        <Link
                                                            to={ABOUT_HISTORIA_PATH}
                                                            className={`navbar__mobile-about-item ${historiaActive ? 'is-active' : ''}`}
                                                            onClick={closeMobileMenu}
                                                        >
                                                            {labelHistoria}
                                                        </Link>
                                                        <Link
                                                            to={ABOUT_GALERIA_PATH}
                                                            className={`navbar__mobile-about-item ${galeriaActive ? 'is-active' : ''}`}
                                                            onClick={closeMobileMenu}
                                                        >
                                                            {labelGaleria}
                                                        </Link>
                                                        <Link
                                                            to={EQUIPO_PATH}
                                                            className={`navbar__mobile-about-item ${equipoActive ? 'is-active' : ''}`}
                                                            onClick={closeMobileMenu}
                                                        >
                                                            {labelEquipo}
                                                        </Link>
                                                    </div>
                                                ) : null}
                                            </div>
                                        );
                                    }

                                    if (isFormsNavLink(enlace)) {
                                        const pathNorm = normalizePathname(pathname);
                                        const voluntariadoActive = pathNorm.startsWith('/voluntariado');
                                        const visitasActive = pathNorm.startsWith('/visitas');
                                        const donacionesActive = pathNorm.startsWith('/donaciones');
                                        const productoresActive = pathNorm.startsWith('/productores');
                                        return (
                                            <div
                                                key={`mobile-forms-${enlace.id ?? enlace.ruta}`}
                                                className={`navbar__mobile-about ${showMobileForms ? 'is-open' : ''}`}
                                            >
                                                <button
                                                    type="button"
                                                    className="navbar__mobile-about-trigger"
                                                    aria-expanded={showMobileForms}
                                                    onClick={() => setShowMobileForms((open) => !open)}
                                                >
                                                    <span className="navbar__mobile-about-trigger-main">
                                                        <IconoSitio lugar="menu.formularios" className="navbar__mobile-link-icon" size={22} strokeWidth={1.9} />
                                                        <span className="navbar__mobile-link-label">
                                                            {labelFormularios}
                                                        </span>
                                                    </span>
                                                    <ChevronDown
                                                        className="navbar__mobile-about-chevron"
                                                        size={18}
                                                        strokeWidth={2.4}
                                                        aria-hidden="true"
                                                    />
                                                </button>
                                                {showMobileForms ? (
                                                    <div className="navbar__mobile-about-sub">
                                                        <Link
                                                            to="/voluntariado/solicitar"
                                                            className={`navbar__mobile-about-item ${voluntariadoActive ? 'is-active' : ''}`}
                                                            onClick={closeMobileMenu}
                                                        >
                                                            {labelVoluntariado}
                                                        </Link>
                                                        <Link
                                                            to="/visitas/solicitar"
                                                            className={`navbar__mobile-about-item ${visitasActive ? 'is-active' : ''}`}
                                                            onClick={closeMobileMenu}
                                                        >
                                                            {labelVisitas}
                                                        </Link>
                                                        <Link
                                                            to="/donaciones/solicitar"
                                                            className={`navbar__mobile-about-item ${donacionesActive ? 'is-active' : ''}`}
                                                            onClick={closeMobileMenu}
                                                        >
                                                            {labelDonaciones}
                                                        </Link>
                                                        <Link
                                                            to="/productores"
                                                            className={`navbar__mobile-about-item ${productoresActive ? 'is-active' : ''}`}
                                                            onClick={closeMobileMenu}
                                                        >
                                                            {labelProductores}
                                                        </Link>
                                                    </div>
                                                ) : null}
                                            </div>
                                        );
                                    }

                                    const label = enlace?.etiqueta || enlace?.Etiqueta || 'Enlace';

                                    return (
                                        <SiteNavLink
                                            key={`mobile-${enlace.id ?? enlace.ruta}`}
                                            enlace={enlace}
                                            className="navbar__mobile-link"
                                            activeProps={{ className: 'navbar__mobile-link is-active' }}
                                            onClick={closeMobileMenu}
                                        >
                                            <span className="navbar__mobile-link-content">
                                                <IconoSitio lugar={lugarIconoMenu(enlace?.ruta ?? enlace?.Ruta)} className="navbar__mobile-link-icon" size={22} strokeWidth={1.9} />
                                                <span className="navbar__mobile-link-label">
                                                    <NombreCarrito nombre={label} />
                                                </span>
                                            </span>
                                        </SiteNavLink>
                                    );
                                })}
                            </nav>

                            {hasMobileSocial ? (
                                <div className="navbar__mobile-social">
                                    <p className="navbar__mobile-social-title">{labelRedes}</p>
                                    <div className="navbar__mobile-social-links">
                                        {instagramUrl ? (
                                            <a href={instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram" onClick={closeMobileMenu}>
                                                <IconoSitio lugar="redes.instagram" className="navbar__mobile-social-icon" />
                                            </a>
                                        ) : null}
                                        {facebookUrl ? (
                                            <a href={facebookUrl} target="_blank" rel="noreferrer" aria-label="Facebook" onClick={closeMobileMenu}>
                                                <IconoSitio lugar="redes.facebook" className="navbar__mobile-social-icon" />
                                            </a>
                                        ) : null}
                                    </div>
                                </div>
                            ) : null}
                        </aside>
                    </div>,
                    document.body,
                )
                : null}
        </nav>
    )
}

export default Navbar;
