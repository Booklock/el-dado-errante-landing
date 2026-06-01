import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const LOYALTY_GOAL = 10;

function LoyaltyBar({ count }) {
  const pct   = Math.min((count / LOYALTY_GOAL) * 100, 100);
  const done  = count >= LOYALTY_GOAL;
  const left  = Math.max(LOYALTY_GOAL - count, 0);

  return (
    <div className="cd-loyalty-card">
      <div className="cd-loyalty-header">
        <span className="cd-loyalty-title">🎁 Cliente frecuente</span>
        <span className="cd-loyalty-count">{Math.min(count, LOYALTY_GOAL)}/{LOYALTY_GOAL}</span>
      </div>
      <div className="cd-loyalty-bar-bg">
        <div className="cd-loyalty-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      {done ? (
        <p className="cd-loyalty-msg cd-loyalty-done">
          🎉 ¡Ganaste un juego gratis! Escribinos por WhatsApp para reclamarlo.
        </p>
      ) : (
        <p className="cd-loyalty-msg">
          Te {left === 1 ? "falta 1 alquiler" : `faltan ${left} alquileres`} para ganarte un juego de mesa sorpresa.
        </p>
      )}
    </div>
  );
}

const STATUS_LABEL = {
  pending:   { label: "Pendiente",  color: "#92400e",  bg: "#fef3c7" },
  active:    { label: "Activa",     color: "#065f46",  bg: "#d1fae5" },
  returned:  { label: "Devuelta",   color: "#3730a3",  bg: "#e0e7ff" },
  cancelled: { label: "Cancelada",  color: "#991b1b",  bg: "#fee2e2" },
};

export default function CustomerDashboard({ client, onBack }) {
  const [reservations, setReservations] = useState([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    if (!client) return;
    supabase
      .from("reservations")
      .select("*, games(name, category)")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => { setReservations(data ?? []); setLoading(false); });
  }, [client]);

  const completed   = reservations.filter(r => r.status === "returned");
  const topGame     = completed.reduce((acc, r) => {
    const n = r.games?.name;
    if (!n) return acc;
    acc[n] = (acc[n] ?? 0) + 1;
    return acc;
  }, {});
  const favoriteGame = Object.entries(topGame).sort((a, b) => b[1] - a[1])[0]?.[0];

  return (
    <div className="cd-page">
      <div className="container">
        <button className="cd-back-btn" onClick={onBack}>← Volver</button>

        <div className="cd-header">
          <div className="cd-avatar">{client.name?.[0]?.toUpperCase()}</div>
          <div>
            <h1 className="cd-title">Hola, {client.name?.split(" ")[0]} 👋</h1>
            <p className="cd-subtitle">{client.email}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="cd-stats-grid">
          <div className="cd-stat-card">
            <p className="cd-stat-value">{completed.length}</p>
            <p className="cd-stat-label">Alquileres completados</p>
          </div>
          <div className="cd-stat-card">
            <p className="cd-stat-value">{reservations.filter(r => r.status === "active").length}</p>
            <p className="cd-stat-label">Alquileres activos</p>
          </div>
          <div className="cd-stat-card">
            <p className="cd-stat-value">{favoriteGame ?? "—"}</p>
            <p className="cd-stat-label">Juego favorito</p>
          </div>
        </div>

        {/* Barra de lealtad */}
        <LoyaltyBar count={completed.length} />

        {/* Historial */}
        <h2 className="cd-section-title">Historial de reservas</h2>

        {loading ? (
          <p style={{ color: "var(--color-text-soft)" }}>Cargando...</p>
        ) : reservations.length === 0 ? (
          <div className="cd-empty">
            <p>🎲 Todavía no tenés reservas.</p>
            <button className="btn btn-primary" onClick={onBack} style={{ marginTop: "0.75rem" }}>
              Hacer mi primera reserva
            </button>
          </div>
        ) : (
          <div className="cd-table-wrapper">
            <table className="cd-table">
              <thead>
                <tr>
                  <th>Juego</th>
                  <th>Inicio</th>
                  <th>Devolución</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map(r => {
                  const s = STATUS_LABEL[r.status] ?? { label: r.status, color: "#374151", bg: "#f3f4f6" };
                  return (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600 }}>{r.games?.name ?? "—"}</td>
                      <td>{r.start_date}</td>
                      <td>{r.end_date}</td>
                      <td>
                        <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700, background: s.bg, color: s.color }}>
                          {s.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
