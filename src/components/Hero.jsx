import logo from "../assets/Rolo.webp";
import { openWhatsApp } from "../constants";
const handleWhatsApp = () => openWhatsApp("Hola, quiero alquilar un juego de mesa");

function Hero() {
  return (
    <section className="hero">
      <div className="container hero-content">
        <div className="hero-text">
          <span className="section-label hero-animate hero-delay-0">El Dado Errante</span>

          <h1 className="hero-title hero-animate hero-delay-1">
            Alquilá juegos de mesa para una noche inolvidable
          </h1>

          <p className="hero-description hero-animate hero-delay-2">
            Explorá juegos de estrategia, risas o para una cita.
            Reservá fácil y encontrá el plan perfecto para tu próximo plan.
          </p>

          <div className="hero-actions hero-animate hero-delay-3">
            <a href="#reservar" className="btn btn-primary">
              Reservar ahora
            </a>
            <button className="btn btn-secondary" onClick={handleWhatsApp}>
              WhatsApp
            </button>
          </div>

          <div className="hero-trust hero-animate hero-delay-4">
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
              <span>en minutos</span>
            </div>
          </div>
        </div>

        <div className="hero-visual card hero-animate hero-delay-5">
          <img src={logo} alt="El Dado Errante" className="hero-logo-large hero-logo-float" />
        </div>
      </div>
    </section>
  );
}

export default Hero;
