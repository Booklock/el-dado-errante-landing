import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { fmtDate } from "../lib/formatDate";

const LOYALTY_GOAL = 10;

function LoyaltyBar({ count }) {
  const pct  = Math.min((count / LOYALTY_GOAL) * 100, 100);
  const done = count >= LOYALTY_GOAL;
  const left = Math.max(LOYALTY_GOAL - count, 0);
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
  pending:   { label: "Pendiente",  color: "#92400e", bg: "#fef3c7" },
  active:    { label: "Activa",     color: "#065f46", bg: "#d1fae5" },
  returned:  { label: "Devuelta",   color: "#3730a3", bg: "#e0e7ff" },
  cancelled: { label: "Cancelada",  color: "#991b1b", bg: "#fee2e2" },
};

function EditProfileForm({ client, onSave, onCancel }) {
  const [form,    setForm]    = useState({
    name:     client.name     ?? "",
    phone:    client.phone    ?? "",
    province: client.province ?? "",
    district: client.district ?? "",
    address:  client.address  ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase
      .from("clients")
      .update({ name: form.name, phone: form.phone, province: form.province, district: form.district, address: form.address })
      .eq("id", client.id);
    if (error) {
      setError("No se pudo guardar. Intentá de nuevo.");
    } else {
      onSave(form);
    }
    setLoading(false);
  }

  return (
    <form className="cd-edit-form card" onSubmit={handleSubmit}>
      <h3 className="cd-edit-title">Editar perfil</h3>
      <div className="form-row">
        <div className="form-group">
          <label>Nombre completo</label>
          <input name="name" type="text" required value={form.name} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Teléfono</label>
          <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="8888-8888" />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Provincia</label>
          <input name="province" type="text" value={form.province} onChange={handleChange} placeholder="San José" />
        </div>
        <div className="form-group">
          <label>Cantón / Distrito</label>
          <input name="district" type="text" value={form.district} onChange={handleChange} placeholder="Escazú" />
        </div>
      </div>
      <div className="form-group">
        <label>Dirección exacta</label>
        <input name="address" type="text" value={form.address} onChange={handleChange}
          placeholder="100m norte del parque central" />
      </div>
      {error && <p className="form-error">{error}</p>}
      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}

export default function CustomerDashboard({ client: initialClient, refetch, onBack }) {
  const [client,       setClient]       = useState(initialClient);
  const [reservations, setReservations] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [editing,      setEditing]      = useState(false);

  useEffect(() => {
    setClient(initialClient);
  }, [initialClient]);

  useEffect(() => {
    if (!client) return;
    supabase
      .from("reservations")
      .select("*, games(name, category)")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => { setReservations(data ?? []); setLoading(false); });
  }, [client]);

  function handleSave(updated) {
    setClient(prev => ({ ...prev, ...updated }));
    setEditing(false);
    refetch?.();
  }

  const completed    = reservations.filter(r => r.status === "returned");
  const topGame      = completed.reduce((acc, r) => {
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
          <div style={{ flex: 1 }}>
            <h1 className="cd-title">Hola, {client.name?.split(" ")[0]} 👋</h1>
            <p className="cd-subtitle">{client.email}</p>
          </div>
          <button className="btn btn-secondary" style={{ alignSelf: "center" }}
            onClick={() => setEditing(e => !e)}>
            {editing ? "Cancelar" : "Editar perfil"}
          </button>
        </div>

        {editing && (
          <EditProfileForm
            client={client}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
          />
        )}

        {/* Datos del perfil */}
        {!editing && (
          <div className="cd-profile-card">
            <div className="cd-profile-row">
              <span className="cd-profile-icon">📱</span>
              <span>{client.phone ?? <em style={{ color: "var(--color-text-soft)" }}>Sin teléfono</em>}</span>
            </div>
            {(client.province || client.district) && (
              <div className="cd-profile-row">
                <span className="cd-profile-icon">📍</span>
                <span>{[client.province, client.district].filter(Boolean).join(", ")}</span>
              </div>
            )}
            {client.address && (
              <div className="cd-profile-row">
                <span className="cd-profile-icon">🏠</span>
                <span>{client.address}</span>
              </div>
            )}
          </div>
        )}

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

        <LoyaltyBar count={completed.length} />

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
                      <td>{fmtDate(r.start_date)}</td>
                      <td>{fmtDate(r.end_date)}</td>
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
