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

function fmt(n) {
  return `₡${Number(n ?? 0).toLocaleString("es-CR")}`;
}

function NewReservationModal({ onClose, onCreated }) {
  const [allClients,    setAllClients]    = useState([]);
  const [allGames,      setAllGames]      = useState([]);
  const [clientSearch,  setClientSearch]  = useState("");
  const [gameSearch,    setGameSearch]    = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedGames,  setSelectedGames]  = useState([]);
  const [priceOverride,  setPriceOverride]  = useState(null);
  const [editingPrice,   setEditingPrice]   = useState(false);
  const [dates,          setDates]          = useState({ start_date: "", end_date: "" });
  const [notes,          setNotes]          = useState("");
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState("");

  useEffect(() => {
    Promise.all([
      supabase.from("clients").select("id, name, phone").order("name"),
      supabase.from("games").select("id, name, price, available").order("name"),
    ]).then(([{ data: c }, { data: g }]) => {
      setAllClients(c ?? []);
      setAllGames(g ?? []);
    });
  }, []);

  const autoTotal = selectedGames.reduce((s, g) => s + (g.price ?? 0), 0);
  const finalPrice = priceOverride !== null ? priceOverride : autoTotal;
  const discount   = autoTotal - finalPrice;

  function handleDateChange(e) {
    const { name, value } = e.target;
    if (name === "start_date" && value) {
      const end = new Date(value);
      end.setDate(end.getDate() + 4);
      setDates({ start_date: value, end_date: end.toISOString().split("T")[0] });
    } else {
      setDates(prev => ({ ...prev, [name]: value }));
    }
  }

  function addGame(game) {
    if (selectedGames.find(g => g.id === game.id)) return;
    setSelectedGames(prev => [...prev, game]);
    setGameSearch("");
    setPriceOverride(null);
  }

  function removeGame(id) {
    setSelectedGames(prev => prev.filter(g => g.id !== id));
    setPriceOverride(null);
  }

  const filteredClients = clientSearch
    ? allClients.filter(c => c.name?.toLowerCase().includes(clientSearch.toLowerCase()) || c.phone?.includes(clientSearch))
    : allClients;

  const filteredGames = gameSearch
    ? allGames.filter(g => g.name?.toLowerCase().includes(gameSearch.toLowerCase()) && !selectedGames.find(s => s.id === g.id))
    : [];

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedClient) { setError("Seleccioná un cliente."); return; }
    if (!dates.start_date) { setError("Seleccioná una fecha de inicio."); return; }
    setLoading(true);
    setError("");
    const { error } = await supabase.from("reservations").insert({
      client_id:   selectedClient.id,
      game_id:     selectedGames[0]?.id || null,
      game_ids:    selectedGames.map(g => g.id),
      total_price: finalPrice || null,
      start_date:  dates.start_date,
      end_date:    dates.end_date,
      notes:       notes || null,
      status:      "pending",
    });
    if (error) {
      setError("No se pudo crear la reserva.");
    } else {
      onCreated();
      onClose();
    }
    setLoading(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Nueva reserva</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>

          {/* Cliente */}
          <div className="form-group">
            <label>Cliente *</label>
            <input type="text" placeholder="Buscar por nombre o teléfono..."
              value={clientSearch}
              onChange={e => { setClientSearch(e.target.value); setSelectedClient(null); }} />
            {clientSearch && !selectedClient && (
              <div className="client-dropdown">
                {filteredClients.slice(0, 6).map(c => (
                  <div key={c.id} className="client-dropdown-item"
                    onClick={() => { setSelectedClient(c); setClientSearch(`${c.name}${c.phone ? ` · ${c.phone}` : ""}`); }}>
                    <span style={{ fontWeight: 600 }}>{c.name}</span>
                    {c.phone && <span style={{ color: "var(--color-text-soft)", fontSize: "0.85rem", marginLeft: "0.5rem" }}>{c.phone}</span>}
                  </div>
                ))}
                {filteredClients.length === 0 && <div style={{ padding: "0.75rem", color: "var(--color-text-soft)", fontSize: "0.875rem" }}>Sin resultados</div>}
              </div>
            )}
            {selectedClient && <p style={{ margin: "0.35rem 0 0", fontSize: "0.8rem", color: "#065f46" }}>✅ {selectedClient.name}</p>}
          </div>

          {/* Juegos */}
          <div className="form-group">
            <label>Juegos</label>
            <input type="text" placeholder="Buscar juego para agregar..."
              value={gameSearch}
              onChange={e => setGameSearch(e.target.value)} />
            {gameSearch && (
              <div className="client-dropdown">
                {filteredGames.slice(0, 6).map(g => (
                  <div key={g.id} className="client-dropdown-item" onClick={() => addGame(g)}>
                    <span style={{ fontWeight: 600 }}>{g.name}</span>
                    <span style={{ color: "var(--color-text-soft)", fontSize: "0.82rem", marginLeft: "0.5rem" }}>
                      {fmt(g.price)}{!g.available ? " · Alquilado" : ""}
                    </span>
                  </div>
                ))}
                {filteredGames.length === 0 && <div style={{ padding: "0.75rem", color: "var(--color-text-soft)", fontSize: "0.875rem" }}>Sin resultados</div>}
              </div>
            )}

            {/* Juegos seleccionados */}
            {selectedGames.length > 0 && (
              <div className="selected-games">
                {selectedGames.map(g => (
                  <div key={g.id} className="selected-game-chip">
                    <span className="selected-game-name">{g.name}</span>
                    <span className="selected-game-price">{fmt(g.price)}</span>
                    <button type="button" className="selected-game-remove" onClick={() => removeGame(g.id)}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Precio */}
          {selectedGames.length > 0 && (
            <div className="price-section">
              <div className="price-row">
                <span className="price-label">Total calculado</span>
                <span className="price-auto">{fmt(autoTotal)}</span>
              </div>
              {editingPrice ? (
                <div className="price-row" style={{ alignItems: "center", gap: "0.5rem" }}>
                  <span className="price-label">Total a cobrar</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1, justifyContent: "flex-end" }}>
                    <span style={{ fontWeight: 600, color: "var(--color-text-soft)" }}>₡</span>
                    <input
                      type="number" min="0" step="50"
                      value={priceOverride ?? autoTotal}
                      onChange={e => setPriceOverride(Number(e.target.value))}
                      style={{ width: 110, textAlign: "right", fontWeight: 700, padding: "0.3rem 0.5rem", borderRadius: 8, border: "1.5px solid var(--color-primary)" }}
                      autoFocus
                    />
                    <button type="button" className="btn btn-secondary btn-sm"
                      style={{ padding: "0.3rem 0.75rem", fontSize: "0.8rem" }}
                      onClick={() => { setEditingPrice(false); if (priceOverride === autoTotal) setPriceOverride(null); }}>
                      Listo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="price-row">
                  <span className="price-label">Total a cobrar</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <span className="price-final">{fmt(finalPrice)}</span>
                    <button type="button" className="price-edit-btn" onClick={() => setEditingPrice(true)}>✏️ Editar</button>
                  </div>
                </div>
              )}
              {discount > 0 && (
                <p className="price-discount">🏷️ Descuento aplicado: {fmt(discount)}</p>
              )}
            </div>
          )}

          {/* Fechas */}
          <div className="form-row">
            <div className="form-group">
              <label>Fecha de inicio *</label>
              <input name="start_date" type="date" required value={dates.start_date} onChange={handleDateChange}
                min={new Date().toISOString().split("T")[0]} />
            </div>
            <div className="form-group">
              <label>Devolución (auto)</label>
              <input type="date" readOnly value={dates.end_date}
                style={{ background: "#f9f6f1", color: "var(--color-text-soft)", cursor: "default" }} />
            </div>
          </div>

          <div className="form-group">
            <label>Notas</label>
            <textarea name="notes" rows={2} value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Detalles de entrega, dirección, etc." />
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
  const [gamesMap,     setGamesMap]     = useState({});
  const [filter,       setFilter]       = useState("all");
  const [loading,      setLoading]      = useState(true);
  const [showNew,      setShowNew]      = useState(false);

  const load = useCallback(async () => {
    const [{ data: resv }, { data: games }] = await Promise.all([
      supabase.from("reservations")
        .select("*, clients(name, phone), games(name, price)")
        .order("start_date", { ascending: false }),
      supabase.from("games").select("id, name, price"),
    ]);
    const map = Object.fromEntries((games ?? []).map(g => [g.id, g]));
    setGamesMap(map);
    setReservations(resv ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function getGameNames(r) {
    if (r.game_ids?.length > 0) {
      const names = r.game_ids.map(id => gamesMap[id]?.name).filter(Boolean);
      return names.length ? names.join(", ") : r.games?.name ?? "—";
    }
    return r.games?.name ?? "—";
  }

  function getTotal(r) {
    if (r.total_price != null) return r.total_price;
    if (r.game_ids?.length > 0) return r.game_ids.reduce((s, id) => s + (gamesMap[id]?.price ?? 0), 0);
    return r.games?.price ?? null;
  }

  async function advance(r) {
    const newStatus = NEXT_STATUS[r.status];
    if (!newStatus) return;
    await supabase.from("reservations").update({ status: newStatus }).eq("id", r.id);

    const ids = r.game_ids?.length ? r.game_ids : (r.game_id ? [r.game_id] : []);
    if (ids.length) {
      await supabase.from("games").update({ available: newStatus !== "active" }).in("id", ids);
    }
    load();

    const phone = r.clients?.phone?.replace(/\D/g, "");
    if (!phone) return;
    const gameLabel = r.game_ids?.length > 1
      ? `los juegos`
      : `*${r.games?.name ?? "el juego"}*`;

    if (newStatus === "active") {
      window.open(
        `https://wa.me/506${phone}?text=${encodeURIComponent(`¡Hola ${r.clients?.name ?? ""}! 🎲 Tu reserva de ${gameLabel} está confirmada. Te lo entregamos el *${r.start_date}*. Cualquier consulta estamos por acá.`)}`,
        "_blank"
      );
    } else if (newStatus === "returned") {
      window.open(
        `https://wa.me/506${phone}?text=${encodeURIComponent(`¡Hola ${r.clients?.name ?? ""}! ✅ Registramos la devolución de ${gameLabel}. ¡Gracias! Cuando quieras volver a alquilar, nos avisás 🎲`)}`,
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
          <button key={f} className={`filter-btn${filter === f ? " active" : ""}`} onClick={() => setFilter(f)}>
            {f === "all" ? "Todas" : STATUS_LABELS[f]?.label}
          </button>
        ))}
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Juegos</th>
              <th>Inicio</th>
              <th>Devolución</th>
              <th style={{ textAlign: "right" }}>Total</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--color-text-soft)", padding: "2rem" }}>Sin reservas</td></tr>
            )}
            {filtered.map(r => {
              const s        = STATUS_LABELS[r.status] ?? { label: r.status, css: "" };
              const isOverdue = r.status === "active" && r.end_date < new Date().toISOString().split("T")[0];
              const total    = getTotal(r);
              const gameNames = getGameNames(r);
              const isPack   = r.game_ids?.length > 1;
              return (
                <tr key={r.id} style={isOverdue ? { background: "#fff5f5" } : {}}>
                  <td>
                    <span style={{ fontWeight: 600 }}>{r.clients?.name ?? "—"}</span>
                    {r.clients?.phone && (
                      <p style={{ margin: 0, fontSize: "0.8rem" }}>
                        <a href={`tel:${r.clients.phone}`} style={{ color: "var(--color-text-soft)", textDecoration: "none" }}>{r.clients.phone}</a>
                      </p>
                    )}
                  </td>
                  <td style={{ fontSize: "0.85rem", maxWidth: 180 }}>
                    {isPack && <span className="pack-badge">Pack {r.game_ids.length}🎲</span>}
                    <span style={{ display: "block", color: isPack ? "var(--color-text-soft)" : "inherit", fontSize: isPack ? "0.78rem" : "inherit" }}>
                      {gameNames}
                    </span>
                  </td>
                  <td style={{ fontSize: "0.85rem" }}>{fmtDate(r.start_date)}</td>
                  <td style={{ fontSize: "0.85rem", color: isOverdue ? "#dc2626" : "inherit", fontWeight: isOverdue ? 700 : 400 }}>
                    {fmtDate(r.end_date)} {isOverdue && "⚠️"}
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 700, color: "#065f46", fontSize: "0.9rem" }}>
                    {total != null ? fmt(total) : "—"}
                  </td>
                  <td><span className={`status-badge ${s.css}`}>{s.label}</span></td>
                  <td style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    {NEXT_STATUS[r.status] && (
                      <button className="btn btn-primary btn-sm" onClick={() => advance(r)}>{NEXT_LABEL[r.status]}</button>
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
