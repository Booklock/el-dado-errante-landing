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

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [search,  setSearch]  = useState("");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("client_overview")
      .select("*")
      .order("created_at", { ascending: false });
    setClients(data ?? []);
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
      <div className="admin-top-bar">
        <h1 className="admin-page-title" style={{ margin: 0 }}>Clientes</h1>
        <input
          className="admin-search"
          placeholder="Buscar por nombre o teléfono..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Alerta de sorpresas pendientes */}
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
                    <span style={{ fontWeight: 600 }}>{c.name}</span>
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

                {/* Perfil expandido */}
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
