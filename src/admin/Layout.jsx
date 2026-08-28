import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import Dashboard     from "./pages/Dashboard";
import Games         from "./pages/Games";
import Packs         from "./pages/Packs";
import Subscriptions from "./pages/Subscriptions";
import Reservations  from "./pages/Reservations";
import Clients       from "./pages/Clients";
import Finances      from "./pages/Finances";

const NAV = [
  { key: "dashboard",     label: "Inicio",    icon: "🏠" },
  { key: "reservations",  label: "Reservas",  icon: "📋" },
  { key: "games",         label: "Juegos",    icon: "🎲" },
  { key: "packs",         label: "Packs",     icon: "📦" },
  { key: "subscriptions", label: "Planes",    icon: "⭐" },
  { key: "clients",       label: "Clientes",  icon: "👥" },
  { key: "finances",      label: "Finanzas",  icon: "💰" },
];

const PAGES = { dashboard: Dashboard, reservations: Reservations, games: Games, packs: Packs, subscriptions: Subscriptions, clients: Clients, finances: Finances };

export default function Layout() {
  const [section, setSection] = useState("dashboard");
  const [pending, setPending] = useState(0);
  const Page = PAGES[section];

  useEffect(() => {
    async function fetchPending() {
      const { count } = await supabase
        .from("reservations")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      setPending(count ?? 0);
    }
    fetchPending();
    const interval = setInterval(fetchPending, 30000);
    return () => clearInterval(interval);
  }, []);

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
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.key === "reservations" && pending > 0 && (
                <span className="admin-badge">{pending}</span>
              )}
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
            <span className="bottom-nav-icon" style={{ position: "relative" }}>
              {item.icon}
              {item.key === "reservations" && pending > 0 && (
                <span className="admin-badge admin-badge-mobile">{pending}</span>
              )}
            </span>
            <span className="bottom-nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
