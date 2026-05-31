import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function AuthModal({ onClose }) {
  const [tab,      setTab]      = useState("login");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");
  const [form,     setForm]     = useState({ name: "", phone: "", email: "", password: "" });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setError("");
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
    if (error) {
      if (error.message.includes("Invalid login")) setError("Email o contraseña incorrectos.");
      else if (error.message.includes("Email not confirmed")) setError("Confirmá tu email antes de entrar. Revisá tu bandeja de entrada.");
      else setError("No se pudo iniciar sesión. Intentá de nuevo.");
    } else {
      onClose();
    }
    setLoading(false);
  }

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });

    if (signUpError) {
      if (signUpError.message.includes("already registered") || signUpError.message.includes("already been registered")) {
        setError("Este email ya tiene una cuenta. Iniciá sesión.");
      } else if (signUpError.message.includes("password")) {
        setError("La contraseña debe tener al menos 6 caracteres.");
      } else {
        setError(`Error: ${signUpError.message}`);
      }
      setLoading(false);
      return;
    }

    // Si necesita confirmar email (email confirmation ON en Supabase)
    if (!data.session) {
      setSuccess("Cuenta creada. Revisá tu email para confirmarla antes de entrar.");
      setLoading(false);
      return;
    }

    // Si no necesita confirmar, guardar en clients
    const { error: clientError } = await supabase.from("clients").insert({
      name:         form.name,
      phone:        form.phone,
      email:        form.email,
      auth_user_id: data.user.id,
    });

    if (clientError) {
      // La cuenta se creó igual, solo falló el insert del perfil
      console.error("Client insert error:", clientError);
    }

    onClose();
    setLoading(false);
  }

  return (
    <div className="auth-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="auth-modal">
        <button className="auth-modal-close" onClick={onClose} aria-label="Cerrar">×</button>

        <div className="auth-tabs">
          <button className={`auth-tab${tab === "login" ? " active" : ""}`}
            onClick={() => { setTab("login"); setError(""); setSuccess(""); }}>
            Iniciar sesión
          </button>
          <button className={`auth-tab${tab === "register" ? " active" : ""}`}
            onClick={() => { setTab("register"); setError(""); setSuccess(""); }}>
            Crear cuenta
          </button>
        </div>

        {success ? (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <p style={{ fontSize: "2rem" }}>📬</p>
            <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>¡Cuenta creada!</p>
            <p style={{ color: "var(--color-text-soft)", fontSize: "0.875rem" }}>{success}</p>
            <button className="btn btn-secondary" style={{ marginTop: "1rem" }} onClick={onClose}>
              Cerrar
            </button>
          </div>
        ) : tab === "login" ? (
          <form onSubmit={handleLogin} autoComplete="on">
            <p className="auth-subtitle">Ingresá para llenar tus reservas más rápido.</p>
            <div className="form-group">
              <label htmlFor="auth-email">Email</label>
              <input id="auth-email" name="email" type="email" required
                autoComplete="email"
                value={form.email} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="auth-password">Contraseña</label>
              <input id="auth-password" name="password" type="password" required
                autoComplete="current-password"
                value={form.password} onChange={handleChange} />
            </div>
            {error && <p className="form-error">{error}</p>}
            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </button>
            <p className="auth-switch">
              ¿No tenés cuenta?{" "}
              <button type="button" className="auth-link" onClick={() => { setTab("register"); setError(""); }}>
                Creá una acá
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegister} autoComplete="on">
            <p className="auth-subtitle">Guardá tus datos y reservá más rápido la próxima vez.</p>
            <div className="form-group">
              <label htmlFor="reg-name">Nombre completo *</label>
              <input id="reg-name" name="name" type="text" required
                autoComplete="name"
                value={form.name} onChange={handleChange}
                placeholder="María González" />
            </div>
            <div className="form-group">
              <label htmlFor="reg-phone">Teléfono *</label>
              <input id="reg-phone" name="phone" type="tel" required
                autoComplete="tel"
                value={form.phone} onChange={handleChange}
                placeholder="8888-8888" />
            </div>
            <div className="form-group">
              <label htmlFor="reg-email">Email *</label>
              <input id="reg-email" name="email" type="email" required
                autoComplete="email"
                value={form.email} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="reg-password">Contraseña *</label>
              <input id="reg-password" name="password" type="password" required
                autoComplete="new-password"
                minLength={6} value={form.password} onChange={handleChange}
                placeholder="Mínimo 6 caracteres" />
            </div>
            {error && <p className="form-error">{error}</p>}
            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
            <p className="auth-switch">
              ¿Ya tenés cuenta?{" "}
              <button type="button" className="auth-link" onClick={() => { setTab("login"); setError(""); }}>
                Iniciá sesión
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
