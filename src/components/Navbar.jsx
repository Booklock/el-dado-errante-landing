import { useState } from "react";
import logo from "../assets/rolosimplificado.webp";
import { openWhatsApp } from "../constants";

const NAV_LINKS = [
  { href: "#how-it-works", label: "Cómo funciona" },
  { href: "#catalog", label: "Catálogo" },
  { href: "#pricing", label: "Precios" },
  { href: "#testimonials", label: "Testimonios" },
];

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const handleWhatsApp = () => openWhatsApp("Hola, quiero alquilar un juego de mesa ");
  const closeMenu = () => setIsOpen(false);

  return (
    <header className="navbar">
      <div className="container navbar-content">

        {/* Logo */}
        <div className="navbar-left">
          <img src={logo} alt="El Dado Errante" className="navbar-logo" />
        </div>

        {/* Links — escritorio */}
        <nav className="navbar-links" aria-label="Navegación principal">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href}>{link.label}</a>
          ))}
        </nav>

        {/* CTA escritorio + botón hamburguesa */}
        <div className="navbar-right">
          <button className="btn btn-primary navbar-cta-desktop" onClick={handleWhatsApp}>
            WhatsApp
          </button>
          <button
            className={`navbar-hamburger${isOpen ? " open" : ""}`}
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={isOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

      </div>

      {/* Menú móvil */}
      {isOpen && (
        <div className="navbar-mobile" role="dialog" aria-label="Menú de navegación">
          <nav>
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} onClick={closeMenu}>{link.label}</a>
            ))}
          </nav>
          <button className="btn btn-primary" onClick={() => { handleWhatsApp(); closeMenu(); }}>
            WhatsApp
          </button>
        </div>
      )}
    </header>
  );
}

export default Navbar;