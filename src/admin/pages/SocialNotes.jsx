import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";

const COLUMNS = [
  { key: "recurring", label: "Publicaciones recurrentes", icon: "🔁" },
  { key: "video",     label: "Ideas de video",            icon: "🎬" },
  { key: "image",     label: "Ideas de imagen",           icon: "🖼️" },
];

const EMPTY = { title: "", type: "note", content: "", items: [], category: "recurring" };

function NoteModal({ note, onClose, onSaved, onDeleted }) {
  const isNew = !note.id;
  const [form, setForm] = useState({ ...note });
  const [newItem, setNewItem] = useState("");
  const [saving, setSaving] = useState(false);

  function addItem() {
    const t = newItem.trim();
    if (!t) return;
    setForm(p => ({ ...p, items: [...(p.items ?? []), { text: t, done: false }] }));
    setNewItem("");
  }

  async function handleSave() {
    if (!form.title.trim()) return;
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      type: form.type,
      content: form.content?.trim() || null,
      items: form.items ?? [],
      category: form.category,
      updated_at: new Date().toISOString(),
    };
    if (isNew) {
      await supabase.from("social_notes").insert(payload);
    } else {
      await supabase.from("social_notes").update(payload).eq("id", note.id);
    }
    setSaving(false);
    onSaved();
  }

  async function handleDelete() {
    if (!confirm("¿Eliminar esta nota?")) return;
    await supabase.from("social_notes").delete().eq("id", note.id);
    onDeleted();
  }

  return (
    <div className="raffle-overlay" onClick={onClose}>
      <div className="cal-modal" onClick={e => e.stopPropagation()}>
        <div className="cal-modal-header">
          <h3 style={{ margin: 0 }}>{isNew ? "Nueva idea" : "Editar idea"}</h3>
          <button className="buy-vendor-remove" style={{ fontSize: "1.1rem" }} onClick={onClose}>✕</button>
        </div>

        <div className="form-group">
          <label>Título *</label>
          <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Ej: Reseña del juego de la semana" />
        </div>

        <div className="form-group">
          <label>Columna</label>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {COLUMNS.map(c => (
              <button key={c.key} type="button"
                className={`filter-chip${form.category === c.key ? " active" : ""}`}
                onClick={() => setForm(p => ({ ...p, category: c.key }))}
              >
                {c.icon} {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Tipo</label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="button" className={`filter-chip${form.type === "note" ? " active" : ""}`} onClick={() => setForm(p => ({ ...p, type: "note" }))}>📝 Nota</button>
            <button type="button" className={`filter-chip${form.type === "checklist" ? " active" : ""}`} onClick={() => setForm(p => ({ ...p, type: "checklist" }))}>✅ Checklist</button>
          </div>
        </div>

        {form.type === "note" ? (
          <div className="form-group">
            <label>Contenido</label>
            <textarea rows={4} value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder="Descripción, referencias, guión..." />
          </div>
        ) : (
          <div className="form-group">
            <label>Pasos / items</label>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <input value={newItem} onChange={e => setNewItem(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addItem(); }}}
                placeholder="Agregar item..." />
              <button type="button" className="btn btn-secondary" onClick={addItem}>+</button>
            </div>
            <div className="sn-checklist-edit">
              {(form.items ?? []).map((item, i) => (
                <div key={i} className="sn-check-item-edit">
                  <input type="checkbox" checked={item.done} onChange={() => setForm(p => ({ ...p, items: p.items.map((it, idx) => idx === i ? { ...it, done: !it.done } : it) }))} />
                  <span style={{ flex: 1, textDecoration: item.done ? "line-through" : "none", color: item.done ? "var(--color-text-soft)" : "inherit" }}>{item.text}</span>
                  <button className="buy-vendor-remove" onClick={() => setForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }))}>✕</button>
                </div>
              ))}
              {(form.items ?? []).length === 0 && <p style={{ color: "var(--color-text-soft)", fontSize: "0.85rem" }}>Sin items todavía.</p>}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "space-between", marginTop: "1.25rem" }}>
          <div>
            {!isNew && <button className="btn-danger btn-sm" onClick={handleDelete}>Eliminar</button>}
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SocialNotesBoard() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | note object (with id=undefined for new)

  const load = useCallback(async () => {
    const { data } = await supabase.from("social_notes").select("*").order("updated_at", { ascending: false });
    setNotes(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleItem(note, idx) {
    const items = (note.items ?? []).map((it, i) => i === idx ? { ...it, done: !it.done } : it);
    await supabase.from("social_notes").update({ items, updated_at: new Date().toISOString() }).eq("id", note.id);
    load();
  }

  function openNew(category) {
    setModal({ ...EMPTY, category });
  }

  if (loading) return <p style={{ color: "var(--color-text-soft)" }}>Cargando...</p>;

  return (
    <>
      {modal && (
        <NoteModal
          note={modal}
          onClose={() => setModal(null)}
          onSaved={() => { load(); setModal(null); }}
          onDeleted={() => { load(); setModal(null); }}
        />
      )}

      <div className="sn-board">
        {COLUMNS.map(col => {
          const colNotes = notes.filter(n => n.category === col.key);
          return (
            <div key={col.key} className="sn-board-col">
              <div className="sn-board-col-header">
                <span>{col.icon}</span>
                <span>{col.label}</span>
                <span className="sn-board-count">{colNotes.length}</span>
                <button className="sn-board-add" onClick={() => openNew(col.key)} title="Agregar idea">+</button>
              </div>

              <div className="sn-board-cards">
                {colNotes.length === 0 && (
                  <div className="sn-board-empty" onClick={() => openNew(col.key)}>
                    <span>+ Agregar idea</span>
                  </div>
                )}
                {colNotes.map(note => {
                  const done  = (note.items ?? []).filter(i => i.done).length;
                  const total = (note.items ?? []).length;
                  return (
                    <div key={note.id} className="sn-board-card card" onClick={() => setModal(note)}>
                      <div style={{ display: "flex", gap: "0.4rem", alignItems: "flex-start" }}>
                        <span style={{ fontSize: "0.85rem" }}>{note.type === "checklist" ? "✅" : "📝"}</span>
                        <p className="sn-board-card-title">{note.title}</p>
                      </div>

                      {note.type === "note" && note.content && (
                        <p className="sn-board-card-content">{note.content}</p>
                      )}

                      {note.type === "checklist" && (
                        <div className="sn-checklist" onClick={e => e.stopPropagation()}>
                          {(note.items ?? []).slice(0, 4).map((item, i) => (
                            <label key={i} className="sn-check-item" onClick={e => { e.preventDefault(); toggleItem(note, i); }}>
                              <input type="checkbox" checked={item.done} readOnly />
                              <span style={{ textDecoration: item.done ? "line-through" : "none", color: item.done ? "var(--color-text-soft)" : "inherit", fontSize: "0.82rem" }}>{item.text}</span>
                            </label>
                          ))}
                          {total > 4 && <p style={{ fontSize: "0.75rem", color: "var(--color-text-soft)", margin: "0.25rem 0 0" }}>+{total - 4} más...</p>}
                          {total > 0 && (
                            <div className="sn-progress" style={{ marginTop: "0.5rem" }}>
                              <div className="sn-progress-bar" style={{ width: `${(done / total) * 100}%` }} />
                              <span className="sn-progress-label">{done}/{total}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <p className="sn-card-date" style={{ marginTop: "auto", paddingTop: "0.4rem" }}>{note.updated_at?.split("T")[0]}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
