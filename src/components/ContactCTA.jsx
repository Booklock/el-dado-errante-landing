import { openWhatsApp } from "../constants";
import { useInView } from "../hooks/useInView";

const handleWhatsApp = () => openWhatsApp("Hola, quiero alquilar un juego de mesa");

function ContactCTA() {
  const [ref, inView] = useInView({ threshold: 0.2 });

  return (
    <section className="contact-cta-section">
      <div className="container">
        <div
          ref={ref}
          className={`contact-cta card cta-shimmer reveal${inView ? " in-view" : ""}`}
        >
          <span className="section-label">Reservá hoy</span>
          <h2 className="section-title">¿Ya tenés plan para tu próxima noche de juegos?</h2>
          <p className="section-description">
            Escribinos por WhatsApp y te ayudamos a encontrar el juego perfecto según
            tu grupo, ocasión y estilo de juego.
          </p>
          <button className="btn btn-primary" onClick={handleWhatsApp}>
            Reservar por WhatsApp
          </button>
        </div>
      </div>
    </section>
  );
}

export default ContactCTA;
