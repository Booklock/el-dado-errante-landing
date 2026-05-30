import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";

const EMPTY = { name: "", price: "", games_count: "", changes_allowed: "2", description: "", featured: false };

export default function Subscriptions() {
  const [plans,   setPlans]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [form,    setForm]    = useState(null);
  const [saving,  setSaving]  = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("subscription_plans").select("*").order("price");
    setPlans(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleActive(plan) {
    await supabase.from("subscription_plans").update({ active: !plan.active }).eq("id", plan.id);
    setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, active: !p.active } : p));
  }

  async function toggleFeatured(plan) {
    await supabase.from("subscription_plans").update({ featured: !plan.featured }).eq("id", plan.id);
    setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, featured: !p.featured } : p));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name,
      price: parseInt(form.price),
      games_count: parseInt(form.games_count),
      changes_allowed: parseInt(form.changes_allowed),
      description: form.description,
      featured: form.featured,
    };

    if (form.id) {
      await supabase.from("subscription_plans").update(payload).eq("id", form.id);
    } else {
      await supabase.from("subscription_plans").insert(payload);
    }
    setSaving(false);
    setForm(null);
    load();
  }

  async function handleDelete(id) {
    if (!confirm("¿Eliminar este plan?")) return;
    await supabase.from("subscription_plans").delete().eq("id", id);
    setPlans(prev => prev.filter(p => p.id !== id));
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }

  if (loading) return <div className="admin-page-loading">Cargando...</div>;

  return (
    <div className="admin-page">
      <div className="admin-top-bar">
        <h1 className="admin-page-title" style={{ margin: 0 }}>Planes de suscripción</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setForm(EMPTY)}>+ Nuevo plan</button>
      </div>

      {form !== null && (
        <div className="admin-form-panel">
          <h3>{form.id ? "Editar plan" : "Nuevo plan"}</h3>
          <form onSubmit={handleSave}>
            <div className="admin-form-row">
              <div className="form-group">
                <label>Nombre del plan *</label>
                <input name="name" required value={form.name} onChange={handleChange} placeholder="Ej: Jugón" />
              </div>
              <div className="form-group">
                <label>Precio mensual (₡) *</label>
                <input name="price" type="number" required value={form.price} onChange={handleChange} placeholder="15000" />
              </div>
            </div>
            <div className="admin-form-row">
              <div className="form-group">
                <label>Juegos por mes *</label>
                <input name="games_count" type="number" required min="1" value={form.games_count} onChange={handleChange} placeholder="2" />
              </div>
              <div className="form-group">
                <label>Cambios permitidos *</label>
                <input name="changes_allowed" type="number" required min="0" value={form.changes_allowed} onChange={handleChange} placeholder="2" />
              </div>
            </div>
            <div className="form-group">
              <label>Descripción corta</label>
              <input name="description" value={form.description} onChange={handleChange} placeholder="Ej: Para los que siempre quieren algo nuevo" />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.75rem" }}>
              <input name="featured" id="featured" type="checkbox" checked={form.featured} onChange={handleChange} />
              <label htmlFor="featured" style={{ margin: 0, cursor: "pointer", fontSize: "0.9rem" }}>Destacar como "Más popular"</label>
            </div>
            <div className="admin-form-actions">
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                {saving ? "Guardando..." : "Guardar"}
              </button>
              <button type="button" className="btn-ghost" onClick={() => setForm(null)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Plan</th>
              <th>Precio/mes</th>
              <th>Juegos</th>
              <th>Cambios</th>
              <th>Activo</th>
              <th>Destacado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {plans.map(p => (
              <tr key={p.id}>
                <td>
                  <span style={{ fontWeight: 600 }}>{p.name}</span>
                  {p.description && <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-soft)" }}>{p.description}</p>}
                </td>
                <td>₡{p.price.toLocaleString("es-CR")}</td>
                <td style={{ textAlign: "center" }}>{p.games_count}</td>
                <td style={{ textAlign: "center" }}>{p.changes_allowed}</td>
                <td>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={p.active} onChange={() => toggleActive(p)} />
                    <span className="toggle-slider" />
                  </label>
                </td>
                <td>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={p.featured} onChange={() => toggleFeatured(p)} />
                    <span className="toggle-slider" />
                  </label>
                </td>
                <td style={{ display: "flex", gap: "0.5rem" }}>
                  <button className="btn-ghost" onClick={() => setForm(p)}>Editar</button>
                  <button className="btn-danger" onClick={() => handleDelete(p.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
