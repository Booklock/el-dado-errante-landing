import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";

const EMPTY = { name: "", description: "", price: "", gameIds: [] };

export default function Packs() {
  const [packs,    setPacks]    = useState([]);
  const [allGames, setAllGames] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [form,     setForm]     = useState(null);
  const [saving,   setSaving]   = useState(false);

  const load = useCallback(async () => {
    const [packsRes, gamesRes] = await Promise.all([
      supabase.from("packs").select("*, pack_games(game_id, games(name))").order("name"),
      supabase.from("games").select("id, name, category").order("name"),
    ]);
    setPacks(packsRes.data ?? []);
    setAllGames(gamesRes.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleAvailable(pack) {
    await supabase.from("packs").update({ available: !pack.available }).eq("id", pack.id);
    setPacks(prev => prev.map(p => p.id === pack.id ? { ...p, available: !p.available } : p));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    const payload = { name: form.name, description: form.description, price: parseInt(form.price) };

    let packId = form.id;
    if (packId) {
      await supabase.from("packs").update(payload).eq("id", packId);
      await supabase.from("pack_games").delete().eq("pack_id", packId);
    } else {
      const { data } = await supabase.from("packs").insert(payload).select("id").single();
      packId = data.id;
    }

    if (form.gameIds.length > 0) {
      await supabase.from("pack_games").insert(form.gameIds.map(gid => ({ pack_id: packId, game_id: gid })));
    }

    setSaving(false);
    setForm(null);
    load();
  }

  async function handleDelete(id) {
    if (!confirm("¿Eliminar este pack?")) return;
    await supabase.from("packs").delete().eq("id", id);
    setPacks(prev => prev.filter(p => p.id !== id));
  }

  function toggleGame(gameId) {
    setForm(prev => ({
      ...prev,
      gameIds: prev.gameIds.includes(gameId)
        ? prev.gameIds.filter(id => id !== gameId)
        : [...prev.gameIds, gameId],
    }));
  }

  function openEdit(pack) {
    setForm({
      id: pack.id,
      name: pack.name,
      description: pack.description ?? "",
      price: String(pack.price),
      gameIds: pack.pack_games.map(pg => pg.game_id),
    });
  }

  if (loading) return <div className="admin-page-loading">Cargando...</div>;

  return (
    <div className="admin-page">
      <div className="admin-top-bar">
        <h1 className="admin-page-title" style={{ margin: 0 }}>Packs</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setForm(EMPTY)}>+ Nuevo pack</button>
      </div>

      {form !== null && (
        <div className="admin-form-panel">
          <h3>{form.id ? "Editar pack" : "Nuevo pack"}</h3>
          <form onSubmit={handleSave}>
            <div className="admin-form-row">
              <div className="form-group">
                <label>Nombre del pack *</label>
                <input name="name" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Ej: Pack Fin de Semana" />
              </div>
              <div className="form-group">
                <label>Precio del pack (₡) *</label>
                <input name="price" type="number" required value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="10000" />
              </div>
            </div>
            <div className="form-group">
              <label>Descripción</label>
              <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Ej: Ideal para grupos de 4-8 personas" />
            </div>
            <div className="form-group" style={{ marginTop: "1rem" }}>
              <label>Juegos incluidos en el pack</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.4rem", marginTop: "0.5rem" }}>
                {allGames.map(g => (
                  <label key={g.id} style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", fontSize: "0.85rem" }}>
                    <input
                      type="checkbox"
                      checked={form.gameIds.includes(g.id)}
                      onChange={() => toggleGame(g.id)}
                    />
                    {g.name}
                  </label>
                ))}
              </div>
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
              <th>Pack</th>
              <th>Juegos incluidos</th>
              <th>Precio</th>
              <th>Disponible</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {packs.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--color-text-soft)", padding: "2rem" }}>Sin packs creados aún</td></tr>
            )}
            {packs.map(p => (
              <tr key={p.id}>
                <td>
                  <span style={{ fontWeight: 600 }}>{p.name}</span>
                  {p.description && <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-soft)" }}>{p.description}</p>}
                </td>
                <td>
                  <div className="game-chips">
                    {p.pack_games.map(pg => (
                      <span key={pg.game_id} className="game-chip">{pg.games?.name}</span>
                    ))}
                    {p.pack_games.length === 0 && <span style={{ color: "var(--color-text-soft)", fontSize: "0.8rem" }}>Sin juegos</span>}
                  </div>
                </td>
                <td>₡{p.price.toLocaleString("es-CR")}</td>
                <td>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={p.available} onChange={() => toggleAvailable(p)} />
                    <span className="toggle-slider" />
                  </label>
                </td>
                <td style={{ display: "flex", gap: "0.5rem" }}>
                  <button className="btn-ghost" onClick={() => openEdit(p)}>Editar</button>
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
