import { useState } from "react";
import { supabase } from "../lib/supabase";
import Dashboard    from "./pages/Dashboard";
import Games        from "./pages/Games";
import Packs        from "./pages/Packs";
import Subscriptions from "./pages/Subscriptions";
import Reservations from "./pages/Reservations";
import Clients      from "./pages/Clients";

const NAV = [
  { key: "dashboard",     label: "Inicio",        icon: "🏠" },
  { key: "reservations",  label: "Reservas",       icon: "📋" },
  { key: "games",         label: "Juegos",         icon: "🎲" },
  { key: "packs",         label: "Packs",          icon: "📦" },
  { key: "subscriptions", label: "Planes",         icon: "⭐" },
  { key: "clients",       label: "Clientes",       icon: "👥" },
];

const PAGES = { dashboard: Dashboard, reservations: Reservations, games: Games, packs: Packs, subscriptions: Subscriptions, clients: Clients };

export default function Layout() {
  const [section, setSection] = useState("dashboard");
  const Page = PAGES[section];

  return (
    <div className="admin-container">
      {/* Sidebar desktop */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">🎲 El Dado Errante</div>
        <nav className="admin-nav">
          {NAV.map(item => (
            <button
              key={item.key}
              className={`admin-nav-item${section === item.key ? " active" : ""}`}
              onClick={() => setSection(item.key)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <button className="admin-logout" onClick={() => supabase.auth.signOut()}>
          ← Salir
        </button>
      </aside>

      {/* Contenido */}
      <main className="admin-main">
        <Page />
      </main>

      {/* Bottom nav móvil */}
      <nav className="admin-bottom-nav">
        {NAV.map(item => (
          <button
            key={item.key}
            className={`admin-bottom-nav-item${section === item.key ? " active" : ""}`}
            onClick={() => setSection(item.key)}
          >
            <span className="bottom-nav-icon">{item.icon}</span>
            <span className="bottom-nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
