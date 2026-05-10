import { useState } from "react";
import { openWhatsApp } from "../constants";

const handleWhatsApp = () => openWhatsApp("Hola, quiero alquilar un juego de mesa");

const CATEGORIES = [
  {
    title: "Party Games",
    description: "Para reír, improvisar y jugar en grupo.",
    games: [
      { name: "Skull King",                 price: "₡4.000", players: "2-6 jugadores", time: "20-30 min", type: "Cartas",     image: null },
      { name: "Taco Cat Goat Cheese Pizza", price: "₡3.000", players: "2-8 jugadores", time: "10 min",    type: "Party",      image: "/images/tacocat.webp" },
      { name: "Codenames",                  price: "₡4.000", players: "4-8 jugadores", time: "15 min",    type: "Party",      image: "/images/codenames.webp" },
      { name: "Chameleon",                  price: "₡4.000", players: "3-8 jugadores", time: "15 min",    type: "Deducción",  image: null },
      { name: "Fantasma Blitz",             price: "₡4.000", players: "2-8 jugadores", time: "5 min",     type: "Velocidad",  image: null },
      { name: "Cockroach Poker",            price: "₡3.000", players: "2-6 jugadores", time: "20 min",    type: "Bluff",      image: null },
      { name: "Joking Hazard",              price: "₡4.000", players: "3-10 jugadores",time: "30 min",    type: "Party",      image: null },
      { name: "Trial by Trolley",           price: "₡4.000", players: "4-13 jugadores",time: "30 min",    type: "Party",      image: null },
      { name: "Fast Food Fear",             price: "₡4.000", players: "2-6 jugadores", time: "20 min",    type: "Party",      image: null },
      { name: "Chao Pescao",               price: "₡4.000", players: "3-7 jugadores", time: "15 min",    type: "Party",      image: "/images/chaopescao.webp" },
      { name: "Hues and Cues",              price: "₡5.000", players: "3-10 jugadores",time: "30 min",    type: "Party",      image: null },
      { name: "The Mind",                   price: "₡3.000", players: "2-4 jugadores", time: "15 min",    type: "Cooperativo",image: null },
      { name: "Sushi Go",                   price: "₡4.000", players: "2-5 jugadores", time: "15 min",    type: "Cartas",     image: null },
    ],
  },
  {
    title: "Para Parejas",
    description: "Ideal para una cita distinta o una noche tranquila.",
    games: [
      { name: "Floristry",      price: "₡4.000", players: "2 jugadores",   time: "30 min",    type: "Cooperativo", image: "/images/floristry.webp" },
      { name: "Coffee Rush",    price: "₡4.000", players: "2-4 jugadores", time: "30 min",    type: "Casual",      image: "/images/coffeerush.webp" },
      { name: "Raptors",        price: "₡5.000", players: "2 jugadores",   time: "30 min",    type: "Estrategia",  image: null },
      { name: "House of Danger",price: "₡5.000", players: "1-6 jugadores", time: "60 min",    type: "Aventura",    image: null },
    ],
  },
  {
    title: "Estrategia",
    description: "Para quienes disfrutan planear cada jugada.",
    games: [
      { name: "Catan",          price: "₡6.000", players: "3-4 jugadores", time: "60-120 min", type: "Estrategia",  image: "/images/catan.webp" },
      { name: "Azul",           price: "₡6.000", players: "2-4 jugadores", time: "30-45 min",  type: "Abstracto",   image: "/images/azul.webp" },
      { name: "Ticket to Ride", price: "₡6.000", players: "2-5 jugadores", time: "45-75 min",  type: "Estrategia",  image: "/images/tickettoride.webp" },
      { name: "Villainous",     price: "₡5.000", players: "2-6 jugadores", time: "50 min",     type: "Competitivo", image: "/images/villainous.webp" },
      { name: "Pandemic",       price: "₡6.000", players: "2-4 jugadores", time: "45-60 min",  type: "Cooperativo", image: null },
      { name: "King of Tokyo",  price: "₡5.000", players: "2-6 jugadores", time: "30 min",     type: "Dados",       image: null },
      { name: "King of New York",price:"₡6.000", players: "2-6 jugadores", time: "40 min",     type: "Dados",       image: null },
      { name: "Kaiju Crush",    price: "₡5.000", players: "2-4 jugadores", time: "30-45 min",  type: "Área",        image: null },
      { name: "The Island",     price: "₡5.000", players: "2-4 jugadores", time: "60 min",     type: "Estrategia",  image: null },
      { name: "Here to Slay",   price: "₡5.000", players: "2-6 jugadores", time: "30-60 min",  type: "Cartas",      image: null },
      { name: "Food Truck Race",price: "₡6.000", players: "2-4 jugadores", time: "45-60 min",  type: "Estrategia",  image: null },
      { name: "Sauros",         price: "₡6.000", players: "2-4 jugadores", time: "45 min",     type: "Estrategia",  image: null },
    ],
  },
];

function Catalog() {
  const [currentIndexes, setCurrentIndexes] = useState(CATEGORIES.map(() => 0));

  const handlePrev = (categoryIndex) => {
    setCurrentIndexes((prev) =>
      prev.map((value, index) => {
        if (index !== categoryIndex) return value;
        const total = CATEGORIES[index].games.length;
        return value === 0 ? total - 1 : value - 1;
      })
    );
  };

  const handleNext = (categoryIndex) => {
    setCurrentIndexes((prev) =>
      prev.map((value, index) => {
        if (index !== categoryIndex) return value;
        const total = CATEGORIES[index].games.length;
        return value === total - 1 ? 0 : value + 1;
      })
    );
  };

  return (
    <section id="catalog" className="catalog-section">
      <div className="container">
        <span className="section-label">Catálogo</span>
        <h2 className="section-title">Encontrá el juego ideal para tu plan</h2>
        <p className="section-description">
          Explorá nuestro catálogo de {CATEGORIES.reduce((sum, c) => sum + c.games.length, 0)} juegos por categoría y encontrá el perfecto para tu grupo.
        </p>

        <div className="catalog-grid">
          {CATEGORIES.map((category, categoryIndex) => {
            const currentGame = category.games[currentIndexes[categoryIndex]];

            return (
              <article key={category.title} className="catalog-card card">
                <h3>{category.title}</h3>
                <p className="catalog-description">{category.description}</p>

                <div className="catalog-carousel">
                  {currentGame.image ? (
                    <img
                      src={currentGame.image}
                      alt={currentGame.name}
                      className="catalog-game-image"
                    />
                  ) : (
                    <div className="catalog-game-placeholder">
                      <span className="catalog-placeholder-icon">🎲</span>
                      <p className="catalog-placeholder-name">{currentGame.name}</p>
                    </div>
                  )}

                  <div className="catalog-carousel-controls">
                    <button className="arrow-btn" aria-label="Juego anterior" onClick={() => handlePrev(categoryIndex)}>❮</button>

                    <div className="catalog-game-info">
                      <span className="catalog-game-name">{currentGame.name}</span>
                      <div className="catalog-tags">
                        <span className="catalog-tag catalog-tag-price">{currentGame.price}</span>
                        <span className="catalog-tag">{currentGame.players}</span>
                        <span className="catalog-tag">{currentGame.time}</span>
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

                <button className="btn btn-primary" onClick={() => handleWhatsApp(category.title)}>
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
