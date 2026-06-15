import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { fmtDate } from "../../lib/formatDate";

const STATUS_LABELS = {
  pending:   { label: "Pendiente",  css: "status-pending" },
  active:    { label: "Activa",     css: "status-active" },
  returned:  { label: "Devuelta",   css: "status-returned" },
  cancelled: { label: "Cancelada",  css: "status-cancelled" },
};

const NEXT_STATUS = {
  pending:  "active",
  active:   "returned",
};

const NEXT_LABEL = {
  pending: "Confirmar entrega",
  active:  "Marcar devuelta",
};

export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [filter,       setFilter]       = useState("all");
  const [loading,      setLoading]      = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("reservations")
      .select("*, clients(name, phone), games(name)")
      .order("start_date", { ascending: false });
    setReservations(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function advance(r) {
    const newStatus = NEXT_STATUS[r.status];
    if (!newStatus) return;
    await supabase.from("reservations").update({ status: newStatus }).eq("id", r.id);
    if (r.game_id) {
      await supabase.from("games").update({ available: newStatus !== "active" }).eq("id", r.game_id);
    }
    load();

    const phone = r.clients?.phone?.replace(/\D/g, "");
    if (!phone) return;

    const game = r.games?.name ?? "el juego";
    if (newStatus === "active") {
      window.open(
        `https://wa.me/506${phone}?text=${encodeURIComponent(`¡Hola ${r.clients?.name ?? ""}! 🎲 Tu reserva de *${game}* está confirmada. Te lo entregamos el *${r.start_date}*. Cualquier consulta estamos por acá.`)}`,
        "_blank"
      );
    } else if (newStatus === "returned") {
      window.open(
        `https://wa.me/506${phone}?text=${encodeURIComponent(`¡Hola ${r.clients?.name ?? ""}! ✅ Registramos la devolución de *${game}*. ¡Gracias! Cuando quieras volver a alquilar, nos avisás 🎲`)}`,
        "_blank"
      );
    }
  }

  async function cancel(id) {
    if (!confirm("¿Cancelar esta reserva?")) return;
    await supabase.from("reservations").update({ status: "cancelled" }).eq("id", id);
    load();
  }

  const filtered = filter === "all" ? reservations : reservations.filter(r => r.status === filter);

  if (loading) return <div className="admin-page-loading">Cargando...</div>;

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Reservas</h1>

      <div className="admin-filters">
        {["all", "pending", "active", "returned", "cancelled"].map(f => (
          <button
            key={f}
            className={`filter-btn${filter === f ? " active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "Todas" : STATUS_LABELS[f]?.label}
          </button>
        ))}
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Juego</th>
              <th>Inicio</th>
              <th>Devolución</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--color-text-soft)", padding: "2rem" }}>Sin reservas</td></tr>
            )}
            {filtered.map(r => {
              const s = STATUS_LABELS[r.status] ?? { label: r.status, css: "" };
              const isOverdue = r.status === "active" && r.end_date < new Date().toISOString().split("T")[0];
              return (
                <tr key={r.id} style={isOverdue ? { background: "#fff5f5" } : {}}>
                  <td>
                    <span style={{ fontWeight: 600 }}>{r.clients?.name ?? "—"}</span>
                    {r.clients?.phone && (
                      <p style={{ margin: 0, fontSize: "0.8rem" }}>
                        <a href={`tel:${r.clients.phone}`} style={{ color: "var(--color-text-soft)", textDecoration: "none" }}>
                          {r.clients.phone}
                        </a>
                      </p>
                    )}
                  </td>
                  <td>{r.games?.name ?? "—"}</td>
                  <td style={{ fontSize: "0.85rem" }}>{fmtDate(r.start_date)}</td>
                  <td style={{ fontSize: "0.85rem", color: isOverdue ? "#dc2626" : "inherit", fontWeight: isOverdue ? 700 : 400 }}>
                    {fmtDate(r.end_date)} {isOverdue && "⚠️"}
                  </td>
                  <td><span className={`status-badge ${s.css}`}>{s.label}</span></td>
                  <td style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    {NEXT_STATUS[r.status] && (
                      <button className="btn btn-primary btn-sm" onClick={() => advance(r)}>
                        {NEXT_LABEL[r.status]}
                      </button>
                    )}
                    {(r.status === "pending" || r.status === "active") && (
                      <button className="btn-danger" onClick={() => cancel(r.id)}>Cancelar</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
