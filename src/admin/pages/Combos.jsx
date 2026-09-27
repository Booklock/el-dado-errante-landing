import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

const EMPTY = { title: "", description: "", price: "", items: [], active: true, image_url: "" };

export default function Combos() {
  const [combos,  setCombos]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState(EMPTY);
  const [newItem, setNewItem] = useState("");
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState(null);

  async function load() {
    const { data } = await supabase.from("combos").select("*").order("created_at", { ascending: false });
    setCombos(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setForm(EMPTY);
    setNewItem("");
    setEditing("new");
    setMsg(null);
  }

  function openEdit(combo) {
    setForm({ ...combo, price: String(combo.price), items: combo.items ?? [] });
    setNewItem("");
    setEditing(combo.id);
    setMsg(null);
  }

  function addItem() {
    const t = newItem.trim();
    if (!t) return;
    setForm(prev => ({ ...prev, items: [...prev.items, t] }));
    setNewItem("");
  }

  function removeItem(i) {
    setForm(prev => ({ ...prev, items: prev.items.filter((_, idx) => idx !== i) }));
  }

  async function handleSave() {
    if (!form.title.trim()) { setMsg("El título es requerido."); return; }
    setSaving(true);
    const payload = {
      title:       form.title.trim(),
      description: form.description.trim() || null,
      price:       parseInt(form.price) || 0,
      items:       form.items,
      active:      form.active,
      image_url:   form.image_url.trim() || null,
    };
    const { error } = editing === "new"
      ? await supabase.from("combos").insert(payload)
      : await supabase.from("combos").update(payload).eq("id", editing);
    if (error) { setMsg("Error al guardar: " + error.message); setSaving(false); return; }
    await load();
    setEditing(null);
    setSaving(false);
  }

  async function handleDelete(id) {
    if (!confirm("¿Eliminar este combo?")) return;
    await supabase.from("combos").delete().eq("id", id);
    load();
  }

  async function toggleActive(combo) {
    await supabase.from("combos").update({ active: !combo.active }).eq("id", combo.id);
    load();
  }

  if (loading) return <div className="admin-section"><p>Cargando...</p></div>;

  if (editing !== null) {
    return (
      <div className="admin-section">
        <div className="admin-section-header">
          <h2>{editing === "new" ? "Nuevo combo" : "Editar combo"}</h2>
          <button className="btn btn-secondary" onClick={() => setEditing(null)}>← Volver</button>
        </div>

        <div className="admin-form-card">
          {msg && <p className="form-error" style={{ marginBottom: "1rem" }}>{msg}</p>}

          <div className="form-group">
            <label>Título *</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Ej: Pack fin de semana" />
          </div>

          <div className="form-group">
            <label>Descripción</label>
            <textarea rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Breve descripción del combo" />
          </div>

          <div className="form-group">
            <label>Precio (₡)</label>
            <input type="number" min="0" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="Ej: 12000" />
          </div>

          <div className="form-group">
            <label>URL de imagen (opcional)</label>
            <input value={form.image_url} onChange={e => setForm(p => ({ ...p, image_url: e.target.value }))} placeholder="https://..." />
          </div>

          <div className="form-group">
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
              <input type="checkbox" checked={form.active} onChange={e => setForm(p => ({ ...p, active: e.target.checked }))} />
              Visible en el sitio
            </label>
          </div>

          <div className="form-group">
            <label>Qué incluye</label>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <input
                value={newItem}
                onChange={e => setNewItem(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addItem(); } }}
                placeholder="Ej: Catan + Exploding Kittens"
              />
              <button type="button" className="btn btn-secondary" onClick={addItem}>+ Agregar</button>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              {form.items.map((item, i) => (
                <li key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f9f6f1", borderRadius: "6px", padding: "0.35rem 0.75rem" }}>
                  <span>{item}</span>
                  <button type="button" style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: "1rem" }} onClick={() => removeItem(i)}>✕</button>
                </li>
              ))}
            </ul>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
            <button className="btn btn-secondary" onClick={() => setEditing(null)} disabled={saving}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2>Combos y promos</h2>
        <button className="btn btn-primary" onClick={openNew}>+ Nuevo combo</button>
      </div>

      {combos.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-soft)" }}>
          <p style={{ fontSize: "2rem" }}>🎁</p>
          <p>No hay combos todavía. ¡Creá el primero!</p>
        </div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Precio</th>
                <th>Items</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {combos.map(c => (
                <tr key={c.id}>
                  <td><strong>{c.title}</strong></td>
                  <td>₡{c.price.toLocaleString("es-CR")}</td>
                  <td>{c.items?.length ?? 0} ítem{(c.items?.length ?? 0) !== 1 ? "s" : ""}</td>
                  <td>
                    <button
                      className={`availability-badge ${c.active ? "available" : "unavailable"}`}
                      style={{ cursor: "pointer", border: "none", background: "none", padding: "2px 8px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 600 }}
                      onClick={() => toggleActive(c)}
                    >
                      {c.active ? "Activo" : "Inactivo"}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: "0.3rem 0.75rem", fontSize: "0.8rem" }}
                        onClick={() => openEdit(c)}
                      >
                        Editar
                      </button>
                      <button
                        style={{ padding: "0.3rem 0.75rem", fontSize: "0.8rem", background: "#dc2626", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}
                        onClick={() => handleDelete(c.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
