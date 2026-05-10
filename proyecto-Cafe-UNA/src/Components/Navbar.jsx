import { Link } from "@tanstack/react-router";
import './Navbar.css';

const Navbar = () => {
    return (
        <nav className="navbar">
            <div className="navbar__brand">Café UNA</div>
            <div className="navbar__menu">
                <Link to="/" activeProps={{ style: { fontWeight: '700' } }}>Inicio</Link>
                <Link to="/AboutUs" activeProps={{ style: { fontWeight: '700' } }}>About Us</Link>
            </div>
        </nav>
    )
}

export default Navbar;