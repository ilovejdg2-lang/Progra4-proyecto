import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from 'react';
import './Navbar.css';
import { calcularPrecioConIVA } from '../../services/productosServices';
import { Bell, Menu, Minus, Plus, ShoppingCart, Trash2, User, X } from 'lucide-react';
import { obtenerEnlaces, obtenerNavbar } from '../../services/informacionService';
import { normalizeImageUrl } from '../../lib/imageUtils';
import { obtenerSolicitudes, obtenerSolicitudesDeUsuario } from '../../services/voluntariadoService';
import { clearSession, getActiveSessionUser } from '../../services/sessionService';
import SiteNavLink from '../SiteNavLink/SiteNavLink';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

const CART_STORAGE_KEY = 'cart';

const parseStorageJson = (key, fallback) => {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
};

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
const isSolicitudPendiente = (solicitud) =>
    String(solicitud?.estado || '').trim().toLowerCase() === 'pendiente';

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
    const [notificationsLoading, setNotificationsLoading] = useState(false);
    const [notificationsError, setNotificationsError] = useState('');
    const [enlacesNavbar, setEnlacesNavbar] = useState([]);
    const [logoUrl, setLogoUrl] = useState('');
    const [logoClaroUrl, setLogoClaroUrl] = useState('');
    const cartContainerRef = useRef(null);
    const notificationsRef = useRef(null);
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
        ])
            .then(([enlaces, navbar]) => {
                if (!activo) return;
                setEnlacesNavbar(Array.isArray(enlaces) ? enlaces : []);
                setLogoUrl(typeof navbar?.logoUrl === 'string' ? navbar.logoUrl.trim() : '');
                setLogoClaroUrl(typeof navbar?.logoClaroUrl === 'string' ? navbar.logoClaroUrl.trim() : '');
            })
            .catch((err) => {
                console.error('No se pudo cargar la informacion del navbar.', err);
            });

        return () => {
            activo = false;
        };
    }, []);

    useEffect(() => {
        const syncNavbarState = () => {
            const storedUser = getActiveSessionUser();
            const storedCart = parseStorageJson(CART_STORAGE_KEY, []);
            setUser(storedUser);
            setCartItems(Array.isArray(storedCart) ? storedCart : []);
            if (!storedUser) {
                setSolicitudes([]);
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
            return;
        }

        setNotificationsLoading(true);
        setNotificationsError('');
        try {
            const userId = currentUser?.id || currentUser?.email || currentUser?.username;
            const data = canSeeAllSolicitudes(currentUser)
                ? await obtenerSolicitudes()
                : await obtenerSolicitudesDeUsuario(String(userId));
            setSolicitudes(data);
        } catch (err) {
            console.error('No se pudieron cargar las solicitudes de voluntariado.', err);
            setNotificationsError('No se pudieron cargar las solicitudes.');
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

    const cartUnits = cartItems.reduce((acc, item) => acc + (Number(item.units) || 0), 0);
    const cartSubtotal = cartItems.reduce((acc, item) => acc + (getUnitPriceWithoutIva(item) * getQuantity(item)), 0);
    const cartIva = cartItems.reduce((acc, item) => acc + ((getUnitPriceWithIva(item) - getUnitPriceWithoutIva(item)) * getQuantity(item)), 0);
    const cartTotal = cartItems.reduce((acc, item) => acc + (getUnitPriceWithIva(item) * getQuantity(item)), 0);
    const userDisplayName = user?.username?.includes('@') ? user?.name : user?.username || user?.name;
    const solicitudesPendientes = solicitudes.filter(isSolicitudPendiente);
    const solicitudesPendientesCount = solicitudesPendientes.length;

    const saveCart = (updatedCart) => {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedCart));
        setCartItems(updatedCart);
        window.dispatchEvent(new Event('cart-updated'));
    };

    const removeOneUnit = (productId) => {
        const updatedCart = cartItems
            .map((item) => (
                item.id === productId
                    ? { ...item, units: Math.max((item.units || 1) - 1, 0) }
                    : item
            ))
            .filter((item) => (item.units || 0) > 0);

        saveCart(updatedCart);
    };

    const addOneUnit = (productId) => {
        const targetItem = cartItems.find((item) => item.id === productId);
        if (!targetItem) {
            return;
        }

        const stockDisponible = getAvailableStock(targetItem);
        const unidadesActuales = getQuantity(targetItem);

        if (stockDisponible <= 0 || targetItem.estado === 'Agotado') {
            window.alert('Este producto está agotado.');
            return;
        }

        if (unidadesActuales >= stockDisponible) {
            window.alert('No hay más unidades disponibles de este producto.');
            return;
        }

        const updatedCart = cartItems.map((item) => (
            item.id === productId
                ? { ...item, units: unidadesActuales + 1 }
                : item
        ));

        saveCart(updatedCart);
    };

    const removeLineItem = (productId) => {
        const updatedCart = cartItems.filter((item) => item.id !== productId);
        saveCart(updatedCart);
    };

    const clearCart = () => {
        saveCart([]);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
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
        clearSession();
        setUser(null);
        setShowDropdown(false);
        window.location.href = '/';
    };

    const isTransparent = pathname === '/' && !isScrolled;
    const useSolidNavbar = isScrolled || isMobileMenuOpen;
    const brandLogoSrc = normalizeImageUrl(
        isTransparent && !useSolidNavbar ? (logoClaroUrl || logoUrl) : logoUrl,
        { width: 480 }
    );

    return (
        <nav
            ref={navbarRef}
            className={`navbar ${isTransparent && !useSolidNavbar ? 'navbar--transparent' : 'navbar--solid'}`}
        >
            <div className="navbar__start">
                <button
                    type="button"
                    className="navbar__menu-toggle"
                    aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
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

                <Link to="/" className="navbar__brand" aria-label="Ir a inicio" onClick={closeMobileMenu}>
                    {brandLogoSrc ? (
                        <img
                            src={brandLogoSrc}
                            alt="Café UNA"
                            className="navbar__brand-logo"
                        />
                    ) : (
                        <span className="navbar__brand-text">Café UNA</span>
                    )}
                </Link>
            </div>

            <div className="navbar__menu">
                {enlacesNavbar.map((enlace) => (
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
                                <p className="dropdown__empty">Tu carrito esta vacio.</p>
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
                                            onClick={clearCart}
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
                    <div className="navbar__notifications" ref={notificationsRef}>
                        <button
                            type="button"
                            className="navbar__icon-button"
                            aria-label="Ver solicitudes de voluntariado"
                            title="Solicitudes de voluntariado"
                            onClick={handleNotificationsClick}
                        >
                            <Bell size={25} strokeWidth={2.2} aria-hidden="true" />
                            {solicitudesPendientesCount > 0 ? (
                                <span className="notifications-badge">{solicitudesPendientesCount}</span>
                            ) : null}
                        </button>
                        {showNotifications ? (
                            <aside className="dropdown dropdown--notifications" aria-label="Solicitudes de voluntariado">
                                <header className="notifications-header">
                                    <h2>Mis solicitudes</h2>
                                    <span>{solicitudesPendientesCount}</span>
                                </header>

                                {notificationsLoading ? (
                                    <p className="dropdown__empty">Cargando solicitudes...</p>
                                ) : notificationsError ? (
                                    <p className="dropdown__empty">{notificationsError}</p>
                                ) : solicitudesPendientesCount === 0 ? (
                                    <p className="dropdown__empty">No hay solicitudes pendientes.</p>
                                ) : (
                                    <div className="notifications-list">
                                        {solicitudesPendientes.map((solicitud) => {
                                            const notificationContent = (
                                                <div className="notification-item__main">
                                                    <strong>{solicitud.tipoVoluntariado || solicitud.area || 'Voluntariado'}</strong>
                                                    <span>{solicitud.fechaSolicitud || 'Fecha no disponible'}</span>
                                                    {user?.role === 'admin' ? <small>Abrir en administración</small> : null}
                                                </div>
                                            );

                                            return user?.role === 'admin' ? (
                                                <button
                                                    key={solicitud.id}
                                                    type="button"
                                                    className="notification-item"
                                                    onClick={handleNotificationOpen}
                                                    title="Abrir administración de voluntariado"
                                                >
                                                    {notificationContent}
                                                </button>
                                            ) : (
                                                <article key={solicitud.id} className="notification-item notification-item--readonly">
                                                    {notificationContent}
                                                </article>
                                            );
                                        })}
                                    </div>
                                )}
                            </aside>
                        ) : null}
                    </div>
                ) : null}

                <div className="navbar__user" onClick={handleIconClick}>
                    <button
                        type="button"
                        className="navbar__icon-button navbar__user-button"
                        aria-label={user ? 'Abrir menú de usuario' : 'Iniciar sesión'}
                        title={user ? 'Mi cuenta' : 'Iniciar sesión'}
                    >
                        <User size={24} strokeWidth={2} aria-hidden="true" />
                    </button>
                    {showDropdown && user && (
                        <div className="dropdown">
                        <p>{userDisplayName}</p>
                        {user.role === 'admin' && (
                            <Link to="/admin" onClick={() => setShowDropdown(false)}>Panel Administrativo</Link>
                        )}
                        <button className="dropdown__logout" onClick={handleLogout}>Cerrar Sesión</button>
                        </div>
                    )}
                </div>
            </div>

            <div
                className={`navbar__mobile-drawer ${isMobileMenuOpen ? 'is-open' : ''}`}
                aria-hidden={!isMobileMenuOpen}
            >
                <button
                    type="button"
                    className="navbar__mobile-backdrop"
                    aria-label="Cerrar menú"
                    tabIndex={isMobileMenuOpen ? 0 : -1}
                    onClick={closeMobileMenu}
                />
                <aside
                    id="navbar-mobile-menu"
                    className="navbar__mobile-panel"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Menú de navegación"
                >
                    <header className="navbar__mobile-header">
                        <span>Café UNA</span>
                        <button
                            type="button"
                            className="navbar__mobile-close"
                            aria-label="Cerrar menú"
                            onClick={closeMobileMenu}
                        >
                            <X size={20} strokeWidth={2.4} aria-hidden="true" />
                        </button>
                    </header>
                    <nav className="navbar__mobile-links">
                        {enlacesNavbar.map((enlace) => (
                            <SiteNavLink
                                key={`mobile-${enlace.id ?? enlace.ruta}`}
                                enlace={enlace}
                                className="navbar__mobile-link"
                                activeProps={{ className: 'navbar__mobile-link is-active' }}
                                onClick={closeMobileMenu}
                            />
                        ))}
                    </nav>
                </aside>
            </div>
        </nav>
    )
}

export default Navbar;
