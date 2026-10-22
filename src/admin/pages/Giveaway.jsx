import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";

const EMPTY_GIVEAWAY = { title: "", description: "", prize: "", ends_at: "" };
const EMPTY_ACTION = { label: "", tickets: 1, icon: "⭐" };

function RaffleModal({ entries, onClose }) {
  const [phase, setPhase] = useState("spinning"); // spinning | winner
  const [displayName, setDisplayName] = useState("");
  const [winner, setWinner] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    const pool = [];
    entries.forEach(e => {
      for (let i = 0; i < e.tickets_total; i++) pool.push(e);
    });
    if (pool.length === 0) { onClose(); return; }
    const picked = pool[Math.floor(Math.random() * pool.length)];

    let speed = 80;
    let ticks = 0;
    const maxTicks = 40;

    function tick() {
      const random = pool[Math.floor(Math.random() * pool.length)];
      setDisplayName(random.name);
      ticks++;
      if (ticks >= maxTicks) {
        clearInterval(intervalRef.current);
        setDisplayName(picked.name);
        setWinner(picked);
        setPhase("winner");
        return;
      }
      const progress = ticks / maxTicks;
      speed = 80 + progress * progress * 1200;
      clearInterval(intervalRef.current);
      intervalRef.current = setTimeout(tick, speed);
    }

    intervalRef.current = setTimeout(tick, speed);
    return () => clearTimeout(intervalRef.current);
  }, []);

  return (
    <div className="raffle-overlay" onClick={phase === "winner" ? onClose : undefined}>
      <div className="raffle-modal" onClick={e => e.stopPropagation()}>
        {phase === "spinning" && (
          <>
            <p className="raffle-spinning-label">🎲 Sorteando...</p>
            <div className="raffle-slot">{displayName}</div>
          </>
        )}
        {phase === "winner" && (
          <>
            <div className="confetti-burst">🎉</div>
            <p className="raffle-winner-label">¡Ganador/a!</p>
            <div className="raffle-winner-name">{winner.name}</div>
            {winner.instagram_handle && <p className="raffle-winner-ig">@{winner.instagram_handle}</p>}
            <p className="raffle-winner-tickets">{winner.tickets_total} tickets</p>
            <button className="btn btn-primary" style={{ marginTop: "1.5rem" }} onClick={onClose}>Cerrar</button>
          </>
        )}
      </div>
    </div>
  );
}

export default function Giveaway() {
  const [giveaways, setGiveaways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list"); // list | new | detail
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_GIVEAWAY);
  const [actions, setActions] = useState([]);
  const [newAction, setNewAction] = useState(EMPTY_ACTION);
  const [entries, setEntries] = useState([]);
  const [saving, setSaving] = useState(false);
  const [raffle, setRaffle] = useState(false);

  async function loadAll() {
    const { data } = await supabase.from("giveaways").select("*").order("created_at", { ascending: false });
    setGiveaways(data ?? []);
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  async function openDetail(gw) {
    setSelected(gw);
    const [{ data: acts }, { data: ents }] = await Promise.all([
      supabase.from("giveaway_actions").select("*").eq("giveaway_id", gw.id).order("sort_order"),
      supabase.from("giveaway_entries").select("*").eq("giveaway_id", gw.id).order("tickets_total", { ascending: false }),
    ]);
    setActions(acts ?? []);
    setEntries(ents ?? []);
    setView("detail");
  }

  async function handleCreate() {
    if (!form.title.trim()) return;
    setSaving(true);
    const { data: gw } = await supabase.from("giveaways").insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      prize: form.prize.trim() || null,
      ends_at: form.ends_at || null,
    }).select().single();
    if (gw && actions.length > 0) {
      await supabase.from("giveaway_actions").insert(
        actions.map((a, i) => ({ ...a, giveaway_id: gw.id, sort_order: i }))
      );
    }
    await loadAll();
    setView("list");
    setSaving(false);
  }

  function addAction() {
    if (!newAction.label.trim()) return;
    setActions(prev => [...prev, { ...newAction, tickets: parseInt(newAction.tickets) || 1 }]);
    setNewAction(EMPTY_ACTION);
  }

  async function toggleActive(gw) {
    await supabase.from("giveaways").update({ active: !gw.active }).eq("id", gw.id);
    loadAll();
  }

  async function deleteGiveaway(id) {
    if (!confirm("¿Eliminar este sorteo y todas sus entradas?")) return;
    await supabase.from("giveaways").delete().eq("id", id);
    loadAll();
    if (view === "detail") setView("list");
  }

  async function saveWinner(entry) {
    await supabase.from("giveaways").update({ winner_name: entry.name, winner_entry: entry.id, active: false }).eq("id", selected.id);
    setSelected(prev => ({ ...prev, winner_name: entry.name, winner_entry: entry.id, active: false }));
    loadAll();
  }

  if (loading) return <div className="admin-section"><p>Cargando...</p></div>;

  // NEW GIVEAWAY FORM
  if (view === "new") {
    return (
      <div className="admin-section">
        <div className="admin-section-header">
          <h2>Nuevo sorteo</h2>
          <button className="btn btn-secondary" onClick={() => setView("list")}>← Volver</button>
        </div>
        <div className="admin-form-card">
          <div className="form-group">
            <label>Título *</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Ej: Sorteo de octubre" />
          </div>
          <div className="form-group">
            <label>Descripción</label>
            <textarea rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Breve descripción del sorteo..." />
          </div>
          <div className="form-group">
            <label>Premio</label>
            <input value={form.prize} onChange={e => setForm(p => ({ ...p, prize: e.target.value }))} placeholder="Ej: Una noche de juegos para 4 personas" />
          </div>
          <div className="form-group">
            <label>Fecha límite</label>
            <input type="date" value={form.ends_at} onChange={e => setForm(p => ({ ...p, ends_at: e.target.value }))} />
          </div>

          <div className="form-group">
            <label>Acciones (cada una suma tickets)</label>
            <div className="buy-vendor-input-row" style={{ flexWrap: "wrap" }}>
              <input placeholder="Ej: Seguir en Instagram" style={{ flex: 2 }} value={newAction.label} onChange={e => setNewAction(p => ({ ...p, label: e.target.value }))} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addAction(); }}} />
              <input type="number" min="1" placeholder="Tickets" style={{ maxWidth: 90 }} value={newAction.tickets} onChange={e => setNewAction(p => ({ ...p, tickets: e.target.value }))} />
              <input placeholder="Ícono" style={{ maxWidth: 70 }} value={newAction.icon} onChange={e => setNewAction(p => ({ ...p, icon: e.target.value }))} />
              <button type="button" className="btn btn-secondary" onClick={addAction}>+ Agregar</button>
            </div>
            {actions.length > 0 && (
              <div className="buy-vendor-list" style={{ marginTop: "0.5rem" }}>
                {actions.map((a, i) => (
                  <div key={i} className="buy-vendor-item">
                    <span>{a.icon}</span>
                    <strong style={{ flex: 1 }}>{a.label}</strong>
                    <span className="buy-vendor-price">{a.tickets} ticket{a.tickets !== 1 ? "s" : ""}</span>
                    <button className="buy-vendor-remove" onClick={() => setActions(prev => prev.filter((_, idx) => idx !== i))}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
            <button className="btn btn-secondary" onClick={() => setView("list")} disabled={saving}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>{saving ? "Guardando..." : "Crear sorteo"}</button>
          </div>
        </div>
      </div>
    );
  }

  // DETAIL VIEW
  if (view === "detail" && selected) {
    const totalTickets = entries.reduce((s, e) => s + e.tickets_total, 0);
    return (
      <div className="admin-section">
        {raffle && <RaffleModal entries={entries} onClose={() => { setRaffle(false); }} />}
        <div className="admin-section-header">
          <h2>{selected.title}</h2>
          <button className="btn btn-secondary" onClick={() => setView("list")}>← Volver</button>
        </div>

        <div className="gw-detail-grid">
          <div className="admin-form-card">
            <p style={{ margin: 0, color: "var(--color-text-soft)", fontSize: "0.85rem" }}>Estado</p>
            <p style={{ margin: "0.25rem 0 0.75rem", fontWeight: 600 }}>{selected.active ? "🟢 Activo" : "🔴 Inactivo"}</p>
            {selected.prize && <><p style={{ margin: 0, color: "var(--color-text-soft)", fontSize: "0.85rem" }}>Premio</p><p style={{ margin: "0.25rem 0 0.75rem" }}>{selected.prize}</p></>}
            {selected.ends_at && <><p style={{ margin: 0, color: "var(--color-text-soft)", fontSize: "0.85rem" }}>Fecha límite</p><p style={{ margin: "0.25rem 0 0.75rem" }}>{selected.ends_at}</p></>}
            {selected.winner_name && <><p style={{ margin: 0, color: "var(--color-text-soft)", fontSize: "0.85rem" }}>Ganador</p><p style={{ margin: "0.25rem 0 0.75rem", fontWeight: 700, color: "#f59e0b" }}>🏆 {selected.winner_name}</p></>}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button className="btn btn-secondary btn-sm" onClick={() => toggleActive(selected)}>
                {selected.active ? "Desactivar" : "Activar"}
              </button>
              <button className="btn-danger btn-sm" onClick={() => deleteGiveaway(selected.id)}>Eliminar</button>
            </div>
          </div>

          <div className="admin-form-card">
            <h3 style={{ marginTop: 0 }}>Acciones</h3>
            {actions.length === 0 && <p style={{ color: "var(--color-text-soft)", fontSize: "0.85rem" }}>Sin acciones definidas.</p>}
            {actions.map(a => (
              <div key={a.id} className="buy-vendor-item">
                <span>{a.icon}</span>
                <span style={{ flex: 1 }}>{a.label}</span>
                <span className="buy-vendor-price">{a.tickets} ticket{a.tickets !== 1 ? "s" : ""}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-form-card" style={{ marginTop: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <h3 style={{ margin: 0 }}>Participantes ({entries.length}) · {totalTickets} tickets totales</h3>
            {entries.length > 0 && (
              <button className="btn btn-primary" onClick={() => setRaffle(true)}>🎲 Realizar sorteo</button>
            )}
          </div>
          {entries.length === 0 ? (
            <p style={{ color: "var(--color-text-soft)", fontSize: "0.85rem" }}>Aún no hay participantes.</p>
          ) : (
            <div className="gw-entries-table">
              <div className="gw-entries-header">
                <span>Nombre</span>
                <span>Instagram</span>
                <span>Email</span>
                <span style={{ textAlign: "right" }}>Tickets</span>
                {!selected.winner_name && <span></span>}
              </div>
              {entries.map(e => (
                <div key={e.id} className={`gw-entry-row${selected.winner_entry === e.id ? " gw-winner-row" : ""}`}>
                  <span>{selected.winner_entry === e.id ? "🏆 " : ""}{e.name}</span>
                  <span>{e.instagram_handle ? `@${e.instagram_handle}` : "—"}</span>
                  <span style={{ fontSize: "0.8rem" }}>{e.email || "—"}</span>
                  <span style={{ textAlign: "right", fontWeight: 600 }}>{e.tickets_total}</span>
                  {!selected.winner_name && (
                    <button className="btn btn-secondary" style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem" }} onClick={() => saveWinner(e)}>
                      Marcar ganador
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // LIST
  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2>Sorteos / Giveaways</h2>
        <button className="btn btn-primary" onClick={() => { setForm(EMPTY_GIVEAWAY); setActions([]); setView("new"); }}>+ Nuevo sorteo</button>
      </div>

      {giveaways.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-soft)" }}>
          <p style={{ fontSize: "2rem" }}>🎲</p>
          <p>No hay sorteos todavía.</p>
        </div>
      ) : (
        <div className="sn-grid">
          {giveaways.map(gw => (
            <div key={gw.id} className="sn-card card">
              <div className="sn-card-header">
                <span className="sn-type-icon">{gw.active ? "🟢" : "🔴"}</span>
                <h3 className="sn-card-title">{gw.title}</h3>
                <div style={{ display: "flex", gap: "0.35rem", marginLeft: "auto" }}>
                  <button className="btn btn-secondary" style={{ padding: "0.25rem 0.6rem", fontSize: "0.78rem" }} onClick={() => openDetail(gw)}>Ver</button>
                </div>
              </div>
              {gw.prize && <p className="sn-card-content">🏆 {gw.prize}</p>}
              {gw.winner_name && <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem", color: "#f59e0b", fontWeight: 600 }}>Ganador: {gw.winner_name}</p>}
              <p className="sn-card-date">{gw.ends_at ? `Hasta: ${gw.ends_at}` : gw.created_at?.split("T")[0]}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
