import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function GiveawayPage({ onDashboard }) {
  const [giveaway, setGiveaway] = useState(null);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", instagram_handle: "", email: "" });
  const [checked, setChecked] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // null | { tickets } | "error" | "duplicate"

  useEffect(() => {
    async function load() {
      const { data: gws } = await supabase.from("giveaways").select("*").eq("active", true).order("created_at", { ascending: false }).limit(1);
      const gw = gws?.[0] ?? null;
      setGiveaway(gw);
      if (gw) {
        const { data: acts } = await supabase.from("giveaway_actions").select("*").eq("giveaway_id", gw.id).order("sort_order");
        setActions(acts ?? []);
      }
      setLoading(false);
    }
    load();
  }, []);

  const ticketsPreview = actions.filter(a => checked[a.id]).reduce((s, a) => s + a.tickets, 0);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (!form.instagram_handle.trim() && !form.email.trim()) return;
    setSubmitting(true);

    const completedIds = actions.filter(a => checked[a.id]).map(a => a.id);
    const tickets = actions.filter(a => checked[a.id]).reduce((s, a) => s + a.tickets, 0);

    const { error } = await supabase.from("giveaway_entries").insert({
      giveaway_id: giveaway.id,
      name: form.name.trim(),
      instagram_handle: form.instagram_handle.trim() || null,
      email: form.email.trim() || null,
      actions_completed: completedIds,
      tickets_total: Math.max(tickets, 1),
    });

    if (error) {
      setResult(error.code === "23505" ? "duplicate" : "error");
    } else {
      setResult({ tickets: Math.max(tickets, 1) });
    }
    setSubmitting(false);
  }

  if (loading) return (
    <>
      <Navbar onDashboard={onDashboard} />
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p>Cargando...</p>
      </div>
      <Footer />
    </>
  );

  if (!giveaway) return (
    <>
      <Navbar onDashboard={onDashboard} />
      <div className="giveaway-empty">
        <p style={{ fontSize: "3rem" }}>🎲</p>
        <h2>No hay sorteos activos</h2>
        <p>Seguinos en Instagram para enterarte del próximo.</p>
      </div>
      <Footer />
    </>
  );

  return (
    <>
      <Navbar onDashboard={onDashboard} />
      <section className="giveaway-section">
        <div className="giveaway-hero">
          <span className="giveaway-badge">Sorteo activo</span>
          <h1 className="giveaway-title">{giveaway.title}</h1>
          {giveaway.description && <p className="giveaway-desc">{giveaway.description}</p>}
          {giveaway.prize && (
            <div className="giveaway-prize">
              <span className="giveaway-prize-label">Premio</span>
              <span className="giveaway-prize-value">🏆 {giveaway.prize}</span>
            </div>
          )}
          {giveaway.ends_at && <p className="giveaway-ends">Participa antes del {giveaway.ends_at}</p>}
        </div>

        {result ? (
          <div className="giveaway-success">
            {result === "duplicate" ? (
              <>
                <p style={{ fontSize: "2rem" }}>⚠️</p>
                <h3>Ya participaste</h3>
                <p>Ya registramos tu entrada en este sorteo.</p>
              </>
            ) : result === "error" ? (
              <>
                <p style={{ fontSize: "2rem" }}>😕</p>
                <h3>Algo salió mal</h3>
                <p>Intentá de nuevo o contactanos por Instagram.</p>
              </>
            ) : (
              <>
                <p style={{ fontSize: "3rem" }}>🎉</p>
                <h3>¡Estás participando!</h3>
                <p>Tenés <strong>{result.tickets} ticket{result.tickets !== 1 ? "s" : ""}</strong> en el sorteo.</p>
                <p style={{ color: "var(--color-text-soft)", fontSize: "0.9rem" }}>Anunciamos el ganador/a en nuestras redes sociales.</p>
              </>
            )}
          </div>
        ) : (
          <form className="giveaway-form" onSubmit={handleSubmit}>
            <h2 className="giveaway-form-title">Participar</h2>

            {actions.length > 0 && (
              <div className="giveaway-actions">
                <p className="giveaway-actions-label">Completá acciones para sumar tickets:</p>
                {actions.map(a => (
                  <label key={a.id} className={`giveaway-action-item${checked[a.id] ? " checked" : ""}`}>
                    <input type="checkbox" checked={!!checked[a.id]} onChange={() => setChecked(prev => ({ ...prev, [a.id]: !prev[a.id] }))} />
                    <span className="giveaway-action-icon">{a.icon}</span>
                    <span className="giveaway-action-label">{a.label}</span>
                    <span className="giveaway-action-tickets">+{a.tickets} ticket{a.tickets !== 1 ? "s" : ""}</span>
                  </label>
                ))}
                {ticketsPreview > 0 && (
                  <div className="giveaway-tickets-preview">
                    Llevarás <strong>{ticketsPreview} ticket{ticketsPreview !== 1 ? "s" : ""}</strong> al sorteo
                  </div>
                )}
              </div>
            )}

            <div className="form-group">
              <label>Nombre completo *</label>
              <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Tu nombre" />
            </div>
            <div className="form-group">
              <label>Instagram (sin @)</label>
              <input value={form.instagram_handle} onChange={e => setForm(p => ({ ...p, instagram_handle: e.target.value }))} placeholder="tu_usuario" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="tu@email.com" />
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--color-text-soft)", marginBottom: "1rem" }}>Ingresá al menos Instagram o email para poder contactarte si ganás.</p>

            <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "0.9rem" }} disabled={submitting || (!form.instagram_handle.trim() && !form.email.trim())}>
              {submitting ? "Enviando..." : `Participar${ticketsPreview > 0 ? ` · ${ticketsPreview} tickets` : ""}`}
            </button>
          </form>
        )}
      </section>
      <Footer />
    </>
  );
}
