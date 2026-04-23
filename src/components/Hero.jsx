import logo from "../assets/Rolo.png";
import { openWhatsApp } from "../constants";
const handleWhatsApp = () => openWhatsApp("Hola, quiero alquilar un juego de mesa");

function Hero() {
  return (
    <section className="hero">
      <div className="container hero-content">
        <div className="hero-text">
          <span className="section-label">El Dado Errante</span>

          <h1 className="hero-title">
            Alquilá juegos de mesa para una noche inolvidable
          </h1>

          <p className="hero-description">
            Explorá juegos de estrategia, risas o para una cita
            Reservá fácil por WhatsApp y encontrá el plan perfecto para tu próximo plan.
          </p>

          <div className="hero-actions">
            <button className="btn btn-primary" onClick={handleWhatsApp}>
              Reservar por WhatsApp
            </button>

            <a href="#how-it-works" className="btn btn-secondary">
              Cómo funciona
            </a>
          </div>

          <div className="hero-trust">
            <div className="trust-item">
              <strong>5 días</strong>
              <span>de alquiler</span>
            </div>

            <div className="trust-item">
              <strong>Catálogo</strong>
              <span>por categorías</span>
            </div>

            <div className="trust-item">
              <strong>Reserva fácil</strong>
              <span>por WhatsApp</span>
            </div>
          </div>
        </div>

        <div className="hero-visual card">
          <img src={logo} alt="El Dado Errante" className="hero-logo-large" />
        </div>
      </div>
    </section>
  );
}

export default Hero;