import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const CATEGORY_META = {
  party:      { title: "Party Games",  emoji: "🎉", description: "Para reír, improvisar y jugar en grupo." },
  parejas:    { title: "Para Parejas", emoji: "💑", description: "Ideal para una cita distinta o una noche tranquila." },
  estrategia: { title: "Estrategia",   emoji: "♟️", description: "Para quienes disfrutan planear cada jugada." },
};

const CATEGORY_ORDER = ["party", "parejas", "estrategia"];

function formatPrice(price) {
  return `₡${price.toLocaleString("es-CR")}`;
}

function AvailabilityBadge({ available }) {
  return (
    <span className={`availability-badge ${available ? "available" : "unavailable"}`}>
      {available ? "Disponible" : "Alquilado"}
    </span>
  );
}

function GameModal({ game, onClose, onReserve }) {
  if (!game) return null;
  const meta = CATEGORY_META[game.category] ?? {};
  return (
    <div className="game-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="game-modal">
        <button className="auth-modal-close" onClick={onClose} aria-label="Cerrar">×</button>
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
      </div>
    </div>
  );
}

export default function Catalog() {
  const [allGames,        setAllGames]        = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);
  const [categoryFilter,  setCategoryFilter]  = useState("all");
  const [onlyAvailable,   setOnlyAvailable]   = useState(false);
  const [currentIndexes,  setCurrentIndexes]  = useState({});
  const [selectedGame,    setSelectedGame]    = useState(null);

  useEffect(() => {
    supabase.from("games").select("*").order("name").then(({ data, error }) => {
      if (error) { setError(error.message); setLoading(false); return; }
      setAllGames(data ?? []);
      setLoading(false);
    });
  }, []);

  function handlePrev(cat) {
    const games = getCategory(cat).games;
    setCurrentIndexes(prev => {
      const cur = prev[cat] ?? 0;
      return { ...prev, [cat]: cur === 0 ? games.length - 1 : cur - 1 };
    });
  }

  function handleNext(cat) {
    const games = getCategory(cat).games;
    setCurrentIndexes(prev => {
      const cur = prev[cat] ?? 0;
      return { ...prev, [cat]: cur === games.length - 1 ? 0 : cur + 1 };
    });
  }

  function getCategory(key) {
    const games = allGames.filter(g => g.category === key && (!onlyAvailable || g.available));
    return { key, ...CATEGORY_META[key], games };
  }

  const categories = CATEGORY_ORDER.map(getCategory).filter(c => c.games.length > 0);
  const filtered   = categoryFilter === "all" ? categories : categories.filter(c => c.key === categoryFilter);

  function handleReserve() {
    setSelectedGame(null);
    window.location.hash = "#reservar";
  }

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

        {/* Filtros */}
        <div className="catalog-filters">
          <div className="catalog-filter-chips">
            {[{ key: "all", label: "Todos" }, ...CATEGORY_ORDER.map(k => ({ key: k, label: CATEGORY_META[k].title }))].map(f => (
              <button
                key={f.key}
                className={`filter-chip${categoryFilter === f.key ? " active" : ""}`}
                onClick={() => setCategoryFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button
            className={`filter-chip filter-chip-available${onlyAvailable ? " active" : ""}`}
            onClick={() => setOnlyAvailable(p => !p)}
          >
            {onlyAvailable ? "✅ Solo disponibles" : "Todos los estados"}
          </button>
        </div>

        {filtered.length === 0 ? (
          <p style={{ textAlign: "center", color: "var(--color-text-soft)", padding: "2rem 0" }}>
            No hay juegos disponibles con ese filtro.
          </p>
        ) : (
          <div className="catalog-grid">
            {filtered.map(category => {
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
        )}
      </div>

      {selectedGame && (
        <GameModal
          game={selectedGame}
          onClose={() => setSelectedGame(null)}
          onReserve={handleReserve}
        />
      )}
    </section>
  );
}
