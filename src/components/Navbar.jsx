import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/rolosimplificado.webp";
import { supabase } from "../lib/supabase";
import { useCurrentClient } from "../hooks/useCurrentClient";
import AuthModal from "./AuthModal";

const INSTAGRAM_URL = "https://www.instagram.com/eldadoerrantecr?igsh=c3QxM2JkYmp5dTJh";

const CATALOG_ITEMS = [
  { to: "/catalogo",            label: "Ver todos" },
  { to: "/catalogo/party",      label: "🎉 Party Games" },
  { to: "/catalogo/parejas",    label: "💑 Para Parejas" },
  { to: "/catalogo/estrategia", label: "♟️ Estrategia" },
];

const PRECIOS_ITEMS = [
  { href: "/#pricing",          label: "Alquiler" },
  { to: "/precios/membresias",  label: "Membresías" },
  { to: "/precios/combos",      label: "Combos y promos" },
];

export default function Navbar({ onDashboard, onBack }) {
  const [isOpen,       setIsOpen]       = useState(false);
  const [showAuth,     setShowAuth]     = useState(false);
  const [showMenu,     setShowMenu]     = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const navRef = useRef(null);
  const { session, client } = useCurrentClient();

  const firstName = client?.name?.split(" ")[0] ?? session?.user?.email?.split("@")[0];

  useEffect(() => {
    function handleClickOutside(e) {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenDropdown(null);
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const closeAll = () => { setIsOpen(false); setOpenDropdown(null); onBack?.(); };

  return (
    <>
      <header className="navbar" ref={navRef}>
        <div className="container navbar-content">

          <div className="navbar-left">
            <Link to="/" style={{ display: "flex" }} onClick={closeAll}>
              <img src={logo} alt="El Dado Errante" className="navbar-logo" />
            </Link>
          </div>

          <nav className="navbar-links" aria-label="Navegación principal">
            <a href="/#how-it-works" onClick={closeAll}>Cómo funciona</a>

            {/* Catálogo dropdown */}
            <div className="nav-dropdown-wrapper">
              <button
                className="nav-dropdown-trigger"
                onClick={() => setOpenDropdown(p => p === "catalog" ? null : "catalog")}
                aria-expanded={openDropdown === "catalog"}
              >
                Catálogo <span className="nav-dropdown-caret">▾</span>
              </button>
              {openDropdown === "catalog" && (
                <div className="nav-dropdown">
                  {CATALOG_ITEMS.map(item => (
                    <Link key={item.to} to={item.to} className="nav-dropdown-item" onClick={closeAll}>
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Precios dropdown */}
            <div className="nav-dropdown-wrapper">
              <button
                className="nav-dropdown-trigger"
                onClick={() => setOpenDropdown(p => p === "precios" ? null : "precios")}
                aria-expanded={openDropdown === "precios"}
              >
                Precios <span className="nav-dropdown-caret">▾</span>
              </button>
              {openDropdown === "precios" && (
                <div className="nav-dropdown">
                  {PRECIOS_ITEMS.map(item => (
                    item.to ? (
                      <Link key={item.to} to={item.to} className="nav-dropdown-item" onClick={closeAll}>
                        {item.label}
                      </Link>
                    ) : (
                      <a key={item.href} href={item.href} className="nav-dropdown-item" onClick={closeAll}>
                        {item.label}
                      </a>
                    )
                  ))}
                </div>
              )}
            </div>

            <a href="/#reservar" onClick={closeAll}>Reservar</a>
          </nav>

          <div className="navbar-right">
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer"
              className="navbar-instagram" aria-label="Instagram">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                    <button className="navbar-user-menu-item" onClick={() => { onDashboard?.(); setShowMenu(false); }}>
                      Mi historial
                    </button>
                    <a href="/#reservar" className="navbar-user-menu-item" onClick={() => { onBack?.(); setShowMenu(false); }}>
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

            <button
              className={`navbar-hamburger${isOpen ? " open" : ""}`}
              onClick={() => setIsOpen(p => !p)}
              aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
            >
              <span /><span /><span />
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="navbar-mobile" role="dialog" aria-label="Menú de navegación">
            <nav>
              <a href="/#how-it-works" onClick={closeAll}>Cómo funciona</a>

              <div className="mobile-nav-group">
                <button
                  className="mobile-nav-group-label"
                  onClick={() => setOpenDropdown(p => p === "catalog-m" ? null : "catalog-m")}
                >
                  Catálogo {openDropdown === "catalog-m" ? "▴" : "▾"}
                </button>
                {openDropdown === "catalog-m" && CATALOG_ITEMS.map(item => (
                  <Link key={item.to} to={item.to} className="mobile-nav-sub" onClick={closeAll}>
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="mobile-nav-group">
                <button
                  className="mobile-nav-group-label"
                  onClick={() => setOpenDropdown(p => p === "precios-m" ? null : "precios-m")}
                >
                  Precios {openDropdown === "precios-m" ? "▴" : "▾"}
                </button>
                {openDropdown === "precios-m" && PRECIOS_ITEMS.map(item => (
                  item.to ? (
                    <Link key={item.to} to={item.to} className="mobile-nav-sub" onClick={closeAll}>
                      {item.label}
                    </Link>
                  ) : (
                    <a key={item.href} href={item.href} className="mobile-nav-sub" onClick={closeAll}>
                      {item.label}
                    </a>
                  )
                ))}
              </div>

              <a href="/#reservar" onClick={closeAll}>Reservar</a>

              {session && (
                <button
                  style={{ background: "none", border: "none", textAlign: "left", cursor: "pointer", padding: "0.5rem 0", fontSize: "1rem", fontFamily: "Poppins, sans-serif" }}
                  onClick={() => { onDashboard?.(); closeAll(); }}
                >
                  Mi historial
                </button>
              )}
            </nav>
            {session ? (
              <button className="btn btn-secondary" onClick={() => { supabase.auth.signOut(); closeAll(); }}>
                Cerrar sesión ({firstName})
              </button>
            ) : (
              <button className="btn btn-secondary" onClick={() => { setShowAuth(true); closeAll(); }}>
                Iniciar sesión
              </button>
            )}
          </div>
        )}
      </header>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
