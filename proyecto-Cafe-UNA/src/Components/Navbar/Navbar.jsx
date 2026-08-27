import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from 'react';
import './Navbar.css';
import { calcularPrecioConIVA, obtenerAlertasStock } from '../../services/productosService';
import { Bell, BookOpen, Coffee, HandHeart, Info, LayoutDashboard, LogOut, Menu, Minus, Package, Plus, ShoppingBag, ShoppingCart, Trash2, User, X } from 'lucide-react';
import { obtenerEnlaces, obtenerFooter, obtenerNavbar } from '../../services/informacionService';
import { FacebookIcon, InstagramIcon } from '../Footer/SocialIcons';
import { normalizeImageUrl } from '../../lib/imageUtils';
import { useHomeBrandNavigation } from '../../hooks/useHomeBrandNavigation';
import { readPageCache } from '../../lib/pageDataCache';
import { obtenerSolicitudes, obtenerSolicitudesDeUsuario } from '../../services/voluntariadoService';
import { cancelPendingSessionRefresh } from '../../services/apiClient';
import { beginLogout, clearSession, getActiveSessionUser } from '../../services/sessionService';
import { rolesDeUsuario, tienePermiso } from '../../lib/permisos';
import { requestAdminStockProduct } from '../../lib/adminStockAlert';
import SiteNavLink from '../SiteNavLink/SiteNavLink';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

import { clearCart as emptyCart, getStoredCart, saveCart } from '../../lib/cartStorage';

const formatCRC = (amount) => {
    const value = Number.isFinite(amount) ? amount : 0;
    return `CRC ${value.toLocaleString('es-CR')}`;
};

const getQuantity = (item) => Number(item.units) || 1;
const getUnitPriceWithoutIva = (item) => Number(item.precioNormal ?? item.priceWithoutIva ?? item.price ?? 0) || 0;
const getUnitPriceWithIva = (item) => calcularPrecioConIVA(getUnitPriceWithoutIva(item));
const getAvailableStock = (item) => Number(item.stock) || 0;
const canCompletePurchase = (user) => Boolean(user);
const canSeeAllSolicitudes = (user) => {
    const roles = Array.isArray(user?.roles) ? user.roles : [];
    return roles.some((role) => {
        const normalizedRole = String(role).toLowerCase();
        return normalizedRole === 'admin' || normalizedRole === 'superadmin';
    });
};
const canSeeStockAlerts = (user) => {
    const roles = rolesDeUsuario(user);
    return (
        tienePermiso(roles, 'ver_inventario') ||
        tienePermiso(roles, 'ver_panel_administrativo')
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

function filterNavLinks(enlaces) {
    return enlaces.filter((enlace) => {
        const ruta = String(enlace?.ruta ?? enlace?.Ruta ?? '').trim();
        return ruta !== '/' && ruta !== '';
    });
}

function resolveMobileNavIcon(ruta) {
    const normalized = String(ruta || '').trim().toLowerCase();

    if (normalized.includes('product')) return Coffee;
    if (normalized.includes('about') || normalized.includes('sobre')) return BookOpen;
    if (normalized.includes('volunt')) return HandHeart;
    if (normalized.includes('iniciativa') || normalized.includes('gallery') || normalized.includes('galer')) return Info;
    if (normalized.includes('checkout') || normalized.includes('cart')) return ShoppingCart;

    return Package;
}

const Navbar = () => {
    const navigate = useNavigate();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showCartDropdown, setShowCartDropdown] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [isCartClosing, setIsCartClosing] = useState(false);
    const [user, setUser] = useState(null);
    const [cartItems, setCartItems] = useState([]);
    const [solicitudes, setSolicitudes] = useState([]);
    const [alertasStock, setAlertasStock] = useState([]);
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
    const cartCloseTimerRef = useRef(null);
    const navbarRef = useRef(null);
    const pathname = useRouterState({
        select: (state) => state.location.pathname,
    });

    useBodyScrollLock(isMobileMenuOpen || showCartDropdown);

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
    }, []);

    useEffect(() => {
        const syncNavbarState = () => {
            const storedUser = getActiveSessionUser();
            const storedCart = getStoredCart();
            setUser(storedUser);
            setCartItems(Array.isArray(storedCart) ? storedCart : []);
            if (!storedUser) {
                setSolicitudes([]);
                setAlertasStock([]);
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
            setAlertasStock([]);
            return;
        }

        setNotificationsLoading(true);
        setNotificationsError('');
        try {
            const userId = currentUser?.id || currentUser?.email || currentUser?.username;
            const solicitudesPromise = canSeeAllSolicitudes(currentUser)
                ? obtenerSolicitudes()
                : obtenerSolicitudesDeUsuario(String(userId));
            const alertasPromise = canSeeStockAlerts(currentUser)
                ? obtenerAlertasStock().catch(() => [])
                : Promise.resolve([]);

            const [data, alertas] = await Promise.all([solicitudesPromise, alertasPromise]);
            setSolicitudes(data);
            setAlertasStock(Array.isArray(alertas) ? alertas : []);
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
        return () => {
            window.clearTimeout(initialLoadId);
            window.removeEventListener('voluntariado-updated', syncSolicitudes);
        };
    }, [user, loadSolicitudesUsuario]);

    const syncScrolledState = useCallback(() => {
        setIsScrolled(window.scrollY > 10);
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
    }, [pathname]);

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
    const alertasStockCount = alertasStock.length;
    const notificationsCount = solicitudesPendientesCount + alertasStockCount;
    const showStockAlerts = canSeeStockAlerts(user);

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

    const handleNotificationsClick = () => {
        const nextState = !showNotifications;
        setShowNotifications(nextState);
        setShowDropdown(false);
        setShowCartDropdown(false);
        if (nextState) {
            loadSolicitudesUsuario(user);
        }
    };

    const handleNotificationOpen = () => {
        setShowNotifications(false);
        if (user?.role === 'admin') {
            navigate({ to: '/admin/voluntariado' });
        }
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
        if (canCompletePurchase(user)) {
            setShowCartDropdown(false);
            return;
        }

        event.preventDefault();
        setShowCartDropdown(false);
        sessionStorage.setItem('postLoginRedirect', '/checkout');
        navigate({ to: '/login' });
    };

    const handleLogout = () => {
        beginLogout();
        cancelPendingSessionRefresh();
        clearSession();
        setUser(null);
        setShowDropdown(false);
        window.location.replace('/');
    };

    const isTransparent = pathname === '/' && !isScrolled;
    const useSolidNavbar = isScrolled;
    const brandLogoSrc = normalizeImageUrl(
        isTransparent && !useSolidNavbar ? (logoClaroUrl || logoUrl) : logoUrl,
        { width: 480 }
    );
    const navLinks = filterNavLinks(enlacesNavbar);
    const mobileMenuLogoSrc = normalizeImageUrl(logoUrl || logoClaroUrl, { width: 320 });
    const hasMobileSocial = Boolean(instagramUrl || facebookUrl);

    const brandMark = brandLogoSrc ? (
        <img
            src={brandLogoSrc}
            alt={"Caf\u00e9 UNA"}
            className="navbar__brand-logo"
            width={240}
            height={52}
            decoding="async"
        />
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
                {navLinks.map((enlace) => (
                    <SiteNavLink
                        key={enlace.id ?? enlace.ruta}
                        enlace={enlace}
                        activeProps={{ style: { fontWeight: '700' } }}
                    />
                ))}
            </div>

            <div className="navbar__actions">
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
                            aria-label="Resumen del carrito"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <header className="cart-drawer-header">
                                <button
                                    type="button"
                                    className="cart-drawer__close-btn"
                                    aria-label="Cerrar carrito"
                                    title="Cerrar carrito"
                                    onClick={(e) => { e.stopPropagation(); closeCartPanel(); }}
                                >
                                    <X size={20} strokeWidth={2.4} aria-hidden="true" />
                                </button>
                                <h2>Resumen del carrito</h2>
                            </header>
                            {cartItems.length === 0 ? (
                                <div className="cart-empty">
                                    <span className="cart-empty__icon" aria-hidden="true">
                                        <ShoppingBag size={28} strokeWidth={1.8} />
                                    </span>
                                    <h3>Tu carrito está vacío</h3>
                                    <p>Todavía no hay cafés por aquí. Explorá el catálogo y agregá el que más te guste.</p>
                                    <Link
                                        to="/productos"
                                        className="cart-empty__cta"
                                        onClick={() => closeCartPanel()}
                                    >
                                        Ver catálogo
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    <section className="cart-items" aria-label="Productos en el carrito">
                                        {cartItems.map((item) => (
                                            <article key={item.id} className="cart-item">
                                                <button
                                                    type="button"
                                                    className="cart-item__remove-inline"
                                                    onClick={() => removeLineItem(item.id)}
                                                    aria-label={`Eliminar ${item.name || item.nombre || 'producto'} del carrito`}
                                                    title="Eliminar producto"
                                                >
                                                    <Trash2 size={16} strokeWidth={2.2} aria-hidden="true" />
                                                </button>
                                                <div className="cart-item__media">
                                                    {item.imagen ? (
                                                        <img
                                                            src={item.imagen}
                                                            alt={item.nombre || item.name || 'Producto'}
                                                            className="cart-item__image"
                                                        />
                                                    ) : (
                                                        <div className="cart-item__image cart-item__image--placeholder" aria-hidden="true" />
                                                    )}
                                                </div>
                                                <div className="cart-item__details">
                                                    <div className="cart-item__name">{item.nombre || item.name || 'Producto'}</div>
                                                    <div className="cart-item__weight">{item.peso || item.quantity || 'Cantidad no disponible'} x {getQuantity(item)}</div>
                                                    <div className="cart-item__prices">
                                                        <span className="cart-item__price-pill">Sin IVA: {formatCRC(getUnitPriceWithoutIva(item))}</span>
                                                        <span className="cart-item__price-pill cart-item__price-pill--strong">Con IVA: {formatCRC(getUnitPriceWithIva(item))}</span>
                                                    </div>
                                                </div>
                                                <footer className="cart-item__bottom">
                                                    <div className="cart-item__controls" aria-label="Controles de cantidad">
                                                        <button
                                                            type="button"
                                                            className="cart-item__stepper"
                                                            onClick={() => removeOneUnit(item.id)}
                                                            aria-label={`Quitar una unidad de ${item.name}`}
                                                        >
                                                            <Minus size={14} strokeWidth={2.8} aria-hidden="true" />
                                                        </button>
                                                        <span className="cart-item__units">{item.units}</span>
                                                        <button
                                                            type="button"
                                                            className="cart-item__stepper"
                                                            onClick={() => addOneUnit(item.id)}
                                                            aria-label={`Agregar una unidad de ${item.name}`}
                                                            disabled={getAvailableStock(item) <= getQuantity(item) || item.estado === 'Agotado'}
                                                        >
                                                            <Plus size={14} strokeWidth={2.8} aria-hidden="true" />
                                                        </button>
                                                    </div>
                                                    <div className="cart-item__line-total">
                                                        <span className="cart-item__line-total-label">Subtotal</span>
                                                        <strong>{formatCRC(getUnitPriceWithIva(item) * getQuantity(item))}</strong>
                                                    </div>
                                                </footer>
                                            </article>
                                        ))}
                                    </section>
                                    <footer className="cart-subtotal" aria-label="Totales del carrito">
                                        <div className="cart-subtotal-row">
                                            <span>Subtotal:</span>
                                            <strong>{formatCRC(cartSubtotal)}</strong>
                                        </div>
                                        <div className="cart-subtotal-row">
                                            <span>IVA:</span>
                                            <strong>{formatCRC(cartIva)}</strong>
                                        </div>
                                        <div className="cart-total-row">
                                            <strong>Total:</strong>
                                            <strong>{formatCRC(cartTotal)}</strong>
                                        </div>
                                    </footer>
                                    <div className="cart-actions-row">
                                        <Link to="/checkout" className="cart-go-checkout" onClick={handleCheckoutClick}>
                                            Ir a pagar
                                        </Link>
                                        <button
                                            type="button"
                                            className="cart-clear-button"
                                            onClick={clearCartItems}
                                        >
                                            Vaciar carrito
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
                            aria-label="Ver notificaciones"
                            title="Notificaciones"
                        >
                            <Bell size={25} strokeWidth={2.2} aria-hidden="true" />
                        </button>
                        {notificationsCount > 0 ? (
                            <span className="notifications-badge">{notificationsCount}</span>
                        ) : null}
                        {showNotifications ? (
                            <aside className="dropdown dropdown--notifications" aria-label="Notificaciones">
                                <header className="notifications-header">
                                    <h2>Notificaciones</h2>
                                    <span>{notificationsCount}</span>
                                </header>

                                {notificationsLoading ? (
                                    <p className="dropdown__empty">Cargando notificaciones...</p>
                                ) : notificationsError ? (
                                    <p className="dropdown__empty">{notificationsError}</p>
                                ) : notificationsCount === 0 ? (
                                    <p className="dropdown__empty">No hay notificaciones pendientes.</p>
                                ) : (
                                    <div className="notifications-list">
                                        {showStockAlerts && alertasStockCount > 0 ? (
                                            <section className="notifications-section" aria-label="Stock bajo">
                                                <p className="notifications-section-label">Stock bajo</p>
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
                                                                <strong>{alerta.nombre}</strong>
                                                                <span>
                                                                    {alerta.agotado ? 'Agotado' : 'Bajo mínimo'}
                                                                    {' · '}
                                                                    {lugares}
                                                                </span>
                                                                <small className="notification-item__stock">
                                                                    {"Reponer stock"}
                                                                </small>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </section>
                                        ) : null}

                                        {solicitudesPendientesCount > 0 ? (
                                            <section className="notifications-section" aria-label="Voluntariado">
                                                {showStockAlerts && alertasStockCount > 0 ? (
                                                    <p className="notifications-section-label">Voluntariado</p>
                                                ) : null}
                                                {solicitudesPendientes.map((solicitud) => {
                                                    const notificationContent = (
                                                        <>
                                                            <span className="notification-item__icon" aria-hidden="true">
                                                                <HandHeart size={16} />
                                                            </span>
                                                            <div className="notification-item__main">
                                                                <strong>{solicitud.tipoVoluntariado || solicitud.area || 'Voluntariado'}</strong>
                                                                <span>{solicitud.fechaSolicitud || 'Fecha no disponible'}</span>
                                                                {user?.role === 'admin' ? <small>{"Abrir en administraci\u00f3n"}</small> : null}
                                                            </div>
                                                        </>
                                                    );

                                                    return user?.role === 'admin' ? (
                                                        <button
                                                            key={solicitud.id}
                                                            type="button"
                                                            className="notification-item notification-item--voluntariado"
                                                            onClick={handleNotificationOpen}
                                                            title={"Abrir administraci\u00f3n de voluntariado"}
                                                        >
                                                            {notificationContent}
                                                        </button>
                                                    ) : (
                                                        <article key={solicitud.id} className="notification-item notification-item--voluntariado notification-item--readonly">
                                                            {notificationContent}
                                                        </article>
                                                    );
                                                })}
                                            </section>
                                        ) : null}
                                    </div>
                                )}
                            </aside>
                        ) : null}
                    </div>
                ) : null}

                <div className="navbar__user" ref={userMenuRef} onClick={handleIconClick}>
                    <button
                        type="button"
                        className="navbar__icon-button navbar__user-button"
                        aria-label={user ? 'Abrir men\u00fa de usuario' : 'Iniciar sesi\u00f3n'}
                        title={user ? 'Mi cuenta' : 'Iniciar sesi\u00f3n'}
                    >
                        <User size={24} strokeWidth={2} aria-hidden="true" />
                    </button>
                    {showDropdown && user && (
                        <div className="dropdown dropdown--user" role="menu" aria-label="Menú de usuario">
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
                            {user.role !== 'admin' ? (
                              <Link to="/perfil" className="dropdown__item" role="menuitem" onClick={() => setShowDropdown(false)}>
                                <User size={16} strokeWidth={2.1} aria-hidden="true" />
                                Mi perfil
                              </Link>
                            ) : null}
                            {user.role === 'admin' ? (
                              <Link to="/admin" className="dropdown__item" role="menuitem" onClick={() => setShowDropdown(false)}>
                                <LayoutDashboard size={16} strokeWidth={2.1} aria-hidden="true" />
                                Panel administrativo
                              </Link>
                            ) : null}
                            <button type="button" className="dropdown__logout" role="menuitem" onClick={handleLogout}>
                              <LogOut size={16} strokeWidth={2.1} aria-hidden="true" />
                              Cerrar sesión
                            </button>
                          </div>
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    className="navbar__menu-toggle"
                    aria-label={isMobileMenuOpen ? 'Cerrar men\u00fa' : 'Abrir men\u00fa'}
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

            <div
                className={`navbar__mobile-drawer ${isMobileMenuOpen ? 'is-open' : ''}`}
                inert={!isMobileMenuOpen || undefined}
            >
                <button
                    type="button"
                    className="navbar__mobile-backdrop"
                    aria-label={"Cerrar men\u00fa"}
                    tabIndex={isMobileMenuOpen ? 0 : -1}
                    onClick={closeMobileMenu}
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
                        <button
                            type="button"
                            className="navbar__mobile-close"
                            aria-label={"Cerrar men\u00fa"}
                            onClick={closeMobileMenu}
                        >
                            <X size={20} strokeWidth={2.2} aria-hidden="true" />
                        </button>
                    </header>

                    <nav className="navbar__mobile-links" aria-label="Secciones del sitio">
                        {navLinks.map((enlace) => {
                            const NavIcon = resolveMobileNavIcon(enlace?.ruta ?? enlace?.Ruta);
                            const label = enlace?.etiqueta ?? enlace?.Etiqueta ?? 'Enlace';

                            return (
                                <SiteNavLink
                                    key={`mobile-${enlace.id ?? enlace.ruta}`}
                                    enlace={enlace}
                                    className="navbar__mobile-link"
                                    activeProps={{ className: 'navbar__mobile-link is-active' }}
                                    onClick={closeMobileMenu}
                                >
                                    <span className="navbar__mobile-link-content">
                                        <NavIcon className="navbar__mobile-link-icon" size={22} strokeWidth={1.9} aria-hidden="true" />
                                        <span className="navbar__mobile-link-label">{label}</span>
                                    </span>
                                </SiteNavLink>
                            );
                        })}
                    </nav>

                    {hasMobileSocial ? (
                        <div className="navbar__mobile-social">
                            <p className="navbar__mobile-social-title">Redes sociales</p>
                            <div className="navbar__mobile-social-links">
                                {instagramUrl ? (
                                    <a href={instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram" onClick={closeMobileMenu}>
                                        <InstagramIcon className="navbar__mobile-social-icon" />
                                    </a>
                                ) : null}
                                {facebookUrl ? (
                                    <a href={facebookUrl} target="_blank" rel="noreferrer" aria-label="Facebook" onClick={closeMobileMenu}>
                                        <FacebookIcon className="navbar__mobile-social-icon" />
                                    </a>
                                ) : null}
                            </div>
                        </div>
                    ) : null}
                </aside>
            </div>
        </nav>
    )
}

export default Navbar;
