import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useCurrentClient } from "../hooks/useCurrentClient";

const CATEGORY_META = {
  party:      { title: "Party Games",  emoji: "🎉", description: "Para reír, improvisar y jugar en grupo." },
  parejas:    { title: "Para Parejas", emoji: "💑", description: "Ideal para una cita distinta o una noche tranquila." },
  estrategia: { title: "Estrategia",   emoji: "♟️", description: "Para quienes disfrutan planear cada jugada." },
};
const CATEGORY_ORDER = ["party", "parejas", "estrategia"];

function formatPrice(p) { return `₡${p.toLocaleString("es-CR")}`; }

function extractPlayers(str) {
  if (!str) return [1, 99];
  const nums = (str.match(/\d+/g) ?? []).map(Number);
  if (!nums.length) return [1, 99];
  return [Math.min(...nums), Math.max(...nums)];
}

function extractMinutes(str) {
  if (!str) return 0;
  const nums = (str.match(/\d+/g) ?? []).map(Number);
  return nums.length ? Math.max(...nums) : 0;
}

function AvailabilityBadge({ available }) {
  return (
    <span className={`availability-badge ${available ? "available" : "unavailable"}`}>
      {available ? "Disponible" : "Alquilado"}
    </span>
  );
}

function Stars({ value, onChange, readonly = false }) {
  return (
    <span className="star-row">
      {[1, 2, 3, 4, 5].map(n => (
        readonly ? (
          <span key={n} className={`star-icon${n <= value ? " star-filled" : ""}`}>★</span>
        ) : (
          <button key={n} type="button" className={`star-btn${n <= value ? " star-filled" : ""}`}
            onClick={() => onChange?.(n)}>★</button>
        )
      ))}
    </span>
  );
}

function GameModal({ game, onClose, onReserve, currentClient }) {
  const [reviews,     setReviews]     = useState([]);
  const [loadingRevs, setLoadingRevs] = useState(true);
  const [myRating,    setMyRating]    = useState(0);
  const [myComment,   setMyComment]   = useState("");
  const [myReview,    setMyReview]    = useState(null);
  const [submitting,  setSubmitting]  = useState(false);

  useEffect(() => {
    if (!game) return;
    setLoadingRevs(true);
    supabase
      .from("game_reviews")
      .select("id, rating, comment, created_at, client_id, clients(name)")
      .eq("game_id", game.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const list = data ?? [];
        setReviews(list);
        if (currentClient) {
          const mine = list.find(r => r.client_id === currentClient.id);
          if (mine) { setMyReview(mine); setMyRating(mine.rating); setMyComment(mine.comment ?? ""); }
          else { setMyReview(null); setMyRating(0); setMyComment(""); }
        }
        setLoadingRevs(false);
      });
  }, [game?.id, currentClient?.id]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!currentClient || myRating === 0) return;
    setSubmitting(true);
    if (myReview) {
      await supabase.from("game_reviews").update({ rating: myRating, comment: myComment }).eq("id", myReview.id);
    } else {
      await supabase.from("game_reviews").insert({ game_id: game.id, client_id: currentClient.id, rating: myRating, comment: myComment });
    }
    const { data } = await supabase
      .from("game_reviews")
      .select("id, rating, comment, created_at, client_id, clients(name)")
      .eq("game_id", game.id)
      .order("created_at", { ascending: false });
    const list = data ?? [];
    setReviews(list);
    const mine = list.find(r => r.client_id === currentClient.id);
    setMyReview(mine ?? null);
    setSubmitting(false);
  }

  async function handleDelete() {
    if (!myReview || !confirm("¿Eliminar tu reseña?")) return;
    await supabase.from("game_reviews").delete().eq("id", myReview.id);
    setMyReview(null); setMyRating(0); setMyComment("");
    const { data } = await supabase
      .from("game_reviews")
      .select("id, rating, comment, created_at, client_id, clients(name)")
      .eq("game_id", game.id)
      .order("created_at", { ascending: false });
    setReviews(data ?? []);
  }

  if (!game) return null;
  const meta = CATEGORY_META[game.category] ?? {};
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="game-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="game-modal">
        <button className="auth-modal-close" onClick={onClose} aria-label="Cerrar">×</button>

        {/* Game info */}
        <div className="game-modal-body">
          {game.image_url ? (
            <img src={game.image_url} alt={game.name} className="game-modal-img" />
          ) : (
            <div className="game-modal-placeholder"><span>🎲</span></div>
          )}
          <div className="game-modal-info">
            <span className="section-label" style={{ fontSize: "0.75rem" }}>
              {meta.emoji} {meta.title}
            </span>
            <h2 className="game-modal-title">{game.name}</h2>
            <AvailabilityBadge available={game.available} />
            {avgRating && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.5rem" }}>
                <Stars value={Math.round(avgRating)} readonly />
                <span style={{ fontSize: "0.85rem", color: "var(--color-text-soft)" }}>
                  {avgRating} · {reviews.length} reseña{reviews.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}
            <div className="game-modal-tags">
              <span className="catalog-tag catalog-tag-price">{formatPrice(game.price)}<span style={{ fontWeight: 400, fontSize: "0.75rem" }}>/alquiler</span></span>
              <span className="catalog-tag">👥 {game.players}</span>
              <span className="catalog-tag">⏱ {game.duration}</span>
              <span className="catalog-tag">{game.type}</span>
            </div>
            {game.available ? (
              <button className="btn btn-primary" style={{ marginTop: "1rem", width: "100%" }} onClick={onReserve}>
                Reservar este juego
              </button>
            ) : (
              <p style={{ marginTop: "1rem", color: "var(--color-text-soft)", fontSize: "0.875rem" }}>
                Este juego está alquilado. Escribinos por WhatsApp para anotarte en la lista de espera.
              </p>
            )}
          </div>
        </div>

        {/* Reviews */}
        <div className="game-reviews">
          <div className="game-reviews-header">
            <h3 className="game-reviews-title">Reseñas</h3>
            {avgRating && (
              <span className="game-avg-rating">⭐ {avgRating} promedio · {reviews.length} reseña{reviews.length !== 1 ? "s" : ""}</span>
            )}
          </div>

          {currentClient ? (
            <form className="review-form" onSubmit={handleSubmit}>
              <p className="review-form-label">{myReview ? "Tu reseña" : "Dejá tu reseña"}</p>
              <Stars value={myRating} onChange={setMyRating} />
              <textarea
                placeholder="Contá tu experiencia con este juego (opcional)"
                value={myComment}
                onChange={e => setMyComment(e.target.value)}
                rows={2}
              />
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                {myReview && (
                  <button type="button" className="btn-ghost" style={{ fontSize: "0.8rem", color: "#dc2626" }} onClick={handleDelete}>
                    Eliminar
                  </button>
                )}
                <button type="submit" className="btn btn-primary btn-sm" disabled={submitting || myRating === 0}>
                  {submitting ? "Guardando…" : myReview ? "Actualizar" : "Publicar"}
                </button>
              </div>
            </form>
          ) : (
            <p className="review-login-hint">
              <a href="#reservar" onClick={onClose}>Iniciá sesión</a> para dejar una reseña.
            </p>
          )}

          {loadingRevs ? (
            <p style={{ color: "var(--color-text-soft)", fontSize: "0.85rem" }}>Cargando reseñas…</p>
          ) : reviews.length === 0 ? (
            <p style={{ color: "var(--color-text-soft)", fontSize: "0.85rem" }}>Todavía no hay reseñas. ¡Sé el primero!</p>
          ) : (
            <div className="review-list">
              {reviews.map(r => (
                <div key={r.id} className="review-card">
                  <div className="review-card-header">
                    <span className="review-card-name">{r.clients?.name ?? "Cliente"}</span>
                    <span className="review-card-date">{r.created_at?.split("T")[0]}</span>
                  </div>
                  <Stars value={r.rating} readonly />
                  {r.comment && <p className="review-card-comment">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Catalog() {
  const { client: currentClient } = useCurrentClient();
  const [allGames,       setAllGames]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [view,           setView]           = useState("categories");
  const [currentIndexes, setCurrentIndexes] = useState({});
  const [selectedGame,   setSelectedGame]   = useState(null);

  // Shared filters (categories view uses only category + availability)
  const [search,         setSearch]         = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [onlyAvailable,  setOnlyAvailable]  = useState(false);
  const [priceFilter,    setPriceFilter]    = useState("all");
  const [playersFilter,  setPlayersFilter]  = useState("all");
  const [durationFilter, setDurationFilter] = useState("all");
  const [typeFilter,     setTypeFilter]     = useState("all");

  useEffect(() => {
    supabase.from("games").select("*").order("name").then(({ data, error }) => {
      if (error) { setError(error.message); setLoading(false); return; }
      setAllGames(data ?? []);
      setLoading(false);
    });
  }, []);

  const gameTypes = [...new Set(allGames.map(g => g.type).filter(Boolean))].sort();

  function applyFilters(games) {
    return games.filter(g => {
      if (search && !g.name?.toLowerCase().includes(search.toLowerCase())) return false;
      if (categoryFilter !== "all" && g.category !== categoryFilter) return false;
      if (onlyAvailable && !g.available) return false;
      if (priceFilter === "low"  && g.price >= 3000) return false;
      if (priceFilter === "mid"  && (g.price < 3000 || g.price > 5000)) return false;
      if (priceFilter === "high" && g.price <= 5000) return false;
      if (playersFilter !== "all") {
        const [mn, mx] = extractPlayers(g.players);
        const n = parseInt(playersFilter);
        if (mn > n || mx < n) return false;
      }
      if (durationFilter !== "all") {
        const dur = extractMinutes(g.duration);
        if (durationFilter === "short"  && dur >= 30) return false;
        if (durationFilter === "medium" && (dur < 30 || dur > 60)) return false;
        if (durationFilter === "long"   && dur <= 60) return false;
      }
      if (typeFilter !== "all" && g.type !== typeFilter) return false;
      return true;
    });
  }

  const filteredGames = applyFilters(allGames);

  function getCategory(key) {
    const games = allGames.filter(g => g.category === key && (!onlyAvailable || g.available));
    return { key, ...CATEGORY_META[key], games };
  }

  const categories         = CATEGORY_ORDER.map(getCategory).filter(c => c.games.length > 0);
  const filteredCategories = categoryFilter === "all" ? categories : categories.filter(c => c.key === categoryFilter);

  function handlePrev(cat) {
    const len = getCategory(cat).games.length;
    setCurrentIndexes(prev => ({ ...prev, [cat]: ((prev[cat] ?? 0) - 1 + len) % len }));
  }
  function handleNext(cat) {
    const len = getCategory(cat).games.length;
    setCurrentIndexes(prev => ({ ...prev, [cat]: ((prev[cat] ?? 0) + 1) % len }));
  }

  function handleReserve() {
    setSelectedGame(null);
    window.location.hash = "#reservar";
  }

  function resetFilters() {
    setSearch(""); setCategoryFilter("all"); setOnlyAvailable(false);
    setPriceFilter("all"); setPlayersFilter("all"); setDurationFilter("all"); setTypeFilter("all");
  }

  const hasActiveFilters = search || categoryFilter !== "all" || onlyAvailable
    || priceFilter !== "all" || playersFilter !== "all" || durationFilter !== "all" || typeFilter !== "all";

  if (loading) return (
    <section id="catalog" className="catalog-section">
      <div className="container">
        <span className="section-label">Catálogo</span>
        <h2 className="section-title">Encontrá el juego ideal para tu plan</h2>
        <p className="catalog-loading">Cargando juegos...</p>
      </div>
    </section>
  );

  if (error) return (
    <section id="catalog" className="catalog-section">
      <div className="container">
        <span className="section-label">Catálogo</span>
        <h2 className="section-title">Encontrá el juego ideal para tu plan</h2>
        <p className="catalog-error">No se pudo cargar el catálogo. Intentá más tarde.</p>
      </div>
    </section>
  );

  return (
    <section id="catalog" className="catalog-section">
      <div className="container">
        <span className="section-label">Catálogo</span>
        <h2 className="section-title">Encontrá el juego ideal para tu plan</h2>
        <p className="section-description">
          Explorá nuestro catálogo de {allGames.length} juegos y encontrá el perfecto para tu grupo.
        </p>

        {/* View toggle */}
        <div className="catalog-view-toggle">
          <button className={`view-toggle-btn${view === "categories" ? " active" : ""}`}
            onClick={() => setView("categories")}>
            Por categoría
          </button>
          <button className={`view-toggle-btn${view === "all" ? " active" : ""}`}
            onClick={() => setView("all")}>
            Ver todos ({allGames.length})
          </button>
        </div>

        {/* Filters — full panel for grid view, minimal for carousel */}
        {view === "all" ? (
          <div className="catalog-filters-full">
            <input
              className="catalog-search"
              placeholder="🔍  Buscar por nombre..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />

            <div className="filter-row">
              <span className="filter-row-label">Categoría</span>
              {[{ key: "all", label: "Todas" }, ...CATEGORY_ORDER.map(k => ({ key: k, label: CATEGORY_META[k].title }))].map(f => (
                <button key={f.key} className={`filter-chip${categoryFilter === f.key ? " active" : ""}`}
                  onClick={() => setCategoryFilter(f.key)}>{f.label}</button>
              ))}
            </div>

            <div className="filter-row">
              <span className="filter-row-label">Precio</span>
              {[
                { key: "all",  label: "Todos" },
                { key: "low",  label: "< ₡3.000" },
                { key: "mid",  label: "₡3.000–5.000" },
                { key: "high", label: "> ₡5.000" },
              ].map(f => (
                <button key={f.key} className={`filter-chip${priceFilter === f.key ? " active" : ""}`}
                  onClick={() => setPriceFilter(f.key)}>{f.label}</button>
              ))}
            </div>

            <div className="filter-row">
              <span className="filter-row-label">Jugadores</span>
              {[
                { key: "all", label: "Todos" },
                { key: "2",   label: "2" },
                { key: "4",   label: "4" },
                { key: "6",   label: "6+" },
              ].map(f => (
                <button key={f.key} className={`filter-chip${playersFilter === f.key ? " active" : ""}`}
                  onClick={() => setPlayersFilter(f.key)}>{f.label}</button>
              ))}
            </div>

            <div className="filter-row">
              <span className="filter-row-label">Duración</span>
              {[
                { key: "all",    label: "Todas" },
                { key: "short",  label: "< 30 min" },
                { key: "medium", label: "30–60 min" },
                { key: "long",   label: "> 60 min" },
              ].map(f => (
                <button key={f.key} className={`filter-chip${durationFilter === f.key ? " active" : ""}`}
                  onClick={() => setDurationFilter(f.key)}>{f.label}</button>
              ))}
            </div>

            {gameTypes.length > 0 && (
              <div className="filter-row">
                <span className="filter-row-label">Tipo</span>
                <button className={`filter-chip${typeFilter === "all" ? " active" : ""}`}
                  onClick={() => setTypeFilter("all")}>Todos</button>
                {gameTypes.map(t => (
                  <button key={t} className={`filter-chip${typeFilter === t ? " active" : ""}`}
                    onClick={() => setTypeFilter(t)}>{t}</button>
                ))}
              </div>
            )}

            <div className="filter-row" style={{ justifyContent: "space-between" }}>
              <button className={`filter-chip filter-chip-available${onlyAvailable ? " active" : ""}`}
                onClick={() => setOnlyAvailable(p => !p)}>
                {onlyAvailable ? "✅ Solo disponibles" : "Todos los estados"}
              </button>
              {hasActiveFilters && (
                <button className="filter-clear-btn" onClick={resetFilters}>Limpiar filtros</button>
              )}
            </div>
          </div>
        ) : (
          <div className="catalog-filters">
            <div className="catalog-filter-chips">
              {[{ key: "all", label: "Todos" }, ...CATEGORY_ORDER.map(k => ({ key: k, label: CATEGORY_META[k].title }))].map(f => (
                <button key={f.key} className={`filter-chip${categoryFilter === f.key ? " active" : ""}`}
                  onClick={() => setCategoryFilter(f.key)}>{f.label}</button>
              ))}
            </div>
            <button className={`filter-chip filter-chip-available${onlyAvailable ? " active" : ""}`}
              onClick={() => setOnlyAvailable(p => !p)}>
              {onlyAvailable ? "✅ Solo disponibles" : "Todos los estados"}
            </button>
          </div>
        )}

        {/* Content */}
        {view === "categories" ? (
          filteredCategories.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--color-text-soft)", padding: "2rem 0" }}>
              No hay juegos disponibles con ese filtro.
            </p>
          ) : (
            <div className="catalog-grid">
              {filteredCategories.map(category => {
                const idx         = currentIndexes[category.key] ?? 0;
                const currentGame = category.games[idx];
                return (
                  <article key={category.key} className="catalog-card card">
                    <h3>{category.title}</h3>
                    <p className="catalog-description">{category.description}</p>
                    <div className="catalog-carousel">
                      <div className="catalog-image-wrapper" style={{ cursor: "pointer" }}
                        onClick={() => setSelectedGame(currentGame)}>
                        {currentGame.image_url ? (
                          <img src={currentGame.image_url} alt={currentGame.name} className="catalog-game-image" />
                        ) : (
                          <div className="catalog-game-placeholder">
                            <span className="catalog-placeholder-icon">🎲</span>
                            <p className="catalog-placeholder-name">{currentGame.name}</p>
                          </div>
                        )}
                        <AvailabilityBadge available={currentGame.available} />
                      </div>
                      <div className="catalog-carousel-controls">
                        <button className="arrow-btn" aria-label="Juego anterior" onClick={() => handlePrev(category.key)}>❮</button>
                        <div className="catalog-game-info">
                          <button className="catalog-game-name-btn" onClick={() => setSelectedGame(currentGame)}>
                            {currentGame.name}
                          </button>
                          <div className="catalog-tags">
                            <span className="catalog-tag catalog-tag-price">{formatPrice(currentGame.price)}</span>
                            <span className="catalog-tag">{currentGame.players}</span>
                            <span className="catalog-tag">{currentGame.duration}</span>
                            <span className="catalog-tag">{currentGame.type}</span>
                          </div>
                        </div>
                        <button className="arrow-btn" aria-label="Siguiente juego" onClick={() => handleNext(category.key)}>❯</button>
                      </div>
                      <div className="carousel-dots">
                        {category.games.map((_, i) => (
                          <span key={i} className={i === idx ? "dot active" : "dot"} />
                        ))}
                      </div>
                    </div>
                    <button className="btn btn-primary" onClick={() => setSelectedGame(currentGame)}>
                      Ver detalles
                    </button>
                  </article>
                );
              })}
            </div>
          )
        ) : (
          filteredGames.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2.5rem 0", color: "var(--color-text-soft)" }}>
              <p style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🎲</p>
              <p>No hay juegos con esos filtros.</p>
              <button className="btn btn-secondary" style={{ marginTop: "0.75rem" }} onClick={resetFilters}>
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div className="catalog-all-grid">
              {filteredGames.map(g => (
                <button key={g.id} className="catalog-game-card" onClick={() => setSelectedGame(g)}>
                  {g.image_url ? (
                    <img src={g.image_url} alt={g.name} className="catalog-game-card-img" />
                  ) : (
                    <div className="catalog-game-card-placeholder">🎲</div>
                  )}
                  <div className="catalog-game-card-body">
                    <AvailabilityBadge available={g.available} />
                    <p className="catalog-game-card-name">{g.name}</p>
                    <div className="catalog-tags" style={{ marginTop: "0.25rem" }}>
                      <span className="catalog-tag catalog-tag-price">{formatPrice(g.price)}</span>
                      <span className="catalog-tag">👥 {g.players}</span>
                      <span className="catalog-tag">⏱ {g.duration}</span>
                    </div>
                    {g.type && (
                      <span className="catalog-tag" style={{ marginTop: "0.25rem", display: "inline-block" }}>{g.type}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )
        )}
      </div>

      {selectedGame && (
        <GameModal
          game={selectedGame}
          onClose={() => setSelectedGame(null)}
          onReserve={handleReserve}
          currentClient={currentClient}
        />
      )}
    </section>
  );
}
