import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from 'react';
import './Navbar.css';

const CART_STORAGE_KEY = 'cart';

const formatCRC = (amount) => `CRC ${amount.toLocaleString('es-CR')}`;

const Navbar = () => {
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const [showCartDropdown, setShowCartDropdown] = useState(false);
    const [user, setUser] = useState(null);
    const [cartItems, setCartItems] = useState([]);

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

    const cartUnits = cartItems.reduce((acc, item) => acc + (item.units || 0), 0);
    const cartSubtotal = cartItems.reduce((acc, item) => acc + (item.price * (item.units || 0)), 0);

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
        setShowCartDropdown(!showCartDropdown);
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
                <div className="navbar__cart" onClick={handleCartClick}>
                    <img
                        src="https://cdn-icons-png.flaticon.com/512/263/263142.png"
                        alt="Carrito"
                        className="cart-icon"
                    />
                    <span className="cart-badge">{cartUnits}</span>
                    {showCartDropdown ? (
                        <div className="dropdown dropdown--cart" onClick={(event) => event.stopPropagation()}>
                            <p>Resumen del carrito</p>
                            {cartItems.length === 0 ? (
                                <span className="dropdown__empty">Tu carrito esta vacio.</span>
                            ) : (
                                <>
                                    <div className="cart-items">
                                        {cartItems.map((item) => (
                                            <div key={item.id} className="cart-item">
                                                <span className="cart-item__name">{item.name}</span>
                                                <span>{item.quantity} x {item.units}</span>
                                                <span>{formatCRC(item.price * item.units)}</span>
                                                <div className="cart-item__actions">
                                                    <button
                                                        type="button"
                                                        className="cart-item__button"
                                                        onClick={() => removeOneUnit(item.id)}
                                                    >
                                                        Quitar 1
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="cart-item__button cart-item__button--danger"
                                                        onClick={() => removeLineItem(item.id)}
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="cart-subtotal">
                                        <strong>Subtotal:</strong>
                                        <strong>{formatCRC(cartSubtotal)}</strong>
                                    </div>
                                    <button
                                        type="button"
                                        className="cart-clear-button"
                                        onClick={clearCart}
                                    >
                                        Vaciar carrito
                                    </button>
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