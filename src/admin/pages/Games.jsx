import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../lib/supabase";

const CATEGORIES = ["party", "parejas", "estrategia"];
const EMPTY = { name: "", category: "party", price: "", players: "", duration: "", type: "", image_url: "" };
const BUCKET = "game-images";

function ImageUploader({ imageUrl, onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState("");
  const inputRef = useRef();

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Solo se aceptan imágenes."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("La imagen debe pesar menos de 5 MB."); return; }

    setUploading(true);
    setError("");

    const ext      = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, file, { upsert: false, contentType: file.type });

    if (uploadErr) {
      setError("Error al subir. Verificá que el bucket 'game-images' existe y es público.");
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
    onUploaded(publicUrl);
    setUploading(false);
  }

  return (
    <div className="image-uploader">
      {imageUrl && (
        <div className="image-preview-wrapper">
          <img src={imageUrl} alt="preview" className="image-preview" />
          <button type="button" className="image-remove-btn" title="Quitar imagen"
            onClick={() => onUploaded("")}>✕</button>
        </div>
      )}
      <div className="image-upload-controls">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFile}
        />
        <button type="button" className="btn btn-secondary btn-sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}>
          {uploading ? "Subiendo…" : imageUrl ? "Cambiar imagen" : "📷 Subir imagen"}
        </button>
        <span style={{ fontSize: "0.75rem", color: "var(--color-text-soft)" }}>
          JPG, PNG o WebP · máx 5 MB
        </span>
      </div>
      {error && <p className="form-error" style={{ marginTop: "0.4rem" }}>{error}</p>}
    </div>
  );
}

export default function Games() {
  const [games,   setGames]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [form,    setForm]    = useState(null);
  const [saving,  setSaving]  = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("games").select("*").order("category").order("name");
    setGames(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleAvailable(game) {
    await supabase.from("games").update({ available: !game.available }).eq("id", game.id);
    setGames(prev => prev.map(g => g.id === game.id ? { ...g, available: !g.available } : g));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, price: parseInt(form.price) };
    delete payload.id;

    if (form.id) {
      await supabase.from("games").update(payload).eq("id", form.id);
    } else {
      await supabase.from("games").insert(payload);
    }
    setSaving(false);
    setForm(null);
    load();
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleDelete(id) {
    if (!confirm("¿Eliminar este juego?")) return;
    await supabase.from("games").delete().eq("id", id);
    setGames(prev => prev.filter(g => g.id !== id));
  }

  if (loading) return <div className="admin-page-loading">Cargando...</div>;

  return (
    <div className="admin-page">
      <div className="admin-top-bar">
        <h1 className="admin-page-title" style={{ margin: 0 }}>Juegos</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setForm(EMPTY)}>+ Agregar juego</button>
      </div>

      {form !== null && (
        <div className="admin-form-panel">
          <h3>{form.id ? "Editar juego" : "Nuevo juego"}</h3>
          <form onSubmit={handleSave}>
            <div className="admin-form-row">
              <div className="form-group">
                <label>Nombre *</label>
                <input name="name" required value={form.name} onChange={handleChange} placeholder="Ej: Catan" />
              </div>
              <div className="form-group">
                <label>Categoría *</label>
                <select name="category" value={form.category} onChange={handleChange}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="admin-form-row-3">
              <div className="form-group">
                <label>Precio (₡) *</label>
                <input name="price" type="number" required value={form.price} onChange={handleChange} placeholder="4000" />
              </div>
              <div className="form-group">
                <label>Jugadores *</label>
                <input name="players" required value={form.players} onChange={handleChange} placeholder="2-6 jugadores" />
              </div>
              <div className="form-group">
                <label>Duración *</label>
                <input name="duration" required value={form.duration} onChange={handleChange} placeholder="30 min" />
              </div>
            </div>
            <div className="form-group">
              <label>Tipo *</label>
              <input name="type" required value={form.type} onChange={handleChange} placeholder="Estrategia, Party, Cooperativo, etc." />
            </div>

            <div className="form-group">
              <label>Imagen</label>
              <ImageUploader
                imageUrl={form.image_url}
                onUploaded={url => setForm(prev => ({ ...prev, image_url: url }))}
              />
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
              <th>Juego</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Jugadores</th>
              <th>Disponible</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {games.map(g => (
              <tr key={g.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    {g.image_url ? (
                      <img src={g.image_url} alt={g.name}
                        style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover", border: "1px solid var(--color-border)", flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 36, height: 36, borderRadius: 6, background: "var(--color-surface)", border: "1px dashed var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", flexShrink: 0 }}>🎲</div>
                    )}
                    <span style={{ fontWeight: 600 }}>{g.name}</span>
                  </div>
                </td>
                <td><span className="cat-badge">{g.category}</span></td>
                <td>₡{g.price.toLocaleString("es-CR")}</td>
                <td style={{ fontSize: "0.85rem", color: "var(--color-text-soft)" }}>{g.players}</td>
                <td>
                  <label className="toggle-switch" title={g.available ? "Marcar como alquilado" : "Marcar como disponible"}>
                    <input type="checkbox" checked={g.available} onChange={() => toggleAvailable(g)} />
                    <span className="toggle-slider" />
                  </label>
                </td>
                <td style={{ display: "flex", gap: "0.5rem" }}>
                  <button className="btn-ghost" onClick={() => setForm(g)}>Editar</button>
                  <button className="btn-danger" onClick={() => handleDelete(g.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
