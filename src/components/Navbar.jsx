import { useState } from "react";
import logo from "../assets/rolosimplificado.webp";
import { openWhatsApp } from "../constants";
import { supabase } from "../lib/supabase";
import { useCurrentClient } from "../hooks/useCurrentClient";
import AuthModal from "./AuthModal";

const INSTAGRAM_URL = "https://www.instagram.com/eldadoerrantecr?igsh=c3QxM2JkYmp5dTJh";

const NAV_LINKS = [
  { href: "#how-it-works", label: "Cómo funciona" },
  { href: "#catalog",      label: "Catálogo" },
  { href: "#pricing",      label: "Precios" },
  { href: "#reservar",     label: "Reservar" },
];

function Navbar() {
  const [isOpen,     setIsOpen]     = useState(false);
  const [showAuth,   setShowAuth]   = useState(false);
  const [showMenu,   setShowMenu]   = useState(false);
  const { session, client } = useCurrentClient();

  const closeMenu = () => setIsOpen(false);
  const firstName = client?.name?.split(" ")[0] ?? session?.user?.email?.split("@")[0];

  return (
    <>
      <header className="navbar">
        <div className="container navbar-content">

          <div className="navbar-left">
            <img src={logo} alt="El Dado Errante" className="navbar-logo" />
          </div>

          <nav className="navbar-links" aria-label="Navegación principal">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href}>{link.label}</a>
            ))}
          </nav>

          <div className="navbar-right">
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer"
              className="navbar-instagram" aria-label="Instagram">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
              </svg>
            </a>

            {session ? (
              <div className="navbar-user-wrapper">
                <button className="navbar-user-btn" onClick={() => setShowMenu(p => !p)}>
                  <span className="navbar-user-avatar">{firstName?.[0]?.toUpperCase()}</span>
                  <span className="navbar-user-name">{firstName}</span>
                  <span style={{ fontSize: "0.7rem", opacity: 0.6 }}>▾</span>
                </button>
                {showMenu && (
                  <div className="navbar-user-menu">
                    <a href="#reservar" className="navbar-user-menu-item" onClick={() => setShowMenu(false)}>
                      Nueva reserva
                    </a>
                    <button className="navbar-user-menu-item danger" onClick={() => { supabase.auth.signOut(); setShowMenu(false); }}>
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button className="btn-auth-navbar" onClick={() => setShowAuth(true)}>
                Iniciar sesión
              </button>
            )}

            <button className="btn btn-primary navbar-cta-desktop" onClick={() => openWhatsApp("Hola, quiero alquilar un juego de mesa")}>
              WhatsApp
            </button>
            <button
              className={`navbar-hamburger${isOpen ? " open" : ""}`}
              onClick={() => setIsOpen(prev => !prev)}
              aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={isOpen}
            >
              <span /><span /><span />
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="navbar-mobile" role="dialog" aria-label="Menú de navegación">
            <nav>
              {NAV_LINKS.map((link) => (
                <a key={link.href} href={link.href} onClick={closeMenu}>{link.label}</a>
              ))}
            </nav>
            {session ? (
              <button className="btn btn-secondary" onClick={() => { supabase.auth.signOut(); closeMenu(); }}>
                Cerrar sesión ({firstName})
              </button>
            ) : (
              <button className="btn btn-secondary" onClick={() => { setShowAuth(true); closeMenu(); }}>
                Iniciar sesión
              </button>
            )}
            <button className="btn btn-primary" onClick={() => { openWhatsApp("Hola, quiero alquilar un juego de mesa"); closeMenu(); }}>
              WhatsApp
            </button>
          </div>
        )}
      </header>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}

export default Navbar;
