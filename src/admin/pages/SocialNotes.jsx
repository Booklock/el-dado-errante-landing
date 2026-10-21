import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";

const EMPTY = { title: "", type: "note", content: "", items: [] };

export default function SocialNotes() {
  const [notes,   setNotes]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState(EMPTY);
  const [newItem, setNewItem] = useState("");
  const [saving,  setSaving]  = useState(false);
  const [filter,  setFilter]  = useState("all");

  const load = useCallback(async () => {
    const { data } = await supabase.from("social_notes").select("*").order("updated_at", { ascending: false });
    setNotes(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openNew() { setForm(EMPTY); setNewItem(""); setEditing("new"); }
  function openEdit(n) { setForm({ ...n, items: n.items ?? [] }); setNewItem(""); setEditing(n.id); }

  function addCheckItem() {
    const t = newItem.trim();
    if (!t) return;
    setForm(prev => ({ ...prev, items: [...(prev.items ?? []), { text: t, done: false }] }));
    setNewItem("");
  }

  async function handleSave() {
    if (!form.title.trim()) return;
    setSaving(true);
    const payload = { title: form.title.trim(), type: form.type, content: form.content?.trim() || null, items: form.items, updated_at: new Date().toISOString() };
    if (editing === "new") await supabase.from("social_notes").insert(payload);
    else await supabase.from("social_notes").update(payload).eq("id", editing);
    await load();
    setEditing(null);
    setSaving(false);
  }

  async function toggleItem(note, idx) {
    const items = (note.items ?? []).map((it, i) => i === idx ? { ...it, done: !it.done } : it);
    await supabase.from("social_notes").update({ items, updated_at: new Date().toISOString() }).eq("id", note.id);
    load();
  }

  async function deleteNote(id) {
    if (!confirm("¿Eliminar esta nota?")) return;
    await supabase.from("social_notes").delete().eq("id", id);
    load();
  }

  const filtered = filter === "all" ? notes : notes.filter(n => n.type === filter);

  if (loading) return <div className="admin-section"><p>Cargando...</p></div>;

  if (editing !== null) {
    return (
      <div className="admin-section">
        <div className="admin-section-header">
          <h2>{editing === "new" ? "Nueva nota" : "Editar nota"}</h2>
          <button className="btn btn-secondary" onClick={() => setEditing(null)}>← Volver</button>
        </div>
        <div className="admin-form-card">
          <div className="form-group">
            <label>Título *</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Ej: Ideas para el post de octubre" />
          </div>
          <div className="form-group">
            <label>Tipo</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button type="button" className={`filter-chip${form.type === "note" ? " active" : ""}`} onClick={() => setForm(p => ({ ...p, type: "note" }))}>📝 Nota libre</button>
              <button type="button" className={`filter-chip${form.type === "checklist" ? " active" : ""}`} onClick={() => setForm(p => ({ ...p, type: "checklist" }))}>✅ Checklist</button>
            </div>
          </div>
          {form.type === "note" ? (
            <div className="form-group">
              <label>Contenido</label>
              <textarea rows={7} value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder="Escribí tu idea..." />
            </div>
          ) : (
            <div className="form-group">
              <label>Tareas</label>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <input value={newItem} onChange={e => setNewItem(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCheckItem(); } }}
                  placeholder="Nueva tarea..." />
                <button type="button" className="btn btn-secondary" onClick={addCheckItem}>+ Agregar</button>
              </div>
              <div className="sn-checklist-edit">
                {(form.items ?? []).map((item, i) => (
                  <div key={i} className="sn-check-item-edit">
                    <input type="checkbox" checked={item.done} onChange={() => setForm(prev => ({ ...prev, items: prev.items.map((it, idx) => idx === i ? { ...it, done: !it.done } : it) }))} />
                    <span style={{ flex: 1, textDecoration: item.done ? "line-through" : "none", color: item.done ? "var(--color-text-soft)" : "inherit" }}>{item.text}</span>
                    <button className="buy-vendor-remove" onClick={() => setForm(prev => ({ ...prev, items: prev.items.filter((_, idx) => idx !== i) }))}>✕</button>
                  </div>
                ))}
                {(form.items ?? []).length === 0 && <p style={{ color: "var(--color-text-soft)", fontSize: "0.85rem" }}>Agregá tareas arriba.</p>}
              </div>
            </div>
          )}
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
            <button className="btn btn-secondary" onClick={() => setEditing(null)} disabled={saving}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2>Notas de redes sociales</h2>
        <button className="btn btn-primary" onClick={openNew}>+ Nueva nota</button>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {[["all","Todas"],["note","📝 Notas"],["checklist","✅ Checklists"]].map(([k,l]) => (
          <button key={k} className={`filter-chip${filter === k ? " active" : ""}`} onClick={() => setFilter(k)}>{l}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-soft)" }}>
          <p style={{ fontSize: "2rem" }}>📝</p>
          <p>No hay notas todavía.</p>
        </div>
      ) : (
        <div className="sn-grid">
          {filtered.map(note => {
            const done = (note.items ?? []).filter(i => i.done).length;
            const total = (note.items ?? []).length;
            return (
              <div key={note.id} className={`sn-card card sn-type-${note.type}`}>
                <div className="sn-card-header">
                  <span className="sn-type-icon">{note.type === "note" ? "📝" : "✅"}</span>
                  <h3 className="sn-card-title">{note.title}</h3>
                  <div style={{ display: "flex", gap: "0.35rem", marginLeft: "auto", flexShrink: 0 }}>
                    <button className="btn btn-secondary" style={{ padding: "0.25rem 0.6rem", fontSize: "0.78rem" }} onClick={() => openEdit(note)}>Editar</button>
                    <button style={{ padding: "0.25rem 0.6rem", fontSize: "0.78rem", background: "none", border: "1px solid #dc2626", color: "#dc2626", borderRadius: "6px", cursor: "pointer" }} onClick={() => deleteNote(note.id)}>✕</button>
                  </div>
                </div>

                {note.type === "note" && note.content && (
                  <p className="sn-card-content">{note.content}</p>
                )}

                {note.type === "checklist" && (
                  <div className="sn-checklist">
                    {(note.items ?? []).length === 0 && <p style={{ color: "var(--color-text-soft)", fontSize: "0.85rem" }}>Sin tareas</p>}
                    {(note.items ?? []).map((item, i) => (
                      <label key={i} className="sn-check-item" onClick={e => { e.preventDefault(); toggleItem(note, i); }}>
                        <input type="checkbox" checked={item.done} readOnly />
                        <span style={{ textDecoration: item.done ? "line-through" : "none", color: item.done ? "var(--color-text-soft)" : "inherit" }}>{item.text}</span>
                      </label>
                    ))}
                    {total > 0 && (
                      <div className="sn-progress">
                        <div className="sn-progress-bar" style={{ width: `${(done / total) * 100}%` }} />
                        <span className="sn-progress-label">{done}/{total}</span>
                      </div>
                    )}
                  </div>
                )}

                <p className="sn-card-date">{note.updated_at?.split("T")[0]}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
