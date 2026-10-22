import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

const STATUS = {
  pending:   { label: "Pendiente",  bg: "#fef3c722", color: "#f59e0b" },
  bought:    { label: "Comprado",   bg: "#d1fae522", color: "#10b981" },
  discarded: { label: "Descartado", bg: "#f3f4f622", color: "#9ca3af" },
};

const EMPTY_VENDOR = { vendor_name: "", price: "", url: "", notes: "" };

export default function BuyList() {
  const [items,     setItems]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState("pending");
  const [editing,   setEditing]   = useState(null); // null | "new" | id (future: edit)
  const [form,      setForm]      = useState({ game_name: "", notes: "" });
  const [vendors,   setVendors]   = useState([]);
  const [newVendor, setNewVendor] = useState(EMPTY_VENDOR);
  const [saving,    setSaving]    = useState(false);
  const [msg,       setMsg]       = useState(null);

  async function load() {
    const [{ data: games }, { data: vendorRows }] = await Promise.all([
      supabase.from("buy_list").select("*").order("created_at", { ascending: false }),
      supabase.from("buy_list_vendors").select("*").order("price"),
    ]);
    setItems((games ?? []).map(g => ({ ...g, vendors: (vendorRows ?? []).filter(v => v.buy_list_id === g.id) })));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setForm({ game_name: "", notes: "" });
    setVendors([]);
    setNewVendor(EMPTY_VENDOR);
    setMsg(null);
    setEditing("new");
  }

  function addVendor() {
    if (!newVendor.vendor_name.trim()) return;
    setVendors(prev => [...prev, { ...newVendor, price: newVendor.price ? parseInt(newVendor.price) : null }]);
    setNewVendor(EMPTY_VENDOR);
  }

  async function handleSave() {
    if (!form.game_name.trim()) { setMsg("El nombre del juego es requerido."); return; }
    setSaving(true);
    const { data: game, error } = await supabase.from("buy_list").insert({
      game_name: form.game_name.trim(),
      notes:     form.notes.trim() || null,
    }).select().single();
    if (error || !game) { setMsg("Error al guardar."); setSaving(false); return; }
    if (vendors.length > 0) {
      await supabase.from("buy_list_vendors").insert(vendors.map(v => ({ ...v, buy_list_id: game.id })));
    }
    await load();
    setEditing(null);
    setSaving(false);
  }

  async function setStatus(id, status) {
    await supabase.from("buy_list").update({ status }).eq("id", id);
    load();
  }

  async function deleteItem(id) {
    if (!confirm("¿Eliminar este juego de la lista?")) return;
    await supabase.from("buy_list").delete().eq("id", id);
    load();
  }

  const filtered = filter === "all" ? items : items.filter(i => i.status === filter);

  if (loading) return <div className="admin-section"><p>Cargando...</p></div>;

  if (editing !== null) {
    return (
      <div className="admin-section">
        <div className="admin-section-header">
          <h2>Agregar juego a la lista</h2>
          <button className="btn btn-secondary" onClick={() => setEditing(null)}>← Volver</button>
        </div>
        <div className="admin-form-card">
          {msg && <p className="form-error" style={{ marginBottom: "1rem" }}>{msg}</p>}
          <div className="form-group">
            <label>Nombre del juego *</label>
            <input value={form.game_name} onChange={e => setForm(p => ({ ...p, game_name: e.target.value }))} placeholder="Ej: Wingspan" />
          </div>
          <div className="form-group">
            <label>Notas</label>
            <textarea rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Por qué lo querés, expansiones, dónde lo viste..." />
          </div>

          <div className="form-group">
            <label>Vendors / Precios</label>
            <div className="buy-vendor-input-row">
              <input placeholder="Tienda / Vendor" value={newVendor.vendor_name} onChange={e => setNewVendor(p => ({ ...p, vendor_name: e.target.value }))} />
              <input type="number" placeholder="₡ Precio" style={{ maxWidth: 120 }} value={newVendor.price} onChange={e => setNewVendor(p => ({ ...p, price: e.target.value }))} />
              <input placeholder="URL (opcional)" value={newVendor.url} onChange={e => setNewVendor(p => ({ ...p, url: e.target.value }))} />
              <button type="button" className="btn btn-secondary" onClick={addVendor}>+ Agregar</button>
            </div>
            {vendors.length > 0 && (
              <div className="buy-vendor-list">
                {vendors.map((v, i) => (
                  <div key={i} className="buy-vendor-item">
                    <strong>{v.vendor_name}</strong>
                    {v.price && <span className="buy-vendor-price">₡{Number(v.price).toLocaleString("es-CR")}</span>}
                    {v.url && <a href={v.url} target="_blank" rel="noopener noreferrer" className="buy-vendor-link">🔗 Ver</a>}
                    <button className="buy-vendor-remove" onClick={() => setVendors(prev => prev.filter((_, idx) => idx !== i))}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

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
        <h2>Lista de compras</h2>
        <button className="btn btn-primary" onClick={openNew}>+ Agregar juego</button>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {["pending", "bought", "discarded", "all"].map(f => (
          <button key={f} className={`filter-chip${filter === f ? " active" : ""}`} onClick={() => setFilter(f)}>
            {f === "all" ? "Todos" : STATUS[f]?.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-soft)" }}>
          <p style={{ fontSize: "2rem" }}>🛒</p>
          <p>{filter === "pending" ? "Lista vacía. ¡Agregá el primer juego!" : "Nada aquí todavía."}</p>
        </div>
      ) : (
        <div className="buy-list-grid">
          {filtered.map(item => {
            const st = STATUS[item.status];
            const bestPrice = item.vendors.filter(v => v.price).map(v => v.price);
            return (
              <div key={item.id} className="buy-list-card card">
                <div className="buy-list-card-header">
                  <div style={{ flex: 1 }}>
                    <h3 className="buy-list-card-name">{item.game_name}</h3>
                    {item.notes && <p className="buy-list-card-notes">{item.notes}</p>}
                  </div>
                  <span className="buy-status-badge" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                </div>

                {item.vendors.length > 0 && (
                  <div className="buy-vendor-list">
                    {item.vendors.map(v => (
                      <div key={v.id} className="buy-vendor-item">
                        <strong>{v.vendor_name}</strong>
                        {v.price && <span className="buy-vendor-price">₡{v.price.toLocaleString("es-CR")}</span>}
                        {v.url && <a href={v.url} target="_blank" rel="noopener noreferrer" className="buy-vendor-link">🔗</a>}
                      </div>
                    ))}
                    {bestPrice.length > 1 && (
                      <p style={{ margin: "0.5rem 0 0", fontSize: "0.8rem", color: "#10b981", fontWeight: 600 }}>
                        💡 Mejor precio: ₡{Math.min(...bestPrice).toLocaleString("es-CR")}
                      </p>
                    )}
                  </div>
                )}

                <div className="buy-list-actions">
                  {item.status === "pending" && <>
                    <button className="btn btn-primary btn-sm" onClick={() => setStatus(item.id, "bought")}>✅ Comprado</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setStatus(item.id, "discarded")}>Descartar</button>
                  </>}
                  {item.status !== "pending" && (
                    <button className="btn btn-secondary btn-sm" onClick={() => setStatus(item.id, "pending")}>↩ Pendiente</button>
                  )}
                  <button className="btn-danger btn-sm" onClick={() => deleteItem(item.id)}>Eliminar</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
