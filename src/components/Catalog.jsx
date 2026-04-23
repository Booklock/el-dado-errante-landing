import { useState } from "react";
import { openWhatsApp } from "../constants";
const handleWhatsApp = () => openWhatsApp("Hola, quiero alquilar un juego de mesa");

function Catalog() {
  const categoriesData = [
    {
      title: "Party Games",
      description: "Para reír, improvisar y jugar en grupo.",
      games: [
        {
          name: "Codenames",
          image: "/images/codenames.jpg",
          players: "4-8 jugadores",
          time: "15 min",
          type: "Party",
        },
        {
          name: "Chao Pescao",
          image: "/images/chaopescao.jpg",
          players: "4-8 jugadores",
          time: "15 min",
          type: "Party",
        },
        {
          name: "Taco Cat Goat Cheese Pizza",
          image: "/images/tacocat.jpg",
          players: "4-8 jugadores",
          time: "15 min",
          type: "Party",
        },
      ],
    },
    {
      title: "Para Parejas",
      description: "Ideal para una cita distinta.",
      games: [
        {
          name: "Floristry",
          image: "/images/floristry.jpg",
          players: "2 jugadores",
          time: "20 min",
          type: "Parejas",
        },
        {
          name: "Coffee Rush",
          image: "/images/coffeerush.jpg",
          players: "2-4 jugadores",
          time: "30 min",
          type: "Casual",
        },
        {
          name: "Villainous",
          image: "/images/villainous.jpg",
          players: "2-6 jugadores",
          time: "50 min",
          type: "Competitivo",
        },
      ],
    },
    {
      title: "Estrategia",
      description: "Para quienes disfrutan planear cada jugada.",
      games: [
        {
          name: "Catan",
          image: "/images/catan.jpg",
          players: "3-4 jugadores",
          time: "60 min",
          type: "Estrategia",
        },
        {
          name: "Azul",
          image: "/images/azul.jpg",
          players: "2-4 jugadores",
          time: "30-45 min",
          type: "Abstracto",
        },
        {
          name: "Ticket to Ride",
          image: "/images/tickettoride.jpg",
          players: "2-5 jugadores",
          time: "45 min",
          type: "Estrategia",
        },
      ],
    },
  ];

  const [currentIndexes, setCurrentIndexes] = useState(
    categoriesData.map(() => 0)
  );

  const handlePrev = (categoryIndex) => {
    setCurrentIndexes((prev) =>
      prev.map((value, index) => {
        if (index !== categoryIndex) return value;

        const totalGames = categoriesData[index].games.length;
        return value === 0 ? totalGames - 1 : value - 1;
      })
    );
  };

  const handleNext = (categoryIndex) => {
    setCurrentIndexes((prev) =>
      prev.map((value, index) => {
        if (index !== categoryIndex) return value;

        const totalGames = categoriesData[index].games.length;
        return value === totalGames - 1 ? 0 : value + 1;
      })
    );
  };

  return (
    <section id="catalog" className="catalog-section">
      <div className="container">
        <span className="section-label">Catálogo</span>
        <h2 className="section-title">Encontrá el juego ideal para tu plan</h2>
        <p className="section-description">
          Explorá algunas opciones por categoría. Tenemos más juegos disponibles,
          así que escribinos para encontrar el perfecto para tu grupo.
        </p>

        <div className="catalog-grid">
          {categoriesData.map((category, categoryIndex) => {
            const currentGame = category.games[currentIndexes[categoryIndex]];

            return (
              <article key={category.title} className="catalog-card card">
                <h3>{category.title}</h3>
                <p className="catalog-description">{category.description}</p>

                <div className="catalog-carousel">
                  <img
                    src={currentGame.image}
                    alt={currentGame.name}
                    className="catalog-game-image"
                  />

                  <div className="catalog-carousel-controls">
                    <button
                      className="arrow-btn"
                      onClick={() => handlePrev(categoryIndex)}
                    >
                      ❮
                    </button>

                    <div className="catalog-game-info">
                      <span className="catalog-game-name">
                        {currentGame.name}
                      </span>

                      <div className="catalog-tags">
                        <span className="catalog-tag">
                          {currentGame.players}
                        </span>
                        <span className="catalog-tag">{currentGame.time}</span>
                        <span className="catalog-tag">{currentGame.type}</span>
                      </div>
                    </div>

                    <button
                      className="arrow-btn"
                      onClick={() => handleNext(categoryIndex)}
                    >
                      ❯
                    </button>
                  </div>
                </div>

                <p className="catalog-more-games">
                  Y muchos más juegos disponibles. Consultanos para ver más
                  opciones.
                </p>

                <button
                  className="btn btn-primary"
                  onClick={() => handleWhatsApp(category.title)}
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