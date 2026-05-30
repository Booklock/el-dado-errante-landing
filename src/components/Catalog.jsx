import { useState, useEffect } from "react";
import { openWhatsApp } from "../constants";
import { supabase } from "../lib/supabase";

const CATEGORY_META = {
  party:      { title: "Party Games",   description: "Para reír, improvisar y jugar en grupo." },
  parejas:    { title: "Para Parejas",  description: "Ideal para una cita distinta o una noche tranquila." },
  estrategia: { title: "Estrategia",    description: "Para quienes disfrutan planear cada jugada." },
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

function Catalog() {
  const [categories, setCategories] = useState([]);
  const [currentIndexes, setCurrentIndexes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchGames() {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .order("name");

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      const grouped = CATEGORY_ORDER.map((cat) => ({
        key: cat,
        ...CATEGORY_META[cat],
        games: data.filter((g) => g.category === cat),
      })).filter((c) => c.games.length > 0);

      setCategories(grouped);
      setCurrentIndexes(grouped.map(() => 0));
      setLoading(false);
    }

    fetchGames();
  }, []);

  const handlePrev = (categoryIndex) => {
    setCurrentIndexes((prev) =>
      prev.map((value, index) => {
        if (index !== categoryIndex) return value;
        const total = categories[index].games.length;
        return value === 0 ? total - 1 : value - 1;
      })
    );
  };

  const handleNext = (categoryIndex) => {
    setCurrentIndexes((prev) =>
      prev.map((value, index) => {
        if (index !== categoryIndex) return value;
        const total = categories[index].games.length;
        return value === total - 1 ? 0 : value + 1;
      })
    );
  };

  const totalGames = categories.reduce((sum, c) => sum + c.games.length, 0);

  if (loading) {
    return (
      <section id="catalog" className="catalog-section">
        <div className="container">
          <span className="section-label">Catálogo</span>
          <h2 className="section-title">Encontrá el juego ideal para tu plan</h2>
          <p className="catalog-loading">Cargando juegos...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="catalog" className="catalog-section">
        <div className="container">
          <span className="section-label">Catálogo</span>
          <h2 className="section-title">Encontrá el juego ideal para tu plan</h2>
          <p className="catalog-error">No se pudo cargar el catálogo. Intentá más tarde.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="catalog" className="catalog-section">
      <div className="container">
        <span className="section-label">Catálogo</span>
        <h2 className="section-title">Encontrá el juego ideal para tu plan</h2>
        <p className="section-description">
          Explorá nuestro catálogo de {totalGames} juegos por categoría y encontrá el perfecto para tu grupo.
        </p>

        <div className="catalog-grid">
          {categories.map((category, categoryIndex) => {
            const currentGame = category.games[currentIndexes[categoryIndex]];

            return (
              <article key={category.key} className="catalog-card card">
                <h3>{category.title}</h3>
                <p className="catalog-description">{category.description}</p>

                <div className="catalog-carousel">
                  <div className="catalog-image-wrapper">
                    {currentGame.image_url ? (
                      <img
                        src={currentGame.image_url}
                        alt={currentGame.name}
                        className="catalog-game-image"
                      />
                    ) : (
                      <div className="catalog-game-placeholder">
                        <span className="catalog-placeholder-icon">🎲</span>
                        <p className="catalog-placeholder-name">{currentGame.name}</p>
                      </div>
                    )}
                    <AvailabilityBadge available={currentGame.available} />
                  </div>

                  <div className="catalog-carousel-controls">
                    <button className="arrow-btn" aria-label="Juego anterior" onClick={() => handlePrev(categoryIndex)}>❮</button>

                    <div className="catalog-game-info">
                      <span className="catalog-game-name">{currentGame.name}</span>
                      <div className="catalog-tags">
                        <span className="catalog-tag catalog-tag-price">{formatPrice(currentGame.price)}</span>
                        <span className="catalog-tag">{currentGame.players}</span>
                        <span className="catalog-tag">{currentGame.duration}</span>
                        <span className="catalog-tag">{currentGame.type}</span>
                      </div>
                    </div>

                    <button className="arrow-btn" aria-label="Siguiente juego" onClick={() => handleNext(categoryIndex)}>❯</button>
                  </div>

                  <div className="carousel-dots">
                    {category.games.map((_, i) => (
                      <span
                        key={i}
                        className={i === currentIndexes[categoryIndex] ? "dot active" : "dot"}
                      />
                    ))}
                  </div>
                </div>

                <button
                  className="btn btn-primary"
                  onClick={() => openWhatsApp(`Hola, quiero consultar por un juego de la categoría ${category.title}`)}
                >
                  Consultar por WhatsApp
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Catalog;
