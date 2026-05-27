import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from 'react';
import './Navbar.css';
import { calcularPrecioConIVA } from '../../services/productosServices';
import { Bell, Minus, Plus, Trash2, X } from 'lucide-react';
import { obtenerSolicitudesDeUsuario } from '../../services/voluntariadoService';

const CART_STORAGE_KEY = 'cart';

const formatCRC = (amount) => {
    const value = Number.isFinite(amount) ? amount : 0;
    return `CRC ${value.toLocaleString('es-CR')}`;
};

const getQuantity = (item) => Number(item.units) || 1;
const getUnitPriceWithoutIva = (item) => Number(item.precioNormal ?? item.priceWithoutIva ?? item.price ?? 0) || 0;
const getUnitPriceWithIva = (item) => calcularPrecioConIVA(getUnitPriceWithoutIva(item));
const getAvailableStock = (item) => Number(item.stock) || 0;

const Navbar = () => {
    const navigate = useNavigate();
    const [isScrolled, setIsScrolled] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showCartDropdown, setShowCartDropdown] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [isCartClosing, setIsCartClosing] = useState(false);
    const [user, setUser] = useState(null);
    const [cartItems, setCartItems] = useState([]);
    const [solicitudes, setSolicitudes] = useState([]);
    const [notificationsLoading, setNotificationsLoading] = useState(false);
    const [notificationsError, setNotificationsError] = useState('');
    const cartContainerRef = useRef(null);
    const notificationsRef = useRef(null);
    const cartCloseTimerRef = useRef(null);
    const navbarRef = useRef(null);
    const pathname = useRouterState({
        select: (state) => state.location.pathname,
    });

    useEffect(() => {
        const syncNavbarState = () => {
            const storedUser = JSON.parse(localStorage.getItem('user'));
            const storedCart = localStorage.getItem(CART_STORAGE_KEY);
            setUser(storedUser);
            setCartItems(storedCart ? JSON.parse(storedCart) : []);
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
        const userId = currentUser?.id || currentUser?.email || currentUser?.username;
        if (!userId) {
            setSolicitudes([]);
            return;
        }

        setNotificationsLoading(true);
        setNotificationsError('');
        try {
            const data = await obtenerSolicitudesDeUsuario(String(userId));
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
        loadSolicitudesUsuario(user);

        const syncSolicitudes = () => loadSolicitudesUsuario(user);
        window.addEventListener('voluntariado-updated', syncSolicitudes);
        return () => window.removeEventListener('voluntariado-updated', syncSolicitudes);
    }, [user, loadSolicitudesUsuario]);

    const syncScrolledState = useCallback(() => {
        setIsScrolled(window.scrollY > 10);
    }, []);

    useEffect(() => {
        syncScrolledState();
        window.addEventListener('scroll', syncScrolledState, { passive: true });
        return () => window.removeEventListener('scroll', syncScrolledState);
    }, [syncScrolledState]);

    useEffect(() => {
        syncScrolledState();
        const rafId = window.requestAnimationFrame(syncScrolledState);
        const timeoutId = window.setTimeout(syncScrolledState, 80);

        return () => {
            window.cancelAnimationFrame(rafId);
            window.clearTimeout(timeoutId);
        };
    }, [pathname, syncScrolledState]);

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
    }, [pathname, isScrolled, cartItems, showCartDropdown, showDropdown]);

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
    const solicitudesPendientes = solicitudes.filter((solicitud) => solicitud.estado === 'Pendiente').length;

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

    const handleIconClick = () => {
        if (user) {
            setShowDropdown(!showDropdown);
            setShowCartDropdown(false);
            setShowNotifications(false);
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

    const handleLogout = () => {
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('storage'));
        setUser(null);
        setShowDropdown(false);
        window.location.href = '/';
    };

    const isTransparent = pathname === '/' && !isScrolled;

    return (
        <nav ref={navbarRef} className={`navbar ${isTransparent ? 'navbar--transparent' : 'navbar--solid'}`}>
            <Link to="/" className="navbar__brand" aria-label="Ir a inicio">
                <img
                    src={isTransparent ? "/logoblancoyrojo.png" : "/logo.webp"}
                    alt="Café UNA"
                    className="navbar__brand-logo"
                />
            </Link>
            <div className="navbar__menu">
                <Link to="/AboutUs" activeProps={{ style: { fontWeight: '700' } }}>Sobre nosotros</Link>
                <Link to="/productos" activeProps={{ style: { fontWeight: '700' } }}>Productos</Link>
                <Link to="/voluntariado/solicitar">Voluntariado</Link>
                
            </div>
            <div className="navbar__actions">
                <div className="navbar__cart" ref={cartContainerRef} onClick={handleCartClick}>
                    <img
                        src="https://cdn-icons-png.flaticon.com/512/263/263142.png"
                        alt="Carrito"
                        className="cart-icon"
                    />
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
                                        <Link to="/checkout" className="cart-go-checkout" onClick={() => setShowCartDropdown(false)}>
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
                            {solicitudesPendientes > 0 ? (
                                <span className="notifications-badge">{solicitudesPendientes}</span>
                            ) : null}
                        </button>
                        {showNotifications ? (
                            <aside className="dropdown dropdown--notifications" aria-label="Solicitudes de voluntariado">
                                <header className="notifications-header">
                                    <h2>Mis solicitudes</h2>
                                    <span>{solicitudes.length}</span>
                                </header>

                                {notificationsLoading ? (
                                    <p className="dropdown__empty">Cargando solicitudes...</p>
                                ) : notificationsError ? (
                                    <p className="dropdown__empty">{notificationsError}</p>
                                ) : solicitudes.length === 0 ? (
                                    <p className="dropdown__empty">Aun no ha enviado solicitudes.</p>
                                ) : (
                                    <div className="notifications-list">
                                        {solicitudes.map((solicitud) => (
                                            <article key={solicitud.id} className="notification-item">
                                                <div className="notification-item__main">
                                                    <strong>{solicitud.tipoVoluntariado || solicitud.area || 'Voluntariado'}</strong>
                                                    <span>{solicitud.fechaSolicitud || 'Fecha no disponible'}</span>
                                                </div>
                                                <span className={`notification-status notification-status--${(solicitud.estado || 'pendiente').toLowerCase()}`}>
                                                    {solicitud.estado || 'Pendiente'}
                                                </span>
                                            </article>
                                        ))}
                                    </div>
                                )}
                            </aside>
                        ) : null}
                    </div>
                ) : null}

                <div className="navbar__user" onClick={handleIconClick}>
                    <img src="https://cdn-icons-png.flaticon.com/512/7531/7531708.png" alt="User Icon" className="user-icon" />
                    {showDropdown && user && (
                        <div className="dropdown">
                        <p>{userDisplayName}</p>
                        {user.role === 'admin' && (
                            <Link to="/admin" onClick={() => setShowDropdown(false)}>Panel Administrativo</Link>
                        )}
                        <button onClick={handleLogout}>Cerrar Sesión</button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    )
}

export default Navbar;
