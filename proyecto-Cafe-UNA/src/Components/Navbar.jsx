import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from 'react';
import './Navbar.css';

const Navbar = () => {
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const handleStorageChange = () => {
            const storedUser = JSON.parse(localStorage.getItem('user'));
            setUser(storedUser);
        };
        handleStorageChange(); // Initial load
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const handleIconClick = () => {
        if (user) {
            setShowDropdown(!showDropdown);
        } else {
            navigate({ to: '/login' });
        }
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
        </nav>
    )
}

export default Navbar;