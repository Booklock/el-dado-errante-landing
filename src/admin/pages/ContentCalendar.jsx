import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import SocialNotesBoard from "./SocialNotes";

const PLATFORMS = [
  { key: "instagram", label: "Instagram",  icon: "📸" },
  { key: "facebook",  label: "Facebook",   icon: "👍" },
  { key: "tiktok",    label: "TikTok",     icon: "🎵" },
  { key: "stories",   label: "Stories",    icon: "⭕" },
  { key: "reels",     label: "Reels",      icon: "🎬" },
  { key: "otro",      label: "Otro",       icon: "📢" },
];

const PLATFORM_MAP = Object.fromEntries(PLATFORMS.map(p => [p.key, p]));
const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function toLocalDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function postStatus(post) {
  const today = toDateStr(new Date());
  if (post.published) return "done";
  if (post.scheduled_date < today) return "late";
  return "pending";
}

const EMPTY_FORM = { title: "", platform: "instagram", content: "", scheduled_date: "" };

export default function ContentCalendar() {
  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-based
  const [posts,   setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null); // null | { mode: "new"|"edit", post?, date? }
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [saving,  setSaving]  = useState(false);
  const [tab,     setTab]     = useState("calendar"); // "calendar" | "ideas"

  const load = useCallback(async () => {
    const from = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const to   = `${year}-${String(month + 1).padStart(2, "0")}-${lastDay}`;
    const { data } = await supabase
      .from("content_calendar")
      .select("*")
      .gte("scheduled_date", from)
      .lte("scheduled_date", to)
      .order("scheduled_date");
    setPosts(data ?? []);
    setLoading(false);
  }, [year, month]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  function openNew(dateStr) {
    setForm({ ...EMPTY_FORM, scheduled_date: dateStr });
    setModal({ mode: "new" });
  }

  function openEdit(post) {
    setForm({ title: post.title, platform: post.platform, content: post.content ?? "", scheduled_date: post.scheduled_date });
    setModal({ mode: "edit", post });
  }

  function closeModal() { setModal(null); setSaving(false); }

  async function handleSave() {
    if (!form.title.trim() || !form.scheduled_date) return;
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      platform: form.platform,
      content: form.content.trim() || null,
      scheduled_date: form.scheduled_date,
      updated_at: new Date().toISOString(),
    };
    if (modal.mode === "new") {
      await supabase.from("content_calendar").insert({ ...payload, published: false });
    } else {
      await supabase.from("content_calendar").update(payload).eq("id", modal.post.id);
    }
    await load();
    closeModal();
  }

  async function markPublished(post) {
    await supabase.from("content_calendar").update({ published: true, published_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", post.id);
    load();
    closeModal();
  }

  async function markUnpublished(post) {
    await supabase.from("content_calendar").update({ published: false, published_at: null, updated_at: new Date().toISOString() }).eq("id", post.id);
    load();
    closeModal();
  }

  async function reschedule(post, newDate) {
    await supabase.from("content_calendar").update({ scheduled_date: newDate, updated_at: new Date().toISOString() }).eq("id", post.id);
    await load();
    // update form date and stay in modal
    setForm(f => ({ ...f, scheduled_date: newDate }));
    setModal(m => ({ ...m, post: { ...m.post, scheduled_date: newDate } }));
  }

  async function deletePost(id) {
    if (!confirm("¿Eliminar este post del calendario?")) return;
    await supabase.from("content_calendar").delete().eq("id", id);
    load();
    closeModal();
  }

  // Build calendar grid
  const firstDay = new Date(year, month, 1);
  // Monday-first: getDay() returns 0=Sun, so we shift
  const startDow = (firstDay.getDay() + 6) % 7; // 0=Mon
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((startDow + daysInMonth) / 7) * 7;

  const cells = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startDow + 1;
    cells.push(dayNum >= 1 && dayNum <= daysInMonth ? dayNum : null);
  }

  const postsByDate = {};
  posts.forEach(p => {
    if (!postsByDate[p.scheduled_date]) postsByDate[p.scheduled_date] = [];
    postsByDate[p.scheduled_date].push(p);
  });

  const todayStr = toDateStr(new Date());

  const STATUS_STYLE = {
    done:    { bg: "#d1fae5", color: "#065f46", border: "#6ee7b7" },
    late:    { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5" },
    pending: { bg: "#f3f4f6", color: "#374151", border: "#d1d5db" },
  };

  if (loading && tab === "calendar") return <div className="admin-section"><p>Cargando...</p></div>;

  return (
    <div className="admin-section">
      {/* Header */}
      <div className="admin-section-header">
        <h2>Publicaciones</h2>
        {tab === "calendar" && (
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <button className="btn btn-secondary" onClick={prevMonth}>‹</button>
            <span style={{ fontWeight: 700, minWidth: "11rem", textAlign: "center" }}>{MONTHS[month]} {year}</span>
            <button className="btn btn-secondary" onClick={nextMonth}>›</button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.35rem", marginBottom: "1.25rem" }}>
        <button className={`filter-chip${tab === "calendar" ? " active" : ""}`} onClick={() => setTab("calendar")}>📅 Calendario</button>
        <button className={`filter-chip${tab === "ideas" ? " active" : ""}`} onClick={() => setTab("ideas")}>💡 Ideas</button>
      </div>

      {tab === "ideas" && <SocialNotesBoard />}

      {tab === "calendar" && <>
      {/* Legend */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap", fontSize: "0.8rem" }}>
        {[["done","✅ Publicado"],["late","⚠️ Atrasado"],["pending","🕐 Pendiente"]].map(([s,l]) => (
          <span key={s} style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: STATUS_STYLE[s].bg, border: `1px solid ${STATUS_STYLE[s].border}`, display: "inline-block" }} />
            {l}
          </span>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="cal-grid">
        {DAYS.map(d => <div key={d} className="cal-day-header">{d}</div>)}
        {cells.map((dayNum, i) => {
          if (!dayNum) return <div key={i} className="cal-cell cal-cell-empty" />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
          const dayPosts = postsByDate[dateStr] ?? [];
          const isToday = dateStr === todayStr;
          return (
            <div
              key={i}
              className={`cal-cell${isToday ? " cal-cell-today" : ""}`}
              onClick={() => openNew(dateStr)}
            >
              <span className={`cal-day-num${isToday ? " cal-day-today" : ""}`}>{dayNum}</span>
              <div className="cal-posts">
                {dayPosts.map(post => {
                  const st = postStatus(post);
                  const pl = PLATFORM_MAP[post.platform] ?? PLATFORM_MAP.otro;
                  return (
                    <div
                      key={post.id}
                      className="cal-post-chip"
                      style={{ background: STATUS_STYLE[st].bg, color: STATUS_STYLE[st].color, borderColor: STATUS_STYLE[st].border }}
                      onClick={e => { e.stopPropagation(); openEdit(post); }}
                      title={post.title}
                    >
                      <span>{pl.icon}</span>
                      <span className="cal-post-chip-title">{post.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modal && (
        <div className="raffle-overlay" onClick={closeModal}>
          <div className="cal-modal" onClick={e => e.stopPropagation()}>
            <div className="cal-modal-header">
              <h3 style={{ margin: 0 }}>{modal.mode === "new" ? "Nuevo post" : "Editar post"}</h3>
              <button className="buy-vendor-remove" style={{ fontSize: "1.1rem" }} onClick={closeModal}>✕</button>
            </div>

            {/* Status badge for edit */}
            {modal.mode === "edit" && (() => {
              const st = postStatus(modal.post);
              const styles = STATUS_STYLE[st];
              const labels = { done: "✅ Publicado", late: "⚠️ Atrasado", pending: "🕐 Pendiente" };
              return (
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                  <span style={{ background: styles.bg, color: styles.color, border: `1px solid ${styles.border}`, borderRadius: 999, padding: "0.2rem 0.7rem", fontSize: "0.8rem", fontWeight: 700 }}>
                    {labels[st]}
                  </span>
                  {st === "late" && (
                    <span style={{ fontSize: "0.8rem", color: "#dc2626" }}>
                      Programado: {modal.post.scheduled_date}
                    </span>
                  )}
                </div>
              );
            })()}

            <div className="form-group">
              <label>Título *</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Ej: Post de lunes — juego de la semana" />
            </div>

            <div className="form-group">
              <label>Plataforma</label>
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                {PLATFORMS.map(pl => (
                  <button key={pl.key} type="button"
                    className={`filter-chip${form.platform === pl.key ? " active" : ""}`}
                    onClick={() => setForm(p => ({ ...p, platform: pl.key }))}
                  >
                    {pl.icon} {pl.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Fecha{modal.mode === "edit" && postStatus(modal.post) === "late" ? " (reagendar)" : ""}</label>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <input type="date" value={form.scheduled_date} onChange={e => setForm(p => ({ ...p, scheduled_date: e.target.value }))} />
                {modal.mode === "edit" && form.scheduled_date !== modal.post.scheduled_date && (
                  <button className="btn btn-secondary" style={{ fontSize: "0.8rem", padding: "0.35rem 0.7rem", whiteSpace: "nowrap" }}
                    onClick={() => reschedule(modal.post, form.scheduled_date)}>
                    Reagendar
                  </button>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Notas / Contenido</label>
              <textarea rows={3} value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder="Ideas, caption, hashtags..." />
            </div>

            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "space-between", marginTop: "1.25rem", flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {modal.mode === "edit" && !modal.post.published && (
                  <button className="btn btn-primary" onClick={() => markPublished(modal.post)}>✅ Marcar publicado</button>
                )}
                {modal.mode === "edit" && modal.post.published && (
                  <button className="btn btn-secondary" onClick={() => markUnpublished(modal.post)}>↩ Desmarcar</button>
                )}
                {modal.mode === "edit" && (
                  <button className="btn-danger btn-sm" onClick={() => deletePost(modal.post.id)}>Eliminar</button>
                )}
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button className="btn btn-secondary" onClick={closeModal} disabled={saving}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </>}
    </div>
  );
}
