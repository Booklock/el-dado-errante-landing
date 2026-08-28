import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";

function LoyaltyBar({ count }) {
  const pct = Math.min((count / 10) * 100, 100);
  const done = count >= 10;
  return (
    <div className="loyalty-bar-wrapper">
      <div className="loyalty-bar-bg">
        <div className="loyalty-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="loyalty-text">{Math.min(count, 10)}/10</span>
      {done && <span className="loyalty-reward" title="¡Sorpresa pendiente!">🎁</span>}
    </div>
  );
}

function NewClientModal({ onClose, onCreated }) {
  const [form,    setForm]    = useState({ name: "", phone: "", email: "", province: "", notes: "" });
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
    const { error } = await supabase.from("clients").insert({
      name:     form.name,
      phone:    form.phone     || null,
      email:    form.email     || null,
      province: form.province  || null,
      notes:    form.notes     || null,
    });
    if (error) {
      setError("No se pudo crear el cliente. Revisá que el email no esté duplicado.");
    } else {
      onCreated();
      onClose();
    }
    setLoading(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Nuevo cliente temporal</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <p style={{ margin: "0 0 1.25rem", fontSize: "0.875rem", color: "var(--color-text-soft)" }}>
          Creá un perfil con datos básicos. Si el cliente se registra después con el mismo teléfono o email, sus reservas se van a vincular automáticamente.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Nombre completo *</label>
              <input name="name" type="text" required value={form.name} onChange={handleChange} placeholder="Ana García" />
            </div>
            <div className="form-group">
              <label>Teléfono *</label>
              <input name="phone" type="tel" required value={form.phone} onChange={handleChange} placeholder="8888-8888" />
            </div>
          </div>
          <div className="form-group">
            <label>Email (opcional)</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="ana@email.com" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Provincia (opcional)</label>
              <input name="province" type="text" value={form.province} onChange={handleChange} placeholder="San José" />
            </div>
            <div className="form-group">
              <label>Notas (opcional)</label>
              <input name="notes" type="text" value={form.notes} onChange={handleChange} placeholder="Cliente frecuente, referido por..." />
            </div>
          </div>
          {error && <p className="form-error">{error}</p>}
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1rem" }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Creando..." : "Crear cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Clients() {
  const [clients,  setClients]  = useState([]);
  const [search,   setSearch]   = useState("");
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [showNew,  setShowNew]  = useState(false);

  const load = useCallback(async () => {
    const [{ data: overview }, { data: linked }] = await Promise.all([
      supabase.from("client_overview").select("*").order("created_at", { ascending: false }),
      supabase.from("clients").select("id, auth_user_id"),
    ]);
    const linkedMap = Object.fromEntries((linked ?? []).map(c => [c.id, c.auth_user_id]));
    setClients((overview ?? []).map(c => ({ ...c, auth_user_id: linkedMap[c.id] ?? null })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function markSurprise(id) {
    await supabase.from("clients").update({ loyalty_notified_at: new Date().toISOString() }).eq("id", id);
    load();
  }

  const filtered = clients.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
  );

  if (loading) return <div className="admin-page-loading">Cargando...</div>;

  return (
    <div className="admin-page">
      {showNew && <NewClientModal onClose={() => setShowNew(false)} onCreated={load} />}

      <div className="admin-top-bar">
        <h1 className="admin-page-title" style={{ margin: 0 }}>Clientes</h1>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <input
            className="admin-search"
            placeholder="Buscar por nombre o teléfono..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}>
            + Nuevo cliente
          </button>
        </div>
      </div>

      {clients.filter(c => c.loyalty_reward_pending).length > 0 && (
        <div style={{ background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: "12px", padding: "0.75rem 1rem", marginBottom: "1rem", fontSize: "0.875rem", fontWeight: 600 }}>
          🎁 {clients.filter(c => c.loyalty_reward_pending).length} cliente(s) calificaron para la sorpresa de los 10 alquileres
        </div>
      )}

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Provincia</th>
              <th>Alquileres</th>
              <th>Favorito</th>
              <th>Último alquiler</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--color-text-soft)", padding: "2rem" }}>Sin clientes</td></tr>
            )}
            {filtered.map(c => (
              <>
                <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600 }}>{c.name}</span>
                      {!c.auth_user_id && (
                        <span className="client-temp-badge">Sin cuenta</span>
                      )}
                    </div>
                    {c.phone && (
                      <p style={{ margin: 0, fontSize: "0.8rem" }}>
                        <a href={`tel:${c.phone}`} style={{ color: "var(--color-text-soft)", textDecoration: "none" }} onClick={e => e.stopPropagation()}>
                          {c.phone}
                        </a>
                      </p>
                    )}
                  </td>
                  <td style={{ fontSize: "0.85rem", color: "var(--color-text-soft)" }}>
                    {c.province ?? "—"}
                  </td>
                  <td><LoyaltyBar count={c.total_rentals ?? 0} /></td>
                  <td style={{ fontSize: "0.85rem" }}>
                    {c.favorite_game
                      ? <span>{c.favorite_game}<br /><span style={{ color: "var(--color-text-soft)", fontSize: "0.75rem" }}>{c.favorite_category}</span></span>
                      : <span style={{ color: "var(--color-text-soft)" }}>—</span>
                    }
                  </td>
                  <td style={{ fontSize: "0.85rem", color: "var(--color-text-soft)" }}>
                    {c.last_rental_date ?? "—"}
                  </td>
                  <td style={{ display: "flex", gap: "0.5rem", alignItems: "center" }} onClick={e => e.stopPropagation()}>
                    {c.waze_link && (
                      <a href={c.waze_link} target="_blank" rel="noopener noreferrer" className="agenda-waze agenda-link" style={{ fontSize: "0.8rem" }}>
                        📍 Waze
                      </a>
                    )}
                    {c.loyalty_reward_pending && (
                      <button className="btn btn-primary btn-sm" onClick={() => markSurprise(c.id)}>
                        🎁 Entregar sorpresa
                      </button>
                    )}
                  </td>
                </tr>

                {expanded === c.id && (
                  <tr key={`${c.id}-detail`}>
                    <td colSpan={6} style={{ background: "#faf8f3", padding: "1rem 1.5rem" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem" }}>
                        <div>
                          <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-text-soft)" }}>Email</p>
                          <p style={{ margin: 0, fontSize: "0.9rem" }}>{c.email ?? "—"}</p>
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-text-soft)" }}>Dirección</p>
                          <p style={{ margin: 0, fontSize: "0.9rem" }}>{c.address ?? "—"}</p>
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-text-soft)" }}>Cantón</p>
                          <p style={{ margin: 0, fontSize: "0.9rem" }}>{c.district ?? "—"}</p>
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-text-soft)" }}>Notas</p>
                          <p style={{ margin: 0, fontSize: "0.9rem" }}>{c.notes ?? "—"}</p>
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-text-soft)" }}>Estado cuenta</p>
                          <p style={{ margin: 0, fontSize: "0.9rem" }}>
                            {c.auth_user_id
                              ? <span style={{ color: "#065f46", fontWeight: 600 }}>✅ Cuenta activa</span>
                              : <span style={{ color: "#92400e" }}>⏳ Sin cuenta (temporal)</span>
                            }
                          </p>
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-text-soft)" }}>Cliente desde</p>
                          <p style={{ margin: 0, fontSize: "0.9rem" }}>{c.created_at?.split("T")[0] ?? "—"}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
