import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";

function StatCard({ label, value }) {
  return (
    <div className="admin-stat-card">
      <p className="stat-value">{value}</p>
      <p className="stat-label">{label}</p>
    </div>
  );
}

function AgendaCard({ r, action, onAction }) {
  const waze = r.clients?.lat
    ? `https://waze.com/ul?ll=${r.clients.lat},${r.clients.lng}&navigate=yes`
    : null;
  return (
    <div className="agenda-card">
      <div className="agenda-card-header">
        <div>
          <p className="agenda-client-name">{r.clients?.name ?? "—"}</p>
          <p className="agenda-game-name">{r.games?.name ?? "Juego por confirmar"}</p>
        </div>
        <button
          className={`btn ${action === "deliver" ? "btn-primary" : "btn-secondary"} agenda-action-btn`}
          onClick={() => onAction(r.id, r.game_id, action)}
        >
          {action === "deliver" ? "Entregar" : "Recoger"}
        </button>
      </div>
      <div className="agenda-card-footer">
        {r.clients?.phone && (
          <a href={`tel:${r.clients.phone}`} className="agenda-link">📞 {r.clients.phone}</a>
        )}
        {waze && (
          <a href={waze} target="_blank" rel="noopener noreferrer" className="agenda-link agenda-waze">
            📍 Waze
          </a>
        )}
        {r.clients?.address && <p className="agenda-address">{r.clients.address}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats,     setStats]     = useState({ available: 0, rented: 0, pending: 0, clients: 0 });
  const [toDeliver, setToDeliver] = useState([]);
  const [toPickup,  setToPickup]  = useState([]);
  const [overdue,   setOverdue]   = useState([]);
  const [loading,   setLoading]   = useState(true);

  const today = new Date().toISOString().split("T")[0];

  const load = useCallback(async () => {
    const [gRes, rRes, cRes] = await Promise.all([
      supabase.from("games").select("available"),
      supabase.from("reservations")
        .select("id, game_id, start_date, end_date, status, clients(name, phone, address, lat, lng), games(name)")
        .in("status", ["pending", "active"]),
      supabase.from("clients").select("id", { count: "exact", head: true }),
    ]);

    const games = gRes.data ?? [];
    const res   = rRes.data ?? [];

    setStats({
      available: games.filter(g => g.available).length,
      rented:    games.filter(g => !g.available).length,
      pending:   res.filter(r => r.status === "pending").length,
      clients:   cRes.count ?? 0,
    });
    setToDeliver(res.filter(r => r.start_date === today && r.status === "pending"));
    setToPickup( res.filter(r => r.end_date   === today && r.status === "active"));
    setOverdue(  res.filter(r => r.end_date    < today  && r.status === "active"));
    setLoading(false);
  }, [today]);

  useEffect(() => { load(); }, [load]);

  async function handleAction(id, gameId, action) {
    const newStatus = action === "deliver" ? "active" : "returned";
    await supabase.from("reservations").update({ status: newStatus }).eq("id", id);
    if (gameId) {
      await supabase.from("games").update({ available: action !== "deliver" }).eq("id", gameId);
    }
    load();
  }

  if (loading) return <div className="admin-page-loading">Cargando...</div>;

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Panel de control</h1>

      <div className="admin-stats-grid">
        <StatCard label="Disponibles"  value={stats.available} />
        <StatCard label="Alquilados"   value={stats.rented} />
        <StatCard label="Pendientes"   value={stats.pending} />
        <StatCard label="Clientes"     value={stats.clients} />
      </div>

      <div className="admin-agenda-grid">
        <div>
          <h2 className="admin-section-title">
            🚀 Juegos a dejar hoy
            {toDeliver.length > 0 && <span className="admin-badge">{toDeliver.length}</span>}
          </h2>
          {toDeliver.length === 0
            ? <p className="admin-empty">Sin entregas hoy</p>
            : toDeliver.map(r => <AgendaCard key={r.id} r={r} action="deliver" onAction={handleAction} />)
          }
        </div>
        <div>
          <h2 className="admin-section-title">
            📥 Juegos a recoger hoy
            {toPickup.length > 0 && <span className="admin-badge">{toPickup.length}</span>}
          </h2>
          {toPickup.length === 0
            ? <p className="admin-empty">Sin recogidas hoy</p>
            : toPickup.map(r => <AgendaCard key={r.id} r={r} action="pickup" onAction={handleAction} />)
          }
        </div>
      </div>

      {overdue.length > 0 && (
        <div className="admin-overdue">
          <h2 className="admin-section-title">⚠️ Vencidas — recoger urgente <span className="admin-badge">{overdue.length}</span></h2>
          {overdue.map(r => <AgendaCard key={r.id} r={r} action="pickup" onAction={handleAction} />)}
        </div>
      )}
    </div>
  );
}
