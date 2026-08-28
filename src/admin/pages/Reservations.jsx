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

function NewReservationModal({ onClose, onCreated }) {
  const [clients,      setClients]      = useState([]);
  const [games,        setGames]        = useState([]);
  const [clientSearch, setClientSearch] = useState("");
  const [form,         setForm]         = useState({ client_id: "", game_id: "", start_date: "", end_date: "", notes: "" });
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");

  useEffect(() => {
    Promise.all([
      supabase.from("clients").select("id, name, phone").order("name"),
      supabase.from("games").select("id, name, price, available").order("name"),
    ]).then(([{ data: c }, { data: g }]) => {
      setClients(c ?? []);
      setGames(g ?? []);
    });
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === "start_date" && value) {
      const end = new Date(value);
      end.setDate(end.getDate() + 4);
      setForm(prev => ({ ...prev, start_date: value, end_date: end.toISOString().split("T")[0] }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.client_id) { setError("Seleccioná un cliente."); return; }
    if (!form.start_date) { setError("Seleccioná una fecha de inicio."); return; }
    setLoading(true);
    setError("");
    const { error } = await supabase.from("reservations").insert({
      client_id:  form.client_id,
      game_id:    form.game_id   || null,
      start_date: form.start_date,
      end_date:   form.end_date,
      notes:      form.notes     || null,
      status:     "pending",
    });
    if (error) {
      setError("No se pudo crear la reserva.");
    } else {
      onCreated();
      onClose();
    }
    setLoading(false);
  }

  const filteredClients = clientSearch
    ? clients.filter(c => c.name?.toLowerCase().includes(clientSearch.toLowerCase()) || c.phone?.includes(clientSearch))
    : clients;

  const selectedClient = clients.find(c => c.id === form.client_id);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Nueva reserva</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Cliente *</label>
            <input
              type="text"
              placeholder="Buscar cliente por nombre o teléfono..."
              value={clientSearch}
              onChange={e => { setClientSearch(e.target.value); setForm(prev => ({ ...prev, client_id: "" })); }}
            />
            {clientSearch && !selectedClient && (
              <div className="client-dropdown">
                {filteredClients.slice(0, 8).map(c => (
                  <div key={c.id} className="client-dropdown-item"
                    onClick={() => { setForm(prev => ({ ...prev, client_id: c.id })); setClientSearch(`${c.name}${c.phone ? ` · ${c.phone}` : ""}`); }}>
                    <span style={{ fontWeight: 600 }}>{c.name}</span>
                    {c.phone && <span style={{ color: "var(--color-text-soft)", fontSize: "0.85rem", marginLeft: "0.5rem" }}>{c.phone}</span>}
                  </div>
                ))}
                {filteredClients.length === 0 && (
                  <div style={{ padding: "0.75rem", color: "var(--color-text-soft)", fontSize: "0.875rem" }}>Sin resultados</div>
                )}
              </div>
            )}
            {selectedClient && (
              <p style={{ margin: "0.35rem 0 0", fontSize: "0.8rem", color: "#065f46" }}>
                ✅ {selectedClient.name}{selectedClient.phone ? ` · ${selectedClient.phone}` : ""}
              </p>
            )}
          </div>

          <div className="form-group">
            <label>Juego</label>
            <select name="game_id" value={form.game_id} onChange={handleChange}>
              <option value="">Sin definir todavía</option>
              {games.map(g => (
                <option key={g.id} value={g.id}>
                  {g.name} — ₡{g.price?.toLocaleString("es-CR")} {g.available ? "" : "(Alquilado)"}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Fecha de inicio *</label>
              <input name="start_date" type="date" required value={form.start_date} onChange={handleChange}
                min={new Date().toISOString().split("T")[0]} />
            </div>
            <div className="form-group">
              <label>Devolución (auto)</label>
              <input type="date" readOnly value={form.end_date}
                style={{ background: "#f9f6f1", color: "var(--color-text-soft)", cursor: "default" }} />
            </div>
          </div>

          <div className="form-group">
            <label>Notas</label>
            <textarea name="notes" rows={2} value={form.notes} onChange={handleChange}
              placeholder="Detalles de entrega, coordenadas, etc." />
          </div>

          {error && <p className="form-error">{error}</p>}
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1rem" }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Creando..." : "Crear reserva"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [filter,       setFilter]       = useState("all");
  const [loading,      setLoading]      = useState(true);
  const [showNew,      setShowNew]      = useState(false);

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
      {showNew && <NewReservationModal onClose={() => setShowNew(false)} onCreated={load} />}

      <div className="admin-top-bar">
        <h1 className="admin-page-title" style={{ margin: 0 }}>Reservas</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}>
          + Nueva reserva
        </button>
      </div>

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
