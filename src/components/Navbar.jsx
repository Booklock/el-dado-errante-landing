import logo from "../assets/rolosimplificado.webp";
import { openWhatsApp } from "../constants";
const handleWhatsApp = () => openWhatsApp("Hola, quiero alquilar un juego de mesa ");

function Navbar() {
  return (
    <header className="navbar">
      <div className="container navbar-content">

        {/* Logo */}
        <div className="navbar-left">
          <img src={logo} alt="El Dado Errante" className="navbar-logo" />
        </div>

        {/* Links */}
        <nav className="navbar-links" aria-label="Navegación principal">
          <a href="#how-it-works">Cómo funciona</a>
          <a href="#catalog">Catálogo</a>
          <a href="#pricing">Precios</a>
          <a href="#testimonials">Testimonios</a>
        </nav>

        {/* CTA */}
        <div className="navbar-right">
          <button className="btn btn-primary" onClick={handleWhatsApp}>
            WhatsApp
          </button>
        </div>

      </div>
    </header>
  );
}

export default Navbar;