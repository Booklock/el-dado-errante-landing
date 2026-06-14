import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function ResetPasswordModal({ onClose }) {
  const [password,  setPassword]  = useState("");
  const [password2, setPassword2] = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [done,      setDone]      = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== password2) { setError("Las contraseñas no coinciden."); return; }
    if (password.length < 6)    { setError("Mínimo 6 caracteres."); return; }
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError("No se pudo actualizar la contraseña. Intentá de nuevo.");
    } else {
      setDone(true);
    }
    setLoading(false);
  }

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal">
        {done ? (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <p style={{ fontSize: "2rem" }}>✅</p>
            <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>¡Contraseña actualizada!</p>
            <p style={{ color: "var(--color-text-soft)", fontSize: "0.875rem" }}>
              Ya podés usar tu nueva contraseña para entrar.
            </p>
            <button className="btn btn-primary" style={{ marginTop: "1rem" }} onClick={onClose}>
              Continuar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 style={{ marginBottom: "0.25rem", fontSize: "1.25rem" }}>Nueva contraseña</h2>
            <p className="auth-subtitle">Elegí una contraseña nueva para tu cuenta.</p>
            <div className="form-group">
              <label htmlFor="new-password">Nueva contraseña</label>
              <input id="new-password" type="password" required minLength={6}
                autoComplete="new-password" placeholder="Mínimo 6 caracteres"
                value={password} onChange={e => { setPassword(e.target.value); setError(""); }} />
            </div>
            <div className="form-group">
              <label htmlFor="new-password2">Repetir contraseña</label>
              <input id="new-password2" type="password" required minLength={6}
                autoComplete="new-password" placeholder="Igual que la anterior"
                value={password2} onChange={e => { setPassword2(e.target.value); setError(""); }} />
            </div>
            {error && <p className="form-error">{error}</p>}
            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar contraseña"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
