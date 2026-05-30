import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { openWhatsApp } from "../constants";

const CR_PROVINCES = [
  "San José", "Alajuela", "Cartago", "Heredia",
  "Guanacaste", "Puntarenas", "Limón",
];

const EMPTY_FORM = {
  name: "", phone: "", email: "",
  province: "", district: "", address: "",
  game_id: "", start_date: "", end_date: "",
  notes: "",
};

function ReservationForm() {
  const [form, setForm]       = useState(EMPTY_FORM);
  const [games, setGames]     = useState([]);
  const [coords, setCoords]   = useState(null);
  const [locStatus, setLocStatus] = useState("idle"); // idle | loading | ok | error
  const [submitStatus, setSubmitStatus] = useState("idle"); // idle | loading | success | error

  useEffect(() => {
    supabase.from("games").select("id, name, category, price, available")
      .eq("available", true)
      .order("name")
      .then(({ data }) => setGames(data ?? []));
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleLocation() {
    if (!navigator.geolocation) {
      setLocStatus("error");
      return;
    }
    setLocStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocStatus("ok");
      },
      () => setLocStatus("error"),
      { timeout: 10000 }
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitStatus("loading");

    // 1. Crear o buscar cliente por teléfono
    let clientId;
    const { data: existing } = await supabase
      .from("clients")
      .select("id")
      .eq("phone", form.phone)
      .maybeSingle();

    if (existing) {
      clientId = existing.id;
      // Actualizar datos si ya existe
      await supabase.from("clients").update({
        name: form.name,
        email: form.email || null,
        province: form.province || null,
        district: form.district || null,
        address: form.address || null,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
      }).eq("id", clientId);
    } else {
      const { data: newClient, error: clientError } = await supabase
        .from("clients")
        .insert({
          name: form.name,
          phone: form.phone,
          email: form.email || null,
          province: form.province || null,
          district: form.district || null,
          address: form.address || null,
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
        })
        .select("id")
        .single();

      if (clientError) { setSubmitStatus("error"); return; }
      clientId = newClient.id;
    }

    // 2. Crear reserva
    const { error: resError } = await supabase.from("reservations").insert({
      client_id: clientId,
      game_id: form.game_id || null,
      start_date: form.start_date,
      end_date: form.end_date,
      notes: form.notes || null,
      status: "pending",
    });

    if (resError) { setSubmitStatus("error"); return; }

    setSubmitStatus("success");

    // 3. También notificar por WhatsApp (flujo actual)
    const selectedGame = games.find((g) => g.id === form.game_id);
    const msg = `Hola! Acabo de hacer una reserva 🎲\n\n*Nombre:* ${form.name}\n*Teléfono:* ${form.phone}\n*Juego:* ${selectedGame?.name ?? "Por confirmar"}\n*Desde:* ${form.start_date}\n*Hasta:* ${form.end_date}${form.address ? `\n*Dirección:* ${form.address}` : ""}`;
    openWhatsApp(msg);
  }

  if (submitStatus === "success") {
    return (
      <section id="reservar" className="reservation-section">
        <div className="container">
          <div className="reservation-success card">
            <span className="reservation-success-icon">🎲</span>
            <h3>¡Reserva enviada!</h3>
            <p>Te vamos a confirmar por WhatsApp en unos minutos.</p>
            <button className="btn btn-secondary" onClick={() => { setForm(EMPTY_FORM); setCoords(null); setLocStatus("idle"); setSubmitStatus("idle"); }}>
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
        <p className="section-description">
          Completá el formulario y te confirmamos por WhatsApp.
        </p>

        <form className="reservation-form card" onSubmit={handleSubmit}>

          {/* Datos personales */}
          <fieldset className="form-fieldset">
            <legend className="form-legend">Tus datos</legend>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Nombre completo *</label>
                <input id="name" name="name" type="text" required
                  value={form.name} onChange={handleChange}
                  placeholder="Ej: María González" />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Teléfono *</label>
                <input id="phone" name="phone" type="tel" required
                  value={form.phone} onChange={handleChange}
                  placeholder="Ej: 8888-8888" />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Correo electrónico</label>
              <input id="email" name="email" type="email"
                value={form.email} onChange={handleChange}
                placeholder="Opcional" />
            </div>
          </fieldset>

          {/* Ubicación */}
          <fieldset className="form-fieldset">
            <legend className="form-legend">¿Dónde estás?</legend>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="province">Provincia</label>
                <select id="province" name="province" value={form.province} onChange={handleChange}>
                  <option value="">Seleccioná...</option>
                  {CR_PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="district">Cantón / Distrito</label>
                <input id="district" name="district" type="text"
                  value={form.district} onChange={handleChange}
                  placeholder="Ej: Escazú" />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="address">Dirección de entrega</label>
              <input id="address" name="address" type="text"
                value={form.address} onChange={handleChange}
                placeholder="Ej: 200m norte del parque central" />
            </div>

            {/* Botón de ubicación GPS */}
            <div className="location-btn-wrapper">
              <button type="button" className="btn-location" onClick={handleLocation} disabled={locStatus === "loading"}>
                {locStatus === "loading" && "Obteniendo ubicación..."}
                {locStatus === "idle"    && "📍 Compartir mi ubicación exacta (opcional)"}
                {locStatus === "ok"      && "✅ Ubicación guardada"}
                {locStatus === "error"   && "❌ No se pudo obtener la ubicación"}
              </button>
              {locStatus === "ok" && (
                <p className="location-hint">Vamos a poder abrirla en Waze directamente.</p>
              )}
            </div>
          </fieldset>

          {/* Juego y fechas */}
          <fieldset className="form-fieldset">
            <legend className="form-legend">Tu reserva</legend>

            <div className="form-group">
              <label htmlFor="game_id">Juego que querés alquilar</label>
              <select id="game_id" name="game_id" value={form.game_id} onChange={handleChange}>
                <option value="">No estoy seguro todavía</option>
                {games.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} — ₡{g.price.toLocaleString("es-CR")}
                  </option>
                ))}
              </select>
              {games.length === 0 && (
                <p className="form-hint">Cargando juegos disponibles...</p>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="start_date">Fecha de inicio *</label>
                <input id="start_date" name="start_date" type="date" required
                  value={form.start_date} onChange={handleChange}
                  min={new Date().toISOString().split("T")[0]} />
              </div>
              <div className="form-group">
                <label htmlFor="end_date">Fecha de devolución *</label>
                <input id="end_date" name="end_date" type="date" required
                  value={form.end_date} onChange={handleChange}
                  min={form.start_date || new Date().toISOString().split("T")[0]} />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notas adicionales</label>
              <textarea id="notes" name="notes" rows={3}
                value={form.notes} onChange={handleChange}
                placeholder="Ej: Tengo un evento el sábado, necesito el juego el viernes." />
            </div>
          </fieldset>

          {submitStatus === "error" && (
            <p className="form-error">Hubo un error al enviar. Intentá de nuevo o escribinos por WhatsApp.</p>
          )}

          <button type="submit" className="btn btn-primary reservation-submit" disabled={submitStatus === "loading"}>
            {submitStatus === "loading" ? "Enviando..." : "Confirmar reserva"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default ReservationForm;
