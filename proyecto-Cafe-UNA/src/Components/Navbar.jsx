import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from 'react';
import './Navbar.css';

const CART_STORAGE_KEY = 'cart';

const formatCRC = (amount) => `CRC ${amount.toLocaleString('es-CR')}`;

const Navbar = () => {
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const [showCartDropdown, setShowCartDropdown] = useState(false);
    const [isCartClosing, setIsCartClosing] = useState(false);
    const [user, setUser] = useState(null);
    const [cartItems, setCartItems] = useState([]);
    const cartContainerRef = useRef(null);
    const cartCloseTimerRef = useRef(null);

    useEffect(() => {
        const syncNavbarState = () => {
            const storedUser = JSON.parse(localStorage.getItem('user'));
            const storedCart = localStorage.getItem(CART_STORAGE_KEY);
            setUser(storedUser);
            setCartItems(storedCart ? JSON.parse(storedCart) : []);
        };
        syncNavbarState();
        window.addEventListener('storage', syncNavbarState);
        window.addEventListener('cart-updated', syncNavbarState);
        return () => {
            window.removeEventListener('storage', syncNavbarState);
            window.removeEventListener('cart-updated', syncNavbarState);
        };
    }, []);

    useEffect(() => () => {
        if (cartCloseTimerRef.current) {
            window.clearTimeout(cartCloseTimerRef.current);
        }
    }, []);

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

    const cartUnits = cartItems.reduce((acc, item) => acc + (item.units || 0), 0);
    const cartSubtotal = cartItems.reduce((acc, item) => acc + (item.price * (item.units || 0)), 0);
    const VAT_RATE = 0.13;
    const cartIva = Math.round(cartSubtotal * VAT_RATE);
    const cartTotal = cartSubtotal + cartIva;

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
        const updatedCart = cartItems.map((item) => (
            item.id === productId
                ? { ...item, units: (item.units || 1) + 1 }
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
        } else {
            navigate({ to: '/login' });
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
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('storage'));
        setUser(null);
        setShowDropdown(false);
        window.location.href = '/';
    };

    return (
        <nav className="navbar">
            <div className="navbar__brand">Café UNA</div>
            <div className="navbar__menu">
                <Link to="/" activeProps={{ style: { fontWeight: '700' } }}>Inicio</Link>
                <Link to="/AboutUs" activeProps={{ style: { fontWeight: '700' } }}>About Us</Link>
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
                        <div
                            className={`dropdown dropdown--cart dropdown--cart-panel ${isCartClosing ? 'is-closing' : 'is-open'}`}
                            onClick={(event) => event.stopPropagation()}
                        >
                            <div className="cart-drawer-header">
                                <button
                                    type="button"
                                    className="cart-drawer__close-btn"
                                    aria-label="Cerrar carrito"
                                    title="Cerrar carrito"
                                    onClick={(e) => { e.stopPropagation(); closeCartPanel(); }}
                                >
                                    ×
                                </button>
                                <p>Resumen del carrito</p>
                            </div>
                            {cartItems.length === 0 ? (
                                <span className="dropdown__empty">Tu carrito esta vacio.</span>
                            ) : (
                                <>
                                    <div className="cart-items">
                                        {cartItems.map((item) => (
                                            <div key={item.id} className="cart-item">
                                                <span className="cart-item__name">{item.name}</span>
                                                <span>{item.quantity}</span>
                                                <div className="cart-item__controls">
                                                    <button
                                                        type="button"
                                                        className="cart-item__stepper"
                                                        onClick={() => removeOneUnit(item.id)}
                                                        aria-label={`Quitar una unidad de ${item.name}`}
                                                    >
                                                        -
                                                    </button>
                                                    <span className="cart-item__units">{item.units}</span>
                                                    <button
                                                        type="button"
                                                        className="cart-item__stepper"
                                                        onClick={() => addOneUnit(item.id)}
                                                        aria-label={`Agregar una unidad de ${item.name}`}
                                                    >
                                                        +
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="cart-item__trash"
                                                        onClick={() => removeLineItem(item.id)}
                                                        aria-label={`Eliminar ${item.name} del carrito`}
                                                        title="Eliminar producto"
                                                    >
                                                        🗑
                                                    </button>
                                                </div>
                                                <span>{formatCRC(item.price * item.units)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="cart-subtotal">
                                        <div className="cart-subtotal-row">
                                            <span>Subtotal:</span>
                                            <strong>{formatCRC(cartSubtotal)}</strong>
                                        </div>
                                        <div className="cart-subtotal-row">
                                            <span>IVA (13%):</span>
                                            <strong>{formatCRC(cartIva)}</strong>
                                        </div>
                                        <div className="cart-total-row">
                                            <strong>Total:</strong>
                                            <strong>{formatCRC(cartTotal)}</strong>
                                        </div>
                                    </div>
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
                        </div>
                    ) : null}
                </div>

                <div className="navbar__user" onClick={handleIconClick}>
                    <img src="https://cdn-icons-png.flaticon.com/512/7531/7531708.png" alt="User Icon" className="user-icon" />
                    {showDropdown && user && (
                        <div className="dropdown">
                        <p>{user.name}</p>
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