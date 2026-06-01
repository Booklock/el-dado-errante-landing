import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { openWhatsApp } from "../constants";
import { useCurrentClient } from "../hooks/useCurrentClient";
import AuthModal from "./AuthModal";

function ReservationGate({ onOpenAuth }) {
  return (
    <section id="reservar" className="reservation-section">
      <div className="container">
        <span className="section-label">Reservas</span>
        <h2 className="section-title">Reservá tu juego</h2>
        <div className="reservation-gate card">
          <span style={{ fontSize: "2.5rem" }}>🎲</span>
          <h3>Necesitás una cuenta para reservar</h3>
          <p>Creá tu cuenta gratis y tus datos quedan guardados para reservar más rápido siempre.</p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn btn-primary" onClick={onOpenAuth}>Crear cuenta / Iniciar sesión</button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ReservationForm() {
  const { session, client, refetch } = useCurrentClient();
  const [games,        setGames]        = useState([]);
  const [form,         setForm]         = useState({ game_id: "", start_date: "", end_date: "", notes: "" });
  const [coords,       setCoords]       = useState(null);
  const [locStatus,    setLocStatus]    = useState("idle");
  const [submitStatus, setSubmitStatus] = useState("idle");
  const [showAuth,     setShowAuth]     = useState(false);

  useEffect(() => {
    supabase.from("games").select("id, name, price, available")
      .eq("available", true).order("name")
      .then(({ data }) => setGames(data ?? []));
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

  function handleLocation() {
    if (!navigator.geolocation) { setLocStatus("error"); return; }
    setLocStatus("loading");
    navigator.geolocation.getCurrentPosition(
      pos => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocStatus("ok"); },
      ()  => setLocStatus("error"),
      { timeout: 10000 }
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!client) return;
    setSubmitStatus("loading");

    // Actualizar ubicación si la compartió
    if (coords) {
      await supabase.from("clients").update({ lat: coords.lat, lng: coords.lng }).eq("id", client.id);
      refetch();
    }

    const { error } = await supabase.from("reservations").insert({
      client_id:  client.id,
      game_id:    form.game_id   || null,
      start_date: form.start_date,
      end_date:   form.end_date,
      notes:      form.notes     || null,
      status:     "pending",
    });

    if (error) { setSubmitStatus("error"); return; }
    setSubmitStatus("success");

    const selectedGame = games.find(g => g.id === form.game_id);
    openWhatsApp(`Hola! Acabo de hacer una reserva 🎲\n\n*Nombre:* ${client.name}\n*Teléfono:* ${client.phone ?? "—"}\n*Juego:* ${selectedGame?.name ?? "Por confirmar"}\n*Desde:* ${form.start_date}\n*Hasta:* ${form.end_date}${client.address ? `\n*Dirección:* ${client.address}` : ""}`);
  }

  // No logueado
  if (!session) {
    return (
      <>
        <ReservationGate onOpenAuth={() => setShowAuth(true)} />
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </>
    );
  }

  // Éxito
  if (submitStatus === "success") {
    return (
      <section id="reservar" className="reservation-section">
        <div className="container">
          <div className="reservation-success card">
            <span className="reservation-success-icon">🎲</span>
            <h3>¡Reserva enviada!</h3>
            <p>Te vamos a confirmar por WhatsApp en unos minutos.</p>
            <button className="btn btn-secondary" onClick={() => { setForm({ game_id: "", start_date: "", end_date: "", notes: "" }); setCoords(null); setLocStatus("idle"); setSubmitStatus("idle"); }}>
              Hacer otra reserva
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="reservar" className="reservation-section">
      <div className="container">
        <span className="section-label">Reservas</span>
        <h2 className="section-title">Reservá tu juego</h2>
        <p className="section-description">Completá el formulario y te confirmamos por WhatsApp.</p>

        {/* Resumen de datos del cliente */}
        <div className="reservation-client-summary">
          <div className="reservation-client-info">
            <span className="reservation-client-avatar">{client?.name?.[0]?.toUpperCase()}</span>
            <div>
              <p style={{ fontWeight: 700, margin: 0 }}>{client?.name ?? "—"}</p>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-soft)" }}>
                {client?.phone ?? "Sin teléfono"} · {client?.province ?? "Sin provincia"}
              </p>
            </div>
          </div>
        </div>

        <form className="reservation-form card" onSubmit={handleSubmit}>
          <fieldset className="form-fieldset">
            <legend className="form-legend">Tu reserva</legend>
            <div className="form-group">
              <label htmlFor="game_id">Juego</label>
              <select id="game_id" name="game_id" value={form.game_id} onChange={handleChange}>
                <option value="">No estoy seguro todavía</option>
                {games.map(g => (
                  <option key={g.id} value={g.id}>{g.name} — ₡{g.price.toLocaleString("es-CR")}</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="start_date">Fecha de inicio *</label>
                <input id="start_date" name="start_date" type="date" required
                  value={form.start_date} onChange={handleChange}
                  min={new Date().toISOString().split("T")[0]} />
              </div>
              <div className="form-group">
                <label htmlFor="end_date">Devolución (4 días después)</label>
                <input id="end_date" type="date" readOnly value={form.end_date}
                  style={{ background: "#f9f6f1", color: "var(--color-text-soft)", cursor: "default" }} />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="notes">Notas</label>
              <textarea id="notes" name="notes" rows={2}
                value={form.notes} onChange={handleChange}
                placeholder="Ej: Tengo evento el sábado, necesito el juego el viernes." />
            </div>
          </fieldset>

          <fieldset className="form-fieldset">
            <legend className="form-legend">Ubicación de entrega</legend>
            {client?.address && (
              <p style={{ margin: "0 0 0.75rem", fontSize: "0.875rem", color: "var(--color-text-soft)" }}>
                📍 {client.address}{client.district ? `, ${client.district}` : ""}
              </p>
            )}
            <div className="location-btn-wrapper">
              <button type="button" className="btn-location" onClick={handleLocation} disabled={locStatus === "loading"}>
                {locStatus === "loading" && "Obteniendo ubicación..."}
                {locStatus === "idle"    && (client?.lat ? "📍 Actualizar mi ubicación GPS" : "📍 Compartir mi ubicación exacta (opcional)")}
                {locStatus === "ok"      && "✅ Ubicación actualizada"}
                {locStatus === "error"   && "❌ No se pudo obtener la ubicación"}
              </button>
              {locStatus === "ok" && <p className="location-hint">Vamos a poder abrirla en Waze directamente.</p>}
            </div>
          </fieldset>

          {submitStatus === "error" && (
            <p className="form-error">Hubo un error. Intentá de nuevo o escribinos por WhatsApp.</p>
          )}

          <button type="submit" className="btn btn-primary reservation-submit" disabled={submitStatus === "loading"}>
            {submitStatus === "loading" ? "Enviando..." : "Confirmar reserva"}
          </button>
        </form>
      </div>
    </section>
  );
}
