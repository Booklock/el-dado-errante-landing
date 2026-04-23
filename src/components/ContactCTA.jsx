import { openWhatsApp } from "../constants";
const handleWhatsApp = () => openWhatsApp("Hola, quiero alquilar un juego de mesa");
function ContactCTA() {
  return (
    <section className="contact-cta-section">
      <div className="container">
        <div className="contact-cta card">
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